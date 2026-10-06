export default function LoadingDashboard() {
  return (
    <main className="dashboard-shell dashboard-loading" aria-busy="true">
      <span className="sr-only" role="status">Loading your classes…</span>
      <div className="dashboard-container" aria-hidden="true">
        <header className="dashboard-loading-header">
          <div>
            <div className="dashboard-brand">hlpr<span>.</span></div>
            <span className="dashboard-skeleton dashboard-skeleton-kicker" />
            <span className="dashboard-skeleton dashboard-skeleton-title" />
            <span className="dashboard-skeleton dashboard-skeleton-email" />
          </div>
          <span className="dashboard-skeleton dashboard-skeleton-action" />
        </header>

        <div className="dashboard-loading-heading">
          <div>
            <span className="dashboard-skeleton dashboard-skeleton-label" />
            <span className="dashboard-skeleton dashboard-skeleton-subtitle" />
          </div>
          <span className="dashboard-skeleton dashboard-skeleton-count" />
        </div>

        <div className="course-grid">
          {[0, 1, 2, 3].map((item) => (
            <div className="course-card dashboard-loading-card" key={item}>
              <span className="dashboard-skeleton dashboard-skeleton-course" />
              <span className="dashboard-skeleton dashboard-skeleton-card-title" />
              <span className="dashboard-skeleton dashboard-skeleton-meta" />
              <span className="dashboard-skeleton dashboard-skeleton-open" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
