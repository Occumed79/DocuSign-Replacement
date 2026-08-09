import { form, history, text } from "./definition-helpers";

const ph = (key: string, label: string, section: string, prompts: string[]) =>
  history(key, `${key} — ${label}`, section, prompts, { allowUnsure: true });

const item = (key: string, label: string, prompts: string[]) =>
  ph(key, label, "Section 3 — Medical History", prompts);

const general = [
  item("10", "Have you ever worked as a public safety dispatcher before?", [
    "When and where did you work as a public safety dispatcher?",
    "Did you have any medical, psychological, or work restrictions in that role?",
  ]),
  item("11", "Have you ever failed to complete a public safety dispatcher training program?", [
    "When did this occur?",
    "Was it related to a medical, psychological, or other issue?",
  ]),
  item("12", "Have you ever failed a pre-placement medical examination?", [
    "When did this occur?",
    "What issue led to that result?",
    "Is that issue still current?",
  ]),
  item("13", "Have you ever been refused employment or been unable to hold a job because of any physical, psychological, or other medically-related reason?", [
    "What issue was involved?",
    "When did this occur?",
    "Is that issue still current?",
    "Does it currently affect your ability to work?",
  ]),
  item("14", "Are you currently under a health care provider's care for any medical condition?", [
    "What condition is being treated?",
    "How often are you seen?",
    "What treatment or medication are you receiving?",
    "Does the condition affect your ability to perform dispatcher duties?",
  ]),
  item("15", "Do you have any physical limitations?", [
    "Please describe the limitation.",
    "Does it affect your ability to perform dispatcher duties?",
    "Has a provider recommended any restrictions?",
  ]),
  item("16", "Do you need any reasonable accommodation to assist you in performing required job tasks?", [
    "What accommodation do you need?",
    "What condition is it related to?",
    "Has a provider recommended it?",
  ]),
  item("17", "Have you ever been absent from work due to job stress?", [
    "When did this occur?",
    "What symptoms or condition were involved?",
    "Is the issue still current?",
  ]),
  item("18", "Have you missed more than five days from work in the past 12 months due to medically-related reasons?", [
    "What condition caused the absences?",
    "Is it still affecting your attendance?",
  ]),
  item("19", "Have you ever been absent from work because of back/neck pain or problems?", [
    "What condition was involved?",
    "When did this occur?",
    "Does it still affect you now?",
  ]),
  item("20", "Have you ever seen a doctor for back/neck pain or problems?", [
    "What diagnosis was made?",
    "What treatment was provided?",
    "Do you have any current symptoms or limitations?",
  ]),
  item("21", "In the past year, have you had a change in the size and color of a mole or a sore that would not heal?", [
    "When did you notice it?",
    "Has a provider evaluated it?",
    "Is it still present?",
  ]),
  item("22", "Do you occasionally use, or are you currently taking, any prescription or over-the-counter medications?", [
    "What medication are you taking?",
    "What condition is it treating?",
    "Do you have any side effects?",
  ]),
  item("23", "Have you taken any medications within the past 12 months for any reason?", [
    "What medication did you take?",
    "What condition was it for?",
    "Was it temporary or ongoing?",
  ]),
  item("24", "Have you sustained any disabling illnesses or medical conditions within the past 5 years?", [
    "What condition was involved?",
    "When did it occur?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),
  item("25", "Have you ever had a positive drug or alcohol test?", [
    "When did it occur?",
    "What substance was involved?",
    "Did you receive any treatment or counseling afterward?",
  ]),
  item("26", "Are you now or have you ever been enrolled in a drug or alcohol rehabilitation program?", [
    "When were you enrolled?",
    "What treatment did you receive?",
    "Is any treatment ongoing?",
  ]),
  text(
    "27",
    "27 — Per week, enter bottles/cans of beer, glasses of wine, and glasses of hard liquor",
    "Section 3 — Medical History",
    false,
    "Enter the weekly amounts requested by the source form. Enter 0 or None if you do not drink alcohol.",
  ),
  item("28", "Has anyone ever been concerned about your drinking or suggested that you cut down?", [
    "When did this occur?",
    "Did it lead to any treatment, counseling, or change in alcohol use?",
  ]),
  item("29", "Have you ever been convicted of driving under the influence (DUI)?", [
    "When did this occur?",
    "Were any treatment, classes, or restrictions required?",
  ]),
  item("30", "Have you ever felt bad about your drinking?", [
    "Is this still a current concern?",
    "Has it affected your daily life or work?",
  ]),
  item("31", "Have you ever had a drink first thing in the morning to steady your nerves or get rid of a hangover?", [
    "When did this occur?",
    "Was it recurring?",
    "Did you receive any treatment or counseling?",
  ]),
  item("32", "Have you been exposed to loud noise today?", [
    "Were you wearing hearing protection?",
    "Do you currently have any hearing-related symptoms?",
  ]),
  item("33", "Are you now receiving or have you ever received Workers Compensation?", [
    "What condition or injury was associated with the claim?",
    "Do you have any current symptoms, restrictions, or limitations related to it?",
  ]),
  item("34", "If you served in the military and were discharged, did you ever apply to the Veteran's Administration (VA) for service-connected disability for medical injuries?", [
    "What condition or conditions were involved?",
    "What percentage was assigned, if known?",
    "Do you have any current symptoms, restrictions, or treatment related to those conditions?",
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
  ph("36A", "Eye surgery", "36. Eye / Ear / Nose / Throat", ["What eye surgery did you have?", "When was it performed?", "Do you have any current vision-related symptoms or limitations?"]),
  ph("36B", "Need to wear corrective lenses", "36. Eye / Ear / Nose / Throat", ["Are the lenses for reading, distance, or both?", "Do they fully correct your vision for work?"]),
  ph("36C", "Blurred or double vision", "36. Eye / Ear / Nose / Throat", ["What blurred or double vision problems have you had?", "Are they current or resolved?", "Do they affect work tasks?"]),
  ph("36D", "Glaucoma", "36. Eye / Ear / Nose / Throat", ["When were you diagnosed with glaucoma?", "Are you receiving treatment or monitoring?", "Does it currently affect your vision or work?"]),
  ph("36E", "Abnormal color vision test", "36. Eye / Ear / Nose / Throat", ["What abnormal color vision finding are you referring to?", "Does it affect your work tasks?"]),
  ph("36F", "Refractive surgery (e.g., Lasik, PRK)", "36. Eye / Ear / Nose / Throat", ["What refractive surgery did you have?", "When was it done?", "Are you fully recovered?"]),
  ph("36G", "Ringing or buzzing in ears", "36. Eye / Ear / Nose / Throat", ["How often does it occur?", "Does it affect concentration, communication, or work performance?"]),
  ph("36H", "Hearing trouble", "36. Eye / Ear / Nose / Throat", ["What hearing trouble are you referring to?", "Do you use any device or treatment?", "Does it affect communication or work?"]),
  ph("36I", "Ear surgery", "36. Eye / Ear / Nose / Throat", ["What ear surgery did you have?", "When was it performed?", "Do you have any current symptoms or restrictions?"]),
  ph("36J", "Earache", "36. Eye / Ear / Nose / Throat", ["What ear pain or earache history are you referring to?", "Is it current?", "Are you receiving treatment?"]),
  ph("36K", "Abnormal hearing test", "36. Eye / Ear / Nose / Throat", ["What abnormal hearing test are you referring to?", "When did it occur?", "Does it affect communication or work performance now?"]),
];

const gastrointestinal = [
  ph("37A", "Ulcer / stomach trouble", "37. Gastrointestinal", ["What ulcer or stomach trouble are you referring to?", "When did it occur?", "Did you receive treatment?", "Is it current or resolved?"]),
  ph("37B", "Persistent diarrhea", "37. Gastrointestinal", ["What persistent diarrhea history are you referring to?", "Is it current?", "Does it affect your daily activities or attendance?"]),
  ph("37C", "Colitis", "37. Gastrointestinal", ["What history of colitis are you referring to?", "Are you receiving treatment or monitoring?", "Is it current?"]),
  ph("37D", "Recurrent hemorrhoids", "37. Gastrointestinal", ["What history of recurrent hemorrhoids are you referring to?", "Is it current?", "Does it affect your daily activities or work?"]),
  ph("37E", "Mucous in stool", "37. Gastrointestinal", ["What history of mucous in stool are you referring to?", "When did it occur?", "Has it been medically evaluated?"]),
  ph("37F", "Black / bloody bowel movement", "37. Gastrointestinal", ["What history of black or bloody bowel movement are you referring to?", "When did it occur?", "What evaluation or treatment did you receive?"]),
  ph("37G", "Pancreatitis", "37. Gastrointestinal", ["What history of pancreatitis are you referring to?", "When did it occur?", "Do you have any current symptoms, treatment, or limitations?"]),
  ph("37H", "Abnormal liver test / liver disease", "37. Gastrointestinal", ["What abnormal liver test or liver disease are you referring to?", "When was it identified?", "Do you require ongoing monitoring or treatment?"]),
  ph("37I", "Irritable bowel syndrome", "37. Gastrointestinal", ["What history of irritable bowel syndrome are you referring to?", "How often do symptoms occur?", "Does it affect attendance or work?"]),
  ph("37J", "Crohn's disease", "37. Gastrointestinal", ["What history of Crohn's disease are you referring to?", "Are you receiving treatment or monitoring?", "Is it current?"]),
];

const genitourinary = [
  ph("38A", "Kidney disease or stone", "38. Genitourinary", ["What kidney disease or stone history are you referring to?", "When did it occur?", "Do you have any current symptoms, treatment, or restrictions?"]),
  ph("38B", "Bladder trouble", "38. Genitourinary", ["What bladder trouble are you referring to?", "Is it current?", "Are you receiving treatment?"]),
  ph("38C", "Blood in urine", "38. Genitourinary", ["What blood in urine history are you referring to?", "When did it occur?", "Has it been medically evaluated?"]),
  ph("38D", "Prostatitis", "38. Genitourinary", ["What history of prostatitis are you referring to?", "Is it current?", "Are you receiving treatment?"]),
  ph("38E", "Menstrual discomfort that kept you from work", "38. Genitourinary", ["What menstrual discomfort kept you from work?", "Is that issue current?", "Does it still affect attendance or performance?"]),
  ph("38F", "Currently pregnant", "38. Genitourinary", ["Are you currently pregnant?", "Are there any provider restrictions, accommodations, or work limitations related to this?"]),
];

const cardiovascular = [
  ph("39A", "Heart attack", "39. Cardiovascular", ["When did the heart attack occur?", "What treatment did you receive?", "Do you have any current restrictions or limitations?"]),
  ph("39B", "Heart failure", "39. Cardiovascular", ["What history of heart failure are you referring to?", "Is it current?", "Are you receiving treatment or monitoring?"]),
  ph("39C", "Palpitation (irregular heartbeat)", "39. Cardiovascular", ["What history of palpitations or irregular heartbeat are you referring to?", "How often does it occur?", "Are you receiving treatment?"]),
  ph("39D", "High blood pressure", "39. Cardiovascular", ["When were you diagnosed with high blood pressure?", "Are you taking medication or receiving treatment?", "Do you know your recent blood pressure reading?"]),
  ph("39E", "Pain or discomfort in chest", "39. Cardiovascular", ["What history of chest pain or discomfort are you referring to?", "How often does it happen?", "Has it been evaluated?"]),
  ph("39F", "Swelling of foot or leg", "39. Cardiovascular", ["What history of swelling of the foot or leg are you referring to?", "Is it current?", "Has a provider evaluated it?"]),
];

const musculoskeletal = [
  ph("40A", "Back trouble / pain", "40. Musculoskeletal", ["What back trouble or back pain are you referring to?", "How often do symptoms occur?", "Does it affect sitting, concentration, or attendance?"]),
  ph("40B", "Neck trouble / pain", "40. Musculoskeletal", ["What neck trouble or neck pain are you referring to?", "Is it current?", "Does it affect workstation tolerance or daily activities?"]),
  ph("40C", "Arthritis / Rheumatism", "40. Musculoskeletal", ["What arthritis or rheumatism history are you referring to?", "What joints are affected?", "Does it limit daily activities or work?"]),
];

const joints = [
  ph("41A", "Shoulder", "41. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["What shoulder injury, surgery, dislocation, pain, or swelling are you referring to?", "Is it current?", "Does it affect daily activities or work?"]),
  ph("41B", "Elbow", "41. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["What elbow injury, surgery, dislocation, pain, or swelling are you referring to?", "Is it current?", "Does it affect daily activities or work?"]),
  ph("41C", "Wrist", "41. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["What wrist injury, surgery, dislocation, pain, or swelling are you referring to?", "Is it current?", "Does it affect typing, writing, daily activities, or work?"]),
  ph("41D", "Fingers / Toes", "41. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["What finger or toe injury, surgery, dislocation, pain, or swelling are you referring to?", "Is it current?", "Does it affect daily activities or work?"]),
  ph("41E", "Hip", "41. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["What hip injury, surgery, dislocation, pain, or swelling are you referring to?", "Is it current?", "Does it affect sitting, standing, or work?"]),
  ph("41F", "Knee", "41. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["What knee injury, surgery, dislocation, pain, or swelling are you referring to?", "Is it current?", "Does it affect walking, standing, or work?"]),
  ph("41G", "Ankle / Foot", "41. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["What ankle or foot injury, surgery, dislocation, pain, or swelling are you referring to?", "Is it current?", "Does it affect walking, standing, or work?"]),
];

const neurological = [
  ph("42A", "Epilepsy", "42. Neurological", ["What history of epilepsy are you referring to?", "When did it occur or when were you diagnosed?", "Are you receiving treatment or medication?", "Do you have any current symptoms or limitations?"]),
  ph("42B", "Convulsion / Seizure", "42. Neurological", ["What history of convulsions or seizures are you referring to?", "When did they occur?", "Are you receiving treatment or medication?"]),
  ph("42C", "Fainting spells / Blackouts", "42. Neurological", ["What history of fainting spells or blackouts are you referring to?", "When did they occur?", "Do you have any current symptoms or limitations?"]),
  ph("42D", "Multiple Sclerosis", "42. Neurological", ["What history of multiple sclerosis are you referring to?", "Is it current?", "Are you receiving treatment or monitoring?"]),
  ph("42E", "Recurrent dizziness", "42. Neurological", ["What history of recurrent dizziness are you referring to?", "How often does it occur?", "Does it affect your daily activities or work?"]),
  ph("42F", "Head injury", "42. Neurological", ["What head injury are you referring to?", "When did it occur?", "Were you treated?", "Do you have any current symptoms or limitations?"]),
  ph("42G", "Loss of consciousness", "42. Neurological", ["What history of loss of consciousness are you referring to?", "When did it occur?", "Was it a one-time or recurrent event?"]),
  ph("42H", "Frequent / recurrent headaches", "42. Neurological", ["How often do the headaches occur?", "How severe are they?", "Do they affect work or concentration?"]),
  ph("42I", "Migraine / Sinus headaches", "42. Neurological", ["How often do the migraine or sinus headaches occur?", "How severe are they?", "Do they affect daily activities or work?"]),
  ph("42J", "Carpal Tunnel Syndrome", "42. Neurological", ["What history of carpal tunnel syndrome are you referring to?", "Is it current?", "Does it affect typing, writing, or work activities?"]),
  ph("42K", "Tremors", "42. Neurological", ["What tremor history are you referring to?", "Is it current?", "Does it affect daily activities or work performance?"]),
  ph("42L", "Meningitis / Encephalitis", "42. Neurological", ["What meningitis or encephalitis history are you referring to?", "When did it occur?", "Do you have any current symptoms or limitations?"]),
  ph("42M", "Numbness of extremities", "42. Neurological", ["Which areas are affected?", "How often does the numbness occur?", "Does it affect work or daily activities?"]),
  ph("42N", "Other neurological condition", "42. Neurological", ["What other neurological condition are you referring to?", "When did it occur or when were you diagnosed?", "Is it current?", "Do you have any limitations or treatment related to it?"]),
];

const miscellaneous = [
  ph("43A", "Diabetes (glucose in urine)", "43. Miscellaneous", ["When were you diagnosed with diabetes?", "Are you receiving treatment?", "Does it affect your daily activities or work?"]),
  ph("43B", "Low blood sugar", "43. Miscellaneous", ["What history of low blood sugar are you referring to?", "Is it current?", "Are you receiving treatment or monitoring?"]),
  ph("43C", "Thyroid trouble", "43. Miscellaneous", ["What thyroid condition are you referring to?", "Is it current?", "Are you receiving treatment or medication?"]),
  ph("43D", "Enlarged glands", "43. Miscellaneous", ["What enlarged glands history are you referring to?", "Has this been medically evaluated?", "Is it still current?"]),
  ph("43E", "Cancer / Leukemia", "43. Miscellaneous", ["What cancer or leukemia history are you referring to?", "When were you diagnosed?", "What treatment did you receive?", "Is it resolved, active, or under surveillance?"]),
  ph("43F", "Non-healing sores", "43. Miscellaneous", ["What non-healing sore are you referring to?", "When did you notice it?", "Has a provider evaluated it?", "Is it still current?"]),
  ph("43G", "Chronic fatigue", "43. Miscellaneous", ["What history of chronic fatigue are you referring to?", "How often does it occur?", "Has it been evaluated?", "Does it affect concentration or work performance?"]),
  ph("43H", "Night sweats", "43. Miscellaneous", ["What history of night sweats are you referring to?", "Is it current?", "Has it been medically evaluated?"]),
  ph("43I", "Undesired weight loss or gain", "43. Miscellaneous", ["What undesired weight loss or gain are you referring to?", "Over what time period did it happen?", "Has it been medically evaluated?"]),
  ph("43J", "Multiple chemical sensitivity", "43. Miscellaneous", ["What history of multiple chemical sensitivity are you referring to?", "What substances are involved?", "Does it affect your work?"]),
  ph("43K", "Recurrent fever in the last year", "43. Miscellaneous", ["What history of recurrent fever in the last year are you referring to?", "How often did it occur?", "Was it medically evaluated?"]),
  ph("43L", "Eczema", "43. Miscellaneous", ["What history of eczema are you referring to?", "Is it current?", "Are you receiving treatment?"]),
  ph("43M", "Sleep apnea", "43. Miscellaneous", ["Were you formally diagnosed with sleep apnea?", "Do you currently have symptoms such as fatigue or concentration issues?", "Do you use treatment such as CPAP?"]),
  ph("43N", "Snoring", "43. Miscellaneous", ["What snoring history are you referring to?", "Is it associated with a diagnosis, treatment, or current daytime symptoms?"]),
  ph("43O", "Sleep problems / disorders", "43. Miscellaneous", ["What sleep problem or disorder are you referring to?", "Is it current?", "Does it affect your concentration, attendance, or work performance?"]),
  ph("43P", "Chronic or frequent cough", "43. Miscellaneous", ["What chronic or frequent cough history are you referring to?", "Is it current?", "Has it been evaluated or treated?"]),
  ph("43Q", "Any other problem or illness not listed that may affect job performance", "43. Miscellaneous", ["What other problem or illness are you referring to?", "When did it occur?", "Is it current?", "Does it affect your ability to perform dispatcher duties?"]),
];

export const postPublicSafetyDispatcherDefinition = form(
  "post-2-264-public-safety-dispatcher",
  "POST 2-264 — Medical History Statement — Public Safety Dispatcher",
  "Adaptive Public Safety Dispatcher medical-history interview preserving POST 2-264 source numbering and the recovered dispatcher-specific clarification bank.",
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
