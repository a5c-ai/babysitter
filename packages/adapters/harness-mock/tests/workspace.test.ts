import { describe, it, expect, afterEach } from 'vitest';
import { WorkspaceSandbox } from '../src/workspace.js';

describe('WorkspaceSandbox', () => {
  const sandboxes: WorkspaceSandbox[] = [];

  function createSandbox(opts?: ConstructorParameters<typeof WorkspaceSandbox>[0]): WorkspaceSandbox {
    const sb = new WorkspaceSandbox(opts);
    sandboxes.push(sb);
    return sb;
  }

  afterEach(() => {
    for (const sb of sandboxes) {
      sb.dispose();
    }
    sandboxes.length = 0;
  });

  describe('file operations', () => {
    it('creates and reads files', () => {
      const sb = createSandbox();
      sb.writeFile('test.txt', 'hello world');
      expect(sb.readFile('test.txt')).toBe('hello world');
    });

    it('creates nested directories automatically', () => {
      const sb = createSandbox();
      sb.writeFile('deep/nested/file.txt', 'content');
      expect(sb.readFile('deep/nested/file.txt')).toBe('content');
    });

    it('checks file existence', () => {
      const sb = createSandbox();
      expect(sb.exists('missing.txt')).toBe(false);
      sb.writeFile('exists.txt', 'yes');
      expect(sb.exists('exists.txt')).toBe(true);
    });

    it('deletes files', () => {
      const sb = createSandbox();
      sb.writeFile('temp.txt', 'delete me');
      expect(sb.exists('temp.txt')).toBe(true);
      sb.deleteFile('temp.txt');
      expect(sb.exists('temp.txt')).toBe(false);
    });

    it('lists all files', () => {
      const sb = createSandbox();
      sb.writeFile('a.txt', '1');
      sb.writeFile('b/c.txt', '2');
      sb.writeFile('d.txt', '3');
      expect(sb.listFiles()).toEqual(['a.txt', 'b/c.txt', 'd.txt']);
    });
  });

  describe('initial files', () => {
    it('seeds workspace with initial files', () => {
      const sb = createSandbox({
        initialFiles: {
          'src/index.ts': 'export {}',
          'README.md': '# Test',
        },
      });
      expect(sb.listFiles()).toEqual(['README.md', 'src/index.ts']);
      expect(sb.readFile('src/index.ts')).toBe('export {}');
    });
  });

  describe('diff', () => {
    it('detects created files', () => {
      const sb = createSandbox({ initialFiles: { 'existing.txt': 'old' } });
      sb.writeFile('new.txt', 'fresh');
      const d = sb.diff();
      expect(d.created).toEqual(['new.txt']);
      expect(d.modified).toEqual([]);
      expect(d.deleted).toEqual([]);
    });

    it('detects modified files', () => {
      const sb = createSandbox({ initialFiles: { 'file.txt': 'original' } });
      sb.writeFile('file.txt', 'changed');
      const d = sb.diff();
      expect(d.created).toEqual([]);
      expect(d.modified).toEqual(['file.txt']);
      expect(d.deleted).toEqual([]);
    });

    it('detects deleted files', () => {
      const sb = createSandbox({ initialFiles: { 'gone.txt': 'bye' } });
      sb.deleteFile('gone.txt');
      const d = sb.diff();
      expect(d.created).toEqual([]);
      expect(d.modified).toEqual([]);
      expect(d.deleted).toEqual(['gone.txt']);
    });

    it('detects mixed changes', () => {
      const sb = createSandbox({
        initialFiles: {
          'keep.txt': 'same',
          'change.txt': 'original',
          'remove.txt': 'bye',
        },
      });
      sb.writeFile('change.txt', 'modified');
      sb.deleteFile('remove.txt');
      sb.writeFile('add.txt', 'new');
      const d = sb.diff();
      expect(d.created).toEqual(['add.txt']);
      expect(d.modified).toEqual(['change.txt']);
      expect(d.deleted).toEqual(['remove.txt']);
    });
  });

  describe('applyOperations', () => {
    it('applies create operations', () => {
      const sb = createSandbox();
      sb.applyOperations([
        { type: 'create', path: 'file.txt', content: 'hello' },
      ]);
      expect(sb.readFile('file.txt')).toBe('hello');
    });

    it('applies delete operations', () => {
      const sb = createSandbox({ initialFiles: { 'file.txt': 'content' } });
      sb.applyOperations([
        { type: 'delete', path: 'file.txt' },
      ]);
      expect(sb.exists('file.txt')).toBe(false);
    });

    it('applies rename operations', () => {
      const sb = createSandbox({ initialFiles: { 'old.txt': 'content' } });
      sb.applyOperations([
        { type: 'rename', path: 'old.txt', newPath: 'new.txt' },
      ]);
      expect(sb.exists('old.txt')).toBe(false);
      expect(sb.readFile('new.txt')).toBe('content');
    });
  });

  describe('snapshot', () => {
    it('captures current state', () => {
      const sb = createSandbox({
        initialFiles: { 'a.txt': '1', 'b.txt': '2' },
      });
      const snap = sb.snapshot();
      expect(snap.get('a.txt')).toBe('1');
      expect(snap.get('b.txt')).toBe('2');
      expect(snap.size).toBe(2);
    });
  });

  describe('safety', () => {
    it('prevents path traversal', () => {
      const sb = createSandbox();
      expect(() => sb.resolve('../../etc/passwd')).toThrow('Path escapes sandbox');
    });

    it('throws after dispose', () => {
      const sb = new WorkspaceSandbox();
      sb.dispose();
      expect(() => sb.writeFile('test', 'data')).toThrow('disposed');
    });

    it('dispose is idempotent', () => {
      const sb = new WorkspaceSandbox();
      sb.dispose();
      sb.dispose(); // Should not throw
    });
  });
});
