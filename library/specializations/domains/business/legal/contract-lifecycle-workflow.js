/**
 * @process legal/contract-lifecycle-workflow
 * @description End-to-end commercial contract lifecycle: party/context intake, kip recall of
 *   counterparty history and playbook positions, parallel clause extraction + risk scoring,
 *   redline drafting with mandatory high-risk dispositions, adversarial redline critique gate
 *   (clause-level evidence, executed coverage check), policy-gated external redline send,
 *   bounded negotiation rounds with per-round routed approval of non-standard terms
 *   (severity-routed legal-counsel vs general-counsel), policy-gated terms acceptance and
 *   signature execution, obligation extraction and handoff, kip assert of
 *   deviations/positions/outcomes.
 * @inputs {
 *   contractPath: string,          // required — the contract document under negotiation
 *   counterparty: string,          // required — the counterparty name
 *   contractType?: string,         // e.g. 'master-services-agreement'
 *   partyRole?: string,            // our side, e.g. 'vendor' | 'customer'
 *   playbook: string,              // required — clause playbook reference (no default playbook, fallbacks forbidden)
 *   contractValue?: number,        // commercial value for risk context
 *   jurisdiction?: string,         // governing-law hint
 *   maxNegotiationRounds?: number, // bounded negotiation loop (default 3)
 *   maxFixAttempts?: number,       // redline-gate fixer budget (default 2)
 *   kipEnabled?: boolean,          // recall + assert legal-contracts memory via kip (default true)
 *   kipDir?: string,               // kip store directory (default '.a5c/kip')
 *   kipModel?: string              // model for kip structured paths (default 'sonnet')
 * }
 * @outputs {
 *   success: boolean,
 *   intake: object,                // { parties, contractType, governingLaw, keyDates, summary, riskFlags }
 *   recall: object,                // { factCount, insights }
 *   clauses: object,               // { count, highRiskClauseIds, missingExpectedClauses }
 *   redline: object,               // { redlinePath, dispositions, gate { passed, attempts, escalated, issues, evidence } }
 *   negotiation: object,           // { rounds [{ round, nonStandardTerms, approval { approved, expert, breakpointId, response }, settled }], settled, exhausted, exhaustionDecision? }
 *   approvals: object,             // { sendRedlineExternal, acceptContractTerms, executeContractSignature } — each { approved, breakpointId, expert, response }
 *   obligations: array,            // [{ id, party, type, description, dueDate?, recurring, sourceClauseId }]
 *   handoffPath: string,
 *   kipFactsAsserted: number,
 *   artifacts: array,
 *   metadata: object               // { processId, runId, counterparty, breakpointsHit, timings }
 * }
 * @graph
 *   domains: [domain:legal, domain:business]
 *   specializations: [specialization:legal-compliance]
 *   skillAreas: [skill-area:compliance-automation, skill-area:knowledge-management]
 *   workflows: [workflow:contract-lifecycle]
 *   topics: [topic:quality-assurance]
 *   roles: [role:legal-counsel, role:general-counsel, role:compliance-officer]
 * @supersedes specializations/domains/business/legal/contract-lifecycle-management.js — keeps
 *   intake/authoring/negotiation/execution/obligation domain phases; rebuilds with routed
 *   breakpoints, adversarial gates, kip memory, no stage-router entrypoint
 * @policyGatedActions send-redline-external (legal-counsel), accept-contract-terms
 *   (general-counsel), execute-contract-signature (authorized-signatory) — each via
 *   routedBreakpoint with breakpointId = actionId, tags ['policy-gated','legal'], never
 *   auto-approved
 * @example
 * const result = await orchestrate('legal/contract-lifecycle-workflow', {
 *   contractPath: 'contracts/acme-msa.md',
 *   counterparty: 'Acme Corp',
 *   contractType: 'master-services-agreement',
 *   partyRole: 'vendor',
 *   playbook: 'standard-msa-playbook',
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

// ---------------------------------------------------------------------------
// P0 — intake: party/context capture
// ---------------------------------------------------------------------------

export const intakePartyCaptureTask = defineTask('clw.intake-party-capture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Contract intake: ${args.counterparty}`,
  agent: {
    name: 'legal-intake-analyst',
    prompt: {
      role: 'Legal intake analyst',
      task: `Capture parties and context for the contract at ${args.contractPath}`,
      context: args,
      instructions: [
        'Read the contract at contractPath and capture: parties (name, role, entity type), our partyRole, contractType, governing law/jurisdiction, effective/term/renewal dates, commercial summary, initial riskFlags.',
        'Flag missing/ambiguous party or authority info as riskFlags — do not infer or invent entity details.',
        'Do not review clauses in depth here.',
      ],
      outputFormat: 'JSON with parties array [{ name, role, entityType }], partyRole string, contractType string, governingLaw string, keyDates object, summary string, riskFlags array',
    },
    outputSchema: {
      type: 'object',
      required: ['parties', 'contractType', 'summary'],
      properties: {
        parties: {
          type: 'array',
          items: { type: 'object', required: ['name', 'role'] },
        },
        partyRole: { type: 'string' },
        contractType: { type: 'string' },
        governingLaw: { type: 'string' },
        keyDates: { type: 'object' },
        summary: { type: 'string' },
        riskFlags: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'clw', 'legal', 'intake'],
}));

// ---------------------------------------------------------------------------
// P2 — parallel analysis: clause extraction + risk scoring
// ---------------------------------------------------------------------------

export const clauseExtractionTask = defineTask('clw.clause-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Clause extraction: ${args.counterparty}`,
  agent: {
    name: 'legal-clause-analyst',
    prompt: {
      role: 'Legal clause analyst',
      task: `Extract every distinct clause from the contract at ${args.contractPath}`,
      context: args,
      instructions: [
        'Identify every distinct clause: id (stable kebab-case), category, heading, verbatim excerpt, location (section/page — required for clause-level evidence), standard vs non-standard against the playbook.',
        'Use the review dimensions of legal/contract-review-analysis.js (clause categories: liability, indemnification, IP, confidentiality, termination, payment, warranties, dispute resolution, data protection; standard-vs-negotiated; cross-references; missing expected clauses). For a full standalone deep review, run that process — this task performs the extraction slice inline.',
        'Report missingExpectedClauses explicitly — an absent liability cap or indemnity clause is a finding, never a silent skip.',
      ],
      outputFormat: 'JSON with clauses array [{ id, category, heading, text, location, standard }], clauseCount number, categoryCount object, missingExpectedClauses array',
    },
    outputSchema: {
      type: 'object',
      required: ['clauses', 'clauseCount'],
      properties: {
        clauses: {
          type: 'array',
          items: { type: 'object', required: ['id', 'category', 'text', 'location', 'standard'] },
        },
        clauseCount: { type: 'number' },
        categoryCount: { type: 'object' },
        missingExpectedClauses: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'clw', 'legal', 'clauses'],
}));

export const riskScoringTask = defineTask('clw.risk-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Risk scoring: ${args.counterparty}`,
  agent: {
    name: 'legal-risk-analyst',
    prompt: {
      role: 'Legal risk analyst',
      task: `Independently score risk across the contract at ${args.contractPath}`,
      context: args,
      instructions: [
        'Independently read the contract (do NOT trust clause-extraction — runs in parallel) and produce riskRegister: one entry per risky provision {clauseRef, category, severity low|medium|high|critical, rationale, exposure}.',
        'Severity anchors: liability caps, indemnification scope, IP assignment, unlimited-liability carve-outs are high/critical by default; playbook deviations raise severity.',
        'Honor recalled counterparty history: previously conceded/refused positions adjust severity, with the prior fact cited in rationale.',
        'Emit highRiskClauseRefs — the exact list the gate executes coverage against. Never soften a severity to shrink this list.',
      ],
      outputFormat: 'JSON with riskRegister array [{ clauseRef, category, severity, rationale, exposure }], highRiskClauseRefs array, overallRisk string',
    },
    outputSchema: {
      type: 'object',
      required: ['riskRegister', 'highRiskClauseRefs', 'overallRisk'],
      properties: {
        riskRegister: {
          type: 'array',
          items: { type: 'object', required: ['clauseRef', 'category', 'severity', 'rationale'] },
        },
        highRiskClauseRefs: { type: 'array' },
        overallRisk: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'clw', 'legal', 'risk'],
}));

// ---------------------------------------------------------------------------
// P3 — redline drafting (also the P5 revision pass when feedback is present)
// ---------------------------------------------------------------------------

export const redlineDraftingTask = defineTask('clw.redline-drafting', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Revise redline for ${args.counterparty} (breakpoint feedback)`
    : `Draft redline for ${args.counterparty}`,
  agent: {
    name: 'legal-redline-drafter',
    prompt: {
      role: 'Legal redline drafter',
      task: `Draft the redline for the contract with ${args.counterparty}`,
      context: args,
      instructions: [
        'Reconcile clause extraction with the risk register (clauseRef <-> clause.id/location matching is your responsibility; report unmatched refs, never drop them) and draft the redline to artifactsDir, reporting redlinePath.',
        'Produce dispositions: one per redlined clause { clauseId, clauseRef, disposition: accept|revise|reject|escalate, proposedText (required when revise), rationale, severity }.',
        'IRON-LAW CONTRACT: every entry in highRiskClauseRefs MUST have a disposition entry. The gate executes this check. Do not mark high-risk items \'accept\' without playbook- or recall-grounded rationale.',
        'Cite which playbook position or prior fact each \'revise\'/\'reject\' rests on.',
        args.feedback
          ? `When feedback present (revision round): address ONLY the feedback, emit redlineDiff. Feedback: ${JSON.stringify(args.feedback)}`
          : 'First drafting round: no revision feedback to address.',
      ],
      outputFormat: 'JSON with redlinePath string, dispositions array [{ clauseId, clauseRef, disposition, proposedText, rationale, severity }], unmatchedRiskRefs array, redlineDiff string',
    },
    outputSchema: {
      type: 'object',
      required: ['redlinePath', 'dispositions'],
      properties: {
        redlinePath: { type: 'string' },
        dispositions: {
          type: 'array',
          items: { type: 'object', required: ['clauseId', 'disposition', 'rationale'] },
        },
        unmatchedRiskRefs: { type: 'array' },
        redlineDiff: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'clw', 'legal', 'redline'],
}));

// ---------------------------------------------------------------------------
// P6 — negotiation loop tasks
// ---------------------------------------------------------------------------

export const negotiationRoundAnalysisTask = defineTask('clw.negotiation-round-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Negotiation round ${args.round} analysis: ${args.counterparty}`,
  agent: {
    name: 'legal-negotiation-analyst',
    prompt: {
      role: 'Legal negotiation analyst',
      task: `Analyze negotiation round ${args.round} with ${args.counterparty}`,
      context: args,
      instructions: [
        'Ingest the counterparty\'s response for this round; if no counterparty response artifact exists yet, report settled:false with pendingExternal:true and empty nonStandardTerms — an honest state, not a fallback.',
        'For every counterparty change: acceptable-per-playbook (fold in, listed) or non-standard term { termId, clauseId, category, description, ourPosition, counterpartyPosition, deviationSeverity }.',
        'deviationSeverity routing rule (verbatim): \'critical-deviation\' for liability caps, indemnification scope, IP assignment/ownership; \'standard-deviation\' otherwise. Never downgrade to avoid escalation.',
        'Write the round summary artifact (roundSummaryPath) with per-term positions for the approval payload.',
        'settled:true only when no open terms remain.',
      ],
      outputFormat: 'JSON with nonStandardTerms array [{ termId, clauseId, category, description, ourPosition, counterpartyPosition, deviationSeverity }], acceptedPerPlaybook array, settled boolean, pendingExternal boolean, openTerms array, roundSummaryPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['nonStandardTerms', 'settled', 'openTerms', 'roundSummaryPath'],
      properties: {
        nonStandardTerms: {
          type: 'array',
          items: {
            type: 'object',
            required: ['termId', 'clauseId', 'description', 'deviationSeverity', 'ourPosition', 'counterpartyPosition'],
            properties: {
              deviationSeverity: { type: 'string', enum: ['standard-deviation', 'critical-deviation'] },
            },
          },
        },
        acceptedPerPlaybook: { type: 'array' },
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
  labels: ['agent', 'clw', 'legal', 'negotiation'],
}));

export const counterRedlineTask = defineTask('clw.counter-redline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Counter-redline (round ${args.round}): ${args.counterparty}`,
  agent: {
    name: 'legal-redline-drafter',
    prompt: {
      role: 'Legal counter-redline drafter',
      task: `Produce the round-${args.round} counter-redline under counsel directive`,
      context: args,
      instructions: [
        'Apply ONLY the counsel directive (args.directive) plus rejected terms to produce the next-round counter-redline; report updatedRedlinePath.',
        'Preserve every already-approved position unchanged; list changes per term.',
        'No scope creep.',
      ],
      outputFormat: 'JSON with updatedRedlinePath string, changes array (one entry per term changed)',
    },
    outputSchema: {
      type: 'object',
      required: ['updatedRedlinePath', 'changes'],
      properties: {
        updatedRedlinePath: { type: 'string' },
        changes: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'clw', 'legal', 'negotiation', 'fixer'],
}));

// ---------------------------------------------------------------------------
// P9 — obligations + handoff
// ---------------------------------------------------------------------------

export const obligationExtractionTask = defineTask('clw.obligation-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Obligation extraction: ${args.counterparty}`,
  agent: {
    name: 'legal-obligation-analyst',
    prompt: {
      role: 'Legal obligation analyst',
      task: `Extract obligations from the executed final draft at ${args.finalRedlinePath}`,
      context: args,
      instructions: [
        'Parse the executed final draft into obligations: { id, party, type (delivery|payment|reporting|compliance|renewal|confidentiality), description, dueDate?, recurring, sourceClauseId }.',
        'sourceClauseId REQUIRED — an untraceable obligation is a finding to report, never an entry to invent.',
        'Include obligations created by negotiated deviations (cross-check deviationRegister).',
      ],
      outputFormat: 'JSON with obligations array [{ id, party, type, description, dueDate, recurring, sourceClauseId }], untraceableFindings array',
    },
    outputSchema: {
      type: 'object',
      required: ['obligations'],
      properties: {
        obligations: {
          type: 'array',
          items: { type: 'object', required: ['id', 'party', 'type', 'description', 'sourceClauseId'] },
        },
        untraceableFindings: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'clw', 'legal', 'obligations'],
}));

export const handoffPackageTask = defineTask('clw.handoff-package', (args, taskCtx) => ({
  kind: 'agent',
  title: `Handoff package: ${args.counterparty}`,
  agent: {
    name: 'legal-handoff-writer',
    prompt: {
      role: 'Legal handoff writer',
      task: `Write the contract handoff package for ${args.counterparty}`,
      context: args,
      instructions: [
        'Write handoff markdown (handoffPath): executed-contract reference, all three policy-gated approval records, full deviation register with severities and approving rounds, negotiation history, obligations table, open follow-ups.',
        'Factual only — every claim links to a task result, breakpoint record, or artifact path.',
      ],
      outputFormat: 'JSON with handoffPath string, summary string',
    },
    outputSchema: {
      type: 'object',
      required: ['handoffPath'],
      properties: {
        handoffPath: { type: 'string' },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'clw', 'legal', 'handoff'],
}));

// ---------------------------------------------------------------------------
// Redline critique gate — critic specs + gate-specific IRON LAW
// ---------------------------------------------------------------------------

const REDLINE_GATE_ID = 'clw.redline-critique';

const REDLINE_IRON_LAW = [
  'Evidence entries MUST be clause-level: clauseId plus section/location, or an executed set-comparison output. Document-level impressions are protocol failures.',
  'The risk-coverage check is EXECUTED: compute the highRiskClauseRefs-vs-dispositions difference and show it.',
];

const REDLINE_CRITICS = [
  {
    name: 'risk-coverage-critic',
    role: 'Adversarial risk-coverage gatekeeper',
    focus: 'every high-risk clause identified at extraction carries a defensible disposition — executed coverage check required',
    instructions: [
      'EXECUTED CHECK (required): load riskScoring.highRiskClauseRefs and the dispositions array from context, compute the set difference YOURSELF, and paste the executed comparison (actual ref lists + computed uncovered set) into evidence. A verdict without this executed diff is invalid.',
      'Every issue and evidence entry must cite clause-level references (clauseId + section/location) — \'coverage looks fine\' is not evidence.',
      'Attack disposition quality: \'accept\' on a critical-severity clause without playbook/recall-grounded rationale fails; \'escalate\' with no named term for the negotiation loop fails.',
      'Any unmatchedRiskRefs entry is an automatic issue until resolved.',
    ],
  },
  {
    name: 'playbook-conformance-critic',
    role: 'Adversarial playbook-conformance gatekeeper',
    focus: 'every disposition is genuinely grounded in the playbook and the recall output — fabricated citations fail',
    instructions: [
      'Verify each disposition\'s cited playbook position actually exists (read the playbook) and each cited prior fact appears in the recall output — fabricated grounding fails with the fabricated citation quoted.',
      'revise entries without proposedText fail; proposedText contradicting the cited position fails with both texts quoted.',
      'missingExpectedClauses with no corresponding insertion disposition fails.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    contractPath,
    counterparty,
    contractType,
    partyRole,
    playbook,
    contractValue,
    jurisdiction,
    maxNegotiationRounds = 3,
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs || {};

  // No fallbacks: the three anchor inputs are required — a run without them is unactionable.
  if (!contractPath) {
    throw new Error('contract-lifecycle-workflow requires contractPath — there is no default contract.');
  }
  if (!counterparty) {
    throw new Error('contract-lifecycle-workflow requires counterparty — there is no default counterparty.');
  }
  if (!playbook) {
    throw new Error('contract-lifecycle-workflow requires playbook — there is no default playbook (fallbacks forbidden).');
  }

  const startTime = ctx.now();
  const timings = {};
  const breakpointsHit = [];
  const artifacts = [];
  const artifactsDir = ctx.artifactsDir;
  const sharedArgs = {
    contractPath,
    counterparty,
    contractType,
    partyRole,
    playbook,
    contractValue,
    jurisdiction,
    kipDir,
    kipModel,
    artifactsDir,
  };

  // Mutable run state — buildResult reads these so every rejection path returns the
  // full output shape with the decision recorded (never a silent partial exit).
  let intake = null;
  let recall = null;
  let clauseExtraction = null;
  let riskScoring = null;
  let redline = null;
  let redlineGate = null;
  const negotiationRounds = [];
  let settled = false;
  let exhausted = false;
  let exhaustionDecision = null;
  const deviationRegister = [];
  let openTerms = [];
  const approvals = {
    sendRedlineExternal: null,
    acceptContractTerms: null,
    executeContractSignature: null,
  };
  let obligations = [];
  let handoffPath = null;
  let kipFactsAsserted = 0;

  const buildResult = (success, reason) => ({
    success,
    intake,
    recall: recall
      ? { factCount: recall.factCount, insights: recall.insights }
      : null,
    clauses: clauseExtraction
      ? {
          count: clauseExtraction.clauseCount,
          highRiskClauseIds: riskScoring ? riskScoring.highRiskClauseRefs : [],
          missingExpectedClauses: clauseExtraction.missingExpectedClauses || [],
        }
      : null,
    redline: redline
      ? {
          redlinePath: redline.redlinePath,
          dispositions: redline.dispositions,
          gate: redlineGate
            ? {
                passed: redlineGate.passed,
                attempts: redlineGate.attempts,
                escalated: redlineGate.escalated,
                issues: redlineGate.issues,
                evidence: redlineGate.evidence,
              }
            : null,
        }
      : null,
    negotiation: {
      rounds: negotiationRounds,
      settled,
      exhausted,
      ...(exhaustionDecision && { exhaustionDecision }),
    },
    approvals,
    obligations,
    handoffPath,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'legal/contract-lifecycle-workflow',
      runId: ctx.runId,
      counterparty,
      breakpointsHit,
      timings: { ...timings, total: ctx.now() - startTime },
      ...(reason && { reason }),
    },
  });

  // P0 — intake: validate-then-capture. No breakpoint here (sparse breakpoints);
  // riskFlags ride into later payloads instead.
  ctx.log?.('info', `P0: contract intake for ${counterparty}`);
  intake = await ctx.task(intakePartyCaptureTask, sharedArgs);
  timings.intake = ctx.now() - startTime;

  // P1 — kip recall of counterparty history + playbook positions. Guarded symmetrically
  // with the P10 assert; the disabled shape is the documented empty-recall state.
  ctx.log?.('info', 'P1: kip recall of counterparty history and playbook positions');
  if (kipEnabled) {
    recall = await kipRecall(ctx, {
      kipDir,
      kipModel,
      kind: 'legal-contracts',
      topic: `counterparty ${counterparty} negotiation history, agreed deviations, and ${playbook} playbook positions for ${contractType}`,
    });
  } else {
    recall = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  }
  const priorKnowledge = recall;
  timings.recall = ctx.now() - startTime;

  // P2 — parallel analysis: clause extraction and risk scoring read the contract
  // independently. riskScoring.highRiskClauseRefs is the coverage contract the
  // redline gate executes against.
  ctx.log?.('info', 'P2: parallel clause extraction + risk scoring');
  [clauseExtraction, riskScoring] = await ctx.parallel.all([
    () => ctx.task(clauseExtractionTask, { ...sharedArgs, intake, priorKnowledge }),
    () => ctx.task(riskScoringTask, { ...sharedArgs, intake, priorKnowledge }),
  ]);
  timings.parallelAnalysis = ctx.now() - startTime;

  const highRiskClauseRefs = riskScoring.highRiskClauseRefs;

  // P3 — redline drafting under the IRON-LAW coverage contract.
  ctx.log?.('info', 'P3: redline drafting');
  redline = await ctx.task(redlineDraftingTask, {
    ...sharedArgs,
    clauses: clauseExtraction.clauses,
    missingExpectedClauses: clauseExtraction.missingExpectedClauses || [],
    riskRegister: riskScoring.riskRegister,
    highRiskClauseRefs,
    priorKnowledge,
  });
  artifacts.push(redline.redlinePath);
  timings.redlineDraft = ctx.now() - startTime;

  // P4 — adversarial redline critique gate. Two independent critics fan out in
  // parallel inside the combinator; the drafting agent never reviews its own work.
  // Escalation on fix-budget exhaustion goes through the combinator's routed
  // 'clw.redline-critique.gate-escalation' breakpoint (expert: owner).
  const runRedlineGate = (currentRedline) =>
    adversarialGate(ctx, {
      gateId: REDLINE_GATE_ID,
      artifact: {
        path: currentRedline.redlinePath,
        description: 'Redlined draft with per-clause dispositions',
      },
      critics: REDLINE_CRITICS,
      ironLaw: REDLINE_IRON_LAW,
      maxFixAttempts,
      fixer: {},
      context: {
        highRiskClauseRefs,
        dispositions: currentRedline.dispositions,
        unmatchedRiskRefs: currentRedline.unmatchedRiskRefs || [],
        riskRegister: riskScoring.riskRegister,
        playbook,
        clauses: clauseExtraction.clauses,
        recall: { factCount: recall.factCount, insights: recall.insights, facts: recall.facts },
      },
    });

  ctx.log?.('info', 'P4: adversarial redline critique gate');
  redlineGate = await runRedlineGate(redline);
  if (redlineGate.escalated) {
    breakpointsHit.push(`${REDLINE_GATE_ID}.gate-escalation`);
  }
  timings.redlineGate = ctx.now() - startTime;
  if (!redlineGate.passed) {
    // Gate failed even after owner escalation — never proceeds to external send.
    return buildResult(false, 'redline critique gate failed after escalation — external send never reached');
  }

  // Deterministic coverage table for the send-approval payload: the executed
  // set-comparison is computed in process code, not trusted from any agent.
  const computeCoverage = (currentRedline) => {
    const covered = new Set();
    for (const d of currentRedline.dispositions || []) {
      if (d.clauseId) covered.add(d.clauseId);
      if (d.clauseRef) covered.add(d.clauseRef);
    }
    return (highRiskClauseRefs || []).map((ref) => ({ ref, covered: covered.has(ref) }));
  };

  // P5 — policy-gated external redline send. Bounded 2-round loop: rejection with a
  // directive earns exactly one revision pass (gate re-run before re-presenting the
  // SAME breakpointId); a second rejection is recorded and ends the run. Never
  // auto-approved: no autoApproveAfterN, no presentAlwaysApprove.
  ctx.log?.('info', 'P5: policy-gated external redline send approval');
  let sendFeedback = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      redline = await ctx.task(redlineDraftingTask, {
        ...sharedArgs,
        clauses: clauseExtraction.clauses,
        missingExpectedClauses: clauseExtraction.missingExpectedClauses || [],
        riskRegister: riskScoring.riskRegister,
        highRiskClauseRefs,
        priorKnowledge,
        feedback: sendFeedback,
        revision: attempt,
      });
      artifacts.push(redline.redlinePath);
      redlineGate = await runRedlineGate(redline);
      if (redlineGate.escalated) {
        breakpointsHit.push(`${REDLINE_GATE_ID}.gate-escalation`);
      }
      if (!redlineGate.passed) {
        return buildResult(false, 'revised redline failed the critique gate after escalation — external send never reached');
      }
    }
    const approval = await routedBreakpoint(ctx, {
      question: `Send this redline to ${counterparty}? Transmitting binds our negotiating posture.`,
      title: 'Approve external redline send',
      context: {
        runId: ctx.runId,
        files: [{ path: redline.redlinePath, label: 'Redlined draft' }],
        summary: {
          dispositions: redline.dispositions,
          gate: {
            passed: redlineGate.passed,
            attempts: redlineGate.attempts,
            escalated: redlineGate.escalated,
            issues: redlineGate.issues,
            evidence: redlineGate.evidence,
          },
          highRiskCoverage: computeCoverage(redline),
        },
      },
      previousFeedback: sendFeedback || undefined,
    }, {
      breakpointId: 'send-redline-external',
      expert: 'legal-counsel',
      tags: ['policy-gated', 'legal'],
      strategy: 'single',
    });
    breakpointsHit.push('send-redline-external');
    approvals.sendRedlineExternal = {
      approved: approval.approved === true,
      breakpointId: 'send-redline-external',
      expert: 'legal-counsel',
      response: approval.response || approval.feedback || null,
    };
    if (approval.approved === true) break;
    if (attempt === 0) {
      sendFeedback = approval.response || approval.feedback;
      if (!sendFeedback) {
        // No fallback: a rejection without a directive is unactionable — the one
        // revision pass has nothing to revise against.
        throw new Error('send-redline-external rejected without a directive — cannot revise (fallbacks forbidden).');
      }
    }
  }
  timings.sendRedline = ctx.now() - startTime;
  if (!approvals.sendRedlineExternal.approved) {
    // Second rejection: recorded verbatim, run ends — signature phases never reached.
    return buildResult(false, 'external redline send rejected twice — decision recorded');
  }

  // P6 — bounded negotiation loop, strictly sequential by design. Each round's
  // routed approval uses a per-round-unique breakpointId so replay never
  // collapses two rounds.
  ctx.log?.('info', `P6: negotiation loop (max ${maxNegotiationRounds} rounds)`);
  let currentRedlinePath = redline.redlinePath;
  for (let round = 1; round <= maxNegotiationRounds; round++) {
    const analysis = await ctx.task(negotiationRoundAnalysisTask, {
      ...sharedArgs,
      round,
      redlinePath: currentRedlinePath,
      dispositions: redline.dispositions,
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
      // Honest pending state (e.g. no counterparty response artifact yet) — recorded,
      // no approval raised this round, loop continues toward exhaustion.
      negotiationRounds.push({
        round,
        nonStandardTerms: [],
        approval: null,
        settled: false,
        pendingExternal: analysis.pendingExternal === true,
      });
      continue;
    }

    // Severity routing: any critical-deviation (liability/indemnity/IP) escalates the
    // round to general-counsel; standard deviations route to legal-counsel.
    const criticalTerms = terms.filter((t) => t.deviationSeverity === 'critical-deviation');
    const expert = criticalTerms.length > 0 ? 'general-counsel' : 'legal-counsel';
    const roundBreakpointId = `legal.approve-nonstandard-terms.round-${round}`;
    const termList = terms
      .map((t) => `${t.termId} [${t.deviationSeverity}]: ${t.description}`)
      .join('; ');
    const approval = await routedBreakpoint(ctx, {
      question: `Round ${round}: approve ${terms.length} non-standard term(s) (${criticalTerms.length} critical-deviation) with ${counterparty}? Terms: ${termList}`,
      title: `Approve non-standard terms (round ${round})`,
      context: {
        runId: ctx.runId,
        round,
        nonStandardTerms: terms,
        files: [{ path: analysis.roundSummaryPath, label: `Round ${round} summary` }],
      },
    }, {
      breakpointId: roundBreakpointId,
      expert,
      tags: ['legal', 'negotiation', 'non-standard-terms'],
      strategy: 'single',
    });
    breakpointsHit.push(roundBreakpointId);

    const roundRecord = {
      round,
      nonStandardTerms: terms,
      approval: {
        approved: approval.approved === true,
        expert,
        breakpointId: roundBreakpointId,
        response: approval.response || approval.feedback || null,
      },
      settled: analysis.settled === true,
    };
    negotiationRounds.push(roundRecord);

    if (approval.approved === true) {
      // Fold the approved terms into the deviation register — the durable record
      // acceptance, signature, obligations, and kip facts all read from.
      for (const term of terms) {
        deviationRegister.push({
          clauseId: term.clauseId,
          termId: term.termId,
          category: term.category,
          severity: term.deviationSeverity,
          finalPosition: term.counterpartyPosition,
          approvedInRound: round,
        });
      }
      if (analysis.settled === true) {
        settled = true;
        break;
      }
      continue;
    }

    // Rejection: counsel MUST supply a directive — an undirected rejection is
    // unactionable and throws (no fallback).
    const directive = approval.response || approval.feedback;
    if (!directive) {
      throw new Error(`${roundBreakpointId} rejected without a directive — the counter-redline has nothing to apply (fallbacks forbidden).`);
    }
    const counter = await ctx.task(counterRedlineTask, {
      ...sharedArgs,
      round,
      directive,
      rejectedTerms: terms,
      redlinePath: currentRedlinePath,
      deviationRegister,
      priorKnowledge,
    });
    currentRedlinePath = counter.updatedRedlinePath;
    artifacts.push(counter.updatedRedlinePath);
  }
  timings.negotiation = ctx.now() - startTime;

  // Loop ended unsettled — never silently proceed: general-counsel decides whether
  // acceptance may be attempted with the open terms explicitly listed.
  if (!settled) {
    exhausted = true;
    const decision = await routedBreakpoint(ctx, {
      question: `Negotiation with ${counterparty} is unsettled after ${maxNegotiationRounds} round(s) (${openTerms.length} open term(s)). Approve to proceed to acceptance with the open terms explicitly listed, or reject to end the run with the full negotiation record.`,
      title: 'Negotiation rounds exhausted',
      context: {
        runId: ctx.runId,
        openTerms,
        rounds: negotiationRounds,
        deviationRegister,
      },
    }, {
      breakpointId: 'legal.negotiation-rounds-exhausted',
      expert: 'general-counsel',
      tags: ['legal', 'negotiation', 'escalation'],
      strategy: 'single',
    });
    breakpointsHit.push('legal.negotiation-rounds-exhausted');
    exhaustionDecision = {
      approved: decision.approved === true,
      breakpointId: 'legal.negotiation-rounds-exhausted',
      expert: 'general-counsel',
      response: decision.response || decision.feedback || null,
    };
    if (decision.approved !== true) {
      return buildResult(false, 'negotiation rounds exhausted and escalation rejected — full negotiation record retained');
    }
  }

  const finalRedlinePath = currentRedlinePath;

  // P7 — policy-gated terms acceptance. Terminal: rejection is recorded and ends the
  // run; renegotiation is a new run, never a hidden loop. Never auto-approved.
  ctx.log?.('info', 'P7: policy-gated terms acceptance');
  const criticalDeviationCount = deviationRegister.filter((d) => d.severity === 'critical-deviation').length;
  const acceptance = await routedBreakpoint(ctx, {
    question: `Accept final contract terms with ${counterparty}? ${deviationRegister.length} approved deviation(s) from the ${playbook} playbook (${criticalDeviationCount} critical-deviation), ${openTerms.length} open term(s).`,
    title: 'Accept contract terms',
    context: {
      runId: ctx.runId,
      deviationRegister,
      openTerms,
      negotiationSummary: {
        rounds: negotiationRounds.length,
        settled,
        exhausted,
      },
      files: [{ path: finalRedlinePath, label: 'Final redline' }],
    },
  }, {
    breakpointId: 'accept-contract-terms',
    expert: 'general-counsel',
    tags: ['policy-gated', 'legal'],
    strategy: 'single',
  });
  breakpointsHit.push('accept-contract-terms');
  approvals.acceptContractTerms = {
    approved: acceptance.approved === true,
    breakpointId: 'accept-contract-terms',
    expert: 'general-counsel',
    response: acceptance.response || acceptance.feedback || null,
  };
  timings.acceptTerms = ctx.now() - startTime;
  if (acceptance.approved !== true) {
    return buildResult(false, 'contract terms not accepted — decision recorded; acceptance is terminal, renegotiation is a new run');
  }

  // P8 — policy-gated signature execution. Only after this approval is the contract
  // treated as executed. Never auto-approved.
  ctx.log?.('info', 'P8: policy-gated signature execution');
  const signature = await routedBreakpoint(ctx, {
    question: `Execute/countersign the contract with ${counterparty} — this creates a binding obligation. Confirm signature authority.`,
    title: 'Execute contract signature',
    context: {
      runId: ctx.runId,
      deviationRegister,
      acceptance: approvals.acceptContractTerms,
      files: [{ path: finalRedlinePath, label: 'Final redline' }],
    },
  }, {
    breakpointId: 'execute-contract-signature',
    expert: 'authorized-signatory',
    tags: ['policy-gated', 'legal'],
    strategy: 'single',
  });
  breakpointsHit.push('execute-contract-signature');
  approvals.executeContractSignature = {
    approved: signature.approved === true,
    breakpointId: 'execute-contract-signature',
    expert: 'authorized-signatory',
    response: signature.response || signature.feedback || null,
  };
  timings.signature = ctx.now() - startTime;
  if (signature.approved !== true) {
    return buildResult(false, 'signature execution rejected — decision recorded; contract not executed');
  }

  // P9 — obligation extraction, then the handoff package (sequential: the handoff
  // composes the obligations).
  ctx.log?.('info', 'P9: obligation extraction + handoff package');
  const obligationResult = await ctx.task(obligationExtractionTask, {
    ...sharedArgs,
    finalRedlinePath,
    deviationRegister,
    clauses: clauseExtraction.clauses,
  });
  obligations = obligationResult.obligations;

  const handoff = await ctx.task(handoffPackageTask, {
    ...sharedArgs,
    finalRedlinePath,
    approvals,
    deviationRegister,
    negotiation: { rounds: negotiationRounds, settled, exhausted, exhaustionDecision },
    obligations,
    untraceableFindings: obligationResult.untraceableFindings || [],
    openTerms,
  });
  handoffPath = handoff.handoffPath;
  artifacts.push(handoffPath);
  timings.obligationsHandoff = ctx.now() - startTime;

  // P10 — kip assert. Facts are built deterministically IN PROCESS CODE from the
  // deviation register and run state — agents never invent them. Guarded by the
  // same kipEnabled flag as the P1 recall.
  if (kipEnabled) {
    ctx.log?.('info', 'P10: kip assert of deviations, positions, and outcome');
    const facts = [];
    for (const deviation of deviationRegister) {
      facts.push({
        subject: `counterparty:${counterparty}`,
        predicate: 'agreed-deviation',
        object: `clause:${deviation.clauseId}`,
        props: {
          severity: deviation.severity,
          finalPosition: deviation.finalPosition,
          round: deviation.approvedInRound,
          contractType,
          runId: ctx.runId,
        },
      });
      facts.push({
        subject: `counterparty:${counterparty}`,
        predicate: 'final-position',
        object: `term:${deviation.termId}`,
        props: {
          position: deviation.finalPosition,
          playbook,
          contractType,
          runId: ctx.runId,
        },
      });
    }
    const gateEscalations = breakpointsHit.filter((id) => id === `${REDLINE_GATE_ID}.gate-escalation`).length;
    facts.push({
      subject: `contract:${counterparty}:${contractType}:${ctx.runId}`,
      predicate: 'negotiation-outcome',
      object: settled ? 'outcome:settled' : 'outcome:exhausted',
      props: {
        rounds: negotiationRounds.length,
        gateAttempts: redlineGate.attempts,
        escalations: gateEscalations + (exhausted ? 1 : 0),
        signed: approvals.executeContractSignature.approved,
        runId: ctx.runId,
      },
    });
    const assertion = await kipAssert(ctx, { kipDir, kipModel, kind: 'legal-contracts', facts });
    kipFactsAsserted = assertion.asserted;
  }
  timings.kipAssert = ctx.now() - startTime;

  return buildResult(true);
}
