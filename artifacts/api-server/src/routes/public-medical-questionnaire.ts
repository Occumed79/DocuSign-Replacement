import { Router, type IRouter, type Request } from "express";
import crypto from "crypto";
import { rateLimit } from "express-rate-limit";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  answersTable,
  auditLogsTable,
  caseAccessTokensTable,
  casesTable,
  db,
  examTypesTable,
  questionsTable,
  usersTable,
} from "@workspace/db";
import { requireAuth } from "../lib/require-auth";
import {
  getHiddenAnsweredQuestionIds,
  getRequiredMissing,
  getVisibleQuestions,
  isAnswered,
} from "../lib/reactive-interview";
import {
  isMedicalQuestionnaireEmailConfigured,
  sendMedicalQuestionnaireEmail,
} from "../lib/medical-questionnaire-email";

const router: IRouter = Router();
const SESSION_TTL_MS = 60 * 60 * 1000;

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification attempts. Please try again later." },
});

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function randomToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function getBaseUrl(req: Request): string {
  const explicit = process.env.APP_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const domains = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  if (domains) return `https://${domains}`;
  const dev = process.env.REPLIT_DEV_DOMAIN?.trim();
  if (dev) return `https://${dev}`;
  return `${req.protocol}://${req.headers.host ?? "localhost"}`;
}

function normalizeDob(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : "";
  if (iso) return iso;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;
  return parsed.toISOString().slice(0, 10);
}

function maskName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.length <= 1 ? `${part}*` : `${part[0]}${"*".repeat(Math.min(part.length - 1, 5))}`)
    .join(" ");
}

function answerMap(rows: Array<typeof answersTable.$inferSelect>): Map<number, string> {
  return new Map(rows.map(row => [row.questionId, row.value]));
}

function relevantQuestions(all: Array<typeof questionsTable.$inferSelect>, examTypeId: number) {
  return all.filter(question => Array.isArray(question.examTypeIds) && question.examTypeIds.includes(examTypeId));
}

function completionFor(questions: Array<typeof questionsTable.$inferSelect>, answers: Map<number, string>) {
  const visible = getVisibleQuestions(questions, answers);
  const required = visible.filter(question => question.required);
  const answeredRequired = required.filter(question => isAnswered(answers.get(question.id))).length;
  const completionPercent = required.length ? Math.round((answeredRequired / required.length) * 100) : 100;
  return { visible, required, completionPercent };
}

async function audit(params: {
  userId?: number | null;
  action: string;
  caseId: number;
  details: string;
  req: Request;
}) {
  await db.insert(auditLogsTable).values({
    userId: params.userId ?? null,
    action: params.action as any,
    resource: "case",
    resourceId: String(params.caseId),
    details: `[medical_questionnaire] ${params.details}`,
    ipAddress: getClientIp(params.req),
    userAgent: params.req.headers["user-agent"] ?? null,
    phiAccessed: true,
  }).catch(() => undefined);
}

async function findInvitation(rawToken: string) {
  const [row] = await db.select().from(caseAccessTokensTable)
    .where(eq(caseAccessTokensTable.tokenHash, sha256(rawToken)))
    .limit(1);
  return row ?? null;
}

function invitationUnavailable(invitation: typeof caseAccessTokensTable.$inferSelect | null): string | null {
  if (!invitation) return "Invalid questionnaire link";
  if (invitation.revokedAt) return "This questionnaire link has been revoked";
  if (invitation.submittedAt) return "This questionnaire has already been submitted";
  if (invitation.tokenExpiresAt < new Date()) return "This questionnaire link has expired";
  return null;
}

async function requireQuestionnaireSession(req: Request, rawToken: string) {
  const invitation = await findInvitation(rawToken);
  const unavailable = invitationUnavailable(invitation);
  if (unavailable || !invitation) return { ok: false as const, status: unavailable?.includes("expired") ? 410 : unavailable?.includes("submitted") ? 409 : 404, error: unavailable ?? "Invalid questionnaire link" };

  const session = req.headers["x-questionnaire-session"];
  if (typeof session !== "string" || !session) return { ok: false as const, status: 401, error: "Questionnaire verification is required" };
  if (!invitation.verificationSessionHash || invitation.verificationSessionHash !== sha256(session)) {
    return { ok: false as const, status: 401, error: "Questionnaire verification session is invalid" };
  }
  if (!invitation.verificationExpiresAt || invitation.verificationExpiresAt < new Date()) {
    return { ok: false as const, status: 401, error: "Questionnaire verification session has expired" };
  }
  return { ok: true as const, invitation };
}

