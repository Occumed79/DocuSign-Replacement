import { describe, it, expect, vi } from "vitest";

// Mock the database module
vi.mock("@workspace/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
  },
  usersTable: {},
  auditLogsTable: {},
}));

vi.mock("../lib/session-store", () => ({
  generateToken: vi.fn().mockReturnValue("mock-token"),
  createSession: vi.fn().mockResolvedValue(undefined),
  getSessionUserId: vi.fn().mockResolvedValue(null),
  revokeSession: vi.fn().mockResolvedValue(undefined),
  revokeAllUserSessions: vi.fn().mockResolvedValue(undefined),
  checkLoginLock: vi.fn().mockResolvedValue({ locked: false }),
  recordLoginAttempt: vi.fn().mockResolvedValue({ locked: false }),
  logSecurityEvent: vi.fn().mockResolvedValue(undefined),
}));

import { hashPassword, verifyPassword } from "./auth";

describe("hashPassword", () => {
  it("should return a bcrypt hash starting with $2", async () => {
    const hash = await hashPassword("testpassword123");
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("should produce different hashes for the same password (salt randomness)", async () => {
    const hash1 = await hashPassword("samepassword");
    const hash2 = await hashPassword("samepassword");
    expect(hash1).not.toBe(hash2);
  });

  it("should produce a hash of expected bcrypt length", async () => {
    const hash = await hashPassword("password");
    expect(hash.length).toBe(60);
  });
});

describe("verifyPassword", () => {
  it("should verify a correct bcrypt password", async () => {
    const password = "mySecurePassword!";
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });

  it("should reject an incorrect bcrypt password", async () => {
    const hash = await hashPassword("correctPassword");
    const result = await verifyPassword("wrongPassword", hash);
    expect(result).toBe(false);
  });

  it("should handle legacy SHA-256 hashes for migration compatibility", async () => {
    // SHA-256 hash of "admin123" + "packetpath_salt"
    const { createHash } = await import("crypto");
    const legacyHash = createHash("sha256").update("admin123" + "packetpath_salt").digest("hex");
    expect(legacyHash.length).toBe(64);
    expect(legacyHash).not.toMatch(/^\$2/);

    const result = await verifyPassword("admin123", legacyHash);
    expect(result).toBe(true);
  });

  it("should reject wrong password against legacy SHA-256 hash", async () => {
    const { createHash } = await import("crypto");
    const legacyHash = createHash("sha256").update("admin123" + "packetpath_salt").digest("hex");
    const result = await verifyPassword("wrongpassword", legacyHash);
    expect(result).toBe(false);
  });
});
