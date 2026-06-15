/**
 * @process specializations/collaboration/github/pr-lifecycle-comment-response
 * @description Lifecycle triggered by @mention on a PR comment: classify intent → route to review-comment-response OR re-run a targeted gate → post reply with fix commit ref.
 * @inputs { event: "pr-comment-mention", pr: object, comment: { author, body, path?, line?, id }, prDiff?: string }
 * @outputs { success: boolean, action: string, responseBody: string, fixCommitSha?: string }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration]
 *   skillAreas: [skill-area:code-review-practice, skill-area:gitops]
 *   topics: [topic:code-review-best-practices]
 *   workflows: [workflow:code-review, workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:backend-engineer, role:engineering-manager]
 */

import { process as commentResponse } from './pr-comment-response.js';

export async function process(inputs, ctx) {
  const { pr, comment, prDiff } = inputs;

  // Delegate to the existing single-comment responder; the router already
  // narrowed "event == pr-comment-mention" so this is the terminal lifecycle.
  const result = await commentResponse({
    prNumber: pr.number,
    repo: pr.repo,
    comment,
    prDiff,
  }, ctx);

  return {
    success: result.success !== false,
    action: result.action,
    intent: result.intent,
    responseBody: result.responseBody,
    fixCommitSha: result.fixCommitSha,
  };
}
