/**
 * Custom hook that wraps useState with localStorage persistence.
 * Values are serialized with JSON.stringify/parse and namespaced
 * under the "kanban:" prefix to avoid collisions.
 *
 * Hydration-safe: first render uses defaultValue (matching SSR),
 * then useLayoutEffect reads localStorage before the browser paints
 * so the persisted value appears with no visible flash.
 */
export declare function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void];
