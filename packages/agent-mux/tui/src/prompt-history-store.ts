import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const MAX_ENTRIES = 200;

export function defaultHistoryPath(): string {
  if (process.env.AMUX_TUI_PROMPT_HISTORY) return process.env.AMUX_TUI_PROMPT_HISTORY;
  const home = os.homedir() || '.';
  return path.join(home, '.agent-mux', 'tui-prompt-history');
}

export function loadHistory(filePath: string = defaultHistoryPath()): string[] {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw
      .split('\n')
      .map((line) => {
        try {
          return JSON.parse(line) as string;
        } catch {
          return null;
        }
      })
      .filter((s): s is string => typeof s === 'string' && s.length > 0)
      .slice(-MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function appendHistory(prompt: string, filePath: string = defaultHistoryPath()): void {
  if (!prompt.trim()) return;
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.appendFileSync(filePath, JSON.stringify(prompt) + '\n', 'utf8');
  } catch {
    // best-effort; never throw on history write
  }
}
