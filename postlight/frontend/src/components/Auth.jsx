import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, LogIn, UserPlus, AlertCircle } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setMessage('Sign-up successful! Check your email to confirm your account.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100vw',
        background: '#090d16',
        backgroundImage:
          'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.18) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.12) 0%, transparent 50%)',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        padding: '1.5rem',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              margin: '0 auto 1rem',
              background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(79, 70, 229, 0.4)',
              color: '#fff',
            }}
          >
            <Wallet size={28} />
          </div>
          <h2
            style={{
              fontSize: '1.65rem',
              fontWeight: '800',
              color: '#ffffff',
              letterSpacing: '-0.02em',
              margin: '0 0 0.35rem 0',
            }}
          >
            WealthTracker
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
            Smart Personal Wealth & Expense Management
          </p>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: '#fca5a5',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#6ee7b7',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
            }}
          >
            {message}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <label
              style={{
                fontSize: '0.78rem',
                fontWeight: '700',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                background: '#0a0f1d',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                fontSize: '0.92rem',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <label
              style={{
                fontSize: '0.78rem',
                fontWeight: '700',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                background: '#0a0f1d',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                fontSize: '0.92rem',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.55rem',
              background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.85rem',
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              marginTop: '0.5rem',
              transition: 'transform 0.15s ease',
            }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : isSignUp ? (
              <>
                <UserPlus size={18} />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle between Sign In / Sign Up */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.45rem',
            marginTop: '1.75rem',
            fontSize: '0.85rem',
            color: '#94a3b8',
          }}
        >
          <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setMessage('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#818cf8',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: 0,
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}