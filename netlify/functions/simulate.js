// Abhyas — Simulation Engine
// Handles each student turn: patient response + branch evaluation
// Uses Groq API (GROQ_API_KEY env variable)

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ── CASE CONFIGURATIONS ──
const CASES = {
  'CHEST-L1-001': {
    title: 'Costochondritis',
    actualVitals: { hr: 82, bp: '116/72', spo2: 99, rr: 14, temp: 36.9 },
    patientPrompt: `You are Sita Gurung, 21F, BBS student, Kathmandu. First ever doctor visit. Anxious.
PAIN: Left chest 8 days. Sharp, like poking. Worst during chest press gym (day 4). Almost nothing at rest (1/10).
HISTORY: Aunt died MI 4 weeks ago. Started gym to protect heart. Nilocon White OCP — ONLY if privacy created AND medications asked. Vapes 2-3x/week fruit — ONLY if asked about smoking or habits.
VITALS: Only report when specifically asked for vitals/pulse/BP/heart rate/observations: "HR 82 bpm, BP 116/72 mmHg both arms equal, SpO2 99%, RR 14/min, Temp 36.9°C"
CHAPERONE: If student attempts chest examination WITHOUT nurse/chaperone mentioned: "Doctor I am not comfortable. Can there be a nurse present?" If nurse/chaperone mentioned anywhere in conversation: cooperate fully.
EXAM (chaperone present): No swelling/redness/warmth on chest. Press 3rd/4th left CJ: "Yes! Right there!" [winces] Two spots tender. Lungs clear. Heart normal.
RULES: Max 3 sentences. Lay language. Volunteer gym connection 2nd-3rd message. Never say diagnosis.`,

    invResults: {
      'Electrocardiogram (ECG)': {
        category: 'ecg',
        text: 'Rate: 82 bpm — Sinus rhythm\nPR: 160ms  QRS: 80ms  QTc: 445ms\nAxis: Normal\nST: No elevation or depression\nT waves: Normal\n→ NORMAL ECG',
        normal: true,
      },
      'Chest X-ray (PA)': {
        category: 'imaging',
        text: 'Lung fields: Clear bilaterally\nCardiac silhouette: Normal\nMediastinum: Not widened\nCostophrenic angles: Sharp\nBones: No fracture\n→ NORMAL CHEST X-RAY',
        normal: true,
      },
      'Troponin I': {
        category: 'bloods',
        text: 'Troponin I: 8 ng/L\nRef: <14 ng/L\n→ NORMAL',
        normal: true,
      },
      'D-dimer': {
        category: 'bloods',
        text: 'D-dimer: 280 ng/mL FEU\nRef: <500 ng/mL\n→ NORMAL\n(Calculate Well\'s score before ordering)',
        normal: true,
      },
      'Full blood count (FBC)': {
        category: 'bloods',
        text: 'Hb: 12.8 g/dL (Normal)\nWBC: 7.2 × 10⁹/L (Normal)\nPlatelets: 245 × 10⁹/L (Normal)\n→ NORMAL',
        normal: true,
      },
    },

    evalPrompt: (msg, chap, vitRev) =>
      `Student action in Costochondritis simulation.
Chaperone present: ${chap}. Vitals revealed: ${vitRev}.
STUDENT SAID: "${msg}"
Return ONLY this JSON:
{"score":0,"note":""}
Score: +3 good open history question, +4 asks about exercise/gym, +3 asks about medications, +3 asks associated symptoms, +6 specifically palpates costochondral junctions, -3 leading closed questions, -4 multiple questions at once`,

    debriefPrompt: `Write a clinical debrief for Costochondritis (Sita Gurung, 21F). 4 sections:
## What you did well
## What to focus on next time
Mention: specific safety-net advice (crushing pain/arm radiation/diaphoresis = emergency), OCP medication history, explaining to patient why this is NOT cardiac given her aunt died recently.
## The key clinical lesson
Palpation is the diagnostic test — reproducible tenderness at costochondral junctions. Exertional pain here = chest wall movement not ischaemia. Normal ECG does not diagnose — palpation does.
## Safety net — always give this
If pain becomes crushing or pressure-like, radiates to arm or jaw, comes with sweating or breathlessness at rest — go to emergency immediately.
2-4 sentences per section. Direct. No bullet points within sections.`,
  },

  'CHEST-L1-002': {
    title: 'GERD',
    actualVitals: { hr: 78, bp: '128/80', spo2: 99, rr: 14, temp: 37.0 },
    patientPrompt: `You are Ram Bahadur Thapa, 44M, bus driver, Koteshwor. Burning chest 3 months.
HISTORY: Burning goes to throat (sour taste). Worse after meals, lying flat, wakes 2-3am. Sitting up helps. Gelusil antacid: 5-10 min relief. Ibuprofen for back pain daily (2-3 years) — ONLY if asked medications. Smokes 10/day, raksi weekends. Overweight. Late meals. Shift in 1 hour.
VITALS: Only when asked for vitals/pulse/BP/observations: "HR 78 bpm, BP 128/80 mmHg both arms, SpO2 99%, RR 14/min, Temp 37.0°C"
EXAM: Mild epigastric tenderness on deep palpation. Chest clear. Heart sounds normal.
RULES: 2-3 sentences. Will try to leave if slow. Never say GERD or reflux.`,

    invResults: {
      'Electrocardiogram (ECG)': {
        category: 'ecg',
        text: 'Rate: 78 bpm — Normal sinus\nNo ST changes. Normal T waves.\n→ NORMAL ECG',
        normal: true,
      },
      'Full blood count (FBC)': {
        category: 'bloods',
        text: 'Hb: 13.2 g/dL (Normal)\nWBC: 8.1 × 10⁹/L (Normal)\n→ NORMAL',
        normal: true,
      },
      'H. pylori stool antigen': {
        category: 'bloods',
        text: 'H. pylori stool antigen: POSITIVE\n→ ABNORMAL\nEradication therapy indicated if PUD confirmed.',
        normal: false,
      },
      'Urea and electrolytes (U&E)': {
        category: 'bloods',
        text: 'Na: 138 mmol/L (Normal)\nK: 4.1 mmol/L (Normal)\nUrea: 5.2 mmol/L (Normal)\nCreatinine: 82 µmol/L (Normal)\n→ NORMAL',
        normal: true,
      },
    },

    evalPrompt: (msg, chap, vitRev) =>
      `Student action in GERD simulation. Vitals revealed: ${vitRev}.
STUDENT SAID: "${msg}"
Return ONLY this JSON:
{"score":0,"note":""}
Score: +5 asks antacid response, +4 asks posture/lying flat, +4 meal timing, +4 ibuprofen/medications, +3 alarm features (haematemesis/dysphagia/weight loss), -4 cardiac investigations before GI history, -5 lets patient leave without completing history`,

    debriefPrompt: `Write a clinical debrief for GERD (Ram Bahadur Thapa, 44M). 4 sections:
## What you did well
## What to focus on next time
Antacid response is most discriminating. NSAID history must be found. Alarm features must always be sought regardless of how classic the presentation.
## The key clinical lesson
Burning + postprandial + positional + antacid response = GERD. Nocturnal pain explained by lying flat — not cardiac ischaemia. Antacid response in 5-10 min is specific to acid pathology.
## Safety net — always give this
Return immediately if haematemesis, dysphagia, unintentional weight loss, or no improvement in 4-6 weeks.
2-4 sentences per section. Direct. No bullet points.`,
  },
};

