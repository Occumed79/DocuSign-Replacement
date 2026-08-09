function p(...prompts: string[]): string[] {
  return prompts;
}

/**
 * Applicant-facing clarification for civilian / employment questionnaires.
 *
 * These prompts are intentionally NOT a translation of analyst/RDQA checklists.
 * The source item and real follow-up examples help identify what is medically
 * relevant, but each applicant prompt is written independently to be open,
 * factual, bounded, and condition-specific. No generic fallback is allowed:
 * an unmapped source label should fail loudly so it receives deliberate wording.
 */
export function civilianOccuMedPrompts(label: string): string[] {
  const s = label.toLowerCase();

  if (s.includes("limiting injury")) return p(
    "What injury caused the limitation you reported, and what is its current status?",
    "What treatment or medical follow-up has occurred for the injury?",
  );
  if (s.includes("injur") && !s.includes("upper") && !s.includes("lower") && !s.includes("back") && !s.includes("neck")) return p(
    "What injury occurred, and what is its current status?",
    "What treatment or medical follow-up occurred after the injury?",
  );
  if (s.includes("claim")) return p(
    "What injury or medical condition is associated with the claim you reported?",
    "What is the current status of that condition and the claim?",
  );
  if (s.includes("disability") || s.includes("disabled through")) return p(
    "What medical condition or conditions are associated with the disability determination or benefits you reported?",
    "What is the current medical status of those conditions?",
  );

  if (s.includes("positive reaction") && s.includes("ppd")) return p(
    "What is the history of the positive TB skin test you reported?",
    "What treatment or medical follow-up occurred afterward?",
  );
  if (s.includes("tuberculosis")) return p(
    "What is the history and current status of the tuberculosis or positive TB testing you reported?",
    "What treatment or medical follow-up has occurred?",
  );
  if (s.includes("pneumonia")) return p(
    "What is the history of the pneumonia you reported, including the most recent episode?",
    "What treatment or medical follow-up occurred?",
  );
  if (s.includes("bronchitis")) return p(
    "What is the current pattern or history of the bronchitis you reported?",
    "How has it been evaluated or treated?",
  );
  if (s.includes("emphysema")) return p(
    "What is the current status of your emphysema?",
    "How is the condition currently being treated or monitored?",
  );
  if (s.includes("asthma")) return p(
    "What is the current pattern and status of your asthma?",
    "How has your asthma been treated or managed?",
  );
  if (s.includes("pneumothorax")) return p(
    "What is the history of the pneumothorax you reported, and what is its current status?",
    "What treatment or medical follow-up occurred?",
  );
  if (s.includes("shortness of breath")) return p(
    "How would you describe the shortness of breath you reported and its current pattern?",
    "What evaluation or treatment have you had for it?",
  );
  if (s.includes("chronic cough") || s.includes("coughed up blood") || s.includes("coughing up blood")) return p(
    "What is the history and current status of the cough or coughing up blood you reported?",
    "What medical evaluation or treatment occurred for it?",
  );

  if (s.includes("high blood pressure")) return p(
    "What is the history and current status of your high blood pressure?",
    "How is your blood pressure currently being managed or monitored?",
  );
  if (s.includes("heart murmur") || s.includes("heart disease") || s.includes("heart trouble")) return p(
    "What heart condition or finding was identified?",
    "What evaluation, follow-up, or treatment has occurred for it?",
  );
  if (s.includes("stroke")) return p(
    "What is the history of the stroke you reported, and what is its current status?",
    "What medical follow-up or treatment occurred afterward?",
  );
  if (s.includes("chest pain")) return p(
    "How would you describe the chest pain you reported and its current pattern?",
    "What medical evaluation or treatment have you had for the chest pain?",
  );
  if (s.includes("loss of consciousness")) return p(
    "What occurred when you lost consciousness, and when did it happen?",
    "What medical evaluation or follow-up occurred afterward?",
  );
  if (s.includes("dizziness") || s.includes("vertigo") || s.includes("motion sickness")) return p(
    "What is the current pattern of the dizziness, vertigo, or motion sickness you reported?",
    "What evaluation or treatment have you had for these symptoms?",
  );
  if (s.includes("migraine")) return p(
    "What is the current pattern of the migraines you reported?",
    "How have the migraines been evaluated or treated?",
  );
  if (s.includes("headache")) return p(
    "What is the current pattern of the headaches you reported?",
    "How have the headaches been evaluated or treated?",
  );

  if (s.includes("hiatal") || s.includes("diaphragmatic hernia")) return p(
    "What is the history and current status of the hiatal or diaphragmatic hernia you reported?",
    "What treatment or medical follow-up has occurred for it?",
  );
  if (s.includes("hernia")) return p(
    "What type of hernia did you have, and what is its current status?",
    "What treatment or medical follow-up has occurred for it?",
  );
  if (s.includes("reflux")) return p(
    "What is the current pattern of the reflux you reported?",
    "How is the reflux currently being managed or treated?",
  );
  if (s.includes("ulcer")) return p(
    "What stomach or ulcer condition was identified, and what is its current status?",
    "What treatment or follow-up has occurred for it?",
  );
  if (s.includes("gall bladder")) return p(
    "What gallbladder problem was identified, and what is its current status?",
    "What treatment, procedure, or follow-up occurred for it?",
  );
  if (s.includes("liver") || s.includes("hepatitis")) return p(
    "What liver condition or type of hepatitis was identified, and what is its current status?",
    "What treatment or medical monitoring has occurred for it?",
  );

  if (s.includes("rheumatic fever")) return p(
    "What is the history of the rheumatic fever you reported, and what is its current status?",
    "What medical follow-up occurred afterward?",
  );
  if (s.includes("encephalitis") || s.includes("meningitis")) return p(
    "What is the history of the encephalitis or meningitis you reported, and what is its current status?",
    "What treatment or medical follow-up occurred?",
  );
  if (s.includes("epilepsy") || s.includes("seizure") || s.includes("convulsion")) return p(
    "What seizure or epilepsy history was identified, and what is its current status?",
    "How has the condition been evaluated or treated?",
  );
  if (s.includes("glaucoma")) return p(
    "What is the current status of your glaucoma?",
    "How is the glaucoma currently being treated or monitored?",
  );
  if (s.includes("problems with eyes") || s.includes("vision or eye") || s.includes("eyes/vision")) return p(
    "What eye or vision problem was identified?",
    "How is the vision problem currently corrected, treated, or monitored?",
  );
  if (s.includes("perforated ear") || s.includes("ear or ear drum")) return p(
    "What ear or eardrum problem occurred, and what is its current status?",
    "What evaluation or treatment occurred for it?",
  );
  if (s.includes("sinus trouble")) return p(
    "What is the current pattern of the sinus problem you reported?",
    "How has it been evaluated or treated?",
  );
  if (s.includes("sore throat")) return p(
    "What is the current pattern of the recurring sore throats you reported?",
    "What evaluation or treatment have you had for them?",
  );
  if (s.includes("colds more than")) return p(
    "What is the pattern of the frequent colds you reported?",
    "What medical evaluation, if any, has occurred for this pattern?",
  );

  if (s.includes("sleep apnea")) return p(
    "What is the current status of your sleep apnea?",
    "How has your sleep apnea been evaluated or treated?",
  );
  if (s.includes("anemia") || s.includes("blood disorder")) return p(
    "What blood condition was identified, and what is its current status?",
    "How is the condition currently being treated or monitored?",
  );
  if (s.includes("diabetes")) return p(
    "How is your diabetes currently being managed?",
    "What recent monitoring or medical follow-up have you had for it?",
  );
  if (s.includes("kidney disease")) return p(
    "What kidney condition was identified, and what is its current status?",
    "What treatment or medical follow-up have you had for it?",
  );
  if (s.includes("kidney stone")) return p(
    "What is the history and current status of the kidney stones you reported?",
    "What treatment or medical follow-up has occurred for them?",
  );
  if (s.includes("kidney disease or stones")) return p(
    "What kidney condition or stone history are you reporting, and what is its current status?",
    "What treatment or medical follow-up has occurred?",
  );
  if (s.includes("rheumatism") || s.includes("arthritis") || s.includes("gout")) return p(
    "What joint or inflammatory condition was identified, and which areas are affected?",
    "What is the current pattern and management of the condition?",
  );
  if (s.includes("varicose")) return p(
    "What is the current status of the varicose-vein problem you reported?",
    "What treatment or medical monitoring has occurred for it?",
  );
  if (s.includes("phlebitis") || s.includes("vascular problem") || s.includes("pvd")) return p(
    "What vascular condition was identified, and what is its current status?",
    "What treatment or medical monitoring has occurred for it?",
  );
  if (s.includes("pulmonary") && s.includes("embol")) return p(
    "What is the history of the embolism you reported, and what is its current status?",
    "What treatment or medical follow-up occurred afterward?",
  );

  if (s.includes("hay fever") || s.includes("allergic rhinitis")) return p(
    "What is the current pattern of the allergy symptoms you reported?",
    "How are the symptoms currently being managed?",
  );
  if (s.includes("typhoid")) return p(
    "What is the history of the typhoid fever you reported, and what is its current status?",
    "What treatment or medical follow-up occurred?",
  );
  if (s.includes("valley fever") || s.includes("coccidio")) return p(
    "What is the history and current status of the Valley Fever you reported?",
    "What treatment or medical follow-up has occurred?",
  );
  if (s.includes("histoplasmosis")) return p(
    "What is the history and current status of the histoplasmosis you reported?",
    "What treatment or medical follow-up has occurred?",
  );
  if (s.includes("infection")) return p(
    "What infection are you reporting, and what is its current status?",
    "What treatment or medical follow-up occurred for it?",
  );

  if (s.includes("skin cancer")) return p(
    "What type of skin cancer was identified, and what is its current status?",
    "What treatment or medical surveillance has occurred for it?",
  );
  if (s.includes("cancer")) return p(
    "What type of cancer was identified, and what is its current status?",
    "What treatment or medical follow-up has occurred for it?",
  );
  if (s.includes("immune")) return p(
    "What immune-system condition was identified, and what is its current status?",
    "How is the condition currently being treated or monitored?",
  );
  if (s.includes("hyperthyroid")) return p(
    "What is the current status of your hyperthyroidism?",
    "How is the condition currently being treated or monitored?",
  );
  if (s.includes("hypothyroid")) return p(
    "What is the current status of your hypothyroidism?",
    "How is the condition currently being treated or monitored?",
  );
  if (s.includes("thyroid")) return p(
    "What thyroid condition was identified, and what is its current status?",
    "How is the condition currently being treated or monitored?",
  );
  if (s.includes("psychological") || s.includes("psychiatric")) return p(
    "What condition was identified, and what is its current status?",
    "What treatment or clinical follow-up is currently in place, if any?",
  );
  if (s.includes("scarlet fever")) return p(
    "What is the history of the scarlet fever you reported, and what is its current status?",
    "What treatment or medical follow-up occurred?",
  );
  if (s.includes("decompression") || s.includes("air embol")) return p(
    "What decompression-sickness or air-embolism event occurred, and what is its current status?",
    "What treatment or medical follow-up occurred afterward?",
  );

  if (s.includes("skin rash") || s.includes("skin sensitivity")) return p(
    "What skin problem or sensitivity are you reporting, and what is its current pattern?",
    "How has the skin problem been evaluated or treated?",
  );
  if (s.includes("bleeding gums") || s.includes("bleeding") && s.includes("nose")) return p(
    "What bleeding problem are you reporting, and what is its current pattern?",
    "What medical or dental evaluation has occurred for it?",
  );

  if (s.includes("back or joint surgery")) return p(
    "What back or joint surgery did you have, and what is the current status of the underlying problem?",
    "What follow-up or treatment has occurred since the surgery?",
  );
  if (s.includes("back or joint pain")) return p(
    "Where is the back or joint pain located, and what is its current pattern?",
    "How has the pain been evaluated or managed?",
  );
  if (s.includes("back injury")) return p(
    "What back injury occurred, and what is its current status?",
    "What treatment or medical follow-up occurred after the injury?",
  );
  if (s.includes("cervical neck") || s.includes("neck injury")) return p(
    "What neck injury or problem was identified, and what is its current status?",
    "What treatment or medical follow-up has occurred for it?",
  );
  if (s.includes("knee surgery")) return p(
    "What knee surgery did you have, and what is the current status of the knee?",
    "What treatment or follow-up has occurred since the surgery?",
  );
  if (s.includes("upper extremity")) return p(
    "What upper-extremity injury or problem was identified, and which area is affected?",
    "What is the current status and treatment of the problem?",
  );
  if (s.includes("lower extremity")) return p(
    "What lower-extremity injury or problem was identified, and which area is affected?",
    "What is the current status and treatment of the problem?",
  );
  if (s.includes("numbness") || s.includes("pins") && s.includes("hands")) return p(
    "What is the pattern of the numbness, tingling, or loss of sensation in your hands?",
    "What evaluation or treatment have you had for these symptoms?",
  );
  if (s.includes("forearm") || s.includes("elbow")) return p(
    "Which arm is affected, and what is the current pattern of the forearm or elbow symptoms?",
    "How has the problem been evaluated or treated?",
  );
  if (s.includes("shoulder") && !s.includes("surgery")) return p(
    "Which shoulder is affected, and what is the current pattern of the symptoms?",
    "How has the shoulder problem been evaluated or treated?",
  );
  if (s.includes("knee pain") || s.includes("popping") || s.includes("locking")) return p(
    "Which knee is affected, and what is the current pattern of the pain, popping, or locking?",
    "What evaluation or treatment have you had for the knee problem?",
  );
  if (s.includes("foot pain")) return p(
    "Which foot is affected, and what is the current pattern of the pain?",
    "How has the foot pain been evaluated or treated?",
  );
  if (s.includes("awakened while sleeping")) return p(
    "Which of the symptoms you reported has interrupted your sleep, and what is the current pattern?",
  );
  if (s.includes("interfere with your daily activities")) return p(
    "What wrist, arm, or shoulder problem is causing the interference reported on the source question?",
    "What is the current status of that problem?",
  );
  if (s.includes("medical treatment for this pain") || s.includes("currently receive, medical treatment")) return p(
    "What pain or discomfort is being treated, and what treatment are you receiving?",
    "What is the current status of the problem being treated?",
  );
  if (s.includes("carpal tunnel") || s.includes("ganglionic") || s.includes("tendonitis") || s.includes("bursitis")) return p(
    "What upper-extremity condition was identified, and which area is affected?",
    "What is the current status and treatment of the condition?",
  );
  if (s.includes("auto accident") && (s.includes("surgery") || s.includes("lasting pain"))) return p(
    "What injury or lasting medical issue resulted from the auto accident?",
    "What treatment or medical follow-up occurred for it?",
  );
  if (s.includes("auto accident")) return p(
    "What injury, if any, resulted from the auto accident you reported?",
    "What is the current status of any medical issue related to the accident?",
  );
  if (s.includes("presently experiencing any pain") || s.includes("current pain or discomfort")) return p(
    "Where is the pain or discomfort, and what is its current pattern?",
    "How is the pain or discomfort currently being evaluated or managed?",
  );

  if (s.includes("gained or lost more than")) return p(
    "What weight change occurred, and over what period of time?",
    "What medical explanation or evaluation, if any, has been identified for the change?",
  );
  if (s.includes("changes in your appetite")) return p(
    "What change in appetite have you noticed, and what is its current pattern?",
    "What medical evaluation, if any, has occurred for the change?",
  );
  if (s.includes("fatigue") || s.includes("weakness")) return p(
    "What is the current pattern of the fatigue or weakness you reported?",
    "What evaluation or treatment have you had for it?",
  );
  if (s.includes("mole") || s.includes("wart")) return p(
    "What change did you notice in the mole or wart, and what is its current status?",
    "What medical evaluation or treatment has occurred for it?",
  );
  if (s.includes("smoke") || s.includes("tobacco")) return p(
    "What tobacco use are you reporting, and what is its current status?",
  );
  if (s.includes("drink alcohol")) return p(
    "What is your current pattern of alcohol use?",
  );
  if (s.includes("alcoholism")) return p(
    "What is the current status of the alcohol-related condition or treatment you reported?",
    "What treatment or clinical follow-up has occurred?",
  );
  if (s.includes("hazardous recreation")) return p(
    "What recreational activity are you reporting, and how often do you participate in it?",
  );
  if (s.includes("female disorder")) return p(
    "What medical condition or disorder are you reporting, and what is its current status?",
    "What treatment or medical follow-up has occurred for it?",
  );
  if (s.includes("pregnant")) return p(
    "What is the current status of the pregnancy-related information you reported?",
  );
  if (s.includes("male disorder")) return p(
    "What medical condition or disorder are you reporting, and what is its current status?",
    "What treatment or medical follow-up has occurred for it?",
  );
  if (s.includes("job require arm") || s.includes("actions to be repeated")) return p(
    "What repeated arm, hand, or finger activity is required by the source question?",
  );
  if (s.includes("corrective lenses")) return [];

  if (s.includes("prolonged loud noises")) return p(
    "What loud-noise exposure are you reporting, and when did it occur?",
    "What hearing evaluation or medical follow-up, if any, has occurred since the exposure?",
  );
  if (s.includes("irritated your skin") || s.includes("irritated your skin or eyes")) return p(
    "What substance caused the skin or eye irritation, and what reaction occurred?",
    "What treatment or medical follow-up, if any, occurred?",
  );
  if (s.includes("caused breathing difficulties")) return p(
    "What substance caused the breathing difficulty, and what reaction occurred?",
    "What treatment or medical follow-up, if any, occurred?",
  );
  if (s.includes("sprays or powders")) return p(
    "What spray or powder exposure are you reporting, and what reaction or medical issue occurred?",
  );
  if (s.includes("x-rays") || s.includes("radiation")) return p(
    "What radiation exposure are you reporting, and when did it occur?",
    "What medical monitoring or follow-up, if any, occurred afterward?",
  );
  if (s.includes("dusty conditions") || s.includes("sandblasting")) return p(
    "What dust exposure are you reporting, and when did it occur?",
    "What respiratory evaluation or medical follow-up, if any, has occurred?",
  );
  if (s.includes("high environmental temperatures")) return p(
    "What reaction occurred with high environmental temperatures, and what is its current status?",
    "What medical evaluation or treatment occurred for the reaction?",
  );
  if (s.includes("low environmental temperatures")) return p(
    "What reaction occurred with low environmental temperatures, and what is its current status?",
    "What medical evaluation or treatment occurred for the reaction?",
  );

  if (s.includes("other medical condition") || s.includes("medical conditions you have which are not listed")) return p(
    "What medical condition are you reporting, and what is its current status?",
    "What treatment or medical follow-up has occurred for it?",
  );

  throw new Error(`No civilian applicant prompt has been deliberately written for source label: ${label}`);
}
