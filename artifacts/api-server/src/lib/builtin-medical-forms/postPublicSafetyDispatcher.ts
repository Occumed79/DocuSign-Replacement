import { civilianHistory, form, text } from "./definition-helpers";

const ph = (key: string, label: string, section: string, prompts: string[]) =>
  civilianHistory(key, `${key} — ${label}`, section, prompts, { allowUnsure: true });

const item = (key: string, label: string, prompts: string[] = []) =>
  ph(key, label, "Section 3 — Medical History", prompts);

const general = [
  item("10", "Have you ever worked as a public safety dispatcher before?"),
  item("11", "Have you ever failed to complete a public safety dispatcher training program?", [
    "What circumstances led to the training program not being completed?",
  ]),
  item("12", "Have you ever failed a pre-placement medical examination?", [
    "What medical issue was identified during that examination, and what is its current status?",
  ]),
  item("13", "Have you ever been refused employment or been unable to hold a job because of any physical, psychological, or other medically-related reason?", [
    "What medical issue was involved, and what is its current status?",
  ]),
  item("14", "Are you currently under a health care provider's care for any medical condition?", [
    "What condition is currently being followed, and what care is in place?",
  ]),
  item("15", "Do you have any physical limitations?", [
    "What physical limitation are you reporting, and what is its current status?",
  ]),
  item("16", "Do you need any reasonable accommodation to assist you in performing required job tasks?", [
    "What accommodation is needed, and what medical condition is it related to?",
  ]),
  item("17", "Have you ever been absent from work due to job stress?", [
    "What medical or psychological condition was associated with the absence, and what is its current status?",
  ]),
  item("18", "Have you missed more than five days from work in the past 12 months due to medically-related reasons?", [
    "What medical condition or conditions were associated with the absences, and what is their current status?",
  ]),
  item("19", "Have you ever been absent from work because of back/neck pain or problems?", [
    "What back or neck problem was associated with the absence, and what is its current status?",
  ]),
  item("20", "Have you ever seen a doctor for back/neck pain or problems?", [
    "What back or neck problem was evaluated, and what is its current status?",
    "What treatment or medical follow-up occurred?",
  ]),
  item("21", "In the past year, have you had a change in the size and color of a mole or a sore that would not heal?", [
    "What change or non-healing sore are you reporting, and what is its current status?",
    "What medical evaluation or treatment has occurred?",
  ]),
  item("22", "Do you occasionally use, or are you currently taking, any prescription or over-the-counter medications?", [
    "What medications are you currently taking, and what is each being used for?",
  ]),
  item("23", "Have you taken any medications within the past 12 months for any reason?", [
    "What medications did you take, and what was each being used for?",
  ]),
  item("24", "Have you sustained any disabling illnesses or medical conditions within the past 5 years?", [
    "What illness or medical condition are you reporting, and what is its current status?",
  ]),
  item("25", "Have you ever had a positive drug or alcohol test?", [
    "What testing event are you reporting, including when it occurred and what substance was involved?",
  ]),
  item("26", "Are you now or have you ever been enrolled in a drug or alcohol rehabilitation program?", [
    "What treatment program was involved, and what is its current status?",
  ]),
  text(
    "27",
    "27 — Per week, enter bottles/cans of beer, glasses of wine, and glasses of hard liquor",
    "Section 3 — Medical History",
    false,
    "Enter the weekly amounts requested by the source form. Enter 0 or None if you do not drink alcohol.",
  ),
  item("28", "Has anyone ever been concerned about your drinking or suggested that you cut down?", [
    "What occurred when the concern was raised, and what follow-up or change resulted?",
  ]),
  item("29", "Have you ever been convicted of driving under the influence (DUI)?", [
    "When did the DUI occur, and what requirements or follow-up resulted?",
  ]),
  item("30", "Have you ever felt bad about your drinking?"),
  item("31", "Have you ever had a drink first thing in the morning to steady your nerves or get rid of a hangover?", [
    "When did the morning drinking you reported occur, and what is its current status?",
  ]),
  item("32", "Have you been exposed to loud noise today?", [
    "What loud-noise exposure occurred today, and what hearing protection was used?",
  ]),
  item("33", "Are you now receiving or have you ever received Workers Compensation?", [
    "What medical condition or injury is associated with the Workers Compensation history you reported?",
    "What is the current medical status of that condition or injury?",
  ]),
  item("34", "If you served in the military and were discharged, did you ever apply to the Veteran's Administration (VA) for service-connected disability for medical injuries?", [
    "What medical condition or conditions are associated with the service-connected disability history you reported?",
    "What is the current medical status of those conditions?",
  ]),
  text(
    "35",
    "35 — Briefly explain any items marked Yes or Unsure and anything else important in evaluating medical suitability for the position",
    "Section 3 — Medical History",
    false,
    "Reference the corresponding item number when possible.",
  ),
];

