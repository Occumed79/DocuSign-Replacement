import { describe, expect, it, vi } from "vitest";

vi.mock("@workspace/db", () => ({
  activeSessionsTable: {},
  db: {},
  loginAttemptsTable: {},
  usersTable: {},
}));
import { recoveryTokenMatches } from "./admin-access-recovery";

describe("recoveryTokenMatches", () => {
  it("accepts an exact token", () => {
    expect(recoveryTokenMatches("a".repeat(32), "a".repeat(32))).toBe(true);
  });

  it("rejects a different token without depending on token length", () => {
    expect(recoveryTokenMatches("wrong", "a".repeat(64))).toBe(false);
  });
});
