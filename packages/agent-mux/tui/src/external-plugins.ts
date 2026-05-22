import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { pathToFileURL } from 'node:url';
import type { TuiPlugin } from './plugin.js';

function resolveHomeDir(): string {
  const env = Reflect.get(process, 'env') as NodeJS.ProcessEnv | undefined;
  return env?.HOME || env?.USERPROFILE || os.homedir() || '.';
}

export function defaultExternalPluginsDir(): string {
  if (process.env.AMUX_TUI_PLUGINS_DIR) return process.env.AMUX_TUI_PLUGINS_DIR;
  const home = resolveHomeDir();
  return path.join(home, '.amux', 'tui-plugins');
}

export interface LoadResult {
  plugins: TuiPlugin[];
  errors: { source: string; error: string }[];
}

function isPlugin(value: unknown): value is TuiPlugin {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.name === 'string' && typeof v.register === 'function';
}

async function importEntry(entry: string): Promise<TuiPlugin[]> {
  const url = pathToFileURL(entry).href;
  const mod = (await import(url)) as Record<string, unknown>;
  const collected: TuiPlugin[] = [];
  if (isPlugin(mod.default)) collected.push(mod.default as TuiPlugin);
  for (const key of Object.keys(mod)) {
    if (key === 'default') continue;
    const v = mod[key];
    if (isPlugin(v)) collected.push(v);
  }
  return collected;
}

function findEntryFiles(dir: string): string[] {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
  const entries: string[] = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(full);
    } catch {
      continue;
    }
    if (stat.isFile() && /\.(mjs|cjs|js)$/.test(name)) {
      entries.push(full);
    } else if (stat.isDirectory()) {
      const candidates = ['index.mjs', 'index.cjs', 'index.js'];
      for (const c of candidates) {
        const candidate = path.join(full, c);
        if (fs.existsSync(candidate)) {
          entries.push(candidate);
          break;
        }
      }
    }
  }
  return entries;
}

export async function loadExternalPlugins(
  dir: string = defaultExternalPluginsDir(),
): Promise<LoadResult> {
  const result: LoadResult = { plugins: [], errors: [] };
  const entries = findEntryFiles(dir);
  for (const entry of entries) {
    try {
      const found = await importEntry(entry);
      if (found.length === 0) {
        result.errors.push({ source: entry, error: 'no TuiPlugin export found' });
        continue;
      }
      result.plugins.push(...found);
    } catch (e) {
      result.errors.push({ source: entry, error: (e as Error).message ?? String(e) });
    }
  }
  return result;
}
