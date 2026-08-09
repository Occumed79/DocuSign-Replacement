import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/require-auth";
import { db, casesTable, examTypesTable, answersTable, questionsTable } from "@workspace/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import {
  ListCasesQueryParams,
  CreateCaseBody,
  GetCaseParams,
  UpdateCaseParams,
  UpdateCaseBody,
  DeleteCaseParams,
  GetCaseAnswersParams,
  UpsertCaseAnswersParams,
  UpsertCaseAnswersBody,
  GetCaseReviewParams,
} from "@workspace/api-zod";
import {
  getHiddenAnsweredQuestionIds,
  getRequiredMissing,
  getVisibleQuestions,
  isAnswered,
} from "../lib/reactive-interview";

const router: IRouter = Router();

function formatCase(c: typeof casesTable.$inferSelect, examTypeName: string) {
  return {
    id: c.id,
    patientName: c.patientName,
    patientDob: c.patientDob ?? null,
    examTypeId: c.examTypeId,
    examTypeName,
    status: c.status,
    completionPercent: c.completionPercent,
    createdById: c.createdById ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function answerMapFromRows(rows: Array<typeof answersTable.$inferSelect>): Map<number, string> {
  return new Map(rows.map(answer => [answer.questionId, answer.value]));
}

function relevantQuestionsForExam(
  questions: Array<typeof questionsTable.$inferSelect>,
  examTypeId: number,
) {
  return questions.filter(question =>
    Array.isArray(question.examTypeIds) && (question.examTypeIds as number[]).includes(examTypeId)
  );
}

function calculateCompletion(
  questions: Array<typeof questionsTable.$inferSelect>,
  answers: Map<number, string>,
) {
  const visibleQuestions = getVisibleQuestions(questions, answers);
  const requiredQuestions = visibleQuestions.filter(question => question.required);
  const answeredRequired = requiredQuestions.filter(question => isAnswered(answers.get(question.id))).length;
  const completionPercent = requiredQuestions.length > 0
    ? Math.round((answeredRequired / requiredQuestions.length) * 100)
    : 100;

  return { visibleQuestions, requiredQuestions, answeredRequired, completionPercent };
}

router.get("/cases", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const params = ListCasesQueryParams.safeParse(req.query);

  let query = db
    .select({
      case: casesTable,
      examType: examTypesTable,
    })
    .from(casesTable)
    .leftJoin(examTypesTable, eq(casesTable.examTypeId, examTypesTable.id))
    .orderBy(desc(casesTable.updatedAt));

  const results = await query;

  let filtered = results;
  if (params.success) {
    if (params.data.status) {
      filtered = filtered.filter(r => r.case.status === params.data.status);
    }
    if (params.data.exam_type_id) {
      filtered = filtered.filter(r => r.case.examTypeId === params.data.exam_type_id);
    }
  }

  res.json(filtered.map(r => formatCase(r.case, r.examType?.name ?? "Unknown")));
});

router.post("/cases", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const parsed = CreateCaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [examType] = await db.select().from(examTypesTable).where(eq(examTypesTable.id, parsed.data.examTypeId));
  if (!examType) {
    res.status(400).json({ error: "Invalid exam type" });
    return;
  }

  const [newCase] = await db.insert(casesTable).values({
    patientName: parsed.data.patientName,
    patientDob: parsed.data.patientDob ?? null,
    examTypeId: parsed.data.examTypeId,
    status: "draft",
    completionPercent: 0,
    createdById: userId,
  }).returning();

  res.status(201).json(formatCase(newCase, examType.name));
});

router.get("/cases/:id", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const paramsResult = GetCaseParams.safeParse(req.params);
  if (!paramsResult.success) {
    res.status(400).json({ error: paramsResult.error.message });
    return;
  }

  const [result] = await db
    .select({ case: casesTable, examType: examTypesTable })
    .from(casesTable)
    .leftJoin(examTypesTable, eq(casesTable.examTypeId, examTypesTable.id))
    .where(eq(casesTable.id, paramsResult.data.id));

  if (!result) {
    res.status(404).json({ error: "Case not found" });
    return;
  }

  res.json(formatCase(result.case, result.examType?.name ?? "Unknown"));
});

