// Tests for hook registration generation

import { describe, it, expect } from 'vitest';
import { generateClaudeCodeHooksJson, generateCodexHooksJson } from '../hookRegistration';
import { CLAUDE_CODE_PROFILE } from '../targets/claude-code';
import { CODEX_PROFILE } from '../targets/codex';
import type { A5cPluginManifest } from '../types';

const MANIFEST: A5cPluginManifest = {
  name: 'test-plugin',
  version: '1.0.0',
  description: 'Test',
  author: 'Test',
  license: 'MIT',
  hooks: {
    SessionStart: 'hooks/session-start.sh',
    Stop: 'hooks/stop.sh',
    PreToolUse: true,
  },
};

describe('generateClaudeCodeHooksJson', () => {
  it('should generate hooks.json with bash command referencing script path', () => {
    const json = generateClaudeCodeHooksJson(MANIFEST, CLAUDE_CODE_PROFILE);
    const parsed = JSON.parse(json);

    expect(parsed.hooks.SessionStart).toBeDefined();
    const cmd = parsed.hooks.SessionStart[0].hooks[0].command;
    expect(cmd).toContain('bash');
    expect(cmd).toContain('hooks/session-start.sh');
    expect(cmd).toContain('CLAUDE_PLUGIN_ROOT');
  });

  it('should use hookFilePattern from target override when present', () => {
    const manifest: A5cPluginManifest = {
      ...MANIFEST,
      targets: {
        'claude-code': {
          hookFilePattern: '{{name}}-proxied-{{slug}}-hook.sh',
        },
      },
    };
    const json = generateClaudeCodeHooksJson(manifest, CLAUDE_CODE_PROFILE);
    const parsed = JSON.parse(json);
    const cmd = parsed.hooks.SessionStart[0].hooks[0].command;
    expect(cmd).toContain('hooks/test-plugin-proxied-session-start-hook.sh');
  });

  it('should use global hookFilePattern', () => {
    const manifest: A5cPluginManifest = {
      ...MANIFEST,
      hookFilePattern: '{{name}}-proxied-{{native}}.sh',
    };
    const json = generateClaudeCodeHooksJson(manifest, CLAUDE_CODE_PROFILE);
    const parsed = JSON.parse(json);
    const cmd = parsed.hooks.SessionStart[0].hooks[0].command;
    expect(cmd).toContain('hooks/test-plugin-proxied-session-start.sh');
  });
});

describe('generateCodexHooksJson', () => {
  it('should generate codex format with matcher and direct script path', () => {
    const json = generateCodexHooksJson(MANIFEST, CODEX_PROFILE);
    const parsed = JSON.parse(json);

    expect(parsed.hooks.SessionStart[0].matcher).toBe('.*');
    const cmd = parsed.hooks.SessionStart[0].hooks[0].command;
    expect(cmd).toContain('hooks/session-start.sh');
    expect(cmd).not.toContain('ADAPTER_NAME');
  });
});
