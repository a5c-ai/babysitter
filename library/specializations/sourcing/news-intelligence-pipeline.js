/**
 * @process specializations/sourcing/news-intelligence-pipeline
 * @description End-to-end sourcing + intelligence workflow: discover → monitor → dedupe → filter-signal → per-portfolio impact-assess → synthesize → route alerts → track follow-through. Unifies what was previously split across "sourcing" and "news-impact-assessment" roles.
 * @inputs { portfolio: Array<{ id, name, exposure, stakeholders: string[] }>, sources?: Array<{ kind: "rss"|"api"|"scrape"|"email", ref: string, trust: "high"|"medium"|"low" }>, window: { from: string, to: string }, previousDigest?: object, alertChannels?: Array<{ kind: "slack"|"email"|"issue", target: string, severityFloor: "info"|"warn"|"block" }>, horizon?: "immediate"|"quarter"|"year" }
 * @outputs { success: boolean, digest: object, alertsRouted: Array<object>, followUpIssues: Array<object>, suppressed: boolean, suppressReason?: string }
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:api-clients-sdks, skill-area:deep-web-research, skill-area:data-analysis, skill-area:talent-acquisition-strategy]
 *   topics: [topic:developer-experience]
 *   workflows: [workflow:talent-acquisition-pipeline]
 *   roles: [role:talent-recruiter, role:platform-engineer, role:tech-lead]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const harvestTask = defineTask(
  'news-intel.harvest',
  async ({ source, window }, ctx) => {
    return ctx.agent({
      title: `Harvest from ${source.kind}:${source.ref}`,
      prompt: [
        `Fetch items from source "${source.ref}" (${source.kind}, trust=${source.trust}) within ${window.from} → ${window.to}.`,
        'Normalize each item to: { id, headline, body, url, publishedAt, authors, source: {kind, ref, trust} }.',
        'Drop items outside the window.',
        'Return JSON: { items: Array<NormalizedItem> }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Harvest source', labels: ['sourcing', 'news'] },
);

const dedupeFilterTask = defineTask(
  'news-intel.dedupe-filter',
  async ({ items, portfolio, previousDigest }, ctx) => {
    return ctx.agent({
      title: 'Dedupe and filter signal',
      prompt: [
        'Collapse duplicate/syndicated coverage (same story, different outlet) into a single item, preserving source diversity as evidence.',
        'Filter out items with zero plausible bearing on any portfolio entry.',
        `Portfolio: ${JSON.stringify(portfolio, null, 2)}`,
        `Previously digested headlines (avoid re-reporting identical stories): ${JSON.stringify((previousDigest?.topImpacts ?? []).map((t) => t.headline).filter(Boolean))}`,
        `Candidate items (${items.length}): ${JSON.stringify(items.slice(0, 200), null, 2)}`,
        'Return JSON: { survivors: Array<{ clusterId, headline, body, urls: string[], publishedAt, sourceDiversity: number, trustTier: "high"|"medium"|"low", candidatePortfolioIds: string[] }>, droppedCount: number }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Dedupe + filter', labels: ['sourcing', 'news', 'filter'] },
);

const assessTask = defineTask(
  'news-intel.assess',
  async ({ cluster, entry, horizon }, ctx) => {
    return ctx.agent({
      title: `Impact: "${cluster.headline}" on "${entry.name}"`,
      prompt: [
        'Assess the impact of the news cluster on the portfolio entry.',
        `Cluster: ${JSON.stringify(cluster, null, 2)}`,
        `Entry exposure: ${entry.exposure}`,
        `Stakeholders: ${JSON.stringify(entry.stakeholders)}`,
        `Horizon: ${horizon}`,
        'Consider: direct revenue exposure, regulatory/compliance fallout, competitive positioning, supply-chain ripple, reputational risk, opportunity windows, narrative-shift risk.',
        'If the cluster has low source diversity + low trust, cap magnitude at 2 and set confidence low.',
        'Return JSON: { entryId, direction: "positive"|"negative"|"mixed"|"neutral", magnitude: 1|2|3|4|5, confidence: "low"|"medium"|"high", severity: "info"|"warn"|"block", rationale, actions: Array<{ owner?: string, due?: string, description }> }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Assess cluster-entry impact', labels: ['intelligence', 'news'] },
);

const synthesizeTask = defineTask(
  'news-intel.synthesize',
  async ({ assessments, survivors, window, previousDigest }, ctx) => {
    return ctx.agent({
      title: 'Synthesize portfolio-level digest',
      prompt: [
        `Synthesize a portfolio-level intelligence digest for ${window.from} → ${window.to}.`,
        `Previous digest: ${JSON.stringify(previousDigest ?? null, null, 2)}`,
        `Assessments: ${JSON.stringify(assessments, null, 2)}`,
        `Clusters: ${JSON.stringify(survivors.map((s) => ({ clusterId: s.clusterId, headline: s.headline })), null, 2)}`,
        'Quiet-weeks-stay-quiet: if nothing material changed vs. the previous digest, return suppressed=true with a reason.',
        'Otherwise return a report with: window, executiveSummary (2-3 sentences), topImpacts (ranked by magnitude × confidence), deltas vs previous digest, recommendedActions (grouped by owner), watchlist (items worth tracking next window).',
        'Return JSON: { suppressed: boolean, suppressReason?: string, digest?: { window, executiveSummary, topImpacts, deltas, recommendedActions, watchlist } }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Synthesize digest', labels: ['intelligence', 'news'] },
);

const routeAlertTask = defineTask(
  'news-intel.route-alert',
  async ({ channel, digest, assessments }, ctx) => {
    return ctx.agent({
      title: `Route alerts → ${channel.kind}:${channel.target}`,
      prompt: [
        `Route alerts for channel ${channel.kind}:${channel.target} (severity floor: ${channel.severityFloor}).`,
        `Digest: ${JSON.stringify(digest, null, 2)}`,
        `Filter assessments to those at or above severity floor: ${JSON.stringify(assessments.filter((a) => severityRank(a.severity) >= severityRank(channel.severityFloor)), null, 2)}`,
        'Compose a channel-appropriate message (Slack: compact blocks; email: structured; issue: markdown with task checklist).',
        'Return JSON: { sent: boolean, messageId?: string, body: string, recipients: string[] }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Route alert', labels: ['intelligence', 'alerting'] },
);

const followUpTask = defineTask(
  'news-intel.follow-up',
  async ({ digest }, ctx) => {
    return ctx.agent({
      title: 'Open follow-up issues for action items',
      prompt: [
        'For each recommended action in the digest, open/update a tracking issue so nothing slips.',
        `Digest: ${JSON.stringify(digest, null, 2)}`,
        'Deduplicate against existing open tracking issues (search by stable title/body signature).',
        'Return JSON: { issues: Array<{ number?: number, title, url?: string, action: "created"|"updated"|"existed" }> }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Open follow-ups', labels: ['intelligence', 'follow-through'] },
);

function severityRank(s) {
  return { info: 0, warn: 1, block: 2 }[s] ?? 0;
}

export async function process(inputs, ctx) {
  const {
    portfolio = [],
    sources = [],
    window,
    previousDigest,
    alertChannels = [],
    horizon = 'quarter',
  } = inputs;

  // 1) Harvest (parallel across sources)
  const harvested = sources.length > 0
    ? await ctx.parallel.map(sources, (source) => ctx.task(harvestTask, { source, window }))
    : [];
  const allItems = harvested.flatMap((h) => h.items ?? []);

  if (allItems.length === 0) {
    return { success: true, digest: null, alertsRouted: [], followUpIssues: [], suppressed: true, suppressReason: 'no-items-harvested' };
  }

  // 2) Dedupe + filter to signal
  const filtered = await ctx.task(dedupeFilterTask, { items: allItems, portfolio, previousDigest });
  const survivors = filtered.survivors ?? [];

  if (survivors.length === 0) {
    return { success: true, digest: null, alertsRouted: [], followUpIssues: [], suppressed: true, suppressReason: 'no-signal-after-filter' };
  }

  // 3) Per cluster × candidate-entry impact assessment (parallel)
  const pairs = [];
  for (const cluster of survivors) {
    for (const entryId of cluster.candidatePortfolioIds ?? []) {
      const entry = portfolio.find((p) => p.id === entryId);
      if (entry) pairs.push({ cluster, entry });
    }
  }
  const assessments = pairs.length > 0
    ? await ctx.parallel.map(pairs, (pair) => ctx.task(assessTask, { ...pair, horizon }))
    : [];

  // 4) Synthesize (with suppression)
  const synthesis = await ctx.task(synthesizeTask, { assessments, survivors, window, previousDigest });
  if (synthesis.suppressed) {
    return { success: true, digest: null, alertsRouted: [], followUpIssues: [], suppressed: true, suppressReason: synthesis.suppressReason };
  }

  // 5) Route alerts (parallel across channels)
  const alertsRouted = alertChannels.length > 0
    ? await ctx.parallel.map(alertChannels, (channel) =>
        ctx.task(routeAlertTask, { channel, digest: synthesis.digest, assessments }),
      )
    : [];

  // 6) Open/update follow-up issues
  const followUps = await ctx.task(followUpTask, { digest: synthesis.digest });

  return {
    success: true,
    digest: synthesis.digest,
    alertsRouted,
    followUpIssues: followUps.issues ?? [],
    suppressed: false,
  };
}
