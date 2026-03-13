/**
 * @process specializations/domains/science/biomedical-engineering/biological-evaluation-iso10993
 * @description Biological Evaluation Planning per ISO 10993-1 - Develop comprehensive biological evaluation
 * plans for medical devices determining required biocompatibility testing based on device categorization.
 * @inputs { deviceName: string, contactType: string, contactDuration: string, materials: string[] }
 * @outputs { success: boolean, biologicalEvaluationPlan: object, testingMatrix: object, riskAssessment: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/biological-evaluation-iso10993', {
 *   deviceName: 'Hip Implant System',
 *   contactType: 'Bone/Tissue',
 *   contactDuration: 'Permanent',
 *   materials: ['Titanium alloy', 'UHMWPE', 'Cobalt-Chrome']
 * });
 *
 * @references
 * - ISO 10993-1:2018 Biological evaluation of medical devices - Evaluation and testing within a risk management process
 * - FDA Guidance on Use of ISO 10993-1: https://www.fda.gov/regulatory-information/search-fda-guidance-documents/use-international-standard-iso-10993-1-biological-evaluation-medical-devices-part-1-evaluation-and
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deviceName,
    contactType,
    contactDuration,
    materials
  } = inputs;

  // Phase 1: Device Categorization
  const deviceCategorization = await ctx.task(deviceCategorizationTask, {
    deviceName,
    contactType,
    contactDuration
  });

  // Phase 2: Material Identification and Characterization
  const materialCharacterization = await ctx.task(materialCharacterizationTask, {
    deviceName,
    materials,
    deviceCategorization
  });

  // Phase 3: Existing Data and Equivalence Evaluation
  const equivalenceEvaluation = await ctx.task(equivalenceEvaluationTask, {
    deviceName,
    materials,
    materialCharacterization,
    deviceCategorization
  });

  // Breakpoint: Review equivalence assessment
  await ctx.breakpoint({
    question: `Review equivalence evaluation for ${deviceName}. Can testing be reduced based on existing data?`,
    title: 'Equivalence Evaluation Review',
    context: {
      runId: ctx.runId,
      deviceName,
      equivalenceAssessment: equivalenceEvaluation.assessment,
      files: [{
        path: `artifacts/phase3-equivalence-evaluation.json`,
        format: 'json',
        content: equivalenceEvaluation
      }]
    }
  });

  // Phase 4: Testing Endpoint Determination
  const testingEndpoints = await ctx.task(testingEndpointTask, {
    deviceName,
    deviceCategorization,
    materialCharacterization,
    equivalenceEvaluation
  });

  // Phase 5: Risk-Based Gap Analysis
  const gapAnalysis = await ctx.task(gapAnalysisTask, {
    deviceName,
    testingEndpoints,
    equivalenceEvaluation,
    deviceCategorization
  });

  // Phase 6: Test Laboratory Selection
  const labSelection = await ctx.task(labSelectionTask, {
    deviceName,
    testingEndpoints: testingEndpoints.endpoints,
    gapAnalysis
  });

  // Phase 7: Biological Evaluation Plan Documentation
  const biologicalEvaluationPlan = await ctx.task(bepDocumentationTask, {
    deviceName,
    deviceCategorization,
    materialCharacterization,
    equivalenceEvaluation,
    testingEndpoints,
    gapAnalysis,
    labSelection
  });

  // Final Breakpoint: BEP Approval
  await ctx.breakpoint({
    question: `Biological Evaluation Plan complete for ${deviceName}. Approve BEP and proceed to testing?`,
    title: 'BEP Approval',
    context: {
      runId: ctx.runId,
      deviceName,
      testingRequired: gapAnalysis.testsRequired,
      files: [
        { path: `artifacts/biological-evaluation-plan.json`, format: 'json', content: biologicalEvaluationPlan }
      ]
    }
  });

  return {
    success: true,
    deviceName,
    biologicalEvaluationPlan: biologicalEvaluationPlan.plan,
    testingMatrix: testingEndpoints.matrix,
    riskAssessment: gapAnalysis.riskAssessment,
    labRecommendations: labSelection.recommendations,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/biological-evaluation-iso10993',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const deviceCategorizationTask = defineTask('device-categorization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Device Categorization - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Biocompatibility Specialist with expertise in ISO 10993',
      task: 'Categorize medical device per ISO 10993-1',
      context: {
        deviceName: args.deviceName,
        contactType: args.contactType,
        contactDuration: args.contactDuration
      },
      instructions: [
        '1. Determine body contact nature (surface, external communicating, implant)',
        '2. Determine contact duration category (limited, prolonged, permanent)',
        '3. Identify all tissues/fluids contacted',
        '4. Classify device per ISO 10993-1 Annex A',
        '5. Document categorization rationale',
        '6. Identify special considerations',
        '7. Determine applicable biological endpoints',
        '8. Document regulatory pathway considerations',
        '9. Assess combined device considerations',
        '10. Create categorization summary'
      ],
      outputFormat: 'JSON object with device categorization'
    },
    outputSchema: {
      type: 'object',
      required: ['category', 'contactNature', 'contactDuration', 'endpoints'],
      properties: {
        category: { type: 'string' },
        contactNature: { type: 'string' },
        contactDuration: { type: 'string' },
        tissuesContacted: { type: 'array', items: { type: 'string' } },
        endpoints: { type: 'array', items: { type: 'string' } },
        rationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biocompatibility', 'iso-10993', 'categorization', 'medical-device']
}));

export const materialCharacterizationTask = defineTask('material-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Material Characterization - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Scientist with expertise in medical device materials',
      task: 'Characterize all device materials',
      context: {
        deviceName: args.deviceName,
        materials: args.materials,
        deviceCategorization: args.deviceCategorization
      },
      instructions: [
        '1. Identify all materials in patient contact',
        '2. Document material specifications and grades',
        '3. Identify processing aids and additives',
        '4. Document manufacturing processes affecting materials',
        '5. Characterize surface properties',
        '6. Document sterilization compatibility',
        '7. Identify material history and biocompatibility data',
        '8. Assess material variability',
        '9. Document supplier information',
        '10. Create material characterization report'
      ],
      outputFormat: 'JSON object with material characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['materials', 'characterization'],
      properties: {
        materials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              materialName: { type: 'string' },
              specification: { type: 'string' },
              contactType: { type: 'string' },
              additives: { type: 'array', items: { type: 'string' } },
              surfaceProperties: { type: 'object' }
            }
          }
        },
        characterization: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biocompatibility', 'iso-10993', 'materials', 'medical-device']
}));

export const equivalenceEvaluationTask = defineTask('equivalence-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Equivalence Evaluation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Regulatory Biocompatibility Specialist',
      task: 'Evaluate existing data and material equivalence',
      context: {
        deviceName: args.deviceName,
        materials: args.materials,
        materialCharacterization: args.materialCharacterization,
        deviceCategorization: args.deviceCategorization
      },
      instructions: [
        '1. Review existing biocompatibility data',
        '2. Evaluate material equivalence to tested materials',
        '3. Assess clinical history of materials',
        '4. Review literature data',
        '5. Evaluate predicate device comparisons',
        '6. Document data gaps',
        '7. Assess quality of existing data',
        '8. Determine testing reductions possible',
        '9. Document equivalence rationale',
        '10. Create equivalence assessment report'
      ],
      outputFormat: 'JSON object with equivalence evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'existingData', 'testingReductions'],
      properties: {
        assessment: { type: 'object' },
        existingData: { type: 'array', items: { type: 'object' } },
        testingReductions: { type: 'array', items: { type: 'string' } },
        dataGaps: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biocompatibility', 'iso-10993', 'equivalence', 'medical-device']
}));

export const testingEndpointTask = defineTask('testing-endpoint-determination', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Testing Endpoint Determination - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Biocompatibility Testing Specialist',
      task: 'Determine required biological testing endpoints',
      context: {
        deviceName: args.deviceName,
        deviceCategorization: args.deviceCategorization,
        materialCharacterization: args.materialCharacterization,
        equivalenceEvaluation: args.equivalenceEvaluation
      },
      instructions: [
        '1. Apply ISO 10993-1 endpoint matrix',
        '2. Determine cytotoxicity testing needs',
        '3. Determine sensitization testing needs',
        '4. Determine irritation testing needs',
        '5. Determine systemic toxicity needs',
        '6. Determine genotoxicity testing needs',
        '7. Determine implantation testing needs',
        '8. Determine hemocompatibility needs',
        '9. Apply risk-based endpoint modifications',
        '10. Create testing matrix'
      ],
      outputFormat: 'JSON object with testing endpoints'
    },
    outputSchema: {
      type: 'object',
      required: ['endpoints', 'matrix'],
      properties: {
        endpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              testStandard: { type: 'string' },
              required: { type: 'boolean' },
              rationale: { type: 'string' }
            }
          }
        },
        matrix: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biocompatibility', 'iso-10993', 'testing', 'medical-device']
}));

export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Risk-Based Gap Analysis - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Biocompatibility Risk Analyst',
      task: 'Conduct risk-based gap analysis for biological evaluation',
      context: {
        deviceName: args.deviceName,
        testingEndpoints: args.testingEndpoints,
        equivalenceEvaluation: args.equivalenceEvaluation,
        deviceCategorization: args.deviceCategorization
      },
      instructions: [
        '1. Compare required vs existing data',
        '2. Identify testing gaps',
        '3. Assess biological risks',
        '4. Apply risk-based evaluation',
        '5. Prioritize testing needs',
        '6. Document gap closure strategy',
        '7. Assess alternative evaluation methods',
        '8. Create risk assessment',
        '9. Document testing timeline',
        '10. Create gap analysis report'
      ],
      outputFormat: 'JSON object with gap analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['testsRequired', 'riskAssessment', 'gapClosureStrategy'],
      properties: {
        testsRequired: { type: 'array', items: { type: 'object' } },
        riskAssessment: { type: 'object' },
        gapClosureStrategy: { type: 'object' },
        timeline: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biocompatibility', 'iso-10993', 'gap-analysis', 'medical-device']
}));

export const labSelectionTask = defineTask('lab-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Laboratory Selection - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Assurance Specialist with expertise in GLP laboratories',
      task: 'Select appropriate testing laboratories',
      context: {
        deviceName: args.deviceName,
        testingEndpoints: args.testingEndpoints,
        gapAnalysis: args.gapAnalysis
      },
      instructions: [
        '1. Identify GLP-compliant laboratories',
        '2. Assess laboratory capabilities',
        '3. Review laboratory accreditations',
        '4. Evaluate laboratory quality systems',
        '5. Compare laboratory costs and timelines',
        '6. Review protocol development capabilities',
        '7. Assess communication and reporting',
        '8. Create laboratory selection criteria',
        '9. Document laboratory recommendations',
        '10. Plan laboratory qualification'
      ],
      outputFormat: 'JSON object with laboratory recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'selectionCriteria'],
      properties: {
        recommendations: { type: 'array', items: { type: 'object' } },
        selectionCriteria: { type: 'array', items: { type: 'string' } },
        qualificationPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biocompatibility', 'iso-10993', 'laboratory', 'medical-device']
}));

export const bepDocumentationTask = defineTask('bep-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: BEP Documentation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Regulatory Documentation Specialist',
      task: 'Document comprehensive Biological Evaluation Plan',
      context: {
        deviceName: args.deviceName,
        deviceCategorization: args.deviceCategorization,
        materialCharacterization: args.materialCharacterization,
        equivalenceEvaluation: args.equivalenceEvaluation,
        testingEndpoints: args.testingEndpoints,
        gapAnalysis: args.gapAnalysis,
        labSelection: args.labSelection
      },
      instructions: [
        '1. Compile BEP document',
        '2. Document device description and categorization',
        '3. Document material characterization',
        '4. Document existing data evaluation',
        '5. Document testing rationale',
        '6. Create testing matrix',
        '7. Document risk assessment',
        '8. Include laboratory information',
        '9. Create timeline and budget',
        '10. Prepare for regulatory review'
      ],
      outputFormat: 'JSON object with Biological Evaluation Plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'testingMatrix', 'timeline'],
      properties: {
        plan: { type: 'object' },
        testingMatrix: { type: 'object' },
        timeline: { type: 'object' },
        budget: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biocompatibility', 'iso-10993', 'documentation', 'medical-device']
}));
