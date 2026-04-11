import { describe, it, expect } from 'vitest';
import { createClaudeCodeContext } from '../context';
import {
  tagPart,
  PART_STRATA_MAP,
  STRATUM_ORDER,
  getPartsForStratum,
  composeByStrata,
} from '../strata';
import type { PromptStratum, StratumTaggedPart, ComposeByStrataOptions } from '../types';

const mockCtx = createClaudeCodeContext();

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
  });

  describe('PART_STRATA_MAP', () => {
    it('contains all 23 known parts', () => {
      const expectedParts = [
        'renderNonNegotiables', 'renderCriticalRules', 'renderTaskKinds',
        'renderTaskExamples', 'renderProcessGuidelines', 'renderSeeAlso',
        'renderCompletionProof', 'renderDependencies', 'renderQuickReference',
        'renderRecovery', 'renderLoopControl', 'renderRunCreation',
        'renderIteration', 'renderEffects', 'renderBreakpointHandling',
        'renderResultsPosting', 'renderRunOverlapDetection',
        'renderParallelPhaseDetection', 'renderInterview', 'renderUserProfile',
        'renderProcessCreation', 'renderIntentFidelityChecks',
        'renderProjectInstructions',
      ];
      for (const name of expectedParts) {
        expect(PART_STRATA_MAP).toHaveProperty(name);
      }
    });

    it('classifies stable parts correctly', () => {
      const stableNames = [
        'renderNonNegotiables', 'renderCriticalRules', 'renderTaskKinds',
        'renderTaskExamples', 'renderProcessGuidelines', 'renderSeeAlso',
        'renderCompletionProof',
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
      ];
      for (const name of runtimeNames) {
        expect(PART_STRATA_MAP[name].stratum).toBe('runtime');
      }
    });

    it('classifies turnLocal parts correctly', () => {
      const turnLocalNames = [
        'renderInterview', 'renderUserProfile', 'renderProcessCreation',
        'renderIntentFidelityChecks', 'renderProjectInstructions',
      ];
      for (const name of turnLocalNames) {
        expect(PART_STRATA_MAP[name].stratum).toBe('turnLocal');
      }
    });

    it('every entry has a render function', () => {
      for (const [name, part] of Object.entries(PART_STRATA_MAP)) {
        expect(typeof part.render).toBe('function');
      }
    });
  });

  describe('getPartsForStratum', () => {
    it('returns only stable parts when stratum is stable', () => {
      const parts = getPartsForStratum('stable');
      expect(parts.length).toBe(7);
      expect(parts.every(p => p.stratum === 'stable')).toBe(true);
    });

    it('returns only runtime parts when stratum is runtime', () => {
      const parts = getPartsForStratum('runtime');
      expect(parts.length).toBe(12);
      expect(parts.every(p => p.stratum === 'runtime')).toBe(true);
    });

    it('returns only turnLocal parts when stratum is turnLocal', () => {
      const parts = getPartsForStratum('turnLocal');
      expect(parts.length).toBe(5);
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
  });

  describe('backward compatibility', () => {
    it('composing with all PART_STRATA_MAP parts produces non-empty output', () => {
      const allParts = Object.values(PART_STRATA_MAP);
      const result = composeByStrata(allParts, mockCtx);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
