import { civilianHistory, form, select, text } from "./definition-helpers";

const ph = (key: string, label: string, section: string, prompts: string[]) =>
  civilianHistory(key, `${key} — ${label}`, section, prompts, { allowUnsure: true });

const item = (key: string, label: string, prompts: string[] = []) =>
  ph(key, label, "Section 3 — Medical History", prompts);

const general = [
  item("11", "Have you ever worked as a peace officer before?"),
  item("12", "Have you ever failed to complete a peace officer academy training program?", [
    "What circumstances led to the academy training program not being completed?",
  ]),
  item("13", "Have you ever failed a pre-placement medical or psychological examination?", [
    "What medical or psychological issue was identified during that examination, and what is its current status?",
  ]),
  item("14", "Have you ever been refused employment or been unable to hold a job because of a physical, psychological, or other medically-related reason?", [
    "What medical or psychological issue was involved, and what is its current status?",
  ]),
  item("15", "Have you ever been terminated, resigned, or had to change job positions due to a physical, psychological, or medically-related reason?", [
    "What medical or psychological issue was involved, and what is its current status?",
  ]),
  item("16", "Are you currently under a health care provider's care for any medical condition?", [
    "What condition is currently being followed, and what care is in place?",
  ]),
  item("17", "Has your driver's license ever been suspended or revoked due to medical reasons?", [
    "What medical issue was associated with the license action, and what is its current status?",
  ]),
  item("18", "Do you have any physical limitations?", [
    "What physical limitation are you reporting, and what is its current status?",
  ]),
  item("19", "Do you need any reasonable accommodation to assist you in performing required job tasks?", [
    "What accommodation is needed, and what medical condition is it related to?",
  ]),
  item("20", "Have you ever been absent from work due to job stress?", [
    "What medical or psychological condition was associated with the absence, and what is its current status?",
  ]),
  item("21", "Have you missed more than five days from work in the past 12 months due to medically-related reasons?", [
    "What medical condition or conditions were associated with the absences, and what is their current status?",
  ]),
  item("22", "Have you ever been absent from work because of back/neck pain or problems?", [
    "What back or neck problem was associated with the absence, and what is its current status?",
  ]),
  item("23", "Have you ever seen a doctor for back/neck pain or problems?", [
    "What back or neck problem was evaluated, and what is its current status?",
    "What treatment or medical follow-up occurred?",
  ]),
  item("24", "Do you currently have a cold or cough, or have you had either in the past two weeks?", [
    "What cold or cough symptoms are you reporting, and what is their current status?",
  ]),
  item("25", "In the past year, have you had a change in the size or color of a mole or a sore that would not heal?", [
    "What change or non-healing sore are you reporting, and what is its current status?",
    "What medical evaluation or treatment has occurred?",
  ]),
  item("26", "Have you ever coughed, wheezed, or had chest discomfort during or after exercise?", [
    "What is the current pattern of the coughing, wheezing, or chest discomfort you reported with exercise?",
    "What medical evaluation or treatment have you had for it?",
  ]),
  item("27", "Have you ever taken medication to prevent wheezing or shortness of breath during exercise?", [
    "What breathing condition or symptoms were being treated, and what is their current status?",
    "How are those symptoms currently being managed?",
  ]),
  item("28", "Do you ever wake up short of breath?", [
    "What is the current pattern of the shortness of breath during sleep that you reported?",
    "What medical evaluation or treatment have you had for it?",
  ]),
  item("29", "Have you ever had any breathing problems using a gas mask? (Check No if you have never used a gas mask.)", [
    "What breathing problem occurred while using the gas mask, and what is its current status?",
    "What medical evaluation or treatment occurred for it?",
  ]),
  item("30", "Do you currently smoke cigarettes?", [
    "What is your current pattern of cigarette use?",
  ]),
  item("31", "Are you an ex-smoker?", [
    "What was your smoking history, including when you stopped?",
  ]),
  item("32", "Have you used chewing tobacco or smoked cigars/pipes in the last 15 years?", [
    "What tobacco use are you reporting, and what is its current status?",
  ]),
  item("33", "Have you ever had a positive drug or alcohol test?", [
    "What testing event are you reporting, including when it occurred and what substance was involved?",
  ]),
  item("34", "Are you now or have you ever been enrolled in a drug or alcohol rehabilitation program?", [
    "What treatment program was involved, and what is its current status?",
  ]),
  text("35", "35 — Per week, enter bottles/cans of beer, glasses of wine, and glasses of hard liquor", "Section 3 — Medical History", false),
  item("36", "Has anyone ever been concerned about your drinking or suggested that you cut down?", [
    "What occurred when the concern was raised, and what follow-up or change resulted?",
  ]),
  item("37", "Have you ever been convicted of driving under the influence (DUI)?", [
    "When did the DUI occur, and what requirements or follow-up resulted?",
  ]),
  item("38", "Have you ever felt bad about your drinking?"),
  item("39", "Have you ever had a drink first thing in the morning to steady your nerves or get rid of a hangover?", [
    "When did the morning drinking you reported occur, and what is its current status?",
  ]),
  select("40", "40 — Handedness", "Section 3 — Medical History", ["Right-handed", "Left-handed"], false),
  item("41", "Have you ever been hospitalized overnight (except for pregnancy)?", [
    "What was the reason for the hospitalization, and when did it occur?",
    "What is the current status of the condition or event that led to it?",
  ]),
  item("42", "Have you had any surgical operations?", [
    "What surgery did you have, and what medical condition or injury was it related to?",
    "What is the current status of that condition or injury?",
  ]),
  item("43", "Have you sustained any disabling illnesses or medical conditions within the past 5 years?", [
    "What illness or medical condition are you reporting, and what is its current status?",
  ]),
  item("44", "Have you been exposed to loud noise today?", [
    "What loud-noise exposure occurred today, and what hearing protection was used?",
  ]),
  item("45", "Do you occasionally use, or are you currently taking, any prescription or over-the-counter medications?", [
    "What medications are you currently taking, and what is each being used for?",
  ]),
  item("46", "Have you taken any medication within the past 12 months for any reason?", [
    "What medications did you take, and what was each being used for?",
  ]),
  item("47", "Are you now receiving or have you ever received Workers Compensation?", [
    "What medical condition or injury is associated with the Workers Compensation history you reported?",
    "What is the current medical status of that condition or injury?",
  ]),
  item("48", "Have you been rejected for, or discharged from the military because of physical, mental, or other medically-related reasons?", [
    "What medical or psychological issue was associated with the military action, and what is its current status?",
  ]),
  item("49", "If you served in the military and were discharged, did you ever apply to the VA for service-connected disability for medical injuries?", [
    "What medical condition or conditions are associated with the service-connected disability history you reported?",
    "What is the current medical status of those conditions?",
  ]),
  text("50", "50 — Describe anything else important in evaluating your medical suitability, including any condition not specifically referred to above", "Section 3 — Medical History", false),
];

