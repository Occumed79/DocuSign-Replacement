import type { BuiltInMedicalFormDefinition, BuiltInQuestionDefinition } from "./types";

const STATUS_OPTIONS = ["Current", "Resolved", "Historical only", "Intermittent", "Marked in error"];
const STATUS_TRIGGER = "current|resolved|historical only|intermittent";

function q(
  key: string,
  text: string,
  section: string,
  answerType: BuiltInQuestionDefinition["answerType"] = "text",
  options: string[] = [],
  followUps: BuiltInQuestionDefinition[] = [],
  triggerValue: string | null = null,
  required = true,
  helpText: string | null = null,
): BuiltInQuestionDefinition {
  return { key, text, section, answerType, options, followUps, triggerValue, required, helpText };
}

function detailQuestions(item: string, section: string, prompts: string[]): BuiltInQuestionDefinition[] {
  return prompts.map((prompt, index) => q(`${item}.detail.${index + 1}`, prompt, section));
}

function history(
  item: string,
  label: string,
  section: string,
  prompts: string[],
  triggerValue = "yes",
): BuiltInQuestionDefinition {
  const status = q(
    `${item}.status`,
    "How should this history be classified?",
    section,
    "dropdown",
    STATUS_OPTIONS,
    detailQuestions(item, section, prompts),
    STATUS_TRIGGER,
    true,
    "Choose “Marked in error” if this answer was selected accidentally. No additional detail will be requested.",
  );

  return q(item, `${item.toUpperCase()} — ${label}`, section, "yes_no", [], [status], triggerValue);
}

const basePrompts = (condition = "condition, issue, or event") => [
  `Please describe the ${condition}.`,
  "When did it occur or when were you diagnosed?",
  "What treatment, evaluation, or surgery did you receive, if any?",
  "Do you have any current symptoms, restrictions, limitations, or ongoing monitoring related to it?",
];

const identification: BuiltInQuestionDefinition[] = [
  q("1", "1 — Last name, first name, middle name (suffix)", "Identification"),
  q("2", "2 — Social Security Number", "Identification", "text", [], [], null, true, "Enter the SSN requested by the source form."),
  q("3", "3 — Today’s date", "Identification", "date"),
  q("4a", "4.a — Home address", "Identification"),
  q("4b", "4.b — Home telephone", "Identification"),
  q("5", "5 — Examining location and address", "Identification", "text", [], [], null, false),
  q("6a", "6.a — Service", "Service / Examination", "dropdown", ["Army", "Navy", "Marine Corps", "Air Force", "Coast Guard", "Other"]),
  q("6b", "6.b — Component", "Service / Examination", "dropdown", ["Regular", "Reserve", "National Guard", "Other"]),
  q("6c", "6.c — Purpose of examination", "Service / Examination", "dropdown", ["Enlistment", "Commission", "Retention", "Separation", "Medical Board", "Retirement", "U.S. Service Academy", "ROTC Scholarship Program", "Other"]),
  q("7a", "7.a — Position (title, grade, component)", "Service / Examination", "text", [], [], null, false),
  q("7b", "7.b — Usual occupation", "Service / Examination"),
  q("8", "8 — Current medications (prescription and over-the-counter)", "Current Health", "text", [], [], null, true, "List medication name, dose, and frequency when known."),
  q("9", "9 — Allergies (including insect bites/stings, foods, medicine, or other substances)", "Current Health", "text", [], [], null, true, "Enter “None” if there are no known allergies."),
];

