/**
 * @process chemical-engineering/performance-testing-validation
 * @description Design and execute performance tests to validate process performance against design specifications
 * @inputs { processName: string, designSpecifications: object, performanceGuarantees: object, outputDir: string }
 * @outputs { success: boolean, testProtocol: object, testResults: object, performanceCertificate: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    designSpecifications,
    performanceGuarantees,
    testConditions = {},
    outputDir = 'performance-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Define Performance Test Objectives
  ctx.log('info', 'Starting performance testing: Defining test objectives');
  const objectivesResult = await ctx.task(testObjectivesTask, {
    processName,
    designSpecifications,
    performanceGuarantees,
    outputDir
  });

  if (!objectivesResult.success) {
    return {
      success: false,
      error: 'Test objectives definition failed',
      details: objectivesResult,
      metadata: { processId: 'chemical-engineering/performance-testing-validation', timestamp: startTime }
    };
  }

  artifacts.push(...objectivesResult.artifacts);

  // Task 2: Develop Test Protocol
  ctx.log('info', 'Developing test protocol');
  const protocolResult = await ctx.task(testProtocolTask, {
    processName,
    testObjectives: objectivesResult.objectives,
    designSpecifications,
    testConditions,
    outputDir
  });

  artifacts.push(...protocolResult.artifacts);

  // Task 3: Prepare Instrumentation and Data Collection
  ctx.log('info', 'Preparing instrumentation and data collection');
  const instrumentationResult = await ctx.task(instrumentationPreparationTask, {
    processName,
    testProtocol: protocolResult.protocol,
    outputDir
  });

  artifacts.push(...instrumentationResult.artifacts);

  // Task 4: Execute Performance Tests
  ctx.log('info', 'Executing performance tests');
  const executionResult = await ctx.task(testExecutionTask, {
    processName,
    testProtocol: protocolResult.protocol,
    instrumentation: instrumentationResult.setup,
    outputDir
  });

  artifacts.push(...executionResult.artifacts);

  // Task 5: Analyze Results vs. Specifications
  ctx.log('info', 'Analyzing results vs. specifications');
  const analysisResult = await ctx.task(resultsAnalysisTask, {
    processName,
    testResults: executionResult.results,
    designSpecifications,
    performanceGuarantees,
    outputDir
  });

  artifacts.push(...analysisResult.artifacts);

  // Breakpoint: Review performance test results
  await ctx.breakpoint({
    question: `Performance testing complete for ${processName}. Tests passed: ${analysisResult.analysis.passedCount}/${analysisResult.analysis.totalTests}. All guarantees met: ${analysisResult.analysis.allGuaranteesMet}. Review results?`,
    title: 'Performance Testing Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalTests: analysisResult.analysis.totalTests,
        passedTests: analysisResult.analysis.passedCount,
        failedTests: analysisResult.analysis.failedCount,
        allGuaranteesMet: analysisResult.analysis.allGuaranteesMet
      }
    }
  });

  // Task 6: Document Performance Guarantees
  ctx.log('info', 'Documenting performance guarantees');
  const certificateResult = await ctx.task(performanceCertificateTask, {
    processName,
    testResults: executionResult.results,
    analysis: analysisResult.analysis,
    performanceGuarantees,
    outputDir
  });

  artifacts.push(...certificateResult.artifacts);

  // Task 7: Generate Optimization Recommendations
  ctx.log('info', 'Generating optimization recommendations');
  const optimizationResult = await ctx.task(optimizationRecommendationsTask, {
    processName,
    testResults: executionResult.results,
    analysis: analysisResult.analysis,
    designSpecifications,
    outputDir
  });

  artifacts.push(...optimizationResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    testProtocol: protocolResult.protocol,
    testResults: executionResult.results,
    performanceCertificate: certificateResult.certificate,
    optimizationRecommendations: optimizationResult.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/performance-testing-validation',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Test Objectives Definition
export const testObjectivesTask = defineTask('test-objectives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define performance test objectives',
  agent: {
    name: 'performance-test-engineer',
    prompt: {
      role: 'performance test planner',
      task: 'Define performance test objectives and success criteria',
      context: args,
      instructions: [
        'Review design specifications',
        'Review performance guarantees',
        'Define test objectives',
        'Define key performance parameters',
        'Define acceptance criteria',
        'Identify test conditions',
        'Define pass/fail criteria',
        'Document test objectives'
      ],
      outputFormat: 'JSON with test objectives, parameters, acceptance criteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'objectives', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        objectives: {
          type: 'object',
          properties: {
            testObjectives: { type: 'array' },
            keyParameters: { type: 'array' },
            acceptanceCriteria: { type: 'object' },
            testConditions: { type: 'object' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'performance-testing', 'objectives']
}));

// Task 2: Test Protocol Development
export const testProtocolTask = defineTask('test-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop test protocol',
  agent: {
    name: 'performance-test-engineer',
    prompt: {
      role: 'test protocol developer',
      task: 'Develop detailed performance test protocol',
      context: args,
      instructions: [
        'Define test duration and phases',
        'Specify operating conditions for testing',
        'Define measurement points and frequencies',
        'Specify sampling procedures',
        'Define data recording requirements',
        'Include witness/verification requirements',
        'Define abort criteria',
        'Create test protocol document'
      ],
      outputFormat: 'JSON with test protocol, procedures, requirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'protocol', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        protocol: {
          type: 'object',
          properties: {
            duration: { type: 'number' },
            phases: { type: 'array' },
            operatingConditions: { type: 'object' },
            measurements: { type: 'array' },
            samplingProcedures: { type: 'array' },
            witnessRequirements: { type: 'object' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'performance-testing', 'protocol']
}));

// Task 3: Instrumentation Preparation
export const instrumentationPreparationTask = defineTask('instrumentation-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare instrumentation and data collection',
  agent: {
    name: 'performance-test-engineer',
    prompt: {
      role: 'test instrumentation engineer',
      task: 'Prepare instrumentation for performance testing',
      context: args,
      instructions: [
        'Identify required measurements',
        'Verify instrument calibration',
        'Install temporary test instruments if needed',
        'Set up data acquisition system',
        'Configure data logging',
        'Verify measurement accuracy',
        'Prepare sample collection',
        'Document instrumentation setup'
      ],
      outputFormat: 'JSON with instrumentation setup, calibration status, data collection, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'setup', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        setup: {
          type: 'object',
          properties: {
            instruments: { type: 'array' },
            calibrationStatus: { type: 'object' },
            dataAcquisition: { type: 'object' },
            sampleCollection: { type: 'object' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'performance-testing', 'instrumentation']
}));

// Task 4: Test Execution
export const testExecutionTask = defineTask('test-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute performance tests',
  agent: {
    name: 'performance-test-engineer',
    prompt: {
      role: 'performance test executor',
      task: 'Execute performance tests per protocol',
      context: args,
      instructions: [
        'Verify pre-test conditions',
        'Execute test per protocol',
        'Record all measurements',
        'Document deviations from protocol',
        'Collect samples per schedule',
        'Monitor test progress',
        'Document observations',
        'Compile raw test data'
      ],
      outputFormat: 'JSON with test results, raw data, observations, deviations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'results', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        results: {
          type: 'object',
          properties: {
            rawData: { type: 'object' },
            measurements: { type: 'array' },
            observations: { type: 'array' },
            deviations: { type: 'array' },
            testDuration: { type: 'number' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'performance-testing', 'execution']
}));

// Task 5: Results Analysis
export const resultsAnalysisTask = defineTask('results-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze results vs. specifications',
  agent: {
    name: 'performance-test-engineer',
    prompt: {
      role: 'performance results analyst',
      task: 'Analyze test results against specifications',
      context: args,
      instructions: [
        'Calculate performance metrics from raw data',
        'Compare with design specifications',
        'Compare with performance guarantees',
        'Determine pass/fail for each parameter',
        'Analyze variance from targets',
        'Perform uncertainty analysis',
        'Identify any outliers',
        'Document analysis results'
      ],
      outputFormat: 'JSON with analysis results, pass/fail status, variance analysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'analysis', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        analysis: {
          type: 'object',
          properties: {
            totalTests: { type: 'number' },
            passedCount: { type: 'number' },
            failedCount: { type: 'number' },
            allGuaranteesMet: { type: 'boolean' },
            results: { type: 'array' },
            varianceAnalysis: { type: 'object' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'performance-testing', 'analysis']
}));

// Task 6: Performance Certificate
export const performanceCertificateTask = defineTask('performance-certificate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document performance guarantees',
  agent: {
    name: 'performance-test-engineer',
    prompt: {
      role: 'performance certificate generator',
      task: 'Generate performance test certificate',
      context: args,
      instructions: [
        'Summarize test conditions',
        'Document achieved performance',
        'Compare with guaranteed values',
        'State pass/fail determination',
        'Document any exceptions or conditions',
        'Include witness signatures',
        'Generate certificate document',
        'Archive test records'
      ],
      outputFormat: 'JSON with performance certificate, summary, sign-off, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'certificate', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        certificate: {
          type: 'object',
          properties: {
            certificatePath: { type: 'string' },
            testDate: { type: 'string' },
            achievedPerformance: { type: 'object' },
            guaranteedPerformance: { type: 'object' },
            overallResult: { type: 'string' },
            exceptions: { type: 'array' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'performance-testing', 'certificate']
}));

// Task 7: Optimization Recommendations
export const optimizationRecommendationsTask = defineTask('optimization-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate optimization recommendations',
  agent: {
    name: 'performance-test-engineer',
    prompt: {
      role: 'performance optimization engineer',
      task: 'Generate recommendations for performance optimization',
      context: args,
      instructions: [
        'Identify performance gaps',
        'Analyze root causes of deviations',
        'Identify optimization opportunities',
        'Recommend operating adjustments',
        'Recommend equipment modifications',
        'Prioritize recommendations',
        'Estimate improvement potential',
        'Document recommendations'
      ],
      outputFormat: 'JSON with optimization recommendations, priorities, expected improvements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'recommendations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              expectedImprovement: { type: 'string' },
              implementation: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'performance-testing', 'optimization']
}));
