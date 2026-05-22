const { defineTask } = require('@a5c-ai/babysitter-sdk');

const discoverGraphGapsTask = defineTask('discover-graph-gaps', (args) => ({
  kind: 'agent',
  title: 'Discover graph gaps from comments and carry-over',
  metadata: {
    manualExecutionContract: 'Run this task directly or delegate it to a bounded subagent, then post JSON with task:post. Do not create helper loop scripts or external automation to drive this process.',
    graphRoot: args.graphRoot,
    graphPathIncludes: args.graphPathIncludes,
    maxGapsPerBatch: args.maxGapsPerBatch,
    maxBatchesPerRun: args.maxBatchesPerRun,
    commentScanCommand: args.commentScanCommand,
    carryOverInputs: args.carryOverInputs,
    instructions: [
      'Manual execution means the agent task is the unit of work: run repo/search/validator commands yourself or via a bounded subagent, then post the result. Never generate an orchestration loop script for this process.',
      'Scan graph YAML comments for TODO, Source, source URL, placeholder, confirm, verify, and unverified markers. Treat each information-bearing comment as graph work, not cleanup noise.',
      'Read carry-over inputs supplied by the caller and merge them with comment-derived gaps.',
      'For each gap, capture id, sourceKind, graphPathHint, line/column when available, originalText when comment-derived, targetNodeKind or targetEdgeKind when inferable, requiredInformation[], searchedSources[], and nextAction.',
      'Apply inputs.graphPathIncludes filters when provided, but do not collapse the run to one item unless the filtered work genuinely contains one item.',
      'Return enough selected gaps for multiple batches when available; this process is iterative and should not end after the first resolvable gap or the first small batch.',
      'Return JSON: { graphGaps: [...], selectedGraphGaps: [...], skippedCount, commentScan }.',
    ],
  },
}));

const researchGraphGapTask = defineTask('research-graph-gap', (args) => ({
  kind: 'agent',
  title: `Research ${args.graphGap.id}`,
  metadata: {
    manualExecutionContract: 'Research this exact graph gap directly or with a bounded subagent and post source-backed JSON. Do not write scripts that loop over tasks.',
    graphGap: args.graphGap,
    attempt: args.attempt,
    previousVerification: args.previousVerification,
    instructions: [
      'Research this single graph gap only. Do not collapse it into a generic backlog.',
      'Read the target graphPathHint, nearby graph records, schema NodeKind/EdgeKind definitions, and any searchedSources before searching online.',
      'Resolve each requiredInformation item into source-backed facts when possible.',
      'Use local graph/repo evidence first, then official vendor docs, model cards, provider catalogs, pricing pages, and official benchmark/methodology pages as needed.',
      'For OpenAI facts, use official OpenAI documentation/pages only unless the requirement explicitly asks for a third-party benchmark mapping.',
      'For Google/Gemini facts, use official Google AI/DeepMind/Vertex documentation/pages first.',
      'For open-weight model facts, prefer official vendor/research-org model cards or Hugging Face model cards owned by the vendor org.',
      'Do not satisfy research by inventing evidence-count filler, generic process artifacts, run-numbered records, or records whose ids/filenames contain gap/run/batch/process terminology.',
      'Return JSON: { graphGapId, facts: [{ requirement, value, confidence, sourceUrl, sourceKind, retrievedAt, quoteOrParaphrase, targetNodeId?, targetAttribute?, graphAction }], stillMissing: [{ requirement, searchedSources, reason, nextAction }], obsolete?: { reason, sourceUrl? } }.',
    ],
  },
}));

