/**
 * @module runtime-call-tracer
 * @process
 * @description Composable runtime call-path tracer that maps execution flows across a codebase
 * by following import chains, grepping for route handlers, and identifying hot paths and dead
 * code candidates. Designed for injection into architecture-analysis, refactoring-planning, and
 * quality-audit processes that need structural understanding of how feature areas are executed.
 *
 * The module exposes two surfaces:
 * - `traceRuntimeCallPathsTask` — standalone `defineTask` descriptor (kind: `'agent'`) that
 *   accepts a list of feature areas (name + entryPoint) and traces each one end-to-end.
 * - `createCallPathTracer(options)` — convenience factory that pre-populates defaults and
 *   returns a ready-to-dispatch task definition, useful when the same tracer configuration
 *   is reused across multiple process phases.
 *
 * @example
 * ```js
 * import { traceRuntimeCallPathsTask, createCallPathTracer } from './runtime-call-tracer.js';
 *
 * // Standalone task usage:
 * const result = await ctx.task(traceRuntimeCallPathsTask, {
 *   featureAreas: [
 *     { name: 'run-create', entryPoint: 'packages/sdk/src/cli/commands/runCreate.ts' },
 *     { name: 'task-post',  entryPoint: 'packages/sdk/src/cli/commands/taskPost.ts' },
 *   ],
 *   projectDir: '.',
 * });
 *
 * // Factory usage:
 * const tracerTask = createCallPathTracer({
 *   projectDir: 'packages/sdk',
 *   maxDepth: 6,
 * });
 *
 * const result = await ctx.task(tracerTask, {
 *   featureAreas: [
 *     { name: 'replay-engine', entryPoint: 'src/runtime/replay/index.ts' },
 *   ],
 * });
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
// Internal defaults
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_MAX_DEPTH = 8;
const DEFAULT_TIMEOUT_MS = 120000;

// ─────────────────────────────────────────────────────────────────────────────
// traceRuntimeCallPathsTask (standalone)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standalone `defineTask` descriptor for tracing runtime call paths across a codebase.
 *
 * The agent greps for route handlers and exported functions at each entry point, follows
 * `import` / `require` chains up to `maxDepth` levels deep, and produces a structured map
 * of feature name → call-path analysis. For each feature area the agent identifies:
 *
 * - All source files that participate in the execution path.
 * - Dead code candidates — exported symbols found in traced files that have no callers
 *   within the traced graph (grepped for with zero hits).
 * - The hot path — a human-readable dotted or arrow notation of the dominant call chain
 *   from entry point to terminal effect or output.
 *
 * Expected args:
 * ```js
 * {
 *   featureAreas: Array<{ name: string, entryPoint: string }>,
 *   projectDir?:  string,   // Root directory for resolving relative import paths (default: '.')
 *   maxDepth?:    number,   // Maximum import-follow depth per feature area (default: 8)
 *   timeout?:     number,   // Task timeout in milliseconds (default: 120000)
 * }
 * ```
 *
 * Output schema:
 * ```json
 * {
 *   "runtimeCallPaths": {
 *     "<featureName>": {
 *       "entryPoint":          string,
 *       "tracedFiles":         string[],
 *       "deadCodeCandidates":  string[],
 *       "hotPath":             string
 *     }
 *   },
 *   "summary": string
 * }
 * ```
 *
 * @type {import('@a5c-ai/babysitter-sdk').TaskDef}
 */
