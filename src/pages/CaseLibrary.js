import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Students only ever see: symptom heading + "Case N" + duration.
// Diagnosis names and level badges are deliberately NOT shown anywhere here.
// Temporary list. It will be replaced by the case registry when the new case files are in.
const CASES = [
  { case_id: 'CHEST-L1-001', symptom_cluster: 'chest_pain', estimated_duration_minutes: 20 },
  { case_id: 'CHEST-L1-002', symptom_cluster: 'chest_pain', estimated_duration_minutes: 20 },
];

const SYMPTOM_LABELS = { chest_pain: 'Chest Pain' };

function symptomLabel(cluster) {
  if (SYMPTOM_LABELS[cluster]) return SYMPTOM_LABELS[cluster];
  const text = (cluster || 'general').replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// "CHEST-L1-002" -> 2
function caseNumber(caseId) {
  const parts = (caseId || '').split('-');
  const num = parseInt(parts[parts.length - 1], 10);
  return Number.isNaN(num) ? null : num;
}

export default function CaseLibrary({ user }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const grouped = CASES.reduce((acc, c) => {
    const cluster = c.symptom_cluster || 'general';
    if (!acc[cluster]) acc[cluster] = [];
    acc[cluster].push(c);
    return acc;
  }, {});

  Object.values(grouped).forEach(list =>
    list.sort((a, b) => (caseNumber(a.case_id) || 0) - (caseNumber(b.case_id) || 0))
  );

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

        {Object.entries(grouped).map(([cluster, clusterCases]) => (
          <div key={cluster} style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.09em',
              color: '#a09890', fontFamily: 'monospace', marginBottom: 10
            }}>
              {symptomLabel(cluster)}
            </div>
            {clusterCases.map(c => {
              const num = caseNumber(c.case_id);
              return (
                <div
                  key={c.case_id}
                  onClick={() => navigate(`/simulate/${c.case_id}`)}
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
                      {num ? `Case ${num}` : 'Case'}
                    </div>
                    <div style={{ fontSize: 11, color: '#a09890' }}>
                      ~{c.estimated_duration_minutes} min
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/simulate/${c.case_id}`); }}
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
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
