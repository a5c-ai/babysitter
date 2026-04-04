/**
 * @module ts-check
 * @description Composable TypeScript compilation check component providing a hard shell gate
 * for `tsc --noEmit`. Unlike soft agent-prompt-based checks, this module enforces compilation
 * correctness via a shell task with `expectedExitCode: 0`, making it a deterministic,
 * non-negotiable quality gate.
 *
 * The module exposes three surfaces:
 * - `tsCheckTask` — standalone `defineTask` descriptor (kind: 'shell') for direct use
 *   with `ctx.task()`.
 * - `createTsCheck(config)` — factory that builds a shell check task and an agent report
 *   task, parameterized by project directory, tsconfig path, and compiler flags.
 * - `executeTsCheck(ctx, config)` — convenience wrapper that runs the check, parses tsc
 *   output into structured error records, and returns a comprehensive result object.
 *
 * @example
 * ```js
 * import { tsCheckTask, createTsCheck, executeTsCheck } from './ts-check.js';
 *
 * // Standalone task usage:
 * const result = await ctx.task(tsCheckTask, { projectDir: '.', tsconfigPath: 'tsconfig.json' });
 *
 * // Factory usage:
 * const { checkTask, reportTask } = createTsCheck({ projectDir: 'packages/sdk', strict: true });
 * const checkResult = await ctx.task(checkTask, {});
 * const report = await ctx.task(reportTask, { tscOutput: checkResult });
 *
 * // Convenience usage:
 * const outcome = await executeTsCheck(ctx, { projectDir: 'packages/sdk' });
 * if (!outcome.passed) {
 *   console.log(`${outcome.errorCount} errors found:`, outcome.errors);
 * }
 * ```
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 120000;
const DEFAULT_TSCONFIG_PATH = 'tsconfig.json';

/**
 * Regex for parsing tsc diagnostic output lines.
 * Matches: `src/foo.ts(12,5): error TS2322: Type 'string' is not assignable to type 'number'.`
 * Groups: file, line, column, code, message
 */
const TSC_ERROR_REGEX = /^(.+?)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.+)$/;

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the tsc command string from the provided configuration.
 *
 * @param {object} opts
 * @param {string} [opts.projectDir]    - Working directory for the compiler.
 * @param {string} [opts.tsconfigPath]  - Path to tsconfig.json (relative to projectDir).
 * @param {boolean} [opts.strict]       - Whether to pass `--strict`.
 * @param {boolean} [opts.incremental]  - Whether to pass `--incremental`.
 * @param {string[]} [opts.extraFlags]  - Additional tsc flags.
 * @returns {string} The fully assembled tsc command.
 */
function buildTscCommand(opts = {}) {
  const {
    projectDir,
    tsconfigPath = DEFAULT_TSCONFIG_PATH,
    strict = false,
    incremental = false,
    extraFlags = [],
  } = opts;

  const parts = ['npx tsc --noEmit'];

  parts.push('--project', tsconfigPath);

  if (strict) {
    parts.push('--strict');
  }

  if (incremental) {
    parts.push('--incremental');
  }

  if (extraFlags.length > 0) {
    parts.push(...extraFlags);
  }

  const command = parts.join(' ');

  if (projectDir) {
    return `cd ${JSON.stringify(projectDir)} && ${command}`;
  }

  return command;
}

/**
 * Parses raw tsc output into structured error records.
 *
 * @param {string} output - Raw stdout/stderr from the tsc process.
 * @returns {{ errors: Array<{ file: string, line: number, column: number, code: string, message: string }>, errorCount: number }}
 */
