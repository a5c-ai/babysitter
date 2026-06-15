import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export interface SessionListItem {
  id: string;
  createdAt: string;
  lastRunId?: string;
}

export interface SessionDetailResponse extends SessionListItem {
  metadata: Record<string, unknown>;
}

export interface SessionCreateOptions {
  id?: string;
  metadata?: Record<string, unknown>;
}

const SESSION_META = 'session-meta.json';

export function apiListSessions(stateDir: string): SessionListItem[] {
  if (!existsSync(stateDir)) return [];
  const items: SessionListItem[] = [];
  for (const entry of readdirSync(stateDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const metaPath = join(stateDir, entry.name, SESSION_META);
    if (!existsSync(metaPath)) continue;
    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
      items.push({ id: entry.name, createdAt: meta.createdAt ?? '', lastRunId: meta.lastRunId });
    } catch {
      items.push({ id: entry.name, createdAt: '' });
    }
  }
  return items;
}

export function apiGetSession(stateDir: string, sessionId: string): SessionDetailResponse | undefined {
  const dir = join(stateDir, sessionId);
  const metaPath = join(dir, SESSION_META);
  if (!existsSync(metaPath)) return undefined;
  try {
    const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
    return { id: sessionId, createdAt: meta.createdAt ?? '', lastRunId: meta.lastRunId, metadata: meta };
  } catch {
    return undefined;
  }
}

export function apiCreateSession(stateDir: string, options?: SessionCreateOptions): SessionListItem {
  const id = options?.id ?? randomUUID();
  const dir = join(stateDir, id);
  mkdirSync(dir, { recursive: true });
  const meta = { createdAt: new Date().toISOString(), ...options?.metadata };
  writeFileSync(join(dir, SESSION_META), JSON.stringify(meta, null, 2), 'utf8');
  return { id, createdAt: meta.createdAt };
}

export function apiDeleteSession(stateDir: string, sessionId: string): boolean {
  const dir = join(stateDir, sessionId);
  if (!existsSync(dir)) return false;
  rmSync(dir, { recursive: true, force: true });
  return true;
}
