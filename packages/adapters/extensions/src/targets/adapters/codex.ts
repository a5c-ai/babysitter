// Codex harness output adapter

import * as fs from 'fs';
import * as path from 'path';
import type { A5cPluginManifest, TargetProfile, TransformedFile, Diagnostic } from '../../types.js';
import { BaseHarnessOutputAdapter } from './base.js';
import {
  iterateHooks,
  slugify,
  getPattern,
  resolveHookPath,
  resolveSdkConfig,
} from './hooks-utils.js';
import {
  resolveTargetCliName,
  resolveTargetNpmPackageName,
} from '../../sdkConfig.js';
import { generateHarnessManifest } from '../../transformHelpers.js';
import { buildCodexMcpToml } from '../../mcpConfig.js';

export class CodexAdapter extends BaseHarnessOutputAdapter {

  generateMcpConfig(
    manifest: A5cPluginManifest,
    _targetProfile: TargetProfile
  ): TransformedFile | null {
    if (!manifest.mcpServers || Object.keys(manifest.mcpServers).length === 0) {
      return null;
    }
    return { path: 'mcp-servers.toml', content: buildCodexMcpToml(manifest.mcpServers) };
  }

  generateHookRegistration(
    manifest: A5cPluginManifest,
    targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile | null {
    const content = generateCodexHooksJson(manifest, targetProfile);
    return { path: targetProfile.hookRegistrationOutputPath || 'hooks.json', content };
  }

  generateManifestFiles(
    _sourceDir: string,
    manifest: A5cPluginManifest,
    targetProfile: TargetProfile,
    _diagnostics: Diagnostic[],
    rawManifest?: A5cPluginManifest
  ): TransformedFile[] {
    const files: TransformedFile[] = [];
    const hasVersionsJson = fs.existsSync(path.join(_sourceDir, 'versions.json'));
    const codexPkg = generateCodexManifest(manifest, this.targetName, { hasVersionsJson });
    files.push({ path: 'package.json', content: codexPkg });
    if (targetProfile.harnessManifestPath) {
      files.push({ path: targetProfile.harnessManifestPath, content: generateHarnessManifest(rawManifest || manifest, targetProfile) });
    }
    files.push({ path: '.app.json', content: JSON.stringify({ apps: {} }, null, 2) + '\n' });
    return files;
  }

  generateExtraTargetFiles(
    _sourceDir: string,
    manifest: A5cPluginManifest,
    targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile[] {
    return generateCodexHookRuntimeFiles(manifest, targetProfile);
  }
}

type ResolvedManifest = A5cPluginManifest & {
  npmPackageName?: string;
};

function buildNpmRepository(
  manifest: A5cPluginManifest,
  npmPackageName: string,
): Record<string, unknown> | undefined {
  if (!manifest.repository) return undefined;
  let url = typeof manifest.repository === 'string'
    ? manifest.repository
    : manifest.repository.url;
  if (!url.startsWith('git+')) url = `git+${url}`;
  if (!url.endsWith('.git')) url = `${url}.git`;
  const directory = `plugins/${npmPackageName.split('/').pop()}`;
  return { type: 'git', url, directory };
}

function buildNpmHomepage(
  manifest: A5cPluginManifest,
  npmPackageName: string,
): string | undefined {
  if (!manifest.repository) return undefined;
  const url = typeof manifest.repository === 'string'
    ? manifest.repository
    : manifest.repository.url;
  const base = url.replace(/\.git$/, '').replace(/^git\+/, '');
  const directory = `plugins/${npmPackageName.split('/').pop()}`;
  return `${base}/tree/main/${directory}#readme`;
}

function buildNpmBugs(
  manifest: A5cPluginManifest,
): Record<string, string> | undefined {
  if (!manifest.repository) return undefined;
  const url = typeof manifest.repository === 'string'
    ? manifest.repository
    : manifest.repository.url;
  const base = url.replace(/\.git$/, '').replace(/^git\+/, '');
  return { url: `${base}/issues` };
}

/**
 * Collect the set of output paths the active extraFileSets will emit for this
 * target, so the package.json `files` list only advertises paths that will
 * actually exist (a hook-free / asset-free plugin like atlas must not list
 * assets/ or plugin.lock.json — verify rejects listed-but-missing paths).
 */
function activeExtraFileOutputs(manifest: ResolvedManifest, targetName: string): Set<string> {
  const out = new Set<string>();
  const selected = manifest.targets?.[targetName]?.extraFileSets ?? [];
  const defs = manifest.extraFileSets ?? {};
  for (const setName of selected) {
    const set = defs[setName];
    if (!set) continue;
    for (const outputPath of Object.keys(set)) out.add(outputPath);
  }
  const extraFiles = manifest.targets?.[targetName]?.extraFiles ?? {};
  for (const outputPath of Object.keys(extraFiles)) out.add(outputPath);
  return out;
}

export function generateCodexManifest(
  manifest: ResolvedManifest,
  targetName = 'codex',
  options: { hasVersionsJson?: boolean } = {}
): string {
  const target: Pick<TargetProfile, 'name'> = { name: targetName };
  const extraOutputs = activeExtraFileOutputs(manifest, targetName);
  const hasAssets = [...extraOutputs].some((p) => p === 'assets/' || p.startsWith('assets/'));
  const hasPluginLock = extraOutputs.has('plugin.lock.json');
  const hasTests = [...extraOutputs].some((p) => p.startsWith('test/'));
  const packageJson: Record<string, unknown> = {
    name: resolveTargetNpmPackageName(manifest, target),
    version: manifest.version,
    description: manifest.description,
    scripts: {
      test: 'npm run validate:ci',
      'test:integration': 'node test/integration.test.js',
      'test:packaged-install': 'node test/packaged-install.test.js',
      'validate:ci': 'npm run test:integration && npm run test:packaged-install',
      'team:install': 'node scripts/team-install.js',
      deploy: 'npm publish --access public',
      'deploy:staging': 'npm publish --access public --tag staging',
    },
    bin: { [resolveTargetCliName(manifest, target)]: 'bin/cli.js' },
    files: [
      `.${targetName}-plugin/`,
      ...(hasAssets ? ['assets/'] : []),
      // hooks/ + hooks.json only when the plugin ships hooks (hook-free plugins
      // like atlas emit neither, and verify rejects listed-but-missing paths).
      ...(manifest.hooks && Object.keys(manifest.hooks).length > 0 ? ['hooks/', 'hooks.json'] : []),
      'skills/',
      '.app.json',
      // versions.json carries the SDK version pin the hook runtime reads.
      ...(options.hasVersionsJson ? ['versions.json'] : []),
      'bin/',
      'scripts/',
      ...(hasTests ? ['test/'] : []),
      ...(hasPluginLock ? ['plugin.lock.json'] : []),
      'README.md',
    ],
    keywords: [manifest.name, targetName, 'orchestration'],
    author: typeof manifest.author === 'string' ? manifest.author : manifest.author.name,
    license: manifest.license,
    publishConfig: { access: 'public' },
  };

  const pkgName = resolveTargetNpmPackageName(manifest, target);
  packageJson.repository = buildNpmRepository(manifest, pkgName);
  packageJson.homepage = buildNpmHomepage(manifest, pkgName);
  packageJson.bugs = buildNpmBugs(manifest);

  return JSON.stringify(packageJson, null, 2) + '\n';
}

function toNativeSlug(native: string): string {
  return native.replace(/[._]/g, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function codexEntryShimName(pluginName: string, native: string): string {
  return `${pluginName}-codex-${toNativeSlug(native)}.sh`;
}

export function codexHookLibName(pluginName: string): string {
  return `${pluginName}-codex-hook-lib.sh`;
}

export function codexSurfaceMarkerName(pluginName: string): string {
  return `.${pluginName}-managed-surface`;
}

/**
 * Codex runs plugin-sourced hook commands through the user's shell with the
 * session cwd, exporting CLAUDE_PLUGIN_ROOT / PLUGIN_ROOT for the bundle.
 * Each command resolves the entry shim through that env and no-ops cleanly
 * when neither variable is set, so a config copy evaluated outside a plugin
 * context never fails with exit 127 on every event. Codex ignores `matcher`
 * on lifecycle events and treats an absent matcher as match-all, so none is
 * emitted.
 */
export function generateCodexHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};
  const sdk = resolveSdkConfig(manifest);
  const pat = getPattern(manifest, targetProfile.name);

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const handlerPath = resolveHookPath(handler, slugify(canonical), manifest.name, native, pat);
    let cmd: string;
    if (handler === 'proxy') {
      cmd = `${sdk.proxyBinary} invoke --adapter ${targetProfile.adapterName} --json`;
    } else if (!handlerPath) {
      cmd = `echo '{}'`;
    } else {
      const shim = codexEntryShimName(manifest.name, native);
      cmd = `if [ -n "\${CLAUDE_PLUGIN_ROOT:-\${PLUGIN_ROOT:-}}" ]; then exec bash "\${CLAUDE_PLUGIN_ROOT:-$PLUGIN_ROOT}/hooks/${shim}"; fi`;
    }
    hooks[native] = [{ hooks: [{ type: 'command', command: cmd }] }];
  });

