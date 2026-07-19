export function stripMarkup(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function stripMarkdown(value: string): string {
  return stripMarkup(value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*(?:[-*+]\s+|>\s?)/gm, "")
    .replace(/[*_~]{1,3}/g, ""));
}

export function truncate(value: string, maxLength = 320): string {
  const clean = stripMarkup(value);
  if (clean.length <= maxLength) return clean;
  const clipped = clean.slice(0, maxLength - 1).replace(/\s+\S*$/, "");
  return `${clipped}…`;
}

export function normalizeTitle(value: string): string {
  return stripMarkup(value)
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function containsAny(value: string, terms: readonly string[]): boolean {
  const haystack = value.toLocaleLowerCase("en");
  return terms.some((term) => haystack.includes(term.toLocaleLowerCase("en")));
}
