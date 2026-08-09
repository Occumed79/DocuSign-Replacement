import { describe, expect, it } from "vitest";
import type { BuiltInMedicalFormDefinition, BuiltInQuestionDefinition } from "./types";
import { postPeaceOfficerDefinition } from "./postPeaceOfficer";
import { postPublicSafetyDispatcherDefinition } from "./postPublicSafetyDispatcher";

function flatten(questions: BuiltInQuestionDefinition[]): BuiltInQuestionDefinition[] {
  return questions.flatMap(question => [question, ...flatten(question.followUps ?? [])]);
}

function byKey(definition: BuiltInMedicalFormDefinition, key: string) {
  return flatten(definition.questions).find(question => question.key === key);
}

const postForms = [postPeaceOfficerDefinition, postPublicSafetyDispatcherDefinition];

describe("POST applicant-facing clarification", () => {
  it("keeps POST Yes/No/Unsure roots without the generic military status gate", () => {
    for (const definition of postForms) {
      const statusGates = flatten(definition.questions).filter(question => question.key.endsWith(".status"));
      expect(statusGates).toEqual([]);
    }

    expect(byKey(postPeaceOfficerDefinition, "52A")?.options).toEqual(["Yes", "No", "Unsure"]);
    expect(byKey(postPublicSafetyDispatcherDefinition, "43M")?.options).toEqual(["Yes", "No", "Unsure"]);
  });

  it("does not feed high-value clinical answers into the applicant prompt", () => {
    const peaceAsthma = byKey(postPeaceOfficerDefinition, "52A")?.followUps?.map(q => q.text).join(" ") ?? "";
    expect(peaceAsthma).toMatch(/asthma/i);
    expect(peaceAsthma).not.toMatch(/inhaler|exercise|respirator|running|duty/i);

    const peaceDiabetes = byKey(postPeaceOfficerDefinition, "59A")?.followUps?.map(q => q.text).join(" ") ?? "";
    expect(peaceDiabetes).toMatch(/diabetes/i);
    expect(peaceDiabetes).not.toMatch(/A1C|hypogly|duty|work/i);

    const peaceApnea = byKey(postPeaceOfficerDefinition, "59T")?.followUps?.map(q => q.text).join(" ") ?? "";
    expect(peaceApnea).toMatch(/sleep apnea/i);
    expect(peaceApnea).not.toMatch(/CPAP|fatigue|concentration|alertness|duty|work/i);

    const dispatcherApnea = byKey(postPublicSafetyDispatcherDefinition, "43M")?.followUps?.map(q => q.text).join(" ") ?? "";
    expect(dispatcherApnea).toMatch(/sleep apnea/i);
    expect(dispatcherApnea).not.toMatch(/CPAP|fatigue|concentration|attendance|work/i);
  });

  it("keeps medical-condition follow-ups open and medically bounded", () => {
    const yesNoLeading = /^(do|does|did|are|is|was|were|have|has|can|could|would|will)\b/i;
    const forbidden = /\b(work|job|duty|duties|attendance|daily activities|concentration|performance|weapon|firearm|grappl|running|driving|situational awareness)\b/i;

    for (const definition of postForms) {
      const conditionDetails = flatten(definition.questions)
        .filter(question => question.key.includes(".detail."))
        .filter(question => /^(3[6-9]|4[0-3]|5[1-9])\./.test(question.section));

      expect(conditionDetails.filter(question => yesNoLeading.test(question.text)).map(question => question.text)).toEqual([]);
      expect(conditionDetails.filter(question => forbidden.test(question.text)).map(question => question.text)).toEqual([]);
    }
  });

  it("does not force unnecessary detail after simple corrective-lens or pregnancy disclosures", () => {
    expect(byKey(postPeaceOfficerDefinition, "51F")?.followUps ?? []).toEqual([]);
    expect(byKey(postPeaceOfficerDefinition, "54H")?.followUps ?? []).toEqual([]);
    expect(byKey(postPublicSafetyDispatcherDefinition, "36B")?.followUps ?? []).toEqual([]);
    expect(byKey(postPublicSafetyDispatcherDefinition, "38F")?.followUps ?? []).toEqual([]);
  });

  it("does not use generic disclosure instructions in condition follow-ups", () => {
    const text = postForms
      .flatMap(definition => flatten(definition.questions))
      .filter(question => question.key.includes(".detail."))
      .map(question => question.text)
      .join(" ");

    expect(text).not.toMatch(/tell us a little more|in your own words|include whatever information|please explain all yes/i);
  });
});
