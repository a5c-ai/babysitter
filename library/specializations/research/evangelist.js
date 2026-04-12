/**
 * @process specializations/research/evangelist
 * @description Evangelist persona (a5c evangelist-agent). Scans for novelties, breakthroughs,
 *   amazing use cases, and marketable anecdotes. For each discovery, writes a report with
 *   marketing insight, source, and a lay-person explanation, then opens a GitHub issue
 *   titled `Evangelist Report: <Item Title>` tagged with the "evangelist" label.
 * @inputs { scope?: string, since?: string }
 * @outputs { success: boolean, itemsFound: number, issuesOpened: number[] }
 *
 * Source: a5c-ai/registry/prompts/research/evangelist-agent.prompt.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const scanTask = defineTask(
  'evangelist.scan-novelties',
  async ({ scope, since }, ctx) => {
    return ctx.agent({
      title: 'Evangelist: scan for marketable novelties',
      prompt: [
        'You are the evangelist-agent.',
        'Scan the project (commits, PRs, docs, release notes, benchmarks) for novelties, amazing use cases, anecdotes, and examples suitable for marketing or publication.',
        `Scope: ${scope ?? 'whole repo'}`,
        `Since: ${since ?? 'last 30 days'}`,
        'Return JSON: { items: Array<{ title, marketingInsight, source, layExplanation }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Evangelist scan', labels: ['a5c', 'evangelist'] },
);

const fileReportsTask = defineTask(
  'evangelist.file-reports',
  async ({ items }, ctx) => {
    return ctx.agent({
      title: `Evangelist: open ${items?.length ?? 0} report issue(s)`,
      prompt: [
        'You are the evangelist-agent. For each item, open a GitHub issue via `gh issue create`.',
        'Title: `Evangelist Report: <Item Title>`.',
        'Body: marketing insight + source + lay explanation (as a core for downstream content).',
        'Labels: ["evangelist"].',
        `Items: ${JSON.stringify(items ?? [], null, 2)}`,
        'Return JSON: { issuesOpened: number[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Evangelist file reports', labels: ['a5c', 'evangelist'] },
);

export async function process(inputs, ctx) {
  const { scope, since } = inputs ?? {};
  const scan = await ctx.task(scanTask, { scope, since });
  const items = Array.isArray(scan?.items) ? scan.items : [];
  if (items.length === 0) {
    return { success: true, itemsFound: 0, issuesOpened: [] };
  }
  const filed = await ctx.task(fileReportsTask, { items });
  return {
    success: true,
    itemsFound: items.length,
    issuesOpened: Array.isArray(filed?.issuesOpened) ? filed.issuesOpened : [],
  };
}
