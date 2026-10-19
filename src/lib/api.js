// All calls to Netlify backend functions

async function post(path, payload, fallbackMessage) {
  const response = await fetch(`/.netlify/functions/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    let message = fallbackMessage;
    try { message = (await response.json()).error || fallbackMessage; } catch (e) { /* keep fallback */ }
    throw new Error(message);
  }
  return response.json();
}

export function startSession(caseId, userId) {
  return post('session', { caseId, userId, action: 'start' }, 'Could not start session');
}

// extras can carry: action, examId, test, conversationHistory, chaperoneArranged
export function sendSimulationTurn(sessionId, message, extras = {}) {
  return post('simulate', { sessionId, message, ...extras }, 'Simulation error');
}

// extras can carry: totalScore, transcript, flags, diagnosis, and so on
// The new consultation engine (consult.js)
export function sendConsultTurn(sessionId, message, extras = {}) {
  return post('consult', { sessionId, message, ...extras }, 'Simulation error');
}

export function generateDebrief(sessionId, extras = {}) {
  return post('debrief', { sessionId, ...extras }, 'Debrief error');
}
