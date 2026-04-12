/**
 * @process specializations/research/project-news-analyzer
 * @description Project-news-analyzer persona. Reviews industry news, competitor moves,
 *   framework releases, and security advisories, then maps them to concrete project
 *   recommendations (actions, risks, opportunities) filed as GitHub issues.
 *
 *   NOTE: The registry does not (as of 2026-04) ship a canonical
 *   project-news-analyzer-agent.prompt.md — see a5c-ai/registry/prompts/research. This
 *   file is a best-effort distillation of the role described in the phase-16 brief,
 *   written in the same style as the other a5c personas.
 * @inputs { topics?: string[], since?: string }
 * @outputs { success: boolean, recommendationsFiled: number[] }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const newsScanTask = defineTask(
  'project-news-analyzer.scan',
  async ({ topics, since }, ctx) => {
    return ctx.agent({
      title: 'Project-news-analyzer: industry scan',
      prompt: [
        'You are the project-news-analyzer-agent.',
        'Review recent industry news, competitor moves, framework/runtime releases, and security advisories.',
        `Topics: ${JSON.stringify(topics ?? ['stack', 'security', 'competitors'])}`,
        `Since: ${since ?? 'last 14 days'}`,
        'Return JSON: { items: Array<{ headline, source, date, category, relevance }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Project-news-analyzer scan', labels: ['a5c', 'project-news-analyzer'] },
);

const recommendTask = defineTask(
  'project-news-analyzer.recommend',
  async ({ items }, ctx) => {
    return ctx.agent({
      title: 'Project-news-analyzer: file recommendations',
      prompt: [
        'You are the project-news-analyzer-agent.',
        'For each relevant news item, produce a project recommendation: action, rationale, risk/opportunity, priority.',
        'File each as a GitHub issue via `gh issue create` with label "project-news".',
        'Mention @producer-agent in the body so the recommendation can be folded into the roadmap.',
        `Items: ${JSON.stringify(items ?? [], null, 2)}`,
        'Return JSON: { issuesOpened: number[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Project-news-analyzer recommend', labels: ['a5c', 'project-news-analyzer'] },
);

export async function process(inputs, ctx) {
  const { topics, since } = inputs ?? {};
  const scan = await ctx.task(newsScanTask, { topics, since });
  const items = Array.isArray(scan?.items) ? scan.items : [];
  if (items.length === 0) {
    return { success: true, recommendationsFiled: [] };
  }
  const rec = await ctx.task(recommendTask, { items });
  return {
    success: true,
    recommendationsFiled: Array.isArray(rec?.issuesOpened) ? rec.issuesOpened : [],
  };
}
