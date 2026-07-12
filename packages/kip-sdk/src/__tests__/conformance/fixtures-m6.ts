/**
 * M6 (Active knowledge: autoencoding — `learn()`) shared test support.
 *
 * NEW for M6 — does NOT read or depend on the existing (frozen, M0-M5) `fixtures.ts`/
 * `fixtures-m5.ts` files in this directory (per this round's hard rule: only the public surface
 * declared in `src/index.ts` may be depended on). Every helper here is built purely against the
 * `Repo`/`KipRepo`/`MicroagentManifest`/`LearnOptions`/`DispatchMicroagentFn` public surface.
 *
 * `learn()` itself is still an unimplemented throwing stub (`throw new Error("unimplemented:
 * learn")`) as of this round — every INV-A4/A5/A9/A12/A13/A14 test built on these helpers is
 * EXPECTED TO FAIL on a real assertion (a rejected promise where an accept/exhausted resolution
 * was expected, or a generic `Error` where a typed `KipError` was expected) — never on a
 * type/syntax error. These frozen tests become the acceptance criteria for the M6 implementation.
 */
import {
  KipRepo,
  type AssertInput,
  type AsOf,
  type BlobRef,
  type DispatchMicroagentFn,
  type LearnOptions,
  type MicroagentInvocation,
  type MicroagentManifest,
  type MicroagentResult,
  type PropValue,
} from "../../index";

/** A fixed, deterministic fake raw-artifact `BlobRef` — content never actually read by any
 *  scripted dispatch handler in these tests, so any stable 40-hex-char string suffices. */
export const FIXED_RAW_REF: BlobRef = { blob: "a".repeat(40) };

/** A second, DISTINCT fixed raw-artifact `BlobRef` for tests that need to tell two artifacts apart. */
export const OTHER_RAW_REF: BlobRef = { blob: "b".repeat(40) };

/** A fixed, explicitly PINNED `AsOf` frontier (docs/32's keying caveat: the same-key `kip:conflict`
 *  guarantee — and, symmetrically, the same-key no-op fold — holds ONLY when `ontologyAsOf`/
 *  `LearnOptions.asOf` is an explicitly pinned frontier, never the default-`now` per-call frontier).
 *  Every test that needs two/more `learn()` calls to land on the SAME cell key passes this SAME
 *  object (or a deep-equal one) as `LearnOptions.asOf` on every call. */
export const FIXED_AS_OF: AsOf = { validTime: 1_000_000 };

let manifestCounter = 0;
/** Builds a minimal, valid `MicroagentManifest` — permissive `{}` schemas (never gate dispatch on
 *  a schema this test suite doesn't care about), unique `name` per call unless one is supplied. */
export function buildManifest(overrides: Partial<MicroagentManifest> & { name: string; version?: string }): MicroagentManifest {
  manifestCounter += 1;
  return {
    version: "1.0.0",
    description: `M6 test manifest #${manifestCounter}`,
    inputSchema: {},
    outputSchema: {},
    isolation: "subprocess",
    runtime: { entrypoint: "noop" },
    ...overrides,
  };
}

/**
 * Registers a signed `MicroagentManifest` via the ALREADY-PUBLIC `registerFunctionality` seam
 * (T6.1, docs/31) — the only currently-implemented "mint a signature-valid registration fact for
 * this (name,version)" path in this build. `registerFunctionality` mints the manifest-registration
 * fact under `target:{kind:"schema", ontologyRef: ontologyRefForManifest(name,version)}`
 * UNCONDITIONALLY (see index.ts's own implementation) — the accompanying `EdgeKind` binding fact it
 * ALSO mints is irrelevant to `learn()`'s own (name,version) manifest-selection check (docs/32's
 * §5b.2 "explicit dual of registerFunctionality"), so a placeholder `edgeKind` string is supplied
 * here purely to satisfy `registerFunctionality`'s own signature — it names no real contextual hop.
 */
export async function registerManifest(repo: KipRepo, manifest: MicroagentManifest): Promise<void> {
  await repo.registerFunctionality(`kip-learn-test:${manifest.name}`, manifest);
}

/** Builds a `node-prop` `AssertInput` — the shape this test suite uses for every scripted
 *  encode/learner "candidate fact" (a single prop assert on a fixed test node), so the eventual
 *  accepted result is observable via the already-implemented `getNode(eid)` read path. */
export function nodePropAssert(eid: string, prop: string, value: PropValue): AssertInput {
  return {
    type: "assert",
    v: 1,
    target: { kind: "node-prop", eid, prop },
    value,
    validFrom: 0,
    validTo: null,
    replicaId: "test-authored-candidate", // expected to be re-stamped by learn()'s own authoring step
    provenance: {
      author: "m6-test-scripted-learner",
      signature: "", // expected to be re-stamped by learn()'s own signing/authoring step
      publicKeyFingerprint: "",
      signedFields: [],
    },
  };
}

