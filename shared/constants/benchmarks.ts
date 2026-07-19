import type { BenchmarkDefinition } from "../schemas/domain";

export const BENCHMARK_NOTICE =
  "Benchmark scores measure different tasks and test setups. Compare models within the same benchmark and track.";

export const BENCHMARK_DEFINITIONS: Array<Omit<BenchmarkDefinition, "results" | "lastSnapshotAt">> = [
  {
    slug: "swe-bench-verified",
    name: "SWE-bench Verified",
    description: "Measures whether systems can resolve human-validated issues from real Python repositories.",
    leaderboardUrl: "https://www.swebench.com/",
    sourceKind: "official-repository",
  },
  {
    slug: "swe-bench-multilingual",
    name: "SWE-bench Multilingual",
    description: "Measures repository-level issue resolution across multiple programming languages.",
    leaderboardUrl: "https://www.swebench.com/multilingual.html",
    sourceKind: "official-repository",
  },
  {
    slug: "swe-bench-pro",
    name: "SWE-bench Pro",
    description: "Tracks harder professional software-engineering tasks when public verified results are available.",
    leaderboardUrl: "https://labs.scale.com/leaderboard/swe_bench_pro_public",
    sourceKind: "curated-snapshot",
  },
  {
    slug: "livecodebench",
    name: "LiveCodeBench",
    description: "Evaluates code generation on continuously refreshed contest problems to reduce contamination.",
    leaderboardUrl: "https://livecodebench.github.io/leaderboard.html",
    sourceKind: "official-repository",
  },
  {
    slug: "aider-polyglot",
    name: "Aider Polyglot",
    description: "Tests editing performance on coding exercises across several programming languages.",
    leaderboardUrl: "https://aider.chat/docs/leaderboards/",
    sourceKind: "official-repository",
  },
  {
    slug: "arena-coding",
    name: "Arena coding category",
    description: "Uses pairwise human preferences for coding-focused model responses in the Arena setup.",
    leaderboardUrl: "https://arena.ai/leaderboard",
    sourceKind: "curated-snapshot",
  },
  {
    slug: "swe-rebench",
    name: "SWE-rebench",
    description: "Re-evaluates software-engineering agents on refreshed repository tasks and controlled setups.",
    leaderboardUrl: "https://swe-rebench.com/",
    sourceKind: "official-repository",
  },
];
