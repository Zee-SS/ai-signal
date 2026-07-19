import type { CloudflareEnv } from "../../shared/types/bindings";
import { runIngestion } from "./ingestion/run";

export async function scheduled(
  _controller: ScheduledController,
  env: CloudflareEnv,
  context: ExecutionContext,
): Promise<void> {
  context.waitUntil(runIngestion(env));
}
