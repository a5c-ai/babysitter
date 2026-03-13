/**
 * @process specializations/web-development/angular-enterprise-development
 * @description Angular Enterprise Application Development - Comprehensive process for building enterprise-grade Angular applications
 * with TypeScript, RxJS, NgRx state management, reactive forms, lazy loading, and comprehensive testing.
 * @inputs { projectName: string, stateManagement?: string, features?: object, testing?: object, styling?: string }
 * @outputs { success: boolean, modules: array, services: array, testSuites: array, architecture: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/web-development/angular-enterprise-development', {
 *   projectName: 'EnterpriseApp',
 *   stateManagement: 'ngrx',
 *   features: { authentication: true, i18n: true },
 *   testing: { unit: true, e2e: true },
 *   styling: 'angular-material'
 * });
 *
 * @references
 * - Angular Documentation: https://angular.io/docs
 * - NgRx: https://ngrx.io/
 * - RxJS: https://rxjs.dev/
 * - Angular Material: https://material.angular.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    stateManagement = 'ngrx',
    features = { authentication: true, i18n: false },
    testing = { unit: true, e2e: true },
    styling = 'angular-material',
    outputDir = 'angular-enterprise-development'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Angular Enterprise Development: ${projectName}`);
  ctx.log('info', `State Management: ${stateManagement}`);

  // ============================================================================
  // PHASE 1: ENTERPRISE ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing enterprise Angular architecture');

  const architecture = await ctx.task(architectureTask, {
    projectName,
    stateManagement,
    features,
    styling,
    outputDir
  });

  artifacts.push(...architecture.artifacts);

  // ============================================================================
  // PHASE 2: PROJECT SCAFFOLDING
  // ============================================================================

  ctx.log('info', 'Phase 2: Scaffolding Angular project with CLI');

  const scaffolding = await ctx.task(scaffoldingTask, {
    projectName,
    architecture,
    styling,
    outputDir
  });

  artifacts.push(...scaffolding.artifacts);

  // ============================================================================
  // PHASE 3: MODULE ARCHITECTURE
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating modular architecture with lazy loading');

  const moduleSetup = await ctx.task(moduleArchitectureTask, {
    projectName,
    architecture,
    features,
    outputDir
  });

  artifacts.push(...moduleSetup.artifacts);

  // ============================================================================
  // PHASE 4: NGRX STATE MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Configuring NgRx state management');

  const stateSetup = await ctx.task(ngrxSetupTask, {
    projectName,
    architecture,
    features,
    outputDir
  });

  artifacts.push(...stateSetup.artifacts);

  // ============================================================================
  // PHASE 5: SERVICE LAYER
  // ============================================================================

  ctx.log('info', 'Phase 5: Building service layer with dependency injection');

  const serviceLayer = await ctx.task(serviceLayerTask, {
    projectName,
    features,
    outputDir
  });

  artifacts.push(...serviceLayer.artifacts);

  // ============================================================================
  // PHASE 6: COMPONENT ARCHITECTURE
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing Angular components');

  const components = await ctx.task(componentArchitectureTask, {
    projectName,
    styling,
    architecture,
    outputDir
  });

  artifacts.push(...components.artifacts);

  // ============================================================================
  // PHASE 7: REACTIVE FORMS
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing reactive forms');

  const formSetup = await ctx.task(reactiveFormsTask, {
    projectName,
    outputDir
  });

  artifacts.push(...formSetup.artifacts);

  // ============================================================================
  // PHASE 8: TESTING INFRASTRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 8: Setting up comprehensive testing');

  const testingSetup = await ctx.task(testingSetupTask, {
    projectName,
    testing,
    components,
    outputDir
  });

  artifacts.push(...testingSetup.artifacts);

  // Quality Gate
  await ctx.breakpoint({
    question: `Angular enterprise application setup complete for ${projectName}. ${moduleSetup.modules.length} modules, ${serviceLayer.services.length} services created. Approve configuration?`,
    title: 'Angular Enterprise Review',
    context: {
      runId: ctx.runId,
      modules: moduleSetup.modules,
      services: serviceLayer.services,
      stores: stateSetup.stores,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 9: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating documentation');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    architecture,
    moduleSetup,
    serviceLayer,
    stateSetup,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    modules: moduleSetup.modules,
    services: serviceLayer.services,
    components: components.componentList,
    stores: stateSetup.stores,
    testSuites: testingSetup.testSuites,
    architecture: architecture.design,
    documentation: documentation.docs,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/web-development/angular-enterprise-development',
      timestamp: startTime,
      stateManagement
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const architectureTask = defineTask('angular-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Angular Architecture - ${args.projectName}`,
  agent: {
    name: 'frontend-architect-agent',
    prompt: {
      role: 'Senior Angular Enterprise Architect',
      task: 'Design enterprise Angular architecture',
      context: args,
      instructions: [
        '1. Design domain-driven module structure',
        '2. Plan NgRx store architecture',
        '3. Design service layer patterns',
        '4. Plan component hierarchy',
        '5. Define dependency injection strategy',
        '6. Plan lazy loading boundaries',
        '7. Design shared module strategy',
        '8. Plan environment configuration',
        '9. Define code organization standards',
        '10. Document architectural decisions'
      ],
      outputFormat: 'JSON with architecture design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        moduleStructure: { type: 'array' },
        storeDesign: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'angular', 'enterprise', 'architecture']
}));

export const scaffoldingTask = defineTask('angular-scaffolding', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Angular Scaffolding - ${args.projectName}`,
  agent: {
    name: 'angular-developer-agent',
    prompt: {
      role: 'Angular Developer',
      task: 'Scaffold Angular project',
      context: args,
      instructions: [
        '1. Initialize Angular project with CLI',
        '2. Configure strict TypeScript settings',
        '3. Set up Angular ESLint',
        '4. Configure Prettier',
        '5. Set up path aliases',
        '6. Configure environments',
        '7. Set up proxy configuration',
        '8. Configure build optimization',
        '9. Set up Git hooks',
        '10. Create initial structure'
      ],
      outputFormat: 'JSON with scaffolding details'
    },
    outputSchema: {
      type: 'object',
      required: ['projectPath', 'artifacts'],
      properties: {
        projectPath: { type: 'string' },
        angularConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'angular', 'scaffolding']
}));

export const moduleArchitectureTask = defineTask('angular-modules', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Module Architecture - ${args.projectName}`,
  agent: {
    name: 'angular-module-architect',
    prompt: {
      role: 'Angular Module Architect',
      task: 'Create modular architecture',
      context: args,
      instructions: [
        '1. Create CoreModule for singleton services',
        '2. Create SharedModule for shared components',
        '3. Set up feature modules with lazy loading',
        '4. Configure module providers',
        '5. Implement module guards',
        '6. Create routing modules',
        '7. Set up preloading strategy',
        '8. Configure module imports/exports',
        '9. Implement barrel exports',
        '10. Document module dependencies'
      ],
      outputFormat: 'JSON with module structure'
    },
    outputSchema: {
      type: 'object',
      required: ['modules', 'artifacts'],
      properties: {
        modules: { type: 'array', items: { type: 'string' } },
        routingConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'angular', 'modules', 'lazy-loading']
}));

export const ngrxSetupTask = defineTask('ngrx-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 4: NgRx Setup - ${args.projectName}`,
  skill: {
    name: 'ngrx-skill',
    prompt: {
      role: 'NgRx State Management Specialist',
      task: 'Configure NgRx state management',
      context: args,
      instructions: [
        '1. Install NgRx packages',
        '2. Configure root store',
        '3. Create feature stores',
        '4. Implement actions with createAction',
        '5. Create reducers with createReducer',
        '6. Implement selectors',
        '7. Create effects for side effects',
        '8. Set up entity adapter',
        '9. Configure Redux DevTools',
        '10. Document state patterns'
      ],
      outputFormat: 'JSON with NgRx configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['stores', 'effects', 'artifacts'],
      properties: {
        stores: { type: 'array', items: { type: 'string' } },
        effects: { type: 'array' },
        selectors: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'angular', 'ngrx', 'state-management']
}));

export const serviceLayerTask = defineTask('service-layer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Service Layer - ${args.projectName}`,
  agent: {
    name: 'angular-service-developer',
    prompt: {
      role: 'Angular Service Developer',
      task: 'Build service layer',
      context: args,
      instructions: [
        '1. Create HTTP service base class',
        '2. Implement API services',
        '3. Create auth service',
        '4. Implement interceptors',
        '5. Create storage service',
        '6. Implement logging service',
        '7. Create error handler service',
        '8. Implement caching service',
        '9. Create facade services',
        '10. Document service patterns'
      ],
      outputFormat: 'JSON with service layer details'
    },
    outputSchema: {
      type: 'object',
      required: ['services', 'interceptors', 'artifacts'],
      properties: {
        services: { type: 'array', items: { type: 'string' } },
        interceptors: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'angular', 'services', 'di']
}));

export const componentArchitectureTask = defineTask('angular-components', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Component Architecture - ${args.projectName}`,
  agent: {
    name: 'angular-component-developer',
    prompt: {
      role: 'Angular Component Developer',
      task: 'Develop Angular components',
      context: args,
      instructions: [
        '1. Create smart/container components',
        '2. Create dumb/presentational components',
        '3. Implement OnPush change detection',
        '4. Build reusable UI components',
        '5. Create directives',
        '6. Implement pipes',
        '7. Build layout components',
        '8. Create form components',
        '9. Implement accessibility',
        '10. Document component API'
      ],
      outputFormat: 'JSON with component library'
    },
    outputSchema: {
      type: 'object',
      required: ['componentList', 'artifacts'],
      properties: {
        componentList: { type: 'array', items: { type: 'object' } },
        directives: { type: 'array' },
        pipes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'angular', 'components']
}));

export const reactiveFormsTask = defineTask('reactive-forms', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Reactive Forms - ${args.projectName}`,
  agent: {
    name: 'angular-forms-specialist',
    prompt: {
      role: 'Angular Forms Specialist',
      task: 'Implement reactive forms',
      context: args,
      instructions: [
        '1. Create form builder utilities',
        '2. Implement custom validators',
        '3. Create async validators',
        '4. Build form array handling',
        '5. Implement form state management',
        '6. Create error message handling',
        '7. Build dynamic forms',
        '8. Implement form serialization',
        '9. Create form testing utilities',
        '10. Document form patterns'
      ],
      outputFormat: 'JSON with forms configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['forms', 'validators', 'artifacts'],
      properties: {
        forms: { type: 'array' },
        validators: { type: 'array' },
        utilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'angular', 'forms', 'reactive-forms']
}));

export const testingSetupTask = defineTask('angular-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Angular Testing - ${args.projectName}`,
  agent: {
    name: 'angular-testing-specialist',
    prompt: {
      role: 'Angular Testing Specialist',
      task: 'Set up comprehensive testing',
      context: args,
      instructions: [
        '1. Configure Jasmine and Karma',
        '2. Set up Jest as alternative',
        '3. Create component test patterns',
        '4. Implement service testing',
        '5. Set up NgRx testing',
        '6. Configure Protractor/Cypress E2E',
        '7. Create testing utilities',
        '8. Set up code coverage',
        '9. Configure CI test running',
        '10. Document testing patterns'
      ],
      outputFormat: 'JSON with testing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['testSuites', 'coverage', 'artifacts'],
      properties: {
        testSuites: { type: 'array', items: { type: 'string' } },
        coverage: { type: 'object' },
        utilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'angular', 'testing']
}));

export const documentationTask = defineTask('angular-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate Angular documentation',
      context: args,
      instructions: [
        '1. Create README with setup guide',
        '2. Document module structure',
        '3. Create service documentation',
        '4. Document NgRx patterns',
        '5. Create component documentation',
        '6. Document testing conventions',
        '7. Create style guide',
        '8. Document build and deploy',
        '9. Create troubleshooting guide',
        '10. Generate API documentation'
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
  labels: ['web', 'angular', 'documentation']
}));
