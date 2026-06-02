// Gemini harness output adapter

import type { A5cPluginManifest, TargetProfile, TransformedFile, Diagnostic } from '../../types.js';
import { BaseHarnessOutputAdapter } from './base.js';
import {
  iterateHooks,
  slugify,
  resolveCmd,
  getPattern,
  resolveSdkConfig,
} from './hooks-utils.js';
import { getCommandPaths } from '../../utils.js';

export class GeminiAdapter extends BaseHarnessOutputAdapter {



  generateHookRegistration(
    manifest: A5cPluginManifest,
    targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile | null {
    const content = generateGeminiHooksJson(manifest, targetProfile);
    return { path: targetProfile.hookRegistrationOutputPath || 'hooks/hooks.json', content };
  }

  generateManifestFiles(
    sourceDir: string,
    manifest: A5cPluginManifest,
    targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile[] {
    const files: TransformedFile[] = [];
    const commandPaths = getCommandPaths(sourceDir, manifest);
    files.push({
      path: 'plugin.json',
      content: generateGeminiManifest(manifest, commandPaths),
    });
    const extensionManifestPath = targetProfile.harnessManifestPath || 'gemini-extension.json';
    files.push({
      path: extensionManifestPath,
      content: JSON.stringify(
        {
          name: manifest.name,
          version: manifest.version,
          description: manifest.description,
          contextFileName: 'GEMINI.md',
          settings: [],
        },
        null,
        2
      ) + '\n',
    });
    return files;
  }
}

export function generateGeminiManifest(
  manifest: A5cPluginManifest,
  commandPaths: string[] = [],
  targetName = 'gemini',
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

export function generateGeminiHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};
  const rootRef = targetProfile.pluginRootEnvVar
    ? `\${${targetProfile.pluginRootEnvVar}}`
    : '${extensionPath}';
  const pat = getPattern(manifest, targetProfile.name);
  const sdk = resolveSdkConfig(manifest);

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const cmd = resolveCmd(handler, slug, targetProfile.adapterName, rootRef, manifest.name, native, sdk.proxyPackage, sdk.proxyBinary, pat);
    hooks[native] = [{
      hooks: [{
        name: `${manifest.name}-${slug}`,
        type: 'command',
        command: cmd,
        timeout: 30000,
        description: `${manifest.name} ${canonical} hook`,
      }],
    }];
  });

  return JSON.stringify({
    description: `${manifest.name} plugin hooks for Gemini CLI`,
    hooks,
  }, null, 2) + '\n';
}
