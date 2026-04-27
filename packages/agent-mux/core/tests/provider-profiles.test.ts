import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  loadProfile,
  loadProviderDefaults,
  loadProvidersFile,
  resolveProvidersFilePath,
  updateProviderDefaults,
  upsertProviderProfile,
  writeProvidersFile,
} from '../src/provider-profiles.js';

vi.mock('node:fs');
vi.mock('node:os');

const mockFs = vi.mocked(fs);
const mockOs = vi.mocked(os);

beforeEach(() => {
  mockOs.homedir.mockReturnValue('/home/testuser');
  mockFs.statSync.mockReturnValue({ mode: 0o600 } as any);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('loadProfile', () => {
  it('returns null when no files exist', () => {
    mockFs.readFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
    expect(loadProfile('nonexistent')).toBeNull();
  });

  it('loads profile from global file', () => {
    mockFs.readFileSync.mockImplementation((filePath: unknown) => {
      const p = String(filePath);
      if (p.includes('.amux')) {
        if (p.includes('testuser')) {
          return JSON.stringify({
            version: 1,
            profiles: {
              'work-bedrock': {
                provider: 'bedrock',
                model: 'anthropic.claude-sonnet-4-v1:0',
                params: { region: 'us-east-1' },
              },
            },
          });
        }
      }
      throw new Error('ENOENT');
    });

    const profile = loadProfile('work-bedrock');
    expect(profile).not.toBeNull();
    expect(profile!.provider).toBe('bedrock');
    expect(profile!.params!['region']).toBe('us-east-1');
  });

  it('project file takes precedence over global', () => {
    mockFs.readFileSync.mockImplementation((filePath: unknown) => {
      const p = String(filePath);
      if (p.includes('testuser')) {
        return JSON.stringify({
          version: 1,
          profiles: { myprofile: { provider: 'anthropic', model: 'global-model' } },
        });
      }
      // Project file
      return JSON.stringify({
        version: 1,
        profiles: { myprofile: { provider: 'bedrock', model: 'project-model' } },
      });
    });

    const profile = loadProfile('myprofile');
    expect(profile!.provider).toBe('bedrock');
    expect(profile!.model).toBe('project-model');
  });

  it('returns null when profile name not found in files', () => {
    mockFs.readFileSync.mockImplementation((filePath: unknown) => {
      const p = String(filePath);
      if (p.includes('testuser')) {
        return JSON.stringify({
          version: 1,
          profiles: { 'other-profile': { provider: 'anthropic' } },
        });
      }
      throw new Error('ENOENT');
    });

    expect(loadProfile('nonexistent')).toBeNull();
  });
});

describe('loadProviderDefaults', () => {
  it('returns null when no files exist', () => {
    mockFs.readFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
    expect(loadProviderDefaults()).toBeNull();
  });

  it('loads defaults from global file', () => {
    mockFs.readFileSync.mockImplementation((filePath: unknown) => {
      if (String(filePath).includes('home')) {
        return JSON.stringify({
          version: 1,
          defaults: { provider: 'bedrock', model: 'my-default' },
          profiles: {},
        });
      }
      throw new Error('ENOENT');
    });

    const defaults = loadProviderDefaults();
    expect(defaults!.provider).toBe('bedrock');
    expect(defaults!.model).toBe('my-default');
  });

  it('project defaults override global defaults', () => {
    mockFs.readFileSync.mockImplementation((filePath: unknown) => {
      const p = String(filePath);
      if (p.includes('testuser')) {
        return JSON.stringify({
          version: 1,
          defaults: { provider: 'anthropic', model: 'global-model' },
          profiles: {},
        });
      }
      return JSON.stringify({
        version: 1,
        defaults: { provider: 'openai', model: 'project-model' },
        profiles: {},
      });
    });

    const defaults = loadProviderDefaults();
    expect(defaults!.provider).toBe('openai');
    expect(defaults!.model).toBe('project-model');
  });

  it('merges partial project defaults with global defaults', () => {
    mockFs.readFileSync.mockImplementation((filePath: unknown) => {
      const p = String(filePath);
      if (p.includes('testuser')) {
        return JSON.stringify({
          version: 1,
          defaults: { provider: 'anthropic', model: 'global-model' },
          profiles: {},
        });
      }
      return JSON.stringify({
        version: 1,
        defaults: { model: 'project-model' },
        profiles: {},
      });
    });

    const defaults = loadProviderDefaults();
    expect(defaults!.provider).toBe('anthropic');
    expect(defaults!.model).toBe('project-model');
  });
});

describe('providers file persistence helpers', () => {
  it('resolves the expected scope paths', () => {
    expect(resolveProvidersFilePath()).toBe(path.join(process.cwd(), '.amux', 'providers.json'));
    expect(resolveProvidersFilePath({ scope: 'global' })).toBe(path.join('/home/testuser', '.amux', 'providers.json'));
  });

  it('loads the scoped providers file directly', () => {
    const projectProvidersPath = resolveProvidersFilePath();
    mockFs.readFileSync.mockImplementation((filePath: unknown) => {
      if (String(filePath) === projectProvidersPath) {
        return JSON.stringify({
          version: 1,
          profiles: {
            project: {
              provider: 'openai',
              model: 'gpt-5.4',
            },
          },
        });
      }
      throw new Error('ENOENT');
    });

    expect(loadProvidersFile()).toEqual({
      version: 1,
      profiles: {
        project: {
          provider: 'openai',
          model: 'gpt-5.4',
        },
      },
    });
  });

  it('writes normalized providers files with secure permissions', () => {
    const projectProvidersPath = resolveProvidersFilePath();
    const projectProvidersDir = path.dirname(projectProvidersPath);
    const result = writeProvidersFile({
      version: 1,
      profiles: {
        deploy: {
          provider: 'anthropic',
        },
      },
    });

    expect(result.filePath).toBe(projectProvidersPath);
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(projectProvidersDir, { recursive: true });
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      projectProvidersPath,
      expect.stringContaining('"deploy"'),
      expect.objectContaining({ mode: 0o600 }),
    );
    if (process.platform !== 'win32') {
      expect(mockFs.chmodSync).toHaveBeenCalledWith(projectProvidersPath, 0o600);
    }
  });

  it('upserts a provider profile into the scoped file', () => {
    const projectProvidersPath = resolveProvidersFilePath();
    mockFs.readFileSync.mockImplementation(() => JSON.stringify({
      version: 1,
      profiles: {
        existing: { provider: 'anthropic' },
      },
    }));

    const result = upsertProviderProfile('deploy', {
      provider: 'openai',
      model: 'gpt-5.4',
    });

    expect(result.profile).toEqual({
      provider: 'openai',
      model: 'gpt-5.4',
    });
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      projectProvidersPath,
      expect.stringContaining('"deploy"'),
      expect.any(Object),
    );
  });

  it('updates defaults in the scoped file', () => {
    const projectProvidersPath = resolveProvidersFilePath();
    mockFs.readFileSync.mockImplementation(() => JSON.stringify({
      version: 1,
      profiles: {},
    }));

    const result = updateProviderDefaults({
      provider: 'openai',
      model: 'gpt-5.4',
    });

    expect(result.defaults).toEqual({
      provider: 'openai',
      model: 'gpt-5.4',
    });
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      projectProvidersPath,
      expect.stringContaining('"defaults"'),
      expect.any(Object),
    );
  });
});
