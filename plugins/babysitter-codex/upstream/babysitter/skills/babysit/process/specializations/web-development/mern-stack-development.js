/**
 * @process specializations/web-development/mern-stack-development
 * @description MERN Stack Application Development - Complete full-stack development process using MongoDB, Express.js,
 * React, and Node.js with RESTful API design, authentication, state management, and deployment.
 * @inputs { projectName: string, auth?: string, stateManagement?: string, testing?: object, deployment?: string }
 * @outputs { success: boolean, frontend: object, backend: object, database: object, authentication: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/web-development/mern-stack-development', {
 *   projectName: 'MyMERNApp',
 *   auth: 'jwt',
 *   stateManagement: 'redux-toolkit',
 *   testing: { unit: true, integration: true },
 *   deployment: 'docker'
 * });
 *
 * @references
 * - MongoDB Documentation: https://docs.mongodb.com/
 * - Express.js: https://expressjs.com/
 * - React: https://react.dev/
 * - Node.js: https://nodejs.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    auth = 'jwt',
    stateManagement = 'redux-toolkit',
    testing = { unit: true, integration: true },
    deployment = 'docker',
    outputDir = 'mern-stack-development'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MERN Stack Application: ${projectName}`);

  // ============================================================================
  // PHASE 1: PROJECT STRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up monorepo project structure');

  const projectSetup = await ctx.task(projectSetupTask, {
    projectName,
    outputDir
  });

  artifacts.push(...projectSetup.artifacts);

  // ============================================================================
  // PHASE 2: BACKEND SETUP (EXPRESS + NODE)
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up Express.js backend');

  const backendSetup = await ctx.task(backendSetupTask, {
    projectName,
    auth,
    outputDir
  });

  artifacts.push(...backendSetup.artifacts);

  // ============================================================================
  // PHASE 3: DATABASE SETUP (MONGODB)
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up MongoDB with Mongoose');

  const databaseSetup = await ctx.task(databaseSetupTask, {
    projectName,
    outputDir
  });

  artifacts.push(...databaseSetup.artifacts);

  // ============================================================================
  // PHASE 4: REST API DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing RESTful API');

  const apiDevelopment = await ctx.task(apiDevelopmentTask, {
    projectName,
    databaseSetup,
    outputDir
  });

  artifacts.push(...apiDevelopment.artifacts);

  // ============================================================================
  // PHASE 5: AUTHENTICATION SYSTEM
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing authentication');

  const authSetup = await ctx.task(authSetupTask, {
    projectName,
    auth,
    outputDir
  });

  artifacts.push(...authSetup.artifacts);

  // ============================================================================
  // PHASE 6: FRONTEND SETUP (REACT)
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up React frontend');

  const frontendSetup = await ctx.task(frontendSetupTask, {
    projectName,
    stateManagement,
    outputDir
  });

  artifacts.push(...frontendSetup.artifacts);

  // ============================================================================
  // PHASE 7: STATE MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Configuring state management');

  const stateSetup = await ctx.task(stateSetupTask, {
    projectName,
    stateManagement,
    outputDir
  });

  artifacts.push(...stateSetup.artifacts);

  // ============================================================================
  // PHASE 8: API INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Integrating frontend with API');

  const apiIntegration = await ctx.task(apiIntegrationTask, {
    projectName,
    apiDevelopment,
    outputDir
  });

  artifacts.push(...apiIntegration.artifacts);

  // Quality Gate
  await ctx.breakpoint({
    question: `MERN Stack setup complete for ${projectName}. Backend with ${apiDevelopment.endpoints.length} endpoints, React frontend with ${stateManagement}. Approve configuration?`,
    title: 'MERN Stack Review',
    context: {
      runId: ctx.runId,
      endpoints: apiDevelopment.endpoints,
      models: databaseSetup.models,
      components: frontendSetup.components,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 9: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 9: Setting up testing');

  const testingSetup = await ctx.task(testingSetupTask, {
    projectName,
    testing,
    outputDir
  });

  artifacts.push(...testingSetup.artifacts);

  // ============================================================================
  // PHASE 10: DEPLOYMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Configuring deployment');

  const deploymentConfig = await ctx.task(deploymentConfigTask, {
    projectName,
    deployment,
    outputDir
  });

  artifacts.push(...deploymentConfig.artifacts);

  // ============================================================================
  // PHASE 11: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating documentation');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    backendSetup,
    frontendSetup,
    apiDevelopment,
    databaseSetup,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    frontend: {
      framework: 'React',
      stateManagement,
      components: frontendSetup.components
    },
    backend: {
      framework: 'Express.js',
      endpoints: apiDevelopment.endpoints,
      middleware: backendSetup.middleware
    },
    database: {
      type: 'MongoDB',
      models: databaseSetup.models
    },
    authentication: authSetup.config,
    testing: testingSetup.config,
    deployment: deploymentConfig.config,
    documentation: documentation.docs,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/web-development/mern-stack-development',
      timestamp: startTime,
      auth,
      stateManagement
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const projectSetupTask = defineTask('mern-project-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: MERN Project Setup - ${args.projectName}`,
  agent: {
    name: 'fullstack-architect-agent',
    prompt: {
      role: 'Full-Stack Developer',
      task: 'Set up MERN monorepo structure',
      context: args,
      instructions: [
        '1. Create monorepo structure (client/server)',
        '2. Initialize package.json files',
        '3. Set up TypeScript configuration',
        '4. Configure ESLint and Prettier',
        '5. Set up shared types package',
        '6. Configure path aliases',
        '7. Set up environment variables',
        '8. Configure Git hooks',
        '9. Create npm scripts',
        '10. Document project structure'
      ],
      outputFormat: 'JSON with project setup'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'configuration', 'artifacts'],
      properties: {
        structure: { type: 'object' },
        configuration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'mern', 'setup']
}));

export const backendSetupTask = defineTask('express-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 2: Express Backend Setup - ${args.projectName}`,
  skill: {
    name: 'express-skill',
    prompt: {
      role: 'Node.js Backend Developer',
      task: 'Set up Express.js backend',
      context: args,
      instructions: [
        '1. Initialize Express application',
        '2. Configure middleware stack',
        '3. Set up error handling',
        '4. Configure CORS',
        '5. Set up request logging',
        '6. Configure security headers',
        '7. Set up rate limiting',
        '8. Configure body parsing',
        '9. Set up route structure',
        '10. Document backend setup'
      ],
      outputFormat: 'JSON with backend configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'middleware', 'artifacts'],
      properties: {
        config: { type: 'object' },
        middleware: { type: 'array' },
        routes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'mern', 'express', 'backend']
}));

export const databaseSetupTask = defineTask('mongodb-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 3: MongoDB Setup - ${args.projectName}`,
  skill: {
    name: 'mongodb-skill',
    prompt: {
      role: 'MongoDB Specialist',
      task: 'Set up MongoDB with Mongoose',
      context: args,
      instructions: [
        '1. Install Mongoose',
        '2. Configure connection',
        '3. Create schema definitions',
        '4. Implement models',
        '5. Set up indexes',
        '6. Create validators',
        '7. Implement virtuals',
        '8. Set up middleware (hooks)',
        '9. Create seed data',
        '10. Document schema'
      ],
      outputFormat: 'JSON with database configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['models', 'schemas', 'artifacts'],
      properties: {
        models: { type: 'array', items: { type: 'string' } },
        schemas: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'mern', 'mongodb', 'database']
}));

export const apiDevelopmentTask = defineTask('rest-api', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: REST API Development - ${args.projectName}`,
  agent: {
    name: 'api-developer',
    prompt: {
      role: 'REST API Developer',
      task: 'Develop RESTful API',
      context: args,
      instructions: [
        '1. Create controller structure',
        '2. Implement CRUD endpoints',
        '3. Set up request validation',
        '4. Implement pagination',
        '5. Create filtering and sorting',
        '6. Set up response formatting',
        '7. Implement error responses',
        '8. Create API documentation',
        '9. Set up versioning',
        '10. Document API patterns'
      ],
      outputFormat: 'JSON with API configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['endpoints', 'controllers', 'artifacts'],
      properties: {
        endpoints: { type: 'array', items: { type: 'object' } },
        controllers: { type: 'array' },
        validators: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'mern', 'api', 'rest']
}));

export const authSetupTask = defineTask('jwt-auth', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Authentication Setup - ${args.projectName}`,
  agent: {
    name: 'auth-specialist-agent',
    prompt: {
      role: 'Authentication Specialist',
      task: 'Implement JWT authentication',
      context: args,
      instructions: [
        '1. Set up JWT configuration',
        '2. Implement registration',
        '3. Create login endpoint',
        '4. Implement token refresh',
        '5. Set up password reset',
        '6. Create auth middleware',
        '7. Implement logout',
        '8. Set up token blacklisting',
        '9. Create protected routes',
        '10. Document auth flow'
      ],
      outputFormat: 'JSON with auth configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'endpoints', 'artifacts'],
      properties: {
        config: { type: 'object' },
        endpoints: { type: 'array' },
        middleware: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'mern', 'authentication', 'jwt']
}));

export const frontendSetupTask = defineTask('react-frontend', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: React Frontend Setup - ${args.projectName}`,
  agent: {
    name: 'react-developer-agent',
    prompt: {
      role: 'React Developer',
      task: 'Set up React frontend',
      context: args,
      instructions: [
        '1. Initialize React with Vite',
        '2. Configure TypeScript',
        '3. Set up folder structure',
        '4. Configure routing',
        '5. Create base components',
        '6. Set up styling',
        '7. Configure API client',
        '8. Create layout components',
        '9. Set up error handling',
        '10. Document frontend setup'
      ],
      outputFormat: 'JSON with frontend configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'configuration', 'artifacts'],
      properties: {
        components: { type: 'array' },
        configuration: { type: 'object' },
        routes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'mern', 'react', 'frontend']
}));

export const stateSetupTask = defineTask('redux-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 7: State Management - ${args.projectName}`,
  skill: {
    name: 'redux-toolkit-skill',
    prompt: {
      role: 'State Management Specialist',
      task: 'Configure Redux Toolkit',
      context: args,
      instructions: [
        '1. Install Redux Toolkit',
        '2. Configure store',
        '3. Create slices',
        '4. Set up async thunks',
        '5. Create selectors',
        '6. Configure DevTools',
        '7. Set up persistence',
        '8. Create typed hooks',
        '9. Implement middleware',
        '10. Document state patterns'
      ],
      outputFormat: 'JSON with state configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['store', 'slices', 'artifacts'],
      properties: {
        store: { type: 'object' },
        slices: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'mern', 'redux', 'state-management']
}));

export const apiIntegrationTask = defineTask('api-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: API Integration - ${args.projectName}`,
  agent: {
    name: 'integration-specialist',
    prompt: {
      role: 'API Integration Specialist',
      task: 'Integrate frontend with API',
      context: args,
      instructions: [
        '1. Configure Axios instance',
        '2. Set up interceptors',
        '3. Create API service layer',
        '4. Implement error handling',
        '5. Set up token management',
        '6. Create typed responses',
        '7. Implement caching',
        '8. Set up retry logic',
        '9. Create loading states',
        '10. Document integration'
      ],
      outputFormat: 'JSON with integration configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['services', 'interceptors', 'artifacts'],
      properties: {
        services: { type: 'array' },
        interceptors: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'mern', 'api-integration']
}));

export const testingSetupTask = defineTask('mern-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Testing Setup - ${args.projectName}`,
  agent: {
    name: 'testing-specialist',
    prompt: {
      role: 'Testing Specialist',
      task: 'Set up testing',
      context: args,
      instructions: [
        '1. Configure Jest for backend',
        '2. Set up Vitest for frontend',
        '3. Create API tests',
        '4. Implement component tests',
        '5. Set up integration tests',
        '6. Configure test database',
        '7. Create test utilities',
        '8. Set up coverage',
        '9. Configure CI testing',
        '10. Document testing'
      ],
      outputFormat: 'JSON with testing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'suites', 'artifacts'],
      properties: {
        config: { type: 'object' },
        suites: { type: 'array' },
        coverage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'mern', 'testing']
}));

export const deploymentConfigTask = defineTask('mern-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Deployment - ${args.projectName}`,
  agent: {
    name: 'deployment-agent',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Configure deployment',
      context: args,
      instructions: [
        '1. Create Dockerfiles',
        '2. Configure docker-compose',
        '3. Set up nginx',
        '4. Configure environment',
        '5. Set up CI/CD',
        '6. Configure database deployment',
        '7. Set up monitoring',
        '8. Configure logging',
        '9. Set up SSL',
        '10. Document deployment'
      ],
      outputFormat: 'JSON with deployment configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'docker', 'artifacts'],
      properties: {
        config: { type: 'object' },
        docker: { type: 'object' },
        cicd: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'mern', 'deployment', 'docker']
}));

export const documentationTask = defineTask('mern-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate MERN documentation',
      context: args,
      instructions: [
        '1. Create README',
        '2. Document API endpoints',
        '3. Create frontend documentation',
        '4. Document database schema',
        '5. Create authentication guide',
        '6. Document state management',
        '7. Create deployment guide',
        '8. Document testing',
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
  labels: ['web', 'mern', 'documentation']
}));
