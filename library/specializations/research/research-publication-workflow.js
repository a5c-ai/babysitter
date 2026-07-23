/**
 * @process specializations/research/research-publication-workflow
 * @description Flagship research-publication pipeline: frame the question -> plan gathering
 *   lanes (composing the five research scanner point-tasks as lane playbooks) -> fan out
 *   source gathering via ctx.parallel -> adversarial claim-verification gate whose critics
 *   independently RE-FETCH every citation (executed fetch output is the only admissible
 *   evidence) -> research-lead sign-off on contested claims -> synthesis that may cite ONLY
 *   verified/signed-off claims, audited by a second gate -> policy-gated publication ->
 *   deterministic kip capture of verified claims and source-quality facts (kind `research`).
 * @inputs {
 *   researchQuestion: string (required),
 *   audience?: string,
 *   outputDir?: string (default ctx.artifactsDir),
 *   maxGatheringLanes?: number (default 5),
 *   maxParallelLanes?: number (default 3, ctx.parallel.map concurrency),
 *   maxFixAttempts?: number (default 2, per gate),
 *   kipEnabled?: boolean (default true),
 *   kipDir?: string (default '.a5c/kip'),
 *   kipModel?: string (default 'sonnet'),
 *   kipReplicaId?: string (default `rpw-${ctx.runId}`)
 * }
 * @outputs {
 *   success: boolean,
 *   framing: { subQuestions, keyTerms, scopeBoundaries },
 *   plan: { lanes },
 *   gathering: [{ lane, method, claimCount, sourceCount }],
 *   claimLedger: { verified: array, contested: array, rejected: array },
 *   verification: { passed, attempts, escalated, issues, evidence },
 *   claimSignoff: { raised, approved, caveats, response } | null,
 *   synthesis: { reportPath, auditPassed, auditAttempts },
 *   publication: { packagePath, approved, published, signoffResponse },
 *   kipFactsAsserted: number,
 *   autoApprovals: Array<{ breakpointId, phase, at }> (ALWAYS present, possibly empty — fail-closed surfacing),
 *   artifacts: array,
 *   metadata: { processId, runId, laneCount, breakpointsHit, timings }
 * }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:research]
 *   skillAreas: [skill-area:deep-web-research, skill-area:data-analysis, skill-area:knowledge-management, skill-area:docs-as-code]
 *   topics: [topic:quality-assurance, topic:developer-experience]
 *   roles: [role:research-engineer, role:tech-lead]
 *   workflows: [workflow:experiment-design]
 * @policyGatedActions [
 *   { actionId: 'publish-research-report', description: 'Publish or externally distribute the final cited report', expert: 'research-lead' },
 *   { actionId: 'claim-signoff', description: 'Sign off contested claims that survived adversarial verification with caveats', expert: 'research-lead' }
 * ] — breakpointId equals actionId, executors guarded by approved===true, autoApproved
 *   provenance recorded in autoApprovals.
 *
 * Breakpoints (sparse by design): exactly the two policy-gated routed breakpoints above
 * (claim-signoff is conditional on contested claims; publish-research-report is terminal)
 * plus the combinator-internal gate-escalation breakpoints
 * ('rpw.claim-verification.gate-escalation' / 'rpw.synthesis-audit.gate-escalation',
 * expert 'owner', tags ['quality-gate','escalation',<gateId>]) that fire only when a
 * gate's fix budget is exhausted. Those escalations are not policy-gated actions.
 *
 * Hard rules: Style-A agent tasks only (zero kind:'shell'); NO fallbacks — validateLanes /
 * assertLaneMethod throw, an empty claim ledger throws, adjudication promoting a claim past
 * the strictest critic verdict throws, a missing researchQuestion throws, and the
 * deep-web-research lane's null playbook is a documented absence, not a default. The
 * publication executor is NEVER invoked without approved===true; kip facts are built
 * DETERMINISTICALLY by the orchestrator (agents never invent them).
 *
 * Flagship consumer of the kip-librarian skill
 * (library/specializations/shared/skills/kip-librarian/SKILL.md), kind `research`.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  KIP_CLI_NOTE,
} from '../common-utilities/routed-gate-combinators.js';

// ---------------------------------------------------------------------------
// Module constants — lane methods, playbooks, kip skill note, validators
// ---------------------------------------------------------------------------

/**
 * The only gathering-lane methods the planner may assign. assertLaneMethod throws on
 * anything else — no default is applied (fallbacks forbidden). The first five map 1:1 to
 * the scanner point-tasks in this directory; deep-web-research is the generic open-web lane.
 */
export const ALLOWED_LANE_METHODS = Object.freeze([
  'novelties-scan',
  'vendor-comparison',
  'repo-evangelist-scan',
  'patentability-assessment',
  'standards-gap-audit',
  'deep-web-research',
]);

/**
 * Method -> playbook file map interpolated into gathering prompts ('apply the methodology
 * of <file> as this lane's playbook — emulate its scan/filter/verify discipline; do not
 * import it'). The scanners are composed BY NAME only — never imported.
 *
 * 'deep-web-research' deliberately has NO entry: its null playbook is a documented
 * absence (generic open-web research discipline), not a fallback.
 */
export const LANE_PLAYBOOKS = Object.freeze({
  'novelties-scan': 'library/specializations/research/novelties-scanner.js',
  'vendor-comparison': 'library/specializations/research/vendor-researcher.js',
  'repo-evangelist-scan': 'library/specializations/research/evangelist.js',
  'patentability-assessment': 'library/specializations/research/patentable-novelties.js',
  'standards-gap-audit': 'library/specializations/research/standards-gap-audit.js',
});

/**
 * Prepended (with KIP_CLI_NOTE) to every kip-touching task prompt — names the
 * kip-librarian skill explicitly, as the flagship consumer must.
 */
