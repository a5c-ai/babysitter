import { describe, it, expect } from 'vitest';
import { createPromptContextFromCatalog } from '../context';
import { renderPriorityLadder } from '../parts/priorityLadder';
import { renderRootCauseGuardrail } from '../parts/rootCauseGuardrail';

describe('always-on prompt parts', () => {
  it('renderPriorityLadder renders by default', () => {
    const out = renderPriorityLadder(createPromptContextFromCatalog('claude-code'));
    expect(out).toMatch(/Priority Ladder/);
    expect(out).toMatch(/User's explicit instructions/);
  });

  it('renderPriorityLadder returns empty when flag explicitly false', () => {
    const out = renderPriorityLadder(
      createPromptContextFromCatalog('claude-code', { hasPriorityLadder: false }),
    );
    expect(out).toBe('');
  });

  it('renderRootCauseGuardrail renders by default', () => {
    const out = renderRootCauseGuardrail(createPromptContextFromCatalog('claude-code'));
    expect(out).toMatch(/Root Cause/);
    expect(out).toMatch(/guardrail/i);
  });

  it('renderRootCauseGuardrail returns empty when flag explicitly false', () => {
    const out = renderRootCauseGuardrail(
      createPromptContextFromCatalog('claude-code', { hasRootCauseGuardrail: false }),
    );
    expect(out).toBe('');
  });
});
