// Catalog-backed target registry and hook name mapping

import {
  getHookNameMap,
  getPluginTargetDescriptor,
  listPluginTargetDescriptors,
} from '@a5c-ai/atlas/catalog';
import type { PluginTargetDescriptor } from '@a5c-ai/atlas/catalog';
import type { TargetProfile } from '../types.js';

function toManifestFormat(format: string): TargetProfile['manifestFormat'] {
  if (format === 'plugin.json') return 'plugin.json';
  if (format === 'state-only' || format.includes('package.json')) return 'package.json';
  return 'multiple';
}

function toCommandFormat(format: string): TargetProfile['commandFormat'] {
  if (format === 'extension-manifest') return 'toml';
  if (format === 'none' || format === 'package-json commands') return 'none';
  return 'markdown';
}

function toHookRegistrationFormat(
  format: string | null | undefined,
): TargetProfile['hookRegistrationFormat'] {
  return format || null;
}

function toScriptVariants(variants: string[] | undefined): TargetProfile['scriptVariants'] {
  return (variants ?? []).filter(
    (variant): variant is TargetProfile['scriptVariants'][number] =>
      variant === 'bash' ||
      variant === 'powershell' ||
      variant === 'javascript' ||
      variant === 'typescript',
  );
}

function canonicalTargetName(name: string): string {
  // Try exact match first; if not found, check if any target's adapterName or cliCommand matches
  if (getPluginTargetDescriptor(name)) return name;
  for (const target of listPluginTargetDescriptors()) {
    if (target.adapterName === name || target.cliCommand === name) return target.targetId;
  }
  return name;
}
function toTargetProfile(target: PluginTargetDescriptor): TargetProfile {
  return {
    name: target.targetId,
    displayName: target.displayName,
    adapterName: target.adapterName,
    pluginRootEnvVar: target.pluginRootEnvVar ?? null,
    supportedHooks: new Map(Object.entries(target.supportedHooks)),
    commandFormat: toCommandFormat(target.commandFormat),
    skillHandling: target.skillHandling ?? 'none',
    manifestFormat: toManifestFormat(target.manifestFormat),
    hookRegistrationFormat: toHookRegistrationFormat(target.hookRegistrationFormat),
    hookRegistrationOutputPath: target.hookRegistrationOutputPath ?? null,
    hookRegistrationAliasPaths: target.hookRegistrationAliasPaths ?? [],
    harnessManifestPath: target.harnessManifestPath ?? null,
    requiredSurfaceFile: target.requiredSurfaceFile ?? null,
    scriptVariants: toScriptVariants(target.scriptVariants),
    npmPublishable: target.npmPublishable,
    adapterFamily: target.adapterFamily ?? 'shell-hook',
    distribution: target.distribution ?? 'marketplace',
    pluginRootEnvVarForExtension: target.pluginRootEnvVarForExtension ?? undefined,
    marketplacePath: target.marketplacePath,
    installLayout: target.installLayout,
    packageMetadata: target.packageMetadata,
    componentSupport: target.componentSupport,
  };
}

export const TARGET_REGISTRY: Record<string, TargetProfile> = Object.fromEntries(
  listPluginTargetDescriptors().map((target) => [target.targetId, toTargetProfile(target)]),
);

export const HOOK_NAME_MAP: Record<string, Record<string, string>> = getHookNameMap();

export function getTargetProfile(name: string): TargetProfile | null {
  const descriptor = getPluginTargetDescriptor(canonicalTargetName(name));
  return descriptor ? toTargetProfile(descriptor) : null;
}

export function requireTargetProfile(name: string): TargetProfile {
  const profile = getTargetProfile(name);
  if (!profile) {
    throw new Error(`Unknown target profile: ${name}`);
  }
  return profile;
}

export function getAllTargets(): string[] {
  return listPluginTargetDescriptors().map((target) => target.targetId);
}
