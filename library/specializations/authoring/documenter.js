/**
 * @process specializations/authoring/documenter
 * @description Documenter persona. Scans existing docs → detects drift vs current code →
 *   drafts updates following a5c documentation guidelines (hierarchy, active voice, real
 *   examples, chunked info, cross-links, defined acronyms, listed prerequisites) → opens
 *   a docs PR.
 * @inputs { changeRef?: string, target?: string }
 * @outputs { success, pagesWritten, prNumber? }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/development/documenter-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:technical-documentation]
 *   skillAreas: [skill-area:docs-as-code, skill-area:reference-docs, skill-area:api-doc-generation]
 *   topics: [topic:developer-experience]
 *   workflows: [workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:technical-writer, role:backend-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const scanDocsTask = defineTask(
  'documenter.scan-docs',
  async ({ target }, ctx) => {
    return ctx.agent({
      title: 'Documenter: inventory existing docs',
      prompt: [
        'Enumerate all docs (docs/**, README.md, per-package READMEs, GUIDE.md files).',
        'Note: page title, audience level (beginner/intermediate/advanced), last-modified, purpose.',
        `Target hint (optional): ${target ?? '(auto-detect entire repo)'}`,
        'Return JSON: { pages: Array<{ path, title, level, lastModified }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Documenter scan docs', labels: ['a5c', 'documenter'] },
);

const detectDriftTask = defineTask(
  'documenter.detect-drift',
  async ({ pages, changeRef }, ctx) => {
    return ctx.agent({
      title: 'Documenter: detect drift vs code',
      prompt: [
        'Compare each doc page to current code. Detect:',
        '  - missing pages (feature exists but undocumented)',
        '  - outdated examples (code blocks no longer run)',
        '  - stale API signatures',
        '  - dead cross-links',
        '  - undefined acronyms on first use; missing prerequisites',
        `Change ref: ${changeRef ?? 'HEAD~10..HEAD'}`,
        `Existing pages: ${JSON.stringify(pages ?? [], null, 2)}`,
        'Return JSON: { gaps: Array<{ path, reason, severity }>, outdated: Array<{ path, reason }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Documenter detect drift', labels: ['a5c', 'documenter'] },
);

const draftUpdateTask = defineTask(
  'documenter.draft-update',
  async ({ item }, ctx) => {
    return ctx.agent({
      title: `Draft doc update: ${item.path}`,
      prompt: [
        'Author/update this single page. Produce valid markdown ready for repo commit.',
        'Guidelines:',
        ' - Clear hierarchy (beginner → intermediate → advanced).',
        ' - Plain active language; second person ("you"); imperative verbs.',
        ' - Real examples (code blocks, commands, diagrams) with expected output.',
        ' - Chunk content with headings/lists/tables/call-outs.',
        ' - Cross-link related topics.',
        ' - Highlight warnings/tips sparingly. Consistent terminology. No slang/jokes.',
        ' - List prerequisites and define acronyms on first use.',
        `Item: ${JSON.stringify(item, null, 2)}`,
        'Return JSON: { path: string, content: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Draft doc page', labels: ['a5c', 'documenter'] },
);

const openDocsPrTask = defineTask(
  'documenter.open-docs-pr',
  async ({ drafts }, ctx) => {
    return ctx.agent({
      title: `Documenter: commit ${drafts.length} page(s) and open docs PR`,
      prompt: [
        'Create a branch off base, write each drafted page at its target path, commit, push, open a PR.',
        'PR labels: "documentation". Title: "[Documenter] …". Body lists pages changed and drift items addressed.',
        `Drafts: ${JSON.stringify(drafts.map((d) => ({ path: d.path })), null, 2)}`,
        'Return JSON: { pagesWritten: string[], prNumber?: number }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Open docs PR', labels: ['a5c', 'documenter'] },
);

export async function process(inputs, ctx) {
  const { changeRef, target } = inputs ?? {};
  const scan = await ctx.task(scanDocsTask, { target });
  const drift = await ctx.task(detectDriftTask, { pages: scan?.pages ?? [], changeRef });

  const items = [
    ...(Array.isArray(drift?.gaps) ? drift.gaps.map((g) => ({ ...g, kind: 'gap' })) : []),
    ...(Array.isArray(drift?.outdated) ? drift.outdated.map((o) => ({ ...o, kind: 'outdated' })) : []),
  ];
  if (items.length === 0) {
    return { success: true, pagesWritten: [] };
  }

  // Draft each page in parallel — independent writes.
  const drafts = await ctx.parallel.map(items, (item) => ctx.task(draftUpdateTask, { item }));
  const valid = drafts.filter((d) => d && d.path && d.content);

  const pr = await ctx.task(openDocsPrTask, { drafts: valid });
  return {
    success: true,
    pagesWritten: Array.isArray(pr?.pagesWritten) ? pr.pagesWritten : valid.map((d) => d.path),
    prNumber: pr?.prNumber,
  };
}
