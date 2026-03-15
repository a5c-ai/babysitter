/**
 * @process specializations/web-development/svelte-sveltekit-development
 * @description Svelte/SvelteKit Application Development - Process for building high-performance applications with Svelte
 * and SvelteKit, utilizing built-in reactivity, stores, SSR/SSG capabilities, and minimal bundle sizes.
 * @inputs { projectName: string, rendering?: string, features?: object, styling?: string, adapter?: string }
 * @outputs { success: boolean, routes: array, stores: array, components: array, configuration: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/web-development/svelte-sveltekit-development', {
 *   projectName: 'MySvelteApp',
 *   rendering: 'ssr',
 *   features: { auth: true, forms: true },
 *   styling: 'tailwind',
 *   adapter: 'auto'
 * });
 *
 * @references
 * - Svelte Documentation: https://svelte.dev/
 * - SvelteKit Documentation: https://kit.svelte.dev/
 * - Vite: https://vitejs.dev/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    rendering = 'ssr',
    features = { auth: false, forms: true },
    styling = 'tailwind',
    adapter = 'auto',
    typescript = true,
    outputDir = 'svelte-sveltekit-development'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Svelte/SvelteKit Development: ${projectName}`);
  ctx.log('info', `Rendering: ${rendering}, Adapter: ${adapter}`);

  // ============================================================================
  // PHASE 1: PROJECT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up SvelteKit project');

  const projectSetup = await ctx.task(projectSetupTask, {
    projectName,
    rendering,
    typescript,
    styling,
    adapter,
    outputDir
  });

  artifacts.push(...projectSetup.artifacts);

  // ============================================================================
  // PHASE 2: ROUTING AND LAYOUTS
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring file-based routing and layouts');

  const routingSetup = await ctx.task(routingSetupTask, {
    projectName,
    rendering,
    features,
    outputDir
  });

  artifacts.push(...routingSetup.artifacts);

  // ============================================================================
  // PHASE 3: SVELTE STORES
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating Svelte stores for state management');

  const storesSetup = await ctx.task(storesSetupTask, {
    projectName,
    features,
    outputDir
  });

  artifacts.push(...storesSetup.artifacts);

  // ============================================================================
  // PHASE 4: COMPONENT LIBRARY
  // ============================================================================

  ctx.log('info', 'Phase 4: Building Svelte component library');

  const componentLibrary = await ctx.task(componentLibraryTask, {
    projectName,
    styling,
    outputDir
  });

  artifacts.push(...componentLibrary.artifacts);

  // ============================================================================
  // PHASE 5: SERVER ROUTES AND API
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up server routes and API endpoints');

  const serverRoutes = await ctx.task(serverRoutesTask, {
    projectName,
    features,
    outputDir
  });

  artifacts.push(...serverRoutes.artifacts);

  // ============================================================================
  // PHASE 6: FORM ACTIONS
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing form actions');

  const formActions = await ctx.task(formActionsTask, {
    projectName,
    features,
    outputDir
  });

  artifacts.push(...formActions.artifacts);

  // ============================================================================
  // PHASE 7: TESTING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up testing infrastructure');

  const testingSetup = await ctx.task(testingSetupTask, {
    projectName,
    componentLibrary,
    outputDir
  });

  artifacts.push(...testingSetup.artifacts);

  // Quality Gate
  await ctx.breakpoint({
    question: `SvelteKit application setup complete for ${projectName}. ${routingSetup.routes.length} routes, ${storesSetup.stores.length} stores created. Approve configuration?`,
    title: 'SvelteKit Application Review',
    context: {
      runId: ctx.runId,
      routes: routingSetup.routes,
      stores: storesSetup.stores,
      components: componentLibrary.components,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'svelte' }))
    }
  });

  // ============================================================================
  // PHASE 8: DEPLOYMENT CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Configuring deployment');

  const deploymentConfig = await ctx.task(deploymentConfigTask, {
    projectName,
    adapter,
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
    routingSetup,
    storesSetup,
    componentLibrary,
    serverRoutes,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    routes: routingSetup.routes,
    stores: storesSetup.stores,
    components: componentLibrary.components,
    serverRoutes: serverRoutes.endpoints,
    configuration: {
      rendering,
      adapter,
      typescript,
      styling
    },
    documentation: documentation.docs,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/web-development/svelte-sveltekit-development',
      timestamp: startTime,
      adapter
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const projectSetupTask = defineTask('sveltekit-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 1: SvelteKit Setup - ${args.projectName}`,
  skill: {
    name: 'svelte-skill',
    prompt: {
      role: 'Senior Svelte/SvelteKit Developer',
      task: 'Set up SvelteKit project',
      context: args,
      instructions: [
        '1. Initialize SvelteKit project with create-svelte',
        '2. Configure TypeScript with strict settings',
        '3. Set up Vite configuration',
        '4. Configure adapter for deployment target',
        '5. Set up ESLint and Prettier',
        '6. Configure path aliases',
        '7. Set up environment variables',
        '8. Configure SSR/SSG settings',
        '9. Set up styling solution',
        '10. Create initial folder structure'
      ],
      outputFormat: 'JSON with project setup details'
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
  labels: ['web', 'svelte', 'sveltekit', 'setup']
}));

export const routingSetupTask = defineTask('sveltekit-routing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: SvelteKit Routing - ${args.projectName}`,
  agent: {
    name: 'sveltekit-routing-specialist',
    prompt: {
      role: 'SvelteKit Routing Specialist',
      task: 'Configure file-based routing',
      context: args,
      instructions: [
        '1. Create route structure in src/routes',
        '2. Set up +page.svelte files',
        '3. Create +layout.svelte for shared layouts',
        '4. Implement +page.server.ts for data loading',
        '5. Set up dynamic routes with [param]',
        '6. Configure route groups with (group)',
        '7. Implement error handling with +error.svelte',
        '8. Set up preloading strategies',
        '9. Configure route navigation',
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
        loaders: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'svelte', 'sveltekit', 'routing']
}));

export const storesSetupTask = defineTask('svelte-stores', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Svelte Stores - ${args.projectName}`,
  agent: {
    name: 'svelte-stores-specialist',
    prompt: {
      role: 'Svelte Stores Specialist',
      task: 'Create Svelte stores for state management',
      context: args,
      instructions: [
        '1. Create writable stores for mutable state',
        '2. Implement readable stores for derived state',
        '3. Create derived stores',
        '4. Implement custom stores',
        '5. Set up store persistence',
        '6. Create async stores',
        '7. Implement store subscriptions',
        '8. Set up context-based stores',
        '9. Create store utilities',
        '10. Document store patterns'
      ],
      outputFormat: 'JSON with stores configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['stores', 'artifacts'],
      properties: {
        stores: { type: 'array', items: { type: 'string' } },
        utilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'svelte', 'stores', 'state-management']
}));

export const componentLibraryTask = defineTask('svelte-components', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Svelte Components - ${args.projectName}`,
  agent: {
    name: 'svelte-component-developer',
    prompt: {
      role: 'Svelte Component Developer',
      task: 'Build Svelte component library',
      context: args,
      instructions: [
        '1. Create base UI components',
        '2. Implement slot-based components',
        '3. Build form components with binding',
        '4. Create transition components',
        '5. Implement action-based components',
        '6. Build layout components',
        '7. Create accessible components',
        '8. Implement component composition',
        '9. Add component animations',
        '10. Document component API'
      ],
      outputFormat: 'JSON with component library'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'artifacts'],
      properties: {
        components: { type: 'array', items: { type: 'object' } },
        actions: { type: 'array' },
        transitions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'svelte', 'components']
}));

export const serverRoutesTask = defineTask('sveltekit-server-routes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Server Routes - ${args.projectName}`,
  agent: {
    name: 'sveltekit-backend-developer',
    prompt: {
      role: 'SvelteKit Backend Developer',
      task: 'Create server routes and API endpoints',
      context: args,
      instructions: [
        '1. Create +server.ts API endpoints',
        '2. Implement request handlers (GET, POST, etc.)',
        '3. Set up API route organization',
        '4. Implement authentication middleware',
        '5. Create error handling for APIs',
        '6. Set up rate limiting',
        '7. Implement API validation',
        '8. Create typed API responses',
        '9. Set up API documentation',
        '10. Document API patterns'
      ],
      outputFormat: 'JSON with server routes'
    },
    outputSchema: {
      type: 'object',
      required: ['endpoints', 'middleware', 'artifacts'],
      properties: {
        endpoints: { type: 'array', items: { type: 'object' } },
        middleware: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'svelte', 'sveltekit', 'api']
}));

export const formActionsTask = defineTask('sveltekit-form-actions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Form Actions - ${args.projectName}`,
  agent: {
    name: 'sveltekit-forms-specialist',
    prompt: {
      role: 'SvelteKit Forms Specialist',
      task: 'Implement form actions',
      context: args,
      instructions: [
        '1. Create form action handlers',
        '2. Implement progressive enhancement',
        '3. Set up form validation',
        '4. Create error handling for forms',
        '5. Implement success/failure responses',
        '6. Set up form state management',
        '7. Create named actions',
        '8. Implement file upload handling',
        '9. Set up CSRF protection',
        '10. Document form patterns'
      ],
      outputFormat: 'JSON with form actions'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'validation', 'artifacts'],
      properties: {
        actions: { type: 'array' },
        validation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'svelte', 'sveltekit', 'forms']
}));

export const testingSetupTask = defineTask('svelte-testing', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 7: Svelte Testing - ${args.projectName}`,
  skill: {
    name: 'vitest-skill',
    prompt: {
      role: 'Svelte Testing Specialist',
      task: 'Set up testing infrastructure',
      context: args,
      instructions: [
        '1. Configure Vitest for unit testing',
        '2. Set up Svelte Testing Library',
        '3. Create component test patterns',
        '4. Implement store testing',
        '5. Set up server route testing',
        '6. Configure Playwright for E2E',
        '7. Create test utilities',
        '8. Set up code coverage',
        '9. Configure CI testing',
        '10. Document testing patterns'
      ],
      outputFormat: 'JSON with testing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['testConfig', 'testUtils', 'artifacts'],
      properties: {
        testConfig: { type: 'object' },
        testUtils: { type: 'array' },
        coverage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'svelte', 'testing', 'vitest']
}));

export const deploymentConfigTask = defineTask('sveltekit-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Deployment Configuration - ${args.projectName}`,
  agent: {
    name: 'sveltekit-devops',
    prompt: {
      role: 'SvelteKit DevOps Engineer',
      task: 'Configure deployment',
      context: args,
      instructions: [
        '1. Configure SvelteKit adapter',
        '2. Set up build optimization',
        '3. Configure prerendering',
        '4. Set up environment handling',
        '5. Configure static asset handling',
        '6. Set up CDN configuration',
        '7. Implement deployment pipeline',
        '8. Configure preview deployments',
        '9. Set up monitoring',
        '10. Document deployment process'
      ],
      outputFormat: 'JSON with deployment configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['adapterConfig', 'buildConfig', 'artifacts'],
      properties: {
        adapterConfig: { type: 'object' },
        buildConfig: { type: 'object' },
        prerenderConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'svelte', 'sveltekit', 'deployment']
}));

export const documentationTask = defineTask('svelte-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate Svelte documentation',
      context: args,
      instructions: [
        '1. Create README with setup guide',
        '2. Document routing structure',
        '3. Create store documentation',
        '4. Document component library',
        '5. Create API documentation',
        '6. Document form patterns',
        '7. Create testing guide',
        '8. Document deployment',
        '9. Create troubleshooting guide',
        '10. Generate style guide'
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
  labels: ['web', 'svelte', 'documentation']
}));
