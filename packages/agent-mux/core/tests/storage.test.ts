import { describe, it, expect, vi, afterEach } from 'vitest';
import * as path from 'node:path';
import * as os from 'node:os';
import { resolveStoragePaths } from '../src/index.js';

describe('resolveStoragePaths', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('configDir resolution', () => {
    it('uses configDir option when provided', () => {
      const result = resolveStoragePaths({ configDir: '/custom/config' });
      expect(result.configDir).toBe(path.resolve('/custom/config'));
    });

    it('uses AGENT_MUX_CONFIG_DIR env variable when set', () => {
      vi.stubEnv('AGENT_MUX_CONFIG_DIR', '/env/config');
      const result = resolveStoragePaths();
      expect(result.configDir).toBe(path.resolve('/env/config'));
    });

    it('prefers configDir option over env variable', () => {
      vi.stubEnv('AGENT_MUX_CONFIG_DIR', '/env/config');
      const result = resolveStoragePaths({ configDir: '/option/config' });
      expect(result.configDir).toBe(path.resolve('/option/config'));
    });

    it('defaults to ~/.agent-mux when no override', () => {
      vi.stubEnv('AGENT_MUX_CONFIG_DIR', '');
      const result = resolveStoragePaths();
      expect(result.configDir).toBe(path.join(os.homedir(), '.agent-mux'));
    });
  });

  describe('projectConfigDir resolution', () => {
    it('uses projectConfigDir option when provided', () => {
      const result = resolveStoragePaths({ projectConfigDir: '/custom/project' });
      expect(result.projectConfigDir).toBe(path.resolve('/custom/project'));
    });

    it('uses AGENT_MUX_PROJECT_DIR env variable when set', () => {
      vi.stubEnv('AGENT_MUX_PROJECT_DIR', '/env/project');
      const result = resolveStoragePaths();
      expect(result.projectConfigDir).toBe(path.resolve('/env/project'));
    });

    it('prefers projectConfigDir option over env variable', () => {
      vi.stubEnv('AGENT_MUX_PROJECT_DIR', '/env/project');
      const result = resolveStoragePaths({
        projectConfigDir: '/option/project',
      });
      expect(result.projectConfigDir).toBe(path.resolve('/option/project'));
    });

    it('defaults to cwd/.agent-mux when no .agent-mux dir found', () => {
      vi.stubEnv('AGENT_MUX_PROJECT_DIR', '');
      const result = resolveStoragePaths();
      // The walk-up may or may not find a .agent-mux dir;
      // it should always return an absolute path ending in .agent-mux
      expect(path.isAbsolute(result.projectConfigDir)).toBe(true);
      expect(result.projectConfigDir).toMatch(/\.agent-mux$/);
    });
  });

  describe('derived paths', () => {
    it('computes globalConfigFile correctly', () => {
      const configDir = path.resolve('/test/config');
      const result = resolveStoragePaths({ configDir });
      expect(result.globalConfigFile).toBe(
        path.join(configDir, 'config.json'),
      );
    });

    it('computes projectConfigFile correctly', () => {
      const projectConfigDir = path.resolve('/test/project');
      const result = resolveStoragePaths({ projectConfigDir });
      expect(result.projectConfigFile).toBe(
        path.join(projectConfigDir, 'config.json'),
      );
    });

    it('computes globalProfilesDir correctly', () => {
      const configDir = path.resolve('/test/config');
      const result = resolveStoragePaths({ configDir });
      expect(result.globalProfilesDir).toBe(
        path.join(configDir, 'profiles'),
      );
    });

    it('computes projectProfilesDir correctly', () => {
      const projectConfigDir = path.resolve('/test/project');
      const result = resolveStoragePaths({ projectConfigDir });
      expect(result.projectProfilesDir).toBe(
        path.join(projectConfigDir, 'profiles'),
      );
    });

    it('computes authHintsFile correctly', () => {
      const configDir = path.resolve('/test/config');
      const result = resolveStoragePaths({ configDir });
      expect(result.authHintsFile).toBe(
        path.join(configDir, 'auth-hints.json'),
      );
    });

    it('computes runIndexFile correctly', () => {
      const projectConfigDir = path.resolve('/test/project');
      const result = resolveStoragePaths({ projectConfigDir });
      expect(result.runIndexFile).toBe(
        path.join(projectConfigDir, 'run-index.jsonl'),
      );
    });
  });
});
