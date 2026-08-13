/**
 * FIX-010: the published-consumer gate that must pass before a channel tag
 * moves — "a missing dependency, missing bin, or failed import blocks channel
 * promotion".
 *
 * scripts/verify-published-release.mjs installs the EXACT release version of
 * every public package from the registry into a clean consumer project,
 * imports every root and exported subpath, and smokes every declared bin. Its
 * checks.json is what
 * `scripts/release-promotion.cjs record-validation --checks` turns into the
 * evidence that unlocks promotion.
 *
 * These tests drive the real script against fixture repositories with a fake
 * `npm` that installs from a local fixture "registry". Nothing here contacts or
 * mutates the npm registry.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const RELEASE_VERSION = '6.0.4';

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

const FAKE_NPM = [
  '#!/usr/bin/env node',
  "const fs = require('fs');",
  "const path = require('path');",
  'const args = process.argv.slice(2);',
  "if (process.env.NPM_FAKE_LOG) fs.appendFileSync(process.env.NPM_FAKE_LOG, args.join(' ') + '\\n');",
  'const registry = process.env.NPM_FAKE_REGISTRY;',
  "const nodeModules = path.join(process.cwd(), 'node_modules');",
  "if (args[0] === 'install') {",
  "  const specs = args.filter((a) => !a.startsWith('--') && a !== 'install');",
  '  for (const spec of specs) {',
  "    const at = spec.lastIndexOf('@');",
  '    const name = spec.slice(0, at);',
  '    const version = spec.slice(at + 1);',
  "    const source = path.join(registry, name.replace('/', '__'), version);",
  '    if (!fs.existsSync(source)) {',
  '      console.error(`npm error code E404 ${spec} is not in the registry`);',
  '      process.exit(1);',
  '    }',
  "    const dest = path.join(nodeModules, ...name.split('/'));",
  '    fs.mkdirSync(path.dirname(dest), { recursive: true });',
  '    fs.cpSync(source, dest, { recursive: true });',
  "    const manifest = JSON.parse(fs.readFileSync(path.join(dest, 'package.json'), 'utf8'));",
  "    const bins = typeof manifest.bin === 'string' ? { [manifest.name]: manifest.bin } : manifest.bin || {};",
  '    for (const [binName, target] of Object.entries(bins)) {',
  '      const targetPath = path.join(dest, target);',
  '      if (!fs.existsSync(targetPath)) continue; // npm cannot link a bin whose file the tarball omits',
  "      const binDir = path.join(nodeModules, '.bin');",
  '      fs.mkdirSync(binDir, { recursive: true });',
  '      const shim = path.join(binDir, binName);',
  '      fs.writeFileSync(shim, `#!/bin/sh\\nexec ${JSON.stringify(process.execPath)} ${JSON.stringify(targetPath)} "$@"\\n`);',
  '      fs.chmodSync(shim, 0o755);',
  '    }',
  '  }',
  '  process.exit(0);',
  '}',
  '// Registry queries and dist-tag mutations, backed by the fixture registry.',
  "const splitSpec = (spec) => { const at = spec.lastIndexOf('@'); return [spec.slice(0, at), spec.slice(at + 1)]; };",
  "const readTags = () => (process.env.NPM_FAKE_TAGS && fs.existsSync(process.env.NPM_FAKE_TAGS) ? JSON.parse(fs.readFileSync(process.env.NPM_FAKE_TAGS, 'utf8')) : {});",
  "if (args[0] === 'view') {",
  "  if (args[2] === 'dist-tags') { console.log(JSON.stringify(readTags()[args[1]] || {})); process.exit(0); }",
  '  const [name, version] = splitSpec(args[1]);',
  "  if (fs.existsSync(path.join(registry, name.replace('/', '__'), version))) { console.log(version); process.exit(0); }",
  '  console.error("npm error code E404"); process.exit(1);',
  '}',
  "if (args[0] === 'dist-tag' && args[1] === 'add') {",
  '  const [name, version] = splitSpec(args[2]);',
  '  const tags = readTags();',
  '  tags[name] = tags[name] || {};',
  '  tags[name][args[3]] = version;',
  '  fs.writeFileSync(process.env.NPM_FAKE_TAGS, JSON.stringify(tags, null, 2));',
  '  process.exit(0);',
  '}',
  "if (args[0] === 'ls') {",
  '  const dependencies = {};',
  '  const walk = (dir, prefix) => {',
  '    if (!fs.existsSync(dir)) return;',
  '    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {',
  "      if (!entry.isDirectory() || entry.name === '.bin') continue;",
  "      if (entry.name.startsWith('@')) { walk(path.join(dir, entry.name), entry.name + '/'); continue; }",
  "      const manifestPath = path.join(dir, entry.name, 'package.json');",
  '      if (!fs.existsSync(manifestPath)) continue;',
  "      dependencies[prefix + entry.name] = { version: JSON.parse(fs.readFileSync(manifestPath, 'utf8')).version };",
  '    }',
  '  };',
  "  walk(nodeModules, '');",
  '  console.log(JSON.stringify({ dependencies }));',
  '  process.exit(0);',
  '}',
  'process.exit(0);',
  '',
].join('\n');

/**
 * A fixture repository whose publishable inventory is two public packages, plus
 * a local fixture "registry" the fake npm installs from.
 */
