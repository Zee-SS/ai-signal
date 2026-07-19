import type {
  BenchmarkResult,
  ExternalItem,
  ImportantEvent,
  Model,
} from "../../../shared/schemas/domain";
import type { SourceDefinition } from "../../../shared/source-config";
import type { CloudflareEnv } from "../../../shared/types/bindings";

export interface AdapterResult {
  items: ExternalItem[];
  models: Model[];
  benchmarks: BenchmarkResult[];
  events: ImportantEvent[];
}

export interface AdapterContext {
  source: SourceDefinition;
  env: CloudflareEnv;
  fetchedAt: string;
}

export type SourceAdapter = (context: AdapterContext) => Promise<AdapterResult>;

export const emptyAdapterResult = (): AdapterResult => ({
  items: [],
  models: [],
  benchmarks: [],
  events: [],
});
