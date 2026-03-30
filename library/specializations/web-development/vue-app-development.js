/**
 * @process specializations/web-development/vue-app-development
 * @description Vue.js Application Development with Composition API - Process for building modern Vue.js applications using
 * Composition API, Pinia state management, Vue Router, TypeScript integration, and testing with Vitest.
 * @inputs { projectName: string, stateManagement?: string, routing?: boolean, testing?: object, styling?: string }
 * @outputs { success: boolean, projectStructure: object, composables: array, components: array, testCoverage: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/web-development/vue-app-development', {
 *   projectName: 'MyVueApp',
 *   stateManagement: 'pinia',
 *   routing: true,
 *   testing: { unit: true, e2e: true },
 *   styling: 'tailwind'
 * });
 *
 * @references
 * - Vue 3 Documentation: https://vuejs.org/
 * - Pinia: https://pinia.vuejs.org/
 * - Vue Router: https://router.vuejs.org/
 * - Vitest: https://vitest.dev/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    stateManagement = 'pinia',
    routing = true,
    testing = { unit: true, e2e: false },
    styling = 'tailwind',
    typescript = true,
    outputDir = 'vue-app-development'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Vue.js Application Development: ${projectName}`);
  ctx.log('info', `State Management: ${stateManagement}`);

  // ============================================================================
  // PHASE 1: PROJECT ARCHITECTURE
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing Vue application architecture');

  const architecture = await ctx.task(architectureTask, {
    projectName,
    stateManagement,
    routing,
    styling,
    typescript,
    outputDir
  });

  artifacts.push(...architecture.artifacts);

  // ============================================================================
  // PHASE 2: PROJECT SCAFFOLDING
  // ============================================================================

  ctx.log('info', 'Phase 2: Scaffolding Vue project with Vite');

  const scaffolding = await ctx.task(scaffoldingTask, {
    projectName,
    architecture,
    typescript,
    styling,
    outputDir
  });

  artifacts.push(...scaffolding.artifacts);

  // ============================================================================
  // PHASE 3: PINIA STATE MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring Pinia state management');

  const stateSetup = await ctx.task(piniaSetupTask, {
    projectName,
    architecture,
    outputDir
  });

  artifacts.push(...stateSetup.artifacts);

  // ============================================================================
  // PHASE 4: VUE ROUTER SETUP
  // ============================================================================

  if (routing) {
    ctx.log('info', 'Phase 4: Setting up Vue Router');

    const routerSetup = await ctx.task(routerSetupTask, {
      projectName,
      architecture,
      outputDir
    });

    artifacts.push(...routerSetup.artifacts);
  }

  // ============================================================================
  // PHASE 5: COMPOSABLES LIBRARY
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating composables library');

  const composables = await ctx.task(composablesTask, {
    projectName,
    stateManagement,
    outputDir
  });

  artifacts.push(...composables.artifacts);

  // ============================================================================
  // PHASE 6: COMPONENT DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing Vue components');

  const components = await ctx.task(componentDevelopmentTask, {
    projectName,
    styling,
    architecture,
    outputDir
  });

  artifacts.push(...components.artifacts);

  // ============================================================================
  // PHASE 7: TESTING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up testing with Vitest');

  const testingSetup = await ctx.task(testingSetupTask, {
    projectName,
    testing,
    components,
    outputDir
  });

  artifacts.push(...testingSetup.artifacts);

  // Quality Gate
  await ctx.breakpoint({
    question: `Vue.js application setup complete for ${projectName}. ${components.componentList.length} components and ${composables.composableList.length} composables created. Approve final configuration?`,
    title: 'Vue Application Review',
    context: {
      runId: ctx.runId,
      components: components.componentList,
      composables: composables.composableList,
      stores: stateSetup.stores,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'vue' }))
    }
  });

  // ============================================================================
  // PHASE 8: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating documentation');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    architecture,
    components,
    composables,
    stateSetup,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    projectStructure: architecture.structure,
    composables: composables.composableList,
    components: components.componentList,
    stores: stateSetup.stores,
    testCoverage: testingSetup.coverageConfig,
    documentation: documentation.docs,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/web-development/vue-app-development',
      timestamp: startTime,
      stateManagement
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const architectureTask = defineTask('vue-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Vue Architecture - ${args.projectName}`,
  agent: {
    name: 'frontend-architect-agent',
    prompt: {
      role: 'Senior Vue.js Architect',
      task: 'Design Vue application architecture',
      context: args,
      instructions: [
        '1. Design feature-based folder structure',
        '2. Plan component composition with Composition API',
        '3. Design Pinia store architecture',
        '4. Plan Vue Router configuration',
        '5. Define TypeScript integration strategy',
        '6. Design composables structure',
        '7. Plan auto-imports configuration',
        '8. Define styling architecture',
        '9. Plan build optimization strategy',
        '10. Document architectural decisions'
      ],
      outputFormat: 'JSON with architecture design'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'artifacts'],
      properties: {
        structure: { type: 'object' },
        componentPlan: { type: 'array' },
        storePlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'vue', 'architecture']
}));

export const scaffoldingTask = defineTask('vue-scaffolding', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Vue Scaffolding - ${args.projectName}`,
  agent: {
    name: 'vue-developer-agent',
    prompt: {
      role: 'Vue.js Developer',
      task: 'Scaffold Vue project with Vite',
      context: args,
      instructions: [
        '1. Initialize Vue 3 project with Vite',
        '2. Configure TypeScript with strict settings',
        '3. Set up auto-imports with unplugin-auto-import',
        '4. Configure Vue components auto-import',
        '5. Set up ESLint and Prettier',
        '6. Configure path aliases',
        '7. Set up environment variables',
        '8. Configure Vite plugins',
        '9. Set up build optimization',
        '10. Create initial folder structure'
      ],
      outputFormat: 'JSON with project setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['projectPath', 'dependencies', 'artifacts'],
      properties: {
        projectPath: { type: 'string' },
        dependencies: { type: 'object' },
        configFiles: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'vue', 'scaffolding', 'vite']
}));

export const piniaSetupTask = defineTask('pinia-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 3: Pinia Setup - ${args.projectName}`,
  skill: {
    name: 'pinia-skill',
    prompt: {
      role: 'Vue State Management Specialist',
      task: 'Configure Pinia state management',
      context: args,
      instructions: [
        '1. Install and configure Pinia',
        '2. Create store structure with setup syntax',
        '3. Implement typed store actions',
        '4. Configure store persistence',
        '5. Set up Vue DevTools integration',
        '6. Create store composables',
        '7. Implement store testing utilities',
        '8. Create subscription patterns',
        '9. Set up store hydration',
        '10. Document store patterns'
      ],
      outputFormat: 'JSON with Pinia configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['stores', 'artifacts'],
      properties: {
        stores: { type: 'array', items: { type: 'string' } },
        plugins: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'vue', 'pinia', 'state-management']
}));

export const routerSetupTask = defineTask('vue-router-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Vue Router Setup - ${args.projectName}`,
  agent: {
    name: 'vue-router-specialist',
    prompt: {
      role: 'Vue Router Specialist',
      task: 'Configure Vue Router',
      context: args,
      instructions: [
        '1. Install and configure Vue Router 4',
        '2. Create route configuration with lazy loading',
        '3. Set up navigation guards',
        '4. Implement route meta for auth',
        '5. Configure nested routes',
        '6. Set up dynamic routes',
        '7. Implement scroll behavior',
        '8. Create typed route definitions',
        '9. Set up route transitions',
        '10. Document routing patterns'
      ],
      outputFormat: 'JSON with router configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['routes', 'guards', 'artifacts'],
      properties: {
        routes: { type: 'array' },
        guards: { type: 'array' },
        layouts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'vue', 'routing', 'vue-router']
}));

export const composablesTask = defineTask('vue-composables', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Composables - ${args.projectName}`,
  agent: {
    name: 'vue-composables-developer',
    prompt: {
      role: 'Vue Composables Developer',
      task: 'Create reusable composables',
      context: args,
      instructions: [
        '1. Create useLocalStorage composable',
        '2. Implement useFetch with abort support',
        '3. Create useDebounce and useThrottle',
        '4. Implement useMediaQuery',
        '5. Create useIntersectionObserver',
        '6. Implement useEventListener',
        '7. Create useAsyncState',
        '8. Implement useVModel for v-model',
        '9. Create typed composables',
        '10. Document composable patterns'
      ],
      outputFormat: 'JSON with composables details'
    },
    outputSchema: {
      type: 'object',
      required: ['composableList', 'artifacts'],
      properties: {
        composableList: { type: 'array', items: { type: 'object' } },
        utilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'vue', 'composables']
}));

export const componentDevelopmentTask = defineTask('vue-components', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Vue Components - ${args.projectName}`,
  agent: {
    name: 'component-developer-agent',
    prompt: {
      role: 'Vue Component Developer',
      task: 'Develop Vue components',
      context: args,
      instructions: [
        '1. Create base UI components with script setup',
        '2. Implement form components with v-model',
        '3. Build layout components',
        '4. Create slot-based components',
        '5. Implement provide/inject patterns',
        '6. Build accessible components',
        '7. Create compound components',
        '8. Implement render function components',
        '9. Add component transitions',
        '10. Document component API'
      ],
      outputFormat: 'JSON with component library'
    },
    outputSchema: {
      type: 'object',
      required: ['componentList', 'artifacts'],
      properties: {
        componentList: { type: 'array', items: { type: 'object' } },
        categories: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'vue', 'components']
}));

export const testingSetupTask = defineTask('vue-testing', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 7: Vue Testing - ${args.projectName}`,
  skill: {
    name: 'vitest-skill',
    prompt: {
      role: 'Vue Testing Specialist',
      task: 'Set up Vue testing infrastructure',
      context: args,
      instructions: [
        '1. Configure Vitest for unit testing',
        '2. Set up Vue Test Utils',
        '3. Create component testing patterns',
        '4. Implement composable testing',
        '5. Set up Pinia store testing',
        '6. Configure coverage reporting',
        '7. Create test utilities',
        '8. Set up snapshot testing',
        '9. Configure E2E with Playwright/Cypress',
        '10. Document testing conventions'
      ],
      outputFormat: 'JSON with testing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['coverageConfig', 'testUtils', 'artifacts'],
      properties: {
        coverageConfig: { type: 'object' },
        testUtils: { type: 'array' },
        testPatterns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'vue', 'testing', 'vitest']
}));

export const documentationTask = defineTask('vue-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate Vue project documentation',
      context: args,
      instructions: [
        '1. Create README with setup guide',
        '2. Document component library',
        '3. Create composables documentation',
        '4. Document Pinia stores',
        '5. Create routing documentation',
        '6. Document testing patterns',
        '7. Create style guide',
        '8. Document conventions',
        '9. Create troubleshooting guide',
        '10. Generate API documentation'
      ],
      outputFormat: 'JSON with documentation paths'
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
  labels: ['web', 'vue', 'documentation']
}));
