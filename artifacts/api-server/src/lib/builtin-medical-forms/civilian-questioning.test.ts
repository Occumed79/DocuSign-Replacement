import { describe, expect, it } from "vitest";
import { civilianHistory, history } from "./definition-helpers";
import { occuMedSedentaryDefinition } from "./occuMedSedentary";
import type { BuiltInQuestionDefinition } from "./types";

function flatten(questions: BuiltInQuestionDefinition[]): BuiltInQuestionDefinition[] {
  return questions.flatMap(question => [question, ...flatten(question.followUps ?? [])]);
}

function byKey(key: string) {
  return flatten(occuMedSedentaryDefinition.questions).find(question => question.key === key);
}

describe("civilian medical-history questioning", () => {
  it("opens civilian clarification directly instead of inserting the DD status-classification gate", () => {
    const question = civilianHistory(
      "x",
      "Sleep Apnea",
      "Medical History",
      ["What sleep disorder was identified, and what is its current status?"],
    );

    expect(question.followUps?.map(item => item.key)).toEqual(["x.detail.1"]);
    expect(question.followUps?.some(item => item.key === "x.status")).toBe(false);
  });

  it("keeps the structured status gate available for DD / military history", () => {
    const question = history(
      "x",
      "Asthma",
      "Medical History",
      ["When were you diagnosed?"],
    );

    expect(question.followUps?.[0]?.key).toBe("x.status");
  });

  it("uses condition-specific open questions for the sedentary questionnaire", () => {
    const sleepApnea = byKey("18");
    const sleepPrompts = sleepApnea?.followUps?.map(question => question.text) ?? [];
    expect(sleepPrompts).toEqual([
      "What sleep disorder was identified, and what is its current status?",
      "How has the sleep disorder been evaluated or treated?",
    ]);
    expect(sleepPrompts.join(" ")).not.toMatch(/CPAP|daytime sleepiness|work|daily activities/i);

    const diabetes = byKey("19")?.followUps?.map(question => question.text) ?? [];
    expect(diabetes).toContain("How is your diabetes currently being managed?");
    expect(diabetes.join(" ")).not.toMatch(/A1C|restriction|work|daily activities/i);

    const headaches = byKey("6")?.followUps?.map(question => question.text) ?? [];
    expect(headaches[0]).toContain("current pattern");
    expect(headaches.join(" ")).not.toMatch(/missed work|debilitating|daily activities/i);
  });

  it("does not use generic disclosure instructions or yes/no-leading follow-up prompts", () => {
    const followUps = flatten(occuMedSedentaryDefinition.questions)
      .filter(question => question.key.includes(".detail."))
      .map(question => question.text);

    expect(followUps.join(" ")).not.toMatch(/in your own words|include whatever information|tell us a little more|how should this history be classified/i);

    const yesNoLeading = /^(do|does|did|are|is|was|were|have|has|can|could|would|will)\b/i;
    expect(followUps.filter(prompt => yesNoLeading.test(prompt))).toEqual([]);
  });

  it("does not create unnecessary clarification for corrective-lens use", () => {
    expect(byKey("33")?.followUps ?? []).toEqual([]);
  });
});
