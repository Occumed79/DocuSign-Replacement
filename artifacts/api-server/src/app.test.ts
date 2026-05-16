import { describe, it, expect, vi, beforeEach } from "vitest";
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
    values: vi.fn().mockResolvedValue([]),
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

vi.mock("./lib/mfa", () => ({
  createMfaChallenge: vi.fn().mockResolvedValue("challenge-123"),
  getMfaStatus: vi.fn().mockResolvedValue({ enabled: false, verifiedAt: null }),
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
import { hashPassword } from "./routes/auth";

beforeEach(() => {
  vi.clearAllMocks();
});

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


describe("Cases routes require auth", () => {
  it("GET /api/cases without auth should return 401", async () => {
    const res = await request(app).get("/api/cases");
    expect(res.status).toBe(401);
  });

  it("POST /api/cases without auth should return 401", async () => {
    const res = await request(app).post("/api/cases").send({ patientName: "P", examTypeId: 1 });
    expect(res.status).toBe(401);
  });

  it("GET /api/cases/1 without auth should return 401", async () => {
    const res = await request(app).get("/api/cases/1");
    expect(res.status).toBe(401);
  });

  it("PATCH /api/cases/1 without auth should return 401", async () => {
    const res = await request(app).patch("/api/cases/1").send({ patientName: "Updated" });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/cases/1 without auth should return 401", async () => {
    const res = await request(app).delete("/api/cases/1");
    expect(res.status).toBe(401);
  });

  it("GET /api/cases/1/answers without auth should return 401", async () => {
    const res = await request(app).get("/api/cases/1/answers");
    expect(res.status).toBe(401);
  });

  it("PUT /api/cases/1/answers without auth should return 401", async () => {
    const res = await request(app).put("/api/cases/1/answers").send({ answers: [] });
    expect(res.status).toBe(401);
  });

  it("GET /api/cases/1/review without auth should return 401", async () => {
    const res = await request(app).get("/api/cases/1/review");
    expect(res.status).toBe(401);
  });

  it("PHI route with valid session logs audit with user attribution", async () => {
    const dbMod = await import("@workspace/db");
    const session = await import("./lib/session-store");

    vi.mocked(session.getSessionUserId).mockResolvedValue(42);
    (dbMod as any).db.where.mockResolvedValueOnce([{ email: "phi@example.com", name: "Phi User" }]);

    await request(app).get("/api/cases").set("Authorization", "Bearer good-token");

    const valuesCalls = (dbMod as any).db.values.mock.calls;
    const phiAudit = valuesCalls
      .map((call: any[]) => call[0])
      .find((payload: any) => payload?.phiAccessed === true && payload?.resource === "cases");

    expect(phiAudit).toBeDefined();
    expect(phiAudit.userId).toBe(42);
    expect(phiAudit.userEmail).toBe("phi@example.com");
  });

});


describe("Auth login MFA behavior", () => {
  it("MFA-disabled login returns normal token", async () => {
    const dbMod = await import("@workspace/db");
    const session = await import("./lib/session-store");

    const passwordHash = await hashPassword("pw123456");
    (dbMod as any).db.where.mockResolvedValueOnce([{
      id: 1,
      name: "User",
      email: "user@example.com",
      passwordHash,
      role: "reviewer",
      mfaEnabled: false,
      createdAt: new Date(),
    }]);

    const res = await request(app).post("/api/auth/login").send({ email: "user@example.com", password: "pw123456" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe("mock-token");
    expect(res.body.mfaRequired).toBeUndefined();
    expect(vi.mocked(session.createSession)).toHaveBeenCalled();
  });

  it("MFA-enabled login returns challenge and no session token", async () => {
    const dbMod = await import("@workspace/db");
    const session = await import("./lib/session-store");
    const mfa = await import("./lib/mfa");
    vi.mocked(mfa.getMfaStatus as any).mockResolvedValueOnce({ enabled: true, verifiedAt: new Date() });

    const passwordHash = await hashPassword("pw123456");
    (dbMod as any).db.where.mockResolvedValueOnce([{
      id: 2,
      name: "MFA User",
      email: "mfa@example.com",
      passwordHash,
      role: "reviewer",
      mfaEnabled: true,
      createdAt: new Date(),
    }]);

    const res = await request(app).post("/api/auth/login").send({ email: "mfa@example.com", password: "pw123456" });

    expect(res.status).toBe(200);
    expect(res.body.mfaRequired).toBe(true);
    expect(res.body.challengeToken).toBe("challenge-123");
    expect(res.body.token).toBeUndefined();
    expect(vi.mocked(mfa.createMfaChallenge as any)).toHaveBeenCalledWith(2);
    expect(vi.mocked(session.createSession)).not.toHaveBeenCalled();
  });

  it("Invalid password still fails normally", async () => {
    const dbMod = await import("@workspace/db");

    const passwordHash = await hashPassword("different-password");
    (dbMod as any).db.where.mockResolvedValueOnce([{
      id: 3,
      name: "Wrong Pw",
      email: "wrong@example.com",
      passwordHash,
      role: "reviewer",
      mfaEnabled: true,
      createdAt: new Date(),
    }]);

    const res = await request(app).post("/api/auth/login").send({ email: "wrong@example.com", password: "pw123456" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password");
  });
});
