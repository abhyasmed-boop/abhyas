import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { startSession, sendSimulationTurn } from '../lib/api';

const SYMPTOM_NAMES = { CHEST: 'Chest Pain' };

// Any of these words means the student has arranged a chaperone
const CHAPERONE_WORDS = /\b(nurse|chaperone|female (staff|nurse|attendant|colleague)|staff member)\b/i;

const CSS = `
.abhyas-chat { height: 100vh; height: 100dvh; }
@keyframes abhyas-dot { 0%, 60%, 100% { opacity: .25; } 30% { opacity: 1; } }
.abhyas-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  background: #8a8478; margin: 0 2px; animation: abhyas-dot 1.2s infinite; }
.abhyas-dot:nth-child(2) { animation-delay: .2s; }
.abhyas-dot:nth-child(3) { animation-delay: .4s; }
.abhyas-pill:hover:not(:disabled) { background: #e8f5ed; }
.abhyas-opt:hover { background: #f1f6f2; }
`;

function caseHeading(caseId) {
  const parts = (caseId || '').split('-');
  const symptom = SYMPTOM_NAMES[parts[0]] || 'Clinical case';
  const num = parseInt(parts[parts.length - 1], 10);
  return Number.isNaN(num) ? symptom : `${symptom} · Case ${num}`;
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function Bubble({ mine, time, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '80%',
        background: mine ? '#d4e8da' : '#ffffff',
        borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        padding: '8px 12px 6px',
        boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
        fontSize: 14, lineHeight: 1.5, color: '#1c1a16',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word'
      }}>
        {children}
        <div style={{ fontSize: 10, color: '#8a8478', textAlign: 'right', marginTop: 2 }}>{time}</div>
      </div>
    </div>
  );
}

