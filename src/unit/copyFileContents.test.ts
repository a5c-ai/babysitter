import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { readFileContentsForClipboard } from '../core/copyFileContents';

function mkTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'babysitter-'));
}

suite('copyFileContents', () => {
  test('copies small UTF-8 files', async () => {
    const runRoot = mkTmpDir();
    const filePath = path.join(runRoot, 'hello.txt');
    fs.writeFileSync(filePath, 'hello world\n', 'utf8');

    const res = await readFileContentsForClipboard({ runRoot, fsPath: filePath, maxBytes: 1000 });
    assert.equal(res.ok, true);
    if (res.ok) assert.equal(res.content, 'hello world\n');
  });

  test('rejects likely-binary files', async () => {
    const runRoot = mkTmpDir();
    const filePath = path.join(runRoot, 'bin.dat');
    fs.writeFileSync(filePath, Buffer.from([0, 1, 2, 3, 4, 5, 0, 255]));

    const res = await readFileContentsForClipboard({ runRoot, fsPath: filePath, maxBytes: 1000 });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.code, 'binary');
  });

  test('rejects files larger than maxBytes', async () => {
    const runRoot = mkTmpDir();
    const filePath = path.join(runRoot, 'big.txt');
    fs.writeFileSync(filePath, 'a'.repeat(100));

    const res = await readFileContentsForClipboard({ runRoot, fsPath: filePath, maxBytes: 10 });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.code, 'too_large');
  });

  test('refuses to read outside runRoot', async () => {
    const runRoot = mkTmpDir();
    const otherRoot = mkTmpDir();
    const filePath = path.join(otherRoot, 'hello.txt');
    fs.writeFileSync(filePath, 'hello', 'utf8');

    const res = await readFileContentsForClipboard({ runRoot, fsPath: filePath, maxBytes: 1000 });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.code, 'outside_root');
  });
});
