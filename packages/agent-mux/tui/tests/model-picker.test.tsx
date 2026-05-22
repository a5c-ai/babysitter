import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { ModelPicker, type ModelOption } from '../src/model-picker.js';

const flush = () => new Promise((r) => setTimeout(r, 10));

const models: ModelOption[] = [
  { agent: 'claude-code', modelId: 'opus' },
  { agent: 'claude-code', modelId: 'sonnet' },
  { agent: 'codex', modelId: 'gpt-5' },
];

describe('ModelPicker', () => {
  it('lists models and picks selection on Enter', async () => {
    const onPick = vi.fn();
    const onCancel = vi.fn();
    const { lastFrame, stdin, rerender } = render(
      <ModelPicker models={models} onPick={onPick} onCancel={onCancel} />,
    );
    rerender(<ModelPicker models={models} onPick={onPick} onCancel={onCancel} />);
    const f0 = lastFrame() ?? '';
    expect(f0).toContain('opus');
    expect(f0).toContain('gpt-5');

    stdin.write('gpt');
    await flush();
    rerender(<ModelPicker models={models} onPick={onPick} onCancel={onCancel} />);
    const f1 = lastFrame() ?? '';
    expect(f1).toContain('gpt-5');
    expect(f1).not.toContain('opus');

    stdin.write('\r');
    await flush();
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick.mock.calls[0]![0]!.modelId).toBe('gpt-5');
  });

  it('Esc cancels', async () => {
    const onPick = vi.fn();
    const onCancel = vi.fn();
    const { stdin, rerender } = render(
      <ModelPicker models={models} onPick={onPick} onCancel={onCancel} />,
    );
    rerender(<ModelPicker models={models} onPick={onPick} onCancel={onCancel} />);
    await flush();
    stdin.write('\u001B');
    await new Promise((r) => setTimeout(r, 60));
    expect(onCancel).toHaveBeenCalled();
  });

  it('caps visible rows for short overlays', () => {
    const onPick = vi.fn();
    const onCancel = vi.fn();
    const { lastFrame } = render(
      <ModelPicker models={models} onPick={onPick} onCancel={onCancel} maxItems={2} width={20} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('… 1 more');
    expect(frame).not.toContain('gpt-5');
  });
});