export const KIP_LIBRARIAN_NOTE =
  'Follow the kip-librarian skill (library/specializations/shared/skills/kip-librarian/SKILL.md) exactly: every command needs --dir, --replica (reads too), --json; writes need <dir>/keyring.json; recall requires --k; resolve requires explicit --model sonnet; an assert echo of status:"pending" is BY DESIGN, never a failure; 0 recall hits on a fresh store is a fresh brain, not an error.';

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Throws on any method outside ALLOWED_LANE_METHODS — no default method exists.
 *
 * @param {string} method - The lane method the planner assigned
 * @param {string} laneName - The lane's name (for the error message)
 * @returns {string} The method, unchanged, when it is allowed
 */
export function assertLaneMethod(method, laneName) {
  if (!ALLOWED_LANE_METHODS.includes(method)) {
    throw new Error(
      `Lane '${laneName}' uses unknown method '${method}'. ` +
      `Allowed methods: ${ALLOWED_LANE_METHODS.join(', ')} — no default method is applied.`
    );
  }
  return method;
}

/**
 * Throwing lane-plan validator (no fallback, no repair). Throws on: empty lanes,
 * more than maxGatheringLanes, non-kebab-case or duplicate names (names key lane task
 * titles and claim ids), unknown method, or a lane missing question/sources.
 *
 * @param {Array<object>} lanes - The planner's lanes
 * @param {number} maxGatheringLanes - Upper bound on lane count
 * @returns {Array<object>} The lanes, unchanged, when valid
 */
export function validateLanes(lanes, maxGatheringLanes) {
  if (!Array.isArray(lanes) || lanes.length === 0) {
    throw new Error('validateLanes: the research plan produced zero lanes — an empty plan is a planning failure, never repaired.');
  }
  if (lanes.length > maxGatheringLanes) {
    throw new Error(
      `validateLanes: plan has ${lanes.length} lanes but maxGatheringLanes is ${maxGatheringLanes} — the plan is rejected, never truncated.`
    );
  }
  const seen = new Set();
  for (const lane of lanes) {
    if (!lane || typeof lane.name !== 'string' || !KEBAB_CASE.test(lane.name)) {
      throw new Error(
        `validateLanes: lane name ${JSON.stringify(lane && lane.name)} is not kebab-case — lane names key task titles and claim ids.`
      );
    }
    if (seen.has(lane.name)) {
      throw new Error(`validateLanes: duplicate lane name '${lane.name}' — lane names must be unique.`);
    }
    seen.add(lane.name);
    assertLaneMethod(lane.method, lane.name);
    if (typeof lane.question !== 'string' || lane.question.length === 0) {
      throw new Error(`validateLanes: lane '${lane.name}' is missing its question — no question is synthesized for it.`);
    }
    if (!Array.isArray(lane.sources) || lane.sources.length === 0) {
      throw new Error(`validateLanes: lane '${lane.name}' is missing its sources list — no sources are synthesized for it.`);
    }
  }
  return lanes;
}

/**
 * Hostname extraction for deterministic source:* kip eids. Throws on malformed URLs —
 * a citation whose URL cannot be parsed never silently becomes a fact.
 *
 * @param {string} url - Citation URL
 * @returns {string} The hostname
 */
