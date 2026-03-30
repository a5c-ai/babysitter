/**
 * @process specializations/web-development/react-app-development
 * @description React Application Development with Best Practices - Complete process for building production-ready React applications
 * with TypeScript, component architecture, state management (Redux/Zustand), routing, testing (Jest/React Testing Library), and performance optimization.
 * @inputs { projectName: string, stateManagement?: string, routing?: boolean, testing?: object, styling?: string, features?: object }
 * @outputs { success: boolean, projectStructure: object, components: array, testSuites: array, documentation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/web-development/react-app-development', {
 *   projectName: 'MyReactApp',
 *   stateManagement: 'redux-toolkit',
 *   routing: true,
 *   testing: { unit: true, integration: true, e2e: false },
 *   styling: 'tailwind',
 *   features: { authentication: true, darkMode: true }
 * });
 *
 * @references
 * - React Documentation: https://react.dev/
 * - React Testing Library: https://testing-library.com/react
 * - Redux Toolkit: https://redux-toolkit.js.org/
 * - TypeScript: https://www.typescriptlang.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    stateManagement = 'redux-toolkit',
    routing = true,
    testing = { unit: true, integration: true, e2e: false },
    styling = 'tailwind',
    features = {},
    typescript = true,
    outputDir = 'react-app-development'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting React Application Development: ${projectName}`);
  ctx.log('info', `State Management: ${stateManagement}`);
  ctx.log('info', `Styling: ${styling}`);

  // ============================================================================
  // PHASE 1: PROJECT ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing project architecture and component structure');

  const architectureDesign = await ctx.task(architectureDesignTask, {
    projectName,
    stateManagement,
    routing,
    styling,
    features,
    typescript,
    outputDir
  });

  artifacts.push(...architectureDesign.artifacts);

  // ============================================================================
  // PHASE 2: PROJECT SCAFFOLDING
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up project scaffolding with Vite');

  const projectScaffolding = await ctx.task(projectScaffoldingTask, {
    projectName,
    architectureDesign,
    typescript,
    styling,
    outputDir
  });

  artifacts.push(...projectScaffolding.artifacts);

  // ============================================================================
  // PHASE 3: STATE MANAGEMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring state management');

  const stateSetup = await ctx.task(stateManagementSetupTask, {
    projectName,
    stateManagement,
    features,
    outputDir
  });

  artifacts.push(...stateSetup.artifacts);

  // ============================================================================
  // PHASE 4: ROUTING CONFIGURATION
  // ============================================================================

  if (routing) {
    ctx.log('info', 'Phase 4: Setting up React Router');

    const routingSetup = await ctx.task(routingSetupTask, {
      projectName,
      architectureDesign,
      features,
      outputDir
    });

    artifacts.push(...routingSetup.artifacts);
  }

  // ============================================================================
  // PHASE 5: COMPONENT LIBRARY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing reusable component library');

  const componentLibrary = await ctx.task(componentLibraryTask, {
    projectName,
    styling,
    architectureDesign,
    outputDir
  });

  artifacts.push(...componentLibrary.artifacts);

  // ============================================================================
  // PHASE 6: CUSTOM HOOKS AND UTILITIES
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating custom hooks and utility functions');

  const hooksAndUtils = await ctx.task(hooksUtilitiesTask, {
    projectName,
    stateManagement,
    features,
    outputDir
  });

  artifacts.push(...hooksAndUtils.artifacts);

  // ============================================================================
  // PHASE 7: TESTING INFRASTRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up testing infrastructure');

  const testingInfra = await ctx.task(testingInfrastructureTask, {
    projectName,
    testing,
    componentLibrary,
    outputDir
  });

  artifacts.push(...testingInfra.artifacts);

  // Quality Gate: Review architecture and components
  await ctx.breakpoint({
    question: `Phase 7 Complete: React app architecture designed with ${componentLibrary.components.length} components and ${testingInfra.testSuites.length} test suites. Proceed with performance optimization?`,
    title: 'Architecture and Components Review',
    context: {
      runId: ctx.runId,
      projectName,
      components: componentLibrary.components,
      testCoverage: testingInfra.coverageTargets,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 8: PERFORMANCE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing performance optimizations');

  const performanceOptimization = await ctx.task(performanceOptimizationTask, {
    projectName,
    componentLibrary,
    stateManagement,
    outputDir
  });

  artifacts.push(...performanceOptimization.artifacts);

  // ============================================================================
  // PHASE 9: ERROR HANDLING AND BOUNDARIES
  // ============================================================================

  ctx.log('info', 'Phase 9: Setting up error handling and boundaries');

  const errorHandling = await ctx.task(errorHandlingTask, {
    projectName,
    outputDir
  });

  artifacts.push(...errorHandling.artifacts);

  // ============================================================================
  // PHASE 10: DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating comprehensive documentation');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    architectureDesign,
    componentLibrary,
    stateSetup,
    testingInfra,
    performanceOptimization,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    projectStructure: architectureDesign.structure,
    configuration: {
      stateManagement,
      routing,
      styling,
      typescript,
      testing
    },
    components: componentLibrary.components,
    hooks: hooksAndUtils.hooks,
    testSuites: testingInfra.testSuites,
    performance: {
      optimizations: performanceOptimization.optimizations,
      metrics: performanceOptimization.targetMetrics
    },
    documentation: {
      readme: documentation.readmePath,
      componentDocs: documentation.componentDocsPath,
      styleguide: documentation.styleguidePath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/web-development/react-app-development',
      timestamp: startTime,
      stateManagement,
      styling
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const architectureDesignTask = defineTask('architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Architecture Design - ${args.projectName}`,
  agent: {
    name: 'frontend-architect-agent',
    prompt: {
      role: 'Senior React Architect with expertise in scalable application design',
      task: 'Design comprehensive React application architecture',
      context: {
        projectName: args.projectName,
        stateManagement: args.stateManagement,
        routing: args.routing,
        styling: args.styling,
        features: args.features,
        typescript: args.typescript,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design feature-based folder structure for scalability',
        '2. Define component hierarchy and composition patterns',
        '3. Plan state management architecture (global vs local state)',
        '4. Design routing structure and navigation patterns',
        '5. Define data fetching and caching strategies',
        '6. Plan code splitting and lazy loading boundaries',
        '7. Design error boundary placement strategy',
        '8. Create TypeScript type definitions structure',
        '9. Define styling architecture and theming approach',
        '10. Document architectural decisions and rationale'
      ],
      outputFormat: 'JSON with architecture design, structure, and decisions'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'componentHierarchy', 'artifacts'],
      properties: {
        structure: { type: 'object' },
        componentHierarchy: { type: 'array', items: { type: 'object' } },
        stateArchitecture: { type: 'object' },
        routingPlan: { type: 'object' },
        decisions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'react', 'architecture', 'design']
}));

export const projectScaffoldingTask = defineTask('project-scaffolding', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Project Scaffolding - ${args.projectName}`,
  agent: {
    name: 'react-developer-agent',
    prompt: {
      role: 'React Developer specializing in project setup',
      task: 'Scaffold React project with Vite and configure build tools',
      context: {
        projectName: args.projectName,
        architectureDesign: args.architectureDesign,
        typescript: args.typescript,
        styling: args.styling,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Initialize React project with Vite and TypeScript template',
        '2. Configure package.json with dependencies and scripts',
        '3. Set up tsconfig.json with strict TypeScript settings',
        '4. Configure path aliases for clean imports',
        '5. Set up ESLint with React and TypeScript rules',
        '6. Configure Prettier for code formatting',
        '7. Set up Husky and lint-staged for pre-commit hooks',
        '8. Configure Vite with optimizations and plugins',
        '9. Set up environment variables configuration',
        '10. Create initial folder structure per architecture'
      ],
      outputFormat: 'JSON with project configuration and file structure'
    },
    outputSchema: {
      type: 'object',
      required: ['projectPath', 'dependencies', 'artifacts'],
      properties: {
        projectPath: { type: 'string' },
        dependencies: { type: 'object' },
        devDependencies: { type: 'object' },
        scripts: { type: 'object' },
        configFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'react', 'scaffolding', 'vite']
}));

export const stateManagementSetupTask = defineTask('state-management-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 3: State Management Setup - ${args.projectName}`,
  skill: {
    name: 'redux-toolkit-skill',
    prompt: {
      role: 'React State Management Specialist',
      task: 'Configure state management solution',
      context: {
        projectName: args.projectName,
        stateManagement: args.stateManagement,
        features: args.features,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Install and configure state management library',
        '2. Set up store with proper middleware configuration',
        '3. Create typed hooks for state access (useAppDispatch, useAppSelector)',
        '4. Define initial slices/stores for common features',
        '5. Configure Redux DevTools or equivalent debugging',
        '6. Set up state persistence if needed',
        '7. Create async action patterns (thunks/sagas)',
        '8. Implement selectors for derived state',
        '9. Set up state hydration for SSR if applicable',
        '10. Document state management patterns and conventions'
      ],
      outputFormat: 'JSON with state management configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['storeConfig', 'slices', 'artifacts'],
      properties: {
        storeConfig: { type: 'object' },
        slices: { type: 'array', items: { type: 'string' } },
        middleware: { type: 'array', items: { type: 'string' } },
        hooks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'react', 'state-management', 'redux']
}));

export const routingSetupTask = defineTask('routing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Routing Setup - ${args.projectName}`,
  agent: {
    name: 'react-router-specialist',
    prompt: {
      role: 'React Router Specialist',
      task: 'Configure React Router with best practices',
      context: {
        projectName: args.projectName,
        architectureDesign: args.architectureDesign,
        features: args.features,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Install and configure React Router v6',
        '2. Set up BrowserRouter with proper configuration',
        '3. Create route configuration with lazy loading',
        '4. Implement protected route components',
        '5. Set up nested routes and layouts',
        '6. Configure 404 and error routes',
        '7. Implement route-based code splitting',
        '8. Set up route guards for authentication',
        '9. Create navigation hooks and utilities',
        '10. Document routing patterns and navigation'
      ],
      outputFormat: 'JSON with routing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['routes', 'guards', 'artifacts'],
      properties: {
        routes: { type: 'array', items: { type: 'object' } },
        guards: { type: 'array', items: { type: 'string' } },
        layouts: { type: 'array', items: { type: 'string' } },
        navigationUtils: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'react', 'routing', 'react-router']
}));

export const componentLibraryTask = defineTask('component-library', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Component Library - ${args.projectName}`,
  agent: {
    name: 'component-developer-agent',
    prompt: {
      role: 'React Component Developer',
      task: 'Develop reusable component library',
      context: {
        projectName: args.projectName,
        styling: args.styling,
        architectureDesign: args.architectureDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create base UI components (Button, Input, Card, Modal)',
        '2. Implement form components with validation support',
        '3. Build layout components (Container, Grid, Stack)',
        '4. Create feedback components (Toast, Alert, Spinner)',
        '5. Implement navigation components (Navbar, Sidebar, Breadcrumb)',
        '6. Build data display components (Table, List, Avatar)',
        '7. Create accessibility-first component patterns',
        '8. Implement component composition patterns',
        '9. Add component variants and theming support',
        '10. Document component API and usage examples'
      ],
      outputFormat: 'JSON with component library details'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'artifacts'],
      properties: {
        components: { type: 'array', items: { type: 'object' } },
        categories: { type: 'array', items: { type: 'string' } },
        theme: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'react', 'components', 'ui-library']
}));

export const hooksUtilitiesTask = defineTask('hooks-utilities', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Custom Hooks and Utilities - ${args.projectName}`,
  agent: {
    name: 'hooks-developer-agent',
    prompt: {
      role: 'React Hooks Developer',
      task: 'Create custom hooks and utility functions',
      context: {
        projectName: args.projectName,
        stateManagement: args.stateManagement,
        features: args.features,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create useLocalStorage and useSessionStorage hooks',
        '2. Implement useDebounce and useThrottle hooks',
        '3. Build useMediaQuery for responsive design',
        '4. Create useFetch with caching and error handling',
        '5. Implement useOnClickOutside for modals',
        '6. Build useIntersectionObserver for lazy loading',
        '7. Create useKeyPress for keyboard shortcuts',
        '8. Implement usePrevious for state comparison',
        '9. Build utility functions for common operations',
        '10. Document hooks API and usage patterns'
      ],
      outputFormat: 'JSON with hooks and utilities details'
    },
    outputSchema: {
      type: 'object',
      required: ['hooks', 'utilities', 'artifacts'],
      properties: {
        hooks: { type: 'array', items: { type: 'object' } },
        utilities: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'react', 'hooks', 'utilities']
}));

export const testingInfrastructureTask = defineTask('testing-infrastructure', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 7: Testing Infrastructure - ${args.projectName}`,
  skill: {
    name: 'vitest-skill',
    prompt: {
      role: 'React Testing Specialist',
      task: 'Set up comprehensive testing infrastructure',
      context: {
        projectName: args.projectName,
        testing: args.testing,
        componentLibrary: args.componentLibrary,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure Vitest or Jest for unit testing',
        '2. Set up React Testing Library with utilities',
        '3. Create test setup files and mocks',
        '4. Implement component test patterns',
        '5. Set up hook testing utilities',
        '6. Configure code coverage reporting',
        '7. Create integration test patterns',
        '8. Set up MSW for API mocking',
        '9. Configure CI test running',
        '10. Document testing conventions and patterns'
      ],
      outputFormat: 'JSON with testing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['testSuites', 'coverageTargets', 'artifacts'],
      properties: {
        testSuites: { type: 'array', items: { type: 'string' } },
        coverageTargets: { type: 'object' },
        mocks: { type: 'array', items: { type: 'string' } },
        testUtils: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'react', 'testing', 'vitest']
}));

export const performanceOptimizationTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Performance Optimization - ${args.projectName}`,
  agent: {
    name: 'react-performance-specialist',
    prompt: {
      role: 'React Performance Optimization Specialist',
      task: 'Implement performance optimizations',
      context: {
        projectName: args.projectName,
        componentLibrary: args.componentLibrary,
        stateManagement: args.stateManagement,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement React.memo for expensive components',
        '2. Optimize with useMemo and useCallback',
        '3. Set up code splitting with React.lazy',
        '4. Configure bundle optimization in Vite',
        '5. Implement virtualization for large lists',
        '6. Optimize images with lazy loading',
        '7. Set up preloading for critical resources',
        '8. Configure tree-shaking for dependencies',
        '9. Implement performance monitoring',
        '10. Document performance best practices'
      ],
      outputFormat: 'JSON with performance optimization details'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'targetMetrics', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        targetMetrics: { type: 'object' },
        bundleAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'react', 'performance', 'optimization']
}));

export const errorHandlingTask = defineTask('error-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Error Handling - ${args.projectName}`,
  agent: {
    name: 'react-developer-agent',
    prompt: {
      role: 'React Developer specializing in error handling',
      task: 'Set up error handling and error boundaries',
      context: {
        projectName: args.projectName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create global error boundary component',
        '2. Implement feature-level error boundaries',
        '3. Set up error logging service integration',
        '4. Create fallback UI components',
        '5. Implement retry mechanisms',
        '6. Set up API error handling patterns',
        '7. Create error notification system',
        '8. Implement form validation error handling',
        '9. Set up development error overlay',
        '10. Document error handling patterns'
      ],
      outputFormat: 'JSON with error handling configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['errorBoundaries', 'errorHandlers', 'artifacts'],
      properties: {
        errorBoundaries: { type: 'array', items: { type: 'string' } },
        errorHandlers: { type: 'array', items: { type: 'string' } },
        fallbackComponents: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'react', 'error-handling', 'error-boundaries']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate comprehensive project documentation',
      context: {
        projectName: args.projectName,
        architectureDesign: args.architectureDesign,
        componentLibrary: args.componentLibrary,
        stateSetup: args.stateSetup,
        testingInfra: args.testingInfra,
        performanceOptimization: args.performanceOptimization,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create comprehensive README with setup instructions',
        '2. Document component library with examples',
        '3. Create state management usage guide',
        '4. Document routing and navigation patterns',
        '5. Create testing guide with examples',
        '6. Document performance optimization practices',
        '7. Create contribution guidelines',
        '8. Document folder structure and conventions',
        '9. Create troubleshooting guide',
        '10. Generate API documentation'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'componentDocsPath', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        componentDocsPath: { type: 'string' },
        styleguidePath: { type: 'string' },
        contributingPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'react', 'documentation']
}));
