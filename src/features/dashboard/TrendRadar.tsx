import { Info } from "@phosphor-icons/react";
import type { TrendTopic } from "@shared/schemas/domain";
import { useMemo, useState } from "react";

type TrendWindow = TrendTopic["window"];

export function TrendRadar({ trends }: { trends: TrendTopic[] }) {
  const [window, setWindow] = useState<TrendWindow>("7d");
  const visible = useMemo(() => trends.filter((trend) => trend.window === window).sort((a, b) => b.score - a.score).slice(0, 7), [trends, window]);
  const max = Math.max(1, ...visible.map((trend) => trend.score));
  return (
    <section id="trends" className="dashboard-section trend-section" aria-labelledby="trend-heading">
      <div className="section-heading section-heading--with-control">
        <div>
          <h2 id="trend-heading">Trend radar</h2>
          <p>Relative attention across trusted sources and community activity. Popularity does not validate technical claims.</p>
        </div>
        <fieldset className="segmented-control">
          <legend className="sr-only">Trend window</legend>
          {(["24h", "7d", "30d"] as const).map((value) => (
            <button key={value} type="button" aria-pressed={window === value} onClick={() => setWindow(value)}>{value === "24h" ? "24 hours" : value === "7d" ? "7 days" : "30 days"}</button>
          ))}
        </fieldset>
      </div>
      <ol className="trend-list">
        {visible.map((trend, index) => (
          <li key={trend.topic}>
            <span className="trend-rank">{index + 1}</span>
            <div className="trend-copy">
              <div><strong>{trend.topic}</strong><span>{trend.mentionCount} mentions from {trend.sourceCount} sources</span></div>
              <span className="trend-line" style={{ "--trend-width": `${Math.max(4, (trend.score / max) * 100)}%` } as React.CSSProperties} aria-hidden="true" />
            </div>
            <span className="signal-band">{trend.score >= 70 ? "High" : trend.score >= 40 ? "Rising" : "Watch"}</span>
          </li>
        ))}
      </ol>
      <p className="method-note"><Info aria-hidden="true" /> Scores are inspectable relative signals. They are not confidence or quality ratings.</p>
    </section>
  );
}