function hostnameOf(url) {
  try {
    return new URL(url).hostname;
  } catch (err) {
    throw new Error(`Cannot derive a source hostname from malformed citation URL ${JSON.stringify(url)}: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// P0 — kip recall (kip-librarian skill, kind research)
// ---------------------------------------------------------------------------

export const rpwKipRecallTask = defineTask('rpw.kip-recall', (args, taskCtx) => ({
  kind: 'agent',
  title: `Recall prior research memory for: ${args.researchQuestion}`,
  agent: {
    name: 'kip-librarian',
    skill: { name: 'kip-librarian' },
    prompt: {
      role: 'Knowledge-base librarian',
      task: 'Recall prior research findings and source-reliability facts for this question from kip',
      context: args,
      instructions: [
        KIP_LIBRARIAN_NOTE,
        KIP_CLI_NOTE,
        `Run \`kip init --dir ${args.kipDir} --create --replica ${args.kipReplicaId} --json\` (idempotent open); ensure ${args.kipDir}/keyring.json exists before any later write.`,
        `Run \`kip recall "${args.researchQuestion}" --dir ${args.kipDir} --replica ${args.kipReplicaId} --k 8 --json\` — --k is mandatory.`,
        'Also run `kip query` (with mandatory --depth/--max-fanout/--direction) from any hit eids to pull linked source-quality facts.',
        'Partition results into priorClaims (kind research, claim:* eids), sourceReliability (source:* eids), and insights; report the raw factCount.',
        'A fresh store means factCount 0 with storeInitialized true — a fresh brain, never an error.',
      ],
      outputFormat: 'JSON with priorClaims array, sourceReliability array, insights array, factCount number, storeInitialized boolean',
    },
    outputSchema: {
      type: 'object',
      required: ['factCount', 'storeInitialized'],
      properties: {
        priorClaims: { type: 'array' },
        sourceReliability: { type: 'array' },
        insights: { type: 'array' },
        factCount: { type: 'number' },
        storeInitialized: { type: 'boolean' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rpw', 'research', 'kip'],
}));

// ---------------------------------------------------------------------------
// P1 — question framing
// ---------------------------------------------------------------------------

export const rpwQuestionFramingTask = defineTask('rpw.question-framing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Frame research question: ${args.researchQuestion}`,
  agent: {
    name: 'research-analyst',
    prompt: {
      role: 'Research question framer',
      task: 'Decompose the research question into an answerable frame',
      context: args,
      instructions: [
        'Produce subQuestions (each independently answerable), keyTerms with definitions, scopeBoundaries { inScope, outOfScope }, successCriteria, and openAmbiguities.',
        'Honor priorKnowledge.insights — do not re-litigate previously verified claims; cite them as recalled context instead.',
        'Do NOT gather sources in this phase.',
      ],
      outputFormat: 'JSON with subQuestions array, keyTerms array, scopeBoundaries object, successCriteria array, openAmbiguities array',
    },
    outputSchema: {
      type: 'object',
      required: ['subQuestions', 'scopeBoundaries'],
      properties: {
        subQuestions: { type: 'array' },
        keyTerms: { type: 'array' },
        scopeBoundaries: { type: 'object' },
        successCriteria: { type: 'array' },
        openAmbiguities: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rpw', 'research', 'framing'],
}));

// ---------------------------------------------------------------------------
// P2 — research plan (lanes routed onto the scanner playbooks)
// ---------------------------------------------------------------------------

export const rpwResearchPlanTask = defineTask('rpw.research-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan gathering lanes for: ${args.researchQuestion}`,
  agent: {
    name: 'research-planner',
    prompt: {
      role: 'Research gathering planner',
      task: 'Plan independent source-gathering lanes for the framed question',
      context: args,
      instructions: [
        'Emit lanes: [{ name (kebab-case, unique — keys claim ids and task titles), method, question, sources, playbookRationale }].',
        `method MUST be exactly one of: ${ALLOWED_LANE_METHODS.join(', ')} — there is no default and planning fails on anything else.`,
        'Routing: novelty/emerging-tech angle -> novelties-scan (playbook library/specializations/research/novelties-scanner.js); vendor/tool/market comparison -> vendor-comparison (vendor-researcher.js); claims about this repo\'s own activity -> repo-evangelist-scan (evangelist.js); IP/patentability angle -> patentability-assessment (patentable-novelties.js); auditing existing documents against extractions -> standards-gap-audit (standards-gap-audit.js); everything else -> deep-web-research.',
        'Lanes must be mutually independent (they run in parallel; no lane consumes another\'s output).',
        `At most ${args.maxGatheringLanes} lanes.`,
      ],
      outputFormat: 'JSON with lanes array [{ name, method, question, sources, playbookRationale }]',
    },
    outputSchema: {
      type: 'object',
      required: ['lanes'],
      properties: {
        lanes: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'method', 'question'],
            properties: {
              name: { type: 'string' },
              method: { type: 'string', enum: [...ALLOWED_LANE_METHODS] },
              question: { type: 'string' },
              sources: { type: 'array' },
              playbookRationale: { type: 'string' },
            },
          },
        },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rpw', 'research', 'planning'],
}));

// ---------------------------------------------------------------------------
// P3 — per-lane source gathering (fanned out via ctx.parallel.map)
// ---------------------------------------------------------------------------

