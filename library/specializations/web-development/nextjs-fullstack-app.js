/**
 * @process specializations/web-development/nextjs-fullstack-app
 * @description Next.js Full-Stack Application with App Router - Complete process for building full-stack applications with
 * Next.js 13+ App Router, React Server Components, server actions, API routes, database integration, and deployment.
 * @inputs { projectName: string, database?: string, auth?: string, styling?: string, deployment?: string }
 * @outputs { success: boolean, routes: array, serverComponents: array, apiRoutes: array, database: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/web-development/nextjs-fullstack-app', {
 *   projectName: 'MyNextApp',
 *   database: 'prisma-postgresql',
 *   auth: 'nextauth',
 *   styling: 'tailwind',
 *   deployment: 'vercel'
 * });
 *
 * @references
 * - Next.js Documentation: https://nextjs.org/docs
 * - React Server Components: https://nextjs.org/docs/app/building-your-application/rendering/server-components
 * - Prisma: https://www.prisma.io/
 * - NextAuth.js: https://next-auth.js.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    database = 'prisma-postgresql',
    auth = 'nextauth',
    styling = 'tailwind',
    deployment = 'vercel',
    outputDir = 'nextjs-fullstack-app'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Next.js Full-Stack Application: ${projectName}`);
  ctx.log('info', `Database: ${database}, Auth: ${auth}`);

  // ============================================================================
  // PHASE 1: PROJECT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up Next.js project with App Router');

  const projectSetup = await ctx.task(projectSetupTask, {
    projectName,
    styling,
    outputDir
  });

  artifacts.push(...projectSetup.artifacts);

  // ============================================================================
  // PHASE 2: APP ROUTER CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring App Router and layouts');

  const appRouterSetup = await ctx.task(appRouterSetupTask, {
    projectName,
    projectSetup,
    outputDir
  });

  artifacts.push(...appRouterSetup.artifacts);

  // ============================================================================
  // PHASE 3: REACT SERVER COMPONENTS
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing React Server Components');

  const serverComponents = await ctx.task(serverComponentsTask, {
    projectName,
    appRouterSetup,
    outputDir
  });

  artifacts.push(...serverComponents.artifacts);

  // ============================================================================
  // PHASE 4: DATABASE INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up database with Prisma');

  const databaseSetup = await ctx.task(databaseSetupTask, {
    projectName,
    database,
    outputDir
  });

  artifacts.push(...databaseSetup.artifacts);

  // ============================================================================
  // PHASE 5: SERVER ACTIONS
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Server Actions');

  const serverActions = await ctx.task(serverActionsTask, {
    projectName,
    databaseSetup,
    outputDir
  });

  artifacts.push(...serverActions.artifacts);

  // ============================================================================
  // PHASE 6: API ROUTES
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating API Routes');

  const apiRoutes = await ctx.task(apiRoutesTask, {
    projectName,
    databaseSetup,
    outputDir
  });

  artifacts.push(...apiRoutes.artifacts);

  // ============================================================================
  // PHASE 7: AUTHENTICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up authentication with NextAuth.js');

  const authSetup = await ctx.task(authSetupTask, {
    projectName,
    auth,
    databaseSetup,
    outputDir
  });

  artifacts.push(...authSetup.artifacts);

  // ============================================================================
  // PHASE 8: CLIENT COMPONENTS
  // ============================================================================

  ctx.log('info', 'Phase 8: Building Client Components');

  const clientComponents = await ctx.task(clientComponentsTask, {
    projectName,
    styling,
    outputDir
  });

  artifacts.push(...clientComponents.artifacts);

  // Quality Gate
  await ctx.breakpoint({
    question: `Next.js full-stack setup complete for ${projectName}. ${appRouterSetup.routes.length} routes, ${serverComponents.components.length} server components. Approve configuration?`,
    title: 'Next.js Full-Stack Review',
    context: {
      runId: ctx.runId,
      routes: appRouterSetup.routes,
      serverComponents: serverComponents.components,
      apiRoutes: apiRoutes.endpoints,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 9: DEPLOYMENT CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Configuring deployment');

  const deploymentConfig = await ctx.task(deploymentConfigTask, {
    projectName,
    deployment,
    databaseSetup,
    outputDir
  });

  artifacts.push(...deploymentConfig.artifacts);

  // ============================================================================
  // PHASE 10: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating documentation');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    appRouterSetup,
    serverComponents,
    databaseSetup,
    authSetup,
    apiRoutes,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    routes: appRouterSetup.routes,
    serverComponents: serverComponents.components,
    clientComponents: clientComponents.components,
    apiRoutes: apiRoutes.endpoints,
    database: databaseSetup.schema,
    authentication: authSetup.providers,
    deployment: deploymentConfig.config,
    documentation: documentation.docs,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/web-development/nextjs-fullstack-app',
      timestamp: startTime,
      database,
      auth
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const projectSetupTask = defineTask('nextjs-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Next.js Setup - ${args.projectName}`,
  agent: {
    name: 'nextjs-developer-agent',
    prompt: {
      role: 'Senior Next.js Developer',
      task: 'Set up Next.js project with App Router',
      context: args,
      instructions: [
        '1. Initialize Next.js 14+ project',
        '2. Configure TypeScript with strict settings',
        '3. Set up Tailwind CSS',
        '4. Configure ESLint and Prettier',
        '5. Set up path aliases',
        '6. Configure next.config.js',
        '7. Set up environment variables',
        '8. Configure fonts with next/font',
        '9. Set up metadata API',
        '10. Create initial folder structure'
      ],
      outputFormat: 'JSON with project setup'
    },
    outputSchema: {
      type: 'object',
      required: ['projectPath', 'configuration', 'artifacts'],
      properties: {
        projectPath: { type: 'string' },
        configuration: { type: 'object' },
        dependencies: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'nextjs', 'setup']
}));

export const appRouterSetupTask = defineTask('app-router-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 2: App Router Setup - ${args.projectName}`,
  skill: {
    name: 'nextjs-app-router-skill',
    prompt: {
      role: 'Next.js App Router Specialist',
      task: 'Configure App Router',
      context: args,
      instructions: [
        '1. Create app directory structure',
        '2. Set up root layout with providers',
        '3. Create route groups for organization',
        '4. Implement dynamic routes',
        '5. Set up parallel routes',
        '6. Configure intercepting routes',
        '7. Create loading states',
        '8. Set up error handling',
        '9. Implement not-found pages',
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
        routeGroups: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'nextjs', 'app-router']
}));

export const serverComponentsTask = defineTask('server-components', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 3: Server Components - ${args.projectName}`,
  skill: {
    name: 'react-server-components-skill',
    prompt: {
      role: 'React Server Components Specialist',
      task: 'Implement React Server Components',
      context: args,
      instructions: [
        '1. Create async server components',
        '2. Implement data fetching patterns',
        '3. Set up streaming with Suspense',
        '4. Create server-only utilities',
        '5. Implement caching strategies',
        '6. Set up revalidation patterns',
        '7. Create composition patterns',
        '8. Implement partial prerendering',
        '9. Set up ISR patterns',
        '10. Document RSC patterns'
      ],
      outputFormat: 'JSON with server components'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'patterns', 'artifacts'],
      properties: {
        components: { type: 'array', items: { type: 'object' } },
        patterns: { type: 'array' },
        caching: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'nextjs', 'rsc', 'server-components']
}));

export const databaseSetupTask = defineTask('database-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 4: Database Setup - ${args.projectName}`,
  skill: {
    name: 'prisma-skill',
    prompt: {
      role: 'Database Integration Specialist',
      task: 'Set up database with Prisma',
      context: args,
      instructions: [
        '1. Install and configure Prisma',
        '2. Create database schema',
        '3. Set up migrations',
        '4. Configure connection pooling',
        '5. Create Prisma client singleton',
        '6. Set up seed data',
        '7. Configure relations',
        '8. Set up database indexes',
        '9. Implement soft deletes',
        '10. Document database schema'
      ],
      outputFormat: 'JSON with database configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['schema', 'migrations', 'artifacts'],
      properties: {
        schema: { type: 'object' },
        migrations: { type: 'array' },
        models: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'nextjs', 'database', 'prisma']
}));

export const serverActionsTask = defineTask('server-actions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Server Actions - ${args.projectName}`,
  agent: {
    name: 'server-actions-specialist',
    prompt: {
      role: 'Next.js Server Actions Specialist',
      task: 'Implement Server Actions',
      context: args,
      instructions: [
        '1. Create server action files',
        '2. Implement CRUD operations',
        '3. Set up form handling',
        '4. Implement validation with Zod',
        '5. Create optimistic updates',
        '6. Set up error handling',
        '7. Implement revalidation',
        '8. Create action utilities',
        '9. Set up action middleware',
        '10. Document action patterns'
      ],
      outputFormat: 'JSON with server actions'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'validation', 'artifacts'],
      properties: {
        actions: { type: 'array', items: { type: 'object' } },
        validation: { type: 'object' },
        utilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'nextjs', 'server-actions']
}));

export const apiRoutesTask = defineTask('api-routes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: API Routes - ${args.projectName}`,
  agent: {
    name: 'api-developer',
    prompt: {
      role: 'Next.js API Developer',
      task: 'Create API Routes',
      context: args,
      instructions: [
        '1. Create route handlers',
        '2. Implement RESTful endpoints',
        '3. Set up request validation',
        '4. Create middleware functions',
        '5. Implement rate limiting',
        '6. Set up CORS configuration',
        '7. Create error responses',
        '8. Implement pagination',
        '9. Set up API documentation',
        '10. Document API patterns'
      ],
      outputFormat: 'JSON with API routes'
    },
    outputSchema: {
      type: 'object',
      required: ['endpoints', 'middleware', 'artifacts'],
      properties: {
        endpoints: { type: 'array', items: { type: 'object' } },
        middleware: { type: 'array' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'nextjs', 'api']
}));

export const authSetupTask = defineTask('auth-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 7: Authentication Setup - ${args.projectName}`,
  skill: {
    name: 'nextauth-skill',
    prompt: {
      role: 'Next.js Authentication Specialist',
      task: 'Set up authentication',
      context: args,
      instructions: [
        '1. Install NextAuth.js',
        '2. Configure auth providers',
        '3. Set up database adapter',
        '4. Create auth API route',
        '5. Implement session handling',
        '6. Create protected routes',
        '7. Set up middleware auth',
        '8. Create auth hooks',
        '9. Implement RBAC',
        '10. Document auth patterns'
      ],
      outputFormat: 'JSON with auth configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['providers', 'session', 'artifacts'],
      properties: {
        providers: { type: 'array', items: { type: 'string' } },
        session: { type: 'object' },
        middleware: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'nextjs', 'authentication', 'nextauth']
}));

export const clientComponentsTask = defineTask('client-components', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Client Components - ${args.projectName}`,
  agent: {
    name: 'client-component-developer',
    prompt: {
      role: 'React Client Component Developer',
      task: 'Build Client Components',
      context: args,
      instructions: [
        '1. Create interactive UI components',
        '2. Implement form components',
        '3. Build stateful components',
        '4. Create hook-based components',
        '5. Implement client-side fetching',
        '6. Build modal and dialog components',
        '7. Create animation components',
        '8. Implement error boundaries',
        '9. Build accessibility features',
        '10. Document client patterns'
      ],
      outputFormat: 'JSON with client components'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'hooks', 'artifacts'],
      properties: {
        components: { type: 'array', items: { type: 'object' } },
        hooks: { type: 'array' },
        utilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'nextjs', 'client-components']
}));

export const deploymentConfigTask = defineTask('deployment-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Deployment Configuration - ${args.projectName}`,
  agent: {
    name: 'deployment-agent',
    prompt: {
      role: 'Next.js DevOps Engineer',
      task: 'Configure deployment',
      context: args,
      instructions: [
        '1. Configure Vercel deployment',
        '2. Set up environment variables',
        '3. Configure build settings',
        '4. Set up database connection',
        '5. Configure caching',
        '6. Set up preview deployments',
        '7. Configure custom domain',
        '8. Set up monitoring',
        '9. Configure edge functions',
        '10. Document deployment'
      ],
      outputFormat: 'JSON with deployment configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'environments', 'artifacts'],
      properties: {
        config: { type: 'object' },
        environments: { type: 'array' },
        buildSettings: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'nextjs', 'deployment', 'vercel']
}));

export const documentationTask = defineTask('nextjs-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate Next.js documentation',
      context: args,
      instructions: [
        '1. Create README with setup',
        '2. Document routing structure',
        '3. Create component documentation',
        '4. Document server actions',
        '5. Create API documentation',
        '6. Document authentication',
        '7. Create database guide',
        '8. Document deployment',
        '9. Create troubleshooting guide',
        '10. Generate architecture docs'
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
  labels: ['web', 'nextjs', 'documentation']
}));
