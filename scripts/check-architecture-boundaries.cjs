#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const dependencyFields = ["dependencies", "peerDependencies", "optionalDependencies"];

const packageFamilies = {
  "orchestration-core": [
    "@a5c-ai/babysitter-sdk",
    "@a5c-ai/babysitter",
    "@a5c-ai/babysitter-agent",
    "@a5c-ai/agent-core",
  ],
  "dispatch-core": [
    "@a5c-ai/agent-mux",
    "@a5c-ai/agent-mux-core",
    "@a5c-ai/agent-mux-adapters",
    "@a5c-ai/agent-mux-cli",
    "@a5c-ai/agent-mux-gateway",
    "@a5c-ai/agent-mux-observability",
    "@a5c-ai/agent-mux-harness-mock",
    "@a5c-ai/transport-mux",
  ],
  "dispatch-surfaces": [
    "@a5c-ai/agent-mux-ui",
    "@a5c-ai/agent-mux-webui",
    "@a5c-ai/agent-mux-tui",
    "@a5c-ai/agent-mux-mobile-android-app",
    "@a5c-ai/agent-mux-mobile-ios-app",
    "@a5c-ai/agent-mux-tv-androidtv-app",
    "@a5c-ai/agent-mux-tv-appletv-app",
    "@a5c-ai/agent-mux-watch-watchos-app",
    "@a5c-ai/agent-mux-watch-wearos-app",
  ],
  "support-systems": [
    "@a5c-ai/agent-catalog",
    "@a5c-ai/agent-plugins-mux",
    "@a5c-ai/breakpoints-mux",
    "@a5c-ai/hooks-mux-core",
    "@a5c-ai/hooks-mux-cli",
    "@a5c-ai/hooks-mux-adapter-claude",
    "@a5c-ai/hooks-mux-adapter-codex",
    "@a5c-ai/hooks-mux-adapter-copilot",
    "@a5c-ai/hooks-mux-adapter-cursor",
    "@a5c-ai/hooks-mux-adapter-gemini",
    "@a5c-ai/hooks-mux-adapter-oh-my-pi",
    "@a5c-ai/hooks-mux-adapter-openclaw",
    "@a5c-ai/hooks-mux-adapter-opencode",
    "@a5c-ai/hooks-mux-adapter-pi",
  ],
  "downstream-consumers": [
    "@a5c-ai/babysitter-observer-dashboard",
    "@a5c-ai/babysitter-tui-plugins",
    "@a5c-ai/cloud",
    "@a5c-ai/kanban",
    "process-library-catalog",
  ],
  "distribution-bundles": [
    "@a5c-ai/babysitter-codex",
    "@a5c-ai/babysitter-cursor",
    "@a5c-ai/babysitter-gemini",
    "@a5c-ai/babysitter-github",
    "@a5c-ai/babysitter-omp",
    "@a5c-ai/babysitter-openclaw",
    "@a5c-ai/babysitter-opencode",
    "@a5c-ai/babysitter-paperclip",
    "@a5c-ai/babysitter-pi",
  ],
};

const familyRules = {
  "orchestration-core": {
    allow: new Set(["orchestration-core", "dispatch-core", "support-systems"]),
    rationale:
      "orchestration packages may compose dispatch and support systems, but they must not depend on UI/downstream surfaces or install bundles",
  },
  "dispatch-core": {
    allow: new Set(["dispatch-core", "support-systems"]),
    rationale:
      "dispatch packages stay reusable and must not depend on orchestration packages, downstream consumers, or install bundles",
  },
  "dispatch-surfaces": {
    allow: new Set(["dispatch-core", "dispatch-surfaces", "support-systems"]),
    rationale:
      "UI and app surfaces are downstream of dispatch; they must not reach back into orchestration packages",
  },
  "support-systems": {
    allow: new Set(["support-systems"]),
    rationale:
      "cross-harness support systems remain narrowly scoped and should not pull in orchestration, dispatch surface, or distribution concerns",
  },
  "downstream-consumers": {
    allow: new Set([
      "orchestration-core",
      "dispatch-core",
      "dispatch-surfaces",
      "support-systems",
      "downstream-consumers",
    ]),
    rationale:
      "downstream consumers can depend on core layers, but they must not become upstream dependencies for those layers",
  },
  "distribution-bundles": {
    allow: new Set(["orchestration-core"]),
    rationale:
      "first-class install bundles stay thin and may only depend on the orchestration core they package around",
  },
};

