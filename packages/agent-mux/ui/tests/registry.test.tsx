import { describe, expect, it } from 'vitest';

import type { ToolCallRenderer } from '../src/components/event-cards/registry.js';
import { registerToolCallRenderer, resetToolCallRenderers, resolveToolCallRenderer } from '../src/components/event-cards/registry.js';

describe('tool-call renderer registry', () => {
  it('matches by priority and falls back to generic', () => {
    resetToolCallRenderers();

    const generic: ToolCallRenderer = {
      id: 'generic',
      priority: 0,
      match: () => true,
      compact: () => null,
      expanded: () => null,
      approvalPreview: () => null,
    };
    const bash: ToolCallRenderer = {
      ...generic,
      id: 'bash',
      priority: 10,
      match: ({ toolName }) => toolName === 'exec_command',
    };

    registerToolCallRenderer(generic);
    registerToolCallRenderer(bash);
    expect(resolveToolCallRenderer('codex', 'exec_command').id).toBe('bash');
    expect(resolveToolCallRenderer('codex', 'something-else').id).toBe('generic');
  });
});
