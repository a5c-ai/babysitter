/**
 * @process specializations/domains/science/biomedical-engineering/eu-mdr-technical-documentation
 * @description EU MDR Technical Documentation - Develop technical documentation meeting EU Medical Device
 * Regulation (MDR) 2017/745 requirements for CE marking including GSPR mapping and clinical evaluation.
 * @inputs { deviceName: string, riskClass: string, intendedPurpose: string, notifiedBody?: string }
 * @outputs { success: boolean, technicalDocumentation: object, gsprMapping: object, declarationOfConformity: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/eu-mdr-technical-documentation', {
 *   deviceName: 'Diagnostic Ultrasound System',
 *   riskClass: 'IIa',
 *   intendedPurpose: 'Non-invasive diagnostic imaging',
 *   notifiedBody: 'BSI'
 * });
 *
 * @references
 * - EU MDR 2017/745 Annex II Technical Documentation
 * - EU MDR 2017/745 Annex I General Safety and Performance Requirements
 * - MDCG Guidance Documents
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deviceName,
    riskClass,
    intendedPurpose,
    notifiedBody = ''
  } = inputs;

  // Phase 1: GSPR Mapping
  const gsprMapping = await ctx.task(gsprMappingTask, {
    deviceName,
    riskClass,
    intendedPurpose
  });

  // Phase 2: Device Description and Specification
  const deviceSpecification = await ctx.task(deviceSpecificationTask, {
    deviceName,
    riskClass,
    intendedPurpose,
    gsprMapping
  });

  // Phase 3: Design and Manufacturing Information
  const designManufacturing = await ctx.task(designManufacturingTask, {
    deviceName,
    deviceSpecification
  });

  // Phase 4: Risk Management File
  const riskManagementFile = await ctx.task(riskManagementFileTask, {
    deviceName,
    gsprMapping,
    deviceSpecification
  });

  // Breakpoint: Review GSPR compliance
  await ctx.breakpoint({
    question: `Review GSPR compliance for ${deviceName}. Are all applicable requirements addressed?`,
    title: 'GSPR Compliance Review',
    context: {
      runId: ctx.runId,
      deviceName,
      gsprCoverage: gsprMapping.coverageScore,
      files: [{
        path: `artifacts/phase1-gspr-mapping.json`,
        format: 'json',
        content: gsprMapping
      }]
    }
  });

  // Phase 5: Clinical Evaluation Report
  const clinicalEvaluationReport = await ctx.task(clinicalEvaluationTask, {
    deviceName,
    riskClass,
    intendedPurpose,
    gsprMapping
  });

  // Phase 6: Post-Market Surveillance Plan
  const pmsPlan = await ctx.task(pmsPlanTask, {
    deviceName,
    riskClass,
    clinicalEvaluationReport
  });

  // Phase 7: Summary of Safety and Clinical Performance (SSCP)
  const sscp = await ctx.task(sscpTask, {
    deviceName,
    riskClass,
    clinicalEvaluationReport,
    deviceSpecification
  });

  // Phase 8: Technical Documentation Compilation
  const technicalDocumentation = await ctx.task(technicalDocumentationTask, {
    deviceName,
    riskClass,
    intendedPurpose,
    notifiedBody,
    gsprMapping,
    deviceSpecification,
    designManufacturing,
    riskManagementFile,
    clinicalEvaluationReport,
    pmsPlan,
    sscp
  });

  // Final Breakpoint: Technical Documentation Approval
  await ctx.breakpoint({
    question: `EU MDR Technical Documentation complete for ${deviceName}. Approve for Notified Body submission?`,
    title: 'Technical Documentation Approval',
    context: {
      runId: ctx.runId,
      deviceName,
      riskClass,
      files: [
        { path: `artifacts/technical-documentation.json`, format: 'json', content: technicalDocumentation }
      ]
    }
  });

  return {
    success: true,
    deviceName,
    technicalDocumentation: technicalDocumentation.documentation,
    gsprMapping: gsprMapping.mapping,
    declarationOfConformity: technicalDocumentation.dofC,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/eu-mdr-technical-documentation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const gsprMappingTask = defineTask('gspr-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: GSPR Mapping - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'EU MDR Regulatory Specialist',
      task: 'Map device to General Safety and Performance Requirements',
      context: {
        deviceName: args.deviceName,
        riskClass: args.riskClass,
        intendedPurpose: args.intendedPurpose
      },
      instructions: [
        '1. Review all GSPRs in Annex I',
        '2. Determine applicability of each GSPR',
        '3. Map GSPRs to harmonized standards',
        '4. Identify Common Specifications',
        '5. Document compliance methods',
        '6. Identify design requirements',
        '7. Identify testing requirements',
        '8. Calculate GSPR coverage score',
        '9. Document non-applicable GSPRs',
        '10. Create GSPR compliance matrix'
      ],
      outputFormat: 'JSON object with GSPR mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['mapping', 'coverageScore', 'harmonizedStandards'],
      properties: {
        mapping: { type: 'array', items: { type: 'object' } },
        coverageScore: { type: 'number' },
        harmonizedStandards: { type: 'array', items: { type: 'string' } },
        nonApplicable: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['eu-mdr', 'gspr', 'regulatory']
}));

export const deviceSpecificationTask = defineTask('device-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Device Specification - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Document device description and specification per Annex II',
      context: {
        deviceName: args.deviceName,
        riskClass: args.riskClass,
        intendedPurpose: args.intendedPurpose,
        gsprMapping: args.gsprMapping
      },
      instructions: [
        '1. Document device description per Annex II.1',
        '2. Document intended purpose',
        '3. Document indications and contraindications',
        '4. Document patient population',
        '5. Document principles of operation',
        '6. Describe configurations and accessories',
        '7. Document functional elements',
        '8. Document materials in contact',
        '9. Document key functional specifications',
        '10. Create device specification document'
      ],
      outputFormat: 'JSON object with device specification'
    },
    outputSchema: {
      type: 'object',
      required: ['description', 'intendedPurpose', 'specifications'],
      properties: {
        description: { type: 'object' },
        intendedPurpose: { type: 'string' },
        specifications: { type: 'object' },
        configurations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['eu-mdr', 'technical-documentation', 'regulatory']
}));

export const designManufacturingTask = defineTask('design-manufacturing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Design and Manufacturing - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Manufacturing Documentation Specialist',
      task: 'Document design and manufacturing information per Annex II.3',
      context: {
        deviceName: args.deviceName,
        deviceSpecification: args.deviceSpecification
      },
      instructions: [
        '1. Document design stages',
        '2. Document manufacturing processes',
        '3. Identify suppliers and subcontractors',
        '4. Document sites and facilities',
        '5. Include design verification records',
        '6. Include design validation records',
        '7. Document process validations',
        '8. Include final inspections',
        '9. Document traceability system',
        '10. Create design/manufacturing section'
      ],
      outputFormat: 'JSON object with design/manufacturing information'
    },
    outputSchema: {
      type: 'object',
      required: ['designInformation', 'manufacturingInformation', 'validations'],
      properties: {
        designInformation: { type: 'object' },
        manufacturingInformation: { type: 'object' },
        validations: { type: 'array', items: { type: 'object' } },
        suppliers: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['eu-mdr', 'design', 'manufacturing']
}));

export const riskManagementFileTask = defineTask('risk-management-file-mdr', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Risk Management File - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Management Specialist',
      task: 'Prepare risk management file per ISO 14971 and MDR',
      context: {
        deviceName: args.deviceName,
        gsprMapping: args.gsprMapping,
        deviceSpecification: args.deviceSpecification
      },
      instructions: [
        '1. Reference ISO 14971:2019 compliance',
        '2. Document risk management plan',
        '3. Include hazard identification',
        '4. Include risk estimation',
        '5. Include risk control measures',
        '6. Document residual risk evaluation',
        '7. Include benefit-risk analysis',
        '8. Link to GSPR compliance',
        '9. Document post-market feedback loop',
        '10. Create risk management file summary'
      ],
      outputFormat: 'JSON object with risk management file'
    },
    outputSchema: {
      type: 'object',
      required: ['rmfSummary', 'riskAnalysis', 'benefitRisk'],
      properties: {
        rmfSummary: { type: 'object' },
        riskAnalysis: { type: 'object' },
        benefitRisk: { type: 'object' },
        residualRisks: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['eu-mdr', 'risk-management', 'regulatory']
}));

export const clinicalEvaluationTask = defineTask('clinical-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Clinical Evaluation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Evaluation Specialist',
      task: 'Develop clinical evaluation report per MDCG guidance',
      context: {
        deviceName: args.deviceName,
        riskClass: args.riskClass,
        intendedPurpose: args.intendedPurpose,
        gsprMapping: args.gsprMapping
      },
      instructions: [
        '1. Develop clinical evaluation plan',
        '2. Define scope and objectives',
        '3. Conduct literature search',
        '4. Appraise clinical data',
        '5. Analyze equivalent devices',
        '6. Synthesize clinical evidence',
        '7. Demonstrate conformity to GSPRs',
        '8. Conduct benefit-risk analysis',
        '9. Define PMCF plan',
        '10. Create clinical evaluation report'
      ],
      outputFormat: 'JSON object with clinical evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['cer', 'clinicalEvidenceSummary', 'pmcfPlan'],
      properties: {
        cer: { type: 'object' },
        clinicalEvidenceSummary: { type: 'object' },
        pmcfPlan: { type: 'object' },
        equivalenceAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['eu-mdr', 'clinical-evaluation', 'regulatory']
}));

export const pmsPlanTask = defineTask('pms-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: PMS Plan - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Post-Market Surveillance Specialist',
      task: 'Develop post-market surveillance plan per Article 84',
      context: {
        deviceName: args.deviceName,
        riskClass: args.riskClass,
        clinicalEvaluationReport: args.clinicalEvaluationReport
      },
      instructions: [
        '1. Define PMS system',
        '2. Document data collection methods',
        '3. Define PSUR requirements',
        '4. Include PMCF activities',
        '5. Define trend analysis methods',
        '6. Document vigilance procedures',
        '7. Define corrective action triggers',
        '8. Document reporting timelines',
        '9. Link to clinical evaluation update',
        '10. Create PMS plan document'
      ],
      outputFormat: 'JSON object with PMS plan'
    },
    outputSchema: {
      type: 'object',
      required: ['pmsPlan', 'psurRequirements', 'vigilanceProcedures'],
      properties: {
        pmsPlan: { type: 'object' },
        psurRequirements: { type: 'object' },
        vigilanceProcedures: { type: 'object' },
        pmcfActivities: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['eu-mdr', 'pms', 'regulatory']
}));

export const sscpTask = defineTask('sscp', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: SSCP - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Regulatory Documentation Specialist',
      task: 'Prepare Summary of Safety and Clinical Performance',
      context: {
        deviceName: args.deviceName,
        riskClass: args.riskClass,
        clinicalEvaluationReport: args.clinicalEvaluationReport,
        deviceSpecification: args.deviceSpecification
      },
      instructions: [
        '1. Review SSCP requirements per Article 32',
        '2. Include device identification',
        '3. Summarize intended purpose',
        '4. Summarize indications and contraindications',
        '5. Describe target population',
        '6. Summarize clinical benefits',
        '7. Summarize residual risks',
        '8. Include reference to IFU',
        '9. Write for patient comprehension',
        '10. Create SSCP document'
      ],
      outputFormat: 'JSON object with SSCP'
    },
    outputSchema: {
      type: 'object',
      required: ['sscp', 'patientInformation'],
      properties: {
        sscp: { type: 'object' },
        patientInformation: { type: 'object' },
        eudamedSubmission: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['eu-mdr', 'sscp', 'regulatory']
}));

export const technicalDocumentationTask = defineTask('technical-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Technical Documentation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Manager',
      task: 'Compile complete technical documentation file',
      context: {
        deviceName: args.deviceName,
        riskClass: args.riskClass,
        intendedPurpose: args.intendedPurpose,
        notifiedBody: args.notifiedBody,
        gsprMapping: args.gsprMapping,
        deviceSpecification: args.deviceSpecification,
        designManufacturing: args.designManufacturing,
        riskManagementFile: args.riskManagementFile,
        clinicalEvaluationReport: args.clinicalEvaluationReport,
        pmsPlan: args.pmsPlan,
        sscp: args.sscp
      },
      instructions: [
        '1. Compile per Annex II structure',
        '2. Include device description (II.1)',
        '3. Include information from manufacturer (II.2)',
        '4. Include design and manufacturing (II.3)',
        '5. Include GSPR checklist (II.4)',
        '6. Include benefit-risk analysis (II.5)',
        '7. Include PV and clinical evaluation (II.6)',
        '8. Prepare Declaration of Conformity',
        '9. Conduct completeness review',
        '10. Create TD file'
      ],
      outputFormat: 'JSON object with technical documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'dofC', 'completeness'],
      properties: {
        documentation: { type: 'object' },
        dofC: { type: 'object' },
        completeness: { type: 'object' },
        nbSubmissionReady: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['eu-mdr', 'technical-documentation', 'regulatory']
}));
