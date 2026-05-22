/**
 * Status: NOT INTEGRATED YET
 * Moved from @a5c-ai/babysitter-sdk.
 * GAP-REMOTE-006: MCP server configuration persistence.
 *
 * Read/write/merge server configurations from mcp-servers.json.
 * Uses the same atomic temp-file + rename pattern as session modules.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { McpServerConfig, McpServersFile } from "./types";
import { MCP_SERVERS_SCHEMA_VERSION } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyServersFile(): McpServersFile {
  return { schemaVersion: MCP_SERVERS_SCHEMA_VERSION, servers: [] };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Resolve the path to mcp-servers.json within a state directory. */
export function getMcpServersConfigPath(stateDir: string): string {
  return path.join(stateDir, "mcp-servers.json");
}

/** Read server configurations. Returns empty list on missing/corrupt file. */
export async function readMcpServersConfig(stateDir: string): Promise<McpServersFile> {
  const filePath = getMcpServersConfigPath(stateDir);
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return emptyServersFile();
    return emptyServersFile();
  }
  try {
    const data = JSON.parse(raw) as Partial<McpServersFile>;
    return {
      schemaVersion: typeof data.schemaVersion === "string" ? data.schemaVersion : MCP_SERVERS_SCHEMA_VERSION,
      servers: Array.isArray(data.servers) ? data.servers : [],
    };
  } catch {
    return emptyServersFile();
  }
}

/** Write server configurations atomically. */
export async function writeMcpServersConfig(
  stateDir: string,
  config: McpServersFile,
): Promise<void> {
  const filePath = getMcpServersConfigPath(stateDir);
  const dir = path.dirname(filePath);
  const tempPath = `${filePath}.tmp.${process.pid}`;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tempPath, JSON.stringify(config, null, 2), "utf8");
  await fs.rename(tempPath, filePath);
}

/**
 * Add or update a server configuration.
 * If a server with the same name exists, it is replaced.
 */
export async function upsertServerConfig(
  stateDir: string,
  server: McpServerConfig,
): Promise<McpServersFile> {
  const config = await readMcpServersConfig(stateDir);
  const idx = config.servers.findIndex((s) => s.name === server.name);
  if (idx >= 0) {
    config.servers[idx] = server;
  } else {
    config.servers.push(server);
  }
  await writeMcpServersConfig(stateDir, config);
  return config;
}

/** Remove a server configuration by name. Returns true if removed. */
export async function removeServerConfig(
  stateDir: string,
  serverName: string,
): Promise<boolean> {
  const config = await readMcpServersConfig(stateDir);
  const before = config.servers.length;
  config.servers = config.servers.filter((s) => s.name !== serverName);
  if (config.servers.length === before) return false;
  await writeMcpServersConfig(stateDir, config);
  return true;
}

/**
 * Merge an array of server configs into the existing configuration.
 * Servers with matching names are replaced; new ones are appended.
 */
export async function mergeMcpServersConfig(
  stateDir: string,
  incoming: McpServerConfig[],
): Promise<McpServersFile> {
  const config = await readMcpServersConfig(stateDir);
  for (const server of incoming) {
    const idx = config.servers.findIndex((s) => s.name === server.name);
    if (idx >= 0) {
      config.servers[idx] = server;
    } else {
      config.servers.push(server);
    }
  }
  await writeMcpServersConfig(stateDir, config);
  return config;
}
