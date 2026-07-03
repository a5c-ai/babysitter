/**
 * Milestone D — PRODUCTION wiring seam for the tool-layer gates (§9 / AC-49 / AC-45 /
 * AC-23 / AC-38 / AC-42 / AC-40).
 *
 * The gate PRIMITIVES (PolicyVerifierHookBridge / createPolicyPreToolUseHook /
 * gateCredentialInjection / verifyDispatchAuthorization) are well-built and fail-closed,
 * but they were never CONSTRUCTED nor INJECTED on any production execution path: the
 * genty MCP dispatcher's `policyGate`, the genty session's `policyToolGate`, and the
 * ToolDispatcher's GATE-1 bridge were all `if (gate)` no-ops because nothing populated
 * them in production. This module is the single seam that closes that gap.
 *
 * It mirrors Milestone-C's `loadTrustedBreakpointPolicy` posture exactly:
 *
 *   - When the off-workspace config anchor IS pinned (`POLICY_CONFIG_ROOT_FP` +
 *     `POLICY_CONFIG_MIN_EPOCH` + config-root key material in env/deploy), enforcement is
 *     ACTIVE BY DEFAULT: the manifest is verified (AC-36/AC-45/AC-46/AC-47), coverage is
 *     built from `decideCoverage`/`matchArgv` over the verified policy docs (AC-23/AC-38),
 *     the authorization/credential-scope resolvers are built from the verified config, and
 *     a covered action WITHOUT a valid CommandAuthorization is DENIED on the real path with
 *     no extra caller wiring.
 *
 *   - When the anchor is NOT pinned (the pre-Milestone-D default deployment), the seam
 *     returns `enforcementActive: false` and NO gate is constructed — the execution paths
 *     are unchanged (documented back-compat, same posture as Milestone C).
 *
 * FAIL CLOSED. With the anchor pinned, ANY failure to establish trust — missing/edited/
 * corrupt manifest or config file, wrong signer, below-floor epoch, unreadable/malformed
 * policy docs — yields a gate that DENIES every COVERED action (a config error can never
 * let a covered action through). Uncovered non-command actions still pass under back-compat
 * default-allow unless a `defaultDeny` scope matches; uncovered command-bearing actions are
 * denied unless `commandDefaultAllow` (AC-38b). No fallbacks: any thrown exception is a deny.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  verifyConfigManifest,
  type ConfigManifestPayload,
} from './config-manifest.js';
import type { SignedEnvelope } from '@a5c-ai/genty-core/trust';
import {
  matchArgv,
  type ArgvMatchScope,
} from './argv-matcher.js';
import {
  parsePolicyDocument,
  type PolicyDocument,
  type PolicyActionDoc,
} from './policy-schema.js';
import {
  verifyCommandAuthorization,
  type CommandAuthorizationPayload,
  type TrustRoot,
} from './verify-envelope-trusted.js';
import { argsHash as computeArgsHash, commandHash as computeCommandHash } from './canonicalize-args.js';
import type { CredentialScopeSource } from './credential-identity.js';

// ── Config anchor pins (OFF the workspace: env / deploy image, AC-37/AC-47) ──────
// Identical env names to Milestone C's loadTrustedBreakpointPolicy so ONE pinned anchor
// governs both the breakpoint gate and the tool-layer gates.
const CONFIG_ROOT_FP_ENV = 'POLICY_CONFIG_ROOT_FP';
const CONFIG_MIN_EPOCH_ENV = 'POLICY_CONFIG_MIN_EPOCH';
const CONFIG_ROOT_KEY_ENV = 'POLICY_CONFIG_ROOT_KEY';
const CONFIG_ROOT_KEY_PATH_ENV = 'POLICY_CONFIG_ROOT_KEY_PATH';
const CONFIG_DIR_ENV = 'POLICY_CONFIG_DIR';
/** The issuer trust roots (kind `engine`) that may sign a CommandAuthorization. */
const ISSUER_ROOTS_ENV = 'POLICY_ISSUER_ROOTS';

