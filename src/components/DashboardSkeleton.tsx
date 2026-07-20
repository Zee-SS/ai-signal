export function DashboardSkeleton() {
  return (
    <main id="main-content" className="page-shell pulse-skeleton" aria-busy="true" aria-label="Loading AI Signal coding pulse">
      <div className="skeleton skeleton--title" />
      <div className="skeleton-decisions">
        <div className="skeleton skeleton--decision" />
        <div className="skeleton skeleton--decision" />
        <div className="skeleton skeleton--decision" />
        <div className="skeleton skeleton--decision" />
      </div>
      <div className="skeleton skeleton--map" />
    </main>
  );
}
