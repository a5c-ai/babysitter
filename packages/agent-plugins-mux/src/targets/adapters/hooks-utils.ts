// Shared hook utility functions used across multiple adapters

import type { A5cPluginManifest, TargetProfile } from '../../types.js';
import { slugify } from '../../utils.js';
import { resolveSdkConfig } from '../../sdkConfig.js';

export { slugify };
export { resolveSdkConfig };

export function applyPattern(
  pattern: string,
  pluginName: string,
  hookSlug: string,
  nativeHook: string
): string {
  const nativeSlug = nativeHook.replace(/[._]/g, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  return 'hooks/' + pattern
    .replace(/\{\{name\}\}/g, pluginName)
    .replace(/\{\{slug\}\}/g, hookSlug)
    .replace(/\{\{native\}\}/g, nativeSlug);
}

export function resolveHookPath(
  handlerValue: string | boolean,
  hookSlug: string,
  pluginName: string,
  nativeHook: string,
  hookFilePattern?: string
): string | null {
  if (typeof handlerValue !== 'string' || handlerValue === 'proxy') return null;
  if (hookFilePattern) {
    return applyPattern(hookFilePattern, pluginName, hookSlug, nativeHook);
  }
  return handlerValue;
}

export function resolveCmd(
  handlerValue: string | boolean,
  hookSlug: string,
  adapter: string,
  rootRef: string,
  pluginName: string,
  nativeHook: string,
  proxyPkg: string,
  proxyBin: string,
  pattern?: string
): string {
  if (handlerValue === 'proxy') {
    return `${proxyBin} invoke --adapter ${adapter} --json`;
  }
  const p = resolveHookPath(handlerValue, hookSlug, pluginName, nativeHook, pattern);
  if (p) {
    const scriptRef = rootRef.startsWith('$') || rootRef.startsWith('\\$')
      ? `${rootRef}/${p}` : `./${p}`;
    return `${proxyBin} invoke --adapter ${adapter} --handler "bash ${scriptRef}" --json`;
  }
  return `echo '{}'`;
}

export function getPattern(manifest: A5cPluginManifest, targetName: string): string | undefined {
  const override = manifest.targets?.[targetName]?.hookFilePattern;
  if (typeof override === 'string') return override;
  if (typeof manifest.hookFilePattern === 'string') return manifest.hookFilePattern;
  return undefined;
}

export function getJsPattern(manifest: A5cPluginManifest, targetName: string): string | undefined {
  const override = manifest.targets?.[targetName]?.hookJsPattern;
  if (typeof override === 'string') return override;
  // Derive JS pattern from global hookFilePattern by swapping extension
  if (typeof manifest.hookFilePattern === 'string') return manifest.hookFilePattern.replace(/\.sh$/, '.js');
  return undefined;
}

export function iterateHooks(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile,
  cb: (canonical: string, native: string, handler: string | boolean) => void
): void {
  if (!manifest.hooks) return;
  for (const [canonical, handler] of Object.entries(manifest.hooks)) {
    if (handler === null) continue;
    const native = targetProfile.supportedHooks.get(canonical);
    if (!native) continue;
    cb(canonical, native, handler);
  }
}
