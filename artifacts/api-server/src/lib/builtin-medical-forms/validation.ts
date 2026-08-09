import type { BuiltInMedicalFormDefinition, BuiltInQuestionDefinition } from "./types";

export function validateBuiltInMedicalFormDefinition(definition: BuiltInMedicalFormDefinition): void {
  if (!definition.slug.trim()) throw new Error("Built-in medical form slug is required");
  if (!definition.name.trim()) throw new Error(`Built-in medical form ${definition.slug} is missing a name`);
  if (definition.questions.length === 0) throw new Error(`Built-in medical form ${definition.slug} has no questions`);

  const seen = new Set<string>();

  const visit = (question: BuiltInQuestionDefinition, ancestors: Set<string>) => {
    if (!question.key.trim()) throw new Error(`Built-in medical form ${definition.slug} contains a question without a key`);
    if (!question.text.trim()) throw new Error(`Built-in medical form ${definition.slug} question ${question.key} has no text`);
    if (ancestors.has(question.key)) throw new Error(`Cycle detected at built-in question key: ${question.key}`);
    if (seen.has(question.key)) throw new Error(`Duplicate built-in question key: ${question.key}`);

    seen.add(question.key);
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(question.key);
    for (const child of question.followUps ?? []) visit(child, nextAncestors);
  };

  for (const question of definition.questions) visit(question, new Set());
}
