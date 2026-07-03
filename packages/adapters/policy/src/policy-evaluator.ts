/**
 * Milestone B — Trust-chain evaluator (AC-9, AC-19a, AC-20, AC-41, AC-41a, AC-42) +
 * condition operators (AC-22).
 *
 * Given an action context and a set of SignedEnvelope evidences, the evaluator:
 *   - verifies EVERY signature via the Milestone-A `verifyEnvelopeTrusted` /
 *     `verifyTrustChainTrusted` (trusted-store resolution + fingerprint binding +
 *     kind + signedFields completeness + payloadType + revocation/expiry),
 *   - verifies chain linkage (delegation), evaluates conditions (sugar compiled to the
 *     existing eq/matches operator vocabulary, AC-22),
 *   - produces an auditable PolicyDecision { granted, matchedChainId?, reason,
 *     evidenceUsed }, granting on the FIRST fully-satisfied chain (AC-19a),
 *   - applies deny > grant > default precedence (AC-20), and
 *   - FAILS CLOSED on any verification error / expired key / unknown fingerprint /
 *     condition miss / below-floor epoch / any thrown exception.
 *
 * It REUSES the existing condition operators (`matchCondition` shape) rather than
 * forking a third engine (AC-22).
 */
import type { SignedEnvelope } from '@a5c-ai/genty-core/trust';
import { isPermissionValid } from '@a5c-ai/genty-core/trust';
import {
  verifyEnvelopeTrusted,
  verifyTrustChainTrusted,
  type TrustStore,
  type TrustRoot,
  type EvidenceKind,
  type TrustedChainStep,
} from './verify-envelope-trusted.js';
import type {
  PolicyDocument,
  PolicyActionDoc,
  ChainDoc,
  ChainRequirement,
  TypedStep,
  QuorumRequirement,
  StepConditions,
} from './policy-schema.js';
import { matchArgv, type ArgvMatchScope } from './argv-matcher.js';
import { canonicalizeArgv } from './canonicalize-args.js';

export interface Evidence {
  kind: 'human-approval' | 'model-decision' | 'delegation';
  envelope: SignedEnvelope<Record<string, unknown>>;
}

export interface EvaluationContext {
  now: number;
  toolName: string;
  toolCallId: string;
  canonicalArgv: string[];
  args: unknown;
  argsHash: string;
  credentialScope: string;
  configEpoch: number;
  minEpochFloor: number;
  /**
   * The RAW, untokenized command line for command-bearing tools (AC-38). Anti-evasion
   * matching MUST re-tokenize and recurse through shell `-c` payloads / wrappers on the
   * raw text — a pre-tokenized `canonicalArgv` has already collapsed `sh -c "aws …"` into
   * a shell invocation and lost the inner program. When absent, the matcher derives the
   * raw command from `args.command` (Bash tool input) or, failing that, from
   * `canonicalArgv.join(' ')`.
   */
  rawCommand?: string;
}

export interface PolicyDecision {
  granted: boolean;
  matchedChainId?: string;
  reason: string;
  evidenceUsed: Evidence[];
  /** The action id this decision resolved against, when one matched. */
  actionId?: string;
  /** The number of required steps of the matched chain (for issuer step-coverage). */
  requiredStepCount?: number;
  /** One binding per satisfied requirement (issuer input, AC-42). */
  stepBindings?: { stepIndex: number; requiredKind: string; evidence: Evidence }[];
}

export interface EvaluateInput {
  document: PolicyDocument;
  store: TrustStore;
  evidence: Evidence[];
  context: EvaluationContext;
}

const DENY = (reason: string): PolicyDecision => ({ granted: false, reason, evidenceUsed: [] });

// ── glob helpers ────────────────────────────────────────────────────────────

