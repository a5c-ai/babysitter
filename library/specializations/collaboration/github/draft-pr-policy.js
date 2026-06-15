/**
 * @process specializations/collaboration/github/draft-pr-policy
 * @description Prohibit draft PRs for ready-to-merge flows; require ready-for-review state before CI/review gates apply.
 * @inputs { prNumber: number, isDraft: boolean, hasApprovals: boolean, ciStatus: "pending"|"success"|"failure" }
 * @outputs { success: boolean, action: "mark-ready"|"block-merge"|"ok", reason?: string }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration]
 *   skillAreas: [skill-area:code-review-practice, skill-area:gitops]
 *   topics: [topic:code-review-best-practices]
 *   workflows: [workflow:code-review, workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:platform-engineer, role:engineering-manager]
 */

export async function process(inputs, _ctx) {
  const { isDraft, hasApprovals, ciStatus } = inputs;
  if (!isDraft) {
    return { success: true, action: 'ok' };
  }
  if (hasApprovals || ciStatus === 'success') {
    return {
      success: false,
      action: 'mark-ready',
      reason: 'PR is draft but has passing CI or approvals — mark ready-for-review before merging.',
    };
  }
  return {
    success: false,
    action: 'block-merge',
    reason: 'Draft PRs cannot merge. Either complete the change and mark ready-for-review, or close.',
  };
}
