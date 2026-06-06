import { describe, it, expect } from 'vitest';
import {
  stratumToCacheControl,
  composeWithCacheHints,
  shouldApplyCacheControl,
  tagPart,
} from '../strata';
import type { PromptContext, PromptStratum } from '../types';

function makeCtx(): PromptContext {
  return {
    harness: 'pi', harnessLabel: 'PI', interactive: false,
    capabilities: [], platform: 'linux', pluginRootVar: '',
    loopControlTerm: 'loop-driver', sessionBindingFlags: '',
    hookDriven: false, interactiveToolName: '', sessionEnvVars: '',
    resumeFlags: '', sdkVersionExpr: '', hasIntentFidelityChecks: false,
    hasNonNegotiables: false, cliSetupSnippet: '', iterateFlags: '',
  };
}

describe('GAP-PERF-001: Cache control hint generation', () => {
  describe('stratumToCacheControl', () => {
    it('maps stable to ephemeral', () => {
      expect(stratumToCacheControl('stable')).toBe('ephemeral');
    });

    it('maps runtime to ephemeral', () => {
      expect(stratumToCacheControl('runtime')).toBe('ephemeral');
    });

    it('maps turnLocal to undefined (no caching)', () => {
      expect(stratumToCacheControl('turnLocal')).toBeUndefined();
    });
  });

  describe('composeWithCacheHints', () => {
    it('produces cache_control on stable and runtime blocks', () => {
      const parts = [
        tagPart('stable-part', 'stable', () => 'Stable content', 5),
        tagPart('runtime-part', 'runtime', () => 'Runtime content', 30),
        tagPart('local-part', 'turnLocal', () => 'Local content', 70),
      ];
      const blocks = composeWithCacheHints(parts, makeCtx());
      expect(blocks).toHaveLength(3);
      expect(blocks[0].stratum).toBe('stable');
      expect(blocks[0].cache_control).toEqual({ type: 'ephemeral' });
      expect(blocks[1].stratum).toBe('runtime');
      expect(blocks[1].cache_control).toEqual({ type: 'ephemeral' });
      expect(blocks[2].stratum).toBe('turnLocal');
      expect(blocks[2].cache_control).toBeUndefined();
    });

    it('skips empty parts', () => {
      const parts = [
        tagPart('empty', 'stable', () => '', 5),
        tagPart('present', 'runtime', () => 'content', 30),
      ];
      const blocks = composeWithCacheHints(parts, makeCtx());
      expect(blocks).toHaveLength(1);
      expect(blocks[0].stratum).toBe('runtime');
    });
  });

  describe('shouldApplyCacheControl', () => {
    it('returns true when checksums match (cache valid)', () => {
      const checksums = { stable: 'abc', runtime: 'def' };
      expect(shouldApplyCacheControl(checksums, checksums, 'stable')).toBe(true);
    });

    it('returns false when checksums differ (cache busted)', () => {
      const prev = { stable: 'abc' };
      const next = { stable: 'xyz' };
      expect(shouldApplyCacheControl(prev, next, 'stable')).toBe(false);
    });

    it('returns true when no previous checksums (first run)', () => {
      const next = { stable: 'abc' };
      expect(shouldApplyCacheControl(undefined, next, 'stable')).toBe(true);
    });
  });
});
