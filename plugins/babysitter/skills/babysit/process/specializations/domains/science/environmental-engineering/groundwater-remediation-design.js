/**
 * @process environmental-engineering/groundwater-remediation-design
 * @description Groundwater Remediation Design - Design of groundwater treatment systems including pump-and-treat,
 * in-situ treatment, and monitored natural attenuation.
 * @inputs { siteName: string, contaminants: array, hydrogeology: object, remediationApproach: string }
 * @outputs { success: boolean, remediationDesign: object, systemSpecifications: object, monitoringPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/groundwater-remediation-design', {
 *   siteName: 'Industrial Site Groundwater',
 *   contaminants: ['TCE', 'PCE', 'vinyl-chloride'],
 *   hydrogeology: { aquiferType: 'unconfined', conductivity: 1e-4, gradient: 0.01 },
 *   remediationApproach: 'in-situ-chemical-oxidation'
 * });
 *
 * @references
 * - EPA Groundwater Remediation Technologies
 * - ITRC In Situ Remediation Guidance
 * - EPA Monitored Natural Attenuation Guidance
 * - ASCE Groundwater Contamination and Remediation
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    siteName,
    contaminants = [],
    hydrogeology = {},
    remediationApproach = 'pump-and-treat',
    plumeCharacteristics = {},
    remediationGoals = {},
    outputDir = 'groundwater-remediation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Groundwater Remediation Design: ${siteName}`);
  ctx.log('info', `Approach: ${remediationApproach}, Contaminants: ${contaminants.join(', ')}`);

  // ============================================================================
  // PHASE 1: HYDROGEOLOGIC ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Hydrogeologic Analysis');

  const hydrogeologicAnalysis = await ctx.task(hydrogeologicAnalysisTask, {
    siteName,
    hydrogeology,
    plumeCharacteristics,
    outputDir
  });

  artifacts.push(...hydrogeologicAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: CONTAMINANT FATE AND TRANSPORT
  // ============================================================================

  ctx.log('info', 'Phase 2: Fate and Transport Modeling');

  const fateAndTransport = await ctx.task(fateTransportTask, {
    siteName,
    contaminants,
    hydrogeologicAnalysis,
    plumeCharacteristics,
    outputDir
  });

  artifacts.push(...fateAndTransport.artifacts);

  // ============================================================================
  // PHASE 3: REMEDIATION SYSTEM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Remediation System Design');

  const systemDesign = await ctx.task(gwRemediationDesignTask, {
    siteName,
    remediationApproach,
    contaminants,
    hydrogeologicAnalysis,
    fateAndTransport,
    remediationGoals,
    outputDir
  });

  artifacts.push(...systemDesign.artifacts);

  // Breakpoint: Design Review
  await ctx.breakpoint({
    question: `Groundwater remediation design complete for ${siteName}. Approach: ${remediationApproach}. Review system design?`,
    title: 'Groundwater Remediation Design Review',
    context: {
      runId: ctx.runId,
      systemConfiguration: systemDesign.systemConfiguration,
      designCapacity: systemDesign.designCapacity,
      estimatedTimeframe: systemDesign.estimatedTimeframe,
      files: systemDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 4: MONITORING NETWORK DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Monitoring Network Design');

  const monitoringNetwork = await ctx.task(monitoringNetworkTask, {
    siteName,
    systemDesign,
    hydrogeologicAnalysis,
    contaminants,
    outputDir
  });

  artifacts.push(...monitoringNetwork.artifacts);

  // ============================================================================
  // PHASE 5: PERFORMANCE MONITORING PLAN
  // ============================================================================

  ctx.log('info', 'Phase 5: Performance Monitoring Plan');

  const performanceMonitoring = await ctx.task(performanceMonitoringTask, {
    siteName,
    systemDesign,
    monitoringNetwork,
    remediationGoals,
    outputDir
  });

  artifacts.push(...performanceMonitoring.artifacts);

  // ============================================================================
  // PHASE 6: COST AND SCHEDULE
  // ============================================================================

  ctx.log('info', 'Phase 6: Cost and Schedule Estimation');

  const costSchedule = await ctx.task(gwCostScheduleTask, {
    siteName,
    systemDesign,
    monitoringNetwork,
    outputDir
  });

  artifacts.push(...costSchedule.artifacts);

  // ============================================================================
  // PHASE 7: DESIGN DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Design Documentation');

  const designDocs = await ctx.task(gwDesignDocsTask, {
    siteName,
    hydrogeologicAnalysis,
    fateAndTransport,
    systemDesign,
    monitoringNetwork,
    performanceMonitoring,
    costSchedule,
    outputDir
  });

  artifacts.push(...designDocs.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    siteName,
    remediationDesign: {
      approach: remediationApproach,
      systemConfiguration: systemDesign.systemConfiguration,
      designCapacity: systemDesign.designCapacity,
      estimatedTimeframe: systemDesign.estimatedTimeframe
    },
    systemSpecifications: systemDesign.specifications,
    monitoringPlan: {
      network: monitoringNetwork.wellNetwork,
      parameters: performanceMonitoring.monitoringParameters,
      frequency: performanceMonitoring.monitoringFrequency
    },
    costEstimate: costSchedule.costEstimate,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/groundwater-remediation-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const hydrogeologicAnalysisTask = defineTask('hydrogeologic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hydrogeologic Analysis',
  agent: {
    name: 'hydrogeology-specialist',
    prompt: {
      role: 'Hydrogeologist',
      task: 'Analyze site hydrogeology for remediation design',
      context: args,
      instructions: [
        '1. Characterize aquifer properties',
        '2. Determine hydraulic conductivity distribution',
        '3. Map groundwater flow direction and gradient',
        '4. Identify confining units and preferential pathways',
        '5. Determine aquifer thickness and extent',
        '6. Evaluate seasonal variations',
        '7. Assess recharge and discharge zones',
        '8. Develop potentiometric surface maps',
        '9. Identify capture zone requirements',
        '10. Document hydrogeologic conceptual model'
      ],
      outputFormat: 'JSON with aquifer properties, flow characteristics, conceptual model'
    },
    outputSchema: {
      type: 'object',
      required: ['aquiferProperties', 'flowCharacteristics', 'conceptualModel', 'artifacts'],
      properties: {
        aquiferProperties: { type: 'object' },
        flowCharacteristics: { type: 'object' },
        hydraulicConductivity: { type: 'object' },
        potentiometricSurface: { type: 'object' },
        conceptualModel: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'groundwater', 'hydrogeology']
}));

export const fateTransportTask = defineTask('fate-transport', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fate and Transport Modeling',
  agent: {
    name: 'hydrogeology-specialist',
    prompt: {
      role: 'Contaminant Transport Modeler',
      task: 'Model contaminant fate and transport',
      context: args,
      instructions: [
        '1. Select appropriate modeling tools (MODFLOW, MT3D)',
        '2. Develop groundwater flow model',
        '3. Calibrate flow model to site data',
        '4. Develop contaminant transport model',
        '5. Incorporate retardation and degradation',
        '6. Simulate current plume conditions',
        '7. Simulate future plume migration',
        '8. Evaluate natural attenuation potential',
        '9. Conduct sensitivity analysis',
        '10. Document modeling results'
      ],
      outputFormat: 'JSON with model results, plume predictions, attenuation rates'
    },
    outputSchema: {
      type: 'object',
      required: ['modelResults', 'plumePredictions', 'attenuationRates', 'artifacts'],
      properties: {
        modelConfiguration: { type: 'object' },
        modelResults: { type: 'object' },
        calibrationResults: { type: 'object' },
        plumePredictions: { type: 'object' },
        attenuationRates: { type: 'object' },
        sensitivityAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'groundwater', 'fate-transport']
}));

export const gwRemediationDesignTask = defineTask('gw-remediation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Remediation System Design',
  agent: {
    name: 'hydrogeology-specialist',
    prompt: {
      role: 'Groundwater Remediation Engineer',
      task: 'Design groundwater remediation system',
      context: args,
      instructions: [
        '1. Design extraction/injection well network',
        '2. Size pumping system',
        '3. Design treatment system (if pump-and-treat)',
        '4. Design injection system (if in-situ)',
        '5. Develop capture zone analysis',
        '6. Design piping and conveyance',
        '7. Design discharge system',
        '8. Specify instrumentation and controls',
        '9. Estimate remediation timeframe',
        '10. Document system design'
      ],
      outputFormat: 'JSON with system configuration, specifications, timeframe'
    },
    outputSchema: {
      type: 'object',
      required: ['systemConfiguration', 'specifications', 'designCapacity', 'estimatedTimeframe', 'artifacts'],
      properties: {
        systemConfiguration: { type: 'object' },
        wellNetwork: { type: 'array' },
        pumpingRates: { type: 'object' },
        treatmentDesign: { type: 'object' },
        specifications: { type: 'object' },
        designCapacity: { type: 'object' },
        estimatedTimeframe: { type: 'string' },
        captureZoneAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'groundwater', 'remediation-design']
}));

export const monitoringNetworkTask = defineTask('monitoring-network', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitoring Network Design',
  agent: {
    name: 'hydrogeology-specialist',
    prompt: {
      role: 'Groundwater Monitoring Specialist',
      task: 'Design monitoring well network',
      context: args,
      instructions: [
        '1. Design performance monitoring wells',
        '2. Design sentinel monitoring wells',
        '3. Design compliance monitoring points',
        '4. Specify well construction details',
        '5. Design piezometers for water levels',
        '6. Plan well development procedures',
        '7. Design sampling access features',
        '8. Develop well naming convention',
        '9. Create monitoring network map',
        '10. Document monitoring network design'
      ],
      outputFormat: 'JSON with well network, well details, network map'
    },
    outputSchema: {
      type: 'object',
      required: ['wellNetwork', 'wellDetails', 'networkConfiguration', 'artifacts'],
      properties: {
        wellNetwork: { type: 'array' },
        performanceWells: { type: 'array' },
        sentinelWells: { type: 'array' },
        complianceWells: { type: 'array' },
        wellDetails: { type: 'object' },
        networkConfiguration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'groundwater', 'monitoring']
}));

export const performanceMonitoringTask = defineTask('performance-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Performance Monitoring Plan',
  agent: {
    name: 'hydrogeology-specialist',
    prompt: {
      role: 'Remediation Performance Specialist',
      task: 'Develop performance monitoring plan',
      context: args,
      instructions: [
        '1. Define performance metrics',
        '2. Specify monitoring parameters',
        '3. Establish monitoring frequency',
        '4. Define sampling protocols',
        '5. Develop QA/QC requirements',
        '6. Establish data evaluation procedures',
        '7. Define contingency triggers',
        '8. Develop reporting requirements',
        '9. Plan for optimization adjustments',
        '10. Document monitoring plan'
      ],
      outputFormat: 'JSON with monitoring parameters, frequency, metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoringParameters', 'monitoringFrequency', 'performanceMetrics', 'artifacts'],
      properties: {
        performanceMetrics: { type: 'array' },
        monitoringParameters: { type: 'array' },
        monitoringFrequency: { type: 'object' },
        samplingProtocols: { type: 'object' },
        qaqcRequirements: { type: 'object' },
        contingencyTriggers: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'groundwater', 'performance']
}));

export const gwCostScheduleTask = defineTask('gw-cost-schedule', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cost and Schedule Estimation',
  agent: {
    name: 'hydrogeology-specialist',
    prompt: {
      role: 'Remediation Cost Estimator',
      task: 'Estimate remediation costs and schedule',
      context: args,
      instructions: [
        '1. Estimate capital costs',
        '2. Estimate O&M costs',
        '3. Estimate monitoring costs',
        '4. Calculate lifecycle costs',
        '5. Develop implementation schedule',
        '6. Identify critical path',
        '7. Estimate remediation duration',
        '8. Develop cost contingency',
        '9. Create cash flow projections',
        '10. Document cost and schedule'
      ],
      outputFormat: 'JSON with cost estimate, schedule, lifecycle analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['costEstimate', 'schedule', 'lifecycleCost', 'artifacts'],
      properties: {
        costEstimate: { type: 'object' },
        capitalCosts: { type: 'object' },
        omCosts: { type: 'object' },
        monitoringCosts: { type: 'object' },
        lifecycleCost: { type: 'object' },
        schedule: { type: 'object' },
        criticalPath: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'groundwater', 'cost']
}));

export const gwDesignDocsTask = defineTask('gw-design-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Documentation',
  agent: {
    name: 'hydrogeology-specialist',
    prompt: {
      role: 'Groundwater Remediation Document Specialist',
      task: 'Compile design documentation package',
      context: args,
      instructions: [
        '1. Prepare design basis document',
        '2. Compile hydrogeologic analysis',
        '3. Document modeling results',
        '4. Prepare design drawings',
        '5. Compile equipment specifications',
        '6. Prepare O&M manual',
        '7. Compile monitoring plan',
        '8. Prepare construction specifications',
        '9. Prepare permit applications',
        '10. Generate design report'
      ],
      outputFormat: 'JSON with document list, report path'
    },
    outputSchema: {
      type: 'object',
      required: ['documentList', 'reportPath', 'artifacts'],
      properties: {
        documentList: { type: 'array' },
        reportPath: { type: 'string' },
        designDrawings: { type: 'array' },
        specifications: { type: 'array' },
        omManual: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'groundwater', 'documentation']
}));
