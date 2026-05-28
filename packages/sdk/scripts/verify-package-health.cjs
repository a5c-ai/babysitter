#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const sdkRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(sdkRoot, "..", "..");
const babysitterRoot = path.join(repoRoot, "packages", "babysitter");

function fail(message) {
  console.error(`[verify-package-health] ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });
  if (result.status !== 0) {
    fail(`${command} ${args.join(" ")} failed\n${result.stderr || result.stdout}`);
  }
  return result;
}

function assertFile(relativePath) {
  const target = path.join(repoRoot, relativePath);
  if (!fs.existsSync(target)) {
    fail(`${relativePath} is missing; run npm run build:sdk before package health verification`);
  }
}

function verifySdkPackIncludesCli() {
  const result = run("npm", [
    "pack",
    "--json",
    "--dry-run",
    "--workspace=@a5c-ai/babysitter-sdk",
  ]);
  const packs = JSON.parse(result.stdout);
  const files = new Set((packs[0]?.files ?? []).map((entry) => entry.path));
  for (const required of ["dist/cli/main.js", "dist/cli/mcpServeEntry.js", "README.md"]) {
    if (!files.has(required)) {
      fail(`SDK dry-run package is missing ${required}`);
    }
  }
}

function verifyMetapackageShimResolvesSdkCli() {
  const shim = path.join(babysitterRoot, "bin", "babysitter.js");
  const script = [
    `require(${JSON.stringify(shim)})`,
  ].join(";");
  const result = spawnSync(process.execPath, ["-e", script, "--version"], {
    cwd: babysitterRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    fail(`metapackage shim failed to invoke SDK CLI\n${result.stderr || result.stdout}`);
  }
}

function main() {
  assertFile("packages/sdk/dist/cli/main.js");
  assertFile("packages/sdk/dist/cli/mcpServeEntry.js");
  verifySdkPackIncludesCli();
  verifyMetapackageShimResolvesSdkCli();
  console.log("[verify-package-health] SDK package health checks passed.");
}

main();
