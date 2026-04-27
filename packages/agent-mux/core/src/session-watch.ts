/**
 * Filesystem-watch helper for SessionManagerImpl.watch().
 *
 * Produces a synthetic `text_delta` event whenever a file matching the
 * session id changes size. Split out of session-manager.ts to keep the
 * main module under the file-size budget — no behavior change.
 */

import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';

import type { AgentName } from './types.js';
import type { AgentEvent } from './events.js';

/** Minimal adapter surface used by `watchSession`. */
export interface WatchableAdapter {
  sessionDir?: () => string;
  listSessionFiles: () => Promise<string[]>;
}

/**
 * Async-generator implementation used by `SessionManagerImpl.watch()`.
 * Yields events for the given session until the consumer stops iterating.
 */
export async function* watchSession(
  adapter: WatchableAdapter,
  agent: AgentName,
  sessionId: string,
): AsyncIterable<AgentEvent> {
  const dir = typeof adapter.sessionDir === 'function' ? adapter.sessionDir() : '';
  let exists = false;
  try {
    const st = await fsp.stat(dir);
    exists = st.isDirectory();
  } catch {
    exists = false;
  }
  if (!exists) {
    return;
  }

  const matchesSession = (p: string): boolean => path.basename(p).includes(sessionId);
  const lastSize = new Map<string, number>();

  const queue: AgentEvent[] = [];
  let resolveNext: (() => void) | null = null;
  let done = false;

  const push = (event: AgentEvent): void => {
    queue.push(event);
    if (resolveNext) {
      const r = resolveNext;
      resolveNext = null;
      r();
    }
  };

  let debounceTimer: NodeJS.Timeout | null = null;
  const scanForChanges = async (): Promise<void> => {
    try {
      const files = await adapter.listSessionFiles();
      for (const fp of files) {
        if (!matchesSession(fp)) continue;
        try {
          const st = await fsp.stat(fp);
          const prev = lastSize.get(fp) ?? 0;
          if (st.size !== prev) {
            lastSize.set(fp, st.size);
            push({
              type: 'text_delta',
              runId: '',
              agent,
              timestamp: Date.now(),
              delta: '',
              accumulated: '',
            } as AgentEvent);
          }
        } catch {
          // ignore per-file stat failure
        }
      }
    } catch {
      // ignore adapter listing failure
    }
  };

  let watcher: fs.FSWatcher | null = null;
  try {
    watcher = fs.watch(dir, { recursive: true }, () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void scanForChanges();
      }, 200);
    });
  } catch {
    return;
  }

  try {
    while (!done) {
      if (queue.length > 0) {
        yield queue.shift()!;
        continue;
      }
      await new Promise<void>((resolve) => {
        resolveNext = resolve;
      });
    }
  } finally {
    done = true;
    if (debounceTimer) clearTimeout(debounceTimer);
    if (watcher) watcher.close();
  }
}
