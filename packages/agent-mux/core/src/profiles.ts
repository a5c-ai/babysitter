/**
 * Profile management for @a5c-ai/agent-mux.
 *
 * Profiles are named RunOptions presets stored as JSON files in the
 * global config directory (`~/.agent-mux/profiles/`) or the project
 * config directory (`.agent-mux/profiles/`).
 *
 * @see 02-run-options-and-profiles.md §10
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { AgentName, ProfileData } from './types.js';
import type { StoragePaths } from './storage.js';
import type { RunOptions } from './run-options.js';
import { AgentMuxError, ValidationError } from './errors.js';
import { validateProfileData } from './run-options.js';
import { deepMerge } from './merge.js';

// ---------------------------------------------------------------------------
// Types (§10.1)
// ---------------------------------------------------------------------------

/** Options for filtering profile listings. */
export interface ProfileListOptions {
  /** Filter by scope. If omitted, both global and project profiles are listed. */
  scope?: 'global' | 'project';
}

/** Metadata for a single profile entry in a listing. */
export interface ProfileEntry {
  /** Profile name (filename without `.json` extension). */
  name: string;

  /** Where this profile is stored. `'project'` if present in both. */
  scope: 'global' | 'project';

  /** Whether a global profile is also present (only relevant for project scope). */
  hasGlobalOverride: boolean;

  /** The agent specified in this profile, if any. */
  agent?: AgentName;

  /** The model specified in this profile, if any. */
  model?: string;

  /** `true` if the profile file exists but could not be parsed. */
  corrupt?: boolean;
}

/** A resolved profile: the merged result of global + project data. */
export interface ResolvedProfile {
  /** Profile name. */
  name: string;

  /** The resolved profile data after merging global and project layers. */
  data: ProfileData;

  /** Source scope of the resolved profile. */
  scope: 'global' | 'project';

  /** Absolute path to the global profile file, if it exists. */
  globalPath?: string;

  /** Absolute path to the project profile file, if it exists. */
  projectPath?: string;
}

/** Options for writing a profile. */
export interface ProfileSetOptions {
  /**
   * Target scope for the profile file.
   * @default 'project' (if a project directory exists, else 'global')
   */
  scope?: 'global' | 'project';
}

/** Options for deleting a profile. */
export interface ProfileDeleteOptions {
  /**
   * Target scope to delete from.
   * If undefined, prefers project scope: deletes from project if found there,
   * else falls back to global.
   */
  scope?: 'global' | 'project';
}

// ---------------------------------------------------------------------------
// ProfileManager interface (§10)
// ---------------------------------------------------------------------------

/**
 * Manages named RunOptions presets (profiles).
 *
 * @see 02-run-options-and-profiles.md §10
 */
export interface ProfileManager {
  /** List all available profiles, sorted by name. */
  list(options?: ProfileListOptions): Promise<ProfileEntry[]>;

  /** Show the resolved contents of a named profile. */
  show(name: string): Promise<ResolvedProfile>;

  /** Create or update a named profile. */
  set(name: string, data: ProfileData, options?: ProfileSetOptions): Promise<void>;

  /** Delete a named profile. */
  delete(name: string, options?: ProfileDeleteOptions): Promise<void>;

  /** Apply a profile to partial RunOptions, returning the merged result. */
  apply(name: string, overrides?: Partial<RunOptions>): Promise<Partial<RunOptions>>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Profile name validation pattern. */
const PROFILE_NAME_RE = /^[a-zA-Z0-9_-]{1,64}$/;

// ---------------------------------------------------------------------------
// ProfileManagerImpl
// ---------------------------------------------------------------------------

/** Implementation of the ProfileManager interface. */
export class ProfileManagerImpl implements ProfileManager {
  private readonly globalProfilesDir: string;
  private readonly projectProfilesDir: string;

  constructor(storagePaths: StoragePaths) {
    this.globalProfilesDir = storagePaths.globalProfilesDir;
    this.projectProfilesDir = storagePaths.projectProfilesDir;
  }

