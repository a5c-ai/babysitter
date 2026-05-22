const { defineTask } = require('@a5c-ai/babysitter-sdk');

// Find graph attributes that are *implicit claims* about external systems but
// don\'t have an associated Claim record OR don\'t have a ClaimTest. Score
// them by volatility, centrality (graph fan-out), and risk. Add the
// highest-scoring ones to a backlog and hand off to
// `testable-claims-authoring` for test generation.
//
// Examples of attributes that should have testable claims but often don\'t:
//   - cliCommand (`claude`, `codex`, `cursor`) — vendors rename these
//   - sessionFilePathConvention — easy to break with a vendor refactor
//   - supportedMCPTransports — vendor may add/drop transports silently
//   - endpoints (provider URL paths) — versioned and occasionally moved
//   - hookSurfaces (`PreToolUse`, `PostToolUse`, …) — hook names rename
//   - tool names inside `tools:` arrays on ToolServer — MCP servers drift
//   - rate-limit header names — providers occasionally add/rename
//   - pricing fields — high-volatility, low test value (defer)
//   - model id strings — versions retire and ids change

const scanImplicitClaimsTask = defineTask('scan-implicit-claims', (args) => ({
  kind: 'agent',
  title: 'Scan the graph for attributes that should be testable claims',
  metadata: {
    graphRoot: args.graphRoot,
    instructions: [
      'Walk every YAML doc under graph/ and build an inventory of attributes that encode integration assumptions about external systems:',
      '  - AgentVersion: cliCommand, installMethods.',
      '  - AgentCoreImpl: transportClientLibrary, supportedTransportProtocols.',
      '  - AgentRuntimeImpl: internalSessionStateLocation, sessionFilePathConvention, sessionFileFormat, supportedMCPTransports, hookSockets, builtInTools.',
      '  - AgentPlatformImpl: nativeExtensionFormat, skillFormat, settingsFiles, pluginRegistryPath, supportedChannelKinds, marketplaceUrl.',
      '  - HookSurface: eventName, payloadSchema (a structural assertion).',
      '  - Provider: endpoints map, authMethods, rateLimitSignalingProtocol, vendorFeatures list.',
      '  - ToolServer: tools list, mcpTransports, sourceRef.',
      '  - ModelTransportProtocol: specVersion, specRevisions, streamingFraming.',
      '  - MCPTransport: specVersion, currentSpecRevision.',
      '  - ModelVersion: contextWindowTokens, modalities, modalityDirections, supportsExtendedThinking.',
      '  - InteractionPrimitive: surface, invocationToken (slash command literal), keyboardShortcut.',
      'Per attribute occurrence, derive an implicit-claim record: { sourceFile, nodeId, attribute, currentValue, externalSystem, evidenceSourceIds (if any) }.',
      'Cross-reference against existing Claim records (graph/catalog-meta/claims/). Mark each implicit claim as { hasExplicitClaim: bool, hasClaimTest: bool, claimStaleness: enum<fresh,stale,never-tested> }.',
      'Skip attributes that are intentionally non-testable: opinion-bearing free-text (description, notes), graph-internal taxonomy refs (domain/specialization/skill-area edges), and human-authored markdown.',
      'Return JSON: { implicitClaims: [...], stats: { totalImplicit, withExplicitClaim, withClaimTest, neverTested, staleTests } }.'
    ]
  }
}));

const scoreClaimsTask = defineTask('score-claims-for-priority', (args) => ({
  kind: 'agent',
  title: 'Score implicit claims by volatility × centrality × risk',
  metadata: {
    implicitClaims: args.implicitClaims,
    instructions: [
      'For each implicit claim, compute three sub-scores [0..1]:',
      '  - volatility: how often does the underlying external value change? Heuristic:',
      '      pricing fields = 0.9 (defer; live monitoring better than CI),',
      '      cliCommand / sessionFilePathConvention / hookSurface eventName = 0.7 (vendor refactors),',
      '      installMethods / endpoints (root only) = 0.4 (occasional moves),',
      '      contextWindowTokens / modalities = 0.3 (changes only with new model release),',
      '      MCP spec revision = 0.5 (annual cadence),',
      '      tool names inside official ToolServers = 0.6 (rapid evolution).',
      '  - centrality: graph fan-out — how many other records reference this attribute or the node carrying it? Count incoming edges + edges from records mentioning the value as a string. Normalize to [0..1] across the dataset.',
      '  - risk: silent-breakage cost. Heuristic:',
      '      session-state path errors break run resumption silently = 0.9,',
      '      transport protocol shape break causes runtime errors at first call = 0.8 (loud, less risk),',
      '      hook name renames break user-authored hooks silently = 0.9,',
      '      tool descriptor schema changes can cause silent over-refusal = 0.7.',
      '  Compute composite priority = 0.4*volatility + 0.3*centrality + 0.3*risk.',
      '  Snap to high (>=0.65), medium (>=0.4), low (<0.4).',
      'Return JSON: { scored: [...], topN: 30 highest-priority records }.'
    ]
  }
}));

