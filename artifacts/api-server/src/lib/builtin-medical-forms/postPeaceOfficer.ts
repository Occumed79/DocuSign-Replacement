import { form, history, q, select, text } from "./definition-helpers";

const ph = (key: string, label: string, section: string, prompts: string[]) =>
  history(key, `${key} — ${label}`, section, prompts, { allowUnsure: true });

const item = (key: string, label: string, prompts: string[]) => ph(key, label, "Section 3 — Medical History", prompts);

const general = [
  item("11", "Have you ever worked as a peace officer before?", [
    "When and where did you work as a peace officer?",
    "Did you have any medical, psychological, or work restrictions in that role?",
  ]),
  item("12", "Have you ever failed to complete a peace officer academy training program?", [
    "When did this occur?",
    "Was it related to a medical, psychological, or other issue?",
    "Is that issue still current?",
  ]),
  item("13", "Have you ever failed a pre-placement medical or psychological examination?", [
    "When did this occur?",
    "Was it a medical exam, psychological exam, or both?",
    "What issue led to that result?",
    "Is that issue still current?",
  ]),
  item("14", "Have you ever been refused employment or been unable to hold a job because of a physical, psychological, or other medically-related reason?", [
    "What issue was involved?",
    "When did this occur?",
    "Is that issue still current?",
    "Do you have any current work restrictions or limitations related to it?",
  ]),
  item("15", "Have you ever been terminated, resigned, or had to change job positions due to a physical, psychological, or medically-related reason?", [
    "What issue was involved?",
    "When did this occur?",
    "Is that issue still current?",
  ]),
  item("16", "Are you currently under a health care provider's care for any medical condition?", [
    "What condition is being treated?",
    "How often are you seen?",
    "What treatment or medication are you receiving?",
    "Does the condition affect your ability to safely perform peace officer duties?",
  ]),
  item("17", "Has your driver's license ever been suspended or revoked due to medical reasons?", [
    "When did this occur?",
    "What medical reason was involved?",
    "Has the issue been resolved?",
    "Do you have any current driving restrictions related to it?",
  ]),
  item("18", "Do you have any physical limitations?", [
    "Please describe the limitation.",
    "Does it affect your ability to run, lift, grapple, drive, wear gear, or perform peace officer duties?",
    "Has a provider recommended any restrictions?",
  ]),
  item("19", "Do you need any reasonable accommodation to assist you in performing required job tasks?", [
    "What accommodation do you need?",
    "What condition is it related to?",
    "Has a provider recommended it?",
  ]),
  item("20", "Have you ever been absent from work due to job stress?", [
    "When did this occur?",
    "What symptoms or condition were involved?",
    "Is the issue still current?",
    "Are you receiving treatment or counseling?",
  ]),
  item("21", "Have you missed more than five days from work in the past 12 months due to medically-related reasons?", [
    "What condition caused the absences?",
    "How many days were missed?",
    "Is the condition still affecting your attendance or reliability?",
  ]),
  item("22", "Have you ever been absent from work because of back/neck pain or problems?", [
    "What condition was involved?",
    "When did this occur?",
    "Does it still affect you now?",
  ]),
  item("23", "Have you ever seen a doctor for back/neck pain or problems?", [
    "What diagnosis was made?",
    "What treatment was provided?",
    "Do you have any current symptoms or limitations?",
  ]),
  item("24", "Do you currently have a cold or cough, or have you had either in the past two weeks?", [
    "What symptoms are you having?",
    "When did they begin?",
    "Do they currently affect your ability to work safely?",
  ]),
  item("25", "In the past year, have you had a change in the size or color of a mole or a sore that would not heal?", [
    "When did you notice it?",
    "Has a provider evaluated it?",
    "Is it still present?",
  ]),
  item("26", "Have you ever coughed, wheezed, or had chest discomfort during or after exercise?", [
    "How often does this happen?",
    "What triggers it?",
    "Have you been evaluated or treated?",
    "Does it affect exertion or training?",
  ]),
  item("27", "Have you ever taken medication to prevent wheezing or shortness of breath during exercise?", [
    "What medication did you use?",
    "What condition was it prescribed for?",
    "When did you last need it?",
    "Do you currently have exercise-related breathing symptoms?",
  ]),
  item("28", "Do you ever wake up short of breath?", [
    "How often does this happen?",
    "Has it been evaluated?",
    "Do you have a related diagnosis such as sleep apnea or another respiratory condition?",
  ]),
  item("29", "Have you ever had any breathing problems using a gas mask? (Check No if you have never used a gas mask.)", [
    "What problem did you have?",
    "When did it occur?",
    "Does it still affect your ability to safely use respirators or tactical equipment?",
  ]),
  item("30", "Do you currently smoke cigarettes?", [
    "How many packs per day do you smoke?",
    "For how many years have you smoked?",
    "Have you had any medical problems related to smoking that affect work performance?",
  ]),
  item("31", "Are you an ex-smoker?", [
    "How many years did you smoke?",
    "How much did you smoke?",
    "When did you quit?",
    "Have you had any lasting medical effects from smoking?",
  ]),
  item("32", "Have you used chewing tobacco or smoked cigars/pipes in the last 15 years?", [
    "What type did you use?",
    "How often did or do you use it?",
    "Have you had any medical problems related to that use?",
  ]),
  item("33", "Have you ever had a positive drug or alcohol test?", [
    "When did it occur?",
    "What substance was involved?",
    "Did you receive any treatment or counseling afterward?",
  ]),
  item("34", "Are you now or have you ever been enrolled in a drug or alcohol rehabilitation program?", [
    "When were you enrolled?",
    "What treatment did you receive?",
    "Is any treatment ongoing?",
  ]),
  text("35", "35 — Per week, enter bottles/cans of beer, glasses of wine, and glasses of hard liquor", "Section 3 — Medical History", false),
  item("36", "Has anyone ever been concerned about your drinking or suggested that you cut down?", [
    "When did this occur?",
    "Did it lead to any treatment, counseling, or change in alcohol use?",
  ]),
  item("37", "Have you ever been convicted of driving under the influence (DUI)?", [
    "When did this occur?",
    "Were any treatment, classes, or restrictions required?",
  ]),
  item("38", "Have you ever felt bad about your drinking?", [
    "Is this still a current concern?",
    "Has it affected your daily life or work?",
  ]),
  item("39", "Have you ever had a drink first thing in the morning to steady your nerves or get rid of a hangover?", [
    "When did this occur?",
    "Was it recurring?",
    "Did you receive any treatment or counseling?",
  ]),
  select("40", "40 — Handedness", "Section 3 — Medical History", ["Right-handed", "Left-handed"], false),
  item("41", "Have you ever been hospitalized overnight (except for pregnancy)?", [
    "When were you hospitalized?",
    "What condition or event was involved?",
    "Do you have any current symptoms or limitations related to it?",
  ]),
  item("42", "Have you had any surgical operations?", [
    "What surgery did you have?",
    "When was it performed and why was it needed?",
    "Do you have any current restrictions, limitations, or ongoing treatment related to it?",
  ]),
  item("43", "Have you sustained any disabling illnesses or medical conditions within the past 5 years?", [
    "What condition was involved?",
    "When did it occur?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),
  item("44", "Have you been exposed to loud noise today?", [
    "Were you wearing hearing protection?",
    "Do you currently have any hearing-related symptoms?",
  ]),
  item("45", "Do you occasionally use, or are you currently taking, any prescription or over-the-counter medications?", [
    "What medication are you taking?",
    "What condition is it treating?",
    "What dose and frequency do you take?",
    "Do you have any side effects?",
  ]),
  item("46", "Have you taken any medication within the past 12 months for any reason?", [
    "What medication did you take?",
    "What condition was it for?",
    "Was it temporary or ongoing?",
    "Did you have any side effects?",
  ]),
  item("47", "Are you now receiving or have you ever received Workers Compensation?", [
    "What condition or injury was associated with the claim?",
    "Do you have any current symptoms, restrictions, or limitations related to it?",
  ]),
  item("48", "Have you been rejected for, or discharged from the military because of physical, mental, or other medically-related reasons?", [
    "What issue was involved?",
    "When did this occur?",
    "Is it still current?",
  ]),
  item("49", "If you served in the military and were discharged, did you ever apply to the VA for service-connected disability for medical injuries?", [
    "What condition or conditions were involved?",
    "What percentage was assigned, if known?",
    "Do you have any current symptoms, restrictions, or treatment related to those conditions?",
  ]),
  text("50", "50 — Describe anything else important in evaluating your medical suitability, including any condition not specifically referred to above", "Section 3 — Medical History", false),
];

const eyeEnt = [
  ph("51A", "Eye surgery", "51. Eye / Ear / Nose / Throat", ["What eye surgery did you have?", "When was it performed?", "Do you have any current vision-related symptoms or limitations?"]),
  ph("51B", "Refractive surgery (e.g., LASIK, PRK)", "51. Eye / Ear / Nose / Throat", ["What refractive surgery did you have?", "When was it done?", "Are you fully recovered?", "Do you have any current visual symptoms or limitations?"]),
  ph("51C", "Orthokeratology / Retainer lenses", "51. Eye / Ear / Nose / Throat", ["What orthokeratology or retainer lens use are you referring to?", "Is this current?", "Does it affect your vision or work tasks?"]),
  ph("51D", "Vision therapy", "51. Eye / Ear / Nose / Throat", ["What vision therapy did you receive?", "When was it done?", "Is any treatment ongoing?"]),
  ph("51E", "Vision impairment", "51. Eye / Ear / Nose / Throat", ["What vision impairment are you referring to?", "Does it affect your ability to safely drive, use a firearm, observe detail, or perform field duties?"]),
  ph("51F", "Need to wear corrective lenses", "51. Eye / Ear / Nose / Throat", ["Are they for reading, distance, or both?", "Do they fully correct your vision for peace officer duties?"]),
  ph("51G", "Cataracts", "51. Eye / Ear / Nose / Throat", ["When was it diagnosed or treated?", "Do you have any current visual limitations?"]),
  ph("51H", "Glaucoma", "51. Eye / Ear / Nose / Throat", ["When were you diagnosed?", "Are you receiving treatment or monitoring?", "Does it currently affect your vision or field safety?"]),
  ph("51I", "Blurred or double vision", "51. Eye / Ear / Nose / Throat", ["What blurred or double vision are you referring to?", "Does it affect driving, weapon handling, or situational awareness?"]),
  ph("51J", "Abnormal color vision test", "51. Eye / Ear / Nose / Throat", ["What abnormal color vision finding are you referring to?", "Does it currently affect your duties?"]),
  ph("51K", "Sinus trouble", "51. Eye / Ear / Nose / Throat", ["What sinus trouble are you referring to?", "Does it affect breathing, concentration, or work?", "Are you receiving treatment?"]),
  ph("51L", "Loss of smell", "51. Eye / Ear / Nose / Throat", ["When did the loss of smell occur?", "Does it affect work or safety awareness?"]),
  ph("51M", "Allergy / Hay fever", "51. Eye / Ear / Nose / Throat", ["What allergy symptoms do you have?", "Are you taking medication or receiving treatment?", "Does it affect work?"]),
  ph("51N", "Ruptured ear drum", "51. Eye / Ear / Nose / Throat", ["When did the ruptured ear drum occur?", "Did you receive treatment?", "Do you have any current hearing issues, dizziness, infections, or limitations?"]),
  ph("51O", "Ringing or buzzing in ears", "51. Eye / Ear / Nose / Throat", ["How often does it occur?", "Does it affect concentration, communication, or field performance?"]),
  ph("51P", "Hearing trouble", "51. Eye / Ear / Nose / Throat", ["What hearing trouble are you referring to?", "Do you use any device or treatment?", "Does it affect communication or situational awareness?"]),
  ph("51Q", "Ear surgery", "51. Eye / Ear / Nose / Throat", ["What ear surgery did you have?", "When was it performed?", "Do you have any current symptoms or restrictions?"]),
  ph("51R", "Earache", "51. Eye / Ear / Nose / Throat", ["What earache history are you referring to?", "Are you receiving treatment?"]),
  ph("51S", "Abnormal hearing test", "51. Eye / Ear / Nose / Throat", ["When did the abnormal hearing test occur?", "Does it affect communication or safe field performance now?"]),
];

const respiratory = [
  ph("52A", "Asthma", "52. Respiratory", ["When was your last asthma episode?", "What triggers symptoms?", "Do you use an inhaler or medication?", "Does it affect exertion, running, defensive tactics, or respirator use?"]),
  ph("52B", "Shortness of breath", "52. Respiratory", ["How often does it occur?", "What triggers it?", "Does it affect exertion or work?", "Have you been evaluated or treated?"]),
  ph("52C", "Chronic or frequent cough", "52. Respiratory", ["Have you been evaluated or treated for it?", "Does it affect your work?"]),
  ph("52D", "Positive TB skin test", "52. Respiratory", ["When did that occur?", "Did you receive treatment?", "Do you have any current symptoms or restrictions related to it?"]),
  ph("52E", "Coughed up blood", "52. Respiratory", ["When did this occur?", "What evaluation or treatment did you receive?", "Do you have any current symptoms?"]),
  ph("52F", "Pneumothorax (collapsed lung)", "52. Respiratory", ["When did the pneumothorax occur?", "Did you receive treatment or hospitalization?", "Have you fully recovered?", "Do you have any current breathing limitations?"]),
  ph("52G", "Chest tightness", "52. Respiratory", ["What triggers it?", "Has it been evaluated or treated?", "Does it affect exertion or work?"]),
  ph("52H", "Wheezing", "52. Respiratory", ["How often does it occur?", "What triggers it?", "Are you receiving treatment?"]),
  ph("52I", "Blood clot in lung", "52. Respiratory", ["When did it occur?", "What treatment did you receive?", "Do you have any current restrictions or symptoms?"]),
];

const gi = [
  ph("53A", "Ulcer / Stomach trouble", "53. Gastrointestinal", ["What condition are you referring to?", "When did it occur?", "What treatment did you receive?", "Do you have current symptoms?"]),
  ph("53B", "Vomited blood", "53. Gastrointestinal", ["When did it occur?", "What evaluation or treatment did you receive?"]),
  ph("53C", "Persistent diarrhea", "53. Gastrointestinal", ["How often does it occur?", "Does it affect attendance or daily activities?", "Have you been evaluated or treated?"]),
  ph("53D", "Colitis", "53. Gastrointestinal", ["Are you receiving treatment or monitoring?", "Does it affect work or daily activities?"]),
  ph("53E", "Recurrent hemorrhoids", "53. Gastrointestinal", ["Are you receiving treatment?", "Does it affect daily activities or work?"]),
  ph("53F", "Gall bladder trouble", "53. Gastrointestinal", ["When did it occur?", "Did you receive treatment or surgery?", "Do you have current symptoms?"]),
  ph("53G", "Hepatitis", "53. Gastrointestinal", ["What type of hepatitis are you referring to?", "When was it diagnosed?", "What treatment did you receive?", "Do you require ongoing monitoring?"]),
  ph("53H", "Mucous in stool", "53. Gastrointestinal", ["When did it occur?", "Has it been medically evaluated?"]),
  ph("53I", "Black/bloody bowel movement", "53. Gastrointestinal", ["When did it occur?", "What evaluation or treatment did you receive?"]),
  ph("53J", "Pancreatitis", "53. Gastrointestinal", ["When did it occur?", "Do you have any current symptoms, treatment, or limitations?"]),
  ph("53K", "Abnormal liver test / Liver disease", "53. Gastrointestinal", ["What abnormal liver test or liver disease are you referring to?", "When was it identified?", "Do you require ongoing monitoring or treatment?"]),
  ph("53L", "Hernia", "53. Gastrointestinal", ["What type of hernia are you referring to?", "Was it repaired or treated?", "Do you have current symptoms or restrictions?"]),
  ph("53M", "Irritable Bowel Syndrome", "53. Gastrointestinal", ["How often do symptoms occur?", "Are you receiving treatment?", "Does it affect attendance or work?"]),
  ph("53N", "Crohn's disease", "53. Gastrointestinal", ["Are you receiving treatment or monitoring?", "Does it affect work or daily activities?"]),
];

const gu = [
  ph("54A", "Kidney disease or stone", "54. Genitourinary", ["What kidney disease or stone history are you referring to?", "When did it occur?", "Do you have any current symptoms, treatment, or restrictions?"]),
  ph("54B", "Bladder trouble", "54. Genitourinary", ["What bladder trouble are you referring to?", "Are you receiving treatment?"]),
  ph("54C", "Difficulty urinating", "54. Genitourinary", ["What difficulty urinating are you referring to?", "Has it been medically evaluated?"]),
  ph("54D", "Blood in urine", "54. Genitourinary", ["When did it occur?", "Has it been medically evaluated?"]),
  ph("54E", "Prostatitis", "54. Genitourinary", ["When were you diagnosed?", "Are you receiving treatment?"]),
  ph("54F", "Irregular vaginal bleeding", "54. Genitourinary", ["What irregular vaginal bleeding history are you referring to?", "Are you under treatment or evaluation?"]),
  ph("54G", "Menstrual discomfort that kept you from work", "54. Genitourinary", ["What menstrual discomfort kept you from work?", "Does it still affect attendance or performance?"]),
  ph("54H", "Currently pregnant", "54. Genitourinary", ["Are there any provider restrictions, accommodations, or work limitations related to this?"]),
];

const cardio = [
  ph("55A", "Heart attack", "55. Cardiovascular", ["When did it occur?", "What treatment did you receive?", "Do you have current restrictions or limitations?"]),
  ph("55B", "Heart murmur", "55. Cardiovascular", ["When was it identified?", "Does it cause symptoms or limitations?", "Are you under follow-up?"]),
  ph("55C", "Heart failure", "55. Cardiovascular", ["Are you receiving treatment or monitoring?", "Do you have current symptoms or exercise limitations?"]),
  ph("55D", "Heart valve abnormality", "55. Cardiovascular", ["What valve abnormality are you referring to?", "Are you under treatment or specialist care?", "Do you have symptoms or restrictions?"]),
  ph("55E", "Enlarged heart", "55. Cardiovascular", ["When was it identified?", "Do you have current symptoms or limitations?", "Are you under follow-up?"]),
  ph("55F", "Palpitation (irregular heartbeat)", "55. Cardiovascular", ["How often does it occur?", "Are you receiving treatment?", "Do you have dizziness, fainting, or exercise intolerance?"]),
  ph("55G", "High blood pressure", "55. Cardiovascular", ["When were you diagnosed?", "Are you taking medication?", "Do you know your recent reading?", "Does it cause symptoms or restrictions?"]),
  ph("55H", "Pain or discomfort in chest", "55. Cardiovascular", ["How often does it happen?", "What triggers it?", "Has it been evaluated?", "Does it limit exertion or work?"]),
  ph("55I", "Rheumatic fever", "55. Cardiovascular", ["When did it occur?", "Do you have any lasting symptoms or limitations?"]),
  ph("55J", "Swelling of foot or leg", "55. Cardiovascular", ["Is it current?", "Has a provider evaluated it?", "Does it limit activity?"]),
  ph("55K", "Painful varicose veins", "55. Cardiovascular", ["Do they cause current symptoms or limitations?", "Are you receiving treatment?"]),
];

const musculoskeletal = [
  ph("56A", "Fractured/broken bone", "56. Musculoskeletal", ["Which bone was involved?", "When did it occur?", "Have you fully recovered?", "Do you have current limitations?"]),
  ph("56B", "Back trouble/pain", "56. Musculoskeletal", ["How often do symptoms occur?", "Does it affect running, lifting, or duty performance?", "Are you receiving treatment?"]),
  ph("56C", "Neck trouble/pain", "56. Musculoskeletal", ["How often do symptoms occur?", "Does it affect physical agility or duty performance?", "Are you receiving treatment?"]),
  ph("56D", "Leg/shin pain", "56. Musculoskeletal", ["What leg or shin pain are you referring to?", "Does it affect running, standing, or work?"]),
  ph("56E", "Arthroscopy", "56. Musculoskeletal", ["What arthroscopy did you have?", "When and for what reason?", "Have you fully recovered?"]),
  ph("56F", "Arthritis / Rheumatism", "56. Musculoskeletal", ["What joints are affected?", "Are you receiving treatment?", "Does it affect physical peace officer duties?"]),
  ph("57A", "Shoulder — injury/surgery/dislocation/pain/swelling", "57. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["Which shoulder is affected?", "Does it affect lifting, grappling, or defensive tactics?", "What treatment have you received?"]),
  ph("57B", "Elbow — injury/surgery/dislocation/pain/swelling", "57. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["Which elbow is affected?", "Does it affect weapon handling or defensive tactics?", "What treatment have you received?"]),
  ph("57C", "Wrist — injury/surgery/dislocation/pain/swelling", "57. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["Which wrist is affected?", "Does it affect firearm use, hand control, or daily tasks?", "What treatment have you received?"]),
  ph("57D", "Fingers/toes — injury/surgery/dislocation/pain/swelling", "57. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["What finger or toe is affected?", "Does it affect dexterity or work activities?", "What treatment have you received?"]),
  ph("57E", "Hip — injury/surgery/dislocation/pain/swelling", "57. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["Which hip is affected?", "Does it affect running, climbing, or defensive tactics?", "What treatment have you received?"]),
  ph("57F", "Knee — injury/surgery/dislocation/pain/swelling", "57. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["Which knee is affected?", "Does it affect running, kneeling, climbing, or work?", "What treatment have you received?"]),
  ph("57G", "Ankle/foot — injury/surgery/dislocation/pain/swelling", "57. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["Which ankle or foot is affected?", "Does it affect walking, running, or physical job performance?", "What treatment have you received?"]),
  ph("57H", "Other joint pain or swelling", "57. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["What body area is affected?", "Does it limit job performance?", "What treatment have you received?"]),
];

const neuro = [
  ph("58A", "Epilepsy", "58. Neurological", ["When were you diagnosed?", "Are you receiving treatment or medication?", "Do you have current symptoms or limitations?"]),
  ph("58B", "Convulsion / Seizure", "58. Neurological", ["When did they occur?", "How often?", "Are you receiving treatment or medication?"]),
  ph("58C", "Fainting spells / Blackouts", "58. Neurological", ["When did they occur?", "Are they recurrent?", "Have you been evaluated or treated?", "Do you have current limitations?"]),
  ph("58D", "Recurrent dizziness", "58. Neurological", ["How often does it occur?", "Does it affect daily activities or safe field performance?", "Have you been evaluated or treated?"]),
  ph("58E", "Carpal Tunnel Syndrome", "58. Neurological", ["Which hand or wrist is affected?", "Does it affect weapon handling, writing, or other job functions?", "What treatment have you received?"]),
  ph("58F", "Head injury", "58. Neurological", ["When did it occur?", "Were you treated?", "Do you have current symptoms or limitations?"]),
  ph("58G", "Loss of consciousness", "58. Neurological", ["When did it occur?", "Was it one-time or recurrent?", "Were you evaluated or treated?"]),
  ph("58H", "Frequent/recurrent headaches", "58. Neurological", ["How often do they occur?", "How severe are they?", "Do they affect work?", "How are they treated?"]),
  ph("58I", "Migraine/sinus headaches", "58. Neurological", ["How often do they occur?", "How severe are they?", "Do they affect daily activities or work?", "How are they treated?"]),
  ph("58J", "Multiple Sclerosis", "58. Neurological", ["When were you diagnosed?", "Are you receiving treatment or monitoring?", "Do you have current limitations?"]),
  ph("58K", "Skull defect", "58. Neurological", ["What skull defect are you referring to?", "When did it occur?", "Does it affect safety or ability to work?"]),
  ph("58L", "Tremors", "58. Neurological", ["What tremor history are you referring to?", "Does it affect daily activities or work performance?"]),
  ph("58M", "Meningitis / Encephalitis", "58. Neurological", ["When did it occur?", "Do you have any current symptoms or limitations?"]),
  ph("58N", "Numbness of extremities", "58. Neurological", ["Which areas are affected?", "How often does it happen?", "Does it affect work or daily activities?"]),
  ph("58O", "Other neurological condition", "58. Neurological", ["What condition are you referring to?", "When were you diagnosed?", "Are you receiving treatment?", "Do you have current limitations?"]),
];

const misc = [
  ph("59A", "Diabetes", "59. Miscellaneous", ["When were you diagnosed?", "What treatment are you receiving?", "Do you know your recent control/A1C?", "Does it affect peace officer duties?"]),
  ph("59B", "Low blood sugar", "59. Miscellaneous", ["How often does it occur?", "Are you receiving treatment or monitoring?", "Does it affect work or safety?"]),
  ph("59C", "Thyroid trouble", "59. Miscellaneous", ["What thyroid condition are you referring to?", "Are you receiving treatment or medication?", "Do you have current symptoms?"]),
  ph("59D", "Bleeding tendencies", "59. Miscellaneous", ["What bleeding tendency are you referring to?", "Has it been medically evaluated?", "Does it affect safety or duty performance?"]),
  ph("59E", "Anemia", "59. Miscellaneous", ["When were you diagnosed?", "Are you receiving treatment?", "Does it affect endurance or work performance?"]),
  ph("59F", "Enlarged glands", "59. Miscellaneous", ["Has this been medically evaluated?", "Is it still current?"]),
  ph("59G", "Cyst / Tumor", "59. Miscellaneous", ["What cyst or tumor history are you referring to?", "When was it found?", "Was it treated?", "Is follow-up ongoing?"]),
  ph("59H", "Skin problems / Rashes", "59. Miscellaneous", ["What skin problem or rash are you referring to?", "Does it affect daily activities or work?", "Are you receiving treatment?"]),
  ph("59I", "Cancer / Leukemia", "59. Miscellaneous", ["What cancer or leukemia history are you referring to?", "When were you diagnosed?", "What treatment did you receive?", "Is it resolved, active, or under surveillance?"]),
  ph("59J", "Wool allergy", "59. Miscellaneous", ["What reaction do you have?", "Does it affect daily life or work?", "What treatment or precautions do you use?"]),
  ph("59K", "Non-healing sores", "59. Miscellaneous", ["When did you notice the sore?", "Has a provider evaluated it?", "Is it still current?"]),
  ph("59L", "Chronic fatigue", "59. Miscellaneous", ["How often does it occur?", "Has it been evaluated?", "Does it affect alertness or work performance?"]),
  ph("59M", "Night sweats", "59. Miscellaneous", ["How often do they occur?", "Have they been medically evaluated?"]),
  ph("59N", "Undesired weight loss or gain", "59. Miscellaneous", ["How much weight changed?", "Over what time period?", "Has it been medically evaluated?"]),
  ph("59O", "Heat stress", "59. Miscellaneous", ["When did it occur?", "Do you have current restrictions or sensitivity to heat?"]),
  ph("59P", "Multiple chemical sensitivity", "59. Miscellaneous", ["What substances are involved?", "What symptoms occur?", "Does it affect work or PPE use?"]),
  ph("59Q", "Recurrent fever in the last year", "59. Miscellaneous", ["How often did it occur?", "Was it medically evaluated?", "Is there a known cause?"]),
  ph("59R", "Eczema", "59. Miscellaneous", ["What symptoms do you have?", "Are you receiving treatment?", "Does it affect work?"]),
  ph("59S", "Claustrophobia", "59. Miscellaneous", ["Does it affect your ability to wear gear, enter confined spaces, or perform duties?", "Have you received treatment or counseling?"]),
  ph("59T", "Sleep apnea", "59. Miscellaneous", ["Were you formally diagnosed?", "Do you use CPAP or other treatment?", "Do you have fatigue or concentration issues?", "Does it affect alertness or duty performance?"]),
  ph("59U", "Snoring", "59. Miscellaneous", ["Is it associated with a diagnosis, treatment, or current daytime symptoms?"]),
  ph("59V", "Sleep problems/disorders", "59. Miscellaneous", ["What sleep problem or disorder are you referring to?", "Does it affect concentration, alertness, attendance, or work performance?", "Are you receiving treatment?"]),
  ph("59W", "Any other problem or illness not listed that may affect job performance", "59. Miscellaneous", ["What problem or illness are you referring to?", "When did it occur or when were you diagnosed?", "Are you receiving treatment?", "Does it affect safe peace officer duties?"]),
  text("60", "60 — Explain any medical conditions marked Yes or ? and reference the corresponding item number and letter", "Section 4 — Medical Conditions", false),
];

export const postPeaceOfficerDefinition = form(
  "post-2-252-peace-officer-medical-history",
  "POST 2-252 — Medical History Statement — Peace Officer",
  "Adaptive California POST Peace Officer medical history preserving source numbering, Yes/No/? responses, and safety-sensitive condition follow-ups.",
  "California POST 2-252 (Rev 02/2013)",
  [
    text("1", "1 — Candidate's name (Last, First, Middle)", "Section 1 — Candidate Identification", false),
    text("2", "2 — Social Security Number (last 4 digits)", "Section 1 — Candidate Identification", false),
    text("3", "3 — Birthdate", "Section 1 — Candidate Identification", false),
    text("4", "4 — Address where you can be contacted", "Section 1 — Candidate Identification", false),
    text("5", "5 — City", "Section 1 — Candidate Identification", false),
    text("6", "6 — State / ZIP", "Section 1 — Candidate Identification", false),
    text("7", "7 — Phone numbers where you can be reached", "Section 1 — Candidate Identification", false),
    text("8", "8 — Email", "Section 1 — Candidate Identification", false),
    text("9", "9 — Current and previous jobs held in the last 5 years, including military service", "Section 2 — Job History and Physical Activity", false),
    text("10", "10 — Typical physical activity, including at work; frequency and duration", "Section 2 — Job History and Physical Activity", false),
    ...general,
    ...eyeEnt,
    ...respiratory,
    ...gi,
    ...gu,
    ...cardio,
    ...musculoskeletal,
    ...neuro,
    ...misc,
  ],
);