// ── GROQ API CALL ──
async function callGroq(apiKey, model, systemPrompt, messages, options = {}) {
  const { maxTokens = 200, temperature = 0.7 } = options;
  const msgs = [];
  if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt });
  messages.forEach(m => msgs.push({ role: m.role, content: m.content }));

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
        body: JSON.stringify({
      model,
      messages: msgs,
      max_tokens: maxTokens,
      temperature,
      reasoning_effort: 'low',
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Groq API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGroqJSON(apiKey, model, prompt) {
  const text = await callGroq(apiKey, model, null, [{ role: 'user', content: prompt }], {
    maxTokens: 500,
    temperature: 0.1,
  });
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { score: 0 };
  try { return JSON.parse(match[0]); } catch { return { score: 0 }; }
}

// ── MAIN HANDLER ──
exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

  if (!GROQ_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'GROQ_API_KEY not configured in Netlify environment variables.' }) };
  }

  try {
    const { sessionId, message, conversationHistory, chaperoneArranged, vitalsRevealed } = JSON.parse(event.body || '{}');

    if (!sessionId || !message) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing sessionId or message' }) };
    }

    const caseId = sessionId.split('_')[0];
    const caseData = CASES[caseId] || CASES['CHEST-L1-001'];

    // ── VITALS DETECTION (server-side) ──
    const vitKW = ['vital signs', 'vitals', 'blood pressure', ' bp ', 'heart rate',
      'pulse rate', 'pulse', 'spo2', 'oxygen saturation', 'temperature',
      'respiratory rate', 'observations', 'check obs', 'take obs', 'measure bp'];
    const vitalsRequested = !vitalsRevealed && vitKW.some(k => message.toLowerCase().includes(k));

    if (vitalsRequested) {
      const v = caseData.actualVitals;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          patientResponse: null,
          vitalsRevealed: true,
          vitalsData: v,
          scoreDelta: 2,
          consequenceTriggered: false,
          assetRevealed: null,
          terminalReached: false,
        }),
      };
    }

    // ── INTIMATE EXAM DETECTION (server-side) ──
    const intimateKW = ['chest wall', 'costochondral', 'palpate chest', 'palpate the chest',
      'feel the chest', 'press the chest', 'press on chest', 'press on the',
      'feel where it hurts', 'feel the ribs', 'palpate ribs', 'sternal',
      'parasternal', 'inspect the chest', 'inspect chest wall',
      'remove', 'lift her top', 'lift top', 'expose', 'undress'];
    const intimateAttempt = intimateKW.some(k => message.toLowerCase().includes(k));

    if (intimateAttempt && !chaperoneArranged) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          patientResponse: 'Doctor — I am not comfortable. Can there be a nurse or female staff member present please?',
          vitalsRevealed: false,
          vitalsData: null,
          scoreDelta: -5,
          consequenceTriggered: true,
          consequenceText: 'The patient has requested a chaperone before intimate examination. Arrange for a female nurse or staff member to be present.',
          assetRevealed: null,
          terminalReached: false,
        }),
      };
    }

    // ── INVESTIGATION DETECTION ──
    // Check if message is an investigation order
    const isInvOrder = message.toLowerCase().startsWith('order:') ||
      message.toLowerCase().includes('i would like to order') ||
      message.toLowerCase().includes('please order') ||
      message.toLowerCase().includes('request:');

    if (isInvOrder) {
      // Extract investigation names and return results
      const invName = message.replace(/^order:|i would like to order|please order|request:/i, '').trim();
      const result = caseData.invResults[invName];
      const genericResult = result || {
        category: 'bloods',
        text: 'Result: Within normal limits.\nNo significant abnormality detected.',
        normal: true,
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          patientResponse: null,
          vitalsRevealed: false,
          vitalsData: null,
          scoreDelta: 1,
          consequenceTriggered: false,
          assetRevealed: {
            name: invName,
            ...genericResult,
          },
          terminalReached: false,
        }),
      };
    }

    // ── PATIENT RESPONSE ──
    const history = (conversationHistory || []).slice(-8);
    if (!history.length) history.push({ role: 'user', content: message });

    const patientResponse = (await callGroq(
      GROQ_API_KEY,
      GROQ_MODEL,
            'You are role-playing a PATIENT in a medical OPD. You are never the doctor or an assistant. Never ask "how can I help you" or offer help. Stay in character at all times. If greeted, reply briefly in character and mention your main complaint. ' + caseData.patientPrompt,
      history,
      { maxTokens: 600, temperature: 0.72 }
    )) || 'Sorry doctor, could you repeat that?';

    // ── BRANCH EVALUATION (scoring only) ──
    let scoreDelta = 0;
    try {
      const evalResult = await callGroqJSON(
        GROQ_API_KEY,
        GROQ_MODEL,
        caseData.evalPrompt(message, chaperoneArranged, vitalsRevealed)
      );
      scoreDelta = evalResult.score || 0;
    } catch (e) {
      console.error('Branch eval error:', e.message);
    }

    // ── TERMINAL DETECTION ──
    const terminalPhrases = ['costochondritis', 'chest wall pain', 'musculoskeletal chest',
      'gerd', 'acid reflux', 'gastroesophageal', 'heartburn', 'reflux disease'];
    const terminalReached = terminalPhrases.some(p => message.toLowerCase().includes(p));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        patientResponse,
        vitalsRevealed: false,
        vitalsData: null,
        scoreDelta,
        consequenceTriggered: false,
        assetRevealed: null,
        terminalReached,
      }),
    };

  } catch (err) {
    console.error('Simulate error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