const writeBacklogTask = defineTask('write-claim-backlog', (args) => ({
  kind: 'agent',
  title: 'Write a prioritized claim-coverage backlog into the graph',
  metadata: {
    scored: args.scored,
    instructions: [
      'For each scored implicit claim that lacks an explicit Claim or a ClaimTest, author a stub Claim record in graph/catalog-meta/claims/ with:',
      '  - id: claim:<nodeKindSlug>-<attributeSlug>-<short-hash>',
      '  - subjectKind, subjectId from the source record',
      '  - statement: a single-sentence assertion (e.g. "Claude Code writes session JSONL under ~/.claude/projects/<hash>/<uuid>.jsonl").',
      '  - confidence: high (already in graph as a fact)',
      '  - status: open',
      '  - evidenceStrength: adequate | thin (set per available source)',
      '  - claimedAt: today',
      '  - claimedBy: a5c-coverage-audit',
      '  - priority attribute (custom on this Claim variant): high|medium|low.',
      '  - testability attribute: testable-now | testable-with-fixture | vendor-fact | opinion.',
      '  - edges: about_subject (the source node), backed_by_evidence (link the existing source-ref or evidence record if any).',
      'For implicit claims that already have a Claim but no ClaimTest, just set/update the priority + testability attributes and DO NOT duplicate the Claim.',
      'When a high-priority implicit claim cannot be made concrete yet because required evidence or target graph shape is missing, record a graph carry-over task in the run/process result instead of writing placeholder graph data.',
      'Graph carry-over tasks should include targetNodeKind, targetIdHint or graphPathHint when known, requiredInformation, searchedSources, and nextAction; keep them outside graph.',
      'Compile a markdown backlog at wiki/agent-generate/claim-coverage/{date}.md grouped by priority bucket and external system, with for-action checklist and the list of recommended test specs (smallest possible test for each).',
      'Return JSON: { claimsAuthored, claimsAnnotated, carryOverTasks[], carryOverTaskIds[], backlogPath, topPrioritiesForAuthoring: [...] }.'
    ]
  }
}));

const handoffToAuthoringTask = defineTask('handoff-to-authoring', (args) => ({
  kind: 'agent',
  title: 'Hand off the highest-priority claims to testable-claims-authoring',
  metadata: {
    backlog: args.backlog,
    autoAuthor: args.autoAuthor,
    instructions: [
      'If autoAuthor is true: invoke .a5c/processes/testable-claims-authoring.cjs scoped to the top-N priority Claim ids from the backlog (pass via inputs.scope as a comma-separated id list).',
      'If autoAuthor is false: stop here — the backlog is the deliverable, and a human (or a follow-up babysit run) will trigger authoring.',
      'In either case, produce a one-paragraph executive summary citing: how many implicit claims were found, how many already had tests, how many were promoted to the priority backlog, and how many were auto-authored this run.',
      'Return JSON: { autoAuthor, authoringResult?, executiveSummary }.'
    ]
  }
}));

const verifyCoverageAuditTask = defineTask('verify-coverage-audit', (args) => ({
  kind: 'agent',
  title: 'Verify coverage audit produced clean, useful output',
  metadata: {
    backlog: args.backlog,
    handoff: args.handoff,
    checks: [
      'Validator: 0 structural, 0 dangling, 0 parse errors.',
      'If unresolved work remains, it is represented as process carry-over output with non-empty requiredInformation; no placeholder graph nodes, graph-build-history records, or process descriptor placeholders.',

      'Backlog markdown exists and is grouped by priority bucket.',
      'Every newly-authored stub Claim has about_subject + at least one of backed_by_evidence / sourced_from.',
      'No duplicate Claim records authored.',
      'No Trust Chain entries.',
      'If autoAuthor was true, the authoring sub-process reported status=ok.',
    ]
  }
}));

exports.process = async function process(inputs, ctx) {
  const graphRoot = inputs.graphRoot || 'graph';
  const autoAuthor = !!inputs.autoAuthor; // default off — backlog only

  const implicitClaims = await ctx.task(scanImplicitClaimsTask, { graphRoot });
  const scored = await ctx.task(scoreClaimsTask, { implicitClaims });
  const backlog = await ctx.task(writeBacklogTask, { scored });
  const handoff = await ctx.task(handoffToAuthoringTask, { backlog, autoAuthor });
  const verification = await ctx.task(verifyCoverageAuditTask, { backlog, handoff });

  return {
    status: verification.status === 'ok' ? 'ok' : 'needs-review',
    graphRoot,
    autoAuthor,
    implicitClaims,
    scored,
    backlog,
    handoff,
    verification,
  };
};
