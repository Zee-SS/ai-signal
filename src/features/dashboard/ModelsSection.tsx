import { ArrowDown, ArrowSquareOut, CaretDown, Code, LockSimpleOpen } from "@phosphor-icons/react";
import { formatCapeTownDate } from "@shared/lib/dates";
import type { Model } from "@shared/schemas/domain";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";

type SortKey = "release" | "context" | "inputPrice" | "name";

const formatContext = (value: number | null): string => {
  if (!value) return "Not supplied";
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString("en-ZA", { maximumFractionDigits: 1 })}M`;
  return `${Math.round(value / 1_000).toLocaleString("en-ZA")}k`;
};

const formatPrice = (value: number | null, currency: string | null): string => {
  if (value === null) return "Not supplied";
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: currency ?? "USD", maximumFractionDigits: 3 }).format(value);
};

function isCodingModel(model: Model): boolean {
  const tags = Array.isArray(model.metadata.tags) ? model.metadata.tags.join(" ") : "";
  return /(code|coding|software|agent)/i.test(`${model.canonicalName} ${model.providerModelId} ${tags}`);
}

export function ModelsSection({ models }: { models: Model[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("release");
  const [expanded, setExpanded] = useState(false);
  const sorted = useMemo(() => [...models].sort((left, right) => {
    if (sortKey === "name") return left.canonicalName.localeCompare(right.canonicalName);
    if (sortKey === "context") return (right.contextLength ?? -1) - (left.contextLength ?? -1);
    if (sortKey === "inputPrice") return (left.inputPrice ?? Number.POSITIVE_INFINITY) - (right.inputPrice ?? Number.POSITIVE_INFINITY);
    return (right.releaseDate ?? "").localeCompare(left.releaseDate ?? "");
  }), [models, sortKey]);
  const visible = sorted.slice(0, expanded ? 40 : 12);

  return (
    <section id="models" className="dashboard-section models-section" aria-labelledby="models-heading">
      <div className="section-heading section-heading--with-control">
        <div>
          <h2 id="models-heading">New models</h2>
          <p>Provider metadata when available, with OpenRouter clearly treated as a secondary aggregation source.</p>
        </div>
        <label className="sort-control">
          <span>Sort models</span>
          <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
            <option value="release">Newest release</option>
            <option value="context">Largest context</option>
            <option value="inputPrice">Lowest input price</option>
            <option value="name">Model name</option>
          </select>
          <ArrowDown aria-hidden="true" />
        </label>
      </div>
      {visible.length ? (
        <>
          <table className="model-table">
            <caption className="sr-only">Model comparison</caption>
            <thead className="model-table__header">
              <tr>
                <th scope="col">Model</th>
                <th scope="col">Released</th>
                <th scope="col">Access</th>
                <th scope="col">Context</th>
                <th scope="col">Input / output per 1M</th>
                <th scope="col">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((model) => {
                const verifiedOpen = model.metadata.openWeightVerified === true;
                return (
                  <tr className="model-row" key={model.id}>
                    <td data-label="Model">
                    <strong>{model.canonicalName}</strong>
                    <span>{model.provider}</span>
                    {isCodingModel(model) && <small><Code aria-hidden="true" /> Coding relevance</small>}
                    </td>
                    <td data-label="Released">{model.releaseDate ? formatCapeTownDate(`${model.releaseDate}T12:00:00Z`) : "Not supplied"}</td>
                    <td data-label="Access">
                      {verifiedOpen ? <span className="access-label"><LockSimpleOpen aria-hidden="true" /> Open weight</span> : "Not verified"}
                    </td>
                    <td data-label="Context" className="tnum">{formatContext(model.contextLength)}</td>
                    <td data-label="Pricing" className="tnum model-pricing">
                      <span>{formatPrice(model.inputPrice, model.currency)}</span>
                      <span>{formatPrice(model.outputPrice, model.currency)}</span>
                    </td>
                    <td data-label="Evidence">
                      <a href={model.officialUrl ?? model.metadataSourceUrl} target="_blank" rel="noopener noreferrer" className="source-link">
                        {model.officialUrl ? "Official source" : "Metadata source"}
                        <ArrowSquareOut aria-hidden="true" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sorted.length > 12 && (
            <button type="button" className="disclosure-action" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
              {expanded ? "Show fewer models" : `Show ${Math.min(40, sorted.length)} models`}
              <CaretDown aria-hidden="true" data-open={expanded ? "true" : "false"} />
            </button>
          )}
        </>
      ) : (
        <EmptyState title="No model metadata matches" description="Reset model filters or wait for a verified metadata refresh." />
      )}
    </section>
  );
}
