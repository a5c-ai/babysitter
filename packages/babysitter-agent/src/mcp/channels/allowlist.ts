/**
 * GAP-MCPC-001: Channel Allowlist.
 *
 * Controls which MCP channels are active. Channels require explicit opt-in.
 * Uses atomic write pattern consistent with other SDK state modules.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { writeFileAtomic } from "../../storage/atomic";
import type { ChannelConfig, ChannelAllowlistFile } from "./types";
import { CHANNEL_ALLOWLIST_SCHEMA_VERSION } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyAllowlist(): ChannelAllowlistFile {
  return { schemaVersion: CHANNEL_ALLOWLIST_SCHEMA_VERSION, channels: [] };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getChannelAllowlistPath(stateDir: string): string {
  return path.join(stateDir, "channel-allowlist.json");
}

export async function readChannelAllowlist(stateDir: string): Promise<ChannelAllowlistFile> {
  const filePath = getChannelAllowlistPath(stateDir);
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return emptyAllowlist();
    throw error;
  }
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const rawChannels = Array.isArray(data.channels) ? (data.channels as unknown[]) : [];
    const validChannels = rawChannels.filter(
      (c): c is ChannelConfig => {
        if (typeof c !== "object" || c === null) return false;
        const obj = c as Record<string, unknown>;
        return (
          typeof obj.serverName === "string" &&
          typeof obj.channelId === "string" &&
          typeof obj.enabled === "boolean"
        );
      },
    );
    return {
      schemaVersion: typeof data.schemaVersion === "string" ? data.schemaVersion : CHANNEL_ALLOWLIST_SCHEMA_VERSION,
      channels: validChannels,
    };
  } catch {
    return emptyAllowlist();
  }
}

export async function writeChannelAllowlist(
  stateDir: string,
  allowlist: ChannelAllowlistFile,
): Promise<void> {
  const filePath = getChannelAllowlistPath(stateDir);
  await writeFileAtomic(filePath, JSON.stringify(allowlist, null, 2));
}

/** Add or update a channel in the allowlist. */
export async function upsertChannel(
  stateDir: string,
  channel: ChannelConfig,
): Promise<ChannelAllowlistFile> {
  const allowlist = await readChannelAllowlist(stateDir);
  const key = `${channel.serverName}:${channel.channelId}`;
  const idx = allowlist.channels.findIndex(
    (c) => `${c.serverName}:${c.channelId}` === key,
  );
  if (idx >= 0) {
    allowlist.channels[idx] = channel;
  } else {
    allowlist.channels.push(channel);
  }
  await writeChannelAllowlist(stateDir, allowlist);
  return allowlist;
}

/** Remove a channel from the allowlist. Returns true if removed. */
export async function removeChannel(
  stateDir: string,
  serverName: string,
  channelId: string,
): Promise<boolean> {
  const allowlist = await readChannelAllowlist(stateDir);
  const key = `${serverName}:${channelId}`;
  const before = allowlist.channels.length;
  allowlist.channels = allowlist.channels.filter(
    (c) => `${c.serverName}:${c.channelId}` !== key,
  );
  if (allowlist.channels.length === before) return false;
  await writeChannelAllowlist(stateDir, allowlist);
  return true;
}

/** Toggle a channel's enabled state. Returns the new enabled state. */
export async function toggleChannel(
  stateDir: string,
  serverName: string,
  channelId: string,
  enabled?: boolean,
): Promise<boolean | undefined> {
  const allowlist = await readChannelAllowlist(stateDir);
  const key = `${serverName}:${channelId}`;
  const channel = allowlist.channels.find(
    (c) => `${c.serverName}:${c.channelId}` === key,
  );
  if (!channel) return undefined;
  channel.enabled = enabled ?? !channel.enabled;
  await writeChannelAllowlist(stateDir, allowlist);
  return channel.enabled;
}

/** Get all enabled channels. */
export function getEnabledChannels(allowlist: ChannelAllowlistFile): ChannelConfig[] {
  return allowlist.channels.filter((c) => c.enabled);
}
