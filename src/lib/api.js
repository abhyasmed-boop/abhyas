// All calls to Netlify backend functions

export async function startSession(caseId, userId) {
  const response = await fetch('/.netlify/functions/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseId, userId, action: 'start' })
  });
  if (!response.ok) throw new Error((await response.json()).error || 'Could not start session');
  return response.json();
}

export async function sendSimulationTurn(sessionId, message) {
  const response = await fetch('/.netlify/functions/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message })
  });
  if (!response.ok) throw new Error((await response.json()).error || 'Simulation error');
  return response.json();
}

export async function generateDebrief(sessionId) {
  const response = await fetch('/.netlify/functions/debrief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  });
  if (!response.ok) throw new Error((await response.json()).error || 'Debrief error');
  return response.json();
}
