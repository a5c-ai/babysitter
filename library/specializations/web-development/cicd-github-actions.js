/**
 * @process specializations/web-development/cicd-github-actions
 * @description CI/CD with GitHub Actions - Process for setting up comprehensive CI/CD pipelines with GitHub Actions for web applications.
 * @inputs { projectName: string, deployTarget?: string }
 * @outputs { success: boolean, workflows: array, pipelines: object, artifacts: array }
 * @references - GitHub Actions: https://docs.github.com/en/actions
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, deployTarget = 'vercel', outputDir = 'cicd-github-actions' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CI/CD GitHub Actions: ${projectName}`);

  const workflowSetup = await ctx.task(workflowSetupTask, { projectName, deployTarget, outputDir });
  artifacts.push(...workflowSetup.artifacts);

  const testingPipeline = await ctx.task(testingPipelineTask, { projectName, outputDir });
  artifacts.push(...testingPipeline.artifacts);

  const deploymentPipeline = await ctx.task(deploymentPipelineTask, { projectName, deployTarget, outputDir });
  artifacts.push(...deploymentPipeline.artifacts);

  const securityScanning = await ctx.task(securityScanningTask, { projectName, outputDir });
  artifacts.push(...securityScanning.artifacts);

  await ctx.breakpoint({ question: `CI/CD pipelines complete for ${projectName}. Approve?`, title: 'CI/CD Review', context: { runId: ctx.runId, workflows: workflowSetup.workflows } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, workflows: workflowSetup.workflows, pipelines: deploymentPipeline.pipelines, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/cicd-github-actions', timestamp: startTime } };
}

export const workflowSetupTask = defineTask('workflow-setup', (args, taskCtx) => ({ kind: 'skill', title: `Workflow Setup - ${args.projectName}`, skill: { name: 'github-actions-skill', prompt: { role: 'GitHub Actions Architect', task: 'Configure workflows', context: args, instructions: ['1. Create CI workflow', '2. Configure triggers', '3. Set up matrix builds', '4. Configure caching', '5. Set up artifacts', '6. Configure concurrency', '7. Set up environment', '8. Configure permissions', '9. Set up reusable workflows', '10. Document workflows'], outputFormat: 'JSON with workflow setup' }, outputSchema: { type: 'object', required: ['workflows', 'artifacts'], properties: { workflows: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'cicd', 'github-actions'] }));

export const testingPipelineTask = defineTask('testing-pipeline', (args, taskCtx) => ({ kind: 'agent', title: `Testing Pipeline - ${args.projectName}`, agent: { name: 'testing-pipeline-specialist', prompt: { role: 'Testing Pipeline Specialist', task: 'Configure testing pipeline', context: args, instructions: ['1. Set up lint step', '2. Configure unit tests', '3. Set up integration tests', '4. Configure e2e tests', '5. Set up coverage', '6. Configure parallel jobs', '7. Set up test sharding', '8. Configure reporting', '9. Set up notifications', '10. Document testing'], outputFormat: 'JSON with testing pipeline' }, outputSchema: { type: 'object', required: ['pipeline', 'artifacts'], properties: { pipeline: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'cicd', 'testing'] }));

export const deploymentPipelineTask = defineTask('deployment-pipeline', (args, taskCtx) => ({ kind: 'agent', title: `Deployment Pipeline - ${args.projectName}`, agent: { name: 'deployment-pipeline-specialist', prompt: { role: 'Deployment Pipeline Specialist', task: 'Configure deployment pipeline', context: args, instructions: ['1. Set up build step', '2. Configure staging deploy', '3. Set up production deploy', '4. Configure preview deploys', '5. Set up rollback', '6. Configure secrets', '7. Set up environment protection', '8. Configure approvals', '9. Set up notifications', '10. Document deployment'], outputFormat: 'JSON with deployment pipeline' }, outputSchema: { type: 'object', required: ['pipelines', 'artifacts'], properties: { pipelines: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'cicd', 'deployment'] }));

export const securityScanningTask = defineTask('security-scanning', (args, taskCtx) => ({ kind: 'agent', title: `Security Scanning - ${args.projectName}`, agent: { name: 'security-scanning-specialist', prompt: { role: 'Security Scanning Specialist', task: 'Configure security scanning', context: args, instructions: ['1. Set up Dependabot', '2. Configure CodeQL', '3. Set up SAST', '4. Configure secret scanning', '5. Set up npm audit', '6. Configure Snyk', '7. Set up container scanning', '8. Configure SBOM', '9. Set up alerts', '10. Document security'], outputFormat: 'JSON with security scanning' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'cicd', 'security'] }));

export const documentationTask = defineTask('cicd-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate CI/CD documentation', context: args, instructions: ['1. Create README', '2. Document workflows', '3. Create testing guide', '4. Document deployment', '5. Create security guide', '6. Document secrets', '7. Create troubleshooting', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'cicd', 'documentation'] }));