const eyeEnt = [
  ph("36A", "Eye surgery", "36. Eye / Ear / Nose / Throat", [
    "What eye surgery did you have, and what is the current status of the condition it addressed?",
  ]),
  ph("36B", "Need to wear corrective lenses", "36. Eye / Ear / Nose / Throat", []),
  ph("36C", "Blurred or double vision", "36. Eye / Ear / Nose / Throat", [
    "What is the current pattern of the blurred or double vision you reported?",
    "What evaluation or treatment have you had for it?",
  ]),
  ph("36D", "Glaucoma", "36. Eye / Ear / Nose / Throat", [
    "What is the current status of your glaucoma?",
    "How is the glaucoma currently being treated or monitored?",
  ]),
  ph("36E", "Abnormal color vision test", "36. Eye / Ear / Nose / Throat", [
    "What finding was identified on the color vision test?",
  ]),
  ph("36F", "Refractive surgery (e.g., Lasik, PRK)", "36. Eye / Ear / Nose / Throat", [
    "What refractive surgery did you have, and what is the current status of your vision following the procedure?",
  ]),
  ph("36G", "Ringing or buzzing in ears", "36. Eye / Ear / Nose / Throat", [
    "What is the current pattern of the ringing or buzzing in your ears?",
    "What evaluation or treatment have you had for it?",
  ]),
  ph("36H", "Hearing trouble", "36. Eye / Ear / Nose / Throat", [
    "What hearing problem was identified, and what is its current status?",
    "How is the hearing problem currently corrected, treated, or monitored?",
  ]),
  ph("36I", "Ear surgery", "36. Eye / Ear / Nose / Throat", [
    "What ear surgery did you have, and what is the current status of the condition it addressed?",
  ]),
  ph("36J", "Earache", "36. Eye / Ear / Nose / Throat", [
    "What is the current pattern of the ear pain or earaches you reported?",
    "What evaluation or treatment have you had for it?",
  ]),
  ph("36K", "Abnormal hearing test", "36. Eye / Ear / Nose / Throat", [
    "What finding was identified on the hearing test?",
    "What medical or hearing follow-up occurred afterward?",
  ]),
];

const gastrointestinal = [
  ph("37A", "Ulcer / stomach trouble", "37. Gastrointestinal", [
    "What stomach condition or ulcer was identified, and what is its current status?",
    "How has it been treated or managed?",
  ]),
  ph("37B", "Persistent diarrhea", "37. Gastrointestinal", [
    "What is the current pattern of the persistent diarrhea you reported?",
    "What medical evaluation or treatment have you had for it?",
  ]),
  ph("37C", "Colitis", "37. Gastrointestinal", [
    "What is the current status of your colitis?",
    "How is the condition currently being treated or monitored?",
  ]),
  ph("37D", "Recurrent hemorrhoids", "37. Gastrointestinal", [
    "What is the current pattern of the recurrent hemorrhoids you reported?",
    "How have they been treated or managed?",
  ]),
  ph("37E", "Mucous in stool", "37. Gastrointestinal", [
    "What is the current pattern of the mucous in stool you reported?",
    "What medical evaluation has occurred for it?",
  ]),
  ph("37F", "Black / bloody bowel movement", "37. Gastrointestinal", [
    "What is the history and current status of the black or bloody bowel movements you reported?",
    "What medical evaluation or treatment occurred?",
  ]),
  ph("37G", "Pancreatitis", "37. Gastrointestinal", [
    "What is the history and current status of the pancreatitis you reported?",
    "What treatment or medical follow-up occurred?",
  ]),
  ph("37H", "Abnormal liver test / liver disease", "37. Gastrointestinal", [
    "What liver condition or abnormal test finding was identified, and what is its current status?",
    "What medical monitoring or treatment is in place?",
  ]),
  ph("37I", "Irritable bowel syndrome", "37. Gastrointestinal", [
    "What is the current pattern of your irritable bowel syndrome?",
    "How is the condition currently being managed?",
  ]),
  ph("37J", "Crohn's disease", "37. Gastrointestinal", [
    "What is the current status of your Crohn's disease?",
    "How is the condition currently being treated or monitored?",
  ]),
];

