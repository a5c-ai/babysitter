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
  { path: "packages/babysitter/package.json" },
];

const pluginManifests = [
  { path: "plugins/babysitter/.claude-plugin/plugin.json" },
  { path: "plugins/babysitter/plugin.json" },
];
const codexPackageManifestPath = "plugins/babysitter-codex/package.json";
const codexPackageLockPath = "plugins/babysitter-codex/package-lock.json";
const geminiPackageManifestPath = "plugins/babysitter-gemini/package.json";
const geminiPluginManifestPath = "plugins/babysitter-gemini/plugin.json";
const geminiExtensionManifestPath = "plugins/babysitter-gemini/gemini-extension.json";
const geminiVersionsPath = "plugins/babysitter-gemini/versions.json";
const githubPackageManifestPath = "plugins/babysitter-github/package.json";
const cursorPackageManifestPath = "plugins/babysitter-cursor/package.json";
const piPackageManifestPath = "plugins/babysitter-pi/package.json";
const piPackageLockPath = "plugins/babysitter-pi/package-lock.json";
const ompPackageManifestPath = "plugins/babysitter-omp/package.json";
const ompPackageLockPath = "plugins/babysitter-omp/package-lock.json";
const opencodePackageManifestPath = "plugins/babysitter-opencode/package.json";
const openclawPackageManifestPath = "plugins/babysitter-openclaw/package.json";

const manifests = packageManifests.map(({ path }) => ({
  path,
  data: JSON.parse(readFileSync(path, "utf8")),
}));

const pluginManifestData = pluginManifests.map(({ path }) => ({
  path,
  data: JSON.parse(readFileSync(path, "utf8")),
}));
const codexPackageManifest = existsSync(codexPackageManifestPath)
  ? {
      path: codexPackageManifestPath,
      data: JSON.parse(readFileSync(codexPackageManifestPath, "utf8")),
    }
  : null;
const geminiPackageManifest = existsSync(geminiPackageManifestPath)
  ? {
      path: geminiPackageManifestPath,
      data: JSON.parse(readFileSync(geminiPackageManifestPath, "utf8")),
    }
  : null;
const geminiPluginManifest = existsSync(geminiPluginManifestPath)
  ? {
      path: geminiPluginManifestPath,
      data: JSON.parse(readFileSync(geminiPluginManifestPath, "utf8")),
    }
  : null;
const geminiExtensionManifest = existsSync(geminiExtensionManifestPath)
  ? {
      path: geminiExtensionManifestPath,
      data: JSON.parse(readFileSync(geminiExtensionManifestPath, "utf8")),
    }
  : null;
const githubPackageManifest = existsSync(githubPackageManifestPath)
  ? {
      path: githubPackageManifestPath,
      data: JSON.parse(readFileSync(githubPackageManifestPath, "utf8")),
    }
  : null;
const cursorPackageManifest = existsSync(cursorPackageManifestPath)
  ? {
      path: cursorPackageManifestPath,
      data: JSON.parse(readFileSync(cursorPackageManifestPath, "utf8")),
    }
  : null;
const piPackageManifest = existsSync(piPackageManifestPath)
  ? {
      path: piPackageManifestPath,
      data: JSON.parse(readFileSync(piPackageManifestPath, "utf8")),
    }
  : null;
const ompPackageManifest = existsSync(ompPackageManifestPath)
  ? {
      path: ompPackageManifestPath,
      data: JSON.parse(readFileSync(ompPackageManifestPath, "utf8")),
    }
  : null;
const opencodePackageManifest = existsSync(opencodePackageManifestPath)
  ? {
      path: opencodePackageManifestPath,
      data: JSON.parse(readFileSync(opencodePackageManifestPath, "utf8")),
    }
  : null;
const openclawPackageManifest = existsSync(openclawPackageManifestPath)
  ? {
      path: openclawPackageManifestPath,
      data: JSON.parse(readFileSync(openclawPackageManifestPath, "utf8")),
    }
  : null;

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

// Update Codex package manifest - keep its own version stream, bumped by policy.
if (codexPackageManifest) {
  const currentCodexVersion = codexPackageManifest.data.version;
  const newCodexVersion = bumpVersion(currentCodexVersion, bumpTarget);
  codexPackageManifest.data.version = newCodexVersion;
  writeFileSync(
    codexPackageManifest.path,
    `${JSON.stringify(codexPackageManifest.data, null, 2)}\n`,
  );

  if (existsSync(codexPackageLockPath)) {
    const codexLock = JSON.parse(readFileSync(codexPackageLockPath, "utf8"));
    codexLock.version = newCodexVersion;
    if (codexLock.packages && codexLock.packages[""]) {
      codexLock.packages[""].version = newCodexVersion;
    }
    writeFileSync(codexPackageLockPath, `${JSON.stringify(codexLock, null, 2)}\n`);
  }
}

