/**
 * @process communication/multi-audience-announcement-pipeline
 * @description Flagship end-to-end governed announcement pipeline: source-material
 *   intake -> single canonical fact sheet -> parallel per-audience variants
 *   (internal, customers, press, partners) drafted from that one fact sheet ->
 *   adversarial claim-trace/tone/cross-audience-drift gate with executed evidence ->
 *   per-audience routed approvals (frozen audience->expert map) -> policy-gated
 *   multi-channel sends -> delivery confirmation. All human approvals are
 *   routedBreakpoints; kip recall at intake and assert at close (kind 'communication').
 *   One audience's rejection never blocks the others.
 * @inputs {
 *   announcement: object,          // required — { id, title, sourceMaterials: array (briefs, docs, decision records, links), embargoUntil?, sensitiveTopics? }
 *   channels?: object,             // per-audience channel hints, e.g. { internal:'slack', customers:'email', press:'newsroom', partners:'discord' } (default: internal slack, others email); drives which channel-manager persona the send executor emulates
 *   priorStatementsDir?: string,   // directory of prior public statements to cross-check (default 'artifacts/announcements/published')
 *   maxFixAttempts?: number,       // bounded fix loop for the accuracy gate (default 2)
 *   kipEnabled?: boolean,          // recall + assert announcement knowledge via kip (default true)
 *   kipDir?: string,               // kip store directory (default '.a5c/kip')
 *   kipModel?: string              // model for kip structured paths (default 'sonnet')
 * }
 * @outputs {
 *   success: boolean,              // gate passed AND every approved audience send executed AND delivery confirmed for executed sends
 *   factSheet: object,             // { factSheetPath, claimCount, priorStatementsIndexed }
 *   variants: object,              // { internal|customers|press|partners: { variantPath, headline, channel } }
 *   accuracyGate: object,          // { passed, issues[], evidence[], attempts, escalated, claimTracePath }
 *   gatedActions: object,          // { internalBroadcast, externalCommsSend, pressReleasePublish } each { actionId, required, approved, autoApproved, response, executed }
 *   deliveries: object,            // per-audience { sent, sentAt, channel, deliveryRecordPath } or null when not approved
 *   confirmation: object,          // { confirmed, evidence[], failures[] }
 *   kipFactsAsserted: number,
 *   artifacts: array,
 *   metadata: object               // { processId:'communication/multi-audience-announcement-pipeline', runId, announcementId, breakpointsHit, timings }
 * }
 * @graph
 *   domains: [domain:business-operations]
 *   specializations: [specialization:communication]
 *   skillAreas: [skill-area:community-management, skill-area:content-marketing, skill-area:knowledge-management, skill-area:orchestration-loop]
 *   workflows: [workflow:user-feedback-loop]
 *   topics: [topic:quality-assurance, topic:developer-experience]
 *   roles: [role:engineering-manager, role:technical-writer, role:tech-lead]
 * @policyGatedActions
 *   external-comms-send (expert comms-lead — one gate covering the customers AND partners
 *   variants; both drafts in breakpoint context), internal-broadcast (expert exec-sponsor —
 *   company-wide internal announcement), press-release-publish (expert comms-lead — public
 *   press variant). breakpointId equals actionId; tags ['policy-gated','communication'];
 *   strategy 'single'; fail-closed: each send executor runs ONLY on approved===true; every
 *   outcome incl. non-interactive auto-approvals recorded in outputs.gatedActions; rejection
 *   of one audience never blocks the others (independently gated).
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
  gateFixerTask,
} from '../common-utilities/routed-gate-combinators.js';

// Canonical audience set; drives ctx.parallel fan-out order and output keying.
const AUDIENCES = Object.freeze(['internal', 'customers', 'press', 'partners']);

// Frozen audience->accountable-expert routing map.
const AUDIENCE_EXPERTS = Object.freeze({ internal: 'exec-sponsor', customers: 'comms-lead', press: 'comms-lead', partners: 'comms-lead' });

// Frozen audience->policy-gated actionId map. customers+partners share the
// external-comms-send gate (one breakpoint covering both variants); press has
// its own publish gate; internal its own broadcast gate.
const AUDIENCE_ACTIONS = Object.freeze({ internal: 'internal-broadcast', customers: 'external-comms-send', partners: 'external-comms-send', press: 'press-release-publish' });

/**
 * Throwing lookup — an unknown audience is a process-definition failure,
 * never a silent default (fallbacks are forbidden).
 */