const genitourinary = [
  ph("38A", "Kidney disease or stone", "38. Genitourinary", [
    "What kidney condition or stone history are you reporting, and what is its current status?",
    "What treatment or medical follow-up has occurred?",
  ]),
  ph("38B", "Bladder trouble", "38. Genitourinary", [
    "What bladder condition or symptoms are you reporting, and what is their current status?",
    "How have they been evaluated or treated?",
  ]),
  ph("38C", "Blood in urine", "38. Genitourinary", [
    "What is the history and current status of the blood in urine you reported?",
    "What medical evaluation occurred for it?",
  ]),
  ph("38D", "Prostatitis", "38. Genitourinary", [
    "What is the current status of the prostatitis you reported?",
    "How has it been evaluated or treated?",
  ]),
  ph("38E", "Menstrual discomfort that kept you from work", "38. Genitourinary", [
    "What is the current pattern of the menstrual discomfort you reported?",
    "What medical evaluation or treatment have you had for it?",
  ]),
  ph("38F", "Currently pregnant", "38. Genitourinary", []),
];

const cardiovascular = [
  ph("39A", "Heart attack", "39. Cardiovascular", [
    "What is the history and current status of the heart attack you reported?",
    "What treatment or medical follow-up occurred afterward?",
  ]),
  ph("39B", "Heart failure", "39. Cardiovascular", [
    "What is the current status of your heart failure?",
    "How is the condition currently being treated or monitored?",
  ]),
  ph("39C", "Palpitation (irregular heartbeat)", "39. Cardiovascular", [
    "What is the current pattern of the palpitations or irregular heartbeat you reported?",
    "What evaluation or treatment have you had for it?",
  ]),
  ph("39D", "High blood pressure", "39. Cardiovascular", [
    "What is the history and current status of your high blood pressure?",
    "How is your blood pressure currently being managed or monitored?",
  ]),
  ph("39E", "Pain or discomfort in chest", "39. Cardiovascular", [
    "What is the current pattern of the chest pain or discomfort you reported?",
    "What medical evaluation or treatment have you had for it?",
  ]),
  ph("39F", "Swelling of foot or leg", "39. Cardiovascular", [
    "What is the current pattern of the foot or leg swelling you reported?",
    "What medical evaluation or treatment have you had for it?",
  ]),
];

const musculoskeletal = [
  ph("40A", "Back trouble / pain", "40. Musculoskeletal", [
    "What back problem are you reporting, and what is its current pattern?",
    "How has the back problem been evaluated or managed?",
  ]),
  ph("40B", "Neck trouble / pain", "40. Musculoskeletal", [
    "What neck problem are you reporting, and what is its current pattern?",
    "How has the neck problem been evaluated or managed?",
  ]),
  ph("40C", "Arthritis / Rheumatism", "40. Musculoskeletal", [
    "What arthritis or rheumatic condition was identified, and which joints are affected?",
    "What is the current pattern and management of the condition?",
  ]),
];

const joints = [
  ph("41A", "Shoulder", "41. Joint Injury / Surgery / Dislocation / Pain / Swelling", [
    "What shoulder condition, injury, surgery, dislocation, pain, or swelling are you reporting, and what is its current status?",
    "How has the shoulder problem been treated or managed?",
  ]),
  ph("41B", "Elbow", "41. Joint Injury / Surgery / Dislocation / Pain / Swelling", [
    "What elbow condition, injury, surgery, dislocation, pain, or swelling are you reporting, and what is its current status?",
    "How has the elbow problem been treated or managed?",
  ]),
  ph("41C", "Wrist", "41. Joint Injury / Surgery / Dislocation / Pain / Swelling", [
    "What wrist condition, injury, surgery, dislocation, pain, or swelling are you reporting, and what is its current status?",
    "How has the wrist problem been treated or managed?",
  ]),
  ph("41D", "Fingers / Toes", "41. Joint Injury / Surgery / Dislocation / Pain / Swelling", [
    "What finger or toe condition, injury, surgery, dislocation, pain, or swelling are you reporting, and what is its current status?",
    "How has the problem been treated or managed?",
  ]),
  ph("41E", "Hip", "41. Joint Injury / Surgery / Dislocation / Pain / Swelling", [
    "What hip condition, injury, surgery, dislocation, pain, or swelling are you reporting, and what is its current status?",
    "How has the hip problem been treated or managed?",
  ]),
  ph("41F", "Knee", "41. Joint Injury / Surgery / Dislocation / Pain / Swelling", [
    "What knee condition, injury, surgery, dislocation, pain, or swelling are you reporting, and what is its current status?",
    "How has the knee problem been treated or managed?",
  ]),
  ph("41G", "Ankle / Foot", "41. Joint Injury / Surgery / Dislocation / Pain / Swelling", [
    "What ankle or foot condition, injury, surgery, dislocation, pain, or swelling are you reporting, and what is its current status?",
    "How has the problem been treated or managed?",
  ]),
];

