import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface CrossRunStateStore {
  get(key: string): unknown | undefined;
  set(key: string, value: unknown): void;
  delete(key: string): boolean;
  listKeys(): string[];
}

const STATE_FILENAME = 'shared-state.json';

export function createCrossRunStateStore(stateDir: string): CrossRunStateStore {
  const filePath = join(stateDir, STATE_FILENAME);

  function load(): Record<string, unknown> {
    if (!existsSync(filePath)) return {};
    try {
      return JSON.parse(readFileSync(filePath, 'utf8'));
    } catch {
      return {};
    }
  }

  function save(data: Record<string, unknown>): void {
    if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true });
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  return {
    get(key: string): unknown | undefined {
      return load()[key];
    },
    set(key: string, value: unknown): void {
      const data = load();
      data[key] = value;
      save(data);
    },
    delete(key: string): boolean {
      const data = load();
      if (!(key in data)) return false;
      delete data[key];
      save(data);
      return true;
    },
    listKeys(): string[] {
      return Object.keys(load());
    },
  };
}