const eyeEnt = [
  ph("51A", "Eye surgery", "51. Eye / Ear / Nose / Throat", ["What eye surgery did you have, and what is the current status of the condition it addressed?"]),
  ph("51B", "Refractive surgery (e.g., LASIK, PRK)", "51. Eye / Ear / Nose / Throat", ["What refractive surgery did you have, and what is the current status of your vision following the procedure?"]),
  ph("51C", "Orthokeratology / Retainer lenses", "51. Eye / Ear / Nose / Throat", ["What orthokeratology or retainer-lens use are you reporting, and what is its current status?"]),
  ph("51D", "Vision therapy", "51. Eye / Ear / Nose / Throat", ["What condition was the vision therapy intended to address, and what is its current status?"]),
  ph("51E", "Vision impairment", "51. Eye / Ear / Nose / Throat", ["What vision impairment was identified, and what is its current status?", "How is the vision impairment currently corrected, treated, or monitored?"]),
  ph("51F", "Need to wear corrective lenses", "51. Eye / Ear / Nose / Throat", []),
  ph("51G", "Cataracts", "51. Eye / Ear / Nose / Throat", ["What is the current status of the cataracts you reported?", "How are they currently being treated or monitored?"]),
  ph("51H", "Glaucoma", "51. Eye / Ear / Nose / Throat", ["What is the current status of your glaucoma?", "How is the glaucoma currently being treated or monitored?"]),
  ph("51I", "Blurred or double vision", "51. Eye / Ear / Nose / Throat", ["What is the current pattern of the blurred or double vision you reported?", "What evaluation or treatment have you had for it?"]),
  ph("51J", "Abnormal color vision test", "51. Eye / Ear / Nose / Throat", ["What finding was identified on the color vision test?"]),
  ph("51K", "Sinus trouble", "51. Eye / Ear / Nose / Throat", ["What is the current pattern of the sinus problem you reported?", "How has it been evaluated or treated?"]),
  ph("51L", "Loss of smell", "51. Eye / Ear / Nose / Throat", ["What is the history and current status of the loss of smell you reported?", "What medical evaluation occurred for it?"]),
  ph("51M", "Allergy / Hay fever", "51. Eye / Ear / Nose / Throat", ["What is the current pattern of the allergy or hay-fever symptoms you reported?", "How are the symptoms currently being managed?"]),
  ph("51N", "Ruptured ear drum", "51. Eye / Ear / Nose / Throat", ["What is the history and current status of the ruptured eardrum you reported?", "What treatment or medical follow-up occurred?"]),
  ph("51O", "Ringing or buzzing in ears", "51. Eye / Ear / Nose / Throat", ["What is the current pattern of the ringing or buzzing in your ears?", "What evaluation or treatment have you had for it?"]),
  ph("51P", "Hearing trouble", "51. Eye / Ear / Nose / Throat", ["What hearing problem was identified, and what is its current status?", "How is the hearing problem currently corrected, treated, or monitored?"]),
  ph("51Q", "Ear surgery", "51. Eye / Ear / Nose / Throat", ["What ear surgery did you have, and what is the current status of the condition it addressed?"]),
  ph("51R", "Earache", "51. Eye / Ear / Nose / Throat", ["What is the current pattern of the ear pain or earaches you reported?", "What evaluation or treatment have you had for it?"]),
  ph("51S", "Abnormal hearing test", "51. Eye / Ear / Nose / Throat", ["What finding was identified on the hearing test?", "What medical or hearing follow-up occurred afterward?"]),
];

