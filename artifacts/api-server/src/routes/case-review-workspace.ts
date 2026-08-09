import { Router, type IRouter, type Request } from "express";
import { and, asc, eq } from "drizzle-orm";
import {
  answersTable,
  auditLogsTable,
  caseReviewActionsTable,
  casesTable,
  db,
  examTypesTable,
  questionsTable,
  usersTable,
} from "@workspace/db";
import { requireAuth } from "../lib/require-auth";
import { getVisibleQuestions } from "../lib/reactive-interview";
import { buildMedicalHistoryResponseGroups } from "../lib/medical-history-review";
import { generateMedicalHistoryResponsePdf } from "../lib/medical-history-response-pdf";

const router: IRouter = Router();
const ALLOWED_ACTIONS = new Set(["note", "flag", "approved"]);

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function answerMap(rows: Array<typeof answersTable.$inferSelect>): Map<number, string> {
  return new Map(rows.map(row => [row.questionId, row.value]));
}

function relevantQuestions(all: Array<typeof questionsTable.$inferSelect>, examTypeId: number) {
  return all.filter(question => Array.isArray(question.examTypeIds) && question.examTypeIds.includes(examTypeId));
}

async function loadWorkspace(caseId: number) {
  const [row] = await db.select({ case: casesTable, examType: examTypesTable })
    .from(casesTable)
    .leftJoin(examTypesTable, eq(casesTable.examTypeId, examTypesTable.id))
    .where(eq(casesTable.id, caseId))
    .limit(1);
  if (!row) return null;

  const [allQuestions, allAnswers, reviewActions] = await Promise.all([
    db.select().from(questionsTable).orderBy(questionsTable.section, questionsTable.orderIndex),
    db.select().from(answersTable).where(eq(answersTable.caseId, caseId)),
    db.select({
      id: caseReviewActionsTable.id,
      caseId: caseReviewActionsTable.caseId,
      action: caseReviewActionsTable.action,
      note: caseReviewActionsTable.note,
      reviewerId: caseReviewActionsTable.reviewerId,
      reviewerName: usersTable.name,
      reviewerEmail: usersTable.email,
      createdAt: caseReviewActionsTable.createdAt,
    })
      .from(caseReviewActionsTable)
      .leftJoin(usersTable, eq(caseReviewActionsTable.reviewerId, usersTable.id))
      .where(eq(caseReviewActionsTable.caseId, caseId))
      .orderBy(asc(caseReviewActionsTable.createdAt)),
  ]);

  const questions = relevantQuestions(allQuestions, row.case.examTypeId);
  const answers = answerMap(allAnswers);
  const visible = getVisibleQuestions(questions, answers);
  const visibleQuestions = questions.filter(question => visible.some(item => item.id === question.id));
  const groups = buildMedicalHistoryResponseGroups(
    visibleQuestions.map(question => ({
      id: question.id,
      text: question.text,
      section: question.section,
      orderIndex: question.orderIndex,
      required: question.required,
      followUpIds: question.followUpIds ?? [],
    })),
    answers,
  );

  return {
    caseRecord: row.case,
    examTypeName: row.examType?.name ?? "Medical History Questionnaire",
    groups,
    reviewActions,
  };
}

router.get("/cases/:id/review-workspace", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const caseId = Number(req.params.id);
  if (!Number.isFinite(caseId)) { res.status(400).json({ error: "Invalid case id" }); return; }

  const workspace = await loadWorkspace(caseId);
  if (!workspace) { res.status(404).json({ error: "Case not found" }); return; }

  const unansweredRoots = workspace.groups.filter(group => !group.sourceAnswer.trim()).length;
  const latestDisposition = [...workspace.reviewActions].reverse().find(action => action.action === "approved" || action.action === "flag") ?? null;
  res.json({
    case: {
      id: workspace.caseRecord.id,
      patientName: workspace.caseRecord.patientName,
      patientDob: workspace.caseRecord.patientDob ?? null,
      status: workspace.caseRecord.status,
      completionPercent: workspace.caseRecord.completionPercent,
      examTypeName: workspace.examTypeName,
    },
    responseGroups: workspace.groups,
    reviewActions: workspace.reviewActions.map(action => ({
      ...action,
      createdAt: action.createdAt.toISOString(),
    })),
    reviewSummary: {
      sourceQuestionCount: workspace.groups.length,
      unansweredSourceQuestions: unansweredRoots,
      latestDisposition: latestDisposition?.action ?? null,
      latestDispositionNote: latestDisposition?.note ?? null,
    },
  });
});

