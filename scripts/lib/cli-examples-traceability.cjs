"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_SCRIPT_KEYS = [
  "build:runtime",
  "docs:prepare",
  "docs:examples:generate",
  "docs:examples:smoke",
  "docs:examples:verify",
  "docs:lint",
  "docs:snippets",
  "docs:qa",
];

const SDK_SCRIPT_KEYS = [
  "build",
  "test",
  "smoke:cli",
];

const SDK_TEST_PATHS = [
  "packages/sdk/src/testing/__tests__/runHarness.test.ts",
  "packages/sdk/src/testing/__tests__/parallelHarness.test.ts",
  "packages/sdk/src/runtime/__tests__/deterministicHarness.test.ts",
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function pickScripts(scripts, keys) {
  return keys
    .filter((key) => typeof scripts[key] === "string")
    .map((key) => ({ name: key, command: scripts[key] }));
}

function toPosixRelative(repoRoot, filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

function assertScriptExists(name, scripts, owner) {
  if (typeof scripts[name] !== "string") {
    throw new Error(`Expected ${owner} package.json to define script "${name}"`);
  }
}

function buildTraceabilityModel(repoRoot) {
  const rootPackagePath = path.join(repoRoot, "package.json");
  const sdkPackagePath = path.join(repoRoot, "packages", "sdk", "package.json");
  const rootPackage = readJson(rootPackagePath);
  const sdkPackage = readJson(sdkPackagePath);

  for (const scriptName of ["build:runtime", "docs:prepare", "docs:lint", "docs:snippets", "docs:qa"]) {
    assertScriptExists(scriptName, rootPackage.scripts, "root");
  }
  for (const scriptName of ["build", "test", "smoke:cli"]) {
    assertScriptExists(scriptName, sdkPackage.scripts, "@a5c-ai/babysitter-sdk");
  }

  const generatedAt = new Date().toISOString().slice(0, 10);
  const docsSurface = {
    cliExamples: "docs/cli-examples.md",
    testingReadme: "packages/sdk/src/testing/README.md",
    sdkReference: "library/reference/sdk.md",
    generatedIndex: "docs/generated/cli-examples-verification.md",
  };

  const canonicalWorkflow = [
    {
      step: "Install workspace dependencies from a fresh checkout",
      command: "npm ci",
      implementation: "package-lock.json",
      artifact: "node_modules/",
    },
    {
      step: "Build the SDK CLI used by the smoke harness",
      command: "npm run build --workspace=@a5c-ai/babysitter-sdk",
      implementation: "packages/sdk/package.json#scripts.build",
      artifact: "packages/sdk/dist/",
    },
    {
      step: "Generate repo docs artifacts, including this traceability index",
      command: "npm run docs:prepare",
      implementation: "package.json#scripts.docs:prepare",
      artifact: "docs/generated/cli-examples-verification.md",
    },
    {
      step: "Run the real CLI smoke harness",
      command: "npm run docs:examples:smoke",
      implementation: "package.json#scripts.docs:examples:smoke",
      artifact: "packages/sdk/test-fixtures/cli/runs/smoke/",
    },
    {
      step: "Validate fenced code samples and command references in staged docs",
      command: "npm run docs:snippets",
      implementation: "package.json#scripts.docs:snippets",
      artifact: "artifacts/docs-qa/docs-code-samples-report.json",
    },
    {
      step: "Run the full docs quality suite",
      command: "npm run docs:qa",
      implementation: "package.json#scripts.docs:qa",
      artifact: "artifacts/docs-qa/",
    },
  ];

  const verificationMatrix = [
    {
      surface: "CLI walkthrough command flow in docs/cli-examples.md",
      command: "npm run docs:examples:smoke",
      implementation: "packages/sdk/scripts/smoke-cli.js",
      evidence: "packages/sdk/test-fixtures/cli/runs/smoke/",
    },
    {
      surface: "Repo-published command references and fenced examples",
      command: "npm run docs:snippets",
      implementation: "scripts/docs-code-samples-check.cjs",
      evidence: "artifacts/docs-qa/docs-code-samples-report.json",
    },
    {
      surface: "Markdown/style validation for published docs",
      command: "npm run docs:lint",
      implementation: "package.json#scripts.docs:lint",
      evidence: "stdout/stderr from markdownlint-cli2 and docs-style-check.cjs",
    },
    {
      surface: "Deterministic SDK harness APIs referenced from docs",
      command: "npm run test --workspace=@a5c-ai/babysitter-sdk",
      implementation: "packages/sdk/package.json#scripts.test",
      evidence: SDK_TEST_PATHS.join(", "),
    },
    {
      surface: "Generated CLI/docs traceability inventory",
      command: "npm run docs:examples:generate",
      implementation: "scripts/generate-cli-examples-artifacts.cjs",
      evidence: "docs/generated/cli-examples-verification.{md,json}",
    },
  ];

  const sourceFiles = [
    "package.json",
    "packages/sdk/package.json",
    "packages/sdk/scripts/smoke-cli.js",
    "scripts/docs-code-samples-check.cjs",
    "scripts/docs-style-check.cjs",
    "scripts/docs-freshness-report.cjs",
    "docs/cli-examples.md",
    "packages/sdk/src/testing/README.md",
    "library/reference/sdk.md",
  ];

  return {
    generatedAt,
    generatedBy: "scripts/generate-cli-examples-artifacts.cjs",
    docsSurface,
    rootScripts: pickScripts(rootPackage.scripts, ROOT_SCRIPT_KEYS),
    sdkScripts: pickScripts(sdkPackage.scripts, SDK_SCRIPT_KEYS),
    canonicalWorkflow,
    verificationMatrix,
    sourceFiles,
    smokeHarness: {
      command: "npm run smoke:cli --workspace=@a5c-ai/babysitter-sdk",
      implementation: "packages/sdk/scripts/smoke-cli.js",
      defaultRunsDir: "packages/sdk/test-fixtures/cli/runs/smoke",
      supportedFlags: ["--runs-dir", "--cli", "--keep"],
    },
    notes: [
      "The current CLI smoke harness does not publish a --record baseline surface.",
      "The current repo does not define docs:testing-readme or docs:snippets:* package-local scripts.",
      "The CLI/example verification path only requires the SDK build; it does not depend on the broader build:runtime umbrella command.",
      "Use docs:examples:verify for the end-to-end repo workflow that combines docs generation, smoke verification, and docs QA.",
    ],
  };
}

function renderTable(headers, rows) {
  const lines = [];
  lines.push(`| ${headers.join(" | ")} |`);
  lines.push(`| ${headers.map(() => "---").join(" | ")} |`);
  for (const row of rows) {
    lines.push(`| ${row.join(" | ")} |`);
  }
  return lines.join("\n");
}

function renderMarkdown(model) {
  const workflowRows = model.canonicalWorkflow.map((entry) => [
    entry.step,
    `\`${entry.command}\``,
    `\`${entry.implementation}\``,
    `\`${entry.artifact}\``,
  ]);

  const matrixRows = model.verificationMatrix.map((entry) => [
    entry.surface,
    `\`${entry.command}\``,
    `\`${entry.implementation}\``,
    `\`${entry.evidence}\``,
  ]);

  const rootScriptRows = model.rootScripts.map((entry) => [
    entry.name,
    `\`${entry.command}\``,
  ]);

  const sdkScriptRows = model.sdkScripts.map((entry) => [
    entry.name,
    `\`${entry.command}\``,
  ]);

  return [
    "---",
    "title: CLI Example Verification Index",
    "description: Generated traceability index for the CLI walkthrough and its real verification surface.",
    `last_updated: ${model.generatedAt}`,
    "---",
    "",
    "# CLI Example Verification Index",
    "",
    `Generated by \`${model.generatedBy}\`.`,
    `Last refreshed: ${model.generatedAt}.`,
    "",
    `Published surfaces: \`${model.docsSurface.cliExamples}\`, \`${model.docsSurface.testingReadme}\`, and \`${model.docsSurface.sdkReference}\`.`,
    "",
    "## Canonical Workflow",
    "",
    renderTable(["Step", "Command", "Implementation", "Artifact"], workflowRows),
    "",
    "## Verification Matrix",
    "",
    renderTable(["Docs Surface", "Verification Command", "Backing Implementation", "Reviewable Evidence"], matrixRows),
    "",
    "## Script Inventory",
    "",
    "### Root Scripts",
    "",
    renderTable(["Script", "Command"], rootScriptRows),
    "",
    "### SDK Scripts",
    "",
    renderTable(["Script", "Command"], sdkScriptRows),
    "",
    "## Smoke Harness Contract",
    "",
    `- Command: \`${model.smokeHarness.command}\``,
    `- Implementation: \`${model.smokeHarness.implementation}\``,
    `- Default runs directory: \`${model.smokeHarness.defaultRunsDir}\``,
    `- Supported flags: ${model.smokeHarness.supportedFlags.map((flag) => `\`${flag}\``).join(", ")}`,
    "",
    "## Notes",
    "",
    ...model.notes.map((note) => `- ${note}`),
    "",
    "## Source Files",
    "",
    ...model.sourceFiles.map((file) => `- \`${file}\``),
    "",
  ].join("\n");
}

