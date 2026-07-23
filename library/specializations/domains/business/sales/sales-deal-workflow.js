/**
 * @process sales/sales-deal-workflow
 * @description End-to-end sales deal lifecycle: lead intake and validation, kip recall of
 *   account history and objection-handling learnings, evidence-backed qualification,
 *   parallel account research + outreach-sequence prep, policy-gated batch outbound email
 *   send, pursuit discovery and proposal drafting with a machine-readable margin model,
 *   adversarial deal-review gate (executed margin recalculation + CRM record diff),
 *   bounded negotiation rounds with a frozen discount-authority matrix routing approvals
 *   by discount depth (sales-manager vs sales-vp, throwing lookup beyond delegated
 *   authority), policy-gated deal-commit, close execution with CRM hygiene verification,
 *   and kip assert of deal outcomes and win/loss learnings. Supersedes
 *   pipeline-review-forecast.js.
 * @inputs {
 *   lead: object,                  // required — { company: string (required), contact: { name, email } (required), source?, leadId? }; missing company/contact throws (no fallbacks)
 *   offering: string,              // required — product/offering being sold; throws if absent
 *   crmRecordPath: string,         // required — path to the CRM opportunity record artifact the gate diffs against and hygiene updates; throws if absent
 *   listPrice: number,             // required — anchor for the margin model; throws if absent
 *   cogs: number,                  // required — cost basis for margin recomputation; throws if absent
 *   standardDiscountPct?: number,  // default 5 — discounts at or below need no discount-approval breakpoint
 *   maxNegotiationRounds?: number, // default 3
 *   maxFixAttempts?: number,       // default 2 (deal-review gate fixer budget)
 *   kipEnabled?: boolean,          // default true
 *   kipDir?: string,               // default '.a5c/kip'
 *   kipModel?: string              // default 'sonnet'
 * }
 * @outputs {
 *   success: boolean,
 *   recall: object,                // { factCount, insights }
 *   qualification: object,         // { qualified, criteria [{ id, criterion, status, evidence[] }], disqualifyReasons }
 *   outreach: object,              // { sequencePath, emailCount, approval { approved, breakpointId, expert, response }, sent }
 *   proposal: object,              // { proposalPath, marginModelPath, pricing { listPrice, proposedDiscountPct, netPrice, cogs, marginPct }, gate { passed, attempts, escalated, issues, evidence } }
 *   negotiation: object,           // { rounds [{ round, requestedDiscountPct, concessions, approval?, settled }], settled, exhausted, exhaustionDecision?, approvedDiscountPct }
 *   commit: object,                // { approved, breakpointId, expert, response, finalTerms }
 *   crmHygiene: object,            // { updatePlanPath, verifiedDiff, findings }
 *   policyDecisions: array,        // fail-closed audit: [{ actionId, breakpointId, expert, approved, response, autoApproved: false, at }]
 *   kipFactsAsserted: number,
 *   artifacts: array,
 *   metadata: object               // { processId, runId, dealName, breakpointsHit, timings }
 * }
 * @graph
 *   domains: [domain:sales, domain:business]
 *   skillAreas: [skill-area:sales-methodology, skill-area:revenue-operations]
 *   workflows: [workflow:customer-journey-optimization]
 *   roles: [role:account-executive, role:sales-manager, role:sales-engineer]
 * @supersedes library/specializations/domains/business/sales/pipeline-review-forecast.js — retire
 *   after one green run. Portfolio-level pipeline health (the old pipeline-health-analysis and
 *   forecast-calculation tasks) is deliberately out of scope for a single-deal lifecycle and
 *   remains served by revenue-forecasting-planning.js and qbr-process.js.
 * @policyGatedActions outbound-email-send (sales-manager), discount-approval (matrix-routed:
 *   sales-manager <=10%, sales-vp <=25%, deeper throws), deal-commit (sales-vp) — each via
 *   routedBreakpoint with breakpointId = actionId, tags ['policy-gated','sales'], never
 *   auto-approved
 * @example
 * const result = await orchestrate('sales/sales-deal-workflow', {
 *   lead: { company: 'Acme Corp', contact: { name: 'Dana Reyes', email: 'dana@acme.example' } },
 *   offering: 'Platform Enterprise',
 *   crmRecordPath: 'crm/acme-opp-1042.json',
 *   listPrice: 120000,
 *   cogs: 42000,
 *   standardDiscountPct: 5,
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
// Discount authority matrix + deterministic helpers (process code, no model)
// ---------------------------------------------------------------------------

// Frozen delegated-authority tiers. Routing beyond the deepest tier has NO
// route — routeDiscountApproval throws instead of defaulting an expert
// (fallbacks forbidden).
export const DISCOUNT_AUTHORITY_MATRIX = Object.freeze([
  Object.freeze({ maxDiscountPct: 10, expert: 'sales-manager' }),
  Object.freeze({ maxDiscountPct: 25, expert: 'sales-vp' }),
]);

/**
 * Pure throwing lookup: returns the first matrix tier whose maxDiscountPct
 * covers the ask. Never returns a default expert — an ask beyond the deepest
 * tier throws.
 */
export function routeDiscountApproval(discountPct) {
  if (!Number.isFinite(discountPct) || discountPct <= 0) {
    throw new Error(
      `routeDiscountApproval: discountPct must be a finite number greater than 0 (got ${JSON.stringify(discountPct)})`
    );
  }
  for (const tier of DISCOUNT_AUTHORITY_MATRIX) {
    if (discountPct <= tier.maxDiscountPct) {
      return tier;
    }
  }
  throw new Error(
    `discount of ${discountPct}% exceeds maximum delegated authority (25%) — no approval route exists (fallbacks forbidden)`
  );
}

/**
 * Deterministic margin recomputation in process code — the numbers shown to
 * approvers are computed here, never trusted from an agent (mirrors the clw
 * computeCoverage precedent).
 */
