import { branch, civilianHistory, form, q, text } from "./definition-helpers";
import { civilianOccuMedPrompts } from "./civilianOccuMedPromptLibrary";

const hist = (key: string, label: string, section: string, required = true) =>
  civilianHistory(key, `${key} — ${label}`, section, civilianOccuMedPrompts(label), { required });

const conditions: Array<[string, string]> = [
  ["14", "Tuberculosis"], ["15", "Emphysema"], ["16", "Asthma"], ["17", "Shortness of Breath"], ["18", "High Blood Pressure"],
  ["19", "Heart Murmur, Heart Disease"], ["20", "Stroke"], ["21", "Blood Disorders (e.g., Anemia)"], ["22", "Psychological Conditions (PTSD, ADHD, Bipolar Disorder, depression)"],
  ["23", "Pulmonary or Other Embolism"], ["24", "Pneumothorax"], ["25", "Infection"], ["26", "Hernia"], ["27", "Loss of Consciousness"],
  ["28", "Chest Pains"], ["29", "Dizziness, Vertigo or Motion Sickness"], ["30", "Problems with Eyes/Vision"], ["31", "Back or Joint Surgery"],
  ["32", "Epilepsy, Seizures"], ["33", "Encephalitis, Meningitis"], ["34", "Glaucoma"], ["35", "Vascular Problems (e.g., PVD, phlebitis)"],
  ["36", "Gall Bladder Trouble"], ["37", "Liver Trouble or Hepatitis"], ["38", "Sleep Apnea"], ["39", "Diabetes"], ["40", "Kidney Disease or Stones"],
  ["41", "Rheumatism, Arthritis/Gout"], ["42", "Ear or Ear Drum Issues"], ["43", "Migraines"], ["44", "Frequent Headaches"], ["45", "Cancer"],
  ["46", "Skin Cancer(s)"], ["47", "Hyperthyroidism"], ["48", "Hypothyroidism"], ["49", "Thyroid Trouble"], ["50", "Immune Disorders"],
  ["51", "Back or Joint Pain"], ["52", "Back Injury"], ["53", "Cervical Neck Injury or Problem"], ["54", "Knee Surgery"], ["55", "Upper extremity injury or problem"],
  ["56", "Lower extremity injury or problem"],
  ["59", "Have you gained or lost more than 10 lbs. in the past 2 years without trying to do so?"], ["60", "Have you had any changes in your appetite in the past 6 months?"],
  ["61", "Have you noticed an unusual fatigue or weakness recently?"], ["62", "Have you noticed a change in the size or color of a mole or wart in the last year?"],
  ["63", "Do you have a skin rash, burning, itching, or other skin sensitivity?"], ["64", "Have you coughed up blood or have/had a chronic cough?"],
  ["65", "Have you or are you currently being treated for alcoholism?"],
  ["66", "Repeated feelings of numbness, tingling, pins and needles sensations or loss of sensation in one or both hands"],
  ["67", "Repeated feelings of soreness or pain in either forearm or elbow"], ["68", "Repeated feelings of pain, discomfort, burning or tingling in your shoulder"],
  ["69", "Knee pain, popping, locking"], ["70", "Foot pain"], ["71", "Have any of the above symptoms caused you to be awakened while sleeping?"],
  ["72", "Does/did discomfort in your wrists, arm, or shoulder interfere with your daily activities?"], ["73", "Have you received, or do you currently receive, medical treatment for this pain or discomfort?"],
  ["74", "Medical help for Carpal Tunnel Syndrome, Ganglionic Cyst, Tendonitis, Bursitis, or Arthritis"],
  ["75", "Have you ever had surgery because of, or experienced lasting pain from, an auto accident?"], ["76", "Do you currently wear corrective lenses?"],
];

export const absNorthAmericaDefinition = form(
  "abs-north-america-medical-history",
  "ABS North America Medical History Questionnaire",
  "Adaptive version of the American Bureau of Shipping North America questionnaire. Source wording/numbering is preserved while positive responses use condition-specific, applicant-facing clarification.",
  "American Bureau of Shipping — North America Medical History Questionnaire (uploaded source)",
  [
    text("employee.name", "Employee's name (Last, First, Middle)", "Employee Information", false),
    text("employee.ssn", "Social Security Number", "Employee Information", false),
    text("employee.dob", "Birthdate", "Employee Information", false),
    text("employee.address", "Mailing address / City / State / ZIP", "Employee Information", false),
    text("employee.phone", "Home / Cell phone", "Employee Information", false),
    text("employee.email", "Email address", "Employee Information", false),
    text("employee.passport", "Passport number", "Employee Information", false),
    text("employee.employer", "Employer", "Employee Information", false),
    text("employee.job", "Job class or job title", "Employee Information", false),
    text("employee.assignment", "Assignment location / city and state", "Employee Information", false),
    text("employee.region", "Region / Department", "Employee Information", false),
    text("employee.supervisor", "Supervisor's name and work phone", "Employee Information", false),

    branch("1", "1 — Please list all prescription medications you regularly use", "Medications / Allergies", [
      "What is each medication being used for, and how is it currently taken?",
      "What effects or changes, if any, have you noticed while taking it?",
    ], { answerType: "text", triggerValue: "*" }),
    branch("2", "2 — Please list any other prescription medications, not taken regularly, which you have taken in the last 2 months", "Medications / Allergies", [
      "What was each medication used for, and how was it taken?",
      "What is the current status of the reason it was used?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    branch("3", "3 — Please list any known allergies (e.g., Latex, Bee or Wasp Stings)", "Medications / Allergies", [
      "What reaction have you had to each allergy?",
      "How was the most recent reaction managed?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    branch("4", "4 — Please list your last three hospitalizations, beginning with the most recent (excluding routine childbirth)", "Hospitalizations / Operations", [
      "What was the reason for each hospitalization, and when did it occur?",
      "What is the current status of the condition that led to the hospitalization?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    branch("5", "5 — Please list any operations you may have had or were advised to have which were not listed above", "Hospitalizations / Operations", [
      "What operation was performed or advised, and what medical condition was it related to?",
      "What is the current status of the condition or recommendation?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    q("6.days", "6 — How many days on average do you engage in moderate to strenuous exercise?", "Exercise", { answerType: "number", required: false }),
    q("6.minutes", "6 — On average, how many minutes do you engage in exercise at this level?", "Exercise", { answerType: "number", required: false }),

    hist("7", "Substances that irritated your skin or eyes?", "Exposure History"),
    hist("8", "Substances that caused you breathing difficulties?", "Exposure History"),
    hist("9", "Have you ever had a bad reaction to high environmental temperatures?", "Exposure History"),
    hist("10", "Have you ever had a bad reaction to low environmental temperatures?", "Exposure History"),
    hist("11", "Have you ever been injured?", "Injury / Disability History"),
    hist("12", "Have you ever had a limiting injury?", "Injury / Disability History"),
    hist("13", "Have you been determined to be disabled through VA, Federal, State or Medical Disability assessments?", "Injury / Disability History"),

    ...conditions.filter(([key]) => Number(key) <= 56).map(([key, label]) => hist(key, label, "Medical Conditions")),
    text("57", "57 — Medical conditions or concerns you have which are not listed above", "Medical Conditions", false),
    hist("58", "Are you presently experiencing any pain or discomfort?", "Medical Conditions"),
    ...conditions.filter(([key]) => Number(key) >= 59).map(([key, label]) => hist(key, label, "Additional Medical History")),
  ],
);
