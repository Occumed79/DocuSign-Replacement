import { answersTable, casesTable, db, examTypesTable, questionsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
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

type ExpectedQuestionSnapshot = {
  orderIndex: number;
  text: string;
  answerType: string;
  required: boolean;
  section: string;
  options: string[];
  triggerValue: string | null;
  helpText: string | null;
  childOrderIndexes: number[];
};

type InstalledQuestionSnapshot = {
  id: number;
  orderIndex: number;
  text: string;
  answerType: string;
  required: boolean;
  section: string;
  options: string[];
  triggerValue: string | null;
  followUpIds: number[];
  helpText: string | null;
  examTypeIds: number[];
};

/**
 * Convert a built-in definition into the exact pre-order representation written
 * to the questions table. Persisted database IDs are intentionally excluded so
 * an installed tree can be compared to source definitions across deployments.
 */
export function buildExpectedQuestionSnapshot(
  definition: BuiltInMedicalFormDefinition,
): ExpectedQuestionSnapshot[] {
  const snapshot: ExpectedQuestionSnapshot[] = [];
  let orderIndex = 1;

  const visit = (question: BuiltInQuestionDefinition): number => {
    const followUps = question.followUps ?? [];
    const ownOrderIndex = orderIndex++;
    const row: ExpectedQuestionSnapshot = {
      orderIndex: ownOrderIndex,
      text: question.text,
      answerType: question.answerType ?? "text",
      required: question.required ?? true,
      section: question.section,
      options: question.options ?? [],
      triggerValue: followUps.length > 0
        ? (question.triggerValue ?? "yes")
        : (question.triggerValue ?? null),
      helpText: question.helpText ?? null,
      childOrderIndexes: [],
    };
    snapshot.push(row);

    for (const child of followUps) {
      row.childOrderIndexes.push(visit(child));
    }

    return ownOrderIndex;
  };

  for (const question of definition.questions) visit(question);
  return snapshot;
}

function arraysEqual<T>(left: T[], right: T[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/**
 * Compare an installed tree with a definition while normalizing follow-up IDs
 * back to stable order indexes. This avoids destructive rewrites when nothing
 * actually changed.
 */
export function installedQuestionSnapshotMatches(
  expected: ExpectedQuestionSnapshot[],
  installed: InstalledQuestionSnapshot[],
): boolean {
  if (expected.length !== installed.length) return false;

  const rows = [...installed].sort((a, b) => a.orderIndex - b.orderIndex);
  const orderById = new Map(rows.map(row => [row.id, row.orderIndex]));

  return expected.every((want, index) => {
    const have = rows[index];
    if (!have || have.orderIndex !== want.orderIndex) return false;

    const childOrderIndexes = have.followUpIds.map(id => orderById.get(id));
    if (childOrderIndexes.some(value => value === undefined)) return false;

    return have.text === want.text
      && have.answerType === want.answerType
      && have.required === want.required
      && have.section === want.section
      && arraysEqual(have.options ?? [], want.options)
      && have.triggerValue === want.triggerValue
      && have.helpText === want.helpText
      && arraysEqual(childOrderIndexes as number[], want.childOrderIndexes);
  });
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