const respiratory: BuiltInQuestionDefinition[] = [
  history("10a", "Tuberculosis", "Respiratory / Pulmonary", [
    "Were you diagnosed with active tuberculosis, latent tuberculosis, or only a positive test?",
    "When did the diagnosis or positive test occur?",
    "Did you receive treatment? If so, what treatment and when was it completed?",
    "Do you have any current symptoms, restrictions, or follow-up needs?",
  ]),
  history("10b", "Lived with someone who had tuberculosis", "Respiratory / Pulmonary", [
    "When did this exposure occur?",
    "Were you tested as a result of the exposure? What was the result?",
    "Did you receive treatment or preventive therapy?",
    "Do you have any current symptoms or monitoring related to the exposure?",
  ]),
  history("10c", "Coughed up blood", "Respiratory / Pulmonary", [
    "When did this occur?",
    "Was it a one-time event or recurrent?",
    "Did you receive evaluation or treatment?",
    "Do you have any current symptoms or limitations related to it?",
  ]),
  history("10d", "Asthma or breathing problems related to exercise, weather, pollens, etc.", "Respiratory / Pulmonary", [
    "When were you diagnosed or when did the breathing problem begin?",
    "Do you currently have symptoms? How often do they occur?",
    "What tends to trigger the symptoms?",
    "Are you using an inhaler or other treatment? If so, what do you use and how often?",
    "Does this affect exercise, work, or daily activities?",
  ]),
  history("10e", "Shortness of breath", "Respiratory / Pulmonary", [
    "How often does the shortness of breath occur?",
    "What tends to trigger it?",
    "Have you been evaluated or treated for it?",
    "Does it limit daily activities, exercise, or work?",
  ]),
  history("10f", "Bronchitis", "Respiratory / Pulmonary", [
    "When was your most recent episode?",
    "Was it a single episode or recurrent?",
    "Did you receive treatment?",
    "Do you have any current respiratory symptoms or limitations?",
  ]),
  history("10g", "Wheezing or problems with wheezing", "Respiratory / Pulmonary", [
    "How often does the wheezing occur?",
    "What tends to trigger it?",
    "Are you receiving treatment or taking medication for it?",
    "Does it limit activities, exercise, or work?",
  ]),
  history("10h", "Been prescribed or used an inhaler", "Respiratory / Pulmonary", [
    "What inhaler have you used?",
    "What condition was it prescribed for?",
    "Are you still using it? If so, how often?",
    "Do you still have symptoms or limitations related to that condition?",
  ]),
  history("10i", "A chronic cough or cough at night", "Respiratory / Pulmonary", [
    "How often does the cough occur?",
    "Have you been evaluated or treated for it?",
    "Does it interfere with sleep, daily activities, or work?",
  ]),
  history("10j", "Sinusitis", "Eye / Ear / Nose / Throat", [
    "How often do sinus symptoms occur?",
    "What symptoms do you have?",
    "Are you receiving treatment or taking medication?",
    "Does it affect daily activities or work?",
  ]),
  history("10k", "Hay fever", "Eye / Ear / Nose / Throat", [
    "Are you referring to seasonal allergies or another allergic condition?",
    "What symptoms do you have and how often?",
    "Are you taking medication or receiving treatment?",
    "Does it affect daily activities or work?",
  ]),
  history("10l", "Chronic or frequent colds", "Eye / Ear / Nose / Throat", [
    "How often do you get colds or similar symptoms?",
    "Has this been evaluated by a provider?",
    "Does it affect daily activities, attendance, or work?",
  ]),
];

