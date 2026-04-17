import * as fs from 'fs';
import type { HandlerRef, HookPlanEntry } from '../types/plan';

/**
 * Options for resolving a hook execution plan.
 */
export interface PlanResolverOptions {
  /** The canonical phase to resolve handlers for. */
  phase: string;
  /** Path to a JSON registry file mapping phases to handlers. */
  registryPath?: string;
  /** Explicit handler refs passed via CLI --handler args. */
  handlers?: HandlerRef[];
  /** Module paths passed via CLI --handler-module args. */
  handlerModules?: string[];
}

/**
 * Registry file schema: maps phase names to arrays of handler refs
 * with optional pluginId.
 */
interface RegistryHandlerEntry {
  source: string;
  handler: string;
  priority?: number;
  pluginId?: string;
  id?: string;
}

interface RegistryFile {
  [phase: string]: RegistryHandlerEntry[];
}

/**
 * Read a registry JSON file and extract handlers for the given phase.
 */
function readRegistryHandlers(registryPath: string, phase: string): RegistryHandlerEntry[] {
  try {
    const content = fs.readFileSync(registryPath, 'utf-8');
    const registry: RegistryFile = JSON.parse(content) as RegistryFile;
    const handlers = registry[phase];
    if (Array.isArray(handlers)) {
      return handlers;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Convert --handler-module paths into HandlerRef objects.
 * Module format: "path/to/module#exportName" or just "path/to/module" (default export = "handler").
 */
function modulesToHandlerRefs(modules: string[]): { ref: HandlerRef; pluginId: string }[] {
  return modules.map((mod, index) => {
    const hashIdx = mod.indexOf('#');
    if (hashIdx >= 0) {
      return {
        ref: {
          source: mod.slice(0, hashIdx),
          handler: mod.slice(hashIdx + 1),
          priority: 100 + index,
        },
        pluginId: mod.slice(0, hashIdx),
      };
    }
    return {
      ref: {
        source: mod,
        handler: 'handler',
        priority: 100 + index,
      },
      pluginId: mod,
    };
  });
}

/**
 * Sort plan entries by: priority ascending, then pluginId ascending,
 * then id ascending for deterministic ordering.
 */
export function sortPlanEntries(entries: HookPlanEntry[]): HookPlanEntry[] {
  return [...entries].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const sa = a.pluginId.localeCompare(b.pluginId);
    if (sa !== 0) return sa;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Sort handler refs by: priority ascending, then source ascending,
 * then handler ascending.  (Legacy convenience for external callers.)
 */
export function sortHandlers(handlers: HandlerRef[]): HandlerRef[] {
  return [...handlers].sort((a, b) => {
    const pa = a.priority ?? 1000;
    const pb = b.priority ?? 1000;
    if (pa !== pb) return pa - pb;
    const sa = a.source.localeCompare(b.source);
    if (sa !== 0) return sa;
    return a.handler.localeCompare(b.handler);
  });
}

/**
 * Resolve a hook execution plan for the given phase.
 *
 * Merges handlers from:
 * 1. Explicit --handler args
 * 2. --handler-module paths (converted to HandlerRefs)
 * 3. Registry JSON file
 *
 * Produces one HookPlanEntry per handler, sorted by priority.
 */
export function resolveHookPlan(options: PlanResolverOptions): HookPlanEntry[] {
  const { phase, registryPath, handlers = [], handlerModules = [] } = options;

  const entries: HookPlanEntry[] = [];
  let counter = 0;

  // 1. Explicit handler refs
  for (const h of handlers) {
    entries.push({
      id: `explicit-${counter++}`,
      pluginId: h.source,
      phase,
      priority: h.priority ?? 1000,
      handler: h,
    });
  }

  // 2. Module paths
  if (handlerModules.length > 0) {
    const moduleRefs = modulesToHandlerRefs(handlerModules);
    for (const { ref, pluginId } of moduleRefs) {
      entries.push({
        id: `module-${counter++}`,
        pluginId,
        phase,
        priority: ref.priority ?? 1000,
        handler: ref,
      });
    }
  }

  // 3. Registry file
  if (registryPath) {
    const regHandlers = readRegistryHandlers(registryPath, phase);
    for (const rh of regHandlers) {
      const ref: HandlerRef = {
        source: rh.source,
        handler: rh.handler,
        priority: rh.priority,
      };
      entries.push({
        id: rh.id ?? `registry-${counter++}`,
        pluginId: rh.pluginId ?? rh.source,
        phase,
        priority: rh.priority ?? 1000,
        handler: ref,
      });
    }
  }

  if (entries.length === 0) {
    return [];
  }

  return sortPlanEntries(entries);
}
