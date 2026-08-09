import { describe, expect, it } from "vitest";
import type { BuiltInMedicalFormDefinition, BuiltInQuestionDefinition } from "./types";
import { ds1843Definition } from "./ds1843";
import { ds6561Definition } from "./ds6561";
import { ds6570Definition } from "./ds6570";
import { polarDefinition } from "./polar";

function flatten(questions: BuiltInQuestionDefinition[]): BuiltInQuestionDefinition[] {
  return questions.flatMap(question => [question, ...flatten(question.followUps ?? [])]);
}

function byKey(definition: BuiltInMedicalFormDefinition, key: string) {
  return flatten(definition.questions).find(question => question.key === key);
}

const forms = [ds1843Definition, ds6561Definition, ds6570Definition, polarDefinition];

describe("Polar and State Department applicant-facing clarification", () => {
  it("does not insert the generic military status-classification gate", () => {
    for (const definition of forms) {
      const classifierGates = flatten(definition.questions).filter(
        question => question.text === "How should this history be classified?",
      );
      expect(classifierGates).toEqual([]);
    }
  });

  it("keeps high-value condition prompts open without feeding expected answers", () => {
    const dsRespiratory = byKey(ds1843Definition, "8")?.followUps?.map(q => q.text).join(" ") ?? "";
    expect(dsRespiratory).toMatch(/respiratory/i);
    expect(dsRespiratory).not.toMatch(/inhaler|work|daily activities/i);

    const dsEndocrine = byKey(ds1843Definition, "19")?.followUps?.map(q => q.text).join(" ") ?? "";
    expect(dsEndocrine).not.toMatch(/A1C|complications|work|daily activities/i);

    const polarApnea = byKey(polarDefinition, "7F")?.followUps?.map(q => q.text).join(" ") ?? "";
    expect(polarApnea).toMatch(/sleep apnea/i);
    expect(polarApnea).not.toMatch(/CPAP|daytime sleepiness|concentration|remote|work/i);

    const polarDiabetes = byKey(polarDefinition, "11B")?.followUps?.map(q => q.text).join(" ") ?? "";
    expect(polarDiabetes).toMatch(/diabetes/i);
    expect(polarDiabetes).not.toMatch(/A1C|complication|deployment|work/i);

    const polarAsthma = byKey(polarDefinition, "7B")?.followUps?.map(q => q.text).join(" ") ?? "";
    expect(polarAsthma).toMatch(/asthma/i);
    expect(polarAsthma).not.toMatch(/inhaler|exercise|work/i);

    const escapeApnea = byKey(ds6570Definition, "11")?.followUps?.map(q => q.text).join(" ") ?? "";
    expect(escapeApnea).toMatch(/sleep apnea/i);
    expect(escapeApnea).not.toMatch(/CPAP|daytime sleepiness|concentration/i);

    const escapeDiabetes = byKey(ds6570Definition, "7")?.followUps?.map(q => q.text).join(" ") ?? "";
    expect(escapeDiabetes).toMatch(/diabetes/i);
    expect(escapeDiabetes).not.toMatch(/A1C|complications/i);
  });

  it("does not use generic disclosure instructions", () => {
    const details = forms
      .flatMap(definition => flatten(definition.questions))
      .filter(question => question.key.includes(".detail."))
      .map(question => question.text)
      .join(" ");

    expect(details).not.toMatch(/tell us a little more|in your own words|include whatever information|please explain all yes/i);
  });

  it("keeps medical clarification open rather than yes/no-leading", () => {
    const yesNoLeading = /^(do|does|did|are|is|was|were|have|has|can|could|would|will)\b/i;

    const conditionDetails = forms
      .flatMap(definition => flatten(definition.questions))
      .filter(question => question.key.includes(".detail."))
      .filter(question => !question.section.includes("Lifestyle"))
      .filter(question => !question.section.includes("Exercise / Conditioning"));

    expect(conditionDetails.filter(question => yesNoLeading.test(question.text)).map(question => question.text)).toEqual([]);
  });

  it("does not default medical clarification to job or personal-life impact", () => {
    const forbidden = /\b(work|job|daily activities|relationships|concentration|attendance|performance|personal life)\b/i;

    const boundedDetails = [
      ...flatten(ds1843Definition.questions).filter(q => q.key.includes(".detail.") && q.section === "Medical History"),
      ...flatten(ds6561Definition.questions).filter(q => q.key.includes(".detail.") && (q.section.includes("Medical History") || q.section.includes("Trauma Screen"))),
      ...flatten(polarDefinition.questions).filter(q => q.key.includes(".detail.") && /^\d+\./.test(q.section)),
      ...flatten(ds6570Definition.questions).filter(q => q.key.includes(".detail.") && q.section === "ESCAPE Post Self-Certification"),
    ];

    expect(boundedDetails.filter(question => forbidden.test(question.text)).map(question => question.text)).toEqual([]);
  });

  it("does not force unnecessary pregnancy detail and keeps trauma follow-up clinically bounded", () => {
    expect(byKey(ds1843Definition, "21")?.followUps ?? []).toEqual([]);
    expect(byKey(ds6561Definition, "female.pregnant")?.followUps ?? []).toEqual([]);

    for (const key of ["trauma.nightmares", "trauma.avoidance", "trauma.guard", "trauma.detached"]) {
      const prompts = byKey(ds6561Definition, key)?.followUps?.map(q => q.text).join(" ") ?? "";
      expect(prompts).toMatch(/clinical care|follow-up/i);
      expect(prompts).not.toMatch(/work|relationships|daily activities|how often|frequency/i);
    }
  });
});