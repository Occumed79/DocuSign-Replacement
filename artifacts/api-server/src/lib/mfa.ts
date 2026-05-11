/**
 * MFA (Multi-Factor Authentication) utilities
 * Implements TOTP (RFC 6238) compatible with Google Authenticator, Authy, etc.
 * Uses AES-256-GCM to encrypt TOTP secrets at rest.
 */

import crypto from "crypto";
import { db } from "@workspace/db";
import {
  mfaSecretsTable,
  mfaBackupCodesTable,
  mfaChallengesTable,
} from "@workspace/db";
import { eq, and, isNull, gt } from "drizzle-orm";

// ─── Encryption helpers ───────────────────────────────────────────────────────

function getEncryptionKey(): Buffer {
  const key = process.env.MFA_ENCRYPTION_KEY;
  if (!key) {
    // Derive a deterministic key from a fallback secret — warn in production
    const fallback = process.env.SESSION_SECRET ?? "packetpath-mfa-default-key-change-in-prod";
    return crypto.createHash("sha256").update(fallback).digest();
  }
  return Buffer.from(key, "hex");
}

export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv(12):tag(16):ciphertext — all hex
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(ciphertext: string): string {
  const key = getEncryptionKey();
  const [ivHex, tagHex, dataHex] = ciphertext.split(":");
  if (!ivHex || !tagHex || !dataHex) throw new Error("Invalid ciphertext format");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data).toString("utf8") + decipher.final("utf8");
}

// ─── TOTP implementation (RFC 6238) ──────────────────────────────────────────

/** Generate a cryptographically random base32-encoded TOTP secret */
export function generateTotpSecret(): string {
  const bytes = crypto.randomBytes(20);
  return base32Encode(bytes);
}

function base32Encode(buffer: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  let bits = 0;
  let value = 0;
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) result += alphabet[(value << (5 - bits)) & 31];
  return result;
}

