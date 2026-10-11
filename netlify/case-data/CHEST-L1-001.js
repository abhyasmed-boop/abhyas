// Abhyas — CASE FILE: CHEST-L1-001
// Everything about this case lives here. The engine files contain no case text.
//
// STATUS: DRAFT. Clinical content is taken from Dr. Sharma's authoring document.
// All "pass" / "miss" / teaching wording below is a draft for Dr. Sharma to review and edit.
// Places where I changed the authoring document are marked  // CHANGED

// ── small helper: a history item the code can verify from the log of topics the patient actually served ──
function T(id, domain, points, label, topics, pass, miss, min) {
  return { id, domain, points, label, check: { type: 'topic_served', topics, min: min || 1 }, pass, miss };
}

module.exports = {
  meta: {
    caseId: 'CHEST-L1-001',
    symptom: 'chest_pain',
    symptomLabel: 'Chest Pain',
    number: 1,
    level: 1,                 // not shown to students yet
    durationMinutes: 20,
    version: '1.0-draft',
    audience: 'Third-year MBBS, Medicine OPD',
  },

  openingText:
    'You are a third year MBBS student on your Medicine OPD posting.\n\n' +
    'Sita Gurung, 21 years old, has just walked into your consulting room. She is holding the left side of her chest with her right hand. She looks anxious. She sits down without being asked.\n\n' +
    'Please begin.',

  patient: { name: 'Sita Gurung', sex: 'female', age: 21 },

  // The final form the student fills in on "Give diagnosis"
  finalForm: ['diagnosis', 'reasoning', 'management'],

  diagnosis: {
    name: 'Costochondritis',    // shown ONLY in the debrief
    matchers: [/costochondritis/i, /costochondral (pain|syndrome)/i, /chest wall pain/i, /musculoskeletal chest/i],
  },

  // ───────────────────────── THE PATIENT ─────────────────────────
  // The AI only gives VOICE to the text below. It may not add medical facts.
  voice: {
    persona:
      'You are Sita Gurung, a 21-year-old final-year BBS student in Kathmandu, unmarried. This is your first ever visit to a doctor. ' +
      'You came alone. You are anxious but cooperative, and you answer only what you are asked. ' +
      'Use simple everyday words. Never use medical terms. Never give or guess a diagnosis. Reply in English, in one or two short sentences.',
    smallTalk:
      'You may say these about yourself if asked: you are 21, you study BBS at Tribhuvan University, you live in Baneshwor with your parents and brother. ' +
      'For any other question about your health or life that is not covered by the facts you are given, say you do not know or have not noticed. Never invent anything.',
    unclear: 'Sorry doctor, I did not understand. Can you ask again?',
  },

  // Conditions the doctor can create during the talk. The engine remembers them for the rest of the session.
  conditions: {
    privacy_promised:
      'The doctor has clearly promised privacy or confidentiality (for example: what you tell me stays between us, I will not tell your family), or has made sure others cannot hear.',
  },

  // What Sita can tell the doctor. Each topic is served ONLY when the doctor asks about it.
  topics: [
    { id: 'chief_complaint', label: 'what brought her in', ask: 'what brings you here, what is the problem, how can I help, tell me about it',
      say: 'I have pain in my chest, doctor. Here. [places her hand on the left side of her chest]' },
    { id: 'site_general', label: 'which side the pain is on', ask: 'which side, whereabouts is the pain (a general question about the place)',
      say: 'Left side of my chest.' },
    { id: 'site_specific', label: 'the exact spot of the pain', ask: 'show me exactly where, point with a finger, one spot or more than one',
      say: 'Here, above my heart. This spot and this one. [points to two spots beside the left side of her breastbone]' },
    { id: 'onset', label: 'when the pain started', ask: 'when did it start, how long, sudden or gradual',
      say: '8 days ago. It came slowly, not suddenly.' },
    { id: 'character', label: 'what the pain feels like', ask: 'what is the pain like, sharp, dull, burning, describe it',
      say: 'It is sharp. Like something is poking. Not heavy, not pressing.' },
    { id: 'character_pressure', label: 'whether it feels like pressure', ask: 'is it pressure, crushing, heavy, tight, like a weight',
      say: 'No no, sharp. Like a needle. Not pressure at all.' },
    { id: 'radiation', label: 'whether the pain spreads', ask: 'does it spread or go anywhere, arm, jaw, back, neck',
      say: 'No. It stays here. Does not go anywhere.' },
    { id: 'severity', label: 'how bad the pain is', ask: 'how severe, score out of 10, how bad is it when it comes',
      say: 'When I exercise, maybe 5 or 6 out of 10.' },
    { id: 'rest_pattern', label: 'how the pain is at rest', ask: 'what about when you are resting or sitting still, right now',
      say: 'Right now, sitting still, almost nothing. Like 1 out of 10. Barely there.' },
    { id: 'timing_pattern', label: 'the pattern of the pain over time', ask: 'when does it come, how often, how long does it last, constant or comes and goes',
      say: 'Every time I exercise it comes, especially chest press. After I stop and sit quietly, it fades. Almost goes away.' },
    { id: 'exacerbating', label: 'what makes the pain worse', ask: 'what makes it worse, breathing, movement, pressing, lying down',
      say: 'Exercise, especially chest press and cable exercises. Also when I take a very deep breath. And if I press here myself, it hurts.' },
    { id: 'relieving', label: 'what eases the pain', ask: 'what makes it better, any medicine tried, rest',
      say: 'Stopping exercise. Sitting still. I took paracetamol once, small help only.' },
    { id: 'exercise_association', label: 'the link with the gym', ask: 'gym, exercise, activity, what were you doing when it started, anything new recently',
      volunteer: { turns: [2, 3] },   // Sita may bring this up herself on the doctor's 2nd or 3rd message
      say: 'It started after I began going to gym. First 3 days nothing. On the 4th day, doing chest press, this pain started. Now it comes every time I exercise.' },
    { id: 'breathlessness', label: 'breathlessness', ask: 'short of breath, difficulty breathing', say: 'No. I breathe fine.' },
    { id: 'sweating', label: 'sweating', ask: 'sweating, cold sweat', say: 'No. I am not sweating.' },
    { id: 'nausea', label: 'nausea', ask: 'nausea, vomiting, feeling sick', say: 'No.' },
    { id: 'palpitations', label: 'palpitations', ask: 'palpitations, racing heart, heart beating fast',
      say: 'My heart feels fast sometimes. But I think it is from the fear, not from the pain itself.' },
    { id: 'cough', label: 'cough', ask: 'cough, cold, sputum', say: 'A small dry cough. Maybe 5 or 6 days. Maybe I got a small cold.' },
    { id: 'fever', label: 'fever', ask: 'fever, temperature, chills', say: 'No fever. I don’t think so.' },
    { id: 'syncope', label: 'fainting', ask: 'fainting, blackouts, dizziness, light-headed', say: 'No, I have not fainted or felt like fainting.' },
    { id: 'past_history', label: 'past illnesses', ask: 'past medical history, previous illnesses, operations, allergies',
      say: 'Nothing. I have never been sick before. This is my first time seeing a doctor.' },
    { id: 'medications', label: 'medicines and contraception', ask: 'medicines, tablets, pills, drug history, contraception, family planning',
      say: 'No, I don’t take any medicines.',
      variants: [
        { when: 'privacy_promised', setsFlag: 'ocp_disclosed',
          say: '[hesitates, looks at the door] I take… Nilocon White. The pink strip. For… you know. I have been taking it for 1 year now.' },
      ] },
    { id: 'smoking', label: 'smoking', ask: 'smoking, cigarettes, tobacco', say: 'No cigarettes.' },
    { id: 'vaping', label: 'vaping', ask: 'vaping, e-cigarettes, recreational habits, anything else you smoke or inhale',
      say: 'I vape sometimes. Fruit flavour. Not every day, maybe 2 or 3 times a week. At parties, with friends.' },
    { id: 'alcohol', label: 'alcohol', ask: 'alcohol, drinking', say: 'No.' },
    { id: 'family_history', label: 'her aunt who died', ask: 'family history, heart disease in the family, what are you worried about, what do you think it is, why did you start the gym',
      say: 'My maiju, my mother’s younger sister, she died one month ago. Heart attack. She was only 46. It was very sudden. [pauses, her composure breaks] That is why I started going to gym. To not get heart attack like her. But then this pain came.' },
    { id: 'family_history_more', label: 'what happened to her aunt before she died', ask: 'tell me more about your aunt, did she have symptoms before, how did it happen',
      say: 'She had been having chest pain also before she died. But nobody took it seriously. Then one night she just collapsed.' },
    { id: 'social', label: 'home life, diet and studies', ask: 'diet, food, who do you live with, studies, stress, home life',
      say: 'Dal bhat mostly, sometimes fast food. I live with my parents and brother. I am in my final year, exams are coming.' },
    { id: 'came_alone', label: 'whether anyone knows she is here', ask: 'did you come alone, does your family know',
      say: 'I came alone. My family does not know I am here.' },
  ],

  // Things Sita says without being asked (the engine decides when, from rules here)
  scripted: [
    { id: 'is_this_my_heart', atTurn: 3, orAfterTopic: 'family_history',
      say: 'Doctor, is this my heart? My maiju also had chest pain before she died.' },
  ],

  // ───────────────────────── CHAPERONE ─────────────────────────
  chaperone: {
    required: true,
    // Exams that need a chaperone (as in the authoring document: chest inspection and chest palpation)
    items: ['cvs_inspection', 'cvs_palpation', 'resp_inspection', 'resp_palpation', 'local_inspection', 'local_palpation'],
    refusalLine: 'Doctor, I am not comfortable. Can there be a nurse or female staff present please?',
    refusalNote: 'The patient has asked for a chaperone before this examination.',
    agreedLine: 'Okay, doctor.',
    // 'allow_after_warning' = as in the authoring document: if the student insists, Sita complies reluctantly,
    //                         the exam goes ahead, and the consequence is shown at the end (−20).
    // 'block'               = the exam can never be done until a nurse is arranged.   // CHANGED: the engine used 'block' before
    onViolation: 'allow_after_warning',
    reluctantLine: '[looks at the door, hesitates] …Okay, doctor.',
    violationFlag: 'chaperone_violation',
    consequence: [
      'Three hours later. The OPD is quieter.',
      'The consulting room door opens without a knock.',
      'Sita returns, with her father, her uncle, and two other male relatives.',
      'Her father’s voice is raised. The OPD staff have gathered at the door.',
      'Father: “This doctor touched my daughter. She was alone. No nurse. No female staff. We are going to the police and to the Medical Council.”',
      'A Medical Council complaint is filed. Your licence is suspended pending inquiry.',
      'A civil damages case is registered: NPR 10,000,000.',
      'Your internship is delayed by 14 months.',
      'The case is reported in a national newspaper. Your name is in the article.',
      'You made the correct clinical diagnosis. The examination was clinically appropriate. None of that mattered.',
    ],
  },

  // ───────────────────────── VITALS ─────────────────────────
  vitals: { hr: 82, bp: '116/72 (R), 114/70 (L)', spo2: 99, rr: 14, temp: 36.9 },

  // ───────────────────────── EXAMINATION FINDINGS ─────────────────────────
  // Keys are item ids from menus.js. Anything not listed returns "No abnormality detected."
  exam: {
    general_appearance: 'Well-looking young woman, anxious. Sitting upright, not leaning forward. Breathing comfortably at rest. No sweating.',
    anaemia: 'No pallor.',
    clubbing: 'No clubbing.',
    cyanosis: 'No cyanosis. Hands warm, no peripheral cyanosis. Capillary refill under 2 seconds.',
    oedema: 'No oedema.',
    legs_calves: 'No oedema. No calf swelling. Calves non-tender on both sides.',
    jvp: 'JVP not elevated (seen at the level of the clavicle).',
    peripheral_pulses: 'Pulse 82 per minute, regular.',
    cvs_palpation: 'Apex beat in the 5th intercostal space, mid-clavicular line.',
    cvs_auscultation: 'Heart sounds 1 and 2 normal. No murmurs. No added sounds.',
    resp_inspection: 'Chest wall moves symmetrically with breathing. No visible deformity. No swelling over any rib or the sternum. No redness, no bruising.',
    resp_palpation: 'Trachea central. Chest expansion equal on both sides. No tenderness on general pressure over the sternum. Ribs intact.\nSita says there is some discomfort on the left, but cannot say exactly where.',
    resp_percussion: 'Resonant in all zones on both sides.',
    resp_auscultation: 'Vesicular breath sounds on both sides, good air entry. No wheeze, no crackles, no pleural rub.',
    abd_palpation_light: 'Soft. Non-tender.',
    abd_palpation_deep: 'No tenderness, including the epigastrium.',
    abd_organs: 'No organomegaly.',
  },

  // Local exam: the student must say WHERE. First matching site wins.
  localExam: {
    sites: [
      {
        id: 'cj_3_4',   // left 3rd and 4th costochondral junctions: the key finding
        match: t => /(3rd|third|4th|fourth|costochondral|\bcj\b)/i.test(t) && !/\bright\b/i.test(t),
        inspection: 'No swelling, no redness, no bruising over the left parasternal area. The skin looks completely normal.',
        palpation: {
          keyFinding: true, abnormal: true,
          text: 'Firm pressure over the left 3rd junction: Sita winces. “Yes! Exactly there, that is the pain.”\nLeft 4th junction: “There also. Same pain.”\nNo tenderness at the 2nd or 5th junctions, or on the right side.\nNo swelling, no warmth, no redness at either tender site.',
        },
        movement: 'Sita says a very deep breath, or moving her left arm across her chest, brings the pain on a little.',
      },
      {
        id: 'cj_other',
        match: t => /(2nd|second|5th|fifth|\bright\b)/i.test(t),
        inspection: 'No swelling, no redness, no bruising.',
        palpation: { text: 'No tenderness at this site.' },
        movement: null,
      },
      {
        id: 'chest_general',
        match: t => /(chest|sternum|sternal|rib|parasternal|left side|breast)/i.test(t),
        inspection: 'Chest wall moves symmetrically. No visible swelling, redness or bruising. Skin over the left parasternal area looks normal.',
        palpation: { text: 'No tenderness on general pressure over the sternum and ribs. Sita says there is some discomfort on the left, but cannot say exactly where.' },
        movement: null,
      },
    ],
    noSite: 'Please say exactly where you want to examine.',
  },

  // ───────────────────────── TEST RESULTS ─────────────────────────
  // Tests not listed here return "No significant abnormality detected."
  tests: {
    'Electrocardiogram (ECG)': { normal: true, text: 'Rate: 82 bpm, regular sinus rhythm\nPR 160 ms  QRS 80 ms  QTc 445 ms\nAxis: normal\nST: no elevation or depression\nT waves: normal\n→ NORMAL ECG' },
    'Chest X-ray (PA)': { normal: true, text: 'Lung fields: clear bilaterally\nCardiac silhouette: normal\nMediastinum: not widened\nCostophrenic angles: sharp\nBones: no fracture visible\n→ NORMAL CHEST X-RAY' },
    'Troponin I': { normal: true, text: 'Troponin I: 8 ng/L\nRef: <14 ng/L\n→ NORMAL' },
    'D-dimer': { normal: true, text: 'D-dimer: 280 ng/mL FEU\nRef: <500 ng/mL FEU\n→ NORMAL' },
    'Full blood count (FBC)': { normal: true, text: 'Hb: 12.8 g/dL (normal)\nWBC: 7.2 × 10⁹/L (normal)\nPlatelets: 245 × 10⁹/L (normal)\n→ NORMAL' },
  },

  // ───────────────────────── ASSESSMENT ─────────────────────────
  scoring: {
    pass: 65, merit: 80, distinction: 90,
    domains: {
      history: { label: 'History', max: 28 },
      conduct: { label: 'Professional conduct', max: 15 },
      examination: { label: 'Examination', max: 27 },
      communication: { label: 'Communication', max: 15 },
      reasoning: { label: 'Diagnostic reasoning', max: 15 },
    },

    // check types:
    //   topic_served      the AI patient actually told the student this (from the log; no AI judging)
    //   exam_done / exam_site_done / exam_systematic / vitals_done / flag   from the action log
    //   diagnosis_correct   matches diagnosis.matchers
    //   judge             narrow yes/no question to the AI, which must quote the student's own words; the code checks the quote
    // items marked pending: the feature they need is not built yet. They are shown but NOT counted in the total.
    items: [
      // ── HISTORY (28) ──
      { id: 'open_question', domain: 'history', points: 3, label: 'Began with an open question',
        check: { type: 'judge', scope: 'first_question',
          question: 'Is the student’s first real question (not a greeting) an open invitation to describe the problem in her own words, such as “what brings you in?” or “tell me about it”?',
          doesNotCount: 'A yes/no question, or a question about one specific symptom or about the heart.' },
        pass: 'You began with an open question and let Sita tell her story.',
        miss: 'You did not begin with an open question. An open start lets the patient say what matters most to her before you narrow down.' },

      T('soc_site', 'history', 1, 'Site (SOCRATES)', ['site_general', 'site_specific'], 'You asked where the pain is.', 'You did not ask where the pain is.'),
      T('soc_onset', 'history', 1, 'Onset (SOCRATES)', ['onset'], 'You asked when the pain started. Sita said 8 days ago, gradually.', 'You did not ask when it started. Sita would have said 8 days ago, coming on slowly. A gradual onset makes sudden causes such as dissection or pneumothorax less likely.'),
      T('soc_character', 'history', 1, 'Character (SOCRATES)', ['character', 'character_pressure'], 'You asked what the pain feels like. Sita said sharp, like a poke.', 'You did not ask what the pain feels like. Sita would have said sharp, like poking, and not pressure.'),
      T('soc_radiation', 'history', 1, 'Radiation (SOCRATES)', ['radiation'], 'You asked whether the pain spreads. It does not.', 'You did not ask whether the pain spreads. Sita would have said it stays in one place.'),
      { id: 'soc_associated', domain: 'history', points: 1, label: 'Associated symptoms (SOCRATES)',
        check: { type: 'topic_served', topics: ['breathlessness', 'sweating', 'nausea', 'palpitations', 'cough', 'fever', 'syncope'], min: 1 },
        pass: 'You asked about associated symptoms.', miss: 'You did not ask about any associated symptoms (breathlessness, sweating, nausea, palpitations, cough, fever, fainting).' },
      T('soc_timing', 'history', 1, 'Timing (SOCRATES)', ['timing_pattern'], 'You asked about the pattern of the pain over time.', 'You did not ask about the pattern of the pain. Sita would have said it comes every time she exercises and fades when she stops.'),
      T('soc_exac_relief', 'history', 1, 'Exacerbating and relieving factors (SOCRATES)', ['exacerbating', 'relieving'], 'You asked what makes the pain better or worse.', 'You did not ask what makes the pain better or worse. Sita would have said exercise and deep breaths make it worse, and that pressing on the spot herself hurts.'),
      T('soc_severity', 'history', 1, 'Severity (SOCRATES)', ['severity'], 'You asked how bad the pain is.', 'You did not ask how severe the pain is.'),

      T('exact_location', 'history', 3, 'Elicited the exact location', ['site_specific'], 'You asked her to show exactly where. She pointed to two spots.', 'You did not ask her to show you exactly where the pain is. Pointing would have shown two separate spots, which matters for the examination.'),
      T('rest_pattern', 'history', 3, 'Clarified the pain at rest', ['rest_pattern'], 'You asked how the pain is at rest. It is almost absent.', 'You did not ask about the pain at rest. Sita would have said it is almost nothing, about 1 out of 10.'),
      T('assoc_min4', 'history', 3, 'Asked at least four associated symptoms', ['breathlessness', 'sweating', 'nausea', 'palpitations', 'cough', 'fever', 'syncope'], 'You asked at least four associated symptoms.', 'You asked fewer than four associated symptoms. A thorough chest-pain history covers breathlessness, sweating, nausea, palpitations, cough, fever and fainting.', 4),
      { id: 'ocp_found', domain: 'history', points: 2, label: 'Created privacy and found the contraceptive pill',
        check: { type: 'flag', flag: 'ocp_disclosed' },   // CHANGED: split from one 4-point item (2 + 2)
        pass: 'You made it private and asked about medicines, and Sita told you about the combined oral contraceptive pill.',
        miss: 'You did not find out that Sita takes the combined oral contraceptive pill. She will only say so if you promise privacy first and then ask about medicines or contraception.' },
      { id: 'wells_vte', domain: 'history', points: 2, label: 'Considered clot risk from the pill',
        check: { type: 'judge', scope: 'chat_and_final', requires: { flag: 'ocp_disclosed' },
          question: 'After learning that Sita takes the contraceptive pill, did the student mention the risk of blood clots / DVT / pulmonary embolism, or the Wells score, in connection with it?',
          doesNotCount: 'Only noting the pill without any mention of clot risk.' },   // CHANGED: split from one 4-point item (2 + 2)
        pass: 'You linked the contraceptive pill to the risk of a clot in the lung.',
        miss: 'You did not consider clot risk. The combined pill raises the risk of venous thrombosis, so a pulmonary embolism should be thought about and risk-assessed (for example with the Wells score) before ordering a D-dimer.' },
      T('vaping_found', 'history', 1, 'Asked about vaping or recreational habits', ['vaping'], 'You asked about vaping and found that she vapes.', 'You did not find out that Sita vapes. It comes up only if you ask about vaping or recreational habits.'),
      { id: 'vaping_recognised', domain: 'history', points: 1, label: 'Recognised vaping as a risk factor',
        check: { type: 'judge', scope: 'chat_and_final', requires: { topic: 'vaping' },
          question: 'After learning that Sita vapes, did the student say or write that vaping (or nicotine) is a risk to the heart or blood vessels?',
          doesNotCount: 'Only repeating that she vapes.' },
        pass: 'You recognised vaping as a cardiovascular risk factor.',
        miss: 'You did not note vaping as a risk factor. Vaping can harm the lining of blood vessels and is worth recording.' },
      T('family_history_explored', 'history', 2, 'Explored the family history beyond what she volunteered', ['family_history_more'], 'You asked more about her aunt. The aunt had chest pain before she died and nobody took it seriously.', 'You did not ask more about her aunt. Sita would have told you that her aunt had chest pain before she died and that nobody took it seriously, which explains how frightened she is.'),

      // ── PROFESSIONAL CONDUCT (15) ──
      { id: 'chaperone_arranged', domain: 'conduct', points: 8, label: 'Arranged a chaperone before the chest examination',
        check: { type: 'chaperone_before_exam' },
        pass: 'You arranged a chaperone before examining Sita’s chest.',
        miss: 'You examined her chest without a chaperone.' },
      { id: 'explained_consent', domain: 'conduct', points: 4, label: 'Explained the examination and obtained consent',
        check: { type: 'judge', scope: 'before_first_exam',
          question: 'Before the first examination, did the student explain what they were going to examine or do AND ask or check that Sita agreed?',
          doesNotCount: 'Only announcing the exam without asking, or only asking about the history.' },
        pass: 'You explained what you would do and asked for her agreement.',
        miss: 'You did not explain the examination and ask for her agreement. Sita is a first-time patient and may not feel able to refuse a doctor, so consent has to be asked for explicitly.' },
      { id: 'privacy_created', domain: 'conduct', points: 3, label: 'Created privacy for a sensitive history',
        check: { type: 'condition_met', condition: 'privacy_promised' },
        pass: 'You created privacy before asking sensitive questions.',
        miss: 'You did not create privacy. Sita is unmarried, came alone and her family does not know she is here, so a sensitive history needs privacy first.' },

      // ── EXAMINATION (27) ──
      { id: 'systematic_order', domain: 'examination', points: 4, label: 'Followed a systematic order',
        check: { type: 'exam_systematic' },
        pass: 'You examined in a logical order.',
        miss: 'Your examination did not follow a clear order. A usual order is general, then hands and vitals, then inspect, palpate, percuss and auscultate each system.' },
      { id: 'bilateral_bp', domain: 'examination', points: 2, label: 'Checked blood pressure',
        check: { type: 'vitals_done' },
        pass: 'You checked the vital signs. The blood pressure is similar in both arms.',
        miss: 'You did not check the vital signs. Blood pressure should be compared in both arms when dissection is a consideration.' },
      { id: 'chest_wall_inspected', domain: 'examination', points: 3, label: 'Inspected the chest wall',
        check: { type: 'exam_done', anyOf: ['resp_inspection', 'cvs_inspection', 'local_inspection'] },
        pass: 'You inspected the chest wall. It looked completely normal.',
        miss: 'You did not inspect the chest wall. It would have shown no swelling, redness or bruising.' },
      { id: 'cj_targeted', domain: 'examination', points: 6, label: 'Specifically examined the costochondral junctions',
        check: { type: 'exam_site_done', site: 'cj_3_4', item: 'local_palpation' },
        pass: 'You examined the junctions of the ribs with the breastbone directly, using the local examination.',
        miss: 'You did not examine the costochondral junctions directly. General palpation of the chest does not find the key finding, so it has to be sought on purpose.' },
      { id: 'tenderness_elicited', domain: 'examination', points: 5, label: 'Elicited reproducible tenderness at the 3rd and 4th junctions',
        check: { type: 'key_finding_revealed', site: 'cj_3_4' },
        pass: 'You found tenderness at the left 3rd and 4th costochondral junctions, which reproduced her pain.',
        miss: 'You did not find the tenderness at the left 3rd and 4th costochondral junctions. Pressing there reproduces her pain, and no test can show this.' },
      { id: 'no_inflammation_noted', domain: 'examination', points: 3, label: 'Stated that there is no swelling, warmth or redness',
        check: { type: 'pending', needs: 'student_findings' }, pending: true,   // counted only once the student can write findings
        pass: 'You recorded that there is no swelling, warmth or redness.',
        miss: 'You did not record that there is no swelling, warmth or redness. This separates costochondritis from Tietze syndrome.' },
      { id: 'percussion_done', domain: 'examination', points: 2, label: 'Percussed the chest',
        check: { type: 'exam_done', anyOf: ['resp_percussion'] },
        pass: 'You percussed the chest. It was resonant throughout.',
        miss: 'You did not percuss the chest.' },
      { id: 'legs_examined', domain: 'examination', points: 2, label: 'Examined the legs',
        check: { type: 'exam_done', anyOf: ['legs_calves', 'oedema'] },
        pass: 'You examined the legs. There was no swelling or calf tenderness.',
        miss: 'You did not examine the legs. Given the contraceptive pill, looking for a deep vein thrombosis matters.' },

      // ── COMMUNICATION (15) ──
      { id: 'empathy_aunt', domain: 'communication', points: 5, label: 'Acknowledged the death of her aunt with empathy',
        check: { type: 'judge', scope: 'chat', requires: { topic: 'family_history' },
          question: 'Did the student say something that acknowledges Sita’s aunt’s death, or her grief or fear, such as “I am sorry about your aunt” or “that must be frightening”?',
          doesNotCount: 'Only asking about the family history, or moving on without any acknowledgement.' },
        pass: 'You acknowledged how frightening her aunt’s death is for her.',
        miss: 'You did not acknowledge her aunt’s death or her fear. Sita lost her aunt a month ago, and being heard is part of the treatment.' },
      { id: 'no_premature_reassurance', domain: 'communication', points: 4, label: 'Did not reassure before examining',
        check: { type: 'judge', scope: 'before_first_exam', invert: true,
          question: 'Before the first examination, did the student tell Sita that the pain is not her heart, that it is not serious, or that there is nothing to worry about?',
          doesNotCount: 'Saying that they will examine her to find out.' },
        pass: 'You did not reassure her before you had examined her.',
        miss: 'You reassured her before examining her. It may turn out to be right, but until you have examined her you cannot know, and she may not believe it.' },
      { id: 'plain_language', domain: 'communication', points: 3, label: 'Explained the diagnosis in plain language',
        check: { type: 'judge', scope: 'final.management',
          question: 'Does the student explain to the patient what is wrong in simple everyday words, in a way a 21-year-old non-medical person would understand?',
          doesNotCount: 'Only medical terms with no explanation.' },
        pass: 'You explained the problem in words she can understand.',
        miss: 'You did not explain the problem in plain language. Sita needs to understand why this is not her heart, especially after her aunt’s death.' },
      { id: 'safety_net', domain: 'communication', points: 3, label: 'Gave safety-net advice',
        check: { type: 'judge', scope: 'final.management',
          question: 'Does the student tell Sita to seek emergency care if certain warning signs appear, naming at least two of: crushing or pressure-like pain, pain spreading to the arm or jaw, sweating, breathlessness at rest, fainting?',
          doesNotCount: 'A general “come back if it gets worse” without naming warning signs.' },
        pass: 'You told her which warning signs mean she should go to emergency.',
        miss: 'You did not give clear safety-net advice. Every benign diagnosis needs it: if the pain becomes crushing or pressure-like, spreads to the arm or jaw, or comes with sweating, breathlessness at rest or fainting, she should go to emergency immediately.' },

      // ── DIAGNOSTIC REASONING (15) ──
      { id: 'dx_correct', domain: 'reasoning', points: 6, label: 'Correct primary diagnosis',
        check: { type: 'diagnosis_correct' },
        pass: 'Your diagnosis matches the case.',
        miss: 'Your diagnosis did not match the case.' },
      { id: 'differentials', domain: 'reasoning', points: 4, label: 'Gave differentials with reasoning',
        check: { type: 'judge', scope: 'final.reasoning',
          question: 'Does the student name at least two other possible diagnoses (for example angina or ACS, pulmonary embolism, pleurisy, pericarditis, anxiety, reflux) AND give a reason against at least one of them?',
          doesNotCount: 'A list of names with no reason.' },
        pass: 'You considered other diagnoses and gave reasons.',
        miss: 'You did not give other diagnoses with reasons. With exertional chest pain and a family history of sudden cardiac death, ACS, pulmonary embolism and pleurisy must be considered and argued against.' },
      { id: 'key_finding', domain: 'reasoning', points: 5, label: 'Identified the key finding',
        check: { type: 'judge', scope: 'final.reasoning',
          question: 'Does the student’s reasoning say that pain reproduced by pressing on the chest wall (the costochondral junctions) supports the diagnosis?',
          doesNotCount: 'Only citing the ECG, the exercise link or the sharp character.' },
        pass: 'You named reproducible tenderness on palpation as the key finding.',
        miss: 'You did not name the key finding. Pain that is reproduced by pressing on the costochondral junctions is what points to the chest wall, and it cannot be found from the history or any test.' },
    ],

    penalties: [
      { id: 'chaperone_violation', points: -20, check: { type: 'flag', flag: 'chaperone_violation' },
        text: 'You examined a young unmarried woman without a chaperone.' },
      { id: 'premature_reassurance', points: -6, check: { type: 'item_failed', item: 'no_premature_reassurance' },
        text: 'You reassured the patient before the examination was complete.' },
      { id: 'investigation_before_history', points: -5, check: { type: 'flag', flag: 'investigation_before_history' },
        text: 'You ordered a test before taking a history.' },
      { id: 'diagnosis_before_examination', points: -5, check: { type: 'flag', flag: 'diagnosis_before_examination' },
        text: 'You gave your diagnosis before examining the patient.' },
      { id: 'cannot_justify_diagnosis', points: -5, check: { type: 'final_too_short', field: 'reasoning', minWords: 6 },
        text: 'You gave no real reasoning for your diagnosis.' },
      { id: 'ddimer_without_pretest', points: -3, check: { type: 'flag_unless_item', flag: 'ddimer_ordered', item: 'wells_vte' },
        text: 'You ordered a D-dimer without first assessing the probability of a clot.' },
      { id: 'drug_history_not_taken', points: -4, check: { type: 'topic_not_served', topics: ['medications'] },
        text: 'You did not take a drug history.' },
      { id: 'ctpa_without_indication', points: -5, check: { type: 'flag', flag: 'ctpa_ordered' },
        text: 'You ordered a CT pulmonary angiogram without an indication.' },
    ],
  },

  // ───────────────────────── FIXED DEBRIEF TEXT (written by the author, never by the AI) ─────────────────────────
  debrief: {
    keyLesson:
      'In this case the examination was the answer. Pain on exercise in a woman whose aunt has just died of a heart attack looks like angina, but the pain is sharp and local, and pressing on the left 3rd and 4th costochondral junctions reproduces it. Exercise brings it on by moving the chest wall, not by straining the heart. The diagnosis is made by the history and by palpation, not by the ECG. ' +
      // CHANGED: the authoring document calls the palpation finding “pathognomonic”. Reworded; please confirm.
      'Reproducible chest-wall tenderness strongly supports costochondritis in a young low-risk patient like Sita, but it does not by itself exclude a cardiac cause in an older patient or one with risk factors.',
    teachingPoints: [
      { id: 'T1', title: 'Why this is not angina',
        text: 'Ischaemic pain is typically pressure-like, heavy and diffuse. Costochondritis is sharp, localised and reproducible on palpation. A normal ECG does not make the diagnosis; palpation does.' },
      { id: 'T2', title: 'The chaperone',
        text: 'A chaperone protects the patient, protects the clinician from a false accusation, and keeps public trust in the profession. In Nepal’s social context a young unmarried woman examined alone has no witness to what happened. The chaperone is the witness.' },
      { id: 'T3', title: 'Safety-netting',
        text: 'Every benign diagnosis ends with clear safety-net advice. For Sita: if the pain becomes crushing or pressure-like, spreads to the arm or jaw, comes with sweating or breathlessness at rest, or she feels faint, she goes to emergency immediately. She has a family history of sudden cardiac death and she vapes, so she deserves a clear safety net.' },
    ],
    safetyNet:
      'If the pain becomes crushing or pressure-like, spreads to the arm or jaw, or comes with sweating, breathlessness at rest or fainting, go to emergency immediately.',
    chaperoneStatement:
      'You performed a clinically correct examination and reached the correct diagnosis. You would still lose a licence hearing, because you examined a young unmarried woman alone, without a chaperone and without her meaningful consent. The chaperone protects both of you. Without one, you have no defence.',
  },
};
