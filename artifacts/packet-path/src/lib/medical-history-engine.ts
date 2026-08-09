import type { Question } from "@workspace/api-client-react";

export type InterviewAnswers = Record<number, string>;

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function isAnswered(value: string | null | undefined): boolean {
  return normalize(value) !== "";
}

export function answerTriggers(question: Question, answer: string | null | undefined): boolean {
  const actual = normalize(answer);
  if (!actual) return false;

  const configured = normalize(question.triggerValue);
  if (!configured) return false;
  if (configured === "*") return true;

  return configured
    .split("|")
    .map(value => value.trim())
    .filter(Boolean)
    .includes(actual);
}

export function buildParentIndex(questions: Question[]): Map<number, Question[]> {
  const byId = new Map(questions.map(question => [question.id, question]));
  const parents = new Map<number, Question[]>();

  questions.forEach(parent => {
    (parent.followUpIds ?? []).forEach(childId => {
      if (!byId.has(childId)) return;
      const existing = parents.get(childId) ?? [];
      existing.push(parent);
      parents.set(childId, existing);
    });
  });

  return parents;
}

export function getVisibleQuestionIds(questions: Question[], answers: InterviewAnswers): Set<number> {
  const byId = new Map(questions.map(question => [question.id, question]));
  const parents = buildParentIndex(questions);
  const memo = new Map<number, boolean>();

  const isVisible = (questionId: number, stack: Set<number>): boolean => {
    const cached = memo.get(questionId);
    if (cached !== undefined) return cached;
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
    const visible = questionParents.some(parent =>
      isVisible(parent.id, nextStack) && answerTriggers(parent, answers[parent.id]),
    );
    memo.set(questionId, visible);
    return visible;
  };

  const visibleIds = new Set<number>();
  questions.forEach(question => {
    if (isVisible(question.id, new Set())) visibleIds.add(question.id);
  });
  return visibleIds;
}

export function getInterviewSequence(questions: Question[], answers: InterviewAnswers): Question[] {
  const visibleIds = getVisibleQuestionIds(questions, answers);
  const parents = buildParentIndex(questions);
  const byId = new Map(questions.map(question => [question.id, question]));
  const order = new Map(questions.map((question, index) => [question.id, index]));
  const result: Question[] = [];
  const emitted = new Set<number>();

  const append = (question: Question) => {
    if (!visibleIds.has(question.id) || emitted.has(question.id)) return;
    emitted.add(question.id);
    result.push(question);

    const children = (question.followUpIds ?? [])
      .map(id => byId.get(id))
      .filter((child): child is Question => Boolean(child) && visibleIds.has(child!.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

    children.forEach(append);
  };

  // Start with true roots, preserving the API/database order. Follow-ups are
  // inserted immediately after the answer that activated them, TurboTax-style.
  questions
    .filter(question => visibleIds.has(question.id) && !(parents.get(question.id)?.length))
    .forEach(append);

  // Defensive fallback for malformed/shared configurations.
  questions.filter(question => visibleIds.has(question.id)).forEach(append);
  return result;
}

export function pruneHiddenAnswers(questions: Question[], answers: InterviewAnswers): InterviewAnswers {
  const visibleIds = getVisibleQuestionIds(questions, answers);
  const next: InterviewAnswers = {};
  Object.entries(answers).forEach(([rawId, value]) => {
    const id = Number(rawId);
    if (visibleIds.has(id) && isAnswered(value)) next[id] = value;
  });
  return next;
}

export function getMissingRequiredQuestions(questions: Question[], answers: InterviewAnswers): Question[] {
  return getInterviewSequence(questions, answers)
    .filter(question => question.required && !isAnswered(answers[question.id]));
}

export function getActivatedFollowUpCount(question: Question, answers: InterviewAnswers): number {
  return answerTriggers(question, answers[question.id]) ? (question.followUpIds ?? []).length : 0;
}

export function getQuestionDepth(questionId: number, questions: Question[]): number {
  const parents = buildParentIndex(questions);
  let maxDepth = 0;

  const visit = (id: number, depth: number, seen: Set<number>) => {
    if (seen.has(id)) return;
    const nextSeen = new Set(seen);
    nextSeen.add(id);
    maxDepth = Math.max(maxDepth, depth);
    (parents.get(id) ?? []).forEach(parent => visit(parent.id, depth + 1, nextSeen));
  };

  visit(questionId, 0, new Set());
  return maxDepth;
}
