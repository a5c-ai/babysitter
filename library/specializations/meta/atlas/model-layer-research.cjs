const { defineTask } = require('@a5c-ai/babysitter-sdk');

// Research-and-enrich Layer 1 (Model) of the global stack: ModelFamily,
// ModelVersion, and the modality/context/cost/safety facts that drive every
// downstream layer. Targets gaps in the current catalog: missing model
// versions, stale capabilities, missing modality directions, missing
// thinking/streaming/extended-thinking flags, missing eval-result rows.

const discoverModelGapsTask = defineTask('discover-model-gaps', (args) => ({
  kind: 'agent',
  title: 'Inventory ModelFamily and ModelVersion records — find gaps',
  metadata: {
    graphRoot: args.graphRoot,
    instructions: [
      'List every ModelFamily and ModelVersion in graph/compute/model-families/ and graph/compute/models/.',
      'For each family, check: most recent version covered? known successors missing? deprecated versions still appearing?',
      'For each version, check schema-required + commonly-populated attrs: contextWindowTokens, costPerMTokInput/Output, modalities, modalityDirections, supportsExtendedThinking/AdaptiveThinking/ThinkingBudgetTokens, releaseDate, lifecycleStatus, knowledgeCutoffDate, safetyTier, modelCardUrl, supportsFineTuning, regions.',
      'Cross-reference against vendor frontier-model release pages: anthropic.com/news, openai.com/news, ai.google.dev (Gemini), aws.amazon.com/bedrock/, deepmind.google, mistral.ai/news, together.ai/blog, qwenlm.github.io, deepseek.com.',
      'Identify missing: { Anthropic: claude-sonnet-4-5/4-6/4-7/haiku-4-5/opus-3 — verify all current; check for new minor releases }, { OpenAI: gpt-5 family + reasoning series + embeddings + realtime + codex-mini }, { Google: gemini-2-5-pro/flash + 3.0 if released }, { Meta: llama-4 family + variants }, { Mistral: medium/large/codestral updates }, { DeepSeek: v3 + r1 + coder }, { Alibaba: qwen-2.5 + qwen-3 }.',
      'Also check for missing eval-result rows: every new ModelVersion should have at least one eval-result on a canonical benchmark (mmlu, gpqa, swebench, humaneval, etc.).',
      'Return JSON: { familiesNeedingNewVersions[], versionsMissingAttrs[], versionsWithStaleAttrs[], missingEvalResults[], newFrontierModelsToAuthor[] }.'
    ]
  }
}));

const researchModelGapsTask = defineTask('research-model-gaps', (args) => ({
  kind: 'agent',
  title: 'Research model facts from vendor sources',
  metadata: {
    gaps: args.gaps,
    instructions: [
      'For each model gap, research the vendor source of truth.',
      'Anthropic: docs.anthropic.com/en/docs/about-claude/models, the Models API /v1/models endpoint, model cards under www.anthropic.com/claude/.',
      'OpenAI: platform.openai.com/docs/models, model cards under openai.com/research, deprecations page.',
      'Google: ai.google.dev/gemini-api/docs/models, Vertex AI model catalog, deepmind.google blog.',
      'Bedrock: docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html.',
      'Open weights (Meta/Mistral/DeepSeek/Qwen): HuggingFace model cards + arxiv papers.',
      'Per gap, return: { modelId, attribute, value, source, retrievedAt, quote, confidence }.',
      'For new models not yet in the catalog, return enough to author a complete ModelVersion record.',
      'For eval-result gaps, harvest the score from the official model card if reported, otherwise from the benchmark leaderboard.',
      'Return JSON: { evidence: [...], newModelsToAuthor: [{ familyId, versionId, attrs }], newEvalResults: [{ modelId, benchmarkId, score, metric, source }] }.'
    ]
  }
}));