// ─── Internal invitation management ─────────────────────────────────────────

router.post("/cases/:id/questionnaire-invitations", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const caseId = Number(req.params.id);
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!Number.isFinite(caseId) || !/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400).json({ error: "A valid case and email address are required" });
    return;
  }

  const [row] = await db.select({ case: casesTable, examType: examTypesTable })
    .from(casesTable)
    .leftJoin(examTypesTable, eq(casesTable.examTypeId, examTypesTable.id))
    .where(eq(casesTable.id, caseId))
    .limit(1);
  if (!row) { res.status(404).json({ error: "Case not found" }); return; }

  const expiryDays = Math.min(Math.max(Number(req.body?.expiryDays) || 7, 1), 30);
  const token = randomToken();
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

  // A newly issued link supersedes prior unsubmitted invitations for this case.
  await db.update(caseAccessTokensTable)
    .set({ revokedAt: new Date() })
    .where(eq(caseAccessTokensTable.caseId, caseId));

  const [invitation] = await db.insert(caseAccessTokensTable).values({
    caseId,
    email,
    tokenHash: sha256(token),
    tokenExpiresAt: expiresAt,
    createdById: userId,
  }).returning();

  const examTypeName = row.examType?.name ?? "Medical History Questionnaire";
  const delivery = await sendMedicalQuestionnaireEmail({
    recipientName: row.case.patientName,
    recipientEmail: email,
    examTypeName,
    questionnaireToken: token,
    expiresAt,
    baseUrl: getBaseUrl(req),
  });
  const [user] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  await audit({
    userId,
    action: "create",
    caseId,
    details: `${user?.name ?? user?.email ?? "User"} issued questionnaire invitation to ${email}; delivery ${delivery.sent ? "sent" : `failed: ${delivery.error ?? "unknown"}`}.`,
    req,
  });

  res.status(201).json({
    id: invitation.id,
    email,
    expiresAt: expiresAt.toISOString(),
    emailConfigured: isMedicalQuestionnaireEmailConfigured(),
    emailSent: delivery.sent,
    emailError: delivery.error ?? null,
    inviteUrl: `${getBaseUrl(req)}/questionnaire/${token}`,
  });
});

router.get("/cases/:id/questionnaire-invitations", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const rows = await db.select().from(caseAccessTokensTable)
    .where(eq(caseAccessTokensTable.caseId, Number(req.params.id)))
    .orderBy(desc(caseAccessTokensTable.createdAt));
  res.json(rows.map(row => ({
    id: row.id,
    email: row.email,
    expiresAt: row.tokenExpiresAt.toISOString(),
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  })));
});

router.post("/cases/:id/questionnaire-invitations/:invitationId/revoke", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const caseId = Number(req.params.id);
  const invitationId = Number(req.params.invitationId);
  const [updated] = await db.update(caseAccessTokensTable).set({ revokedAt: new Date() })
    .where(and(eq(caseAccessTokensTable.id, invitationId), eq(caseAccessTokensTable.caseId, caseId)))
    .returning({ id: caseAccessTokensTable.id });
  if (!updated) { res.status(404).json({ error: "Invitation not found" }); return; }
  await audit({ userId, action: "update", caseId, details: `Questionnaire invitation ${invitationId} revoked.`, req });
  res.json({ revoked: true });
});

// ─── Public questionnaire ────────────────────────────────────────────────────

