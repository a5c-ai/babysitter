/**
 * @process environmental-engineering/wastewater-process-optimization
 * @description Wastewater Process Optimization - Methodology for optimizing biological and physical-chemical treatment
 * processes to improve effluent quality, reduce energy consumption, and minimize chemical usage.
 * @inputs { facilityName: string, treatmentType: string, currentPerformance: object, optimizationGoals: object }
 * @outputs { success: boolean, optimizationPlan: object, expectedImprovements: object, implementationStrategy: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/wastewater-process-optimization', {
 *   facilityName: 'Regional WWTP',
 *   treatmentType: 'activated-sludge',
 *   currentPerformance: { effluentBOD: 25, effluentTSS: 30, energyUsage: 1500 },
 *   optimizationGoals: { reduceEnergy: 20, improveNitrogenRemoval: true }
 * });
 *
 * @references
 * - WEF Manual of Practice: Wastewater Treatment Process Modeling
 * - EPA Energy Efficiency in Wastewater Treatment
 * - IWA Activated Sludge Models (ASM1, ASM2, ASM3)
 * - WEF Nutrient Removal Optimization
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    facilityName,
    treatmentType = 'activated-sludge',
    currentPerformance = {},
    optimizationGoals = {},
    processData = {},
    budgetConstraints = {},
    outputDir = 'wastewater-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Wastewater Process Optimization: ${facilityName}`);
  ctx.log('info', `Treatment Type: ${treatmentType}`);

  // ============================================================================
  // PHASE 1: PROCESS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Current Process Assessment');

  const processAssessment = await ctx.task(processAssessmentTask, {
    facilityName,
    treatmentType,
    currentPerformance,
    processData,
    outputDir
  });

  artifacts.push(...processAssessment.artifacts);

  // ============================================================================
  // PHASE 2: PERFORMANCE BENCHMARKING
  // ============================================================================

  ctx.log('info', 'Phase 2: Performance Benchmarking');

  const benchmarking = await ctx.task(benchmarkingTask, {
    facilityName,
    treatmentType,
    currentPerformance,
    processAssessment,
    outputDir
  });

  artifacts.push(...benchmarking.artifacts);

  // ============================================================================
  // PHASE 3: PROCESS MODELING
  // ============================================================================

  ctx.log('info', 'Phase 3: Process Modeling and Simulation');

  const processModeling = await ctx.task(processModelingTask, {
    facilityName,
    treatmentType,
    processAssessment,
    benchmarking,
    outputDir
  });

  artifacts.push(...processModeling.artifacts);

  // ============================================================================
  // PHASE 4: OPTIMIZATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Optimization Opportunity Analysis');

  const optimizationAnalysis = await ctx.task(optimizationAnalysisTask, {
    facilityName,
    optimizationGoals,
    processAssessment,
    benchmarking,
    processModeling,
    budgetConstraints,
    outputDir
  });

  artifacts.push(...optimizationAnalysis.artifacts);

  // Breakpoint: Review Optimization Opportunities
  await ctx.breakpoint({
    question: `Optimization analysis complete for ${facilityName}. ${optimizationAnalysis.opportunities.length} opportunities identified. Review and prioritize?`,
    title: 'Optimization Opportunities Review',
    context: {
      runId: ctx.runId,
      opportunities: optimizationAnalysis.opportunities,
      expectedSavings: optimizationAnalysis.expectedSavings,
      files: optimizationAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 5: IMPLEMENTATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementation Planning');

  const implementationPlan = await ctx.task(implementationPlanTask, {
    facilityName,
    optimizationAnalysis,
    budgetConstraints,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // ============================================================================
  // PHASE 6: PERFORMANCE MONITORING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 6: Performance Monitoring Setup');

  const monitoringSetup = await ctx.task(monitoringSetupTask, {
    facilityName,
    optimizationAnalysis,
    implementationPlan,
    outputDir
  });

  artifacts.push(...monitoringSetup.artifacts);

  // ============================================================================
  // PHASE 7: OPTIMIZATION REPORT
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating Optimization Report');

  const optimizationReport = await ctx.task(optimizationReportTask, {
    facilityName,
    processAssessment,
    benchmarking,
    processModeling,
    optimizationAnalysis,
    implementationPlan,
    monitoringSetup,
    outputDir
  });

  artifacts.push(...optimizationReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    facilityName,
    optimizationPlan: {
      opportunities: optimizationAnalysis.opportunities,
      prioritizedActions: optimizationAnalysis.prioritizedActions,
      implementationPhases: implementationPlan.phases
    },
    expectedImprovements: {
      energySavings: optimizationAnalysis.expectedSavings.energy,
      chemicalReduction: optimizationAnalysis.expectedSavings.chemicals,
      effluentQuality: optimizationAnalysis.expectedSavings.effluentQuality
    },
    implementationStrategy: implementationPlan.strategy,
    monitoringPlan: monitoringSetup.monitoringPlan,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/wastewater-process-optimization',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const processAssessmentTask = defineTask('process-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Current Process Assessment',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Wastewater Process Engineer',
      task: 'Assess current wastewater treatment process performance',
      context: args,
      instructions: [
        '1. Review process flow and unit operations',
        '2. Analyze influent characteristics and variability',
        '3. Evaluate current effluent quality',
        '4. Assess aeration system performance',
        '5. Review sludge management practices',
        '6. Analyze energy consumption patterns',
        '7. Evaluate chemical usage',
        '8. Review operational data and trends',
        '9. Identify process bottlenecks',
        '10. Document current process limitations'
      ],
      outputFormat: 'JSON with assessment summary, performance metrics, bottlenecks'
    },
    outputSchema: {
      type: 'object',
      required: ['assessmentSummary', 'performanceMetrics', 'bottlenecks', 'artifacts'],
      properties: {
        assessmentSummary: { type: 'object' },
        performanceMetrics: { type: 'object' },
        influentCharacteristics: { type: 'object' },
        effluentQuality: { type: 'object' },
        energyConsumption: { type: 'object' },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'wastewater', 'assessment']
}));

export const benchmarkingTask = defineTask('performance-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Performance Benchmarking',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Wastewater Benchmarking Specialist',
      task: 'Benchmark facility performance against industry standards',
      context: args,
      instructions: [
        '1. Compare energy efficiency to industry benchmarks',
        '2. Compare effluent quality to permit limits and best practices',
        '3. Assess nutrient removal efficiency',
        '4. Compare chemical consumption to benchmarks',
        '5. Evaluate sludge production rates',
        '6. Compare O&M costs to similar facilities',
        '7. Assess treatment capacity utilization',
        '8. Identify performance gaps',
        '9. Determine improvement potential',
        '10. Document benchmarking results'
      ],
      outputFormat: 'JSON with benchmarks, performance gaps, improvement potential'
    },
    outputSchema: {
      type: 'object',
      required: ['benchmarks', 'performanceGaps', 'improvementPotential', 'artifacts'],
      properties: {
        benchmarks: { type: 'object' },
        currentVsBenchmark: { type: 'object' },
        performanceGaps: { type: 'array' },
        improvementPotential: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'wastewater', 'benchmarking']
}));

export const processModelingTask = defineTask('process-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Process Modeling and Simulation',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Wastewater Process Modeler',
      task: 'Develop and calibrate process model',
      context: args,
      instructions: [
        '1. Select appropriate modeling platform (GPS-X, BioWin, SIMBA)',
        '2. Configure process model based on facility layout',
        '3. Calibrate model with historical data',
        '4. Validate model against current performance',
        '5. Simulate baseline conditions',
        '6. Run sensitivity analysis',
        '7. Model optimization scenarios',
        '8. Predict performance under different conditions',
        '9. Identify critical control parameters',
        '10. Document modeling results'
      ],
      outputFormat: 'JSON with model configuration, calibration results, scenario outcomes'
    },
    outputSchema: {
      type: 'object',
      required: ['modelConfiguration', 'calibrationResults', 'scenarioOutcomes', 'artifacts'],
      properties: {
        modelConfiguration: { type: 'object' },
        calibrationResults: { type: 'object' },
        validationMetrics: { type: 'object' },
        sensitivityAnalysis: { type: 'object' },
        scenarioOutcomes: { type: 'array' },
        criticalParameters: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'wastewater', 'modeling']
}));

export const optimizationAnalysisTask = defineTask('optimization-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimization Opportunity Analysis',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Wastewater Optimization Engineer',
      task: 'Identify and analyze optimization opportunities',
      context: args,
      instructions: [
        '1. Identify aeration optimization opportunities',
        '2. Evaluate DO control strategies',
        '3. Assess solids retention time (SRT) optimization',
        '4. Analyze nutrient removal enhancement options',
        '5. Evaluate chemical feed optimization',
        '6. Identify energy recovery opportunities',
        '7. Assess sludge processing optimization',
        '8. Evaluate process control improvements',
        '9. Prioritize opportunities by ROI',
        '10. Estimate savings and costs for each opportunity'
      ],
      outputFormat: 'JSON with opportunities, prioritization, expected savings'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'prioritizedActions', 'expectedSavings', 'artifacts'],
      properties: {
        opportunities: { type: 'array' },
        prioritizedActions: { type: 'array' },
        expectedSavings: {
          type: 'object',
          properties: {
            energy: { type: 'object' },
            chemicals: { type: 'object' },
            effluentQuality: { type: 'object' }
          }
        },
        implementationCosts: { type: 'object' },
        paybackPeriods: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'wastewater', 'optimization']
}));

export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implementation Planning',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Wastewater Project Manager',
      task: 'Develop optimization implementation plan',
      context: args,
      instructions: [
        '1. Phase implementation based on priority and dependencies',
        '2. Develop detailed implementation schedule',
        '3. Identify resource requirements',
        '4. Define equipment and material needs',
        '5. Develop testing and commissioning plan',
        '6. Create risk mitigation strategies',
        '7. Define success criteria for each phase',
        '8. Estimate implementation costs',
        '9. Develop training requirements',
        '10. Create implementation timeline'
      ],
      outputFormat: 'JSON with implementation phases, schedule, resource requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'phases', 'schedule', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        phases: { type: 'array' },
        schedule: { type: 'object' },
        resourceRequirements: { type: 'object' },
        riskMitigation: { type: 'array' },
        successCriteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'wastewater', 'implementation']
}));

export const monitoringSetupTask = defineTask('monitoring-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Performance Monitoring Setup',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Wastewater Monitoring Specialist',
      task: 'Design performance monitoring system',
      context: args,
      instructions: [
        '1. Define key performance indicators (KPIs)',
        '2. Specify monitoring parameters and frequency',
        '3. Design data collection system',
        '4. Develop performance dashboards',
        '5. Establish baseline measurements',
        '6. Define alert thresholds',
        '7. Create reporting templates',
        '8. Develop continuous improvement protocols',
        '9. Design feedback loops',
        '10. Document monitoring procedures'
      ],
      outputFormat: 'JSON with monitoring plan, KPIs, dashboard specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoringPlan', 'kpis', 'dashboardSpecs', 'artifacts'],
      properties: {
        monitoringPlan: { type: 'object' },
        kpis: { type: 'array' },
        monitoringParameters: { type: 'array' },
        dashboardSpecs: { type: 'object' },
        alertThresholds: { type: 'object' },
        reportingSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'wastewater', 'monitoring']
}));

export const optimizationReportTask = defineTask('optimization-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimization Report Generation',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Environmental Engineering Report Writer',
      task: 'Generate comprehensive optimization report',
      context: args,
      instructions: [
        '1. Compile executive summary',
        '2. Document current process assessment',
        '3. Present benchmarking results',
        '4. Summarize modeling findings',
        '5. Detail optimization opportunities',
        '6. Present implementation plan',
        '7. Document expected benefits and ROI',
        '8. Include monitoring plan',
        '9. Provide recommendations',
        '10. Append supporting data'
      ],
      outputFormat: 'JSON with report path, summary, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'recommendations', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'wastewater', 'reporting']
}));
