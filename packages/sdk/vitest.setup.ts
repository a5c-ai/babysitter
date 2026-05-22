/**
 * Global vitest setup for @a5c-ai/babysitter-sdk.
 *
 * Injects a mock @a5c-ai/agent-mux module into amuxMetadata.ts.
 * agent-mux is ESM-only and cannot be require()'d in vitest's CJS
 * test resolution, so we provide matching adapter data directly.
 */
import { beforeAll, afterAll } from "vitest";
import {
  _setAmuxModuleForTesting,
  clearAmuxMetadataCache,
} from "./src/harness/amuxMetadata";

const ADAPTERS: Record<string, unknown> = {
  claude: {
    agent: "claude",
    hostEnvSignals: ["CLAUDE_CODE", "CLAUDE_ENV_FILE"],
    capabilities: {
      supportsSkills: true,
      supportsThinking: true,
      supportsMCP: true,
      requiresToolApproval: false,
      supportsInteractiveMode: true,
      supportsStdinInjection: false,
      supportsSubagentDispatch: true,
      supportsParallelExecution: true,
      supportsImageInput: true,
      runtimeHooks: {
        stop: "blocking",
        "session-start": "fire-and-forget",
        "pre-tool-use": "blocking",
      },
    },
    sessionDir: () => ".a5c/runs",
  },
  codex: {
    agent: "codex",
    hostEnvSignals: ["CODEX_SESSION_ID"],
    capabilities: {
      supportsSkills: false,
      supportsThinking: true,
      supportsMCP: false,
      requiresToolApproval: true,
      supportsInteractiveMode: true,
      supportsStdinInjection: false,
      supportsSubagentDispatch: false,
      supportsParallelExecution: false,
      supportsImageInput: false,
      runtimeHooks: {
        stop: "blocking",
        "session-start": "fire-and-forget",
      },
    },
    sessionDir: () => ".a5c/runs",
  },
  cursor: {
    agent: "cursor",
    hostEnvSignals: ["CURSOR_PROJECT_DIR", "CURSOR_VERSION"],
    capabilities: {
      supportsSkills: false,
      supportsThinking: true,
      supportsMCP: true,
      requiresToolApproval: false,
      supportsInteractiveMode: true,
      supportsStdinInjection: false,
      supportsSubagentDispatch: false,
      supportsParallelExecution: false,
      supportsImageInput: false,
      runtimeHooks: {
        stop: "blocking",
        "session-start": "fire-and-forget",
        "pre-tool-use": "blocking",
      },
    },
    sessionDir: () => ".a5c/runs",
  },
  gemini: {
    agent: "gemini",
    hostEnvSignals: ["GEMINI_CLI", "GEMINI_SESSION_ID"],
    capabilities: {
      supportsSkills: false,
      supportsThinking: true,
      supportsMCP: false,
      requiresToolApproval: false,
      supportsInteractiveMode: true,
      supportsStdinInjection: false,
      supportsSubagentDispatch: false,
      supportsParallelExecution: false,
      supportsImageInput: false,
      runtimeHooks: {
        stop: "blocking",
        "session-start": "fire-and-forget",
      },
    },
    sessionDir: () => ".a5c/runs",
  },
  copilot: {
    agent: "copilot",
    hostEnvSignals: ["COPILOT_HOME", "COPILOT_GITHUB_TOKEN"],
    capabilities: {
      supportsSkills: false,
      supportsThinking: true,
      supportsMCP: true,
      requiresToolApproval: false,
      supportsInteractiveMode: true,
      supportsStdinInjection: false,
      supportsSubagentDispatch: false,
      supportsParallelExecution: false,
      supportsImageInput: false,
      runtimeHooks: {},
    },
    sessionDir: () => ".a5c/runs",
  },
  omp: {
    agent: "omp",
    hostEnvSignals: ["OMP_SESSION_ID"],
    capabilities: {
      supportsSkills: true,
      supportsThinking: true,
      supportsMCP: true,
      requiresToolApproval: false,
      supportsInteractiveMode: true,
      supportsStdinInjection: false,
      supportsSubagentDispatch: true,
      supportsParallelExecution: true,
      supportsImageInput: false,
      runtimeHooks: {},
    },
    sessionDir: () => ".a5c/runs",
  },
  pi: {
    agent: "pi",
    hostEnvSignals: ["PI_SESSION_ID"],
    capabilities: {
      supportsSkills: true,
      supportsThinking: true,
      supportsMCP: false,
      requiresToolApproval: false,
      supportsInteractiveMode: true,
      supportsStdinInjection: false,
      supportsSubagentDispatch: true,
      supportsParallelExecution: true,
      supportsImageInput: false,
      runtimeHooks: {},
    },
    sessionDir: () => ".a5c/runs",
  },
  openclaw: {
    agent: "openclaw",
    hostEnvSignals: ["OPENCLAW_SHELL", "OPENCLAW_HOME"],
    capabilities: {
      supportsSkills: false,
      supportsThinking: true,
      supportsMCP: true,
      requiresToolApproval: false,
      supportsInteractiveMode: true,
      supportsStdinInjection: false,
      supportsSubagentDispatch: false,
      supportsParallelExecution: false,
      supportsImageInput: false,
      runtimeHooks: {},
    },
    sessionDir: () => ".a5c/runs",
  },
  opencode: {
    agent: "opencode",
    hostEnvSignals: ["OPENCODE_CONFIG"],
    capabilities: {
      supportsSkills: false,
      supportsThinking: true,
      supportsMCP: false,
      requiresToolApproval: false,
      supportsInteractiveMode: false,
      supportsStdinInjection: false,
      supportsSubagentDispatch: false,
      supportsParallelExecution: false,
      supportsImageInput: false,
      runtimeHooks: {},
    },
    sessionDir: () => ".a5c/runs",
  },
};

const adapterMap = new Map(Object.entries(ADAPTERS));

const mockAmux = {
  createClient: () => ({
    adapters: {
      get: (name: string) => adapterMap.get(name),
    },
  }),
  registerBuiltInAdapters: () => {
    /* no-op */
  },
};

beforeAll(() => {
  _setAmuxModuleForTesting(mockAmux as unknown as Record<string, unknown>);
  clearAmuxMetadataCache();
});

afterAll(() => {
  _setAmuxModuleForTesting(undefined);
  clearAmuxMetadataCache();
});
