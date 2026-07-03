/**
 * Milestone D — GATE 1: ToolDispatcher.beforeToolUse policy verifier.
 *
 * Implements §9.1 / AC-23 / AC-49 / AC-10 / AC-53. GATE 1 is the LOAD-BEARING,
 * un-bypassable blocking gate for ALL covered actions (credential-bearing or not).
 *
 * For a COVERED action:
 *   1. The config manifest must be trusted (AC-45) — an untrusted config denies-all.
 *   2. A valid CommandAuthorization is REQUIRED, verified via the shipped
 *      `verifyCommandAuthorization` (Milestone A) against the exact toolName +
 *      toolCallId + commandHash + argsHash + credentialScope + configEpoch about to
 *      execute, RECOMPUTED at this gate from the actual input (TOCTOU / AC-53).
 *   3. Any invalid / missing / expired / mutated-args / wrong-toolCallId /
 *      wrong-configEpoch / below-floor / scope-mismatch → deny short-circuit.
 *
 * For an UNCOVERED action:
 *   - non-command-bearing → pass-through UNLESS a defaultDeny scope matches (AC-23c);
 *   - command-bearing → deny unless commandDefaultAllow (AC-38b);
 *   - an interpreter-payload disguise of a covered program is NEVER default-allow —
 *     `decideCoverage` (below) applies the independent uncovered-command default-deny.
 *
 * OVERRIDING RULE: fail closed. Any verification / parse / binding error, or any
 * thrown exception, is a DENY — never a pass-through. No fallbacks.
 */
import {
  verifyCommandAuthorization,
  argsHash as computeArgsHash,
  commandHash as computeCommandHash,
  matchArgv,
  type ArgvMatchScope,
  type CommandAuthorizationPayload,
  type TrustRoot,
} from '@a5c-ai/policy-adapter';
import type { SignedEnvelope } from '@a5c-ai/genty-core/trust';

import type { ToolCallContext, ToolDescriptor } from './types.js';
import type { ToolHookBridge, ToolHookResult } from './hooks.js';

/**
 * A coverage decision for a command line against the configured covered scopes.
 * `deny: true` means the gate MUST NOT allow the call (covered-but-unauthorized, an
 * interpreter/wrapper disguise of a covered program, or an uncovered command-bearing
 * invocation with commandDefaultAllow=false).
 */
export interface CoverageDecision {
  deny: boolean;
  covered: boolean;
  reason?: string;
}

/**
 * Decide coverage + default-deny for a command line against covered scopes (AC-23,
 * AC-38a/AC-38c). This helper OWNS `commandDefaultAllow`: a `matchArgv` result of
 * `{ deny: false }` is NOT read as ALLOW when the command touches a covered scope —
 * the independent uncovered-command default-deny is applied here. An interpreter/
 * wrapper disguise that names a covered program is `matchArgv` `deny:true` → deny.
 *
 * A genuinely UNCOVERED, unrelated command (no covered program named) is passed
 * through ONLY when the scope opts in via `commandDefaultAllow`.
 */
export function decideCoverage(
  command: string,
  scopes: ArgvMatchScope[],
): CoverageDecision {
  try {
    if (typeof command !== 'string' || command.trim().length === 0) {
      return { deny: true, covered: false, reason: 'empty/malformed command' };
    }
    if (!Array.isArray(scopes) || scopes.length === 0) {
      // No covered scopes configured: this helper cannot vouch for the command.
      return { deny: false, covered: false, reason: 'no covered scopes' };
    }

    let anyDefaultAllow = false;
    for (const scope of scopes) {
      const result = matchArgv(command, scope);
      // A covered match: requires an authorization at the gate → NOT a pass-through.
      if (result.covered) {
        return { deny: false, covered: true, reason: 'covered — authorization required' };
      }
      // The matcher denied (unresolvable covered-program disguise, or uncovered
      // command-bearing under default-deny) → deny.
      if (result.deny) {
        return { deny: true, covered: false, reason: result.reason ?? 'matchArgv deny' };
      }
      // matchArgv returned deny:false (uncovered) — only honored when the scope opts in.
      if (scope.commandDefaultAllow === true) {
        anyDefaultAllow = true;
      }
    }
    // Every scope non-matched without deny. Pass through only if at least one scope
    // explicitly opted into default-allow; otherwise default-deny (fail closed).
    if (anyDefaultAllow) {
      return { deny: false, covered: false, reason: 'uncovered, default-allow opted in' };
    }
    return { deny: true, covered: false, reason: 'uncovered command-bearing, default-deny' };
  } catch (err) {
    return { deny: true, covered: false, reason: `exception during coverage decision: ${(err as Error)?.message ?? String(err)}` };
  }
}

