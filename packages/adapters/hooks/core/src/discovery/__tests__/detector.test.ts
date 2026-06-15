import { describe, it, expect } from 'vitest';
import { detectHarness } from '../detector';

/**
 * Build a minimal env record from a set of key=value pairs.
 * All other env vars are absent (undefined), preventing
 * leakage from the real process.env.
 */
function envWith(vars: Record<string, string>): Record<string, string | undefined> {
  return { ...vars };
}

describe('detectHarness', () => {
  // -------------------------------------------------------
  // Individual harness detection
  // -------------------------------------------------------

  describe('Claude Code', () => {
    it('detects via CLAUDE_PLUGIN_ROOT', () => {
      const result = detectHarness(envWith({ CLAUDE_PLUGIN_ROOT: '/some/path' }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('claude');
      expect(result!.confidence).toBe('high');
      expect(result!.evidence).toContain('CLAUDE_PLUGIN_ROOT');
    });

    it('detects via CLAUDE_ENV_FILE', () => {
      const result = detectHarness(envWith({ CLAUDE_ENV_FILE: '/tmp/env' }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('claude');
      expect(result!.confidence).toBe('high');
      expect(result!.evidence).toContain('CLAUDE_ENV_FILE');
    });

    it('collects multiple evidence signals', () => {
      const result = detectHarness(envWith({
        CLAUDE_PLUGIN_ROOT: '/x',
        CLAUDE_ENV_FILE: '/y',
      }));
      expect(result!.evidence).toHaveLength(2);
    });
  });

  describe('Codex', () => {
    it('detects via CODEX_PLUGIN_ROOT with high confidence', () => {
      const result = detectHarness(envWith({ CODEX_PLUGIN_ROOT: '/codex' }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('codex');
      expect(result!.confidence).toBe('high');
      expect(result!.evidence).toContain('CODEX_PLUGIN_ROOT');
    });

    it('detects via OPENAI_API_KEY with medium confidence when no Claude signals', () => {
      const result = detectHarness(envWith({ OPENAI_API_KEY: 'sk-test' }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('codex');
      expect(result!.confidence).toBe('medium');
      expect(result!.evidence).toContain('OPENAI_API_KEY');
    });

    it('does NOT detect via OPENAI_API_KEY when Claude signals present', () => {
      const result = detectHarness(envWith({
        OPENAI_API_KEY: 'sk-test',
        CLAUDE_PLUGIN_ROOT: '/claude',
      }));
      // Should detect Claude, not Codex
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('claude');
    });
  });

  describe('Gemini CLI', () => {
    it('detects via GEMINI_EXTENSION_PATH', () => {
      const result = detectHarness(envWith({ GEMINI_EXTENSION_PATH: '/ext' }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('gemini');
      expect(result!.confidence).toBe('high');
    });

    it('detects via BABYSITTER_EXTENSION_PATH', () => {
      const result = detectHarness(envWith({ BABYSITTER_EXTENSION_PATH: '/ext' }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('gemini');
      expect(result!.confidence).toBe('high');
    });
  });

  describe('GitHub Copilot', () => {
    it('detects via COPILOT_HOME', () => {
      const result = detectHarness(envWith({ COPILOT_HOME: '/copilot' }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('copilot');
      expect(result!.confidence).toBe('high');
    });

    it('detects via COPILOT_GITHUB_TOKEN', () => {
      const result = detectHarness(envWith({ COPILOT_GITHUB_TOKEN: 'ghu_test' }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('copilot');
      expect(result!.confidence).toBe('high');
    });
  });

  describe('Cursor', () => {
    it('detects via CURSOR_PROJECT_DIR with medium confidence', () => {
      const result = detectHarness(envWith({ CURSOR_PROJECT_DIR: '/cursor' }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('cursor');
      expect(result!.confidence).toBe('medium');
    });

    it('detects via CURSOR_VERSION with medium confidence', () => {
      const result = detectHarness(envWith({ CURSOR_VERSION: '0.50.0' }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('cursor');
      expect(result!.confidence).toBe('medium');
    });
  });

  describe('Pi', () => {
    it('detects via PI_PLUGIN_ROOT', () => {
      const result = detectHarness(envWith({ PI_PLUGIN_ROOT: '/pi' }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('pi');
      expect(result!.confidence).toBe('high');
    });

    it('detects via PI_SESSION_ID', () => {
      const result = detectHarness(envWith({ PI_SESSION_ID: 'sess-123' }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('pi');
      expect(result!.confidence).toBe('high');
    });
  });

  describe('Oh-My-Pi', () => {
    it('detects via OMP_PLUGIN_ROOT', () => {
      const result = detectHarness(envWith({ OMP_PLUGIN_ROOT: '/omp' }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('oh-my-pi');
      expect(result!.confidence).toBe('high');
    });

    it('detects via OMP_SESSION_ID', () => {
      const result = detectHarness(envWith({ OMP_SESSION_ID: 'sess-456' }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('oh-my-pi');
      expect(result!.confidence).toBe('high');
    });
  });

  describe('OpenCode', () => {
    it('detects via OPENCODE_CONFIG', () => {
      const result = detectHarness(envWith({ OPENCODE_CONFIG: '/opencode/config' }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('opencode');
      expect(result!.confidence).toBe('high');
    });

    it('detects via ACCOMPLISH_TASK_ID', () => {
      const result = detectHarness(envWith({ ACCOMPLISH_TASK_ID: 'task-123' }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('opencode');
      expect(result!.confidence).toBe('high');
    });
  });

  describe('OpenClaw', () => {
    it('detects via OPENCLAW_SHELL with medium confidence', () => {
      const result = detectHarness(envWith({ OPENCLAW_SHELL: '/openclaw/shell' }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('openclaw');
      expect(result!.confidence).toBe('medium');
    });

    it('detects via OPENCLAW_HOME with medium confidence', () => {
      const result = detectHarness(envWith({ OPENCLAW_HOME: '/openclaw/home' }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('openclaw');
      expect(result!.confidence).toBe('medium');
    });
  });

  // -------------------------------------------------------
  // No detection
  // -------------------------------------------------------

  describe('no harness detected', () => {
    it('returns null when no env vars are set', () => {
      const result = detectHarness(envWith({}));
      expect(result).toBeNull();
    });

    it('returns null for unrelated env vars', () => {
      const result = detectHarness(envWith({
        HOME: '/home/marvin',
        PATH: '/usr/bin',
        NODE_ENV: 'production',
      }));
      expect(result).toBeNull();
    });

    it('ignores empty-string env var values', () => {
      const result = detectHarness(envWith({ CLAUDE_PLUGIN_ROOT: '' }));
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------
  // Precedence
  // -------------------------------------------------------

  describe('precedence', () => {
    it('Claude wins over Codex when both signals present', () => {
      const result = detectHarness(envWith({
        CLAUDE_PLUGIN_ROOT: '/claude',
        CODEX_PLUGIN_ROOT: '/codex',
      }));
      expect(result).not.toBeNull();
      expect(result!.adapter).toBe('claude');
    });

    it('Claude wins over Gemini when both signals present', () => {
      const result = detectHarness(envWith({
        CLAUDE_ENV_FILE: '/env',
        GEMINI_EXTENSION_PATH: '/gem',
      }));
      expect(result!.adapter).toBe('claude');
    });

    it('high-confidence match wins over earlier medium-confidence match', () => {
      // Cursor (medium) appears in rules before Pi (high),
      // but Pi has high confidence so it should win.
      // Actually, Cursor is rule 5 and Pi is rule 6.
      // Since Cursor is medium, it becomes bestMatch. Then Pi is high, so Pi wins.
      const result = detectHarness(envWith({
        CURSOR_PROJECT_DIR: '/cursor',
        PI_SESSION_ID: 'sess-1',
      }));
      expect(result!.adapter).toBe('pi');
      expect(result!.confidence).toBe('high');
    });

    it('first high-confidence match wins among multiple high-confidence harnesses', () => {
      // Both Gemini and Pi are high-confidence; Gemini appears first in rules
      const result = detectHarness(envWith({
        GEMINI_EXTENSION_PATH: '/gem',
        PI_SESSION_ID: 'sess-1',
      }));
      // Codex high is checked before Gemini, but CODEX_PLUGIN_ROOT isn't set.
      // Gemini is the first high-confidence match.
      expect(result!.adapter).toBe('gemini');
    });
  });

  // -------------------------------------------------------
  // Confidence levels
  // -------------------------------------------------------

  describe('confidence levels', () => {
    it('Claude detections are high confidence', () => {
      const result = detectHarness(envWith({ CLAUDE_PLUGIN_ROOT: '/x' }));
      expect(result!.confidence).toBe('high');
    });

    it('Codex via OPENAI_API_KEY is medium confidence', () => {
      const result = detectHarness(envWith({ OPENAI_API_KEY: 'sk-test' }));
      expect(result!.confidence).toBe('medium');
    });

    it('Cursor detections are medium confidence', () => {
      const result = detectHarness(envWith({ CURSOR_PROJECT_DIR: '/x' }));
      expect(result!.confidence).toBe('medium');
    });

    it('OpenClaw detections are medium confidence', () => {
      const result = detectHarness(envWith({ OPENCLAW_SHELL: '/x' }));
      expect(result!.confidence).toBe('medium');
    });
  });

  // -------------------------------------------------------
  // Evidence strings
  // -------------------------------------------------------

  describe('evidence', () => {
    it('includes the specific env var(s) that matched', () => {
      const result = detectHarness(envWith({ PI_PLUGIN_ROOT: '/pi', PI_SESSION_ID: 'sess' }));
      expect(result!.evidence).toEqual(expect.arrayContaining(['PI_PLUGIN_ROOT', 'PI_SESSION_ID']));
      expect(result!.evidence).toHaveLength(2);
    });

    it('includes only present env vars in evidence', () => {
      // CLAUDE_PLUGIN_ROOT present but CLAUDE_ENV_FILE absent
      const result = detectHarness(envWith({ CLAUDE_PLUGIN_ROOT: '/x' }));
      expect(result!.evidence).toEqual(['CLAUDE_PLUGIN_ROOT']);
    });
  });

  // -------------------------------------------------------
  // Defaults to process.env
  // -------------------------------------------------------

  describe('defaults', () => {
    it('uses process.env when no env argument provided', () => {
      // We can't easily test this without polluting process.env,
      // but we can at least verify the function doesn't throw
      const result = detectHarness();
      // Result depends on actual process.env — just ensure no crash
      expect(result === null || typeof result.adapter === 'string').toBe(true);
    });
  });
});
