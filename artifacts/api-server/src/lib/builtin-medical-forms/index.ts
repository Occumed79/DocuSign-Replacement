import { logger } from "../logger";
import { dd2807Definition } from "./dd2807";
import { dd2795Definition } from "./dd2795";
import { ds1843Definition } from "./ds1843";
import { ds6570Definition } from "./ds6570";
import { ds6561Definition } from "./ds6561";
import { occuMedSedentaryDefinition } from "./occuMedSedentary";
import { polarDefinition } from "./polar";
import { postPeaceOfficerDefinition } from "./postPeaceOfficer";
import { postPublicSafetyDispatcherDefinition } from "./postPublicSafetyDispatcher";
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
  postPublicSafetyDispatcherDefinition,
  occuMedCore2014Definition,
  occuMedGoldDefinition,
  absNorthAmericaDefinition,
];

export async function ensureBuiltInMedicalForms(): Promise<void> {
  for (const definition of builtInMedicalFormDefinitions) {
    const result = await ensureBuiltInMedicalForm(definition);
    const protectedFromRefresh = (result.protectedCaseCount ?? 0) > 0 || (result.protectedAnswerCount ?? 0) > 0;

    logger.info(
      {
        slug: result.slug,
        examTypeId: result.examTypeId,
        created: result.created,
        refreshed: result.refreshed,
        questionCount: result.questionCount,
        protectedCaseCount: result.protectedCaseCount ?? 0,
        protectedAnswerCount: result.protectedAnswerCount ?? 0,
      },
      result.created
        ? "Installed built-in medical form"
        : result.refreshed
          ? "Refreshed built-in medical form from current source definition"
          : protectedFromRefresh
            ? "Built-in medical form differs from source but was protected because cases or answers already exist"
            : "Built-in medical form already matches current source definition",
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
export { postPublicSafetyDispatcherDefinition } from "./postPublicSafetyDispatcher";
export { occuMedCore2014Definition } from "./occuMedCore2014";
export { occuMedGoldDefinition } from "./occuMedGold";
export { absNorthAmericaDefinition } from "./absNorthAmerica";
export { validateBuiltInMedicalFormDefinition } from "./validation";
