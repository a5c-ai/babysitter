import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as path from 'path';
import * as os from 'os';
import { parseRunDir } from '../../lib/parser';
import { generateWebviewContent } from '../../panels/webview-content';
import { createLargeFixture, cleanupFixture } from './__helpers__/fixture-generator';

describe('Webview Generation Performance Benchmarks', () => {
  let fixtureSmall: string;
  let fixtureMedium: string;
  let fixtureLarge: string;
  let fixtureXLarge: string;

  beforeAll(() => {
    // Create fixtures with varying complexity
    // Small: 1 run, 10 events, 3 tasks
    fixtureSmall = createLargeFixture(os.tmpdir(), 1, 10, 3);
    // Medium: 1 run, 30 events, 10 tasks
    fixtureMedium = createLargeFixture(os.tmpdir(), 1, 30, 10);
    // Large: 1 run, 100 events, 25 tasks
    fixtureLarge = createLargeFixture(os.tmpdir(), 1, 100, 25);
    // XLarge: 1 run, 200 events, 50 tasks
    fixtureXLarge = createLargeFixture(os.tmpdir(), 1, 200, 50);
  });

  afterAll(() => {
    cleanupFixture(fixtureSmall);
    cleanupFixture(fixtureMedium);
    cleanupFixture(fixtureLarge);
    cleanupFixture(fixtureXLarge);
  });

  describe('generateWebviewContent', () => {
    it('benchmarks generation for small run (10 events, 3 tasks)', () => {
      const runDir = path.join(fixtureSmall, '.a5c', 'runs', 'perf-run-000000');
      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();

      const start = performance.now();
      const html = generateWebviewContent(run!, 'test-nonce', 'test-csp');
      const duration = performance.now() - start;

      expect(html).toBeTruthy();
      expect(html.length).toBeGreaterThan(1000);
      expect(duration).toBeLessThan(100); // 100ms for small run
      console.log(
        `  ✓ Generated webview for ${run!.events.length} events, ${run!.tasks.length} tasks in ${duration.toFixed(2)}ms (${html.length} bytes)`,
      );
    });

    it('benchmarks generation for medium run (30 events, 10 tasks)', () => {
      const runDir = path.join(fixtureMedium, '.a5c', 'runs', 'perf-run-000000');
      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();

      const start = performance.now();
      const html = generateWebviewContent(run!, 'test-nonce', 'test-csp');
      const duration = performance.now() - start;

      expect(html).toBeTruthy();
      expect(html.length).toBeGreaterThan(1000);
      expect(duration).toBeLessThan(200); // 200ms for medium run
      console.log(
        `  ✓ Generated webview for ${run!.events.length} events, ${run!.tasks.length} tasks in ${duration.toFixed(2)}ms (${html.length} bytes)`,
      );
    });

    it('benchmarks generation for large run (100 events, 25 tasks)', () => {
      const runDir = path.join(fixtureLarge, '.a5c', 'runs', 'perf-run-000000');
      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();

      const start = performance.now();
      const html = generateWebviewContent(run!, 'test-nonce', 'test-csp');
      const duration = performance.now() - start;

      expect(html).toBeTruthy();
      expect(html.length).toBeGreaterThan(1000);
      expect(duration).toBeLessThan(500); // 500ms for large run (generous for CI)
      console.log(
        `  ✓ Generated webview for ${run!.events.length} events, ${run!.tasks.length} tasks in ${duration.toFixed(2)}ms (${html.length} bytes)`,
      );
    });

    it('benchmarks generation for xlarge run (200 events, 50 tasks)', () => {
      const runDir = path.join(fixtureXLarge, '.a5c', 'runs', 'perf-run-000000');
      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();

      const start = performance.now();
      const html = generateWebviewContent(run!, 'test-nonce', 'test-csp');
      const duration = performance.now() - start;

      expect(html).toBeTruthy();
      expect(html.length).toBeGreaterThan(1000);
      expect(duration).toBeLessThan(1000); // 1s for xlarge run
      console.log(
        `  ✓ Generated webview for ${run!.events.length} events, ${run!.tasks.length} tasks in ${duration.toFixed(2)}ms (${html.length} bytes)`,
      );
    });
  });

  describe('HTML structure validation', () => {
    it('verifies generated HTML contains expected structure', () => {
      const runDir = path.join(fixtureMedium, '.a5c', 'runs', 'perf-run-000000');
      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();

      const html = generateWebviewContent(run!, 'test-nonce', 'test-csp');

      // Check for key structural elements
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('test-nonce');
      expect(html).toContain('test-csp');
      expect(html).toContain('top-banner');
      expect(html).toContain('pipeline-panel');
      expect(html).toContain('task-detail-panel');
      expect(html).toContain('event-stream-panel');
      expect(html).toContain('step-card');
      expect(html).toContain('event-card');

      console.log(`  ✓ HTML structure validated (${html.length} bytes)`);
    });

    it('verifies HTML escaping is applied', () => {
      const runDir = path.join(fixtureMedium, '.a5c', 'runs', 'perf-run-000000');
      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();

      const html = generateWebviewContent(run!, 'test-nonce', 'test-csp');

      // HTML should not contain raw < > & outside of tags
      // Check that data values are escaped (not perfect test, but catches obvious issues)
      const dataRegions = html.match(/data-effect-id="[^"]*"/g) || [];
      for (const region of dataRegions) {
        expect(region).not.toMatch(/[<>]/); // No raw angle brackets in data attributes
      }

      console.log(`  ✓ HTML escaping validated`);
    });
  });

  describe('memory and size characteristics', () => {
    it('verifies HTML size grows reasonably with content', () => {
      const runSmall = parseRunDir(path.join(fixtureSmall, '.a5c', 'runs', 'perf-run-000000'));
      const runLarge = parseRunDir(path.join(fixtureLarge, '.a5c', 'runs', 'perf-run-000000'));

      const htmlSmall = generateWebviewContent(runSmall!, 'nonce', 'csp');
      const htmlLarge = generateWebviewContent(runLarge!, 'nonce', 'csp');

      const eventRatio = runLarge!.events.length / runSmall!.events.length;
      const taskRatio = runLarge!.tasks.length / runSmall!.tasks.length;
      const sizeRatio = htmlLarge.length / htmlSmall.length;

      // Size growth should be reasonable (not exponential)
      // Allow generous margin since there's fixed overhead (CSS, JS, structure)
      const maxExpectedRatio = Math.max(eventRatio, taskRatio) * 2;
      expect(sizeRatio).toBeLessThan(maxExpectedRatio);

      console.log(`  ✓ Size scaling: ${runSmall!.events.length} → ${runLarge!.events.length} events (${eventRatio.toFixed(1)}x)`);
      console.log(`                 ${runSmall!.tasks.length} → ${runLarge!.tasks.length} tasks (${taskRatio.toFixed(1)}x)`);
      console.log(`                 ${htmlSmall.length} → ${htmlLarge.length} bytes (${sizeRatio.toFixed(1)}x)`);
    });

    it('verifies HTML does not grow unboundedly', () => {
      const runDir = path.join(fixtureXLarge, '.a5c', 'runs', 'perf-run-000000');
      const run = parseRunDir(runDir);
      const html = generateWebviewContent(run!, 'nonce', 'csp');

      // With 200 events and 50 tasks, HTML should still be reasonable (< 5MB)
      const sizeInMB = html.length / (1024 * 1024);
      expect(sizeInMB).toBeLessThan(5);

      console.log(`  ✓ XLarge run HTML size: ${sizeInMB.toFixed(2)}MB (200 events, 50 tasks)`);
    });
  });

  describe('multiple generation calls', () => {
    it('benchmarks multiple sequential webview generations', () => {
      const runDir = path.join(fixtureMedium, '.a5c', 'runs', 'perf-run-000000');
      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();

      const iterations = 10;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        const html = generateWebviewContent(run!, `nonce-${i}`, 'csp');
        expect(html).toBeTruthy();
      }

      const duration = performance.now() - start;
      const avgDuration = duration / iterations;

      expect(avgDuration).toBeLessThan(200); // Average under 200ms
      console.log(
        `  ✓ Generated ${iterations} webviews: total ${duration.toFixed(2)}ms, avg ${avgDuration.toFixed(2)}ms`,
      );
    });
  });

  describe('generation scaling characteristics', () => {
    it('verifies generation time scales linearly with content', () => {
      const runSmall = parseRunDir(path.join(fixtureSmall, '.a5c', 'runs', 'perf-run-000000'));
      const runLarge = parseRunDir(path.join(fixtureLarge, '.a5c', 'runs', 'perf-run-000000'));

      const start1 = performance.now();
      const html1 = generateWebviewContent(runSmall!, 'nonce', 'csp');
      const duration1 = performance.now() - start1;

      const start2 = performance.now();
      const html2 = generateWebviewContent(runLarge!, 'nonce', 'csp');
      const duration2 = performance.now() - start2;

      expect(html1).toBeTruthy();
      expect(html2).toBeTruthy();

      const contentRatio = Math.max(
        runLarge!.events.length / runSmall!.events.length,
        runLarge!.tasks.length / runSmall!.tasks.length,
      );
      const timeRatio = duration2 / duration1;

      // Time should scale roughly linearly or sub-linearly (allow 2x margin)
      expect(timeRatio).toBeLessThan(contentRatio * 2);

      console.log(
        `  ✓ Scaling: ${runSmall!.events.length}e/${runSmall!.tasks.length}t → ${runLarge!.events.length}e/${runLarge!.tasks.length}t (${contentRatio.toFixed(1)}x)`,
      );
      console.log(`           ${duration1.toFixed(2)}ms → ${duration2.toFixed(2)}ms (${timeRatio.toFixed(1)}x)`);
    });
  });
});
