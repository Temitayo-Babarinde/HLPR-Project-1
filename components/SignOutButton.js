'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signOut() {
    setLoading(true);
    await createClient().auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return <button className="button secondary" onClick={signOut} disabled={loading}>{loading ? 'Signing out…' : 'Sign out'}</button>;
}
