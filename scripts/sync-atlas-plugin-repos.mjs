#!/usr/bin/env node
// Dedicated atlas external-repo sync. Mirrors scripts/sync-external-plugin-repos.mjs
// but is a NEW, independent pipeline:
//   - Targets are derived directly from plugins/atlas-unified/plugin.json (NOT from
//     the catalog externalRepo field).
//   - Destination repos are computed: a5c-ai/atlas-<suffix> (hard-coded suffix table).
//   - Source base is artifacts/generated-atlas-plugins (NOT artifacts/generated-plugins).
//   - No per-repo marketplace files are written.
//   - RELEASE.md attributes the sync to scripts/sync-atlas-plugin-repos.mjs.
//
// DEFAULT = DRY-RUN: no gh repo create, no clone, no network, no push. Each repo dir
// is git init + git remote add origin only. With --push (CI only): gh repo view/create
// if missing, git clone, checkout -B branch, commit, push.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const getArg = (name, fallback) => {
  const prefix = `${name}=`;
  const value = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
};

const branch = getArg('--branch', process.env.GITHUB_REF_NAME || currentBranch() || 'develop');
const workDir = resolve(getArg('--work-dir', join(ROOT, 'artifacts', 'atlas-external-repos')));
const shouldPush = args.has('--push');

// Hard-coded atlas destination-repo suffix table (spec.json repos[] / SPEC §1).
// Keyed by the atlas plugin.json target key. suffix → repo a5c-ai/atlas-<suffix>.
// The babysitter externalRepo suffix is used where one exists, else the target key
// (genty). This is HARD-CODED so the atlas pipeline has no runtime dependency on the
// catalog.
const ATLAS_REPO_SUFFIXES = new Map([
  ['antigravity-cli', 'antigravity'],
  ['claude-code', 'claude'],
  ['codex', 'codex'],
  ['cursor', 'cursor'],
  ['gemini', 'gemini'],
  ['github-copilot', 'github-copilot'],
  ['pi', 'pi'],
  ['oh-my-pi', 'omp'],
  ['opencode', 'opencode'],
  ['openclaw', 'openclaw'],
  ['genty', 'genty'],
]);