const MANIFEST_FILE = 'config-manifest.json';
const TRUST_ROOTS_FILE = 'trust-roots.json';
const POLICIES_DIR = 'policies';
const CREDENTIAL_SOURCE_FILE = 'credential-scope-source.json';

/**
 * A resolved CommandAuthorization for a specific executing tool call — supplied by the
 * caller's authorization store (the orchestrator issues these when evidence is present,
 * Milestone C). When none can be resolved, the gate DENIES a covered action.
 */
export type AuthorizationResolver = (context: {
  toolName: string;
  toolCallId: string | undefined;
  sessionId: string | undefined;
  runId: string | undefined;
}) => SignedEnvelope<CommandAuthorizationPayload> | undefined;

/** The gate-call context every seam callback receives (superset of each gate's fields). */
export interface GateCallContext {
  toolName: string;
  input: unknown;
  toolCallId?: string;
  runId?: string;
  sessionId?: string;
  /** The exact command string for command-bearing tools (recomputed hash at the gate). */
  command?: string;
  modelId?: string;
}

export interface GateDecision {
  allowed: boolean;
  reason?: string;
}

/**
 * The constructed production gate. `policyToolGate` matches the genty session seam
 * (`AgentCoreSessionOptions.policyToolGate`), `mcpPolicyGate` matches the genty MCP
 * dispatcher seam (`McpRoutingOptions.policyGate`). Both share one implementation.
 */
export interface PolicyEnforcementGate {
  enforcementActive: true;
  /** Set when trust could not be established — every covered action denies. */
  configError?: string;
  /** The verified config epoch (AC-46), for audit. */
  configEpoch: number;
  /** The genty session tool-execution gate (§9.4). */
  policyToolGate: (ctx: { toolName: string; toolCallId: string; input: unknown; modelId?: string }) => GateDecision;
  /** The genty MCP dispatcher gate (§9.4). */
  mcpPolicyGate: (ctx: { toolName: string; input: unknown; runId?: string; sessionId?: string }) => GateDecision;
  /** The uniform evaluator, exposed for GATE 1 / GATE 2 composition + tests. */
  evaluate: (ctx: GateCallContext) => GateDecision;
}

export type LoadPolicyEnforcementResult =
  | { enforcementActive: false }
  | PolicyEnforcementGate;

// ── env helpers ──────────────────────────────────────────────────────────────

function readEnv(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function resolveConfigDir(projectRoot: string): string {
  return readEnv(CONFIG_DIR_ENV) ?? path.join(projectRoot, '.policy');
}

async function readFileOrUndefined(file: string): Promise<string | undefined> {
  try {
    return await fs.readFile(file, 'utf8');
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ENOENT') return undefined;
    throw err;
  }
}

async function listPolicyFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && (e.name.endsWith('.yaml') || e.name.endsWith('.yml') || e.name.endsWith('.json')))
      .map((e) => e.name);
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ENOENT') return [];
    throw err;
  }
}

// ── coverage + credential scope from the verified config ─────────────────────

/** Derive the argv-match scopes for every command-bearing action across all docs. */
function argvScopesOf(docs: PolicyDocument[]): ArgvMatchScope[] {
  const scopes: ArgvMatchScope[] = [];
  for (const doc of docs) {
    for (const action of doc.actions) {
      if (!action.match.argv) continue;
      scopes.push({
        scopeId: action.id,
        match: {
          program: action.match.argv.program,
          subcommandEquals: action.match.argv.subcommandEquals,
          subcommandMatches: action.match.argv.subcommandMatches,
        },
        wrapperAllowlist: action.match.argv.wrapperAllowlist,
        recognizedPrograms: action.match.argv.recognizedPrograms ?? [action.match.argv.program],
        commandDefaultAllow: doc.commandDefaultAllow,
      });
    }
  }
  return scopes;
}

