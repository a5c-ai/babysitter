import { describe, it, expect } from 'vitest';
import {
  CAPABILITY_PROCESS_MAP,
  processPathsForCapabilities,
  renderCapabilityProcessGuide,
} from '../capabilityProcessMap';
import type { ContextCapabilityFlags } from '../contextDetect';

describe('CAPABILITY_PROCESS_MAP', () => {
  it('has at least one process per flag', () => {
    for (const [flag, paths] of Object.entries(CAPABILITY_PROCESS_MAP)) {
      expect(paths.length, `${flag} should have ≥1 process`).toBeGreaterThan(0);
    }
  });

  it('covers every field in ContextCapabilityFlags', () => {
    const expectedFlags: (keyof ContextCapabilityFlags)[] = [
      'hasPrPolicies',
      'hasBranchPolicies',
      'hasIssueLinking',
      'hasDraftPrProhibition',
      'hasLabelTaxonomy',
      'hasSingleChannelRule',
      'hasSourceQuoteCap',
      'hasHandoffConventions',
      'hasIdempotencyAndAbort',
      'hasIssueOnlyNoDirectCommits',
      'hasPrCommentFormat',
      'hasSixDimensionReview',
      'hasScheduledReportFormat',
      'hasLocalDevRelax',
    ];
    for (const flag of expectedFlags) {
      expect(CAPABILITY_PROCESS_MAP).toHaveProperty(flag);
    }
  });
});

describe('processPathsForCapabilities', () => {
  it('returns empty when no flags active', () => {
    expect(processPathsForCapabilities({})).toEqual([]);
  });

  it('returns paths for active flags only', () => {
    const paths = processPathsForCapabilities({
      hasPrPolicies: true,
      hasBranchPolicies: false,
      hasLabelTaxonomy: true,
    });
    expect(paths.some((p) => p.includes('pr-lifecycle-router'))).toBe(true);
    expect(paths.some((p) => p.includes('label-taxonomy'))).toBe(true);
    expect(paths.some((p) => p.includes('branch-policies'))).toBe(false);
  });

  it('deduplicates paths when multiple flags point to the same process', () => {
    const paths = processPathsForCapabilities({
      hasPrCommentFormat: true,
      hasSixDimensionReview: true,
    });
    const unique = new Set(paths);
    expect(paths.length).toBe(unique.size);
  });
});

describe('renderCapabilityProcessGuide', () => {
  it('renders empty string when no flags active', () => {
    expect(renderCapabilityProcessGuide({})).toBe('');
  });

  it('renders markdown header + bullet per active flag', () => {
    const md = renderCapabilityProcessGuide({
      hasPrPolicies: true,
      hasLocalDevRelax: true,
    });
    expect(md).toContain('## Library Processes for Active Capabilities');
    expect(md).toContain('`hasPrPolicies`');
    expect(md).toContain('pr-lifecycle-router');
    expect(md).toContain('`hasLocalDevRelax`');
    expect(md).toContain('local-dev-workflow');
  });
});
