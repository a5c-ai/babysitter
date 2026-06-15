/**
 * @process specializations/collaboration/github/pr-lifecycle-feature
 * @description Standard feature/bugfix/chore PR lifecycle: branch+PR policies → label taxonomy → issue linking → six-dimension review → merge gate. Composes the individual gate processes into one end-to-end flow.
 * @inputs { event: string, pr: object, prDiff?: string, testsChanged?: string[] }
 * @outputs { success: boolean, stages: object, blockers: string[], readyToMerge: boolean }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration]
 *   skillAreas: [skill-area:code-review-practice, skill-area:gitops, skill-area:code-analysis-linting]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:backend-engineer, role:engineering-manager]
 */

import { process as prPolicies } from './pr-policies.js';
import { process as branchPolicies } from './branch-policies.js';
import { process as issueLinking } from './issue-linking.js';
import { process as labelTaxonomy } from './label-taxonomy.js';
import { process as draftPolicy } from './draft-pr-policy.js';
import { process as sixDimension } from '../code-review/six-dimension-review.js';

export async function process(inputs, ctx) {
  const { pr, prDiff = '', testsChanged = [] } = inputs;
  const stages = {};
  const blockers = [];

  stages.branch = await branchPolicies({
    branch: pr.headBranch,
    targetBranch: pr.baseBranch,
    pushContext: 'pr',
  }, ctx);
  if (!stages.branch.success) blockers.push('branch-policy');

  stages.prPolicies = await prPolicies({
    prNumber: pr.number,
    repo: pr.repo,
    title: pr.title,
    body: pr.body,
    changedFiles: pr.changedFiles,
    linkedIssues: [],
  }, ctx);
  if (!stages.prPolicies.success) blockers.push('pr-policy');

  stages.issueLinks = await issueLinking({
    prBody: pr.body,
    commitMessages: [],
    strictness: 'strict',
  }, ctx);
  if (!stages.issueLinks.success) blockers.push('issue-linking');

  stages.labels = await labelTaxonomy({
    appliedLabels: pr.labels,
    changedFiles: pr.changedFiles,
    title: pr.title,
    body: pr.body,
  }, ctx);
  if (!stages.labels.success) blockers.push('label-taxonomy');

  stages.draft = await draftPolicy({
    prNumber: pr.number,
    isDraft: pr.isDraft,
    hasApprovals: false,
    ciStatus: 'pending',
  }, ctx);
  if (!stages.draft.success) blockers.push('draft-policy');

  // Only run expensive 6-dim review if upstream gates pass OR we're past ready-for-review.
  if (blockers.length === 0 && prDiff) {
    stages.review = await sixDimension({
      prNumber: pr.number,
      repo: pr.repo,
      diff: prDiff,
      changedFiles: pr.changedFiles,
      testsChanged,
      prBody: pr.body,
    }, ctx);
    if (!stages.review.success) blockers.push('six-dimension-review');
  }

  return {
    success: blockers.length === 0,
    stages,
    blockers,
    readyToMerge: blockers.length === 0,
  };
}
