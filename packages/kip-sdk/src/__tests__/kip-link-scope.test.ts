/**
 * Debt-closure test for `kip link --include/--exclude` (DEBTS.md D-64, ADR-B11).
 *
 * The flags were declared in ADR-B11 and parsed (they are in the `--include`/`--exclude` repeatable
 * arg set) but INERT: `cmdLink` hardcoded `nodeEids({ prefixes: ['code:','doc:'] })`. They are now
 * wired — `--include <prefix>` (repeatable) REPLACES the enumerated prefixes; `--exclude <prefix>`
 * (repeatable) drops any node whose eid starts with an excluded prefix. This drives the REAL CLI
 * (`runCli(['link', ...])`) through a spy `Repo` and asserts the flags change which nodes are considered.
 *
 * Adds NO runtime dependency, never touches package-lock.json, and weakens/skips no existing test.
 */
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import type { NodeView, OpenOptions, Repo } from "../index";
import { open } from "../index";
import { runCli } from "../cli";

// --- harness: a spy Repo behind an initialized on-disk repo + keyring (satisfies pre-flight) --------

interface RecordedCall {
  method: string;
  args: unknown[];
}

/** The fixed node universe the spy's `nodeEids` filters by the prefixes the CLI passes — so the test
 *  observes exactly which nodes each flag combination lets through. */
const UNIVERSE = ["code:module:a", "code:symbol:a#f", "doc:concept:b", "doc:blob:c"];

function nodeView(eid: string): NodeView {
  return {
    eid,
    kind: eid.startsWith("code:") ? "code:module" : "doc:concept",
    props: {},
    provenance: { author: "spy", signature: "sig", publicKeyFingerprint: "fpr", signedFields: [] },
  };
}

/** A spy `Repo` (Proxy) that scripts the reads `cmdLink` performs and records every call. `nodeEids`
 *  honors the `prefixes` it is handed against `UNIVERSE`; `runAcquisition` records the node inventory. */
function makeSpyRepo(): { repo: Repo; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const repo = new Proxy(
    {},
    {
      get(_t, prop) {
        if (typeof prop !== "string") return undefined;
        if (prop === "then") return undefined;
        return (...args: unknown[]) => {
          calls.push({ method: prop, args });
          switch (prop) {
            case "withScope":
              return repo;
            case "registerFunctionality":
              return Promise.resolve("F_reg");
            case "nodeEids": {
              const prefixes = (args[0] as { prefixes?: string[] } | undefined)?.prefixes ?? [];
              return Promise.resolve(UNIVERSE.filter((e) => prefixes.some((p) => e.startsWith(p))));
            }
            case "getNode":
              return Promise.resolve(nodeView(args[0] as string));
            case "runAcquisition":
              return Promise.resolve({ facts: [] });
            case "close":
              return undefined;
            default:
              return undefined;
          }
        };
      },
    },
  ) as unknown as Repo;
  return { repo, calls };
}

const tmpDirs: string[] = [];
function mkTmp(label: string): string {
  const dir = mkdtempSync(join(tmpdir(), `kip-link-scope-${label}-`));
  tmpDirs.push(dir);
  return dir;
}

/** An initialized kip repo dir (real SDK `open`) + a resolvable keyring, so `kip link`'s pre-flight
 *  (requireInitialized + requireKeyring) passes; the injected spy provides all method behavior. */
async function initRepoWithKeyring(label: string): Promise<string> {
  const dir = mkTmp(label);
  const repo = await open({ dir, replicaId: `link-scope-${label}-${Date.now()}`, keyring: {}, createIfMissing: true });
  repo.close();
  expect(existsSync(join(dir, "manifest.json"))).toBe(true);
  writeFileSync(join(dir, "keyring.json"), JSON.stringify({ note: "test keyring" }));
  return dir;
}

