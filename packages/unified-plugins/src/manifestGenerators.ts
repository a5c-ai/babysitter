// Manifest generators for all targets

import { resolveSdkConfig } from './sdkConfig.js';
import type { A5cPluginManifest } from './types.js';

// Extended manifest type for resolved manifests that may have been enriched
// with target-specific fields during resolve phase
type ResolvedManifest = A5cPluginManifest & {
  npmPackageName?: string;
};

function normalizeAuthorObject(manifest: A5cPluginManifest): { name: string; email?: string } {
  return typeof manifest.author === 'string'
    ? { name: manifest.author }
    : manifest.author;
}

export function generateClaudeCodeManifest(manifest: A5cPluginManifest): string {
  const author = normalizeAuthorObject(manifest);
  const pluginJson: Record<string, unknown> = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    author,
    license: manifest.license,
  };

  if (manifest.repository) {
    pluginJson.repository = manifest.repository;
  }

  if (manifest.homepage) {
    pluginJson.homepage = manifest.homepage;
  }

  if (manifest.keywords) {
    pluginJson.keywords = manifest.keywords;
  }

  if (manifest.hooks) {
    const hooksObj: Record<string, string | boolean> = {};
    for (const [canonicalHook, handlerValue] of Object.entries(manifest.hooks)) {
      if (handlerValue) {
        hooksObj[canonicalHook] = handlerValue;
      }
    }
    pluginJson.hooks = hooksObj;
  }

  pluginJson.commands = [];

  if (manifest.skills) {
    pluginJson.skills = manifest.skills;
  }

  return JSON.stringify(pluginJson, null, 2) + '\n';
}

export function generateCodexManifest(manifest: ResolvedManifest): string {
  const packageJson: Record<string, unknown> = {
    name: manifest.npmPackageName || (() => { const s = resolveSdkConfig(manifest); return `${s.scope}/${manifest.name}-codex`; })(),
    version: manifest.version,
    description: manifest.description,
    scripts: {
      test: 'node test/integration.test.js && node test/packaged-install.test.js',
      'sync:commands': 'node scripts/sync-command-skills.js',
      deploy: 'npm publish --access public',
      'deploy:staging': 'npm publish --access public --tag staging',
    },
    bin: { [`${manifest.name}-codex`]: 'bin/cli.js' },
    files: [
      '.codex-plugin/',
      'assets/',
      'hooks/',
      'hooks.json',
      'skills/',
      '.app.json',
      'bin/',
      'scripts/',
      'plugin.lock.json',
      'README.md',
    ],
    keywords: [manifest.name, 'codex', 'orchestration'],
    author: typeof manifest.author === 'string' ? manifest.author : manifest.author.name,
    license: manifest.license,
    publishConfig: { access: 'public' },
  };

  if (manifest.repository) {
    packageJson.repository = manifest.repository;
  }

  return JSON.stringify(packageJson, null, 2) + '\n';
}

export function generateCursorManifest(manifest: A5cPluginManifest): string {
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

export function generateGeminiManifest(
  manifest: A5cPluginManifest,
  commandPaths: string[] = []
): string {
  const pluginJson: Record<string, unknown> = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    author: manifest.author,
    license: manifest.license,
    harness: 'gemini-cli',
    hooks: {},
    commands: commandPaths.map((cmdPath) => `commands/${cmdPath.split(/[\\/]/).pop()?.replace(/\.md$/, '.toml')}`),
    skills: [],
    contextFileName: 'GEMINI.md',
    extensionManifest: 'gemini-extension.json',
  };

  if (manifest.hooks) {
    const hooksObj: Record<string, string | boolean> = {};
    for (const [canonicalHook, handlerValue] of Object.entries(manifest.hooks)) {
      if (handlerValue) {
        hooksObj[canonicalHook] = handlerValue;
      }
    }
    pluginJson.hooks = hooksObj;
  }

  if (manifest.repository) {
    pluginJson.repository = manifest.repository;
  }

  if (manifest.keywords) {
    pluginJson.keywords = manifest.keywords;
  }

  return JSON.stringify(pluginJson, null, 2) + '\n';
}

export function generateGithubCopilotManifest(manifest: A5cPluginManifest): string {
  const pluginJson: Record<string, unknown> = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    author: normalizeAuthorObject(manifest),
    license: manifest.license,
    skills: 'skills/',
    hooks: 'hooks.json',
    commands: 'commands/',
    agents: 'AGENTS.md',
  };

  if (manifest.repository) {
    pluginJson.repository = manifest.repository;
  }

  if (manifest.keywords) {
    pluginJson.keywords = manifest.keywords;
  }

  return JSON.stringify(pluginJson, null, 2) + '\n';
}

export function generatePiManifest(manifest: ResolvedManifest): string {
  const packageJson: Record<string, unknown> = {
    name: manifest.npmPackageName || (() => { const s = resolveSdkConfig(manifest); return `${s.scope}/${manifest.name}-pi`; })(),
    version: manifest.version,
    type: 'module',
    description: `${manifest.description} — Pi Coding Agent`,
    keywords: ['pi', manifest.name, 'orchestration'],
    pi: {
      extensions: ['./extensions'],
      skills: ['./skills'],
    },
    peerDependencies: {
      '@mariozechner/pi-coding-agent': '*',
    },
    scripts: {
      test: 'node --test test/integration.test.js && node test/packaged-install.test.cjs',
      'sync:commands': 'node scripts/sync-command-docs.cjs',
      deploy: 'npm publish --access public',
    },
    bin: { [`${manifest.name}-pi`]: 'bin/cli.cjs' },
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

  if (manifest.repository) {
    packageJson.repository = manifest.repository;
  }

  return JSON.stringify(packageJson, null, 2) + '\n';
}

export function generateOhMyPiManifest(manifest: ResolvedManifest): string {
  const packageJson: Record<string, unknown> = {
    name: manifest.npmPackageName || (() => { const s = resolveSdkConfig(manifest); return `${s.scope}/${manifest.name}-omp`; })(),
    version: manifest.version,
    type: 'module',
    description: `${manifest.description} — oh-my-pi`,
    keywords: ['oh-my-pi', manifest.name, 'orchestration'],
    omp: {
      extensions: ['./extensions'],
      skills: ['./skills'],
    },
    peerDependencies: {
      '@oh-my-pi/pi-coding-agent': '*',
    },
    scripts: {
      test: 'node --test test/integration.test.js && node test/packaged-install.test.cjs',
      'sync:commands': 'node scripts/sync-command-docs.cjs',
      deploy: 'npm publish --access public',
    },
    bin: { [`${manifest.name}-omp`]: 'bin/cli.cjs' },
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

  if (manifest.repository) {
    packageJson.repository = manifest.repository;
  }

  return JSON.stringify(packageJson, null, 2) + '\n';
}

export function generateOpenCodeManifest(manifest: A5cPluginManifest): string {
  const pluginJson: Record<string, unknown> = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    author: manifest.author,
    license: manifest.license,
    harness: 'opencode',
    hooks: 'hooks/',
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

export function generateOpenClawManifest(manifest: A5cPluginManifest): string {
  const pluginJson: Record<string, unknown> = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    author: manifest.author,
    license: manifest.license,
    hooks: 'hooks/hooks.json',
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
