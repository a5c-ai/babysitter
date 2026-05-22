const { defineTask } = require('@a5c-ai/babysitter-sdk');

// Research-and-enrich the domain-ontology cluster: Domain, Specialization,
// Topic, SkillArea, Skill, Role, Responsibility, OrgUnit, Capability,
// Framework, Library, Language, StackPart, StackProfile. Targets: missing
// engineering domains (e.g. quantum, embedded RT, crypto / ZK, robotics
// niches), missing skill-areas, missing role definitions, stale
// language/framework facts, missing canonical responsibilities.

const discoverDomainGapsTask = defineTask('discover-domain-gaps', (args) => ({
  kind: 'agent',
  title: 'Inventory domain ontology — find gaps',
  metadata: {
    graphRoot: args.graphRoot,
    instructions: [
      'List every Domain, Specialization, Topic, SkillArea, Skill, Role, Responsibility, OrgUnit, Capability, Framework, Library, Language, StackPart, StackProfile under graph/domain/, /role/, /capabilities/, /extensions/skills/.',
      'Identify gaps:',
      '  - Domains missing: e.g. quantum-computing, biotech, robotics-control, hardware-design (FPGA/ASIC), real-time-os, formal-methods, cryptography-zero-knowledge, distributed-systems-consensus, computer-graphics-rt, scientific-computing.',
      '  - Specializations missing: per existing Domain, are the canonical sub-domains modeled? (e.g. domain:web-development → frontend-react, frontend-vue, frontend-svelte, backend-node, backend-go, backend-python, backend-rust).',
      '  - SkillAreas missing: gaps in coverage for each specialization. Cross-reference: O*NET task lists, software-engineering competency matrices, patterns from Anthropic/OpenAI Skills repositories.',
      '  - Roles missing: e.g. role:data-analyst, role:research-scientist, role:ml-research-engineer, role:embedded-systems-engineer, role:game-developer, role:mobile-engineer (ios/android), role:devsecops, role:platform-product-manager, role:engineering-director, role:cto-fractional.',
      '  - Responsibilities missing: SLO/SLA definition, postmortem facilitation, on-call hand-off, dependency upgrade cadence, security review of third-party AI usage, data-retention review, model-card maintenance.',
      '  - Languages: latest versions of Python/TS/Rust/Go; missing Zig, Mojo, Roc, Gleam, Lean4, Coq, Agda where relevant.',
      '  - Frameworks: latest minor versions; missing Astro, SolidStart, Qwik, Hono, ElysiaJS, FastAPI updates, Litestar, Bun frameworks.',
      '  - Libraries: AI/ML libs (langgraph, llamaindex, pydantic-ai, instructor, dspy, mirascope, marvin, magentic), data libs (polars, ibis, dlt, dbt-core, motherduck), test libs.',
      '  - StackParts: any architectural slot referenced in current methodology specs but missing as a node.',
      '  - StackProfiles: canonical stacks (T3, Astro+Svelte, MEAN, LAMP, FARM (FastAPI+React+Mongo), Rust+Postgres+TS).',
      '  - Capabilities: gaps in fine-grained model/runtime/platform capability flags.',
      'Return JSON: { domainsMissing, specializationsMissing, skillAreasMissing, rolesMissing, responsibilitiesMissing, orgUnitsMissing, languagesStale, frameworksMissing, librariesMissing, stackPartsMissing, stackProfilesMissing, capabilitiesMissing }.'
    ]
  }
}));

const researchDomainFactsTask = defineTask('research-domain-facts', (args) => ({
  kind: 'agent',
  title: 'Research domain ontology facts from authoritative sources',
  metadata: {
    gaps: args.gaps,
    instructions: [
      'Domains: industry taxonomies (NAICS, ACM/IEEE CS curriculum), ai-safety institute reports, Stack Overflow / DORA / GitHub Octoverse surveys.',
      'Specializations: bls.gov/ooh, github topics, learn.microsoft.com, AWS/GCP/Azure architect role tracks.',
      'SkillAreas: coding interview prep cribs (system-design, frontend-fundamentals), Anthropic Skills templates, claude-code-skills repos.',
      'Roles: levels.fyi role taxonomies, industry reports (Stack Overflow), enterprise org-chart conventions, sre.google role descriptions.',
      'Responsibilities: SRE workbook, ITIL processes, NIST CSF role-responsibility matrix, postmortem.org templates.',
      'Languages/Frameworks/Libraries: official release notes, GitHub releases, Stack Overflow trends, npm/PyPI/crates.io download stats, awesome-* lists.',
      'StackParts/StackProfiles: aws-architecture-icons, gcp/azure reference architectures, T3 stack, Astro examples, Vercel templates, Railway templates.',
      'Capabilities: vendor API docs (Anthropic capabilities matrix, OpenAI features matrix, Google models capability table).',
      'Per finding: source URL, retrievedAt, quote, confidence.',
      'Return JSON: { evidence, newDomainsToAuthor, newSpecializationsToAuthor, newSkillAreasToAuthor, newRolesToAuthor, newResponsibilitiesToAuthor, newOrgUnitsToAuthor, newLanguagesToAuthor, newFrameworksToAuthor, newLibrariesToAuthor, newStackPartsToAuthor, newStackProfilesToAuthor, newCapabilitiesToAuthor, edgesToAdd }.'
    ]
  }
}));

