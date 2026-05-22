// GitHub Copilot harness output adapter

import type { A5cPluginManifest, TargetProfile, TransformedFile, Diagnostic } from '../../types.js';
import { BaseHarnessOutputAdapter } from './base.js';
import {
  iterateHooks,
  slugify,
  resolveHookPath,
  getPattern,
} from './hooks-utils.js';

export class GithubCopilotAdapter extends BaseHarnessOutputAdapter {



  generateHookRegistration(
    manifest: A5cPluginManifest,
    targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile | null {
    const content = generateGithubCopilotHooksJson(manifest, targetProfile);
    return { path: targetProfile.hookRegistrationOutputPath || 'hooks.json', content };
  }

  generateManifestFiles(
    _sourceDir: string,
    manifest: A5cPluginManifest,
    _targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile[] {
    const files: TransformedFile[] = [];
    const copilotManifest = generateGithubCopilotManifest(manifest);
    files.push({
      path: 'plugin.json',
      content: copilotManifest,
    });
    files.push({
      path: '.github/plugin.json',
      content: copilotManifest,
    });
    return files;
  }
}

function normalizeAuthorObject(manifest: A5cPluginManifest): { name: string; email?: string } {
  return typeof manifest.author === 'string'
    ? { name: manifest.author }
    : manifest.author;
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

export function generateGithubCopilotHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};
  const pat = getPattern(manifest, targetProfile.name);

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const p = resolveHookPath(handler, slug, manifest.name, native, pat);
    const bashCmd = p ? `./${p}` : `echo '{}'`;
    const psCmd = p ? `./${p.replace(/\.sh$/, '.ps1')}` : `Write-Output '{}'`;
    const timeout = canonical === 'UserPromptSubmit' ? 15 : 30;
    const hookName = native === 'SessionStart' ? 'sessionStart' : native === 'SessionEnd' ? 'sessionEnd' : native;
    hooks[hookName] = [{ type: 'command', bash: bashCmd, powershell: psCmd, timeoutSec: timeout }];
  });

  return JSON.stringify({ version: 1, hooks }, null, 2) + '\n';
}
