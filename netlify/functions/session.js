// Abhyas — Session starter
// Creates a new simulation session and returns the opening scenario

const OPENINGS = {
  'CHEST-L1-001': `You are a third year MBBS student on your Medicine OPD posting.

Sita Gurung, 21 years old, has just walked into your consulting room. She is holding the left side of her chest with her right hand. She looks anxious. She sits down without being asked.

Please begin.`,

  'CHEST-L1-002': `You are a third year MBBS student on your Medicine OPD posting.

Ram Bahadur Thapa, 44 years old, walks into the OPD holding his upper abdomen and lower chest. He looks mildly uncomfortable. He keeps checking his phone — his shift starts in one hour.

Please begin.`,

  default: 'A patient has arrived. Please begin your assessment.',
};

const SYMPTOM_LABELS = {
  chest_pain: 'Chest Pain',
  shortness_of_breath: 'Shortness of Breath',
  abdominal_pain: 'Abdominal Pain',
};

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { caseId, userId, symptom, action } = JSON.parse(event.body || '{}');
    if (action !== 'start') return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };

    const sessionId = `${caseId}_${(userId || 'anon').slice(0, 8)}_${Date.now()}`;
    const openingText = OPENINGS[caseId] || OPENINGS.default;
    const symptomLabel = SYMPTOM_LABELS[symptom] || 'Clinical Simulation';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId,
        caseId,
        symptomLabel,
        openingText,
        startedAt: new Date().toISOString(),
      }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
