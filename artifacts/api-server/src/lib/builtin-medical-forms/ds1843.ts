import { branch, civilianHistory, date, form, q, select, text } from "./definition-helpers";

const S = "Medical History";
const h = (key: string, label: string, prompts: string[]) =>
  civilianHistory(key, `${key} — ${label}`, S, prompts);

const pregnancy = q("21", "21 — Are you pregnant?", S, { answerType: "yes_no" });

export const ds1843Definition = form(
  "ds-1843-medical-history-examination",
  "DS-1843 — Medical History and Examination (Age 12 and Older)",
  "Adaptive DS-1843 medical-history questionnaire preserving source numbering while using open, source-specific applicant clarification.",
  "U.S. Department of State DS-1843, 12-2023",
  [
    text("demo.name", "1a — Name of examinee (Last, First, MI)", "Demographic Information", false),
    text("demo.chosenName", "1b — Chosen name of examinee", "Demographic Information", false),
    text("demo.eligibleFamilyMember", "2 — If Eligible Family Member, name of employee/applicant", "Demographic Information", false),
    date("demo.dob", "3 — Date of birth", "Demographic Information", false),
    text("demo.birthplace", "4 — Place of birth (City, State, Country)", "Demographic Information", false),
    select("demo.sexAssignedAtBirth", "5b — Sex assigned at birth", "Demographic Information", ["Male", "Female"], false),
    q(
      "demo.pregnancyGate",
      "Pregnancy question applicability",
      "Demographic Information",
      { answerType: "dropdown", options: ["Not applicable", "Ask pregnancy question"], required: false, triggerValue: "ask pregnancy question", helpText: "Use when the pregnancy item on the source form applies." },
      [pregnancy],
    ),
    select("demo.status", "6 — Status", "Demographic Information", ["New Family Member", "Dependent Child", "Spouse", "Applicant", "Employee"], false),
    text("demo.agency", "7 — Agency of employee/applicant/sponsor", "Demographic Information", false),
    text("demo.healthPlan", "8 — Health insurance plan", "Demographic Information", false),
    select("demo.purpose", "9 — Purpose of exam", "Demographic Information", ["Pre-Employment Exam", "In-Service Exam", "Separation Exam"], false),
    text("demo.employmentStatus", "10 — Employment status", "Demographic Information", false),
    text("demo.email", "11 — Email address", "Demographic Information", false),
    text("demo.phone", "12 — Telephone number", "Demographic Information", false),
    text("demo.specialAssignment", "13 — Special assignment, if applicable", "Demographic Information", false),
    text("demo.post", "14 — Post of assignment and estimated dates", "Demographic Information", false),

    h("1", "Frequent/severe headaches or migraines?", [
      "What is the current pattern of the headaches or migraines you reported?",
      "How have they been evaluated or treated?",
    ]),
    h("2", "Fainting, dizzy episodes, or syncope?", [
      "What is the current pattern and status of the fainting, dizziness, or syncope you reported?",
      "What medical evaluation or treatment has occurred?",
    ]),
    h("3", "Stroke, TIA, or head injury?", [
      "What stroke, TIA, or head-injury history are you reporting, and what is its current status?",
      "What treatment or medical follow-up occurred?",
    ]),
    h("4", "Epilepsy, seizures, or other neurologic disorders?", [
      "What neurological condition are you reporting, and what is its current status?",
      "How is the condition currently being treated or monitored?",
    ]),
    h("5", "Eye or vision problems?", [
      "What eye or vision condition was identified, and what is its current status?",
      "How is the condition currently corrected, treated, or monitored?",
    ]),
    h("6", "Ear, nose, throat problems; hearing loss; hoarseness?", [
      "What ear, nose, throat, hearing, or voice condition are you reporting, and what is its current status?",
      "How has the condition been evaluated or treated?",
    ]),
    h("7", "Allergies or history of anaphylactic reaction?", [
      "What allergy or allergic reaction are you reporting, and what is its current status?",
      "How is the allergy or reaction currently managed?",
    ]),
    h("8", "Shortness of breath, asthma, or COPD?", [
      "What respiratory condition or symptoms are you reporting, and what is their current status?",
      "How have they been evaluated or treated?",
    ]),
    h("9", "History of abnormal chest x-ray?", [
      "What finding was identified on the chest x-ray?",
      "What additional evaluation, treatment, or follow-up occurred afterward?",
    ]),
    h("10", "History of positive TB skin test, IGRA, or tuberculosis?", [
      "What TB testing, diagnosis, or treatment history are you reporting, and what is its current status?",
      "What treatment or medical follow-up occurred?",
    ]),
    h("11", "Aneurysm, blood clot, or pulmonary embolism?", [
      "What aneurysm, blood-clot, or embolism history are you reporting, and what is its current status?",
      "What treatment or medical follow-up occurred?",
    ]),
    h("12", "High blood pressure?", [
      "What is the history and current status of your high blood pressure?",
      "How is your blood pressure currently being managed or monitored?",
    ]),
    h("13", "Murmurs, palpitations, or other heart problems?", [
      "What heart condition or finding was identified, and what is its current status?",
      "What treatment or cardiology follow-up has occurred?",
    ]),
    h("14", "Are you a former or current smoker?", [
      "What smoking history are you reporting, including whether the use is current or former?",
    ]),
    h("15", "Stomach, esophageal, or other intestinal problems?", [
      "What gastrointestinal condition are you reporting, and what is its current status?",
      "How has the condition been evaluated or treated?",
    ]),
    h("16", "Jaundice, hepatitis, or other liver disease?", [
      "What liver condition or type of hepatitis was identified, and what is its current status?",
      "What treatment or medical monitoring has occurred?",
    ]),
    h("17", "Intestinal, rectal problems, or hernia?", [
      "What intestinal, rectal, or hernia condition are you reporting, and what is its current status?",
      "What treatment or medical follow-up has occurred?",
    ]),
    h("18", "Urinary or kidney problems, blood in urine?", [
      "What urinary or kidney condition are you reporting, and what is its current status?",
      "What evaluation or treatment has occurred?",
    ]),
    h("19", "Diabetes, thyroid, or other endocrine disorders?", [
      "What endocrine condition was identified, and what is its current status?",
      "How is the condition currently being treated or monitored?",
    ]),
    h("20", "Joint or back pain/injury?", [
      "What joint or back condition or injury are you reporting, and what is its current pattern or status?",
      "How has the problem been evaluated or managed?",
    ]),
    h("22", "Rheumatologic disorder?", [
      "What rheumatologic condition was identified, and what is its current status?",
      "How is the condition currently being treated or monitored?",
    ]),
    h("23", "Anemia?", [
      "What is the current status of the anemia you reported?",
      "How is the condition currently being treated or monitored?",
    ]),
    h("24", "Blood transfusion?", [
      "When was the blood transfusion received, and what medical condition or event made it necessary?",
      "What is the current status of that underlying condition or event?",
    ]),
    h("25", "Malaria, tropical, or other infectious disease?", [
      "What infectious disease are you reporting, and what is its current status?",
      "What treatment or medical follow-up occurred?",
    ]),
    h("26", "Any skin or nail disorder?", [
      "What skin or nail condition are you reporting, and what is its current pattern or status?",
      "How has the condition been evaluated or treated?",
    ]),
    h("27", "Cancer of any type?", [
      "What type of cancer was identified, and what is its current status?",
      "What treatment or medical follow-up has occurred?",
    ]),
    h("28", "Any thickening or lump in breast or testicle?", [
      "What lump or thickening are you reporting, and what is its current status?",
      "What medical evaluation or follow-up has occurred?",
    ]),
    h("29", "Referred or evaluated for special educational services, accommodations, IFSP, IEP, or 504 plan?", [
      "What support or accommodation is associated with the history you reported, and what is its current status?",
    ]),
    h("30", "In the past two years, psychotherapy or counseling for mental or behavioral health concerns?", [
      "What condition or concern was associated with the counseling or psychotherapy, and what is its current clinical status?",
      "What treatment or clinical follow-up is currently in place, if any?",
    ]),
    h("31", "In the past two years, prescribed medication for depression, anxiety, mood, stress, memory/attention, or other behavioral symptoms?", [
      "What medication history are you reporting, and what condition was it prescribed for?",
      "What is the current clinical status of that condition?",
    ]),
    h("32", "Alcohol or drug-related problem, advice to reduce use, or negative consequence due to substance use?", [
      "What substance-related issue are you reporting, and what is its current status?",
      "What treatment or clinical follow-up has occurred, if any?",
    ]),
    h("33", "Symptoms of an eating disorder?", [
      "What eating-disorder condition or symptoms are you reporting, and what is their current clinical status?",
      "What treatment or clinical follow-up has occurred, if any?",
    ]),
    h("34", "In the past two years, mental-health hospitalization, self-injury, or suicidal behavior?", [
      "What event or condition is associated with the history you reported, and what is its current clinical status?",
      "What treatment or clinical follow-up is currently in place, if any?",
    ]),
    branch("35", "35 — Are you interested in a consultation with a Mental Health specialist on managing treatment overseas?", S, [
      "What type of treatment-planning or clinical support would you like to discuss?",
    ]),
    h("36", "Is there any other medical or mental health condition not covered in questions 1–35?", [
      "What other condition are you reporting, and what is its current status?",
      "What treatment or medical follow-up has occurred?",
    ]),

    branch("medications", "III — List of current medications (prescription, over-the-counter, vitamins, and herbs)", "Current Medications / Allergies", [
      "What is each medication being used for, and how is it currently taken?",
      "What effects or changes, if any, have you noticed while taking it?",
    ], { answerType: "text", triggerValue: "*" }),
    text("allergies", "III — Drug or other allergies", "Current Medications / Allergies", false),
    branch("hospitalizations", "IV — Hospitalizations, operations, and medical evacuations", "Hospitalizations / Operations", [
      "What illness, operation, or event was involved, and when did it occur?",
      "What is the current status of the condition or event that led to it?",
    ], { answerType: "text", triggerValue: "*", required: false }),
  ],
);
