/**
 * @process specializations/communication/content-writer
 * @description Content-writer persona. Brief (audience/purpose/channel/KPIs) → plan (structure,
 *   narrative, headline) → draft (accessible language, examples, CTAs) → self-edit + SEO pass →
 *   optional multi-channel variations.
 * @inputs { topic: string, audience?: string, channel?: string, goal?: string, variations?: string[] }
 * @outputs { success, brief, draftPath?, variationPaths }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/communication/content-writer-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:communication]
 *   skillAreas: [skill-area:docs-as-code, skill-area:reference-docs, skill-area:content-marketing]
 *   workflows: [workflow:post-mortem-review]
 *   roles: [role:tech-lead, role:engineering-manager, role:technical-writer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const briefTask = defineTask(
  'content-writer.brief',
  async ({ topic, audience, channel, goal }, ctx) => {
    return ctx.agent({
      title: 'Content-writer: build content brief',
      prompt: [
        'Produce a content brief: audience (technical level / needs / pain-points), purpose, channel, desired outcome, KPIs.',
        'Extract the core value proposition in one sentence.',
        `Topic: ${topic ?? '(unspecified)'}`,
        `Audience: ${audience ?? '(unspecified)'}`,
        `Channel: ${channel ?? 'blog'}`,
        `Goal: ${goal ?? 'inform'}`,
        'Return JSON: { audience, purpose, channel, kpis: string[], coreValue: string, tone: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Content-writer brief', labels: ['a5c', 'content-writer'] },
);

const planTask = defineTask(
  'content-writer.plan',
  async ({ brief, topic }, ctx) => {
    return ctx.agent({
      title: 'Content-writer: plan structure + narrative',
      prompt: [
        'Plan the content structure: headline options, intro hook, logical section progression, key takeaways, CTA.',
        'Use storytelling where appropriate. Tailor the hook to the channel.',
        `Brief: ${JSON.stringify(brief, null, 2)}`,
        `Topic: ${topic}`,
        'Return JSON: { headlineOptions: string[], outline: Array<{ heading, bullets: string[] }>, cta: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Content-writer plan', labels: ['a5c', 'content-writer'] },
);

const draftTask = defineTask(
  'content-writer.draft',
  async ({ brief, plan }, ctx) => {
    return ctx.agent({
      title: 'Content-writer: write first draft',
      prompt: [
        'Write the draft in clear, jargon-free language (unless the audience demands jargon).',
        'Use analogies and real examples for complex concepts. Connect features to business benefits with quantified impact when possible.',
        'Keep voice/tone aligned to the brief.',
        `Brief: ${JSON.stringify(brief, null, 2)}`,
        `Plan: ${JSON.stringify(plan, null, 2)}`,
        'Return JSON: { title: string, draft: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Content-writer draft', labels: ['a5c', 'content-writer'] },
);

const selfEditTask = defineTask(
  'content-writer.self-edit',
  async ({ draft }, ctx) => {
    return ctx.agent({
      title: 'Content-writer: self-edit + SEO pass',
      prompt: [
        'Refine for clarity, engagement, and impact. Apply SEO basics (headline, keywords, scannable structure).',
        'Verify technical accuracy while preserving accessibility. Flag anywhere a SME review is needed.',
        `Draft:\n---\n${draft?.draft ?? ''}\n---`,
        'Return JSON: { edited: string, smeQuestions: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Content-writer self-edit', labels: ['a5c', 'content-writer'] },
);

const variationTask = defineTask(
  'content-writer.channel-variation',
  async ({ edited, channel, brief }, ctx) => {
    return ctx.agent({
      title: `Content-writer: ${channel} variation`,
      prompt: [
        `Adapt the content for channel "${channel}" — adjust length/tone/format to the channel\'s conventions.`,
        ' - blog: conversational-professional, subheadings, CTAs',
        ' - social: concise, hook-first, hashtags/mentions, visual suggestions',
        ' - email: engaging subject, scannable, personalised, clear next step',
        ' - sales: benefit-driven, proof points, strong CTA',
        ' - docs-for-non-technical: step-by-step, visuals, defined terms, anticipated FAQs',
        `Brief: ${JSON.stringify(brief, null, 2)}`,
        `Edited source:\n---\n${edited}\n---`,
        'Return JSON: { channel, content }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Content-writer channel variation', labels: ['a5c', 'content-writer'] },
);

export async function process(inputs, ctx) {
  const { topic = '', audience, channel, goal, variations = [] } = inputs ?? {};
  const brief = await ctx.task(briefTask, { topic, audience, channel, goal });
  const plan = await ctx.task(planTask, { brief, topic });
  const draft = await ctx.task(draftTask, { brief, plan });
  const edit = await ctx.task(selfEditTask, { draft });

  let variationPaths = [];
  if (variations.length > 0) {
    const adaptations = await ctx.parallel.map(variations, (ch) =>
      ctx.task(variationTask, { edited: edit?.edited ?? draft?.draft ?? '', channel: ch, brief }),
    );
    variationPaths = adaptations.map((a) => a?.channel).filter(Boolean);
  }

  return {
    success: true,
    brief,
    draftPath: draft?.title ? `drafts/${String(draft.title).toLowerCase().replace(/\s+/g, '-')}.md` : undefined,
    variationPaths,
  };
}
