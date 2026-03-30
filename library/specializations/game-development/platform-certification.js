/**
 * @process specializations/game-development/platform-certification
 * @description Platform Certification Process - Prepare and submit game for platform certification (PlayStation, Xbox,
 * Nintendo, Steam) including compliance verification, submission preparation, and issue resolution.
 * @inputs { projectName: string, targetPlatform?: string, submissionType?: string, outputDir?: string }
 * @outputs { success: boolean, certificationStatus: string, complianceReport: string, submissionId: string, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetPlatform = 'steam',
    submissionType = 'initial',
    region = 'worldwide',
    outputDir = 'certification-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Platform Certification: ${projectName} for ${targetPlatform}`);

  // Phase 1: Requirements Review
  const reqReview = await ctx.task(certRequirementsTask, { projectName, targetPlatform, outputDir });
  artifacts.push(...reqReview.artifacts);

  // Phase 2: Compliance Check
  const complianceCheck = await ctx.task(complianceCheckTask, { projectName, targetPlatform, reqReview, outputDir });
  artifacts.push(...complianceCheck.artifacts);

  // Phase 3: Pre-Certification Testing
  const preCertTesting = await ctx.task(preCertTestingTask, { projectName, targetPlatform, complianceCheck, outputDir });
  artifacts.push(...preCertTesting.artifacts);

  await ctx.breakpoint({
    question: `Pre-certification testing complete for ${projectName}. Compliance: ${complianceCheck.complianceRate}%. Issues: ${preCertTesting.issues.length}. Ready to submit?`,
    title: 'Pre-Certification Review',
    context: { runId: ctx.runId, complianceCheck, preCertTesting }
  });

  // Phase 4: Submission Preparation
  const submissionPrep = await ctx.task(submissionPrepTask, { projectName, targetPlatform, submissionType, outputDir });
  artifacts.push(...submissionPrep.artifacts);

  // Phase 5: Submit for Certification
  const submission = await ctx.task(certSubmissionTask, { projectName, targetPlatform, submissionPrep, outputDir });
  artifacts.push(...submission.artifacts);

  return {
    success: true,
    projectName,
    targetPlatform,
    certificationStatus: submission.status,
    complianceReport: complianceCheck.reportPath,
    submissionId: submission.submissionId,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/platform-certification', timestamp: startTime, outputDir }
  };
}

export const certRequirementsTask = defineTask('cert-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Certification Requirements - ${args.targetPlatform}`,
  agent: {
    name: 'compliance-tester-agent',
    prompt: { role: 'Certification Specialist', task: 'Review platform requirements', context: args, instructions: ['1. Get latest TRC/XR requirements', '2. Review submission guidelines', '3. Identify mandatory features', '4. Create compliance checklist'] },
    outputSchema: { type: 'object', required: ['requirements', 'checklist', 'artifacts'], properties: { requirements: { type: 'array' }, checklist: { type: 'array' }, deadlines: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'certification', 'requirements']
}));

export const complianceCheckTask = defineTask('compliance-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compliance Check - ${args.projectName}`,
  agent: {
    name: 'compliance-tester-agent',
    prompt: { role: 'Certification QA', task: 'Check platform compliance', context: args, instructions: ['1. Test all TRC/XR items', '2. Document compliance status', '3. Identify violations', '4. Generate compliance report'] },
    outputSchema: { type: 'object', required: ['complianceRate', 'violations', 'reportPath', 'artifacts'], properties: { complianceRate: { type: 'number' }, violations: { type: 'array' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'certification', 'compliance']
}));

export const preCertTestingTask = defineTask('pre-cert-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pre-Certification Testing - ${args.projectName}`,
  agent: {
    name: 'compliance-tester-agent',
    prompt: { role: 'Certification QA', task: 'Run pre-certification tests', context: args, instructions: ['1. Run full certification test pass', '2. Test edge cases', '3. Verify all mandatory features', '4. Document any issues'] },
    outputSchema: { type: 'object', required: ['testsPassed', 'issues', 'artifacts'], properties: { testsPassed: { type: 'number' }, issues: { type: 'array' }, readyForSubmission: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'certification', 'testing']
}));

export const submissionPrepTask = defineTask('submission-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: `Submission Preparation - ${args.projectName}`,
  agent: {
    name: 'release-manager-agent',
    prompt: { role: 'Release Manager', task: 'Prepare submission package', context: args, instructions: ['1. Create submission build', '2. Prepare documentation', '3. Fill submission forms', '4. Package all materials'] },
    outputSchema: { type: 'object', required: ['packageReady', 'documents', 'artifacts'], properties: { packageReady: { type: 'boolean' }, documents: { type: 'array' }, buildVersion: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'certification', 'submission-prep']
}));

export const certSubmissionTask = defineTask('cert-submission', (args, taskCtx) => ({
  kind: 'agent',
  title: `Certification Submission - ${args.projectName}`,
  agent: {
    name: 'release-manager-agent',
    prompt: { role: 'Release Manager', task: 'Submit for certification', context: args, instructions: ['1. Upload submission package', '2. Submit via platform portal', '3. Document submission ID', '4. Set up tracking'] },
    outputSchema: { type: 'object', required: ['status', 'submissionId', 'artifacts'], properties: { status: { type: 'string' }, submissionId: { type: 'string' }, expectedReviewDate: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'certification', 'submission']
}));