const fulfillGraphGapTask = defineTask('fulfill-graph-gap', (args) => ({
  kind: 'agent',
  title: `Fulfill ${args.graphGap.id} with graph subset`,
  metadata: {
    manualExecutionContract: 'Edit graph YAML directly for this graph gap and post the resulting graph change summary. Do not generate orchestration loop scripts.',
    graphGap: args.graphGap,
    research: args.research,
    dryRun: args.dryRun,
    commentScanCommand: args.commentScanCommand,
    instructions: [
      'Author concrete graph nodes, edges, and attributes in the correct domain directory and file structure. Do not create placeholder files or process-history files.',
      'Preserve the modeling level: learned facts should become domain nodes/edges/attributes, not generic Claim/EvidenceSource filler. Use Claim/EvidenceSource only to back concrete facts that need provenance.',
      'If a comment is removed, its information must be represented by real graph data or explicitly preserved as carry-over in this task result.',
      'Use stable domain ids and filenames that describe the modeled concept. Do not put gap/run/batch/process terminology in target graph ids or filenames.',
      'Keep unresolved work outside graph as carryOverTasks[] in the task result; do not add placeholder graph records.',
      'Run the validator and comment scan unless dryRun is true.',
      'Return JSON: { status, graphGapId, filesCreated[], filesEdited[], filesDeleted[], nodesAdded[], edgesAdded[], claimsAdded[], evidenceAdded[], carryOverTasks[], validatorState, commentScanState, notes[] }.',
    ],
  },
}));

const verifyGraphGapTask = defineTask('verify-graph-gap', (args) => ({
  kind: 'agent',
  title: `Verify ${args.graphGap.id}`,
  metadata: {
    manualExecutionContract: 'Verify the actual files changed for this graph gap. Do not write scripts that drive the whole process.',
    graphGap: args.graphGap,
    research: args.research,
    fulfillment: args.fulfillment,
    attempt: args.attempt,
    commentScanCommand: args.commentScanCommand,
    checks: [
      'Validator has 0 parse errors, 0 structural failures, and 0 dangling refs introduced by this gap.',
      'The modeled facts are represented as domain nodes/edges/attributes, not generic evidence-count filler.',
      'No information-bearing source/TODO/comment was silently deleted.',
      'Target graph filenames and ids describe the modeled concepts, not this resolution process.',
      'Any unresolved work remains only in carryOverTasks[] in the task result or preserved graph comments, not placeholder graph nodes.',
      'Return JSON: { status: ok|retry|blocked, graphGapId, reason?, validatorState, commentScanState, carryOverTasks[], notes[] }.',
    ],
  },
}));

const resolveGraphGapBatchTask = defineTask('resolve-graph-gap-batch', (args) => ({
  kind: 'agent',
  title: `Resolve graph gap batch ${args.batchNumber}`,
  metadata: {
    manualExecutionContract: 'Resolve this bounded batch directly or with bounded subagents. Do not create external loop scripts.',
    batchGaps: args.batchGaps,
    batchIndex: args.batchIndex,
    dryRun: args.dryRun,
    commentScanCommand: args.commentScanCommand,
    instructions: [
      'For each selected gap, research, fulfill, and verify before moving to the next gap or subagent result.',
      'Prefer parallel bounded subagents only when write scopes are disjoint.',
      'Author concrete graph subsets in the right domain directories; never create placeholder graph nodes for unresolved work.',
      'Return JSON: { status, perGapResults[], carryOverTasks[], validatorState, commentScanState, notes[] }.',
    ],
  },
}));

const verifyGraphGapBatchTask = defineTask('verify-graph-gap-batch', (args) => ({
  kind: 'agent',
  title: 'Verify graph gap batch',
  metadata: {
    manualExecutionContract: 'Summarize the already-posted per-gap task results and validator state. Do not create helper loop scripts.',
    results: args.results,
    commentScanCommand: args.commentScanCommand,
    checks: [
      'Summarize per-gap outcomes for one batch; this process normally runs multiple batches per run when work remains.',
      'If this is not the final selected batch, return ok when this batch is valid so the process continues into the next batch in the same run.',
      'Validator completes with 0 parse errors, 0 structural failures, and 0 dangling refs introduced by this batch.',
      'Comment scan completes with no information-bearing comments in edited graph files unless remaining comments are preserved intentionally and listed as carry-over.',
      'Return JSON: { status: ok|needs-review, resolvedCount, partiallyResolvedCount, blockedCount, selectedCount, validatorState, commentScanState, carryOverTasks[], notes[] }.',
    ],
  },
}));

