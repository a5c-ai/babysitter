/**
 * Re-export shim — install helpers now live in @a5c-ai/agent-mux-config.
 */
export {
  makeSpawnRunner,
  defaultSpawnRunner,
  silentSpawnRunner,
  runSilently,
} from '@a5c-ai/agent-mux-config';

export type { SpawnRunner } from '@a5c-ai/agent-mux-config';
