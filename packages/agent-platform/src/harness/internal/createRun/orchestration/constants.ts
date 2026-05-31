export const PROCESS_MODULE_LOAD_RETRY_DELAYS_MS = process.env.VITEST
  ? [0, 0]
  : [100, 250, 500];

// Max consecutive API timeouts before aborting the run (prevents infinite wait on unresponsive provider)
export const MAX_CONSECUTIVE_TIMEOUTS = 3;
// Max consecutive iterations where no progress is made (effect dispatched but not resolved)
export const MAX_CONSECUTIVE_STALLS = 5;
// Max consecutive iterations where the process itself errors (distinct from API/effect errors)
export const MAX_CONSECUTIVE_PROCESS_ERROR_STALLS = 5;
// Total process-error recoveries allowed across the entire run lifetime
export const MAX_PROCESS_ERROR_RECOVERIES = 5;

export const EFFECT_RETRY_DELAYS_OVERRIDE = process.env.VITEST
  ? [0, 0, 0]
  : undefined;
