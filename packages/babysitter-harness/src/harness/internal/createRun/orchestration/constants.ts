export const PROCESS_MODULE_LOAD_RETRY_DELAYS_MS = process.env.VITEST
  ? [0, 0]
  : [100, 250, 500];

export const MAX_CONSECUTIVE_TIMEOUTS = 3;
export const MAX_CONSECUTIVE_STALLS = 2;
export const MAX_CONSECUTIVE_PROCESS_ERROR_STALLS = 5;
export const MAX_PROCESS_ERROR_RECOVERIES = 5;

export const EFFECT_RETRY_DELAYS_OVERRIDE = process.env.VITEST
  ? [0, 0, 0]
  : undefined;
