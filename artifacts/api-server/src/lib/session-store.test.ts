import { describe, it, expect, vi, beforeEach } from "vitest";

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
  activeSessionsTable: {},
  usersTable: {},
  securityEventsTable: {},
  loginAttemptsTable: {},
}));

import { generateToken } from "./session-store";

describe("generateToken", () => {
  it("should generate a non-empty string token", () => {
    const token = generateToken(1);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("should generate unique tokens for the same user", () => {
    const token1 = generateToken(1);
    const token2 = generateToken(1);
    expect(token1).not.toBe(token2);
  });

  it("should generate tokens for different user IDs", () => {
    const token1 = generateToken(1);
    const token2 = generateToken(2);
    expect(token1).not.toBe(token2);
  });

  it("should produce base64url-safe characters only", () => {
    const token = generateToken(42);
    // base64url uses A-Z, a-z, 0-9, -, _
    expect(token).toMatch(/^[A-Za-z0-9\-_]+$/);
  });
});
