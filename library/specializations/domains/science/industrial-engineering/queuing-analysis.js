/**
 * @process domains/science/industrial-engineering/queuing-analysis
 * @description Queuing System Analysis - Analyze queuing systems to optimize service capacity, reduce wait times,
 * and improve customer satisfaction using queuing theory and simulation.
 * @inputs { systemDescription: string, arrivalRate?: number, serviceRate?: number, servers?: number, queueModel?: string }
 * @outputs { success: boolean, performanceMetrics: object, staffingRecommendations: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/queuing-analysis', {
 *   systemDescription: 'Customer service call center with multiple agents',
 *   arrivalRate: 100,
 *   serviceRate: 12,
 *   servers: 10,
 *   queueModel: 'M/M/c'
 * });
 *
 * @references
 * - Gross & Harris, Fundamentals of Queueing Theory
 * - Hillier & Lieberman, Introduction to Operations Research (Queuing chapters)
 * - Taha, Operations Research: An Introduction
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemDescription,
    arrivalRate = null,
    serviceRate = null,
    servers = 1,
    queueModel = 'auto',
    targetServiceLevel = 0.80,
    maxWaitTime = 60,
    outputDir = 'queuing-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Queuing System Analysis process');

  // Task 1: System Characterization
  ctx.log('info', 'Phase 1: Characterizing queuing system');
  const systemCharacterization = await ctx.task(systemCharacterizationTask, {
    systemDescription,
    arrivalRate,
    serviceRate,
    servers,
    outputDir
  });

  artifacts.push(...systemCharacterization.artifacts);

  // Task 2: Data Analysis
  ctx.log('info', 'Phase 2: Analyzing arrival and service patterns');
  const dataAnalysis = await ctx.task(dataAnalysisTask, {
    systemCharacterization,
    outputDir
  });

  artifacts.push(...dataAnalysis.artifacts);

  // Task 3: Model Selection
  ctx.log('info', 'Phase 3: Selecting appropriate queuing model');
  const modelSelection = await ctx.task(modelSelectionTask, {
    systemCharacterization,
    dataAnalysis,
    queueModel,
    outputDir
  });

  artifacts.push(...modelSelection.artifacts);

  // Breakpoint: Review model selection
  await ctx.breakpoint({
    question: `Queuing model selected: ${modelSelection.selectedModel}. Traffic intensity: ${modelSelection.trafficIntensity.toFixed(2)}. Review before analysis?`,
    title: 'Queuing Model Review',
    context: {
      runId: ctx.runId,
      selectedModel: modelSelection.selectedModel,
      trafficIntensity: modelSelection.trafficIntensity,
      systemStable: modelSelection.systemStable,
      files: modelSelection.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 4: Performance Calculation
  ctx.log('info', 'Phase 4: Calculating performance metrics');
  const performanceCalculation = await ctx.task(performanceCalculationTask, {
    modelSelection,
    outputDir
  });

  artifacts.push(...performanceCalculation.artifacts);

  // Task 5: Simulation (if needed for complex systems)
  let simulationResults = null;
  if (modelSelection.requiresSimulation) {
    ctx.log('info', 'Phase 5: Running simulation for complex system');
    simulationResults = await ctx.task(simulationTask, {
      systemCharacterization,
      dataAnalysis,
      performanceCalculation,
      outputDir
    });
    artifacts.push(...simulationResults.artifacts);
  }

  // Task 6: Staffing Analysis
  ctx.log('info', 'Phase 6: Analyzing staffing scenarios');
  const staffingAnalysis = await ctx.task(staffingAnalysisTask, {
    modelSelection,
    performanceCalculation,
    simulationResults,
    targetServiceLevel,
    maxWaitTime,
    outputDir
  });

  artifacts.push(...staffingAnalysis.artifacts);

  // Task 7: Recommendations
  ctx.log('info', 'Phase 7: Generating recommendations');
  const recommendations = await ctx.task(recommendationsTask, {
    systemCharacterization,
    performanceCalculation,
    staffingAnalysis,
    outputDir
  });

  artifacts.push(...recommendations.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Queuing analysis complete. Recommended servers: ${staffingAnalysis.recommendedServers}. Expected wait time: ${performanceCalculation.avgWaitTime.toFixed(1)} min. Review recommendations?`,
    title: 'Queuing Analysis Results',
    context: {
      runId: ctx.runId,
      summary: {
        currentServers: servers,
        recommendedServers: staffingAnalysis.recommendedServers,
        avgWaitTime: performanceCalculation.avgWaitTime,
        avgQueueLength: performanceCalculation.avgQueueLength,
        utilization: performanceCalculation.utilization,
        serviceLevel: staffingAnalysis.achievedServiceLevel
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    performanceMetrics: {
      avgWaitTime: performanceCalculation.avgWaitTime,
      avgSystemTime: performanceCalculation.avgSystemTime,
      avgQueueLength: performanceCalculation.avgQueueLength,
      avgSystemLength: performanceCalculation.avgSystemLength,
      utilization: performanceCalculation.utilization,
      probabilityOfWaiting: performanceCalculation.probabilityOfWaiting
    },
    staffingRecommendations: {
      currentServers: servers,
      recommendedServers: staffingAnalysis.recommendedServers,
      achievedServiceLevel: staffingAnalysis.achievedServiceLevel,
      costBenefitAnalysis: staffingAnalysis.costBenefitAnalysis
    },
    recommendations: recommendations.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/queuing-analysis',
      timestamp: startTime,
      modelUsed: modelSelection.selectedModel,
      outputDir
    }
  };
}

// Task 1: System Characterization
export const systemCharacterizationTask = defineTask('system-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize queuing system',
  agent: {
    name: 'queuing-analyst',
    prompt: {
      role: 'Queuing System Analyst',
      task: 'Characterize the queuing system structure and parameters',
      context: args,
      instructions: [
        '1. Identify customer arrival process characteristics',
        '2. Identify service process characteristics',
        '3. Determine number of servers and configuration',
        '4. Identify queue discipline (FIFO, priority, etc.)',
        '5. Determine system capacity (finite/infinite)',
        '6. Identify customer population (finite/infinite)',
        '7. Document service channels and phases',
        '8. Create system characterization document'
      ],
      outputFormat: 'JSON with system parameters and characteristics'
    },
    outputSchema: {
      type: 'object',
      required: ['arrivalProcess', 'serviceProcess', 'servers', 'queueDiscipline', 'artifacts'],
      properties: {
        arrivalProcess: { type: 'object' },
        serviceProcess: { type: 'object' },
        servers: { type: 'number' },
        queueDiscipline: { type: 'string' },
        systemCapacity: { type: 'string' },
        populationSize: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'queuing', 'characterization']
}));

// Task 2: Data Analysis
export const dataAnalysisTask = defineTask('data-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze arrival and service patterns',
  agent: {
    name: 'statistical-analyst',
    prompt: {
      role: 'Statistical Analyst',
      task: 'Analyze arrival and service time data statistically',
      context: args,
      instructions: [
        '1. Analyze interarrival time distribution',
        '2. Test for Poisson arrival process',
        '3. Analyze service time distribution',
        '4. Test for exponential service times',
        '5. Calculate arrival rate (lambda)',
        '6. Calculate service rate (mu)',
        '7. Identify time-varying patterns',
        '8. Document statistical analysis'
      ],
      outputFormat: 'JSON with statistical analysis of arrival and service patterns'
    },
    outputSchema: {
      type: 'object',
      required: ['arrivalRate', 'serviceRate', 'distributionFit', 'artifacts'],
      properties: {
        arrivalRate: { type: 'number' },
        serviceRate: { type: 'number' },
        arrivalDistribution: { type: 'object' },
        serviceDistribution: { type: 'object' },
        distributionFit: { type: 'object' },
        timeVaryingPatterns: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'queuing', 'data-analysis']
}));

// Task 3: Model Selection
export const modelSelectionTask = defineTask('model-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select appropriate queuing model',
  agent: {
    name: 'queuing-modeler',
    prompt: {
      role: 'Queuing Theory Expert',
      task: 'Select the most appropriate queuing model for the system',
      context: args,
      instructions: [
        '1. Evaluate M/M/1 model applicability',
        '2. Evaluate M/M/c model applicability',
        '3. Evaluate M/G/1 model applicability',
        '4. Evaluate G/G/c model applicability',
        '5. Consider finite capacity models',
        '6. Calculate traffic intensity (rho)',
        '7. Check system stability condition',
        '8. Document model selection rationale'
      ],
      outputFormat: 'JSON with selected model and rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedModel', 'trafficIntensity', 'systemStable', 'artifacts'],
      properties: {
        selectedModel: { type: 'string' },
        kendallNotation: { type: 'string' },
        trafficIntensity: { type: 'number' },
        systemStable: { type: 'boolean' },
        modelAssumptions: { type: 'array' },
        requiresSimulation: { type: 'boolean' },
        selectionRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'queuing', 'model-selection']
}));

// Task 4: Performance Calculation
export const performanceCalculationTask = defineTask('performance-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate performance metrics',
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'Operations Research Analyst',
      task: 'Calculate steady-state performance measures',
      context: args,
      instructions: [
        '1. Calculate average queue length (Lq)',
        '2. Calculate average system length (L)',
        '3. Calculate average wait time (Wq)',
        '4. Calculate average system time (W)',
        '5. Calculate server utilization',
        '6. Calculate probability of waiting',
        '7. Calculate probability of n in system',
        '8. Document all calculations'
      ],
      outputFormat: 'JSON with all performance metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['avgWaitTime', 'avgSystemTime', 'avgQueueLength', 'avgSystemLength', 'utilization', 'artifacts'],
      properties: {
        avgWaitTime: { type: 'number' },
        avgSystemTime: { type: 'number' },
        avgQueueLength: { type: 'number' },
        avgSystemLength: { type: 'number' },
        utilization: { type: 'number' },
        probabilityOfWaiting: { type: 'number' },
        probabilityDistribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'queuing', 'performance']
}));

// Task 5: Simulation
export const simulationTask = defineTask('simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run queuing simulation',
  agent: {
    name: 'simulation-engineer',
    prompt: {
      role: 'Simulation Engineer',
      task: 'Run simulation for complex queuing system',
      context: args,
      instructions: [
        '1. Build simulation model of queuing system',
        '2. Set up warm-up period',
        '3. Run multiple replications',
        '4. Collect performance statistics',
        '5. Calculate confidence intervals',
        '6. Validate against analytical results',
        '7. Analyze time-varying behavior',
        '8. Generate simulation report'
      ],
      outputFormat: 'JSON with simulation results and confidence intervals'
    },
    outputSchema: {
      type: 'object',
      required: ['simulationResults', 'confidenceIntervals', 'artifacts'],
      properties: {
        simulationResults: { type: 'object' },
        confidenceIntervals: { type: 'object' },
        validationResults: { type: 'object' },
        timeVaryingAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'queuing', 'simulation']
}));

// Task 6: Staffing Analysis
export const staffingAnalysisTask = defineTask('staffing-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze staffing scenarios',
  agent: {
    name: 'capacity-planner',
    prompt: {
      role: 'Capacity Planning Analyst',
      task: 'Analyze staffing scenarios and service level tradeoffs',
      context: args,
      instructions: [
        '1. Calculate performance for different server counts',
        '2. Identify minimum servers for stability',
        '3. Calculate service level for each scenario',
        '4. Apply Erlang C formula for call centers',
        '5. Evaluate cost vs. service level tradeoff',
        '6. Identify optimal staffing level',
        '7. Analyze peak period requirements',
        '8. Generate staffing recommendation'
      ],
      outputFormat: 'JSON with staffing analysis and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedServers', 'achievedServiceLevel', 'staffingScenarios', 'artifacts'],
      properties: {
        recommendedServers: { type: 'number' },
        achievedServiceLevel: { type: 'number' },
        staffingScenarios: { type: 'array' },
        costBenefitAnalysis: { type: 'object' },
        peakRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'queuing', 'staffing']
}));

// Task 7: Recommendations
export const recommendationsTask = defineTask('recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate recommendations',
  agent: {
    name: 'queuing-consultant',
    prompt: {
      role: 'Operations Consultant',
      task: 'Generate actionable recommendations from queuing analysis',
      context: args,
      instructions: [
        '1. Summarize key performance findings',
        '2. Recommend optimal capacity configuration',
        '3. Identify improvement opportunities',
        '4. Suggest queue management strategies',
        '5. Recommend monitoring metrics',
        '6. Discuss implementation approach',
        '7. Identify risks and contingencies',
        '8. Generate executive report'
      ],
      outputFormat: 'JSON with recommendations and implementation guidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'implementationPlan', 'reportPath', 'artifacts'],
      properties: {
        recommendations: { type: 'array', items: { type: 'string' } },
        implementationPlan: { type: 'array' },
        monitoringMetrics: { type: 'array' },
        risks: { type: 'array' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'queuing', 'recommendations']
}));