  return JSON.stringify({ hooks }, null, 2) + '\n';
}

/**
 * The Codex hook runtime: one shared lib plus one entry shim per hook. The
 * shim decides which installed copy of the plugin owns the event (workspace
 * .codex surface > Codex home surface > plugin bundle) so events fire exactly
 * once, extends PATH so the SDK CLIs resolve under a minimal hook
 * environment, and pipes the Codex payload through the hooks adapter into the
 * plugin's own handler script. All failure paths exit 0 so a broken or
 * partial install never breaks the Codex session.
 */
export function generateCodexHookRuntimeFiles(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): TransformedFile[] {
  const files: TransformedFile[] = [];
  if (!manifest.hooks || targetProfile.supportedHooks.size === 0) return files;

  const pat = getPattern(manifest, targetProfile.name);
  const libName = codexHookLibName(manifest.name);
  let hasShims = false;

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const handlerPath = resolveHookPath(handler, slugify(canonical), manifest.name, native, pat);
    if (!handlerPath) return;
    hasShims = true;
    const handlerName = handlerPath.replace(/^hooks\//, '');
    const ensureSdk = canonical === 'SessionStart' ? ' ensure-sdk' : '';
    files.push({
      path: `hooks/${codexEntryShimName(manifest.name, native)}`,
      content: `#!/bin/bash
# ${native} — Codex entry shim for hooks/${handlerName}.
set -uo pipefail
BSIT_SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
BSIT_SCRIPT_NAME="$(basename "\${BASH_SOURCE[0]}")"
. "$BSIT_SCRIPT_DIR/${libName}"
bsit_invoke "${handlerName}"${ensureSdk}
`,
      executable: true,
    });
  });

  if (hasShims) {
    files.push({
      path: `hooks/${libName}`,
      content: generateCodexHookLib(manifest, targetProfile),
      executable: true,
    });
  }
  return files;
}

