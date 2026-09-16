// Thin re-export facade — preserves backward compatibility for all existing
// import sites while the actual logic lives in focused modules.

export {
  isNotFoundError,
  type WatchSource,
  type ObserverConfig,
  invalidateConfigCache,
  writeConfig,
  getConfig,
} from "./config-loader";

export {
  type DiscoveredRun,
  invalidateDiscoveryCache,
  discoverAllRunDirs,
  discoverAllRunsParentDirs,
} from "./source-discovery";

export { findRunDir } from "./path-resolver";
