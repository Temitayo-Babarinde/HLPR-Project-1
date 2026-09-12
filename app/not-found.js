import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="not-found-shell">
      <section className="not-found-card" aria-labelledby="not-found-title">
        <div className="not-found-mark" aria-hidden="true">404</div>
        <p className="eyebrow">Lost between classes</p>
        <h1 id="not-found-title">This page stepped out.</h1>
        <p>The link may be outdated, or the class space may no longer be available.</p>
        <div className="not-found-actions">
          <Link href="/dashboard" className="button">Back to my classes</Link>
          <Link href="/join" className="button secondary">Find a class</Link>
        </div>
      </section>
    </main>
  );
}
