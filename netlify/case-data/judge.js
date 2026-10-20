// Abhyas — judge helpers.
// Builds the record of a consultation, the questions for the AI examiner,
// and checks that the examiner's quotes are really the student's own words.

const { findExamItem } = require('./menus');

function norm(s) {
  return String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}
function trunc(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

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
  const sc = caseData.scoring;
  sc.items.forEach(it => {
    if (it.check.type === 'judge') out.push({ key: it.id, check: it.check });
    if (it.check.type === 'any') {
      it.check.of.forEach((c, i) => { if (c.type === 'judge') out.push({ key: `${it.id}#${i}`, check: c }); });
    }
  });
  (sc.penalties || []).forEach(p => { if (p.check.type === 'judge') out.push({ key: p.id, check: p.check }); });
  return out;
}

// Returns the questions to send, and answers that need no AI (nothing written means "no")
function buildTargets(caseData, ctx) {
  const targets = [];
  const auto = {};
  collectJudges(caseData).forEach(({ key, check }) => {
    const info = scopeInfo(check.scope, ctx);
    if (!info.applicable || !requiresOk(check.requires, ctx)) return;      // not applicable: handled in assess()
    if (!info.texts.length) { auto[key] = { answer: 'no', quote: null, auto: true }; return; }
    targets.push({ key, question: check.question, doesNotCount: check.doesNotCount || '', desc: info.desc });
  });
  return { targets, auto };
}

function consultationText(ctx) {
  if (!ctx.student.length) return '(the student did not type any message to the patient)';
  return ctx.student.map(m => {
    let s = `[${m.n}] Student: ${m.text}`;
    (m.patient || []).slice(0, 2).forEach(p => { s += `\n      Patient: ${trunc(p, 300)}`; });
    return s;
  }).join('\n');
}

function actionsText(ctx) {
  const lines = [];
  ctx.examsDone.forEach(e => lines.push(`- Examined: ${e.label} (after student message ${e.turn})`));
  (Array.isArray(ctx.state.testsOrdered) ? ctx.state.testsOrdered : []).forEach(t => lines.push(`- Ordered: ${t.name} (after student message ${t.turn})`));
  if (ctx.state.vitalsDone) lines.push('- Checked vital signs');
  return lines.join('\n') || '(none)';
}

function finalText(ctx) {
  const f = ctx.final;
  return `Findings: ${f.findings || '(empty)'}\nDiagnosis: ${f.diagnosis || '(empty)'}\nReasoning: ${f.reasoning || '(empty)'}\nManagement: ${f.management || '(empty)'}`;
}

function buildPrompts(targets, ctx) {
  const record =
`STUDENT MESSAGES (numbered). The patient’s replies are shown only for context.
${consultationText(ctx)}

ACTIONS THE STUDENT TOOK:
${actionsText(ctx)}

STUDENT’S FINAL WRITTEN RECORD:
${finalText(ctx)}`;

  const qText = list => list.map((t, i) =>
`Q${i + 1} [id: ${t.key}]
Look only at: ${t.desc}
Question: ${t.question}${t.doesNotCount ? `\nDoes NOT count: ${t.doesNotCount}` : ''}`).join('\n\n');

  const jsonLine = 'Return ONLY this JSON and nothing else: {"answers":[{"id":"<id>","answer":"yes","quote":"<exact words>"}]}';

  const promptA =
`You are a strict, careful examiner marking a medical student’s simulated consultation. Use ONLY the text below. Do not assume anything that is not written.

${record}

For each question answer "yes", "no" or "unclear".
- Answer "yes" only if the student’s OWN words clearly show it. Then copy ONE exact quote, word for word, from the student’s own messages or final written record, at most 25 words. Never quote the patient.
- Answer "no" if it is not clearly shown. Answer "unclear" only if you truly cannot tell.
- Each question says which part of the text to look at. Ignore everything else.

QUESTIONS:
${qText(targets)}

${jsonLine}`;

  const promptB =
`You are a sceptical second examiner. A colleague will mark this consultation too, so be exact. Use ONLY the text below.

${record}

For each question below, first look for evidence AGAINST the claim, then decide.
- "yes" needs the student’s own words to clearly show it, with ONE exact quote copied word for word (at most 25 words) from the student’s messages or final written record. The patient’s words never count.
- If the evidence is weak, indirect or missing, answer "no". Use "unclear" only if you truly cannot tell.
- Only look at the part of the text named in each question.

QUESTIONS (in a different order):
${qText(targets.slice().reverse())}

${jsonLine}`;

  return [promptA, promptB];
}

function parseJudge(text) {
  const m = String(text || '').match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]);
    if (!Array.isArray(j.answers)) return null;
    const map = {};
    j.answers.forEach(a => { if (a && a.id) map[String(a.id)] = { answer: String(a.answer || '').toLowerCase().trim(), quote: String(a.quote || '').trim() }; });
    return map;
  } catch (e) {
    return null;
  }
}

function quoteIsReal(quote, texts) {
  const nq = norm(quote);
  if (nq.split(' ').length < 2) return false;
  return texts.some(t => norm(t).includes(nq));
}

// Two runs must agree. A "yes" counts only if its quote really is in the student's own words.
function resolveRuns(targets, ctx, runs, auto) {
  const map = Object.assign({}, auto || {});
  const caseData = ctx.caseData;
  const checkByKey = {};
  collectJudges(caseData).forEach(j => { checkByKey[j.key] = j.check; });

  targets.forEach(t => {
    const info = scopeInfo(checkByKey[t.key].scope, ctx);
    const verdicts = (runs || []).map(run => {
      const a = run && run[t.key];
      if (!a) return { v: 'unclear' };
      if (a.answer === 'no') return { v: 'no' };
      if (a.answer === 'yes') return quoteIsReal(a.quote, info.texts) ? { v: 'yes', quote: a.quote } : { v: 'unclear' };
      return { v: 'unclear' };
    });
    while (verdicts.length < 2) verdicts.push({ v: 'unclear' });
    const [a, b] = verdicts;
    if (a.v === 'yes' && b.v === 'yes') map[t.key] = { answer: 'yes', quote: a.quote || b.quote };
    else if (a.v === 'no' && b.v === 'no') map[t.key] = { answer: 'no', quote: null };
    else map[t.key] = { answer: 'unclear', quote: null };
  });
  return map;
}

module.exports = {
  norm, trunc, prepare, requiresOk, scopeInfo,
  buildTargets, buildPrompts, parseJudge, resolveRuns,
};
