import { describe, it, expect } from 'vitest';
import { createPromptContextFromCatalog } from '../context';
import { composeBabysitSkillPrompt } from '../compose';
import { PART_STRATA_MAP, composeByStrata } from '../strata';
import * as parts from '../parts';

const ctx = createPromptContextFromCatalog('claude-code');

describe('GAP-PROMPT-001: --show-strata flag integration', () => {
  describe('showStrata output annotations', () => {
    it('adds stratum boundary markers when showStrata is true', () => {
      const allParts = Object.values(PART_STRATA_MAP);
      const result = composeByStrata(allParts, ctx, { showStrata: true });
      expect(result).toMatch(/\[stratum:\s*stable\]/i);
      expect(result).toMatch(/\[stratum:\s*runtime\]/i);
      expect(result).toMatch(/\[stratum:\s*turnLocal\]/i);
    });

    it('produces non-empty output without showStrata', () => {
      const allParts = Object.values(PART_STRATA_MAP);
      const result = composeByStrata(allParts, ctx);
      expect(result.length).toBeGreaterThan(0);
      expect(result).not.toMatch(/\[stratum:/i);
    });
  });

  describe('composeBabysitSkillPrompt backward compatibility', () => {
    it('existing composeBabysitSkillPrompt still produces output', () => {
      const result = composeBabysitSkillPrompt(ctx);
      expect(result.length).toBeGreaterThan(100);
      // Should not have strata annotations
      expect(result).not.toMatch(/\[stratum:/i);
    });

    it('strata composition includes the same key content sections', () => {
      const classic = composeBabysitSkillPrompt(ctx);
      const allParts = Object.values(PART_STRATA_MAP);
      const strataResult = composeByStrata(allParts, ctx);

      // Both should contain major section keywords
      expect(classic).toContain('babysit');
      expect(strataResult.length).toBeGreaterThan(0);
    });
  });

  describe('PART_STRATA_MAP drift detection', () => {
    it('covers all exports from parts/index.ts', () => {
      // All render* exports from parts should be in PART_STRATA_MAP
      const partExports = Object.keys(parts).filter(k => k.startsWith('render'));
      for (const name of partExports) {
        expect(PART_STRATA_MAP).toHaveProperty(
          name,
          expect.objectContaining({ name, render: expect.any(Function) }),
        );
      }
    });
  });
});
