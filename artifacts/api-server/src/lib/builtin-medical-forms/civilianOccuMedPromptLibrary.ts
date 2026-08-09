type PromptRule = {
  matches: (label: string) => boolean;
  prompts: string[];
};

const p = (...prompts: string[]) => prompts;
const hasAny = (s: string, ...parts: string[]) => parts.some(part => s.includes(part));

/**
 * Applicant-facing clarification for civilian / employment questionnaires.
 *
 * Source forms and real analyst examples identify the medical subject matter,
 * but they do not dictate applicant wording. Every prompt below is deliberately
 * written to be open, factual, bounded, and condition-specific. Expected answers
 * such as CPAP, A1C, inhaler use, named complications, job impact, or personal-life
 * impact are not fed to the applicant unless the source question itself asks for
 * that subject. There is intentionally no generic fallback.
 */
const rules: PromptRule[] = [
  {
    matches: s => s.includes("limiting injury"),
    prompts: p(
      "What injury caused the limitation you reported, and what is its current status?",
      "What treatment or medical follow-up has occurred for the injury?",
    ),
  },
  {
    matches: s => s.includes("claim"),
    prompts: p(
      "What injury or medical condition is associated with the claim you reported?",
      "What is the current status of that condition and the claim?",
    ),
  },
  {
    matches: s => s.includes("disability") || s.includes("disabled through"),
    prompts: p(
      "What medical condition or conditions are associated with the disability determination or benefits you reported?",
      "What is the current medical status of those conditions?",
    ),
  },

  // Source-specific items that would otherwise collide with broader terms.
  {
    matches: s => s.includes("skin rash") || s.includes("skin sensitivity"),
    prompts: p(
      "What skin problem or sensitivity are you reporting, and what is its current pattern?",
      "How has the skin problem been evaluated or treated?",
    ),
  },
  {
    matches: s => hasAny(s, "carpal tunnel", "ganglionic cyst", "tendonitis", "bursitis"),
    prompts: p(
      "What upper-extremity condition was identified, and which area is affected?",
      "What is the current status and treatment of the condition?",
    ),
  },
  {
    matches: s => s.includes("interfere with your daily activities"),
    prompts: p(
      "What wrist, arm, or shoulder problem is causing the interference reported on the source question?",
      "What is the current status of that problem?",
    ),
  },
  {
    matches: s => s.includes("medical treatment for this pain") || s.includes("currently receive, medical treatment"),
    prompts: p(
      "What pain or discomfort is being treated, and what treatment are you receiving?",
      "What is the current status of the problem being treated?",
    ),
  },
  {
    matches: s => s.includes("awakened while sleeping"),
    prompts: p("Which of the symptoms you reported has interrupted your sleep, and what is the current pattern?"),
  },
  {
    matches: s => s.includes("auto accident") && (s.includes("surgery") || s.includes("lasting pain")),
    prompts: p(
      "What injury or lasting medical issue resulted from the auto accident?",
      "What treatment or medical follow-up occurred for it?",
    ),
  },
  {
    matches: s => s.includes("kidney disease or stones"),
    prompts: p(
      "What kidney condition or stone history are you reporting, and what is its current status?",
      "What treatment or medical follow-up has occurred?",
    ),
  },
  {
    matches: s => s.includes("decompression") || s.includes("air embol"),
    prompts: p(
      "What decompression-sickness or air-embolism event occurred, and what is its current status?",
      "What treatment or medical follow-up occurred afterward?",
    ),
  },

  // Exposure history.
  {
    matches: s => s.includes("prolonged loud noises"),
    prompts: p(
      "What loud-noise exposure are you reporting, and when did it occur?",
      "What hearing evaluation or medical follow-up, if any, has occurred since the exposure?",
    ),
  },
  {
    matches: s => s.includes("irritated your skin") || s.includes("irritated your skin or eyes"),
    prompts: p(
      "What substance caused the skin or eye irritation, and what reaction occurred?",
      "What treatment or medical follow-up, if any, occurred?",
    ),
  },
  {
    matches: s => s.includes("breathing difficulties") && s.includes("substance"),
    prompts: p(
      "What substance caused the breathing difficulty, and what reaction occurred?",
      "What treatment or medical follow-up, if any, occurred?",
    ),
  },
  {
    matches: s => s.includes("sprays or powders"),
    prompts: p("What spray or powder exposure are you reporting, and what reaction or medical issue occurred?"),
  },
  {
    matches: s => s.includes("x-rays") || s.includes("radiation"),
    prompts: p(
      "What radiation exposure are you reporting, and when did it occur?",
      "What medical monitoring or follow-up, if any, occurred afterward?",
    ),
  },
  {
    matches: s => s.includes("dusty conditions") || s.includes("sandblasting"),
    prompts: p(
      "What dust exposure are you reporting, and when did it occur?",
      "What respiratory evaluation or medical follow-up, if any, has occurred?",
    ),
  },
  {
    matches: s => s.includes("high environmental temperatures"),
    prompts: p(
      "What reaction occurred with high environmental temperatures, and what is its current status?",
      "What medical evaluation or treatment occurred for the reaction?",
    ),
  },
  {
    matches: s => s.includes("low environmental temperatures"),
    prompts: p(
      "What reaction occurred with low environmental temperatures, and what is its current status?",
      "What medical evaluation or treatment occurred for the reaction?",
    ),
  },

  // Respiratory / pulmonary.
  {
    matches: s => s.includes("positive reaction") && s.includes("ppd"),
    prompts: p(
      "What is the history of the positive TB skin test you reported?",
      "What treatment or medical follow-up occurred afterward?",
    ),
  },
  {
    matches: s => s.includes("tuberculosis"),
    prompts: p(
      "What is the history and current status of the tuberculosis or positive TB testing you reported?",
      "What treatment or medical follow-up has occurred?",
    ),
  },
  {
    matches: s => s.includes("pneumonia"),
    prompts: p(
      "What is the history of the pneumonia you reported, including the most recent episode?",
      "What treatment or medical follow-up occurred?",
    ),
  },
  {
    matches: s => s.includes("bronchitis"),
    prompts: p(
      "What is the current pattern or history of the bronchitis you reported?",
      "How has it been evaluated or treated?",
    ),
  },
  {
    matches: s => s.includes("emphysema"),
    prompts: p(
      "What is the current status of your emphysema?",
      "How is the condition currently being treated or monitored?",
    ),
  },
  {
    matches: s => s.includes("asthma"),
    prompts: p(
      "What is the current pattern and status of your asthma?",
      "How has your asthma been treated or managed?",
    ),
  },
  {
    matches: s => s.includes("pneumothorax"),
    prompts: p(
      "What is the history of the pneumothorax you reported, and what is its current status?",
      "What treatment or medical follow-up occurred?",
    ),
  },
  {
    matches: s => s.includes("shortness of breath"),
    prompts: p(
      "What is the current pattern of the shortness of breath you reported?",
      "What evaluation or treatment have you had for it?",
    ),
  },
  {
    matches: s => hasAny(s, "chronic cough", "coughed up blood", "coughing up blood"),
    prompts: p(
      "What is the history and current status of the cough or coughing up blood you reported?",
      "What medical evaluation or treatment occurred for it?",
    ),
  },
  {
    matches: s => s.includes("embol"),
    prompts: p(
      "What is the history of the embolism you reported, and what is its current status?",
      "What treatment or medical follow-up occurred afterward?",
    ),
  },

  // Cardiovascular / neurologic.
  {
    matches: s => s.includes("high blood pressure"),
    prompts: p(
      "What is the history and current status of your high blood pressure?",
      "How is your blood pressure currently being managed or monitored?",
    ),
  },
  {
    matches: s => hasAny(s, "heart murmur", "heart disease", "heart trouble"),
    prompts: p(
      "What heart condition or finding was identified?",
      "What evaluation, follow-up, or treatment has occurred for it?",
    ),
  },
  {
    matches: s => s.includes("stroke"),
    prompts: p(
      "What is the history of the stroke you reported, and what is its current status?",
      "What medical follow-up or treatment occurred afterward?",
    ),
  },
  {
    matches: s => s.includes("chest pain"),
    prompts: p(
      "What is the current pattern of the chest pain you reported?",
      "What medical evaluation or treatment have you had for the chest pain?",
    ),
  },
  {
    matches: s => s.includes("loss of consciousness"),
    prompts: p(
      "What occurred when you lost consciousness, and when did it happen?",
      "What medical evaluation or follow-up occurred afterward?",
    ),
  },
  {
    matches: s => hasAny(s, "dizziness", "vertigo", "motion sickness"),
    prompts: p(
      "What is the current pattern of the dizziness, vertigo, or motion sickness you reported?",
      "What evaluation or treatment have you had for these symptoms?",
    ),
  },
  {
    matches: s => s.includes("migraine"),
    prompts: p(
      "What is the current pattern of the migraines you reported?",
      "How have the migraines been evaluated or treated?",
    ),
  },
  {
    matches: s => s.includes("headache"),
    prompts: p(
      "What is the current pattern of the headaches you reported?",
      "How have the headaches been evaluated or treated?",
    ),
  },
  {
    matches: s => hasAny(s, "epilepsy", "seizure", "convulsion"),
    prompts: p(
      "What seizure or epilepsy history was identified, and what is its current status?",
      "How has the condition been evaluated or treated?",
    ),
  },
  {
    matches: s => hasAny(s, "encephalitis", "meningitis"),
    prompts: p(
      "What is the history of the encephalitis or meningitis you reported, and what is its current status?",
      "What treatment or medical follow-up occurred?",
    ),
  },

  // GI / GU / endocrine.
  {
    matches: s => s.includes("hiatal") || s.includes("diaphragmatic hernia"),
    prompts: p(
      "What is the history and current status of the hiatal or diaphragmatic hernia you reported?",
      "What treatment or medical follow-up has occurred for it?",
    ),
  },
  {
    matches: s => s.includes("hernia"),
    prompts: p(
      "What type of hernia did you have, and what is its current status?",
      "What treatment or medical follow-up has occurred for it?",
    ),
  },
  {
    matches: s => s.includes("reflux"),
    prompts: p(
      "What is the current pattern of the reflux you reported?",
      "How is the reflux currently being managed or treated?",
    ),
  },
  {
    matches: s => s.includes("ulcer"),
    prompts: p(
      "What stomach or ulcer condition was identified, and what is its current status?",
      "What treatment or follow-up has occurred for it?",
    ),
  },
  {
    matches: s => s.includes("gall bladder"),
    prompts: p(
      "What gallbladder problem was identified, and what is its current status?",
      "What treatment, procedure, or follow-up occurred for it?",
    ),
  },
  {
    matches: s => s.includes("liver") || s.includes("hepatitis"),
    prompts: p(
      "What liver condition or type of hepatitis was identified, and what is its current status?",
      "What treatment or medical monitoring has occurred for it?",
    ),
  },
  {
    matches: s => s.includes("sleep apnea"),
    prompts: p(
      "What is the current status of your sleep apnea?",
      "How has your sleep apnea been evaluated or treated?",
    ),
  },
  {
    matches: s => s.includes("diabetes"),
    prompts: p(
      "How is your diabetes currently being managed?",
      "What recent monitoring or medical follow-up have you had for it?",
    ),
  },
  {
    matches: s => s.includes("kidney stone"),
    prompts: p(
      "What is the history and current status of the kidney stones you reported?",
      "What treatment or medical follow-up has occurred for them?",
    ),
  },
  {
    matches: s => s.includes("kidney disease"),
    prompts: p(
      "What kidney condition was identified, and what is its current status?",
      "What treatment or medical follow-up have you had for it?",
    ),
  },
  {
    matches: s => s.includes("hyperthyroid"),
    prompts: p(
      "What is the current status of your hyperthyroidism?",
      "How is the condition currently being treated or monitored?",
    ),
  },
  {
    matches: s => s.includes("hypothyroid"),
    prompts: p(
      "What is the current status of your hypothyroidism?",
      "How is the condition currently being treated or monitored?",
    ),
  },
  {
    matches: s => s.includes("thyroid"),
    prompts: p(
      "What thyroid condition was identified, and what is its current status?",
      "How is the condition currently being treated or monitored?",
    ),
  },

  // Blood / immune / infectious / cancer.
  {
    matches: s => s.includes("anemia") || s.includes("blood disorder"),
    prompts: p(
      "What blood condition was identified, and what is its current status?",
      "How is the condition currently being treated or monitored?",
    ),
  },
  {
    matches: s => s.includes("rheumatic fever"),
    prompts: p(
      "What is the history of the rheumatic fever you reported, and what is its current status?",
      "What medical follow-up occurred afterward?",
    ),
  },
  {
    matches: s => s.includes("scarlet fever"),
    prompts: p(
      "What is the history of the scarlet fever you reported, and what is its current status?",
      "What treatment or medical follow-up occurred?",
    ),
  },
  {
    matches: s => s.includes("typhoid"),
    prompts: p(
      "What is the history of the typhoid fever you reported, and what is its current status?",
      "What treatment or medical follow-up occurred?",
    ),
  },
  {
    matches: s => s.includes("valley fever") || s.includes("coccidio"),
    prompts: p(
      "What is the history and current status of the Valley Fever you reported?",
      "What treatment or medical follow-up has occurred?",
    ),
  },
  {
    matches: s => s.includes("histoplasmosis"),
    prompts: p(
      "What is the history and current status of the histoplasmosis you reported?",
      "What treatment or medical follow-up has occurred?",
    ),
  },
  {
    matches: s => s.includes("skin cancer"),
    prompts: p(
      "What type of skin cancer was identified, and what is its current status?",
      "What treatment or medical surveillance has occurred for it?",
    ),
  },
  {
    matches: s => s.includes("cancer"),
    prompts: p(
      "What type of cancer was identified, and what is its current status?",
      "What treatment or medical follow-up has occurred for it?",
    ),
  },
  {
    matches: s => s.includes("immune"),
    prompts: p(
      "What immune-system condition was identified, and what is its current status?",
      "How is the condition currently being treated or monitored?",
    ),
  },
  {
    matches: s => s.includes("infection"),
    prompts: p(
      "What infection are you reporting, and what is its current status?",
      "What treatment or medical follow-up occurred for it?",
    ),
  },

  // ENT / allergy / eye.
  {
    matches: s => s.includes("glaucoma"),
    prompts: p(
      "What is the current status of your glaucoma?",
      "How is the glaucoma currently being treated or monitored?",
    ),
  },
  {
    matches: s => hasAny(s, "problems with eyes", "vision or eye", "eyes/vision"),
    prompts: p(
      "What eye or vision problem was identified?",
      "How is the vision problem currently corrected, treated, or monitored?",
    ),
  },
  {
    matches: s => s.includes("perforated ear") || s.includes("ear or ear drum"),
    prompts: p(
      "What ear or eardrum problem occurred, and what is its current status?",
      "What evaluation or treatment occurred for it?",
    ),
  },
  {
    matches: s => s.includes("sinus trouble"),
    prompts: p(
      "What is the current pattern of the sinus problem you reported?",
      "How has it been evaluated or treated?",
    ),
  },
  {
    matches: s => s.includes("sore throat"),
    prompts: p(
      "What is the current pattern of the recurring sore throats you reported?",
      "What evaluation or treatment have you had for them?",
    ),
  },
  {
    matches: s => s.includes("colds more than"),
    prompts: p(
      "What is the pattern of the frequent colds you reported?",
      "What medical evaluation, if any, has occurred for this pattern?",
    ),
  },
  {
    matches: s => s.includes("hay fever") || s.includes("allergic rhinitis"),
    prompts: p(
      "What is the current pattern of the allergy symptoms you reported?",
      "How are the symptoms currently being managed?",
    ),
  },

  // Musculoskeletal / pain.
  {
    matches: s => s.includes("back or joint surgery"),
    prompts: p(
      "What back or joint surgery did you have, and what is the current status of the underlying problem?",
      "What follow-up or treatment has occurred since the surgery?",
    ),
  },
  {
    matches: s => s.includes("back or joint pain"),
    prompts: p(
      "Where is the back or joint pain located, and what is its current pattern?",
      "How has the pain been evaluated or managed?",
    ),
  },
  {
    matches: s => s.includes("back injury"),
    prompts: p(
      "What back injury occurred, and what is its current status?",
      "What treatment or medical follow-up occurred after the injury?",
    ),
  },
  {
    matches: s => s.includes("cervical neck") || s.includes("neck injury"),
    prompts: p(
      "What neck injury or problem was identified, and what is its current status?",
      "What treatment or medical follow-up has occurred for it?",
    ),
  },
  {
    matches: s => s.includes("knee surgery"),
    prompts: p(
      "What knee surgery did you have, and what is the current status of the knee?",
      "What treatment or follow-up has occurred since the surgery?",
    ),
  },
  {
    matches: s => s.includes("upper extremity"),
    prompts: p(
      "What upper-extremity injury or problem was identified, and which area is affected?",
      "What is the current status and treatment of the problem?",
    ),
  },
  {
    matches: s => s.includes("lower extremity"),
    prompts: p(
      "What lower-extremity injury or problem was identified, and which area is affected?",
      "What is the current status and treatment of the problem?",
    ),
  },
  {
    matches: s => s.includes("numbness") || (s.includes("pins") && s.includes("hands")),
    prompts: p(
      "What is the pattern of the numbness, tingling, or loss of sensation in your hands?",
      "What evaluation or treatment have you had for these symptoms?",
    ),
  },
  {
    matches: s => s.includes("forearm") || s.includes("elbow"),
    prompts: p(
      "Which arm is affected, and what is the current pattern of the forearm or elbow symptoms?",
      "How has the problem been evaluated or treated?",
    ),
  },
  {
    matches: s => s.includes("shoulder") && !s.includes("surgery"),
    prompts: p(
      "Which shoulder is affected, and what is the current pattern of the symptoms?",
      "How has the shoulder problem been evaluated or treated?",
    ),
  },
  {
    matches: s => s.includes("knee pain") || s.includes("popping") || s.includes("locking"),
    prompts: p(
      "Which knee is affected, and what is the current pattern of the pain, popping, or locking?",
      "What evaluation or treatment have you had for the knee problem?",
    ),
  },
  {
    matches: s => s.includes("foot pain"),
    prompts: p(
      "Which foot is affected, and what is the current pattern of the pain?",
      "How has the foot pain been evaluated or treated?",
    ),
  },
  {
    matches: s => s.includes("rheumatism") || s.includes("arthritis") || s.includes("gout"),
    prompts: p(
      "What joint or inflammatory condition was identified, and which areas are affected?",
      "What is the current pattern and management of the condition?",
    ),
  },
  {
    matches: s => s.includes("presently experiencing any pain") || s.includes("current pain or discomfort"),
    prompts: p(
      "Where is the pain or discomfort, and what is its current pattern?",
      "How is the pain or discomfort currently being evaluated or managed?",
    ),
  },

  // Vascular / skin / behavioral health.
  {
    matches: s => s.includes("varicose"),
    prompts: p(
      "What is the current status of the varicose-vein problem you reported?",
      "What treatment or medical monitoring has occurred for it?",
    ),
  },
  {
    matches: s => s.includes("phlebitis") || s.includes("vascular problem") || s.includes("pvd"),
    prompts: p(
      "What vascular condition was identified, and what is its current status?",
      "What treatment or medical monitoring has occurred for it?",
    ),
  },
  {
    matches: s => s.includes("bleeding gums") || (s.includes("bleeding") && s.includes("nose")),
    prompts: p(
      "What bleeding problem are you reporting, and what is its current pattern?",
      "What medical or dental evaluation has occurred for it?",
    ),
  },
  {
    matches: s => s.includes("psychological") || s.includes("psychiatric"),
    prompts: p(
      "What condition was identified, and what is its current status?",
      "What treatment or clinical follow-up is currently in place, if any?",
    ),
  },

  // Additional-history source items.
  {
    matches: s => s.includes("gained or lost more than"),
    prompts: p(
      "What weight change occurred, and over what period of time?",
      "What medical explanation or evaluation, if any, has been identified for the change?",
    ),
  },
  {
    matches: s => s.includes("changes in your appetite"),
    prompts: p(
      "What change in appetite have you noticed, and what is its current pattern?",
      "What medical evaluation, if any, has occurred for the change?",
    ),
  },
  {
    matches: s => s.includes("fatigue") || s.includes("weakness"),
    prompts: p(
      "What is the current pattern of the fatigue or weakness you reported?",
      "What evaluation or treatment have you had for it?",
    ),
  },
  {
    matches: s => s.includes("mole") || s.includes("wart"),
    prompts: p(
      "What change did you notice in the mole or wart, and what is its current status?",
      "What medical evaluation or treatment has occurred for it?",
    ),
  },
  {
    matches: s => s.includes("smoke") || s.includes("tobacco"),
    prompts: p("What tobacco use are you reporting, and what is its current status?"),
  },
  {
    matches: s => s.includes("drink alcohol"),
    prompts: p("What is your current pattern of alcohol use?"),
  },
  {
    matches: s => s.includes("alcoholism"),
    prompts: p(
      "What is the current status of the alcohol-related condition or treatment you reported?",
      "What treatment or clinical follow-up has occurred?",
    ),
  },
  {
    matches: s => s.includes("hazardous recreation"),
    prompts: p("What recreational activity are you reporting, and how often do you participate in it?"),
  },
  {
    matches: s => s.includes("female disorder"),
    prompts: p(
      "What medical condition or disorder are you reporting, and what is its current status?",
      "What treatment or medical follow-up has occurred for it?",
    ),
  },
  {
    matches: s => s.includes("pregnant"),
    prompts: [],
  },
  {
    matches: s => s.includes("male disorder"),
    prompts: p(
      "What medical condition or disorder are you reporting, and what is its current status?",
      "What treatment or medical follow-up has occurred for it?",
    ),
  },
  {
    matches: s => s.includes("job require arm") || s.includes("actions to be repeated"),
    prompts: p("What repeated arm, hand, or finger activity is required by the source question?"),
  },
  {
    matches: s => s.includes("corrective lenses"),
    prompts: [],
  },
  {
    matches: s => s.includes("auto accident"),
    prompts: p(
      "What injury, if any, resulted from the auto accident you reported?",
      "What is the current status of any medical issue related to the accident?",
    ),
  },
  {
    matches: s => s.includes("other medical condition") || s.includes("medical conditions you have which are not listed"),
    prompts: p(
      "What medical condition are you reporting, and what is its current status?",
      "What treatment or medical follow-up has occurred for it?",
    ),
  },

  // Generic injury comes last so named body-area/source items above win first.
  {
    matches: s => s.includes("injur") && !hasAny(s, "upper", "lower", "back", "neck"),
    prompts: p(
      "What injury occurred, and what is its current status?",
      "What treatment or medical follow-up occurred after the injury?",
    ),
  },
];

export function civilianOccuMedPrompts(label: string): string[] {
  const normalized = label.toLowerCase();
  const rule = rules.find(candidate => candidate.matches(normalized));

  if (!rule) {
    throw new Error(`No civilian applicant prompt has been deliberately written for source label: ${label}`);
  }

  return [...rule.prompts];
}
