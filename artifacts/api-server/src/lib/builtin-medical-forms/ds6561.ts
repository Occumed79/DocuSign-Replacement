import { branch, civilianHistory, date, form, q, select, text } from "./definition-helpers";

const S = "Medical History — Past 10 Years";
const h = (key: string, label: string, prompts: string[]) =>
  civilianHistory(key, `${key} — ${label}`, S, prompts);

const blast = civilianHistory("highThreat.blast", "Have you been injured or experienced a blast or explosion?", "High-Threat Post History", [
  "What injury, blast, or explosion history are you reporting, and what is its current medical status?",
  "What treatment or medical follow-up occurred?",
]);
const toxic = civilianHistory("highThreat.toxic", "Have you been exposed to any known toxic chemicals?", "High-Threat Post History", [
  "What toxic-chemical exposure are you reporting, and what medical issue or reaction occurred?",
  "What medical evaluation, treatment, or monitoring has occurred?",
]);

export const ds6561Definition = form(
  "ds-6561-non-foreign-service-overseas",
  "DS-6561 — Non-Foreign Service Personnel and Their Family Members",
  "Adaptive DS-6561 overseas-duty medical-history questionnaire preserving the source 10-year history, special-population items, high-threat exposure questions, and trauma screen while using open, source-specific clarification.",
  "U.S. Department of State DS-6561, 08-2011",
  [
    text("demo.examineeName", "Name of examinee (Last, First, Middle Initial)", "Identification", false),
    date("demo.date", "Date", "Identification", false),
    text("demo.agency", "Agency", "Identification", false),
    select("demo.sex", "Sex", "Identification", ["Male", "Female"], false),
    date("demo.dob", "Date of birth", "Identification", false),
    text("demo.birthplace", "Place of birth", "Identification", false),
    text("demo.post", "Post of assignment", "Identification", false),
    text("demo.email", "Email address", "Identification", false),
    text("demo.address", "Mailing address", "Identification", false),
    text("demo.phone", "Telephone number", "Identification", false),
    text("demo.employeeName", "Name of employee (if different from examinee)", "Identification", false),
    select("demo.examineeStatus", "Status of examinee", "Identification", ["Employee", "Spouse", "Domestic Partner", "Dependent Child"], false),

    h("1", "Stroke, TIA, or blackout?", [
      "What stroke, TIA, or blackout history are you reporting, and what is its current status?",
      "What treatment or medical follow-up occurred?",
    ]),
    h("2", "Epilepsy or seizures?", [
      "What is the current status of the epilepsy or seizure history you reported?",
      "How is the condition currently being treated or monitored?",
    ]),
    h("3", "Chronic eye trouble, vision problems, or glaucoma?", [
      "What eye or vision condition was identified, and what is its current status?",
      "How is the condition currently corrected, treated, or monitored?",
    ]),
    h("4", "Difficulty with your hearing?", [
      "What hearing problem was identified, and what is its current status?",
      "How is the hearing problem currently corrected, treated, or monitored?",
    ]),
    h("5", "Asthma?", [
      "What is the current pattern and status of your asthma?",
      "How has your asthma been treated or managed?",
    ]),
    h("6", "Wheezing or shortness of breath?", [
      "What is the current pattern of the wheezing or shortness of breath you reported?",
      "What medical evaluation or treatment have you had for it?",
    ]),
    h("7", "Severe headaches or migraines?", [
      "What is the current pattern of the headaches or migraines you reported?",
      "How have they been evaluated or treated?",
    ]),
    h("8", "Chronic cough or coughing up blood?", [
      "What is the current pattern or status of the chronic cough or coughing up blood you reported?",
      "What medical evaluation or treatment has occurred?",
    ]),
    h("9", "Pain or pressure in your chest?", [
      "What is the current pattern of the chest pain or pressure you reported?",
      "What medical evaluation or treatment have you had for it?",
    ]),
    h("10", "Heart problems, murmur, or palpitations?", [
      "What heart condition or finding was identified, and what is its current status?",
      "What treatment or cardiology follow-up has occurred?",
    ]),
    h("11", "High blood pressure?", [
      "What is the history and current status of your high blood pressure?",
      "How is your blood pressure currently being managed or monitored?",
    ]),
    h("12", "Stomach, liver, or intestinal problems?", [
      "What stomach, liver, or intestinal condition are you reporting, and what is its current status?",
      "How has the condition been evaluated or treated?",
    ]),
    h("13", "Jaundice or hepatitis (which type)?", [
      "What type of hepatitis or liver condition was identified, and what is its current status?",
      "What treatment or medical monitoring has occurred?",
    ]),
    h("14", "Untreated hernia?", [
      "What type of hernia are you reporting, and what is its current status?",
      "What treatment or medical follow-up has occurred?",
    ]),
    h("15", "Rectal bleeding or black, tarry stools?", [
      "What is the history and current status of the rectal bleeding or black stools you reported?",
      "What medical evaluation or treatment occurred?",
    ]),
    h("16", "Frequent urination or chronic urinary tract infection?", [
      "What urinary condition or symptoms are you reporting, and what is their current status?",
      "How have they been evaluated or treated?",
    ]),
    h("17", "Kidney trouble; stone, blood, or protein in urine?", [
      "What kidney or urinary condition are you reporting, and what is its current status?",
      "What treatment or medical follow-up has occurred?",
    ]),
    h("18", "Diabetes or thyroid disease?", [
      "What endocrine condition was identified, and what is its current status?",
      "How is the condition currently being treated or monitored?",
    ]),
    h("19", "Arthritis, rheumatism, joint pain, or altered mobility?", [
      "What joint or rheumatologic condition are you reporting, and which areas are affected?",
      "What is the current pattern and management of the condition?",
    ]),
    h("20", "Debilitating back pain or back injury?", [
      "What back condition or injury are you reporting, and what is its current status or pattern?",
      "How has the back problem been evaluated or managed?",
    ]),
    h("21", "Skin cancer?", [
      "What type of skin cancer was identified, and what is its current status?",
      "What treatment or medical follow-up has occurred?",
    ]),
    h("22", "A thickening or lump in breast or elsewhere?", [
      "What lump or thickening are you reporting, and what is its current status?",
      "What medical evaluation or follow-up has occurred?",
    ]),
    h("23", "Referred to or sought consultation or treatment from a mental health professional, inpatient or outpatient?", [
      "What condition or concern was associated with the consultation or treatment, and what is its current clinical status?",
      "What treatment or clinical follow-up is currently in place, if any?",
    ]),
    h("24", "Consumed at one time in the past year more than 6 drinks for males or 5 drinks for females?", []),
    h("25", "Chronic medical or mental health conditions requiring medication or routine follow-up?", [
      "What condition or conditions require medication or routine medical follow-up?",
      "What current treatment, monitoring, or follow-up is required?",
    ]),

    q("female.pregnant", "Females only — Are you pregnant?", "Special Population Items", { answerType: "yes_no", required: false }),
    civilianHistory("female.pap", "Females only — Have you had an abnormal Pap smear within the last year?", "Special Population Items", [
      "What follow-up evaluation or treatment was recommended or completed after the abnormal Pap smear?",
      "What is the current status of that follow-up?",
    ]),
    civilianHistory("child.learning", "Children only — Special education requirement or learning disability?", "Special Population Items", [
      "What support, accommodation, or learning need is associated with the history reported here, and what is its current status?",
    ]),

    q("highThreat.gate", "Have you been assigned to a high-threat unaccompanied post in the last three years?", "High-Threat Post History", { answerType: "yes_no", triggerValue: "yes", required: false }, [blast, toxic]),

    civilianHistory("trauma.nightmares", "In the past month, have you had nightmares about a frightening, horrible, or upsetting experience, or thought about it when you did not want to?", "Trauma Screen", [
      "What clinical care or follow-up, if any, is currently associated with these symptoms?",
    ]),
    civilianHistory("trauma.avoidance", "In the past month, have you tried hard not to think about the experience or avoided situations that reminded you of it?", "Trauma Screen", [
      "What clinical care or follow-up, if any, is currently associated with these symptoms?",
    ]),
    civilianHistory("trauma.guard", "In the past month, have you been constantly on guard, watchful, or easily startled?", "Trauma Screen", [
      "What clinical care or follow-up, if any, is currently associated with these symptoms?",
    ]),
    civilianHistory("trauma.detached", "In the past month, have you felt numb or detached from others, activities, or your surroundings?", "Trauma Screen", [
      "What clinical care or follow-up, if any, is currently associated with these symptoms?",
    ]),

    branch("medications", "List current medications and dose", "Current Medications / Allergies", [
      "What is each medication being used for, and how is it currently taken?",
      "What current monitoring or medical follow-up is associated with the medication or condition?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    text("allergies", "Drug or other allergies / reaction", "Current Medications / Allergies", false),
    branch("hospitalizations", "Hospitalizations / major operations", "Hospitalizations / Operations", [
      "What illness, operation, or event was involved, and when did it occur?",
      "What is the current status of the condition or event that led to it?",
    ], { answerType: "text", triggerValue: "*", required: false }),
  ],
);
