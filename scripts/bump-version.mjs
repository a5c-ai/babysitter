#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const run = (cmd, fallback = "") => {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return fallback;
  }
};

const bumpVersion = (version, level) => {
  const [major, minor, patch] = version.split(".").map((n) => parseInt(n, 10));
  if ([major, minor, patch].some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid semver detected in package.json: ${version}`);
  }
  if (level === "major") return `${major + 1}.0.0`;
  if (level === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
};

const packageManifests = [
  { path: "package.json" },
  { path: "packages/sdk/package.json" },
  { path: "packages/breakpoints/package.json" },
  { path: "packages/babysitter/package.json" },
];

const pluginManifests = [
  { path: "plugins/babysitter/.claude-plugin/plugin.json" },
  { path: "plugins/babysitter/plugin.json" },
];

const manifests = packageManifests.map(({ path }) => ({
  path,
  data: JSON.parse(readFileSync(path, "utf8")),
}));

const pluginManifestData = pluginManifests.map(({ path }) => ({
  path,
  data: JSON.parse(readFileSync(path, "utf8")),
}));

const rootManifest = manifests[0].data;
const currentVersion = rootManifest.version;

const lastTag = run("git describe --tags --abbrev=0");
const logRange = lastTag ? `${lastTag}..HEAD` : "";
const logCmd = lastTag
  ? `git log ${logRange} --pretty=%s`
  : "git log -n 50 --pretty=%s";
const commits = run(logCmd, "");

let bumpTarget = "patch";
if (/#major\b/i.test(commits)) {
  bumpTarget = "major";
} else if (/#minor\b/i.test(commits)) {
  bumpTarget = "minor";
}

const newVersion = bumpVersion(currentVersion, bumpTarget);

for (const manifest of manifests) {
  manifest.data.version = newVersion;
  writeFileSync(manifest.path, `${JSON.stringify(manifest.data, null, 2)}\n`);
}

// Update plugin manifests - bump from their current version
for (const pluginManifest of pluginManifestData) {
  const currentPluginVersion = pluginManifest.data.version;
  const newPluginVersion = bumpVersion(currentPluginVersion, bumpTarget);
  pluginManifest.data.version = newPluginVersion;
  writeFileSync(pluginManifest.path, `${JSON.stringify(pluginManifest.data, null, 2)}\n`);
}

// Update marketplace.json plugin entry - bump from its current version
const marketplacePath = ".claude-plugin/marketplace.json";
if (existsSync(marketplacePath)) {
  const marketplaceData = JSON.parse(readFileSync(marketplacePath, "utf8"));
  if (marketplaceData.plugins) {
    const babysitterPlugin = marketplaceData.plugins.find(
      (plugin) => plugin.name === "babysitter"
    );
    if (babysitterPlugin) {
      const currentMarketplaceVersion = babysitterPlugin.version;
      const newMarketplaceVersion = bumpVersion(currentMarketplaceVersion, bumpTarget);
      babysitterPlugin.version = newMarketplaceVersion;
      writeFileSync(marketplacePath, `${JSON.stringify(marketplaceData, null, 2)}\n`);
    }
  }
}

const lockPath = "package-lock.json";
if (existsSync(lockPath)) {
  const lock = JSON.parse(readFileSync(lockPath, "utf8"));
  if (lock.version) lock.version = newVersion;
  if (lock.packages && lock.packages[""]) {
    lock.packages[""].version = newVersion;
  }
  const sdkWorkspaceKey = "packages/sdk";
  if (lock.packages && lock.packages[sdkWorkspaceKey]) {
    lock.packages[sdkWorkspaceKey].version = newVersion;
  }
  const breakpointsWorkspaceKey = "packages/breakpoints";
  if (lock.packages && lock.packages[breakpointsWorkspaceKey]) {
    lock.packages[breakpointsWorkspaceKey].version = newVersion;
  }
  const babysitterWorkspaceKey = "packages/babysitter";
  if (lock.packages && lock.packages[babysitterWorkspaceKey]) {
    lock.packages[babysitterWorkspaceKey].version = newVersion;
  }
  const sdkManifest = manifests.find(
    (manifest) => manifest.path === "packages/sdk/package.json",
  );
  const sdkName = sdkManifest?.data?.name;
  if (sdkName) {
    const sdkNodeModulesKey = `node_modules/${sdkName}`;
    if (lock.packages && lock.packages[sdkNodeModulesKey]) {
      lock.packages[sdkNodeModulesKey].version = newVersion;
    }
  }
  const breakpointsManifest = manifests.find(
    (manifest) => manifest.path === "packages/breakpoints/package.json",
  );
  const breakpointsName = breakpointsManifest?.data?.name;
  if (breakpointsName) {
    const breakpointsNodeModulesKey = `node_modules/${breakpointsName}`;
    if (lock.packages && lock.packages[breakpointsNodeModulesKey]) {
      lock.packages[breakpointsNodeModulesKey].version = newVersion;
    }
  }
  const babysitterManifest = manifests.find(
    (manifest) => manifest.path === "packages/babysitter/package.json",
  );
  const babysitterName = babysitterManifest?.data?.name;
  if (babysitterName) {
    const babysitterNodeModulesKey = `node_modules/${babysitterName}`;
    if (lock.packages && lock.packages[babysitterNodeModulesKey]) {
      lock.packages[babysitterNodeModulesKey].version = newVersion;
    }
  }
  writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
}

const changelogPath = "CHANGELOG.md";
if (!existsSync(changelogPath)) {
  throw new Error("CHANGELOG.md is required to build release notes.");
}

const changelog = readFileSync(changelogPath, "utf8");
const unreleasedPattern = /## \[Unreleased\](?<body>[\s\S]*?)(?=^## \[|$)/m;
const matches = changelog.match(unreleasedPattern);
if (!matches || !matches.groups) {
  throw new Error('Unable to locate "## [Unreleased]" section in CHANGELOG.md.');
}

const unreleasedBody = matches.groups.body.trim();
const isPlaceholder = unreleasedBody === "" || unreleasedBody === "- No unreleased changes.";
const releaseBody = !isPlaceholder ? `${unreleasedBody}\n` : "- No notable changes.\n";
const placeholder = "- No unreleased changes.\n";
const isoDate = new Date().toISOString().split("T")[0];
const replacement = `## [Unreleased]\n\n${placeholder}\n\n## [${newVersion}] - ${isoDate}\n${releaseBody}\n`;
const updatedChangelog = changelog.replace(unreleasedPattern, replacement);
writeFileSync(changelogPath, updatedChangelog);

process.stdout.write(newVersion);
