import { resolveRunsDir } from "../config";
import type { AmuxAdapterMetadata } from "./amuxMetadata";

const LEGACY_REPO_RUNS_DIR = ".a5c/runs";

interface FallbackHarnessMetadata {
  adapterName: string;
  hostEnvSignals: readonly string[];
  sessionDir: string;
  capabilities: AmuxAdapterMetadata["capabilities"];
}

function loadFallbackHarnessMetadata(): Record<string, FallbackHarnessMetadata> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("@a5c-ai/agent-catalog") as {
    listFallbackHarnessMetadata?: () => Record<string, FallbackHarnessMetadata>;
  };
  if (typeof mod.listFallbackHarnessMetadata !== "function") {
    throw new Error("@a5c-ai/agent-catalog does not export listFallbackHarnessMetadata()");
  }
  return mod.listFallbackHarnessMetadata();
}

function resolveFallbackSessionDir(sessionDir: string): string {
  return sessionDir === LEGACY_REPO_RUNS_DIR
    ? resolveRunsDir()
    : sessionDir;
}

export const STATIC_FALLBACK_METADATA: Record<string, AmuxAdapterMetadata> = Object.fromEntries(
  Object.values(loadFallbackHarnessMetadata()).map((metadata) => [
    metadata.adapterName,
    {
      name: metadata.adapterName,
      hostEnvSignals: metadata.hostEnvSignals,
      capabilities: metadata.capabilities,
      sessionDir: resolveFallbackSessionDir(metadata.sessionDir),
    },
  ]),
);
