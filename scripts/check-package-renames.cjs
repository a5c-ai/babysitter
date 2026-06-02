#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const specPath = "docs/agent-mux/terminology-and-structure-gaps/package-renames.md";
const selfPath = "scripts/check-package-renames.cjs";

function readFile(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function parseRenameRows() {
  const spec = readFile(specPath);
  const rows = [];

  const packageNameFromCell = (cell) => {
    const match = cell.match(/`(@a5c-ai\/[^`]+)`/);
    return match ? match[1] : cell;
  };

  const dirFromCell = (cell) => cell.replace(/^`|`$/g, "");

  for (const line of spec.split(/\r?\n/)) {
    if (!line.startsWith("| `@a5c-ai/")) {
      continue;
    }

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length === 4) {
      const currentPackage = packageNameFromCell(cells[0]);
      const currentDir = dirFromCell(cells[1]);
      const targetPackage = packageNameFromCell(cells[2]);
      const targetDir = dirFromCell(cells[3]);
      if (targetPackage.startsWith("@a5c-ai/") && currentPackage !== targetPackage) {
        rows.push({ currentPackage, currentDir, targetPackage, targetDir });
      }
      continue;
    }

    if (cells.length === 3) {
      const currentPackage = packageNameFromCell(cells[0]);
      const targetPackage = packageNameFromCell(cells[1]);
      const targetDir = dirFromCell(cells[2]);
      if (targetPackage.startsWith("@a5c-ai/") && currentPackage !== targetPackage) {
        rows.push({ currentPackage, currentDir: null, targetPackage, targetDir });
      }
    }
  }

  return rows;
}

function listTrackedFiles() {
  return execFileSync(
    "git",
    [
      "ls-files",
      "--",
      "package.json",
      "package-lock.json",
      "pnpm-workspace.yaml",
      ".github",
      "packages",
      "scripts",
      "docs",
      "plugins",
      "blueprints",
    ],
    { cwd: rootDir, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  )
    .split(/\r?\n/)
    .filter(Boolean);
}

function isScannedFile(relativePath) {
  if (relativePath === specPath || relativePath === selfPath) {
    return false;
  }

  return [
    "package.json",
    "package-lock.json",
    "pnpm-workspace.yaml",
    ".github/",
    "packages/",
    "scripts/",
    "docs/",
    "plugins/",
    "blueprints/",
  ].some((prefix) => relativePath === prefix || relativePath.startsWith(prefix));
}

function isLikelyTextFile(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  try {
    const buffer = fs.readFileSync(absolutePath);
    return !buffer.subarray(0, 8000).includes(0);
  } catch {
    return false;
  }
}

function readJson(relativePath) {
  return JSON.parse(readFile(relativePath));
}

function main() {
  const renames = parseRenameRows();
  const errors = [];

  if (renames.length !== 20) {
    errors.push(`Expected 20 package rename rows from ${specPath}, found ${renames.length}.`);
  }

  for (const rename of renames) {
    const manifestPath = path.join(rename.targetDir, "package.json");
    if (!fs.existsSync(path.join(rootDir, manifestPath))) {
      errors.push(`Missing target package manifest ${manifestPath} for ${rename.targetPackage}.`);
      continue;
    }

    const manifest = readJson(manifestPath);
    if (manifest.name !== rename.targetPackage) {
      errors.push(`${manifestPath} declares ${manifest.name}, expected ${rename.targetPackage}.`);
    }

    if (rename.currentDir && rename.currentDir !== rename.targetDir) {
      const oldManifestPath = path.join(rename.currentDir, "package.json");
      if (fs.existsSync(path.join(rootDir, oldManifestPath))) {
        errors.push(`Old package directory still contains a manifest: ${oldManifestPath}.`);
      }
    }
  }

  const oldPackages = renames.map((rename) => rename.currentPackage);
  const files = listTrackedFiles().filter(isScannedFile).filter(isLikelyTextFile);

  for (const relativePath of files) {
    const content = readFile(relativePath);
    for (const oldPackage of oldPackages) {
      if (content.includes(oldPackage)) {
        errors.push(`${relativePath} still references ${oldPackage}.`);
      }
    }
  }

  if (errors.length > 0) {
    console.error("Package rename guardrail failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Package rename guardrail passed for ${renames.length} renamed packages.`);
}

main();
