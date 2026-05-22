// Hermes harness output adapter

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

export class HermesAdapter extends BaseHarnessOutputAdapter {



  generateHookRegistration(
    manifest: A5cPluginManifest,
    targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile | null {
    const content = generateHermesHooksJson(manifest, targetProfile);
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
    const hermesPkg = generateHermesManifest(manifest, this.targetName);
    files.push({ path: 'package.json', content: hermesPkg });
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

export function generateHermesManifest(manifest: ResolvedManifest, targetName = 'hermes'): string {
  const target: Pick<TargetProfile, 'name'> = { name: targetName };
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
    },
    bin: { [resolveTargetCliName(manifest, target)]: 'bin/cli.js' },
    files: [
      'hooks/',
      'hooks.json',
      'skills/',
      'bin/',
      'scripts/',
      'README.md',
    ],
    keywords: [manifest.name, targetName, 'orchestration'],
    author: typeof manifest.author === 'string' ? manifest.author : manifest.author.name,
    license: manifest.license,
  };

  const pkgName = resolveTargetNpmPackageName(manifest, target);
  packageJson.repository = buildNpmRepository(manifest, pkgName);
  packageJson.homepage = buildNpmHomepage(manifest, pkgName);
  packageJson.bugs = buildNpmBugs(manifest);

  return JSON.stringify(packageJson, null, 2) + '\n';
}

export function generateHermesHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};
  const pat = getPattern(manifest, targetProfile.name);
  const sdk = resolveSdkConfig(manifest);

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const cmd = resolveCmd(handler, slug, targetProfile.adapterName, '.', manifest.name, native, sdk.proxyPackage, sdk.proxyBinary, pat);
    hooks[native] = [{ matcher: '.*', hooks: [{ type: 'command', command: cmd }] }];
  });

  return JSON.stringify({ hooks }, null, 2) + '\n';
}
