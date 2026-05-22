function getGlobalStateDir() {
  return process.env.BABYSITTER_GLOBAL_STATE_DIR || path.join(getUserHome(), '.a5c');
}

function resolveCliCommand(packageRoot) {
  try {
    const result = spawnSync('babysitter', ['--version'], { stdio: 'pipe', timeout: 10000 });
    if (result.status === 0) return 'babysitter';
  } catch {}
  const versionsPath = path.join(packageRoot, 'versions.json');
  const versions = readJson(versionsPath) || {};
  const ver = versions.sdkVersion || 'latest';
  return `npx -y @a5c-ai/babysitter-sdk@${ver}`;
}

function runCli(packageRoot, cliArgs, options = {}) {
  const cmd = resolveCliCommand(packageRoot);
  const parts = cmd.split(' ');
  const result = spawnSync(parts[0], [...parts.slice(1), ...cliArgs], {
    stdio: options.stdio || 'inherit',
    timeout: options.timeout || 120000,
    cwd: options.cwd || process.cwd(),
    env: { ...process.env, ...options.env },
  });
  return result;
}

function ensureGlobalProcessLibrary(packageRoot) {
  const stateDir = getGlobalStateDir();
  const activeFile = path.join(stateDir, 'active', 'process-library.json');
  let active = readJson(activeFile);
  if (active && active.binding && active.binding.dir) {
    return active;
  }
  const defaultSpec = readJson(path.join(stateDir, 'process-library-defaults.json'));
  const cloneDir = defaultSpec && defaultSpec.cloneDir
    ? defaultSpec.cloneDir
    : path.join(stateDir, 'process-library', PLUGIN_NAME + '-repo');
  runCli(packageRoot, [
    'process-library:clone',
    '--dir', cloneDir,
    '--state-dir', stateDir,
    '--json',
  ], { stdio: 'pipe' });
  runCli(packageRoot, [
    'process-library:use',
    '--dir', cloneDir,
    '--state-dir', stateDir,
    '--json',
  ], { stdio: 'pipe' });
  active = readJson(activeFile);
  return {
    binding: active && active.binding ? active.binding : { dir: cloneDir },
    defaultSpec: defaultSpec || { cloneDir },
    stateFile: activeFile,
  };
}
