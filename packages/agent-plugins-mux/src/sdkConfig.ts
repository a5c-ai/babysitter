// SDK configuration resolver — omitted sdk config always falls back to the
// shared Babysitter SDK contract.

import type { A5cPluginManifest, TargetProfile } from './types.js';

export interface SdkConfig {
  package: string;
  cli: string;
  proxyPackage: string;
  proxyBinary: string;
  scope: string;
  envPrefix: string;
  stateDir: string;
}

type PackageNamedManifest = A5cPluginManifest & { npmPackageName?: string };
type TargetPackageProfile = Pick<TargetProfile, 'name' | 'npmPackageName'>;

export const BABYSITTER_DEFAULT_SDK_CONFIG: Readonly<SdkConfig> = {
  package: '@a5c-ai/babysitter-sdk',
  cli: 'babysitter',
  proxyPackage: '@a5c-ai/hooks-mux-cli',
  proxyBinary: 'a5c-hooks-mux',
  scope: '@a5c-ai',
  envPrefix: 'BABYSITTER',
  stateDir: '.a5c',
};

export function resolveSdkConfig(manifest: A5cPluginManifest): SdkConfig {
  const sdk = manifest.sdk ?? {};
  return {
    package: sdk.package || BABYSITTER_DEFAULT_SDK_CONFIG.package,
    cli: sdk.cli || BABYSITTER_DEFAULT_SDK_CONFIG.cli,
    proxyPackage: sdk.proxyPackage || BABYSITTER_DEFAULT_SDK_CONFIG.proxyPackage,
    proxyBinary: sdk.proxyBinary || BABYSITTER_DEFAULT_SDK_CONFIG.proxyBinary,
    scope: sdk.scope || BABYSITTER_DEFAULT_SDK_CONFIG.scope,
    envPrefix: sdk.envPrefix || BABYSITTER_DEFAULT_SDK_CONFIG.envPrefix,
    stateDir: sdk.stateDir || BABYSITTER_DEFAULT_SDK_CONFIG.stateDir,
  };
}

export function resolveTargetNpmPackageName(
  manifest: PackageNamedManifest,
  targetProfile: TargetPackageProfile,
): string {
  if (typeof manifest.npmPackageName === 'string' && manifest.npmPackageName.length > 0) {
    return manifest.npmPackageName;
  }

  const override = manifest.targets?.[targetProfile.name]?.npmPackageName;
  if (typeof override === 'string' && override.length > 0) {
    return override;
  }

  if (typeof targetProfile.npmPackageName === 'string' && targetProfile.npmPackageName.length > 0) {
    return targetProfile.npmPackageName;
  }

  const sdk = resolveSdkConfig(manifest);
  return `${sdk.scope}/${manifest.name}-${targetProfile.name}`;
}

export function resolveTargetCliName(
  manifest: PackageNamedManifest,
  targetProfile: TargetPackageProfile,
): string {
  return resolveTargetNpmPackageName(manifest, targetProfile).split('/').pop()
    || `${manifest.name}-${targetProfile.name}`;
}
