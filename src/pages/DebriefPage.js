import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { generateDebrief } from '../lib/api';

// Replace with your own feedback form when you have one
const FEEDBACK_FORM_URL = 'https://forms.google.com';

const STATUS = {
  met: { icon: '✓', color: '#2d5a3d', bg: '#e8f5ed', border: '#a8d4b5' },
  not_met: { icon: '✗', color: '#7a1f1f', bg: '#fbecec', border: '#f0a0a0' },
  unclear: { icon: '?', color: '#7a4a0e', bg: '#fdf3e7', border: '#f0c87a' },
};

function cacheKey(id) { return `abhyas_debrief_${id}`; }
function readCache(id) {
  try { const raw = sessionStorage.getItem(cacheKey(id)); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
function writeCache(id, value) {
  try { sessionStorage.setItem(cacheKey(id), JSON.stringify(value)); } catch (e) { /* ignore */ }
}

function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff', border: '0.5px solid #e0dbd2', borderRadius: 10,
      padding: '16px 18px', marginBottom: 12, ...style
    }}>{children}</div>
  );
}

function Label({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 500, color: '#a09890', textTransform: 'uppercase',
      letterSpacing: '0.07em', marginBottom: 8
    }}>{children}</div>
  );
}

export default function DebriefPage({ user }) {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [missing, setMissing] = useState(false);
  const startedFor = useRef(null);

  useEffect(() => {
    if (startedFor.current === sessionId) return; // stops a double call in dev mode
    startedFor.current = sessionId;
    load();
    // eslint-disable-next-line
  }, [sessionId]);

  async function load() {
    setLoading(true);
    setError(null);
    setMissing(false);
    try {
      const cached = readCache(sessionId);
      if (cached) { setReport(cached); return; }
      const payload = location.state;
      if (!payload || !payload.state) { setMissing(true); return; }
      const result = await generateDebrief(sessionId, {
        caseId: payload.caseId,
        state: payload.state,
        transcript: payload.transcript,
        endedBy: payload.endedBy,
      });
      writeCache(sessionId, result);
      setReport(result);
    } catch (err) {
      setError(err.message || 'Could not generate your feedback.');
    } finally {
      setLoading(false);
    }
  }

  const topBar = (right) => (
    <div style={{
      background: '#fff', borderBottom: '0.5px solid #e0dbd2',
      padding: '0 24px', height: 52,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#2d5a3d' }}>Abhyas · Feedback</div>
      {right}
    </div>
  );

  const goButtons = (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          background: '#2d5a3d', color: '#fff', border: 'none', borderRadius: 8,
          padding: '12px 24px', fontSize: 13, fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer'
        }}
      >Case library</button>
    </div>
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#6b6459', fontSize: 13, flexDirection: 'column', gap: 8 }}>
      <div>Preparing your feedback...</div>
      <div style={{ fontSize: 11, color: '#a09890' }}>This takes about 10 seconds</div>
    </div>
  );

  if (missing) return (
    <div style={{ minHeight: '100vh', background: '#f7f5f0' }}>
      {topBar(null)}
      <div style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
        <Card>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: '#1c1a16', marginBottom: 14 }}>
            Your feedback can only be opened straight after you finish a consultation, because the record of your consultation is not stored yet.
            If you reloaded or reopened this page, please run the case again.
          </div>
          {goButtons}
        </Card>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#f7f5f0' }}>
      {topBar(null)}
      <div style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
        <Card style={{ borderColor: '#f0a0a0' }}>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: '#7a1f1f', marginBottom: 14 }}>
            Could not prepare your feedback: {error}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={load}
              style={{
                background: '#2d5a3d', color: '#fff', border: 'none', borderRadius: 8,
                padding: '12px 24px', fontSize: 13, fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer'
              }}
            >Try again</button>
            <button
              onClick={() => navigate('/')}
              style={{
                background: '#fff', color: '#1c1a16', border: '1px solid #e0dbd2', borderRadius: 8,
                padding: '12px 24px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer'
              }}
            >Case library</button>
          </div>
        </Card>
      </div>
    </div>
  );

  if (!report) return null;

  const r = report;
  const neverEvent = r.result && r.result.neverEvent;
  const range = r.scoreMin !== r.scoreMax;
  const unconfirmedCount = (r.items || []).filter(i => i.status === 'unclear').length;
  const resultColor = neverEvent ? '#7a1f1f'
    : (r.result.label === 'Not yet passing' ? '#7a4a0e' : '#2d5a3d');

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5f0' }}>
      {topBar(
        <div style={{ fontSize: 13, color: '#6b6459' }}>
          {r.symptomLabel} · Case {r.caseNumber}
        </div>
      )}

      <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>

        {/* Never event: shown first, in red */}
        {neverEvent && (
          <div style={{
            background: '#7a1f1f', color: '#fff', borderRadius: 10,
            padding: '18px 20px', marginBottom: 12, lineHeight: 1.7
          }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.09em', opacity: 0.8, marginBottom: 6 }}>
              Never event
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Not passed</div>
            {(r.neverEvents || []).map(n => (
              <div key={n.flag} style={{ fontSize: 14, marginBottom: 6 }}>{n.text}</div>
            ))}
            {r.teaching && r.teaching.chaperoneStatement && (
              <div style={{ fontSize: 13, opacity: 0.92, marginTop: 10 }}>{r.teaching.chaperoneStatement}</div>
            )}
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 10 }}>
              A never event means the consultation is not passed, whatever your total score is.
            </div>
          </div>
        )}

        {/* Score */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 40, fontWeight: 600, fontFamily: 'monospace', color: resultColor }}>
              {r.total}<span style={{ fontSize: 18, color: '#a09890' }}>/100</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: resultColor }}>
              {r.result.label}{r.result.provisional && !neverEvent ? ' (provisional)' : ''}
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#a09890', marginTop: 4 }}>
            Pass {r.thresholds.pass} · Merit {r.thresholds.merit} · Distinction {r.thresholds.distinction}
          </div>
          {range && (
            <div style={{
              marginTop: 12, background: '#fdf3e7', border: '1px solid #f0c87a', borderRadius: 8,
              padding: '10px 12px', fontSize: 12.5, lineHeight: 1.6, color: '#7a4a0e'
            }}>
              {unconfirmedCount} item{unconfirmedCount === 1 ? '' : 's'} could not be confirmed from the record, so your score lies between {r.scoreMin} and {r.scoreMax}.
              Nothing was deducted for unconfirmed items.
            </div>
          )}
          {r.judging && r.judging.problem && (
            <div style={{
              marginTop: 10, background: '#fbecec', border: '1px solid #f0a0a0', borderRadius: 8,
              padding: '10px 12px', fontSize: 12.5, lineHeight: 1.6, color: '#7a1f1f'
            }}>
              The AI examiner did not answer fully this time, so some items show as unconfirmed. Running the case again will give a fuller result.
            </div>
          )}
        </Card>

        {/* The reveal */}
        <Card>
          <Label>The diagnosis</Label>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: '#1c1a16' }}>
            <div>This case was: <strong>{r.diagnosisName}</strong></div>
            <div style={{ marginTop: 4, color: '#6b6459' }}>You wrote: {r.studentDiagnosis || '(nothing)'}</div>
          </div>
        </Card>

        {/* Domain scores */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 8, marginBottom: 12
        }}>
          {r.domains.map(d => (
            <div key={d.id} style={{
              background: '#fff', border: '0.5px solid #e0dbd2', borderRadius: 8, padding: 12, textAlign: 'center'
            }}>
              <div style={{ fontSize: 10, color: '#a09890', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                {d.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 500, fontFamily: 'monospace', color: '#1c1a16' }}>
                {d.score}<span style={{ fontSize: 12, color: '#a09890' }}>/{d.max}</span>
              </div>
              {d.unconfirmed > 0 && (
                <div style={{ fontSize: 10, color: '#7a4a0e', marginTop: 2 }}>{d.unconfirmed} unconfirmed</div>
              )}
            </div>
          ))}
        </div>

        {/* Item-by-item, with proof */}
        {r.domains.map(d => (
          <Card key={d.id}>
            <Label>{d.label}</Label>
            {r.items.filter(i => i.domain === d.id).map(it => {
              const st = STATUS[it.status] || STATUS.unclear;
              return (
                <div key={it.id} style={{
                  display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 10,
                  padding: '10px 0', borderTop: '0.5px solid #efebe3'
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', background: st.bg, color: st.color,
                    border: `1px solid ${st.border}`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 13, fontWeight: 600
                  }}>{st.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1c1a16', marginBottom: 2 }}>{it.label}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: '#3f3b34' }}>{it.text}</div>
                    {it.evidence && (
                      <div style={{ fontSize: 12, color: '#6b6459', marginTop: 4, fontStyle: 'italic' }}>{it.evidence}</div>
                    )}
                    {it.note && (
                      <div style={{ fontSize: 11.5, color: '#a09890', marginTop: 4 }}>{it.note}</div>
                    )}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b6459', whiteSpace: 'nowrap' }}>
                    {it.awarded}/{it.points}
                  </div>
                </div>
              );
            })}
          </Card>
        ))}

        {/* Penalties */}
        {r.penalties && r.penalties.length > 0 && (
          <Card>
            <Label>Penalties</Label>
            {r.penalties.map(p => (
              <div key={p.id} style={{
                display: 'grid', gridTemplateColumns: '1fr auto', gap: 10,
                padding: '8px 0', borderTop: '0.5px solid #efebe3', fontSize: 13, lineHeight: 1.6
              }}>
                <div style={{ color: p.status === 'unclear' ? '#7a4a0e' : '#7a1f1f' }}>
                  {p.status === 'unclear'
                    ? `Could not confirm whether this applies: ${p.text}`
                    : p.text}
                </div>
                <div style={{ fontFamily: 'monospace', color: '#6b6459' }}>
                  {p.status === 'unclear' ? '—' : p.points}
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* What the patient would have told you */}
        {r.missedTopics && r.missedTopics.length > 0 && (
          <Card>
            <details>
              <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#1c1a16' }}>
                What the patient would have told you if you had asked ({r.missedTopics.length})
              </summary>
              <div style={{ marginTop: 10 }}>
                {r.missedTopics.map(t => (
                  <div key={t.id} style={{ padding: '8px 0', borderTop: '0.5px solid #efebe3' }}>
                    <div style={{ fontSize: 12, color: '#a09890', marginBottom: 2 }}>If you had asked about: {t.label}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: '#3f3b34', fontStyle: 'italic' }}>{t.say}</div>
                    {t.variantSay && (
                      <div style={{ fontSize: 12.5, lineHeight: 1.6, color: '#6b6459', marginTop: 4 }}>
                        After a promise of privacy: <span style={{ fontStyle: 'italic' }}>{t.variantSay}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          </Card>
        )}

        {/* Teaching */}
        {r.teaching && (
          <>
            {r.teaching.keyLesson && (
              <Card>
                <Label>The key clinical lesson</Label>
                <div style={{ fontSize: 13, lineHeight: 1.8, color: '#1c1a16' }}>{r.teaching.keyLesson}</div>
              </Card>
            )}
            {(r.teaching.teachingPoints || []).length > 0 && (
              <Card>
                <Label>Teaching points</Label>
                {r.teaching.teachingPoints.map(t => (
                  <div key={t.id} style={{ padding: '8px 0', borderTop: '0.5px solid #efebe3' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1c1a16', marginBottom: 2 }}>{t.title}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.7, color: '#3f3b34' }}>{t.text}</div>
                  </div>
                ))}
              </Card>
            )}
            {r.teaching.managementPlan && (
              <Card>
                <Label>A usual management plan</Label>
                <div style={{ fontSize: 13, lineHeight: 1.8, color: '#1c1a16' }}>{r.teaching.managementPlan}</div>
              </Card>
            )}
            {r.teaching.safetyNet && (
              <Card style={{ borderColor: '#a8d4b5', background: '#f4faf6' }}>
                <Label>Safety net: always give this</Label>
                <div style={{ fontSize: 13, lineHeight: 1.8, color: '#1c1a16' }}>{r.teaching.safetyNet}</div>
              </Card>
            )}
          </>
        )}

        {/* Your own record */}
        <Card>
          <details>
            <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#1c1a16' }}>
              Your record of this consultation
            </summary>
            <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7, color: '#3f3b34' }}>
              {[['Examination findings', r.record.final.findings], ['Diagnosis', r.record.final.diagnosis],
                ['Reasoning', r.record.final.reasoning], ['Management', r.record.final.management]].map(([k, v]) => (
                <div key={k} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: '#a09890', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{v || '(nothing written)'}</div>
                </div>
              ))}
              <div style={{ fontSize: 12, color: '#6b6459', marginTop: 8 }}>
                Messages you sent: {r.record.messageCount}. Vital signs checked: {r.record.vitalsChecked ? 'yes' : 'no'}.
              </div>
              <div style={{ fontSize: 12, color: '#6b6459', marginTop: 4 }}>
                Examinations, in your order: {r.record.examOrder.length ? r.record.examOrder.join(' → ') : 'none'}.
              </div>
              <div style={{ fontSize: 12, color: '#6b6459', marginTop: 4 }}>
                Tests ordered: {r.record.tests.length ? r.record.tests.join(', ') : 'none'}.
              </div>
            </div>
          </details>
        </Card>

        {/* How this feedback was made */}
        <div style={{ fontSize: 11.5, lineHeight: 1.7, color: '#a09890', margin: '4px 2px 16px' }}>
          How this feedback was made: your score is worked out by fixed rules from what happened in your consultation.
          Items that depend on your wording are checked by two AI examiners that must agree and must quote your own words.
          When they cannot, we say “could not confirm” and do not guess. The teaching text is fixed for each case and is not written by AI.
          Abhyas is in testing, so please tell us if anything here looks wrong.
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(`/simulate/${r.caseId}`)}
            style={{
              background: '#2d5a3d', color: '#fff', border: 'none', borderRadius: 8,
              padding: '12px 24px', fontSize: 13, fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer'
            }}
          >Run again</button>
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#fff', color: '#1c1a16', border: '1px solid #e0dbd2', borderRadius: 8,
              padding: '12px 24px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer'
            }}
          >Case library</button>
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', background: '#fff', color: '#1c1a16',
              border: '1px solid #e0dbd2', borderRadius: 8, padding: '12px 24px', fontSize: 13,
              fontFamily: 'inherit', textDecoration: 'none'
            }}
          >Report a mistake ↗</a>
        </div>
      </div>
    </div>
  );
}
