export type BuiltInAnswerType = "text" | "yes_no" | "dropdown" | "date" | "number" | "multi_select";

export interface BuiltInQuestionDefinition {
  key: string;
  text: string;
  section: string;
  answerType?: BuiltInAnswerType;
  required?: boolean;
  options?: string[];
  triggerValue?: string | null;
  helpText?: string | null;
  followUps?: BuiltInQuestionDefinition[];
}

export interface BuiltInMedicalFormDefinition {
  slug: string;
  name: string;
  description: string;
  sourceLabel: string;
  questions: BuiltInQuestionDefinition[];
}