export function recomputeMargin({ listPrice, discountPct, cogs }) {
  if (!Number.isFinite(listPrice) || !Number.isFinite(discountPct) || !Number.isFinite(cogs)) {
    throw new Error(
      `recomputeMargin: listPrice, discountPct, and cogs must all be finite numbers (got ${JSON.stringify({ listPrice, discountPct, cogs })})`
    );
  }
  const netPrice = listPrice * (1 - discountPct / 100);
  if (netPrice === 0) {
    throw new Error('recomputeMargin: netPrice is zero — marginPct is undefined at a 100% discount');
  }
  const marginPct = ((netPrice - cogs) / netPrice) * 100;
  return { listPrice, discountPct, netPrice, cogs, marginPct };
}

/**
 * Fail-closed audit push for one policy-gated decision (ticket-lifecycle
 * precedent). These breakpoints are never auto-approved, so autoApproved is
 * recorded as the literal false provenance.
 */
function recordPolicyDecision(decisions, { actionId, breakpointId, expert, approved, response, at }) {
  decisions.push({
    actionId,
    breakpointId,
    expert,
    approved: approved === true,
    response: response ?? null,
    autoApproved: false,
    at,
  });
}

// ---------------------------------------------------------------------------
// P0 — lead intake
// ---------------------------------------------------------------------------

export const leadIntakeTask = defineTask('sdw.lead-intake', (args, taskCtx) => ({
  kind: 'agent',
  title: `Lead intake: ${args.lead.company}`,
  agent: {
    name: 'sales-intake-analyst',
    prompt: {
      role: 'Sales intake analyst',
      task: `Capture lead, account, and opportunity context for ${args.lead.company}`,
      context: args,
      instructions: [
        'From the lead object and the CRM record at crmRecordPath, capture: accountProfile (company, industry, size, segment), stakeholders (name, role, relationship to the deal), a stable dealName, and riskFlags.',
        'riskFlags cover missing or ambiguous data (unknown budget authority, stale CRM fields, unverified contact) — flagged explicitly, never inferred or invented.',
        'Do not qualify the lead here — qualification is a separate evidence-backed phase.',
      ],
      outputFormat: 'JSON with accountProfile object, dealName string, stakeholders array [{ name, role }], riskFlags array',
    },
    outputSchema: {
      type: 'object',
      required: ['accountProfile', 'dealName', 'stakeholders', 'riskFlags'],
      properties: {
        accountProfile: { type: 'object' },
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
  labels: ['agent', 'sdw', 'sales', 'intake'],
}));

// ---------------------------------------------------------------------------
// P2 — qualification
// ---------------------------------------------------------------------------

export const qualificationTask = defineTask('sdw.qualification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Qualification: ${args.lead.company}`,
  agent: {
    name: 'sales-qualifier',
    prompt: {
      role: 'Sales qualification analyst',
      task: `Qualify the ${args.offering} opportunity at ${args.lead.company} with evidence-backed criteria`,
      context: args,
      instructions: [
        'Assess MEDDPICC-shaped criteria: Metrics, Economic buyer, Decision criteria, Decision process, Paper process, Identified pain, Champion, Competition. These are the dimensions of sales/meddpicc-qualification.js — for a full standalone qualification run, use that process; this task performs the qualification slice inline.',
        'Each criterion is { id, criterion, status: met|unmet|unknown, evidence } — a criterion without at least one concrete evidence entry (CRM field, conversation note, recalled fact, research citation) CANNOT be marked met.',
        'Honor recalled account history: prior objections and win/loss learnings adjust criterion status, with the prior fact cited in evidence.',
        'qualified: false requires disqualifyReasons naming which criteria failed and why — an honest terminal verdict, never softened to keep the run alive.',
      ],
      outputFormat: 'JSON with qualified boolean, criteria array [{ id, criterion, status, evidence }], disqualifyReasons array',
    },
    outputSchema: {
      type: 'object',
      required: ['qualified', 'criteria', 'disqualifyReasons'],
      properties: {
        qualified: { type: 'boolean' },
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'criterion', 'status', 'evidence'],
            properties: {
              status: { type: 'string', enum: ['met', 'unmet', 'unknown'] },
              evidence: { type: 'array', minItems: 1, items: { type: 'string' } },
            },
          },
        },
        disqualifyReasons: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'sdw', 'sales', 'qualification'],
}));

// ---------------------------------------------------------------------------
// P3 — parallel: account research + outreach prep
// ---------------------------------------------------------------------------

export const accountResearchTask = defineTask('sdw.account-research', (args, taskCtx) => ({
  kind: 'agent',
  title: `Account research: ${args.lead.company}`,
  agent: {
    name: 'account-researcher',
    prompt: {
      role: 'Account researcher',
      task: `Research ${args.lead.company} independently for the ${args.offering} pursuit`,
      context: args,
      instructions: [
        'Research org structure, active initiatives, competitive presence, and buying signals; write the brief to artifactsDir and report researchBriefPath.',
        'Every finding carries a sourceRef (URL, CRM field, document path, or recalled-fact citation) — an unsourced finding is inadmissible.',
        'Honor recalled facts about this account with citations; do NOT read or depend on outreach prep output (it runs in parallel).',
      ],
      outputFormat: 'JSON with findings array [{ finding, sourceRef }], researchBriefPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'researchBriefPath'],
      properties: {
        findings: {
          type: 'array',
          items: { type: 'object', required: ['finding', 'sourceRef'] },
        },
        researchBriefPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'sdw', 'sales', 'research'],
}));

export const outreachPrepTask = defineTask('sdw.outreach-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Revise outreach sequence for ${args.lead.company} (breakpoint feedback)`
    : `Outreach sequence prep: ${args.lead.company}`,
  agent: {
    name: 'outreach-writer',
    prompt: {
      role: 'Sales outreach writer',
      task: `Draft the outbound email sequence for ${args.lead.company}`,
      context: args,
      instructions: [
        'Draft the outreach sequence artifact to artifactsDir (sequencePath) with emails [{ emailId, recipient, sendStage, subject, body }].',
        'Ground messaging in the qualification verdict and recalled account history — prior objections and objection-handling learnings shape the messaging.',
        'Do NOT read or depend on account research output (it runs in parallel); use lead + qualification + recall only.',
        args.feedback
          ? `Revision round after sales-manager rejection: address ONLY the feedback directive, keep everything else unchanged, and report what changed. Feedback: ${JSON.stringify(args.feedback)}`
          : 'First drafting round: no revision feedback to address.',
      ],
      outputFormat: 'JSON with sequencePath string, emails array [{ emailId, recipient, sendStage, subject, body }]',
    },
    outputSchema: {
      type: 'object',
      required: ['sequencePath', 'emails'],
      properties: {
        sequencePath: { type: 'string' },
        emails: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['emailId', 'recipient', 'sendStage', 'subject', 'body'],
          },
        },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'sdw', 'sales', 'outreach'],
}));