const ent: BuiltInQuestionDefinition[] = [
  history("11a", "Severe tooth or gum trouble", "Eye / Ear / Nose / Throat", basePrompts("dental condition")),
  history("11b", "Thyroid trouble or goiter", "Eye / Ear / Nose / Throat", [
    "What thyroid condition are you referring to?",
    "When were you diagnosed?",
    "Are you receiving treatment or taking medication?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),
  history("11c", "Eye disorder or trouble", "Eye / Ear / Nose / Throat", [
    "What eye condition are you referring to?",
    "Are you receiving treatment or using vision correction?",
    "Does it affect daily activities or work?",
  ]),
  history("11d", "Ear, nose, or throat trouble", "Eye / Ear / Nose / Throat", [
    "What ear, nose, or throat condition are you referring to?",
    "What symptoms do you have?",
    "Are you receiving treatment?",
    "Does it affect communication, breathing, balance, or daily activities?",
  ]),
  history("11e", "Loss of vision in either eye", "Eye / Ear / Nose / Throat", [
    "Which eye is affected?",
    "When did the vision loss occur?",
    "Was it evaluated or treated?",
    "Does it currently affect daily activities or work?",
  ]),
  history("11f", "Worn contact lenses or glasses", "Eye / Ear / Nose / Throat", [
    "What type of corrective lenses do you use?",
    "Are they for reading, distance, or both?",
    "Do they fully correct your vision for daily activities and work?",
    "Do you have any other vision-related limitations?",
  ]),
  history("11g", "A hearing loss or wear a hearing aid", "Eye / Ear / Nose / Throat", [
    "What hearing issue are you referring to?",
    "Do you use a hearing aid or other device?",
    "Does it affect communication, situational awareness, or work?",
  ]),
  history("11h", "Surgery to correct vision (RK, PRK, LASIK, etc.)", "Eye / Ear / Nose / Throat", [
    "What vision-correction procedure did you have?",
    "When was it performed?",
    "Were there any complications or additional treatment?",
    "Do you have any current vision symptoms or limitations?",
  ]),
];

const musculoskeletal: BuiltInQuestionDefinition[] = [
  history("12a", "Painful shoulder, elbow, or wrist", "Musculoskeletal / Mobility", ["What body area is affected?", "How often does the pain occur and what triggers it?", "Are you receiving treatment or taking medication?", "Does it affect daily activities or work?"]),
  history("12b", "Arthritis, rheumatism, or bursitis", "Musculoskeletal / Mobility", ["What diagnosis are you referring to?", "What body areas are affected?", "Are you receiving treatment or taking medication?", "Does it cause any current restrictions, limitations, or work impact?"]),
  history("12c", "Recurrent back pain or any back problem", "Musculoskeletal / Mobility", ["When did the back problem begin or occur?", "How often do you have symptoms and what triggers them?", "Are you receiving treatment or taking medication?", "Do you have any current restrictions, limitations, or work impact?"]),
  history("12d", "Numbness or tingling", "Musculoskeletal / Mobility", ["What body area is affected?", "How often do symptoms occur?", "Have you been evaluated or treated?", "Does it affect daily activities or work?"]),
  history("12e", "Loss of finger or toe", "Musculoskeletal / Mobility", ["Which finger or toe is affected?", "When did this occur?", "Do you have any current functional limitations or work impact related to it?"]),
  history("12f", "Foot trouble (pain, corns, bunions, etc.)", "Musculoskeletal / Mobility", ["What foot condition are you referring to?", "Do you have pain or other symptoms now?", "Have you received treatment?", "Does it affect walking, standing, daily activities, or work?"]),
  history("12g", "Impaired use of arms, legs, hands, or feet", "Musculoskeletal / Mobility", ["What body area is affected?", "What condition caused the impairment?", "What treatment have you received?", "Does it cause current restrictions, limitations, or work impact?"]),
  history("12h", "Swollen or painful joint(s)", "Musculoskeletal / Mobility", ["Which joints are affected?", "How often do symptoms occur?", "Are you receiving treatment?", "Does it affect daily activities or work?"]),
  history("12i", "Knee trouble (locking, giving out, pain, ligament injury, etc.)", "Musculoskeletal / Mobility", ["Which knee is affected?", "What symptoms do you have and how often?", "Have you received treatment or surgery?", "Does it currently affect daily activities or work?"]),
  history("12j", "Any knee or foot surgery, including arthroscopy or use of a scope to any bone or joint", "Musculoskeletal / Mobility", ["What surgery or procedure did you have?", "What body part was treated and when?", "Why was the procedure needed?", "Have you fully recovered?", "Do you have any current pain, restrictions, or limitations?"]),
  history("12k", "Need to use corrective devices such as prosthetic devices, knee braces, back supports, lifts, or orthotics", "Musculoskeletal / Mobility", ["What device do you use?", "What condition is it for?", "How often do you need to use it?", "Does the underlying condition cause any current restrictions, limitations, or work impact?"]),
  history("12l", "Bone, joint, or other deformity", "Musculoskeletal / Mobility", ["What condition or deformity are you referring to?", "When was it diagnosed?", "Does it cause any restrictions, limitations, or work impact?"]),
  history("12m", "Plate(s), screw(s), rod(s), or pin(s) in any bone", "Musculoskeletal / Mobility", ["What body part was involved?", "When was the surgery or treatment performed?", "Was the issue fully resolved?", "Do you have any current pain, restrictions, or limitations related to it?"]),
  history("12n", "Broken bone(s) (cracked or fractured)", "Musculoskeletal / Mobility", ["What bone was broken or fractured?", "When did it occur?", "Did you receive treatment or surgery?", "Have you fully recovered?", "Do you have any current symptoms, restrictions, or limitations?"]),
];

const giRenal: BuiltInQuestionDefinition[] = [
  history("13a", "Frequent indigestion or heartburn", "Gastrointestinal / Renal", ["How often do symptoms occur?", "Have you been evaluated or treated for it?", "Are you taking medication?", "Does it affect eating, sleep, daily activities, or work?"]),
  history("13b", "Stomach, liver, intestinal trouble, or ulcer", "Gastrointestinal / Renal", basePrompts("stomach, liver, intestinal, or ulcer condition")),
  history("13c", "Gall bladder trouble or gallstones", "Gastrointestinal / Renal", ["What gallbladder issue are you referring to?", "When did it occur?", "Did you receive treatment or surgery?", "Is it still causing symptoms or limitations?"]),
  history("13d", "Jaundice or hepatitis (liver disease)", "Gastrointestinal / Renal", ["What type of hepatitis or liver condition are you referring to?", "When were you diagnosed?", "Did you receive treatment?", "Do you require current monitoring or follow-up?"]),
  history("13e", "Rupture / hernia", "Gastrointestinal / Renal", ["What type of hernia did you have or currently have?", "When did it occur?", "Was it repaired or treated?", "Do you have any current symptoms, restrictions, or limitations related to it?"]),
  history("13f", "Rectal disease, hemorrhoids, or blood from the rectum", "Gastrointestinal / Renal", basePrompts("rectal or hemorrhoid condition")),
  history("13g", "Skin diseases (acne, eczema, psoriasis, etc.)", "Gastrointestinal / Renal", ["What skin condition are you referring to?", "What symptoms do you have?", "Are you receiving treatment?", "Does it affect daily activities or work?"]),
  history("13h", "Frequent or painful urination", "Gastrointestinal / Renal", ["How often does this occur?", "Have you been evaluated or treated?", "Was a diagnosis made?", "Does it currently affect daily activities or work?"]),
  history("13i", "High or low blood sugar", "Gastrointestinal / Renal", ["Are you referring to diabetes, pre-diabetes, low blood sugar, or another condition?", "When were you diagnosed?", "Are you receiving treatment or taking medication?", "Do you have any current symptoms, restrictions, or monitoring needs?"]),
  history("13j", "Kidney stone or blood in urine", "Gastrointestinal / Renal", ["Are you referring to kidney stones, blood in urine, or both?", "When did it occur?", "Was treatment needed?", "Do you have any current symptoms, restrictions, or follow-up needs?"]),
  history("13k", "Sugar or protein in urine", "Gastrointestinal / Renal", ["When was this identified?", "Was it evaluated by a provider?", "Was a diagnosis made?", "Do you have any current symptoms, treatment, or follow-up needs?"]),
  history("13l", "Sexually transmitted disease (syphilis, gonorrhea, chlamydia, genital warts, herpes, etc.)", "Gastrointestinal / Renal", ["What diagnosis are you referring to?", "When was it diagnosed?", "Did you receive treatment?", "Do you have any current symptoms, restrictions, or follow-up needs?"]),
];

const generalHealth: BuiltInQuestionDefinition[] = [
  history("14a", "Adverse reaction to serum, food, insect stings, or medicine", "General Health", ["What caused the reaction?", "What type of reaction did you have?", "When was the most recent reaction?", "Have you ever required emergency treatment?", "Do you carry or use medication for this reaction?"]),
  history("14b", "Recent unexplained gain or loss of weight", "General Health", ["How much weight did you gain or lose?", "Over what period of time?", "Has a provider evaluated the change?", "Was a cause or diagnosis identified?", "Is the weight change still ongoing?"]),
  history("14c", "Currently in good health", "General Health", ["What current health issue or concern is affecting your health?", "Are you receiving treatment or taking medication for it?", "Does it cause any current restrictions, limitations, or work impact?"], "no"),
  history("14d", "Tumor, growth, cyst, or cancer", "General Health", ["What diagnosis are you referring to?", "When was it diagnosed?", "What treatment did you receive?", "Is there any current surveillance, follow-up, recurrence, or ongoing treatment?", "Do you have any current restrictions or limitations?"]),
];

const neurologic: BuiltInQuestionDefinition[] = [
  history("15a", "Dizziness or fainting spells", "Neurologic / Mental Health / Sleep", ["Are you referring to dizziness, fainting, or both?", "When did it occur and how often?", "Were you evaluated or treated?", "Do you have any current symptoms, restrictions, or limitations?"]),
  history("15b", "Frequent or severe headache", "Neurologic / Mental Health / Sleep", ["How often do headaches occur?", "How severe are they and are there known triggers?", "Are you receiving treatment or taking medication?", "Do they affect daily activities or work?"]),
  history("15c", "Head injury, memory loss, or amnesia", "Neurologic / Mental Health / Sleep", ["What head injury or related symptom are you referring to?", "When did it occur?", "Were you evaluated or treated?", "Do you have any current symptoms, restrictions, or limitations?"]),
  history("15d", "Paralysis", "Neurologic / Mental Health / Sleep", ["What paralysis history are you referring to?", "What body area was affected?", "When did it occur?", "Do you have any current restrictions or limitations?"]),
  history("15e", "Seizures, convulsions, epilepsy, or fits", "Neurologic / Mental Health / Sleep", ["When did this occur or when were you diagnosed?", "Was it a one-time event or recurrent?", "Are you receiving treatment or taking medication?", "When was the most recent event?", "Do you have any current restrictions or limitations?"]),
  history("15f", "Car, train, sea, or air sickness", "Neurologic / Mental Health / Sleep", ["What type of motion sickness do you have?", "How often does it occur?", "Are you receiving treatment or taking medication?", "Does it affect travel or daily activities?"]),
  history("15g", "A period of unconsciousness or concussion", "Neurologic / Mental Health / Sleep", ["When did it occur?", "Was it a one-time event or recurrent?", "Were you evaluated or treated?", "Do you have any current symptoms, restrictions, or limitations?"]),
  history("15h", "Meningitis, encephalitis, or other neurological problems", "Neurologic / Mental Health / Sleep", basePrompts("neurologic condition")),
];

const cardiac: BuiltInQuestionDefinition[] = [
  history("16a", "Rheumatic fever", "Cardiac / Vascular / Blood", ["When did the rheumatic fever occur?", "Did you receive treatment?", "Were there any heart-related complications?", "Do you have any current symptoms, restrictions, or follow-up related to it?"]),
  history("16b", "Prolonged bleeding (as after an injury or tooth extraction, etc.)", "Cardiac / Vascular / Blood", ["When did prolonged bleeding occur?", "Was a bleeding or clotting disorder diagnosed?", "Were you evaluated or treated?", "Do you have any current treatment, restrictions, or precautions related to it?"]),
  history("16c", "Pain or pressure in the chest", "Cardiac / Vascular / Blood", ["When did the chest pain or pressure begin?", "How often does it occur and what brings it on?", "Have you been evaluated by a provider or had cardiac testing?", "Are you receiving treatment or taking medication?", "Does it limit exertion, work, or daily activities?"]),
  history("16d", "Palpitation, pounding heart, or abnormal heartbeat", "Cardiac / Vascular / Blood", ["What symptom or rhythm problem are you referring to?", "How often does it occur?", "Have you been evaluated or treated?", "Do you experience dizziness, fainting, chest pain, or exercise intolerance with it?", "Do you have any current restrictions or monitoring needs?"]),
  history("16e", "Heart trouble or murmur", "Cardiac / Vascular / Blood", ["What heart condition or murmur are you referring to?", "When was it identified?", "Have you had cardiac testing or specialist evaluation?", "Are you receiving treatment or taking medication?", "Do you have any current symptoms, restrictions, or follow-up needs?"]),
  history("16f", "High or low blood pressure", "Cardiac / Vascular / Blood", ["Are you referring to high blood pressure, low blood pressure, or both?", "When were you diagnosed or when did the problem begin?", "Are you taking medication or receiving treatment?", "Is your blood pressure currently controlled?", "Do you have any current symptoms, restrictions, or monitoring needs?"]),
];

const mentalHealth: BuiltInQuestionDefinition[] = [
  history("17a", "Nervous trouble of any sort (anxiety or panic attacks)", "Neurologic / Mental Health / Sleep", ["What condition or symptoms are you referring to?", "When were you diagnosed or when did symptoms begin?", "Are you receiving treatment, counseling, or medication?", "Do you have any current symptoms, restrictions, or limitations?"]),
  history("17b", "Habitual stammering or stuttering", "Neurologic / Mental Health / Sleep", ["Does this currently affect communication, daily activities, or work performance?", "Have you received treatment or speech therapy?"]),
  history("17c", "Loss of memory or amnesia, or neurological symptoms", "Neurologic / Mental Health / Sleep", ["What memory or neurologic issue are you referring to?", "When did it occur?", "Have you been evaluated or treated?", "Does it affect daily activities or work?"]),
  history("17d", "Frequent trouble sleeping", "Neurologic / Mental Health / Sleep", ["How often does the sleep problem occur?", "Have you been evaluated or treated?", "Are you taking medication or using another treatment?", "Does it affect daytime alertness, concentration, daily activities, or work?"]),
  history("17e", "Received counseling of any type", "Neurologic / Mental Health / Sleep", ["What condition or concern led to counseling?", "When did counseling occur and is it current?", "Are you taking medication?", "Do you have any current symptoms, restrictions, or limitations?"]),
  history("17f", "Depression or excessive worry", "Neurologic / Mental Health / Sleep", ["When did this begin or when were you diagnosed?", "Are you receiving treatment, counseling, or medication?", "Do you have any current symptoms?", "Does it affect daily activities or work?"]),
  history("17g", "Been evaluated or treated for a mental condition", "Neurologic / Mental Health / Sleep", ["What condition were you evaluated or treated for?", "When did the evaluation or treatment occur?", "Are you receiving treatment or medication now?", "Do you have any current symptoms, restrictions, or limitations?"]),
  history("17h", "Attempted suicide", "Neurologic / Mental Health / Sleep", ["When did this occur?", "Were you hospitalized or treated afterward?", "Are you currently in treatment or monitoring?", "Do you have any current restrictions or safety-related follow-up needs?"]),
  history("17i", "Used illegal drugs or abused prescription drugs", "Neurologic / Mental Health / Sleep", ["What substance use issue are you referring to?", "When did it occur?", "Did you receive treatment or counseling?", "Is any treatment current?", "Does it currently affect daily activities, work, or functioning?"]),
];

const femaleQuestions: BuiltInQuestionDefinition[] = [
  history("18a", "Treatment for a gynecological (female) disorder", "Female-only History", ["What condition were you treated for?", "When did it occur or when were you diagnosed?", "Are you still receiving treatment or follow-up?", "Do you have any current symptoms or limitations?"]),
  history("18b", "A change of menstrual pattern", "Female-only History", ["What change occurred?", "When did it begin?", "Has a provider evaluated it?", "Is the change still current?"]),
  history("18c", "Any abnormal PAP smears", "Female-only History", ["When did the abnormal PAP occur?", "What follow-up evaluation or treatment was recommended or completed?", "Is any follow-up still pending?"]),
  q("18d", "18.d — First day of last menstrual period", "Female-only History", "date"),
  q("18e", "18.e — Date of last PAP smear", "Female-only History", "date", [], [], null, false),
];

const femaleGate = q(
  "female-gate",
  "For the female-only portion of DD Form 2807-1, should Items 18.a–18.e be presented?",
  "Female-only History",
  "dropdown",
  ["Yes", "No"],
  femaleQuestions,
  "yes",
  true,
  "Select Yes only when the female-only section applies to the applicant.",
);

const functionalAndGeneral: BuiltInQuestionDefinition[] = [
  history("19a", "Refused employment / unable to hold a job or stay in school because of sensitivity to chemicals, dust, sunlight, etc.", "Function / Employment / General History", ["What specific sensitivity or medical issue caused this?", "When did it occur?", "Did you receive treatment or evaluation?", "Do you currently have any restrictions, limitations, accommodations, or work impacts related to it?"]),
  history("19b", "Refused employment / unable to hold a job or stay in school because of inability to perform certain motions", "Function / Employment / General History", ["What medical issue caused the motion limitation?", "What motions were affected?", "When did this occur?", "Do you currently have any restrictions, limitations, accommodations, or work impacts related to it?"]),
  history("19c", "Refused employment / unable to hold a job or stay in school because of inability to stand, sit, kneel, lie down, etc.", "Function / Employment / General History", ["What medical issue caused the limitation?", "Which positions or activities were affected?", "When did this occur?", "Do you currently have any restrictions, limitations, accommodations, or work impacts related to it?"]),
  history("19d", "Refused employment / unable to hold a job or stay in school because of other medical reasons", "Function / Employment / General History", ["What specific medical issue caused this?", "When did it occur?", "Did you receive treatment or evaluation?", "Do you currently have any restrictions, limitations, accommodations, or work impacts related to it?"]),
  history("20", "Have you ever been treated in an Emergency Room?", "Function / Employment / General History", ["When did the emergency room visit occur?", "What condition or event was involved?", "What treatment did you receive?", "Do you have any current symptoms, restrictions, or follow-up related to it?"]),
  history("21", "Have you ever been a patient in any type of hospital?", "Function / Employment / General History", ["When were you hospitalized?", "What condition or event led to the hospitalization?", "What treatment did you receive?", "Do you have any current symptoms, restrictions, or follow-up related to it?"]),
  history("22", "Have you ever had, or have you ever been advised to have, any operations or surgery?", "Function / Employment / General History", ["What surgery or operation was recommended or performed?", "What condition was it for?", "When was it recommended or performed?", "If recommended, was it completed?", "Do you have any current symptoms, restrictions, limitations, or follow-up related to it?"]),
  history("23", "Have you ever had any illness or injury other than those already noted?", "Function / Employment / General History", basePrompts("illness or injury")),
  history("24", "Have you consulted or been treated by clinics, physicians, healers, or other practitioners within the past 5 years for other than minor illnesses?", "Function / Employment / General History", ["What condition or issue were you treated for?", "When did this occur?", "Are you still being treated or monitored?", "Do you have any current symptoms, restrictions, or limitations related to it?"]),
  history("25", "Have you ever been rejected for military service for any reason?", "Function / Employment / General History", ["When were you rejected?", "What medical or psychological issue was involved?", "Is the issue still current?", "Do you have any current restrictions, limitations, or treatment related to it?"]),
  history("26", "Have you ever been discharged from military service for any reason?", "Function / Employment / General History", ["When were you discharged?", "What medical or psychological issue was involved?", "Is the issue still current?", "Do you have any current restrictions, limitations, or treatment related to it?"]),
  history("27", "Have you ever received, is there pending, or have you ever applied for pension or compensation for any disability or injury?", "Function / Employment / General History", ["What condition or injury is associated with the pension or compensation?", "What percentage or rating is associated with it, if known?", "Do you have any current symptoms, restrictions, limitations, or treatment related to it?", "Does the condition currently affect work or daily activities?"]),
  history("28", "Have you ever been denied life insurance?", "Function / Employment / General History", ["When were you denied life insurance?", "What medical reason was involved, if known?", "Is that issue still current?", "Are you receiving treatment or monitoring for it now?"]),
];

export const dd2807Definition: BuiltInMedicalFormDefinition = {
  slug: "dd2807-1-aug-2011",
  name: "DD Form 2807-1 — Report of Medical History",
  description: "Reactive guided interview for DD Form 2807-1 (Aug 2011). Positive history answers open targeted clarification questions before review.",
  sourceLabel: "DD Form 2807-1, AUG 2011 + Occu-Med analyst follow-up bank",
  questions: [
    ...identification,
    ...respiratory,
    ...ent,
    ...musculoskeletal,
    ...giRenal,
    ...generalHealth,
    ...neurologic,
    ...cardiac,
    ...mentalHealth,
    femaleGate,
    ...functionalAndGeneral,
  ],
};
