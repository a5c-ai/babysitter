"use strict";

const path = require("node:path");

const {
  buildTraceabilityModel,
  writeTraceabilityArtifacts,
} = require("./lib/cli-examples-traceability.cjs");

function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const model = buildTraceabilityModel(repoRoot);
  const outputs = writeTraceabilityArtifacts(repoRoot, model);
  process.stdout.write(
    `[docs:examples:generate] wrote ${outputs.docsMarkdownPath}, ${outputs.docsJsonPath}, and ${outputs.artifactJsonPath}\n`,
  );
}

main();
