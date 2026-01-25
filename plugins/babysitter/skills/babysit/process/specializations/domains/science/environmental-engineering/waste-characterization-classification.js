/**
 * @process environmental-engineering/waste-characterization-classification
 * @description Waste Characterization and Classification - Systematic approach to sampling, analysis, and classification
 * of wastes under RCRA and state regulations.
 * @inputs { facilityName: string, wasteStreams: array, regulatoryFramework: string }
 * @outputs { success: boolean, wasteClassification: object, samplingResults: object, managementRequirements: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/waste-characterization-classification', {
 *   facilityName: 'Chemical Manufacturing Plant',
 *   wasteStreams: ['process-sludge', 'spent-solvent', 'wastewater-treatment-residue'],
 *   regulatoryFramework: 'RCRA'
 * });
 *
 * @references
 * - 40 CFR Part 261 - Identification and Listing of Hazardous Waste
 * - EPA SW-846 Test Methods
 * - RCRA Orientation Manual
 * - State Hazardous Waste Regulations
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    facilityName,
    wasteStreams = [],
    regulatoryFramework = 'RCRA',
    processInformation = {},
    outputDir = 'waste-characterization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Waste Characterization: ${facilityName}`);
  ctx.log('info', `Waste Streams: ${wasteStreams.length}, Framework: ${regulatoryFramework}`);

  // ============================================================================
  // PHASE 1: WASTE STREAM IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Waste Stream Identification');

  const wasteIdentification = await ctx.task(wasteIdentificationTask, {
    facilityName,
    wasteStreams,
    processInformation,
    outputDir
  });

  artifacts.push(...wasteIdentification.artifacts);

  // ============================================================================
  // PHASE 2: SAMPLING AND ANALYSIS PLAN
  // ============================================================================

  ctx.log('info', 'Phase 2: Sampling and Analysis Plan');

  const samplingPlan = await ctx.task(wasteSamplingPlanTask, {
    facilityName,
    wasteIdentification,
    regulatoryFramework,
    outputDir
  });

  artifacts.push(...samplingPlan.artifacts);

  // ============================================================================
  // PHASE 3: SAMPLE COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Sample Collection');

  const sampleCollection = await ctx.task(sampleCollectionTask, {
    facilityName,
    samplingPlan,
    wasteStreams,
    outputDir
  });

  artifacts.push(...sampleCollection.artifacts);

  // ============================================================================
  // PHASE 4: LABORATORY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Laboratory Analysis');

  const labAnalysis = await ctx.task(wasteLabAnalysisTask, {
    facilityName,
    sampleCollection,
    samplingPlan,
    outputDir
  });

  artifacts.push(...labAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: WASTE CLASSIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Waste Classification Determination');

  const wasteClassification = await ctx.task(wasteClassificationTask, {
    facilityName,
    wasteIdentification,
    labAnalysis,
    regulatoryFramework,
    outputDir
  });

  artifacts.push(...wasteClassification.artifacts);

  // Breakpoint: Classification Review
  await ctx.breakpoint({
    question: `Waste classification complete for ${facilityName}. Hazardous waste streams: ${wasteClassification.hazardousCount}. Review classifications?`,
    title: 'Waste Classification Review',
    context: {
      runId: ctx.runId,
      classifications: wasteClassification.classifications,
      hazardousCount: wasteClassification.hazardousCount,
      wasteCodes: wasteClassification.wasteCodes,
      files: wasteClassification.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 6: MANAGEMENT REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 6: Management Requirements Determination');

  const managementRequirements = await ctx.task(managementRequirementsTask, {
    facilityName,
    wasteClassification,
    regulatoryFramework,
    outputDir
  });

  artifacts.push(...managementRequirements.artifacts);

  // ============================================================================
  // PHASE 7: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Characterization Documentation');

  const characterizationDocs = await ctx.task(characterizationDocsTask, {
    facilityName,
    wasteIdentification,
    samplingPlan,
    labAnalysis,
    wasteClassification,
    managementRequirements,
    outputDir
  });

  artifacts.push(...characterizationDocs.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    facilityName,
    wasteClassification: {
      totalWasteStreams: wasteClassification.totalStreams,
      hazardousWasteStreams: wasteClassification.hazardousCount,
      nonHazardousStreams: wasteClassification.nonHazardousCount,
      classifications: wasteClassification.classifications,
      wasteCodes: wasteClassification.wasteCodes
    },
    samplingResults: {
      samplesCollected: sampleCollection.samplesCollected,
      analyticalResults: labAnalysis.resultsSummary
    },
    managementRequirements: {
      generatorStatus: managementRequirements.generatorStatus,
      storageRequirements: managementRequirements.storageRequirements,
      disposalRequirements: managementRequirements.disposalRequirements
    },
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/waste-characterization-classification',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const wasteIdentificationTask = defineTask('waste-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Waste Stream Identification',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Waste Characterization Specialist',
      task: 'Identify and document waste streams',
      context: args,
      instructions: [
        '1. Identify all waste-generating processes',
        '2. Document waste stream origins',
        '3. Characterize physical form (solid, liquid, sludge)',
        '4. Estimate generation rates',
        '5. Identify raw materials and process inputs',
        '6. Screen for listed wastes',
        '7. Identify potential characteristic wastes',
        '8. Document current management practices',
        '9. Assign waste stream IDs',
        '10. Prepare waste stream inventory'
      ],
      outputFormat: 'JSON with waste inventory, characteristics, generation rates'
    },
    outputSchema: {
      type: 'object',
      required: ['wasteInventory', 'wasteCharacteristics', 'generationRates', 'artifacts'],
      properties: {
        wasteInventory: { type: 'array' },
        wasteCharacteristics: { type: 'object' },
        generationRates: { type: 'object' },
        processOrigins: { type: 'object' },
        preliminaryClassification: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'waste', 'identification']
}));

export const wasteSamplingPlanTask = defineTask('waste-sampling-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Sampling and Analysis Plan',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Waste Sampling Specialist',
      task: 'Develop waste sampling and analysis plan',
      context: args,
      instructions: [
        '1. Define sampling objectives',
        '2. Select sampling methods (SW-846)',
        '3. Determine sample numbers and frequency',
        '4. Identify composite vs. grab sampling',
        '5. Specify analytical methods',
        '6. Define QA/QC requirements',
        '7. Develop health and safety procedures',
        '8. Specify sample preservation and handling',
        '9. Select analytical laboratory',
        '10. Document sampling plan'
      ],
      outputFormat: 'JSON with sampling methods, analytical methods, QA/QC'
    },
    outputSchema: {
      type: 'object',
      required: ['samplingMethods', 'analyticalMethods', 'qaqcRequirements', 'artifacts'],
      properties: {
        samplingMethods: { type: 'object' },
        sampleNumbers: { type: 'object' },
        analyticalMethods: { type: 'array' },
        qaqcRequirements: { type: 'object' },
        preservation: { type: 'object' },
        healthSafety: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'waste', 'sampling']
}));

export const sampleCollectionTask = defineTask('sample-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Sample Collection',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Waste Sampling Technician',
      task: 'Coordinate and document sample collection',
      context: args,
      instructions: [
        '1. Mobilize sampling equipment',
        '2. Collect samples per sampling plan',
        '3. Document sample locations',
        '4. Complete chain of custody',
        '5. Document field observations',
        '6. Photograph sampling activities',
        '7. Implement QA/QC procedures',
        '8. Package and ship samples',
        '9. Track sample delivery',
        '10. Document sample collection activities'
      ],
      outputFormat: 'JSON with samples collected, chain of custody, field observations'
    },
    outputSchema: {
      type: 'object',
      required: ['samplesCollected', 'chainOfCustody', 'fieldObservations', 'artifacts'],
      properties: {
        samplesCollected: { type: 'array' },
        sampleInventory: { type: 'object' },
        chainOfCustody: { type: 'array' },
        fieldObservations: { type: 'object' },
        qaqcSamples: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'waste', 'sampling']
}));

export const wasteLabAnalysisTask = defineTask('waste-lab-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Laboratory Analysis',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Laboratory Data Analyst',
      task: 'Coordinate analysis and review results',
      context: args,
      instructions: [
        '1. Coordinate with analytical laboratory',
        '2. Review holding time compliance',
        '3. Review preliminary data',
        '4. Validate analytical results',
        '5. Review QA/QC data',
        '6. Compile TCLP/SPLP results',
        '7. Compile total constituent data',
        '8. Flag data qualifiers',
        '9. Prepare data summary tables',
        '10. Document laboratory results'
      ],
      outputFormat: 'JSON with results summary, TCLP results, data quality'
    },
    outputSchema: {
      type: 'object',
      required: ['resultsSummary', 'tclpResults', 'dataQuality', 'artifacts'],
      properties: {
        resultsSummary: { type: 'object' },
        tclpResults: { type: 'object' },
        totalConstituents: { type: 'object' },
        dataQuality: { type: 'object' },
        qualifiers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'waste', 'laboratory']
}));

export const wasteClassificationTask = defineTask('waste-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Waste Classification Determination',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'RCRA Waste Classification Specialist',
      task: 'Determine waste classification under RCRA',
      context: args,
      instructions: [
        '1. Apply solid waste definition',
        '2. Check for RCRA exclusions',
        '3. Check listed waste status (F, K, P, U lists)',
        '4. Evaluate ignitability characteristic (D001)',
        '5. Evaluate corrosivity characteristic (D002)',
        '6. Evaluate reactivity characteristic (D003)',
        '7. Evaluate toxicity characteristic (D004-D043)',
        '8. Determine waste codes',
        '9. Apply mixture and derived-from rules',
        '10. Document classification determination'
      ],
      outputFormat: 'JSON with classifications, waste codes, hazardous count'
    },
    outputSchema: {
      type: 'object',
      required: ['classifications', 'wasteCodes', 'hazardousCount', 'totalStreams', 'artifacts'],
      properties: {
        classifications: { type: 'object' },
        wasteCodes: { type: 'object' },
        hazardousCount: { type: 'number' },
        nonHazardousCount: { type: 'number' },
        totalStreams: { type: 'number' },
        listedWastes: { type: 'array' },
        characteristicWastes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'waste', 'classification']
}));

export const managementRequirementsTask = defineTask('management-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Management Requirements Determination',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Hazardous Waste Compliance Specialist',
      task: 'Determine waste management requirements',
      context: args,
      instructions: [
        '1. Determine generator category (LQG, SQG, VSQG)',
        '2. Identify accumulation time limits',
        '3. Determine container management requirements',
        '4. Identify labeling requirements',
        '5. Determine manifest requirements',
        '6. Identify training requirements',
        '7. Determine emergency response requirements',
        '8. Identify recordkeeping requirements',
        '9. Determine disposal options',
        '10. Document management requirements'
      ],
      outputFormat: 'JSON with generator status, storage requirements, disposal requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['generatorStatus', 'storageRequirements', 'disposalRequirements', 'artifacts'],
      properties: {
        generatorStatus: { type: 'string' },
        accumulationLimits: { type: 'object' },
        storageRequirements: { type: 'object' },
        labelingRequirements: { type: 'object' },
        manifestRequirements: { type: 'object' },
        trainingRequirements: { type: 'object' },
        disposalRequirements: { type: 'object' },
        recordkeeping: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'waste', 'compliance']
}));

export const characterizationDocsTask = defineTask('characterization-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterization Documentation',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Waste Documentation Specialist',
      task: 'Compile waste characterization documentation',
      context: args,
      instructions: [
        '1. Prepare waste characterization report',
        '2. Compile waste profiles',
        '3. Document classification rationale',
        '4. Compile analytical data packages',
        '5. Prepare waste stream summary sheets',
        '6. Document management procedures',
        '7. Prepare disposal facility documentation',
        '8. Create waste tracking database',
        '9. Prepare regulatory notifications if needed',
        '10. Generate documentation package'
      ],
      outputFormat: 'JSON with document list, report path, waste profiles'
    },
    outputSchema: {
      type: 'object',
      required: ['documentList', 'reportPath', 'wasteProfiles', 'artifacts'],
      properties: {
        documentList: { type: 'array' },
        reportPath: { type: 'string' },
        wasteProfiles: { type: 'array' },
        analyticalDataPackages: { type: 'array' },
        managementProcedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'waste', 'documentation']
}));
