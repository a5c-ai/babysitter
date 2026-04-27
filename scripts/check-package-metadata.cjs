#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

function fail(message) {
  console.error(`Metadata verification failed: ${message}`);
  process.exit(1);
}

function readJson(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    fail(`Unable to read ${relativePath}: ${error.message}`);
  }
}

function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    fail(`${label} expected ${JSON.stringify(expected)} but found ${JSON.stringify(actual)}`);
  }
}

function expectPublicPackage(manifest, label) {
  if (manifest.private !== undefined && manifest.private !== false) {
    fail(`${label} private expected undefined or false but found ${JSON.stringify(manifest.private)}`);
  }
}

const rootManifest = readJson('package.json');
expectEqual(rootManifest.private, true, 'package.json private');
expectEqual(rootManifest.license, 'MIT', 'package.json license');

const publicWorkspacePackages = [
  'packages/sdk/package.json',
  'packages/babysitter/package.json',
  'packages/babysitter-agent/package.json',
  'packages/agent-plugins-mux/package.json',
  'packages/kanban/package.json',
  'packages/observer-dashboard/package.json',
  'packages/breakpoints-mux/package.json',
  'packages/agent-mux/observability/package.json',
  'packages/agent-mux/core/package.json',
  'packages/agent-mux/adapters/package.json',
  'packages/agent-mux/harness-mock/package.json',
  'packages/agent-mux/ui/package.json',
  'packages/agent-mux/gateway/package.json',
  'packages/agent-mux/cli/package.json',
  'packages/agent-mux/webui/package.json',
  'packages/agent-mux/sdk/package.json',
  'packages/agent-mux/tui/package.json',
];

const publicHooksMuxPackages = [
  'packages/hooks-mux/core/package.json',
  'packages/hooks-mux/cli/package.json',
  'packages/hooks-mux/adapter-claude/package.json',
  'packages/hooks-mux/adapter-codex/package.json',
  'packages/hooks-mux/adapter-gemini/package.json',
  'packages/hooks-mux/adapter-copilot/package.json',
  'packages/hooks-mux/adapter-cursor/package.json',
  'packages/hooks-mux/adapter-pi/package.json',
  'packages/hooks-mux/adapter-oh-my-pi/package.json',
  'packages/hooks-mux/adapter-opencode/package.json',
  'packages/hooks-mux/adapter-openclaw/package.json',
];

const publicPluginPackages = [
  'plugins/babysitter-codex/package.json',
  'plugins/babysitter-cursor/package.json',
  'plugins/babysitter-github/package.json',
  'plugins/babysitter-gemini/package.json',
  'plugins/babysitter-omp/package.json',
  'plugins/babysitter-opencode/package.json',
  'plugins/babysitter-openclaw/package.json',
  'plugins/babysitter-paperclip/package.json',
  'plugins/babysitter-pi/package.json',
];

for (const relativePath of [
  ...publicWorkspacePackages,
  ...publicHooksMuxPackages,
  ...publicPluginPackages,
]) {
  const manifest = readJson(relativePath);
  const packageDir = path.dirname(relativePath);
  const readmeRelativePath = path.join(packageDir, 'README.md');
  const readmeFullPath = path.join(repoRoot, readmeRelativePath);

  expectPublicPackage(manifest, `${relativePath}`);
  expectEqual(manifest.license, 'MIT', `${relativePath} license`);
  expectEqual(manifest.publishConfig && manifest.publishConfig.access, 'public', `${relativePath} publishConfig.access`);

  if (!fs.existsSync(readmeFullPath)) {
    fail(`${relativePath} is public but ${readmeRelativePath} is missing`);
  }

  if (!Array.isArray(manifest.files)) {
    fail(`${relativePath} must declare a files array for publish auditing`);
  }

  if (!manifest.files.includes('README.md')) {
    fail(`${relativePath} must include README.md in files for publish-surface parity`);
  }

  for (const entry of manifest.files) {
    if (typeof entry !== 'string') {
      continue;
    }
    if (entry.toLowerCase().endsWith('.md')) {
      const docPath = path.join(repoRoot, packageDir, entry);
      if (!fs.existsSync(docPath)) {
        fail(`${relativePath} references missing documentation file ${path.join(packageDir, entry)}`);
      }
    }
  }
}

console.log('Metadata verification passed.');
