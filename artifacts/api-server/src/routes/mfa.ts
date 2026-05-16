/**
 * MFA (Multi-Factor Authentication) routes
 * POST /api/mfa/setup         — begin TOTP setup, returns secret + QR URI
 * POST /api/mfa/enable        — verify first TOTP code to activate MFA
 * POST /api/mfa/disable       — disable MFA (requires TOTP verification)
 * GET  /api/mfa/status        — get current MFA status for the authenticated user
 * POST /api/mfa/backup-codes  — regenerate backup codes (requires TOTP)
 * POST /api/auth/mfa/verify   — complete login when MFA is enabled (challenge flow)
 */

import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { db } from "@workspace/db";
import { usersTable, mfaSecretsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { createSession, logSecurityEvent, generateToken } from "../lib/session-store.js";
import { requireAuth } from "../lib/require-auth";
import {
  setupMfa,
  enableMfa,
  disableMfa,
  getMfaStatus,
  verifyMfaCode,
  generateBackupCodes,
  buildTotpUri,
  createMfaChallenge,
  consumeMfaChallenge,
} from "../lib/mfa.js";
import { auditLogsTable } from "@workspace/db";

const router: IRouter = Router();

function getClientIp(req: any): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}


// GET /api/mfa/status
router.get("/mfa/status", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const status = await getMfaStatus(userId);
  res.json(status);
});

// POST /api/mfa/setup — generate a new TOTP secret and QR code URI
router.post("/mfa/setup", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const { secret, backupCodes } = await setupMfa(userId);
  const uri = buildTotpUri(secret, user.email, "PacketPath | Occu-Med");

  await logSecurityEvent({
    eventType: "admin_action",
    userId,
    email: user.email,
    ip: getClientIp(req),
    userAgent: req.headers["user-agent"],
    details: "MFA setup initiated",
    severity: "info",
  });

  res.json({ secret, uri, backupCodes });
});

// POST /api/mfa/enable — confirm TOTP code to activate MFA
router.post("/mfa/enable", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const parsed = z.object({ code: z.string().min(6).max(6) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid TOTP code format" }); return; }

  const ok = await enableMfa(userId, parsed.data.code);
  if (!ok) { res.status(400).json({ error: "Invalid TOTP code. Please check your authenticator app." }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  await logSecurityEvent({
    eventType: "admin_action",
    userId,
    email: user?.email,
    ip: getClientIp(req),
    userAgent: req.headers["user-agent"],
    details: "MFA enabled successfully",
    severity: "info",
  });

  res.json({ message: "MFA enabled successfully" });
});

// POST /api/mfa/disable
router.post("/mfa/disable", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const parsed = z.object({ code: z.string().min(6) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "TOTP code required" }); return; }

  const valid = await verifyMfaCode(userId, parsed.data.code);
  if (!valid) { res.status(400).json({ error: "Invalid TOTP code" }); return; }

  await disableMfa(userId);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  await logSecurityEvent({
    eventType: "admin_action",
    userId,
    email: user?.email,
    ip: getClientIp(req),
    userAgent: req.headers["user-agent"],
    details: "MFA disabled",
    severity: "warn",
  });

  res.json({ message: "MFA disabled" });
});

// POST /api/mfa/backup-codes — regenerate backup codes
router.post("/mfa/backup-codes", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const parsed = z.object({ code: z.string().min(6) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "TOTP code required" }); return; }

  const valid = await verifyMfaCode(userId, parsed.data.code);
  if (!valid) { res.status(400).json({ error: "Invalid TOTP code" }); return; }

  const codes = await generateBackupCodes(userId);
  res.json({ backupCodes: codes });
});

// POST /api/auth/mfa/verify — complete the MFA challenge step during login
router.post("/auth/mfa/verify", async (req, res): Promise<void> => {
  const parsed = z.object({
    challengeToken: z.string(),
    code: z.string().min(6),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }

  const { challengeToken, code } = parsed.data;
  const ip = getClientIp(req);
  const ua = req.headers["user-agent"];

  const userId = await consumeMfaChallenge(challengeToken);
  if (!userId) {
    res.status(401).json({ error: "Invalid or expired MFA challenge. Please log in again." });
    return;
  }

  const valid = await verifyMfaCode(userId, code);
  if (!valid) {
    await logSecurityEvent({
      eventType: "login_failed",
      userId,
      ip,
      userAgent: ua,
      details: "Invalid MFA code during login",
      severity: "warn",
    });
    res.status(401).json({ error: "Invalid MFA code" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(401).json({ error: "User not found" }); return; }

  // Issue a full session token now that MFA is verified
  const token = generateToken(userId);
  await createSession(userId, token, ip, ua);

  await logSecurityEvent({
    eventType: "login_success",
    userId,
    email: user.email,
    ip,
    userAgent: ua,
    details: "Login completed with MFA",
    severity: "info",
  });

  await db.insert(auditLogsTable).values({
    userId,
    userEmail: user.email,
    userName: user.name,
    action: "login",
    resource: "auth",
    details: `MFA login from ${ip}`,
    ipAddress: ip,
    userAgent: ua ?? null,
    phiAccessed: false,
  }).catch(() => {});

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt.toISOString() },
    token,
    expiresIn: 8 * 60 * 60,
  });
});

export default router;