/** Compile a simple `*`-glob to a full-match RegExp (mirrors dispatch.ts globToRegex). */
function globToRegex(glob: string): RegExp {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function globMatch(glob: string, value: string): boolean {
  return globToRegex(glob).test(value);
}

// ── condition evaluation (AC-22 sugar → base operators) ─────────────────────

/**
 * Evaluate a step's conditions against an evidence payload. Sugar (`modelIdMatches`,
 * `scopeEquals`, `notExpired`, `tagContains`) compiles to the base eq/matches/contains
 * operators. Delegation-only conditions (`requiresDelegation`, `expectedDelegatee`) are
 * handled by the delegation path and ignored here. Returns true iff ALL hold.
 */
function conditionsHold(
  conditions: StepConditions | undefined,
  envelope: SignedEnvelope<Record<string, unknown>>,
): boolean {
  if (!conditions) return true;
  const payload = envelope.payload;

  if (typeof conditions.modelIdMatches === 'string') {
    const modelId = payload.modelId;
    if (typeof modelId !== 'string') return false;
    let re: RegExp;
    try {
      // Anchor as a FULL-STRING match (AC allowlist-widening fix): an unanchored
      // pattern `claude-opus-.*` would also match `gpt-cheap-claude-opus-x`.
      re = new RegExp(`^(?:${conditions.modelIdMatches})$`);
    } catch {
      return false;
    }
    if (!re.test(modelId)) return false;
  }

  if (typeof conditions.scopeEquals === 'string') {
    if (String(payload.scope) !== conditions.scopeEquals) return false;
  }

  if (conditions.notExpired === true) {
    // Reuse isPermissionValid for PermissionEvidence-shaped payloads (AC-31).
    if (!isPermissionValid(envelope as SignedEnvelope<never> as never)) return false;
  }

  if (typeof conditions.tagContains === 'string') {
    const tags = payload.tags;
    if (!Array.isArray(tags) || !tags.includes(conditions.tagContains)) return false;
  }

  return true;
}

// ── identity resolution for quorum distinct-holder (AC-41) ──────────────────

/**
 * The distinct human identity behind an approval — used to count DISTINCT holders for
 * a quorum (AC-41): one human holding two keys must not satisfy a 2-of quorum.
 *
 * SECURITY: the identity MUST be resolved from the trusted store (the trust-root record
 * the signing fingerprint resolves to), NOT the payload's `approvedBy` — `approvedBy` is
 * signed by the human's OWN key and is therefore attacker-chosen. One human holding two
 * keys, each registered under the SAME trusted-store identity (e.g. a stable
 * `identityId`/`label` on the TrustRoot), signing `approvedBy:'alice'` and
 * `approvedBy:'bob'`, would otherwise count as TWO distinct holders and defeat a
 * 2-quorum. We key distinctness on the resolved TrustRoot's `identityId` (falling back
 * to its `label`, then to the fingerprint when the store maps one identity to one root),
 * so two keys owned by one trusted identity count as ONE.
 */
function humanIdentity(evidence: Evidence, store: TrustStore): string {
  const fp = evidence.envelope.publicKeyFingerprint;
  const root = store.trustRoots.find((r) => r && r.fingerprint === fp);
  if (root) {
    if (typeof root.identityId === 'string' && root.identityId.length > 0) return root.identityId;
    if (typeof root.label === 'string' && root.label.length > 0) return `label:${root.label}`;
  }
  // Fail-closed default: the fingerprint itself (store maps one identity → one root).
  return fp;
}

// ── evidence → verified for a step ──────────────────────────────────────────

const KIND_TO_EVIDENCE_KIND: Record<string, EvidenceKind> = {
  'human-approval': 'human-approval',
  'model-decision': 'model-decision',
  delegation: 'delegation',
};

/** A signed tool-call binding entry inside a model-decision attestation (AC-34). */
interface SignedToolCallLike {
  toolCallId?: unknown;
  name?: unknown;
  argsHash?: unknown;
}

/**
 * AC-34a — a model-decision attestation satisfies a step for THIS executing tool call
 * iff its signed `toolCalls[]` contains an entry whose `toolCallId` equals
 * `context.toolCallId` AND whose `argsHash` equals `context.argsHash` (both computed by
 * the shared `canonicalizeArgs` serializer, so the bytes match the attestation
 * producer). An attestation with no matching entry — a different call's id, a mismatched
 * argsHash, or an empty/absent `toolCalls[]` — is NOT a valid binding → deny.
 *
 * Without this, a valid "opus decided" attestation for one call in a turn is replayable
 * onto a DIFFERENT, unapproved sibling call in the same turn (AC-30 replay-within-turn).
 */
function modelDecisionBindsToolCall(
  envelope: SignedEnvelope<Record<string, unknown>>,
  context: EvaluationContext,
): boolean {
  const toolCalls = envelope.payload.toolCalls;
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) return false;
  return toolCalls.some((tc) => {
    const entry = tc as SignedToolCallLike;
    return (
      typeof entry.toolCallId === 'string' &&
      entry.toolCallId === context.toolCallId &&
      typeof entry.argsHash === 'string' &&
      entry.argsHash === context.argsHash
    );
  });
}

