// Codex harness output adapter

import type { A5cPluginManifest, TargetProfile, TransformedFile, Diagnostic } from '../../types.js';
import { BaseHarnessOutputAdapter } from './base.js';
import {
  iterateHooks,
  slugify,
  resolveCmd,
  getPattern,
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
    const codexPkg = generateCodexManifest(manifest, this.targetName);
    files.push({ path: 'package.json', content: codexPkg });
    if (targetProfile.harnessManifestPath) {
      files.push({ path: targetProfile.harnessManifestPath, content: generateHarnessManifest(rawManifest || manifest, targetProfile) });
    }
    files.push({ path: '.app.json', content: JSON.stringify({ apps: {} }, null, 2) + '\n' });
    return files;
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

export function generateCodexManifest(manifest: ResolvedManifest, targetName = 'codex'): string {
  const target: Pick<TargetProfile, 'name'> = { name: targetName };
  const extraOutputs = activeExtraFileOutputs(manifest, targetName);
  const hasAssets = [...extraOutputs].some((p) => p === 'assets/' || p.startsWith('assets/'));
  const hasPluginLock = extraOutputs.has('plugin.lock.json');
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
      'bin/',
      'scripts/',
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

export function generateCodexHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};
  const pat = getPattern(manifest, targetProfile.name);
  const sdk = resolveSdkConfig(manifest);

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const cmd = resolveCmd(handler, slug, targetProfile.adapterName, '.codex', manifest.name, native, sdk.proxyPackage, sdk.proxyBinary, pat);
    hooks[native] = [{ matcher: '.*', hooks: [{ type: 'command', command: cmd }] }];
  });

  return JSON.stringify({ hooks }, null, 2) + '\n';
}
