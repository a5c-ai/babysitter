import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { compile } from '../compiler.js';
import { diffTarget, formatDiffResult } from '../diff.js';

const SAMPLE_PLUGIN_DIR = path.resolve(__dirname, '../../examples/sample-plugin');

describe('diffTarget', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns match when compiled output matches the existing target directory', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mux-diff-match-'));
    tempDirs.push(tempDir);

    const existingDir = path.join(tempDir, 'existing');
    const baseline = compile({
      source: SAMPLE_PLUGIN_DIR,
      target: 'codex',
      output: existingDir,
    });

    expect(baseline.status).not.toBe('error');

    const result = diffTarget({
      source: SAMPLE_PLUGIN_DIR,
      target: 'codex',
      existing: existingDir,
    });

    expect(result.status).toBe('match');
    expect(result.identical).toBe(true);
    expect(result.differenceCount).toBe(0);
    expect(result.onlyInCompiled).toEqual([]);
    expect(result.onlyInExisting).toEqual([]);
    expect(result.differingFiles).toEqual([]);
    expect(formatDiffResult(result)).toBe('No differences found for target codex.');
  });

  it('returns differences when the existing target directory drifts from compiled output', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mux-diff-drift-'));
    tempDirs.push(tempDir);

    const existingDir = path.join(tempDir, 'existing');
    const baseline = compile({
      source: SAMPLE_PLUGIN_DIR,
      target: 'codex',
      output: existingDir,
    });

    expect(baseline.status).not.toBe('error');

    fs.writeFileSync(
      path.join(existingDir, 'README.md'),
      '# sample-plugin\n\nThis file drifted.\n',
      'utf-8',
    );
    fs.writeFileSync(path.join(existingDir, 'notes.txt'), 'extra file\n', 'utf-8');

    const result = diffTarget({
      source: SAMPLE_PLUGIN_DIR,
      target: 'codex',
      existing: existingDir,
    });

    expect(result.status).toBe('different');
    expect(result.identical).toBe(false);
    expect(result.differenceCount).toBeGreaterThan(0);
    expect(result.onlyInExisting).toContain('notes.txt');
    expect(result.differingFiles).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'README.md' })]),
    );

    const text = formatDiffResult(result);
    expect(text).toContain('Files only in existing:');
    expect(text).toContain('notes.txt');
    expect(text).toContain('Files with differences:');
    expect(text).toContain('README.md');
    expect(text).toContain('content differs at line');
  });

  it('ignores content drift for files marked as ignored existing files', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mux-diff-ignored-'));
    tempDirs.push(tempDir);

    const existingDir = path.join(tempDir, 'existing');
    const baseline = compile({
      source: SAMPLE_PLUGIN_DIR,
      target: 'codex',
      output: existingDir,
    });

    expect(baseline.status).not.toBe('error');

    fs.writeFileSync(
      path.join(existingDir, 'versions.json'),
      `${JSON.stringify({ sdkVersion: '9.9.9-staging.ignored' }, null, 2)}\n`,
      'utf-8',
    );

    const result = diffTarget({
      source: SAMPLE_PLUGIN_DIR,
      target: 'codex',
      existing: existingDir,
    });

    expect(result.status).toBe('match');
    expect(result.identical).toBe(true);
    expect(result.differingFiles).toEqual([]);
    expect(result.onlyInExisting).toEqual([]);
    expect(formatDiffResult(result)).toBe('No differences found for target codex.');
  });
});
