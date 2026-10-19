import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Students only ever see: symptom heading + "Case N" + duration.
// The list comes from the server (the case registry). Diagnosis names and level badges are never sent or shown.

export default function CaseLibrary({ user }) {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadCases(); }, []);

  async function loadCases() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/cases');
      if (!res.ok) throw new Error('Could not load the case list.');
      const data = await res.json();
      setCases(data.cases || []);
    } catch (err) {
      setError(err.message || 'Could not load the case list.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // Group by symptom heading, ordered by case number
  const grouped = cases.reduce((acc, c) => {
    const key = c.symptomLabel || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});
  Object.values(grouped).forEach(list => list.sort((a, b) => (a.number || 0) - (b.number || 0)));

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5f0' }}>
      <div style={{
        background: '#fff', borderBottom: '0.5px solid #e0dbd2',
        padding: '0 24px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#2d5a3d' }}>Abhyas</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#a09890' }}>{user?.email}</span>
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: '1px solid #e0dbd2', borderRadius: 6,
              padding: '4px 12px', fontSize: 12, color: '#6b6459', cursor: 'pointer'
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
        <div style={{ fontSize: 13, color: '#6b6459', marginBottom: 20, lineHeight: 1.6 }}>
          Choose a case. You will meet an AI patient, take the history, examine, investigate and give your diagnosis.
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#a09890', fontSize: 13 }}>
            Loading cases...
          </div>
        )}

        {error && !loading && (
          <div style={{ background: '#fbecec', border: '1px solid #f0a0a0', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: '#7a1f1f' }}>
            {error}
            <div style={{ marginTop: 8 }}>
              <button
                onClick={loadCases}
                style={{ background: '#fff', border: '1px solid #f0a0a0', borderRadius: 6, padding: '4px 12px', fontSize: 12, color: '#7a1f1f', cursor: 'pointer' }}
              >Try again</button>
            </div>
          </div>
        )}

        {!loading && !error && Object.entries(grouped).map(([label, list]) => (
          <div key={label} style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.09em',
              color: '#a09890', fontFamily: 'monospace', marginBottom: 10
            }}>
              {label}
            </div>
            {list.map(c => (
              <div
                key={c.caseId}
                onClick={() => navigate(`/simulate/${c.caseId}`)}
                style={{
                  background: '#fff', border: '0.5px solid #e0dbd2',
                  borderRadius: 10, padding: '14px 18px', marginBottom: 8,
                  display: 'grid', gridTemplateColumns: '1fr auto',
                  gap: 12, alignItems: 'center',
                  cursor: 'pointer', transition: 'border-color 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2d5a3d'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0dbd2'; }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: '#1c1a16', marginBottom: 2 }}>
                    Case {c.number}
                  </div>
                  <div style={{ fontSize: 11, color: '#a09890' }}>
                    ~{c.durationMinutes} min
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); navigate(`/simulate/${c.caseId}`); }}
                  style={{
                    background: '#2d5a3d', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '8px 16px', fontSize: 12,
                    fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Start →
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
