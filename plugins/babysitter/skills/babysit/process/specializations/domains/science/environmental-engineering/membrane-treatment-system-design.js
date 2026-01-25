/**
 * @process environmental-engineering/membrane-treatment-system-design
 * @description Membrane Treatment System Design - Design and implementation of membrane filtration systems (MF, UF, NF, RO)
 * for water and wastewater applications including pretreatment requirements and concentrate management.
 * @inputs { projectName: string, membraneType: string, feedWaterQuality: object, treatmentObjectives: object }
 * @outputs { success: boolean, systemDesign: object, pretreatmentDesign: object, concentrateManagement: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/membrane-treatment-system-design', {
 *   projectName: 'Advanced Treatment Facility',
 *   membraneType: 'reverse-osmosis',
 *   feedWaterQuality: { TDS: 2000, hardness: 250, silica: 25 },
 *   treatmentObjectives: { permeateQuality: { TDS: 100 }, recovery: 85 }
 * });
 *
 * @references
 * - AWWA Membrane Systems for Water Treatment
 * - WEF Manual of Practice: Membrane Bioreactors
 * - AMTA Technology Transfer Workshop Series
 * - EPA Membrane Filtration Guidance Manual
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    membraneType = 'reverse-osmosis',
    feedWaterQuality = {},
    treatmentObjectives = {},
    systemCapacity = 1.0,
    siteConstraints = {},
    outputDir = 'membrane-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Membrane Treatment System Design: ${projectName}`);
  ctx.log('info', `Membrane Type: ${membraneType}, Capacity: ${systemCapacity} MGD`);

  // ============================================================================
  // PHASE 1: FEED WATER CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Feed Water Characterization');

  const feedCharacterization = await ctx.task(feedCharacterizationTask, {
    projectName,
    membraneType,
    feedWaterQuality,
    outputDir
  });

  artifacts.push(...feedCharacterization.artifacts);

  // ============================================================================
  // PHASE 2: MEMBRANE SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Membrane Selection');

  const membraneSelection = await ctx.task(membraneSelectionTask, {
    projectName,
    membraneType,
    feedCharacterization,
    treatmentObjectives,
    outputDir
  });

  artifacts.push(...membraneSelection.artifacts);

  // ============================================================================
  // PHASE 3: PRETREATMENT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Pretreatment System Design');

  const pretreatmentDesign = await ctx.task(pretreatmentDesignTask, {
    projectName,
    membraneType,
    feedCharacterization,
    membraneSelection,
    outputDir
  });

  artifacts.push(...pretreatmentDesign.artifacts);

  // ============================================================================
  // PHASE 4: SYSTEM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Membrane System Design');

  const systemDesign = await ctx.task(systemDesignTask, {
    projectName,
    membraneType,
    systemCapacity,
    feedCharacterization,
    membraneSelection,
    pretreatmentDesign,
    treatmentObjectives,
    siteConstraints,
    outputDir
  });

  artifacts.push(...systemDesign.artifacts);

  // Breakpoint: System Design Review
  await ctx.breakpoint({
    question: `Membrane system design complete for ${projectName}. Recovery: ${systemDesign.recovery}%, Array: ${systemDesign.arrayConfiguration}. Review design?`,
    title: 'Membrane System Design Review',
    context: {
      runId: ctx.runId,
      systemConfiguration: systemDesign.configuration,
      recovery: systemDesign.recovery,
      permeateQuality: systemDesign.permeateQuality,
      files: systemDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 5: CONCENTRATE MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Concentrate Management Design');

  const concentrateManagement = await ctx.task(concentrateManagementTask, {
    projectName,
    membraneType,
    systemDesign,
    feedCharacterization,
    outputDir
  });

  artifacts.push(...concentrateManagement.artifacts);

  // ============================================================================
  // PHASE 6: CHEMICAL SYSTEMS
  // ============================================================================

  ctx.log('info', 'Phase 6: Chemical Feed Systems Design');

  const chemicalSystems = await ctx.task(chemicalSystemsTask, {
    projectName,
    pretreatmentDesign,
    systemDesign,
    feedCharacterization,
    outputDir
  });

  artifacts.push(...chemicalSystems.artifacts);

  // ============================================================================
  // PHASE 7: INSTRUMENTATION AND CONTROLS
  // ============================================================================

  ctx.log('info', 'Phase 7: Instrumentation and Controls');

  const instrumentationControls = await ctx.task(instrumentationControlsTask, {
    projectName,
    systemDesign,
    pretreatmentDesign,
    chemicalSystems,
    outputDir
  });

  artifacts.push(...instrumentationControls.artifacts);

  // ============================================================================
  // PHASE 8: DESIGN DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Design Documentation');

  const designDocumentation = await ctx.task(designDocumentationTask, {
    projectName,
    feedCharacterization,
    membraneSelection,
    pretreatmentDesign,
    systemDesign,
    concentrateManagement,
    chemicalSystems,
    instrumentationControls,
    outputDir
  });

  artifacts.push(...designDocumentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    systemDesign: {
      membraneType,
      configuration: systemDesign.configuration,
      arrayConfiguration: systemDesign.arrayConfiguration,
      recovery: systemDesign.recovery,
      permeateQuality: systemDesign.permeateQuality,
      capacity: systemCapacity
    },
    pretreatmentDesign: pretreatmentDesign.designSummary,
    concentrateManagement: concentrateManagement.strategy,
    chemicalSystems: chemicalSystems.systemsSummary,
    instrumentationControls: instrumentationControls.controlStrategy,
    costEstimate: systemDesign.costEstimate,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/membrane-treatment-system-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const feedCharacterizationTask = defineTask('feed-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Feed Water Characterization',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Membrane Process Engineer',
      task: 'Characterize feed water for membrane system design',
      context: args,
      instructions: [
        '1. Analyze physical water quality parameters',
        '2. Characterize dissolved solids and ions',
        '3. Assess fouling potential (SDI, MFI)',
        '4. Evaluate scaling potential',
        '5. Identify organic fouling indicators',
        '6. Assess biological fouling potential',
        '7. Analyze seasonal variations',
        '8. Identify problematic constituents',
        '9. Determine temperature range',
        '10. Document feed water characterization'
      ],
      outputFormat: 'JSON with characterization summary, fouling indices, scaling potential'
    },
    outputSchema: {
      type: 'object',
      required: ['characterizationSummary', 'foulingPotential', 'scalingPotential', 'artifacts'],
      properties: {
        characterizationSummary: { type: 'object' },
        waterQualityParameters: { type: 'object' },
        foulingPotential: { type: 'object' },
        scalingPotential: { type: 'object' },
        biologicalFoulingRisk: { type: 'string' },
        problematicConstituents: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'membrane', 'characterization']
}));

export const membraneSelectionTask = defineTask('membrane-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Membrane Selection',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Membrane Selection Specialist',
      task: 'Select optimal membrane elements',
      context: args,
      instructions: [
        '1. Evaluate membrane element options (manufacturers, models)',
        '2. Compare membrane performance characteristics',
        '3. Assess rejection capabilities',
        '4. Evaluate flux rates and recovery',
        '5. Consider fouling resistance',
        '6. Assess chemical compatibility',
        '7. Compare lifecycle costs',
        '8. Review warranty and support',
        '9. Select recommended membrane elements',
        '10. Document selection rationale'
      ],
      outputFormat: 'JSON with selected membranes, performance specs, rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedMembrane', 'performanceSpecs', 'selectionRationale', 'artifacts'],
      properties: {
        selectedMembrane: { type: 'object' },
        alternativeOptions: { type: 'array' },
        performanceSpecs: { type: 'object' },
        rejectionData: { type: 'object' },
        selectionRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'membrane', 'selection']
}));

export const pretreatmentDesignTask = defineTask('pretreatment-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Pretreatment System Design',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Membrane Pretreatment Engineer',
      task: 'Design pretreatment system for membrane protection',
      context: args,
      instructions: [
        '1. Determine pretreatment requirements based on feed water',
        '2. Design particle removal (cartridge filters, media filters)',
        '3. Design scale control (antiscalant, softening)',
        '4. Design biofouling control (chlorination/dechlorination)',
        '5. Design organic removal if needed (coagulation, GAC)',
        '6. Size pretreatment equipment',
        '7. Design chemical feed systems for pretreatment',
        '8. Develop pretreatment process flow',
        '9. Estimate pretreatment costs',
        '10. Document pretreatment design'
      ],
      outputFormat: 'JSON with design summary, equipment sizing, process flow'
    },
    outputSchema: {
      type: 'object',
      required: ['designSummary', 'equipmentList', 'processFlow', 'artifacts'],
      properties: {
        designSummary: { type: 'object' },
        pretreatmentTrain: { type: 'array', items: { type: 'string' } },
        equipmentList: { type: 'array' },
        equipmentSizing: { type: 'object' },
        chemicalRequirements: { type: 'object' },
        processFlow: { type: 'object' },
        costEstimate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'membrane', 'pretreatment']
}));

export const systemDesignTask = defineTask('system-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Membrane System Design',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Membrane System Design Engineer',
      task: 'Design membrane system array and configuration',
      context: args,
      instructions: [
        '1. Determine system recovery rate',
        '2. Design array configuration (stages, passes)',
        '3. Calculate number of vessels and elements',
        '4. Design interstage pumping',
        '5. Design permeate and concentrate piping',
        '6. Develop hydraulic design',
        '7. Design cleaning system (CIP)',
        '8. Develop operating conditions',
        '9. Estimate capital and O&M costs',
        '10. Document system design'
      ],
      outputFormat: 'JSON with configuration, array design, hydraulics, costs'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'arrayConfiguration', 'recovery', 'permeateQuality', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        arrayConfiguration: { type: 'string' },
        numberOfVessels: { type: 'number' },
        elementsPerVessel: { type: 'number' },
        recovery: { type: 'number' },
        permeateQuality: { type: 'object' },
        operatingPressure: { type: 'number' },
        fluxRate: { type: 'number' },
        cipSystem: { type: 'object' },
        costEstimate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'membrane', 'system-design']
}));

export const concentrateManagementTask = defineTask('concentrate-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Concentrate Management Design',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Concentrate Management Specialist',
      task: 'Design concentrate management strategy',
      context: args,
      instructions: [
        '1. Characterize concentrate quality and quantity',
        '2. Evaluate disposal options (surface water, sewer, deep well)',
        '3. Evaluate concentrate treatment options',
        '4. Assess zero liquid discharge (ZLD) feasibility',
        '5. Design selected concentrate management approach',
        '6. Evaluate regulatory requirements',
        '7. Design evaporation/crystallization if applicable',
        '8. Estimate concentrate management costs',
        '9. Assess environmental impacts',
        '10. Document concentrate management plan'
      ],
      outputFormat: 'JSON with strategy, disposal options, treatment design, costs'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'disposalOptions', 'selectedApproach', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        concentrateCharacteristics: { type: 'object' },
        disposalOptions: { type: 'array' },
        selectedApproach: { type: 'string' },
        treatmentDesign: { type: 'object' },
        regulatoryRequirements: { type: 'array' },
        costEstimate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'membrane', 'concentrate']
}));

export const chemicalSystemsTask = defineTask('chemical-systems', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Chemical Feed Systems Design',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Chemical Systems Engineer',
      task: 'Design chemical feed systems for membrane facility',
      context: args,
      instructions: [
        '1. Identify all chemical requirements',
        '2. Design antiscalant feed system',
        '3. Design pH adjustment systems',
        '4. Design biocide feed systems',
        '5. Design CIP chemical systems',
        '6. Design chemical storage facilities',
        '7. Design containment and safety features',
        '8. Specify chemical metering equipment',
        '9. Estimate chemical costs',
        '10. Document chemical systems design'
      ],
      outputFormat: 'JSON with systems summary, equipment, storage requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['systemsSummary', 'chemicalList', 'equipmentSpecs', 'artifacts'],
      properties: {
        systemsSummary: { type: 'object' },
        chemicalList: { type: 'array' },
        feedRates: { type: 'object' },
        storageRequirements: { type: 'object' },
        equipmentSpecs: { type: 'array' },
        safetyFeatures: { type: 'array' },
        annualChemicalCosts: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'membrane', 'chemicals']
}));

export const instrumentationControlsTask = defineTask('instrumentation-controls', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Instrumentation and Controls Design',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Instrumentation and Controls Engineer',
      task: 'Design I&C system for membrane facility',
      context: args,
      instructions: [
        '1. Define control philosophy',
        '2. Identify instrumentation requirements',
        '3. Design flow monitoring systems',
        '4. Design pressure monitoring systems',
        '5. Design water quality analyzers',
        '6. Design PLC/SCADA system',
        '7. Develop control sequences',
        '8. Design alarm management system',
        '9. Integrate with existing systems',
        '10. Document I&C design'
      ],
      outputFormat: 'JSON with control strategy, instrument list, SCADA design'
    },
    outputSchema: {
      type: 'object',
      required: ['controlStrategy', 'instrumentList', 'scadaDesign', 'artifacts'],
      properties: {
        controlStrategy: { type: 'object' },
        instrumentList: { type: 'array' },
        controlLoops: { type: 'array' },
        scadaDesign: { type: 'object' },
        alarmManagement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'membrane', 'controls']
}));

export const designDocumentationTask = defineTask('design-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Documentation',
  agent: {
    name: 'water-treatment-specialist',
    prompt: {
      role: 'Environmental Engineering Technical Writer',
      task: 'Compile comprehensive design documentation',
      context: args,
      instructions: [
        '1. Prepare design basis document',
        '2. Compile equipment specifications',
        '3. Prepare process flow diagrams',
        '4. Develop P&IDs',
        '5. Prepare equipment data sheets',
        '6. Compile O&M requirements',
        '7. Prepare commissioning plan',
        '8. Develop performance testing protocols',
        '9. Compile cost estimates',
        '10. Generate design report'
      ],
      outputFormat: 'JSON with document list, design report path, key specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['documentList', 'designReportPath', 'keySpecifications', 'artifacts'],
      properties: {
        documentList: { type: 'array' },
        designReportPath: { type: 'string' },
        keySpecifications: { type: 'object' },
        commissioningPlan: { type: 'object' },
        performanceTestProtocols: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'membrane', 'documentation']
}));
