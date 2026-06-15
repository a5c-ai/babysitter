/**
 * GAP-MCPC-002: Outbound Channel Sender.
 *
 * Sends messages to channels via MCP server tools.
 * Supports template-based message formatting.
 */

import type { OutboundMessageRequest, OutboundMessageResult } from "./types";
import type { McpClientManager } from "../client/manager";
import type { McpToolResult } from "../client/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Map of channel types to their send-message tool names. */
export interface ChannelToolMapping {
  /** MCP tool name used for sending messages on this channel type. */
  sendToolName: string;
  /** Argument mapping: which parameter receives the channel ID. */
  channelArg: string;
  /** Argument mapping: which parameter receives the message text. */
  textArg: string;
}

export const DEFAULT_CHANNEL_TOOL_MAPPINGS: Record<string, ChannelToolMapping> = {
  slack: { sendToolName: "slack_send_message", channelArg: "channel", textArg: "text" },
  discord: { sendToolName: "discord_send_message", channelArg: "channel_id", textArg: "content" },
  email: { sendToolName: "gmail_create_draft", channelArg: "to", textArg: "body" },
};

// ---------------------------------------------------------------------------
// Template formatting
// ---------------------------------------------------------------------------

/** Format a message with simple {{var}} template substitution. */
export function formatTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => vars[key] ?? `{{${key}}}`);
}

// ---------------------------------------------------------------------------
// OutboundChannelSender
// ---------------------------------------------------------------------------

export class OutboundChannelSender {
  private readonly _clientManager: McpClientManager;
  private readonly _toolMappings: Record<string, ChannelToolMapping>;

  constructor(
    clientManager: McpClientManager,
    toolMappings: Record<string, ChannelToolMapping> = DEFAULT_CHANNEL_TOOL_MAPPINGS,
  ) {
    this._clientManager = clientManager;
    this._toolMappings = toolMappings;
  }

  /**
   * Send a message to a channel.
   * Resolves the channel source (serverName:channelId) to determine
   * which MCP server and tool to use.
   */
  async send(request: OutboundMessageRequest): Promise<OutboundMessageResult> {
    const colonIdx = request.channelSource.indexOf(":");
    if (colonIdx < 0) {
      return {
        success: false,
        error: `Invalid channel source "${request.channelSource}" — expected "serverName:channelId"`,
      };
    }

    const serverName = request.channelSource.slice(0, colonIdx);
    const channelId = request.channelSource.slice(colonIdx + 1);

    // Resolve text: apply template if provided
    let text = request.text;
    if (request.template && request.templateVars) {
      text = formatTemplate(request.template, request.templateVars);
    }

    // Find tool mapping by trying to detect channel type from server tools
    const mapping = await this._resolveToolMapping(serverName);
    if (!mapping) {
      return {
        success: false,
        error: `No send-message tool mapping found for server "${serverName}"`,
      };
    }

    try {
      const args: Record<string, unknown> = {
        [mapping.channelArg]: channelId,
        [mapping.textArg]: text,
      };
      const result: McpToolResult = await this._clientManager.callTool(
        serverName,
        mapping.sendToolName,
        args,
      );
      return {
        success: result.success,
        messageId: result.content[0]?.text,
        error: result.error,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }

  private async _resolveToolMapping(serverName: string): Promise<ChannelToolMapping | undefined> {
    try {
      const tools = await this._clientManager.listTools(serverName);
      const toolNames = tools.map((t) => t.name);

      for (const [_type, mapping] of Object.entries(this._toolMappings)) {
        if (toolNames.includes(mapping.sendToolName)) {
          return mapping;
        }
      }
    } catch {
      // Server not connected or tools unavailable
    }
    return undefined;
  }
}
