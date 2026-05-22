/**
 * @a5c-ai/agent-mux-observability
 *
 * Observability infrastructure for agent-mux.
 * Provides structured logging and telemetry with switchable implementations.
 */

import {
  logger as realLogger,
  createLogger as createRealLogger,
  createComponentLogger as createRealComponentLogger,
  reconfigureLogger as reconfigureRealLogger,
} from './logger.js';
import {
  telemetry as realTelemetry,
  initializeTelemetry as initializeRealTelemetry,
  shutdownTelemetry as shutdownRealTelemetry,
} from './telemetry.js';
import {
  logger as simpleLogger,
  createSimpleLogger,
  createComponentLogger as createSimpleComponentLogger,
} from './logger-simple.js';
import {
  telemetry as simpleTelemetry,
  initializeTelemetry as initializeSimpleTelemetry,
  shutdownTelemetry as shutdownSimpleTelemetry,
} from './telemetry-simple.js';
import { Logger, Telemetry } from './types.js';

export * from './types.js';

/**
 * Observability mode: 'full' for Pino/OpenTelemetry, 'simple' for Console/JSON.
 */
export type ObservabilityMode = 'full' | 'simple';

function getMode(): ObservabilityMode {
  return (process.env.AMUX_OBSERVABILITY_MODE as ObservabilityMode) || 'simple';
}

// Exported Logger
export const logger: Logger = new Proxy(simpleLogger, {
  get(target, prop, receiver) {
    const activeLogger = getMode() === 'full' ? realLogger : simpleLogger;
    return Reflect.get(activeLogger, prop, receiver);
  },
  set(target, prop, value, receiver) {
    const activeLogger = getMode() === 'full' ? realLogger : simpleLogger;
    return Reflect.set(activeLogger, prop, value, receiver);
  }
});

/**
 * Create a logger instance based on current mode.
 */
export function createLogger(config?: any): Logger {
  return getMode() === 'full' ? createRealLogger(config) : createSimpleLogger(config);
}

/**
 * Create a component-specific logger based on current mode.
 */
export function createComponentLogger(component: string, context?: any): Logger {
  return getMode() === 'full'
    ? createRealComponentLogger(component, context)
    : createSimpleComponentLogger(component, context);
}

/**
 * Reconfigure the default logger.
 */
export function reconfigureLogger(config: any): void {
  // If we are in full mode or should be, reconfigure real logger
  if (getMode() === 'full') {
    reconfigureRealLogger(config);
  }
}

// Exported Telemetry
export const telemetry: Telemetry = new Proxy(simpleTelemetry, {
  get(target, prop, receiver) {
    const activeTelemetry = getMode() === 'full' ? realTelemetry : simpleTelemetry;
    return Reflect.get(activeTelemetry, prop, receiver);
  },
  set(target, prop, value, receiver) {
    const activeTelemetry = getMode() === 'full' ? realTelemetry : simpleTelemetry;
    return Reflect.set(activeTelemetry, prop, value, receiver);
  }
});

/**
 * Initialize observability based on current mode.
 */
export function initializeObservability(): void {
  if (getMode() === 'full') {
    initializeRealTelemetry();
  } else {
    initializeSimpleTelemetry();
  }
}

/**
 * Shutdown observability based on current mode.
 */
export async function shutdownObservability(): Promise<void> {
  if (getMode() === 'full') {
    await shutdownRealTelemetry();
  } else {
    await shutdownSimpleTelemetry();
  }
}

// Compatibility exports
export const initializeTelemetry = initializeObservability;
export const shutdownTelemetry = shutdownObservability;
