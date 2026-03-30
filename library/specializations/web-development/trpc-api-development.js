/**
 * @process specializations/web-development/trpc-api-development
 * @description tRPC API Development for Type-Safe APIs - Process for building end-to-end type-safe APIs with tRPC,
 * procedures, routers, input validation with Zod, and integration with Next.js or other frontends.
 * @inputs { projectName: string, framework?: string, database?: string, features?: object }
 * @outputs { success: boolean, routers: array, procedures: array, validation: object, artifacts: array }
 *
 * @references
 * - tRPC Documentation: https://trpc.io/
 * - Zod Validation: https://zod.dev/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'nextjs',
    database = 'prisma',
    features = { subscriptions: false, batching: true },
    outputDir = 'trpc-api-development'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting tRPC API Development: ${projectName}`);

  const projectSetup = await ctx.task(projectSetupTask, { projectName, framework, outputDir });
  artifacts.push(...projectSetup.artifacts);

  const contextSetup = await ctx.task(contextSetupTask, { projectName, database, outputDir });
  artifacts.push(...contextSetup.artifacts);

  const routersSetup = await ctx.task(routersSetupTask, { projectName, outputDir });
  artifacts.push(...routersSetup.artifacts);

  const proceduresSetup = await ctx.task(proceduresSetupTask, { projectName, outputDir });
  artifacts.push(...proceduresSetup.artifacts);

  const validationSetup = await ctx.task(validationSetupTask, { projectName, outputDir });
  artifacts.push(...validationSetup.artifacts);

  const middlewareSetup = await ctx.task(middlewareSetupTask, { projectName, outputDir });
  artifacts.push(...middlewareSetup.artifacts);

  const clientSetup = await ctx.task(clientSetupTask, { projectName, framework, outputDir });
  artifacts.push(...clientSetup.artifacts);

  await ctx.breakpoint({
    question: `tRPC API setup complete for ${projectName}. ${routersSetup.routers.length} routers, ${proceduresSetup.procedures.length} procedures. Approve?`,
    title: 'tRPC API Review',
    context: { runId: ctx.runId, routers: routersSetup.routers, procedures: proceduresSetup.procedures }
  });

  const testingSetup = await ctx.task(testingSetupTask, { projectName, outputDir });
  artifacts.push(...testingSetup.artifacts);

  const documentation = await ctx.task(documentationTask, { projectName, routersSetup, proceduresSetup, outputDir });
  artifacts.push(...documentation.artifacts);

  return {
    success: true,
    projectName,
    routers: routersSetup.routers,
    procedures: proceduresSetup.procedures,
    validation: validationSetup.schemas,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/web-development/trpc-api-development', timestamp: startTime }
  };
}

export const projectSetupTask = defineTask('trpc-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `tRPC Setup - ${args.projectName}`,
  skill: {
    name: 'trpc-skill',
    prompt: {
      role: 'tRPC Developer',
      task: 'Set up tRPC project',
      context: args,
      instructions: ['1. Install tRPC packages', '2. Configure TypeScript', '3. Set up folder structure', '4. Configure server adapter', '5. Set up error handling', '6. Configure batching', '7. Set up logging', '8. Configure environment', '9. Set up transformer', '10. Document setup'],
      outputFormat: 'JSON with project setup'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'trpc', 'setup']
}));

export const contextSetupTask = defineTask('trpc-context', (args, taskCtx) => ({
  kind: 'agent',
  title: `tRPC Context - ${args.projectName}`,
  agent: {
    name: 'trpc-context-specialist',
    prompt: {
      role: 'tRPC Context Specialist',
      task: 'Set up tRPC context',
      context: args,
      instructions: ['1. Create context factory', '2. Add database client', '3. Set up session handling', '4. Add user context', '5. Configure utilities', '6. Set up request info', '7. Add permissions', '8. Configure logging', '9. Create typed context', '10. Document context'],
      outputFormat: 'JSON with context setup'
    },
    outputSchema: { type: 'object', required: ['context', 'artifacts'], properties: { context: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'trpc', 'context']
}));

export const routersSetupTask = defineTask('trpc-routers', (args, taskCtx) => ({
  kind: 'agent',
  title: `tRPC Routers - ${args.projectName}`,
  agent: {
    name: 'trpc-router-developer',
    prompt: {
      role: 'tRPC Router Developer',
      task: 'Create tRPC routers',
      context: args,
      instructions: ['1. Create root router', '2. Create feature routers', '3. Set up router merging', '4. Configure namespacing', '5. Set up router exports', '6. Create router types', '7. Configure inference', '8. Set up router utilities', '9. Organize router structure', '10. Document routers'],
      outputFormat: 'JSON with routers'
    },
    outputSchema: { type: 'object', required: ['routers', 'artifacts'], properties: { routers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'trpc', 'routers']
}));

export const proceduresSetupTask = defineTask('trpc-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: `tRPC Procedures - ${args.projectName}`,
  agent: {
    name: 'trpc-procedure-developer',
    prompt: {
      role: 'tRPC Procedure Developer',
      task: 'Create tRPC procedures',
      context: args,
      instructions: ['1. Create base procedures', '2. Implement public procedures', '3. Create protected procedures', '4. Set up admin procedures', '5. Implement queries', '6. Create mutations', '7. Configure input validation', '8. Set up output validation', '9. Create procedure utilities', '10. Document procedures'],
      outputFormat: 'JSON with procedures'
    },
    outputSchema: { type: 'object', required: ['procedures', 'artifacts'], properties: { procedures: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'trpc', 'procedures']
}));

export const validationSetupTask = defineTask('trpc-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `tRPC Validation - ${args.projectName}`,
  agent: {
    name: 'zod-validation-specialist',
    prompt: {
      role: 'Zod Validation Specialist',
      task: 'Set up Zod validation',
      context: args,
      instructions: ['1. Create input schemas', '2. Create output schemas', '3. Set up shared schemas', '4. Implement custom validators', '5. Create schema utilities', '6. Set up error messages', '7. Configure type inference', '8. Create form schemas', '9. Implement transformations', '10. Document schemas'],
      outputFormat: 'JSON with validation'
    },
    outputSchema: { type: 'object', required: ['schemas', 'artifacts'], properties: { schemas: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'trpc', 'zod', 'validation']
}));

export const middlewareSetupTask = defineTask('trpc-middleware', (args, taskCtx) => ({
  kind: 'agent',
  title: `tRPC Middleware - ${args.projectName}`,
  agent: {
    name: 'trpc-middleware-specialist',
    prompt: {
      role: 'tRPC Middleware Specialist',
      task: 'Create tRPC middleware',
      context: args,
      instructions: ['1. Create auth middleware', '2. Implement logging middleware', '3. Set up rate limiting', '4. Create timing middleware', '5. Implement error handling', '6. Set up permission checks', '7. Create audit middleware', '8. Configure caching', '9. Create composition patterns', '10. Document middleware'],
      outputFormat: 'JSON with middleware'
    },
    outputSchema: { type: 'object', required: ['middleware', 'artifacts'], properties: { middleware: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'trpc', 'middleware']
}));

export const clientSetupTask = defineTask('trpc-client', (args, taskCtx) => ({
  kind: 'agent',
  title: `tRPC Client - ${args.projectName}`,
  agent: {
    name: 'trpc-client-specialist',
    prompt: {
      role: 'tRPC Client Specialist',
      task: 'Set up tRPC client',
      context: args,
      instructions: ['1. Configure tRPC client', '2. Set up React Query integration', '3. Create client utilities', '4. Configure SSR/SSG', '5. Set up optimistic updates', '6. Configure prefetching', '7. Create custom hooks', '8. Set up error handling', '9. Configure devtools', '10. Document client usage'],
      outputFormat: 'JSON with client setup'
    },
    outputSchema: { type: 'object', required: ['client', 'hooks', 'artifacts'], properties: { client: { type: 'object' }, hooks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'trpc', 'client']
}));

export const testingSetupTask = defineTask('trpc-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `tRPC Testing - ${args.projectName}`,
  agent: {
    name: 'trpc-testing-specialist',
    prompt: {
      role: 'tRPC Testing Specialist',
      task: 'Set up tRPC testing',
      context: args,
      instructions: ['1. Configure test setup', '2. Create procedure tests', '3. Test input validation', '4. Test middleware', '5. Create integration tests', '6. Set up mock context', '7. Test error handling', '8. Configure coverage', '9. Create test utilities', '10. Document testing'],
      outputFormat: 'JSON with testing'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'trpc', 'testing']
}));

export const documentationTask = defineTask('trpc-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `tRPC Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate tRPC documentation',
      context: args,
      instructions: ['1. Create README', '2. Document routers', '3. Create procedure examples', '4. Document validation', '5. Create middleware guide', '6. Document client usage', '7. Create error handling guide', '8. Document testing', '9. Create migration guide', '10. Generate API reference'],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'trpc', 'documentation']
}));
