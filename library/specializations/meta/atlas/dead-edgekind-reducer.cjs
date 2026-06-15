const { defineTask } = require('@a5c-ai/babysitter-sdk');

// Periodic reduction of dead EdgeKinds. Captures the recurring W63-W74 + W84
// pattern of taking the dead-edge count from 254 → 13. For each dead EdgeKind,
// either (1) wire an existing instance, (2) propose retirement from schema, or
// (3) flag as out-of-scope. A single breakpoint guards retirement — deleting
// an EdgeKind from the schema is irreversible enough that the user should
// confirm.

const listDeadEdgeKindsTask = defineTask('list-dead-edge-kinds', (args) => ({
  kind: 'agent',
  title: 'List dead EdgeKinds from the validator',
  metadata: {
    graphRoot: args.graphRoot,
    validatorCommand: args.validatorCommand,
    instructions: [
      'Run the validator and extract the dead-EdgeKind list (EdgeKinds declared in schema/edge-kinds.yaml with zero activated instances across the graph).',
      'For each: capture id, schema source/target unions, attributes, inverse pair, and any header-comment rationale present in schema/edge-kinds.yaml.',
      'Pre-classify the obvious out-of-scope ones up front: any EdgeKind whose semantics are Trust Chain (claims, evidence_at_level, produced_evidence_for, tests_in_scope, in_test_scope_of, produced_test_run, test_run_of) is OUT OF SCOPE — mark them and skip downstream investigation.',
      'Return JSON: { dead: [...], outOfScope: [...] }.',
    ],
  },
}));

const investigateOneEdgeKindTask = defineTask('investigate-dead-edge-kind', (args) => ({
  kind: 'agent',
  title: `Investigate dead EdgeKind ${args.edgeKind.id}`,
  metadata: {
    edgeKind: args.edgeKind,
    instructions: [
      'Read the schema/edge-kinds.yaml entry for this EdgeKind and any schema/node-kinds/*.yaml that declares it on outgoingEdges/incomingEdges.',
      'Grep the entire repo for the EdgeKind id (graph YAMLs, REMODEL-NOTES.md, wiki/legacy/ markdown, doc comments) to recover original intent.',
      'Decide one of:',
      '  - wire: an existing instance pair satisfies this edge semantically; identify { sourceInstanceId, targetInstanceId, attributes }.',
      '  - retire: the EdgeKind is truly unused, semantically subsumed by a different EdgeKind, or never had a reachable referent. Provide rationale.',
      '  - out-of-scope: Trust Chain or scope/meta surface that the catalog has explicitly chosen not to model.',
      'Return JSON: { edgeKindId, decision: wire|retire|out-of-scope, rationale, wiringProposal?: { sourceId, targetId, attributes }, retirementProposal?: { schemaFile, alsoRemoveInverseId } }.',
    ],
  },
}));

const wireOneEdgeKindTask = defineTask('wire-one-edge-kind', (args) => ({
  kind: 'agent',
  title: `Wire EdgeKind ${args.edgeKindId}`,
  metadata: {
    edgeKindId: args.edgeKindId,
    wiringProposal: args.wiringProposal,
    instructions: [
      'Apply the wiring: edit the source instance YAML to add the outgoing edge with the required attributes.',
      'Confirm the inverse EdgeKind is now also activated (same edge counts both directions).',
      'Run the validator. If introducing the wiring causes a new dangling/structural failure, revert and re-mark this edge as needs-research.',
      'Return JSON: { edgeKindId, status: wired|reverted, fileEdited?, validatorState }.',
    ],
  },
}));