/**
 * AC-39 — for a model-decision step that requires proxy attestation (explicitly, or by
 * DESIGN DEFAULT for any credentialScope-touching action), the resolved trust root MUST
 * be an `engine` root marked `producer:'proxy'` (the out-of-agent proxy key). An
 * in-process (agent-held) attestation is correlation-grade only and is rejected → deny.
 */
function attestationIsProxy(
  envelope: SignedEnvelope<Record<string, unknown>>,
  store: TrustStore,
): boolean {
  const root = store.trustRoots.find((r) => r && r.fingerprint === envelope.publicKeyFingerprint);
  return root?.producer === 'proxy';
}

/**
 * True iff this evidence verifies against the trusted store for the required kind
 * (allowedFingerprints from the step) AND its conditions hold. Verification routes
 * through the Milestone-A trusted-store wrapper — the only sanctioned entry.
 *
 * For a model-decision step this ALSO enforces (AC-34a) that the signed `toolCalls[]`
 * binds the executing `context.toolCallId` + `context.argsHash`, and (AC-39) that the
 * attestation comes from a proxy producer when the step requires proxy attestation.
 */
function evidenceSatisfiesStep(
  evidence: Evidence,
  requiredKind: 'human-approval' | 'model-decision' | 'delegation',
  allowedFingerprints: string[] | undefined,
  conditions: StepConditions | undefined,
  store: TrustStore,
  context: EvaluationContext,
  requireProxyAttestation: boolean,
): boolean {
  if (evidence.kind !== requiredKind) return false;
  const trusted = verifyEnvelopeTrusted(
    evidence.envelope,
    KIND_TO_EVIDENCE_KIND[requiredKind],
    store,
    allowedFingerprints && allowedFingerprints.length > 0 ? allowedFingerprints : undefined,
  );
  if (!trusted.valid) return false;

  if (requiredKind === 'model-decision') {
    // AC-34a: the attestation MUST bind this exact executing tool call.
    if (!modelDecisionBindsToolCall(evidence.envelope, context)) return false;
    // AC-39: proxy attestation required (explicit or credential-scope default).
    if (requireProxyAttestation && !attestationIsProxy(evidence.envelope, store)) return false;
  }

  return conditionsHold(conditions, evidence.envelope);
}

// ── requirement satisfaction (typed step, quorum, delegation) ───────────────

interface ReqResult {
  satisfied: boolean;
  /** Evidences consumed by this requirement (for no-double-use tracking, AC-41a). */
  consumed: Evidence[];
}

