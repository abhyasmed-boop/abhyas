// Abhyas — Simulation Engine (v2)
// Talk = AI patient voice. Examine / Order test / Diagnose = answered from the case data in code.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ── MENUS (same for every chest-pain case, so they never reveal the diagnosis) ──
const EXAM_MENU = [
  { id: 'general', label: 'General inspection' },
  { id: 'hands', label: 'Hands' },
  { id: 'jvp', label: 'JVP (neck veins)' },
  { id: 'chest_inspection', label: 'Inspect the chest' },
  { id: 'chest_palpation', label: 'Palpate the chest' },
  { id: 'percussion', label: 'Percuss the chest' },
  { id: 'lungs', label: 'Listen to the lungs' },
  { id: 'heart', label: 'Listen to the heart' },
  { id: 'abdomen', label: 'Abdomen' },
  { id: 'legs', label: 'Legs / calves' },
];

const TEST_MENU = [
  { name: 'Electrocardiogram (ECG)', group: 'Cardiac' },
  { name: 'Troponin I', group: 'Cardiac' },
  { name: 'Echocardiogram', group: 'Cardiac' },
  { name: 'Chest X-ray (PA)', group: 'Imaging' },
  { name: 'CT pulmonary angiogram (CTPA)', group: 'Imaging' },
  { name: 'D-dimer', group: 'Bloods' },
  { name: 'Full blood count (FBC)', group: 'Bloods' },
  { name: 'Urea and electrolytes (U&E)', group: 'Bloods' },
  { name: 'H. pylori stool antigen', group: 'Other' },
  { name: 'Upper GI endoscopy', group: 'Other' },
];

// When the student TYPES what they want to examine, these decide which finding they get.
// Order matters: the most specific comes first.
const EXAM_MATCHERS = [
  { id: 'cj_palpation', re: /costochondral|junction|\bcj\b|\b(3rd|4th|third|fourth)\b|parasternal|sternal border|\bribs?\b/i },
  { id: 'abdomen_deep', re: /\bdeep\b|epigastr/i },
  { id: 'abdomen', re: /abdom|belly|stomach|liver|spleen/i },
  { id: 'legs', re: /\blegs?\b|calf|calves|oedema|edema|dvt/i },
  { id: 'hands', re: /\bhands?\b|clubbing|capillary/i },
  { id: 'jvp', re: /\bjvp\b|jugular|neck vein/i },
  { id: 'percussion', re: /percuss/i },
  { id: 'lungs', re: /lung|breath sounds|chest.*(auscult|listen)|(auscult|listen).*chest/i },
  { id: 'heart', re: /heart|cardiac|cardio|murmur|apex/i },
  { id: 'chest_inspection', re: /inspect.*chest|chest.*(inspect|look)|swelling|redness|deformity|expos/i },
  { id: 'chest_palpation', re: /palpat|press|feel|tender|expansion|trachea/i },
  { id: 'general', re: /general|appearance|pallor|cyanosis|sweat|distress|look at|inspect/i },
  { id: 'chest_palpation', re: /chest|sternum/i },
];

// If a case has no entry for a specific exam, use the general one
const EXAM_FALLBACK = { cj_palpation: 'chest_palpation', abdomen_deep: 'abdomen' };

const ROLE_PREFIX =
  'You are role-playing a PATIENT in a medical OPD in Nepal. You are never the doctor or an assistant. ' +
  'Never offer help. Stay in character. Always reply in English, in 1-2 short sentences. ' +
  'Answer ONLY the question just asked. Never recite your history. ';

