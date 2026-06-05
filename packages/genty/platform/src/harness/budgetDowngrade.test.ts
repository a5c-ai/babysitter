import { describe, it, expect } from 'vitest';
import { suggestBudgetDowngrade, getModelTier, isDowngradeAcceptable } from './budgetDowngrade';

describe('budgetDowngrade', () => {
  describe('suggestBudgetDowngrade', () => {
    it('returns undefined when under threshold', () => {
      expect(suggestBudgetDowngrade('claude-opus-4-6', 5, 100)).toBeUndefined();
    });

    it('returns undefined when budget is 0', () => {
      expect(suggestBudgetDowngrade('claude-opus-4-6', 5, 0)).toBeUndefined();
    });

    it('suggests sonnet when opus at 80% budget', () => {
      const result = suggestBudgetDowngrade('claude-opus-4-6', 8, 10);
      expect(result).toBeDefined();
      expect(result!.suggestedModel).toContain('sonnet');
      expect(result!.savingsPercent).toBeGreaterThan(0);
      expect(result!.reason).toContain('budget');
    });

    it('suggests haiku when sonnet at budget', () => {
      const result = suggestBudgetDowngrade('claude-sonnet-4-6', 9, 10);
      expect(result).toBeDefined();
      expect(result!.suggestedModel).toContain('haiku');
    });

    it('returns undefined for cheapest model', () => {
      const result = suggestBudgetDowngrade('claude-haiku-3-5', 9, 10);
      expect(result).toBeUndefined();
    });

    it('respects custom threshold', () => {
      // $7/$10 = 70%, threshold 0.6 → triggers
      expect(suggestBudgetDowngrade('claude-opus-4-6', 7, 10, 0.6)).toBeDefined();
      // $7/$10 = 70%, threshold 0.9 → does not trigger
      expect(suggestBudgetDowngrade('claude-opus-4-6', 7, 10, 0.9)).toBeUndefined();
    });
  });

  describe('getModelTier', () => {
    it('returns 0 for opus', () => {
      expect(getModelTier('claude-opus-4-6')).toBe(0);
    });

    it('returns 1 for sonnet', () => {
      expect(getModelTier('claude-sonnet-4-6')).toBe(1);
    });

    it('returns 2 for haiku', () => {
      expect(getModelTier('claude-haiku-4-5')).toBe(2);
    });

    it('returns -1 for unknown', () => {
      expect(getModelTier('gpt-4o')).toBe(-1);
    });
  });

  describe('isDowngradeAcceptable', () => {
    it('accepts downgrade within bounds', () => {
      expect(isDowngradeAcceptable('claude-opus-4-6', 'claude-sonnet-4-6')).toBe(true);
    });

    it('rejects downgrade below min tier', () => {
      expect(isDowngradeAcceptable('claude-opus-4-6', 'claude-haiku-4-5', 1)).toBe(false);
    });

    it('accepts downgrade at exact min tier', () => {
      expect(isDowngradeAcceptable('claude-opus-4-6', 'claude-sonnet-4-6', 1)).toBe(true);
    });
  });
});
