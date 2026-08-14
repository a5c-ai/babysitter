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

/**
 * Git transports this installer accepts, as an explicit ALLOWLIST.
 *
 * Passing the URL as a literal argv entry stops shell injection, but it does
 * not stop git itself from executing the URL. `ext::sh -c "<command>"` makes
 * git run an arbitrary command as a "transport helper" — command execution with
 * no shell metacharacter anywhere in the string — and `file://` / bare local
 * paths turn a clone into an arbitrary filesystem read (plus, historically, a
 * hook-execution vector). Neither is rejected by "does this contain `;` or
 * backticks".
 *
 * Accepted, and nothing else:
 *   - `https://<rest>`            — the only fetchable web transport;
 *   - `git@<host>:<path>`         — the scp-like SSH form.
 *
 * Deliberately rejected: `ext::` and every other transport helper, `file://`
 * and local paths, `http://` (cleartext), `git://` (unauthenticated),
 * `ssh://`-spelled URLs (use the scp-like form), and any value carrying control
 * characters. Control characters are excluded rather than all whitespace: a
 * space in a URL path is inert as a single argv entry, a newline is not
 * (it can forge additional lines in files git writes).
 */
const HTTPS_GIT_URL_PATTERN = /^https:\/\/.+/;
const SSH_GIT_URL_PATTERN = /^git@[A-Za-z0-9._-]+:.+/;

/** A newline, NUL or other control character never belongs in a git URL. */
function hasControlCharacters(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

/**
 * Defense in depth: even for an allowlisted URL, git is told which transports
 * it may use at all. `protocol.allow=never` denies everything not explicitly
 * re-enabled, so a redirect or a submodule cannot smuggle `ext::` or `file://`
 * back in.
 */
const GIT_TRANSPORT_POLICY = [
  '-c',
  'protocol.allow=never',
  '-c',
  'protocol.https.allow=always',
  '-c',
  'protocol.ssh.allow=always',
];

function assertAllowedGitUrl(url: string): void {
  if (
    typeof url !== 'string' ||
    hasControlCharacters(url) ||
    !(HTTPS_GIT_URL_PATTERN.test(url) || SSH_GIT_URL_PATTERN.test(url))
  ) {
    throw new Error(
      `Unsupported git URL: ${JSON.stringify(url)}. Extensions may only be installed from ` +
        'https://<host>/<path> or git@<host>:<path>; transport helpers (ext::), local and file:// ' +
        'paths, http://, git:// and control characters are rejected.',
    );
  }
}

/**
 * The install directory name derived from the URL, validated rather than
 * sanitized.
 *
 * `url.split('/').pop()` returned `''` for a trailing-slash URL (which made the
 * install path the extensions directory ITSELF) and `'..'` for a URL ending in
 * `..` (which escaped it). A name that is not a single, ordinary directory
 * component is a rejected input, not something to repair into a guess.
 */
function deriveRepoName(url: string): string {
  const lastSeparator = Math.max(url.lastIndexOf('/'), url.lastIndexOf(':'));
  const repoName = url.slice(lastSeparator + 1).replace(/\.git$/, '');
  if (
    repoName.length === 0 ||
    repoName === '.' ||
    repoName === '..' ||
    repoName.includes('/') ||
    repoName.includes('\\')
  ) {
    throw new Error(
      `Cannot derive an extension directory from git URL ${JSON.stringify(url)}: the final path segment ` +
        `${JSON.stringify(repoName)} is not a single directory name. Use a URL whose last segment names ` +
        'the repository.',
    );
  }
  return repoName;
}

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
  // Validate BEFORE anything is created or executed: an `ext::` URL is command
  // execution through git's transport-helper mechanism even when it is passed
  // as one literal argv entry, and a URL whose last segment is empty or `..`
  // aims the install directory at (or above) the extensions root.
  assertAllowedGitUrl(url);
  const repoName = deriveRepoName(url);

  const dir = ensureExtensionsDir();
  const installDir = join(dir, repoName);

  // `git clone [<options>] [--] <repository> [<directory>]`: `--` makes the URL
  // and target directory operands, so leading-dash values cannot become flags.
  // `ref` is the value of `--branch` and is already a separate argv element.
  // GIT_TRANSPORT_POLICY precedes the subcommand and re-states the same
  // allowlist to git itself, so a redirect or submodule cannot reintroduce a
  // denied transport.
  const cloneArgs = [...GIT_TRANSPORT_POLICY, 'clone', '--depth', '1'];
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
