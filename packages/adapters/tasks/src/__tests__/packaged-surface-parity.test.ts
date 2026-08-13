/**
 * FIX-012 — packaged-surface parity gate for @a5c-ai/tasks-adapter.
 *
 * Verifies the CONSUMER ARTIFACT, not the workspace: it builds and packs the
 * tasks adapter, installs the exact tarball into a fresh temporary project
 * outside the repository, imports the package root plus every `exports`
 * runtime subpath, typechecks a minimal consumer against the shipped
 * declarations, and smoke-runs both bins. The heavy lifting is delegated to
 * the generic FIX-011 release verifier (scripts/verify-release-artifacts.mjs)
 * so this gate cannot drift from the release gate; this script then asserts
 * tasks-adapter-specific PARITY on the verifier's machine-readable report:
 *
 *   - every `exports` subpath declared in package.json was actually imported
 *     from the clean consumer (and nothing more);
 *   - every typed subpath was typechecked;
 *   - the tarball contains ONLY the documented published surface
 *     (package.json, README.md, dist/, responder/).
 *
 * While @modelcontextprotocol/sdk is missing from the manifest (FIX-002),
 * this test FAILS: the clean consumer cannot import the root or ./mcp
 * subpath (ERR_MODULE_NOT_FOUND). That failure is the point — it models the
 * broken published 6.0.0 artifact. CI runs this gate with
 * `--allow-known-failures`, which tolerates ONLY the failure tracked under
 * `packedArtifact` in scripts/known-package-defects.json (FIX-002) and, once
 * FIX-002 lands, hard-fails as stale until that allowlist entry is deleted.
 *
 * Invocation (this exact command is wired in package.json):
 *   npm run test:packaged-surface-parity --workspace=@a5c-ai/tasks-adapter
 * CI/prepublication invocation:
 *   npm run test:packaged-surface-parity --workspace=@a5c-ai/tasks-adapter -- --allow-known-failures
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
const PACKAGE_NAME = "@a5c-ai/tasks-adapter";
const MCP_SDK = "@modelcontextprotocol/sdk";
const VERIFIER_PATH = path.join(REPO_ROOT, "scripts", "verify-release-artifacts.mjs");
const KNOWN_DEFECTS_PATH = path.join(REPO_ROOT, "scripts", "known-package-defects.json");
// Matches safeReportName() in scripts/verify-release-artifacts.mjs.
const REPORT_BASENAME = "a5c-ai__tasks-adapter.json";
// The only tarball contents the package intentionally publishes; see
// package.json#files, README.md "Published Package Contents", and
// specs/architecture.md "Packaging Facts".
const ALLOWED_TARBALL_ROOTS = ["dist/", "responder/"];
const ALLOWED_TARBALL_FILES = new Set(["package.json", "README.md"]);

interface VerifierStep {
  status: "passed" | "failed" | "skipped";
  error?: string;
  importedSubpaths?: string[];
  typecheckedSubpaths?: string[];
}

interface VerifierReport {
  package: string;
  status: "passed" | "failed";
  failures: string[];
  steps: Record<string, VerifierStep>;
  tarball: { filename: string | null; files: string[] };
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

function expectedRuntimeSubpaths(): string[] {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8"),
  ) as { name: string; exports?: Record<string, unknown> };
  if (manifest.name !== PACKAGE_NAME) {
    fail(`expected package.json name ${PACKAGE_NAME}, found ${manifest.name}`);
  }
  const exportsField = manifest.exports;
  if (!exportsField || typeof exportsField !== "object" || Array.isArray(exportsField)) {
    fail("package.json must declare an exports subpath map for the parity gate");
  }
  const ids: string[] = [];
  for (const key of Object.keys(exportsField)) {
    if (key === "./package.json" || key.includes("*")) continue;
    if (key === ".") {
      ids.push(PACKAGE_NAME);
    } else if (key.startsWith("./")) {
      ids.push(`${PACKAGE_NAME}${key.slice(1)}`);
    } else {
      fail(`unexpected exports key ${JSON.stringify(key)} — extend the parity gate deliberately`);
    }
  }
  if (ids.length === 0) {
    fail("package.json exports map declared no runtime subpaths");
  }
  return ids.sort();
}

function assertParity(report: VerifierReport): void {
  const problems: string[] = [];
  const expected = expectedRuntimeSubpaths();

  const imports = report.steps.imports;
  const imported = [...(imports?.importedSubpaths ?? [])].sort();
  const missing = expected.filter((id) => !imported.includes(id));
  const extra = imported.filter((id) => !expected.includes(id));
  if (imports?.status !== "passed") {
    problems.push(`imports step did not pass (status: ${imports?.status ?? "absent"})`);
  }
  if (missing.length > 0) {
    problems.push(`exports subpaths never imported from the clean consumer: ${missing.join(", ")}`);
  }
  if (extra.length > 0) {
    problems.push(`clean consumer imported subpaths not declared in exports: ${extra.join(", ")}`);
  }

  const typecheck = report.steps.typecheck;
  const typechecked = [...(typecheck?.typecheckedSubpaths ?? [])].sort();
  const untyped = expected.filter((id) => !typechecked.includes(id));
  if (typecheck?.status !== "passed") {
    problems.push(`consumer typecheck step did not pass (status: ${typecheck?.status ?? "absent"})`);
  }
  if (untyped.length > 0) {
    problems.push(`exports subpaths never typechecked from the clean consumer: ${untyped.join(", ")}`);
  }

  for (const stepName of ["build", "pack", "surfaces", "shebangs", "install", "bins"]) {
    const step = report.steps[stepName];
    if (step?.status !== "passed") {
      problems.push(`verifier step ${stepName} did not pass (status: ${step?.status ?? "absent"})`);
    }
  }

  const strayFiles = report.tarball.files.filter(
    (file) =>
      !ALLOWED_TARBALL_FILES.has(file) &&
      !ALLOWED_TARBALL_ROOTS.some((root) => file.startsWith(root)),
  );
  if (strayFiles.length > 0) {
    problems.push(
      `tarball contains files outside the documented published surface (${[
        ...ALLOWED_TARBALL_FILES,
      ].join(", ")}, ${ALLOWED_TARBALL_ROOTS.join(", ")}): ${strayFiles.join(", ")}`,
    );
  }

  if (problems.length > 0) {
    fail(`packaged-surface parity violations:\n  - ${problems.join("\n  - ")}`);
  }
}

function knownDefectSignatureMatches(report: VerifierReport): boolean {
  // Tolerating a known failure is only valid when it is the EXACT tracked
  // FIX-002 defect: the clean consumer cannot resolve @modelcontextprotocol/sdk.
  // Any other failure kind must stay loud even in --allow-known-failures mode.
  const defects = JSON.parse(fs.readFileSync(KNOWN_DEFECTS_PATH, "utf8")) as {
    packedArtifact?: Array<{ fixId: string; package: string }>;
  };
  const tracked = (defects.packedArtifact ?? []).some(
    (entry) => entry.package === PACKAGE_NAME,
  );
  if (!tracked) return false;
  return report.failures.some((failure) => failure.includes(MCP_SDK));
}

function main(): number {
  const allowKnownFailures = process.argv.slice(2).includes("--allow-known-failures");

  requireFile(VERIFIER_PATH, "FIX-011 release verifier");
  requireFile(KNOWN_DEFECTS_PATH, "known-package-defects allowlist");

  const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), "tasks-packaged-surface-"));
  const verifierArgs = [
    VERIFIER_PATH,
    "--package",
    PACKAGE_NAME,
    "--report-dir",
    reportDir,
  ];
  if (allowKnownFailures) {
    verifierArgs.push("--allow-known-failures");
  }

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
    const mcpDefect = report.failures.some((failure) => failure.includes(MCP_SDK));
    if (mcpDefect) {
      process.stderr.write(
        `packaged-surface-parity: clean consumer cannot resolve ${MCP_SDK} — the FIX-002 ` +
          "manifest defect (undeclared MCP SDK runtime dependency).\n",
      );
    }
    if (allowKnownFailures && result.status === 0 && knownDefectSignatureMatches(report)) {
      process.stderr.write(
        "packaged-surface-parity: tolerating the tracked FIX-002 known failure " +
          "(scripts/known-package-defects.json packedArtifact). This tolerance dies " +
          "with FIX-002: once the manifest is fixed, the stale allowlist entry fails this gate.\n",
      );
      fs.rmSync(reportDir, { recursive: true, force: true });
      return 0;
    }
    fail(
      `packaged surface is broken for clean consumers:\n  - ${report.failures.join("\n  - ")}\n` +
        `report kept at ${reportPath}`,
    );
  }

  if (result.status !== 0) {
    // The verifier can fail with a passing package report, e.g. a stale
    // known-failure allowlist entry after FIX-002 lands. Surface it verbatim.
    fail(
      `release verifier exited ${result.status} despite a passing package report — ` +
        `see verifier output above (stale scripts/known-package-defects.json entry?). ` +
        `report kept at ${reportPath}`,
    );
  }

  assertParity(report);
  fs.rmSync(reportDir, { recursive: true, force: true });
  process.stderr.write(
    "packaged-surface-parity: PASS — packed tarball installs, imports, typechecks, " +
      "and matches the documented published surface in a clean consumer.\n",
  );
  return 0;
}

process.exit(main());