router.post("/cases/:id/review-actions", async (req, res): Promise<void> => {
  const reviewerId = await requireAuth(req, res);
  if (!reviewerId) return;
  const caseId = Number(req.params.id);
  const action = typeof req.body?.action === "string" ? req.body.action.trim().toLowerCase() : "";
  const note = typeof req.body?.note === "string" ? req.body.note.trim() : "";
  if (!Number.isFinite(caseId) || !ALLOWED_ACTIONS.has(action)) {
    res.status(400).json({ error: "action must be note, flag, or approved" });
    return;
  }
  if ((action === "note" || action === "flag") && !note) {
    res.status(400).json({ error: "A note is required for this review action" });
    return;
  }
  const [caseRecord] = await db.select().from(casesTable).where(eq(casesTable.id, caseId)).limit(1);
  if (!caseRecord) { res.status(404).json({ error: "Case not found" }); return; }

  const [created] = await db.insert(caseReviewActionsTable).values({
    caseId,
    reviewerId,
    action,
    note: note || null,
  }).returning();

  const [reviewer] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, reviewerId)).limit(1);
  await db.insert(auditLogsTable).values({
    userId: reviewerId,
    userEmail: reviewer?.email ?? null,
    userName: reviewer?.name ?? null,
    action: "update" as any,
    resource: "case",
    resourceId: String(caseId),
    details: `[examqa_review] ${action}${note ? `: ${note}` : ""}`,
    ipAddress: getClientIp(req),
    userAgent: req.headers["user-agent"] ?? null,
    phiAccessed: true,
    patientName: caseRecord.patientName,
  }).catch(() => undefined);

  res.status(201).json({
    id: created.id,
    caseId: created.caseId,
    action: created.action,
    note: created.note,
    reviewerId: created.reviewerId,
    reviewerName: reviewer?.name ?? null,
    reviewerEmail: reviewer?.email ?? null,
    createdAt: created.createdAt.toISOString(),
  });
});

router.get("/cases/:id/medical-history-response.pdf", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const caseId = Number(req.params.id);
  const workspace = await loadWorkspace(caseId);
  if (!workspace) { res.status(404).json({ error: "Case not found" }); return; }

  const safeName = workspace.caseRecord.patientName.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").slice(0, 50) || `case_${caseId}`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="Medical_History_Response_${safeName}_${caseId}.pdf"`);
  res.setHeader("Cache-Control", "private, no-store");

  const stream = generateMedicalHistoryResponsePdf({
    caseId,
    patientName: workspace.caseRecord.patientName,
    patientDob: workspace.caseRecord.patientDob ?? null,
    examTypeName: workspace.examTypeName,
    status: workspace.caseRecord.status,
    generatedAt: new Date(),
    groups: workspace.groups,
  });
  (stream as any).pipe(res);

  await db.insert(auditLogsTable).values({
    userId,
    action: "export" as any,
    resource: "case",
    resourceId: String(caseId),
    details: "[medical_history_response] Source-faithful response record PDF exported.",
    ipAddress: getClientIp(req),
    userAgent: req.headers["user-agent"] ?? null,
    phiAccessed: true,
    patientName: workspace.caseRecord.patientName,
  }).catch(() => undefined);
});

export default router;
