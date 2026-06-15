/**
 * Selection reducer tests (SPEC §5/§6 under SPEC-V3, AC2): click select /
 * shift toggle and the Esc cascade. Uses the real seeded sim world
 * (autoStart: false). RETIRED with the map canvas: marquee merge, control
 * groups, recall-again camera centering, targeting modes, F idle-cycle.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { MockBackend } from '../../backend/mock/mockBackend';
import {
  applyClickSelection,
  bindBackendToStore,
  createCommanderStore,
  sameSelectionSet,
  type BackendBinding,
  type CommanderStore,
} from '../store';

describe('pure selection helpers', () => {
  it('click select replaces the previous selection', () => {
    expect(applyClickSelection(['a', 'b'], 'c', false)).toEqual(['c']);
  });

  it('shift-click toggles membership preserving order', () => {
    expect(applyClickSelection(['a', 'b'], 'c', true)).toEqual(['a', 'b', 'c']);
    expect(applyClickSelection(['a', 'b', 'c'], 'b', true)).toEqual(['a', 'c']);
  });

  it('sameSelectionSet is order-insensitive', () => {
    expect(sameSelectionSet(['a', 'b'], ['b', 'a'])).toBe(true);
    expect(sameSelectionSet(['a'], ['a', 'b'])).toBe(false);
  });
});

describe('store selection slice over the seeded board', () => {
  let store: CommanderStore;
  let binding: BackendBinding;
  let cardIds: string[];

  beforeEach(() => {
    const backend = new MockBackend({ seed: 42, autoStart: false });
    store = createCommanderStore();
    binding = bindBackendToStore(store, backend);
    binding.flush();
    // V3 boot world: zero agents; cards are the selectable entities.
    cardIds = store.getState().board.cardIds;
    expect(cardIds.length).toBeGreaterThanOrEqual(5);
  });

  it('clickSelect clears previous; shift-click adds/removes (AC2)', () => {
    const [a, b] = [cardIds[0]!, cardIds[1]!];
    store.getState().clickSelect(a, false);
    expect(store.getState().selection.ids).toEqual([a]);
    store.getState().clickSelect(b, false);
    expect(store.getState().selection.ids).toEqual([b]);
    store.getState().clickSelect(a, true);
    expect(store.getState().selection.ids).toEqual([b, a]);
    store.getState().clickSelect(b, true);
    expect(store.getState().selection.ids).toEqual([a]);
  });

  it('escape cascade: steer modal closes first and keeps the selection (HUD phase)', () => {
    store.getState().select([cardIds[0]!]);
    store.getState().openInspector(cardIds[0]!);
    store.getState().openSteer();

    store.getState().escape();
    expect(store.getState().meta.steerOpen).toBe(false);
    expect(store.getState().meta.inspectorUnitId).toBe(cardIds[0]); // untouched this pass
    expect(store.getState().selection.ids).toEqual([cardIds[0]]);

    store.getState().escape();
    expect(store.getState().meta.inspectorUnitId).toBeNull();
    expect(store.getState().selection.ids).toEqual([cardIds[0]]);
  });

  it('escape cascade: foundry/archive close before the review panel (§V3-7)', () => {
    store.getState().select([cardIds[0]!]);
    store.getState().openReview(cardIds[0]!);
    store.getState().openArchive();
    store.getState().openFoundry();

    store.getState().escape();
    expect(store.getState().meta.foundryOpen).toBe(false);
    expect(store.getState().meta.archiveOpen).toBe(true); // foundry first

    store.getState().escape();
    expect(store.getState().meta.archiveOpen).toBe(false);
    expect(store.getState().meta.reviewTaskId).toBe(cardIds[0]); // untouched

    store.getState().escape();
    expect(store.getState().meta.reviewTaskId).toBeNull();
    expect(store.getState().selection.ids).toEqual([cardIds[0]]);

    store.getState().escape();
    expect(store.getState().selection.ids).toEqual([]);
  });

  // RETIRED by V3: marquee merge, control groups, recall-again camera
  // centering, targeting cascade, cycleIdle — the map canvas is gone.
});
