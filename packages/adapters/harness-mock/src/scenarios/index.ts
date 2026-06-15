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

function normalizeAgentPrefix(agent: string): string {
  return agent.endsWith(':') ? agent : `${agent}:`;
}

function applyAgentPrefix(name: string, agent?: string): string {
  if (!agent || name.includes(':')) return name;
  return `${normalizeAgentPrefix(agent)}${name}`;
}

function matchesAgentPrefix(name: string, agent?: string): boolean {
  return !agent || name.startsWith(normalizeAgentPrefix(agent));
}

/**
 * Resolve a scenario by name. Supports:
 *  - agent scenario ids like `claude:basic-text`
 *  - error ids like `error:rate-limit`
 *  - interaction ids like `interactive:yolo`
 */
export function resolveScenario(name: string, agent?: string): HarnessScenario | undefined {
  const resolvedName = applyAgentPrefix(name, agent);
  if (!matchesAgentPrefix(resolvedName, agent)) return undefined;

  if (AGENT_SCENARIOS[resolvedName]) return AGENT_SCENARIOS[resolvedName];
  if (resolvedName.startsWith('error:')) {
    const meta = ERROR_SCENARIOS[resolvedName.slice('error:'.length)];
    if (meta) return meta.scenario;
  }
  if (resolvedName.startsWith('interactive:')) {
    const m = resolvedName.slice('interactive:'.length) as 'yolo' | 'prompt' | 'deny' | 'timeout';
    if (INTERACTION_SCENARIOS[m]) return INTERACTION_SCENARIOS[m];
  }
  if (RUNTIME_HOOK_SCENARIOS[resolvedName]) return RUNTIME_HOOK_SCENARIOS[resolvedName];
  return undefined;
}

/** List all resolvable scenario names. */
export function listScenarioNames(agent?: string): string[] {
  const names: string[] = [];
  names.push(...Object.keys(AGENT_SCENARIOS));
  for (const k of Object.keys(ERROR_SCENARIOS)) names.push(`error:${k}`);
  for (const k of Object.keys(INTERACTION_SCENARIOS)) names.push(`interactive:${k}`);
  names.push(...Object.keys(RUNTIME_HOOK_SCENARIOS));
  return names.filter((name) => matchesAgentPrefix(name, agent)).sort();
}