function writeTraceabilityArtifacts(repoRoot, model) {
  const docsGeneratedDir = path.join(repoRoot, "docs", "generated");
  const docsJsonPath = path.join(docsGeneratedDir, "cli-examples-verification.json");
  const docsMarkdownPath = path.join(docsGeneratedDir, "cli-examples-verification.md");
  const artifactDir = path.join(repoRoot, "artifacts", "docs-qa");
  const artifactJsonPath = path.join(artifactDir, "cli-examples-verification.json");

  fs.mkdirSync(docsGeneratedDir, { recursive: true });
  fs.mkdirSync(artifactDir, { recursive: true });

  const jsonPayload = JSON.stringify(model, null, 2) + "\n";
  fs.writeFileSync(docsJsonPath, jsonPayload, "utf8");
  fs.writeFileSync(artifactJsonPath, jsonPayload, "utf8");
  fs.writeFileSync(docsMarkdownPath, renderMarkdown(model), "utf8");

  return {
    docsJsonPath: toPosixRelative(repoRoot, docsJsonPath),
    docsMarkdownPath: toPosixRelative(repoRoot, docsMarkdownPath),
    artifactJsonPath: toPosixRelative(repoRoot, artifactJsonPath),
  };
}

module.exports = {
  buildTraceabilityModel,
  writeTraceabilityArtifacts,
};
