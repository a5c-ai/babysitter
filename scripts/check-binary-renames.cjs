#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const specPath = "docs/agent-mux/terminology-and-structure-gaps/binary-renames.md";
const warningPrefix = "[agent-mux]";

const binaryRenames = [
  {
    packageName: "@a5c-ai/agent-mux",
    manifestPath: "packages/agent-mux/sdk/package.json",
    canonicalBin: "agent-mux",
    canonicalTarget: "./dist/bin/agent-mux.js",
    canonicalSource: "packages/agent-mux/sdk/src/bin/agent-mux.ts",
    legacyBin: "amux",
    legacyTarget: "./dist/bin/amux.js",
    legacySource: "packages/agent-mux/sdk/src/bin/amux.ts",
  },
  {
    packageName: "@a5c-ai/agent-mux-cli",
    manifestPath: "packages/agent-mux/cli/package.json",
    delegatedTo: "@a5c-ai/agent-mux",
  },
  {
    packageName: "@a5c-ai/agent-mux-transport",
    manifestPath: "packages/agent-mux/transport/package.json",
    canonicalBin: "agent-mux-transport-proxy",
    canonicalTarget: "./dist/bin/agent-mux-transport-proxy.js",
    canonicalSource: "packages/agent-mux/transport/src/bin/agent-mux-transport-proxy.ts",
    legacyBin: "amux-proxy",
    legacyTarget: "./dist/bin/amux-proxy.js",
    legacySource: "packages/agent-mux/transport/src/bin/amux-proxy.ts",
  },
  {
    packageName: "@a5c-ai/agent-mux-tui",
    manifestPath: "packages/agent-mux/tui/package.json",
    canonicalBin: "agent-mux-tui",
    canonicalTarget: "./dist/bin/agent-mux-tui.js",
    canonicalSource: "packages/agent-mux/tui/src/bin/agent-mux-tui.tsx",
    legacyBin: "amux-tui",
    legacyTarget: "./dist/bin/amux-tui.js",
    legacySource: "packages/agent-mux/tui/src/bin/amux-tui.tsx",
  },
  {
    packageName: "@a5c-ai/agent-mux-hooks-cli",
    manifestPath: "packages/agent-mux/hooks/cli/package.json",
    canonicalBin: "agent-mux-hooks",
    canonicalTarget: "dist/cli/main.js",
    canonicalSource: "packages/agent-mux/hooks/cli/src/index.ts",
    legacyBin: "a5c-hooks-mux",
    legacyTarget: "dist/cli/a5c-hooks-mux.js",
    legacySource: "packages/agent-mux/hooks/cli/src/cli/a5c-hooks-mux.ts",
  },
  {
    packageName: "@a5c-ai/agent-mux-extensions",
    manifestPath: "packages/agent-mux/extensions/package.json",
    canonicalBin: "agent-mux-extensions",
    canonicalTarget: "./dist/cli.js",
    canonicalSource: "packages/agent-mux/extensions/src/cli.ts",
    legacyBin: "extension-mux",
    legacyTarget: "./dist/extension-mux.js",
    legacySource: "packages/agent-mux/extensions/src/extension-mux.ts",
  },
  {
    packageName: "@a5c-ai/agent-mux-triggers",
    manifestPath: "packages/agent-mux/triggers/package.json",
    canonicalBin: "agent-mux-triggers",
    canonicalTarget: "./dist/cli.js",
    canonicalSource: "packages/agent-mux/triggers/src/cli.ts",
    legacyBin: "triggers-mux",
    legacyTarget: "./dist/triggers-mux.js",
    legacySource: "packages/agent-mux/triggers/src/triggers-mux.ts",
  },
  {
    packageName: "@a5c-ai/agent-mux-tasks",
    manifestPath: "packages/agent-mux/tasks/package.json",
    canonicalBin: "agent-mux-tasks",
    canonicalTarget: "./dist/cli/index.js",
    canonicalSource: "packages/agent-mux/tasks/src/cli/index.ts",
    legacyBin: "tasks-mux",
    legacyTarget: "./dist/cli/tasks-mux.js",
    legacySource: "packages/agent-mux/tasks/src/cli/tasks-mux.ts",
  },
  {
    packageName: "@a5c-ai/agent-mux-harness-mock",
    manifestPath: "packages/agent-mux/harness-mock/package.json",
    canonicalBin: "agent-mux-harness-mock",
    canonicalTarget: "./dist/bin/agent-mux-harness-mock.js",
    canonicalSource: "packages/agent-mux/harness-mock/src/bin/agent-mux-harness-mock.ts",
    legacyBin: "mock-harness",
    legacyTarget: "./dist/bin/mock-harness.js",
    legacySource: "packages/agent-mux/harness-mock/src/bin/mock-harness.ts",
  },
];

