import { describe, expect, it } from "vitest";
import type { BuiltInMedicalFormDefinition, BuiltInQuestionDefinition } from "./types";
import { absNorthAmericaDefinition } from "./absNorthAmerica";
import { civilianOccuMedPrompts } from "./civilianOccuMedPromptLibrary";
import { occuMedCore2014Definition } from "./occuMedCore2014";
import { occuMedGoldDefinition } from "./occuMedGold";
import { occuMedSedentaryDefinition } from "./occuMedSedentary";

function flatten(questions: BuiltInQuestionDefinition[]): BuiltInQuestionDefinition[] {
  return questions.flatMap(question => [question, ...flatten(question.followUps ?? [])]);
}

const civilianForms: BuiltInMedicalFormDefinition[] = [
  occuMedCore2014Definition,
  occuMedGoldDefinition,
  absNorthAmericaDefinition,
  occuMedSedentaryDefinition,
];

describe("civilian Occu-Med applicant clarification", () => {
  it("keeps high-value conditions specific without feeding expected answers", () => {
    const sleepApnea = civilianOccuMedPrompts("Sleep Apnea").join(" ");
    expect(sleepApnea).toMatch(/sleep apnea/i);
    expect(sleepApnea).not.toMatch(/CPAP|daytime sleepiness|driving|work|daily activities/i);

    const diabetes = civilianOccuMedPrompts("Diabetes").join(" ");
    expect(diabetes).toMatch(/diabetes/i);
    expect(diabetes).not.toMatch(/A1C|hypogly|work|daily activities/i);

    const asthma = civilianOccuMedPrompts("Asthma").join(" ");
    expect(asthma).toMatch(/asthma/i);
    expect(asthma).not.toMatch(/inhaler|exercise|respirator|work|daily activities/i);

    const kidneyStones = civilianOccuMedPrompts("Kidney Stones").join(" ");
    expect(kidneyStones).toMatch(/kidney stones/i);
    expect(kidneyStones).not.toMatch(/lithotripsy|obstruction|retained stones/i);
  });

  it("does not use a generic disclosure script", () => {
    const text = [
      civilianOccuMedPrompts("Sleep Apnea"),
      civilianOccuMedPrompts("Diabetes"),
      civilianOccuMedPrompts("Asthma"),
      civilianOccuMedPrompts("Frequent Headaches"),
      civilianOccuMedPrompts("Back Injury"),
      civilianOccuMedPrompts("Hernia"),
    ].flat().join(" ");

    expect(text).not.toMatch(/tell us a little more|in your own words|include whatever information|please explain all yes/i);
  });

  it("keeps non-military applicant follow-ups open rather than yes/no-leading", () => {
    const yesNoLeading = /^(do|does|did|are|is|was|were|have|has|can|could|would|will)\b/i;

    for (const definition of civilianForms) {
      const bad = flatten(definition.questions)
        .filter(question => question.key.includes(".detail."))
        .filter(question => question.section !== "Military History")
        .filter(question => yesNoLeading.test(question.text))
        .map(question => `${definition.slug}:${question.key}:${question.text}`);

      expect(bad).toEqual([]);
    }
  });

  it("does not insert the military status gate into the shared civilian condition ranges", () => {
    for (const definition of [occuMedCore2014Definition, occuMedGoldDefinition, absNorthAmericaDefinition, occuMedSedentaryDefinition]) {
      const statusQuestions = flatten(definition.questions)
        .filter(question => question.key.endsWith(".status"))
        .filter(question => question.section !== "Military History");

      expect(statusQuestions).toEqual([]);
    }
  });
});
