/**
 * @process specializations/domains/science/biomedical-engineering/extractables-leachables
 * @description Extractables and Leachables Analysis - Characterize extractable and leachable substances
 * from medical device materials and assess toxicological risk to patients per ISO 10993-12 and ISO 10993-18.
 * @inputs { deviceName: string, materials: string[], contactType: string, extractionConditions?: object }
 * @outputs { success: boolean, elStudyProtocol: object, analyticalReports: object, toxRiskAssessment: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/extractables-leachables', {
 *   deviceName: 'Drug-Eluting Stent',
 *   materials: ['316L Stainless Steel', 'PLGA coating', 'Drug formulation'],
 *   contactType: 'Circulating blood - Permanent',
 *   extractionConditions: { solvents: ['Water', 'Ethanol', 'Hexane'] }
 * });
 *
 * @references
 * - ISO 10993-12:2021 Sample preparation and reference materials
 * - ISO 10993-18:2020 Chemical characterization of medical device materials
 * - FDA Guidance on E&L Studies
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deviceName,
    materials,
    contactType,
    extractionConditions = {}
  } = inputs;

  // Phase 1: Extraction Study Design
  const extractionDesign = await ctx.task(extractionStudyDesignTask, {
    deviceName,
    materials,
    contactType
  });

  // Phase 2: Extraction Condition Selection
  const extractionConditionSelection = await ctx.task(extractionConditionTask, {
    deviceName,
    materials,
    extractionDesign,
    providedConditions: extractionConditions
  });

  // Phase 3: Analytical Method Development
  const analyticalMethods = await ctx.task(analyticalMethodTask, {
    deviceName,
    materials,
    extractionConditionSelection
  });

  // Breakpoint: Review analytical methods
  await ctx.breakpoint({
    question: `Review analytical methods for ${deviceName} E&L study. Are methods appropriate for expected extractables?`,
    title: 'Analytical Method Review',
    context: {
      runId: ctx.runId,
      deviceName,
      methods: analyticalMethods.methods,
      files: [{
        path: `artifacts/phase3-analytical-methods.json`,
        format: 'json',
        content: analyticalMethods
      }]
    }
  });

  // Phase 4: Extractables Profiling
  const extractablesProfiling = await ctx.task(extractablesProfilingTask, {
    deviceName,
    extractionConditionSelection,
    analyticalMethods
  });

  // Phase 5: Leachables Study Design
  const leachablesStudy = await ctx.task(leachablesStudyTask, {
    deviceName,
    contactType,
    extractablesProfiling
  });

  // Phase 6: Analytical Evaluation Threshold Application
  const aetApplication = await ctx.task(aetApplicationTask, {
    deviceName,
    extractablesProfiling,
    leachablesStudy,
    contactType
  });

  // Phase 7: Toxicological Risk Assessment
  const toxRiskAssessment = await ctx.task(toxRiskAssessmentTask, {
    deviceName,
    extractablesProfiling,
    leachablesStudy,
    aetApplication,
    contactType
  });

  // Final Breakpoint: E&L Study Approval
  await ctx.breakpoint({
    question: `E&L analysis complete for ${deviceName}. Toxicological risk: ${toxRiskAssessment.overallRisk}. Approve study conclusions?`,
    title: 'E&L Study Approval',
    context: {
      runId: ctx.runId,
      deviceName,
      extractablesCount: extractablesProfiling.identifiedExtractables.length,
      overallRisk: toxRiskAssessment.overallRisk,
      files: [
        { path: `artifacts/el-study-report.json`, format: 'json', content: toxRiskAssessment }
      ]
    }
  });

  return {
    success: true,
    deviceName,
    elStudyProtocol: {
      extractionDesign: extractionDesign.design,
      extractionConditions: extractionConditionSelection.conditions,
      analyticalMethods: analyticalMethods.methods
    },
    analyticalReports: {
      extractables: extractablesProfiling.identifiedExtractables,
      leachables: leachablesStudy.results,
      aetAnalysis: aetApplication.analysis
    },
    toxRiskAssessment: toxRiskAssessment.assessment,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/extractables-leachables',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const extractionStudyDesignTask = defineTask('extraction-study-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Extraction Study Design - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'E&L Study Director with expertise in ISO 10993-12',
      task: 'Design comprehensive extraction study',
      context: {
        deviceName: args.deviceName,
        materials: args.materials,
        contactType: args.contactType
      },
      instructions: [
        '1. Define extraction study objectives',
        '2. Determine sample preparation requirements',
        '3. Calculate surface area and volume ratios',
        '4. Define extraction conditions per ISO 10993-12',
        '5. Identify control samples required',
        '6. Establish exhaustive extraction criteria',
        '7. Define analytical detection limits',
        '8. Plan extraction timepoints',
        '9. Document study design rationale',
        '10. Create extraction study protocol'
      ],
      outputFormat: 'JSON object with extraction study design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'samplePreparation', 'studyRationale'],
      properties: {
        design: { type: 'object' },
        samplePreparation: { type: 'object' },
        surfaceAreaCalculations: { type: 'object' },
        studyRationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['extractables-leachables', 'iso-10993', 'study-design', 'medical-device']
}));

export const extractionConditionTask = defineTask('extraction-condition-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Extraction Condition Selection - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Extraction Chemist with expertise in medical device E&L',
      task: 'Select appropriate extraction conditions',
      context: {
        deviceName: args.deviceName,
        materials: args.materials,
        extractionDesign: args.extractionDesign,
        providedConditions: args.providedConditions
      },
      instructions: [
        '1. Select extraction solvents based on material polarity',
        '2. Define extraction temperatures',
        '3. Determine extraction times',
        '4. Specify extraction techniques (sonication, reflux, agitation)',
        '5. Define exaggerated extraction conditions',
        '6. Document solvent selection rationale',
        '7. Plan sequential extractions if needed',
        '8. Define extract handling procedures',
        '9. Establish extraction efficiency criteria',
        '10. Create extraction conditions specification'
      ],
      outputFormat: 'JSON object with extraction conditions'
    },
    outputSchema: {
      type: 'object',
      required: ['conditions', 'solvents', 'rationale'],
      properties: {
        conditions: { type: 'array', items: { type: 'object' } },
        solvents: { type: 'array', items: { type: 'string' } },
        temperatures: { type: 'array', items: { type: 'string' } },
        rationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['extractables-leachables', 'iso-10993', 'extraction', 'medical-device']
}));

export const analyticalMethodTask = defineTask('analytical-method-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Analytical Method Development - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Analytical Chemist with expertise in E&L characterization',
      task: 'Develop and validate analytical methods',
      context: {
        deviceName: args.deviceName,
        materials: args.materials,
        extractionConditionSelection: args.extractionConditionSelection
      },
      instructions: [
        '1. Select analytical techniques (GC-MS, LC-MS, ICP-MS, etc.)',
        '2. Develop method parameters',
        '3. Define detection and quantitation limits',
        '4. Establish method validation requirements',
        '5. Define identification criteria',
        '6. Plan semi-quantitative screening',
        '7. Develop targeted quantitative methods',
        '8. Document method validation protocols',
        '9. Define quality control requirements',
        '10. Create analytical method specifications'
      ],
      outputFormat: 'JSON object with analytical methods'
    },
    outputSchema: {
      type: 'object',
      required: ['methods', 'validationRequirements', 'detectionLimits'],
      properties: {
        methods: { type: 'array', items: { type: 'object' } },
        validationRequirements: { type: 'array', items: { type: 'object' } },
        detectionLimits: { type: 'object' },
        qcRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['extractables-leachables', 'iso-10993', 'analytical', 'medical-device']
}));

export const extractablesProfilingTask = defineTask('extractables-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Extractables Profiling - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'E&L Characterization Scientist',
      task: 'Conduct extractables profiling and identification',
      context: {
        deviceName: args.deviceName,
        extractionConditionSelection: args.extractionConditionSelection,
        analyticalMethods: args.analyticalMethods
      },
      instructions: [
        '1. Conduct exhaustive extractions',
        '2. Perform analytical screening',
        '3. Identify extractable compounds',
        '4. Quantify extractables levels',
        '5. Compare to control samples',
        '6. Identify compound sources',
        '7. Assess extraction efficiency',
        '8. Document unknown compounds',
        '9. Create extractables database',
        '10. Prepare extractables profile report'
      ],
      outputFormat: 'JSON object with extractables profiling results'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedExtractables', 'quantificationResults', 'unknowns'],
      properties: {
        identifiedExtractables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              compound: { type: 'string' },
              casNumber: { type: 'string' },
              concentration: { type: 'string' },
              source: { type: 'string' }
            }
          }
        },
        quantificationResults: { type: 'object' },
        unknowns: { type: 'array', items: { type: 'object' } },
        controlComparison: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['extractables-leachables', 'iso-10993', 'profiling', 'medical-device']
}));

export const leachablesStudyTask = defineTask('leachables-study', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Leachables Study - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Leachables Study Scientist',
      task: 'Design and conduct leachables study under clinical conditions',
      context: {
        deviceName: args.deviceName,
        contactType: args.contactType,
        extractablesProfiling: args.extractablesProfiling
      },
      instructions: [
        '1. Define simulated use conditions',
        '2. Select appropriate simulated body fluids',
        '3. Determine study duration based on device use',
        '4. Conduct leachables studies',
        '5. Analyze for extractables of concern',
        '6. Correlate extractables to leachables',
        '7. Assess time-dependent leaching',
        '8. Compare to clinical use scenario',
        '9. Document study conditions',
        '10. Prepare leachables study report'
      ],
      outputFormat: 'JSON object with leachables study results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'studyConditions', 'correlation'],
      properties: {
        results: { type: 'array', items: { type: 'object' } },
        studyConditions: { type: 'object' },
        correlation: { type: 'object' },
        timeProfile: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['extractables-leachables', 'iso-10993', 'leachables', 'medical-device']
}));

export const aetApplicationTask = defineTask('aet-application', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: AET Application - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Toxicology Specialist with expertise in AET',
      task: 'Apply Analytical Evaluation Threshold methodology',
      context: {
        deviceName: args.deviceName,
        extractablesProfiling: args.extractablesProfiling,
        leachablesStudy: args.leachablesStudy,
        contactType: args.contactType
      },
      instructions: [
        '1. Calculate patient dose from device',
        '2. Determine appropriate safety factor',
        '3. Calculate AET based on TTC approach',
        '4. Apply AET to extractables data',
        '5. Identify compounds above AET',
        '6. Apply compound-specific thresholds',
        '7. Document AET calculation methodology',
        '8. Identify compounds requiring tox assessment',
        '9. Create AET summary report',
        '10. Document reporting thresholds'
      ],
      outputFormat: 'JSON object with AET analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'aetCalculations', 'compoundsAboveAET'],
      properties: {
        analysis: { type: 'object' },
        aetCalculations: { type: 'object' },
        compoundsAboveAET: { type: 'array', items: { type: 'object' } },
        reportingThresholds: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['extractables-leachables', 'iso-10993', 'aet', 'medical-device']
}));

export const toxRiskAssessmentTask = defineTask('tox-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Toxicological Risk Assessment - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Toxicologist with expertise in medical device safety assessment',
      task: 'Conduct toxicological risk assessment for E&L',
      context: {
        deviceName: args.deviceName,
        extractablesProfiling: args.extractablesProfiling,
        leachablesStudy: args.leachablesStudy,
        aetApplication: args.aetApplication,
        contactType: args.contactType
      },
      instructions: [
        '1. Review toxicological data for identified compounds',
        '2. Calculate margin of safety for each compound',
        '3. Assess carcinogenicity/mutagenicity data',
        '4. Evaluate reproductive toxicity concerns',
        '5. Assess sensitization potential',
        '6. Calculate cumulative exposure',
        '7. Evaluate unknown compounds',
        '8. Determine overall risk acceptability',
        '9. Document risk mitigation recommendations',
        '10. Create toxicological risk assessment report'
      ],
      outputFormat: 'JSON object with toxicological risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'overallRisk', 'recommendations'],
      properties: {
        assessment: {
          type: 'object',
          properties: {
            compoundAssessments: { type: 'array', items: { type: 'object' } },
            marginOfSafety: { type: 'object' },
            cumulativeExposure: { type: 'object' }
          }
        },
        overallRisk: { type: 'string', enum: ['acceptable', 'acceptable-with-conditions', 'unacceptable'] },
        recommendations: { type: 'array', items: { type: 'string' } },
        unknownCompoundRisk: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['extractables-leachables', 'iso-10993', 'toxicology', 'medical-device']
}));