const familyByPackage = new Map(
  Object.entries(packageFamilies).flatMap(([family, packageNames]) =>
    packageNames.map((packageName) => [packageName, family]),
  ),
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function findPackageJsonsFromWorkspacePattern(pattern) {
  const normalizedPattern = pattern.replace(/\/+$/, "");
  if (!normalizedPattern.includes("*")) {
    const manifestPath = path.join(rootDir, normalizedPattern, "package.json");
    return fs.existsSync(manifestPath) ? [manifestPath] : [];
  }

  const [prefix, suffix] = normalizedPattern.split("*");
  const baseDir = path.join(rootDir, prefix);
  if (!fs.existsSync(baseDir)) {
    return [];
  }

  return fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(baseDir, entry.name, suffix, "package.json"))
    .filter((manifestPath) => fs.existsSync(manifestPath));
}

function findFirstClassPluginPackageJsons() {
  const pluginsDir = path.join(rootDir, "plugins");
  if (!fs.existsSync(pluginsDir)) {
    return [];
  }

  return fs
    .readdirSync(pluginsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^babysitter-/.test(entry.name))
    .map((entry) => path.join(pluginsDir, entry.name, "package.json"))
    .filter((manifestPath) => fs.existsSync(manifestPath));
}

function loadRepoPackages() {
  const rootPackageJson = readJson(path.join(rootDir, "package.json"));
  const workspacePackageJsons = (rootPackageJson.workspaces ?? []).flatMap(
    findPackageJsonsFromWorkspacePattern,
  );
  const manifestPaths = [...new Set([...workspacePackageJsons, ...findFirstClassPluginPackageJsons()])];

  return manifestPaths
    .map((manifestPath) => {
      const packageJson = readJson(manifestPath);
      return {
        name: packageJson.name,
        manifestPath,
        relativeManifestPath: path.relative(rootDir, manifestPath),
        packageJson,
      };
    })
    .filter((repoPackage) => Boolean(repoPackage.name))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function listInternalDependencies(repoPackage, knownPackageNames) {
  const internalDependencies = [];

  for (const field of dependencyFields) {
    const deps = repoPackage.packageJson[field];
    if (!deps || typeof deps !== "object") {
      continue;
    }

    for (const dependencyName of Object.keys(deps)) {
      if (knownPackageNames.has(dependencyName)) {
        internalDependencies.push({
          name: dependencyName,
          field,
        });
      }
    }
  }

  return internalDependencies.sort((a, b) => a.name.localeCompare(b.name) || a.field.localeCompare(b.field));
}

function main() {
  const repoPackages = loadRepoPackages();
  const knownPackageNames = new Set(repoPackages.map((repoPackage) => repoPackage.name));
  const errors = [];

  for (const repoPackage of repoPackages) {
    if (!familyByPackage.has(repoPackage.name)) {
      errors.push(
        `Unclassified package ${repoPackage.name} (${repoPackage.relativeManifestPath}). Add it to scripts/check-architecture-boundaries.cjs before introducing new repo package boundaries.`,
      );
    }
  }

  for (const packageName of familyByPackage.keys()) {
    if (!knownPackageNames.has(packageName)) {
      errors.push(
        `Architecture rule references missing package ${packageName}. Remove or rename the entry in scripts/check-architecture-boundaries.cjs so the gate matches the repo.`,
      );
    }
  }

  for (const repoPackage of repoPackages) {
    const sourceFamily = familyByPackage.get(repoPackage.name);
    if (!sourceFamily) {
      continue;
    }

    const rule = familyRules[sourceFamily];
    const internalDependencies = listInternalDependencies(repoPackage, knownPackageNames);

    for (const dependency of internalDependencies) {
      const targetFamily = familyByPackage.get(dependency.name);
      if (!targetFamily) {
        continue;
      }

      if (!rule.allow.has(targetFamily)) {
        errors.push(
          [
            `${repoPackage.name} (${repoPackage.relativeManifestPath}) declares ${dependency.name} in ${dependency.field},`,
            `but ${sourceFamily} packages may not depend on ${targetFamily} packages.`,
            `Rule: ${rule.rationale}.`,
          ].join(" "),
        );
      }
    }
  }

  if (errors.length > 0) {
    console.error("Architecture boundary check failed.\n");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  const summary = Object.entries(packageFamilies)
    .map(([family, packageNames]) => `${family}: ${packageNames.length}`)
    .join(", ");

  console.log(`Architecture boundary check passed. Families covered: ${summary}.`);
}

main();