function satisfyTypedStep(
  step: TypedStep,
  evidence: Evidence[],
  store: TrustStore,
  consumed: Set<Evidence>,
  context: EvaluationContext,
  requireProxyAttestation: boolean,
): ReqResult {
  // Delegation steps requiring an actual delegation relationship take the chain path.
  if (step.kind === 'delegation' && step.conditions?.requiresDelegation === true) {
    return satisfyDelegation(step, evidence, store, consumed);
  }

  for (const ev of evidence) {
    if (consumed.has(ev)) continue;
    if (
      evidenceSatisfiesStep(
        ev,
        step.kind,
        step.trustedIdentities,
        step.conditions,
        store,
        context,
        requireProxyAttestation,
      )
    ) {
      return { satisfied: true, consumed: [ev] };
    }
  }
  return { satisfied: false, consumed: [] };
}

function satisfyQuorum(
  quorum: QuorumRequirement,
  evidence: Evidence[],
  store: TrustStore,
  consumed: Set<Evidence>,
  context: EvaluationContext,
  requireProxyAttestation: boolean,
): ReqResult {
  const contributors: Evidence[] = [];
  const identities = new Set<string>();

  for (const ev of evidence) {
    if (consumed.has(ev)) continue;
    if (ev.kind !== quorum.of) continue;
    if (
      !evidenceSatisfiesStep(
        ev,
        quorum.of,
        quorum.trustedIdentities,
        quorum.conditions,
        store,
        context,
        requireProxyAttestation,
      )
    ) {
      continue;
    }
    // Distinct-holder rule: count DISTINCT identities resolved from the TRUSTED STORE,
    // not distinct keys and not the attacker-signed payload label (AC-41).
    const identity = quorum.of === 'human-approval' ? humanIdentity(ev, store) : ev.envelope.publicKeyFingerprint;
    if (identities.has(identity)) continue; // same holder's second key does not add
    identities.add(identity);
    contributors.push(ev);
    if (identities.size >= quorum.min) break;
  }

  if (identities.size >= quorum.min) {
    return { satisfied: true, consumed: contributors };
  }
  return { satisfied: false, consumed: [] };
}

/**
 * Delegation requirement (carry-forward hardening): build the delegation chain from
 * delegation evidences and verify true linkage via `verifyTrustChainTrusted`; reject an
 * empty/single-link non-delegation chain where a delegation is required; and confirm the
 * chain terminal identity equals `expectedDelegatee`.
 */
function satisfyDelegation(
  step: TypedStep,
  evidence: Evidence[],
  store: TrustStore,
  consumed: Set<Evidence>,
): ReqResult {
  const links = evidence.filter((ev) => ev.kind === 'delegation' && !consumed.has(ev));
  if (links.length === 0) return { satisfied: false, consumed: [] };

  const expectedDelegatee = step.conditions?.expectedDelegatee;
  if (typeof expectedDelegatee !== 'string' || expectedDelegatee.length === 0) {
    return { satisfied: false, consumed: [] };
  }

  // A single independent link with no delegation relationship must NOT satisfy a step
  // that requires an actual delegation (reject empty/single-link non-delegation).
  if (links.length < 2) {
    return { satisfied: false, consumed: [] };
  }

  const chain: TrustedChainStep[] = links.map((ev, i) => ({
    step: `link-${i}`,
    envelope: ev.envelope,
    requiredKind: 'agent',
  }));

  const chainResult = verifyTrustChainTrusted(chain, store);
  if (!chainResult.valid) return { satisfied: false, consumed: [] };

  // Confirm the chain terminal identity equals the expected delegatee (else deny).
  const terminal = links[links.length - 1].envelope.publicKeyFingerprint;
  if (terminal !== expectedDelegatee) return { satisfied: false, consumed: [] };

  return { satisfied: true, consumed: links };
}

