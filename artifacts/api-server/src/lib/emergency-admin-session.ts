import crypto from "crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const TOKEN_PREFIX = "pp-recovery-v1";
const RECOVERY_ADMIN_ID = 1;
const RECOVERY_ADMIN_EMAIL = "alex.ayvazian@occu-med.com";
const RECOVERY_UPDATED_AT = "2026-08-20T03:46:11.388Z";
const RECOVERY_TTL_MS = 30 * 60 * 1000;

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required for recovery session signing");
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function isRecoveryAdminState(user: {
  id: number;
  email: string;
  updatedAt: Date;
}): boolean {
  return user.id === RECOVERY_ADMIN_ID
    && user.email.toLowerCase() === RECOVERY_ADMIN_EMAIL
    && user.updatedAt.toISOString() === RECOVERY_UPDATED_AT;
}

export function createEmergencyAdminSessionToken(userId: number): string {
  if (userId !== RECOVERY_ADMIN_ID) {
    throw new Error("Emergency recovery session is restricted to the production admin account");
  }

  const now = Date.now();
  const payload = Buffer.from(JSON.stringify({
    userId,
    issuedAt: now,
    expiresAt: now + RECOVERY_TTL_MS,
    nonce: crypto.randomBytes(24).toString("base64url"),
  }), "utf8").toString("base64url");

  return `${TOKEN_PREFIX}.${payload}.${sign(payload)}`;
}

export function isEmergencyAdminSessionToken(token: string): boolean {
  return token.startsWith(`${TOKEN_PREFIX}.`);
}

export async function resolveEmergencyAdminSessionToken(token: string): Promise<number | null> {
  const [prefix, payload, signature] = token.split(".");
  if (prefix !== TOKEN_PREFIX || !payload || !signature) return null;
  if (!safeEqual(signature, sign(payload))) return null;

  let parsed: { userId?: unknown; issuedAt?: unknown; expiresAt?: unknown };
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (parsed.userId !== RECOVERY_ADMIN_ID) return null;
  if (typeof parsed.issuedAt !== "number" || typeof parsed.expiresAt !== "number") return null;
  if (parsed.expiresAt <= Date.now() || parsed.expiresAt - parsed.issuedAt > RECOVERY_TTL_MS) return null;

  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email, updatedAt: usersTable.updatedAt })
    .from(usersTable)
    .where(eq(usersTable.id, RECOVERY_ADMIN_ID))
    .limit(1);

  if (!user || !isRecoveryAdminState(user)) return null;
  return user.id;
}
