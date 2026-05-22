const { defineTask } = require('@a5c-ai/babysitter-sdk');

const discoverProductsTask = defineTask('discover-agent-products', (args) => ({
  kind: 'agent',
  title: 'Enumerate every AgentProduct in the catalog',
  metadata: {
    graphRoot: args.graphRoot,
    instructions: [
      'Scan graph/agent-stack/products/ and list only supported AgentProduct records: supportTier must be catalog-backed or adapter-only; exclude supportTier=none.',
      `For each supported product enumerate only canonical AgentVersions declared by that product's has_version edge; do not include sibling/variant AgentVersion files that are not linked by has_version.`,
      'Compute expected implementation layers from stackScope/productKind, not from a hard-coded full-agent assumption:',
      '  - full: AgentCoreImpl, AgentRuntimeImpl, AgentPlatformImpl, AgentUIImpl.',
      '  - core-runtime-platform: AgentCoreImpl, AgentRuntimeImpl, AgentPlatformImpl; UI absence is intentional.',
      '  - core-runtime or sdk: AgentCoreImpl, AgentRuntimeImpl; platform/UI absence is intentional unless already modeled.',
      '  - core-only: AgentCoreImpl only.',
      'For each supported canonical product/version, summarize graph completeness against only those expected layers.',
      'Return a JSON list of { productId, versionId, supportTier, stackScope, productKind, expectedImplLayers[], missingImplLayers[], stubness: rich|partial|stub, evidence: { vendorDocs?: url, repo?: url, releaseNotes?: url } }.'
    ]
  }
}));

const researchOneProductTask = defineTask('research-one-agent-product', (args) => ({
  kind: 'agent',
  title: `Research ${args.productId} — gather online evidence`,
  metadata: {
    productId: args.productId,
    versionId: args.versionId,
    missingImplLayers: args.missingImplLayers,
    instructions: [
      `Research the agent product ${args.productId} comprehensively.`,
      'Sources to mine: official vendor docs, GitHub repo (README, src/, docs/, CHANGELOG, releases), release-note blog posts, conference talks, third-party reverse-engineering writeups (e.g. for Cursor/Devin/Warp where source is closed), leaked source caches (claude-code-leaks-style) where they exist, MCP spec compliance pages, the vendor product\'s own SDK docs.',
      'Per layer, produce evidence-bound findings:',
      '  - AgentCoreImpl: loopIteratorPolicy, contextManagementStrategy, subagentInvokerPolicy, resultSynthesisPolicy, stopDetectionStrategy, transportClientLibrary, supportedTransportProtocols, parallelToolCallHandling, streamingFidelity, thinkingChannelHandling.',
      '  - AgentRuntimeImpl: builtInTools, toolRegistryDiscovery, hookSockets (PreToolUse/PostToolUse/etc. + their fire-points), internalSessionStateLocation, sessionFileFormat, sessionFilePathConvention, approvalGatingPrimitive, subprocessSandboxStrategy, runtimeIdentity, supportedMCPTransports, supportsStreaming.',
      '  - AgentPlatformImpl: nativeExtensionFormat, skillFormat, settingsFiles, capabilityProfileRegistry presence, launchConfigRegistry presence, platformIdentityStrategy, updateChannelMechanism, supportedChannelKinds.',
      '  - AgentUIImpl: uiKind, presentationsBundled, themeSupport, accessibilitySupport, supports_interaction_primitive list (slash commands, model picker, command palette, etc.).',
      'For each finding, attach: source URL, retrieval date, a one-line direct quote or paraphrase, and a confidence enum<high,medium,low>.',
      'Before editing, scan the target graph files for existing TODO/Source/comments. Do not delete or strip those comments unless the information is first represented as graph data: EvidenceSource + Claim for sourced facts, or run/process carry-over for unresolved work.',
      'Also research news from the past 6 months: feature releases, deprecations, capability changes, bench results.',
      `Cross-reference: claude-code (Anthropic), codex (OpenAI), cursor (Anysphere), opencode (sst), gemini-cli (Google), copilot-cli (GitHub), amp (Sourcegraph), droid (Factory), hermes (Hermes Labs), qwen (Alibaba), openclaw (open source), omp (open source), pi (Badlogic), aider, devin (Cognition), warp, windsurf (Codeium), zed, openhands (All-Hands), continue, cline, bolt, lovable, replit-agent, v0, roo-code, goose (Block).`,
      'Return a JSON evidence pack: { productId, evidence: [{ layer, attribute, value, source, retrievedAt, quote, confidence }], proposedEdges: [{ from, edgeKind, to, attributes? }], openQuestions: [string] }.'
    ]
  }
}));