router.get("/medical-questionnaire/:token", async (req, res): Promise<void> => {
  const invitation = await findInvitation(req.params.token as string);
  const unavailable = invitationUnavailable(invitation);
  if (unavailable || !invitation) {
    res.status(unavailable?.includes("expired") ? 410 : unavailable?.includes("submitted") ? 409 : 404).json({ error: unavailable ?? "Invalid questionnaire link" });
    return;
  }
  const [row] = await db.select({ case: casesTable, examType: examTypesTable })
    .from(casesTable)
    .leftJoin(examTypesTable, eq(casesTable.examTypeId, examTypesTable.id))
    .where(eq(casesTable.id, invitation.caseId))
    .limit(1);
  if (!row) { res.status(404).json({ error: "Questionnaire unavailable" }); return; }
  res.setHeader("Cache-Control", "private, no-store");
  res.json({
    maskedName: maskName(row.case.patientName),
    examTypeName: row.examType?.name ?? "Medical History Questionnaire",
    requiresDob: Boolean(row.case.patientDob),
    expiresAt: invitation.tokenExpiresAt.toISOString(),
  });
});

router.post("/medical-questionnaire/:token/verify", verifyLimiter, async (req, res): Promise<void> => {
  const invitation = await findInvitation(req.params.token as string);
  const unavailable = invitationUnavailable(invitation);
  if (unavailable || !invitation) {
    res.status(unavailable?.includes("expired") ? 410 : unavailable?.includes("submitted") ? 409 : 404).json({ error: unavailable ?? "Invalid questionnaire link" });
    return;
  }
  const [row] = await db.select({ case: casesTable, examType: examTypesTable })
    .from(casesTable)
    .leftJoin(examTypesTable, eq(casesTable.examTypeId, examTypesTable.id))
    .where(eq(casesTable.id, invitation.caseId))
    .limit(1);
  if (!row) { res.status(404).json({ error: "Questionnaire unavailable" }); return; }

  if (row.case.patientDob) {
    const supplied = normalizeDob(req.body?.patientDob);
    const expected = normalizeDob(row.case.patientDob);
    if (!supplied || supplied !== expected) {
      await audit({ action: "permission_denied", caseId: row.case.id, details: "Public questionnaire DOB verification failed.", req });
      res.status(403).json({ error: "The date of birth did not match our records" });
      return;
    }
  }

  const sessionToken = randomToken();
  const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.update(caseAccessTokensTable).set({
    verificationSessionHash: sha256(sessionToken),
    verificationExpiresAt: sessionExpiresAt,
    verifiedAt: new Date(),
  }).where(eq(caseAccessTokensTable.id, invitation.id));
  await audit({ action: "view", caseId: row.case.id, details: "Public questionnaire identity verification succeeded.", req });

  res.setHeader("Cache-Control", "private, no-store");
  res.json({
    sessionToken,
    sessionExpiresAt: sessionExpiresAt.toISOString(),
    caseId: row.case.id,
    patientName: row.case.patientName,
    examTypeName: row.examType?.name ?? "Medical History Questionnaire",
  });
});

router.get("/medical-questionnaire/:token/questions", async (req, res): Promise<void> => {
  const auth = await requireQuestionnaireSession(req, req.params.token as string);
  if (!auth.ok) { res.status(auth.status).json({ error: auth.error }); return; }
  const [caseRecord] = await db.select().from(casesTable).where(eq(casesTable.id, auth.invitation.caseId)).limit(1);
  if (!caseRecord) { res.status(404).json({ error: "Questionnaire unavailable" }); return; }

  const allQuestions = await db.select().from(questionsTable).orderBy(questionsTable.section, questionsTable.orderIndex);
  const questions = relevantQuestions(allQuestions, caseRecord.examTypeId);
  const saved = await db.select().from(answersTable).where(eq(answersTable.caseId, caseRecord.id));
  const answersByQuestion = answerMap(saved);
  const { visible, completionPercent } = completionFor(questions, answersByQuestion);

  res.setHeader("Cache-Control", "private, no-store");
  res.json({
    questions: questions.map(q => ({
      id: q.id,
      text: q.text,
      answerType: q.answerType,
      required: q.required,
      section: q.section,
      orderIndex: q.orderIndex,
      options: q.options ?? [],
      triggerValue: q.triggerValue,
      followUpIds: q.followUpIds ?? [],
      helpText: q.helpText,
    })),
    answers: saved.map(answer => ({ questionId: answer.questionId, value: answer.value })),
    visibleQuestionIds: visible.map(q => q.id),
    completionPercent,
    status: caseRecord.status,
  });
});

