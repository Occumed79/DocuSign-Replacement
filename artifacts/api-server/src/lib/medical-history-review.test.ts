import { describe, expect, it } from "vitest";
import { buildMedicalHistoryResponseGroups, type ReviewQuestionLike } from "./medical-history-review";

function q(id: number, text: string, followUpIds: number[] = []): ReviewQuestionLike {
  return { id, text, section: "Medical History", orderIndex: id, required: true, followUpIds };
}

describe("buildMedicalHistoryResponseGroups", () => {
  it("keeps unchanged source questions as roots and attaches nested follow-ups", () => {
    const questions = [
      q(1, "Have you ever had asthma?", [2]),
      q(2, "How is your asthma currently being managed?", [3]),
      q(3, "What recent evaluation or follow-up have you had for it?"),
      q(4, "Have you ever had kidney stones?", []),
    ];
    const answers = new Map<number, string>([[1, "yes"], [2, "Inhaler as needed"], [3, "Routine PCP follow-up"], [4, "no"]]);

    const groups = buildMedicalHistoryResponseGroups(questions, answers);

    expect(groups).toHaveLength(2);
    expect(groups[0].sourceQuestionText).toBe("Have you ever had asthma?");
    expect(groups[0].sourceAnswer).toBe("yes");
    expect(groups[0].followUps).toEqual([
      expect.objectContaining({ questionId: 2, depth: 1, answer: "Inhaler as needed" }),
      expect.objectContaining({ questionId: 3, depth: 2, answer: "Routine PCP follow-up" }),
    ]);
    expect(groups[1]).toMatchObject({ sourceQuestionId: 4, sourceAnswer: "no", followUps: [] });
  });

  it("does not duplicate shared follow-ups inside a root group", () => {
    const questions = [q(1, "Source", [2, 3]), q(2, "Detail A", [3]), q(3, "Shared Detail")];
    const groups = buildMedicalHistoryResponseGroups(questions, new Map([[1, "yes"], [2, "a"], [3, "b"]]));
    expect(groups[0].followUps.map(item => item.questionId)).toEqual([2, 3]);
  });
});
