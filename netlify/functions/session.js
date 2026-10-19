// Abhyas — Session starter. Reads the opening text from the case file.

const { getCase } = require('../case-data/index');

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
    const { caseId, userId, action } = JSON.parse(event.body || '{}');
    if (action !== 'start') return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };

    const caseData = getCase(caseId);
    if (!caseData) return { statusCode: 404, headers, body: JSON.stringify({ error: `Unknown case: ${caseId}` }) };

    const sessionId = `${caseId}_${(userId || 'anon').slice(0, 8)}_${Date.now()}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId,
        caseId,
        symptomLabel: caseData.meta.symptomLabel,
        caseNumber: caseData.meta.number,
        openingText: caseData.openingText,
        finalForm: caseData.finalForm,
        startedAt: new Date().toISOString(),
      }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
