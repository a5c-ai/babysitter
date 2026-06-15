/**
 * Microagent Registry.
 *
 * A simple in-memory registry that holds MicroagentManifest entries
 * and supports lookup, listing with optional filters, and removal.
 */

import type { MicroagentManifest } from "./types";

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------

/** Criteria for narrowing a registry listing. */
export interface MicroagentRegistryFilter {
  /** Only return manifests that have ALL of these tags. */
  readonly tags?: readonly string[];

  /** When set, only return manifests matching this builtIn value. */
  readonly builtIn?: boolean;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export class MicroagentRegistry {
  private readonly agents = new Map<string, MicroagentManifest>();

  /** Register (or overwrite) a microagent manifest. */
  register(manifest: MicroagentManifest): void {
    this.agents.set(manifest.name, manifest);
  }

  /** Retrieve a manifest by name, or `undefined` if not registered. */
  get(name: string): MicroagentManifest | undefined {
    return this.agents.get(name);
  }

  /** List all registered manifests, optionally narrowed by filter. */
  list(filter?: MicroagentRegistryFilter): MicroagentManifest[] {
    const all = Array.from(this.agents.values());

    if (!filter) return all;

    return all.filter((m) => {
      if (filter.builtIn !== undefined && m.builtIn !== filter.builtIn) {
        return false;
      }
      if (filter.tags && filter.tags.length > 0) {
        const tagSet = new Set(m.tags);
        if (!filter.tags.every((t) => tagSet.has(t))) {
          return false;
        }
      }
      return true;
    });
  }

  /** Check whether a microagent with the given name is registered. */
  has(name: string): boolean {
    return this.agents.has(name);
  }

  /** Remove a microagent by name. Returns `true` if it existed. */
  unregister(name: string): boolean {
    return this.agents.delete(name);
  }
}
