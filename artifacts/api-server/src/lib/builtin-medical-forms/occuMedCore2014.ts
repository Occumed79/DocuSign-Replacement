import { branch, form, history, q, select, text } from "./definition-helpers";
import { occuMedPrompts } from "./occuMedPromptLibrary";

const hist = (key: string, label: string, section: string, required = true) =>
  history(key, `${key} — ${label}`, section, occuMedPrompts(label), { required });

const medicalLabels: Array<[string, string]> = [
  ["19", "Injury of any kind"],
  ["20", "Limiting injury of any kind"],
  ["21", "Any claims submitted, pending or awarded for the above"],
  ["22", "Are you now receiving, or have you applied for, any VA, Federal, State or Medical Disability payments?"],
  ["23", "Tuberculosis"], ["24", "Pneumonia"], ["25", "Bronchitis"], ["26", "Emphysema"], ["27", "Asthma"], ["28", "Pneumothorax"],
  ["29", "High Blood Pressure"], ["30", "Heart Murmur, Heart Disease"], ["31", "Stroke"], ["32", "Hiatal or Diaphragmatic Hernia"], ["33", "Esophageal Reflux"],
  ["34", "Rheumatic Fever"], ["35", "Encephalitis, Meningitis"], ["36", "Epilepsy, Convulsions"], ["37", "Glaucoma"], ["38", "Duodenal or Stomach Ulcer"],
  ["39", "Gall Bladder Trouble"], ["40", "Liver Trouble or Hepatitis"], ["41", "Sleep Apnea"], ["42", "Anemia"], ["43", "Diabetes"],
  ["44", "Kidney Disease"], ["45", "Kidney Stones"], ["46", "Rheumatism, Arthritis, Gout"], ["47", "Varicose Veins"], ["48", "Phlebitis"],
  ["49", "Hay Fever"], ["50", "Typhoid Fever"], ["51", "Sore Throats Chronically"], ["52", "Hernia"], ["53", "Valley Fever (Coccidioidomycosis)"],
  ["54", "Histoplasmosis"], ["55", "Cancer"], ["56", "Disease of the Immune System"], ["57", "Hyperthyroidism"], ["58", "Hypothyroidism"],
  ["59", "Allergic Rhinitis"], ["60", "Psychological Problems (e.g. PTSD, ADHD)"], ["61", "Scarlet Fever"], ["62", "Decompression Sickness or Air Embolism"],
  ["63", "Trouble with your Thyroid Gland"], ["64", "Skin Rash, Burning, Itching or Infection"], ["65", "Skin Cancer(s)"], ["66", "Bleeding Gums or Nose in the Past Year"],
  ["67", "Sinus Trouble"], ["68", "Perforated Ear Drum"], ["69", "Colds more than twice a year"], ["70", "Loss of Consciousness"], ["71", "Shortness of Breath"],
  ["72", "Chest Pains"], ["73", "Frequent Headaches"], ["74", "Dizziness, Vertigo or Motion Sickness"], ["75", "Problems with Eyes / Vision"],
  ["76", "Back or Joint Surgery"], ["77", "Back or Joint Pain (Frequent / Occasional)"], ["78", "Back Injury"], ["79", "Cervical Neck Injury or Problem"],
  ["80", "Knee Surgery"], ["81", "Upper Extremity Injury or Problem"], ["82", "Lower Extremity Injury or Problem"], ["83", "Other medical condition or issue"],
  ["84", "Have you gained or lost more than 10 pounds in the past 2 years without trying to do so?"], ["85", "Have you had any changes in your appetite in the past 6 months?"],
  ["86", "Have you noticed unusual fatigue or weakness recently?"], ["87", "Have you had a change in the size or color of a mole or wart in the past year?"],
  ["88", "Do you have a skin rash, burning, itching or other skin sensitivity?"], ["89", "Have you ever coughed up blood or have / had a chronic cough?"],
  ["90", "Do you smoke or use other forms of tobacco?"], ["91", "Do you drink alcohol?"], ["92", "Have you, or are you currently, being treated for alcoholism?"],
  ["93", "Do you engage in potentially hazardous recreational activities (e.g. weightlifting, sky diving, scuba diving)?"],
  ["94", "Have you had, or do you currently have, any FEMALE disorders?"], ["95", "Do you have any reason to believe you are pregnant?"], ["96", "Have you had, or do you currently have, any MALE disorders?"],
  ["97", "Repeated numbness, tingling, pins-and-needles sensations or loss of sensation in one or both hands"],
  ["98", "Repeated feelings of soreness or pain in either forearm or elbow"], ["99", "Repeated pain, discomfort, burning or tingling in your shoulders"],
  ["100", "Knee pain, popping or locking"], ["101", "Foot pain"], ["102", "Have any of the above symptoms caused you to be awakened while sleeping?"],
  ["103", "Does/did discomfort in your wrists, arm, or shoulder interfere with your daily activities?"], ["104", "Have you received, or do you currently receive, medical treatment for this pain and/or discomfort?"],
  ["105", "Medical help for Carpal Tunnel Syndrome, Ganglionic Cyst, Tendonitis, Bursitis, or Arthritis"],
  ["106", "Does your job require arm, hand or finger actions to be repeated many times each hour and work shift?"], ["107", "Have you ever had an auto accident?"],
  ["108", "Do you currently wear corrective lenses?"], ["109", "Are you presently experiencing any pain or discomfort?"],
];

