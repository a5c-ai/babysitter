const { defineTask } = require('@a5c-ai/babysitter-sdk');

// Audit the W86 anti-pattern: flat-list attributes on NodeKinds whose values
// shadow (or should be) first-class graph entities. W86 promoted 8 such lumps
// (permissionModesAvailable, hooksFiredFromCore, mcpConfigScopes,
// pluginInstallScopes, skillDiscoveryScopes, messageTypesEmitted,
// effortLevelsSupported, skillFrontmatterFieldsSupported) to NodeKinds + edges.
// This process re-runs that lens periodically. A single breakpoint guards
// applying remodels — schema reshapes need user review.

const parseSchemaTask = defineTask('parse-schema-attributes', (args) => ({
  kind: 'agent',
  title: 'Parse schema/node-kinds/*.yaml into an attribute inventory',
  metadata: {
    schemaRoot: args.schemaRoot,
    instructions: [
      'Walk schema/node-kinds/*.yaml. For every NodeKind, extract every attribute with type=array (items=string or items=enum).',
      'For each list attribute, record: nodeKindId, attrName, items.type, items.enum (if any), description, and known instance-side value sets (sample 3-5 instances of the NodeKind to gather actually-used values).',
      'Return JSON: { listAttrs: [{ nodeKindId, attrName, itemsType, enumValues, sampleValues, description }] }.',
    ],
  },
}));

const detectShadowingTask = defineTask('detect-shadowing-attributes', (args) => ({
  kind: 'agent',
  title: 'Detect list attributes that shadow existing NodeKinds',
  metadata: {
    listAttrs: args.listAttrs,
    instructions: [
      'For each list attribute, apply the heuristic flag: attrName matches any of /Modes$|Scopes$|Hooks?$|Tools?$|Capabilities$|Messages?$|Levels?$|Fields?$|Events?$|Primitives?$|Schemes?$/ — flagged.',
      'Independently, check whether the attribute value space (enum or sampled values) semantically matches an existing NodeKind id-pattern in the catalog (e.g. permission mode names match instances of PermissionMode; hook names match instances of HookSurface).',
      'Classify each flagged attribute as one of:',
      '  - shadows-existing-nodekind: values map to an existing NodeKind. Propose: replace flat list with an edge.',
      '  - should-be-new-nodekind: values are cross-cutting and reused on ≥2 NodeKinds. Propose: new sibling NodeKind + edge (W86 option b).',
      '  - keep-flat: bounded knob, single enum, per-platform map, nested config object. Document why per the W86 §8 keep-flat list.',
      'Return JSON: { findings: [{ nodeKindId, attrName, classification, proposalSummary, proposedEdgeKind?, proposedTargetNodeKind? }] }.',
    ],
  },
}));

// BREAKPOINT: schema remodels need user review. Each finding can become a
// significant ontology change, and the W86 wave was explicitly user-directed
// per-fix.
const reviewProposalsTask = defineTask('review-remodel-proposals', (args) => ({
  kind: 'breakpoint',
  title: 'Review proposed schema remodels',
  metadata: {
    findings: args.findings,
    prompt: 'Each finding proposes a schema remodel that promotes a flat list to a NodeKind/edge structure. Review and either accept (apply this run), defer (record a carry-over task in the process result), or reject (mark as keep-flat going forward).',
  },
}));

const applyRemodelTask = defineTask('apply-schema-remodel', (args) => ({
  kind: 'agent',
  title: `Apply remodel for ${args.finding.nodeKindId}.${args.finding.attrName}`,
  metadata: {
    finding: args.finding,
    instructions: [
      'Promote the flat list to graph: author the new NodeKind (if needed) under schema/node-kinds/, the new EdgeKind pair under schema/edge-kinds.yaml, and migrate every existing instance to use edges instead of the flat list.',
      'Remove the flat attr at the source; leave a single trace-comment pointing at the replacement edge/NodeKind (W86 convention).',
      'Carry the W86 NodeKind ontologyRationale field for any genuinely cross-cutting promotion.',
      'Run the validator; verify all new EdgeKinds are activated and the instance migration is complete.',
      'Return JSON: { findingId, status: applied|reverted, nodeKindsAdded[], edgeKindsAdded[], instancesMigrated, validatorState }.',
    ],
  },
}));

const carryOverProposalTask = defineTask('carry-over-remodel-proposal', (args) => ({
  kind: 'agent',
  title: `Carry over remodel for ${args.finding.nodeKindId}.${args.finding.attrName}`,
  metadata: {
    finding: args.finding,
    instructions: [
      'Return a carry-over task capturing the proposal outside the active graph: targetNodeKind=the proposed new NodeKind (or `schema-remodel`), reason, requiredInformation, searchedSources, and nextAction.',
      'Return JSON: { findingId, carryOverTask }.',
    ],
  },
}));

exports.process = async function process(inputs, ctx) {
  const schemaRoot = inputs.schemaRoot || 'graph/schema';

  const inventory = await ctx.task(parseSchemaTask, { schemaRoot });
  const shadowing = await ctx.task(detectShadowingTask, { listAttrs: inventory.listAttrs });

  const review = await ctx.task(reviewProposalsTask, { findings: shadowing.findings });

  const decisions = review.decisions || [];
  const applied = [];
  const carryOver = [];
  for (const decision of decisions) {
    if (decision.action === 'apply') {
      applied.push(await ctx.task(applyRemodelTask, { finding: decision.finding }));
    } else if (decision.action === 'defer') {
      carryOver.push(await ctx.task(carryOverProposalTask, { finding: decision.finding }));
    }
  }

  return {
    status: 'ok',
    schemaRoot,
    inventory,
    shadowing,
    review,
    applied,
    carryOver,
  };
};
