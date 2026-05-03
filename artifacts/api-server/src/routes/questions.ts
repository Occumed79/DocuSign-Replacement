import { Router, type IRouter } from "express";
import { db, questionsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import {
  ListQuestionsQueryParams,
  CreateQuestionBody,
  UpdateQuestionBody,
  UpdateQuestionParams,
  DeleteQuestionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/questions", async (req, res): Promise<void> => {
  const params = ListQuestionsQueryParams.safeParse(req.query);
  let allQuestions = await db.select().from(questionsTable).orderBy(asc(questionsTable.section), asc(questionsTable.orderIndex));

  if (params.success && params.data.exam_type_id) {
    const examTypeId = params.data.exam_type_id;
    allQuestions = allQuestions.filter(q =>
      Array.isArray(q.examTypeIds) && (q.examTypeIds as number[]).includes(examTypeId)
    );
  }

  res.json(allQuestions.map(q => ({
    id: q.id,
    text: q.text,
    answerType: q.answerType,
    required: q.required,
    section: q.section,
    orderIndex: q.orderIndex,
    examTypeIds: q.examTypeIds as number[],
    options: q.options as string[],
    triggerValue: q.triggerValue,
    followUpIds: q.followUpIds as number[],
    helpText: q.helpText,
  })));
});

router.post("/questions", async (req, res): Promise<void> => {
  const parsed = CreateQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [question] = await db.insert(questionsTable).values({
    text: parsed.data.text,
    answerType: parsed.data.answerType as "text" | "yes_no" | "dropdown" | "date" | "number" | "multi_select",
    required: parsed.data.required,
    section: parsed.data.section,
    orderIndex: parsed.data.orderIndex,
    examTypeIds: parsed.data.examTypeIds ?? [],
    options: parsed.data.options ?? [],
    triggerValue: parsed.data.triggerValue ?? null,
    followUpIds: parsed.data.followUpIds ?? [],
    helpText: parsed.data.helpText ?? null,
  }).returning();

  res.status(201).json({
    id: question.id,
    text: question.text,
    answerType: question.answerType,
    required: question.required,
    section: question.section,
    orderIndex: question.orderIndex,
    examTypeIds: question.examTypeIds as number[],
    options: question.options as string[],
    triggerValue: question.triggerValue,
    followUpIds: question.followUpIds as number[],
    helpText: question.helpText,
  });
});

router.patch("/questions/:id", async (req, res): Promise<void> => {
  const paramsResult = UpdateQuestionParams.safeParse(req.params);
  if (!paramsResult.success) {
    res.status(400).json({ error: paramsResult.error.message });
    return;
  }

  const parsed = UpdateQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.text !== undefined) updateData.text = parsed.data.text;
  if (parsed.data.answerType !== undefined) updateData.answerType = parsed.data.answerType;
  if (parsed.data.required !== undefined) updateData.required = parsed.data.required;
  if (parsed.data.section !== undefined) updateData.section = parsed.data.section;
  if (parsed.data.orderIndex !== undefined) updateData.orderIndex = parsed.data.orderIndex;
  if (parsed.data.examTypeIds !== undefined) updateData.examTypeIds = parsed.data.examTypeIds;
  if (parsed.data.options !== undefined) updateData.options = parsed.data.options;
  if ("triggerValue" in parsed.data) updateData.triggerValue = parsed.data.triggerValue ?? null;
  if (parsed.data.followUpIds !== undefined) updateData.followUpIds = parsed.data.followUpIds;
  if ("helpText" in parsed.data) updateData.helpText = parsed.data.helpText ?? null;

  const [question] = await db.update(questionsTable)
    .set(updateData)
    .where(eq(questionsTable.id, paramsResult.data.id))
    .returning();

  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  res.json({
    id: question.id,
    text: question.text,
    answerType: question.answerType,
    required: question.required,
    section: question.section,
    orderIndex: question.orderIndex,
    examTypeIds: question.examTypeIds as number[],
    options: question.options as string[],
    triggerValue: question.triggerValue,
    followUpIds: question.followUpIds as number[],
    helpText: question.helpText,
  });
});

router.delete("/questions/:id", async (req, res): Promise<void> => {
  const paramsResult = DeleteQuestionParams.safeParse(req.params);
  if (!paramsResult.success) {
    res.status(400).json({ error: paramsResult.error.message });
    return;
  }

  await db.delete(questionsTable).where(eq(questionsTable.id, paramsResult.data.id));
  res.sendStatus(204);
});

export default router;
