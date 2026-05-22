/**
 * Built-in programmatic hooks. Registered by id; invoked via HookDispatcher
 * when a registration has handler='builtin' and target=<id>.
 */

import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs/promises';
import type { UnifiedHookPayload, UnifiedHookResult } from './hooks.js';

export type BuiltInHookFn = (payload: UnifiedHookPayload) => Promise<UnifiedHookResult> | UnifiedHookResult;

export interface BuiltInHookEntry {
  id: string;
  description: string;
  /** If set, only runs for this agent. '*' or undefined = any. */
  agent?: string;
  fn: BuiltInHookFn;
}

const DEFAULT_LOG_PATH = path.join(os.homedir(), '.amux', 'hook-log.jsonl');

async function appendJsonl(file: string, obj: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.appendFile(file, JSON.stringify(obj) + '\n', 'utf8');
}

/** Registry of programmatic built-in hooks. */
export class BuiltInHooksRegistry {
  private readonly entries = new Map<string, BuiltInHookEntry>();

  constructor(logPath: string = DEFAULT_LOG_PATH) {
    // Generic: log every hook payload as JSONL.
    this.register({
      id: 'log',
      description: 'Append the hook payload to ~/.amux/hook-log.jsonl.',
      fn: async (payload) => {
        await appendJsonl(logPath, {
          t: payload.timestamp,
          agent: payload.agent,
          hookType: payload.hookType,
          sessionId: payload.sessionId,
        });
        return { decision: 'allow' };
      },
    });

    // Generic: emit a short trace line to stdout.
    this.register({
      id: 'trace',
      description: 'Emit a single-line trace to stdout.',
      fn: (payload) => ({
        decision: 'allow',
        stdout: `[amux hook] ${payload.agent}/${payload.hookType} ${payload.sessionId ?? ''}\n`,
      }),
    });

    // Claude-specific: capture SessionStart/Stop metadata.
    this.register({
      id: 'claude.session-capture',
      description: 'Capture claude session metadata (CLAUDE_PROJECT_DIR, session_id).',
      agent: 'claude',
      fn: async (payload) => {
        await appendJsonl(logPath, {
          t: payload.timestamp,
          kind: 'claude.session-capture',
          sessionId: payload.sessionId,
          data: payload.data,
        });
        return { decision: 'allow' };
      },
    });
  }

  register(entry: BuiltInHookEntry): void {
    this.entries.set(entry.id, entry);
  }

  get(id: string): BuiltInHookEntry | undefined {
    return this.entries.get(id);
  }

  list(agent?: string): BuiltInHookEntry[] {
    const out: BuiltInHookEntry[] = [];
    for (const e of this.entries.values()) {
      if (!e.agent || e.agent === '*' || !agent || e.agent === agent) out.push(e);
    }
    return out;
  }

  async run(id: string, payload: UnifiedHookPayload): Promise<UnifiedHookResult> {
    const entry = this.entries.get(id);
    if (!entry) {
      return { decision: 'allow', message: `no built-in hook named "${id}"` };
    }
    return await entry.fn(payload);
  }
}

/** Process-wide default registry. */
export const builtInHooks = new BuiltInHooksRegistry();
