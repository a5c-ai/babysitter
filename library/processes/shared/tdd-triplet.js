/**
 * @module tdd-triplet
 * @description Composable TDD triplet component providing a factory for the three canonical
 * TDD phases: write tests, run tests, validate results. Designed for injection into
 * convergence and quality-gate processes that require a repeatable red-green-validate cycle.
 *
 * The module exposes two surfaces:
 * - `createTddTriplet(config)` — factory that builds three `defineTask` descriptors for
 *   use with `ctx.task()` inside a babysitter process function.
 * - `executeTddTriplet(ctx, config, args)` — convenience wrapper that drives the full
 *   triplet sequence with retry logic and returns a structured result.
 *
 * @example
 * ```js
 * import { createTddTriplet, executeTddTriplet } from './tdd-triplet.js';
 *
 * export async function process(inputs, ctx) {
 *   const result = await executeTddTriplet(ctx, {
 *     name: 'phase-4-cost-aggregation',
 *     writeTests: {
 *       prompt: 'Write unit tests for the cost aggregation module.',
 *       targetPath: 'tests/cost-aggregation.test.ts',
 *       context: { moduleUnderTest: 'src/cost-aggregation.ts' },
 *     },
 *     runTests: {
 *       command: 'npm test -- --grep cost-aggregation',
 *       timeout: 90000,
 *     },
 *     validate: {
 *       expectAllPass: true,
 *       minCoverage: 80,
 *       customChecks: ['All edge cases for zero-cost inputs are covered'],
 *     },
 *     retryPolicy: {
 *       maxRetries: 2,
 *       retryableExitCodes: [1],
 *     },
 *   }, { feature: 'cost-aggregation' });
 *
 *   return { success: result.passed, ...result };
 * }
 * ```
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ─────────────────────────────────────────────────────────────────────────────
// Internal defaults
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRYABLE_EXIT_CODES = [1];

// ─────────────────────────────────────────────────────────────────────────────
// createTddTriplet
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} WriteTestsConfig
 * @property {string}  prompt     - Agent prompt describing the tests to write.
 * @property {string}  targetPath - Relative path where the test file should be written,
 *                                  e.g. `'tests/cost-aggregation.test.ts'`.
 * @property {object}  [context]  - Additional structured context passed to the agent.
 */

/**
 * @typedef {object} RunTestsConfig
 * @property {string} command      - Shell command to execute the tests,
 *                                   e.g. `'npm test -- --grep cost-aggregation'`.
 * @property {number} [timeout=60000] - Maximum execution time in milliseconds.
 */

/**
 * @typedef {object} ValidateConfig
 * @property {boolean}  [expectAllPass=true] - Whether every test in the suite must pass.
 * @property {number}   [minCoverage]        - Minimum required line coverage percentage (0–100).
 * @property {string[]} [customChecks]       - Additional free-text validation instructions
 *                                            appended to the agent prompt.
 */

/**
 * @typedef {object} RetryPolicy
 * @property {number}   [maxRetries=2]             - Maximum number of retry attempts after
 *                                                    the initial run.
 * @property {number[]} [retryableExitCodes=[1]]   - Exit codes that trigger a retry.
 */

/**
 * @typedef {object} TddTripletConfig
 * @property {string}        name          - Human-readable name for this triplet,
 *                                           e.g. `'phase-4-cost-aggregation'`.
 * @property {WriteTestsConfig} writeTests - Configuration for the test-writing agent task.
 * @property {RunTestsConfig}   runTests   - Configuration for the test-execution shell task.
 * @property {ValidateConfig}   validate   - Configuration for the validation agent task.
 * @property {RetryPolicy}    [retryPolicy] - Retry behaviour on test failures.
 */

/**
 * @typedef {object} TddTriplet
 * @property {Function} writeTestsTask - `defineTask` descriptor for the write-tests phase.
 * @property {Function} runTestsTask   - `defineTask` descriptor for the run-tests phase.
 * @property {Function} validateTask   - `defineTask` descriptor for the validate phase.
 */