const respiratory = [
  ph("52A", "Asthma", "52. Respiratory", ["What is the current pattern and status of your asthma?", "How has your asthma been treated or managed?"]),
  ph("52B", "Shortness of breath", "52. Respiratory", ["What is the current pattern of the shortness of breath you reported?", "What medical evaluation or treatment have you had for it?"]),
  ph("52C", "Chronic or frequent cough", "52. Respiratory", ["What is the current pattern of the chronic or frequent cough you reported?", "What medical evaluation or treatment have you had for it?"]),
  ph("52D", "Positive TB skin test", "52. Respiratory", ["What is the history of the positive TB skin test you reported?", "What treatment or medical follow-up occurred afterward?"]),
  ph("52E", "Coughed up blood", "52. Respiratory", ["What is the history and current status of the coughing up blood you reported?", "What medical evaluation or treatment occurred?"]),
  ph("52F", "Pneumothorax (collapsed lung)", "52. Respiratory", ["What is the history and current status of the pneumothorax you reported?", "What treatment or medical follow-up occurred?"]),
  ph("52G", "Chest tightness", "52. Respiratory", ["What is the current pattern of the chest tightness you reported?", "What medical evaluation or treatment have you had for it?"]),
  ph("52H", "Wheezing", "52. Respiratory", ["What is the current pattern of the wheezing you reported?", "What medical evaluation or treatment have you had for it?"]),
  ph("52I", "Blood clot in lung", "52. Respiratory", ["What is the history and current status of the blood clot in the lung you reported?", "What treatment or medical follow-up occurred afterward?"]),
];

