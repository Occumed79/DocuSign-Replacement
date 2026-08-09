import type { BuiltInMedicalFormDefinition, BuiltInQuestionDefinition } from "./types";

export type ExpectedQuestionSnapshot = {
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

export type InstalledQuestionSnapshot = {
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