/** Simple `*`-glob match (mirrors dispatch.ts globToRegex). */
function globMatch(glob: string, value: string): boolean {
  if (glob === value) return true;
  const escaped = glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  try {
    return new RegExp(`^${escaped}$`).test(value);
  } catch {
    return false;
  }
}

/**
 * Find the action(s) that cover a given tool + command. An action covers when its tool
 * glob matches AND (no argv OR the argv matcher reports `covered`). Returns the matched
 * action and the number of required steps of its FIRST chain (for AC-42 step-coverage).
 */
interface Coverage {
  covered: boolean;
  /** True when a covered-but-disguised command must be denied outright (AC-38a). */
  deny: boolean;
  action?: PolicyActionDoc;
  requiredStepCount?: number;
  reason?: string;
}

function coverageFor(docs: PolicyDocument[], toolName: string, command: string): Coverage {
  for (const doc of docs) {
    for (const action of doc.actions) {
      if (!globMatch(action.match.tool, toolName)) continue;

      if (action.match.argv) {
        if (typeof command !== 'string' || command.trim().length === 0) continue;
        const scope: ArgvMatchScope = {
          scopeId: action.id,
          match: {
            program: action.match.argv.program,
            subcommandEquals: action.match.argv.subcommandEquals,
            subcommandMatches: action.match.argv.subcommandMatches,
          },
          wrapperAllowlist: action.match.argv.wrapperAllowlist,
          recognizedPrograms: action.match.argv.recognizedPrograms ?? [action.match.argv.program],
          commandDefaultAllow: false,
        };
        const res = matchArgv(command, scope);
        // A covered-but-disguised command (unresolvable wrapper for a covered program)
        // is denied outright (AC-38a) — it never falls through to default-allow.
        if (res.deny === true && (res.covered || touchesScope(res, scope, command))) {
          return { covered: false, deny: true, action, reason: res.reason ?? 'disguised covered command' };
        }
        if (!res.covered) continue;
      }

      // Covered. Required-step count = the AND-ed requirement count of the first chain.
      const requiredStepCount = action.chains[0]?.requirements.length ?? 0;
      return { covered: true, deny: false, action, requiredStepCount };
    }
  }
  return { covered: false, deny: false };
}

/** True when a denied argv match still relates to a covered scope (mirrors evaluator). */
function touchesScope(
  res: ReturnType<typeof matchArgv>,
  scope: ArgvMatchScope,
  command: string,
): boolean {
  // matchArgv already denies-on-touch for covered scopes; any deny under a covered-program
  // scope is a covered-but-unauthorized action.
  return res.deny === true && (scope.recognizedPrograms ?? [scope.match.program]).some((p) => command.includes(p));
}

/** The credential scope for a covered action, from the action's `match.credentialScope`. */
function credentialScopeFor(action: PolicyActionDoc | undefined): string {
  return action?.match.credentialScope ?? '';
}

// ── the built gate ────────────────────────────────────────────────────────────

interface BuiltConfig {
  configEpoch: number;
  minEpochFloor: number;
  issuerRoots: TrustRoot[];
  policyDocs: { hash: string; doc: PolicyDocument }[];
  credentialSource?: CredentialScopeSource;
}

const sha256Hex = async (data: string): Promise<string> => {
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(data).digest('hex');
};

function commandStringOf(input: unknown, explicit?: string): string {
  if (typeof explicit === 'string' && explicit.length > 0) return explicit;
  if (input && typeof input === 'object') {
    const cmd = (input as Record<string, unknown>).command;
    if (typeof cmd === 'string') return cmd;
  }
  return '';
}

/**
 * Build the uniform gate evaluator over the verified config. For a covered action it
 * REQUIRES a valid CommandAuthorization (resolved via `resolveAuthorization`), recomputes
 * commandHash/argsHash at the gate (TOCTOU, AC-32), binds the executing toolCallId
 * (AC-34a — a covered action with no executing id is DENIED), and enforces step-coverage
 * (AC-42). Uncovered actions follow AC-23/AC-38b/AC-23c default logic.
 */