const neurological = [
  ph("42A", "Epilepsy", "42. Neurological", [
    "What is the current status of your epilepsy?",
    "How is the condition currently being treated or monitored?",
  ]),
  ph("42B", "Convulsion / Seizure", "42. Neurological", [
    "What is the current pattern and status of the convulsions or seizures you reported?",
    "What evaluation or treatment have you had for them?",
  ]),
  ph("42C", "Fainting spells / Blackouts", "42. Neurological", [
    "What is the current pattern and status of the fainting spells or blackouts you reported?",
    "What medical evaluation occurred for them?",
  ]),
  ph("42D", "Multiple Sclerosis", "42. Neurological", [
    "What is the current status of your multiple sclerosis?",
    "How is the condition currently being treated or monitored?",
  ]),
  ph("42E", "Recurrent dizziness", "42. Neurological", [
    "What is the current pattern of the recurrent dizziness you reported?",
    "What evaluation or treatment have you had for it?",
  ]),
  ph("42F", "Head injury", "42. Neurological", [
    "What head injury occurred, and what is its current medical status?",
    "What treatment or medical follow-up occurred after the injury?",
  ]),
  ph("42G", "Loss of consciousness", "42. Neurological", [
    "What occurred when you lost consciousness, and what is the current status of that history?",
    "What medical evaluation or follow-up occurred afterward?",
  ]),
  ph("42H", "Frequent / recurrent headaches", "42. Neurological", [
    "What is the current pattern of the frequent or recurrent headaches you reported?",
    "How have the headaches been evaluated or treated?",
  ]),
  ph("42I", "Migraine / Sinus headaches", "42. Neurological", [
    "What is the current pattern of the migraine or sinus headaches you reported?",
    "How have the headaches been evaluated or treated?",
  ]),
  ph("42J", "Carpal Tunnel Syndrome", "42. Neurological", [
    "What is the current status of the carpal tunnel syndrome you reported?",
    "How has the condition been evaluated or treated?",
  ]),
  ph("42K", "Tremors", "42. Neurological", [
    "What is the current pattern of the tremors you reported?",
    "What evaluation or treatment have you had for them?",
  ]),
  ph("42L", "Meningitis / Encephalitis", "42. Neurological", [
    "What is the history and current status of the meningitis or encephalitis you reported?",
    "What treatment or medical follow-up occurred?",
  ]),
  ph("42M", "Numbness of extremities", "42. Neurological", [
    "Which areas are affected by the numbness, and what is its current pattern?",
    "What evaluation or treatment have you had for it?",
  ]),
  ph("42N", "Other neurological condition", "42. Neurological", [
    "What neurological condition are you reporting, and what is its current status?",
    "How has the condition been evaluated or treated?",
  ]),
];