const enrichDomainGraphTask = defineTask('enrich-domain-graph', (args) => ({
  kind: 'agent',
  title: 'Apply domain-ontology research to graph',
  metadata: {
    evidence: args.evidence,
    instructions: [
      'Author new records under graph/domain/, /role/, /capabilities/, /extensions/skills/.',
      'Per Domain: wire contains Specialization (or Topic).',
      'Per Specialization: wire specializes Domain.',
      'Per SkillArea: wire applies_to Domain/Specialization, uses_language/uses_framework/uses_library/uses_stack_part, requires_skill_area (prerequisites), uses_tool.',
      'Per Skill: wire applies_to Domain, addresses SkillArea, implements ExtensionInterface, requires_capability, requiresLanguages/Frameworks attrs.',
      'Per Role: wire requires_expertise SkillArea (level: novice|intermediate|expert|authoritative), holds_responsibility Responsibility, member_of OrgUnit, delegates_to Role, requiresCapabilities/Domains attrs.',
      'Per Responsibility: wire held_by Role, requires_expertise SkillArea.',
      'Per OrgUnit: wire has_member Role.',
      'Per Language/Framework/Library: wire belongs_to_language (where Library/Framework targets a language), realizes layer:1-* if applicable, used_by_skill_area inverse.',
      'Per StackPart: wire implemented_by Library/Framework/Tool/PlatformService.',
      'Per StackProfile: wire composes_stack Language/Framework/Tool, applies_to Specialization.',
      'Per Capability: ensure at least one supports edge inbound from a Provider/AgentVersion/AgentRuntimeImpl/AgentPlatformImpl/ModelVersion.',
      'Author Claim records for inferred attributes. No Trust Chain.',
      'When evidence is insufficient but the missing graph shape is known, return a graph carry-over task in the process output; do not write placeholder nodes or graph-build-history records.',
      'Graph carry-over tasks should include targetNodeKind, targetIdHint or graphPathHint when known, requiredInformation, searchedSources, and nextAction; keep them outside graph.',
      'Do not add placeholder records under graph; unresolved work belongs in run/process carry-over output outside the active graph.',
      'Include carryOverTasks[] and carryOverTaskIds[] in the task result whenever unresolved work remains.',
      'Run validator after each batch; fix V-1.x type/enum errors.',
      'Return JSON: { filesEdited, filesCreated, domainsAdded, specializationsAdded, skillAreasAdded, rolesAdded, responsibilitiesAdded, orgUnitsAdded, languagesAdded, frameworksAdded, librariesAdded, stackPartsAdded, stackProfilesAdded, capabilitiesAdded, edgesAdded, claimsAdded, remainingGaps[], blockedEvidence[], validatorState }.'
    ]
  }
}));

const verifyDomainEnrichmentTask = defineTask('verify-domain-enrichment', (args) => ({
  kind: 'agent',
  title: 'Verify domain-ontology enrichment',
  metadata: {
    enrichmentResult: args.enrichmentResult,
    checks: [
      'Validator: 0 structural, 0 dangling, 0 parse errors.',
      'If unresolved work remains, it is represented as process carry-over output with non-empty requiredInformation; no placeholder graph nodes, graph-build-history records, or process descriptor placeholders.',

      'If this verification is not ok, return remainingGaps[] so the process can iterate, or status=blocked with blockedEvidence[] when facts cannot be resolved safely.',
      'Every new Role has at least one requires_expertise SkillArea AND at least one holds_responsibility OR member_of OrgUnit.',
      'Every new Responsibility has at least one held_by Role.',
      'Every new SkillArea has at least one applies_to Domain.',
      'Every new Specialization has a specializes Domain edge.',
      'Every new Capability has at least one inbound supports edge.',
      'No Trust Chain entries.',
    ]
  }
}));

exports.process = async function process(inputs, ctx) {
  const graphRoot = inputs.graphRoot || 'graph';
  const maxGapIterations = inputs.maxGapIterations || 3;
  const initialGaps = await ctx.task(discoverDomainGapsTask, { graphRoot });

  const attempts = [];
  let currentGaps = initialGaps;
  let verification = null;
  let enrichmentResult = null;

  for (let attempt = 1; attempt <= maxGapIterations; attempt += 1) {
    const evidence = await ctx.task(researchDomainFactsTask, {
      gaps: currentGaps,
      attempt,
      previousVerification: verification,
    });
    enrichmentResult = await ctx.task(enrichDomainGraphTask, {
      evidence: evidence,
      gaps: currentGaps,
      attempt,
    });
    verification = await ctx.task(verifyDomainEnrichmentTask, {
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
