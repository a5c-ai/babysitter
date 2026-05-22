// Tests for hook registration generation

import { describe, it, expect } from 'vitest';
import { generateClaudeCodeHooksJson, generateCodexHooksJson, generateCursorHooksJson, generateGithubCopilotHooksJson, generateOpenCodeHooksJson } from '../hookRegistration';
import { requireTargetProfile } from '../targets';
import type { A5cPluginManifest } from '../types';

const CLAUDE_CODE_PROFILE = requireTargetProfile('claude-code');
const CODEX_PROFILE = requireTargetProfile('codex');
const CURSOR_PROFILE = requireTargetProfile('cursor');
const GITHUB_COPILOT_PROFILE = requireTargetProfile('github-copilot');
const OPENCODE_PROFILE = requireTargetProfile('opencode');

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

describe('generateCursorHooksJson', () => {
  it('should generate shell commands that point at canonical wrapper scripts', () => {
    const json = generateCursorHooksJson(MANIFEST, CURSOR_PROFILE);
    const parsed = JSON.parse(json);

    expect(parsed.hooks.sessionStart[0].bash).toBe('bash "./hooks/session-start.sh"');
    expect(parsed.hooks.sessionStart[0].powershell).toBe(
      'powershell -NoProfile -ExecutionPolicy Bypass -File "./hooks/session-start.ps1"'
    );
  });
});

describe('generateGithubCopilotHooksJson', () => {
  it('should generate root-relative bash and powershell hook paths', () => {
    const json = generateGithubCopilotHooksJson(MANIFEST, GITHUB_COPILOT_PROFILE);
    const parsed = JSON.parse(json);

    expect(parsed.hooks.sessionStart[0].bash).toBe('./hooks/session-start.sh');
    expect(parsed.hooks.sessionStart[0].powershell).toBe('./hooks/session-start.ps1');
  });
});

describe('generateOpenCodeHooksJson', () => {
  it('should generate bundle-local javascript hook paths', () => {
    const json = generateOpenCodeHooksJson(MANIFEST, OPENCODE_PROFILE);
    const parsed = JSON.parse(json);

    expect(parsed.hooks['session.created'][0].script).toBe('./hooks/session-start.js');
  });
});
