---
name: semver-analyzer
description: Analyze code changes and determine semantic version bumps. Detect breaking changes automatically, suggest version bump (major/minor/patch), generate changelog entries, and validate version consistency.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: versioning-compatibility
  backlog-id: SK-SDK-004
---

# semver-analyzer

You are **semver-analyzer** - a specialized skill for analyzing code changes and determining appropriate semantic version bumps, ensuring consistent SDK versioning and clear communication of change impacts to consumers.

## Overview

This skill enables AI-powered semantic versioning including:
- Detecting breaking changes automatically
- Suggesting version bumps (major/minor/patch)
- Generating changelog entries from commits
- Validating version consistency across SDKs
- Enforcing conventional commit standards
- Creating release notes automatically
- Tracking version dependencies

## Prerequisites

- Git repository with version history
- Conventional commit messages (recommended)
- Package manifest files (package.json, pyproject.toml, etc.)
- semantic-release or similar tooling (optional)

## Capabilities

### 1. Breaking Change Detection

Automatically detect breaking changes in SDK code:

```typescript
// src/analyzer/breaking-changes.ts
import { parse } from '@typescript-eslint/parser';
import { diff } from 'deep-object-diff';

interface BreakingChange {
  type: 'removed' | 'signature-changed' | 'type-changed' | 'behavior-changed';
  location: string;
  description: string;
  severity: 'major' | 'warning';
  migration?: string;
}

interface AnalysisResult {
  hasBreakingChanges: boolean;
  breakingChanges: BreakingChange[];
  suggestedBump: 'major' | 'minor' | 'patch';
  confidence: number;
}

export async function analyzeChanges(
  oldVersion: string,
  newVersion: string,
  options: AnalyzerOptions
): Promise<AnalysisResult> {
  const oldApi = await extractPublicApi(oldVersion);
  const newApi = await extractPublicApi(newVersion);

  const breakingChanges: BreakingChange[] = [];

  // Check for removed exports
  for (const [name, oldExport] of Object.entries(oldApi.exports)) {
    if (!(name in newApi.exports)) {
      breakingChanges.push({
        type: 'removed',
        location: name,
        description: `Export '${name}' was removed`,
        severity: 'major',
        migration: `Remove usage of '${name}' or use alternative`
      });
    }
  }

  // Check for signature changes in functions
  for (const [name, newFunc] of Object.entries(newApi.functions)) {
    const oldFunc = oldApi.functions[name];
    if (!oldFunc) continue;

    // Check parameter changes
    if (newFunc.requiredParams > oldFunc.requiredParams) {
      breakingChanges.push({
        type: 'signature-changed',
        location: name,
        description: `Function '${name}' has new required parameters`,
        severity: 'major',
        migration: `Update calls to '${name}' to include new required parameters`
      });
    }

    // Check return type changes
    if (newFunc.returnType !== oldFunc.returnType) {
      if (!isTypeCompatible(oldFunc.returnType, newFunc.returnType)) {
        breakingChanges.push({
          type: 'type-changed',
          location: name,
          description: `Return type of '${name}' changed from '${oldFunc.returnType}' to '${newFunc.returnType}'`,
          severity: 'major'
        });
      }
    }
  }

  // Check for type changes in models
  for (const [name, newModel] of Object.entries(newApi.models)) {
    const oldModel = oldApi.models[name];
    if (!oldModel) continue;

    // Check for removed fields
    for (const field of Object.keys(oldModel.fields)) {
      if (!(field in newModel.fields)) {
        breakingChanges.push({
          type: 'removed',
          location: `${name}.${field}`,
          description: `Field '${field}' was removed from model '${name}'`,
          severity: 'major'
        });
      }
    }

    // Check for type changes in fields
    for (const [field, newField] of Object.entries(newModel.fields)) {
      const oldField = oldModel.fields[field];
      if (oldField && oldField.type !== newField.type) {
        breakingChanges.push({
          type: 'type-changed',
          location: `${name}.${field}`,
          description: `Field '${name}.${field}' type changed from '${oldField.type}' to '${newField.type}'`,
          severity: 'major'
        });
      }
    }
  }

  const hasBreakingChanges = breakingChanges.length > 0;

  return {
    hasBreakingChanges,
    breakingChanges,
    suggestedBump: hasBreakingChanges ? 'major' : await analyzeFeaturesAndFixes(oldVersion, newVersion),
    confidence: calculateConfidence(breakingChanges)
  };
}
```

### 2. Conventional Commit Analysis

Parse and analyze conventional commits:

