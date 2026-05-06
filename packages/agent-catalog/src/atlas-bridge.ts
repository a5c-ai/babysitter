// Atlas bridge — queries @a5c-ai/atlas and transforms results into agent-catalog shapes.
// This module replaces the direct YAML graph reading for plugin targets and hook mappings.

import type { AtlasGraph, AtlasRecord } from "@a5c-ai/atlas";
import type {
  PluginTargetDescriptor,
  PluginPackageMetadata,
  PluginComponentSupport,
} from "./models";

// Agent-catalog targetIds that differ from Atlas record IDs
const TARGET_ID_MAP: Record<string, string> = {
  "plugin-target:gemini-cli": "gemini",
  "plugin-target:copilot-cli": "github-copilot",
  "plugin-target:omp": "oh-my-pi",
};

function targetIdFromRecord(record: AtlasRecord): string {
  return TARGET_ID_MAP[record.id] ?? record.id.replace("plugin-target:", "");
}

// Derive canonical hook name from hook-surface ID
// Map hook-surface IDs (both canonical and target-specific) to canonical names
function resolveCanonicalHookName(hookId: string): string | undefined {
  // Canonical surfaces: hook-surface:session-start → SessionStart
  const CANONICAL: Record<string, string> = {
    "session-start": "SessionStart",
    "stop": "Stop",
    "user-prompt-submit": "UserPromptSubmit",
    "pre-tool-use": "PreToolUse",
    "post-tool-use": "PostToolUse",
    "after-agent": "AfterAgent",
    "session-end": "SessionEnd",
    "session-idle": "SessionIdle",
    "shell-env": "ShellEnv",
    "before-prompt-build": "BeforePromptBuild",
    "subagent-stop": "SubagentStop",
    "notification": "Notification",
    "pre-compact": "PreCompact",
    "before-provider-request": "BeforeProviderRequest",
  };

  const bare = hookId.replace("hook-surface:", "");
  if (CANONICAL[bare]) return CANONICAL[bare];
  // Target-specific: hook-surface:cursor.session-start → strip prefix, lookup
  const dotIndex = bare.indexOf(".");
  if (dotIndex >= 0) return CANONICAL[bare.slice(dotIndex + 1)];
  return undefined;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function strOrNull(value: unknown): string | null {
  if (value === null) return null;
  return typeof value === "string" && value.length > 0 ? value : null;
}

function strArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function obj(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

// Known babysitter plugin targets (the subset agent-catalog exposes)
const BABYSITTER_TARGETS = new Set([
  "plugin-target:claude-code",
  "plugin-target:codex",
  "plugin-target:cursor",
  "plugin-target:gemini-cli",
  "plugin-target:copilot-cli",
  "plugin-target:pi",
  "plugin-target:omp",
  "plugin-target:opencode",
  "plugin-target:openclaw",
]);

export function buildPluginTargetDescriptorsFromAtlas(
  atlas: AtlasGraph,
): PluginTargetDescriptor[] {
  const targets: AtlasRecord[] = atlas
    .getRecordsByKind("PluginTarget")
    .filter((r: AtlasRecord) => BABYSITTER_TARGETS.has(r.id));

  const hookMappings: AtlasRecord[] = atlas.getRecordsByKind("HookMapping");

  return targets.map((target: AtlasRecord) => {
    const targetId = targetIdFromRecord(target);
    const adapterName = str(target.adapterName);

    const supportedHooks: Record<string, string> = {};
    for (const mapping of hookMappings) {
      if (str(mapping.adapterFamily) !== adapterName) continue;
      const hookId = str(mapping.hookId);
      const canonicalName = resolveCanonicalHookName(hookId);
      if (!canonicalName) continue;
      supportedHooks[canonicalName] = str(mapping.nativeName);
    }

    const installLayout = obj(target.installLayout);
    const packageMetadata = obj(target.packageMetadata);
    const componentSupport = obj(target.componentSupport);

    // Normalize distribution: Atlas uses an array, agent-catalog uses a single string
    const distArray = strArray(target.distribution);
    let distribution: PluginTargetDescriptor["distribution"];
    if (distArray.includes("marketplace") && distArray.includes("npm-cli")) {
      distribution = "both";
    } else if (distArray.includes("marketplace")) {
      distribution = "marketplace";
    } else {
      distribution = "npm-cli";
    }

    // Normalize adapterFamily: Atlas uses detailed names, agent-catalog uses shell-hook/programmatic
    const atlasFamily = str(target.adapterFamily);
    const adapterFamily: PluginTargetDescriptor["adapterFamily"] =
      atlasFamily === "programmatic" ||
      ["pi", "omp", "opencode", "openclaw"].includes(adapterName)
        ? "programmatic"
        : "shell-hook";

    return {
      targetId,
      displayName: str(target.displayName),
      adapterName,
      manifestFormat: str(target.manifestFormat),
      commandFormat: str(target.commandFormat),
      distributionModel: str(target.distributionModel),
      npmPublishable: Boolean(target.npmPublishable),
      pluginRootEnvVar: strOrNull(target.pluginRootEnvVar) ?? undefined,
      pluginRootEnvVarForExtension: strOrNull(target.pluginRootEnvVarForExtension) ?? undefined,
      skillHandling:
        (str(target.skillHandling) as PluginTargetDescriptor["skillHandling"]) || undefined,
      hookRegistrationFormat: str(target.hookRegistrationFormat) || undefined,
      hookRegistrationOutputPath: strOrNull(target.hookRegistrationOutputPath) ?? undefined,
      hookRegistrationAliasPaths: strArray(target.hookRegistrationAliasPaths),
      harnessManifestPath: strOrNull(target.harnessManifestPath) ?? undefined,
      scriptVariants: strArray(target.scriptVariants),
      adapterFamily,
      distribution,
      marketplacePath: str(target.marketplacePath) || undefined,
      installLayout: installLayout
        ? {
            harnessHomeRelative: strOrNull(installLayout.harnessHomeRelative),
            pluginsDirRelative: strOrNull(installLayout.pluginsDirRelative),
            marketplacePathRelative: strOrNull(installLayout.marketplacePathRelative),
          }
        : undefined,
      packageMetadata: packageMetadata
        ? {
            moduleType: (str(packageMetadata.moduleType) as PluginPackageMetadata["moduleType"]) || undefined,
            binScriptExt: (str(packageMetadata.binScriptExt) as PluginPackageMetadata["binScriptExt"]) || undefined,
            installLifecycle: (str(packageMetadata.installLifecycle) as PluginPackageMetadata["installLifecycle"]) || undefined,
            activationMessage: (str(packageMetadata.activationMessage) as PluginPackageMetadata["activationMessage"]) || undefined,
            extraPackageFiles: strArray(packageMetadata.extraPackageFiles),
            extraScripts: (packageMetadata.extraScripts as Record<string, string>) ?? undefined,
            peerDependencyPackage: str(packageMetadata.peerDependencyPackage) || undefined,
            emitCjsWrappers: Boolean(packageMetadata.emitCjsWrappers),
          }
        : undefined,
      componentSupport: componentSupport
        ? {
            agents: (str(componentSupport.agents) as PluginComponentSupport["agents"]) || "unsupported",
            context: (str(componentSupport.context) as PluginComponentSupport["context"]) || "unsupported",
          }
        : undefined,
      supportedHooks,
      evidenceIds: [],
    };
  });
}

export function buildHookNameMapFromAtlas(
  atlas: AtlasGraph,
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  const targets: AtlasRecord[] = atlas
    .getRecordsByKind("PluginTarget")
    .filter((r: AtlasRecord) => BABYSITTER_TARGETS.has(r.id));

  for (const target of targets) {
    const targetId = targetIdFromRecord(target);
    const adapterName = str(target.adapterName);
    const map: Record<string, string> = {};

    for (const mapping of atlas.getRecordsByKind("HookMapping")) {
      if (str(mapping.adapterFamily) !== adapterName) continue;
      const hookSurface = atlas.getRecord(str(mapping.hookId));
      const canonicalName = hookSurface
        ? str(hookSurface.eventName).replace(/ \(canonical\)$/, "")
        : str(mapping.hookId).replace("hook-surface:", "");
      map[canonicalName] = str(mapping.nativeName);
    }

    result[targetId] = map;
  }

  return result;
}
