/**
 * @process specializations/web-development/aws-amplify-deployment
 * @description AWS Amplify Deployment - Process for deploying web applications to AWS Amplify with CI/CD, hosting, and backend services.
 * @inputs { projectName: string, region?: string }
 * @outputs { success: boolean, amplifyConfig: object, services: array, artifacts: array }
 * @references - AWS Amplify: https://docs.amplify.aws/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, region = 'us-east-1', outputDir = 'aws-amplify-deployment' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting AWS Amplify Deployment: ${projectName}`);

  const amplifySetup = await ctx.task(amplifySetupTask, { projectName, region, outputDir });
  artifacts.push(...amplifySetup.artifacts);

  const hostingSetup = await ctx.task(hostingSetupTask, { projectName, outputDir });
  artifacts.push(...hostingSetup.artifacts);

  const backendSetup = await ctx.task(backendSetupTask, { projectName, outputDir });
  artifacts.push(...backendSetup.artifacts);

  const cicdSetup = await ctx.task(cicdSetupTask, { projectName, outputDir });
  artifacts.push(...cicdSetup.artifacts);

  await ctx.breakpoint({ question: `AWS Amplify deployment complete for ${projectName}. Approve?`, title: 'Amplify Review', context: { runId: ctx.runId, config: amplifySetup.config } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, amplifyConfig: amplifySetup.config, services: backendSetup.services, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/aws-amplify-deployment', timestamp: startTime } };
}

export const amplifySetupTask = defineTask('amplify-setup', (args, taskCtx) => ({ kind: 'agent', title: `Amplify Setup - ${args.projectName}`, agent: { name: 'amplify-architect', prompt: { role: 'AWS Amplify Architect', task: 'Configure Amplify', context: args, instructions: ['1. Initialize Amplify project', '2. Configure amplify.yml', '3. Set up environment', '4. Configure build settings', '5. Set up framework detection', '6. Configure artifacts', '7. Set up cache', '8. Configure preBuild', '9. Set up postBuild', '10. Document setup'], outputFormat: 'JSON with Amplify setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'amplify', 'setup'] }));

export const hostingSetupTask = defineTask('hosting-setup', (args, taskCtx) => ({ kind: 'agent', title: `Hosting Setup - ${args.projectName}`, agent: { name: 'amplify-hosting-specialist', prompt: { role: 'Amplify Hosting Specialist', task: 'Configure hosting', context: args, instructions: ['1. Configure branches', '2. Set up custom domain', '3. Configure SSL', '4. Set up redirects', '5. Configure rewrites', '6. Set up headers', '7. Configure 404', '8. Set up preview', '9. Configure access control', '10. Document hosting'], outputFormat: 'JSON with hosting' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'amplify', 'hosting'] }));

export const backendSetupTask = defineTask('backend-setup', (args, taskCtx) => ({ kind: 'agent', title: `Backend Setup - ${args.projectName}`, agent: { name: 'amplify-backend-specialist', prompt: { role: 'Amplify Backend Specialist', task: 'Configure backend services', context: args, instructions: ['1. Set up Auth', '2. Configure API', '3. Set up Storage', '4. Configure Functions', '5. Set up GraphQL', '6. Configure REST API', '7. Set up DataStore', '8. Configure Analytics', '9. Set up Predictions', '10. Document backend'], outputFormat: 'JSON with backend' }, outputSchema: { type: 'object', required: ['services', 'artifacts'], properties: { services: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'amplify', 'backend'] }));

export const cicdSetupTask = defineTask('cicd-setup', (args, taskCtx) => ({ kind: 'agent', title: `CI/CD Setup - ${args.projectName}`, agent: { name: 'amplify-cicd-specialist', prompt: { role: 'Amplify CI/CD Specialist', task: 'Configure CI/CD', context: args, instructions: ['1. Configure auto build', '2. Set up branch builds', '3. Configure PR previews', '4. Set up environment vars', '5. Configure secrets', '6. Set up notifications', '7. Configure webhooks', '8. Set up manual deploys', '9. Configure rollbacks', '10. Document CI/CD'], outputFormat: 'JSON with CI/CD' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'amplify', 'cicd'] }));

export const documentationTask = defineTask('amplify-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate Amplify documentation', context: args, instructions: ['1. Create README', '2. Document configuration', '3. Create hosting guide', '4. Document backend', '5. Create CI/CD guide', '6. Document environment', '7. Create troubleshooting', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'amplify', 'documentation'] }));
