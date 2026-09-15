'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function signOut() {
    setLoading(true);
    setError('');
    try {
      const { error: signOutError } = await createClient().auth.signOut();
      if (signOutError) throw signOutError;
      router.replace('/login');
      router.refresh();
    } catch {
      setError('Could not sign out. Check your connection and try again.');
      setLoading(false);
    }
  }

  return (
    <div className="signout-control">
      <button className="button secondary" onClick={signOut} disabled={loading}>{loading ? 'Signing out…' : 'Sign out'}</button>
      {error ? <span className="signout-error" role="alert">{error}</span> : null}
    </div>
  );
}
