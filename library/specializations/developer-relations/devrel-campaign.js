/**
 * @process developer-relations/devrel-campaign
 * @description Flagship end-to-end governed developer-relations campaign carrying one
 *   product change from intake to community engagement: product-change intake ->
 *   parallel docs-driven sample-app builds that MUST actually build and run (evidence =
 *   captured run output) -> adversarial sample-app accuracy gate (critics independently
 *   RE-RUN every sample against the current API surface) -> parallel content production
 *   (blog / tutorial / video-script) drafted ONLY from executed samples, composing the
 *   technical-documentation point tasks + content-writer persona by name -> adversarial
 *   content technical-accuracy gate (critics EXTRACT and EXECUTE every code snippet) ->
 *   three routed policy gates (sample-app-repo-publish, external-content-publish,
 *   community-reply-send) with fail-closed executors -> community triage loop setup ->
 *   engagement retro. A failed sample-app OR content gate returns success:false BEFORE
 *   any approval/publish. kipRecall at intake, kipAssert at close (kind
 *   'developer-relations'). No shell subtasks, no fallbacks.
 * @inputs {
 *   productChange: object,          // required — { id, title, summary, changedApis: array (non-empty), docsRefs: array, sampleAppSpecs?: array, sourceMaterials?: array, embargoUntil? }
 *   repoRoot?: string,              // default '.'
 *   apiSurfaceRef?: string,         // path/ref to the current API surface + docs the gates check against (default 'docs/')
 *   contentChannels?: object,       // per-piece external channel hint, e.g. { blog:'devblog', tutorial:'docs-site', 'video-script':'youtube' }; unknown keys throw against CONTENT_PIECES
 *   communityThreadsDir?: string,   // dir of open community issues/questions to triage (default 'artifacts/community/inbox')
 *   sampleRepoTarget?: string,      // public sample-app repo to publish/update
 *   maxFixAttempts?: number,        // bounded fix loop for both accuracy gates (default 2)
 *   kipEnabled?: boolean,           // recall + assert devrel knowledge via kip (default true)
 *   kipDir?: string,                // kip store directory (default '.a5c/kip')
 *   kipModel?: string               // model for kip structured paths (default 'sonnet')
 * }
 * @outputs {
 *   success: boolean,               // sampleAppGate.passed && contentGate.passed && every gatedActions record satisfies (!required || approved === executed)
 *   intake: object,                 // { scope, changedApiIndex, sampleAppSpecs, contentPlan, openQuestions }
 *   sampleApps: object,             // per-spec { specId, appPath, built, ran, runOutputPath, exitCode }
 *   sampleAppGate: object,          // { passed, issues[], evidence[], attempts, escalated }
 *   content: object,                // blog|tutorial|video-script { piecePath, title, snippetCount, composedFrom }
 *   contentGate: object,            // { passed, issues[], evidence[], attempts, escalated }
 *   gatedActions: object,           // { sampleAppRepoPublish, externalContentPublish, communityReplySend } each { actionId, required, approved, autoApproved, response, executed }
 *   publishes: object,              // per-piece + sample-repo publish records or null
 *   communityTriage: object,        // { threadsScanned, repliesDrafted, repliesSent, faqCandidates[] }
 *   retro: object,                  // { retroPath, learnings[] }
 *   kipFactsAsserted: number,
 *   artifacts: array,
 *   metadata: object                // { processId:'developer-relations/devrel-campaign', runId, productChangeId, breakpointsHit, timings }
 * }
 * @graph
 *   domains: [domain:developer-relations]
 *   specializations: [specialization:developer-relations]
 *   skillAreas: [skill-area:developer-advocacy, skill-area:content-marketing, skill-area:community-management, skill-area:knowledge-management, skill-area:orchestration-loop]
 *   workflows: [workflow:content-pipeline, workflow:user-feedback-loop]
 *   topics: [topic:developer-experience, topic:quality-assurance]
 *   roles: [role:developer-advocate, role:technical-writer, role:community-manager]
 * @policyGatedActions
 *   sample-app-repo-publish (expert devrel-lead — publish/update the public sample repo,
 *   always raised in Phase 6 after both accuracy gates pass), external-content-publish
 *   (expert devrel-lead — ONE approval covering all three content pieces, Phase 7),
 *   community-reply-send (expert community-manager — outbound community replies, Phase 8,
 *   only when repliesDrafted > 0). breakpointId equals actionId; tags
 *   ['policy-gated','developer-relations']; strategy 'single'; fail-closed: each executor
 *   runs ONLY on approved===true; every outcome incl. non-interactive auto-approvals
 *   recorded in outputs.gatedActions; a failed accuracy gate skips all three.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
  gateFixerTask,
} from '../common-utilities/routed-gate-combinators.js';

// Canonical content set; drives ctx.parallel fan-out order and output keying.
const CONTENT_PIECES = Object.freeze(['blog', 'tutorial', 'video-script']);

// Frozen piece->policy-gated actionId map. All three pieces share the single
// external-content-publish gate (one breakpoint covering every piece).
const CONTENT_ACTIONS = Object.freeze({ blog: 'external-content-publish', tutorial: 'external-content-publish', 'video-script': 'external-content-publish' });

// Frozen actionId->accountable-expert routing map for the three external-facing gates.
const GATED_ACTION_EXPERTS = Object.freeze({ 'sample-app-repo-publish': 'devrel-lead', 'external-content-publish': 'devrel-lead', 'community-reply-send': 'community-manager' });

/**
 * Throwing lookup over GATED_ACTION_EXPERTS — an unknown gated action is a
 * process-definition failure, never a silent default (fallbacks are forbidden).
 */
