import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { WorkSummaryTailSession } from '../core/workSummaryTailSession';

function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

suite('WorkSummaryTailSession', () => {
  test('tails incremental appended lines', () => {
    const tempDir = makeTempDir('babysitter-workSummaryTail-');
    try {
      const filePath = path.join(tempDir, 'work.txt');
      fs.writeFileSync(filePath, 'First line\n', 'utf8');

      const session = new WorkSummaryTailSession({ maxBytes: 1024, maxChars: 1024 });
      const start = session.start(filePath);
      assert.strictEqual(start.type, 'set');
      assert.strictEqual(start.empty, false);
      assert.ok(start.content.includes('First line'));

      fs.appendFileSync(filePath, 'Second line\n', 'utf8');
      const update = session.poll();
      assert.ok(update, 'expected an update after appending data');
      assert.strictEqual(session.getText().includes('First line'), true);
      assert.strictEqual(session.getText().includes('Second line'), true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('reports empty when file has no content', () => {
    const tempDir = makeTempDir('babysitter-workSummaryTail-');
    try {
      const filePath = path.join(tempDir, 'work.txt');
      fs.writeFileSync(filePath, '', 'utf8');

      const session = new WorkSummaryTailSession({ maxBytes: 1024, maxChars: 1024 });
      const start = session.start(filePath);
      assert.strictEqual(start.type, 'set');
      assert.strictEqual(start.empty, true);
      assert.strictEqual(start.content, '');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('reports error for missing file', () => {
    const session = new WorkSummaryTailSession({ maxBytes: 1024, maxChars: 1024 });
    const missingPath = path.join(os.tmpdir(), 'babysitter-missing', 'nope.txt');
    const start = session.start(missingPath);
    assert.strictEqual(start.type, 'error');
    assert.ok(
      start.message.toLowerCase().includes('not found') || start.message.includes('ENOENT'),
    );
  });

  test('resets and reports truncation on shrink', () => {
    const tempDir = makeTempDir('babysitter-workSummaryTail-');
    try {
      const filePath = path.join(tempDir, 'work.txt');
      fs.writeFileSync(filePath, 'a\nb\n', 'utf8');

      const session = new WorkSummaryTailSession({ maxBytes: 1024, maxChars: 1024 });
      const first = session.start(filePath);
      assert.strictEqual(first.type, 'set');
      assert.strictEqual(first.truncated, false);

      fs.writeFileSync(filePath, 'x\n', 'utf8');
      const update = session.poll();
      assert.ok(update, 'expected an update after truncation');
      assert.strictEqual(session.getText().includes('a'), false);
      assert.strictEqual(session.getText().includes('x'), true);
      assert.strictEqual(update?.type, 'set');
      if (update?.type === 'set') assert.strictEqual(update.truncated, true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
