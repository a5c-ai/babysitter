/**
 * @process specializations/research/evangelist
 * @description Evangelist persona. Scans recent project activity (commits, PRs, docs,
 *   releases, benchmarks) → filters for marketable novelties → drafts a
 *   marketing-insight + source + lay-explanation report per item → opens a GitHub issue
 *   "Evangelist Report: <Item Title>" per item (batched in parallel).
 * @inputs { scope?: string, since?: string }
 * @outputs { success, itemsFound, itemsMarketable, issuesOpened }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/research/evangelist-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:research]
 *   skillAreas: [skill-area:deep-web-research, skill-area:docs-as-code]
 *   topics: [topic:developer-experience]
 *   workflows: [workflow:feature-development]
 *   roles: [role:research-engineer, role:tech-lead, role:platform-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const scanRecentActivityTask = defineTask(
  'evangelist.scan-recent-activity',
  async ({ scope, since }, ctx) => {
    return ctx.agent({
      title: 'Evangelist: scan recent activity',
      prompt: [
        'Scan the project for noteworthy items: novelties, breakthroughs, amazing use cases, anecdotes, benchmarks, examples.',
        'Sources: commits, PRs (merged), docs changes, release notes, benchmark outputs, user-reported anecdotes.',
        `Scope: ${scope ?? 'whole repo'}`,
        `Since: ${since ?? 'last 30 days'}`,
        'Return JSON: { items: Array<{ title, source, summary, category }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Evangelist scan activity', labels: ['a5c', 'evangelist'] },
);

const filterMarketableTask = defineTask(
  'evangelist.filter-marketable',
  async ({ items }, ctx) => {
    return ctx.agent({
      title: `Evangelist: filter ${items.length} item(s) for marketability`,
      prompt: [
        'Keep only items suitable for promotion/marketing/publication. Drop routine chore items and internal-only changes.',
        `Items: ${JSON.stringify(items, null, 2)}`,
        'Return JSON: { marketable: Array<same-shape> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Evangelist filter marketable', labels: ['a5c', 'evangelist'] },
);

const draftReportTask = defineTask(
  'evangelist.draft-report',
  async ({ item }, ctx) => {
    return ctx.agent({
      title: `Evangelist: draft report for "${item.title}"`,
      prompt: [
        'Draft a detailed item report with three required sections:',
        '  - Marketing Insight: why this is worth marketing / a breakthrough / amazing.',
        '  - Source: exact link / commit / PR / benchmark ref.',
        '  - Lay Explanation: plain-language explanation suitable as a content-piece core.',
        `Item: ${JSON.stringify(item, null, 2)}`,
        'Return JSON: { title, body }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Evangelist draft report', labels: ['a5c', 'evangelist'] },
);

const fileReportIssueTask = defineTask(
  'evangelist.file-report-issue',
  async ({ report }, ctx) => {
    return ctx.agent({
      title: `Evangelist: file issue for "${report.title}"`,
      prompt: [
        'Open a GitHub issue via gh issue create.',
        '  Title: `Evangelist Report: <Item Title>`',
        '  Body: the full report (marketing insight + source + lay explanation).',
        '  Labels: ["evangelist"].',
        `Report: ${JSON.stringify(report, null, 2)}`,
        'Return JSON: { issueNumber: number, url: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Evangelist file issue', labels: ['a5c', 'evangelist'] },
);

export async function process(inputs, ctx) {
  const { scope, since } = inputs ?? {};
  const scan = await ctx.task(scanRecentActivityTask, { scope, since });
  const items = Array.isArray(scan?.items) ? scan.items : [];
  if (items.length === 0) {
    return { success: true, itemsFound: 0, itemsMarketable: 0, issuesOpened: [] };
  }

  const filtered = await ctx.task(filterMarketableTask, { items });
  const marketable = Array.isArray(filtered?.marketable) ? filtered.marketable : [];
  if (marketable.length === 0) {
    return { success: true, itemsFound: items.length, itemsMarketable: 0, issuesOpened: [] };
  }

  // Draft each report in parallel — independent content.
  const reports = await ctx.parallel.map(marketable, (item) => ctx.task(draftReportTask, { item }));
  const validReports = reports.filter((r) => r && r.title && r.body);

  // File each issue in parallel.
  const filed = await ctx.parallel.map(validReports, (report) => ctx.task(fileReportIssueTask, { report }));
  const issuesOpened = filed.map((f) => f?.issueNumber).filter((n) => Number.isFinite(n));

  return {
    success: true,
    itemsFound: items.length,
    itemsMarketable: marketable.length,
    issuesOpened,
  };
}