const gi = [
  ph("53A", "Ulcer / Stomach trouble", "53. Gastrointestinal", ["What stomach condition or ulcer was identified, and what is its current status?", "How has it been treated or managed?"]),
  ph("53B", "Vomited blood", "53. Gastrointestinal", ["What is the history and current status of the vomiting blood you reported?", "What medical evaluation or treatment occurred?"]),
  ph("53C", "Persistent diarrhea", "53. Gastrointestinal", ["What is the current pattern of the persistent diarrhea you reported?", "What medical evaluation or treatment have you had for it?"]),
  ph("53D", "Colitis", "53. Gastrointestinal", ["What is the current status of your colitis?", "How is the condition currently being treated or monitored?"]),
  ph("53E", "Recurrent hemorrhoids", "53. Gastrointestinal", ["What is the current pattern of the recurrent hemorrhoids you reported?", "How have they been treated or managed?"]),
  ph("53F", "Gall bladder trouble", "53. Gastrointestinal", ["What gallbladder problem was identified, and what is its current status?", "What treatment, procedure, or follow-up occurred?"]),
  ph("53G", "Hepatitis", "53. Gastrointestinal", ["What type of hepatitis was identified, and what is its current status?", "What treatment or medical monitoring has occurred?"]),
  ph("53H", "Mucous in stool", "53. Gastrointestinal", ["What is the current pattern of the mucous in stool you reported?", "What medical evaluation has occurred for it?"]),
  ph("53I", "Black/bloody bowel movement", "53. Gastrointestinal", ["What is the history and current status of the black or bloody bowel movements you reported?", "What medical evaluation or treatment occurred?"]),
  ph("53J", "Pancreatitis", "53. Gastrointestinal", ["What is the history and current status of the pancreatitis you reported?", "What treatment or medical follow-up occurred?"]),
  ph("53K", "Abnormal liver test / Liver disease", "53. Gastrointestinal", ["What liver condition or abnormal test finding was identified, and what is its current status?", "What medical monitoring or treatment is in place?"]),
  ph("53L", "Hernia", "53. Gastrointestinal", ["What type of hernia did you have, and what is its current status?", "What treatment or medical follow-up has occurred for it?"]),
  ph("53M", "Irritable Bowel Syndrome", "53. Gastrointestinal", ["What is the current pattern of your irritable bowel syndrome?", "How is the condition currently being managed?"]),
  ph("53N", "Crohn's disease", "53. Gastrointestinal", ["What is the current status of your Crohn's disease?", "How is the condition currently being treated or monitored?"]),
];

const gu = [
  ph("54A", "Kidney disease or stone", "54. Genitourinary", ["What kidney condition or stone history are you reporting, and what is its current status?", "What treatment or medical follow-up has occurred?"]),
  ph("54B", "Bladder trouble", "54. Genitourinary", ["What bladder condition or symptoms are you reporting, and what is their current status?", "How have they been evaluated or treated?"]),
  ph("54C", "Difficulty urinating", "54. Genitourinary", ["What is the current pattern of the difficulty urinating you reported?", "What medical evaluation or treatment have you had for it?"]),
  ph("54D", "Blood in urine", "54. Genitourinary", ["What is the history and current status of the blood in urine you reported?", "What medical evaluation occurred for it?"]),
  ph("54E", "Prostatitis", "54. Genitourinary", ["What is the current status of the prostatitis you reported?", "How has it been evaluated or treated?"]),
  ph("54F", "Irregular vaginal bleeding", "54. Genitourinary", ["What is the current pattern of the irregular bleeding you reported?", "What medical evaluation or treatment have you had for it?"]),
  ph("54G", "Menstrual discomfort that kept you from work", "54. Genitourinary", ["What is the current pattern of the menstrual discomfort you reported?", "What medical evaluation or treatment have you had for it?"]),
  ph("54H", "Currently pregnant", "54. Genitourinary", []),
];

