/**
 * Shared helpers for the FROZEN v5 A5C Commander e2e suite.
 *
 * Authored strictly from SPEC.md + SPEC-V2.md + SPEC-V3.md + SPEC-V4.md + SPEC-V5.md
 * (V5 is purely additive — "all 30 existing frozen tests must keep passing unchanged").
 * These tests are frozen inputs; the implementation is built to satisfy them.
 *
 * Determinism contract (SPEC §9, SPEC-V3 §V3-7, SPEC-V4 §V4-4, SPEC-V5 §V5-1):
 *  - boot `/?seed=42`, pause sim on load, advance ONLY via `window.__commander.sim.tick(n)`;
 *  - sessions are deterministic — "Same seed ⇒ identical session ids, names, link structure";
 *  - the sim views `listSessions(taskId?)` and `getSession(sessionId)` are exposed on the
 *    test-hooks API per the established convention (same probing pattern as `moveCard`).
 *
 * Selector contract (SPEC-V5 testids): `inspector-tab-sessions`, `session-row-<sessionId>`,
 * `session-transcript`, `topbar-registry`, `registry-overlay`,
 * `registry-tab-stacks|agents|tasks|workspaces`, `registry-row-<id>`, `registry-back`,
 * `sel-session-link`, `sel-stack-link`. Where an id value is unknowable from the specs we
 * select by prefix.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { tickUntil } from './helpers';
import { columnOfCard, moveCardViaSim, singleCardsIn } from './helpers-v3';
import { callSimVerb, V4_BUDGET } from './helpers-v4';

/** SPEC-V5 data-testid contract. */
export const SEL5 = {
  inspectorTabSessions: '[data-testid="inspector-tab-sessions"]',
  sessionRow: '[data-testid^="session-row-"]',
  sessionTranscript: '[data-testid="session-transcript"]',
  topbarRegistry: '[data-testid="topbar-registry"]',
  registryOverlay: '[data-testid="registry-overlay"]',
  registryRow: '[data-testid^="registry-row-"]',
  registryBack: '[data-testid="registry-back"]',
  selSessionLink: '[data-testid="sel-session-link"]',
  selStackLink: '[data-testid="sel-stack-link"]',
} as const;

/** SPEC-V5 §V5-3 registry tab kinds. */
export const REGISTRY_KINDS = ['stacks', 'agents', 'tasks', 'workspaces'] as const;
export type RegistryKind = (typeof REGISTRY_KINDS)[number];

export function registryTab(page: Page, kind: RegistryKind): Locator {
  return page.locator(`[data-testid="registry-tab-${kind}"]`).first();
}

/** SPEC-V5 §V5-3: `registry-row-<id>` (id = stackRef | sessionId | taskId | workspaceId). */
export function registryRow(page: Page, id: string): Locator {
  return page.locator(`[data-testid="registry-row-${id}"]`).first();
}

/** SPEC-V5 §V5-2: `session-row-<sessionId>`. */
export function sessionRow(page: Page, sessionId: string): Locator {
  return page.locator(`[data-testid="session-row-${sessionId}"]`).first();
}

/* ------------------------------------------------------------------------------------------
 * SessionRecord sim views (SPEC-V5 §V5-1)
 * ---------------------------------------------------------------------------------------- */

export type SessionRole = 'worker' | 'reviewer' | 'integration' | string;
export type SessionStatus = 'active' | 'completed' | 'aborted' | string;

/** SPEC-V5 §V5-1 SessionRecord (the fields these tests rely on). */
export interface SessionRecord {
  sessionId: string;
  title: string;
  role: SessionRole;
  status: SessionStatus;
  taskId: string;
  stackRef: string;
  stackName: string;
  attempt?: number;
  runId?: string;
  parentSessionId?: string;
  reviewOfSessionId?: string;
  [key: string]: unknown;
}

function normalizeSessionRecord(raw: unknown): SessionRecord {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (k: string): string => (typeof r[k] === 'string' ? (r[k] as string) : '');
  const opt = (k: string): string | undefined =>
    typeof r[k] === 'string' && (r[k] as string) !== '' ? (r[k] as string) : undefined;
  return {
    ...r,
    sessionId: str('sessionId'),
    title: str('title'),
    role: str('role'),
    status: str('status'),
    taskId: str('taskId'),
    stackRef: str('stackRef'),
    stackName: str('stackName'),
    attempt: typeof r['attempt'] === 'number' ? (r['attempt'] as number) : undefined,
    runId: opt('runId'),
    parentSessionId: opt('parentSessionId'),
    reviewOfSessionId: opt('reviewOfSessionId'),
  };
}

/**
 * SPEC-V5 §V5-1 sim view `listSessions(taskId?)` — "all sessions, or that card's, newest
 * first" — probed on the test-hooks API per the established moveCard convention.
 */
export async function listSessions(page: Page, taskId?: string): Promise<SessionRecord[]> {
  const raw = await callSimVerb<unknown>(page, 'listSessions', taskId ? [taskId] : []);
  if (!Array.isArray(raw)) {
    throw new Error(
      'listSessions did not return an array (SPEC-V5 §V5-1: "Sim views: listSessions(taskId?) ' +
        '(all sessions, or that card\'s, newest first)").',
    );
  }
  return raw.map(normalizeSessionRecord);
}

/**
 * SPEC-V5 §V5-1 sim view `getSession(sessionId)` — "record + transcript". The exact envelope
 * is unknowable from the spec, so normalize both `{record, transcript}` and a flat record.
 */