  async list(options?: ProfileListOptions): Promise<ProfileEntry[]> {
    const globalEntries = (!options?.scope || options.scope === 'global')
      ? this.listDir(this.globalProfilesDir, 'global')
      : [];
    const projectEntries = (!options?.scope || options.scope === 'project')
      ? this.listDir(this.projectProfilesDir, 'project')
      : [];

    // Build map: global first, project overrides
    const byName = new Map<string, ProfileEntry>();
    const globalNames = new Set<string>();

    for (const entry of globalEntries) {
      globalNames.add(entry.name);
      byName.set(entry.name, entry);
    }

    for (const entry of projectEntries) {
      const hasGlobal = globalNames.has(entry.name);
      entry.hasGlobalOverride = hasGlobal;

      if (hasGlobal && !entry.corrupt) {
        // Merge global data into the project entry for agent/model display
        const globalEntry = byName.get(entry.name)!;
        if (!globalEntry.corrupt) {
          // agent/model: project wins if set, else falls back to global
          entry.agent = entry.agent ?? globalEntry.agent;
          entry.model = entry.model ?? globalEntry.model;
        }
      }

      byName.set(entry.name, entry);
    }

    // Sort by name
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async show(name: string): Promise<ResolvedProfile> {
    validateProfileName(name);

    const globalPath = path.join(this.globalProfilesDir, `${name}.json`);
    const projectPath = path.join(this.projectProfilesDir, `${name}.json`);

    const globalResult = this.readProfileFile(globalPath);
    const projectResult = this.readProfileFile(projectPath);

    if (globalResult === null && projectResult === null) {
      throw new AgentMuxError('PROFILE_NOT_FOUND', `Profile "${name}" not found`);
    }

    // Throw CONFIG_ERROR for corrupt files (§12.5)
    if (globalResult?.corrupt) {
      throw new AgentMuxError('CONFIG_ERROR', `Profile "${name}" at ${globalPath} is corrupt: invalid JSON`);
    }
    if (projectResult?.corrupt) {
      throw new AgentMuxError('CONFIG_ERROR', `Profile "${name}" at ${projectPath} is corrupt: invalid JSON`);
    }

    let merged: ProfileData = {};
    let scope: 'global' | 'project' = 'global';

    if (globalResult?.data) {
      merged = globalResult.data;
    }
    if (projectResult?.data) {
      merged = deepMerge(merged as Record<string, unknown>, projectResult.data as Record<string, unknown>) as ProfileData;
      scope = 'project';
    }

    return {
      name,
      data: merged,
      scope,
      globalPath: globalResult ? globalPath : undefined,
      projectPath: projectResult ? projectPath : undefined,
    };
  }

  async set(name: string, data: ProfileData, options?: ProfileSetOptions): Promise<void> {
    validateProfileName(name);
    validateProfileData(data as Record<string, unknown>);

    const scope = options?.scope ?? this.resolveDefaultScope();
    const dir = scope === 'global' ? this.globalProfilesDir : this.projectProfilesDir;
    const filePath = path.join(dir, `${name}.json`);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async delete(name: string, options?: ProfileDeleteOptions): Promise<void> {
    validateProfileName(name);

    if (options?.scope) {
      // Explicit scope
      const dir = options.scope === 'global' ? this.globalProfilesDir : this.projectProfilesDir;
      this.deleteFile(path.join(dir, `${name}.json`), name, options.scope);
    } else {
      // Prefer project scope
      const projectPath = path.join(this.projectProfilesDir, `${name}.json`);
      if (fs.existsSync(projectPath)) {
        this.deleteFile(projectPath, name, 'project');
      } else {
        const globalPath = path.join(this.globalProfilesDir, `${name}.json`);
        this.deleteFile(globalPath, name, 'global');
      }
    }
  }

  async apply(name: string, overrides?: Partial<RunOptions>): Promise<Partial<RunOptions>> {
    const resolved = await this.show(name);
    if (overrides) {
      return deepMerge(
        resolved.data as Record<string, unknown>,
        overrides as Record<string, unknown>,
      ) as Partial<RunOptions>;
    }
    return resolved.data as Partial<RunOptions>;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private resolveDefaultScope(): 'global' | 'project' {
    try {
      fs.statSync(this.projectProfilesDir);
      return 'project';
    } catch {
      // If project dir doesn't exist, check parent
      try {
        const parent = path.dirname(this.projectProfilesDir);
        fs.statSync(parent);
        return 'project';
      } catch {
        return 'global';
      }
    }
  }

  private deleteFile(filePath: string, name: string, scope: string): void {
    try {
      fs.unlinkSync(filePath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new AgentMuxError('PROFILE_NOT_FOUND', `Profile "${name}" not found in ${scope} scope`);
      }
      throw err;
    }
  }

  private listDir(dir: string, scope: 'global' | 'project'): ProfileEntry[] {
    const entries: ProfileEntry[] = [];
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const name = file.slice(0, -5);
          if (PROFILE_NAME_RE.test(name)) {
            const filePath = path.join(dir, file);
            const result = this.readProfileFile(filePath);
            if (result?.corrupt) {
              entries.push({ name, scope, hasGlobalOverride: false, corrupt: true });
            } else {
              const data = result?.data;
              entries.push({
                name,
                scope,
                hasGlobalOverride: false,
                agent: data?.agent,
                model: data?.model,
              });
            }
          }
        }
      }
    } catch {
      // Directory does not exist — no profiles in this scope
    }
    return entries;
  }

  /**
   * Read and parse a profile JSON file.
   * Returns null if the file does not exist.
   * Returns { corrupt: true } for unparseable files (§12.5).
   */
  private readProfileFile(filePath: string): { data?: ProfileData; corrupt?: boolean } | null {
    let raw: string;
    try {
      raw = fs.readFileSync(filePath, 'utf-8');
    } catch {
      return null; // File does not exist
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { corrupt: true };
      }
      return { data: parsed as ProfileData };
    } catch {
      return { corrupt: true };
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validateProfileName(name: string): void {
  if (!PROFILE_NAME_RE.test(name)) {
    throw new ValidationError([{
      field: 'name',
      message: 'must match ^[a-zA-Z0-9_-]{1,64}$',
      received: name,
      expected: 'string matching ^[a-zA-Z0-9_-]{1,64}$',
    }]);
  }
}
