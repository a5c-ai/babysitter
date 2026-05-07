/**
 * @process specializations/collaboration/github/issue-only-no-direct-commits
 * @description Every non-trivial commit must trace to an issue; direct commits without an issue reference are rejected in CI.
 * @inputs { commits: Array<{ sha, message, filesChanged: number }>, trivialThreshold?: number }
 * @outputs { success: boolean, rejected: Array<{ sha, reason }>, accepted: Array<string> }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration]
 *   skillAreas: [skill-area:code-review-practice, skill-area:gitops]
 *   topics: [topic:code-review-best-practices]
 *   workflows: [workflow:feature-development, workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:platform-engineer, role:engineering-manager]
 */

const ISSUE_REF = /#(\d+)\b|(?:close|closes|fix|fixes|resolve|resolves|refs?)\s+#\d+/i;

export async function process(inputs, _ctx) {
  const { commits = [], trivialThreshold = 5 } = inputs;
  const rejected = [];
  const accepted = [];
  for (const c of commits) {
    const hasRef = ISSUE_REF.test(c.message);
    const trivial = (c.filesChanged ?? 999) <= 1 && c.message.length < 80;
    if (hasRef || trivial) {
      accepted.push(c.sha);
    } else {
      rejected.push({
        sha: c.sha,
        reason: `Commit has ${c.filesChanged ?? '?'} files changed and no issue reference. Add an issue link (e.g. "refs #123") or justify as trivial (≤${trivialThreshold} files, no behavior change).`,
      });
    }
  }
  return {
    success: rejected.length === 0,
    rejected,
    accepted,
  };
}
