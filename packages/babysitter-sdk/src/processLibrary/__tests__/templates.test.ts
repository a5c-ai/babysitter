import { describe, it, expect } from 'vitest';
import {
  BUILT_IN_TEMPLATES,
  getTemplate,
  listTemplates,
  listByCategory,
} from '../templates';

// ---------------------------------------------------------------------------
// BUILT_IN_TEMPLATES
// ---------------------------------------------------------------------------

describe('BUILT_IN_TEMPLATES', () => {
  it('contains exactly the five expected templates', () => {
    const ids = BUILT_IN_TEMPLATES.map((t) => t.id);
    expect(ids).toEqual([
      'fix-bug',
      'add-feature',
      'refactor',
      'test-coverage',
      'code-review',
    ]);
  });

  it('every template has required fields', () => {
    for (const t of BUILT_IN_TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(Array.isArray(t.parameters)).toBe(true);
      expect(typeof t.generateProcess).toBe('function');
    }
  });
});

// ---------------------------------------------------------------------------
// getTemplate
// ---------------------------------------------------------------------------

describe('getTemplate', () => {
  it('returns a template by id', () => {
    const tmpl = getTemplate('fix-bug');
    expect(tmpl).toBeDefined();
    expect(tmpl!.id).toBe('fix-bug');
  });

  it('returns undefined for unknown id', () => {
    expect(getTemplate('nonexistent')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// listTemplates
// ---------------------------------------------------------------------------

describe('listTemplates', () => {
  it('returns a copy of all templates', () => {
    const list = listTemplates();
    expect(list).toHaveLength(BUILT_IN_TEMPLATES.length);
    // Must be a copy, not the same array reference
    expect(list).not.toBe(BUILT_IN_TEMPLATES);
  });
});

// ---------------------------------------------------------------------------
// listByCategory
// ---------------------------------------------------------------------------

describe('listByCategory', () => {
  it('filters templates by category', () => {
    const maintenance = listByCategory('maintenance');
    expect(maintenance.length).toBeGreaterThanOrEqual(2);
    for (const t of maintenance) {
      expect(t.category).toBe('maintenance');
    }
  });

  it('returns empty array for unknown category', () => {
    expect(listByCategory('nonexistent')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// generateProcess
// ---------------------------------------------------------------------------

describe('generateProcess', () => {
  it('fix-bug generates process with steps', () => {
    const tmpl = getTemplate('fix-bug')!;
    const proc = tmpl.generateProcess({ bugDescription: 'null pointer on save' });
    expect(proc.title).toContain('null pointer on save');
    expect(proc.steps.length).toBeGreaterThanOrEqual(3);
    expect(proc.steps.map((s) => s.id)).toContain('reproduce');
  });

  it('add-feature generates process with steps', () => {
    const tmpl = getTemplate('add-feature')!;
    const proc = tmpl.generateProcess({ featureName: 'dark mode' });
    expect(proc.title).toContain('dark mode');
    expect(proc.steps.map((s) => s.id)).toContain('implement');
  });

  it('refactor uses default goal when not provided', () => {
    const tmpl = getTemplate('refactor')!;
    const proc = tmpl.generateProcess({ target: 'auth module' });
    expect(proc.description).toContain('improve clarity');
  });

  it('test-coverage includes coverage goal', () => {
    const tmpl = getTemplate('test-coverage')!;
    const proc = tmpl.generateProcess({ target: 'utils.ts', coverageGoal: '95' });
    expect(proc.description).toContain('95%');
  });

  it('code-review includes branch name', () => {
    const tmpl = getTemplate('code-review')!;
    const proc = tmpl.generateProcess({ branch: 'feat/login' });
    expect(proc.title).toContain('feat/login');
  });
});
