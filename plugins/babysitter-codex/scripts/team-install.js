#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SKILL_NAME = 'babysit';
const WORKSPACE_SKILL_ENTRIES = [
  { source: 'SKILL.md', target: 'SKILL.md' },
  { source: 'README.md', target: 'README.md' },
  { source: 'agents', target: 'agents' },
  { source: 'scripts', target: 'scripts' },
  { source: 'babysitter.lock.json', target: 'babysitter.lock.json' },
];

function listPromptEntries(packageRoot) {
  const promptsDir = path.join(packageRoot, 'prompts');
  return fs
    .readdirSync(promptsDir)
    .filter((name) => name.endsWith('.md') && name !== 'README.md')
    .sort();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseArgs(argv) {
  const args = {
    workspace: process.cwd(),
    dryRun: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--workspace' && argv[i + 1]) {
      args.workspace = path.resolve(argv[++i]);
    } else if (argv[i] === '--dry-run') {
      args.dryRun = true;
    }
  }
  return args;
}

function renderWorkspaceConfigToml() {
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

function installWorkspaceSkill(packageRoot, workspaceRoot, dryRun) {
  const workspaceSkillRoot = path.join(workspaceRoot, '.codex', 'skills', SKILL_NAME);
  const workspaceHookScriptsRoot = path.join(workspaceRoot, '.codex', 'hooks');
  const workspacePromptsRoot = path.join(workspaceRoot, '.codex', 'prompts');

  if (dryRun) {
    return {
      workspaceSkillRoot,
      workspaceHookScriptsRoot,
      workspacePromptsRoot,
    };
  }

  fs.rmSync(workspaceSkillRoot, { recursive: true, force: true });
  fs.mkdirSync(workspaceSkillRoot, { recursive: true });

  for (const entry of WORKSPACE_SKILL_ENTRIES) {
    copyRecursive(
      path.join(packageRoot, entry.source),
      path.join(workspaceSkillRoot, entry.target),
    );
  }

  fs.mkdirSync(workspaceHookScriptsRoot, { recursive: true });
  copyRecursive(path.join(packageRoot, '.codex', 'hooks'), workspaceHookScriptsRoot);

  fs.mkdirSync(workspacePromptsRoot, { recursive: true });
  for (const promptName of listPromptEntries(packageRoot)) {
    copyRecursive(
      path.join(packageRoot, 'prompts', promptName),
      path.join(workspacePromptsRoot, promptName),
    );
  }

  return {
    workspaceSkillRoot,
    workspaceHookScriptsRoot,
    workspacePromptsRoot,
  };
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
  const sectionPattern = new RegExp(`^\\[${sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\s*$`, 'm');
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
    return content.replace(sectionPattern, '[sandbox_workspace_write]\nwritable_roots = [".a5c", ".codex"]');
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

function mergeWorkspaceConfig(existing) {
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

function resolveProcessLibrarySpec(lock, workspaceRoot) {
  const processLibraryConfig = (lock && lock.content && (lock.content.processLibrary || lock.content.upstream)) || {};
  const repo = process.env.BABYSITTER_PROCESS_LIBRARY_REPO || processLibraryConfig.repo;
  if (!repo) {
    throw new Error('missing process-library repo configuration in babysitter.lock.json');
  }
  const ref = process.env.BABYSITTER_PROCESS_LIBRARY_REF || processLibraryConfig.ref || '';
  const cloneDir = path.join(workspaceRoot, '.a5c', 'process-library', 'babysitter-repo');
  const processSubpath = process.env.BABYSITTER_PROCESS_LIBRARY_SUBPATH ||
    processLibraryConfig.processSubpath ||
    'library';
  const referenceSubpath = process.env.BABYSITTER_PROCESS_LIBRARY_REFERENCE_SUBPATH ||
    processLibraryConfig.referenceSubpath ||
    'library/reference';
  return {
    repo,
    ref: ref || undefined,
    cloneDir,
    processRoot: path.join(cloneDir, ...processSubpath.split('/')),
    referenceRoot: path.join(cloneDir, ...referenceSubpath.split('/')),
    stateDir: path.join(workspaceRoot, '.a5c'),
  };
}

function ensureActiveProcessLibrary(packageRoot, lock, workspaceRoot, dryRun) {
  const spec = resolveProcessLibrarySpec(lock, workspaceRoot);
  const cloneExists = fs.existsSync(path.join(spec.cloneDir, '.git'));
  const cloneArgs = cloneExists
    ? ['process-library:update', '--dir', spec.cloneDir, '--json']
    : ['process-library:clone', '--repo', spec.repo, '--dir', spec.cloneDir, '--json'];
  if (spec.ref) {
    cloneArgs.splice(cloneExists ? 3 : 5, 0, '--ref', spec.ref);
  }
  const useArgs = ['process-library:use', '--dir', spec.processRoot, '--state-dir', spec.stateDir, '--json'];
  const activeArgs = ['process-library:active', '--state-dir', spec.stateDir, '--json'];

  if (dryRun) {
    return {
      ...spec,
      plannedCommands: [
        `babysitter ${cloneArgs.join(' ')}`,
        `babysitter ${useArgs.join(' ')}`,
        `babysitter ${activeArgs.join(' ')}`,
      ],
      activeStateFile: path.join(spec.stateDir, 'active', 'process-library.json'),
      binding: null,
    };
  }

  runBabysitterCli(packageRoot, cloneArgs, { cwd: workspaceRoot });
  if (!fs.existsSync(spec.processRoot)) {
    throw new Error(`fetched process library root is missing: ${spec.processRoot}`);
  }
  runBabysitterCli(packageRoot, useArgs, { cwd: workspaceRoot });
  const active = JSON.parse(runBabysitterCli(packageRoot, activeArgs, { cwd: workspaceRoot }));
  return {
    ...spec,
    plannedCommands: [],
    activeStateFile: active.stateFile,
    binding: active.binding || null,
  };
}

function buildHooksConfig() {
  return {
    hooks: {
      SessionStart: [
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: '.codex/hooks/babysitter-session-start.sh',
            },
          ],
        },
      ],
      UserPromptSubmit: [
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: '.codex/hooks/user-prompt-submit.sh',
            },
          ],
        },
      ],
      Stop: [
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: '.codex/hooks/babysitter-stop-hook.sh',
            },
          ],
        },
      ],
    },
  };
}

