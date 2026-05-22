/**
 * Unified hooks system — types + HookConfigManager.
 *
 * Provides a harness-agnostic format for hook payloads and results so amux
 * can dispatch to user-registered hooks and programmatic built-ins regardless
 * of which harness emitted the event.
 *
 * Configs are stored at:
 *   - `~/.amux/hooks.json` (global)
 *   - `<cwd>/.amux/hooks.json` (project — overrides global by id)
 */

import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs/promises';
import type { AgentName } from './types.js';
import { writeJsonAtomic } from './atomic-fs.js';

/** Unified hook payload shape. */
export interface UnifiedHookPayload {
  agent: AgentName;
  hookType: string;
  sessionId?: string;
  timestamp: string;
  /** Normalized fields: tool_name, tool_input, tool_output, prompt, message, etc. */
  data: Record<string, unknown>;
  /** The original harness-specific payload (for round-trip). */
  raw: Record<string, unknown>;
}

/** Unified hook result. */
export interface UnifiedHookResult {
  decision?: 'allow' | 'deny' | 'modify';
  message?: string;
  modifiedInput?: Record<string, unknown>;
  stdout?: string;
  exitCode?: number;
}

/** Registration entry in hooks.json. */
export interface HookRegistration {
  id: string;
  agent: AgentName | '*';
  hookType: string | '*';
  handler: 'builtin' | 'command' | 'script';
  target: string;
  priority?: number;
  enabled?: boolean;
  metadata?: Record<string, unknown>;
}

/** Scope selector for add/set operations. */
export type HookScope = 'global' | 'project';

/** Persisted shape of hooks.json. */
interface HooksFile {
  version: 1;
  hooks: HookRegistration[];
}

function defaultGlobalPath(): string {
  return path.join(os.homedir(), '.amux', 'hooks.json');
}

function defaultProjectPath(cwd: string = process.cwd()): string {
  return path.join(cwd, '.amux', 'hooks.json');
}

async function readFile(p: string): Promise<HooksFile> {
  try {
    const raw = await fs.readFile(p, 'utf8');
    const parsed = JSON.parse(raw) as Partial<HooksFile>;
    if (!parsed || !Array.isArray(parsed.hooks)) {
      return { version: 1, hooks: [] };
    }
    return { version: 1, hooks: parsed.hooks };
  } catch {
    return { version: 1, hooks: [] };
  }
}

async function writeFile(p: string, data: HooksFile): Promise<void> {
  await writeJsonAtomic(p, data);
}

/**
 * Manages user-registered hook registrations across global + project scope.
 */
export class HookConfigManager {
  readonly globalPath: string;
  readonly projectPath: string;

  constructor(globalPath?: string, projectPath?: string) {
    this.globalPath = globalPath ?? defaultGlobalPath();
    this.projectPath = projectPath ?? defaultProjectPath();
  }

  /** Returns the merged hook list (project overrides global by id). */
  async list(): Promise<HookRegistration[]> {
    const [g, p] = await Promise.all([
      readFile(this.globalPath),
      readFile(this.projectPath),
    ]);
    const byId = new Map<string, HookRegistration>();
    for (const h of g.hooks) byId.set(h.id, h);
    for (const h of p.hooks) byId.set(h.id, h);
    return Array.from(byId.values());
  }

  async add(reg: HookRegistration, scope: HookScope = 'project'): Promise<void> {
    const target = scope === 'global' ? this.globalPath : this.projectPath;
    const file = await readFile(target);
    const existing = file.hooks.findIndex((h) => h.id === reg.id);
    if (existing >= 0) {
      file.hooks[existing] = reg;
    } else {
      file.hooks.push(reg);
    }
    await writeFile(target, file);
  }

  async remove(id: string, scope?: HookScope): Promise<boolean> {
    const scopes: HookScope[] = scope ? [scope] : ['project', 'global'];
    let removed = false;
    for (const s of scopes) {
      const target = s === 'global' ? this.globalPath : this.projectPath;
      const file = await readFile(target);
      const before = file.hooks.length;
      file.hooks = file.hooks.filter((h) => h.id !== id);
      if (file.hooks.length !== before) {
        await writeFile(target, file);
        removed = true;
      }
    }
    return removed;
  }

  async set(id: string, patch: Partial<HookRegistration>): Promise<HookRegistration | null> {
    // Prefer project scope; fall back to global.
    for (const target of [this.projectPath, this.globalPath]) {
      const file = await readFile(target);
      const idx = file.hooks.findIndex((h) => h.id === id);
      if (idx >= 0) {
        const merged = { ...file.hooks[idx], ...patch, id } as HookRegistration;
        file.hooks[idx] = merged;
        await writeFile(target, file);
        return merged;
      }
    }
    return null;
  }

  /** Returns matching hooks sorted by priority asc (default 100). Only enabled. */
  async getForAgent(agent: AgentName, hookType: string): Promise<HookRegistration[]> {
    const all = await this.list();
    const matching = all.filter((h) => {
      if (h.enabled === false) return false;
      if (h.agent !== '*' && h.agent !== agent) return false;
      if (h.hookType !== '*' && h.hookType !== hookType) return false;
      return true;
    });
    matching.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
    return matching;
  }
}
