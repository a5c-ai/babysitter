/**
 * Milestone D — GATE 2: runtime preToolUse policy handler (§9.2 / AC-23b / AC-49 /
 * AC-44).
 *
 * The runtime preToolUse BLOCKING dispatch (spawn-runtime-hooks.ts) gates spawned
 * harnesses. This factory produces a `PreToolUseHook` that returns
 * `{ decision: 'deny', reason }` for a covered call that lacks a valid
 * CommandAuthorization. The proof context (the exact toolCallId / argsHash /
 * commandHash / credentialScope about to execute) is recomputed HERE from the
 * preToolUse payload and bound to the authorization (AC-23b).
 *
 * Enforcement note (AC-49 / AC-44): only `mode === 'blocking'` adapters convert a
 * deny into a swallowed tool event (spawn-runtime-hooks.ts). For non-blocking
 * (advisory) adapters GATE 1 / GATE 3 are the enforcing gates — GATE 2 is
 * defense-in-depth, never the sole line. This handler always RETURNS the correct
 * decision; whether it hard-enforces is the runtime's mode decision.
 *
 * OVERRIDING RULE: fail closed. Any verification / parse / binding error, or any
 * thrown exception, is a `{ decision: 'deny' }`. No fallbacks.
 */
import {
  verifyCommandAuthorization,
  argsHash as computeArgsHash,
  commandHash as computeCommandHash,
  type CommandAuthorizationPayload,
  type TrustRoot,
} from '@a5c-ai/policy-adapter';
import type { SignedEnvelope } from '@a5c-ai/genty-core/trust';

import type { HookContext, HookDecision, PreToolUseHook } from './runtime-hooks.js';

/**
 * The preToolUse payload shape the runtime dispatches (spawn-runtime-hooks.ts),
 * EXTENDED by Milestone D to carry the proof context (AC-23b).
 */
export interface PolicyPreToolUsePayload {
  sessionId?: string;
  toolCallId: string;
  toolName: string;
  input: unknown;
}

export interface CreatePolicyPreToolUseHookOptions {
  /** Issuer trust roots (kind `engine`) that may sign a CommandAuthorization. */
  issuerRoots: TrustRoot[];
  /** sha256 of the integrity-verified policy document governing this action. */
  policyDocHash: string;
  /** The config epoch of the currently-honored signed manifest (AC-46). */
  currentConfigEpoch: number;
  /** The off-workspace pinned minimum-epoch floor (AC-47). */
  minEpochFloor: number;
  /** Coverage predicate: is this action policy-covered? */
  isCovered: (payload: PolicyPreToolUsePayload) => boolean;
  /** The credential scope for the executing action (from the trusted source, AC-40). */
  credentialScopeFor: (payload: PolicyPreToolUsePayload) => string;
  /** Resolve the CommandAuthorization bound to this exact tool call (or none). */
  resolveAuthorization: (
    payload: PolicyPreToolUsePayload,
  ) => SignedEnvelope<CommandAuthorizationPayload> | undefined;
}

const deny = (reason: string): HookDecision => ({ decision: 'deny', reason });
const allow = (): HookDecision => ({ decision: 'allow' });

/** Extract the command STRING for command-bearing tools (`{ command: "..." }`). */
function commandStringOf(input: unknown): string {
  if (input && typeof input === 'object') {
    const cmd = (input as Record<string, unknown>).command;
    if (typeof cmd === 'string') return cmd;
  }
  return '';
}

/**
 * Build a GATE-2 preToolUse policy handler (AC-23b). For a covered call the handler
 * REQUIRES a valid CommandAuthorization bound to the exact toolCallId / argsHash /
 * commandHash / credentialScope in the payload; otherwise it denies (fail closed).
 */
export function createPolicyPreToolUseHook(
  options: CreatePolicyPreToolUseHookOptions,
): PreToolUseHook<PolicyPreToolUsePayload> {
  return function policyPreToolUse(
    payload: PolicyPreToolUsePayload,
    _context: HookContext,
  ): HookDecision {
    try {
      if (!payload || typeof payload !== 'object') {
        return deny('missing preToolUse payload');
      }

      const covered = options.isCovered(payload) === true;
      if (!covered) {
        // Uncovered actions are handled by GATE 1's coverage/default logic; GATE 2
        // does not re-derive default-allow — it only enforces covered actions.
        return allow();
      }

      const authorization = options.resolveAuthorization(payload);
      if (!authorization) {
        return deny('covered action has no CommandAuthorization — deny');
      }

      const credentialScope = options.credentialScopeFor(payload) ?? '';
      const commandString = commandStringOf(payload.input);
      const commandHash = computeCommandHash(commandString);
      const argsHash = computeArgsHash(payload.input);

      const verification = verifyCommandAuthorization(authorization, {
        now: Date.now(),
        toolName: payload.toolName,
        toolCallId: payload.toolCallId,
        commandHash,
        argsHash,
        credentialScope,
        policyDocHash: options.policyDocHash,
        currentConfigEpoch: options.currentConfigEpoch,
        minEpochFloor: options.minEpochFloor,
        issuerRoots: options.issuerRoots,
      });

      if (!verification.valid) {
        return deny(`authorization verification failed: ${verification.reason}`);
      }
      return allow();
    } catch (err) {
      return deny(`exception during GATE 2 verification: ${(err as Error)?.message ?? String(err)}`);
    }
  };
}
