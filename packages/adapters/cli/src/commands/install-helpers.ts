/**
 * Re-export shim — install helpers now live in @a5c-ai/config-adapter.
 */
export {
  makeSpawnRunner,
  defaultSpawnRunner,
  silentSpawnRunner,
  runSilently,
} from '@a5c-ai/config-adapter';

export type { SpawnRunner } from '@a5c-ai/config-adapter';
