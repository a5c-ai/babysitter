/**
 * @process specializations/web-development/nestjs-microservices
 * @description NestJS Microservices Architecture Development - Process for building scalable microservices with NestJS,
 * including dependency injection, modules, controllers, services, inter-service communication, and testing.
 * @inputs { projectName: string, transport?: string, database?: string, features?: object }
 * @outputs { success: boolean, services: array, modules: array, communication: object, artifacts: array }
 *
 * @references
 * - NestJS Documentation: https://nestjs.com/
 * - Microservices Patterns: https://microservices.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    transport = 'tcp',
    database = 'postgresql',
    features = { gateway: true, events: true },
    outputDir = 'nestjs-microservices'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting NestJS Microservices Development: ${projectName}`);

  const projectSetup = await ctx.task(projectSetupTask, { projectName, outputDir });
  artifacts.push(...projectSetup.artifacts);

  const moduleArchitecture = await ctx.task(moduleArchitectureTask, { projectName, outputDir });
  artifacts.push(...moduleArchitecture.artifacts);

  const serviceLayer = await ctx.task(serviceLayerTask, { projectName, database, outputDir });
  artifacts.push(...serviceLayer.artifacts);

  const controllerLayer = await ctx.task(controllerLayerTask, { projectName, outputDir });
  artifacts.push(...controllerLayer.artifacts);

  const communicationSetup = await ctx.task(communicationSetupTask, { projectName, transport, outputDir });
  artifacts.push(...communicationSetup.artifacts);

  if (features.gateway) {
    const gatewaySetup = await ctx.task(gatewaySetupTask, { projectName, outputDir });
    artifacts.push(...gatewaySetup.artifacts);
  }

  const eventBusSetup = await ctx.task(eventBusSetupTask, { projectName, features, outputDir });
  artifacts.push(...eventBusSetup.artifacts);

  await ctx.breakpoint({
    question: `NestJS Microservices setup complete for ${projectName}. ${moduleArchitecture.modules.length} modules, ${serviceLayer.services.length} services. Approve?`,
    title: 'NestJS Microservices Review',
    context: { runId: ctx.runId, modules: moduleArchitecture.modules, services: serviceLayer.services }
  });

  const testingSetup = await ctx.task(testingSetupTask, { projectName, outputDir });
  artifacts.push(...testingSetup.artifacts);

  const documentation = await ctx.task(documentationTask, { projectName, moduleArchitecture, serviceLayer, outputDir });
  artifacts.push(...documentation.artifacts);

  return {
    success: true,
    projectName,
    services: serviceLayer.services,
    modules: moduleArchitecture.modules,
    communication: communicationSetup.config,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/web-development/nestjs-microservices', timestamp: startTime }
  };
}

export const projectSetupTask = defineTask('nestjs-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `NestJS Setup - ${args.projectName}`,
  skill: {
    name: 'nestjs-skill',
    prompt: {
      role: 'NestJS Developer',
      task: 'Set up NestJS microservices project',
      context: args,
      instructions: ['1. Initialize NestJS monorepo', '2. Configure TypeScript', '3. Set up folder structure', '4. Configure microservice apps', '5. Set up shared library', '6. Configure environment', '7. Set up logging', '8. Configure Docker', '9. Set up npm scripts', '10. Document setup'],
      outputFormat: 'JSON with project setup'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'nestjs', 'microservices', 'setup']
}));

export const moduleArchitectureTask = defineTask('nestjs-modules', (args, taskCtx) => ({
  kind: 'agent',
  title: `NestJS Modules - ${args.projectName}`,
  agent: {
    name: 'nestjs-architect',
    prompt: {
      role: 'NestJS Module Architect',
      task: 'Design module architecture',
      context: args,
      instructions: ['1. Create core module', '2. Design feature modules', '3. Set up shared modules', '4. Configure dynamic modules', '5. Set up global modules', '6. Configure providers', '7. Set up exports/imports', '8. Create module factories', '9. Configure lazy loading', '10. Document modules'],
      outputFormat: 'JSON with module architecture'
    },
    outputSchema: { type: 'object', required: ['modules', 'artifacts'], properties: { modules: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'nestjs', 'modules']
}));

export const serviceLayerTask = defineTask('nestjs-services', (args, taskCtx) => ({
  kind: 'agent',
  title: `NestJS Services - ${args.projectName}`,
  agent: {
    name: 'nestjs-service-developer',
    prompt: {
      role: 'NestJS Service Developer',
      task: 'Implement service layer',
      context: args,
      instructions: ['1. Create injectable services', '2. Implement business logic', '3. Set up repository pattern', '4. Configure transactions', '5. Create service interfaces', '6. Implement caching', '7. Set up error handling', '8. Create service utilities', '9. Implement logging', '10. Document services'],
      outputFormat: 'JSON with services'
    },
    outputSchema: { type: 'object', required: ['services', 'artifacts'], properties: { services: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'nestjs', 'services']
}));

export const controllerLayerTask = defineTask('nestjs-controllers', (args, taskCtx) => ({
  kind: 'agent',
  title: `NestJS Controllers - ${args.projectName}`,
  agent: {
    name: 'nestjs-controller-developer',
    prompt: {
      role: 'NestJS Controller Developer',
      task: 'Implement controllers',
      context: args,
      instructions: ['1. Create REST controllers', '2. Implement message patterns', '3. Set up event handlers', '4. Configure DTOs', '5. Implement validation', '6. Set up guards', '7. Configure interceptors', '8. Implement pipes', '9. Set up decorators', '10. Document controllers'],
      outputFormat: 'JSON with controllers'
    },
    outputSchema: { type: 'object', required: ['controllers', 'artifacts'], properties: { controllers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'nestjs', 'controllers']
}));

export const communicationSetupTask = defineTask('nestjs-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: `Inter-Service Communication - ${args.projectName}`,
  agent: {
    name: 'microservices-communication-specialist',
    prompt: {
      role: 'Microservices Communication Specialist',
      task: 'Set up inter-service communication',
      context: args,
      instructions: ['1. Configure transport layer', '2. Set up client proxies', '3. Implement message patterns', '4. Configure serialization', '5. Set up retry logic', '6. Configure timeouts', '7. Implement circuit breaker', '8. Set up load balancing', '9. Configure service discovery', '10. Document communication'],
      outputFormat: 'JSON with communication setup'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'nestjs', 'microservices', 'communication']
}));

export const gatewaySetupTask = defineTask('nestjs-gateway', (args, taskCtx) => ({
  kind: 'agent',
  title: `API Gateway - ${args.projectName}`,
  agent: {
    name: 'api-gateway-specialist',
    prompt: {
      role: 'API Gateway Specialist',
      task: 'Set up API Gateway',
      context: args,
      instructions: ['1. Create gateway service', '2. Configure routing', '3. Implement aggregation', '4. Set up authentication', '5. Configure rate limiting', '6. Implement load balancing', '7. Set up caching', '8. Configure CORS', '9. Implement health checks', '10. Document gateway'],
      outputFormat: 'JSON with gateway setup'
    },
    outputSchema: { type: 'object', required: ['gateway', 'artifacts'], properties: { gateway: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'nestjs', 'api-gateway']
}));

export const eventBusSetupTask = defineTask('nestjs-events', (args, taskCtx) => ({
  kind: 'agent',
  title: `Event Bus - ${args.projectName}`,
  agent: {
    name: 'event-driven-specialist',
    prompt: {
      role: 'Event-Driven Architecture Specialist',
      task: 'Set up event bus',
      context: args,
      instructions: ['1. Configure event emitter', '2. Set up event handlers', '3. Implement CQRS', '4. Configure event sourcing', '5. Set up sagas', '6. Implement event replay', '7. Configure event storage', '8. Set up dead letter queue', '9. Implement idempotency', '10. Document events'],
      outputFormat: 'JSON with event bus setup'
    },
    outputSchema: { type: 'object', required: ['events', 'artifacts'], properties: { events: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'nestjs', 'events', 'cqrs']
}));

export const testingSetupTask = defineTask('nestjs-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `NestJS Testing - ${args.projectName}`,
  agent: {
    name: 'nestjs-testing-specialist',
    prompt: {
      role: 'NestJS Testing Specialist',
      task: 'Set up testing',
      context: args,
      instructions: ['1. Configure Jest', '2. Create unit tests', '3. Set up integration tests', '4. Test controllers', '5. Test services', '6. Mock dependencies', '7. Test microservice communication', '8. Set up e2e tests', '9. Configure coverage', '10. Document testing'],
      outputFormat: 'JSON with testing setup'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'nestjs', 'testing']
}));

export const documentationTask = defineTask('nestjs-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `NestJS Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate NestJS documentation',
      context: args,
      instructions: ['1. Create README', '2. Document architecture', '3. Create module documentation', '4. Document services', '5. Create API documentation', '6. Document communication', '7. Create deployment guide', '8. Document testing', '9. Create troubleshooting', '10. Generate Swagger docs'],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'nestjs', 'documentation']
}));
