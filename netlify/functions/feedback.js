// Abhyas — Feedback & Analytics Collector
// Stores session data and student feedback to Supabase

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function insertToSupabase(table, data) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.log('Supabase not configured — skipping DB write');
    return { ok: true, skipped: true };
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(data),
  });

  return { ok: res.ok, status: res.status };
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

  try {
    const body = JSON.parse(event.body || '{}');
    const { type } = body;

    if (type === 'session_complete') {
      // Log completed simulation session
      const sessionData = {
        session_id: body.sessionId,
        case_id: body.caseId,
        symptom: body.symptom,
        user_email: body.userEmail || 'anonymous',
        total_score: body.totalScore,
        diagnosis_given: body.diagnosisGiven,
        diagnosis_correct: body.diagnosisCorrect,
        investigations_ordered: JSON.stringify(body.investigationsOrdered || []),
        chaperone_arranged: body.chaperoneArranged,
        vitals_checked: body.vitalsChecked,
        duration_seconds: body.durationSeconds,
        turn_count: body.turnCount,
        created_at: new Date().toISOString(),
      };

      await insertToSupabase('sessions', sessionData);
    }

    if (type === 'feedback') {
      // Log qualitative feedback
      const feedbackData = {
        session_id: body.sessionId,
        user_email: body.userEmail || 'anonymous',
        rating: body.rating,                    // 1-5
        what_worked: body.whatWorked,           // free text
        what_to_improve: body.whatToImprove,   // free text
        topics_wanted: body.topicsWanted,       // free text — what they want to study
        would_use_again: body.wouldUseAgain,   // boolean
        created_at: new Date().toISOString(),
      };

      await insertToSupabase('feedback', feedbackData);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };

  } catch (err) {
    console.error('Feedback error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
