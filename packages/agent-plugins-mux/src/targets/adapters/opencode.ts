// OpenCode harness output adapter

import type { A5cPluginManifest, TargetProfile, TransformedFile, Diagnostic } from '../../types.js';
import { BaseHarnessOutputAdapter } from './base.js';
import {
  iterateHooks,
  slugify,
  applyPattern,
  resolveHookPath,
  getPattern,
  getJsPattern,
  resolveSdkConfig,
} from './hooks-utils.js';
import { generateOpenCodeAccomplishSkill } from '../../transformHelpers.js';

export class OpenCodeAdapter extends BaseHarnessOutputAdapter {



  generateHookRegistration(
    manifest: A5cPluginManifest,
    targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile | null {
    const content = generateOpenCodeHooksJson(manifest, targetProfile);
    return { path: targetProfile.hookRegistrationOutputPath || 'hooks/hooks.json', content };
  }

  generateManifestFiles(
    _sourceDir: string,
    manifest: A5cPluginManifest,
    _targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile[] {
    const files: TransformedFile[] = [];
    files.push({
      path: 'plugin.json',
      content: generateOpenCodeManifest(manifest, this.targetName),
    });
    return files;
  }

  generateExtraTargetFiles(
    _sourceDir: string,
    manifest: A5cPluginManifest,
    _targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile[] {
    const files: TransformedFile[] = [];
    const accomplishSkill = generateOpenCodeAccomplishSkill(manifest);
    if (accomplishSkill) {
      files.push({ path: `accomplish-skills/${manifest.name}/SKILL.md`, content: accomplishSkill });
    }
    return files;
  }
}

export function generateOpenCodeManifest(manifest: A5cPluginManifest, targetName = 'opencode'): string {
  const pluginJson: Record<string, unknown> = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    author: manifest.author,
    license: manifest.license,
    harness: targetName,
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

export function generateOpenCodeHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};
  const pat = getPattern(manifest, targetProfile.name);
  const sdk = resolveSdkConfig(manifest);

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const adapter = targetProfile.adapterName;
    if (handler === 'proxy') {
      hooks[native] = [{
        type: 'command',
        command: `${sdk.proxyBinary} invoke --adapter ${adapter} --json`,
        description: `${manifest.name} ${canonical} hook`,
        timeoutMs: canonical === 'ShellEnv' ? 5000 : 30000,
      }];
    } else if (handler === true) {
      hooks[native] = [{
        type: 'command',
        command: `echo '{}'`,
        description: `${manifest.name} ${canonical} hook`,
        timeoutMs: canonical === 'ShellEnv' ? 5000 : 30000,
      }];
    } else {
      const jsPat = getJsPattern(manifest, targetProfile.name);
      let handlerScript: string;
      if (jsPat) {
        handlerScript = applyPattern(jsPat, manifest.name, slug, native);
      } else {
        const p = resolveHookPath(handler, slug, manifest.name, native, pat);
        handlerScript = p ? p.replace(/\.sh$/, '.js') : 'echo {}';
      }
      hooks[native] = [{
        type: 'command',
        script: `./${handlerScript}`,
        description: `${manifest.name} ${canonical} hook`,
        timeoutMs: canonical === 'ShellEnv' ? 5000 : 30000,
      }];
    }
  });

  return JSON.stringify({
    version: 1,
    description: `${manifest.name} hook registration for OpenCode.`,
    hooks,
  }, null, 2) + '\n';
}
