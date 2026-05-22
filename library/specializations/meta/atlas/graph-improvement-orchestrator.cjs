const { defineTask } = require('@a5c-ai/babysitter-sdk');

// Top-level scheduler that runs the graph-improvement maintenance processes
// in priority order. Each child is its own self-contained process .cjs file
// under .a5c/processes/. This orchestrator delegates to them one at a time,
// in a sequence chosen so cheap clean-state enforcement runs first and
// expensive doc-fetching audits run last.
//
// Order (rationale):
//  1. graph-validator-sweep         — keep clean-state at zero before anything else.
//  2. dead-edgekind-reducer         — wire or retire dead edges before new authoring.
//  3. schema-modeling-lint          — catch flat-list anti-patterns early; remodels block other waves.
//  4. instance-attribute-backfill   — fill known schema gaps using already-known doc grounding.
//  5. capability-completeness-audit — validate the capability layer is wired with versionRange + level.
//  6. a5c-stack-completeness        — per-vendor deepening for a5c before cross-vendor parity sweeps.
//  7. cross-vendor-parity-audit     — produce backlog of (vendor, attr) gaps using the watchlist.
//  8. vendor-doc-drift-detection    — re-fetch all watched docs; biggest-cost step, runs last.
//  9. env-var-inventory-sync        — env-var-specific doc fetch (subset of #8 but separately scoped).

const runChildProcessTask = defineTask('run-child-process', (args) => ({
  kind: 'agent',
  title: `Run child process ${args.processFile}`,
  metadata: {
    processFile: args.processFile,
    childInputs: args.childInputs,
    instructions: [
      `Invoke .a5c/processes/${args.processFile} as a babysitter sub-run, passing childInputs as its inputs.`,
      'Wait for completion. Capture { status, summary, carryOverTasks[], errorCount } from the child result.',
      'If the child returns status=needs-review or regressed, capture the reason but do not abort the orchestration unless inputs.stopOnFirstFailure is true.',
      'Return JSON: { processFile, status, summary, durationMs, errorCount }.',
    ],
  },
}));

const summarizeOrchestrationTask = defineTask('summarize-orchestration', (args) => ({
  kind: 'agent',
  title: 'Summarize graph-improvement orchestration run',
  metadata: {
    childResults: args.childResults,
    checks: [
      'Validator: 0 structural, 0 dangling, 0 parse errors after the full sequence (re-run validator if last child did not).',
      'Every child reported either ok or a captured needs-review with a clear reason.',
      'No Trust Chain entries authored anywhere.',
      'Compile a markdown report at wiki/agent-generate/graph-improvement/{date}.md summarizing per-child outcomes, total fixes applied, total backlog items emitted, and recommended next-run focus.',
      'Return JSON: { status, perChildSummary: [...], reportPath }.',
    ],
  },
}));

exports.process = async function process(inputs, ctx) {
  const stopOnFirstFailure = !!inputs.stopOnFirstFailure;
  const skip = new Set(inputs.skip || []);
  const childInputs = inputs.childInputs || {};

  const sequence = [
    'graph-validator-sweep.cjs',
    'dead-edgekind-reducer.cjs',
    'schema-modeling-lint.cjs',
    'instance-attribute-backfill.cjs',
    'capability-completeness-audit.cjs',
    'a5c-stack-completeness.cjs',
    'cross-vendor-parity-audit.cjs',
    'vendor-doc-drift-detection.cjs',
    'env-var-inventory-sync.cjs',
  ];

  const childResults = [];
  for (const processFile of sequence) {
    if (skip.has(processFile)) {
      childResults.push({ processFile, status: 'skipped' });
      continue;
    }
    const result = await ctx.task(runChildProcessTask, {
      processFile,
      childInputs: childInputs[processFile] || {},
    });
    childResults.push(result);
    if (stopOnFirstFailure && result.status !== 'ok' && result.status !== 'skipped') {
      break;
    }
  }

  const summary = await ctx.task(summarizeOrchestrationTask, { childResults });

  return {
    status: summary.status,
    sequence,
    childResults,
    summary,
  };
};
