import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { ProviderAuth } from './provider-config.js';

export type ProviderProfilesScope = 'global' | 'project';

export interface ProvidersFile {
  version: number;
  defaults?: {
    provider?: string;
    model?: string;
  };
  profiles: Record<string, ProviderProfileEntry>;
}

export interface ProviderProfileEntry {
  provider?: string;
  model?: string;
  transport?: string;
  auth?: Partial<ProviderAuth>;
  params?: Record<string, unknown>;
}

export interface ProviderProfilesFileOptions {
  scope?: ProviderProfilesScope;
  cwd?: string;
}

function tryReadJson(filePath: string): ProvidersFile | null {
  try {
    // Check permissions on non-Windows
    if (process.platform !== 'win32') {
      const stat = fs.statSync(filePath);
      const mode = stat.mode & 0o777;
      if ((mode & 0o077) !== 0) {
        console.error(`Warning: ${filePath} has permissions ${mode.toString(8)} — should be 600. Other users can read your provider credentials.`);
      }
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as ProvidersFile;
  } catch {
    return null;
  }
}

function resolveScopePaths(options: ProviderProfilesFileOptions = {}): {
  globalPath: string;
  projectPath: string;
} {
  return {
    globalPath: path.join(os.homedir(), '.amux', 'providers.json'),
    projectPath: path.join(options.cwd ?? process.cwd(), '.amux', 'providers.json'),
  };
}

export function resolveProvidersFilePath(options: ProviderProfilesFileOptions = {}): string {
  const { globalPath, projectPath } = resolveScopePaths(options);
  return (options.scope ?? 'project') === 'global' ? globalPath : projectPath;
}

function normalizeProvidersFile(file: ProvidersFile | null | undefined): ProvidersFile {
  const base = file ?? { version: 1, profiles: {} };
  return {
    ...base,
    version: base.version ?? 1,
    profiles: { ...(base.profiles ?? {}) },
  };
}

export function loadProvidersFile(options: ProviderProfilesFileOptions = {}): ProvidersFile | null {
  return tryReadJson(resolveProvidersFilePath(options));
}

export function writeProvidersFile(
  file: ProvidersFile,
  options: ProviderProfilesFileOptions = {},
): { filePath: string; file: ProvidersFile } {
  const filePath = resolveProvidersFilePath(options);
  const normalized = normalizeProvidersFile(file);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(normalized, null, 2)}\n`, {
    encoding: 'utf-8',
    mode: 0o600,
  });
  if (process.platform !== 'win32') {
    fs.chmodSync(filePath, 0o600);
  }

  return { filePath, file: normalized };
}

export function upsertProviderProfile(
  profileName: string,
  profile: ProviderProfileEntry,
  options: ProviderProfilesFileOptions = {},
): { filePath: string; file: ProvidersFile; profile: ProviderProfileEntry } {
  const current = normalizeProvidersFile(loadProvidersFile(options));
  current.profiles[profileName] = {
    ...(current.profiles[profileName] ?? {}),
    ...profile,
  };
  const written = writeProvidersFile(current, options);
  return {
    ...written,
    profile: written.file.profiles[profileName],
  };
}

export function updateProviderDefaults(
  defaults: ProvidersFile['defaults'],
  options: ProviderProfilesFileOptions = {},
): { filePath: string; file: ProvidersFile; defaults?: ProvidersFile['defaults'] } {
  const current = normalizeProvidersFile(loadProvidersFile(options));
  if (!defaults || (!defaults.provider && !defaults.model)) {
    delete current.defaults;
  } else {
    current.defaults = {
      ...(current.defaults ?? {}),
      ...defaults,
    };
  }
  const written = writeProvidersFile(current, options);
  return {
    ...written,
    defaults: written.file.defaults,
  };
}

/**
 * Load a named profile from ~/.amux/providers.json and .amux/providers.json.
 * Project-level file takes precedence over global.
 */
export function loadProfile(profileName: string): ProviderProfileEntry | null {
  const { globalPath, projectPath } = resolveScopePaths();

  const projectFile = tryReadJson(projectPath);
  if (projectFile?.profiles?.[profileName]) {
    return projectFile.profiles[profileName];
  }

  const globalFile = tryReadJson(globalPath);
  if (globalFile?.profiles?.[profileName]) {
    return globalFile.profiles[profileName];
  }

  return null;
}

/**
 * Load default provider settings from providers.json files.
 * Project-level defaults override global defaults.
 */
export function loadProviderDefaults(): ProviderProfileEntry | null {
  const { globalPath, projectPath } = resolveScopePaths();

  const globalFile = tryReadJson(globalPath);
  const projectFile = tryReadJson(projectPath);

  const globalDefaults = globalFile?.defaults;
  const projectDefaults = projectFile?.defaults;

  if (!globalDefaults && !projectDefaults) return null;

  return {
    provider: projectDefaults?.provider ?? globalDefaults?.provider,
    model: projectDefaults?.model ?? globalDefaults?.model,
  };
}
