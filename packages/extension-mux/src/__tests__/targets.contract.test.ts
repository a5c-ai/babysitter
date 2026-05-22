import { describe, expect, it } from 'vitest';
import {
  getHookNameMap,
  listPluginTargetDescriptors,
} from '@a5c-ai/agent-catalog';
import {
  getAllTargets,
  getTargetProfile,
  HOOK_NAME_MAP,
  TARGET_REGISTRY,
} from '../targets';

function toManifestFormat(format: string): 'plugin.json' | 'package.json' | 'multiple' {
  if (format === 'plugin.json') return 'plugin.json';
  if (format === 'state-only' || format.includes('package.json')) return 'package.json';
  return 'multiple';
}

function toCommandFormat(format: string): 'markdown' | 'toml' | 'none' {
  if (format === 'extension-manifest') return 'toml';
  if (format === 'none' || format === 'package-json commands') return 'none';
  return 'markdown';
}

function toHookRegistrationFormat(format: string | null | undefined) {
  if (
    format === 'claude-code' ||
    format === 'codex' ||
    format === 'cursor' ||
    format === 'gemini' ||
    format === 'github-copilot' ||
    format === 'hermes' ||
    format === 'opencode' ||
    format === 'openclaw'
  ) {
    return format;
  }
  return null;
}

function toScriptVariants(variants: string[] | undefined) {
  return (variants ?? []).filter((variant) =>
    variant === 'bash' ||
    variant === 'powershell' ||
    variant === 'javascript' ||
    variant === 'typescript',
  );
}

describe('extension-mux catalog target contract', () => {
  it('keeps the runtime registry in sync with graph-backed plugin target descriptors', () => {
    const descriptors = listPluginTargetDescriptors();
    const expectedTargets = descriptors.map((descriptor) => descriptor.targetId).sort();

    expect(getAllTargets().sort()).toEqual(expectedTargets);
    expect(Object.keys(TARGET_REGISTRY).sort()).toEqual(expectedTargets);

    for (const descriptor of descriptors) {
      const profile = getTargetProfile(descriptor.targetId);

      expect(profile).not.toBeNull();
      expect(profile).toMatchObject({
        name: descriptor.targetId,
        displayName: descriptor.displayName,
        adapterName: descriptor.adapterName,
        pluginRootEnvVar: descriptor.pluginRootEnvVar ?? null,
        commandFormat: toCommandFormat(descriptor.commandFormat),
        skillHandling: descriptor.skillHandling ?? 'none',
        manifestFormat: toManifestFormat(descriptor.manifestFormat),
        hookRegistrationFormat: toHookRegistrationFormat(descriptor.hookRegistrationFormat),
        scriptVariants: toScriptVariants(descriptor.scriptVariants),
        npmPublishable: descriptor.npmPublishable,
        adapterFamily: descriptor.adapterFamily ?? 'shell-hook',
        distribution: descriptor.distribution ?? 'marketplace',
        marketplacePath: descriptor.marketplacePath,
        installLayout: descriptor.installLayout,
        packageMetadata: descriptor.packageMetadata,
        componentSupport: descriptor.componentSupport,
      });
      expect(Array.from(profile!.supportedHooks.entries())).toEqual(Object.entries(descriptor.supportedHooks));
      expect(TARGET_REGISTRY[descriptor.targetId]).toEqual(profile);
    }
  });

  it('re-exports the graph-backed hook name map verbatim', () => {
    expect(HOOK_NAME_MAP).toEqual(getHookNameMap());
  });
});
