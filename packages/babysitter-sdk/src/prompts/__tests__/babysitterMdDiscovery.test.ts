import { describe, expect, it, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { findGitRoot, discoverBabysitterMdFiles } from '../babysitterMdDiscovery';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'babysitter-test-'));
  tempDirs.push(dir);
  return dir;
}

function mkdirp(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

afterEach(() => {
  for (const dir of tempDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  }
  tempDirs.length = 0;
});

// ---------------------------------------------------------------------------
// findGitRoot
// ---------------------------------------------------------------------------
describe('findGitRoot', () => {
  it('finds the repo root from a subdirectory', () => {
    const root = makeTempDir();
    mkdirp(path.join(root, '.git'));
    mkdirp(path.join(root, 'a', 'b', 'c'));

    const result = findGitRoot(path.join(root, 'a', 'b', 'c'));
    expect(result).toBe(path.resolve(root));
  });

  it('finds the repo root when .git is a file (worktree)', () => {
    const root = makeTempDir();
    fs.writeFileSync(path.join(root, '.git'), 'gitdir: /some/other/path');
    mkdirp(path.join(root, 'sub'));

    const result = findGitRoot(path.join(root, 'sub'));
    expect(result).toBe(path.resolve(root));
  });

  it('returns undefined outside a git repo', () => {
    const root = makeTempDir();
    // No .git directory at all
    const result = findGitRoot(root);
    expect(result).toBeUndefined();
  });

  it('returns the directory itself when called on the repo root', () => {
    const root = makeTempDir();
    mkdirp(path.join(root, '.git'));

    const result = findGitRoot(root);
    expect(result).toBe(path.resolve(root));
  });
});

// ---------------------------------------------------------------------------
// discoverBabysitterMdFiles
// ---------------------------------------------------------------------------
describe('discoverBabysitterMdFiles', () => {
  it('discovers BABYSITTER.md files with case-insensitive matching', () => {
    const root = makeTempDir();
    mkdirp(path.join(root, '.git'));
    mkdirp(path.join(root, 'sub'));

    // Root uses uppercase, sub uses lowercase
    fs.writeFileSync(path.join(root, 'BABYSITTER.md'), 'root content');
    fs.writeFileSync(path.join(root, 'sub', 'babysitter.md'), 'sub content');

    const files = discoverBabysitterMdFiles(path.join(root, 'sub'));
    expect(files).toHaveLength(2);

    // Case-insensitive: both variants discovered
    expect(files[0].content).toBe('root content');
    expect(files[1].content).toBe('sub content');
  });

  it('returns files sorted root-to-leaf', () => {
    const root = makeTempDir();
    mkdirp(path.join(root, '.git'));
    mkdirp(path.join(root, 'a', 'b'));

    fs.writeFileSync(path.join(root, 'BABYSITTER.md'), 'root');
    fs.writeFileSync(path.join(root, 'a', 'BABYSITTER.md'), 'mid');
    fs.writeFileSync(path.join(root, 'a', 'b', 'BABYSITTER.md'), 'leaf');

    const files = discoverBabysitterMdFiles(path.join(root, 'a', 'b'));
    expect(files).toHaveLength(3);
    expect(files[0].content).toBe('root');
    expect(files[1].content).toBe('mid');
    expect(files[2].content).toBe('leaf');
  });

  it('uses forward slashes in relativePath', () => {
    const root = makeTempDir();
    mkdirp(path.join(root, '.git'));
    mkdirp(path.join(root, 'deep', 'nested'));

    fs.writeFileSync(
      path.join(root, 'deep', 'nested', 'BABYSITTER.md'),
      'nested content',
    );

    const files = discoverBabysitterMdFiles(path.join(root, 'deep', 'nested'));
    expect(files).toHaveLength(1);
    expect(files[0].relativePath).toBe('deep/nested/BABYSITTER.md');
    expect(files[0].relativePath).not.toContain('\\');
  });

  it('returns root-level file with relativePath equal to filename', () => {
    const root = makeTempDir();
    mkdirp(path.join(root, '.git'));
    fs.writeFileSync(path.join(root, 'BABYSITTER.md'), 'root only');

    const files = discoverBabysitterMdFiles(root);
    expect(files).toHaveLength(1);
    expect(files[0].relativePath).toBe('BABYSITTER.md');
  });

  it('returns empty array when no BABYSITTER.md files exist', () => {
    const root = makeTempDir();
    mkdirp(path.join(root, '.git'));
    mkdirp(path.join(root, 'sub'));

    const files = discoverBabysitterMdFiles(path.join(root, 'sub'));
    expect(files).toHaveLength(0);
  });

  it('returns empty array when not in a git repo', () => {
    const root = makeTempDir();
    fs.writeFileSync(path.join(root, 'BABYSITTER.md'), 'orphan content');

    const files = discoverBabysitterMdFiles(root);
    expect(files).toHaveLength(0);
  });
});
