/**
 * GAP-MCPC-001/002/003: MCP Channel types.
 *
 * Defines types for messaging channels backed by MCP servers.
 * Channels enable inbound/outbound messaging and breakpoint approval
 * routing through external platforms (Slack, Discord, email, etc.).
 */

// ---------------------------------------------------------------------------
// Channel configuration
// ---------------------------------------------------------------------------

/** Channel capability declaration from an MCP server. */
export interface ChannelCapability {
  /** Whether the server supports channel notifications. */
  inbound: boolean;
  /** Whether the server supports outbound messaging tools. */
  outbound: boolean;
  /** Whether the server supports permission relay. */
  permissionRelay: boolean;
  /** Human-readable channel type (slack, discord, email, etc.). */
  channelType?: string;
}

/** Configuration for a channel binding. */
export interface ChannelConfig {
  /** MCP server name (matches McpServerConfig.name). */
  serverName: string;
  /** Display name shown in notifications. */
  displayName: string;
  /** Channel identifier (e.g. Slack channel ID). */
  channelId: string;
  /** Channel type for routing. */
  channelType: string;
  /** Whether the channel is currently enabled. */
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Inbound messages
// ---------------------------------------------------------------------------

/** A message received from a channel. */
export interface ChannelMessage {
  /** Unique message identifier. */
  messageId: string;
  /** Channel source identifier (serverName:channelId). */
  source: string;
  /** Sender identifier (platform-specific). */
  sender: string;
  /** Message content. */
  content: string;
  /** ISO timestamp of when the message was received. */
  receivedAt: string;
  /** Optional metadata from the channel platform. */
  metadata?: Record<string, unknown>;
}

/** Binding of a channel to a specific run. */
export interface ChannelBinding {
  /** Channel source (serverName:channelId). */
  channelSource: string;
  /** Run ID this channel is bound to. */
  runId: string;
  /** ISO timestamp of when the binding was created. */
  boundAt: string;
}

// ---------------------------------------------------------------------------
// Outbound messages
// ---------------------------------------------------------------------------

/** Request to send an outbound message through a channel. */
export interface OutboundMessageRequest {
  /** Target channel source (serverName:channelId). */
  channelSource: string;
  /** Message text. */
  text: string;
  /** Optional template name for formatting. */
  template?: string;
  /** Template variables for substitution. */
  templateVars?: Record<string, string>;
}

/** Result of sending an outbound message. */
export interface OutboundMessageResult {
  success: boolean;
  /** Platform-specific message ID if available. */
  messageId?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Permission relay (breakpoint approval via channels)
// ---------------------------------------------------------------------------

/** A breakpoint approval request sent to a channel. */
export interface ChannelApprovalRequest {
  /** Unique request identifier. */
  requestId: string;
  /** Breakpoint ID being approved. */
  breakpointId: string;
  /** Run ID. */
  runId: string;
  /** Effect ID. */
  effectId: string;
  /** Human-readable description of the breakpoint. */
  description: string;
  /** Options available (e.g. ["approve", "reject"]). */
  options: string[];
  /** ISO timestamp of when the request was created. */
  createdAt: string;
  /** Timeout in ms for the channel response. */
  timeoutMs: number;
}

/** Response to a breakpoint approval request from a channel. */
export interface ChannelApprovalResponse {
  /** Request ID being responded to. */
  requestId: string;
  /** Whether the breakpoint was approved. */
  approved: boolean;
  /** Optional feedback text. */
  feedback?: string;
  /** Who responded (platform-specific identifier). */
  respondedBy: string;
  /** Which channel the response came from. */
  channelSource: string;
  /** ISO timestamp of the response. */
  respondedAt: string;
}

/**
 * An approval claim. Multiple resolvers race; the first to claim() wins.
 */
export interface ApprovalClaim {
  /** Whether this claim was the winning one. */
  claimed: boolean;
  /** Source of the claim (e.g. "channel:slack:general", "local:terminal"). */
  source: string;
  /** The response if this claim won. */
  response?: ChannelApprovalResponse;
}

// ---------------------------------------------------------------------------
// Allowlist
// ---------------------------------------------------------------------------

/** Persisted channel allowlist. */
export interface ChannelAllowlistFile {
  schemaVersion: string;
  channels: ChannelConfig[];
}

export const CHANNEL_ALLOWLIST_SCHEMA_VERSION = "2026.01.channel-allowlist-v1";

// ---------------------------------------------------------------------------
// Approval security config
// ---------------------------------------------------------------------------

/** Per-tag or per-level security constraints for channel approvals. */
export interface ChannelApprovalSecurityConfig {
  /** Tags that require terminal-only approval (no channel relay). */
  terminalOnlyTags: string[];
  /** Whether channel approval is enabled at all. */
  enabled: boolean;
  /** Default timeout for channel approval requests (ms). */
  defaultTimeoutMs: number;
}

export const DEFAULT_APPROVAL_SECURITY: ChannelApprovalSecurityConfig = {
  terminalOnlyTags: ["destroy", "auth", "credential"],
  enabled: false,
  defaultTimeoutMs: 300_000, // 5 minutes
};
