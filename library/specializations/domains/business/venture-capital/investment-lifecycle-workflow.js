/**
 * @process venture-capital/investment-lifecycle-workflow
 * @description End-to-end venture investment lifecycle: sourcing intake and thesis fit, kip
 *   recall of prior passes and founder/market facts, evidence-backed screening, a declared
 *   diligence plan, six parallel diligence workstreams (market/commercial, technical, team,
 *   financial, legal, ESG) via ctx.parallel.all, an adversarial diligence-completeness gate
 *   that EXECUTES a coverage check of every workstream against the declared plan, parallel
 *   valuation triangulation (comparables, DCF, VC-method) plus an ownership/cap-table model,
 *   investment-memo drafting, an adversarial bear-case gate whose critics attack the memo's
 *   claims and re-verify key diligence findings against source artifacts by file:line, an IC
 *   decision routed through a FROZEN check-size authority matrix with a throwing lookup,
 *   policy-gated term-sheet issuance, a bounded term-sheet negotiation loop with per-round
 *   severity-routed approvals, syndication and definitive documents, policy-gated irreversible
 *   capital wiring at close, a portfolio-monitoring cadence mapped over portfolio companies,
 *   follow-on/reserve commitment decisions, and kip assert of the investment decision and
 *   thesis outcomes.
 * @inputs {
 *   company: object,                // required — { name (required), sector (required), stage?, founders?: [{ name, role }], dataRoomPath? }; missing name/sector throws (no fallbacks)
 *   thesis: string,                 // required — fund thesis reference the deal is screened against; throws if absent
 *   proposedCheckSizeUsd: number,   // required — finite proposed check size; anchors the authority-matrix routing; throws if absent or non-finite
 *   postMoneyValuationUsd: number,  // required — finite, positive post-money; anchors deterministic ownership; throws if absent, non-finite, or non-positive
 *   fundContextPath: string,        // required — fund/portfolio context artifact (reserve pool, concentration limits, existing positions); throws if absent
 *   portfolioCompanies?: array,     // default [] — [{ companyId, name, sector }]; the monitoring cadence maps over these; an empty array records the cadence as skipped, never silently omitted
 *   reservePoolUsd?: number,        // default 0 — reserve capital available for follow-ons; a request beyond remaining reserves raises no breakpoint (never trimmed to fit)
 *   maxNegotiationRounds?: number,  // default 3 — bounded term-sheet negotiation loop
 *   maxFixAttempts?: number,        // default 2 — adversarial gate fixer budget
 *   kipEnabled?: boolean,           // default true
 *   kipDir?: string,                // default '.a5c/kip'
 *   kipModel?: string               // default 'sonnet'
 * }
 * @outputs {
 *   success: boolean,
 *   recall: object,                 // { factCount, insights }
 *   screening: object,              // { thesisFit, score, criteria [{ id, criterion, status, evidence[] }], passReasons }
 *   diligence: object,              // { plan, workstreams [{ workstreamId, complete, findingsCount, artifacts, redFlags }], coverage [{ workstreamId, covered, complete, missingArtifacts }], uncovered, incomplete, gate { passed, attempts, escalated, issues, evidence } }
 *   valuation: object,              // { comparables, dcf, vcMethod, triangulatedRangeUsd, ownership { checkSizeUsd, postMoneyValuationUsd, ownershipPct }, capTablePath, reconciliation }
 *   memo: object,                   // { memoPath, claims[], gate { passed, attempts, escalated, issues, evidence }, bearCase { risks[], disconfirmingEvidence[] } }
 *   icDecision: object,             // { approved, breakpointId, expert, tier, checkSizeUsd, ownershipPct, response }
 *   termSheet: object,              // { termSheetPath, issuance { approved, breakpointId, expert, response }, rounds [{ round, nonStandardTerms, approval, settled }], deviationRegister, settled, exhausted, exhaustionDecision?, withdrawal? }
 *   close: object,                  // { syndicationPlanPath, definitiveDocsPath, wiring { approved, breakpointId, expert, response }, closePackagePath, executed }
 *   portfolio: object,              // { reviews [{ companyId, riskRating, valueCreationActions, reviewPath }], skipped }
 *   followOn: object,               // { recommendations [{ companyId, requestedUsd, rationale }], decisions [{ companyId, breakpointId, expert, approved, response, committedUsd }], reserveRemainingUsd }
 *   policyDecisions: array,         // fail-closed audit: [{ actionId, breakpointId, expert, approved, response, autoApproved, autoApprovalProvenance?, at }]
 *   kipFactsAsserted: number,
 *   artifacts: array,
 *   metadata: object                // { processId, runId, company, breakpointsHit, timings, autoApprovals }
 * }
 * @graph
 *   domains: [domain:venture-capital, domain:business]
 *   specializations: [specialization:venture-capital]
 *   skillAreas: [skill-area:due-diligence, skill-area:portfolio-management]
 *   workflows: [workflow:deal-lifecycle]
 *   topics: [topic:risk-management, topic:decision-making]
 *   roles: [role:investor, role:general-partner, role:cfo]
 * @composes BY NAME (in prompt prose only — this module never imports or orchestrates any of
 *   them): proactive-deal-sourcing.js, deal-flow-tracking.js, commercial-due-diligence.js,
 *   technical-due-diligence.js, financial-due-diligence.js, legal-due-diligence.js,
 *   esg-due-diligence.js, management-team-assessment.js, comparable-analysis.js,
 *   dcf-analysis.js, vc-method-valuation.js, cap-table-modeling.js,
 *   investment-committee-process.js, term-sheet-drafting.js,
 *   definitive-document-negotiation.js, co-investor-syndication.js, board-engagement.js,
 *   portfolio-value-creation.js, portfolio-risk-rating.js, reserve-management.js,
 *   quarterly-portfolio-reporting.js
 * @policyGatedActions investment-lifecycle.ic-investment-decision (investment-committee,
 *   matrix-routed by check size), investment-lifecycle.term-sheet-issuance (general-partner),
 *   investment-lifecycle.capital-wiring-close (cfo — irreversible),
 *   investment-lifecycle.follow-on-commitment (investment-committee),
 *   investment-lifecycle.signed-loi-withdrawal (general-partner) — each via routedBreakpoint
 *   with breakpointId = actionId, tags ['policy-gated','venture-capital'], strategy 'single',
 *   NEVER auto-approved (no autoApproveAfterN, no presentAlwaysApprove)
 * @example
 * const result = await orchestrate('venture-capital/investment-lifecycle-workflow', {
 *   company: { name: 'Northwind Robotics', sector: 'industrial-automation', stage: 'series-a', dataRoomPath: 'dataroom/northwind/' },
 *   thesis: 'applied-automation-thesis-2026',
 *   proposedCheckSizeUsd: 6000000,
 *   postMoneyValuationUsd: 40000000,
 *   fundContextPath: 'fund/fund-iii-context.json',
 *   reservePoolUsd: 12000000,
 *   maxNegotiationRounds: 3
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../../../common-utilities/routed-gate-combinators.js';

const PROCESS_ID = 'venture-capital/investment-lifecycle-workflow';
const KIP_KIND = 'investment-decision';

// Canonical policy-gated action ids. breakpointId === actionId EXACTLY for each,
// which is what adapters/policy YAML matches on. These are PLAIN single-quoted
// literals with no interpolation so the match can never drift.
const ACTION_IC_DECISION = 'investment-lifecycle.ic-investment-decision';
const ACTION_TERM_SHEET_ISSUANCE = 'investment-lifecycle.term-sheet-issuance';
const ACTION_CAPITAL_WIRING_CLOSE = 'investment-lifecycle.capital-wiring-close';
const ACTION_FOLLOW_ON_COMMITMENT = 'investment-lifecycle.follow-on-commitment';
const ACTION_SIGNED_LOI_WITHDRAWAL = 'investment-lifecycle.signed-loi-withdrawal';

// ---------------------------------------------------------------------------
// Frozen check-size authority matrix + deterministic helpers (process code)
// ---------------------------------------------------------------------------

/**
 * Frozen delegated-authority tiers for committing fund capital. The array AND
 * every tier are frozen: the matrix is policy, not runtime-tunable state.
 * 'investment-committee' is present in every tier so the declared
 * policyGatedActions expert always routes. Beyond the deepest tier there is NO
 * route — routeCheckApproval throws instead of defaulting an expert, clamping
 * the ask, or widening the deepest tier (fallbacks forbidden).
 */
export const CHECK_SIZE_AUTHORITY_MATRIX = Object.freeze([
  Object.freeze({ maxCheckUsd: 1000000, tier: 'partner-quorum', expert: 'investment-committee' }),
  Object.freeze({
    maxCheckUsd: 10000000,
    tier: 'full-partnership',
    expert: Object.freeze(['investment-committee', 'managing-partner']),
  }),
  Object.freeze({
    maxCheckUsd: 25000000,
    tier: 'lpac-consent',
    expert: Object.freeze(['investment-committee', 'managing-partner', 'lp-advisory-committee']),
  }),
]);

const MAX_DELEGATED_CHECK_USD = 25000000;

/**
 * Pure throwing lookup: returns the FIRST frozen tier whose maxCheckUsd covers
 * the check. Never returns a default expert, never clamps, never widens the
 * deepest tier — a check beyond the deepest tier THROWS.
 *
 * @param {number} checkSizeUsd - Proposed or requested check size in USD
 * @returns {{maxCheckUsd: number, tier: string, expert: string|string[]}} The routing tier
 */
export function routeCheckApproval(checkSizeUsd) {
  if (!Number.isFinite(checkSizeUsd) || checkSizeUsd <= 0) {
    throw new Error(
      `routeCheckApproval: checkSizeUsd must be a finite number greater than 0 (got ${JSON.stringify(checkSizeUsd)})`
    );
  }
  for (const tier of CHECK_SIZE_AUTHORITY_MATRIX) {
    if (checkSizeUsd <= tier.maxCheckUsd) {
      return tier;
    }
  }
  throw new Error(
    `check size of $${checkSizeUsd} exceeds maximum delegated authority ($${MAX_DELEGATED_CHECK_USD}) — no approval route exists (fallbacks forbidden; an LPA concentration waiver is a separate process, not a default expert)`
  );
}

/**
 * Deterministic ownership computation in process code — the ownership number
 * shown at the IC breakpoint is computed HERE, never trusted from an agent
 * (sdw recomputeMargin precedent).
 *
 * @param {{checkSizeUsd: number, postMoneyValuationUsd: number}} args - Deal economics
 * @returns {{checkSizeUsd: number, postMoneyValuationUsd: number, ownershipPct: number}} Ownership table
 */
export function computeOwnershipPct({ checkSizeUsd, postMoneyValuationUsd } = {}) {
  if (!Number.isFinite(checkSizeUsd) || !Number.isFinite(postMoneyValuationUsd)) {
    throw new Error(
      `computeOwnershipPct: checkSizeUsd and postMoneyValuationUsd must both be finite numbers (got ${JSON.stringify({ checkSizeUsd, postMoneyValuationUsd })})`
    );
  }
  if (postMoneyValuationUsd <= 0) {
    throw new Error(
      `computeOwnershipPct: ownership is undefined at a non-positive post-money (got ${JSON.stringify(postMoneyValuationUsd)})`
    );
  }
  return {
    checkSizeUsd,
    postMoneyValuationUsd,
    ownershipPct: (checkSizeUsd / postMoneyValuationUsd) * 100,
  };
}

/**
 * Executed set comparison of the DECLARED diligence plan against the delivered
 * workstream results. This is the same computation the completeness critic must
 * paste as evidence; the process recomputes it and does not trust the critic
 * verdict alone (clw computeCoverage precedent).
 *
 * A workstream counts as covered ONLY when a result exists for it AND
 * result.complete === true AND every declared requiredArtifact appears in
 * result.artifacts.
 *
 * @param {{workstreams: Array<{workstreamId: string, requiredArtifacts?: string[]}>}} plan - The declared plan
 * @param {Array<{workstreamId: string, complete?: boolean, artifacts?: string[]}>} workstreamResults - Delivered results
 * @returns {{coverage: Array<object>, uncovered: string[], incomplete: string[]}} Coverage table
 */
export function computeDiligenceCoverage(plan, workstreamResults) {
  if (!plan || !Array.isArray(plan.workstreams)) {
    throw new Error(
      `computeDiligenceCoverage: plan.workstreams must be an array (got ${JSON.stringify(plan)})`
    );
  }
  if (!Array.isArray(workstreamResults)) {
    throw new Error(
      `computeDiligenceCoverage: workstreamResults must be an array (got ${JSON.stringify(workstreamResults)})`
    );
  }

  const delivered = new Map();
  for (const result of workstreamResults) {
    if (result && result.workstreamId) {
      delivered.set(result.workstreamId, result);
    }
  }

  const coverage = [];
  const uncovered = [];
  const incomplete = [];
  for (const workstream of plan.workstreams) {
    if (!workstream || !workstream.workstreamId) {
      throw new Error(
        `computeDiligenceCoverage: every declared workstream needs a workstreamId (got ${JSON.stringify(workstream)})`
      );
    }
    const result = delivered.has(workstream.workstreamId)
      ? delivered.get(workstream.workstreamId)
      : null;
    const deliveredArtifacts = result && Array.isArray(result.artifacts) ? result.artifacts : [];
    const requiredArtifacts = Array.isArray(workstream.requiredArtifacts)
      ? workstream.requiredArtifacts
      : [];
    const missingArtifacts = requiredArtifacts.filter((a) => !deliveredArtifacts.includes(a));
    const complete = result !== null && result.complete === true;
    const covered = complete && missingArtifacts.length === 0;

    coverage.push({
      workstreamId: workstream.workstreamId,
      covered,
      complete,
      missingArtifacts,
      requiredArtifacts,
      deliveredArtifacts,
    });
    if (!covered) uncovered.push(workstream.workstreamId);
    if (!complete) incomplete.push(workstream.workstreamId);
  }

  return { coverage, uncovered, incomplete };
}

