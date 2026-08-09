import { branch, civilianHistory, form, q, text } from "./definition-helpers";

const S = "Medical History";
const h = (key: string, label: string, prompts: string[]) =>
  civilianHistory(key, `${key} — ${label}`, S, prompts);

const drivingQuestions = [
  h("16", "High Blood Pressure", [
    "What is the history and current status of your high blood pressure?",
    "How is your blood pressure currently being managed or monitored?",
  ]),
  h("17", "Heart Murmur or Heart Trouble", [
    "What heart condition or finding was identified?",
    "What evaluation, follow-up, or treatment has occurred for it?",
  ]),
  h("18", "Sleep Disorders (Sleep Apnea, Narcolepsy)", [
    "What sleep disorder was identified, and what is its current status?",
    "How has the sleep disorder been evaluated or treated?",
  ]),
  h("19", "Diabetes", [
    "How is your diabetes currently being managed?",
    "What recent monitoring or follow-up have you had for it?",
  ]),
  h("20", "Chest Pains", [
    "How would you describe the chest pain you reported and its current pattern?",
    "What medical evaluation or treatment have you had for the chest pain?",
  ]),
  h("21", "Unexplained Shortness of Breath", [
    "How would you describe the shortness of breath you reported and its current pattern?",
    "What evaluation or treatment have you had for it?",
  ]),
  h("22", "Dizziness, Vertigo or Motion Sickness", [
    "What is the current pattern of the dizziness, vertigo, or motion sickness you reported?",
    "What evaluation or treatment have you had for these symptoms?",
  ]),
  h("23", "Lower Extremity Injury or Problem", [
    "What lower-extremity injury or problem did you have, and what is its current status?",
    "What treatment or follow-up has occurred for it?",
  ]),
  h("24", "Current Joint Trouble", [
    "Which joint or joints are affected, and what is the current nature of the problem?",
    "How has the joint problem been evaluated or treated?",
  ]),
  h("25", "Back or Joint Pain (Frequent / Occasional)", [
    "Where is the back or joint pain located, and what is its current pattern?",
    "How has the pain been evaluated or managed?",
  ]),
  h("26", "Current substance abuse problems (e.g. alcoholism)", [
    "What is the current status of the substance-use problem you reported?",
    "What treatment or follow-up, if any, has occurred?",
  ]),
  h("27", "Repeated numbness, tingling, pins-and-needles sensations, or loss of sensation in one or both hands", [
    "What is the pattern of the numbness, tingling, or loss of sensation in your hands?",
    "What evaluation or treatment have you had for these symptoms?",
  ]),
  h("28", "Repeated pain, discomfort, burning, or tingling in your shoulders", [
    "Which shoulder is affected, and what is the current pattern of the symptoms?",
    "How has the shoulder problem been evaluated or treated?",
  ]),
  h("29", "Knee pain, popping, or locking", [
    "Which knee is affected, and what is the current pattern of the pain, popping, or locking?",
    "What evaluation or treatment have you had for the knee problem?",
  ]),
  h("30", "Foot pain", [
    "Which foot is affected, and what is the current pattern of the pain?",
    "How has the foot pain been evaluated or treated?",
  ]),
  h("31", "Discomfort in wrists, arm, or shoulder interfering with daily activities", [
    "What wrist, arm, or shoulder problem is causing the interference you reported?",
    "What is the current status of that problem?",
  ]),
  h("32", "Medical treatment for this pain and/or discomfort", [
    "What pain or discomfort is being treated, and what treatment are you receiving?",
    "What is the current status of the problem being treated?",
  ]),
  q("33", "33 — Currently wear corrective lenses", S, { answerType: "yes_no" }),
];