if (geminiPackageManifest) {
  const currentGeminiVersion = geminiPackageManifest.data.version;
  const newGeminiVersion = bumpVersion(currentGeminiVersion, bumpTarget);
  geminiPackageManifest.data.version = newGeminiVersion;
  writeFileSync(
    geminiPackageManifest.path,
    `${JSON.stringify(geminiPackageManifest.data, null, 2)}\n`,
  );

  if (geminiPluginManifest) {
    geminiPluginManifest.data.version = newGeminiVersion;
    writeFileSync(
      geminiPluginManifest.path,
      `${JSON.stringify(geminiPluginManifest.data, null, 2)}\n`,
    );
  }

  if (geminiExtensionManifest) {
    geminiExtensionManifest.data.version = newGeminiVersion;
    writeFileSync(
      geminiExtensionManifest.path,
      `${JSON.stringify(geminiExtensionManifest.data, null, 2)}\n`,
    );
  }

  if (existsSync(geminiVersionsPath)) {
    const geminiVersions = JSON.parse(readFileSync(geminiVersionsPath, "utf8"));
    geminiVersions.extensionVersion = newGeminiVersion;
    writeFileSync(geminiVersionsPath, `${JSON.stringify(geminiVersions, null, 2)}\n`);
  }
}

// Update GitHub package manifest - keep its own version stream, bumped by policy.
if (githubPackageManifest) {
  const currentGithubVersion = githubPackageManifest.data.version;
  const newGithubVersion = bumpVersion(currentGithubVersion, bumpTarget);
  githubPackageManifest.data.version = newGithubVersion;
  writeFileSync(
    githubPackageManifest.path,
    `${JSON.stringify(githubPackageManifest.data, null, 2)}\n`,
  );
}

// Update Cursor package manifest - keep its own version stream, bumped by policy.
if (cursorPackageManifest) {
  const currentCursorVersion = cursorPackageManifest.data.version;
  const newCursorVersion = bumpVersion(currentCursorVersion, bumpTarget);
  cursorPackageManifest.data.version = newCursorVersion;
  writeFileSync(
    cursorPackageManifest.path,
    `${JSON.stringify(cursorPackageManifest.data, null, 2)}\n`,
  );
}

if (piPackageManifest) {
  const currentPiVersion = piPackageManifest.data.version;
  const newPiVersion = bumpVersion(currentPiVersion, bumpTarget);
  piPackageManifest.data.version = newPiVersion;
  writeFileSync(
    piPackageManifest.path,
    `${JSON.stringify(piPackageManifest.data, null, 2)}\n`,
  );

  if (existsSync(piPackageLockPath)) {
    const piLock = JSON.parse(readFileSync(piPackageLockPath, "utf8"));
    piLock.version = newPiVersion;
    if (piLock.packages && piLock.packages[""]) {
      piLock.packages[""].version = newPiVersion;
    }
    writeFileSync(piPackageLockPath, `${JSON.stringify(piLock, null, 2)}\n`);
  }
}

if (ompPackageManifest) {
  const currentOmpVersion = ompPackageManifest.data.version;
  const newOmpVersion = bumpVersion(currentOmpVersion, bumpTarget);
  ompPackageManifest.data.version = newOmpVersion;
  writeFileSync(
    ompPackageManifest.path,
    `${JSON.stringify(ompPackageManifest.data, null, 2)}\n`,
  );

  if (existsSync(ompPackageLockPath)) {
    const ompLock = JSON.parse(readFileSync(ompPackageLockPath, "utf8"));
    ompLock.version = newOmpVersion;
    if (ompLock.packages && ompLock.packages[""]) {
      ompLock.packages[""].version = newOmpVersion;
    }
    writeFileSync(ompPackageLockPath, `${JSON.stringify(ompLock, null, 2)}\n`);
  }
}

if (opencodePackageManifest) {
  const currentOpencodeVersion = opencodePackageManifest.data.version;
  const newOpencodeVersion = bumpVersion(currentOpencodeVersion, bumpTarget);
  opencodePackageManifest.data.version = newOpencodeVersion;
  writeFileSync(
    opencodePackageManifest.path,
    `${JSON.stringify(opencodePackageManifest.data, null, 2)}\n`,
  );
}

if (openclawPackageManifest) {
  const currentOpenclawVersion = openclawPackageManifest.data.version;
  const newOpenclawVersion = bumpVersion(currentOpenclawVersion, bumpTarget);
  openclawPackageManifest.data.version = newOpenclawVersion;
  writeFileSync(
    openclawPackageManifest.path,
    `${JSON.stringify(openclawPackageManifest.data, null, 2)}\n`,
  );
}

// Write sdkVersion to versions.json (separate from plugin.json to avoid
// Claude Code's plugin validator rejecting unrecognized keys)
for (const versionsPath of [
  "plugins/babysitter/versions.json",
  "plugins/babysitter-codex/versions.json",
  "plugins/babysitter-gemini/versions.json",
  "plugins/babysitter-omp/versions.json",
  "plugins/babysitter-opencode/versions.json",
  "plugins/babysitter-pi/versions.json",
  "plugins/babysitter-github/versions.json",
  "plugins/babysitter-cursor/versions.json",
  "plugins/babysitter-openclaw/versions.json",
]) {
  const versionsData = existsSync(versionsPath)
    ? JSON.parse(readFileSync(versionsPath, "utf8"))
    : {};
  versionsData.sdkVersion = newVersion;
  writeFileSync(versionsPath, `${JSON.stringify(versionsData, null, 2)}\n`);
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
