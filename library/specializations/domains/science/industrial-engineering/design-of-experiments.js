/**
 * @process domains/science/industrial-engineering/design-of-experiments
 * @description Design of Experiments Execution - Plan and execute designed experiments to identify significant factors,
 * optimize process settings, and reduce variation using factorial and response surface methods.
 * @inputs { experimentObjective: string, responseVariables?: array, factors?: array, designType?: string }
 * @outputs { success: boolean, significantFactors: array, optimalSettings: object, confirmationResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/design-of-experiments', {
 *   experimentObjective: 'Optimize injection molding cycle time while maintaining quality',
 *   responseVariables: ['cycle-time', 'part-weight'],
 *   factors: ['temperature', 'pressure', 'cooling-time'],
 *   designType: '2k-factorial'
 * });
 *
 * @references
 * - Montgomery, Design and Analysis of Experiments
 * - Box, Hunter & Hunter, Statistics for Experimenters
 * - NIST/SEMATECH e-Handbook of Statistical Methods
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    experimentObjective,
    responseVariables = [],
    factors = [],
    designType = 'auto',
    alpha = 0.05,
    outputDir = 'doe-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Design of Experiments process');

  // Task 1: Experiment Planning
  ctx.log('info', 'Phase 1: Planning experiment objectives and responses');
  const experimentPlanning = await ctx.task(experimentPlanningTask, {
    experimentObjective,
    responseVariables,
    outputDir
  });

  artifacts.push(...experimentPlanning.artifacts);

  // Task 2: Factor Identification
  ctx.log('info', 'Phase 2: Identifying factors and levels');
  const factorIdentification = await ctx.task(factorIdentificationTask, {
    experimentPlanning,
    factors,
    outputDir
  });

  artifacts.push(...factorIdentification.artifacts);

  // Task 3: Design Selection
  ctx.log('info', 'Phase 3: Selecting experimental design');
  const designSelection = await ctx.task(designSelectionTask, {
    factorIdentification,
    designType,
    outputDir
  });

  artifacts.push(...designSelection.artifacts);

  // Breakpoint: Review design
  await ctx.breakpoint({
    question: `Experimental design selected: ${designSelection.selectedDesign}. ${designSelection.runCount} runs required. Review design matrix before execution?`,
    title: 'DOE Design Review',
    context: {
      runId: ctx.runId,
      design: designSelection.selectedDesign,
      runCount: designSelection.runCount,
      factors: factorIdentification.factors,
      files: designSelection.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 4: Randomization
  ctx.log('info', 'Phase 4: Creating randomization schedule');
  const randomization = await ctx.task(randomizationTask, {
    designSelection,
    outputDir
  });

  artifacts.push(...randomization.artifacts);

  // Task 5: Experiment Execution
  ctx.log('info', 'Phase 5: Executing experimental runs');
  const experimentExecution = await ctx.task(experimentExecutionTask, {
    randomization,
    factorIdentification,
    outputDir
  });

  artifacts.push(...experimentExecution.artifacts);

  // Task 6: Statistical Analysis
  ctx.log('info', 'Phase 6: Analyzing experimental results');
  const statisticalAnalysis = await ctx.task(statisticalAnalysisTask, {
    experimentExecution,
    designSelection,
    alpha,
    outputDir
  });

  artifacts.push(...statisticalAnalysis.artifacts);

  // Task 7: Optimization
  ctx.log('info', 'Phase 7: Determining optimal settings');
  const optimization = await ctx.task(optimizationTask, {
    statisticalAnalysis,
    experimentObjective,
    outputDir
  });

  artifacts.push(...optimization.artifacts);

  // Task 8: Confirmation Runs
  ctx.log('info', 'Phase 8: Executing confirmation runs');
  const confirmationRuns = await ctx.task(confirmationRunsTask, {
    optimization,
    statisticalAnalysis,
    outputDir
  });

  artifacts.push(...confirmationRuns.artifacts);

  // Task 9: Report Generation
  ctx.log('info', 'Phase 9: Generating experiment report');
  const reportGeneration = await ctx.task(reportGenerationTask, {
    experimentPlanning,
    designSelection,
    statisticalAnalysis,
    optimization,
    confirmationRuns,
    outputDir
  });

  artifacts.push(...reportGeneration.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `DOE analysis complete. ${statisticalAnalysis.significantFactors.length} significant factors identified. Confirmation runs ${confirmationRuns.confirmed ? 'validated' : 'did not validate'} optimal settings. Review report?`,
    title: 'DOE Results Review',
    context: {
      runId: ctx.runId,
      summary: {
        significantFactors: statisticalAnalysis.significantFactors,
        optimalSettings: optimization.optimalSettings,
        confirmationValidated: confirmationRuns.confirmed,
        predictedResponse: optimization.predictedResponse,
        actualResponse: confirmationRuns.actualResponse
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    significantFactors: statisticalAnalysis.significantFactors,
    factorEffects: statisticalAnalysis.factorEffects,
    optimalSettings: optimization.optimalSettings,
    confirmationResults: {
      confirmed: confirmationRuns.confirmed,
      predictedResponse: optimization.predictedResponse,
      actualResponse: confirmationRuns.actualResponse
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/design-of-experiments',
      timestamp: startTime,
      designType: designSelection.selectedDesign,
      runCount: designSelection.runCount,
      outputDir
    }
  };
}

// Task 1: Experiment Planning
export const experimentPlanningTask = defineTask('experiment-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan experiment objectives',
  agent: {
    name: 'doe-planner',
    prompt: {
      role: 'Design of Experiments Specialist',
      task: 'Plan experimental objectives, responses, and success criteria',
      context: args,
      instructions: [
        '1. Clarify experimental objectives',
        '2. Define response variables and measurement methods',
        '3. Establish target values or optimization direction',
        '4. Define practical significance thresholds',
        '5. Identify constraints and limitations',
        '6. Define success criteria',
        '7. Assess resource requirements',
        '8. Create experiment planning document'
      ],
      outputFormat: 'JSON with experiment plan and objectives'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'responses', 'successCriteria', 'artifacts'],
      properties: {
        objectives: { type: 'array' },
        responses: { type: 'array' },
        measurementMethods: { type: 'object' },
        successCriteria: { type: 'array' },
        constraints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'doe', 'planning']
}));

// Task 2: Factor Identification
export const factorIdentificationTask = defineTask('factor-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify factors and levels',
  agent: {
    name: 'factor-analyst',
    prompt: {
      role: 'Process Engineer',
      task: 'Identify experimental factors and their levels',
      context: args,
      instructions: [
        '1. Brainstorm potential factors (fishbone diagram)',
        '2. Prioritize factors based on process knowledge',
        '3. Define factor levels (low, high, center)',
        '4. Ensure levels are achievable and safe',
        '5. Identify noise factors to block',
        '6. Identify factors to hold constant',
        '7. Define factor interactions of interest',
        '8. Document factor definitions'
      ],
      outputFormat: 'JSON with factors, levels, and classifications'
    },
    outputSchema: {
      type: 'object',
      required: ['factors', 'levels', 'factorTypes', 'artifacts'],
      properties: {
        factors: { type: 'array' },
        levels: { type: 'object' },
        factorTypes: { type: 'object' },
        noiseFactors: { type: 'array' },
        heldConstant: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'doe', 'factors']
}));

// Task 3: Design Selection
export const designSelectionTask = defineTask('design-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select experimental design',
  agent: {
    name: 'design-selector',
    prompt: {
      role: 'DOE Statistician',
      task: 'Select appropriate experimental design',
      context: args,
      instructions: [
        '1. Evaluate full factorial design',
        '2. Evaluate fractional factorial if needed',
        '3. Consider screening designs for many factors',
        '4. Consider RSM for optimization',
        '5. Evaluate Taguchi robust designs',
        '6. Select design based on objectives and resources',
        '7. Generate design matrix',
        '8. Document design selection rationale'
      ],
      outputFormat: 'JSON with selected design and matrix'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedDesign', 'runCount', 'designMatrix', 'artifacts'],
      properties: {
        selectedDesign: { type: 'string' },
        runCount: { type: 'number' },
        designMatrix: { type: 'array' },
        resolution: { type: 'string' },
        aliasStructure: { type: 'object' },
        centerPoints: { type: 'number' },
        selectionRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'doe', 'design-selection']
}));

// Task 4: Randomization
export const randomizationTask = defineTask('randomization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create randomization schedule',
  agent: {
    name: 'randomization-specialist',
    prompt: {
      role: 'Experimental Design Specialist',
      task: 'Create randomized run order and blocking structure',
      context: args,
      instructions: [
        '1. Randomize run order',
        '2. Apply blocking if needed',
        '3. Handle hard-to-change factors',
        '4. Create run schedule with dates/times',
        '5. Include replicates appropriately',
        '6. Create data collection forms',
        '7. Document randomization method',
        '8. Create execution checklist'
      ],
      outputFormat: 'JSON with randomized schedule and forms'
    },
    outputSchema: {
      type: 'object',
      required: ['randomizedOrder', 'runSchedule', 'dataForms', 'artifacts'],
      properties: {
        randomizedOrder: { type: 'array' },
        runSchedule: { type: 'array' },
        blocks: { type: 'array' },
        dataForms: { type: 'array' },
        executionChecklist: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'doe', 'randomization']
}));

// Task 5: Experiment Execution
export const experimentExecutionTask = defineTask('experiment-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute experimental runs',
  agent: {
    name: 'experiment-executor',
    prompt: {
      role: 'Experiment Coordinator',
      task: 'Execute and document experimental runs',
      context: args,
      instructions: [
        '1. Execute runs per randomized schedule',
        '2. Set factors to specified levels',
        '3. Record response measurements',
        '4. Document any deviations',
        '5. Note environmental conditions',
        '6. Verify measurement system',
        '7. Complete data collection forms',
        '8. Review data quality'
      ],
      outputFormat: 'JSON with experimental data and execution notes'
    },
    outputSchema: {
      type: 'object',
      required: ['experimentalData', 'executionComplete', 'artifacts'],
      properties: {
        experimentalData: { type: 'array' },
        executionComplete: { type: 'boolean' },
        deviations: { type: 'array' },
        environmentalConditions: { type: 'object' },
        dataQualityNotes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'doe', 'execution']
}));

// Task 6: Statistical Analysis
export const statisticalAnalysisTask = defineTask('statistical-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze experimental results',
  agent: {
    name: 'doe-analyst',
    prompt: {
      role: 'DOE Statistician',
      task: 'Perform statistical analysis of experimental data',
      context: args,
      instructions: [
        '1. Perform ANOVA analysis',
        '2. Calculate main effects',
        '3. Calculate interaction effects',
        '4. Identify significant factors (p < alpha)',
        '5. Check residuals for assumptions',
        '6. Create effects plots (Pareto, main effects, interaction)',
        '7. Fit regression model',
        '8. Document analysis results'
      ],
      outputFormat: 'JSON with statistical analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['significantFactors', 'factorEffects', 'anovaTable', 'artifacts'],
      properties: {
        significantFactors: { type: 'array' },
        factorEffects: { type: 'object' },
        interactionEffects: { type: 'object' },
        anovaTable: { type: 'object' },
        rSquared: { type: 'number' },
        regressionModel: { type: 'object' },
        residualAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'doe', 'analysis']
}));

// Task 7: Optimization
export const optimizationTask = defineTask('optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine optimal settings',
  agent: {
    name: 'optimizer',
    prompt: {
      role: 'Process Optimization Specialist',
      task: 'Determine optimal factor settings',
      context: args,
      instructions: [
        '1. Define optimization objective',
        '2. Use contour plots for two factors',
        '3. Apply response surface methods if applicable',
        '4. Consider multiple responses (desirability)',
        '5. Identify optimal factor settings',
        '6. Calculate predicted response at optimum',
        '7. Calculate prediction interval',
        '8. Document optimization rationale'
      ],
      outputFormat: 'JSON with optimal settings and predictions'
    },
    outputSchema: {
      type: 'object',
      required: ['optimalSettings', 'predictedResponse', 'predictionInterval', 'artifacts'],
      properties: {
        optimalSettings: { type: 'object' },
        predictedResponse: { type: 'number' },
        predictionInterval: { type: 'object' },
        contourPlots: { type: 'array' },
        desirabilityFunction: { type: 'object' },
        optimizationRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'doe', 'optimization']
}));

// Task 8: Confirmation Runs
export const confirmationRunsTask = defineTask('confirmation-runs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute confirmation runs',
  agent: {
    name: 'confirmation-executor',
    prompt: {
      role: 'Experiment Validation Specialist',
      task: 'Execute and validate confirmation runs',
      context: args,
      instructions: [
        '1. Set factors to optimal levels',
        '2. Execute multiple confirmation runs',
        '3. Measure response variables',
        '4. Calculate confirmation statistics',
        '5. Compare to prediction interval',
        '6. Assess if prediction is validated',
        '7. Document any discrepancies',
        '8. Generate confirmation report'
      ],
      outputFormat: 'JSON with confirmation run results'
    },
    outputSchema: {
      type: 'object',
      required: ['confirmed', 'actualResponse', 'confirmationData', 'artifacts'],
      properties: {
        confirmed: { type: 'boolean' },
        actualResponse: { type: 'number' },
        confirmationData: { type: 'array' },
        statistics: { type: 'object' },
        withinPredictionInterval: { type: 'boolean' },
        discrepancies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'doe', 'confirmation']
}));

// Task 9: Report Generation
export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate experiment report',
  agent: {
    name: 'doe-reporter',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Generate comprehensive DOE report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document experimental design',
        '3. Present statistical analysis',
        '4. Include all relevant plots',
        '5. Present optimal settings',
        '6. Document confirmation results',
        '7. Provide recommendations',
        '8. Include lessons learned'
      ],
      outputFormat: 'JSON with report path and key conclusions'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'conclusions', 'recommendations', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        conclusions: { type: 'array' },
        recommendations: { type: 'array' },
        lessonsLearned: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'doe', 'reporting']
}));