export const traceRuntimeCallPathsTask = defineTask(
  'trace-runtime-call-paths',
  (args, taskCtx) => {
    const featureAreas = args.featureAreas ?? [];
    const projectDir = args.projectDir ?? '.';
    const maxDepth = args.maxDepth ?? DEFAULT_MAX_DEPTH;
    const timeout = args.timeout ?? DEFAULT_TIMEOUT_MS;

    return {
      kind: 'agent',
      title: `Trace runtime call paths (${featureAreas.length} feature area${featureAreas.length === 1 ? '' : 's'})`,
      agent: {
        name: 'runtime-call-tracer',
        prompt: {
          role: 'Senior software architect specializing in static analysis, codebase navigation, and execution-path tracing',
          task: [
            'Trace the runtime call paths for each provided feature area by following import chains,',
            'grepping for route/handler registrations, and mapping the execution flow from the entry',
            'point to terminal effects (I/O, external calls, output writes).',
          ].join(' '),
          context: {
            featureAreas,
            projectDir,
            maxDepth,
          },
          instructions: [
            'For each feature area in `featureAreas`:',
            '  1. Start at `entryPoint` (relative to `projectDir`).',
            '  2. Grep the entry point file for: exported function declarations, route handler',
            '     registrations (e.g. `app.get`, `router.post`, `fastify.route`, `addCommand`,',
            '     `yargs.command`, `commander.command`), and top-level `export` statements.',
            '  3. Follow each `import` / `require` to the referenced local module (skip',
            '     `node_modules`). Repeat up to `maxDepth` levels deep.',
            '  4. Collect the absolute (or projectDir-relative) path of every file visited into',
            '     `tracedFiles`. Include the entry point itself.',
            '  5. Within the traced file set, grep for every exported symbol name. Any symbol',
            '     that appears in exactly one file (its own declaration) and has zero grep hits',
            '     in all other traced files is a dead code candidate. Add it to',
            '     `deadCodeCandidates` as `"<relativeFilePath>:<symbolName>"` notation.',
            '  6. Identify the dominant execution chain — the sequence of function/method calls',
            '     from the entry point that handles the primary success case. Express it as a',
            '     single human-readable string using `→` separators, e.g.:',
            '     `"cli#runCreate → createRun() → acquireRunLock() → appendEvent(RUN_CREATED)"`,',
            '     and store it as `hotPath`.',
            'After processing all feature areas, write a brief `summary` describing overall',
            'architecture patterns observed (e.g. layering, shared utilities, coupling hotspots).',
            'If a file referenced by an import cannot be found, note it in `tracedFiles` with a',
            '`[NOT FOUND]` suffix and continue tracing the remaining imports.',
            'Do not include test files (`*.test.*`, `*.spec.*`, `__tests__/`) in `tracedFiles`',
            'or dead code analysis unless the entry point itself is a test file.',
          ],
          outputFormat: [
            'JSON with:',
            '  runtimeCallPaths (object keyed by feature name, each value has:',
            '    entryPoint (string — the provided entry point path),',
            '    tracedFiles (string[] — all visited source files, relative to projectDir),',
            '    deadCodeCandidates (string[] — "<file>:<symbol>" entries with no external callers),',
            '    hotPath (string — dominant call chain from entry to terminal effect)',
            '  ),',
            '  summary (string — concise architectural overview of observations)',
          ].join('\n'),
        },
        outputSchema: {
          type: 'object',
          required: ['runtimeCallPaths', 'summary'],
          properties: {
            runtimeCallPaths: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                required: ['entryPoint', 'tracedFiles', 'deadCodeCandidates', 'hotPath'],
                properties: {
                  entryPoint: { type: 'string' },
                  tracedFiles: { type: 'array', items: { type: 'string' } },
                  deadCodeCandidates: { type: 'array', items: { type: 'string' } },
                  hotPath: { type: 'string' },
                },
              },
            },
            summary: { type: 'string' },
          },
        },
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
      },
      labels: ['call-tracer', 'static-analysis', 'architecture'],
      execution: {
        timeout,
      },
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// createCallPathTracer (convenience factory)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} CallPathTracerOptions
 * @property {string}  [projectDir='.']       - Root directory for resolving relative import paths.
 *                                              Passed as a default to the dispatched task; can be
 *                                              overridden at call time via `args.projectDir`.
 * @property {number}  [maxDepth=8]           - Maximum import-follow depth per feature area.
 *                                              Values above 20 are clamped to 20 to prevent
 *                                              run-away tracing in deeply nested codebases.
 * @property {number}  [timeout=120000]       - Task timeout in milliseconds.
 * @property {string}  [tracerName='default'] - Logical name for this tracer instance, used to
 *                                              construct the task ID so multiple tracers in the
 *                                              same process don't collide.
 */

/**
 * Convenience factory that creates a pre-configured `defineTask` descriptor for
 * `trace-runtime-call-paths`. Useful when the same tracer options (projectDir, maxDepth,
 * timeout) are shared across multiple invocations within a single process.
 *
 * The returned task definition is stateless and safe to dispatch multiple times with
 * different `featureAreas` arguments.
 *
 * The factory clamps `maxDepth` to the range [1, 20] to avoid pathological tracing in
 * deeply recursive import graphs.
 *
 * @param {CallPathTracerOptions} [options={}] - Default configuration for the tracer.
 * @returns {import('@a5c-ai/babysitter-sdk').TaskDef} A `defineTask` descriptor ready for `ctx.task()`.
 *
 * @example
 * ```js
 * import { createCallPathTracer } from './runtime-call-tracer.js';
 *
 * export async function process(inputs, ctx) {
 *   const tracerTask = createCallPathTracer({
 *     projectDir: inputs.projectDir ?? '.',
 *     maxDepth: 5,
 *     timeout: 90000,
 *   });
 *
 *   const phase1 = await ctx.task(tracerTask, {
 *     featureAreas: [
 *       { name: 'run-lifecycle', entryPoint: 'packages/sdk/src/runtime/orchestrateIteration.ts' },
 *     ],
 *   });
 *
 *   const phase2 = await ctx.task(tracerTask, {
 *     featureAreas: [
 *       { name: 'storage-layer', entryPoint: 'packages/sdk/src/storage/index.ts' },
 *       { name: 'task-dispatch', entryPoint: 'packages/sdk/src/tasks/index.ts' },
 *     ],
 *   });
 *
 *   return {
 *     callPaths: {
 *       ...phase1.runtimeCallPaths,
 *       ...phase2.runtimeCallPaths,
 *     },
 *     summaries: [phase1.summary, phase2.summary],
 *   };
 * }
 * ```
 */
export function createCallPathTracer(options = {}) {
  const {
    projectDir = '.',
    maxDepth: rawMaxDepth = DEFAULT_MAX_DEPTH,
    timeout = DEFAULT_TIMEOUT_MS,
    tracerName = 'default',
  } = options;

  // Clamp maxDepth to [1, 20]
  const maxDepth = Math.min(20, Math.max(1, rawMaxDepth));

  return defineTask(
    `trace-runtime-call-paths/${tracerName}`,
    (args, taskCtx) => {
      const featureAreas = args.featureAreas ?? [];
      // Allow per-call overrides; fall back to factory defaults
      const resolvedProjectDir = args.projectDir ?? projectDir;
      const resolvedMaxDepth = typeof args.maxDepth === 'number'
        ? Math.min(20, Math.max(1, args.maxDepth))
        : maxDepth;
      const resolvedTimeout = typeof args.timeout === 'number' ? args.timeout : timeout;

      return {
        kind: 'agent',
        title: `[${tracerName}] Trace runtime call paths (${featureAreas.length} feature area${featureAreas.length === 1 ? '' : 's'})`,
        agent: {
          name: 'runtime-call-tracer',
          prompt: {
            role: 'Senior software architect specializing in static analysis, codebase navigation, and execution-path tracing',
            task: [
              'Trace the runtime call paths for each provided feature area by following import chains,',
              'grepping for route/handler registrations, and mapping the execution flow from the entry',
              'point to terminal effects (I/O, external calls, output writes).',
            ].join(' '),
            context: {
              featureAreas,
              projectDir: resolvedProjectDir,
              maxDepth: resolvedMaxDepth,
              tracerName,
            },
            instructions: [
              'For each feature area in `featureAreas`:',
              '  1. Start at `entryPoint` (relative to `projectDir`).',
              '  2. Grep the entry point file for: exported function declarations, route handler',
              '     registrations (e.g. `app.get`, `router.post`, `fastify.route`, `addCommand`,',
              '     `yargs.command`, `commander.command`), and top-level `export` statements.',
              '  3. Follow each `import` / `require` to the referenced local module (skip',
              '     `node_modules`). Repeat up to `maxDepth` levels deep.',
              '  4. Collect the absolute (or projectDir-relative) path of every file visited into',
              '     `tracedFiles`. Include the entry point itself.',
              '  5. Within the traced file set, grep for every exported symbol name. Any symbol',
              '     that appears in exactly one file (its own declaration) and has zero grep hits',
              '     in all other traced files is a dead code candidate. Add it to',
              '     `deadCodeCandidates` as `"<relativeFilePath>:<symbolName>"` notation.',
              '  6. Identify the dominant execution chain — the sequence of function/method calls',
              '     from the entry point that handles the primary success case. Express it as a',
              '     single human-readable string using `→` separators, e.g.:',
              '     `"cli#runCreate → createRun() → acquireRunLock() → appendEvent(RUN_CREATED)"`,',
              '     and store it as `hotPath`.',
              'After processing all feature areas, write a brief `summary` describing overall',
              'architecture patterns observed (e.g. layering, shared utilities, coupling hotspots).',
              'If a file referenced by an import cannot be found, note it in `tracedFiles` with a',
              '`[NOT FOUND]` suffix and continue tracing the remaining imports.',
              'Do not include test files (`*.test.*`, `*.spec.*`, `__tests__/`) in `tracedFiles`',
              'or dead code analysis unless the entry point itself is a test file.',
            ],
            outputFormat: [
              'JSON with:',
              '  runtimeCallPaths (object keyed by feature name, each value has:',
              '    entryPoint (string — the provided entry point path),',
              '    tracedFiles (string[] — all visited source files, relative to projectDir),',
              '    deadCodeCandidates (string[] — "<file>:<symbol>" entries with no external callers),',
              '    hotPath (string — dominant call chain from entry to terminal effect)',
              '  ),',
              '  summary (string — concise architectural overview of observations)',
            ].join('\n'),
          },
          outputSchema: {
            type: 'object',
            required: ['runtimeCallPaths', 'summary'],
            properties: {
              runtimeCallPaths: {
                type: 'object',
                additionalProperties: {
                  type: 'object',
                  required: ['entryPoint', 'tracedFiles', 'deadCodeCandidates', 'hotPath'],
                  properties: {
                    entryPoint: { type: 'string' },
                    tracedFiles: { type: 'array', items: { type: 'string' } },
                    deadCodeCandidates: { type: 'array', items: { type: 'string' } },
                    hotPath: { type: 'string' },
                  },
                },
              },
              summary: { type: 'string' },
            },
          },
        },
        io: {
          inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
          outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
        },
        labels: ['call-tracer', 'static-analysis', 'architecture', tracerName],
        execution: {
          timeout: resolvedTimeout,
        },
      };
    }
  );
}
