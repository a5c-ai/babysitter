/**
 * Milestone B — Policy document schema + loader/validator (AC-19 / AC-19a / AC-38b /
 * AC-41 / AC-41a / AC-23c) and the trust-root store loader (carry-forward hardening:
 * duplicate-fingerprint rejection).
 *
 * A policy document declares, per action, matchers and ONE OR MORE alternative
 * trust-chain templates (OR across chains, AND across a chain's requirements). A chain
 * is a list of REQUIREMENTS, each either a typed `step` or a distinct-holder `quorum`
 * (AC-41a) — so "human+opus AND 2-human-quorum" is ONE chain. The legacy `steps[]` +
 * top-level `quorum:` forms are accepted as sugar and normalized to `requirements[]`.
 *
 * OVERRIDING RULE: fail closed at parse. Invalid YAML or a missing/invalid required
 * field throws (a parse denial); the caller treats a throw as deny.
 */
import { parse as parseYaml } from 'yaml';
import type { TrustRoot, TrustStore } from './verify-envelope-trusted.js';

import type { ArgvMatch } from './argv-matcher.js';
export type { ArgvMatch } from './argv-matcher.js';

// ── Document types ──────────────────────────────────────────────────────────

export type EvidenceStepKind = 'human-approval' | 'model-decision' | 'delegation';

/** Condition sugar + base operators (AC-22). Sugar compiles to base ops in the evaluator. */
export interface StepConditions {
  /** Regex model-allowlist ("opus decided"): modelId matches this pattern. */
  modelIdMatches?: string;
  /** PermissionEvidence scope must equal this value. */
  scopeEquals?: string;
  /** The evidence must not be expired (AC-31). */
  notExpired?: boolean;
  /** A tag must be present. */
  tagContains?: string;
  /** Delegation: this chain step requires a real delegation relationship. */
  requiresDelegation?: boolean;
  /** Delegation: the chain terminal identity must equal this fingerprint. */
  expectedDelegatee?: string;
  /** Escape hatch for base operators (field/op/value tuples). */
  [key: string]: unknown;
}

export interface TypedStep {
  kind: EvidenceStepKind;
  /** Fingerprints or role labels resolved to fingerprints via trust roots. */
  trustedIdentities?: string[];
  conditions?: StepConditions;
}

export interface QuorumRequirement {
  of: EvidenceStepKind;
  min: number;
  trustedIdentities?: string[];
  conditions?: StepConditions;
}

export type ChainRequirement =
  | { step: TypedStep }
  | { quorum: QuorumRequirement };

export interface ChainDoc {
  id: string;
  requirements: ChainRequirement[];
}

export interface ActionMatch {
  /** Glob over the tool name. */
  tool: string;
  /** Canonicalized-argv matcher (AC-38). Absent → a non-command tool. */
  argv?: ArgvMatch;
  /** Glob over the requested credential scope. */
  credentialScope?: string;
}

export interface PolicyActionDoc {
  id: string;
  /** `deny` makes this action an explicit deny (deny > grant precedence, AC-20). */
  effect?: 'deny' | 'allow';
  match: ActionMatch;
  chains: ChainDoc[];
  /** Per-action TTL override (seconds). */
  authorizationTtlSeconds?: number;
  /** Whether the proxy-signed model attestation is required (AC-17/AC-39). */
  requireProxyAttestation?: boolean;
}

export interface PolicyDocument {
  version: number;
  authorizationTtlSeconds: number;
  /** AC-38b: default-allow for command-bearing tools is OPT-IN; defaults to false. */
  commandDefaultAllow: boolean;
  /** AC-23c: credentialScope globs that default-deny when uncovered. */
  defaultDeny: string[];
  actions: PolicyActionDoc[];
}

// ── Parser / validator ──────────────────────────────────────────────────────

function fail(msg: string): never {
  throw new Error(`policy document invalid: ${msg}`);
}

function asStringArray(value: unknown, ctx: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
    fail(`${ctx} must be an array of strings`);
  }
  return value as string[];
}

function normalizeConditions(raw: unknown, ctx: string): StepConditions | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'object' || Array.isArray(raw)) fail(`${ctx}.conditions must be a mapping`);
  return raw as StepConditions;
}

