const { defineTask } = require('@a5c-ai/babysitter-sdk');

// Audit Capability records and their wirings. Per the W79/W82/W83
// conventions, every Capability instance must have ≥1 `supports` edge, the
// edge must carry `versionRange`, and the edge must carry `level` enum.
// Capabilities with no wirings are a backlog smell — either find a supporter
// or retire the capability. A single breakpoint guards retirement.

const enumerateCapabilitiesTask = defineTask('enumerate-capabilities', (args) => ({
  kind: 'agent',
  title: 'Enumerate every Capability and its supports edges',
  metadata: {
    graphRoot: args.graphRoot,
    instructions: [
      'Walk graph/capabilities/ and any other path containing nodeKind=Capability.',
      'For each Capability instance, count incoming `supports` edges and capture per-edge { sourceId, versionRange?, level? }.',
      'Return JSON: { capabilities: [{ id, displayName, supportEdgeCount, edges: [{ sourceId, versionRange, level }] }] }.',
    ],
  },
}));

const auditOneCapabilityTask = defineTask('audit-one-capability', (args) => ({
  kind: 'agent',
  title: `Audit Capability ${args.capability.id}`,
  metadata: {
    capability: args.capability,
    instructions: [
      'Compute defects:',
      '  - noWiring: supportEdgeCount === 0.',
      '  - missingVersionRange: any edge without versionRange.',
      '  - missingLevel: any edge without level.',
      'For noWiring: investigate — search graph for any AgentVersion / Provider / etc. that documents this capability. Decide: { findSupporter | propose-retire }.',
      'For missingVersionRange / missingLevel: research the source instance to fill in.',
      'Return JSON: { capabilityId, defects, recommendation, supporterCandidate?, retirementProposal? }.',
    ],
  },
}));

const fixWiringDefectsTask = defineTask('fix-capability-wiring-defects', (args) => ({
  kind: 'agent',
  title: 'Fix versionRange / level defects',
  metadata: {
    audits: args.audits,
    instructions: [
      'For audits with missingVersionRange or missingLevel: edit the supports edge on the source instance to add the doc-grounded values.',
      'Where doc-grounding is unavailable, return a carry-over task capturing requiredInformation without writing placeholder graph data (do not invent a versionRange/level).',
      'Run the validator.',
      'Return JSON: { edgesFixed[], carryOverTasks[], validatorState }.',
    ],
  },
}));

// BREAKPOINT: retirement removes a Capability entirely. User confirms which
// no-wiring capabilities are truly dead vs reserved for a future supporter.
const confirmCapabilityRetirementsTask = defineTask('confirm-capability-retirements', (args) => ({
  kind: 'breakpoint',
  title: 'Confirm Capability retirements',
  metadata: {
    retirementCandidates: args.retirementCandidates,
    prompt: 'These Capability records have no supports edges and no doc-grounded supporter candidate was found. Confirm which to retire (delete the YAML record). Strike any that should remain reserved.',
  },
}));

const retireCapabilitiesTask = defineTask('retire-capabilities', (args) => ({
  kind: 'agent',
  title: 'Retire confirmed unused Capabilities',
  metadata: {
    confirmedIds: args.confirmedIds,
    instructions: [
      'Delete the YAML doc for each confirmed Capability id.',
      'Remove any orphaned references in REMODEL-NOTES.md or wiki/ — only those that point at the retired id by name; do not delete history.',
      'Run the validator.',
      'Return JSON: { retiredIds[], filesEdited[], validatorState }.',
    ],
  },
}));

const summarizeCapabilityAuditTask = defineTask('summarize-capability-audit', (args) => ({
  kind: 'agent',
  title: 'Summarize capability completeness audit',
  metadata: {
    audits: args.audits,
    fixes: args.fixes,
    retired: args.retired,
    checks: [
      'Validator: 0 structural, 0 dangling, 0 parse errors.',
      'Every Capability has either ≥1 supports edge with versionRange + level, OR was retired this run, OR is explicitly reserved by user during the breakpoint.',
      'No Trust Chain entries.',
      'Return JSON: { status, capabilitiesAudited, defectsFixed, retiredCount, reservedCount }.',
    ],
  },
}));

exports.process = async function process(inputs, ctx) {
  const graphRoot = inputs.graphRoot || 'graph';
  const allowRetirement = inputs.allowRetirement !== false;

  const list = await ctx.task(enumerateCapabilitiesTask, { graphRoot });

  const audits = [];
  for (const capability of list.capabilities) {
    audits.push(await ctx.task(auditOneCapabilityTask, { capability }));
  }

  const fixes = await ctx.task(fixWiringDefectsTask, { audits });

  let retired = null;
  if (allowRetirement) {
    const retirementCandidates = audits
      .filter((a) => a.recommendation === 'propose-retire')
      .map((a) => ({ capabilityId: a.capabilityId, retirementProposal: a.retirementProposal }));
    if (retirementCandidates.length) {
      const confirmation = await ctx.task(confirmCapabilityRetirementsTask, { retirementCandidates });
      if (confirmation.confirmedIds && confirmation.confirmedIds.length) {
        retired = await ctx.task(retireCapabilitiesTask, { confirmedIds: confirmation.confirmedIds });
      }
    }
  }

  const summary = await ctx.task(summarizeCapabilityAuditTask, { audits, fixes, retired });

  return {
    status: summary.status,
    graphRoot,
    list,
    audits,
    fixes,
    retired,
    summary,
  };
};
