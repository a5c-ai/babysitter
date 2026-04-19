// Hook registration file generators for all targets
// Generates hooks.json (or equivalent) that wires up hook scripts
// with HOOK_TYPE and ADAPTER_NAME env vars per target.

import type { A5cPluginManifest, TargetProfile } from './types.js';
import { slugify } from './utils.js';

function resolveCommand(
  handlerValue: string | boolean,
  hookSlug: string,
  adapter: string,
  rootRef: string
): string {
  if (handlerValue === 'proxy') {
    return `a5c-hooks-proxy invoke --adapter ${adapter} --hook-type ${hookSlug} --plugin-root ${rootRef} --json`;
  }
  if (typeof handlerValue === 'string') {
    return `HOOK_TYPE=${hookSlug} ADAPTER_NAME=${adapter} PLUGIN_ROOT=${rootRef} bash ${rootRef}/${handlerValue}`;
  }
  return `echo '{}'`;
}

function resolvePsCommand(
  handlerValue: string | boolean,
  hookSlug: string,
  adapter: string
): string {
  if (handlerValue === 'proxy') {
    return `a5c-hooks-proxy invoke --adapter ${adapter} --hook-type ${hookSlug} --json`;
  }
  if (typeof handlerValue === 'string') {
    return `$env:HOOK_TYPE='${hookSlug}'; $env:ADAPTER_NAME='${adapter}'; & "./${handlerValue.replace(/\.sh$/, '.ps1')}"`;
  }
  return `Write-Output '{}'`;
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

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const cmd = resolveCommand(handler, slug, targetProfile.adapterName, rootRef);
    const entry: Record<string, unknown> = {
      hooks: [{ type: 'command', command: cmd }],
    };
    if (manifest.hookConfig?.matchers?.[canonical]) {
      entry.matcher = manifest.hookConfig.matchers[canonical];
    }
    hooks[native] = [entry];
  });

  return JSON.stringify({ description: `${manifest.name} plugin hooks`, hooks }, null, 2);
}

export function generateCodexHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const cmd = resolveCommand(handler, slug, targetProfile.adapterName, '.');
    hooks[native] = [{ matcher: '.*', hooks: [{ type: 'command', command: cmd }] }];
  });

  return JSON.stringify({ hooks }, null, 2);
}

export function generateCursorHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const bash = resolveCommand(handler, slug, targetProfile.adapterName, '.');
    const ps = resolvePsCommand(handler, slug, targetProfile.adapterName);
    const entry: Record<string, unknown> = { type: 'command', bash, powershell: ps, timeoutSec: 30 };
    if (canonical === 'Stop') entry.loop_limit = null;
    hooks[native] = [entry];
  });

  return JSON.stringify({ version: 1, hooks }, null, 2);
}

export function generateGeminiHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};
  const rootRef = targetProfile.pluginRootEnvVar
    ? `\${${targetProfile.pluginRootEnvVar}}`
    : '${extensionPath}';

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const cmd = resolveCommand(handler, slug, targetProfile.adapterName, rootRef);
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

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const bash = resolveCommand(handler, slug, targetProfile.adapterName, '.');
    const ps = resolvePsCommand(handler, slug, targetProfile.adapterName);
    hooks[native] = [{ type: 'command', bash, powershell: ps, timeoutSec: 30 }];
  });

  return JSON.stringify({ version: 1, hooks }, null, 2);
}

export function generateOpenCodeHooksJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const hooks: Record<string, unknown> = {};

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    let script: string;
    if (handler === 'proxy') {
      script = `a5c-hooks-proxy invoke --adapter ${targetProfile.adapterName} --hook-type ${slug} --json`;
    } else if (typeof handler === 'string') {
      script = handler.replace(/\.sh$/, '.js');
    } else {
      script = 'echo {}';
    }
    hooks[native] = [{
      type: 'command',
      script,
      env: { HOOK_TYPE: slug, ADAPTER_NAME: targetProfile.adapterName },
      description: `${manifest.name} ${canonical} hook`,
      timeoutMs: canonical === 'ShellEnv' ? 5000 : 30000,
    }];
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

  iterateHooks(manifest, targetProfile, (canonical, native, handler) => {
    const slug = slugify(canonical);
    const cmd = resolveCommand(handler, slug, targetProfile.adapterName, '.');
    hooks[native] = [{ matcher: '*', hooks: [{ type: 'command', command: cmd }] }];
  });

  return JSON.stringify({
    description: `${manifest.name} plugin hooks for OpenClaw`,
    hooks,
  }, null, 2);
}
