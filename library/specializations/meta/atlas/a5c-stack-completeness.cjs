const { defineTask } = require('@a5c-ai/babysitter-sdk');

// a5c stack-completeness convergence process.
//
// The v6 catalog models multiple agent products. The `agent:a5c` product
// needs full stack-layer impl records (AgentCoreImpl, AgentRuntimeImpl,
// AgentPlatformImpl, AgentUIImpl, plus LaunchConfig, SessionModel,
// CapabilityProfile, Presentation, InteractionPrimitive set, AgentVersion)
// at the same fidelity as the Claude Code reference. This process performs
// iterative convergence: each run identifies gaps relative to Claude Code
// (gold-standard) and either closes them with doc-grounded values or records
// process carry-over tasks for spec authoring. Re-runnable; the convergence log
// records per-layer coverage so successive runs can see whether the gap
// set is shrinking.
//
// Breakpoints are sparse:
//   - One before `author` if any wholly-missing layer record would be
//     created (creating a brand-new top-level impl file is a meaningful
//     spec decision worth user confirmation).
//   - One optional before `carry-over-spec-authoring` if >5 graph carry-over tasks
//     would be filed in a single run, so the user can prioritize.
// Otherwise the iteration runs autonomously. No `kind: 'shell'` subtasks.
//
// No Trust Chain entries. No fabrication — values must come from a5c
// source-of-truth or from the schema; otherwise a carry-over task is returned in the process result.

// ---------------------------------------------------------------------------
// Configuration (edit here for tuning).
// ---------------------------------------------------------------------------

const GRAPH_ROOT = 'graph';
const SCHEMA_ROOT = 'graph/schema';
const A5C_PRODUCT_ID = 'agent-product:a5c';
const GOLD_STANDARD_PRODUCT_ID = 'agent-product:claude-code';

// Canonical layers that an a5c stack record-set should cover. Each entry is
// a (NodeKind, expected-id-prefix-on-a5c, gold-standard reference id).
const CANONICAL_LAYERS = [
  { nodeKindId: 'AgentCoreImpl',         a5cIdPrefix: 'agent-core-impl:a5c.core',           goldRef: 'agent-core-impl:claude-code.core' },
  { nodeKindId: 'AgentRuntimeImpl',      a5cIdPrefix: 'agent-runtime-impl:a5c.runtime',     goldRef: 'agent-runtime-impl:claude-code.runtime' },
  { nodeKindId: 'AgentPlatformImpl',     a5cIdPrefix: 'agent-platform-impl:a5c.platform',   goldRef: 'agent-platform-impl:claude-code.platform' },
  { nodeKindId: 'AgentUIImpl',           a5cIdPrefix: 'agent-ui-impl:a5c.ui',               goldRef: 'agent-ui-impl:claude-code.ui' },
  { nodeKindId: 'AgentVersion',          a5cIdPrefix: 'agent-version:a5c',                  goldRef: 'agent-version:claude-code' },
  { nodeKindId: 'LaunchConfig',          a5cIdPrefix: 'launch-config:a5c',                  goldRef: 'launch-config:claude-code' },
  { nodeKindId: 'SessionModel',          a5cIdPrefix: 'session-model:a5c',                  goldRef: 'session-model:claude-code' },
  { nodeKindId: 'CapabilityProfile',     a5cIdPrefix: 'capability-profile:a5c',             goldRef: 'capability-profile:claude-code' },
  { nodeKindId: 'Presentation',          a5cIdPrefix: 'presentation:a5c',                   goldRef: 'presentation:claude-code' },
  { nodeKindId: 'InteractionPrimitive',  a5cIdPrefix: 'interaction-primitive:a5c',          goldRef: 'interaction-primitive:claude-code' },
];

// a5c source-of-truth directories — searched in order for evidence.
const A5C_SOURCE_OF_TRUTH_DIRS = [
  'C:/work/v6/wiki/legacy/a5c',
  'C:/work/v6/.a5c',
  'C:/Users/tmusk/IdeaProjects/babysitter',
];

// Append-only convergence log.
const COVERAGE_LOG_PATH = '.a5c/state/a5c-stack-coverage-log.json';

// Threshold for the optional pre-carry-over breakpoint.
const CARRY_OVER_BREAKPOINT_THRESHOLD = 5;

// ---------------------------------------------------------------------------
// Subtasks.
// ---------------------------------------------------------------------------

