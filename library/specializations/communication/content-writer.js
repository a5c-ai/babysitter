/**
 * @process specializations/communication/content-writer
 * @description Content-writer persona (a5c content-writer-agent). Translates technical
 *   information into clear, engaging copy for mixed or non-technical audiences across
 *   channels (blog, social, sales, docs-for-non-technical, email), preserving brand voice
 *   and business value while maintaining technical accuracy.
 * @inputs { brief: string, channel?: string, audience?: string, sources?: string[] }
 * @outputs { success: boolean, draftPath?: string, variants?: object }
 *
 * Source: a5c-ai/registry/prompts/communication/content-writer-agent.prompt.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const planTask = defineTask(
  'content-writer.plan',
  async ({ brief, channel, audience, sources }, ctx) => {
    return ctx.agent({
      title: 'Content-writer: brief + structure',
      prompt: [
        'You are the content-writer-agent.',
        'Analyze requirements, audience, channel, desired outcome/KPIs. Gather technical info + industry context + audience pain points.',
        'Produce a content brief: key messages, structure, narrative arc, headline strategy, intro hook.',
        `Brief: ${brief ?? '(unspecified)'}`,
        `Channel: ${channel ?? 'blog'}`,
        `Audience: ${audience ?? 'mixed'}`,
        `Sources: ${JSON.stringify(sources ?? [])}`,
        'Return JSON: { keyMessages: string[], structure: object, headlineOptions: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Content-writer plan', labels: ['a5c', 'content-writer'] },
);

const draftTask = defineTask(
  'content-writer.draft',
  async ({ plan, channel, audience }, ctx) => {
    return ctx.agent({
      title: 'Content-writer: draft + multi-channel variants',
      prompt: [
        'You are the content-writer-agent. Produce the primary draft + channel variants.',
        'Rules: audience-first; connect technical features to business benefits; quantify advantages; never sacrifice accuracy for simplicity.',
        'Channel guidance:',
        ' - Blog: conversational-professional, subheadings, examples, CTAs.',
        ' - Social: concise, hooks, hashtags, suggested visuals.',
        ' - Sales: clear value props, benefit language, proof points, CTAs.',
        ' - Technical docs for non-technical users: step-by-step, visuals, acronym definitions.',
        ' - Email: strong subject + preview, scannable, personalization, next steps.',
        `Plan: ${JSON.stringify(plan ?? {}, null, 2)}`,
        `Primary channel: ${channel ?? 'blog'}`,
        `Audience: ${audience ?? 'mixed'}`,
        'Return JSON: { draftPath, variants: { blog?, social?, sales?, email?, docs? } }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Content-writer draft', labels: ['a5c', 'content-writer'] },
);

export async function process(inputs, ctx) {
  const { brief = '', channel, audience, sources } = inputs ?? {};
  const plan = await ctx.task(planTask, { brief, channel, audience, sources });
  const draft = await ctx.task(draftTask, { plan, channel, audience });
  return {
    success: true,
    draftPath: draft?.draftPath,
    variants: draft?.variants,
  };
}