const cardio = [
  ph("55A", "Heart attack", "55. Cardiovascular", ["What is the history and current status of the heart attack you reported?", "What treatment or medical follow-up occurred afterward?"]),
  ph("55B", "Heart murmur", "55. Cardiovascular", ["What heart murmur or related finding was identified, and what is its current status?", "What medical follow-up or monitoring has occurred?"]),
  ph("55C", "Heart failure", "55. Cardiovascular", ["What is the current status of your heart failure?", "How is the condition currently being treated or monitored?"]),
  ph("55D", "Heart valve abnormality", "55. Cardiovascular", ["What heart-valve abnormality was identified, and what is its current status?", "What treatment or medical follow-up has occurred?"]),
  ph("55E", "Enlarged heart", "55. Cardiovascular", ["What is the history and current status of the enlarged-heart finding you reported?", "What medical follow-up or treatment has occurred?"]),
  ph("55F", "Palpitation (irregular heartbeat)", "55. Cardiovascular", ["What is the current pattern of the palpitations or irregular heartbeat you reported?", "What evaluation or treatment have you had for it?"]),
  ph("55G", "High blood pressure", "55. Cardiovascular", ["What is the history and current status of your high blood pressure?", "How is your blood pressure currently being managed or monitored?"]),
  ph("55H", "Pain or discomfort in chest", "55. Cardiovascular", ["What is the current pattern of the chest pain or discomfort you reported?", "What medical evaluation or treatment have you had for it?"]),
  ph("55I", "Rheumatic fever", "55. Cardiovascular", ["What is the history and current status of the rheumatic fever you reported?", "What medical follow-up occurred afterward?"]),
  ph("55J", "Swelling of foot or leg", "55. Cardiovascular", ["What is the current pattern of the foot or leg swelling you reported?", "What medical evaluation or treatment have you had for it?"]),
  ph("55K", "Painful varicose veins", "55. Cardiovascular", ["What is the current status of the painful varicose veins you reported?", "What treatment or medical follow-up has occurred?"]),
];

