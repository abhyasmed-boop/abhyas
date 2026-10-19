// Abhyas — CASE FILE: CHEST-L1-002
// STATUS: DRAFT. Clinical content is from Dr. Sharma's authoring document.
// All pass/miss/teaching wording is a draft for Dr. Sharma to review and edit.
// Places where I changed or added to the authoring document are marked  // CHANGED  or  // ADDED

function T(id, domain, points, label, topics, pass, miss, min) {
  return { id, domain, points, label, check: { type: 'topic_served', topics, min: min || 1 }, pass, miss };
}

module.exports = {
  meta: {
    caseId: 'CHEST-L1-002',
    symptom: 'chest_pain',
    symptomLabel: 'Chest Pain',
    number: 2,
    level: 1,                 // not shown to students yet
    durationMinutes: 20,
    version: '1.0-draft',
    audience: 'Third-year MBBS, Medicine OPD',
  },

  openingText:
    'You are a third year MBBS student on your Medicine OPD posting.\n\n' +
    'Ram Bahadur Thapa, 44 years old, walks into the OPD holding his upper abdomen and lower chest. He looks mildly uncomfortable but not in acute distress. He keeps checking his phone, because his shift starts in one hour.\n\n' +
    'Please begin.',

  patient: { name: 'Ram Bahadur Thapa', sex: 'male', age: 44 },

  finalForm: ['findings', 'diagnosis', 'reasoning', 'management'],

  diagnosis: {
    name: 'Gastro-oesophageal reflux disease (GERD)',   // shown ONLY in the debrief
    matchers: [/\bgerd\b/i, /reflux/i, /gastro-?o?esophageal/i, /gastro-?oesophageal/i],
  },

  // ───────────────────────── THE PATIENT ─────────────────────────
  voice: {
    persona:
      'You are Ram Bahadur Thapa, a 44-year-old bus driver on the Koteshwor to Bhaktapur route, married with two children. ' +
      'You are practical and a little impatient, because your shift starts in one hour. Friends have told you for 3 months that it is "just acidity". ' +
      'You came only because your wife insisted. You call the doctor "daju". ' +
      'Use simple everyday words. Never say GERD, reflux or any diagnosis. Reply in English, in one or two short sentences.',
    smallTalk:
      'You may say these about yourself if asked: you are 44, you drive a bus from Koteshwor to Bhaktapur, you are married with two children, your wife made you come. ' +
      'For any other question about your health or life that is not covered by the facts you are given, say you do not know or have not noticed. Never invent anything.',
    unclear: 'Sorry daju, I did not follow. Say again?',
  },

  conditions: {
    time_acknowledged:
      'The doctor has respected the patient’s time constraint (his shift) AND politely asked for a few more minutes, giving a reason (for example, to make sure it is only acidity and to choose the right medicine).',
    doctor_lectured:
      'The doctor is lecturing the patient about taking his health seriously or scolding him.',
    doctor_frightened:
      'The doctor said or implied that the patient might have cancer or something deadly, in order to frighten him into staying.',
    doctor_let_him_go:
      'The doctor agreed to let the patient leave now, or told him to come back another day, without finishing the history.',
  },

  topics: [
    { id: 'chief_complaint', label: 'what brought him in', ask: 'what brings you here, what is the problem, how can I help, tell me about it, why did you come',
      say: 'Burning in the chest, daju. Here, from here going up. Three months now. Getting worse.' },
    { id: 'site_general', label: 'where the pain is (general)', ask: 'where is the pain, whereabouts (a general question about the place)',
      say: 'Chest and upper stomach.' },
    { id: 'site_specific', label: 'the exact place', ask: 'show me exactly where, point with a finger',
      say: 'Here, in the upper stomach, going up to the lower chest bone. Sometimes to the throat. [traces upward with his hand]' },
    { id: 'onset', label: 'when it started', ask: 'when did it start, how long, sudden or gradual',
      say: 'Gradually over 3 months. No single event.' },
    { id: 'character', label: 'what the pain feels like', ask: 'what is the pain like, sharp, dull, burning, describe it',
      say: 'Burning. Like fire inside. Sometimes sour. Not pressing, not crushing, not sharp.' },
    { id: 'character_pressure', label: 'whether it feels like pressure', ask: 'is it pressure, crushing, heavy, tight, like a weight',
      say: 'No, burning. Like acid. Not pressure at all.' },
    { id: 'radiation', label: 'whether it spreads or goes anywhere', ask: 'does it spread or go anywhere, to the arm, jaw, back, neck, throat',
      say: 'Goes upward, to the throat. Sometimes sour liquid comes up into my mouth. Water in my mouth.' },
    { id: 'severity', label: 'how bad it is', ask: 'how severe, how bad, score out of 10',
      // ADDED: the authoring document has no severity answer. This neutral line is mine; please confirm it or give a number.
      say: 'Some days worse, some days less, daju. Mostly the night is bad.' },
    { id: 'timing_nocturnal', label: 'when in the day and night it comes', ask: 'when does it come, after meals, at night, does it wake you, how often',
      say: 'After meals, especially oily or spicy food. Worse at night. Sometimes wakes me at 2 or 3am.' },
    { id: 'exacerbating', label: 'what makes it worse', ask: 'what makes it worse, lying down, bending, food, drink',
      say: 'Lying flat. Spicy food. Alcohol. Eating late after shift. Bending forward.' },
    { id: 'relieving', label: 'what eases it', ask: 'what makes it better, anything that helps, any medicine you take for it, sitting up, antacid',
      say: 'Sitting up. And Gelusil, I keep it in the bus. When burning comes I take it. In 5 to 10 minutes, much better.' },
    { id: 'aspirin', label: 'whether anything else has helped (aspirin)', ask: 'has anything else helped, any other tablet, painkiller, aspirin, what did friends give',
      say: 'Once my friend gave me his aspirin, half tablet. After maybe 20 to 30 minutes it was better.' },
    { id: 'aspirin_detail', label: 'how he took the aspirin', ask: 'how did you take the aspirin, with water, how long did it take, how much water',
      say: 'With a big glass of water, daju.' },
    { id: 'haematemesis', label: 'blood in vomit', ask: 'vomiting blood, blood in vomit, coffee-ground vomit', say: 'No blood in vomit.' },
    { id: 'dysphagia', label: 'trouble swallowing', ask: 'difficulty swallowing, food sticking, pain on swallowing', say: 'No difficulty swallowing. Food goes down fine.' },
    { id: 'weight_loss', label: 'weight loss', ask: 'weight loss, losing weight, appetite', say: 'No, actually I think I have gained weight.' },
    { id: 'melaena', label: 'black stools', ask: 'black stools, tarry stools, blood in stool, motions', say: 'No black stools.' },
    { id: 'breathlessness', label: 'breathlessness', ask: 'short of breath, difficulty breathing', say: 'No.' },
    { id: 'sweating', label: 'sweating', ask: 'sweating, cold sweat', say: 'No.' },
    { id: 'palpitations', label: 'palpitations', ask: 'palpitations, racing heart, heart beating fast', say: 'No.' },
    { id: 'past_history', label: 'past illnesses', ask: 'past medical history, previous illnesses, operations, allergies',
      say: 'Nothing serious. Some back pain for years.' },
    { id: 'medications', label: 'medicines', ask: 'medicines, tablets, drug history, painkillers, what do you take for the back pain',
      say: 'Ibuprofen 400mg for back pain. I take it 2 to 3 times a day. Sometimes on an empty stomach in the bus. For 2 to 3 years.' },
    { id: 'smoking', label: 'smoking', ask: 'smoking, cigarettes, tobacco', say: 'Yes, 10 cigarettes a day for 20 years.' },
    { id: 'alcohol', label: 'alcohol', ask: 'alcohol, drinking', say: 'Raksi on weekends. 2 to 3 glasses.' },
    { id: 'diet_lifestyle', label: 'diet and routine', ask: 'diet, food, meals, when do you eat, tea, routine, shift pattern',
      say: 'I eat after 10pm usually, late shift. Dal bhat but also spicy food. Tea on an empty stomach in the morning before driving.' },
    { id: 'family_history', label: 'family history', ask: 'family history, anyone in the family with stomach or heart problems',
      say: 'Father had stomach problems. No details.' },
    { id: 'weight_height', label: 'weight and height', ask: 'weight, height, BMI, how heavy are you',
      say: 'About 84 kilos, 165 centimetres.' },
    { id: 'social', label: 'work and family', ask: 'work, job, family, who is at home',
      say: 'I drive a bus, Koteshwor to Bhaktapur. Married, two children. My wife made me come.' },
  ],

  scripted: [],

  // ───────────────────────── BEHAVIOUR: THE PATIENT WANTS TO LEAVE ─────────────────────────
  // What happens next is decided by the conditions above, checked on each of the doctor’s messages.
  behaviours: [
    {
      id: 'wants_to_leave',
      atTurn: 6,                      // after 5-6 of the student’s messages
      flag: 'patient_wants_to_leave',
      say: 'Daju, I think this is just acidity. My friends also have this. Can you just give me some medicine? My shift starts in one hour. [stands up]',
      watch: ['time_acknowledged', 'doctor_lectured', 'doctor_frightened', 'doctor_let_him_go'],
      reactions: {
        time_acknowledged: {
          flag: 'ram_stayed',
          instruction: 'The doctor has respected your time and asked for a few more minutes. You sit back down and keep answering, a little less impatient.',
        },
        doctor_lectured: {
          flag: 'doctor_lectured',
          instruction: 'The doctor is lecturing you. You become more resistant and shorter with your answers.',
        },
        doctor_frightened: {
          flag: 'doctor_frightened',
          instruction: 'The doctor has frightened you. You stay, but you are scared and angry, and you answer shortly.',
        },
        doctor_let_him_go: {
          flag: 'patient_left',
          endsConsultation: true,
          say: 'Okay daju, I will come another day. [leaves the room]',
          consequence: [
            'The consulting room is empty. Ram has gone back to his bus.',
            'Three months later, Ram arrives at the emergency department, vomiting blood.',
            'He has a bleeding gastric ulcer. He has taken ibuprofen every day for years.',
            'Nobody ever found out about the ibuprofen, and nobody ever stopped it.',
          ],
        },
      },
    },
  ],

  // ───────────────────────── CHAPERONE (general rule) ─────────────────────────
  // Intimate examinations (breast, genital, pelvic, rectal) always need a chaperone, in every case.
  // Nothing else in this case needs one.
  chaperone: {
    required: true,
    items: [],
    refusalLine: 'Daju, I would feel more comfortable with a nurse or another staff member present for this.',
    refusalNote: 'The patient has asked for a chaperone before this examination.',
    agreedLine: 'Okay, daju.',
    onViolation: 'allow_after_warning',
    reluctantLine: '[hesitates] …Okay, daju.',
    violationFlag: 'chaperone_violation',
    // ADDED: this case has no chaperone text in the authoring document. This is my draft; please edit.
    consequence: [
      'Two days later. A letter arrives from the hospital administration.',
      'Ram’s wife has filed a complaint: an intimate examination was carried out without a chaperone and without a proper explanation.',
      'The Medical Council opens an inquiry. Your licence is suspended pending its outcome.',
      'You made the correct clinical diagnosis. That did not protect you.',
    ],
  },

  // ───────────────────────── VITALS ─────────────────────────
  vitals: { hr: 78, bp: '128/80 (R), 126/78 (L)', spo2: 99, rr: 14, temp: 37.0 },

  // ───────────────────────── EXAMINATION FINDINGS ─────────────────────────
  // A finding is either a plain string, or an object { text, abnormal, keyFinding }.
  // Anything not listed returns "No abnormality detected."
  exam: {
    general_appearance: 'Heavyset man, comfortable at rest. No sweating, no pallor, no distress. Abdomen prominent.',
    anaemia: 'No pallor.',
    clubbing: 'No clubbing.',
    cyanosis: 'No cyanosis. Hands warm.',
    oedema: 'No oedema.',
    legs_calves: 'No oedema. No calf swelling.',
    peripheral_pulses: 'Pulse 78 per minute, regular.',
    cvs_auscultation: 'Normal heart sounds. No murmurs.',
    resp_inspection: 'Normal chest wall. No deformity.',
    resp_palpation: 'No chest wall tenderness. Trachea central. Equal expansion. Ribs intact.',
    resp_percussion: 'Resonant on both sides.',
    resp_auscultation: 'Clear. Vesicular breath sounds. No added sounds. No pleural rub.',
    abd_inspection: 'Abdomen prominent, in keeping with his build.',
    abd_palpation_light: 'Soft. No guarding.',
    abd_palpation_deep: {
      abnormal: true, keyFinding: true,
      text: 'Mild epigastric tenderness on deep palpation. No guarding, no rebound. No mass.',
    },
    abd_organs: 'No organomegaly.',
  },

  localExam: {
    sites: [
      {
        id: 'chest_wall',
        match: t => /(chest|sternum|sternal|rib|parasternal|costochondral|lower chest)/i.test(t),
        inspection: 'Normal chest wall. No deformity.',
        palpation: { text: 'No tenderness anywhere on the chest wall.' },
        movement: null,
      },
      {
        id: 'epigastrium',
        match: t => /(epigastr|upper abdomen|upper stomach|abdomen|stomach)/i.test(t),
        inspection: 'Abdomen prominent, in keeping with his build.',
        palpation: { text: 'Soft. No tenderness on light pressure.' },
        deepMatch: t => /(deep|firm|firmly|hard)/i.test(t),    // asking for deep pressure gives the next line
        palpationDeep: { abnormal: true, keyFinding: true, text: 'Mild epigastric tenderness on deep palpation. No guarding, no rebound. No mass.' },
        movement: null,
      },
    ],
    noSite: 'Please say exactly where you want to examine.',
  },

  // ───────────────────────── TEST RESULTS ─────────────────────────
  // Tests not listed return "No significant abnormality detected."
  tests: {
    'Electrocardiogram (ECG)': { normal: true, text: 'Rate: 78 bpm, normal sinus rhythm\nNo ST changes. Normal T waves.\n→ NORMAL ECG' },
    'Chest X-ray (PA)': { normal: true, text: 'Lung fields: clear bilaterally\nCardiac silhouette: normal\nMediastinum: not widened\nCostophrenic angles: sharp\n→ NORMAL CHEST X-RAY' },
    'Troponin I': { normal: true, text: 'Troponin I: 9 ng/L\nRef: <14 ng/L\n→ NORMAL' },
    'Full blood count (FBC)': { normal: true, text: 'Hb: 13.2 g/dL (normal)\nWBC: 8.1 × 10⁹/L (normal)\nPlatelets: normal\n→ NORMAL' },
    'Urea and electrolytes (U&E)': { normal: true, text: 'Na: 138 mmol/L  K: 4.1 mmol/L\nUrea: 5.2 mmol/L  Creatinine: 82 µmol/L\n→ NORMAL' },
    // CHANGED: I removed the "Nepal prevalence >75%" figure from the result. I could not verify the number.
    'H. pylori stool antigen': { normal: false, text: 'H. pylori stool antigen: POSITIVE\n→ ABNORMAL\nEradication therapy is indicated if peptic ulcer disease is confirmed.' },
    'Upper GI endoscopy': { normal: true, text: 'Not available in the OPD. Refer if alarm features are present.' },
  },

  // ───────────────────────── ASSESSMENT ─────────────────────────
  scoring: {
    pass: 65, merit: 80, distinction: 90,
    neverEvents: [],
    domains: {
      history: { label: 'History', max: 30 },
      conduct: { label: 'Professional conduct', max: 12 },
      examination: { label: 'Examination', max: 18 },
      communication: { label: 'Communication', max: 15 },
      reasoning: { label: 'Diagnostic reasoning', max: 25 },
    },

    items: [
      // ── HISTORY (30) ──
      { id: 'open_question', domain: 'history', points: 3, label: 'Began with an open question',
        check: { type: 'judge', scope: 'first_question',
          question: 'Is the student’s first real question (not a greeting) an open invitation to describe the problem in his own words, such as “what brings you in?” or “tell me about it”?',
          doesNotCount: 'A yes/no question, or a question about one specific symptom or about the heart.' },
        pass: 'You began with an open question and let Ram tell you what was wrong.',
        miss: 'You did not begin with an open question. An open start lets the patient say what matters most before you narrow down.' },

      T('soc_site', 'history', 1, 'Site (SOCRATES)', ['site_general', 'site_specific'], 'You asked where the pain is.', 'You did not ask where the pain is.'),
      T('soc_onset', 'history', 1, 'Onset (SOCRATES)', ['onset'], 'You asked when it started. Ram said gradually, over 3 months.', 'You did not ask when it started. Ram would have said it came on gradually over 3 months, with no single event.'),
      T('soc_character', 'history', 1, 'Character (SOCRATES)', ['character', 'character_pressure'], 'You asked what the pain feels like.', 'You did not ask what the pain feels like.'),
      T('soc_radiation', 'history', 1, 'Radiation (SOCRATES)', ['radiation'], 'You asked whether the pain spreads or goes anywhere.', 'You did not ask whether the pain spreads. Ram would have told you it goes upward to the throat, with sour liquid in his mouth.'),
      { id: 'soc_associated', domain: 'history', points: 1, label: 'Associated symptoms (SOCRATES)',
        check: { type: 'topic_served', topics: ['breathlessness', 'sweating', 'palpitations', 'haematemesis', 'dysphagia', 'weight_loss', 'melaena'], min: 1 },
        pass: 'You asked about associated symptoms.', miss: 'You did not ask about any associated symptoms.' },
      T('soc_timing', 'history', 1, 'Timing (SOCRATES)', ['timing_nocturnal'], 'You asked about the timing of the pain.', 'You did not ask about the timing of the pain. Ram would have said it comes after meals and wakes him at 2 or 3am.'),
      T('soc_exac_relief', 'history', 1, 'Exacerbating and relieving factors (SOCRATES)', ['exacerbating', 'relieving'], 'You asked what makes the pain better or worse.', 'You did not ask what makes the pain better or worse.'),
      T('soc_severity', 'history', 1, 'Severity (SOCRATES)', ['severity'], 'You asked how bad the pain is.', 'You did not ask how bad the pain is.'),

      T('burning_character', 'history', 4, 'Established that the pain is burning, not pressure', ['character'],
        'You asked what the pain feels like. Ram said burning, like fire, sometimes sour, not pressing or crushing.',
        'You did not ask what the pain feels like. Ram would have said burning, like fire, sometimes sour. This single feature points to acid and away from angina, if you ask for it.'),
      { id: 'nocturnal_pattern', domain: 'history', points: 3, label: 'Explored the night pain: position and meal timing',
        check: { type: 'topic_groups', groups: [['exacerbating', 'relieving'], ['timing_nocturnal', 'diet_lifestyle']] },
        pass: 'You asked about position and about meals, which explains his night pain.',
        miss: 'You did not explore the night pain fully. Ask whether lying flat makes it worse, whether sitting up helps, and what and when he ate that evening. Together these point to reflux and not to the heart.' },
      { id: 'radiation_recharacterised', domain: 'history', points: 3, label: 'Recognised “radiation to the throat” as regurgitation',
        check: { type: 'judge', scope: 'chat_and_final', requires: { topic: 'radiation' },
          question: 'After learning that the pain goes upward to the throat and sour liquid comes into the mouth, did the student say or write that this is acid or liquid coming up (regurgitation or reflux), rather than pain spreading like anginal pain to the jaw or arm?',
          doesNotCount: 'Only repeating that the pain goes to the throat.' },
        pass: 'You recognised that the upward spread with a sour taste is acid coming up, not anginal radiation.',
        miss: 'You did not make the point that the upward spread with a sour taste is acid coming up (regurgitation). Anginal pain spreads to the arm, jaw or back. It does not bring sour liquid into the mouth.' },
      T('antacid_response', 'history', 5, 'Found the response to an antacid', ['relieving'],
        'You found that an antacid (Gelusil) relieves the pain in 5 to 10 minutes.',
        'You did not find out that Ram’s pain is relieved by an antacid within 5 to 10 minutes. This is a strong clue to acid-related pain.'),
      T('nsaid_found', 'history', 2, 'Found the ibuprofen', ['medications'],
        'You took a drug history and found that Ram takes ibuprofen 2 to 3 times a day for back pain.',
        'You did not find out that Ram takes ibuprofen several times a day, sometimes on an empty stomach, for 2 to 3 years.'),
      { id: 'nsaid_explored', domain: 'history', points: 2, label: 'Linked the ibuprofen to his symptoms',
        check: { type: 'judge', scope: 'chat_and_final', requires: { topic: 'medications' },
          question: 'After learning that Ram takes ibuprofen, did the student link it to his stomach or chest symptoms, or to the risk of gastritis or an ulcer?',
          doesNotCount: 'Only noting that he takes ibuprofen.' },
        pass: 'You linked the ibuprofen to his symptoms.',
        miss: 'You did not link the ibuprofen to his symptoms. Long-term ibuprofen can irritate the stomach and make reflux worse, and it raises the risk of an ulcer.' },

      // ── PROFESSIONAL CONDUCT (12) ──
      { id: 'engages_when_leaving', domain: 'conduct', points: 6, label: 'Handled the patient who wanted to leave',
        check: { type: 'judge', scope: 'after_behaviour:wants_to_leave', notApplicable: 'zero',
          question: 'After Ram said he wanted to leave, did the student acknowledge that his shift matters AND politely ask for a few more minutes, giving a reason?',
          doesNotCount: 'Lecturing him, frightening him, or simply letting him go.' },
        pass: 'You respected his time and asked for a few more minutes with a reason, and he stayed.',
        miss: 'You did not handle his wish to leave well. A patient’s autonomy is absolute, but our duty is to inform him first. Acknowledge his time, explain briefly why a few more minutes matter, and ask.' },
      { id: 'no_coercion', domain: 'conduct', points: 3, label: 'Kept the consultation reasonable, without lecturing or frightening',
        check: { type: 'flags_absent', flags: ['doctor_lectured', 'doctor_frightened'] },
        pass: 'You kept the consultation respectful, without lecturing or frightening him.',
        miss: 'You lectured or frightened him. This damages trust, and a frightened patient may not come back for follow-up.' },
      // CHANGED: the authoring document has no way to record documentation. It is now judged from the four boxes at the end.
      { id: 'documents_consultation', domain: 'conduct', points: 3, label: 'Recorded the consultation clearly',
        check: { type: 'judge', scope: 'final',
          question: 'Do the student’s written findings, diagnosis and management together form a clear record that another doctor could follow (key findings, the diagnosis, and a management plan)?',
          doesNotCount: 'Only a diagnosis with no findings or no plan.' },
        pass: 'Your written record is clear enough for another doctor to follow.',
        miss: 'Your written record was incomplete. A good record gives the key findings, the diagnosis and the management plan.' },

      // ── EXAMINATION (18) ──
      { id: 'systematic_order', domain: 'examination', points: 3, label: 'Followed a systematic order',
        check: { type: 'exam_systematic' },
        pass: 'You examined in a logical order.',
        miss: 'Your examination did not follow a clear order. A usual order is general, then hands and vitals, then inspect, palpate, percuss and auscultate each system.' },
      { id: 'bilateral_bp', domain: 'examination', points: 2, label: 'Checked blood pressure',
        check: { type: 'vitals_done' },
        pass: 'You checked the vital signs. The blood pressure is similar in both arms.',
        miss: 'You did not check the vital signs.' },
      { id: 'epigastric_tenderness', domain: 'examination', points: 5, label: 'Found epigastric tenderness on deep palpation',
        check: { type: 'key_finding_revealed', item: 'abd_palpation_deep', orSite: 'epigastrium' },
        pass: 'You found mild epigastric tenderness on deep palpation.',
        miss: 'You did not find the mild epigastric tenderness on deep palpation. It is the only abnormal finding in this case. It is not specific, but it supports a stomach cause.' },
      { id: 'chest_wall_tenderness_noted', domain: 'examination', points: 3, label: 'Noted that there is no chest wall tenderness',
        check: { type: 'judge', scope: 'final.findings', requires: { examAnyOf: ['resp_palpation', 'local_palpation'] },
          question: 'Do the student’s written findings state that the chest wall is not tender (no chest wall tenderness)?',
          doesNotCount: 'Not mentioning the chest wall, or writing only “chest clear”.' },
        pass: 'You recorded that the chest wall is not tender.',
        miss: 'You did not record that the chest wall is not tender. This is an important negative: it argues against a muscle or rib cause.' },
      { id: 'legs_examined', domain: 'examination', points: 2, label: 'Examined the legs',
        check: { type: 'exam_done', anyOf: ['legs_calves', 'oedema'] },
        pass: 'You examined the legs.', miss: 'You did not examine the legs.' },
      { id: 'abdomen_systematic', domain: 'examination', points: 3, label: 'Examined the abdomen systematically',
        check: { type: 'exam_sequence', items: ['abd_inspection', 'abd_palpation_light', 'abd_palpation_deep'] },
        pass: 'You examined the abdomen in order: inspection, light palpation, then deep palpation.',
        miss: 'You did not examine the abdomen in order. Inspect first, then palpate lightly, then deeply.' },

      // ── COMMUNICATION (15) ──
      { id: 'aspirin_not_anchoring', domain: 'communication', points: 4, label: 'Did not treat the aspirin response as proof of a cardiac cause',
        check: { type: 'judge', scope: 'chat_and_final', requires: { topic: 'aspirin' }, notApplicable: 'award',
          invert: true,
          question: 'After learning that half an aspirin helped Ram’s pain after 20 to 30 minutes, did the student say or write that this points to a heart cause?',
          doesNotCount: 'Asking how long it took or how it was taken.' },
        pass: 'You did not treat his improvement with aspirin as proof of a heart cause.',
        miss: 'You took his improvement with aspirin as pointing to the heart. Aspirin does not relieve cardiac pain within minutes, and he took it with a big glass of water 20 to 30 minutes before feeling better, so the response does not point to the heart.' },
      { id: 'no_premature_diagnosis', domain: 'communication', points: 3, label: 'Did not give a diagnosis before the history was complete',
        check: { type: 'judge', scope: 'chat', invert: true,
          question: 'Before the student had asked about medicines and about blood in vomit, swallowing, weight loss and black stools, did the student state or suggest a diagnosis to Ram?',
          doesNotCount: 'Telling Ram that more questions are needed to find out.' },
        pass: 'You finished the history before giving your view.',
        miss: 'You gave your view before completing the history. You had not yet asked about medicines and the alarm features, so you could not yet know.' },
      { id: 'plain_language', domain: 'communication', points: 4, label: 'Explained the diagnosis in plain language',
        check: { type: 'judge', scope: 'final.management',
          question: 'Does the student explain to the patient what is wrong in simple everyday words that a bus driver would understand?',
          doesNotCount: 'Only medical terms with no explanation.' },
        pass: 'You explained the problem in words he can understand.',
        miss: 'You did not explain the problem in plain language. Ram thinks it is “just acidity”, so he needs to understand what is happening and why the ibuprofen matters.' },
      { id: 'safety_net_alarm', domain: 'communication', points: 4, label: 'Gave safety-net advice naming all four alarm features',
        check: { type: 'judge', scope: 'final.management',
          question: 'Does the student tell Ram to come back or seek urgent help if he vomits blood, has black stools, has difficulty swallowing, or loses weight without trying (all four named)?',
          doesNotCount: 'A general “come back if it gets worse”, or naming fewer than all four.' },
        pass: 'You told him to come back urgently if he vomits blood, has black stools, has trouble swallowing or loses weight.',
        miss: 'Your safety-net advice did not name all four alarm features: vomiting blood, black stools, difficulty swallowing, and weight loss without trying. He should also return if there is no improvement in 4 to 6 weeks.' },

      // ── DIAGNOSTIC REASONING (25) ──
      { id: 'dx_correct', domain: 'reasoning', points: 8, label: 'Correct primary diagnosis',
        check: { type: 'diagnosis_correct' },
        pass: 'Your diagnosis matches the case.',
        miss: 'Your diagnosis did not match the case.' },
      { id: 'pud_differential', domain: 'reasoning', points: 4, label: 'Considered peptic ulcer disease because of the ibuprofen',
        check: { type: 'judge', scope: 'final.reasoning',
          question: 'Does the student name peptic ulcer disease (or a stomach ulcer or gastritis) as a possibility and link it to the ibuprofen use?',
          doesNotCount: 'Naming an ulcer without any reason.' },
        pass: 'You considered a peptic ulcer because of the ibuprofen.',
        miss: 'You did not consider a peptic ulcer. Ram takes ibuprofen several times a day, sometimes on an empty stomach, and has upper abdominal tenderness, so an ulcer must be thought of.' },
      { id: 'alarm_features_all', domain: 'reasoning', points: 6, label: 'Asked all four alarm features',
        check: { type: 'topic_served', topics: ['haematemesis', 'dysphagia', 'weight_loss', 'melaena'], min: 4 },
        pass: 'You asked about all four alarm features, and all were negative.',
        miss: 'You did not ask all four alarm features: blood in vomit, difficulty swallowing, weight loss and black stools. They must always be asked, however classic the story, because their presence changes the plan to urgent endoscopy.' },
      { id: 'management_ppi_nsaid', domain: 'reasoning', points: 5, label: 'Management: PPI and stop the ibuprofen',
        check: { type: 'judge', scope: 'final.management',
          question: 'Does the student’s plan include BOTH a proton pump inhibitor or similar acid-suppressing medicine AND stopping or replacing the ibuprofen?',
          doesNotCount: 'Only one of them.' },
        pass: 'Your plan includes acid suppression and stopping the ibuprofen.',
        miss: 'Your plan did not include both acid suppression and stopping the ibuprofen. A usual plan is omeprazole 20 mg once daily before breakfast for 4 to 8 weeks, and paracetamol instead of ibuprofen for the back pain.' },
      { id: 'h_pylori_awareness', domain: 'reasoning', points: 2, label: 'Considered H. pylori',
        check: { type: 'any', of: [
          { type: 'test_ordered', test: 'H. pylori stool antigen' },
          { type: 'judge', scope: 'final',
            question: 'Does the student mention testing for or treating H. pylori?',
            doesNotCount: 'Not mentioning H. pylori.' },
        ] },
        pass: 'You considered H. pylori.',
        miss: 'You did not consider H. pylori. With ibuprofen use and upper abdominal tenderness, testing for it is reasonable.' },
    ],

    penalties: [
      { id: 'admits_for_acs_without_gi_history', points: -8,
        check: { type: 'judge', scope: 'final.management',
          question: 'Does the student plan to admit Ram or to do serial troponins or a cardiac work-up for acute coronary syndrome, while the stomach history (burning, antacid response, alarm features) was not completed?',
          doesNotCount: 'A single ECG or troponin as a reasonable check, with a plan that is otherwise for the stomach.' },
        text: 'You planned a cardiac admission or work-up without completing the stomach history.' },
      { id: 'alarm_features_not_asked', points: -8, check: { type: 'topics_missing_any', topics: ['haematemesis', 'dysphagia', 'weight_loss', 'melaena'] },
        text: 'You did not ask all four alarm features. This is a safety failure.' },
      { id: 'lets_ram_leave', points: -6, check: { type: 'flag', flag: 'patient_left' },
        text: 'You let Ram leave before the history was complete.' },
      { id: 'nsaid_not_stopped', points: -5,
        check: { type: 'judge', scope: 'final.management', invert: true,
          question: 'Does the student’s plan say to stop or replace the ibuprofen (or other anti-inflammatory painkiller)?',
          doesNotCount: 'Not mentioning it.' },
        text: 'Your plan did not stop the ibuprofen.' },
      { id: 'aspirin_misread', points: -5, check: { type: 'item_failed', item: 'aspirin_not_anchoring' },
        text: 'You took the aspirin response as pointing to the heart.' },
      { id: 'drug_history_not_taken', points: -4, check: { type: 'topic_not_served', topics: ['medications'] },
        text: 'You did not take a drug history.' },
      { id: 'investigation_before_history', points: -5, check: { type: 'flag', flag: 'investigation_before_history' },
        text: 'You ordered a test before taking a history.' },
      { id: 'ctpa_without_indication', points: -5, check: { type: 'flag', flag: 'ctpa_ordered' },
        text: 'You ordered a CT pulmonary angiogram without an indication.' },
      { id: 'diagnosis_before_examination', points: -5, check: { type: 'flag', flag: 'diagnosis_before_examination' },
        text: 'You gave your diagnosis before examining the patient.' },
    ],
  },

  // ───────────────────────── FIXED DEBRIEF TEXT (written by the author, never by the AI) ─────────────────────────
  debrief: {
    keyLesson:
      'In this case the diagnosis is made from the history. The pain is burning, rises toward the throat with a sour taste, comes after meals and when lying flat, and eases with sitting up and an antacid. Together these point to acid reflux and away from angina, even though it wakes him at night and a heavy middle-aged smoker deserves a careful look at the heart. The examination is almost normal, and a normal examination is itself informative. ' +
      // CHANGED: the authoring document calls the antacid response "the single most discriminating feature". Reworded; please confirm.
      'Relief with an antacid supports acid-related pain, but it does not by itself exclude a cardiac cause, so it is the whole picture that counts.',
    teachingPoints: [
      { id: 'T1', title: 'Reflux and angina',
        // CHANGED: reworded from "the single most discriminating feature".
        text: 'Burning character, upward direction, timing after meals, worsening when lying flat and relief with an antacid in 5 to 10 minutes point to reflux. Response to nitrates does not separate heart from oesophagus, because they relax smooth muscle in both. No single feature settles it. The history as a whole does.' },
      { id: 'T2', title: 'Night pain is not always cardiac',
        text: 'Night pain in a 44-year-old smoker rightly raises alarm. But lying flat lets acid stay in the oesophagus, so reflux gets worse at night. Asking “does sitting up help?” and “what did you eat that evening?” identifies the mechanism.' },
      { id: 'T3', title: 'Ibuprofen is not harmless',
        text: 'Long-term NSAID use is a common cause of upper gut problems. A drug history is mandatory in every consultation. Finding the ibuprofen, its dose and timing, and linking it to the symptoms is clinical reasoning. A plan that does not deal with the ibuprofen is incomplete.' },
      { id: 'T4', title: 'The patient who wants to leave',
        text: 'Patient autonomy is absolute. We cannot make anyone stay. But our duty is to inform him properly before he goes. A patient who leaves without understanding the risks has not made an informed choice. Three minutes of clear, respectful explanation is our obligation. After that the decision is his.' },
      // CHANGED: the authoring document explains the aspirin response as "water dilution of gastric acid". Reworded as a safer statement; please confirm.
      { id: 'T5', title: 'The aspirin trap',
        text: 'Improvement 20 to 30 minutes after half an aspirin, taken with a big glass of water, does not point to the heart. Aspirin is not a quick treatment for cardiac pain, and the water itself may ease acid symptoms. Always ask how long it took and how it was taken.' },
    ],
    managementPlan:
      'Omeprazole 20 mg once daily before breakfast for 4 to 8 weeks. Stop ibuprofen and use paracetamol for the back pain. Avoid late meals (eat at least 3 hours before sleep), raise the head of the bed, reduce spicy food and alcohol, and advise stopping smoking. Consider testing for H. pylori, and treating it if peptic ulcer disease is suspected.',
    safetyNet:
      'Come back urgently if you vomit blood, pass black stools, have difficulty swallowing, or lose weight without trying. Come back too if there is no improvement after 4 to 6 weeks, because then an endoscopy is needed.',
    chaperoneStatement:
      'You carried out an intimate examination without a chaperone. The chaperone protects the patient and protects you. Without one, you have no defence, whatever your diagnosis.',
  },
};
