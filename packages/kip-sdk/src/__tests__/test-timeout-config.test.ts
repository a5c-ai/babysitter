/**
 * test-timeout-config.test.ts — SUITE-HARDENING guard (work item `suite-hardening`, sub-goals (b)
 * timeout flake + (d) cross-OS CI). FROZEN, spec-driving, authored BEFORE the fix; both describe
 * blocks FAIL TODAY.
 *
 * (b) TIMEOUT CHARACTERIZATION (already established): the recurring "5000ms" parallel/serial-under-
 *     load flake in the git-heavy conformance files (inv-12, m2-surface, and rotating others) is NOT
 *     a logic bug — it is a DIFFERENT slow git-substrate test each run blowing vitest's DEFAULT 5s
 *     testTimeout under load. The suite passes green at `--test-timeout=30000`. The durable fix is to
 *     raise the CONFIGURED testTimeout; this guard PINS it so it can never regress back to the flaky
 *     5000 default. `vitest.config.ts` sets no `testTimeout` today (⇒ default 5000) ⇒ this FAILS now.
 *
 * (d) CROSS-OS CI: a named workflow must run the kip CONFORMANCE SUITE on BOTH ubuntu-latest and
 *     windows-latest. Today only `.github/workflows/kip-inv12-golden-digest.yml` is cross-OS, and it
 *     runs a SINGLE test file (inv12-golden-digest.test.ts), not the conformance suite ⇒ this FAILS
 *     now. The implement round adds e.g. `.github/workflows/kip-conformance-cross-os.yml`.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const HERE = dirname(fileURLToPath(import.meta.url)); // .../packages/kip-sdk/src/__tests__
const CONFIG_PATH = resolve(HERE, "../../vitest.config.ts");
const WORKFLOWS_DIR = resolve(HERE, "../../../../.github/workflows");

/** Per the (b) characterization: green at 30000ms, flaky at the 5000 default. Pin a floor well above
 * 5000 (and comfortably above the observed slow-git tail) so it can't silently regress. */
const MIN_TEST_TIMEOUT_MS = 15000;

describe("suite-hardening (b): vitest testTimeout pins the git-substrate slow-test flake", () => {
  it(`vitest.config.ts sets testTimeout >= ${MIN_TEST_TIMEOUT_MS}ms (not the flaky 5000 default)`, () => {
    const src = readFileSync(CONFIG_PATH, "utf8");
    const match = src.match(/testTimeout\s*:\s*(\d+)/);
    expect(
      match,
      "vitest.config.ts must EXPLICITLY set test.testTimeout — the implicit 5000ms default flakes the " +
        "git-heavy conformance files (inv-12 / m2-surface / rotating others) under parallel load",
    ).not.toBeNull();
    const configured = match ? Number(match[1]) : 0;
    expect(
      configured,
      `configured testTimeout is ${configured}ms; must be >= ${MIN_TEST_TIMEOUT_MS}ms per the ` +
        `characterization (green at 30000, flaky at the 5000 default)`,
    ).toBeGreaterThanOrEqual(MIN_TEST_TIMEOUT_MS);
  });
});

describe("suite-hardening (d): cross-OS CI runs the kip conformance suite on ubuntu + windows", () => {
  it("a workflow runs the FULL kip conformance suite on both windows-latest and ubuntu-latest", () => {
    const workflowFiles = readdirSync(WORKFLOWS_DIR).filter(
      (n) => n.endsWith(".yml") || n.endsWith(".yaml"),
    );
    const qualifying = workflowFiles.filter((f) => {
      const body = readFileSync(resolve(WORKFLOWS_DIR, f), "utf8");
      const bothOS = body.includes("windows-latest") && body.includes("ubuntu-latest");
      // Must RUN the kip conformance suite (the whole conformance dir / the kip-sdk package test
      // script) — NOT merely a single golden-digest test file. kip-inv12-golden-digest.yml runs
      // `vitest run src/__tests__/inv12-golden-digest.test.ts` with no workspace/test:kip/conformance-
      // dir run command, so none of these three run-signatures match it.
      const runsConformanceSuite =
        /vitest run\s+src\/__tests__\/conformance(?!\S*\.test\.ts)/.test(body) ||
        /--workspace=@a5c-ai\/kip-sdk/.test(body) ||
        /\btest:kip\b/.test(body);
      return bothOS && runsConformanceSuite;
    });
    expect(
      qualifying,
      "no workflow runs the FULL kip conformance suite on BOTH windows-latest and ubuntu-latest. " +
        "Add e.g. .github/workflows/kip-conformance-cross-os.yml with a [windows-latest, ubuntu-latest] " +
        "matrix that runs the kip conformance suite (e.g. `vitest run src/__tests__/conformance` in " +
        "packages/kip-sdk, or `npm run test --workspace=@a5c-ai/kip-sdk`).",
    ).not.toEqual([]);
  });
});
