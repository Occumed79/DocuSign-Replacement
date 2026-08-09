import { answersTable, casesTable, db, examTypesTable, questionsTable } from "@workspace/db";
import { eq, inArray, sql } from "drizzle-orm";
import { buildExpectedQuestionSnapshot, installedQuestionSnapshotMatches, type InstalledQuestionSnapshot } from "./install-snapshot";
import type { BuiltInMedicalFormDefinition, BuiltInQuestionDefinition } from "./types";
import { validateBuiltInMedicalFormDefinition } from "./validation";

export interface InstalledMedicalForm {
  slug: string;
  examTypeId: number;
  created: boolean;
  refreshed: boolean;
  questionCount: number;
  protectedCaseCount?: number;
  protectedAnswerCount?: number;
}

async function insertDefinitionQuestions(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  examTypeId: number,
  definition: BuiltInMedicalFormDefinition,
): Promise<number> {
  let orderIndex = 1;
  let questionCount = 0;

  const insertQuestion = async (question: BuiltInQuestionDefinition): Promise<number> => {
    const followUps = question.followUps ?? [];
    const [inserted] = await tx
      .insert(questionsTable)
      .values({
        text: question.text,
        answerType: question.answerType ?? "text",
        required: question.required ?? true,
        section: question.section,
        orderIndex: orderIndex++,
        examTypeIds: [examTypeId],
        options: question.options ?? [],
        triggerValue: followUps.length > 0
          ? (question.triggerValue ?? "yes")
          : (question.triggerValue ?? null),
        followUpIds: [],
        helpText: question.helpText ?? null,
      })
      .returning({ id: questionsTable.id });

    if (!inserted) throw new Error(`Failed to create built-in question ${question.key}`);
    questionCount++;

    const childIds: number[] = [];
    for (const child of followUps) childIds.push(await insertQuestion(child));

    if (childIds.length > 0) {
      await tx
        .update(questionsTable)
        .set({ followUpIds: childIds })
        .where(eq(questionsTable.id, inserted.id));
    }

    return inserted.id;
  };

  for (const question of definition.questions) await insertQuestion(question);
  return questionCount;
}

export async function ensureBuiltInMedicalForm(
  definition: BuiltInMedicalFormDefinition,
): Promise<InstalledMedicalForm> {
  validateBuiltInMedicalFormDefinition(definition);
  const expected = buildExpectedQuestionSnapshot(definition);

  return db.transaction(async tx => {
    // Render can briefly have more than one application instance alive during a
    // deploy. Serialize synchronization for the same built-in slug across all
    // database connections so two startup processes cannot both replace and
    // reinsert the same question tree.
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${definition.slug}, 0))`,
    );

    // This read intentionally happens AFTER the advisory lock. Under PostgreSQL
    // READ COMMITTED, a waiter then observes any refresh committed by the prior
    // holder and can return without inserting a duplicate tree.
    const [existing] = await tx
      .select({ id: examTypesTable.id })
      .from(examTypesTable)
      .where(eq(examTypesTable.slug, definition.slug))
      .limit(1);

    if (!existing) {
      const [examType] = await tx
        .insert(examTypesTable)
        .values({
          slug: definition.slug,
          name: definition.name,
          description: definition.description,
        })
        .returning({ id: examTypesTable.id });

      if (!examType) throw new Error(`Failed to create built-in medical form ${definition.slug}`);

      const questionCount = await insertDefinitionQuestions(tx, examType.id, definition);
      return {
        slug: definition.slug,
        examTypeId: examType.id,
        created: true,
        refreshed: false,
        questionCount,
      };
    }

    const allQuestions = await tx
      .select({
        id: questionsTable.id,
        orderIndex: questionsTable.orderIndex,
        text: questionsTable.text,
        answerType: questionsTable.answerType,
        required: questionsTable.required,
        section: questionsTable.section,
        options: questionsTable.options,
        triggerValue: questionsTable.triggerValue,
        followUpIds: questionsTable.followUpIds,
        helpText: questionsTable.helpText,
        examTypeIds: questionsTable.examTypeIds,
      })
      .from(questionsTable);

    const installed = allQuestions.filter(row =>
      Array.isArray(row.examTypeIds) && row.examTypeIds.includes(existing.id),
    ) as InstalledQuestionSnapshot[];

    if (installedQuestionSnapshotMatches(expected, installed)) {
      await tx
        .update(examTypesTable)
        .set({ name: definition.name, description: definition.description })
        .where(eq(examTypesTable.id, existing.id));

      return {
        slug: definition.slug,
        examTypeId: existing.id,
        created: false,
        refreshed: false,
        questionCount: installed.length,
      };
    }

    const sharedQuestion = installed.find(row =>
      row.examTypeIds.length !== 1 || row.examTypeIds[0] !== existing.id,
    );
    if (sharedQuestion) {
      throw new Error(
        `Cannot refresh built-in medical form ${definition.slug}: question ${sharedQuestion.id} is shared with another exam type`,
      );
    }

    const linkedCases = await tx
      .select({ id: casesTable.id })
      .from(casesTable)
      .where(eq(casesTable.examTypeId, existing.id));

    const questionIds = installed.map(row => row.id);
    const linkedAnswers = questionIds.length === 0
      ? []
      : await tx
          .select({ id: answersTable.id })
          .from(answersTable)
          .where(inArray(answersTable.questionId, questionIds));

    // Never destroy historical or in-progress answers just to update built-in
    // wording. A form with cases/answers must be explicitly versioned/migrated.
    if (linkedCases.length > 0 || linkedAnswers.length > 0) {
      return {
        slug: definition.slug,
        examTypeId: existing.id,
        created: false,
        refreshed: false,
        questionCount: installed.length,
        protectedCaseCount: linkedCases.length,
        protectedAnswerCount: linkedAnswers.length,
      };
    }

    if (questionIds.length > 0) {
      await tx.delete(questionsTable).where(inArray(questionsTable.id, questionIds));
    }

    await tx
      .update(examTypesTable)
      .set({ name: definition.name, description: definition.description })
      .where(eq(examTypesTable.id, existing.id));

    const questionCount = await insertDefinitionQuestions(tx, existing.id, definition);

    return {
      slug: definition.slug,
      examTypeId: existing.id,
      created: false,
      refreshed: true,
      questionCount,
    };
  });
}