export const occuMedSedentaryDefinition = form(
  "occu-med-sedentary-medical-history",
  "Occu-Med Sedentary Medical History Questionnaire",
  "Adaptive lower-burden Occu-Med medical history questionnaire with the source-form on-duty-driving gate and condition-specific applicant clarification.",
  "Occu-Med Sedentary Medical History Questionnaire, Copyright 2020",
  [
    text("demo.name", "Name (Last, First, Middle)", "Applicant / Employee Information", false),
    text("demo.ssn", "Social Security Number", "Applicant / Employee Information", false),
    text("demo.dob", "Birthdate", "Applicant / Employee Information", false),
    text("demo.address", "Mailing address / City / State / ZIP", "Applicant / Employee Information", false),
    text("demo.phone", "Phone numbers", "Applicant / Employee Information", false),
    text("demo.email", "Email", "Applicant / Employee Information", false),

    branch("1", "1 — Please list all prescription and non-prescription medication you regularly use", "Medications / Allergies", [
      "What is each medication being used for, and how is it currently taken?",
      "What effects or changes, if any, have you noticed while taking it?",
    ], { answerType: "text", triggerValue: "*" }),
    branch("2", "2 — Please list prescription or non-prescription medications, not taken regularly, used in the last two months", "Medications / Allergies", [
      "What was each medication used for, and how was it taken?",
      "What is the current status of the reason it was used?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    branch("3", "3 — Please list substances, including food or insect stings, that you are allergic to", "Medications / Allergies", [
      "What reaction have you had to each substance?",
      "How was the most recent reaction managed?",
    ], { answerType: "text", triggerValue: "*", required: false }),

    h("4", "Positive PPD (Tuberculosis) skin test or diagnosed with Tuberculosis", [
      "What is the history of the positive TB test or tuberculosis diagnosis you reported?",
      "What treatment or medical follow-up occurred afterward?",
    ]),
    h("5", "Vision or Eye Problems", [
      "What eye or vision problem was identified?",
      "How is the vision problem currently corrected, treated, or monitored?",
    ]),
    h("6", "Frequent Headaches or Migraines", [
      "What is the current pattern of the headaches or migraines you reported?",
      "How have the headaches or migraines been evaluated or treated?",
    ]),
    h("7", "Loss of Consciousness", [
      "What occurred when you lost consciousness, and when did it happen?",
      "What medical evaluation or follow-up occurred afterward?",
    ]),
    h("8", "Neurological Conditions (Epilepsy, Stroke, Dementia)", [
      "What neurological condition or event was identified, and what is its current status?",
      "What treatment or medical follow-up have you had for it?",
    ]),
    h("9", "Limiting injury of any kind", [
      "What injury caused the limitation you reported, and what is its current status?",
      "What treatment or follow-up has occurred for the injury?",
    ]),
    h("10", "Current Pain or Discomfort", [
      "Where is the pain or discomfort, and what is its current pattern?",
      "How is the pain or discomfort currently being evaluated or managed?",
    ]),
    h("11", "Current Neck or Back Trouble", [
      "What neck or back problem are you currently having?",
      "How is the neck or back problem currently being evaluated or managed?",
    ]),
    h("12", "Upper Extremity Problem (Carpal Tunnel Syndrome, Tendonitis, Arthritis)", [
      "What upper-extremity problem was identified, and which area is affected?",
      "What treatment or follow-up have you had for it?",
    ]),
    h("13", "Repeated soreness or pain in either forearm or elbow", [
      "Which arm is affected, and what is the current pattern of the soreness or pain?",
      "How has the forearm or elbow problem been evaluated or treated?",
    ]),
    h("14", "Anticipate requiring any work accommodations", [
      "What accommodation is anticipated, and what medical issue is it related to?",
      "What medical guidance, if any, has been provided regarding the accommodation?",
    ]),
    h("15", "Any condition which may impact work attendance", [
      "What condition may affect attendance, and what is its current status?",
      "What medical care or management is currently in place for the condition?",
    ]),

    q(
      "driving.gate",
      "Does your job require on-duty driving?",
      "On-Duty Driving",
      { answerType: "yes_no", triggerValue: "yes", helpText: "The source form instructs applicants to answer Questions 16–33 only when the job requires on-duty driving." },
      drivingQuestions,
    ),
  ],
);
