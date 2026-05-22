const { defineTask } = require('@a5c-ai/babysitter-sdk');

// Research-and-enrich the workflow concept: Workflow nodes that model
// common cross-cutting processes (incident response, code review,
// release deployment, onboarding, etc.) — capturing only existence,
// scope/description, workflowKind, and relationships to Roles,
// Responsibilities, SkillAreas, Domains, Specializations, OrgUnits.
// Does NOT model workflow internals (steps, transitions, automation).
// Targets: missing canonical workflows across engineering, SRE, data,
// security, platform, and product domains; missing connectivity edges.

const ensureSchemaTask = defineTask('ensure-workflow-schema', (args) => ({
  kind: 'agent',
  title: 'Ensure Workflow nodeKind schema and edge definitions exist',
  metadata: {
    graphRoot: args.graphRoot,
    instructions: [
      'Check if graph/schema/node-kinds/workflows.yaml exists.',
      'If not, create it with cluster: 11-workflows, defining nodeKind Workflow with:',
      '  - id: node:workflow',
      '  - name: Workflow',
      '  - origin: universal',
      '  - prefix: workflow',
      '  - cluster: 11-workflows',
      '  - purpose: a cross-cutting process that spans multiple roles, responsibilities, and skill areas',
      '  - attributes:',
      '    - id (type: id, required: true)',
      '    - displayName (type: string, required: true)',
      '    - description (type: markdown, required: true) — scope and purpose of the workflow',
      '    - workflowKind (type: enum<operational,development,governance,security,data,onboarding,release,support>, required: true)',
      '    - triggerType (type: enum<event-driven,scheduled,on-demand,continuous>, required: false)',
      '    - typicalCadence (type: string, required: false) — e.g. "per-incident", "weekly", "per-release"',
      '    - complexity (type: enum<simple,moderate,complex,cross-team>, required: false)',
      '  - incomingEdges: [applies_to]',
      '  - outgoingEdges: [involves_role, requires_skill_area, applies_to_domain, triggers_responsibility, performed_by_org_unit]',
      '  - invariants: [at least one involves_role (V-11.1), at least one applies_to_domain (V-11.2)]',
      'Register the file in graph/schema/ontology-schema.yaml under nodeKindFiles.',
      'Add new edge kinds to graph/schema/edge-kinds.yaml:',
      '  - involves_role: Workflow → Role (N:N), inverse: involved_in_workflow',
      '  - involved_in_workflow: Role → Workflow (N:N), inverse: involves_role',
      '  - triggers_responsibility: Workflow → Responsibility (N:N), inverse: triggered_by_workflow',
      '  - triggered_by_workflow: Responsibility → Workflow (N:N), inverse: triggers_responsibility',
      '  - performed_by_org_unit: Workflow → OrgUnit (N:N), inverse: performs_workflow',
      '  - performs_workflow: OrgUnit → Workflow (N:N), inverse: performed_by_org_unit',
      '  - requires_skill_area (already exists — add Workflow as source)',
      '  - applies_to_domain (re-use existing applies_to — add Workflow as source)',
      'Create directory graph/workflows/ if it does not exist.',
      'Return JSON: { schemaCreated: bool, edgesAdded: string[], filesCreated: string[], filesEdited: string[] }.'
    ]
  }
}));