const inventoryTask = defineTask('a5c-stack-inventory', (args) => ({
  kind: 'agent',
  title: 'Inventory a5c stack-layer records currently in graph',
  metadata: {
    graphRoot: args.graphRoot,
    productId: args.productId,
    canonicalLayers: args.canonicalLayers,
    instructions: [
      'For each canonicalLayer, search the graph for a record whose nodeKind matches and whose id starts with a5cIdPrefix OR which is linked to productId via composes/realizes/version_of edges.',
      'Classify each layer as one of: present (file exists, instance found), partial (file exists but core attributes missing), missing (no instance found).',
      'Also resolve the file path for the gold-standard reference (goldRef) so downstream tasks can diff against it.',
      'Return JSON: { layers: [{ nodeKindId, status, a5cInstanceId?, a5cInstanceFile?, goldRefId, goldRefFile?, linkedFromProduct: bool }], productFile }.',
    ],
  },
}));

const gapAnalysisTask = defineTask('a5c-stack-gap-analysis', (args) => ({
  kind: 'agent',
  title: `Gap analysis for a5c ${args.layer.nodeKindId}`,
  metadata: {
    layer: args.layer,
    schemaRoot: args.schemaRoot,
    graphRoot: args.graphRoot,
    instructions: [
      'Load the NodeKind schema for layer.nodeKindId from schemaRoot — collect the full attribute surface (required + optional) and the allowed edgeKinds.',
      'If layer.status === "missing": the gap is "wholly-missing layer record"; expectedAttrs comes from schema + whatever attrs the gold-standard reference populates.',
      'If layer.status in (present, partial): load the a5c instance YAML and the gold-standard reference YAML.',
      'Diff in three buckets:',
      '  (a) attribute-missing — attribute exists on schema and is populated on gold-standard, but absent on a5c instance.',
      '  (b) edge-missing — gold-standard has an outbound edge of some edgeKind to a peer record, and a5c has no equivalent (e.g. CapabilityProfile→supports→Capability links).',
      '  (c) capability-flag-missing — gold-standard advertises a capability flag (via CapabilityProfile.supports or AgentRuntimeImpl.capabilityFlags) with no a5c parity wiring.',
      'For each gap entry, include the schema definition (so downstream research knows what shape to fill).',
      'Return JSON: { layer: layer.nodeKindId, wholeLayerMissing: bool, gaps: [{ kind: "attribute-missing"|"edge-missing"|"capability-flag-missing", attrOrEdge, schemaShape, goldStandardValue? }] }.',
    ],
  },
}));

const a5cSpecResearchTask = defineTask('a5c-spec-research', (args) => ({
  kind: 'agent',
  title: `a5c spec research for ${args.layer} (${args.gaps.length} gaps)`,
  metadata: {
    layer: args.layer,
    gaps: args.gaps,
    sourceOfTruthDirs: args.sourceOfTruthDirs,
    instructions: [
      'For each gap, search the a5c source-of-truth directories (sourceOfTruthDirs) for evidence describing how a5c implements / configures / exposes this concept.',
      'Search both architecture docs (markdown, ADRs, specs) and source code (TypeScript, package.json fields, config schemas).',
      'Three outcomes per gap:',
      '  (a) doc-grounded — evidence found; produce { outcome: "doc-grounded", proposedValue, evidencePath, evidenceQuote (≤15 words) }.',
      '  (b) not-applicable — a5c semantically lacks this concept; produce { outcome: "not-applicable", reason }. The author phase will either omit or annotate the attribute.',
      '  (c) spec-undefined — a5c could plausibly support this but the spec is silent; produce { outcome: "spec-undefined", requiredInformation } so a carry-over task can be returned in the process result.',
      'No fabrication. If evidence is ambiguous, prefer (c) over (a).',
      'Do NOT consult Claude Code docs as evidence for a5c — only a5c sources.',
      'Return JSON: { layer, researched: [{ gap, outcome, ...payload }] }.',
    ],
  },
}));

