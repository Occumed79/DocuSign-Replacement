import { Router, type IRouter } from "express";
import { db, auditLogsTable, securityEventsTable, activeSessionsTable, usersTable } from "@workspace/db";
import { eq, desc, and, sql, count, gte, lt } from "drizzle-orm";
import { getUserSessions, revokeSession, logSecurityEvent } from "../lib/session-store";
import { requireAuth, requireAdmin } from "../lib/require-auth";

const router: IRouter = Router();


// GET /api/security/stats
router.get("/security/stats", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalPhiAccess,
    phiAccessToday,
    failedLoginsToday,
    activeSessions,
    recentEvents,
  ] = await Promise.all([
    db.select({ count: count() }).from(auditLogsTable).where(eq(auditLogsTable.phiAccessed, true)),
    db.select({ count: count() }).from(auditLogsTable).where(and(eq(auditLogsTable.phiAccessed, true), gte(auditLogsTable.createdAt, oneDayAgo))),
    db.select({ count: count() }).from(securityEventsTable).where(and(eq(securityEventsTable.eventType, "login_failed"), gte(securityEventsTable.createdAt, oneDayAgo))),
    db.select({ count: count() }).from(activeSessionsTable).where(and(gte(activeSessionsTable.expiresAt, new Date()), sql`${activeSessionsTable.revokedAt} IS NULL`)),
    db.select().from(securityEventsTable).orderBy(desc(securityEventsTable.createdAt)).limit(10),
  ]);

  const phiByUser = await db
    .select({
      userEmail: auditLogsTable.userEmail,
      userName: auditLogsTable.userName,
      count: count(),
    })
    .from(auditLogsTable)
    .where(and(eq(auditLogsTable.phiAccessed, true), gte(auditLogsTable.createdAt, sevenDaysAgo)))
    .groupBy(auditLogsTable.userEmail, auditLogsTable.userName)
    .orderBy(sql`count(*) DESC`)
    .limit(5);

  res.json({
    totalPhiAccess: totalPhiAccess[0]?.count ?? 0,
    phiAccessToday: phiAccessToday[0]?.count ?? 0,
    failedLoginsToday: failedLoginsToday[0]?.count ?? 0,
    activeSessions: activeSessions[0]?.count ?? 0,
    recentEvents: recentEvents.map(e => ({
      id: e.id,
      eventType: e.eventType,
      email: e.email,
      ipAddress: e.ipAddress,
      details: e.details,
      severity: e.severity,
      createdAt: e.createdAt.toISOString(),
    })),
    topPhiUsers: phiByUser.map(u => ({
      email: u.userEmail ?? "unknown",
      name: u.userName ?? "unknown",
      count: u.count,
    })),
  });
});

// GET /api/audit-logs
router.get("/audit-logs", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;

  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(10, Number(req.query.limit ?? 50)));
  const offset = (page - 1) * limit;
  const phiOnly = req.query.phi_only === "true";
  const resource = req.query.resource as string | undefined;

  const conditions = [
    phiOnly ? eq(auditLogsTable.phiAccessed, true) : undefined,
    resource ? eq(auditLogsTable.resource, resource) : undefined,
  ].filter(Boolean) as any[];

  const [logs, totalResult] = await Promise.all([
    db
      .select()
      .from(auditLogsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(auditLogsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ]);

  res.json({
    logs: logs.map(l => ({
      id: l.id,
      userId: l.userId,
      userEmail: l.userEmail,
      userName: l.userName,
      action: l.action,
      resource: l.resource,
      resourceId: l.resourceId,
      details: l.details,
      ipAddress: l.ipAddress,
      userAgent: l.userAgent,
      phiAccessed: l.phiAccessed,
      patientName: l.patientName,
      createdAt: l.createdAt.toISOString(),
    })),
    total: totalResult[0]?.count ?? 0,
    page,
    limit,
  });
});

// GET /api/security/events
router.get("/security/events", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;

  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = 50;
  const offset = (page - 1) * limit;
  const severity = req.query.severity as string | undefined;

  const conditions = severity
    ? [eq(securityEventsTable.severity, severity)]
    : [];

  const [events, totalResult] = await Promise.all([
    db
      .select()
      .from(securityEventsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(securityEventsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(securityEventsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ]);

  res.json({
    events: events.map(e => ({
      id: e.id,
      eventType: e.eventType,
      userId: e.userId,
      email: e.email,
      ipAddress: e.ipAddress,
      userAgent: e.userAgent,
      details: e.details,
      severity: e.severity,
      createdAt: e.createdAt.toISOString(),
    })),
    total: totalResult[0]?.count ?? 0,
    page,
    limit,
  });
});

// GET /api/security/sessions
router.get("/security/sessions", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const sessions = await getUserSessions(userId);

  const currentToken = req.headers.authorization?.slice(7);

  res.json(sessions.map(s => ({
    id: s.id,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    lastActivityAt: s.lastActivityAt.toISOString(),
    expiresAt: s.expiresAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
    isCurrent: s.token === currentToken,
  })));
});

// DELETE /api/security/sessions/:id
router.delete("/security/sessions/:id", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const sessionId = Number(req.params.id);
  const [session] = await db
    .select()
    .from(activeSessionsTable)
    .where(and(eq(activeSessionsTable.id, sessionId), eq(activeSessionsTable.userId, userId)));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  await revokeSession(session.token);
  await logSecurityEvent({ eventType: "session_revoked", userId, severity: "warn", details: `Session ${sessionId} revoked` });
  res.json({ message: "Session revoked" });
});

export default router;
