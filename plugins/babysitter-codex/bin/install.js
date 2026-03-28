#!/usr/bin/env node
'use strict';

/**
 * install.js
 *
 * Installs the Codex-facing Babysitter skill bundle globally under CODEX_HOME,
 * installs Codex mode-wrapper skills such as `$call` and `$plan`,
 * clones/updates the process library into ~/.a5c via the SDK CLI.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const SKILL_NAME = 'babysit';
const LEGACY_SKILL_NAME = 'babysitter-codex';
const MODE_SKILL_NAMES = [
  'assimilate',
  'call',
  'doctor',
  'forever',
  'help',
  'issue',
  'model',
  'observe',
  'plan',
  'project-install',
  'resume',
  'retrospect',
  'team-install',
  'user-install',
  'yolo',
];
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const IS_WIN = process.platform === 'win32';
const GLOBAL_HOOK_SPECS = [
  { event: 'SessionStart', script: 'babysitter-session-start.sh' },
  { event: 'UserPromptSubmit', script: 'user-prompt-submit.sh' },
  { event: 'Stop', script: 'babysitter-stop-hook.sh' },
];
const INSTALL_ENTRIES = [
  { source: 'SKILL.md', required: true },
  { source: '.codex', required: true },
  { source: 'scripts', required: true },
  { source: 'babysitter.lock.json', required: true },
];
const LEGACY_PROMPT_NAMES = ['babysit.md', ...MODE_SKILL_NAMES.map((name) => `${name}.md`)];

function getCodexHome() {
  if (process.env.CODEX_HOME) return process.env.CODEX_HOME;
  return path.join(os.homedir(), '.codex');
}

function getGlobalStateDir() {
  if (process.env.BABYSITTER_GLOBAL_STATE_DIR) {
    return path.resolve(process.env.BABYSITTER_GLOBAL_STATE_DIR);
  }
  return path.join(os.homedir(), '.a5c');
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

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (['node_modules', '.a5c', '.git', 'test', '.gitignore'].includes(entry)) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }

  if (path.basename(src) === 'SKILL.md') {
    const file = fs.readFileSync(src);
    const hasBom = file.length >= 3 && file[0] === 0xef && file[1] === 0xbb && file[2] === 0xbf;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, hasBom ? file.subarray(3) : file);
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function listModeSkillEntries() {
  const skillsDir = path.join(PACKAGE_ROOT, '.codex', 'skills');
  if (!fs.existsSync(skillsDir)) {
    throw new Error(`required Codex skills directory is missing: ${skillsDir}`);
  }
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== SKILL_NAME)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const skillName = entry.name;
      const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
      if (!fs.existsSync(skillFile)) {
        throw new Error(`required mode skill payload is missing: ${skillFile}`);
      }
      return {
        skillName,
        sourceDir: path.join('.codex', 'skills', skillName),
      };
    });
}

function renderCodexConfigToml() {
  return [
    'approval_policy = "on-request"',
    'sandbox_mode = "workspace-write"',
    'project_doc_max_bytes = 65536',
    '',
    '[sandbox_workspace_write]',
    'writable_roots = [".a5c", ".codex"]',
    '',
    '[features]',
    'codex_hooks = true',
    'multi_agent = true',
    '',
    '[agents]',
    'max_depth = 3',
    'max_threads = 4',
    '',
  ].join('\n');
}

function insertRootKey(content, key, line) {
  const keyPattern = new RegExp(`^\\s*${key}\\s*=`, 'm');
  if (keyPattern.test(content)) {
    return content;
  }
  const sectionMatch = content.match(/^\[[^\]]+\]\s*$/m);
  if (!sectionMatch || sectionMatch.index === undefined) {
    return content.trim()
      ? `${content.trimEnd()}\n${line}\n`
      : `${line}\n`;
  }
  const before = content.slice(0, sectionMatch.index).trimEnd();
  const after = content.slice(sectionMatch.index);
  return before
    ? `${before}\n${line}\n\n${after}`
    : `${line}\n\n${after}`;
}

function ensureSectionLine(content, sectionName, lineKey, line) {
  const keyPattern = new RegExp(`^\\s*${lineKey}\\s*=`, 'm');
  if (keyPattern.test(content)) {
    return content;
  }
  const sectionHeader = `[${sectionName}]`;
  const escapedSection = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sectionPattern = new RegExp(`^\\[${escapedSection}\\]\\s*$`, 'm');
  if (sectionPattern.test(content)) {
    return content.replace(sectionPattern, `${sectionHeader}\n${line}`);
  }
  return content.trim()
    ? `${content.trimEnd()}\n\n${sectionHeader}\n${line}\n`
    : `${sectionHeader}\n${line}\n`;
}

function ensureWritableRoots(content) {
  const sectionPattern = /^\[sandbox_workspace_write\]\s*$/m;
  const rootsPattern = /^writable_roots\s*=\s*\[(.*?)\]\s*$/m;
  const requiredRoots = ['.a5c', '.codex'];

  if (!sectionPattern.test(content)) {
    return content.trim()
      ? `${content.trimEnd()}\n\n[sandbox_workspace_write]\nwritable_roots = [".a5c", ".codex"]\n`
      : '[sandbox_workspace_write]\nwritable_roots = [".a5c", ".codex"]\n';
  }

  if (!rootsPattern.test(content)) {
    return content.replace(
      sectionPattern,
      '[sandbox_workspace_write]\nwritable_roots = [".a5c", ".codex"]',
    );
  }

  return content.replace(rootsPattern, (_match, inner) => {
    const values = inner
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => part.replace(/^"(.*)"$/, '$1'));
    const merged = [...new Set([...values, ...requiredRoots])];
    const rendered = merged.map((value) => `"${value}"`).join(', ');
    return `writable_roots = [${rendered}]`;
  });
}

function mergeCodexConfig(existing) {
  let content = existing.trim() ? existing : '';
  content = insertRootKey(content, 'approval_policy', 'approval_policy = "on-request"');
  content = insertRootKey(content, 'sandbox_mode', 'sandbox_mode = "workspace-write"');
  content = insertRootKey(content, 'project_doc_max_bytes', 'project_doc_max_bytes = 65536');
  content = ensureWritableRoots(content);
  content = ensureSectionLine(content, 'features', 'codex_hooks', 'codex_hooks = true');
  content = ensureSectionLine(content, 'features', 'multi_agent', 'multi_agent = true');
  content = ensureSectionLine(content, 'agents', 'max_depth', 'max_depth = 3');
  content = ensureSectionLine(content, 'agents', 'max_threads', 'max_threads = 4');
  return `${content.trimEnd()}\n`;
}

function renderHookCommand(filePath) {
  const normalized = String(filePath).replace(/\\/g, '/');
  return normalized.includes(' ') ? `"${normalized}"` : normalized;
}

function buildHooksConfig(hooksRoot) {
  return {
    hooks: Object.fromEntries(
      GLOBAL_HOOK_SPECS.map(({ event, script }) => [
        event,
        [
          {
            matcher: '*',
            hooks: [
              {
                type: 'command',
                command: renderHookCommand(path.join(hooksRoot, script)),
              },
            ],
          },
        ],
      ]),
    ),
  };
}

function ensureExecutableHooks(hookDir) {
  if (IS_WIN || !fs.existsSync(hookDir)) {
    return;
  }
  for (const name of fs.readdirSync(hookDir)) {
    const hookPath = path.join(hookDir, name);
    if (name.endsWith('.sh') && fs.statSync(hookPath).isFile()) {
      fs.chmodSync(hookPath, 0o755);
    }
  }
  console.log(`[babysitter-codex]   +x ${hookDir}`);
}

function resolveBabysitterCommand(packageRoot) {
  if (process.env.BABYSITTER_SDK_CLI) {
    return {
      command: process.execPath,
      argsPrefix: [path.resolve(process.env.BABYSITTER_SDK_CLI)],
    };
  }
  try {
    return {
      command: process.execPath,
      argsPrefix: [
        require.resolve('@a5c-ai/babysitter-sdk/dist/cli/main.js', {
          paths: [packageRoot],
        }),
      ],
    };
  } catch {
    return {
      command: 'babysitter',
      argsPrefix: [],
    };
  }
}

function runBabysitterCli(packageRoot, cliArgs, options = {}) {
  const resolved = resolveBabysitterCommand(packageRoot);
  const result = spawnSync(resolved.command, [...resolved.argsPrefix, ...cliArgs], {
    cwd: options.cwd || process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    env: {
      ...process.env,
      ...(options.env || {}),
    },
  });
  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    const stdout = (result.stdout || '').trim();
    throw new Error(
      `babysitter ${cliArgs.join(' ')} failed` +
      (stderr ? `: ${stderr}` : stdout ? `: ${stdout}` : ''),
    );
  }
  return result.stdout;
}

function ensureGlobalProcessLibrary(packageRoot) {
  const active = JSON.parse(
    runBabysitterCli(
      packageRoot,
      ['process-library:active', '--state-dir', getGlobalStateDir(), '--json'],
      { cwd: packageRoot },
    ),
  );
  console.log(`[babysitter-codex]   process library: ${active.binding?.dir}`);
  if (active.defaultSpec?.cloneDir) {
    console.log(`[babysitter-codex]   process library clone: ${active.defaultSpec.cloneDir}`);
  }
  console.log(`[babysitter-codex]   process library state: ${active.stateFile}`);
}

function mergeCodexHomeConfig(codexHome) {
  const configPath = path.join(codexHome, 'config.toml');
  if (!fs.existsSync(configPath)) {
    writeFileIfChanged(configPath, renderCodexConfigToml());
    console.log(`[babysitter-codex]   wrote ${configPath}`);
    return;
  }

  const content = mergeCodexConfig(fs.readFileSync(configPath, 'utf8'));
  if (writeFileIfChanged(configPath, content)) {
    console.log(`[babysitter-codex]   merged ${configPath}`);
  }
}

function installGlobalHooks(codexHome) {
  const srcHooksDir = path.join(PACKAGE_ROOT, '.codex', 'hooks');
  if (!fs.existsSync(srcHooksDir)) {
    throw new Error(`required hook payload is missing: ${srcHooksDir}`);
  }

  const hooksDir = path.join(codexHome, 'hooks');
  copyRecursive(srcHooksDir, hooksDir);
  console.log('[babysitter-codex]   hooks/');

  const hooksConfigPath = path.join(codexHome, 'hooks.json');
  writeFileIfChanged(
    hooksConfigPath,
    `${JSON.stringify(buildHooksConfig(hooksDir), null, 2)}\n`,
  );
  console.log('[babysitter-codex]   hooks.json');

  ensureExecutableHooks(hooksDir);
}

function removeLegacySkillDir(codexHome) {
  const legacyDir = path.join(codexHome, 'skills', LEGACY_SKILL_NAME);
  if (!fs.existsSync(legacyDir)) {
    return;
  }
  fs.rmSync(legacyDir, { recursive: true, force: true });
  console.log(`[babysitter-codex]   removed legacy skill ${legacyDir}`);
}

function removeEmbeddedPromptSource(skillDir) {
  const embeddedPromptsDir = path.join(skillDir, 'prompts');
  if (!fs.existsSync(embeddedPromptsDir)) {
    return;
  }
  fs.rmSync(embeddedPromptsDir, { recursive: true, force: true });
  console.log(`[babysitter-codex]   removed embedded prompt source ${embeddedPromptsDir}`);
}

function removeLegacyPrompts(codexHome) {
  for (const promptName of LEGACY_PROMPT_NAMES) {
    const promptPath = path.join(codexHome, 'prompts', promptName);
    if (!fs.existsSync(promptPath)) {
      continue;
    }
    fs.rmSync(promptPath, { force: true });
    console.log(`[babysitter-codex]   removed legacy prompt ${promptPath}`);
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

function installModeSkillEntry(codexHome, entry) {
  const src = path.join(PACKAGE_ROOT, entry.sourceDir);
  const dest = path.join(codexHome, 'skills', entry.skillName);
  copyRecursive(src, dest);
  console.log(`[babysitter-codex]   skills/${entry.skillName}/`);
}

function verifyInstalledPayload(skillDir, codexHome) {
  const modeSkillEntries = listModeSkillEntries();
  const missing = INSTALL_ENTRIES
    .map((entry) => entry.source)
    .filter((source) => !fs.existsSync(path.join(skillDir, source)));
  if (missing.length > 0) {
    throw new Error(`installed skill is incomplete; missing: ${missing.join(', ')}`);
  }
  for (const entry of modeSkillEntries) {
    if (!fs.existsSync(path.join(codexHome, 'skills', entry.skillName, 'SKILL.md'))) {
      throw new Error(`installed mode skill is missing: ${entry.skillName}`);
    }
  }
}

function main() {
  const codexHome = getCodexHome();
  const skillDir = path.join(codexHome, 'skills', SKILL_NAME);
  const modeSkillEntries = listModeSkillEntries();

  console.log(`[babysitter-codex] Installing skill to ${skillDir}`);

  try {
    fs.mkdirSync(skillDir, { recursive: true });

    for (const entry of INSTALL_ENTRIES) {
      installEntry(skillDir, entry);
    }
    for (const entry of modeSkillEntries) {
      installModeSkillEntry(codexHome, entry);
    }

    verifyInstalledPayload(skillDir, codexHome);
    removeEmbeddedPromptSource(skillDir);
    removeLegacySkillDir(codexHome);
    removeLegacyPrompts(codexHome);
    mergeCodexHomeConfig(codexHome);
    installGlobalHooks(codexHome);

    ensureExecutableHooks(path.join(skillDir, '.codex', 'hooks'));

    ensureGlobalProcessLibrary(PACKAGE_ROOT);

    console.log('[babysitter-codex] Installation complete!');
    console.log('[babysitter-codex] Restart Codex to pick up the updated global skill and mode-skill config.');
  } catch (err) {
    console.error(`[babysitter-codex] Failed to install skill files: ${err.message}`);
    process.exitCode = 1;
  }
}

main();
