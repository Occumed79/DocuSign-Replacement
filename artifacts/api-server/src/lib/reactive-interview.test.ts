import { describe, expect, it } from "vitest";
import {
  answerTriggers,
  getHiddenAnsweredQuestionIds,
  getRequiredMissing,
  getVisibleQuestionIds,
  type ReactiveQuestion,
} from "./reactive-interview";

const questions: ReactiveQuestion[] = [
  { id: 1, required: true, section: "History", orderIndex: 1, triggerValue: "yes", followUpIds: [2, 3] },
  { id: 2, required: true, section: "History", orderIndex: 2, triggerValue: null, followUpIds: [] },
  { id: 3, required: true, section: "History", orderIndex: 3, triggerValue: "yes", followUpIds: [4] },
  { id: 4, required: true, section: "History", orderIndex: 4, triggerValue: null, followUpIds: [] },
  { id: 5, required: true, section: "History", orderIndex: 5, triggerValue: null, followUpIds: [] },
];

describe("reactive interview engine", () => {
  it("reveals direct and nested follow-ups only when their branch is active", () => {
    const noAnswers = new Map<number, string>([[1, "no"]]);
    expect([...getVisibleQuestionIds(questions, noAnswers)]).toEqual([1, 5]);

    const firstYes = new Map<number, string>([[1, "yes"], [3, "no"]]);
    expect([...getVisibleQuestionIds(questions, firstYes)]).toEqual([1, 2, 3, 5]);

    const nestedYes = new Map<number, string>([[1, "yes"], [3, "yes"]]);
    expect([...getVisibleQuestionIds(questions, nestedYes)]).toEqual([1, 2, 3, 4, 5]);
  });

  it("identifies stale answers when a user changes a parent from yes to no", () => {
    const answers = new Map<number, string>([
      [1, "no"],
      [2, "child detail that must be discarded"],
      [3, "yes"],
      [4, "nested detail that must be discarded"],
    ]);

    expect(getHiddenAnsweredQuestionIds(questions, answers)).toEqual([2, 3, 4]);
  });

  it("requires only questions that are actually visible", () => {
    const answers = new Map<number, string>([[1, "no"]]);
    expect(getRequiredMissing(questions, answers).map(question => question.id)).toEqual([5]);
  });

  it("supports multiple configured trigger values", () => {
    expect(answerTriggers({ ...questions[0], triggerValue: "yes|current" }, "CURRENT")).toBe(true);
    expect(answerTriggers({ ...questions[0], triggerValue: "yes|current" }, "no")).toBe(false);
  });
});
