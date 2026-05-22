import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  ProfileManagerImpl,
  AgentMuxError,
  ValidationError,
} from '../src/index.js';
import type { StoragePaths } from '../src/index.js';

/** Create a temporary directory and return StoragePaths pointing to it. */
function makeTmpPaths(): { paths: StoragePaths; tmpDir: string } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-mux-test-'));
  const configDir = path.join(tmpDir, 'global');
  const projectConfigDir = path.join(tmpDir, 'project');

  const paths: StoragePaths = {
    configDir,
    projectConfigDir,
    globalConfigFile: path.join(configDir, 'config.json'),
    projectConfigFile: path.join(projectConfigDir, 'config.json'),
    globalProfilesDir: path.join(configDir, 'profiles'),
    projectProfilesDir: path.join(projectConfigDir, 'profiles'),
    authHintsFile: path.join(configDir, 'auth-hints.json'),
    runIndexFile: path.join(projectConfigDir, 'run-index.jsonl'),
  };

  return { paths, tmpDir };
}

function cleanup(tmpDir: string): void {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

describe('ProfileManagerImpl', () => {
  let paths: StoragePaths;
  let tmpDir: string;
  let pm: ProfileManagerImpl;

  beforeEach(() => {
    const tmp = makeTmpPaths();
    paths = tmp.paths;
    tmpDir = tmp.tmpDir;
    pm = new ProfileManagerImpl(paths);
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  // -----------------------------------------------------------------------
  // list
  // -----------------------------------------------------------------------
  describe('list', () => {
    it('returns empty array when no profiles exist', async () => {
      const entries = await pm.list();
      expect(entries).toEqual([]);
    });

    it('lists global profiles', async () => {
      await pm.set('test', { model: 'sonnet' }, { scope: 'global' });
      const entries = await pm.list({ scope: 'global' });
      expect(entries.length).toBe(1);
      expect(entries[0]!.name).toBe('test');
      expect(entries[0]!.scope).toBe('global');
      expect(entries[0]!.model).toBe('sonnet');
    });

    it('lists project profiles', async () => {
      await pm.set('proj', { model: 'opus' }, { scope: 'project' });
      const entries = await pm.list({ scope: 'project' });
      expect(entries.length).toBe(1);
      expect(entries[0]!.name).toBe('proj');
      expect(entries[0]!.model).toBe('opus');
    });

    it('lists both scopes by default', async () => {
      await pm.set('g', {}, { scope: 'global' });
      await pm.set('p', {}, { scope: 'project' });
      const entries = await pm.list();
      expect(entries.length).toBe(2);
    });

    it('sorts results by name', async () => {
      await pm.set('zebra', {}, { scope: 'global' });
      await pm.set('alpha', {}, { scope: 'global' });
      await pm.set('middle', {}, { scope: 'global' });
      const entries = await pm.list();
      expect(entries.map(e => e.name)).toEqual(['alpha', 'middle', 'zebra']);
    });

    it('merges profiles by name with project winning scope', async () => {
      await pm.set('shared', { model: 'sonnet' }, { scope: 'global' });
      await pm.set('shared', { model: 'opus' }, { scope: 'project' });
      const entries = await pm.list();
      expect(entries.length).toBe(1);
      expect(entries[0]!.scope).toBe('project');
      expect(entries[0]!.hasGlobalOverride).toBe(true);
    });

    it('merges agent/model from global into project listing entry', async () => {
      await pm.set('merged', { model: 'sonnet', agent: 'claude' as never }, { scope: 'global' });
      await pm.set('merged', { temperature: 0.5 }, { scope: 'project' });
      const entries = await pm.list();
      expect(entries.length).toBe(1);
      expect(entries[0]!.model).toBe('sonnet');
      expect(entries[0]!.agent).toBe('claude');
      expect(entries[0]!.scope).toBe('project');
    });

    it('project agent/model wins over global in listing', async () => {
      await pm.set('override', { model: 'sonnet', agent: 'claude' as never }, { scope: 'global' });
      await pm.set('override', { model: 'opus', agent: 'gpt' as never }, { scope: 'project' });
      const entries = await pm.list();
      expect(entries.length).toBe(1);
      expect(entries[0]!.model).toBe('opus');
      expect(entries[0]!.agent).toBe('gpt');
    });

    it('includes corrupt files with corrupt flag', async () => {
      fs.mkdirSync(paths.globalProfilesDir, { recursive: true });
      fs.writeFileSync(path.join(paths.globalProfilesDir, 'bad.json'), 'not json', 'utf-8');
      const entries = await pm.list({ scope: 'global' });
      expect(entries.length).toBe(1);
      expect(entries[0]!.corrupt).toBe(true);
      expect(entries[0]!.agent).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // set
  // -----------------------------------------------------------------------
  describe('set', () => {
    it('creates a profile file', async () => {
      await pm.set('fast', { temperature: 0.5 }, { scope: 'global' });
      const filePath = path.join(paths.globalProfilesDir, 'fast.json');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.temperature).toBe(0.5);
    });

    it('overwrites existing profile', async () => {
      await pm.set('fast', { temperature: 0.5 }, { scope: 'global' });
      await pm.set('fast', { temperature: 1.0 }, { scope: 'global' });
      const filePath = path.join(paths.globalProfilesDir, 'fast.json');
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.temperature).toBe(1.0);
    });

    it('validates profile data', async () => {
      await expect(
        pm.set('bad', { prompt: 'hello' } as never, { scope: 'global' }),
      ).rejects.toThrow(ValidationError);
    });
  });

  // -----------------------------------------------------------------------
  // show
  // -----------------------------------------------------------------------
  describe('show', () => {
    it('returns global profile data', async () => {
      await pm.set('x', { model: 'sonnet' }, { scope: 'global' });
      const resolved = await pm.show('x');
      expect(resolved.name).toBe('x');
      expect(resolved.data.model).toBe('sonnet');
      expect(resolved.scope).toBe('global');
      expect(resolved.globalPath).toBeDefined();
      expect(resolved.projectPath).toBeUndefined();
    });

    it('merges global + project layers', async () => {
      await pm.set('merged', { model: 'sonnet', temperature: 0.5 }, { scope: 'global' });
      await pm.set('merged', { temperature: 1.0, topK: 10 }, { scope: 'project' });
      const resolved = await pm.show('merged');
      expect(resolved.data.model).toBe('sonnet');
      expect(resolved.data.temperature).toBe(1.0);
      expect(resolved.data.topK).toBe(10);
      expect(resolved.scope).toBe('project');
      expect(resolved.globalPath).toBeDefined();
      expect(resolved.projectPath).toBeDefined();
    });

    it('throws PROFILE_NOT_FOUND for missing profile', async () => {
      try {
        await pm.show('nope');
        expect.fail('should throw');
      } catch (err) {
        expect(err).toBeInstanceOf(AgentMuxError);
        expect((err as AgentMuxError).code).toBe('PROFILE_NOT_FOUND');
      }
    });

    it('throws CONFIG_ERROR for corrupt profile', async () => {
      fs.mkdirSync(paths.globalProfilesDir, { recursive: true });
      fs.writeFileSync(path.join(paths.globalProfilesDir, 'corrupt.json'), 'not json', 'utf-8');
      try {
        await pm.show('corrupt');
        expect.fail('should throw');
      } catch (err) {
        expect(err).toBeInstanceOf(AgentMuxError);
        expect((err as AgentMuxError).code).toBe('CONFIG_ERROR');
      }
    });
  });

  // -----------------------------------------------------------------------
  // delete
  // -----------------------------------------------------------------------
  describe('delete', () => {
    it('deletes an existing profile', async () => {
      await pm.set('del', {}, { scope: 'global' });
      await pm.delete('del', { scope: 'global' });
      const entries = await pm.list({ scope: 'global' });
      expect(entries.length).toBe(0);
    });

    it('throws PROFILE_NOT_FOUND for missing profile', async () => {
      try {
        await pm.delete('nope', { scope: 'global' });
        expect.fail('should throw');
      } catch (err) {
        expect(err).toBeInstanceOf(AgentMuxError);
        expect((err as AgentMuxError).code).toBe('PROFILE_NOT_FOUND');
      }
    });

    it('prefers project scope when scope not specified', async () => {
      await pm.set('both', {}, { scope: 'global' });
      await pm.set('both', {}, { scope: 'project' });
      await pm.delete('both'); // Should delete from project
      const entries = await pm.list();
      expect(entries.length).toBe(1);
      expect(entries[0]!.scope).toBe('global');
    });
  });

  // -----------------------------------------------------------------------
  // apply
  // -----------------------------------------------------------------------
  describe('apply', () => {
    it('returns profile data as Partial<RunOptions>', async () => {
      await pm.set('app', { model: 'sonnet' }, { scope: 'global' });
      const result = await pm.apply('app');
      expect(result.model).toBe('sonnet');
    });

    it('merges with overrides', async () => {
      await pm.set('base', { model: 'sonnet', temperature: 0.5 }, { scope: 'global' });
      const result = await pm.apply('base', { temperature: 1.0, maxTurns: 5 });
      expect(result.model).toBe('sonnet');
      expect(result.temperature).toBe(1.0);
      expect(result.maxTurns).toBe(5);
    });

    it('throws PROFILE_NOT_FOUND for missing profile', async () => {
      try {
        await pm.apply('nope');
        expect.fail('should throw');
      } catch (err) {
        expect(err).toBeInstanceOf(AgentMuxError);
        expect((err as AgentMuxError).code).toBe('PROFILE_NOT_FOUND');
      }
    });

    it('throws CONFIG_ERROR when applying a corrupt profile', async () => {
      fs.mkdirSync(paths.globalProfilesDir, { recursive: true });
      fs.writeFileSync(path.join(paths.globalProfilesDir, 'broken.json'), 'not json', 'utf-8');
      try {
        await pm.apply('broken');
        expect.fail('should throw');
      } catch (err) {
        expect(err).toBeInstanceOf(AgentMuxError);
        expect((err as AgentMuxError).code).toBe('CONFIG_ERROR');
      }
    });
  });

  // -----------------------------------------------------------------------
  // Name validation
  // -----------------------------------------------------------------------
  describe('name validation', () => {
    it('rejects names with spaces', async () => {
      await expect(pm.set('bad name', {}, { scope: 'global' }))
        .rejects.toThrow(ValidationError);
    });

    it('rejects empty name', async () => {
      await expect(pm.set('', {}, { scope: 'global' }))
        .rejects.toThrow(ValidationError);
    });

    it('rejects name over 64 chars', async () => {
      await expect(pm.set('a'.repeat(65), {}, { scope: 'global' }))
        .rejects.toThrow(ValidationError);
    });

    it('accepts valid name patterns', async () => {
      await pm.set('my-profile_01', {}, { scope: 'global' });
      const entries = await pm.list({ scope: 'global' });
      expect(entries[0]!.name).toBe('my-profile_01');
    });
  });
});
