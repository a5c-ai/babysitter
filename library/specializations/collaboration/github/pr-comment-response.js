/**
 * @process specializations/collaboration/github/pr-comment-response
 * @description Respond to a PR review comment: classify intent, address the concern, post a reply linking the fix commit.
 * @inputs { prNumber: number, repo: string, comment: { author: string, body: string, path?: string, line?: number }, prDiff?: string }
 * @outputs { success: boolean, intent: string, action: "address"|"clarify"|"dismiss", responseBody: string, fixCommitSha?: string }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration]
 *   skillAreas: [skill-area:code-review-practice, skill-area:gitops]
 *   topics: [topic:code-review-best-practices]
 *   workflows: [workflow:code-review, workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:backend-engineer, role:engineering-manager]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const classifyTask = defineTask(
  'pr-comment.classify',
  async ({ comment, prDiff }, ctx) => {
    return ctx.agent({
      title: 'Classify PR comment intent',
      prompt: [
        'Classify the intent of a PR review comment.',
        `Comment by ${comment.author}: ${comment.body}`,
        comment.path ? `Anchored at ${comment.path}:${comment.line ?? '?'}` : '',
        prDiff ? `Diff excerpt:\n${prDiff.slice(0, 4000)}` : '',
        'Intents: "change-requested" | "question" | "suggestion" | "nitpick" | "approval" | "off-topic".',
        'Return JSON: { intent, severity: "block"|"nit"|"info", action: "address"|"clarify"|"dismiss", rationale }.',
      ].filter(Boolean).join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Classify comment', labels: ['collaboration', 'github', 'review'] },
);

const addressTask = defineTask(
  'pr-comment.address',
  async ({ comment, classification, prNumber, repo }, ctx) => {
    return ctx.agent({
      title: `Address PR comment on ${repo}#${prNumber}`,
      prompt: [
        `Address a "${classification.intent}" comment on PR ${repo}#${prNumber}.`,
        `Comment: ${comment.body}`,
        `Action: ${classification.action}`,
        'If action is "address": make the code change, commit with a message referencing the comment, then compose a reply linking the fix commit SHA.',
        'If "clarify": compose a reply explaining the existing design — do not change code unless the reviewer persists.',
        'If "dismiss": compose a polite reply explaining why the comment is out of scope for this PR.',
        'Never delete or disable the reviewer\'s concern without explicit agreement.',
        'Return JSON: { responseBody, fixCommitSha?: string, codeChanged: boolean }.',
      ].join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Address PR comment', labels: ['collaboration', 'github', 'review'] },
);

export async function process(inputs, ctx) {
  const classification = await ctx.task(classifyTask, {
    comment: inputs.comment,
    prDiff: inputs.prDiff,
  });
  const result = await ctx.task(addressTask, {
    comment: inputs.comment,
    classification,
    prNumber: inputs.prNumber,
    repo: inputs.repo,
  });
  return {
    success: true,
    intent: classification.intent,
    action: classification.action,
    responseBody: result.responseBody,
    fixCommitSha: result.fixCommitSha,
  };
}
