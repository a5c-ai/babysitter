// Helper functions for the transform stage
// Extracted to keep transform.ts under the max-lines limit

import type { A5cPluginManifest, TargetProfile } from './types.js';

function buildTemplateVars(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): Record<string, string> {
  const override = manifest.targets?.[targetProfile.name];
  const overrideVars = override?.templateVars ?? {};
  const targetDir = typeof overrideVars.targetDir === 'string' ? overrideVars.targetDir : targetProfile.name;
  return {
    target: targetProfile.name,
    targetName: targetProfile.name,
    targetDir,
    ...overrideVars,
  };
}

function interpolateTemplate(
  value: string,
  vars: Record<string, string>
): string {
  return value.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (match, key) => vars[key] ?? match);
}

export function resolveExtraFiles(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): Record<string, string> {
  const override = manifest.targets?.[targetProfile.name];
  const vars = buildTemplateVars(manifest, targetProfile);
  const resolved: Record<string, string> = {};

  for (const setName of override?.extraFileSets ?? []) {
    const set = manifest.extraFileSets?.[setName];
    if (!set) continue;
    for (const [outputPath, value] of Object.entries(set)) {
      resolved[interpolateTemplate(outputPath, vars)] = interpolateTemplate(value, vars);
    }
  }

  for (const [outputPath, value] of Object.entries(override?.extraFiles ?? {})) {
    resolved[interpolateTemplate(outputPath, vars)] = interpolateTemplate(value, vars);
  }

  return resolved;
}

export function resolveHarnessInstallSurfaceExports(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string[] {
  const override = manifest.targets?.[targetProfile.name];
  const resolved: string[] = [];
  const seen = new Set<string>();
  const addEntries = (entries?: string[]) => {
    if (!Array.isArray(entries)) return;
    for (const entry of entries) {
      if (typeof entry !== 'string' || seen.has(entry)) continue;
      seen.add(entry);
      resolved.push(entry);
    }
  };

  for (const setName of override?.harnessInstallSurfaceExportSets ?? []) {
    addEntries(manifest.harnessInstallSurfaceExportSets?.[setName]);
  }
  addEntries(override?.harnessInstallSurfaceExports);

  return resolved;
}

export function generatePs1Wrapper(
  hookSlug: string,
  adapterName: string,
  _sourceScript: string
): string {
  return `# PowerShell hook wrapper — sets env vars and delegates to bash
$env:HOOK_TYPE = '${hookSlug}'
$env:ADAPTER_NAME = '${adapterName}'
$env:PLUGIN_ROOT = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

$input_data = [Console]::In.ReadToEnd()
$result = $input_data | & bash "$PSScriptRoot/../$($MyInvocation.MyCommand.Name -replace '\\.ps1$','.sh')" 2>$null
if ($LASTEXITCODE -eq 0 -and $result) {
  Write-Output $result
} else {
  Write-Output '{}'
}
`;
}

export function generateJsBridge(
  _name: string,
  shellScript: string,
  targetProfile: TargetProfile
): string {
  const pluginRootEnvVar = targetProfile.pluginRootEnvVarForExtension || 'PLUGIN_ROOT';
  const defaultAdapterName = targetProfile.adapterName;
  return `#!/usr/bin/env node
"use strict";
var execSync = require("child_process").execSync;
var path = require("path");
var readFileSync = require("fs").readFileSync;

var PLUGIN_ROOT = process.env.${pluginRootEnvVar} || process.env.PLUGIN_ROOT || path.resolve(__dirname, "..");
var stdin = "";
try { stdin = readFileSync(0, "utf8"); } catch {}
try {
  var result = execSync("bash " + JSON.stringify(path.join(PLUGIN_ROOT, "${shellScript}")), {
    input: stdin,
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 30000,
    env: Object.assign({}, process.env, {
      HOOK_TYPE: process.env.HOOK_TYPE || "",
      ADAPTER_NAME: process.env.ADAPTER_NAME || "${defaultAdapterName}",
      PLUGIN_ROOT: PLUGIN_ROOT
    })
  });
  process.stdout.write(result);
} catch (e) {
  process.stdout.write("{}\\n");
}
`;
}

export function generateHarnessManifest(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const override = manifest.targets?.[targetProfile.name];
  const base: Record<string, unknown> = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    author: manifest.author,
    license: manifest.license,
  };

  if (manifest.repository) base.repository = manifest.repository;
  if (manifest.keywords) base.keywords = manifest.keywords;

  if (override?.harnessManifest) {
    Object.assign(base, override.harnessManifest);
  }

  return JSON.stringify(base, null, 2) + '\n';
}


