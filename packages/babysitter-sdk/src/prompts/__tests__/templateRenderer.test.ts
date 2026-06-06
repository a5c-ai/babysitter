import { describe, expect, it } from 'vitest';
import { createPromptContextFromCatalog } from '../context';
import { renderTemplateString } from '../templateRenderer';

describe('renderTemplateString', () => {
  it('renders capability and placeholder tokens without regex section matching', () => {
    const ctx = createPromptContextFromCatalog('codex');
    const rendered = renderTemplateString(
      '{{#cap.process-library}}lib {{harness}}{{/cap.process-library}}{{^cap.missing}} fallback{{/cap.missing}}',
      { ...ctx, capabilities: ['process-library'] },
    );

    expect(rendered).toBe('lib codex fallback');
  });

  it('preserves unmatched section tokens', () => {
    const ctx = createPromptContextFromCatalog('codex');
    const rendered = renderTemplateString('{{#interactive}}unterminated', ctx);

    expect(rendered).toBe('{{#interactive}}unterminated');
  });
});