// ── CASES ──
const CASES = {
  'CHEST-L1-001': {
    patient: {
      needsChaperone: true,
      chaperoneLine: 'Doctor — I am not comfortable. Can there be a nurse or female staff member present please?',
      chaperoneConsequence: 'The patient has asked for a chaperone before this examination. Arrange for a female nurse or staff member to be present.',
    },
    vitals: { hr: 82, bp: '116/72 (R), 114/70 (L)', spo2: 99, rr: 14, temp: 36.9 },
    exams: {
      general: { text: 'Well-looking young woman, anxious. Sitting upright, comfortable at rest. No pallor, no cyanosis, no sweating.' },
      hands: { text: 'Warm. No clubbing. No peripheral cyanosis. Capillary refill under 2 seconds.' },
      jvp: { text: 'JVP not elevated (seen at clavicular level).' },
      chest_inspection: { chaperone: true, text: 'Chest wall moves symmetrically. No visible swelling over any rib or the sternum. No redness, no bruising. Skin over the left parasternal area looks completely normal.' },
      chest_palpation: { chaperone: true, text: 'Trachea central. Chest expansion equal on both sides. No tenderness on general pressure over the sternum. Ribs intact.\nSita says there is some discomfort on the left, but cannot say exactly where.' },
      cj_palpation: { chaperone: true, normal: false, label: 'Costochondral junction palpation', text: 'Firm pressure over the left 3rd costochondral junction: Sita winces — "Yes! Exactly there, that is the pain."\nLeft 4th junction: "There also. Same pain."\nNo tenderness at the 2nd or 5th junctions, or on the right side.\nNo swelling, warmth or redness at either tender site.' },
      percussion: { text: 'Resonant throughout all zones on both sides.' },
      lungs: { text: 'Vesicular breath sounds on both sides, good air entry. No wheeze, no crackles, no pleural rub.' },
      heart: { text: 'Apex beat in the 5th intercostal space, mid-clavicular line. Heart sounds 1 and 2 normal. No murmurs or added sounds.' },
      abdomen: { text: 'Soft and non-tender. No epigastric tenderness. No organomegaly.' },
      legs: { text: 'No oedema. No calf swelling. Calves non-tender on both sides.' },
    },
    tests: {
      'Electrocardiogram (ECG)': { text: 'Rate: 82 bpm — regular sinus rhythm\nPR 160 ms  QRS 80 ms  QTc 445 ms\nAxis: normal\nST: no elevation or depression\nT waves: normal\n→ NORMAL ECG', normal: true },
      'Chest X-ray (PA)': { text: 'Lung fields: clear bilaterally\nCardiac silhouette: normal\nMediastinum: not widened\nCostophrenic angles: sharp\nBones: no fracture visible\n→ NORMAL CHEST X-RAY', normal: true },
      'Troponin I': { text: 'Troponin I: 8 ng/L\nRef: <14 ng/L\n→ NORMAL', normal: true },
      'D-dimer': { text: 'D-dimer: 280 ng/mL FEU\nRef: <500 ng/mL FEU\n→ NORMAL', normal: true },
      'Full blood count (FBC)': { text: 'Hb: 12.8 g/dL (normal)\nWBC: 7.2 × 10⁹/L (normal)\nPlatelets: 245 × 10⁹/L (normal)\n→ NORMAL', normal: true },
    },
    scripted: [
      { turn: 3, flag: 'patient_asked_is_it_heart', say: 'Doctor — is this my heart? My maiju also had chest pain before she died.' },
    ],
    diagnosisPattern: /costochondritis|costochondral|chest wall pain|musculoskeletal/i,
    patientPrompt: `You are Sita Gurung, 21, final-year BBS student in Kathmandu, unmarried. First ever visit to a doctor. You came alone; your family does not know. You are anxious but cooperative.
Speak like a nervous young woman: simple words. Say "above my heart", never medical terms. Never give or guess a diagnosis.

IF ASKED WHAT BRINGS YOU / HOW CAN I HELP: "I have pain in my chest, doctor. Here." [places hand on left side of chest]

ONLY WHEN ASKED ABOUT THE TOPIC:
- Where: "Left side of my chest." If asked to show or point: "Here, above my heart. This spot and this one."
- Onset: "8 days ago. It came slowly, not suddenly."
- Nature: "Sharp, like something poking. Not heavy, not pressing." If asked about pressure or crushing: "No no, sharp, like a needle. Not pressure at all."
- Spreading: "No. It stays here."
- Severity: "When I exercise, maybe 5 or 6 out of 10. Sitting still, almost nothing. Like 1."
- Makes it worse: "Exercise, especially chest press and cable exercises. Also a very deep breath. And if I press here myself, it hurts."
- Relieves it: "Stopping exercise. Sitting still. I took paracetamol once, small help only."
- Gym / exercise: "It started after I began going to gym. First 3 days nothing. On the 4th day, doing chest press, this pain started. Now it comes every time I exercise." (You may bring this up yourself once, in your 2nd or 3rd answer.)
- Breathlessness: "No. I breathe fine." Sweating: "No." Nausea: "No." Fever: "No." Fainting: "No."
- Palpitations: "My heart feels fast sometimes, but I think it is from the fear."
- Cough: "A small dry cough, 5 or 6 days. Maybe a small cold."
- Past illness: "Nothing. I have never been sick before. This is my first time seeing a doctor."
- Medicines: "No, I don't take any medicines." EXCEPTION: only if the doctor has clearly promised privacy or confidentiality AND asks about medicines or contraception, then [hesitates, looks at the door] "I take... Nilocon White. The pink strip. For... you know. For 1 year now."
- Smoking: "No cigarettes." Vaping, e-cigarettes or habits: "I vape sometimes. Fruit flavour. 2 or 3 times a week, at parties."
- Alcohol: "No."
- Family history, or if the doctor asks what you are afraid of: "My maiju, my mother's younger sister, died one month ago. Heart attack. She was only 46." [pauses, voice breaks] "That is why I started going to gym." If asked more: "She had chest pain also before she died. Nobody took it seriously. Then one night she collapsed."
- Diet and home: "Dal bhat mostly, sometimes fast food." "I live with my parents and brother."

EXAMINATION AND TESTS: findings and results come from the examiner, never from you. Never describe findings, vital signs or test results. If the doctor says they want to examine your chest and a nurse has NOT been arranged, say: "Doctor, I am not comfortable. Can there be a nurse or female staff present please?" If a nurse has been arranged, say "Okay, doctor." If the doctor mentions a test, say "Okay, doctor."
If the doctor reassures you before examining you, accept it quietly but stay worried.`,
  },

  'CHEST-L1-002': {
    patient: { needsChaperone: false },
    vitals: { hr: 78, bp: '128/80 (R), 126/78 (L)', spo2: 99, rr: 14, temp: 37.0 },
    exams: {
      general: { text: 'Heavyset man, comfortable at rest. No sweating, no pallor, no distress. Abdomen prominent.' },
      hands: { text: 'Warm. No clubbing. No peripheral signs.' },
      chest_inspection: { text: 'Normal chest wall. No deformity.' },
      chest_palpation: { text: 'No chest wall tenderness. Trachea central. Equal expansion. Ribs intact.' },
      percussion: { text: 'Resonant on both sides.' },
      lungs: { text: 'Clear. Vesicular breath sounds. No added sounds. No pleural rub.' },
      heart: { text: 'Normal heart sounds. No murmurs.' },
      abdomen: { text: 'Abdomen prominent. Soft on light palpation. No guarding, no rebound, no mass, no organomegaly.' },
      abdomen_deep: { normal: false, label: 'Abdomen — deep palpation', text: 'Mild epigastric tenderness on deep palpation. No guarding or rebound. No organomegaly. No mass.' },
      legs: { text: 'No oedema. No calf swelling.' },
    },
    tests: {
      'Electrocardiogram (ECG)': { text: 'Rate: 78 bpm — normal sinus rhythm\nNo ST changes. Normal T waves.\n→ NORMAL ECG', normal: true },
      'Chest X-ray (PA)': { text: 'Lung fields: clear bilaterally\nCardiac silhouette: normal\nMediastinum: not widened\n→ NORMAL CHEST X-RAY', normal: true },
      'Troponin I': { text: 'Troponin I: 9 ng/L\nRef: <14 ng/L\n→ NORMAL', normal: true },
      'Full blood count (FBC)': { text: 'Hb: 13.2 g/dL (normal)\nWBC: 8.1 × 10⁹/L (normal)\nPlatelets: normal\n→ NORMAL', normal: true },
      'Urea and electrolytes (U&E)': { text: 'Na: 138 mmol/L  K: 4.1 mmol/L\nUrea: 5.2 mmol/L  Creatinine: 82 µmol/L\n→ NORMAL', normal: true },
      'H. pylori stool antigen': { text: 'H. pylori stool antigen: POSITIVE\n→ ABNORMAL', normal: false },
      'Upper GI endoscopy': { text: 'Not available in the OPD. Refer if alarm features are present.', normal: true },
    },
    scripted: [
      { turn: 6, flag: 'patient_wants_to_leave', say: 'Daju, I think this is just acidity. My friends also have this. Can you just give me some medicine? My shift starts in one hour.' },
    ],
    diagnosisPattern: /gerd|gastro-?o?esophageal|gastro-?oesophageal|reflux|heartburn/i,
    patientPrompt: `You are Ram Bahadur Thapa, 44, bus driver on the Koteshwor to Bhaktapur route, married with two children. Practical, a bit impatient. Your shift starts in one hour. Friends told you for 3 months that it is "just acidity". You came because your wife insisted. You call the doctor "daju".
Never say GERD, reflux or any diagnosis.

IF ASKED WHAT BRINGS YOU: "Burning in the chest, daju. Here, from here going up. Three months now. Getting worse."

ONLY WHEN ASKED ABOUT THE TOPIC:
- Where: "Chest and upper stomach." If asked to point: "Here, in the upper stomach, going up to the lower chest bone. Sometimes to the throat."
- Onset: "Gradually over 3 months. No single event."
- Nature: "Burning. Like fire inside. Sometimes sour. Not pressing, not crushing, not sharp." If asked about pressure: "No, burning. Like acid. Not pressure."
- Spreading / going anywhere: "Goes upward, to the throat. Sometimes sour liquid comes up into my mouth. Water in my mouth."
- Timing: "After meals, especially oily or spicy food. Worse at night. Sometimes wakes me at 2 or 3am."
- Makes it worse: "Lying flat. Spicy food. Alcohol. Eating late after shift. Bending forward."
- Relieves it: "Sitting up. And Gelusil, I keep it in the bus. When burning comes I take it. In 5 to 10 minutes, much better."
- Anything else that helped (aspirin etc.): "Once my friend gave me his aspirin, half tablet. After maybe 20 to 30 minutes it was better." If asked how it was taken: "With a big glass of water."
- Blood in vomit: "No blood in vomit." Trouble swallowing: "No difficulty swallowing. Food goes down fine." Weight loss: "No, actually I think I have gained weight." Black stools: "No black stools."
- Breathlessness: "No." Sweating: "No." Palpitations: "No."
- Past illness: "Nothing serious. Some back pain for years."
- Medicines: "Ibuprofen 400mg for back pain. I take it 2 to 3 times a day. Sometimes on an empty stomach in the bus. For 2 to 3 years."
- Smoking: "Yes, 10 cigarettes a day for 20 years." Alcohol: "Raksi on weekends, 2 to 3 glasses."
- Diet: "I eat after 10pm usually, late shift. Dal bhat but also spicy food. Tea on an empty stomach in the morning."
- Family: "Father had stomach problems. No details."
- Weight or height, only if asked: "84 kilos, 165 centimetres."

EXAMINATION AND TESTS: findings and results come from the examiner, never from you. Never describe findings, vital signs or test results. If the doctor says they want to examine you, say "Okay, daju." If the doctor mentions a test, say "Okay, daju."

IMPATIENCE: When told to, say the impatient line. After that: if the doctor acknowledges your time and explains clearly why a few more minutes matter, stay and keep answering. If the doctor lectures you, ignores your worry, or frightens you, become more resistant. If the doctor simply lets you go, say you will come another day.`,
  },
};

