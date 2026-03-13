/**
 * @process specializations/domains/science/biomedical-engineering/biomaterial-selection
 * @description Biomaterial Selection and Characterization - Select and characterize biomaterials for medical
 * device applications ensuring appropriate mechanical, chemical, and biological properties.
 * @inputs { deviceName: string, applicationRequirements: object, environmentalConditions: object }
 * @outputs { success: boolean, materialSelectionReport: object, materialSpecifications: object, supplierQualification: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/biomaterial-selection', {
 *   deviceName: 'Vascular Graft',
 *   applicationRequirements: { flexibility: 'high', biocompatibility: 'blood-contact', durability: '10-years' },
 *   environmentalConditions: { bodyFluid: 'blood', temperature: '37C', mechanicalLoad: 'pulsatile' }
 * });
 *
 * @references
 * - Biomaterials Science: An Introduction to Materials in Medicine (Ratner et al.)
 * - ISO 10993 Series - Biological Evaluation of Medical Devices
 * - ASTM Standards for Medical Device Materials
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deviceName,
    applicationRequirements,
    environmentalConditions
  } = inputs;

  // Phase 1: Material Requirements Specification
  const materialRequirements = await ctx.task(materialRequirementsTask, {
    deviceName,
    applicationRequirements,
    environmentalConditions
  });

  // Phase 2: Candidate Material Identification
  const candidateMaterials = await ctx.task(candidateMaterialTask, {
    deviceName,
    materialRequirements
  });

  // Phase 3: Mechanical Property Characterization
  const mechanicalCharacterization = await ctx.task(mechanicalCharacterizationTask, {
    deviceName,
    candidateMaterials: candidateMaterials.materials,
    applicationRequirements
  });

  // Phase 4: Chemical and Surface Characterization
  const chemicalCharacterization = await ctx.task(chemicalCharacterizationTask, {
    deviceName,
    candidateMaterials: candidateMaterials.materials,
    environmentalConditions
  });

  // Breakpoint: Review material characterization
  await ctx.breakpoint({
    question: `Review material characterization for ${deviceName}. Are candidate materials suitable?`,
    title: 'Material Characterization Review',
    context: {
      runId: ctx.runId,
      deviceName,
      candidateCount: candidateMaterials.materials.length,
      files: [{
        path: `artifacts/material-characterization.json`,
        format: 'json',
        content: { mechanical: mechanicalCharacterization, chemical: chemicalCharacterization }
      }]
    }
  });

  // Phase 5: Degradation and Stability Assessment
  const stabilityAssessment = await ctx.task(stabilityAssessmentTask, {
    deviceName,
    candidateMaterials: candidateMaterials.materials,
    environmentalConditions
  });

  // Phase 6: Biocompatibility Screening
  const biocompatibilityScreening = await ctx.task(biocompatibilityScreeningTask, {
    deviceName,
    candidateMaterials: candidateMaterials.materials,
    applicationRequirements
  });

  // Phase 7: Supplier Qualification
  const supplierQualification = await ctx.task(supplierQualificationTask, {
    deviceName,
    selectedMaterial: biocompatibilityScreening.recommendedMaterial,
    materialRequirements
  });

  // Phase 8: Material Selection Report
  const selectionReport = await ctx.task(selectionReportTask, {
    deviceName,
    materialRequirements,
    candidateMaterials,
    mechanicalCharacterization,
    chemicalCharacterization,
    stabilityAssessment,
    biocompatibilityScreening,
    supplierQualification
  });

  // Final Breakpoint: Material Selection Approval
  await ctx.breakpoint({
    question: `Material selection complete for ${deviceName}. Recommended: ${biocompatibilityScreening.recommendedMaterial}. Approve selection?`,
    title: 'Material Selection Approval',
    context: {
      runId: ctx.runId,
      deviceName,
      recommendedMaterial: biocompatibilityScreening.recommendedMaterial,
      files: [
        { path: `artifacts/material-selection-report.json`, format: 'json', content: selectionReport }
      ]
    }
  });

  return {
    success: true,
    deviceName,
    materialSelectionReport: selectionReport.report,
    materialSpecifications: selectionReport.specifications,
    supplierQualification: supplierQualification.qualificationPlan,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/biomaterial-selection',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const materialRequirementsTask = defineTask('material-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Material Requirements - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Biomaterials Engineer with expertise in medical device materials',
      task: 'Define comprehensive material requirements',
      context: {
        deviceName: args.deviceName,
        applicationRequirements: args.applicationRequirements,
        environmentalConditions: args.environmentalConditions
      },
      instructions: [
        '1. Define mechanical property requirements',
        '2. Define chemical property requirements',
        '3. Define biocompatibility requirements',
        '4. Define processing requirements',
        '5. Define sterilization compatibility',
        '6. Define shelf life requirements',
        '7. Define regulatory requirements',
        '8. Define cost constraints',
        '9. Prioritize requirements',
        '10. Create material requirements specification'
      ],
      outputFormat: 'JSON object with material requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'priorities'],
      properties: {
        requirements: {
          type: 'object',
          properties: {
            mechanical: { type: 'array', items: { type: 'object' } },
            chemical: { type: 'array', items: { type: 'object' } },
            biological: { type: 'array', items: { type: 'object' } },
            processing: { type: 'array', items: { type: 'string' } }
          }
        },
        priorities: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biomaterials', 'requirements', 'medical-device']
}));

export const candidateMaterialTask = defineTask('candidate-material-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Candidate Material Identification - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Scientist with expertise in biomaterials',
      task: 'Identify candidate materials meeting requirements',
      context: {
        deviceName: args.deviceName,
        materialRequirements: args.materialRequirements
      },
      instructions: [
        '1. Survey available biomaterials',
        '2. Screen against requirements',
        '3. Identify material candidates',
        '4. Document material history and applications',
        '5. Assess regulatory precedent',
        '6. Evaluate material availability',
        '7. Consider material grades and forms',
        '8. Identify potential suppliers',
        '9. Rank candidates',
        '10. Create candidate material list'
      ],
      outputFormat: 'JSON object with candidate materials'
    },
    outputSchema: {
      type: 'object',
      required: ['materials', 'ranking'],
      properties: {
        materials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              materialName: { type: 'string' },
              materialClass: { type: 'string' },
              grade: { type: 'string' },
              supplier: { type: 'string' },
              regulatoryHistory: { type: 'string' }
            }
          }
        },
        ranking: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biomaterials', 'selection', 'medical-device']
}));

export const mechanicalCharacterizationTask = defineTask('mechanical-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Mechanical Characterization - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Testing Engineer',
      task: 'Characterize mechanical properties of candidate materials',
      context: {
        deviceName: args.deviceName,
        candidateMaterials: args.candidateMaterials,
        applicationRequirements: args.applicationRequirements
      },
      instructions: [
        '1. Define mechanical test methods',
        '2. Characterize tensile properties',
        '3. Characterize compressive properties',
        '4. Assess fatigue behavior',
        '5. Evaluate wear characteristics',
        '6. Test fracture toughness',
        '7. Assess viscoelastic behavior',
        '8. Test under simulated conditions',
        '9. Compare to requirements',
        '10. Create characterization report'
      ],
      outputFormat: 'JSON object with mechanical characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['characterization', 'testResults'],
      properties: {
        characterization: { type: 'array', items: { type: 'object' } },
        testResults: { type: 'object' },
        complianceStatus: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biomaterials', 'mechanical-testing', 'medical-device']
}));

export const chemicalCharacterizationTask = defineTask('chemical-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Chemical Characterization - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Analytical Chemist with expertise in biomaterials',
      task: 'Characterize chemical and surface properties',
      context: {
        deviceName: args.deviceName,
        candidateMaterials: args.candidateMaterials,
        environmentalConditions: args.environmentalConditions
      },
      instructions: [
        '1. Define chemical characterization methods',
        '2. Analyze chemical composition',
        '3. Characterize surface chemistry',
        '4. Assess surface energy and wettability',
        '5. Analyze surface morphology',
        '6. Evaluate corrosion resistance',
        '7. Assess chemical stability',
        '8. Test sterilization compatibility',
        '9. Compare to requirements',
        '10. Create characterization report'
      ],
      outputFormat: 'JSON object with chemical characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['characterization', 'surfaceAnalysis'],
      properties: {
        characterization: { type: 'array', items: { type: 'object' } },
        surfaceAnalysis: { type: 'object' },
        stabilityData: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biomaterials', 'chemical-analysis', 'medical-device']
}));

export const stabilityAssessmentTask = defineTask('stability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Stability Assessment - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Material Degradation Specialist',
      task: 'Assess material degradation and stability',
      context: {
        deviceName: args.deviceName,
        candidateMaterials: args.candidateMaterials,
        environmentalConditions: args.environmentalConditions
      },
      instructions: [
        '1. Define degradation study design',
        '2. Assess hydrolytic degradation',
        '3. Assess oxidative degradation',
        '4. Evaluate enzymatic degradation',
        '5. Conduct accelerated aging studies',
        '6. Assess degradation products',
        '7. Evaluate shelf life stability',
        '8. Model long-term behavior',
        '9. Compare to requirements',
        '10. Create stability assessment report'
      ],
      outputFormat: 'JSON object with stability assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'degradationData', 'shelfLifeEstimate'],
      properties: {
        assessment: { type: 'array', items: { type: 'object' } },
        degradationData: { type: 'object' },
        shelfLifeEstimate: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biomaterials', 'stability', 'medical-device']
}));

export const biocompatibilityScreeningTask = defineTask('biocompatibility-screening', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Biocompatibility Screening - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Biocompatibility Scientist',
      task: 'Screen candidate materials for biocompatibility',
      context: {
        deviceName: args.deviceName,
        candidateMaterials: args.candidateMaterials,
        applicationRequirements: args.applicationRequirements
      },
      instructions: [
        '1. Review existing biocompatibility data',
        '2. Plan screening studies',
        '3. Conduct cytotoxicity screening',
        '4. Assess cell compatibility',
        '5. Evaluate protein adsorption',
        '6. Screen for sensitization potential',
        '7. Rank materials by biocompatibility',
        '8. Identify testing gaps',
        '9. Recommend optimal material',
        '10. Create biocompatibility screening report'
      ],
      outputFormat: 'JSON object with biocompatibility screening'
    },
    outputSchema: {
      type: 'object',
      required: ['screeningResults', 'recommendedMaterial', 'testingGaps'],
      properties: {
        screeningResults: { type: 'array', items: { type: 'object' } },
        recommendedMaterial: { type: 'string' },
        testingGaps: { type: 'array', items: { type: 'string' } },
        ranking: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biomaterials', 'biocompatibility', 'medical-device']
}));

export const supplierQualificationTask = defineTask('supplier-qualification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Supplier Qualification - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Supplier Quality Engineer',
      task: 'Qualify suppliers for selected material',
      context: {
        deviceName: args.deviceName,
        selectedMaterial: args.selectedMaterial,
        materialRequirements: args.materialRequirements
      },
      instructions: [
        '1. Identify potential suppliers',
        '2. Define supplier qualification criteria',
        '3. Assess supplier quality systems',
        '4. Evaluate supplier capabilities',
        '5. Review supplier certificates',
        '6. Plan supplier audits',
        '7. Define incoming inspection requirements',
        '8. Establish supplier agreements',
        '9. Create qualification plan',
        '10. Document supplier selection'
      ],
      outputFormat: 'JSON object with supplier qualification'
    },
    outputSchema: {
      type: 'object',
      required: ['qualificationPlan', 'suppliers', 'criteria'],
      properties: {
        qualificationPlan: { type: 'object' },
        suppliers: { type: 'array', items: { type: 'object' } },
        criteria: { type: 'array', items: { type: 'string' } },
        inspectionRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biomaterials', 'supplier', 'medical-device']
}));

export const selectionReportTask = defineTask('selection-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Selection Report - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Program Manager',
      task: 'Compile comprehensive material selection report',
      context: {
        deviceName: args.deviceName,
        materialRequirements: args.materialRequirements,
        candidateMaterials: args.candidateMaterials,
        mechanicalCharacterization: args.mechanicalCharacterization,
        chemicalCharacterization: args.chemicalCharacterization,
        stabilityAssessment: args.stabilityAssessment,
        biocompatibilityScreening: args.biocompatibilityScreening,
        supplierQualification: args.supplierQualification
      },
      instructions: [
        '1. Compile selection summary',
        '2. Document selection rationale',
        '3. Create material specifications',
        '4. Document characterization data',
        '5. Include supplier information',
        '6. Create testing recommendations',
        '7. Document regulatory considerations',
        '8. Create action items',
        '9. Prepare executive summary',
        '10. Create final report'
      ],
      outputFormat: 'JSON object with selection report'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'specifications', 'recommendations'],
      properties: {
        report: { type: 'object' },
        specifications: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biomaterials', 'documentation', 'medical-device']
}));
