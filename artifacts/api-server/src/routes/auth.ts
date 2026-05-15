import { Router, type IRouter, type Request } from "express";
import { db, usersTable, auditLogsTable } from "@workspace/db";
import { createMfaChallenge } from "../lib/mfa";
import { eq } from "drizzle-orm";
import { LoginBody } from "@workspace/api-zod";
import bcrypt from "bcrypt";
import {
  generateToken,
  createSession,
  getSessionUserId,
  revokeSession,
  revokeAllUserSessions,
  checkLoginLock,
  recordLoginAttempt,
  logSecurityEvent,
} from "../lib/session-store";

const router: IRouter = Router();

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Support legacy SHA-256 hashes during migration
  if (hash.length === 64 && !hash.startsWith("$2")) {
    const { createHash } = await import("crypto");
    const legacyHash = createHash("sha256").update(password + "packetpath_salt").digest("hex");
    return legacyHash === hash;
  }
  return bcrypt.compare(password, hash);
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { email: rawEmail, password } = parsed.data;
  const email = rawEmail.toLowerCase().trim();
  const ip = getClientIp(req);
  const ua = req.headers["user-agent"];

  // Check lockout
  const lockStatus = await checkLoginLock(email, ip);
  if (lockStatus.locked) {
    await logSecurityEvent({
      eventType: "login_locked",
      email,
      ip,
      userAgent: ua,
      details: `Account locked until ${lockStatus.lockedUntil?.toISOString()}`,
      severity: "warn",
    });
    res.status(429).json({
      error: "Account temporarily locked due to too many failed attempts",
      lockedUntil: lockStatus.lockedUntil,
    });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  const passwordValid = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !passwordValid) {
    const result = await recordLoginAttempt(email, false, ip);
    await logSecurityEvent({
      eventType: "login_failed",
      email,
      ip,
      userAgent: ua,
      details: result.locked ? "Account locked after max attempts" : `Failed attempt, ${result.attemptsLeft ?? "?"} left`,
      severity: result.locked ? "error" : "warn",
    });
    if (result.locked) {
      res.status(429).json({ error: "Account locked after too many failed attempts. Try again in 15 minutes." });
    } else {
      res.status(401).json({
        error: "Invalid email or password",
        attemptsLeft: result.attemptsLeft,
      });
    }
    return;
  }

  await recordLoginAttempt(email, true, ip);

  // MFA gating: if enabled, return challenge token instead of issuing a full session.
  if (user.mfaEnabled) {
    const challengeToken = await createMfaChallenge(user.id);
    await logSecurityEvent({
      eventType: "login_success",
      userId: user.id,
      email: user.email,
      ip,
      userAgent: ua,
      details: "Password verified; MFA challenge required",
      severity: "info",
    });

    res.json({
      mfaRequired: true,
      challengeToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    });
    return;
  }

  const token = generateToken(user.id);
  await createSession(user.id, token, ip, ua);

  await logSecurityEvent({
    eventType: "login_success",
    userId: user.id,
    email: user.email,
    ip,
    userAgent: ua,
    severity: "info",
  });

  await db.insert(auditLogsTable).values({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    action: "login",
    resource: "auth",
    details: `Login from ${ip}`,
    ipAddress: ip,
    userAgent: ua,
    phiAccessed: false,
  }).catch(() => {});

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    },
    token,
    expiresIn: 8 * 60 * 60,
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const userId = await getSessionUserId(token);
    await revokeSession(token);
    if (userId) {
      const ip = getClientIp(req);
      await logSecurityEvent({ eventType: "logout", userId, ip, userAgent: req.headers["user-agent"], severity: "info" });
      await db.insert(auditLogsTable).values({
        userId,
        action: "logout",
        resource: "auth",
        details: "User logged out",
        ipAddress: ip,
        userAgent: req.headers["user-agent"] ?? null,
        phiAccessed: false,
      }).catch(() => {});
    }
  }
  res.json({ message: "Logged out" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const userId = await getSessionUserId(token);

  if (!userId) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  });
});

// Revoke all own sessions
router.post("/auth/sessions/revoke-all", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const userId = await getSessionUserId(token);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await revokeAllUserSessions(userId);
  await logSecurityEvent({ eventType: "session_revoked", userId, severity: "warn", details: "All sessions revoked" });
  res.json({ message: "All sessions revoked" });
});

export default router;
