/**
 * @process customer-support/onboarding-lifecycle
 * @description Flagship gated end-to-end customer-onboarding workflow. Carries one signed
 *   deal from handoff intake through account-context recall, success-plan drafting, an
 *   adversarial plan/success review with executed evidence (commitments re-traced to
 *   contract terms AND health-scoring logic executed over stub account data), policy-gated
 *   kickoff comms, parallel provisioning/training/integration tracks with per-track
 *   verification, milestone reviews that route to a policy-gated at-risk escalation, go-live
 *   sign-off, and a closing health-score baseline asserted into kip. Composes the pre-bar
 *   customer-experience point seeds (customer-onboarding, customer-health-scoring,
 *   escalation-management, customer-journey-mapping) BY NAME as callable stages — it does not
 *   duplicate them. Combinators come from ../common-utilities/routed-gate-combinators.js.
 *   No shell subtasks, sparse breakpoints, no fallbacks.
 * @inputs {
 *   handoff: object,               // required — signed-deal handoff packet:
 *                                  //   { accountId, accountName, contractTerms:[{id, term, commitment, metric?}],
 *                                  //     productTier, stakeholders:[{name, role, email?}], signedValue?, closeDate? }
 *                                  //   Missing handoff / handoff.accountId / empty contractTerms throws (no fallback).
 *   objectives?: string[],         // customer-stated success objectives; when absent the success-plan draft
 *                                  //   derives them from contractTerms and says so honestly.
 *   stubAccountData?: object,      // stub usage/engagement/relationship/outcome signals the adversarial gate
 *                                  //   executes health-scoring logic over; when absent the health-baseline critic
 *                                  //   reports which scores are not computable rather than inventing them.
 *   repoRoot?: string,             // repository root the agents work in (default '.')
 *   maxParallel?: number,          // ctx.parallel concurrency for the three tracks (default 3)
 *   maxFixAttempts?: number,       // bounded fix loop for the plan-review gate (default 2)
 *   kipEnabled?: boolean,          // recall + assert onboarding knowledge via kip (default true)
 *   kipDir?: string,               // kip store directory (default '.a5c/kip')
 *   kipModel?: string              // model for kip structured paths (default 'sonnet')
 * }
 * @outputs {
 *   success: boolean,              // true only when planReviewGate.passed, kickoff comms executed===approved,
 *                                  //   tenant provisioning executed===approved (when required), every track verified,
 *                                  //   go-live sign-off approved, and health baseline computed. Any at-risk escalation
 *                                  //   rejection or go-live rejection yields success:false with an honest reason.
 *   handoffSummary: object,        // { account, accountName, tier, stakeholders, contractTermIds }
 *   successPlan: object,           // { planPath, objectives, commitments:[{id,commitment,contractTermId}], milestones }
 *   planReviewGate: object,        // { passed, issues[], evidence[], attempts, escalated }
 *   gatedActions: object,          // { sendKickoffComms, provisionTenant, escalateAccount } each
 *                                  //   { actionId, required, approved, autoApproved, response, executed }
 *   tracks: object,                // { provisioning, training, integration } each { prepared, verified, verification }
 *   milestones: object,            // { reviewed:[{milestoneId,status,atRisk}], escalations:[{milestoneId,decision}] }
 *   goLive: object,                // { decision: 'go'|'no-go', signedOffBy, signOffPath }
 *   healthBaseline: object,        // { computed, scores:{usage,engagement,relationship,outcomes,composite}, tier, source }
 *   kipFactsAsserted: number,
 *   artifacts: array,
 *   metadata: object               // { processId, runId, accountId, breakpointsHit, timings }
 * }
 * @policyGatedActions
 *   tenant-provisioning-approval (expert onboarding-manager — provisioning/config changes to the customer
 *     production tenant; executor onb.provision-execute runs ONLY on approved===true),
 *   customer-comms-send (expert customer-success-manager — outbound onboarding/status communications; executor
 *     onb.send-kickoff-comms runs ONLY on approved===true),
 *   account-escalation-approval (expert customer-success-director — escalate an at-risk account; conditional on a
 *     milestone atRisk===true, skipped gate recorded never omitted; escalation acted on ONLY on approved===true).
 *   breakpointId equals actionId; tags ['policy-gated','customer-support']; every outcome incl. non-interactive
 *   auto-approvals recorded raw in outputs.gatedActions.
 * @graph
 *   domains: [domain:customer-experience, domain:business-operations]
 *   specializations: [specialization:customer-support]
 *   skillAreas: [skill-area:customer-success, skill-area:onboarding, skill-area:orchestration-loop]
 *   workflows: [workflow:customer-journey-optimization, workflow:time-to-value-acceleration]
 *   topics: [topic:quality-assurance, topic:account-health]
 *   roles: [role:onboarding-manager, role:customer-success-manager, role:customer-success-director]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
  gateFixerTask,
} from '../common-utilities/routed-gate-combinators.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fail-closed audit record for one policy-gated action. Identical audit shape to
 * ticket-lifecycle. approved is strictly bpResult.approved === true; autoApproved is
 * read raw from the BreakpointResult (never inferred from interactivity); response is
 * bpResult.response ?? bpResult.feedback ?? null. Skipped conditional gates are recorded
 * as { required:false, approved:false, autoApproved:false, executed:false } — never omitted.
 */
