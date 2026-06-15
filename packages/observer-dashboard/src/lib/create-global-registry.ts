/**
 * Generic globalThis registry factory.
 *
 * Provides type-safe, HMR-resilient accessors for global state.  Each caller
 * supplies its own registry-map interface and namespace key so multiple
 * registries (kanban, observer, etc.) can coexist without collision.
 *
 * CANONICAL SOURCE: packages/adapters/webui/src/lib/create-global-registry.ts
 * Keep this copy in sync.
 */

/**
 * Create a set of typed accessors for a `globalThis`-backed registry.
 *
 * @typeParam TMap - Interface mapping string keys to their concrete types.
 * @param namespaceKey - The key on `globalThis` used to store the registry
 *                       (e.g. `"__kanban_registry__"` or `"__observer_registry__"`).
 */
export function createGlobalRegistry<TMap extends object>(
  namespaceKey: string,
) {
  type PartialMap = Partial<TMap>;

  function registryRef(): PartialMap {
    const g = globalThis as Record<string, unknown>;
    if (!g[namespaceKey]) {
      g[namespaceKey] = {} as PartialMap;
    }
    return g[namespaceKey] as PartialMap;
  }

  return {
    /**
     * Return an HMR-safe global value, lazily initialising it via `factory`
     * on first access.
     */
    getGlobal<K extends keyof TMap & string>(
      key: K,
      factory: () => TMap[K],
    ): TMap[K] {
      const registry = registryRef();
      if (registry[key] === undefined) {
        registry[key] = factory();
      }
      return registry[key] as TMap[K];
    },

    /** Clear a single key from the global registry. */
    clearGlobal<K extends keyof TMap & string>(key: K): void {
      const g = globalThis as Record<string, unknown>;
      const registry = g[namespaceKey] as PartialMap | undefined;
      if (registry) {
        delete registry[key];
      }
    },

    /** Clear the entire global registry. */
    clearAllGlobals(): void {
      const g = globalThis as Record<string, unknown>;
      g[namespaceKey] = undefined;
    },
  };
}
