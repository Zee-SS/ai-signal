import type { Model } from "../schemas/domain";

export interface ModelFilters {
  query?: string;
  provider?: string;
  openWeightOnly?: boolean;
  codingFocusedOnly?: boolean;
}

export function filterModels(models: Model[], filters: ModelFilters): Model[] {
  const query = filters.query?.trim().toLocaleLowerCase("en") ?? "";
  return models.filter((model) => {
    const tags = Array.isArray(model.metadata.tags) ? model.metadata.tags.join(" ") : "";
    const searchable = `${model.canonicalName} ${model.provider} ${model.providerModelId} ${tags}`.toLocaleLowerCase("en");
    if (query && !searchable.includes(query)) return false;
    if (filters.provider && model.provider !== filters.provider) return false;
    if (filters.openWeightOnly && !model.openWeight) return false;
    if (filters.codingFocusedOnly && !/(code|coding|software|agent)/i.test(searchable)) return false;
    return true;
  });
}
