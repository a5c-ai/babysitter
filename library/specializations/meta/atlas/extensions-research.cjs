const { defineTask } = require('@a5c-ai/babysitter-sdk');

// Research-and-enrich the extensions cluster: Tools, Skills, Plugins,
// Subagents, ToolServers (MCP), ExtensionInterfaces. Cross-cuts across
// Layers 5–6 (Agent-Runtime / Agent-Platform). Targets: missing canonical
// tools, new MCP servers in the registry, new skill packs published by
// Anthropic / community, new plugin marketplaces, missing subagent personas.

const discoverExtensionGapsTask = defineTask('discover-extension-gaps', (args) => ({
  kind: 'agent',
  title: 'Inventory extensions cluster — find gaps',
  metadata: {
    graphRoot: args.graphRoot,
    instructions: [
      'List every Tool, Skill, Plugin, Subagent, ToolServer, ToolDescriptor, and ExtensionInterface under graph/extensions/ and graph/domain/tools/.',
      'For each ToolServer (MCP server), check: protocol, mcpTransports, tools list, sourceRef, exposes_resource/exposes_prompt/exposes_root/exposes_sampling edges.',
      'Identify gaps:',
      '  - Tools: dev tools missing from the catalog (consult tool-rankings, brew/apt formulae, github trending).',
      '  - Skills: official Anthropic skills (docs.anthropic.com/en/docs/agents-and-tools/skills) — pdf-handling, docx-handling, xlsx-handling, pptx-handling, etc. — verify all are catalogued. Plus a5c skills, claude-code plugin skills.',
      '  - Plugins: claude-code plugin marketplaces (anthropic-curated, community), cursor extension store, codex Skills, copilot extensions.',
      '  - Subagents: claude-code curated subagents (agents/), vendor-published persona definitions, the babysitter agent stack.',
      '  - ToolServers: scan modelcontextprotocol.io/servers and the github.com/modelcontextprotocol/servers registry for new entries.',
      '  - ExtensionInterfaces: are the canonical interfaces (governance, reliability, reflection, orchestration, identity, secrets, memory, telemetry, sleep-cycle, compression) all wired to at least one impl?',
      'Return JSON: { toolsMissing, skillsMissing, pluginsMissing, subagentsMissing, toolServersMissing, extensionInterfaceImplementersMissing, toolDescriptorsMissingSchema }.'
    ]
  }
}));

const researchExtensionsTask = defineTask('research-extensions', (args) => ({
  kind: 'agent',
  title: 'Research extension catalog from vendor + community sources',
  metadata: {
    gaps: args.gaps,
    instructions: [
      'Tools: cross-reference brew formulae, apt packages, github trending, awesome-* lists. Per tool: displayName, kind enum, description, belongs_to_language if applicable, implements_stack_part if it\'s a managed-service implementation.',
      'Skills: vendor docs + plugin repos. Per skill: displayName, kind, invocationMode, entrypoint, domains, requiresLanguages/Frameworks, addresses (skill-area).',
      'Plugins: marketplace registries (claude plugins, cursor extensions, etc.). Per plugin: displayName, vendor, installFormats, contains_skill/contains_subagent/contains_tool_server/contains_lsp_server/contains_monitor/contains_bin/ships_settings, applies_to (specialization), requires_capability.',
      'Subagents: persona docs + system prompt examples. Per subagent: displayName, role, modelPreference, allowedTools, hasReadOnlyContext, systemPromptShape.',
      'ToolServers: modelcontextprotocol.io/servers, github.com/modelcontextprotocol/servers, vendor MCP catalogs (Anthropic\'s built-in connectors, Cursor\'s curated MCP list). Per server: displayName, protocol=mcp, mcpTransports (stdio/streamable-http/sse), tools (descriptor list), exposes_resource/prompt/root/sampling, requires_capability:supports-mcp, sourced_from.',
      'ExtensionInterfaces: research what each interface (governance/reliability/etc.) means semantically; ensure at least one Skill/Plugin/Subagent/ToolServer implements each.',
      'For every artifact returned, include: source URL, retrievedAt, evidence quote, confidence.',
      'Return JSON: { evidence, newToolsToAuthor, newSkillsToAuthor, newPluginsToAuthor, newSubagentsToAuthor, newToolServersToAuthor, newToolDescriptorsToAuthor }.'
    ]
  }
}));

