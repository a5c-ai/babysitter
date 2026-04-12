/**
 * @process specializations/collaboration/a5c-personas/documenter
 * @description Documenter persona (a5c documenter-agent). Detects docs drift against
 *   code changes, fills gaps, and produces markdown pages following A5C documentation
 *   guidelines (clear hierarchy, active voice, real examples, chunked info, cross-links).
 * @inputs { changeRef?: string, target?: string }
 * @outputs { success: boolean, pagesWritten: string[], prNumber?: number }
 *
 * Source: a5c-ai/registry/prompts/development/documenter-agent.prompt.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const driftScanTask = defineTask(
  'documenter.drift-scan',
  async ({ changeRef }, ctx) => {
    return ctx.agent({
      title: 'Documenter: scan for docs drift + missing pages',
      prompt: [
        'You are the documenter-agent.',
        'Compare recent code changes to existing docs. Detect: missing pages, outdated examples, stale API signatures, dead cross-links.',
        `Change ref (optional, e.g. commit/PR): ${changeRef ?? 'HEAD~10..HEAD'}`,
        'Return JSON: { gaps: Array<{ path, reason, severity }>, outdated: Array<{ path, reason }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Documenter drift scan', labels: ['a5c', 'documenter'] },
);

const writeDocsTask = defineTask(
  'documenter.write-pages',
  async ({ gaps, outdated, target }, ctx) => {
    return ctx.agent({
      title: 'Documenter: author/update docs pages + open PR',
      prompt: [
        'You are the documenter-agent. Write/update the flagged docs pages.',
        'Guidelines:',
        ' - Plan a clear hierarchy (beginner/intermediate/advanced).',
        ' - Use plain, active language; second person ("you"); imperative verbs.',
        ' - Include real examples (code blocks, commands, diagrams) with expected results.',
        ' - Chunk content (headings, lists, tables, call-outs). Cross-link related topics.',
        ' - Highlight critical info sparingly (warnings/tips). No slang, no jokes, consistent terminology.',
        ' - List prerequisites and define acronyms on first use.',
        `Target (optional): ${target ?? '(auto-detect)'}`,
        `Gaps: ${JSON.stringify(gaps ?? [], null, 2)}`,
        `Outdated: ${JSON.stringify(outdated ?? [], null, 2)}`,
        'Commit on a branch and open a PR. Return JSON: { pagesWritten: string[], prNumber?: number }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Documenter write pages', labels: ['a5c', 'documenter'] },
);

export async function process(inputs, ctx) {
  const { changeRef, target } = inputs ?? {};
  const scan = await ctx.task(driftScanTask, { changeRef });
  const gaps = Array.isArray(scan?.gaps) ? scan.gaps : [];
  const outdated = Array.isArray(scan?.outdated) ? scan.outdated : [];
  if (gaps.length === 0 && outdated.length === 0) {
    return { success: true, pagesWritten: [] };
  }
  const write = await ctx.task(writeDocsTask, { gaps, outdated, target });
  return {
    success: true,
    pagesWritten: Array.isArray(write?.pagesWritten) ? write.pagesWritten : [],
    prNumber: write?.prNumber,
  };
}
