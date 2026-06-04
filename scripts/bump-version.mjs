#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { syncBabysitterMarketplaceManifestVersions } from "./plugin-marketplace-version-sync.mjs";

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

const isValidSemver = (version) => /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version);

const getBumpLevel = (currentVersion, nextVersion) => {
  const [currentMajor, currentMinor, currentPatch] = currentVersion.split(".").map((n) => parseInt(n, 10));
  const [nextMajor, nextMinor, nextPatch] = nextVersion.split(".").map((n) => parseInt(n, 10));
  if ([currentMajor, currentMinor, currentPatch, nextMajor, nextMinor, nextPatch].some((n) => Number.isNaN(n))) {
    throw new Error(`Unable to compare versions: ${currentVersion} -> ${nextVersion}`);
  }
  if (nextMajor > currentMajor) return "major";
  if (nextMinor > currentMinor) return "minor";
  return "patch";
};

const parseExplicitVersion = (argv) => {
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--version") {
      return argv[index + 1] ?? null;
    }
    if (value.startsWith("--version=")) {
      return value.slice("--version=".length);
    }
    if (!value.startsWith("--")) {
      return value;
    }
  }
  return null;
};

const writeJson = (path, data) => {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
};

const updateVersionField = (path, version) => {
  if (!existsSync(path)) {
    return;
  }
  const data = JSON.parse(readFileSync(path, "utf8"));
  data.version = version;
  writeJson(path, data);
};

const syncDependencyVersion = (path, packageName, version) => {
  if (!existsSync(path)) {
    return;
  }
  const data = JSON.parse(readFileSync(path, "utf8"));
  let changed = false;
  for (const field of ["dependencies", "peerDependencies", "optionalDependencies", "devDependencies"]) {
    if (data[field]?.[packageName]) {
      const currentValue = data[field][packageName];
      if (typeof currentValue === "string" && currentValue.startsWith("^")) {
        data[field][packageName] = `^${version}`;
      } else if (typeof currentValue === "string" && currentValue.startsWith("~")) {
        data[field][packageName] = `~${version}`;
      } else {
        data[field][packageName] = version;
      }
      changed = true;
    }
  }
  if (changed) {
    writeJson(path, data);
  }
};

const updateLockVersion = (path, version) => {
  if (!existsSync(path)) {
    return;
  }
  const data = JSON.parse(readFileSync(path, "utf8"));
  if (data.version) {
    data.version = version;
  }
  if (data.packages && data.packages[""]) {
    data.packages[""].version = version;
    if (data.packages[""].dependencies?.["@a5c-ai/adapters"]) {
      data.packages[""].dependencies["@a5c-ai/adapters"] = `^${version}`;
    }
  }
  const lockUpdates = {
    "packages/adapters/codecs": {
      version,
      dependencies: { "@a5c-ai/comm-adapter": version }
    },
    "packages/adapters/cli": {
      version,
      dependencies: {
        "@a5c-ai/adapters-codecs": version,
        "@a5c-ai/comm-adapter": version,
        "@a5c-ai/adapters-gateway": version,
        "@a5c-ai/adapters-observability": version
      }
    },
    "packages/adapters/core": {
      version,
      dependencies: { "@a5c-ai/adapters-observability": version }
    },
    "packages/adapters/gateway": {
      version,
      dependencies: {
        "@a5c-ai/adapters-codecs": version,
        "@a5c-ai/comm-adapter": version
      }
    },
    "packages/adapters/harness-mock": {
      version,
      dependencies: { "@a5c-ai/comm-adapter": version }
    },
    "packages/adapters/mobile-android-app": {
      version,
      dependencies: { "@a5c-ai/genty-ui": version }
    },
    "packages/adapters/mobile-ios-app": {
      version,
      dependencies: { "@a5c-ai/genty-ui": version }
    },
    "packages/adapters/observability": {
      version
    },
    "packages/adapters/sdk": {
      version,
      dependencies: {
        "@a5c-ai/adapters-codecs": version,
        "@a5c-ai/adapters-cli": version,
        "@a5c-ai/comm-adapter": version
      }
    },
    "packages/adapters/tui": {
      version,
      dependencies: {
        "@a5c-ai/adapters": version,
        "@a5c-ai/adapters-observability": version
      }
    },
    "packages/adapters/tv-androidtv-app": {
      version
    },
    "packages/adapters/tv-appletv-app": {
      version
    },
    "packages/genty/ui": {
      version,
      dependencies: { "@a5c-ai/comm-adapter": version }
    },
    "packages/adapters/watch-watchos-app": {
      version
    },
    "packages/adapters/watch-wearos-app": {
      version
    },
    "packages/adapters/webui": {
      version,
      dependencies: { "@a5c-ai/genty-ui": version }
    },
    "packages/adapters/transport": {
      version,
      dependencies: { "@a5c-ai/comm-adapter": version }
    },
    "packages/adapters/triggers": {
      version
    },
    "packages/genty/core": {
      version,
      dependencies: {
        "@a5c-ai/adapters": version,
        "@a5c-ai/genty-runtime": version,
        "@a5c-ai/babysitter-sdk": version
      }
    },
    "packages/genty/runtime": {
      version,
      dependencies: {
        "@a5c-ai/babysitter-sdk": version,
        "@a5c-ai/comm-adapter": version
      }
    },
    "packages/omni": {
      version,
      dependencies: {
        "@a5c-ai/genty-core": version,
        "@a5c-ai/genty-runtime": version,
        "@a5c-ai/genty-platform": version,
        "@a5c-ai/adapters": version,
        "@a5c-ai/babysitter-sdk": version
      }
    },
    "packages/adapters/tools": {
      version,
      dependencies: {
        "@a5c-ai/transport-adapter": version
      }
    },
    "packages/adapters/tasks": {
      version
    },
    "packages/genty/tui-plugins": {
      version,
      dependencies: {
        "@a5c-ai/babysitter-sdk": version,
        "@a5c-ai/genty-tui": version,
        "@a5c-ai/adapters": version
      }
    },
    "packages/kradle/installer": {
      version
    },
    "packages/observer-dashboard": {
      version
    }
  };
  for (const [workspacePath, update] of Object.entries(lockUpdates)) {
    const entry = data.packages?.[workspacePath];
    if (!entry) {
      continue;
    }
    entry.version = update.version;
    if (update.dependencies && entry.dependencies) {
      for (const [dependencyName, dependencyVersion] of Object.entries(update.dependencies)) {
        if (entry.dependencies[dependencyName]) {
          entry.dependencies[dependencyName] = dependencyVersion;
        }
      }
    }
  }
  writeJson(path, data);
};

