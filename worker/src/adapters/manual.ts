import benchmarkSnapshots from "../../../shared/data/benchmark-snapshots.json";
import manualEvents from "../../../shared/data/manual-events.json";
import { benchmarkResultSchema, eventSchema } from "../../../shared/schemas/domain";
import { type AdapterContext, type AdapterResult, emptyAdapterResult } from "./types";

export async function manualJsonAdapter(context: AdapterContext): Promise<AdapterResult> {
  const config = context.source.adapter;
  if (config.type !== "manual_json") throw new Error("Manual JSON adapter received incompatible configuration");
  if (config.kind === "benchmarks") {
    return {
      ...emptyAdapterResult(),
      benchmarks: benchmarkResultSchema.array().parse(benchmarkSnapshots),
    };
  }
  return {
    ...emptyAdapterResult(),
    events: eventSchema.array().parse(manualEvents),
  };
}