const discoverWorkflowGapsTask = defineTask('discover-workflow-gaps', (args) => ({
  kind: 'agent',
  title: 'Inventory existing graph connectivity — find workflow gaps',
  metadata: {
    graphRoot: args.graphRoot,
    instructions: [
      'Read all files under graph/role/ (roles, responsibilities, org-units).',
      'Read all files under graph/domain/ (domains, specializations, skill-areas).',
      'Read any existing files under graph/workflows/.',
      'Identify missing workflows by cross-referencing:',
      '  - Responsibilities that naturally cluster into a coherent process (e.g. incident-command + postmortem-writeup + on-call-handoff → "incident-response" workflow)',
      '  - Roles that collaborate on shared processes (e.g. code-reviewer + implementer + test-writer → "code-review-cycle" workflow)',
      '  - Domains/specializations that imply standard processes (e.g. devops → "CI/CD pipeline", "release deployment", "infrastructure provisioning")',
      'Canonical workflows to check for:',
      '  - Operational: incident-response, on-call-rotation, capacity-planning, chaos-game-day, change-management, runbook-execution',
      '  - Development: code-review-cycle, feature-development, bug-triage-to-fix, technical-debt-reduction, spike-research, pair-programming-session',
      '  - Release: release-deployment, hotfix-deployment, canary-rollout, feature-flag-lifecycle, rollback-procedure',
      '  - Security: vulnerability-disclosure, security-audit, penetration-test, access-review, secrets-rotation-cycle',
      '  - Data: data-pipeline-deployment, model-training-cycle, a-b-experiment, data-quality-review, schema-migration',
      '  - Governance: architecture-decision-record, rfc-process, tech-radar-update, dependency-audit, license-review',
      '  - Onboarding: new-engineer-onboarding, team-rotation, knowledge-transfer, mentorship-cycle',
      '  - Support: customer-escalation, sla-breach-response, feedback-triage',
      'For each identified workflow, note which existing Roles, Responsibilities, SkillAreas, Domains, OrgUnits it should connect to.',
      'Return JSON: { existingWorkflows: string[], workflowsMissing: { id, displayName, workflowKind, involvedRoles[], requiredSkillAreas[], domains[], triggeredResponsibilities[], orgUnits[], description }[], connectivityGaps: { existingWorkflowId, missingEdges[] }[] }.'
    ]
  }
}));

const researchWorkflowFactsTask = defineTask('research-workflow-facts', (args) => ({
  kind: 'agent',
  title: 'Research workflow patterns from authoritative sources',
  metadata: {
    gaps: args.gaps,
    instructions: [
      'For each missing workflow identified in the gaps:',
      'Research from authoritative sources:',
      '  - SRE/Ops: Google SRE Workbook, PagerDuty incident response docs, Atlassian ITSM, ITIL process definitions',
      '  - Development: GitHub flow, trunk-based development, Atlassian git workflows, Martin Fowler articles',
      '  - Security: NIST CSF, OWASP SAMM, SOC 2 process requirements, CIS benchmarks',
      '  - Data: CRISP-DM, MLOps maturity model, dbt best practices, Airflow patterns',
      '  - Governance: ADR templates (adr.github.io), RFC processes (Rust RFC, React RFC), ThoughtWorks tech radar',
      '  - Onboarding: Ramp-up guides from major companies, buddy system patterns',
      'Per workflow, determine:',
      '  - Canonical name and scope description (what it covers, what it does NOT cover)',
      '  - Which roles are typically involved and in what capacity',
      '  - Which skill areas are required to execute the workflow',
      '  - Which domains/specializations it applies to',
      '  - Which responsibilities it triggers or activates',
      '  - Which org units typically own or participate',
      '  - workflowKind classification',
      '  - triggerType and typicalCadence',
      '  - complexity level',
      'Per finding: source reference, confidence level.',
      'Return JSON: { evidence[], workflowsToAuthor: { id, displayName, workflowKind, triggerType, typicalCadence, complexity, description, involvedRoles[], requiredSkillAreas[], domains[], triggeredResponsibilities[], orgUnits[], sources[] }[], edgesToAdd[] }.'
    ]
  }
}));

