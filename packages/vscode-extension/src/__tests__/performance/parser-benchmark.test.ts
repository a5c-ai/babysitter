import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as path from 'path';
import * as os from 'os';
import { parseRunDir, parseJournalDir, parseJournalDirIncremental } from '../../lib/parser';
import { createLargeFixture, cleanupFixture } from './__helpers__/fixture-generator';

describe('Parser Performance Benchmarks', () => {
  let fixtureDir: string;
  let runDirSmall: string;
  let runDirMedium: string;
  let runDirLarge: string;

  beforeAll(() => {
    // Create fixtures with varying sizes
    fixtureDir = createLargeFixture(os.tmpdir(), 3, 100, 20);
    const runsDir = path.join(fixtureDir, '.a5c', 'runs');

    // Create small run (10 events)
    const smallFixture = createLargeFixture(os.tmpdir(), 1, 10, 3);
    runDirSmall = path.join(smallFixture, '.a5c', 'runs', 'perf-run-000000');

    // Create medium run (50 events)
    const mediumFixture = createLargeFixture(os.tmpdir(), 1, 50, 10);
    runDirMedium = path.join(mediumFixture, '.a5c', 'runs', 'perf-run-000000');

    // Create large run (100 events)
    const largeFixture = createLargeFixture(os.tmpdir(), 1, 100, 20);
    runDirLarge = path.join(largeFixture, '.a5c', 'runs', 'perf-run-000000');
  });

  afterAll(() => {
    // Clean up all fixtures
    if (fixtureDir) {
      cleanupFixture(fixtureDir);
    }
    if (runDirSmall) {
      const baseDir = path.dirname(path.dirname(path.dirname(runDirSmall)));
      cleanupFixture(baseDir);
    }
    if (runDirMedium) {
      const baseDir = path.dirname(path.dirname(path.dirname(runDirMedium)));
      cleanupFixture(baseDir);
    }
    if (runDirLarge) {
      const baseDir = path.dirname(path.dirname(path.dirname(runDirLarge)));
      cleanupFixture(baseDir);
    }
  });

  describe('parseJournalDir', () => {
    it('benchmarks parsing 10 journal events', () => {
      const journalPath = path.join(runDirSmall, 'journal');
      const start = performance.now();
      const events = parseJournalDir(journalPath);
      const duration = performance.now() - start;

      expect(events.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(500); // 500ms for 10 events (generous)
      console.log(`  ✓ Parsed ${events.length} events in ${duration.toFixed(2)}ms`);
    });

    it('benchmarks parsing 50 journal events', () => {
      const journalPath = path.join(runDirMedium, 'journal');
      const start = performance.now();
      const events = parseJournalDir(journalPath);
      const duration = performance.now() - start;

      expect(events.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // 1s for 50 events (generous)
      console.log(`  ✓ Parsed ${events.length} events in ${duration.toFixed(2)}ms`);
    });

    it('benchmarks parsing 100 journal events', () => {
      const journalPath = path.join(runDirLarge, 'journal');
      const start = performance.now();
      const events = parseJournalDir(journalPath);
      const duration = performance.now() - start;

      expect(events.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(2000); // 2s for 100 events (generous for CI)
      console.log(`  ✓ Parsed ${events.length} events in ${duration.toFixed(2)}ms`);
    });
  });

  describe('parseJournalDirIncremental', () => {
    it('benchmarks incremental parsing with skipCount', () => {
      const journalPath = path.join(runDirLarge, 'journal');

      // First parse - get all events
      const start1 = performance.now();
      const result1 = parseJournalDirIncremental(journalPath, 0);
      const duration1 = performance.now() - start1;
      expect(result1.events.length).toBeGreaterThan(0);
      console.log(`  ✓ Initial parse: ${result1.events.length} events in ${duration1.toFixed(2)}ms`);

      // Second parse - skip most events
      const skipCount = Math.floor(result1.totalFileCount * 0.8);
      const start2 = performance.now();
      const result2 = parseJournalDirIncremental(journalPath, skipCount);
      const duration2 = performance.now() - start2;

      expect(result2.events.length).toBeLessThan(result1.events.length);
      expect(duration2).toBeLessThan(duration1); // Incremental should be faster
      console.log(
        `  ✓ Incremental parse: ${result2.events.length} new events (skipped ${skipCount}) in ${duration2.toFixed(2)}ms`,
      );
    });
  });

  describe('parseRunDir', () => {
    it('benchmarks parsing run with 10 events', () => {
      const start = performance.now();
      const run = parseRunDir(runDirSmall);
      const duration = performance.now() - start;

      expect(run).not.toBeNull();
      expect(run!.events.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(500); // 500ms
      console.log(`  ✓ Parsed run with ${run!.events.length} events, ${run!.tasks.length} tasks in ${duration.toFixed(2)}ms`);
    });

    it('benchmarks parsing run with 50 events', () => {
      const start = performance.now();
      const run = parseRunDir(runDirMedium);
      const duration = performance.now() - start;

      expect(run).not.toBeNull();
      expect(run!.events.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // 1s
      console.log(`  ✓ Parsed run with ${run!.events.length} events, ${run!.tasks.length} tasks in ${duration.toFixed(2)}ms`);
    });

    it('benchmarks parsing run with 100 events', () => {
      const start = performance.now();
      const run = parseRunDir(runDirLarge);
      const duration = performance.now() - start;

      expect(run).not.toBeNull();
      expect(run!.events.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(2000); // 2s for 100 events (generous for CI)
      console.log(`  ✓ Parsed run with ${run!.events.length} events, ${run!.tasks.length} tasks in ${duration.toFixed(2)}ms`);
    });

    it('benchmarks multiple sequential parseRunDir calls', () => {
      const iterations = 5;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        const run = parseRunDir(runDirMedium);
        expect(run).not.toBeNull();
      }

      const duration = performance.now() - start;
      const avgDuration = duration / iterations;

      expect(avgDuration).toBeLessThan(1000); // Average should be under 1s
      console.log(
        `  ✓ Parsed run ${iterations} times: total ${duration.toFixed(2)}ms, avg ${avgDuration.toFixed(2)}ms per parse`,
      );
    });
  });

  describe('Parser scaling characteristics', () => {
    it('verifies linear or sub-linear scaling with event count', () => {
      const start1 = performance.now();
      const run1 = parseRunDir(runDirSmall);
      const duration1 = performance.now() - start1;

      const start2 = performance.now();
      const run2 = parseRunDir(runDirLarge);
      const duration2 = performance.now() - start2;

      expect(run1).not.toBeNull();
      expect(run2).not.toBeNull();

      const eventRatio = run2!.events.length / run1!.events.length;
      const timeRatio = duration2 / duration1;

      // Time ratio should not grow faster than event ratio (sub-linear or linear scaling)
      // Allow 2x margin for variance
      expect(timeRatio).toBeLessThan(eventRatio * 2);

      console.log(
        `  ✓ Scaling: ${run1!.events.length} events → ${run2!.events.length} events (${eventRatio.toFixed(1)}x)`,
      );
      console.log(`           ${duration1.toFixed(2)}ms → ${duration2.toFixed(2)}ms (${timeRatio.toFixed(1)}x)`);
    });
  });
});
