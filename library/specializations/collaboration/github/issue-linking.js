/**
 * @process specializations/collaboration/github/issue-linking
 * @description Ensure PRs and commits link to tracking issues with proper closing keywords.
 * @inputs { prBody: string, commitMessages: Array<string>, openIssues?: Array<{ number, title, labels }>, strictness?: "strict"|"lenient" }
 * @outputs { success: boolean, linkedIssues: Array<number>, missingLinks: Array<string>, suggestions?: Array<string> }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration]
 *   skillAreas: [skill-area:code-review-practice, skill-area:gitops]
 *   topics: [topic:code-review-best-practices]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:backend-engineer, role:engineering-manager]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const CLOSING_KEYWORDS = ['close', 'closes', 'closed', 'fix', 'fixes', 'fixed', 'resolve', 'resolves', 'resolved'];
const ISSUE_REF = /#(\d+)\b/g;
const CLOSING_REF = new RegExp(`\\b(${CLOSING_KEYWORDS.join('|')})\\s+#(\\d+)\\b`, 'gi');

const suggestTask = defineTask(
  'issue-linking.suggest',
  async ({ prBody, commitMessages, openIssues }, ctx) => {
    return ctx.agent({
      title: 'Suggest issue links for PR',
      prompt: [
        'Given a PR body/commits and a list of open issues, suggest which issues the change likely addresses.',
        `PR body: ${prBody}`,
        `Commit messages: ${JSON.stringify(commitMessages, null, 2)}`,
        `Open issues: ${JSON.stringify(openIssues ?? [], null, 2)}`,
        'Return JSON: { suggestions: Array<{ issueNumber, rationale, closingKeyword: "fixes"|"closes"|"resolves"|"refs" }> }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Suggest issue links', labels: ['collaboration', 'github', 'issues'] },
);

function extractRefs(text) {
  const refs = new Set();
  const closing = new Set();
  for (const m of text.matchAll(ISSUE_REF)) refs.add(Number(m[1]));
  for (const m of text.matchAll(CLOSING_REF)) closing.add(Number(m[2]));
  return { refs: [...refs], closing: [...closing] };
}

export async function process(inputs, ctx) {
  const { prBody = '', commitMessages = [], strictness = 'strict' } = inputs;
  const combined = [prBody, ...commitMessages].join('\n');
  const { refs, closing } = extractRefs(combined);
  const missingLinks = [];
  if (refs.length === 0) {
    missingLinks.push('no-issue-reference');
  }
  if (strictness === 'strict' && closing.length === 0) {
    missingLinks.push('no-closing-keyword');
  }
  let suggestions;
  if (missingLinks.length > 0) {
    const s = await ctx.task(suggestTask, inputs);
    suggestions = s.suggestions ?? [];
  }
  return {
    success: missingLinks.length === 0,
    linkedIssues: refs,
    missingLinks,
    suggestions,
  };
}