/** Options for the GATE-1 policy verifier bridge. */
export interface PolicyVerifierHookBridgeOptions {
  /** Issuer trust roots (kind `engine`) that may sign a CommandAuthorization. */
  issuerRoots: TrustRoot[];
  /** sha256 of the integrity-verified policy document governing this action. */
  policyDocHash: string;
  /** The config epoch of the currently-honored signed manifest (AC-46). */
  currentConfigEpoch: number;
  /** The off-workspace pinned minimum-epoch floor (AC-47). */
  minEpochFloor: number;
  /**
   * AC-42 carry-forward — the number of REQUIRED steps of the chain the covered
   * action must satisfy. When supplied, the gate enforces that the authorization
   * bound one evidence per required step (step-coverage). The production wiring seam
   * derives this from the matched chain.
   */
  requiredStepCount?: number;
  /**
   * Whether the on-disk `.policy` config manifest verified (AC-45). Defaults to
   * `true`; when `false` (tampered config), the gate denies-all — no authorization
   * is honored under untrusted config.
   */
  configTrusted?: boolean;
  /**
   * Coverage decision for the executing tool call: is this action policy-covered?
   * The gate recomputes coverage on the canonicalized argv (AC-23/AC-38); the caller
   * supplies the wired coverage predicate.
   */
  isCovered: (context: ToolCallContext, descriptor: ToolDescriptor) => boolean;
  /** The credential scope for the executing action (from the trusted source, AC-40). */
  credentialScopeFor: (context: ToolCallContext, descriptor: ToolDescriptor) => string;
  /** AC-38b: default-allow for uncovered command-bearing tools (per-env opt-in). */
  commandDefaultAllow: boolean;
  /** AC-23c: credential-scope globs for which an UNCOVERED action is denied. */
  defaultDenyScopes: string[];
  /** Resolve the CommandAuthorization bound to this exact tool call (or none). */
  resolveAuthorization: (
    context: ToolCallContext,
    descriptor: ToolDescriptor,
  ) => SignedEnvelope<CommandAuthorizationPayload> | undefined;
}

const denyResult = (reason: string): ToolHookResult => ({ decision: 'deny', reason });

/**
 * Extract the command STRING from a tool's input for command-bearing tools. Covers
 * the common `{ command: "..." }` shape used by Bash-like tools. Returns an empty
 * string when there is no command string (non-command-bearing tools).
 */
function commandStringOf(input: unknown): string {
  if (input && typeof input === 'object') {
    const cmd = (input as Record<string, unknown>).command;
    if (typeof cmd === 'string') return cmd;
  }
  return '';
}

/**
 * Match a credential scope glob (`aws:prod:*`) against a concrete scope
 * (`aws:prod:secrets`). Supports `*` as a wildcard segment matcher.
 */
function scopeGlobMatches(glob: string, scope: string): boolean {
  if (glob === scope) return true;
  if (!glob.includes('*')) return false;
  const escaped = glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  try {
    return new RegExp(`^${escaped}$`).test(scope);
  } catch {
    return false;
  }
}

/**
 * GATE 1 — a `ToolHookBridge` that consults the policy layer in `beforeToolUse` and
 * returns `{ decision: 'deny', reason }` for a covered call without a valid
 * CommandAuthorization (or any verification failure). `afterToolUse` is a no-op —
 * GATE 1 is a pre-execution gate.
 */
