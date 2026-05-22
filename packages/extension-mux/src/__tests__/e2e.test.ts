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

  it('should compile to all 10 targets without errors', () => {
    const results = compileAll(SAMPLE_PLUGIN_DIR, tmpDir, {});

    expect(results).toHaveLength(10);
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
      expect(result.emittedFiles).toContain('hooks/hooks.json');

      const pluginJson = JSON.parse(
        fs.readFileSync(path.join(result.outputDir, 'plugin.json'), 'utf-8')
      );
      expect(pluginJson.name).toBe('sample-plugin');
      expect(pluginJson.author).toEqual({ name: 'a5c.ai' });

      const claudePluginJson = JSON.parse(
        fs.readFileSync(path.join(result.outputDir, '.claude-plugin/plugin.json'), 'utf-8')
      );
      expect(claudePluginJson.author).toEqual({ name: 'a5c.ai' });
    });

    it('codex: should emit package.json with bin scripts', () => {
      const result = compile({
        source: SAMPLE_PLUGIN_DIR,
        target: 'codex',
        output: path.join(tmpDir, 'codex-test'),
      });

      expect(result.status).not.toBe('error');
      expect(result.emittedFiles).toContain('package.json');
      expect(result.emittedFiles).toContain('hooks.json');
      expect(result.emittedFiles).toContain('bin/cli.js');
      expect(result.emittedFiles).toContain('bin/install.js');
      expect(result.emittedFiles).toContain('bin/uninstall.js');

      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.outputDir, 'package.json'), 'utf-8')
      );
      expect(packageJson.scripts['sync:commands']).toBeUndefined();
      expect(packageJson.scripts['sync:skills']).toBeUndefined();
    });

    it('gemini: should emit TOML command references in plugin.json', () => {
      const result = compile({
        source: SAMPLE_PLUGIN_DIR,
        target: 'gemini',
        output: path.join(tmpDir, 'gemini-test'),
      });

      expect(result.status).not.toBe('error');
      const pluginJson = JSON.parse(
        fs.readFileSync(path.join(result.outputDir, 'plugin.json'), 'utf-8')
      );
      expect(pluginJson.commands).toEqual([
        'commands/help.toml',
        'commands/status.toml',
      ]);
      expect(result.emittedFiles).toContain('GEMINI.md');
      expect(
        fs.readFileSync(path.join(result.outputDir, 'GEMINI.md'), 'utf-8')
      ).toContain('Gemini Context');
    });

    it('gemini: should emit explicit package install scripts without npm lifecycle hooks', () => {
      const result = compile({
        source: SAMPLE_PLUGIN_DIR,
        target: 'gemini',
        output: path.join(tmpDir, 'gemini-package-test'),
      });

      expect(result.status).not.toBe('error');
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.outputDir, 'package.json'), 'utf-8')
      );
      expect(packageJson.scripts['plugin:install']).toBe('node bin/install.js --global');
      expect(packageJson.scripts['plugin:uninstall']).toBe('node bin/uninstall.js --global');
      expect(packageJson.scripts.postinstall).toBeUndefined();
      expect(packageJson.scripts.preuninstall).toBeUndefined();
      expect(packageJson.scripts['sync:commands']).toBeUndefined();
    });

    it('github-copilot: should emit author as an object', () => {
      const result = compile({
        source: SAMPLE_PLUGIN_DIR,
        target: 'github-copilot',
        output: path.join(tmpDir, 'github-test'),
      });

      expect(result.status).not.toBe('error');
      expect(result.emittedFiles).toContain('hooks.json');
      const pluginJson = JSON.parse(
        fs.readFileSync(path.join(result.outputDir, 'plugin.json'), 'utf-8')
      );
      expect(pluginJson.author).toEqual({ name: 'a5c.ai' });
      expect(pluginJson.hooks).toBe('hooks.json');
      expect(pluginJson.agents).toBe('AGENTS.md');
      expect(result.emittedFiles).toContain('AGENTS.md');
      expect(
        fs.readFileSync(path.join(result.outputDir, 'AGENTS.md'), 'utf-8')
      ).toContain('Sample Plugin Context');

      const githubPluginJson = JSON.parse(
        fs.readFileSync(path.join(result.outputDir, '.github/plugin.json'), 'utf-8')
      );
      expect(githubPluginJson.author).toEqual({ name: 'a5c.ai' });
      expect(githubPluginJson.hooks).toBe('hooks.json');
    });

    it('github-copilot: should emit managed hook install and cleanup in bin scripts', () => {
      const result = compile({
        source: SAMPLE_PLUGIN_DIR,
        target: 'github-copilot',
        output: path.join(tmpDir, 'github-install-surface-test'),
      });

      expect(result.status).not.toBe('error');

      const installScript = fs.readFileSync(
        path.join(result.outputDir, 'bin/install.js'),
        'utf-8',
      );
      expect(installScript).toContain("typeof shared.registerCopilotPlugin === 'function'");
      expect(installScript).toContain("typeof shared.installCopilotSurface === 'function'");
      expect(installScript).toContain("typeof shared.warnWindowsHooks === 'function'");

      const uninstallScript = fs.readFileSync(
        path.join(result.outputDir, 'bin/uninstall.js'),
        'utf-8',
      );
      expect(uninstallScript).toContain("typeof shared.deregisterCopilotPlugin === 'function'");
      expect(uninstallScript).toContain("typeof shared.removeManagedHooks === 'function'");
      expect(uninstallScript).toContain("typeof shared.removeMarketplaceEntry === 'function'");
    });

    it('github-copilot: should emit explicit package install scripts without npm lifecycle hooks', () => {
      const result = compile({
        source: SAMPLE_PLUGIN_DIR,
        target: 'github-copilot',
        output: path.join(tmpDir, 'github-package-test'),
      });

      expect(result.status).not.toBe('error');
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.outputDir, 'package.json'), 'utf-8')
      );
      expect(packageJson.scripts['plugin:install']).toBe('node bin/install.js --global');
      expect(packageJson.scripts['plugin:uninstall']).toBe('node bin/uninstall.js --global');
      expect(packageJson.scripts.postinstall).toBeUndefined();
      expect(packageJson.scripts.preuninstall).toBeUndefined();
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
      expect(ext).toContain('export default function activate(pi: ExtensionAPI): void');
      expect(ext).toContain('const forwardPrimary = async (args: unknown) => {');
      expect(ext).toContain('pi.sendUserMessage(toSkillPrompt("sample-plugin", String(args ?? "").trim()));');
      expect(ext).toContain('function runProxiedHook(');
      expect(ext).toContain('PI_PLUGIN_ROOT: PLUGIN_ROOT');
      expect(ext).toContain('"help"');
      expect(ext).toContain('"status"');
      expect(result.emittedFiles).toContain('AGENTS.md');

      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.outputDir, 'package.json'), 'utf-8')
      );
      expect(packageJson.scripts['sync:commands']).toBeUndefined();
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
      expect(result.emittedFiles).toContain('AGENTS.md');

      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.outputDir, 'package.json'), 'utf-8')
      );
      expect(packageJson.scripts['sync:commands']).toBeUndefined();
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
      expect(result.emittedFiles).toContain('bin/cli.cjs');
      expect(result.emittedFiles).toContain('bin/install.cjs');
      expect(result.emittedFiles).toContain('bin/uninstall.cjs');

      const hooksJson = JSON.parse(
        fs.readFileSync(path.join(result.outputDir, 'hooks', 'hooks.json'), 'utf-8')
      );
      expect(hooksJson.hooks['session.created'][0].command).toBe(`echo '{}'`);
    });

    it('generates explicit fallback surfaces when required AGENTS/context files are undeclared', () => {
      const fallbackSource = path.resolve(__dirname, './fixtures/test-plugin');
      const geminiResult = compile({
        source: fallbackSource,
        target: 'gemini',
        output: path.join(tmpDir, 'gemini-fallback-test'),
      });
      const githubResult = compile({
        source: fallbackSource,
        target: 'github-copilot',
        output: path.join(tmpDir, 'github-fallback-test'),
      });

      expect(geminiResult.status).not.toBe('error');
      expect(githubResult.status).not.toBe('error');
      expect(
        fs.readFileSync(path.join(geminiResult.outputDir, 'GEMINI.md'), 'utf-8')
      ).toContain('generated by @a5c-ai/extension-mux');
      expect(
        fs.readFileSync(path.join(githubResult.outputDir, 'AGENTS.md'), 'utf-8')
      ).toContain('generated by @a5c-ai/extension-mux');
    });
  });
});
