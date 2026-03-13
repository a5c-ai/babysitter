/**
 * @process specializations/code-migration-modernization/serverless-migration
 * @description Serverless Migration - Process for migrating applications from traditional server-based
 * architectures to serverless platforms (AWS Lambda, Azure Functions, Google Cloud Functions) with
 * proper function decomposition and cold start optimization.
 * @inputs { projectName: string, currentArchitecture?: object, targetPlatform?: string, functions?: array }
 * @outputs { success: boolean, migrationAnalysis: object, serverlessFunctions: array, deploymentConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/serverless-migration', {
 *   projectName: 'API Serverless Migration',
 *   currentArchitecture: { type: 'monolith', runtime: 'Node.js' },
 *   targetPlatform: 'AWS Lambda',
 *   functions: ['user-api', 'order-api', 'payment-api']
 * });
 *
 * @references
 * - AWS Lambda: https://aws.amazon.com/lambda/
 * - Serverless Framework: https://www.serverless.com/
 * - Serverless Patterns: https://www.serverlesspatterns.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    currentArchitecture = {},
    targetPlatform = 'AWS Lambda',
    functions = [],
    outputDir = 'serverless-migration-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Serverless Migration for ${projectName}`);

  // ============================================================================
  // PHASE 1: SERVERLESS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing serverless fit');
  const serverlessAssessment = await ctx.task(serverlessAssessmentTask, {
    projectName,
    currentArchitecture,
    targetPlatform,
    outputDir
  });

  artifacts.push(...serverlessAssessment.artifacts);

  // ============================================================================
  // PHASE 2: FUNCTION DECOMPOSITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Decomposing into functions');
  const functionDecomposition = await ctx.task(functionDecompositionTask, {
    projectName,
    serverlessAssessment,
    functions,
    outputDir
  });

  artifacts.push(...functionDecomposition.artifacts);

  // Breakpoint: Decomposition review
  await ctx.breakpoint({
    question: `Function decomposition complete for ${projectName}. Functions: ${functionDecomposition.functionCount}. Estimated cold start: ${functionDecomposition.estimatedColdStart}. Approve decomposition?`,
    title: 'Function Decomposition Review',
    context: {
      runId: ctx.runId,
      projectName,
      functionDecomposition,
      recommendation: 'Review function boundaries and granularity'
    }
  });

  // ============================================================================
  // PHASE 3: CODE REFACTORING
  // ============================================================================

  ctx.log('info', 'Phase 3: Refactoring for serverless');
  const codeRefactoring = await ctx.task(serverlessRefactoringTask, {
    projectName,
    functionDecomposition,
    targetPlatform,
    outputDir
  });

  artifacts.push(...codeRefactoring.artifacts);

  // ============================================================================
  // PHASE 4: INFRASTRUCTURE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up serverless infrastructure');
  const infrastructureSetup = await ctx.task(serverlessInfrastructureTask, {
    projectName,
    functionDecomposition,
    targetPlatform,
    outputDir
  });

  artifacts.push(...infrastructureSetup.artifacts);

  // ============================================================================
  // PHASE 5: DEPLOYMENT CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Configuring deployment');
  const deploymentConfig = await ctx.task(serverlessDeploymentConfigTask, {
    projectName,
    infrastructureSetup,
    functionDecomposition,
    outputDir
  });

  artifacts.push(...deploymentConfig.artifacts);

  // ============================================================================
  // PHASE 6: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Testing serverless functions');
  const testing = await ctx.task(serverlessTestingTask, {
    projectName,
    codeRefactoring,
    deploymentConfig,
    outputDir
  });

  artifacts.push(...testing.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Serverless migration complete for ${projectName}. Functions: ${functionDecomposition.functionCount}. Tests passing: ${testing.allPassed}. Approve?`,
    title: 'Serverless Migration Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        platform: targetPlatform,
        functions: functionDecomposition.functionCount,
        testsPass: testing.allPassed
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    migrationAnalysis: serverlessAssessment,
    serverlessFunctions: functionDecomposition.functions,
    deploymentConfig,
    testResults: {
      allPassed: testing.allPassed,
      passed: testing.passedCount,
      failed: testing.failedCount
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/serverless-migration',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const serverlessAssessmentTask = defineTask('serverless-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Serverless Assessment - ${args.projectName}`,
  agent: {
    name: 'serverless-analyst',
    prompt: {
      role: 'Cloud Architect',
      task: 'Assess serverless fit',
      context: args,
      instructions: [
        '1. Analyze current architecture',
        '2. Identify stateful components',
        '3. Assess execution duration',
        '4. Review memory requirements',
        '5. Identify cold start concerns',
        '6. Assess vendor lock-in',
        '7. Evaluate cost model',
        '8. Identify limitations',
        '9. Calculate readiness score',
        '10. Generate assessment report'
      ],
      outputFormat: 'JSON with readinessScore, concerns, limitations, costEstimate, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['readinessScore', 'concerns', 'artifacts'],
      properties: {
        readinessScore: { type: 'number' },
        concerns: { type: 'array', items: { type: 'object' } },
        limitations: { type: 'array', items: { type: 'string' } },
        costEstimate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['serverless-migration', 'assessment', 'analysis']
}));

export const functionDecompositionTask = defineTask('function-decomposition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Function Decomposition - ${args.projectName}`,
  agent: {
    name: 'decomposition-architect',
    prompt: {
      role: 'Serverless Architect',
      task: 'Decompose into serverless functions',
      context: args,
      instructions: [
        '1. Identify function boundaries',
        '2. Define single responsibilities',
        '3. Map triggers and events',
        '4. Design shared layers',
        '5. Plan cold start optimization',
        '6. Design error handling',
        '7. Plan retry strategies',
        '8. Document APIs',
        '9. Estimate cold start',
        '10. Generate decomposition plan'
      ],
      outputFormat: 'JSON with functionCount, functions, triggers, estimatedColdStart, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['functionCount', 'functions', 'estimatedColdStart', 'artifacts'],
      properties: {
        functionCount: { type: 'number' },
        functions: { type: 'array', items: { type: 'object' } },
        triggers: { type: 'array', items: { type: 'object' } },
        estimatedColdStart: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['serverless-migration', 'decomposition', 'functions']
}));

export const serverlessRefactoringTask = defineTask('serverless-refactoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Serverless Refactoring - ${args.projectName}`,
  agent: {
    name: 'serverless-developer',
    prompt: {
      role: 'Serverless Developer',
      task: 'Refactor code for serverless',
      context: args,
      instructions: [
        '1. Extract function handlers',
        '2. Optimize for cold start',
        '3. Externalize state',
        '4. Handle timeouts',
        '5. Implement idempotency',
        '6. Create shared layers',
        '7. Optimize dependencies',
        '8. Minimize package size',
        '9. Add logging',
        '10. Generate refactoring report'
      ],
      outputFormat: 'JSON with refactoredFunctions, optimizations, packageSizes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['refactoredFunctions', 'optimizations', 'artifacts'],
      properties: {
        refactoredFunctions: { type: 'number' },
        optimizations: { type: 'array', items: { type: 'string' } },
        packageSizes: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['serverless-migration', 'refactoring', 'code']
}));

export const serverlessInfrastructureTask = defineTask('serverless-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Serverless Infrastructure - ${args.projectName}`,
  agent: {
    name: 'infrastructure-engineer',
    prompt: {
      role: 'Infrastructure Engineer',
      task: 'Set up serverless infrastructure',
      context: args,
      instructions: [
        '1. Configure API Gateway',
        '2. Set up event sources',
        '3. Configure VPC if needed',
        '4. Set up IAM roles',
        '5. Configure triggers',
        '6. Set up layers',
        '7. Configure environment',
        '8. Set up monitoring',
        '9. Configure alarms',
        '10. Generate infrastructure report'
      ],
      outputFormat: 'JSON with apiGateway, eventSources, iamRoles, monitoring, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['apiGateway', 'eventSources', 'artifacts'],
      properties: {
        apiGateway: { type: 'object' },
        eventSources: { type: 'array', items: { type: 'object' } },
        iamRoles: { type: 'array', items: { type: 'object' } },
        monitoring: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['serverless-migration', 'infrastructure', 'setup']
}));

export const serverlessDeploymentConfigTask = defineTask('serverless-deployment-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Deployment Configuration - ${args.projectName}`,
  agent: {
    name: 'deployment-engineer',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Configure serverless deployment',
      context: args,
      instructions: [
        '1. Create serverless config',
        '2. Configure stages',
        '3. Set up CI/CD',
        '4. Configure canary deployment',
        '5. Set up rollback',
        '6. Configure versioning',
        '7. Set up aliases',
        '8. Configure provisioned concurrency',
        '9. Document deployment',
        '10. Generate deployment config'
      ],
      outputFormat: 'JSON with deploymentFramework, stages, cicdPipeline, canaryEnabled, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['deploymentFramework', 'stages', 'artifacts'],
      properties: {
        deploymentFramework: { type: 'string' },
        stages: { type: 'array', items: { type: 'string' } },
        cicdPipeline: { type: 'object' },
        canaryEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['serverless-migration', 'deployment', 'configuration']
}));

export const serverlessTestingTask = defineTask('serverless-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Serverless Testing - ${args.projectName}`,
  agent: {
    name: 'serverless-tester',
    prompt: {
      role: 'QA Engineer',
      task: 'Test serverless functions',
      context: args,
      instructions: [
        '1. Test locally',
        '2. Run unit tests',
        '3. Test integration',
        '4. Test cold start',
        '5. Test concurrency',
        '6. Test timeouts',
        '7. Test error handling',
        '8. Load testing',
        '9. Test monitoring',
        '10. Generate test report'
      ],
      outputFormat: 'JSON with allPassed, passedCount, failedCount, coldStartMetrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'passedCount', 'failedCount', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        passedCount: { type: 'number' },
        failedCount: { type: 'number' },
        coldStartMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['serverless-migration', 'testing', 'validation']
}));
