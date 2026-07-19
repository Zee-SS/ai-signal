export function DashboardSkeleton() {
  return (
    <main id="main-content" className="page-shell" aria-busy="true" aria-label="Loading AI Signal dashboard">
      <div className="skeleton-banner skeleton" />
      <section className="dashboard-section">
        <div className="skeleton-heading skeleton" />
        <div className="skeleton-editorial">
          <div className="skeleton-card skeleton" />
          <div className="skeleton-stack">
            <div className="skeleton-row skeleton" />
            <div className="skeleton-row skeleton" />
            <div className="skeleton-row skeleton" />
          </div>
        </div>
      </section>
      <section className="dashboard-section">
        <div className="skeleton-heading skeleton" />
        <div className="skeleton-table skeleton" />
      </section>
    </main>
  );
}
