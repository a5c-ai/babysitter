/**
 * Plugin management — install, uninstall, enable, disable, and list plugins
 * with persistent state stored in a configurable directory (GAP-USER-017).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TrustLevel = 'untrusted' | 'community' | 'verified' | 'official';

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  trustLevel: TrustLevel;
  installed: boolean;
  enabled: boolean;
}

interface PluginStateFile {
  plugins: Record<string, PluginInfo>;
}

// ---------------------------------------------------------------------------
// PluginManager
// ---------------------------------------------------------------------------

const STATE_FILENAME = 'plugins-state.json';

export class PluginManager {
  private readonly statePath: string;

  constructor(private readonly stateDir: string) {
    this.statePath = join(stateDir, STATE_FILENAME);
  }

  /** List all known plugins. */
  list(): PluginInfo[] {
    const state = this.readState();
    return Object.values(state.plugins);
  }

  /** Install a plugin by id. Marks it as installed and enabled. */
  install(id: string): PluginInfo {
    const state = this.readState();
    const existing = state.plugins[id];
    if (existing?.installed) {
      return existing;
    }
    const info: PluginInfo = existing
      ? { ...existing, installed: true, enabled: true }
      : {
          id,
          name: id,
          version: '0.0.0',
          trustLevel: 'untrusted',
          installed: true,
          enabled: true,
        };
    state.plugins[id] = info;
    this.writeState(state);
    return info;
  }

  /** Uninstall a plugin by id. */
  uninstall(id: string): void {
    const state = this.readState();
    const existing = state.plugins[id];
    if (!existing) return;
    existing.installed = false;
    existing.enabled = false;
    this.writeState(state);
  }

  /** Enable an installed plugin. */
  enable(id: string): void {
    const state = this.readState();
    const existing = state.plugins[id];
    if (!existing || !existing.installed) {
      throw new Error(`Plugin "${id}" is not installed`);
    }
    existing.enabled = true;
    this.writeState(state);
  }

  /** Disable an installed plugin (keeps it installed). */
  disable(id: string): void {
    const state = this.readState();
    const existing = state.plugins[id];
    if (!existing || !existing.installed) {
      throw new Error(`Plugin "${id}" is not installed`);
    }
    existing.enabled = false;
    this.writeState(state);
  }

  /** Get info for a single plugin, or undefined if unknown. */
  getInfo(id: string): PluginInfo | undefined {
    const state = this.readState();
    return state.plugins[id];
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private readState(): PluginStateFile {
    if (!existsSync(this.statePath)) {
      return { plugins: {} };
    }
    const raw = readFileSync(this.statePath, 'utf-8');
    return JSON.parse(raw) as PluginStateFile;
  }

  private writeState(state: PluginStateFile): void {
    if (!existsSync(this.stateDir)) {
      mkdirSync(this.stateDir, { recursive: true });
    }
    writeFileSync(this.statePath, JSON.stringify(state, null, 2), 'utf-8');
  }
}