const authorLayerTask = defineTask('a5c-stack-author', (args) => ({
  kind: 'codegen',
  title: `Author/update a5c ${args.layer.nodeKindId} record`,
  metadata: {
    layer: args.layer,
    researched: args.researched,
    wholeLayerMissing: args.wholeLayerMissing,
    goldRefFile: args.goldRefFile,
    a5cIdPrefix: args.a5cIdPrefix,
    productId: args.productId,
    graphRoot: args.graphRoot,
    instructions: [
      'If wholeLayerMissing: create a new YAML file mirroring the structure/sectioning of goldRefFile. Use a5cIdPrefix to form the new id (append @<version> consistent with the AgentVersion record, e.g. @1.x). Wire the canonical edges (realizes → product, composes ← appropriate parent, version_of → AgentVersion, etc.) using the same edge shapes as the gold-standard reference.',
      'For doc-grounded outcomes: write the attribute/edge into the YAML using proposedValue. Pair every applied attribute with a Claim record (statement, sourceUrl OR sourcePath, retrievedAt, ≤15-word evidenceQuote) per the catalog convention.',
      'For not-applicable outcomes: omit the attribute. Optionally add a `notSupported` annotation list at the top of the instance for documentation. Do NOT invent placeholder values.',
      'For spec-undefined outcomes: do not write the attribute here — those go to the carry-over phase.',
      'Author phase is incremental: only write attributes that are currently missing. Do not overwrite already-populated values.',
      'No Trust Chain entries.',
      'Return JSON: { layer: layer.nodeKindId, fileEdited, fileCreated: bool, appliedCount, skippedNotApplicableCount, claimsAuthored[] }.',
    ],
  },
}));

const carryOverAuthoringTask = defineTask('a5c-carry-over-spec-authoring', (args) => ({
  kind: 'codegen',
  title: 'Record carry-over tasks for a5c spec-undefined gaps',
  metadata: {
    specUndefinedGaps: args.specUndefinedGaps,
    graphRoot: args.graphRoot,
    instructions: [
      'For each spec-undefined gap, return a carry-over task entry in the process result; do not write placeholder graph records.',
      'Carry-over task id pattern: a5c.<layer>.<attrOrEdge>; deduplicate against carry-over inputs or prior run summaries when available.',
      'Each carry-over task captures: { targetNodeKind, targetInstanceId, requiredInformation, searchedSources, nextAction, raisedBy: "a5c-stack-completeness", raisedAt }.',
      'Do not run the validator for carry-over-only output; run it only if graph files were edited.',
      'Return JSON: { carryOverTasks: [...], skippedAsDuplicate: [...] }.',
    ],
  },
}));

const verifyTask = defineTask('a5c-stack-verify', (args) => ({
  kind: 'agent',
  title: 'Verify a5c stack edits and compute coverage',
  metadata: {
    perLayerAuthorResults: args.perLayerAuthorResults,
    perLayerGapAnalyses: args.perLayerGapAnalyses,
    graphRoot: args.graphRoot,
    schemaRoot: args.schemaRoot,
    checks: [
      'Run `python tools/validator/validate.py` and confirm 0 orphans, 0 dangling edges, 0 parse errors.',
      'Re-load each a5c stack instance and recompute populated_attrs / total_schema_attrs per layer.',
      'For each layer, also count edges populated vs. edges populated on the gold-standard reference (parity ratio).',
      'No Trust Chain entries authored.',
      'Every applied attribute is paired with a Claim record citing source.',
      'Return JSON: { validatorOk: bool, perLayerCoverage: [{ layer, populatedAttrs, schemaAttrs, attrCoveragePct, edgeParityPct, remainingGaps }], totalRemainingGaps, totalSpecUndefined, totalNotApplicable }.',
    ],
  },
}));

const convergenceTrackerTask = defineTask('a5c-convergence-tracker', (args) => ({
  kind: 'codegen',
  title: 'Append a5c stack coverage entry to convergence log',
  metadata: {
    coverageLogPath: args.coverageLogPath,
    runId: args.runId,
    coverage: args.coverage,
    instructions: [
      'Append a single JSON line (or extend the JSON array — match whichever shape the existing file uses; create as [] if absent) to coverageLogPath.',
      'Entry shape: { timestamp, runId, perLayerCoverage: [...], gapsClosedThisRun, gapsRemaining, specUndefinedRemaining }.',
      'gapsClosedThisRun = sum across layers of doc-grounded outcomes that resulted in fileEdited.',
      'Determine convergence: converged === true when (gapsRemaining === 0) OR (gapsRemaining === specUndefinedRemaining AND the previous 2 log entries report the identical specUndefinedRemaining count). Read the tail of the log to evaluate this.',
      'Return JSON: { logPath, appended: entry, converged: bool, runsAtSpecUndefinedPlateau }.',
    ],
  },
}));

// ---------------------------------------------------------------------------
// Process.
// ---------------------------------------------------------------------------