export function expertFor(actionId) {
  const expert = GATED_ACTION_EXPERTS[actionId];
  if (!expert) {
    throw new Error(`No approval expert is mapped for gated action '${actionId}'. Known actions: ${Object.keys(GATED_ACTION_EXPERTS).join(', ')} - routing is never defaulted (fallbacks are forbidden).`);
  }
  return expert;
}

/**
 * Throwing lookup over CONTENT_ACTIONS — sibling of expertFor.
 */
export function actionFor(piece) {
  const actionId = CONTENT_ACTIONS[piece];
  if (!actionId) {
    throw new Error(`No policy-gated action is mapped for content piece '${piece}'. Known pieces: ${CONTENT_PIECES.join(', ')} - routing is never defaulted (fallbacks are forbidden).`);
  }
  return actionId;
}

/**
 * Fail-closed audit record for one policy-gated action.
 * approved is strictly bpResult.approved === true; autoApproved is read raw from
 * the BreakpointResult's auto-approval marker fields (never inferred from
 * interactivity); response is bpResult.response ?? bpResult.feedback ?? null.
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
// Phase 1 — Product-change intake
// ---------------------------------------------------------------------------

export const intakeTask = defineTask('dvr.intake', (args, taskCtx) => ({
  kind: 'agent',
  title: `Product-change intake for ${args.productChange.id}`,
  agent: {
    name: 'devrel-intake-analyst',
    prompt: {
      role: 'Product-change devrel intake analyst',
      task: `Normalize product change '${args.productChange.id}' and derive its sample-app + content plan`,
      context: args,
      instructions: [
        `Inventory every changed API in productChange.changedApis against the current API surface at ${args.apiSurfaceRef} - cite the surface entry for each; flag any changed API you cannot find in the surface as an openQuestion (do not block).`,
        'Derive/validate sampleAppSpecs[] — one runnable app per key capability. EVERY spec MUST carry a concrete buildCmdDescription AND runCmdDescription (a spec without a runnable build+run command is a definition error the process rejects before any build).',
        'Produce the contentPlan: a per-piece angle for blog, tutorial, and video-script grounded in the changed APIs and the (to-be-built) sample apps.',
        'Thread priorKnowledge (prior devrel content on these APIs, recurring community questions) into scope and angles — never invent APIs, sample apps, or claims absent from productChange/docs.',
        'Surface openQuestions without blocking.',
      ],
      outputFormat: 'JSON with scope string, changedApiIndex array, sampleAppSpecs array of { specId, capability, buildCmdDescription, runCmdDescription, docsRefs }, contentPlan object, openQuestions array',
    },
    outputSchema: {
      type: 'object',
      required: ['scope', 'changedApiIndex', 'sampleAppSpecs', 'contentPlan'],
      properties: {
        scope: { type: 'string' },
        changedApiIndex: { type: 'array' },
        sampleAppSpecs: { type: 'array' },
        contentPlan: { type: 'object' },
        openQuestions: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dvr', 'developer-relations', 'intake'],
}));

// ---------------------------------------------------------------------------
// Phase 2 — Docs-driven sample-app builds (single parametrized task, fanned
// out N-way via ctx.parallel.all over intake.sampleAppSpecs)
// ---------------------------------------------------------------------------

export const buildSampleAppTask = defineTask('dvr.build-sample-app', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build + run sample app ${args.spec.specId} for ${args.productChange.id}`,
  agent: {
    name: 'devrel-sample-app-engineer',
    prompt: {
      role: 'Docs-driven sample-app engineer',
      task: `Build the '${args.spec.specId}' sample app strictly from the docs, then ACTUALLY run it and capture the output`,
      context: args,
      instructions: [
        `Build the sample app for capability '${args.spec.capability}' strictly from the documented current surface (docsRefs in the spec + ${args.apiSurfaceRef}). Every API call MUST come from the documented current surface - no deprecated, removed, or invented calls.`,
        `Follow the spec's buildCmdDescription to build, then ACTUALLY run it following runCmdDescription, and capture stdout/stderr/exit code to runOutputPath under ${args.repoRoot}.`,
        'Record built:false or a non-zero exitCode HONESTLY when the build/run fails — no green-by-assertion, no fallback stub, no masking. The captured run output is the evidence the accuracy gate consumes.',
        'List every API call the sample uses in apiCallsUsed so the api-currency critic can cross-check it against the surface.',
      ],
      outputFormat: 'JSON with specId, appPath, built boolean, ran boolean, runOutputPath string, exitCode number, apiCallsUsed array',
    },
    outputSchema: {
      type: 'object',
      required: ['specId', 'appPath', 'built', 'ran', 'runOutputPath', 'exitCode'],
      properties: {
        specId: { type: 'string' },
        appPath: { type: 'string' },
        built: { type: 'boolean' },
        ran: { type: 'boolean' },
        runOutputPath: { type: 'string' },
        exitCode: { type: 'number' },
        apiCallsUsed: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dvr', 'developer-relations', 'sample-app'],
}));

// ---------------------------------------------------------------------------
// Phase 4 — Parallel content production (single parametrized task, fanned out
// 3x via ctx.parallel.all over CONTENT_PIECES). Composes the
// technical-documentation point tasks + content-writer persona BY NAME.
// ---------------------------------------------------------------------------

export const produceContentTask = defineTask('dvr.produce-content', (args, taskCtx) => ({
  kind: 'agent',
  title: `Produce ${args.piece} for ${args.productChange.id}`,
  agent: {
    name: 'devrel-content-producer',
    prompt: {
      role: 'Developer-content producer',
      task: `Draft the '${args.piece}' content piece ONLY from the executed sample apps + intake`,
      context: args,
      instructions: [
        'Compose the communication/content-writer persona BY NAME for prose drafting: brief (audience/purpose/piece) -> plan -> draft.',
        "For the 'tutorial' piece compose technical-documentation/interactive-tutorials BY NAME (an executable walkthrough); for the 'blog' piece compose technical-documentation/how-to-guides + technical-documentation/api-reference-docs BY NAME; for 'video-script' structure the runnable walkthrough as a spoken script grounded in the same samples.",
        'Every code snippet MUST be lifted verbatim from a sample app that ACTUALLY RAN (capture its snippetSourceSampleIds). Never introduce API calls, numbers, dates, or claims absent from the executed samples/docs/intake.',
        `Write the piece under ${args.repoRoot} and report its piecePath, title, and snippetCount. Record composedFrom (the by-name point tasks + personas you composed) so the README/graph reflects the composition.`,
      ],
      outputFormat: 'JSON with piece, piecePath, title, snippetCount number, snippetSourceSampleIds array, composedFrom array',
    },
    outputSchema: {
      type: 'object',
      required: ['piece', 'piecePath', 'title', 'snippetCount', 'composedFrom'],
      properties: {
        piece: { type: 'string' },
        piecePath: { type: 'string' },
        title: { type: 'string' },
        snippetCount: { type: 'number' },
        snippetSourceSampleIds: { type: 'array' },
        composedFrom: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dvr', 'developer-relations', 'content'],
}));

// ---------------------------------------------------------------------------
// Phase 6 — Policy-gated sample-app repo publish executor.
// Invoked ONLY after the sample-app-repo-publish routedBreakpoint approved === true.
// ---------------------------------------------------------------------------

export const publishSampleAppTask = defineTask('dvr.publish-sample-app', (args, taskCtx) => ({
  kind: 'agent',
  title: `Publish approved sample repo for ${args.productChange.id}`,
  agent: {
    name: 'devrel-publish-executor',
    prompt: {
      role: 'Sample-app repo publish executor',
      task: `Publish/update the public sample repo for product change '${args.productChange.id}'`,
      context: args,
      instructions: [
        'Runs ONLY after the sample-app-repo-publish breakpoint approved - never restate or re-decide the approval.',
        `Publish/update the public sample repo (${args.sampleRepoTarget}) with the HUMAN-APPROVED sample apps exactly as approved (approver edits in the breakpoint response supersede the samples verbatim).`,
        `Write a publish record under ${args.repoRoot} capturing the published apps, repoUrl, and publishedAt.`,
      ],
      outputFormat: 'JSON with published boolean, publishRecordPath, repoUrl, publishedAt',
    },
    outputSchema: {
      type: 'object',
      required: ['published', 'publishRecordPath'],
      properties: {
        published: { type: 'boolean' },
        publishRecordPath: { type: 'string' },
        repoUrl: { type: 'string' },
        publishedAt: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dvr', 'developer-relations', 'policy-gated', 'publish'],
}));

// ---------------------------------------------------------------------------
// Phase 7 — Policy-gated content publish executor (single parametrized task,
// fanned out 3x via ctx.parallel.all under the single external-content-publish
// approval). Mirrors the multi-audience-announcement send executors.
// ---------------------------------------------------------------------------

export const publishContentTask = defineTask('dvr.publish-content', (args, taskCtx) => ({
  kind: 'agent',
  title: `Publish approved ${args.piece} for ${args.productChange.id}`,
  agent: {
    name: 'devrel-publish-executor',
    prompt: {
      role: 'External content publish executor',
      task: `Publish the human-approved '${args.piece}' content piece for '${args.productChange.id}'`,
      context: args,
      instructions: [
        'Runs ONLY after the external-content-publish breakpoint approved - never re-decide the approval.',
        `Publish the HUMAN-APPROVED '${args.piece}' piece exactly as approved (approver edits supersede the draft verbatim) via the named channel persona for its channel '${args.channel}' (devblog/docs-site/youtube persona as named).`,
        `Honor embargoUntil (${args.embargoUntil ?? 'none'}) - publishing before the embargo is a failure, not a retry.`,
        `Write a publish record under ${args.repoRoot} with final text, channel, publishedUrl, and publishedAt.`,
      ],
      outputFormat: 'JSON with piece, published boolean, publishRecordPath, publishedUrl, channel, publishedAt',
    },
    outputSchema: {
      type: 'object',
      required: ['piece', 'published', 'publishRecordPath'],
      properties: {
        piece: { type: 'string' },
        published: { type: 'boolean' },
        publishRecordPath: { type: 'string' },
        publishedUrl: { type: 'string' },
        channel: { type: 'string' },
        publishedAt: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dvr', 'developer-relations', 'policy-gated', 'publish'],
}));

// ---------------------------------------------------------------------------
// Phase 8 — Community triage (draft-only) and gated reply-send executor.
// ---------------------------------------------------------------------------

export const setupCommunityTriageTask = defineTask('dvr.setup-community-triage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Community triage setup for ${args.productChange.id}`,
  agent: {
    name: 'devrel-community-triager',
    prompt: {
      role: 'Community triage loop analyst',
      task: `Scan open community threads and DRAFT replies grounded in the new content for '${args.productChange.id}'`,
      context: args,
      instructions: [
        `Scan the open community threads under ${args.communityThreadsDir} - inventory only real threads found there; never fabricate threads. Zero threads is a valid no-op (threadsScanned:0, repliesDrafted:0).`,
        'Match each thread against the new content pieces + kip FAQs; classify (answerable-now / needs-eng / duplicate).',
        'DRAFT a reply for each answerable-now thread (draftPath, threadRef, category) - DRAFT ONLY, never send. needs-eng/duplicate threads are recorded, not drafted.',
        'Emit faqCandidates[] (question, answer, sourceContent) from recurring questions the new content now answers, for kipAssert.',
      ],
      outputFormat: 'JSON with threadsScanned number, repliesDrafted number, draftedReplies array of { threadRef, draftPath, category }, faqCandidates array of { question, answer, sourceContent }',
    },
    outputSchema: {
      type: 'object',
      required: ['threadsScanned', 'repliesDrafted', 'draftedReplies', 'faqCandidates'],
      properties: {
        threadsScanned: { type: 'number' },
        repliesDrafted: { type: 'number' },
        draftedReplies: { type: 'array' },
        faqCandidates: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dvr', 'developer-relations', 'community'],
}));

export const sendCommunityRepliesTask = defineTask('dvr.send-community-replies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Send approved community replies for ${args.productChange.id}`,
  agent: {
    name: 'devrel-publish-executor',
    prompt: {
      role: 'Community reply send executor',
      task: `Post the human-approved drafted community replies for '${args.productChange.id}'`,
      context: args,
      instructions: [
        'Runs ONLY after the community-reply-send breakpoint approved - never re-decide the approval.',
        'Post the HUMAN-APPROVED drafted replies exactly as approved (approver edits supersede the drafts verbatim) to their threads via the named channel persona (slack/discord/forum as the thread indicates).',
        'Verify NO send occurs for any thread not covered by the approval (fail-closed audit check).',
        `Write a send record per reply under ${args.repoRoot} with the final text, threadRef, and sentAt.`,
      ],
      outputFormat: 'JSON with sent boolean, sendRecordPath, repliesSent number, sentAt',
    },
    outputSchema: {
      type: 'object',
      required: ['sent', 'sendRecordPath', 'repliesSent'],
      properties: {
        sent: { type: 'boolean' },
        sendRecordPath: { type: 'string' },
        repliesSent: { type: 'number' },
        sentAt: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dvr', 'developer-relations', 'policy-gated', 'community'],
}));

// ---------------------------------------------------------------------------
// Phase 9 — Engagement retro
// ---------------------------------------------------------------------------

export const engagementRetroTask = defineTask('dvr.engagement-retro', (args, taskCtx) => ({
  kind: 'agent',
  title: `Engagement retro for ${args.productChange.id}`,
  agent: {
    name: 'devrel-retro-analyst',
    prompt: {
      role: 'Engagement retro analyst',
      task: `Consolidate the campaign outcomes for '${args.productChange.id}' into a retro doc with learnings`,
      context: args,
      instructions: [
        'Consolidate sample-app, content, publish, and community-triage outcomes into a single retro doc with concrete learnings.',
        'Record unpublished/rejected outcomes HONESTLY - a rejected gate or a failed accuracy gate is a real outcome, never masked.',
        `Write the retro doc under ${args.repoRoot}; report retroPath, learnings array, and an outcomeSummary object the kipAssert phase feeds from.`,
      ],
      outputFormat: 'JSON with retroPath, learnings array, outcomeSummary object',
    },
    outputSchema: {
      type: 'object',
      required: ['retroPath', 'learnings'],
      properties: {
        retroPath: { type: 'string' },
        learnings: { type: 'array' },
        outcomeSummary: { type: 'object' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dvr', 'developer-relations', 'retro'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    productChange,
    repoRoot = '.',
    apiSurfaceRef = 'docs/',
    contentChannels = null,
    communityThreadsDir = 'artifacts/community/inbox',
    sampleRepoTarget = null,
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs || {};

  // Phase 0 — validation. No fallbacks: a product change without an id, title,
  // and a non-empty changedApis array is not workable.
  if (!productChange || !productChange.id || !productChange.title || !Array.isArray(productChange.changedApis) || productChange.changedApis.length === 0) {
    throw new Error('developer-relations/devrel-campaign requires productChange with { id, title, changedApis[] (non-empty) }.');
  }

  // Channel resolution: per-piece default map; an unknown piece key in
  // contentChannels is a caller bug — throw, never ignore.
  const effectiveChannels = { blog: 'devblog', tutorial: 'docs-site', 'video-script': 'youtube' };
  for (const key of Object.keys(contentChannels ?? {})) {
    if (!CONTENT_PIECES.includes(key)) {
      throw new Error(`contentChannels supplies unknown content piece '${key}'. Known pieces: ${CONTENT_PIECES.join(', ')} - unknown keys are never silently ignored.`);
    }
    effectiveChannels[key] = contentChannels[key];
  }
  const channelFor = (piece) => {
    const channel = effectiveChannels[piece];
    if (!channel) {
      throw new Error(`No channel is resolved for content piece '${piece}'. Known pieces: ${CONTENT_PIECES.join(', ')}.`);
    }
    return channel;
  };

  const startTime = ctx.now();
  const timings = {};
  const breakpointsHit = [];
  const artifactsDir = ctx.artifactsDir;
  const sharedArgs = { productChange, repoRoot, apiSurfaceRef, communityThreadsDir, sampleRepoTarget, kipDir, kipModel, artifactsDir };
  const embargoUntil = productChange.embargoUntil ?? null;

  // Fail-closed audit surface — every policy-gated action lands here, including
  // skipped gates on a failed-gate early return. Never omitted.
  const gatedActions = {
    sampleAppRepoPublish: recordGatedAction('sample-app-repo-publish', false, null, false),
    externalContentPublish: recordGatedAction('external-content-publish', false, null, false),
    communityReplySend: recordGatedAction('community-reply-send', false, null, false),
  };

  // Phase 0 (cont.) — kip recall (gated on kipEnabled): prior devrel content on
  // these APIs, recurring community questions/FAQs, and past sample-app patterns
  // thread as priorKnowledge into every later task. Empty store = fresh brain.
  ctx.log?.('info', 'Phase 0: kip recall of prior devrel knowledge');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      kipModel,
      kind: 'developer-relations',
      topic: `prior devrel content on these APIs, recurring community questions and FAQs, past sample-app patterns: ${productChange.title}`,
    });
  }
  timings.kipRecall = ctx.now() - startTime;

  // Phase 1 — product-change intake.
  ctx.log?.('info', 'Phase 1: product-change intake');
  const intake = await ctx.task(intakeTask, { ...sharedArgs, priorKnowledge });
  timings.intake = ctx.now() - startTime;

  // No fallbacks: a derived sampleAppSpecs entry without a runnable build+run
  // command is a definition error — throw before any build.
  if (!Array.isArray(intake.sampleAppSpecs) || intake.sampleAppSpecs.length === 0) {
    throw new Error(`Intake produced no sampleAppSpecs for productChange '${productChange.id}' - at least one runnable sample app is required.`);
  }
  for (const spec of intake.sampleAppSpecs) {
    if (!spec || !spec.specId || !spec.buildCmdDescription || !spec.runCmdDescription) {
      throw new Error(`sampleAppSpecs entry ${JSON.stringify(spec?.specId ?? spec)} is missing a runnable build/run command (buildCmdDescription + runCmdDescription) - this is a definition error, not a buildable spec.`);
    }
  }

  // Phase 2 — docs-driven sample-app builds, parallel and EXECUTED. Each build
  // MUST actually build and run; the executor captures run output as evidence.
  ctx.log?.('info', 'Phase 2: docs-driven sample-app builds (parallel, executed)');
  const buildResults = await ctx.parallel.all(
    intake.sampleAppSpecs.map((spec) => () =>
      ctx.task(buildSampleAppTask, { ...sharedArgs, spec, intake, priorKnowledge })
    )
  );
  const sampleApps = {};
  for (const build of buildResults) {
    sampleApps[build.specId] = {
      specId: build.specId,
      appPath: build.appPath,
      built: build.built,
      ran: build.ran,
      runOutputPath: build.runOutputPath,
      exitCode: build.exitCode,
    };
  }
  timings.builds = ctx.now() - startTime;

  // Phase 3 — adversarial sample-app accuracy gate. Critics do NOT trust the
  // build agents: they independently re-run each sample against the CURRENT API
  // surface with captured run output as evidence.
  ctx.log?.('info', 'Phase 3: adversarial sample-app accuracy gate');
  const sampleAppGate = await adversarialGate(ctx, {
    gateId: 'developer-relations.sample-app-accuracy',
    artifact: { path: apiSurfaceRef, description: 'Every sample app + its captured runOutputPath (paths in context)' },
    critics: [
      {
        name: 'sample-execution-critic',
        role: 'Adversarial sample-app execution auditor',
        focus: 'each sample app independently re-built and re-run against the current API surface, run output captured',
        instructions: [
          'IRON LAW: do NOT trust dvr.build-sample-app. RE-RUN every sample yourself against the current API surface; a sample that fails to build or exits non-zero is an issue, not a pass.',
          'Evidence MUST include your OWN captured run output (stdout/stderr/exit code) for each sample - read-only review does not satisfy this gate.',
          'Report the exact verdict JSON: { passed: boolean, issues: array, evidence: array }.',
        ],
      },
      {
        name: 'api-currency-critic',
        role: 'Adversarial API-currency auditor',
        focus: 'every API call in every sample exists in the CURRENT surface (apiSurfaceRef); no deprecated/removed/hallucinated calls',
        instructions: [
          `IRON LAW: re-extract every API call from the sample files yourself and match each against the current surface at ${apiSurfaceRef}; cite the exact surface entry, or NONE.`,
          'Any unmatched, deprecated, or removed call fails the gate. Evidence MUST cite the surface entries and the sample call sites you checked.',
          'Report the exact verdict JSON: { passed: boolean, issues: array, evidence: array }.',
        ],
      },
    ],
    ironLaw: [
      'Evidence must include EXECUTED run output the critic captured itself — read-only review does not satisfy this gate.',
      'passed:true with an empty evidence array is a protocol failure (enforced by the combinator).',
      'Any non-building/non-running sample or any non-current API call fails the gate regardless of other scores.',
    ],
    maxFixAttempts,
    fixer: { task: gateFixerTask }, // built-in fixer, referenced explicitly — it edits the offending sample app
    context: { productChange, intake, sampleApps, apiSurfaceRef, repoRoot },
  });
  if (sampleAppGate.escalated) {
    breakpointsHit.push('developer-relations.sample-app-accuracy.gate-escalation');
  }
  timings.sampleAppGate = ctx.now() - startTime;

  if (!sampleAppGate.passed) {
    // Fail closed: a failed sample-app gate means NO content, NO approvals, NO
    // publishes — all three gated actions stay recorded as skipped.
    return {
      success: false,
      intake,
      sampleApps,
      sampleAppGate,
      content: null,
      contentGate: null,
      gatedActions,
      publishes: null,
      communityTriage: null,
      retro: null,
      kipFactsAsserted: 0,
      artifacts: Object.values(sampleApps).map((s) => s.runOutputPath),
      metadata: {
        processId: 'developer-relations/devrel-campaign',
        runId: ctx.runId,
        productChangeId: productChange.id,
        breakpointsHit,
        timings,
        reason: 'Sample-app accuracy gate failed (incl. escalation) — content, approvals, and publishes never run on a failed gate',
      },
    };
  }

  // Phase 4 — parallel content production. Each piece is drafted ONLY from the
  // executed sample apps + intake, composing the technical-documentation point
  // tasks + content-writer persona by name.
  ctx.log?.('info', 'Phase 4: parallel content production');
  const contentResults = await ctx.parallel.all(
    CONTENT_PIECES.map((piece) => () =>
      ctx.task(produceContentTask, {
        ...sharedArgs,
        piece,
        channel: channelFor(piece),
        intake,
        sampleApps,
        priorKnowledge,
      })
    )
  );
  const content = {};
  for (let i = 0; i < CONTENT_PIECES.length; i++) {
    const r = contentResults[i];
    content[CONTENT_PIECES[i]] = {
      piecePath: r.piecePath,
      title: r.title,
      snippetCount: r.snippetCount,
      composedFrom: r.composedFrom,
    };
  }
  timings.content = ctx.now() - startTime;

  // Phase 5 — adversarial content technical-accuracy gate. Critics EXTRACT and
  // EXECUTE every code snippet and cross-check every technical claim against the
  // sample-app run output + current docs.
  ctx.log?.('info', 'Phase 5: adversarial content technical-accuracy gate');
  const contentGate = await adversarialGate(ctx, {
    gateId: 'developer-relations.content-accuracy',
    artifact: { path: content.blog.piecePath, description: 'Each content piece (blog/tutorial/video-script), paths in context' },
    critics: [
      {
        name: 'snippet-execution-critic',
        role: 'Adversarial content code-snippet execution auditor',
        focus: 'every code snippet in every content piece extracted and actually run',
        instructions: [
          'IRON LAW: extract every code snippet from each content piece yourself, run it against the current surface, and capture the output as evidence.',
          'A snippet that errors or diverges from the sample-app run output is an issue, not a pass. Evidence MUST include the EXECUTED snippet output you captured.',
          'Report the exact verdict JSON: { passed: boolean, issues: array, evidence: array }.',
        ],
      },
      {
        name: 'claim-cross-check-critic',
        role: 'Adversarial technical-claim cross-checker',
        focus: 'every technical claim traces to sample-app run output or current docs',
        instructions: [
          'IRON LAW: build a claim-trace table (piece, quoted claim, matched evidence source or NONE) across all three content pieces yourself.',
          'Any claim with no evidence source, or contradicting the sample-app run output, fails the gate. Evidence MUST cite the matched run-output/doc excerpts.',
          'Report the exact verdict JSON: { passed: boolean, issues: array, evidence: array }.',
        ],
      },
    ],
    ironLaw: [
      'Evidence must include EXECUTED snippet output the critic captured itself.',
      'passed:true with an empty evidence array is a protocol failure (enforced by the combinator).',
      'Any failing snippet or untraceable claim fails the gate regardless of other scores.',
    ],
    maxFixAttempts,
    fixer: { task: gateFixerTask }, // built-in fixer — edits the offending content piece
    context: { productChange, content, sampleApps, apiSurfaceRef, repoRoot },
  });
  if (contentGate.escalated) {
    breakpointsHit.push('developer-relations.content-accuracy.gate-escalation');
  }
  timings.contentGate = ctx.now() - startTime;

  if (!contentGate.passed) {
    // Fail closed: a failed content gate means NO approvals and NO publishes —
    // all three gated actions stay recorded as skipped.
    return {
      success: false,
      intake,
      sampleApps,
      sampleAppGate,
      content,
      contentGate,
      gatedActions,
      publishes: null,
      communityTriage: null,
      retro: null,
      kipFactsAsserted: 0,
      artifacts: [
        ...Object.values(sampleApps).map((s) => s.runOutputPath),
        ...CONTENT_PIECES.map((p) => content[p].piecePath),
      ],
      metadata: {
        processId: 'developer-relations/devrel-campaign',
        runId: ctx.runId,
        productChangeId: productChange.id,
        breakpointsHit,
        timings,
        reason: 'Content technical-accuracy gate failed (incl. escalation) — approvals and publishes never run on a failed gate',
      },
    };
  }

  const gateSummary = {
    sampleApp: { passed: sampleAppGate.passed, attempts: sampleAppGate.attempts, escalated: sampleAppGate.escalated },
    content: { passed: contentGate.passed, attempts: contentGate.attempts, escalated: contentGate.escalated },
  };
  const publishes = { blog: null, tutorial: null, 'video-script': null, sampleRepo: null };

  // Phase 6 — policy-gated sample-app repo publish. Always raised after both
  // accuracy gates pass; the executor runs ONLY on approved === true.
  ctx.log?.('info', 'Phase 6: policy-gated sample-app repo publish');
  const sampleRepoApproval = await routedBreakpoint(ctx, {
    question: `Approve publishing/updating the public sample repo${sampleRepoTarget ? ` '${sampleRepoTarget}'` : ''} for product change '${productChange.id}'? Both accuracy gates passed. Edits in your response supersede the samples verbatim. Rejection records the decision and leaves the repo untouched.`,
    title: 'Sample-app repo publish approval',
    context: {
      runId: ctx.runId,
      files: Object.values(sampleApps).flatMap((s) => [
        { path: s.appPath, label: `Sample app ${s.specId}` },
        { path: s.runOutputPath, label: `Run output ${s.specId}` },
      ]),
      summary: { sampleRepoTarget, sampleApps, gate: gateSummary.sampleApp },
    },
  }, {
    breakpointId: 'sample-app-repo-publish',
    expert: expertFor('sample-app-repo-publish'),
    tags: ['policy-gated', 'developer-relations'],
    strategy: 'single',
  });
  breakpointsHit.push('sample-app-repo-publish');

  if (sampleRepoApproval.approved === true) {
    publishes.sampleRepo = await ctx.task(publishSampleAppTask, {
      ...sharedArgs,
      sampleApps,
      approvalResponse: sampleRepoApproval.response ?? sampleRepoApproval.feedback ?? null,
    });
  }
  gatedActions.sampleAppRepoPublish = recordGatedAction(
    'sample-app-repo-publish', true, sampleRepoApproval, publishes.sampleRepo ? publishes.sampleRepo.published === true : false
  );
  timings.sampleRepoPublish = ctx.now() - startTime;

  // Phase 7 — policy-gated external content publish. ONE approval covers all
  // three pieces; on approval the per-piece executors run via ctx.parallel.all,
  // each guarded by that single approval.
  ctx.log?.('info', 'Phase 7: policy-gated external content publish');
  const contentApproval = await routedBreakpoint(ctx, {
    question: `Approve publishing the devrel content for product change '${productChange.id}'? This single approval covers ALL THREE pieces: blog (via ${channelFor('blog')}), tutorial (via ${channelFor('tutorial')}), and video-script (via ${channelFor('video-script')}). Embargo: ${embargoUntil ?? 'none'}. Edits in your response supersede the drafts verbatim. Rejection records the decision and publishes nothing.`,
    title: 'External content publish approval',
    context: {
      runId: ctx.runId,
      files: CONTENT_PIECES.map((p) => ({ path: content[p].piecePath, label: `${p} piece` })),
      summary: {
        pieces: CONTENT_PIECES.map((p) => ({ piece: p, title: content[p].title, channel: channelFor(p), snippetCount: content[p].snippetCount })),
        embargoUntil,
        gate: gateSummary.content,
      },
    },
  }, {
    breakpointId: actionFor('blog'),
    expert: expertFor(actionFor('blog')),
    tags: ['policy-gated', 'developer-relations'],
    strategy: 'single',
  });
  breakpointsHit.push(actionFor('blog'));

  if (contentApproval.approved === true) {
    const approvalResponse = contentApproval.response ?? contentApproval.feedback ?? null;
    const contentPublishResults = await ctx.parallel.all(
      CONTENT_PIECES.map((piece) => () =>
        ctx.task(publishContentTask, {
          ...sharedArgs,
          piece,
          channel: channelFor(piece),
          contentPiece: content[piece],
          embargoUntil,
          approvalResponse,
        })
      )
    );
    for (let i = 0; i < CONTENT_PIECES.length; i++) {
      publishes[CONTENT_PIECES[i]] = contentPublishResults[i];
    }
  }
  gatedActions.externalContentPublish = recordGatedAction(
    'external-content-publish', true, contentApproval,
    CONTENT_PIECES.every((p) => publishes[p]?.published === true)
  );
  timings.contentPublish = ctx.now() - startTime;

  // Phase 8 — community triage loop setup (draft-only) then the conditional
  // community-reply-send gate. The breakpoint is raised ONLY when repliesDrafted
  // > 0; the executor runs ONLY on approved === true.
  ctx.log?.('info', 'Phase 8: community triage loop setup');
  const triage = await ctx.task(setupCommunityTriageTask, {
    ...sharedArgs,
    intake,
    content,
    priorKnowledge,
  });
  let repliesSent = 0;
  let replyApproval = null;
  if (triage.repliesDrafted > 0) {
    replyApproval = await routedBreakpoint(ctx, {
      question: `Approve sending ${triage.repliesDrafted} drafted community ${triage.repliesDrafted === 1 ? 'reply' : 'replies'} on the org's behalf for '${productChange.id}'? Edits in your response supersede the drafts verbatim. Rejection records the decision and sends nothing.`,
      title: 'Community reply send approval',
      context: {
        runId: ctx.runId,
        files: (triage.draftedReplies ?? []).map((d) => ({ path: d.draftPath, label: `Reply ${d.threadRef} (${d.category})` })),
        summary: {
          threadsScanned: triage.threadsScanned,
          repliesDrafted: triage.repliesDrafted,
          matchedThreads: (triage.draftedReplies ?? []).map((d) => ({ threadRef: d.threadRef, category: d.category })),
        },
      },
    }, {
      breakpointId: 'community-reply-send',
      expert: expertFor('community-reply-send'),
      tags: ['policy-gated', 'developer-relations'],
      strategy: 'single',
    });
    breakpointsHit.push('community-reply-send');

    if (replyApproval.approved === true) {
      const sendResult = await ctx.task(sendCommunityRepliesTask, {
        ...sharedArgs,
        draftedReplies: triage.draftedReplies ?? [],
        approvalResponse: replyApproval.response ?? replyApproval.feedback ?? null,
      });
      repliesSent = sendResult.repliesSent ?? 0;
      publishes.communityReplies = sendResult;
    }
    gatedActions.communityReplySend = recordGatedAction(
      'community-reply-send', true, replyApproval, repliesSent > 0
    );
  }
  // Zero drafted replies: the gate stays recorded as skipped (initialized above),
  // never fabricated. repliesSent stays 0.
  const communityTriage = {
    threadsScanned: triage.threadsScanned,
    repliesDrafted: triage.repliesDrafted,
    repliesSent,
    faqCandidates: triage.faqCandidates ?? [],
  };
  timings.communityTriage = ctx.now() - startTime;

  // Phase 9 — engagement retro + kip assert.
  ctx.log?.('info', 'Phase 9: engagement retro + kip assert');
  const retroResult = await ctx.task(engagementRetroTask, {
    ...sharedArgs,
    intake,
    sampleApps,
    sampleAppGate,
    content,
    contentGate,
    gatedActions,
    publishes,
    communityTriage,
  });
  const retro = { retroPath: retroResult.retroPath, learnings: retroResult.learnings ?? [] };
  timings.retro = ctx.now() - startTime;

  let kipFactsAsserted = 0;
  if (kipEnabled) {
    const facts = [
      ...CONTENT_PIECES.map((piece) => ({
        subject: `content:${piece}`,
        predicate: 'published-to',
        object: channelFor(piece),
        props: {
          productChangeId: productChange.id,
          required: gatedActions.externalContentPublish.required,
          approved: gatedActions.externalContentPublish.approved,
          autoApproved: gatedActions.externalContentPublish.autoApproved,
          executed: publishes[piece]?.published === true,
          publishedUrl: publishes[piece]?.publishedUrl ?? null,
        },
      })),
      ...Object.values(sampleApps).map((s) => ({
        subject: `sample-app:${s.specId}`,
        predicate: 'accuracy-verified',
        object: 'developer-relations.sample-app-accuracy',
        props: { passed: sampleAppGate.passed, escalated: sampleAppGate.escalated, runOutputPath: s.runOutputPath },
      })),
      {
        subject: `productChange:${productChange.id}`,
        predicate: 'has-content-gate',
        object: 'developer-relations.content-accuracy',
        props: { passed: contentGate.passed, attempts: contentGate.attempts, escalated: contentGate.escalated },
      },
      ...communityTriage.faqCandidates.map((faq) => ({
        subject: `faq:${faq.question}`,
        predicate: 'answered-by',
        object: faq.sourceContent ?? 'devrel-campaign',
        props: { answer: faq.answer ?? null, productChangeId: productChange.id },
      })),
      {
        subject: `productChange:${productChange.id}`,
        predicate: 'community-thread-outcome',
        object: 'community-reply-send',
        props: {
          threadsScanned: communityTriage.threadsScanned,
          repliesDrafted: communityTriage.repliesDrafted,
          repliesSent: communityTriage.repliesSent,
          required: gatedActions.communityReplySend.required,
          approved: gatedActions.communityReplySend.approved,
          autoApproved: gatedActions.communityReplySend.autoApproved,
        },
      },
    ];
    const capture = await kipAssert(ctx, {
      kipDir,
      kipModel,
      kind: 'developer-relations',
      facts,
    });
    kipFactsAsserted = capture.asserted;
  }
  timings.kipAssert = ctx.now() - startTime;

  const artifacts = [
    ...Object.values(sampleApps).flatMap((s) => [s.appPath, s.runOutputPath]),
    ...CONTENT_PIECES.map((p) => content[p].piecePath),
    retro.retroPath,
  ];
  if (publishes.sampleRepo?.publishRecordPath) artifacts.push(publishes.sampleRepo.publishRecordPath);
  for (const p of CONTENT_PIECES) {
    if (publishes[p]?.publishRecordPath) artifacts.push(publishes[p].publishRecordPath);
  }
  if (publishes.communityReplies?.sendRecordPath) artifacts.push(publishes.communityReplies.sendRecordPath);

  return {
    success:
      sampleAppGate.passed &&
      contentGate.passed &&
      Object.values(gatedActions).every((a) => !a.required || a.approved === a.executed),
    intake,
    sampleApps,
    sampleAppGate,
    content,
    contentGate,
    gatedActions,
    publishes,
    communityTriage,
    retro,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'developer-relations/devrel-campaign',
      runId: ctx.runId,
      productChangeId: productChange.id,
      breakpointsHit,
      timings: { ...timings, total: ctx.now() - startTime },
    },
  };
}
