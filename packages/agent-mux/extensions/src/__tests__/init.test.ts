import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { compile } from '../compiler.js';
import { scaffoldPlugin } from '../init.js';
import { validate } from '../validate.js';
import { runCli } from '../cli.js';

function createTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('scaffoldPlugin', () => {
  it.each([
    { template: 'minimal', name: 'starter-minimal' },
    { template: 'full', name: 'starter-full' },
    { template: 'hooks-only', name: 'starter-hooks-only' },
  ] as const)('scaffolds %s and validates cleanly', ({ template, name }) => {
    const outputDir = path.join(createTempDir('extension-mux-init-'), template);
    const result = scaffoldPlugin({
      name,
      template,
      output: outputDir,
    });

    expect(result.template).toBe(template);
    expect(result.writtenFiles).toContain('plugin.json');
    expect(result.writtenFiles).toContain('versions.json');

    const validateResult = validate(outputDir);
    expect(validateResult.valid).toBe(true);
    expect(validateResult.diagnostics).toEqual([]);

    const compileResult = compile({
      source: outputDir,
      target: 'claude-code',
      output: path.join(createTempDir('extension-mux-compile-'), template),
    });
    expect(compileResult.status).not.toBe('error');
    expect(compileResult.emittedFiles.length).toBeGreaterThan(0);
  });

  it('runs the public init CLI flow', () => {
    const outputDir = path.join(createTempDir('extension-mux-cli-'), 'scaffold');
    const stdout: string[] = [];
    const stderr: string[] = [];

    const exitCode = runCli(
      ['init', '--name', 'cli-starter', '--template', 'full', '--output', outputDir],
      {
        stdout: (message) => stdout.push(message),
        stderr: (message) => stderr.push(message),
      }
    );

    expect(exitCode).toBe(0);
    expect(stderr).toEqual([]);
    expect(stdout.join('\n')).toContain('Scaffolded template: full');

    const validateResult = validate(outputDir);
    expect(validateResult.valid).toBe(true);
  });
});