/** One recorded dispatch, keyed by `(manifest.name, manifest.version)` — `callIndex` is the
 *  zero-based call count for THIS specific manifest identity at the time of this invocation, so a
 *  handler can return a scripted per-call sequence (e.g. a fixed loss sequence, INV-A12). */
export interface RecordedInvocation {
  invocation: MicroagentInvocation;
  callIndex: number;
}

export type ScriptedHandler = (
  invocation: MicroagentInvocation,
  callIndex: number,
) => MicroagentResult | Promise<MicroagentResult>;

/**
 * The M6 realization of docs/32's declared "stub microagent manifest" test seam (m7-18): builds a
 * `DispatchMicroagentFn` (the SAME injectable seam `KipRepo`'s constructor already accepts for M5)
 * that dispatches to a per-manifest-name scripted `ScriptedHandler`, recording every invocation (in
 * arrival order) into `log` — callers inspect `log` to assert exact dispatch counts/inputs, and
 * per-manifest-name arrays in `log` to assert loss-sequence/rawKind-threading claims.
 */
export function makeScriptedDispatch(
  handlers: Record<string, ScriptedHandler>,
  log: RecordedInvocation[] = [],
): { dispatch: DispatchMicroagentFn; log: RecordedInvocation[] } {
  const counts = new Map<string, number>();
  const dispatch: DispatchMicroagentFn = async (invocation) => {
    const key = `${invocation.manifest.name}@${invocation.manifest.version}`;
    const callIndex = counts.get(key) ?? 0;
    counts.set(key, callIndex + 1);
    log.push({ invocation, callIndex });
    const handler = handlers[invocation.manifest.name];
    if (!handler) {
      throw new Error(`makeScriptedDispatch: no scripted handler registered for manifest "${key}"`);
    }
    return handler(invocation, callIndex);
  };
  return { dispatch, log };
}

/** A `MicroagentResult` for a successful `EncodeAgent` call — output shape per docs/32's
 *  `EncodeAgent` FUNCTION-TYPE alias: `Promise<{ candidateFacts: AssertInput[] }>`. */
export function encodeOk(candidateFacts: AssertInput[]): MicroagentResult {
  return { exitCode: 0, output: { candidateFacts }, elapsedMs: 0 };
}

/** A `MicroagentResult` for a successful `DecodeAgent` call — output shape per docs/32's
 *  `DecodeAgent` FUNCTION-TYPE alias: `Promise<{ reconstructed: BlobRef }>`. */
export function decodeOk(reconstructed: BlobRef = FIXED_RAW_REF): MicroagentResult {
  return { exitCode: 0, output: { reconstructed }, elapsedMs: 0 };
}

/** A `MicroagentResult` for a successful `LossMetric` call — output shape per docs/32's
 *  `LossMetric` FUNCTION-TYPE alias: `Promise<number>` (a BARE number, unlike encode/decode/learner
 *  which are object-wrapped — transcribed verbatim from the declared alias). */
export function lossOk(loss: number): MicroagentResult {
  return { exitCode: 0, output: loss, elapsedMs: 0 };
}

/** A `MicroagentResult` for a successful `LearnerAgent` call — output shape per docs/32's
 *  `LearnerAgent` FUNCTION-TYPE alias: `Promise<{ next: AssertInput[] }>`. */
export function learnerOk(next: AssertInput[]): MicroagentResult {
  return { exitCode: 0, output: { next }, elapsedMs: 0 };
}

/** A dispatch-failure `MicroagentResult` (non-zero `exitCode`) — docs/32's N5 "per-iteration
 *  failure is treated as infinite loss" rule: consumes one invocation, never a best-effort accept. */
export function dispatchFailure(): MicroagentResult {
  return { exitCode: 1, output: null, elapsedMs: 0 };
}

let replicaCounter = 0;
/** A collision-free `replicaId` for this process's shared `KipRepo.registry` (static, keyed by
 *  `replicaId` — see index.ts's own doc comment on that registry). Every repo built with this
 *  helper MUST be `.close()`-d by the test that creates it. */
export function freshReplicaId(label: string): string {
  replicaCounter += 1;
  return `m6-test-${label}-${replicaCounter}-${Date.now()}`;
}

/** Default `LearnOptions` fields every test overrides selectively — `asOf` intentionally omitted
 *  here (defaults to per-call `now`); tests that need same-key determinism (INV-A9) must supply
 *  `FIXED_AS_OF` explicitly, per the keying caveat (docs/32). */
export function baseLearnOptions(overrides: Partial<LearnOptions> & Pick<LearnOptions, "encode" | "decode" | "learner" | "loss">): LearnOptions {
  return {
    threshold: 0.5,
    maxIterations: 10,
    maxWallMs: 60_000,
    maxInvocations: 1_000,
    rawKind: "text/markdown",
    ...overrides,
  };
}
