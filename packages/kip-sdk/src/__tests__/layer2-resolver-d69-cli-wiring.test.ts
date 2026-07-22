/**
 * D-69 / ADR-B12d — CLI WIRING test (complements the pure-selector unit tests in
 * `layer2-resolver-d69-model-tier.test.ts`). The selector `resolverEffectiveModel` is unit-pinned
 * there; here we drive the REAL CLI (`runCli(["resolve", "--dry-run", "--json", …])`) through a spy
 * `Repo` and assert the resolved effective model is actually WIRED into `kip resolve`'s output — so a
 * regression that dropped `model: effectiveModel` from `emitJson`, or reverted the spawn/report back to
 * the global `resolveHarnessModel` default, would FAIL here rather than ship green (the gap the round-1
 * critic flagged).
 *
 * `--dry-run` is used deliberately: it computes candidate pairs and reports the effective model WITHOUT
 * spawning a model and WITHOUT the `KIP_RESOLVE_LIVE` gate, so this is a zero-spend, deterministic,
 * machine-independent assertion of the report path. (The live spawn's argv is proven by the opt-in live
 * demo.) With the spy's empty `nodeEids`, zero pairs are generated, but the `model` field is emitted
 * regardless — which is exactly what we assert.
 *
 * Adds NO runtime dependency, never touches package-lock.json, weakens/skips no existing test.
 */
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import type { OpenOptions, Repo } from "../index";
import { open } from "../index";
import { runCli } from "../cli";
import { RESOLVER_DEFAULT_MODEL } from "../linker/entity-resolver";

/** A spy `Repo` (Proxy) scripting the minimal reads `kip resolve --dry-run` performs. `nodeEids`/
 *  `edgeEids` return empty (⇒ zero candidate pairs), so no model is ever consulted; the CLI still
 *  reports the effective model in its `--json` output, which is what this suite pins. */
function makeSpyRepo(): Repo {
  const repo = new Proxy(
    {},
    {
      get(_t, prop) {
        if (typeof prop !== "string") return undefined;
        if (prop === "then") return undefined;
        return (..._args: unknown[]) => {
          switch (prop) {
            case "withScope":
              return repo;
            case "registerFunctionality":
              return Promise.resolve("F_reg");
            case "nodeEids":
              return Promise.resolve([]);
            case "edgeEids":
              return Promise.resolve([]);
            case "close":
              return undefined;
            default:
              return undefined;
          }
        };
      },
    },
  ) as unknown as Repo;
  return repo;
}

const tmpDirs: string[] = [];
function mkTmp(label: string): string {
  const dir = mkdtempSync(join(tmpdir(), `kip-d69-wiring-${label}-`));
  tmpDirs.push(dir);
  return dir;
}

/** An initialized kip repo dir + a resolvable keyring so `kip resolve`'s pre-flight passes; the injected
 *  spy provides all method behavior. */
async function initRepoWithKeyring(label: string): Promise<string> {
  const dir = mkTmp(label);
  const repo = await open({ dir, replicaId: `d69-wiring-${label}-${Date.now()}`, keyring: {}, createIfMissing: true });
  repo.close();
  expect(existsSync(join(dir, "manifest.json"))).toBe(true);
  writeFileSync(join(dir, "keyring.json"), JSON.stringify({ note: "test keyring" }));
  return dir;
}

/** Drive `kip resolve --dry-run --json [extraArgs]` through the spy; return the parsed JSON payload. */
async function runResolveDryRunJson(
  dir: string,
  extraArgs: string[],
  env: Record<string, string | undefined> = {},
): Promise<Record<string, unknown>> {
  const openRepo = async (_o: OpenOptions): Promise<Repo> => makeSpyRepo();
  const out: string[] = [];
  const err: string[] = [];
  const code = await runCli(
    ["resolve", "--dry-run", "--json", "--dir", dir, "--replica", "d69-wiring-replica", ...extraArgs],
    { cwd: dir, env, stdout: (c) => out.push(c), stderr: (c) => err.push(c), openRepo },
  );
  if (code !== 0) throw new Error(`kip resolve --dry-run exited ${code}: ${err.join("")}`);
  return JSON.parse(out.join("")) as Record<string, unknown>;
}

afterAll(() => {
  for (const dir of tmpDirs.splice(0)) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* best-effort */
    }
  }
});

describe("D-69 / ADR-B12d — kip resolve WIRES the effective model into its output (CLI-level)", () => {
  it("with NO --model, reports the structured-output-reliable resolver default (never a missing field)", async () => {
    const dir = await initRepoWithKeyring("default");
    const payload = await runResolveDryRunJson(dir, []);
    expect(payload.dryRun).toBe(true);
    // The load-bearing assertion: the report field exists AND is the resolver default — a dropped
    // `model:` emit or a revert to the global haiku default fails right here.
    expect(payload.model).toBe(RESOLVER_DEFAULT_MODEL);
  });

  it("with an explicit --model, reports that override VERBATIM (operator intent is visible)", async () => {
    const dir = await initRepoWithKeyring("override");
    const payload = await runResolveDryRunJson(dir, ["--model", "haiku"]);
    expect(payload.model).toBe("haiku");
  });

  it("honours KIP_RESOLVE_MODEL as the deployment default when --model is unset (env wired through)", async () => {
    const dir = await initRepoWithKeyring("env");
    const payload = await runResolveDryRunJson(dir, [], { KIP_RESOLVE_MODEL: "claude-opus-4-8" });
    expect(payload.model).toBe("claude-opus-4-8");
  });

  it("an explicit --model OUTRANKS KIP_RESOLVE_MODEL at the CLI layer (flag > env)", async () => {
    const dir = await initRepoWithKeyring("env-vs-flag");
    const payload = await runResolveDryRunJson(dir, ["--model", "sonnet"], { KIP_RESOLVE_MODEL: "haiku" });
    expect(payload.model).toBe("sonnet");
  });

  it("trims a padded --model override in the reported model (no stray whitespace leaks to the report)", async () => {
    const dir = await initRepoWithKeyring("trim");
    const payload = await runResolveDryRunJson(dir, ["--model", "  claude-opus-4-8  "]);
    expect(payload.model).toBe("claude-opus-4-8");
  });
});