const enrichExtensionsGraphTask = defineTask('enrich-extensions-graph', (args) => ({
  kind: 'agent',
  title: 'Apply extension research to graph',
  metadata: {
    evidence: args.evidence,
    instructions: [
      'Author new Tool / Skill / Plugin / Subagent / ToolServer / ToolDescriptor records under graph/.',
      'Per Skill: wire applies_to Domain, addresses SkillArea, implements ExtensionInterface, sourced_from SourceRef.',
      'Per ToolServer: wire implements ExtensionInterface, requires_capability:supports-mcp (level: required), exposes_resource/prompt/root/sampling, sourced_from.',
      'Per Plugin: wire installs_into AgentProduct (with installMethod attr), contains_skill/subagent/tool_server/lsp_server/monitor/bin/ships_settings, compiles_to AgentVersion, implements ExtensionInterface, requires_capability, applies_to specialization.',
      'Per Subagent: wire roles_played_by Role, requires_capability, requires_skill, contained_in_plugin if applicable.',
      'Per Tool: wire belongs_to_language Language, implements_stack_part StackPart if it implements one, used_for SkillArea.',
      'Author Claim records for inferred attributes; cite vendor docs / repo READMEs / marketplace pages.',
      'When evidence is insufficient but the missing graph shape is known, return a graph carry-over task in the process output; do not write placeholder nodes or graph-build-history records.',
      'Graph carry-over tasks should include targetNodeKind, targetIdHint or graphPathHint when known, requiredInformation, searchedSources, and nextAction; keep them outside graph.',
      'Do not add placeholder records under graph; unresolved work belongs in run/process carry-over output outside the active graph.',
      'Include carryOverTasks[] and carryOverTaskIds[] in the task result whenever unresolved work remains.',
      'Run validator after each batch; fix V-1.x type/enum errors.',
      'Return JSON: { filesEdited, filesCreated, toolsAdded, skillsAdded, pluginsAdded, subagentsAdded, toolServersAdded, toolDescriptorsAdded, remainingGaps[], blockedEvidence[], validatorState }.'
    ]
  }
}));

const verifyExtensionEnrichmentTask = defineTask('verify-extension-enrichment', (args) => ({
  kind: 'agent',
  title: 'Verify extensions-cluster enrichment',
  metadata: {
    enrichmentResult: args.enrichmentResult,
    checks: [
      'Validator: 0 structural, 0 dangling, 0 parse errors.',
      'If unresolved work remains, it is represented as process carry-over output with non-empty requiredInformation; no placeholder graph nodes, graph-build-history records, or process descriptor placeholders.',

      'If this verification is not ok, return remainingGaps[] so the process can iterate, or status=blocked with blockedEvidence[] when facts cannot be resolved safely.',
      'No new orphan extensions records (every Skill/Plugin/Subagent/ToolServer has at least one outbound or inbound edge to a real instance).',
      'Every ExtensionInterface has at least one implementer.',
      'Every ToolServer authored has tools list, mcpTransports, sourceRef, requires_capability:supports-mcp.',
      'Every Plugin has installs_into AgentProduct.',
      'No Trust Chain entries.',
    ]
  }
}));

exports.process = async function process(inputs, ctx) {
  const graphRoot = inputs.graphRoot || 'graph';
  const maxGapIterations = inputs.maxGapIterations || 3;
  const initialGaps = await ctx.task(discoverExtensionGapsTask, { graphRoot });

  const attempts = [];
  let currentGaps = initialGaps;
  let verification = null;
  let enrichmentResult = null;

  for (let attempt = 1; attempt <= maxGapIterations; attempt += 1) {
    const evidence = await ctx.task(researchExtensionsTask, {
      gaps: currentGaps,
      attempt,
      previousVerification: verification,
    });
    enrichmentResult = await ctx.task(enrichExtensionsGraphTask, {
      evidence: evidence,
      gaps: currentGaps,
      attempt,
    });
    verification = await ctx.task(verifyExtensionEnrichmentTask, {
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