/**
 * Deterministic reserve availability. A follow-on request beyond remaining
 * reserves is NOT silently trimmed — the process refuses to raise the follow-on
 * breakpoint and records an insufficient-reserves decision instead.
 *
 * @param {{reservePoolUsd: number, committedReserveUsd: number, requestedUsd: number}} args - Reserve state
 * @returns {{reservePoolUsd: number, committedReserveUsd: number, requestedUsd: number, remainingUsd: number, sufficient: boolean}} Availability
 */
export function computeReserveAvailability({ reservePoolUsd, committedReserveUsd, requestedUsd } = {}) {
  const values = { reservePoolUsd, committedReserveUsd, requestedUsd };
  for (const [key, value] of Object.entries(values)) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(
        `computeReserveAvailability: ${key} must be a finite non-negative number (got ${JSON.stringify(values)})`
      );
    }
  }
  const remainingUsd = reservePoolUsd - committedReserveUsd;
  return {
    reservePoolUsd,
    committedReserveUsd,
    requestedUsd,
    remainingUsd,
    sufficient: requestedUsd <= remainingUsd,
  };
}

/**
 * Deterministic triangulation across the three independent valuation methods.
 * Computed in process code so the range the IC sees is never an agent's claim.
 *
 * @param {Array<{method: string, rangeUsd: {lowUsd: number, midUsd: number, highUsd: number}}>} methodResults - Method outputs
 * @returns {{lowUsd: number, midUsd: number, highUsd: number, methods: Array<object>}} Triangulated range
 */
export function computeTriangulatedRange(methodResults) {
  if (!Array.isArray(methodResults) || methodResults.length === 0) {
    throw new Error(
      `computeTriangulatedRange: methodResults must be a non-empty array (got ${JSON.stringify(methodResults)})`
    );
  }
  const methods = [];
  for (const entry of methodResults) {
    const range = entry && entry.rangeUsd;
    if (
      !range ||
      !Number.isFinite(range.lowUsd) ||
      !Number.isFinite(range.midUsd) ||
      !Number.isFinite(range.highUsd)
    ) {
      throw new Error(
        `computeTriangulatedRange: every method must report a finite { lowUsd, midUsd, highUsd } (got ${JSON.stringify(entry)})`
      );
    }
    methods.push({
      method: entry.method,
      lowUsd: range.lowUsd,
      midUsd: range.midUsd,
      highUsd: range.highUsd,
    });
  }
  return {
    lowUsd: Math.min(...methods.map((m) => m.lowUsd)),
    midUsd: methods.reduce((sum, m) => sum + m.midUsd, 0) / methods.length,
    highUsd: Math.max(...methods.map((m) => m.highUsd)),
    methods,
  };
}

/**
 * Fail-closed audit push for one policy-gated decision. Every policy-gated
 * breakpoint in this process passes autoApproved as literal provenance. If a
 * non-interactive harness ever auto-resolves a breakpoint, the record carries
 * autoApproved:true WITH autoApprovalProvenance — an auto-approval is surfaced
 * explicitly in the returned metadata, never silently applied.
 */
export function recordPolicyDecision(decisions, {
  actionId,
  breakpointId,
  expert,
  approved,
  response,
  autoApproved,
  autoApprovalProvenance,
  at,
}) {
  decisions.push({
    actionId,
    breakpointId,
    expert,
    approved: approved === true,
    response: response ?? null,
    autoApproved: autoApproved === true,
    ...(autoApprovalProvenance && { autoApprovalProvenance }),
    at,
  });
}

// ---------------------------------------------------------------------------
// P1 — sourcing intake
// ---------------------------------------------------------------------------

export const sourcingIntakeTask = defineTask('ilw.sourcing-intake', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sourcing intake: ${args.company.name}`,
  agent: {
    name: 'deal-scout',
    prompt: {
      role: 'Venture deal scout',
      task: `Capture the sourcing and deal-flow record for ${args.company.name}`,
      context: args,
      instructions: [
        'Capture the sourcing record for the company: origin (inbound|outbound|referral|portfolio-intro), referral path with named introducer, first-contact date, competitive-process signals, current pipeline stage, and riskFlags.',
        'These are the dimensions of venture-capital/proactive-deal-sourcing.js and venture-capital/deal-flow-tracking.js — for a full standalone sourcing or pipeline run use those processes; this task performs the intake slice inline.',
        'riskFlags cover missing or ambiguous data (unverified founder identity, undisclosed prior rounds, stale data room) — flagged explicitly, never inferred or invented.',
        'Do not screen the deal here — thesis-fit screening is a separate evidence-backed phase.',
      ],
      outputFormat: 'JSON with sourcingRecord object, dealName string, stakeholders array [{ name, role }], riskFlags array',
    },
    outputSchema: {
      type: 'object',
      required: ['sourcingRecord', 'dealName', 'stakeholders', 'riskFlags'],
      properties: {
        sourcingRecord: { type: 'object' },
        dealName: { type: 'string' },
        stakeholders: { type: 'array' },
        riskFlags: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'sourcing'],
}));

// ---------------------------------------------------------------------------
// P3 — thesis-fit screening
// ---------------------------------------------------------------------------

export const thesisFitScreeningTask = defineTask('ilw.thesis-fit-screening', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thesis-fit screening: ${args.company.name}`,
  agent: {
    name: 'pipeline-coordinator',
    prompt: {
      role: 'Investment screening analyst',
      task: `Screen ${args.company.name} against the ${args.thesis} fund thesis with evidence-backed criteria`,
      context: args,
      instructions: [
        'Score the opportunity against the fund thesis across: market attractiveness, product/technology differentiation, team credibility, stage/check-size fit, competitive dynamics, and portfolio-construction fit.',
        'These are the pipeline dimensions of venture-capital/deal-flow-tracking.js — for a full standalone pipeline run use that process; this task performs the screening slice inline.',
        'Each criterion is { id, criterion, status: met|unmet|unknown, evidence } — a criterion CANNOT be marked met without at least one concrete evidence entry (data-room document path, founder-call note, market source, or a recalled kip fact citation).',
        'Honor recalled facts: a prior pass on this company or founder adjusts status and MUST be cited in evidence with the reason the prior pass is or is not still binding.',
        'thesisFit:false requires passReasons naming which criteria failed and why — an honest terminal verdict, never softened to keep the run alive.',
      ],
      outputFormat: 'JSON with thesisFit boolean, score number, criteria array [{ id, criterion, status, evidence }], passReasons array',
    },
    outputSchema: {
      type: 'object',
      required: ['thesisFit', 'score', 'criteria', 'passReasons'],
      properties: {
        thesisFit: { type: 'boolean' },
        score: { type: 'number' },
        criteria: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['id', 'criterion', 'status', 'evidence'],
            properties: {
              status: { type: 'string', enum: ['met', 'unmet', 'unknown'] },
              evidence: { type: 'array', minItems: 1, items: { type: 'string' } },
            },
          },
        },
        passReasons: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'screening'],
}));

// ---------------------------------------------------------------------------
// P4 — diligence plan declaration (the contract the completeness gate executes
// coverage against — written BEFORE the workstreams run so coverage can never
// be retro-fitted to whatever the workstreams happened to produce)
// ---------------------------------------------------------------------------

export const diligencePlanTask = defineTask('ilw.diligence-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Diligence plan: ${args.company.name}`,
  agent: {
    name: 'dd-coordinator',
    prompt: {
      role: 'Diligence coordinator',
      task: `Declare the six-workstream diligence plan for ${args.company.name}`,
      context: args,
      instructions: [
        'Declare the diligence plan BEFORE any workstream runs: exactly the six workstreams market-commercial, technical, team, financial, legal, esg.',
        'Per workstream declare { workstreamId, objective, mandatoryQuestions[], requiredArtifacts[] } — requiredArtifacts are the artifact paths the completeness gate executes coverage against, so name them precisely and do not pad the list with items no workstream can produce.',
        'Declare planPath (written to artifactsDir) and the machine-readable plan object in the same shape — the gate reads the object, the humans read the file.',
        'Do NOT weaken a workstream to whatever you expect it to deliver; the plan is the contract, the workstreams answer to it.',
      ],
      outputFormat: 'JSON with planPath string, workstreams array [{ workstreamId, objective, mandatoryQuestions, requiredArtifacts }]',
    },
    outputSchema: {
      type: 'object',
      required: ['planPath', 'workstreams'],
      properties: {
        planPath: { type: 'string' },
        workstreams: {
          type: 'array',
          minItems: 6,
          items: {
            type: 'object',
            required: ['workstreamId', 'objective', 'mandatoryQuestions', 'requiredArtifacts'],
            properties: {
              workstreamId: { type: 'string' },
              mandatoryQuestions: { type: 'array', minItems: 1, items: { type: 'string' } },
              requiredArtifacts: { type: 'array', minItems: 1, items: { type: 'string' } },
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
  labels: ['agent', 'ilw', 'venture-capital', 'diligence', 'plan'],
}));

// ---------------------------------------------------------------------------
// P5 — the six parallel diligence workstreams. Shared output contract:
// { workstreamId, complete, findings[], redFlags[], artifacts[], unansweredQuestions[] }
// with findings minItems 1 (each requiring a sourceRef) and artifacts minItems 1.
// ---------------------------------------------------------------------------

const WORKSTREAM_OUTPUT_FORMAT =
  'JSON with workstreamId string, complete boolean, findings array [{ findingId, finding, sourceRef, confidence }], redFlags array, artifacts array of paths, unansweredQuestions array';

const workstreamOutputSchema = {
  type: 'object',
  required: ['workstreamId', 'complete', 'findings', 'redFlags', 'artifacts', 'unansweredQuestions'],
  properties: {
    workstreamId: { type: 'string' },
    complete: { type: 'boolean' },
    findings: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['findingId', 'finding', 'sourceRef'],
        properties: {
          findingId: { type: 'string' },
          finding: { type: 'string' },
          sourceRef: { type: 'string' },
          confidence: { type: 'string' },
        },
      },
    },
    redFlags: { type: 'array' },
    artifacts: { type: 'array', minItems: 1, items: { type: 'string' } },
    unansweredQuestions: { type: 'array' },
  },
};

const WORKSTREAM_COMMON_INSTRUCTIONS = [
  'Write the workstream artifact(s) to artifactsDir and report their paths in artifacts[] so the completeness gate can match them against the plan requiredArtifacts.',
  'Report complete:false with unansweredQuestions[] when the data room cannot answer a mandatory question — an honest incomplete workstream BLOCKS the IC gate and that is the intended behavior. Never pad findings to look complete.',
  'Do NOT read or depend on any other workstream output — the six workstreams run in parallel.',
];

export const marketDiligenceTask = defineTask('ilw.market-diligence', (args, taskCtx) => ({
  kind: 'agent',
  title: `Market/commercial diligence: ${args.company.name}`,
  agent: {
    name: 'market-analyst',
    prompt: {
      role: 'Market and commercial diligence analyst',
      task: `Run the market-commercial diligence workstream for ${args.company.name}`,
      context: args,
      instructions: [
        'Answer every mandatoryQuestion for the market-commercial workstream in the declared plan: TAM/SAM/SOM with method, customer concentration, churn and retention evidence, competitive positioning, pricing power, channel economics.',
        'These are the dimensions of venture-capital/commercial-due-diligence.js — for a full standalone run use that process; this task performs the market/commercial workstream slice inline.',
        'Every finding is { findingId, finding, sourceRef, confidence } and sourceRef is REQUIRED (data-room path with section/line, customer-reference note, or cited market source) — an unsourced finding is inadmissible and the memo cannot cite it.',
        ...WORKSTREAM_COMMON_INSTRUCTIONS,
      ],
      outputFormat: WORKSTREAM_OUTPUT_FORMAT,
    },
    outputSchema: workstreamOutputSchema,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'diligence', 'market'],
}));

export const technicalDiligenceTask = defineTask('ilw.technical-diligence', (args, taskCtx) => ({
  kind: 'agent',
  title: `Technical diligence: ${args.company.name}`,
  agent: {
    name: 'technical-assessor',
    prompt: {
      role: 'Technical diligence assessor',
      task: `Run the technical diligence workstream for ${args.company.name}`,
      context: args,
      instructions: [
        'Answer every mandatoryQuestion for the technical workstream: architecture and scalability, code quality and delivery velocity, security posture, technical debt, IP ownership of the codebase, key-person dependency, and third-party/model dependencies.',
        'These are the dimensions of venture-capital/technical-due-diligence.js — for a full standalone run use that process; this task performs the technical workstream slice inline.',
        'Every finding is { findingId, finding, sourceRef, confidence }; sourceRef REQUIRED and must point at an inspected artifact (repo path with line, architecture doc section, security report page) — vendor assurances repeated without an inspected artifact are recorded as unverified claims, not findings.',
        ...WORKSTREAM_COMMON_INSTRUCTIONS,
      ],
      outputFormat: WORKSTREAM_OUTPUT_FORMAT,
    },
    outputSchema: workstreamOutputSchema,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'diligence', 'technical'],
}));

export const teamDiligenceTask = defineTask('ilw.team-diligence', (args, taskCtx) => ({
  kind: 'agent',
  title: `Team diligence: ${args.company.name}`,
  agent: {
    name: 'people-evaluator',
    prompt: {
      role: 'Management-team assessor',
      task: `Run the team diligence workstream for ${args.company.name}`,
      context: args,
      instructions: [
        'Answer every mandatoryQuestion for the team workstream: founder track record, domain credibility, complementarity and gaps, hiring plan realism, reference-check signal, equity alignment and vesting, and governance readiness.',
        'These are the dimensions of venture-capital/management-team-assessment.js — for a full standalone run use that process; this task performs the team workstream slice inline.',
        'Every finding is { findingId, finding, sourceRef, confidence }; sourceRef REQUIRED (reference-call note path, verified employment record, or a recalled kip founder fact with its citation).',
        'Recalled founder facts must be cited when they change an assessment — a prior pass reason that still applies is a red flag, not a footnote.',
        ...WORKSTREAM_COMMON_INSTRUCTIONS,
      ],
      outputFormat: WORKSTREAM_OUTPUT_FORMAT,
    },
    outputSchema: workstreamOutputSchema,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'diligence', 'team'],
}));

export const financialDiligenceTask = defineTask('ilw.financial-diligence', (args, taskCtx) => ({
  kind: 'agent',
  title: `Financial diligence: ${args.company.name}`,
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'Financial diligence analyst',
      task: `Run the financial diligence workstream for ${args.company.name}`,
      context: args,
      instructions: [
        'Answer every mandatoryQuestion for the financial workstream: revenue quality and recognition, unit economics (CAC/LTV/payback), burn and runway, gross margin bridge, cohort retention, existing debt and obligations, and the historicals-to-projections bridge.',
        'These are the dimensions of venture-capital/financial-due-diligence.js — for a full standalone run use that process; this task performs the financial workstream slice inline.',
        'Every finding is { findingId, finding, sourceRef, confidence }; sourceRef REQUIRED and must cite the exact statement/tab/line inspected. Restate any number you rely on WITH its arithmetic — a number copied from a founder deck without a source statement is an unverified claim, not a finding.',
        ...WORKSTREAM_COMMON_INSTRUCTIONS,
      ],
      outputFormat: WORKSTREAM_OUTPUT_FORMAT,
    },
    outputSchema: workstreamOutputSchema,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'diligence', 'financial'],
}));