function createFixture(t, { registryPackages }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fix010-published-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  writeJson(path.join(root, 'package.json'), {
    name: 'fixture-root',
    version: RELEASE_VERSION,
    private: true,
    workspaces: ['packages/*'],
  });
  for (const dir of ['leaf', 'consumer']) {
    writeJson(path.join(root, 'packages', dir, 'package.json'), {
      name: `@a5c-ai/fixture-${dir}`,
      version: RELEASE_VERSION,
      publishConfig: { access: 'public' },
    });
  }

  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  for (const script of ['verify-published-release.mjs', 'release-promotion.cjs']) {
    fs.copyFileSync(path.join(repoRoot, 'scripts', script), path.join(root, 'scripts', script));
  }
  fs.cpSync(path.join(repoRoot, 'scripts', 'lib'), path.join(root, 'scripts', 'lib'), { recursive: true });

  execFileSync('git', ['init', '--quiet'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'fixture@example.com'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'fixture'], { cwd: root });
  execFileSync('git', ['add', '-A'], { cwd: root });
  execFileSync('git', ['commit', '--quiet', '-m', 'fixture'], { cwd: root });

  // The fixture registry: <name-with-slash-replaced>/<version>/<package files>
  const registry = path.join(root, 'fixture-registry');
  for (const [spec, files] of Object.entries(registryPackages)) {
    const at = spec.lastIndexOf('@');
    const dir = path.join(registry, spec.slice(0, at).replace('/', '__'), spec.slice(at + 1));
    for (const [relative, contents] of Object.entries(files)) {
      if (relative === 'package.json') writeJson(path.join(dir, relative), contents);
      else writeFile(path.join(dir, relative), contents);
    }
  }

  const binDir = path.join(root, 'fake-bin');
  fs.mkdirSync(binDir, { recursive: true });
  const npmShim = path.join(binDir, 'npm');
  fs.writeFileSync(npmShim, FAKE_NPM);
  fs.chmodSync(npmShim, 0o755);

  const tagsPath = path.join(root, 'npm-dist-tags.json');
  writeJson(tagsPath, {
    '@a5c-ai/fixture-leaf': { latest: '6.0.0' },
    '@a5c-ai/fixture-consumer': { latest: '6.0.0' },
  });

  return { root, binDir, registry, tagsPath, logPath: path.join(root, 'npm-invocations.log') };
}

function fixtureEnv(fixture) {
  return {
    ...process.env,
    PATH: `${fixture.binDir}${path.delimiter}${process.env.PATH}`,
    NPM_FAKE_LOG: fixture.logPath,
    NPM_FAKE_REGISTRY: fixture.registry,
    NPM_FAKE_TAGS: fixture.tagsPath,
  };
}

function runPromotionCli(fixture, args) {
  return spawnSync(process.execPath, ['scripts/release-promotion.cjs', ...args], {
    cwd: fixture.root,
    encoding: 'utf8',
    env: fixtureEnv(fixture),
  });
}

function distTags(fixture) {
  return JSON.parse(fs.readFileSync(fixture.tagsPath, 'utf8'));
}

function runVerifier(fixture, args = []) {
  fs.writeFileSync(fixture.logPath, '');
  const result = spawnSync(
    process.execPath,
    ['scripts/verify-published-release.mjs', '--version', RELEASE_VERSION, ...args],
    {
      cwd: fixture.root,
      encoding: 'utf8',
      env: fixtureEnv(fixture),
    },
  );
  const reportDir = path.join(fixture.root, 'artifacts', 'published-consumer');
  const read = (file) =>
    fs.existsSync(path.join(reportDir, file))
      ? JSON.parse(fs.readFileSync(path.join(reportDir, file), 'utf8'))
      : null;
  return {
    ...result,
    invocations: fs.readFileSync(fixture.logPath, 'utf8').split('\n').filter(Boolean),
    checks: read('checks.json'),
    summary: read('summary.json'),
    resolvedVersions: read('resolved-versions.json'),
  };
}