const enrichWorkflowGraphTask = defineTask('enrich-workflow-graph', (args) => ({
  kind: 'agent',
  title: 'Apply workflow research to graph — create nodes and edges',
  metadata: {
    evidence: args.evidence,
    instructions: [
      'Author new Workflow records under graph/workflows/.',
      'File naming: one file per workflow-kind category (e.g. workflows-operational.yaml, workflows-development.yaml, workflows-release.yaml, etc.) using multi-document YAML (--- separators).',
      'Per Workflow node:',
      '  - nodeKind: Workflow',
      '  - id: workflow:<kebab-case-name>',
      '  - attributes: displayName, description (scope only, not steps), workflowKind, triggerType, typicalCadence, complexity',
      '  - edges.involves_role: list of { target: role:<id> } for each role that participates',
      '  - edges.requires_skill_area: list of { target: skill-area:<id> } for each required skill area',
      '  - edges.applies_to_domain: list of { target: domain:<id> or specialization:<id> }',
      '  - edges.triggers_responsibility: list of { target: responsibility:<id> } for responsibilities activated by this workflow',
      '  - edges.performed_by_org_unit: list of { target: org-unit:<id> } for owning org units',
      'Only reference existing Role, Responsibility, SkillArea, Domain, Specialization, OrgUnit nodes that already exist in the graph.',
      'If a workflow references a role/responsibility/skill-area that does not exist yet, include it in a carryOverTasks list — do not create placeholder nodes outside workflows/.',
      'Validate: no dangling references (all edge targets must exist in the graph).',
      'Return JSON: { filesCreated[], workflowsAdded: number, edgesAdded: number, carryOverTasks[], validatorState }.'
    ]
  }
}));

const verifyWorkflowEnrichmentTask = defineTask('verify-workflow-enrichment', (args) => ({
  kind: 'agent',
  title: 'Verify workflow enrichment — schema, edges, coverage',
  metadata: {
    enrichmentResult: args.enrichmentResult,
    checks: [
      'Schema: workflows.yaml is registered in ontology-schema.yaml nodeKindFiles.',
      'Schema: new edge kinds are defined in edge-kinds.yaml with correct source/target types.',
      'Every Workflow node has at least one involves_role edge (V-11.1).',
      'Every Workflow node has at least one applies_to_domain edge (V-11.2).',
      'No dangling edge targets — all referenced roles, skill-areas, domains, responsibilities, org-units exist.',
      'No duplicate workflow IDs.',
      'Each workflowKind enum value is used by at least one workflow (coverage check).',
      'Workflows span at least 3 different domains (breadth check).',
      'Unresolved work is represented as carryOverTasks, not placeholder nodes.',
      'Return JSON: { status: "ok"|"needs-iteration"|"blocked", issues[], remainingGaps[], metrics: { totalWorkflows, totalEdges, domainsCovered, rolesCovered, skillAreasCovered } }.'
    ]
  }
}));

exports.process = async function process(inputs, ctx) {
  const graphRoot = inputs.graphRoot || 'graph';
  const maxGapIterations = inputs.maxGapIterations || 3;

  // Phase 0: ensure schema infrastructure exists
  const schemaResult = await ctx.task(ensureSchemaTask, { graphRoot });

  // Phase 1: discover gaps
  const initialGaps = await ctx.task(discoverWorkflowGapsTask, { graphRoot });

  const attempts = [];
  let currentGaps = initialGaps;
  let verification = null;
  let enrichmentResult = null;

  for (let attempt = 1; attempt <= maxGapIterations; attempt += 1) {
    const evidence = await ctx.task(researchWorkflowFactsTask, {
      gaps: currentGaps,
      attempt,
      previousVerification: verification,
    });
    enrichmentResult = await ctx.task(enrichWorkflowGraphTask, {
      evidence: evidence,
      gaps: currentGaps,
      attempt,
    });
    verification = await ctx.task(verifyWorkflowEnrichmentTask, {
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

    currentGaps = verification.remainingGaps || verification.gaps || enrichmentResult.carryOverTasks || currentGaps;
  }

  return {
    status: verification && verification.status === 'ok' ? 'ok' : 'needs-review',
    graphRoot,
    schemaResult,
    gaps: currentGaps,
    initialGaps,
    attempts,
    enrichmentResult: enrichmentResult,
    verification,
  };
};
