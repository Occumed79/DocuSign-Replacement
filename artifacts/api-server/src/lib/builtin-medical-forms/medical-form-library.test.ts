import { describe, expect, it } from "vitest";
import type { BuiltInQuestionDefinition } from "./types";
import { validateBuiltInMedicalFormDefinition } from "./validation";
import { dd2795Definition } from "./dd2795";
import { dd2807Definition } from "./dd2807";
import { ds1843Definition } from "./ds1843";
import { ds6570Definition } from "./ds6570";
import { ds6561Definition } from "./ds6561";
import { occuMedSedentaryDefinition } from "./occuMedSedentary";

const definitions = [
  dd2795Definition,
  ds1843Definition,
  ds6570Definition,
  ds6561Definition,
  occuMedSedentaryDefinition,
];

function flatten(questions: BuiltInQuestionDefinition[]): BuiltInQuestionDefinition[] {
  return questions.flatMap(question => [question, ...flatten(question.followUps ?? [])]);
}

function find(definition: { questions: BuiltInQuestionDefinition[] }, key: string) {
  return flatten(definition.questions).find(question => question.key === key);
}

describe("recovered built-in medical form library", () => {
  it("validates every recovered definition with unique keys and non-empty metadata", () => {
    definitions.forEach(definition => {
      expect(() => validateBuiltInMedicalFormDefinition(definition)).not.toThrow();
      expect(definition.slug).not.toBe("");
      expect(definition.sourceLabel).not.toBe("");
      expect(flatten(definition.questions).length).toBeGreaterThan(20);
    });
  });

  it("preserves DD2795 reverse and alternate branching", () => {
    expect(find(dd2795Definition, "1")?.triggerValue).toBe("fair|poor");
    expect(find(dd2795Definition, "4")?.triggerValue).toBe("yes|don't know");
    expect(find(dd2795Definition, "5")?.triggerValue).toBe("no");
    expect(find(dd2795Definition, "6")?.triggerValue).toBe("no");
  });

  it("covers all 36 DS-1843 medical-history items", () => {
    for (let item = 1; item <= 36; item++) {
      if (item === 21) {
        expect(find(ds1843Definition, "21")).toBeDefined();
        continue;
      }
      expect(find(ds1843Definition, String(item))).toBeDefined();
    }
    expect(find(ds1843Definition, "34")?.text).toContain("self-injury");
  });

  it("covers every DS-6570 ESCAPE risk item from 1 through 43", () => {
    for (let item = 1; item <= 43; item++) {
      expect(find(ds6570Definition, String(item))).toBeDefined();
    }
    expect(find(ds6570Definition, "1")?.text).toContain("personal protective equipment");
    expect(find(ds6570Definition, "11")?.text).toContain("Obstructive sleep apnea");
    expect(find(ds6570Definition, "43")?.text).toContain("opioids");
  });

  it("preserves DS-6561 main history, trauma screen, and high-threat gate", () => {
    for (let item = 1; item <= 25; item++) {
      expect(find(ds6561Definition, String(item))).toBeDefined();
    }
    const highThreatGate = find(ds6561Definition, "highThreat.gate");
    expect(highThreatGate?.triggerValue).toBe("yes");
    expect(highThreatGate?.followUps?.map(question => question.key)).toEqual([
      "highThreat.blast",
      "highThreat.toxic",
    ]);
    expect(find(ds6561Definition, "trauma.nightmares")).toBeDefined();
    expect(find(ds6561Definition, "trauma.detached")).toBeDefined();
  });

  it("gates Occu-Med Sedentary questions 16-33 behind on-duty driving", () => {
    for (let item = 4; item <= 15; item++) {
      expect(find(occuMedSedentaryDefinition, String(item))).toBeDefined();
    }
    for (let item = 16; item <= 33; item++) {
      expect(find(occuMedSedentaryDefinition, String(item))).toBeDefined();
    }
    const drivingGate = find(occuMedSedentaryDefinition, "driving.gate");
    expect(drivingGate?.triggerValue).toBe("yes");
    expect(drivingGate?.followUps?.length).toBe(18);
  });

  it("keeps marked-in-error short circuiting on DD history while removing it from DS-1843", () => {
    const ddAsthmaStatus = find(dd2807Definition, "10d.status");
    expect(ddAsthmaStatus?.options).toContain("Marked in error");
    expect(ddAsthmaStatus?.triggerValue).not.toContain("marked in error");

    expect(find(ds1843Definition, "8.status")).toBeUndefined();
  });
});