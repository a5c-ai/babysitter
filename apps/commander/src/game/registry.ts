/**
 * Registry navigation state machine (SPEC-V5 §V5-3): the full-screen ledger
 * separates entity kinds (stacks / agents / tasks / workspaces) with a tab
 * per kind. Navigation is tab → list → detail (→ detail …):
 *
 *   - selecting a TAB lands on that kind's list and clears the breadcrumb
 *     trail (a fresh start, like the Runs ledger's per-open reset);
 *   - opening a DETAIL (row click or any cross-link chip) pushes the current
 *     location onto the breadcrumb trail;
 *   - `registry-back` pops one level (or falls back to the current tab's
 *     list when the trail is empty);
 *   - the §V5-4 deep-link (sel-stack-link / Inspector stack chip) opens the
 *     overlay directly on a stack's detail with the stacks list beneath it.
 *
 * Run links are the one exception (§V5-3): they EXIT to the Runs overlay
 * (which renders above the registry; Esc returns) — no registry transition.
 *
 * Pure module — unit-tested in __tests__/registry.test.ts.
 */

import type { SimSessionView, SimStackView } from '../backend/mock/simulation';

/** §V5-3 registry tab kinds (`registry-tab-<kind>`). */
export const REGISTRY_KINDS = ['stacks', 'agents', 'tasks', 'workspaces'] as const;
export type RegistryKind = (typeof REGISTRY_KINDS)[number];

/** One registry location: a kind's list (`detailId: null`) or a detail. */
export interface RegistryLocation {
  tab: RegistryKind;
  /** stackRef | sessionId | taskId | workspaceId — null = the list. */
  detailId: string | null;
}

/** The overlay's navigation state: current location + breadcrumb trail. */
export interface RegistryNavState {
  current: RegistryLocation;
  /** Breadcrumb back stack (older first); `registryBack` pops the tail. */
  trail: RegistryLocation[];
}

/** A fresh registry: the given (default stacks) tab's list, empty trail. */
export function registryHome(tab: RegistryKind = 'stacks'): RegistryNavState {
  return { current: { tab, detailId: null }, trail: [] };
}

/**
 * §V5-4 deep-link: open directly on a stack's DETAIL with the stacks list
 * beneath it (back lands on the list, as if the row had been clicked).
 */
export function registryStackDeepLink(stackRef: string): RegistryNavState {
  return {
    current: { tab: 'stacks', detailId: stackRef },
    trail: [{ tab: 'stacks', detailId: null }],
  };
}

/** Tab strip click: that kind's list, trail cleared (fresh navigation). */
export function selectRegistryTab(state: RegistryNavState, tab: RegistryKind): RegistryNavState {
  if (state.current.tab === tab && state.current.detailId === null && state.trail.length === 0) {
    return state;
  }
  return registryHome(tab);
}

/**
 * Open a detail view (row click or cross-link chip): pushes the current
 * location onto the breadcrumb trail. Cross-links between kinds route
 * through here too (§V5-3: "every cross-link navigates WITHIN the
 * registry"). Re-opening the location already shown is a no-op.
 */
export function openRegistryDetail(
  state: RegistryNavState,
  tab: RegistryKind,
  detailId: string,
): RegistryNavState {
  if (state.current.tab === tab && state.current.detailId === detailId) return state;
  return {
    current: { tab, detailId },
    trail: [...state.trail, state.current],
  };
}

/**
 * `registry-back`: pop one breadcrumb level. With an empty trail a detail
 * falls back to its own tab's list; a list is a no-op (back hidden there).
 */
export function registryBack(state: RegistryNavState): RegistryNavState {
  const previous = state.trail[state.trail.length - 1];
  if (previous !== undefined) {
    return { current: previous, trail: state.trail.slice(0, -1) };
  }
  if (state.current.detailId !== null) {
    return registryHome(state.current.tab);
  }
  return state;
}

/** Whether the breadcrumb back control should render. */
export function canRegistryBack(state: RegistryNavState): boolean {
  return state.trail.length > 0 || state.current.detailId !== null;
}

// ---------------------------------------------------------------------------
// Entity-list selectors (pure; the overlay renders straight from these)
// ---------------------------------------------------------------------------

/** Personality excerpt for a stack row (§V5-3: prompt.system, clipped). */
export function personalityExcerpt(stack: SimStackView, maxChars = 96): string {
  const system = stack.stack.spec.prompt.system.trim().replace(/\s+/g, ' ');
  if (system.length <= maxChars) return system;
  return `${system.slice(0, maxChars).trimEnd()}…`;
}

/** The sessions a stack spawned (§V5-3 stack detail), newest first kept. */
export function sessionsOfStack(
  sessions: readonly SimSessionView[],
  stackRef: string,
): SimSessionView[] {
  return sessions.filter((s) => s.stackRef === stackRef);
}

/** Stack lookup by ref (row chips resolve names through this). */
export function stackByRef(
  stacks: readonly SimStackView[],
  stackRef: string,
): SimStackView | undefined {
  return stacks.find((s) => s.stackRef === stackRef);
}

/** Total tokens burned by a session (agents-tab column). */
export function sessionTokensTotal(session: SimSessionView): number {
  const t = session.tokenUsage;
  return t.inputTokens + t.outputTokens + t.thinkingTokens;
}
