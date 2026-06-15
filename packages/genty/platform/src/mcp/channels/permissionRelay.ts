/**
 * GAP-MCPC-003: Channel Permission Relay.
 *
 * Routes breakpoint approval prompts through messaging channels.
 * Uses a racing claim() pattern: channel response races against
 * local interaction, first resolver wins.
 */

import type {
  ChannelApprovalRequest,
  ChannelApprovalResponse,
  ApprovalClaim,
  ChannelApprovalSecurityConfig,
} from "./types";
import { DEFAULT_APPROVAL_SECURITY } from "./types";
import type { OutboundChannelSender } from "./outbound";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PermissionRelayOptions {
  /** Outbound sender for dispatching approval requests to channels. */
  sender: OutboundChannelSender;
  /** Security configuration for channel approvals. */
  security?: ChannelApprovalSecurityConfig;
}

/** Result of a relay attempt. */
export interface RelayResult {
  /** Whether the relay was dispatched (false if blocked by security). */
  relayed: boolean;
  /** Reason if not relayed. */
  reason?: string;
  /** Request ID for tracking. */
  requestId?: string;
}

// ---------------------------------------------------------------------------
// Approval claim racing
// ---------------------------------------------------------------------------

/**
 * Creates a claimable approval slot.
 * Multiple resolvers can race to claim it; only the first wins.
 */
export function createApprovalRace(): {
  claim: (source: string, response?: ChannelApprovalResponse) => ApprovalClaim;
  getWinner: () => ApprovalClaim | undefined;
  promise: Promise<ApprovalClaim>;
} {
  let winner: ApprovalClaim | undefined;
  let resolvePromise: ((claim: ApprovalClaim) => void) | undefined;

  const promise = new Promise<ApprovalClaim>((resolve) => {
    resolvePromise = resolve;
  });

  function claim(source: string, response?: ChannelApprovalResponse): ApprovalClaim {
    if (winner) {
      return { claimed: false, source };
    }
    winner = { claimed: true, source, response };
    if (resolvePromise) {
      resolvePromise(winner);
    }
    return winner;
  }

  return {
    claim,
    getWinner: () => winner,
    promise,
  };
}

// ---------------------------------------------------------------------------
// ChannelPermissionRelay
// ---------------------------------------------------------------------------

export class ChannelPermissionRelay {
  private readonly _sender: OutboundChannelSender;
  private readonly _security: ChannelApprovalSecurityConfig;
  private readonly _pendingRequests = new Map<string, ChannelApprovalRequest>();

  constructor(options: PermissionRelayOptions) {
    this._sender = options.sender;
    this._security = options.security ?? DEFAULT_APPROVAL_SECURITY;
  }

  /**
   * Check whether a breakpoint can be relayed through channels.
   * Returns false for terminal-only breakpoints or when relay is disabled.
   */
  canRelay(breakpointId: string, tags?: string[]): boolean {
    if (!this._security.enabled) return false;

    // Check terminal-only tags
    if (tags) {
      for (const tag of tags) {
        if (this._security.terminalOnlyTags.includes(tag)) {
          return false;
        }
      }
    }

    // Check breakpoint ID prefixes for terminal-only categories
    for (const restrictedTag of this._security.terminalOnlyTags) {
      if (breakpointId.startsWith(`${restrictedTag}.`)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Relay a breakpoint approval request to all active channels.
   * Returns relay result. Does NOT wait for responses — use handleResponse()
   * to process incoming channel approvals.
   */
  async relay(
    request: ChannelApprovalRequest,
    channelSources: string[],
    tags?: string[],
  ): Promise<RelayResult> {
    if (!this.canRelay(request.breakpointId, tags)) {
      return {
        relayed: false,
        reason: `Breakpoint "${request.breakpointId}" is restricted to terminal-only approval`,
      };
    }

    if (channelSources.length === 0) {
      return { relayed: false, reason: "No active channels to relay to" };
    }

    this._pendingRequests.set(request.requestId, request);

    // Send to all channels
    const template = `Breakpoint approval needed:\n**{{description}}**\nRun: {{runId}}\nOptions: {{options}}\n\nReply to approve or reject.`;
    const templateVars: Record<string, string> = {
      description: request.description,
      runId: request.runId,
      options: request.options.join(", "),
    };
    // formatTemplate is applied by OutboundChannelSender when both template and templateVars are present.
    // text is set as fallback in case template rendering fails.
    const fallbackText = `Approval needed: ${request.description} (${request.options.join(", ")})`;

    await Promise.allSettled(
      channelSources.map((source) =>
        this._sender.send({
          channelSource: source,
          text: fallbackText,
          template,
          templateVars,
        }),
      ),
    );

    return { relayed: true, requestId: request.requestId };
  }

  /**
   * Handle a response from a channel.
   * Returns the matched request if it was still pending (not expired).
   */
  handleResponse(response: ChannelApprovalResponse): ChannelApprovalRequest | undefined {
    const request = this._pendingRequests.get(response.requestId);
    if (!request) return undefined;

    // Check if the request has expired
    const elapsed = Date.now() - new Date(request.createdAt).getTime();
    if (elapsed > request.timeoutMs) {
      this._pendingRequests.delete(response.requestId);
      return undefined;
    }

    this._pendingRequests.delete(response.requestId);
    return request;
  }

  /** Get a pending request by ID (returns undefined if expired). */
  getPendingRequest(requestId: string): ChannelApprovalRequest | undefined {
    const request = this._pendingRequests.get(requestId);
    if (!request) return undefined;
    const elapsed = Date.now() - new Date(request.createdAt).getTime();
    if (elapsed > request.timeoutMs) {
      this._pendingRequests.delete(requestId);
      return undefined;
    }
    return request;
  }

  /** Get all pending (non-expired) requests. */
  getPendingRequests(): ChannelApprovalRequest[] {
    const now = Date.now();
    const results: ChannelApprovalRequest[] = [];
    for (const [id, request] of this._pendingRequests) {
      const elapsed = now - new Date(request.createdAt).getTime();
      if (elapsed > request.timeoutMs) {
        this._pendingRequests.delete(id);
      } else {
        results.push(request);
      }
    }
    return results;
  }

  /** Get the security configuration. */
  get security(): ChannelApprovalSecurityConfig {
    return this._security;
  }
}
