import { branch, civilianHistory, date, form, multi, q, select, text } from "./definition-helpers";

const condition = (key: string, label: string, section: string, prompts: string[]) =>
  civilianHistory(key, `${key} — ${label}`, section, prompts);

const conditions = [
  condition("1A", "Cerebrovascular accident (CVA)", "1. Neurology", [
    "What is the history and current status of the stroke you reported?",
    "What treatment or neurological follow-up occurred afterward?",
  ]),
  condition("1B", "Concussion", "1. Neurology", [
    "What concussion history are you reporting, and what is its current status?",
    "What treatment or medical follow-up occurred?",
  ]),
  condition("1C", "Dizziness / Loss of Consciousness", "1. Neurology", [
    "What is the current pattern and status of the dizziness or loss of consciousness you reported?",
    "What medical evaluation or treatment has occurred?",
  ]),
  condition("1D", "Headaches (Migraine)", "1. Neurology", [
    "What is the current pattern of the migraines you reported?",
    "How have the migraines been evaluated or treated?",
  ]),
  condition("1E", "Headaches (Other)", "1. Neurology", [
    "What is the current pattern of the headaches you reported?",
    "How have the headaches been evaluated or treated?",
  ]),
  condition("1F", "Multiple sclerosis", "1. Neurology", [
    "What is the current status of your multiple sclerosis?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("1G", "Peripheral neuropathy", "1. Neurology", [
    "What areas are affected by the peripheral neuropathy, and what is its current pattern?",
    "How has the condition been evaluated or treated?",
  ]),
  condition("1H", "Seizures", "1. Neurology", [
    "What is the current pattern and status of the seizure history you reported?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("1I", "Transient ischemic attack (TIA)", "1. Neurology", [
    "What is the history and current status of the TIA you reported?",
    "What treatment or neurological follow-up occurred afterward?",
  ]),
  condition("1J", "Traumatic brain injury (TBI)", "1. Neurology", [
    "What TBI history are you reporting, and what is its current medical status?",
    "What treatment or medical follow-up occurred?",
  ]),
  condition("1K", "Other neurological disorder", "1. Neurology", [
    "What neurological condition are you reporting, and what is its current status?",
    "How has the condition been evaluated or treated?",
  ]),

  condition("2A", "Angina / chest pain", "2. Cardiology", [
    "What is the current pattern of the angina or chest pain you reported?",
    "What cardiology evaluation or treatment has occurred?",
  ]),
  condition("2B", "Atrial fibrillation", "2. Cardiology", [
    "What is the current status of your atrial fibrillation?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("2C", "Cardiac pacemaker / defibrillator", "2. Cardiology", [
    "What heart condition led to the pacemaker or defibrillator, and what is its current status?",
    "What cardiology monitoring is currently in place?",
  ]),
  condition("2D", "Congestive heart failure", "2. Cardiology", [
    "What is the current status of your congestive heart failure?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("2E", "Coronary angioplasty / stent / bypass", "2. Cardiology", [
    "What coronary procedure did you have, and what condition led to it?",
    "What is the current status and cardiology follow-up for that condition?",
  ]),
  condition("2F", "Coronary artery disease", "2. Cardiology", [
    "What is the current status of your coronary artery disease?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("2G", "Heart murmur / valvular heart disease", "2. Cardiology", [
    "What heart murmur or valve condition was identified, and what is its current status?",
    "What cardiology follow-up or treatment has occurred?",
  ]),
  condition("2H", "Hypertension (high blood pressure)", "2. Cardiology", [
    "What is the history and current status of your high blood pressure?",
    "How is your blood pressure currently being managed or monitored?",
  ]),
  condition("2I", "Myocardial Infarction (MI)", "2. Cardiology", [
    "What is the history and current status of the heart attack you reported?",
    "What treatment or cardiology follow-up occurred afterward?",
  ]),
  condition("2J", "Supraventricular tachycardia (SVT)", "2. Cardiology", [
    "What is the current pattern and status of the SVT you reported?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("2K", "Other cardiac condition", "2. Cardiology", [
    "What cardiac condition are you reporting, and what is its current status?",
    "What treatment or cardiology follow-up has occurred?",
  ]),

  condition("3A", "Abdominal aneurysm", "3. Vascular Disease", [
    "What is the current status of the abdominal aneurysm you reported?",
    "What treatment or vascular follow-up has occurred?",
  ]),
  condition("3B", "Arterial emboli", "3. Vascular Disease", [
    "What is the history and current status of the arterial embolism you reported?",
    "What treatment or vascular follow-up occurred?",
  ]),
  condition("3C", "Cerebral aneurysm", "3. Vascular Disease", [
    "What is the current status of the cerebral aneurysm you reported?",
    "What treatment or specialist follow-up has occurred?",
  ]),
  condition("3D", "Deep venous thrombosis (DVT)", "3. Vascular Disease", [
    "What is the history and current status of the DVT you reported?",
    "What treatment or vascular follow-up has occurred?",
  ]),
  condition("3E", "Venous stasis ulcers", "3. Vascular Disease", [
    "What is the current status of the venous stasis ulcers you reported?",
    "How have they been evaluated or treated?",
  ]),
  condition("3F", "Other vascular condition", "3. Vascular Disease", [
    "What vascular condition are you reporting, and what is its current status?",
    "How is the condition currently being treated or monitored?",
  ]),

  condition("4A", "Fibromyalgia", "4. Rheumatologic & Autoimmune", [
    "What is the current pattern and status of your fibromyalgia?",
    "How is the condition currently being treated or managed?",
  ]),
  condition("4B", "Osteoarthritis", "4. Rheumatologic & Autoimmune", [
    "What joints are affected by the osteoarthritis, and what is its current pattern?",
    "How is the condition currently being treated or managed?",
  ]),
  condition("4C", "Rheumatoid arthritis", "4. Rheumatologic & Autoimmune", [
    "What joints are affected by the rheumatoid arthritis, and what is its current status?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("4D", "Systemic Lupus erythematosis", "4. Rheumatologic & Autoimmune", [
    "What is the current status of your lupus?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("4E", "Other rheumatologic / autoimmune condition", "4. Rheumatologic & Autoimmune", [
    "What rheumatologic or autoimmune condition are you reporting, and what is its current status?",
    "How is the condition currently being treated or monitored?",
  ]),

  condition("5A", "Hearing impairment", "5. Ears, Nose & Throat", [
    "What hearing impairment was identified, and what is its current status?",
    "How is the hearing impairment currently corrected, treated, or monitored?",
  ]),
  condition("5B", "Nosebleeds", "5. Ears, Nose & Throat", [
    "What is the current pattern of the nosebleeds you reported?",
    "What medical evaluation or treatment has occurred?",
  ]),
  condition("5C", "Seasonal Allergies", "5. Ears, Nose & Throat", [
    "What is the current pattern of the seasonal-allergy symptoms you reported?",
    "How are the symptoms currently managed?",
  ]),

  condition("6A", "Glaucoma", "6. Ophthalmology", [
    "What is the current status of your glaucoma?",
    "How is the glaucoma currently being treated or monitored?",
  ]),
  condition("6B", "Visual impairment", "6. Ophthalmology", [
    "What visual impairment was identified, and what is its current status?",
    "How is the vision currently corrected, treated, or monitored?",
  ]),
  condition("6C", "Other eye condition", "6. Ophthalmology", [
    "What eye condition are you reporting, and what is its current status?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("6D", "Lasik / restorative surgery", "6. Ophthalmology", [
    "What eye procedure did you have, and what is the current status of your vision following the procedure?",
    "What ophthalmic follow-up has occurred?",
  ]),

  condition("7A", "Altitude sickness", "7. Pulmonary", [
    "What altitude-sickness history are you reporting, and what is its current medical status?",
    "What medical evaluation, treatment, or guidance occurred?",
  ]),
  condition("7B", "Asthma after 10 years of age", "7. Pulmonary", [
    "What is the current pattern and status of your asthma?",
    "How has your asthma been treated or managed?",
  ]),
  condition("7C", "Chronic bronchitis / bronchiectasis", "7. Pulmonary", [
    "What bronchial condition was identified, and what is its current status?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("7D", "Chronic obstructive pulmonary disease", "7. Pulmonary", [
    "What is the current status of your COPD?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("7E", "Dyspnea (shortness of breath)", "7. Pulmonary", [
    "What is the current pattern of the shortness of breath you reported?",
    "What medical evaluation or treatment has occurred?",
  ]),
  condition("7F", "Obstructive sleep apnea", "7. Pulmonary", [
    "What is the current status of your sleep apnea?",
    "How has your sleep apnea been evaluated or treated?",
  ]),
  condition("7G", "Pulmonary embolism", "7. Pulmonary", [
    "What is the history and current status of the pulmonary embolism you reported?",
    "What treatment or medical follow-up occurred afterward?",
  ]),
  condition("7H", "Positive TB test / treatment", "7. Pulmonary", [
    "What TB testing, diagnosis, or treatment history are you reporting, and what is its current status?",
    "What treatment or medical follow-up occurred?",
  ]),
  condition("7I", "Chronic cough (greater than 3 weeks)", "7. Pulmonary", [
    "What is the current pattern of the chronic cough you reported?",
    "What medical evaluation or treatment has occurred?",
  ]),
  condition("7J", "Night sweats", "7. Pulmonary", [
    "What is the current pattern of the night sweats you reported?",
    "What medical evaluation or treatment has occurred?",
  ]),
  condition("7K", "Unexplained weight loss", "7. Pulmonary", [
    "What weight loss occurred, and over what period of time?",
    "What medical evaluation or follow-up has occurred?",
  ]),
  condition("7L", "Exposed to anyone with known TB", "7. Pulmonary", [
    "What TB exposure are you reporting, and when did it occur?",
    "What testing or medical follow-up occurred afterward?",
  ]),
  condition("7M", "Other pulmonary condition", "7. Pulmonary", [
    "What pulmonary condition are you reporting, and what is its current status?",
    "How is the condition currently being treated or monitored?",
  ]),

  condition("8A", "Black tarry stools / Blood in stool", "8. Gastrointestinal", [
    "What is the history and current status of the black or bloody stools you reported?",
    "What medical evaluation or treatment occurred?",
  ]),
  condition("8B", "Cholelithiasis (gall stones)", "8. Gastrointestinal", [
    "What is the history and current status of the gallstones you reported?",
    "What treatment or medical follow-up occurred?",
  ]),
  condition("8C", "Crohn's disease", "8. Gastrointestinal", [
    "What is the current status of your Crohn's disease?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("8D", "Frequent or persistent diarrhea", "8. Gastrointestinal", [
    "What is the current pattern of the frequent or persistent diarrhea you reported?",
    "What medical evaluation or treatment has occurred?",
  ]),
  condition("8E", "Gastroesophageal reflux (GERD)", "8. Gastrointestinal", [
    "What is the current pattern of your reflux?",
    "How is the condition currently being treated or managed?",
  ]),
  condition("8F", "Hemorrhoids", "8. Gastrointestinal", [
    "What is the current pattern or status of the hemorrhoids you reported?",
    "How have they been treated or managed?",
  ]),
  condition("8G", "Hepatitis", "8. Gastrointestinal", [
    "What type of hepatitis was identified, and what is its current status?",
    "What treatment or medical monitoring has occurred?",
  ]),
  condition("8H", "Hernia", "8. Gastrointestinal", [
    "What type of hernia did you have, and what is its current status?",
    "What treatment or medical follow-up has occurred?",
  ]),
  condition("8I", "Irritable bowel syndrome (IBS)", "8. Gastrointestinal", [
    "What is the current pattern of your irritable bowel syndrome?",
    "How is the condition currently being managed?",
  ]),
  condition("8J", "Pancreatitis", "8. Gastrointestinal", [
    "What is the history and current status of the pancreatitis you reported?",
    "What treatment or medical follow-up occurred?",
  ]),
  condition("8K", "Peptic ulcer disease", "8. Gastrointestinal", [
    "What is the current status of the peptic-ulcer disease you reported?",
    "How has it been evaluated or treated?",
  ]),
  condition("8L", "Ulcerative colitis", "8. Gastrointestinal", [
    "What is the current status of your ulcerative colitis?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("8M", "Other gastrointestinal disease", "8. Gastrointestinal", [
    "What gastrointestinal condition are you reporting, and what is its current status?",
    "How is the condition currently being treated or monitored?",
  ]),

  condition("9A", "Dermatitis", "9. Dermatology", [
    "What is the current pattern of the dermatitis you reported?",
    "How is the condition currently being treated or managed?",
  ]),
  condition("9B", "Melanoma", "9. Dermatology", [
    "What is the current status of the melanoma you reported?",
    "What treatment or dermatology follow-up has occurred?",
  ]),
  condition("9C", "Psoriasis / Eczema", "9. Dermatology", [
    "What is the current pattern of the psoriasis or eczema you reported?",
    "How is the condition currently being treated or managed?",
  ]),
  condition("9D", "Skin cancer", "9. Dermatology", [
    "What type of skin cancer was identified, and what is its current status?",
    "What treatment or dermatology follow-up has occurred?",
  ]),
  condition("9E", "Other skin condition", "9. Dermatology", [
    "What skin condition are you reporting, and what is its current status or pattern?",
    "How is the condition currently being treated or managed?",
  ]),

  condition("10A", "Cervical spine injury", "10. Orthopedic", [
    "What cervical-spine injury occurred, and what is its current status?",
    "How has the injury been evaluated or treated?",
  ]),
  condition("10B", "Chronic pain", "10. Orthopedic", [
    "What condition or body area is associated with the chronic pain, and what is its current pattern?",
    "How is the pain currently being treated or managed?",
  ]),
  condition("10C", "Dislocation", "10. Orthopedic", [
    "What joint or body part was dislocated, and what is its current status?",
    "What treatment or medical follow-up occurred?",
  ]),
  condition("10D", "Fractures", "10. Orthopedic", [
    "What bone was fractured, and what is its current status?",
    "What treatment or medical follow-up occurred?",
  ]),
  condition("10E", "Low back injury", "10. Orthopedic", [
    "What low-back injury occurred, and what is its current status or pattern?",
    "How has the injury been evaluated or treated?",
  ]),
  condition("10F", "Orthopedic pins / plates", "10. Orthopedic", [
    "What condition or injury required the orthopedic pins or plates, and what is its current status?",
    "What orthopedic follow-up has occurred?",
  ]),
  condition("10G", "Other orthopedic condition", "10. Orthopedic", [
    "What orthopedic condition are you reporting, and what is its current status?",
    "How has the condition been evaluated or treated?",
  ]),

  condition("11A", "Adrenal insufficiency", "11. Metabolic", [
    "What is the current status of your adrenal insufficiency?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("11B", "Diabetes Type I", "11. Metabolic", [
    "How is your Type I diabetes currently being managed?",
    "What current monitoring or medical follow-up is in place?",
  ]),
  condition("11C", "Diabetes Type II", "11. Metabolic", [
    "How is your Type II diabetes currently being managed?",
    "What current monitoring or medical follow-up is in place?",
  ]),
  condition("11D", "Gout", "11. Metabolic", [
    "What is the current pattern of the gout you reported, including which joints are affected?",
    "How is the condition currently being treated or managed?",
  ]),
  condition("11E", "Hypercholesterolemia", "11. Metabolic", [
    "What is the current status of your high cholesterol?",
    "How is it currently being treated or monitored?",
  ]),
  condition("11F", "Hyperthyroidism", "11. Metabolic", [
    "What is the current status of your hyperthyroidism?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("11G", "Hypothyroidism", "11. Metabolic", [
    "What is the current status of your hypothyroidism?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("11H", "Pituitary insufficiency", "11. Metabolic", [
    "What is the current status of your pituitary insufficiency?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("11I", "Other hormonal disorder", "11. Metabolic", [
    "What hormonal condition are you reporting, and what is its current status?",
    "How is the condition currently being treated or monitored?",
  ]),

  condition("12A", "Menstrual period over 30 days ago?", "12. Gynecology — Female", [
    "What is the current medical status of the delayed menstrual period reported here?",
    "What medical evaluation or follow-up, if any, has occurred?",
  ]),
  branch("12B", "12B — Date of last PAP smear", "12. Gynecology — Female", [
    "What was the result of the Pap smear, and what follow-up, if any, was recommended?",
  ], { answerType: "date", triggerValue: "*", required: false }),
  condition("12C", "Premenstrual syndrome (PMS)", "12. Gynecology — Female", [
    "What is the current pattern of the PMS symptoms you reported?",
    "How are the symptoms currently being treated or managed?",
  ]),
  condition("12D", "Endometriosis", "12. Gynecology — Female", [
    "What is the current status of your endometriosis?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("12E", "Severe menstrual cramps", "12. Gynecology — Female", [
    "What is the current pattern of the severe menstrual cramps you reported?",
    "What medical evaluation or treatment has occurred?",
  ]),
  condition("12F", "Ovarian cysts", "12. Gynecology — Female", [
    "What is the current status of the ovarian cysts you reported?",
    "What treatment or medical monitoring has occurred?",
  ]),
  condition("12G", "Sexually transmitted disease", "12. Gynecology — Female", [
    "What diagnosis are you reporting, and what is its current status?",
    "What treatment or medical follow-up has occurred?",
  ]),
  condition("12H", "Other gynecological condition", "12. Gynecology — Female", [
    "What gynecological condition are you reporting, and what is its current status?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("12I", "HIV", "12. Gynecology — Female", [
    "What is the current clinical status of the HIV history you reported?",
    "What treatment or medical monitoring is currently in place?",
  ]),

  condition("13A", "Addiction", "13. Psychiatric", [
    "What addiction or substance-use condition are you reporting, and what is its current clinical status?",
    "What treatment or clinical follow-up has occurred, if any?",
  ]),
  condition("13B", "Anxiety / panic attacks", "13. Psychiatric", [
    "What anxiety or panic condition are you reporting, and what is its current clinical status?",
    "What treatment or clinical follow-up is currently in place, if any?",
  ]),
  condition("13C", "Attention deficit disorder", "13. Psychiatric", [
    "What is the current clinical status of the attention-deficit disorder you reported?",
    "What treatment or clinical follow-up is currently in place, if any?",
  ]),
  condition("13D", "Bipolar", "13. Psychiatric", [
    "What is the current clinical status of the bipolar disorder you reported?",
    "What treatment or clinical follow-up is currently in place?",
  ]),
  condition("13E", "Depression", "13. Psychiatric", [
    "What is the current clinical status of the depression you reported?",
    "What treatment or clinical follow-up is currently in place, if any?",
  ]),
  condition("13F", "Eating disorder (bulimia/anorexia)", "13. Psychiatric", [
    "What eating-disorder condition are you reporting, and what is its current clinical status?",
    "What treatment or clinical follow-up has occurred, if any?",
  ]),
  condition("13G", "Hospitalization for psych condition", "13. Psychiatric", [
    "What condition was associated with the psychiatric hospitalization, and what is its current clinical status?",
    "What treatment or clinical follow-up is currently in place, if any?",
  ]),
  condition("13H", "Post-traumatic stress disorder", "13. Psychiatric", [
    "What is the current clinical status of the PTSD you reported?",
    "What treatment or clinical follow-up is currently in place, if any?",
  ]),
  condition("13I", "Schizophrenia", "13. Psychiatric", [
    "What is the current clinical status of the schizophrenia you reported?",
    "What treatment or clinical follow-up is currently in place?",
  ]),
  condition("13J", "Suicidal thoughts or attempts", "13. Psychiatric", [
    "What history is associated with this item, and what is its current clinical status?",
    "What treatment or clinical follow-up is currently in place, if any?",
  ]),
  condition("13K", "Other psychiatric condition", "13. Psychiatric", [
    "What psychiatric condition are you reporting, and what is its current clinical status?",
    "What treatment or clinical follow-up is currently in place, if any?",
  ]),

  condition("14A", "Chronic Renal Disease", "14. Renal Disease", [
    "What is the current status of your chronic renal disease?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("14B", "Frequent urinary tract infections", "14. Renal Disease", [
    "What is the current pattern of the urinary tract infections you reported?",
    "What medical evaluation or treatment has occurred?",
  ]),
  condition("14C", "Hematuria (blood in urine)", "14. Renal Disease", [
    "What is the history and current status of the blood in urine you reported?",
    "What medical evaluation or follow-up has occurred?",
  ]),
  condition("14D", "Kidney stones", "14. Renal Disease", [
    "What is the history and current status of the kidney stones you reported?",
    "What treatment or medical follow-up has occurred?",
  ]),
  condition("14E", "Other kidney condition", "14. Renal Disease", [
    "What kidney condition are you reporting, and what is its current status?",
    "How is the condition currently being treated or monitored?",
  ]),

  condition("15A", "Anemia", "15. Hematology / Oncology", [
    "What is the current status of the anemia you reported?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("15B", "Cancer", "15. Hematology / Oncology", [
    "What type of cancer was identified, and what is its current status?",
    "What treatment or oncology follow-up has occurred?",
  ]),
  condition("15C", "Leukemia", "15. Hematology / Oncology", [
    "What is the current clinical status of the leukemia you reported?",
    "What treatment or oncology follow-up has occurred?",
  ]),
  condition("15D", "Lymphoma — Hodgkins", "15. Hematology / Oncology", [
    "What is the current clinical status of the Hodgkin lymphoma you reported?",
    "What treatment or oncology follow-up has occurred?",
  ]),
  condition("15E", "Lymphoma — non Hodgkins", "15. Hematology / Oncology", [
    "What is the current clinical status of the non-Hodgkin lymphoma you reported?",
    "What treatment or oncology follow-up has occurred?",
  ]),
  condition("15F", "Platelet disorder", "15. Hematology / Oncology", [
    "What platelet disorder was identified, and what is its current status?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("15G", "Hemochromatosis", "15. Hematology / Oncology", [
    "What is the current status of your hemochromatosis?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("15I", "Other Hematologic / Oncologic", "15. Hematology / Oncology", [
    "What hematologic or oncologic condition are you reporting, and what is its current status?",
    "How is the condition currently being treated or monitored?",
  ]),

  condition("16A", "Prostate disease", "16. Genitourinary — Male", [
    "What prostate condition was identified, and what is its current status?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("16B", "Sexually transmitted disease", "16. Genitourinary — Male", [
    "What diagnosis are you reporting, and what is its current status?",
    "What treatment or medical follow-up has occurred?",
  ]),
  condition("16C", "Testicular abnormality", "16. Genitourinary — Male", [
    "What testicular abnormality was identified, and what is its current status?",
    "What medical evaluation or treatment has occurred?",
  ]),
  condition("16D", "Other genitourinary condition", "16. Genitourinary — Male", [
    "What genitourinary condition are you reporting, and what is its current status?",
    "How is the condition currently being treated or monitored?",
  ]),
  condition("16E", "HIV", "16. Genitourinary — Male", [
    "What is the current clinical status of the HIV history you reported?",
    "What treatment or medical monitoring is currently in place?",
  ]),

  q("17A", "17A — Are you a diver for the USAP?", "17. Diving", { answerType: "yes_no" }),
  condition("17B", "Have you had the bends?", "17. Diving", [
    "What decompression-sickness history are you reporting, and what is its current medical status?",
    "What treatment or diving-medical follow-up occurred?",
  ]),
  condition("18", "Any other medical condition NOT listed above", "18. Other", [
    "What other medical condition are you reporting, and what is its current status?",
    "What treatment or medical follow-up has occurred?",
  ]),
];

