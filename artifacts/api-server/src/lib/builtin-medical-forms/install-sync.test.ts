import { describe, expect, it } from "vitest";
import { buildExpectedQuestionSnapshot, installedQuestionSnapshotMatches } from "./install";
import { form, q } from "./definition-helpers";

const definition = form(
  "sync-test",
  "Sync Test",
  "Sync test definition",
  "Synthetic test source",
  [
    q(
      "root",
      "Root question",
      "General",
      { answerType: "yes_no", triggerValue: "yes" },
      [q("child", "Open follow-up", "General")],
    ),
    q("second", "Second question", "General", { answerType: "text", required: false }),
  ],
);

describe("built-in medical-form definition synchronization", () => {
  it("builds the same pre-order shape written by the installer", () => {
    expect(buildExpectedQuestionSnapshot(definition)).toEqual([
      {
        orderIndex: 1,
        text: "Root question",
        answerType: "yes_no",
        required: true,
        section: "General",
        options: [],
        triggerValue: "yes",
        helpText: null,
        childOrderIndexes: [2],
      },
      {
        orderIndex: 2,
        text: "Open follow-up",
        answerType: "text",
        required: true,
        section: "General",
        options: [],
        triggerValue: null,
        helpText: null,
        childOrderIndexes: [],
      },
      {
        orderIndex: 3,
        text: "Second question",
        answerType: "text",
        required: false,
        section: "General",
        options: [],
        triggerValue: null,
        helpText: null,
        childOrderIndexes: [],
      },
    ]);
  });

  it("matches installed trees independently of database IDs", () => {
    const expected = buildExpectedQuestionSnapshot(definition);
    const installed = [
      {
        id: 901,
        orderIndex: 1,
        text: "Root question",
        answerType: "yes_no",
        required: true,
        section: "General",
        options: [],
        triggerValue: "yes",
        followUpIds: [447],
        helpText: null,
        examTypeIds: [12],
      },
      {
        id: 447,
        orderIndex: 2,
        text: "Open follow-up",
        answerType: "text",
        required: true,
        section: "General",
        options: [],
        triggerValue: null,
        followUpIds: [],
        helpText: null,
        examTypeIds: [12],
      },
      {
        id: 305,
        orderIndex: 3,
        text: "Second question",
        answerType: "text",
        required: false,
        section: "General",
        options: [],
        triggerValue: null,
        followUpIds: [],
        helpText: null,
        examTypeIds: [12],
      },
    ];

    expect(installedQuestionSnapshotMatches(expected, installed)).toBe(true);
  });

  it("detects stale wording and stale branch structure", () => {
    const expected = buildExpectedQuestionSnapshot(definition);
    const base = [
      {
        id: 1,
        orderIndex: 1,
        text: "Root question",
        answerType: "yes_no",
        required: true,
        section: "General",
        options: [],
        triggerValue: "yes",
        followUpIds: [2],
        helpText: null,
        examTypeIds: [12],
      },
      {
        id: 2,
        orderIndex: 2,
        text: "Open follow-up",
        answerType: "text",
        required: true,
        section: "General",
        options: [],
        triggerValue: null,
        followUpIds: [],
        helpText: null,
        examTypeIds: [12],
      },
      {
        id: 3,
        orderIndex: 3,
        text: "Second question",
        answerType: "text",
        required: false,
        section: "General",
        options: [],
        triggerValue: null,
        followUpIds: [],
        helpText: null,
        examTypeIds: [12],
      },
    ];

    expect(installedQuestionSnapshotMatches(expected, [
      { ...base[0], text: "Old wording" },
      base[1],
      base[2],
    ])).toBe(false);

    expect(installedQuestionSnapshotMatches(expected, [
      { ...base[0], followUpIds: [] },
      base[1],
      base[2],
    ])).toBe(false);
  });
});
