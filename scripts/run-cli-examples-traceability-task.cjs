"use strict";

const path = require("node:path");

const {
  buildTraceabilityModel,
  writeTraceabilityArtifacts,
} = require("./lib/cli-examples-traceability.cjs");

function parseArgs(argv) {
  const [mode, ...rest] = argv;
  const options = { mode, workspaceRoot: null };
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === "--workspace-root") {
      options.workspaceRoot = rest[index + 1];
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.mode) {
    throw new Error("Missing task mode");
  }
  if (!options.workspaceRoot) {
    throw new Error("Missing --workspace-root");
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const workspaceRoot = path.resolve(options.workspaceRoot);

  if (options.mode !== "generate") {
    throw new Error(`Unsupported mode: ${options.mode}`);
  }

  const model = buildTraceabilityModel(workspaceRoot);
  const outputs = writeTraceabilityArtifacts(workspaceRoot, model);
  process.stdout.write(
    JSON.stringify(
      {
        ...outputs,
        workflowCommands: model.canonicalWorkflow.map((entry) => entry.command),
        traceabilityIndex: model.docsSurface.generatedIndex,
        generatedAt: model.generatedAt,
      },
      null,
      2,
    ) + "\n",
  );
}

main();