export async function getSession(
  page: Page,
  sessionId: string,
): Promise<{ record: SessionRecord; transcript: unknown[] }> {
  const raw = await callSimVerb<unknown>(page, 'getSession', [sessionId]);
  const r = (raw ?? {}) as Record<string, unknown>;
  const recordSource = r['record'] && typeof r['record'] === 'object' ? r['record'] : raw;
  const transcriptSource = Array.isArray(r['transcript'])
    ? (r['transcript'] as unknown[])
    : Array.isArray(r['messages'])
      ? (r['messages'] as unknown[])
      : [];
  return { record: normalizeSessionRecord(recordSource), transcript: transcriptSource };
}

/* ------------------------------------------------------------------------------------------
 * CardView sim view (established convention; used by the v4 self-check captures)
 * ---------------------------------------------------------------------------------------- */

/** The card-view fields these tests rely on (`sim.listCardViews()`). */
export interface CardViewLite {
  taskId: string;
  column: string;
  parentId: string | null;
  childIds: string[];
  [key: string]: unknown;
}

export async function listCardViews(page: Page): Promise<CardViewLite[]> {
  const raw = await callSimVerb<unknown>(page, 'listCardViews', []);
  if (!Array.isArray(raw)) {
    throw new Error('listCardViews did not return an array (established sim-view convention).');
  }
  return raw.map((c) => {
    const r = (c ?? {}) as Record<string, unknown>;
    return {
      ...r,
      taskId: typeof r['taskId'] === 'string' ? (r['taskId'] as string) : '',
      column: typeof r['column'] === 'string' ? (r['column'] as string) : '',
      parentId: typeof r['parentId'] === 'string' ? (r['parentId'] as string) : null,
      childIds: Array.isArray(r['childIds'])
        ? (r['childIds'] as unknown[]).filter((x): x is string => typeof x === 'string')
        : [],
    };
  });
}

/** Find a STACK parent card (has childIds; SPEC-V3 §V3-2 boot seeds 2 stacks in backlog). */
export async function findStackParent(page: Page): Promise<CardViewLite> {
  const views = await listCardViews(page);
  const parent = views.find((c) => c.parentId === null && c.childIds.length >= 2);
  if (!parent) {
    throw new Error(
      'no stack parent card (childIds.length ≥ 2) found in listCardViews ' +
        '(SPEC-V3 §V3-2: the boot scenario seeds 2 stacks in backlog).',
    );
  }
  return parent;
}

/* ------------------------------------------------------------------------------------------
 * Staging drivers
 * ---------------------------------------------------------------------------------------- */

/**
 * Drive the boot backlog singles into work (non-yolo) and tick until one of them sits in
 * HUMAN REVIEW (worker + reviewer sessions will have existed by then, §V3-2 lifecycle).
 * Returns the taskId of the card now in human-review.
 */
export async function driveCardToHumanReview(page: Page): Promise<string> {
  const singles = await singleCardsIn(page, 'backlog');
  expect(
    singles.length,
    'boot backlog must contain several single cards (SPEC-V3 §V3-2 boot scenario)',
  ).toBeGreaterThanOrEqual(2);
  for (const c of singles) await moveCardViaSim(page, c.taskId, 'do');
  const ids = singles.map((c) => c.taskId);
  let reviewId: string | null = null;
  const ok = await tickUntil(
    page,
    async () => {
      for (const id of ids) {
        if ((await columnOfCard(page, id)) === 'human-review') {
          reviewId = id;
          return true;
        }
      }
      return false;
    },
    V4_BUDGET,
  );
  if (!ok || !reviewId) {
    throw new Error(
      `no card reached HUMAN REVIEW within ${V4_BUDGET.chunk * V4_BUDGET.maxChunks} ticks ` +
        '(SPEC-V3 §V3-2: a non-yolo card passing AI review lands in HUMAN REVIEW).',
    );
  }
  return reviewId;
}

/* ------------------------------------------------------------------------------------------
 * Rendering probes
 * ---------------------------------------------------------------------------------------- */

/**
 * SPEC-V5 §V5-2 / AC47: "Subsessions render NESTED (indented, connector bracket) under their
 * parent session". Exact markup is unknowable, so accept any of: DOM containment, a visible
 * left indent (≥6px) versus the parent row, or an indent/nest/bracket-ish class on the row
 * or an ancestor wrapper.
 */
export async function isRenderedNestedUnder(
  page: Page,
  childSessionId: string,
  parentSessionId: string,
): Promise<boolean> {
  return page.evaluate(
    ([childId, parentId]) => {
      const child = document.querySelector(`[data-testid="session-row-${childId}"]`);
      const parent = document.querySelector(`[data-testid="session-row-${parentId}"]`);
      if (!child || !parent) return false;
      if (parent.contains(child)) return true;
      const wrapperish = child.closest('[class*="nest"], [class*="indent"], [class*="sub-"], [class*="child"], [class*="bracket"]');
      if (wrapperish && !wrapperish.contains(parent)) return true;
      const cb = child.getBoundingClientRect();
      const pb = parent.getBoundingClientRect();
      return cb.x > pb.x + 6;
    },
    [childSessionId, parentSessionId] as const,
  );
}

/** Escape a literal string for use inside a RegExp (stack names, titles, run ids). */
export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Longest text line of a card — its serif title (§V3-1 card anatomy; cross-surface anchor). */
export function titleFragment(cardText: string): string {
  return cardText
    .split('\n')
    .map((l) => l.trim())
    .sort((a, b) => b.length - a.length)[0]
    .slice(0, 14)
    .trim();
}
