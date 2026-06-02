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
    if (data.packages[""].dependencies?.["@a5c-ai/agent-mux"]) {
      data.packages[""].dependencies["@a5c-ai/agent-mux"] = `^${version}`;
    }
  }
  const lockUpdates = {
    "packages/agent-mux/adapters": {
      version,
      dependencies: { "@a5c-ai/agent-mux-comm": version }
    },
    "packages/agent-mux/cli": {
      version,
      dependencies: {
        "@a5c-ai/agent-mux-adapters": version,
        "@a5c-ai/agent-mux-comm": version,
        "@a5c-ai/agent-mux-gateway": version,
        "@a5c-ai/agent-mux-observability": version
      }
    },
    "packages/agent-mux/core": {
      version,
      dependencies: { "@a5c-ai/agent-mux-observability": version }
    },
    "packages/agent-mux/gateway": {
      version,
      dependencies: {
        "@a5c-ai/agent-mux-adapters": version,
        "@a5c-ai/agent-mux-comm": version
      }
    },
    "packages/agent-mux/harness-mock": {
      version,
      dependencies: { "@a5c-ai/agent-mux-comm": version }
    },
    "packages/agent-mux/mobile-android-app": {
      version,
      dependencies: { "@a5c-ai/agent-mux-ui": version }
    },
    "packages/agent-mux/mobile-ios-app": {
      version,
      dependencies: { "@a5c-ai/agent-mux-ui": version }
    },
    "packages/agent-mux/observability": {
      version
    },
    "packages/agent-mux/sdk": {
      version,
      dependencies: {
        "@a5c-ai/agent-mux-adapters": version,
        "@a5c-ai/agent-mux-cli": version,
        "@a5c-ai/agent-mux-comm": version
      }
    },
    "packages/agent-mux/tui": {
      version,
      dependencies: {
        "@a5c-ai/agent-mux": version,
        "@a5c-ai/agent-mux-observability": version
      }
    },
    "packages/agent-mux/tv-androidtv-app": {
      version
    },
    "packages/agent-mux/tv-appletv-app": {
      version
    },
    "packages/agent-mux/ui": {
      version,
      dependencies: { "@a5c-ai/agent-mux-comm": version }
    },
    "packages/agent-mux/watch-watchos-app": {
      version
    },
    "packages/agent-mux/watch-wearos-app": {
      version
    },
    "packages/agent-mux/webui": {
      version,
      dependencies: { "@a5c-ai/agent-mux-ui": version }
    },
    "packages/agent-mux/transport": {
      version,
      dependencies: { "@a5c-ai/agent-mux-comm": version }
    },
    "packages/agent-mux/triggers": {
      version
    },
    "packages/tula-core": {
      version,
      dependencies: {
        "@a5c-ai/agent-mux": version,
        "@a5c-ai/agent-runtime": version,
        "@a5c-ai/babysitter-sdk": version
      }
    },
    "packages/agent-runtime": {
      version,
      dependencies: {
        "@a5c-ai/babysitter-sdk": version,
        "@a5c-ai/agent-mux-comm": version
      }
    },
    "packages/omni": {
      version,
      dependencies: {
        "@a5c-ai/tula-core": version,
        "@a5c-ai/agent-runtime": version,
        "@a5c-ai/agent-platform": version,
        "@a5c-ai/agent-mux": version,
        "@a5c-ai/babysitter-sdk": version
      }
    },
    "packages/agent-mux/tools": {
      version,
      dependencies: {
        "@a5c-ai/agent-mux-transport": version
      }
    },
    "packages/agent-mux/tasks": {
      version
    },
    "packages/babysitter-tui-plugins": {
      version,
      dependencies: {
        "@a5c-ai/babysitter-sdk": version,
        "@a5c-ai/agent-mux-tui": version,
        "@a5c-ai/agent-mux": version
      }
    },
    "packages/cloud": {
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
  "packages/tula-core/package.json",
  "packages/agent-runtime/package.json",
  "packages/omni/package.json",
  "packages/agent-mux/tools/package.json",
  "packages/sdk/package.json",
  "packages/babysitter/package.json",
  "packages/agent-platform/package.json",
  "packages/agent-mux/extensions/package.json",
  "packages/agent-mux/tasks/package.json",
  "packages/babysitter-tui-plugins/package.json",
  "packages/cloud/package.json",
  "packages/observer-dashboard/package.json",
  "packages/agent-mux/hooks/core/package.json",
  "packages/agent-mux/hooks/cli/package.json",
  "packages/agent-mux/hooks/adapter-claude/package.json",
  "packages/agent-mux/hooks/adapter-codex/package.json",
  "packages/agent-mux/hooks/adapter-gemini/package.json",
  "packages/agent-mux/hooks/adapter-copilot/package.json",
  "packages/agent-mux/hooks/adapter-cursor/package.json",
  "packages/agent-mux/hooks/adapter-pi/package.json",
  "packages/agent-mux/hooks/adapter-oh-my-pi/package.json",
  "packages/agent-mux/hooks/adapter-opencode/package.json",
  "packages/agent-mux/hooks/adapter-openclaw/package.json",
  "packages/agent-mux/hooks/adapter-hermes/package.json",
  "packages/krate/core/package.json",
];

const agentMuxManifestPaths = [
  "packages/agent-mux/adapters/package.json",
  "packages/agent-mux/cli/package.json",
  "packages/agent-mux/core/package.json",
  "packages/agent-mux/gateway/package.json",
  "packages/agent-mux/harness-mock/package.json",
  "packages/agent-mux/mobile-android-app/package.json",
  "packages/agent-mux/mobile-ios-app/package.json",
  "packages/agent-mux/observability/package.json",
  "packages/agent-mux/sdk/package.json",
  "packages/agent-mux/tui/package.json",
  "packages/agent-mux/tv-androidtv-app/package.json",
  "packages/agent-mux/tv-appletv-app/package.json",
  "packages/agent-mux/ui/package.json",
  "packages/agent-mux/watch-watchos-app/package.json",
  "packages/agent-mux/watch-wearos-app/package.json",
  "packages/agent-mux/webui/package.json",
  "packages/agent-mux/config/package.json",
  "packages/agent-mux/launch/package.json",
  "packages/agent-mux/transport/package.json",
  "packages/agent-mux/tools/package.json",
  "packages/agent-mux/triggers/package.json",
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
  "packages/agent-platform/package.json",
  "packages/agent-runtime/package.json",
  "packages/omni/package.json",
  "packages/babysitter-tui-plugins/package.json",
]) {
  syncDependencyVersion(path, "@a5c-ai/babysitter-sdk", newVersion);
}

