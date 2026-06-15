import { describe, it, expect } from 'vitest';
import {
  getTemplate,
  listTemplates,
  applyTemplate,
  BUILT_IN_TEMPLATES,
  type SessionTemplate,
} from '../sessionTemplates';

describe('sessionTemplates', () => {
  // -------------------------------------------------------------------------
  // BUILT_IN_TEMPLATES
  // -------------------------------------------------------------------------

  describe('BUILT_IN_TEMPLATES', () => {
    it('has 5 built-in templates', () => {
      expect(BUILT_IN_TEMPLATES).toHaveLength(5);
    });

    it('includes default, coding, research, review, planning', () => {
      const ids = BUILT_IN_TEMPLATES.map(t => t.id);
      expect(ids).toEqual(['default', 'coding', 'research', 'review', 'planning']);
    });

    it('all templates have required fields', () => {
      for (const t of BUILT_IN_TEMPLATES) {
        expect(t.id).toBeTruthy();
        expect(t.name).toBeTruthy();
        expect(t.description).toBeTruthy();
        expect(t.defaultModel).toBeTruthy();
        expect(t.config).toBeDefined();
      }
    });
  });

  // -------------------------------------------------------------------------
  // getTemplate
  // -------------------------------------------------------------------------

  describe('getTemplate', () => {
    it('returns a template by ID', () => {
      const t = getTemplate('coding');
      expect(t).toBeDefined();
      expect(t!.name).toBe('Coding');
      expect(t!.extensions).toContain('code-analysis');
    });

    it('returns undefined for unknown ID', () => {
      expect(getTemplate('nonexistent')).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // listTemplates
  // -------------------------------------------------------------------------

  describe('listTemplates', () => {
    it('returns id, name, description for each template', () => {
      const list = listTemplates();
      expect(list).toHaveLength(5);
      for (const item of list) {
        expect(item.id).toBeTruthy();
        expect(item.name).toBeTruthy();
        expect(item.description).toBeTruthy();
      }
    });
  });

  // -------------------------------------------------------------------------
  // applyTemplate
  // -------------------------------------------------------------------------

  describe('applyTemplate', () => {
    it('applies template defaults to empty session options', () => {
      const template = getTemplate('coding')!;
      const result = applyTemplate(template, {});
      expect(result.model).toBe('sonnet');
      expect(result.extensions).toEqual(['code-analysis', 'test-runner']);
      expect(result.systemPrompt).toContain('expert software engineer');
      expect(result.maxIterations).toBe(50);
    });

    it('preserves explicit session options over template defaults', () => {
      const template = getTemplate('coding')!;
      const result = applyTemplate(template, {
        model: 'opus',
        maxIterations: 100,
      });
      expect(result.model).toBe('opus');
      expect(result.maxIterations).toBe(100);
      // Extensions still come from template
      expect(result.extensions).toEqual(['code-analysis', 'test-runner']);
    });

    it('handles template without system prompt override', () => {
      const template = getTemplate('default')!;
      const result = applyTemplate(template, {});
      expect(result.systemPrompt).toBeUndefined();
    });
  });
});
