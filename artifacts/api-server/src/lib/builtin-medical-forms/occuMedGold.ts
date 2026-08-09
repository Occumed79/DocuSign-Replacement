import { branch, civilianHistory, form, history, select, text } from "./definition-helpers";
import { civilianOccuMedPrompts } from "./civilianOccuMedPromptLibrary";

const hist = (key: string, label: string, section: string, required = true) =>
  civilianHistory(key, `${key} — ${label}`, section, civilianOccuMedPrompts(label), { required });

const medical: Array<[string, string]> = [
  ["18", "Have you ever been injured?"], ["19", "Have you ever had a limiting injury?"], ["20", "Have you any claim pending for the above?"], ["21", "Are you now receiving any VA, Federal, State or Medical Disability payments?"],
  ["22", "Tuberculosis"], ["23", "Pneumonia"], ["24", "Bronchitis"], ["25", "Emphysema"], ["26", "Asthma"], ["27", "Pneumothorax"],
  ["28", "High Blood Pressure"], ["29", "Heart Murmur, Heart Disease"], ["30", "Stroke"], ["31", "Hiatal or Diaphragmatic Hernia"], ["32", "Esophageal Reflux"],
  ["33", "Epilepsy, Convulsions"], ["34", "Rheumatic Fever"], ["35", "Encephalitis, Meningitis"], ["36", "Glaucoma"], ["37", "Duodenal or Stomach Ulcer"],
  ["38", "Gall Bladder Trouble"], ["39", "Liver Trouble or Hepatitis"], ["40", "Sleep Apnea"], ["41", "Anemia"], ["42", "Diabetes"],
  ["43", "Kidney Disease"], ["44", "Kidney Stones"], ["45", "Rheumatism, Arthritis/Gout"], ["46", "Varicose Veins"], ["47", "Phlebitis"], ["48", "Hay Fever"],
  ["49", "Typhoid Fever"], ["50", "Sore Throats (Chronically)"], ["51", "Hernia"], ["52", "Valley Fever (Coccidioidomycosis)"], ["53", "Histoplasmosis"],
  ["54", "Cancer"], ["55", "Disease of the Immune System"], ["56", "Hyperthyroidism"], ["57", "Hypothyroidism"], ["58", "Allergic Rhinitis"],
  ["59", "Psychological Problems (PTSD, ADHD, Bipolar Disorder, depression)"], ["60", "Scarlet Fever"], ["61", "Decompression Sickness or Air Embolism"],
  ["62", "Trouble with your Thyroid Gland"], ["63", "Skin Rash, Burning, Itching or Infection"], ["64", "Skin Cancer(s)"], ["65", "Bleeding Gums or Nose in the Past Year"],
  ["66", "Sinus Trouble"], ["67", "Perforated Ear Drums"], ["68", "Colds more than twice a year"], ["69", "Loss of Consciousness"], ["70", "Shortness of Breath"],
  ["71", "Chest Pains"], ["72", "Frequent Headaches"], ["73", "Dizziness, Vertigo or Motion Sickness"], ["74", "Problems with Eyes/Vision"], ["75", "Back or Joint Surgery"],
  ["76", "Back or Joint Pain"], ["77", "Back Injury"], ["78", "Cervical Neck Injury or Problem"], ["79", "Knee Surgery"], ["80", "Upper extremity injury or problem"],
  ["81", "Lower Extremity injury or problem"], ["82", "Medical Conditions you have which are not listed above"],
  ["83", "Have you gained or lost more than 10 lbs. in the past 2 years without trying to do so?"], ["84", "Have you had any changes in your appetite in the past 6 months?"],
  ["85", "Have you noticed an unusual fatigue or weakness recently?"], ["86", "Have you noticed a change in size or color of a mole or wart in the last year?"],
  ["87", "Do you have a skin rash, burning, itching or other skin sensitivity?"], ["88", "Have you coughed up blood or have/had chronic cough?"],
  ["89", "Do you smoke?"], ["90", "Do you drink alcohol?"], ["91", "Have you or are you currently being treated for alcoholism?"],
  ["92", "Do you engage in any potentially hazardous recreation activities (weight lifting, sky diving, SCUBA diving, hang gliders, etc.)?"],
  ["93", "Have you had or do you currently have any FEMALE disorders? (Females only)"], ["94", "Do you have any reason to believe you are pregnant? (Females only)"],
  ["95", "Have you had or do you currently have any MALE disorders? (Males only)"],
  ["96", "Repeated feelings of numbness, tingling, pins and needles sensations or loss of sensation in one or both hands"],
  ["97", "Repeated feelings of soreness or pain in either forearm or elbow"], ["98", "Repeated pain, discomfort, burning or tingling in your shoulder"],
  ["99", "Knee pain, popping, locking"], ["100", "Foot pain"], ["101", "Have any of the above symptoms caused you to be awakened while sleeping?"],
  ["102", "Does/did discomfort in your wrists, arm, or shoulder interfere with your daily activities?"], ["103", "Have you received, or do you currently receive, medical treatment for this pain or discomfort?"],
  ["104", "Medical help for Carpal Tunnel Syndrome, Ganglionic Cyst, Tendonitis, Bursitis, or Arthritis"],
  ["105", "Does your job require arm, hand or finger actions to be repeated many times each hour and work shift?"], ["106", "Have you ever been in an auto accident?"],
  ["107", "Do you currently wear corrective lenses?"], ["108", "Are you presently experiencing any pain or discomfort?"],
];

