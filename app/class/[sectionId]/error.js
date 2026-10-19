'use client';

import Link from 'next/link';

export default function ClassError({ reset }) {
  return (
    <main className="not-found-shell">
      <section className="not-found-card" aria-labelledby="class-error-title">
        <div className="not-found-mark class-error-mark" aria-hidden="true">!</div>
        <p className="eyebrow">Class temporarily unavailable</p>
        <h1 id="class-error-title">We couldn’t open this class.</h1>
        <p>Your class data is safe. This is usually a temporary connection problem, so try loading it again.</p>
        <div className="not-found-actions">
          <button type="button" className="button" onClick={reset}>Try again</button>
          <Link href="/dashboard" className="button secondary">Back to classes</Link>
        </div>
      </section>
    </main>
  );
}
