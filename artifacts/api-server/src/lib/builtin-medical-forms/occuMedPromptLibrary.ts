const generic = (subject = "condition or issue") => [
  `Please describe the ${subject}.`,
  "When did it occur or when were you diagnosed?",
  "What evaluation, treatment, medication, or surgery did you receive, if any?",
  "Do you have any current symptoms, restrictions, limitations, monitoring, or work impact related to it?",
];

/**
 * Deterministic cross-form prompt library distilled from the recovered
 * Occu-Med analyst follow-up bank.  Client forms can preserve their own source
 * wording/numbering while common clinical histories use the same clarification
 * logic instead of drifting between forms.
 */
export function occuMedPrompts(label: string): string[] {
  const s = label.toLowerCase();

  if (s.includes("limiting injury")) return [
    "What injury caused limitations or restrictions?",
    "When did it occur?",
    "What limitations or restrictions did it cause?",
    "Are those limitations or restrictions still current?",
    "Does this injury affect your daily activities or work now?",
    "What treatment did you receive?",
  ];
  if (s.includes("injur") && !s.includes("upper") && !s.includes("lower") && !s.includes("back") && !s.includes("neck")) return [
    "What injury did you have?",
    "When did it occur and what caused it?",
    "What body part was injured?",
    "What treatment did you receive?",
    "Do you have any current pain, symptoms, restrictions, or limitations related to it?",
  ];
  if (s.includes("claim")) return [
    "Which injury or condition was the claim for?",
    "Is the claim pending, denied, or awarded?",
    "Do you have any current symptoms, restrictions, or limitations related to that condition?",
  ];
  if (s.includes("disability") || s.includes("disabled through")) return [
    "What condition or conditions are associated with the disability determination or benefits?",
    "What percentage is assigned to each condition, if known?",
    "Do any of these conditions cause current symptoms, restrictions, or limitations?",
    "Are you receiving treatment for any of these conditions now?",
  ];
  if (s.includes("tuberculosis")) return [
    "When did the positive test or tuberculosis diagnosis occur?",
    "Was it active TB, latent TB, or a positive test only?",
    "Did you receive treatment?",
    "Do you have any current symptoms, restrictions, or monitoring related to this history?",
  ];
  if (s.includes("pneumonia")) return [
    "When was your most recent case of pneumonia?",
    "Was it a single episode or recurrent?",
    "Did you receive treatment or hospitalization?",
    "Do you have any current respiratory symptoms or limitations?",
  ];
  if (s.includes("bronchitis")) return [
    "When was your most recent episode?",
    "Was it a single episode or recurrent?",
    "Did you receive treatment?",
    "Do you have any current respiratory symptoms or limitations?",
  ];
  if (s.includes("emphysema")) return [
    "When were you diagnosed with emphysema?",
    "Are you currently receiving treatment or taking medication?",
    "Do you currently have symptoms, exercise limitations, or work restrictions from it?",
  ];
  if (s.includes("asthma")) return [
    "When were you diagnosed with asthma?",
    "Do you currently have asthma symptoms and how often do they occur?",
    "What tends to trigger them?",
    "Do you use an inhaler or other medication or treatment?",
    "Does asthma affect your daily activities, exercise, respirator use, or work?",
  ];
  if (s.includes("pneumothorax")) return [
    "When did the pneumothorax occur?",
    "Did you receive treatment or hospitalization?",
    "Have you fully recovered?",
    "Do you have any current breathing symptoms, restrictions, or limitations?",
  ];
  if (s.includes("shortness of breath")) return [
    "How often does the shortness of breath occur?",
    "What tends to trigger it?",
    "Have you been evaluated or treated for it?",
    "Does it limit your daily activities, exertion, or work?",
  ];
  if (s.includes("chronic cough") || s.includes("coughed up blood") || s.includes("coughing up blood")) return [
    "Are you referring to a chronic cough, coughing up blood, or both?",
    "When did this occur?",
    "Have you been evaluated or treated for it?",
    "Do you currently have any related symptoms or limitations?",
  ];
  if (s.includes("high blood pressure")) return [
    "When were you told you had high blood pressure?",
    "Are you taking medication or receiving treatment?",
    "Do you know your most recent blood pressure reading?",
    "Does this condition currently cause any symptoms, restrictions, or limitations?",
  ];
  if (s.includes("heart murmur") || s.includes("heart disease") || s.includes("heart trouble")) return [
    "What heart condition are you referring to?",
    "When was it diagnosed?",
    "Have you been evaluated or treated by a cardiologist or other provider?",
    "Do you currently have symptoms such as chest pain, palpitations, dizziness, shortness of breath, or fainting?",
    "Do you take medication for this condition?",
    "Does it currently limit your activities or work?",
  ];
  if (s.includes("stroke")) return [
    "When did the stroke occur?",
    "Did you receive hospitalization or follow-up care?",
    "Do you have any lasting symptoms, restrictions, or limitations?",
    "Are you under specialist follow-up?",
  ];
  if (s.includes("hiatal") || s.includes("diaphragmatic hernia")) return [
    "What type of hiatal or diaphragmatic hernia did you have?",
    "When did it occur?",
    "Has it been repaired or treated?",
    "Do you currently have any symptoms, restrictions, or limitations related to it?",
  ];
  if (s.includes("hernia")) return [
    "What type of hernia did you have or currently have?",
    "When did it occur?",
    "Has it been repaired or treated?",
    "Do you currently have any symptoms, restrictions, or limitations related to it?",
  ];
  if (s.includes("reflux")) return [
    "How often do you have reflux symptoms?",
    "Are you taking medication or receiving treatment?",
    "Does it affect your eating, sleep, daily activities, or work?",
  ];
  if (s.includes("rheumatic fever")) return [
    "When did the rheumatic fever occur?",
    "Did you receive treatment?",
    "Do you have any current symptoms, restrictions, or follow-up related to it?",
  ];
  if (s.includes("encephalitis") || s.includes("meningitis")) return [
    "Which condition are you referring to?",
    "When did it occur?",
    "Did you receive treatment or hospitalization?",
    "Do you have any lasting symptoms, restrictions, or limitations?",
  ];
  if (s.includes("epilepsy") || s.includes("seizure") || s.includes("convulsion")) return [
    "What seizure, epilepsy, or convulsion history are you referring to?",
    "When did it occur or when were you diagnosed?",
    "Was it a one-time event or recurrent?",
    "Are you taking medication or receiving treatment?",
    "Do you have any current restrictions or limitations?",
  ];
  if (s.includes("glaucoma")) return [
    "When were you diagnosed with glaucoma?",
    "Are you receiving treatment or monitoring?",
    "Do you have any current vision limitations?",
  ];
  if (s.includes("ulcer")) return [
    "What ulcer or stomach condition are you referring to?",
    "When did it occur or when were you diagnosed?",
    "Did you receive treatment?",
    "Do you have any ongoing symptoms, restrictions, or monitoring?",
  ];
  if (s.includes("gall bladder")) return [
    "What was the gallbladder issue?",
    "When did it occur?",
    "Did you receive treatment or surgery?",
    "Do you have any current symptoms, restrictions, or follow-up appointments related to it?",
  ];
  if (s.includes("liver") || s.includes("hepatitis")) return [
    "What liver condition or type of hepatitis are you referring to?",
    "When were you diagnosed?",
    "Did you receive treatment?",
    "Do you currently require monitoring, lab work, treatment, or follow-up?",
  ];
  if (s.includes("sleep apnea")) return [
    "Were you formally diagnosed with sleep apnea?",
    "When were you diagnosed and have you had a sleep study?",
    "Do you use CPAP or any other treatment?",
    "Do you currently have symptoms such as daytime sleepiness, fatigue, or trouble concentrating?",
    "Does this condition currently limit driving, work, or daily activities?",
  ];
  if (s.includes("anemia") || s.includes("blood disorder")) return [
    "What blood disorder are you referring to?",
    "When were you diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Does it cause any current symptoms or limitations?",
  ];
  if (s.includes("diabetes")) return [
    "When were you diagnosed with diabetes?",
    "What medication or treatment are you using?",
    "Do you know your most recent A1C result and date, if available?",
    "Do you have any current symptoms, complications, restrictions, or limitations related to diabetes?",
    "Have there been any recent changes to your treatment or medication?",
  ];
  if (s.includes("kidney disease") || s.includes("kidney trouble")) return [
    "What kidney condition are you referring to?",
    "When did this first occur or when were you diagnosed?",
    "Are you currently receiving treatment or follow-up?",
    "Do you have any current pain, symptoms, restrictions, or limitations?",
  ];
  if (s.includes("kidney stone")) return [
    "When did the kidney stones first occur?",
    "When was your most recent episode?",
    "Did the stone pass naturally or require treatment?",
    "Are you currently receiving treatment or follow-up?",
    "Do you have any current pain, symptoms, restrictions, or limitations?",
  ];
  if (s.includes("rheumatism") || s.includes("arthritis") || s.includes("gout")) return [
    "Which condition are you referring to?",
    "What body areas are affected?",
    "How often do you have symptoms?",
    "Are you taking medication or receiving treatment?",
    "Does it cause any current restrictions, limitations, or work impact?",
  ];
  if (s.includes("varicose")) return [
    "Do you have pain, swelling, or circulation problems now?",
    "Are you receiving treatment or monitoring?",
    "Does it cause any work or activity limitations?",
  ];
  if (s.includes("phlebitis") || s.includes("vascular problem") || s.includes("pvd")) return [
    "What vascular condition are you referring to?",
    "When did it occur or when were you diagnosed?",
    "Are you receiving treatment or monitoring?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ];
  if (s.includes("pulmonary") && s.includes("embol")) return [
    "When did the embolism occur?",
    "What treatment did you receive?",
    "Are you taking blood thinners or under follow-up?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ];
  if (s.includes("hay fever") || s.includes("allergic rhinitis")) return [
    "What allergy symptoms do you have?",
    "How often do they occur?",
    "Are you taking medication or receiving treatment?",
    "Does it affect your daily activities or work?",
  ];
  if (s.includes("typhoid")) return [
    "When did the typhoid fever occur?",
    "Did you receive treatment?",
    "Have you fully recovered?",
    "Do you have any current symptoms or limitations?",
  ];
  if (s.includes("sore throat")) return [
    "How often do you experience sore throats?",
    "Have you been evaluated or treated for it?",
    "Does it affect your daily activities or work?",
  ];
  if (s.includes("valley fever") || s.includes("coccidio")) return [
    "When were you diagnosed with Valley Fever?",
    "Did you receive treatment?",
    "Do you have any ongoing symptoms, restrictions, or monitoring?",
  ];
  if (s.includes("histoplasmosis")) return [
    "When were you diagnosed with Histoplasmosis?",
    "Did you receive treatment?",
    "Do you have any ongoing symptoms, restrictions, or monitoring?",
  ];
  if (s.includes("skin cancer")) return [
    "What type of skin cancer are you referring to?",
    "When was it diagnosed?",
    "What treatment did you receive?",
    "Is it resolved or does it require ongoing surveillance or follow-up?",
  ];
  if (s.includes("cancer")) return [
    "What cancer are you referring to?",
    "When were you diagnosed?",
    "What treatment did you receive?",
    "Is the condition resolved, in remission, active, or under surveillance?",
    "Do you have any current symptoms, restrictions, or follow-up needs?",
  ];
  if (s.includes("immune")) return [
    "What immune system condition are you referring to?",
    "When was it diagnosed?",
    "Are you currently receiving treatment or monitoring?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ];
  if (s.includes("hyperthyroid")) return [
    "When were you diagnosed with hyperthyroidism?",
    "Are you taking medication or receiving treatment?",
    "Does it cause any current symptoms, restrictions, or limitations?",
  ];
  if (s.includes("hypothyroid")) return [
    "When were you diagnosed with hypothyroidism?",
    "Are you taking medication or receiving treatment?",
    "Does it cause any current symptoms, restrictions, or limitations?",
  ];
  if (s.includes("thyroid")) return [
    "What thyroid condition are you referring to?",
    "When were you diagnosed?",
    "Are you taking medication or receiving treatment?",
    "Does it cause any current symptoms, restrictions, or limitations?",
  ];
  if (s.includes("psychological") || s.includes("psychiatric")) return [
    "What psychological or behavioral health condition are you referring to?",
    "When were you diagnosed or when did symptoms begin?",
    "Are you currently receiving treatment, counseling, or taking medication?",
    "Do you currently have symptoms related to this condition?",
    "Does it cause any restrictions, limitations, or affect your daily activities or work?",
    "Has your treatment or medication changed recently?",
  ];
  if (s.includes("scarlet fever")) return [
    "When did the scarlet fever occur?",
    "Did you receive treatment?",
    "Have you fully recovered?",
    "Do you have any current symptoms or limitations?",
  ];
  if (s.includes("decompression") || s.includes("air embol")) return [
    "Which condition are you referring to, decompression sickness or air embolism?",
    "When did it occur?",
    "Did you receive treatment?",
    "Do you have any current symptoms, restrictions, or limitations?",
  ];
  if (s.includes("skin rash") || s.includes("skin sensitivity")) return [
    "What skin condition or sensitivity are you referring to?",
    "What symptoms do you experience?",
    "Have you received treatment?",
    "Does it currently affect your daily activities or work?",
  ];
  if (s.includes("bleeding gums") || s.includes("nose")) return [
    "Are you referring to bleeding gums, nosebleeds, or both?",
    "How often does it happen?",
    "Have you been evaluated or treated for it?",
    "Does it affect your daily activities or work?",
  ];
  if (s.includes("sinus")) return [
    "What sinus problem are you referring to?",
    "How often do symptoms occur?",
    "Are you receiving treatment?",
    "Does it affect your daily activities or work?",
  ];
  if (s.includes("ear drum") || s.includes("eardrum") || s.includes("ear issue")) return [
    "What ear or ear-drum problem are you referring to?",
    "When did it occur?",
    "Did you receive treatment?",
    "Do you have any current hearing issues, dizziness, infections, restrictions, or limitations?",
  ];
  if (s.includes("colds more")) return [
    "How often do you get colds in a typical year?",
    "Have you been evaluated or treated for recurrent symptoms?",
    "Does it affect your daily activities or work?",
  ];
  if (s.includes("loss of consciousness")) return [
    "When did the loss of consciousness occur?",
    "Was it a one-time event or recurrent?",
    "Were you evaluated or treated?",
    "Do you have any current restrictions, limitations, or known cause for the event?",
  ];
  if (s.includes("chest pain")) return [
    "How often does the chest pain occur?",
    "What tends to bring it on?",
    "Have you been evaluated or treated by a provider?",
    "Does it limit your daily activities, exertion, or work?",
  ];
  if (s.includes("migraine")) return [
    "How often do you experience migraines?",
    "How severe are they and are there known triggers?",
    "Do they affect your daily activities or work?",
    "What treatment or medication do you use?",
  ];
  if (s.includes("headache")) return [
    "How often do you experience headaches?",
    "How severe are they?",
    "Are there known triggers?",
    "Do they affect your daily activities or work?",
    "Have you been evaluated or treated for them?",
  ];
  if (s.includes("dizziness") || s.includes("vertigo") || s.includes("motion sickness")) return [
    "Which applies to you: dizziness, vertigo, motion sickness, or more than one?",
    "How often does it occur and when was your last episode?",
    "How severe is it?",
    "Does it affect your balance, daily activities, driving, or work?",
    "Have you been evaluated or treated for it?",
  ];
  if (s.includes("eyes") || s.includes("vision")) return [
    "What eye or vision issue are you referring to?",
    "When did it begin or when was it diagnosed?",
    "Do you wear glasses, contacts, or use any other correction?",
    "Have you had surgery, treatment, or specialist evaluation?",
    "Does it currently affect your daily activities or work?",
  ];
  if (s.includes("back or joint surgery") || (s.includes("surgery") && !s.includes("knee"))) return [
    "What surgery did you have?",
    "What body part was involved?",
    "When was the surgery performed and why was it needed?",
    "Have you fully recovered?",
    "Do you have any current pain, restrictions, limitations, or ongoing treatment?",
  ];
  if (s.includes("back or joint pain")) return [
    "What part of your body is affected?",
    "How often do you experience the pain and how severe is it?",
    "What activities or movements tend to trigger it?",
    "Does it affect your daily activities or work?",
    "Are you receiving treatment or taking medication?",
  ];
  if (s.includes("back injury")) return [
    "When did the back injury occur?",
    "What caused the injury?",
    "What treatment did you receive?",
    "Do you have any current pain, restrictions, or limitations?",
    "Does the injury affect your daily activities or work?",
  ];
  if (s.includes("cervical") || s.includes("neck injury")) return [
    "When did the cervical neck injury or problem occur?",
    "What caused it?",
    "Do you have any current pain, restrictions, or limitations?",
    "Are you receiving treatment or monitoring?",
  ];
  if (s.includes("knee surgery")) return [
    "When did you have knee surgery?",
    "What was the reason for the surgery and which knee was involved?",
    "Have you fully recovered?",
    "Do you have any current pain, instability, restrictions, or limitations?",
    "Are you receiving any current treatment for the knee?",
  ];
  if (s.includes("upper extremity")) return [
    "What upper extremity injury or problem are you referring to?",
    "What body part is involved and when did it occur?",
    "Have you received treatment or surgery?",
    "Do you have any current restrictions, limitations, or work impact?",
  ];
  if (s.includes("lower extremity")) return [
    "What lower extremity injury or problem are you referring to?",
    "What body part is involved and when did it occur?",
    "Have you received treatment or surgery?",
    "Do you have any current restrictions, limitations, or work impact?",
  ];
  if (s.includes("gained") || s.includes("lost more than 10") || s.includes("weight")) return [
    "Did you gain weight, lose weight, or both?",
    "About how much weight changed and over what period of time?",
    "Do you know the reason for the weight change?",
    "Has a provider evaluated this change?",
  ];
  if (s.includes("appetite")) return [
    "What change in appetite did you notice?",
    "When did the change begin and is it still ongoing?",
    "Do you know the reason for the change?",
    "Has a provider evaluated or treated this issue?",
  ];
  if (s.includes("fatigue") || s.includes("weakness")) return [
    "When did the fatigue or weakness begin?",
    "How often do you experience it?",
    "Has it affected your daily activities or work?",
    "Have you been evaluated or treated for it?",
  ];
  if (s.includes("mole") || s.includes("wart")) return [
    "What change in the size or color did you notice?",
    "When did you notice it?",
    "Has a provider evaluated it?",
    "Is it still present or has it resolved?",
  ];
  if (s.includes("smoke") || s.includes("tobacco")) return [
    "Do you currently use tobacco, or is this prior use only?",
    "What type of tobacco do you use or did you use?",
    "How much do you currently use, or how much did you previously use?",
    "If you stopped, when did you quit?",
    "Have you had any medical problems related to tobacco use?",
  ];
  if (s.includes("alcoholism")) return [
    "When were you treated for alcoholism?",
    "What type of treatment did you receive?",
    "Is treatment ongoing?",
    "Do you have any current restrictions, limitations, or work impact related to this history?",
  ];
  if (s.includes("drink alcohol")) return [
    "How often do you drink alcohol?",
    "About how many drinks do you typically have?",
    "Has alcohol use caused any medical, work, legal, or daily functioning issues?",
  ];
  if (s.includes("hazardous recreation")) return [
    "What potentially hazardous recreational activities do you participate in?",
    "How often do you participate in them?",
    "Have you ever been injured while doing these activities?",
    "Do any current injuries, symptoms, or restrictions result from them?",
  ];
  if (s.includes("female disorder")) return [
    "What female disorder or condition are you referring to?",
    "When did it begin or when were you diagnosed?",
    "Are you currently receiving treatment?",
    "Do you have any current symptoms, restrictions, or limitations related to it?",
  ];
  if (s.includes("pregnant") || s.includes("pregnancy")) return [
    "Are you currently pregnant or is pregnancy only a possibility at this time?",
    "Are there any current restrictions, limitations, or provider recommendations related to this?",
  ];
  if (s.includes("male disorder")) return [
    "What male disorder or condition are you referring to?",
    "When did it begin or when were you diagnosed?",
    "Are you currently receiving treatment?",
    "Do you have any current symptoms, restrictions, or limitations related to it?",
  ];
  if (s.includes("numbness") || s.includes("pins and needles")) return [
    "Is it one hand or both?",
    "When did the symptoms begin and how often do they occur?",
    "How severe are they?",
    "Have you been evaluated or treated for this issue?",
    "Do the symptoms affect your daily activities or work?",
  ];
  if (s.includes("forearm") || s.includes("elbow")) return [
    "Which forearm or elbow is affected?",
    "How often do you have pain or soreness?",
    "Does it affect your daily activities or work?",
    "Have you been evaluated or treated for it?",
  ];
  if (s.includes("shoulder")) return [
    "Which shoulder is affected?",
    "When did the pain, discomfort, burning, or tingling begin?",
    "How often do symptoms occur and how severe are they?",
    "Do they affect your daily activities or work?",
    "Have you been evaluated or treated for it?",
  ];
  if (s.includes("knee pain") || s.includes("knee pain, popping")) return [
    "Which knee is affected?",
    "How often does the pain, popping, or locking occur?",
    "How severe is it?",
    "Does it affect walking, stairs, work, or daily activities?",
    "Have you been evaluated or treated for it?",
  ];
  if (s.includes("foot pain")) return [
    "Which foot is affected?",
    "How often do you experience the pain?",
    "Does it affect walking, standing, work, or daily activities?",
    "Are you receiving treatment for it?",
  ];
  if (s.includes("awakened while sleeping")) return [
    "Which symptom wakes you from sleep?",
    "How often does this happen?",
    "When did it begin?",
    "Have you been evaluated or treated for this issue?",
  ];
  if (s.includes("interfere with your daily activities") || s.includes("interfere with daily")) return [
    "What activities are affected by the discomfort?",
    "What body area is involved?",
    "How often does this interference happen?",
    "Does it currently affect your work activities?",
    "Are you receiving treatment for it?",
  ];
  if (s.includes("medical treatment for this pain") || s.includes("treatment for this pain")) return [
    "What condition or symptom are you receiving treatment for?",
    "What treatment are you receiving and how often?",
    "Is the treatment ongoing?",
    "Do you still have symptoms, restrictions, or limitations despite treatment?",
  ];
  if (s.includes("carpal tunnel") || s.includes("ganglionic") || s.includes("tendonitis") || s.includes("bursitis")) return [
    "Which condition or conditions did you receive medical help for?",
    "When were you diagnosed or treated?",
    "Did you have surgery? If yes, when?",
    "Are you still receiving treatment or having symptoms?",
    "Do you currently have any restrictions, limitations, or work impact from this condition?",
  ];
  if (s.includes("repeated many times") || s.includes("repetitive")) return [
    "What type of repetitive arm, hand, or finger actions does your work involve?",
    "Do those repetitive actions currently cause pain, numbness, tingling, or other symptoms?",
    "Have you been evaluated or treated for symptoms related to repetitive work activity?",
    "Do you have any current restrictions or limitations related to this?",
  ];
  if (s.includes("auto accident")) return [
    "When did the auto accident occur?",
    "Did you sustain any injuries? If yes, what injuries?",
    "Were you hospitalized or treated after the accident?",
    "Do you have any current pain, restrictions, limitations, or ongoing treatment related to the accident?",
  ];
  if (s.includes("corrective lenses")) return [
    "What type of corrective lenses do you use?",
    "Are they for reading, distance, or both?",
    "Do your lenses fully correct your vision for normal daily activities and work tasks?",
    "Do you have any other eye or vision conditions besides needing corrective lenses?",
  ];
  if (s.includes("presently experiencing") || s.includes("current pain") || s.includes("pain or discomfort")) return [
    "What area or areas of the body are currently painful or uncomfortable?",
    "When did the pain or discomfort begin?",
    "How severe is it?",
    "Does it affect your daily activities or work?",
    "Are you receiving treatment for it now?",
    "Do you currently have any restrictions or limitations because of it?",
  ];
  if (s.includes("failed a pre-placement")) return [
    "When did you fail the pre-placement medical or psychological examination?",
    "Was it a medical examination, psychological examination, or both?",
    "What condition or issue led to that result?",
    "Is that issue still current?",
    "Do you currently have any restrictions, limitations, or treatment related to it?",
  ];
  if (s.includes("terminated") || s.includes("resigned")) return [
    "When were you terminated, resigned, or changed positions due to a medically related reason?",
    "What issue was involved?",
    "Is that issue still current?",
    "Do you currently have any restrictions, limitations, or treatment related to it?",
  ];
  if (s.includes("driver's license") || s.includes("driver’s license")) return [
    "When was your driver's license suspended or revoked for medical reasons?",
    "What medical reason was involved?",
    "Has the issue been resolved?",
    "Do you currently have any restrictions or limitations related to this issue?",
  ];
  if (s.includes("medication to prevent wheezing")) return [
    "What medication have you used to prevent wheezing or shortness of breath during exercise?",
    "When did you last need it?",
    "What condition was it prescribed for?",
    "Do you currently have exercise-related wheezing or shortness of breath?",
    "Does this condition currently limit your activity or work?",
  ];
  if (s.includes("health care provider") || s.includes("provider's care") || s.includes("provider’s care")) return [
    "What condition are you currently being seen by a health care provider for?",
    "How often are you being seen or monitored?",
    "Are you receiving medication or treatment for it?",
    "Does the condition currently cause any restrictions, limitations, or work impact?",
  ];
  if (s.includes("loud noise")) return [
    "When and where did the loud-noise exposure occur?",
    "What type of noise were you exposed to and for how long?",
    "Did you use hearing protection?",
    "Do you have any current hearing symptoms or limitations related to it?",
  ];
  if (s.includes("irritated your skin") || s.includes("skin or eyes")) return [
    "What substance caused the irritation?",
    "When and where did the exposure occur?",
    "What symptoms or reaction did you have?",
    "Did you receive treatment?",
    "Do you have any current symptoms or restrictions related to the exposure?",
  ];
  if (s.includes("breathing difficulties") || s.includes("breathing difficulty")) return [
    "What substance caused the breathing difficulty?",
    "When and where did the exposure occur?",
    "What symptoms did you have?",
    "Did you receive treatment or evaluation?",
    "Do you have any current respiratory symptoms or restrictions related to the exposure?",
  ];
  if (s.includes("sprays or powders") || s.includes("radiation") || s.includes("dusty conditions")) return [
    "What substance or exposure are you referring to?",
    "When and where did the exposure occur?",
    "How long or how often were you exposed?",
    "Did it cause any symptoms or medical problems?",
    "Do you have any current symptoms, treatment, monitoring, or restrictions related to it?",
  ];
  if (s.includes("high environmental temperature") || s.includes("low environmental temperature")) return [
    "What reaction did you have?",
    "When did it occur?",
    "Were you evaluated or treated?",
    "Do you have any current sensitivity, restrictions, or precautions related to temperature exposure?",
  ];
  if (s.includes("infection")) return [
    "What infection are you referring to?",
    "When did it occur?",
    "What treatment did you receive?",
    "Do you have any current symptoms, restrictions, or monitoring needs?",
  ];

  return generic();
}
