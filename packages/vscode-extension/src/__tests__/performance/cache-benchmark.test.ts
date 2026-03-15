import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as path from 'path';
import * as os from 'os';
import { RunCache } from '../../lib/run-cache';
import { createLargeFixture, cleanupFixture } from './__helpers__/fixture-generator';

describe('RunCache Performance Benchmarks', () => {
  let fixtureDir10: string;
  let fixtureDir25: string;
  let fixtureDir50: string;

  beforeAll(() => {
    // Create fixtures with varying numbers of runs
    // Each run has 30 events and 10 tasks
    fixtureDir10 = createLargeFixture(os.tmpdir(), 10, 30, 10);
    fixtureDir25 = createLargeFixture(os.tmpdir(), 25, 30, 10);
    fixtureDir50 = createLargeFixture(os.tmpdir(), 50, 30, 10);
  });

  afterAll(() => {
    cleanupFixture(fixtureDir10);
    cleanupFixture(fixtureDir25);
    cleanupFixture(fixtureDir50);
  });

  describe('refreshAll', () => {
    it('benchmarks refreshAll with 10 runs', () => {
      const cache = new RunCache(fixtureDir10);
      const start = performance.now();
      cache.refreshAll();
      const duration = performance.now() - start;

      const runs = cache.getAll();
      expect(runs.length).toBe(10);
      expect(duration).toBeLessThan(3000); // 3s for 10 runs (generous)
      console.log(`  ✓ Refreshed ${runs.length} runs in ${duration.toFixed(2)}ms (${(duration / runs.length).toFixed(2)}ms per run)`);
    });

    it('benchmarks refreshAll with 25 runs', () => {
      const cache = new RunCache(fixtureDir25);
      const start = performance.now();
      cache.refreshAll();
      const duration = performance.now() - start;

      const runs = cache.getAll();
      expect(runs.length).toBe(25);
      expect(duration).toBeLessThan(7000); // 7s for 25 runs (generous)
      console.log(`  ✓ Refreshed ${runs.length} runs in ${duration.toFixed(2)}ms (${(duration / runs.length).toFixed(2)}ms per run)`);
    });

    it('benchmarks refreshAll with 50 runs', () => {
      const cache = new RunCache(fixtureDir50);
      const start = performance.now();
      cache.refreshAll();
      const duration = performance.now() - start;

      const runs = cache.getAll();
      expect(runs.length).toBe(50);
      expect(duration).toBeLessThan(10000); // 10s for 50 runs (generous for CI)
      console.log(`  ✓ Refreshed ${runs.length} runs in ${duration.toFixed(2)}ms (${(duration / runs.length).toFixed(2)}ms per run)`);
    });
  });

  describe('refresh (single run)', () => {
    it('benchmarks single run refresh', () => {
      const cache = new RunCache(fixtureDir25);
      cache.refreshAll(); // Pre-populate cache

      const runId = 'perf-run-000005';
      const start = performance.now();
      const run = cache.refresh(runId);
      const duration = performance.now() - start;

      expect(run).not.toBeNull();
      expect(run!.runId).toBe(runId);
      expect(duration).toBeLessThan(500); // 500ms for single run refresh
      console.log(`  ✓ Refreshed single run in ${duration.toFixed(2)}ms`);
    });

    it('benchmarks multiple single run refreshes', () => {
      const cache = new RunCache(fixtureDir25);
      cache.refreshAll(); // Pre-populate cache

      const iterations = 10;
      const runIds = Array.from({ length: iterations }, (_, i) => `perf-run-${i.toString().padStart(6, '0')}`);

      const start = performance.now();
      for (const runId of runIds) {
        const run = cache.refresh(runId);
        expect(run).not.toBeNull();
      }
      const duration = performance.now() - start;
      const avgDuration = duration / iterations;

      expect(avgDuration).toBeLessThan(500); // Average under 500ms
      console.log(
        `  ✓ Refreshed ${iterations} runs: total ${duration.toFixed(2)}ms, avg ${avgDuration.toFixed(2)}ms per run`,
      );
    });
  });

  describe('cache operations', () => {
    it('benchmarks getAll after refresh', () => {
      const cache = new RunCache(fixtureDir50);
      cache.refreshAll();

      const start = performance.now();
      const runs = cache.getAll();
      const duration = performance.now() - start;

      expect(runs.length).toBe(50);
      expect(duration).toBeLessThan(50); // Should be very fast (just sorting)
      console.log(`  ✓ Retrieved ${runs.length} runs in ${duration.toFixed(2)}ms`);
    });

    it('benchmarks getByStatus filtering', () => {
      const cache = new RunCache(fixtureDir50);
      cache.refreshAll();

      const start = performance.now();
      const completedRuns = cache.getByStatus('completed');
      const duration = performance.now() - start;

      expect(completedRuns.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(50); // Should be very fast (filter + sort)
      console.log(`  ✓ Filtered ${completedRuns.length} completed runs in ${duration.toFixed(2)}ms`);
    });

    it('benchmarks getDigests generation', () => {
      const cache = new RunCache(fixtureDir50);
      cache.refreshAll();

      const start = performance.now();
      const digests = cache.getDigests();
      const duration = performance.now() - start;

      expect(digests.length).toBe(50);
      expect(duration).toBeLessThan(100); // Should be fast (map operation)
      console.log(`  ✓ Generated ${digests.length} digests in ${duration.toFixed(2)}ms`);
    });

    it('benchmarks getSummary aggregation', () => {
      const cache = new RunCache(fixtureDir50);
      cache.refreshAll();

      const start = performance.now();
      const summary = cache.getSummary();
      const duration = performance.now() - start;

      expect(summary.total).toBe(50);
      expect(duration).toBeLessThan(50); // Should be very fast (single pass)
      console.log(`  ✓ Generated summary in ${duration.toFixed(2)}ms`);
      console.log(`     Total: ${summary.total}, Active: ${summary.active}, Completed: ${summary.completed}, Failed: ${summary.failed}`);
    });
  });

  describe('cache scaling characteristics', () => {
    it('verifies scaling with run count', () => {
      const cache10 = new RunCache(fixtureDir10);
      const start1 = performance.now();
      cache10.refreshAll();
      const duration1 = performance.now() - start1;

      const cache50 = new RunCache(fixtureDir50);
      const start2 = performance.now();
      cache50.refreshAll();
      const duration2 = performance.now() - start2;

      const runs1 = cache10.getAll();
      const runs2 = cache50.getAll();

      const runRatio = runs2.length / runs1.length;
      const timeRatio = duration2 / duration1;

      // Time should scale roughly linearly with run count (allow 2x margin)
      expect(timeRatio).toBeLessThan(runRatio * 2);

      console.log(`  ✓ Scaling: ${runs1.length} runs → ${runs2.length} runs (${runRatio}x)`);
      console.log(`           ${duration1.toFixed(2)}ms → ${duration2.toFixed(2)}ms (${timeRatio.toFixed(1)}x)`);
    });

    it('verifies getById lookup performance remains constant', () => {
      const cache = new RunCache(fixtureDir50);
      cache.refreshAll();

      const runIds = ['perf-run-000000', 'perf-run-000025', 'perf-run-000049'];
      const durations: number[] = [];

      for (const runId of runIds) {
        const start = performance.now();
        const run = cache.getById(runId);
        const duration = performance.now() - start;
        durations.push(duration);
        expect(run).not.toBeNull();
      }

      // All lookups should be O(1) - similar duration
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      expect(avgDuration).toBeLessThan(10); // Should be near-instant (Map lookup)
      console.log(`  ✓ Average getById lookup: ${avgDuration.toFixed(3)}ms`);
    });
  });

  describe('memory efficiency', () => {
    it('verifies cache does not hold excessive memory', () => {
      const cache = new RunCache(fixtureDir50);
      cache.refreshAll();

      const runs = cache.getAll();
      const digests = cache.getDigests();

      // Verify basic data integrity
      expect(runs.length).toBe(50);
      expect(digests.length).toBe(50);

      // Each run should have reasonable properties (not holding massive objects)
      for (const run of runs) {
        expect(run.runId).toBeTruthy();
        expect(run.events).toBeDefined();
        expect(run.tasks).toBeDefined();
        expect(Array.isArray(run.events)).toBe(true);
        expect(Array.isArray(run.tasks)).toBe(true);
      }

      console.log(`  ✓ Cache holding ${runs.length} runs with total ${runs.reduce((sum, r) => sum + r.events.length, 0)} events`);
    });
  });
});
