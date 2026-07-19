export interface CloudflareEnv {
  AI_SIGNAL_DB: D1Database;
  SYNC_SECRET?: string;
  GITHUB_TOKEN?: string;
  OPENROUTER_API_KEY?: string;
  HUGGINGFACE_TOKEN?: string;
  INCLUDE_PRERELEASES?: string;
  ENVIRONMENT?: "production" | "development" | "test";
}

export interface PagesContext<Params extends string = string> {
  request: Request;
  env: CloudflareEnv;
  params: Record<Params, string>;
  waitUntil(promise: Promise<unknown>): void;
  next(input?: Request | string, init?: RequestInit): Promise<Response>;
  data: Record<string, unknown>;
}

export type PagesFunction<Params extends string = string> = (
  context: PagesContext<Params>,
) => Response | Promise<Response>;