const musculoskeletal = [
  ph("56A", "Fractured/broken bone", "56. Musculoskeletal", ["What bone was fractured or broken, and what is its current status?", "What treatment or medical follow-up occurred?"]),
  ph("56B", "Back trouble/pain", "56. Musculoskeletal", ["What back problem are you reporting, and what is its current pattern?", "How has the back problem been evaluated or managed?"]),
  ph("56C", "Neck trouble/pain", "56. Musculoskeletal", ["What neck problem are you reporting, and what is its current pattern?", "How has the neck problem been evaluated or managed?"]),
  ph("56D", "Leg/shin pain", "56. Musculoskeletal", ["Where is the leg or shin pain located, and what is its current pattern?", "How has the pain been evaluated or managed?"]),
  ph("56E", "Arthroscopy", "56. Musculoskeletal", ["What arthroscopy did you have, and what is the current status of the condition it addressed?"]),
  ph("56F", "Arthritis / Rheumatism", "56. Musculoskeletal", ["What arthritis or rheumatic condition was identified, and which joints are affected?", "What is the current pattern and management of the condition?"]),
  ph("57A", "Shoulder — injury/surgery/dislocation/pain/swelling", "57. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["What shoulder condition, injury, surgery, dislocation, pain, or swelling are you reporting, and what is its current status?", "How has the shoulder problem been treated or managed?"]),
  ph("57B", "Elbow — injury/surgery/dislocation/pain/swelling", "57. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["What elbow condition, injury, surgery, dislocation, pain, or swelling are you reporting, and what is its current status?", "How has the elbow problem been treated or managed?"]),
  ph("57C", "Wrist — injury/surgery/dislocation/pain/swelling", "57. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["What wrist condition, injury, surgery, dislocation, pain, or swelling are you reporting, and what is its current status?", "How has the wrist problem been treated or managed?"]),
  ph("57D", "Fingers/toes — injury/surgery/dislocation/pain/swelling", "57. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["What finger or toe condition, injury, surgery, dislocation, pain, or swelling are you reporting, and what is its current status?", "How has the problem been treated or managed?"]),
  ph("57E", "Hip — injury/surgery/dislocation/pain/swelling", "57. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["What hip condition, injury, surgery, dislocation, pain, or swelling are you reporting, and what is its current status?", "How has the hip problem been treated or managed?"]),
  ph("57F", "Knee — injury/surgery/dislocation/pain/swelling", "57. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["What knee condition, injury, surgery, dislocation, pain, or swelling are you reporting, and what is its current status?", "How has the knee problem been treated or managed?"]),
  ph("57G", "Ankle/foot — injury/surgery/dislocation/pain/swelling", "57. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["What ankle or foot condition, injury, surgery, dislocation, pain, or swelling are you reporting, and what is its current status?", "How has the problem been treated or managed?"]),
  ph("57H", "Other joint pain or swelling", "57. Joint Injury / Surgery / Dislocation / Pain / Swelling", ["What joint or body area is affected, and what is the current pattern of the pain or swelling?", "How has the problem been evaluated or managed?"]),
];

const neuro = [
  ph("58A", "Epilepsy", "58. Neurological", ["What is the current status of your epilepsy?", "How is the condition currently being treated or monitored?"]),
  ph("58B", "Convulsion / Seizure", "58. Neurological", ["What is the current pattern and status of the convulsions or seizures you reported?", "What evaluation or treatment have you had for them?"]),
  ph("58C", "Fainting spells / Blackouts", "58. Neurological", ["What is the current pattern and status of the fainting spells or blackouts you reported?", "What medical evaluation occurred for them?"]),
  ph("58D", "Recurrent dizziness", "58. Neurological", ["What is the current pattern of the recurrent dizziness you reported?", "What evaluation or treatment have you had for it?"]),
  ph("58E", "Carpal Tunnel Syndrome", "58. Neurological", ["What is the current status of the carpal tunnel syndrome you reported?", "How has the condition been evaluated or treated?"]),
  ph("58F", "Head injury", "58. Neurological", ["What head injury occurred, and what is its current medical status?", "What treatment or medical follow-up occurred after the injury?"]),
  ph("58G", "Loss of consciousness", "58. Neurological", ["What occurred when you lost consciousness, and what is the current status of that history?", "What medical evaluation or follow-up occurred afterward?"]),
  ph("58H", "Frequent/recurrent headaches", "58. Neurological", ["What is the current pattern of the frequent or recurrent headaches you reported?", "How have the headaches been evaluated or treated?"]),
  ph("58I", "Migraine/sinus headaches", "58. Neurological", ["What is the current pattern of the migraine or sinus headaches you reported?", "How have the headaches been evaluated or treated?"]),
  ph("58J", "Multiple Sclerosis", "58. Neurological", ["What is the current status of your multiple sclerosis?", "How is the condition currently being treated or monitored?"]),
  ph("58K", "Skull defect", "58. Neurological", ["What skull defect was identified, and what is its current status?", "What medical evaluation or treatment has occurred?"]),
  ph("58L", "Tremors", "58. Neurological", ["What is the current pattern of the tremors you reported?", "What evaluation or treatment have you had for them?"]),
  ph("58M", "Meningitis / Encephalitis", "58. Neurological", ["What is the history and current status of the meningitis or encephalitis you reported?", "What treatment or medical follow-up occurred?"]),
  ph("58N", "Numbness of extremities", "58. Neurological", ["Which areas are affected by the numbness, and what is its current pattern?", "What evaluation or treatment have you had for it?"]),
  ph("58O", "Other neurological condition", "58. Neurological", ["What neurological condition are you reporting, and what is its current status?", "How has the condition been evaluated or treated?"]),
];

const misc = [
  ph("59A", "Diabetes", "59. Miscellaneous", ["How is your diabetes currently being managed?", "What recent monitoring or medical follow-up have you had for it?"]),
  ph("59B", "Low blood sugar", "59. Miscellaneous", ["What is the current pattern of the low blood sugar you reported?", "What evaluation or management is in place for it?"]),
  ph("59C", "Thyroid trouble", "59. Miscellaneous", ["What thyroid condition was identified, and what is its current status?", "How is the condition currently being treated or monitored?"]),
  ph("59D", "Bleeding tendencies", "59. Miscellaneous", ["What bleeding tendency or condition was identified, and what is its current status?", "What medical evaluation or treatment has occurred?"]),
  ph("59E", "Anemia", "59. Miscellaneous", ["What is the current status of the anemia you reported?", "How is the condition currently being treated or monitored?"]),
  ph("59F", "Enlarged glands", "59. Miscellaneous", ["What enlarged glands or related condition were identified, and what is the current status?", "What medical evaluation or follow-up occurred?"]),
  ph("59G", "Cyst / Tumor", "59. Miscellaneous", ["What cyst or tumor was identified, and what is its current status?", "What treatment or medical follow-up has occurred?"]),
  ph("59H", "Skin problems / Rashes", "59. Miscellaneous", ["What skin problem or rash are you reporting, and what is its current pattern?", "How has the skin problem been evaluated or treated?"]),
  ph("59I", "Cancer / Leukemia", "59. Miscellaneous", ["What type of cancer or leukemia was identified, and what is its current status?", "What treatment or medical follow-up has occurred?"]),
  ph("59J", "Wool allergy", "59. Miscellaneous", ["What reaction occurs with wool exposure?", "How is the allergy currently managed?"]),
  ph("59K", "Non-healing sores", "59. Miscellaneous", ["What non-healing sore are you reporting, and what is its current status?", "What medical evaluation or treatment has occurred?"]),
  ph("59L", "Chronic fatigue", "59. Miscellaneous", ["What is the current pattern of the chronic fatigue you reported?", "What evaluation or treatment have you had for it?"]),
  ph("59M", "Night sweats", "59. Miscellaneous", ["What is the current pattern of the night sweats you reported?", "What medical evaluation or treatment have you had for them?"]),
  ph("59N", "Undesired weight loss or gain", "59. Miscellaneous", ["What weight change occurred, and over what period of time?", "What medical evaluation, if any, has occurred for the change?"]),
  ph("59O", "Heat stress", "59. Miscellaneous", ["What heat-stress event or reaction occurred, and what is its current medical status?", "What medical evaluation or treatment occurred?"]),
  ph("59P", "Multiple chemical sensitivity", "59. Miscellaneous", ["What chemical sensitivity or reaction are you reporting, and what is its current pattern?", "What medical evaluation or treatment has occurred?"]),
  ph("59Q", "Recurrent fever in the last year", "59. Miscellaneous", ["What is the pattern of the recurrent fever you reported during the last year?", "What medical evaluation or treatment occurred?"]),
  ph("59R", "Eczema", "59. Miscellaneous", ["What is the current pattern of your eczema?", "How is the condition currently being treated or managed?"]),
  ph("59S", "Claustrophobia", "59. Miscellaneous", ["What is the current status of the claustrophobia you reported?", "What treatment or clinical follow-up, if any, has occurred?"]),
  ph("59T", "Sleep apnea", "59. Miscellaneous", ["What is the current status of your sleep apnea?", "How has your sleep apnea been evaluated or treated?"]),
  ph("59U", "Snoring", "59. Miscellaneous", ["What is the current pattern of the snoring you reported?", "What medical evaluation, if any, has occurred for it?"]),
  ph("59V", "Sleep problems/disorders", "59. Miscellaneous", ["What sleep problem or disorder was identified, and what is its current status?", "How has the sleep problem or disorder been evaluated or treated?"]),
  ph("59W", "Any other problem or illness not listed that may affect job performance", "59. Miscellaneous", ["What other medical problem or illness are you reporting, and what is its current status?", "What treatment or medical follow-up has occurred for it?"]),
  text("60", "60 — Explain any medical conditions marked Yes or ? and reference the corresponding item number and letter", "Section 4 — Medical Conditions", false),
];

export const postPeaceOfficerDefinition = form(
  "post-2-252-peace-officer-medical-history",
  "POST 2-252 — Medical History Statement — Peace Officer",
  "Adaptive California POST Peace Officer medical-history questionnaire preserving source numbering and Yes/No/Unsure responses while using open, condition-specific applicant clarification.",
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
