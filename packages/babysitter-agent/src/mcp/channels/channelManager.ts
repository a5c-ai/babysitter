/**
 * GAP-MCPC-001: Channel Manager.
 *
 * Detects channel capability on connected MCP servers and manages
 * channel bindings. Integrates with McpClientManager and InboundMessageQueue.
 */

import type {
  ChannelCapability,
  ChannelConfig,
  ChannelMessage,
} from "./types";
import type { McpClientManager } from "../client/manager";
import { InboundMessageQueue, type WakeCallback } from "./inboundQueue";
import {
  readChannelAllowlist,
  getEnabledChannels,
} from "./allowlist";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChannelManagerOptions {
  /** State directory for reading allowlist. */
  stateDir: string;
  /** MCP client manager for server connections. */
  clientManager: McpClientManager;
  /** Wake callback for sleeping runs. */
  onWake?: WakeCallback;
  /** Maximum inbound queue size per run. */
  maxQueueSize?: number;
}

/** Detected channel server. */
export interface DetectedChannel {
  serverName: string;
  capability: ChannelCapability;
}

// ---------------------------------------------------------------------------
// ChannelManager
// ---------------------------------------------------------------------------

export class ChannelManager {
  private readonly _stateDir: string;
  private readonly _clientManager: McpClientManager;
  private readonly _queue: InboundMessageQueue;
  private readonly _detectedChannels = new Map<string, ChannelCapability>();

  constructor(options: ChannelManagerOptions) {
    this._stateDir = options.stateDir;
    this._clientManager = options.clientManager;
    this._queue = new InboundMessageQueue({
      maxQueueSize: options.maxQueueSize,
      onWake: options.onWake,
    });
  }

  /**
   * Detect channel capability on connected MCP servers.
   * A server declares channel capability by exposing tools matching
   * known channel patterns (e.g. slack_send_message, gmail_create_draft).
   */
  async detectChannels(): Promise<DetectedChannel[]> {
    const connections = this._clientManager.listConnections();
    const detected: DetectedChannel[] = [];

    for (const conn of connections) {
      if (conn.status !== "connected") continue;

      try {
        const tools = await this._clientManager.listTools(conn.name);
        const toolNames = tools.map((t) => t.name);

        const channelType = inferChannelType(toolNames);

        // Only consider servers that match a known channel type
        if (!channelType) continue;

        const capability: ChannelCapability = {
          inbound: toolNames.some(
            (n) => n.includes("read_channel") || n.includes("read_message") || n.includes("read_thread"),
          ),
          outbound: toolNames.some(
            (n) => n.includes("send_message") || n.includes("create_draft"),
          ),
          permissionRelay: false,
          channelType,
        };

        if (capability.inbound || capability.outbound) {
          this._detectedChannels.set(conn.name, capability);
          detected.push({ serverName: conn.name, capability });
        }
      } catch {
        // Skip servers that fail to list tools
      }
    }

    return detected;
  }

  /** Get detected channel capabilities. */
  getDetectedChannels(): DetectedChannel[] {
    return [...this._detectedChannels.entries()].map(([serverName, capability]) => ({
      serverName,
      capability,
    }));
  }

  /** Check if a server has channel capability. */
  hasChannelCapability(serverName: string): boolean {
    return this._detectedChannels.has(serverName);
  }

  /**
   * Process an inbound channel message.
   * Routes to bound run and queues for retrieval.
   */
  processInboundMessage(message: ChannelMessage): void {
    this._queue.enqueue(message);
  }

  /** Bind a channel to a run for message routing. */
  bindChannelToRun(channelSource: string, runId: string): void {
    this._queue.bindChannel(channelSource, runId);
  }

  /** Unbind a channel from its run. */
  unbindChannel(channelSource: string): void {
    this._queue.unbindChannel(channelSource);
  }

  /** Get messages for a run. */
  getMessages(runId: string, limit = 10): ChannelMessage[] {
    return this._queue.peek(runId, limit);
  }

  /** Dequeue messages for a run. */
  consumeMessages(runId: string, limit = 10): ChannelMessage[] {
    return this._queue.dequeue(runId, limit);
  }

  /** Check if a run has pending messages. */
  hasMessages(runId: string): boolean {
    return this._queue.hasMessages(runId);
  }

  /**
   * Load enabled channels from the allowlist.
   * Returns configs for channels that are both allowed and connected.
   */
  async getActiveChannels(): Promise<ChannelConfig[]> {
    const allowlist = await readChannelAllowlist(this._stateDir);
    const enabled = getEnabledChannels(allowlist);
    const connected = new Set(
      this._clientManager
        .listConnections()
        .filter((c) => c.status === "connected")
        .map((c) => c.name),
    );
    return enabled.filter((c) => connected.has(c.serverName));
  }

  /** Access the underlying queue (for advanced use). */
  get queue(): InboundMessageQueue {
    return this._queue;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Infer channel type from tool name prefixes. */
function inferChannelType(toolNames: string[]): string | undefined {
  const hasPrefix = (prefix: string) => toolNames.some((n) => n.startsWith(prefix));
  if (hasPrefix("slack_")) return "slack";
  if (hasPrefix("discord_")) return "discord";
  if (hasPrefix("gmail_") || hasPrefix("email_")) return "email";
  if (hasPrefix("telegram_")) return "telegram";
  if (hasPrefix("teams_")) return "teams";
  return undefined;
}
