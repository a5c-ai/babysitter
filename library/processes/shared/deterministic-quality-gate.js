/**
 * @module deterministic-quality-gate
 * @description Composable deterministic quality gate component that enforces hard shell-based
 * pass/fail verification. Unlike soft agent-prompt-based checks, this module runs shell commands
 * with `expectedExitCode: 0`, producing binary deterministic outcomes that cannot be negotiated
 * or reinterpreted by an agent.
 *
 * The module exposes three surfaces:
 * - `deterministicGateTask` — standalone `defineTask` descriptor (kind: 'shell') that runs
 *   an array of labeled check commands and enforces zero exit codes.
 * - `createDeterministicGate(config)` — factory that builds a shell gate task and an agent
 *   report task, parameterized by name, description, and command list.
 * - `executeDeterministicGate(ctx, config)` — convenience wrapper that runs the gate, catches
 *   failures, and returns a structured result with per-check pass/fail details.
 *
 * Additionally, preset factories are provided for common gate patterns:
 * - `createGrepCheck(config)` — grep-based pattern matching checks
 * - `createCompilationGate(config)` — tsc/eslint compilation gates
 * - `createTestSuiteGate(config)` — vitest/jest/pytest test runner gates
 * - `createRuntimeSmokeTest(config)` — server start + HTTP health check gates
 *
 * @example
 * ```js
 * import {
 *   deterministicGateTask,
 *   createDeterministicGate,
 *   executeDeterministicGate,
 *   createCompilationGate,
 *   createTestSuiteGate,
 * } from './deterministic-quality-gate.js';
 *
 * // Standalone task usage:
 * const result = await ctx.task(deterministicGateTask, {
 *   commands: [
 *     { label: 'TypeScript', command: 'npx tsc --noEmit' },
 *     { label: 'ESLint', command: 'npx eslint src/' },
 *   ],
 *   failFast: true,
 * });
 *
 * // Factory usage:
 * const { gateTask, reportTask } = createDeterministicGate({
 *   name: 'pre-merge',
 *   description: 'Pre-merge quality checks',
 *   commands: [
 *     { label: 'types', command: 'npx tsc --noEmit' },
 *     { label: 'lint', command: 'npx eslint src/' },
 *     { label: 'test', command: 'npx vitest run' },
 *   ],
 * });
 * const gateResult = await ctx.task(gateTask, {});
 * const report = await ctx.task(reportTask, { gateOutput: gateResult });
 *
 * // Convenience usage:
 * const outcome = await executeDeterministicGate(ctx, {
 *   name: 'ci-gate',
 *   commands: [
 *     { label: 'compile', command: 'npx tsc --noEmit' },
 *     { label: 'test', command: 'npx vitest run --reporter=verbose' },
 *   ],
 * });
 * if (!outcome.passed) {
 *   console.log(`${outcome.failedCount}/${outcome.totalCount} checks failed:`, outcome.summary);
 * }
 *
 * // Preset factory usage:
 * const tsGate = createCompilationGate({ tool: 'tsc', projectDir: 'packages/sdk' });
 * const testGate = createTestSuiteGate({ runner: 'vitest', projectDir: 'packages/sdk' });
 * ```
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 300000;
const DEFAULT_EXPECTED_EXIT_CODE = 0;
const DEFAULT_STARTUP_DELAY_MS = 3000;
const DEFAULT_EXPECTED_STATUS = 200;

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Escapes a string for safe inclusion in a single-quoted shell argument.
 *
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
function shellEscape(str) {
  return str.replace(/'/g, "'\\''");
}

/**
 * Builds a compound shell command that runs each check sequentially, capturing
 * per-check exit codes and producing a JSON summary on stdout.
 *
 * When `failFast` is true, the script exits immediately on the first failure.
 * Otherwise, all commands are run and the script exits with the count of failures.
 *
 * @param {object} opts
 * @param {Array<{label: string, command: string, expectedExitCode?: number}>} opts.commands - The checks to run.
 * @param {string}  [opts.projectDir]  - Working directory for all commands.
 * @param {boolean} [opts.failFast=false] - Stop on first failure.
 * @returns {string} The fully assembled compound shell command.
 */
