#!/usr/bin/env node
'use strict';

/**
 * postinstall.js — Copies babysitter-codex skill files to ~/.codex/skills/
 * so Codex CLI discovers the skill globally for all projects.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const SKILL_NAME = 'babysitter-codex';
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const IS_WIN = process.platform === 'win32';
const INSTALL_ENTRIES = [
  { source: 'SKILL.md', required: true },
  { source: 'AGENTS.md', required: true },
  { source: 'README.md', required: true },
  { source: 'agents', required: true },
  { source: 'bin', required: true },
  { source: '.codex', required: true },
  { source: 'commands', required: true },
  { source: 'config', required: true },
  { source: 'docs', required: true },
  { source: 'scripts', required: true },
  { source: 'upstream', required: true },
  { source: 'babysitter.lock.json', required: true },
];

function getCodexHome() {
  if (process.env.CODEX_HOME) return process.env.CODEX_HOME;
  return path.join(os.homedir(), '.codex');
}

function writeFileIfChanged(filePath, contents) {
  if (fs.existsSync(filePath)) {
    const current = fs.readFileSync(filePath, 'utf8');
    if (current === contents) {
      return false;
    }
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
  return true;
}

function mergeCodexHomeConfig(codexHome) {
  const configPath = path.join(codexHome, 'config.toml');
  const featureLines = [
    '[features]',
    'codex_hooks = true',
    'multi_agent = true',
  ];

  if (!fs.existsSync(configPath)) {
    writeFileIfChanged(
      configPath,
      [
        'approval_policy = "on-request"',
        'sandbox_mode = "workspace-write"',
        '',
        ...featureLines,
        '',
      ].join('\n')
    );
    console.log(`[babysitter-codex]   wrote ${configPath}`);
    return;
  }

  let content = fs.readFileSync(configPath, 'utf8');
  if (!/^\s*codex_hooks\s*=.*$/m.test(content)) {
    if (/^\[features\]\s*$/m.test(content)) {
      content = content.replace(
        /^\[features\]\s*$/m,
        ['[features]', 'codex_hooks = true', 'multi_agent = true'].join('\n')
      );
    } else {
      content = [content.trimEnd(), '', ...featureLines, ''].join('\n');
    }
  } else if (!/^\s*multi_agent\s*=.*$/m.test(content) && /^\[features\]\s*$/m.test(content)) {
    content = content.replace(
      /^\[features\]\s*$/m,
      ['[features]', 'multi_agent = true'].join('\n')
    );
  }

  if (writeFileIfChanged(configPath, content)) {
    console.log(`[babysitter-codex]   merged ${configPath}`);
  }
}

function shouldAutoOnboardWorkspace(skillDir) {
  const initCwd = process.env.INIT_CWD;
  if (!initCwd) return null;

  const resolved = path.resolve(initCwd);
  if (!fs.existsSync(resolved)) return null;
  if (!fs.statSync(resolved).isDirectory()) return null;

  const normalizedWorkspace = resolved.toLowerCase();
  const normalizedPackageRoot = PACKAGE_ROOT.toLowerCase();
  const normalizedSkillDir = skillDir.toLowerCase();
  if (normalizedWorkspace === normalizedPackageRoot || normalizedWorkspace === normalizedSkillDir) {
    return null;
  }

  return resolved;
}

function autoOnboardWorkspace(skillDir) {
  const workspace = shouldAutoOnboardWorkspace(skillDir);
  if (!workspace) {
    return;
  }

  const scriptPath = path.join(skillDir, 'scripts', 'team-install.js');
  if (!fs.existsSync(scriptPath)) {
    console.warn('[babysitter-codex] WARNING: team-install.js is missing; skipping workspace hook onboarding');
    return;
  }

  const result = spawnSync(process.execPath, [scriptPath, '--workspace', workspace], {
    cwd: workspace,
    stdio: 'pipe',
    encoding: 'utf8',
    env: {
      ...process.env,
      BABYSITTER_PACKAGE_ROOT: skillDir,
    },
  });

  if (result.status !== 0) {
    console.warn(`[babysitter-codex] WARNING: workspace onboarding failed for ${workspace}`);
    if (result.stdout) console.warn(result.stdout.trim());
    if (result.stderr) console.warn(result.stderr.trim());
    return;
  }

  console.log(`[babysitter-codex]   onboarded workspace hooks/config at ${workspace}`);
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      // Skip node_modules, .a5c, .git, and test directories
      if (['node_modules', '.a5c', '.git', 'test', '.gitignore'].includes(entry)) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    // Codex requires SKILL.md frontmatter to begin exactly with "---".
    // Strip UTF-8 BOM if present to avoid loader parse failures.
    if (path.basename(src) === 'SKILL.md') {
      const file = fs.readFileSync(src);
      const hasBom = file.length >= 3 && file[0] === 0xef && file[1] === 0xbb && file[2] === 0xbf;
      fs.writeFileSync(dest, hasBom ? file.subarray(3) : file);
      return;
    }
    fs.copyFileSync(src, dest);
  }
}

function installEntry(skillDir, entry) {
  const src = path.join(PACKAGE_ROOT, entry.source);
  const dest = path.join(skillDir, entry.source);
  if (!fs.existsSync(src)) {
    if (entry.required) {
      throw new Error(`required install payload is missing: ${src}`);
    }
    return false;
  }
  copyRecursive(src, dest);
  console.log(`[babysitter-codex]   ${entry.source}${fs.statSync(src).isDirectory() ? '/' : ''}`);
  return true;
}

function verifyInstalledPayload(skillDir) {
  const missing = INSTALL_ENTRIES
    .map((entry) => entry.source)
    .filter((source) => !fs.existsSync(path.join(skillDir, source)));
  if (missing.length > 0) {
    throw new Error(`installed skill is incomplete; missing: ${missing.join(', ')}`);
  }
}

function main() {
  const codexHome = getCodexHome();
  const skillDir = path.join(codexHome, 'skills', SKILL_NAME);

  console.log(`[babysitter-codex] Installing skill to ${skillDir}`);

  try {
    fs.mkdirSync(skillDir, { recursive: true });

    for (const entry of INSTALL_ENTRIES) {
      installEntry(skillDir, entry);
    }

    verifyInstalledPayload(skillDir);
    mergeCodexHomeConfig(codexHome);

    if (!IS_WIN) {
      const hookDir = path.join(skillDir, '.codex', 'hooks');
      if (fs.existsSync(hookDir)) {
        for (const name of fs.readdirSync(hookDir)) {
          const hookPath = path.join(hookDir, name);
          if (name.endsWith('.sh') && fs.statSync(hookPath).isFile()) {
            fs.chmodSync(hookPath, 0o755);
          }
        }
        console.log('[babysitter-codex]   +x hooks/*.sh');
      }
    }

    autoOnboardWorkspace(skillDir);

    console.log('[babysitter-codex] Installation complete!');
    console.log('[babysitter-codex] Restart Codex to pick up the updated skill and hook config.');
  } catch (err) {
    console.error(`[babysitter-codex] Failed to install skill files: ${err.message}`);
    process.exitCode = 1;
  }
}

main();
