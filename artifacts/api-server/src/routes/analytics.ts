/**
 * Enhanced analytics routes for staff efficiency dashboard
 * GET /api/analytics/time-to-complete  — avg time to complete by exam type
 * GET /api/analytics/signature-funnel  — signing funnel (sent → viewed → signed)
 * GET /api/analytics/completion-trend  — daily completion trend (last 30 days)
 * GET /api/analytics/bottlenecks       — cases stuck in specific statuses
 */

import { Router, type IRouter } from "express";
import { db, casesTable, examTypesTable, signatureRequestsTable, signatureRecipientsTable, completedSignaturesTable } from "@workspace/db";
import { eq, desc, sql, and, gte, lte, count } from "drizzle-orm";
import { requireAuth } from "../lib/require-auth";

const router: IRouter = Router();


// GET /api/analytics/time-to-complete
router.get("/analytics/time-to-complete", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  // Average time from case creation to submission, grouped by exam type
  const cases = await db
    .select({
      examTypeName: examTypesTable.name,
      createdAt: casesTable.createdAt,
      updatedAt: casesTable.updatedAt,
      status: casesTable.status,
    })
    .from(casesTable)
    .leftJoin(examTypesTable, eq(casesTable.examTypeId, examTypesTable.id))
    .where(eq(casesTable.status, "submitted"));

  const byExamType = new Map<string, number[]>();
  for (const c of cases) {
    const name = c.examTypeName ?? "Unknown";
    const hours = (c.updatedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60);
    if (!byExamType.has(name)) byExamType.set(name, []);
    byExamType.get(name)!.push(hours);
  }

  const result = Array.from(byExamType.entries()).map(([examType, times]) => ({
    examType,
    avgHours: Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10,
    minHours: Math.round(Math.min(...times) * 10) / 10,
    maxHours: Math.round(Math.max(...times) * 10) / 10,
    count: times.length,
  })).sort((a, b) => b.avgHours - a.avgHours);

  res.json(result);
});

// GET /api/analytics/signature-funnel
router.get("/analytics/signature-funnel", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const [totalRequests] = await db.select({ count: count() }).from(signatureRequestsTable);
  const [sentRequests] = await db.select({ count: count() }).from(signatureRequestsTable)
    .where(sql`${signatureRequestsTable.status} IN ('sent', 'partially_signed', 'completed')`);
  const [viewedRecipients] = await db.select({ count: count() }).from(signatureRecipientsTable)
    .where(sql`${signatureRecipientsTable.viewedAt} IS NOT NULL`);
  const [signedRecipients] = await db.select({ count: count() }).from(signatureRecipientsTable)
    .where(eq(signatureRecipientsTable.status, "signed"));
  const [completedRequests] = await db.select({ count: count() }).from(signatureRequestsTable)
    .where(eq(signatureRequestsTable.status, "completed"));
  const [voidedRequests] = await db.select({ count: count() }).from(signatureRequestsTable)
    .where(eq(signatureRequestsTable.status, "voided"));
  const [declinedRecipients] = await db.select({ count: count() }).from(signatureRecipientsTable)
    .where(eq(signatureRecipientsTable.status, "declined"));

  res.json({
    total: totalRequests?.count ?? 0,
    sent: sentRequests?.count ?? 0,
    viewed: viewedRecipients?.count ?? 0,
    signed: signedRecipients?.count ?? 0,
    completed: completedRequests?.count ?? 0,
    voided: voidedRequests?.count ?? 0,
    declined: declinedRecipients?.count ?? 0,
  });
});

// GET /api/analytics/completion-trend
router.get("/analytics/completion-trend", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const days = Number(req.query.days ?? 30);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get completed cases per day
  const completedCases = await db
    .select({ updatedAt: casesTable.updatedAt })
    .from(casesTable)
    .where(and(
      eq(casesTable.status, "submitted"),
      gte(casesTable.updatedAt, since)
    ));

  // Get completed signature requests per day
  const completedSigs = await db
    .select({ completedAt: signatureRequestsTable.completedAt })
    .from(signatureRequestsTable)
    .where(and(
      eq(signatureRequestsTable.status, "completed"),
      gte(signatureRequestsTable.completedAt!, since)
    ));

  // Build daily buckets
  const casesByDay = new Map<string, number>();
  const sigsByDay = new Map<string, number>();

  for (const c of completedCases) {
    const day = c.updatedAt.toISOString().slice(0, 10);
    casesByDay.set(day, (casesByDay.get(day) ?? 0) + 1);
  }

  for (const s of completedSigs) {
    if (!s.completedAt) continue;
    const day = s.completedAt.toISOString().slice(0, 10);
    sigsByDay.set(day, (sigsByDay.get(day) ?? 0) + 1);
  }

  // Build full date range
  const trend = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const day = d.toISOString().slice(0, 10);
    trend.push({
      date: day,
      casesCompleted: casesByDay.get(day) ?? 0,
      signaturesCompleted: sigsByDay.get(day) ?? 0,
    });
  }

  res.json(trend);
});

// GET /api/analytics/bottlenecks
router.get("/analytics/bottlenecks", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const thresholdDays = Number(req.query.threshold_days ?? 3);
  const threshold = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);

  // Cases stuck in draft or in_progress for more than threshold
  const stuckCases = await db
    .select({
      id: casesTable.id,
      patientName: casesTable.patientName,
      status: casesTable.status,
      examTypeName: examTypesTable.name,
      updatedAt: casesTable.updatedAt,
      createdAt: casesTable.createdAt,
    })
    .from(casesTable)
    .leftJoin(examTypesTable, eq(casesTable.examTypeId, examTypesTable.id))
    .where(and(
      sql`${casesTable.status} IN ('draft', 'in_progress')`,
      lte(casesTable.updatedAt, threshold)
    ))
    .orderBy(casesTable.updatedAt)
    .limit(20);

  // Signature requests stuck in "sent" for more than threshold
  const stuckSignatures = await db
    .select({
      id: signatureRequestsTable.id,
      title: signatureRequestsTable.title,
      status: signatureRequestsTable.status,
      createdAt: signatureRequestsTable.createdAt,
    })
    .from(signatureRequestsTable)
    .where(and(
      eq(signatureRequestsTable.status, "sent"),
      lte(signatureRequestsTable.createdAt, threshold)
    ))
    .orderBy(signatureRequestsTable.createdAt)
    .limit(20);

  const now = Date.now();
  res.json({
    stuckCases: stuckCases.map(c => ({
      id: c.id,
      patientName: c.patientName,
      status: c.status,
      examType: c.examTypeName ?? "Unknown",
      stuckForDays: Math.floor((now - c.updatedAt.getTime()) / (1000 * 60 * 60 * 24)),
      createdAt: c.createdAt.toISOString(),
    })),
    stuckSignatures: stuckSignatures.map(s => ({
      id: s.id,
      title: s.title,
      stuckForDays: Math.floor((now - s.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      createdAt: s.createdAt.toISOString(),
    })),
    thresholdDays,
  });
});

export default router;
