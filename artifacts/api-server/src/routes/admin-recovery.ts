import { Router, type IRouter } from "express";
import { createHash, timingSafeEqual } from "crypto";
import { z } from "zod/v4";
import { db, usersTable, loginAttemptsTable, activeSessionsTable, auditLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";
import { logSecurityEvent } from "../lib/session-store";

const router: IRouter = Router();

const RECOVERY_EMAIL = "alex.ayvazian@occu-med.com";
const RECOVERY_USER_ID = 1;
const RECOVERY_TOKEN_SHA256 = "f7cd435d70e7b93836e39d97c9d358486de4c88b2b12342f4aedaabf83603ec1";
const RECOVERY_EXPIRES_AT = new Date("2026-08-20T05:00:00.000Z");
const RECOVERY_BASELINE_UPDATED_BEFORE = new Date("2026-05-11T09:00:00.000Z");

const RecoveryBody = z.object({
  email: z.string().email(),
  recoveryToken: z.string().min(20).max(200),
  newPassword: z.string().min(12).max(128),
  confirmPassword: z.string().min(12).max(128),
});

function getClientIp(req: any): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function tokenMatches(token: string): boolean {
  const supplied = createHash("sha256").update(token).digest();
  const expected = Buffer.from(RECOVERY_TOKEN_SHA256, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderPage(message = "", success = false): string {
  const alert = message
    ? `<div class="alert ${success ? "ok" : "bad"}">${escapeHtml(message)}</div>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>PacketPath Admin Recovery</title>
  <style>
    *{box-sizing:border-box} body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:linear-gradient(135deg,#0a0e27,#141a42 55%,#080c22);color:#f6f7fb;font-family:Inter,system-ui,sans-serif}.card{width:min(440px,100%);padding:28px;border-radius:24px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);box-shadow:0 30px 90px rgba(0,0,0,.45);backdrop-filter:blur(28px)}h1{margin:0 0 8px;font-size:24px}.sub{margin:0 0 24px;color:rgba(255,255,255,.55);line-height:1.5}.field{margin:14px 0}.field label{display:block;margin:0 0 7px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.55)}input{width:100%;padding:13px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:white;font-size:16px;outline:none}button,.link{display:block;width:100%;margin-top:20px;padding:14px;border:0;border-radius:14px;background:linear-gradient(135deg,#388cff,#6951ff);color:white;font-size:16px;font-weight:700;text-align:center;text-decoration:none}.alert{margin:0 0 18px;padding:12px 14px;border-radius:12px;line-height:1.4}.bad{background:#8f2730}.ok{background:#17684d}.note{margin-top:16px;color:rgba(255,255,255,.45);font-size:12px;line-height:1.5}
  </style>
</head>
<body>
  <main class="card">
    <h1>PacketPath admin recovery</h1>
    <p class="sub">One-time recovery for the production administrator account.</p>
    ${alert}
    ${success ? `<a class="link" href="/login">Return to sign in</a>` : `
    <form method="post" action="/api/auth/recover-admin">
      <div class="field"><label>Email</label><input type="email" name="email" value="${RECOVERY_EMAIL}" autocomplete="username" required /></div>
      <div class="field"><label>Recovery token</label><input type="password" name="recoveryToken" autocomplete="off" required /></div>
      <div class="field"><label>New password</label><input type="password" name="newPassword" minlength="12" autocomplete="new-password" required /></div>
      <div class="field"><label>Confirm password</label><input type="password" name="confirmPassword" minlength="12" autocomplete="new-password" required /></div>
      <button type="submit">Reset admin password</button>
    </form>
    <p class="note">This recovery route expires automatically and cannot be reused after the account password changes.</p>`}
  </main>
</body>
</html>`;
}

router.get("/auth/recover-admin", async (_req, res): Promise<void> => {
  if (Date.now() > RECOVERY_EXPIRES_AT.getTime()) {
    res.status(410).type("html").send(renderPage("This recovery window has expired."));
    return;
  }
  res.type("html").send(renderPage());
});

router.post("/auth/recover-admin", async (req, res): Promise<void> => {
  if (Date.now() > RECOVERY_EXPIRES_AT.getTime()) {
    res.status(410).type("html").send(renderPage("This recovery window has expired."));
    return;
  }

  const parsed = RecoveryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).type("html").send(renderPage("Enter the recovery token and a new password of at least 12 characters."));
    return;
  }

  const { email, recoveryToken, newPassword, confirmPassword } = parsed.data;
  if (newPassword !== confirmPassword) {
    res.status(400).type("html").send(renderPage("The new passwords do not match."));
    return;
  }

  if (email.toLowerCase().trim() !== RECOVERY_EMAIL || !tokenMatches(recoveryToken)) {
    res.status(403).type("html").send(renderPage("The recovery credentials are not valid."));
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, RECOVERY_EMAIL)).limit(1);
  if (!user || user.id !== RECOVERY_USER_ID || user.role !== "admin") {
    res.status(403).type("html").send(renderPage("The recovery account is not available."));
    return;
  }

  if (user.updatedAt > RECOVERY_BASELINE_UPDATED_BEFORE) {
    res.status(410).type("html").send(renderPage("This recovery token has already been used."));
    return;
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash, updatedAt: new Date() }).where(eq(usersTable.id, user.id));
  await db.delete(loginAttemptsTable).where(eq(loginAttemptsTable.email, RECOVERY_EMAIL));
  await db.delete(activeSessionsTable).where(eq(activeSessionsTable.userId, user.id));

  const ip = getClientIp(req);
  await logSecurityEvent({
    eventType: "password_change",
    userId: user.id,
    email: user.email,
    ip,
    userAgent: req.headers["user-agent"],
    details: "One-time production admin recovery completed",
    severity: "warn",
  });
  await db.insert(auditLogsTable).values({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    action: "update",
    resource: "auth",
    details: "One-time production admin recovery completed",
    ipAddress: ip,
    userAgent: req.headers["user-agent"] ?? null,
    phiAccessed: false,
  }).catch(() => {});

  res.type("html").send(renderPage("Password reset successfully. The recovery token is now invalid.", true));
});

export default router;
