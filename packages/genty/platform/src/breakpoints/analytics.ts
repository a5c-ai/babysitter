/**
 * Breakpoint Analytics and SLA Tracking (GAP-BRK-003).
 *
 * Tracks breakpoint resolution metrics — response times, timeout rates,
 * and SLA compliance. Pure in-memory analytics, no I/O.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BreakpointOutcome = 'approved' | 'rejected' | 'timeout';

export interface BreakpointMetric {
  breakpointId: string;
  requestedAt: number;
  resolvedAt: number;
  durationMs: number;
  outcome: BreakpointOutcome;
}

export interface SLAComplianceResult {
  totalBreakpoints: number;
  withinSLA: number;
  complianceRate: number;
  targetMs: number;
}

// ---------------------------------------------------------------------------
// BreakpointAnalytics
// ---------------------------------------------------------------------------

export class BreakpointAnalytics {
  private metrics: BreakpointMetric[] = [];

  /**
   * Record a breakpoint resolution metric.
   */
  record(metric: BreakpointMetric): void {
    this.metrics.push(metric);
  }

  /**
   * Calculate SLA compliance against a target response time.
   */
  getSLACompliance(targetMs: number): SLAComplianceResult {
    const total = this.metrics.length;
    if (total === 0) {
      return { totalBreakpoints: 0, withinSLA: 0, complianceRate: 1, targetMs };
    }

    const withinSLA = this.metrics.filter((m) => m.durationMs <= targetMs).length;
    return {
      totalBreakpoints: total,
      withinSLA,
      complianceRate: withinSLA / total,
      targetMs,
    };
  }

  /**
   * Get the average response time across all recorded breakpoints.
   * Returns 0 if no metrics have been recorded.
   */
  getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.durationMs, 0);
    return total / this.metrics.length;
  }

  /**
   * Get the timeout rate (fraction of breakpoints that timed out).
   * Returns 0 if no metrics have been recorded.
   */
  getTimeoutRate(): number {
    if (this.metrics.length === 0) return 0;
    const timeouts = this.metrics.filter((m) => m.outcome === 'timeout').length;
    return timeouts / this.metrics.length;
  }

  /**
   * Get all recorded metrics.
   */
  getMetrics(): readonly BreakpointMetric[] {
    return this.metrics;
  }
}
