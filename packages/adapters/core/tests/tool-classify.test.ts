import { describe, expect, it } from 'vitest';

import { classifyTool } from '../src/index.js';

describe('classifyTool', () => {
  it('classifies destructive shell commands conservatively', () => {
    expect(classifyTool('codex', 'exec_command', 'rm -rf tmp')).toMatchObject({
      destructive: true,
      readOnly: false,
      longRunning: true,
    });
  });

  it('classifies read-only file inspection tools as read-only', () => {
    expect(classifyTool('claude', 'Read')).toMatchObject({
      destructive: false,
      readOnly: true,
    });
    expect(classifyTool('codex', 'grep')).toMatchObject({
      destructive: false,
      readOnly: true,
    });
  });

  it('classifies unknown tools conservatively', () => {
    expect(classifyTool('mystery-agent', 'totallyUnknownTool')).toEqual({
      destructive: true,
      readOnly: false,
      network: false,
      longRunning: false,
      handlesSecrets: false,
    });
  });
});
