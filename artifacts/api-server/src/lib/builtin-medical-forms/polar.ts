import { branch, date, form, history, multi, q, select, text } from "./definition-helpers";

const condition = (key: string, label: string, section: string, prompts: string[]) =>
  history(key, `${key} — ${label}`, section, prompts);

const conditions = [
  condition("1A", "Cerebrovascular accident (CVA)", "1. Neurology", [
    "When did the stroke occur?",
    "Did you receive hospitalization or specialist care?",
    "Do you have any lasting symptoms, restrictions, or limitations?",
    "Are you under current follow-up?",
  ]),
  condition("1B", "Concussion", "1. Neurology", [
    "When did the concussion occur?",
    "Was it a single event or multiple events?",
    "Did you receive treatment or monitoring?",
    "Do you have any current symptoms, restrictions, or lingering effects?",
  ]),
  condition("1C", "Dizziness / Loss of Consciousness", "1. Neurology", [
    "Are you referring to dizziness, loss of consciousness, or both?",
    "When did it occur and was it a one-time event or recurrent?",
    "What was the cause, if known?",
    "Were you evaluated or treated?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),
  condition("1D", "Headaches (Migraine)", "1. Neurology", [
    "How often do you experience migraines?",
    "How severe are they and are there known triggers?",
    "Are they disabling or do they interfere with work or daily activities?",
    "How do you treat them?",
  ]),
  condition("1E", "Headaches (Other)", "1. Neurology", [
    "What type of headaches do you experience?",
    "How often do they occur and how severe are they?",
    "Are there known triggers?",
    "Are you receiving treatment or taking medication?",
  ]),
  condition("1F", "Multiple sclerosis", "1. Neurology", [
    "When were you diagnosed?",
    "Is it current or stable?",
    "Are you taking medication or receiving treatment?",
    "Do you have any current restrictions, limitations, or safety concerns related to it?",
  ]),
  condition("1G", "Peripheral neuropathy", "1. Neurology", [
    "What body areas are affected?",
    "When were you diagnosed or when did symptoms begin?",
    "Are you receiving treatment?",
    "Do you have any current restrictions or limitations?",
  ]),
  condition("1H", "Seizures", "1. Neurology", [
    "When was your last seizure or seizure-like event?",
    "Was it a one-time event or recurrent?",
    "Are you taking medication or receiving treatment?",
    "Do you have any current restrictions or limitations?",
  ]),
  condition("1I", "Transient ischemic attack (TIA)", "1. Neurology", [
    "When did the TIA occur?",
    "Was it a one-time event or recurrent?",
    "Were you treated or evaluated by a specialist?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),
  condition("1J", "Traumatic brain injury (TBI)", "1. Neurology", [
    "When did the TBI occur?",
    "Was it a single event or multiple events?",
    "Did you receive treatment or monitoring?",
    "Do you have any current symptoms such as headaches, dizziness, concentration issues, or memory problems?",
    "Would it affect your ability to work in a remote polar environment?",
  ]),
  condition("1K", "Other neurological disorder", "1. Neurology", [
    "What neurological condition are you referring to?",
    "When did it occur or when were you diagnosed?",
    "Are you receiving treatment?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),

  condition("2A", "Angina / chest pain", "2. Cardiology", [
    "How often does the chest pain happen?",
    "What tends to bring it on?",
    "Have you been evaluated or treated by a provider for it?",
    "Does it currently affect exertion, work, or daily activities?",
  ]),
  condition("2B", "Atrial fibrillation", "2. Cardiology", [
    "When was it diagnosed?",
    "Are you taking medication or receiving treatment?",
    "Do you currently have symptoms such as palpitations, dizziness, fainting, or exercise intolerance?",
    "Does it cause any restrictions or monitoring needs?",
  ]),
  condition("2C", "Cardiac pacemaker / defibrillator", "2. Cardiology", [
    "When was the device placed?",
    "What condition led to it?",
    "Are you under current cardiology follow-up?",
    "Do you have any restrictions or limitations related to it?",
  ]),
  condition("2D", "Congestive heart failure", "2. Cardiology", [
    "When were you diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Do you have symptoms such as swelling, shortness of breath, or exercise intolerance?",
    "Does it cause any restrictions or limitations?",
  ]),
  condition("2E", "Coronary angioplasty / stent / bypass", "2. Cardiology", [
    "What procedure did you have, and when was it performed?",
    "What condition led to it?",
    "Are you under current follow-up?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),
  condition("2F", "Coronary artery disease", "2. Cardiology", [
    "When were you diagnosed?",
    "Are you receiving treatment or taking medication?",
    "Do you have any current symptoms or exercise limitations?",
    "Are you under cardiology follow-up?",
  ]),
  condition("2G", "Heart murmur / valvular heart disease", "2. Cardiology", [
    "What diagnosis are you referring to?",
    "When was it identified?",
    "Do you have any symptoms or restrictions?",
    "Are you under cardiology follow-up?",
  ]),
  condition("2H", "Hypertension (high blood pressure)", "2. Cardiology", [
    "When were you told you had high blood pressure?",
    "Are you taking medication or receiving treatment?",
    "Do you know your recent blood pressure reading?",
    "Does it cause any current symptoms or limitations?",
  ]),
  condition("2I", "Myocardial Infarction (MI)", "2. Cardiology", [
    "When did the heart attack occur?",
    "What treatment did you receive?",
    "Are you under current cardiology follow-up?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),
  condition("2J", "Supraventricular tachycardia (SVT)", "2. Cardiology", [
    "When were you diagnosed?",
    "How often do episodes occur?",
    "Are you receiving treatment or taking medication?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),
  condition("2K", "Other cardiac condition", "2. Cardiology", [
    "What cardiac condition are you referring to?",
    "When was it diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Does it cause any current restrictions, limitations, or safety concerns?",
  ]),

  condition("3A", "Abdominal aneurysm", "3. Vascular Disease", [
    "When was it diagnosed?",
    "Did you receive surgery or treatment?",
    "Is it current or repaired?",
    "Are you under current specialist follow-up?",
    "Do you have any restrictions or limitations?",
  ]),
  condition("3B", "Arterial emboli", "3. Vascular Disease", [
    "When did this occur?",
    "What treatment did you receive?",
    "Are you taking blood thinners or under current follow-up?",
    "Do you have any current restrictions or limitations?",
  ]),
  condition("3C", "Cerebral aneurysm", "3. Vascular Disease", [
    "When was it diagnosed?",
    "Did you receive treatment or surgery?",
    "Are you under specialist follow-up?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),
  condition("3D", "Deep venous thrombosis (DVT)", "3. Vascular Disease", [
    "When did the DVT occur?",
    "What treatment did you receive?",
    "Are you taking blood thinners or under follow-up?",
    "Do you have any current restrictions, limitations, or symptoms?",
  ]),
  condition("3E", "Venous stasis ulcers", "3. Vascular Disease", [
    "What treatment did you receive?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),
  condition("3F", "Other vascular condition", "3. Vascular Disease", [
    "What vascular condition are you referring to?",
    "When was it diagnosed or when did it occur?",
    "Are you receiving treatment or monitoring?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),

  condition("4A", "Fibromyalgia", "4. Rheumatologic & Autoimmune", [
    "When were you diagnosed?",
    "How often do symptoms occur?",
    "Are you receiving treatment or taking medication?",
    "Does it currently limit mobility, endurance, concentration, or work capacity?",
  ]),
  condition("4B", "Osteoarthritis", "4. Rheumatologic & Autoimmune", [
    "What joints are affected?",
    "How often do symptoms occur?",
    "Are you receiving treatment or taking medication?",
    "Does it currently limit movement, endurance, or work?",
  ]),
  condition("4C", "Rheumatoid arthritis", "4. Rheumatologic & Autoimmune", [
    "What joints are affected?",
    "Are you receiving treatment or taking medication?",
    "How often do symptoms flare?",
    "Does it cause any current restrictions or limitations?",
  ]),
  condition("4D", "Systemic Lupus erythematosis", "4. Rheumatologic & Autoimmune", [
    "When were you diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Do you have any current symptoms, restrictions, or work limitations?",
  ]),
  condition("4E", "Other rheumatologic / autoimmune condition", "4. Rheumatologic & Autoimmune", [
    "What diagnosis are you referring to?",
    "When was it diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),

  condition("5A", "Hearing impairment", "5. Ears, Nose & Throat", [
    "What hearing issue are you referring to?",
    "Do you use a hearing aid or receive treatment?",
    "Does it affect communication, alarms, situational awareness, or work performance?",
  ]),
  condition("5B", "Nosebleeds", "5. Ears, Nose & Throat", [
    "How often do nosebleeds occur?",
    "Have you been evaluated or treated?",
    "Does it affect your daily activities or work?",
  ]),
  condition("5C", "Seasonal Allergies", "5. Ears, Nose & Throat", [
    "What allergy symptoms do you have?",
    "How often do they occur?",
    "Are you taking medication or receiving treatment?",
    "Do they affect your daily activities or work?",
  ]),

  condition("6A", "Glaucoma", "6. Ophthalmology", [
    "When were you diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Do you have any current vision limitations?",
  ]),
  condition("6B", "Visual impairment", "6. Ophthalmology", [
    "What vision problem are you referring to?",
    "Do you use corrective lenses or receive treatment?",
    "Does it affect daily activities or work?",
  ]),
  condition("6C", "Other eye condition", "6. Ophthalmology", [
    "What eye condition are you referring to?",
    "Are you receiving treatment or monitoring?",
    "Does it affect daily activities or work?",
  ]),
  condition("6D", "Lasik / restorative surgery", "6. Ophthalmology", [
    "What procedure did you have, and when was it performed?",
    "Have you fully recovered?",
    "Do you have any current vision symptoms or restrictions?",
  ]),

  condition("7A", "Altitude sickness", "7. Pulmonary", [
    "When did it occur?",
    "What symptoms did you have?",
    "Have you had it more than once?",
    "Does it create any current concern for work at altitude?",
  ]),
  condition("7B", "Asthma after 10 years of age", "7. Pulmonary", [
    "When were you diagnosed?",
    "Do you currently have symptoms and what triggers them?",
    "Do you use an inhaler or treatment?",
    "Does it affect exertion or work capacity?",
  ]),
  condition("7C", "Chronic bronchitis / bronchiectasis", "7. Pulmonary", [
    "When were you diagnosed?",
    "How often do symptoms occur?",
    "Are you receiving treatment?",
    "Does it cause any current restrictions or limitations?",
  ]),
  condition("7D", "Chronic obstructive pulmonary disease", "7. Pulmonary", [
    "When were you diagnosed?",
    "Are you receiving treatment or medication?",
    "Do you have current symptoms, restrictions, or exercise limitations?",
  ]),
  condition("7E", "Dyspnea (shortness of breath)", "7. Pulmonary", [
    "How often does it occur?",
    "What triggers it?",
    "Have you been evaluated or treated?",
    "Does it limit your daily activities or work?",
  ]),
  condition("7F", "Obstructive sleep apnea", "7. Pulmonary", [
    "Were you formally diagnosed and do you have a sleep study?",
    "Do you use CPAP or another treatment?",
    "Do you have symptoms such as daytime sleepiness, fatigue, or concentration issues?",
    "Would it affect your ability to work remotely?",
  ]),
  condition("7G", "Pulmonary embolism", "7. Pulmonary", [
    "When did it occur?",
    "What treatment did you receive?",
    "Are you on blood thinners or under follow-up?",
    "Do you have any current symptoms or limitations?",
  ]),
  condition("7H", "Positive TB test / treatment", "7. Pulmonary", [
    "Are you referring to a positive TB test, latent TB, active TB, or treatment history?",
    "When did this occur?",
    "Did you receive treatment?",
    "Do you have any current symptoms, restrictions, or follow-up needs?",
  ]),
  condition("7I", "Chronic cough (greater than 3 weeks)", "7. Pulmonary", [
    "When did it begin?",
    "Have you been evaluated or treated?",
    "Does it affect sleep, daily activities, or work?",
  ]),
  condition("7J", "Night sweats", "7. Pulmonary", [
    "How often does it happen?",
    "Has it been medically evaluated?",
    "Do you have any associated diagnosis, treatment, or restrictions?",
  ]),
  condition("7K", "Unexplained weight loss", "7. Pulmonary", [
    "How much weight did you lose, and over what period of time?",
    "Was it medically evaluated?",
    "Do you have any diagnosis, treatment, or current symptoms related to it?",
  ]),
  condition("7L", "Exposed to anyone with known TB", "7. Pulmonary", [
    "When did the exposure occur?",
    "Were you tested or treated as a result?",
    "Do you have any current symptoms, restrictions, or monitoring needs?",
  ]),
  condition("7M", "Other pulmonary condition", "7. Pulmonary", [
    "What pulmonary condition are you referring to?",
    "When was it diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Does it cause any restrictions or limitations?",
  ]),

  condition("8A", "Black tarry stools / Blood in stool", "8. Gastrointestinal", [
    "When did this occur?",
    "Was it medically evaluated?",
    "What diagnosis or treatment did you receive?",
  ]),
  condition("8B", "Cholelithiasis (gall stones)", "8. Gastrointestinal", [
    "When did it occur?",
    "Did you receive treatment or surgery?",
    "Is the condition still causing symptoms?",
  ]),
  condition("8C", "Crohn's disease", "8. Gastrointestinal", [
    "When were you diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Does it affect your daily activities or work?",
  ]),
  condition("8D", "Frequent or persistent diarrhea", "8. Gastrointestinal", [
    "How often does it occur?",
    "Have you been evaluated or treated?",
    "Does it affect daily activities or work?",
  ]),
  condition("8E", "Gastroesophageal reflux (GERD)", "8. Gastrointestinal", [
    "How often do you have symptoms?",
    "Are you taking medication or receiving treatment?",
    "Does it affect eating, sleep, daily activities, or work?",
  ]),
  condition("8F", "Hemorrhoids", "8. Gastrointestinal", [
    "Did you receive treatment?",
    "Do you have any current symptoms or limitations?",
  ]),
  condition("8G", "Hepatitis", "8. Gastrointestinal", [
    "What type of hepatitis are you referring to?",
    "When were you diagnosed?",
    "Did you receive treatment?",
    "Do you require current monitoring or follow-up?",
  ]),
  condition("8H", "Hernia", "8. Gastrointestinal", [
    "What type of hernia are you referring to?",
    "When did it occur?",
    "Was it repaired or treated?",
    "Do you have any current symptoms, restrictions, or limitations related to it?",
  ]),
  condition("8I", "Irritable bowel syndrome (IBS)", "8. Gastrointestinal", [
    "How often do symptoms occur?",
    "Are you receiving treatment or taking medication?",
    "Does it affect your daily activities or work?",
  ]),
  condition("8J", "Pancreatitis", "8. Gastrointestinal", [
    "When did it occur?",
    "Did you receive treatment or hospitalization?",
    "Do you have any ongoing symptoms, restrictions, or monitoring needs?",
  ]),
  condition("8K", "Peptic ulcer disease", "8. Gastrointestinal", [
    "When were you diagnosed?",
    "Did you receive treatment?",
    "Do you have any ongoing symptoms, restrictions, or monitoring needs?",
  ]),
  condition("8L", "Ulcerative colitis", "8. Gastrointestinal", [
    "When were you diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Does it affect your daily activities or work?",
  ]),
  condition("8M", "Other gastrointestinal disease", "8. Gastrointestinal", [
    "What GI condition are you referring to?",
    "When were you diagnosed or when did it occur?",
    "Are you receiving treatment or monitoring?",
    "Does it cause any current restrictions or limitations?",
  ]),

  condition("9A", "Dermatitis", "9. Dermatology", [
    "What type of dermatitis or skin condition are you referring to?",
    "What symptoms do you have?",
    "Are you receiving treatment?",
    "Does it affect your daily activities, tolerance to cold/weather, or work?",
  ]),
  condition("9B", "Melanoma", "9. Dermatology", [
    "When were you diagnosed with melanoma?",
    "What treatment did you receive?",
    "Is it resolved, active, or under surveillance?",
    "Do you have any current restrictions, symptoms, or follow-up needs?",
  ]),
  condition("9C", "Psoriasis / Eczema", "9. Dermatology", [
    "Which condition are you referring to?",
    "What symptoms do you have?",
    "Are you receiving treatment?",
    "Does it affect your daily activities or ability to work in a cold or remote environment?",
  ]),
  condition("9D", "Skin cancer", "9. Dermatology", [
    "What type of skin cancer did you have?",
    "When was it diagnosed?",
    "What treatment did you receive?",
    "Is it resolved, active, or under surveillance?",
    "Do you have any current symptoms or follow-up needs?",
  ]),
  condition("9E", "Other skin condition", "9. Dermatology", [
    "What skin condition are you referring to?",
    "What symptoms do you have?",
    "Are you receiving treatment?",
    "Does it affect your daily activities or work?",
  ]),

  condition("10A", "Cervical spine injury", "10. Orthopedic", [
    "When did the cervical spine injury occur?",
    "What caused it?",
    "Did you receive treatment or surgery?",
    "Do you have any current pain, restrictions, limitations, or work impact related to it?",
  ]),
  condition("10B", "Chronic pain", "10. Orthopedic", [
    "What condition or body area is causing chronic pain?",
    "How often do you experience it and how severe is it?",
    "Are you receiving treatment or taking medication?",
    "Does it affect daily activities, work, or physical functioning?",
  ]),
  condition("10C", "Dislocation", "10. Orthopedic", [
    "What body part was dislocated?",
    "When did it occur?",
    "Did you receive treatment?",
    "Do you have any current instability, restrictions, or limitations?",
  ]),
  condition("10D", "Fractures", "10. Orthopedic", [
    "What bone was fractured?",
    "When did it occur?",
    "Did you receive treatment or surgery?",
    "Do you have any current pain, restrictions, or limitations?",
  ]),
  condition("10E", "Low back injury", "10. Orthopedic", [
    "When did the low back injury occur?",
    "What caused it?",
    "Are you receiving treatment?",
    "Do you have any current pain, restrictions, or limitations?",
  ]),
  condition("10F", "Orthopedic pins / plates", "10. Orthopedic", [
    "What body part has pins or plates?",
    "When was the surgery or treatment performed?",
    "Do you have any current pain, restrictions, or limitations related to it?",
  ]),
  condition("10G", "Other orthopedic condition", "10. Orthopedic", [
    "What orthopedic condition are you referring to?",
    "When did it occur or when were you diagnosed?",
    "Are you receiving treatment?",
    "Do you have any current restrictions, limitations, or work impact?",
  ]),

  condition("11A", "Adrenal insufficiency", "11. Metabolic", [
    "When were you diagnosed?",
    "Are you receiving treatment or taking medication?",
    "Do you require ongoing monitoring?",
    "Does it cause any current restrictions or limitations?",
  ]),
  condition("11B", "Diabetes Type I", "11. Metabolic", [
    "When were you diagnosed?",
    "What treatment or medication do you use?",
    "Do you know your most recent A1C or current control status?",
    "Do you have any complications, restrictions, or monitoring needs?",
    "Would access to treatment be required during deployment?",
  ]),
  condition("11C", "Diabetes Type II", "11. Metabolic", [
    "When were you diagnosed?",
    "What treatment or medication do you use?",
    "Do you know your most recent A1C or current control status?",
    "Do you have any complications, restrictions, or monitoring needs?",
    "Would access to treatment be required during deployment?",
  ]),
  condition("11D", "Gout", "11. Metabolic", [
    "When were you diagnosed?",
    "How often do you have flare-ups and what joints are affected?",
    "Are you receiving treatment or taking medication?",
    "Does it cause any restrictions or limitations?",
  ]),
  condition("11E", "Hypercholesterolemia", "11. Metabolic", [
    "When were you diagnosed?",
    "Are you taking medication or receiving treatment?",
    "Do you have any side effects from treatment?",
    "Are you under current monitoring or follow-up?",
  ]),
  condition("11F", "Hyperthyroidism", "11. Metabolic", [
    "When were you diagnosed?",
    "Are you taking medication or receiving treatment?",
    "Do you have any current symptoms, restrictions, or monitoring needs?",
  ]),
  condition("11G", "Hypothyroidism", "11. Metabolic", [
    "When were you diagnosed?",
    "Are you taking medication or receiving treatment?",
    "Do you have any current symptoms, restrictions, or monitoring needs?",
  ]),
  condition("11H", "Pituitary insufficiency", "11. Metabolic", [
    "When were you diagnosed?",
    "Are you receiving treatment or taking medication?",
    "Do you require ongoing monitoring?",
    "Does it cause any current restrictions or limitations?",
  ]),
  condition("11I", "Other hormonal disorder", "11. Metabolic", [
    "What hormonal or metabolic condition are you referring to?",
    "When were you diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Does it cause any current restrictions or limitations?",
  ]),

  condition("12A", "Menstrual period over 30 days ago?", "12. Gynecology — Female", [
    "Is there a known reason your menstrual period is over 30 days late?",
    "Have you been evaluated by a provider?",
    "Are there any current restrictions, limitations, or monitoring needs related to this?",
  ]),
  branch("12B", "12B — Date of last PAP smear", "12. Gynecology — Female", [
    "Were the results normal or abnormal?",
    "If abnormal, what follow-up or treatment was recommended or completed?",
  ], { answerType: "date", triggerValue: "*", required: false }),
  condition("12C", "Premenstrual syndrome (PMS)", "12. Gynecology — Female", [
    "What symptoms do you experience?",
    "Do those symptoms affect your daily activities or work?",
    "Are you receiving treatment?",
  ]),
  condition("12D", "Endometriosis", "12. Gynecology — Female", [
    "When were you diagnosed?",
    "Are you receiving treatment or taking medication?",
    "Does it cause current symptoms, restrictions, or limitations?",
  ]),
  condition("12E", "Severe menstrual cramps", "12. Gynecology — Female", [
    "How severe are the cramps?",
    "Do they affect daily activities or work?",
    "Have you been evaluated or treated for them?",
  ]),
  condition("12F", "Ovarian cysts", "12. Gynecology — Female", [
    "When were they diagnosed?",
    "Did you receive treatment or monitoring?",
    "Do they cause current symptoms, restrictions, or limitations?",
  ]),
  condition("12G", "Sexually transmitted disease", "12. Gynecology — Female", [
    "What diagnosis are you referring to?",
    "Did you receive treatment?",
    "Do you have any current symptoms, restrictions, or follow-up needs?",
  ]),
  condition("12H", "Other gynecological condition", "12. Gynecology — Female", [
    "What condition are you referring to?",
    "When was it diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Does it cause current symptoms, restrictions, or limitations?",
  ]),
  condition("12I", "HIV", "12. Gynecology — Female", [
    "When were you diagnosed?",
    "Are you receiving treatment and is the condition stable?",
    "Do you require ongoing monitoring or medication access during deployment?",
    "Do you have any current restrictions or limitations?",
  ]),

  condition("13A", "Addiction", "13. Psychiatric", [
    "What addiction or substance use issue are you referring to?",
    "Did you receive treatment or counseling?",
    "Do you have any current symptoms, restrictions, or monitoring needs?",
  ]),
  condition("13B", "Anxiety / panic attacks", "13. Psychiatric", [
    "When were you diagnosed or when did symptoms begin?",
    "Are you receiving treatment, counseling, or medication?",
    "How often do symptoms occur?",
    "Do they affect daily activities, work, or functioning in isolated environments?",
  ]),
  condition("13C", "Attention deficit disorder", "13. Psychiatric", [
    "When were you diagnosed?",
    "Are you receiving treatment or taking medication?",
    "Do you have any current concentration or functioning issues that affect work?",
  ]),
  condition("13D", "Bipolar", "13. Psychiatric", [
    "When were you diagnosed?",
    "Are you receiving psychiatric treatment or taking medication?",
    "Do you have any current symptoms, restrictions, or monitoring needs?",
  ]),
  condition("13E", "Depression", "13. Psychiatric", [
    "When were you diagnosed or when did symptoms begin?",
    "Are you receiving treatment, counseling, or medication?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),
  condition("13F", "Eating disorder (bulimia/anorexia)", "13. Psychiatric", [
    "What eating disorder are you referring to?",
    "Did you receive treatment?",
    "Do you have any current symptoms, nutritional concerns, restrictions, or monitoring needs?",
  ]),
  condition("13G", "Hospitalization for psych condition", "13. Psychiatric", [
    "When were you hospitalized?",
    "What condition led to the hospitalization?",
    "Are you receiving any current treatment, counseling, or medication?",
    "Do you have any current restrictions or limitations?",
  ]),
  condition("13H", "Post-traumatic stress disorder", "13. Psychiatric", [
    "When were you diagnosed or when did symptoms begin?",
    "Are you receiving counseling, treatment, or medication?",
    "Do you have any current symptoms, restrictions, or limitations?",
    "Would it affect your ability to work in an isolated or austere environment?",
  ]),
  condition("13I", "Schizophrenia", "13. Psychiatric", [
    "When were you diagnosed?",
    "Are you receiving treatment or taking medication?",
    "Do you have any current symptoms, restrictions, or monitoring needs?",
  ]),
  condition("13J", "Suicidal thoughts or attempts", "13. Psychiatric", [
    "When did this occur?",
    "Was this ideation, an attempt, or both?",
    "Were you hospitalized or treated?",
    "Are you currently in treatment or monitoring?",
    "Do you have any current safety concerns or restrictions?",
  ]),
  condition("13K", "Other psychiatric condition", "13. Psychiatric", [
    "What condition are you referring to?",
    "When were you diagnosed or when did symptoms begin?",
    "Are you receiving treatment or taking medication?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),

  condition("14A", "Chronic Renal Disease", "14. Renal Disease", [
    "When were you diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),
  condition("14B", "Frequent urinary tract infections", "14. Renal Disease", [
    "How often do these occur?",
    "When was the most recent infection?",
    "Did you receive treatment?",
    "Do you have any current symptoms, restrictions, or follow-up needs?",
  ]),
  condition("14C", "Hematuria (blood in urine)", "14. Renal Disease", [
    "When did this occur?",
    "Was it medically evaluated and was a diagnosis made?",
    "Do you have any current symptoms or follow-up needs?",
  ]),
  condition("14D", "Kidney stones", "14. Renal Disease", [
    "When did the kidney stones first occur?",
    "When was the most recent episode?",
    "Did the stone pass naturally or require treatment?",
    "Do you have any current symptoms, restrictions, or follow-up needs?",
  ]),
  condition("14E", "Other kidney condition", "14. Renal Disease", [
    "What kidney condition are you referring to?",
    "When were you diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Do you have any current restrictions or limitations?",
  ]),

  condition("15A", "Anemia", "15. Hematology / Oncology", [
    "When were you diagnosed with anemia?",
    "Are you receiving treatment or monitoring?",
    "Does it cause any current symptoms or limitations?",
  ]),
  condition("15B", "Cancer", "15. Hematology / Oncology", [
    "What type of cancer did you have?",
    "When were you diagnosed?",
    "What treatment did you receive?",
    "Is it resolved, active, or under surveillance?",
    "Do you have any current symptoms, restrictions, or follow-up needs?",
  ]),
  condition("15C", "Leukemia", "15. Hematology / Oncology", [
    "When were you diagnosed?",
    "What treatment did you receive?",
    "Is it resolved, active, or under surveillance?",
    "Do you have any current symptoms, restrictions, or follow-up needs?",
  ]),
  condition("15D", "Lymphoma — Hodgkins", "15. Hematology / Oncology", [
    "When were you diagnosed?",
    "What treatment did you receive?",
    "Is it resolved, active, or under surveillance?",
    "Do you have any current symptoms, restrictions, or follow-up needs?",
  ]),
  condition("15E", "Lymphoma — non Hodgkins", "15. Hematology / Oncology", [
    "When were you diagnosed?",
    "What treatment did you receive?",
    "Is it resolved, active, or under surveillance?",
    "Do you have any current symptoms, restrictions, or follow-up needs?",
  ]),
  condition("15F", "Platelet disorder", "15. Hematology / Oncology", [
    "What platelet disorder are you referring to?",
    "When was it diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Does it cause any current restrictions or limitations?",
  ]),
  condition("15G", "Hemochromatosis", "15. Hematology / Oncology", [
    "When were you diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),
  condition("15I", "Other Hematologic / Oncologic", "15. Hematology / Oncology", [
    "What condition are you referring to?",
    "When were you diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Do you have any current restrictions or limitations?",
  ]),

  condition("16A", "Prostate disease", "16. Genitourinary — Male", [
    "What prostate condition are you referring to?",
    "When was it diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ]),
  condition("16B", "Sexually transmitted disease", "16. Genitourinary — Male", [
    "What diagnosis are you referring to?",
    "Did you receive treatment?",
    "Do you have any current symptoms, restrictions, or follow-up needs?",
  ]),
  condition("16C", "Testicular abnormality", "16. Genitourinary — Male", [
    "What testicular abnormality are you referring to?",
    "When was it identified?",
    "Has it been evaluated or treated?",
    "Do you have any current restrictions or limitations?",
  ]),
  condition("16D", "Other genitourinary condition", "16. Genitourinary — Male", [
    "What condition are you referring to?",
    "When did it occur or when were you diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Do you have any current restrictions or limitations?",
  ]),
  condition("16E", "HIV", "16. Genitourinary — Male", [
    "When were you diagnosed?",
    "Are you receiving treatment and is the condition stable?",
    "Do you require ongoing monitoring or medication access during deployment?",
    "Do you have any current restrictions or limitations?",
  ]),

  branch("17A", "17A — Are you a diver for the USAP?", "17. Diving", [
    "Are you currently serving as a diver for the USAP?",
    "Do you have any diving-related restrictions, conditions, or monitoring needs?",
  ]),
  condition("17B", "Have you had the bends?", "17. Diving", [
    "When did this occur?",
    "What treatment did you receive?",
    "Do you have any current restrictions, symptoms, or limitations related to diving?",
  ]),
  condition("18", "Any other medical condition NOT listed above", "18. Other", [
    "What condition or issue are you referring to?",
    "When did it occur or when were you diagnosed?",
    "Are you receiving treatment or taking medication?",
    "Does it currently cause any restrictions, limitations, or work impact?",
  ]),
];

export const polarDefinition = form(
  "polar-medical-history-nsf-1700",
  "Polar Medical History — NSF Form 1700",
  "Adaptive Polar Physical Qualification medical-history interview using the uploaded NSF Form 1700 medical-history pages and the recovered Polar follow-up bank.",
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
      "What condition is each medication treating?",
      "When did you start taking it?",
      "Do you have any side effects?",
      "Would ongoing access to this medication be required during deployment?",
    ], { answerType: "text", triggerValue: "*" }),
    branch("drugAllergies", "Drug allergies — list name and type of reaction, or enter None", "Medications / Allergies / Prior Care", [
      "When was your most recent reaction?",
      "Have you ever required emergency treatment for it?",
      "Do you carry medication such as an epinephrine injector or use any other treatment?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    branch("foodAllergies", "Food allergies — list name and type of reaction, or enter None", "Medications / Allergies / Prior Care", [
      "When was your most recent reaction?",
      "Have you ever required emergency treatment for it?",
      "Do you carry medication such as an epinephrine injector or use any other treatment?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    branch("hospitalizations", "Past hospitalizations — condition and year, or enter None", "Medications / Allergies / Prior Care", [
      "What was the reason for the hospitalization?",
      "Have you fully recovered?",
      "Do you have any current symptoms, restrictions, or ongoing treatment related to it?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    branch("surgeries", "Past surgeries — condition and year, or enter None", "Medications / Allergies / Prior Care", [
      "What surgery did you have and why was it needed?",
      "Have you fully recovered?",
      "Do you have any current symptoms, restrictions, or ongoing treatment related to it?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    branch("testing", "Medical testing / procedures in previous 3 years — type, body location, date, reason, and result", "Medications / Allergies / Prior Care", [
      "Why was the test or procedure performed?",
      "What was the result?",
      "Did it lead to a diagnosis or treatment?",
      "Is the issue still current or resolved?",
    ], { answerType: "text", triggerValue: "*", required: false }),
    text("vaccinations", "Vaccination history — most recent dates for Influenza, BCG, DT/Tdap, MMR, Hepatitis A, and Hepatitis B", "Vaccination History", false),

    branch("tobacco.current", "Do you currently use tobacco products?", "Lifestyle", [
      "What type of tobacco do you use?",
      "How much do you currently use?",
      "Have you had any medical problems related to tobacco use?",
    ]),
    branch("tobacco.past", "Have you used tobacco products in the past?", "Lifestyle", [
      "What type of tobacco did you use?",
      "How much did you previously use?",
      "When did you quit?",
      "Have you had any medical problems related to prior tobacco use?",
    ]),
    branch("alcohol.current", "Do you drink alcohol?", "Lifestyle", [
      "How often do you drink alcohol and about how much do you typically drink?",
      "Has alcohol use caused any medical, legal, work, or daily functioning problems?",
      "Have you ever been diagnosed or treated for an alcohol-related issue?",
      "Is any treatment current or ongoing?",
    ]),
    branch("alcohol.reduce", "Have you ever felt you should decrease your alcohol consumption?", "Lifestyle", [
      "What led you to feel you should decrease your alcohol consumption?",
      "Did you make a change or receive counseling or treatment?",
      "Is this a current concern?",
    ]),
    branch("alcohol.legal", "Have you ever received a DUI, DWAI, or court-ordered treatment for alcohol?", "Lifestyle", [
      "When did this occur?",
      "What treatment, classes, or restrictions were required?",
      "Is there any ongoing treatment or monitoring?",
    ]),
    branch("alcohol.diagnosis", "Have you been diagnosed as an alcoholic?", "Lifestyle", [
      "When were you diagnosed?",
      "What treatment did you receive?",
      "Is any treatment current or ongoing?",
    ]),
    branch("exercise.program", "Do you have a regular exercise program?", "Exercise / Conditioning", [
      "What type of exercise do you currently do?",
      "How often do you exercise?",
      "Do you have any physical conditions that limit your exercise tolerance?",
    ]),
    branch("exercise.stressTest", "Have you had a cardiovascular stress test?", "Exercise / Conditioning", [
      "When was your most recent exercise stress test?",
      "What was the result?",
      "Was any additional evaluation or treatment recommended?",
    ]),

    ...conditions,
  ],
);
