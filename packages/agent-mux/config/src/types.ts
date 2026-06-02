/**
 * Shared types for the agent-config-mux package.
 *
 * Re-exports core types that consumers of this package commonly need,
 * plus any config-specific interfaces.
 */

// Re-export core types that config consumers need
export type {
  InstallResult,
  DetectInstallationResult,
  AgentMuxClient,
  AgentAdapter,
  Spawner,
} from '@a5c-ai/agent-mux-comm';

// Re-export CLI helper types
export type {
  ParsedArgs,
  FlagDef,
  ExitCodeValue,
} from './cli-helpers.js';

// Re-export SpawnRunner from install-helpers
export type { SpawnRunner } from './install-helpers.js';