function parseTscOutput(output) {
  if (!output || typeof output !== 'string') {
    return { errors: [], errorCount: 0 };
  }

  const lines = output.split('\n');
  const errors = [];

  for (const line of lines) {
    const match = line.match(TSC_ERROR_REGEX);
    if (match) {
      errors.push({
        file: match[1].trim(),
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        code: match[4],
        message: match[5].trim(),
      });
    }
  }

  return { errors, errorCount: errors.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// tsCheckTask (standalone)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standalone `defineTask` descriptor for TypeScript compilation checking.
 *
 * This is a shell-kind task that runs `tsc --noEmit` and enforces a zero exit code,
 * making it a **hard gate** — any compilation error causes the task to fail.
 *
 * Expected args:
 * ```js
 * {
 *   projectDir?: string,    // Working directory (default: current directory)
 *   tsconfigPath?: string,  // Path to tsconfig.json (default: 'tsconfig.json')
 *   strict?: boolean,       // Pass --strict flag (default: false)
 *   incremental?: boolean,  // Pass --incremental flag (default: false)
 *   extraFlags?: string[],  // Additional tsc flags (default: [])
 * }
 * ```
 *
 * @type {import('@a5c-ai/babysitter-sdk').TaskDef}
 */
export const tsCheckTask = defineTask(
  'ts-check/compile',
  (args, taskCtx) => ({
    kind: 'shell',
    title: `TypeScript compilation check${args.projectDir ? ` (${args.projectDir})` : ''}`,
    shell: {
      command: buildTscCommand({
        projectDir: args.projectDir,
        tsconfigPath: args.tsconfigPath,
        strict: args.strict,
        incremental: args.incremental,
        extraFlags: args.extraFlags,
      }),
      expectedExitCode: 0,
      timeout: DEFAULT_TIMEOUT_MS,
      outputPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ['typescript', 'compilation', 'hard-gate'],
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// createTsCheck (factory)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} TsCheckConfig
 * @property {string}   [projectDir]    - Working directory for the compiler.
 * @property {string}   [tsconfigPath='tsconfig.json'] - Path to the tsconfig file.
 * @property {boolean}  [strict=false]  - Whether to pass `--strict` to tsc.
 * @property {boolean}  [incremental=false] - Whether to pass `--incremental` to tsc.
 * @property {string[]} [extraFlags=[]] - Additional flags to pass to tsc.
 * @property {number}   [timeout=120000] - Maximum execution time in milliseconds.
 */

/**
 * @typedef {object} TsCheckTasks
 * @property {Function} checkTask  - Shell task that runs `tsc --noEmit` as a hard gate.
 * @property {Function} reportTask - Agent task that analyzes tsc output and produces a
 *                                   structured diagnostic report.
 */

/**
 * Factory that creates a pair of babysitter task definitions for TypeScript compilation
 * checking:
 *
 * - **checkTask** (kind: 'shell') — runs `tsc --noEmit` with the specified configuration.
 *   Uses `expectedExitCode: 0` to enforce a hard compilation gate.
 * - **reportTask** (kind: 'agent') — analyzes raw tsc output and produces a structured
 *   diagnostic report with error categorization and remediation suggestions.
 *
 * Both tasks are stateless and can be reused across multiple iterations.
 *
 * @param {TsCheckConfig} config - Compilation check configuration.
 * @returns {TsCheckTasks} Object containing the check and report task definitions.
 *
 * @example
 * ```js
 * const { checkTask, reportTask } = createTsCheck({
 *   projectDir: 'packages/sdk',
 *   strict: true,
 *   timeout: 180000,
 * });
 *
 * const checkResult = await ctx.task(checkTask, {});
 * if (checkResult.exitCode !== 0) {
 *   const report = await ctx.task(reportTask, { tscOutput: checkResult });
 * }
 * ```
 */
export function createTsCheck(config = {}) {
  const {
    projectDir,
    tsconfigPath = DEFAULT_TSCONFIG_PATH,
    strict = false,
    incremental = false,
    extraFlags = [],
    timeout = DEFAULT_TIMEOUT_MS,
  } = config;

  const label = projectDir || 'project';

  // ── checkTask ───────────────────────────────────────────────────────────

  /**
   * Shell task that executes `tsc --noEmit` as a hard compilation gate.
   * Exit code 0 is required for the task to succeed.
   *
   * Expected args: `{}` (no args required; configuration is baked in from the factory)
   */
  const checkTask = defineTask(
    `ts-check/${label}/compile`,
    (_args, taskCtx) => ({
      kind: 'shell',
      title: `[${label}] TypeScript compilation check`,
      shell: {
        command: buildTscCommand({ projectDir, tsconfigPath, strict, incremental, extraFlags }),
        expectedExitCode: 0,
        timeout,
        outputPath: `tasks/${taskCtx.effectId}/output.json`,
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
      },
      labels: ['typescript', 'compilation', 'hard-gate', label],
    })
  );

  // ── reportTask ──────────────────────────────────────────────────────────

  /**
   * Agent task that analyzes tsc output and produces a structured diagnostic report.
   *
   * Expected args:
   * ```js
   * { tscOutput: { stdout?: string, stderr?: string, exitCode?: number } }
   * ```
   *
   * Output schema:
   * ```json
   * {
   *   "totalErrors": number,
   *   "categories": { [category: string]: number },
   *   "topErrors": Array<{ file: string, line: number, code: string, message: string }>,
   *   "suggestions": string[],
   *   "summary": string
   * }
   * ```
   */
  const reportTask = defineTask(
    `ts-check/${label}/report`,
    (args, taskCtx) => ({
      kind: 'agent',
      title: `[${label}] Analyze TypeScript compilation errors`,
      agent: {
        name: 'ts-diagnostics-analyzer',
        prompt: {
          role: 'Senior TypeScript engineer specializing in type system diagnostics and compilation error analysis',
          task: 'Analyze the provided TypeScript compiler output and produce a structured diagnostic report.',
          context: {
            projectDir: projectDir ?? '.',
            tsconfigPath,
            strict,
            tscOutput: args.tscOutput ?? null,
          },
          instructions: [
            'Parse all error lines from the tsc output.',
            'Categorize errors by type (e.g., type mismatch, missing property, import resolution, unused variable).',
            'Identify the top errors by frequency or severity.',
            'Provide actionable suggestions for resolving the most common error patterns.',
            'Write a concise summary of the overall compilation health.',
          ],
          outputFormat: [
            'JSON with:',
            '  totalErrors (number),',
            '  categories (object mapping category name to count),',
            '  topErrors (array of { file, line, code, message } for the most impactful errors),',
            '  suggestions (string[] of actionable remediation steps),',
            '  summary (string)',
          ].join('\n'),
        },
        outputSchema: {
          type: 'object',
          required: ['totalErrors', 'categories', 'topErrors', 'suggestions', 'summary'],
          properties: {
            totalErrors: { type: 'number' },
            categories: { type: 'object' },
            topErrors: {
              type: 'array',
              items: {
                type: 'object',
                required: ['file', 'line', 'code', 'message'],
                properties: {
                  file: { type: 'string' },
                  line: { type: 'number' },
                  code: { type: 'string' },
                  message: { type: 'string' },
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
      labels: ['typescript', 'diagnostics', 'report', label],
    })
  );

  return { checkTask, reportTask };
}

// ─────────────────────────────────────────────────────────────────────────────
// executeTsCheck (convenience)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} TscError
 * @property {string} file    - Source file path relative to projectDir.
 * @property {number} line    - Line number (1-based).
 * @property {number} column  - Column number (1-based).
 * @property {string} code    - TypeScript error code, e.g. `'TS2322'`.
 * @property {string} message - Human-readable error description.
 */

/**
 * @typedef {object} TsCheckResult
 * @property {boolean}    passed     - True when `tsc --noEmit` exits with code 0.
 * @property {number}     exitCode   - The actual exit code from the compiler.
 * @property {number}     errorCount - Number of parsed diagnostic errors.
 * @property {TscError[]} errors     - Structured array of parsed compilation errors.
 * @property {string}     output     - Raw combined stdout+stderr from the compiler.
 * @property {string}     summary    - Human-readable one-line summary of the check result.
 */

/**
 * Convenience function that runs a TypeScript compilation check and returns a
 * structured result with parsed error information.
 *
 * Execution flow:
 *   1. Builds a shell task via `createTsCheck(config)`.
 *   2. Invokes the check task via `ctx.task()`, catching failures (non-zero exit).
 *   3. Parses the raw tsc output to extract structured error records.
 *   4. Returns a comprehensive result object with pass/fail status, parsed errors,
 *      raw output, and a human-readable summary.
 *
 * This function does **not** throw on compilation failure — it captures the failure
 * and returns `{ passed: false, ... }` so the caller can decide how to proceed
 * (e.g., feed errors into a fix-and-retry loop, request a breakpoint, etc.).
 *
 * @param {object}        ctx    - Babysitter process context (provides `ctx.task()`).
 * @param {TsCheckConfig} config - Compilation check configuration.
 * @returns {Promise<TsCheckResult>}
 *
 * @example
 * ```js
 * const result = await executeTsCheck(ctx, {
 *   projectDir: 'packages/sdk',
 *   strict: true,
 * });
 *
 * if (!result.passed) {
 *   console.log(`TypeScript compilation failed with ${result.errorCount} errors:`);
 *   for (const err of result.errors) {
 *     console.log(`  ${err.file}:${err.line} - ${err.code}: ${err.message}`);
 *   }
 * }
 * ```
 */
export async function executeTsCheck(ctx, config = {}) {
  const { checkTask } = createTsCheck(config);

  let taskResult;
  try {
    taskResult = await ctx.task(checkTask, {});
  } catch (err) {
    // If the task itself throws (e.g., EffectRequestedError), re-throw —
    // that's the replay engine signalling, not a compilation failure.
    if (err?.name === 'EffectRequestedError' || err?.name === 'EffectPendingError') {
      throw err;
    }

    // For other errors (e.g., shell task returned non-zero exit code and the
    // harness surfaced it as an error), extract what we can from the error.
    const rawOutput = err?.stdout ?? err?.stderr ?? err?.message ?? String(err);
    const exitCode = typeof err?.exitCode === 'number' ? err.exitCode : 1;
    const { errors, errorCount } = parseTscOutput(rawOutput);

    return {
      passed: false,
      exitCode,
      errorCount,
      errors,
      output: rawOutput,
      summary: errorCount > 0
        ? `TypeScript compilation failed with ${errorCount} error${errorCount === 1 ? '' : 's'}.`
        : `TypeScript compilation failed (exit code ${exitCode}).`,
    };
  }

  // Task completed — extract output from the result structure.
  const stdout = taskResult?.stdout ?? '';
  const stderr = taskResult?.stderr ?? '';
  const rawOutput = [stdout, stderr].filter(Boolean).join('\n');
  const exitCode = typeof taskResult?.exitCode === 'number' ? taskResult.exitCode : 0;
  const passed = exitCode === 0;
  const { errors, errorCount } = parseTscOutput(rawOutput);

  return {
    passed,
    exitCode,
    errorCount,
    errors,
    output: rawOutput,
    summary: passed
      ? 'TypeScript compilation passed with no errors.'
      : `TypeScript compilation failed with ${errorCount} error${errorCount === 1 ? '' : 's'}.`,
  };
}
