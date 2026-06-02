import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const LEVEL_LABELS = { 1: 'Foundation', 2: 'Intermediate', 3: 'Advanced', 4: 'Expert' };
const LEVEL_COLORS = {
  1: { bg: '#e8f5ed', color: '#2d5a3d' },
  2: { bg: '#fdf3e7', color: '#7a4a0e' },
  3: { bg: '#fbecec', color: '#7a1f1f' },
  4: { bg: '#f0ecfb', color: '#3d1f6b' }
};

// Demo cases shown while DB is being set up
const DEMO_CASES = [
  { case_id: 'CHEST-L1-001', title: 'Costochondritis', level: 1, symptom_cluster: 'chest_pain', estimated_duration_minutes: 20 },
  { case_id: 'CHEST-L1-002', title: 'GERD', level: 1, symptom_cluster: 'chest_pain', estimated_duration_minutes: 20 },
];

export default function CaseLibrary({ user }) {
  const [cases, setCases] = useState(DEMO_CASES);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCases();
  }, []);

  async function loadCases() {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('case_id, title, level, symptom_cluster, estimated_duration_minutes')
        .order('level');
      if (!error && data?.length) setCases(data);
    } catch (e) {
      // DB not set up yet — demo cases already shown
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const grouped = cases.reduce((acc, c) => {
    const cluster = c.symptom_cluster || 'general';
    if (!acc[cluster]) acc[cluster] = [];
    acc[cluster].push(c);
    return acc;
  }, {});

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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#a09890', fontSize: 13 }}>
            Loading cases...
          </div>
        ) : (
          Object.entries(grouped).map(([cluster, clusterCases]) => (
            <div key={cluster} style={{ marginBottom: 28 }}>
              <div style={{
                fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em',
                color: '#a09890', fontFamily: 'monospace', marginBottom: 10
              }}>
                {cluster.replace(/_/g, ' ')} — {clusterCases.length} {clusterCases.length === 1 ? 'case' : 'cases'}
              </div>
              {clusterCases.map(c => {
                const lc = LEVEL_COLORS[c.level] || LEVEL_COLORS[1];
                return (
                  <div
                    key={c.case_id}
                    style={{
                      background: '#fff', border: '0.5px solid #e0dbd2',
                      borderRadius: 10, padding: '14px 18px', marginBottom: 8,
                      display: 'grid', gridTemplateColumns: '1fr auto',
                      gap: 12, alignItems: 'center',
                      cursor: 'pointer', transition: 'border-color 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#2d5a3d'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e0dbd2'}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1c1a16', marginBottom: 4 }}>
                        {c.title}
                      </div>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 999,
                        fontWeight: 500, background: lc.bg, color: lc.color, marginRight: 8
                      }}>
                        {LEVEL_LABELS[c.level] || `L${c.level}`}
                      </span>
                      <span style={{ fontSize: 11, color: '#a09890' }}>
                        ~{c.estimated_duration_minutes} min
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/simulate/${c.case_id}`)}
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
          ))
        )}
      </div>
    </div>
  );
}