export const legalDiligenceTask = defineTask('ilw.legal-diligence', (args, taskCtx) => ({
  kind: 'agent',
  title: `Legal diligence: ${args.company.name}`,
  agent: {
    name: 'legal-reviewer',
    prompt: {
      role: 'Legal diligence reviewer',
      task: `Run the legal diligence workstream for ${args.company.name}`,
      context: args,
      instructions: [
        'Answer every mandatoryQuestion for the legal workstream: corporate structure and cap-table integrity, prior-round rights and preferences, IP assignment coverage for every contributor, material contracts and change-of-control clauses, litigation and regulatory exposure, and employment/contractor classification.',
        'These are the dimensions of venture-capital/legal-due-diligence.js — for a full standalone run use that process; this task performs the legal workstream slice inline.',
        'Every finding is { findingId, finding, sourceRef, confidence }; sourceRef REQUIRED with document path plus clause/section. Missing documents are reported as missingDocuments findings — an absent IP assignment is a finding, never a silent skip.',
        ...WORKSTREAM_COMMON_INSTRUCTIONS,
      ],
      outputFormat: WORKSTREAM_OUTPUT_FORMAT,
    },
    outputSchema: workstreamOutputSchema,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'diligence', 'legal'],
}));

export const esgDiligenceTask = defineTask('ilw.esg-diligence', (args, taskCtx) => ({
  kind: 'agent',
  title: `ESG diligence: ${args.company.name}`,
  agent: {
    name: 'esg-analyst',
    prompt: {
      role: 'ESG diligence analyst',
      task: `Run the ESG diligence workstream for ${args.company.name}`,
      context: args,
      instructions: [
        'Answer every mandatoryQuestion for the ESG workstream: environmental footprint and disclosure readiness, labor and DEI practices, supply-chain and sourcing exposure, data-privacy and responsible-AI posture, governance structures, and LP-mandate exclusions.',
        'These are the dimensions of venture-capital/esg-due-diligence.js — for a full standalone run use that process; this task performs the ESG workstream slice inline.',
        'Every finding is { findingId, finding, sourceRef, confidence }; sourceRef REQUIRED. An LP-mandate exclusion hit is a redFlag with the exact mandate clause cited — never downgraded to a note.',
        ...WORKSTREAM_COMMON_INSTRUCTIONS,
      ],
      outputFormat: WORKSTREAM_OUTPUT_FORMAT,
    },
    outputSchema: workstreamOutputSchema,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'diligence', 'esg'],
}));

// ---------------------------------------------------------------------------
// P6 — completeness-gate fixer
// ---------------------------------------------------------------------------

export const diligenceGapFillTask = defineTask('ilw.diligence-gap-fill', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fill diligence gaps: ${args.company.name} (attempt ${args.attempt})`,
  agent: {
    name: 'dd-coordinator',
    prompt: {
      role: 'Diligence gap remediator',
      task: `Close the diligence coverage gaps the completeness critics reported for ${args.company.name}`,
      context: args,
      instructions: [
        'Address every gap the completeness critics reported: the uncovered workstreams, the missing requiredArtifacts, and the unanswered mandatoryQuestions listed in context.',
        'Produce the missing artifacts where the data room supports them, and where it does not, report the gap as unresolvable with the reason — do NOT fabricate an artifact to satisfy a coverage check.',
        'Report per-gap what changed so the next critic round can verify; an unresolvable gap keeps the workstream incomplete and the IC gate stays blocked.',
      ],
      outputFormat: 'JSON with fixed boolean, changes array, unresolvableGaps array [{ workstreamId, gap, reason }]',
    },
    outputSchema: {
      type: 'object',
      required: ['fixed', 'changes', 'unresolvableGaps'],
      properties: {
        fixed: { type: 'boolean' },
        changes: { type: 'array' },
        unresolvableGaps: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'quality-gate', 'fixer', 'ilw.diligence-completeness'],
}));

// ---------------------------------------------------------------------------
// P7 — valuation triangulation (three independent methods) + ownership model
// ---------------------------------------------------------------------------

export const comparablesValuationTask = defineTask('ilw.comparables-valuation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Comparables valuation: ${args.company.name}`,
  agent: {
    name: 'valuation-specialist',
    prompt: {
      role: 'Comparable-company valuation analyst',
      task: `Derive the comparables-based valuation range for ${args.company.name}`,
      context: args,
      instructions: [
        'Build the comparable-company and comparable-transaction set with selection criteria stated, then derive the implied valuation range with the multiple and the driver named per comp.',
        'These are the dimensions of venture-capital/comparable-analysis.js — for a full standalone run use that process; this task performs the comparables slice inline.',
        'Every comp carries a sourceRef; an unsourced comp is inadmissible. Report the range as { lowUsd, midUsd, highUsd } plus method notes.',
        'Do NOT read or depend on the DCF or VC-method outputs — the three valuation methods run in parallel precisely so they do not anchor on each other.',
      ],
      outputFormat: 'JSON with method string, rangeUsd object { lowUsd, midUsd, highUsd }, comps array [{ name, multiple, driver, sourceRef }], notes string',
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'rangeUsd', 'comps'],
      properties: {
        method: { type: 'string' },
        rangeUsd: {
          type: 'object',
          required: ['lowUsd', 'midUsd', 'highUsd'],
          properties: {
            lowUsd: { type: 'number' },
            midUsd: { type: 'number' },
            highUsd: { type: 'number' },
          },
        },
        comps: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['name', 'multiple', 'sourceRef'] },
        },
        notes: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'valuation', 'comparables'],
}));

export const dcfValuationTask = defineTask('ilw.dcf-valuation', (args, taskCtx) => ({
  kind: 'agent',
  title: `DCF valuation: ${args.company.name}`,
  agent: {
    name: 'sensitivity-analyst',
    prompt: {
      role: 'DCF valuation analyst',
      task: `Build the discounted-cash-flow valuation for ${args.company.name}`,
      context: args,
      instructions: [
        'Build the DCF: projection basis grounded in the financial workstream verified historicals, explicit discount rate and terminal-value method with justification, and a sensitivity table across the two dominant drivers.',
        'These are the dimensions of venture-capital/dcf-analysis.js — for a full standalone run use that process; this task performs the DCF slice inline.',
        'Every assumption is { assumption, value, sourceRef } — an assumption sourced only to the founder deck must be labelled as such in sourceRef, not laundered into a verified input.',
        'Report the range as { lowUsd, midUsd, highUsd } from the sensitivity table, not a single point.',
        'Do NOT read or depend on the comparables or VC-method outputs — the three valuation methods run in parallel.',
      ],
      outputFormat: 'JSON with method string, rangeUsd object { lowUsd, midUsd, highUsd }, assumptions array [{ assumption, value, sourceRef }], sensitivityTablePath string',
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'rangeUsd', 'assumptions', 'sensitivityTablePath'],
      properties: {
        method: { type: 'string' },
        rangeUsd: {
          type: 'object',
          required: ['lowUsd', 'midUsd', 'highUsd'],
          properties: {
            lowUsd: { type: 'number' },
            midUsd: { type: 'number' },
            highUsd: { type: 'number' },
          },
        },
        assumptions: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['assumption', 'value', 'sourceRef'] },
        },
        sensitivityTablePath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'valuation', 'dcf'],
}));

export const vcMethodValuationTask = defineTask('ilw.vc-method-valuation', (args, taskCtx) => ({
  kind: 'agent',
  title: `VC-method valuation: ${args.company.name}`,
  agent: {
    name: 'valuation-specialist',
    prompt: {
      role: 'VC-method valuation analyst',
      task: `Run the VC-method valuation for ${args.company.name}`,
      context: args,
      instructions: [
        'Run the VC method: exit-value hypothesis with the comparable exit cited, required return / target multiple stated as fund-level policy, expected dilution path to exit, and the implied post-money today.',
        'These are the dimensions of venture-capital/vc-method-valuation.js — for a full standalone run use that process; this task performs the VC-method slice inline.',
        'State the arithmetic explicitly: implied post-money = exit value divided by target multiple, adjusted for the stated dilution path. Show the computation, do not assert the result.',
        'Report the range as { lowUsd, midUsd, highUsd } across the exit-value scenarios.',
        'Do NOT read or depend on the comparables or DCF outputs — the three valuation methods run in parallel.',
      ],
      outputFormat: 'JSON with method string, rangeUsd object { lowUsd, midUsd, highUsd }, exitScenarios array [{ scenario, exitValueUsd, targetMultiple, dilutionPct, sourceRef }], notes string',
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'rangeUsd', 'exitScenarios'],
      properties: {
        method: { type: 'string' },
        rangeUsd: {
          type: 'object',
          required: ['lowUsd', 'midUsd', 'highUsd'],
          properties: {
            lowUsd: { type: 'number' },
            midUsd: { type: 'number' },
            highUsd: { type: 'number' },
          },
        },
        exitScenarios: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['scenario', 'exitValueUsd', 'targetMultiple', 'sourceRef'],
          },
        },
        notes: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'valuation', 'vc-method'],
}));

export const ownershipModelTask = defineTask('ilw.ownership-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Ownership and cap-table model: ${args.company.name}`,
  agent: {
    name: 'cap-table-modeler',
    prompt: {
      role: 'Cap-table modeler',
      task: `Model the post-round cap table and dilution path for ${args.company.name}`,
      context: args,
      instructions: [
        'Model the post-round cap table at the proposed check size and post-money: pre-round holders, option pool (state pre- or post-money shuffle explicitly), the new round, and dilution to exit across the stated future-round path.',
        'These are the dimensions of venture-capital/cap-table-modeling.js — for a full standalone run use that process; this task performs the ownership slice inline.',
        'IRON-LAW CONTRACT: context.ownership.ownershipPct was computed deterministically in process code as checkSizeUsd divided by postMoneyValuationUsd times 100. Your modelled ownership MUST reconcile to it. If your cap-table structure produces a different number (option-pool shuffle, converting instruments, side letters), report the divergence in reconciliation with both numbers and the structural reason — NEVER overwrite the deterministic number silently.',
        'Write the cap-table artifact to artifactsDir and report capTablePath.',
        'Reconcile against the legal workstream cap-table-integrity findings; a conflict is a reported finding, not a resolved assumption.',
      ],
      outputFormat: 'JSON with capTablePath string, modelledOwnershipPct number, reconciliation object { deterministicOwnershipPct, modelledOwnershipPct, divergenceReason }, dilutionPath array',
    },
    outputSchema: {
      type: 'object',
      required: ['capTablePath', 'modelledOwnershipPct', 'reconciliation'],
      properties: {
        capTablePath: { type: 'string' },
        modelledOwnershipPct: { type: 'number' },
        reconciliation: {
          type: 'object',
          required: ['deterministicOwnershipPct', 'modelledOwnershipPct'],
        },
        dilutionPath: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'valuation', 'cap-table'],
}));

// ---------------------------------------------------------------------------
// P8 — investment memo (also the bear-case gate fixer: the combinator hands the
// critics' issues to the fixer, so the factory treats args.issues as feedback)
// ---------------------------------------------------------------------------

