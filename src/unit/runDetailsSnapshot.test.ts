import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
  appendRollingWindow,
  isFsPathInsideRoot,
  listFilesRecursive,
  listFilesSortedByMtimeDesc,
  readRunDetailsSnapshot,
} from '../core/runDetailsSnapshot';
import { JournalTailer } from '../core/journal';
import type { Run } from '../core/run';

function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

suite('runDetailsSnapshot', () => {
  test('isFsPathInsideRoot accepts paths within root and rejects outside', () => {
    const tempDir = makeTempDir('babysitter-runDetails-');
    try {
      const root = path.join(tempDir, 'run-20260105-010206');
      const inside = path.join(root, 'artifacts', 'x.txt');
      const outside = path.join(tempDir, 'other', 'x.txt');

      assert.strictEqual(isFsPathInsideRoot(root, inside), true);
      assert.strictEqual(isFsPathInsideRoot(root, root), true);
      assert.strictEqual(isFsPathInsideRoot(root, outside), false);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('appendRollingWindow keeps only the last N items', () => {
    assert.deepStrictEqual(appendRollingWindow([1, 2, 3], [4], 3), [2, 3, 4]);
    assert.deepStrictEqual(appendRollingWindow([], [1, 2, 3, 4], 2), [3, 4]);
    assert.deepStrictEqual(appendRollingWindow([1, 2], [], 5), [1, 2]);
    assert.deepStrictEqual(appendRollingWindow([1, 2], [3, 4], 0), []);
  });

  test('listFilesRecursive returns relative paths under rootForRel', () => {
    const tempDir = makeTempDir('babysitter-runDetails-');
    try {
      const dir = path.join(tempDir, 'artifacts');
      fs.mkdirSync(path.join(dir, 'nested'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'a.txt'), 'hello', 'utf8');
      fs.writeFileSync(path.join(dir, 'nested', 'b.txt'), 'world', 'utf8');

      const items = listFilesRecursive({ dir, rootForRel: dir, maxFiles: 50 });
      const rels = items.map((i) => i.relPath);
      assert.ok(rels.includes('a.txt'));
      assert.ok(rels.includes('nested'));
      assert.ok(rels.includes(path.join('nested', 'b.txt')));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('listFilesSortedByMtimeDesc sorts by newest mtime', async () => {
    const tempDir = makeTempDir('babysitter-runDetails-');
    try {
      const dir = path.join(tempDir, 'work_summaries');
      fs.mkdirSync(dir, { recursive: true });
      const a = path.join(dir, 'a.md');
      const b = path.join(dir, 'b.md');
      fs.writeFileSync(a, 'A', 'utf8');
      await new Promise((r) => setTimeout(r, 15));
      fs.writeFileSync(b, 'B', 'utf8');

      const items = listFilesSortedByMtimeDesc({ dir, rootForRel: dir, maxFiles: 10 });
      assert.strictEqual(items[0]?.relPath, 'b.md');
      assert.strictEqual(items[1]?.relPath, 'a.md');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('readRunDetailsSnapshot includes runFiles + importantFiles + keyFilesMeta', () => {
    const tempDir = makeTempDir('babysitter-runDetails-');
    try {
      const runRoot = path.join(tempDir, 'run-20260105-182700');
      fs.mkdirSync(path.join(runRoot, 'artifacts'), { recursive: true });
      fs.mkdirSync(path.join(runRoot, 'prompts'), { recursive: true });
      fs.mkdirSync(path.join(runRoot, 'work_summaries'), { recursive: true });
      fs.mkdirSync(path.join(runRoot, 'code'), { recursive: true });
      fs.mkdirSync(path.join(runRoot, 'nested'), { recursive: true });

      fs.writeFileSync(
        path.join(runRoot, 'state.json'),
        JSON.stringify({ status: 'running' }),
        'utf8',
      );
      fs.writeFileSync(path.join(runRoot, 'journal.jsonl'), '', 'utf8');
      fs.writeFileSync(path.join(runRoot, 'process.md'), '# process', 'utf8');
      fs.writeFileSync(
        path.join(runRoot, 'artifacts', 'process.md'),
        '# process artifact',
        'utf8',
      );
      fs.writeFileSync(path.join(runRoot, 'code', 'main.js'), 'console.log(1)', 'utf8');
      fs.writeFileSync(path.join(runRoot, 'artifacts', 'other.txt'), 'artifact', 'utf8');
      fs.writeFileSync(path.join(runRoot, 'nested', 'x.txt'), 'nested', 'utf8');

      const run: Run = {
        id: 'run-20260105-182700',
        status: 'running',
        timestamps: { createdAt: new Date(), updatedAt: new Date() },
        paths: {
          runRoot,
          stateJson: path.join(runRoot, 'state.json'),
          journalJsonl: path.join(runRoot, 'journal.jsonl'),
          artifactsDir: path.join(runRoot, 'artifacts'),
          promptsDir: path.join(runRoot, 'prompts'),
          workSummariesDir: path.join(runRoot, 'work_summaries'),
          codeDir: path.join(runRoot, 'code'),
          mainJs: path.join(runRoot, 'code', 'main.js'),
        },
      };

      const { snapshot } = readRunDetailsSnapshot({
        run,
        journalTailer: new JournalTailer(),
        existingJournalEntries: [],
        maxJournalEntries: 10,
        maxArtifacts: 10,
        maxWorkSummaries: 10,
        maxPrompts: 10,
      });

      assert.ok(Array.isArray(snapshot.runFiles));
      assert.ok(Array.isArray(snapshot.importantFiles));
      assert.ok(snapshot.keyFilesMeta);
      assert.equal(snapshot.keyFilesMeta.runRootExists, true);
      assert.equal(snapshot.keyFilesMeta.runRootReadable, true);
      assert.equal(snapshot.keyFilesMeta.truncated, false);
      assert.equal(snapshot.keyFilesMeta.totalFiles, snapshot.runFiles.length);

      assert.equal(
        snapshot.runFiles.every((f) => f.isDirectory === false),
        true,
      );
      const rels = snapshot.runFiles.map((f) => f.relPath.replace(/\\/g, '/'));
      assert.ok(rels.includes('state.json'));
      assert.ok(rels.includes('journal.jsonl'));
      assert.ok(rels.includes('process.md'));
      assert.ok(rels.includes('code/main.js'));
      assert.ok(rels.includes('artifacts/other.txt'));
      assert.ok(rels.includes('nested/x.txt'));

      const importantRels = snapshot.importantFiles.map((f) => f.relPath.replace(/\\/g, '/'));
      assert.ok(importantRels.includes('state.json'));
      assert.ok(importantRels.includes('journal.jsonl'));
      assert.ok(importantRels.includes('process.md'));
      assert.ok(importantRels.includes('artifacts/process.md'));
      assert.ok(importantRels.includes('code/main.js'));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('readRunDetailsSnapshot discovers important run/ variants when present', () => {
    const tempDir = makeTempDir('babysitter-runDetails-');
    try {
      const runRoot = path.join(tempDir, 'run-20260105-182701');
      fs.mkdirSync(path.join(runRoot, 'artifacts'), { recursive: true });
      fs.mkdirSync(path.join(runRoot, 'prompts'), { recursive: true });
      fs.mkdirSync(path.join(runRoot, 'work_summaries'), { recursive: true });
      fs.mkdirSync(path.join(runRoot, 'code'), { recursive: true });
      fs.mkdirSync(path.join(runRoot, 'run'), { recursive: true });

      fs.writeFileSync(
        path.join(runRoot, 'state.json'),
        JSON.stringify({ status: 'running' }),
        'utf8',
      );
      fs.writeFileSync(path.join(runRoot, 'journal.jsonl'), '', 'utf8');
      fs.writeFileSync(path.join(runRoot, 'run', 'process.md'), '# process (run variant)', 'utf8');

      const run: Run = {
        id: 'run-20260105-182701',
        status: 'running',
        timestamps: { createdAt: new Date(), updatedAt: new Date() },
        paths: {
          runRoot,
          stateJson: path.join(runRoot, 'state.json'),
          journalJsonl: path.join(runRoot, 'journal.jsonl'),
          artifactsDir: path.join(runRoot, 'artifacts'),
          promptsDir: path.join(runRoot, 'prompts'),
          workSummariesDir: path.join(runRoot, 'work_summaries'),
          codeDir: path.join(runRoot, 'code'),
          mainJs: path.join(runRoot, 'code', 'main.js'),
        },
      };

      const { snapshot } = readRunDetailsSnapshot({
        run,
        journalTailer: new JournalTailer(),
        existingJournalEntries: [],
        maxJournalEntries: 10,
        maxArtifacts: 10,
        maxWorkSummaries: 10,
        maxPrompts: 10,
      });

      const importantRels = snapshot.importantFiles.map((f) => f.relPath.replace(/\\/g, '/'));
      assert.ok(importantRels.includes('run/process.md'));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
