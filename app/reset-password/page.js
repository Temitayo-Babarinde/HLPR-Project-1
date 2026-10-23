'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const passwordReady = password.length >= 8;
  const confirmationStarted = confirmation.length > 0;
  const passwordsMatch = passwordReady && password === confirmation;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="shell auth-shell">
      <form onSubmit={handleSubmit} className="card auth-card">
        <div className="eyebrow">Account recovery</div>
        <h1 className="brand auth-title">Choose a new password</h1>
        <p className="auth-intro">Use at least eight characters. Your new password will work for both supported CUNY email formats.</p>

        <div className="password-field">
          <label className="sr-only" htmlFor="new-password">New password</label>
          <input id="new-password" className="input" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} placeholder="New password" autoComplete="new-password" minLength={8} aria-describedby="reset-password-guidance" required />
          <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide passwords' : 'Show passwords'} aria-pressed={showPassword}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <label className="sr-only" htmlFor="confirm-password">Confirm new password</label>
        <input id="confirm-password" className="input auth-confirm-password" type={showPassword ? 'text' : 'password'} value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setError(''); }} placeholder="Confirm new password" autoComplete="new-password" minLength={8} aria-describedby="reset-password-guidance" aria-invalid={confirmationStarted && !passwordsMatch} required />

        <div id="reset-password-guidance" className="reset-password-guidance" aria-live="polite">
          <span className={passwordReady ? 'ready' : ''}>{passwordReady ? '✓' : '○'} At least 8 characters</span>
          <span className={passwordsMatch ? 'ready' : confirmationStarted ? 'mismatch' : ''}>{passwordsMatch ? '✓ Passwords match' : confirmationStarted ? 'Passwords do not match' : 'Confirm your password'}</span>
        </div>

        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="button auth-submit" disabled={loading || !passwordsMatch}>
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </main>
  );
}
