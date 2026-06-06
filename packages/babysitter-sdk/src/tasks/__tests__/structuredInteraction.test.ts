import { describe, it, expect } from 'vitest';
import {
  createInteractionRequest,
  formatInteractionForPrompt,
  type InteractionRequest,
} from '../structuredInteraction';

// ---------------------------------------------------------------------------
// createInteractionRequest
// ---------------------------------------------------------------------------

describe('createInteractionRequest', () => {
  it('creates a confirm request', () => {
    const req = createInteractionRequest('confirm', 'Deploy to prod?');
    expect(req.type).toBe('confirm');
    expect(req.question).toBe('Deploy to prod?');
    expect(req.options).toBeUndefined();
    expect(req.default).toBeUndefined();
  });

  it('creates a select request with options', () => {
    const req = createInteractionRequest('select', 'Pick env', {
      options: ['dev', 'staging', 'prod'],
      default: 'dev',
    });
    expect(req.type).toBe('select');
    expect(req.options).toEqual(['dev', 'staging', 'prod']);
    expect(req.default).toBe('dev');
  });

  it('creates an input request', () => {
    const req = createInteractionRequest('input', 'Enter branch name', {
      default: 'main',
    });
    expect(req.type).toBe('input');
    expect(req.default).toBe('main');
  });

  it('creates a multiSelect request', () => {
    const req = createInteractionRequest('multiSelect', 'Select files', {
      options: ['a.ts', 'b.ts', 'c.ts'],
    });
    expect(req.type).toBe('multiSelect');
    expect(req.options).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// formatInteractionForPrompt
// ---------------------------------------------------------------------------

describe('formatInteractionForPrompt', () => {
  it('formats confirm request', () => {
    const req = createInteractionRequest('confirm', 'Proceed?');
    const text = formatInteractionForPrompt(req);
    expect(text).toContain('[CONFIRM]');
    expect(text).toContain('Proceed?');
    expect(text).toContain('yes / no');
  });

  it('formats confirm request with default', () => {
    const req = createInteractionRequest('confirm', 'Continue?', { default: 'yes' });
    const text = formatInteractionForPrompt(req);
    expect(text).toContain('Default: yes');
  });

  it('formats select request with numbered options', () => {
    const req = createInteractionRequest('select', 'Choose', {
      options: ['alpha', 'beta'],
    });
    const text = formatInteractionForPrompt(req);
    expect(text).toContain('[SELECT]');
    expect(text).toContain('1. alpha');
    expect(text).toContain('2. beta');
  });

  it('formats input request', () => {
    const req = createInteractionRequest('input', 'Name?', { default: 'world' });
    const text = formatInteractionForPrompt(req);
    expect(text).toContain('[INPUT]');
    expect(text).toContain('Name?');
    expect(text).toContain('Default: world');
  });

  it('formats multiSelect request', () => {
    const req = createInteractionRequest('multiSelect', 'Pick items', {
      options: ['x', 'y', 'z'],
    });
    const text = formatInteractionForPrompt(req);
    expect(text).toContain('[MULTI-SELECT]');
    expect(text).toContain('1. x');
    expect(text).toContain('comma-separated');
  });
});
