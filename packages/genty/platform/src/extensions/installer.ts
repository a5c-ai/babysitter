/**
 * Extension installer.
 *
 * Security (FIX-003): every caller-controlled value here — npm package name,
 * version, git URL, git ref, and the derived install directory — used to be
 * interpolated into `execSync` command strings, so a value containing `$( )`,
 * backticks, `;`, or quotes executed arbitrary commands. This module is not a
 * public API surface (`packages/genty/platform/package.json` has no
 * `./extensions` export and `src/index.ts` does not re-export it), but it does
 * ship inside `dist/`, so it is repaired with the same model as
 * `src/harness/worktreeIsolation.ts`: the binary is invoked directly with a
 * structured argument vector and `shell: false`, `--` terminates option parsing
 * where the tool supports it, and the values that reach a tool without an
 * option terminator are validated against a strict pattern first.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { ExtensionManifest, ExtensionSource } from '@a5c-ai/genty-core/extensions';

export interface InstalledExtension {
  manifest: ExtensionManifest;
  source: ExtensionSource;
  installPath: string;
  installedAt: string;
}

/** Options forwarded to the injected executor. */
export interface InstallerExecOptions {
  stdio?: 'pipe' | 'inherit' | 'ignore';
}

/**
 * Injected command executor.
 *
 * The contract is deliberately `(file, args)` and never a single command
 * string: every element of `args` must reach the child process as one literal
 * argument, with no shell parsing. Implementations MUST NOT enable a shell.
 */
export type InstallerExecFn = (
  file: string,
  args: readonly string[],
  options?: InstallerExecOptions,
) => void;

const defaultExec: InstallerExecFn = (file, args, options) => {
  execFileSync(file, [...args], { ...options, shell: false });
};

const NPM_BIN = process.platform === 'win32' ? 'npm.cmd' : 'npm';

/**
 * `npm install <spec>` has no option terminator, so a spec that begins with `-`
 * would be parsed as a flag. Package names and versions are therefore validated
 * against the npm naming rules before they are used as an operand.
 */
const NPM_PACKAGE_NAME_PATTERN = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
const NPM_VERSION_SPEC_PATTERN = /^[A-Za-z0-9.\-+~^><=|* ]+$/;

const EXTENSIONS_DIR = join(homedir(), '.genty', 'extensions');

export function getExtensionsDir(): string {
  return EXTENSIONS_DIR;
}

export function ensureExtensionsDir(): string {
  if (!existsSync(EXTENSIONS_DIR)) mkdirSync(EXTENSIONS_DIR, { recursive: true });
  return EXTENSIONS_DIR;
}

export function installFromNpm(
  packageName: string,
  version?: string,
  exec: InstallerExecFn = defaultExec,
): InstalledExtension {
  if (!NPM_PACKAGE_NAME_PATTERN.test(packageName)) {
    throw new Error(`Invalid npm package name: ${JSON.stringify(packageName)}`);
  }
  if (version !== undefined && !NPM_VERSION_SPEC_PATTERN.test(version)) {
    throw new Error(`Invalid npm version specifier: ${JSON.stringify(version)}`);
  }

  const dir = ensureExtensionsDir();
  const spec = version ? `${packageName}@${version}` : packageName;
  const installDir = join(dir, packageName.replace(/\//g, '-').replace(/^@/, ''));

  mkdirSync(installDir, { recursive: true });
  exec(NPM_BIN, ['install', '--prefix', installDir, '--no-save', spec], { stdio: 'pipe' });

  const manifest = loadManifest(join(installDir, 'node_modules', packageName));
  return {
    manifest,
    source: { type: 'npm', packageName, version },
    installPath: join(installDir, 'node_modules', packageName),
    installedAt: new Date().toISOString(),
  };
}

export function installFromGit(
  url: string,
  ref?: string,
  exec: InstallerExecFn = defaultExec,
): InstalledExtension {
  const dir = ensureExtensionsDir();
  const repoName = url.split('/').pop()?.replace('.git', '') ?? 'unknown';
  const installDir = join(dir, repoName);

  // `git clone [<options>] [--] <repository> [<directory>]`: `--` makes the URL
  // and target directory operands, so leading-dash values cannot become flags.
  // `ref` is the value of `--branch` and is already a separate argv element.
  const cloneArgs = ['clone', '--depth', '1'];
  if (ref) cloneArgs.push('--branch', ref);
  cloneArgs.push('--', url, installDir);
  exec('git', cloneArgs, { stdio: 'pipe' });

  if (existsSync(join(installDir, 'package.json'))) {
    exec(NPM_BIN, ['install', '--prefix', installDir], { stdio: 'pipe' });
  }

  const manifest = loadManifest(installDir);
  return {
    manifest,
    source: { type: 'git', url, ref },
    installPath: installDir,
    installedAt: new Date().toISOString(),
  };
}

export function installFromLocal(localPath: string): InstalledExtension {
  const manifest = loadManifest(localPath);
  return {
    manifest,
    source: { type: 'local', path: localPath },
    installPath: localPath,
    installedAt: new Date().toISOString(),
  };
}

export function listInstalled(): InstalledExtension[] {
  const dir = getExtensionsDir();
  if (!existsSync(dir)) return [];

  const entries: InstalledExtension[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const extDir = join(dir, entry.name);
    try {
      const manifest = loadManifest(extDir);
      entries.push({
        manifest,
        source: { type: 'local', path: extDir },
        installPath: extDir,
        installedAt: '',
      });
    } catch {
      // Skip invalid extensions
    }
  }

  return entries;
}

function loadManifest(dir: string): ExtensionManifest {
  const manifestPath = join(dir, 'package.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`No package.json found at ${dir}`);
  }
  const pkg = JSON.parse(readFileSync(manifestPath, 'utf8'));
  return {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    main: pkg.main ?? 'index.js',
    engines: pkg.engines,
    permissions: pkg.genty?.permissions,
  };
}
