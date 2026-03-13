/**
 * @process domains/science/industrial-engineering/discrete-event-simulation
 * @description Discrete Event Simulation Modeling - Build discrete event simulation models to analyze system performance,
 * test process changes, and support capacity planning decisions without disrupting actual operations.
 * @inputs { systemDescription: string, objectives?: array, kpis?: array, simulationTool?: string, runLength?: number }
 * @outputs { success: boolean, modelValidation: object, experimentResults: object, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/discrete-event-simulation', {
 *   systemDescription: 'Manufacturing assembly line with 5 workstations',
 *   objectives: ['Identify bottlenecks', 'Test additional workstation'],
 *   kpis: ['throughput', 'cycle-time', 'wip'],
 *   simulationTool: 'simpy'
 * });
 *
 * @references
 * - Law, Simulation Modeling and Analysis
 * - Banks et al., Discrete-Event System Simulation
 * - SimPy: https://simpy.readthedocs.io/
 * - AnyLogic: https://www.anylogic.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemDescription,
    objectives = [],
    kpis = ['throughput', 'cycle-time', 'utilization'],
    simulationTool = 'simpy',
    runLength = 1000,
    warmUpPeriod = 100,
    replications = 30,
    outputDir = 'simulation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Discrete Event Simulation Modeling process');

  // Task 1: Simulation Scope Definition
  ctx.log('info', 'Phase 1: Defining simulation scope and objectives');
  const scopeDefinition = await ctx.task(scopeDefinitionTask, {
    systemDescription,
    objectives,
    kpis,
    outputDir
  });

  artifacts.push(...scopeDefinition.artifacts);

  // Task 2: Data Collection and Analysis
  ctx.log('info', 'Phase 2: Collecting input data and fitting distributions');
  const dataCollection = await ctx.task(dataCollectionTask, {
    scopeDefinition,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  // Task 3: Model Development
  ctx.log('info', 'Phase 3: Developing simulation model');
  const modelDevelopment = await ctx.task(modelDevelopmentTask, {
    scopeDefinition,
    dataCollection,
    simulationTool,
    outputDir
  });

  artifacts.push(...modelDevelopment.artifacts);

  // Breakpoint: Review model logic
  await ctx.breakpoint({
    question: `Simulation model developed with ${modelDevelopment.entityCount} entities and ${modelDevelopment.processCount} processes. Review model logic before validation?`,
    title: 'Simulation Model Review',
    context: {
      runId: ctx.runId,
      modelStructure: modelDevelopment.modelStructure,
      entityCount: modelDevelopment.entityCount,
      processCount: modelDevelopment.processCount,
      files: modelDevelopment.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 4: Model Validation
  ctx.log('info', 'Phase 4: Validating simulation model');
  const modelValidation = await ctx.task(modelValidationTask, {
    modelDevelopment,
    dataCollection,
    outputDir
  });

  artifacts.push(...modelValidation.artifacts);

  if (!modelValidation.validated) {
    await ctx.breakpoint({
      question: `Model validation failed. Issues: ${modelValidation.validationIssues.join(', ')}. Address issues before proceeding?`,
      title: 'Model Validation Issues',
      context: {
        runId: ctx.runId,
        validationResults: modelValidation,
        files: modelValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Task 5: Experiment Design
  ctx.log('info', 'Phase 5: Designing simulation experiments');
  const experimentDesign = await ctx.task(experimentDesignTask, {
    scopeDefinition,
    modelDevelopment,
    runLength,
    warmUpPeriod,
    replications,
    outputDir
  });

  artifacts.push(...experimentDesign.artifacts);

  // Task 6: Simulation Execution
  ctx.log('info', 'Phase 6: Executing simulation experiments');
  const simulationExecution = await ctx.task(simulationExecutionTask, {
    modelDevelopment,
    experimentDesign,
    outputDir
  });

  artifacts.push(...simulationExecution.artifacts);

  // Task 7: Output Analysis
  ctx.log('info', 'Phase 7: Analyzing simulation output');
  const outputAnalysis = await ctx.task(outputAnalysisTask, {
    simulationExecution,
    experimentDesign,
    kpis,
    outputDir
  });

  artifacts.push(...outputAnalysis.artifacts);

  // Task 8: Recommendations Report
  ctx.log('info', 'Phase 8: Generating recommendations report');
  const recommendationsReport = await ctx.task(recommendationsReportTask, {
    scopeDefinition,
    modelValidation,
    experimentDesign,
    outputAnalysis,
    outputDir
  });

  artifacts.push(...recommendationsReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Simulation analysis complete. Best scenario: ${outputAnalysis.bestScenario}. Review results and recommendations?`,
    title: 'Simulation Results Review',
    context: {
      runId: ctx.runId,
      summary: {
        scenariosAnalyzed: outputAnalysis.scenarioCount,
        bestScenario: outputAnalysis.bestScenario,
        kpiResults: outputAnalysis.kpiSummary,
        recommendations: recommendationsReport.recommendations
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    modelValidation: {
      validated: modelValidation.validated,
      validationTests: modelValidation.validationTests
    },
    experimentResults: {
      scenarioCount: outputAnalysis.scenarioCount,
      bestScenario: outputAnalysis.bestScenario,
      kpiResults: outputAnalysis.kpiSummary,
      confidenceIntervals: outputAnalysis.confidenceIntervals
    },
    recommendations: recommendationsReport.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/discrete-event-simulation',
      timestamp: startTime,
      simulationTool,
      replications,
      outputDir
    }
  };
}

// Task 1: Scope Definition
export const scopeDefinitionTask = defineTask('scope-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define simulation scope and objectives',
  agent: {
    name: 'simulation-analyst',
    prompt: {
      role: 'Simulation Analyst',
      task: 'Define simulation scope, objectives, and key performance indicators',
      context: args,
      instructions: [
        '1. Clarify simulation objectives and questions to answer',
        '2. Define system boundaries and scope',
        '3. Identify entities, resources, and processes',
        '4. Define key performance indicators (KPIs)',
        '5. Identify input variables and parameters',
        '6. Define model assumptions',
        '7. Identify data requirements',
        '8. Document scope definition'
      ],
      outputFormat: 'JSON with scope, objectives, KPIs, and data requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'systemBoundaries', 'entities', 'kpis', 'artifacts'],
      properties: {
        objectives: { type: 'array', items: { type: 'string' } },
        systemBoundaries: { type: 'object' },
        entities: { type: 'array' },
        resources: { type: 'array' },
        processes: { type: 'array' },
        kpis: { type: 'array' },
        assumptions: { type: 'array' },
        dataRequirements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'simulation', 'scope-definition']
}));

// Task 2: Data Collection
export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect and analyze input data',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'Data Analyst',
      task: 'Collect input data and fit statistical distributions',
      context: args,
      instructions: [
        '1. Collect historical data for process times',
        '2. Analyze arrival patterns',
        '3. Fit probability distributions to data',
        '4. Perform goodness-of-fit tests',
        '5. Handle data gaps with expert input',
        '6. Document data sources and quality',
        '7. Create input parameter tables',
        '8. Generate data analysis report'
      ],
      outputFormat: 'JSON with distributions, parameters, and data quality assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['distributions', 'parameters', 'dataQuality', 'artifacts'],
      properties: {
        distributions: { type: 'object' },
        parameters: { type: 'object' },
        goodnessOfFit: { type: 'object' },
        dataQuality: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'simulation', 'data-collection']
}));

// Task 3: Model Development
export const modelDevelopmentTask = defineTask('model-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop simulation model',
  agent: {
    name: 'simulation-modeler',
    prompt: {
      role: 'Simulation Modeler',
      task: 'Build discrete event simulation model',
      context: args,
      instructions: [
        '1. Create model structure and logic',
        '2. Define entity types and attributes',
        '3. Model arrival processes',
        '4. Model service processes and queues',
        '5. Define resource pools and capacities',
        '6. Implement routing logic',
        '7. Add data collection for KPIs',
        '8. Generate simulation code'
      ],
      outputFormat: 'JSON with model structure, code, and documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['modelStructure', 'modelCode', 'entityCount', 'processCount', 'artifacts'],
      properties: {
        modelStructure: { type: 'object' },
        modelCode: { type: 'string' },
        entityCount: { type: 'number' },
        processCount: { type: 'number' },
        resourceCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'simulation', 'model-development']
}));

// Task 4: Model Validation
export const modelValidationTask = defineTask('model-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate simulation model',
  agent: {
    name: 'validation-specialist',
    prompt: {
      role: 'Simulation Validation Specialist',
      task: 'Validate simulation model against real system',
      context: args,
      instructions: [
        '1. Perform animation review with stakeholders',
        '2. Compare model output to historical data',
        '3. Conduct sensitivity analysis on inputs',
        '4. Perform extreme condition tests',
        '5. Validate with subject matter experts',
        '6. Document validation results',
        '7. Address validation issues',
        '8. Generate validation report'
      ],
      outputFormat: 'JSON with validation results and issues'
    },
    outputSchema: {
      type: 'object',
      required: ['validated', 'validationTests', 'artifacts'],
      properties: {
        validated: { type: 'boolean' },
        validationTests: { type: 'array' },
        comparisonResults: { type: 'object' },
        validationIssues: { type: 'array' },
        stakeholderFeedback: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'simulation', 'validation']
}));

// Task 5: Experiment Design
export const experimentDesignTask = defineTask('experiment-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design simulation experiments',
  agent: {
    name: 'experiment-designer',
    prompt: {
      role: 'Simulation Experiment Designer',
      task: 'Design experiments to answer simulation objectives',
      context: args,
      instructions: [
        '1. Define scenarios to test',
        '2. Determine run length and warm-up period',
        '3. Determine number of replications',
        '4. Design factorial experiments if needed',
        '5. Define output metrics to collect',
        '6. Plan variance reduction techniques',
        '7. Create experiment matrix',
        '8. Document experiment design'
      ],
      outputFormat: 'JSON with experiment design, scenarios, and run parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'runLength', 'replications', 'artifacts'],
      properties: {
        scenarios: { type: 'array' },
        runLength: { type: 'number' },
        warmUpPeriod: { type: 'number' },
        replications: { type: 'number' },
        experimentMatrix: { type: 'object' },
        outputMetrics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'simulation', 'experiment-design']
}));

// Task 6: Simulation Execution
export const simulationExecutionTask = defineTask('simulation-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute simulation experiments',
  agent: {
    name: 'simulation-executor',
    prompt: {
      role: 'Simulation Engineer',
      task: 'Execute simulation runs for all scenarios',
      context: args,
      instructions: [
        '1. Set up simulation environment',
        '2. Execute base case scenario',
        '3. Execute all experimental scenarios',
        '4. Collect output data for each replication',
        '5. Monitor for errors or anomalies',
        '6. Store raw output data',
        '7. Calculate preliminary statistics',
        '8. Document execution results'
      ],
      outputFormat: 'JSON with execution results and raw data paths'
    },
    outputSchema: {
      type: 'object',
      required: ['executionComplete', 'scenarioResults', 'artifacts'],
      properties: {
        executionComplete: { type: 'boolean' },
        scenarioResults: { type: 'array' },
        executionTime: { type: 'number' },
        rawDataPaths: { type: 'array' },
        errors: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'simulation', 'execution']
}));

// Task 7: Output Analysis
export const outputAnalysisTask = defineTask('output-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze simulation output',
  agent: {
    name: 'output-analyst',
    prompt: {
      role: 'Statistical Analyst',
      task: 'Analyze simulation output with statistical rigor',
      context: args,
      instructions: [
        '1. Calculate point estimates for KPIs',
        '2. Calculate confidence intervals',
        '3. Compare scenarios statistically',
        '4. Perform ANOVA for scenario comparison',
        '5. Identify statistically significant differences',
        '6. Create visualizations of results',
        '7. Identify best performing scenario',
        '8. Generate analysis report'
      ],
      outputFormat: 'JSON with statistical analysis and scenario comparison'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarioCount', 'bestScenario', 'kpiSummary', 'confidenceIntervals', 'artifacts'],
      properties: {
        scenarioCount: { type: 'number' },
        bestScenario: { type: 'string' },
        kpiSummary: { type: 'object' },
        confidenceIntervals: { type: 'object' },
        scenarioComparison: { type: 'object' },
        significantDifferences: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'simulation', 'output-analysis']
}));

// Task 8: Recommendations Report
export const recommendationsReportTask = defineTask('recommendations-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate recommendations report',
  agent: {
    name: 'simulation-consultant',
    prompt: {
      role: 'Simulation Consultant',
      task: 'Generate comprehensive recommendations based on simulation results',
      context: args,
      instructions: [
        '1. Summarize key findings from simulation',
        '2. Identify bottlenecks and constraints',
        '3. Recommend optimal configuration',
        '4. Quantify expected improvements',
        '5. Discuss implementation considerations',
        '6. Identify risks and uncertainties',
        '7. Suggest follow-up studies',
        '8. Create executive presentation'
      ],
      outputFormat: 'JSON with recommendations and supporting analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'keyFindings', 'reportPath', 'artifacts'],
      properties: {
        recommendations: { type: 'array', items: { type: 'string' } },
        keyFindings: { type: 'array', items: { type: 'string' } },
        expectedImprovements: { type: 'object' },
        implementationPlan: { type: 'array' },
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
  labels: ['agent', 'industrial-engineering', 'simulation', 'recommendations']
}));
