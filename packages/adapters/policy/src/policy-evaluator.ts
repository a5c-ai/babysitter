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
      re = new RegExp(conditions.modelIdMatches);
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
 * a quorum (AC-41): one human holding two keys must not satisfy a 2-of quorum. The
 * identity is the payload's `approvedBy` (the responder identity), falling back to the
 * signing fingerprint.
 */
function humanIdentity(evidence: Evidence): string {
  const approvedBy = evidence.envelope.payload.approvedBy;
  if (typeof approvedBy === 'string' && approvedBy.length > 0) return approvedBy;
  return evidence.envelope.publicKeyFingerprint;
}

// ── evidence → verified for a step ──────────────────────────────────────────

const KIND_TO_EVIDENCE_KIND: Record<string, EvidenceKind> = {
  'human-approval': 'human-approval',
  'model-decision': 'model-decision',
  delegation: 'delegation',
};

/**
 * True iff this evidence verifies against the trusted store for the required kind
 * (allowedFingerprints from the step) AND its conditions hold. Verification routes
 * through the Milestone-A trusted-store wrapper — the only sanctioned entry.
 */
function evidenceSatisfiesStep(
  evidence: Evidence,
  requiredKind: 'human-approval' | 'model-decision' | 'delegation',
  allowedFingerprints: string[] | undefined,
  conditions: StepConditions | undefined,
  store: TrustStore,
): boolean {
  if (evidence.kind !== requiredKind) return false;
  const trusted = verifyEnvelopeTrusted(
    evidence.envelope,
    KIND_TO_EVIDENCE_KIND[requiredKind],
    store,
    allowedFingerprints && allowedFingerprints.length > 0 ? allowedFingerprints : undefined,
  );
  if (!trusted.valid) return false;
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
): ReqResult {
  // Delegation steps requiring an actual delegation relationship take the chain path.
  if (step.kind === 'delegation' && step.conditions?.requiresDelegation === true) {
    return satisfyDelegation(step, evidence, store, consumed);
  }

  for (const ev of evidence) {
    if (consumed.has(ev)) continue;
    if (evidenceSatisfiesStep(ev, step.kind, step.trustedIdentities, step.conditions, store)) {
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
): ReqResult {
  const contributors: Evidence[] = [];
  const identities = new Set<string>();

  for (const ev of evidence) {
    if (consumed.has(ev)) continue;
    if (ev.kind !== quorum.of) continue;
    if (!evidenceSatisfiesStep(ev, quorum.of, quorum.trustedIdentities, quorum.conditions, store)) {
      continue;
    }
    // Distinct-holder rule: count DISTINCT identities, not distinct keys (AC-41).
    const identity = quorum.of === 'human-approval' ? humanIdentity(ev) : ev.envelope.publicKeyFingerprint;
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
): ReqResult & { requiredKind: string } {
  if ('quorum' in req) {
    const r = satisfyQuorum(req.quorum, evidence, store, consumed);
    return { ...r, requiredKind: req.quorum.of };
  }
  const r = satisfyTypedStep(req.step, evidence, store, consumed);
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
function evaluateChain(chain: ChainDoc, evidence: Evidence[], store: TrustStore): ChainOutcome {
  const consumed = new Set<Evidence>();
  const evidenceUsed: Evidence[] = [];
  const stepBindings: { stepIndex: number; requiredKind: string; evidence: Evidence }[] = [];
  let stepIndex = 0;

  for (const req of chain.requirements) {
    const result = satisfyRequirement(req, evidence, store, consumed);
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

  return {
    satisfied: true,
    evidenceUsed,
    requiredStepCount: stepBindings.length,
    stepBindings,
  };
}

// ── action matching ─────────────────────────────────────────────────────────

/** True iff the context matches this action's tool + argv + credentialScope matchers. */
function actionMatches(action: PolicyActionDoc, context: EvaluationContext): boolean {
  if (!globMatch(action.match.tool, context.toolName)) return false;

  if (action.match.argv) {
    const argv = context.canonicalArgv;
    if (!Array.isArray(argv) || argv.length === 0) return false;
    const program = argv[0].split(/[\\/]/).pop() ?? argv[0];
    if (program !== action.match.argv.program) return false;
    const subcommand = subcommandOf(argv);
    const eq = action.match.argv.subcommandEquals;
    const rx = action.match.argv.subcommandMatches;
    if (eq || rx) {
      let ok = false;
      if (eq && eq.some((s) => subcommand === s || subcommand.startsWith(`${s} `))) ok = true;
      if (!ok && rx && rx.some((p) => new RegExp(p).test(subcommand))) ok = true;
      if (!ok) return false;
    }
  }

  if (typeof action.match.credentialScope === 'string') {
    if (!globMatch(action.match.credentialScope, context.credentialScope)) return false;
  }

  return true;
}

function subcommandOf(argv: string[]): string {
  const words: string[] = [];
  for (const tok of argv.slice(1)) {
    if (tok.startsWith('-')) break;
    words.push(tok);
  }
  return words.join(' ');
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

    const matching = document.actions.filter((a) => actionMatches(a, context));

    // Deny precedence: any matching `deny` action wins over grants (AC-20).
    if (matching.some((a) => a.effect === 'deny')) {
      return { granted: false, reason: 'explicit deny action matched', evidenceUsed: [] };
    }

    for (const action of matching) {
      if (action.effect === 'deny') continue;
      for (const chain of action.chains) {
        const outcome = evaluateChain(chain, evidence, store);
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