function Card({ bg, border, color, title, children }) {
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`, color,
      borderRadius: 10, padding: '10px 14px', fontSize: 13, lineHeight: 1.6,
      alignSelf: 'center', width: '92%', maxWidth: 480
    }}>
      {title && <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>}
      {children}
    </div>
  );
}

function Sheet({ title, onClose, children }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20,
        background: 'rgba(0,0,0,0.35)', display: 'flex',
        alignItems: 'flex-end', justifyContent: 'center'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', width: '100%', maxWidth: 680, maxHeight: '75vh',
          overflowY: 'auto', borderRadius: '16px 16px 0 0', padding: '16px 16px 24px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1c1a16' }}>{title}</div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', fontSize: 22, color: '#8a8478', cursor: 'pointer', lineHeight: 1 }}
          >×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function vitalsList(v) {
  return [
    { label: 'HR', val: `${v.hr} bpm`, alert: v.hr > 100 || v.hr < 50 },
    { label: 'BP', val: `${v.bp}`, alert: false },
    { label: 'SpO₂', val: `${v.spo2}%`, alert: v.spo2 < 95 },
    { label: 'RR', val: `${v.rr}/min`, alert: v.rr > 20 },
    { label: 'Temp', val: `${v.temp}°C`, alert: v.temp >= 38 },
  ];
}

export default function SimulationPage({ user }) {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [chaperone, setChaperone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTerminal, setIsTerminal] = useState(false);
  const [briefed, setBriefed] = useState(false);
  const [menu, setMenu] = useState({ exams: [], tests: [] });
  const [panel, setPanel] = useState(null); // null | 'exam' | 'tests' | 'diagnose'
  const [examText, setExamText] = useState('');
  const [dxText, setDxText] = useState('');
  const bottomRef = useRef(null);
  const startedFor = useRef(null);
  const flagsRef = useRef(new Set());   // events the server flagged (used by the debrief)
  const logRef = useRef([]);            // full record of the consultation
  const examsRef = useRef([]);
  const testsRef = useRef([]);

  useEffect(() => {
    if (startedFor.current === caseId) return; // stops double-start in dev mode
    startedFor.current = caseId;
    initSession();
  }, [caseId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending, briefed]);

  async function initSession() {
    setLoading(true);
    setMessages([]);
    setVitals(null);
    setChaperone(false);
    setIsTerminal(false);
    setBriefed(false);
    flagsRef.current = new Set();
    logRef.current = [];
    examsRef.current = [];
    testsRef.current = [];
    try {
      const session = await startSession(caseId, user.id);
      setSessionId(session.sessionId);
      addMessage('opening', session.openingText);
      try {
        const m = await sendSimulationTurn(session.sessionId, '', { action: 'menu' });
        setMenu({ exams: m.exams || [], tests: m.tests || [] });
      } catch (e) {
        addMessage('system', 'Could not load the examination and test lists. Please refresh the page.');
      }
    } catch (err) {
      addMessage('system', `Could not load case: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function addMessage(role, content, extra = {}) {
    setMessages(prev => [...prev, {
      role, content, time: nowTime(), id: `${Date.now()}-${Math.random()}`, ...extra
    }]);
  }

  // One function for every kind of turn: talk, examine, order, vitals, diagnose
  async function runTurn({ action = 'talk', text = '', extras = {}, label = null }) {
    if (sending || isTerminal || !sessionId) return;

    // Chaperone: once mentioned, stays arranged for the whole session
    const chaperoneNow = chaperone || CHAPERONE_WORDS.test(text);
    const chaperoneJustArranged = chaperoneNow && !chaperone;
    if (chaperoneJustArranged) setChaperone(true);

    // Only real conversation goes to the AI patient
    const history = messages
      .filter(m => (m.role === 'student' || m.role === 'patient') && !m.skipHistory)
      .map(m => ({ role: m.role === 'student' ? 'user' : 'assistant', content: m.content }));
    if (action === 'talk') history.push({ role: 'user', content: text });

    setSending(true);
    if (action === 'talk') {
      addMessage('student', text);
      logRef.current.push({ role: 'user', content: text });
    } else if (label) {
      addMessage('action', label);
      logRef.current.push({ role: 'user', content: `[ACTION] ${label}` });
    }
    if (chaperoneJustArranged) addMessage('note', 'A nurse is now present in the room.');

    try {
      const result = await sendSimulationTurn(sessionId, text, {
        action,
        conversationHistory: history,
        chaperoneArranged: chaperoneNow,
        ...extras,
      });

      (result.flags || []).forEach(f => flagsRef.current.add(f));

      if (result.patientResponse) {
        const blocked = (result.flags || []).includes('chaperone_needed');
        addMessage('patient', result.patientResponse, { skipHistory: blocked });
        logRef.current.push({ role: 'assistant', content: result.patientResponse });
      }
      if (result.vitalsRevealed && result.vitalsData) {
        setVitals(result.vitalsData);
        addMessage('vitals', result.vitalsData);
        const v = result.vitalsData;
        logRef.current.push({ role: 'assistant', content: `[VITALS] HR ${v.hr}, BP ${v.bp}, SpO2 ${v.spo2}%, RR ${v.rr}, Temp ${v.temp}` });
      }
      if (result.examResult) {
        addMessage('exam', result.examResult);
        examsRef.current.push(result.examResult.name);
        logRef.current.push({ role: 'assistant', content: `[EXAM FINDING] ${result.examResult.name}: ${result.examResult.text}` });
      }
      if (result.assetRevealed) {
        addMessage('asset', result.assetRevealed);
        testsRef.current.push(result.assetRevealed.name);
        logRef.current.push({ role: 'assistant', content: `[TEST RESULT] ${result.assetRevealed.name}: ${result.assetRevealed.text}` });
      }
      if (result.consequenceTriggered && result.consequenceText) {
        addMessage('consequence', result.consequenceText);
      }
      if (result.hint) addMessage('note', result.hint);

      if (result.terminalReached) {
        setIsTerminal(true);
        addMessage('system', 'Consultation complete. Generating your debrief...');
        const state = {
          transcript: logRef.current,
          flags: Array.from(flagsRef.current),
          diagnosis: text,
          diagnosisCorrect: result.diagnosisCorrect,
          examsDone: examsRef.current,
          testsOrdered: testsRef.current,
        };
        setTimeout(() => navigate(`/debrief/${sessionId}`, { state }), 2000);
      }
    } catch (err) {
      addMessage('system', `Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    runTurn({ text });
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function doVitals() {
    if (vitals) { addMessage('note', 'Vital signs are already shown above.'); return; }
    runTurn({ action: 'vitals', label: 'Check vital signs' });
  }

  function doExamMenu(item) {
    setPanel(null);
    runTurn({ action: 'examine', extras: { examId: item.id }, label: `Examine: ${item.label}` });
  }

  function doExamTyped() {
    const t = examText.trim();
    if (!t) return;
    setPanel(null);
    setExamText('');
    runTurn({ action: 'examine', text: t, label: `Examine: ${t}` });
  }

  function doTest(name) {
    setPanel(null);
    runTurn({ action: 'order', extras: { test: name }, label: `Order test: ${name}` });
  }

  function doDiagnose() {
    const t = dxText.trim();
    if (t.length < 3) return;
    setPanel(null);
    setDxText('');
    runTurn({ action: 'diagnose', text: t, label: `My diagnosis: ${t}` });
  }

  function renderMessage(msg) {
    switch (msg.role) {
      case 'opening':
        return (
          <div key={msg.id} style={{
            background: '#fbf6e6', border: '1px solid #eadfb8', borderRadius: 10,
            padding: '14px 16px', fontSize: 13, lineHeight: 1.7, color: '#4a4332',
            whiteSpace: 'pre-wrap', fontStyle: 'italic', alignSelf: 'center', width: '95%'
          }}>{msg.content}</div>
        );
      case 'student':
        return <Bubble key={msg.id} mine time={msg.time}>{msg.content}</Bubble>;
      case 'patient':
        return <Bubble key={msg.id} time={msg.time}>{msg.content}</Bubble>;
      case 'action':
        return (
          <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              background: '#e9efe9', border: '1px dashed #9db8a4', color: '#2d5a3d',
              borderRadius: 14, padding: '6px 12px', fontSize: 12, maxWidth: '80%'
            }}>{msg.content}</div>
          </div>
        );
      case 'note':
        return (
          <div key={msg.id} style={{
            alignSelf: 'center', fontSize: 11, color: '#6b6459', textAlign: 'center',
            background: 'rgba(255,255,255,0.7)', borderRadius: 999, padding: '3px 12px'
          }}>{msg.content}</div>
        );
      case 'vitals':
        return (
          <Card key={msg.id} bg="#eef4fa" border="#b5d3ea" color="#1a3d6b" title="Observations">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 16px', fontFamily: 'monospace' }}>
              {vitalsList(msg.content).map(v => (
                <span key={v.label}>
                  {v.label} <strong style={{ color: v.alert ? '#7a1f1f' : 'inherit' }}>{v.val}</strong>
                </span>
              ))}
            </div>
          </Card>
        );
      case 'exam':
        return (
          <Card key={msg.id} bg="#f1f6f2" border="#b9d3c0" color="#24452f" title={`🩺 ${msg.content.name}`}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content.text}</div>
          </Card>
        );
      case 'asset':
        return (
          <Card key={msg.id}
            bg={msg.content.normal === false ? '#fdf3e7' : '#eef4fa'}
            border={msg.content.normal === false ? '#f0c87a' : '#b5d3ea'}
            color={msg.content.normal === false ? '#7a4a0e' : '#1a3d6b'}
            title={`📋 ${msg.content.name || 'Investigation result'}`}>
            <div style={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' }}>
              {msg.content.text}
            </div>
          </Card>
        );
      case 'consequence':
        return (
          <Card key={msg.id} bg="#fbecec" border="#f0a0a0" color="#7a1f1f" title="⚠️ Professional conduct">
            {msg.content}
          </Card>
        );
      case 'system':
        return (
          <Card key={msg.id} bg="#fdf3e7" border="#f0c87a" color="#7a4a0e">{msg.content}</Card>
        );
      default:
        return null;
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#6b6459', fontSize: 13 }}>
      Starting simulation...
    </div>
  );

  // ── Briefing screen (shown before the consultation starts) ──
  if (!briefed) {
    const hasOpening = messages.some(m => m.role === 'opening');
    return (
      <div style={{ minHeight: '100vh', background: '#f7f5f0', padding: 20, display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: 520, width: '100%', paddingTop: 24 }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: '#6b6459', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16 }}
          >← Back to cases</button>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a09890', fontFamily: 'monospace' }}>
            Before you begin
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#2d5a3d', margin: '4px 0 16px' }}>
            {caseHeading(caseId)}
          </div>
          <div style={{ background: '#fff', border: '1px solid #e0dbd2', borderRadius: 12, padding: '18px 20px', fontSize: 14, lineHeight: 1.7, color: '#1c1a16' }}>
            <p style={{ marginBottom: 10 }}>
              You are the doctor. The patient is an AI-played standardized patient, who will answer as a real patient would.
            </p>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Your task</div>
            <ol style={{ paddingLeft: 20, marginBottom: 12 }}>
              <li><strong>Talk to the patient.</strong> Type your questions in English, one at a time, as you would in a real OPD. The patient answers only what you ask.</li>
              <li><strong>Examine.</strong> Use the <em>Examine</em> button to choose what to examine, or describe it yourself.</li>
              <li><strong>Investigate.</strong> Use <em>Order test</em> only if you think a test is needed.</li>
              <li><strong>Give your diagnosis.</strong> When you are ready, press <em>Give diagnosis</em>. This ends the consultation and opens your feedback.</li>
            </ol>
            <p style={{ fontSize: 13, color: '#6b6459' }}>
              About 20 minutes. Your professional conduct and communication are assessed along with your clinical reasoning. Behave as you would with a real patient.
            </p>
          </div>
          <button
            onClick={() => setBriefed(true)}
            disabled={!hasOpening || !sessionId}
            style={{
              marginTop: 16, width: '100%', background: '#2d5a3d', color: '#fff', border: 'none',
              borderRadius: 10, padding: '14px', fontSize: 15, fontWeight: 500, cursor: 'pointer',
              opacity: (!hasOpening || !sessionId) ? 0.5 : 1
            }}
          >
            Begin consultation
          </button>
          {!hasOpening && (
            <div style={{ marginTop: 12 }}>
              {messages.filter(m => m.role === 'system').map(m => (
                <div key={m.id} style={{ color: '#7a1f1f', fontSize: 13 }}>{m.content}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const canSend = input.trim() && !sending && !isTerminal && sessionId;
  const busy = sending || isTerminal;
  const pillStyle = {
    background: '#fff', border: '1px solid #c9d8cd', color: '#2d5a3d',
    borderRadius: 999, padding: '7px 14px', fontSize: 12.5, fontWeight: 500,
    cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1,
    whiteSpace: 'nowrap', fontFamily: 'inherit'
  };
  const testGroups = menu.tests.reduce((acc, t) => {
    (acc[t.group] = acc[t.group] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="abhyas-chat" style={{ display: 'flex', flexDirection: 'column', background: '#ece7dc' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{
        background: '#2d5a3d', color: '#fff', flexShrink: 0,
        padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10
      }}>
        <button
          onClick={() => navigate('/')}
          aria-label="Back to cases"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{caseHeading(caseId)}</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>{sending ? 'typing…' : 'Patient'}</div>
        </div>
      </div>

      {/* Vitals strip: only after the student has asked for them */}
      {vitals && (
        <div style={{
          background: '#f4f1e8', borderBottom: '1px solid #e0dbd2', flexShrink: 0,
          padding: '5px 14px', display: 'flex', flexWrap: 'wrap', gap: '2px 14px',
          fontFamily: 'monospace', fontSize: 11, color: '#6b6459'
        }}>
          {vitalsList(vitals).map(v => (
            <span key={v.label}>
              {v.label} <strong style={{ color: v.alert ? '#7a1f1f' : '#1c1a16' }}>{v.val}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.map(renderMessage)}
          {sending && (
            <div style={{ display: 'flex' }}>
              <div style={{
                background: '#fff', borderRadius: '14px 14px 14px 4px',
                padding: '12px 14px', boxShadow: '0 1px 1px rgba(0,0,0,0.08)'
              }}>
                <span className="abhyas-dot" /><span className="abhyas-dot" /><span className="abhyas-dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ background: '#f4f1e8', borderTop: '1px solid #e0dbd2', padding: '8px 12px 0', flexShrink: 0 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          <button className="abhyas-pill" disabled={busy} onClick={doVitals} style={pillStyle}>🩸 Vitals</button>
          <button className="abhyas-pill" disabled={busy} onClick={() => setPanel('exam')} style={pillStyle}>🩺 Examine</button>
          <button className="abhyas-pill" disabled={busy} onClick={() => setPanel('tests')} style={pillStyle}>📋 Order test</button>
          <button
            className="abhyas-pill" disabled={busy} onClick={() => setPanel('diagnose')}
            style={{ ...pillStyle, background: '#2d5a3d', color: '#fff', borderColor: '#2d5a3d' }}
          >✅ Give diagnosis</button>
        </div>
      </div>

      {/* Input bar */}
      <div style={{ background: '#f4f1e8', padding: '8px 12px', flexShrink: 0 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isTerminal ? 'Generating debrief...' : 'Type a message to the patient...'}
            disabled={busy}
            rows={1}
            style={{
              flex: 1, border: '1px solid #e0dbd2', borderRadius: 20,
              padding: '10px 16px', fontSize: 14, fontFamily: 'inherit',
              color: '#1c1a16', outline: 'none', resize: 'none',
              background: '#fff', maxHeight: 120
            }}
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send"
            style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none',
              background: '#2d5a3d', cursor: canSend ? 'pointer' : 'not-allowed',
              opacity: canSend ? 1 : 0.5, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Examine sheet */}
      {panel === 'exam' && (
        <Sheet title="What do you want to examine?" onClose={() => setPanel(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {menu.exams.map(item => (
              <button
                key={item.id}
                className="abhyas-opt"
                onClick={() => doExamMenu(item)}
                style={{
                  background: '#fff', border: '1px solid #e0dbd2', borderRadius: 10,
                  padding: '10px 12px', fontSize: 13, textAlign: 'left', cursor: 'pointer',
                  color: '#1c1a16', fontFamily: 'inherit'
                }}
              >{item.label}</button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#6b6459', margin: '16px 0 6px' }}>
            Or describe exactly what you want to do:
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={examText}
              onChange={e => setExamText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') doExamTyped(); }}
              placeholder="e.g. palpate the chest wall"
              style={{
                flex: 1, border: '1px solid #e0dbd2', borderRadius: 8, padding: '10px 12px',
                fontSize: 14, fontFamily: 'inherit', outline: 'none'
              }}
            />
            <button
              onClick={doExamTyped}
              disabled={!examText.trim()}
              style={{
                background: '#2d5a3d', color: '#fff', border: 'none', borderRadius: 8,
                padding: '0 18px', fontSize: 13, cursor: 'pointer', opacity: examText.trim() ? 1 : 0.5
              }}
            >Go</button>
          </div>
        </Sheet>
      )}

      {/* Order test sheet */}
      {panel === 'tests' && (
        <Sheet title="Order a test" onClose={() => setPanel(null)}>
          {Object.entries(testGroups).map(([group, items]) => (
            <div key={group} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a09890', fontFamily: 'monospace', marginBottom: 6 }}>
                {group}
              </div>
              {items.map(t => (
                <button
                  key={t.name}
                  className="abhyas-opt"
                  onClick={() => doTest(t.name)}
                  style={{
                    display: 'block', width: '100%', background: '#fff', border: '1px solid #e0dbd2',
                    borderRadius: 10, padding: '10px 12px', fontSize: 13, textAlign: 'left',
                    cursor: 'pointer', color: '#1c1a16', marginBottom: 6, fontFamily: 'inherit'
                  }}
                >{t.name}</button>
              ))}
            </div>
          ))}
        </Sheet>
      )}

      {/* Diagnosis sheet */}
      {panel === 'diagnose' && (
        <Sheet title="Give your diagnosis" onClose={() => setPanel(null)}>
          <div style={{ fontSize: 13, color: '#6b6459', lineHeight: 1.6, marginBottom: 10 }}>
            Write your diagnosis and the main reasons for it. <strong>This ends the consultation</strong>, and you cannot ask or examine anything more.
          </div>
          <textarea
            value={dxText}
            onChange={e => setDxText(e.target.value)}
            rows={4}
            placeholder="My diagnosis is... because..."
            style={{
              width: '100%', border: '1px solid #e0dbd2', borderRadius: 8, padding: '10px 12px',
              fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical'
            }}
          />
          <button
            onClick={doDiagnose}
            disabled={dxText.trim().length < 3}
            style={{
              marginTop: 10, width: '100%', background: '#2d5a3d', color: '#fff', border: 'none',
              borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              opacity: dxText.trim().length < 3 ? 0.5 : 1
            }}
          >Submit and end consultation</button>
        </Sheet>
      )}
    </div>
  );
}