function normalizeTypedStep(raw: unknown, ctx: string): TypedStep {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail(`${ctx} must be a mapping`);
  const r = raw as Record<string, unknown>;
  const kind = r.kind;
  if (kind !== 'human-approval' && kind !== 'model-decision' && kind !== 'delegation') {
    fail(`${ctx}.kind must be one of human-approval | model-decision | delegation`);
  }
  return {
    kind,
    trustedIdentities: asStringArray(r.trustedIdentities, `${ctx}.trustedIdentities`),
    conditions: normalizeConditions(r.conditions, ctx),
  };
}

function normalizeQuorum(raw: unknown, ctx: string): QuorumRequirement {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail(`${ctx} must be a mapping`);
  const r = raw as Record<string, unknown>;
  const of = r.of;
  if (of !== 'human-approval' && of !== 'model-decision' && of !== 'delegation') {
    fail(`${ctx}.of must be an evidence kind`);
  }
  if (typeof r.min !== 'number' || !Number.isInteger(r.min) || r.min < 1) {
    fail(`${ctx}.min must be a positive integer`);
  }
  return {
    of,
    min: r.min,
    trustedIdentities: asStringArray(r.trustedIdentities, `${ctx}.trustedIdentities`),
    conditions: normalizeConditions(r.conditions, ctx),
  };
}

/**
 * Normalize a chain into `requirements[]`, accepting three source shapes:
 *   - explicit `requirements: [{ step } | { quorum }]` (AC-41a canonical form);
 *   - legacy `steps: [ typedStep ]` → one `{ step }` requirement per entry;
 *   - legacy top-level `quorum: { of, min }` sugar → one `{ quorum }` requirement
 *     (the sibling `steps[]`, if present, supplies its trustedIdentities/conditions).
 */
function normalizeChain(raw: unknown, ctx: string): ChainDoc {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail(`${ctx} must be a mapping`);
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || r.id.length === 0) fail(`${ctx}.id is required`);
  const id = r.id;

  const requirements: ChainRequirement[] = [];

  if (r.requirements !== undefined) {
    if (!Array.isArray(r.requirements)) fail(`${ctx}.requirements must be an array`);
    r.requirements.forEach((req, i) => {
      const rc = `${ctx}.requirements[${i}]`;
      if (!req || typeof req !== 'object') fail(`${rc} must be a mapping`);
      const reqObj = req as Record<string, unknown>;
      if ('step' in reqObj) {
        requirements.push({ step: normalizeTypedStep(reqObj.step, `${rc}.step`) });
      } else if ('quorum' in reqObj) {
        requirements.push({ quorum: normalizeQuorum(reqObj.quorum, `${rc}.quorum`) });
      } else {
        fail(`${rc} must have a 'step' or 'quorum' key`);
      }
    });
  } else {
    // Legacy sugar: top-level `quorum:` and/or `steps:`.
    if (r.quorum !== undefined) {
      const quorum = normalizeQuorum(r.quorum, `${ctx}.quorum`);
      // A sibling `steps[]` (single) supplies the quorum's trustedIdentities.
      if (Array.isArray(r.steps) && r.steps.length > 0) {
        const first = normalizeTypedStep(r.steps[0], `${ctx}.steps[0]`);
        if (!quorum.trustedIdentities && first.trustedIdentities) {
          quorum.trustedIdentities = first.trustedIdentities;
        }
        if (!quorum.conditions && first.conditions) {
          quorum.conditions = first.conditions;
        }
      }
      requirements.push({ quorum });
    } else if (Array.isArray(r.steps)) {
      r.steps.forEach((s, i) => {
        requirements.push({ step: normalizeTypedStep(s, `${ctx}.steps[${i}]`) });
      });
    } else {
      fail(`${ctx} must declare 'requirements', 'steps', or 'quorum'`);
    }
  }

  if (requirements.length === 0) fail(`${ctx} has no requirements`);
  return { id, requirements };
}

function normalizeMatch(raw: unknown, ctx: string): ActionMatch {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail(`${ctx}.match is required`);
  const r = raw as Record<string, unknown>;
  if (typeof r.tool !== 'string' || r.tool.length === 0) fail(`${ctx}.match.tool is required`);

  let argv: ArgvMatch | undefined;
  if (r.argv !== undefined) {
    if (!r.argv || typeof r.argv !== 'object' || Array.isArray(r.argv)) fail(`${ctx}.match.argv must be a mapping`);
    const a = r.argv as Record<string, unknown>;
    if (typeof a.program !== 'string' || a.program.length === 0) fail(`${ctx}.match.argv.program is required`);
    argv = {
      program: a.program,
      subcommandEquals: asStringArray(a.subcommandEquals, `${ctx}.match.argv.subcommandEquals`),
      subcommandMatches: asStringArray(a.subcommandMatches, `${ctx}.match.argv.subcommandMatches`),
      wrapperAllowlist: asStringArray(a.wrapperAllowlist, `${ctx}.match.argv.wrapperAllowlist`),
      recognizedPrograms: asStringArray(a.recognizedPrograms, `${ctx}.match.argv.recognizedPrograms`),
    };
  }

  const credentialScope =
    r.credentialScope === undefined ? undefined : String(r.credentialScope);

  return { tool: r.tool, argv, credentialScope };
}

