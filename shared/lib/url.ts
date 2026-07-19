const TRACKING_KEYS = new Set([
  "fbclid",
  "gclid",
  "dclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "ref_src",
  "ref_url",
  "sourceid",
]);

const isTrackingKey = (key: string): boolean => key.startsWith("utm_") || TRACKING_KEYS.has(key);

export function canonicalizeUrl(input: string, base?: string): string {
  const url = new URL(input, base);
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";

  for (const key of [...url.searchParams.keys()]) {
    if (isTrackingKey(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }

  url.searchParams.sort();

  if ((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80")) {
    url.port = "";
  }

  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString();
}
