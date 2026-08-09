import { describe, expect, it } from "vitest";
import { dd2807Definition } from "./dd2807";
import { validateBuiltInMedicalFormDefinition } from "./validation";
import type { BuiltInQuestionDefinition } from "./types";

function flatten(questions: BuiltInQuestionDefinition[]): BuiltInQuestionDefinition[] {
  return questions.flatMap(question => [question, ...flatten(question.followUps ?? [])]);
}

describe("DD Form 2807-1 built-in definition", () => {
  it("is structurally valid with unique keys", () => {
    expect(() => validateBuiltInMedicalFormDefinition(dd2807Definition)).not.toThrow();
  });

  it("contains the full guided history rather than a small demo questionnaire", () => {
    const all = flatten(dd2807Definition.questions);
    expect(dd2807Definition.questions.length).toBeGreaterThan(80);
    expect(all.length).toBeGreaterThan(250);
  });

  it("preserves important DD 2807-1 item mappings", () => {
    const roots = new Map(dd2807Definition.questions.map(question => [question.key, question]));
    expect(roots.get("10d")?.text).toContain("Asthma");
    expect(roots.get("12c")?.text).toContain("back pain");
    expect(roots.get("16f")?.text).toContain("blood pressure");
    expect(roots.get("17f")?.text).toContain("Depression");
    expect(roots.get("20")?.text).toContain("Emergency Room");
    expect(roots.get("27")?.text).toContain("pension or compensation");
  });

  it("uses reverse branching for the source form's currently-in-good-health item", () => {
    const health = dd2807Definition.questions.find(question => question.key === "14c");
    expect(health?.answerType).toBe("yes_no");
    expect(health?.triggerValue).toBe("no");
    expect(health?.followUps?.length).toBe(1);
  });

  it("stops positive-history detail when the applicant marks the answer as an error", () => {
    const asthma = dd2807Definition.questions.find(question => question.key === "10d");
    const status = asthma?.followUps?.[0];
    expect(status?.answerType).toBe("dropdown");
    expect(status?.options).toContain("Marked in error");
    expect(status?.triggerValue).not.toContain("marked in error");
    expect(status?.followUps?.length).toBeGreaterThan(3);
  });

  it("gates the female-only section instead of forcing it on every applicant", () => {
    const gate = dd2807Definition.questions.find(question => question.key === "female-gate");
    expect(gate?.triggerValue).toBe("yes");
    expect(gate?.followUps?.map(question => question.key)).toEqual(["18a", "18b", "18c", "18d", "18e"]);
  });
});
