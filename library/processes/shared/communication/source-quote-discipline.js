/**
 * @process processes/shared/communication/source-quote-discipline
 * @description When citing code, prefer path:line references over pasted snippets; cap quotes at ~10 lines.
 * @inputs { context: string, candidateQuotes: Array<{ path, startLine, endLine, content }> }
 * @outputs { success: boolean, citations: Array<object> }
 *
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const normalizeCitationsTask = defineTask(
  'source-quote.normalize',
  async ({ context, candidateQuotes }, ctx) => {
    return ctx.agent({
      title: 'Normalize source citations',
      prompt: [
        `For the context "${context}", normalize each quote to a path:line citation.`,
        'Rules:',
        '- Prefer `path:startLine` (or `path:startLine-endLine`) over pasted snippets.',
        '- If a quote is essential for clarity, cap it at 10 lines and still include the path:line pointer.',
        '- For diffs, link a commit range or PR files-changed view rather than embedding the diff.',
        `Candidate quotes: ${JSON.stringify(candidateQuotes, null, 2)}`,
        'Return JSON: { citations: Array<{ path, lineRange, inlineQuote?: string, method: "reference"|"capped-quote" }> }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Normalize citations', labels: ['communication', 'citations'] },
);

export async function process(inputs, ctx) {
  const { context, candidateQuotes = [] } = inputs;
  const result = await ctx.task(normalizeCitationsTask, { context, candidateQuotes });
  return { success: true, citations: result.citations ?? [] };
}
