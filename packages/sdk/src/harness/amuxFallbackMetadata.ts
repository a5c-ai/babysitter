import { listFallbackHarnessMetadata as listCatalogFallbackHarnessMetadata, getHostSignalMap } from "@a5c-ai/atlas/catalog";
import { resolveRunsDir } from "../config";
import type { AmuxAdapterMetadata } from "./amuxMetadata";

const LEGACY_REPO_RUNS_DIR = ".a5c/runs";
const DEFAULT_SESSION_DIR = resolveRunsDir();

function resolveFallbackSessionDir(sessionDir: string): string {
  return sessionDir === LEGACY_REPO_RUNS_DIR
    ? resolveRunsDir()
    : sessionDir;
}

const LOCAL_FALLBACK_METADATA: Record<string, AmuxAdapterMetadata> = {
  claude: {
    name: "claude",
    hostEnvSignals: ["CLAUDE_ENV_FILE"],
    capabilities: {
      supportsSkills: true,
      supportsThinking: true,
      supportsMCP: true,
      requiresToolApproval: true,
      supportsInteractiveMode: true,
      supportsStdinInjection: true,
      supportsSubagentDispatch: true,
      supportsParallelExecution: true,
      supportsImageInput: true,
      hasRuntimeHooks: true,
      hasStopHook: true,
    },
    sessionDir: DEFAULT_SESSION_DIR,
  },
  codex: {
    name: "codex",
    hostEnvSignals: ["CODEX_THREAD_ID", "CODEX_SESSION_ID"],
    capabilities: {
      supportsSkills: true,
      supportsThinking: true,
      supportsMCP: true,
      requiresToolApproval: true,
      supportsInteractiveMode: true,
      supportsStdinInjection: true,
      supportsSubagentDispatch: false,
      supportsParallelExecution: false,
      supportsImageInput: true,
      hasRuntimeHooks: true,
      hasStopHook: true,
    },
    sessionDir: DEFAULT_SESSION_DIR,
  },
  cursor: {
    name: "cursor",
    hostEnvSignals: ["CURSOR_PROJECT_DIR", "CURSOR_VERSION"],
    capabilities: {
      supportsSkills: true,
      supportsThinking: true,
      supportsMCP: false,
      requiresToolApproval: true,
      supportsInteractiveMode: true,
      supportsStdinInjection: true,
      supportsSubagentDispatch: false,
      supportsParallelExecution: false,
      supportsImageInput: true,
      hasRuntimeHooks: false,
      hasStopHook: false,
    },
    sessionDir: DEFAULT_SESSION_DIR,
  },
  gemini: {
    name: "gemini",
    hostEnvSignals: ["GEMINI_SESSION_ID", "GEMINI_PROJECT_DIR", "GEMINI_CWD"],
    capabilities: {
      supportsSkills: true,
      supportsThinking: true,
      supportsMCP: false,
      requiresToolApproval: true,
      supportsInteractiveMode: true,
      supportsStdinInjection: true,
      supportsSubagentDispatch: false,
      supportsParallelExecution: false,
      supportsImageInput: true,
      hasRuntimeHooks: true,
      hasStopHook: true,
    },
    sessionDir: DEFAULT_SESSION_DIR,
  },
  copilot: {
    name: "copilot",
    hostEnvSignals: ["COPILOT_SESSION_ID", "COPILOT_ENV_FILE"],
    capabilities: {
      supportsSkills: true,
      supportsThinking: true,
      supportsMCP: false,
      requiresToolApproval: true,
      supportsInteractiveMode: true,
      supportsStdinInjection: true,
      supportsSubagentDispatch: false,
      supportsParallelExecution: false,
      supportsImageInput: true,
      hasRuntimeHooks: true,
      hasStopHook: true,
    },
    sessionDir: DEFAULT_SESSION_DIR,
  },
  omp: {
    name: "omp",
    hostEnvSignals: ["OMP_SESSION_ID", "OMP_PLUGIN_ROOT"],
    capabilities: {
      supportsSkills: true,
      supportsThinking: true,
      supportsMCP: false,
      requiresToolApproval: true,
      supportsInteractiveMode: true,
      supportsStdinInjection: true,
      supportsSubagentDispatch: true,
      supportsParallelExecution: false,
      supportsImageInput: true,
      hasRuntimeHooks: false,
      hasStopHook: false,
    },
    sessionDir: DEFAULT_SESSION_DIR,
  },
  opencode: {
    name: "opencode",
    hostEnvSignals: ["OPENCODE_SESSION_ID", "OPENCODE_CONFIG", "OPENCODE_PLUGIN_ROOT"],
    capabilities: {
      supportsSkills: true,
      supportsThinking: true,
      supportsMCP: false,
      requiresToolApproval: true,
      supportsInteractiveMode: true,
      supportsStdinInjection: true,
      supportsSubagentDispatch: false,
      supportsParallelExecution: false,
      supportsImageInput: true,
      hasRuntimeHooks: false,
      hasStopHook: false,
    },
    sessionDir: DEFAULT_SESSION_DIR,
  },
  openclaw: {
    name: "openclaw",
    hostEnvSignals: ["OPENCLAW_SHELL", "OPENCLAW_HOME"],
    capabilities: {
      supportsSkills: true,
      supportsThinking: true,
      supportsMCP: false,
      requiresToolApproval: true,
      supportsInteractiveMode: true,
      supportsStdinInjection: true,
      supportsSubagentDispatch: false,
      supportsParallelExecution: false,
      supportsImageInput: true,
      hasRuntimeHooks: false,
      hasStopHook: false,
    },
    sessionDir: DEFAULT_SESSION_DIR,
  },
  pi: {
    name: "pi",
    hostEnvSignals: ["PI_SESSION_ID", "PI_PLUGIN_ROOT"],
    capabilities: {
      supportsSkills: true,
      supportsThinking: true,
      supportsMCP: false,
      requiresToolApproval: true,
      supportsInteractiveMode: true,
      supportsStdinInjection: true,
      supportsSubagentDispatch: true,
      supportsParallelExecution: false,
      supportsImageInput: true,
      hasRuntimeHooks: false,
      hasStopHook: false,
    },
    sessionDir: DEFAULT_SESSION_DIR,
  },
};