function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = input.toUpperCase().replace(/=+$/, "");
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of cleaned) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hotp(secret: string, counter: bigint): string {
  const key = base32Decode(secret);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(counter);
  const hmac = crypto.createHmac("sha1", key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

/** Verify a TOTP code with a ±1 step window for clock drift */
export function verifyTotp(secret: string, code: string): boolean {
  const step = 30n;
  const now = BigInt(Math.floor(Date.now() / 1000));
  const counter = now / step;
  for (const delta of [-1n, 0n, 1n]) {
    if (hotp(secret, counter + delta) === code) return true;
  }
  return false;
}

/** Build a TOTP provisioning URI for QR code display */
export function buildTotpUri(secret: string, email: string, issuer = "PacketPath"): string {
  const enc = encodeURIComponent;
  return `otpauth://totp/${enc(issuer)}:${enc(email)}?secret=${secret}&issuer=${enc(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// ─── Backup codes ─────────────────────────────────────────────────────────────

/** Generate 10 single-use backup codes and store their hashes */
export async function generateBackupCodes(userId: number): Promise<string[]> {
  // Delete existing unused codes
  await db.delete(mfaBackupCodesTable).where(
    and(eq(mfaBackupCodesTable.userId, userId), isNull(mfaBackupCodesTable.usedAt))
  );

  const codes: string[] = [];
  const rows = [];
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(5).toString("hex").toUpperCase(); // e.g. "A3F9B2C1D4"
    const formatted = `${code.slice(0, 5)}-${code.slice(5)}`; // "A3F9B-2C1D4"
    codes.push(formatted);
    const hash = crypto.createHash("sha256").update(formatted).digest("hex");
    rows.push({ userId, codeHash: hash });
  }
  await db.insert(mfaBackupCodesTable).values(rows);
  return codes;
}

/** Verify and consume a backup code (single-use) */
export async function verifyAndConsumeBackupCode(userId: number, rawCode: string): Promise<boolean> {
  const normalized = rawCode.trim().toUpperCase();
  const hash = crypto.createHash("sha256").update(normalized).digest("hex");
  const [row] = await db
    .select()
    .from(mfaBackupCodesTable)
    .where(
      and(
        eq(mfaBackupCodesTable.userId, userId),
        eq(mfaBackupCodesTable.codeHash, hash),
        isNull(mfaBackupCodesTable.usedAt)
      )
    )
    .limit(1);
  if (!row) return false;
  await db
    .update(mfaBackupCodesTable)
    .set({ usedAt: new Date() })
    .where(eq(mfaBackupCodesTable.id, row.id));
  return true;
}

// ─── MFA challenge tokens ─────────────────────────────────────────────────────

/** Create a short-lived MFA challenge token after password verification */
export async function createMfaChallenge(userId: number, ip?: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  await db.insert(mfaChallengesTable).values({ userId, challengeToken: token, expiresAt, ipAddress: ip ?? null });
  return token;
}

/** Verify and consume an MFA challenge token */
export async function consumeMfaChallenge(token: string): Promise<number | null> {
  const now = new Date();
  const [row] = await db
    .select()
    .from(mfaChallengesTable)
    .where(
      and(
        eq(mfaChallengesTable.challengeToken, token),
        isNull(mfaChallengesTable.usedAt),
        gt(mfaChallengesTable.expiresAt, now)
      )
    )
    .limit(1);
  if (!row) return null;
  await db.update(mfaChallengesTable).set({ usedAt: now }).where(eq(mfaChallengesTable.id, row.id));
  return row.userId;
}

// ─── MFA status helpers ───────────────────────────────────────────────────────

export async function getMfaStatus(userId: number): Promise<{ enabled: boolean; verifiedAt: Date | null }> {
  const [row] = await db
    .select()
    .from(mfaSecretsTable)
    .where(eq(mfaSecretsTable.userId, userId))
    .limit(1);
  return { enabled: row?.isEnabled ?? false, verifiedAt: row?.verifiedAt ?? null };
}

export async function setupMfa(userId: number): Promise<{ secret: string; uri: string; backupCodes: string[] }> {
  const plainSecret = generateTotpSecret();
  const encryptedSecret = encryptSecret(plainSecret);

  // Upsert the secret row (disabled until verified)
  const existing = await db.select().from(mfaSecretsTable).where(eq(mfaSecretsTable.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(mfaSecretsTable)
      .set({ secret: encryptedSecret, isEnabled: false, verifiedAt: null })
      .where(eq(mfaSecretsTable.userId, userId));
  } else {
    await db.insert(mfaSecretsTable).values({ userId, secret: encryptedSecret, isEnabled: false });
  }

  const backupCodes = await generateBackupCodes(userId);
  return { secret: plainSecret, uri: "", backupCodes }; // URI built per-request with user email
}

export async function enableMfa(userId: number, totpCode: string): Promise<boolean> {
  const [row] = await db.select().from(mfaSecretsTable).where(eq(mfaSecretsTable.userId, userId)).limit(1);
  if (!row) return false;
  const plainSecret = decryptSecret(row.secret);
  if (!verifyTotp(plainSecret, totpCode)) return false;
  await db.update(mfaSecretsTable)
    .set({ isEnabled: true, verifiedAt: new Date() })
    .where(eq(mfaSecretsTable.userId, userId));
  return true;
}

export async function disableMfa(userId: number): Promise<void> {
  await db.update(mfaSecretsTable)
    .set({ isEnabled: false, verifiedAt: null })
    .where(eq(mfaSecretsTable.userId, userId));
  // Invalidate all backup codes
  await db.delete(mfaBackupCodesTable).where(eq(mfaBackupCodesTable.userId, userId));
}

export async function verifyMfaCode(userId: number, code: string): Promise<boolean> {
  const [row] = await db.select().from(mfaSecretsTable).where(
    and(eq(mfaSecretsTable.userId, userId), eq(mfaSecretsTable.isEnabled, true))
  ).limit(1);
  if (!row) return false;
  const plainSecret = decryptSecret(row.secret);
  // Try TOTP first, then backup codes
  if (verifyTotp(plainSecret, code)) return true;
  return verifyAndConsumeBackupCode(userId, code);
}
