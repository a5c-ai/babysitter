/**
 * @process environmental-engineering/continuous-emission-monitoring-implementation
 * @description Continuous Emission Monitoring Implementation - Design and deployment of CEMS and COMS for
 * regulatory compliance including QA/QC procedures and data management.
 * @inputs { facilityName: string, monitoringRequirements: object, sourceCharacteristics: object }
 * @outputs { success: boolean, cemsDesign: object, qaqcProcedures: object, dataManagement: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/continuous-emission-monitoring-implementation', {
 *   facilityName: 'Power Plant Unit 3',
 *   monitoringRequirements: { pollutants: ['SO2', 'NOx', 'CO2', 'Opacity'], regulation: '40 CFR Part 75' },
 *   sourceCharacteristics: { flowRate: 500000, temperature: 300, stackDiameter: 12 }
 * });
 *
 * @references
 * - 40 CFR Part 60 Appendix B
 * - 40 CFR Part 75 - Continuous Emission Monitoring
 * - EPA CEMS Performance Specifications
 * - ASTM CEMS Standards
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    facilityName,
    monitoringRequirements = {},
    sourceCharacteristics = {},
    existingInfrastructure = {},
    outputDir = 'cems-implementation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CEMS Implementation: ${facilityName}`);
  ctx.log('info', `Pollutants: ${monitoringRequirements.pollutants?.join(', ')}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Monitoring Requirements Analysis');

  const requirementsAnalysis = await ctx.task(cemsRequirementsTask, {
    facilityName,
    monitoringRequirements,
    sourceCharacteristics,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: CEMS SYSTEM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: CEMS System Design');

  const cemsDesign = await ctx.task(cemsDesignTask, {
    facilityName,
    requirementsAnalysis,
    sourceCharacteristics,
    existingInfrastructure,
    outputDir
  });

  artifacts.push(...cemsDesign.artifacts);

  // ============================================================================
  // PHASE 3: INSTALLATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Installation Planning');

  const installationPlan = await ctx.task(cemsInstallationTask, {
    facilityName,
    cemsDesign,
    sourceCharacteristics,
    outputDir
  });

  artifacts.push(...installationPlan.artifacts);

  // Breakpoint: Design Review
  await ctx.breakpoint({
    question: `CEMS design complete for ${facilityName}. Analyzers: ${cemsDesign.analyzers.length}. Review design and installation plan?`,
    title: 'CEMS Design Review',
    context: {
      runId: ctx.runId,
      analyzers: cemsDesign.analyzers,
      sampleSystem: cemsDesign.sampleSystem,
      installationSchedule: installationPlan.schedule,
      files: cemsDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 4: QA/QC PROCEDURES
  // ============================================================================

  ctx.log('info', 'Phase 4: QA/QC Procedures Development');

  const qaqcProcedures = await ctx.task(cemsQAQCTask, {
    facilityName,
    cemsDesign,
    monitoringRequirements,
    outputDir
  });

  artifacts.push(...qaqcProcedures.artifacts);

  // ============================================================================
  // PHASE 5: DATA MANAGEMENT SYSTEM
  // ============================================================================

  ctx.log('info', 'Phase 5: Data Management System Design');

  const dataManagement = await ctx.task(cemsDataManagementTask, {
    facilityName,
    cemsDesign,
    monitoringRequirements,
    outputDir
  });

  artifacts.push(...dataManagement.artifacts);

  // ============================================================================
  // PHASE 6: CERTIFICATION TESTING PLAN
  // ============================================================================

  ctx.log('info', 'Phase 6: Certification Testing Plan');

  const certificationPlan = await ctx.task(cemsCertificationTask, {
    facilityName,
    cemsDesign,
    monitoringRequirements,
    outputDir
  });

  artifacts.push(...certificationPlan.artifacts);

  // ============================================================================
  // PHASE 7: IMPLEMENTATION DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementation Documentation');

  const implementationDocs = await ctx.task(cemsDocumentationTask, {
    facilityName,
    requirementsAnalysis,
    cemsDesign,
    installationPlan,
    qaqcProcedures,
    dataManagement,
    certificationPlan,
    outputDir
  });

  artifacts.push(...implementationDocs.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    facilityName,
    cemsDesign: {
      analyzers: cemsDesign.analyzers,
      sampleSystem: cemsDesign.sampleSystem,
      dataAcquisition: cemsDesign.dataAcquisition
    },
    qaqcProcedures: {
      dailyCalibrations: qaqcProcedures.dailyCalibrations,
      quarterlyAudits: qaqcProcedures.quarterlyAudits,
      rataRequirements: qaqcProcedures.rataRequirements
    },
    dataManagement: {
      dataSystem: dataManagement.dataSystem,
      reportingRequirements: dataManagement.reportingRequirements
    },
    certificationPlan: certificationPlan.testingPlan,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/continuous-emission-monitoring-implementation',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const cemsRequirementsTask = defineTask('cems-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitoring Requirements Analysis',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'CEMS Compliance Specialist',
      task: 'Analyze regulatory requirements for continuous monitoring',
      context: args,
      instructions: [
        '1. Identify applicable regulations (Part 60, Part 75, MACT)',
        '2. Determine required pollutants to monitor',
        '3. Identify performance specifications',
        '4. Determine QA/QC requirements',
        '5. Identify data availability requirements',
        '6. Determine reporting requirements',
        '7. Assess substitute data requirements',
        '8. Identify certification requirements',
        '9. Document monitoring plan requirements',
        '10. Create requirements matrix'
      ],
      outputFormat: 'JSON with requirements, specifications, reporting needs'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'performanceSpecs', 'reportingNeeds', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        applicableRegulations: { type: 'array' },
        performanceSpecs: { type: 'object' },
        qaqcRequirements: { type: 'object' },
        reportingNeeds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'cems', 'requirements']
}));

export const cemsDesignTask = defineTask('cems-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'CEMS System Design',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'CEMS Design Engineer',
      task: 'Design continuous emission monitoring system',
      context: args,
      instructions: [
        '1. Select gas analyzers for each pollutant',
        '2. Design sample extraction system',
        '3. Design sample conditioning system',
        '4. Design flow monitoring system',
        '5. Specify calibration gas requirements',
        '6. Design data acquisition system',
        '7. Specify shelter/enclosure requirements',
        '8. Design utilities (power, air, etc.)',
        '9. Prepare equipment specifications',
        '10. Document system design'
      ],
      outputFormat: 'JSON with analyzers, sample system, data acquisition'
    },
    outputSchema: {
      type: 'object',
      required: ['analyzers', 'sampleSystem', 'dataAcquisition', 'artifacts'],
      properties: {
        analyzers: { type: 'array' },
        sampleSystem: { type: 'object' },
        flowMonitoring: { type: 'object' },
        dataAcquisition: { type: 'object' },
        calibrationGases: { type: 'array' },
        shelterRequirements: { type: 'object' },
        utilities: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'cems', 'design']
}));

export const cemsInstallationTask = defineTask('cems-installation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Installation Planning',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'CEMS Installation Specialist',
      task: 'Develop CEMS installation plan',
      context: args,
      instructions: [
        '1. Develop installation sequence',
        '2. Identify port locations',
        '3. Plan shelter/platform installation',
        '4. Plan sample line routing',
        '5. Plan electrical installation',
        '6. Develop startup procedures',
        '7. Plan commissioning activities',
        '8. Develop installation schedule',
        '9. Identify contractor requirements',
        '10. Document installation plan'
      ],
      outputFormat: 'JSON with installation plan, schedule, procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['installationPlan', 'schedule', 'procedures', 'artifacts'],
      properties: {
        installationPlan: { type: 'object' },
        portLocations: { type: 'array' },
        installationSequence: { type: 'array' },
        schedule: { type: 'object' },
        procedures: { type: 'object' },
        contractorRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'cems', 'installation']
}));

export const cemsQAQCTask = defineTask('cems-qaqc', (args, taskCtx) => ({
  kind: 'agent',
  title: 'QA/QC Procedures Development',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'CEMS QA/QC Specialist',
      task: 'Develop QA/QC procedures for CEMS',
      context: args,
      instructions: [
        '1. Develop daily calibration procedures',
        '2. Develop cylinder gas audit procedures',
        '3. Develop RATA procedures',
        '4. Develop linearity check procedures',
        '5. Establish out-of-control criteria',
        '6. Develop corrective action procedures',
        '7. Establish data validation procedures',
        '8. Develop preventive maintenance schedule',
        '9. Create QA/QC documentation forms',
        '10. Document QA/QC plan'
      ],
      outputFormat: 'JSON with calibrations, audits, RATA requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['dailyCalibrations', 'quarterlyAudits', 'rataRequirements', 'artifacts'],
      properties: {
        dailyCalibrations: { type: 'object' },
        quarterlyAudits: { type: 'object' },
        rataRequirements: { type: 'object' },
        linearityChecks: { type: 'object' },
        outOfControlCriteria: { type: 'object' },
        maintenanceSchedule: { type: 'object' },
        qaqcPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'cems', 'qaqc']
}));

export const cemsDataManagementTask = defineTask('cems-data-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Data Management System Design',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'CEMS Data Management Specialist',
      task: 'Design data acquisition and handling system',
      context: args,
      instructions: [
        '1. Design data acquisition system',
        '2. Specify data averaging requirements',
        '3. Design data validation algorithms',
        '4. Develop substitute data procedures',
        '5. Design reporting system',
        '6. Specify data storage requirements',
        '7. Design backup and recovery procedures',
        '8. Develop EDR format requirements',
        '9. Plan EPA reporting integration',
        '10. Document data management system'
      ],
      outputFormat: 'JSON with data system, reporting requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['dataSystem', 'reportingRequirements', 'artifacts'],
      properties: {
        dataSystem: { type: 'object' },
        dataAcquisition: { type: 'object' },
        dataValidation: { type: 'object' },
        substituteData: { type: 'object' },
        reportingRequirements: { type: 'object' },
        edrRequirements: { type: 'object' },
        storageRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'cems', 'data-management']
}));

export const cemsCertificationTask = defineTask('cems-certification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Certification Testing Plan',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'CEMS Certification Specialist',
      task: 'Develop CEMS certification testing plan',
      context: args,
      instructions: [
        '1. Identify certification requirements',
        '2. Develop RATA test plan',
        '3. Develop linearity test plan',
        '4. Develop cylinder gas audit plan',
        '5. Plan relative accuracy testing',
        '6. Specify reference method testing',
        '7. Develop test report format',
        '8. Plan certification schedule',
        '9. Identify testing contractor requirements',
        '10. Document certification plan'
      ],
      outputFormat: 'JSON with testing plan, schedule, procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['testingPlan', 'schedule', 'procedures', 'artifacts'],
      properties: {
        testingPlan: { type: 'object' },
        rataPlan: { type: 'object' },
        linearityPlan: { type: 'object' },
        referenceMethods: { type: 'array' },
        schedule: { type: 'object' },
        procedures: { type: 'object' },
        contractorRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'cems', 'certification']
}));

export const cemsDocumentationTask = defineTask('cems-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implementation Documentation',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'CEMS Documentation Specialist',
      task: 'Compile CEMS implementation documentation',
      context: args,
      instructions: [
        '1. Prepare monitoring plan',
        '2. Prepare QA/QC plan',
        '3. Compile equipment specifications',
        '4. Prepare installation drawings',
        '5. Prepare O&M manual',
        '6. Compile certification documents',
        '7. Prepare regulatory submittals',
        '8. Create training materials',
        '9. Prepare spare parts list',
        '10. Generate documentation package'
      ],
      outputFormat: 'JSON with document list, plans, manuals'
    },
    outputSchema: {
      type: 'object',
      required: ['documentList', 'monitoringPlan', 'omManual', 'artifacts'],
      properties: {
        documentList: { type: 'array' },
        monitoringPlan: { type: 'object' },
        qaqcPlan: { type: 'object' },
        omManual: { type: 'object' },
        specifications: { type: 'array' },
        trainingMaterials: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'cems', 'documentation']
}));