export const investmentMemoTask = defineTask('ilw.investment-memo', (args, taskCtx) => {
  const feedback = args.feedback ?? args.issues ?? null;
  return {
    kind: 'agent',
    title: feedback
      ? `Revise investment memo: ${args.company.name} (gate feedback)`
      : `Investment memo: ${args.company.name}`,
    agent: {
      name: 'ic-presenter',
      prompt: {
        role: 'Investment memo author',
        task: `Write the investment-committee memo for ${args.company.name}`,
        context: { ...args, feedback },
        instructions: [
          'Write the IC memo to artifactsDir (memoPath): thesis fit, market, product/technology, team, financial picture, valuation triangulation with all three method ranges, deal structure and ownership, key risks with mitigations, and the recommendation with the proposed check size.',
          'These are the dimensions of venture-capital/investment-committee-process.js — for a full standalone IC run use that process; this task performs the memo slice inline.',
          'IRON-LAW CONTRACT: every material claim is emitted in claims[] as { claimId, claim, sourceRef } where sourceRef cites a diligence artifact path WITH a line or section anchor. The bear-case gate re-opens those artifacts and re-verifies at file:line — a claim whose sourceRef does not support it FAILS the gate. Do not cite the memo itself, another claim, or a founder deck as the source of a diligence finding.',
          'Every redFlag raised by any workstream must appear in the memo risk section with its disposition; an omitted red flag is an automatic gate failure.',
          'Present the deterministic ownership number from context.ownership verbatim; if the cap-table model diverged, present BOTH with the structural reason.',
          'Do NOT soften an incomplete workstream into a narrative — the process blocks on incompleteness before this task runs, so every workstream you cite is complete.',
          feedback
            ? `Revision round (gate fixer): address ONLY the listed issues, keep everything else unchanged, and report what changed. Feedback: ${JSON.stringify(feedback)}`
            : 'First drafting round: no gate feedback to address.',
        ],
        outputFormat: 'JSON with memoPath string, claims array [{ claimId, claim, sourceRef }], risks array [{ riskId, risk, severity, mitigation, sourceRef }], recommendation string, proposedCheckSizeUsd number',
      },
      outputSchema: {
        type: 'object',
        required: ['memoPath', 'claims', 'risks', 'recommendation'],
        properties: {
          memoPath: { type: 'string' },
          claims: {
            type: 'array',
            minItems: 1,
            items: { type: 'object', required: ['claimId', 'claim', 'sourceRef'] },
          },
          risks: {
            type: 'array',
            minItems: 1,
            items: { type: 'object', required: ['riskId', 'risk', 'severity', 'sourceRef'] },
          },
          recommendation: { type: 'string' },
          proposedCheckSizeUsd: { type: 'number' },
        },
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    },
    labels: ['agent', 'ilw', 'venture-capital', 'memo'],
  };
});

// ---------------------------------------------------------------------------
// P11/P12 — term sheet drafting and the bounded negotiation loop
// ---------------------------------------------------------------------------

export const termSheetDraftTask = defineTask('ilw.term-sheet-draft', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Revise term sheet: ${args.company.name} (issuance feedback)`
    : `Term sheet draft: ${args.company.name}`,
  agent: {
    name: 'term-sheet-negotiator',
    prompt: {
      role: 'Term-sheet drafter',
      task: `Draft the term sheet for ${args.company.name} at the IC-approved check size`,
      context: args,
      instructions: [
        'Draft the term sheet to artifactsDir (termSheetPath) at the IC-approved check size and ownership target: valuation and pre/post-money, security type, liquidation preference, option pool, board composition, protective provisions, pro-rata and information rights, no-shop and expiry.',
        'These are the dimensions of venture-capital/term-sheet-drafting.js — for a full standalone run use that process; this task performs the drafting slice inline.',
        'IRON-LAW CONTRACT: every risk in context.bearCaseRisks must map to either a term-sheet mitigation (name the clause) or an explicit acceptedWithoutMitigation entry with the reason. A risk that silently disappears is a protocol failure.',
        'Mark each term binding or non-binding explicitly — no-shop and confidentiality typically bind on signature, and the issuance approver is entitled to see which clauses commit the fund.',
        args.feedback
          ? `Issuance revision round: address ONLY the feedback directive, keep everything else unchanged, and report what changed. Feedback: ${JSON.stringify(args.feedback)}`
          : 'First drafting round: no issuance feedback to address.',
      ],
      outputFormat: 'JSON with termSheetPath string, terms array [{ termId, category, position, binding }], riskMitigationMap array [{ riskId, clause, acceptedWithoutMitigation, reason }], changes array',
    },
    outputSchema: {
      type: 'object',
      required: ['termSheetPath', 'terms', 'riskMitigationMap'],
      properties: {
        termSheetPath: { type: 'string' },
        terms: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['termId', 'category', 'position', 'binding'],
          },
        },
        riskMitigationMap: {
          type: 'array',
          items: { type: 'object', required: ['riskId'] },
        },
        changes: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'term-sheet'],
}));

export const negotiationRoundAnalysisTask = defineTask('ilw.negotiation-round-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Term-sheet negotiation round ${args.round}: ${args.company.name}`,
  agent: {
    name: 'term-sheet-negotiator',
    prompt: {
      role: 'Term-sheet negotiation analyst',
      task: `Analyze term-sheet negotiation round ${args.round} with ${args.company.name}`,
      context: args,
      instructions: [
        'Ingest the company counter for this round; if no counterparty response artifact exists yet, report settled:false with pendingExternal:true and empty nonStandardTerms — an honest state, not a fallback.',
        'For every counter: acceptable-per-fund-standard (fold in, listed in acceptedPerStandard) or a non-standard term { termId, category, description, ourPosition, companyPosition, deviationSeverity }.',
        'deviationSeverity routing rule (verbatim): economic-deviation for valuation, check size, liquidation preference, option-pool shuffle, and pro-rata rights; governance-deviation for board composition, protective provisions, and information rights; standard-deviation otherwise. NEVER downgrade a severity to dodge escalation — the routing reads the value you report and understating it is a protocol failure.',
        'Write the round summary to artifactsDir (roundSummaryPath) with per-term positions for the approval payload.',
        'settled:true only when no open terms remain and the company has accepted the current term sheet.',
      ],
      outputFormat: 'JSON with nonStandardTerms array [{ termId, category, description, ourPosition, companyPosition, deviationSeverity }], acceptedPerStandard array, settled boolean, pendingExternal boolean, openTerms array, roundSummaryPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['nonStandardTerms', 'settled', 'openTerms', 'roundSummaryPath'],
      properties: {
        nonStandardTerms: {
          type: 'array',
          items: {
            type: 'object',
            required: ['termId', 'category', 'description', 'ourPosition', 'companyPosition', 'deviationSeverity'],
            properties: {
              deviationSeverity: {
                type: 'string',
                enum: ['standard-deviation', 'governance-deviation', 'economic-deviation'],
              },
            },
          },
        },
        acceptedPerStandard: { type: 'array' },
        settled: { type: 'boolean' },
        pendingExternal: { type: 'boolean' },
        openTerms: { type: 'array' },
        roundSummaryPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'negotiation'],
}));

export const counterTermSheetTask = defineTask('ilw.counter-term-sheet', (args, taskCtx) => ({
  kind: 'agent',
  title: `Counter term sheet (round ${args.round}): ${args.company.name}`,
  agent: {
    name: 'term-sheet-negotiator',
    prompt: {
      role: 'Counter term-sheet drafter',
      task: `Produce the round-${args.round} counter term sheet under the approver directive`,
      context: args,
      instructions: [
        'Apply ONLY the approver directive (args.directive) plus the rejected terms to produce the next-round counter term sheet; report updatedTermSheetPath.',
        'Preserve every already-approved position unchanged; list changes per term.',
        'No scope creep — do not re-open settled terms to create trading room.',
      ],
      outputFormat: 'JSON with updatedTermSheetPath string, changes array (one entry per term changed)',
    },
    outputSchema: {
      type: 'object',
      required: ['updatedTermSheetPath', 'changes'],
      properties: {
        updatedTermSheetPath: { type: 'string' },
        changes: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'negotiation', 'fixer'],
}));

// ---------------------------------------------------------------------------
// P14 — syndication + definitive documents
// ---------------------------------------------------------------------------

export const syndicationPlanTask = defineTask('ilw.syndication-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Syndication plan: ${args.company.name}`,
  agent: {
    name: 'syndicate-manager',
    prompt: {
      role: 'Syndicate manager',
      task: `Build the co-investor syndication plan for ${args.company.name}`,
      context: args,
      instructions: [
        'Build the syndicate plan to artifactsDir (syndicationPlanPath): allocation split, co-investor list with fit rationale, lead/follow roles, information-sharing constraints, and confidentiality obligations before any diligence material leaves the fund.',
        'These are the dimensions of venture-capital/co-investor-syndication.js — for a full standalone run use that process; this task performs the syndication slice inline.',
        'Report allocationGapUsd explicitly when the round is not fully covered — an uncovered allocation is a reported gap, never a silently assumed fill.',
        'Every co-investor entry carries a fitRationale; do not list a name without one.',
      ],
      outputFormat: 'JSON with syndicationPlanPath string, coInvestors array [{ name, allocationUsd, role, fitRationale }], allocationGapUsd number',
    },
    outputSchema: {
      type: 'object',
      required: ['syndicationPlanPath', 'coInvestors', 'allocationGapUsd'],
      properties: {
        syndicationPlanPath: { type: 'string' },
        coInvestors: {
          type: 'array',
          items: { type: 'object', required: ['name', 'allocationUsd', 'fitRationale'] },
        },
        allocationGapUsd: { type: 'number' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'syndication'],
}));

export const definitiveDocsTask = defineTask('ilw.definitive-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Definitive documents: ${args.company.name}`,
  agent: {
    name: 'deal-counsel-coordinator',
    prompt: {
      role: 'Deal counsel coordinator',
      task: `Coordinate the definitive documents and closing conditions for ${args.company.name}`,
      context: args,
      instructions: [
        'Coordinate the definitive documents (stock purchase agreement, investors rights, voting, ROFR/co-sale) against the negotiated term sheet; report definitiveDocsPath and the closing-conditions checklist with per-condition satisfaction evidence.',
        'These are the dimensions of venture-capital/definitive-document-negotiation.js — for a full standalone run use that process; this task performs the definitive-documents slice inline.',
        'IRON-LAW CONTRACT: every entry in context.deviationRegister must be reconciled into a document clause. Report unreconciledDeviations explicitly — a negotiated deviation that does not reach the documents is a finding, never a drop.',
        'Report every unsatisfied closing condition with what is outstanding; the wiring approver reads this list.',
      ],
      outputFormat: 'JSON with definitiveDocsPath string, closingConditions array [{ conditionId, description, satisfied, evidenceRef }], unreconciledDeviations array',
    },
    outputSchema: {
      type: 'object',
      required: ['definitiveDocsPath', 'closingConditions', 'unreconciledDeviations'],
      properties: {
        definitiveDocsPath: { type: 'string' },
        closingConditions: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['conditionId', 'description', 'satisfied'] },
        },
        unreconciledDeviations: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'definitive-docs'],
}));

// ---------------------------------------------------------------------------
// P15 — close executor (GUARDED: invoked ONLY inside
// `if (wiringApproval.approved === true)` — money movement is irreversible)
// ---------------------------------------------------------------------------

export const closeExecutionTask = defineTask('ilw.close-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Close execution: ${args.company.name}`,
  agent: {
    name: 'closing-manager',
    prompt: {
      role: 'Closing manager',
      task: `Execute and record the approved close for ${args.company.name}`,
      context: args,
      instructions: [
        'EXECUTOR: this task runs only after the investment-lifecycle.capital-wiring-close policy gate approved the wire. Record the close EXACTLY as approved — the wire amount, security, and ownership are the approved values with no post-approval edits.',
        'If context.approvalProvenance is absent or reports approved !== true, REFUSE to execute and report the refusal — an unapproved wire must never be recorded as executed.',
        'Write the close package to artifactsDir (closePackagePath): funded amount, final ownership, all policyDecisions records, the deviation register, both gate records, the closing-conditions checklist, and post-close obligations.',
        'Report thesisMarkers [{ marker, targetValue, checkpointDate, evidenceRef }] — the falsifiable markers the thesis will be judged against later. evidenceRef is REQUIRED per marker; an untraceable marker is a finding to report, never a fact to assert.',
        'Any closing condition still unsatisfied at wire time is reported explicitly in the package — never marked satisfied to complete the checklist.',
      ],
      outputFormat: 'JSON with closePackagePath string, fundedAmountUsd number, finalOwnershipPct number, thesisMarkers array [{ marker, targetValue, checkpointDate, evidenceRef }]',
    },
    outputSchema: {
      type: 'object',
      required: ['closePackagePath', 'fundedAmountUsd', 'finalOwnershipPct', 'thesisMarkers'],
      properties: {
        closePackagePath: { type: 'string' },
        fundedAmountUsd: { type: 'number' },
        finalOwnershipPct: { type: 'number' },
        thesisMarkers: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['marker', 'targetValue', 'evidenceRef'] },
        },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'policy-gated', 'close'],
}));

// ---------------------------------------------------------------------------
// P16 — portfolio monitoring cadence + reserve recommendations
// ---------------------------------------------------------------------------

