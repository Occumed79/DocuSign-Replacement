import { logger } from "../logger";
import { dd2807Definition } from "./dd2807";
import { dd2795Definition } from "./dd2795";
import { ds1843Definition } from "./ds1843";
import { ds6570Definition } from "./ds6570";
import { ds6561Definition } from "./ds6561";
import { occuMedSedentaryDefinition } from "./occuMedSedentary";
import { polarDefinition } from "./polar";
import { postPeaceOfficerDefinition } from "./postPeaceOfficer";
import { occuMedCore2014Definition } from "./occuMedCore2014";
import { occuMedGoldDefinition } from "./occuMedGold";
import { absNorthAmericaDefinition } from "./absNorthAmerica";
import { ensureBuiltInMedicalForm } from "./install";

export const builtInMedicalFormDefinitions = [
  dd2807Definition,
  dd2795Definition,
  ds1843Definition,
  ds6570Definition,
  ds6561Definition,
  occuMedSedentaryDefinition,
  polarDefinition,
  postPeaceOfficerDefinition,
  occuMedCore2014Definition,
  occuMedGoldDefinition,
  absNorthAmericaDefinition,
];

export async function ensureBuiltInMedicalForms(): Promise<void> {
  for (const definition of builtInMedicalFormDefinitions) {
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
export { dd2795Definition } from "./dd2795";
export { ds1843Definition } from "./ds1843";
export { ds6570Definition } from "./ds6570";
export { ds6561Definition } from "./ds6561";
export { occuMedSedentaryDefinition } from "./occuMedSedentary";
export { polarDefinition } from "./polar";
export { postPeaceOfficerDefinition } from "./postPeaceOfficer";
export { occuMedCore2014Definition } from "./occuMedCore2014";
export { occuMedGoldDefinition } from "./occuMedGold";
export { absNorthAmericaDefinition } from "./absNorthAmerica";
export { validateBuiltInMedicalFormDefinition } from "./validation";
