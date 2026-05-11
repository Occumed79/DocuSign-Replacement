import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isEmailConfigured } from "./email";

describe("isEmailConfigured", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore env vars
    process.env.SMTP_HOST = originalEnv.SMTP_HOST;
    process.env.SMTP_USER = originalEnv.SMTP_USER;
    process.env.SMTP_PASS = originalEnv.SMTP_PASS;
  });

  it("should return false when SMTP env vars are not set", () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    expect(isEmailConfigured()).toBe(false);
  });

  it("should return false when only SMTP_HOST is set", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    expect(isEmailConfigured()).toBe(false);
  });

  it("should return false when only SMTP_HOST and SMTP_USER are set", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "user@example.com";
    delete process.env.SMTP_PASS;
    expect(isEmailConfigured()).toBe(false);
  });

  it("should return true when all required SMTP env vars are set", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "user@example.com";
    process.env.SMTP_PASS = "secret";
    expect(isEmailConfigured()).toBe(true);
  });
});
