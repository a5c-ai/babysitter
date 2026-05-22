// OpenClaw harness output adapter

import type { A5cPluginManifest, TargetProfile, TransformedFile, Diagnostic } from '../../types.js';
import { BaseHarnessOutputAdapter } from './base.js';
import {
  iterateHooks,
  slugify,
  applyPattern,
  getPattern,
  resolveSdkConfig,
} from './hooks-utils.js';
import {
  resolveTargetCliName,
  resolveTargetNpmPackageName,
} from '../../sdkConfig.js';
import { generateOpenClawNativeHooksSection } from '../../transformHelpers.js';

export class OpenClawAdapter extends BaseHarnessOutputAdapter {



  generateHookRegistration(
    manifest: A5cPluginManifest,
    targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile | null {
    const content = JSON.stringify({
      description: `${manifest.name} plugin hooks for OpenClaw`,
      hooks: {},
    }, null, 2) + '\n';
    return { path: targetProfile.hookRegistrationOutputPath || 'hooks.json', content };
  }

  generateManifestFiles(
    _sourceDir: string,
    manifest: A5cPluginManifest,
    targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile[] {
    const files: TransformedFile[] = [];
    files.push({
      path: 'package.json',
      content: generateOpenClawPackageManifest(manifest, this.targetName),
    });
    files.push({
      path: 'plugin.json',
      content: generateOpenClawManifest(manifest),
    });
    const nativePluginManifest = targetProfile.requiredSurfaceFile || `${this.targetName}.plugin.json`;
    files.push({
      path: nativePluginManifest,
      content: JSON.stringify(
        {
          name: manifest.name,
          version: manifest.version,
          description: manifest.description,
          entrypoint: 'extensions/index.ts',
          hooks: generateOpenClawNativeHooksSection(manifest, targetProfile),
          capabilities: ['orchestration', 'process-management', 'human-in-the-loop'],
        },
        null,
        2
      ) + '\n',
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

export function generateOpenClawPackageManifest(manifest: ResolvedManifest, targetName = 'openclaw'): string {
  const target: Pick<TargetProfile, 'name'> = { name: targetName };
  const packageName = resolveTargetNpmPackageName(manifest, target);
  const packageJson: Record<string, unknown> = {
    name: packageName,
    version: manifest.version,
    type: 'module',
    description: manifest.description,
    openclaw: {
      extensions: ['./extensions'],
      compat: {
        minVersion: '0.1.0',
      },
      build: {
        hooks: 'extensions/index.ts',
      },
    },
    keywords: ['babysitter', targetName, 'orchestration', 'ai-agent', 'sdk-integration'],
    dependencies: {
      [resolveSdkConfig(manifest).package]: manifest.version,
    },
    peerDependencies: {
      [targetName]: '*',
    },
    scripts: {
      'plugin:install': 'node bin/install.cjs --global',
      'plugin:uninstall': 'node bin/uninstall.cjs --global',
      test: 'node --test test/integration.test.js',
      'test:integration': 'node --test test/integration.test.js',
      'test:packaged-install': 'node test/packaged-install.test.cjs',
      deploy: 'npm publish --access public',
      'deploy:staging': 'npm publish --access public --tag staging',
    },
    bin: { [resolveTargetCliName(manifest, target)]: 'bin/cli.cjs' },
    files: [
      'bin/',
      'package.json',
      'versions.json',
      'plugin.json',
      `${targetName}.plugin.json`,
      'hooks/',
      'hooks.json',
      'extensions/',
      'skills/',
      'commands/',
      'scripts/',
      'README.md',
    ],
    author: typeof manifest.author === 'string' ? manifest.author : manifest.author.name,
    license: manifest.license,
    publishConfig: { access: 'public' },
  };

  const clawPkgName = packageName;
  packageJson.repository = buildNpmRepository(manifest, clawPkgName);
  packageJson.homepage = buildNpmHomepage(manifest, clawPkgName);
  packageJson.bugs = buildNpmBugs(manifest);

  return JSON.stringify(packageJson, null, 2) + '\n';
}

export function generateOpenClawManifest(manifest: A5cPluginManifest): string {
  const pluginJson: Record<string, unknown> = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    author: manifest.author,
    license: manifest.license,
    hooks: 'hooks.json',
    commands: 'commands/',
    skills: 'skills/',
  };

  if (manifest.repository) {
    pluginJson.repository = manifest.repository;
  }

  if (manifest.keywords) {
    pluginJson.keywords = manifest.keywords;
  }

  return JSON.stringify(pluginJson, null, 2) + '\n';
}

export function generateOpenClawHooksJson(
  manifest: A5cPluginManifest,
  _targetProfile: TargetProfile,
  targetName = 'openclaw',
): string {
  const hooks: Record<string, unknown> = {};
  const pat = getPattern(manifest, targetName);

  const sessionStartHandler = manifest.hooks?.SessionStart;
  if (typeof sessionStartHandler === 'string') {
    const cmd = `./${applyPattern(
      pat || '{{name}}-proxied-{{native}}.sh',
      manifest.name,
      slugify('SessionStart'),
      'session-start'
    )}`;
    hooks.SessionStart = [{ matcher: '*', hooks: [{ type: 'command', command: cmd }] }];
  }

  const stopHandler = manifest.hooks?.Stop;
  if (typeof stopHandler === 'string') {
    const cmd = `./${applyPattern(
      pat || '{{name}}-proxied-{{native}}.sh',
      manifest.name,
      slugify('Stop'),
      'stop-hook'
    )}`;
    hooks.Stop = [{ matcher: '*', hooks: [{ type: 'command', command: cmd }] }];
  }

  return JSON.stringify({
    description: `${manifest.name} plugin hooks for OpenClaw`,
    hooks,
  }, null, 2) + '\n';
}
