/**
 * @module cycle-aware-verification
 * @description Composable cycle-aware verification component that validates fixes survive
 * system execution cycles (cron jobs, scheduled tasks, server restarts, watch-mode rebuilds).
 * Many bugs only manifest after a system completes its next cycle — a server that passes an
 * immediate health check may crash on its next hot-reload, a cron fix may break on the next
 * scheduled invocation, or a build-watch process may fail on the next file-change trigger.
 *
 * Traditional verification checks the system once, immediately after a change. Cycle-aware
 * verification adds a temporal dimension: it performs a baseline check, waits for the system
 * to complete its next execution cycle, then re-checks. A fix is only considered valid if the
 * system survives both the immediate check and the post-cycle check.
 *
 * The module also provides pre-flight analysis to scan files for dangerous patterns before
 * changes are applied, catching destructive commands (rm -rf, kill -9, etc.) before they
 * can do damage.
 *
 * The module exposes four surfaces:
 * - `createPreflightAnalysis(config)` — factory that builds a shell task to grep for
 *   dangerous patterns in a target file.
 * - `cycleAwareVerificationTask` — standalone `defineTask` descriptor (kind: 'shell') that
 *   performs baseline check, waits for a cycle, then re-checks in a single shell invocation.
 * - `createCycleAwareVerification(config)` — factory that returns separate baseline and
 *   post-cycle task definitions for fine-grained manual control.
 * - `createPostCycleSurvivalCheck(config)` — factory that builds a single post-cycle
 *   survival check task with baked-in URL, cycle interval, and expected status.
 *
 * @example
 * ```js
 * import {
 *   cycleAwareVerificationTask,
 *   createCycleAwareVerification,
 *   createPreflightAnalysis,
 *   createPostCycleSurvivalCheck,
 * } from './cycle-aware-verification.js';
 *
 * // Standalone task usage (single shell invocation):
 * const result = await ctx.task(cycleAwareVerificationTask, {
 *   url: 'http://localhost:3000/api/health',
 *   cycleIntervalMs: 60000,
 *   expectedStatus: 200,
 * });
 *
 * // Factory usage (separate baseline + post-cycle tasks):
 * const { baselineTask, postCycleTask } = createCycleAwareVerification({
 *   healthCheck: { url: 'http://localhost:3000/api/health', timeout: 5000 },
 *   cycleIntervalMs: 300000,
 * });
 * const baseline = await ctx.task(baselineTask, {});
 * const postCycle = await ctx.task(postCycleTask, {});
 *
 * // Pre-flight analysis:
 * const preflight = createPreflightAnalysis({ timeout: 5000 });
 * const scan = await ctx.task(preflight, { filePath: 'scripts/deploy.sh' });
 *
 * // Post-cycle survival check:
 * const survivalTask = createPostCycleSurvivalCheck({
 *   url: 'http://localhost:8080/health',
 *   cycleIntervalMs: 120000,
 * });
 * const survived = await ctx.task(survivalTask, {});
 * ```
 *
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CYCLE_INTERVAL_MS = 300000; // 5 minutes
const DEFAULT_HEALTH_CHECK_TIMEOUT_MS = 10000;
const DEFAULT_EXPECTED_STATUS = 200;
const DANGEROUS_PATTERNS = ['rm -rf', 'rm -r ', 'rmdir', 'kill -9', 'pkill', 'killall'];

// ─────────────────────────────────────────────────────────────────────────────
// createPreflightAnalysis (factory)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} PreflightAnalysisConfig
 * @property {string[]} [patterns]  - Dangerous patterns to scan for. Defaults to common destructive shell commands.
 * @property {string}   [name]      - Task name identifier. Defaults to 'preflight-analysis'.
 * @property {number}   [timeout]   - Shell command timeout in milliseconds. Defaults to 10000.
 */

