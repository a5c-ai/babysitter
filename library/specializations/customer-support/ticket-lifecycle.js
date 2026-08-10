/**
 * @process customer-support/ticket-lifecycle
 * @description Flagship end-to-end support-ticket lifecycle: intake+classification ->
 *   severity/priority triage -> parallel investigation (repro, knowledge, account context) ->
 *   resolution drafting -> adversarial resolution-review gate with executed evidence ->
 *   policy-gated customer reply and refund/credit -> verification and close -> KCS-style
 *   KB-article capture with policy-gated publish. All human approvals are routedBreakpoints;
 *   kip recall at intake and assert at close.
 * @inputs {
 *   ticket: object,                // required — {id, channel, subject, body, customerRef, attachments?}
 *   customerProfile?: object,      // account context source (tier, tenure, health, prior remediations)
 *   repoRoot?: string,             // repository root the agents work in (default '.')
 *   kbDir?: string,                // knowledge-base directory (default 'artifacts/kb')
 *   maxFixAttempts?: number,       // bounded fix loop for the resolution gate (default 2)
 *   kipEnabled?: boolean,          // recall + assert ticket knowledge via kip (default true)
 *   kipDir?: string,               // kip store directory (default '.a5c/kip')
 *   kipModel?: string              // model for kip structured paths (default 'sonnet')
 * }
 * @outputs {
 *   success: boolean,
 *   classification: object,        // { category, productArea, sentiment, summary, structuredFacts, candidateKnownIssues, openQuestions }
 *   triage: object,                // { severity, priority, queue, slaTarget, ambiguous, ambiguityResolution? }
 *   investigation: object,         // { repro, knowledge, accountContext }
 *   resolution: object,            // { resolutionPath, replyDraft, remediation {monetary, kind?, amount?}, rootCause }
 *   resolutionGate: object,        // { passed, issues[], evidence[], attempts, escalated }
 *   gatedActions: object,          // { sendCustomerReply, issueRefundOrCredit, publishKbArticle } each { actionId, required, approved, autoApproved, response, executed }
 *   verification: object,          // { verified, evidence[], failures[], customerConfirmed }
 *   kbArticle: object,             // { articlePath, published }
 *   kipFactsAsserted: number,
 *   artifacts: array,
 *   metadata: object               // { processId, runId, ticketId, breakpointsHit, timings }
 * }
 * @graph
 *   domains: [domain:customer-experience, domain:business-operations]
 *   specializations: [specialization:customer-support]
 *   skillAreas: [skill-area:customer-success, skill-area:knowledge-management, skill-area:orchestration-loop]
 *   workflows: [workflow:customer-journey-optimization, workflow:user-feedback-loop]
 *   topics: [topic:quality-assurance]
 *   roles: [role:customer-success-manager, role:support-lead, role:knowledge-curator]
 * @policyGatedActions
 *   send-customer-reply (expert support-lead — any outbound customer message human-approved before send),
 *   issue-refund-or-credit (expert support-manager — monetary remediation, gated only when resolution.remediation.monetary === true),
 *   publish-kb-article (expert knowledge-manager). breakpointId equals actionId; tags ['policy-gated','customer-support'];
 *   fail-closed: executor task runs ONLY on approved===true; every outcome incl. non-interactive
 *   auto-approvals recorded in outputs.gatedActions.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
  gateFixerTask,
} from '../common-utilities/routed-gate-combinators.js';

// The ONLY remediation kinds the refund/credit policy gate accepts. A monetary
// remediation arriving with anything else is a drafting failure — the process
// throws BEFORE the refund breakpoint instead of defaulting (fallbacks are forbidden).
const ALLOWED_REMEDIATION_KINDS = ['refund', 'credit', 'comp'];

/**
 * Fail-closed audit record for one policy-gated action.
 * approved is strictly bpResult.approved === true; autoApproved is read from the
 * BreakpointResult's raw auto-approval marker fields (recorded raw — never inferred
 * from interactivity); response is bpResult.response ?? bpResult.feedback ?? null.
 * Skipped conditional gates are recorded as
 * { required:false, approved:false, autoApproved:false, executed:false } — never omitted.
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

// ---------------------------------------------------------------------------
// Phase 1 — Intake & classification
// ---------------------------------------------------------------------------

export const intakeClassifyTask = defineTask('cst.intake-classify', (args, taskCtx) => ({
  kind: 'agent',
  title: `Intake & classify ticket ${args.ticket.id}`,
  agent: {
    name: 'support-agent',
    prompt: {
      role: 'Support intake classifier',
      task: `Classify and structure the incoming support ticket '${args.ticket.id}'`,
      context: args,
      instructions: [
        'Classify: category (billing|technical|account|how-to|feature-request|complaint), product area, sentiment, language, customer-visible summary.',
        'Extract structured facts from the raw ticket body — never invent details absent from the ticket.',
        'Honor priorKnowledge: surface matching prior tickets as candidateKnownIssues.',
        'Flag missing info as openQuestions — do not block here.',
      ],
      outputFormat: 'JSON with category, productArea, sentiment, summary, structuredFacts array, candidateKnownIssues array, openQuestions array',
    },
    outputSchema: {
      type: 'object',
      required: ['category', 'summary', 'structuredFacts'],
      properties: {
        category: { type: 'string' },
        productArea: { type: 'string' },
        sentiment: { type: 'string' },
        summary: { type: 'string' },
        structuredFacts: { type: 'array' },
        candidateKnownIssues: { type: 'array' },
        openQuestions: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cst', 'customer-support', 'intake'],
}));

// ---------------------------------------------------------------------------
// Phase 2 — Severity/priority triage
// ---------------------------------------------------------------------------

export const triageTask = defineTask('cst.triage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Triage ticket ${args.ticket.id}`,
  agent: {
    name: 'support-triage-officer',
    prompt: {
      role: 'Severity and priority triage officer',
      task: `Assign severity, priority, and owning queue for ticket '${args.ticket.id}'`,
      context: args,
      instructions: [
        'Assign severity (sev1-sev4), priority (p1-p4), owning queue from classification, customer tier, impact scope.',
        'Set ambiguous:true with ambiguityReason ONLY when severity/ownership genuinely cannot be determined — the ambiguity breakpoint fires solely on this flag.',
        'Record the SLA target implied by severity.',
        'Never downgrade severity to avoid escalation paths.',
      ],
      outputFormat: 'JSON with severity, priority, queue, slaTarget, ambiguous boolean, ambiguityReason',
    },
    outputSchema: {
      type: 'object',
      required: ['severity', 'priority', 'queue', 'ambiguous'],
      properties: {
        severity: { type: 'string' },
        priority: { type: 'string' },
        queue: { type: 'string' },
        slaTarget: { type: 'string' },
        ambiguous: { type: 'boolean' },
        ambiguityReason: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cst', 'customer-support', 'triage'],
}));

// ---------------------------------------------------------------------------
// Phase 3 — Parallel investigation (repro, knowledge, account context)
// ---------------------------------------------------------------------------

export const reproInvestigationTask = defineTask('cst.investigate-repro', (args, taskCtx) => ({
  kind: 'agent',
  title: `Repro investigation for ticket ${args.ticket.id}`,
  agent: {
    name: 'support-investigator',
    prompt: {
      role: 'Issue reproduction investigator',
      task: `Attempt to reproduce the issue reported in ticket '${args.ticket.id}'`,
      context: args,
      instructions: [
        'Attempt to reproduce from ticket facts; execute the closest verifiable check available and record exactly what was run.',
        "reproduced is three-state: 'reproduced' | 'not-reproduced' | 'not-reproducible-here' (state what environment would be needed).",
        'Capture reproSteps and raw command/output excerpts as evidence for the gate reviewer to re-run.',
      ],
      outputFormat: 'JSON with reproduced, reproSteps array, evidence array (at least one entry), suspectedCause',
    },
    outputSchema: {
      type: 'object',
      required: ['reproduced', 'reproSteps', 'evidence'],
      properties: {
        reproduced: { type: 'string' },
        reproSteps: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
        suspectedCause: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cst', 'customer-support', 'investigation', 'repro'],
}));

export const knowledgeInvestigationTask = defineTask('cst.investigate-knowledge', (args, taskCtx) => ({
  kind: 'agent',
  title: `Knowledge investigation for ticket ${args.ticket.id}`,
  agent: {
    name: 'support-investigator',
    prompt: {
      role: 'KB and prior-resolution researcher',
      task: `Search the knowledge base and prior resolutions for ticket '${args.ticket.id}'`,
      context: args,
      instructions: [
        'Search kbDir and priorKnowledge for matching known issues, workarounds, prior resolutions.',
        'Rank by applicability to structuredFacts; cite source path/eid for every match — uncited matches are fabrications.',
        'Report kbGap:true when no applicable article exists (feeds KB-capture).',
      ],
      outputFormat: 'JSON with matches array, kbGap boolean, applicableWorkarounds array',
    },
    outputSchema: {
      type: 'object',
      required: ['matches', 'kbGap'],
      properties: {
        matches: { type: 'array' },
        kbGap: { type: 'boolean' },
        applicableWorkarounds: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cst', 'customer-support', 'investigation', 'knowledge'],
}));

export const accountContextTask = defineTask('cst.investigate-account-context', (args, taskCtx) => ({
  kind: 'agent',
  title: `Account context for ticket ${args.ticket.id}`,
  agent: {
    name: 'support-investigator',
    prompt: {
      role: 'Account-context analyst',
      task: `Assemble the customer account context for ticket '${args.ticket.id}'`,
      context: args,
      instructions: [
        'Assemble customer context from customerProfile: tier, tenure, open/recent tickets, health signals, churn risk, prior refunds/credits.',
        'Flag renewalRisk and standing commitments relevant to remediation decisions.',
        'Only report facts present in the profile — absent fields are unknown, never invented.',
      ],
      outputFormat: 'JSON with tier, tenure, recentTickets array, priorRemediations array, renewalRisk, contextSummary',
    },
    outputSchema: {
      type: 'object',
      required: ['tier', 'contextSummary'],
      properties: {
        tier: { type: 'string' },
        tenure: { type: 'string' },
        recentTickets: { type: 'array' },
        priorRemediations: { type: 'array' },
        renewalRisk: { type: 'string' },
        contextSummary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cst', 'customer-support', 'investigation', 'account'],
}));

// ---------------------------------------------------------------------------
// Phase 4 — Resolution drafting
// ---------------------------------------------------------------------------

export const resolutionDraftTask = defineTask('cst.resolution-draft', (args, taskCtx) => ({
  kind: 'agent',
  title: `Draft resolution for ticket ${args.ticket.id}`,
  agent: {
    name: 'support-resolution-author',
    prompt: {
      role: 'Resolution author',
      task: `Write the resolution document and customer reply draft for ticket '${args.ticket.id}'`,
      context: args,
      instructions: [
        `Write the resolution document (markdown) to ${args.artifactsDir}/resolution-${args.ticket.id}.md — it is the artifact the adversarial gate reviews.`,
        'Must contain: root cause, resolution steps, verification steps a reviewer can execute, and the customer replyDraft (plain, empathetic, commitment-accurate).',
        "Set remediation = { monetary: boolean, kind?: 'refund'|'credit'|'comp', amount?: number, rationale? } — monetary:true triggers the refund policy gate; never propose spend without a rationale grounded in accountContext.",
        'Ground every claim in the investigation results; open unknowns are stated, not papered over.',
      ],
      outputFormat: 'JSON with resolutionPath, replyDraft, remediation { monetary, kind, amount, rationale }, rootCause, verificationSteps array',
    },
    outputSchema: {
      type: 'object',
      required: ['resolutionPath', 'replyDraft', 'remediation', 'rootCause'],
      properties: {
        resolutionPath: { type: 'string' },
        replyDraft: { type: 'string' },
        remediation: {
          type: 'object',
          required: ['monetary'],
          properties: {
            monetary: { type: 'boolean' },
            kind: { type: 'string' },
            amount: { type: 'number' },
            rationale: { type: 'string' },
          },
        },
        rootCause: { type: 'string' },
        verificationSteps: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cst', 'customer-support', 'resolution'],
}));

// ---------------------------------------------------------------------------
// Phase 6 — Policy-gated executors (reply + refund/credit)
// Each executor is invoked ONLY after its routedBreakpoint approved === true.
// ---------------------------------------------------------------------------

export const sendCustomerReplyTask = defineTask('cst.send-customer-reply', (args, taskCtx) => ({
  kind: 'agent',
  title: `Send approved customer reply for ticket ${args.ticket.id}`,
  agent: {
    name: 'support-agent',
    prompt: {
      role: 'Customer-reply executor',
      task: `Send the human-approved reply for ticket '${args.ticket.id}'`,
      context: args,
      instructions: [
        'Execute the send of the HUMAN-APPROVED reply text exactly as approved (approver edits in the breakpoint response supersede the draft verbatim).',
        `Write the final sent message to ${args.artifactsDir}/reply-${args.ticket.id}.md; record channel and timestamp.`,
        'Runs ONLY after the send-customer-reply breakpoint approved — never restate or re-decide the approval.',
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
  labels: ['agent', 'cst', 'customer-support', 'policy-gated', 'reply'],
}));

export const issueRefundOrCreditTask = defineTask('cst.issue-refund-or-credit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved ${args.resolution.remediation.kind} for ticket ${args.ticket.id}`,
  agent: {
    name: 'support-agent',
    prompt: {
      role: 'Remediation executor',
      task: `Execute the human-approved monetary remediation for ticket '${args.ticket.id}'`,
      context: args,
      instructions: [
        'Execute/record the HUMAN-APPROVED monetary remediation exactly as approved (approver-adjusted amount supersedes the draft).',
        `Write the remediation record to ${args.artifactsDir}/remediation-${args.ticket.id}.json.`,
        'Runs ONLY after the issue-refund-or-credit breakpoint approved.',
      ],
      outputFormat: 'JSON with executed boolean, recordPath, kind, amount',
    },
    outputSchema: {
      type: 'object',
      required: ['executed', 'recordPath', 'kind', 'amount'],
      properties: {
        executed: { type: 'boolean' },
        recordPath: { type: 'string' },
        kind: { type: 'string' },
        amount: { type: 'number' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cst', 'customer-support', 'policy-gated', 'remediation'],
}));

// ---------------------------------------------------------------------------
// Phase 7 — Verification & close
// ---------------------------------------------------------------------------

export const verifyCloseTask = defineTask('cst.verify-close', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify & close ticket ${args.ticket.id}`,
  agent: {
    name: 'support-verifier',
    prompt: {
      role: 'Resolution verifier',
      task: `Verify the resolution of ticket '${args.ticket.id}' with executed evidence before close`,
      context: args,
      instructions: [
        "Execute the resolution document's verificationSteps and capture raw outputs — verification without executed evidence is invalid (no green-by-assertion).",
        'Confirm the reply was sent (read sentMessagePath) and, when remediation executed, confirm the record matches the approved amount/kind.',
        'verified:false with explicit failures when anything does not check out — record an unverified close honestly.',
        "Report customerConfirmed as 'confirmed' | 'pending' | 'not-applicable' based on available signals only.",
      ],
      outputFormat: 'JSON with verified boolean, evidence array (at least one entry), failures array, customerConfirmed',
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'evidence', 'failures'],
      properties: {
        verified: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
        failures: { type: 'array' },
        customerConfirmed: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cst', 'customer-support', 'verification', 'quality-gate'],
}));

// ---------------------------------------------------------------------------
// Phase 8 — KCS-style KB capture + policy-gated publish
// ---------------------------------------------------------------------------

export const kbArticleCaptureTask = defineTask('cst.kb-article-capture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Capture KB article for ticket ${args.ticket.id}`,
  agent: {
    name: 'knowledge-author',
    prompt: {
      role: 'KCS knowledge author',
      task: `Capture the resolution of ticket '${args.ticket.id}' as a KCS-style KB article draft`,
      context: args,
      instructions: [
        `Write a KCS-style article (problem, environment, root cause, resolution, verification) to ${args.kbDir}/drafts/<slug>.md.`,
        'When kbGap:false, instead propose an update diff to the existing matched article (updateOfPath).',
        'Strip all customer-identifying details — publishable to a customer-visible KB as-is.',
        'Recommend publish:true/false with a reason.',
      ],
      outputFormat: 'JSON with articlePath, updateOfPath, publishRecommended boolean, reason',
    },
    outputSchema: {
      type: 'object',
      required: ['articlePath', 'publishRecommended'],
      properties: {
        articlePath: { type: 'string' },
        updateOfPath: { type: 'string' },
        publishRecommended: { type: 'boolean' },
        reason: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cst', 'customer-support', 'kb', 'kcs'],
}));

export const publishKbArticleTask = defineTask('cst.publish-kb-article', (args, taskCtx) => ({
  kind: 'agent',
  title: `Publish approved KB article for ticket ${args.ticket.id}`,
  agent: {
    name: 'knowledge-author',
    prompt: {
      role: 'KB publisher',
      task: `Publish the human-approved KB article captured from ticket '${args.ticket.id}'`,
      context: args,
      instructions: [
        `Move/copy the HUMAN-APPROVED article from drafts to ${args.kbDir}/published/ (applying approver edits); report publishedPath.`,
        'Runs ONLY after the publish-kb-article breakpoint approved.',
      ],
      outputFormat: 'JSON with published boolean, publishedPath',
    },
    outputSchema: {
      type: 'object',
      required: ['published', 'publishedPath'],
      properties: {
        published: { type: 'boolean' },
        publishedPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cst', 'customer-support', 'policy-gated', 'kb'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    ticket,
    customerProfile = null,
    repoRoot = '.',
    kbDir = 'artifacts/kb',
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs || {};

  // No fallbacks: a ticket without an id and body is not workable.
  if (!ticket || !ticket.id || !ticket.body) {
    throw new Error('customer-support/ticket-lifecycle requires ticket with at least { id, body }.');
  }

  const startTime = ctx.now();
  const timings = {};
  const breakpointsHit = [];
  const artifactsDir = ctx.artifactsDir;
  const sharedArgs = { ticket, customerProfile, repoRoot, kbDir, kipDir, kipModel, artifactsDir };

  // Fail-closed audit surface — every policy-gated action lands here, including
  // skipped conditional gates and non-interactive auto-approvals. Never omitted.
  const gatedActions = {
    sendCustomerReply: recordGatedAction('send-customer-reply', false, null, false),
    issueRefundOrCredit: recordGatedAction('issue-refund-or-credit', false, null, false),
    publishKbArticle: recordGatedAction('publish-kb-article', false, null, false),
  };

  // Phase 0 — kip recall at intake (gated on kipEnabled): prior similar-ticket
  // resolutions thread as priorKnowledge into every later task. Empty store =
  // fresh brain, never an error.
  ctx.log?.('info', 'Phase 0: kip recall of prior similar-ticket knowledge');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      kipModel,
      kind: 'customer-support',
      topic: `similar support tickets: ${ticket.subject} ${ticket.body?.slice(0, 200) ?? ''}`,
    });
  }
  timings.kipRecall = ctx.now() - startTime;

  // Phase 1 — intake & classification.
  ctx.log?.('info', 'Phase 1: intake & classification');
  const classification = await ctx.task(intakeClassifyTask, { ...sharedArgs, priorKnowledge });
  timings.intake = ctx.now() - startTime;

  // Phase 2 — severity/priority triage. The ambiguity breakpoint fires ONLY on
  // triage.ambiguous === true; the approver response may override
  // severity/priority/queue and is always recorded as ambiguityResolution.
  ctx.log?.('info', 'Phase 2: severity/priority triage');
  let triage = await ctx.task(triageTask, { ...sharedArgs, classification, priorKnowledge });
  if (triage.ambiguous === true) {
    const ambiguity = await routedBreakpoint(ctx, {
      question: `Triage for ticket '${ticket.id}' is ambiguous: ${triage.ambiguityReason}. Confirm or override severity/priority/queue.`,
      title: 'Triage ambiguity',
      context: {
        runId: ctx.runId,
        summary: {
          classification,
          proposed: { severity: triage.severity, priority: triage.priority, queue: triage.queue, slaTarget: triage.slaTarget },
          ambiguityReason: triage.ambiguityReason,
        },
      },
    }, {
      breakpointId: 'customer-support.triage-ambiguity',
      expert: 'support-lead',
      tags: ['customer-support', 'triage-ambiguity'],
      strategy: 'single',
    });
    breakpointsHit.push('customer-support.triage-ambiguity');
    const ambiguityResolution = ambiguity.response ?? ambiguity.feedback ?? null;
    triage = { ...triage, ambiguityResolution };
    // Approver response may override severity/priority/queue (structured overrides only).
    if (ambiguityResolution && typeof ambiguityResolution === 'object') {
      for (const field of ['severity', 'priority', 'queue']) {
        if (ambiguityResolution[field]) triage[field] = ambiguityResolution[field];
      }
    }
  }
  timings.triage = ctx.now() - startTime;

  // Phase 3 — parallel investigation: repro, knowledge search, account context.
  ctx.log?.('info', 'Phase 3: parallel investigation (repro, knowledge, account context)');
  const invArgs = { ...sharedArgs, classification, triage, priorKnowledge };
  const [repro, knowledge, accountContext] = await ctx.parallel.all([
    () => ctx.task(reproInvestigationTask, invArgs),
    () => ctx.task(knowledgeInvestigationTask, invArgs),
    () => ctx.task(accountContextTask, invArgs),
  ]);
  const investigation = { repro, knowledge, accountContext };
  timings.investigation = ctx.now() - startTime;

  // Phase 4 — resolution drafting.
  ctx.log?.('info', 'Phase 4: resolution drafting');
  const resolution = await ctx.task(resolutionDraftTask, {
    ...sharedArgs, classification, triage, investigation, priorKnowledge,
  });
  // No fallbacks: a monetary remediation with an unknown kind is a drafting
  // failure — throw BEFORE any gate or customer contact, never default it.
  if (resolution.remediation.monetary === true && !ALLOWED_REMEDIATION_KINDS.includes(resolution.remediation.kind)) {
    throw new Error(
      `Monetary remediation carries unknown kind '${resolution.remediation.kind}'. ` +
      `Allowed kinds: ${ALLOWED_REMEDIATION_KINDS.join(', ')} — no default is applied.`
    );
  }
  timings.resolutionDraft = ctx.now() - startTime;

  // Phase 5 — adversarial resolution review via the imported adversarialGate
  // combinator (critic fan-out, bounded fixer loop, owner escalation come free).
  ctx.log?.('info', 'Phase 5: adversarial resolution review gate');
  const resolutionGate = await adversarialGate(ctx, {
    gateId: 'customer-support.resolution-review',
    artifact: { path: resolution.resolutionPath, description: 'Resolution draft + customer reply draft' },
    critics: [
      {
        name: 'resolution-accuracy-critic',
        role: 'Adversarial technical-resolution reviewer',
        focus: 'root cause and resolution steps are correct and the verification steps actually pass',
        instructions: [
          "IRON LAW: do NOT trust the drafting agent or the investigators. RE-EXECUTE the repro steps and the resolution's verificationSteps yourself and cite the raw outputs as evidence — a review that only reads the document is invalid.",
          'Check the root cause against the repro evidence; check every resolution step is actionable and sufficient.',
          'Any unverifiable claim in the resolution document is an issue, not a pass.',
        ],
      },
      {
        name: 'customer-communication-critic',
        role: 'Adversarial customer-communication reviewer',
        focus: 'replyDraft accuracy, tone, and commitment safety',
        instructions: [
          'Verify the replyDraft promises ONLY what the resolution document substantiates — every commitment must trace to a line you cite.',
          'Check remediation consistency: monetary language in the reply requires remediation.monetary===true and vice versa.',
          'Check tone, clarity, no internal/customer-identifying details leak.',
        ],
      },
    ],
    ironLaw: [
      'Evidence must include at least one EXECUTED check (re-run repro or verification command output) — file-read citations alone do not satisfy this gate.',
      'passed:true with an empty evidence array is a protocol failure (enforced by the combinator).',
    ],
    maxFixAttempts,
    fixer: { task: gateFixerTask }, // built-in fixer, referenced explicitly — it edits the resolution artifact
    context: { ticket, triage, investigation, resolution },
  });
  if (resolutionGate.escalated) {
    // The escalation breakpoint is raised internally by the combinator.
    breakpointsHit.push('customer-support.resolution-review.gate-escalation');
  }
  timings.resolutionGate = ctx.now() - startTime;

  if (!resolutionGate.passed) {
    // Fail closed: a failed resolution gate means NO customer contact — the
    // gated phases never run; all three gated actions stay recorded as skipped.
    return {
      success: false,
      classification,
      triage,
      investigation,
      resolution,
      resolutionGate,
      gatedActions,
      verification: null,
      kbArticle: null,
      kipFactsAsserted: 0,
      artifacts: [resolution.resolutionPath],
      metadata: {
        processId: 'customer-support/ticket-lifecycle',
        runId: ctx.runId,
        ticketId: ticket.id,
        breakpointsHit,
        timings,
        reason: 'Resolution-review gate failed (incl. escalation) — customer contact phases never run on a failed gate',
      },
    };
  }

  // Phase 6 — policy-gated customer reply + conditional refund/credit. Refund
  // breakpoint+execution first when applicable so the approved refund details
  // (or the rejection) fold into the reply breakpoint context. Executors are
  // strictly guarded by approved === true — fail closed, never worked around.
  ctx.log?.('info', 'Phase 6: policy-gated customer reply + refund/credit');
  let refundExecution = null;
  if (resolution.remediation.monetary === true) {
    const refundApproval = await routedBreakpoint(ctx, {
      question: `Approve ${resolution.remediation.kind} of ${resolution.remediation.amount} for ticket '${ticket.id}'? Rationale: ${resolution.remediation.rationale ?? 'see resolution document'}. Rejection records the decision and the reply proceeds without monetary language.`,
      title: 'Issue refund or credit',
      context: {
        runId: ctx.runId,
        files: [{ path: resolution.resolutionPath, label: 'Resolution document' }],
        summary: {
          remediation: resolution.remediation,
          accountContext: investigation.accountContext,
          triage: { severity: triage.severity, priority: triage.priority },
        },
      },
    }, {
      breakpointId: 'issue-refund-or-credit',
      expert: 'support-manager',
      tags: ['policy-gated', 'customer-support'],
      strategy: 'single',
    });
    breakpointsHit.push('issue-refund-or-credit');
    if (refundApproval.approved === true) {
      refundExecution = await ctx.task(issueRefundOrCreditTask, {
        ...sharedArgs,
        resolution,
        approvalResponse: refundApproval.response ?? refundApproval.feedback ?? null,
      });
    }
    gatedActions.issueRefundOrCredit = recordGatedAction(
      'issue-refund-or-credit', true, refundApproval, refundExecution ? refundExecution.executed === true : false
    );
  }

  const replyApproval = await routedBreakpoint(ctx, {
    question: `Send this reply to the customer for ticket '${ticket.id}'? Edits in your response supersede the draft verbatim. Rejection records the decision; the run continues to verify/close with sent=false surfaced honestly.`,
    title: 'Send customer reply',
    context: {
      runId: ctx.runId,
      files: [{ path: resolution.resolutionPath, label: 'Resolution document (contains replyDraft)' }],
      summary: {
        replyDraft: resolution.replyDraft,
        remediation: resolution.remediation,
        refundDecision: gatedActions.issueRefundOrCredit,
        resolutionGate: { passed: resolutionGate.passed, attempts: resolutionGate.attempts, escalated: resolutionGate.escalated },
      },
    },
  }, {
    breakpointId: 'send-customer-reply',
    expert: 'support-lead',
    tags: ['policy-gated', 'customer-support'],
    strategy: 'single',
  });
  breakpointsHit.push('send-customer-reply');
  let replyExecution = null;
  if (replyApproval.approved === true) {
    replyExecution = await ctx.task(sendCustomerReplyTask, {
      ...sharedArgs,
      resolution,
      approvedReplyResponse: replyApproval.response ?? replyApproval.feedback ?? null,
      refundDecision: gatedActions.issueRefundOrCredit,
    });
  }
  gatedActions.sendCustomerReply = recordGatedAction(
    'send-customer-reply', true, replyApproval, replyExecution ? replyExecution.sent === true : false
  );
  timings.gatedReplyAndRefund = ctx.now() - startTime;

  // Phase 7 — verification & close (executed evidence, honest unverified closes).
  ctx.log?.('info', 'Phase 7: verification & close');
  const verification = await ctx.task(verifyCloseTask, {
    ...sharedArgs,
    resolution,
    reply: replyExecution,
    remediation: refundExecution,
    gatedActions,
  });
  timings.verification = ctx.now() - startTime;

  // Phase 8 — KCS-style KB capture; publish is ALWAYS raised to a human after
  // capture (the author's recommendation rides in context — a human decides
  // even when the author recommends against publishing).
  ctx.log?.('info', 'Phase 8: KCS-style KB capture + gated publish');
  const kbCapture = await ctx.task(kbArticleCaptureTask, {
    ...sharedArgs, classification, resolution, investigation, verification,
  });
  const publishApproval = await routedBreakpoint(ctx, {
    question: `Publish the captured KB article for ticket '${ticket.id}'? Author recommends: ${kbCapture.publishRecommended ? 'publish' : 'do NOT publish'} (${kbCapture.reason ?? 'no reason given'}). Rejection leaves the draft in place.`,
    title: 'Publish KB article',
    context: {
      runId: ctx.runId,
      files: [{ path: kbCapture.articlePath, label: 'KB article draft' }],
      summary: {
        articlePath: kbCapture.articlePath,
        updateOfPath: kbCapture.updateOfPath,
        publishRecommended: kbCapture.publishRecommended,
        reason: kbCapture.reason,
      },
    },
  }, {
    breakpointId: 'publish-kb-article',
    expert: 'knowledge-manager',
    tags: ['policy-gated', 'customer-support'],
    strategy: 'single',
  });
  breakpointsHit.push('publish-kb-article');
  let publishExecution = null;
  if (publishApproval.approved === true) {
    publishExecution = await ctx.task(publishKbArticleTask, {
      ...sharedArgs,
      kbCapture,
      approvalResponse: publishApproval.response ?? publishApproval.feedback ?? null,
    });
  }
  gatedActions.publishKbArticle = recordGatedAction(
    'publish-kb-article', true, publishApproval, publishExecution ? publishExecution.published === true : false
  );
  const kbArticle = {
    articlePath: kbCapture.articlePath,
    published: publishExecution ? publishExecution.published === true : false,
  };
  timings.kbCapture = ctx.now() - startTime;

  // Phase 9 — kip assert at close: root cause, resolution pattern, refund
  // decision, gate outcome, KB decision. Assert failures are reported by the
  // librarian task, never swallowed.
  ctx.log?.('info', 'Phase 9: kip assert of ticket-lifecycle knowledge');
  let kipFactsAsserted = 0;
  if (kipEnabled) {
    const capture = await kipAssert(ctx, {
      kipDir,
      kipModel,
      kind: 'customer-support',
      facts: [
        {
          subject: `ticket:${ticket.id}`,
          predicate: 'has-root-cause',
          object: String(resolution.rootCause),
          props: { category: classification.category, severity: triage.severity },
        },
        {
          subject: `ticket:${ticket.id}`,
          predicate: 'resolved-by-pattern',
          object: resolution.resolutionPath,
          props: { resolutionPath: resolution.resolutionPath, verified: verification.verified === true },
        },
        {
          subject: `ticket:${ticket.id}`,
          predicate: 'refund-decision',
          object: 'issue-refund-or-credit',
          props: {
            required: gatedActions.issueRefundOrCredit.required,
            approved: gatedActions.issueRefundOrCredit.approved,
            autoApproved: gatedActions.issueRefundOrCredit.autoApproved,
            amount: resolution.remediation.amount ?? null,
          },
        },
        {
          subject: `ticket:${ticket.id}`,
          predicate: 'gate-outcome',
          object: 'customer-support.resolution-review',
          props: { passed: resolutionGate.passed, attempts: resolutionGate.attempts, escalated: resolutionGate.escalated },
        },
        {
          subject: `ticket:${ticket.id}`,
          predicate: 'kb-decision',
          object: kbCapture.articlePath,
          props: { published: kbArticle.published, publishRecommended: kbCapture.publishRecommended === true },
        },
      ],
    });
    kipFactsAsserted = capture.asserted;
  }
  timings.kipAssert = ctx.now() - startTime;

  const artifacts = [resolution.resolutionPath];
  if (replyExecution?.sentMessagePath) artifacts.push(replyExecution.sentMessagePath);
  if (refundExecution?.recordPath) artifacts.push(refundExecution.recordPath);
  artifacts.push(kbCapture.articlePath);
  if (publishExecution?.publishedPath) artifacts.push(publishExecution.publishedPath);

  return {
    success:
      resolutionGate.passed &&
      gatedActions.sendCustomerReply.executed &&
      verification.verified &&
      (!resolution.remediation.monetary ||
        gatedActions.issueRefundOrCredit.approved === gatedActions.issueRefundOrCredit.executed),
    classification,
    triage,
    investigation,
    resolution: {
      resolutionPath: resolution.resolutionPath,
      replyDraft: resolution.replyDraft,
      remediation: resolution.remediation,
      rootCause: resolution.rootCause,
    },
    resolutionGate,
    gatedActions,
    verification,
    kbArticle,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'customer-support/ticket-lifecycle',
      runId: ctx.runId,
      ticketId: ticket.id,
      breakpointsHit,
      timings: { ...timings, total: ctx.now() - startTime },
    },
  };
}
