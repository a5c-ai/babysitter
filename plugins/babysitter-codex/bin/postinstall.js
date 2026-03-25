#!/usr/bin/env node
'use strict';

/**
 * postinstall.js
 *
 * Installs the Codex-facing Babysitter skill bundle globally under CODEX_HOME,
 * installs optional mode prompt aliases such as `/call` and `/plan`,
 * clones/updates the process library into ~/.a5c via the SDK CLI, and
 * optionally onboards the current workspace when npm was run from inside a
 * repo.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const SKILL_NAME = 'babysit';
const LEGACY_SKILL_NAME = 'babysitter-codex';
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const IS_WIN = process.platform === 'win32';
const INSTALL_ENTRIES = [
  { source: 'SKILL.md', required: true },
  { source: 'README.md', required: true },
  { source: 'agents', required: true },
  { source: 'prompts', required: true },
  { source: '.codex', required: true },
  { source: 'scripts', required: true },
  { source: 'babysitter.lock.json', required: true },
];
const LEGACY_PROMPT_NAMES = ['babysit.md'];

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
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

function listPromptEntries() {
  const promptsDir = path.join(PACKAGE_ROOT, 'prompts');
  if (!fs.existsSync(promptsDir)) {
    throw new Error(`required prompt alias directory is missing: ${promptsDir}`);
  }
  return fs
    .readdirSync(promptsDir)
    .filter((name) => name.endsWith('.md') && name.toLowerCase() !== 'readme.md')
    .sort()
    .map((name) => ({
      source: path.join('prompts', name),
      targetName: name,
    }));
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

function resolveLocalSdkCli(packageRoot) {
  if (process.env.BABYSITTER_SDK_CLI) {
    return path.resolve(process.env.BABYSITTER_SDK_CLI);
  }
  try {
    return require.resolve('@a5c-ai/babysitter-sdk/dist/cli/main.js', {
      paths: [packageRoot],
    });
  } catch {
    return undefined;
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

function resolveProcessLibrarySpec(packageRoot) {
  const lock = readJson(path.join(packageRoot, 'babysitter.lock.json'));
  const processLibraryConfig =
    (lock && lock.content && (lock.content.processLibrary || lock.content.upstream)) || {};
  const repo = process.env.BABYSITTER_PROCESS_LIBRARY_REPO || processLibraryConfig.repo;
  if (!repo) {
    throw new Error('missing process-library repo configuration in babysitter.lock.json');
  }
  const ref = process.env.BABYSITTER_PROCESS_LIBRARY_REF || processLibraryConfig.ref || '';
  const stateDir = getGlobalStateDir();
  const cloneDir = path.join(stateDir, 'process-library', 'babysitter-repo');
  const processSubpath =
    process.env.BABYSITTER_PROCESS_LIBRARY_SUBPATH ||
    processLibraryConfig.processSubpath ||
    'library';
  return {
    repo,
    ref: ref || undefined,
    stateDir,
    cloneDir,
    processRoot: path.join(cloneDir, ...processSubpath.split('/')),
  };
}

function ensureGlobalProcessLibrary(packageRoot) {
  const spec = resolveProcessLibrarySpec(packageRoot);
  const cloneExists = fs.existsSync(path.join(spec.cloneDir, '.git'));
  const cloneArgs = cloneExists
    ? ['process-library:update', '--dir', spec.cloneDir, '--json']
    : ['process-library:clone', '--repo', spec.repo, '--dir', spec.cloneDir, '--json'];
  if (spec.ref) {
    cloneArgs.splice(cloneExists ? 3 : 5, 0, '--ref', spec.ref);
  }
  runBabysitterCli(packageRoot, cloneArgs, { cwd: packageRoot });
  if (!fs.existsSync(spec.processRoot)) {
    throw new Error(`fetched process library root is missing: ${spec.processRoot}`);
  }
  runBabysitterCli(
    packageRoot,
    ['process-library:use', '--dir', spec.processRoot, '--state-dir', spec.stateDir, '--json'],
    { cwd: packageRoot },
  );
  const active = JSON.parse(
    runBabysitterCli(
      packageRoot,
      ['process-library:active', '--state-dir', spec.stateDir, '--json'],
      { cwd: packageRoot },
    ),
  );
  console.log(`[babysitter-codex]   process library: ${spec.processRoot}`);
  console.log(`[babysitter-codex]   process library state: ${active.stateFile}`);
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
      ].join('\n'),
    );
    console.log(`[babysitter-codex]   wrote ${configPath}`);
    return;
  }

  let content = fs.readFileSync(configPath, 'utf8');
  if (!/^\s*codex_hooks\s*=.*$/m.test(content)) {
    if (/^\[features\]\s*$/m.test(content)) {
      content = content.replace(
        /^\[features\]\s*$/m,
        ['[features]', 'codex_hooks = true', 'multi_agent = true'].join('\n'),
      );
    } else {
      content = [content.trimEnd(), '', ...featureLines, ''].join('\n');
    }
  } else if (!/^\s*multi_agent\s*=.*$/m.test(content) && /^\[features\]\s*$/m.test(content)) {
    content = content.replace(
      /^\[features\]\s*$/m,
      ['[features]', 'multi_agent = true'].join('\n'),
    );
  }

  if (writeFileIfChanged(configPath, content)) {
    console.log(`[babysitter-codex]   merged ${configPath}`);
  }
}

function removeLegacySkillDir(codexHome) {
  const legacyDir = path.join(codexHome, 'skills', LEGACY_SKILL_NAME);
  if (!fs.existsSync(legacyDir)) {
    return;
  }
  fs.rmSync(legacyDir, { recursive: true, force: true });
  console.log(`[babysitter-codex]   removed legacy skill ${legacyDir}`);
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
      ...(resolveLocalSdkCli(PACKAGE_ROOT)
        ? { BABYSITTER_SDK_CLI: resolveLocalSdkCli(PACKAGE_ROOT) }
        : {}),
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

function installPromptEntry(codexHome, entry) {
  const src = path.join(PACKAGE_ROOT, entry.source);
  if (!fs.existsSync(src)) {
    throw new Error(`required prompt payload is missing: ${src}`);
  }
  const dest = path.join(codexHome, 'prompts', entry.targetName);
  copyRecursive(src, dest);
  console.log(`[babysitter-codex]   prompts/${entry.targetName}`);
}

function verifyInstalledPayload(skillDir, codexHome) {
  const promptEntries = listPromptEntries();
  const missing = INSTALL_ENTRIES
    .map((entry) => entry.source)
    .filter((source) => !fs.existsSync(path.join(skillDir, source)));
  if (missing.length > 0) {
    throw new Error(`installed skill is incomplete; missing: ${missing.join(', ')}`);
  }
  for (const entry of promptEntries) {
    if (!fs.existsSync(path.join(codexHome, 'prompts', entry.targetName))) {
      throw new Error(`installed prompt is missing: ${entry.targetName}`);
    }
  }
}

function main() {
  const codexHome = getCodexHome();
  const skillDir = path.join(codexHome, 'skills', SKILL_NAME);
  const promptEntries = listPromptEntries();

  console.log(`[babysitter-codex] Installing skill to ${skillDir}`);

  try {
    fs.mkdirSync(skillDir, { recursive: true });

    for (const entry of INSTALL_ENTRIES) {
      installEntry(skillDir, entry);
    }
    for (const entry of promptEntries) {
      installPromptEntry(codexHome, entry);
    }

    verifyInstalledPayload(skillDir, codexHome);
    removeLegacySkillDir(codexHome);
    removeLegacyPrompts(codexHome);
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

    ensureGlobalProcessLibrary(PACKAGE_ROOT);
    autoOnboardWorkspace(skillDir);

    console.log('[babysitter-codex] Installation complete!');
    console.log('[babysitter-codex] Restart Codex to pick up the updated skill and hook config.');
  } catch (err) {
    console.error(`[babysitter-codex] Failed to install skill files: ${err.message}`);
    process.exitCode = 1;
  }
}

main();
