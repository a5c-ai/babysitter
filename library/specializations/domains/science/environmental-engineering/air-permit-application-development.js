/**
 * @process environmental-engineering/air-permit-application-development
 * @description Air Permit Application Development - Comprehensive process for preparing air quality permit applications
 * including emission inventory, dispersion modeling, control technology evaluation, and regulatory compliance demonstration.
 * @inputs { facilityName: string, facilityType: string, emissionSources: array, permitType: string }
 * @outputs { success: boolean, permitApplication: object, emissionInventory: object, modelingResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/air-permit-application-development', {
 *   facilityName: 'Manufacturing Facility Expansion',
 *   facilityType: 'industrial',
 *   emissionSources: [{ type: 'boiler', capacity: '50 MMBtu/hr', fuel: 'natural-gas' }],
 *   permitType: 'Title V'
 * });
 *
 * @references
 * - EPA Air Permit Guidance Documents
 * - 40 CFR Part 70 - State Operating Permit Programs
 * - AERMOD Implementation Guide
 * - EPA BACT/RACT/LAER Guidance
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    facilityName,
    facilityType = 'industrial',
    emissionSources = [],
    permitType = 'minor',
    location = {},
    attainmentStatus = {},
    outputDir = 'air-permit-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Air Permit Application Development: ${facilityName}`);
  ctx.log('info', `Permit Type: ${permitType}, Emission Sources: ${emissionSources.length}`);

  // ============================================================================
  // PHASE 1: REGULATORY APPLICABILITY
  // ============================================================================

  ctx.log('info', 'Phase 1: Regulatory Applicability Determination');

  const regulatoryApplicability = await ctx.task(regulatoryApplicabilityTask, {
    facilityName,
    facilityType,
    emissionSources,
    permitType,
    location,
    attainmentStatus,
    outputDir
  });

  artifacts.push(...regulatoryApplicability.artifacts);

  // ============================================================================
  // PHASE 2: EMISSION INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 2: Emission Inventory Development');

  const emissionInventory = await ctx.task(emissionInventoryTask, {
    facilityName,
    emissionSources,
    regulatoryApplicability,
    outputDir
  });

  artifacts.push(...emissionInventory.artifacts);

  // ============================================================================
  // PHASE 3: CONTROL TECHNOLOGY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Control Technology Analysis');

  const controlTechAnalysis = await ctx.task(controlTechAnalysisTask, {
    facilityName,
    emissionSources,
    emissionInventory,
    regulatoryApplicability,
    outputDir
  });

  artifacts.push(...controlTechAnalysis.artifacts);

  // Breakpoint: Control Technology Review
  await ctx.breakpoint({
    question: `Control technology analysis complete for ${facilityName}. Recommended controls: ${controlTechAnalysis.recommendedControls.length}. Review BACT/LAER determination?`,
    title: 'Control Technology Review',
    context: {
      runId: ctx.runId,
      recommendedControls: controlTechAnalysis.recommendedControls,
      controlEfficiencies: controlTechAnalysis.controlEfficiencies,
      files: controlTechAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 4: DISPERSION MODELING
  // ============================================================================

  ctx.log('info', 'Phase 4: Air Dispersion Modeling');

  const dispersionModeling = await ctx.task(dispersionModelingTask, {
    facilityName,
    emissionSources,
    emissionInventory,
    controlTechAnalysis,
    location,
    attainmentStatus,
    outputDir
  });

  artifacts.push(...dispersionModeling.artifacts);

  // ============================================================================
  // PHASE 5: COMPLIANCE DEMONSTRATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Compliance Demonstration');

  const complianceDemo = await ctx.task(complianceDemoTask, {
    facilityName,
    regulatoryApplicability,
    emissionInventory,
    controlTechAnalysis,
    dispersionModeling,
    outputDir
  });

  artifacts.push(...complianceDemo.artifacts);

  // ============================================================================
  // PHASE 6: PERMIT APPLICATION PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Permit Application Preparation');

  const permitApplication = await ctx.task(permitApplicationTask, {
    facilityName,
    facilityType,
    permitType,
    emissionSources,
    regulatoryApplicability,
    emissionInventory,
    controlTechAnalysis,
    dispersionModeling,
    complianceDemo,
    outputDir
  });

  artifacts.push(...permitApplication.artifacts);

  // Breakpoint: Application Review
  await ctx.breakpoint({
    question: `Permit application prepared for ${facilityName}. Application type: ${permitType}. Review complete application package?`,
    title: 'Permit Application Review',
    context: {
      runId: ctx.runId,
      applicationSummary: permitApplication.applicationSummary,
      permitConditions: permitApplication.permitConditions,
      files: permitApplication.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    facilityName,
    permitApplication: {
      permitType,
      applicationSummary: permitApplication.applicationSummary,
      permitConditions: permitApplication.permitConditions,
      submissionRequirements: permitApplication.submissionRequirements
    },
    emissionInventory: {
      totalEmissions: emissionInventory.totalEmissions,
      emissionsBySource: emissionInventory.emissionsBySource,
      emissionsByPollutant: emissionInventory.emissionsByPollutant
    },
    modelingResults: {
      maxConcentrations: dispersionModeling.maxConcentrations,
      complianceStatus: dispersionModeling.complianceStatus
    },
    controlTechnology: controlTechAnalysis.recommendedControls,
    complianceStatus: complianceDemo.complianceStatus,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/air-permit-application-development',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const regulatoryApplicabilityTask = defineTask('regulatory-applicability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Regulatory Applicability Determination',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'Air Quality Regulatory Specialist',
      task: 'Determine regulatory applicability for air permit',
      context: args,
      instructions: [
        '1. Identify applicable federal regulations (CAA, NAAQS, NSPS, NESHAP)',
        '2. Determine Title V applicability',
        '3. Assess PSD/NSR applicability',
        '4. Identify state air quality regulations',
        '5. Determine attainment/nonattainment status impacts',
        '6. Assess HAP applicability and major source status',
        '7. Identify MACT standards applicability',
        '8. Determine permit type requirements',
        '9. Create regulatory applicability matrix',
        '10. Document applicability determination'
      ],
      outputFormat: 'JSON with applicability summary, regulations, permit requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['applicabilitySummary', 'regulations', 'permitRequirements', 'artifacts'],
      properties: {
        applicabilitySummary: { type: 'object' },
        federalRegulations: { type: 'array' },
        stateRegulations: { type: 'array' },
        regulations: { type: 'array' },
        majorSourceStatus: { type: 'object' },
        permitRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'air-quality', 'regulatory']
}));

export const emissionInventoryTask = defineTask('emission-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Emission Inventory Development',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'Air Emissions Engineer',
      task: 'Develop comprehensive emission inventory',
      context: args,
      instructions: [
        '1. Identify and characterize all emission sources',
        '2. Determine emission factors (AP-42, FIRE)',
        '3. Calculate criteria pollutant emissions',
        '4. Calculate HAP emissions',
        '5. Calculate GHG emissions',
        '6. Estimate fugitive emissions',
        '7. Calculate potential to emit (PTE)',
        '8. Calculate actual emissions',
        '9. Prepare emission inventory tables',
        '10. Document calculation methodology'
      ],
      outputFormat: 'JSON with total emissions, emissions by source/pollutant'
    },
    outputSchema: {
      type: 'object',
      required: ['totalEmissions', 'emissionsBySource', 'emissionsByPollutant', 'artifacts'],
      properties: {
        totalEmissions: { type: 'object' },
        emissionsBySource: { type: 'array' },
        emissionsByPollutant: { type: 'object' },
        potentialToEmit: { type: 'object' },
        actualEmissions: { type: 'object' },
        calculationMethods: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'air-quality', 'emissions']
}));

export const controlTechAnalysisTask = defineTask('control-tech-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Control Technology Analysis',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'Air Pollution Control Engineer',
      task: 'Evaluate and select emission control technologies',
      context: args,
      instructions: [
        '1. Conduct top-down BACT analysis',
        '2. Evaluate available control technologies',
        '3. Assess technical feasibility',
        '4. Assess economic feasibility',
        '5. Evaluate energy and environmental impacts',
        '6. Determine achievable emission limits',
        '7. Compare to RACT/BACT/LAER clearinghouse',
        '8. Select recommended controls',
        '9. Document control technology rationale',
        '10. Prepare BACT/LAER determination'
      ],
      outputFormat: 'JSON with recommended controls, efficiencies, cost analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedControls', 'controlEfficiencies', 'costAnalysis', 'artifacts'],
      properties: {
        recommendedControls: { type: 'array' },
        controlOptions: { type: 'array' },
        controlEfficiencies: { type: 'object' },
        costAnalysis: { type: 'object' },
        bactDetermination: { type: 'object' },
        achievableEmissionLimits: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'air-quality', 'control-technology']
}));

export const dispersionModelingTask = defineTask('dispersion-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Air Dispersion Modeling',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'Air Quality Modeler',
      task: 'Perform air dispersion modeling analysis',
      context: args,
      instructions: [
        '1. Select appropriate model (AERMOD, CALPUFF)',
        '2. Develop modeling protocol',
        '3. Characterize emission sources for modeling',
        '4. Obtain and process meteorological data',
        '5. Define receptor grid and sensitive receptors',
        '6. Run dispersion models',
        '7. Perform ambient impact analysis',
        '8. Conduct NAAQS compliance demonstration',
        '9. Assess PSD increment consumption',
        '10. Document modeling results'
      ],
      outputFormat: 'JSON with max concentrations, compliance status, model outputs'
    },
    outputSchema: {
      type: 'object',
      required: ['maxConcentrations', 'complianceStatus', 'modelOutputs', 'artifacts'],
      properties: {
        modelingProtocol: { type: 'object' },
        maxConcentrations: { type: 'object' },
        complianceStatus: { type: 'object' },
        naagsCompliance: { type: 'object' },
        psdIncrementAnalysis: { type: 'object' },
        sensitiveReceptorImpacts: { type: 'object' },
        modelOutputs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'air-quality', 'modeling']
}));

export const complianceDemoTask = defineTask('compliance-demo', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compliance Demonstration',
  agent: {
    name: 'environmental-compliance-specialist',
    prompt: {
      role: 'Air Quality Compliance Specialist',
      task: 'Prepare compliance demonstration for permit application',
      context: args,
      instructions: [
        '1. Demonstrate NAAQS compliance',
        '2. Demonstrate PSD increment compliance',
        '3. Document BACT/LAER compliance',
        '4. Demonstrate NSPS compliance',
        '5. Demonstrate NESHAP/MACT compliance',
        '6. Document monitoring requirements',
        '7. Document recordkeeping requirements',
        '8. Document reporting requirements',
        '9. Prepare compliance schedule',
        '10. Document compliance demonstration'
      ],
      outputFormat: 'JSON with compliance status, demonstration details'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceStatus', 'demonstrations', 'requirements', 'artifacts'],
      properties: {
        complianceStatus: { type: 'object' },
        demonstrations: { type: 'object' },
        naagsCompliance: { type: 'object' },
        nspsCompliance: { type: 'object' },
        mactCompliance: { type: 'object' },
        requirements: { type: 'object' },
        complianceSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'air-quality', 'compliance']
}));

export const permitApplicationTask = defineTask('permit-application', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Permit Application Preparation',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'Air Permit Application Specialist',
      task: 'Prepare complete permit application package',
      context: args,
      instructions: [
        '1. Complete permit application forms',
        '2. Prepare process descriptions',
        '3. Compile emission calculations',
        '4. Prepare source-specific requirements',
        '5. Develop permit conditions',
        '6. Prepare monitoring protocols',
        '7. Develop compliance assurance monitoring',
        '8. Prepare fee calculations',
        '9. Compile supporting documentation',
        '10. Finalize application package'
      ],
      outputFormat: 'JSON with application summary, permit conditions, submission requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['applicationSummary', 'permitConditions', 'submissionRequirements', 'artifacts'],
      properties: {
        applicationSummary: { type: 'object' },
        applicationForms: { type: 'array' },
        permitConditions: { type: 'array' },
        monitoringRequirements: { type: 'object' },
        recordkeepingRequirements: { type: 'object' },
        reportingRequirements: { type: 'object' },
        submissionRequirements: { type: 'object' },
        feeCalculation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'air-quality', 'permit-application']
}));