function readFile(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readFile(relativePath));
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function validateSpecRows(errors) {
  const spec = readFile(specPath);
  for (const rename of binaryRenames.filter((entry) => entry.legacyBin)) {
    const requiredCells = [
      `\`${rename.legacyBin}\``,
      `\`${rename.packageName}\``,
      `\`${rename.canonicalBin}\``,
    ];
    for (const cell of requiredCells) {
      if (!spec.includes(cell)) {
        errors.push(`${specPath} is missing expected cell ${cell}.`);
      }
    }
  }
}

function validateManifest(rename, errors, canonicalOwners) {
  const manifest = readJson(rename.manifestPath);
  if (manifest.name !== rename.packageName) {
    errors.push(`${rename.manifestPath} declares ${manifest.name}, expected ${rename.packageName}.`);
  }

  const bin = manifest.bin ?? {};

  if (rename.delegatedTo) {
    if (Object.keys(bin).length > 0) {
      errors.push(`${rename.manifestPath} must not publish bins directly; ${rename.delegatedTo} owns the published CLI binaries.`);
    }
    if (Object.prototype.hasOwnProperty.call(bin, "agent-mux")) {
      errors.push(`${rename.manifestPath} must not publish duplicate canonical agent-mux; ${rename.delegatedTo} owns it.`);
    }
    return;
  }

  if (bin[rename.canonicalBin] !== rename.canonicalTarget) {
    errors.push(`${rename.manifestPath} bin.${rename.canonicalBin} is ${bin[rename.canonicalBin] ?? "<missing>"}, expected ${rename.canonicalTarget}.`);
  }

  if (bin[rename.legacyBin] !== rename.legacyTarget) {
    errors.push(`${rename.manifestPath} bin.${rename.legacyBin} is ${bin[rename.legacyBin] ?? "<missing>"}, expected ${rename.legacyTarget}.`);
  }

  const canonicalOwner = canonicalOwners.get(rename.canonicalBin);
  if (canonicalOwner) {
    errors.push(`Canonical binary ${rename.canonicalBin} is published by both ${canonicalOwner} and ${rename.packageName}.`);
  } else {
    canonicalOwners.set(rename.canonicalBin, rename.packageName);
  }
}

function validateSources(rename, errors) {
  if (rename.delegatedTo) {
    return;
  }

  if (!exists(rename.canonicalSource)) {
    errors.push(`Missing canonical source entrypoint ${rename.canonicalSource}.`);
  }

  if (!exists(rename.legacySource)) {
    errors.push(`Missing deprecated alias source entrypoint ${rename.legacySource}.`);
    return;
  }

  const legacySource = readFile(rename.legacySource);
  const warning = `${warningPrefix} "${rename.legacyBin}" is deprecated, use "${rename.canonicalBin}" instead.`;
  if (!legacySource.includes(warning)) {
    errors.push(`${rename.legacySource} must print deprecation warning: ${warning}`);
  }
}

function main() {
  const errors = [];
  const canonicalOwners = new Map();

  validateSpecRows(errors);

  for (const rename of binaryRenames) {
    validateManifest(rename, errors, canonicalOwners);
    validateSources(rename, errors);
  }

  if (errors.length > 0) {
    console.error("Binary rename guardrail failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Binary rename guardrail passed for ${binaryRenames.filter((entry) => entry.legacyBin).length} renamed binaries.`);
}

main();