// ---------------------------------------------------------------------------
// P4 — outreach executor (guarded: runs ONLY after outbound-email-send
// approved === true — ticket-lifecycle precedent)
// ---------------------------------------------------------------------------

export const outreachExecutionTask = defineTask('sdw.outreach-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved outreach sequence: ${args.lead.company}`,
  agent: {
    name: 'outreach-executor',
    prompt: {
      role: 'Sales outreach executor',
      task: `Send the approved outreach sequence at ${args.sequencePath}`,
      context: args,
      instructions: [
        'EXECUTOR: this task runs only after the outbound-email-send policy gate approved the sequence. Send/record the sequence EXACTLY as approved — no edits, additions, or re-ordering post-approval.',
        'Report per-email sent status and write the send log to artifactsDir (sendLogPath).',
        'Any email that cannot be sent is reported as a failed entry with the reason — never silently dropped.',
      ],
      outputFormat: 'JSON with sent array [{ emailId, status }], sendLogPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['sent', 'sendLogPath'],
      properties: {
        sent: { type: 'array' },
        sendLogPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'sdw', 'sales', 'policy-gated', 'outreach'],
}));

// ---------------------------------------------------------------------------
// P5 — pursuit discovery + proposal draft
// ---------------------------------------------------------------------------

export const pursuitDiscoveryTask = defineTask('sdw.pursuit-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pursuit discovery: ${args.lead.company}`,
  agent: {
    name: 'sales-pursuit-analyst',
    prompt: {
      role: 'Sales pursuit analyst',
      task: `Run pursuit discovery for the ${args.offering} opportunity at ${args.lead.company}`,
      context: args,
      instructions: [
        'Log stakeholder conversations, competitive intel, and customer success criteria; write the pursuit summary to artifactsDir (pursuitSummaryPath).',
        'Produce objectionLog: [{ id, objection, resolution, status, evidenceRef }] — every objection raised so far with how (or whether) it was handled; evidenceRef points at the conversation note or artifact backing it.',
        'The objectionLog feeds both the proposal draft and the kip win/loss memory — unresolved objections are reported honestly with status open, never omitted.',
      ],
      outputFormat: 'JSON with objectionLog array [{ id, objection, resolution, status, evidenceRef }], pursuitSummaryPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['objectionLog', 'pursuitSummaryPath'],
      properties: {
        objectionLog: {
          type: 'array',
          items: { type: 'object', required: ['id', 'objection', 'status'] },
        },
        pursuitSummaryPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'sdw', 'sales', 'pursuit'],
}));

