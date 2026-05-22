/**
 * @process specializations/media/media-production-pipeline
 * @description End-to-end media production: brief → research → script → storyboard → produce → review-gates (editorial, legal, brand) → publish → measure → iterate. Single workflow covering what would otherwise be a dozen role hand-offs.
 * @inputs { brief: { title, objective, audience, channel: "video"|"podcast"|"article"|"social", constraints?: object }, priorAssets?: Array<object>, deadline?: string, reviewers?: { editorial?: string, legal?: string, brand?: string }, publishTargets?: Array<{ platform, handle }> }
 * @outputs { success: boolean, assetUrls: Array<string>, reviewGateStatus: object, publishResults: Array<object>, metrics?: object, blockers?: Array<string> }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:media]
 *   skillAreas: [skill-area:media-encoding, skill-area:streaming-protocols, skill-area:video-processing, skill-area:audio-processing]
 *   topics: [topic:developer-experience]
 *   roles: [role:media-engineer, role:platform-engineer]
 *   workflows: [workflow:data-pipeline-deployment]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const researchTask = defineTask(
  'media.research',
  async ({ brief }, ctx) => {
    return ctx.agent({
      title: 'Research angle + sources',
      prompt: [
        'Research the angle for this media brief. Identify 3-5 credible primary sources, competing angles already in-market, and a tension worth exploring.',
        `Brief: ${JSON.stringify(brief, null, 2)}`,
        'Return JSON: { angle, tension, primarySources: Array<{ title, url, relevance }>, competingAngles: string[], riskyClaims: string[] }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Research', labels: ['media', 'editorial'] },
);

const scriptTask = defineTask(
  'media.script',
  async ({ brief, research }, ctx) => {
    return ctx.agent({
      title: `Draft ${brief.channel} script/outline`,
      prompt: [
        `Draft a script/outline appropriate for channel "${brief.channel}".`,
        `Brief: ${JSON.stringify(brief, null, 2)}`,
        `Research: ${JSON.stringify(research, null, 2)}`,
        'Channel conventions:',
        '- video: hook (≤ 5s) → context → body (3-act) → CTA. Include shot notes and b-roll suggestions.',
        '- podcast: cold-open → intro → segments (with timecodes) → outro. Include pull-quotes.',
        '- article: lede → nut-graf → body → kicker. Include pull-quotes + subhead hierarchy.',
        '- social: platform-native format; no cross-posted generics.',
        'Return JSON: { script, pullQuotes: string[], productionNotes: string[], estimatedLengthMinutes?: number, estimatedWordCount?: number }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Script', labels: ['media', 'script'] },
);

const produceTask = defineTask(
  'media.produce',
  async ({ brief, script, priorAssets }, ctx) => {
    return ctx.agent({
      title: 'Produce media asset',
      prompt: [
        'Produce the media asset per the script. For code-generated content (article markdown, social posts), produce the final content. For video/podcast, produce the finished edit manifest (cuts, transitions, audio-bed, titles).',
        `Channel: ${brief.channel}`,
        `Script: ${JSON.stringify(script, null, 2)}`,
        `Prior reusable assets: ${JSON.stringify(priorAssets ?? [])}`,
        'Return JSON: { assetUrls: string[], editManifest?: object, articleMarkdown?: string, socialVariants?: Array<{ platform, text }> }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Produce', labels: ['media', 'production'] },
);

const reviewGateTask = defineTask(
  'media.review-gate',
  async ({ gate, reviewer, asset, previousFeedback }, ctx) => {
    return ctx.breakpoint({
      breakpointId: `media.review-gate.${gate}`,
      title: `${gate} review of media asset`,
      expert: reviewer,
      tags: ['media', gate],
      previousFeedback,
      prompt: [
        `Please review the asset for ${gate} concerns.`,
        `Asset: ${JSON.stringify(asset, null, 2)}`,
        gate === 'editorial' ? 'Editorial: accuracy, tone, structure, fact-check.' : '',
        gate === 'legal' ? 'Legal: IP, defamation, regulated claims, consent.' : '',
        gate === 'brand' ? 'Brand: voice, visual system, positioning, audience fit.' : '',
        'Approve, or reject with specific required changes.',
      ].filter(Boolean).join('\n\n'),
    });
  },
  { kind: 'breakpoint', title: 'Review gate', labels: ['media', 'review'] },
);

const publishTask = defineTask(
  'media.publish',
  async ({ target, asset }, ctx) => {
    return ctx.agent({
      title: `Publish to ${target.platform}`,
      prompt: [
        `Publish the asset to ${target.platform} (handle: ${target.handle}).`,
        `Asset: ${JSON.stringify(asset, null, 2)}`,
        'Respect platform constraints (char limits, aspect ratio, alt text, hashtags).',
        'Return JSON: { success: boolean, url?: string, postId?: string, error?: string }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Publish', labels: ['media', 'publish'] },
);

const measureTask = defineTask(
  'media.measure',
  async ({ publishResults }, ctx) => {
    return ctx.agent({
      title: 'Measure initial performance',
      prompt: [
        'Collect 24h post-publish metrics across the platforms.',
        `Published: ${JSON.stringify(publishResults, null, 2)}`,
        'Return JSON: { metrics: Array<{ platform, postId, views, engagements, saves?, completionRate? }>, notables: string[] }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Measure', labels: ['media', 'metrics'] },
);

async function runGate(ctx, gate, reviewer, asset) {
  let previousFeedback;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const result = await ctx.task(reviewGateTask, { gate, reviewer, asset, previousFeedback });
    if (result.approved) return { approved: true, attempts: attempt };
    previousFeedback = result.feedback ?? result.response;
    if (!previousFeedback) return { approved: false, attempts: attempt, reason: 'rejected-without-feedback' };
  }
  return { approved: false, attempts: 3, reason: 'max-attempts-exceeded' };
}

export async function process(inputs, ctx) {
  const { brief, priorAssets, reviewers = {}, publishTargets = [] } = inputs;

  const research = await ctx.task(researchTask, { brief });
  const script = await ctx.task(scriptTask, { brief, research });
  const asset = await ctx.task(produceTask, { brief, script, priorAssets });

  const reviewGateStatus = {};
  for (const gate of ['editorial', 'legal', 'brand']) {
    if (!reviewers[gate]) continue;
    const result = await runGate(ctx, gate, reviewers[gate], asset);
    reviewGateStatus[gate] = result;
    if (!result.approved) {
      return {
        success: false,
        assetUrls: asset.assetUrls ?? [],
        reviewGateStatus,
        publishResults: [],
        blockers: [`${gate}-review-failed: ${result.reason}`],
      };
    }
  }

  const publishResults = publishTargets.length > 0
    ? await ctx.parallel.map(publishTargets, (target) => ctx.task(publishTask, { target, asset }))
    : [];

  let metrics;
  if (publishResults.some((r) => r.success)) {
    const m = await ctx.task(measureTask, { publishResults });
    metrics = m;
  }

  return {
    success: publishResults.every((r) => r.success !== false),
    assetUrls: asset.assetUrls ?? [],
    reviewGateStatus,
    publishResults,
    metrics,
  };
}
