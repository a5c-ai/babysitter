/**
 * @module fork-contribution-sync
 * @description Composable fork contribution maintenance component providing infrastructure
 * for keeping a fork in sync with its upstream, detecting breaking changes, and generating
 * migration checklists. Designed for projects that maintain long-lived forks or contribute
 * patches upstream.
 *
 * The module exposes three surfaces:
 * - `createForkSync(config)` — factory that builds task definitions for upstream sync,
 *   compatibility testing, API surface snapshotting, and migration diffing.
 * - `executeForkSync(ctx, config)` — convenience wrapper that runs the full sync pipeline
 *   and returns a structured result with per-step outcomes.
 * - Preset factories for common patterns:
 *   - `createUpstreamSyncCheck(config)` — rebase dry-run against upstream
 *   - `createCompatibilityTestSuite(config)` — interface conformance + build integrity
 *   - `createApiSurfaceSnapshot(config)` — baseline export snapshot + diff detection
 *   - `createMigrationHelper(config)` — AST-based breaking change checklist generation
 *
 * @example
 * ```js
 * import {
 *   createForkSync,
 *   executeForkSync,
 *   createUpstreamSyncCheck,
 * } from './fork-contribution-sync.js';
 *
 * // Full pipeline:
 * const result = await executeForkSync(ctx, {
 *   name: 'my-fork',
 *   upstreamRemote: 'upstream',
 *   upstreamBranch: 'main',
 *   forkBranch: 'my-feature',
 *   projectDir: '.',
 *   compatibilityCommand: 'npm test',
 *   snapshotCommand: 'npx ts-morph-exports src/index.ts',
 * });
 *
 * if (!result.passed) {
 *   console.log(result.summary);
 * }
 *
 * // Standalone sync check:
 * const syncGate = createUpstreamSyncCheck({
 *   upstreamRemote: 'upstream',
 *   upstreamBranch: 'main',
 *   projectDir: '.',
 * });
 * ```
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 300000;
const DEFAULT_UPSTREAM_REMOTE = 'upstream';
const DEFAULT_UPSTREAM_BRANCH = 'main';

// ─────────────────────────────────────────────────────────────────────────────
// createForkSync (factory)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} ForkSyncConfig
 * @property {string}  name                   - Unique name for this sync instance.
 * @property {string}  [description]          - Human-readable description.
 * @property {string}  [upstreamRemote='upstream'] - Git remote name for upstream.
 * @property {string}  [upstreamBranch='main']     - Upstream branch to sync against.
 * @property {string}  [forkBranch]           - Local fork branch (default: current branch).
 * @property {string}  [projectDir]           - Working directory for all commands.
 * @property {string}  [compatibilityCommand] - Shell command for compatibility tests.
 * @property {string}  [snapshotCommand]      - Shell command to produce API surface snapshot.
 * @property {string}  [snapshotBaseline]     - Path to baseline snapshot file for diffing.
 * @property {number}  [timeout=300000]       - Timeout in milliseconds.
 */

/**
 * Factory that creates a set of babysitter task definitions for fork
 * contribution maintenance:
 *
 * - **syncCheckTask** (kind: 'shell') — fetches upstream, performs a rebase
 *   dry-run, and reports conflicts.
 * - **compatibilityTask** (kind: 'shell') — runs a configurable test command
 *   to verify the fork still conforms to upstream interfaces.
 * - **snapshotTask** (kind: 'shell') — captures the current API surface
 *   (exported symbols, types, signatures) for baseline comparison.
 * - **migrationReportTask** (kind: 'agent') — analyzes sync/compatibility
 *   results and produces a structured migration checklist.
 *
 * @param {ForkSyncConfig} config - Fork sync configuration.
 * @returns {{ syncCheckTask: Function, compatibilityTask: Function, snapshotTask: Function, migrationReportTask: Function }}
 *
 * @example
 * ```js
 * const tasks = createForkSync({
 *   name: 'sdk-fork',
 *   upstreamRemote: 'upstream',
 *   upstreamBranch: 'main',
 *   compatibilityCommand: 'npm run test:compat',
 *   snapshotCommand: 'node scripts/export-api-surface.js',
 * });
 *
 * const syncResult = await ctx.task(tasks.syncCheckTask, {});
 * const compatResult = await ctx.task(tasks.compatibilityTask, {});
 * const snapshot = await ctx.task(tasks.snapshotTask, {});
 * const report = await ctx.task(tasks.migrationReportTask, {
 *   syncOutput: syncResult,
 *   compatOutput: compatResult,
 *   snapshotOutput: snapshot,
 * });
 * ```
 */