function satisfyRequirement(
  req: ChainRequirement,
  evidence: Evidence[],
  store: TrustStore,
  consumed: Set<Evidence>,
  context: EvaluationContext,
  requireProxyAttestation: boolean,
): ReqResult & { requiredKind: string } {
  if ('quorum' in req) {
    const r = satisfyQuorum(req.quorum, evidence, store, consumed, context, requireProxyAttestation);
    return { ...r, requiredKind: req.quorum.of };
  }
  const r = satisfyTypedStep(req.step, evidence, store, consumed, context, requireProxyAttestation);
  return { ...r, requiredKind: req.step.kind };
}

// ── chain evaluation ────────────────────────────────────────────────────────

interface ChainOutcome {
  satisfied: boolean;
  evidenceUsed: Evidence[];
  requiredStepCount: number;
  stepBindings: { stepIndex: number; requiredKind: string; evidence: Evidence }[];
}

/**
 * A chain is satisfied iff EVERY requirement is satisfied (AND). An evidence envelope
 * MUST NOT be counted toward more than one requirement (AC-41a no-double-use), tracked
 * via the `consumed` set. `requiredStepCount` = number of AND-ed requirements, expanded
 * so each quorum contributor is its own binding (AC-41a).
 */
function evaluateChain(
  chain: ChainDoc,
  evidence: Evidence[],
  store: TrustStore,
  context: EvaluationContext,
  requireProxyAttestation: boolean,
): ChainOutcome {
  // Defensive fail-closed guard: a chain with no requirements (or a malformed
  // requirements array) can NEVER be "satisfied" — an empty AND is vacuously true, which
  // would grant with ZERO evidence. Deny (unsatisfied) instead.
  if (!Array.isArray(chain.requirements) || chain.requirements.length === 0) {
    return { satisfied: false, evidenceUsed: [], requiredStepCount: 0, stepBindings: [] };
  }

  const consumed = new Set<Evidence>();
  const evidenceUsed: Evidence[] = [];
  const stepBindings: { stepIndex: number; requiredKind: string; evidence: Evidence }[] = [];
  let stepIndex = 0;

  for (const req of chain.requirements) {
    const result = satisfyRequirement(req, evidence, store, consumed, context, requireProxyAttestation);
    if (!result.satisfied) {
      return { satisfied: false, evidenceUsed: [], requiredStepCount: 0, stepBindings: [] };
    }
    for (const ev of result.consumed) {
      consumed.add(ev);
      evidenceUsed.push(ev);
      stepBindings.push({ stepIndex, requiredKind: result.requiredKind, evidence: ev });
      stepIndex++;
    }
  }

  // A satisfied chain MUST have bound at least one evidence per the guard above; a
  // requiredStepCount of 0 after a "satisfied" pass is a contradiction → treat as
  // unsatisfied (fail closed), so the issuer never issues on an empty evidence set.
  if (stepBindings.length === 0) {
    return { satisfied: false, evidenceUsed: [], requiredStepCount: 0, stepBindings: [] };
  }

  return {
    satisfied: true,
    evidenceUsed,
    requiredStepCount: stepBindings.length,
    stepBindings,
  };
}

// ── action matching ─────────────────────────────────────────────────────────

/**
 * The result of matching an action against a context (AC-38 anti-evasion):
 *   - 'match'    — the action covers this invocation; evaluate its chains.
 *   - 'deny'     — the invocation is a covered-but-unauthorized disguised command
 *                  (unresolvable wrapper for a covered program, AC-38a). No chain can
 *                  authorize it; deny unconditionally.
 *   - 'no-match' — the action does not apply.
 */
type ActionMatchOutcome = 'match' | 'deny' | 'no-match';

/**
 * Derive the RAW command line for argv matching. Prefer the explicit `rawCommand`; else
 * the Bash tool input `{command}`; else re-join the canonical argv (last resort — this
 * cannot recover a lost shell wrapper, but the anti-evasion path is fed the raw command
 * by real gates).
 */