const HEALTHY_LEAF = {
  'package.json': {
    name: '@a5c-ai/fixture-leaf',
    version: RELEASE_VERSION,
    type: 'module',
    exports: { '.': './index.js', './extra': './extra.js' },
    bin: { 'fixture-leaf': './cli.js' },
  },
  'index.js': 'export const leaf = true;\n',
  'extra.js': 'export const extra = true;\n',
  'cli.js': "#!/usr/bin/env node\nprocess.stdout.write('fixture-leaf ok\\n');\n",
};

const HEALTHY_CONSUMER = {
  'package.json': {
    name: '@a5c-ai/fixture-consumer',
    version: RELEASE_VERSION,
    type: 'module',
    exports: { '.': './index.js' },
  },
  'index.js': 'export const consumer = true;\n',
};

function statusOf(checks, name) {
  return checks.find((check) => check.name === name)?.status;
}

test('FIX-010: a healthy exact-version release passes every published-consumer check', (t) => {
  const fixture = createFixture(t, {
    registryPackages: {
      [`@a5c-ai/fixture-leaf@${RELEASE_VERSION}`]: HEALTHY_LEAF,
      [`@a5c-ai/fixture-consumer@${RELEASE_VERSION}`]: HEALTHY_CONSUMER,
    },
  });

  const result = runVerifier(fixture);

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.equal(result.summary.status, 'success');
  for (const check of ['package-install', 'root-import', 'subpath-import', 'bin-smoke']) {
    assert.equal(statusOf(result.checks, check), 'success', `${check} must pass\n${result.stderr}`);
  }
  assert.deepEqual(result.resolvedVersions.resolved, {
    '@a5c-ai/fixture-leaf': RELEASE_VERSION,
    '@a5c-ai/fixture-consumer': RELEASE_VERSION,
  });
  // Exact versions only: never a dist-tag.
  const install = result.invocations.find((line) => line.startsWith('install'));
  assert.match(install, /@a5c-ai\/fixture-leaf@6\.0\.4/);
  assert.doesNotMatch(install, /@(latest|staging|develop)\b/);
});

test('FIX-010: a version missing from the registry fails the install check', (t) => {
  const fixture = createFixture(t, {
    registryPackages: { [`@a5c-ai/fixture-leaf@${RELEASE_VERSION}`]: HEALTHY_LEAF },
  });

  const result = runVerifier(fixture);

  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.equal(statusOf(result.checks, 'package-install'), 'failure');
  assert.equal(result.summary.status, 'failure');
});

test('FIX-010: a missing runtime dependency fails the root import check', (t) => {
  const fixture = createFixture(t, {
    registryPackages: {
      [`@a5c-ai/fixture-leaf@${RELEASE_VERSION}`]: HEALTHY_LEAF,
      [`@a5c-ai/fixture-consumer@${RELEASE_VERSION}`]: {
        ...HEALTHY_CONSUMER,
        'index.js': "import '@a5c-ai/never-published';\nexport const consumer = true;\n",
      },
    },
  });

  const result = runVerifier(fixture);

  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.equal(statusOf(result.checks, 'root-import'), 'failure');
  assert.match(JSON.stringify(result.checks), /never-published/);
});

test('FIX-010: an exported subpath that cannot be imported fails independently of the root', (t) => {
  const fixture = createFixture(t, {
    registryPackages: {
      [`@a5c-ai/fixture-leaf@${RELEASE_VERSION}`]: {
        ...HEALTHY_LEAF,
        'extra.js': "import '@a5c-ai/never-published';\nexport const extra = true;\n",
      },
      [`@a5c-ai/fixture-consumer@${RELEASE_VERSION}`]: HEALTHY_CONSUMER,
    },
  });

  const result = runVerifier(fixture);

  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.equal(statusOf(result.checks, 'root-import'), 'success');
  assert.equal(statusOf(result.checks, 'subpath-import'), 'failure');
});

