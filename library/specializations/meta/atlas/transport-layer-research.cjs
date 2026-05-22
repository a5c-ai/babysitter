const { defineTask } = require('@a5c-ai/babysitter-sdk');

// Research-and-enrich Layer 3 (Transport): ModelTransportProtocol (the wire
// format), MCPTransport (Model Context Protocol transports), TransportProxy
// (interposers), HTTP server bindings, AgentHostTransport (host↔runtime
// transports). Targets: missing protocols, stale spec revisions, missing
// transport-client examples.

const discoverTransportGapsTask = defineTask('discover-transport-gaps', (args) => ({
  kind: 'agent',
  title: 'Inventory transport-layer records — find gaps',
  metadata: {
    graphRoot: args.graphRoot,
    instructions: [
      'List every ModelTransportProtocol, MCPTransport, TransportProxy, HTTPServerExtension, AgentHostTransport, transport-client under graph/compute/ and graph/agent-stack/.',
      'Identify gaps:',
      '  - ModelTransportProtocol: anthropic-messages, openai-chat-completions, openai-responses, openai-realtime, google-gemini-generate-content, google-vertex-rawpredict, bedrock-converse, bedrock-invoke-model, ollama-chat, llama-cpp-server-completion, vllm-openai-compat, mistral-chat, cohere-chat. Verify spec revision currency.',
      '  - MCPTransport: stdio, streamable-http, sse, websocket-non-standard. Verify against modelcontextprotocol.io/specification (current revision).',
      '  - TransportProxy: LiteLLM, Helicone, Portkey, OpenRouter (when used as proxy), Cloudflare AI Gateway, Langfuse (proxy mode).',
      '  - AgentHostTransport: stdio, http, ws, mcp-mediated, tcp, unix-socket — what host↔agent transports do popular runtimes use?',
      '  - transport-client examples: per AgentRuntimeImpl, the concrete client (anthropic-direct, openai-direct, bedrock, vertex, litellm-mediated).',
      'Per existing record, check spec freshness: docs.anthropic.com/en/api, platform.openai.com/docs/api-reference, ai.google.dev/api, docs.aws.amazon.com/bedrock/latest/APIReference/.',
      'Return JSON: { protocolsMissing, mcpTransportsStaleOrMissing, proxiesMissing, hostTransportsMissing, transportClientsMissing }.'
    ]
  }
}));

const researchTransportFactsTask = defineTask('research-transport-facts', (args) => ({
  kind: 'agent',
  title: 'Research transport facts from spec/API docs',
  metadata: {
    gaps: args.gaps,
    instructions: [
      'For each ModelTransportProtocol, fetch: spec URL, current spec revision, request envelope shape, response envelope shape, streaming framing (SSE event-name list, JSON-RPC framing, raw chunked), error envelope, auth header, rate-limit header convention, common kw args.',
      'For each MCPTransport, fetch: modelcontextprotocol.io/specification revision matrix, lifecycle (initialize→initialized→ready→shutdown), capability negotiation, notification model, reconnect policy, auth pattern.',
      'For each TransportProxy, fetch: github repo, displayName, supported upstream providers, what it adds (rate limit, audit, fallback, A/B testing, cost cap), config shape.',
      'For each transport-client, capture: which AgentRuntimeImpl uses it, base URL pattern, retry/backoff defaults, timeout defaults, header set, auth scheme.',
      'Per finding: source URL, retrievedAt, quote, confidence.',
      'Return JSON: { evidence, newProtocolsToAuthor, newMCPTransportsToAuthor, newProxiesToAuthor, newHostTransportsToAuthor, newTransportClientsToAuthor }.'
    ]
  }
}));

const enrichTransportGraphTask = defineTask('enrich-transport-graph', (args) => ({
  kind: 'agent',
  title: 'Apply transport research to graph',
  metadata: {
    evidence: args.evidence,
    instructions: [
      'Author new ModelTransportProtocol / MCPTransport / TransportProxy / AgentHostTransport / transport-client records.',
      'Wire realizes: layer:3-transport on each new protocol/transport/proxy.',
      'Wire speaks edges from ModelVersion / AgentCoreImpl / AgentRuntimeImpl to ModelTransportProtocol / MCPTransport.',
      'Wire connects from AgentRuntimeImpl to MCPTransport.',
      'Wire used_by from AgentHostTransport / ModelTransportProtocol / MCPTransport to AgentVersion / AgentRuntimeImpl / AgentPlatformImpl.',
      'Wire exposes from AgentRuntimeImpl/AgentPlatformImpl to AgentHostTransport.',
      'Per transport-client: wire uses_transport_client from the relevant AgentRuntimeImpl.',
      'Author Claim records for non-trivial attributes. No Trust Chain.',
      'When evidence is insufficient but the missing graph shape is known, return a graph carry-over task in the process output; do not write placeholder nodes or graph-build-history records.',
      'Graph carry-over tasks should include targetNodeKind, targetIdHint or graphPathHint when known, requiredInformation, searchedSources, and nextAction; keep them outside graph.',
      'Do not add placeholder records under graph; unresolved work belongs in run/process carry-over output outside the active graph.',
      'Include carryOverTasks[] and carryOverTaskIds[] in the task result whenever unresolved work remains.',
      'Validate after each batch.',
      'If gaps remain after editing, return remainingGaps with exact unresolved ids. If evidence is insufficient, return status=blocked and blockedEvidence with source locations to check next.',
      'Return JSON: { filesEdited, filesCreated, protocolsAdded, mcpTransportsAdded, proxiesAdded, hostTransportsAdded, transportClientsAdded, claimsAdded, remainingGaps[], blockedEvidence[], carryOverTasks[], carryOverTaskIds[], validatorState }.'
    ]
  }
}));

const verifyTransportEnrichmentTask = defineTask('verify-transport-enrichment', (args) => ({
  kind: 'agent',
  title: 'Verify transport-layer enrichment',
  metadata: {
    enrichmentResult: args.enrichmentResult,
    checks: [
      'Validator: 0 structural, 0 dangling, 0 parse errors.',
      'If unresolved work remains, it is represented as process carry-over output with non-empty requiredInformation; no placeholder graph nodes, graph-build-history records, or process descriptor placeholders.',

      'If this verification is not ok, return remainingGaps[] so the process can iterate, or status=blocked with blockedEvidence[] when facts cannot be resolved safely.',
      'Every new ModelTransportProtocol / MCPTransport / TransportProxy realizes layer:3-transport.',
      'Every new ModelTransportProtocol has at least one inbound speaks edge.',
      'Every new MCPTransport has at least one inbound connects edge.',
      'Every new transport-client has uses_transport_client inbound from a runtime.',
      'No Trust Chain entries.',
    ]
  }
}));

exports.process = async function process(inputs, ctx) {
  const graphRoot = inputs.graphRoot || 'graph';
  const maxGapIterations = inputs.maxGapIterations || 3;
  const initialGaps = await ctx.task(discoverTransportGapsTask, { graphRoot });

  const attempts = [];
  let currentGaps = initialGaps;
  let verification = null;
  let enrichmentResult = null;

  for (let attempt = 1; attempt <= maxGapIterations; attempt += 1) {
    const evidence = await ctx.task(researchTransportFactsTask, {
      gaps: currentGaps,
      attempt,
      previousVerification: verification,
    });
    enrichmentResult = await ctx.task(enrichTransportGraphTask, {
      evidence: evidence,
      gaps: currentGaps,
      attempt,
    });
    verification = await ctx.task(verifyTransportEnrichmentTask, {
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