function main() {
  const args = parseArgs(process.argv);
  const packageRoot = path.resolve(process.env.BABYSITTER_PACKAGE_ROOT || path.join(__dirname, '..'));
  const workspaceRoot = args.workspace;
  const lockPath = path.join(packageRoot, 'babysitter.lock.json');
  if (!fs.existsSync(lockPath)) {
    throw new Error(`missing lock file: ${lockPath}`);
  }
  const lock = readJson(lockPath);
  const workspaceHooksConfigPath = path.join(workspaceRoot, '.codex', 'hooks.json');
  const workspaceConfigPath = path.join(workspaceRoot, '.codex', 'config.toml');
  const { workspaceSkillRoot, workspaceHookScriptsRoot, workspacePromptsRoot } = installWorkspaceSkill(packageRoot, workspaceRoot, args.dryRun);
  const processLibrary = ensureActiveProcessLibrary(packageRoot, lock, workspaceRoot, args.dryRun);
  const installInfo = {
    installedAt: new Date().toISOString(),
    runtime: lock.runtime,
    content: lock.content,
    lockVersion: lock.version,
    packageRoot,
    workspaceRoot,
    workspaceSkillRoot,
    workspacePromptsRoot,
    workspaceConfigPath,
    workspaceHooksConfigPath,
    hookScriptsRoot: workspaceHookScriptsRoot,
    processLibraryRepo: processLibrary.repo,
    ...(processLibrary.ref ? { processLibraryRef: processLibrary.ref } : {}),
    processLibraryCloneDir: processLibrary.cloneDir,
    processLibraryRoot: processLibrary.processRoot,
    processLibraryReferenceRoot: processLibrary.referenceRoot,
    processLibraryStateFile: processLibrary.activeStateFile,
  };

  if (args.dryRun) {
    console.log(JSON.stringify({
      ok: true,
      dryRun: true,
      installInfo,
      processLibrary: {
        repo: processLibrary.repo,
        ...(processLibrary.ref ? { ref: processLibrary.ref } : {}),
        cloneDir: processLibrary.cloneDir,
        processRoot: processLibrary.processRoot,
        referenceRoot: processLibrary.referenceRoot,
        stateFile: processLibrary.activeStateFile,
        plannedCommands: processLibrary.plannedCommands,
      },
    }, null, 2));
    return;
  }

  const outDir = path.join(workspaceRoot, '.a5c', 'team');
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(path.dirname(workspaceHooksConfigPath), { recursive: true });
  writeFileIfChanged(workspaceHooksConfigPath, `${JSON.stringify(buildHooksConfig(), null, 2)}\n`);
  const existingWorkspaceConfig = fs.existsSync(workspaceConfigPath)
    ? fs.readFileSync(workspaceConfigPath, 'utf8')
    : renderWorkspaceConfigToml();
  writeFileIfChanged(workspaceConfigPath, mergeWorkspaceConfig(existingWorkspaceConfig));
  fs.writeFileSync(path.join(outDir, 'install.json'), JSON.stringify(installInfo, null, 2), 'utf8');

  const profilePath = path.join(outDir, 'profile.json');
  if (!fs.existsSync(profilePath)) {
    fs.writeFileSync(profilePath, JSON.stringify({
      teamName: 'default',
      installedSkillRoot: workspaceSkillRoot,
      workspacePromptsRoot,
      workspaceConfigPath,
      workspaceHooksConfigPath,
      hookScriptsRoot: workspaceHookScriptsRoot,
      processLibraryLookupCommand: 'babysitter process-library:active --state-dir .a5c --json',
    }, null, 2), 'utf8');
  }

  console.log('[team-install] complete');
}

main();