// BREAKPOINT: retirement is destructive (removes an EdgeKind from the schema).
// Confirm with the user before the codegen step deletes anything.
const confirmRetirementTask = defineTask('confirm-edge-retirements', (args) => ({
  kind: 'breakpoint',
  title: 'Confirm EdgeKind retirements before applying',
  metadata: {
    retirementProposals: args.retirementProposals,
    prompt: 'The following dead EdgeKinds are proposed for retirement from schema/edge-kinds.yaml. Each will also remove its inverse pair. Removing an EdgeKind is harder to reverse than wiring one. Confirm the list, or strike entries that should stay (e.g. ones reserved for a planned future modeling pass).',
  },
}));

const retireEdgeKindsTask = defineTask('retire-edge-kinds', (args) => ({
  kind: 'agent',
  title: 'Retire confirmed dead EdgeKinds from the schema',
  metadata: {
    confirmedRetirements: args.confirmedRetirements,
    instructions: [
      'For each confirmed retirement, remove the EdgeKind entry (and its inverse) from schema/edge-kinds.yaml.',
      'Also remove any orphaned outgoingEdges/incomingEdges declarations on schema/node-kinds/*.yaml NodeKinds that reference the retired EdgeKind.',
      'Run the validator; expect the dead-EdgeKind count to drop by the number of retired pairs.',
      'Return JSON: { retiredEdgeKindIds[], filesEdited[], validatorState }.',
    ],
  },
}));

const reportTask = defineTask('summarize-dead-edge-reduction', (args) => ({
  kind: 'agent',
  title: 'Summarize dead-EdgeKind reduction outcome',
  metadata: {
    initialCount: args.initialCount,
    perEdgeOutcomes: args.perEdgeOutcomes,
    retired: args.retired,
    checks: [
      'Validator: 0 structural, 0 dangling, 0 parse errors after this run.',
      'Dead-EdgeKind count strictly decreased OR all remaining dead EdgeKinds are out-of-scope (Trust Chain etc.).',
      'No Trust Chain wiring was authored.',
      'Return JSON: { status: ok|needs-review, initialCount, finalCount, wiredCount, retiredCount, outOfScopeCount }.',
    ],
  },
}));

exports.process = async function process(inputs, ctx) {
  const graphRoot = inputs.graphRoot || 'graph';
  const validatorCommand = inputs.validatorCommand || 'python tools/validator/validate.py';
  const allowRetirement = inputs.allowRetirement !== false;

  const list = await ctx.task(listDeadEdgeKindsTask, { graphRoot, validatorCommand });
  const perEdgeOutcomes = [];
  const retirementProposals = [];

  for (const edgeKind of list.dead) {
    const investigation = await ctx.task(investigateOneEdgeKindTask, { edgeKind });
    if (investigation.decision === 'wire') {
      const wiring = await ctx.task(wireOneEdgeKindTask, {
        edgeKindId: edgeKind.id,
        wiringProposal: investigation.wiringProposal,
      });
      perEdgeOutcomes.push({ edgeKindId: edgeKind.id, decision: 'wire', wiring });
    } else if (investigation.decision === 'retire' && allowRetirement) {
      retirementProposals.push(investigation.retirementProposal);
      perEdgeOutcomes.push({ edgeKindId: edgeKind.id, decision: 'retire-proposed' });
    } else {
      perEdgeOutcomes.push({ edgeKindId: edgeKind.id, decision: investigation.decision });
    }
  }

  let retired = null;
  if (retirementProposals.length && allowRetirement) {
    const confirmation = await ctx.task(confirmRetirementTask, { retirementProposals });
    if (confirmation.confirmedRetirements && confirmation.confirmedRetirements.length) {
      retired = await ctx.task(retireEdgeKindsTask, {
        confirmedRetirements: confirmation.confirmedRetirements,
      });
    }
  }

  const summary = await ctx.task(reportTask, {
    initialCount: list.dead.length,
    perEdgeOutcomes,
    retired,
  });

  return {
    status: summary.status,
    graphRoot,
    initialDeadCount: list.dead.length,
    outOfScope: list.outOfScope,
    perEdgeOutcomes,
    retired,
    summary,
  };
};
