// Hook registration file generators for all targets
// Generates hooks.json (or equivalent) that wires up hook scripts
// with HOOK_TYPE and ADAPTER_NAME env vars per target.

import type { A5cPluginManifest, TargetProfile } from './types.js';
import { slugify } from './utils.js';

function applyPattern(
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

function resolveHookPath(
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

function resolveCmd(
  handlerValue: string | boolean,
  hookSlug: string,
  adapter: string,
  rootRef: string,
  pluginName: string,
  nativeHook: string,
  pattern?: string
): string {
  if (handlerValue === 'proxy') {
    return `a5c-hooks-proxy invoke --adapter ${adapter} --json`;
  }
  const p = resolveHookPath(handlerValue, hookSlug, pluginName, nativeHook, pattern);
  if (p) {
    const scriptRef = rootRef.startsWith('$') || rootRef.startsWith('\\$')
      ? `${rootRef}/${p}` : `./${p}`;
    return `npx -y @a5c-ai/hooks-proxy-cli invoke --adapter ${adapter} --handler "bash ${scriptRef}" --json`;
  }
  return `echo '{}'`;
}

function _resolvePsCmd(
  handlerValue: string | boolean,
  hookSlug: string,
  adapter: string,
  pluginName: string,
  nativeHook: string,
  pattern?: string
): string {
  if (handlerValue === 'proxy') {
    return `a5c-hooks-proxy invoke --adapter ${adapter} --json`;
  }
  const p = resolveHookPath(handlerValue, hookSlug, pluginName, nativeHook, pattern);
  if (p) {
    const ps1Path = `./${p.replace(/\.sh$/, '.ps1')}`;
    return `powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1Path}"`;
  }
  return `Write-Output '{}'`;
}

function getPattern(manifest: A5cPluginManifest, targetName: string): string | undefined {
  const override = manifest.targets?.[targetName]?.hookFilePattern;
  if (typeof override === 'string') return override;
  if (typeof manifest.hookFilePattern === 'string') return manifest.hookFilePattern;
  return undefined;
}

function getJsPattern(manifest: A5cPluginManifest, targetName: string): string | undefined {
  const override = manifest.targets?.[targetName]?.hookJsPattern;
  if (typeof override === 'string') return override;
  // Derive JS pattern from global hookFilePattern by swapping extension
  if (typeof manifest.hookFilePattern === 'string') return manifest.hookFilePattern.replace(/\.sh$/, '.js');
  return undefined;
}

function iterateHooks(
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

export function generateClaudeCodeHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};
  const rootRef = targetProfile.pluginRootEnvVar
    ? `\${${targetProfile.pluginRootEnvVar}}`
    : '$(cd "$(dirname "$0")/.." && pwd)';
  const pat = getPattern(manifest, targetProfile.name);

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const cmd = resolveCmd(handler, slug, targetProfile.adapterName, rootRef, manifest.name, native, pat);
    const entry: Record<string, unknown> = {
      hooks: [{ type: 'command', command: cmd }],
    };
    if (manifest.hookConfig?.matchers?.[canonical]) {
      entry.matcher = manifest.hookConfig.matchers[canonical];
    }
    hooks[native] = [entry];
  });

  return JSON.stringify({ description: `${manifest.name} plugin hooks`, hooks }, null, 2) + '\n';
}

export function generateCodexHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};
  const pat = getPattern(manifest, targetProfile.name);

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const cmd = resolveCmd(handler, slug, targetProfile.adapterName, '.', manifest.name, native, pat);
    hooks[native] = [{ matcher: '.*', hooks: [{ type: 'command', command: cmd }] }];
  });

  return JSON.stringify({ hooks }, null, 2) + '\n';
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
    const adapter = targetProfile.adapterName;
    const bashCmd = p ? `npx -y @a5c-ai/hooks-proxy-cli invoke --adapter ${adapter} --handler "bash ./${p}" --json` : `echo '{}'`;
    const psCmd = p ? `npx -y @a5c-ai/hooks-proxy-cli invoke --adapter ${adapter} --handler "bash ./${p}" --json` : `Write-Output '{}'`;
    const entry: Record<string, unknown> = { type: 'command', bash: bashCmd, powershell: psCmd, timeoutSec: 30 };
    if (canonical === 'Stop') {
      entry.loop_limit = null;
      delete entry.timeoutSec;
    }
    hooks[native] = [entry];
  });

  return JSON.stringify({ version: 1, hooks }, null, 2) + '\n';
}

