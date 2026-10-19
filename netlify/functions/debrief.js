// Abhyas — Debrief (v3)
// Builds an evidence-backed report from the record of the consultation.
// The AI examiner only answers narrow yes/no questions and must quote the student's own words.
// All feedback wording comes from the case file. All scoring is done by code (assess.js).

const { getCase } = require('../case-data/index');
const { prepare, buildTargets, buildPrompts, parseJudge, resolveRuns, assess } = require('../case-data/assess');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callJudge(prompt) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not configured in Netlify environment variables.');
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 3500,
      temperature: 0,
      reasoning_effort: 'low',
    }),
  });
  if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

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
    const { sessionId, state, transcript, endedBy } = body;
    const caseId = body.caseId || String(sessionId || '').split('_')[0];

    const caseData = getCase(caseId);
    if (!caseData) return reply({ error: `Unknown case: ${caseId}` }, 404);
    if (!state || typeof state !== 'object') {
      return reply({ error: 'The record of this consultation was not found. Please run the case again.' }, 400);
    }

    const ctx = prepare(caseData, { state, transcript });
    const { targets, auto } = buildTargets(caseData, ctx);

    // Two examiners, worded differently, run at the same time
    let runs = [null, null];
    let aiProblem = false;
    if (targets.length) {
      const [promptA, promptB] = buildPrompts(targets, ctx);
      const settled = await Promise.allSettled([callJudge(promptA), callJudge(promptB)]);
      runs = settled.map(s => (s.status === 'fulfilled' ? parseJudge(s.value) : null));
      aiProblem = runs.some(r => !r);
      settled.forEach(s => { if (s.status === 'rejected') console.error('Judge error:', s.reason && s.reason.message); });
    }

    const judgeMap = resolveRuns(targets, ctx, runs, auto);

    const report = assess(caseData, ctx, judgeMap, {
      sessionId: sessionId || null,
      endedBy: endedBy || null,
      generatedAt: new Date().toISOString(),
      judging: {
        questions: targets.length,
        examiners: 2,
        problem: aiProblem,       // true if an examiner did not answer; affected items show as "could not confirm"
      },
    });

    return reply(report);
  } catch (err) {
    console.error('Debrief error:', err);
    return reply({ error: err.message }, 500);
  }
};
