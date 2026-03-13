/**
 * @process specializations/web-development/t3-stack-development
 * @description T3 Stack Application Development - Process for building type-safe full-stack applications with Next.js,
 * TypeScript, tRPC, Prisma, and Tailwind CSS (Create T3 App stack).
 * @inputs { projectName: string, database?: string, auth?: string, features?: object }
 * @outputs { success: boolean, trpcRouters: array, prismaModels: array, components: array, configuration: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/web-development/t3-stack-development', {
 *   projectName: 'MyT3App',
 *   database: 'postgresql',
 *   auth: 'nextauth',
 *   features: { trpc: true, prisma: true, tailwind: true }
 * });
 *
 * @references
 * - T3 Stack Documentation: https://create.t3.gg/
 * - tRPC: https://trpc.io/
 * - Prisma: https://www.prisma.io/
 * - NextAuth.js: https://next-auth.js.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    database = 'postgresql',
    auth = 'nextauth',
    features = { trpc: true, prisma: true, tailwind: true },
    outputDir = 't3-stack-development'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting T3 Stack Application: ${projectName}`);

  // ============================================================================
  // PHASE 1: PROJECT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up T3 Stack project');

  const projectSetup = await ctx.task(projectSetupTask, {
    projectName,
    features,
    outputDir
  });

  artifacts.push(...projectSetup.artifacts);

  // ============================================================================
  // PHASE 2: PRISMA SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up Prisma with type-safe database access');

  const prismaSetup = await ctx.task(prismaSetupTask, {
    projectName,
    database,
    outputDir
  });

  artifacts.push(...prismaSetup.artifacts);

  // ============================================================================
  // PHASE 3: TRPC CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring tRPC for type-safe APIs');

  const trpcSetup = await ctx.task(trpcSetupTask, {
    projectName,
    prismaSetup,
    outputDir
  });

  artifacts.push(...trpcSetup.artifacts);

  // ============================================================================
  // PHASE 4: AUTHENTICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up NextAuth.js authentication');

  const authSetup = await ctx.task(authSetupTask, {
    projectName,
    auth,
    prismaSetup,
    outputDir
  });

  artifacts.push(...authSetup.artifacts);

  // ============================================================================
  // PHASE 5: TRPC ROUTERS
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating tRPC routers and procedures');

  const routersSetup = await ctx.task(trpcRoutersTask, {
    projectName,
    prismaSetup,
    authSetup,
    outputDir
  });

  artifacts.push(...routersSetup.artifacts);

  // ============================================================================
  // PHASE 6: REACT QUERY INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Integrating tRPC with React Query');

  const reactQuerySetup = await ctx.task(reactQueryIntegrationTask, {
    projectName,
    trpcSetup,
    outputDir
  });

  artifacts.push(...reactQuerySetup.artifacts);

  // ============================================================================
  // PHASE 7: COMPONENTS
  // ============================================================================

  ctx.log('info', 'Phase 7: Building type-safe React components');

  const componentsSetup = await ctx.task(componentsSetupTask, {
    projectName,
    trpcSetup,
    outputDir
  });

  artifacts.push(...componentsSetup.artifacts);

  // Quality Gate
  await ctx.breakpoint({
    question: `T3 Stack setup complete for ${projectName}. ${routersSetup.routers.length} tRPC routers, ${prismaSetup.models.length} Prisma models. Approve configuration?`,
    title: 'T3 Stack Review',
    context: {
      runId: ctx.runId,
      routers: routersSetup.routers,
      models: prismaSetup.models,
      components: componentsSetup.components,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 8: VALIDATION (ZOD)
  // ============================================================================

  ctx.log('info', 'Phase 8: Setting up Zod validation schemas');

  const validationSetup = await ctx.task(validationSetupTask, {
    projectName,
    prismaSetup,
    outputDir
  });

  artifacts.push(...validationSetup.artifacts);

  // ============================================================================
  // PHASE 9: DEPLOYMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Configuring deployment');

  const deploymentConfig = await ctx.task(deploymentConfigTask, {
    projectName,
    database,
    outputDir
  });

  artifacts.push(...deploymentConfig.artifacts);

  // ============================================================================
  // PHASE 10: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating documentation');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    prismaSetup,
    trpcSetup,
    routersSetup,
    authSetup,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    trpcRouters: routersSetup.routers,
    prismaModels: prismaSetup.models,
    components: componentsSetup.components,
    validation: validationSetup.schemas,
    configuration: {
      database,
      auth,
      features
    },
    documentation: documentation.docs,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/web-development/t3-stack-development',
      timestamp: startTime,
      database,
      auth
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const projectSetupTask = defineTask('t3-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: T3 Stack Setup - ${args.projectName}`,
  agent: {
    name: 'nextjs-developer-agent',
    prompt: {
      role: 'T3 Stack Developer',
      task: 'Set up T3 Stack project',
      context: args,
      instructions: [
        '1. Initialize with create-t3-app',
        '2. Configure TypeScript strict mode',
        '3. Set up Tailwind CSS',
        '4. Configure path aliases',
        '5. Set up ESLint',
        '6. Configure environment variables',
        '7. Set up next.config.js',
        '8. Configure folder structure',
        '9. Set up Git hooks',
        '10. Document setup'
      ],
      outputFormat: 'JSON with project setup'
    },
    outputSchema: {
      type: 'object',
      required: ['projectPath', 'configuration', 'artifacts'],
      properties: {
        projectPath: { type: 'string' },
        configuration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 't3', 'setup']
}));

export const prismaSetupTask = defineTask('prisma-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 2: Prisma Setup - ${args.projectName}`,
  skill: {
    name: 'prisma-skill',
    prompt: {
      role: 'Prisma Specialist',
      task: 'Set up Prisma with type-safe database access',
      context: args,
      instructions: [
        '1. Configure Prisma schema',
        '2. Set up database connection',
        '3. Create models',
        '4. Configure relations',
        '5. Set up migrations',
        '6. Create Prisma client singleton',
        '7. Set up seed data',
        '8. Configure indexes',
        '9. Generate types',
        '10. Document schema'
      ],
      outputFormat: 'JSON with Prisma configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['models', 'schema', 'artifacts'],
      properties: {
        models: { type: 'array', items: { type: 'string' } },
        schema: { type: 'object' },
        migrations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 't3', 'prisma', 'database']
}));

export const trpcSetupTask = defineTask('trpc-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 3: tRPC Setup - ${args.projectName}`,
  skill: {
    name: 'trpc-skill',
    prompt: {
      role: 'tRPC Specialist',
      task: 'Configure tRPC for type-safe APIs',
      context: args,
      instructions: [
        '1. Configure tRPC server',
        '2. Set up context creation',
        '3. Create base procedures',
        '4. Configure middleware',
        '5. Set up error handling',
        '6. Create router structure',
        '7. Configure client',
        '8. Set up type inference',
        '9. Configure batching',
        '10. Document tRPC setup'
      ],
      outputFormat: 'JSON with tRPC configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'procedures', 'artifacts'],
      properties: {
        config: { type: 'object' },
        procedures: { type: 'array' },
        middleware: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 't3', 'trpc', 'api']
}));

export const authSetupTask = defineTask('nextauth-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 4: NextAuth Setup - ${args.projectName}`,
  skill: {
    name: 'nextauth-skill',
    prompt: {
      role: 'NextAuth Specialist',
      task: 'Set up NextAuth.js authentication',
      context: args,
      instructions: [
        '1. Configure NextAuth.js',
        '2. Set up Prisma adapter',
        '3. Configure providers',
        '4. Set up session handling',
        '5. Create auth callbacks',
        '6. Configure protected procedures',
        '7. Create auth utils',
        '8. Set up middleware',
        '9. Configure types',
        '10. Document auth setup'
      ],
      outputFormat: 'JSON with auth configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'providers', 'artifacts'],
      properties: {
        config: { type: 'object' },
        providers: { type: 'array' },
        callbacks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 't3', 'nextauth', 'authentication']
}));

export const trpcRoutersTask = defineTask('trpc-routers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: tRPC Routers - ${args.projectName}`,
  agent: {
    name: 'trpc-router-developer',
    prompt: {
      role: 'tRPC Router Developer',
      task: 'Create tRPC routers and procedures',
      context: args,
      instructions: [
        '1. Create feature routers',
        '2. Implement query procedures',
        '3. Create mutation procedures',
        '4. Implement subscriptions if needed',
        '5. Set up input validation',
        '6. Create protected procedures',
        '7. Implement pagination',
        '8. Set up optimistic updates',
        '9. Configure caching',
        '10. Document routers'
      ],
      outputFormat: 'JSON with routers configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['routers', 'procedures', 'artifacts'],
      properties: {
        routers: { type: 'array', items: { type: 'string' } },
        procedures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 't3', 'trpc', 'routers']
}));

export const reactQueryIntegrationTask = defineTask('react-query-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: React Query Integration - ${args.projectName}`,
  agent: {
    name: 'react-query-specialist',
    prompt: {
      role: 'React Query Specialist',
      task: 'Integrate tRPC with React Query',
      context: args,
      instructions: [
        '1. Configure tRPC React client',
        '2. Set up query hooks',
        '3. Create mutation hooks',
        '4. Configure query invalidation',
        '5. Set up optimistic updates',
        '6. Implement prefetching',
        '7. Configure devtools',
        '8. Set up SSR/SSG patterns',
        '9. Create utility hooks',
        '10. Document patterns'
      ],
      outputFormat: 'JSON with React Query integration'
    },
    outputSchema: {
      type: 'object',
      required: ['hooks', 'config', 'artifacts'],
      properties: {
        hooks: { type: 'array' },
        config: { type: 'object' },
        patterns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 't3', 'react-query', 'trpc']
}));

export const componentsSetupTask = defineTask('t3-components', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Components - ${args.projectName}`,
  agent: {
    name: 'component-developer-agent',
    prompt: {
      role: 'React Component Developer',
      task: 'Build type-safe React components',
      context: args,
      instructions: [
        '1. Create UI components with Tailwind',
        '2. Implement form components',
        '3. Build data display components',
        '4. Create loading states',
        '5. Implement error boundaries',
        '6. Build layout components',
        '7. Create typed props',
        '8. Implement accessibility',
        '9. Build reusable patterns',
        '10. Document components'
      ],
      outputFormat: 'JSON with components'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'artifacts'],
      properties: {
        components: { type: 'array', items: { type: 'object' } },
        utilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 't3', 'components', 'react']
}));

export const validationSetupTask = defineTask('zod-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Zod Validation - ${args.projectName}`,
  agent: {
    name: 'validation-specialist',
    prompt: {
      role: 'Validation Specialist',
      task: 'Set up Zod validation schemas',
      context: args,
      instructions: [
        '1. Create Zod schemas for models',
        '2. Implement input validation',
        '3. Create shared schemas',
        '4. Set up form validation',
        '5. Implement custom validators',
        '6. Create error messages',
        '7. Set up schema composition',
        '8. Configure type inference',
        '9. Create validation utilities',
        '10. Document schemas'
      ],
      outputFormat: 'JSON with validation schemas'
    },
    outputSchema: {
      type: 'object',
      required: ['schemas', 'utilities', 'artifacts'],
      properties: {
        schemas: { type: 'array', items: { type: 'string' } },
        utilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 't3', 'zod', 'validation']
}));

export const deploymentConfigTask = defineTask('t3-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Deployment - ${args.projectName}`,
  agent: {
    name: 't3-devops',
    prompt: {
      role: 'T3 Stack DevOps',
      task: 'Configure deployment',
      context: args,
      instructions: [
        '1. Configure Vercel deployment',
        '2. Set up database hosting',
        '3. Configure environment variables',
        '4. Set up CI/CD',
        '5. Configure preview deployments',
        '6. Set up monitoring',
        '7. Configure caching',
        '8. Set up logging',
        '9. Configure security',
        '10. Document deployment'
      ],
      outputFormat: 'JSON with deployment configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'cicd', 'artifacts'],
      properties: {
        config: { type: 'object' },
        cicd: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 't3', 'deployment']
}));

export const documentationTask = defineTask('t3-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate T3 Stack documentation',
      context: args,
      instructions: [
        '1. Create README',
        '2. Document Prisma schema',
        '3. Create tRPC documentation',
        '4. Document authentication',
        '5. Create component documentation',
        '6. Document validation schemas',
        '7. Create deployment guide',
        '8. Document type safety patterns',
        '9. Create troubleshooting guide',
        '10. Generate API docs'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['docs', 'artifacts'],
      properties: {
        docs: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 't3', 'documentation']
}));
