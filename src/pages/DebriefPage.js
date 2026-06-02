import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateDebrief } from '../lib/api';

const DOMAIN_LABELS = {
  history: 'History',
  examination: 'Examination',
  conduct: 'Conduct',
  communication: 'Communication',
  reasoning: 'Reasoning'
};

export default function DebriefPage({ user }) {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [debrief, setDebrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadDebrief(); }, [sessionId]);

  async function loadDebrief() {
    try {
      const result = await generateDebrief(sessionId);
      setDebrief(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#6b6459', fontSize: 13, flexDirection: 'column', gap: 8 }}>
      <div>Generating your debrief...</div>
      <div style={{ fontSize: 11, color: '#a09890' }}>This takes a few seconds</div>
    </div>
  );

  if (error) return (
    <div style={{ padding: 24, color: '#7a1f1f', fontSize: 13 }}>Error: {error}</div>
  );

  const totalScore = debrief?.totalScore || 0;
  const scoreColor = totalScore >= 85 ? '#2d5a3d' : totalScore >= 65 ? '#7a4a0e' : '#7a1f1f';

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5f0' }}>
      <div style={{
        background: '#fff', borderBottom: '0.5px solid #e0dbd2',
        padding: '0 24px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#2d5a3d' }}>Abhyas — Debrief</div>
        <div style={{ fontSize: 13, color: '#6b6459' }}>
          Total: <strong style={{ color: scoreColor }}>{totalScore}/100</strong>
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>

        {/* Score grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 8, marginBottom: 20
        }}>
          {Object.entries(debrief?.scores || {}).map(([domain, score]) => (
            <div key={domain} style={{
              background: '#fff', border: '0.5px solid #e0dbd2',
              borderRadius: 8, padding: 12, textAlign: 'center'
            }}>
              <div style={{ fontSize: 10, color: '#a09890', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                {DOMAIN_LABELS[domain] || domain}
              </div>
              <div style={{ fontSize: 20, fontWeight: 500, fontFamily: 'monospace', color: '#1c1a16' }}>
                {score}
              </div>
            </div>
          ))}
        </div>

        {/* Debrief sections */}
        {(debrief?.sections || []).map((section, i) => (
          <div key={i} style={{
            background: '#fff', border: '0.5px solid #e0dbd2',
            borderRadius: 10, padding: '18px 20px', marginBottom: 10
          }}>
            <div style={{
              fontSize: 11, fontWeight: 500, color: '#a09890',
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8
            }}>
              {section.title}
            </div>
            <div style={{ fontSize: 13, color: '#1c1a16', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {section.content}
            </div>
          </div>
        ))}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(`/simulate/${debrief?.caseId || 'CHEST-L1-001'}`)}
            style={{
              background: '#2d5a3d', color: '#fff', border: 'none',
              borderRadius: 8, padding: '12px 24px', fontSize: 13,
              fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer'
            }}
          >
            Run again
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#fff', color: '#1c1a16',
              border: '1px solid #e0dbd2', borderRadius: 8,
              padding: '12px 24px', fontSize: 13,
              fontFamily: 'inherit', cursor: 'pointer'
            }}
          >
            Case library
          </button>
          <a
            href="https://forms.google.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center',
              background: '#fff', color: '#1c1a16',
              border: '1px solid #e0dbd2', borderRadius: 8,
              padding: '12px 24px', fontSize: 13,
              fontFamily: 'inherit', textDecoration: 'none'
            }}
          >
            Feedback ↗
          </a>
        </div>
      </div>
    </div>
  );
}
