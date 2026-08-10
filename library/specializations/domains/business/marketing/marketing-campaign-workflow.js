/**
 * @process marketing/marketing-campaign-workflow
 * @description End-to-end marketing campaign lifecycle: brief consolidation -> kip recall of
 *   brand guidelines and prior campaign performance -> parallel per-channel content production
 *   (composing the marketing/ and digital-marketing/ point processes as callable stages) ->
 *   unified campaign package with a claims register -> adversarial brand/claims/legal review
 *   gate with executed evidence -> policy-gated claims-signoff, paid-spend-commit, and
 *   per-channel-batch campaign-publish -> monitored launch -> analytics retro with kip assert.
 *   All human approvals are routedBreakpoints.
 * @inputs {
 *   brief: object,                 // required — { name, objective, productFacts: array (required, the ONLY
 *                                  //   permissible source for external claims), targetAudience,
 *                                  //   channels: string[] (required non-empty, each in SUPPORTED_CHANNELS),
 *                                  //   budget?: { total?, paidMedia? }, timeline?, brandRefs?: string[] }
 *   repoRoot?: string,             // repository root the agents work in (default '.')
 *   artifactsHint?: string,        // optional hint threaded to agents about artifact conventions
 *   maxFixAttempts?: number,       // bounded fix loop for the review gate (default 2)
 *   publishBatchSize?: number,     // channels per campaign-publish approval batch (default 3)
 *   kipEnabled?: boolean,          // recall + assert campaign knowledge via kip (default true)
 *   kipDir?: string,               // kip store directory (default '.a5c/kip')
 *   kipModel?: string              // model for kip structured paths (default 'sonnet')
 * }
 * @outputs {
 *   success: boolean,
 *   strategy: object,              // { messaging, audienceSegments, channelPlans, claims, rejectedClaims, kpis, publishBatches }
 *   channelContent: object,        // per-channel { channel, assets[], claimsUsed[] }
 *   campaignPackage: object,       // { packagePath, claimsRegisterPath, publishBatches[] }
 *   reviewGate: object,            // { passed, issues[], evidence[], attempts, escalated }
 *   gatedActions: object,          // { claimsSignoff, paidSpendCommit, campaignPublish: { actionId, required,
 *                                  //   batches: [{ batchId, channels, approved, autoApproved, response, executed }] } }
 *   launch: object,                // { monitored, signals[], anomalies[] } (null when claims-signoff rejected)
 *   retro: object,                 // { performanceSummary, channelLearnings[], recommendations[] }
 *   kipFactsAsserted: number,
 *   artifacts: array,
 *   metadata: object               // { processId, runId, campaignName, breakpointsHit, timings }
 * }
 * @graph
 *   domains: [domain:business-operations]
 *   specializations: [specialization:marketing, specialization:digital-marketing]
 *   skillAreas: [skill-area:brand-management, skill-area:content-production, skill-area:marketing-analytics, skill-area:orchestration-loop]
 *   workflows: [workflow:campaign-execution, workflow:user-feedback-loop]
 *   topics: [topic:quality-assurance, topic:compliance]
 *   roles: [role:marketing-director, role:brand-legal-reviewer, role:content-marketer]
 * @policyGatedActions
 *   claims-signoff (expert brand-legal-reviewer — every externally-made product claim approved after the
 *   adversarial legal/brand gate; rejection blocks ALL publishing and spend),
 *   paid-spend-commit (expert marketing-director — paid-media budget commitment, gated only when the
 *   campaign includes paid channels or brief.budget.paidMedia > 0),
 *   campaign-publish (expert marketing-director — publish to external channels, raised once PER publish
 *   batch with the batch in context). breakpointId equals actionId; tags ['policy-gated','marketing'];
 *   fail-closed: executor tasks run ONLY on approved===true; every outcome including skipped conditional
 *   gates and non-interactive auto-approvals recorded in outputs.gatedActions.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
  gateFixerTask,
} from '../../../common-utilities/routed-gate-combinators.js';

// The ONLY channels this process publishes to. No fallbacks: a requested channel
// outside this list throws in Phase 0 with the allowed list in the message —
// never silently dropped or defaulted.
export const SUPPORTED_CHANNELS = Object.freeze([
  'email',
  'blog',
  'social-organic',
  'paid-social',
  'paid-search',
  'display',
  'video',
  'landing-page',
  'influencer',
]);

// Point-process files each channel's production task must follow as callable
// stages (threaded into the channel task prompt so producers execute those
// stage methodologies by name).
export const CHANNEL_STAGE_REFERENCES = Object.freeze({
  'email': Object.freeze(['digital-marketing/email-marketing-campaign.js', 'marketing/email-marketing-automation.js']),
  'blog': Object.freeze(['digital-marketing/blog-content-production.js', 'marketing/content-production-workflow.js', 'digital-marketing/keyword-seo-strategy.js']),
  'social-organic': Object.freeze(['digital-marketing/social-content-calendar.js', 'marketing/social-media-strategy-execution.js']),
  'paid-social': Object.freeze(['marketing/paid-social-advertising.js', 'digital-marketing/meta-ads-campaign.js']),
  'paid-search': Object.freeze(['digital-marketing/ppc-campaign-setup.js', 'marketing/sem-campaign-management.js']),
  'display': Object.freeze(['digital-marketing/programmatic-display.js']),
  'video': Object.freeze(['digital-marketing/video-content-production.js']),
  'landing-page': Object.freeze(['digital-marketing/landing-page-optimization.js']),
  'influencer': Object.freeze(['digital-marketing/influencer-campaign.js']),
});

// Channels whose presence (or a positive brief.budget.paidMedia) makes the
// paid-spend-commit gate required. Drives the conditional gate: required IFF
// the approved channel set intersects PAID_CHANNELS or brief.budget.paidMedia > 0.
export const PAID_CHANNELS = Object.freeze([
  'paid-social',
  'paid-search',
  'display',
  'influencer',
]);

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
// Phase 1 — Brief consolidation & channel strategy
// ---------------------------------------------------------------------------

export const campaignStrategyTask = defineTask('mcw.campaign-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Campaign strategy for '${args.brief.name}'`,
  agent: {
    name: 'marketing-strategist',
    prompt: {
      role: 'Campaign strategy lead',
      task: `Consolidate the brief into the campaign strategy for '${args.brief.name}'`,
      context: args,
      instructions: [
        'Consolidate the brief into a campaign strategy following the callable stage methodologies in this library: integrated-campaign-planning.js, campaign-creative-development.js, customer-persona-development.js, brand-positioning-development.js (execute their phase logic inline — do not merely cite them).',
        'Honor priorKnowledge: recalled brand guidelines and prior campaign performance constrain messaging and channel plans; contradictions with the brief are surfaced as risks, not silently resolved.',
        'Produce the claims list: every candidate external claim carries { claimId, text, productFactIndex } tracing to brief.productFacts. A claim you cannot trace goes in rejectedClaims with the reason — NEVER into claims.',
        `Group brief.channels into publishBatches of at most ${args.publishBatchSize}, preserving input order; assign batchId 'batch-1', 'batch-2', ... Report KPIs per objective.`,
      ],
      outputFormat: 'JSON with messaging object, audienceSegments array, channelPlans object (per requested channel), claims array [{claimId, text, productFactIndex}], rejectedClaims array, kpis array, publishBatches array [{batchId, channels}]',
    },
    outputSchema: {
      type: 'object',
      required: ['messaging', 'channelPlans', 'claims', 'publishBatches', 'kpis'],
      properties: {
        messaging: { type: 'object' },
        audienceSegments: { type: 'array' },
        channelPlans: { type: 'object' },
        claims: { type: 'array' },
        rejectedClaims: { type: 'array' },
        kpis: { type: 'array' },
        publishBatches: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mcw', 'marketing', 'strategy'],
}));

// ---------------------------------------------------------------------------
// Phase 2 — Parallel per-channel content production
// ---------------------------------------------------------------------------

export const channelContentTask = defineTask('mcw.channel-content', (args, taskCtx) => ({
  kind: 'agent',
  title: `Produce ${args.channel} content for '${args.brief.name}'`,
  agent: {
    name: 'channel-content-producer',
    prompt: {
      role: `Channel content producer (${args.channel})`,
      task: `Render the ${args.channel} channel assets for campaign '${args.brief.name}'`,
      context: args,
      instructions: [
        'Execute the callable stage methodologies for this channel as named in stageReferences (e.g. email -> digital-marketing/email-marketing-campaign.js + marketing/email-marketing-automation.js) — follow their production phases inline for this channel\'s deliverables.',
        `RENDER real asset files (copy, markdown/HTML creative specs, subject lines, ad variants, scripts) under ${args.artifactsDir}/channels/${args.channel}/ — the adversarial gate opens and reads these files; a described-but-unrendered asset is a failure.`,
        'Every product claim in any asset must be one of strategy.claims (reference its claimId in claimsUsed). Introducing a claim not in strategy.claims is forbidden — request it via proposedNewClaims instead (it will NOT ship this run).',
        'Stay within recalled brand guidelines (priorKnowledge); note deviations explicitly in brandNotes.',
      ],
      outputFormat: 'JSON with channel, assets array (minItems 1) [{path, type, description}], claimsUsed array of claimIds, proposedNewClaims array, brandNotes',
    },
    outputSchema: {
      type: 'object',
      required: ['channel', 'assets', 'claimsUsed'],
      properties: {
        channel: { type: 'string' },
        assets: { type: 'array', minItems: 1 },
        claimsUsed: { type: 'array' },
        proposedNewClaims: { type: 'array' },
        brandNotes: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mcw', 'marketing', 'content', 'channel'],
}));

// ---------------------------------------------------------------------------
// Phase 3 — Unified package merge + claims register
// ---------------------------------------------------------------------------

export const packageMergeTask = defineTask('mcw.package-merge', (args, taskCtx) => ({
  kind: 'agent',
  title: `Merge campaign package for '${args.brief.name}'`,
  agent: {
    name: 'campaign-packager',
    prompt: {
      role: 'Campaign package editor',
      task: `Merge the rendered channel assets of '${args.brief.name}' into the unified campaign package and claims register`,
      context: args,
      instructions: [
        `Write ${args.artifactsDir}/campaign-package.md: campaign summary, per-channel asset index (real file paths), publish batches, KPI table.`,
        `Write ${args.artifactsDir}/claims-register.md: one row per external claim actually present in a rendered asset — claim text, claimId, asset path(s), brief.productFacts index. Read every asset file to build this; do not trust producers' claimsUsed lists alone.`,
        'Report registerComplete:false with discrepancies[] when any asset contains a claim missing from strategy.claims or when claimsUsed entries do not appear in the asset — honest failure, no papering over.',
        'List consolidated proposedNewClaims for the claims-signoff approver\'s awareness.',
      ],
      outputFormat: 'JSON with packagePath, claimsRegisterPath, registerComplete boolean, discrepancies array, publishBatches array, proposedNewClaims array',
    },
    outputSchema: {
      type: 'object',
      required: ['packagePath', 'claimsRegisterPath', 'registerComplete', 'publishBatches'],
      properties: {
        packagePath: { type: 'string' },
        claimsRegisterPath: { type: 'string' },
        registerComplete: { type: 'boolean' },
        discrepancies: { type: 'array' },
        publishBatches: { type: 'array' },
        proposedNewClaims: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mcw', 'marketing', 'package'],
}));

// ---------------------------------------------------------------------------
// Phase 5 — Policy-gated executors (paid spend + per-batch publish)
// Each executor is invoked ONLY after its routedBreakpoint approved === true.
// ---------------------------------------------------------------------------

export const commitPaidSpendTask = defineTask('mcw.commit-paid-spend', (args, taskCtx) => ({
  kind: 'agent',
  title: `Commit approved paid-media spend for '${args.brief.name}'`,
  agent: {
    name: 'media-buyer',
    prompt: {
      role: 'Paid-spend executor',
      task: `Record the human-approved paid-media commitment for campaign '${args.brief.name}'`,
      context: args,
      instructions: [
        'Record the HUMAN-APPROVED paid-media commitment exactly as approved (approver-adjusted amounts/channel splits in the breakpoint response supersede the strategy draft verbatim).',
        `Write ${args.artifactsDir}/spend-commitment.json with per-channel amounts, total, approver provenance (approved/autoApproved), and timestamp.`,
        'Runs ONLY after the paid-spend-commit breakpoint approved === true — never restate or re-decide the approval.',
      ],
      outputFormat: 'JSON with committed boolean, recordPath, totalAmount, perChannel object',
    },
    outputSchema: {
      type: 'object',
      required: ['committed', 'recordPath', 'totalAmount'],
      properties: {
        committed: { type: 'boolean' },
        recordPath: { type: 'string' },
        totalAmount: { type: 'number' },
        perChannel: { type: 'object' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mcw', 'marketing', 'policy-gated', 'spend'],
}));

export const publishChannelBatchTask = defineTask('mcw.publish-channel-batch', (args, taskCtx) => ({
  kind: 'agent',
  title: `Publish approved batch ${args.batch.batchId} for '${args.brief.name}'`,
  agent: {
    name: 'campaign-publisher',
    prompt: {
      role: 'Channel publish executor',
      task: `Publish the human-approved batch ${args.batch.batchId} of campaign '${args.brief.name}'`,
      context: args,
      instructions: [
        'Publish the HUMAN-APPROVED batch exactly as approved (approver edits in the breakpoint response supersede drafts verbatim) — one publish record per channel in the batch.',
        `Write ${args.artifactsDir}/published/${args.batch.batchId}/<channel>.json per channel: final published content reference, destination, timestamp.`,
        'Runs ONLY after this batch\'s campaign-publish breakpoint approved === true. Publish ONLY channels in this batch — never opportunistically include others.',
        'Report per-channel published status honestly; a channel that could not be published is reported failed with the reason, never marked published.',
      ],
      outputFormat: 'JSON with batchId, published boolean (all channels succeeded), records array (minItems 1) [{channel, recordPath, published, reason?}]',
    },
    outputSchema: {
      type: 'object',
      required: ['batchId', 'published', 'records'],
      properties: {
        batchId: { type: 'string' },
        published: { type: 'boolean' },
        records: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mcw', 'marketing', 'policy-gated', 'publish'],
}));

// ---------------------------------------------------------------------------
// Phase 6 — Monitored launch
// ---------------------------------------------------------------------------

export const launchMonitorTask = defineTask('mcw.launch-monitor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monitor launch of '${args.brief.name}'`,
  agent: {
    name: 'launch-monitor',
    prompt: {
      role: 'Launch monitor',
      task: `Collect early post-publish signals for campaign '${args.brief.name}'`,
      context: args,
      instructions: [
        'For every published channel, READ the publish records and collect available early signals (delivery/visibility confirmations, early metrics, guardrail checks vs strategy KPIs) — executed reads, not assumptions.',
        `Write ${args.artifactsDir}/launch-monitor.md summarizing per-channel status and guardrail state.`,
        'Report anomalies honestly (missing records, guardrail breaches, unpublishable channels) — an anomaly-free report requires evidence for each channel checked.',
      ],
      outputFormat: 'JSON with monitored boolean, signals array, anomalies array, evidence array (minItems 1: paths/excerpts of records actually read), reportPath',
    },
    outputSchema: {
      type: 'object',
      required: ['monitored', 'signals', 'anomalies', 'evidence'],
      properties: {
        monitored: { type: 'boolean' },
        signals: { type: 'array' },
        anomalies: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
        reportPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mcw', 'marketing', 'launch', 'monitor'],
}));

// ---------------------------------------------------------------------------
// Phase 7 — Analytics retro
// ---------------------------------------------------------------------------

export const analyticsRetroTask = defineTask('mcw.analytics-retro', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analytics retro for '${args.brief.name}'`,
  agent: {
    name: 'marketing-analyst',
    prompt: {
      role: 'Campaign retro analyst',
      task: `Run the analytics retro for campaign '${args.brief.name}'`,
      context: args,
      instructions: [
        'Execute the retro following the callable stage methodologies campaign-performance-analysis.js, marketing-roi-analysis.js, and digital-marketing/attribution-measurement.js inline.',
        'Assess outcomes against brief.objective and strategy KPIs using the launch monitor report, publish records, spend commitment, and gatedActions — cite the files you actually read as evidence.',
        'Produce one channelLearnings entry per requested channel (published or not — unpublished channels yield process learnings), each durable enough to assert into kip for future campaigns.',
        'Report honestly: unmeasurable KPIs are reported unmeasurable with the reason, never estimated into success.',
      ],
      outputFormat: 'JSON with performanceSummary, channelLearnings array (minItems 1) [{channel, learning, published}], recommendations array, evidence array (minItems 1), reportPath',
    },
    outputSchema: {
      type: 'object',
      required: ['performanceSummary', 'channelLearnings', 'recommendations', 'evidence'],
      properties: {
        performanceSummary: { type: 'string' },
        channelLearnings: { type: 'array', minItems: 1 },
        recommendations: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
        reportPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mcw', 'marketing', 'retro', 'analytics'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    brief,
    repoRoot = '.',
    artifactsHint = null,
    maxFixAttempts = 2,
    publishBatchSize = 3,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs || {};

  // Phase 0 — no-fallbacks validation first: a brief without name, objective,
  // productFacts, and channels is not workable; nothing is defaulted.
  if (
    !brief ||
    !brief.name ||
    !brief.objective ||
    !Array.isArray(brief.productFacts) ||
    brief.productFacts.length === 0 ||
    !Array.isArray(brief.channels) ||
    brief.channels.length === 0
  ) {
    throw new Error(
      'marketing/marketing-campaign-workflow requires brief with at least ' +
      '{ name, objective, productFacts (non-empty array — the ONLY permissible source for external claims), channels (non-empty array) }.'
    );
  }
  const unsupportedChannels = brief.channels.filter((channel) => !SUPPORTED_CHANNELS.includes(channel));
  if (unsupportedChannels.length > 0) {
    throw new Error(
      `Unsupported channel(s) requested: ${unsupportedChannels.join(', ')}. ` +
      `Supported channels: ${SUPPORTED_CHANNELS.join(', ')} — ` +
      'unsupported channels are never silently dropped or defaulted (fallbacks are forbidden).'
    );
  }

  const startTime = ctx.now();
  const timings = {};
  const breakpointsHit = [];
  const artifactsDir = ctx.artifactsDir;
  const sharedArgs = { brief, repoRoot, artifactsHint, publishBatchSize, kipDir, kipModel, artifactsDir };

  // Fail-closed audit surface — every policy-gated action lands here, including
  // skipped conditional gates and non-interactive auto-approvals. Never omitted.
  // campaign-publish is per-batch under ONE breakpointId: every batch outcome
  // (approved, rejected, filtered-empty, skipped) is pushed into batches.
  const gatedActions = {
    claimsSignoff: recordGatedAction('claims-signoff', false, null, false),
    paidSpendCommit: recordGatedAction('paid-spend-commit', false, null, false),
    campaignPublish: { actionId: 'campaign-publish', required: false, batches: [] },
  };

  // Phase 0 — kip recall (gated on kipEnabled): brand guidelines, claim policies,
  // and prior campaign performance thread as priorKnowledge into strategy, every
  // channel producer, and all three critics. Empty store = fresh brain, never an error.
  ctx.log?.('info', 'Phase 0: validation + kip recall of brand guidelines and prior campaign performance');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      kipModel,
      kind: 'marketing',
      topic: `brand guidelines, claim policies, and prior campaign performance for: ${brief.name} ${brief.objective}`,
    });
  }
  timings.kipRecall = ctx.now() - startTime;

  // Phase 1 — brief consolidation & channel strategy.
  ctx.log?.('info', 'Phase 1: brief consolidation & channel strategy');
  const strategy = await ctx.task(campaignStrategyTask, { ...sharedArgs, priorKnowledge });
  timings.strategy = ctx.now() - startTime;

  // Phase 2 — parallel per-channel content production: one producer per requested
  // channel, each rendering real asset files under artifactsDir/channels/<channel>/.
  ctx.log?.('info', 'Phase 2: parallel per-channel content production');
  const channelResults = await ctx.parallel.all(
    brief.channels.map((channel) => () =>
      ctx.task(channelContentTask, {
        ...sharedArgs,
        channel,
        stageReferences: CHANNEL_STAGE_REFERENCES[channel],
        strategy,
        priorKnowledge,
      })
    )
  );
  const channelContent = {};
  for (const result of channelResults) {
    channelContent[result.channel] = result;
  }
  timings.channelContent = ctx.now() - startTime;

  // Phase 3 — unified package merge + claims register. The gate reviews the
  // register, so an incomplete register invalidates the gate: registerComplete
  // !== true throws (no fallbacks).
  ctx.log?.('info', 'Phase 3: unified package merge + claims register');
  const campaignPackage = await ctx.task(packageMergeTask, {
    ...sharedArgs, strategy, channelContent, priorKnowledge,
  });
  if (campaignPackage.registerComplete !== true) {
    throw new Error(
      `Claims register for campaign '${brief.name}' is incomplete ` +
      `(discrepancies: ${JSON.stringify(campaignPackage.discrepancies ?? [])}). ` +
      'The adversarial gate reviews the register, so an incomplete register invalidates the gate — no fallbacks.'
    );
  }
  timings.packageMerge = ctx.now() - startTime;

  // Phase 4 — adversarial brand/claims/legal review gate via the imported
  // adversarialGate combinator (critic fan-out, bounded fixer loop, owner
  // escalation come free). Critics are fresh instances; none produced content.
  ctx.log?.('info', 'Phase 4: adversarial brand/claims/legal review gate');
  const reviewGate = await adversarialGate(ctx, {
    gateId: 'marketing.campaign-review',
    artifact: {
      path: campaignPackage.packagePath,
      description: 'Unified campaign package (indexes all rendered channel assets + claims register)',
    },
    critics: [
      {
        name: 'brand-consistency-critic',
        role: 'Adversarial brand reviewer',
        focus: 'every rendered asset conforms to the recalled brand guidelines and the campaign messaging house',
        instructions: [
          'IRON LAW: do NOT trust the producers or the packager. OPEN and READ every asset file listed in the package index and cite path + the specific passage for each finding — a review of the index alone is invalid.',
          'Check voice, terminology, positioning, and visual-spec directions against priorKnowledge brand guidelines and strategy.messaging; any asset file listed in the index that does not exist or is empty is an automatic FAIL.',
          'Cross-channel inconsistency (same claim or offer stated differently across channels) is an issue.',
        ],
      },
      {
        name: 'claims-verification-critic',
        role: 'Adversarial claims auditor',
        focus: 'every externally-made claim in every rendered asset traces to a brief.productFacts entry via the claims register',
        instructions: [
          'IRON LAW: re-derive the claims register yourself. READ every rendered asset, extract every product claim, and verify each appears in claims-register.md AND that its cited productFacts index actually substantiates the claim text — cite asset path, register row, and product fact for every claim checked.',
          'Any claim present in an asset but absent from the register, or traced to a fact that does not substantiate it, is a FAIL — superlatives and implied performance/comparison claims count as claims.',
          'Verify rejectedClaims and proposedNewClaims did NOT leak into any rendered asset.',
        ],
      },
      {
        name: 'legal-compliance-critic',
        role: 'Adversarial legal/compliance reviewer',
        focus: 'regulatory and platform-policy exposure of the rendered assets',
        instructions: [
          'IRON LAW: READ each rendered asset and evaluate against advertising-law basics (unsubstantiated superiority, misleading pricing/urgency, testimonial and disclosure rules, required disclaimers) and per-channel platform policies for its channel — cite asset path and passage for every finding.',
          'Missing required disclosures (paid partnership, ad labeling for paid channels, unsubscribe/consent language for email) are issues, not suggestions.',
          'Do not pass on the promise that legal review happens later — this gate IS the review.',
        ],
      },
    ],
    ironLaw: [
      'Evidence must include EXECUTED checks: every critic must open and read the actual rendered asset files (cite path + excerpt) — index- or summary-only citations do not satisfy this gate.',
      'Every external claim must be traced claim -> asset -> register row -> product fact; one untraceable claim fails the gate.',
      'passed:true with an empty evidence array is a protocol failure (enforced by the combinator).',
    ],
    maxFixAttempts,
    fixer: { task: gateFixerTask }, // built-in fixer, referenced explicitly — it edits the package/assets against the consolidated issues
    context: {
      brief: { name: brief.name, objective: brief.objective, productFacts: brief.productFacts },
      strategy,
      channelContent,
      claimsRegisterPath: campaignPackage.claimsRegisterPath,
      priorKnowledge,
    },
  });
  if (reviewGate.escalated) {
    // The escalation breakpoint is raised internally by the combinator.
    breakpointsHit.push('marketing.campaign-review.gate-escalation');
  }
  timings.reviewGate = ctx.now() - startTime;

  if (!reviewGate.passed) {
    // Fail closed: a failed review gate means NO claims-signoff, NO spend, NO
    // publishing — the gated phases never run; all gated actions stay recorded
    // as skipped with executed:false.
    return {
      success: false,
      strategy,
      channelContent,
      campaignPackage,
      reviewGate,
      gatedActions,
      launch: null,
      retro: null,
      kipFactsAsserted: 0,
      artifacts: [campaignPackage.packagePath, campaignPackage.claimsRegisterPath],
      metadata: {
        processId: 'marketing/marketing-campaign-workflow',
        runId: ctx.runId,
        campaignName: brief.name,
        breakpointsHit,
        timings,
        reason: 'Brand/claims/legal review gate failed (incl. escalation) — publish and spend phases never run on a failed gate',
      },
    };
  }

  // Phase 5 — policy-gated approvals + executors, in strict order. Each executor
  // is guarded by approved === true; every outcome is recorded via
  // recordGatedAction — fail closed, never worked around.
  ctx.log?.('info', 'Phase 5: policy-gated claims-signoff, paid-spend-commit, campaign-publish');

  // (a) claims-signoff — approval is the precondition for BOTH paid spend and
  // every publish batch. Never auto-approved by threshold.
  const claimsApproval = await routedBreakpoint(ctx, {
    question: `Approve the external product claims for campaign '${brief.name}'? Every claim in the register traces to a product fact and passed the adversarial gate. Rejection blocks ALL publishing and paid spend; the run continues to retro with the decision recorded.`,
    title: 'Claims sign-off',
    context: {
      runId: ctx.runId,
      files: [
        { path: campaignPackage.claimsRegisterPath, label: 'Claims register' },
        { path: campaignPackage.packagePath, label: 'Campaign package' },
      ],
      summary: {
        claimsCount: strategy.claims.length,
        rejectedClaims: strategy.rejectedClaims ?? [],
        proposedNewClaims: campaignPackage.proposedNewClaims ?? [],
        reviewGate: { passed: reviewGate.passed, attempts: reviewGate.attempts, escalated: reviewGate.escalated },
      },
    },
  }, {
    breakpointId: 'claims-signoff',
    expert: 'brand-legal-reviewer',
    tags: ['policy-gated', 'marketing'],
    strategy: 'single',
  });
  breakpointsHit.push('claims-signoff');
  const claimsApproved = claimsApproval.approved === true;
  gatedActions.claimsSignoff = recordGatedAction('claims-signoff', true, claimsApproval, false);

  // Paid-spend gate applicability is computed regardless of the claims decision
  // so a rejected sign-off can record what WOULD have been gated, honestly.
  const paidChannelsRequested = brief.channels.filter((channel) => PAID_CHANNELS.includes(channel));
  const paidSpendGateApplicable = paidChannelsRequested.length > 0 || (brief.budget?.paidMedia ?? 0) > 0;

  let spendExecution = null;
  let spendApproved = false;
  const publishBatches = campaignPackage.publishBatches;

  if (!claimsApproved) {
    // Rejected claims-signoff: skip spend AND all publish batches — both stay
    // recorded (skipped, executed:false) — and continue honestly to the retro.
    // This is explicit exclusion recording, never a silent alternative path.
    ctx.log?.('info', 'Phase 5: claims-signoff rejected — spend and all publish batches skipped, continuing to retro');
    gatedActions.paidSpendCommit = recordGatedAction('paid-spend-commit', false, null, false);
    for (const batch of publishBatches) {
      gatedActions.campaignPublish.batches.push({
        batchId: batch.batchId,
        channels: batch.channels,
        approved: false,
        autoApproved: false,
        response: null,
        executed: false,
        skippedReason: 'claims-signoff rejected — publishing blocked',
      });
    }
  } else {
    // (b) paid-spend-commit — raised ONLY when claims-signoff approved AND the
    // campaign includes paid channels or brief.budget.paidMedia > 0; otherwise
    // recorded as required:false skipped.
    if (paidSpendGateApplicable) {
      const spendApproval = await routedBreakpoint(ctx, {
        question: `Commit paid-media budget of ${brief.budget?.paidMedia ?? 'the drafted amount'} across ${paidChannelsRequested.join(', ') || 'the planned paid channels'} for campaign '${brief.name}'? Adjusted amounts in your response supersede the draft. Rejection records the decision; paid channels are excluded from publishing and organic channels proceed.`,
        title: 'Commit paid-media spend',
        context: {
          runId: ctx.runId,
          files: [{ path: campaignPackage.packagePath, label: 'Campaign package (spend plan section)' }],
          summary: {
            budget: brief.budget ?? null,
            paidChannels: paidChannelsRequested,
            channelPlans: strategy.channelPlans,
            claimsSignoff: gatedActions.claimsSignoff,
          },
        },
      }, {
        breakpointId: 'paid-spend-commit',
        expert: 'marketing-director',
        tags: ['policy-gated', 'marketing'],
        strategy: 'single',
      });
      breakpointsHit.push('paid-spend-commit');
      spendApproved = spendApproval.approved === true;
      if (spendApproved) {
        spendExecution = await ctx.task(commitPaidSpendTask, {
          ...sharedArgs,
          strategy,
          approvalResponse: spendApproval.response ?? spendApproval.feedback ?? null,
        });
      }
      gatedActions.paidSpendCommit = recordGatedAction(
        'paid-spend-commit', true, spendApproval, spendExecution ? spendExecution.committed === true : false
      );
    } else {
      gatedActions.paidSpendCommit = recordGatedAction('paid-spend-commit', false, null, false);
    }

    // (c) campaign-publish — once PER publish batch under ONE breakpointId so
    // adapters/policy binds to the actionId while each batch gets independent
    // human review. Paid channels are EXCLUDED from batches when the spend gate
    // was required and not approved (explicit filtering, not a fallback); empty
    // batches after filtering are skipped and recorded. A rejected batch never
    // blocks later batches.
    gatedActions.campaignPublish.required = true;
    const excludePaidChannels = paidSpendGateApplicable && !spendApproved;
    for (const batch of publishBatches) {
      const batchChannels = excludePaidChannels
        ? batch.channels.filter((channel) => !PAID_CHANNELS.includes(channel))
        : batch.channels;
      if (batchChannels.length === 0) {
        gatedActions.campaignPublish.batches.push({
          batchId: batch.batchId,
          channels: batchChannels,
          approved: false,
          autoApproved: false,
          response: null,
          executed: false,
          skippedReason: 'batch empty after paid-channel exclusion (paid-spend-commit not approved)',
        });
        continue;
      }
      const batchAssets = batchChannels.flatMap(
        (channel) => (channelContent[channel]?.assets ?? []).map((asset) => asset.path)
      );
      const batchApproval = await routedBreakpoint(ctx, {
        question: `Publish batch ${batch.batchId} (${batchChannels.join(', ')}) of campaign '${brief.name}' to external channels? Edits in your response supersede drafts verbatim. Rejection records the decision for this batch only; later batches are still offered independently.`,
        title: `Publish campaign batch ${batch.batchId}`,
        context: {
          runId: ctx.runId,
          files: [{ path: campaignPackage.packagePath, label: 'Campaign package' }],
          summary: {
            batchId: batch.batchId,
            channels: batchChannels,
            assetPaths: batchAssets,
            claimsSignoff: gatedActions.claimsSignoff,
            paidSpendCommit: gatedActions.paidSpendCommit,
            reviewGate: { passed: reviewGate.passed, attempts: reviewGate.attempts, escalated: reviewGate.escalated },
          },
        },
      }, {
        breakpointId: 'campaign-publish',
        expert: 'marketing-director',
        tags: ['policy-gated', 'marketing'],
        strategy: 'single',
      });
      breakpointsHit.push('campaign-publish');
      let batchExecution = null;
      if (batchApproval.approved === true) {
        batchExecution = await ctx.task(publishChannelBatchTask, {
          ...sharedArgs,
          batch: { batchId: batch.batchId, channels: batchChannels },
          channelContent,
          approvalResponse: batchApproval.response ?? batchApproval.feedback ?? null,
        });
      }
      gatedActions.campaignPublish.batches.push({
        batchId: batch.batchId,
        channels: batchChannels,
        approved: batchApproval.approved === true,
        autoApproved: batchApproval.autoApproved === true || batchApproval.autoApprove === true,
        response: batchApproval.response ?? batchApproval.feedback ?? null,
        executed: batchExecution ? batchExecution.published === true : false,
        records: batchExecution ? batchExecution.records : [],
      });
    }
  }
  timings.gatedActions = ctx.now() - startTime;

  // Phase 6 — monitored launch: runs ONLY if at least one publish batch executed.
  // Nothing published is recorded honestly, never reinterpreted.
  const executedBatches = gatedActions.campaignPublish.batches.filter((batch) => batch.executed === true);
  let launch = null;
  if (executedBatches.length > 0) {
    ctx.log?.('info', 'Phase 6: monitored launch');
    launch = await ctx.task(launchMonitorTask, {
      ...sharedArgs,
      strategy,
      executedBatches,
      gatedActions,
    });
  } else if (claimsApproved) {
    ctx.log?.('info', 'Phase 6: nothing published — launch monitoring skipped and recorded honestly');
    launch = {
      monitored: false,
      signals: [],
      anomalies: [],
      reason: 'No publish batch executed — nothing to monitor',
    };
  } else {
    ctx.log?.('info', 'Phase 6: claims-signoff rejected — launch is null');
  }
  timings.launch = ctx.now() - startTime;

  // Phase 7 — analytics retro + kip assert. The retro always runs after a passed
  // gate — rejected gated actions are outcomes to learn from, not dead ends.
  ctx.log?.('info', 'Phase 7: analytics retro + kip assert');
  const retro = await ctx.task(analyticsRetroTask, {
    ...sharedArgs,
    strategy,
    channelContent,
    campaignPackage,
    reviewGate: { passed: reviewGate.passed, attempts: reviewGate.attempts, escalated: reviewGate.escalated },
    gatedActions,
    spendExecution,
    launch,
  });

  let kipFactsAsserted = 0;
  if (kipEnabled) {
    const facts = [
      {
        subject: `campaign:${brief.name}`,
        predicate: 'achieved-outcome',
        object: String(retro.performanceSummary),
        props: {
          objective: brief.objective,
          success: executedBatches.length > 0 && gatedActions.claimsSignoff.approved,
        },
      },
      ...retro.channelLearnings.map((entry) => ({
        subject: `campaign:${brief.name}`,
        predicate: 'channel-learning',
        object: String(entry.channel),
        props: { learning: entry.learning, published: entry.published === true },
      })),
      {
        subject: `campaign:${brief.name}`,
        predicate: 'gate-outcome',
        object: 'marketing.campaign-review',
        props: { passed: reviewGate.passed, attempts: reviewGate.attempts, escalated: reviewGate.escalated },
      },
      {
        subject: `campaign:${brief.name}`,
        predicate: 'claims-decision',
        object: 'claims-signoff',
        props: {
          required: gatedActions.claimsSignoff.required,
          approved: gatedActions.claimsSignoff.approved,
          autoApproved: gatedActions.claimsSignoff.autoApproved,
          rejectedClaimsCount: (strategy.rejectedClaims ?? []).length,
        },
      },
      {
        subject: `campaign:${brief.name}`,
        predicate: 'spend-decision',
        object: 'paid-spend-commit',
        props: {
          required: gatedActions.paidSpendCommit.required,
          approved: gatedActions.paidSpendCommit.approved,
          autoApproved: gatedActions.paidSpendCommit.autoApproved,
          committedAmount: spendExecution?.totalAmount ?? null,
        },
      },
      ...gatedActions.campaignPublish.batches.map((batch) => ({
        subject: `campaign:${brief.name}`,
        predicate: 'publish-decision',
        object: String(batch.batchId),
        props: {
          channels: batch.channels,
          approved: batch.approved,
          autoApproved: batch.autoApproved,
          executed: batch.executed,
        },
      })),
    ];
    const capture = await kipAssert(ctx, { kipDir, kipModel, kind: 'marketing', facts });
    kipFactsAsserted = capture.asserted;
  }
  timings.retro = ctx.now() - startTime;

  const artifacts = [campaignPackage.packagePath, campaignPackage.claimsRegisterPath];
  if (spendExecution?.recordPath) artifacts.push(spendExecution.recordPath);
  for (const batch of gatedActions.campaignPublish.batches) {
    for (const record of batch.records ?? []) {
      if (record?.recordPath) artifacts.push(record.recordPath);
    }
  }
  if (launch?.reportPath) artifacts.push(launch.reportPath);
  if (retro?.reportPath) artifacts.push(retro.reportPath);

  return {
    success:
      reviewGate.passed &&
      gatedActions.claimsSignoff.approved &&
      gatedActions.campaignPublish.batches.some((batch) => batch.executed === true) &&
      launch?.monitored === true &&
      (!gatedActions.paidSpendCommit.required ||
        gatedActions.paidSpendCommit.approved === gatedActions.paidSpendCommit.executed),
    strategy,
    channelContent,
    campaignPackage: {
      packagePath: campaignPackage.packagePath,
      claimsRegisterPath: campaignPackage.claimsRegisterPath,
      publishBatches: campaignPackage.publishBatches,
    },
    reviewGate,
    gatedActions,
    launch,
    retro,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'marketing/marketing-campaign-workflow',
      runId: ctx.runId,
      campaignName: brief.name,
      breakpointsHit,
      timings: { ...timings, total: ctx.now() - startTime },
    },
  };
}
