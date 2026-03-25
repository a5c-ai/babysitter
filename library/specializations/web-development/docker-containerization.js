/**
 * @process specializations/web-development/docker-containerization
 * @description Docker Containerization - Process for containerizing web applications with Docker, multi-stage builds, and optimization.
 * @inputs { projectName: string, runtime?: string }
 * @outputs { success: boolean, dockerConfig: object, images: array, artifacts: array }
 * @references - Docker: https://docs.docker.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, runtime = 'node', outputDir = 'docker-containerization' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Docker Containerization: ${projectName}`);

  const dockerfileSetup = await ctx.task(dockerfileSetupTask, { projectName, runtime, outputDir });
  artifacts.push(...dockerfileSetup.artifacts);

  const multiStageSetup = await ctx.task(multiStageSetupTask, { projectName, outputDir });
  artifacts.push(...multiStageSetup.artifacts);

  const composeSetup = await ctx.task(composeSetupTask, { projectName, outputDir });
  artifacts.push(...composeSetup.artifacts);

  const optimizationSetup = await ctx.task(optimizationSetupTask, { projectName, outputDir });
  artifacts.push(...optimizationSetup.artifacts);

  await ctx.breakpoint({ question: `Docker containerization complete for ${projectName}. Approve?`, title: 'Docker Review', context: { runId: ctx.runId, config: dockerfileSetup.config } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, dockerConfig: dockerfileSetup.config, images: multiStageSetup.images, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/docker-containerization', timestamp: startTime } };
}

export const dockerfileSetupTask = defineTask('dockerfile-setup', (args, taskCtx) => ({ kind: 'skill', title: `Dockerfile Setup - ${args.projectName}`, skill: { name: 'docker-skill', prompt: { role: 'Docker Architect', task: 'Create Dockerfile', context: args, instructions: ['1. Create base Dockerfile', '2. Configure base image', '3. Set up working directory', '4. Configure dependencies', '5. Set up build steps', '6. Configure production image', '7. Set up healthcheck', '8. Configure user', '9. Set up entrypoint', '10. Document Dockerfile'], outputFormat: 'JSON with Dockerfile setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'docker', 'dockerfile'] }));

export const multiStageSetupTask = defineTask('multi-stage-setup', (args, taskCtx) => ({ kind: 'agent', title: `Multi-Stage Setup - ${args.projectName}`, agent: { name: 'docker-multi-stage-specialist', prompt: { role: 'Docker Multi-Stage Specialist', task: 'Configure multi-stage builds', context: args, instructions: ['1. Create builder stage', '2. Configure deps stage', '3. Set up test stage', '4. Configure production stage', '5. Set up dev stage', '6. Configure build args', '7. Set up caching', '8. Configure outputs', '9. Set up targets', '10. Document stages'], outputFormat: 'JSON with multi-stage' }, outputSchema: { type: 'object', required: ['images', 'artifacts'], properties: { images: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'docker', 'multi-stage'] }));

export const composeSetupTask = defineTask('compose-setup', (args, taskCtx) => ({ kind: 'agent', title: `Compose Setup - ${args.projectName}`, agent: { name: 'docker-compose-specialist', prompt: { role: 'Docker Compose Specialist', task: 'Configure Docker Compose', context: args, instructions: ['1. Create compose file', '2. Configure services', '3. Set up networks', '4. Configure volumes', '5. Set up environment', '6. Configure depends_on', '7. Set up profiles', '8. Configure healthchecks', '9. Set up secrets', '10. Document compose'], outputFormat: 'JSON with compose' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'docker', 'compose'] }));

export const optimizationSetupTask = defineTask('optimization-setup', (args, taskCtx) => ({ kind: 'agent', title: `Optimization Setup - ${args.projectName}`, agent: { name: 'docker-optimization-specialist', prompt: { role: 'Docker Optimization Specialist', task: 'Optimize Docker images', context: args, instructions: ['1. Configure layer caching', '2. Set up .dockerignore', '3. Configure image size', '4. Set up security', '5. Configure Alpine', '6. Set up distroless', '7. Configure labels', '8. Set up scanning', '9. Configure CI caching', '10. Document optimization'], outputFormat: 'JSON with optimization' }, outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'docker', 'optimization'] }));

export const documentationTask = defineTask('docker-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate Docker documentation', context: args, instructions: ['1. Create README', '2. Document Dockerfile', '3. Create compose guide', '4. Document multi-stage', '5. Create optimization guide', '6. Document CI/CD', '7. Create troubleshooting', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'docker', 'documentation'] }));
