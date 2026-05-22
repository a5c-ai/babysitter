/**
 * @a5c-ai/agent-mux-observability
 *
 * Simple logging and telemetry infrastructure for agent-mux.
 * Provides structured logging and basic metrics without complex dependencies.
 */

import { initializeTelemetry, shutdownTelemetry } from './telemetry-simple.js';

// Logger exports
export {
  createSimpleLogger as createLogger,
  createComponentLogger,
  logger,
} from './logger-simple.js';

export * from './types.js';

// Telemetry exports
export {
  telemetry,
  initializeTelemetry,
  shutdownTelemetry,
} from './telemetry-simple.js';

// Convenience function to initialize both logging and telemetry
export function initializeObservability(): void {
  // Initialize telemetry
  initializeTelemetry();

  // Logger is initialized automatically when imported
}

// Shutdown function for graceful cleanup
export async function shutdownObservability(): Promise<void> {
  await shutdownTelemetry();
}
