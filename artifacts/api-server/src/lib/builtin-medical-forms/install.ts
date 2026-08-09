import { db, examTypesTable, questionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { BuiltInMedicalFormDefinition, BuiltInQuestionDefinition } from "./types";

export interface InstalledMedicalForm {
  slug: string;
  examTypeId: number;
  created: boolean;
  questionCount: number;
}

export function validateBuiltInMedicalFormDefinition(definition: BuiltInMedicalFormDefinition): void {
  if (!definition.slug.trim()) throw new Error("Built-in medical form slug is required");
  if (!definition.name.trim()) throw new Error(`Built-in medical form ${definition.slug} is missing a name`);
  if (definition.questions.length === 0) throw new Error(`Built-in medical form ${definition.slug} has no questions`);

  const seen = new Set<string>();
  const visit = (question: BuiltInQuestionDefinition, ancestors: Set<string>) => {
    if (!question.key.trim()) throw new Error(`Built-in medical form ${definition.slug} contains a question without a key`);
    if (!question.text.trim()) throw new Error(`Built-in medical form ${definition.slug} question ${question.key} has no text`);
    if (seen.has(question.key)) throw new Error(`Duplicate built-in question key: ${question.key}`);
    if (ancestors.has(question.key)) throw new Error(`Cycle detected at built-in question key: ${question.key}`);

    seen.add(question.key);
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(question.key);
    for (const child of question.followUps ?? []) visit(child, nextAncestors);
  };

  for (const question of definition.questions) visit(question, new Set());
}

export async function ensureBuiltInMedicalForm(
  definition: BuiltInMedicalFormDefinition,
): Promise<InstalledMedicalForm> {
  validateBuiltInMedicalFormDefinition(definition);

  const [existing] = await db
    .select({ id: examTypesTable.id })
    .from(examTypesTable)
    .where(eq(examTypesTable.slug, definition.slug))
    .limit(1);

  if (existing) {
    const allQuestions = await db.select({ examTypeIds: questionsTable.examTypeIds }).from(questionsTable);
    const questionCount = allQuestions.filter(row =>
      Array.isArray(row.examTypeIds) && (row.examTypeIds as number[]).includes(existing.id),
    ).length;
    return { slug: definition.slug, examTypeId: existing.id, created: false, questionCount };
  }

  return db.transaction(async tx => {
    // Re-check inside the transaction so simultaneous startup attempts remain idempotent.
    const [raced] = await tx
      .select({ id: examTypesTable.id })
      .from(examTypesTable)
      .where(eq(examTypesTable.slug, definition.slug))
      .limit(1);

    if (raced) {
      return { slug: definition.slug, examTypeId: raced.id, created: false, questionCount: 0 };
    }

    const [examType] = await tx
      .insert(examTypesTable)
      .values({
        slug: definition.slug,
        name: definition.name,
        description: definition.description,
      })
      .returning({ id: examTypesTable.id });

    if (!examType) throw new Error(`Failed to create built-in medical form ${definition.slug}`);

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
          examTypeIds: [examType.id],
          options: question.options ?? [],
          triggerValue: followUps.length > 0 ? (question.triggerValue ?? "yes") : (question.triggerValue ?? null),
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

    return { slug: definition.slug, examTypeId: examType.id, created: true, questionCount };
  });
}
