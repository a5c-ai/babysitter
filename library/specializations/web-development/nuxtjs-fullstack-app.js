/**
 * @process specializations/web-development/nuxtjs-fullstack-app
 * @description Nuxt.js Full-Stack Application Development - Comprehensive process for building Vue-based full-stack applications
 * with Nuxt.js, server routes, auto-imports, modules, hybrid rendering, and deployment.
 * @inputs { projectName: string, rendering?: string, modules?: array, database?: string, deployment?: string }
 * @outputs { success: boolean, pages: array, serverRoutes: array, composables: array, configuration: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/web-development/nuxtjs-fullstack-app', {
 *   projectName: 'MyNuxtApp',
 *   rendering: 'hybrid',
 *   modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
 *   database: 'prisma',
 *   deployment: 'vercel'
 * });
 *
 * @references
 * - Nuxt 3 Documentation: https://nuxt.com/docs
 * - Nitro Server: https://nitro.unjs.io/
 * - Nuxt Modules: https://nuxt.com/modules
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    rendering = 'hybrid',
    modules = ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
    database = 'prisma',
    deployment = 'vercel',
    outputDir = 'nuxtjs-fullstack-app'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Nuxt.js Full-Stack Application: ${projectName}`);

  // ============================================================================
  // PHASE 1: PROJECT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up Nuxt 3 project');

  const projectSetup = await ctx.task(projectSetupTask, {
    projectName,
    modules,
    outputDir
  });

  artifacts.push(...projectSetup.artifacts);

  // ============================================================================
  // PHASE 2: MODULE CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring Nuxt modules');

  const modulesSetup = await ctx.task(modulesSetupTask, {
    projectName,
    modules,
    outputDir
  });

  artifacts.push(...modulesSetup.artifacts);

  // ============================================================================
  // PHASE 3: PAGES AND ROUTING
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating pages and routing');

  const pagesSetup = await ctx.task(pagesSetupTask, {
    projectName,
    rendering,
    outputDir
  });

  artifacts.push(...pagesSetup.artifacts);

  // ============================================================================
  // PHASE 4: COMPOSABLES
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating composables');

  const composablesSetup = await ctx.task(composablesSetupTask, {
    projectName,
    outputDir
  });

  artifacts.push(...composablesSetup.artifacts);

  // ============================================================================
  // PHASE 5: SERVER ROUTES (NITRO)
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating server routes with Nitro');

  const serverRoutesSetup = await ctx.task(serverRoutesSetupTask, {
    projectName,
    database,
    outputDir
  });

  artifacts.push(...serverRoutesSetup.artifacts);

  // ============================================================================
  // PHASE 6: DATABASE INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Integrating database');

  const databaseSetup = await ctx.task(databaseSetupTask, {
    projectName,
    database,
    outputDir
  });

  artifacts.push(...databaseSetup.artifacts);

  // ============================================================================
  // PHASE 7: STATE MANAGEMENT (PINIA)
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up Pinia state management');

  const stateSetup = await ctx.task(stateSetupTask, {
    projectName,
    outputDir
  });

  artifacts.push(...stateSetup.artifacts);

  // Quality Gate
  await ctx.breakpoint({
    question: `Nuxt.js application setup complete for ${projectName}. ${pagesSetup.pages.length} pages, ${serverRoutesSetup.routes.length} server routes. Approve configuration?`,
    title: 'Nuxt.js Application Review',
    context: {
      runId: ctx.runId,
      pages: pagesSetup.pages,
      serverRoutes: serverRoutesSetup.routes,
      composables: composablesSetup.composables,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'vue' }))
    }
  });

  // ============================================================================
  // PHASE 8: DEPLOYMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Configuring deployment');

  const deploymentConfig = await ctx.task(deploymentConfigTask, {
    projectName,
    deployment,
    rendering,
    outputDir
  });

  artifacts.push(...deploymentConfig.artifacts);

  // ============================================================================
  // PHASE 9: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating documentation');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    pagesSetup,
    serverRoutesSetup,
    composablesSetup,
    stateSetup,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    pages: pagesSetup.pages,
    serverRoutes: serverRoutesSetup.routes,
    composables: composablesSetup.composables,
    stores: stateSetup.stores,
    configuration: {
      rendering,
      modules,
      database,
      deployment
    },
    documentation: documentation.docs,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/web-development/nuxtjs-fullstack-app',
      timestamp: startTime,
      rendering
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const projectSetupTask = defineTask('nuxt-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 1: Nuxt Setup - ${args.projectName}`,
  skill: {
    name: 'nuxt-skill',
    prompt: {
      role: 'Senior Nuxt.js Developer',
      task: 'Set up Nuxt 3 project',
      context: args,
      instructions: [
        '1. Initialize Nuxt 3 project with nuxi',
        '2. Configure TypeScript',
        '3. Set up nuxt.config.ts',
        '4. Configure auto-imports',
        '5. Set up ESLint and Prettier',
        '6. Configure path aliases',
        '7. Set up environment variables',
        '8. Configure devtools',
        '9. Set up components directory',
        '10. Create folder structure'
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
  labels: ['web', 'nuxt', 'setup']
}));

export const modulesSetupTask = defineTask('nuxt-modules', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Nuxt Modules - ${args.projectName}`,
  agent: {
    name: 'nuxt-modules-specialist',
    prompt: {
      role: 'Nuxt Modules Specialist',
      task: 'Configure Nuxt modules',
      context: args,
      instructions: [
        '1. Install required modules',
        '2. Configure Tailwind CSS module',
        '3. Set up Pinia module',
        '4. Configure image module',
        '5. Set up content module if needed',
        '6. Configure i18n module',
        '7. Set up auth module',
        '8. Configure SEO module',
        '9. Set up custom modules',
        '10. Document module configuration'
      ],
      outputFormat: 'JSON with modules configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['modules', 'configuration', 'artifacts'],
      properties: {
        modules: { type: 'array' },
        configuration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'nuxt', 'modules']
}));

export const pagesSetupTask = defineTask('nuxt-pages', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Nuxt Pages - ${args.projectName}`,
  agent: {
    name: 'nuxt-routing-specialist',
    prompt: {
      role: 'Nuxt Routing Specialist',
      task: 'Create pages and routing',
      context: args,
      instructions: [
        '1. Create pages directory structure',
        '2. Implement dynamic routes',
        '3. Set up nested routes',
        '4. Configure route middleware',
        '5. Implement page transitions',
        '6. Set up route validation',
        '7. Configure page meta',
        '8. Implement layouts',
        '9. Set up error pages',
        '10. Document routing patterns'
      ],
      outputFormat: 'JSON with pages configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['pages', 'layouts', 'artifacts'],
      properties: {
        pages: { type: 'array', items: { type: 'string' } },
        layouts: { type: 'array' },
        middleware: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'nuxt', 'pages', 'routing']
}));

export const composablesSetupTask = defineTask('nuxt-composables', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Nuxt Composables - ${args.projectName}`,
  agent: {
    name: 'nuxt-composables-specialist',
    prompt: {
      role: 'Nuxt Composables Specialist',
      task: 'Create composables',
      context: args,
      instructions: [
        '1. Create composables directory',
        '2. Implement useFetch patterns',
        '3. Create useAsyncData composables',
        '4. Implement useState patterns',
        '5. Create custom composables',
        '6. Set up auto-imports',
        '7. Create typed composables',
        '8. Implement error handling',
        '9. Create utility composables',
        '10. Document composable patterns'
      ],
      outputFormat: 'JSON with composables'
    },
    outputSchema: {
      type: 'object',
      required: ['composables', 'utilities', 'artifacts'],
      properties: {
        composables: { type: 'array', items: { type: 'object' } },
        utilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'nuxt', 'composables']
}));

export const serverRoutesSetupTask = defineTask('nuxt-server-routes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Nuxt Server Routes - ${args.projectName}`,
  agent: {
    name: 'nitro-specialist',
    prompt: {
      role: 'Nitro Server Specialist',
      task: 'Create server routes',
      context: args,
      instructions: [
        '1. Create server/api directory',
        '2. Implement API endpoints',
        '3. Set up route handlers',
        '4. Configure middleware',
        '5. Implement validation',
        '6. Set up error handling',
        '7. Create utilities',
        '8. Implement caching',
        '9. Set up storage',
        '10. Document API patterns'
      ],
      outputFormat: 'JSON with server routes'
    },
    outputSchema: {
      type: 'object',
      required: ['routes', 'middleware', 'artifacts'],
      properties: {
        routes: { type: 'array', items: { type: 'object' } },
        middleware: { type: 'array' },
        utilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'nuxt', 'nitro', 'api']
}));

export const databaseSetupTask = defineTask('nuxt-database', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 6: Database Setup - ${args.projectName}`,
  skill: {
    name: 'prisma-skill',
    prompt: {
      role: 'Database Specialist',
      task: 'Integrate database',
      context: args,
      instructions: [
        '1. Install Prisma',
        '2. Create schema',
        '3. Set up migrations',
        '4. Create db utility',
        '5. Configure connection',
        '6. Set up seed data',
        '7. Create models',
        '8. Implement transactions',
        '9. Set up indexes',
        '10. Document schema'
      ],
      outputFormat: 'JSON with database configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['schema', 'models', 'artifacts'],
      properties: {
        schema: { type: 'object' },
        models: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'nuxt', 'database', 'prisma']
}));

export const stateSetupTask = defineTask('nuxt-state', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 7: State Management - ${args.projectName}`,
  skill: {
    name: 'pinia-skill',
    prompt: {
      role: 'Pinia State Management Specialist',
      task: 'Set up Pinia',
      context: args,
      instructions: [
        '1. Configure Pinia module',
        '2. Create stores directory',
        '3. Implement stores with setup syntax',
        '4. Set up persistence',
        '5. Create store composables',
        '6. Implement actions',
        '7. Set up getters',
        '8. Configure devtools',
        '9. Create store utilities',
        '10. Document store patterns'
      ],
      outputFormat: 'JSON with state configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['stores', 'configuration', 'artifacts'],
      properties: {
        stores: { type: 'array', items: { type: 'string' } },
        configuration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'nuxt', 'pinia', 'state-management']
}));

export const deploymentConfigTask = defineTask('nuxt-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Deployment - ${args.projectName}`,
  agent: {
    name: 'nuxt-devops',
    prompt: {
      role: 'Nuxt DevOps Engineer',
      task: 'Configure deployment',
      context: args,
      instructions: [
        '1. Configure deployment preset',
        '2. Set up environment variables',
        '3. Configure build settings',
        '4. Set up prerendering',
        '5. Configure caching',
        '6. Set up CI/CD',
        '7. Configure monitoring',
        '8. Set up logging',
        '9. Configure scaling',
        '10. Document deployment'
      ],
      outputFormat: 'JSON with deployment configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'preset', 'artifacts'],
      properties: {
        config: { type: 'object' },
        preset: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'nuxt', 'deployment']
}));

export const documentationTask = defineTask('nuxt-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate Nuxt documentation',
      context: args,
      instructions: [
        '1. Create README',
        '2. Document pages and routing',
        '3. Create composables documentation',
        '4. Document server routes',
        '5. Create state management guide',
        '6. Document database',
        '7. Create deployment guide',
        '8. Document modules',
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
  labels: ['web', 'nuxt', 'documentation']
}));