export function generateTeamInstall(
  manifest: A5cPluginManifest,
  _targetProfile: TargetProfile,
  ext = '.js',
): string {
  const sharedRequire = ext === '.js' ? '../bin/install-shared' : `../bin/install-shared${ext}`;
  return `#!/usr/bin/env node
'use strict';

var path = require('path');
var shared = require('${sharedRequire}');

var workspace = process.cwd();
for (var i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--workspace' && process.argv[i + 1]) {
    workspace = path.resolve(process.argv[i + 1]);
  }
}

var src = process.env.PLUGIN_PACKAGE_ROOT || path.resolve(__dirname, '..');
var dest = shared.getHomePluginRoot('workspace');
console.log('[${manifest.name}] Team install to ' + dest);

shared.copyPluginBundle(src, dest);
if (typeof shared.harnessTeamInstall === 'function') {
  shared.harnessTeamInstall(src, dest, workspace);
}
shared.runPostInstall(dest);
console.log('[${manifest.name}] Team install complete.');
`;
}

export function generateOpenClawNativeHooksSection(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): Record<string, string> {
  const hooks: Record<string, string> = {};

  if (manifest.hooks) {
    for (const [canonicalHook, handlerPath] of Object.entries(manifest.hooks)) {
      if (handlerPath === null) continue;

      const nativeHook = targetProfile.supportedHooks.get(canonicalHook);
      if (nativeHook) {
        hooks[nativeHook] = `extensions/hooks/${nativeHook.replace(/[._]/g, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}.ts`;
      }
    }
  }

  return hooks;
}

export function generateOpenCodeAccomplishSkill(
  manifest: A5cPluginManifest
): string | null {
  if (!manifest.skills || manifest.skills.length === 0) return null;

  const primarySkill = manifest.skills[0];

  return `---
name: ${manifest.name}
description: ${manifest.description}
command: /${primarySkill.name}
verified: true
---

# ${manifest.name}

${manifest.description}

(This is a specialized accomplish-mode variant for OpenCode's accomplish workflow.)
`;
}

export function generateTsHookStub(
  nativeHook: string,
  nativeSlug: string,
  shellScriptName: string,
  targetProfile: TargetProfile
): string {
  const handlerName = nativeHook
    .replace(/[._]([a-z])/g, (_: string, c: string) => c.toUpperCase())
    + 'Handler';
  return `/**
 * ${targetProfile.displayName} ${nativeHook} hook — delegates to shell script.
 */
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, "../..");

export async function ${handlerName}(context: Record<string, unknown>): Promise<void> {
  try {
    execFileSync("bash", [resolve(PLUGIN_ROOT, "hooks/${shellScriptName}")], {
      input: JSON.stringify(context),
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30000,
      env: { ...process.env, ADAPTER_NAME: "${targetProfile.adapterName}", PLUGIN_ROOT },
    });
  } catch { /* best-effort */ }
}
`;
}

export function generateGeminiPostinstall(pluginName: string): string {
  return `#!/usr/bin/env node
'use strict';
var path = require('path');
var spawnSync = require('child_process').spawnSync;
var fs = require('fs');

var PACKAGE_ROOT = path.resolve(__dirname, '..');
var extDir = path.join(require('os').homedir(), '.gemini', 'extensions', '${pluginName}');

if (!process.env.npm_config_global) process.exit(0);
try { if (fs.lstatSync(extDir).isSymbolicLink()) process.exit(0); } catch {}

try {
  var result = spawnSync('gemini', ['extensions', 'install', PACKAGE_ROOT], { stdio: 'inherit', timeout: 60000 });
  if (result.status === 0) process.exit(0);
} catch {}

console.log('[${pluginName}-gemini] Gemini CLI not found. Run: ${pluginName}-gemini install');
`;
}

export function generateGeminiPreuninstall(pluginName: string): string {
  return `#!/usr/bin/env node
'use strict';
var path = require('path');
var spawnSync = require('child_process').spawnSync;
var fs = require('fs');

var extDir = path.join(require('os').homedir(), '.gemini', 'extensions', '${pluginName}');

try { if (!fs.existsSync(extDir) || fs.lstatSync(extDir).isSymbolicLink()) process.exit(0); } catch {}

try {
  spawnSync('gemini', ['extensions', 'uninstall', '${pluginName}'], { stdio: 'inherit', timeout: 30000 });
} catch {
  try { fs.rmSync(extDir, { recursive: true, force: true }); } catch {}
}
`;
}
