// Abhyas — assessment logic.
// Turns a finished consultation into a scored, evidence-backed report.
// (The record-building and AI-examiner helpers are in judge.js.)
//
// Rules:
//  1. Code decides everything it can know for certain (topics the patient actually answered, exams, tests, flags).
//  2. For items that need judgement, the AI answers a narrow yes/no and must quote the student's own words.
//     The code verifies the quote exists. Two differently-worded runs must agree, or the item is "unclear".
//  3. "Unclear" items earn no marks and cost no penalty. They are shown honestly as "could not confirm".
//  4. No feedback text is written by an AI. All wording comes from the case file.

const { EXAM_SYSTEMS, findExamItem } = require('./menus');
const {
  trunc, prepare, requiresOk, scopeInfo,
  buildTargets, buildPrompts, parseJudge, resolveRuns,
} = require('./judge');

function wordCount(s) { return String(s || '').trim().split(/\s+/).filter(Boolean).length; }

function band(score, sc) {
  if (score >= sc.distinction) return 'Distinction';
  if (score >= sc.merit) return 'Merit';
  if (score >= sc.pass) return 'Pass';
  return 'Not yet passing';
}

// ───────────── checks decided by code ─────────────
function gatedExam(e, caseData) {
  const cp = caseData.chaperone || {};
  const item = findExamItem(e.id);
  if (item && item.intimate) return true;
  if ((cp.items || []).includes(e.id)) return true;
  const site = ((caseData.localExam && caseData.localExam.sites) || []).find(s => s.id === e.site);
  return !!(site && site.intimate);
}

function systemOf(id) {
  for (let i = 0; i < EXAM_SYSTEMS.length; i++) {
    if (EXAM_SYSTEMS[i].items.some(it => it.id === id)) return { id: EXAM_SYSTEMS[i].id, index: i };
  }
  return { id: null, index: -1 };
}

function topicEvidence(ctx, topics) {
  const entry = ctx.servedLog.find(e => topics.includes(e.topic) &&
    !((ctx.caseData.topics.find(t => t.id === e.topic) || {}).volunteer));
  if (!entry) return null;
  const msg = ctx.student[entry.turn - 1];
  return msg ? `You asked: “${trunc(msg.text, 160)}”` : null;
}

// returns { value: true|false|null, evidence?, na?, text? }
function evalCheck(check, key, ctx, judgeMap, results) {
  const caseData = ctx.caseData;
  switch (check.type) {
    case 'topic_served': {
      const hit = (check.topics || []).filter(t => ctx.served.has(t));
      const ok = hit.length >= (check.min || 1);
      return { value: ok, evidence: ok ? topicEvidence(ctx, hit) : null };
    }
    case 'topic_groups': {
      const ok = (check.groups || []).every(g => g.some(t => ctx.served.has(t)));
      return { value: ok, evidence: ok ? topicEvidence(ctx, [].concat(...check.groups)) : null };
    }
    case 'topic_not_served':
      return { value: !(check.topics || []).some(t => ctx.served.has(t)) };
    case 'topics_missing_any':
      return { value: (check.topics || []).some(t => !ctx.served.has(t)) };
    case 'flag':
      return { value: ctx.flags.has(check.flag) };
    case 'flags_absent':
      return { value: !(check.flags || []).some(f => ctx.flags.has(f)) };
    case 'flag_unless_item': {
      const r = results[check.item];
      return { value: ctx.flags.has(check.flag) && !(r && r.status === 'met') };
    }
    case 'item_failed': {
      const r = results[check.item];
      return { value: !!(r && r.status === 'not_met' && !r.na) };
    }
    case 'condition_met':
      return { value: !!(ctx.state.conditions && ctx.state.conditions[check.condition]) };
    case 'vitals_done':
      return { value: !!ctx.state.vitalsDone };
    case 'exam_done': {
      const hit = ctx.examsDone.find(e => (check.anyOf || []).includes(e.id));
      return { value: !!hit, evidence: hit ? `You examined: ${hit.label}` : null };
    }
    case 'exam_site_done': {
      const hit = ctx.examsDone.find(e => e.site === check.site && (!check.item || e.id === check.item));
      return { value: !!hit, evidence: hit ? `You examined: ${hit.label}` : null };
    }
    case 'key_finding_revealed': {
      const hit = ctx.examsDone.find(e => e.key && ((check.item && e.id === check.item) ||
        (check.site && e.site === check.site) || (check.orSite && e.site === check.orSite)));
      return { value: !!hit, evidence: hit ? `You examined: ${hit.label}` : null };
    }
    case 'exam_sequence': {
      let from = 0; let ok = true;
      for (const id of check.items) {
        let found = -1;
        for (let i = from; i < ctx.examsDone.length; i++) { if (ctx.examsDone[i].id === id) { found = i; break; } }
        if (found < 0) { ok = false; break; }
        from = found + 1;
      }
      return { value: ok };
    }
    case 'exam_systematic': {
      if (ctx.examsDone.length < 3) {
        return { value: false, text: 'You did too few examinations for the order to be judged.' };
      }
      const core = ctx.examsDone.filter(e => { const s = systemOf(e.id).id; return s !== 'local' && s !== 'intimate'; });
      let ok = core.length > 0 && systemOf(core[0].id).id === 'general';
      for (let i = 1; ok && i < core.length; i++) {
        if (systemOf(core[i].id).index < systemOf(core[i - 1].id).index) ok = false;
      }
      return { value: ok, evidence: 'Your order: ' + ctx.examsDone.map(e => e.label).join(' → ') };
    }
    case 'chaperone_before_exam': {
      const cp = caseData.chaperone || {};
      if (ctx.flags.has(cp.violationFlag || 'chaperone_violation')) return { value: false };
      const gated = ctx.examsDone.filter(e => gatedExam(e, caseData));
      if (!gated.length) return { value: false, text: 'You did not do an examination that needs a chaperone, so there was nothing to credit.' };
      return { value: !!ctx.state.chaperone };
    }
    case 'diagnosis_correct': {
      const ms = (caseData.diagnosis && caseData.diagnosis.matchers) || [];
      return { value: ms.some(re => re.test(ctx.final.diagnosis)) };
    }
    case 'final_too_short':
      return { value: wordCount(ctx.final[check.field]) < (check.minWords || 1) };
    case 'test_ordered':
      return { value: ctx.tests.has(check.test), evidence: ctx.tests.has(check.test) ? `You ordered: ${check.test}` : null };
    case 'any': {
      let unclear = false; let allNa = true;
      for (let i = 0; i < check.of.length; i++) {
        const r = evalCheck(check.of[i], `${key}#${i}`, ctx, judgeMap, results);
        if (r.na) continue;
        allNa = false;
        if (r.value === true) return r;
        if (r.value === null) unclear = true;
      }
      if (allNa) return { value: null, na: true };
      return { value: unclear ? null : false };
    }
    case 'judge': {
      const info = scopeInfo(check.scope, ctx);
      if (!info.applicable || !requiresOk(check.requires, ctx)) return { value: null, na: true };
      const j = judgeMap[key];
      if (!j || j.answer === 'unclear') return { value: null };
      const yes = j.answer === 'yes';
      return { value: check.invert ? !yes : yes, evidence: j.quote ? `You said or wrote: “${trunc(j.quote, 200)}”` : null };
    }
    default:
      return { value: null };
  }
}

