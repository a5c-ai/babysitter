#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(packageDir, 'package.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const binEntries = Object.entries(manifest.bin || {});

if (binEntries.length === 0) {
  fail('package.json must declare a CLI bin.');
}

for (const [name, relativePath] of binEntries) {
  const binPath = resolve(packageDir, relativePath);
  if (!existsSync(binPath)) {
    fail(`Declared bin ${name} is missing: ${relativePath}`);
  }

  const binSource = readFileSync(binPath, 'utf8');
  if (!binSource.startsWith('#!/usr/bin/env node')) {
    fail(`Declared bin ${name} must start with a node shebang.`);
  }

  const help = run(process.execPath, [binPath, '--help'], { cwd: packageDir, stdio: 'pipe' });
  const helpText = `${help.stdout || ''}${help.stderr || ''}`;
  if (!helpText.includes('babysitter-observer-dashboard') || helpText.includes('Starting observer:')) {
    fail(`Declared bin ${name} did not print bounded CLI help.`);
  }
}

const packDir = mkdtempSync(resolve(tmpdir(), 'observer-dashboard-pack-'));

try {
  const packed = run('npm', ['pack', '--pack-destination', packDir], { cwd: packageDir, stdio: 'pipe' });
  const tarballName = packed.stdout.trim().split(/\r?\n/).pop();
  if (!tarballName) {
    fail('npm pack did not report a tarball name.');
  }

  const tarballPath = resolve(packDir, tarballName);
  const listing = run('tar', ['-tzf', tarballPath], { cwd: packageDir, stdio: 'pipe' }).stdout;

  for (const [, relativePath] of binEntries) {
    const tarPath = `package/${relativePath.replace(/^\.\//, '')}`;
    if (!listing.split(/\r?\n/).includes(tarPath)) {
      fail(`Packed tarball is missing declared bin: ${tarPath}`);
    }
  }
} finally {
  rmSync(packDir, { recursive: true, force: true });
}

console.log('Observer dashboard release artifact verified.');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...options,
  });

  if (result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join('\n');
    fail(`${command} ${args.join(' ')} failed.${details ? `\n${details}` : ''}`);
  }

  return result;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
