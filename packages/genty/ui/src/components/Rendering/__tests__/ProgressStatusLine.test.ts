import { describe, expect, it } from 'vitest';
import {
  formatProgressBar,
  formatStatusLine,
} from '../ProgressStatusLine.js';
import type { ProgressData } from '../ProgressStatusLine.js';

describe('ProgressStatusLine', () => {
  describe('formatProgressBar', () => {
    it('renders a full bar at 100%', () => {
      const data: ProgressData = { current: 10, total: 10, label: 'Done', startedAt: 0 };
      const bar = formatProgressBar(data, 10);
      expect(bar).toBe('[██████████] 100%');
    });

    it('renders an empty bar at 0%', () => {
      const data: ProgressData = { current: 0, total: 10, label: 'Starting', startedAt: 0 };
      const bar = formatProgressBar(data, 10);
      expect(bar).toBe('[░░░░░░░░░░] 0%');
    });

    it('renders a half-full bar at 50%', () => {
      const data: ProgressData = { current: 5, total: 10, label: 'Halfway', startedAt: 0 };
      const bar = formatProgressBar(data, 10);
      expect(bar).toBe('[█████░░░░░] 50%');
    });

    it('clamps values above 100%', () => {
      const data: ProgressData = { current: 15, total: 10, label: 'Over', startedAt: 0 };
      const bar = formatProgressBar(data, 10);
      expect(bar).toBe('[██████████] 100%');
    });

    it('handles total of 0 gracefully', () => {
      const data: ProgressData = { current: 0, total: 0, label: 'Empty', startedAt: 0 };
      const bar = formatProgressBar(data, 10);
      expect(bar).toContain('[');
      expect(bar).toContain(']');
      // Should not throw
    });

    it('uses default width of 20 if not specified', () => {
      const data: ProgressData = { current: 5, total: 10, label: 'Test', startedAt: 0 };
      const bar = formatProgressBar(data);
      // 20 chars inside brackets + brackets + space + percent
      const match = bar.match(/\[([█░]+)\]/);
      expect(match).not.toBeNull();
      expect(match![1]).toHaveLength(20);
    });
  });

  describe('formatStatusLine', () => {
    it('renders step counter, label, bar, and remaining time', () => {
      const now = 10_000;
      const data: ProgressData = {
        current: 3,
        total: 10,
        label: 'Building tests...',
        startedAt: 0,
        estimatedCompletion: 30_000,
      };
      const line = formatStatusLine(data, now);
      expect(line).toContain('Step 3/10');
      expect(line).toContain('Building tests...');
      expect(line).toContain('30%');
      expect(line).toContain('remaining');
    });

    it('omits remaining time when not estimable', () => {
      const data: ProgressData = {
        current: 0,
        total: 5,
        label: 'Waiting',
        startedAt: Date.now(),
      };
      const line = formatStatusLine(data);
      expect(line).toContain('Step 0/5');
      expect(line).not.toContain('remaining');
    });

    it('shows "any moment" when estimated completion is in the past', () => {
      const now = 50_000;
      const data: ProgressData = {
        current: 9,
        total: 10,
        label: 'Almost done',
        startedAt: 0,
        estimatedCompletion: 40_000,
      };
      const line = formatStatusLine(data, now);
      expect(line).toContain('any moment');
    });
  });
});
