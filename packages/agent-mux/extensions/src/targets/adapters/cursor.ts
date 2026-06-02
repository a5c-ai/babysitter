// Cursor harness output adapter

import type { A5cPluginManifest, TargetProfile, TransformedFile, Diagnostic } from '../../types.js';
import { BaseHarnessOutputAdapter } from './base.js';
import {
  iterateHooks,
  slugify,
  resolveHookPath,
  getPattern,
} from './hooks-utils.js';
import { generateHarnessManifest } from '../../transformHelpers.js';

export class CursorAdapter extends BaseHarnessOutputAdapter {



  generateHookRegistration(
    manifest: A5cPluginManifest,
    targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile | null {
    const content = generateCursorHooksJson(manifest, targetProfile);
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
    const cursorManifest = generateCursorManifest(manifest);
    files.push({ path: 'plugin.json', content: cursorManifest });
    if (targetProfile.harnessManifestPath) {
      files.push({ path: targetProfile.harnessManifestPath, content: generateHarnessManifest(rawManifest || manifest, targetProfile) });
    }
    return files;
  }
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

export function generateCursorHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};
  const pat = getPattern(manifest, targetProfile.name);

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const p = resolveHookPath(handler, slug, manifest.name, native, pat);
    const bashCmd = p ? `bash "./${p}"` : `echo '{}'`;
    const psCmd = p
      ? `powershell -NoProfile -ExecutionPolicy Bypass -File "./${p.replace(/\.sh$/, '.ps1')}"`
      : `Write-Output '{}'`;
    const entry: Record<string, unknown> = { type: 'command', bash: bashCmd, powershell: psCmd, timeoutSec: 30 };
    if (canonical === 'Stop') {
      entry.loop_limit = null;
      delete entry.timeoutSec;
    }
    hooks[native] = [entry];
  });

  return JSON.stringify({ version: 1, hooks }, null, 2) + '\n';
}