const workspaceManifestPaths = [
  "package.json",
  "packages/atlas/package.json",
  "packages/genty/core/package.json",
  "packages/genty/runtime/package.json",
  "packages/omni/package.json",
  "packages/adapters/tools/package.json",
  "packages/sdk/package.json",
  "packages/babysitter/package.json",
  "packages/genty/platform/package.json",
  "packages/adapters/extensions/package.json",
  "packages/adapters/tasks/package.json",
  "packages/genty/tui-plugins/package.json",
  "packages/kradle/installer/package.json",
  "packages/observer-dashboard/package.json",
  "packages/adapters/hooks/core/package.json",
  "packages/adapters/hooks/cli/package.json",
  "packages/adapters/hooks/adapter-claude/package.json",
  "packages/adapters/hooks/adapter-codex/package.json",
  "packages/adapters/hooks/adapter-gemini/package.json",
  "packages/adapters/hooks/adapter-copilot/package.json",
  "packages/adapters/hooks/adapter-cursor/package.json",
  "packages/adapters/hooks/adapter-pi/package.json",
  "packages/adapters/hooks/adapter-oh-my-pi/package.json",
  "packages/adapters/hooks/adapter-opencode/package.json",
  "packages/adapters/hooks/adapter-openclaw/package.json",
  "packages/adapters/hooks/adapter-hermes/package.json",
  "packages/kradle/core/package.json",
];

const agentMuxManifestPaths = [
  "packages/adapters/codecs/package.json",
  "packages/adapters/cli/package.json",
  "packages/adapters/core/package.json",
  "packages/adapters/gateway/package.json",
  "packages/adapters/harness-mock/package.json",
  "packages/adapters/mobile-android-app/package.json",
  "packages/adapters/mobile-ios-app/package.json",
  "packages/adapters/observability/package.json",
  "packages/adapters/sdk/package.json",
  "packages/adapters/tui/package.json",
  "packages/adapters/tv-androidtv-app/package.json",
  "packages/adapters/tv-appletv-app/package.json",
  "packages/genty/ui/package.json",
  "packages/adapters/watch-watchos-app/package.json",
  "packages/adapters/watch-wearos-app/package.json",
  "packages/adapters/webui/package.json",
  "packages/adapters/config/package.json",
  "packages/adapters/launch/package.json",
  "packages/adapters/transport/package.json",
  "packages/adapters/tools/package.json",
  "packages/adapters/triggers/package.json",
];

const pluginPackageManifestPaths = [
];

const pluginManifestPaths = [
  "plugins/babysitter-unified/plugin.json",
];

const versionsJsonPaths = [
  "plugins/babysitter-unified/versions.json",
];

const lockPaths = ["package-lock.json"];

const rootManifest = JSON.parse(readFileSync("package.json", "utf8"));
const currentVersion = rootManifest.version;
const explicitVersion = parseExplicitVersion(process.argv.slice(2));

if (explicitVersion && !isValidSemver(explicitVersion)) {
  throw new Error(`Invalid version argument: ${explicitVersion}`);
}