export const proposalDraftTask = defineTask('sdw.proposal-draft', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Revise proposal for ${args.lead.company} (gate feedback)`
    : `Proposal draft: ${args.lead.company}`,
  agent: {
    name: 'proposal-drafter',
    prompt: {
      role: 'Sales proposal drafter',
      task: `Draft the ${args.offering} proposal for ${args.lead.company} with a machine-readable margin model`,
      context: args,
      instructions: [
        'Write the proposal to artifactsDir (proposalPath) and a machine-readable margin model JSON (marginModelPath) with exactly { listPrice, proposedDiscountPct, netPrice, cogs, marginPct }; also report the same numbers as the pricing object.',
        'IRON-LAW CONTRACT: the marginModelPath numbers MUST be arithmetically consistent — netPrice = listPrice * (1 - proposedDiscountPct/100) and marginPct = (netPrice - cogs) / netPrice * 100. The deal-review gate recomputes them and fails any mismatch.',
        'proposedDiscountPct must respect standardDiscountPct unless a written justification for negotiation headroom is included in the output (justification field).',
        'Ground every proposal term in a met qualification criterion or a resolved objectionLog entry — the CRM-consistency critic attacks unsupported terms.',
        args.feedback
          ? `Revision round (gate fixer): address ONLY the listed issues, keep everything else unchanged, and report what changed. Feedback: ${JSON.stringify(args.feedback)}`
          : 'First drafting round: no gate feedback to address.',
      ],
      outputFormat: 'JSON with proposalPath string, marginModelPath string, pricing object { listPrice, proposedDiscountPct, netPrice, cogs, marginPct }, justification string',
    },
    outputSchema: {
      type: 'object',
      required: ['proposalPath', 'marginModelPath', 'pricing'],
      properties: {
        proposalPath: { type: 'string' },
        marginModelPath: { type: 'string' },
        pricing: {
          type: 'object',
          required: ['listPrice', 'proposedDiscountPct', 'netPrice', 'cogs', 'marginPct'],
        },
        justification: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'sdw', 'sales', 'proposal'],
}));

// ---------------------------------------------------------------------------
// P7 — negotiation loop tasks
// ---------------------------------------------------------------------------

export const negotiationRoundAnalysisTask = defineTask('sdw.negotiation-round-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Negotiation round ${args.round} analysis: ${args.lead.company}`,
  agent: {
    name: 'negotiation-analyst',
    prompt: {
      role: 'Sales negotiation analyst',
      task: `Analyze negotiation round ${args.round} with ${args.lead.company}`,
      context: args,
      instructions: [
        'Ingest the customer counter for this round; if no customer response artifact exists yet, report settled:false with pendingExternal:true, requestedDiscountPct 0, and empty concessions — an honest state, not a fallback.',
        'Report requestedDiscountPct (number — the discount depth the customer is asking for), concessions [{ termId, description, ourPosition, customerPosition }], slip/loss risk and concession exposure, openTerms, settled, and write the round summary to artifactsDir (roundSummaryPath).',
        'Anti-downgrade rule (verbatim): NEVER understate requestedDiscountPct to dodge approval routing — the discount-authority matrix routes on the number you report, and understating it is a protocol failure.',
        'settled:true only when no open terms remain and the customer has accepted the current proposal.',
      ],
      outputFormat: 'JSON with requestedDiscountPct number, concessions array [{ termId, description, ourPosition, customerPosition }], settled boolean, pendingExternal boolean, openTerms array, roundSummaryPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['requestedDiscountPct', 'concessions', 'settled', 'openTerms', 'roundSummaryPath'],
      properties: {
        requestedDiscountPct: { type: 'number' },
        concessions: {
          type: 'array',
          items: { type: 'object', required: ['termId', 'description', 'ourPosition', 'customerPosition'] },
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
  labels: ['agent', 'sdw', 'sales', 'negotiation'],
}));

export const counterProposalTask = defineTask('sdw.counter-proposal', (args, taskCtx) => ({
  kind: 'agent',
  title: `Counter-proposal (round ${args.round}): ${args.lead.company}`,
  agent: {
    name: 'proposal-drafter',
    prompt: {
      role: 'Sales counter-proposal drafter',
      task: `Produce the round-${args.round} counter-proposal under the approver directive`,
      context: args,
      instructions: [
        'Apply ONLY the approver directive (args.directive) plus the rejected discount ask to produce updatedProposalPath and an updated margin model (updatedMarginModelPath) with arithmetically consistent numbers.',
        'Preserve every already-approved position unchanged; list changes per term.',
        'No scope creep.',
      ],
      outputFormat: 'JSON with updatedProposalPath string, updatedMarginModelPath string, changes array (one entry per term changed)',
    },
    outputSchema: {
      type: 'object',
      required: ['updatedProposalPath', 'updatedMarginModelPath', 'changes'],
      properties: {
        updatedProposalPath: { type: 'string' },
        updatedMarginModelPath: { type: 'string' },
        changes: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'sdw', 'sales', 'negotiation', 'fixer'],
}));

// ---------------------------------------------------------------------------
// P9 — close executor (guarded: runs ONLY after deal-commit approved === true)
// + CRM hygiene
// ---------------------------------------------------------------------------

export const closeExecutionTask = defineTask('sdw.close-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Close execution: ${args.lead.company}`,
  agent: {
    name: 'deal-closer',
    prompt: {
      role: 'Deal closer',
      task: `Execute the committed close for ${args.lead.company}`,
      context: args,
      instructions: [
        'EXECUTOR: this task runs only after the deal-commit policy gate approved the final terms. Record finalTerms EXACTLY as committed — no post-approval edits.',
        'Write the close handoff package to artifactsDir (closePackagePath): a markdown composing the committed terms, all policyDecisions records, the concessionRegister, the deal-review gate record, and nextSteps.',
        'Report learnings [{ learning, evidenceRef }] — win/loss learnings for kip memory. evidenceRef is REQUIRED per entry; an untraceable learning is a finding to report, never a fact to assert.',
      ],
      outputFormat: 'JSON with finalTerms object, closePackagePath string, learnings array [{ learning, evidenceRef }]',
    },
    outputSchema: {
      type: 'object',
      required: ['finalTerms', 'closePackagePath', 'learnings'],
      properties: {
        finalTerms: { type: 'object' },
        closePackagePath: { type: 'string' },
        learnings: {
          type: 'array',
          items: { type: 'object', required: ['learning'] },
        },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'sdw', 'sales', 'policy-gated', 'close'],
}));

export const crmHygieneTask = defineTask('sdw.crm-hygiene', (args, taskCtx) => ({
  kind: 'agent',
  title: `CRM hygiene: ${args.lead.company}`,
  agent: {
    name: 'crm-steward',
    prompt: {
      role: 'CRM steward',
      task: `Bring the CRM record at ${args.crmRecordPath} up to date with the closed deal`,
      context: args,
      instructions: [
        'Build the CRM update plan (updatePlanPath in artifactsDir), apply the updates, then paste an EXECUTED field-by-field diff of the updated record vs the pre-state at crmRecordPath into verifiedDiff — a claim of hygiene without the pasted diff is invalid.',
        'Report data-quality findings explicitly (stale dates, missing fields, stage/value inconsistencies) — untraceable or stale fields are findings to report, never silently patched.',
        'This absorbs the old pipeline-data-validation duty at the single-deal level.',
      ],
      outputFormat: 'JSON with updatePlanPath string, verifiedDiff string (the pasted executed diff), findings array',
    },
    outputSchema: {
      type: 'object',
      required: ['updatePlanPath', 'verifiedDiff', 'findings'],
      properties: {
        updatePlanPath: { type: 'string' },
        verifiedDiff: { type: 'string' },
        findings: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'sdw', 'sales', 'crm', 'hygiene'],
}));

// ---------------------------------------------------------------------------
// Deal-review gate — critic specs + gate-specific IRON LAW
// ---------------------------------------------------------------------------

const SDW_GATE_ID = 'sdw.deal-review';

const SDW_IRON_LAW = [
  'Evidence entries MUST be executed: a pasted arithmetic recomputation or a pasted field-by-field diff output. Read-only impressions (\'margins look right\') are protocol failures.',
  'The margin check is EXECUTED: recompute netPrice and marginPct from listPrice/discount/cogs YOURSELF and paste the arithmetic next to the model\'s claimed values.',
  'The CRM check is EXECUTED: load crmRecordPath, diff every proposal term (price, discount, offering, close-date, stakeholders) against the record field-by-field, and paste the diff.',
];

const SDW_CRITICS = [
  {
    name: 'margin-integrity-critic',
    role: 'Adversarial margin gatekeeper',
    focus: 'the margin model is arithmetically true and economically defensible',
    instructions: [
      'EXECUTED CHECK (required): recompute netPrice = listPrice*(1-discountPct/100) and marginPct = (netPrice-cogs)/netPrice*100 from marginModelPath inputs yourself; paste your arithmetic beside the claimed values; any mismatch fails with both numbers quoted.',
      'Attack discount headroom: proposedDiscountPct above standardDiscountPct without a written justification fails.',
      'Attack margin floor: marginPct below zero or implausibly thin relative to cogs is an automatic issue with the computed number cited.',
    ],
  },
  {
    name: 'crm-consistency-critic',
    role: 'Adversarial CRM-consistency gatekeeper',
    focus: 'the proposal and the CRM record describe the same deal',
    instructions: [
      'EXECUTED CHECK (required): read the record at crmRecordPath and produce a field-by-field diff against the proposal terms; paste the diff as evidence — a verdict without the pasted diff is invalid.',
      'Any divergence (value, offering, stage, close date, stakeholder set) is an issue naming the field and both values.',
      'Attack qualification grounding: a proposal term unsupported by any \'met\' qualification criterion or objectionLog resolution fails with the missing linkage named.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    lead,
    offering,
    crmRecordPath,
    listPrice,
    cogs,
    standardDiscountPct = 5,
    maxNegotiationRounds = 3,
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs || {};

  // P0 pre-flight — no fallbacks: the anchor inputs are required, a run without
  // them is unactionable (clw required-anchor precedent).
  if (!lead || !lead.company) {
    throw new Error('sales-deal-workflow requires lead.company — there is no default account (fallbacks forbidden).');
  }
  if (!lead.contact) {
    throw new Error('sales-deal-workflow requires lead.contact — there is no default contact (fallbacks forbidden).');
  }
  if (!offering) {
    throw new Error('sales-deal-workflow requires offering — there is no default offering (fallbacks forbidden).');
  }
  if (!crmRecordPath) {
    throw new Error('sales-deal-workflow requires crmRecordPath — the gate diffs and hygiene updates need the CRM record (fallbacks forbidden).');
  }
  if (!Number.isFinite(listPrice)) {
    throw new Error('sales-deal-workflow requires a numeric listPrice — the margin model has no default anchor (fallbacks forbidden).');
  }
  if (!Number.isFinite(cogs)) {
    throw new Error('sales-deal-workflow requires a numeric cogs — margin recomputation has no default cost basis (fallbacks forbidden).');
  }

  const startTime = ctx.now();
  const timings = {};
  const breakpointsHit = [];
  const artifacts = [];
  const artifactsDir = ctx.artifactsDir;
  const sharedArgs = {
    lead,
    offering,
    crmRecordPath,
    listPrice,
    cogs,
    standardDiscountPct,
    kipDir,
    kipModel,
    artifactsDir,
  };

  // Mutable run state — buildResult reads these so every rejection path returns
  // the full output shape with the decision recorded (never a silent partial exit).
  let intake = null;
  let recall = null;
  let qualification = null;
  let outreachPrep = null;
  let outreachApproval = null;
  let outreachSent = null;
  let pursuit = null;
  let proposal = null;
  let dealGate = null;
  const negotiationRounds = [];
  const concessionRegister = [];
  let settled = false;
  let exhausted = false;
  let exhaustionDecision = null;
  let approvedDiscountPct = 0;
  let openTerms = [];
  let commit = null;
  let crmHygiene = null;
  const policyDecisions = [];
  let kipFactsAsserted = 0;

  const buildResult = (success, reason) => ({
    success,
    recall: recall
      ? { factCount: recall.factCount, insights: recall.insights }
      : null,
    qualification: qualification
      ? {
          qualified: qualification.qualified,
          criteria: qualification.criteria,
          disqualifyReasons: qualification.disqualifyReasons,
        }
      : null,
    outreach: outreachPrep
      ? {
          sequencePath: outreachPrep.sequencePath,
          emailCount: (outreachPrep.emails || []).length,
          approval: outreachApproval,
          sent: outreachSent,
        }
      : null,
    proposal: proposal
      ? {
          proposalPath: proposal.proposalPath,
          marginModelPath: proposal.marginModelPath,
          pricing: proposal.pricing,
          gate: dealGate
            ? {
                passed: dealGate.passed,
                attempts: dealGate.attempts,
                escalated: dealGate.escalated,
                issues: dealGate.issues,
                evidence: dealGate.evidence,
              }
            : null,
        }
      : null,
    negotiation: {
      rounds: negotiationRounds,
      settled,
      exhausted,
      ...(exhaustionDecision && { exhaustionDecision }),
      approvedDiscountPct,
    },
    commit,
    crmHygiene,
    policyDecisions,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'sales/sales-deal-workflow',
      runId: ctx.runId,
      dealName: intake ? intake.dealName : null,
      breakpointsHit,
      timings: { ...timings, total: ctx.now() - startTime },
      ...(reason && { reason }),
    },
  });

  // P0 — lead intake: capture-only, no breakpoint (sparse breakpoints);
  // riskFlags ride into later payloads instead.
  ctx.log?.('info', `P0: lead intake for ${lead.company}`);
  intake = await ctx.task(leadIntakeTask, sharedArgs);
  timings.intake = ctx.now() - startTime;

  // P1 — kip recall of account history + objection-handling learnings. Guarded
  // symmetrically with the P10 assert; the disabled shape is the documented
  // empty-recall state, not a fallback.
  ctx.log?.('info', 'P1: kip recall of account history and win/loss learnings');
  if (kipEnabled) {
    recall = await kipRecall(ctx, {
      kipDir,
      kipModel,
      kind: 'sales',
      topic: `account ${lead.company} history, prior objections and objection-handling, win/loss learnings for ${offering}`,
    });
  } else {
    recall = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  }
  const priorKnowledge = recall;
  timings.recall = ctx.now() - startTime;

  // P2 — evidence-backed qualification. Disqualification is an honest terminal
  // state, not a fallback path.
  ctx.log?.('info', 'P2: qualification');
  qualification = await ctx.task(qualificationTask, { ...sharedArgs, intake, priorKnowledge });
  timings.qualification = ctx.now() - startTime;
  if (qualification.qualified !== true) {
    return buildResult(false, 'lead disqualified — reasons recorded');
  }

  // P3 — parallel account research + outreach prep. Both read lead + recall
  // independently; outreach prep does NOT depend on research output.
  ctx.log?.('info', 'P3: parallel account research + outreach prep');
  let accountResearch = null;
  [accountResearch, outreachPrep] = await ctx.parallel.all([
    () => ctx.task(accountResearchTask, { ...sharedArgs, intake, qualification, priorKnowledge }),
    () => ctx.task(outreachPrepTask, { ...sharedArgs, intake, qualification, priorKnowledge }),
  ]);
  artifacts.push(accountResearch.researchBriefPath);
  artifacts.push(outreachPrep.sequencePath);
  timings.parallelResearchOutreach = ctx.now() - startTime;

  // P4 — policy-gated outbound email send: ONE batch-level approval over the
  // whole sequence (fch send-candidate-outreach precedent, not per-email).
  // Bounded 2-attempt loop (clw P5 precedent): a rejection with a directive
  // earns exactly one revision pass, then the SAME breakpointId is re-presented;
  // an undirected rejection throws; a second rejection ends the run. Never
  // auto-approved: no autoApproveAfterN, no presentAlwaysApprove.
  ctx.log?.('info', 'P4: policy-gated outbound email send (batch-level)');
  let outreachFeedback = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      outreachPrep = await ctx.task(outreachPrepTask, {
        ...sharedArgs,
        intake,
        qualification,
        priorKnowledge,
        feedback: outreachFeedback,
        revision: attempt,
      });
      artifacts.push(outreachPrep.sequencePath);
    }
    const emailSummary = (outreachPrep.emails || []).map((e) => ({
      emailId: e.emailId,
      recipient: e.recipient,
      sendStage: e.sendStage,
      subject: e.subject,
    }));
    const approval = await routedBreakpoint(ctx, {
      question: `Send this ${emailSummary.length}-email outbound sequence to ${lead.company}? One approval covers the whole batch.`,
      title: 'Approve outbound email send (batch)',
      context: {
        runId: ctx.runId,
        files: [{ path: outreachPrep.sequencePath, label: 'Outreach sequence' }],
        summary: {
          emails: emailSummary,
          qualification: {
            qualified: qualification.qualified,
            disqualifyReasons: qualification.disqualifyReasons,
          },
          recallInsights: recall.insights,
          riskFlags: intake.riskFlags,
        },
      },
      previousFeedback: outreachFeedback || undefined,
    }, {
      breakpointId: 'outbound-email-send',
      expert: 'sales-manager',
      tags: ['policy-gated', 'sales'],
      strategy: 'single',
    });
    breakpointsHit.push('outbound-email-send');
    recordPolicyDecision(policyDecisions, {
      actionId: 'outbound-email-send',
      breakpointId: 'outbound-email-send',
      expert: 'sales-manager',
      approved: approval.approved,
      response: approval.response ?? approval.feedback,
      at: ctx.now(),
    });
    outreachApproval = {
      approved: approval.approved === true,
      breakpointId: 'outbound-email-send',
      expert: 'sales-manager',
      response: approval.response ?? approval.feedback ?? null,
    };
    if (approval.approved === true) break;
    if (attempt === 0) {
      outreachFeedback = approval.response || approval.feedback;
      if (!outreachFeedback) {
        // No fallback: a rejection without a directive is unactionable — the
        // one revision pass has nothing to revise against.
        throw new Error('outbound-email-send rejected without a directive — cannot revise (fallbacks forbidden).');
      }
    }
  }
  timings.outreachGate = ctx.now() - startTime;
  if (!outreachApproval.approved) {
    // Second rejection: recorded fail-closed, run ends — the executor never runs.
    return buildResult(false, 'outbound email send rejected twice — decision recorded');
  }

  // EXECUTOR GUARD: sdw.outreach-execution runs ONLY inside this
  // approved === true guard (ticket-lifecycle precedent).
  if (outreachApproval.approved === true) {
    const execution = await ctx.task(outreachExecutionTask, {
      ...sharedArgs,
      sequencePath: outreachPrep.sequencePath,
      emails: outreachPrep.emails,
      approval: outreachApproval,
    });
    outreachSent = execution.sent;
    artifacts.push(execution.sendLogPath);
  }
  timings.outreachExecution = ctx.now() - startTime;

  // P5 — pursuit discovery then proposal draft (sequential: the proposal
  // consumes the objectionLog).
  ctx.log?.('info', 'P5: pursuit discovery + proposal draft');
  pursuit = await ctx.task(pursuitDiscoveryTask, {
    ...sharedArgs,
    intake,
    qualification,
    accountResearch,
    priorKnowledge,
  });
  artifacts.push(pursuit.pursuitSummaryPath);

  proposal = await ctx.task(proposalDraftTask, {
    ...sharedArgs,
    intake,
    qualification,
    objectionLog: pursuit.objectionLog,
    priorKnowledge,
  });
  artifacts.push(proposal.proposalPath);
  artifacts.push(proposal.marginModelPath);
  timings.pursuitProposal = ctx.now() - startTime;

  // P6 — adversarial deal-review gate: executed margin recomputation + executed
  // CRM record diff, stress-tested BEFORE any concession is discussed.
  // Escalation flows through the combinator's routed
  // 'sdw.deal-review.gate-escalation' breakpoint (expert: owner).
  ctx.log?.('info', 'P6: adversarial deal-review gate');
  dealGate = await adversarialGate(ctx, {
    gateId: SDW_GATE_ID,
    artifact: {
      path: proposal.proposalPath,
      description: 'Deal proposal with margin model',
    },
    critics: SDW_CRITICS,
    ironLaw: SDW_IRON_LAW,
    maxFixAttempts,
    fixer: {},
    context: {
      pricing: proposal.pricing,
      marginModelPath: proposal.marginModelPath,
      crmRecordPath,
      standardDiscountPct,
      qualification,
      objectionLog: pursuit.objectionLog,
      recall: { factCount: recall.factCount, insights: recall.insights, facts: recall.facts },
    },
  });
  if (dealGate.escalated) {
    breakpointsHit.push(`${SDW_GATE_ID}.gate-escalation`);
  }
  timings.dealReviewGate = ctx.now() - startTime;
  if (!dealGate.passed) {
    return buildResult(false, 'deal-review gate failed after escalation — negotiation and commit never reached');
  }

  // P7 — bounded negotiation loop, strictly sequential. Discount asks beyond
  // the standing ceiling route through the frozen authority matrix; asks beyond
  // the deepest tier THROW inside routeDiscountApproval (no route, fallbacks
  // forbidden).
  ctx.log?.('info', `P7: negotiation loop (max ${maxNegotiationRounds} rounds)`);
  let currentProposalPath = proposal.proposalPath;
  let currentMarginModelPath = proposal.marginModelPath;
  let discountApprovalRaised = false;
  for (let round = 1; round <= maxNegotiationRounds; round++) {
    const analysis = await ctx.task(negotiationRoundAnalysisTask, {
      ...sharedArgs,
      round,
      proposalPath: currentProposalPath,
      marginModelPath: currentMarginModelPath,
      pricing: proposal.pricing,
      priorRounds: negotiationRounds,
      concessionRegister,
      approvedDiscountPct,
      objectionLog: pursuit.objectionLog,
      priorKnowledge,
    });
    openTerms = analysis.openTerms || [];
    if (analysis.roundSummaryPath) artifacts.push(analysis.roundSummaryPath);

    if (analysis.pendingExternal === true) {
      // Honest pending state (no customer response artifact yet) — recorded,
      // no approval raised this round, loop continues toward exhaustion.
      negotiationRounds.push({
        round,
        requestedDiscountPct: analysis.requestedDiscountPct,
        concessions: analysis.concessions || [],
        approval: null,
        settled: false,
        pendingExternal: true,
      });
      continue;
    }

    const requested = analysis.requestedDiscountPct;
    const standingCeiling = Math.max(standardDiscountPct, approvedDiscountPct);

    if (requested <= standingCeiling) {
      // Within already-delegated depth: no breakpoint — fold the round and
      // continue (or settle).
      negotiationRounds.push({
        round,
        requestedDiscountPct: requested,
        concessions: analysis.concessions || [],
        approval: null,
        settled: analysis.settled === true,
      });
      if (analysis.settled === true) {
        settled = true;
        break;
      }
      continue;
    }

    // Over-authority ask: matrix-routed approval. Throws beyond the deepest
    // tier (25%) — no approval route exists, fallbacks forbidden.
    const tier = routeDiscountApproval(requested);
    // Replay safety (clw per-round-unique rule): the FIRST over-authority ask
    // uses the canonical 'discount-approval' breakpointId; later, strictly
    // deeper asks get a round-suffixed id so replay never collapses two
    // distinct approvals. The actionId in policyDecisions stays
    // 'discount-approval' either way.
    const roundBreakpointId = discountApprovalRaised
      ? `discount-approval.round-${round}`
      : 'discount-approval';
    discountApprovalRaised = true;
    const marginAtDepth = recomputeMargin({ listPrice, discountPct: requested, cogs });
    const approval = await routedBreakpoint(ctx, {
      question: `Round ${round}: approve a ${requested}% discount for ${lead.company} (${offering})? Recomputed margin at that depth: netPrice ${marginAtDepth.netPrice}, marginPct ${marginAtDepth.marginPct}. Routed to ${tier.expert} per the discount authority matrix.`,
      title: `Approve discount depth (round ${round})`,
      context: {
        runId: ctx.runId,
        round,
        requestedDiscountPct: requested,
        marginAtRequestedDepth: marginAtDepth,
        concessions: analysis.concessions || [],
        concessionRegister,
        files: [{ path: analysis.roundSummaryPath, label: `Round ${round} summary` }],
      },
    }, {
      breakpointId: roundBreakpointId,
      expert: tier.expert,
      tags: ['policy-gated', 'sales'],
      strategy: 'single',
    });
    breakpointsHit.push(roundBreakpointId);
    recordPolicyDecision(policyDecisions, {
      actionId: 'discount-approval',
      breakpointId: roundBreakpointId,
      expert: tier.expert,
      approved: approval.approved,
      response: approval.response ?? approval.feedback,
      at: ctx.now(),
    });

    const roundRecord = {
      round,
      requestedDiscountPct: requested,
      concessions: analysis.concessions || [],
      approval: {
        approved: approval.approved === true,
        breakpointId: roundBreakpointId,
        expert: tier.expert,
        response: approval.response ?? approval.feedback ?? null,
      },
      settled: analysis.settled === true,
    };
    negotiationRounds.push(roundRecord);

    if (approval.approved === true) {
      // Approval grants a depth ceiling for the rest of the run.
      approvedDiscountPct = requested;
      concessionRegister.push({
        round,
        discountPct: requested,
        expert: tier.expert,
        breakpointId: roundBreakpointId,
        terms: analysis.concessions || [],
      });
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
      throw new Error(`${roundBreakpointId} rejected without a directive — the counter-proposal has nothing to apply (fallbacks forbidden).`);
    }
    const counter = await ctx.task(counterProposalTask, {
      ...sharedArgs,
      round,
      directive,
      rejectedDiscountPct: requested,
      proposalPath: currentProposalPath,
      marginModelPath: currentMarginModelPath,
      concessionRegister,
      priorKnowledge,
    });
    currentProposalPath = counter.updatedProposalPath;
    currentMarginModelPath = counter.updatedMarginModelPath;
    artifacts.push(counter.updatedProposalPath);
    artifacts.push(counter.updatedMarginModelPath);
  }
  timings.negotiation = ctx.now() - startTime;

  // Loop ended unsettled — never silently proceed: sales-vp decides whether
  // commit may be attempted with the open terms explicitly listed.
  if (!settled) {
    exhausted = true;
    const decision = await routedBreakpoint(ctx, {
      question: `Negotiation with ${lead.company} is unsettled after ${maxNegotiationRounds} round(s) (${openTerms.length} open term(s)). Approve to proceed to deal-commit with the open terms explicitly listed, or reject to end the run with the full negotiation record.`,
      title: 'Negotiation rounds exhausted',
      context: {
        runId: ctx.runId,
        openTerms,
        rounds: negotiationRounds,
        concessionRegister,
      },
    }, {
      breakpointId: 'sdw.negotiation-rounds-exhausted',
      expert: 'sales-vp',
      tags: ['sales', 'negotiation', 'escalation'],
      strategy: 'single',
    });
    breakpointsHit.push('sdw.negotiation-rounds-exhausted');
    exhaustionDecision = {
      approved: decision.approved === true,
      breakpointId: 'sdw.negotiation-rounds-exhausted',
      expert: 'sales-vp',
      response: decision.response ?? decision.feedback ?? null,
    };
    if (decision.approved !== true) {
      return buildResult(false, 'negotiation rounds exhausted and escalation rejected — full negotiation record retained');
    }
  }

  const finalProposalPath = currentProposalPath;

  // P8 — policy-gated deal-commit. Terminal on rejection: the decision is
  // recorded and the run ends — renegotiation is a NEW run, never a hidden
  // loop (clw acceptance precedent). Never auto-approved. The margin table is
  // computed deterministically in process code — the number sales-vp sees is
  // never trusted from an agent.
  ctx.log?.('info', 'P8: policy-gated deal-commit');
  const marginTable = [
    recomputeMargin({ listPrice, discountPct: proposal.pricing.proposedDiscountPct, cogs }),
  ];
  if (approvedDiscountPct > 0) {
    marginTable.push(recomputeMargin({ listPrice, discountPct: approvedDiscountPct, cogs }));
  }
  const commitApproval = await routedBreakpoint(ctx, {
    question: `Commit final terms for ${lead.company} (${offering})? Approved discount ceiling ${approvedDiscountPct}%, ${concessionRegister.length} registered concession(s), ${openTerms.length} open term(s). Commit is terminal: rejection ends this run.`,
    title: 'Approve deal commit',
    context: {
      runId: ctx.runId,
      files: [{ path: finalProposalPath, label: 'Final proposal' }],
      finalProposalPath,
      concessionRegister,
      approvedDiscountPct,
      marginTable,
      openTerms,
      negotiationSummary: {
        rounds: negotiationRounds.length,
        settled,
        exhausted,
      },
      gate: {
        passed: dealGate.passed,
        attempts: dealGate.attempts,
        escalated: dealGate.escalated,
        issues: dealGate.issues,
        evidence: dealGate.evidence,
      },
    },
  }, {
    breakpointId: 'deal-commit',
    expert: 'sales-vp',
    tags: ['policy-gated', 'sales'],
    strategy: 'single',
  });
  breakpointsHit.push('deal-commit');
  recordPolicyDecision(policyDecisions, {
    actionId: 'deal-commit',
    breakpointId: 'deal-commit',
    expert: 'sales-vp',
    approved: commitApproval.approved,
    response: commitApproval.response ?? commitApproval.feedback,
    at: ctx.now(),
  });
  commit = {
    approved: commitApproval.approved === true,
    breakpointId: 'deal-commit',
    expert: 'sales-vp',
    response: commitApproval.response ?? commitApproval.feedback ?? null,
    finalTerms: null,
  };
  timings.dealCommit = ctx.now() - startTime;
  if (commitApproval.approved !== true) {
    return buildResult(false, 'deal-commit rejected — decision recorded');
  }

  // P9 — close execution (EXECUTOR GUARD: runs ONLY inside this
  // approved === true guard), then CRM hygiene with an executed diff.
  ctx.log?.('info', 'P9: close execution + CRM hygiene');
  let closeExecution = null;
  if (commitApproval.approved === true) {
    closeExecution = await ctx.task(closeExecutionTask, {
      ...sharedArgs,
      intake,
      finalProposalPath,
      approvedDiscountPct,
      concessionRegister,
      policyDecisions,
      gate: {
        passed: dealGate.passed,
        attempts: dealGate.attempts,
        escalated: dealGate.escalated,
        issues: dealGate.issues,
      },
      negotiation: { rounds: negotiationRounds, settled, exhausted, exhaustionDecision },
    });
    commit.finalTerms = closeExecution.finalTerms;
    artifacts.push(closeExecution.closePackagePath);
  }

  crmHygiene = await ctx.task(crmHygieneTask, {
    ...sharedArgs,
    intake,
    finalProposalPath,
    finalTerms: closeExecution.finalTerms,
    approvedDiscountPct,
    concessionRegister,
    closePackagePath: closeExecution.closePackagePath,
  });
  artifacts.push(crmHygiene.updatePlanPath);
  timings.closeCrmHygiene = ctx.now() - startTime;

  // P10 — kip assert. Facts are built deterministically IN PROCESS CODE from
  // the concession register, objection log, close learnings, and run state —
  // agents never invent them. Guarded by the same kipEnabled flag as P1.
  if (kipEnabled) {
    ctx.log?.('info', 'P10: kip assert of concessions, objections, outcome, and learnings');
    const facts = [];
    for (const concession of concessionRegister) {
      facts.push({
        subject: `account:${lead.company}`,
        predicate: 'agreed-concession',
        object: `deal:${ctx.runId}`,
        props: {
          discountPct: concession.discountPct,
          round: concession.round,
          expert: concession.expert,
          offering,
        },
      });
    }
    for (const objection of pursuit.objectionLog || []) {
      facts.push({
        subject: `account:${lead.company}`,
        predicate: 'raised-objection',
        object: `objection:${objection.id}`,
        props: {
          handling: objection.resolution,
          offering,
        },
      });
    }
    const committed = commit.approved === true;
    const finalMargin = recomputeMargin({
      listPrice,
      discountPct: approvedDiscountPct > 0 ? approvedDiscountPct : proposal.pricing.proposedDiscountPct,
      cogs,
    });
    facts.push({
      subject: `deal:${lead.company}:${offering}:${ctx.runId}`,
      predicate: 'deal-outcome',
      object: committed ? 'outcome:won-committed' : 'outcome:not-committed',
      props: {
        rounds: negotiationRounds.length,
        gateAttempts: dealGate.attempts,
        approvedDiscountPct,
        marginPct: finalMargin.marginPct,
        runId: ctx.runId,
      },
    });
    // Win/loss learnings: evidenceRef is REQUIRED — an untraceable learning is
    // logged as a finding and dropped, never asserted.
    for (const learning of closeExecution.learnings || []) {
      if (!learning.evidenceRef) {
        ctx.log?.('warn', `P10: dropped untraceable learning (no evidenceRef): ${learning.learning}`);
        continue;
      }
      facts.push({
        subject: `deal:${lead.company}:${offering}:${ctx.runId}`,
        predicate: 'win-loss-learning',
        object: `evidence:${learning.evidenceRef}`,
        props: {
          learning: learning.learning,
          evidenceRef: learning.evidenceRef,
          outcome: committed ? 'won-committed' : 'not-committed',
          offering,
        },
      });
    }
    const assertion = await kipAssert(ctx, { kipDir, kipModel, kind: 'sales', facts });
    kipFactsAsserted = assertion.asserted;
  }
  timings.kipAssert = ctx.now() - startTime;

  return buildResult(true);
}
