import { describe, it, expect, afterEach } from "vitest";
import { buildSmtpTransportOptions, isEmailConfigured } from "./email";

const trackedEnvKeys = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"] as const;
const originalEnv = Object.fromEntries(trackedEnvKeys.map(key => [key, process.env[key]]));

afterEach(() => {
  for (const key of trackedEnvKeys) {
    const original = originalEnv[key];
    if (original === undefined) delete process.env[key];
    else process.env[key] = original;
  }
});

describe("isEmailConfigured", () => {
  it("returns false when SMTP env vars are not set", () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    expect(isEmailConfigured()).toBe(false);
  });

  it("returns false when only SMTP_HOST is set", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    expect(isEmailConfigured()).toBe(false);
  });

  it("returns false when only SMTP_HOST and SMTP_USER are set", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "user@example.com";
    delete process.env.SMTP_PASS;
    expect(isEmailConfigured()).toBe(false);
  });

  it("returns false for whitespace-only host or user values", () => {
    process.env.SMTP_HOST = "   ";
    process.env.SMTP_USER = "user@example.com";
    process.env.SMTP_PASS = "secret";
    expect(isEmailConfigured()).toBe(false);

    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "   ";
    expect(isEmailConfigured()).toBe(false);
  });

  it("returns true when all required SMTP env vars are set", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "user@example.com";
    process.env.SMTP_PASS = "secret";
    expect(isEmailConfigured()).toBe(true);
  });
});

describe("SMTP transport security", () => {
  const config = {
    host: "smtp.example.com",
    port: 587,
    secure: false,
    user: "user@example.com",
    pass: "secret",
    fromAddress: "packetpath@example.com",
    fromName: "PacketPath",
  };

  it("requires STARTTLS and certificate validation for non-implicit TLS connections", () => {
    const options = buildSmtpTransportOptions(config);
    expect(options.requireTLS).toBe(true);
    expect(options.tls.rejectUnauthorized).toBe(true);
    expect(options.tls.minVersion).toBe("TLSv1.2");
  });

  it("does not request STARTTLS when the SMTP socket already uses implicit TLS", () => {
    const options = buildSmtpTransportOptions({ ...config, port: 465, secure: true });
    expect(options.secure).toBe(true);
    expect(options.requireTLS).toBe(false);
    expect(options.tls.rejectUnauthorized).toBe(true);
    expect(options.tls.minVersion).toBe("TLSv1.2");
  });

  it("blocks local-file and remote-URL content loading", () => {
    const options = buildSmtpTransportOptions(config);
    expect(options.disableFileAccess).toBe(true);
    expect(options.disableUrlAccess).toBe(true);
  });

  it("preserves the configured SMTP connection and credentials", () => {
    const options = buildSmtpTransportOptions(config);
    expect(options).toMatchObject({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: { user: "user@example.com", pass: "secret" },
    });
  });
});