async function runLink(dir: string, extraArgs: string[]): Promise<{ code: number; calls: RecordedCall[] }> {
  const { repo, calls } = makeSpyRepo();
  const openRepo = async (_o: OpenOptions): Promise<Repo> => repo;
  const out: string[] = [];
  const err: string[] = [];
  const code = await runCli(["link", "--dir", dir, "--replica", "link-scope-replica", ...extraArgs], {
    cwd: dir,
    env: {},
    stdout: (c) => out.push(c),
    stderr: (c) => err.push(c),
    openRepo,
  });
  if (code !== 0) throw new Error(`kip link exited ${code}: ${err.join("")}`);
  return { code, calls };
}

/** The eids of the inventory `cmdLink` handed to `runAcquisition` (input.nodes). */
function inventoryEids(calls: RecordedCall[]): string[] {
  const acq = [...calls].reverse().find((c) => c.method === "runAcquisition");
  const input = acq?.args[1] as { nodes?: Array<{ eid: string }> } | undefined;
  return (input?.nodes ?? []).map((n) => n.eid);
}

function nodeEidsPrefixes(calls: RecordedCall[]): string[] | undefined {
  const call = [...calls].reverse().find((c) => c.method === "nodeEids");
  return (call?.args[0] as { prefixes?: string[] } | undefined)?.prefixes;
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

describe("kip link — --include/--exclude scope the linked inventory (D-64)", () => {
  it("default (no flags) enumerates code:+doc: — the ADR-B11 default is preserved", async () => {
    const dir = await initRepoWithKeyring("default");
    const { code, calls } = await runLink(dir, []);
    expect(code).toBe(0);
    expect(nodeEidsPrefixes(calls)).toEqual(["code:", "doc:"]);
    expect(inventoryEids(calls).sort()).toEqual(
      ["code:module:a", "code:symbol:a#f", "doc:blob:c", "doc:concept:b"].sort(),
    );
  });

  it("--include REPLACES the enumerated prefixes (only matching nodes are considered)", async () => {
    const dir = await initRepoWithKeyring("include");
    const { code, calls } = await runLink(dir, ["--include", "code:"]);
    expect(code).toBe(0);
    // The enumeration prefix set is now exactly what --include named — not the code:+doc: default.
    expect(nodeEidsPrefixes(calls)).toEqual(["code:"]);
    expect(inventoryEids(calls).sort()).toEqual(["code:module:a", "code:symbol:a#f"].sort());
  });

  it("--include is repeatable (both named prefixes are enumerated)", async () => {
    const dir = await initRepoWithKeyring("include-multi");
    const { code, calls } = await runLink(dir, ["--include", "code:symbol:", "--include", "doc:concept:"]);
    expect(code).toBe(0);
    expect(nodeEidsPrefixes(calls)).toEqual(["code:symbol:", "doc:concept:"]);
    expect(inventoryEids(calls).sort()).toEqual(["code:symbol:a#f", "doc:concept:b"].sort());
  });

  it("--exclude drops nodes whose eid starts with an excluded prefix (default enumeration otherwise)", async () => {
    const dir = await initRepoWithKeyring("exclude");
    const { code, calls } = await runLink(dir, ["--exclude", "doc:"]);
    expect(code).toBe(0);
    // Enumeration prefixes unchanged (default), but every doc: node is dropped from the inventory.
    expect(nodeEidsPrefixes(calls)).toEqual(["code:", "doc:"]);
    expect(inventoryEids(calls).sort()).toEqual(["code:module:a", "code:symbol:a#f"].sort());
  });

  it("--include and --exclude compose (include the set, then subtract an excluded prefix)", async () => {
    const dir = await initRepoWithKeyring("both");
    const { code, calls } = await runLink(dir, ["--include", "code:", "--include", "doc:", "--exclude", "code:symbol:"]);
    expect(code).toBe(0);
    expect(nodeEidsPrefixes(calls)).toEqual(["code:", "doc:"]);
    // code:symbol:a#f is enumerated (via code:) then excluded; the rest remain.
    expect(inventoryEids(calls).sort()).toEqual(["code:module:a", "doc:blob:c", "doc:concept:b"].sort());
  });
});
