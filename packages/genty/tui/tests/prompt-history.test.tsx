import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import {
  PromptInput,
  createPromptInputState,
  deletePromptInput,
  getPromptInputDisplay,
  getPromptInputValue,
  insertPromptInput,
  insertPromptLineBreak,
} from '../src/prompt-input.js';

const flush = () => new Promise((r) => setTimeout(r, 30));
const hist = ['first', 'second', 'third'];

function rer(props: { onSubmit: (v: string) => void; onCancel: () => void; history?: string[] }) {
  return <PromptInput {...props} />;
}

describe('PromptInput history recall', () => {
  it('up-arrow recalls most recent first, then earlier; submit fires recalled value', async () => {
    const onSubmit = vi.fn();
    const props = { onSubmit, onCancel: () => {}, history: hist };
    const { stdin, lastFrame, rerender } = render(rer(props));
    rerender(rer(props));
    await flush();

    stdin.write('\u001B[A');
    await flush();
    rerender(rer(props));
    expect(lastFrame()).toContain('third');

    stdin.write('\u001B[A');
    await flush();
    rerender(rer(props));
    expect(lastFrame()).toContain('second');

    stdin.write('\r');
    await flush();
    expect(onSubmit).toHaveBeenCalledWith('second');
  });

  it('up at end of history is a no-op (does not crash)', async () => {
    const onSubmit = vi.fn();
    const props = { onSubmit, onCancel: () => {}, history: ['only'] };
    const { stdin, lastFrame, rerender } = render(rer(props));
    rerender(rer(props));
    stdin.write('\u001B[A');
    await flush();
    stdin.write('\u001B[A');
    await flush();
    rerender(rer(props));
    expect(lastFrame()).toContain('only');
  });

  it('without history prop, arrows do nothing and typing still works', async () => {
    const onSubmit = vi.fn();
    const props = { onSubmit, onCancel: () => {} };
    const { stdin, lastFrame, rerender } = render(rer(props));
    rerender(rer(props));
    stdin.write('\u001B[A');
    await flush();
    stdin.write('hi');
    await flush();
    rerender(rer(props));
    expect(lastFrame()).toContain('hi');
  });

  it('condenses pasted multiline blocks while keeping the submitted payload', () => {
    const state = insertPromptInput(createPromptInputState('before '), 'alpha\nbeta\ngamma');
    expect(getPromptInputDisplay(state)).toContain('[Pasted Text: 3 lines]');
    expect(getPromptInputValue(state)).toBe('before alpha\nbeta\ngamma');

    const afterDelete = deletePromptInput(state);
    expect(getPromptInputValue(afterDelete)).toBe('before ');
    expect(getPromptInputDisplay(afterDelete)).toBe('before ');
  });

  it('renders dropped file paths as filenames with icons while preserving the raw path', () => {
    const state = insertPromptInput(createPromptInputState(), '/tmp/screenshots/final-report.png ');
    expect(getPromptInputValue(state)).toBe('/tmp/screenshots/final-report.png ');
    expect(getPromptInputDisplay(state)).toBe('🖼 final-report.png ');
  });

  it('supports explicit multiline drafts via line-break insertion', () => {
    const state = insertPromptLineBreak(createPromptInputState('hello'));
    expect(getPromptInputValue(state)).toBe('hello\n');
    expect(getPromptInputDisplay(state)).toBe('hello\n');
  });
});