const miscellaneous = [
  ph("43A", "Diabetes (glucose in urine)", "43. Miscellaneous", [
    "How is your diabetes currently being managed?",
    "What recent monitoring or medical follow-up have you had for it?",
  ]),
  ph("43B", "Low blood sugar", "43. Miscellaneous", [
    "What is the current pattern of the low blood sugar you reported?",
    "What evaluation or management is in place for it?",
  ]),
  ph("43C", "Thyroid trouble", "43. Miscellaneous", [
    "What thyroid condition was identified, and what is its current status?",
    "How is the condition currently being treated or monitored?",
  ]),
  ph("43D", "Enlarged glands", "43. Miscellaneous", [
    "What enlarged glands or related condition were identified, and what is the current status?",
    "What medical evaluation or follow-up occurred?",
  ]),
  ph("43E", "Cancer / Leukemia", "43. Miscellaneous", [
    "What type of cancer or leukemia was identified, and what is its current status?",
    "What treatment or medical follow-up has occurred?",
  ]),
  ph("43F", "Non-healing sores", "43. Miscellaneous", [
    "What non-healing sore are you reporting, and what is its current status?",
    "What medical evaluation or treatment has occurred?",
  ]),
  ph("43G", "Chronic fatigue", "43. Miscellaneous", [
    "What is the current pattern of the chronic fatigue you reported?",
    "What evaluation or treatment have you had for it?",
  ]),
  ph("43H", "Night sweats", "43. Miscellaneous", [
    "What is the current pattern of the night sweats you reported?",
    "What medical evaluation or treatment have you had for them?",
  ]),
  ph("43I", "Undesired weight loss or gain", "43. Miscellaneous", [
    "What weight change occurred, and over what period of time?",
    "What medical evaluation, if any, has occurred for the change?",
  ]),
  ph("43J", "Multiple chemical sensitivity", "43. Miscellaneous", [
    "What chemical sensitivity or reaction are you reporting, and what is its current pattern?",
    "What medical evaluation or treatment has occurred?",
  ]),
  ph("43K", "Recurrent fever in the last year", "43. Miscellaneous", [
    "What is the pattern of the recurrent fever you reported during the last year?",
    "What medical evaluation or treatment occurred?",
  ]),
  ph("43L", "Eczema", "43. Miscellaneous", [
    "What is the current pattern of your eczema?",
    "How is the condition currently being treated or managed?",
  ]),
  ph("43M", "Sleep apnea", "43. Miscellaneous", [
    "What is the current status of your sleep apnea?",
    "How has your sleep apnea been evaluated or treated?",
  ]),
  ph("43N", "Snoring", "43. Miscellaneous", [
    "What is the current pattern of the snoring you reported?",
    "What medical evaluation, if any, has occurred for it?",
  ]),
  ph("43O", "Sleep problems / disorders", "43. Miscellaneous", [
    "What sleep problem or disorder was identified, and what is its current status?",
    "How has the sleep problem or disorder been evaluated or treated?",
  ]),
  ph("43P", "Chronic or frequent cough", "43. Miscellaneous", [
    "What is the current pattern of the chronic or frequent cough you reported?",
    "What medical evaluation or treatment have you had for it?",
  ]),
  ph("43Q", "Any other problem or illness not listed that may affect job performance", "43. Miscellaneous", [
    "What other medical problem or illness are you reporting, and what is its current status?",
    "What treatment or medical follow-up has occurred for it?",
  ]),
];

export const postPublicSafetyDispatcherDefinition = form(
  "post-2-264-public-safety-dispatcher",
  "POST 2-264 — Medical History Statement — Public Safety Dispatcher",
  "Adaptive Public Safety Dispatcher medical-history questionnaire preserving POST 2-264 source numbering and Yes/No/Unsure behavior while using open, condition-specific applicant clarification.",
  "California POST 2-264 (Rev. 02/2013) — Medical History Statement — Public Safety Dispatcher",
  [
    text("1", "1 — Candidate's name (Last, First, Middle)", "Section 1 — Candidate Identification", false),
    text("2", "2 — Social Security Number — Last 4 digits", "Section 1 — Candidate Identification", false),
    text("3", "3 — Birthdate (MM/DD/YYYY)", "Section 1 — Candidate Identification", false),
    text("4", "4 — Address where you can be contacted", "Section 1 — Candidate Identification", false),
    text("5", "5 — City", "Section 1 — Candidate Identification", false),
    text("6", "6 — State / ZIP", "Section 1 — Candidate Identification", false),
    text("7", "7 — Phone numbers where you can be reached", "Section 1 — Candidate Identification", false),
    text("8", "8 — Email", "Section 1 — Candidate Identification", false),
    text("9", "9 — Current and previous jobs held in the last 5 years, including military service", "Section 2 — Job History", false, "Include job title, primary duties, employer, and approximate dates."),
    ...general,
    ...eyeEnt,
    ...gastrointestinal,
    ...genitourinary,
    ...cardiovascular,
    ...musculoskeletal,
    ...joints,
    ...neurological,
    ...miscellaneous,
    text(
      "44",
      "44 — Explain any medical conditions marked Yes or Unsure; reference the corresponding item number and letter",
      "Section 4 — Medical Conditions",
      false,
      "This preserves the source form's explanation field in addition to the adaptive follow-up details collected above.",
    ),
  ],
);
