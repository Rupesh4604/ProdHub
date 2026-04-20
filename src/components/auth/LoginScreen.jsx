import React, { useState } from 'react';

export default function LoginScreen({ onGoogleSignIn, onEmailSignIn, onEmailSignUp, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await onGoogleSignIn();
    } catch (err) {
      setError(err.message);
      console.error('Google Sign-In Error:', err);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isSigningUp) {
        await onEmailSignUp(email, password);
      } else {
        await onEmailSignIn(email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: '#0f1117',
        color: '#e2e8f0',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div 
        style={{ 
          width: '100%', 
          maxWidth: '420px', 
          background: '#111827', 
          border: '1px solid #1e293b',
          borderRadius: '16px',
          padding: '2.5rem 1.5rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          position: 'relative'
        }}
      >
        <button 
          onClick={onBack}
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          ← Back
        </button>

        <h2
          style={{
            textAlign: 'center',
            fontSize: '1.35rem',
            fontWeight: 700,
            color: '#f1f5f9',
            marginBottom: '0.25rem',
            marginTop: '1rem'
          }}
        >
          {isSigningUp ? 'Create your account' : 'Sign in to ProdHub'}
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
          Free forever. No credit card required.
        </p>

        {/* Google */}
        <button
          onClick={handleGoogleSignIn}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '10px',
            color: '#e2e8f0',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            marginBottom: '1.25rem',
            transition: 'background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#273448'; e.currentTarget.style.borderColor = '#475569'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.borderColor = '#334155'; }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: '1px', background: '#1e293b' }} />
          <span style={{ color: '#475569', fontSize: '0.8rem' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#1e293b' }} />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '0.7rem 1rem',
              color: '#e2e8f0',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '0.7rem 1rem',
              color: '#e2e8f0',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          {error && (
            <p style={{ color: '#f87171', fontSize: '0.8rem', textAlign: 'center', margin: 0 }}>{error}</p>
          )}
          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              borderRadius: '10px',
              padding: '0.75rem',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(59,130,246,0.3)',
            }}
          >
            {isSigningUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.83rem', color: '#64748b', marginTop: '1rem' }}>
          {isSigningUp ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => setIsSigningUp(!isSigningUp)}
            style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontWeight: 600, fontSize: '0.83rem' }}
          >
            {isSigningUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
