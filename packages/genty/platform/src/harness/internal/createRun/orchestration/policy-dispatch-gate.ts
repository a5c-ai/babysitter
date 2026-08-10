/**
 * Milestone D — genty dispatcher / session enforcement seam (§9.4 / AC-23b / AC-49 /
 * AC-34a).
 *
 * The genty MCP dispatcher seam (effects.ts `dispatcher.dispatch`) and the genty
 * session tool-execution point (`session.ts` `definition.execute`) verify a
 * CommandAuthorization BEFORE execution, using the in-process model attestation
 * carried on `ToolExecutionContext`. This is a LOAD-BEARING, un-bypassable blocking
 * gate for EVERY covered action: a covered action WITHOUT a valid authorization is
 * denied before execution.
 *
 * The authorization is bound to the exact toolCallId (AC-34a) and the args about to
 * run (argsHash recomputed here, AC-32). An MCP tool is not command-bearing, so its
 * `commandHash` is the empty-argv sentinel supplied by the caller.
 *
 * OVERRIDING RULE: fail closed. Any verification / parse / binding error, or any
 * thrown exception, is `{ allowed: false }`. No fallbacks.
 */
import {
  verifyCommandAuthorization,
  argsHash as computeArgsHash,
  type CommandAuthorizationPayload,
  type TrustRoot,
} from '@a5c-ai/policy-adapter';
import type { SignedEnvelope } from '@a5c-ai/genty-core/trust';

export interface DispatchGateContext {
  issuerRoots: TrustRoot[];
  policyDocHash: string;
  currentConfigEpoch: number;
  minEpochFloor: number;
  now: number;
  toolName: string;
  toolCallId: string;
  /** Empty-argv sentinel for non-command-bearing MCP tools (AC-10 step 4). */
  commandHash: string;
  /** The exact args about to run — argsHash recomputed at this seam (TOCTOU, AC-32). */
  args: unknown;
  credentialScope: string;
  /** Coverage predicate: is this dispatch policy-covered? */
  isCovered: () => boolean;
  /** Resolve the CommandAuthorization bound to this dispatch (or none). */
  resolveAuthorization: () => SignedEnvelope<CommandAuthorizationPayload> | undefined;
}

export interface DispatchGateResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Verify authorization for a genty MCP dispatch / session tool-execution (AC-23b).
 * An UNCOVERED dispatch is allowed (coverage/default-allow is decided upstream); a
 * COVERED dispatch REQUIRES a valid CommandAuthorization bound to this exact
 * toolCallId + argsHash + credentialScope, else it is denied before execution.
 */
export function verifyDispatchAuthorization(ctx: DispatchGateContext): DispatchGateResult {
  try {
    if (!ctx || typeof ctx !== 'object') {
      return { allowed: false, reason: 'missing dispatch gate context' };
    }
    if (typeof ctx.isCovered !== 'function' || typeof ctx.resolveAuthorization !== 'function') {
      return { allowed: false, reason: 'missing coverage/authorization resolvers' };
    }

    const covered = ctx.isCovered() === true;
    if (!covered) {
      // Uncovered dispatch: enforcement is decided by the upstream coverage/default
      // logic; the seam itself does not block an uncovered action.
      return { allowed: true };
    }

    const authorization = ctx.resolveAuthorization();
    if (!authorization) {
      return { allowed: false, reason: 'covered dispatch has no CommandAuthorization — deny' };
    }

    const argsHash = computeArgsHash(ctx.args);

    const verification = verifyCommandAuthorization(authorization, {
      now: ctx.now,
      toolName: ctx.toolName,
      toolCallId: ctx.toolCallId,
      commandHash: ctx.commandHash,
      argsHash,
      credentialScope: ctx.credentialScope,
      policyDocHash: ctx.policyDocHash,
      currentConfigEpoch: ctx.currentConfigEpoch,
      minEpochFloor: ctx.minEpochFloor,
      issuerRoots: ctx.issuerRoots,
    });

    if (!verification.valid) {
      return { allowed: false, reason: `authorization verification failed: ${verification.reason}` };
    }
    return { allowed: true };
  } catch (err) {
    return {
      allowed: false,
      reason: `exception during genty-seam verification: ${(err as Error)?.message ?? String(err)}`,
    };
  }
}
