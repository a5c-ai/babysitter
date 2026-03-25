/**
 * @process environmental-engineering/hazardous-waste-management-program
 * @description Hazardous Waste Management Program - Development of comprehensive hazardous waste management programs
 * including generator compliance, treatment, storage, and disposal.
 * @inputs { facilityName: string, facilityType: string, wasteStreams: array, currentPractices: object }
 * @outputs { success: boolean, managementProgram: object, complianceStatus: object, trainingPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/hazardous-waste-management-program', {
 *   facilityName: 'Manufacturing Facility',
 *   facilityType: 'industrial',
 *   wasteStreams: ['spent-solvents', 'metal-finishing-sludge', 'waste-paint'],
 *   currentPractices: { generatorStatus: 'LQG', hasPermit: false }
 * });
 *
 * @references
 * - 40 CFR Parts 260-270 - RCRA Hazardous Waste Regulations
 * - EPA RCRA Orientation Manual
 * - State Hazardous Waste Regulations
 * - DOT Hazardous Materials Regulations
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    facilityName,
    facilityType = 'industrial',
    wasteStreams = [],
    currentPractices = {},
    organizationalInfo = {},
    outputDir = 'hazwaste-program-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Hazardous Waste Management Program: ${facilityName}`);
  ctx.log('info', `Facility Type: ${facilityType}, Waste Streams: ${wasteStreams.length}`);

  // ============================================================================
  // PHASE 1: REGULATORY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Regulatory Assessment');

  const regulatoryAssessment = await ctx.task(hwRegulatoryTask, {
    facilityName,
    facilityType,
    wasteStreams,
    currentPractices,
    outputDir
  });

  artifacts.push(...regulatoryAssessment.artifacts);

  // ============================================================================
  // PHASE 2: WASTE STREAM EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Waste Stream Evaluation');

  const wasteEvaluation = await ctx.task(hwWasteEvalTask, {
    facilityName,
    wasteStreams,
    regulatoryAssessment,
    outputDir
  });

  artifacts.push(...wasteEvaluation.artifacts);

  // ============================================================================
  // PHASE 3: STORAGE AND HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 3: Storage and Handling Requirements');

  const storageHandling = await ctx.task(storageHandlingTask, {
    facilityName,
    wasteEvaluation,
    regulatoryAssessment,
    outputDir
  });

  artifacts.push(...storageHandling.artifacts);

  // ============================================================================
  // PHASE 4: TREATMENT AND DISPOSAL
  // ============================================================================

  ctx.log('info', 'Phase 4: Treatment and Disposal Planning');

  const treatmentDisposal = await ctx.task(treatmentDisposalTask, {
    facilityName,
    wasteEvaluation,
    outputDir
  });

  artifacts.push(...treatmentDisposal.artifacts);

  // Breakpoint: Management Review
  await ctx.breakpoint({
    question: `Hazardous waste program developed for ${facilityName}. Generator status: ${regulatoryAssessment.generatorStatus}. Review program?`,
    title: 'Hazardous Waste Program Review',
    context: {
      runId: ctx.runId,
      generatorStatus: regulatoryAssessment.generatorStatus,
      wasteStreams: wasteEvaluation.wasteStreamCount,
      storageRequirements: storageHandling.requirements,
      files: treatmentDisposal.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 5: TRAINING PROGRAM
  // ============================================================================

  ctx.log('info', 'Phase 5: Training Program Development');

  const trainingProgram = await ctx.task(hwTrainingTask, {
    facilityName,
    regulatoryAssessment,
    wasteEvaluation,
    organizationalInfo,
    outputDir
  });

  artifacts.push(...trainingProgram.artifacts);

  // ============================================================================
  // PHASE 6: RECORDKEEPING AND REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Recordkeeping and Reporting');

  const recordkeepingReporting = await ctx.task(recordkeepingTask, {
    facilityName,
    regulatoryAssessment,
    wasteEvaluation,
    outputDir
  });

  artifacts.push(...recordkeepingReporting.artifacts);

  // ============================================================================
  // PHASE 7: CONTINGENCY PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 7: Contingency Planning');

  const contingencyPlan = await ctx.task(hwContingencyTask, {
    facilityName,
    wasteEvaluation,
    storageHandling,
    outputDir
  });

  artifacts.push(...contingencyPlan.artifacts);

  // ============================================================================
  // PHASE 8: PROGRAM DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Program Documentation');

  const programDocs = await ctx.task(hwProgramDocsTask, {
    facilityName,
    regulatoryAssessment,
    wasteEvaluation,
    storageHandling,
    treatmentDisposal,
    trainingProgram,
    recordkeepingReporting,
    contingencyPlan,
    outputDir
  });

  artifacts.push(...programDocs.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    facilityName,
    managementProgram: {
      generatorStatus: regulatoryAssessment.generatorStatus,
      wasteStreams: wasteEvaluation.wasteStreams,
      storageRequirements: storageHandling.requirements,
      treatmentDisposal: treatmentDisposal.strategy
    },
    complianceStatus: {
      overallStatus: regulatoryAssessment.complianceStatus,
      gaps: regulatoryAssessment.complianceGaps,
      correctiveActions: regulatoryAssessment.correctiveActions
    },
    trainingPlan: trainingProgram.trainingPlan,
    contingencyPlan: contingencyPlan.planSummary,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/hazardous-waste-management-program',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const hwRegulatoryTask = defineTask('hw-regulatory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Regulatory Assessment',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'RCRA Compliance Specialist',
      task: 'Assess regulatory requirements for hazardous waste',
      context: args,
      instructions: [
        '1. Determine generator category (LQG, SQG, VSQG)',
        '2. Identify applicable federal regulations',
        '3. Identify state-specific requirements',
        '4. Assess permit requirements',
        '5. Identify land disposal restrictions',
        '6. Determine manifest requirements',
        '7. Assess biennial reporting requirements',
        '8. Identify compliance gaps',
        '9. Develop corrective action plan',
        '10. Document regulatory assessment'
      ],
      outputFormat: 'JSON with generator status, compliance status, gaps'
    },
    outputSchema: {
      type: 'object',
      required: ['generatorStatus', 'complianceStatus', 'complianceGaps', 'artifacts'],
      properties: {
        generatorStatus: { type: 'string' },
        federalRequirements: { type: 'object' },
        stateRequirements: { type: 'object' },
        permitStatus: { type: 'object' },
        complianceStatus: { type: 'object' },
        complianceGaps: { type: 'array' },
        correctiveActions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'hazwaste', 'regulatory']
}));

export const hwWasteEvalTask = defineTask('hw-waste-eval', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Waste Stream Evaluation',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Hazardous Waste Specialist',
      task: 'Evaluate hazardous waste streams',
      context: args,
      instructions: [
        '1. Identify all hazardous waste streams',
        '2. Determine waste codes for each stream',
        '3. Estimate generation quantities',
        '4. Identify waste minimization opportunities',
        '5. Evaluate recycling options',
        '6. Assess treatment alternatives',
        '7. Identify prohibited activities',
        '8. Develop waste profiles',
        '9. Evaluate satellite accumulation needs',
        '10. Document waste evaluation'
      ],
      outputFormat: 'JSON with waste streams, codes, quantities'
    },
    outputSchema: {
      type: 'object',
      required: ['wasteStreams', 'wasteCodes', 'quantities', 'wasteStreamCount', 'artifacts'],
      properties: {
        wasteStreams: { type: 'array' },
        wasteCodes: { type: 'object' },
        quantities: { type: 'object' },
        wasteStreamCount: { type: 'number' },
        minimizationOpportunities: { type: 'array' },
        recyclingOptions: { type: 'array' },
        wasteProfiles: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'hazwaste', 'evaluation']
}));

export const storageHandlingTask = defineTask('storage-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Storage and Handling Requirements',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Hazardous Waste Storage Specialist',
      task: 'Develop storage and handling requirements',
      context: args,
      instructions: [
        '1. Design satellite accumulation areas',
        '2. Design central accumulation area',
        '3. Specify container requirements',
        '4. Develop labeling procedures',
        '5. Design secondary containment',
        '6. Develop inspection procedures',
        '7. Specify compatibility requirements',
        '8. Develop aisle space requirements',
        '9. Design emergency equipment',
        '10. Document storage requirements'
      ],
      outputFormat: 'JSON with requirements, storage design, procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'storageDesign', 'procedures', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        satelliteAreas: { type: 'array' },
        centralAccumulation: { type: 'object' },
        storageDesign: { type: 'object' },
        containerRequirements: { type: 'object' },
        labelingProcedures: { type: 'object' },
        secondaryContainment: { type: 'object' },
        inspectionProcedures: { type: 'object' },
        procedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'hazwaste', 'storage']
}));

export const treatmentDisposalTask = defineTask('treatment-disposal', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Treatment and Disposal Planning',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Hazardous Waste Disposal Planner',
      task: 'Plan treatment and disposal options',
      context: args,
      instructions: [
        '1. Evaluate treatment options',
        '2. Identify permitted TSDF facilities',
        '3. Verify facility acceptance',
        '4. Address land disposal restrictions',
        '5. Develop manifest procedures',
        '6. Evaluate transporter options',
        '7. Establish vendor qualification',
        '8. Develop cost estimates',
        '9. Plan disposal scheduling',
        '10. Document T&D strategy'
      ],
      outputFormat: 'JSON with strategy, facilities, costs'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'facilities', 'costs', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        treatmentOptions: { type: 'array' },
        disposalOptions: { type: 'array' },
        facilities: { type: 'array' },
        transporters: { type: 'array' },
        ldrCompliance: { type: 'object' },
        manifestProcedures: { type: 'object' },
        costs: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'hazwaste', 'disposal']
}));

export const hwTrainingTask = defineTask('hw-training', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Training Program Development',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Hazardous Waste Training Specialist',
      task: 'Develop hazardous waste training program',
      context: args,
      instructions: [
        '1. Identify training requirements',
        '2. Develop training curriculum',
        '3. Identify job positions requiring training',
        '4. Develop initial training program',
        '5. Develop annual refresher training',
        '6. Create training materials',
        '7. Develop competency assessment',
        '8. Plan training schedule',
        '9. Design recordkeeping system',
        '10. Document training program'
      ],
      outputFormat: 'JSON with training plan, curriculum, requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['trainingPlan', 'curriculum', 'requirements', 'artifacts'],
      properties: {
        trainingPlan: { type: 'object' },
        requirements: { type: 'object' },
        curriculum: { type: 'array' },
        jobPositions: { type: 'array' },
        trainingMaterials: { type: 'array' },
        schedule: { type: 'object' },
        recordkeeping: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'hazwaste', 'training']
}));

export const recordkeepingTask = defineTask('recordkeeping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Recordkeeping and Reporting',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Hazardous Waste Records Specialist',
      task: 'Develop recordkeeping and reporting system',
      context: args,
      instructions: [
        '1. Identify recordkeeping requirements',
        '2. Design manifest tracking system',
        '3. Develop inspection log system',
        '4. Design training records system',
        '5. Develop waste characterization files',
        '6. Plan biennial report preparation',
        '7. Design exception reporting',
        '8. Establish retention periods',
        '9. Design records organization',
        '10. Document recordkeeping procedures'
      ],
      outputFormat: 'JSON with recordkeeping system, reporting requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['recordkeepingSystem', 'reportingRequirements', 'artifacts'],
      properties: {
        recordkeepingSystem: { type: 'object' },
        manifestTracking: { type: 'object' },
        inspectionLogs: { type: 'object' },
        trainingRecords: { type: 'object' },
        reportingRequirements: { type: 'object' },
        biennialReport: { type: 'object' },
        retentionPeriods: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'hazwaste', 'recordkeeping']
}));

export const hwContingencyTask = defineTask('hw-contingency', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Contingency Planning',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Emergency Response Planner',
      task: 'Develop contingency and emergency response plan',
      context: args,
      instructions: [
        '1. Identify potential emergencies',
        '2. Designate emergency coordinator',
        '3. Develop emergency procedures',
        '4. Coordinate with local responders',
        '5. Design alarm and communication systems',
        '6. Plan evacuation routes',
        '7. Identify emergency equipment',
        '8. Develop spill response procedures',
        '9. Plan post-emergency activities',
        '10. Document contingency plan'
      ],
      outputFormat: 'JSON with plan summary, procedures, coordination'
    },
    outputSchema: {
      type: 'object',
      required: ['planSummary', 'procedures', 'coordination', 'artifacts'],
      properties: {
        planSummary: { type: 'object' },
        emergencyCoordinator: { type: 'object' },
        emergencyProcedures: { type: 'object' },
        procedures: { type: 'object' },
        localCoordination: { type: 'object' },
        coordination: { type: 'object' },
        alarmSystems: { type: 'object' },
        evacuationRoutes: { type: 'array' },
        emergencyEquipment: { type: 'array' },
        spillResponse: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'hazwaste', 'contingency']
}));

export const hwProgramDocsTask = defineTask('hw-program-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Program Documentation',
  agent: {
    name: 'waste-management-specialist',
    prompt: {
      role: 'Hazardous Waste Program Manager',
      task: 'Compile hazardous waste management program documentation',
      context: args,
      instructions: [
        '1. Prepare program manual',
        '2. Compile waste determination records',
        '3. Prepare storage area plans',
        '4. Compile training documentation',
        '5. Prepare contingency plan',
        '6. Compile inspection forms',
        '7. Prepare manifest procedures',
        '8. Compile vendor documentation',
        '9. Prepare compliance checklist',
        '10. Generate program package'
      ],
      outputFormat: 'JSON with document list, manual path, checklist'
    },
    outputSchema: {
      type: 'object',
      required: ['documentList', 'manualPath', 'complianceChecklist', 'artifacts'],
      properties: {
        documentList: { type: 'array' },
        manualPath: { type: 'string' },
        wasteDeterminations: { type: 'array' },
        storageAreaPlans: { type: 'array' },
        trainingDocumentation: { type: 'object' },
        inspectionForms: { type: 'array' },
        complianceChecklist: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'hazwaste', 'documentation']
}));
