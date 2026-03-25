/**
 * @process environmental-engineering/water-treatment-plant-design
 * @description Water Treatment Plant Design - Systematic approach to designing municipal and industrial water treatment
 * facilities including source characterization, process selection, pilot testing, and detailed engineering design.
 * @inputs { projectName: string, sourceWaterType: string, designCapacity: number, effluent​Requirements: object, siteConstraints?: object }
 * @outputs { success: boolean, designPackage: object, processTrainSelection: array, pilotTestPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/water-treatment-plant-design', {
 *   projectName: 'Municipal WTP Expansion',
 *   sourceWaterType: 'surface-water',
 *   designCapacity: 50, // MGD
 *   effluentRequirements: { turbidity: 0.5, TOC: 2.0, disinfectionByproducts: 'Stage 2 D/DBP Rule' },
 *   siteConstraints: { footprint: 'limited', existingInfrastructure: true }
 * });
 *
 * @references
 * - AWWA Water Treatment Plant Design Handbook
 * - EPA Drinking Water Treatment Technologies
 * - Ten States Standards for Water Works
 * - ASCE/AWWA Design Standards
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sourceWaterType = 'surface-water',
    designCapacity,
    effluentRequirements = {},
    siteConstraints = {},
    regulatoryFramework = 'SDWA',
    climateConsiderations = true,
    resiliencyRequirements = {},
    outputDir = 'water-treatment-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Water Treatment Plant Design: ${projectName}`);
  ctx.log('info', `Source Water Type: ${sourceWaterType}, Design Capacity: ${designCapacity} MGD`);

  // ============================================================================
  // PHASE 1: SOURCE WATER CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Source Water Characterization');

  const sourceCharacterization = await ctx.task(sourceWaterCharacterizationTask, {
    projectName,
    sourceWaterType,
    effluentRequirements,
    outputDir
  });

  artifacts.push(...sourceCharacterization.artifacts);

  // ============================================================================
  // PHASE 2: REGULATORY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Regulatory Requirements Analysis');

  const regulatoryAnalysis = await ctx.task(regulatoryAnalysisTask, {
    projectName,
    sourceWaterType,
    effluentRequirements,
    regulatoryFramework,
    sourceCharacterization,
    outputDir
  });

  artifacts.push(...regulatoryAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: PROCESS SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Treatment Process Selection');

  const processSelection = await ctx.task(processSelectionTask, {
    projectName,
    sourceWaterType,
    designCapacity,
    sourceCharacterization,
    regulatoryAnalysis,
    siteConstraints,
    outputDir
  });

  artifacts.push(...processSelection.artifacts);

  // Breakpoint: Process Selection Review
  await ctx.breakpoint({
    question: `Process train selected for ${projectName}. Primary processes: ${processSelection.recommendedProcessTrain.join(' -> ')}. Review and approve process selection?`,
    title: 'Treatment Process Selection Review',
    context: {
      runId: ctx.runId,
      processTrainOptions: processSelection.processTrainOptions,
      recommendedTrain: processSelection.recommendedProcessTrain,
      selectionRationale: processSelection.selectionRationale,
      files: processSelection.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 4: PILOT TESTING PLAN
  // ============================================================================

  ctx.log('info', 'Phase 4: Pilot Testing Plan Development');

  const pilotTestPlan = await ctx.task(pilotTestingPlanTask, {
    projectName,
    processSelection,
    sourceCharacterization,
    designCapacity,
    outputDir
  });

  artifacts.push(...pilotTestPlan.artifacts);

  // ============================================================================
  // PHASE 5: PRELIMINARY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Preliminary Engineering Design');

  const preliminaryDesign = await ctx.task(preliminaryDesignTask, {
    projectName,
    designCapacity,
    processSelection,
    siteConstraints,
    pilotTestPlan,
    climateConsiderations,
    resiliencyRequirements,
    outputDir
  });

  artifacts.push(...preliminaryDesign.artifacts);

  // ============================================================================
  // PHASE 6: HYDRAULIC ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Hydraulic Analysis and Profile');

  const hydraulicAnalysis = await ctx.task(hydraulicAnalysisTask, {
    projectName,
    designCapacity,
    processSelection,
    preliminaryDesign,
    siteConstraints,
    outputDir
  });

  artifacts.push(...hydraulicAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: DETAILED DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 7: Detailed Engineering Design');

  const detailedDesign = await ctx.task(detailedDesignTask, {
    projectName,
    designCapacity,
    processSelection,
    preliminaryDesign,
    hydraulicAnalysis,
    effluentRequirements,
    outputDir
  });

  artifacts.push(...detailedDesign.artifacts);

  // Breakpoint: Detailed Design Review
  await ctx.breakpoint({
    question: `Detailed design complete for ${projectName}. Total estimated cost: ${detailedDesign.costEstimate}. Review design package?`,
    title: 'Detailed Design Review',
    context: {
      runId: ctx.runId,
      designSummary: detailedDesign.designSummary,
      costEstimate: detailedDesign.costEstimate,
      constructionSchedule: detailedDesign.constructionSchedule,
      files: detailedDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 8: O&M PLAN DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Operations and Maintenance Plan');

  const omPlan = await ctx.task(omPlanTask, {
    projectName,
    processSelection,
    detailedDesign,
    outputDir
  });

  artifacts.push(...omPlan.artifacts);

  // ============================================================================
  // PHASE 9: DESIGN REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating Design Report');

  const designReport = await ctx.task(designReportTask, {
    projectName,
    sourceCharacterization,
    regulatoryAnalysis,
    processSelection,
    pilotTestPlan,
    preliminaryDesign,
    hydraulicAnalysis,
    detailedDesign,
    omPlan,
    outputDir
  });

  artifacts.push(...designReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    designPackage: {
      sourceCharacterization: sourceCharacterization.characterizationSummary,
      regulatoryRequirements: regulatoryAnalysis.requirements,
      processTrainSelection: processSelection.recommendedProcessTrain,
      preliminaryDesign: preliminaryDesign.designSummary,
      detailedDesign: detailedDesign.designSummary,
      costEstimate: detailedDesign.costEstimate
    },
    processTrainSelection: processSelection.recommendedProcessTrain,
    pilotTestPlan: pilotTestPlan.testingPlan,
    hydraulicProfile: hydraulicAnalysis.hydraulicProfile,
    omRequirements: omPlan.operationalRequirements,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/water-treatment-plant-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const sourceWaterCharacterizationTask = defineTask('source-water-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Source Water Characterization',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Water Quality Engineer',
      task: 'Characterize source water quality and variability',
      context: args,
      instructions: [
        '1. Review historical water quality data',
        '2. Identify seasonal variations in source water quality',
        '3. Characterize physical parameters (turbidity, temperature, color)',
        '4. Characterize chemical parameters (pH, alkalinity, hardness, TOC, DBP precursors)',
        '5. Characterize microbiological parameters',
        '6. Identify contaminants of concern',
        '7. Assess source water vulnerability',
        '8. Develop design water quality scenarios (average, peak, extreme)',
        '9. Create source water characterization report',
        '10. Recommend additional monitoring if needed'
      ],
      outputFormat: 'JSON with characterization summary, quality parameters, variability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['characterizationSummary', 'qualityParameters', 'artifacts'],
      properties: {
        characterizationSummary: { type: 'object' },
        qualityParameters: { type: 'object' },
        seasonalVariations: { type: 'object' },
        contaminantsOfConcern: { type: 'array', items: { type: 'string' } },
        designScenarios: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'water-treatment', 'characterization']
}));

export const regulatoryAnalysisTask = defineTask('regulatory-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Regulatory Requirements Analysis',
  agent: {
    name: 'environmental-compliance-specialist',
    prompt: {
      role: 'Environmental Compliance Specialist',
      task: 'Analyze regulatory requirements for water treatment',
      context: args,
      instructions: [
        '1. Identify applicable federal regulations (SDWA, DBP Rules, LT2)',
        '2. Identify state drinking water regulations',
        '3. Determine primary MCLs and treatment technique requirements',
        '4. Assess secondary standards applicability',
        '5. Identify source water protection requirements',
        '6. Determine monitoring and reporting requirements',
        '7. Assess future regulatory considerations',
        '8. Document treatment technique requirements',
        '9. Create regulatory compliance matrix',
        '10. Identify permit requirements'
      ],
      outputFormat: 'JSON with requirements, compliance matrix, permit needs'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'complianceMatrix', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        complianceMatrix: { type: 'array' },
        permitRequirements: { type: 'array', items: { type: 'string' } },
        futureRegulations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'water-treatment', 'regulatory']
}));

export const processSelectionTask = defineTask('process-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Treatment Process Selection',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Water Treatment Process Engineer',
      task: 'Select optimal treatment process train',
      context: args,
      instructions: [
        '1. Identify treatment objectives based on source water and regulations',
        '2. Evaluate conventional treatment options',
        '3. Evaluate advanced treatment options (membrane, ozone, UV, GAC)',
        '4. Develop multiple process train alternatives',
        '5. Perform comparative analysis (performance, cost, complexity)',
        '6. Consider site constraints and footprint',
        '7. Evaluate chemical requirements and residuals handling',
        '8. Assess operator skill requirements',
        '9. Select recommended process train',
        '10. Document selection rationale'
      ],
      outputFormat: 'JSON with process train options, recommended train, selection rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['processTrainOptions', 'recommendedProcessTrain', 'selectionRationale', 'artifacts'],
      properties: {
        processTrainOptions: { type: 'array' },
        recommendedProcessTrain: { type: 'array', items: { type: 'string' } },
        selectionRationale: { type: 'string' },
        comparativeAnalysis: { type: 'object' },
        chemicalRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'water-treatment', 'process-selection']
}));

export const pilotTestingPlanTask = defineTask('pilot-testing-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Pilot Testing Plan Development',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Water Treatment Pilot Testing Specialist',
      task: 'Develop pilot testing plan for process verification',
      context: args,
      instructions: [
        '1. Identify processes requiring pilot testing',
        '2. Define pilot testing objectives',
        '3. Specify pilot unit sizing and configuration',
        '4. Develop testing protocol and parameters',
        '5. Define water quality monitoring requirements',
        '6. Establish test duration and seasonal considerations',
        '7. Develop QA/QC procedures',
        '8. Estimate pilot testing costs',
        '9. Create pilot testing schedule',
        '10. Define success criteria'
      ],
      outputFormat: 'JSON with testing plan, protocol, schedule, success criteria'
    },
    outputSchema: {
      type: 'object',
      required: ['testingPlan', 'protocols', 'successCriteria', 'artifacts'],
      properties: {
        testingPlan: { type: 'object' },
        protocols: { type: 'array' },
        pilotUnits: { type: 'array' },
        monitoringRequirements: { type: 'object' },
        schedule: { type: 'object' },
        successCriteria: { type: 'object' },
        costEstimate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'water-treatment', 'pilot-testing']
}));

export const preliminaryDesignTask = defineTask('preliminary-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Preliminary Engineering Design',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Water Treatment Design Engineer',
      task: 'Develop preliminary engineering design',
      context: args,
      instructions: [
        '1. Develop process flow diagram (PFD)',
        '2. Size major treatment units',
        '3. Develop site layout and general arrangement',
        '4. Estimate chemical storage and feed requirements',
        '5. Design residuals handling facilities',
        '6. Develop utility requirements',
        '7. Assess climate resilience requirements',
        '8. Develop preliminary cost estimate (Class 4)',
        '9. Create preliminary construction schedule',
        '10. Identify design alternatives for value engineering'
      ],
      outputFormat: 'JSON with design summary, equipment sizing, cost estimate'
    },
    outputSchema: {
      type: 'object',
      required: ['designSummary', 'equipmentSizing', 'costEstimate', 'artifacts'],
      properties: {
        designSummary: { type: 'object' },
        processFlowDiagram: { type: 'string' },
        equipmentSizing: { type: 'object' },
        siteLayout: { type: 'object' },
        chemicalRequirements: { type: 'object' },
        residualsHandling: { type: 'object' },
        costEstimate: { type: 'string' },
        schedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'water-treatment', 'preliminary-design']
}));

export const hydraulicAnalysisTask = defineTask('hydraulic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hydraulic Analysis and Profile',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Hydraulic Design Engineer',
      task: 'Perform hydraulic analysis and develop hydraulic profile',
      context: args,
      instructions: [
        '1. Develop hydraulic profile through treatment train',
        '2. Calculate head losses through each unit process',
        '3. Size interconnecting piping',
        '4. Design flow splitting and distribution',
        '5. Evaluate pumping requirements',
        '6. Analyze peak flow conditions',
        '7. Design overflow and bypass provisions',
        '8. Assess flood protection requirements',
        '9. Verify hydraulic grade line',
        '10. Document hydraulic design criteria'
      ],
      outputFormat: 'JSON with hydraulic profile, head losses, pumping requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['hydraulicProfile', 'headLosses', 'pumpingRequirements', 'artifacts'],
      properties: {
        hydraulicProfile: { type: 'object' },
        headLosses: { type: 'object' },
        pumpingRequirements: { type: 'object' },
        pipingSizes: { type: 'object' },
        flowDistribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'water-treatment', 'hydraulics']
}));

export const detailedDesignTask = defineTask('detailed-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detailed Engineering Design',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Senior Water Treatment Design Engineer',
      task: 'Develop detailed engineering design package',
      context: args,
      instructions: [
        '1. Finalize equipment specifications',
        '2. Develop P&IDs for all systems',
        '3. Design structural elements',
        '4. Design electrical systems',
        '5. Design instrumentation and control systems',
        '6. Develop SCADA architecture',
        '7. Design HVAC systems',
        '8. Prepare detailed cost estimate (Class 2)',
        '9. Develop construction phasing plan',
        '10. Prepare technical specifications'
      ],
      outputFormat: 'JSON with design summary, specifications, cost estimate, schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['designSummary', 'specifications', 'costEstimate', 'constructionSchedule', 'artifacts'],
      properties: {
        designSummary: { type: 'object' },
        specifications: { type: 'array' },
        pids: { type: 'array' },
        scadaArchitecture: { type: 'object' },
        costEstimate: { type: 'string' },
        constructionSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'water-treatment', 'detailed-design']
}));

export const omPlanTask = defineTask('om-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Operations and Maintenance Plan',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Water Treatment O&M Specialist',
      task: 'Develop operations and maintenance plan',
      context: args,
      instructions: [
        '1. Develop standard operating procedures (SOPs)',
        '2. Define staffing requirements',
        '3. Develop maintenance schedules',
        '4. Define chemical handling procedures',
        '5. Develop safety procedures',
        '6. Create emergency response procedures',
        '7. Develop training requirements',
        '8. Estimate annual O&M costs',
        '9. Develop performance monitoring plan',
        '10. Create spare parts inventory list'
      ],
      outputFormat: 'JSON with operational requirements, SOPs, maintenance schedules, costs'
    },
    outputSchema: {
      type: 'object',
      required: ['operationalRequirements', 'maintenanceSchedule', 'omCostEstimate', 'artifacts'],
      properties: {
        operationalRequirements: { type: 'object' },
        sops: { type: 'array' },
        staffingRequirements: { type: 'object' },
        maintenanceSchedule: { type: 'object' },
        chemicalHandling: { type: 'object' },
        safetyProcedures: { type: 'array' },
        omCostEstimate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'water-treatment', 'operations']
}));

export const designReportTask = defineTask('design-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Report Generation',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Water Treatment Project Manager',
      task: 'Generate comprehensive design report',
      context: args,
      instructions: [
        '1. Compile executive summary',
        '2. Document project background and objectives',
        '3. Summarize source water characterization',
        '4. Present process selection analysis',
        '5. Summarize pilot testing plan and results',
        '6. Present preliminary and detailed design',
        '7. Include hydraulic analysis',
        '8. Present cost estimates and schedule',
        '9. Document O&M considerations',
        '10. Provide recommendations and next steps'
      ],
      outputFormat: 'JSON with report path, key findings, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'recommendations', 'artifacts'],
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
  labels: ['agent', 'environmental-engineering', 'water-treatment', 'reporting']
}));
