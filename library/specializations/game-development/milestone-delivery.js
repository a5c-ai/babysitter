/**
 * @process specializations/game-development/milestone-delivery
 * @description Milestone Delivery Process - Prepare and deliver game builds for major milestones (alpha, beta, gold)
 * with bug triage, acceptance testing, stakeholder approval, and retrospective.
 * @inputs { projectName: string, milestoneType?: string, acceptanceCriteria?: array, outputDir?: string }
 * @outputs { success: boolean, milestoneApproved: boolean, buildPath: string, retrospectiveFindings: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/game-development/milestone-delivery', {
 *   projectName: 'Stellar Odyssey',
 *   milestoneType: 'alpha',
 *   acceptanceCriteria: ['all-features-implemented', 'no-critical-bugs', 'performance-targets-met']
 * });
 *
 * @references
 * - Game Production Handbook by Heather Maxwell Chandler
 * - GDC: Milestone Management Best Practices
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    milestoneType = 'alpha',
    acceptanceCriteria = [],
    bugTriageThreshold = { critical: 0, high: 5 },
    targetDate = '',
    outputDir = 'milestone-delivery-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Milestone Delivery: ${projectName} - ${milestoneType.toUpperCase()}`);

  // Phase 1: Milestone Requirements Review
  const requirementsReview = await ctx.task(milestoneRequirementsTask, {
    projectName, milestoneType, acceptanceCriteria, outputDir
  });
  artifacts.push(...requirementsReview.artifacts);

  // Phase 2: Pre-Milestone Bug Triage
  const bugTriage = await ctx.task(bugTriageTask, {
    projectName, milestoneType, bugTriageThreshold, outputDir
  });
  artifacts.push(...bugTriage.artifacts);

  if (bugTriage.criticalBugs > bugTriageThreshold.critical) {
    await ctx.breakpoint({
      question: `${bugTriage.criticalBugs} critical bugs found for ${milestoneType}. Must fix before milestone. Continue with bug fixing?`,
      title: 'Critical Bugs Found',
      context: { runId: ctx.runId, criticalBugs: bugTriage.criticalBugs, bugList: bugTriage.criticalBugList }
    });
  }

  // Phase 3: Release Branch and Build
  const releaseBuild = await ctx.task(releaseBuildTask, {
    projectName, milestoneType, bugTriage, outputDir
  });
  artifacts.push(...releaseBuild.artifacts);

  // Phase 4: Acceptance Testing
  const acceptanceTesting = await ctx.task(acceptanceTestingTask, {
    projectName, milestoneType, acceptanceCriteria, releaseBuild, outputDir
  });
  artifacts.push(...acceptanceTesting.artifacts);

  // Phase 5: Milestone Documentation
  const milestoneDoc = await ctx.task(milestoneDocumentationTask, {
    projectName, milestoneType, bugTriage, acceptanceTesting, outputDir
  });
  artifacts.push(...milestoneDoc.artifacts);

  // Phase 6: Stakeholder Approval
  const stakeholderApproval = await ctx.task(milestoneApprovalTask, {
    projectName, milestoneType, acceptanceTesting, milestoneDoc, outputDir
  });
  artifacts.push(...stakeholderApproval.artifacts);

  await ctx.breakpoint({
    question: `${milestoneType.toUpperCase()} milestone for ${projectName}. Acceptance: ${acceptanceTesting.passRate}% criteria met. Approved: ${stakeholderApproval.approved}. Proceed?`,
    title: `${milestoneType.toUpperCase()} Milestone Review`,
    context: { runId: ctx.runId, acceptanceTesting, stakeholderApproval }
  });

  // Phase 7: Retrospective
  const retrospective = await ctx.task(milestoneRetrospectiveTask, {
    projectName, milestoneType, bugTriage, acceptanceTesting, stakeholderApproval, outputDir
  });
  artifacts.push(...retrospective.artifacts);

  return {
    success: true,
    projectName,
    milestoneType,
    milestoneApproved: stakeholderApproval.approved,
    buildPath: releaseBuild.buildPath,
    acceptanceResults: { passRate: acceptanceTesting.passRate, criteriaMet: acceptanceTesting.criteriaMet },
    retrospectiveFindings: retrospective.findings,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/milestone-delivery', timestamp: startTime, outputDir }
  };
}

export const milestoneRequirementsTask = defineTask('milestone-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Milestone Requirements - ${args.milestoneType}`,
  agent: {
    name: 'game-producer-agent',
    prompt: { role: 'Producer', task: 'Review milestone requirements', context: args, instructions: ['1. Review acceptance criteria', '2. Verify feature completeness', '3. Check content status', '4. Validate quality targets'] },
    outputSchema: { type: 'object', required: ['criteriaVerified', 'readinessScore', 'artifacts'], properties: { criteriaVerified: { type: 'array' }, readinessScore: { type: 'number' }, gaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'milestone', 'requirements']
}));

export const bugTriageTask = defineTask('bug-triage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Bug Triage - ${args.milestoneType}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Lead', task: 'Triage bugs for milestone', context: args, instructions: ['1. Review all open bugs', '2. Prioritize by severity', '3. Identify must-fix bugs', '4. Create fix plan'] },
    outputSchema: { type: 'object', required: ['criticalBugs', 'highBugs', 'criticalBugList', 'artifacts'], properties: { criticalBugs: { type: 'number' }, highBugs: { type: 'number' }, criticalBugList: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'milestone', 'bug-triage']
}));

export const releaseBuildTask = defineTask('release-build', (args, taskCtx) => ({
  kind: 'agent',
  title: `Release Build - ${args.milestoneType}`,
  agent: {
    name: 'build-engineer-agent',
    prompt: { role: 'Build Engineer', task: 'Create release candidate build', context: args, instructions: ['1. Create release branch', '2. Build milestone candidate', '3. Run automated tests', '4. Package build'] },
    outputSchema: { type: 'object', required: ['buildPath', 'buildVersion', 'testsPass', 'artifacts'], properties: { buildPath: { type: 'string' }, buildVersion: { type: 'string' }, testsPass: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'milestone', 'build']
}));

export const acceptanceTestingTask = defineTask('acceptance-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Acceptance Testing - ${args.milestoneType}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Lead', task: 'Perform acceptance testing', context: args, instructions: ['1. Test all acceptance criteria', '2. Document pass/fail status', '3. Regression testing', '4. Performance validation'] },
    outputSchema: { type: 'object', required: ['passRate', 'criteriaMet', 'criteriaFailed', 'artifacts'], properties: { passRate: { type: 'number' }, criteriaMet: { type: 'array' }, criteriaFailed: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'milestone', 'acceptance-testing']
}));

export const milestoneDocumentationTask = defineTask('milestone-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Milestone Documentation - ${args.milestoneType}`,
  agent: {
    name: 'technical-documentation-agent',
    prompt: { role: 'Technical Writer', task: 'Create milestone documentation', context: args, instructions: ['1. Document build contents', '2. Create release notes', '3. Document known issues', '4. Create handoff documentation'] },
    outputSchema: { type: 'object', required: ['releaseNotesPath', 'artifacts'], properties: { releaseNotesPath: { type: 'string' }, knownIssues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'milestone', 'documentation']
}));

export const milestoneApprovalTask = defineTask('milestone-approval', (args, taskCtx) => ({
  kind: 'agent',
  title: `Milestone Approval - ${args.milestoneType}`,
  agent: {
    name: 'game-producer-agent',
    prompt: { role: 'Executive Producer', task: 'Review and approve milestone', context: args, instructions: ['1. Review acceptance results', '2. Assess milestone quality', '3. Make approval decision', '4. Document feedback'] },
    outputSchema: { type: 'object', required: ['approved', 'feedback', 'artifacts'], properties: { approved: { type: 'boolean' }, feedback: { type: 'array' }, conditions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'milestone', 'approval']
}));

export const milestoneRetrospectiveTask = defineTask('milestone-retrospective', (args, taskCtx) => ({
  kind: 'agent',
  title: `Milestone Retrospective - ${args.milestoneType}`,
  agent: {
    name: 'game-producer-agent',
    prompt: { role: 'Scrum Master', task: 'Conduct milestone retrospective', context: args, instructions: ['1. Gather team feedback', '2. Identify what went well', '3. Identify improvements', '4. Create action items'] },
    outputSchema: { type: 'object', required: ['findings', 'actionItems', 'artifacts'], properties: { findings: { type: 'array' }, wentWell: { type: 'array' }, improvements: { type: 'array' }, actionItems: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'milestone', 'retrospective']
}));
