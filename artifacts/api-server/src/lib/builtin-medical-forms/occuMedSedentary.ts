import { branch, form, history, q, text } from "./definition-helpers";

const S = "Medical History";
const h = (key: string, label: string, prompts: string[], statusGate = true) => history(key, `${key} — ${label}`, S, prompts, { statusGate });

const drivingQuestions = [
  h("16", "High Blood Pressure", [
    "When were you told you had high blood pressure?",
    "Are you taking medication or receiving treatment for it?",
    "Do you know your most recent blood pressure reading?",
    "Does it cause any current symptoms or limitations?",
  ]),
  h("17", "Heart Murmur or Heart Trouble", [
    "What heart condition are you referring to?",
    "When was it diagnosed?",
    "Are you receiving treatment or taking medication for it?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),
  h("18", "Sleep Disorders (Sleep Apnea, Narcolepsy)", [
    "What sleep disorder are you referring to?",
    "Were you formally diagnosed?",
    "Do you use CPAP or any other treatment?",
    "Do you currently have symptoms such as fatigue, daytime sleepiness, or trouble concentrating?",
    "Does it affect your driving, work, or daily activities?",
  ]),
  h("19", "Diabetes", [
    "When were you diagnosed with diabetes?",
    "What medication or treatment are you using?",
    "Do you have any current symptoms, restrictions, or limitations related to diabetes?",
    "Do you know your most recent A1C result and date, if available?",
  ]),
  h("20", "Chest Pains", [
    "How often does the chest pain happen?",
    "What tends to bring it on?",
    "Have you been evaluated or treated by a provider for it?",
    "Does it affect your daily activities, driving, or work?",
  ]),
  h("21", "Unexplained Shortness of Breath", [
    "How often does it happen?",
    "What tends to trigger it?",
    "Have you been evaluated or treated for it?",
    "Does it affect your daily activities, driving, or work?",
  ]),
  h("22", "Dizziness, Vertigo or Motion Sickness", [
    "Are you referring to dizziness, vertigo, motion sickness, or more than one?",
    "How often does it occur and when was your last episode?",
    "How severe is it?",
    "Does it affect your balance, driving, daily activities, or work?",
    "Have you been evaluated or treated for it?",
  ]),
  h("23", "Lower Extremity Injury or Problem", [
    "What lower extremity injury or problem are you referring to?",
    "When did it occur?",
    "Do you have any current restrictions, limitations, or work impact?",
    "Are you receiving treatment for it?",
  ]),
  h("24", "Current Joint Trouble", [
    "What joint trouble are you referring to and what body area is affected?",
    "How often do symptoms occur?",
    "Are you receiving treatment?",
    "Does it affect your driving, work, or daily activities?",
  ], false),
  h("25", "Back or Joint Pain (Frequent / Occasional)", [
    "What back or joint pain are you referring to and what body area is affected?",
    "Is the pain frequent or occasional?",
    "How often do symptoms occur?",
    "Are you receiving treatment or taking medication?",
    "Does it affect your driving, work, or daily activities?",
  ]),
  h("26", "Current substance abuse problems (e.g. alcoholism)", [
    "What substance abuse problem are you referring to?",
    "Have you received treatment? If yes, when and what treatment?",
    "Does it currently affect your daily activities, work, or attendance?",
  ], false),
  h("27", "Repeated numbness, tingling, pins-and-needles sensations, or loss of sensation in one or both hands", [
    "Is it one hand or both?",
    "How often do the symptoms occur?",
    "Does it affect daily activities, typing, writing, driving, or work?",
    "Have you been evaluated or treated for it?",
  ]),
  h("28", "Repeated pain, discomfort, burning, or tingling in your shoulders", [
    "Which shoulder is affected?",
    "How often do the symptoms occur?",
    "Does it affect daily activities, work, or driving?",
    "Have you been evaluated or treated for it?",
  ]),
  h("29", "Knee pain, popping, or locking", [
    "Which knee is affected?",
    "How often do the pain, popping, or locking occur?",
    "Does it affect walking, stairs, driving, or work?",
    "Have you been evaluated or treated for it?",
  ]),
  h("30", "Foot pain", [
    "Which foot is affected?",
    "How often do you experience the pain?",
    "Does it affect walking, standing, driving, or work?",
    "Are you receiving treatment for it?",
  ]),
  h("31", "Discomfort in wrists, arm, or shoulder interfering with daily activities", [
    "What discomfort is interfering with your daily activities?",
    "What body area is involved?",
    "How often does this happen?",
    "Does it currently affect your work?",
    "Are you receiving treatment for it?",
  ]),
  h("32", "Medical treatment for this pain and/or discomfort", [
    "What condition or symptom are you receiving treatment for?",
    "What treatment are you receiving?",
    "Is the treatment ongoing?",
    "Are you still having symptoms?",
    "Does the condition currently affect your work or daily activities?",
  ]),
  h("33", "Currently wear corrective lenses", [
    "What type of corrective lenses do you use?",
    "Are they for reading, distance, or both?",
    "Do they fully correct your vision for driving, work, and daily activities?",
    "Do you have any other eye or vision issues besides needing corrective lenses?",
  ], false),
];

export const occuMedSedentaryDefinition = form(
  "occu-med-sedentary-medical-history",
  "Occu-Med Sedentary Medical History Questionnaire",
  "Adaptive lower-burden Occu-Med medical history interview with the source-form on-duty-driving gate and recovered question-specific follow-ups.",
  "Occu-Med Sedentary Medical History Questionnaire, Copyright 2020",
  [
    text("demo.name", "Name (Last, First, Middle)", "Applicant / Employee Information", false),
    text("demo.ssn", "Social Security Number", "Applicant / Employee Information", false),
    text("demo.dob", "Birthdate", "Applicant / Employee Information", false),
    text("demo.address", "Mailing address / City / State / ZIP", "Applicant / Employee Information", false),
    text("demo.phone", "Phone numbers", "Applicant / Employee Information", false),
    text("demo.email", "Email", "Applicant / Employee Information", false),

    branch("1", "1 — Please list all prescription and non-prescription medication you regularly use", "Medications / Allergies", [
      "For each medication, what condition is it treating?",
      "What dose and frequency do you take?",
      "When did you start taking it?",
      "Do you have any side effects?",
    ], { answerType: "text", triggerValue: "*" }),
    branch("2", "2 — Please list prescription or non-prescription medications, not taken regularly, used in the last two months", "Medications / Allergies", [
      "What condition or symptom was each medication used for?",
      "When did you take it and how often?",
      "Are you still taking it?",
      "Did you have any side effects?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    branch("3", "3 — Please list substances, including food or insect stings, that you are allergic to", "Medications / Allergies", [
      "What reaction do you have to each substance?",
      "When was your most recent reaction?",
      "Have you ever required emergency treatment?",
      "Do you carry or use medication for the allergy?",
    ], { answerType: "text", triggerValue: "*", required: false }),

    h("4", "Positive PPD (Tuberculosis) skin test or diagnosed with Tuberculosis", [
      "Are you referring to a positive TB skin test, tuberculosis diagnosis, or both?",
      "When did this occur?",
      "Did you receive treatment?",
      "Do you have any current symptoms, restrictions, or follow-up related to this history?",
    ]),
    h("5", "Vision or Eye Problems", [
      "What vision or eye problem are you referring to?",
      "Do you use glasses, contacts, or any other treatment?",
      "Does it currently affect your work or daily activities?",
    ]),
    h("6", "Frequent Headaches or Migraines", [
      "Do you experience headaches, migraines, or both?",
      "How often do they occur and how severe are they?",
      "Do they affect your daily activities or work?",
      "Are you receiving treatment or taking medication for them?",
    ]),
    h("7", "Loss of Consciousness", [
      "When did the loss of consciousness occur?",
      "Was it a one-time event or has it happened more than once?",
      "Were you evaluated or treated by a provider?",
      "Do you have any current restrictions, limitations, or ongoing symptoms related to it?",
    ]),
    h("8", "Neurological Conditions (Epilepsy, Stroke, Dementia)", [
      "What neurological condition are you referring to?",
      "When was it diagnosed or when did it occur?",
      "Are you receiving treatment or taking medication for it?",
      "Do you have any current symptoms, restrictions, or work limitations related to it?",
    ]),
    h("9", "Limiting injury of any kind", [
      "What limiting injury are you referring to?",
      "When did it occur?",
      "What limitations or restrictions did it cause?",
      "Are those limitations or restrictions still current?",
      "Does it currently affect your daily activities or work?",
    ]),
    h("10", "Current Pain or Discomfort", [
      "What area of the body is currently painful or uncomfortable?",
      "When did the pain or discomfort begin?",
      "How severe is it?",
      "Does it affect your daily activities or work?",
      "Are you receiving treatment for it now?",
    ], false),
    h("11", "Current Neck or Back Trouble", [
      "What symptoms are you having?",
      "How often do the symptoms occur?",
      "Are you receiving treatment or taking medication for it?",
      "Does it affect your daily activities, work, or attendance?",
    ], false),
    h("12", "Upper Extremity Problem (Carpal Tunnel Syndrome, Tendonitis, Arthritis)", [
      "What upper extremity condition are you referring to?",
      "What body area is affected?",
      "Are you receiving treatment or taking medication for it?",
      "Does it affect your daily activities or work?",
    ]),
    h("13", "Repeated soreness or pain in either forearm or elbow", [
      "Which arm is affected?",
      "How often do you have forearm or elbow pain or soreness?",
      "Does it affect your daily activities or work?",
      "Have you been evaluated or treated for it?",
    ]),
    h("14", "Anticipate requiring any work accommodations", [
      "What work accommodation do you believe you may need?",
      "What condition or issue is the accommodation related to?",
      "Has a provider recommended this accommodation?",
    ], false),
    h("15", "Any condition which may impact work attendance", [
      "What condition may affect your work attendance?",
      "How does it affect your attendance?",
      "How often would you expect it to affect work attendance?",
      "Are you receiving treatment or taking medication for this condition?",
    ], false),

    q(
      "driving.gate",
      "Does your job require on-duty driving?",
      "On-Duty Driving",
      { answerType: "yes_no", triggerValue: "yes", helpText: "The source form instructs applicants to answer Questions 16–33 only when the job requires on-duty driving." },
      drivingQuestions,
    ),
  ],
);