router.patch("/cases/:id", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const paramsResult = UpdateCaseParams.safeParse(req.params);
  if (!paramsResult.success) {
    res.status(400).json({ error: paramsResult.error.message });
    return;
  }

  const parsed = UpdateCaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.patientName !== undefined) updateData.patientName = parsed.data.patientName;
  if ("patientDob" in parsed.data) updateData.patientDob = parsed.data.patientDob ?? null;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.examTypeId !== undefined) updateData.examTypeId = parsed.data.examTypeId;

  const [updatedCase] = await db.update(casesTable)
    .set(updateData)
    .where(eq(casesTable.id, paramsResult.data.id))
    .returning();

  if (!updatedCase) {
    res.status(404).json({ error: "Case not found" });
    return;
  }

  const [examType] = await db.select().from(examTypesTable).where(eq(examTypesTable.id, updatedCase.examTypeId));
  res.json(formatCase(updatedCase, examType?.name ?? "Unknown"));
});

router.delete("/cases/:id", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const paramsResult = DeleteCaseParams.safeParse(req.params);
  if (!paramsResult.success) {
    res.status(400).json({ error: paramsResult.error.message });
    return;
  }

  await db.delete(casesTable).where(eq(casesTable.id, paramsResult.data.id));
  res.sendStatus(204);
});

// --- ANSWERS ---

router.get("/cases/:id/answers", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const paramsResult = GetCaseAnswersParams.safeParse(req.params);
  if (!paramsResult.success) {
    res.status(400).json({ error: paramsResult.error.message });
    return;
  }

  const answers = await db.select().from(answersTable)
    .where(eq(answersTable.caseId, paramsResult.data.id));

  res.json(answers.map(a => ({
    id: a.id,
    caseId: a.caseId,
    questionId: a.questionId,
    value: a.value,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  })));
});

router.put("/cases/:id/answers", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const paramsResult = UpsertCaseAnswersParams.safeParse(req.params);
  if (!paramsResult.success) {
    res.status(400).json({ error: paramsResult.error.message });
    return;
  }

  const parsed = UpsertCaseAnswersBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const caseId = paramsResult.data.id;

  // Upsert currently supplied answers first. A parent answer may change from
  // yes -> no, so visibility must be calculated from the newly persisted state.
  for (const ans of parsed.data.answers) {
    await db.insert(answersTable).values({
      caseId,
      questionId: ans.questionId,
      value: ans.value,
    }).onConflictDoUpdate({
      target: [answersTable.caseId, answersTable.questionId],
      set: { value: ans.value, updatedAt: new Date() },
    });
  }

  const [caseRecord] = await db.select().from(casesTable).where(eq(casesTable.id, caseId));
  if (!caseRecord) {
    res.status(404).json({ error: "Case not found" });
    return;
  }

  const allQuestions = await db.select().from(questionsTable)
    .orderBy(questionsTable.section, questionsTable.orderIndex);
  const relevantQuestions = relevantQuestionsForExam(allQuestions, caseRecord.examTypeId);

  let allAnswers = await db.select().from(answersTable).where(eq(answersTable.caseId, caseId));
  let answersByQuestion = answerMapFromRows(allAnswers);

  // Critical adaptive behavior: if a user changes a parent answer so a branch
  // is no longer applicable, discard the stale descendant answers. Otherwise a
  // previous "yes" explanation can leak into review/PDF output after the user
  // has changed the answer to "no".
  const hiddenAnsweredIds = getHiddenAnsweredQuestionIds(relevantQuestions, answersByQuestion);
  if (hiddenAnsweredIds.length > 0) {
    await db.delete(answersTable).where(and(
      eq(answersTable.caseId, caseId),
      inArray(answersTable.questionId, hiddenAnsweredIds),
    ));
    allAnswers = await db.select().from(answersTable).where(eq(answersTable.caseId, caseId));
    answersByQuestion = answerMapFromRows(allAnswers);
  }

  // Completion is based on REQUIRED QUESTIONS THAT ARE ACTUALLY VISIBLE.
  // A "no" answer should not leave hidden follow-ups counting against 100%.
  const { completionPercent } = calculateCompletion(relevantQuestions, answersByQuestion);
  const newStatus = completionPercent === 100 ? "complete" : completionPercent > 0 ? "in_progress" : "draft";

  await db.update(casesTable)
    .set({ completionPercent, status: newStatus as "draft" | "in_progress" | "complete" | "submitted" })
    .where(eq(casesTable.id, caseId));

  res.json(allAnswers.map(a => ({
    id: a.id,
    caseId: a.caseId,
    questionId: a.questionId,
    value: a.value,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  })));
});

