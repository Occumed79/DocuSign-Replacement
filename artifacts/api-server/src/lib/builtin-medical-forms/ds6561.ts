import { branch, date, form, history, q, select, text } from "./definition-helpers";

const S = "Medical History — Past 10 Years";
const h = (key: string, label: string, prompts: string[]) => history(key, `${key} — ${label}`, S, prompts);

const blast = history("highThreat.blast", "Have you been injured or experienced a blast or explosion?", "High-Threat Post History", [
  "When did the injury, blast, or explosion occur?",
  "What happened?",
  "Were you evaluated or treated?",
  "Do you have any current symptoms, restrictions, or limitations related to it?",
]);
const toxic = history("highThreat.toxic", "Have you been exposed to any known toxic chemicals?", "High-Threat Post History", [
  "What toxic chemical or exposure are you referring to?",
  "When and where did the exposure occur?",
  "Did it cause any symptoms or medical problems?",
  "Were you treated or evaluated?",
  "Do you have any current symptoms, restrictions, or monitoring related to it?",
]);

export const ds6561Definition = form(
  "ds-6561-non-foreign-service-overseas",
  "DS-6561 — Non-Foreign Service Personnel and Their Family Members",
  "Adaptive overseas-duty medical history for DS-6561, preserving the source 10-year history, special population items, high-threat exposure questions, trauma screen, and recovered follow-up logic.",
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
      "Which event are you referring to: stroke, TIA, blackout, or more than one?",
      "When did it occur and was it a one-time event or recurrent?",
      "Were you hospitalized or treated?",
      "Do you have any current symptoms, restrictions, or limitations?",
    ]),
    h("2", "Epilepsy or seizures?", [
      "When were you diagnosed or when did the seizure occur?",
      "Was it a one-time event or recurrent?",
      "Are you taking medication or receiving treatment?",
      "Do you have any current symptoms, restrictions, or limitations?",
    ]),
    h("3", "Chronic eye trouble, vision problems, or glaucoma?", [
      "What eye or vision condition are you referring to?",
      "When was it diagnosed?",
      "Are you receiving treatment or using corrective lenses?",
      "Does it currently affect your daily activities or work overseas?",
    ]),
    h("4", "Difficulty with your hearing?", [
      "What hearing issue are you referring to?",
      "Do you use a hearing aid or receive treatment?",
      "Does it affect communication, daily activities, or work?",
    ]),
    h("5", "Asthma?", [
      "When were you diagnosed with asthma?",
      "Do you currently have symptoms and how often do they occur?",
      "What triggers them?",
      "Do you use an inhaler or other treatment?",
      "Does asthma affect your daily activities or work overseas?",
    ]),
    h("6", "Wheezing or shortness of breath?", [
      "How often does it happen?",
      "What tends to trigger it?",
      "Have you been evaluated or treated for it?",
      "Does it limit your daily activities or work?",
    ]),
    h("7", "Severe headaches or migraines?", [
      "How often do you experience headaches or migraines?",
      "How severe are they and are there known triggers?",
      "Do they affect your daily activities or work?",
      "Are you receiving treatment or taking medication for them?",
    ]),
    h("8", "Chronic cough or coughing up blood?", [
      "Are you referring to a chronic cough, coughing up blood, or both?",
      "When did this occur?",
      "Have you been evaluated or treated for it?",
      "Do you have any current symptoms or limitations?",
    ]),
    h("9", "Pain or pressure in your chest?", [
      "How often does the chest pain or pressure happen?",
      "What tends to bring it on?",
      "Have you been evaluated or treated by a provider?",
      "Does it affect your daily activities or work?",
    ]),
    h("10", "Heart problems, murmur, or palpitations?", [
      "What heart condition are you referring to?",
      "When was it diagnosed?",
      "Have you been evaluated or treated by a cardiologist or other provider?",
      "Do you currently have symptoms such as palpitations, dizziness, chest pain, or fainting?",
      "Do you take medication for this condition?",
      "Does it currently limit your activities or work?",
    ]),
    h("11", "High blood pressure?", [
      "When were you told you had high blood pressure?",
      "Are you taking medication or receiving treatment?",
      "Do you know your most recent blood pressure reading?",
      "Does it cause any current symptoms, restrictions, or limitations?",
    ]),
    h("12", "Stomach, liver, or intestinal problems?", [
      "What stomach, liver, or intestinal condition are you referring to?",
      "When did it occur or when were you diagnosed?",
      "Did you receive treatment?",
      "Do you have any current symptoms, restrictions, or monitoring needs?",
    ]),
    h("13", "Jaundice or hepatitis (which type)?", [
      "What type of hepatitis or liver condition are you referring to?",
      "When were you diagnosed?",
      "Did you receive treatment?",
      "Do you currently require monitoring or follow-up?",
    ]),
    h("14", "Untreated hernia?", [
      "What type of hernia do you have?",
      "When did it occur?",
      "Has it been repaired or treated?",
      "Do you have any current symptoms, restrictions, or limitations related to it?",
    ]),
    h("15", "Rectal bleeding or black, tarry stools?", [
      "When did this occur?",
      "Was it medically evaluated?",
      "What diagnosis or treatment did you receive?",
      "Do you have any current symptoms or limitations?",
    ]),
    h("16", "Frequent urination or chronic urinary tract infection?", [
      "What urinary issue are you referring to?",
      "How often does it occur?",
      "Have you been evaluated or treated?",
      "Do you have any current symptoms, restrictions, or limitations?",
    ]),
    h("17", "Kidney trouble; stone, blood, or protein in urine?", [
      "Are you referring to kidney trouble, kidney stones, blood in urine, protein in urine, or more than one?",
      "When did this first occur and when was the most recent episode?",
      "Did you receive treatment?",
      "Do you have any current symptoms, restrictions, or monitoring needs?",
    ]),
    h("18", "Diabetes or thyroid disease?", [
      "Are you referring to diabetes, thyroid disease, or both?",
      "When were you diagnosed?",
      "Are you receiving treatment or taking medication?",
      "Do you have any current symptoms, restrictions, or monitoring needs?",
    ]),
    h("19", "Arthritis, rheumatism, joint pain, or altered mobility?", [
      "What condition are you referring to and what body areas are affected?",
      "How often do symptoms occur?",
      "Are you taking medication or receiving treatment?",
      "Does it cause any current restrictions, limitations, or altered mobility?",
    ]),
    h("20", "Debilitating back pain or back injury?", [
      "What back condition or injury are you referring to?",
      "When did it occur and what caused it?",
      "Are you receiving treatment?",
      "Does it cause any current restrictions, limitations, or work impact?",
    ]),
    h("21", "Skin cancer?", [
      "What type of skin cancer did you have?",
      "When was it diagnosed?",
      "What treatment did you receive?",
      "Is it resolved, under surveillance, or still active?",
      "Do you have any current symptoms or limitations?",
    ]),
    h("22", "A thickening or lump in breast or elsewhere?", [
      "Where was the lump or thickening located?",
      "When was it identified?",
      "Was it evaluated by a provider and was a diagnosis made?",
      "Is it still present or resolved?",
    ]),
    h("23", "Referred to or sought consultation or treatment from a mental health professional, inpatient or outpatient?", [
      "What condition or concern led to treatment or consultation?",
      "Are you still in treatment, counseling, or taking medication?",
      "Do you have any current symptoms, restrictions, or limitations?",
      "Does it affect your ability to live or work overseas?",
    ]),
    h("24", "Consumed at one time in the past year more than 6 drinks for males or 5 drinks for females?", [
      "Was this a one-time episode or part of a recurring pattern?",
      "Has alcohol use caused any medical, legal, work, or daily functioning issues?",
      "Have you ever received treatment or counseling related to alcohol use?",
    ]),
    h("25", "Chronic medical or mental health conditions requiring medication or routine follow-up?", [
      "What condition or conditions are you referring to?",
      "What medications or routine follow-up are required?",
      "How often do you need follow-up care?",
      "Do you have any current symptoms, restrictions, or limitations?",
      "Would this require ongoing care while overseas?",
    ]),

    branch("female.pregnant", "Females only — Are you pregnant?", "Special Population Items", [
      "Are you under current medical care?",
      "Are there any current restrictions, limitations, or provider recommendations related to the pregnancy?",
    ]),
    history("female.pap", "Females only — Have you had an abnormal Pap smear within the last year?", "Special Population Items", [
      "When did the abnormal Pap smear occur?",
      "What follow-up evaluation or treatment was recommended or completed?",
      "Is any follow-up still pending?",
    ], { statusGate: false }),
    history("child.learning", "Children only — Special education requirement or learning disability?", "Special Population Items", [
      "What support, accommodation, or learning issue is involved?",
      "Is the need current?",
      "Does the child currently receive services, treatment, or accommodations?",
    ], { statusGate: false }),

    q("highThreat.gate", "Have you been assigned to a high-threat unaccompanied post in the last three years?", "High-Threat Post History", { answerType: "yes_no", triggerValue: "yes", required: false }, [blast, toxic]),

    history("trauma.nightmares", "In the past month, have you had nightmares about a frightening, horrible, or upsetting experience, or thought about it when you did not want to?", "Trauma Screen", [
      "How often do these symptoms occur?",
      "Have you been evaluated or treated for them?",
      "Are you currently in counseling or taking medication?",
      "Do these symptoms affect your daily activities or work?",
    ], { statusGate: false }),
    history("trauma.avoidance", "In the past month, have you tried hard not to think about the experience or avoided situations that reminded you of it?", "Trauma Screen", [
      "How often do these avoidance symptoms occur?",
      "Have you been evaluated or treated for them?",
      "Do they affect your daily activities or work overseas?",
    ], { statusGate: false }),
    history("trauma.guard", "In the past month, have you been constantly on guard, watchful, or easily startled?", "Trauma Screen", [
      "How often do these symptoms occur?",
      "Have you been evaluated or treated for them?",
      "Do they affect your daily activities, concentration, or work?",
    ], { statusGate: false }),
    history("trauma.detached", "In the past month, have you felt numb or detached from others, activities, or your surroundings?", "Trauma Screen", [
      "How often do these symptoms occur?",
      "Have you been evaluated or treated for them?",
      "Do they affect your daily activities, relationships, or work?",
    ], { statusGate: false }),

    branch("medications", "List current medications and dose", "Current Medications / Allergies", [
      "What condition is each medication treating?",
      "How often do you take it?",
      "Do you have any side effects?",
      "Would access to this medication be required overseas?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    text("allergies", "Drug or other allergies / reaction", "Current Medications / Allergies", false),
    branch("hospitalizations", "Hospitalizations / major operations", "Hospitalizations / Operations", [
      "What illness or operation was involved?",
      "When did it occur?",
      "Have you fully recovered?",
      "Do you have any current symptoms, restrictions, or ongoing treatment related to it?",
    ], { answerType: "text", triggerValue: "*", required: false }),
  ],
);
