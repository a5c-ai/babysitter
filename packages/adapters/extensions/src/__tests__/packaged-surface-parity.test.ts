/**
 * FIX-004 — packaged-artifact gate for @a5c-ai/extensions-adapter.
 *
 * Verifies the CONSUMER ARTIFACT, not the workspace. The published 6.0.0
 * tarball contained only `package.json` and `README.md`, and the declared
 * compatibility bin `dist/extensions-adapter.js` (plural) was never emitted by
 * the build at all — the authoritative source is `src/extension-adapter.ts`
 * (singular). This gate proves both defects stay fixed:
 *
 *   - the packed tarball contains `main`, `types`, the primary bin and the
 *     deprecated compatibility bin, and both bins are executable (shebang plus
 *     a working `node_modules/.bin` shim in a clean consumer);
 *   - BOTH bin names run from the packed tarball;
 *   - the compatibility bin emits the deprecation warning on stderr and
 *     returns the exit code delegated from `runCli` (0 for `--help`,
 *     1 for an unknown command), while the canonical bin stays silent.
 *
 * The heavy lifting (build -> exact tarball -> surface/shebang checks -> clean
 * temporary install -> imports -> consumer typecheck -> bin smoke -> the
 * package's own `verify:release`) is delegated to the generic FIX-011 release
 * verifier (scripts/verify-release-artifacts.mjs) so this gate cannot drift
 * from the release gate; the extensions-specific assertions are then layered on
 * the verifier's machine-readable report and on the clean consumer it kept.
 *
 * Invocation (wired in package.json, run by CI and the release gate):
 *   npm run test:packaged-surface-parity --workspace=@a5c-ai/extensions-adapter
 *
 * Never publishes and never mutates the npm registry; installing the packed
 * tarball may fetch declared dependencies read-only.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(TEST_DIR, "..", "..");
const REPO_ROOT = path.resolve(PACKAGE_ROOT, "..", "..", "..");
const PACKAGE_NAME = "@a5c-ai/extensions-adapter";
const VERIFIER_PATH = path.join(REPO_ROOT, "scripts", "verify-release-artifacts.mjs");
const KNOWN_DEFECTS_PATH = path.join(REPO_ROOT, "scripts", "known-package-defects.json");
// Matches safeReportName() in scripts/verify-release-artifacts.mjs.
const REPORT_BASENAME = "a5c-ai__extensions-adapter.json";

const CANONICAL_BIN = "adapters-extensions";
const COMPAT_BIN = "extensions-adapter";
// Emitted from src/extension-adapter.ts (SINGULAR — the authoritative source).
const COMPAT_BIN_TARGET = "dist/extension-adapter.js";
const CANONICAL_BIN_TARGET = "dist/cli.js";
const DEPRECATION_WARNING = `[adapters] "${COMPAT_BIN}" is deprecated, use "${CANONICAL_BIN}" instead.`;
// runCli() returns 1 for an unrecognised command; the compatibility bin must
// hand that exact status back to the shell instead of swallowing it.
const UNKNOWN_COMMAND = "definitely-not-a-command";

const REQUIRED_TARBALL_ENTRIES = [
  "package.json",
  "README.md",
  "dist/index.js",
  "dist/index.d.ts",
  CANONICAL_BIN_TARGET,
  COMPAT_BIN_TARGET,
];

const REQUIRED_STEPS = [
  "build",
  "pack",
  "surfaces",
  "shebangs",
  "install",
  "imports",
  "typecheck",
  "bins",
  "verifyRelease",
];

interface VerifierStep {
  status: "passed" | "failed" | "skipped";
  reason?: string;
  error?: string;
}

interface VerifierReport {
  package: string;
  status: "passed" | "failed";
  failures: string[];
  steps: Record<string, VerifierStep>;
  tarball: { filename: string | null; files: string[] };
  tempDir?: string;
  consumerDir?: string;
}

function fail(message: string): never {
  process.stderr.write(`packaged-surface-parity: FAIL — ${message}\n`);
  process.exit(1);
}

function requireFile(filePath: string, what: string): void {
  if (!fs.existsSync(filePath)) {
    fail(`${what} is missing at ${filePath}`);
  }
}

function readManifest(): { name: string; bin?: Record<string, string> } {
  return JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8")) as {
    name: string;
    bin?: Record<string, string>;
  };
}

function assertNoStaleAllowlistEntry(): void {
  const defects = JSON.parse(fs.readFileSync(KNOWN_DEFECTS_PATH, "utf8")) as {
    packedArtifact?: Array<{ fixId: string; package: string }>;
  };
  const stale = (defects.packedArtifact ?? []).filter((entry) => entry.package === PACKAGE_NAME);
  if (stale.length > 0) {
    fail(
      `${PACKAGE_NAME} is still listed under packedArtifact in scripts/known-package-defects.json ` +
        `(${stale.map((entry) => entry.fixId).join(", ")}). FIX-004 is fixed: the packed artifact is ` +
        "verified strictly here, so the stale allowlist entry must be deleted.",
    );
  }
}

function assertManifestBins(): void {
  const manifest = readManifest();
  if (manifest.name !== PACKAGE_NAME) {
    fail(`expected package.json name ${PACKAGE_NAME}, found ${manifest.name}`);
  }
  const bin = manifest.bin ?? {};
  const expected: Record<string, string> = {
    [CANONICAL_BIN]: `./${CANONICAL_BIN_TARGET}`,
    [COMPAT_BIN]: `./${COMPAT_BIN_TARGET}`,
  };
  for (const [name, target] of Object.entries(expected)) {
    if (bin[name] !== target) {
      fail(`package.json bin.${name} is ${bin[name] ?? "<missing>"}, expected ${target}`);
    }
  }
}

function assertTarball(report: VerifierReport): void {
  const files = new Set(report.tarball.files);
  const missing = REQUIRED_TARBALL_ENTRIES.filter((entry) => !files.has(entry));
  if (missing.length > 0) {
    fail(
      `packed tarball (${report.tarball.filename ?? "<none>"}) is missing declared entrypoints: ` +
        `${missing.join(", ")} — this is the published 6.0.0 defect (FIX-004)`,
    );
  }
}

function assertSteps(report: VerifierReport): void {
  const problems = REQUIRED_STEPS.filter((name) => report.steps[name]?.status !== "passed").map(
    (name) =>
      `verifier step ${name} did not pass (status: ${report.steps[name]?.status ?? "absent"}${
        report.steps[name]?.reason ? `, reason: ${report.steps[name]?.reason}` : ""
      }${report.steps[name]?.error ? `, error: ${report.steps[name]?.error}` : ""})`,
  );
  if (problems.length > 0) {
    fail(`packed-artifact verification incomplete:\n  - ${problems.join("\n  - ")}`);
  }
}

interface BinRun {
  status: number | null;
  stdout: string;
  stderr: string;
}

function runBin(consumerDir: string, binName: string, args: string[]): BinRun {
  const shimPath = path.join(consumerDir, "node_modules", ".bin", binName);
  if (!fs.existsSync(shimPath)) {
    fail(`bin ${binName} was not linked into node_modules/.bin of the clean consumer`);
  }
  const result = spawnSync(shimPath, args, {
    cwd: consumerDir,
    encoding: "utf8",
    timeout: 120000,
  });
  if (result.error) {
    fail(`bin ${binName} ${args.join(" ")} could not be executed: ${result.error.message}`);
  }
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function assertPackedBinBehavior(consumerDir: string): void {
  const problems: string[] = [];

  const canonicalHelp = runBin(consumerDir, CANONICAL_BIN, ["--help"]);
  if (canonicalHelp.status !== 0) {
    problems.push(`${CANONICAL_BIN} --help exited ${canonicalHelp.status}\n${canonicalHelp.stderr}`);
  }
  if (!canonicalHelp.stdout.includes("Cross-harness plugin compiler")) {
    problems.push(`${CANONICAL_BIN} --help did not print the compiler usage banner`);
  }
  if (canonicalHelp.stderr.includes(DEPRECATION_WARNING)) {
    problems.push(`${CANONICAL_BIN} must not print the compatibility deprecation warning`);
  }

  const compatHelp = runBin(consumerDir, COMPAT_BIN, ["--help"]);
  if (compatHelp.status !== 0) {
    problems.push(`${COMPAT_BIN} --help exited ${compatHelp.status}\n${compatHelp.stderr}`);
  }
  if (!compatHelp.stdout.includes("Cross-harness plugin compiler")) {
    problems.push(`${COMPAT_BIN} --help did not delegate to the canonical CLI`);
  }
  if (!compatHelp.stderr.includes(DEPRECATION_WARNING)) {
    problems.push(
      `${COMPAT_BIN} --help did not emit the deprecation warning on stderr; got: ${JSON.stringify(
        compatHelp.stderr,
      )}`,
    );
  }

  // Delegated exit code: an unknown command makes runCli() return 1, and both
  // bins must surface that status verbatim.
  const canonicalUnknown = runBin(consumerDir, CANONICAL_BIN, [UNKNOWN_COMMAND]);
  const compatUnknown = runBin(consumerDir, COMPAT_BIN, [UNKNOWN_COMMAND]);
  if (canonicalUnknown.status !== 1) {
    problems.push(`${CANONICAL_BIN} ${UNKNOWN_COMMAND} exited ${canonicalUnknown.status}, expected 1`);
  }
  if (compatUnknown.status !== canonicalUnknown.status) {
    problems.push(
      `${COMPAT_BIN} ${UNKNOWN_COMMAND} exited ${compatUnknown.status} but the canonical CLI exited ` +
        `${canonicalUnknown.status} — the compatibility bin must return the delegated status`,
    );
  }
  if (!compatUnknown.stderr.includes(DEPRECATION_WARNING)) {
    problems.push(`${COMPAT_BIN} ${UNKNOWN_COMMAND} did not emit the deprecation warning on stderr`);
  }

  if (problems.length > 0) {
    fail(`packed-tarball bin behavior violations:\n  - ${problems.join("\n  - ")}`);
  }
}

function cleanupVerifierTemp(report: VerifierReport): void {
  if (!report.tempDir) return;
  fs.rmSync(report.tempDir, { recursive: true, force: true });
  const parent = path.dirname(report.tempDir);
  if (path.basename(parent).startsWith("fix011-release-verifier-")) {
    fs.rmSync(parent, { recursive: true, force: true });
  }
}

function main(): number {
  requireFile(VERIFIER_PATH, "FIX-011 release verifier");
  requireFile(KNOWN_DEFECTS_PATH, "known-package-defects allowlist");
  assertNoStaleAllowlistEntry();
  assertManifestBins();

  const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), "extensions-packaged-surface-"));
  const verifierArgs = [
    VERIFIER_PATH,
    "--package",
    PACKAGE_NAME,
    "--report-dir",
    reportDir,
    // Keep the clean consumer so the packed bins can be executed below.
    "--keep-temp",
  ];

  process.stderr.write(
    `packaged-surface-parity: node ${[
      path.relative(REPO_ROOT, VERIFIER_PATH),
      ...verifierArgs.slice(1),
    ].join(" ")}\n`,
  );
  const result = spawnSync(process.execPath, verifierArgs, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) {
    fail(`could not run the release verifier: ${result.error.message}`);
  }

  const reportPath = path.join(reportDir, REPORT_BASENAME);
  requireFile(reportPath, `verifier report for ${PACKAGE_NAME}`);
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as VerifierReport;

  if (report.status === "failed") {
    fail(
      `packed artifact is broken for clean consumers:\n  - ${report.failures.join("\n  - ")}\n` +
        `report kept at ${reportPath}`,
    );
  }
  if (result.status !== 0) {
    fail(
      `release verifier exited ${result.status} despite a passing package report — see verifier ` +
        `output above. report kept at ${reportPath}`,
    );
  }

  assertTarball(report);
  assertSteps(report);

  if (!report.consumerDir) {
    fail(
      "verifier report did not record consumerDir; scripts/verify-release-artifacts.mjs must " +
        "expose the retained clean consumer under --keep-temp",
    );
  }
  requireFile(report.consumerDir, "retained clean consumer directory");
  assertPackedBinBehavior(report.consumerDir);

  cleanupVerifierTemp(report);
  fs.rmSync(reportDir, { recursive: true, force: true });
  process.stderr.write(
    "packaged-surface-parity: PASS — packed tarball ships main, types and both bins; " +
      `${CANONICAL_BIN} and ${COMPAT_BIN} both run from a clean install, and ${COMPAT_BIN} ` +
      "emits the deprecation warning while returning the delegated exit code.\n",
  );
  return 0;
}

process.exit(main());
