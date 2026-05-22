const { defineTask } = require('@a5c-ai/babysitter-sdk');

// Research-and-enrich Layer 2 (Provider) of the global stack: hosted-inference
// vendors (Anthropic, OpenAI, Google, AWS Bedrock, Azure OpenAI, GCP Vertex,
// self-hosted, etc.). Per-provider auth, rate limits, regions, pricing tiers,
// SLA, vendor-specific features (Batch API, prompt caching, files API, etc.).
// Also covers ModelTransportProtocol (Layer 3 wire format) when the protocol
// is provider-specific.

const discoverProviderGapsTask = defineTask('discover-provider-gaps', (args) => ({
  kind: 'agent',
  title: 'Inventory Providers and identify gaps',
  metadata: {
    graphRoot: args.graphRoot,
    instructions: [
      'List every Provider in graph/compute/providers/.',
      'For each provider, check schema-required + commonly-populated attrs: authMethods, endpoints, pricing, pricingTiers, rateLimitSignalingProtocol, dataResidencyOptions, vendorFeatures (capability list), slaTier, regions.',
      'Identify: providers missing in the catalog (e.g. Cerebras, Groq variants, Novita, OpenRouter, Hyperbolic if not present, Replicate, Together AI, Fireworks AI, Perplexity Sonar API, DeepSeek API, xAI Grok API, Mistral La Plateforme).',
      'Identify stale facts: pricing changes, deprecated endpoints, new regions, new vendor features (e.g. message-batches, prompt caching, files-api, prediction-grounding, structured-outputs).',
      'Also enumerate ModelTransportProtocol records and identify provider-specific protocols (e.g. anthropic-messages, openai-responses, openai-chat-completions, google-gemini-generate-content, bedrock-converse, vertex-rawpredict).',
      'Return JSON: { providersMissing[], providersWithStaleAttrs[], providersWithMissingFeatures[], transportProtocolsMissing[] }.'
    ]
  }
}));

const researchProviderFactsTask = defineTask('research-provider-facts', (args) => ({
  kind: 'agent',
  title: 'Research provider facts from vendor pricing/auth/limits pages',
  metadata: {
    gaps: args.gaps,
    instructions: [
      'For each provider gap, mine the canonical vendor source.',
      'Pricing pages: anthropic.com/pricing, openai.com/api/pricing, ai.google.dev/pricing, aws.amazon.com/bedrock/pricing.',
      'Auth/rate-limit docs: each provider\'s API reference docs (rate-limit headers, 429 envelopes, retry-after policies).',
      'Region docs: data-residency pages.',
      'SLA docs: legal/SLA pages where published; many providers have no public SLA (record that fact).',
      'Vendor-feature docs: enumerate each provider\'s flagship API features (Batch API, prompt caching, files API, function-calling, json-mode, structured-outputs, vision, audio, computer-use).',
      'Per finding: { providerId, attribute, value, source, retrievedAt, quote, confidence }.',
      'Also check transport-protocol facts: spec URLs, current spec revision, streaming framing (SSE vs JSON-RPC), connection lifecycle, capability negotiation, reconnect policy, authentication.',
      'Return JSON: { evidence, newProvidersToAuthor, newTransportProtocolsToAuthor, newCapabilitiesToWire }.'
    ]
  }
}));

const enrichProviderGraphTask = defineTask('enrich-provider-graph', (args) => ({
  kind: 'agent',
  title: 'Apply provider research to graph',
  metadata: {
    evidence: args.evidence,
    instructions: [
      'Author missing Provider records under graph/compute/providers/.',
      'Update existing records with newly-evidenced attributes.',
      'Wire realizes: layer:2-provider on every new record.',
      'Wire serves edges to the ModelVersions each Provider hosts.',
      'For new transport protocols, author ModelTransportProtocol records under graph/compute/model-transport-protocols/ with realizes: layer:3-transport.',
      'Wire supports edges from Provider to capability:supports-batch-api / supports-prompt-caching / supports-files-api / model-discovery / token-counting where the vendor docs claim the feature. Always include versionRange (use a calendar date like "\'>=2024-01-01\'" if no semver exists).',
      'Author Claim records for non-trivial inferred attributes.',
      'When evidence is insufficient but the missing graph shape is known, return a graph carry-over task in the process output; do not write placeholder nodes or graph-build-history records.',
      'Graph carry-over tasks should include targetNodeKind, targetIdHint or graphPathHint when known, requiredInformation, searchedSources, and nextAction; keep them outside graph.',
      'Do not add placeholder records under graph; unresolved work belongs in run/process carry-over output outside the active graph.',
      'Include carryOverTasks[] and carryOverTaskIds[] in the task result whenever unresolved work remains.',
      'Run validator after each batch.',
      'If gaps remain after editing, return remainingGaps with exact unresolved ids. If evidence is insufficient, return status=blocked and blockedEvidence with source locations to check next.',
      'Return JSON: { filesEdited, filesCreated, providersAdded, providersUpdated, transportsAdded, capabilitiesWired, claimsAdded, remainingGaps[], blockedEvidence[], validatorState }.'
    ]
  }
}));

const verifyProviderEnrichmentTask = defineTask('verify-provider-enrichment', (args) => ({
  kind: 'agent',
  title: 'Verify provider-layer enrichment',
  metadata: {
    enrichmentResult: args.enrichmentResult,
    checks: [
      'Validator: 0 structural, 0 dangling, 0 parse errors.',
      'If unresolved work remains, it is represented as process carry-over output with non-empty requiredInformation; no placeholder graph nodes, graph-build-history records, or process descriptor placeholders.',

      'If this verification is not ok, return remainingGaps[] so the process can iterate, or status=blocked with blockedEvidence[] when facts cannot be resolved safely.',
      'Every Provider has authMethods, endpoints, regions populated.',
      'Every supports edge has versionRange.',
      'Every new Provider serves at least one ModelVersion (no orphan Providers).',
      'Pricing values, where present, are sourced and dated.',
      'No Trust Chain entries.',
    ]
  }
}));

exports.process = async function process(inputs, ctx) {
  const graphRoot = inputs.graphRoot || 'graph';
  const maxGapIterations = inputs.maxGapIterations || 3;
  const initialGaps = await ctx.task(discoverProviderGapsTask, { graphRoot });

  const attempts = [];
  let currentGaps = initialGaps;
  let verification = null;
  let enrichmentResult = null;

  for (let attempt = 1; attempt <= maxGapIterations; attempt += 1) {
    const evidence = await ctx.task(researchProviderFactsTask, {
      gaps: currentGaps,
      attempt,
      previousVerification: verification,
    });
    enrichmentResult = await ctx.task(enrichProviderGraphTask, {
      evidence: evidence,
      gaps: currentGaps,
      attempt,
    });
    verification = await ctx.task(verifyProviderEnrichmentTask, {
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