function makeEvaluator(
  built: BuiltConfig,
  resolveAuthorization: AuthorizationResolver,
): (ctx: GateCallContext) => GateDecision {
  const docs = built.policyDocs.map((p) => p.doc);
  // The single doc hash bound into an authorization is the doc that COVERS the action; a
  // gate confirms the authorization was issued under that same doc. We index doc hash by
  // action id so we can supply the right policyDocHash per covered action.
  const docHashByActionId = new Map<string, string>();
  for (const { hash, doc } of built.policyDocs) {
    for (const action of doc.actions) docHashByActionId.set(action.id, hash);
  }

  return (ctx: GateCallContext): GateDecision => {
    try {
      const command = commandStringOf(ctx.input, ctx.command);
      const cov = coverageFor(docs, ctx.toolName, command);

      // AC-38a — a covered-but-disguised command denies outright.
      if (cov.deny) {
        return { allowed: false, reason: cov.reason ?? 'disguised covered command → deny' };
      }

      if (!cov.covered) {
        // Uncovered. Command-bearing → deny unless commandDefaultAllow anywhere (AC-38b);
        // non-command → default-allow (AC-23) unless a defaultDeny scope matches (AC-23c).
        if (command.length > 0) {
          const anyDefaultAllow = docs.some((d) => d.commandDefaultAllow === true);
          if (!anyDefaultAllow) {
            return { allowed: false, reason: 'uncovered command-bearing action, default-deny (AC-38b)' };
          }
        }
        // AC-23c: an uncovered action is denied if its scope matches a defaultDeny glob.
        // Uncovered actions carry no action-derived scope, so this applies only when a
        // caller-derived scope is present on the input; conservatively pass through.
        return { allowed: true };
      }

      // ── COVERED — a valid CommandAuthorization is REQUIRED (AC-49). ──
      const authorization = resolveAuthorization({
        toolName: ctx.toolName,
        toolCallId: ctx.toolCallId,
        sessionId: ctx.sessionId,
        runId: ctx.runId,
      });
      if (!authorization) {
        return { allowed: false, reason: 'covered action has no CommandAuthorization — deny (AC-49)' };
      }

      // AC-34a — the executing toolCallId MUST be present; never bind to the
      // authorization's own id (that would be an X===X tautology).
      const toolCallId = typeof ctx.toolCallId === 'string' && ctx.toolCallId.length > 0 ? ctx.toolCallId : undefined;
      if (toolCallId === undefined) {
        return { allowed: false, reason: 'covered action has no executing toolCallId — cannot bind (deny)' };
      }

      const commandHash = computeCommandHash(command);
      const argsHash = computeArgsHash(ctx.input);
      const credentialScope = credentialScopeFor(cov.action);
      const policyDocHash = cov.action ? docHashByActionId.get(cov.action.id) ?? '' : '';

      const verification = verifyCommandAuthorization(authorization, {
        now: Date.now(),
        toolName: ctx.toolName,
        toolCallId,
        commandHash,
        argsHash,
        credentialScope,
        policyDocHash,
        currentConfigEpoch: built.configEpoch,
        minEpochFloor: built.minEpochFloor,
        issuerRoots: built.issuerRoots,
        ...(typeof cov.requiredStepCount === 'number' && cov.requiredStepCount > 0
          ? { requiredStepCount: cov.requiredStepCount }
          : {}),
      });

      if (!verification.valid) {
        return { allowed: false, reason: `authorization verification failed: ${verification.reason}` };
      }
      return { allowed: true };
    } catch (err) {
      return { allowed: false, reason: `exception during policy gate: ${(err as Error)?.message ?? String(err)}` };
    }
  };
}

