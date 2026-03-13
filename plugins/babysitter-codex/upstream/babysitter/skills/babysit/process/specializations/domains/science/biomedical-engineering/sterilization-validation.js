/**
 * @process specializations/domains/science/biomedical-engineering/sterilization-validation
 * @description Sterilization Validation - Validate sterilization processes for medical devices ensuring
 * sterility assurance level (SAL) achievement per ISO 11135, ISO 11137, or ISO 17665.
 * @inputs { deviceName: string, sterilizationMethod: string, productCharacteristics: object, salRequirement?: string }
 * @outputs { success: boolean, validationProtocol: object, validationReport: object, routineControlParams: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/sterilization-validation', {
 *   deviceName: 'Surgical Instrument Set',
 *   sterilizationMethod: 'Steam',
 *   productCharacteristics: { material: 'Stainless Steel', packaging: 'Rigid container' },
 *   salRequirement: '10^-6'
 * });
 *
 * @references
 * - ISO 11135:2014 Sterilization of health-care products - Ethylene oxide
 * - ISO 11137:2006 Sterilization of health care products - Radiation
 * - ISO 17665:2006 Sterilization of health care products - Moist heat
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deviceName,
    sterilizationMethod,
    productCharacteristics,
    salRequirement = '10^-6'
  } = inputs;

  // Phase 1: Sterilization Method Selection
  const methodSelection = await ctx.task(methodSelectionTask, {
    deviceName,
    sterilizationMethod,
    productCharacteristics
  });

  // Phase 2: Bioburden Determination
  const bioburdenDetermination = await ctx.task(bioburdenTask, {
    deviceName,
    productCharacteristics
  });

  // Phase 3: Product Dose Establishment
  const doseEstablishment = await ctx.task(doseEstablishmentTask, {
    deviceName,
    sterilizationMethod,
    bioburdenDetermination,
    salRequirement
  });

  // Phase 4: Process Development
  const processDevelopment = await ctx.task(processDevelopmentTask, {
    deviceName,
    sterilizationMethod,
    doseEstablishment,
    productCharacteristics
  });

  // Breakpoint: Review process parameters
  await ctx.breakpoint({
    question: `Review sterilization process parameters for ${deviceName}. Are parameters appropriate for SAL achievement?`,
    title: 'Process Parameter Review',
    context: {
      runId: ctx.runId,
      deviceName,
      processParameters: processDevelopment.parameters,
      files: [{
        path: `artifacts/phase4-process-development.json`,
        format: 'json',
        content: processDevelopment
      }]
    }
  });

  // Phase 5: Installation Qualification (IQ)
  const installationQualification = await ctx.task(iqTask, {
    deviceName,
    sterilizationMethod,
    processDevelopment
  });

  // Phase 6: Operational Qualification (OQ)
  const operationalQualification = await ctx.task(oqTask, {
    deviceName,
    sterilizationMethod,
    processDevelopment,
    installationQualification
  });

  // Phase 7: Performance Qualification (PQ)
  const performanceQualification = await ctx.task(pqTask, {
    deviceName,
    sterilizationMethod,
    doseEstablishment,
    operationalQualification
  });

  // Phase 8: Validation Report and Routine Control
  const validationReport = await ctx.task(validationReportTask, {
    deviceName,
    sterilizationMethod,
    salRequirement,
    methodSelection,
    bioburdenDetermination,
    doseEstablishment,
    processDevelopment,
    installationQualification,
    operationalQualification,
    performanceQualification
  });

  // Final Breakpoint: Validation Approval
  await ctx.breakpoint({
    question: `Sterilization validation complete for ${deviceName}. SAL demonstrated: ${salRequirement}. Approve validation?`,
    title: 'Sterilization Validation Approval',
    context: {
      runId: ctx.runId,
      deviceName,
      salDemonstrated: salRequirement,
      files: [
        { path: `artifacts/sterilization-validation-report.json`, format: 'json', content: validationReport }
      ]
    }
  });

  return {
    success: true,
    deviceName,
    validationProtocol: {
      iq: installationQualification.protocol,
      oq: operationalQualification.protocol,
      pq: performanceQualification.protocol
    },
    validationReport: validationReport.report,
    routineControlParams: validationReport.routineControl,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/sterilization-validation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const methodSelectionTask = defineTask('method-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Method Selection - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Sterilization Engineer',
      task: 'Select and justify sterilization method',
      context: {
        deviceName: args.deviceName,
        sterilizationMethod: args.sterilizationMethod,
        productCharacteristics: args.productCharacteristics
      },
      instructions: [
        '1. Review product material compatibility',
        '2. Assess packaging compatibility',
        '3. Evaluate method effectiveness',
        '4. Consider product functionality',
        '5. Assess environmental impact',
        '6. Review regulatory requirements',
        '7. Compare available methods',
        '8. Document selection rationale',
        '9. Identify applicable standard',
        '10. Create method selection report'
      ],
      outputFormat: 'JSON object with method selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedMethod', 'applicableStandard', 'rationale'],
      properties: {
        selectedMethod: { type: 'string' },
        applicableStandard: { type: 'string' },
        rationale: { type: 'string' },
        compatibilityAssessment: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sterilization', 'method-selection', 'medical-device']
}));

export const bioburdenTask = defineTask('bioburden-determination', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Bioburden Determination - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Microbiology Specialist',
      task: 'Determine product bioburden',
      context: {
        deviceName: args.deviceName,
        productCharacteristics: args.productCharacteristics
      },
      instructions: [
        '1. Develop bioburden sampling plan',
        '2. Define recovery methods',
        '3. Validate recovery methods',
        '4. Conduct bioburden testing',
        '5. Characterize microbial flora',
        '6. Assess bioburden variability',
        '7. Establish bioburden limits',
        '8. Document testing methods',
        '9. Plan routine monitoring',
        '10. Create bioburden report'
      ],
      outputFormat: 'JSON object with bioburden determination'
    },
    outputSchema: {
      type: 'object',
      required: ['bioburdenLevel', 'recoveryMethod', 'monitoringPlan'],
      properties: {
        bioburdenLevel: { type: 'object' },
        recoveryMethod: { type: 'object' },
        monitoringPlan: { type: 'object' },
        microbialFlora: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sterilization', 'bioburden', 'medical-device']
}));

export const doseEstablishmentTask = defineTask('dose-establishment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Dose Establishment - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Sterilization Validation Specialist',
      task: 'Establish sterilization dose/parameters',
      context: {
        deviceName: args.deviceName,
        sterilizationMethod: args.sterilizationMethod,
        bioburdenDetermination: args.bioburdenDetermination,
        salRequirement: args.salRequirement
      },
      instructions: [
        '1. Select dose setting method (VDmax, etc.)',
        '2. Calculate required dose/exposure',
        '3. Consider safety factors',
        '4. Plan dose verification experiments',
        '5. Conduct dose setting studies',
        '6. Verify SAL achievement',
        '7. Document dose calculation',
        '8. Establish dose audits',
        '9. Plan dose maintenance',
        '10. Create dose establishment report'
      ],
      outputFormat: 'JSON object with dose establishment'
    },
    outputSchema: {
      type: 'object',
      required: ['establishedDose', 'doseSettingMethod', 'salVerification'],
      properties: {
        establishedDose: { type: 'object' },
        doseSettingMethod: { type: 'string' },
        salVerification: { type: 'object' },
        auditSchedule: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sterilization', 'dose-setting', 'medical-device']
}));

export const processDevelopmentTask = defineTask('process-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Process Development - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Process Development Engineer',
      task: 'Develop sterilization process parameters',
      context: {
        deviceName: args.deviceName,
        sterilizationMethod: args.sterilizationMethod,
        doseEstablishment: args.doseEstablishment,
        productCharacteristics: args.productCharacteristics
      },
      instructions: [
        '1. Define process parameters',
        '2. Identify critical parameters',
        '3. Establish parameter ranges',
        '4. Define load configuration',
        '5. Plan process monitoring',
        '6. Define acceptance criteria',
        '7. Conduct development runs',
        '8. Optimize process',
        '9. Document process specification',
        '10. Create process development report'
      ],
      outputFormat: 'JSON object with process development'
    },
    outputSchema: {
      type: 'object',
      required: ['parameters', 'criticalParameters', 'loadConfiguration'],
      properties: {
        parameters: { type: 'object' },
        criticalParameters: { type: 'array', items: { type: 'string' } },
        loadConfiguration: { type: 'object' },
        acceptanceCriteria: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sterilization', 'process-development', 'medical-device']
}));

export const iqTask = defineTask('installation-qualification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: IQ - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Validation Engineer',
      task: 'Execute Installation Qualification',
      context: {
        deviceName: args.deviceName,
        sterilizationMethod: args.sterilizationMethod,
        processDevelopment: args.processDevelopment
      },
      instructions: [
        '1. Verify equipment installation',
        '2. Document equipment specifications',
        '3. Verify utility connections',
        '4. Verify instrument calibration',
        '5. Document maintenance procedures',
        '6. Verify safety systems',
        '7. Document spare parts',
        '8. Verify documentation',
        '9. Execute IQ protocol',
        '10. Create IQ report'
      ],
      outputFormat: 'JSON object with IQ'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'results', 'deviations'],
      properties: {
        protocol: { type: 'object' },
        results: { type: 'object' },
        deviations: { type: 'array', items: { type: 'object' } },
        approvals: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sterilization', 'iq', 'validation']
}));

export const oqTask = defineTask('operational-qualification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: OQ - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Validation Engineer',
      task: 'Execute Operational Qualification',
      context: {
        deviceName: args.deviceName,
        sterilizationMethod: args.sterilizationMethod,
        processDevelopment: args.processDevelopment,
        installationQualification: args.installationQualification
      },
      instructions: [
        '1. Define OQ test parameters',
        '2. Conduct empty chamber studies',
        '3. Map temperature/dose distribution',
        '4. Identify cold spots/hot spots',
        '5. Verify parameter control',
        '6. Test alarm functions',
        '7. Verify process reproducibility',
        '8. Document OQ results',
        '9. Address deviations',
        '10. Create OQ report'
      ],
      outputFormat: 'JSON object with OQ'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'results', 'distribution'],
      properties: {
        protocol: { type: 'object' },
        results: { type: 'object' },
        distribution: { type: 'object' },
        deviations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sterilization', 'oq', 'validation']
}));

export const pqTask = defineTask('performance-qualification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: PQ - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Validation Engineer',
      task: 'Execute Performance Qualification',
      context: {
        deviceName: args.deviceName,
        sterilizationMethod: args.sterilizationMethod,
        doseEstablishment: args.doseEstablishment,
        operationalQualification: args.operationalQualification
      },
      instructions: [
        '1. Define PQ test loads',
        '2. Include biological indicators',
        '3. Conduct PQ runs (minimum 3)',
        '4. Monitor process parameters',
        '5. Verify biological indicator results',
        '6. Verify product sterility',
        '7. Verify product functionality',
        '8. Document PQ results',
        '9. Establish routine parameters',
        '10. Create PQ report'
      ],
      outputFormat: 'JSON object with PQ'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'results', 'biIndicatorResults'],
      properties: {
        protocol: { type: 'object' },
        results: { type: 'object' },
        biIndicatorResults: { type: 'object' },
        routineParameters: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sterilization', 'pq', 'validation']
}));

export const validationReportTask = defineTask('validation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Validation Report - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Validation Documentation Manager',
      task: 'Compile sterilization validation report',
      context: {
        deviceName: args.deviceName,
        sterilizationMethod: args.sterilizationMethod,
        salRequirement: args.salRequirement,
        methodSelection: args.methodSelection,
        bioburdenDetermination: args.bioburdenDetermination,
        doseEstablishment: args.doseEstablishment,
        processDevelopment: args.processDevelopment,
        installationQualification: args.installationQualification,
        operationalQualification: args.operationalQualification,
        performanceQualification: args.performanceQualification
      },
      instructions: [
        '1. Compile validation summary',
        '2. Include IQ/OQ/PQ results',
        '3. Document SAL demonstration',
        '4. Define routine control parameters',
        '5. Establish release criteria',
        '6. Define revalidation triggers',
        '7. Document change control',
        '8. Include approvals',
        '9. Archive validation records',
        '10. Create validation report'
      ],
      outputFormat: 'JSON object with validation report'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'routineControl', 'revalidationTriggers'],
      properties: {
        report: { type: 'object' },
        routineControl: { type: 'object' },
        revalidationTriggers: { type: 'array', items: { type: 'string' } },
        approvals: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sterilization', 'validation-report', 'documentation']
}));