```typescript
// src/analyzer/commits.ts
import { execSync } from 'child_process';

interface CommitInfo {
  hash: string;
  type: string;
  scope?: string;
  description: string;
  body?: string;
  breaking: boolean;
  footers: Record<string, string>;
}

interface CommitAnalysis {
  commits: CommitInfo[];
  suggestedBump: 'major' | 'minor' | 'patch';
  changelog: ChangelogSection[];
}

const COMMIT_PATTERN = /^(?<type>\w+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?: (?<description>.+)$/;

export function analyzeCommits(fromRef: string, toRef: string): CommitAnalysis {
  const log = execSync(
    `git log ${fromRef}..${toRef} --format="%H|||%s|||%b|||%N" --no-merges`,
    { encoding: 'utf8' }
  );

  const commits: CommitInfo[] = [];
  let suggestedBump: 'major' | 'minor' | 'patch' = 'patch';

  for (const entry of log.split('\n').filter(Boolean)) {
    const [hash, subject, body, notes] = entry.split('|||');
    const match = COMMIT_PATTERN.exec(subject);

    if (!match?.groups) continue;

    const commit: CommitInfo = {
      hash,
      type: match.groups.type,
      scope: match.groups.scope,
      description: match.groups.description,
      body: body?.trim(),
      breaking: match.groups.breaking === '!' || body?.includes('BREAKING CHANGE:'),
      footers: parseFooters(body)
    };

    commits.push(commit);

    // Determine version bump
    if (commit.breaking) {
      suggestedBump = 'major';
    } else if (commit.type === 'feat' && suggestedBump !== 'major') {
      suggestedBump = 'minor';
    }
  }

  return {
    commits,
    suggestedBump,
    changelog: generateChangelog(commits)
  };
}

function parseFooters(body?: string): Record<string, string> {
  if (!body) return {};

  const footers: Record<string, string> = {};
  const lines = body.split('\n');

  for (const line of lines) {
    const match = /^(?<key>[\w-]+): (?<value>.+)$/.exec(line);
    if (match?.groups) {
      footers[match.groups.key] = match.groups.value;
    }
  }

  return footers;
}

function generateChangelog(commits: CommitInfo[]): ChangelogSection[] {
  const sections: Record<string, CommitInfo[]> = {
    'Breaking Changes': [],
    'Features': [],
    'Bug Fixes': [],
    'Performance': [],
    'Documentation': [],
    'Other': []
  };

  for (const commit of commits) {
    if (commit.breaking) {
      sections['Breaking Changes'].push(commit);
    }

    switch (commit.type) {
      case 'feat':
        sections['Features'].push(commit);
        break;
      case 'fix':
        sections['Bug Fixes'].push(commit);
        break;
      case 'perf':
        sections['Performance'].push(commit);
        break;
      case 'docs':
        sections['Documentation'].push(commit);
        break;
      default:
        sections['Other'].push(commit);
    }
  }

  return Object.entries(sections)
    .filter(([_, commits]) => commits.length > 0)
    .map(([title, commits]) => ({
      title,
      items: commits.map(c => ({
        scope: c.scope,
        description: c.description,
        hash: c.hash.substring(0, 7)
      }))
    }));
}
```

### 3. Semantic Release Configuration

Configure semantic-release for automated versioning:

```javascript
// release.config.js
module.exports = {
  branches: [
    'main',
    { name: 'beta', prerelease: true },
    { name: 'alpha', prerelease: true }
  ],
  plugins: [
    ['@semantic-release/commit-analyzer', {
      preset: 'conventionalcommits',
      releaseRules: [
        { type: 'feat', release: 'minor' },
        { type: 'fix', release: 'patch' },
        { type: 'perf', release: 'patch' },
        { type: 'refactor', release: 'patch' },
        { type: 'docs', scope: 'api', release: 'patch' },
        { breaking: true, release: 'major' }
      ],
      parserOpts: {
        noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES', 'BREAKING']
      }
    }],
    ['@semantic-release/release-notes-generator', {
      preset: 'conventionalcommits',
      presetConfig: {
        types: [
          { type: 'feat', section: 'Features' },
          { type: 'fix', section: 'Bug Fixes' },
          { type: 'perf', section: 'Performance' },
          { type: 'refactor', section: 'Code Refactoring' },
          { type: 'docs', section: 'Documentation' },
          { type: 'chore', hidden: true }
        ]
      }
    }],
    ['@semantic-release/changelog', {
      changelogFile: 'CHANGELOG.md'
    }],
    ['@semantic-release/npm'],
    ['@semantic-release/git', {
      assets: ['CHANGELOG.md', 'package.json'],
      message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
    }],
    ['@semantic-release/github']
  ]
};
```

### 4. Version Consistency Validation

Validate version consistency across SDK implementations:

