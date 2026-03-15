/**
 * @process specializations/web-development/remix-fullstack-app
 * @description Remix Full-Stack Application Development - Process for building web applications with Remix focusing on
 * web fundamentals, nested routing, progressive enhancement, loaders/actions, and form handling.
 * @inputs { projectName: string, database?: string, styling?: string, deployment?: string, features?: object }
 * @outputs { success: boolean, routes: array, loaders: array, actions: array, configuration: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/web-development/remix-fullstack-app', {
 *   projectName: 'MyRemixApp',
 *   database: 'prisma',
 *   styling: 'tailwind',
 *   deployment: 'fly',
 *   features: { auth: true, forms: true }
 * });
 *
 * @references
 * - Remix Documentation: https://remix.run/docs
 * - Web Fetch API: https://developer.mozilla.org/docs/Web/API/Fetch_API
 * - Prisma: https://www.prisma.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    database = 'prisma',
    styling = 'tailwind',
    deployment = 'fly',
    features = { auth: true, forms: true },
    outputDir = 'remix-fullstack-app'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Remix Full-Stack Application: ${projectName}`);

  // ============================================================================
  // PHASE 1: PROJECT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up Remix project');

  const projectSetup = await ctx.task(projectSetupTask, {
    projectName,
    styling,
    outputDir
  });

  artifacts.push(...projectSetup.artifacts);

  // ============================================================================
  // PHASE 2: ROUTING CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring nested routing');

  const routingSetup = await ctx.task(routingSetupTask, {
    projectName,
    features,
    outputDir
  });

  artifacts.push(...routingSetup.artifacts);

  // ============================================================================
  // PHASE 3: LOADERS AND DATA FETCHING
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing loaders for data fetching');

  const loadersSetup = await ctx.task(loadersSetupTask, {
    projectName,
    database,
    outputDir
  });

  artifacts.push(...loadersSetup.artifacts);

  // ============================================================================
  // PHASE 4: ACTIONS AND MUTATIONS
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing actions for mutations');

  const actionsSetup = await ctx.task(actionsSetupTask, {
    projectName,
    database,
    outputDir
  });

  artifacts.push(...actionsSetup.artifacts);

  // ============================================================================
  // PHASE 5: FORM HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up form handling with progressive enhancement');

  const formsSetup = await ctx.task(formsSetupTask, {
    projectName,
    outputDir
  });

  artifacts.push(...formsSetup.artifacts);

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
  // PHASE 7: ERROR HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing error handling');

  const errorHandling = await ctx.task(errorHandlingTask, {
    projectName,
    outputDir
  });

  artifacts.push(...errorHandling.artifacts);

  // Quality Gate
  await ctx.breakpoint({
    question: `Remix application setup complete for ${projectName}. ${routingSetup.routes.length} routes with loaders and actions. Approve configuration?`,
    title: 'Remix Application Review',
    context: {
      runId: ctx.runId,
      routes: routingSetup.routes,
      loaders: loadersSetup.loaders,
      actions: actionsSetup.actions,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 8: DEPLOYMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Configuring deployment');

  const deploymentConfig = await ctx.task(deploymentConfigTask, {
    projectName,
    deployment,
    outputDir
  });

  artifacts.push(...deploymentConfig.artifacts);

  // ============================================================================
  // PHASE 9: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating documentation');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    routingSetup,
    loadersSetup,
    actionsSetup,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    routes: routingSetup.routes,
    loaders: loadersSetup.loaders,
    actions: actionsSetup.actions,
    forms: formsSetup.forms,
    database: databaseSetup.schema,
    configuration: {
      styling,
      deployment,
      database
    },
    documentation: documentation.docs,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/web-development/remix-fullstack-app',
      timestamp: startTime,
      deployment
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const projectSetupTask = defineTask('remix-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 1: Remix Setup - ${args.projectName}`,
  skill: {
    name: 'remix-skill',
    prompt: {
      role: 'Senior Remix Developer',
      task: 'Set up Remix project',
      context: args,
      instructions: [
        '1. Initialize Remix project',
        '2. Configure TypeScript',
        '3. Set up Tailwind CSS',
        '4. Configure ESLint and Prettier',
        '5. Set up path aliases',
        '6. Configure remix.config.js',
        '7. Set up environment variables',
        '8. Configure server runtime',
        '9. Set up entry files',
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
  labels: ['web', 'remix', 'setup']
}));

export const routingSetupTask = defineTask('remix-routing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Remix Routing - ${args.projectName}`,
  agent: {
    name: 'remix-routing-specialist',
    prompt: {
      role: 'Remix Routing Specialist',
      task: 'Configure nested routing',
      context: args,
      instructions: [
        '1. Create route file structure',
        '2. Set up nested routes',
        '3. Implement pathless layouts',
        '4. Create dynamic routes',
        '5. Set up catch-all routes',
        '6. Implement resource routes',
        '7. Configure route prefetching',
        '8. Set up index routes',
        '9. Implement outlet patterns',
        '10. Document routing patterns'
      ],
      outputFormat: 'JSON with routing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['routes', 'layouts', 'artifacts'],
      properties: {
        routes: { type: 'array', items: { type: 'string' } },
        layouts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'remix', 'routing']
}));

export const loadersSetupTask = defineTask('remix-loaders', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Remix Loaders - ${args.projectName}`,
  agent: {
    name: 'remix-data-specialist',
    prompt: {
      role: 'Remix Data Loading Specialist',
      task: 'Implement loaders',
      context: args,
      instructions: [
        '1. Create loader functions',
        '2. Implement parallel data loading',
        '3. Set up typed loaders',
        '4. Configure caching headers',
        '5. Implement defer for streaming',
        '6. Create loader utilities',
        '7. Set up error handling in loaders',
        '8. Implement redirect logic',
        '9. Create authenticated loaders',
        '10. Document loader patterns'
      ],
      outputFormat: 'JSON with loaders configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['loaders', 'utilities', 'artifacts'],
      properties: {
        loaders: { type: 'array', items: { type: 'object' } },
        utilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'remix', 'loaders', 'data-fetching']
}));

export const actionsSetupTask = defineTask('remix-actions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Remix Actions - ${args.projectName}`,
  agent: {
    name: 'remix-actions-specialist',
    prompt: {
      role: 'Remix Actions Specialist',
      task: 'Implement actions',
      context: args,
      instructions: [
        '1. Create action functions',
        '2. Implement form processing',
        '3. Set up validation with Zod',
        '4. Create typed actions',
        '5. Implement intent handling',
        '6. Set up action redirects',
        '7. Create action utilities',
        '8. Implement optimistic UI',
        '9. Handle file uploads',
        '10. Document action patterns'
      ],
      outputFormat: 'JSON with actions configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'validation', 'artifacts'],
      properties: {
        actions: { type: 'array', items: { type: 'object' } },
        validation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'remix', 'actions', 'mutations']
}));

export const formsSetupTask = defineTask('remix-forms', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Remix Forms - ${args.projectName}`,
  agent: {
    name: 'remix-forms-specialist',
    prompt: {
      role: 'Remix Forms Specialist',
      task: 'Set up form handling',
      context: args,
      instructions: [
        '1. Create Form components',
        '2. Implement useFetcher patterns',
        '3. Set up progressive enhancement',
        '4. Create form validation UI',
        '5. Implement useActionData',
        '6. Set up useNavigation states',
        '7. Create reusable form components',
        '8. Implement multi-step forms',
        '9. Handle form errors',
        '10. Document form patterns'
      ],
      outputFormat: 'JSON with forms configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['forms', 'components', 'artifacts'],
      properties: {
        forms: { type: 'array' },
        components: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'remix', 'forms']
}));

export const databaseSetupTask = defineTask('remix-database', (args, taskCtx) => ({
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
        '4. Create db singleton',
        '5. Implement models',
        '6. Set up seed data',
        '7. Configure connection',
        '8. Create db utilities',
        '9. Implement transactions',
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
  labels: ['web', 'remix', 'database', 'prisma']
}));

export const errorHandlingTask = defineTask('remix-error-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Error Handling - ${args.projectName}`,
  agent: {
    name: 'remix-error-specialist',
    prompt: {
      role: 'Remix Error Handling Specialist',
      task: 'Implement error handling',
      context: args,
      instructions: [
        '1. Create ErrorBoundary components',
        '2. Implement CatchBoundary',
        '3. Set up root error handling',
        '4. Create route-level errors',
        '5. Implement error logging',
        '6. Create error UI components',
        '7. Set up 404 handling',
        '8. Implement error recovery',
        '9. Create error utilities',
        '10. Document error patterns'
      ],
      outputFormat: 'JSON with error handling'
    },
    outputSchema: {
      type: 'object',
      required: ['errorBoundaries', 'utilities', 'artifacts'],
      properties: {
        errorBoundaries: { type: 'array' },
        utilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'remix', 'error-handling']
}));

export const deploymentConfigTask = defineTask('remix-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Deployment - ${args.projectName}`,
  agent: {
    name: 'remix-devops',
    prompt: {
      role: 'Remix DevOps Engineer',
      task: 'Configure deployment',
      context: args,
      instructions: [
        '1. Configure deployment target',
        '2. Set up build process',
        '3. Configure environment variables',
        '4. Set up database connection',
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
  labels: ['web', 'remix', 'deployment']
}));

export const documentationTask = defineTask('remix-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate Remix documentation',
      context: args,
      instructions: [
        '1. Create README',
        '2. Document routing',
        '3. Create loader documentation',
        '4. Document actions',
        '5. Create form guide',
        '6. Document database',
        '7. Create error handling guide',
        '8. Document deployment',
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
  labels: ['web', 'remix', 'documentation']
}));