router.put("/medical-questionnaire/:token/answers", async (req, res): Promise<void> => {
  const auth = await requireQuestionnaireSession(req, req.params.token as string);
  if (!auth.ok) { res.status(auth.status).json({ error: auth.error }); return; }
  const [caseRecord] = await db.select().from(casesTable).where(eq(casesTable.id, auth.invitation.caseId)).limit(1);
  if (!caseRecord) { res.status(404).json({ error: "Questionnaire unavailable" }); return; }

  const incoming = Array.isArray(req.body?.answers) ? req.body.answers : [];
  for (const item of incoming) {
    const questionId = Number(item?.questionId);
    const value = typeof item?.value === "string" ? item.value : "";
    if (!Number.isFinite(questionId)) continue;
    await db.insert(answersTable).values({ caseId: caseRecord.id, questionId, value }).onConflictDoUpdate({
      target: [answersTable.caseId, answersTable.questionId],
      set: { value, updatedAt: new Date() },
    });
  }

  const allQuestions = await db.select().from(questionsTable).orderBy(questionsTable.section, questionsTable.orderIndex);
  const questions = relevantQuestions(allQuestions, caseRecord.examTypeId);
  let saved = await db.select().from(answersTable).where(eq(answersTable.caseId, caseRecord.id));
  let answersByQuestion = answerMap(saved);

  const staleHidden = getHiddenAnsweredQuestionIds(questions, answersByQuestion);
  if (staleHidden.length > 0) {
    await db.delete(answersTable).where(and(eq(answersTable.caseId, caseRecord.id), inArray(answersTable.questionId, staleHidden)));
    saved = await db.select().from(answersTable).where(eq(answersTable.caseId, caseRecord.id));
    answersByQuestion = answerMap(saved);
  }

  const { completionPercent } = completionFor(questions, answersByQuestion);
  const nextStatus = completionPercent === 100 ? "complete" : completionPercent > 0 ? "in_progress" : "draft";
  await db.update(casesTable).set({ completionPercent, status: nextStatus as any }).where(eq(casesTable.id, caseRecord.id));
  await audit({ action: "update", caseId: caseRecord.id, details: `Public questionnaire responses saved; completion ${completionPercent}%.`, req });

  res.json({
    answers: saved.map(answer => ({ questionId: answer.questionId, value: answer.value })),
    completionPercent,
  });
});

router.post("/medical-questionnaire/:token/submit", async (req, res): Promise<void> => {
  const auth = await requireQuestionnaireSession(req, req.params.token as string);
  if (!auth.ok) { res.status(auth.status).json({ error: auth.error }); return; }
  const [caseRecord] = await db.select().from(casesTable).where(eq(casesTable.id, auth.invitation.caseId)).limit(1);
  if (!caseRecord) { res.status(404).json({ error: "Questionnaire unavailable" }); return; }

  const allQuestions = await db.select().from(questionsTable).orderBy(questionsTable.section, questionsTable.orderIndex);
  const questions = relevantQuestions(allQuestions, caseRecord.examTypeId);
  const saved = await db.select().from(answersTable).where(eq(answersTable.caseId, caseRecord.id));
  const answersByQuestion = answerMap(saved);
  const missing = getRequiredMissing(questions, answersByQuestion);
  if (missing.length > 0) {
    res.status(409).json({ error: "Required questionnaire responses are still missing", missingQuestionIds: missing.map(q => q.id) });
    return;
  }

  await db.transaction(async tx => {
    await tx.update(casesTable).set({ status: "submitted", completionPercent: 100 }).where(eq(casesTable.id, caseRecord.id));
    await tx.update(caseAccessTokensTable).set({ submittedAt: new Date(), verificationSessionHash: null, verificationExpiresAt: null }).where(eq(caseAccessTokensTable.id, auth.invitation.id));
  });
  await audit({ action: "update", caseId: caseRecord.id, details: "Public medical history questionnaire submitted for ExamQA review.", req });
  res.json({ submitted: true });
});

export default router;
