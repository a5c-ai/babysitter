/**
 * @a5c-ai/agent-mux-config
 *
 * Install, config, auth, host-detection, and adapter-listing logic
 * for agent-mux. Extracted from the CLI package so these capabilities
 * can be consumed programmatically without pulling in the full CLI.
 */

// Install command
export {
  installCommand,
  INSTALL_FLAGS,
} from './install.js';

export type {
  InstallCommandDeps,
  SpawnRunner,
} from './install.js';

// Install helpers
export {
  makeSpawnRunner,
  defaultSpawnRunner,
  silentSpawnRunner,
  runSilently,
} from './install-helpers.js';

// Config command
export { configCommand } from './config.js';

// Auth command
export { authCommand } from './auth.js';

// Detect-host command
export { detectHostCommand } from './detect-host.js';

// Adapters command
export { adaptersCommand } from './adapters.js';

// CLI helpers (exit codes, flag utilities, output)
export {
  ExitCode,
  errorCodeToExitCode,
  flagStr,
  flagBool,
  printTable,
  printKeyValue,
  printJson,
  printJsonOk,
  printJsonError,
  printError,
  toPlain,
  setColorEnabled,
} from './cli-helpers.js';

// Types
export type {
  ParsedArgs,
  FlagDef,
  ExitCodeValue,
} from './cli-helpers.js';

export type {
  InstallResult,
  DetectInstallationResult,
  AgentMuxClient,
  AgentAdapter,
  Spawner,
} from './types.js';
