import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const script = resolve(root, "scripts/check-fix-strikes.mjs");

test("check:processes runs process validation and the strike-3 gate", () => {
  const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

  assert.match(pkg.scripts["check:processes"], /validate:processes/);
  assert.match(pkg.scripts["check:processes"], /check-fix-strikes\.mjs/);
});

test("check-fix-strikes blocks instrumentation-only algorithm changes", () => {
  const result = spawnSync(process.execPath, [
    script,
    "--bug-class",
    "scheduler-precedence",
    "--strike-count",
    "2",
    "--instrumentation-only",
    "--changed-file",
    "packages/sdk/src/runtime/orchestrateIteration.ts",
  ], { cwd: root, encoding: "utf8" });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[gate\]/);
  assert.match(result.stdout, /scheduler-precedence/);
  assert.match(result.stdout, /packages\/sdk\/src\/runtime\/orchestrateIteration\.ts/);
});

test("check-fix-strikes allows audited strike-3 override with structured output", () => {
  const result = spawnSync(process.execPath, [
    script,
    "--bug-class",
    "scheduler-precedence",
    "--strike-count",
    "2",
    "--instrumentation-only",
    "--changed-file",
    "packages/sdk/src/runtime/orchestrateIteration.ts",
    "--strike3-override",
    "deploy requires one targeted scheduler fix",
    "--override-actor",
    "tmuskal",
    "--override-timestamp",
    "2026-06-01T12:00:00.000Z",
  ], { cwd: root, encoding: "utf8" });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /\[gate\] strike-3 override applied/);
  assert.match(result.stdout, /"overrideAudit"/);
  assert.match(result.stdout, /"reason": "deploy requires one targeted scheduler fix"/);
});

test("process authoring docs describe strike-3 metadata and override fields", () => {
  const docs = readFileSync(resolve(root, "docs/agent-reference/process-authoring.md"), "utf8");

  assert.match(docs, /bugClass/);
  assert.match(docs, /instrumentation_only/);
  assert.match(docs, /--strike3-override/);
  assert.match(docs, /algorithm-change/);
});