exports.process = async function process(inputs, ctx) {
  const graphRoot = inputs.graphRoot || 'graph';
  const dryRun = !!inputs.dryRun;
  const maxGapIterations = inputs.maxGapIterations || 3;
  const maxGapsPerBatch = inputs.maxGapsPerBatch || inputs.maxNodesPerBatch || inputs.maxNodesPerRun || inputs.limit || 24;
  const requestedBatchesPerRun = inputs.maxBatchesPerRun || 6;
  const maxBatchesPerRun = Math.max(4, requestedBatchesPerRun);
  const graphPathIncludes = inputs.graphPathIncludes || [];
  const carryOverInputs = inputs.carryOverInputs || [];
  const batchTaskMode = inputs.batchTaskMode === true;
  const commentScanCommand = inputs.commentScanCommand || 'node graph/tools/validator/comment-scan.cjs graph';

  const discovered = await ctx.task(discoverGraphGapsTask, {
    graphRoot,
    graphPathIncludes,
    maxGapsPerBatch,
    maxBatchesPerRun,
    commentScanCommand,
    carryOverInputs,
  });

  const selected = Array.isArray(discovered.selectedGraphGaps) && discovered.selectedGraphGaps.length > 0
    ? discovered.selectedGraphGaps
    : (discovered.graphGaps || []);

  const batchResults = [];
  let processedCount = 0;
  const maxSelected = Math.min(selected.length, maxGapsPerBatch * maxBatchesPerRun);

  for (let batchIndex = 0; batchIndex < maxBatchesPerRun && processedCount < maxSelected; batchIndex += 1) {
    const batchGaps = selected.slice(processedCount, processedCount + maxGapsPerBatch);
    if (!batchGaps.length) break;

    let perGapResults = [];
    let batchResolution = null;

    if (batchTaskMode) {
      batchResolution = await ctx.task(resolveGraphGapBatchTask, {
        batchGaps,
        batchIndex,
        batchNumber: batchIndex + 1,
        dryRun,
        commentScanCommand,
      });
      perGapResults = batchResolution.perGapResults || [];
    } else {
      for (const graphGap of batchGaps) {
        const attempts = [];
        let research = null;
        let fulfillment = null;
        let verification = null;

        for (let attempt = 1; attempt <= maxGapIterations; attempt += 1) {
          research = await ctx.task(researchGraphGapTask, { graphGap, attempt, previousVerification: verification, batchIndex });
          fulfillment = await ctx.task(fulfillGraphGapTask, {
            graphGap,
            research,
            dryRun,
            attempt,
            batchIndex,
            commentScanCommand,
          });
          verification = await ctx.task(verifyGraphGapTask, {
            graphGap,
            research,
            fulfillment,
            attempt,
            batchIndex,
            commentScanCommand,
          });

          attempts.push({ attempt, research, fulfillment, verification });
          if (verification.status === 'ok' || verification.status === 'blocked') break;
        }

        perGapResults.push({
          graphGapId: graphGap.id,
          graphPathHint: graphGap.graphPathHint,
          attempts,
          research,
          fulfillment,
          verification,
        });
      }
    }

    const batchVerification = await ctx.task(verifyGraphGapBatchTask, {
      results: perGapResults,
      batchIndex,
      batchNumber: batchIndex + 1,
      commentScanCommand,
    });

    batchResults.push({
      batchIndex,
      batchNumber: batchIndex + 1,
      selectedCount: batchGaps.length,
      perGapResults,
      batchVerification,
    });

    processedCount += batchGaps.length;
    if (batchVerification.status !== 'ok') break;
  }

  const allBatchOk = batchResults.length > 0 && batchResults.every((batch) => batch.batchVerification && batch.batchVerification.status === 'ok');

  return {
    status: allBatchOk ? 'ok' : 'needs-review',
    graphRoot,
    dryRun,
    maxGapsPerBatch,
    maxBatchesPerRun,
    requestedBatchesPerRun,
    batchTaskMode,
    batchTaskModeDefault: false,
    selectedCount: selected.length,
    processedCount,
    remainingSelectedCount: Math.max(0, selected.length - processedCount),
    discovered,
    batchResults,
  };
};
