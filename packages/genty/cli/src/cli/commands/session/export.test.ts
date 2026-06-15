import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createSessionTree, addMessage, serializeTree } from '@a5c-ai/genty-runtime/session/tree';
import { handleSessionExport } from './export.js';

describe('session/export', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'genty-export-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function createTestTree(): string {
    const tree = createSessionTree();
    addMessage(tree, 'user', 'Hello agent');
    addMessage(tree, 'assistant', 'Hello! How can I help?');
    const treePath = join(tempDir, 'session.json');
    writeFileSync(treePath, serializeTree(tree));
    return treePath;
  }

  it('exports HTML to a file', async () => {
    const treePath = createTestTree();
    const outPath = join(tempDir, 'output.html');
    const result = await handleSessionExport({
      treePath,
      format: 'html',
      output: outPath,
      json: false,
    });
    expect(result).toBe(0);
    const content = readFileSync(outPath, 'utf8');
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('Hello agent');
    expect(content).toContain('How can I help');
  });

  it('exports markdown to a file', async () => {
    const treePath = createTestTree();
    const outPath = join(tempDir, 'output.md');
    const result = await handleSessionExport({
      treePath,
      format: 'markdown',
      output: outPath,
      json: false,
    });
    expect(result).toBe(0);
    const content = readFileSync(outPath, 'utf8');
    expect(content).toContain('### USER');
    expect(content).toContain('Hello agent');
  });

  it('returns error for missing tree file', async () => {
    const result = await handleSessionExport({
      treePath: join(tempDir, 'missing.json'),
      format: 'html',
      json: false,
    });
    expect(result).toBe(1);
  });
});
