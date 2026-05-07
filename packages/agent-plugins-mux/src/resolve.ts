// Stage 2: RESOLVE - Load target profile and compute effective manifest

import type {
  A5cPluginManifest,
  ResolveResult,
  ComponentSupport,
  Diagnostic,
} from './types.js';
import { getAllTargets, getTargetProfile } from './targets/index.js';
import { deepMerge } from './utils.js';

export function resolve(
  manifest: A5cPluginManifest,
  targetName: string
): ResolveResult {
  const diagnostics: Diagnostic[] = [];

  // Load target profile
  const targetProfile = getTargetProfile(targetName);
  if (!targetProfile) {
    diagnostics.push({
      level: 'error',
      category: 'compilation',
      message: `Unknown target: ${targetName}`,
      target: targetName,
      suggestion: `Valid targets: ${getAllTargets().join(', ')}`,
    });
    // Return error result
    return {
      effectiveManifest: manifest,
      targetProfile: {
        name: targetName,
        displayName: targetName,
        adapterName: targetName,
        pluginRootEnvVar: null,
        supportedHooks: new Map(),
        commandFormat: 'markdown',
        skillHandling: 'native',
        manifestFormat: 'plugin.json',
        hookRegistrationFormat: null,
        hookRegistrationOutputPath: null,
        hookRegistrationAliasPaths: [],
        harnessManifestPath: null,
        requiredSurfaceFile: null,
        scriptVariants: [],
        npmPublishable: false,
        adapterFamily: 'shell-hook',
        distribution: 'marketplace',
        componentSupport: { agents: 'unsupported', context: 'unsupported' },
      },
      componentSupport: {
        hooks: {},
        commands: 'unsupported',
        skills: 'unsupported',
        agents: 'unsupported',
        context: 'unsupported',
      },
      diagnostics,
    };
  }

  // Apply target overrides
  let effectiveManifest = { ...manifest };
  if (manifest.targets && manifest.targets[targetName]) {
    const override = manifest.targets[targetName];
    const {
      extraFileSets: _extraFileSets,
      harnessInstallSurfaceExportSets: _harnessInstallSurfaceExportSets,
      ...mergeableOverride
    } = override;
    // Deep merge handles the override, but TypeScript needs to know that
    // the result may include extended fields like npmPackageName and
    // the skills field may temporarily hold the 'derive-from-commands' directive.
    // deepMerge returns Record<string, unknown>, so we cast through unknown
    // back to A5cPluginManifest, as we know the merge preserves required fields.
    effectiveManifest = deepMerge(
      effectiveManifest,
      mergeableOverride as Partial<A5cPluginManifest>
    ) as unknown as A5cPluginManifest;
  }

  // Compute component support
  const componentSupport: ComponentSupport = {
    hooks: {},
    commands: targetProfile.commandFormat === 'none' ? 'unsupported' : targetProfile.commandFormat === 'toml' ? 'toml' : 'native',
    skills: targetProfile.skillHandling === 'native' ? 'native' : targetProfile.skillHandling === 'derived-from-commands' ? 'derived' : 'unsupported',
    agents: targetProfile.componentSupport?.agents ?? 'unsupported',
    context: targetProfile.componentSupport?.context ?? 'unsupported',
  };

  // Determine hook support for each canonical hook
  if (effectiveManifest.hooks) {
    for (const canonicalHook of Object.keys(effectiveManifest.hooks)) {
      const nativeHook = targetProfile.supportedHooks.get(canonicalHook);
      if (nativeHook) {
        componentSupport.hooks[canonicalHook] = 'native';
      } else {
        componentSupport.hooks[canonicalHook] = 'unsupported';
        diagnostics.push({
          level: 'warning',
          category: 'compatibility',
          message: `Hook '${canonicalHook}' is not supported by target '${targetName}' — skipping`,
          component: `hooks.${canonicalHook}`,
          target: targetName,
        });
      }
    }
  }

  // Check for skill derivation directive
  if (targetProfile.skillHandling === 'derived-from-commands') {
    const skillsDirective = effectiveManifest.skills;
    if (typeof skillsDirective === 'string' && skillsDirective === 'derive-from-commands') {
      diagnostics.push({
        level: 'info',
        category: 'compilation',
        message: `Target '${targetName}' will derive skills from commands`,
        target: targetName,
      });
    }
  }

  return {
    effectiveManifest,
    targetProfile,
    componentSupport,
    diagnostics,
  };
}
