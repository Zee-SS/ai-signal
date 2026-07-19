import { ArrowSquareOut, ChartBar, Info } from "@phosphor-icons/react";
import { BENCHMARK_NOTICE } from "@shared/constants/benchmarks";
import { formatCapeTownDate } from "@shared/lib/dates";
import type { BenchmarkDefinition, BenchmarkResult } from "@shared/schemas/domain";

interface TrackLeader {
  track: string;
  leader: BenchmarkResult;
  leaderChanged: boolean;
}

function trackLeaders(benchmark: BenchmarkDefinition): TrackLeader[] {
  const tracks = new Map<string, BenchmarkResult[]>();
  for (const result of benchmark.results) {
    const values = tracks.get(result.benchmarkTrack) ?? [];
    values.push(result);
    tracks.set(result.benchmarkTrack, values);
  }
  return [...tracks.entries()].flatMap(([track, results]) => {
    const snapshots = [...new Set(results.map((result) => result.snapshotDate))].sort().reverse();
    const latestDate = snapshots[0];
    if (!latestDate) return [];
    const latest = results.filter((result) => result.snapshotDate === latestDate).sort((a, b) => b.score - a.score);
    const previousDate = snapshots[1];
    const previous = previousDate
      ? results.filter((result) => result.snapshotDate === previousDate).sort((a, b) => b.score - a.score)
      : [];
    return latest[0] ? [{
      track,
      leader: latest[0],
      leaderChanged: Boolean(previous[0] && previous[0].modelName !== latest[0].modelName),
    }] : [];
  });
}

export function BenchmarkSection({ benchmarks }: { benchmarks: BenchmarkDefinition[] }) {
  return (
    <section id="benchmarks" className="dashboard-section benchmark-section" aria-labelledby="benchmarks-heading">
      <div className="section-heading">
        <div>
          <h2 id="benchmarks-heading">Benchmark watch</h2>
          <p>Only official machine-readable data, official repositories, or dated curated snapshots appear here.</p>
        </div>
      </div>
      <div className="benchmark-notice" role="note">
        <Info aria-hidden="true" />
        <p>{BENCHMARK_NOTICE}</p>
      </div>
      <div className="benchmark-grid">
        {benchmarks.map((benchmark) => {
          const leaders = trackLeaders(benchmark);
          return (
            <article className="benchmark-card" key={benchmark.slug}>
              <div className="benchmark-card__heading">
                <ChartBar aria-hidden="true" />
                <div><h3>{benchmark.name}</h3><p>{benchmark.description}</p></div>
              </div>
              {leaders.length ? (
                <div className="benchmark-leaders">
                  {leaders.slice(0, 3).map(({ track, leader, leaderChanged }) => (
                    <div key={track}>
                      <span>{track}</span>
                      <strong>{leader.modelName}</strong>
                      <span className="tnum">{leader.score.toLocaleString("en-ZA")} {leader.scoreUnit}</span>
                      <small>{formatCapeTownDate(`${leader.snapshotDate}T12:00:00Z`)}{leaderChanged ? " · Leader changed" : ""}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="benchmark-empty">
                  <strong>No verified snapshot loaded</strong>
                  <span>The source remains available without inventing a leaderboard.</span>
                </div>
              )}
              <a href={benchmark.leaderboardUrl} target="_blank" rel="noopener noreferrer" className="source-link">
                View full leaderboard
                <ArrowSquareOut aria-hidden="true" />
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