const enrichProductGraphTask = defineTask('enrich-product-graph', (args) => ({
  kind: 'agent',
  title: `Apply ${args.productId} research findings to the graph`,
  metadata: {
    productId: args.productId,
    evidencePack: args.evidencePack,
    instructions: [
      'Translate the research evidence pack into concrete YAML edits on graph/.',
      'Lossless comment migration is mandatory: any removed TODO, Source, source URL, placeholder, or confirm/verify comment must be represented in graph data in the same change. Use EvidenceSource + Claim for resolved sourced facts; keep unresolved facts as run/process carry-over tasks outside graph. Never merely delete TODO/source comments for cleanliness.',
      'Per missing layer, author or update the AgentCoreImpl/AgentRuntimeImpl/AgentPlatformImpl/AgentUIImpl record with schema-required attributes filled in from evidence.',
      'Add capabilities (supports edges) with versionRange and level per V-3.1.',
      'Add hooks (HookSurface) and wire via exposes from AgentRuntimeImpl.',
      'Add MCPTransport / ModelTransportProtocol if a new wire format was discovered, and wire speaks/connects.',
      'Add InteractionPrimitives the product exposes and wire supports_interaction_primitive on AgentUIImpl.',
      'For products with a documented sandbox, author Sandbox + wire enforces_invariant if relevant.',
      'For closed-source products where details are scarce: prefer fewer attributes with high confidence over speculative attribute fills. If a required layer cannot be filled, return blocked with the exact missing evidence.',
      'Author Claim records with backed_by_evidence for every non-trivial inferred attribute (Trust Chain entries OUT OF SCOPE per project policy — use catalog-meta Claim, not trust-chain Attestation).',
      'When evidence is insufficient but the missing graph shape is known, return a graph carry-over task in the process output; do not write placeholder nodes or graph-build-history records.',
      'If a source comment identifies a URL but the target attribute cannot be safely mapped, preserve the comment and return a carry-over task with graphPathHint, targetIdHint when known, requiredInformation, searchedSources, and nextAction.',
      'Graph carry-over tasks should include targetNodeKind, targetIdHint or graphPathHint when known, requiredInformation, searchedSources, and nextAction; keep them outside graph.',
      'Do not add placeholder records under graph; unresolved work belongs in run/process carry-over output outside the active graph.',
      'Include carryOverTasks[] and carryOverTaskIds[] in the task result whenever unresolved work remains.',
      'After every edit, run the validator and fix any V-1.x / V-3.x failures introduced.',
      'This task is expected to edit the graph when missingImplLayers is non-empty and evidence is sufficient; no-edit is valid only when no expected layer gap exists or evidence is blocked.',
      'Return a JSON summary: { productId, filesEdited[], filesCreated[], edgesAdded, capabilitiesAdded, claimsAdded, remainingGaps[], blockedEvidence[], carryOverTasks[], carryOverTaskIds[], validatorState }.'
    ]
  }
}));

const verifyProductEnrichmentTask = defineTask('verify-product-enrichment', (args) => ({
  kind: 'agent',
  title: `Verify ${args.productId} enrichment quality`,
  metadata: {
    productId: args.productId,
    enrichmentResult: args.enrichmentResult,
    checks: [
      'Validator: 0 structural, 0 dangling, 0 parse errors after the enrichment.',
      'No TODO/Source/comment information was lost: every removed source/TODO/placeholder comment is either still present or represented by EvidenceSource, Claim, or run/process carry-over entries.',
      'If unresolved work remains, it is represented as process carry-over output with non-empty requiredInformation; no placeholder graph nodes, graph-build-history records, or process descriptor placeholders.',
      'agent-stack-audit.py or an equivalent graph query shows the product has all expected impl layers wired for its stackScope/productKind.',
      'Every new capability supports edge has versionRange.',
      'Every new attribute that came from research is paired with a Claim citing the source URL + retrievedAt.',
      'No Trust Chain entries.',
      'No graph-build-history filenames or scratch suffixes.',
      'Generated content is encyclopedic and source-cited, not narrative or speculative.',
    ]
  }
}));

exports.process = async function process(inputs, ctx) {
  const graphRoot = inputs.graphRoot || 'graph';
  const productList = await ctx.task(discoverProductsTask, { graphRoot });

  const targets = (inputs.productIds && inputs.productIds.length)
    ? productList.filter((p) => inputs.productIds.includes(p.productId))
    : productList;

  const maxGapIterations = inputs.maxGapIterations || 3;
  const perProductResults = [];
  for (const product of targets) {
    const attempts = [];
    let missingImplLayers = product.missingImplLayers || [];
    let verification = null;

    for (let attempt = 1; attempt <= maxGapIterations; attempt += 1) {
      const evidencePack = await ctx.task(researchOneProductTask, {
        productId: product.productId,
        versionId: product.versionId,
        missingImplLayers,
        expectedImplLayers: product.expectedImplLayers,
        attempt,
        previousVerification: verification,
      });
      const enrichmentResult = await ctx.task(enrichProductGraphTask, {
        productId: product.productId,
        evidencePack,
        expectedImplLayers: product.expectedImplLayers,
        attempt,
      });
      verification = await ctx.task(verifyProductEnrichmentTask, {
        productId: product.productId,
        enrichmentResult,
        expectedImplLayers: product.expectedImplLayers,
        attempt,
      });
      attempts.push({ attempt, evidencePack, enrichmentResult, verification });

      missingImplLayers = verification.missingImplLayers || verification.checks?.missingImplLayers || enrichmentResult.remainingGaps || [];
      if (verification.status === 'ok') break;
      if (verification.status === 'blocked') break;
    }

    perProductResults.push({
      productId: product.productId,
      expectedImplLayers: product.expectedImplLayers,
      attempts,
      verification,
    });
  }

  return {
    status: perProductResults.every((r) => r.verification && r.verification.status === 'ok') ? 'ok' : 'needs-review',
    graphRoot,
    productCount: targets.length,
    perProductResults,
  };
};
