import { branch, date, form, text } from "./definition-helpers";

const S = "ESCAPE Post Self-Certification";
const b = (key: string, label: string, prompts: string[]) => branch(key, `${key} — ${label}`, S, prompts);

export const ds6570Definition = form(
  "ds-6570-escape-post-self-certification",
  "DS-6570 — ESCAPE Post Self-Certification",
  "Adaptive DS-6570 self-certification questionnaire preserving all 43 source deployment-risk questions while using open, source-specific clarification after a positive response.",
  "U.S. Department of State DS-6570, 10-2019",
  [
    text("patient.name", "Patient printed name", "Identification", false),
    date("patient.dob", "Date of birth", "Identification", false),
    text("patient.id", "ID", "Identification", false),
    text("deployment.post", "Deployment destination / post", "Identification", false),

    b("1", "Any condition that prevents performing the duties described on page 1, including all physical tasks and wearing personal protective equipment (mask, helmet, body armor, and chemical/biological garments)?", [
      "What condition is associated with the limitation you reported?",
      "What restriction or limitation has been identified for that condition?",
    ]),
    b("2", "Conditions that prohibit required immunizations or medications such as anti-malarials, chemical/biological antidotes, or chemoprophylactic antibiotics?", [
      "What medical condition causes the contraindication you reported, and which required immunization or medication is affected?",
      "What medical guidance or documentation is in place for the contraindication?",
    ]),
    b("3", "Any condition requiring frequent clinical visits or ancillary tests, significant limitation of physical activity, or increased risk of illness, injury, or infection?", [
      "What condition is associated with the follow-up, testing, limitation, or increased risk described in this item?",
      "What current care, monitoring, or limitation is required for that condition?",
    ]),
    b("4", "Any unresolved acute illness or injury that would impair duty performance during deployment?", [
      "What acute illness or injury is unresolved, and what is its current status?",
      "What treatment or medical follow-up is currently in place?",
    ]),
    b("5", "Asthma with FEV1 < 50% predicted despite appropriate therapy, hospitalization in the last 12 months, or daily systemic steroid requirement?", [
      "What is the current status of your asthma?",
      "How is your asthma currently being treated and medically followed?",
    ]),
    b("6", "Seizure disorder within the last year or currently requiring anticonvulsant medication?", [
      "What is the current status of the seizure disorder you reported?",
      "How is the condition currently being treated or monitored?",
    ]),
    b("7", "Diabetes mellitus?", [
      "How is your diabetes currently being managed?",
      "What current monitoring or medical follow-up is in place?",
    ]),
    b("8", "History of heat stroke?", [
      "What is the history and current medical status of the heat-stroke event you reported?",
      "What medical follow-up or guidance occurred afterward?",
    ]),
    b("9", "Meniere's disease or other vertiginous/motion sickness disorder?", [
      "What condition or symptom pattern are you reporting, and what is its current status?",
      "How has it been evaluated or treated?",
    ]),
    b("10", "Renalithiasis (kidney stones), recurrent or currently symptomatic?", [
      "What is the history and current status of the kidney stones you reported?",
      "What treatment or medical monitoring has occurred?",
    ]),
    b("11", "Obstructive sleep apnea (OSA)?", [
      "What is the current status of your sleep apnea?",
      "How has your sleep apnea been evaluated or treated?",
    ]),
    b("12", "History of clinically diagnosed traumatic brain injury (TBI) or concussion?", [
      "What TBI or concussion history are you reporting, and what is its current status?",
      "What treatment or medical follow-up occurred?",
    ]),
    b("13", "Symptomatic coronary artery disease?", [
      "What is the current status of your coronary artery disease?",
      "What treatment or cardiology follow-up is currently in place?",
    ]),
    b("14", "Chronic cough or coughing up blood?", [
      "What is the current pattern or status of the chronic cough or coughing up blood you reported?",
      "What medical evaluation or treatment has occurred?",
    ]),
    b("15", "Myocardial infarction within the past two years?", [
      "What is the history and current status of the heart attack you reported?",
      "What treatment or cardiology follow-up occurred afterward?",
    ]),
    b("16", "CABG, coronary angioplasty, carotid endarterectomy, arterial stenting, or aneurysm repair within two years?", [
      "What procedure did you have, and what condition was it intended to treat?",
      "What is the current status and medical follow-up for that condition or procedure?",
    ]),
    b("17", "Cardiac dysrhythmias or arrhythmias, symptomatic or requiring medication, electrophysiologic control, or an implantable defibrillator?", [
      "What rhythm disorder was identified, and what is its current status?",
      "How is the condition currently being treated or monitored?",
    ]),
    b("18", "Hypertension not controlled with medication or requiring frequent monitoring?", [
      "What is the current status of your hypertension?",
      "How is your blood pressure currently being managed and monitored?",
    ]),
    b("19", "Heart failure or history of heart failure?", [
      "What is the current status of the heart-failure history you reported?",
      "How is the condition currently being treated or monitored?",
    ]),
    b("20", "Morbid obesity (BMI > 40)?", [
      "What medical monitoring, treatment, or follow-up is currently in place for this condition?",
    ]),
    b("21", "Active or chronic blood-borne disease including Hepatitis B, Hepatitis C, or HIV?", [
      "What blood-borne condition are you reporting, and what is its current clinical status?",
      "What treatment or medical monitoring is currently in place?",
    ]),
    b("22", "Active tuberculosis?", [
      "What is the current clinical status of the active tuberculosis you reported?",
      "What treatment or medical follow-up is currently in place?",
    ]),
    b("23", "Untreated latent tuberculosis or currently under treatment?", [
      "What is the current status of the latent-tuberculosis history you reported?",
      "What treatment or medical follow-up is planned or currently in place?",
    ]),
    b("24", "Vision loss?", [
      "What type of vision loss was identified, and what is its current status?",
      "How is the vision loss currently corrected, treated, or monitored?",
    ]),
    b("25", "Refractive eye surgery in the last year?", [
      "What refractive-eye procedure did you have, and what is the current status of your vision following the procedure?",
      "What ophthalmic follow-up is currently in place?",
    ]),
    b("26", "Currently using ophthalmic steroid drops?", [
      "What eye condition are the steroid drops being used to treat?",
      "What is the current status and medical follow-up for that condition?",
    ]),
    b("27", "PRK or LASIK within the past six months?", [
      "What procedure did you have, and what is the current status of your vision following the procedure?",
      "What ophthalmic follow-up is currently in place?",
    ]),
    b("28", "Hearing loss?", [
      "What hearing loss was identified, and what is its current status?",
      "How is the hearing loss currently corrected, treated, or monitored?",
    ]),
    b("29", "On-going dental or orthodontic work?", [
      "What dental or orthodontic treatment is currently underway?",
      "What follow-up or remaining treatment is expected?",
    ]),
    b("30", "On-going cancer therapy?", [
      "What cancer is currently being treated, and what is its clinical status?",
      "What therapy and medical follow-up are currently in place?",
    ]),
    b("31", "Untreated precancerous lesions?", [
      "What precancerous lesion or condition was identified, and what is its current status?",
      "What treatment or medical follow-up is planned?",
    ]),
    b("32", "Any condition that requires surgery, or surgery requiring ongoing treatment, rehabilitation, hardware revision/removal, or additional surgery?", [
      "What condition or surgery is associated with the ongoing care described in this item?",
      "What treatment, rehabilitation, procedure, or follow-up is still required?",
    ]),
    b("33", "Open or laparoscopic surgery within the past six months?", [
      "What surgery did you have, and what condition made it necessary?",
      "What is the current recovery status and medical follow-up?",
    ]),
    b("34", "Psychotic or bipolar disorders?", [
      "What condition was identified, and what is its current clinical status?",
      "What treatment or clinical follow-up is currently in place?",
    ]),
    b("35", "Clinical psychiatric disorders with residual symptoms or medication side effects?", [
      "What psychiatric condition is associated with the residual symptoms or medication effects reported in this item?",
      "What is the current clinical status and treatment plan?",
    ]),
    b("36", "History of psychiatric hospitalization, suicide attempt, substance abuse/treatment, PTSD, or TBI?", [
      "What history is associated with this item, and what is its current clinical status?",
      "What treatment or clinical follow-up is currently in place, if any?",
    ]),
    b("37", "Medications — blood modifiers?", [
      "What medication are you taking, and what condition is it being used for?",
      "What current monitoring or medical follow-up is associated with the medication or condition?",
    ]),
    b("38", "Medications — antineoplastic (oncologic or nononcologic)?", [
      "What medication are you taking, and what condition is it being used for?",
      "What current monitoring or medical follow-up is associated with the medication or condition?",
    ]),
    b("39", "Medications — immunosuppressants?", [
      "What medication are you taking, and what condition is it being used for?",
      "What current monitoring or medical follow-up is associated with the medication or condition?",
    ]),
    b("40", "Medications — biologic response modifiers (immunomodulators)?", [
      "What medication are you taking, and what condition is it being used for?",
      "What current monitoring or medical follow-up is associated with the medication or condition?",
    ]),
    b("41", "Medications — psychiatric or sleeping aids?", [
      "What medication are you taking, and what condition is it being used for?",
      "What current monitoring or clinical follow-up is associated with the medication or condition?",
    ]),
    b("42", "Medications — anticonvulsants?", [
      "What medication are you taking, and what condition is it being used for?",
      "What current monitoring or medical follow-up is associated with the medication or condition?",
    ]),
    b("43", "Medications — pain medications, opioids, or opioid combination drugs?", [
      "What medication are you taking, and what condition is it being used for?",
      "What current monitoring or medical follow-up is associated with the medication or condition?",
    ]),
  ],
);