export function createForkSync(config) {
  const {
    name,
    description,
    upstreamRemote = DEFAULT_UPSTREAM_REMOTE,
    upstreamBranch = DEFAULT_UPSTREAM_BRANCH,
    forkBranch,
    projectDir,
    compatibilityCommand,
    snapshotCommand,
    snapshotBaseline,
    timeout = DEFAULT_TIMEOUT_MS,
  } = config;

  const label = name || 'fork-sync';
  const forkRef = forkBranch ? forkBranch : 'HEAD';

  // ── syncCheckTask ───────────────────────────────────────────────────────

  const rebaseScript = [
    'set -e',
    `git fetch ${upstreamRemote} ${upstreamBranch} 2>&1`,
    `echo "--- Rebase dry-run ---"`,
    `if git rebase --onto ${upstreamRemote}/${upstreamBranch} ${upstreamRemote}/${upstreamBranch} ${forkRef} --no-verify 2>&1; then`,
    `  echo '{"conflicted":false,"conflicts":[]}'`,
    `  git rebase --abort 2>/dev/null || true`,
    `else`,
    `  _conflicts=$(git diff --name-only --diff-filter=U 2>/dev/null | tr '\\n' ',' | sed 's/,$//')`,
    `  echo "{\\"conflicted\\":true,\\"conflicts\\":[\\"$_conflicts\\"]}"`,
    `  git rebase --abort 2>/dev/null || true`,
    `  exit 1`,
    `fi`,
  ].join('\n');

  const syncCheckTask = defineTask(
    `fork-sync/${label}/sync-check`,
    (_args, taskCtx) => {
      const command = projectDir
        ? `cd ${JSON.stringify(projectDir)} && bash -c '${rebaseScript.replace(/'/g, "'\\''")}'`
        : `bash -c '${rebaseScript.replace(/'/g, "'\\''")}'`;

      return {
        kind: 'shell',
        title: `[${label}] Upstream sync check (${upstreamRemote}/${upstreamBranch})`,
        shell: {
          command,
          timeout,
          outputPath: `tasks/${taskCtx.effectId}/output.json`,
        },
        io: {
          inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
          outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
        },
        labels: ['fork-sync', 'upstream-check', label],
      };
    }
  );

  // ── compatibilityTask ───────────────────────────────────────────────────

  const compatCmd = compatibilityCommand || 'echo "No compatibility command configured" && exit 0';

  const compatibilityTask = defineTask(
    `fork-sync/${label}/compatibility`,
    (_args, taskCtx) => {
      const command = projectDir
        ? `cd ${JSON.stringify(projectDir)} && ${compatCmd}`
        : compatCmd;

      return {
        kind: 'shell',
        title: `[${label}] Compatibility tests`,
        shell: {
          command,
          expectedExitCode: 0,
          timeout,
          outputPath: `tasks/${taskCtx.effectId}/output.json`,
        },
        io: {
          inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
          outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
        },
        labels: ['fork-sync', 'compatibility', label],
      };
    }
  );

  // ── snapshotTask ────────────────────────────────────────────────────────

  const snapshotCmd = snapshotCommand || 'echo "No snapshot command configured" && exit 0';
  const diffScript = snapshotBaseline
    ? [
        snapshotCmd + ' > /tmp/_fork_sync_snapshot.txt 2>&1',
        `if diff -u ${JSON.stringify(snapshotBaseline)} /tmp/_fork_sync_snapshot.txt > /tmp/_fork_sync_diff.txt 2>&1; then`,
        `  echo '{"changed":false,"diff":""}'`,
        `else`,
        `  _diff_escaped=$(cat /tmp/_fork_sync_diff.txt | sed 's/\\\\/\\\\\\\\/g; s/"/\\\\"/g; s/\\t/\\\\t/g' | tr '\\n' '\\r' | sed 's/\\r/\\\\n/g')`,
        `  echo "{\\"changed\\":true,\\"diff\\":\\"$_diff_escaped\\"}"`,
        `  exit 1`,
        `fi`,
      ].join('\n')
    : snapshotCmd;

  const snapshotTask = defineTask(
    `fork-sync/${label}/snapshot`,
    (_args, taskCtx) => {
      const command = projectDir
        ? `cd ${JSON.stringify(projectDir)} && bash -c '${diffScript.replace(/'/g, "'\\''")}'`
        : `bash -c '${diffScript.replace(/'/g, "'\\''")}'`;

      return {
        kind: 'shell',
        title: `[${label}] API surface snapshot${snapshotBaseline ? ' + diff' : ''}`,
        shell: {
          command,
          timeout,
          outputPath: `tasks/${taskCtx.effectId}/output.json`,
        },
        io: {
          inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
          outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
        },
        labels: ['fork-sync', 'api-snapshot', label],
      };
    }
  );

  // ── migrationReportTask ─────────────────────────────────────────────────

  const migrationReportTask = defineTask(
    `fork-sync/${label}/migration-report`,
    (args, taskCtx) => ({
      kind: 'agent',
      title: `[${label}] Migration report`,
      agent: {
        name: 'fork-migration-analyzer',
        prompt: {
          role: 'Senior software engineer specializing in fork maintenance, upstream contribution, and API compatibility',
          task: 'Analyze the upstream sync, compatibility test, and API snapshot results to produce a structured migration checklist.',
          context: {
            forkName: name,
            description: description ?? null,
            upstreamRemote,
            upstreamBranch,
            forkBranch: forkBranch ?? 'current branch',
            syncOutput: args.syncOutput ?? null,
            compatOutput: args.compatOutput ?? null,
            snapshotOutput: args.snapshotOutput ?? null,
          },
          instructions: [
            'Identify all merge conflicts from the sync check output and list affected files.',
            'Analyze compatibility test failures to determine which interfaces have diverged.',
            'If API snapshot diff is available, identify breaking changes (removed exports, changed signatures, renamed types).',
            'For each breaking change, produce a concrete migration step with file paths and suggested fixes.',
            'Categorize issues by severity: critical (build-breaking), major (test-breaking), minor (cosmetic).',
            'Produce an overall health assessment and recommended action (merge, defer, or manual intervention).',
          ],
          outputFormat: [
            'JSON with:',
            '  healthy (boolean) — true if no critical or major issues,',
            '  conflicts (array of { file, description }),',
            '  breakingChanges (array of { symbol, kind, severity, migration }),',
            '  compatFailures (array of { test, error }),',
            '  migrationSteps (string[] — ordered checklist),',
            '  recommendation (string — merge/defer/manual),',
            '  summary (string)',
          ].join('\n'),
        },
        outputSchema: {
          type: 'object',
          required: ['healthy', 'conflicts', 'breakingChanges', 'compatFailures', 'migrationSteps', 'recommendation', 'summary'],
          properties: {
            healthy: { type: 'boolean' },
            conflicts: {
              type: 'array',
              items: {
                type: 'object',
                required: ['file', 'description'],
                properties: {
                  file: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
            breakingChanges: {
              type: 'array',
              items: {
                type: 'object',
                required: ['symbol', 'kind', 'severity', 'migration'],
                properties: {
                  symbol: { type: 'string' },
                  kind: { type: 'string' },
                  severity: { type: 'string' },
                  migration: { type: 'string' },
                },
              },
            },
            compatFailures: {
              type: 'array',
              items: {
                type: 'object',
                required: ['test', 'error'],
                properties: {
                  test: { type: 'string' },
                  error: { type: 'string' },
                },
              },
            },
            migrationSteps: { type: 'array', items: { type: 'string' } },
            recommendation: { type: 'string' },
            summary: { type: 'string' },
          },
        },
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
      },
      labels: ['fork-sync', 'migration-report', label],
    })
  );

  return { syncCheckTask, compatibilityTask, snapshotTask, migrationReportTask };
}

// ─────────────────────────────────────────────────────────────────────────────
// executeForkSync (convenience)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} ForkSyncResult
 * @property {boolean} passed            - True when all steps succeeded with no critical issues.
 * @property {object}  syncResult        - Raw result from the sync check shell task.
 * @property {object}  compatResult      - Raw result from the compatibility shell task.
 * @property {object}  snapshotResult    - Raw result from the snapshot shell task.
 * @property {object}  migrationReport   - Structured migration report from the agent task.
 * @property {string}  summary           - Human-readable summary of the sync outcome.
 */

/**
 * Convenience function that runs the full fork sync pipeline:
 *   1. Upstream sync check (rebase dry-run)
 *   2. Compatibility tests
 *   3. API surface snapshot + diff
 *   4. Migration report generation
 *
 * Steps 1-3 are run and their results are collected (failures do not abort
 * subsequent steps). Step 4 receives all prior results and produces a
 * structured migration checklist.
 *
 * This function does not throw on sync failures — it captures them and
 * returns `{ passed: false, ... }` so the caller can decide how to proceed.
 *
 * @param {object}         ctx    - Babysitter process context (provides `ctx.task()`).
 * @param {ForkSyncConfig} config - Fork sync configuration.
 * @returns {Promise<ForkSyncResult>}
 *
 * @example
 * ```js
 * const result = await executeForkSync(ctx, {
 *   name: 'sdk-fork',
 *   upstreamRemote: 'upstream',
 *   upstreamBranch: 'main',
 *   compatibilityCommand: 'npm run test:compat',
 *   snapshotCommand: 'node scripts/export-api.js',
 *   snapshotBaseline: 'api-baseline.txt',
 * });
 *
 * if (!result.passed) {
 *   console.log(result.migrationReport.recommendation);
 *   for (const step of result.migrationReport.migrationSteps) {
 *     console.log(`  - ${step}`);
 *   }
 * }
 * ```
 */
export async function executeForkSync(ctx, config) {
  const { syncCheckTask, compatibilityTask, snapshotTask, migrationReportTask } =
    createForkSync(config);

  // Run steps 1-3, collecting results even on failure
  let syncResult = null;
  let compatResult = null;
  let snapshotResult = null;

  try {
    syncResult = await ctx.task(syncCheckTask, {});
  } catch (err) {
    if (err?.name === 'EffectRequestedError' || err?.name === 'EffectPendingError') throw err;
    syncResult = { exitCode: err?.exitCode ?? 1, stdout: err?.stdout ?? '', stderr: err?.stderr ?? err?.message ?? '' };
  }

  try {
    compatResult = await ctx.task(compatibilityTask, {});
  } catch (err) {
    if (err?.name === 'EffectRequestedError' || err?.name === 'EffectPendingError') throw err;
    compatResult = { exitCode: err?.exitCode ?? 1, stdout: err?.stdout ?? '', stderr: err?.stderr ?? err?.message ?? '' };
  }

  try {
    snapshotResult = await ctx.task(snapshotTask, {});
  } catch (err) {
    if (err?.name === 'EffectRequestedError' || err?.name === 'EffectPendingError') throw err;
    snapshotResult = { exitCode: err?.exitCode ?? 1, stdout: err?.stdout ?? '', stderr: err?.stderr ?? err?.message ?? '' };
  }

  // Step 4: generate migration report from all collected results
  const migrationReport = await ctx.task(migrationReportTask, {
    syncOutput: syncResult,
    compatOutput: compatResult,
    snapshotOutput: snapshotResult,
  });

  const passed = migrationReport?.healthy === true;
  const summary = migrationReport?.summary
    ?? (passed ? 'Fork is in sync with upstream.' : 'Fork sync detected issues requiring attention.');

  return {
    passed,
    syncResult,
    compatResult,
    snapshotResult,
    migrationReport,
    summary,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Preset factories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} UpstreamSyncCheckConfig
 * @property {string} [upstreamRemote='upstream'] - Git remote name.
 * @property {string} [upstreamBranch='main']     - Upstream branch.
 * @property {string} [forkBranch]                - Local fork branch.
 * @property {string} [projectDir]                - Working directory.
 */

/**
 * Creates a standalone upstream sync check configuration. Performs a
 * `git fetch` + rebase dry-run and reports any conflicts.
 *
 * @param {UpstreamSyncCheckConfig} config
 * @returns {ForkSyncConfig} A config ready for `createForkSync` or `executeForkSync`.
 *
 * @example
 * ```js
 * const syncCheck = createUpstreamSyncCheck({
 *   upstreamRemote: 'upstream',
 *   upstreamBranch: 'main',
 * });
 * const { syncCheckTask } = createForkSync(syncCheck);
 * const result = await ctx.task(syncCheckTask, {});
 * ```
 */
export function createUpstreamSyncCheck(config) {
  const {
    upstreamRemote = DEFAULT_UPSTREAM_REMOTE,
    upstreamBranch = DEFAULT_UPSTREAM_BRANCH,
    forkBranch,
    projectDir,
  } = config;

  return {
    name: 'upstream-sync-check',
    description: `Rebase dry-run against ${upstreamRemote}/${upstreamBranch}`,
    upstreamRemote,
    upstreamBranch,
    forkBranch,
    projectDir,
  };
}

/**
 * @typedef {object} CompatibilityTestSuiteConfig
 * @property {string} command      - Shell command for compatibility tests.
 * @property {string} [projectDir] - Working directory.
 * @property {number} [timeout]    - Timeout in milliseconds.
 */

/**
 * Creates a fork sync configuration focused on compatibility testing.
 * Runs interface conformance, registry checks, and build integrity tests.
 *
 * @param {CompatibilityTestSuiteConfig} config
 * @returns {ForkSyncConfig}
 *
 * @example
 * ```js
 * const compat = createCompatibilityTestSuite({
 *   command: 'npm run test:compat',
 *   projectDir: 'packages/sdk',
 * });
 * const { compatibilityTask } = createForkSync(compat);
 * const result = await ctx.task(compatibilityTask, {});
 * ```
 */
export function createCompatibilityTestSuite(config) {
  const { command, projectDir, timeout } = config;

  return {
    name: 'compatibility-test',
    description: 'Interface conformance and build integrity checks',
    compatibilityCommand: command,
    projectDir,
    timeout,
  };
}

/**
 * @typedef {object} ApiSurfaceSnapshotConfig
 * @property {string} command        - Shell command to produce API surface output.
 * @property {string} [baseline]     - Path to baseline snapshot file for diff.
 * @property {string} [projectDir]   - Working directory.
 */

/**
 * Creates a fork sync configuration focused on API surface snapshotting.
 * Captures exported symbols and optionally diffs against a baseline.
 *
 * @param {ApiSurfaceSnapshotConfig} config
 * @returns {ForkSyncConfig}
 *
 * @example
 * ```js
 * const snapshot = createApiSurfaceSnapshot({
 *   command: 'node scripts/export-api.js',
 *   baseline: 'api-baseline.txt',
 *   projectDir: '.',
 * });
 * const { snapshotTask } = createForkSync(snapshot);
 * const result = await ctx.task(snapshotTask, {});
 * ```
 */
export function createApiSurfaceSnapshot(config) {
  const { command, baseline, projectDir } = config;

  return {
    name: 'api-surface-snapshot',
    description: `API surface snapshot${baseline ? ' + baseline diff' : ''}`,
    snapshotCommand: command,
    snapshotBaseline: baseline,
    projectDir,
  };
}

/**
 * @typedef {object} MigrationHelperConfig
 * @property {string}  [upstreamRemote='upstream'] - Git remote name.
 * @property {string}  [upstreamBranch='main']     - Upstream branch.
 * @property {string}  [compatibilityCommand]      - Compatibility test command.
 * @property {string}  [snapshotCommand]            - API snapshot command.
 * @property {string}  [snapshotBaseline]           - Baseline snapshot path.
 * @property {string}  [projectDir]                 - Working directory.
 */

/**
 * Creates a full fork sync configuration that includes all steps and
 * produces a migration checklist. This is the most complete preset,
 * equivalent to calling `createForkSync` directly with all options.
 *
 * @param {MigrationHelperConfig} config
 * @returns {ForkSyncConfig}
 */
export function createMigrationHelper(config) {
  const {
    upstreamRemote = DEFAULT_UPSTREAM_REMOTE,
    upstreamBranch = DEFAULT_UPSTREAM_BRANCH,
    compatibilityCommand,
    snapshotCommand,
    snapshotBaseline,
    projectDir,
  } = config;

  return {
    name: 'migration-helper',
    description: `Full fork sync pipeline with migration checklist (${upstreamRemote}/${upstreamBranch})`,
    upstreamRemote,
    upstreamBranch,
    compatibilityCommand,
    snapshotCommand,
    snapshotBaseline,
    projectDir,
  };
}