export const occuMedGoldDefinition = form(
  "occu-med-medical-history-gold",
  "Occu-Med Medical History Questionnaire — Gold",
  "Adaptive version of the current Gold Occu-Med medical history questionnaire, preserving source numbering while using condition-specific, applicant-facing clarification.",
  "Occu-Med Medical History Gold questionnaire (uploaded source)",
  [
    text("applicant.name", "Applicant's name (Last, First, Middle)", "Applicant Information", false),
    text("applicant.ssn", "Social Security Number", "Applicant Information", false),
    text("applicant.dob", "Birthdate", "Applicant Information", false),
    text("applicant.address", "Mailing address / City / State / ZIP", "Applicant Information", false),
    text("applicant.phone", "Home / Cell phone", "Applicant Information", false),
    text("applicant.email", "Email address", "Applicant Information", false),
    text("applicant.passport", "Passport number", "Applicant Information", false),
    text("applicant.employer", "Employer", "Applicant Information", false),
    text("applicant.job", "Job class or job title", "Applicant Information", false),

    branch("1", "1 — Please list all medications you regularly use, including vitamins, birth control pills, laxatives, aspirins, antihistamines, tranquilizers, and weight reducing aids (Prescription and Non-Prescription)", "Medications / Allergies", [
      "What is each medication being used for, and how is it currently taken?",
      "What effects or changes, if any, have you noticed while taking it?",
    ], { answerType: "text", triggerValue: "*" }),
    branch("2", "2 — Please list any medications, not taken regularly, which you have taken in the last 2 months (Prescription and Non-Prescription)", "Medications / Allergies", [
      "What was each medication used for, and how was it taken?",
      "What is the current status of the reason it was used?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    branch("3", "3 — Allergies: list any drugs or other substances, including food or insect stings, to which you have had an allergic reaction", "Medications / Allergies", [
      "What reaction have you had to each substance?",
      "How was the most recent reaction managed?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    select("4a.hepatitisA", "4a — Hepatitis A immunization", "Immunizations", ["Yes", "No", "Unsure"], false),
    select("4a.hepatitisB", "4a — Hepatitis B immunization", "Immunizations", ["Yes", "No", "Unsure"], false),
    select("4a.varicella", "4a — Varicella (Chicken Pox) immunization", "Immunizations", ["Yes", "No", "Unsure"], false),
    select("4a.tetanus", "4a — Tetanus immunization", "Immunizations", ["Yes", "No", "Unsure"], false),
    select("4a.typhoid", "4a — Typhoid immunization", "Immunizations", ["Yes", "No", "Unsure"], false),
    select("4a.measles", "4a — Measles immunization", "Immunizations", ["Yes", "No", "Unsure"], false),
    select("4a.mumps", "4a — Mumps immunization", "Immunizations", ["Yes", "No", "Unsure"], false),
    select("4a.rubella", "4a — Rubella immunization", "Immunizations", ["Yes", "No", "Unsure"], false),
    select("4a.bcg", "4a — Bacillus Calmette-Guérin immunization", "Immunizations", ["Yes", "No", "Unsure"], false),
    hist("4b", "Have you ever had a positive reaction to a PPD (Tuberculosis) Skin Test?", "Medical History — Background"),
    branch("5", "5 — List your last three hospitalizations, beginning with the most recent (excluding routine childbirth)", "Hospitalizations / Operations", [
      "What was the reason for each hospitalization, and when did it occur?",
      "What is the current status of the condition that led to the hospitalization?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    branch("6", "6 — List any operations you may have had or were advised to have which are not listed above", "Hospitalizations / Operations", [
      "What operation was performed or advised, and what medical condition was it related to?",
      "What is the current status of the condition or recommendation?",
    ], { answerType: "text", triggerValue: "*", required: false }),

    hist("7", "Prolonged loud noises?", "Exposure History"),
    hist("8", "Substances that irritated your skin or eyes?", "Exposure History"),
    hist("9", "Substances that caused you breathing difficulties?", "Exposure History"),
    hist("10", "Sprays or powders for insects or plants?", "Exposure History"),
    hist("11", "Prolonged X-Rays or other radiation", "Exposure History"),
    hist("12", "Dusty conditions such as sandblasting, grinding, or drilling of rock, coal, silica, asbestos, or asbestos products?", "Exposure History"),
    hist("13", "Have you ever had a bad reaction to high environmental temperatures?", "Exposure History"),
    hist("14", "Have you ever had a bad reaction to low environmental temperatures?", "Exposure History"),
    history("15", "15 — Have you been rejected by the military for health reasons?", "Military History", [
      "When were you rejected?",
      "What medical or psychological issue was involved?",
      "Is that issue still current?",
      "Do you have current restrictions, limitations, or treatment related to it?",
    ]),
    branch("16", "16 — Were you ever in the Armed Services?", "Military History", [
      "What branch and when did you serve?",
      "Did you have any medical restrictions or limitations during service?",
    ]),
    history("17", "17 — Did you receive a Medical Discharge?", "Military History", [
      "When were you discharged?",
      "What medical or psychological issue was involved?",
      "Is that issue still current?",
      "Do you have any current restrictions, limitations, or treatment related to it?",
    ], { required: false }),

    ...medical.map(([key, label]) => hist(key, label, Number(key) <= 21 ? "Injury / Disability History" : Number(key) <= 82 ? "Medical Conditions" : "Additional Medical History", ["93", "94", "95"].includes(key) ? false : true)),
    text("109", "109 — Height and Weight (include units: feet/meters/inches/centimeters and lbs/kgs)", "Measurements", false),
  ],
);
