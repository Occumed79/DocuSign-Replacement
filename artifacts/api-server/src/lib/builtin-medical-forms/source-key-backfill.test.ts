import { describe, expect, it } from "vitest";
import {
  buildExpectedQuestionSnapshot,
  installedQuestionSnapshotMatches,
  sourceKeyBackfillPlan,
  type InstalledQuestionSnapshot,
} from "./install-snapshot";
import type { BuiltInMedicalFormDefinition } from "./types";

const definition: BuiltInMedicalFormDefinition = {
  slug: "source-key-test",
  name: "Source Key Test",
  description: "test",
  sourceLabel: "Source Key Test",
  questions: [
    {
      key: "q1",
      text: "Source question one?",
      section: "History",
      answerType: "yes_no",
      followUps: [
        {
          key: "q1.detail",
          text: "Condition-specific detail?",
          section: "History",
          answerType: "text",
        },
      ],
    },
    {
      key: "q2",
      text: "Source question two?",
      section: "History",
      answerType: "yes_no",
    },
  ],
};

function installedWithoutKeys(): InstalledQuestionSnapshot[] {
  return [
    {
      id: 101,
      sourceKey: null,
      orderIndex: 1,
      text: "Source question one?",
      answerType: "yes_no",
      required: true,
      section: "History",
      options: [],
      triggerValue: "yes",
      followUpIds: [102],
      helpText: null,
      examTypeIds: [7],
    },
    {
      id: 102,
      sourceKey: null,
      orderIndex: 2,
      text: "Condition-specific detail?",
      answerType: "text",
      required: true,
      section: "History",
      options: [],
      triggerValue: null,
      followUpIds: [],
      helpText: null,
      examTypeIds: [7],
    },
    {
      id: 103,
      sourceKey: null,
      orderIndex: 3,
      text: "Source question two?",
      answerType: "yes_no",
      required: true,
      section: "History",
      options: [],
      triggerValue: null,
      followUpIds: [],
      helpText: null,
      examTypeIds: [7],
    },
  ];
}

describe("source-key backfill", () => {
  it("carries stable built-in keys in deterministic pre-order", () => {
    const expected = buildExpectedQuestionSnapshot(definition);
    expect(expected.map(row => row.sourceKey)).toEqual(["q1", "q1.detail", "q2"]);
  });

  it("backfills keys without treating their absence as a structural mismatch", () => {
    const expected = buildExpectedQuestionSnapshot(definition);
    const installed = installedWithoutKeys();

    expect(installedQuestionSnapshotMatches(expected, installed)).toBe(true);
    expect(sourceKeyBackfillPlan(expected, installed)).toEqual([
      { id: 101, sourceKey: "q1" },
      { id: 102, sourceKey: "q1.detail" },
      { id: 103, sourceKey: "q2" },
    ]);
  });

  it("does not produce a positional backfill when source-controlled structure differs", () => {
    const expected = buildExpectedQuestionSnapshot(definition);
    const installed = installedWithoutKeys();
    installed[1] = { ...installed[1], text: "Unexpected stale wording" };

    expect(installedQuestionSnapshotMatches(expected, installed)).toBe(false);
    expect(sourceKeyBackfillPlan(expected, installed)).toEqual([]);
  });

  it("only updates rows whose stable source key is missing or stale", () => {
    const expected = buildExpectedQuestionSnapshot(definition);
    const installed = installedWithoutKeys();
    installed[0] = { ...installed[0], sourceKey: "q1" };
    installed[1] = { ...installed[1], sourceKey: "old-key" };

    expect(sourceKeyBackfillPlan(expected, installed)).toEqual([
      { id: 102, sourceKey: "q1.detail" },
      { id: 103, sourceKey: "q2" },
    ]);
  });
});
