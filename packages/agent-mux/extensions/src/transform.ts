// Stage 3: TRANSFORM - Transform components to target format

import * as fs from 'fs';
import * as path from 'path';
import type {
  A5cPluginManifest,
  TargetProfile,
  TransformResult,
  TransformedFile,
  Diagnostic,
} from './types.js';
import {
  buildSkillFromCommand,
  getCommandPaths,
  markdownToToml,
} from './utils.js';

import { getAdapter } from './targets/adapters/index.js';

import {
  buildTemplateVars,
  interpolateTemplate,
  generatePs1Wrapper,
  generateJsBridge,
  generateTsHookStub,
} from './transformHelpers.js';

import {
  generateManifests,
  copyAgentFiles,
  copyContextFiles,
  copyIncludedFiles,
  generateExtraFiles,
} from './transformEmitters.js';

function toOutputPath(value: string): string {
  return value.replace(/\\/g, '/');
}

export function transform(
  sourceDir: string,
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): TransformResult {
  const files: TransformedFile[] = [];
  const diagnostics: Diagnostic[] = [];

  // Transform commands
  const commandFiles = transformCommands(sourceDir, manifest, targetProfile, diagnostics);
  files.push(...commandFiles);

  // Transform skills
  const skillFiles = transformSkills(sourceDir, manifest, targetProfile, diagnostics);
  files.push(...skillFiles);

  // Transform hooks
  const hookFiles = transformHooks(sourceDir, manifest, targetProfile, diagnostics);
  files.push(...hookFiles);

  // Generate manifests
  const manifestFiles = generateManifests(sourceDir, manifest, targetProfile, diagnostics);
  files.push(...manifestFiles);

  // Copy agent instruction files
  const agentFiles = copyAgentFiles(sourceDir, manifest, targetProfile, diagnostics);
  files.push(...agentFiles);

  // Copy context files
  const contextFiles = copyContextFiles(sourceDir, manifest, targetProfile, diagnostics);
  files.push(...contextFiles);

  // Copy included files (versions.json, assets, etc.) — skip hooks/ since transformHooks handles those
  const includedFiles = copyIncludedFiles(sourceDir, manifest, ['hooks/', 'hooks']);
  files.push(...includedFiles);

  // Generate extra files (Pi/oh-my-pi extensions, etc.)
  const extraFiles = generateExtraFiles(sourceDir, manifest, targetProfile, diagnostics);
  files.push(...extraFiles);

  return { files, diagnostics };
}

function transformCommands(
  sourceDir: string,
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile,
  _diagnostics: Diagnostic[]
): TransformedFile[] {
  const files: TransformedFile[] = [];

  if (targetProfile.commandFormat === 'none') {
    return files;
  }

  if (!manifest.commands) {
    return files;
  }

  const commandPaths: string[] = [];
  if (typeof manifest.commands === 'string') {
    // Directory path - glob all .md files
    const commandDir = path.join(sourceDir, manifest.commands);
    if (fs.existsSync(commandDir)) {
      const entries = fs.readdirSync(commandDir);
      for (const entry of entries) {
        if (entry.endsWith('.md')) {
          commandPaths.push(toOutputPath(path.join(manifest.commands, entry)));
        }
      }
    }
  } else {
    commandPaths.push(...manifest.commands.map(toOutputPath));
  }

  for (const cmdPath of commandPaths) {
    const fullPath = path.join(sourceDir, cmdPath);
    if (!fs.existsSync(fullPath)) {
      continue;
    }

    const vars = buildTemplateVars(manifest, targetProfile);
    const content = interpolateTemplate(fs.readFileSync(fullPath, 'utf-8'), vars);

    if (targetProfile.commandFormat === 'toml') {
      // Convert to TOML (Gemini)
      const tomlContent = markdownToToml(content);
      const basename = path.basename(cmdPath, '.md');
      files.push({
        path: `commands/${basename}.toml`,
        content: tomlContent,
      });
    } else {
      // Copy as-is (Markdown)
      files.push({
        path: cmdPath,
        content,
      });
    }
  }

  return files;
}

function transformSkills(
  sourceDir: string,
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile,
  _diagnostics: Diagnostic[]
): TransformedFile[] {
  const files: TransformedFile[] = [];

  if (targetProfile.skillHandling === 'none') {
    return files;
  }

  const vars = buildTemplateVars(manifest, targetProfile);

  // Always copy standalone skills
  if (manifest.skills && Array.isArray(manifest.skills)) {
    for (const skill of manifest.skills) {
      const fullPath = path.join(sourceDir, skill.file);
      if (fs.existsSync(fullPath)) {
        files.push({
          path: skill.file,
          content: interpolateTemplate(fs.readFileSync(fullPath, 'utf-8'), vars),
        });
      }
    }
  }

  // Derive skills from commands if needed
  if (targetProfile.skillHandling === 'derived-from-commands') {
    const commandPaths = getCommandPaths(sourceDir, manifest);

    // Build set of standalone skill names to avoid duplicating them
    const standaloneSkillNames = new Set<string>();
    if (manifest.skills && Array.isArray(manifest.skills)) {
      for (const skill of manifest.skills) {
        standaloneSkillNames.add(skill.name);
      }
    }

    for (const cmdPath of commandPaths) {
      const fullPath = path.join(sourceDir, cmdPath);
      if (!fs.existsSync(fullPath)) continue;

      const basename = path.basename(cmdPath, '.md');

      if (standaloneSkillNames.has(basename)) {
        continue;
      }

      const content = interpolateTemplate(fs.readFileSync(fullPath, 'utf-8'), vars);
      const derivedSkill = buildSkillFromCommand(basename, content);

      files.push({
        path: `skills/${basename}/SKILL.md`,
        content: derivedSkill,
      });
    }
  }

  return files;
}

