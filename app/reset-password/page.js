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
          <input id="new-password" className="input" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" autoComplete="new-password" minLength={8} required />
          <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide passwords' : 'Show passwords'} aria-pressed={showPassword}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <label className="sr-only" htmlFor="confirm-password">Confirm new password</label>
        <input id="confirm-password" className="input auth-confirm-password" type={showPassword ? 'text' : 'password'} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Confirm new password" autoComplete="new-password" minLength={8} required />

        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="button auth-submit" disabled={loading}>
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </main>
  );
}
