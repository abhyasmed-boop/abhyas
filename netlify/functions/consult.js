// Abhyas — Consultation Engine (v3)
// Reads everything about a case from netlify/case-data. This file contains NO case text.
//
// Rules of this engine:
//  - The patient answers with the author's own script lines. The AI only decides WHICH topic a question is about.
//  - Exam findings, test results and vitals come from the case file, never from the AI.
//  - The browser sends back a "state" object each turn; the server updates it and returns it.

const { getCase, cases } = require('../case-data/index');
const { EXAM_SYSTEMS, TESTS, DEFAULT_FINDING, findExamItem } = require('../case-data/menus');
const { selfCheck } = require('../case-data/assess');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ── small helpers ──
const CHAP_RE = /\b(nurse|chaperone|female (staff|nurse|attendant|colleague|doctor|assistant)|staff member|another (staff|colleague|member of staff)|someone else (to be )?(present|here|in the room))\b/i;
const CHAP_NEG = /\b(no need|not need|don'?t need|do not need|without|no nurse|won'?t|will not|not necessary|skip)\b/i;
function chaperoneMentioned(text) {
  return CHAP_RE.test(text) && !CHAP_NEG.test(text);
}

const VITALS_WORDS = ['vital signs', 'vitals', 'blood pressure', ' bp ', 'heart rate', 'pulse rate', 'pulse',
  'spo2', 'oxygen saturation', 'temperature', 'respiratory rate', 'observations', 'check obs', 'take obs'];
const EXAM_INTENT = /\b(examine|examination|palpat\w*|auscultat\w*|percuss\w*|listen to your (chest|heart|lungs)|press (on|here)|feel your|undress|remove your)\b/i;
const TEST_INTENT = /\b(ecg|troponin|x-?ray|cxr|d-?dimer|fbc|blood test|investigation|endoscop\w*|ct scan)\b/i;
const TEST_VERBS = /\b(order|request|send|arrange|get|do|run|check|want|need|like)\b/i;

const REACTION_PRIORITY = ['doctor_let_him_go', 'doctor_frightened', 'doctor_lectured', 'time_acknowledged'];

function freshState() {
  return {
    turns: 0,              // number of messages the student has typed to the patient
    msgs: [],              // the student's messages, in order (msgs[0] is message 1)
    chaperone: false,
    refusals: 0,
    agreedShown: false,
    conditions: {},        // for example { privacy_promised: true }
    topicsServed: [],
    servedLog: [],         // [{ turn, topic }]
    examsDone: [],         // [{ id, site, turn, key, abnormal }] in order
    testsOrdered: [],      // [{ name, turn }]
    flags: [],
    behaviours: {},        // { wants_to_leave: { turn } }
    scripted: {},
    vitalsDone: false,
    ended: false,
    final: null,
  };
}

function normalizeState(s) {
  const f = freshState();
  if (!s || typeof s !== 'object') return f;
  Object.keys(f).forEach(k => { if (s[k] !== undefined && s[k] !== null) f[k] = s[k]; });
  ['topicsServed', 'servedLog', 'examsDone', 'testsOrdered', 'flags', 'msgs'].forEach(k => { if (!Array.isArray(f[k])) f[k] = []; });
  ['conditions', 'behaviours', 'scripted'].forEach(k => { if (typeof f[k] !== 'object') f[k] = {}; });
  return f;
}

function addFlag(state, flag) {
  if (flag && !state.flags.includes(flag)) state.flags.push(flag);
}

function asFinding(entry) {
  if (entry === null || entry === undefined) return { text: DEFAULT_FINDING };
  if (typeof entry === 'string') return { text: entry };
  return entry;
}

// ── AI calls (Groq) ──
function getKey() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not configured in Netlify environment variables.');
  return key;
}
const MODEL = () => process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

async function callGroq(system, messages, opts = {}) {
  const { maxTokens = 600, temperature = 0.2 } = opts;
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey()}` },
    body: JSON.stringify({
      model: MODEL(),
      messages: [{ role: 'system', content: system }, ...messages],
      max_tokens: maxTokens,
      temperature,
      reasoning_effort: 'low',
    }),
  });
  if (!res.ok) {
    let msg = `Groq API error: ${res.status}`;
    try { msg = (await res.json()).error?.message || msg; } catch (e) { /* keep default */ }
    throw new Error(msg);
  }
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

// One call: which script topics is the doctor asking about, and which conditions are now true?
async function classify(caseData, history, message, activeConditions) {
  const topicLines = caseData.topics.map(t => `- ${t.id}: ${t.ask}`).join('\n');
  const condLines = activeConditions.map(id => `- ${id}: ${caseData.conditions[id]}`).join('\n') || '(none)';
  const recent = history.slice(-4)
    .map(m => `${m.role === 'user' ? 'Doctor' : 'Patient'}: ${m.content}`).join('\n') || '(start of consultation)';

  const prompt =
`You help run a medical teaching simulation. A student doctor has just said something to a patient.
Decide (1) which of the patient's topics the doctor is ASKING about, and (2) which conditions are clearly true.

