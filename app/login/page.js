'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function LoginPage() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const allowed = normalizedEmail.endsWith('@myhunter.cuny.edu') || normalizedEmail.endsWith('@login.cuny.edu');
    if (!allowed) {
      setError('Use your Hunter or CUNY Login email address.');
      setLoading(false);
      return;
    }

    if (mode === 'reset') {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      });
      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }
      setMessage('If an account exists for that email, a password reset link is on the way.');
      setLoading(false);
      return;
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setMessage('Check your CUNY email inbox to confirm your account, then come back and sign in.');
      setMode('signin');
      setLoading(false);
      return;
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    }

    router.push('/dashboard');
    router.refresh();
  }

  async function resendConfirmation() {
    setError('');
    setResending(true);
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    setResending(false);
    if (resendError) setError(resendError.message);
    else setMessage('Confirmation email resent. Check your inbox and spam folder.');
  }

  function switchMode() {
    if (loading || resending) return;
    setMode((current) => current === 'signup' ? 'signin' : 'signup');
    setPassword('');
    setShowPassword(false);
    setError('');
    setMessage('');
  }

  return (
    <main className="shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{ width: '100%', maxWidth: 410, padding: 28 }}
      >
        <div className="eyebrow">Hunter College</div>
        <h1 className="brand" style={{ margin: '7px 0 4px', fontSize: 32 }}>hlpr</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
          {mode === 'signup'
            ? 'Create your account with your Hunter or CUNY Login email.'
            : mode === 'reset'
              ? 'Enter your CUNY email and we’ll send a secure reset link.'
              : 'Sign in with your Hunter or CUNY Login email.'}
        </p>

        {mode === 'signup' && (
          <>
            <label className="sr-only" htmlFor="login-full-name">Full name</label>
            <input id="login-full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" autoComplete="name" required style={inputStyle} />
          </>
        )}
        <label className="sr-only" htmlFor="login-email">CUNY email address</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@myhunter.cuny.edu or @login.cuny.edu"
          autoComplete="email"
          required
          style={inputStyle}
        />
        {mode !== 'reset' && <div className="password-field">
          <label className="sr-only" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
            minLength={6}
            style={{ ...inputStyle, marginBottom: 0 }}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>}

        {mode === 'signin' && (
          <button
            type="button"
            className="forgot-password"
            onClick={() => {
              setMode('reset');
              setPassword('');
              setShowPassword(false);
              setError('');
              setMessage('');
            }}
            disabled={loading || resending}
          >
            Forgot password?
          </button>
        )}

        {error && <p className="error" role="alert">{error}</p>}
        {message && <p className="success" role="status">{message}</p>}
        {message && mode === 'signin' && email && (
          <button type="button" onClick={resendConfirmation} disabled={resending} style={{ ...buttonStyle, background: '#fff', color: '#3F0157', border: '1px solid #e5e7eb', marginBottom: 10 }}>
            {resending ? 'Sending…' : 'Resend confirmation email'}
          </button>
        )}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}
        </button>

        {mode === 'reset' ? (
          <button
            type="button"
            className="login-mode-toggle"
            onClick={() => {
              setMode('signin');
              setError('');
              setMessage('');
            }}
            disabled={loading}
          >
            Back to sign in
          </button>
        ) : (
          <button
            type="button"
            className="login-mode-toggle"
            onClick={switchMode}
            disabled={loading || resending}
          >
            {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
          </button>
        )}
      </form>
    </main>
  );
}

const inputStyle = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: 11,
  padding: '10px 12px',
  fontSize: 14,
  marginBottom: 10,
  outline: 'none',
  boxSizing: 'border-box',
};

const buttonStyle = {
  width: '100%',
  background: '#3F0157',
  color: 'white',
  border: 'none',
  borderRadius: 11,
  padding: '10px 12px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};
