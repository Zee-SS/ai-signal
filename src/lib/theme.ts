import { readStorage, STORAGE_KEYS, writeStorage } from "./storage";

export type Theme = "light" | "dark";

const THEME_COLORS: Record<Theme, string> = {
  light: "#f9fdf9",
  dark: "#152019",
};

export function resolveTheme(): Theme {
  const stored = readStorage<unknown>(STORAGE_KEYS.theme, null);
  if (stored === "light" || stored === "dark") return stored;
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme, persist = false): void {
  document.documentElement.dataset.theme = theme;
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeColor) themeColor.content = THEME_COLORS[theme];
  if (persist) writeStorage(STORAGE_KEYS.theme, theme);
}