export const rpwSourceGatheringTask = defineTask('rpw.source-gathering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Gather sources — lane ${args.lane.name} (${args.lane.method})`,
  agent: {
    name: 'research-gatherer',
    prompt: {
      role: `Source-gathering researcher (lane: ${args.lane.name})`,
      task: 'Gather sources and extract citable claims for this lane\'s question',
      context: args,
      instructions: [
        args.playbook === null
          ? 'This is a deep-web-research lane: apply standard multi-source web research discipline — the playbook is null by design (a documented absence, not a default).'
          : `Apply the methodology of the lane playbook ${args.playbook} as this lane's discipline — emulate its scan/filter/verify structure; do NOT import or execute it.`,
        'Every claim MUST carry >=1 citation: { url, title, quote (verbatim excerpt), accessedAt, retrievalMethod (the exact command/tool used) } — an uncited claim is not a claim.',
        'Record confidence honestly and mark single-source claims; separate facts from speculation (novelties-scanner discipline).',
        'Weigh priorKnowledge.sourceReliability: prefer sources previously verified reliable, flag previously-unreliable ones.',
        `claimId format: ${args.lane.name}-c<N>.`,
        'IRON LAW: an adversarial verification gate will independently RE-FETCH every citation you list — fabricated or paraphrase-mangled quotes will be caught and rejected.',
      ],
      outputFormat: 'JSON with claims array [{ claimId, statement, citations (minItems 1), confidence, laneName }], sources array [{ url, publisher, type, independence }]',
    },
    outputSchema: {
      type: 'object',
      required: ['claims', 'sources'],
      properties: {
        claims: {
          type: 'array',
          items: {
            type: 'object',
            required: ['claimId', 'statement', 'citations'],
            properties: {
              claimId: { type: 'string' },
              statement: { type: 'string' },
              citations: { type: 'array', minItems: 1 },
              confidence: { type: 'string' },
              laneName: { type: 'string' },
            },
          },
        },
        sources: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rpw', 'research', 'gathering'],
}));

// ---------------------------------------------------------------------------
// P4 — claim consolidation into the ledger artifact
// ---------------------------------------------------------------------------

export const rpwClaimConsolidationTask = defineTask('rpw.claim-consolidation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Consolidate ${args.laneCount} lane outputs into the claim ledger`,
  agent: {
    name: 'research-analyst',
    prompt: {
      role: 'Claim-ledger curator',
      task: 'Merge lane outputs into a single deduplicated claim ledger artifact',
      context: args,
      instructions: [
        `Write the ledger JSON to ${args.claimLedgerPath} and report that exact path back.`,
        'Merge near-duplicate claims keeping the union of citations; never discard a citation.',
        'Flag: singleSource, conflictsWith (claims contradicting each other are BOTH flagged — contradictions are surfaced, never resolved by deletion).',
        'Preserve claimId provenance (mergedFrom array).',
      ],
      outputFormat: 'JSON with claimLedgerPath string, claimCount number, sourceCount number, conflicts array',
    },
    outputSchema: {
      type: 'object',
      required: ['claimLedgerPath', 'claimCount'],
      properties: {
        claimLedgerPath: { type: 'string' },
        claimCount: { type: 'number' },
        sourceCount: { type: 'number' },
        conflicts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rpw', 'research', 'ledger'],
}));

// ---------------------------------------------------------------------------
// P5 — claim-verification gate fixer + adjudication
// ---------------------------------------------------------------------------

/** Fixer for the rpw.claim-verification adversarialGate (passed via fixer.task). */
export const rpwClaimRemediationTask = defineTask('rpw.claim-remediation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Remediate claim-ledger citation issues (attempt ${args.attempt})`,
  agent: {
    name: 'research-gatherer',
    prompt: {
      role: 'Citation remediation researcher',
      task: 'Repair every critic-reported citation issue in the claim ledger',
      context: args,
      instructions: [
        'For each issue: re-gather a better citation (a source you actually fetched, quote verbatim), or move the claim to a proposed-rejected list with the reason — NEVER soften a claim to dodge verification.',
        'Update the ledger file in place and report per-issue what changed.',
        'Do not touch claims with no reported issues.',
      ],
      outputFormat: 'JSON with fixed boolean, changes array (one entry per addressed issue)',
    },
    outputSchema: {
      type: 'object',
      required: ['fixed', 'changes'],
      properties: {
        fixed: { type: 'boolean' },
        changes: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rpw', 'research', 'fixer'],
}));

export const rpwClaimAdjudicationTask = defineTask('rpw.claim-adjudication', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Adjudicate ledger claims from the gate\'s critic verdicts',
  agent: {
    name: 'research-analyst',
    prompt: {
      role: 'Claim adjudicator',
      task: 'Partition the ledger into verified / contested / rejected using the gate\'s per-claim critic verdicts',
      context: args,
      instructions: [
        'verified: every citation re-fetched clean by the critics. Each verified entry must carry claimId, statement, and citations copied from the ledger.',
        'contested: survived with explicit caveats (single-source, paywalled re-fetch, minor quote drift, reliability warning) — list each caveat verbatim from critic evidence; each entry is { claim: { claimId, statement, citations }, caveats }.',
        'rejected: any claim with an unresolved citation failure — each entry is { claim, reason }.',
        'Also relay sourceQuality: the source-quality-critic\'s per-hostname verdict list, copied verbatim as [{ hostname, quality }] — the orchestrator turns these into deterministic source:* kip facts.',
        'You may NOT promote a claim past the strictest critic verdict; the orchestrator cross-checks and throws on violations.',
      ],
      outputFormat: 'JSON with verified array, contested array [{ claim, caveats }], rejected array [{ claim, reason }], sourceQuality array [{ hostname, quality }]',
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'contested', 'rejected', 'sourceQuality'],
      properties: {
        verified: { type: 'array' },
        contested: { type: 'array' },
        rejected: { type: 'array' },
        sourceQuality: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rpw', 'research', 'adjudication'],
}));

// ---------------------------------------------------------------------------
// P7 — cited synthesis + synthesis-audit fixer
// ---------------------------------------------------------------------------

export const rpwCitedSynthesisTask = defineTask('rpw.cited-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Write cited research report: ${args.researchQuestion}`,
  agent: {
    name: 'research-writer',
    prompt: {
      role: 'Research synthesist',
      task: 'Write the cited research report answering the framed question',
      context: args,
      instructions: [
        `Write markdown to ${args.reportPath}; every substantive statement carries an inline citation of a claimId from the ADMITTED set (verified + signed-off contested) — citing anything else fails the synthesis audit gate.`,
        'Render signed-off contested claims with an explicit caveat callout quoting their caveats.',
        'Structure: answer summary, per-subQuestion findings, contradictions/uncertainty section, limitations (openAmbiguities + dropped claims count), bibliography keyed by claimId.',
        'IRON LAW: an independent audit will diff every inline citation against the admitted claim set and re-read the ledger.',
      ],
      outputFormat: 'JSON with reportPath string, citedClaimIds array, uncitedStatements array (must be empty)',
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'citedClaimIds'],
      properties: {
        reportPath: { type: 'string' },
        citedClaimIds: { type: 'array' },
        uncitedStatements: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rpw', 'research', 'synthesis'],
}));

/** Fixer for the rpw.synthesis-audit adversarialGate (passed via fixer.task). */
export const rpwSynthesisFixerTask = defineTask('rpw.synthesis-fixer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix synthesis audit issues (attempt ${args.attempt})`,
  agent: {
    name: 'research-writer',
    prompt: {
      role: 'Synthesis remediation writer',
      task: 'Fix ONLY the audit-reported citation/faithfulness issues in the report',
      context: args,
      instructions: [
        'Remove or re-cite statements citing non-admitted claims; correct misrepresentations to match the ledger statement verbatim in meaning.',
        'No new claims, no scope creep.',
        'Report per-issue what changed.',
      ],
      outputFormat: 'JSON with fixed boolean, changes array',
    },
    outputSchema: {
      type: 'object',
      required: ['fixed', 'changes'],
      properties: {
        fixed: { type: 'boolean' },
        changes: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rpw', 'research', 'fixer'],
}));

// ---------------------------------------------------------------------------
// P8 — publication package + guarded publish executor
// ---------------------------------------------------------------------------

export const rpwPublicationPackageTask = defineTask('rpw.publication-package', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assemble publication package: ${args.packageDir}`,
  agent: {
    name: 'research-writer',
    prompt: {
      role: 'Publication packager',
      task: 'Assemble the publication package directory',
      context: args,
      instructions: [
        `Assemble under ${args.packageDir}: the report, bibliography, verification appendix (per-claim verdict + the executed re-fetch evidence excerpt that verified it), caveats register, and a provenance page (runId, gate attempts, sign-off status).`,
        'The appendix must let a reader audit any claim without access to this run.',
        'Report every file path written.',
      ],
      outputFormat: 'JSON with packageDir string, files array',
    },
    outputSchema: {
      type: 'object',
      required: ['packageDir', 'files'],
      properties: {
        packageDir: { type: 'string' },
        files: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rpw', 'research', 'publication'],
}));

/**
 * Publication executor — invoked ONLY when the publish-research-report breakpoint
 * returned approved === true. There is no alternate execution path.
 */
export const rpwPublishExecutorTask = defineTask('rpw.publish-executor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved publication of ${args.packageDir}`,
  agent: {
    name: 'research-publisher',
    prompt: {
      role: 'Publication executor',
      task: 'Execute the approved publication/distribution of the package',
      context: args,
      instructions: [
        'Execute exactly the distribution described in the approval context (e.g. copy into docs/research/, open the publication PR/issue) — nothing beyond it.',
        'Record the executed commands and resulting locations/URLs.',
        'IRON LAW: this task runs only under an approved===true policy gate; if the input\'s approval provenance is missing, refuse and report — do not publish.',
      ],
      outputFormat: 'JSON with published boolean, locations array, commands array',
    },
    outputSchema: {
      type: 'object',
      required: ['published', 'locations'],
      properties: {
        published: { type: 'boolean' },
        locations: { type: 'array' },
        commands: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rpw', 'research', 'publish', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P9 — kip assert (kip-librarian skill, kind research)
// ---------------------------------------------------------------------------

export const rpwKipAssertTask = defineTask('rpw.kip-assert', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assert ${args.facts.length} research facts into kip`,
  agent: {
    name: 'kip-librarian',
    skill: { name: 'kip-librarian' },
    prompt: {
      role: 'Knowledge-base librarian',
      task: 'Assert the orchestrator-built research facts into kip exactly as given',
      context: args,
      instructions: [
        KIP_LIBRARIAN_NOTE,
        KIP_CLI_NOTE,
        `Assert each provided node/edge EXACTLY as given (eids are deterministic: claim:<runId>:<claimId>, source:<hostname>, gate:<runId>:<gateId>) with kind \`research\`, passing --dir ${args.kipDir} --replica ${args.kipReplicaId} --json on every call — do not invent, merge, or reword facts.`,
        'status:"pending" echoes are BY DESIGN — never retry or report them as failures.',
        `Entity resolution, if any candidate match surfaces, uses \`kip resolve --model ${args.kipModel}\` and NEVER auto-merges — report candidates instead (merge approvals are routed breakpoints per the kip-librarian skill).`,
        'Report the asserted count and every failure with the raw CLI error — never swallow failures.',
      ],
      outputFormat: 'JSON with asserted number, failed array [{ fact, error }]',
    },
    outputSchema: {
      type: 'object',
      required: ['asserted'],
      properties: {
        asserted: { type: 'number' },
        failed: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rpw', 'research', 'kip'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    researchQuestion,
    audience = null,
    outputDir: outputDirInput,
    maxGatheringLanes = 5,
    maxParallelLanes = 3,
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
    kipReplicaId: kipReplicaIdInput,
  } = inputs || {};

  if (typeof researchQuestion !== 'string' || researchQuestion.length === 0) {
    throw new Error(
      'research-publication-workflow requires researchQuestion (non-empty string) — refusing to guess a research topic.'
    );
  }

  const outputDir = outputDirInput ?? ctx.artifactsDir;
  const kipReplicaId = kipReplicaIdInput ?? `rpw-${ctx.runId}`;
  const nowIso = () => new Date().toISOString();
  const startMs = ctx.now();

  const breakpointsHit = [];
  // ALWAYS present in outputs (possibly empty): every harness-level auto-approval of a
  // policy gate is surfaced here — fail-closed posture, nothing auto-approves silently.
  const autoApprovals = [];
  const artifacts = [];
  const timings = {};

  const recordGate = (breakpointId, phase, result) => {
    breakpointsHit.push(breakpointId);
    const auto =
      result && (result.autoApproved === true || (result.metadata && result.metadata.autoApproved === true));
    if (auto) {
      autoApprovals.push({ breakpointId, phase, at: nowIso() });
    }
    return result;
  };

  let phaseStartMs = startMs;
  const markPhase = (name) => {
    const now = ctx.now();
    timings[name] = now - phaseStartMs;
    phaseStartMs = now;
  };

  // Mutable run state referenced by buildResult (terminal returns carry full state).
  let framing = null;
  let plan = null;
  let gathering = [];
  let claimLedger = { verified: [], contested: [], rejected: [] };
  let verification = null;
  let claimSignoff = null;
  let synthesis = { reportPath: null, auditPassed: false, auditAttempts: 0 };
  let publication = { packagePath: null, approved: false, published: false, signoffResponse: null };
  let kipFactsAsserted = 0;

  const buildResult = (success, reason) => ({
    success,
    framing: framing
      ? { subQuestions: framing.subQuestions, keyTerms: framing.keyTerms ?? [], scopeBoundaries: framing.scopeBoundaries }
      : null,
    plan: plan ? { lanes: plan.lanes } : null,
    gathering,
    claimLedger,
    verification,
    claimSignoff,
    synthesis,
    publication,
    kipFactsAsserted,
    autoApprovals,
    artifacts,
    metadata: {
      processId: 'specializations/research/research-publication-workflow',
      runId: ctx.runId,
      laneCount: plan ? plan.lanes.length : 0,
      breakpointsHit,
      timings,
      ...(audience ? { audience } : {}),
      ...(reason ? { reason } : {}),
    },
  });

  // -------------------------------------------------------------------------
  // P0 — kip recall (prior claims, source reliability, insights)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P0: kip recall of prior research memory');
  let priorKnowledge = {
    factCount: 0,
    priorClaims: [],
    sourceReliability: [],
    insights: [],
    storeInitialized: false,
  };
  if (kipEnabled) {
    priorKnowledge = await ctx.task(rpwKipRecallTask, {
      researchQuestion,
      kipDir,
      kipModel,
      kipReplicaId,
    });
  }
  markPhase('kip-recall');

  // -------------------------------------------------------------------------
  // P1 — question framing (no breakpoint: openAmbiguities ride into the
  // publish-research-report breakpoint context)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P1: question framing');
  framing = await ctx.task(rpwQuestionFramingTask, {
    researchQuestion,
    audience,
    priorKnowledge,
  });
  markPhase('question-framing');

  // -------------------------------------------------------------------------
  // P2 — research plan; validateLanes throws on violations, never repairs
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P2: research plan');
  plan = await ctx.task(rpwResearchPlanTask, {
    researchQuestion,
    framing,
    priorKnowledge,
    maxGatheringLanes,
    allowedLaneMethods: ALLOWED_LANE_METHODS,
    lanePlaybooks: LANE_PLAYBOOKS,
  });
  validateLanes(plan.lanes, maxGatheringLanes);
  markPhase('research-plan');

  // -------------------------------------------------------------------------
  // P3 — parallel source gathering across independent lanes
  // -------------------------------------------------------------------------
  ctx.log?.('info', `P3: parallel source gathering across ${plan.lanes.length} lanes`);
  const runLane = (lane) =>
    ctx.task(rpwSourceGatheringTask, {
      lane,
      framing,
      priorKnowledge,
      // 'deep-web-research' has no playbook by design — the null here is a
      // documented absence (generic open-web discipline), not a fallback.
      playbook: LANE_PLAYBOOKS[lane.method] ?? null,
    });
  const gatherResults = await ctx.parallel.map(plan.lanes, runLane, {
    maxConcurrency: maxParallelLanes,
  });
  gathering = plan.lanes.map((lane, i) => ({
    lane: lane.name,
    method: lane.method,
    claimCount: gatherResults[i].claims.length,
    sourceCount: gatherResults[i].sources.length,
  }));
  markPhase('source-gathering');

  // -------------------------------------------------------------------------
  // P4 — claim consolidation into the ledger artifact (empty ledger throws)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P4: claim consolidation');
  const claimLedgerPath = `${outputDir}/claim-ledger-${ctx.runId}.json`;
  const consolidation = await ctx.task(rpwClaimConsolidationTask, {
    claimLedgerPath,
    laneCount: plan.lanes.length,
    laneResults: gatherResults,
    framing,
  });
  if (consolidation.claimCount === 0) {
    throw new Error(
      'Claim consolidation produced an empty ledger — an empty research run is a failure, not a publishable report.'
    );
  }
  artifacts.push(consolidation.claimLedgerPath);
  markPhase('claim-consolidation');

  // -------------------------------------------------------------------------
  // P5 — adversarial claim-verification gate (critics RE-FETCH every citation)
  // + adjudication into verified / contested / rejected
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P5: adversarial claim-verification gate');
  const claimGate = await adversarialGate(ctx, {
    gateId: 'rpw.claim-verification',
    artifact: { path: consolidation.claimLedgerPath, description: 'Consolidated claim ledger with citations' },
    critics: [
      {
        name: 'citation-refetch-critic',
        role: 'Adversarial citation verifier',
        focus: 'every citation independently re-fetched',
        instructions: [
          'IRON LAW: RE-FETCH every cited URL yourself (curl/WebFetch) — the gatherer\'s transcript is inadmissible; your evidence entries MUST be the executed fetch command plus a raw output excerpt per citation.',
          'A citation whose re-fetch fails, 404s, redirects to unrelated content, or does not contain support for the claim is a failing issue { claimId, citation, problem, requiredFix }.',
          'Paywalled/robots-blocked re-fetches are recorded as caveats (contestable), not silent passes.',
        ],
      },
      {
        name: 'quote-fidelity-critic',
        role: 'Quote-fidelity verifier',
        focus: 'verbatim quotes actually appear in the re-fetched content',
        instructions: [
          'Search each citation\'s quote in the re-fetched body; evidence = the executed search/grep and its output.',
          'Paraphrase drift that changes meaning is a failing issue; trivial whitespace drift is a caveat.',
        ],
      },
      {
        name: 'source-quality-critic',
        role: 'Source-quality and independence assessor',
        focus: 'reliability, independence, and corroboration of the source set',
        instructions: [
          'Assess publisher reliability and independence per source; single-source claims and self-citing circular source sets are caveats at minimum.',
          'Cross-check priorKnowledge.sourceReliability — contradicting a prior reliability fact requires explicit evidence.',
          'Emit a per-hostname quality verdict list (the orchestrator turns these into deterministic source:* kip facts).',
        ],
      },
    ],
    ironLaw: [
      'A PASS on any claim without an executed re-fetch evidence excerpt is invalid — the combinator coerces evidence-empty passes to protocol failures.',
      'Judge the ledger file on disk, not any agent\'s summary of it.',
    ],
    maxFixAttempts,
    fixer: { task: rpwClaimRemediationTask, args: { framing } },
    context: { framing, priorKnowledge },
  });
  verification = {
    passed: claimGate.passed,
    attempts: claimGate.attempts,
    escalated: claimGate.escalated,
    issues: claimGate.issues,
    evidence: claimGate.evidence,
  };
  if (claimGate.escalated) {
    breakpointsHit.push('rpw.claim-verification.gate-escalation');
  }
  if (verification.passed !== true) {
    // Fail closed: no adjudication, no synthesis, no publication on a failed gate.
    return buildResult(false, 'rpw.claim-verification gate failed (fix budget exhausted, escalation not approved) — nothing verified, nothing published');
  }

  const adjudication = await ctx.task(rpwClaimAdjudicationTask, {
    claimLedgerPath: consolidation.claimLedgerPath,
    gateIssues: claimGate.issues,
    gateEvidence: claimGate.evidence,
    framing,
  });
  if (!Array.isArray(adjudication.sourceQuality)) {
    throw new Error('Adjudication must relay the source-quality-critic\'s per-hostname verdict list (sourceQuality array) — no fallback source facts are synthesized.');
  }
  // Cross-check: a claim named in an unresolved critic issue may NOT appear in verified.
  const unresolvedClaimIds = new Set(
    claimGate.issues
      .map((issue) => issue.claimId)
      .filter((id) => typeof id === 'string' && id.length > 0)
  );
  for (const claim of adjudication.verified) {
    if (unresolvedClaimIds.has(claim.claimId)) {
      throw new Error(
        `Adjudication promoted claim '${claim.claimId}' to verified past an unresolved critic issue — the strictest critic verdict wins; promotion is forbidden.`
      );
    }
  }
  claimLedger = {
    verified: adjudication.verified,
    contested: adjudication.contested,
    rejected: adjudication.rejected,
  };
  markPhase('claim-verification');

  // -------------------------------------------------------------------------
  // P6 — claim-signoff routed breakpoint (conditional: contested claims only)
  // -------------------------------------------------------------------------
  let contestedIncluded = [];
  if (adjudication.contested.length > 0) {
    ctx.log?.('info', `P6: claim-signoff breakpoint for ${adjudication.contested.length} contested claim(s)`);
    const caveats = adjudication.contested.map((entry) => ({
      claimId: entry.claim.claimId,
      caveats: entry.caveats,
    }));
    const signoff = await routedBreakpoint(ctx, {
      question: `Sign off ${adjudication.contested.length} contested claim(s) with caveats for inclusion in the report? Reject to drop them (recorded).`,
      context: {
        runId: ctx.runId,
        files: [consolidation.claimLedgerPath],
        summary: {
          contested: adjudication.contested,
          caveats,
          verificationEvidence: claimGate.evidence,
        },
      },
    }, {
      breakpointId: 'claim-signoff',
      expert: 'research-lead',
      tags: ['policy-gated', 'research'],
      strategy: 'single',
    });
    recordGate('claim-signoff', 'P6', signoff);
    claimSignoff = {
      raised: true,
      approved: signoff.approved === true,
      caveats,
      response: signoff.response ?? null,
    };
    if (signoff.approved === true) {
      // Contested claims enter synthesis WITH their caveats attached inline.
      contestedIncluded = adjudication.contested;
    } else {
      // Dropped and recorded — never silently included.
      const droppedReason = signoff.response || 'claim-signoff rejected';
      claimLedger = {
        ...claimLedger,
        contested: [],
        rejected: [
          ...claimLedger.rejected,
          ...adjudication.contested.map((entry) => ({ claim: entry.claim, reason: 'dropped at claim-signoff', droppedReason })),
        ],
      };
    }
  } else {
    // Sparse breakpoints: no contested claims -> the claim-signoff gate is never raised.
    claimSignoff = null;
  }
  markPhase('claim-signoff');

  const admittedClaims = [
    ...adjudication.verified.map((claim) => ({ claim, verdict: 'verified', caveats: [] })),
    ...contestedIncluded.map((entry) => ({ claim: entry.claim, verdict: 'signed-off-with-caveats', caveats: entry.caveats })),
  ];
  if (admittedClaims.length === 0) {
    throw new Error(
      'No claims survived verification and sign-off — a report with zero admitted claims cannot be synthesized; the run fails instead of publishing nothing.'
    );
  }
  const admittedClaimIds = admittedClaims.map((entry) => entry.claim.claimId);

  // -------------------------------------------------------------------------
  // P7 — cited synthesis + synthesis-audit gate (unverified citations FAIL)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P7: cited synthesis + synthesis audit gate');
  const reportPath = `${outputDir}/research-report-${ctx.runId}.md`;
  await ctx.task(rpwCitedSynthesisTask, {
    researchQuestion,
    audience,
    reportPath,
    framing,
    admittedClaims,
    admittedClaimIds,
    claimLedgerPath: consolidation.claimLedgerPath,
    droppedClaimCount: claimLedger.rejected.length,
  });
  artifacts.push(reportPath);

  const synthGate = await adversarialGate(ctx, {
    gateId: 'rpw.synthesis-audit',
    artifact: { path: reportPath, description: 'Cited research report markdown' },
    critics: [
      {
        name: 'citation-coverage-critic',
        role: 'Citation-coverage auditor',
        focus: 'every inline citation maps to an admitted claimId and every substantive statement is cited',
        instructions: [
          'IRON LAW: extract every inline citation from the report file yourself and diff against the admitted claim set passed in context (verified + signed-off contested ids); evidence = the executed extraction and the diff.',
          'Any citation of a non-admitted claim, or any substantive uncited statement, is a failing issue — a report citing unverified sources MUST NOT pass.',
        ],
      },
      {
        name: 'faithful-representation-critic',
        role: 'Faithfulness auditor',
        focus: 'the report does not overstate what the verified claims support',
        instructions: [
          'Compare each report statement against the ledger statement it cites; overclaiming, dropped caveats on contested claims, or certainty language on flagged-uncertain claims are failing issues.',
          'Evidence = side-by-side report-vs-ledger excerpts.',
        ],
      },
    ],
    ironLaw: [
      'Read the report and the ledger from disk; the synthesist\'s citedClaimIds self-report is inadmissible.',
    ],
    maxFixAttempts,
    fixer: { task: rpwSynthesisFixerTask, args: { admittedClaimIds } },
    context: {
      admittedClaimIds,
      admittedClaims,
      claimLedgerPath: consolidation.claimLedgerPath,
    },
  });
  synthesis = {
    reportPath,
    auditPassed: synthGate.passed,
    auditAttempts: synthGate.attempts,
  };
  if (synthGate.escalated) {
    breakpointsHit.push('rpw.synthesis-audit.gate-escalation');
  }
  if (synthGate.passed !== true) {
    // Fail closed: a report that failed its citation audit is never packaged or published.
    return buildResult(false, 'rpw.synthesis-audit gate failed — the report cites beyond the admitted claim set; publication gate never raised');
  }
  markPhase('synthesis');

  // -------------------------------------------------------------------------
  // P8 — publication package + policy-gated publication
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P8: publication package + publish-research-report policy gate');
  const packageDir = `${outputDir}/publication-${ctx.runId}`;
  const pkg = await ctx.task(rpwPublicationPackageTask, {
    packageDir,
    reportPath,
    claimLedgerPath: consolidation.claimLedgerPath,
    admittedClaims,
    verification,
    synthesisAudit: { passed: synthGate.passed, attempts: synthGate.attempts, issues: synthGate.issues },
    claimSignoff,
    runId: ctx.runId,
  });
  for (const file of pkg.files) {
    artifacts.push(file);
  }

  const publishSignoff = await routedBreakpoint(ctx, {
    question: `Publish the research report for '${researchQuestion}'? (${adjudication.verified.length} verified claims, ${contestedIncluded.length} caveated, verification gate attempts: ${verification.attempts}, synthesis audit attempts: ${synthGate.attempts})`,
    context: {
      files: [reportPath, ...pkg.files],
      summary: {
        verification,
        synthesisAudit: { passed: synthGate.passed, attempts: synthGate.attempts },
        claimSignoff,
        openAmbiguities: framing.openAmbiguities ?? [],
      },
    },
  }, {
    breakpointId: 'publish-research-report',
    expert: 'research-lead',
    tags: ['policy-gated', 'research'],
    strategy: 'single',
  });
  recordGate('publish-research-report', 'P8', publishSignoff);

  publication = {
    packagePath: pkg.packageDir,
    approved: publishSignoff.approved === true,
    published: false,
    signoffResponse: publishSignoff.response ?? null,
  };
  if (publishSignoff.approved === true) {
    // The executor runs ONLY under this guard — there is no alternate publish path.
    const executed = await ctx.task(rpwPublishExecutorTask, {
      packageDir: pkg.packageDir,
      reportPath,
      approval: {
        breakpointId: 'publish-research-report',
        approved: true,
        response: publishSignoff.response ?? null,
      },
    });
    publication = { ...publication, published: executed.published === true, locations: executed.locations };
  } else {
    // Rejected: the package remains on disk, nothing distributes, the response is
    // recorded — the run ends success:false after the kip assert below.
    ctx.log?.('info', 'P8: publish-research-report rejected — package retained on disk, nothing distributed');
  }
  markPhase('publication');

  // -------------------------------------------------------------------------
  // P9 — deterministic kip assert (facts built by the orchestrator, never agents)
  // -------------------------------------------------------------------------
  if (kipEnabled) {
    ctx.log?.('info', 'P9: kip assert of verified claims, source quality, and gate outcomes');
    const facts = [];
    for (const entry of admittedClaims) {
      facts.push({
        type: 'node',
        eid: `claim:${ctx.runId}:${entry.claim.claimId}`,
        kind: 'research',
        props: {
          statement: entry.claim.statement,
          question: researchQuestion,
          verdict: entry.verdict,
          citationCount: entry.claim.citations.length,
          runId: ctx.runId,
        },
      });
    }
    for (const sourceVerdict of adjudication.sourceQuality) {
      facts.push({
        type: 'node',
        eid: `source:${sourceVerdict.hostname}`,
        kind: 'research',
        props: {
          quality: sourceVerdict.quality,
          lastVerifiedAt: nowIso(),
          runId: ctx.runId,
        },
      });
    }
    facts.push({
      type: 'node',
      eid: `gate:${ctx.runId}:rpw.claim-verification`,
      kind: 'research',
      props: { passed: verification.passed, attempts: verification.attempts, escalated: verification.escalated },
    });
    facts.push({
      type: 'node',
      eid: `gate:${ctx.runId}:rpw.synthesis-audit`,
      kind: 'research',
      props: { passed: synthGate.passed, attempts: synthGate.attempts, escalated: synthGate.escalated },
    });
    for (const entry of admittedClaims) {
      for (const citation of entry.claim.citations) {
        facts.push({
          type: 'edge',
          kind: 'cites',
          from: `claim:${ctx.runId}:${entry.claim.claimId}`,
          to: `source:${hostnameOf(citation.url)}`,
        });
      }
    }
    const asserted = await ctx.task(rpwKipAssertTask, {
      facts,
      kipDir,
      kipModel,
      kipReplicaId,
    });
    kipFactsAsserted = asserted.asserted;
  }
  markPhase('kip-assert');
  timings.total = ctx.now() - startMs;

  if (publication.approved !== true) {
    return buildResult(false, 'publish-research-report gate rejected — report verified and packaged but never distributed (fail-closed)');
  }
  return buildResult(publication.published === true);
}