function normalizeAction(raw: unknown, ctx: string): PolicyActionDoc {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail(`${ctx} must be a mapping`);
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || r.id.length === 0) fail(`${ctx}.id is required`);

  const effect = r.effect;
  if (effect !== undefined && effect !== 'deny' && effect !== 'allow') {
    fail(`${ctx}.effect must be 'deny' or 'allow'`);
  }

  const match = normalizeMatch(r.match, ctx);

  // A deny action needs no chains; a grant action needs ≥1.
  let chains: ChainDoc[] = [];
  if (r.chains !== undefined) {
    if (!Array.isArray(r.chains)) fail(`${ctx}.chains must be an array`);
    chains = r.chains.map((c, i) => normalizeChain(c, `${ctx}.chains[${i}]`));
  }
  if (effect !== 'deny' && chains.length === 0) {
    fail(`${ctx} (grant action) must declare at least one chain`);
  }

  const ttl = r.authorizationTtlSeconds;
  if (ttl !== undefined && (typeof ttl !== 'number' || ttl <= 0)) {
    fail(`${ctx}.authorizationTtlSeconds must be a positive number`);
  }

  return {
    id: r.id,
    effect: effect as 'deny' | 'allow' | undefined,
    match,
    chains,
    authorizationTtlSeconds: ttl as number | undefined,
    requireProxyAttestation:
      r.requireProxyAttestation === undefined ? undefined : Boolean(r.requireProxyAttestation),
  };
}

/**
 * Parse + validate a policy document (YAML or JSON text). Fails closed (throws) on
 * invalid YAML or any missing/invalid required field.
 */
export function parsePolicyDocument(text: string): PolicyDocument {
  if (typeof text !== 'string') fail('document text must be a string');

  let raw: unknown;
  try {
    raw = parseYaml(text);
  } catch (err) {
    fail(`YAML parse error: ${(err as Error).message}`);
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('document must be a mapping');
  const doc = raw as Record<string, unknown>;

  if (typeof doc.version !== 'number') fail('version is required and must be a number');

  if (!Array.isArray(doc.actions)) fail('actions must be an array');
  const actions = doc.actions.map((a, i) => normalizeAction(a, `actions[${i}]`));

  const commandDefaultAllow =
    doc.commandDefaultAllow === undefined ? false : Boolean(doc.commandDefaultAllow);

  const defaultDeny = asStringArray(doc.defaultDeny, 'defaultDeny') ?? [];

  const authorizationTtlSeconds =
    doc.authorizationTtlSeconds === undefined ? 120 : Number(doc.authorizationTtlSeconds);
  if (!Number.isFinite(authorizationTtlSeconds) || authorizationTtlSeconds <= 0) {
    fail('authorizationTtlSeconds must be a positive number');
  }

  return {
    version: doc.version,
    authorizationTtlSeconds,
    commandDefaultAllow,
    defaultDeny,
    actions,
  };
}

// ── Trust-root store loader (carry-forward hardening) ───────────────────────

/**
 * Load + validate a trust store. Rejects (throws) a store containing DUPLICATE
 * fingerprints — two records sharing one fingerprint is a cross-kind confusion
 * vector, so the whole store is rejected rather than silently picking one.
 */
export function loadTrustStore(store: TrustStore): TrustStore {
  if (!store || !Array.isArray(store.trustRoots)) {
    throw new Error('trust store invalid: trustRoots must be an array');
  }
  const seen = new Set<string>();
  for (const root of store.trustRoots) {
    if (!root || typeof root.fingerprint !== 'string' || root.fingerprint.length === 0) {
      throw new Error('trust store invalid: every root must carry a fingerprint');
    }
    if (seen.has(root.fingerprint)) {
      throw new Error(`trust store invalid: duplicate fingerprint ${root.fingerprint}`);
    }
    seen.add(root.fingerprint);
  }
  return store;
}

export type { TrustRoot, TrustStore } from './verify-envelope-trusted.js';
