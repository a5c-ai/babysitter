/**
 * MCP Channels — interactive messaging and approval routing.
 * Moved from @a5c-ai/babysitter-sdk.
 *
 * Status: Integrated with agent-platform MCP orchestration wiring.
 *
 * GAP-MCPC-001/002/003/004
 */

// Types
export type {
  ChannelCapability,
  ChannelConfig,
  ChannelMessage,
  ChannelBinding,
  OutboundMessageRequest,
  OutboundMessageResult,
  ChannelApprovalRequest,
  ChannelApprovalResponse,
  ApprovalClaim,
  ChannelAllowlistFile,
  ChannelApprovalSecurityConfig,
} from "./types";
export {
  CHANNEL_ALLOWLIST_SCHEMA_VERSION,
  DEFAULT_APPROVAL_SECURITY,
} from "./types";

// Allowlist
export {
  getChannelAllowlistPath,
  readChannelAllowlist,
  writeChannelAllowlist,
  upsertChannel,
  removeChannel,
  toggleChannel,
  getEnabledChannels,
} from "./allowlist";

// Inbound queue
export {
  InboundMessageQueue,
  type WakeCallback,
  type InboundQueueOptions,
} from "./inboundQueue";

// Channel manager
export {
  ChannelManager,
  type ChannelManagerOptions,
  type DetectedChannel,
} from "./channelManager";

// Outbound sender
export {
  OutboundChannelSender,
  formatTemplate,
  DEFAULT_CHANNEL_TOOL_MAPPINGS,
  type ChannelToolMapping,
} from "./outbound";

// Permission relay
export {
  ChannelPermissionRelay,
  createApprovalRace,
  type PermissionRelayOptions,
  type RelayResult,
} from "./permissionRelay";
