/**
 * @process environmental-engineering/air-pollution-control-system-design
 * @description Air Pollution Control System Design - Selection and design of air pollution control equipment
 * (scrubbers, baghouses, ESPs, thermal oxidizers) based on emission characteristics and regulatory requirements.
 * @inputs { projectName: string, emissionSource: object, pollutants: array, controlObjectives: object }
 * @outputs { success: boolean, controlSystemDesign: object, performanceSpecifications: object, costEstimate: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/air-pollution-control-system-design', {
 *   projectName: 'Boiler Emission Control',
 *   emissionSource: { type: 'combustion', flowRate: 50000, temperature: 350 },
 *   pollutants: ['PM', 'SO2', 'NOx'],
 *   controlObjectives: { pmRemoval: 99, so2Removal: 95 }
 * });
 *
 * @references
 * - EPA Air Pollution Control Technology Fact Sheets
 * - AWMA Air Pollution Control Manual
 * - EPA Cost Manual for Air Pollution Control
 * - Industrial Ventilation: A Manual of Recommended Practice
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    emissionSource = {},
    pollutants = [],
    controlObjectives = {},
    siteConstraints = {},
    outputDir = 'air-control-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Air Pollution Control System Design: ${projectName}`);
  ctx.log('info', `Pollutants: ${pollutants.join(', ')}`);

  // ============================================================================
  // PHASE 1: EMISSION CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Emission Source Characterization');

  const emissionCharacterization = await ctx.task(emissionCharacterizationTask, {
    projectName,
    emissionSource,
    pollutants,
    outputDir
  });

  artifacts.push(...emissionCharacterization.artifacts);

  // ============================================================================
  // PHASE 2: CONTROL TECHNOLOGY SCREENING
  // ============================================================================

  ctx.log('info', 'Phase 2: Control Technology Screening');

  const techScreening = await ctx.task(controlTechScreeningTask, {
    projectName,
    emissionCharacterization,
    pollutants,
    controlObjectives,
    siteConstraints,
    outputDir
  });

  artifacts.push(...techScreening.artifacts);

  // ============================================================================
  // PHASE 3: DETAILED DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Detailed Control System Design');

  const detailedDesign = await ctx.task(controlSystemDesignTask, {
    projectName,
    emissionCharacterization,
    techScreening,
    controlObjectives,
    outputDir
  });

  artifacts.push(...detailedDesign.artifacts);

  // Breakpoint: Design Review
  await ctx.breakpoint({
    question: `Control system design complete for ${projectName}. Selected technology: ${detailedDesign.selectedTechnology}. Review design specifications?`,
    title: 'Control System Design Review',
    context: {
      runId: ctx.runId,
      selectedTechnology: detailedDesign.selectedTechnology,
      designSpecifications: detailedDesign.specifications,
      expectedPerformance: detailedDesign.expectedPerformance,
      files: detailedDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 4: AUXILIARY SYSTEMS DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Auxiliary Systems Design');

  const auxiliarySystems = await ctx.task(auxiliarySystemsTask, {
    projectName,
    detailedDesign,
    emissionCharacterization,
    outputDir
  });

  artifacts.push(...auxiliarySystems.artifacts);

  // ============================================================================
  // PHASE 5: PERFORMANCE TESTING PLAN
  // ============================================================================

  ctx.log('info', 'Phase 5: Performance Testing Plan');

  const testingPlan = await ctx.task(performanceTestingPlanTask, {
    projectName,
    detailedDesign,
    controlObjectives,
    outputDir
  });

  artifacts.push(...testingPlan.artifacts);

  // ============================================================================
  // PHASE 6: COST ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Cost Analysis');

  const costAnalysis = await ctx.task(controlCostAnalysisTask, {
    projectName,
    detailedDesign,
    auxiliarySystems,
    outputDir
  });

  artifacts.push(...costAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: DESIGN DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Design Documentation');

  const designDocs = await ctx.task(controlDesignDocsTask, {
    projectName,
    emissionCharacterization,
    techScreening,
    detailedDesign,
    auxiliarySystems,
    testingPlan,
    costAnalysis,
    outputDir
  });

  artifacts.push(...designDocs.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    controlSystemDesign: {
      selectedTechnology: detailedDesign.selectedTechnology,
      specifications: detailedDesign.specifications,
      auxiliarySystems: auxiliarySystems.systemsSummary
    },
    performanceSpecifications: {
      expectedEfficiency: detailedDesign.expectedPerformance,
      emissionLimits: detailedDesign.emissionLimits,
      operatingConditions: detailedDesign.operatingConditions
    },
    costEstimate: {
      capitalCost: costAnalysis.capitalCost,
      annualOperatingCost: costAnalysis.annualOperatingCost,
      costEffectiveness: costAnalysis.costEffectiveness
    },
    testingPlan: testingPlan.testProtocol,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/air-pollution-control-system-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const emissionCharacterizationTask = defineTask('emission-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Emission Source Characterization',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'Air Emissions Engineer',
      task: 'Characterize emission source for control system design',
      context: args,
      instructions: [
        '1. Determine gas flow rates and variability',
        '2. Characterize temperature and moisture content',
        '3. Analyze pollutant concentrations and loading',
        '4. Determine particle size distribution (if applicable)',
        '5. Identify chemical composition of pollutants',
        '6. Assess corrosivity and condensation potential',
        '7. Identify operating schedule and variability',
        '8. Assess combustibility and explosion risks',
        '9. Determine existing control equipment',
        '10. Document emission characterization'
      ],
      outputFormat: 'JSON with gas characteristics, pollutant loading, variability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['gasCharacteristics', 'pollutantLoading', 'variability', 'artifacts'],
      properties: {
        gasCharacteristics: { type: 'object' },
        pollutantLoading: { type: 'object' },
        particleSizeDistribution: { type: 'object' },
        variability: { type: 'object' },
        specialConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'air-control', 'characterization']
}));

export const controlTechScreeningTask = defineTask('control-tech-screening', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Control Technology Screening',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'Air Pollution Control Specialist',
      task: 'Screen and evaluate control technology options',
      context: args,
      instructions: [
        '1. Identify applicable control technologies',
        '2. Screen technologies for technical feasibility',
        '3. Evaluate baghouse/fabric filter options',
        '4. Evaluate ESP options',
        '5. Evaluate wet scrubber options',
        '6. Evaluate thermal/catalytic oxidizers',
        '7. Evaluate carbon adsorption',
        '8. Compare technology performance',
        '9. Rank technologies by suitability',
        '10. Select recommended technology'
      ],
      outputFormat: 'JSON with technology options, screening results, recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['technologyOptions', 'screeningResults', 'recommendation', 'artifacts'],
      properties: {
        technologyOptions: { type: 'array' },
        screeningResults: { type: 'object' },
        technicalFeasibility: { type: 'object' },
        performanceComparison: { type: 'object' },
        recommendation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'air-control', 'screening']
}));

export const controlSystemDesignTask = defineTask('control-system-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detailed Control System Design',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'Air Pollution Control Design Engineer',
      task: 'Develop detailed control system design',
      context: args,
      instructions: [
        '1. Size control equipment',
        '2. Specify equipment materials',
        '3. Design inlet and outlet ductwork',
        '4. Specify fan requirements',
        '5. Design hopper and ash handling (if applicable)',
        '6. Design reagent injection system (if applicable)',
        '7. Specify instrumentation and controls',
        '8. Develop process flow diagram',
        '9. Calculate expected performance',
        '10. Document design specifications'
      ],
      outputFormat: 'JSON with selected technology, specifications, expected performance'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTechnology', 'specifications', 'expectedPerformance', 'artifacts'],
      properties: {
        selectedTechnology: { type: 'string' },
        specifications: { type: 'object' },
        equipmentSizing: { type: 'object' },
        materialsOfConstruction: { type: 'object' },
        expectedPerformance: { type: 'object' },
        emissionLimits: { type: 'object' },
        operatingConditions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'air-control', 'design']
}));

export const auxiliarySystemsTask = defineTask('auxiliary-systems', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Auxiliary Systems Design',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'Air Control Systems Engineer',
      task: 'Design auxiliary support systems',
      context: args,
      instructions: [
        '1. Design compressed air system',
        '2. Design electrical power distribution',
        '3. Design cooling water system (if needed)',
        '4. Design waste disposal system',
        '5. Design noise control measures',
        '6. Design structural supports',
        '7. Design access and safety features',
        '8. Design fire protection',
        '9. Specify utility requirements',
        '10. Document auxiliary systems'
      ],
      outputFormat: 'JSON with systems summary, utility requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['systemsSummary', 'utilityRequirements', 'artifacts'],
      properties: {
        systemsSummary: { type: 'object' },
        compressedAir: { type: 'object' },
        electrical: { type: 'object' },
        wasteDisposal: { type: 'object' },
        safetyFeatures: { type: 'array' },
        utilityRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'air-control', 'auxiliary']
}));

export const performanceTestingPlanTask = defineTask('performance-testing-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Performance Testing Plan',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'Air Testing Specialist',
      task: 'Develop performance testing plan for control system',
      context: args,
      instructions: [
        '1. Define test objectives',
        '2. Specify test methods (EPA Methods)',
        '3. Determine test locations and ports',
        '4. Specify operating conditions for testing',
        '5. Define acceptance criteria',
        '6. Develop sampling and analysis plan',
        '7. Specify QA/QC requirements',
        '8. Develop test schedule',
        '9. Identify testing contractor requirements',
        '10. Document testing protocol'
      ],
      outputFormat: 'JSON with test protocol, methods, acceptance criteria'
    },
    outputSchema: {
      type: 'object',
      required: ['testProtocol', 'testMethods', 'acceptanceCriteria', 'artifacts'],
      properties: {
        testProtocol: { type: 'object' },
        testMethods: { type: 'array' },
        testLocations: { type: 'array' },
        operatingConditions: { type: 'object' },
        acceptanceCriteria: { type: 'object' },
        qaqcRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'air-control', 'testing']
}));

export const controlCostAnalysisTask = defineTask('control-cost-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cost Analysis',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'Environmental Cost Engineer',
      task: 'Analyze control system costs',
      context: args,
      instructions: [
        '1. Estimate equipment capital costs',
        '2. Estimate installation costs',
        '3. Estimate engineering and permitting costs',
        '4. Calculate annual operating costs',
        '5. Estimate maintenance costs',
        '6. Calculate utilities costs',
        '7. Estimate disposal/byproduct costs',
        '8. Calculate cost per ton of pollutant removed',
        '9. Develop lifecycle cost analysis',
        '10. Document cost analysis'
      ],
      outputFormat: 'JSON with capital cost, operating cost, cost effectiveness'
    },
    outputSchema: {
      type: 'object',
      required: ['capitalCost', 'annualOperatingCost', 'costEffectiveness', 'artifacts'],
      properties: {
        capitalCost: { type: 'object' },
        annualOperatingCost: { type: 'object' },
        costEffectiveness: { type: 'object' },
        lifecycleCost: { type: 'object' },
        costBreakdown: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'air-control', 'cost']
}));

export const controlDesignDocsTask = defineTask('control-design-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Documentation',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'Environmental Engineering Technical Writer',
      task: 'Compile control system design documentation',
      context: args,
      instructions: [
        '1. Prepare design basis document',
        '2. Compile equipment specifications',
        '3. Prepare process flow diagrams',
        '4. Develop P&IDs',
        '5. Prepare equipment data sheets',
        '6. Compile O&M manual outline',
        '7. Prepare construction specifications',
        '8. Compile vendor bid packages',
        '9. Prepare design report',
        '10. Generate documentation package'
      ],
      outputFormat: 'JSON with document list, report path'
    },
    outputSchema: {
      type: 'object',
      required: ['documentList', 'reportPath', 'artifacts'],
      properties: {
        documentList: { type: 'array' },
        reportPath: { type: 'string' },
        designBasis: { type: 'object' },
        specifications: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'air-control', 'documentation']
}));