```typescript
// src/validator/version-consistency.ts
import { readFileSync } from 'fs';
import semver from 'semver';

interface SDKVersion {
  language: string;
  version: string;
  path: string;
}

interface ValidationResult {
  isConsistent: boolean;
  versions: SDKVersion[];
  issues: ValidationIssue[];
  recommendation: string;
}

export function validateVersionConsistency(
  sdkPaths: Record<string, string>
): ValidationResult {
  const versions: SDKVersion[] = [];
  const issues: ValidationIssue[] = [];

  // Extract versions from each SDK
  for (const [language, basePath] of Object.entries(sdkPaths)) {
    const version = extractVersion(language, basePath);
    versions.push({ language, version, path: basePath });
  }

  // Check consistency
  const uniqueVersions = new Set(versions.map(v => v.version));

  if (uniqueVersions.size > 1) {
    issues.push({
      type: 'version-mismatch',
      message: `SDKs have different versions: ${Array.from(uniqueVersions).join(', ')}`,
      severity: 'error'
    });
  }

  // Check semver validity
  for (const { language, version } of versions) {
    if (!semver.valid(version)) {
      issues.push({
        type: 'invalid-semver',
        message: `${language} SDK has invalid semver: ${version}`,
        severity: 'error'
      });
    }
  }

  // Check for prerelease consistency
  const prereleases = versions.filter(v => semver.prerelease(v.version));
  const releases = versions.filter(v => !semver.prerelease(v.version));

  if (prereleases.length > 0 && releases.length > 0) {
    issues.push({
      type: 'prerelease-mismatch',
      message: 'Some SDKs are prereleases while others are not',
      severity: 'warning'
    });
  }

  return {
    isConsistent: issues.filter(i => i.severity === 'error').length === 0,
    versions,
    issues,
    recommendation: generateRecommendation(versions, issues)
  };
}

function extractVersion(language: string, basePath: string): string {
  switch (language) {
    case 'typescript':
    case 'javascript': {
      const pkg = JSON.parse(readFileSync(`${basePath}/package.json`, 'utf8'));
      return pkg.version;
    }
    case 'python': {
      const toml = readFileSync(`${basePath}/pyproject.toml`, 'utf8');
      const match = /version\s*=\s*"([^"]+)"/.exec(toml);
      return match?.[1] ?? '0.0.0';
    }
    case 'java': {
      const pom = readFileSync(`${basePath}/pom.xml`, 'utf8');
      const match = /<version>([^<]+)<\/version>/.exec(pom);
      return match?.[1] ?? '0.0.0';
    }
    case 'go': {
      // Go modules use git tags, check go.mod
      const mod = readFileSync(`${basePath}/go.mod`, 'utf8');
      // Version typically comes from git tags
      return getLatestGitTag(basePath);
    }
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}
```

### 5. Changelog Generation

Generate comprehensive changelogs:

```typescript
// src/changelog/generator.ts
import { analyzeCommits } from '../analyzer/commits';

interface ChangelogOptions {
  version: string;
  date: string;
  fromRef: string;
  toRef: string;
  repositoryUrl?: string;
  includeCommitLinks?: boolean;
}

export function generateChangelog(options: ChangelogOptions): string {
  const analysis = analyzeCommits(options.fromRef, options.toRef);
  const lines: string[] = [];

  lines.push(`## [${options.version}](${options.repositoryUrl}/compare/${options.fromRef}...${options.toRef}) (${options.date})`);
  lines.push('');

  for (const section of analysis.changelog) {
    lines.push(`### ${section.title}`);
    lines.push('');

    for (const item of section.items) {
      const scope = item.scope ? `**${item.scope}:** ` : '';
      const link = options.includeCommitLinks && options.repositoryUrl
        ? ` ([${item.hash}](${options.repositoryUrl}/commit/${item.hash}))`
        : '';

      lines.push(`* ${scope}${item.description}${link}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

// Example output:
// ## [2.0.0](https://github.com/org/sdk/compare/v1.5.0...v2.0.0) (2026-01-24)
//
// ### Breaking Changes
//
// * **api:** remove deprecated getUsers method ([abc1234](https://github.com/org/sdk/commit/abc1234))
//
// ### Features
//
// * **users:** add batch operations ([def5678](https://github.com/org/sdk/commit/def5678))
// * **orders:** implement pagination support ([ghi9012](https://github.com/org/sdk/commit/ghi9012))
//
// ### Bug Fixes
//
// * **auth:** fix token refresh race condition ([jkl3456](https://github.com/org/sdk/commit/jkl3456))
```

### 6. Version Bump Automation

Automate version bumps across SDKs:

```typescript
// src/automation/bump.ts
import { execSync } from 'child_process';
import semver from 'semver';

interface BumpOptions {
  sdkPaths: Record<string, string>;
  bumpType: 'major' | 'minor' | 'patch' | 'prerelease';
  prereleaseTag?: string;
  dryRun?: boolean;
}

export async function bumpVersions(options: BumpOptions): Promise<BumpResult> {
  const results: Record<string, { old: string; new: string }> = {};

  // Get current versions
  const currentVersions = getVersions(options.sdkPaths);

  // Calculate new version (use TypeScript SDK as source of truth)
  const baseVersion = currentVersions['typescript'];
  const newVersion = semver.inc(
    baseVersion,
    options.bumpType,
    options.prereleaseTag
  );

  if (!newVersion) {
    throw new Error(`Failed to calculate new version from ${baseVersion}`);
  }

  if (options.dryRun) {
    console.log(`[DRY RUN] Would bump all SDKs to ${newVersion}`);
    return { dryRun: true, newVersion, changes: {} };
  }

  // Update each SDK
  for (const [language, path] of Object.entries(options.sdkPaths)) {
    const oldVersion = currentVersions[language];
    updateVersion(language, path, newVersion);
    results[language] = { old: oldVersion, new: newVersion };
  }

  return {
    dryRun: false,
    newVersion,
    changes: results
  };
}

function updateVersion(language: string, basePath: string, version: string): void {
  switch (language) {
    case 'typescript':
      execSync(`npm version ${version} --no-git-tag-version`, { cwd: basePath });
      break;

    case 'python':
      // Update pyproject.toml
      const tomlPath = `${basePath}/pyproject.toml`;
      const toml = readFileSync(tomlPath, 'utf8');
      const updated = toml.replace(/version\s*=\s*"[^"]+"/, `version = "${version}"`);
      writeFileSync(tomlPath, updated);
      break;

    case 'java':
      execSync(`mvn versions:set -DnewVersion=${version}`, { cwd: basePath });
      break;

    case 'go':
      // Go versions come from git tags
      execSync(`git tag v${version}`, { cwd: basePath });
      break;
  }
}
```

### 7. CI/CD Integration

GitHub Actions workflow for versioning:

```yaml
name: Version Analysis

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Analyze changes
        id: analyze
        run: |
          result=$(node scripts/analyze-version.js)
          echo "bump_type=$(echo $result | jq -r '.suggestedBump')" >> $GITHUB_OUTPUT
          echo "has_breaking=$(echo $result | jq -r '.hasBreakingChanges')" >> $GITHUB_OUTPUT

      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const bumpType = '${{ steps.analyze.outputs.bump_type }}';
            const hasBreaking = '${{ steps.analyze.outputs.has_breaking }}';

            const body = `## Version Analysis

            **Suggested version bump:** \`${bumpType}\`
            **Has breaking changes:** ${hasBreaking}

            ${hasBreaking === 'true' ? '⚠️ This PR contains breaking changes and will require a major version bump.' : ''}
            `;

            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body
            });

  release:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: analyze
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Semantic Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| changelog-generator | Generate changelogs from commits | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) |
| Specmatic MCP | Detect breaking changes | [GitHub](https://github.com/specmatic/specmatic-mcp-server) |

## Best Practices

1. **Conventional commits** - Use standard commit format
2. **Automate releases** - Use semantic-release
3. **Version lock SDKs** - Keep all SDK versions in sync
4. **Document breaking changes** - Clear migration guides
5. **Prerelease versions** - Use beta/alpha for testing
6. **Protect main** - Require PR reviews
7. **CI validation** - Analyze versions automatically
8. **Changelog automation** - Generate from commits

## Process Integration

This skill integrates with the following processes:
- `sdk-versioning-release-management.js` - Release workflow
- `backward-compatibility-management.js` - Breaking changes
- `api-versioning-strategy.js` - API version alignment
- `package-distribution.js` - Release publishing

## Output Format

```json
{
  "operation": "analyze",
  "currentVersion": "1.5.0",
  "suggestedVersion": "2.0.0",
  "suggestedBump": "major",
  "hasBreakingChanges": true,
  "breakingChanges": [
    {
      "type": "removed",
      "location": "UsersApi.getUsers",
      "description": "Method getUsers was removed",
      "migration": "Use list() instead"
    }
  ],
  "commits": {
    "features": 3,
    "fixes": 5,
    "breaking": 1
  },
  "changelogPreview": "## [2.0.0] - 2026-01-24\n\n### Breaking Changes\n..."
}
```

## Error Handling

- Validate semver format
- Handle missing version files
- Report invalid commit formats
- Warn on version inconsistencies
- Support rollback scenarios

## Constraints

- Requires git history access
- Conventional commits recommended
- Multi-language SDKs need sync
- Breaking changes need coordination
- Prereleases need clear tagging