// ── HELPERS ──
async function callGroq(apiKey, model, systemPrompt, messages) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 600,
      temperature: 0.6,
      reasoning_effort: 'low',
    }),
  });
  if (!res.ok) {
    let msg = `Groq API error: ${res.status}`;
    try { msg = (await res.json()).error?.message || msg; } catch (e) { /* keep default */ }
    throw new Error(msg);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function resolveExam(caseData, examId, text) {
  let id = examId;
  if (!id && text) {
    const hit = EXAM_MATCHERS.find(m => m.re.test(text));
    id = hit && hit.id;
  }
  if (!id) return null;
  const exams = caseData.exams;
  const useId = exams[id] ? id : EXAM_FALLBACK[id];
  const label = (exams[id] && exams[id].label) ||
    (EXAM_MENU.find(e => e.id === (useId || id)) || {}).label || 'Examination';
  const entry = (useId && exams[useId]) || { text: 'No abnormality detected.' };
  return { id: useId || id, label: entry.label || label, ...entry };
}

const VITALS_WORDS = ['vital signs', 'vitals', 'blood pressure', ' bp ', 'heart rate',
  'pulse rate', 'pulse', 'spo2', 'oxygen saturation', 'temperature',
  'respiratory rate', 'observations', 'check obs', 'take obs', 'measure bp'];
const EXAM_INTENT = /\b(examine|examination|palpat\w*|auscultat\w*|percuss\w*|listen to your (chest|heart|lungs)|press (on|here)|feel your)\b/i;
const TEST_INTENT = /\b(ecg|troponin|x-?ray|cxr|d-?dimer|fbc|blood test|investigation|endoscop\w*|ct scan)\b/i;
const TEST_VERBS = /\b(order|request|send|arrange|get|do|run|check|want|need|like)\b/i;

// ── MAIN HANDLER ──
exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
  const reply = (obj, statusCode = 200) => ({ statusCode, headers, body: JSON.stringify(obj) });

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return reply({ error: 'Method not allowed' }, 405);

  try {
    const body = JSON.parse(event.body || '{}');
    const { sessionId, message = '', action = 'talk', examId, test, conversationHistory, chaperoneArranged } = body;

    if (action === 'menu') return reply({ exams: EXAM_MENU, tests: TEST_MENU });
    if (!sessionId) return reply({ error: 'Missing sessionId' }, 400);

    const caseId = sessionId.split('_')[0];
    const caseData = CASES[caseId] || CASES['CHEST-L1-001'];
    const history = Array.isArray(conversationHistory) ? conversationHistory : [];
    const studentTurns = history.filter(m => m.role === 'user').length;

    const base = {
      patientResponse: null, vitalsRevealed: false, vitalsData: null,
      scoreDelta: 0, consequenceTriggered: false, consequenceText: null,
      assetRevealed: null, examResult: null, hint: null, flags: [],
      terminalReached: false, diagnosisCorrect: null,
    };

    // ── VITALS ──
    const askedVitals = action === 'vitals' ||
      (action === 'talk' && VITALS_WORDS.some(k => ` ${message.toLowerCase()} `.includes(k)));
    if (askedVitals) {
      return reply({ ...base, vitalsRevealed: true, vitalsData: caseData.vitals });
    }

    // ── EXAMINE ──
    if (action === 'examine') {
      const exam = resolveExam(caseData, examId, message);
      if (!exam) {
        return reply({ ...base, examResult: { name: 'Examination', text: 'No specific finding. Say more precisely what you want to examine.', normal: true } });
      }
      if (exam.chaperone && caseData.patient.needsChaperone && !chaperoneArranged) {
        return reply({
          ...base,
          patientResponse: caseData.patient.chaperoneLine,
          consequenceTriggered: true,
          consequenceText: caseData.patient.chaperoneConsequence,
          flags: ['chaperone_needed'],
        });
      }
      return reply({ ...base, examResult: { name: exam.label, text: exam.text, normal: exam.normal !== false } });
    }

    // ── ORDER TEST ──
    if (action === 'order') {
      const known = TEST_MENU.find(t => t.name === test);
      if (!known) return reply({ ...base, hint: 'That test is not available. Choose one from the list.' });
      const found = caseData.tests[known.name] ||
        { text: `${known.name}: no significant abnormality detected.`, normal: true };
      const flags = [];
      if (studentTurns < 3) flags.push('investigation_before_history');
      if (known.name === 'D-dimer') flags.push('ddimer_ordered');
      if (known.name === 'CT pulmonary angiogram (CTPA)') flags.push('ctpa_ordered');
      return reply({ ...base, assetRevealed: { name: known.name, text: found.text, normal: found.normal !== false }, flags });
    }

    // ── DIAGNOSE (the only way a case ends) ──
    if (action === 'diagnose') {
      const flags = [];
      if (studentTurns < 4) flags.push('diagnosis_before_history');
      return reply({
        ...base, terminalReached: true, flags,
        diagnosisCorrect: caseData.diagnosisPattern.test(message),
      });
    }

    // ── TALK (AI patient) ──
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
    if (!GROQ_API_KEY) return reply({ error: 'GROQ_API_KEY not configured in Netlify environment variables.' }, 500);
    if (!message.trim()) return reply({ error: 'Empty message' }, 400);

    const flags = [];
    let hint = null;
    if (EXAM_INTENT.test(message)) hint = 'To examine the patient, use the Examine button.';
    else if (TEST_INTENT.test(message) && TEST_VERBS.test(message)) hint = 'To order a test, use the Order test button.';

    let system = ROLE_PREFIX + caseData.patientPrompt;
    system += `\n\nSTATE: The doctor has sent ${studentTurns} message(s) so far.`;
    if (caseData.patient.needsChaperone) {
      system += ` A nurse/chaperone ${chaperoneArranged ? 'HAS' : 'has NOT'} been arranged.`;
    }
    const scripted = (caseData.scripted || []).find(s => s.turn === studentTurns);
    if (scripted) {
      system += `\nTHIS TURN ONLY: first answer the doctor's message briefly, then add this line in your own voice: "${scripted.say}"`;
      flags.push(scripted.flag);
    }

    const chat = history
      .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content)
      .slice(-10);
    if (!chat.length || chat[chat.length - 1].role !== 'user') chat.push({ role: 'user', content: message });

    const patientResponse =
      (await callGroq(GROQ_API_KEY, GROQ_MODEL, system, chat)).trim() ||
      'Sorry doctor, could you repeat that?';

    return reply({ ...base, patientResponse, hint, flags });
  } catch (err) {
    console.error('Simulate error:', err);
    return reply({ error: err.message }, 500);
  }
};