export class PolicyVerifierHookBridge implements ToolHookBridge {
  private readonly opts: PolicyVerifierHookBridgeOptions;

  constructor(opts: PolicyVerifierHookBridgeOptions) {
    this.opts = opts;
  }

  async beforeToolUse(
    context: ToolCallContext,
    descriptor: ToolDescriptor,
  ): Promise<ToolHookResult | undefined> {
    try {
      const o = this.opts;

      // (AC-45) An untrusted config manifest denies-all — no authorization honored.
      if (o.configTrusted === false) {
        return denyResult('config manifest verification failed — deny-all');
      }

      const covered = o.isCovered(context, descriptor) === true;
      const credentialScope = o.credentialScopeFor(context, descriptor) ?? '';

      // ── UNCOVERED action (AC-23 / AC-38b / AC-23c). ──────────────────────────
      if (!covered) {
        // AC-23c: an uncovered action whose scope matches a defaultDeny glob → deny.
        if (
          credentialScope.length > 0 &&
          o.defaultDenyScopes.some((glob) => scopeGlobMatches(glob, credentialScope))
        ) {
          return denyResult(`uncovered action in default-deny scope: ${credentialScope}`);
        }
        // Command-bearing uncovered actions default-deny unless commandDefaultAllow.
        const commandString = commandStringOf(context.input);
        if (commandString.length > 0) {
          if (o.commandDefaultAllow !== true) {
            return denyResult('uncovered command-bearing action, default-deny');
          }
          // Opted in: pass through.
          return undefined;
        }
        // Non-command-bearing uncovered action: pass through (default-allow).
        return undefined;
      }

      // ── COVERED action — a valid authorization is REQUIRED (AC-23 / AC-49). ──
      const authorization = o.resolveAuthorization(context, descriptor);
      if (!authorization) {
        return denyResult('covered action has no CommandAuthorization — deny');
      }

      // Recompute commandHash / argsHash at THIS gate from the actual input (never
      // trust caller-supplied hashes; TOCTOU + AC-53 mutated-input fail-closed).
      const commandString = commandStringOf(context.input);
      const commandHash = computeCommandHash(commandString);
      const argsHash = computeArgsHash(context.input);
      // The executing tool-call id (AC-34a). It MUST be the ACTUAL id of the tool call
      // about to run (threaded onto `context.toolCallId`). We NEVER fall back to the
      // authorization's OWN toolCallId — that would make the gate's binding check an
      // X===X tautology and let a sibling call's authorization verify. Absent id for a
      // covered action → DENY.
      const toolCallId =
        typeof context.toolCallId === 'string' && context.toolCallId.length > 0
          ? context.toolCallId
          : undefined;
      if (toolCallId === undefined) {
        return denyResult(
          'covered action has no executing toolCallId — cannot bind authorization (deny)',
        );
      }

      const verification = verifyCommandAuthorization(authorization, {
        now: Date.now(),
        toolName: context.toolName,
        toolCallId,
        commandHash,
        argsHash,
        credentialScope,
        policyDocHash: o.policyDocHash,
        currentConfigEpoch: o.currentConfigEpoch,
        minEpochFloor: o.minEpochFloor,
        issuerRoots: o.issuerRoots,
        ...(typeof o.requiredStepCount === 'number' ? { requiredStepCount: o.requiredStepCount } : {}),
      });

      if (!verification.valid) {
        return denyResult(`authorization verification failed: ${verification.reason}`);
      }

      // Verified: allow the covered action to proceed.
      return { decision: 'allow' };
    } catch (err) {
      // Fail closed — any exception is a denial, never a pass.
      return denyResult(`exception during GATE 1 verification: ${(err as Error)?.message ?? String(err)}`);
    }
  }

  async afterToolUse(): Promise<ToolHookResult | undefined> {
    return undefined;
  }
}
