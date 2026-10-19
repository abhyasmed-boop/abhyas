// Abhyas — assessment logic.
// Turns a finished consultation into a scored, evidence-backed report.
//
// Rules:
//  1. Code decides everything it can know for certain (topics the patient actually answered, exams, tests, flags).
//  2. For items that need judgement, the AI answers a narrow yes/no and must quote the student's own words.
//     The code verifies the quote exists. Two differently-worded runs must agree, or the item is "unclear".
//  3. "Unclear" items earn no marks and cost no penalty. They are shown honestly as "could not confirm".
//  4. No feedback text is written by an AI. All wording comes from the case file.

const { EXAM_SYSTEMS, findExamItem } = require('./menus');

// ───────────── small helpers ─────────────
function norm(s) {
  return String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}
function wordCount(s) { return String(s || '').trim().split(/\s+/).filter(Boolean).length; }
function trunc(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

function band(score, sc) {
  if (score >= sc.distinction) return 'Distinction';
  if (score >= sc.merit) return 'Merit';
  if (score >= sc.pass) return 'Pass';
  return 'Not yet passing';
}

// ───────────── building the context from what the engine recorded ─────────────
function prepare(caseData, payload) {
  const state = (payload && payload.state) || {};
  const transcript = Array.isArray(payload && payload.transcript) ? payload.transcript : [];

  let student = [];
  if (Array.isArray(state.msgs) && state.msgs.length) {
    student = state.msgs.map((t, i) => ({ n: i + 1, text: String(t), patient: [] }));
  } else {
    let n = 0;
    transcript.forEach(m => {
      if (m.role === 'user' && !String(m.content).startsWith('[ACTION]')) {
        n += 1; student.push({ n, text: String(m.content), patient: [] });
      }
    });
  }
  // attach the patient's replies for context only
  let idx = -1; let cur = -1;
  transcript.forEach(m => {
    const c = String(m.content || '');
    if (m.role === 'user') {
      if (c.startsWith('[ACTION]')) cur = -1; else { idx += 1; cur = idx; }
    } else if (m.role === 'assistant' && cur >= 0 && student[cur] && !c.startsWith('[')) {
      student[cur].patient.push(c);
    }
  });

  const f = state.final || {};
  const final = {
    findings: String(f.findings || '').trim(),
    diagnosis: String(f.diagnosis || '').trim(),
    reasoning: String(f.reasoning || '').trim(),
    management: String(f.management || '').trim(),
  };

  const examsDone = (Array.isArray(state.examsDone) ? state.examsDone : []).map(e => {
    const item = findExamItem(e.id);
    return { ...e, label: item ? (item.systemLabel + ' · ' + item.label) : e.id };
  });

  return {
    caseData, state, student, final, examsDone,
    served: new Set(Array.isArray(state.topicsServed) ? state.topicsServed : []),
    servedLog: Array.isArray(state.servedLog) ? state.servedLog : [],
    flags: new Set(Array.isArray(state.flags) ? state.flags : []),
    examIds: new Set(examsDone.map(e => e.id)),
    tests: new Set((Array.isArray(state.testsOrdered) ? state.testsOrdered : []).map(t => t.name)),
  };
}

function requiresOk(req, ctx) {
  if (!req) return true;
  if (req.flag && !ctx.flags.has(req.flag)) return false;
  if (req.topic && !ctx.served.has(req.topic)) return false;
  if (req.examAnyOf && !req.examAnyOf.some(id => ctx.examIds.has(id))) return false;
  return true;
}

// Which part of the record a question may look at, and which of the student's own texts a quote may come from
function scopeInfo(scope, ctx) {
  const msgs = ctx.student;
  const f = ctx.final;
  const finalTexts = [f.findings, f.diagnosis, f.reasoning, f.management].filter(Boolean);
  const firstExamTurn = ctx.examsDone.length ? ctx.examsDone[0].turn : null;
  const texts = list => list.map(m => (typeof m === 'string' ? m : m.text)).filter(Boolean);

  if (scope === 'first_question') {
    const sel = msgs.slice(0, 3);
    return { applicable: sel.length > 0, texts: texts(sel), desc: 'student messages 1 to 3 only' };
  }
  if (scope === 'chat') {
    return { applicable: true, texts: texts(msgs), desc: 'the student’s messages during the consultation (not the final written record)' };
  }
  if (scope === 'chat_and_final') {
    return { applicable: true, texts: texts(msgs).concat(finalTexts), desc: 'the student’s messages and the final written record' };
  }
  if (scope === 'before_first_exam') {
    const sel = firstExamTurn === null ? msgs : msgs.filter(m => m.n <= firstExamTurn);
    const d = firstExamTurn === null ? 'all the student’s messages (no examination was done)' : `student messages 1 to ${firstExamTurn} only (before the first examination)`;
    return { applicable: true, texts: texts(sel), desc: d };
  }
  if (scope && scope.startsWith('after_behaviour:')) {
    const id = scope.split(':')[1];
    const b = ctx.state.behaviours && ctx.state.behaviours[id];
    if (!b) return { applicable: false, texts: [], desc: '' };
    const sel = msgs.filter(m => m.n > b.turn);
    return { applicable: true, texts: texts(sel), desc: `student messages after message ${b.turn} only` };
  }
  if (scope === 'final') return { applicable: true, texts: finalTexts, desc: 'the final written record only (all four boxes)' };
  if (scope && scope.startsWith('final.')) {
    const k = scope.split('.')[1];
    return { applicable: true, texts: f[k] ? [f[k]] : [], desc: `the “${k}” box of the final written record only` };
  }
  return { applicable: true, texts: texts(msgs), desc: 'the student’s messages' };
}

// ───────────── the questions for the AI examiner ─────────────
function collectJudges(caseData) {
  const out = [];
  const sc =