export const portfolioCompanyReviewTask = defineTask('ilw.portfolio-company-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Portfolio review: ${args.portfolioCompany.name}`,
  agent: {
    name: 'value-creation-lead',
    prompt: {
      role: 'Portfolio value-creation lead',
      task: `Run the monitoring review for portfolio company ${args.portfolioCompany.name}`,
      context: args,
      instructions: [
        'Review one portfolio company: board-cycle status and open board asks, value-creation actions with owners, a risk rating with the driver named, and the reporting-pack status.',
        'These are the dimensions of venture-capital/board-engagement.js, venture-capital/portfolio-value-creation.js, venture-capital/portfolio-risk-rating.js, and venture-capital/quarterly-portfolio-reporting.js — for full standalone runs use those processes; this task performs the per-company monitoring slice inline.',
        'Every signal is { signal, sourceRef } — board deck page, KPI report path, or reporting-pack reference. An unsourced signal cannot drive a follow-on recommendation.',
        'Report followOnSignal explicitly as recommend, hold, or no, with the reason; write the review artifact and report reviewPath.',
        'You review ONLY the company in args.portfolioCompany — do not read or depend on the other mapped reviews.',
      ],
      outputFormat: 'JSON with companyId string, riskRating string, signals array [{ signal, sourceRef }], valueCreationActions array [{ action, owner, dueDate }], followOnSignal string, reviewPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['companyId', 'riskRating', 'signals', 'followOnSignal', 'reviewPath'],
      properties: {
        companyId: { type: 'string' },
        riskRating: { type: 'string' },
        signals: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['signal', 'sourceRef'] },
        },
        valueCreationActions: { type: 'array' },
        followOnSignal: { type: 'string', enum: ['recommend', 'hold', 'no'] },
        reviewPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'portfolio', 'monitoring'],
}));

export const reserveRecommendationTask = defineTask('ilw.reserve-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reserve and follow-on recommendation: ${args.company.name}`,
  agent: {
    name: 'fund-accountant',
    prompt: {
      role: 'Reserve and follow-on analyst',
      task: 'Recommend follow-on allocations from the portfolio reviews and the fund context',
      context: args,
      instructions: [
        'From the portfolio reviews and the fund context at fundContextPath, recommend follow-on allocations: per company { companyId, requestedUsd, rationale, expectedOwnershipPct, sourceRef }.',
        'These are the dimensions of venture-capital/reserve-management.js — for a full standalone run use that process; this task performs the reserve slice inline.',
        'Recommend ONLY for companies whose review reported followOnSignal recommend; a recommendation for a hold or no company is a protocol failure.',
        'Do NOT size a request against remaining reserves — request what the position warrants and state it. The process computes reserve availability deterministically and refuses an unfunded request explicitly; trimming an ask to fit is a fallback and is forbidden.',
        'Report reserveModelPath with the allocation model behind the requests.',
      ],
      outputFormat: 'JSON with recommendations array [{ companyId, requestedUsd, rationale, expectedOwnershipPct, sourceRef }], reserveModelPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'reserveModelPath'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            required: ['companyId', 'requestedUsd', 'rationale', 'sourceRef'],
          },
        },
        reserveModelPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'portfolio', 'reserves'],
}));

// ---------------------------------------------------------------------------
// P17 — thesis outcome synthesis (feeds the kip assert)
// ---------------------------------------------------------------------------

export const thesisOutcomeSynthesisTask = defineTask('ilw.thesis-outcome-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thesis outcome synthesis: ${args.company.name}`,
  agent: {
    name: 'portfolio-reporter',
    prompt: {
      role: 'Portfolio outcome reporter',
      task: `Synthesize the durable thesis outcomes of this investment run for ${args.company.name}`,
      context: args,
      instructions: [
        'Synthesize the run into durable thesis outcomes: which thesis markers were set at close, which bear-case risks were mitigated by terms versus accepted, which diligence red flags remain open, and what the follow-on posture is.',
        'Every outcome is { outcome, evidenceRef } and evidenceRef is REQUIRED — it points at a task result, an artifact path, or a breakpoint record. An untraceable outcome is reported in untraceableFindings and is NOT asserted into kip.',
        'Write the synthesis artifact and report synthesisPath. Be factual — this feeds the fund durable memory and a fabricated outcome poisons every future recall.',
      ],
      outputFormat: 'JSON with outcomes array [{ outcome, evidenceRef }], untraceableFindings array, synthesisPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['outcomes', 'synthesisPath'],
      properties: {
        outcomes: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['outcome', 'evidenceRef'] },
        },
        untraceableFindings: { type: 'array' },
        synthesisPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'ilw', 'venture-capital', 'outcomes'],
}));

// ---------------------------------------------------------------------------
// Gate specs — critic sets + gate-specific IRON LAW. The gate-specific strings
// are appended AFTER the combinator built-in IRON-LAW block, so the required
// { passed, issues[], evidence[] } shape and the executed-evidence demands are
// the last thing every critic reads (batch-4 verdict-schema-drift lesson).
// ---------------------------------------------------------------------------

const DILIGENCE_GATE_ID = 'ilw.diligence-completeness';

const DILIGENCE_IRON_LAW = [
  'Evidence entries MUST be executed: paste the actual coverage computation (the declared workstream/artifact lists, the delivered lists, and the computed difference). "Coverage looks complete" is a protocol failure.',
  'The coverage check is EXECUTED: compute the plan-vs-delivered set difference YOURSELF and paste it — per workstream AND per requiredArtifact.',
  'Cite artifacts by file:line (or file plus section anchor) — document-level impressions are protocol failures.',
  'Output verdict as JSON with EXACTLY this shape: { "passed": boolean, "issues": [{ "severity": string, "description": string, "location": string }], "evidence": [string] }. passed:true with an empty evidence array is rejected.',
];

const DILIGENCE_CRITICS = [
  {
    name: 'diligence-coverage-critic',
    role: 'Adversarial diligence-coverage gatekeeper',
    focus: 'every declared workstream ran to completion and produced every required artifact — executed coverage check required',
    instructions: [
      'EXECUTED CHECK (required): load the declared plan.workstreams and the six workstream results from context, compute per workstream (a) did it run, (b) is complete === true, (c) which requiredArtifacts are missing from its artifacts[]; paste the full computed table into evidence. A verdict without this executed table is invalid.',
      'Any workstream with complete:false is an automatic issue naming its unansweredQuestions — an incomplete workstream BLOCKS the IC gate and must not be talked past.',
      'Any requiredArtifact absent from the delivered artifacts is an automatic issue naming both the declared path and what was delivered instead.',
      'Attack silent scope reduction: a workstream that answered fewer mandatoryQuestions than the plan declared fails, with the missing questions quoted verbatim.',
    ],
  },
  {
    name: 'finding-provenance-critic',
    role: 'Adversarial finding-provenance gatekeeper',
    focus: 'every diligence finding is genuinely sourced — fabricated or founder-deck-laundered sourceRefs fail',
    instructions: [
      'EXECUTED CHECK (required): sample the findings across all six workstreams, OPEN each cited sourceRef, and paste the quoted line or section next to the finding it supposedly supports. A verdict without pasted quotations is invalid.',
      'A sourceRef that does not exist, does not resolve, or does not contain the claimed content fails with the citation quoted.',
      'A finding sourced only to founder-supplied material but presented as verified fails — name the finding and the laundering.',
      'Any redFlag that appears in a workstream findings but not in its redFlags array is an issue.',
    ],
  },
];

const BEAR_CASE_GATE_ID = 'ilw.bear-case-challenge';

const BEAR_CASE_IRON_LAW = [
  'Evidence entries MUST be executed re-verification: open the cited diligence artifact and paste the quoted line WITH its file:line (or file plus section) anchor next to the memo claim it is supposed to support. Narrative disagreement is not evidence.',
  'The claim check is EXECUTED: take the memo claims[] and re-open each cited sourceRef YOURSELF; an unsupported claim is an automatic FAIL with the claim and the actual source text quoted side by side.',
  'You are attacking the deal. A PASS verdict means the bear case was built honestly and the memo survived it — not that no bear case exists.',
  'Output verdict as JSON with EXACTLY this shape: { "passed": boolean, "issues": [{ "severity": string, "description": string, "location": string }], "evidence": [string] }. passed:true with an empty evidence array is rejected.',
];

