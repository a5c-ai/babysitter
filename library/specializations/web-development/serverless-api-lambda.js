/**
 * @process specializations/web-development/serverless-api-lambda
 * @description Serverless API Development with AWS Lambda - Process for building serverless APIs using AWS Lambda,
 * API Gateway, DynamoDB, authentication, monitoring, and infrastructure as code.
 * @inputs { projectName: string, framework?: string, database?: string, auth?: string }
 * @outputs { success: boolean, functions: array, apiGateway: object, infrastructure: object, artifacts: array }
 *
 * @references
 * - AWS Lambda Documentation: https://docs.aws.amazon.com/lambda/
 * - Serverless Framework: https://www.serverless.com/
 * - AWS SAM: https://aws.amazon.com/serverless/sam/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'serverless',
    database = 'dynamodb',
    auth = 'cognito',
    outputDir = 'serverless-api-lambda'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Serverless API Development: ${projectName}`);

  const projectSetup = await ctx.task(projectSetupTask, { projectName, framework, outputDir });
  artifacts.push(...projectSetup.artifacts);

  const functionsSetup = await ctx.task(functionsSetupTask, { projectName, outputDir });
  artifacts.push(...functionsSetup.artifacts);

  const apiGatewaySetup = await ctx.task(apiGatewaySetupTask, { projectName, outputDir });
  artifacts.push(...apiGatewaySetup.artifacts);

  const databaseSetup = await ctx.task(databaseSetupTask, { projectName, database, outputDir });
  artifacts.push(...databaseSetup.artifacts);

  const authSetup = await ctx.task(authSetupTask, { projectName, auth, outputDir });
  artifacts.push(...authSetup.artifacts);

  const infrastructureSetup = await ctx.task(infrastructureSetupTask, { projectName, framework, outputDir });
  artifacts.push(...infrastructureSetup.artifacts);

  const monitoringSetup = await ctx.task(monitoringSetupTask, { projectName, outputDir });
  artifacts.push(...monitoringSetup.artifacts);

  await ctx.breakpoint({
    question: `Serverless API setup complete for ${projectName}. ${functionsSetup.functions.length} Lambda functions, API Gateway configured. Approve?`,
    title: 'Serverless API Review',
    context: { runId: ctx.runId, functions: functionsSetup.functions, endpoints: apiGatewaySetup.endpoints }
  });

  const testingSetup = await ctx.task(testingSetupTask, { projectName, outputDir });
  artifacts.push(...testingSetup.artifacts);

  const documentation = await ctx.task(documentationTask, { projectName, functionsSetup, apiGatewaySetup, outputDir });
  artifacts.push(...documentation.artifacts);

  return {
    success: true,
    projectName,
    functions: functionsSetup.functions,
    apiGateway: apiGatewaySetup.config,
    infrastructure: infrastructureSetup.resources,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/web-development/serverless-api-lambda', timestamp: startTime }
  };
}

export const projectSetupTask = defineTask('serverless-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Serverless Setup - ${args.projectName}`,
  agent: {
    name: 'serverless-developer',
    prompt: {
      role: 'Serverless Developer',
      task: 'Set up serverless project',
      context: args,
      instructions: ['1. Initialize Serverless Framework', '2. Configure TypeScript', '3. Set up folder structure', '4. Configure plugins', '5. Set up offline development', '6. Configure environment', '7. Set up logging', '8. Configure bundling', '9. Set up npm scripts', '10. Document setup'],
      outputFormat: 'JSON with project setup'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'serverless', 'lambda', 'setup']
}));

export const functionsSetupTask = defineTask('lambda-functions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Lambda Functions - ${args.projectName}`,
  agent: {
    name: 'lambda-developer',
    prompt: {
      role: 'Lambda Developer',
      task: 'Create Lambda functions',
      context: args,
      instructions: ['1. Create handler functions', '2. Implement CRUD handlers', '3. Set up middleware', '4. Configure timeout/memory', '5. Set up layers', '6. Implement validation', '7. Create error handling', '8. Set up warm-up', '9. Configure VPC', '10. Document functions'],
      outputFormat: 'JSON with functions'
    },
    outputSchema: { type: 'object', required: ['functions', 'artifacts'], properties: { functions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'serverless', 'lambda', 'functions']
}));

export const apiGatewaySetupTask = defineTask('api-gateway', (args, taskCtx) => ({
  kind: 'agent',
  title: `API Gateway - ${args.projectName}`,
  agent: {
    name: 'api-gateway-developer',
    prompt: {
      role: 'API Gateway Developer',
      task: 'Configure API Gateway',
      context: args,
      instructions: ['1. Create REST API', '2. Configure routes', '3. Set up CORS', '4. Configure authorizers', '5. Set up request validation', '6. Configure throttling', '7. Set up caching', '8. Configure custom domain', '9. Set up stages', '10. Document API'],
      outputFormat: 'JSON with API Gateway configuration'
    },
    outputSchema: { type: 'object', required: ['config', 'endpoints', 'artifacts'], properties: { config: { type: 'object' }, endpoints: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'serverless', 'api-gateway']
}));

export const databaseSetupTask = defineTask('dynamodb-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `DynamoDB Setup - ${args.projectName}`,
  agent: {
    name: 'dynamodb-specialist',
    prompt: {
      role: 'DynamoDB Specialist',
      task: 'Configure DynamoDB',
      context: args,
      instructions: ['1. Design table schema', '2. Configure partition keys', '3. Set up GSI/LSI', '4. Configure capacity', '5. Set up streams', '6. Create data models', '7. Implement access patterns', '8. Configure backup', '9. Set up TTL', '10. Document schema'],
      outputFormat: 'JSON with DynamoDB setup'
    },
    outputSchema: { type: 'object', required: ['tables', 'artifacts'], properties: { tables: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'serverless', 'dynamodb']
}));

export const authSetupTask = defineTask('cognito-auth', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cognito Auth - ${args.projectName}`,
  agent: {
    name: 'cognito-specialist',
    prompt: {
      role: 'AWS Cognito Specialist',
      task: 'Configure Cognito authentication',
      context: args,
      instructions: ['1. Create user pool', '2. Configure app client', '3. Set up identity pool', '4. Configure MFA', '5. Set up social providers', '6. Create Lambda triggers', '7. Configure custom auth', '8. Set up groups/roles', '9. Configure hosted UI', '10. Document auth'],
      outputFormat: 'JSON with auth setup'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'serverless', 'cognito', 'auth']
}));

export const infrastructureSetupTask = defineTask('serverless-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Infrastructure Setup - ${args.projectName}`,
  agent: {
    name: 'serverless-infrastructure-specialist',
    prompt: {
      role: 'Serverless Infrastructure Specialist',
      task: 'Configure infrastructure as code',
      context: args,
      instructions: ['1. Create serverless.yml', '2. Configure resources', '3. Set up IAM roles', '4. Configure VPC', '5. Set up S3 buckets', '6. Configure SQS/SNS', '7. Set up step functions', '8. Configure secrets', '9. Set up CI/CD', '10. Document IaC'],
      outputFormat: 'JSON with infrastructure'
    },
    outputSchema: { type: 'object', required: ['resources', 'artifacts'], properties: { resources: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'serverless', 'infrastructure']
}));

export const monitoringSetupTask = defineTask('serverless-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monitoring Setup - ${args.projectName}`,
  agent: {
    name: 'serverless-monitoring-specialist',
    prompt: {
      role: 'Serverless Monitoring Specialist',
      task: 'Configure monitoring',
      context: args,
      instructions: ['1. Set up CloudWatch', '2. Configure alarms', '3. Set up X-Ray tracing', '4. Configure logs', '5. Set up dashboards', '6. Configure metrics', '7. Set up Lumigo/Datadog', '8. Configure alerts', '9. Set up cost monitoring', '10. Document monitoring'],
      outputFormat: 'JSON with monitoring setup'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'serverless', 'monitoring']
}));

export const testingSetupTask = defineTask('serverless-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Serverless Testing - ${args.projectName}`,
  agent: {
    name: 'serverless-testing-specialist',
    prompt: {
      role: 'Serverless Testing Specialist',
      task: 'Set up testing',
      context: args,
      instructions: ['1. Configure Jest', '2. Set up local testing', '3. Create handler tests', '4. Mock AWS services', '5. Test integrations', '6. Set up DynamoDB local', '7. Test API Gateway', '8. Configure coverage', '9. Set up CI testing', '10. Document testing'],
      outputFormat: 'JSON with testing'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'serverless', 'testing']
}));

export const documentationTask = defineTask('serverless-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Serverless Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate serverless documentation',
      context: args,
      instructions: ['1. Create README', '2. Document architecture', '3. Create API documentation', '4. Document functions', '5. Create deployment guide', '6. Document authentication', '7. Create monitoring guide', '8. Document testing', '9. Create troubleshooting', '10. Generate cost guide'],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'serverless', 'documentation']
}));
