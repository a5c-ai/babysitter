/**
 * Scenarios barrel.
 *
 * Re-exports the legacy top-level scenarios plus the per-agent,
 * interactive, and error presets.
 */

export * from '../scenarios.js';
export * from './wire-format.js';
export * from './per-agent.js';
export * from './errors.js';
export * from './interactive.js';
export * from './hooks.js';

import { AGENT_SCENARIOS } from './per-agent.js';
import { ERROR_SCENARIOS } from './errors.js';
import { INTERACTION_SCENARIOS } from './interactive.js';
import {
  RUNTIME_HOOK_SCENARIOS,
} from './hooks.js';
import type { HarnessScenario } from '../types.js';

/**
 * Resolve a scenario by name. Supports:
 *  - agent scenario ids like `claude:basic-text`
 *  - error ids like `error:rate-limit`
 *  - interaction ids like `interactive:yolo`
 */
export function resolveScenario(name: string): HarnessScenario | undefined {
  if (AGENT_SCENARIOS[name]) return AGENT_SCENARIOS[name];
  if (name.startsWith('error:')) {
    const meta = ERROR_SCENARIOS[name.slice('error:'.length)];
    if (meta) return meta.scenario;
  }
  if (name.startsWith('interactive:')) {
    const m = name.slice('interactive:'.length) as 'yolo' | 'prompt' | 'deny' | 'timeout';
    if (INTERACTION_SCENARIOS[m]) return INTERACTION_SCENARIOS[m];
  }
  if (RUNTIME_HOOK_SCENARIOS[name]) return RUNTIME_HOOK_SCENARIOS[name];
  return undefined;
}

/** List all resolvable scenario names. */
export function listScenarioNames(): string[] {
  const names: string[] = [];
  names.push(...Object.keys(AGENT_SCENARIOS));
  for (const k of Object.keys(ERROR_SCENARIOS)) names.push(`error:${k}`);
  for (const k of Object.keys(INTERACTION_SCENARIOS)) names.push(`interactive:${k}`);
  names.push(...Object.keys(RUNTIME_HOOK_SCENARIOS));
  return names.sort();
}