export function expertFor(audience) {
  const expert = AUDIENCE_EXPERTS[audience];
  if (!expert) {
    throw new Error(`No approval expert is mapped for audience '${audience}'. Known audiences: ${AUDIENCES.join(', ')} - routing is never defaulted (fallbacks are forbidden).`);
  }
  return expert;
}

/**
 * Throwing lookup over AUDIENCE_ACTIONS — sibling of expertFor.
 */
export function actionFor(audience) {
  const actionId = AUDIENCE_ACTIONS[audience];
  if (!actionId) {
    throw new Error(`No policy-gated action is mapped for audience '${audience}'. Known audiences: ${AUDIENCES.join(', ')} - routing is never defaulted (fallbacks are forbidden).`);
  }
  return actionId;
}

/**
 * Fail-closed audit record for one policy-gated action.
 * approved is strictly bpResult.approved === true; autoApproved is read from the
 * BreakpointResult's raw auto-approval marker fields (recorded raw — never inferred
 * from interactivity); response is bpResult.response ?? bpResult.feedback ?? null.
 * Skipped gates are recorded as
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
// Phase 1 — Source-material intake
// ---------------------------------------------------------------------------

export const intakeTask = defineTask('aap.intake', (args, taskCtx) => ({
  kind: 'agent',
  title: `Source-material intake for announcement ${args.announcement.id}`,
  agent: {
    name: 'comms-intake-analyst',
    prompt: {
      role: 'Announcement source-material analyst',
      task: `Normalize and inventory the source materials for announcement '${args.announcement.id}'`,
      context: args,
      instructions: [
        'Inventory every source material (type, path/ref, summary) - never invent materials not provided.',
        'Extract announcement scope, key messages, embargo constraints, and sensitiveTopics (merge announcement.sensitiveTopics with topics surfaced from materials and priorKnowledge).',
        'Flag missing info as openQuestions - do not block here.',
      ],
      outputFormat: 'JSON with scope, keyMessages array, materialsIndex array, embargoConstraints, sensitiveTopics array, openQuestions array',
    },
    outputSchema: {
      type: 'object',
      required: ['scope', 'keyMessages', 'materialsIndex'],
      properties: {
        scope: { type: 'string' },
        keyMessages: { type: 'array' },
        materialsIndex: { type: 'array' },
        embargoConstraints: { type: 'string' },
        sensitiveTopics: { type: 'array' },
        openQuestions: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'aap', 'communication', 'intake'],
}));

// ---------------------------------------------------------------------------
// Phase 2 — Fact-sheet compilation
// ---------------------------------------------------------------------------

export const factSheetTask = defineTask('aap.fact-sheet', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compile fact sheet for announcement ${args.announcement.id}`,
  agent: {
    name: 'comms-fact-compiler',
    prompt: {
      role: 'Canonical fact-sheet compiler',
      task: `Compile THE single canonical fact sheet for announcement '${args.announcement.id}'`,
      context: args,
      instructions: [
        `Write the canonical fact sheet to ${args.artifactsDir}/fact-sheet-${args.announcement.id}.md - numbered claims F1..Fn, each with a source citation into materialsIndex; uncited claims are fabrications.`,
        'Include the approved-numbers table, the sensitive/prohibited-topics list, and a prior-public-statements register from priorStatementsDir + priorKnowledge (statement, where, when).',
        'This file is the single source of truth every variant drafts from and the gate traces against.',
      ],
      outputFormat: 'JSON with factSheetPath, claimCount number, claims array, priorStatementsIndexed number',
    },
    outputSchema: {
      type: 'object',
      required: ['factSheetPath', 'claimCount', 'priorStatementsIndexed'],
      properties: {
        factSheetPath: { type: 'string' },
        claimCount: { type: 'number' },
        claims: { type: 'array' },
        priorStatementsIndexed: { type: 'number' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'aap', 'communication', 'fact-sheet'],
}));

// ---------------------------------------------------------------------------
// Phase 3 — Per-audience variant drafting (single parametrized task, fanned
// out 4x via ctx.parallel.all)
// ---------------------------------------------------------------------------

export const draftVariantTask = defineTask('aap.draft-variant', (args, taskCtx) => ({
  kind: 'agent',
  title: `Draft ${args.audience} variant for ${args.announcement.id}`,
  agent: {
    name: 'comms-variant-writer',
    prompt: {
      role: 'Audience-variant announcement writer',
      task: `Draft the '${args.audience}' variant of announcement '${args.announcement.id}' for the '${args.channel}' channel`,
      context: args,
      instructions: [
        'Compose the communication/content-writer persona by name: brief (audience/purpose/channel) -> plan (headline, structure) -> draft, tuned to the target audience and channel.',
        'Draft ONLY from the fact sheet: every factual statement carries an inline claim-id citation [F<n>]; a statement with no claim id must not appear.',
        'Respect audience register: internal (candid, context-rich), customers (benefit-led, plain), press (quotable, headline+boilerplate), partners (co-marketing framing, mutual-value).',
        `Write the variant to ${args.artifactsDir}/variant-${args.audience}-${args.announcement.id}.md; never introduce numbers, dates, or commitments absent from the fact sheet.`,
      ],
      outputFormat: 'JSON with variantPath, headline, audience, channel, claimIdsUsed array',
    },
    outputSchema: {
      type: 'object',
      required: ['variantPath', 'headline', 'audience'],
      properties: {
        variantPath: { type: 'string' },
        headline: { type: 'string' },
        audience: { type: 'string' },
        channel: { type: 'string' },
        claimIdsUsed: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'aap', 'communication', 'draft'],
}));

// ---------------------------------------------------------------------------
// Phase 6 — Policy-gated send executors
// Each executor is invoked ONLY after its routedBreakpoint approved === true.
// ---------------------------------------------------------------------------

export const sendInternalBroadcastTask = defineTask('aap.send-internal-broadcast', (args, taskCtx) => ({
  kind: 'agent',
  title: `Send approved internal broadcast for ${args.announcement.id}`,
  agent: {
    name: 'comms-send-executor',
    prompt: {
      role: 'Internal-broadcast executor',
      task: `Send the human-approved internal announcement '${args.announcement.id}'`,
      context: args,
      instructions: [
        'Runs ONLY after the internal-broadcast breakpoint approved - never restate or re-decide the approval.',
        'Send the HUMAN-APPROVED internal variant exactly as approved (approver edits in the breakpoint response supersede the draft verbatim) via the channel persona named for the internal channel (slack-manager persona for slack; discord-manager persona for discord).',
        `Write the sent record to ${args.artifactsDir}/sent-internal-${args.announcement.id}.md with final text, channel, sentAt.`,
      ],
      outputFormat: 'JSON with sent boolean, deliveryRecordPath, channel, sentAt',
    },
    outputSchema: {
      type: 'object',
      required: ['sent', 'deliveryRecordPath'],
      properties: {
        sent: { type: 'boolean' },
        deliveryRecordPath: { type: 'string' },
        channel: { type: 'string' },
        sentAt: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'aap', 'communication', 'policy-gated', 'send'],
}));

export const sendExternalAudienceTask = defineTask('aap.send-external-audience', (args, taskCtx) => ({
  kind: 'agent',
  title: `Send approved ${args.audience} announcement for ${args.announcement.id}`,
  agent: {
    name: 'comms-send-executor',
    prompt: {
      role: 'External-audience send executor',
      task: `Send the human-approved '${args.audience}' announcement '${args.announcement.id}'`,
      context: args,
      instructions: [
        'Runs ONLY after the external-comms-send breakpoint approved.',
        `Send the HUMAN-APPROVED variant for '${args.audience}' exactly as approved via the named channel persona for that audience's channel (slack-manager persona for slack, discord-manager persona for discord, plain email agent otherwise).`,
        `Write the sent record to ${args.artifactsDir}/sent-${args.audience}-${args.announcement.id}.md with final text, channel, sentAt.`,
      ],
      outputFormat: 'JSON with sent boolean, deliveryRecordPath, audience, channel, sentAt',
    },
    outputSchema: {
      type: 'object',
      required: ['sent', 'deliveryRecordPath', 'audience'],
      properties: {
        sent: { type: 'boolean' },
        deliveryRecordPath: { type: 'string' },
        audience: { type: 'string' },
        channel: { type: 'string' },
        sentAt: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'aap', 'communication', 'policy-gated', 'send'],
}));

export const publishPressReleaseTask = defineTask('aap.publish-press-release', (args, taskCtx) => ({
  kind: 'agent',
  title: `Publish approved press release for ${args.announcement.id}`,
  agent: {
    name: 'comms-send-executor',
    prompt: {
      role: 'Press-release publish executor',
      task: `Publish the human-approved press release for announcement '${args.announcement.id}'`,
      context: args,
      instructions: [
        'Runs ONLY after the press-release-publish breakpoint approved.',
        'Publish the HUMAN-APPROVED press variant exactly as approved to the newsroom/press channel; honor embargoUntil - publishing before the embargo is a failure, not a retry.',
        `Write the publish record to ${args.artifactsDir}/sent-press-${args.announcement.id}.md with final text, channel, sentAt.`,
      ],
      outputFormat: 'JSON with sent boolean, deliveryRecordPath, publishedUrl, sentAt',
    },
    outputSchema: {
      type: 'object',
      required: ['sent', 'deliveryRecordPath'],
      properties: {
        sent: { type: 'boolean' },
        deliveryRecordPath: { type: 'string' },
        publishedUrl: { type: 'string' },
        sentAt: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'aap', 'communication', 'policy-gated', 'send'],
}));

// ---------------------------------------------------------------------------
// Phase 7 — Delivery confirmation
// ---------------------------------------------------------------------------

export const confirmDeliveryTask = defineTask('aap.confirm-delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Confirm deliveries for announcement ${args.announcement.id}`,
  agent: {
    name: 'comms-delivery-verifier',
    prompt: {
      role: 'Delivery-confirmation verifier',
      task: `Verify every executed send for announcement '${args.announcement.id}' with executed evidence`,
      context: args,
      instructions: [
        'EXECUTE the checks: read every delivery record for executed sends and diff the sent text against the approved variant (with approver edits applied) - confirmation without executed evidence is invalid (no green-by-assertion).',
        'Verify NO sent record exists for any audience whose gate was not approved (fail-closed audit check).',
        'confirmed:false with explicit failures[] when anything mismatches - record an unconfirmed close honestly.',
      ],
      outputFormat: 'JSON with confirmed boolean, evidence array (at least one entry), failures array',
    },
    outputSchema: {
      type: 'object',
      required: ['confirmed', 'evidence', 'failures'],
      properties: {
        confirmed: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
        failures: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'aap', 'communication', 'verification', 'quality-gate'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    announcement,
    channels = null,
    priorStatementsDir = 'artifacts/announcements/published',
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs || {};

  // Phase 0 — validation. No fallbacks: an announcement without an id and
  // source materials is not workable.
  if (!announcement || !announcement.id || !Array.isArray(announcement.sourceMaterials) || announcement.sourceMaterials.length === 0) {
    throw new Error('multi-audience-announcement-pipeline requires announcement with { id, title, sourceMaterials[] }.');
  }

  // Channel resolution: default internal slack, others email; an unknown
  // audience key in channels is a caller bug — throw, never ignore.
  const effectiveChannels = { internal: 'slack', customers: 'email', press: 'email', partners: 'email' };
  for (const key of Object.keys(channels ?? {})) {
    if (!AUDIENCES.includes(key)) {
      throw new Error(`channels supplies unknown audience '${key}'. Known audiences: ${AUDIENCES.join(', ')} - unknown keys are never silently ignored.`);
    }
    effectiveChannels[key] = channels[key];
  }
  const channelFor = (audience) => {
    const channel = effectiveChannels[audience];
    if (!channel) {
      throw new Error(`No channel is resolved for audience '${audience}'. Known audiences: ${AUDIENCES.join(', ')}.`);
    }
    return channel;
  };

  const startTime = ctx.now();
  const timings = {};
  const breakpointsHit = [];
  const artifactsDir = ctx.artifactsDir;
  const sharedArgs = { announcement, priorStatementsDir, kipDir, kipModel, artifactsDir };
  const claimTracePath = `${artifactsDir}/claim-trace-${announcement.id}.md`;

  // Fail-closed audit surface — every policy-gated action lands here, including
  // skipped gates on the failed-gate early return. Never omitted.
  const gatedActions = {
    internalBroadcast: recordGatedAction('internal-broadcast', false, null, false),
    externalCommsSend: recordGatedAction('external-comms-send', false, null, false),
    pressReleasePublish: recordGatedAction('press-release-publish', false, null, false),
  };

  // Phase 0 (cont.) — kip recall (gated on kipEnabled): prior announcements,
  // messaging precedents, and sensitive topics thread as priorKnowledge into
  // every later task. Empty store = fresh brain, never an error.
  ctx.log?.('info', 'Phase 0: kip recall of prior announcement knowledge');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      kipModel,
      kind: 'communication',
      topic: `prior announcements, messaging precedents, sensitive topics: ${announcement.title}`,
    });
  }
  timings.kipRecall = ctx.now() - startTime;

  // Phase 1 — source-material intake.
  ctx.log?.('info', 'Phase 1: source-material intake');
  const intake = await ctx.task(intakeTask, { ...sharedArgs, priorKnowledge });
  timings.intake = ctx.now() - startTime;

  // Phase 2 — fact-sheet compilation: THE single source of truth every variant
  // drafts from and the accuracy gate traces against.
  ctx.log?.('info', 'Phase 2: fact-sheet compilation');
  const factSheet = await ctx.task(factSheetTask, { ...sharedArgs, intake, priorKnowledge });
  timings.factSheet = ctx.now() - startTime;

  // Phase 3 — parallel per-audience drafting from the SAME fact sheet.
  ctx.log?.('info', 'Phase 3: parallel per-audience variant drafting');
  const variantResults = await ctx.parallel.all(
    AUDIENCES.map((audience) => () =>
      ctx.task(draftVariantTask, {
        ...sharedArgs,
        audience,
        channel: channelFor(audience),
        factSheet,
        intake,
        priorKnowledge,
      })
    )
  );
  const variants = {};
  for (let i = 0; i < AUDIENCES.length; i++) {
    variants[AUDIENCES[i]] = variantResults[i];
  }
  timings.drafting = ctx.now() - startTime;

  // Phase 4 — adversarial tone/accuracy gate via the imported adversarialGate
  // combinator (critic fan-out, bounded fixer loop, owner escalation come free).
  ctx.log?.('info', 'Phase 4: adversarial tone/accuracy gate');
  const gateResult = await adversarialGate(ctx, {
    gateId: 'communication.announcement-accuracy',
    artifact: { path: factSheet.factSheetPath, description: 'Fact sheet + 4 audience variants (variant paths in context)' },
    critics: [
      {
        name: 'claim-trace-critic',
        role: 'Adversarial claim-by-claim accuracy auditor',
        focus: 'every factual claim in EVERY variant traces to a fact-sheet claim id',
        instructions: [
          `IRON LAW: do NOT trust the drafting agents. RE-EXTRACT every factual claim from each of the four variant files yourself and build the claim-trace table ${claimTracePath} (variant, quoted claim, matched fact-sheet id or NONE) - a review that only reads summaries is invalid.`,
          'Any claim with no fact-sheet id, or contradicting its cited claim, is an issue, not a pass.',
          'Cite the trace table path and raw excerpts as evidence.',
        ],
      },
      {
        name: 'tone-audience-critic',
        role: 'Adversarial tone and audience-fit reviewer',
        focus: 'register, clarity, ambiguity, sensitive-topic handling per audience',
        instructions: [
          "Apply the communication/content-validator persona's five axes (clarity, audience-flip, ambiguity, metaphors, consistency) to each variant for ITS audience.",
          'Verify sensitive/prohibited topics from the fact sheet appear in no variant; internal-only context leaking into external variants is a blocker.',
          'Every issue carries a concrete before/after rewrite.',
        ],
      },
      {
        name: 'cross-audience-drift-critic',
        role: 'Adversarial cross-audience consistency auditor',
        focus: 'the four variants and prior public statements never disagree on any fact',
        instructions: [
          'Diff the SAME underlying facts (numbers, dates, names, commitments) across all four variants - any cross-audience factual drift (e.g. a date in press differing from customers) FAILS the gate.',
          'Cross-check every externally visible claim against the prior-public-statements register and priorStatementsDir files; contradictions with prior statements are issues unless the fact sheet explicitly supersedes them.',
          'Executed evidence: cite the exact conflicting excerpts from the variant files you read.',
        ],
      },
    ],
    ironLaw: [
      'Evidence must include the EXECUTED claim-trace table built by re-extracting claims from the variant files - summary-level review does not satisfy this gate.',
      'passed:true with an empty evidence array is a protocol failure (enforced by the combinator).',
      'Any single cross-audience factual drift or untraceable claim fails the gate regardless of other scores.',
    ],
    maxFixAttempts,
    fixer: { task: gateFixerTask }, // built-in fixer, referenced explicitly — it edits the offending variant/fact-sheet artifacts
    context: { announcement, factSheet, variants, priorStatementsDir },
  });
  const accuracyGate = { ...gateResult, claimTracePath };
  if (accuracyGate.escalated) {
    // The escalation breakpoint is raised internally by the combinator.
    breakpointsHit.push('communication.announcement-accuracy.gate-escalation');
  }
  timings.accuracyGate = ctx.now() - startTime;

  if (!accuracyGate.passed) {
    // Fail closed: a failed accuracy gate means NO approvals and NO sends —
    // the gated phases never run; all three gated actions stay recorded as skipped.
    return {
      success: false,
      factSheet,
      variants,
      accuracyGate,
      gatedActions,
      deliveries: { internal: null, customers: null, press: null, partners: null },
      confirmation: null,
      kipFactsAsserted: 0,
      artifacts: [factSheet.factSheetPath, ...AUDIENCES.map((a) => variants[a].variantPath)],
      metadata: {
        processId: 'communication/multi-audience-announcement-pipeline',
        runId: ctx.runId,
        announcementId: announcement.id,
        breakpointsHit,
        timings,
        reason: 'Accuracy gate failed (incl. escalation) — approvals and sends never run on a failed gate',
      },
    };
  }

  // Phase 5 — per-audience routed approvals: three routedBreakpoints, one per
  // distinct actionId, expert resolved via the throwing expertFor() lookup on a
  // representative audience. Rejection of one audience records the decision and
  // never blocks the others.
  ctx.log?.('info', 'Phase 5: per-audience routed approvals');
  const gateSummary = { passed: accuracyGate.passed, attempts: accuracyGate.attempts, escalated: accuracyGate.escalated };

  const internalApproval = await routedBreakpoint(ctx, {
    question: `Approve the internal broadcast of announcement '${announcement.id}' to the whole company via ${variants.internal.channel ?? channelFor('internal')}? Edits in your response supersede the draft verbatim. Rejection records the decision without blocking the other audiences.`,
    title: 'Internal broadcast approval',
    context: {
      runId: ctx.runId,
      files: [
        { path: factSheet.factSheetPath, label: 'Fact sheet' },
        { path: variants.internal.variantPath, label: 'Internal variant' },
        { path: claimTracePath, label: 'Claim-trace table' },
      ],
      summary: {
        headline: variants.internal.headline,
        channel: channelFor('internal'),
        accuracyGate: gateSummary,
      },
    },
  }, {
    breakpointId: actionFor('internal'),
    expert: expertFor('internal'),
    tags: ['policy-gated', 'communication'],
    strategy: 'single',
  });
  breakpointsHit.push(actionFor('internal'));

  const externalApproval = await routedBreakpoint(ctx, {
    question: `Approve the external send of announcement '${announcement.id}'? This single approval covers BOTH external audiences: customers (via ${channelFor('customers')}) and partners (via ${channelFor('partners')}). Edits in your response supersede the drafts verbatim. Rejection records the decision without blocking the other audiences.`,
    title: 'External comms send approval',
    context: {
      runId: ctx.runId,
      files: [
        { path: factSheet.factSheetPath, label: 'Fact sheet' },
        { path: variants.customers.variantPath, label: 'Customers variant' },
        { path: variants.partners.variantPath, label: 'Partners variant' },
        { path: claimTracePath, label: 'Claim-trace table' },
      ],
      summary: {
        headlines: { customers: variants.customers.headline, partners: variants.partners.headline },
        channels: { customers: channelFor('customers'), partners: channelFor('partners') },
        accuracyGate: gateSummary,
      },
    },
  }, {
    breakpointId: actionFor('customers'),
    expert: expertFor('customers'),
    tags: ['policy-gated', 'communication'],
    strategy: 'single',
  });
  breakpointsHit.push(actionFor('customers'));

  const pressApproval = await routedBreakpoint(ctx, {
    question: `Approve publishing the press release for announcement '${announcement.id}' via ${channelFor('press')}? Embargo: ${announcement.embargoUntil ?? 'none'}. Edits in your response supersede the draft verbatim. Rejection records the decision without blocking the other audiences.`,
    title: 'Press release publish approval',
    context: {
      runId: ctx.runId,
      files: [
        { path: factSheet.factSheetPath, label: 'Fact sheet' },
        { path: variants.press.variantPath, label: 'Press variant' },
        { path: claimTracePath, label: 'Claim-trace table' },
      ],
      summary: {
        headline: variants.press.headline,
        channel: channelFor('press'),
        embargoUntil: announcement.embargoUntil ?? null,
        accuracyGate: gateSummary,
      },
    },
  }, {
    breakpointId: actionFor('press'),
    expert: expertFor('press'),
    tags: ['policy-gated', 'communication'],
    strategy: 'single',
  });
  breakpointsHit.push(actionFor('press'));
  timings.approvals = ctx.now() - startTime;

  // Phase 6 — policy-gated sends. Executors are strictly guarded by
  // approved === true — fail closed, never worked around. The single
  // external-comms-send approval covers both customers and partners executors.
  ctx.log?.('info', 'Phase 6: policy-gated sends');
  const deliveries = { internal: null, customers: null, press: null, partners: null };

  if (internalApproval.approved === true) {
    deliveries.internal = await ctx.task(sendInternalBroadcastTask, {
      ...sharedArgs,
      variant: variants.internal,
      channel: channelFor('internal'),
      approvalResponse: internalApproval.response ?? internalApproval.feedback ?? null,
    });
  }
  gatedActions.internalBroadcast = recordGatedAction(
    'internal-broadcast', true, internalApproval, deliveries.internal ? deliveries.internal.sent === true : false
  );

  if (externalApproval.approved === true) {
    const externalArgs = externalApproval.response ?? externalApproval.feedback ?? null;
    const [customersSend, partnersSend] = await ctx.parallel.all([
      () => ctx.task(sendExternalAudienceTask, {
        ...sharedArgs,
        audience: 'customers',
        variant: variants.customers,
        channel: channelFor('customers'),
        approvalResponse: externalArgs,
      }),
      () => ctx.task(sendExternalAudienceTask, {
        ...sharedArgs,
        audience: 'partners',
        variant: variants.partners,
        channel: channelFor('partners'),
        approvalResponse: externalArgs,
      }),
    ]);
    deliveries.customers = customersSend;
    deliveries.partners = partnersSend;
  }
  gatedActions.externalCommsSend = recordGatedAction(
    'external-comms-send', true, externalApproval,
    deliveries.customers?.sent === true && deliveries.partners?.sent === true
  );

  if (pressApproval.approved === true) {
    const pressSend = await ctx.task(publishPressReleaseTask, {
      ...sharedArgs,
      variant: variants.press,
      channel: channelFor('press'),
      embargoUntil: announcement.embargoUntil ?? null,
      approvalResponse: pressApproval.response ?? pressApproval.feedback ?? null,
    });
    deliveries.press = { ...pressSend, channel: pressSend.channel ?? channelFor('press') };
  }
  gatedActions.pressReleasePublish = recordGatedAction(
    'press-release-publish', true, pressApproval, deliveries.press ? deliveries.press.sent === true : false
  );
  timings.sends = ctx.now() - startTime;

  // Phase 7 — delivery confirmation with executed evidence: verify every
  // executed send matches the approved text and no unapproved audience was sent.
  ctx.log?.('info', 'Phase 7: delivery confirmation');
  const confirmation = await ctx.task(confirmDeliveryTask, {
    ...sharedArgs,
    factSheet,
    variants,
    deliveries,
    gatedActions,
  });
  timings.confirmation = ctx.now() - startTime;

  // Phase 8 — kip assert at close: what was announced where (with approval
  // provenance), the fact sheet, the gate outcome, and the messaging precedent.
  // Assert failures are reported by the librarian task, never swallowed.
  ctx.log?.('info', 'Phase 8: kip assert of announcement knowledge');
  let kipFactsAsserted = 0;
  if (kipEnabled) {
    const gatedFor = (audience) => {
      const actionId = actionFor(audience);
      const record = Object.values(gatedActions).find((a) => a.actionId === actionId);
      if (!record) {
        throw new Error(`No gatedActions record found for actionId '${actionId}' - the audit surface must cover every audience.`);
      }
      return record;
    };
    const capture = await kipAssert(ctx, {
      kipDir,
      kipModel,
      kind: 'communication',
      facts: [
        ...AUDIENCES.map((audience) => {
          const record = gatedFor(audience);
          return {
            subject: `announcement:${announcement.id}`,
            predicate: 'announced-to',
            object: audience,
            props: {
              channel: channelFor(audience),
              required: record.required,
              approved: record.approved,
              autoApproved: record.autoApproved,
              executed: record.executed,
              sentAt: deliveries[audience]?.sentAt ?? null,
            },
          };
        }),
        {
          subject: `announcement:${announcement.id}`,
          predicate: 'has-fact-sheet',
          object: factSheet.factSheetPath,
          props: { claimCount: factSheet.claimCount },
        },
        {
          subject: `announcement:${announcement.id}`,
          predicate: 'gate-outcome',
          object: 'communication.announcement-accuracy',
          props: { passed: accuracyGate.passed, attempts: accuracyGate.attempts, escalated: accuracyGate.escalated },
        },
        {
          subject: `announcement:${announcement.id}`,
          predicate: 'messaging-precedent',
          object: variants.press.headline,
          props: { sensitiveTopics: intake.sensitiveTopics ?? [] },
        },
      ],
    });
    kipFactsAsserted = capture.asserted;
  }
  timings.kipAssert = ctx.now() - startTime;

  const artifacts = [factSheet.factSheetPath, ...AUDIENCES.map((a) => variants[a].variantPath), claimTracePath];
  for (const audience of AUDIENCES) {
    if (deliveries[audience]?.deliveryRecordPath) artifacts.push(deliveries[audience].deliveryRecordPath);
  }

  return {
    success:
      accuracyGate.passed &&
      confirmation.confirmed &&
      Object.values(gatedActions).every((a) => !a.required || a.approved === a.executed),
    factSheet,
    variants,
    accuracyGate,
    gatedActions,
    deliveries,
    confirmation,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'communication/multi-audience-announcement-pipeline',
      runId: ctx.runId,
      announcementId: announcement.id,
      breakpointsHit,
      timings: { ...timings, total: ctx.now() - startTime },
    },
  };
}
