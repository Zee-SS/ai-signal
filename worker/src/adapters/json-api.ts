import { z } from "zod";
import { stableId } from "../../../shared/lib/hash";
import { truncate } from "../../../shared/lib/text";
import { type ExternalItem, externalItemSchema, type Model, modelSchema } from "../../../shared/schemas/domain";
import { fetchWithPolicy } from "./fetcher";
import { type AdapterContext, type AdapterResult, emptyAdapterResult } from "./types";

const openRouterModelSchema = z.looseObject({
  id: z.string(),
  name: z.string().optional(),
  created: z.number().nullable().optional(),
  context_length: z.number().int().positive().nullable().optional(),
  architecture: z.looseObject({
    input_modalities: z.array(z.string()).optional(),
    output_modalities: z.array(z.string()).optional(),
    modality: z.string().optional(),
  }).optional(),
  pricing: z.looseObject({
    prompt: z.string().nullable().optional(),
    completion: z.string().nullable().optional(),
  }).optional(),
});

const openRouterResponseSchema = z.object({ data: z.array(openRouterModelSchema) });

const huggingFaceModelSchema = z.looseObject({
  id: z.string(),
  modelId: z.string().optional(),
  author: z.string().optional(),
  lastModified: z.iso.datetime().optional(),
  downloads: z.number().int().nonnegative().optional(),
  likes: z.number().int().nonnegative().optional(),
  pipeline_tag: z.string().optional(),
  tags: z.array(z.string()).optional(),
  gated: z.union([z.boolean(), z.string()]).optional(),
});

const huggingFaceResponseSchema = z.array(huggingFaceModelSchema);

const toPerMillion = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed * 1_000_000 : null;
};

async function parseOpenRouter(context: AdapterContext, payload: unknown): Promise<Model[]> {
  const parsed = openRouterResponseSchema.parse(payload);
  const verifiedAt = context.fetchedAt;
  const currentModels = [...parsed.data]
    .sort((left, right) => (right.created ?? 0) - (left.created ?? 0))
    .slice(0, 200);
  return Promise.all(currentModels.map(async (entry) => {
    const provider = entry.id.split("/")[0] || "Unknown";
    const created = entry.created ? new Date(entry.created * 1_000) : null;
    const releaseDate = created && Number.isFinite(created.getTime()) ? created.toISOString().slice(0, 10) : null;
    return modelSchema.parse({
      id: await stableId("model", entry.id),
      canonicalName: entry.name?.trim() || entry.id.split("/").at(-1) || entry.id,
      provider,
      providerModelId: entry.id,
      releaseDate,
      modelStatus: "available",
      openWeight: false,
      contextLength: entry.context_length ?? null,
      inputModalities: entry.architecture?.input_modalities ?? [],
      outputModalities: entry.architecture?.output_modalities ?? [],
      inputPrice: toPerMillion(entry.pricing?.prompt),
      outputPrice: toPerMillion(entry.pricing?.completion),
      currency: "USD",
      officialUrl: null,
      metadataSourceUrl: "https://openrouter.ai/api/v1/models",
      lastVerifiedAt: verifiedAt,
      metadata: {
        aggregationSource: "OpenRouter",
        priceUnit: "USD per 1M tokens",
        openWeightVerified: false,
        architecture: entry.architecture ?? null,
      },
    });
  }));
}

async function parseHuggingFace(context: AdapterContext, payload: unknown): Promise<ExternalItem[]> {
  const parsed = huggingFaceResponseSchema.parse(payload);
  const items: ExternalItem[] = [];
  for (const entry of parsed) {
    if (!entry.lastModified) continue;
    const tags = entry.tags ?? [];
    const relevant = /(code|coder|coding|agent|reasoning|tool|software)/i.test(`${entry.id} ${tags.join(" ")}`);
    if (!relevant) continue;
    const modelId = entry.modelId ?? entry.id;
    const gatedLabel = entry.gated ? " Access may be gated." : "";
    items.push(externalItemSchema.parse({
      itemType: "open_weight_model",
      title: modelId,
      summary: truncate(
        `Community-interest signal from Hugging Face: ${entry.downloads ?? 0} downloads and ${entry.likes ?? 0} likes.${gatedLabel} These counts do not measure model quality.`,
        420,
      ),
      url: `https://huggingface.co/${modelId}`,
      sourceSlug: context.source.slug,
      provider: entry.author ?? modelId.split("/")[0] ?? null,
      author: entry.author ?? null,
      publishedAt: entry.lastModified,
      fetchedAt: context.fetchedAt,
      tags: ["open-weight", "community-interest", ...(entry.pipeline_tag ? [entry.pipeline_tag] : []), ...tags.slice(0, 8)],
      externalScore: entry.likes ?? null,
      externalComments: null,
      metadata: {
        downloads: entry.downloads ?? null,
        likes: entry.likes ?? null,
        gated: entry.gated ?? false,
        qualitySignal: false,
      },
    }));
  }
  return items;
}

export async function jsonApiAdapter(context: AdapterContext): Promise<AdapterResult> {
  const config = context.source.adapter;
  if (config.type !== "json_api") throw new Error("JSON API adapter received incompatible configuration");
  const headers: HeadersInit = {};
  if (config.kind === "openrouter_models" && context.env.OPENROUTER_API_KEY) {
    headers.Authorization = `Bearer ${context.env.OPENROUTER_API_KEY}`;
  }
  if (config.kind === "huggingface_models" && context.env.HUGGINGFACE_TOKEN) {
    headers.Authorization = `Bearer ${context.env.HUGGINGFACE_TOKEN}`;
  }
  const response = await fetchWithPolicy(config.url, { headers }, { timeoutMs: 15_000, retries: 2 });
  const payload: unknown = await response.json();
  if (config.kind === "openrouter_models") {
    return { ...emptyAdapterResult(), models: await parseOpenRouter(context, payload) };
  }
  return { ...emptyAdapterResult(), items: await parseHuggingFace(context, payload) };
}