// Re-export for backward compatibility
export { getCommandPaths } from './utils.js';

function transformHooks(
  sourceDir: string,
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile,
  diagnostics: Diagnostic[]
): TransformedFile[] {
  const files: TransformedFile[] = [];

  if (!manifest.hooks || targetProfile.supportedHooks.size === 0) {
    return files;
  }

  const isProgrammatic = targetProfile.adapterFamily === 'programmatic';
  const override = manifest.targets?.[targetProfile.name];
  const hookFilePattern = typeof override?.hookFilePattern === 'string'
    ? override.hookFilePattern
    : typeof manifest.hookFilePattern === 'string' ? manifest.hookFilePattern : undefined;
  const hookJsPattern = typeof override?.hookJsPattern === 'string'
    ? override.hookJsPattern
    : hookFilePattern ? hookFilePattern.replace(/\.sh$/, '.js') : undefined;
  const toSlug = (s: string) => s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const toNativeSlug = (s: string) => s.replace(/[._]/g, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

  for (const [canonicalHook, handlerValue] of Object.entries(manifest.hooks)) {
    if (handlerValue === null) continue;
    const nativeHook = targetProfile.supportedHooks.get(canonicalHook);
    if (!nativeHook) continue;
    if (typeof handlerValue !== 'string' || handlerValue === 'proxy') continue;

    const hookSlug = toSlug(canonicalHook);
    const nativeSlug = toNativeSlug(nativeHook);
    const sourceScript = path.join(sourceDir, handlerValue);
    if (!fs.existsSync(sourceScript)) continue;
    const rawContent = fs.readFileSync(sourceScript, 'utf-8');
    const content = rawContent.replace(
      /ADAPTER_NAME="\$\{ADAPTER_NAME:\?[^}]*\}"/,
      `ADAPTER_NAME="\${ADAPTER_NAME:-${targetProfile.adapterName}}"`
    );

    // Determine bash output filename via hookFilePattern
    let outName: string;
    if (hookFilePattern) {
      outName = hookFilePattern
        .replace(/\{\{name\}\}/g, manifest.name)
        .replace(/\{\{slug\}\}/g, hookSlug)
        .replace(/\{\{native\}\}/g, nativeSlug);
    } else {
      outName = path.basename(handlerValue);
    }

    files.push({ path: `hooks/${outName}`, content, executable: true });

    if (targetProfile.scriptVariants.includes('powershell')) {
      const ps1Name = outName.replace(/\.sh$/, '.ps1');
      files.push({ path: `hooks/${ps1Name}`, content: generatePs1Wrapper(hookSlug, targetProfile.adapterName, handlerValue) });
    }

    // JS bridge for programmatic targets — uses hookJsPattern if available
    if (isProgrammatic) {
      let jsName: string;
      if (hookJsPattern) {
        jsName = hookJsPattern
          .replace(/\{\{name\}\}/g, manifest.name)
          .replace(/\{\{slug\}\}/g, hookSlug)
          .replace(/\{\{native\}\}/g, nativeSlug);
      } else {
        jsName = outName.replace(/\.sh$/, '.js');
      }
      files.push({ path: `hooks/${jsName}`, content: generateJsBridge(jsName.replace(/\.js$/, ''), handlerValue, targetProfile), executable: true });
    }

    // TS hook stubs for targets with typescript variant (openclaw)
    if (targetProfile.scriptVariants.includes('typescript')) {
      const tsName = `${nativeSlug}.ts`;
      files.push({
        path: `extensions/hooks/${tsName}`,
        content: generateTsHookStub(nativeHook, nativeSlug, outName, targetProfile),
      });
    }
  }

  // Emit Stop hook script for programmatic targets that declare Stop in the
  // manifest but don't list it in supportedHooks (e.g. openclaw).
  if (targetProfile.adapterFamily === 'programmatic' && typeof manifest.hooks?.Stop === 'string' && !targetProfile.supportedHooks.has('Stop')) {
    const stopSource = path.join(sourceDir, manifest.hooks.Stop);
    if (fs.existsSync(stopSource)) {
      const rawContent = fs.readFileSync(stopSource, 'utf-8');
      const content = rawContent.replace(
        /ADAPTER_NAME="\$\{ADAPTER_NAME:\?[^}]*\}"/,
        `ADAPTER_NAME="\${ADAPTER_NAME:-${targetProfile.adapterName}}"`
      );
      const stopOutName = hookFilePattern
        ? hookFilePattern
          .replace(/\{\{name\}\}/g, manifest.name)
          .replace(/\{\{slug\}\}/g, toSlug('Stop'))
          .replace(/\{\{native\}\}/g, 'stop-hook')
        : path.basename(manifest.hooks.Stop);
      const stopPath = `hooks/${stopOutName}`;
      if (!files.some((file) => file.path === stopPath)) {
        files.push({ path: stopPath, content, executable: true });
      }
    }
  }

  // Generate hook registration file for shell-hook targets
  if (targetProfile.hookRegistrationFormat) {
    const hookRegFile = generateHookRegistrationFile(
      manifest,
      targetProfile,
      diagnostics
    );
    if (hookRegFile) {
      files.push(hookRegFile);
      for (const aliasPath of targetProfile.hookRegistrationAliasPaths) {
        files.push({ path: aliasPath, content: hookRegFile.content });
      }
    }
  }

  return files;
}

function generateHookRegistrationFile(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile,
  diagnostics: Diagnostic[]
): TransformedFile | null {
  const adapter = getAdapter(targetProfile.name);
  if (!adapter) return null;
  return adapter.generateHookRegistration(manifest, targetProfile, diagnostics);
}
