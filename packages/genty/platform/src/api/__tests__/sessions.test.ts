import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { apiListSessions, apiGetSession, apiCreateSession, apiDeleteSession } from '../sessions';

describe('JSON session API', () => {
  let tempDir: string;
  beforeEach(() => { tempDir = mkdtempSync(join(tmpdir(), 'sessions-')); });
  afterEach(() => { rmSync(tempDir, { recursive: true, force: true }); });

  it('creates and lists sessions', () => {
    apiCreateSession(tempDir, { id: 's1' });
    apiCreateSession(tempDir, { id: 's2' });
    const list = apiListSessions(tempDir);
    expect(list).toHaveLength(2);
    expect(list.map(s => s.id).sort()).toEqual(['s1', 's2']);
  });

  it('gets session detail', () => {
    apiCreateSession(tempDir, { id: 'detail', metadata: { custom: 'value' } });
    const detail = apiGetSession(tempDir, 'detail');
    expect(detail?.id).toBe('detail');
    expect(detail?.metadata.custom).toBe('value');
  });

  it('returns undefined for missing session', () => {
    expect(apiGetSession(tempDir, 'nope')).toBeUndefined();
  });

  it('deletes sessions', () => {
    apiCreateSession(tempDir, { id: 'del' });
    expect(apiDeleteSession(tempDir, 'del')).toBe(true);
    expect(apiDeleteSession(tempDir, 'del')).toBe(false);
    expect(apiListSessions(tempDir)).toHaveLength(0);
  });
});