function generateCodexHookLib(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const sdk = resolveSdkConfig(manifest);
  const marker = codexSurfaceMarkerName(manifest.name);
  const stateDirName = sdk.stateDir.replace(/^\.?/, '.').replace(/^\.\./, '.');
  return `#!/bin/bash
# Shared Codex hook runtime for the ${manifest.name} plugin. Sourced by the
# ${manifest.name}-codex-*.sh entry shims; not executed directly.
# Generated by the extensions-adapter compiler.

BSIT_MARKER="${marker}"

# Codex may run hooks with a minimal PATH (GUI launch, scrubbed env). Append
# the common npm/node global bin locations so the SDK CLIs resolve.
bsit_extend_path() {
  local dir
  for dir in \\
    "\${HOME:-}/.local/bin" \\
    "\${HOME:-}/.npm-global/bin" \\
    "\${HOME:-}/.volta/bin" \\
    "\${NVM_BIN:-}" \\
    "/opt/homebrew/bin" \\
    "/usr/local/bin"; do
    [ -n "$dir" ] && [ -d "$dir" ] || continue
    case ":$PATH:" in
      *":$dir:"*) ;;
      *) PATH="$PATH:$dir" ;;
    esac
  done
  export PATH
}

# Print the hooks dir of the surface that owns this event, if any. Precedence:
# nearest workspace surface walking up from the session cwd, then the Codex
# home surface (\${CODEX_HOME:-$HOME/.codex}). A surface only counts when both
# its marker and this event's shim exist, so a stale marker or half-removed
# install can never silently swallow events.
bsit_owning_surface() {
  local script_name="$1" d dir
  d="$PWD"
  while :; do
    if [ -f "$d/.codex/hooks/$BSIT_MARKER" ] && [ -f "$d/.codex/hooks/$script_name" ]; then
      printf '%s\\n' "$d/.codex/hooks"
      return 0
    fi
    [ "$d" = "/" ] && break
    d="$(dirname "$d")"
  done
  dir="\${CODEX_HOME:-\${HOME:-}/.codex}/hooks"
  if [ -f "$dir/$BSIT_MARKER" ] && [ -f "$dir/$script_name" ]; then
    printf '%s\\n' "$dir"
    return 0
  fi
  return 1
}

# Decide whether this copy of the shim should handle the event. Exactly one
# copy runs: the owning surface if one is live, otherwise the plugin bundle.
bsit_should_run() {
  local script_name="$1" owner
  if owner="$(bsit_owning_surface "$script_name")"; then
    [ "$BSIT_SCRIPT_DIR" -ef "$owner" ]
    return
  fi
  # No live surface is visible: the plugin-bundle copy handles the event. A
  # surface copy invoked outside its install-time environment (its config was
  # loaded, so no other copy will fire) also proceeds.
  return 0
}

bsit_sdk_version() {
  local f
  for f in "$BSIT_SCRIPT_DIR/../versions.json" "$BSIT_SCRIPT_DIR/versions.json"; do
    if [ -f "$f" ]; then
      node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).sdkVersion||'latest')}catch{console.log('latest')}" "$f" 2>/dev/null && return 0
    fi
  done
  echo latest
}

# Install the pinned SDK when missing. Attempts are stamped and retried at
# most every 6 hours so an offline/unwritable machine does not pay two npm
# registry timeouts on every session start.
bsit_ensure_sdk() {
  command -v ${sdk.cli} >/dev/null 2>&1 && return 0

  local stamp_dir="\${HOME:-/tmp}/${stateDirName}" stamp now last
  stamp="$stamp_dir/.codex-sdk-install-attempt"
  now="$(date +%s 2>/dev/null || echo 0)"
  last="$(cat "$stamp" 2>/dev/null || echo 0)"
  case "$last" in *[!0-9]*) last=0 ;; esac
  [ $((now - last)) -lt 21600 ] && return 1
  mkdir -p "$stamp_dir" 2>/dev/null && printf '%s' "$now" > "$stamp" 2>/dev/null

  local version
  version="$(bsit_sdk_version)"
  npm i -g "${sdk.package}@\${version}" --loglevel=error >/dev/null 2>&1 || \\
    npm i -g "${sdk.package}@\${version}" --prefix "\${HOME:-}/.local" --loglevel=error >/dev/null 2>&1 || true
  [ -d "\${HOME:-}/.local/bin" ] && export PATH="\${HOME:-}/.local/bin:$PATH"
  command -v ${sdk.cli} >/dev/null 2>&1
}

# Resolve the ${sdk.proxyBinary} bin: PATH first, then next to the ${sdk.cli}
# bin (${sdk.package} ships both bins from the same package).
bsit_resolve_proxy() {
  if command -v ${sdk.proxyBinary} >/dev/null 2>&1; then
    command -v ${sdk.proxyBinary}
    return 0
  fi
  local cli_bin sibling
  cli_bin="$(command -v ${sdk.cli} 2>/dev/null)" || return 1
  sibling="$(dirname "$cli_bin")/${sdk.proxyBinary}"
  if [ -x "$sibling" ]; then
    echo "$sibling"
    return 0
  fi
  return 1
}

# bsit_invoke <handler-script-filename> [ensure-sdk]
# Pipes the Codex hook payload (stdin) through the ${targetProfile.adapterName} hooks adapter
# into the plugin's handler script. Exits 0 without output when another copy
# owns the event or the SDK is unavailable, so a partial install never breaks
# the session.
bsit_invoke() {
  local handler_name="$1" ensure_sdk="\${2:-}"

  bsit_should_run "$BSIT_SCRIPT_NAME" || exit 0

  bsit_extend_path

  if [ -n "$ensure_sdk" ]; then
    bsit_ensure_sdk || true
  fi

  local proxy_bin
  if ! proxy_bin="$(bsit_resolve_proxy)"; then
    echo "[${manifest.name}] $BSIT_SCRIPT_NAME skipped: ${sdk.cli}/${sdk.proxyBinary} CLI not found on PATH. Install with: npm install -g ${sdk.package}" >&2
    exit 0
  fi

  exec "$proxy_bin" invoke --adapter ${targetProfile.adapterName} \\
    --handler "bash \\"$BSIT_SCRIPT_DIR/$handler_name\\"" \\
    --json
}
`;
}
