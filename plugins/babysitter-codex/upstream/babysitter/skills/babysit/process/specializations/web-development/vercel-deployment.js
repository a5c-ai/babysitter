/**
 * @process specializations/web-development/vercel-deployment
 * @description Vercel Deployment - Process for deploying web applications to Vercel with serverless functions, edge functions, and ISR.
 * @inputs { projectName: string, framework?: string }
 * @outputs { success: boolean, deployConfig: object, functions: array, artifacts: array }
 * @references - Vercel: https://vercel.com/docs
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, framework = 'nextjs', outputDir = 'vercel-deployment' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Vercel Deployment: ${projectName}`);

  const vercelSetup = await ctx.task(vercelSetupTask, { projectName, framework, outputDir });
  artifacts.push(...vercelSetup.artifacts);

  const functionsSetup = await ctx.task(functionsSetupTask, { projectName, outputDir });
  artifacts.push(...functionsSetup.artifacts);

  const edgeFunctions = await ctx.task(edgeFunctionsTask, { projectName, outputDir });
  artifacts.push(...edgeFunctions.artifacts);

  const domainSetup = await ctx.task(domainSetupTask, { projectName, outputDir });
  artifacts.push(...domainSetup.artifacts);

  await ctx.breakpoint({ question: `Vercel deployment complete for ${projectName}. Approve?`, title: 'Vercel Review', context: { runId: ctx.runId, config: vercelSetup.config } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, deployConfig: vercelSetup.config, functions: functionsSetup.functions, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/vercel-deployment', timestamp: startTime } };
}

export const vercelSetupTask = defineTask('vercel-setup', (args, taskCtx) => ({ kind: 'agent', title: `Vercel Setup - ${args.projectName}`, agent: { name: 'deployment-agent', prompt: { role: 'Vercel Architect', task: 'Configure Vercel deployment', context: args, instructions: ['1. Create vercel.json', '2. Configure framework preset', '3. Set up build settings', '4. Configure environment vars', '5. Set up regions', '6. Configure caching', '7. Set up headers', '8. Configure redirects', '9. Set up rewrites', '10. Document setup'], outputFormat: 'JSON with Vercel setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'vercel', 'setup'] }));

export const functionsSetupTask = defineTask('functions-setup', (args, taskCtx) => ({ kind: 'agent', title: `Functions Setup - ${args.projectName}`, agent: { name: 'serverless-functions-specialist', prompt: { role: 'Serverless Functions Specialist', task: 'Configure serverless functions', context: args, instructions: ['1. Create API routes', '2. Configure runtime', '3. Set up memory', '4. Configure timeout', '5. Set up regions', '6. Configure bundling', '7. Set up streaming', '8. Configure cron', '9. Set up OG images', '10. Document functions'], outputFormat: 'JSON with functions' }, outputSchema: { type: 'object', required: ['functions', 'artifacts'], properties: { functions: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'vercel', 'functions'] }));

export const edgeFunctionsTask = defineTask('edge-functions', (args, taskCtx) => ({ kind: 'agent', title: `Edge Functions - ${args.projectName}`, agent: { name: 'edge-functions-specialist', prompt: { role: 'Edge Functions Specialist', task: 'Configure edge functions', context: args, instructions: ['1. Create edge middleware', '2. Configure geolocation', '3. Set up A/B testing', '4. Configure authentication', '5. Set up rate limiting', '6. Configure redirects', '7. Set up localization', '8. Configure bot protection', '9. Set up edge config', '10. Document edge'], outputFormat: 'JSON with edge functions' }, outputSchema: { type: 'object', required: ['edgeFunctions', 'artifacts'], properties: { edgeFunctions: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'vercel', 'edge'] }));

export const domainSetupTask = defineTask('domain-setup', (args, taskCtx) => ({ kind: 'agent', title: `Domain Setup - ${args.projectName}`, agent: { name: 'domain-specialist', prompt: { role: 'Domain Specialist', task: 'Configure domain', context: args, instructions: ['1. Add custom domain', '2. Configure DNS', '3. Set up SSL', '4. Configure redirects', '5. Set up subdomains', '6. Configure wildcards', '7. Set up preview domains', '8. Configure branch domains', '9. Set up root domain', '10. Document domain'], outputFormat: 'JSON with domain setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'vercel', 'domain'] }));

export const documentationTask = defineTask('vercel-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate Vercel documentation', context: args, instructions: ['1. Create README', '2. Document configuration', '3. Create functions guide', '4. Document edge functions', '5. Create domain guide', '6. Document environment', '7. Create troubleshooting', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'vercel', 'documentation'] }));
