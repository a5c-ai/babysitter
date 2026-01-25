/**
 * @process Quantum-Classical Hybrid System Integration
 * @id QC-SW-002
 * @description Design and implement hybrid quantum-classical systems including job submission,
 * result processing, and iterative optimization workflows.
 * @category Quantum Computing - Software Engineering
 * @priority P1 - High
 * @inputs {{ application: object, backends: array, workflowType?: string }}
 * @outputs {{ success: boolean, hybridSystem: object, integrationTests: object, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('hybrid-system-integration', {
 *   application: { name: 'vqe-solver', type: 'variational' },
 *   backends: ['ibm_brisbane', 'simulator'],
 *   workflowType: 'iterative_optimization'
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    application,
    backends = ['simulator'],
    workflowType = 'iterative_optimization',
    retryPolicy = { maxRetries: 3, backoffFactor: 2 },
    resourceManagement = true,
    framework = 'qiskit',
    outputDir = 'hybrid-system-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Hybrid System Integration`);
  ctx.log('info', `Application: ${application.name}, Backends: ${backends.join(', ')}`);

  // ============================================================================
  // PHASE 1: HYBRID ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Hybrid Architecture Design');

  const architectureResult = await ctx.task(hybridArchitectureDesignTask, {
    application,
    backends,
    workflowType,
    framework
  });

  artifacts.push(...(architectureResult.artifacts || []));

  await ctx.breakpoint({
    question: `Hybrid architecture designed. Components: ${architectureResult.componentCount}, Workflow steps: ${architectureResult.workflowSteps}. Proceed with job pipeline implementation?`,
    title: 'Hybrid Architecture Review',
    context: {
      runId: ctx.runId,
      architecture: architectureResult,
      files: (architectureResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: JOB SUBMISSION PIPELINE
  // ============================================================================

  ctx.log('info', 'Phase 2: Job Submission Pipeline Implementation');

  const jobPipelineResult = await ctx.task(jobSubmissionPipelineTask, {
    architecture: architectureResult,
    backends,
    retryPolicy,
    framework
  });

  artifacts.push(...(jobPipelineResult.artifacts || []));

  ctx.log('info', `Job pipeline implemented with ${jobPipelineResult.queueStrategies.length} queue strategies`);

  // ============================================================================
  // PHASE 3: RESULT PROCESSING SYSTEM
  // ============================================================================

  ctx.log('info', 'Phase 3: Result Processing System');

  const resultProcessingResult = await ctx.task(resultProcessingSystemTask, {
    application,
    workflowType,
    framework
  });

  artifacts.push(...(resultProcessingResult.artifacts || []));

  // ============================================================================
  // PHASE 4: CLASSICAL OPTIMIZATION INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Classical Optimization Integration');

  const optimizationResult = await ctx.task(classicalOptimizationIntegrationTask, {
    application,
    workflowType,
    resultProcessor: resultProcessingResult,
    framework
  });

  artifacts.push(...(optimizationResult.artifacts || []));

  await ctx.breakpoint({
    question: `Optimization integration complete. Supported optimizers: ${optimizationResult.supportedOptimizers.length}. Review optimization pipeline?`,
    title: 'Optimization Integration Review',
    context: {
      runId: ctx.runId,
      optimization: optimizationResult,
      files: (optimizationResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 5: ERROR HANDLING AND RETRY LOGIC
  // ============================================================================

  ctx.log('info', 'Phase 5: Error Handling and Retry Logic');

  const errorHandlingResult = await ctx.task(errorHandlingRetryTask, {
    retryPolicy,
    backends,
    jobPipeline: jobPipelineResult
  });

  artifacts.push(...(errorHandlingResult.artifacts || []));

  // ============================================================================
  // PHASE 6: RESOURCE MANAGEMENT
  // ============================================================================

  let resourceResult = null;
  if (resourceManagement) {
    ctx.log('info', 'Phase 6: Resource Management Configuration');

    resourceResult = await ctx.task(resourceManagementTask, {
      backends,
      application,
      jobPipeline: jobPipelineResult
    });

    artifacts.push(...(resourceResult.artifacts || []));
  }

  // ============================================================================
  // PHASE 7: MONITORING AND LOGGING
  // ============================================================================

  ctx.log('info', 'Phase 7: Monitoring and Logging Setup');

  const monitoringResult = await ctx.task(monitoringLoggingSetupTask, {
    application,
    backends,
    jobPipeline: jobPipelineResult,
    resultProcessor: resultProcessingResult
  });

  artifacts.push(...(monitoringResult.artifacts || []));

  // ============================================================================
  // PHASE 8: INTEGRATION TESTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Integration Testing');

  const integrationTestResult = await ctx.task(hybridIntegrationTestingTask, {
    application,
    backends,
    hybridComponents: {
      architecture: architectureResult,
      jobPipeline: jobPipelineResult,
      resultProcessor: resultProcessingResult,
      optimization: optimizationResult
    },
    framework
  });

  artifacts.push(...(integrationTestResult.artifacts || []));

  await ctx.breakpoint({
    question: `Integration tests complete. Passed: ${integrationTestResult.passedTests}/${integrationTestResult.totalTests}. Review test results?`,
    title: 'Integration Testing Review',
    context: {
      runId: ctx.runId,
      tests: integrationTestResult,
      files: (integrationTestResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 9: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Documentation');

  const docResult = await ctx.task(hybridSystemDocumentationTask, {
    application,
    architectureResult,
    jobPipelineResult,
    resultProcessingResult,
    optimizationResult,
    errorHandlingResult,
    resourceResult,
    monitoringResult,
    integrationTestResult,
    outputDir
  });

  artifacts.push(...(docResult.artifacts || []));

  await ctx.breakpoint({
    question: `Hybrid system integration complete. Components: ${architectureResult.componentCount}, Tests passing: ${integrationTestResult.passedTests}. Approve system?`,
    title: 'Hybrid System Complete',
    context: {
      runId: ctx.runId,
      summary: {
        application: application.name,
        backends: backends.length,
        components: architectureResult.componentCount,
        testsPass: integrationTestResult.passedTests === integrationTestResult.totalTests
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    application: application.name,
    hybridSystem: {
      architecture: architectureResult.architecture,
      componentCount: architectureResult.componentCount,
      workflowType,
      backends
    },
    jobPipeline: {
      strategies: jobPipelineResult.queueStrategies,
      retryPolicy,
      errorHandling: errorHandlingResult.strategies
    },
    resultProcessing: resultProcessingResult.processingPipeline,
    optimization: optimizationResult.optimizationConfig,
    monitoring: monitoringResult.monitoringConfig,
    integrationTests: {
      total: integrationTestResult.totalTests,
      passed: integrationTestResult.passedTests,
      failed: integrationTestResult.failedTests
    },
    documentation: docResult.documentationPath,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-SW-002',
      processName: 'Quantum-Classical Hybrid System Integration',
      category: 'quantum-computing',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const hybridArchitectureDesignTask = defineTask('hybrid-architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hybrid Architecture Design',
  agent: {
    name: 'hybrid-system-architect',
    skills: ['braket-executor', 'pennylane-hybrid-executor', 'backend-selector'],
    prompt: {
      role: 'Hybrid System Architect',
      task: 'Design hybrid quantum-classical system architecture',
      context: args,
      instructions: [
        '1. Define system components',
        '2. Design quantum-classical interface',
        '3. Plan workflow orchestration',
        '4. Design data flow patterns',
        '5. Plan state management',
        '6. Design API interfaces',
        '7. Plan backend abstraction',
        '8. Design caching strategy',
        '9. Create architecture diagram',
        '10. Document design decisions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'componentCount', 'workflowSteps'],
      properties: {
        architecture: { type: 'object' },
        componentCount: { type: 'number' },
        workflowSteps: { type: 'number' },
        interfaces: { type: 'array' },
        dataFlow: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'hybrid', 'architecture']
}));

export const jobSubmissionPipelineTask = defineTask('hybrid-job-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Job Submission Pipeline',
  agent: {
    name: 'hybrid-system-architect',
    skills: ['braket-executor', 'pennylane-hybrid-executor', 'backend-selector'],
    prompt: {
      role: 'Quantum Job Management Specialist',
      task: 'Implement job submission pipeline for quantum backends',
      context: args,
      instructions: [
        '1. Design job queue system',
        '2. Implement job batching',
        '3. Handle job priorities',
        '4. Implement circuit transpilation',
        '5. Design job tracking',
        '6. Implement timeout handling',
        '7. Design callback system',
        '8. Implement job cancellation',
        '9. Add logging and monitoring',
        '10. Document pipeline usage'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['pipeline', 'queueStrategies'],
      properties: {
        pipeline: { type: 'object' },
        queueStrategies: { type: 'array' },
        batchingConfig: { type: 'object' },
        trackingSystem: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'hybrid', 'job-management']
}));

export const resultProcessingSystemTask = defineTask('hybrid-result-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Result Processing System',
  agent: {
    name: 'hybrid-system-architect',
    skills: ['braket-executor', 'pennylane-hybrid-executor', 'backend-selector'],
    prompt: {
      role: 'Quantum Result Processing Specialist',
      task: 'Implement result aggregation and post-processing system',
      context: args,
      instructions: [
        '1. Design result collection',
        '2. Implement result aggregation',
        '3. Apply error mitigation',
        '4. Calculate expectation values',
        '5. Implement statistical analysis',
        '6. Design result caching',
        '7. Implement result validation',
        '8. Design result transformation',
        '9. Add result visualization',
        '10. Document processing pipeline'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['processingPipeline'],
      properties: {
        processingPipeline: { type: 'object' },
        aggregationMethods: { type: 'array' },
        mitigationStrategies: { type: 'array' },
        validationRules: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'hybrid', 'result-processing']
}));

export const classicalOptimizationIntegrationTask = defineTask('hybrid-optimization-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classical Optimization Integration',
  agent: {
    name: 'hybrid-system-architect',
    skills: ['braket-executor', 'pennylane-hybrid-executor', 'backend-selector'],
    prompt: {
      role: 'Hybrid Optimization Specialist',
      task: 'Integrate classical optimization with quantum execution',
      context: args,
      instructions: [
        '1. Design optimization loop',
        '2. Integrate classical optimizers',
        '3. Implement gradient computation',
        '4. Design convergence checking',
        '5. Implement parameter management',
        '6. Add callback hooks',
        '7. Implement early stopping',
        '8. Design checkpointing',
        '9. Add optimization history',
        '10. Document integration'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizationConfig', 'supportedOptimizers'],
      properties: {
        optimizationConfig: { type: 'object' },
        supportedOptimizers: { type: 'array' },
        gradientMethods: { type: 'array' },
        convergenceCriteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'hybrid', 'optimization']
}));

export const errorHandlingRetryTask = defineTask('hybrid-error-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Error Handling and Retry Logic',
  agent: {
    name: 'hybrid-system-architect',
    skills: ['braket-executor', 'pennylane-hybrid-executor', 'backend-selector'],
    prompt: {
      role: 'Fault Tolerance Specialist',
      task: 'Implement error handling and retry mechanisms',
      context: args,
      instructions: [
        '1. Classify error types',
        '2. Implement retry logic',
        '3. Design backoff strategies',
        '4. Handle transient failures',
        '5. Implement circuit breakers',
        '6. Design fallback mechanisms',
        '7. Add error logging',
        '8. Implement alerting',
        '9. Design recovery procedures',
        '10. Document error handling'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'errorClassification'],
      properties: {
        strategies: { type: 'array' },
        errorClassification: { type: 'object' },
        retryConfig: { type: 'object' },
        circuitBreakers: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'hybrid', 'error-handling']
}));

export const resourceManagementTask = defineTask('hybrid-resource-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Resource Management Configuration',
  agent: {
    name: 'hybrid-system-architect',
    skills: ['braket-executor', 'pennylane-hybrid-executor', 'backend-selector'],
    prompt: {
      role: 'Resource Management Specialist',
      task: 'Configure resource management for hybrid system',
      context: args,
      instructions: [
        '1. Design quota management',
        '2. Implement cost tracking',
        '3. Configure rate limiting',
        '4. Design load balancing',
        '5. Implement backend selection',
        '6. Add usage monitoring',
        '7. Design capacity planning',
        '8. Implement scheduling',
        '9. Add billing integration',
        '10. Document resource management'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['resourceConfig'],
      properties: {
        resourceConfig: { type: 'object' },
        quotaManagement: { type: 'object' },
        costTracking: { type: 'object' },
        loadBalancing: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'hybrid', 'resources']
}));

export const monitoringLoggingSetupTask = defineTask('hybrid-monitoring-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitoring and Logging Setup',
  agent: {
    name: 'hybrid-system-architect',
    skills: ['braket-executor', 'pennylane-hybrid-executor', 'backend-selector'],
    prompt: {
      role: 'Observability Specialist',
      task: 'Set up monitoring and logging for hybrid system',
      context: args,
      instructions: [
        '1. Configure logging framework',
        '2. Set up metrics collection',
        '3. Design dashboards',
        '4. Implement tracing',
        '5. Configure alerting',
        '6. Add performance monitoring',
        '7. Set up audit logging',
        '8. Implement health checks',
        '9. Configure log aggregation',
        '10. Document monitoring setup'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoringConfig'],
      properties: {
        monitoringConfig: { type: 'object' },
        loggingConfig: { type: 'object' },
        metricsConfig: { type: 'object' },
        alertingConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'hybrid', 'monitoring']
}));

export const hybridIntegrationTestingTask = defineTask('hybrid-integration-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hybrid Integration Testing',
  agent: {
    name: 'hybrid-system-architect',
    skills: ['braket-executor', 'pennylane-hybrid-executor', 'backend-selector'],
    prompt: {
      role: 'Integration Testing Specialist',
      task: 'Test hybrid system integration',
      context: args,
      instructions: [
        '1. Test job submission flow',
        '2. Test result processing',
        '3. Test optimization loop',
        '4. Test error handling',
        '5. Test retry mechanisms',
        '6. Test monitoring',
        '7. Test end-to-end workflow',
        '8. Test backend switching',
        '9. Generate test report',
        '10. Document test results'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'passedTests', 'failedTests'],
      properties: {
        totalTests: { type: 'number' },
        passedTests: { type: 'number' },
        failedTests: { type: 'number' },
        testResults: { type: 'array' },
        testReport: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'hybrid', 'testing']
}));

export const hybridSystemDocumentationTask = defineTask('hybrid-system-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hybrid System Documentation',
  agent: {
    name: 'hybrid-system-architect',
    skills: ['braket-executor', 'pennylane-hybrid-executor', 'backend-selector'],
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive hybrid system documentation',
      context: args,
      instructions: [
        '1. Document architecture',
        '2. Document APIs',
        '3. Document workflows',
        '4. Add usage examples',
        '5. Document configuration',
        '6. Add troubleshooting guide',
        '7. Document best practices',
        '8. Add performance guide',
        '9. Include diagrams',
        '10. Generate final documentation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationPath'],
      properties: {
        documentationPath: { type: 'string' },
        apiDocsPath: { type: 'string' },
        tutorialsPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'hybrid', 'documentation']
}));
