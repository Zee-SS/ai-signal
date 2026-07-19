export function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Preferences are progressive enhancement. A blocked quota must not break the dashboard.
  }
}

export const STORAGE_KEYS = {
  dashboardCache: "ai-signal:dashboard:v1",
  lastVisit: "ai-signal:last-visit:v1",
  bookmarks: "ai-signal:bookmarks:v1",
  readItems: "ai-signal:read-items:v1",
  filters: "ai-signal:filters:v1",
} as const;
