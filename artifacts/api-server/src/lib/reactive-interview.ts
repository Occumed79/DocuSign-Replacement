export interface ReactiveQuestion {
  id: number;
  required: boolean;
  section: string;
  orderIndex: number;
  triggerValue: string | null;
  followUpIds: number[];
}

export type ReactiveAnswerMap = ReadonlyMap<number, string>;

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function isAnswered(value: string | null | undefined): boolean {
  return normalize(value) !== "";
}

export function answerTriggers(question: ReactiveQuestion, answer: string | null | undefined): boolean {
  const actual = normalize(answer);
  if (!actual) return false;

  const configured = normalize(question.triggerValue);
  if (!configured) return false;
  if (configured === "*") return true;

  // Allow a future form definition to express alternate trigger values as
  // "yes|positive|current" without changing the API shape.
  const accepted = configured.split("|").map(value => value.trim()).filter(Boolean);
  return accepted.includes(actual);
}

export function buildParentIndex(questions: ReactiveQuestion[]): Map<number, ReactiveQuestion[]> {
  const byId = new Map(questions.map(question => [question.id, question]));
  const parents = new Map<number, ReactiveQuestion[]>();

  for (const parent of questions) {
    for (const childId of parent.followUpIds ?? []) {
      if (!byId.has(childId)) continue;
      const existing = parents.get(childId) ?? [];
      existing.push(parent);
      parents.set(childId, existing);
    }
  }

  return parents;
}

export function getVisibleQuestionIds(
  questions: ReactiveQuestion[],
  answers: ReactiveAnswerMap,
): Set<number> {
  const byId = new Map(questions.map(question => [question.id, question]));
  const parents = buildParentIndex(questions);
  const memo = new Map<number, boolean>();

  const isVisible = (questionId: number, stack: Set<number>): boolean => {
    const cached = memo.get(questionId);
    if (cached !== undefined) return cached;

    // Bad form configuration must never recurse forever. Treat the cyclic
    // branch as hidden until an administrator fixes the form definition.
    if (stack.has(questionId)) {
      memo.set(questionId, false);
      return false;
    }

    const question = byId.get(questionId);
    if (!question) return false;

    const questionParents = parents.get(questionId) ?? [];
    if (questionParents.length === 0) {
      memo.set(questionId, true);
      return true;
    }

    const nextStack = new Set(stack);
    nextStack.add(questionId);

    // OR semantics are intentional: a shared follow-up can be activated by
    // more than one positive parent condition.
    const visible = questionParents.some(parent =>
      isVisible(parent.id, nextStack) && answerTriggers(parent, answers.get(parent.id)),
    );

    memo.set(questionId, visible);
    return visible;
  };

  const visible = new Set<number>();
  for (const question of questions) {
    if (isVisible(question.id, new Set())) visible.add(question.id);
  }
  return visible;
}

export function getVisibleQuestions<T extends ReactiveQuestion>(
  questions: T[],
  answers: ReactiveAnswerMap,
): T[] {
  const visibleIds = getVisibleQuestionIds(questions, answers);
  return questions.filter(question => visibleIds.has(question.id));
}

export function getHiddenAnsweredQuestionIds(
  questions: ReactiveQuestion[],
  answers: ReactiveAnswerMap,
): number[] {
  const visibleIds = getVisibleQuestionIds(questions, answers);
  return questions
    .filter(question => !visibleIds.has(question.id) && isAnswered(answers.get(question.id)))
    .map(question => question.id);
}

export function getRequiredMissing<T extends ReactiveQuestion>(
  questions: T[],
  answers: ReactiveAnswerMap,
): T[] {
  return getVisibleQuestions(questions, answers)
    .filter(question => question.required && !isAnswered(answers.get(question.id)));
}
