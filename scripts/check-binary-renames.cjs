#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const specPath = "docs/adapters/terminology-and-structure-gaps/binary-renames.md";
const warningPrefix = "[adapters]";

const binaryRenames = [
  {
    packageName: "@a5c-ai/adapters",
    manifestPath: "packages/adapters/sdk/package.json",
    canonicalBin: "adapters",
    canonicalTarget: "./dist/bin/adapters.js",
    canonicalSource: "packages/adapters/sdk/src/bin/adapters.ts",
    legacyBin: "adapters",
    legacyTarget: "./dist/bin/adapters.js",
    legacySource: "packages/adapters/sdk/src/bin/adapters.ts",
  },
  {
    packageName: "@a5c-ai/adapters-cli",
    manifestPath: "packages/adapters/cli/package.json",
    delegatedTo: "@a5c-ai/adapters",
  },
  {
    packageName: "@a5c-ai/transport-adapter",
    manifestPath: "packages/adapters/transport/package.json",
    canonicalBin: "adapters-transport-proxy",
    canonicalTarget: "./dist/bin/adapters-transport-proxy.js",
    canonicalSource: "packages/adapters/transport/src/bin/adapters-transport-proxy.ts",
    legacyBin: "adapters-proxy",
    legacyTarget: "./dist/bin/adapters-proxy.js",
    legacySource: "packages/adapters/transport/src/bin/adapters-proxy.ts",
  },
  {
    packageName: "@a5c-ai/genty-tui",
    manifestPath: "packages/genty/tui/package.json",
    canonicalBin: "adapters-tui",
    canonicalTarget: "./dist/bin/adapters-tui.js",
    canonicalSource: "packages/genty/tui/src/bin/adapters-tui.tsx",
    legacyBin: "adapters-tui",
    legacyTarget: "./dist/bin/adapters-tui.js",
    legacySource: "packages/genty/tui/src/bin/adapters-tui.tsx",
  },
  {
    packageName: "@a5c-ai/hooks-adapter-cli",
    manifestPath: "packages/adapters/hooks/cli/package.json",
    canonicalBin: "adapters-hooks",
    canonicalTarget: "dist/cli/main.js",
    canonicalSource: "packages/adapters/hooks/cli/src/index.ts",
    legacyBin: "a5c-hooks-adapter",
    legacyTarget: "dist/cli/a5c-hooks-adapter.js",
    legacySource: "packages/adapters/hooks/cli/src/cli/a5c-hooks-adapter.ts",
  },
  {
    packageName: "@a5c-ai/extensions-adapter",
    manifestPath: "packages/adapters/extensions/package.json",
    canonicalBin: "adapters-extensions",
    canonicalTarget: "./dist/cli.js",
    canonicalSource: "packages/adapters/extensions/src/cli.ts",
    legacyBin: "extensions-adapter",
    legacyTarget: "./dist/extensions-adapter.js",
    legacySource: "packages/adapters/extensions/src/extensions-adapter.ts",
  },
  {
    packageName: "@a5c-ai/triggers-adapter",
    manifestPath: "packages/adapters/triggers/package.json",
    canonicalBin: "adapters-triggers",
    canonicalTarget: "./dist/cli.js",
    canonicalSource: "packages/adapters/triggers/src/cli.ts",
    legacyBin: "triggers-adapter",
    legacyTarget: "./dist/triggers-adapter.js",
    legacySource: "packages/adapters/triggers/src/triggers-adapter.ts",
  },
  {
    packageName: "@a5c-ai/tasks-adapter",
    manifestPath: "packages/adapters/tasks/package.json",
    canonicalBin: "adapters-tasks",
    canonicalTarget: "./dist/cli/index.js",
    canonicalSource: "packages/adapters/tasks/src/cli/index.ts",
    legacyBin: "tasks-adapter",
    legacyTarget: "./dist/cli/tasks-adapter.js",
    legacySource: "packages/adapters/tasks/src/cli/tasks-adapter.ts",
  },
  {
    packageName: "@a5c-ai/adapters-harness-mock",
    manifestPath: "packages/adapters/harness-mock/package.json",
    canonicalBin: "adapters-harness-mock",
    canonicalTarget: "./dist/bin/adapters-harness-mock.js",
    canonicalSource: "packages/adapters/harness-mock/src/bin/adapters-harness-mock.ts",
    legacyBin: "mock-harness",
    legacyTarget: "./dist/bin/mock-harness.js",
    legacySource: "packages/adapters/harness-mock/src/bin/mock-harness.ts",
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
    if (Object.prototype.hasOwnProperty.call(bin, "adapters")) {
      errors.push(`${rename.manifestPath} must not publish duplicate canonical adapters; ${rename.delegatedTo} owns it.`);
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
