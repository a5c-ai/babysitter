/**
 * Integration tests verifying the core client, run-option validation,
 * and profile flows work together correctly.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  createClient,
  AgentMuxClient,
  AgentMuxError,
  ValidationError,
  DEFAULT_RETRY_POLICY,
  resolveStoragePaths,
  validateRunOptions,
  validateProfileData,
  PROHIBITED_PROFILE_FIELDS,
  ProfileManagerImpl,
  deepMerge,
  stripUndefined,
} from '../src/index.js';
import type {
  RunOptions,
  RunHandle,
  StoragePaths,
  ProfileManager,
  ProfileEntry,
  ResolvedProfile,
  RetryPolicy,
  McpServerConfig,
  Attachment,
  ErrorCode,
  ProfileData,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpPaths(): { paths: StoragePaths; tmpDir: string } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'integration-test-'));
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

describe('Integration: core client and run options', () => {
  let paths: StoragePaths;
  let tmpDir: string;

  beforeEach(() => {
    const tmp = makeTmpPaths();
    paths = tmp.paths;
    tmpDir = tmp.tmpDir;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // -------------------------------------------------------------------------
  // Client + ProfileManager integration
  // -------------------------------------------------------------------------
  describe('Client creates ProfileManager', () => {
    it('createClient provides a profiles property with full CRUD', async () => {
      const client = createClient({
        configDir: paths.configDir,
        projectConfigDir: paths.projectConfigDir,
      });
      expect(client).toBeInstanceOf(AgentMuxClient);
      expect(client.profiles).toBeDefined();

      // Set a profile
      await client.profiles.set('fast', { model: 'sonnet', temperature: 0.2 }, { scope: 'global' });

      // List profiles
      const entries = await client.profiles.list();
      expect(entries.length).toBe(1);
      expect(entries[0]!.name).toBe('fast');
      expect(entries[0]!.model).toBe('sonnet');

      // Show resolved profile
      const resolved = await client.profiles.show('fast');
      expect(resolved.data.model).toBe('sonnet');
      expect(resolved.data.temperature).toBe(0.2);

      // Apply to overrides
      const applied = await client.profiles.apply('fast', { temperature: 1.0 });
      expect(applied.model).toBe('sonnet');
      expect(applied.temperature).toBe(1.0); // Override wins

      // Delete
      await client.profiles.delete('fast', { scope: 'global' });
      const afterDelete = await client.profiles.list();
      expect(afterDelete.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Validation → Error chain
  // -------------------------------------------------------------------------
  describe('Validation produces proper error types', () => {
    it('validateRunOptions throws ValidationError extending AgentMuxError', () => {
      try {
        validateRunOptions({ agent: '', prompt: '' } as RunOptions);
        expect.fail('should throw');
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        expect(err).toBeInstanceOf(AgentMuxError);
        expect((err as AgentMuxError).code).toBe('VALIDATION_ERROR');
        expect((err as ValidationError).fields.length).toBeGreaterThan(0);
      }
    });

    it('ProfileManager.show throws AgentMuxError for missing profile', async () => {
      const pm = new ProfileManagerImpl(paths);
      try {
        await pm.show('nonexistent');
        expect.fail('should throw');
      } catch (err) {
        expect(err).toBeInstanceOf(AgentMuxError);
        expect((err as AgentMuxError).code).toBe('PROFILE_NOT_FOUND');
      }
    });

    it('ProfileManager.set rejects prohibited fields with ValidationError', async () => {
      const pm = new ProfileManagerImpl(paths);
      for (const field of ['prompt', 'env', 'sessionId']) {
        await expect(
          pm.set('bad', { [field]: 'value' } as never, { scope: 'global' }),
        ).rejects.toThrow(ValidationError);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Profile + RunOptions validation integration
  // -------------------------------------------------------------------------
  describe('Profile data uses same validation as RunOptions', () => {
    it('PROHIBITED_PROFILE_FIELDS has exactly 13 fields', () => {
      expect(PROHIBITED_PROFILE_FIELDS.size).toBe(13);
    });

    it('profile data validates range constraints the same way', () => {
      // Both validateProfileData and validateRunOptions reject temperature > 2
      expect(() => validateProfileData({ temperature: 3 })).toThrow(ValidationError);
      expect(() => validateRunOptions({ agent: 'test', prompt: 'hi', temperature: 3 })).toThrow(ValidationError);

      // Both reject NaN
      expect(() => validateProfileData({ temperature: NaN })).toThrow(ValidationError);
      expect(() => validateRunOptions({ agent: 'test', prompt: 'hi', temperature: NaN })).toThrow(ValidationError);
    });
  });

  // -------------------------------------------------------------------------
  // Deep merge integration
  // -------------------------------------------------------------------------
  describe('deepMerge works with profile apply', () => {
    it('profile.apply merges profile data with RunOptions overrides', async () => {
      const pm = new ProfileManagerImpl(paths);
      await pm.set('base', {
        model: 'sonnet',
        temperature: 0.5,
        topK: 10,
      }, { scope: 'global' });

      const result = await pm.apply('base', {
        temperature: 1.0,
        maxTurns: 5,
      });

      expect(result.model).toBe('sonnet');       // From profile
      expect(result.temperature).toBe(1.0);      // Override wins
      expect(result.topK).toBe(10);              // From profile
      expect(result.maxTurns).toBe(5);           // From override
    });

    it('global + project profiles merge correctly via show()', async () => {
      const pm = new ProfileManagerImpl(paths);
      await pm.set('layered', { model: 'sonnet', temperature: 0.5 }, { scope: 'global' });
      await pm.set('layered', { temperature: 1.0, topK: 10 }, { scope: 'project' });

      const resolved = await pm.show('layered');
      expect(resolved.data.model).toBe('sonnet');    // From global
      expect(resolved.data.temperature).toBe(1.0);   // Project wins
      expect(resolved.data.topK).toBe(10);           // From project
      expect(resolved.scope).toBe('project');
    });
  });

  // -------------------------------------------------------------------------
  // RetryPolicy defaults + validation
  // -------------------------------------------------------------------------
  describe('RetryPolicy defaults integrate with validation', () => {
    it('DEFAULT_RETRY_POLICY passes validation', () => {
      expect(() => validateRunOptions({
        agent: 'test',
        prompt: 'hi',
        retryPolicy: DEFAULT_RETRY_POLICY,
      })).not.toThrow();
    });

    it('DEFAULT_RETRY_POLICY values are frozen', () => {
      expect(Object.isFrozen(DEFAULT_RETRY_POLICY)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // StoragePaths integration
  // -------------------------------------------------------------------------
  describe('StoragePaths flows through client to ProfileManager', () => {
    it('client.storagePaths is accessible', () => {
      const client = createClient({
        configDir: paths.configDir,
        projectConfigDir: paths.projectConfigDir,
      });
      expect(client.storagePaths.configDir).toBe(paths.configDir);
      expect(client.storagePaths.projectConfigDir).toBe(paths.projectConfigDir);
    });
  });

  // -------------------------------------------------------------------------
  // Type composition
  // -------------------------------------------------------------------------
  describe('Types compose correctly', () => {
    it('RunOptions accepts the composed public types', () => {
      const opts: RunOptions = {
        agent: 'claude',
        prompt: 'test',
        model: 'sonnet',
        temperature: 1.0,
        topP: 0.9,
        topK: 40,
        maxTokens: 4096,
        maxOutputTokens: 2048,
        thinkingBudgetTokens: 2048,
        timeout: 60000,
        inactivityTimeout: 10000,
        maxTurns: 5,
        approvalMode: 'yolo',
        thinkingEffort: 'high',
        stream: 'auto',
        outputFormat: 'json',
        systemPromptMode: 'append',
        retryPolicy: {
          maxAttempts: 3,
          baseDelayMs: 1000,
          maxDelayMs: 30000,
          jitterFactor: 0.5,
          retryOn: ['RATE_LIMITED', 'TIMEOUT'],
        },
        mcpServers: [{
          name: 'test-server',
          transport: 'stdio',
          command: 'echo',
          args: ['hello'],
          env: { KEY: 'value' },
        }],
        attachments: [{
          filePath: new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'),
        }],
        gracePeriodMs: 5000,
        collectEvents: true,
        tags: ['test'],
      };

      // Should not throw
      expect(() => validateRunOptions(opts)).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // stripUndefined utility
  // -------------------------------------------------------------------------
  describe('stripUndefined works with merge pipeline', () => {
    it('removes undefined before merge', () => {
      const result = deepMerge(
        { a: 1, b: 2 },
        stripUndefined({ a: 3, b: undefined, c: 4 }),
      );
      expect(result).toEqual({ a: 3, b: 2, c: 4 });
    });
  });
});