export const polarDefinition = form(
  "polar-medical-history-nsf-1700",
  "Polar Medical History — NSF Form 1700",
  "Adaptive Polar Physical Qualification medical-history questionnaire preserving the uploaded NSF Form 1700 source architecture while using open, condition-specific clarification.",
  "NSF Form 1700 (rev October 2017) — Polar Physical Qualification Medical History",
  [
    text("participant.pipeline", "Pipeline #", "Participant / Deployment Information", false),
    text("participant.name", "Name (last, first, middle — must match official ID)", "Participant / Deployment Information"),
    q("participant.age", "Age", "Participant / Deployment Information", { answerType: "number", required: false }),
    date("participant.dob", "Birthdate", "Participant / Deployment Information", false),
    select("participant.sex", "Sex", "Participant / Deployment Information", ["Female", "Male"], false),
    text("participant.nickname", "Nickname", "Participant / Deployment Information", false),
    text("participant.previousNames", "Maiden name / previous name / other legal name", "Participant / Deployment Information", false),
    text("participant.address", "Street address / City / State / ZIP / Country", "Participant / Deployment Information", false),
    text("participant.email", "Email", "Participant / Deployment Information", false),
    text("participant.phones", "Day / Evening / Mobile / Fax", "Participant / Deployment Information", false),
    text("emergency.contact", "Emergency point of contact — name, address, phone", "Participant / Deployment Information", false),
    text("deployment.jobTitle", "Job title", "Participant / Deployment Information", false),
    text("deployment.dates", "Estimated deployment dates (MM/YYYY From / To)", "Participant / Deployment Information", false),
    text("deployment.priorPolar", "Prior Polar deployment (Arctic or Antarctic) — location and dates", "Participant / Deployment Information", false),
    text("deployment.affiliation", "Affiliation / Company name / Science event / Technical event / Other", "Participant / Deployment Information", false),
    multi("deployment.worksite", "Proposed season / worksite", "Participant / Deployment Information", ["Antarctic Summer", "Antarctic Winter", "McMurdo Station", "South Pole Station", "Palmer Station", "Vessel", "Traverse", "Field Camp", "Arctic Summer", "Arctic Winter", "Summit", "Raven", "Other"], false),

    branch("currentMedications", "Current medications — list name, dose, and frequency, or enter None", "Medications / Allergies / Prior Care", [
      "What is each medication being used for, and how is it currently taken?",
      "What current monitoring or medical follow-up is associated with the medication or condition?",
    ], { answerType: "text", triggerValue: "*" }),
    branch("drugAllergies", "Drug allergies — list name and type of reaction, or enter None", "Medications / Allergies / Prior Care", [
      "What reaction have you had to each drug allergy?",
      "How is the allergy currently managed?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    branch("foodAllergies", "Food allergies — list name and type of reaction, or enter None", "Medications / Allergies / Prior Care", [
      "What reaction have you had to each food allergy?",
      "How is the allergy currently managed?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    branch("hospitalizations", "Past hospitalizations — condition and year, or enter None", "Medications / Allergies / Prior Care", [
      "What was the reason for each hospitalization, and what is the current status of the underlying condition or event?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    branch("surgeries", "Past surgeries — condition and year, or enter None", "Medications / Allergies / Prior Care", [
      "What surgery did you have, what condition made it necessary, and what is the current status of that condition?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    branch("testing", "Medical testing / procedures in previous 3 years — type, body location, date, reason, and result", "Medications / Allergies / Prior Care", [
      "What was the outcome of the testing or procedure, including any diagnosis, treatment, or follow-up that resulted?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    text("vaccinations", "Vaccination history — most recent dates for Influenza, BCG, DT/Tdap, MMR, Hepatitis A, and Hepatitis B", "Vaccination History", false),

    branch("tobacco.current", "Do you currently use tobacco products?", "Lifestyle", [
      "What is your current pattern of tobacco use?",
    ]),
    branch("tobacco.past", "Have you used tobacco products in the past?", "Lifestyle", [
      "What was your tobacco-use history, including when you stopped?",
    ]),
    branch("alcohol.current", "Do you drink alcohol?", "Lifestyle", [
      "What is your current pattern of alcohol use?",
    ]),
    branch("alcohol.reduce", "Have you ever felt you should decrease your alcohol consumption?", "Lifestyle", [
      "What is the current status of the concern about alcohol use reported here?",
    ]),
    branch("alcohol.legal", "Have you ever received a DUI, DWAI, or court-ordered treatment for alcohol?", "Lifestyle", [
      "When did the event occur, and what requirements or follow-up resulted?",
    ]),
    branch("alcohol.diagnosis", "Have you been diagnosed as an alcoholic?", "Lifestyle", [
      "What is the current clinical status of the alcohol-related diagnosis you reported?",
      "What treatment or clinical follow-up has occurred, if any?",
    ]),
    branch("exercise.program", "Do you have a regular exercise program?", "Exercise / Conditioning", [
      "What does your current exercise program consist of?",
    ]),
    branch("exercise.stressTest", "Have you had a cardiovascular stress test?", "Exercise / Conditioning", [
      "When was the cardiovascular stress test performed, what was the result, and what follow-up, if any, was recommended?",
    ]),

    ...conditions,
  ],
);
