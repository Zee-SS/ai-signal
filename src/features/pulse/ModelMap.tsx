import { ArrowSquareOut, Info, LockOpen } from "@phosphor-icons/react";
import type { CodingModelSignal } from "@shared/schemas/domain";
import { useMemo, useState } from "react";
import { readStorage, STORAGE_KEYS, writeStorage } from "@/lib/storage";

type Metric = "speed" | "cost";

const WIDTH = 900;
const HEIGHT = 430;
const MARGIN = { top: 34, right: 42, bottom: 58, left: 68 };

function scale(value: number, minimum: number, maximum: number, start: number, end: number): number {
  if (maximum === minimum) return (start + end) / 2;
  return start + ((value - minimum) / (maximum - minimum)) * (end - start);
}

export function ModelMap({ models }: { models: CodingModelSignal[] }) {
  const [metric, setMetricState] = useState<Metric>(() => readStorage<Metric>(STORAGE_KEYS.modelMetric, "speed"));
  const [selectedId, setSelectedId] = useState<string | null>(models[0]?.id ?? null);
  const selected = models.find((model) => model.id === selectedId) ?? models[0] ?? null;
  const bounds = useMemo(() => {
    const xValues = models.map((model) => metric === "speed" ? model.speedTokensPerSecond : model.costPerProblem);
    const yValues = models.map((model) => model.qualityScore);
    return {
      xMin: Math.min(...xValues, 0),
      xMax: Math.max(...xValues, 1),
      yMin: Math.floor(Math.min(...yValues, 50) - 1),
      yMax: Math.ceil(Math.max(...yValues, 65) + 1),
    };
  }, [metric, models]);

  const setMetric = (next: Metric): void => {
    setMetricState(next);
    writeStorage(STORAGE_KEYS.modelMetric, next);
  };
  const choose = (id: string): void => setSelectedId(id);

  return (
    <section className="model-section" aria-labelledby="models-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Coding model map</p>
          <h2 id="models-heading">Best depends on what you value.</h2>
          <p>Repository-level coding quality on one axis. Switch the other between output speed and benchmark run cost.</p>
        </div>
        <fieldset className="segmented-control">
          <legend className="sr-only">Choose model comparison</legend>
          <button type="button" aria-pressed={metric === "speed"} onClick={() => setMetric("speed")}>Quality × speed</button>
          <button type="button" aria-pressed={metric === "cost"} onClick={() => setMetric("cost")}>Quality × cost</button>
        </fieldset>
      </div>

      {models.length ? (
        <div className="model-map-shell">
          <div className="model-map__canvas">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby="model-map-title model-map-description">
              <title id="model-map-title">Coding model quality compared with {metric}</title>
              <desc id="model-map-description">Each selectable point is a model. Higher is better quality. {metric === "speed" ? "Further right is faster." : "Further left costs less per benchmark problem."}</desc>
              <rect x={MARGIN.left} y={MARGIN.top} width={WIDTH - MARGIN.left - MARGIN.right} height={HEIGHT - MARGIN.top - MARGIN.bottom} rx="18" className="chart-field" />
              {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                const y = MARGIN.top + tick * (HEIGHT - MARGIN.top - MARGIN.bottom);
                const score = bounds.yMax - tick * (bounds.yMax - bounds.yMin);
                return <g key={tick}><line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y} y2={y} className="chart-grid" /><text x={MARGIN.left - 12} y={y + 4} textAnchor="end" className="chart-tick">{score.toFixed(0)}%</text></g>;
              })}
              <text x="18" y={HEIGHT / 2} transform={`rotate(-90 18 ${HEIGHT / 2})`} textAnchor="middle" className="chart-label">SWE-rebench resolved · higher is better</text>
              <text x={(MARGIN.left + WIDTH - MARGIN.right) / 2} y={HEIGHT - 16} textAnchor="middle" className="chart-label">
                {metric === "speed" ? "Output tokens / second · faster →" : "← lower cost · US dollars / benchmark problem"}
              </text>
              {models.map((model) => {
                const value = metric === "speed" ? model.speedTokensPerSecond : model.costPerProblem;
                const x = scale(value, bounds.xMin, bounds.xMax, MARGIN.left + 25, WIDTH - MARGIN.right - 25);
                const y = scale(model.qualityScore, bounds.yMin, bounds.yMax, HEIGHT - MARGIN.bottom - 20, MARGIN.top + 20);
                const active = model.id === selected?.id;
                const labelOnLeft = x > WIDTH - 220;
                return (
                  <g
                    key={model.id}
                    className="model-point"
                    data-active={active ? "true" : "false"}
                    transform={`translate(${x} ${y})`}
                  >
                    <circle r={active ? 17 : 13} />
                    <text y="4" textAnchor="middle">{model.qualityRank}</text>
                    <text className="model-point__label" x={labelOnLeft ? -22 : 22} y="5" textAnchor={labelOnLeft ? "end" : "start"}>{model.model}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="model-map__mobile">
            {models.map((model) => (
              <button key={model.id} type="button" className="model-rank-row" data-active={model.id === selected?.id ? "true" : "false"} aria-label={`${model.model}: ${model.qualityScore}% resolved, ${model.speedTokensPerSecond} output tokens per second, $${model.costPerProblem.toFixed(2)} per problem`} onClick={() => choose(model.id)}>
                <span className="model-rank-row__rank">{model.qualityRank}</span>
                <span><strong>{model.model}</strong><small>{model.provider}</small></span>
                <span><b>{model.qualityScore}%</b><small>{model.speedTokensPerSecond} tok/s</small></span>
              </button>
            ))}
          </div>

          {selected && (
            <aside className="model-detail" aria-live="polite">
              <div className="model-detail__title">
                <span className="model-rank">#{selected.qualityRank}</span>
                <div><strong>{selected.model}</strong><span>{selected.provider}{selected.openWeight ? " · open weight" : " · proprietary"}</span></div>
                {selected.openWeight && <LockOpen aria-hidden="true" />}
              </div>
              <p>{selected.nuance}</p>
              <dl>
                <div><dt>Quality</dt><dd>{selected.qualityScore}%</dd></div>
                <div><dt>Output</dt><dd>{selected.speedTokensPerSecond} tok/s</dd></div>
                <div><dt>Run cost</dt><dd>${selected.costPerProblem.toFixed(2)}</dd></div>
              </dl>
              <div className="model-detail__sources">
                <a className="external-link" href={selected.qualitySourceUrl} target="_blank" rel="noopener noreferrer">Quality source <ArrowSquareOut aria-hidden="true" /></a>
                <a className="external-link" href={selected.speedSourceUrl} target="_blank" rel="noopener noreferrer">Speed source <ArrowSquareOut aria-hidden="true" /></a>
              </div>
            </aside>
          )}
        </div>
      ) : <p className="compact-empty">No verified coding-model snapshot is available.</p>}

      <p className="method-note"><Info aria-hidden="true" /> Quality and speed come from different tests and some effort variants differ. Use the map to see trade-offs, not as a single objective ranking.</p>
    </section>
  );
}
