"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const {
  createRun,
} = require("../packages/sdk/dist/index.js");
const {
  runToCompletionWithFakeRunner,
} = require("../packages/sdk/dist/testing/index.js");

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const processPath = path.join(repoRoot, ".a5c", "processes", "docs", "cli-examples-traceability.js");
  const runsDir = path.join(repoRoot, ".a5c", "runs", "cli-examples-traceability");
  const runId = "cli-examples-traceability";

  fs.rmSync(runsDir, { recursive: true, force: true });

  const created = await createRun({
    runsDir,
    runId,
    request: "Regenerate CLI example verification artifacts",
    process: {
      processId: "docs/cli-examples-traceability",
      importPath: processPath,
      exportName: "process",
    },
    inputs: {
      workspaceRoot: repoRoot,
    },
  });

  const completion = await runToCompletionWithFakeRunner({
    runDir: created.runDir,
    async resolve(action) {
      if (action.kind !== "node") {
        return undefined;
      }

      const task = action.taskDef.node;
      if (!task || typeof task.entry !== "string") {
        return {
          status: "error",
          error: { message: `Node action ${action.effectId} is missing node.entry` },
        };
      }

      const commandArgs = [task.entry, ...(Array.isArray(task.args) ? task.args : [])];
      const child = spawnSync(process.execPath, commandArgs, {
        cwd: task.cwd || repoRoot,
        env: { ...process.env, ...(task.env || {}) },
        encoding: "utf8",
      });

      if (child.status !== 0) {
        return {
          status: "error",
          error: {
            message: `Node task failed with exit code ${child.status}`,
          },
          stdout: child.stdout || "",
          stderr: child.stderr || "",
        };
      }

      let value;
      try {
        value = JSON.parse(child.stdout);
      } catch (error) {
        return {
          status: "error",
          error: {
            message: `Node task emitted invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
          },
          stdout: child.stdout || "",
          stderr: child.stderr || "",
        };
      }

      return {
        status: "ok",
        value,
        stdout: child.stdout || "",
        stderr: child.stderr || "",
      };
    },
  });

  process.stdout.write(
    JSON.stringify(
      {
        runId: created.runId,
        runDir: created.runDir,
        completion,
      },
      null,
      2,
    ) + "\n",
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});
