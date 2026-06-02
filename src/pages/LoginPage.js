import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: window.location.origin }
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f7f5f0',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#fff', border: '0.5px solid #e0dbd2',
        borderRadius: 12, padding: '40px 36px',
        width: '100%', maxWidth: 380,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
      }}>
        <div style={{ fontSize: 32, fontWeight: 600, color: '#2d5a3d', marginBottom: 4, letterSpacing: '-0.02em' }}>
          Abhyas
        </div>
        <div style={{ fontSize: 13, color: '#6b6459', marginBottom: 32, lineHeight: 1.6 }}>
          Clinical simulation platform.<br />
          Learn by doing, not reading.
        </div>

        {sent ? (
          <div style={{
            background: '#e8f5ed', border: '1px solid #a8d4b5',
            borderRadius: 8, padding: '14px', fontSize: 13, color: '#2d5a3d', lineHeight: 1.6
          }}>
            ✓ Check your email — we sent you a login link. Click it to access Abhyas.
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 500,
              color: '#6b6459', marginBottom: 6,
              textTransform: 'uppercase', letterSpacing: '0.07em'
            }}>
              Email address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              required
              style={{
                width: '100%', border: '1px solid #e0dbd2',
                borderRadius: 8, padding: '10px 14px',
                fontSize: 14, fontFamily: 'inherit',
                color: '#1c1a16', outline: 'none', marginBottom: 12
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', background: '#2d5a3d', color: '#fff',
                border: 'none', borderRadius: 8, padding: '12px',
                fontSize: 14, fontFamily: 'inherit', fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Sending...' : 'Send me a login link'}
            </button>

            {error && (
              <div style={{
                marginTop: 12, background: '#fbecec',
                border: '1px solid #f0a0a0', borderRadius: 8,
                padding: '10px 14px', fontSize: 12, color: '#7a1f1f'
              }}>
                {error}
              </div>
            )}
          </form>
        )}

        <div style={{ marginTop: 24, fontSize: 11, color: '#a09890', lineHeight: 1.6 }}>
          Access is by invitation. Contact Dr. Apurb Sharma if you have not received an invite.
        </div>
      </div>
    </div>
  );
}
