// Antigravity CLI harness output adapter
//
// Antigravity CLI is Google's successor to Gemini CLI. It uses a
// workflow-driven hook model (not shell-hook scripts) and a SKILL.md
// plugin system. It is model-agnostic (Gemini, Claude, GPT).

import type { A5cPluginManifest, TargetProfile, TransformedFile, Diagnostic } from '../../types.js';
import { BaseHarnessOutputAdapter } from './base.js';
import { emitJsonMcpConfig } from '../../mcpConfig.js';
import {
  iterateHooks,
  slugify,
  resolveCmd,
  getPattern,
  resolveSdkConfig,
} from './hooks-utils.js';

export class AntigravityAdapter extends BaseHarnessOutputAdapter {

  generateMcpConfig(
    manifest: A5cPluginManifest,
    _targetProfile: TargetProfile
  ): TransformedFile | null {
    return emitJsonMcpConfig(manifest, 'mcp.json');
  }

  generateHookRegistration(
    manifest: A5cPluginManifest,
    targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile | null {
    const content = generateAntigravityHooksJson(manifest, targetProfile);
    return { path: targetProfile.hookRegistrationOutputPath || 'hooks/hooks.json', content };
  }

  generateManifestFiles(
    _sourceDir: string,
    manifest: A5cPluginManifest,
    targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile[] {
    const files: TransformedFile[] = [];

    // Universal plugin.json manifest
    files.push({
      path: 'plugin.json',
      content: generateAntigravityManifest(manifest, this.targetName),
    });

    // SKILL.md — the antigravity-native skill manifest (replaces gemini-extension.json)
    const skillMdPath = targetProfile.harnessManifestPath || 'SKILL.md';
    files.push({
      path: skillMdPath,
      content: generateAntigravitySkillMd(manifest),
    });

    // NOTE: MCP config (mcp.json) is emitted by the global MCP emit step in
    // transform() via generateMcpConfig(), not here, so it is only produced
    // when manifest.mcpServers is declared.

    return files;
  }

  generateExtraTargetFiles(
    _sourceDir: string,
    manifest: A5cPluginManifest,
    _targetProfile: TargetProfile,
    _diagnostics: Diagnostic[]
  ): TransformedFile[] {
    const files: TransformedFile[] = [];

    // Workflow orchestration descriptor — antigravity uses workflow-driven
    // orchestration rather than shell hook scripts
    files.push({
      path: 'workflow.json',
      content: generateAntigravityWorkflow(manifest),
    });

    return files;
  }
}

export function generateAntigravityManifest(
  manifest: A5cPluginManifest,
  _targetName = 'antigravity-cli',
): string {
  const pluginJson: Record<string, unknown> = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    author: manifest.author,
    license: manifest.license,
    harness: 'antigravity-cli',
    hooks: {},
    skills: 'skills/',
    commands: 'commands/',
    contextFileName: 'SKILL.md',
    workflow: 'workflow.json',
    mcpConfig: 'mcp.json',
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

/**
 * Generate SKILL.md — the antigravity-native skill manifest.
 *
 * Antigravity CLI discovers plugins via SKILL.md files (not
 * gemini-extension.json). The SKILL.md format uses YAML frontmatter
 * for metadata and markdown body for the skill description.
 */
export function generateAntigravitySkillMd(manifest: A5cPluginManifest): string {
  const lines: string[] = [];
  lines.push('---');
  lines.push(`name: ${manifest.name}`);
  lines.push(`version: ${manifest.version}`);
  lines.push(`description: ${manifest.description}`);
  if (manifest.keywords && manifest.keywords.length > 0) {
    lines.push(`tags: [${manifest.keywords.map((k) => `"${k}"`).join(', ')}]`);
  }
  lines.push('model_agnostic: true');
  lines.push('orchestration: workflow');
  lines.push('---');
  lines.push('');
  lines.push(`# ${manifest.name}`);
  lines.push('');
  lines.push(manifest.description);
  lines.push('');
  lines.push('## Hooks');
  lines.push('');
  if (manifest.hooks) {
    for (const [canonical, handler] of Object.entries(manifest.hooks)) {
      if (handler) {
        lines.push(`- **${canonical}**: ${typeof handler === 'string' ? handler : 'enabled'}`);
      }
    }
  }
  lines.push('');
  return lines.join('\n');
}

/**
 * Generate hooks.json for Antigravity CLI.
 *
 * While Antigravity is workflow-driven, it still supports a hooks.json
 * registration file for compatibility with the hooks-adapter pipeline.
 */
export function generateAntigravityHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};
  const rootRef = targetProfile.pluginRootEnvVar
    ? `\${${targetProfile.pluginRootEnvVar}}`
    : '${ANTIGRAVITY_SKILL_PATH}';
  const pat = getPattern(manifest, targetProfile.name);
  const sdk = resolveSdkConfig(manifest);

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const cmd = resolveCmd(handler, slug, targetProfile.adapterName, rootRef, manifest.name, native, sdk.proxyPackage, sdk.proxyBinary, pat);
    hooks[native] = [{
      hooks: [{
        name: `${manifest.name}-${slug}`,
        type: 'workflow',
        command: cmd,
        timeout: 30000,
        description: `${manifest.name} ${canonical} hook (workflow-driven)`,
      }],
    }];
  });

  return JSON.stringify({
    description: `${manifest.name} plugin hooks for Antigravity CLI`,
    hooks,
  }, null, 2) + '\n';
}

/**
 * Generate workflow.json — the workflow orchestration descriptor.
 *
 * Antigravity CLI uses workflow-driven orchestration. This file
 * describes the execution graph for hooks rather than relying on
 * individual shell scripts.
 */
export function generateAntigravityWorkflow(manifest: A5cPluginManifest): string {
  const steps: Array<Record<string, unknown>> = [];

  if (manifest.hooks) {
    for (const [canonical, handler] of Object.entries(manifest.hooks)) {
      if (handler) {
        steps.push({
          id: slugify(canonical),
          hook: canonical,
          type: 'workflow',
          handler: typeof handler === 'string' ? handler : 'default',
        });
      }
    }
  }

  const workflow: Record<string, unknown> = {
    name: manifest.name,
    version: manifest.version,
    orchestration: 'workflow-driven',
    steps,
  };

  return JSON.stringify(workflow, null, 2) + '\n';
}