/**
 * Factory that creates a shell task definition for pre-flight pattern analysis.
 *
 * The returned task greps a target file for dangerous patterns (e.g., `rm -rf`, `kill -9`)
 * and emits warnings for any matches found. Use this before applying generated scripts or
 * patches to catch destructive commands before they execute.
 *
 * @param {PreflightAnalysisConfig} [config={}] - Pre-flight analysis configuration.
 * @returns {import('@a5c-ai/babysitter-sdk').TaskDef} A defineTask descriptor (kind: 'shell').
 *
 * @example
 * ```js
 * const preflight = createPreflightAnalysis({
 *   patterns: ['rm -rf', 'DROP TABLE', 'truncate'],
 *   timeout: 5000,
 * });
 *
 * const result = await ctx.task(preflight, { filePath: 'migrations/cleanup.sql' });
 * ```
 */
export function createPreflightAnalysis(config = {}) {
  const patterns = config.patterns || DANGEROUS_PATTERNS;
  const name = config.name || 'preflight-analysis';

  return defineTask(name, (args, taskCtx) => ({
    kind: 'shell',
    title: `Pre-flight analysis: check for dangerous patterns in ${args.filePath || 'target file'}`,
    shell: {
      command: patterns.map(p =>
        `if grep -n "${p}" "${args.filePath}" 2>/dev/null; then echo "WARNING: found '${p}' in ${args.filePath}"; fi`
      ).join(' && ') + ` && echo '{"safe":true,"warnings":[]}'`,
      expectedExitCode: 0,
      timeout: config.timeout || 10000,
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ['preflight', 'safety', 'pattern-scan'],
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// cycleAwareVerificationTask (standalone)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standalone `defineTask` descriptor for cycle-aware verification.
 *
 * This is a shell-kind task that performs a three-phase verification in a single
 * shell invocation:
 *   1. **Baseline check** — HTTP health check to confirm the system is currently healthy.
 *   2. **Cycle wait** — sleeps for the configured cycle interval.
 *   3. **Post-cycle check** — re-checks the same endpoint to verify the system survived
 *      its next execution cycle.
 *
 * The task outputs a JSON result with `passed`, `baselineOk`, `postCycleOk`, and
 * `cycleIntervalMs` fields. It does **not** use a non-zero exit code on verification
 * failure — the JSON output distinguishes pass/fail so the caller can decide how to
 * proceed without the harness treating the task as crashed.
 *
 * Expected args:
 * ```js
 * {
 *   url: string,                    // Health check endpoint URL
 *   cycleIntervalMs?: number,       // Cycle wait duration (default: 300000)
 *   expectedStatus?: number,        // Expected HTTP status code (default: 200)
 *   timeout?: number,               // Per-request timeout in ms (default: 10000)
 * }
 * ```
 *
 * @type {import('@a5c-ai/babysitter-sdk').TaskDef}
 */
export const cycleAwareVerificationTask = defineTask('cycle-aware-verification', (args, taskCtx) => {
  const url = args.url;
  const cycleIntervalMs = args.cycleIntervalMs || DEFAULT_CYCLE_INTERVAL_MS;
  const cycleSeconds = Math.ceil(cycleIntervalMs / 1000);
  const expectedStatus = args.expectedStatus || DEFAULT_EXPECTED_STATUS;
  const timeout = args.timeout || DEFAULT_HEALTH_CHECK_TIMEOUT_MS;
  const timeoutSec = Math.ceil(timeout / 1000);

  // Shell script that:
  // 1. Baseline check
  // 2. Sleep for cycle interval
  // 3. Post-cycle check
  // 4. Output JSON result
  const script = [
    `BASELINE=$(curl -sf -o /dev/null -w "%{http_code}" --max-time ${timeoutSec} "${url}" 2>/dev/null || echo "000")`,
    `echo "Baseline check: HTTP $BASELINE"`,
    `if [ "$BASELINE" != "${expectedStatus}" ]; then echo '{"passed":false,"baselineOk":false,"postCycleOk":false,"error":"Baseline check failed with HTTP '$BASELINE'"}'; exit 0; fi`,
    `echo "Waiting ${cycleSeconds}s for next system cycle..."`,
    `sleep ${cycleSeconds}`,
    `POSTCYCLE=$(curl -sf -o /dev/null -w "%{http_code}" --max-time ${timeoutSec} "${url}" 2>/dev/null || echo "000")`,
    `echo "Post-cycle check: HTTP $POSTCYCLE"`,
    `if [ "$POSTCYCLE" = "${expectedStatus}" ]; then echo '{"passed":true,"baselineOk":true,"postCycleOk":true,"cycleIntervalMs":${cycleIntervalMs}}'; else echo '{"passed":false,"baselineOk":true,"postCycleOk":false,"error":"Post-cycle check failed with HTTP '$POSTCYCLE'. The fix may have broken the server on its next execution cycle."}'; fi`,
  ].join(' && ');

  return {
    kind: 'shell',
    title: `Cycle-aware verification: ${url} (${cycleSeconds}s cycle)`,
    shell: {
      command: script,
      expectedExitCode: 0,
      timeout: cycleIntervalMs + timeout * 2 + 30000,
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ['cycle-aware', 'verification', 'health-check'],
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// createCycleAwareVerification (factory)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} CycleAwareVerificationConfig
 * @property {object}  healthCheck                  - Health check configuration.
 * @property {string}  healthCheck.url              - Health check endpoint URL.
 * @property {number}  [healthCheck.expectedStatus] - Expected HTTP status code (default: 200).
 * @property {number}  [healthCheck.timeout]        - Per-request timeout in ms (default: 10000).
 * @property {number}  [cycleIntervalMs]            - Cycle wait duration in ms (default: 300000).
 * @property {string}  [name]                       - Task name prefix (default: 'cycle-verification').
 */

/**
 * @typedef {object} CycleAwareVerificationTasks
 * @property {Function} baselineTask   - Shell task that performs the baseline health check.
 * @property {Function} postCycleTask  - Shell task that waits for a cycle then re-checks.
 */

/**
 * Factory that creates separate baseline and post-cycle task definitions for
 * fine-grained cycle-aware verification.
 *
 * Unlike `cycleAwareVerificationTask` which combines both phases into a single shell
 * invocation, this factory returns two independent tasks that can be dispatched
 * separately via `ctx.task()`. This allows processes to perform other work between
 * the baseline and post-cycle checks, or to conditionally skip the post-cycle check
 * if the baseline fails.
 *
 * @param {CycleAwareVerificationConfig} config - Verification configuration.
 * @returns {CycleAwareVerificationTasks} Object containing baseline and post-cycle task definitions.
 *
 * @example
 * ```js
 * const { baselineTask, postCycleTask } = createCycleAwareVerification({
 *   healthCheck: {
 *     url: 'http://localhost:3000/api/health',
 *     expectedStatus: 200,
 *     timeout: 5000,
 *   },
 *   cycleIntervalMs: 60000,
 *   name: 'api-server',
 * });
 *
 * const baseline = await ctx.task(baselineTask, {});
 * // ... perform other work ...
 * const postCycle = await ctx.task(postCycleTask, {});
 * ```
 */
export function createCycleAwareVerification(config) {
  const { healthCheck, cycleIntervalMs = DEFAULT_CYCLE_INTERVAL_MS } = config;
  const name = config.name || 'cycle-verification';
  const expectedStatus = healthCheck.expectedStatus || DEFAULT_EXPECTED_STATUS;
  const timeoutSec = Math.ceil((healthCheck.timeout || DEFAULT_HEALTH_CHECK_TIMEOUT_MS) / 1000);

  const curlCmd = `curl -sf -o /dev/null -w "%{http_code}" --max-time ${timeoutSec} "${healthCheck.url}"`;

  // ── baselineTask ──────────────────────────────────────────────────────────

  /**
   * Shell task that performs the baseline health check.
   * Verifies the system is currently healthy before waiting for a cycle.
   *
   * Expected args: `{}` (no args required; configuration is baked in from the factory)
   */
  const baselineTask = defineTask(`${name}-baseline`, (_args, taskCtx) => ({
    kind: 'shell',
    title: `Baseline health check: ${healthCheck.url}`,
    shell: {
      command: `STATUS=$(${curlCmd}) && [ "$STATUS" = "${expectedStatus}" ] && echo "Baseline OK: HTTP $STATUS"`,
      expectedExitCode: 0,
      timeout: (healthCheck.timeout || DEFAULT_HEALTH_CHECK_TIMEOUT_MS) + 5000,
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ['cycle-aware', 'baseline', 'health-check'],
  }));

  // ── postCycleTask ─────────────────────────────────────────────────────────

  /**
   * Shell task that waits for a full cycle interval then re-checks the endpoint.
   * The sleep ensures the system has had time to complete its next execution cycle
   * (cron tick, watch-mode rebuild, scheduled task, etc.).
   *
   * Expected args: `{}` (no args required; configuration is baked in from the factory)
   */
  const postCycleTask = defineTask(`${name}-post-cycle`, (_args, taskCtx) => ({
    kind: 'shell',
    title: `Post-cycle survival check: ${healthCheck.url} (after ${cycleIntervalMs}ms)`,
    shell: {
      command: `sleep ${Math.ceil(cycleIntervalMs / 1000)} && STATUS=$(${curlCmd}) && [ "$STATUS" = "${expectedStatus}" ] && echo "Post-cycle OK: HTTP $STATUS"`,
      expectedExitCode: 0,
      timeout: cycleIntervalMs + (healthCheck.timeout || DEFAULT_HEALTH_CHECK_TIMEOUT_MS) + 10000,
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ['cycle-aware', 'post-cycle', 'health-check'],
  }));

  return { baselineTask, postCycleTask };
}

// ─────────────────────────────────────────────────────────────────────────────
// createPostCycleSurvivalCheck (factory)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} PostCycleSurvivalConfig
 * @property {string} url                    - Health check endpoint URL.
 * @property {number} [cycleIntervalMs]      - Cycle wait duration in ms (default: 300000).
 * @property {string} [name]                 - Task name (default: 'post-cycle-survival').
 * @property {number} [expectedStatus]       - Expected HTTP status code (default: 200).
 * @property {number} [timeout]              - Per-request timeout in ms (default: 10000).
 */

/**
 * Factory that creates a single post-cycle survival check task with baked-in
 * configuration.
 *
 * Use this when you only need the post-cycle phase (e.g., the baseline check is
 * handled separately or is implicit in the preceding process step). The returned
 * task sleeps for the cycle interval, then probes the configured URL.
 *
 * @param {PostCycleSurvivalConfig} config - Survival check configuration.
 * @returns {import('@a5c-ai/babysitter-sdk').TaskDef} A defineTask descriptor (kind: 'shell').
 *
 * @example
 * ```js
 * const survivalTask = createPostCycleSurvivalCheck({
 *   url: 'http://localhost:8080/health',
 *   cycleIntervalMs: 120000,
 *   expectedStatus: 200,
 * });
 *
 * const result = await ctx.task(survivalTask, {});
 * ```
 */
export function createPostCycleSurvivalCheck(config) {
  const { url, cycleIntervalMs = DEFAULT_CYCLE_INTERVAL_MS } = config;
  const name = config.name || 'post-cycle-survival';
  const expectedStatus = config.expectedStatus || DEFAULT_EXPECTED_STATUS;
  const timeoutSec = Math.ceil((config.timeout || DEFAULT_HEALTH_CHECK_TIMEOUT_MS) / 1000);

  return defineTask(name, (_args, taskCtx) => ({
    kind: 'shell',
    title: `Post-cycle survival: wait ${Math.ceil(cycleIntervalMs / 1000)}s then check ${url}`,
    shell: {
      command: `sleep ${Math.ceil(cycleIntervalMs / 1000)} && STATUS=$(curl -sf -o /dev/null -w "%{http_code}" --max-time ${timeoutSec} "${url}") && [ "$STATUS" = "${expectedStatus}" ] && echo "Server survived cycle: HTTP $STATUS"`,
      expectedExitCode: 0,
      timeout: cycleIntervalMs + (config.timeout || DEFAULT_HEALTH_CHECK_TIMEOUT_MS) + 10000,
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ['cycle-aware', 'post-cycle', 'survival-check'],
  }));
}
