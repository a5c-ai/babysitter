/**
 * Integration tests for the babysitter-openclaw plugin.
 *
 * Validates plugin structure, JSON manifests, hook references,
 * command files, skill SKILL.md frontmatter, and extension assets.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGIN_ROOT = path.resolve(__dirname, '..');

function pluginPath(...segments) {
  return path.join(PLUGIN_ROOT, ...segments);
}

function fileExists(...segments) {
  return fs.existsSync(pluginPath(...segments));
}

function readText(...segments) {
  return fs.readFileSync(pluginPath(...segments), 'utf-8');
}

function readJson(...segments) {
  return JSON.parse(readText(...segments));
}

// ---------------------------------------------------------------------------
// 1. Syntax validation — JSON manifests
// ---------------------------------------------------------------------------

describe('plugin.json', () => {
  const plugin = readJson('plugin.json');

  it('is valid JSON with required fields', () => {
    assert.strictEqual(plugin.name, 'babysitter');
    assert.ok(plugin.skills, 'plugin.json must declare skills');
    assert.ok(plugin.hooks, 'plugin.json must declare hooks');
    assert.ok(plugin.commands, 'plugin.json must declare commands');
  });

  it('has description, version, and author', () => {
    assert.ok(plugin.description);
    assert.ok(plugin.version);
    assert.ok(plugin.author);
  });
});

describe('package.json', () => {
  const pkg = readJson('package.json');

  it('has correct name', () => {
    assert.strictEqual(pkg.name, '@a5c-ai/babysitter-openclaw');
  });

  it('has openclaw manifest with extensions', () => {
    assert.ok(pkg.openclaw, 'package.json must have openclaw field');
    assert.ok(Array.isArray(pkg.openclaw.extensions), 'openclaw.extensions must be an array');
  });

  it('has bin entry for CLI', () => {
    assert.ok(pkg.bin, 'package.json must declare bin');
    assert.ok(pkg.bin['babysitter-openclaw'], 'bin must include babysitter-openclaw');
  });

  it('has test scripts', () => {
    assert.ok(pkg.scripts.test, 'must have test script');
    assert.ok(pkg.scripts['test:integration'], 'must have test:integration script');
    assert.ok(pkg.scripts['test:packaged-install'], 'must have test:packaged-install script');
  });
});

describe('openclaw.plugin.json', () => {
  const manifest = readJson('openclaw.plugin.json');

  it('is valid JSON with required fields', () => {
    assert.strictEqual(manifest.name, 'babysitter');
    assert.ok(manifest.entrypoint, 'must have entrypoint');
    assert.ok(manifest.hooks, 'must declare hooks');
    assert.ok(manifest.capabilities, 'must declare capabilities');
  });

  it('declares expected hook entry points', () => {
    assert.ok(manifest.hooks.session_start, 'must have session_start hook');
    assert.ok(manifest.hooks.session_end, 'must have session_end hook');
    assert.ok(manifest.hooks.before_prompt_build, 'must have before_prompt_build hook');
    assert.ok(manifest.hooks.agent_end, 'must have agent_end hook');
  });
});

describe('hooks.json', () => {
  const hooksJson = readJson('hooks.json');

  it('is valid JSON with hooks object', () => {
    assert.ok(hooksJson.hooks, 'hooks.json must have hooks object');
  });

  it('declares SessionStart hook', () => {
    assert.ok(Array.isArray(hooksJson.hooks.SessionStart), 'must have SessionStart array');
    assert.ok(hooksJson.hooks.SessionStart.length > 0, 'SessionStart must not be empty');
    const hookCmd = hooksJson.hooks.SessionStart[0].hooks[0].command;
    assert.ok(hookCmd.includes('babysitter-session-start.sh'), 'SessionStart must reference session-start hook');
  });

  it('declares Stop hook', () => {
    assert.ok(Array.isArray(hooksJson.hooks.Stop), 'must have Stop array');
    assert.ok(hooksJson.hooks.Stop.length > 0, 'Stop must not be empty');
    const hookCmd = hooksJson.hooks.Stop[0].hooks[0].command;
    assert.ok(hookCmd.includes('babysitter-stop-hook.sh'), 'Stop must reference stop hook');
  });
});

describe('versions.json', () => {
  const versions = readJson('versions.json');

  it('exists and has sdkVersion', () => {
    assert.ok(versions.sdkVersion, 'versions.json must have sdkVersion');
    assert.strictEqual(typeof versions.sdkVersion, 'string');
  });
});

// ---------------------------------------------------------------------------
// 2. Plugin structure validation — directories and file existence
// ---------------------------------------------------------------------------

describe('directory structure', () => {
  for (const dir of ['skills', 'commands', 'hooks', 'extensions', 'bin', 'scripts']) {
    it(`${dir}/ directory exists`, () => {
      assert.ok(fileExists(dir), `${dir}/ must exist`);
    });
  }
});

describe('command files', () => {
  const commands = [
    'assimilate.md',
    'call.md',
    'cleanup.md',
    'contrib.md',
    'doctor.md',
    'forever.md',
    'help.md',
    'observe.md',
    'plan.md',
    'plugins.md',
    'project-install.md',
    'resume.md',
    'retrospect.md',
    'user-install.md',
    'yolo.md',
  ];

  for (const cmd of commands) {
    it(`commands/${cmd} exists`, () => {
      assert.ok(fileExists('commands', cmd), `commands/${cmd} must exist`);
    });
  }

  it('has exactly 15 command files', () => {
    const mdFiles = fs.readdirSync(pluginPath('commands')).filter((f) => f.endsWith('.md'));
    assert.strictEqual(mdFiles.length, 15, `expected 15 command files, found ${mdFiles.length}`);
  });

  it('command docs are synchronized with the command sync script', async () => {
    const { spawnSync } = await import('node:child_process');
    const result = spawnSync(
      process.execPath,
      [pluginPath('scripts', 'sync-command-docs.cjs'), '--check'],
      { cwd: PLUGIN_ROOT, encoding: 'utf8' },
    );
    assert.strictEqual(result.status, 0, result.stderr || result.stdout || 'command sync check failed');
  });
});

describe('hook scripts', () => {
  const hookScripts = ['babysitter-session-start.sh', 'babysitter-stop-hook.sh'];

  for (const script of hookScripts) {
    it(`hooks/${script} exists`, () => {
      assert.ok(fileExists('hooks', script), `hooks/${script} must exist`);
    });
  }

  it('all scripts referenced in hooks.json exist on disk', () => {
    const hooksJson = readJson('hooks.json');
    for (const [_hookType, matchers] of Object.entries(hooksJson.hooks)) {
      for (const matcher of matchers) {
        for (const hook of matcher.hooks) {
          if (hook.command) {
            const scriptPath = hook.command.replace(/^\.\//, '');
            assert.ok(fileExists(scriptPath), `hook script ${scriptPath} must exist`);
          }
        }
      }
    }
  });
});

describe('extension files', () => {
  it('has extensions/index.ts entrypoint', () => {
    assert.ok(fileExists('extensions', 'index.ts'));
  });

  it('extensions/index.ts references skill routing', () => {
    const content = readText('extensions', 'index.ts');
    assert.match(content, /\/skill:/, 'entrypoint must contain skill routing');
  });

  const extensionHooks = [
    'hooks/session-start.ts',
    'hooks/session-end.ts',
    'hooks/before-prompt-build.ts',
    'hooks/agent-end.ts',
  ];

  for (const hook of extensionHooks) {
    it(`extensions/${hook} exists`, () => {
      assert.ok(fileExists('extensions', hook), `extensions/${hook} must exist`);
    });
  }

  it('all hooks in openclaw.plugin.json point to existing files', () => {
    const manifest = readJson('openclaw.plugin.json');
    for (const [_name, hookPath] of Object.entries(manifest.hooks)) {
      assert.ok(fileExists(hookPath), `openclaw.plugin.json hook ${hookPath} must exist`);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Skill format validation
// ---------------------------------------------------------------------------

describe('skill SKILL.md files', () => {
  const expectedSkills = [
    'assimilate',
    'babysit',
    'call',
    'cleanup',
    'contrib',
    'doctor',
    'forever',
    'help',
    'observe',
    'plan',
    'plugins',
    'project-install',
    'resume',
    'retrospect',
    'user-install',
    'yolo',
  ];

  for (const skill of expectedSkills) {
    it(`skills/${skill}/SKILL.md exists`, () => {
      assert.ok(fileExists('skills', skill, 'SKILL.md'), `skills/${skill}/SKILL.md must exist`);
    });
  }

  it('has exactly 16 skill directories', () => {
    const skillDirs = fs
      .readdirSync(pluginPath('skills'), { withFileTypes: true })
      .filter((e) => e.isDirectory());
    assert.strictEqual(skillDirs.length, 16, `expected 16 skill directories, found ${skillDirs.length}`);
  });

  for (const skill of expectedSkills) {
    it(`skills/${skill}/SKILL.md has valid YAML frontmatter with name and description`, () => {
      const content = readText('skills', skill, 'SKILL.md');
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      assert.ok(fmMatch, `${skill}/SKILL.md must have YAML frontmatter`);
      const fm = fmMatch[1];
      const nameMatch = fm.match(/^name:\s*(.+)$/m);
      assert.ok(nameMatch, `${skill}/SKILL.md frontmatter must have name`);
      assert.strictEqual(nameMatch[1].trim(), skill, `name should match directory name`);
      const descMatch = fm.match(/^description:\s*(.+)$/m);
      assert.ok(descMatch, `${skill}/SKILL.md frontmatter must have description`);
      assert.ok(descMatch[1].trim().length > 0, 'description must not be empty');
    });
  }

  it('babysit skill references openclaw harness', () => {
    const content = readText('skills', 'babysit', 'SKILL.md');
    assert.ok(
      content.includes('OPENCLAW_PLUGIN_ROOT') || content.includes('openclaw'),
      'babysit skill should reference openclaw harness',
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Documentation and metadata
// ---------------------------------------------------------------------------

describe('documentation and metadata', () => {
  it('README exists and documents install flow', () => {
    const readme = readText('README.md');
    assert.match(readme, /babysitter-openclaw/, 'README must mention package name');
    assert.match(readme, /npm install|babysitter plugin:install/, 'README must document installation');
  });
});