function recordGatedAction(actionId, required, bpResult, executed) {
  if (!required) {
    return { actionId, required: false, approved: false, autoApproved: false, response: null, executed: false };
  }
  return {
    actionId,
    required: true,
    approved: bpResult.approved === true,
    autoApproved: bpResult.autoApproved === true || bpResult.autoApprove === true,
    response: bpResult.response ?? bpResult.feedback ?? null,
    executed: executed === true,
  };
}

/**
 * Deterministic kebab-case slug for filenames / kip subjects.
 */
function kebab(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * No fallbacks: a contract term without an id, or a duplicate id, is a drafting hazard
 * (commitments trace to contractTerm ids) — throw BEFORE any drafting rather than default.
 */
function assertUniqueContractTermIds(contractTerms) {
  const seen = new Set();
  for (const term of contractTerms) {
    if (!term || !term.id) {
      throw new Error(
        'customer-support/onboarding-lifecycle: every contractTerm requires an id (no fallback).'
      );
    }
    if (seen.has(term.id)) {
      throw new Error(
        `customer-support/onboarding-lifecycle: duplicate contractTerm id '${term.id}' — ids must be unique before drafting.`
      );
    }
    seen.add(term.id);
  }
}

// ---------------------------------------------------------------------------
// Phase 1 — Signed-deal handoff intake
// ---------------------------------------------------------------------------

export const handoffIntakeTask = defineTask('onb.handoff-intake', (args, taskCtx) => ({
  kind: 'agent',
  title: `Intake signed-deal handoff for account ${args.handoff.accountId}`,
  agent: {
    name: 'onboarding-intake-analyst',
    prompt: {
      role: 'Signed-deal handoff analyst',
      task: `Normalize the signed-deal handoff packet for account '${args.handoff.accountId}'`,
      context: args,
      instructions: [
        'Normalize the handoff into { account, accountName, tier, stakeholders, contractTerms:[{id,term,commitment,metric}], openQuestions }.',
        'Preserve every contractTerm id exactly — downstream commitments trace to these ids.',
        'Only report facts present in the handoff; absent fields are unknown, never invented.',
        'Surface anything the handoff leaves ambiguous as openQuestions — do not block here.',
      ],
      outputFormat:
        'JSON with account, accountName, tier, stakeholders array, contractTerms array [{id, term, commitment, metric}], openQuestions array',
    },
    outputSchema: {
      type: 'object',
      required: ['account', 'tier', 'contractTerms'],
      properties: {
        account: { type: 'string' },
        accountName: { type: 'string' },
        tier: { type: 'string' },
        stakeholders: { type: 'array' },
        contractTerms: { type: 'array', minItems: 1 },
        openQuestions: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'onb', 'customer-support', 'intake'],
}));

// ---------------------------------------------------------------------------
// Phase 2 — Success-plan drafting
// ---------------------------------------------------------------------------

export const successPlanDraftTask = defineTask('onb.success-plan-draft', (args, taskCtx) => ({
  kind: 'agent',
  title: `Draft success plan for account ${args.intake.account}`,
  agent: {
    name: 'success-plan-author',
    prompt: {
      role: 'Customer success-plan author',
      task: `Write the onboarding success plan for account '${args.intake.account}'`,
      context: args,
      instructions: [
        `Write the success plan (markdown) to ${args.artifactsDir}/success-plan-${kebab(args.intake.account)}.md — it is the artifact the adversarial gate reviews.`,
        'Apply the discovery-assessment, onboarding-plan, and success-milestones methods from domains/business/customer-experience/customer-onboarding.js BY NAME (lenses, not re-implementations).',
        'Apply the journey-map lens from domains/business/customer-experience/customer-journey-mapping.js to frame milestones along the customer journey.',
        'EVERY commitment MUST carry a contractTermId tracing it to a contractTerm id in context — a commitment with no matching contractTerm is an over-promise and must not be written.',
        'When objectives are absent from inputs, derive them from the contractTerms and SAY SO honestly in the plan (do not present derived objectives as customer-stated).',
        'Define milestones as [{id, name, targetDay, criteria}] with verifiable criteria.',
        'Capture evidence[] (file citations for each applied lens and each traced commitment) for the reviewers to re-check.',
        'If feedback and an attempt number are present in context, re-draft addressing every point of feedback and report what changed.',
      ],
      outputFormat:
        'JSON with planPath, objectives array, commitments array [{id, commitment, contractTermId}], milestones array [{id, name, targetDay, criteria}], objectivesDerived boolean, evidence array (at least one entry)',
    },
    outputSchema: {
      type: 'object',
      required: ['planPath', 'commitments', 'milestones', 'evidence'],
      properties: {
        planPath: { type: 'string' },
        objectives: { type: 'array' },
        objectivesDerived: { type: 'boolean' },
        commitments: { type: 'array' },
        milestones: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'onb', 'customer-support', 'success-plan'],
}));

// ---------------------------------------------------------------------------
// Phase 4 — Kickoff comms draft + policy-gated executor
// ---------------------------------------------------------------------------

export const kickoffCommsDraftTask = defineTask('onb.kickoff-comms-draft', (args, taskCtx) => ({
  kind: 'agent',
  title: `Draft kickoff comms for account ${args.intake.account}`,
  agent: {
    name: 'cs-comms-author',
    prompt: {
      role: 'Customer kickoff-communication author',
      task: `Draft the onboarding kickoff communication for account '${args.intake.account}'`,
      context: args,
      instructions: [
        `Write the kickoff message draft (markdown) to ${args.artifactsDir}/kickoff-${kebab(args.intake.account)}.md.`,
        'Promise ONLY what the APPROVED success plan substantiates — every commitment sentence must trace to a plan commitment you cite.',
        'Address the message to the handoff stakeholders; pick the channel implied by their contact details, else state channel as unknown.',
        'No internal-only details leak into a customer-visible message.',
      ],
      outputFormat:
        'JSON with commsDraft, commsDraftPath, channel, recipients array, evidence array (at least one entry)',
    },
    outputSchema: {
      type: 'object',
      required: ['commsDraft', 'channel', 'recipients', 'evidence'],
      properties: {
        commsDraft: { type: 'string' },
        commsDraftPath: { type: 'string' },
        channel: { type: 'string' },
        recipients: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'onb', 'customer-support', 'comms'],
}));

export const sendKickoffCommsTask = defineTask('onb.send-kickoff-comms', (args, taskCtx) => ({
  kind: 'agent',
  title: `Send approved kickoff comms for account ${args.intake.account}`,
  agent: {
    name: 'cs-comms-executor',
    prompt: {
      role: 'Kickoff-comms executor',
      task: `Send the human-approved kickoff communication for account '${args.intake.account}'`,
      context: args,
      instructions: [
        'Execute the send of the HUMAN-APPROVED comms exactly as approved (approver edits in the breakpoint response supersede the draft verbatim).',
        `Write the final sent message to ${args.artifactsDir}/kickoff-sent-${kebab(args.intake.account)}.md; record channel and timestamp.`,
        'Runs ONLY after the customer-comms-send breakpoint approved — never restate or re-decide the approval.',
      ],
      outputFormat: 'JSON with sent boolean, sentMessagePath, channel, sentAt',
    },
    outputSchema: {
      type: 'object',
      required: ['sent', 'sentMessagePath'],
      properties: {
        sent: { type: 'boolean' },
        sentMessagePath: { type: 'string' },
        channel: { type: 'string' },
        sentAt: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'onb', 'customer-support', 'policy-gated', 'comms'],
}));

// ---------------------------------------------------------------------------
// Phase 5 — Parallel tracks: provisioning (gated), training, integration + verify
// ---------------------------------------------------------------------------

export const provisionPlanTask = defineTask('onb.provision-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan tenant provisioning for account ${args.intake.account}`,
  agent: {
    name: 'tenant-provisioning-planner',
    prompt: {
      role: 'Production-tenant provisioning planner',
      task: `Plan the production-tenant provisioning and configuration for account '${args.intake.account}'`,
      context: args,
      instructions: [
        'Plan provisioning/config steps and required config changes; DO NOT touch the tenant — planning only, gated before execution.',
        'Ground the plan in the product tier and contract terms; call out risk notes and pre-conditions.',
        'Capture evidence[] (what you inspected) for the verifier to re-run after execution.',
      ],
      outputFormat:
        'JSON with provisionSteps array, configChanges array, riskNotes array, evidence array (at least one entry)',
    },
    outputSchema: {
      type: 'object',
      required: ['provisionSteps', 'evidence'],
      properties: {
        provisionSteps: { type: 'array' },
        configChanges: { type: 'array' },
        riskNotes: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'onb', 'customer-support', 'provisioning'],
}));

export const provisionExecuteTask = defineTask('onb.provision-execute', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved provisioning for account ${args.intake.account}`,
  agent: {
    name: 'tenant-provisioning-executor',
    prompt: {
      role: 'Provisioning executor',
      task: `Apply the human-approved tenant provisioning for account '${args.intake.account}'`,
      context: args,
      instructions: [
        'Apply the HUMAN-APPROVED provisioning exactly as approved (approver-adjusted steps supersede the plan).',
        `Write the provisioning record to ${args.artifactsDir}/provision-record-${kebab(args.intake.account)}.json; record applied steps.`,
        'Runs ONLY after the tenant-provisioning-approval breakpoint approved.',
        'Capture evidence[] of what was actually applied for the track verifier to re-run.',
      ],
      outputFormat:
        'JSON with executed boolean, recordPath, appliedSteps array, evidence array (at least one entry)',
    },
    outputSchema: {
      type: 'object',
      required: ['executed', 'recordPath', 'evidence'],
      properties: {
        executed: { type: 'boolean' },
        recordPath: { type: 'string' },
        appliedSteps: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'onb', 'customer-support', 'policy-gated', 'provisioning'],
}));

export const trainingTrackTask = defineTask('onb.training-track-prepare', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prepare training track for account ${args.intake.account}`,
  agent: {
    name: 'training-track-designer',
    prompt: {
      role: 'Enablement/training track designer',
      task: `Design the enablement/training track for account '${args.intake.account}'`,
      context: args,
      instructions: [
        'Apply the training-program method from domains/business/customer-experience/customer-onboarding.js BY NAME (lens, not a re-implementation).',
        'Design modules, delivery method, and a schedule tied to the success-plan milestones.',
        'No gate — this is internal preparation. Capture evidence[] for the track verifier.',
      ],
      outputFormat:
        'JSON with modules array, deliveryMethod, schedule, evidence array (at least one entry)',
    },
    outputSchema: {
      type: 'object',
      required: ['modules', 'evidence'],
      properties: {
        modules: { type: 'array' },
        deliveryMethod: { type: 'string' },
        schedule: {},
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'onb', 'customer-support', 'training'],
}));

export const integrationTrackTask = defineTask('onb.integration-track-prepare', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prepare integration track for account ${args.intake.account}`,
  agent: {
    name: 'integration-track-engineer',
    prompt: {
      role: 'Integration track engineer',
      task: `Plan and set up the integration track for account '${args.intake.account}'`,
      context: args,
      instructions: [
        'Plan/execute the closest verifiable integration setup from the contract terms and product tier.',
        'Record EXACTLY what was run (commands/config) so the track verifier can re-run it.',
        'No gate — internal preparation. Capture evidence[] with raw outputs.',
      ],
      outputFormat:
        'JSON with integrations array, sequencing array, dependencies array, evidence array (at least one entry)',
    },
    outputSchema: {
      type: 'object',
      required: ['integrations', 'evidence'],
      properties: {
        integrations: { type: 'array' },
        sequencing: { type: 'array' },
        dependencies: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'onb', 'customer-support', 'integration'],
}));

export const verifyTrackTask = defineTask('onb.verify-track', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify ${args.track} track for account ${args.intake.account}`,
  agent: {
    name: 'track-verifier',
    prompt: {
      role: 'Onboarding track verifier',
      task: `Verify the '${args.track}' track deliverables for account '${args.intake.account}' with executed evidence`,
      context: args,
      instructions: [
        'Execute the track deliverable checks and capture raw outputs — verification without executed evidence is invalid (no green-by-assertion).',
        'verified:false with explicit failures[] when anything does not check out — record an unverified track honestly.',
        'Do not trust the preparing agent: re-run the closest verifiable check yourself and cite the raw output.',
      ],
      outputFormat:
        'JSON with verified boolean, evidence array (at least one executed entry), failures array',
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'evidence', 'failures'],
      properties: {
        verified: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
        failures: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'onb', 'customer-support', 'verification', 'quality-gate'],
}));

// ---------------------------------------------------------------------------
// Phase 6 — Milestone review + conditional at-risk escalation
// ---------------------------------------------------------------------------

export const milestoneReviewTask = defineTask('onb.milestone-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review onboarding milestones for account ${args.intake.account}`,
  agent: {
    name: 'milestone-reviewer',
    prompt: {
      role: 'Onboarding milestone reviewer',
      task: `Review the onboarding milestones for account '${args.intake.account}' against track verifications`,
      context: args,
      instructions: [
        'Derive each milestone status from the track verifications and success-plan criteria — status is one of on-track|at-risk|blocked|met.',
        'Set atRisk:true HONESTLY when a milestone cannot be met on the current trajectory; atRisk drives the escalation breakpoint.',
        'Give a reason for every status; never downgrade risk to avoid escalation.',
        'Capture evidence[] citing the verification outputs you relied on.',
      ],
      outputFormat:
        'JSON with milestoneStatuses array [{milestoneId, status, atRisk, reason}], atRiskCount number, evidence array (at least one entry)',
    },
    outputSchema: {
      type: 'object',
      required: ['milestoneStatuses', 'atRiskCount', 'evidence'],
      properties: {
        milestoneStatuses: { type: 'array' },
        atRiskCount: { type: 'number' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'onb', 'customer-support', 'milestone'],
}));

export const escalationPackageTask = defineTask('onb.escalation-package', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assemble at-risk escalation package for account ${args.intake.account}`,
  agent: {
    name: 'escalation-coordinator',
    prompt: {
      role: 'At-risk account escalation coordinator',
      task: `Assemble the at-risk escalation package for account '${args.intake.account}'`,
      context: args,
      instructions: [
        'Apply the handoff-package and communication-standards logic from domains/business/customer-experience/escalation-management.js BY NAME.',
        'Summarize which milestones are at risk and why, grounded in the milestone review and track verifications.',
        'Recommend an escalation tier and the specific ask for the customer-success-director; only runs when a milestone is atRisk.',
        'Capture evidence[] citing the at-risk milestones and their reasons.',
      ],
      outputFormat:
        'JSON with handoffPackage, escalationReason, recommendedTier, evidence array (at least one entry)',
    },
    outputSchema: {
      type: 'object',
      required: ['handoffPackage', 'escalationReason', 'evidence'],
      properties: {
        handoffPackage: {},
        escalationReason: { type: 'string' },
        recommendedTier: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'onb', 'customer-support', 'escalation'],
}));

// ---------------------------------------------------------------------------
// Phase 8 — Closing health-score baseline
// ---------------------------------------------------------------------------

export const healthBaselineTask = defineTask('onb.health-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compute health-score baseline for account ${args.intake.account}`,
  agent: {
    name: 'health-score-analyst',
    prompt: {
      role: 'Customer health-score analyst',
      task: `Compute the onboarding health-score baseline for account '${args.intake.account}'`,
      context: args,
      instructions: [
        'Compose the scoring-model (indicator-design, scoring-model, threshold-definition) from domains/business/customer-experience/customer-health-scoring.js over stubAccountData / live signals.',
        'Compute sub-scores usage, engagement, relationship, outcomes and the composite; set computed:true only when the composite is actually computed.',
        'Where a sub-score is NOT computable from available signals, report which and why — never invent a number.',
        'Record source (stubAccountData | live | partial) and evidence[] showing the executed computation.',
      ],
      outputFormat:
        'JSON with computed boolean, scores {usage, engagement, relationship, outcomes, composite}, tier, source, evidence array (at least one entry)',
    },
    outputSchema: {
      type: 'object',
      required: ['computed', 'scores', 'source', 'evidence'],
      properties: {
        computed: { type: 'boolean' },
        scores: {
          type: 'object',
          properties: {
            usage: {},
            engagement: {},
            relationship: {},
            outcomes: {},
            composite: {},
          },
        },
        tier: { type: 'string' },
        source: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'onb', 'customer-support', 'health-score'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    handoff,
    objectives = null,
    stubAccountData = null,
    repoRoot = '.',
    maxParallel = 3,
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs || {};

  // No fallbacks: an unsigned/empty handoff is not workable.
  if (!handoff || !handoff.accountId) {
    throw new Error(
      'customer-support/onboarding-lifecycle requires a handoff with at least { accountId, contractTerms }.'
    );
  }
  if (!Array.isArray(handoff.contractTerms) || handoff.contractTerms.length === 0) {
    throw new Error(
      'customer-support/onboarding-lifecycle requires a non-empty handoff.contractTerms array (no fallback).'
    );
  }
  assertUniqueContractTermIds(handoff.contractTerms);

  const startTime = ctx.now();
  const timings = {};
  const breakpointsHit = [];
  const artifactsDir = ctx.artifactsDir;
  const accountId = handoff.accountId;
  const accountName = handoff.accountName ?? accountId;
  const sharedArgs = { handoff, objectives, stubAccountData, repoRoot, kipDir, kipModel, artifactsDir };

  // Fail-closed audit surface — every policy-gated action lands here, including
  // skipped conditional gates and non-interactive auto-approvals. Never omitted.
  const gatedActions = {
    sendKickoffComms: recordGatedAction('customer-comms-send', false, null, false),
    provisionTenant: recordGatedAction('tenant-provisioning-approval', false, null, false),
    escalateAccount: recordGatedAction('account-escalation-approval', false, null, false),
  };

  // Phase 0 — kip recall of prior account context (gated on kipEnabled). Empty
  // store = fresh brain, never an error. Threads into every later task.
  ctx.log?.('info', 'Phase 0: kip recall of prior onboarding + account context');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      kipModel,
      kind: 'customer-support',
      topic: `prior onboarding outcomes, health signals, and account history for account:${accountId} / ${accountName}`,
    });
  }
  timings.kipRecall = ctx.now() - startTime;

  // Phase 1 — signed-deal handoff intake.
  ctx.log?.('info', 'Phase 1: signed-deal handoff intake');
  const intake = await ctx.task(handoffIntakeTask, { ...sharedArgs, priorKnowledge });
  const handoffSummary = {
    account: intake.account,
    accountName: intake.accountName ?? accountName,
    tier: intake.tier,
    stakeholders: intake.stakeholders ?? [],
    contractTermIds: handoff.contractTerms.map((t) => t.id),
  };
  timings.intake = ctx.now() - startTime;

  // Phase 2 — success-plan drafting. Every commitment traces to a contractTerm id.
  ctx.log?.('info', 'Phase 2: success-plan drafting');
  const successPlanDraft = await ctx.task(successPlanDraftTask, {
    ...sharedArgs,
    intake,
    priorKnowledge,
  });
  timings.successPlanDraft = ctx.now() - startTime;

  // Phase 3 — adversarial plan/success review via the imported adversarialGate
  // combinator: two independent critics, bounded fixer loop, owner escalation.
  // Fail-closed: a failed gate returns success:false BEFORE any customer contact.
  ctx.log?.('info', 'Phase 3: adversarial plan/success review gate (executed evidence)');
  const planReviewGate = await adversarialGate(ctx, {
    gateId: 'onb.success-plan-review',
    artifact: { path: successPlanDraft.planPath, description: 'Onboarding success plan' },
    critics: [
      {
        name: 'commitment-traceability-critic',
        role: 'Adversarial commitment-traceability reviewer',
        focus: 'every success-plan commitment re-traced to a contractTerm id',
        instructions: [
          'RE-TRACE each plan commitment to a contractTerm in context and cite the id:line — an untraceable or over-promised commitment (no matching contract term) is a finding, not a pass.',
          'Build a commitment -> contractTerm map and include it in evidence as an EXECUTED check; a verdict without that map is a protocol failure.',
          'End your verdict with JSON exactly: {"passed": <bool>, "issues": [{"severity": <string>, "description": <string>, "location": <string>}], "evidence": [<string>]}',
        ],
      },
      {
        name: 'health-baseline-critic',
        role: 'Adversarial health-baseline reviewer',
        focus: 'executed health-scoring evidence over stubAccountData',
        instructions: [
          'EXECUTE the customer-health-scoring scoring-model logic (from domains/business/customer-experience/customer-health-scoring.js) over stubAccountData and record the computed sub-scores + composite in evidence[].',
          'A verdict without executed scores is a protocol failure; where a sub-score is not computable, say WHICH and WHY rather than fabricating.',
          'End your verdict with JSON exactly: {"passed": <bool>, "issues": [{"severity": <string>, "description": <string>, "location": <string>}], "evidence": [<string>]}',
        ],
      },
    ],
    ironLaw: [
      'Evidence must include at least one EXECUTED check (re-traced commitment map AND computed health scores) — file-read citations alone do not satisfy this gate.',
      'passed:true with an empty evidence array is a protocol failure (enforced by the combinator).',
    ],
    maxFixAttempts,
    fixer: { task: gateFixerTask }, // built-in fixer, referenced explicitly — edits the success-plan artifact
    context: { intake, successPlan: successPlanDraft, stubAccountData, contractTerms: handoff.contractTerms },
  });
  if (planReviewGate.escalated) {
    // The escalation breakpoint is raised internally by the combinator.
    breakpointsHit.push('onb.success-plan-review.gate-escalation');
  }
  timings.planReviewGate = ctx.now() - startTime;

  const successPlan = {
    planPath: successPlanDraft.planPath,
    objectives: successPlanDraft.objectives ?? [],
    commitments: successPlanDraft.commitments ?? [],
    milestones: successPlanDraft.milestones ?? [],
  };

  if (!planReviewGate.passed) {
    // Fail closed: a failed plan gate means NO customer contact and no tracks —
    // the gated phases never run; all three gated actions stay recorded as skipped.
    return {
      success: false,
      handoffSummary,
      successPlan,
      planReviewGate,
      gatedActions,
      tracks: null,
      milestones: null,
      goLive: { decision: 'no-go', signedOffBy: null, signOffPath: null },
      healthBaseline: null,
      kipFactsAsserted: 0,
      artifacts: [successPlan.planPath],
      metadata: {
        processId: 'customer-support/onboarding-lifecycle',
        runId: ctx.runId,
        accountId,
        breakpointsHit,
        timings,
        reason: 'Plan-review gate failed (incl. escalation) — customer contact and provisioning never run on a failed gate',
      },
    };
  }

  // Phase 4 — policy-gated kickoff comms. Draft, then routedBreakpoint
  // customer-comms-send (expert customer-success-manager); executor runs ONLY on
  // approved === true — fail closed, never worked around.
  ctx.log?.('info', 'Phase 4: policy-gated kickoff comms');
  const commsDraft = await ctx.task(kickoffCommsDraftTask, {
    ...sharedArgs,
    intake,
    successPlan,
    priorKnowledge,
  });
  const commsApproval = await routedBreakpoint(ctx, {
    question: `Send onboarding kickoff comms to ${accountName}? Edits in your response supersede the draft verbatim. Rejection records the decision; the run continues with sent=false surfaced honestly.`,
    title: 'Send kickoff comms',
    context: {
      runId: ctx.runId,
      files: [{ path: commsDraft.commsDraftPath ?? successPlan.planPath, label: 'Kickoff comms draft' }],
      summary: {
        commsDraft: commsDraft.commsDraft,
        channel: commsDraft.channel,
        recipients: commsDraft.recipients,
        planReviewGate: { passed: planReviewGate.passed, attempts: planReviewGate.attempts, escalated: planReviewGate.escalated },
      },
    },
  }, {
    breakpointId: 'customer-comms-send',
    expert: 'customer-success-manager',
    tags: ['policy-gated', 'customer-support'],
    strategy: 'single',
  });
  breakpointsHit.push('customer-comms-send');
  let commsExecution = null;
  if (commsApproval.approved === true) {
    commsExecution = await ctx.task(sendKickoffCommsTask, {
      ...sharedArgs,
      intake,
      successPlan,
      commsDraft,
      approvedCommsResponse: commsApproval.response ?? commsApproval.feedback ?? null,
    });
  }
  gatedActions.sendKickoffComms = recordGatedAction(
    'customer-comms-send', true, commsApproval, commsExecution ? commsExecution.sent === true : false
  );
  timings.kickoffComms = ctx.now() - startTime;

  // Phase 5 — parallel provisioning / training / integration tracks with
  // per-track verification. ctx.parallel.map over three fixed track descriptors;
  // a switch on track name throws on an unknown track (no default-skip). The
  // provisioning branch awaits its own tenant-provisioning-approval gate before
  // the guarded executor so parallelism never races the human decision. Results
  // are re-keyed by track name via a Map (no positional guessing).
  ctx.log?.('info', 'Phase 5: parallel provisioning / training / integration tracks');
  const trackArgs = { ...sharedArgs, intake, successPlan, priorKnowledge };
  const trackResults = await ctx.parallel.map(
    [{ track: 'provisioning' }, { track: 'training' }, { track: 'integration' }],
    async (descriptor) => {
      const trackName = descriptor.track;
      switch (trackName) {
        case 'provisioning': {
          const provisionPlan = await ctx.task(provisionPlanTask, { ...trackArgs, track: 'provisioning' });
          const provisionApproval = await routedBreakpoint(ctx, {
            question: `Approve production-tenant provisioning for ${accountName}? Rejection records the decision and the provisioning track verifies with provisioned=false.`,
            title: 'Approve tenant provisioning',
            context: {
              runId: ctx.runId,
              summary: {
                provisionSteps: provisionPlan.provisionSteps,
                configChanges: provisionPlan.configChanges,
                riskNotes: provisionPlan.riskNotes,
                tier: handoffSummary.tier,
              },
            },
          }, {
            breakpointId: 'tenant-provisioning-approval',
            expert: 'onboarding-manager',
            tags: ['policy-gated', 'customer-support'],
            strategy: 'single',
          });
          let provisionExecution = null;
          if (provisionApproval.approved === true) {
            provisionExecution = await ctx.task(provisionExecuteTask, {
              ...trackArgs,
              track: 'provisioning',
              provisionPlan,
              approvedProvisionResponse: provisionApproval.response ?? provisionApproval.feedback ?? null,
            });
          }
          const gated = recordGatedAction(
            'tenant-provisioning-approval', true, provisionApproval,
            provisionExecution ? provisionExecution.executed === true : false
          );
          const verification = await ctx.task(verifyTrackTask, {
            ...trackArgs,
            track: 'provisioning',
            prepared: { provisionPlan, provisionExecution, provisioned: provisionExecution ? provisionExecution.executed === true : false },
          });
          return {
            track: 'provisioning',
            prepared: true,
            verified: verification.verified === true,
            verification: { verified: verification.verified === true, evidence: verification.evidence ?? [], failures: verification.failures ?? [] },
            gated,
            raisedBreakpoint: 'tenant-provisioning-approval',
            recordPath: provisionExecution?.recordPath ?? null,
          };
        }
        case 'training': {
          const training = await ctx.task(trainingTrackTask, { ...trackArgs, track: 'training' });
          const verification = await ctx.task(verifyTrackTask, { ...trackArgs, track: 'training', prepared: training });
          return {
            track: 'training',
            prepared: true,
            verified: verification.verified === true,
            verification: { verified: verification.verified === true, evidence: verification.evidence ?? [], failures: verification.failures ?? [] },
          };
        }
        case 'integration': {
          const integration = await ctx.task(integrationTrackTask, { ...trackArgs, track: 'integration' });
          const verification = await ctx.task(verifyTrackTask, { ...trackArgs, track: 'integration', prepared: integration });
          return {
            track: 'integration',
            prepared: true,
            verified: verification.verified === true,
            verification: { verified: verification.verified === true, evidence: verification.evidence ?? [], failures: verification.failures ?? [] },
          };
        }
        default:
          throw new Error(
            `customer-support/onboarding-lifecycle: unknown track '${trackName}' — no default-skip (fallbacks forbidden).`
          );
      }
    },
    { maxConcurrency: maxParallel }
  );

  // Re-key by track name; an incomplete fan-out throws (no positional guessing).
  const trackMap = new Map(trackResults.map((r) => [r.track, r]));
  for (const name of ['provisioning', 'training', 'integration']) {
    if (!trackMap.has(name)) {
      throw new Error(
        `customer-support/onboarding-lifecycle: incomplete track fan-out — missing '${name}' result (no fallback).`
      );
    }
  }
  const provisioningResult = trackMap.get('provisioning');
  const trainingResult = trackMap.get('training');
  const integrationResult = trackMap.get('integration');
  gatedActions.provisionTenant = provisioningResult.gated;
  if (provisioningResult.raisedBreakpoint) breakpointsHit.push(provisioningResult.raisedBreakpoint);
  const tracks = {
    provisioning: { prepared: provisioningResult.prepared, verified: provisioningResult.verified, verification: provisioningResult.verification },
    training: { prepared: trainingResult.prepared, verified: trainingResult.verified, verification: trainingResult.verification },
    integration: { prepared: integrationResult.prepared, verified: integrationResult.verified, verification: integrationResult.verification },
  };
  const allTracksVerified =
    tracks.provisioning.verified === true &&
    tracks.training.verified === true &&
    tracks.integration.verified === true;
  timings.tracks = ctx.now() - startTime;

  // Phase 6 — milestone review with sparse routed at-risk escalation. A
  // routedBreakpoint fires ONLY when a milestone is atRisk === true, raising the
  // policy-gated account-escalation-approval with an escalation-management handoff
  // package. Non-at-risk milestones auto-continue (no breakpoint).
  ctx.log?.('info', 'Phase 6: milestone review with routed at-risk escalation');
  const milestoneReview = await ctx.task(milestoneReviewTask, {
    ...sharedArgs,
    intake,
    successPlan,
    tracks,
    priorKnowledge,
  });
  const atRiskMilestones = (milestoneReview.milestoneStatuses ?? []).filter((m) => m.atRisk === true);
  const escalations = [];
  if (atRiskMilestones.length > 0) {
    const escalationPackage = await ctx.task(escalationPackageTask, {
      ...sharedArgs,
      intake,
      successPlan,
      tracks,
      milestoneReview,
      atRiskMilestones,
    });
    const escalationApproval = await routedBreakpoint(ctx, {
      question: `${atRiskMilestones.length} milestone(s) at risk for ${accountName}. Approve escalating this account? Reason: ${escalationPackage.escalationReason}. Rejection records the decision; the account is NOT escalated.`,
      title: 'Approve account escalation',
      context: {
        runId: ctx.runId,
        summary: {
          atRiskMilestones,
          escalationReason: escalationPackage.escalationReason,
          recommendedTier: escalationPackage.recommendedTier,
          handoffPackage: escalationPackage.handoffPackage,
        },
      },
    }, {
      breakpointId: 'account-escalation-approval',
      expert: 'customer-success-director',
      tags: ['policy-gated', 'customer-support'],
      strategy: 'single',
    });
    breakpointsHit.push('account-escalation-approval');
    // No executor task — the escalation is ACTED ON only when approved === true.
    gatedActions.escalateAccount = recordGatedAction(
      'account-escalation-approval', true, escalationApproval, escalationApproval.approved === true
    );
    for (const m of atRiskMilestones) {
      escalations.push({ milestoneId: m.milestoneId, decision: escalationApproval.approved === true ? 'escalated' : 'rejected' });
    }
  }
  // else: escalateAccount stays recorded as the skipped conditional gate (required:false).
  const milestones = {
    reviewed: (milestoneReview.milestoneStatuses ?? []).map((m) => ({
      milestoneId: m.milestoneId,
      status: m.status,
      atRisk: m.atRisk === true,
    })),
    escalations,
  };
  timings.milestones = ctx.now() - startTime;

  // Phase 7 — go-live sign-off. routedBreakpoint go-live-sign-off (expert
  // onboarding-manager, tags customer-support/go-live) over the go-live checklist
  // assembled from track verifications and milestone statuses. NOT one of the three
  // policy-gated actions. A no-go is final for the run; the closing phases still run.
  ctx.log?.('info', 'Phase 7: go-live sign-off');
  const goLiveApproval = await routedBreakpoint(ctx, {
    question: `Sign off go-live for ${accountName}? Tracks verified: ${allTracksVerified}. At-risk milestones: ${atRiskMilestones.length}. A no-go is final for this run.`,
    title: 'Go-live sign-off',
    context: {
      runId: ctx.runId,
      files: [{ path: successPlan.planPath, label: 'Success plan' }],
      summary: {
        tracks,
        milestones: milestones.reviewed,
        gatedActions,
        allTracksVerified,
      },
    },
  }, {
    breakpointId: 'go-live-sign-off',
    expert: 'onboarding-manager',
    tags: ['customer-support', 'go-live'],
    strategy: 'single',
  });
  breakpointsHit.push('go-live-sign-off');
  const goLive = {
    decision: goLiveApproval.approved === true ? 'go' : 'no-go',
    signedOffBy: 'onboarding-manager',
    signOffPath: null,
  };
  timings.goLive = ctx.now() - startTime;

  // Phase 8 — closing health-score baseline. Composes the customer-health-scoring
  // scoring-model over stubAccountData/live signals; not-computable sub-scores are
  // reported, never invented.
  ctx.log?.('info', 'Phase 8: health-score baseline');
  const healthBaselineResult = await ctx.task(healthBaselineTask, {
    ...sharedArgs,
    intake,
    tracks,
    milestoneReview,
    priorKnowledge,
  });
  const healthBaseline = {
    computed: healthBaselineResult.computed === true,
    scores: healthBaselineResult.scores ?? {},
    tier: healthBaselineResult.tier ?? handoffSummary.tier,
    source: healthBaselineResult.source,
  };
  timings.healthBaseline = ctx.now() - startTime;

  // Phase 9 — kip assert of onboarding outcomes + health signals. Non-empty facts:
  // onboarding-outcome, health-baseline, plan-review gate-outcome, and one
  // policy-decision fact per gated action. Assert failures reported by the
  // librarian task, never swallowed.
  ctx.log?.('info', 'Phase 9: kip assert of onboarding outcomes + health signals');
  const subject = `account:${accountId}`;
  let kipFactsAsserted = 0;
  if (kipEnabled) {
    const composite = healthBaseline.scores?.composite;
    const facts = [
      {
        subject,
        predicate: 'onboarding-outcome',
        object: goLive.decision,
        props: { runId: ctx.runId, goLiveDecision: goLive.decision, allTracksVerified },
      },
      {
        subject,
        predicate: 'health-baseline',
        object: `composite:${composite ?? 'not-computed'}`,
        props: {
          usage: healthBaseline.scores?.usage ?? null,
          engagement: healthBaseline.scores?.engagement ?? null,
          relationship: healthBaseline.scores?.relationship ?? null,
          outcomes: healthBaseline.scores?.outcomes ?? null,
          tier: healthBaseline.tier,
        },
      },
      {
        subject,
        predicate: 'gate-outcome',
        object: 'onb.success-plan-review',
        props: { passed: planReviewGate.passed, attempts: planReviewGate.attempts, escalated: planReviewGate.escalated },
      },
    ];
    for (const action of [gatedActions.sendKickoffComms, gatedActions.provisionTenant, gatedActions.escalateAccount]) {
      facts.push({
        subject,
        predicate: 'policy-decision',
        object: action.actionId,
        props: {
          required: action.required,
          approved: action.approved,
          autoApproved: action.autoApproved,
          executed: action.executed,
        },
      });
    }
    const capture = await kipAssert(ctx, { kipDir, kipModel, kind: 'customer-support', facts });
    kipFactsAsserted = capture.asserted;
  }
  timings.kipAssert = ctx.now() - startTime;

  // Success is honest: the plan gate passed, each executor did exactly what the
  // human decided (executed === approved), when provisioning was required its
  // executor honored the gate, every track verified, go-live is a go, the health
  // baseline computed, and no at-risk escalation was rejected.
  const success =
    planReviewGate.passed === true &&
    gatedActions.sendKickoffComms.executed === gatedActions.sendKickoffComms.approved &&
    (gatedActions.provisionTenant.required
      ? gatedActions.provisionTenant.executed === gatedActions.provisionTenant.approved
      : true) &&
    allTracksVerified === true &&
    goLive.decision === 'go' &&
    healthBaseline.computed === true &&
    (gatedActions.escalateAccount.required ? gatedActions.escalateAccount.approved === true : true);

  const artifacts = [successPlan.planPath];
  if (commsExecution?.sentMessagePath) artifacts.push(commsExecution.sentMessagePath);
  if (provisioningResult.recordPath) artifacts.push(provisioningResult.recordPath);

  return {
    success,
    handoffSummary,
    successPlan,
    planReviewGate,
    gatedActions,
    tracks,
    milestones,
    goLive,
    healthBaseline,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'customer-support/onboarding-lifecycle',
      runId: ctx.runId,
      accountId,
      breakpointsHit,
      timings: { ...timings, total: ctx.now() - startTime },
    },
  };
}