const enrichModelGraphTask = defineTask('enrich-model-graph', (args) => ({
  kind: 'agent',
  title: 'Apply model research to the graph',
  metadata: {
    evidence: args.evidence,
    instructions: [
      'Author missing ModelFamily/ModelVersion records under graph/compute/.',
      'Update existing records with newly-evidenced attributes; never overwrite without a Claim citing the new source.',
      'Wire realizes: layer:1-model on every new record.',
      'Wire served_by edges to existing Provider records.',
      'Wire speaks edges to ModelTransportProtocol where the wire format is documented.',
      'Add eval-result records under graph/benchmarks/eval-results/ with belongs_to_eval_run + scored_against edges.',
      'For every authored attribute that came from research, author a Claim under graph/catalog-meta/claims/ with backed_by_evidence.',
      'When evidence is insufficient but the missing graph shape is known, return a graph carry-over task in the process output; do not write placeholder nodes or graph-build-history records.',
      'Graph carry-over tasks should include targetNodeKind, targetIdHint or graphPathHint when known, requiredInformation, searchedSources, and nextAction; keep them outside graph.',
      'Do not add placeholder records under graph; unresolved work belongs in run/process carry-over output outside the active graph.',
      'Include carryOverTasks[] and carryOverTaskIds[] in the task result whenever unresolved work remains.',
      'Run the validator after each batch of edits; fix V-1.x type/enum errors immediately.',
      'Return JSON: { filesEdited, filesCreated, modelsAdded, modelsUpdated, evalResultsAdded, claimsAdded, remainingGaps[], blockedEvidence[], validatorState }.'
    ]
  }
}));

const verifyModelEnrichmentTask = defineTask('verify-model-enrichment', (args) => ({
  kind: 'agent',
  title: 'Verify model-layer enrichment',
  metadata: {
    enrichmentResult: args.enrichmentResult,
    checks: [
      'Validator: 0 structural, 0 dangling, 0 parse errors.',
      'If unresolved work remains, it is represented as process carry-over output with non-empty requiredInformation; no placeholder graph nodes, graph-build-history records, or process descriptor placeholders.',

      'If this verification is not ok, return remainingGaps[] so the process can iterate, or status=blocked with blockedEvidence[] when facts cannot be resolved safely.',
      'Every ModelVersion has costPerMTokInput, costPerMTokOutput, contextWindowTokens, modalities populated.',
      'Every new ModelVersion has at least one served_by edge to an existing Provider.',
      'Every claim references a real evidence record and a fetchable URL.',
      'No Trust Chain attestations introduced.',
    ]
  }
}));

exports.process = async function process(inputs, ctx) {
  const graphRoot = inputs.graphRoot || 'graph';
  const maxGapIterations = inputs.maxGapIterations || 3;
  const initialGaps = await ctx.task(discoverModelGapsTask, { graphRoot });

  const attempts = [];
  let currentGaps = initialGaps;
  let verification = null;
  let enrichmentResult = null;

  for (let attempt = 1; attempt <= maxGapIterations; attempt += 1) {
    const evidence = await ctx.task(researchModelGapsTask, {
      gaps: currentGaps,
      attempt,
      previousVerification: verification,
    });
    enrichmentResult = await ctx.task(enrichModelGraphTask, {
      evidence: evidence,
      gaps: currentGaps,
      attempt,
    });
    verification = await ctx.task(verifyModelEnrichmentTask, {
      enrichmentResult: enrichmentResult,
      gaps: currentGaps,
      attempt,
    });

    attempts.push({
      attempt,
      gaps: currentGaps,
      evidence: evidence,
      enrichmentResult: enrichmentResult,
      verification,
    });

    if (verification.status === 'ok') break;
    if (verification.status === 'blocked') break;

    currentGaps = verification.remainingGaps || verification.gaps || enrichmentResult.remainingGaps || currentGaps;
  }

  return {
    status: verification && verification.status === 'ok' ? 'ok' : 'needs-review',
    graphRoot,
    gaps: currentGaps,
    initialGaps,
    attempts,
    enrichmentResult: enrichmentResult,
    verification,
  };
};