const BEAR_CASE_CRITICS = [
  {
    name: 'bear-case-critic',
    role: 'Adversarial bear-case gatekeeper',
    focus: 'construct the strongest disconfirming case against the thesis from the diligence artifacts — a memo that has no bear case has not been diligenced',
    instructions: [
      'Build the bear case: for every thesis pillar in the memo, state the strongest disconfirming reading supported by the diligence artifacts, each substantiated with a file:line citation into a workstream artifact. A risk you cannot substantiate from an artifact is NOT admissible — say so rather than inventing one.',
      'EXECUTED CHECK (required): cross-check every workstream redFlag against the memo risks[]; paste the computed difference. Any red flag missing from the memo is an automatic issue.',
      'Attack mitigations: a mitigation with no mechanism (a term, a milestone, a governance right) is an assertion and fails with the mitigation text quoted.',
      'Attack the valuation: if the memo recommended entry price sits above the triangulated range without a written justification, that is an issue with the numbers quoted.',
      'Report the bear-case risks you substantiated inside issues[] with severity and the file:line citation in location — the IC payload carries them and the term sheet must map each to a mitigation or an explicit acceptance.',
    ],
  },
  {
    name: 'claim-verification-critic',
    role: 'Adversarial claim-verification gatekeeper',
    focus: 'every material memo claim is re-verifiable at its cited source — an unsupported claim fails the gate',
    instructions: [
      'EXECUTED CHECK (required): for every entry in memo.claims[], open the cited sourceRef at the given line/section and paste the source text beside the claim. A verdict without these pasted pairs is invalid.',
      'A claim whose source does not exist, does not resolve, or does not say what the claim says FAILS with both texts quoted — no benefit of the doubt, no "substantially supported".',
      'A claim citing the memo itself, another claim, or founder-supplied material presented as diligence-verified FAILS with the circular or laundered citation named.',
      'EXECUTED CHECK (required): re-verify the key financial and ownership numbers in the memo against the financial workstream artifacts and the deterministic ownership table in context; paste the arithmetic. Any mismatch fails with both numbers quoted.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    company,
    thesis,
    proposedCheckSizeUsd,
    postMoneyValuationUsd,
    fundContextPath,
    portfolioCompanies = [],
    reservePoolUsd = 0,
    maxNegotiationRounds = 3,
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs || {};

  // P0 — pre-flight validation. No fallbacks: every anchor input is required and
  // a run without one is unactionable.
  if (!company || !company.name) {
    throw new Error('investment-lifecycle-workflow requires company.name — there is no default company (fallbacks forbidden).');
  }
  if (!company.sector) {
    throw new Error('investment-lifecycle-workflow requires company.sector — thesis screening has no default sector (fallbacks forbidden).');
  }
  if (!thesis) {
    throw new Error('investment-lifecycle-workflow requires thesis — there is no default fund thesis to screen against (fallbacks forbidden).');
  }
  if (!Number.isFinite(proposedCheckSizeUsd)) {
    throw new Error('investment-lifecycle-workflow requires a finite proposedCheckSizeUsd — the authority matrix has no default check size (fallbacks forbidden).');
  }
  if (!Number.isFinite(postMoneyValuationUsd) || postMoneyValuationUsd <= 0) {
    throw new Error('investment-lifecycle-workflow requires a finite, positive postMoneyValuationUsd — ownership is undefined without it (fallbacks forbidden).');
  }
  if (!fundContextPath) {
    throw new Error('investment-lifecycle-workflow requires fundContextPath — reserve and follow-on math have no default fund context (fallbacks forbidden).');
  }
  if (!Array.isArray(portfolioCompanies)) {
    throw new Error(`investment-lifecycle-workflow requires portfolioCompanies to be an array (got ${JSON.stringify(portfolioCompanies)}).`);
  }
  if (!Number.isFinite(reservePoolUsd) || reservePoolUsd < 0) {
    throw new Error(`investment-lifecycle-workflow requires a finite non-negative reservePoolUsd (got ${JSON.stringify(reservePoolUsd)}).`);
  }

  const startTime = ctx.now();
  const timings = {};
  const breakpointsHit = [];
  const artifacts = [];
  const artifactsDir = ctx.artifactsDir;
  const sharedArgs = {
    company,
    thesis,
    proposedCheckSizeUsd,
    postMoneyValuationUsd,
    fundContextPath,
    kipDir,
    kipModel,
    artifactsDir,
  };

  // Mutable run state — buildResult reads these so every early return still
  // yields the full output shape with the decision recorded.
  let sourcing = null;
  let recall = null;
  let screening = null;
  let diligencePlan = null;
  let workstreamResults = [];
  let coverage = null;
  let diligenceGate = null;
  let comparables = null;
  let dcf = null;
  let vcMethod = null;
  let triangulatedRangeUsd = null;
  let ownership = null;
  let capTable = null;
  let memo = null;
  let bearGate = null;
  let bearCaseRisks = [];
  let icDecision = null;
  let termSheet = null;
  let termSheetIssuance = null;
  const negotiationRounds = [];
  const deviationRegister = [];
  let settled = false;
  let exhausted = false;
  let exhaustionDecision = null;
  let withdrawal = null;
  let openTerms = [];
  let syndication = null;
  let definitiveDocs = null;
  let wiring = null;
  let closePackage = null;
  let portfolioReviews = [];
  let portfolioSkipped = false;
  let reservePlan = null;
  const followOnDecisions = [];
  let committedReserveUsd = 0;
  const policyDecisions = [];
  const autoApprovals = [];
  let kipFactsAsserted = 0;

  const buildResult = (success, reason) => ({
    success,
    recall: recall ? { factCount: recall.factCount, insights: recall.insights } : null,
    screening: screening
      ? {
          thesisFit: screening.thesisFit,
          score: screening.score,
          criteria: screening.criteria,
          passReasons: screening.passReasons,
        }
      : null,
    diligence: diligencePlan
      ? {
          plan: { planPath: diligencePlan.planPath, workstreams: diligencePlan.workstreams },
          workstreams: workstreamResults.map((w) => ({
            workstreamId: w.workstreamId,
            complete: w.complete === true,
            findingsCount: Array.isArray(w.findings) ? w.findings.length : 0,
            artifacts: Array.isArray(w.artifacts) ? w.artifacts : [],
            redFlags: Array.isArray(w.redFlags) ? w.redFlags : [],
            unansweredQuestions: Array.isArray(w.unansweredQuestions) ? w.unansweredQuestions : [],
          })),
          coverage: coverage ? coverage.coverage : null,
          uncovered: coverage ? coverage.uncovered : null,
          incomplete: coverage ? coverage.incomplete : null,
          gate: diligenceGate
            ? {
                passed: diligenceGate.passed,
                attempts: diligenceGate.attempts,
                escalated: diligenceGate.escalated,
                issues: diligenceGate.issues,
                evidence: diligenceGate.evidence,
              }
            : null,
        }
      : null,
    valuation: ownership
      ? {
          comparables,
          dcf,
          vcMethod,
          triangulatedRangeUsd,
          ownership,
          capTablePath: capTable ? capTable.capTablePath : null,
          reconciliation: capTable ? capTable.reconciliation : null,
        }
      : null,
    memo: memo
      ? {
          memoPath: memo.memoPath,
          claims: memo.claims,
          gate: bearGate
            ? {
                passed: bearGate.passed,
                attempts: bearGate.attempts,
                escalated: bearGate.escalated,
                issues: bearGate.issues,
                evidence: bearGate.evidence,
              }
            : null,
          bearCase: {
            risks: bearCaseRisks,
            disconfirmingEvidence: bearGate ? bearGate.evidence : [],
          },
        }
      : null,
    icDecision,
    termSheet: termSheet
      ? {
          termSheetPath: termSheet.termSheetPath,
          issuance: termSheetIssuance,
          rounds: negotiationRounds,
          deviationRegister,
          settled,
          exhausted,
          ...(exhaustionDecision && { exhaustionDecision }),
          ...(withdrawal && { withdrawal }),
        }
      : null,
    close: {
      syndicationPlanPath: syndication ? syndication.syndicationPlanPath : null,
      definitiveDocsPath: definitiveDocs ? definitiveDocs.definitiveDocsPath : null,
      wiring,
      closePackagePath: closePackage ? closePackage.closePackagePath : null,
      executed: closePackage !== null,
    },
    portfolio: { reviews: portfolioReviews, skipped: portfolioSkipped },
    followOn: {
      recommendations: reservePlan ? reservePlan.recommendations : [],
      decisions: followOnDecisions,
      reserveRemainingUsd: reservePoolUsd - committedReserveUsd,
    },
    policyDecisions,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: PROCESS_ID,
      runId: ctx.runId,
      company: company.name,
      breakpointsHit,
      timings: { ...timings, total: ctx.now() - startTime },
      autoApprovals,
      ...(reason && { reason }),
    },
  });

  // Fail-closed recording of one policy-gated decision. A non-interactive
  // auto-approval is recorded WITH its provenance and mirrored into
  // metadata.autoApprovals — surfaced explicitly, never silently applied.
  const notePolicyDecision = ({ actionId, breakpointId, expert, decision }) => {
    const at = ctx.now();
    const autoApproved = decision.autoApproved === true;
    const autoApprovalProvenance = autoApproved
      ? {
          actionId,
          breakpointId,
          expert,
          resolvedBy: decision.respondedBy ?? 'non-interactive-harness',
          at,
        }
      : undefined;
    breakpointsHit.push(breakpointId);
    recordPolicyDecision(policyDecisions, {
      actionId,
      breakpointId,
      expert,
      approved: decision.approved,
      response: decision.response ?? decision.feedback,
      autoApproved,
      autoApprovalProvenance,
      at,
    });
    if (autoApproved) {
      autoApprovals.push(autoApprovalProvenance);
      ctx.log?.('warn', `non-interactive auto-approval recorded for ${actionId} — surfaced in metadata.autoApprovals`);
    }
    return {
      approved: decision.approved === true,
      breakpointId,
      expert,
      response: decision.response ?? decision.feedback ?? null,
      autoApproved,
    };
  };

  // P1 — sourcing intake. Capture-only, no breakpoint (sparse breakpoints);
  // riskFlags ride into later payloads.
  ctx.log?.('info', `P1: sourcing intake for ${company.name}`);
  sourcing = await ctx.task(sourcingIntakeTask, sharedArgs);
  timings.sourcing = ctx.now() - startTime;

  // P2 — kip recall of prior passes, founder track record, and market facts.
  // Guarded symmetrically with the P10/P17 asserts; the disabled shape is the
  // documented empty-recall state, not a fallback.
  ctx.log?.('info', 'P2: kip recall of prior passes and founder/market facts');
  if (kipEnabled) {
    recall = await kipRecall(ctx, {
      kipDir,
      kipModel,
      kind: KIP_KIND,
      topic: `company ${company.name} prior passes and IC outcomes, founder track record, ${company.sector} market thesis facts against ${thesis}`,
    });
  } else {
    recall = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  }
  const priorKnowledge = recall;
  timings.recall = ctx.now() - startTime;

  // P3 — evidence-backed thesis-fit screening. A screen-out is an honest
  // terminal state, never softened to keep the run alive.
  ctx.log?.('info', 'P3: thesis-fit screening');
  screening = await ctx.task(thesisFitScreeningTask, { ...sharedArgs, sourcing, priorKnowledge });
  timings.screening = ctx.now() - startTime;
  if (screening.thesisFit !== true) {
    return buildResult(false, 'screened out — thesis-fit reasons recorded');
  }

  // P4 — declare the diligence plan BEFORE the workstreams run. The plan is the
  // contract the completeness gate executes coverage against.
  ctx.log?.('info', 'P4: diligence plan declaration');
  diligencePlan = await ctx.task(diligencePlanTask, { ...sharedArgs, sourcing, screening, priorKnowledge });
  if (!Array.isArray(diligencePlan.workstreams) || diligencePlan.workstreams.length === 0) {
    throw new Error(
      `ilw.diligence-plan declared no workstreams — a plan with no workstreams makes every coverage check vacuous (got ${JSON.stringify(diligencePlan.workstreams)}); fallbacks forbidden.`
    );
  }
  if (diligencePlan.planPath) artifacts.push(diligencePlan.planPath);
  timings.diligencePlan = ctx.now() - startTime;

  // P5 — six diligence workstreams fanned out in ONE ctx.parallel.all call. No
  // workstream reads another's output.
  ctx.log?.('info', 'P5: six parallel diligence workstreams');
  const workstreamArgs = {
    ...sharedArgs,
    sourcing,
    screening,
    priorKnowledge,
    plan: diligencePlan,
  };
  const [
    marketWorkstream,
    technicalWorkstream,
    teamWorkstream,
    financialWorkstream,
    legalWorkstream,
    esgWorkstream,
  ] = await ctx.parallel.all([
    () => ctx.task(marketDiligenceTask, workstreamArgs),
    () => ctx.task(technicalDiligenceTask, workstreamArgs),
    () => ctx.task(teamDiligenceTask, workstreamArgs),
    () => ctx.task(financialDiligenceTask, workstreamArgs),
    () => ctx.task(legalDiligenceTask, workstreamArgs),
    () => ctx.task(esgDiligenceTask, workstreamArgs),
  ]);
  workstreamResults = [
    marketWorkstream,
    technicalWorkstream,
    teamWorkstream,
    financialWorkstream,
    legalWorkstream,
    esgWorkstream,
  ];
  for (const result of workstreamResults) {
    for (const artifactPath of Array.isArray(result.artifacts) ? result.artifacts : []) {
      artifacts.push(artifactPath);
    }
  }
  timings.diligenceWorkstreams = ctx.now() - startTime;

  // P6 — adversarial diligence-completeness gate: the critics EXECUTE a coverage
  // check of every declared workstream against the declared plan.
  ctx.log?.('info', 'P6: adversarial diligence-completeness gate');
  diligenceGate = await adversarialGate(ctx, {
    gateId: DILIGENCE_GATE_ID,
    artifact: {
      path: diligencePlan.planPath,
      description: 'Declared diligence plan and the six workstream results under it',
    },
    critics: DILIGENCE_CRITICS,
    ironLaw: DILIGENCE_IRON_LAW,
    maxFixAttempts,
    fixer: { task: diligenceGapFillTask, args: { ...sharedArgs, plan: diligencePlan } },
    context: {
      company,
      plan: diligencePlan,
      workstreamResults,
      recall: { factCount: recall.factCount, insights: recall.insights },
    },
  });
  if (diligenceGate.escalated) {
    breakpointsHit.push(`${DILIGENCE_GATE_ID}.gate-escalation`);
  }
  timings.diligenceGate = ctx.now() - startTime;

  // Belt and braces: the gate is the adversarial check, this recompute is the
  // no-fallbacks hard block. An uncovered or incomplete workstream blocks the IC
  // gate EVEN IF the gate (or an owner escalation) passed — a partial memo is
  // never presented to the investment committee.
  coverage = computeDiligenceCoverage(diligencePlan, workstreamResults);
  if (coverage.uncovered.length > 0 || coverage.incomplete.length > 0) {
    return buildResult(false, 'diligence incomplete — IC gate never reached; a partial memo is not an option');
  }
  if (!diligenceGate.passed) {
    return buildResult(false, 'diligence-completeness gate failed after escalation — IC gate never reached');
  }

  // P7 — valuation triangulation. Three independent methods fanned out so none
  // anchors on another, then the ownership/cap-table model consumes all three
  // plus the DETERMINISTIC ownership number computed in process code.
  ctx.log?.('info', 'P7: valuation triangulation + ownership model');
  ownership = computeOwnershipPct({ checkSizeUsd: proposedCheckSizeUsd, postMoneyValuationUsd });
  const valuationArgs = { ...sharedArgs, screening, workstreamResults, priorKnowledge };
  [comparables, dcf, vcMethod] = await ctx.parallel.all([
    () => ctx.task(comparablesValuationTask, valuationArgs),
    () => ctx.task(dcfValuationTask, { ...valuationArgs, financialWorkstream }),
    () => ctx.task(vcMethodValuationTask, valuationArgs),
  ]);
  triangulatedRangeUsd = computeTriangulatedRange([comparables, dcf, vcMethod]);
  if (dcf.sensitivityTablePath) artifacts.push(dcf.sensitivityTablePath);

  capTable = await ctx.task(ownershipModelTask, {
    ...sharedArgs,
    ownership,
    comparables,
    dcf,
    vcMethod,
    triangulatedRangeUsd,
    legalWorkstream,
    priorKnowledge,
  });
  if (capTable.capTablePath) artifacts.push(capTable.capTablePath);
  timings.valuation = ctx.now() - startTime;

  // P8 — investment memo. Every material claim carries a file:line sourceRef the
  // bear-case gate re-verifies.
  ctx.log?.('info', 'P8: investment memo');
  const memoArgs = {
    ...sharedArgs,
    sourcing,
    screening,
    plan: diligencePlan,
    workstreamResults,
    coverage: coverage.coverage,
    ownership,
    capTable,
    comparables,
    dcf,
    vcMethod,
    triangulatedRangeUsd,
    priorKnowledge,
  };
  memo = await ctx.task(investmentMemoTask, memoArgs);
  if (memo.memoPath) artifacts.push(memo.memoPath);
  timings.memo = ctx.now() - startTime;

  // P9 — the signature element: the adversarial bear-case / diligence-challenge
  // gate. The default verdict is FAIL; a PASS requires a real disconfirming case
  // built from the diligence artifacts and every memo claim re-verified at its
  // cited source. It runs BEFORE the IC breakpoint so the IC decides against
  // evidence rather than the deal-team narrative.
  ctx.log?.('info', 'P9: adversarial bear-case / diligence-challenge gate');
  bearGate = await adversarialGate(ctx, {
    gateId: BEAR_CASE_GATE_ID,
    artifact: {
      path: memo.memoPath,
      description: 'Investment memo with claims, risks, and the recommendation',
    },
    critics: BEAR_CASE_CRITICS,
    ironLaw: BEAR_CASE_IRON_LAW,
    maxFixAttempts,
    fixer: { task: investmentMemoTask, args: { ...memoArgs, revision: true } },
    context: {
      company,
      memo,
      plan: diligencePlan,
      workstreamResults,
      ownership,
      triangulatedRangeUsd,
      recall: { factCount: recall.factCount, insights: recall.insights },
    },
  });
  if (bearGate.escalated) {
    breakpointsHit.push(`${BEAR_CASE_GATE_ID}.gate-escalation`);
  }
  timings.bearCaseGate = ctx.now() - startTime;
  if (!bearGate.passed) {
    return buildResult(false, 'bear-case gate failed after escalation — IC decision never raised');
  }

  // The bear-case risks the IC payload carries and the term sheet must map to a
  // mitigation or an explicit acceptance: the memo's declared risks joined with
  // the substantiated critic findings from the gate.
  bearCaseRisks = [
    ...(Array.isArray(memo.risks) ? memo.risks : []).map((risk) => ({
      riskId: risk.riskId,
      risk: risk.risk,
      severity: risk.severity,
      citation: risk.sourceRef,
      origin: 'memo',
    })),
    ...(Array.isArray(bearGate.issues) ? bearGate.issues : [])
      .filter((issue) => issue.critic === 'bear-case-critic')
      .map((issue, index) => ({
        riskId: `bear-case-${index + 1}`,
        risk: issue.description,
        severity: issue.severity,
        citation: issue.location ?? null,
        origin: 'bear-case-critic',
      })),
  ];

  // P10 — IC investment decision. Hard precondition re-check, then the FROZEN
  // check-size authority matrix routes the approval. A check beyond the deepest
  // tier THROWS inside routeCheckApproval — no route exists, fallbacks forbidden.
  ctx.log?.('info', 'P10: IC investment decision (matrix-routed, policy-gated)');
  if (coverage.uncovered.length > 0 || coverage.incomplete.length > 0) {
    throw new Error('ic-investment-decision precondition violated: diligence coverage is incomplete at the IC gate (fallbacks forbidden).');
  }
  if (bearGate.passed !== true) {
    throw new Error('ic-investment-decision precondition violated: the bear-case gate has not passed (fallbacks forbidden).');
  }
  const icTier = routeCheckApproval(proposedCheckSizeUsd);
  const icApproval = await routedBreakpoint(ctx, {
    question: `Approve a $${proposedCheckSizeUsd} investment in ${company.name} at a $${postMoneyValuationUsd} post-money (${ownership.ownershipPct}% ownership, computed in process code)? Routed to the ${icTier.tier} tier per the frozen check-size authority matrix. The bear case has been built and the memo survived it.`,
    title: 'Approve IC investment decision',
    context: {
      runId: ctx.runId,
      checkSizeUsd: proposedCheckSizeUsd,
      tier: icTier.tier,
      ownership,
      capTableReconciliation: capTable.reconciliation,
      triangulatedRangeUsd,
      bearCaseRisks,
      diligenceCoverage: coverage.coverage,
      redFlags: workstreamResults.flatMap((w) => (Array.isArray(w.redFlags) ? w.redFlags : [])),
      priorPasses: recall.insights,
      gates: {
        diligence: {
          passed: diligenceGate.passed,
          attempts: diligenceGate.attempts,
          escalated: diligenceGate.escalated,
        },
        bearCase: {
          passed: bearGate.passed,
          attempts: bearGate.attempts,
          escalated: bearGate.escalated,
          evidence: bearGate.evidence,
        },
      },
      files: [{ path: memo.memoPath, label: 'Investment memo' }],
    },
  }, {
    breakpointId: ACTION_IC_DECISION,
    expert: icTier.expert,
    tags: ['policy-gated', 'venture-capital', 'investment-decision'],
    strategy: 'single',
  });
  const icRecord = notePolicyDecision({
    actionId: ACTION_IC_DECISION,
    breakpointId: ACTION_IC_DECISION,
    expert: icTier.expert,
    decision: icApproval,
  });
  icDecision = {
    ...icRecord,
    tier: icTier.tier,
    checkSizeUsd: proposedCheckSizeUsd,
    ownershipPct: ownership.ownershipPct,
  };
  timings.icDecision = ctx.now() - startTime;

  // kipAssert of the decision facts IMMEDIATELY, before any external commitment.
  // Facts are built in process code from run state — agents never author them.
  if (kipEnabled) {
    const decisionFacts = [
      {
        subject: `company:${company.name}`,
        predicate: 'ic-decision',
        object: icDecision.approved ? 'decision:invest' : 'decision:pass',
        props: {
          checkSizeUsd: proposedCheckSizeUsd,
          ownershipPct: ownership.ownershipPct,
          tier: icTier.tier,
          expert: Array.isArray(icTier.expert) ? icTier.expert.join(',') : icTier.expert,
          postMoneyValuationUsd,
          sector: company.sector,
          thesis,
          runId: ctx.runId,
        },
      },
    ];
    for (const risk of bearCaseRisks) {
      decisionFacts.push({
        subject: `company:${company.name}`,
        predicate: 'bear-case-risk',
        object: `risk:${risk.riskId}`,
        props: {
          severity: risk.severity,
          citation: risk.citation,
          sector: company.sector,
          runId: ctx.runId,
        },
      });
    }
    for (const founder of Array.isArray(company.founders) ? company.founders : []) {
      decisionFacts.push({
        subject: `founder:${founder.name}`,
        predicate: 'assessed-in',
        object: `company:${company.name}`,
        props: {
          decision: icDecision.approved ? 'invest' : 'pass',
          runId: ctx.runId,
        },
      });
    }
    const decisionAssertion = await kipAssert(ctx, { kipDir, kipModel, kind: KIP_KIND, facts: decisionFacts });
    kipFactsAsserted += decisionAssertion.asserted;
  }

  if (!icDecision.approved) {
    // An IC decline is terminal — a re-pitch is a NEW run, never a hidden loop.
    return buildResult(false, 'IC declined — decision recorded');
  }

  // P11 — term-sheet drafting + policy-gated issuance. Bounded 2-attempt loop
  // (clw P5 / sdw P4 precedent): a rejection WITH a directive earns exactly one
  // revision pass and re-presents the SAME breakpointId; an undirected rejection
  // THROWS; a second rejection ends the run. Never auto-approved.
  ctx.log?.('info', 'P11: term-sheet drafting + policy-gated issuance');
  const termSheetArgs = {
    ...sharedArgs,
    icDecision,
    ownership,
    triangulatedRangeUsd,
    bearCaseRisks,
    memo,
    priorKnowledge,
  };
  termSheet = await ctx.task(termSheetDraftTask, termSheetArgs);
  if (termSheet.termSheetPath) artifacts.push(termSheet.termSheetPath);

  let issuanceFeedback = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      termSheet = await ctx.task(termSheetDraftTask, {
        ...termSheetArgs,
        feedback: issuanceFeedback,
        revision: attempt,
      });
      if (termSheet.termSheetPath) artifacts.push(termSheet.termSheetPath);
    }
    const bindingTerms = (Array.isArray(termSheet.terms) ? termSheet.terms : []).filter((t) => t.binding === true);
    const issuanceApproval = await routedBreakpoint(ctx, {
      question: `Issue this term sheet to ${company.name}? Issuance is an external commitment with reputational effect, and ${bindingTerms.length} clause(s) bind the fund on signature.`,
      title: 'Approve term-sheet issuance',
      context: {
        runId: ctx.runId,
        terms: termSheet.terms,
        bindingTerms,
        riskMitigationMap: termSheet.riskMitigationMap,
        icDecision,
        ownership,
        files: [{ path: termSheet.termSheetPath, label: 'Term sheet' }],
      },
      previousFeedback: issuanceFeedback || undefined,
    }, {
      breakpointId: ACTION_TERM_SHEET_ISSUANCE,
      expert: 'general-partner',
      tags: ['policy-gated', 'venture-capital'],
      strategy: 'single',
    });
    termSheetIssuance = notePolicyDecision({
      actionId: ACTION_TERM_SHEET_ISSUANCE,
      breakpointId: ACTION_TERM_SHEET_ISSUANCE,
      expert: 'general-partner',
      decision: issuanceApproval,
    });
    if (termSheetIssuance.approved) break;
    if (attempt === 0) {
      issuanceFeedback = issuanceApproval.response || issuanceApproval.feedback;
      if (!issuanceFeedback) {
        // No fallback: the single revision pass has nothing to revise against.
        throw new Error('term-sheet-issuance rejected without a directive — cannot revise (fallbacks forbidden).');
      }
    }
  }
  timings.termSheetIssuance = ctx.now() - startTime;
  if (!termSheetIssuance.approved) {
    return buildResult(false, 'term-sheet issuance rejected twice — decision recorded, no term sheet issued');
  }

  // P12 — bounded term-sheet negotiation loop, strictly sequential. Each round's
  // routed approval uses a per-round-unique breakpointId so replay never
  // collapses two rounds. Severity routing: any economic-deviation in the round
  // routes to investment-committee; otherwise general-partner.
  ctx.log?.('info', `P12: term-sheet negotiation loop (max ${maxNegotiationRounds} rounds)`);
  let currentTermSheetPath = termSheet.termSheetPath;
  for (let round = 1; round <= maxNegotiationRounds; round++) {
    const analysis = await ctx.task(negotiationRoundAnalysisTask, {
      ...sharedArgs,
      round,
      termSheetPath: currentTermSheetPath,
      terms: termSheet.terms,
      priorRounds: negotiationRounds,
      deviationRegister,
      priorKnowledge,
    });
    openTerms = analysis.openTerms || [];
    const terms = analysis.nonStandardTerms || [];
    if (analysis.roundSummaryPath) artifacts.push(analysis.roundSummaryPath);

    if (analysis.settled === true && terms.length === 0) {
      negotiationRounds.push({ round, nonStandardTerms: [], approval: null, settled: true });
      settled = true;
      break;
    }

    if (terms.length === 0) {
      // Honest pending state (no counterparty response artifact yet) — recorded,
      // no approval raised this round, the loop continues toward exhaustion.
      negotiationRounds.push({
        round,
        nonStandardTerms: [],
        approval: null,
        settled: false,
        pendingExternal: analysis.pendingExternal === true,
      });
      continue;
    }

    const economicTerms = terms.filter((t) => t.deviationSeverity === 'economic-deviation');
    const expert = economicTerms.length > 0 ? 'investment-committee' : 'general-partner';
    const roundBreakpointId = `ilw.approve-nonstandard-terms.round-${round}`;
    const termList = terms
      .map((t) => `${t.termId} [${t.deviationSeverity}]: ${t.description}`)
      .join('; ');
    const approval = await routedBreakpoint(ctx, {
      question: `Round ${round}: approve ${terms.length} non-standard term(s) (${economicTerms.length} economic-deviation) with ${company.name}? Terms: ${termList}`,
      title: `Approve non-standard terms (round ${round})`,
      context: {
        runId: ctx.runId,
        round,
        nonStandardTerms: terms,
        deviationRegister,
        ownership,
        files: [{ path: analysis.roundSummaryPath, label: `Round ${round} summary` }],
      },
    }, {
      breakpointId: roundBreakpointId,
      expert,
      tags: ['venture-capital', 'negotiation', 'non-standard-terms'],
      strategy: 'single',
    });
    breakpointsHit.push(roundBreakpointId);

    negotiationRounds.push({
      round,
      nonStandardTerms: terms,
      approval: {
        approved: approval.approved === true,
        expert,
        breakpointId: roundBreakpointId,
        response: approval.response || approval.feedback || null,
      },
      settled: analysis.settled === true,
    });

    if (approval.approved === true) {
      for (const term of terms) {
        deviationRegister.push({
          termId: term.termId,
          category: term.category,
          severity: term.deviationSeverity,
          finalPosition: term.companyPosition,
          approvedInRound: round,
        });
      }
      if (analysis.settled === true) {
        settled = true;
        break;
      }
      continue;
    }

    // Rejection: the approver MUST supply a directive — an undirected rejection
    // is unactionable and throws (no fallback).
    const directive = approval.response || approval.feedback;
    if (!directive) {
      throw new Error(`${roundBreakpointId} rejected without a directive — the counter term sheet has nothing to apply (fallbacks forbidden).`);
    }
    const counter = await ctx.task(counterTermSheetTask, {
      ...sharedArgs,
      round,
      directive,
      rejectedTerms: terms,
      termSheetPath: currentTermSheetPath,
      deviationRegister,
      priorKnowledge,
    });
    currentTermSheetPath = counter.updatedTermSheetPath;
    artifacts.push(counter.updatedTermSheetPath);
  }
  timings.negotiation = ctx.now() - startTime;

  // Loop ended unsettled — never silently proceed. Rejection here means the deal
  // is abandoned AFTER a term sheet was issued, which routes into the
  // signed-LOI-withdrawal policy gate rather than returning silently.
  if (!settled) {
    exhausted = true;
    const decision = await routedBreakpoint(ctx, {
      question: `Term-sheet negotiation with ${company.name} is unsettled after ${maxNegotiationRounds} round(s) (${openTerms.length} open term(s)). Approve to proceed to definitive documents with the open terms explicitly listed, or reject to abandon the issued term sheet.`,
      title: 'Negotiation rounds exhausted',
      context: {
        runId: ctx.runId,
        openTerms,
        rounds: negotiationRounds,
        deviationRegister,
      },
    }, {
      breakpointId: 'ilw.negotiation-rounds-exhausted',
      expert: 'general-partner',
      tags: ['venture-capital', 'negotiation', 'escalation'],
      strategy: 'single',
    });
    breakpointsHit.push('ilw.negotiation-rounds-exhausted');
    exhaustionDecision = {
      approved: decision.approved === true,
      breakpointId: 'ilw.negotiation-rounds-exhausted',
      expert: 'general-partner',
      response: decision.response || decision.feedback || null,
    };

    if (decision.approved !== true) {
      // P13 — signed-LOI withdrawal gate. A term sheet was already issued, so
      // walking away carries legal and reputational consequences: it is an
      // explicit approved decision, never an implicit return.
      ctx.log?.('info', 'P13: signed-LOI withdrawal gate');
      const withdrawalApproval = await routedBreakpoint(ctx, {
        question: `Withdraw from the term sheet issued to ${company.name}? A signed LOI/term sheet carries legal and reputational consequences; this decision is recorded.`,
        title: 'Approve signed-LOI withdrawal',
        context: {
          runId: ctx.runId,
          openTerms,
          rounds: negotiationRounds,
          deviationRegister,
          issuance: termSheetIssuance,
          exhaustionDecision,
          files: [{ path: currentTermSheetPath, label: 'Issued term sheet' }],
        },
      }, {
        breakpointId: ACTION_SIGNED_LOI_WITHDRAWAL,
        expert: 'general-partner',
        tags: ['policy-gated', 'venture-capital', 'withdrawal'],
        strategy: 'single',
      });
      withdrawal = notePolicyDecision({
        actionId: ACTION_SIGNED_LOI_WITHDRAWAL,
        breakpointId: ACTION_SIGNED_LOI_WITHDRAWAL,
        expert: 'general-partner',
        decision: withdrawalApproval,
      });
      return buildResult(false, 'withdrew from an issued term sheet — decision recorded');
    }
  }

  // P14 — syndication + definitive documents. Sequential: the documents
  // reconcile every deviationRegister entry and report what did not reconcile.
  ctx.log?.('info', 'P14: syndication plan + definitive documents');
  syndication = await ctx.task(syndicationPlanTask, {
    ...sharedArgs,
    icDecision,
    ownership,
    termSheetPath: currentTermSheetPath,
    deviationRegister,
  });
  if (syndication.syndicationPlanPath) artifacts.push(syndication.syndicationPlanPath);

  definitiveDocs = await ctx.task(definitiveDocsTask, {
    ...sharedArgs,
    icDecision,
    ownership,
    termSheetPath: currentTermSheetPath,
    deviationRegister,
    syndication,
  });
  if (definitiveDocs.definitiveDocsPath) artifacts.push(definitiveDocs.definitiveDocsPath);
  timings.definitiveDocs = ctx.now() - startTime;

  // P15 — policy-gated capital deployment. Money movement is IRREVERSIBLE: no
  // autoApproveAfterN, no presentAlwaysApprove, no auto-approve of any kind.
  // The close executor runs ONLY inside the approved === true guard.
  ctx.log?.('info', 'P15: policy-gated capital wiring at close');
  const unsatisfiedConditions = (Array.isArray(definitiveDocs.closingConditions) ? definitiveDocs.closingConditions : [])
    .filter((c) => c.satisfied !== true);
  const wiringApproval = await routedBreakpoint(ctx, {
    question: `Wire $${proposedCheckSizeUsd} to ${company.name} at close? THE WIRE IS IRREVERSIBLE. ${unsatisfiedConditions.length} closing condition(s) are unsatisfied and ${(definitiveDocs.unreconciledDeviations || []).length} negotiated deviation(s) are unreconciled.`,
    title: 'Approve capital wiring at close (irreversible)',
    context: {
      runId: ctx.runId,
      wireAmountUsd: proposedCheckSizeUsd,
      ownership,
      deviationRegister,
      unreconciledDeviations: definitiveDocs.unreconciledDeviations,
      closingConditions: definitiveDocs.closingConditions,
      unsatisfiedConditions,
      syndication: {
        coInvestors: syndication.coInvestors,
        allocationGapUsd: syndication.allocationGapUsd,
      },
      gates: {
        diligence: { passed: diligenceGate.passed, attempts: diligenceGate.attempts, escalated: diligenceGate.escalated },
        bearCase: { passed: bearGate.passed, attempts: bearGate.attempts, escalated: bearGate.escalated },
      },
      policyDecisions,
      files: [
        { path: definitiveDocs.definitiveDocsPath, label: 'Definitive documents' },
        { path: currentTermSheetPath, label: 'Term sheet' },
      ],
    },
  }, {
    breakpointId: ACTION_CAPITAL_WIRING_CLOSE,
    expert: 'cfo',
    tags: ['policy-gated', 'venture-capital', 'irreversible'],
    strategy: 'single',
  });
  wiring = notePolicyDecision({
    actionId: ACTION_CAPITAL_WIRING_CLOSE,
    breakpointId: ACTION_CAPITAL_WIRING_CLOSE,
    expert: 'cfo',
    decision: wiringApproval,
  });
  timings.wiringGate = ctx.now() - startTime;

  if (wiring.approved !== true) {
    // Terminal: no funds move and ilw.close-execution is never invoked.
    return buildResult(false, 'capital wiring not approved — no funds moved; decision recorded');
  }

  // EXECUTOR GUARD: ilw.close-execution is invoked ONLY inside this
  // approved === true guard. Reaching here already means the wire was approved.
  if (wiring.approved === true) {
    closePackage = await ctx.task(closeExecutionTask, {
      ...sharedArgs,
      approvalProvenance: wiring,
      icDecision,
      ownership,
      wireAmountUsd: proposedCheckSizeUsd,
      termSheetPath: currentTermSheetPath,
      definitiveDocsPath: definitiveDocs.definitiveDocsPath,
      closingConditions: definitiveDocs.closingConditions,
      deviationRegister,
      policyDecisions,
      gates: {
        diligence: { passed: diligenceGate.passed, attempts: diligenceGate.attempts, escalated: diligenceGate.escalated },
        bearCase: { passed: bearGate.passed, attempts: bearGate.attempts, escalated: bearGate.escalated },
      },
    });
    if (closePackage.closePackagePath) artifacts.push(closePackage.closePackagePath);
  }
  timings.closeExecution = ctx.now() - startTime;

  // P16 — portfolio monitoring cadence mapped over the portfolio companies, then
  // reserve/follow-on decisions. An empty portfolio is recorded as skipped with
  // an explicit zero-company note, never silently omitted.
  ctx.log?.('info', `P16: portfolio monitoring cadence over ${portfolioCompanies.length} company(ies)`);
  if (portfolioCompanies.length === 0) {
    portfolioSkipped = true;
    portfolioReviews = [];
  } else {
    portfolioReviews = await ctx.parallel.map(portfolioCompanies, (portfolioCompany) =>
      ctx.task(portfolioCompanyReviewTask, { ...sharedArgs, portfolioCompany, priorKnowledge })
    );
    for (const review of portfolioReviews) {
      if (review.reviewPath) artifacts.push(review.reviewPath);
    }

    reservePlan = await ctx.task(reserveRecommendationTask, {
      ...sharedArgs,
      reviews: portfolioReviews,
      reservePoolUsd,
      committedReserveUsd,
    });
    if (reservePlan.reserveModelPath) artifacts.push(reservePlan.reserveModelPath);

    let followOnRaised = false;
    for (const recommendation of Array.isArray(reservePlan.recommendations) ? reservePlan.recommendations : []) {
      const availability = computeReserveAvailability({
        reservePoolUsd,
        committedReserveUsd,
        requestedUsd: recommendation.requestedUsd,
      });
      if (!availability.sufficient) {
        // The ask is NEVER trimmed to fit — no breakpoint is raised and the
        // insufficient-reserves decision is recorded explicitly.
        followOnDecisions.push({
          companyId: recommendation.companyId,
          breakpointId: null,
          expert: null,
          approved: false,
          response: 'insufficient reserves — request exceeds remaining reserve capacity; the ask was not trimmed to fit',
          requestedUsd: recommendation.requestedUsd,
          committedUsd: 0,
          availability,
        });
        ctx.log?.('warn', `follow-on for ${recommendation.companyId} exceeds remaining reserves — no breakpoint raised, decision recorded`);
        continue;
      }

      // Matrix-routed, and never auto-approved. The FIRST follow-on uses the
      // canonical actionId as its breakpointId; subsequent companies get a
      // '.company-<companyId>' suffix so replay never collapses two distinct
      // commitments. The actionId recorded stays canonical either way.
      const followOnTier = routeCheckApproval(recommendation.requestedUsd);
      const followOnBreakpointId = followOnRaised
        ? `${ACTION_FOLLOW_ON_COMMITMENT}.company-${recommendation.companyId}`
        : ACTION_FOLLOW_ON_COMMITMENT;
      followOnRaised = true;
      const followOnApproval = await routedBreakpoint(ctx, {
        question: `Commit a $${recommendation.requestedUsd} follow-on into ${recommendation.companyId} from reserves? Remaining reserve capacity is $${availability.remainingUsd}. Routed to the ${followOnTier.tier} tier per the frozen check-size authority matrix.`,
        title: `Approve follow-on commitment: ${recommendation.companyId}`,
        context: {
          runId: ctx.runId,
          recommendation,
          availability,
          tier: followOnTier.tier,
          reviews: portfolioReviews.filter((r) => r.companyId === recommendation.companyId),
          files: [{ path: reservePlan.reserveModelPath, label: 'Reserve allocation model' }],
        },
      }, {
        breakpointId: followOnBreakpointId,
        expert: followOnTier.expert,
        tags: ['policy-gated', 'venture-capital', 'reserves'],
        strategy: 'single',
      });
      const followOnRecord = notePolicyDecision({
        actionId: ACTION_FOLLOW_ON_COMMITMENT,
        breakpointId: followOnBreakpointId,
        expert: followOnTier.expert,
        decision: followOnApproval,
      });
      const committedUsd = followOnRecord.approved ? recommendation.requestedUsd : 0;
      committedReserveUsd += committedUsd;
      followOnDecisions.push({
        companyId: recommendation.companyId,
        breakpointId: followOnBreakpointId,
        expert: followOnTier.expert,
        approved: followOnRecord.approved,
        response: followOnRecord.response,
        requestedUsd: recommendation.requestedUsd,
        committedUsd,
        availability,
      });
    }
  }
  timings.portfolioCadence = ctx.now() - startTime;

  // P17 — thesis outcome synthesis + kip assert. Facts are built deterministically
  // IN PROCESS CODE from run state; an outcome or marker without an evidenceRef
  // is warned and DROPPED, never asserted.
  ctx.log?.('info', 'P17: thesis outcome synthesis + kip assert');
  const synthesis = await ctx.task(thesisOutcomeSynthesisTask, {
    ...sharedArgs,
    icDecision,
    bearCaseRisks,
    deviationRegister,
    closePackage,
    followOnDecisions,
    workstreamResults,
  });
  if (synthesis.synthesisPath) artifacts.push(synthesis.synthesisPath);

  if (kipEnabled) {
    const outcomeFacts = [
      {
        subject: `investment:${company.name}:${ctx.runId}`,
        predicate: 'thesis-outcome',
        object: closePackage ? 'outcome:funded' : 'outcome:not-funded',
        props: {
          fundedAmountUsd: closePackage ? closePackage.fundedAmountUsd : 0,
          finalOwnershipPct: closePackage ? closePackage.finalOwnershipPct : 0,
          rounds: negotiationRounds.length,
          diligenceGateAttempts: diligenceGate.attempts,
          bearCaseGateAttempts: bearGate.attempts,
          runId: ctx.runId,
        },
      },
    ];
    for (const marker of closePackage && Array.isArray(closePackage.thesisMarkers) ? closePackage.thesisMarkers : []) {
      if (!marker.evidenceRef) {
        ctx.log?.('warn', `P17: dropped untraceable thesis marker (no evidenceRef): ${marker.marker}`);
        continue;
      }
      outcomeFacts.push({
        subject: `investment:${company.name}:${ctx.runId}`,
        predicate: 'thesis-marker',
        object: `marker:${marker.marker}`,
        props: {
          targetValue: marker.targetValue,
          checkpointDate: marker.checkpointDate,
          evidenceRef: marker.evidenceRef,
          runId: ctx.runId,
        },
      });
    }
    for (const deviation of deviationRegister) {
      outcomeFacts.push({
        subject: `company:${company.name}`,
        predicate: 'agreed-term-deviation',
        object: `term:${deviation.termId}`,
        props: {
          severity: deviation.severity,
          finalPosition: deviation.finalPosition,
          approvedInRound: deviation.approvedInRound,
          runId: ctx.runId,
        },
      });
    }
    for (const followOn of followOnDecisions) {
      outcomeFacts.push({
        subject: `portfolio-company:${followOn.companyId}`,
        predicate: 'follow-on-decision',
        object: followOn.approved ? 'decision:committed' : 'decision:declined',
        props: {
          requestedUsd: followOn.requestedUsd,
          committedUsd: followOn.committedUsd,
          expert: Array.isArray(followOn.expert) ? followOn.expert.join(',') : followOn.expert,
          runId: ctx.runId,
        },
      });
    }
    for (const outcome of Array.isArray(synthesis.outcomes) ? synthesis.outcomes : []) {
      if (!outcome.evidenceRef) {
        ctx.log?.('warn', `P17: dropped untraceable outcome (no evidenceRef): ${outcome.outcome}`);
        continue;
      }
      outcomeFacts.push({
        subject: `investment:${company.name}:${ctx.runId}`,
        predicate: 'thesis-outcome-detail',
        object: `evidence:${outcome.evidenceRef}`,
        props: {
          outcome: outcome.outcome,
          evidenceRef: outcome.evidenceRef,
          runId: ctx.runId,
        },
      });
    }
    const outcomeAssertion = await kipAssert(ctx, { kipDir, kipModel, kind: KIP_KIND, facts: outcomeFacts });
    kipFactsAsserted += outcomeAssertion.asserted;
  }
  timings.kipAssert = ctx.now() - startTime;

  return buildResult(true);
}
