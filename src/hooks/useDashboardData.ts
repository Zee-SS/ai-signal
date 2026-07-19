import { type DashboardResponse, dashboardResponseSchema } from "@shared/schemas/domain";
import { useCallback, useEffect, useRef, useState } from "react";
import { readStorage, STORAGE_KEYS, writeStorage } from "@/lib/storage";

type LoadState = "loading" | "ready" | "stale" | "error";

interface DashboardDataState {
  data: DashboardResponse | null;
  state: LoadState;
  error: string | null;
  reload: () => void;
}

function staleFromCache(data: DashboardResponse, reason: string): DashboardResponse {
  return {
    ...data,
    meta: {
      ...data.meta,
      generatedAt: new Date().toISOString(),
      isStale: true,
      staleReason: reason,
    },
  };
}

export function useDashboardData(): DashboardDataState {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);

  const load = useCallback(async () => {
    const version = requestVersion.current + 1;
    requestVersion.current = version;
    setState((current) => current === "ready" || current === "stale" ? current : "loading");
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch("/api/dashboard", {
        signal: controller.signal,
        credentials: "omit",
      });
      if (!response.ok) throw new Error(`Dashboard API returned ${response.status}`);
      const parsed = dashboardResponseSchema.parse(await response.json());
      if (requestVersion.current !== version) return;
      setData(parsed);
      setState(parsed.meta.isStale ? "stale" : "ready");
      writeStorage(STORAGE_KEYS.dashboardCache, parsed);
      writeStorage(STORAGE_KEYS.lastVisit, new Date().toISOString());
    } catch (loadError) {
      if (requestVersion.current !== version) return;
      const cached = dashboardResponseSchema.safeParse(readStorage<unknown>(STORAGE_KEYS.dashboardCache, null));
      if (cached.success) {
        setData(staleFromCache(cached.data, "The live API could not be reached. Showing the last dashboard saved in this browser."));
        setState("stale");
      } else if (import.meta.env.DEV) {
        const fixture = dashboardResponseSchema.parse((await import("@/fixtures/dashboard")).developmentDashboard);
        setData(fixture);
        setState("stale");
      } else {
        setState("error");
      }
      setError(loadError instanceof Error ? loadError.message : "The dashboard could not be loaded");
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      requestVersion.current += 1;
    };
  }, [load]);

  return { data, state, error, reload: () => { void load(); } };
}