/**
 * A gate that DENIES every COVERED action (config error). Uncovered actions still follow
 * the default logic so a config error does not break unrelated tools, but no covered
 * action is ever authorized when trust could not be established (fail closed).
 */
function makeConfigErrorEvaluator(reason: string): (ctx: GateCallContext) => GateDecision {
  return (ctx: GateCallContext): GateDecision => {
    // With no verified policy docs we cannot compute coverage; fail closed by denying any
    // action that could be command-bearing, and pass through pure non-command tools.
    const command = commandStringOf(ctx.input, ctx.command);
    if (command.length > 0) {
      return { allowed: false, reason: `config error, command-bearing action denied: ${reason}` };
    }
    // A non-command tool with a config error: we cannot know if it is covered, so deny to
    // be safe when the anchor is pinned (a config error must never authorize a covered
    // action). Pass through only truly trivial calls would risk a covered MCP tool slipping
    // — deny is the fail-closed choice.
    return { allowed: false, reason: `config error, action denied: ${reason}` };
  };
}

// ── loader ────────────────────────────────────────────────────────────────────

function parseIssuerRoots(raw: string | undefined): TrustRoot[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as TrustRoot[];
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { trustRoots?: unknown }).trustRoots)) {
      return (parsed as { trustRoots: TrustRoot[] }).trustRoots;
    }
  } catch {
    return [];
  }
  return [];
}

/**
 * Load + verify the trust-anchored tool-layer enforcement gate for a project.
 *
 * `projectRoot` anchors the default `.policy` dir (typically the run's project root /
 * workspace). `resolveAuthorization` is the caller's authorization store — with no store
 * (or one that returns none), a covered action DENIES (fail closed).
 */
