import { describe, expect, it } from "vitest";
import type { BuiltInMedicalFormDefinition, BuiltInQuestionDefinition } from "./types";
import { validateBuiltInMedicalFormDefinition } from "./validation";
import { polarDefinition } from "./polar";
import { postPeaceOfficerDefinition } from "./postPeaceOfficer";
import { occuMedCore2014Definition } from "./occuMedCore2014";
import { occuMedGoldDefinition } from "./occuMedGold";
import { absNorthAmericaDefinition } from "./absNorthAmerica";
import { occuMedPrompts } from "./occuMedPromptLibrary";

const definitions: BuiltInMedicalFormDefinition[] = [
  polarDefinition,
  postPeaceOfficerDefinition,
  occuMedCore2014Definition,
  occuMedGoldDefinition,
  absNorthAmericaDefinition,
];

function flatten(questions: BuiltInQuestionDefinition[]): BuiltInQuestionDefinition[] {
  return questions.flatMap(question => [question, ...flatten(question.followUps ?? [])]);
}

function byKey(definition: BuiltInMedicalFormDefinition, key: string) {
  return flatten(definition.questions).find(question => question.key === key);
}

function expectKeys(definition: BuiltInMedicalFormDefinition, keys: string[]) {
  keys.forEach(key => expect(byKey(definition, key), `${definition.slug} missing ${key}`).toBeDefined());
}

describe("complete recovered medical-form library", () => {
  it("keeps every new definition structurally valid and large enough to be a real form", () => {
    definitions.forEach(definition => {
      expect(() => validateBuiltInMedicalFormDefinition(definition)).not.toThrow();
      expect(definition.sourceLabel.length).toBeGreaterThan(10);
      expect(flatten(definition.questions).length).toBeGreaterThan(100);
    });
  });

  it("covers the Polar 1A-18 condition architecture", () => {
    expectKeys(polarDefinition, [
      "1A", "1B", "1C", "1D", "1E", "1F", "1G", "1H", "1I", "1J", "1K",
      "2A", "2K", "3A", "3F", "4A", "4E", "5A", "5C", "6A", "6D", "7A", "7M",
      "8A", "8M", "9A", "9E", "10A", "10G", "11A", "11I", "12A", "12I", "13A", "13K",
      "14A", "14E", "15A", "15I", "16A", "16E", "17A", "17B", "18",
    ]);
    expect(byKey(polarDefinition, "7F")?.text).toContain("sleep apnea");
    expect(byKey(polarDefinition, "currentMedications")?.followUps?.length).toBeGreaterThan(2);
  });

  it("preserves POST Peace Officer Yes/No/? behavior and numbered groups", () => {
    for (let item = 11; item <= 50; item++) {
      expect(byKey(postPeaceOfficerDefinition, String(item)), `POST missing ${item}`).toBeDefined();
    }
    expectKeys(postPeaceOfficerDefinition, [
      "51A", "51S", "52A", "52I", "53A", "53N", "54A", "54H", "55A", "55K",
      "56A", "56F", "57A", "57H", "58A", "58O", "59A", "59W", "60",
    ]);
    const asthma = byKey(postPeaceOfficerDefinition, "52A");
    expect(asthma?.answerType).toBe("dropdown");
    expect(asthma?.options).toEqual(["Yes", "No", "Unsure"]);
    expect(asthma?.triggerValue).toBe("yes|unsure");
  });

  it("preserves the 2014 Occu-Med core medical-history range and POST-only tail", () => {
    for (let item = 19; item <= 114; item++) {
      expect(byKey(occuMedCore2014Definition, String(item)), `Core missing ${item}`).toBeDefined();
    }
    const postGate = byKey(occuMedCore2014Definition, "post.gate");
    expect(postGate?.triggerValue).toBe("yes");
    expect(postGate?.followUps?.map(question => question.key)).toEqual(["110", "111", "112", "113", "114"]);
    expect(byKey(occuMedCore2014Definition, "41")?.text).toContain("Sleep Apnea");
  });

  it("preserves the Gold questionnaire numbering through height/weight", () => {
    for (let item = 18; item <= 108; item++) {
      expect(byKey(occuMedGoldDefinition, String(item)), `Gold missing ${item}`).toBeDefined();
    }
    expect(byKey(occuMedGoldDefinition, "109")?.text).toContain("Height and Weight");
    expect(byKey(occuMedGoldDefinition, "40")?.text).toContain("Sleep Apnea");
    expect(byKey(occuMedGoldDefinition, "59")?.text).toContain("Psychological Problems");
  });

  it("preserves the ABS North America numbered medical history through corrective lenses", () => {
    for (let item = 14; item <= 76; item++) {
      expect(byKey(absNorthAmericaDefinition, String(item)), `ABS missing ${item}`).toBeDefined();
    }
    expect(byKey(absNorthAmericaDefinition, "38")?.text).toContain("Sleep Apnea");
    expect(byKey(absNorthAmericaDefinition, "57")?.answerType).toBe("text");
    expect(byKey(absNorthAmericaDefinition, "76")?.text).toContain("corrective lenses");
  });

  it("keeps shared clinical clarification logic consistent across client forms", () => {
    const asthma = occuMedPrompts("Asthma");
    expect(asthma.join(" ")).toContain("inhaler");
    expect(asthma.join(" ")).toContain("trigger");
    expect(occuMedPrompts("Sleep Apnea").join(" ")).toContain("CPAP");
    expect(occuMedPrompts("Diabetes").join(" ")).toContain("A1C");
    expect(occuMedPrompts("High Blood Pressure").join(" ")).toContain("blood pressure reading");
  });
});
