/**
 * WorkspaceSandbox — isolated filesystem area for mock harness file operations.
 *
 * Creates a temporary directory that the mock harness can read/write to,
 * providing snapshot and diff capabilities for test assertions.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import type { FileOperation } from './types.js';

export interface WorkspaceOptions {
  /** Initial files to seed the workspace with. */
  initialFiles?: Record<string, string>;

  /** Whether to preserve the workspace after dispose() (for debugging). */
  preserve?: boolean;
}

export class WorkspaceSandbox {
  /** The root directory of this sandbox. */
  readonly root: string;

  private _disposed = false;
  private _preserve: boolean;
  private _initialSnapshot: Map<string, string>;

  constructor(options?: WorkspaceOptions) {
    this.root = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-workspace-'));
    this._preserve = options?.preserve ?? false;
    this._initialSnapshot = new Map();

    if (options?.initialFiles) {
      for (const [filePath, content] of Object.entries(options.initialFiles)) {
        this.writeFile(filePath, content);
        this._initialSnapshot.set(filePath, content);
      }
    }
  }

  /** Resolve a relative path within the sandbox. */
  resolve(relativePath: string): string {
    const resolved = path.resolve(this.root, relativePath);
    if (!resolved.startsWith(this.root)) {
      throw new Error(`Path escapes sandbox: ${relativePath}`);
    }
    return resolved;
  }

  /** Write a file to the sandbox. */
  writeFile(relativePath: string, content: string): void {
    this._ensureNotDisposed();
    const fullPath = this.resolve(relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
  }

  /** Read a file from the sandbox. */
  readFile(relativePath: string): string {
    this._ensureNotDisposed();
    return fs.readFileSync(this.resolve(relativePath), 'utf-8');
  }

  /** Check if a file exists in the sandbox. */
  exists(relativePath: string): boolean {
    this._ensureNotDisposed();
    return fs.existsSync(this.resolve(relativePath));
  }

  /** Delete a file from the sandbox. */
  deleteFile(relativePath: string): void {
    this._ensureNotDisposed();
    fs.unlinkSync(this.resolve(relativePath));
  }

  /** List all files in the sandbox (relative paths). */
  listFiles(): string[] {
    this._ensureNotDisposed();
    const results: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else {
          results.push(path.relative(this.root, full).replace(/\\/g, '/'));
        }
      }
    };
    walk(this.root);
    return results.sort();
  }

  /**
   * Apply a sequence of file operations to the sandbox.
   * Translates absolute paths in the operations to sandbox-relative paths.
   */
  applyOperations(operations: FileOperation[], basePath?: string): void {
    this._ensureNotDisposed();
    for (const op of operations) {
      const relativePath = basePath
        ? path.relative(basePath, op.path).replace(/\\/g, '/')
        : op.path.replace(/^\//, '');

      switch (op.type) {
        case 'create':
        case 'modify':
          this.writeFile(relativePath, op.content ?? '');
          break;
        case 'delete':
          if (this.exists(relativePath)) {
            this.deleteFile(relativePath);
          }
          break;
        case 'rename':
          if (op.newPath) {
            const newRelative = basePath
              ? path.relative(basePath, op.newPath).replace(/\\/g, '/')
              : op.newPath.replace(/^\//, '');
            const content = this.readFile(relativePath);
            this.writeFile(newRelative, content);
            this.deleteFile(relativePath);
          }
          break;
      }
    }
  }

  /**
   * Get a diff of changes since the workspace was created.
   * Returns arrays of created, modified, and deleted files.
   */
  diff(): { created: string[]; modified: string[]; deleted: string[] } {
    this._ensureNotDisposed();
    const currentFiles = new Set(this.listFiles());
    const created: string[] = [];
    const modified: string[] = [];
    const deleted: string[] = [];

    for (const file of currentFiles) {
      if (!this._initialSnapshot.has(file)) {
        created.push(file);
      } else if (this.readFile(file) !== this._initialSnapshot.get(file)) {
        modified.push(file);
      }
    }

    for (const file of this._initialSnapshot.keys()) {
      if (!currentFiles.has(file)) {
        deleted.push(file);
      }
    }

    return { created: created.sort(), modified: modified.sort(), deleted: deleted.sort() };
  }

  /** Snapshot the current state (for later comparison). */
  snapshot(): Map<string, string> {
    this._ensureNotDisposed();
    const snap = new Map<string, string>();
    for (const file of this.listFiles()) {
      snap.set(file, this.readFile(file));
    }
    return snap;
  }

  /** Clean up the sandbox. */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    if (!this._preserve) {
      fs.rmSync(this.root, { recursive: true, force: true });
    }
  }

  private _ensureNotDisposed(): void {
    if (this._disposed) {
      throw new Error('WorkspaceSandbox has been disposed');
    }
  }
}
