const { defineTask } = require('@a5c-ai/babysitter-sdk');

// Periodic enforcement of validator clean-state. Drives orphans + dangling +
// parse + structural errors back to zero on every run. Captures the recurring
// W63-W74 maintenance pattern. Trust Chain remains OUT OF SCOPE — dead
// EdgeKinds in that area are handled by dead-edgekind-reducer.cjs and ignored
// here.

const runValidatorTask = defineTask('run-validator', (args) => ({
  kind: 'agent',
  title: 'Run catalog validator and parse output into a structured error set',
  metadata: {
    graphRoot: args.graphRoot,
    validatorCommand: args.validatorCommand,
    instructions: [
      'Execute the validator command (default: `python tools/validator/validate.py`) from the graph/ working directory.',
      'Capture stdout + stderr + exit code.',
      'Parse the output into structured buckets: { structural[], dangling[], parseErrors[], orphans[], deadEdgeKinds[], deadNodeKinds[], stats: { examplesScanned, examplesPassed } }.',
      'For each error, capture: errorClass, file, line, nodeKind, edgeKind, message, suggestedFix (if validator emits one).',
      'Trust Chain entries (claims/evidence_at_level/produced_evidence_for/tests_in_scope/in_test_scope_of/produced_test_run/test_run_of) are EXPLICITLY OUT OF SCOPE — exclude them from any error list emitted here.',
      'Return JSON: { stats, errors: { structural, dangling, parseErrors, orphans }, deadEdgeKinds, deadNodeKinds, rawOutput }.',
    ],
  },
}));

const triageErrorsTask = defineTask('triage-validator-errors', (args) => ({
  kind: 'agent',
  title: 'Triage validator errors into actionable fix groups',
  metadata: {
    errors: args.errors,
    instructions: [
      'Group errors by errorClass and by affected file/nodeKind.',
      'For each group, decide one of: { wire-existing: an existing instance can satisfy the dangling ref by adding an edge; remove-orphan: the orphan instance is dead and should be deleted; fix-parse: structural YAML repair; fix-schema-shape: an instance violates a schema attribute constraint; defer: ambiguous — author graph carry-over task instead of guessing }.',
      'For wire-existing groups, identify the candidate source/target nodes (grep the graph for matching ids).',
      'For remove-orphan groups, verify nothing else references the orphan; otherwise downgrade to wire-existing.',
      'Return JSON: { fixGroups: [{ groupId, decision, errorCount, files[], proposedAction, candidateRefs[] }], deferredCandidates[] }.',
    ],
  },
}));

const applyFixesTask = defineTask('apply-validator-fixes', (args) => ({
  kind: 'agent',
  title: 'Apply the triaged fixes to the graph',
  metadata: {
    fixGroups: args.fixGroups,
    deferredCandidates: args.deferredCandidates,
    instructions: [
      'For each fixGroup, edit the YAML files under graph/ to apply the proposed action.',
      'wire-existing: add edges (with required attributes per schema/edge-kinds.yaml — versionRange, level, etc., where the EdgeKind requires them).',
      'remove-orphan: delete the YAML doc; if the orphan was the only inhabitant of a multi-doc file, leave the file with the remaining docs intact.',
      'fix-parse: minimal structural repair only — do not rewrite content semantics.',
      'fix-schema-shape: align the instance with the NodeKind schema; if information would be lost, return a carry-over task in the process result and preserve the original information outside graph.',
      'defer: return a carry-over task with targetNodeKind, requiredInformation, searchedSources, nextAction, and targetIdHint/graphPathHint when known; do not write placeholder graph data.',
      'Do not introduce Trust Chain entries.',
      'Return JSON: { filesEdited[], filesCreated[], filesDeleted[], edgesAdded, instancesRemoved, carryOverTasks[] }.',
    ],
  },
}));

const reverifyTask = defineTask('re-run-validator', (args) => ({
  kind: 'agent',
  title: 'Re-run validator and report delta against pre-fix baseline',
  metadata: {
    baseline: args.baseline,
    fixesApplied: args.fixesApplied,
    validatorCommand: args.validatorCommand,
    instructions: [
      'Re-run the validator command and parse the result identically to run-validator.',
      'Compute deltas vs the baseline for: structural, dangling, parseErrors, orphans, deadEdgeKinds, deadNodeKinds, examplesPassed.',
      'Flag regressions explicitly (any error class whose count went up).',
      'Return JSON: { post: {...}, delta: {...}, regressions: [...], status: ok|needs-review|regressed }.',
    ],
  },
}));

exports.process = async function process(inputs, ctx) {
  const graphRoot = inputs.graphRoot || 'graph';
  const validatorCommand = inputs.validatorCommand || 'python tools/validator/validate.py';

  const baseline = await ctx.task(runValidatorTask, { graphRoot, validatorCommand });
  const triage = await ctx.task(triageErrorsTask, { errors: baseline.errors });
  const fixesApplied = await ctx.task(applyFixesTask, {
    fixGroups: triage.fixGroups,
    deferredCandidates: triage.deferredCandidates,
  });
  const verification = await ctx.task(reverifyTask, { baseline, fixesApplied, validatorCommand });

  return {
    status: verification.status,
    graphRoot,
    baseline,
    triage,
    fixesApplied,
    verification,
  };
};
