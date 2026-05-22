import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { loadHistory, appendHistory } from '../src/prompt-history-store.js';

let tmpDir: string;
let file: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-tui-hist-'));
  file = path.join(tmpDir, 'history');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('prompt-history-store', () => {
  it('returns empty when file missing', () => {
    expect(loadHistory(file)).toEqual([]);
  });

  it('append+load round-trips, preserves order, ignores blank entries', () => {
    appendHistory('first', file);
    appendHistory('second', file);
    appendHistory('   ', file);
    appendHistory('third', file);
    expect(loadHistory(file)).toEqual(['first', 'second', 'third']);
  });

  it('skips malformed lines without throwing', () => {
    fs.writeFileSync(file, '"ok"\nnot-json\n"also ok"\n', 'utf8');
    expect(loadHistory(file)).toEqual(['ok', 'also ok']);
  });
});
