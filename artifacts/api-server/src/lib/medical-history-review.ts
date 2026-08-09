export interface ReviewQuestionLike {
  id: number;
  text: string;
  section: string;
  orderIndex: number;
  required: boolean;
  followUpIds: number[];
}

export interface ReviewFollowUp {
  questionId: number;
  questionText: string;
  answer: string;
  depth: number;
  section: string;
}

export interface MedicalHistoryResponseGroup {
  sourceQuestionId: number;
  sourceQuestionText: string;
  sourceAnswer: string;
  section: string;
  required: boolean;
  followUps: ReviewFollowUp[];
}

function parentIndex(questions: ReviewQuestionLike[]): Map<number, number[]> {
  const visibleIds = new Set(questions.map(question => question.id));
  const parents = new Map<number, number[]>();
  for (const question of questions) {
    for (const childId of question.followUpIds ?? []) {
      if (!visibleIds.has(childId)) continue;
      const existing = parents.get(childId) ?? [];
      existing.push(question.id);
      parents.set(childId, existing);
    }
  }
  return parents;
}

/**
 * Group each unchanged source/root question with only the adaptive follow-up
 * questions that are currently visible beneath it. This is reviewer/output
 * presentation logic; it never modifies the source wording or answers.
 */
export function buildMedicalHistoryResponseGroups(
  questions: ReviewQuestionLike[],
  answers: Map<number, string>,
): MedicalHistoryResponseGroup[] {
  const byId = new Map(questions.map(question => [question.id, question]));
  const parents = parentIndex(questions);
  const order = new Map(questions.map((question, index) => [question.id, index]));
  const roots = questions.filter(question => !(parents.get(question.id)?.length));

  function descendants(rootId: number): ReviewFollowUp[] {
    const collected: ReviewFollowUp[] = [];
    const seen = new Set<number>();

    const visit = (parentId: number, depth: number) => {
      const parent = byId.get(parentId);
      if (!parent) return;
      const children = (parent.followUpIds ?? [])
        .map(id => byId.get(id))
        .filter((child): child is ReviewQuestionLike => Boolean(child))
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      for (const child of children) {
        if (seen.has(child.id)) continue;
        seen.add(child.id);
        collected.push({
          questionId: child.id,
          questionText: child.text,
          answer: answers.get(child.id) ?? "",
          depth,
          section: child.section,
        });
        visit(child.id, depth + 1);
      }
    };

    visit(rootId, 1);
    return collected;
  }

  return roots.map(root => ({
    sourceQuestionId: root.id,
    sourceQuestionText: root.text,
    sourceAnswer: answers.get(root.id) ?? "",
    section: root.section,
    required: root.required,
    followUps: descendants(root.id),
  }));
}
