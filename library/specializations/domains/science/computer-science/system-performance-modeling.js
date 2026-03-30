/**
 * @process computer-science/system-performance-modeling
 * @description Build analytical models to predict and analyze system performance using queuing theory and Markov models
 * @inputs { systemDescription: string, workloadCharacteristics: object, performanceGoals: array }
 * @outputs { success: boolean, performanceModel: object, bottleneckAnalysis: object, capacityRecommendations: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemDescription,
    workloadCharacteristics = {},
    performanceGoals = [],
    modelingApproach = 'queuing',
    outputDir = 'performance-modeling-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting System Performance Modeling');

  // ============================================================================
  // PHASE 1: SYSTEM COMPONENT DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining system components and interactions');
  const systemDefinition = await ctx.task(systemComponentDefinitionTask, {
    systemDescription,
    outputDir
  });

  artifacts.push(...systemDefinition.artifacts);

  // ============================================================================
  // PHASE 2: WORKLOAD CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Characterizing workload');
  const workloadModel = await ctx.task(workloadCharacterizationTask, {
    systemDescription,
    workloadCharacteristics,
    systemDefinition,
    outputDir
  });

  artifacts.push(...workloadModel.artifacts);

  // ============================================================================
  // PHASE 3: QUEUING MODEL CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Constructing queuing theory model');
  const queuingModel = await ctx.task(queuingModelConstructionTask, {
    systemDescription,
    systemDefinition,
    workloadModel,
    modelingApproach,
    outputDir
  });

  artifacts.push(...queuingModel.artifacts);

  // ============================================================================
  // PHASE 4: MARKOV MODEL CONSTRUCTION (IF APPLICABLE)
  // ============================================================================

  ctx.log('info', 'Phase 4: Constructing Markov model if applicable');
  const markovModel = await ctx.task(markovModelConstructionTask, {
    systemDescription,
    systemDefinition,
    workloadModel,
    modelingApproach,
    outputDir
  });

  artifacts.push(...markovModel.artifacts);

  // ============================================================================
  // PHASE 5: BOTTLENECK ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying bottlenecks via analysis');
  const bottleneckAnalysis = await ctx.task(bottleneckAnalysisTask, {
    systemDescription,
    systemDefinition,
    queuingModel,
    markovModel,
    outputDir
  });

  artifacts.push(...bottleneckAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: MODEL VALIDATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 6: Planning model validation against empirical data');
  const validationPlan = await ctx.task(modelValidationPlanTask, {
    systemDescription,
    queuingModel,
    markovModel,
    outputDir
  });

  artifacts.push(...validationPlan.artifacts);

  // ============================================================================
  // PHASE 7: PERFORMANCE PREDICTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Predicting performance under varying conditions');
  const performancePrediction = await ctx.task(performancePredictionTask, {
    systemDescription,
    queuingModel,
    markovModel,
    performanceGoals,
    outputDir
  });

  artifacts.push(...performancePrediction.artifacts);

  // ============================================================================
  // PHASE 8: CAPACITY PLANNING RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating capacity planning recommendations');
  const capacityPlanning = await ctx.task(capacityPlanningTask, {
    systemDescription,
    bottleneckAnalysis,
    performancePrediction,
    performanceGoals,
    outputDir
  });

  artifacts.push(...capacityPlanning.artifacts);

  // ============================================================================
  // PHASE 9: PERFORMANCE MODEL DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating performance model documentation');
  const modelDocumentation = await ctx.task(performanceModelDocumentationTask, {
    systemDescription,
    systemDefinition,
    workloadModel,
    queuingModel,
    markovModel,
    bottleneckAnalysis,
    performancePrediction,
    capacityPlanning,
    outputDir
  });

  artifacts.push(...modelDocumentation.artifacts);

  // Breakpoint: Review performance model
  await ctx.breakpoint({
    question: `Performance model complete. Primary bottleneck: ${bottleneckAnalysis.primaryBottleneck}. Review model and recommendations?`,
    title: 'System Performance Model Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        modelType: queuingModel.modelType,
        primaryBottleneck: bottleneckAnalysis.primaryBottleneck,
        predictedThroughput: performancePrediction.predictedThroughput,
        recommendations: capacityPlanning.recommendations?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemDescription,
    performanceModel: {
      systemComponents: systemDefinition.components,
      workloadModel: workloadModel.model,
      queuingModel: queuingModel.model,
      markovModel: markovModel.model,
      documentationPath: modelDocumentation.documentPath
    },
    bottleneckAnalysis: {
      primaryBottleneck: bottleneckAnalysis.primaryBottleneck,
      secondaryBottlenecks: bottleneckAnalysis.secondaryBottlenecks,
      utilizationAnalysis: bottleneckAnalysis.utilizationAnalysis
    },
    performancePredictions: {
      predictedThroughput: performancePrediction.predictedThroughput,
      predictedLatency: performancePrediction.predictedLatency,
      scalingAnalysis: performancePrediction.scalingAnalysis
    },
    capacityRecommendations: {
      recommendations: capacityPlanning.recommendations,
      scalingStrategy: capacityPlanning.scalingStrategy,
      costAnalysis: capacityPlanning.costAnalysis
    },
    validationPlan: validationPlan.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/system-performance-modeling',
      timestamp: startTime,
      modelingApproach,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: System Component Definition
export const systemComponentDefinitionTask = defineTask('system-component-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define system components and interactions',
  agent: {
    name: 'systems-engineer',
    skills: ['asymptotic-notation-calculator', 'cache-simulator', 'memory-hierarchy-modeler'],
    prompt: {
      role: 'system performance architect',
      task: 'Define system components and their interactions for performance modeling',
      context: args,
      instructions: [
        'Identify all system components (servers, queues, resources)',
        'Map interactions and dependencies between components',
        'Identify service centers and routing',
        'Document resource capacities',
        'Identify synchronization points',
        'Create system topology diagram',
        'Document component characteristics',
        'Generate system definition document'
      ],
      outputFormat: 'JSON with components, interactions, topology, resources, serviceCenters, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'interactions', 'artifacts'],
      properties: {
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              capacity: { type: 'string' },
              characteristics: { type: 'object' }
            }
          }
        },
        interactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        topology: { type: 'string' },
        resources: { type: 'array', items: { type: 'string' } },
        serviceCenters: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-modeling', 'system-definition']
}));

// Task 2: Workload Characterization
export const workloadCharacterizationTask = defineTask('workload-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize workload',
  agent: {
    name: 'systems-engineer',
    skills: ['asymptotic-notation-calculator', 'cache-simulator', 'latex-proof-formatter'],
    prompt: {
      role: 'workload characterization specialist',
      task: 'Model workload characteristics for performance analysis',
      context: args,
      instructions: [
        'Characterize arrival process (Poisson, bursty, etc.)',
        'Model arrival rate (requests/second)',
        'Characterize service time distributions',
        'Identify workload classes if heterogeneous',
        'Model think times for closed systems',
        'Document workload variability',
        'Identify peak vs average workloads',
        'Generate workload model document'
      ],
      outputFormat: 'JSON with model, arrivalProcess, arrivalRate, serviceTimeDistribution, workloadClasses, variability, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'arrivalProcess', 'arrivalRate', 'artifacts'],
      properties: {
        model: { type: 'string' },
        arrivalProcess: { type: 'string' },
        arrivalRate: { type: 'string' },
        serviceTimeDistribution: {
          type: 'object',
          properties: {
            distribution: { type: 'string' },
            mean: { type: 'string' },
            variance: { type: 'string' }
          }
        },
        workloadClasses: { type: 'array', items: { type: 'string' } },
        thinkTime: { type: 'string' },
        variability: { type: 'string' },
        peakLoad: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-modeling', 'workload']
}));

// Task 3: Queuing Model Construction
export const queuingModelConstructionTask = defineTask('queuing-model-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct queuing theory model',
  agent: {
    name: 'systems-engineer',
    skills: ['asymptotic-notation-calculator', 'latex-proof-formatter', 'recurrence-solver'],
    prompt: {
      role: 'queuing theory specialist',
      task: 'Construct queuing theory model for performance analysis',
      context: args,
      instructions: [
        'Select appropriate queuing model (M/M/1, M/M/c, M/G/1, etc.)',
        'Model each service center as queue',
        'Define arrival and service processes',
        'Apply Kendall notation',
        'Derive steady-state equations',
        'Calculate utilization, queue length, wait time',
        'Apply Little\'s Law',
        'Generate queuing model specification'
      ],
      outputFormat: 'JSON with model, modelType, kendallNotation, steadyStateEquations, metrics, littlesLaw, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'modelType', 'artifacts'],
      properties: {
        model: { type: 'string' },
        modelType: { type: 'string' },
        kendallNotation: { type: 'string' },
        steadyStateEquations: { type: 'array', items: { type: 'string' } },
        metrics: {
          type: 'object',
          properties: {
            utilization: { type: 'string' },
            averageQueueLength: { type: 'string' },
            averageWaitTime: { type: 'string' },
            averageResponseTime: { type: 'string' }
          }
        },
        littlesLaw: { type: 'string' },
        stabilityCondition: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-modeling', 'queuing']
}));

// Task 4: Markov Model Construction
export const markovModelConstructionTask = defineTask('markov-model-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct Markov model if applicable',
  agent: {
    name: 'systems-engineer',
    skills: ['asymptotic-notation-calculator', 'latex-proof-formatter', 'recurrence-solver'],
    prompt: {
      role: 'Markov modeling specialist',
      task: 'Construct continuous-time Markov chain model for system states',
      context: args,
      instructions: [
        'Determine if Markov model is beneficial',
        'Define state space for the system',
        'Construct transition rate matrix',
        'Solve for steady-state probabilities',
        'Calculate performance metrics from probabilities',
        'Consider birth-death process if applicable',
        'Document Markov model',
        'Generate Markov model specification'
      ],
      outputFormat: 'JSON with model, applicable, stateSpace, transitionMatrix, steadyStateProbabilities, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['applicable', 'artifacts'],
      properties: {
        model: { type: 'string' },
        applicable: { type: 'boolean' },
        stateSpace: { type: 'array', items: { type: 'string' } },
        transitionMatrix: { type: 'string' },
        steadyStateProbabilities: { type: 'string' },
        birthDeathProcess: { type: 'boolean' },
        metrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-modeling', 'markov']
}));

// Task 5: Bottleneck Analysis
export const bottleneckAnalysisTask = defineTask('bottleneck-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify bottlenecks via analysis',
  agent: {
    name: 'systems-engineer',
    skills: ['cache-simulator', 'memory-hierarchy-modeler', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'performance bottleneck specialist',
      task: 'Identify system bottlenecks through analytical modeling',
      context: args,
      instructions: [
        'Calculate utilization of each resource',
        'Identify highest utilization resource (bottleneck)',
        'Apply bottleneck analysis bounds',
        'Calculate maximum achievable throughput',
        'Identify secondary bottlenecks',
        'Analyze bottleneck under varying load',
        'Document bottleneck findings',
        'Generate bottleneck analysis report'
      ],
      outputFormat: 'JSON with primaryBottleneck, secondaryBottlenecks, utilizationAnalysis, maxThroughput, loadAnalysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryBottleneck', 'utilizationAnalysis', 'artifacts'],
      properties: {
        primaryBottleneck: { type: 'string' },
        secondaryBottlenecks: { type: 'array', items: { type: 'string' } },
        utilizationAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              utilization: { type: 'string' }
            }
          }
        },
        maxThroughput: { type: 'string' },
        bottleneckBounds: { type: 'string' },
        loadAnalysis: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-modeling', 'bottleneck']
}));

// Task 6: Model Validation Plan
export const modelValidationPlanTask = defineTask('model-validation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan model validation against empirical data',
  agent: {
    name: 'systems-engineer',
    skills: ['asymptotic-notation-calculator', 'latex-proof-formatter', 'cache-simulator'],
    prompt: {
      role: 'model validation specialist',
      task: 'Design plan to validate performance model against empirical data',
      context: args,
      instructions: [
        'Identify metrics to collect for validation',
        'Design experiments for model validation',
        'Specify measurement methodology',
        'Define acceptable error thresholds',
        'Plan calibration approach if needed',
        'Document validation criteria',
        'Generate validation plan document'
      ],
      outputFormat: 'JSON with plan, metrics, experiments, methodology, thresholds, calibration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'metrics', 'artifacts'],
      properties: {
        plan: { type: 'string' },
        metrics: { type: 'array', items: { type: 'string' } },
        experiments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              experiment: { type: 'string' },
              purpose: { type: 'string' },
              methodology: { type: 'string' }
            }
          }
        },
        methodology: { type: 'string' },
        thresholds: { type: 'object' },
        calibration: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-modeling', 'validation']
}));

// Task 7: Performance Prediction
export const performancePredictionTask = defineTask('performance-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Predict performance under varying conditions',
  agent: {
    name: 'systems-engineer',
    skills: ['asymptotic-notation-calculator', 'cache-simulator', 'memory-hierarchy-modeler'],
    prompt: {
      role: 'performance prediction specialist',
      task: 'Use models to predict performance under varying conditions',
      context: args,
      instructions: [
        'Predict throughput at various load levels',
        'Predict response time at various load levels',
        'Analyze performance near saturation',
        'Predict impact of scaling resources',
        'Analyze performance sensitivity to parameters',
        'Generate performance curves',
        'Document predictions and assumptions',
        'Generate performance prediction report'
      ],
      outputFormat: 'JSON with predictedThroughput, predictedLatency, scalingAnalysis, sensitivityAnalysis, performanceCurves, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['predictedThroughput', 'predictedLatency', 'artifacts'],
      properties: {
        predictedThroughput: { type: 'string' },
        predictedLatency: { type: 'string' },
        loadLevelPredictions: { type: 'array', items: { type: 'object' } },
        scalingAnalysis: { type: 'string' },
        sensitivityAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              sensitivity: { type: 'string' }
            }
          }
        },
        performanceCurves: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-modeling', 'prediction']
}));

// Task 8: Capacity Planning
export const capacityPlanningTask = defineTask('capacity-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate capacity planning recommendations',
  agent: {
    name: 'systems-engineer',
    skills: ['asymptotic-notation-calculator', 'cache-simulator', 'latex-proof-formatter'],
    prompt: {
      role: 'capacity planning specialist',
      task: 'Generate capacity planning recommendations based on performance model',
      context: args,
      instructions: [
        'Determine capacity needed to meet performance goals',
        'Recommend scaling strategy (vertical vs horizontal)',
        'Identify which resources to scale',
        'Estimate cost of scaling options',
        'Plan for peak load capacity',
        'Consider redundancy requirements',
        'Generate capacity planning recommendations',
        'Document capacity planning rationale'
      ],
      outputFormat: 'JSON with recommendations, scalingStrategy, resourceScaling, costAnalysis, peakCapacity, redundancy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'scalingStrategy', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              impact: { type: 'string' },
              cost: { type: 'string' }
            }
          }
        },
        scalingStrategy: { type: 'string' },
        resourceScaling: { type: 'array', items: { type: 'string' } },
        costAnalysis: { type: 'string' },
        peakCapacity: { type: 'string' },
        redundancy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-modeling', 'capacity-planning']
}));

// Task 9: Performance Model Documentation
export const performanceModelDocumentationTask = defineTask('performance-model-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate performance model documentation',
  agent: {
    name: 'systems-engineer',
    skills: ['latex-proof-formatter', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'technical documentation specialist',
      task: 'Generate comprehensive performance model documentation',
      context: args,
      instructions: [
        'Create executive summary',
        'Document system architecture',
        'Present workload characterization',
        'Detail queuing model',
        'Present Markov model if applicable',
        'Document bottleneck analysis',
        'Present performance predictions',
        'Include capacity planning recommendations',
        'Format as professional performance analysis report'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, tableOfContents, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        tableOfContents: { type: 'array', items: { type: 'string' } },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-modeling', 'documentation']
}));
