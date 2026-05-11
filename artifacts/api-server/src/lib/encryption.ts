/**
 * Field-level AES-256-GCM encryption for PHI (Protected Health Information).
 * Sensitive fields (patient names, DOB, PII) are encrypted before storage
 * and decrypted on read, satisfying HIPAA §164.312(a)(2)(iv) encryption requirements.
 */

import crypto from "crypto";

function getDatabaseEncryptionKey(): Buffer {
  const key = process.env.DB_ENCRYPTION_KEY;
  if (!key) {
    // Fallback for development — MUST set DB_ENCRYPTION_KEY in production
    const fallback = process.env.SESSION_SECRET ?? "packetpath-db-encryption-key-change-in-prod";
    return crypto.createHash("sha256").update(`db:${fallback}`).digest();
  }
  if (key.length !== 64) {
    throw new Error("DB_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }
  return Buffer.from(key, "hex");
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a compact string: "enc:v1:<iv_hex>:<tag_hex>:<data_hex>"
 * The "enc:v1:" prefix allows detecting already-encrypted values and future versioning.
 */
export function encryptField(plaintext: string): string {
  if (plaintext.startsWith("enc:v1:")) return plaintext; // already encrypted
  const key = getDatabaseEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt a field encrypted with encryptField().
 * Returns the original plaintext. If the value is not encrypted, returns it as-is
 * (for backward compatibility with existing unencrypted data).
 */
export function decryptField(value: string): string {
  if (!value.startsWith("enc:v1:")) return value; // not encrypted (legacy data)
  const key = getDatabaseEncryptionKey();
  const parts = value.slice("enc:v1:".length).split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted field format");
  const [ivHex, tagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex!, "hex");
  const tag = Buffer.from(tagHex!, "hex");
  const data = Buffer.from(dataHex!, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data).toString("utf8") + decipher.final("utf8");
}

/** Encrypt if not null/undefined */
export function encryptFieldNullable(value: string | null | undefined): string | null {
  if (value == null) return null;
  return encryptField(value);
}

/** Decrypt if not null/undefined */
export function decryptFieldNullable(value: string | null | undefined): string | null {
  if (value == null) return null;
  return decryptField(value);
}

/**
 * Deterministic HMAC-SHA256 blind index for searching encrypted fields.
 * Allows equality lookups on encrypted columns without decrypting the whole table.
 * Usage: WHERE blind_index_column = blindIndex(searchTerm)
 */
export function blindIndex(value: string): string {
  const key = process.env.BLIND_INDEX_KEY ?? process.env.SESSION_SECRET ?? "packetpath-blind-index-key";
  return crypto.createHmac("sha256", key).update(value.toLowerCase().trim()).digest("hex");
}
