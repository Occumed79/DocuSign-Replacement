import { db, activeSessionsTable, usersTable, securityEventsTable, loginAttemptsTable } from "@workspace/db";
import { eq, and, gt, lt, sql } from "drizzle-orm";
import crypto from "crypto";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function hashToken(token: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is required for session token hashing");
  }
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}

export function generateToken(userId: number): string {
  const random = crypto.randomBytes(48).toString("base64url");
  return Buffer.from(`${userId}:${Date.now()}:${random}`).toString("base64url");
}

export async function createSession(
  userId: number,
  token: string,
  ip: string | undefined,
  userAgent: string | undefined
): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.insert(activeSessionsTable).values({
    token: hashToken(token),
    userId,
    ipAddress: ip ?? null,
    userAgent: userAgent ?? null,
    expiresAt,
    lastActivityAt: new Date(),
  });
}

export async function getSessionUserId(token: string): Promise<number | null> {
  const tokenHash = hashToken(token);
  const [session] = await db
    .select({ userId: activeSessionsTable.userId })
    .from(activeSessionsTable)
    .where(
      and(
        eq(activeSessionsTable.token, tokenHash),
        gt(activeSessionsTable.expiresAt, new Date()),
        sql`${activeSessionsTable.revokedAt} IS NULL`
      )
    )
    .limit(1);

  if (!session) return null;

  // Update last activity
  await db
    .update(activeSessionsTable)
    .set({ lastActivityAt: new Date() })
    .where(eq(activeSessionsTable.token, tokenHash));

  return session.userId;
}

export async function revokeSession(token: string): Promise<void> {
  await db
    .update(activeSessionsTable)
    .set({ revokedAt: new Date() })
    .where(eq(activeSessionsTable.token, hashToken(token)));
}

export async function revokeAllUserSessions(userId: number): Promise<void> {
  await db
    .update(activeSessionsTable)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(activeSessionsTable.userId, userId),
        sql`${activeSessionsTable.revokedAt} IS NULL`
      )
    );
}

export async function getUserSessions(userId: number) {
  return db
    .select()
    .from(activeSessionsTable)
    .where(
      and(
        eq(activeSessionsTable.userId, userId),
        gt(activeSessionsTable.expiresAt, new Date()),
        sql`${activeSessionsTable.revokedAt} IS NULL`
      )
    )
    .orderBy(sql`${activeSessionsTable.lastActivityAt} DESC`);
}

export async function checkLoginLock(email: string, ip?: string): Promise<{ locked: boolean; lockedUntil?: Date }> {
  const [attempt] = await db
    .select()
    .from(loginAttemptsTable)
    .where(eq(loginAttemptsTable.email, email.toLowerCase()))
    .limit(1);

  if (!attempt) return { locked: false };

  if (attempt.lockedUntil && attempt.lockedUntil > new Date()) {
    return { locked: true, lockedUntil: attempt.lockedUntil };
  }

  return { locked: false };
}

export async function recordLoginAttempt(
  email: string,
  success: boolean,
  ip?: string
): Promise<{ locked: boolean; attemptsLeft?: number }> {
  const [existing] = await db
    .select()
    .from(loginAttemptsTable)
    .where(eq(loginAttemptsTable.email, email.toLowerCase()))
    .limit(1);

  if (success) {
    // Clear attempts on success
    if (existing) {
      await db
        .delete(loginAttemptsTable)
        .where(eq(loginAttemptsTable.email, email.toLowerCase()));
    }
    return { locked: false };
  }

  // Failed login
  if (existing) {
    const newCount = existing.attemptCount + 1;
    const shouldLock = newCount >= MAX_LOGIN_ATTEMPTS;
    const lockedUntil = shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null;

    await db
      .update(loginAttemptsTable)
      .set({
        attemptCount: newCount,
        lockedUntil,
        updatedAt: new Date(),
        ipAddress: ip ?? null,
      })
      .where(eq(loginAttemptsTable.email, email.toLowerCase()));

    return {
      locked: shouldLock,
      attemptsLeft: shouldLock ? 0 : Math.max(0, MAX_LOGIN_ATTEMPTS - newCount),
    };
  } else {
    await db.insert(loginAttemptsTable).values({
      email: email.toLowerCase(),
      success: false,
      attemptCount: 1,
      ipAddress: ip ?? null,
    });
    return { locked: false, attemptsLeft: MAX_LOGIN_ATTEMPTS - 1 };
  }
}

export async function logSecurityEvent(params: {
  eventType: "login_success" | "login_failed" | "login_locked" | "logout" | "password_change" | "session_expired" | "unauthorized_access" | "phi_export" | "case_submitted" | "admin_action" | "session_revoked";
  userId?: number;
  email?: string;
  ip?: string;
  userAgent?: string;
  details?: string;
  severity?: string;
}) {
  await db.insert(securityEventsTable).values({
    eventType: params.eventType,
    userId: params.userId,
    email: params.email,
    ipAddress: params.ip,
    userAgent: params.userAgent,
    details: params.details,
    severity: params.severity ?? "info",
  }).catch(() => {/* swallow */});
}

export async function cleanupExpiredSessions(): Promise<void> {
  await db
    .delete(activeSessionsTable)
    .where(lt(activeSessionsTable.expiresAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
}