TOPICS:
${topicLines}

CONDITIONS (list only those clearly true because of this message or the last few lines):
${condLines}

RECENT CONVERSATION:
${recent}

DOCTOR'S NEW MESSAGE: "${message}"

Rules:
- Choose a topic only if the doctor's message actually asks about it. Choose at most 3.
- If the question is vague or open (for example "tell me more about the pain"), choose at most 2 topics.
- A greeting, thanks, instruction or statement is not a question: choose no topic.
- Return ONLY this JSON and nothing else: {"topics":[],"conditions":[]}`;

  const text = await callGroq('You return only valid JSON.', [{ role: 'user', content: prompt }], { maxTokens: 700, temperature: 0 });
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return { topics: [], conditions: [] };
  try {
    const j = JSON.parse(m[0]);
    return {
      topics: Array.isArray(j.topics) ? j.topics.map(String) : [],
      conditions: Array.isArray(j.conditions) ? j.conditions.map(String) : [],
    };
  } catch (e) {
    return { topics: [], conditions: [] };
  }
}

// Used ONLY for greetings, small talk and behaviour reactions. It may not state medical facts.
async function voiceLine(caseData, history, message, extraInstruction) {
  const v = caseData.voice || {};
  const system =
    (v.persona || 'You are a patient.') + ' ' + (v.smallTalk || '') +
    ' Do not describe any symptom, test result or medical fact unless it is given to you here. ' +
    'If the doctor greets you or asks how you are, answer briefly and in character without mentioning symptoms. ' +
    'Reply in one or two short sentences. ' + (extraInstruction || '');
  const msgs = history.slice(-6).map(m => ({ role: m.role, content: m.content }));
  msgs.push({ role: 'user', content: message });
  const text = await callGroq(system, msgs, { maxTokens: 400, temperature: 0.5 });
  return text.replace(/^["“]|["”]$/g, '').trim() || (v.unclear || 'Sorry doctor, could you repeat that?');
}

// ── conditions the AI should check on this turn ──
function activeConditions(caseData, state) {
  const conds = caseData.conditions || {};
  const watched = new Set();
  const active = [];
  (caseData.behaviours || []).forEach(b => {
    (b.watch || []).forEach(id => watched.add(id));
    const fired = state.behaviours[b.id];
    if (fired && state.turns > fired.turn) (b.watch || []).forEach(id => active.push(id));
  });
  Object.keys(conds).forEach(id => {
    if (!watched.has(id) && !state.conditions[id]) active.push(id);
  });
  return active.filter(id => conds[id]);
}

// ── the script line for a topic (with privacy-type variants) ──
function topicSay(topic, state) {
  if (Array.isArray(topic.variants)) {
    for (const v of topic.variants) {
      if (state.conditions[v.when]) {
        if (v.setsFlag) addFlag(state, v.setsFlag);
        return v.say;
      }
    }
  }
  return topic.say;
}

function markServed(state, topicId) {
  if (!state.topicsServed.includes(topicId)) state.topicsServed.push(topicId);
  state.servedLog.push({ turn: state.turns, topic: topicId });
}

// ── EXAMINE ──
function doExamine(caseData, state, body) {
  const item = findExamItem(body.examId);
  if (!item) return { hint: 'Choose an examination from the list.' };

  let site = null;
  const where = String(body.text || body.message || '').trim();
  if (item.askWhere) {
    if (!where) return { hint: (caseData.localExam && caseData.localExam.noSite) || 'Please say exactly where you want to examine.' };
    site = ((caseData.localExam && caseData.localExam.sites) || []).find(s => s.match(where)) || null;
  }

  // Chaperone rule: intimate items always, plus whatever the case lists, plus intimate local sites
  const cp = caseData.chaperone || {};
  const needs = !!item.intimate || (cp.items || []).includes(item.id) || !!(site && site.intimate);
  let patientResponse = null;
  let consequenceTriggered = false;
  let consequenceText = null;

  if (needs && !state.chaperone) {
    const mode = cp.onViolation || 'allow_after_warning';
    if (mode === 'block' || state.refusals < 1) {
      state.refusals += 1;
      addFlag(state, 'chaperone_refused');
      return {
        patientResponse: cp.refusalLine || 'Doctor, I would feel more comfortable with someone else present.',
        consequenceTriggered: true,
        consequenceText: cp.refusalNote || 'The patient has asked for a chaperone before this examination.',
      };
    }
    // The student insisted: the exam goes ahead, but it is recorded as a never event.
    addFlag(state, cp.violationFlag || 'chaperone_violation');
    patientResponse = cp.reluctantLine || '…Okay, doctor.';
  } else if (needs && state.chaperone && !state.agreedShown) {
    state.agreedShown = true;
    patientResponse = cp.agreedLine || 'Okay, doctor.';
  }

  // The finding comes from the case file
  let finding;
  if (item.askWhere) {
    if (!site) {
      finding = { text: 'No abnormality detected at that site.' };
    } else if (item.id === 'local_inspection') {
      finding = asFinding(site.inspection);
    } else if (item.id === 'local_palpation') {
      let p = site.palpation;
      if (site.deepMatch && site.palpationDeep && site.deepMatch(where)) p = site.palpationDeep;
      finding = asFinding(p);
    } else {
      finding = asFinding(site.movement);
    }
  } else {
    finding = asFinding(caseData.exam && caseData.exam[item.id]);
  }

  state.examsDone.push({
    id: item.id, site: site ? site.id : null, turn: state.turns,
    key: !!finding.keyFinding, abnormal: !!finding.abnormal,
  });

  const name = item.askWhere ? `${item.label}: ${where}` : `${item.systemLabel} · ${item.label}`;
  return { examResult: { name, text: finding.text }, patientResponse, consequenceTriggered, consequenceText };
}

// ── ORDER A TEST ──
function doOrder(caseData, state, body) {
  const known = TESTS.find(t => t.name === body.test);
  if (!known) return { hint: 'That test is not available. Choose one from the list.' };
  const found = (caseData.tests && caseData.tests[known.name]) ||
    { normal: true, text: `${known.name}: no significant abnormality detected.` };
  if (state.turns < 3) addFlag(state, 'investigation_before_history');
  if (known.name === 'D-dimer') addFlag(state, 'ddimer_ordered');
  if (known.name === 'CT pulmonary angiogram (CTPA)') addFlag(state, 'ctpa_ordered');
  state.testsOrdered.push({ name: known.name, turn: state.turns });
  return { assetRevealed: { name: known.name, text: found.text, normal: found.normal !== false } };
}

// ── TALK ──
async function doTalk(caseData, state, body, history) {
  const message = String(body.message || '').trim();
  if (!message) throw new Error('Empty message');

  state.turns += 1;
  state.msgs.push(message);
  const events = [];
  const cp = caseData.chaperone || {};

  if (!state.chaperone && chaperoneMentioned(message)) {
    state.chaperone = true;
    events.push('chaperone_arranged');
  }

  let hint = null;
  const lower = ` ${message.toLowerCase()} `;
  if (EXAM_INTENT.test(message)) hint = 'To examine the patient, use the Examine button.';
  else if (VITALS_WORDS.some(k => lower.includes(k))) hint = 'To check vital signs, use the Vitals button.';
  else if (TEST_INTENT.test(message) && TEST_VERBS.test(message)) hint = 'To order a test, use the Order test button.';

  // The AI decides only which topics were asked, and which conditions are now true
  const active = activeConditions(caseData, state);
  const cls = await classify(caseData, history, message, active);
  cls.conditions.filter(id => active.includes(id)).forEach(id => { state.conditions[id] = true; });

  // Behaviour reactions (for example: the patient who wants to leave)
  let reactionLine = null;
  for (const b of (caseData.behaviours || [])) {
    const fired = state.behaviours[b.id];
    if (!fired || state.turns <= fired.turn) continue;
    const hit = REACTION_PRIORITY.find(id => (b.watch || []).includes(id) && cls.conditions.includes(id) && b.reactions && b.reactions[id]);
    if (!hit) continue;
    const r = b.reactions[hit];
    if (r.flag) addFlag(state, r.flag);
    if (r.endsConsultation) {
      state.ended = true;
      return {
        patientResponse: r.say,
        events, hint,
        terminalReached: true, endedBy: r.flag || 'patient_left', endSequence: r.consequence || [],
      };
    }
    if (r.instruction) {
      reactionLine = await voiceLine(caseData, history, message, 'Situation: ' + r.instruction + ' Say one short in-character sentence about that. No medical facts.');
    }
    break;
  }

  // The patient answers with the author's own lines
  const topicMap = {};
  caseData.topics.forEach(t => { topicMap[t.id] = t; });
  const topicIds = cls.topics.filter(id => topicMap[id]).slice(0, 3);
  const lines = [];
  topicIds.forEach(id => { lines.push(topicSay(topicMap[id], state)); markServed(state, id); });

  // Things the patient may volunteer
  caseData.topics.forEach(t => {
    if (t.volunteer && (t.volunteer.turns || []).includes(state.turns) && !state.topicsServed.includes(t.id)) {
      lines.push(topicSay(t, state));
      markServed(state, t.id);
    }
  });
  (caseData.scripted || []).forEach(s => {
    const due = state.turns >= s.atTurn || (s.orAfterTopic && state.topicsServed.includes(s.orAfterTopic));
    if (!state.scripted[s.id] && due) {
      lines.push(s.say);
      state.scripted[s.id] = true;
      addFlag(state, s.id);
    }
  });
  (caseData.behaviours || []).forEach(b => {
    if (!state.behaviours[b.id] && state.turns >= b.atTurn) {
      lines.push(b.say);
      state.behaviours[b.id] = { turn: state.turns };
      addFlag(state, b.flag);
    }
  });

  const parts = [reactionLine, ...lines].filter(Boolean);
  let patientResponse;
  if (parts.length) {
    patientResponse = parts.join('\n\n');
  } else if (events.includes('chaperone_arranged') || hint) {
    patientResponse = cp.agreedLine || 'Okay, doctor.';
  } else {
    patientResponse = await voiceLine(caseData, history, message, '');
  }

  return { patientResponse, events, hint };
}

// ── MAIN HANDLER ──
exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json',
  };
  const reply = (obj, statusCode = 200) => ({ statusCode, headers, body: JSON.stringify(obj) });

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  // Health check: open /.netlify/functions/consult in a browser to see which cases loaded and whether they have mistakes
  if (event.httpMethod === 'GET') {
    const problems = {};
    cases.forEach(c => { problems[c.meta.caseId] = selfCheck(c); });
    const allClear = Object.values(problems).every(p => p.length === 0);
    return reply({ ok: allClear, engine: 'v3', cases: cases.map(c => c.meta.caseId), problems });
  }
  if (event.httpMethod !== 'POST') return reply({ error: 'Method not allowed' }, 405);

  try {
    const body = JSON.parse(event.body || '{}');
    const action = body.action || 'talk';

    if (action === 'menu') {
      const systems = EXAM_SYSTEMS.map(s => ({
        id: s.id, label: s.label,
        items: s.items.map(i => ({ id: i.id, label: i.label, askWhere: !!i.askWhere })),
      }));
      return reply({ systems, tests: TESTS });
    }

    const sessionId = body.sessionId;
    if (!sessionId) return reply({ error: 'Missing sessionId' }, 400);
    const caseId = String(sessionId).split('_')[0];
    const caseData = getCase(caseId);
    if (!caseData) return reply({ error: `Unknown case: ${caseId}` }, 404);

    const state = normalizeState(body.state);
    const history = (Array.isArray(body.conversationHistory) ? body.conversationHistory : [])
      .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content);
    if (state.ended) return reply({ error: 'This consultation has ended.' }, 400);

    const out = (extra) => ({
      patientResponse: null, vitalsRevealed: false, vitalsData: null,
      examResult: null, assetRevealed: null,
      consequenceTriggered: false, consequenceText: null,
      hint: null, events: [], terminalReached: false, endSequence: [],
      ...extra, flags: state.flags, state,
    });

    if (action === 'vitals') {
      state.vitalsDone = true;
      return reply(out({ vitalsRevealed: true, vitalsData: caseData.vitals }));
    }

    if (action === 'examine') return reply(out(doExamine(caseData, state, body)));

    if (action === 'order') return reply(out(doOrder(caseData, state, body)));

    if (action === 'diagnose') {
      const form = body.form || {};
      const clean = k => String(form[k] || '').trim();
      const final = { findings: clean('findings'), diagnosis: clean('diagnosis'), reasoning: clean('reasoning'), management: clean('management') };
      if (final.diagnosis.length < 3) return reply({ error: 'Please write your diagnosis.' }, 400);
      if (!state.examsDone.length) addFlag(state, 'diagnosis_before_examination');
      if (state.turns < 4) addFlag(state, 'diagnosis_before_history');
      state.final = final;
      state.ended = true;
      const cp = caseData.chaperone || {};
      const violated = state.flags.includes(cp.violationFlag || 'chaperone_violation');
      return reply(out({ terminalReached: true, endedBy: 'diagnosis', endSequence: violated ? (cp.consequence || []) : [] }));
    }

    // default: talk to the patient
    const talk = await doTalk(caseData, state, body, history);
    return reply(out(talk));
  } catch (err) {
    console.error('Consult error:', err);
    return reply({ error: err.message }, 500);
  }
};