exports.process = async function process(inputs, ctx) {
  const graphRoot = inputs.graphRoot || GRAPH_ROOT;
  const schemaRoot = inputs.schemaRoot || SCHEMA_ROOT;
  const productId = inputs.productId || A5C_PRODUCT_ID;
  const goldStandardProductId = inputs.goldStandardProductId || GOLD_STANDARD_PRODUCT_ID;
  const sourceOfTruthDirs = inputs.sourceOfTruthDirs || A5C_SOURCE_OF_TRUTH_DIRS;
  const coverageLogPath = inputs.coverageLogPath || COVERAGE_LOG_PATH;
  const carryOverBreakpointThreshold = inputs.carryOverBreakpointThreshold || CARRY_OVER_BREAKPOINT_THRESHOLD;

  // 1. Inventory.
  const inventory = await ctx.task(inventoryTask, {
    graphRoot,
    productId,
    canonicalLayers: CANONICAL_LAYERS,
    goldStandardProductId,
  });

  // 2. Per-layer gap analysis.
  const perLayerGapAnalyses = [];
  for (const layer of inventory.layers) {
    const ga = await ctx.task(gapAnalysisTask, { layer, schemaRoot, graphRoot });
    perLayerGapAnalyses.push(ga);
  }

  // Breakpoint #1: confirm scope if any wholly-missing layer would be created.
  const wholeMissingLayers = perLayerGapAnalyses
    .filter((ga) => ga.wholeLayerMissing)
    .map((ga) => ga.layer);
  if (wholeMissingLayers.length > 0 && ctx.breakpoint) {
    await ctx.breakpoint({
      title: 'Confirm scope: create new a5c stack records?',
      detail: {
        wholeMissingLayers,
        message: 'These layers have no a5c record at all. Authoring will create new top-level impl files. Confirm scope before proceeding.',
      },
    });
  }

  // 3. a5c spec research per layer.
  const perLayerResearch = [];
  for (const ga of perLayerGapAnalyses) {
    if (!ga.gaps || ga.gaps.length === 0) continue;
    const researched = await ctx.task(a5cSpecResearchTask, {
      layer: ga.layer,
      gaps: ga.gaps,
      sourceOfTruthDirs,
    });
    perLayerResearch.push(researched);
  }

  // 4. Author layer-by-layer.
  const layerByName = new Map(CANONICAL_LAYERS.map((l) => [l.nodeKindId, l]));
  const inventoryByName = new Map(inventory.layers.map((l) => [l.nodeKindId, l]));
  const perLayerAuthorResults = [];
  for (const ga of perLayerGapAnalyses) {
    const research = perLayerResearch.find((r) => r.layer === ga.layer);
    const layerCfg = layerByName.get(ga.layer);
    const inv = inventoryByName.get(ga.layer);
    const result = await ctx.task(authorLayerTask, {
      layer: { nodeKindId: ga.layer },
      researched: research ? research.researched : [],
      wholeLayerMissing: !!ga.wholeLayerMissing,
      goldRefFile: inv ? inv.goldRefFile : null,
      a5cIdPrefix: layerCfg ? layerCfg.a5cIdPrefix : null,
      productId,
      graphRoot,
    });
    perLayerAuthorResults.push(result);
  }

  // 5. Optionally pause before carry-over task capture.
  const specUndefinedGaps = [];
  for (const r of perLayerResearch) {
    for (const item of (r.researched || [])) {
      if (item.outcome === 'spec-undefined') {
        specUndefinedGaps.push({ layer: r.layer, ...item });
      }
    }
  }

  if (specUndefinedGaps.length > carryOverBreakpointThreshold && ctx.breakpoint) {
    await ctx.breakpoint({
      title: `Prioritize ${specUndefinedGaps.length} carry-over tasks before recording?`,
      detail: {
        count: specUndefinedGaps.length,
        threshold: carryOverBreakpointThreshold,
        sample: specUndefinedGaps.slice(0, 10),
      },
    });
  }

  // 6. Carry-over capture.
  const carryOver = specUndefinedGaps.length > 0
    ? await ctx.task(carryOverAuthoringTask, { specUndefinedGaps, graphRoot })
    : { carryOverTasks: [], skippedAsDuplicate: [] };

  // 7. Verify.
  const verify = await ctx.task(verifyTask, {
    perLayerAuthorResults,
    perLayerGapAnalyses,
    graphRoot,
    schemaRoot,
  });

  // 8. Convergence tracker.
  const tracker = await ctx.task(convergenceTrackerTask, {
    coverageLogPath,
    runId: ctx.runId || (inputs && inputs.runId) || `run-${Date.now()}`,
    coverage: verify,
  });

  return {
    status: verify.validatorOk ? 'ok' : 'needs-review',
    productId,
    inventory,
    perLayerGapAnalyses,
    perLayerResearch,
    perLayerAuthorResults,
    carryOver,
    verify,
    tracker,
    converged: tracker.converged,
  };
};