function rawCommandFor(context: EvaluationContext): string | undefined {
  if (typeof context.rawCommand === 'string' && context.rawCommand.length > 0) {
    return context.rawCommand;
  }
  const args = context.args;
  if (args && typeof args === 'object' && typeof (args as Record<string, unknown>).command === 'string') {
    return (args as Record<string, unknown>).command as string;
  }
  if (Array.isArray(context.canonicalArgv) && context.canonicalArgv.length > 0) {
    return context.canonicalArgv.join(' ');
  }
  return undefined;
}

/**
 * Match the context against this action's tool + argv + credentialScope matchers,
 * routing the argv matching through the canonicalized, anti-evasion `matchArgv`
 * (shell `-c` recursion, per-scope wrapper allowlist, deny-on-unresolvable, subcommand
 * normalization) — NEVER naive basename matching (AC-38/AC-38a/AC-38c).
 */
function matchAction(action: PolicyActionDoc, context: EvaluationContext): ActionMatchOutcome {
  if (!globMatch(action.match.tool, context.toolName)) return 'no-match';

  if (action.match.argv) {
    const command = rawCommandFor(context);
    if (typeof command !== 'string' || command.trim().length === 0) return 'no-match';

    const scope: ArgvMatchScope = {
      scopeId: action.id,
      match: {
        program: action.match.argv.program,
        subcommandEquals: action.match.argv.subcommandEquals,
        subcommandMatches: action.match.argv.subcommandMatches,
      },
      wrapperAllowlist: action.match.argv.wrapperAllowlist,
      recognizedPrograms: action.match.argv.recognizedPrograms ?? [action.match.argv.program],
      // Coverage/deny for THIS action is decided by matchArgv; the document-level
      // commandDefaultAllow governs the fully-uncovered case handled by the caller.
      commandDefaultAllow: false,
    };

    const res = matchArgv(command, scope);

    // A covered-but-unauthorized disguised command (unresolvable wrapper for a covered
    // program, or an opaque construct touching the scope) → deny (AC-38a). A deny even
    // takes precedence over any grant chain: a disguised covered command is never
    // authorized.
    if (res.deny === true && (res.covered || touchesArgvScope(res, scope, command))) {
      return 'deny';
    }
    if (!res.covered) return 'no-match';
  }

  if (typeof action.match.credentialScope === 'string') {
    if (!globMatch(action.match.credentialScope, context.credentialScope)) return 'no-match';
  }

  return 'match';
}

/**
 * True when a denied (unresolvable) match still relates to the covered scope — the
 * matcher already denies-on-touch for covered scopes, so any `deny` from `matchArgv`
 * under a covered-program scope is treated as a covered-but-unauthorized action.
 */
function touchesArgvScope(res: ReturnType<typeof matchArgv>, scope: ArgvMatchScope, command: string): boolean {
  const recognized = new Set([...(scope.recognizedPrograms ?? []), scope.match.program]);
  let argv: string[];
  try {
    argv = canonicalizeArgv(command);
  } catch {
    // Not tokenizable → fall back to raw containment, failing closed toward "touches".
    return [...recognized].some((prog) => command.includes(prog));
  }
  // An unresolvable disguise (`$(...)`, backticks, `$VAR`, `NAME=value`) cannot be cleanly
  // isolated → raw containment (fail closed toward deny). Otherwise use a precise
  // resolved-BASENAME check so `awscli` / `aws` inside an argument do not spuriously match.
  if (argv.some((tok) => breaksResolution(tok) || envAssignment(tok))) {
    return [...recognized].some((prog) => command.includes(prog));
  }
  return argv.some((tok) => recognized.has(basename(tok)));
}

/** Canonical basename of a path token (mirrors argv-matcher.basename). */
function basename(token: string): string {
  const parts = token.split(/[\\/]/);
  return parts[parts.length - 1] || token;
}
/** Token that defeats static program resolution (mirrors argv-matcher.tokenBreaksResolution). */
function breaksResolution(token: string): boolean {
  return token.includes('$(') || token.includes('`') || token.includes('${') || token.startsWith('$');
}
/** Inline `NAME=value` env assignment (mirrors argv-matcher.isEnvAssignment). */
function envAssignment(token: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*=/.test(token);
}