let newVersion = explicitVersion;
let bumpTarget = "patch";
if (!newVersion) {
  const lastTag = run("git describe --tags --abbrev=0");
  const logRange = lastTag ? `${lastTag}..HEAD` : "";
  const logCmd = lastTag
    ? `git log ${logRange} --pretty=%s`
    : "git log -n 50 --pretty=%s";
  const commits = run(logCmd, "");

  if (/#major\b/i.test(commits)) {
    bumpTarget = "major";
  } else if (/#minor\b/i.test(commits)) {
    bumpTarget = "minor";
  }

  newVersion = bumpVersion(currentVersion, bumpTarget);
} else {
  bumpTarget = getBumpLevel(currentVersion, newVersion);
}

const newAgentMuxVersion = newVersion;

for (const path of [...workspaceManifestPaths, ...pluginPackageManifestPaths, ...pluginManifestPaths]) {
  updateVersionField(path, newVersion);
}

for (const path of agentMuxManifestPaths) {
  updateVersionField(path, newAgentMuxVersion);
}

for (const path of [
  "package.json",
  "packages/babysitter/package.json",
  "packages/genty/platform/package.json",
  "packages/genty/runtime/package.json",
  "packages/omni/package.json",
  "packages/genty/tui-plugins/package.json",
]) {
  syncDependencyVersion(path, "@a5c-ai/babysitter-sdk", newVersion);
}

for (const path of [
  "package.json",
  "packages/genty/core/package.json",
  "packages/sdk/package.json",
  "packages/genty/platform/package.json",
  "packages/adapters/codecs/package.json",
  "packages/adapters/cli/package.json",
  "packages/adapters/core/package.json",
  "packages/adapters/gateway/package.json",
  "packages/adapters/harness-mock/package.json",
  "packages/adapters/mobile-android-app/package.json",
  "packages/adapters/mobile-ios-app/package.json",
  "packages/adapters/sdk/package.json",
  "packages/adapters/tui/package.json",
  "packages/adapters/webui/package.json",
  "packages/genty/ui/package.json",
  "packages/adapters/webui/package.json",
  "packages/adapters/transport/package.json",
  "packages/genty/runtime/package.json",
  "packages/omni/package.json",
  "packages/adapters/tools/package.json",
  "packages/adapters/launch/package.json",
  "packages/adapters/config/package.json",
  "packages/genty/tui-plugins/package.json",
]) {
  syncDependencyVersion(path, "@a5c-ai/genty-core", newVersion);
  syncDependencyVersion(path, "@a5c-ai/genty-runtime", newVersion);
  syncDependencyVersion(path, "@a5c-ai/genty-platform", newVersion);
  syncDependencyVersion(path, "@a5c-ai/adapters", newAgentMuxVersion);
  syncDependencyVersion(path, "@a5c-ai/adapters-codecs", newAgentMuxVersion);
  syncDependencyVersion(path, "@a5c-ai/adapters-cli", newAgentMuxVersion);
  syncDependencyVersion(path, "@a5c-ai/comm-adapter", newAgentMuxVersion);
  syncDependencyVersion(path, "@a5c-ai/adapters-gateway", newAgentMuxVersion);
  syncDependencyVersion(path, "@a5c-ai/adapters-observability", newAgentMuxVersion);
  syncDependencyVersion(path, "@a5c-ai/genty-tui", newAgentMuxVersion);
  syncDependencyVersion(path, "@a5c-ai/genty-ui", newAgentMuxVersion);
  syncDependencyVersion(path, "@a5c-ai/genty-web-app", newAgentMuxVersion);
  syncDependencyVersion(path, "@a5c-ai/transport-adapter", newAgentMuxVersion);
}

for (const path of [
  "packages/adapters/hooks/cli/package.json",
  "packages/adapters/hooks/adapter-claude/package.json",
  "packages/adapters/hooks/adapter-codex/package.json",
  "packages/adapters/hooks/adapter-gemini/package.json",
  "packages/adapters/hooks/adapter-copilot/package.json",
  "packages/adapters/hooks/adapter-cursor/package.json",
  "packages/adapters/hooks/adapter-pi/package.json",
  "packages/adapters/hooks/adapter-oh-my-pi/package.json",
  "packages/adapters/hooks/adapter-opencode/package.json",
  "packages/adapters/hooks/adapter-openclaw/package.json",
]) {
  syncDependencyVersion(path, "@a5c-ai/hooks-adapter-core", newVersion);
}

for (const path of versionsJsonPaths) {
  const data = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
  data.sdkVersion = newVersion;
  if ("extensionVersion" in data) {
    data.extensionVersion = newVersion;
  }
  writeJson(path, data);
}

syncBabysitterMarketplaceManifestVersions(newVersion);

for (const path of lockPaths) {
  updateLockVersion(path, newVersion);
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
