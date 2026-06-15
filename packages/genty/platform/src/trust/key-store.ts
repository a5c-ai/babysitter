import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createKeyPair } from '@a5c-ai/genty-core/trust';
import type { IdentityKeyPair } from '@a5c-ai/genty-core/trust';

const KEYS_DIR = join(homedir(), '.genty', 'keys');

export interface StoredKey {
  id: string;
  keyPair: IdentityKeyPair;
  createdAt: string;
  label?: string;
}

export function getKeysDir(): string {
  return KEYS_DIR;
}

export function ensureKeysDir(): string {
  if (!existsSync(KEYS_DIR)) mkdirSync(KEYS_DIR, { recursive: true });
  return KEYS_DIR;
}

export function generateAndStore(id: string, label?: string): StoredKey {
  const dir = ensureKeysDir();
  const keyPair = createKeyPair();
  const stored: StoredKey = {
    id,
    keyPair,
    createdAt: new Date().toISOString(),
    label,
  };
  writeFileSync(join(dir, `${id}.json`), JSON.stringify(stored, null, 2), 'utf8');
  return stored;
}

export function loadKey(id: string): StoredKey | undefined {
  const keyPath = join(KEYS_DIR, `${id}.json`);
  if (!existsSync(keyPath)) return undefined;
  return JSON.parse(readFileSync(keyPath, 'utf8')) as StoredKey;
}

export function loadOrCreate(id: string, label?: string): StoredKey {
  return loadKey(id) ?? generateAndStore(id, label);
}

export function listKeys(): StoredKey[] {
  if (!existsSync(KEYS_DIR)) return [];
  const entries: StoredKey[] = [];
  for (const file of readdirSync(KEYS_DIR)) {
    if (!file.endsWith('.json')) continue;
    try {
      entries.push(JSON.parse(readFileSync(join(KEYS_DIR, file), 'utf8')) as StoredKey);
    } catch {
      // skip corrupt key files
    }
  }
  return entries;
}

export function deleteKey(id: string): boolean {
  const keyPath = join(KEYS_DIR, `${id}.json`);
  if (!existsSync(keyPath)) return false;
  unlinkSync(keyPath);
  return true;
}
