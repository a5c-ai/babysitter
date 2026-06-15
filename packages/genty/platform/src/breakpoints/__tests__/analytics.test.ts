import { describe, it, expect } from 'vitest';
import {
  BreakpointAnalytics,
  type BreakpointMetric,
} from '../analytics';

function makeMetric(overrides: Partial<BreakpointMetric> = {}): BreakpointMetric {
  return {
    breakpointId: 'bp-1',
    requestedAt: 1000,
    resolvedAt: 2000,
    durationMs: 1000,
    outcome: 'approved',
    ...overrides,
  };
}

describe('BreakpointAnalytics', () => {
  it('records metrics', () => {
    const analytics = new BreakpointAnalytics();
    analytics.record(makeMetric());
    analytics.record(makeMetric({ breakpointId: 'bp-2' }));

    expect(analytics.getMetrics()).toHaveLength(2);
  });

  // -----------------------------------------------------------------------
  // getSLACompliance
  // -----------------------------------------------------------------------

  describe('getSLACompliance', () => {
    it('returns 100% compliance when all within target', () => {
      const analytics = new BreakpointAnalytics();
      analytics.record(makeMetric({ durationMs: 500 }));
      analytics.record(makeMetric({ durationMs: 800 }));

      const result = analytics.getSLACompliance(1000);
      expect(result.complianceRate).toBe(1);
      expect(result.withinSLA).toBe(2);
      expect(result.totalBreakpoints).toBe(2);
    });

    it('returns partial compliance when some exceed target', () => {
      const analytics = new BreakpointAnalytics();
      analytics.record(makeMetric({ durationMs: 500 }));
      analytics.record(makeMetric({ durationMs: 1500 }));
      analytics.record(makeMetric({ durationMs: 800 }));
      analytics.record(makeMetric({ durationMs: 2000 }));

      const result = analytics.getSLACompliance(1000);
      expect(result.complianceRate).toBe(0.5);
      expect(result.withinSLA).toBe(2);
    });

    it('returns full compliance for empty metrics', () => {
      const analytics = new BreakpointAnalytics();
      const result = analytics.getSLACompliance(1000);
      expect(result.complianceRate).toBe(1);
      expect(result.totalBreakpoints).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // getAverageResponseTime
  // -----------------------------------------------------------------------

  describe('getAverageResponseTime', () => {
    it('computes average duration', () => {
      const analytics = new BreakpointAnalytics();
      analytics.record(makeMetric({ durationMs: 100 }));
      analytics.record(makeMetric({ durationMs: 200 }));
      analytics.record(makeMetric({ durationMs: 300 }));

      expect(analytics.getAverageResponseTime()).toBe(200);
    });

    it('returns 0 for empty metrics', () => {
      const analytics = new BreakpointAnalytics();
      expect(analytics.getAverageResponseTime()).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // getTimeoutRate
  // -----------------------------------------------------------------------

  describe('getTimeoutRate', () => {
    it('calculates timeout fraction', () => {
      const analytics = new BreakpointAnalytics();
      analytics.record(makeMetric({ outcome: 'approved' }));
      analytics.record(makeMetric({ outcome: 'timeout' }));
      analytics.record(makeMetric({ outcome: 'rejected' }));
      analytics.record(makeMetric({ outcome: 'timeout' }));

      expect(analytics.getTimeoutRate()).toBe(0.5);
    });

    it('returns 0 when no timeouts', () => {
      const analytics = new BreakpointAnalytics();
      analytics.record(makeMetric({ outcome: 'approved' }));
      analytics.record(makeMetric({ outcome: 'rejected' }));

      expect(analytics.getTimeoutRate()).toBe(0);
    });

    it('returns 0 for empty metrics', () => {
      const analytics = new BreakpointAnalytics();
      expect(analytics.getTimeoutRate()).toBe(0);
    });
  });
});