function buildStaticFallbackMetadata(): Record<string, AmuxAdapterMetadata> {
  try {
    let hostSignalMap: Record<string, string[]> = {};
    try { hostSignalMap = getHostSignalMap(); } catch (e) { process.stderr.write(`[babysitter] getHostSignalMap failed: ${e instanceof Error ? e.message : String(e)}\n`); }

    const catalogMetadata = Object.fromEntries(
      Object.values(listCatalogFallbackHarnessMetadata()).map((metadata) => [
        metadata.adapterName,
        {
          name: metadata.adapterName,
          hostEnvSignals: metadata.hostEnvSignals.length > 0
            ? metadata.hostEnvSignals
            : (hostSignalMap[metadata.adapterName] ?? []),
          capabilities: metadata.capabilities,
          sessionDir: resolveFallbackSessionDir(metadata.sessionDir),
        },
      ]),
    );
    if (Object.keys(catalogMetadata).length === 0) return LOCAL_FALLBACK_METADATA;

    // Merge: use catalog data for host signals and session dir, but prefer
    // LOCAL_FALLBACK_METADATA for capabilities when catalog returns all-false
    // (graph schema mismatch between supports edges and capability lookups).
    const merged: Record<string, AmuxAdapterMetadata> = { ...LOCAL_FALLBACK_METADATA };
    for (const [name, catalogEntry] of Object.entries(catalogMetadata)) {
      const local = LOCAL_FALLBACK_METADATA[name];
      if (local) {
        const anyCatalogCapTrue = Object.values(catalogEntry.capabilities).some(v => v === true);
        merged[name] = {
          ...local,
          hostEnvSignals: catalogEntry.hostEnvSignals.length > 0 ? catalogEntry.hostEnvSignals : local.hostEnvSignals,
          sessionDir: catalogEntry.sessionDir,
          capabilities: anyCatalogCapTrue ? catalogEntry.capabilities : local.capabilities,
        };
      } else {
        merged[name] = catalogEntry;
      }
    }
    return merged;
  } catch (e) {
    process.stderr.write(`[babysitter] graph catalog resolution failed, using local fallback metadata: ${e instanceof Error ? e.message : String(e)}\n`);
    return LOCAL_FALLBACK_METADATA;
  }
}

export const STATIC_FALLBACK_METADATA: Record<string, AmuxAdapterMetadata> = buildStaticFallbackMetadata();
