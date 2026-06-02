// Abhyas — Debrief Generator

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DEBRIEF_PROMPTS = {
  'CHEST-L1-001': `Write a clinical debrief for Costochondritis (Sita Gurung, 21F). 4 sections:
## What you did well
## What to focus on next time
Mention: specific safety-net (crushing pain/arm radiation/diaphoresis = emergency), OCP medication history, explaining why NOT cardiac given aunt's recent death.
## The key clinical lesson
Palpation is the diagnostic test. Exertional pain = chest wall movement not ischaemia. Normal ECG does not make the diagnosis.
## Safety net — always give this
If pain becomes crushing, radiates to arm or jaw, comes with sweating or breathlessness at rest — emergency immediately.
2-4 sentences per section. Direct. No bullet points within sections.`,

  'CHEST-L1-002': `Write a clinical debrief for GERD (Ram Bahadur Thapa, 44M). 4 sections:
## What you did well
## What to focus on next time
Antacid response is the most discriminating feature. NSAID history. Alarm features mandatory.
## The key clinical lesson
Burning + postprandial + positional + antacid response distinguishes GERD from angina. History is the diagnostic tool here.
## Safety net — always give this
Return if haematemesis, dysphagia, weight loss, or no improvement in 4-6 weeks.
2-4 sentences per section. Direct. No bullet points.`,
};

async function callGroq(apiKey, model, prompt) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

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
  const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

  if (!GROQ_API_KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: 'GROQ_API_KEY not configured' }) };

  try {
    const { sessionId, totalScore, sessionSummary } = JSON.parse(event.body || '{}');
    const caseId = sessionId?.split('_')[0] || 'CHEST-L1-001';
    const prompt = DEBRIEF_PROMPTS[caseId] || DEBRIEF_PROMPTS['CHEST-L1-001'];

    const debriefText = await callGroq(GROQ_API_KEY, GROQ_MODEL, prompt);

    // Parse sections
    const parts = debriefText.split(/##\s+/).filter(p => p.trim());
    const sections = parts.map(p => {
      const lines = p.trim().split('\n');
      return { title: lines[0].trim(), content: lines.slice(1).join('\n').trim() };
    }).filter(s => s.title && s.content);

    const scores = {
      history: Math.round((totalScore || 70) * 0.28),
      examination: Math.round((totalScore || 70) * 0.27),
      conduct: Math.round((totalScore || 70) * 0.15),
      communication: Math.round((totalScore || 70) * 0.15),
      reasoning: Math.round((totalScore || 70) * 0.15),
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId,
        caseId,
        totalScore: totalScore || 70,
        scores,
        sections: sections.length ? sections : [{ title: 'Clinical debrief', content: debriefText }],
        generatedAt: new Date().toISOString(),
      }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