for (const path of [
  "package.json",
  "packages/tula-core/package.json",
  "packages/sdk/package.json",
  "packages/agent-platform/package.json",
  "packages/agent-mux/adapters/package.json",
  "packages/agent-mux/cli/package.json",
  "packages/agent-mux/core/package.json",
  "packages/agent-mux/gateway/package.json",
  "packages/agent-mux/harness-mock/package.json",
  "packages/agent-mux/mobile-android-app/package.json",
  "packages/agent-mux/mobile-ios-app/package.json",
  "packages/agent-mux/sdk/package.json",
  "packages/agent-mux/tui/package.json",
  "packages/agent-mux/webui/package.json",
  "packages/agent-mux/ui/package.json",
  "packages/agent-mux/webui/package.json",
  "packages/agent-mux/transport/package.json",
  "packages/agent-runtime/package.json",
  "packages/omni/package.json",
  "packages/agent-mux/tools/package.json",
  "packages/agent-mux/launch/package.json",
  "packages/agent-mux/config/package.json",
  "packages/babysitter-tui-plugins/package.json",
]) {
  syncDependencyVersion(path, "@a5c-ai/tula-core", newVersion);
  syncDependencyVersion(path, "@a5c-ai/agent-runtime", newVersion);
  syncDependencyVersion(path, "@a5c-ai/agent-platform", newVersion);
  syncDependencyVersion(path, "@a5c-ai/agent-mux", newAgentMuxVersion);
  syncDependencyVersion(path, "@a5c-ai/agent-mux-adapters", newAgentMuxVersion);
  syncDependencyVersion(path, "@a5c-ai/agent-mux-cli", newAgentMuxVersion);
  syncDependencyVersion(path, "@a5c-ai/agent-mux-comm", newAgentMuxVersion);
  syncDependencyVersion(path, "@a5c-ai/agent-mux-gateway", newAgentMuxVersion);
  syncDependencyVersion(path, "@a5c-ai/agent-mux-observability", newAgentMuxVersion);
  syncDependencyVersion(path, "@a5c-ai/agent-mux-tui", newAgentMuxVersion);
  syncDependencyVersion(path, "@a5c-ai/agent-mux-ui", newAgentMuxVersion);
  syncDependencyVersion(path, "@a5c-ai/agent-mux-webui", newAgentMuxVersion);
  syncDependencyVersion(path, "@a5c-ai/agent-mux-transport", newAgentMuxVersion);
}

for (const path of [
  "packages/agent-mux/hooks/cli/package.json",
  "packages/agent-mux/hooks/adapter-claude/package.json",
  "packages/agent-mux/hooks/adapter-codex/package.json",
  "packages/agent-mux/hooks/adapter-gemini/package.json",
  "packages/agent-mux/hooks/adapter-copilot/package.json",
  "packages/agent-mux/hooks/adapter-cursor/package.json",
  "packages/agent-mux/hooks/adapter-pi/package.json",
  "packages/agent-mux/hooks/adapter-oh-my-pi/package.json",
  "packages/agent-mux/hooks/adapter-opencode/package.json",
  "packages/agent-mux/hooks/adapter-openclaw/package.json",
]) {
  syncDependencyVersion(path, "@a5c-ai/agent-mux-hooks-core", newVersion);
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
