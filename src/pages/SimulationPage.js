import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { startSession, sendSimulationTurn } from '../lib/api';

export default function SimulationPage({ user }) {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [vitals, setVitals] = useState({ hr: 82, bp: '116/72', spo2: '99%', rr: 14 });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTerminal, setIsTerminal] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { initSession(); }, [caseId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function initSession() {
    try {
      const session = await startSession(caseId, user.id);
      setSessionId(session.sessionId);
      addMessage('opening', session.openingText);
    } catch (err) {
      addMessage('system', `Could not load case: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function addMessage(role, content) {
    setMessages(prev => [...prev, { role, content, id: `${Date.now()}-${Math.random()}` }]);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending || isTerminal || !sessionId) return;
    setInput('');
    setSending(true);
    addMessage('student', text);

    try {
      const result = await sendSimulationTurn(sessionId, text);
      addMessage('patient', result.patientResponse);
      if (result.vitalsUpdate) setVitals(result.vitalsUpdate);
      if (result.consequenceTriggered) addMessage('consequence', result.consequenceText);
      if (result.assetRevealed) addMessage('asset', result.assetRevealed);
      if (result.terminalReached) {
        setIsTerminal(true);
        addMessage('system', 'Simulation complete. Generating your debrief...');
        setTimeout(() => navigate(`/debrief/${sessionId}`), 2500);
      }
    } catch (err) {
      addMessage('system', `Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#6b6459', fontSize: 13 }}>
      Starting simulation...
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5f0', display: 'flex', flexDirection: 'column' }}>

      {/* Header with vitals */}
      <div style={{
        background: '#fff', borderBottom: '0.5px solid #e0dbd2',
        padding: '0 20px', height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#1c1a16' }}>
          Abhyas — {caseId}
        </div>
        <div style={{ display: 'flex', gap: 16, fontFamily: 'monospace', fontSize: 11 }}>
          {[
            { label: 'HR', val: vitals.hr, alert: vitals.hr > 100 },
            { label: 'BP', val: vitals.bp, alert: false },
            { label: 'SpO₂', val: vitals.spo2, alert: parseInt(vitals.spo2) < 95 },
            { label: 'RR', val: vitals.rr, alert: vitals.rr > 20 },
          ].map(v => (
            <span key={v.label} style={{ color: '#6b6459' }}>
              {v.label} <span style={{ fontWeight: 500, color: v.alert ? '#7a1f1f' : '#1c1a16' }}>{v.val}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: 10,
        maxWidth: 680, width: '100%', margin: '0 auto', alignSelf: 'center'
      }}>
        {messages.map(msg => {
          if (msg.role === 'opening') return (
            <div key={msg.id} style={{
              background: '#fff', border: '0.5px solid #e0dbd2', borderRadius: 10,
              padding: '16px', fontSize: 13, lineHeight: 1.8, color: '#1c1a16',
              whiteSpace: 'pre-wrap', fontStyle: 'italic'
            }}>{msg.content}</div>
          );
          if (msg.role === 'patient') return (
            <div key={msg.id}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a09890', fontFamily: 'monospace', marginBottom: 3 }}>Patient</div>
              <div style={{ background: '#fff', border: '0.5px solid #e0dbd2', borderRadius: 10, padding: '10px 14px', fontSize: 13, lineHeight: 1.6, maxWidth: '85%' }}>{msg.content}</div>
            </div>
          );
          if (msg.role === 'student') return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a09890', fontFamily: 'monospace', marginBottom: 3 }}>You</div>
              <div style={{ background: '#e8f5ed', border: '0.5px solid #a8d4b5', borderRadius: 10, padding: '10px 14px', fontSize: 13, lineHeight: 1.6, maxWidth: '85%' }}>{msg.content}</div>
            </div>
          );
          if (msg.role === 'consequence') return (
            <div key={msg.id} style={{ background: '#fbecec', border: '0.5px solid #f0a0a0', borderRadius: 10, padding: '12px 14px', fontSize: 12, lineHeight: 1.6, color: '#7a1f1f' }}>⚠️ {msg.content}</div>
          );
          if (msg.role === 'asset') return (
            <div key={msg.id} style={{ background: '#eef4fa', border: '0.5px solid #7db8e0', borderRadius: 10, padding: '12px 14px', fontSize: 12, lineHeight: 1.6, color: '#1a3d6b' }}>📋 Investigation result: {msg.content}</div>
          );
          if (msg.role === 'system') return (
            <div key={msg.id} style={{ background: '#fdf3e7', border: '0.5px solid #f0c87a', borderRadius: 10, padding: '12px 14px', fontSize: 12, lineHeight: 1.6, color: '#7a4a0e' }}>{msg.content}</div>
          );
          return null;
        })}

        {sending && (
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a09890', fontFamily: 'monospace', marginBottom: 3 }}>Patient</div>
            <div style={{ background: '#fff', border: '0.5px solid #e0dbd2', borderRadius: 10, padding: '10px 14px', color: '#a09890', fontSize: 13 }}>...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: '#fff', borderTop: '0.5px solid #e0dbd2', padding: '12px 20px', flexShrink: 0 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', gap: 8 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isTerminal ? 'Generating debrief...' : 'Assess the patient, examine, order investigations, state diagnosis...'}
            disabled={sending || isTerminal}
            rows={2}
            style={{
              flex: 1, border: '1px solid #e0dbd2', borderRadius: 8,
              padding: '10px 14px', fontSize: 13, fontFamily: 'inherit',
              color: '#1c1a16', outline: 'none', resize: 'none'
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || isTerminal}
            style={{
              background: '#2d5a3d', color: '#fff', border: 'none',
              borderRadius: 8, padding: '0 20px', fontSize: 13,
              fontFamily: 'inherit', fontWeight: 500,
              cursor: (sending || isTerminal) ? 'not-allowed' : 'pointer',
              opacity: (sending || isTerminal) ? 0.6 : 1, alignSelf: 'flex-end', height: 44
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
