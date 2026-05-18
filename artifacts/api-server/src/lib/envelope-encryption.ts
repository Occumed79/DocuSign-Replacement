import crypto from "crypto";

export interface EncryptedPayload {
  version: 1;
  algorithm: "AES-256-GCM";
  keyId: string;
  iv: string;
  authTag: string;
  ciphertext: string;
}

export interface WrappedDataKey {
  version: 1;
  algorithm: "AES-256-GCM";
  keyId: string;
  iv: string;
  authTag: string;
  wrappedKey: string;
}

const CURRENT_KEY_ID = process.env.DB_ENCRYPTION_KEY_ID || "db-master-key-v1";

function getMasterKey(): Buffer {
  const raw = process.env.DB_ENCRYPTION_KEY;
  if (!raw || !/^[a-fA-F0-9]{64}$/.test(raw)) {
    throw new Error("DB_ENCRYPTION_KEY must be a 64-character hexadecimal AES-256 key");
  }
  return Buffer.from(raw, "hex");
}

export function generateDataKey(): Buffer {
  return crypto.randomBytes(32);
}

export function wrapDataKey(dataKey: Buffer): WrappedDataKey {
  if (dataKey.length !== 32) {
    throw new Error("Data key must be 32 bytes");
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getMasterKey(), iv);
  const wrapped = Buffer.concat([cipher.update(dataKey), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    version: 1,
    algorithm: "AES-256-GCM",
    keyId: CURRENT_KEY_ID,
    iv: iv.toString("base64url"),
    authTag: authTag.toString("base64url"),
    wrappedKey: wrapped.toString("base64url"),
  };
}

export function unwrapDataKey(wrapped: WrappedDataKey): Buffer {
  if (wrapped.version !== 1 || wrapped.algorithm !== "AES-256-GCM") {
    throw new Error("Unsupported wrapped data key format");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getMasterKey(),
    Buffer.from(wrapped.iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(wrapped.authTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(wrapped.wrappedKey, "base64url")),
    decipher.final(),
  ]);
}

export function encryptWithDataKey(plaintext: string, dataKey: Buffer): EncryptedPayload {
  if (dataKey.length !== 32) {
    throw new Error("Data key must be 32 bytes");
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", dataKey, iv);
  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(plaintext, "utf8")),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    version: 1,
    algorithm: "AES-256-GCM",
    keyId: CURRENT_KEY_ID,
    iv: iv.toString("base64url"),
    authTag: authTag.toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
  };
}

export function decryptWithDataKey(payload: EncryptedPayload, dataKey: Buffer): string {
  if (payload.version !== 1 || payload.algorithm !== "AES-256-GCM") {
    throw new Error("Unsupported encrypted payload format");
  }

  if (dataKey.length !== 32) {
    throw new Error("Data key must be 32 bytes");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    dataKey,
    Buffer.from(payload.iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function encryptEnvelopeField(plaintext: string) {
  const dataKey = generateDataKey();
  return {
    encryptedPayload: encryptWithDataKey(plaintext, dataKey),
    wrappedDataKey: wrapDataKey(dataKey),
  };
}

export function decryptEnvelopeField(encryptedPayload: EncryptedPayload, wrappedDataKey: WrappedDataKey): string {
  const dataKey = unwrapDataKey(wrappedDataKey);
  return decryptWithDataKey(encryptedPayload, dataKey);
}

export function isEncryptedPayload(value: unknown): value is EncryptedPayload {
  return Boolean(
    value &&
    typeof value === "object" &&
    (value as EncryptedPayload).version === 1 &&
    (value as EncryptedPayload).algorithm === "AES-256-GCM" &&
    typeof (value as EncryptedPayload).ciphertext === "string",
  );
}