/**
 * Creates three babysitter task definitions representing the canonical TDD triplet:
 * write tests → run tests → validate results.
 *
 * The returned task definitions are suitable for use with `ctx.task()` inside any
 * babysitter process function. They carry no shared mutable state and can be reused
 * across multiple iterations of a convergence loop.
 *
 * @param {TddTripletConfig} config - Full triplet configuration.
 * @returns {TddTriplet} Object containing the three task definitions.
 *
 * @example
 * ```js
 * const { writeTestsTask, runTestsTask, validateTask } = createTddTriplet({
 *   name: 'auth-module',
 *   writeTests: { prompt: 'Write tests for auth module', targetPath: 'tests/auth.test.ts' },
 *   runTests:   { command: 'npm test -- --grep auth' },
 *   validate:   { expectAllPass: true, minCoverage: 75 },
 * });
 *
 * const written   = await ctx.task(writeTestsTask, { iteration: 1 });
 * const testRun   = await ctx.task(runTestsTask,   { attempt: 1 });
 * const verdict   = await ctx.task(validateTask,   { testResults: testRun });
 * ```
 */
export function createTddTriplet(config) {
  const {
    name,
    writeTests,
    runTests,
    validate,
    retryPolicy = {}
  } = config;

  const timeout = runTests.timeout ?? DEFAULT_TIMEOUT_MS;
  const expectAllPass = validate.expectAllPass ?? true;
  const customChecks = validate.customChecks ?? [];

  // ── writeTestsTask ────────────────────────────────────────────────────────

  /**
   * Agent task that writes test files to `writeTests.targetPath` according to
   * the supplied prompt and optional context.
   *
   * Expected args: `{ iteration?: number, previousFeedback?: string }`
   *
   * Output schema:
   * ```json
   * { "testFilePath": string, "testsWritten": number, "summary": string }
   * ```
   */
  const writeTestsTask = defineTask(
    `tdd-triplet/${name}/write-tests`,
    (args, taskCtx) => ({
      kind: 'agent',
      title: `[${name}] Write tests → ${writeTests.targetPath}`,
      agent: {
        name: 'test-writer',
        prompt: {
          role: 'Senior software engineer practising strict Test-Driven Development',
          task: writeTests.prompt,
          context: {
            tripletName: name,
            targetPath: writeTests.targetPath,
            iteration: args.iteration ?? 1,
            previousFeedback: args.previousFeedback ?? null,
            ...(writeTests.context ?? {})
          },
          instructions: [
            `Write all tests to the file at path: ${writeTests.targetPath}`,
            'Follow the red-green-refactor TDD cycle: tests should be complete before implementation',
            'Cover happy path, edge cases, and error conditions',
            'Each test must have a clear, descriptive name',
            args.previousFeedback
              ? `Address this feedback from a prior attempt: ${args.previousFeedback}`
              : 'This is the first attempt — establish a thorough baseline',
            'Output a JSON summary of what was written'
          ],
          outputFormat: 'JSON with testFilePath (string), testsWritten (number), summary (string)'
        },
        outputSchema: {
          type: 'object',
          required: ['testFilePath', 'testsWritten', 'summary'],
          properties: {
            testFilePath: { type: 'string' },
            testsWritten: { type: 'number' },
            summary: { type: 'string' }
          }
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
      },
      labels: ['tdd', 'write-tests', name]
    })
  );

  // ── runTestsTask ─────────────────────────────────────────────────────────

  /**
   * Shell task that executes the test suite via `runTests.command`.
   *
   * Expected args: `{ attempt?: number }`
   *
   * The task descriptor uses the `shell` kind, passing through the configured
   * command and timeout. The harness records stdout/stderr and exit code so
   * that the validate task and retry logic can inspect them.
   */
  const runTestsTask = defineTask(
    `tdd-triplet/${name}/run-tests`,
    (args, taskCtx) => ({
      kind: 'shell',
      title: `[${name}] Run tests (attempt ${args.attempt ?? 1})`,
      shell: {
        command: runTests.command,
        timeout,
        outputPath: `tasks/${taskCtx.effectId}/output.json`
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
      },
      labels: ['tdd', 'run-tests', name]
    })
  );

  // ── validateTask ─────────────────────────────────────────────────────────

  /**
   * Agent task that inspects test results and produces a structured verdict.
   *
   * Expected args:
   * ```js
   * { testResults: object, attempt?: number }
   * ```
   *
   * Output schema:
   * ```json
   * {
   *   "passed": boolean,
   *   "summary": string,
   *   "failingTests": string[],
   *   "coverage": number | null,
   *   "coverageMet": boolean,
   *   "customCheckResults": Array<{ check: string, met: boolean, notes: string }>
   * }
   * ```
   */
  const validateTask = defineTask(
    `tdd-triplet/${name}/validate`,
    (args, taskCtx) => {
      const coverageInstruction = validate.minCoverage != null
        ? `Verify that line coverage is at least ${validate.minCoverage}%. Set coverageMet accordingly.`
        : 'Coverage checking is not required for this triplet; set coverageMet to true.';

      const customCheckInstructions = customChecks.length > 0
        ? customChecks.map((c, i) => `Custom check ${i + 1}: ${c}`)
        : ['No custom checks configured.'];

      return {
        kind: 'agent',
        title: `[${name}] Validate test results`,
        agent: {
          name: 'test-validator',
          prompt: {
            role: 'Quality assurance engineer reviewing test execution results',
            task: 'Analyse the provided test run results and produce a structured validation verdict.',
            context: {
              tripletName: name,
              testResults: args.testResults ?? null,
              attempt: args.attempt ?? 1,
              expectAllPass,
              minCoverage: validate.minCoverage ?? null
            },
            instructions: [
              expectAllPass
                ? 'ALL tests must pass for `passed` to be true. Even a single failure means passed=false.'
                : 'Tests may have failures; set passed=true only if the overall suite is in an acceptable state.',
              coverageInstruction,
              ...customCheckInstructions,
              'Extract failing test names into the failingTests array (empty array if none).',
              'Set coverage to the numeric percentage if available in the test results, otherwise null.',
              'For each custom check, produce a { check, met, notes } entry in customCheckResults.',
              'Provide a concise human-readable summary of the overall result.'
            ],
            outputFormat: [
              'JSON with:',
              '  passed (boolean),',
              '  summary (string),',
              '  failingTests (string[]),',
              '  coverage (number|null),',
              '  coverageMet (boolean),',
              '  customCheckResults (Array<{ check: string, met: boolean, notes: string }>)'
            ].join('\n')
          },
          outputSchema: {
            type: 'object',
            required: ['passed', 'summary', 'failingTests', 'coverage', 'coverageMet', 'customCheckResults'],
            properties: {
              passed: { type: 'boolean' },
              summary: { type: 'string' },
              failingTests: { type: 'array', items: { type: 'string' } },
              coverage: { oneOf: [{ type: 'number' }, { type: 'null' }] },
              coverageMet: { type: 'boolean' },
              customCheckResults: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['check', 'met', 'notes'],
                  properties: {
                    check: { type: 'string' },
                    met:   { type: 'boolean' },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        io: {
          inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
          outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
        },
        labels: ['tdd', 'validate', name]
      };
    }
  );

  return { writeTestsTask, runTestsTask, validateTask };
}

// ─────────────────────────────────────────────────────────────────────────────
// executeTddTriplet
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} TddTripletResult
 * @property {boolean} passed        - True when the validate task reports a passing suite.
 * @property {object}  testsWritten  - Raw result from the writeTests agent task.
 * @property {object}  testResults   - Raw result from the runTests shell task.
 * @property {object}  validation    - Raw result from the validate agent task.
 * @property {number}  retriesUsed   - Number of retry iterations consumed (0 = succeeded first time).
 */

/**
 * Convenience function that orchestrates the full TDD triplet in sequence:
 *   1. Write tests (once — retries do not re-write tests by default)
 *   2. Run tests   (retried up to `retryPolicy.maxRetries` times on retryable exit codes)
 *   3. Validate    (runs after the final test execution attempt)
 *
 * Retry behaviour:
 * - After writing tests, the test runner is invoked.
 * - If the shell task exits with a code listed in `retryPolicy.retryableExitCodes` AND
 *   the attempt count has not reached `maxRetries + 1`, the runner is invoked again.
 * - The validate task always runs on the most recent test run result, regardless of
 *   whether the run was a retry.
 * - Retries do NOT re-invoke the write-tests task. To re-write tests on failure, build
 *   a higher-level loop around `executeTddTriplet` and pass `previousFeedback` in `args`.
 *
 * @param {object}         ctx    - Babysitter process context (provides `ctx.task()`).
 * @param {TddTripletConfig} config - Triplet configuration (passed to `createTddTriplet`).
 * @param {object}         [args] - Optional extra args forwarded to each task invocation.
 * @param {number}         [args.iteration=1]        - Convergence loop iteration number.
 * @param {string}         [args.previousFeedback]   - Feedback from a prior triplet run.
 * @returns {Promise<TddTripletResult>}
 *
 * @example
 * ```js
 * const result = await executeTddTriplet(ctx, {
 *   name: 'phase-4-cost-aggregation',
 *   writeTests: {
 *     prompt: 'Write tests for cost aggregation',
 *     targetPath: 'tests/cost-aggregation.test.ts',
 *   },
 *   runTests:   { command: 'npm test -- --grep cost-aggregation', timeout: 90000 },
 *   validate:   { expectAllPass: true, minCoverage: 80 },
 *   retryPolicy: { maxRetries: 2, retryableExitCodes: [1] },
 * });
 *
 * if (!result.passed) {
 *   // Feed result.validation.summary back into the next iteration as previousFeedback
 * }
 * ```
 */
export async function executeTddTriplet(ctx, config, args = {}) {
  const {
    retryPolicy = {}
  } = config;

  const maxRetries = retryPolicy.maxRetries ?? DEFAULT_MAX_RETRIES;
  const retryableExitCodes = retryPolicy.retryableExitCodes ?? DEFAULT_RETRYABLE_EXIT_CODES;

  const { writeTestsTask, runTestsTask, validateTask } = createTddTriplet(config);

  // ── Phase 1: Write tests ─────────────────────────────────────────────────
  const testsWritten = await ctx.task(writeTestsTask, {
    iteration: args.iteration ?? 1,
    previousFeedback: args.previousFeedback ?? null
  });

  // ── Phase 2: Run tests (with retry) ─────────────────────────────────────
  let testResults = null;
  let retriesUsed = 0;
  let attempt = 0;

  // Total attempts = 1 (initial) + maxRetries
  const maxAttempts = 1 + maxRetries;

  while (attempt < maxAttempts) {
    attempt++;

    testResults = await ctx.task(runTestsTask, { attempt });

    // Determine whether a retry is warranted.
    const exitCode = typeof testResults?.exitCode === 'number' ? testResults.exitCode : 0;
    const shouldRetry =
      attempt < maxAttempts &&
      retryableExitCodes.includes(exitCode);

    if (!shouldRetry) break;

    retriesUsed++;
  }

  // ── Phase 3: Validate ─────────────────────────────────────────────────────
  const validation = await ctx.task(validateTask, {
    testResults,
    attempt
  });

  return {
    passed: validation?.passed === true,
    testsWritten,
    testResults,
    validation,
    retriesUsed
  };
}
