import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const outputPath = new URL("../shared/data/benchmark-snapshots.json", import.meta.url);
const snapshotDate = new Date().toISOString().slice(0, 10);
const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "AI-Signal-Benchmark-Updater/1.0",
};

const sources = {
  swe: "https://raw.githubusercontent.com/swe-bench/swe-bench.github.io/master/data/leaderboards.json",
  sweCommit: "https://api.github.com/repos/swe-bench/swe-bench.github.io/commits?path=data/leaderboards.json&per_page=1",
  aider: "https://raw.githubusercontent.com/Aider-AI/aider/main/aider/website/_data/polyglot_leaderboard.yml",
  aiderCommit: "https://api.github.com/repos/Aider-AI/aider/commits?path=aider/website/_data/polyglot_leaderboard.yml&per_page=1",
};

async function fetchText(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

function identifier(...parts) {
  return `benchmark_${createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 20)}`;
}

function providerFor(name) {
  const value = name.toLowerCase();
  if (/claude|anthropic/.test(value)) return "Anthropic";
  if (/gpt|openai|codex|\bo[1345]-/.test(value)) return "OpenAI";
  if (/gemini|google/.test(value)) return "Google";
  if (/doubao|seed/.test(value)) return "ByteDance";
  if (/deepseek/.test(value)) return "DeepSeek";
  if (/qwen/.test(value)) return "Alibaba";
  if (/glm/.test(value)) return "Z.ai";
  if (/grok/.test(value)) return "xAI";
  if (/kimi/.test(value)) return "Moonshot AI";
  return null;
}

function result(fields) {
  return {
    id: identifier(fields.benchmarkSlug, fields.benchmarkTrack, fields.modelName, fields.evaluationDate, fields.agentName ?? ""),
    scoreUnit: "% resolved",
    scaffoldName: null,
    importMethod: "automatic",
    notes: null,
    ...fields,
  };
}

function splitAgentAndModel(name) {
  const separator = name.indexOf(" + ");
  if (separator < 0) return { agentName: null, modelName: name };
  return {
    agentName: name.slice(0, separator),
    modelName: name.slice(separator + 3),
  };
}

function topSweResults(data, boardName, benchmarkSlug, track, commitSha) {
  const board = data.leaderboards?.find((entry) => entry.name === boardName);
  if (!board?.results) throw new Error(`SWE-bench ${boardName} leaderboard was not found`);
  return board.results
    .filter((entry) => !entry.warning && Number.isFinite(Number(entry.resolved)) && /^\d{4}-\d{2}-\d{2}$/.test(entry.date))
    .sort((left, right) => Number(right.resolved) - Number(left.resolved))
    .slice(0, 3)
    .map((entry) => {
      const identity = splitAgentAndModel(entry.name);
      return result({
        benchmarkSlug,
        benchmarkTrack: track,
        modelName: identity.modelName,
        provider: providerFor(identity.modelName),
        score: Number(entry.resolved),
        agentName: identity.agentName,
        evaluationDate: entry.date,
        snapshotDate,
        sourceUrl: sources.swe,
        notes: `Automatically imported from the official SWE-bench leaderboard data at commit ${commitSha.slice(0, 12)}.`,
      });
    });
}

function parseAiderRecords(yaml) {
  return yaml.split(/^- dirname:/m).flatMap((block) => {
    const field = (name) => block.match(new RegExp(`^\\s*${name}:\\s*(.+)$`, "m"))?.[1]?.trim() ?? null;
    const modelName = field("model");
    const score = Number(field("pass_rate_2"));
    const evaluationDate = field("date");
    const editFormat = field("edit_format");
    const testCases = Number(field("test_cases"));
    if (!modelName || !Number.isFinite(score) || !evaluationDate || !editFormat || testCases < 200) return [];
    return [{ modelName, score, evaluationDate, editFormat, testCases }];
  });
}

function topAiderResults(yaml, commitSha) {
  return parseAiderRecords(yaml)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((entry) => result({
      benchmarkSlug: "aider-polyglot",
      benchmarkTrack: "Polyglot · 225 exercises · two attempts",
      modelName: entry.modelName,
      provider: providerFor(entry.modelName),
      score: entry.score,
      scoreUnit: "% passed",
      agentName: "Aider",
      scaffoldName: `Aider ${entry.editFormat}`,
      evaluationDate: entry.evaluationDate,
      snapshotDate,
      sourceUrl: sources.aider,
      notes: `Official Aider Polyglot result (${entry.testCases} cases), automatically imported at repository commit ${commitSha.slice(0, 12)}.`,
    }));
}

const existing = JSON.parse(await readFile(outputPath, "utf8"));
const manual = existing.filter((entry) => entry.importMethod === "manual");
const [swe, sweCommit, aider, aiderCommit] = await Promise.all([
  fetchJson(sources.swe),
  fetchJson(sources.sweCommit),
  fetchText(sources.aider),
  fetchJson(sources.aiderCommit),
]);
const sweSha = sweCommit[0]?.sha;
const aiderSha = aiderCommit[0]?.sha;
if (!sweSha || !aiderSha) throw new Error("Official repository commit metadata was unavailable");

const snapshots = [
  ...manual,
  ...topSweResults(swe, "Verified", "swe-bench-verified", "Official Verified · all submissions", sweSha),
  ...topSweResults(swe, "Multilingual", "swe-bench-multilingual", "Official Multilingual · all submissions", sweSha),
  ...topAiderResults(aider, aiderSha),
].sort((left, right) => left.benchmarkSlug.localeCompare(right.benchmarkSlug) || right.score - left.score);

await writeFile(outputPath, `${JSON.stringify(snapshots, null, 2)}\n`, "utf8");
console.log(`Wrote ${snapshots.length} verified benchmark records (${snapshots.length - manual.length} automatic, ${manual.length} manual) for ${snapshotDate}.`);
