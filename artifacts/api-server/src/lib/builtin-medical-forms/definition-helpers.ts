import type { BuiltInAnswerType, BuiltInMedicalFormDefinition, BuiltInQuestionDefinition } from "./types";

export const STATUS_OPTIONS = [
  "Current",
  "Resolved",
  "Historical only",
  "Intermittent",
  "Not sure",
  "Marked in error",
];

export const STATUS_TRIGGER = "current|resolved|historical only|intermittent|not sure";

export interface QuestionOptions {
  answerType?: BuiltInAnswerType;
  options?: string[];
  required?: boolean;
  triggerValue?: string | null;
  helpText?: string | null;
}

export function q(
  key: string,
  text: string,
  section: string,
  options: QuestionOptions = {},
  followUps: BuiltInQuestionDefinition[] = [],
): BuiltInQuestionDefinition {
  return {
    key,
    text,
    section,
    answerType: options.answerType ?? "text",
    options: options.options ?? [],
    required: options.required ?? true,
    triggerValue: options.triggerValue ?? null,
    helpText: options.helpText ?? null,
    followUps,
  };
}

export function detailQuestions(
  key: string,
  section: string,
  prompts: string[],
): BuiltInQuestionDefinition[] {
  return prompts.map((prompt, index) => q(`${key}.detail.${index + 1}`, prompt, section));
}

export function history(
  key: string,
  text: string,
  section: string,
  prompts: string[],
  options: QuestionOptions & { allowUnsure?: boolean; statusGate?: boolean } = {},
): BuiltInQuestionDefinition {
  const allowUnsure = options.allowUnsure ?? false;
  const statusGate = options.statusGate ?? true;
  const answerType = options.answerType ?? (allowUnsure ? "dropdown" : "yes_no");
  const rootOptions = options.options ?? (allowUnsure ? ["Yes", "No", "Unsure"] : []);
  const triggerValue = options.triggerValue ?? (allowUnsure ? "yes|unsure" : "yes");
  const details = detailQuestions(key, section, prompts);

  const followUps = statusGate
    ? [q(
        `${key}.status`,
        "How should this history be classified?",
        section,
        {
          answerType: "dropdown",
          options: STATUS_OPTIONS,
          triggerValue: STATUS_TRIGGER,
          helpText: "Choose “Marked in error” if the source-form answer was selected accidentally. That ends this branch without requesting unnecessary detail.",
        },
        details,
      )]
    : details;

  return q(
    key,
    text,
    section,
    {
      ...options,
      answerType,
      options: rootOptions,
      triggerValue,
    },
    followUps,
  );
}

export function branch(
  key: string,
  text: string,
  section: string,
  prompts: string[],
  options: QuestionOptions = {},
): BuiltInQuestionDefinition {
  return q(
    key,
    text,
    section,
    {
      answerType: options.answerType ?? "yes_no",
      options: options.options ?? [],
      required: options.required,
      triggerValue: options.triggerValue ?? "yes",
      helpText: options.helpText,
    },
    detailQuestions(key, section, prompts),
  );
}

export function text(
  key: string,
  label: string,
  section: string,
  required = true,
  helpText: string | null = null,
): BuiltInQuestionDefinition {
  return q(key, label, section, { required, helpText });
}

export function date(
  key: string,
  label: string,
  section: string,
  required = true,
): BuiltInQuestionDefinition {
  return q(key, label, section, { answerType: "date", required });
}

export function select(
  key: string,
  label: string,
  section: string,
  values: string[],
  required = true,
): BuiltInQuestionDefinition {
  return q(key, label, section, { answerType: "dropdown", options: values, required });
}

export function multi(
  key: string,
  label: string,
  section: string,
  values: string[],
  required = true,
): BuiltInQuestionDefinition {
  return q(key, label, section, { answerType: "multi_select", options: values, required });
}

export function form(
  slug: string,
  name: string,
  description: string,
  sourceLabel: string,
  questions: BuiltInQuestionDefinition[],
): BuiltInMedicalFormDefinition {
  return { slug, name, description, sourceLabel, questions };
}
