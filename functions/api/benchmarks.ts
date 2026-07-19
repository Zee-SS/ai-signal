import { BENCHMARK_NOTICE } from "../../shared/constants/benchmarks";
import type { PagesFunction } from "../../shared/types/bindings";
import { readBenchmarks } from "../_lib/database";
import { serveCachedJson } from "../_lib/http";

export const onRequestGet: PagesFunction = async ({ request, env, waitUntil }) =>
  serveCachedJson(request, waitUntil, async () => ({
    meta: { generatedAt: new Date().toISOString(), notice: BENCHMARK_NOTICE },
    benchmarks: await readBenchmarks(env.AI_SIGNAL_DB),
  }));
