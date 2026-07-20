/**
 * `src/learn/` — the four in-process microagent bodies behind `Repo.learn()` (ADR-B10/B10b/B10f).
 *
 * IMPLEMENTATION STATUS: UNIMPLEMENTED PLACEHOLDER for the `text-autoencoder` work item. Every
 * export below is a trivial stub whose observable behavior is deliberately WRONG, so the frozen
 * assertions in `src/__tests__/text-autoencoder.test.ts` fail on their own diffs rather than on a
 * type/syntax/import error. Do not "fix" the tests to match this stub.
 */
import type { HarnessCliProbe, HarnessCliRunner } from "../cli/ask";
import type { DispatchMicroagentFn, MicroagentManifest, Repo } from "../index";

/** The four roles `learn()` resolves via `findRegisteredManifest` (`kip-repo.ts:4907-4912`). */
export type LearnRole = "encode" | "decode" | "learner" | "loss";

/** The bundled manifest names (ADR-B10b). `(name, version)` is the selection key. */
export const LEARN_MANIFEST_NAMES: Readonly<Record<LearnRole, string>> = {
  encode: "kip-learn-encode",
  decode: "kip-learn-decode",
  learner: "kip-learn-learner",
  loss: "kip-learn-loss",
};

/**
 * The factory's deps. The `Pick` is the whole point (ADR-B10, INV-A1): the bodies are STRUCTURALLY
 * incapable of authoring a fact — no `assertFact`, no `txn`, no `putNode`. `run`/`probe` are the
 * zero-spend test-injection seams (`ask.ts:709-719`).
 */
export interface LearnDispatchDeps {
  repo: Pick<Repo, "getBlob" | "putBlob">;
  run?: HarnessCliRunner;
  probe?: () => HarnessCliProbe;
}

/**
 * Reads the four bundled `src/cli/microagents/kip-learn-<role>/microagent.json` manifests. Throws
 * `ERR_UNREGISTERED_MANIFEST` ("the kip CLI bundle is incomplete") rather than fabricating one.
 *
 * The decode manifest's `outputSchema` MUST be strict (`required:["reconstructed"]`, with
 * `reconstructed` requiring a non-empty string `blob`) — `learn()` reads decode's payload with a
 * bare type assertion (`kip-repo.ts:5136`), so the manifest schema IS the guard (ADR-B10d trap 1).
 * The loss manifest's `outputSchema` MUST be the bare scalar `{"type":"number"}` (ADR-B10b).
 */
export function resolveLearnManifests(): Record<LearnRole, MicroagentManifest> {
  // UNIMPLEMENTED PLACEHOLDER: permissive schemas — exactly the shape ADR-B10d trap 1 forbids.
  const stub = (name: string): MicroagentManifest => ({
    name,
    version: "1.0.0",
    description: "unimplemented placeholder (text-autoencoder)",
    inputSchema: {},
    outputSchema: {},
    isolation: "subprocess",
    runtime: { entrypoint: "unimplemented", timeout: 120_000 },
  });
  return {
    encode: stub(LEARN_MANIFEST_NAMES.encode),
    decode: stub(LEARN_MANIFEST_NAMES.decode),
    learner: stub(LEARN_MANIFEST_NAMES.learner),
    loss: stub(LEARN_MANIFEST_NAMES.loss),
  };
}

/**
 * The ONE dispatch seam — routes on `invocation.manifest.name` (the typed discriminant `learn()`
 * stamps at `kip-repo.ts:5012-5017`), never by parsing `invocation.id`. Its `default` branch is a
 * LOUD throw, never a silent pass-through. A body that throws becomes a non-zero `exitCode` carrying
 * a reason on `output.error`, which `dispatchOne` maps to `null` and the loop scores as a real,
 * budget-consuming, audited infinite-loss iteration (N5).
 */
export function makeLearnDispatch(_deps: LearnDispatchDeps): DispatchMicroagentFn {
  // UNIMPLEMENTED PLACEHOLDER: every role fails with a reason; nothing is ever fabricated.
  return async () => ({
    exitCode: 1,
    output: { error: "unimplemented: makeLearnDispatch (text-autoencoder work item, ADR-B10)" },
    elapsedMs: 0,
  });
}

/** The result of the `KIP_LEARN_LIVE` opt-in gate (ADR-B10f). */
export interface LearnLiveGate {
  enabled: boolean;
  reason?: string;
}

/**
 * PURE gate: when `KIP_LEARN_LIVE` is unset/not `"1"` it returns `{enabled:false, reason}` WITHOUT
 * consulting `probe` at all (the exact property `graph-qa-live.test.ts:1193` asserts, verifiable
 * with a throwing probe stub). The env var answers "may we?"; the probe answers "can we?" — and the
 * env var is checked FIRST, so the default `npm run test:sdk` spawns nothing and spends nothing.
 */
export function resolveLearnLiveGate(_args: {
  env: Record<string, string | undefined>;
  probe: () => HarnessCliProbe;
}): LearnLiveGate {
  // UNIMPLEMENTED PLACEHOLDER: deliberately (wrongly) reports the live path as enabled.
  return { enabled: true };
}
