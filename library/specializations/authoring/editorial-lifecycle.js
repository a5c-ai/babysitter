/**
 * @process specializations/authoring/editorial-lifecycle
 * @description Full editorial lifecycle for long-form written work: outline → draft → self-edit → fact-check → developmental-edit (via breakpoint) → copy-edit → legal check → publish → track revision requests. Unified workflow; no fragmented per-role processes.
 * @inputs { topic: string, audience: string, workingTitle?: string, wordTarget?: number, sources?: Array<{ title, url, notes? }>, editors?: { developmental?: string, copy?: string, legal?: string }, publishTarget?: { platform, slug? } }
 * @outputs { success: boolean, finalDraftPath?: string, publishedUrl?: string, editPassStatus: object, revisionLog: Array<object>, blockers?: Array<string> }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:technical-documentation]
 *   skillAreas: [skill-area:docs-as-code, skill-area:reference-docs, skill-area:tutorial-design]
 *   topics: [topic:developer-experience]
 *   workflows: [workflow:peer-review-cycle]
 *   roles: [role:technical-writer, role:tech-lead, role:engineering-manager]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const outlineTask = defineTask(
  'authoring.outline',
  async ({ topic, audience, wordTarget, sources }, ctx) => {
    return ctx.agent({
      title: 'Build outline + thesis',
      prompt: [
        'Construct a tight outline: thesis (one sentence), 3-5 section headings, each with 2-3 supporting beats + the source(s) that back them.',
        `Topic: ${topic}`,
        `Audience: ${audience}`,
        `Word target: ${wordTarget ?? 1500}`,
        `Sources: ${JSON.stringify(sources ?? [], null, 2)}`,
        'Flag any section whose beats are not backed by a source as "unsourced-risk".',
        'Return JSON: { thesis, sections: Array<{ heading, beats: string[], backingSources: string[], unsourcedRisks: string[] }>, estimatedWordCount }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Outline', labels: ['authoring', 'outline'] },
);

const draftTask = defineTask(
  'authoring.draft',
  async ({ outline, audience, workingTitle }, ctx) => {
    return ctx.agent({
      title: 'Write first draft',
      prompt: [
        'Write a first draft from the outline. Prose, not notes. Include lede, nut-graf, body, kicker.',
        `Working title: ${workingTitle ?? '(none)'}`,
        `Audience: ${audience}`,
        `Outline: ${JSON.stringify(outline, null, 2)}`,
        'Avoid: AI-cliché openings ("In today\'s world…"), throat-clearing, overuse of em-dashes.',
        'Return JSON: { draftMarkdown, wordCount, titleOptions: string[] }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Draft', labels: ['authoring', 'draft'] },
);

const selfEditTask = defineTask(
  'authoring.self-edit',
  async ({ draft }, ctx) => {
    return ctx.agent({
      title: 'Self-edit pass',
      prompt: [
        'Self-edit the draft: kill filler, tighten transitions, vary sentence rhythm, cut anything that doesn\'t earn its place.',
        `Draft: ${draft.draftMarkdown}`,
        'Preserve the thesis and voice. Target a 10-20% reduction unless the draft is already lean.',
        'Return JSON: { revisedMarkdown, cutsRationale: string[], wordCount }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Self-edit', labels: ['authoring', 'edit'] },
);

const factCheckTask = defineTask(
  'authoring.fact-check',
  async ({ draft, sources }, ctx) => {
    return ctx.agent({
      title: 'Fact-check claims',
      prompt: [
        'Extract every verifiable claim, attribute each to a source, flag unverified/uncertain claims.',
        `Draft: ${draft.revisedMarkdown}`,
        `Available sources: ${JSON.stringify(sources ?? [], null, 2)}`,
        'Return JSON: { claims: Array<{ text, supportingSource?: string, status: "verified"|"unverified"|"contradicted"|"opinion" }>, blockers: string[] }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Fact-check', labels: ['authoring', 'fact-check'] },
);

const editGateTask = defineTask(
  'authoring.edit-gate',
  async ({ pass, editor, draft, previousFeedback }, ctx) => {
    return ctx.breakpoint({
      breakpointId: `authoring.edit-gate.${pass}`,
      title: `${pass} edit pass`,
      expert: editor,
      tags: ['authoring', pass],
      previousFeedback,
      prompt: [
        `${pass === 'developmental' ? 'Developmental edit: structure, argument, audience fit, pacing.' : ''}`,
        `${pass === 'copy' ? 'Copy edit: grammar, style, house conventions, consistency.' : ''}`,
        `${pass === 'legal' ? 'Legal review: defamation, IP, consent, regulated claims.' : ''}`,
        'Approve as-is, approve-with-revisions (list them), or reject with required rework.',
        `Draft:\n${draft.revisedMarkdown ?? draft.draftMarkdown}`,
      ].filter(Boolean).join('\n\n'),
    });
  },
  { kind: 'breakpoint', title: 'Edit gate', labels: ['authoring', 'review'] },
);

const applyEditsTask = defineTask(
  'authoring.apply-edits',
  async ({ draft, feedback }, ctx) => {
    return ctx.agent({
      title: 'Apply editor feedback',
      prompt: [
        'Apply the editor\'s feedback. Preserve author voice; do not over-correct.',
        `Current draft: ${draft.revisedMarkdown ?? draft.draftMarkdown}`,
        `Feedback: ${feedback}`,
        'Return JSON: { revisedMarkdown, changeLog: string[] }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Apply edits', labels: ['authoring', 'edit'] },
);

const publishTask = defineTask(
  'authoring.publish',
  async ({ draft, publishTarget }, ctx) => {
    return ctx.agent({
      title: `Publish to ${publishTarget.platform}`,
      prompt: [
        `Publish to ${publishTarget.platform}.`,
        `Slug: ${publishTarget.slug ?? '(auto)'}`,
        `Content: ${draft.revisedMarkdown}`,
        'Return JSON: { success: boolean, publishedUrl?: string, error?: string }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Publish', labels: ['authoring', 'publish'] },
);

async function runEditGate(ctx, pass, editor, draft) {
  const revisionLog = [];
  let current = draft;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const previousFeedback = revisionLog[revisionLog.length - 1]?.feedback;
    const gate = await ctx.task(editGateTask, { pass, editor, draft: current, previousFeedback });
    revisionLog.push({ pass, attempt, approved: gate.approved, feedback: gate.feedback ?? gate.response });
    if (gate.approved) return { approved: true, draft: current, attempts: attempt, log: revisionLog };
    const feedback = gate.feedback ?? gate.response;
    if (!feedback) return { approved: false, draft: current, attempts: attempt, log: revisionLog, reason: 'rejected-without-feedback' };
    const applied = await ctx.task(applyEditsTask, { draft: current, feedback });
    current = { ...current, revisedMarkdown: applied.revisedMarkdown };
  }
  return { approved: false, draft: current, attempts: 3, log: revisionLog, reason: 'max-attempts-exceeded' };
}

export async function process(inputs, ctx) {
  const { topic, audience, workingTitle, wordTarget, sources, editors = {}, publishTarget } = inputs;

  const outline = await ctx.task(outlineTask, { topic, audience, wordTarget, sources });
  const firstDraft = await ctx.task(draftTask, { outline, audience, workingTitle });
  let current = await ctx.task(selfEditTask, { draft: firstDraft });

  const fact = await ctx.task(factCheckTask, { draft: current, sources });
  if ((fact.blockers ?? []).length > 0) {
    return {
      success: false,
      editPassStatus: { factCheck: fact },
      revisionLog: [],
      blockers: fact.blockers,
    };
  }

  const editPassStatus = { factCheck: fact };
  const revisionLog = [];
  for (const pass of ['developmental', 'copy', 'legal']) {
    if (!editors[pass]) continue;
    const result = await runEditGate(ctx, pass, editors[pass], current);
    editPassStatus[pass] = { approved: result.approved, attempts: result.attempts, reason: result.reason };
    revisionLog.push(...result.log);
    if (!result.approved) {
      return { success: false, editPassStatus, revisionLog, blockers: [`${pass}-edit-failed: ${result.reason}`] };
    }
    current = result.draft;
  }

  if (!publishTarget) {
    return { success: true, editPassStatus, revisionLog, finalDraftPath: '(in-memory)' };
  }
  const pub = await ctx.task(publishTask, { draft: current, publishTarget });
  return {
    success: pub.success === true,
    editPassStatus,
    revisionLog,
    publishedUrl: pub.publishedUrl,
    blockers: pub.success === false ? [pub.error ?? 'publish-failed'] : undefined,
  };
}
