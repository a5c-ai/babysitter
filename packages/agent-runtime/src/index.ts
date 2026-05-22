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
