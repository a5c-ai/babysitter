/**
 * Milestone E — PRODUCTION authorization store + ALLOW-path wiring (§5 / AC-9 / AC-49).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS (the ALLOW-path production gap).
 *
 * The Milestone-D gates (`loadPolicyEnforcementGate` / GATE 3) accept an
 * `AuthorizationResolver` so that, when a policy is satisfied, an issued
 * `CommandAuthorization` is resolvable at execution time and a legitimately-authorized
 * covered action is ALLOWED. But every production caller of `resolveRunPolicyGates` /
 * `withPolicyGate` / the spawn path passed NO resolver (the default `() => undefined`), so
 * the wired gates could only ever DENY — the ALLOW path was never active outside tests.
 *
 * This module is the production seam the orchestrator uses to close that:
 *   1. `createAuthorizationStore()` — a run-level store the orchestrator populates when it
 *      collects evidence from the run's TRUSTED artifacts (signed breakpoint answers
 *      enforced in Milestone C; model attestations from the sidecar / in-process producers
 *      in Milestone C), evaluates the policy via the engine, and issues via
 *      `issueFromDecision`. The issued `CommandAuthorization` is inserted keyed by the exact
 *      executing tool-call id + argsHash.
 *   2. `store.resolver` — an `AuthorizationResolver` the gate calls. It returns the issued
 *      authorization ONLY for the exact `{ toolCallId }` it was inserted under; the gate then
 *      re-verifies the full envelope (signature, issuer trust, TOCTOU hashes, epoch floor,
 *      per-step evidence) via `verifyCommandAuthorization`, so the store is NOT trusted — it
 *      is a lookup keyed by the binding the authorization already commits to.
 *
 * FAIL CLOSED. The store never fabricates an authorization: `insertFromDecision` inserts
 * ONLY when `issueFromDecision` actually issued (a satisfied, verified policy grant). A
 * lookup for a tool call with no issued authorization returns `undefined` ⇒ the gate denies
 * (unchanged Milestone-D posture). An expired authorization is not returned. No fallbacks:
 * any thrown exception during insertion means no authorization is stored (the action denies).
 */
import type { IdentityKeyPair, SignedEnvelope } from '@a5c-ai/trust-core';
import { issueFromDecision } from './authorization-issuer.js';
import type { CommandAuthorizationPayload } from './verify-envelope-trusted.js';
import type { TrustStore } from './verify-envelope-trusted.js';
import type { PolicyDecision, EvaluationContext } from './policy-evaluator.js';

/**
 * The resolver context every gate seam passes (superset of GATE-1 / session / MCP fields).
 * Mirrors `AuthorizationResolver`'s context in policy-enforcement-wiring.
 */
export interface AuthorizationResolveContext {
  toolName: string;
  toolCallId: string | undefined;
  sessionId: string | undefined;
  runId: string | undefined;
}

export type StoreAuthorizationResolver = (
  context: AuthorizationResolveContext,
) => SignedEnvelope<CommandAuthorizationPayload> | undefined;

export interface InsertFromDecisionRequest {
  /** The evaluator's decision — an authorization is issued+stored ONLY when granted. */
  decision: PolicyDecision;
  /** The exact evaluation context the decision resolved against (binds the action). */
  context: EvaluationContext;
  issuerKeyPair: IdentityKeyPair;
  store: TrustStore;
  /** sha256 of the integrity-verified policy doc that granted this (AC-8/AC-42). */
  policyDocHash: string;
  authorizationTtlSeconds: number;
  runId?: string;
  sessionId?: string;
}

export interface InsertResult {
  inserted: boolean;
  reason?: string;
  authorization?: SignedEnvelope<CommandAuthorizationPayload>;
}

export interface AuthorizationStore {
  /**
   * Evaluate-and-store: issue a `CommandAuthorization` from a GRANTED decision (via
   * `issueFromDecision`) and index it by the executing tool-call id. Returns `inserted:false`
   * when the policy did not grant / nothing was issued (fail closed — nothing stored).
   */
  insertFromDecision(req: InsertFromDecisionRequest): InsertResult;
  /**
   * Directly stash a pre-issued authorization keyed by its bound `toolCallId` (for callers
   * that issued elsewhere). Ignored (returns false) if the envelope has no toolCallId.
   */
  put(authorization: SignedEnvelope<CommandAuthorizationPayload>): boolean;
  /** The `AuthorizationResolver` the gates call; keyed by exact executing tool-call id. */
  resolver: StoreAuthorizationResolver;
  /** Number of live (non-expired) authorizations currently held (for audit/tests). */
  size(): number;
  /** Drop every stored authorization (end-of-run cleanup). */
  clear(): void;
}

/** True when an authorization's signed `expiresAt` is still in the future at `now`. */
function notExpired(auth: SignedEnvelope<CommandAuthorizationPayload>, now: number): boolean {
  const expiresAt = auth?.payload?.expiresAt;
  if (typeof expiresAt !== 'string') return false;
  const t = new Date(expiresAt).getTime();
  return Number.isFinite(t) && now < t;
}

/**
 * Create a run-level authorization store. The gate resolver returns a stored authorization
 * ONLY for the exact tool-call id it was inserted under and ONLY while it is unexpired; the
 * gate then re-verifies the full envelope, so the store confers no trust of its own.
 */
export function createAuthorizationStore(): AuthorizationStore {
  // toolCallId → issued authorization. One authorization per executing tool-call id; a later
  // insert for the same id replaces the earlier (the newest grant for that call wins).
  const byToolCallId = new Map<string, SignedEnvelope<CommandAuthorizationPayload>>();

  const put = (authorization: SignedEnvelope<CommandAuthorizationPayload>): boolean => {
    const toolCallId = authorization?.payload?.toolCallId;
    if (typeof toolCallId !== 'string' || toolCallId.length === 0) return false;
    byToolCallId.set(toolCallId, authorization);
    return true;
  };

  const insertFromDecision = (req: InsertFromDecisionRequest): InsertResult => {
    try {
      const issue = issueFromDecision({
        decision: req.decision,
        context: req.context,
        issuerKeyPair: req.issuerKeyPair,
        store: req.store,
        policyDocHash: req.policyDocHash,
        authorizationTtlSeconds: req.authorizationTtlSeconds,
        runId: req.runId,
        sessionId: req.sessionId,
      });
      if (!issue.issued || !issue.authorization) {
        return { inserted: false, reason: issue.reason ?? 'no authorization issued' };
      }
      const ok = put(issue.authorization);
      if (!ok) return { inserted: false, reason: 'issued authorization has no toolCallId' };
      return { inserted: true, authorization: issue.authorization };
    } catch (err) {
      return { inserted: false, reason: `exception during insert: ${(err as Error)?.message ?? String(err)}` };
    }
  };

  const resolver: StoreAuthorizationResolver = (context) => {
    const toolCallId = context?.toolCallId;
    if (typeof toolCallId !== 'string' || toolCallId.length === 0) return undefined;
    const auth = byToolCallId.get(toolCallId);
    if (!auth) return undefined;
    // Never return an expired authorization (the gate would deny it anyway; this keeps the
    // store from handing back stale envelopes). The gate re-checks expiry too.
    if (!notExpired(auth, Date.now())) {
      byToolCallId.delete(toolCallId);
      return undefined;
    }
    return auth;
  };

  const size = (): number => {
    const now = Date.now();
    let n = 0;
    for (const auth of byToolCallId.values()) if (notExpired(auth, now)) n += 1;
    return n;
  };

  const clear = (): void => byToolCallId.clear();

  return { insertFromDecision, put, resolver, size, clear };
}