test('FIX-010: a declared bin that the published artifact does not ship fails the bin smoke check', (t) => {
  const leafWithoutCli = { ...HEALTHY_LEAF };
  delete leafWithoutCli['cli.js'];
  const fixture = createFixture(t, {
    registryPackages: {
      [`@a5c-ai/fixture-leaf@${RELEASE_VERSION}`]: leafWithoutCli,
      [`@a5c-ai/fixture-consumer@${RELEASE_VERSION}`]: HEALTHY_CONSUMER,
    },
  });

  const result = runVerifier(fixture);

  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.equal(statusOf(result.checks, 'bin-smoke'), 'failure');
  assert.match(JSON.stringify(result.checks), /fixture-leaf/);
});

// ---------------------------------------------------------------------------
// The whole gate, end to end: verify the exact version -> record evidence ->
// promote (or refuse to).
// ---------------------------------------------------------------------------

const EVIDENCE = 'artifacts/published-consumer/validation.json';
const CHECKS = 'artifacts/published-consumer/checks.json';

test('FIX-010: a failed published-consumer check leaves the channel on the previous release', (t) => {
  const leafWithoutCli = { ...HEALTHY_LEAF };
  delete leafWithoutCli['cli.js'];
  const fixture = createFixture(t, {
    registryPackages: {
      [`@a5c-ai/fixture-leaf@${RELEASE_VERSION}`]: leafWithoutCli,
      [`@a5c-ai/fixture-consumer@${RELEASE_VERSION}`]: HEALTHY_CONSUMER,
    },
  });

  assert.equal(runVerifier(fixture).status, 1);

  const recorded = runPromotionCli(fixture, [
    'record-validation',
    '--version',
    RELEASE_VERSION,
    '--candidate-tag',
    'candidate-6.0.4',
    '--checks',
    CHECKS,
    '--check',
    'live-stack=success',
    '--out',
    EVIDENCE,
  ]);
  assert.equal(recorded.status, 1, `${recorded.stdout}${recorded.stderr}`);

  const promoted = runPromotionCli(fixture, [
    'promote',
    '--version',
    RELEASE_VERSION,
    '--dist-tag',
    'latest',
    '--evidence',
    EVIDENCE,
  ]);
  assert.equal(promoted.status, 1, `${promoted.stdout}${promoted.stderr}`);
  assert.match(promoted.stderr, /bin-smoke/);
  assert.deepEqual(distTags(fixture), {
    '@a5c-ai/fixture-leaf': { latest: '6.0.0' },
    '@a5c-ai/fixture-consumer': { latest: '6.0.0' },
  });
});

test('FIX-010: a clean published-consumer run promotes the exact tested version onto the channel', (t) => {
  const fixture = createFixture(t, {
    registryPackages: {
      [`@a5c-ai/fixture-leaf@${RELEASE_VERSION}`]: HEALTHY_LEAF,
      [`@a5c-ai/fixture-consumer@${RELEASE_VERSION}`]: HEALTHY_CONSUMER,
    },
  });

  assert.equal(runVerifier(fixture).status, 0);

  const recorded = runPromotionCli(fixture, [
    'record-validation',
    '--version',
    RELEASE_VERSION,
    '--candidate-tag',
    'candidate-6.0.4',
    '--checks',
    CHECKS,
    '--check',
    'live-stack=success:vanilla-ni=success',
    '--resolved',
    'artifacts/published-consumer/resolved-versions.json',
    '--out',
    EVIDENCE,
  ]);
  assert.equal(recorded.status, 0, `${recorded.stdout}${recorded.stderr}`);

  const promoted = runPromotionCli(fixture, [
    'promote',
    '--version',
    RELEASE_VERSION,
    '--dist-tag',
    'latest',
    '--evidence',
    EVIDENCE,
  ]);
  assert.equal(promoted.status, 0, `${promoted.stdout}${promoted.stderr}`);
  assert.deepEqual(distTags(fixture), {
    '@a5c-ai/fixture-leaf': { latest: RELEASE_VERSION },
    '@a5c-ai/fixture-consumer': { latest: RELEASE_VERSION },
  });
});

test('FIX-010: the verifier refuses a mutable dist-tag as the version under test', (t) => {
  const fixture = createFixture(t, {
    registryPackages: { [`@a5c-ai/fixture-leaf@${RELEASE_VERSION}`]: HEALTHY_LEAF },
  });

  const result = spawnSync(
    process.execPath,
    ['scripts/verify-published-release.mjs', '--version', 'latest'],
    {
      cwd: fixture.root,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${fixture.binDir}${path.delimiter}${process.env.PATH}`, NPM_FAKE_REGISTRY: fixture.registry },
    },
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /mutable dist-tag/);
});
