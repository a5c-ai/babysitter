// oh-my-pi harness output adapter

import type { A5cPluginManifest, TargetProfile, TransformedFile, Diagnostic } from '../../types.js';
import { BaseHarnessOutputAdapter } from './base.js';
import {
  resolveTargetCliName,
  resolveTargetNpmPackageName,
} from '../../sdkConfig.js';

export class OhMyPiAdapter extends BaseHarnessOutputAdapter {



  generateManifestFiles(
    _sourceDir: string,
    manifest: A5cPluginManifest,
    _targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile[] {
    const files: TransformedFile[] = [];
    files.push({
      path: 'package.json',
      content: generateOhMyPiManifest(manifest, this.targetName),
    });
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

export function generateOhMyPiManifest(manifest: ResolvedManifest, targetName = 'oh-my-pi'): string {
  const target: Pick<TargetProfile, 'name'> = { name: targetName };
  const packageJson: Record<string, unknown> = {
    name: resolveTargetNpmPackageName(manifest, target),
    version: manifest.version,
    type: 'module',
    description: `${manifest.description} — ${targetName}`,
    keywords: [targetName, manifest.name, 'orchestration'],
    omp: {
      extensions: ['./extensions'],
      skills: ['./skills'],
    },
    peerDependencies: {
      '@oh-my-pi/pi-coding-agent': '*',
    },
    scripts: {
      test: 'node --test test/integration.test.js && node test/packaged-install.test.cjs',
      'validate:ci': 'npm test',
      deploy: 'npm publish --access public',
      'deploy:staging': 'npm publish --access public --tag staging',
    },
    bin: { [resolveTargetCliName(manifest, target)]: 'bin/cli.cjs' },
    files: [
      'bin/',
      'package.json',
      'versions.json',
      'README.md',
      'AGENTS.md',
      'extensions/',
      'skills/',
      'commands/',
      'scripts/',
    ],
    author: typeof manifest.author === 'string' ? manifest.author : manifest.author.name,
    license: manifest.license,
    publishConfig: { access: 'public' },
  };

  const ompPkgName = packageJson.name as string;
  packageJson.repository = buildNpmRepository(manifest, ompPkgName);
  packageJson.homepage = buildNpmHomepage(manifest, ompPkgName);
  packageJson.bugs = buildNpmBugs(manifest);

  return JSON.stringify(packageJson, null, 2) + '\n';
}
