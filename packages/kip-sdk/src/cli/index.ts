/**
 * `kip` CLI — minimal typed STUB (pre-implementation).
 *
 * This file exists so the FROZEN acceptance suite `src/__tests__/kip-cli.test.ts` can import the
 * `runCli` entry-point (a value) and its options contract (types) and FAIL ON ASSERTIONS rather than
 * on a module-resolution error at collection time — the same "throwing stub ahead of the real
 * implementation" convention the M2/M6/M7 milestones use (see `m7-acquisition.test.ts`'s header).
 *
 * The real implementation (a later work item, spec: `docs/design/kip-cli.md`) replaces the body of
 * `runCli` and adds `src/cli/kip.ts` (the `bin` entry), `src/cli/commands/*.ts`, `src/cli/resolve.ts`,
 * `src/cli/render.ts`, and `src/cli/ask.ts`. This stub deliberately implements NOTHING: it throws
 * `unimplemented` so every acceptance test's leading `await run(...)` rejects until the CLI lands.
 *
 * SCOPE BOUNDARY (spec §1, AC-1): the `kip` binary's runtime closure is `@a5c-ai/kip-sdk` (self) +
 * `@a5c-ai/genty-platform` + `@a5c-ai/genty-core` ONLY. It MUST NOT import `@a5c-ai/babysitter-sdk`.
 * Accordingly this stub imports nothing but the sibling kip SDK types.
 */
import type {
  DispatchMicroagentFn,
  MicroagentManifest,
  OpenOptions,
  Repo,
} from "../index";

/**
 * The options bag passed to {@link runCli}. `stdout`/`stderr` are write-callbacks so a test can
 * capture the two channels independently (spec §3's two-channel discipline). The three optional
 * seams (`openRepo`, `dispatchMicroagent`, `qaManifest`) are the TEST-INJECTION points that make the
 * CLI deterministically unit-testable without a real repo on disk, a real signing key, or a real
 * genty subprocess — mirroring `KipRepo`'s already-established constructor-injected
 * `dispatchMicroagent` seam:
 *
 * - `openRepo`   — overrides the SDK `open()` the CLI would otherwise call, so a test can hand the
 *                  command handlers a spy/fake `Repo` and assert which SDK method the parsed argv
 *                  drives (and with what arguments), independent of any SDK method still being a stub.
 *                  Default (real CLI): the package's own `open(options)`.
 * - `dispatchMicroagent` — the `kip ask` dispatch seam (spec §5). Default (real CLI): a thin adapter
 *                  over `createMicroagentSystem(...).dispatcher.dispatch` from `@a5c-ai/genty-platform`.
 *                  A test injects a scripted `DispatchMicroagentFn` (the M6/M7 idiom) so `ask` is
 *                  deterministic.
 * - `qaManifest` — overrides the bundled graph-QA `MicroagentManifest` (spec §5.3), so a test can pin
 *                  the default `runtime.model` and the registered `(name, version)` the `--manifest`
 *                  selector is validated against.
 */
export interface RunCliOptions {
  cwd: string;
  env?: Record<string, string | undefined>;
  stdout: (chunk: string) => void;
  stderr: (chunk: string) => void;
  openRepo?: (options: OpenOptions) => Promise<Repo>;
  dispatchMicroagent?: DispatchMicroagentFn;
  qaManifest?: MicroagentManifest;
}

/**
 * Parse `argv` (already `process.argv.slice(2)`), dispatch the named subcommand against the resolved
 * `Repo`, write the result to `opts.stdout`/`opts.stderr`, and RESOLVE with the process exit code
 * (spec §3). It never calls `process.exit`, so it is invocable in-process by the acceptance suite.
 */
export async function runCli(_argv: string[], _opts: RunCliOptions): Promise<number> {
  throw new Error("unimplemented: runCli");
}