function buildGateCommand(opts) {
  const {
    commands,
    projectDir,
    failFast = false,
  } = opts;

  // Build a bash script that runs each command, captures output and exit code,
  // and emits structured JSON to stdout at the end.
  const scriptLines = [
    '#!/usr/bin/env bash',
    'set +e',
    '_gate_failures=0',
    '_gate_total=0',
    '_gate_results="["',
    '_gate_first=1',
  ];

  for (const cmd of commands) {
    const expectedExit = typeof cmd.expectedExitCode === 'number'
      ? cmd.expectedExitCode
      : DEFAULT_EXPECTED_EXIT_CODE;
    const escapedLabel = shellEscape(cmd.label);
    const escapedCommand = shellEscape(cmd.command);

    scriptLines.push(
      `_gate_total=$((_gate_total + 1))`,
      `echo "--- [CHECK] ${escapedLabel} ---" >&2`,
      `_gate_output=$(${cmd.command} 2>&1)`,
      `_gate_exit=$?`,
      `_gate_passed="false"`,
      `if [ "$_gate_exit" -eq ${expectedExit} ]; then _gate_passed="true"; fi`,
      `if [ "$_gate_passed" = "false" ]; then _gate_failures=$((_gate_failures + 1)); fi`,
      // Escape the output for JSON embedding
      `_gate_output_escaped=$(printf '%s' "$_gate_output" | sed 's/\\\\/\\\\\\\\/g; s/"/\\\\"/g; s/\\t/\\\\t/g' | tr '\\n' '\\r' | sed 's/\\r/\\\\n/g')`,
      `if [ "$_gate_first" -eq 1 ]; then _gate_first=0; else _gate_results="$_gate_results,"; fi`,
      `_gate_results="$_gate_results{\\\"label\\\":\\\"${escapedLabel}\\\",\\\"command\\\":\\\"${escapedCommand}\\\",\\\"exitCode\\\":$_gate_exit,\\\"expectedExitCode\\\":${expectedExit},\\\"passed\\\":$_gate_passed,\\\"output\\\":\\\"$_gate_output_escaped\\\"}"`,
    );

    if (failFast) {
      scriptLines.push(
        `if [ "$_gate_passed" = "false" ]; then`,
        `  _gate_results="$_gate_results]"`,
        `  echo "{\\\"passed\\\":false,\\\"failedCount\\\":$_gate_failures,\\\"totalCount\\\":$_gate_total,\\\"results\\\":$_gate_results}"`,
        `  exit 1`,
        `fi`,
      );
    }
  }

  scriptLines.push(
    `_gate_results="$_gate_results]"`,
    `if [ "$_gate_failures" -eq 0 ]; then _gate_overall="true"; else _gate_overall="false"; fi`,
    `echo "{\\\"passed\\\":$_gate_overall,\\\"failedCount\\\":$_gate_failures,\\\"totalCount\\\":$_gate_total,\\\"results\\\":$_gate_results}"`,
    `exit $_gate_failures`,
  );

  const script = scriptLines.join('\n');

  if (projectDir) {
    return `cd ${JSON.stringify(projectDir)} && bash -c '${shellEscape(script)}'`;
  }

  return `bash -c '${shellEscape(script)}'`;
}

/**
 * Parses the structured JSON output from the gate command.
 *
 * @param {string} output - Raw stdout from the gate command.
 * @returns {{ passed: boolean, results: Array<{label: string, command: string, exitCode: number, passed: boolean, output: string}>, failedCount: number, totalCount: number } | null}
 */
function parseGateOutput(output) {
  if (!output || typeof output !== 'string') {
    return null;
  }

  // The JSON summary is the last line of stdout
  const lines = output.trim().split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        return JSON.parse(line);
      } catch (_e) {
        // Continue searching
      }
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// deterministicGateTask (standalone)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standalone `defineTask` descriptor for running a deterministic quality gate.
 *
 * This is a shell-kind task that runs an array of labeled commands and enforces
 * zero exit codes, making it a **hard gate** — any command that returns a non-zero
 * (or non-expected) exit code causes the task to fail.
 *
 * Expected args:
 * ```js
 * {
 *   commands: Array<{ label: string, command: string, expectedExitCode?: number }>,
 *   projectDir?: string,    // Working directory (default: current directory)
 *   failFast?: boolean,     // Stop on first failure (default: false)
 *   timeout?: number,       // Timeout in ms (default: 300000)
 * }
 * ```
 *
 * @type {import('@a5c-ai/babysitter-sdk').TaskDef}
 */
