import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";

// Mock the database module before importing app
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
    orderBy: vi.fn().mockResolvedValue([]),
  },
  usersTable: {},
  auditLogsTable: {},
  casesTable: {},
  examTypesTable: {},
  questionsTable: {},
  answersTable: {},
  activeSessionsTable: {},
  securityEventsTable: {},
  loginAttemptsTable: {},
  signatureRequestsTable: {},
  signatureRecipientsTable: {},
  signatureTemplatesTable: {},
  completedSignaturesTable: {},
  formResponsesTable: {},
}));

vi.mock("./lib/session-store", () => ({
  generateToken: vi.fn().mockReturnValue("mock-token"),
  createSession: vi.fn().mockResolvedValue(undefined),
  getSessionUserId: vi.fn().mockResolvedValue(null),
  revokeSession: vi.fn().mockResolvedValue(undefined),
  revokeAllUserSessions: vi.fn().mockResolvedValue(undefined),
  checkLoginLock: vi.fn().mockResolvedValue({ locked: false }),
  recordLoginAttempt: vi.fn().mockResolvedValue({ locked: false }),
  logSecurityEvent: vi.fn().mockResolvedValue(undefined),
  cleanupExpiredSessions: vi.fn().mockResolvedValue(undefined),
}));

import app from "./app";

describe("Health check endpoint", () => {
  it("GET /api/healthz should return 200", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status");
  });
});

describe("Auth endpoints", () => {
  it("POST /api/auth/login with missing body should return 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({});
    expect(res.status).toBe(400);
  });

  it("POST /api/auth/login with valid format but wrong credentials returns non-200", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nonexistent@example.com", password: "wrongpassword" });
    // Should not return 200 (success) — exact code depends on mock behavior
    expect(res.status).not.toBe(200);
  });

  it("GET /api/auth/me without token should return 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("POST /api/auth/logout should return 200 even without token", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
  });
});

describe("Security headers (Helmet)", () => {
  it("should include X-Content-Type-Options header", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("should include X-Frame-Options header", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });

  it("should include X-XSS-Protection header or Content-Security-Policy", async () => {
    const res = await request(app).get("/api/healthz");
    // Helmet sets CSP which supersedes X-XSS-Protection
    const hasCSP = res.headers["content-security-policy"] !== undefined;
    const hasXXSS = res.headers["x-xss-protection"] !== undefined;
    expect(hasCSP || hasXXSS).toBe(true);
  });
});

describe("Protected routes", () => {
  it("GET /api/users without auth should return 401", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  it("POST /api/users without auth should return 401", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ name: "Test", email: "test@test.com", password: "password123" });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/users/1 without auth should return 401", async () => {
    const res = await request(app).delete("/api/users/1");
    expect(res.status).toBe(401);
  });
});