export function generateGeminiHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};
  const rootRef = targetProfile.pluginRootEnvVar
    ? `\${${targetProfile.pluginRootEnvVar}}`
    : '${extensionPath}';
  const pat = getPattern(manifest, targetProfile.name);

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const cmd = resolveCmd(handler, slug, targetProfile.adapterName, rootRef, manifest.name, native, pat);
    hooks[native] = [{
      hooks: [{
        name: `${manifest.name}-${slug}`,
        type: 'command',
        command: cmd,
        timeout: 30000,
        description: `${manifest.name} ${canonical} hook`,
      }],
    }];
  });

  return JSON.stringify({
    description: `${manifest.name} plugin hooks for Gemini CLI`,
    hooks,
  }, null, 2);
}

export function generateGithubCopilotHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};
  const pat = getPattern(manifest, targetProfile.name);

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const p = resolveHookPath(handler, slug, manifest.name, native, pat);
    const adapter = targetProfile.adapterName;
    const bashCmd = p ? `npx -y @a5c-ai/hooks-proxy-cli invoke --adapter ${adapter} --handler "bash ./${p}" --json` : `echo '{}'`;
    const psCmd = p ? `npx -y @a5c-ai/hooks-proxy-cli invoke --adapter ${adapter} --handler "bash ./${p}" --json` : `Write-Output '{}'`;
    const timeout = canonical === 'UserPromptSubmit' ? 15 : 30;
    hooks[native] = [{ type: 'command', bash: bashCmd, powershell: psCmd, timeoutSec: timeout }];
  });

  return JSON.stringify({ version: 1, hooks }, null, 2) + '\n';
}

export function generateOpenCodeHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};
  const pat = getPattern(manifest, targetProfile.name);

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const adapter = targetProfile.adapterName;
    if (handler === 'proxy') {
      hooks[native] = [{
        type: 'command',
        script: `npx -y @a5c-ai/hooks-proxy-cli invoke --adapter ${adapter} --json`,
        description: `${manifest.name} ${canonical} hook`,
        timeoutMs: canonical === 'ShellEnv' ? 5000 : 30000,
      }];
    } else {
      const jsPat = getJsPattern(manifest, targetProfile.name);
      let handlerScript: string;
      if (jsPat) {
        handlerScript = applyPattern(jsPat, manifest.name, slug, native);
      } else {
        const p = resolveHookPath(handler, slug, manifest.name, native, pat);
        handlerScript = p ? p.replace(/\.sh$/, '.js') : 'echo {}';
      }
      hooks[native] = [{
        type: 'command',
        script: `npx -y @a5c-ai/hooks-proxy-cli invoke --adapter ${adapter} --handler "node ./${handlerScript}" --json`,
        description: `${manifest.name} ${canonical} hook`,
        timeoutMs: canonical === 'ShellEnv' ? 5000 : 30000,
      }];
    }
  });

  return JSON.stringify({
    version: 1,
    description: `${manifest.name} hook registration for OpenCode.`,
    hooks,
  }, null, 2);
}

export function generateOpenClawHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};
  const pat = getPattern(manifest, targetProfile.name);

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const cmd = resolveCmd(handler, slug, targetProfile.adapterName, '.', manifest.name, native, pat);
    hooks[native] = [{ matcher: '*', hooks: [{ type: 'command', command: cmd }] }];
  });

  return JSON.stringify({
    description: `${manifest.name} plugin hooks for OpenClaw`,
    hooks,
  }, null, 2);
}
