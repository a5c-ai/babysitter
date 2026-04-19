// End-to-end tests: compile the sample plugin to all targets and verify output

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { compile, compileAll } from '../compiler.js';
import { validate } from '../validate.js';

const SAMPLE_PLUGIN_DIR = path.resolve(__dirname, '../../examples/sample-plugin');

describe('e2e: sample plugin compilation', () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upf-e2e-'));
  });

  it('should validate plugin.json (not a5c-plugin.json)', () => {
    const result = validate(SAMPLE_PLUGIN_DIR);
    expect(result.valid).toBe(true);
    expect(result.manifest).not.toBeNull();
    expect(result.manifest!.name).toBe('sample-plugin');
  });

  it('should accept boolean true hook values without requiring handler files', () => {
    const result = validate(SAMPLE_PLUGIN_DIR);
    expect(result.valid).toBe(true);
    const hookErrors = result.diagnostics.filter(
      d => d.level === 'error' && d.message.includes('Hook handler')
    );
    expect(hookErrors).toHaveLength(0);
  });

  it('should compile to all 9 targets without errors', () => {
    const results = compileAll(SAMPLE_PLUGIN_DIR, tmpDir, {});

    expect(results).toHaveLength(9);
    for (const result of results) {
      expect(
        result.status,
        `${result.target} failed: ${result.diagnostics.filter(d => d.level === 'error').map(d => d.message).join(', ')}`
      ).not.toBe('error');
      expect(result.emittedFiles.length).toBeGreaterThan(0);
    }
  });

  it('should generate README.md for every target', () => {
    const results = compileAll(SAMPLE_PLUGIN_DIR, tmpDir, {});

    for (const result of results) {
      const readmePath = path.join(result.outputDir, 'README.md');
      expect(fs.existsSync(readmePath), `${result.target} missing README.md`).toBe(true);
      const readme = fs.readFileSync(readmePath, 'utf-8');
      expect(readme).toContain('# sample-plugin');
    }
  });

  it('should use manifest name in hook file naming', () => {
    const results = compileAll(SAMPLE_PLUGIN_DIR, tmpDir, {});

    for (const result of results) {
      const hookScripts = result.emittedFiles.filter(
        f => f.includes('-proxied-') && !f.endsWith('.json')
      );
      for (const hookFile of hookScripts) {
        expect(hookFile).toContain('sample-plugin-proxied');
      }
    }
  });

  it('should copy files listed in include field', () => {
    const result = compile({
      source: SAMPLE_PLUGIN_DIR,
      target: 'claude-code',
      output: path.join(tmpDir, 'include-test'),
    });

    expect(result.status).not.toBe('error');
    expect(result.emittedFiles).toContain('versions.json');
    expect(result.emittedFiles).toContain('assets/logo.txt');

    const versions = fs.readFileSync(
      path.join(result.outputDir, 'versions.json'), 'utf-8'
    );
    expect(JSON.parse(versions).sdkVersion).toBe('5.0.0');

    const logo = fs.readFileSync(
      path.join(result.outputDir, 'assets/logo.txt'), 'utf-8'
    );
    expect(logo).toContain('Sample Plugin');
  });

  describe('target-specific output', () => {
    it('claude-code: should emit plugin.json and hooks.json', () => {
      const result = compile({
        source: SAMPLE_PLUGIN_DIR,
        target: 'claude-code',
        output: path.join(tmpDir, 'cc-test'),
      });

      expect(result.status).not.toBe('error');
      expect(result.emittedFiles).toContain('plugin.json');
      expect(result.emittedFiles).toContain('hooks.json');

      const pluginJson = JSON.parse(
        fs.readFileSync(path.join(result.outputDir, 'plugin.json'), 'utf-8')
      );
      expect(pluginJson.name).toBe('sample-plugin');
    });

    it('codex: should emit package.json with bin scripts', () => {
      const result = compile({
        source: SAMPLE_PLUGIN_DIR,
        target: 'codex',
        output: path.join(tmpDir, 'codex-test'),
      });

      expect(result.status).not.toBe('error');
      expect(result.emittedFiles).toContain('package.json');
      expect(result.emittedFiles).toContain('bin/cli.js');
      expect(result.emittedFiles).toContain('bin/install.js');
      expect(result.emittedFiles).toContain('bin/uninstall.js');
    });

    it('pi: should emit extensions with command registration', () => {
      const result = compile({
        source: SAMPLE_PLUGIN_DIR,
        target: 'pi',
        output: path.join(tmpDir, 'pi-test'),
      });

      expect(result.status).not.toBe('error');
      expect(result.emittedFiles).toContain('extensions/index.ts');

      const ext = fs.readFileSync(
        path.join(result.outputDir, 'extensions/index.ts'), 'utf-8'
      );
      expect(ext).toContain('@mariozechner/pi-coding-agent');
      expect(ext).toContain('"help"');
      expect(ext).toContain('"status"');
    });

    it('pi: should generate hooks.json with ADAPTER_NAME env var', () => {
      const result = compile({
        source: SAMPLE_PLUGIN_DIR,
        target: 'pi',
        output: path.join(tmpDir, 'pi-hooks-test'),
      });

      expect(result.status).not.toBe('error');
      // Pi has no hookRegistrationFormat so no hooks.json -- hooks
      // are routed via the programmatic extension and env vars
    });

    it('oh-my-pi: should emit extension with oh-my-pi package', () => {
      const result = compile({
        source: SAMPLE_PLUGIN_DIR,
        target: 'oh-my-pi',
        output: path.join(tmpDir, 'omp-test'),
      });

      expect(result.status).not.toBe('error');
      const ext = fs.readFileSync(
        path.join(result.outputDir, 'extensions/index.ts'), 'utf-8'
      );
      expect(ext).toContain('@oh-my-pi/pi-coding-agent');
    });

    it('marketplace targets should not emit bin/ scripts', () => {
      const result = compile({
        source: SAMPLE_PLUGIN_DIR,
        target: 'claude-code',
        output: path.join(tmpDir, 'cc-nobin-test'),
      });

      expect(result.status).not.toBe('error');
      const binFiles = result.emittedFiles.filter(f => f.startsWith('bin/'));
      expect(binFiles).toHaveLength(0);
    });

    it('opencode: should emit accomplish-skills', () => {
      const result = compile({
        source: SAMPLE_PLUGIN_DIR,
        target: 'opencode',
        output: path.join(tmpDir, 'opencode-test'),
      });

      expect(result.status).not.toBe('error');
      expect(result.emittedFiles).toContain('accomplish-skills/sample-plugin/SKILL.md');
    });
  });
});