// ───────────── the report ─────────────
function assess(caseData, ctx, judgeMap, extra) {
  const sc = caseData.scoring;
  const results = {};
  const items = [];

  sc.items.forEach(it => {
    const ev = evalCheck(it.check, it.id, ctx, judgeMap || {}, results);
    let status; let text; let note = null; let evidence = ev.evidence || null; let na = false;

    if (ev.na) {
      na = true;
      if (it.check.notApplicable === 'award') {
        status = 'met'; text = it.pass;
        note = 'Not applicable: nothing in your consultation could have gone wrong here, so the marks are awarded.';
      } else {
        status = 'not_met'; text = it.miss;
        note = 'This could not be assessed because the step it depends on did not happen in your consultation.';
      }
      evidence = null;
    } else if (ev.value === true) {
      status = 'met'; text = it.pass;
    } else if (ev.value === false) {
      status = 'not_met'; text = ev.text || it.miss; evidence = ev.text ? null : evidence;
    } else {
      status = 'unclear';
      text = 'We could not confirm this from the record, so it carries no marks. Nothing was deducted for it.';
      evidence = null;
    }
    results[it.id] = { status, na };
    items.push({
      id: it.id, domain: it.domain, label: it.label, points: it.points,
      status, awarded: status === 'met' ? it.points : 0,
      text, evidence, note,
    });
  });

  const penalties = [];
  (sc.penalties || []).forEach(p => {
    const ev = evalCheck(p.check, p.id, ctx, judgeMap || {}, results);
    if (ev.na) return;
    if (ev.value === true) penalties.push({ id: p.id, points: p.points, text: p.text, status: 'applied', evidence: ev.evidence || null });
    else if (ev.value === null) penalties.push({ id: p.id, points: p.points, text: p.text, status: 'unclear', evidence: null });
  });

  const domains = Object.keys(sc.domains).map(id => {
    const d = sc.domains[id];
    const mine = items.filter(i => i.domain === id);
    return {
      id, label: d.label, max: d.max,
      score: mine.reduce((s, i) => s + i.awarded, 0),
      unconfirmed: mine.filter(i => i.status === 'unclear').reduce((s, i) => s + i.points, 0),
    };
  });

  const metPoints = items.reduce((s, i) => s + i.awarded, 0);
  const unclearItemPoints = items.filter(i => i.status === 'unclear').reduce((s, i) => s + i.points, 0);
  const appliedPen = penalties.filter(p => p.status === 'applied').reduce((s, p) => s + p.points, 0);
  const unclearPen = penalties.filter(p => p.status === 'unclear').reduce((s, p) => s + p.points, 0);
  const clamp = v => Math.max(0, Math.min(100, v));
  const total = clamp(metPoints + appliedPen);
  const scoreMin = clamp(metPoints + appliedPen + unclearPen);
  const scoreMax = clamp(metPoints + unclearItemPoints + appliedPen);

  // never events: the result is "Not passed" whatever the total is
  const neverEvents = (sc.neverEvents || []).filter(f => ctx.flags.has(f)).map(f => {
    const pen = (sc.penalties || []).find(p => p.check && p.check.flag === f);
    return { flag: f, text: pen ? pen.text : f };
  });
  const bandNow = band(total, sc);
  const provisional = band(scoreMin, sc) !== band(scoreMax, sc);
  const result = neverEvents.length
    ? { label: 'Not passed: never event', neverEvent: true, provisional: false }
    : { label: bandNow, neverEvent: false, provisional };

  const missedTopics = caseData.topics.filter(t => !ctx.served.has(t.id)).map(t => ({
    id: t.id, label: t.label, say: t.say,
    variantSay: Array.isArray(t.variants) && t.variants[0] ? t.variants[0].say : null,
  }));

  const dbf = caseData.debrief || {};
  const cpFlag = (caseData.chaperone && caseData.chaperone.violationFlag) || 'chaperone_violation';

  return Object.assign({
    caseId: caseData.meta.caseId,
    caseNumber: caseData.meta.number,
    symptomLabel: caseData.meta.symptomLabel,
    caseVersion: caseData.meta.version,
    diagnosisName: caseData.diagnosis.name,
    studentDiagnosis: ctx.final.diagnosis,
    result, neverEvents,
    total, scoreMin, scoreMax,
    thresholds: { pass: sc.pass, merit: sc.merit, distinction: sc.distinction },
    domains, items, penalties, missedTopics,
    record: {
      final: ctx.final,
      examOrder: ctx.examsDone.map(e => e.label),
      tests: Array.from(ctx.tests),
      vitalsChecked: !!ctx.state.vitalsDone,
      messageCount: ctx.student.length,
    },
    teaching: {
      keyLesson: dbf.keyLesson || '',
      teachingPoints: dbf.teachingPoints || [],
      managementPlan: dbf.managementPlan || '',
      safetyNet: dbf.safetyNet || '',
      chaperoneStatement: ctx.flags.has(cpFlag) ? (dbf.chaperoneStatement || '') : '',
    },
  }, extra || {});
}

