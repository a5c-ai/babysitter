/**
 * @process environmental-engineering/landfill-design-permitting
 * @description Landfill Design and Permitting - Comprehensive design of municipal solid waste landfills including
 * liner systems, leachate collection, gas management, and closure planning.
 * @inputs { projectName: string, facilityType: string, capacity: number, siteConditions: object }
 * @outputs { success: boolean, landfillDesign: object, permitApplication: object, closurePlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/landfill-design-permitting', {
 *   projectName: 'Regional Landfill Expansion',
 *   facilityType: 'Subtitle D MSW',
 *   capacity: 5000000, // cubic yards
 *   siteConditions: { geology: 'clay', groundwater: 50, precipitation: 40 }
 * });
 *
 * @references
 * - EPA Subtitle D Regulations (40 CFR 258)
 * - EPA Landfill Design Manual
 * - State Solid Waste Regulations
 * - ASCE Geotechnical Practice for Landfills
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    facilityType = 'Subtitle D MSW',
    capacity,
    siteConditions = {},
    wasteCharacteristics = {},
    outputDir = 'landfill-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Landfill Design and Permitting: ${projectName}`);
  ctx.log('info', `Facility Type: ${facilityType}, Capacity: ${capacity} CY`);

  // ============================================================================
  // PHASE 1: SITE SUITABILITY
  // ============================================================================

  ctx.log('info', 'Phase 1: Site Suitability Analysis');

  const siteSuitability = await ctx.task(siteSuitabilityTask, {
    projectName,
    facilityType,
    siteConditions,
    outputDir
  });

  artifacts.push(...siteSuitability.artifacts);

  // ============================================================================
  // PHASE 2: LINER SYSTEM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Liner System Design');

  const linerDesign = await ctx.task(linerDesignTask, {
    projectName,
    facilityType,
    siteSuitability,
    siteConditions,
    outputDir
  });

  artifacts.push(...linerDesign.artifacts);

  // ============================================================================
  // PHASE 3: LEACHATE MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Leachate Collection and Management');

  const leachateManagement = await ctx.task(leachateManagementTask, {
    projectName,
    linerDesign,
    siteConditions,
    wasteCharacteristics,
    outputDir
  });

  artifacts.push(...leachateManagement.artifacts);

  // ============================================================================
  // PHASE 4: GAS MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Landfill Gas Management');

  const gasManagement = await ctx.task(gasManagementTask, {
    projectName,
    capacity,
    wasteCharacteristics,
    outputDir
  });

  artifacts.push(...gasManagement.artifacts);

  // Breakpoint: Design Review
  await ctx.breakpoint({
    question: `Landfill design complete for ${projectName}. Liner: ${linerDesign.linerType}, LFG collection: ${gasManagement.collectionSystem}. Review design?`,
    title: 'Landfill Design Review',
    context: {
      runId: ctx.runId,
      linerDesign: linerDesign.designSummary,
      leachateSystem: leachateManagement.systemSummary,
      gasSystem: gasManagement.systemSummary,
      files: linerDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 5: STORMWATER MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Stormwater Management');

  const stormwaterDesign = await ctx.task(landfillStormwaterTask, {
    projectName,
    siteConditions,
    capacity,
    outputDir
  });

  artifacts.push(...stormwaterDesign.artifacts);

  // ============================================================================
  // PHASE 6: CLOSURE AND POST-CLOSURE
  // ============================================================================

  ctx.log('info', 'Phase 6: Closure and Post-Closure Planning');

  const closurePlan = await ctx.task(closurePlanTask, {
    projectName,
    linerDesign,
    leachateManagement,
    gasManagement,
    outputDir
  });

  artifacts.push(...closurePlan.artifacts);

  // ============================================================================
  // PHASE 7: PERMIT APPLICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Permit Application Preparation');

  const permitApplication = await ctx.task(landfillPermitTask, {
    projectName,
    facilityType,
    siteSuitability,
    linerDesign,
    leachateManagement,
    gasManagement,
    stormwaterDesign,
    closurePlan,
    outputDir
  });

  artifacts.push(...permitApplication.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    landfillDesign: {
      facilityType,
      capacity,
      linerSystem: linerDesign.designSummary,
      leachateSystem: leachateManagement.systemSummary,
      gasManagement: gasManagement.systemSummary,
      stormwater: stormwaterDesign.designSummary
    },
    permitApplication: {
      status: permitApplication.applicationStatus,
      documents: permitApplication.documents
    },
    closurePlan: {
      finalCover: closurePlan.finalCover,
      postClosurePeriod: closurePlan.postClosurePeriod,
      financialAssurance: closurePlan.financialAssurance
    },
    costEstimate: permitApplication.costEstimate,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/landfill-design-permitting',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const siteSuitabilityTask = defineTask('site-suitability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Site Suitability Analysis',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Landfill Siting Specialist',
      task: 'Evaluate site suitability for landfill development',
      context: args,
      instructions: [
        '1. Evaluate location restrictions (airports, floodplains)',
        '2. Assess hydrogeologic conditions',
        '3. Evaluate geologic suitability',
        '4. Assess seismic considerations',
        '5. Evaluate distance to receptors',
        '6. Assess access and transportation',
        '7. Evaluate wetlands and ecological constraints',
        '8. Assess groundwater protection',
        '9. Review regulatory setbacks',
        '10. Document suitability analysis'
      ],
      outputFormat: 'JSON with suitability assessment, constraints, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['suitabilityAssessment', 'constraints', 'recommendations', 'artifacts'],
      properties: {
        suitabilityAssessment: { type: 'object' },
        locationRestrictions: { type: 'object' },
        hydrogeology: { type: 'object' },
        constraints: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'landfill', 'siting']
}));

export const linerDesignTask = defineTask('liner-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Liner System Design',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Landfill Liner Engineer',
      task: 'Design landfill liner system',
      context: args,
      instructions: [
        '1. Select liner system type (single, composite, double)',
        '2. Design geomembrane liner',
        '3. Design compacted clay layer',
        '4. Design geosynthetic clay liner (GCL) if applicable',
        '5. Design protective cover layers',
        '6. Specify liner material requirements',
        '7. Design subgrade preparation',
        '8. Develop CQA plan',
        '9. Prepare liner specifications',
        '10. Document liner design'
      ],
      outputFormat: 'JSON with liner type, design summary, specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['linerType', 'designSummary', 'specifications', 'artifacts'],
      properties: {
        linerType: { type: 'string' },
        designSummary: { type: 'object' },
        geomembrane: { type: 'object' },
        clayLayer: { type: 'object' },
        protectiveLayers: { type: 'object' },
        specifications: { type: 'object' },
        cqaPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'landfill', 'liner']
}));

export const leachateManagementTask = defineTask('leachate-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Leachate Collection and Management',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Leachate Management Engineer',
      task: 'Design leachate collection and treatment system',
      context: args,
      instructions: [
        '1. Estimate leachate generation rates',
        '2. Design leachate collection system',
        '3. Size collection pipes and sumps',
        '4. Design leachate removal system',
        '5. Design leachate storage',
        '6. Design leachate treatment (if on-site)',
        '7. Plan leachate disposal options',
        '8. Design leak detection system',
        '9. Develop O&M procedures',
        '10. Document leachate management design'
      ],
      outputFormat: 'JSON with system summary, generation rates, treatment design'
    },
    outputSchema: {
      type: 'object',
      required: ['systemSummary', 'generationRates', 'treatmentDesign', 'artifacts'],
      properties: {
        systemSummary: { type: 'object' },
        generationRates: { type: 'object' },
        collectionSystem: { type: 'object' },
        storageDesign: { type: 'object' },
        treatmentDesign: { type: 'object' },
        disposalPlan: { type: 'object' },
        leakDetection: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'landfill', 'leachate']
}));

export const gasManagementTask = defineTask('gas-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Landfill Gas Management',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Landfill Gas Engineer',
      task: 'Design landfill gas collection and control system',
      context: args,
      instructions: [
        '1. Estimate LFG generation rates',
        '2. Design gas collection system',
        '3. Size extraction wells and headers',
        '4. Design condensate management',
        '5. Design flare system',
        '6. Evaluate energy recovery options',
        '7. Design surface emission monitoring',
        '8. Develop NSPS compliance plan',
        '9. Design control and monitoring system',
        '10. Document gas management design'
      ],
      outputFormat: 'JSON with system summary, collection system, control design'
    },
    outputSchema: {
      type: 'object',
      required: ['systemSummary', 'collectionSystem', 'controlDesign', 'artifacts'],
      properties: {
        systemSummary: { type: 'object' },
        generationEstimates: { type: 'object' },
        collectionSystem: { type: 'string' },
        wellDesign: { type: 'object' },
        flareDesign: { type: 'object' },
        energyRecovery: { type: 'object' },
        controlDesign: { type: 'object' },
        nspsCompliance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'landfill', 'gas']
}));

export const landfillStormwaterTask = defineTask('landfill-stormwater', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Stormwater Management',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Landfill Stormwater Engineer',
      task: 'Design landfill stormwater management system',
      context: args,
      instructions: [
        '1. Design run-on controls',
        '2. Design run-off collection',
        '3. Size stormwater conveyances',
        '4. Design sedimentation basins',
        '5. Design contact water management',
        '6. Develop erosion controls',
        '7. Design monitoring locations',
        '8. Prepare SWPPP',
        '9. Design final cover drainage',
        '10. Document stormwater design'
      ],
      outputFormat: 'JSON with design summary, conveyance sizing, SWPPP'
    },
    outputSchema: {
      type: 'object',
      required: ['designSummary', 'conveyanceSizing', 'swppp', 'artifacts'],
      properties: {
        designSummary: { type: 'object' },
        runOnControls: { type: 'object' },
        runOffCollection: { type: 'object' },
        conveyanceSizing: { type: 'object' },
        sedimentBasins: { type: 'object' },
        swppp: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'landfill', 'stormwater']
}));

export const closurePlanTask = defineTask('closure-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Closure and Post-Closure Planning',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Landfill Closure Specialist',
      task: 'Develop closure and post-closure plan',
      context: args,
      instructions: [
        '1. Design final cover system',
        '2. Specify vegetation requirements',
        '3. Plan post-closure monitoring',
        '4. Develop post-closure maintenance plan',
        '5. Calculate closure costs',
        '6. Calculate post-closure costs',
        '7. Develop financial assurance mechanism',
        '8. Plan for post-closure care period',
        '9. Develop contingency measures',
        '10. Document closure plan'
      ],
      outputFormat: 'JSON with final cover, post-closure period, financial assurance'
    },
    outputSchema: {
      type: 'object',
      required: ['finalCover', 'postClosurePeriod', 'financialAssurance', 'artifacts'],
      properties: {
        finalCover: { type: 'object' },
        vegetationPlan: { type: 'object' },
        postClosureMonitoring: { type: 'object' },
        maintenancePlan: { type: 'object' },
        postClosurePeriod: { type: 'string' },
        closureCostEstimate: { type: 'object' },
        postClosureCostEstimate: { type: 'object' },
        financialAssurance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'landfill', 'closure']
}));

export const landfillPermitTask = defineTask('landfill-permit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Permit Application Preparation',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Landfill Permitting Specialist',
      task: 'Prepare landfill permit application',
      context: args,
      instructions: [
        '1. Compile permit application forms',
        '2. Prepare Part A - general information',
        '3. Prepare Part B - design documentation',
        '4. Prepare operating plan',
        '5. Prepare groundwater monitoring plan',
        '6. Prepare closure and post-closure plan',
        '7. Prepare financial assurance documentation',
        '8. Conduct NEPA/SEPA review',
        '9. Plan public participation',
        '10. Submit permit application'
      ],
      outputFormat: 'JSON with application status, documents, cost estimate'
    },
    outputSchema: {
      type: 'object',
      required: ['applicationStatus', 'documents', 'costEstimate', 'artifacts'],
      properties: {
        applicationStatus: { type: 'string' },
        documents: { type: 'array' },
        operatingPlan: { type: 'object' },
        monitoringPlan: { type: 'object' },
        financialAssurance: { type: 'object' },
        publicParticipation: { type: 'object' },
        costEstimate: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'landfill', 'permitting']
}));
