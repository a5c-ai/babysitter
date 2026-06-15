// L5 Agent-Runtime layer exports

// Background process management (moved from agent-core)
export {
  BackgroundProcessRegistry,
  type BackgroundTaskRecord,
  type BackgroundCompletionEvent,
  type SpawnOptions,
} from "./backgroundProcessRegistry";

export {
  getBackgroundRegistry,
  disposeBackgroundRegistry,
} from "./background/state";

export {
  buildShellInvocation,
  type ShellInvocation,
} from "./shellInvocation";

// Result envelope utility (used by daemon lifecycle/config)
export { ok, fail, type ApiResult } from "./apiResult";

// Daemon management (moved from agent-platform)
export * from "./daemon";

// Session state management (moved from agent-platform)
export * from "./session";

// Cost tracking (moved from agent-platform)
export * from "./cost";

// Observability (moved from agent-platform)
export * from "./observability";

// Telemetry (L5 type stubs — issue #217)
export * from "./telemetry";

// Execution modes (L5 type stubs — issue #217)
export * from "./execution";

// Resource management (L5 type stubs — issue #217)
export * from "./resources";
