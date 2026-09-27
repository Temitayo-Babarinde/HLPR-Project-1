export default function LoadingClass() {
  return (
    <main className="app-loading" role="status" aria-live="polite">
      <span className="loading-mark" aria-hidden="true">h</span>
      <p>Opening your class…</p>
    </main>
  );
}