// Build the target list directly from the atlas plugin.json target set (NOT the
// catalog). repo = a5c-ai/atlas-<suffix>; packageName from plugin.json npmPackageName;
// sourceDir keyed on the atlas target key (the generator emits one dir per target key).
function buildTargetsFromAtlasManifest() {
  const manifestPath = join(ROOT, 'plugins', 'atlas-unified', 'plugin.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const targetKeys = Object.keys(manifest.targets || {});
  if (targetKeys.length === 0) {
    throw new Error('plugins/atlas-unified/plugin.json has no targets map.');
  }
  return targetKeys.map((targetKey) => {
    const suffix = ATLAS_REPO_SUFFIXES.get(targetKey);
    if (!suffix) {
      throw new Error(`No hard-coded atlas repo suffix for target "${targetKey}". Update ATLAS_REPO_SUFFIXES.`);
    }
    return {
      id: targetKey,
      repo: `a5c-ai/atlas-${suffix}`,
      sourceDir: `artifacts/generated-atlas-plugins/${targetKey}`,
      packageName: (manifest.targets[targetKey] && manifest.targets[targetKey].npmPackageName) || null,
      marketplaces: [], // atlas writes no per-repo marketplace file.
    };
  });
}

const targets = buildTargetsFromAtlasManifest();

function currentBranch() {
  const result = spawnSync('git', ['branch', '--show-current'], { cwd: ROOT, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function isTransientGitHubFailure(command, result) {
  if (command !== 'gh') return false;
  const output = `${result.stdout || ''}\n${result.stderr || ''}`;
  return /(HTTP (500|502|503|504)|connection reset|tls handshake timeout|timed out|unexpected EOF|stream error)/i.test(output);
}

function run(command, commandArgs, options = {}) {
  const retries = options.retries ?? 0;
  const retryDelayMs = options.retryDelayMs ?? 5000;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const result = spawnSync(command, commandArgs, {
      cwd: options.cwd || ROOT,
      encoding: 'utf8',
      stdio: options.stdio || 'pipe',
    });
    if (result.status === 0) {
      return result.stdout.trim();
    }
    if (attempt < retries && isTransientGitHubFailure(command, result)) {
      console.warn(`[retry ${attempt + 1}/${retries}] ${command} ${commandArgs.join(' ')} failed with a transient GitHub error. Retrying in ${retryDelayMs}ms.`);
      sleep(retryDelayMs);
      continue;
    }
    throw new Error(`${command} ${commandArgs.join(' ')} failed\n${result.stdout || ''}${result.stderr || ''}`);
  }
}

function copyTree(source, target) {
  mkdirSync(target, { recursive: true });
  for (const entry of readdirSync(source)) {
    if (['.git', 'node_modules', 'dist', 'artifacts'].includes(entry)) continue;
    const from = join(source, entry);
    const to = join(target, entry);
    if (statSync(from).isDirectory()) {
      copyTree(from, to);
    } else {
      mkdirSync(dirname(to), { recursive: true });
      writeFileSync(to, readFileSync(from));
    }
  }
}

function rewritePackageJson(repoDir, target) {
  const pkgPath = join(repoDir, 'package.json');
  if (!existsSync(pkgPath)) return;
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.repository = { type: 'git', url: `git+https://github.com/${target.repo}.git` };
  pkg.homepage = `https://github.com/${target.repo}#readme`;
  pkg.bugs = { url: `https://github.com/${target.repo}/issues` };
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function writeExternalReleaseFiles(repoDir, target) {
  mkdirSync(join(repoDir, '.github', 'workflows'), { recursive: true });
  mkdirSync(join(repoDir, 'scripts'), { recursive: true });
  writeFileSync(join(repoDir, '.github', 'workflows', 'publish.yml'), publishWorkflow());
  writeFileSync(join(repoDir, 'scripts', 'create-release-tag.mjs'), createTagScript());
  writeFileSync(join(repoDir, 'scripts', 'publish-from-tag.mjs'), publishScript(target));
}

function publishWorkflow() {
  return `name: Publish\n\non:\n  push:\n    branches:\n      - develop\n      - staging\n      - main\n    tags:\n      - 'release/**'\n\npermissions:\n  contents: write\n  id-token: write\n\nconcurrency:\n  group: publish-\${{ github.ref }}\n  cancel-in-progress: false\n\njobs:\n  create_release_tag:\n    if: \${{ !startsWith(github.ref, 'refs/tags/') }}\n    runs-on: ubuntu-latest\n    steps:\n      - name: Generate a5c GitHub App token\n        id: a5c-token\n        continue-on-error: true\n        uses: a5c-ai/generate-token-action@main\n      - uses: actions/checkout@v4\n        with:\n          fetch-depth: 0\n          token: \${{ steps.a5c-token.outputs.a5c_token || github.token }}\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n      - run: node scripts/create-release-tag.mjs\n\n  publish_from_tag:\n    if: \${{ startsWith(github.ref, 'refs/tags/release/') }}\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n        with:\n          fetch-depth: 0\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n          registry-url: https://registry.npmjs.org/\n          always-auth: true\n      - run: node scripts/publish-from-tag.mjs\n        env:\n          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}\n`;
}
function createTagScript() {
  return `#!/usr/bin/env node\nimport { spawnSync } from 'node:child_process';\nimport { existsSync, readFileSync } from 'node:fs';\n\nfunction run(command, args) {\n  const result = spawnSync(command, args, { encoding: 'utf8', stdio: 'inherit' });\n  if (result.status !== 0) process.exit(result.status || 1);\n}\n\nconst branch = process.env.GITHUB_REF_NAME || 'develop';\nconst sha = (process.env.GITHUB_SHA || '').slice(0, 12);\nconst version = existsSync('package.json') ? JSON.parse(readFileSync('package.json', 'utf8')).version : JSON.parse(readFileSync('versions.json', 'utf8')).sdkVersion;\nconst normalized = String(version).replace(/[^0-9A-Za-z._-]/g, '-');\nconst tag = 'release/' + branch + '/v' + normalized + '-' + sha;\nrun('git', ['config', 'user.name', 'github-actions[bot]']);\nrun('git', ['config', 'user.email', 'github-actions[bot]@users.noreply.github.com']);\nrun('git', ['tag', tag]);\nrun('git', ['push', 'origin', tag]);\n`;
}

function publishScript(target) {
  if (!target.packageName) {
    return `#!/usr/bin/env node
console.log('No npm package is published from this repository; release tag records the generated plugin artifact.');
`;
  }
  const build = target.buildBeforePublish
    ? "run('npm', ['install']);\nrun('npm', ['run', 'build']);\n"
    : '';
  return `#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: options.stdio || 'inherit', encoding: options.encoding });
  if (result.status !== 0 && !options.allowFailure) process.exit(result.status || 1);
  return result;
}

function npmView(packageSpec) {
  return run('npm', ['view', packageSpec, 'version'], { allowFailure: true, stdio: 'pipe', encoding: 'utf8' }).status === 0;
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const ref = process.env.GITHUB_REF_NAME || '';
const branch = ref.split('/')[1] || 'develop';
const tag = branch === 'main' ? 'latest' : branch;

if (!process.env.NODE_AUTH_TOKEN) {
  console.log('NODE_AUTH_TOKEN is not configured; skipping npm publish.');
  process.exit(0);
}

if (npmView(pkg.name + '@' + pkg.version)) {
  console.log(pkg.name + '@' + pkg.version + ' already exists; ensuring dist-tag ' + tag + '.');
  run('npm', ['dist-tag', 'add', pkg.name + '@' + pkg.version, tag], { allowFailure: true });
  process.exit(0);
}

for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
  for (const [name, version] of Object.entries(pkg[field] || {})) {
    if (!name.startsWith('@a5c-ai/') || version.startsWith('^') || version.startsWith('~') || version === '*' || version.startsWith('workspace:')) continue;
    if (!npmView(name + '@' + version)) {
      console.log('Required internal dependency ' + name + '@' + version + ' is not published yet; skipping npm publish.');
      process.exit(0);
    }
  }
}

${build}run('npm', ['publish', '--access', 'public', '--tag', tag]);
`;
}
function ensureRepo(target) {
  const url = `https://github.com/${target.repo}.git`;
  const repoDir = join(workDir, target.id);
  rmSync(repoDir, { recursive: true, force: true });
  if (shouldPush) {
    try {
      run('gh', ['repo', 'view', target.repo, '--json', 'name']);
    } catch {
      run('gh', ['repo', 'create', target.repo, '--public', '--confirm']);
    }
    run('git', ['clone', url, repoDir]);
  } else {
    mkdirSync(repoDir, { recursive: true });
    run('git', ['init'], { cwd: repoDir });
    run('git', ['remote', 'add', 'origin', url], { cwd: repoDir });
  }
  return repoDir;
}

function remoteBranchExists(repoDir, ref) {
  return spawnSync('git', ['rev-parse', '--verify', `origin/${ref}`], {
    cwd: repoDir,
    stdio: 'ignore',
  }).status === 0;
}

function prepareTarget(target) {
  const source = join(ROOT, target.sourceDir);
  if (!existsSync(source)) throw new Error(`Missing plugin source: ${target.sourceDir}`);
  const repoDir = ensureRepo(target);
  if (shouldPush && remoteBranchExists(repoDir, branch)) {
    run('git', ['checkout', '-B', branch, `origin/${branch}`], { cwd: repoDir });
  } else if (shouldPush) {
    run('git', ['checkout', '-B', branch], { cwd: repoDir });
  }
  for (const entry of readdirSync(repoDir)) {
    if (entry === '.git') continue;
    rmSync(join(repoDir, entry), { recursive: true, force: true });
  }
  copyTree(source, repoDir);
  rewritePackageJson(repoDir, target);
  writeExternalReleaseFiles(repoDir, target);
  writeFileSync(join(repoDir, 'RELEASE.md'), `# Release flow\n\n- Pushes to \`develop\`, \`staging\`, and \`main\` create immutable \`release/<branch>/v<version>-<sha>\` tags.\n- Publishing runs only from release tags.\n- Source content is synced by \`a5c-ai/babysitter\` via \`scripts/sync-atlas-plugin-repos.mjs\`.\n`);
  run('git', ['config', 'user.name', 'github-actions[bot]'], { cwd: repoDir });
  run('git', ['config', 'user.email', 'github-actions[bot]@users.noreply.github.com'], { cwd: repoDir });
  run('git', ['add', '-A'], { cwd: repoDir });
  const hasChanges = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoDir }).status !== 0;
  if (hasChanges) {
    run('git', ['commit', '-m', `chore: sync atlas ${target.id} plugin release source`], { cwd: repoDir });
  }
  if (shouldPush) {
    run('git', ['push', '-u', 'origin', branch], { cwd: repoDir });
  }
  return { repo: target.repo, changed: hasChanges, path: repoDir, source: target.sourceDir };
}

mkdirSync(workDir, { recursive: true });
const results = targets.map(prepareTarget);
console.log(JSON.stringify({ branch, workDir, pushed: shouldPush, results }, null, 2));
