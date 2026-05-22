const { defineTask } = require('@a5c-ai/babysitter-sdk');

// Cross-vendor parity audit. When the catalog adds a new NodeKind or
// attribute (e.g. ProtocolMessage, EffortLevel, FrontmatterField,
// PluginInstallScope, etc. from W86), only Claude Code is initially
// populated. W87 was the manual cross-vendor backfill wave — this process
// captures that pattern so it runs periodically and produces a backlog of
// (vendor, attribute) pairs that lack doc-grounded values.
//
// No breakpoint — pure audit; populate subtasks become the backlog.

const enumerateVendorRelevantNodeKindsTask = defineTask('enumerate-vendor-relevant-node-kinds', (args) => ({
  kind: 'agent',
  title: 'Enumerate NodeKinds with cross-vendor relevance',
  metadata: {
    graphRoot: args.graphRoot,
    instructions: [
      'List the NodeKinds for which cross-vendor parity is meaningful: AgentCoreImpl, AgentRuntimeImpl, AgentPlatformImpl, AgentUIImpl, Subagent, Skill, Plugin, EnvVar, ProtocolMessage, EffortLevel, FrontmatterField, PluginInstallScope, SkillDiscoveryScope, MCPConfigScope, PermissionMode, HookSurface, ToolDescriptor, InteractionPrimitive.',
      'For each, identify the canonical "join" attribute or edge that ties an instance to an AgentVersion (e.g. EnvVar→affects→AgentRuntimeImpl→version_of→AgentVersion).',
      'Return JSON: { nodeKinds: [{ nodeKindId, joinPath, expectedCoverageAttrs[] }] }.',
    ],
  },
}));

const enumerateAgentVersionsTask = defineTask('enumerate-agent-versions', (args) => ({
  kind: 'agent',
  title: 'Enumerate supported AgentVersions',
  metadata: {
    graphRoot: args.graphRoot,
    instructions: [
      'List AgentVersions whose owning AgentProduct has supportTier in (catalog-backed, adapter-only).',
      'For each: { agentVersionId, productId, stackScope, productKind }.',
      'Return JSON: { versions: [...] }.',
    ],
  },
}));

const auditOneNodeKindAcrossVendorsTask = defineTask('audit-node-kind-cross-vendor', (args) => ({
  kind: 'agent',
  title: `Audit ${args.nodeKindId} coverage across vendors`,
  metadata: {
    nodeKindId: args.nodeKindId,
    joinPath: args.joinPath,
    versions: args.versions,
    expectedCoverageAttrs: args.expectedCoverageAttrs,
    instructions: [
      'For each AgentVersion, traverse joinPath and count instances of nodeKindId attached to it.',
      'Compute per-version coverage: { hasAny: bool, instanceCount, missingExpectedAttrs[] }.',
      'A version with hasAny=false on a NodeKind that all peers populate is flagged as a parity gap.',
      'Return JSON: { nodeKindId, perVersion: [...], parityGaps: [...] }.',
    ],
  },
}));

const proposePopulationsTask = defineTask('propose-cross-vendor-populations', (args) => ({
  kind: 'agent',
  title: 'Propose population subtasks for parity gaps',
  metadata: {
    parityGaps: args.parityGaps,
    watchlistPath: args.watchlistPath,
    instructions: [
      'For each parity gap (vendor, nodeKind, missing attribute), search the vendor docs in vendor-docs-watchlist.json for grounding evidence.',
      'If grounding exists: emit a populate proposal { vendor, agentVersionId, nodeKindId, attribute, evidenceUrl, evidenceQuote (≤15 words), proposedValue }.',
      'If no grounding exists: emit a "negative parity" record explicitly stating the concept is genuinely absent from this vendor (W87 convention — record the negative so the next audit does not re-investigate).',
      'No fabrication. No Trust Chain.',
      'Return JSON: { populateProposals: [...], negativeParity: [...] }.',
    ],
  },
}));

const writeBacklogTask = defineTask('write-cross-vendor-backlog', (args) => ({
  kind: 'agent',
  title: 'Write cross-vendor parity backlog',
  metadata: {
    populateProposals: args.populateProposals,
    negativeParity: args.negativeParity,
    instructions: [
      'For each populateProposal: optionally apply directly if doc grounding is unambiguous (single attribute, single value); else add to backlog.',
      'For each negativeParity: author a Claim record (statement: "<vendor> has no <concept> by official documentation"), with retrievedAt and sourceUrl.',
      'Compile a markdown backlog at wiki/agent-generate/cross-vendor-parity/{date}.md grouped by vendor.',
      'No Trust Chain entries.',
      'Run the validator after any direct edits.',
      'Return JSON: { backlogPath, applied[], backloggedCount, negativeParityClaimsAuthored }.',
    ],
  },
}));

exports.process = async function process(inputs, ctx) {
  const graphRoot = inputs.graphRoot || 'graph';
  const watchlistPath = inputs.watchlistPath || '.a5c/processes/vendor-docs-watchlist.json';

  const nodeKinds = await ctx.task(enumerateVendorRelevantNodeKindsTask, { graphRoot });
  const versions = await ctx.task(enumerateAgentVersionsTask, { graphRoot });

  const perNodeKindAudits = [];
  const allParityGaps = [];
  for (const nk of nodeKinds.nodeKinds) {
    const audit = await ctx.task(auditOneNodeKindAcrossVendorsTask, {
      nodeKindId: nk.nodeKindId,
      joinPath: nk.joinPath,
      versions: versions.versions,
      expectedCoverageAttrs: nk.expectedCoverageAttrs,
    });
    perNodeKindAudits.push(audit);
    allParityGaps.push(...(audit.parityGaps || []));
  }

  const proposals = await ctx.task(proposePopulationsTask, {
    parityGaps: allParityGaps,
    watchlistPath,
  });

  const backlog = await ctx.task(writeBacklogTask, {
    populateProposals: proposals.populateProposals,
    negativeParity: proposals.negativeParity,
  });

  return {
    status: 'ok',
    graphRoot,
    nodeKinds,
    versions,
    perNodeKindAudits,
    proposals,
    backlog,
  };
};