const postItems = [
  hist("110", "Have you ever failed a pre-placement medical or psychological examination?", "Peace Officer / POST Items"),
  hist("111", "Have you ever been terminated or resigned from employment, or had to change positions, due to a physical, psychological or medically related reason?", "Peace Officer / POST Items"),
  hist("112", "Has your driver's license ever been suspended or revoked due to medical reasons?", "Peace Officer / POST Items"),
  hist("113", "Have you ever taken medication to prevent wheezing or shortness of breath during exercise?", "Peace Officer / POST Items"),
  hist("114", "Are you currently under a health care provider's care for any medical condition?", "Peace Officer / POST Items"),
];

export const occuMedCore2014Definition = form(
  "occu-med-medical-history-2014",
  "Occu-Med Medical History Questionnaire — 2014 Core",
  "Adaptive version of the 2014 Occu-Med core medical-history questionnaire using the recovered analyst follow-up bank and consistent cross-form clinical logic.",
  "Occu-Med Medical History Questionnaire, Copyright 2014",
  [
    text("applicant.name", "Applicant's name (Last, First, Middle)", "Applicant Information", false),
    text("applicant.ssn", "Social Security Number", "Applicant Information", false),
    text("applicant.dob", "Birthdate", "Applicant Information", false),
    text("applicant.address", "Mailing address / City / State / ZIP", "Applicant Information", false),
    text("applicant.phone", "Phone numbers where you can be reached", "Applicant Information", false),
    text("applicant.email", "Email", "Applicant Information", false),

    branch("1", "1 — Have you ever been medically examined for employment before?", "Medical History — Background", [
      "What employer was the examination for?",
      "What job class was involved?",
      "When was the examination?",
      "Was any medical follow-up, restriction, or limitation identified?",
    ]),
    branch("2", "2 — List all prescription and non-prescription medication you regularly use", "Medications / Allergies", [
      "For each medication, what medical condition is being treated?",
      "What dose and frequency do you take?",
      "When did you start taking it?",
      "Do you have any side effects?",
    ], { answerType: "text", triggerValue: "*" }),
    branch("3", "3 — List prescription or non-prescription medications, not taken regularly, used in the last 2 months", "Medications / Allergies", [
      "What condition or symptom was each medication used for?",
      "When did you take it and how often?",
      "Are you still taking it?",
      "Did you experience any side effects?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    branch("4", "4 — List any drugs or other substances, including food or insect stings, that you are allergic to", "Medications / Allergies", [
      "What type of reaction do you have to each allergen?",
      "When was your most recent reaction?",
      "Have you ever required emergency treatment?",
      "Do you carry or use medication for the allergy?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    select("5.hepatitisA", "5 — Hepatitis A immunization", "Immunizations", ["Yes", "No", "Unsure"], false),
    select("5.hepatitisB", "5 — Hepatitis B immunization", "Immunizations", ["Yes", "No", "Unsure"], false),
    select("5.varicella", "5 — Varicella (Chicken Pox) immunization", "Immunizations", ["Yes", "No", "Unsure"], false),
    select("5.tetanus", "5 — Tetanus immunization", "Immunizations", ["Yes", "No", "Unsure"], false),
    select("5.measles", "5 — Measles immunization", "Immunizations", ["Yes", "No", "Unsure"], false),
    select("5.mumps", "5 — Mumps immunization", "Immunizations", ["Yes", "No", "Unsure"], false),
    select("5.rubella", "5 — Rubella immunization", "Immunizations", ["Yes", "No", "Unsure"], false),
    select("5.bcg", "5 — Bacillus Calmette-Guérin immunization", "Immunizations", ["Yes", "No", "Unsure"], false),
    hist("6", "Have you ever had a positive reaction to a PPD (Tuberculosis) Skin Test?", "Medical History — Background"),
    branch("7", "7 — List your last three hospitalizations, beginning with the most recent (excluding routine childbirth)", "Hospitalizations / Operations", [
      "For each hospitalization, what was the reason?",
      "Where and when were you hospitalized?",
      "What treatment did you receive?",
      "What was the recovery or prognosis?",
      "Do you have any current symptoms, restrictions, or follow-up related to it?",
    ], { answerType: "text", triggerValue: "*", required: false }),

    hist("8", "Prolonged loud noises", "Exposure History"),
    hist("9", "Substances which irritated your skin or eyes", "Exposure History"),
    hist("10", "Substances which caused breathing difficulties", "Exposure History"),
    hist("11", "Sprays or powders for insects or plants", "Exposure History"),
    hist("12", "Prolonged X-Rays or other radiation", "Exposure History"),
    hist("13", "Dusty conditions (sandblasting, drilling, etc.)", "Exposure History"),
    hist("14", "Have you ever had a bad reaction to high environmental temperatures?", "Exposure History"),
    hist("15", "Have you ever had a bad reaction to low environmental temperatures?", "Exposure History"),
    history("16", "16 — Have you been rejected by the military for health reasons?", "Military History", [
      "When were you rejected?",
      "What medical or psychological issue was involved?",
      "Is that issue still current?",
      "Do you have any current restrictions, limitations, or treatment related to it?",
    ]),
    q("17", "17 — Were you ever in the Armed Services?", "Military History", { answerType: "yes_no", triggerValue: "yes" }, [
      history("18", "18 — Did you ever receive a Medical Discharge?", "Military History", [
        "When were you discharged?",
        "What medical or psychological issue was involved?",
        "Is that issue still current?",
        "Do you have any current restrictions, limitations, or treatment related to it?",
      ]),
    ]),

    ...medicalLabels.map(([key, label]) => hist(key, label, Number(key) <= 22 ? "Injury / Disability History" : Number(key) <= 83 ? "Medical Conditions" : "Additional Medical History", ["94", "95", "96"].includes(key) ? false : true)),

    q(
      "post.gate",
      "Is this a Peace Officer or P.O.S.T.-compliant job class?",
      "Peace Officer / POST Items",
      { answerType: "yes_no", triggerValue: "yes", required: false, helpText: "The source questionnaire limits Questions 110–114 to Peace Officer and P.O.S.T.-compliant job classes." },
      postItems,
    ),
  ],
);