// ───────────── a check on the case files themselves ─────────────
const KNOWN = new Set(['topic_served', 'topic_groups', 'topic_not_served', 'topics_missing_any', 'flag', 'flags_absent',
  'flag_unless_item', 'item_failed', 'condition_met', 'vitals_done', 'exam_done', 'exam_site_done', 'key_finding_revealed',
  'exam_sequence', 'exam_systematic', 'chaperone_before_exam', 'diagnosis_correct', 'final_too_short', 'test_ordered', 'any', 'judge']);

function topicRefs(check, out) {
  (check.topics || []).forEach(t => out.push(t));
  (check.groups || []).forEach(g => g.forEach(t => out.push(t)));
  if (check.requires && check.requires.topic) out.push(check.requires.topic);
  (check.of || []).forEach(c => topicRefs(c, out));
}

function selfCheck(caseData) {
  const problems = [];
  const sc = caseData.scoring;
  const topicIds = new Set(caseData.topics.map(t => t.id));
  const sums = {};
  const seen = new Set();

  const checkType = (id, check) => {
    if (!check || !KNOWN.has(check.type)) problems.push(`${id}: unknown check type "${check && check.type}"`);
    if (check && check.type === 'judge' && !check.question) problems.push(`${id}: judge item has no question`);
    if (check && check.type === 'any') (check.of || []).forEach(c => checkType(id, c));
    const refs = []; if (check) topicRefs(check, refs);
    refs.forEach(t => { if (!topicIds.has(t)) problems.push(`${id}: refers to unknown topic "${t}"`); });
  };

  sc.items.forEach(it => {
    if (seen.has(it.id)) problems.push(`Duplicate item id: ${it.id}`);
    seen.add(it.id);
    sums[it.domain] = (sums[it.domain] || 0) + it.points;
    if (!sc.domains[it.domain]) problems.push(`${it.id}: unknown domain "${it.domain}"`);
    if (!it.pass || !it.miss) problems.push(`${it.id}: missing pass or miss text`);
    checkType(it.id, it.check);
  });
  (sc.penalties || []).forEach(p => checkType(p.id, p.check));
  Object.keys(sc.domains).forEach(id => {
    if ((sums[id] || 0) !== sc.domains[id].max) problems.push(`Domain "${id}": items add up to ${sums[id] || 0} but the maximum is ${sc.domains[id].max}`);
  });
  const total = Object.values(sc.domains).reduce((s, d) => s + d.max, 0);
  if (total !== 100) problems.push(`Domain maxima add up to ${total}, not 100`);
  return problems;
}

module.exports = { prepare, buildTargets, buildPrompts, parseJudge, resolveRuns, assess, selfCheck };