export const deterministicGateTask = defineTask(
  'deterministic-gate/run',
  (args, taskCtx) => ({
    kind: 'shell',
    title: `Deterministic quality gate (${(args.commands || []).length} checks)`,
    shell: {
      command: buildGateCommand({
        commands: args.commands || [],
        projectDir: args.projectDir,
        failFast: args.failFast ?? false,
      }),
      expectedExitCode: 0,
      timeout: args.timeout ?? DEFAULT_TIMEOUT_MS,
      outputPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ['quality-gate', 'deterministic', 'hard-gate'],
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// createDeterministicGate (factory)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} DeterministicGateConfig
 * @property {string}   name             - Unique name for this gate instance.
 * @property {string}   [description]    - Human-readable description of the gate's purpose.
 * @property {Array<{label: string, command: string, expectedExitCode?: number}>} commands - Check commands.
 * @property {string}   [projectDir]     - Working directory for all commands.
 * @property {boolean}  [failFast=false] - Stop on first failure.
 * @property {number}   [timeout=300000] - Timeout in milliseconds.
 */

/**
 * @typedef {object} DeterministicGateTasks
 * @property {Function} gateTask   - Shell task that runs all checks as a hard gate.
 * @property {Function} reportTask - Agent task that analyzes failures and suggests fixes.
 */

/**
 * Factory that creates a pair of babysitter task definitions for deterministic
 * quality gating:
 *
 * - **gateTask** (kind: 'shell') — runs each configured command and enforces expected
 *   exit codes. Uses `expectedExitCode: 0` to enforce a hard quality gate.
 * - **reportTask** (kind: 'agent') — analyzes gate failures, correlates outputs, and
 *   suggests actionable fixes.
 *
 * Both tasks are stateless and can be reused across multiple iterations.
 *
 * @param {DeterministicGateConfig} config - Gate configuration.
 * @returns {DeterministicGateTasks} Object containing the gate and report task definitions.
 *
 * @example
 * ```js
 * const { gateTask, reportTask } = createDeterministicGate({
 *   name: 'pre-commit',
 *   description: 'Pre-commit quality checks',
 *   commands: [
 *     { label: 'types', command: 'npx tsc --noEmit' },
 *     { label: 'lint', command: 'npx eslint src/ --max-warnings=0' },
 *     { label: 'test', command: 'npx vitest run' },
 *   ],
 *   failFast: false,
 *   timeout: 180000,
 * });
 *
 * const gateResult = await ctx.task(gateTask, {});
 * if (gateResult.exitCode !== 0) {
 *   const report = await ctx.task(reportTask, { gateOutput: gateResult });
 * }
 * ```
 */
export function createDeterministicGate(config) {
  const {
    name,
    description,
    commands,
    projectDir,
    failFast = false,
    timeout = DEFAULT_TIMEOUT_MS,
  } = config;

  const label = name || 'gate';

  // ── gateTask ─────────────────────────────────────────────────────────────

  /**
   * Shell task that executes all configured commands as a hard quality gate.
   * Exit code 0 is required for the task to succeed (all checks must pass).
   *
   * Expected args: `{}` (no args required; configuration is baked in from the factory)
   */
  const gateTask = defineTask(
    `deterministic-gate/${label}/run`,
    (_args, taskCtx) => ({
      kind: 'shell',
      title: `[${label}] Deterministic quality gate${description ? ` — ${description}` : ''}`,
      shell: {
        command: buildGateCommand({ commands, projectDir, failFast }),
        expectedExitCode: 0,
        timeout,
        outputPath: `tasks/${taskCtx.effectId}/output.json`,
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
      },
      labels: ['quality-gate', 'deterministic', 'hard-gate', label],
    })
  );

  // ── reportTask ───────────────────────────────────────────────────────────

  /**
   * Agent task that analyzes gate output and produces a structured failure report.
   *
   * Expected args:
   * ```js
   * { gateOutput: { stdout?: string, stderr?: string, exitCode?: number } }
   * ```
   *
   * Output schema:
   * ```json
   * {
   *   "totalChecks": number,
   *   "failedChecks": number,
   *   "failures": Array<{ label: string, command: string, exitCode: number, output: string }>,
   *   "suggestions": string[],
   *   "summary": string
   * }
   * ```
   */
  const reportTask = defineTask(
    `deterministic-gate/${label}/report`,
    (args, taskCtx) => ({
      kind: 'agent',
      title: `[${label}] Analyze quality gate failures`,
      agent: {
        name: 'gate-failure-analyzer',
        prompt: {
          role: 'Senior software engineer specializing in CI/CD quality gates, build systems, and automated verification',
          task: 'Analyze the provided quality gate output and produce a structured failure report with actionable remediation suggestions.',
          context: {
            gateName: name,
            description: description ?? null,
            projectDir: projectDir ?? '.',
            commands: commands.map((c) => ({ label: c.label, command: c.command })),
            gateOutput: args.gateOutput ?? null,
          },
          instructions: [
            'Parse the gate output to identify which checks passed and which failed.',
            'For each failed check, extract the relevant error output.',
            'Categorize failures by type (compilation, lint, test, runtime, etc.).',
            'Provide specific, actionable suggestions for resolving each failure.',
            'Write a concise summary of the overall gate health.',
          ],
          outputFormat: [
            'JSON with:',
            '  totalChecks (number),',
            '  failedChecks (number),',
            '  failures (array of { label, command, exitCode, output } for each failed check),',
            '  suggestions (string[] of actionable remediation steps),',
            '  summary (string)',
          ].join('\n'),
        },
        outputSchema: {
          type: 'object',
          required: ['totalChecks', 'failedChecks', 'failures', 'suggestions', 'summary'],
          properties: {
            totalChecks: { type: 'number' },
            failedChecks: { type: 'number' },
            failures: {
              type: 'array',
              items: {
                type: 'object',
                required: ['label', 'command', 'exitCode', 'output'],
                properties: {
                  label: { type: 'string' },
                  command: { type: 'string' },
                  exitCode: { type: 'number' },
                  output: { type: 'string' },
                },
              },
            },
            suggestions: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' },
          },
        },
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
      },
      labels: ['quality-gate', 'diagnostics', 'report', label],
    })
  );

  return { gateTask, reportTask };
}

// ─────────────────────────────────────────────────────────────────────────────
// executeDeterministicGate (convenience)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} GateCheckResult
 * @property {string}  label       - Human-readable label for the check.
 * @property {string}  command     - The shell command that was executed.
 * @property {number}  exitCode    - Actual exit code from the command.
 * @property {boolean} passed      - True when exit code matched the expected value.
 * @property {string}  output      - Raw stdout+stderr from the command.
 */

/**
 * @typedef {object} DeterministicGateResult
 * @property {boolean}            passed      - True when all checks passed.
 * @property {GateCheckResult[]}  results     - Per-check results array.
 * @property {string}             summary     - Human-readable summary of the gate outcome.
 * @property {number}             failedCount - Number of checks that failed.
 * @property {number}             totalCount  - Total number of checks executed.
 */

/**
 * Convenience function that runs a deterministic quality gate and returns a
 * structured result with per-check pass/fail details.
 *
 * Execution flow:
 *   1. Builds a shell task via `createDeterministicGate(config)`.
 *   2. Invokes the gate task via `ctx.task()`, catching failures (non-zero exit).
 *   3. Parses the structured JSON output from the gate command.
 *   4. Returns a comprehensive result object with pass/fail status, per-check
 *      results, and a human-readable summary.
 *
 * This function does **not** throw on gate failure — it captures the failure
 * and returns `{ passed: false, ... }` so the caller can decide how to proceed
 * (e.g., feed failures into a fix-and-retry loop, request a breakpoint, etc.).
 *
 * @param {object}                 ctx    - Babysitter process context (provides `ctx.task()`).
 * @param {DeterministicGateConfig} config - Gate configuration.
 * @returns {Promise<DeterministicGateResult>}
 *
 * @example
 * ```js
 * const result = await executeDeterministicGate(ctx, {
 *   name: 'post-refactor',
 *   commands: [
 *     { label: 'compile', command: 'npx tsc --noEmit' },
 *     { label: 'lint', command: 'npx eslint src/ --max-warnings=0' },
 *     { label: 'test', command: 'npx vitest run' },
 *   ],
 * });
 *
 * if (!result.passed) {
 *   console.log(`${result.failedCount}/${result.totalCount} checks failed:`);
 *   for (const check of result.results.filter(r => !r.passed)) {
 *     console.log(`  [FAIL] ${check.label}: exit code ${check.exitCode}`);
 *   }
 * }
 * ```
 */
export async function executeDeterministicGate(ctx, config) {
  const { gateTask } = createDeterministicGate(config);
  const commandCount = (config.commands || []).length;

  let taskResult;
  try {
    taskResult = await ctx.task(gateTask, {});
  } catch (err) {
    // If the task itself throws (e.g., EffectRequestedError), re-throw —
    // that's the replay engine signalling, not a gate failure.
    if (err?.name === 'EffectRequestedError' || err?.name === 'EffectPendingError') {
      throw err;
    }

    // For other errors (e.g., shell task returned non-zero exit code and the
    // harness surfaced it as an error), extract what we can from the error.
    const rawOutput = err?.stdout ?? err?.stderr ?? err?.message ?? String(err);
    const parsed = parseGateOutput(rawOutput);

    if (parsed) {
      return {
        passed: false,
        results: (parsed.results || []).map((r) => ({
          label: r.label,
          command: r.command,
          exitCode: r.exitCode,
          passed: r.passed,
          output: r.output || '',
        })),
        summary: `Quality gate failed: ${parsed.failedCount}/${parsed.totalCount} checks did not pass.`,
        failedCount: parsed.failedCount,
        totalCount: parsed.totalCount,
      };
    }

    // Could not parse structured output — return a generic failure
    return {
      passed: false,
      results: [],
      summary: `Quality gate failed with unparseable output (exit code ${typeof err?.exitCode === 'number' ? err.exitCode : 'unknown'}).`,
      failedCount: commandCount,
      totalCount: commandCount,
    };
  }

  // Task completed — extract output from the result structure.
  const stdout = taskResult?.stdout ?? '';
  const stderr = taskResult?.stderr ?? '';
  const rawOutput = [stdout, stderr].filter(Boolean).join('\n');
  const parsed = parseGateOutput(rawOutput);

  if (parsed) {
    return {
      passed: parsed.passed,
      results: (parsed.results || []).map((r) => ({
        label: r.label,
        command: r.command,
        exitCode: r.exitCode,
        passed: r.passed,
        output: r.output || '',
      })),
      summary: parsed.passed
        ? `All ${parsed.totalCount} quality checks passed.`
        : `Quality gate failed: ${parsed.failedCount}/${parsed.totalCount} checks did not pass.`,
      failedCount: parsed.failedCount,
      totalCount: parsed.totalCount,
    };
  }

  // Fallback: no structured output but task succeeded (exit 0)
  return {
    passed: true,
    results: [],
    summary: `Quality gate passed (${commandCount} checks).`,
    failedCount: 0,
    totalCount: commandCount,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Preset factories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} GrepCheckConfig
 * @property {Array<{label: string, pattern: string, file: string, expectMatch?: boolean}>} patterns - Grep patterns to check.
 * @property {string} [projectDir] - Working directory for grep commands.
 */

/**
 * Creates a deterministic gate configuration from grep-based pattern checks.
 *
 * Each pattern is converted to a `grep` command. By default, patterns are expected
 * to match (`expectMatch: true`). Set `expectMatch: false` to assert that a pattern
 * does NOT appear in the file (e.g., checking that debug statements are removed).
 *
 * @param {GrepCheckConfig} config - Grep check configuration.
 * @returns {DeterministicGateConfig} A gate configuration ready for `createDeterministicGate` or `executeDeterministicGate`.
 *
 * @example
 * ```js
 * const grepGate = createGrepCheck({
 *   patterns: [
 *     { label: 'No console.log', pattern: 'console\\.log', file: 'src/', expectMatch: false },
 *     { label: 'Has export', pattern: 'export default', file: 'src/index.ts', expectMatch: true },
 *   ],
 *   projectDir: 'packages/sdk',
 * });
 *
 * const result = await executeDeterministicGate(ctx, grepGate);
 * ```
 */
export function createGrepCheck(config) {
  const { patterns, projectDir } = config;

  const commands = patterns.map((p) => {
    const expectMatch = p.expectMatch !== false;
    // grep -r returns 0 if found, 1 if not found
    // When we expect a match: grep should exit 0 (found)
    // When we expect no match: grep should exit 1 (not found)
    const expectedExitCode = expectMatch ? 0 : 1;

    return {
      label: p.label,
      command: `grep -r -l ${JSON.stringify(p.pattern)} ${JSON.stringify(p.file)}`,
      expectedExitCode,
    };
  });

  return {
    name: 'grep-check',
    description: `Grep-based pattern checks (${patterns.length} patterns)`,
    commands,
    projectDir,
  };
}

/**
 * @typedef {object} CompilationGateConfig
 * @property {string}   tool            - Compilation tool: 'tsc', 'eslint', or a custom command.
 * @property {string}   [projectDir]    - Working directory for the compiler.
 * @property {string}   [configPath]    - Path to config file (tsconfig.json, .eslintrc, etc.).
 * @property {string[]} [extraFlags=[]] - Additional CLI flags.
 */

/**
 * Creates a deterministic gate configuration for compilation/lint tools.
 *
 * Supports common tools out of the box:
 * - `'tsc'` — runs `npx tsc --noEmit`
 * - `'eslint'` — runs `npx eslint` with `--max-warnings=0`
 *
 * Any other string is treated as a raw command.
 *
 * @param {CompilationGateConfig} config - Compilation gate configuration.
 * @returns {DeterministicGateConfig} A gate configuration ready for `createDeterministicGate` or `executeDeterministicGate`.
 *
 * @example
 * ```js
 * const tsGate = createCompilationGate({
 *   tool: 'tsc',
 *   projectDir: 'packages/sdk',
 *   configPath: 'tsconfig.build.json',
 *   extraFlags: ['--strict'],
 * });
 *
 * const eslintGate = createCompilationGate({
 *   tool: 'eslint',
 *   projectDir: 'packages/sdk',
 *   extraFlags: ['src/'],
 * });
 *
 * const result = await executeDeterministicGate(ctx, tsGate);
 * ```
 */
export function createCompilationGate(config) {
  const {
    tool,
    projectDir,
    configPath,
    extraFlags = [],
  } = config;

  let command;
  let label;

  if (tool === 'tsc') {
    const parts = ['npx tsc --noEmit'];
    if (configPath) {
      parts.push('--project', configPath);
    }
    if (extraFlags.length > 0) {
      parts.push(...extraFlags);
    }
    command = parts.join(' ');
    label = 'TypeScript compilation';
  } else if (tool === 'eslint') {
    const parts = ['npx eslint --max-warnings=0'];
    if (configPath) {
      parts.push('--config', configPath);
    }
    if (extraFlags.length > 0) {
      parts.push(...extraFlags);
    }
    command = parts.join(' ');
    label = 'ESLint';
  } else {
    const parts = [tool];
    if (extraFlags.length > 0) {
      parts.push(...extraFlags);
    }
    command = parts.join(' ');
    label = tool;
  }

  return {
    name: `compilation-${tool}`,
    description: `${label} hard gate`,
    commands: [{ label, command }],
    projectDir,
  };
}

/**
 * @typedef {object} TestSuiteGateConfig
 * @property {string}  runner           - Test runner: 'vitest', 'jest', 'pytest', or a custom command.
 * @property {string}  [projectDir]     - Working directory for the test runner.
 * @property {string}  [testPattern]    - Test file pattern or path to run specific tests.
 * @property {number}  [timeout=300000] - Timeout in milliseconds.
 */

/**
 * Creates a deterministic gate configuration for test suite runners.
 *
 * Supports common runners out of the box:
 * - `'vitest'` — runs `npx vitest run`
 * - `'jest'` — runs `npx jest --ci`
 * - `'pytest'` — runs `python -m pytest`
 *
 * Any other string is treated as a raw command.
 *
 * @param {TestSuiteGateConfig} config - Test suite gate configuration.
 * @returns {DeterministicGateConfig} A gate configuration ready for `createDeterministicGate` or `executeDeterministicGate`.
 *
 * @example
 * ```js
 * const vitestGate = createTestSuiteGate({
 *   runner: 'vitest',
 *   projectDir: 'packages/sdk',
 *   testPattern: 'src/runtime/__tests__/',
 *   timeout: 180000,
 * });
 *
 * const pytestGate = createTestSuiteGate({
 *   runner: 'pytest',
 *   projectDir: 'backend',
 *   testPattern: 'tests/unit/',
 * });
 *
 * const result = await executeDeterministicGate(ctx, vitestGate);
 * ```
 */
export function createTestSuiteGate(config) {
  const {
    runner,
    projectDir,
    testPattern,
    timeout = DEFAULT_TIMEOUT_MS,
  } = config;

  let command;
  let label;

  if (runner === 'vitest') {
    const parts = ['npx vitest run'];
    if (testPattern) {
      parts.push(testPattern);
    }
    command = parts.join(' ');
    label = 'Vitest';
  } else if (runner === 'jest') {
    const parts = ['npx jest --ci'];
    if (testPattern) {
      parts.push(testPattern);
    }
    command = parts.join(' ');
    label = 'Jest';
  } else if (runner === 'pytest') {
    const parts = ['python -m pytest'];
    if (testPattern) {
      parts.push(testPattern);
    }
    command = parts.join(' ');
    label = 'Pytest';
  } else {
    const parts = [runner];
    if (testPattern) {
      parts.push(testPattern);
    }
    command = parts.join(' ');
    label = runner;
  }

  return {
    name: `test-suite-${runner}`,
    description: `${label} test suite hard gate`,
    commands: [{ label, command }],
    projectDir,
    timeout,
  };
}

/**
 * @typedef {object} RuntimeSmokeTestConfig
 * @property {string}  startCommand             - Command to start the server.
 * @property {string}  testUrl                  - URL to probe for health.
 * @property {number}  [expectedStatus=200]     - Expected HTTP status code.
 * @property {string}  [stopCommand]            - Command to stop the server after the test.
 * @property {number}  [startupDelay=3000]      - Milliseconds to wait for server startup.
 */

/**
 * Creates a deterministic gate configuration for runtime smoke testing.
 *
 * The gate starts a server, waits for startup, probes a URL for an expected HTTP
 * status code, and optionally stops the server. This verifies that the application
 * can actually start and serve requests.
 *
 * @param {RuntimeSmokeTestConfig} config - Smoke test configuration.
 * @returns {DeterministicGateConfig} A gate configuration ready for `createDeterministicGate` or `executeDeterministicGate`.
 *
 * @example
 * ```js
 * const smokeTest = createRuntimeSmokeTest({
 *   startCommand: 'npm run dev &',
 *   testUrl: 'http://localhost:3000/api/health',
 *   expectedStatus: 200,
 *   stopCommand: 'kill %1 2>/dev/null || true',
 *   startupDelay: 5000,
 * });
 *
 * const result = await executeDeterministicGate(ctx, smokeTest);
 * ```
 */
export function createRuntimeSmokeTest(config) {
  const {
    startCommand,
    testUrl,
    expectedStatus = DEFAULT_EXPECTED_STATUS,
    stopCommand,
    startupDelay = DEFAULT_STARTUP_DELAY_MS,
  } = config;

  // Build a compound command that starts the server, waits, probes, and cleans up
  const startupDelaySeconds = Math.ceil(startupDelay / 1000);

  const probeScript = [
    startCommand,
    `sleep ${startupDelaySeconds}`,
    `_smoke_status=$(curl -s -o /dev/null -w "%{http_code}" ${JSON.stringify(testUrl)})`,
    `echo "HTTP status: $_smoke_status"`,
    `if [ "$_smoke_status" -eq ${expectedStatus} ]; then _smoke_result=0; else _smoke_result=1; fi`,
  ];

  if (stopCommand) {
    probeScript.push(stopCommand);
  }

  probeScript.push('exit $_smoke_result');

  return {
    name: 'runtime-smoke-test',
    description: `Runtime smoke test: ${testUrl} expects HTTP ${expectedStatus}`,
    commands: [{
      label: `HTTP ${expectedStatus} from ${testUrl}`,
      command: probeScript.join(' && '),
    }],
  };
}
