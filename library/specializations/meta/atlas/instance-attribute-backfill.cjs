const { defineTask } = require('@a5c-ai/babysitter-sdk');

// When the schema adds a new attribute to a NodeKind, existing instances
// silently miss it. W84 was the manual backfill wave for the W83 Subagent and
// Skill attr additions. This process re-runs that lens periodically: it diffs
// schema HEAD vs N days ago, lists newly-added attributes, scans instances
// that don't populate them, and emits per-(instance, attribute) populate
// subtasks. No breakpoint — population is doc-grounded research; absent
// grounding, the attribute stays omitted.

const diffSchemaTask = defineTask('diff-schema-attributes', (args) => ({
  kind: 'agent',
  title: 'Diff schema HEAD vs N days ago for newly-added attributes',
  metadata: {
    schemaRoot: args.schemaRoot,
    sinceDays: args.sinceDays,
    sinceRef: args.sinceRef,
    instructions: [
      'Determine the comparison ref: explicit sinceRef if provided, else `git rev-parse HEAD@{N.days.ago}` for sinceDays.',
      'Diff schema/node-kinds/*.yaml between the comparison ref and HEAD.',
      'Extract every newly-added attribute key per NodeKind (additions only — renames/removals out of scope here).',
      'Return JSON: { sinceRef, newAttrs: [{ nodeKindId, attrName, attrSchema }] }.',
    ],
  },
}));

const findUnderpopulatedInstancesTask = defineTask('find-underpopulated-instances', (args) => ({
  kind: 'agent',
  title: 'Find instances missing newly-added attributes',
  metadata: {
    newAttrs: args.newAttrs,
    graphRoot: args.graphRoot,
    instructions: [
      'For each newAttr, scan all YAML docs under graph/ matching nodeKind=newAttr.nodeKindId.',
      'List instances whose attribute map lacks attrName.',
      'Return JSON: { gaps: [{ nodeKindId, attrName, instanceId, instanceFile }] }.',
    ],
  },
}));

const populateOneAttributeTask = defineTask('populate-one-attribute', (args) => ({
  kind: 'agent',
  title: `Populate ${args.gap.attrName} on ${args.gap.instanceId}`,
  metadata: {
    gap: args.gap,
    watchlistPath: args.watchlistPath,
    instructions: [
      'Research the value for this single (instance, attribute) pair using the vendor docs cited on the instance plus the watchlist for that vendor.',
      'Three outcomes:',
      '  - applied: doc-grounded value found; edit the instance YAML to add the attribute, author a Claim record citing the source URL + retrievedAt + ≤15-word quote, run the validator.',
      '  - omitted-no-evidence: no doc grounding; do NOT fabricate. Leave the attribute omitted. Record the negative outcome.',
      '  - carry-over: doc grounding ambiguous; return a carry-over task capturing requiredInformation without writing placeholder graph data.',
      'No Trust Chain entries.',
      'Return JSON: { gapId, outcome, fileEdited?, claimId?, carryOverTask? }.',
    ],
  },
}));

const summarizeBackfillTask = defineTask('summarize-attribute-backfill', (args) => ({
  kind: 'agent',
  title: 'Summarize attribute-backfill run',
  metadata: {
    populateResults: args.populateResults,
    checks: [
      'Validator: 0 structural, 0 dangling, 0 parse errors after all applied edits.',
      'Every applied attribute value is paired with a Claim citing source URL + retrievedAt.',
      'No fabricated values: omitted-no-evidence outcomes exist where evidence was lacking.',
      'No Trust Chain entries.',
      'Return JSON: { status, appliedCount, omittedCount, carryOverCount }.',
    ],
  },
}));

exports.process = async function process(inputs, ctx) {
  const schemaRoot = inputs.schemaRoot || 'graph/schema';
  const graphRoot = inputs.graphRoot || 'graph';
  const sinceDays = inputs.sinceDays || 30;
  const sinceRef = inputs.sinceRef || null;
  const watchlistPath = inputs.watchlistPath || '.a5c/processes/vendor-docs-watchlist.json';

  const diff = await ctx.task(diffSchemaTask, { schemaRoot, sinceDays, sinceRef });
  const gapsResult = await ctx.task(findUnderpopulatedInstancesTask, {
    newAttrs: diff.newAttrs,
    graphRoot,
  });

  const populateResults = [];
  for (const gap of gapsResult.gaps) {
    const result = await ctx.task(populateOneAttributeTask, { gap, watchlistPath });
    populateResults.push(result);
  }

  const summary = await ctx.task(summarizeBackfillTask, { populateResults });

  return {
    status: summary.status,
    schemaRoot,
    graphRoot,
    sinceRef: diff.sinceRef,
    diff,
    gapsResult,
    populateResults,
    summary,
  };
};
