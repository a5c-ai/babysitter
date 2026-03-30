/**
 * @process MS-019: Non-Destructive Testing Protocol
 * @description Comprehensive NDT protocol development and execution including ultrasonic,
 * radiographic, magnetic particle, dye penetrant, eddy current, and acoustic emission testing
 * @inputs {
 *   componentType: string,
 *   materialSystem: string,
 *   defectTypes: string[], // cracks, voids, inclusions, porosity, delaminations
 *   ndtMethods: string[], // UT, RT, MT, PT, ET, AE, VT
 *   inspectionStandards: string[], // ASME, ASTM, ISO, AWS standards
 *   acceptanceCriteria: object,
 *   geometryConstraints: object,
 *   projectContext: string
 * }
 * @outputs {
 *   ndtProtocol: object,
 *   inspectionResults: object,
 *   defectCharacterization: object,
 *   acceptanceEvaluation: object,
 *   qualificationRecords: object,
 *   artifacts: string[]
 * }
 * @example
 * {
 *   "componentType": "pressure-vessel-weld",
 *   "materialSystem": "SA-516 Gr. 70 carbon steel",
 *   "defectTypes": ["cracks", "lack-of-fusion", "porosity"],
 *   "ndtMethods": ["UT", "RT", "MT"],
 *   "inspectionStandards": ["ASME V", "ASME VIII"],
 *   "acceptanceCriteria": { "standard": "ASME VIII Div. 1", "class": "1" }
 * }
 * @references ASME BPVC Section V, ASTM E164, ASTM E1444, AWS D1.1, ISO 17640
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    componentType,
    materialSystem,
    defectTypes,
    ndtMethods,
    inspectionStandards,
    acceptanceCriteria,
    geometryConstraints,
    projectContext
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Phase 1: NDT Method Selection and Justification
  ctx.log('info', 'Phase 1: Selecting and justifying NDT methods');
  const methodSelection = await ctx.task(selectNdtMethods, {
    componentType,
    materialSystem,
    defectTypes,
    requestedMethods: ndtMethods,
    geometryConstraints,
    inspectionStandards,
    projectContext
  });
  artifacts.push(...(methodSelection.artifacts || []));

  // Phase 2: Procedure Development
  ctx.log('info', 'Phase 2: Developing inspection procedures');
  const procedureDevelopment = await ctx.task(developNdtProcedures, {
    selectedMethods: methodSelection.selectedMethods,
    materialSystem,
    componentType,
    inspectionStandards,
    acceptanceCriteria,
    geometryConstraints
  });
  artifacts.push(...(procedureDevelopment.artifacts || []));

  // Phase 3: Personnel and Equipment Qualification
  ctx.log('info', 'Phase 3: Establishing qualification requirements');
  const qualificationRequirements = await ctx.task(establishQualifications, {
    ndtMethods: methodSelection.selectedMethods,
    inspectionStandards,
    procedureRequirements: procedureDevelopment.requirements,
    certificationStandards: inputs.certificationStandards
  });
  artifacts.push(...(qualificationRequirements.artifacts || []));

  // Phase 4: Calibration and Reference Standards
  ctx.log('info', 'Phase 4: Specifying calibration and reference standards');
  const calibrationSpec = await ctx.task(specifyCalibration, {
    ndtMethods: methodSelection.selectedMethods,
    materialSystem,
    defectTypes,
    inspectionStandards,
    sensitivityRequirements: procedureDevelopment.sensitivity
  });
  artifacts.push(...(calibrationSpec.artifacts || []));

  // Phase 5: Execute NDT Inspections
  ctx.log('info', 'Phase 5: Executing NDT inspections');
  const inspectionExecution = await ctx.task(executeNdtInspections, {
    procedures: procedureDevelopment.procedures,
    calibrationStandards: calibrationSpec.standards,
    componentType,
    materialSystem,
    coverageRequirements: procedureDevelopment.coverage
  });
  artifacts.push(...(inspectionExecution.artifacts || []));

  // Phase 6: Defect Characterization and Sizing
  ctx.log('info', 'Phase 6: Characterizing and sizing detected indications');
  const defectCharacterization = await ctx.task(characterizeDefects, {
    inspectionData: inspectionExecution.rawData,
    ndtMethods: methodSelection.selectedMethods,
    defectTypes,
    sizingTechniques: procedureDevelopment.sizingMethods
  });
  artifacts.push(...(defectCharacterization.artifacts || []));

  // Quality Gate: Review inspection results
  await ctx.breakpoint({
    question: 'Review NDT inspection results. Are all indications properly characterized and sized?',
    title: 'NDT Results Review',
    context: {
      runId: ctx.runId,
      summary: {
        componentType,
        methodsUsed: methodSelection.selectedMethods,
        indicationsFound: defectCharacterization.indicationCount,
        criticalIndications: defectCharacterization.criticalIndications
      },
      files: artifacts
    }
  });

  // Phase 7: Acceptance Evaluation
  ctx.log('info', 'Phase 7: Evaluating against acceptance criteria');
  const acceptanceEvaluation = await ctx.task(evaluateAcceptance, {
    characterizedDefects: defectCharacterization.results,
    acceptanceCriteria,
    inspectionStandards,
    componentType
  });
  artifacts.push(...(acceptanceEvaluation.artifacts || []));

  // Phase 8: Reporting and Documentation
  ctx.log('info', 'Phase 8: Generating inspection reports and documentation');
  const reportGeneration = await ctx.task(generateNdtReports, {
    inspectionResults: inspectionExecution.results,
    defectCharacterization: defectCharacterization.results,
    acceptanceEvaluation: acceptanceEvaluation.results,
    procedureDevelopment: procedureDevelopment.procedures,
    qualificationRecords: qualificationRequirements.records,
    inspectionStandards
  });
  artifacts.push(...(reportGeneration.artifacts || []));

  const endTime = ctx.now();

  return {
    success: true,
    ndtProtocol: {
      methodSelection: methodSelection.results,
      procedures: procedureDevelopment.procedures,
      calibrationStandards: calibrationSpec.standards,
      qualificationRequirements: qualificationRequirements.requirements,
      coverageMap: procedureDevelopment.coverage
    },
    inspectionResults: {
      rawData: inspectionExecution.rawData,
      processedData: inspectionExecution.processedData,
      indicationLog: inspectionExecution.indicationLog,
      coverageVerification: inspectionExecution.coverage
    },
    defectCharacterization: {
      indications: defectCharacterization.results,
      indicationCount: defectCharacterization.indicationCount,
      criticalIndications: defectCharacterization.criticalIndications,
      sizingData: defectCharacterization.sizingData,
      classificationSummary: defectCharacterization.classification
    },
    acceptanceEvaluation: {
      disposition: acceptanceEvaluation.disposition,
      rejectedIndications: acceptanceEvaluation.rejectedIndications,
      acceptedIndications: acceptanceEvaluation.acceptedIndications,
      borderlineIndications: acceptanceEvaluation.borderlineIndications,
      recommendations: acceptanceEvaluation.recommendations
    },
    qualificationRecords: {
      personnelQualifications: qualificationRequirements.personnelRecords,
      procedureQualifications: qualificationRequirements.procedureRecords,
      equipmentCalibration: calibrationSpec.calibrationRecords
    },
    reports: reportGeneration.reports,
    artifacts,
    metadata: {
      processId: 'MS-019',
      startTime,
      endTime,
      duration: endTime - startTime
    }
  };
}

export const selectNdtMethods = defineTask('select-ndt-methods', (args, taskCtx) => ({
  kind: 'agent',
  title: 'NDT Method Selection',
  agent: {
    name: 'ndt-method-selection-specialist',
    prompt: {
      role: 'Senior NDT Level III engineer specializing in method selection',
      task: `Select and justify NDT methods for ${args.componentType} inspection`,
      context: args,
      instructions: [
        'Evaluate detectability of target defect types by each method',
        'Consider material properties and their effect on each method',
        'Account for geometry and access constraints',
        'Assess sensitivity and resolution requirements',
        'Consider complementary method combinations',
        'Evaluate practical factors (cost, time, portability)',
        'Reference applicable code requirements',
        'Provide probability of detection (POD) estimates'
      ],
      outputFormat: 'JSON with selected methods and justification'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'selectedMethods', 'artifacts'],
      properties: {
        results: { type: 'object' },
        selectedMethods: { type: 'array' },
        justification: { type: 'object' },
        podEstimates: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ndt', 'method-selection', 'materials-science']
}));

export const developNdtProcedures = defineTask('develop-ndt-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'NDT Procedure Development',
  agent: {
    name: 'ndt-procedure-developer',
    prompt: {
      role: 'NDT procedure writer and technique specialist',
      task: `Develop inspection procedures for ${args.componentType} using selected methods`,
      context: args,
      instructions: [
        'Write detailed procedures per applicable standards',
        'Specify equipment requirements and settings',
        'Define scanning patterns and coverage requirements',
        'Establish sensitivity and calibration requirements',
        'Specify defect sizing techniques',
        'Define recording and reporting requirements',
        'Include essential and non-essential variables',
        'Address special technique requirements (TOFD, PAUT, etc.)'
      ],
      outputFormat: 'JSON with inspection procedures and requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['procedures', 'requirements', 'sensitivity', 'sizingMethods', 'coverage', 'artifacts'],
      properties: {
        procedures: { type: 'array' },
        requirements: { type: 'object' },
        sensitivity: { type: 'object' },
        sizingMethods: { type: 'object' },
        coverage: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ndt', 'procedure', 'materials-science']
}));

export const establishQualifications = defineTask('establish-qualifications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'NDT Qualification Requirements',
  agent: {
    name: 'ndt-qualification-specialist',
    prompt: {
      role: 'NDT certification and qualification specialist',
      task: 'Establish personnel and procedure qualification requirements',
      context: args,
      instructions: [
        'Define personnel certification requirements (SNT-TC-1A, ISO 9712, etc.)',
        'Specify required certification levels for each method',
        'Establish procedure qualification requirements',
        'Define demonstration test requirements',
        'Specify equipment qualification criteria',
        'Address technique-specific qualifications (PAUT, TOFD)',
        'Document training and experience requirements',
        'Maintain qualification records and traceability'
      ],
      outputFormat: 'JSON with qualification requirements and records'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'records', 'personnelRecords', 'procedureRecords', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        records: { type: 'object' },
        personnelRecords: { type: 'array' },
        procedureRecords: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ndt', 'qualification', 'materials-science']
}));

export const specifyCalibration = defineTask('specify-calibration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'NDT Calibration Specification',
  agent: {
    name: 'ndt-calibration-specialist',
    prompt: {
      role: 'NDT calibration and reference standard specialist',
      task: 'Specify calibration requirements and reference standards',
      context: args,
      instructions: [
        'Define calibration block requirements per method',
        'Specify reference reflector types and sizes',
        'Establish calibration frequency and verification',
        'Design or select appropriate reference standards',
        'Define DAC, TCG, or other sensitivity curves',
        'Specify transfer corrections for field conditions',
        'Document traceability to national standards',
        'Establish calibration acceptance criteria'
      ],
      outputFormat: 'JSON with calibration specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['standards', 'calibrationRecords', 'artifacts'],
      properties: {
        standards: { type: 'array' },
        calibrationProcedures: { type: 'object' },
        referenceBlocks: { type: 'array' },
        sensitivitySettings: { type: 'object' },
        calibrationRecords: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ndt', 'calibration', 'materials-science']
}));

export const executeNdtInspections = defineTask('execute-ndt-inspections', (args, taskCtx) => ({
  kind: 'agent',
  title: 'NDT Inspection Execution',
  agent: {
    name: 'ndt-inspection-executor',
    prompt: {
      role: 'NDT inspector executing inspection procedures',
      task: `Execute NDT inspections on ${args.componentType}`,
      context: args,
      instructions: [
        'Verify pre-inspection requirements (surface prep, access, lighting)',
        'Perform calibration verification per procedures',
        'Execute scanning per coverage requirements',
        'Record all indications above reporting threshold',
        'Maintain proper documentation and data files',
        'Verify coverage completeness',
        'Perform end-of-shift calibration verification',
        'Log any deviations or non-conformances'
      ],
      outputFormat: 'JSON with inspection data and indication log'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'rawData', 'processedData', 'indicationLog', 'coverage', 'artifacts'],
      properties: {
        results: { type: 'object' },
        rawData: { type: 'object' },
        processedData: { type: 'object' },
        indicationLog: { type: 'array' },
        coverage: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ndt', 'inspection', 'materials-science']
}));

export const characterizeDefects = defineTask('characterize-defects', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Defect Characterization',
  agent: {
    name: 'defect-characterization-specialist',
    prompt: {
      role: 'NDT data analyst specializing in defect characterization',
      task: 'Characterize and size detected indications',
      context: args,
      instructions: [
        'Apply sizing techniques per procedure (6dB drop, tip diffraction, etc.)',
        'Characterize defect type based on signal characteristics',
        'Determine defect orientation and location',
        'Correlate indications across multiple methods',
        'Assess defect morphology and extent',
        'Identify critical and reportable indications',
        'Apply pattern recognition for defect classification',
        'Document uncertainty in sizing measurements'
      ],
      outputFormat: 'JSON with characterized and sized indications'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'indicationCount', 'criticalIndications', 'sizingData', 'classification', 'artifacts'],
      properties: {
        results: { type: 'array' },
        indicationCount: { type: 'number' },
        criticalIndications: { type: 'array' },
        sizingData: { type: 'object' },
        classification: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ndt', 'defect-characterization', 'materials-science']
}));

export const evaluateAcceptance = defineTask('evaluate-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Acceptance Evaluation',
  agent: {
    name: 'ndt-acceptance-evaluator',
    prompt: {
      role: 'NDT Level III engineer for acceptance evaluation',
      task: 'Evaluate indications against acceptance criteria',
      context: args,
      instructions: [
        'Apply acceptance criteria per applicable code',
        'Evaluate each indication against size limits',
        'Consider defect type in acceptance evaluation',
        'Assess cumulative effect of multiple indications',
        'Identify rejectable and borderline indications',
        'Determine disposition (accept, reject, repair, re-inspect)',
        'Recommend additional evaluation if needed (FFS, ECA)',
        'Document acceptance basis for each indication'
      ],
      outputFormat: 'JSON with acceptance evaluation results'
    },
    outputSchema: {
      type: 'object',
      required: ['disposition', 'rejectedIndications', 'acceptedIndications', 'borderlineIndications', 'recommendations', 'artifacts'],
      properties: {
        disposition: { type: 'string' },
        rejectedIndications: { type: 'array' },
        acceptedIndications: { type: 'array' },
        borderlineIndications: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ndt', 'acceptance', 'materials-science']
}));

export const generateNdtReports = defineTask('generate-ndt-reports', (args, taskCtx) => ({
  kind: 'agent',
  title: 'NDT Report Generation',
  agent: {
    name: 'ndt-report-generator',
    prompt: {
      role: 'NDT documentation specialist',
      task: 'Generate comprehensive NDT inspection reports',
      context: args,
      instructions: [
        'Compile inspection reports per code requirements',
        'Include all required report elements',
        'Document procedures, personnel, and equipment used',
        'Present indication data in tabular and graphical form',
        'Include calibration and coverage verification records',
        'Attach supporting data files and images',
        'Obtain required review and approval signatures',
        'Ensure traceability and archival requirements met'
      ],
      outputFormat: 'JSON with generated reports and documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'artifacts'],
      properties: {
        reports: { type: 'array' },
        documentation: { type: 'object' },
        dataArchive: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ndt', 'reporting', 'materials-science']
}));
