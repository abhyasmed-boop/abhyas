import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import LoginPage from './pages/LoginPage';
import CaseLibrary from './pages/CaseLibrary';
import SimulationPage from './pages/SimulationPage';
import DebriefPage from './pages/DebriefPage';

function Loading() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#f7f5f0', flexDirection: 'column', gap: 8
    }}>
      <div style={{ fontSize: 28, fontWeight: 600, color: '#2d5a3d', letterSpacing: '-0.02em' }}>
        Abhyas
      </div>
      <div style={{ fontSize: 13, color: '#a09890' }}>Loading...</div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <Loading />;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/" element={user ? <CaseLibrary user={user} /> : <Navigate to="/login" replace />} />
        <Route path="/simulate/:caseId" element={user ? <SimulationPage user={user} /> : <Navigate to="/login" replace />} />
        <Route path="/debrief/:sessionId" element={user ? <DebriefPage user={user} /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
