import { logger } from "../logger";
import { dd2807Definition } from "./dd2807";
import { ensureBuiltInMedicalForm } from "./install";

export async function ensureBuiltInMedicalForms(): Promise<void> {
  const definitions = [dd2807Definition];

  for (const definition of definitions) {
    const result = await ensureBuiltInMedicalForm(definition);
    logger.info(
      {
        slug: result.slug,
        examTypeId: result.examTypeId,
        created: result.created,
        questionCount: result.questionCount,
      },
      result.created ? "Installed built-in medical form" : "Built-in medical form already installed",
    );
  }
}

export { dd2807Definition } from "./dd2807";
export { validateBuiltInMedicalFormDefinition } from "./install";
