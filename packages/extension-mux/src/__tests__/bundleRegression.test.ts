import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { compile } from '../compiler.js';
import { verify } from '../verify.js';

const SAMPLE_PLUGIN_DIR = path.resolve(__dirname, '../../examples/sample-plugin');
const UNIFIED_PLUGIN_DIR = path.resolve(__dirname, '../../../../plugins/babysitter-unified');
const CLAUDE_HARNESS_DIR = path.resolve(__dirname, '../../../../plugins/babysitter-unified/per-harness/claude-code');
const CODEX_HARNESS_DIR = path.resolve(__dirname, '../../../../plugins/babysitter-unified/per-harness/codex');
const OMP_HARNESS_DIR = path.resolve(__dirname, '../../../../plugins/babysitter-unified/per-harness/omp');

function createTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

describe('bundle regression coverage', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exercises verifyOutput against semantic bundle references, including marketplace and programmatic surfaces', () => {
    const tempDir = createTempDir('mux-verify-output-');
    tempDirs.push(tempDir);

    const codexResult = compile({
      source: UNIFIED_PLUGIN_DIR,
      target: 'codex',
      output: path.join(tempDir, 'codex'),
      outputBaseDir: tempDir,
      verifyOutput: true,
    });
    const ompResult = compile({
      source: UNIFIED_PLUGIN_DIR,
      target: 'oh-my-pi',
      output: path.join(tempDir, 'oh-my-pi'),
      verifyOutput: true,
    });

    expect(
      codexResult.status,
      codexResult.diagnostics.filter((d) => d.level === 'error').map((d) => d.message).join('\n'),
    ).not.toBe('error');
    expect(
      ompResult.status,
      ompResult.diagnostics.filter((d) => d.level === 'error').map((d) => d.message).join('\n'),
    ).not.toBe('error');

    expect(codexResult.verificationChecklist).toEqual(expect.arrayContaining([
      expect.stringContaining('package.json bin target exists: bin/cli.js'),
      expect.stringContaining('package.json script target exists: scripts/team-install.js'),
      expect.stringContaining('hooks.json command target exists: hooks/babysitter-proxied-stop.sh'),
      expect.stringContaining('.agents/plugins/marketplace.json marketplace entry source exists'),
    ]));
    expect(ompResult.verificationChecklist).toEqual(expect.arrayContaining([
      expect.stringContaining('package.json bin target exists: bin/cli.cjs'),
      expect.stringContaining('package.json omp extension exists: extensions'),
      expect.stringContaining('package.json omp skill path exists: skills'),
    ]));
  });

  it('flags broken verify references even when files still exist and JSON remains valid', () => {
    const tempDir = createTempDir('mux-verify-regression-');
    tempDirs.push(tempDir);

    const result = compile({
      source: SAMPLE_PLUGIN_DIR,
      target: 'codex',
      output: path.join(tempDir, 'codex'),
      outputBaseDir: tempDir,
    });

    expect(result.status).not.toBe('error');

    const hooksPath = path.join(result.outputDir, 'hooks.json');
    const hooksJson = JSON.parse(readFile(hooksPath)) as {
      hooks: Record<string, Array<{ hooks: Array<{ command: string }> }>>;
    };
    hooksJson.hooks.Stop[0].hooks[0].command = 'bash "./hooks/missing-stop.sh"';
    fs.writeFileSync(hooksPath, `${JSON.stringify(hooksJson, null, 2)}\n`);

    const verifyResult = verify(result.outputDir, result.emittedFiles, { outputBaseDir: tempDir });

    expect(verifyResult.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        level: 'error',
        message: 'hooks.json command target missing: hooks/missing-stop.sh',
      }),
    ]));
  });

  it('reproduces harness-authored README surfaces from the unified source', () => {
    const tempDir = createTempDir('mux-readme-regression-');
    tempDirs.push(tempDir);

    const claudeResult = compile({
      source: UNIFIED_PLUGIN_DIR,
      target: 'claude-code',
      output: path.join(tempDir, 'claude-code'),
    });
    const codexResult = compile({
      source: UNIFIED_PLUGIN_DIR,
      target: 'codex',
      output: path.join(tempDir, 'codex'),
    });
    const ompResult = compile({
      source: UNIFIED_PLUGIN_DIR,
      target: 'oh-my-pi',
      output: path.join(tempDir, 'oh-my-pi'),
    });

    expect(readFile(path.join(claudeResult.outputDir, 'README.md'))).toBe(
      readFile(path.join(CLAUDE_HARNESS_DIR, 'README.md')),
    );
    expect(readFile(path.join(codexResult.outputDir, 'README.md'))).toBe(
      readFile(path.join(CODEX_HARNESS_DIR, 'README.md')),
    );
    expect(readFile(path.join(ompResult.outputDir, 'README.md'))).toBe(
      readFile(path.join(OMP_HARNESS_DIR, 'README.md')),
    );
  });

  it('reproduces README and install surfaces for npm and programmatic targets', () => {
    const tempDir = createTempDir('mux-surface-regression-');
    tempDirs.push(tempDir);

    const codexResult = compile({
      source: UNIFIED_PLUGIN_DIR,
      target: 'codex',
      output: path.join(tempDir, 'codex'),
      outputBaseDir: tempDir,
    });
    const ompResult = compile({
      source: UNIFIED_PLUGIN_DIR,
      target: 'oh-my-pi',
      output: path.join(tempDir, 'oh-my-pi'),
    });

    expect(codexResult.status).not.toBe('error');
    expect(ompResult.status).not.toBe('error');

    expect(readFile(path.join(codexResult.outputDir, 'README.md'))).toBe(
      readFile(path.join(CODEX_HARNESS_DIR, 'README.md')),
    );
    expect(readFile(path.join(codexResult.outputDir, 'bin', 'install-shared.js'))).toContain(
      'function getCodexHome',
    );
    expect(readFile(path.join(codexResult.outputDir, 'bin', 'install-shared.js'))).toContain(
      'function ensureGlobalProcessLibrary',
    );

    expect(readFile(path.join(ompResult.outputDir, 'README.md'))).toBe(
      readFile(path.join(OMP_HARNESS_DIR, 'README.md')),
    );
    expect(readFile(path.join(ompResult.outputDir, 'extensions', 'index.ts'))).toBe(
      readFile(path.join(OMP_HARNESS_DIR, 'extensions-index.ts')),
    );
  });
});