// --- REVIEW ---

router.get("/cases/:id/review", async (req, res): Promise<void> => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const paramsResult = GetCaseReviewParams.safeParse(req.params);
  if (!paramsResult.success) {
    res.status(400).json({ error: paramsResult.error.message });
    return;
  }

  const [caseRecord] = await db.select().from(casesTable).where(eq(casesTable.id, paramsResult.data.id));
  if (!caseRecord) {
    res.status(404).json({ error: "Case not found" });
    return;
  }

  const allQuestions = await db.select().from(questionsTable).orderBy(questionsTable.section, questionsTable.orderIndex);
  const relevantQuestions = relevantQuestionsForExam(allQuestions, caseRecord.examTypeId);

  const allAnswers = await db.select().from(answersTable).where(eq(answersTable.caseId, paramsResult.data.id));
  const answersByQuestion = answerMapFromRows(allAnswers);
  const { visibleQuestions, requiredQuestions, completionPercent } = calculateCompletion(relevantQuestions, answersByQuestion);
  const requiredMissingQuestions = getRequiredMissing(relevantQuestions, answersByQuestion);

  const requiredMissing = requiredMissingQuestions.map(q => ({
    questionId: q.id,
    questionText: q.text,
    section: q.section,
    required: q.required,
  }));

  // Group ONLY ACTIVE interview questions by section. Hidden branches are not
  // missing work and should not appear as incomplete on review.
  const sectionMap = new Map<string, { total: number; answered: number }>();
  for (const q of visibleQuestions) {
    const existing = sectionMap.get(q.section) ?? { total: 0, answered: 0 };
    existing.total++;
    if (isAnswered(answersByQuestion.get(q.id))) existing.answered++;
    sectionMap.set(q.section, existing);
  }

  const sections = Array.from(sectionMap.entries()).map(([name, stats]) => ({
    name,
    total: stats.total,
    answered: stats.answered,
    complete: stats.answered === stats.total,
  }));

  const totalQuestions = visibleQuestions.length;
  const answeredQuestions = visibleQuestions.filter(q => isAnswered(answersByQuestion.get(q.id))).length;

  const recommendations: string[] = [];
  if (requiredMissing.length > 0) {
    recommendations.push(`Complete ${requiredMissing.length} required adaptive interview field(s) before submission.`);
  }
  if (completionPercent < 50) {
    recommendations.push("More than half of the required interview remains. Continue through each applicable section.");
  }
  if (completionPercent === 100) {
    recommendations.push("All required applicable questions are complete. Ready for ExamQA review.");
  }
  for (const section of sections.filter(s => !s.complete)) {
    recommendations.push(`Section "${section.name}" has ${section.total - section.answered} applicable unanswered question(s).`);
  }

  res.json({
    caseId: caseRecord.id,
    totalQuestions,
    answeredQuestions,
    requiredMissing,
    completionPercent,
    sections,
    recommendations,
  });
});

export default router;
