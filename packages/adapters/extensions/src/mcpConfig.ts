// Shared MCP-config builders for the per-harness emit step.
//
// A new top-level `mcpServers` field on the unified plugin.json declares native
// MCP servers to wire into every target in its native config format. These
// helpers translate an McpServerSpec into the two canonical shapes:
//   (A) JSON `mcpServers` map  — claude-code, cursor, github-copilot,
//       antigravity, pi, oh-my-pi, openclaw, genty
//   (B) harness merge fragment — opencode (`mcp` array form), codex (TOML
//       `mcp_servers`), gemini (`mcpServers` with `httpUrl`)
//
// The env-override happens at the harness' runtime via the `mcp-remote` bridge,
// mirroring the repo root `.mcp.json` shape:
//   command: "npx", args: ["-y","mcp-remote","${ATLAS_MCP_URL:-<default>}"]

import type { A5cPluginManifest, McpServerSpec, TransformedFile } from './types.js';

/** Default Atlas MCP server URL (SPEC §4.2 / spec.json mcp.url). */
export const DEFAULT_ATLAS_MCP_URL = 'https://atlas-staging.a5c.ai/api/mcp';

/**
 * Emission-time URL for a server spec: the literal `spec.url`, falling back to
 * the default Atlas URL when unset.
 */
export function resolveMcpUrl(spec: McpServerSpec): string {
  return spec.url ?? DEFAULT_ATLAS_MCP_URL;
}

/**
 * The env-override default token emitted verbatim into command/args for the
 * JSON + TOML targets, e.g. `${ATLAS_MCP_URL:-https://atlas-staging.a5c.ai/api/mcp}`.
 * Falls back to the literal default URL when no env var is declared.
 */
export function buildEnvOverrideUrl(spec: McpServerSpec): string {
  const url = resolveMcpUrl(spec);
  return spec.urlEnvVar ? `\${${spec.urlEnvVar}:-${url}}` : url;
}

/**
 * The `mcp-remote` bridge args carrying the env-override default token:
 *   ["-y", "mcp-remote", "${ATLAS_MCP_URL:-<default>}"]
 */
export function buildRemoteCommandArgs(spec: McpServerSpec): string[] {
  return ['-y', 'mcp-remote', buildEnvOverrideUrl(spec)];
}

/**
 * (A) JSON `mcpServers` map: { "mcpServers": { "<name>": { command, args } } }.
 * Used by claude-code, cursor, github-copilot, antigravity, pi, oh-my-pi,
 * openclaw, genty. Each server emits the `mcp-remote` bridge form.
 */
export function buildJsonMcpServers(
  servers: Record<string, McpServerSpec>,
): { mcpServers: Record<string, { command: string; args: string[] }> } {
  const mcpServers: Record<string, { command: string; args: string[] }> = {};
  for (const [name, spec] of Object.entries(servers)) {
    mcpServers[name] = {
      command: 'npx',
      args: buildRemoteCommandArgs(spec),
    };
  }
  return { mcpServers };
}

/**
 * (B) opencode merge fragment: { "mcp": { "<name>": { type:"local",
 * command:[...array...], enabled:true } } }. opencode uses `mcp` (not
 * `mcpServers`) and the command is an array.
 */
export function buildOpencodeMcp(
  servers: Record<string, McpServerSpec>,
): { mcp: Record<string, { type: string; command: string[]; enabled: boolean }> } {
  const mcp: Record<string, { type: string; command: string[]; enabled: boolean }> = {};
  for (const [name, spec] of Object.entries(servers)) {
    mcp[name] = {
      type: 'local',
      command: ['npx', ...buildRemoteCommandArgs(spec)],
      enabled: true,
    };
  }
  return { mcp };
}

/**
 * (B) codex TOML merge fragment: a `[mcp_servers.<name>]` table with
 * command="npx" and args carrying the env-override token. Folded into
 * ~/.codex/config.toml by the install surface.
 */
export function buildCodexMcpToml(servers: Record<string, McpServerSpec>): string {
  const blocks: string[] = [];
  for (const [name, spec] of Object.entries(servers)) {
    const args = buildRemoteCommandArgs(spec)
      .map((a) => JSON.stringify(a))
      .join(', ');
    blocks.push(`[mcp_servers.${name}]\ncommand = "npx"\nargs = [${args}]\n`);
  }
  return blocks.join('\n');
}

/**
 * (B) gemini extension manifest fragment: { "mcpServers": { "<name>": {
 * httpUrl:"<default>", command:"npx", args:[...token...] } } }. gemini
 * extensions declare MCP in the extension manifest; prefer `httpUrl` for the
 * remote URL while still carrying the `mcp-remote` command/args.
 */
export function buildGeminiMcpServers(
  servers: Record<string, McpServerSpec>,
): {
  mcpServers: Record<string, { httpUrl: string; command: string; args: string[] }>;
} {
  const mcpServers: Record<string, { httpUrl: string; command: string; args: string[] }> = {};
  for (const [name, spec] of Object.entries(servers)) {
    mcpServers[name] = {
      httpUrl: resolveMcpUrl(spec),
      command: 'npx',
      args: buildRemoteCommandArgs(spec),
    };
  }
  return { mcpServers };
}

/** Serialize a JSON object as the file content (trailing newline, like siblings). */
export function toJsonContent(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n';
}

/**
 * Shared emitter for the (A) JSON `mcpServers` map targets. Returns the native
 * MCP config file at `path`, or null when the manifest declares no MCP servers.
 */
export function emitJsonMcpConfig(
  manifest: A5cPluginManifest,
  path: string,
): TransformedFile | null {
  if (!manifest.mcpServers || Object.keys(manifest.mcpServers).length === 0) {
    return null;
  }
  return { path, content: toJsonContent(buildJsonMcpServers(manifest.mcpServers)) };
}
