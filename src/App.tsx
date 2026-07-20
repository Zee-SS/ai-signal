import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import { dashboardResponseSchema } from "@shared/schemas/domain";
import { useState } from "react";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { Reveal } from "@/components/Reveal";
import { DailyPulse } from "@/features/pulse/DailyPulse";
import { ModelMap } from "@/features/pulse/ModelMap";
import { ReleaseRadar } from "@/features/pulse/ReleaseRadar";
import { SourceFooter } from "@/features/pulse/SourceFooter";
import { ToolLandscape } from "@/features/pulse/ToolLandscape";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { readStorage, STORAGE_KEYS, writeStorage } from "@/lib/storage";

export default function App() {
  const { data, state, error, reload } = useDashboardData();
  const online = useOnlineStatus();
  const [lastVisitAt, setLastVisitAt] = useState<string | null>(() => readStorage<string | null>(STORAGE_KEYS.lastVisit, null));

  if (!data && state === "loading") {
    return <div id="top"><Header meta={null} sources={[]} onRefresh={reload} refreshing /><DashboardSkeleton /></div>;
  }

  if (!data || !dashboardResponseSchema.safeParse(data).success) {
    return (
      <div id="top">
        <Header meta={null} sources={[]} onRefresh={reload} refreshing={false} />
        <main id="main-content" className="page-shell error-page">
          <EmptyState
            title="Verified coding data is unavailable"
            description={error ?? "D1 and the browser cache did not return usable data. Production never substitutes development fixtures."}
            action={<button className="button button--primary" type="button" onClick={reload}><ArrowClockwise aria-hidden="true" /> Try again</button>}
          />
        </main>
      </div>
    );
  }

  const partialFailures = data.sources.filter((source) => source.enabled && (source.status === "degraded" || source.status === "unavailable"));
  const markSeen = (): void => {
    const now = new Date().toISOString();
    setLastVisitAt(now);
    writeStorage(STORAGE_KEYS.lastVisit, now);
  };

  return (
    <div id="top">
      <Header meta={data.meta} sources={data.sources} onRefresh={reload} refreshing={state === "loading"} />
      <main id="main-content" className="page-shell">
        {(!online || data.meta.fixture || data.meta.isStale || partialFailures.length > 0) && (
          <div className="data-warning" role="status" data-fixture={data.meta.fixture ? "true" : "false"}>
            <WarningCircle aria-hidden="true" weight="fill" />
            <div>
              <strong>{!online ? "Offline snapshot" : data.meta.fixture ? "Development fixture" : data.meta.isStale ? "Data may be stale" : "Partial source coverage"}</strong>
              <span>{!online
                ? "Showing the last verified dashboard saved on this device."
                : data.meta.staleReason ?? `${partialFailures.length} source${partialFailures.length === 1 ? " is" : "s are"} unavailable; the rest of the coding pulse remains current.`}</span>
            </div>
          </div>
        )}
        <Reveal id="pulse" className="section-reveal section-reveal--first"><DailyPulse data={data} lastVisitAt={lastVisitAt} onMarkSeen={markSeen} /></Reveal>
        <Reveal id="models" className="section-reveal"><ModelMap models={data.codingModels} /></Reveal>
        <Reveal id="agents" className="section-reveal"><ToolLandscape entries={data.codingLandscape} /></Reveal>
        <Reveal id="dates" className="section-reveal"><ReleaseRadar events={data.events} /></Reveal>
        <Reveal className="section-reveal section-reveal--footer"><SourceFooter data={data} /></Reveal>
      </main>
    </div>
  );
}
