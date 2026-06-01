// Claude Code harness output adapter

import type { A5cPluginManifest, TargetProfile, TransformedFile, Diagnostic } from '../../types.js';
import { BaseHarnessOutputAdapter } from './base.js';
import {
  iterateHooks,
  slugify,
  resolveCmd,
  getPattern,
  resolveSdkConfig,
} from './hooks-utils.js';

export class ClaudeCodeAdapter extends BaseHarnessOutputAdapter {



  generateHookRegistration(
    manifest: A5cPluginManifest,
    targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile | null {
    const content = generateClaudeCodeHooksJson(manifest, targetProfile);
    return { path: targetProfile.hookRegistrationOutputPath || 'hooks/hooks.json', content };
  }

  generateManifestFiles(
    _sourceDir: string,
    manifest: A5cPluginManifest,
    targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile[] {
    const files: TransformedFile[] = [];
    const ccManifest = generateClaudeCodeManifest(manifest);
    files.push({ path: 'plugin.json', content: ccManifest });
    const author = typeof manifest.author === 'string'
      ? { name: manifest.author }
      : manifest.author;
    const harnessManifestPath = targetProfile.harnessManifestPath || `.${this.targetName}-plugin/plugin.json`;
    files.push({ path: harnessManifestPath, content: JSON.stringify({
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      author,
    }, null, 2) + '\n' });
    return files;
  }
}

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

export function generateClaudeCodeHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};
  const rootRef = targetProfile.pluginRootEnvVar
    ? `\${${targetProfile.pluginRootEnvVar}}`
    : '$(cd "$(dirname "$0")/.." && pwd)';
  const pat = getPattern(manifest, targetProfile.name);
  const sdk = resolveSdkConfig(manifest);

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const cmd = resolveCmd(handler, slug, targetProfile.adapterName, rootRef, manifest.name, native, sdk.proxyPackage, sdk.proxyBinary, pat);
    const entry: Record<string, unknown> = {
      hooks: [{ type: 'command', command: cmd }],
    };
    if (manifest.hookConfig?.matchers?.[canonical]) {
      entry.matcher = manifest.hookConfig.matchers[canonical];
    }
    hooks[native] = [entry];
  });

  return JSON.stringify({ description: `${manifest.name} plugin hooks`, hooks }, null, 2) + '\n';
}
