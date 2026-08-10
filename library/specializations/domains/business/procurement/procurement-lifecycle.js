/**
 * @process procurement/procurement-lifecycle
 * @description End-to-end procurement lifecycle: requirements intake, kip recall of vendor
 *   history and pricing baselines, RFx authoring with adversarial requirements critique gate,
 *   parallel per-vendor proposal evaluation, adversarial evaluation-integrity gate (re-scores
 *   sampled vendor claims against submitted evidence — executed), bounded negotiation rounds
 *   with per-round spend-routed approval, policy-gated vendor commitment, spend approval,
 *   PO issuance, kip assert of negotiated prices/award outcomes.
 * @inputs {
 *   requirementsBrief: string,     // required — path to the sourcing need/requirements document (no default; throw if missing)
 *   category: string,              // required — procurement category (e.g. 'IT services')
 *   vendors: string[],             // required — non-empty candidate vendor list (no default vendor pool; throw if empty)
 *   estimatedSpend: number,        // required — USD; drives SPEND_APPROVAL_ROUTING (throw if missing/non-finite)
 *   rfxType?: string,              // 'RFI' | 'RFP' | 'RFQ', default 'RFP'
 *   evidenceSampleSize?: number,   // vendor claims re-scored per vendor by the integrity gate (default 3)
 *   maxNegotiationRounds?: number, // bounded negotiation loop (default 3)
 *   maxFixAttempts?: number,       // gate fixer budget (default 2)
 *   kipEnabled?: boolean,          // recall + assert procurement memory via kip (default true)
 *   kipDir?: string,               // kip store directory (default '.a5c/kip')
 *   kipModel?: string              // model for kip structured paths (default 'sonnet')
 * }
 * @outputs {
 *   success: boolean,
 *   intake: object,                // { need, stakeholders, constraints, budget, mustHaves, riskFlags }
 *   recall: object,                // { factCount, insights }
 *   rfx: object,                   // { rfxPath, criteria, weights, gate { passed, attempts, escalated, issues, evidence } }
 *   evaluations: array,            // per-vendor [{ vendor, scorecard, totalScore, claims, evidencePaths }]
 *   integrityGate: object,         // { passed, attempts, escalated, issues, evidence, sampledClaims }
 *   negotiation: object,           // { rounds [{ round, terms, approval { approved, expert, breakpointId, response }, settled }], settled, exhausted, exhaustionDecision? }
 *   selection: object,             // { vendor, rationale, rankedVendors }
 *   approvals: object,             // { vendorCommitment, spendApproval, poIssuance } — each { approved, breakpointId, expert, response }
 *   po: object,                    // { poPath, poNumber, finalPrice }
 *   kipFactsAsserted: number,
 *   artifacts: array,
 *   metadata: object               // { processId, runId, category, breakpointsHit, timings }
 * }
 * @graph
 *   domains: [domain:business, domain:supply-chain]
 *   specializations: [specialization:supply-chain-optimization]
 *   skillAreas: [skill-area:procurement-management, skill-area:vendor-management-ops, skill-area:knowledge-management]
 *   workflows: [workflow:vendor-evaluation, workflow:procurement-lifecycle]
 *   topics: [topic:quality-assurance]
 *   roles: [role:procurement-manager, role:finance-director, role:cfo]
 * @policyGatedActions vendor-commitment (spend-routed expert), spend-approval (spend-routed
 *   expert), po-issuance (spend-routed expert) — each via routedBreakpoint with
 *   breakpointId = actionId, tags ['policy-gated','procurement'], expert =
 *   resolveSpendExpert(estimatedSpend) (or finalPrice once negotiated), never auto-approved
 *   (no autoApproveAfterN, no presentAlwaysApprove). Spend-threshold routing:
 *   <=$25k procurement-manager, <=$250k finance-director, >$250k cfo (Infinity cap tier —
 *   an explicit cap, not a fallback; invalid spend throws).
 * @example
 * const result = await orchestrate('procurement/procurement-lifecycle', {
 *   requirementsBrief: 'sourcing/cloud-hosting-needs.md',
 *   category: 'cloud hosting',
 *   vendors: ['AWS', 'Azure', 'GCP'],
 *   estimatedSpend: 180000,
 *   rfxType: 'RFP'
 * });
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../../../common-utilities/routed-gate-combinators.js';

// ---------------------------------------------------------------------------
// Spend-threshold expert routing — frozen table + throwing lookup.
// The Infinity tier is an explicit documented cap-tier (cfo), not a fallback:
// every valid spend maps to exactly one named expert; invalid spend throws.
// ---------------------------------------------------------------------------

export const SPEND_APPROVAL_ROUTING = Object.freeze([
  Object.freeze({ maxSpendUsd: 25000, expert: 'procurement-manager' }),
  Object.freeze({ maxSpendUsd: 250000, expert: 'finance-director' }),
  Object.freeze({ maxSpendUsd: Infinity, expert: 'cfo' }),
]);

export function resolveSpendTier(spendUsd) {
  if (typeof spendUsd !== 'number' || Number.isNaN(spendUsd) || spendUsd < 0) {
    throw new Error(
      'procurement-lifecycle: spend is required for expert routing — there is no default approver (fallbacks forbidden). ' +
        `Got: ${JSON.stringify(spendUsd)}`
    );
  }
  for (const tier of SPEND_APPROVAL_ROUTING) {
    if (spendUsd <= tier.maxSpendUsd) return tier;
  }
  // Unreachable while the Infinity cap tier exists — kept as a hard failure,
  // never a silent default.
  throw new Error('procurement-lifecycle: no routing tier matched — SPEND_APPROVAL_ROUTING is corrupt.');
}

export function resolveSpendExpert(spendUsd) {
  return resolveSpendTier(spendUsd).expert;
}

const describeTier = (tier) =>
  tier.maxSpendUsd === Infinity
    ? `>$250,000 cap tier -> ${tier.expert}`
    : `<=$${tier.maxSpendUsd.toLocaleString('en-US')} tier -> ${tier.expert}`;

// ---------------------------------------------------------------------------
// P0 — intake: requirements capture
// ---------------------------------------------------------------------------

export const intakeRequirementsTask = defineTask('prc.intake-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Procurement intake: ${args.category}`,
  agent: {
    name: 'procurement-intake-analyst',
    prompt: {
      role: 'Procurement intake analyst',
      task: `Capture the sourcing need and requirements from the brief at ${args.requirementsBrief}`,
      context: args,
      instructions: [
        'Read the requirements brief at requirementsBrief and capture: need (what is being bought and why), stakeholders (name, role, interest), constraints (timeline, compliance, integration), budget alignment vs estimatedSpend, mustHaves (hard requirements), riskFlags.',
        'Flag missing or ambiguous requirements as riskFlags — do not infer or invent stakeholder intent.',
        'Do not author RFx content here — this is the intake slice only.',
      ],
      outputFormat: 'JSON with need string, stakeholders array [{ name, role, interest }], constraints array, budget object { estimatedSpend, aligned, notes }, mustHaves array, riskFlags array',
    },
    outputSchema: {
      type: 'object',
      required: ['need', 'mustHaves', 'stakeholders'],
      properties: {
        need: { type: 'string' },
        stakeholders: {
          type: 'array',
          items: { type: 'object', required: ['name', 'role'] },
        },
        constraints: { type: 'array' },
        budget: { type: 'object' },
        mustHaves: { type: 'array' },
        riskFlags: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'prc', 'procurement', 'intake'],
}));

// ---------------------------------------------------------------------------
// P2 — RFx authoring (also the gate-fixer revision pass when feedback is present)
// ---------------------------------------------------------------------------

export const rfxAuthoringTask = defineTask('prc.rfx-authoring', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Revise ${args.rfxType} package: ${args.category} (gate feedback)`
    : `Author ${args.rfxType} package: ${args.category}`,
  agent: {
    name: 'rfx-author',
    prompt: {
      role: 'RFx author',
      task: `Author the ${args.rfxType} package for the ${args.category} sourcing need`,
      context: args,
      instructions: [
        'Write the RFx package to artifactsDir and report rfxPath. Use the RFx structure of supply-chain/rfx-management.js (RFI/RFP/RFQ package, evaluation criteria, timeline); for a full standalone RFx run use that process — this task performs the authoring slice inline.',
        'Every intake mustHave must map to at least one RFx requirement; requirements must be specific and vendor-evidenceable — the critique gate traces this.',
        'Produce evaluation criteria [{ criterionId, description, scoringAnchor }] and a weights map { criterionId: number } whose weights sum to exactly 100. Every criterion states its scoring anchor (what a 1 vs a 5 looks like).',
        'Honor recalled vendor history and pricing baselines: cite prior facts that shaped requirements or weights.',
        args.feedback
          ? `Revision round: address ONLY the gate feedback, list what changed. Feedback: ${JSON.stringify(args.feedback)}`
          : 'First authoring round: no gate feedback to address.',
      ],
      outputFormat: 'JSON with rfxPath string, criteria array [{ criterionId, description, scoringAnchor }], weights object { criterionId: number }, requirementTrace array [{ mustHave, requirementId }]',
    },
    outputSchema: {
      type: 'object',
      required: ['rfxPath', 'criteria', 'weights'],
      properties: {
        rfxPath: { type: 'string' },
        criteria: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['criterionId', 'description', 'scoringAnchor'] },
        },
        weights: { type: 'object' },
        requirementTrace: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'prc', 'procurement', 'rfx'],
}));

// ---------------------------------------------------------------------------
// P4 — per-vendor proposal evaluation (one independent instance per vendor)
// ---------------------------------------------------------------------------

export const vendorEvaluationTask = defineTask('prc.vendor-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Vendor evaluation: ${args.vendor}`,
  agent: {
    name: 'vendor-evaluation-analyst',
    prompt: {
      role: 'Vendor evaluation analyst',
      task: `Independently evaluate the proposal from ${args.vendor} against the RFx at ${args.rfxPath}`,
      context: args,
      instructions: [
        'Evaluate ONLY this vendor. You run in parallel with other vendor evaluators and must not assume, request, or reference any other vendor\'s scorecard.',
        'Score every RFx criterion: scorecard [{ criterionId, score (1-5 against the stated scoring anchor), rationale, claimRefs }].',
        'Every scored criterion needs at least one claim: claims [{ claimId (stable kebab-case), criterionId, statement, evidencePath (the vendor artifact backing the statement), location (section/page within it) }]. The integrity gate OPENS these evidencePaths and re-scores — cite real files and exact locations.',
        'Missing vendor evidence is reported as unevidencedClaims — a finding, never invented evidence.',
        'Report evidencePaths (deduplicated list of every cited evidence file).',
        'Honor recalled vendor history: prior award outcomes and negotiated baselines adjust rationale, with the prior fact cited.',
      ],
      outputFormat: 'JSON with vendor string, scorecard array [{ criterionId, score, rationale, claimRefs }], totalScore number, claims array [{ claimId, criterionId, statement, evidencePath, location }], evidencePaths array, unevidencedClaims array',
    },
    outputSchema: {
      type: 'object',
      required: ['vendor', 'scorecard', 'totalScore', 'claims'],
      properties: {
        vendor: { type: 'string' },
        scorecard: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['criterionId', 'score', 'rationale'] },
        },
        totalScore: { type: 'number' },
        claims: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['claimId', 'criterionId', 'statement', 'evidencePath', 'location'],
          },
        },
        evidencePaths: { type: 'array' },
        unevidencedClaims: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'prc', 'procurement', 'evaluation'],
}));

// ---------------------------------------------------------------------------
// P6 — negotiation loop tasks
// ---------------------------------------------------------------------------

export const negotiationRoundAnalysisTask = defineTask('prc.negotiation-round-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Negotiation round ${args.round} analysis: ${args.vendor}`,
  agent: {
    name: 'procurement-negotiation-analyst',
    prompt: {
      role: 'Procurement negotiation analyst',
      task: `Analyze negotiation round ${args.round} with ${args.vendor}`,
      context: args,
      instructions: [
        'Ingest the vendor\'s position for this round; if no vendor response artifact exists yet, report settled:false with pendingExternal:true and empty terms — an honest state, not a fallback.',
        'For every open commercial point produce a term: { termId (stable kebab-case), category: price|sla|liability|payment|delivery, description, ourPosition, vendorPosition, proposedSpendUsd? (total USD when the term moves the price) }.',
        'Never invent vendor concessions — every vendorPosition must trace to the vendor\'s actual response or prior round record.',
        'Write the round summary artifact (roundSummaryPath) with per-term positions for the approval payload.',
        'settled:true only when no open terms remain.',
      ],
      outputFormat: 'JSON with terms array [{ termId, category, description, ourPosition, vendorPosition, proposedSpendUsd }], settled boolean, pendingExternal boolean, openTerms array, roundSummaryPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['terms', 'settled', 'openTerms', 'roundSummaryPath'],
      properties: {
        terms: {
          type: 'array',
          items: {
            type: 'object',
            required: ['termId', 'category', 'description', 'ourPosition', 'vendorPosition'],
            properties: {
              category: { type: 'string', enum: ['price', 'sla', 'liability', 'payment', 'delivery'] },
              proposedSpendUsd: { type: 'number' },
            },
          },
        },
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
  labels: ['agent', 'prc', 'procurement', 'negotiation'],
}));

export const counterProposalTask = defineTask('prc.counter-proposal', (args, taskCtx) => ({
  kind: 'agent',
  title: `Counter-proposal (round ${args.round}): ${args.vendor}`,
  agent: {
    name: 'procurement-negotiation-analyst',
    prompt: {
      role: 'Procurement counter-proposal drafter',
      task: `Produce the round-${args.round} counter-proposal under the approver directive`,
      context: args,
      instructions: [
        'Apply ONLY the approver directive (args.directive) plus the rejected terms to produce the next-round counter-proposal; report updatedProposalPath.',
        'Preserve every already-approved position unchanged; list changes per term.',
        'No scope creep.',
      ],
      outputFormat: 'JSON with updatedProposalPath string, changes array (one entry per term changed)',
    },
    outputSchema: {
      type: 'object',
      required: ['updatedProposalPath', 'changes'],
      properties: {
        updatedProposalPath: { type: 'string' },
        changes: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'prc', 'procurement', 'negotiation', 'fixer'],
}));

// ---------------------------------------------------------------------------
// P7 — vendor selection
// ---------------------------------------------------------------------------

export const vendorSelectionTask = defineTask('prc.vendor-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Vendor selection: ${args.category}`,
  agent: {
    name: 'sourcing-selection-analyst',
    prompt: {
      role: 'Sourcing selection analyst',
      task: `Select the vendor for the ${args.category} sourcing from the ranked evaluation matrix`,
      context: args,
      instructions: [
        'Select from args.rankedVendors (the deterministic process-computed ranking) — you may not introduce a vendor outside it.',
        'Any deviation from rank-1 MUST be justified against the integrity-gate record and negotiated terms; an unexplained deviation is a finding, not a choice.',
        'rationale must cite the scores, integrity-gate outcome, and negotiated terms it rests on.',
        'Return rankedVendors exactly as provided (echo, do not re-rank — ranking arithmetic is owned by process code).',
      ],
      outputFormat: 'JSON with vendor string, rationale string, rankedVendors array [{ vendor, totalScore, rank }]',
    },
    outputSchema: {
      type: 'object',
      required: ['vendor', 'rationale', 'rankedVendors'],
      properties: {
        vendor: { type: 'string' },
        rationale: { type: 'string' },
        rankedVendors: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'prc', 'procurement', 'selection'],
}));

// ---------------------------------------------------------------------------
// P9 — PO drafting
// ---------------------------------------------------------------------------

export const poDraftingTask = defineTask('prc.po-drafting', (args, taskCtx) => ({
  kind: 'agent',
  title: `PO drafting: ${args.vendor}`,
  agent: {
    name: 'po-drafter',
    prompt: {
      role: 'Purchase-order drafter',
      task: `Draft the purchase order for ${args.vendor}`,
      context: args,
      instructions: [
        'Draft the PO to artifactsDir and report poPath and poNumber.',
        'Every line item MUST trace to an approved negotiated term (termsRegister) or an RFx requirement — untraceable line items are findings to report, never entries to invent.',
        'The PO total must equal finalPrice — do not restate a different number.',
        'Include the approval record references (vendor-commitment, spend-approval) in the PO annex.',
      ],
      outputFormat: 'JSON with poPath string, poNumber string, lineItems array [{ id, description, amountUsd, sourceTermId? , sourceRequirementId? }], untraceableFindings array',
    },
    outputSchema: {
      type: 'object',
      required: ['poPath', 'poNumber', 'lineItems'],
      properties: {
        poPath: { type: 'string' },
        poNumber: { type: 'string' },
        lineItems: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['id', 'description', 'amountUsd'] },
        },
        untraceableFindings: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'prc', 'procurement', 'po'],
}));

// ---------------------------------------------------------------------------
// RFx critique gate — critic specs + gate-specific IRON LAW
// ---------------------------------------------------------------------------

const RFX_GATE_ID = 'prc.rfx-critique';

const RFX_IRON_LAW = [
  'Evidence entries MUST be requirement-level: requirementId/criterionId plus the quoted text, or an executed check output. Document-level impressions are protocol failures.',
  'The weight-sum check is EXECUTED: recompute the sum of the weights yourself and paste the computation.',
];

const RFX_CRITICS = [
  {
    name: 'requirements-completeness-critic',
    role: 'Adversarial requirements-completeness gatekeeper',
    focus: 'every intake mustHave is traceable to an RFx requirement — executed trace-matrix diff required',
    instructions: [
      'EXECUTED CHECK (required): build the mustHave-vs-RFx-requirement trace matrix YOURSELF from context.intake.mustHaves and the RFx document, compute the uncovered set, and paste the executed trace-matrix diff (actual mustHave list, matched requirement ids, computed uncovered set) into evidence. A verdict without this executed diff is invalid.',
      'Ambiguous or unverifiable requirements fail with the requirement text quoted.',
      'Requirements that appear in the RFx but trace to no intake need are scope-creep findings.',
    ],
  },
  {
    name: 'evaluability-critic',
    role: 'Adversarial evaluability gatekeeper',
    focus: 'the criteria set is scoreable: weights sum correctly, every criterion has a scoring anchor, every criterion is vendor-evidenceable',
    instructions: [
      'EXECUTED CHECK (required): recompute the weight sum YOURSELF from context.weights and paste the computation into evidence (weights must sum to 100, or 1.0 if fractional). A verdict without the pasted recomputation is invalid.',
      'Every criterion must state its scoring anchor — a criterion without one fails with the criterion quoted.',
      'Criteria a vendor cannot evidence (no observable artifact could support a score) fail with the criterion quoted.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Evaluation-integrity gate — critic specs + gate-specific IRON LAW
// ---------------------------------------------------------------------------

const INTEGRITY_GATE_ID = 'prc.evaluation-integrity';

const INTEGRITY_IRON_LAW = [
  'Evidence entries MUST be claim-level (claimId + evidencePath + location) or an executed recomputation output. Impressions about the matrix are protocol failures.',
  'The re-score check is EXECUTED: open every sampled claim\'s cited evidence file yourself and paste the re-score table.',
  'The total-score check is EXECUTED: recompute every vendor\'s weighted total yourself and paste the recomputation.',
];

const INTEGRITY_CRITICS = [
  {
    name: 'evidence-verification-critic',
    role: 'Adversarial evidence-verification gatekeeper',
    focus: 'sampled vendor claims are genuinely supported by their cited evidence files — executed re-scoring required',
    instructions: [
      'EXECUTED CHECK (required): for EVERY claim in context.sampledClaims OPEN the cited evidencePath yourself, re-score the referenced criterion from the evidence alone, and paste the executed re-score table (claimId, cited location, evaluator score, your re-score, delta) into evidence. A verdict without the executed re-score table is invalid.',
      'Any claim whose evidence file is absent or does not support the statement fails with the path quoted.',
      'A cited location that does not exist in the evidence file fails with both the location and the file\'s actual structure quoted.',
    ],
  },
  {
    name: 'scoring-consistency-critic',
    role: 'Adversarial scoring-consistency gatekeeper',
    focus: 'weighted totals are arithmetically correct and scoring anchors are applied uniformly across vendors',
    instructions: [
      'EXECUTED CHECK (required): recompute EVERY vendor\'s weighted totalScore yourself from context.evaluations scorecards and context.weights and paste the recomputation into evidence. A verdict without the pasted recomputation is invalid.',
      'Cross-vendor anchor drift (same evidence quality, different scores) fails with both scorecard entries quoted.',
      'A scorecard entry scoring a criterion absent from the RFx criteria set fails with the entry quoted.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    requirementsBrief,
    category,
    vendors,
    estimatedSpend,
    rfxType = 'RFP',
    evidenceSampleSize = 3,
    maxNegotiationRounds = 3,
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs || {};

  // No fallbacks: the anchor inputs are required — a run without them is unactionable.
  if (!requirementsBrief) {
    throw new Error('procurement-lifecycle requires requirementsBrief — there is no default sourcing brief.');
  }
  if (!category) {
    throw new Error('procurement-lifecycle requires category — there is no default procurement category.');
  }
  if (!Array.isArray(vendors) || vendors.length === 0) {
    throw new Error('procurement-lifecycle requires a non-empty vendors array — there is no default vendor pool (fallbacks forbidden).');
  }
  if (typeof estimatedSpend !== 'number' || !Number.isFinite(estimatedSpend)) {
    throw new Error('procurement-lifecycle requires a finite numeric estimatedSpend — spend drives approval routing (fallbacks forbidden).');
  }
  // Eager routing check: a routing-impossible spend fails before any task runs.
  resolveSpendExpert(estimatedSpend);

  const startTime = ctx.now();
  const timings = {};
  const breakpointsHit = [];
  const artifacts = [];
  const artifactsDir = ctx.artifactsDir;
  const sharedArgs = {
    requirementsBrief,
    category,
    vendors,
    estimatedSpend,
    rfxType,
    kipDir,
    kipModel,
    artifactsDir,
  };

  // Mutable run state — buildResult reads these so every rejection path returns the
  // full output shape with the decision recorded (never a silent partial exit).
  let intake = null;
  let recall = null;
  let rfx = null;
  let rfxGate = null;
  let evaluations = [];
  let rankedVendors = [];
  let evaluationMatrixPath = null;
  let integrityGate = null;
  let sampledClaims = [];
  const negotiationRounds = [];
  const termsRegister = [];
  let settled = false;
  let exhausted = false;
  let exhaustionDecision = null;
  let currentSpend = estimatedSpend;
  let selection = null;
  const approvals = {
    vendorCommitment: null,
    spendApproval: null,
    poIssuance: null,
  };
  let po = null;
  let kipFactsAsserted = 0;

  const buildResult = (success, reason) => ({
    success,
    intake,
    recall: recall
      ? { factCount: recall.factCount, insights: recall.insights }
      : null,
    rfx: rfx
      ? {
          rfxPath: rfx.rfxPath,
          criteria: rfx.criteria,
          weights: rfx.weights,
          gate: rfxGate
            ? {
                passed: rfxGate.passed,
                attempts: rfxGate.attempts,
                escalated: rfxGate.escalated,
                issues: rfxGate.issues,
                evidence: rfxGate.evidence,
              }
            : null,
        }
      : null,
    evaluations,
    integrityGate: integrityGate
      ? {
          passed: integrityGate.passed,
          attempts: integrityGate.attempts,
          escalated: integrityGate.escalated,
          issues: integrityGate.issues,
          evidence: integrityGate.evidence,
          sampledClaims,
        }
      : null,
    negotiation: {
      rounds: negotiationRounds,
      settled,
      exhausted,
      ...(exhaustionDecision && { exhaustionDecision }),
    },
    selection,
    approvals,
    po,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'procurement/procurement-lifecycle',
      runId: ctx.runId,
      category,
      breakpointsHit,
      timings: { ...timings, total: ctx.now() - startTime },
      ...(reason && { reason }),
    },
  });

  // Deterministic arithmetic — process code owns every number the approvals see.
  const computeWeightedTotal = (scorecard, weights) => {
    let total = 0;
    for (const entry of scorecard || []) {
      const weight = weights[entry.criterionId];
      if (typeof weight !== 'number' || Number.isNaN(weight)) {
        throw new Error(
          `procurement-lifecycle: criterion ${entry.criterionId} has no numeric weight in the RFx weights map — totals cannot be recomputed (fallbacks forbidden).`
        );
      }
      if (typeof entry.score !== 'number' || Number.isNaN(entry.score)) {
        throw new Error(
          `procurement-lifecycle: scorecard entry for ${entry.criterionId} has a non-numeric score — totals cannot be recomputed (fallbacks forbidden).`
        );
      }
      total += entry.score * weight;
    }
    return total;
  };

  // Deterministic claim sampling for the integrity gate: highest-weighted criteria
  // first, then claimId order — no RNG, so replays re-present identical gate inputs.
  const sampleVendorClaims = (claims, weights, sampleSize) => {
    const sorted = [...claims].sort((a, b) => {
      const weightA = weights[a.criterionId];
      const weightB = weights[b.criterionId];
      if (typeof weightA !== 'number' || Number.isNaN(weightA) || typeof weightB !== 'number' || Number.isNaN(weightB)) {
        throw new Error(
          'procurement-lifecycle: a claim references a criterion with no numeric weight — deterministic sampling is impossible (fallbacks forbidden).'
        );
      }
      if (weightB !== weightA) return weightB - weightA;
      return String(a.claimId).localeCompare(String(b.claimId));
    });
    return sorted.slice(0, Math.min(sampleSize, sorted.length));
  };

  // P0 — intake: requirements capture. No breakpoint here (sparse breakpoints);
  // riskFlags ride into later payloads instead.
  ctx.log?.('info', `P0: procurement intake for ${category}`);
  intake = await ctx.task(intakeRequirementsTask, sharedArgs);
  timings.intake = ctx.now() - startTime;

  // P1 — kip recall of vendor history and pricing baselines. Guarded symmetrically
  // with the P10 assert; the disabled shape is the documented empty-recall state.
  ctx.log?.('info', 'P1: kip recall of vendor history and pricing baselines');
  if (kipEnabled) {
    recall = await kipRecall(ctx, {
      kipDir,
      kipModel,
      kind: 'procurement',
      topic: `vendor history, negotiated pricing baselines, and award outcomes for category ${category} across vendors ${vendors.join(', ')}`,
    });
  } else {
    recall = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  }
  const priorKnowledge = recall;
  timings.recall = ctx.now() - startTime;

  // P2 — RFx authoring (composes supply-chain/rfx-management by name in the task
  // instructions; the authoring slice runs inline).
  ctx.log?.('info', `P2: ${rfxType} authoring`);
  rfx = await ctx.task(rfxAuthoringTask, { ...sharedArgs, intake, priorKnowledge });
  artifacts.push(rfx.rfxPath);
  timings.rfxAuthoring = ctx.now() - startTime;

  // P3 — adversarial requirements critique gate. Two independent critics fan out in
  // parallel inside the combinator; the authoring agent never reviews its own work.
  // Escalation on fix-budget exhaustion goes through the combinator's routed
  // 'prc.rfx-critique.gate-escalation' breakpoint (expert: owner).
  ctx.log?.('info', 'P3: adversarial requirements critique gate');
  rfxGate = await adversarialGate(ctx, {
    gateId: RFX_GATE_ID,
    artifact: {
      path: rfx.rfxPath,
      description: `${rfxType} package with evaluation criteria and weights`,
    },
    critics: RFX_CRITICS,
    ironLaw: RFX_IRON_LAW,
    maxFixAttempts,
    fixer: {},
    context: {
      requirementsBrief,
      intake,
      criteria: rfx.criteria,
      weights: rfx.weights,
      recall: { factCount: recall.factCount, insights: recall.insights, facts: recall.facts },
    },
  });
  if (rfxGate.escalated) {
    breakpointsHit.push(`${RFX_GATE_ID}.gate-escalation`);
  }
  timings.rfxGate = ctx.now() - startTime;
  if (!rfxGate.passed) {
    return buildResult(false, 'rfx critique gate failed after escalation — distribution never reached');
  }

  // P4 — parallel per-vendor evaluation: one independent agent per vendor, none
  // sees another's scorecard. After the join, process code recomputes every
  // totalScore from scorecard + weights and builds the ranked comparison matrix —
  // agents never own the arithmetic.
  ctx.log?.('info', `P4: parallel evaluation of ${vendors.length} vendor(s)`);
  const rawEvaluations = await ctx.parallel.all(
    vendors.map((vendor) => () =>
      ctx.task(vendorEvaluationTask, {
        ...sharedArgs,
        vendor,
        rfxPath: rfx.rfxPath,
        criteria: rfx.criteria,
        weights: rfx.weights,
        priorKnowledge,
      })
    )
  );
  evaluations = rawEvaluations.map((evaluation) => ({
    vendor: evaluation.vendor,
    scorecard: evaluation.scorecard,
    totalScore: computeWeightedTotal(evaluation.scorecard, rfx.weights),
    claims: evaluation.claims,
    evidencePaths: evaluation.evidencePaths || [],
    unevidencedClaims: evaluation.unevidencedClaims || [],
  }));
  rankedVendors = [...evaluations]
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return String(a.vendor).localeCompare(String(b.vendor));
    })
    .map((evaluation, index) => ({
      vendor: evaluation.vendor,
      totalScore: evaluation.totalScore,
      rank: index + 1,
    }));

  // Deterministic evaluation matrix artifact — written by process code so the
  // integrity gate executes against numbers no agent authored.
  evaluationMatrixPath = join(artifactsDir, 'evaluation-matrix.json');
  mkdirSync(dirname(evaluationMatrixPath), { recursive: true });
  writeFileSync(
    evaluationMatrixPath,
    JSON.stringify(
      {
        generatedBy: 'process-code',
        runId: ctx.runId,
        category,
        criteria: rfx.criteria,
        weights: rfx.weights,
        rankedVendors,
        evaluations,
      },
      null,
      2
    )
  );
  artifacts.push(evaluationMatrixPath);
  timings.vendorEvaluation = ctx.now() - startTime;

  // P5 — adversarial evaluation-integrity gate over deterministically sampled claims
  // (weight-ranked then claimId-ordered — replay-safe, no RNG).
  sampledClaims = evaluations.flatMap((evaluation) =>
    sampleVendorClaims(evaluation.claims, rfx.weights, evidenceSampleSize).map((claim) => ({
      vendor: evaluation.vendor,
      ...claim,
    }))
  );
  ctx.log?.('info', `P5: evaluation-integrity gate (${sampledClaims.length} sampled claim(s))`);
  integrityGate = await adversarialGate(ctx, {
    gateId: INTEGRITY_GATE_ID,
    artifact: {
      path: evaluationMatrixPath,
      description: 'Process-computed ranked evaluation matrix with per-vendor scorecards and claims',
    },
    critics: INTEGRITY_CRITICS,
    ironLaw: INTEGRITY_IRON_LAW,
    maxFixAttempts,
    fixer: {},
    context: {
      sampledClaims,
      evaluations,
      criteria: rfx.criteria,
      weights: rfx.weights,
    },
  });
  if (integrityGate.escalated) {
    breakpointsHit.push(`${INTEGRITY_GATE_ID}.gate-escalation`);
  }
  timings.integrityGate = ctx.now() - startTime;
  if (!integrityGate.passed) {
    return buildResult(false, 'evaluation-integrity gate failed after escalation — selection never reached');
  }

  // P6 — bounded negotiation loop with the preliminary frontrunner, strictly
  // sequential by design. Each round's routed approval uses a per-round-unique
  // breakpointId so replay never collapses two rounds.
  const frontrunner = rankedVendors[0].vendor;
  ctx.log?.('info', `P6: negotiation loop with ${frontrunner} (max ${maxNegotiationRounds} rounds)`);
  let openTerms = [];
  for (let round = 1; round <= maxNegotiationRounds; round++) {
    const analysis = await ctx.task(negotiationRoundAnalysisTask, {
      ...sharedArgs,
      round,
      vendor: frontrunner,
      priorRounds: negotiationRounds,
      termsRegister,
      priorKnowledge,
    });
    openTerms = analysis.openTerms || [];
    const terms = analysis.terms || [];
    if (analysis.roundSummaryPath) artifacts.push(analysis.roundSummaryPath);

    if (analysis.settled === true && terms.length === 0) {
      negotiationRounds.push({ round, terms: [], approval: null, settled: true });
      settled = true;
      break;
    }

    if (terms.length === 0) {
      // Honest pending state (e.g. no vendor response artifact yet) — recorded,
      // no approval raised this round, loop continues toward exhaustion.
      negotiationRounds.push({
        round,
        terms: [],
        approval: null,
        settled: false,
        pendingExternal: analysis.pendingExternal === true,
      });
      continue;
    }

    // Spend routing for this round: the latest term-level proposed spend if any
    // term restates the price, else the current spend position. Computed in
    // process code — never trusted from prose.
    const spendTerms = terms.filter(
      (t) => typeof t.proposedSpendUsd === 'number' && Number.isFinite(t.proposedSpendUsd)
    );
    const roundSpend = spendTerms.length > 0 ? spendTerms[spendTerms.length - 1].proposedSpendUsd : currentSpend;
    const roundExpert = resolveSpendExpert(roundSpend);
    const roundBreakpointId = `prc.approve-terms.round-${round}`;
    const termList = terms
      .map((t) => `${t.termId} [${t.category}]: ${t.description}`)
      .join('; ');
    const approval = await routedBreakpoint(ctx, {
      question: `Round ${round}: approve ${terms.length} negotiated term(s) with ${frontrunner} at $${roundSpend.toLocaleString('en-US')} proposed spend? Terms: ${termList}`,
      title: `Approve negotiation terms (round ${round})`,
      context: {
        runId: ctx.runId,
        round,
        terms,
        proposedSpendUsd: roundSpend,
        spendDeltaVsEstimate: roundSpend - estimatedSpend,
        files: [{ path: analysis.roundSummaryPath, label: `Round ${round} summary` }],
      },
    }, {
      breakpointId: roundBreakpointId,
      expert: roundExpert,
      tags: ['procurement', 'negotiation', 'terms'],
      strategy: 'single',
    });
    breakpointsHit.push(roundBreakpointId);

    const roundRecord = {
      round,
      terms,
      approval: {
        approved: approval.approved === true,
        expert: roundExpert,
        breakpointId: roundBreakpointId,
        response: approval.response || approval.feedback || null,
      },
      settled: analysis.settled === true,
    };
    negotiationRounds.push(roundRecord);

    if (approval.approved === true) {
      // Fold the approved terms into the terms register — the durable record
      // commitment, PO drafting, and kip facts all read from.
      for (const term of terms) {
        termsRegister.push({
          termId: term.termId,
          category: term.category,
          description: term.description,
          ourPosition: term.ourPosition,
          finalPosition: term.vendorPosition,
          approvedInRound: round,
          ...(typeof term.proposedSpendUsd === 'number' && { proposedSpendUsd: term.proposedSpendUsd }),
        });
      }
      currentSpend = roundSpend;
      if (analysis.settled === true) {
        settled = true;
        break;
      }
      continue;
    }

    // Rejection: the approver MUST supply a directive — an undirected rejection is
    // unactionable and throws (no fallback).
    const directive = approval.response || approval.feedback;
    if (!directive) {
      throw new Error(`${roundBreakpointId} rejected without a directive — the counter-proposal has nothing to apply (fallbacks forbidden).`);
    }
    const counter = await ctx.task(counterProposalTask, {
      ...sharedArgs,
      round,
      vendor: frontrunner,
      directive,
      rejectedTerms: terms,
      termsRegister,
      priorKnowledge,
    });
    artifacts.push(counter.updatedProposalPath);
  }
  timings.negotiation = ctx.now() - startTime;

  // Loop ended unsettled — never silently proceed: the spend-routed expert decides
  // whether commitment may be attempted with the open terms explicitly listed.
  if (!settled) {
    exhausted = true;
    const exhaustionExpert = resolveSpendExpert(currentSpend);
    const decision = await routedBreakpoint(ctx, {
      question: `Negotiation with ${frontrunner} is unsettled after ${maxNegotiationRounds} round(s) (${openTerms.length} open term(s)) at $${currentSpend.toLocaleString('en-US')} current spend. Approve to proceed to vendor commitment with the open terms explicitly listed, or reject to end the run with the full negotiation record.`,
      title: 'Negotiation rounds exhausted',
      context: {
        runId: ctx.runId,
        openTerms,
        rounds: negotiationRounds,
        termsRegister,
        currentSpendUsd: currentSpend,
      },
    }, {
      breakpointId: 'prc.negotiation-rounds-exhausted',
      expert: exhaustionExpert,
      tags: ['procurement', 'negotiation', 'escalation'],
      strategy: 'single',
    });
    breakpointsHit.push('prc.negotiation-rounds-exhausted');
    exhaustionDecision = {
      approved: decision.approved === true,
      breakpointId: 'prc.negotiation-rounds-exhausted',
      expert: exhaustionExpert,
      response: decision.response || decision.feedback || null,
    };
    if (decision.approved !== true) {
      return buildResult(false, 'negotiation rounds exhausted and escalation rejected — full negotiation record retained');
    }
  }

  // P7 — selection + policy-gated vendor commitment. Terminal: rejection is
  // recorded and ends the run; re-selection is a new run. Never auto-approved.
  ctx.log?.('info', 'P7: vendor selection + policy-gated vendor commitment');
  selection = await ctx.task(vendorSelectionTask, {
    ...sharedArgs,
    rankedVendors,
    integrityGate: {
      passed: integrityGate.passed,
      attempts: integrityGate.attempts,
      escalated: integrityGate.escalated,
      issues: integrityGate.issues,
    },
    termsRegister,
    priorKnowledge,
  });
  const commitmentExpert = resolveSpendExpert(currentSpend);
  const commitment = await routedBreakpoint(ctx, {
    question: `Commit to ${selection.vendor} for ${category} at $${currentSpend.toLocaleString('en-US')}? Communicating the award binds our position with every candidate vendor.`,
    title: 'Approve vendor commitment',
    context: {
      runId: ctx.runId,
      selection,
      termsRegister,
      integrityGate: {
        passed: integrityGate.passed,
        attempts: integrityGate.attempts,
        escalated: integrityGate.escalated,
        issues: integrityGate.issues,
        evidence: integrityGate.evidence,
      },
      files: [{ path: evaluationMatrixPath, label: 'Evaluation matrix' }],
    },
  }, {
    breakpointId: 'vendor-commitment',
    expert: commitmentExpert,
    tags: ['policy-gated', 'procurement'],
    strategy: 'single',
  });
  breakpointsHit.push('vendor-commitment');
  approvals.vendorCommitment = {
    approved: commitment.approved === true,
    breakpointId: 'vendor-commitment',
    expert: commitmentExpert,
    response: commitment.response || commitment.feedback || null,
  };
  timings.vendorCommitment = ctx.now() - startTime;
  if (commitment.approved !== true) {
    return buildResult(false, 'vendor commitment rejected — decision recorded; re-selection is a new run');
  }

  // P8 — policy-gated spend approval on the negotiated final price. The payload
  // names the routing tier that fired (transparency) and the delta vs estimate,
  // both computed in process code. Terminal on rejection. Never auto-approved.
  const finalPrice = currentSpend;
  const spendTier = resolveSpendTier(finalPrice);
  const spendDelta = finalPrice - estimatedSpend;
  ctx.log?.('info', 'P8: policy-gated spend approval');
  const spendApproval = await routedBreakpoint(ctx, {
    question: `Approve $${finalPrice.toLocaleString('en-US')} spend for ${selection.vendor} (${category})? Delta vs $${estimatedSpend.toLocaleString('en-US')} estimate: ${spendDelta >= 0 ? '+' : '-'}$${Math.abs(spendDelta).toLocaleString('en-US')}. Routing tier applied: ${describeTier(spendTier)}.`,
    title: 'Approve procurement spend',
    context: {
      runId: ctx.runId,
      finalPriceUsd: finalPrice,
      estimatedSpendUsd: estimatedSpend,
      spendDeltaUsd: spendDelta,
      routingTier: { maxSpendUsd: spendTier.maxSpendUsd, expert: spendTier.expert },
      termsRegister,
      vendorCommitment: approvals.vendorCommitment,
    },
  }, {
    breakpointId: 'spend-approval',
    expert: spendTier.expert,
    tags: ['policy-gated', 'procurement', 'spend'],
    strategy: 'single',
  });
  breakpointsHit.push('spend-approval');
  approvals.spendApproval = {
    approved: spendApproval.approved === true,
    breakpointId: 'spend-approval',
    expert: spendTier.expert,
    response: spendApproval.response || spendApproval.feedback || null,
  };
  timings.spendApproval = ctx.now() - startTime;
  if (spendApproval.approved !== true) {
    return buildResult(false, 'spend approval rejected — decision recorded; PO drafting never reached');
  }

  // P9 — PO drafting, then policy-gated PO issuance. Only after this approval is
  // the PO treated as issued. Terminal on rejection. Never auto-approved.
  ctx.log?.('info', 'P9: PO drafting + policy-gated PO issuance');
  const poDraft = await ctx.task(poDraftingTask, {
    ...sharedArgs,
    vendor: selection.vendor,
    termsRegister,
    finalPrice,
    approvals: {
      vendorCommitment: approvals.vendorCommitment,
      spendApproval: approvals.spendApproval,
    },
  });
  artifacts.push(poDraft.poPath);
  const issuanceExpert = resolveSpendExpert(finalPrice);
  const issuance = await routedBreakpoint(ctx, {
    question: `Issue purchase order ${poDraft.poNumber} to ${selection.vendor} for $${finalPrice.toLocaleString('en-US')}? Issuing creates a binding commercial commitment.`,
    title: 'Approve PO issuance',
    context: {
      runId: ctx.runId,
      poNumber: poDraft.poNumber,
      lineItems: poDraft.lineItems,
      untraceableFindings: poDraft.untraceableFindings || [],
      finalPriceUsd: finalPrice,
      files: [{ path: poDraft.poPath, label: 'Draft purchase order' }],
    },
  }, {
    breakpointId: 'po-issuance',
    expert: issuanceExpert,
    tags: ['policy-gated', 'procurement'],
    strategy: 'single',
  });
  breakpointsHit.push('po-issuance');
  approvals.poIssuance = {
    approved: issuance.approved === true,
    breakpointId: 'po-issuance',
    expert: issuanceExpert,
    response: issuance.response || issuance.feedback || null,
  };
  timings.poIssuance = ctx.now() - startTime;
  if (issuance.approved !== true) {
    return buildResult(false, 'po issuance rejected — decision recorded; PO not issued');
  }
  po = { poPath: poDraft.poPath, poNumber: poDraft.poNumber, finalPrice };

  // P10 — kip assert. Facts are built deterministically IN PROCESS CODE from the
  // terms register and run state — agents never invent them. Guarded by the same
  // kipEnabled flag as the P1 recall.
  if (kipEnabled) {
    ctx.log?.('info', 'P10: kip assert of negotiated prices and award outcomes');
    const facts = [];
    for (const term of termsRegister) {
      facts.push({
        subject: `vendor:${selection.vendor}`,
        predicate: 'negotiated-term',
        object: `term:${term.termId}`,
        props: {
          category: term.category,
          finalPosition: term.finalPosition,
          round: term.approvedInRound,
          runId: ctx.runId,
        },
      });
    }
    facts.push({
      subject: `vendor:${selection.vendor}`,
      predicate: 'awarded',
      object: `category:${category}`,
      props: {
        finalPrice,
        poNumber: po.poNumber,
        estimatedSpend,
        rounds: negotiationRounds.length,
        runId: ctx.runId,
      },
    });
    for (const ranked of rankedVendors) {
      if (ranked.vendor === selection.vendor) continue;
      facts.push({
        subject: `vendor:${ranked.vendor}`,
        predicate: 'evaluated-not-awarded',
        object: `category:${category}`,
        props: {
          totalScore: ranked.totalScore,
          rank: ranked.rank,
          runId: ctx.runId,
        },
      });
    }
    const gateEscalations = breakpointsHit.filter(
      (id) => id === `${RFX_GATE_ID}.gate-escalation` || id === `${INTEGRITY_GATE_ID}.gate-escalation`
    ).length;
    facts.push({
      subject: `procurement:${category}:${ctx.runId}`,
      predicate: 'lifecycle-outcome',
      object: settled ? 'outcome:settled' : 'outcome:exhausted-approved',
      props: {
        gateAttempts: {
          rfxCritique: rfxGate.attempts,
          evaluationIntegrity: integrityGate.attempts,
        },
        escalations: gateEscalations + (exhausted ? 1 : 0),
        poIssued: approvals.poIssuance.approved,
        runId: ctx.runId,
      },
    });
    const assertion = await kipAssert(ctx, { kipDir, kipModel, kind: 'procurement', facts });
    kipFactsAsserted = assertion.asserted;
  }
  timings.kipAssert = ctx.now() - startTime;

  return buildResult(true);
}