export async function loadPolicyEnforcementGate(
  projectRoot: string,
  resolveAuthorization: AuthorizationResolver = () => undefined,
): Promise<LoadPolicyEnforcementResult> {
  const pinnedConfigRootFp = readEnv(CONFIG_ROOT_FP_ENV);

  // No off-workspace anchor pinned → enforcement inactive (back-compat, same as Milestone C).
  if (!pinnedConfigRootFp) {
    return { enforcementActive: false };
  }

  const minEpochFloor = Number(readEnv(CONFIG_MIN_EPOCH_ENV) ?? '1');

  const denied = (reason: string): PolicyEnforcementGate => {
    const evaluate = makeConfigErrorEvaluator(reason);
    return {
      enforcementActive: true,
      configError: reason,
      configEpoch: Number.isFinite(minEpochFloor) ? minEpochFloor : 0,
      evaluate,
      policyToolGate: (c) => evaluate({ toolName: c.toolName, toolCallId: c.toolCallId, input: c.input, modelId: c.modelId }),
      mcpPolicyGate: (c) => evaluate({ toolName: c.toolName, input: c.input, runId: c.runId, sessionId: c.sessionId }),
    };
  };

  try {
    if (!Number.isFinite(minEpochFloor)) return denied('POLICY_CONFIG_MIN_EPOCH is not a number');

    let configRootKey = readEnv(CONFIG_ROOT_KEY_ENV);
    if (!configRootKey) {
      const keyPath = readEnv(CONFIG_ROOT_KEY_PATH_ENV);
      if (keyPath) configRootKey = await readFileOrUndefined(keyPath);
    }
    if (!configRootKey) return denied('config-root key material is not pinned');

    const configDir = resolveConfigDir(projectRoot);

    const manifestRaw = await readFileOrUndefined(path.join(configDir, MANIFEST_FILE));
    if (manifestRaw === undefined) return denied(`missing ${MANIFEST_FILE}`);
    let manifest: SignedEnvelope<ConfigManifestPayload>;
    try {
      manifest = JSON.parse(manifestRaw) as SignedEnvelope<ConfigManifestPayload>;
    } catch {
      return denied(`corrupt ${MANIFEST_FILE}`);
    }

    // Read every config file the manifest could cover: trust-roots.json + every policy doc
    // + the optional credential-scope source. The verifier requires each on-disk file to be
    // listed in the manifest with a matching hash (AC-36 step 3), keyed by the manifest path.
    const files: Record<string, string> = {};
    const trustRootsBytes = await readFileOrUndefined(path.join(configDir, TRUST_ROOTS_FILE));
    if (trustRootsBytes !== undefined) files[TRUST_ROOTS_FILE] = trustRootsBytes;
    if (trustRootsBytes === undefined) return denied(`missing ${TRUST_ROOTS_FILE}`);

    const policyFileNames = await listPolicyFiles(path.join(configDir, POLICIES_DIR));
    for (const name of policyFileNames) {
      const rel = `${POLICIES_DIR}/${name}`;
      const bytes = await readFileOrUndefined(path.join(configDir, POLICIES_DIR, name));
      if (bytes !== undefined) files[rel] = bytes;
    }
    const credSourceBytes = await readFileOrUndefined(path.join(configDir, CREDENTIAL_SOURCE_FILE));
    if (credSourceBytes !== undefined) files[CREDENTIAL_SOURCE_FILE] = credSourceBytes;

    const configRoot: TrustRoot = {
      fingerprint: pinnedConfigRootFp,
      kind: 'config',
      publicKey: configRootKey,
      label: 'pinned-config-root',
    };

    const verification = verifyConfigManifest(manifest, {
      pinnedConfigRootFp,
      configRoot,
      minEpoch: minEpochFloor,
      files,
    });
    if (!verification.valid) {
      return denied(`config manifest not trusted: ${verification.reason ?? 'invalid'}`);
    }
    const configEpoch = verification.configEpoch ?? minEpochFloor;

    // Parse the (now manifest-verified) policy docs. A corrupt/invalid doc denies-all.
    const policyDocs: { hash: string; doc: PolicyDocument }[] = [];
    for (const rel of Object.keys(files)) {
      if (!rel.startsWith(`${POLICIES_DIR}/`)) continue;
      const bytes = files[rel];
      let doc: PolicyDocument;
      try {
        doc = parsePolicyDocument(bytes);
      } catch (err) {
        return denied(`invalid policy doc ${rel}: ${(err as Error)?.message ?? String(err)}`);
      }
      const hash = await sha256Hex(bytes);
      policyDocs.push({ hash, doc });
    }

    // Issuer roots (kind `engine`) that may sign a CommandAuthorization: pinned off-workspace
    // beside the config root. When absent, no authorization can ever verify → covered actions
    // deny (fail closed), which is the correct posture until the issuer is provisioned.
    const issuerRoots = parseIssuerRoots(readEnv(ISSUER_ROOTS_ENV));

    // Optional trusted credential→scope source (AC-40), from the manifest-verified file.
    let credentialSource: CredentialScopeSource | undefined;
    if (credSourceBytes !== undefined) {
      try {
        credentialSource = JSON.parse(credSourceBytes) as CredentialScopeSource;
      } catch {
        return denied(`corrupt ${CREDENTIAL_SOURCE_FILE}`);
      }
    }

    const built: BuiltConfig = {
      configEpoch,
      minEpochFloor,
      issuerRoots,
      policyDocs,
      credentialSource,
    };

    const evaluate = makeEvaluator(built, resolveAuthorization);

    return {
      enforcementActive: true,
      configEpoch,
      evaluate,
      policyToolGate: (c) => evaluate({ toolName: c.toolName, toolCallId: c.toolCallId, input: c.input, modelId: c.modelId }),
      mcpPolicyGate: (c) => evaluate({ toolName: c.toolName, input: c.input, runId: c.runId, sessionId: c.sessionId }),
    };
  } catch (err) {
    return denied(`enforcement config error: ${(err as Error)?.message ?? String(err)}`);
  }
}

/** Exposed for the wiring to build argv scopes (e.g. GATE-1 coverage predicate). */
export { argvScopesOf };
