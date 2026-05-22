import { describe, it, expect } from 'vitest';
import { createPromptContextFromCatalog } from '../context';
import {
  tagPart,
  PART_STRATA_MAP,
  STRATUM_ORDER,
  getPartsForStratum,
  composeByStrata,
  composeByStrataWithMeta,
  detectStratumChanges,
} from '../strata';
import type { PromptStratum, StratumTaggedPart, ComposeByStrataOptions, StratumChecksums } from '../types';

const mockCtx = createPromptContextFromCatalog('claude-code');

describe('GAP-PROMPT-001: Prompt Strata Model', () => {
  describe('PromptStratum type', () => {
    it('STRATUM_ORDER contains all three strata in correct order', () => {
      expect(STRATUM_ORDER).toEqual(['stable', 'runtime', 'turnLocal']);
    });
  });

  describe('tagPart', () => {
    it('creates a StratumTaggedPart from a PromptPart', () => {
      const part = tagPart('testPart', 'stable', () => 'hello');
      expect(part.name).toBe('testPart');
      expect(part.stratum).toBe('stable');
      expect(part.render(mockCtx)).toBe('hello');
    });

    it('preserves the render function behavior', () => {
      const render = (ctx: { harness: string }) => `harness: ${ctx.harness}`;
      const part = tagPart('dynamic', 'runtime', render);
      expect(part.render(mockCtx)).toBe('harness: claude-code');
    });

    it('stores explicit volatilityScore', () => {
      const part = tagPart('scored', 'stable', () => '', 15);
      expect(part.volatilityScore).toBe(15);
    });

    it('stores undefined volatilityScore when not provided', () => {
      const part = tagPart('unscored', 'stable', () => '');
      expect(part.volatilityScore).toBeUndefined();
    });
  });

  describe('PART_STRATA_MAP', () => {
    it('contains all 29 known parts', () => {
      const expectedParts = [
        'renderNonNegotiables', 'renderCriticalRules', 'renderTaskKinds',
        'renderTaskExamples', 'renderProcessGuidelines', 'renderSeeAlso',
        'renderCompletionProof', 'renderCodingPhilosophy', 'renderToolPreferences',
        'renderOutputEfficiency', 'renderGitSafety', 'renderDependencies',
        'renderQuickReference', 'renderRecovery', 'renderLoopControl',
        'renderRunCreation', 'renderIteration', 'renderEffects',
        'renderBreakpointHandling', 'renderResultsPosting',
        'renderRunOverlapDetection', 'renderParallelPhaseDetection',
        'renderParallelDispatch',
        'renderInterview', 'renderUserProfile', 'renderProcessCreation',
        'renderIntentFidelityChecks', 'renderProjectInstructions',
        'renderContinuityOverlay',
      ];
      for (const name of expectedParts) {
        expect(PART_STRATA_MAP).toHaveProperty(name);
      }
    });

    it('classifies stable parts correctly', () => {
      const stableNames = [
        'renderNonNegotiables', 'renderCriticalRules', 'renderTaskKinds',
        'renderTaskExamples', 'renderProcessGuidelines', 'renderSeeAlso',
        'renderCompletionProof', 'renderCodingPhilosophy', 'renderToolPreferences',
        'renderOutputEfficiency', 'renderGitSafety',
      ];
      for (const name of stableNames) {
        expect(PART_STRATA_MAP[name].stratum).toBe('stable');
      }
    });

    it('classifies runtime parts correctly', () => {
      const runtimeNames = [
        'renderDependencies', 'renderQuickReference', 'renderRecovery',
        'renderLoopControl', 'renderRunCreation', 'renderIteration',
        'renderEffects', 'renderBreakpointHandling', 'renderResultsPosting',
        'renderRunOverlapDetection', 'renderParallelPhaseDetection',
        'renderParallelDispatch',
      ];
      for (const name of runtimeNames) {
        expect(PART_STRATA_MAP[name].stratum).toBe('runtime');
      }
    });

    it('classifies turnLocal parts correctly', () => {
      const turnLocalNames = [
        'renderInterview', 'renderUserProfile', 'renderProcessCreation',
        'renderIntentFidelityChecks', 'renderProjectInstructions',
        'renderContinuityOverlay',
      ];
      for (const name of turnLocalNames) {
        expect(PART_STRATA_MAP[name].stratum).toBe('turnLocal');
      }
    });

    it('every entry has a render function', () => {
      for (const [_name, part] of Object.entries(PART_STRATA_MAP)) {
        expect(typeof part.render).toBe('function');
      }
    });

    it('every entry has a volatilityScore defined', () => {
      for (const [_name, part] of Object.entries(PART_STRATA_MAP)) {
        expect(typeof part.volatilityScore).toBe('number');
      }
    });

    it('renderContinuityOverlay has volatilityScore 90', () => {
      expect(PART_STRATA_MAP.renderContinuityOverlay.volatilityScore).toBe(90);
    });

    it('renderCriticalRules has lower volatilityScore than renderProjectInstructions', () => {
      expect(PART_STRATA_MAP.renderCriticalRules.volatilityScore!)
        .toBeLessThan(PART_STRATA_MAP.renderProjectInstructions.volatilityScore!);
    });
  });

  describe('getPartsForStratum', () => {
    it('returns only stable parts when stratum is stable', () => {
      const parts = getPartsForStratum('stable');
      expect(parts.length).toBe(13);
      expect(parts.every(p => p.stratum === 'stable')).toBe(true);
    });

    it('returns only runtime parts when stratum is runtime', () => {
      const parts = getPartsForStratum('runtime');
      expect(parts.length).toBe(12);
      expect(parts.every(p => p.stratum === 'runtime')).toBe(true);
    });

    it('returns only turnLocal parts when stratum is turnLocal', () => {
      const parts = getPartsForStratum('turnLocal');
      expect(parts.length).toBe(6);
      expect(parts.every(p => p.stratum === 'turnLocal')).toBe(true);
    });
  });

  describe('composeByStrata', () => {
    it('groups parts by stratum in correct order: stable -> runtime -> turnLocal', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('t1', 'turnLocal', () => 'TURN'),
        tagPart('r1', 'runtime', () => 'RUNTIME'),
        tagPart('s1', 'stable', () => 'STABLE'),
      ];
      const result = composeByStrata(parts, mockCtx);
      const stableIdx = result.indexOf('STABLE');
      const runtimeIdx = result.indexOf('RUNTIME');
      const turnIdx = result.indexOf('TURN');
      expect(stableIdx).toBeLessThan(runtimeIdx);
      expect(runtimeIdx).toBeLessThan(turnIdx);
    });

    it('inserts stratum boundary markers between groups', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('s1', 'stable', () => 'STABLE'),
        tagPart('r1', 'runtime', () => 'RUNTIME'),
      ];
      const result = composeByStrata(parts, mockCtx);
      // Should have some separator between the stable and runtime sections
      expect(result).toContain('STABLE');
      expect(result).toContain('RUNTIME');
      // There should be a boundary/separator between them
      const stableEnd = result.indexOf('STABLE') + 'STABLE'.length;
      const runtimeStart = result.indexOf('RUNTIME');
      const between = result.slice(stableEnd, runtimeStart);
      expect(between.trim().length).toBeGreaterThan(0);
    });

    it('skips empty parts', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('s1', 'stable', () => 'STABLE'),
        tagPart('s2', 'stable', () => ''),
        tagPart('r1', 'runtime', () => 'RUNTIME'),
      ];
      const result = composeByStrata(parts, mockCtx);
      expect(result).toContain('STABLE');
      expect(result).toContain('RUNTIME');
    });

    it('skips entire stratum group if all parts are empty', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('s1', 'stable', () => 'STABLE'),
        tagPart('r1', 'runtime', () => ''),
        tagPart('t1', 'turnLocal', () => 'TURN'),
      ];
      const result = composeByStrata(parts, mockCtx);
      expect(result).toContain('STABLE');
      expect(result).toContain('TURN');
      // Should not have a runtime boundary marker if runtime is empty
    });

    it('returns empty string when all parts produce empty output', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('s1', 'stable', () => ''),
        tagPart('r1', 'runtime', () => ''),
      ];
      const result = composeByStrata(parts, mockCtx);
      expect(result.trim()).toBe('');
    });

    it('uses custom separator when provided', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('s1', 'stable', () => 'STABLE'),
        tagPart('r1', 'runtime', () => 'RUNTIME'),
      ];
      const result = composeByStrata(parts, mockCtx, { separator: '\n===\n' });
      expect(result).toContain('===');
    });

    it('sorts parts within stratum by volatilityScore ascending', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('high', 'stable', () => 'HIGH', 80),
        tagPart('low', 'stable', () => 'LOW', 5),
        tagPart('mid', 'stable', () => 'MID', 50),
      ];
      const result = composeByStrata(parts, mockCtx);
      const lowIdx = result.indexOf('LOW');
      const midIdx = result.indexOf('MID');
      const highIdx = result.indexOf('HIGH');
      expect(lowIdx).toBeLessThan(midIdx);
      expect(midIdx).toBeLessThan(highIdx);
    });

    it('preserves insertion order for equal volatilityScores (stable sort)', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('first', 'stable', () => 'FIRST', 50),
        tagPart('second', 'stable', () => 'SECOND', 50),
        tagPart('third', 'stable', () => 'THIRD', 50),
      ];
      const result = composeByStrata(parts, mockCtx);
      const firstIdx = result.indexOf('FIRST');
      const secondIdx = result.indexOf('SECOND');
      const thirdIdx = result.indexOf('THIRD');
      expect(firstIdx).toBeLessThan(secondIdx);
      expect(secondIdx).toBeLessThan(thirdIdx);
    });

    it('does not reorder when sortByVolatility is false', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('high', 'stable', () => 'HIGH', 80),
        tagPart('low', 'stable', () => 'LOW', 5),
      ];
      const result = composeByStrata(parts, mockCtx, { sortByVolatility: false });
      const highIdx = result.indexOf('HIGH');
      const lowIdx = result.indexOf('LOW');
      expect(highIdx).toBeLessThan(lowIdx);
    });

    it('defaults volatilityScore to 50 for unsorted parts', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('unscored', 'stable', () => 'UNSCORED'),
        tagPart('scored-low', 'stable', () => 'LOW', 10),
      ];
      const result = composeByStrata(parts, mockCtx);
      const lowIdx = result.indexOf('LOW');
      const unscoredIdx = result.indexOf('UNSCORED');
      expect(lowIdx).toBeLessThan(unscoredIdx);
    });
  });

  describe('showStrata mode', () => {
    it('adds stratum labels when showStrata is true', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('s1', 'stable', () => 'STABLE_CONTENT'),
        tagPart('r1', 'runtime', () => 'RUNTIME_CONTENT'),
        tagPart('t1', 'turnLocal', () => 'TURN_CONTENT'),
      ];
      const result = composeByStrata(parts, mockCtx, { showStrata: true });
      // Should contain stratum header labels
      expect(result).toMatch(/\[stratum:\s*stable\]/i);
      expect(result).toMatch(/\[stratum:\s*runtime\]/i);
      expect(result).toMatch(/\[stratum:\s*turnLocal\]/i);
    });

    it('does not add stratum labels when showStrata is false', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('s1', 'stable', () => 'STABLE_CONTENT'),
        tagPart('r1', 'runtime', () => 'RUNTIME_CONTENT'),
      ];
      const result = composeByStrata(parts, mockCtx, { showStrata: false });
      expect(result).not.toMatch(/\[stratum:/i);
    });

    it('does not add stratum labels by default', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('s1', 'stable', () => 'STABLE_CONTENT'),
      ];
      const result = composeByStrata(parts, mockCtx);
      expect(result).not.toMatch(/\[stratum:/i);
    });

    it('adds part name annotations in showStrata mode', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('myPart', 'stable', () => 'content'),
      ];
      const result = composeByStrata(parts, mockCtx, { showStrata: true });
      expect(result).toContain('myPart');
    });

    it('includes volatilityScore in showStrata annotations', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('myPart', 'stable', () => 'content', 15),
      ];
      const result = composeByStrata(parts, mockCtx, { showStrata: true });
      expect(result).toContain('vol:15');
    });
  });

  describe('backward compatibility', () => {
    it('composing with all PART_STRATA_MAP parts produces non-empty output', () => {
      const allParts = Object.values(PART_STRATA_MAP);
      const result = composeByStrata(allParts, mockCtx);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

describe('GAP-PERF-005: Cache-Aware Prompt Assembly', () => {
  describe('composeByStrataWithMeta', () => {
    it('returns same output as composeByStrata for identical inputs', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('s1', 'stable', () => 'STABLE', 10),
        tagPart('r1', 'runtime', () => 'RUNTIME', 30),
        tagPart('t1', 'turnLocal', () => 'TURN', 60),
      ];
      const plain = composeByStrata(parts, mockCtx);
      const withMeta = composeByStrataWithMeta(parts, mockCtx);
      expect(withMeta.output).toBe(plain);
    });

    it('returns stratum checksums as 64-char hex strings', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('s1', 'stable', () => 'STABLE', 10),
      ];
      const result = composeByStrataWithMeta(parts, mockCtx);
      expect(result.stratumChecksums.stable).toBeDefined();
      expect(result.stratumChecksums.stable).toMatch(/^[0-9a-f]{64}$/);
    });

    it('omits checksum for stratum with no rendered content', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('s1', 'stable', () => 'STABLE', 10),
      ];
      const result = composeByStrataWithMeta(parts, mockCtx);
      expect(result.stratumChecksums.runtime).toBeUndefined();
      expect(result.stratumChecksums.turnLocal).toBeUndefined();
    });

    it('produces deterministic checksums for same inputs', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('s1', 'stable', () => 'STABLE', 10),
        tagPart('r1', 'runtime', () => 'RUNTIME', 30),
      ];
      const result1 = composeByStrataWithMeta(parts, mockCtx);
      const result2 = composeByStrataWithMeta(parts, mockCtx);
      expect(result1.stratumChecksums).toEqual(result2.stratumChecksums);
    });

    it('produces different checksums for different contexts', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('dynamic', 'runtime', (ctx) => `harness: ${ctx.harness}`, 30),
      ];
      const ccCtx = createPromptContextFromCatalog('claude-code');
      const codexCtx = createPromptContextFromCatalog('codex');
      const result1 = composeByStrataWithMeta(parts, ccCtx);
      const result2 = composeByStrataWithMeta(parts, codexCtx);
      expect(result1.stratumChecksums.runtime).not.toBe(result2.stratumChecksums.runtime);
    });

    it('includes volatilityScore in showStrata annotations', () => {
      const parts: StratumTaggedPart[] = [
        tagPart('scored', 'stable', () => 'content', 25),
      ];
      const result = composeByStrataWithMeta(parts, mockCtx, { showStrata: true });
      expect(result.output).toContain('vol:25');
    });
  });

  describe('detectStratumChanges', () => {
    it('returns empty array when checksums are identical', () => {
      const checksums: StratumChecksums = { stable: 'abc', runtime: 'def' };
      expect(detectStratumChanges(checksums, checksums)).toEqual([]);
    });

    it('returns only changed strata', () => {
      const prev: StratumChecksums = { stable: 'abc', runtime: 'def' };
      const next: StratumChecksums = { stable: 'abc', runtime: 'xyz' };
      expect(detectStratumChanges(prev, next)).toEqual(['runtime']);
    });

    it('returns all three strata when all differ', () => {
      const prev: StratumChecksums = { stable: 'a', runtime: 'b', turnLocal: 'c' };
      const next: StratumChecksums = { stable: 'x', runtime: 'y', turnLocal: 'z' };
      expect(detectStratumChanges(prev, next)).toEqual(['stable', 'runtime', 'turnLocal']);
    });

    it('treats newly added stratum as changed', () => {
      const prev: StratumChecksums = { stable: 'a' };
      const next: StratumChecksums = { stable: 'a', runtime: 'new' };
      expect(detectStratumChanges(prev, next)).toEqual(['runtime']);
    });

    it('treats removed stratum as changed', () => {
      const prev: StratumChecksums = { stable: 'a', runtime: 'b' };
      const next: StratumChecksums = { stable: 'a' };
      expect(detectStratumChanges(prev, next)).toEqual(['runtime']);
    });

    it('handles both empty checksums as no changes', () => {
      expect(detectStratumChanges({}, {})).toEqual([]);
    });
  });
});
