/**
 * CC Plugin Compatibility Layer (GAP-ECO-001).
 *
 * Translates Claude Code plugin manifests into genty extension format,
 * enabling CC plugins to run inside the genty agent platform.
 */

import { readFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CcSkill {
  name: string;
  description?: string;
  trigger?: string;
}

export interface CcHook {
  event: string;
  handler: string;
  priority?: number;
}

export interface CcCommand {
  name: string;
  description?: string;
  handler: string;
}

export interface CcMcpServer {
  name: string;
  transport: 'stdio' | 'sse' | 'http';
  command?: string;
  url?: string;
}

export interface CcPluginManifest {
  name: string;
  version: string;
  skills?: CcSkill[];
  hooks?: CcHook[];
  commands?: CcCommand[];
  mcpServers?: CcMcpServer[];
}

// ---------------------------------------------------------------------------
// Genty extension types (target format)
// ---------------------------------------------------------------------------

export interface GentyExtensionCommand {
  id: string;
  label: string;
  description?: string;
  source: 'cc-skill' | 'cc-command';
}

export interface GentyExtensionEvent {
  id: string;
  ccEvent: string;
  priority: number;
  handler: string;
}

export interface GentyMcpConfig {
  name: string;
  transport: string;
  endpoint: string;
}

export interface GentyExtension {
  id: string;
  version: string;
  commands: GentyExtensionCommand[];
  events: GentyExtensionEvent[];
  mcpConfigs: GentyMcpConfig[];
}

// ---------------------------------------------------------------------------
// Compatibility report
// ---------------------------------------------------------------------------

export interface CompatibilityReport {
  compatible: boolean;
  warnings: string[];
  unsupportedFeatures: string[];
}

// ---------------------------------------------------------------------------
// Supported CC hook events that have genty equivalents
// ---------------------------------------------------------------------------

const SUPPORTED_HOOK_EVENTS = new Set([
  'PreToolUse',
  'PostToolUse',
  'Stop',
  'SubagentStop',
  'SessionStart',
  'SessionEnd',
  'UserPromptSubmit',
  'PreCompact',
  'Notification',
]);

const SUPPORTED_MCP_TRANSPORTS = new Set(['stdio', 'sse', 'http']);

// ---------------------------------------------------------------------------
// CcCompatibilityLayer
// ---------------------------------------------------------------------------

export class CcCompatibilityLayer {
  /**
   * Load a CC plugin manifest from a JSON file path.
   */
  loadCcPlugin(manifestPath: string): CcPluginManifest {
    const raw = readFileSync(manifestPath, 'utf-8');
    const parsed = JSON.parse(raw) as CcPluginManifest;
    if (!parsed.name || !parsed.version) {
      throw new Error('Invalid CC plugin manifest: missing "name" or "version"');
    }
    return parsed;
  }

  /**
   * Translate a CC plugin manifest into a genty extension descriptor.
   */
  translateToGentyExtension(manifest: CcPluginManifest): GentyExtension {
    const commands: GentyExtensionCommand[] = [];
    const events: GentyExtensionEvent[] = [];
    const mcpConfigs: GentyMcpConfig[] = [];

    // Skills → commands
    if (manifest.skills) {
      for (const skill of manifest.skills) {
        commands.push({
          id: `cc-skill:${manifest.name}:${skill.name}`,
          label: skill.name,
          description: skill.description,
          source: 'cc-skill',
        });
      }
    }

    // Commands → commands
    if (manifest.commands) {
      for (const cmd of manifest.commands) {
        commands.push({
          id: `cc-cmd:${manifest.name}:${cmd.name}`,
          label: cmd.name,
          description: cmd.description,
          source: 'cc-command',
        });
      }
    }

    // Hooks → events
    if (manifest.hooks) {
      for (const hook of manifest.hooks) {
        events.push({
          id: `cc-hook:${manifest.name}:${hook.event}`,
          ccEvent: hook.event,
          priority: hook.priority ?? 0,
          handler: hook.handler,
        });
      }
    }

    // MCP servers → MCP configs
    if (manifest.mcpServers) {
      for (const server of manifest.mcpServers) {
        mcpConfigs.push({
          name: server.name,
          transport: server.transport,
          endpoint: server.url ?? server.command ?? '',
        });
      }
    }

    return {
      id: manifest.name,
      version: manifest.version,
      commands,
      events,
      mcpConfigs,
    };
  }

  /**
   * Validate a CC plugin manifest and return a compatibility report.
   */
  validateCompatibility(manifest: CcPluginManifest): CompatibilityReport {
    const warnings: string[] = [];
    const unsupportedFeatures: string[] = [];

    // Check hooks for unsupported events
    if (manifest.hooks) {
      for (const hook of manifest.hooks) {
        if (!SUPPORTED_HOOK_EVENTS.has(hook.event)) {
          unsupportedFeatures.push(`Hook event "${hook.event}" is not supported`);
        }
      }
    }

    // Check MCP server transports
    if (manifest.mcpServers) {
      for (const server of manifest.mcpServers) {
        if (!SUPPORTED_MCP_TRANSPORTS.has(server.transport)) {
          unsupportedFeatures.push(
            `MCP transport "${server.transport}" for server "${server.name}" is not supported`,
          );
        }
        if (server.transport === 'stdio' && !server.command) {
          warnings.push(
            `MCP server "${server.name}" uses stdio transport but has no command specified`,
          );
        }
        if ((server.transport === 'sse' || server.transport === 'http') && !server.url) {
          warnings.push(
            `MCP server "${server.name}" uses ${server.transport} transport but has no url specified`,
          );
        }
      }
    }

    // Skills without triggers
    if (manifest.skills) {
      for (const skill of manifest.skills) {
        if (!skill.trigger && !skill.description) {
          warnings.push(
            `Skill "${skill.name}" has no trigger or description — it may not be discoverable`,
          );
        }
      }
    }

    const compatible = unsupportedFeatures.length === 0;

    return { compatible, warnings, unsupportedFeatures };
  }
}
