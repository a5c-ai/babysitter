import { describe, it, expect, beforeEach } from 'vitest';
import {
  FeatureFlagStore,
  AnalyticsCollector,
  type FeatureFlag,
  type AnalyticsEvent,
} from '../analytics';

// ---------------------------------------------------------------------------
// FeatureFlagStore
// ---------------------------------------------------------------------------

describe('FeatureFlagStore', () => {
  let store: FeatureFlagStore;

  beforeEach(() => {
    store = new FeatureFlagStore();
  });

  // -----------------------------------------------------------------------
  // setFlag / isEnabled
  // -----------------------------------------------------------------------

  it('returns false for unknown flags', () => {
    expect(store.isEnabled('nope')).toBe(false);
  });

  it('returns true for enabled flags', () => {
    store.setFlag('dark-mode', true);
    expect(store.isEnabled('dark-mode')).toBe(true);
  });

  it('returns false for disabled flags', () => {
    store.setFlag('dark-mode', false);
    expect(store.isEnabled('dark-mode')).toBe(false);
  });

  it('toggles an existing flag', () => {
    store.setFlag('x', true);
    expect(store.isEnabled('x')).toBe(true);
    store.setFlag('x', false);
    expect(store.isEnabled('x')).toBe(false);
  });

  // -----------------------------------------------------------------------
  // registerFlag / listFlags
  // -----------------------------------------------------------------------

  it('registers full flag definitions', () => {
    const flag: FeatureFlag = {
      id: 'experiment',
      enabled: true,
      rolloutPercent: 50,
      description: 'An experiment',
    };
    store.registerFlag(flag);
    const listed = store.listFlags();
    expect(listed).toHaveLength(1);
    expect(listed[0].description).toBe('An experiment');
  });

  it('lists all registered flags', () => {
    store.setFlag('a', true);
    store.setFlag('b', false);
    store.registerFlag({ id: 'c', enabled: true });
    expect(store.listFlags()).toHaveLength(3);
  });

  // -----------------------------------------------------------------------
  // Rollout percentage
  // -----------------------------------------------------------------------

  it('respects rolloutPercent with stableId', () => {
    store.registerFlag({ id: 'rollout', enabled: true, rolloutPercent: 50 });

    // With enough stable IDs, some should be enabled and some disabled.
    let enabledCount = 0;
    for (let i = 0; i < 100; i++) {
      if (store.isEnabled('rollout', { stableId: `user-${i}` })) {
        enabledCount++;
      }
    }
    // Expect roughly half, but allow wide margin for hash distribution
    expect(enabledCount).toBeGreaterThan(10);
    expect(enabledCount).toBeLessThan(90);
  });

  it('100% rollout always returns true', () => {
    store.registerFlag({ id: 'full', enabled: true, rolloutPercent: 100 });
    // rolloutPercent < 100 check means 100 is treated as fully enabled
    expect(store.isEnabled('full', { stableId: 'any' })).toBe(true);
  });

  it('0% rollout always returns false', () => {
    store.registerFlag({ id: 'zero', enabled: true, rolloutPercent: 0 });
    for (let i = 0; i < 20; i++) {
      expect(store.isEnabled('zero', { stableId: `u${i}` })).toBe(false);
    }
  });

  it('disabled flag with rollout returns false', () => {
    store.registerFlag({ id: 'off', enabled: false, rolloutPercent: 100 });
    expect(store.isEnabled('off', { stableId: 'u1' })).toBe(false);
  });

  // -----------------------------------------------------------------------
  // loadFromConfig — tested via registerFlag since file I/O is trivial
  // -----------------------------------------------------------------------

  it('loadFromConfig throws for missing file', () => {
    expect(() => store.loadFromConfig('/nonexistent/flags.json')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// AnalyticsCollector
// ---------------------------------------------------------------------------

describe('AnalyticsCollector', () => {
  let collector: AnalyticsCollector;

  beforeEach(() => {
    collector = new AnalyticsCollector();
  });

  it('starts with no events', () => {
    expect(collector.getEvents()).toEqual([]);
  });

  it('tracks events', () => {
    const event: AnalyticsEvent = {
      type: 'page_view',
      properties: { path: '/' },
      timestamp: 1000,
      sessionId: 's1',
    };
    collector.track(event);
    expect(collector.getEvents()).toHaveLength(1);
    expect(collector.getEvents()[0].type).toBe('page_view');
  });

  it('flush returns events and clears the buffer', () => {
    collector.track({
      type: 'click',
      properties: {},
      timestamp: 2000,
      sessionId: 's1',
    });
    collector.track({
      type: 'submit',
      properties: {},
      timestamp: 3000,
      sessionId: 's1',
    });

    const flushed = collector.flush();
    expect(flushed).toHaveLength(2);
    expect(collector.getEvents()).toEqual([]);
  });

  it('can track after flush', () => {
    collector.track({
      type: 'a',
      properties: {},
      timestamp: 1,
      sessionId: 's1',
    });
    collector.flush();
    collector.track({
      type: 'b',
      properties: {},
      timestamp: 2,
      sessionId: 's1',
    });
    expect(collector.getEvents()).toHaveLength(1);
    expect(collector.getEvents()[0].type).toBe('b');
  });
});
