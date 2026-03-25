/**
 * @process specializations/web-development/restful-api-nodejs
 * @description RESTful API Development with Node.js/Express - Process for designing and implementing RESTful APIs with Express.js,
 * including routing, middleware, validation, error handling, authentication, and API documentation.
 * @inputs { projectName: string, database?: string, auth?: string, documentation?: string, features?: object }
 * @outputs { success: boolean, endpoints: array, middleware: array, documentation: object, artifacts: array }
 *
 * @references
 * - REST API Design Principles: https://restfulapi.net/
 * - Express.js Documentation: https://expressjs.com/
 * - OpenAPI/Swagger: https://swagger.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    database = 'postgresql',
    auth = 'jwt',
    documentation = 'swagger',
    features = { versioning: true, rateLimit: true },
    outputDir = 'restful-api-nodejs'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting RESTful API Development: ${projectName}`);

  const projectSetup = await ctx.task(projectSetupTask, { projectName, outputDir });
  artifacts.push(...projectSetup.artifacts);

  const routingSetup = await ctx.task(routingSetupTask, { projectName, features, outputDir });
  artifacts.push(...routingSetup.artifacts);

  const middlewareSetup = await ctx.task(middlewareSetupTask, { projectName, features, outputDir });
  artifacts.push(...middlewareSetup.artifacts);

  const validationSetup = await ctx.task(validationSetupTask, { projectName, outputDir });
  artifacts.push(...validationSetup.artifacts);

  const errorHandling = await ctx.task(errorHandlingTask, { projectName, outputDir });
  artifacts.push(...errorHandling.artifacts);

  const authSetup = await ctx.task(authSetupTask, { projectName, auth, outputDir });
  artifacts.push(...authSetup.artifacts);

  const apiDocumentation = await ctx.task(apiDocumentationTask, { projectName, documentation, routingSetup, outputDir });
  artifacts.push(...apiDocumentation.artifacts);

  await ctx.breakpoint({
    question: `RESTful API setup complete for ${projectName}. ${routingSetup.endpoints.length} endpoints created. Approve?`,
    title: 'RESTful API Review',
    context: { runId: ctx.runId, endpoints: routingSetup.endpoints }
  });

  const testingSetup = await ctx.task(testingSetupTask, { projectName, outputDir });
  artifacts.push(...testingSetup.artifacts);

  const documentation = await ctx.task(documentationTask, { projectName, routingSetup, apiDocumentation, outputDir });
  artifacts.push(...documentation.artifacts);

  return {
    success: true,
    projectName,
    endpoints: routingSetup.endpoints,
    middleware: middlewareSetup.middleware,
    documentation: apiDocumentation.spec,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/web-development/restful-api-nodejs', timestamp: startTime }
  };
}

export const projectSetupTask = defineTask('rest-api-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `REST API Setup - ${args.projectName}`,
  skill: {
    name: 'express-skill',
    prompt: {
      role: 'Node.js API Developer',
      task: 'Set up Express.js REST API project',
      context: args,
      instructions: ['1. Initialize Express project', '2. Configure TypeScript', '3. Set up folder structure', '4. Configure middleware', '5. Set up error handling', '6. Configure CORS', '7. Set up logging', '8. Configure environment', '9. Set up security headers', '10. Document setup'],
      outputFormat: 'JSON with project setup'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'api', 'express', 'setup']
}));

export const routingSetupTask = defineTask('rest-api-routing', (args, taskCtx) => ({
  kind: 'agent',
  title: `REST API Routing - ${args.projectName}`,
  agent: {
    name: 'api-developer-agent',
    prompt: {
      role: 'REST API Architect',
      task: 'Design and implement RESTful routes',
      context: args,
      instructions: ['1. Design resource-based URLs', '2. Implement CRUD endpoints', '3. Set up route versioning', '4. Implement nested routes', '5. Configure route parameters', '6. Set up query handling', '7. Implement pagination', '8. Configure filters/sorting', '9. Set up route guards', '10. Document endpoints'],
      outputFormat: 'JSON with routing configuration'
    },
    outputSchema: { type: 'object', required: ['endpoints', 'artifacts'], properties: { endpoints: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'api', 'routing']
}));

export const middlewareSetupTask = defineTask('rest-api-middleware', (args, taskCtx) => ({
  kind: 'agent',
  title: `REST API Middleware - ${args.projectName}`,
  agent: {
    name: 'middleware-specialist',
    prompt: {
      role: 'Express Middleware Specialist',
      task: 'Configure middleware stack',
      context: args,
      instructions: ['1. Set up body parsing', '2. Configure CORS', '3. Implement rate limiting', '4. Set up request logging', '5. Configure compression', '6. Implement caching', '7. Set up security middleware', '8. Configure helmet', '9. Create custom middleware', '10. Document middleware'],
      outputFormat: 'JSON with middleware configuration'
    },
    outputSchema: { type: 'object', required: ['middleware', 'artifacts'], properties: { middleware: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'api', 'middleware']
}));

export const validationSetupTask = defineTask('rest-api-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `REST API Validation - ${args.projectName}`,
  agent: {
    name: 'validation-specialist',
    prompt: {
      role: 'API Validation Specialist',
      task: 'Set up request validation',
      context: args,
      instructions: ['1. Configure Joi/Zod validation', '2. Create validation schemas', '3. Implement request validation', '4. Set up parameter validation', '5. Create custom validators', '6. Implement sanitization', '7. Set up error messages', '8. Create validation middleware', '9. Implement type coercion', '10. Document validation'],
      outputFormat: 'JSON with validation configuration'
    },
    outputSchema: { type: 'object', required: ['schemas', 'artifacts'], properties: { schemas: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'api', 'validation']
}));

export const errorHandlingTask = defineTask('rest-api-errors', (args, taskCtx) => ({
  kind: 'agent',
  title: `REST API Error Handling - ${args.projectName}`,
  agent: {
    name: 'error-handling-specialist',
    prompt: {
      role: 'Error Handling Specialist',
      task: 'Implement error handling',
      context: args,
      instructions: ['1. Create error classes', '2. Implement global error handler', '3. Set up HTTP status codes', '4. Create error responses', '5. Implement logging', '6. Set up async error handling', '7. Create error utilities', '8. Implement not found handler', '9. Set up validation errors', '10. Document error patterns'],
      outputFormat: 'JSON with error handling'
    },
    outputSchema: { type: 'object', required: ['errorHandlers', 'artifacts'], properties: { errorHandlers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'api', 'error-handling']
}));

export const authSetupTask = defineTask('rest-api-auth', (args, taskCtx) => ({
  kind: 'agent',
  title: `REST API Authentication - ${args.projectName}`,
  agent: {
    name: 'auth-specialist-agent',
    prompt: {
      role: 'API Authentication Specialist',
      task: 'Implement API authentication',
      context: args,
      instructions: ['1. Set up JWT authentication', '2. Implement login/register', '3. Configure token handling', '4. Set up refresh tokens', '5. Create auth middleware', '6. Implement password reset', '7. Set up API keys', '8. Configure OAuth', '9. Implement RBAC', '10. Document auth'],
      outputFormat: 'JSON with auth configuration'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'api', 'authentication']
}));

export const apiDocumentationTask = defineTask('rest-api-docs', (args, taskCtx) => ({
  kind: 'skill',
  title: `REST API Documentation - ${args.projectName}`,
  skill: {
    name: 'swagger-skill',
    prompt: {
      role: 'API Documentation Specialist',
      task: 'Generate API documentation',
      context: args,
      instructions: ['1. Set up Swagger/OpenAPI', '2. Document endpoints', '3. Create request examples', '4. Document responses', '5. Add authentication docs', '6. Create error documentation', '7. Set up Swagger UI', '8. Generate SDK types', '9. Create Postman collection', '10. Document API versioning'],
      outputFormat: 'JSON with API documentation'
    },
    outputSchema: { type: 'object', required: ['spec', 'artifacts'], properties: { spec: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'api', 'documentation', 'swagger']
}));

export const testingSetupTask = defineTask('rest-api-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `REST API Testing - ${args.projectName}`,
  agent: {
    name: 'api-testing-specialist',
    prompt: {
      role: 'API Testing Specialist',
      task: 'Set up API testing',
      context: args,
      instructions: ['1. Configure Jest/Vitest', '2. Set up Supertest', '3. Create test utilities', '4. Implement endpoint tests', '5. Set up integration tests', '6. Configure test database', '7. Create fixtures', '8. Set up coverage', '9. Configure CI testing', '10. Document testing'],
      outputFormat: 'JSON with testing configuration'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'api', 'testing']
}));

export const documentationTask = defineTask('rest-api-full-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate project documentation',
      context: args,
      instructions: ['1. Create README', '2. Document setup', '3. Create API guide', '4. Document authentication', '5. Create examples', '6. Document deployment', '7. Create troubleshooting', '8. Document testing', '9. Create contribution guide', '10. Generate changelog'],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'api', 'documentation']
}));