// ── top-level evaluate ──────────────────────────────────────────────────────

/**
 * Evaluate the policy for a context + evidence set (AC-20). Deny > grant > default:
 * an explicit `deny` action matching the context denies unconditionally; otherwise the
 * first grant action whose ANY chain is fully satisfied grants. Fails closed on any
 * thrown exception or below-floor epoch.
 */
export function evaluatePolicy(input: EvaluateInput): PolicyDecision {
  try {
    if (!input || typeof input !== 'object') return DENY('missing evaluation input');
    const { document, store, evidence, context } = input;
    if (!document || !Array.isArray(document.actions)) return DENY('missing policy document');
    if (!store || !Array.isArray(store.trustRoots)) return DENY('missing trust store');
    if (!Array.isArray(evidence)) return DENY('missing evidence');
    if (!context || typeof context !== 'object') return DENY('missing context');

    // Anti-rollback at evaluation time (AC-47): a below-floor epoch denies all.
    if (typeof context.configEpoch !== 'number' || typeof context.minEpochFloor !== 'number') {
      return DENY('missing configEpoch / minEpochFloor');
    }
    if (context.configEpoch < context.minEpochFloor) return DENY('configEpoch below floor');

    // Classify each action against the context via the anti-evasion argv matcher.
    const classified = document.actions.map((a) => ({ action: a, outcome: matchAction(a, context) }));

    // AC-38a: a covered-but-unauthorized DISGUISED command (an unresolvable wrapper for a
    // covered program — `sh -c 'aws s3 rm'`, `npx aws`, `$(...)`, backticks, `eval`,
    // busybox, `python -c`, env-indirection) is denied unconditionally, whether the
    // action is a grant or a deny. It falls through NEITHER to a chain NOR to
    // default-allow.
    if (classified.some((c) => c.outcome === 'deny')) {
      return { granted: false, reason: 'covered command disguised via wrapper/indirection → deny', evidenceUsed: [] };
    }

    const matching = classified.filter((c) => c.outcome === 'match').map((c) => c.action);

    // Deny precedence: any matching `deny` action wins over grants (AC-20).
    if (matching.some((a) => a.effect === 'deny')) {
      return { granted: false, reason: 'explicit deny action matched', evidenceUsed: [] };
    }

    for (const action of matching) {
      if (action.effect === 'deny') continue;
      // AC-17/AC-39: proxy attestation is REQUIRED when the policy sets it explicitly,
      // OR by DESIGN DEFAULT for any credentialScope-touching action (an action whose
      // `match` names a credentialScope). It defaults to false only for non-credential
      // actions. An explicit `false` opts out of the credential default.
      const requireProxyAttestation =
        action.requireProxyAttestation !== undefined
          ? action.requireProxyAttestation
          : typeof action.match.credentialScope === 'string' && action.match.credentialScope.length > 0;
      for (const chain of action.chains) {
        const outcome = evaluateChain(chain, evidence, store, context, requireProxyAttestation);
        if (outcome.satisfied) {
          return {
            granted: true,
            matchedChainId: chain.id,
            actionId: action.id,
            reason: `granted by chain ${chain.id} of action ${action.id}`,
            evidenceUsed: outcome.evidenceUsed,
            requiredStepCount: outcome.requiredStepCount,
            stepBindings: outcome.stepBindings,
          };
        }
      }
    }

    return { granted: false, reason: 'no chain satisfied', evidenceUsed: [] };
  } catch (err) {
    return DENY(`exception during evaluation: ${(err as Error)?.message ?? String(err)}`);
  }
}

export type { TrustRoot, TrustStore } from './verify-envelope-trusted.js';
