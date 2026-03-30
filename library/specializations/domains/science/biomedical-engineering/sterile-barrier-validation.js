/**
 * @process specializations/domains/science/biomedical-engineering/sterile-barrier-validation
 * @description Sterile Barrier System Validation per ISO 11607 - Validate sterile barrier packaging systems
 * ensuring package integrity and sterility maintenance through distribution and storage.
 * @inputs { deviceName: string, packagingSystem: object, sterilizationMethod: string, distributionConditions: object }
 * @outputs { success: boolean, validationProtocol: object, validationReport: object, shelfLifeData: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/sterile-barrier-validation', {
 *   deviceName: 'Sterile Surgical Drape Kit',
 *   packagingSystem: { type: 'Pouch', material: 'Tyvek/Film' },
 *   sterilizationMethod: 'EO',
 *   distributionConditions: { temperature: '-20 to 50C', humidity: '10-90% RH' }
 * });
 *
 * @references
 * - ISO 11607-1:2019 Packaging for terminally sterilized medical devices - Requirements
 * - ISO 11607-2:2019 Packaging - Validation requirements for forming, sealing and assembly processes
 * - ASTM F2095 Standard Test Methods for Seal Strength of Flexible Barrier Materials
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deviceName,
    packagingSystem,
    sterilizationMethod,
    distributionConditions
  } = inputs;

  // Phase 1: Packaging Material Selection
  const materialSelection = await ctx.task(materialSelectionTask, {
    deviceName,
    packagingSystem,
    sterilizationMethod
  });

  // Phase 2: Seal Strength Optimization
  const sealOptimization = await ctx.task(sealOptimizationTask, {
    deviceName,
    packagingSystem,
    materialSelection
  });

  // Phase 3: Package Integrity Testing
  const integrityTesting = await ctx.task(integrityTestingTask, {
    deviceName,
    packagingSystem,
    sealOptimization
  });

  // Phase 4: Accelerated Aging Studies
  const acceleratedAging = await ctx.task(acceleratedAgingTask, {
    deviceName,
    packagingSystem,
    distributionConditions
  });

  // Breakpoint: Review aging study design
  await ctx.breakpoint({
    question: `Review accelerated aging study design for ${deviceName}. Are aging conditions appropriate?`,
    title: 'Aging Study Review',
    context: {
      runId: ctx.runId,
      deviceName,
      agingConditions: acceleratedAging.conditions,
      files: [{
        path: `artifacts/phase4-accelerated-aging.json`,
        format: 'json',
        content: acceleratedAging
      }]
    }
  });

  // Phase 5: Distribution Simulation Testing
  const distributionSimulation = await ctx.task(distributionSimulationTask, {
    deviceName,
    packagingSystem,
    distributionConditions
  });

  // Phase 6: Stability Protocol Development
  const stabilityProtocol = await ctx.task(stabilityProtocolTask, {
    deviceName,
    acceleratedAging,
    distributionSimulation
  });

  // Phase 7: Packaging Validation Documentation
  const validationDocumentation = await ctx.task(validationDocumentationTask, {
    deviceName,
    packagingSystem,
    sterilizationMethod,
    materialSelection,
    sealOptimization,
    integrityTesting,
    acceleratedAging,
    distributionSimulation,
    stabilityProtocol
  });

  // Final Breakpoint: Validation Approval
  await ctx.breakpoint({
    question: `Sterile barrier validation complete for ${deviceName}. Shelf life: ${acceleratedAging.claimedShelfLife}. Approve validation?`,
    title: 'Packaging Validation Approval',
    context: {
      runId: ctx.runId,
      deviceName,
      shelfLife: acceleratedAging.claimedShelfLife,
      files: [
        { path: `artifacts/packaging-validation-report.json`, format: 'json', content: validationDocumentation }
      ]
    }
  });

  return {
    success: true,
    deviceName,
    validationProtocol: validationDocumentation.protocol,
    validationReport: validationDocumentation.report,
    shelfLifeData: {
      claimedShelfLife: acceleratedAging.claimedShelfLife,
      agingStudyResults: acceleratedAging.results,
      stabilityData: stabilityProtocol.data
    },
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/sterile-barrier-validation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const materialSelectionTask = defineTask('material-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Material Selection - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Packaging Engineer',
      task: 'Select and qualify packaging materials',
      context: {
        deviceName: args.deviceName,
        packagingSystem: args.packagingSystem,
        sterilizationMethod: args.sterilizationMethod
      },
      instructions: [
        '1. Define packaging material requirements',
        '2. Evaluate sterilization compatibility',
        '3. Assess microbial barrier properties',
        '4. Evaluate physical properties',
        '5. Assess biocompatibility if needed',
        '6. Review supplier specifications',
        '7. Conduct material qualification',
        '8. Document material specifications',
        '9. Establish incoming inspection',
        '10. Create material selection report'
      ],
      outputFormat: 'JSON object with material selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedMaterials', 'specifications', 'qualification'],
      properties: {
        selectedMaterials: { type: 'array', items: { type: 'object' } },
        specifications: { type: 'object' },
        qualification: { type: 'object' },
        incomingInspection: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['packaging', 'material-selection', 'iso-11607']
}));

export const sealOptimizationTask = defineTask('seal-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Seal Optimization - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Sealing Process Engineer',
      task: 'Optimize seal parameters',
      context: {
        deviceName: args.deviceName,
        packagingSystem: args.packagingSystem,
        materialSelection: args.materialSelection
      },
      instructions: [
        '1. Define seal quality requirements',
        '2. Identify sealing parameters',
        '3. Conduct DOE for optimization',
        '4. Establish seal strength targets',
        '5. Define process windows',
        '6. Validate sealing equipment',
        '7. Establish routine monitoring',
        '8. Document seal specifications',
        '9. Train operators',
        '10. Create seal optimization report'
      ],
      outputFormat: 'JSON object with seal optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['sealParameters', 'processWindow', 'strengthTargets'],
      properties: {
        sealParameters: { type: 'object' },
        processWindow: { type: 'object' },
        strengthTargets: { type: 'object' },
        doeResults: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['packaging', 'sealing', 'iso-11607']
}));

export const integrityTestingTask = defineTask('integrity-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Integrity Testing - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Package Testing Specialist',
      task: 'Conduct package integrity testing',
      context: {
        deviceName: args.deviceName,
        packagingSystem: args.packagingSystem,
        sealOptimization: args.sealOptimization
      },
      instructions: [
        '1. Select integrity test methods',
        '2. Conduct bubble leak testing',
        '3. Conduct dye penetration testing',
        '4. Conduct seal strength testing',
        '5. Conduct visual inspection',
        '6. Establish acceptance criteria',
        '7. Document test methods',
        '8. Validate test methods',
        '9. Plan routine testing',
        '10. Create integrity test report'
      ],
      outputFormat: 'JSON object with integrity testing'
    },
    outputSchema: {
      type: 'object',
      required: ['testMethods', 'results', 'acceptanceCriteria'],
      properties: {
        testMethods: { type: 'array', items: { type: 'object' } },
        results: { type: 'object' },
        acceptanceCriteria: { type: 'object' },
        routineTesting: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['packaging', 'integrity-testing', 'iso-11607']
}));

export const acceleratedAgingTask = defineTask('accelerated-aging', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Accelerated Aging - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Stability Study Specialist',
      task: 'Design and conduct accelerated aging studies',
      context: {
        deviceName: args.deviceName,
        packagingSystem: args.packagingSystem,
        distributionConditions: args.distributionConditions
      },
      instructions: [
        '1. Define claimed shelf life',
        '2. Select aging temperature (ASTM F1980)',
        '3. Calculate aging time',
        '4. Define test timepoints',
        '5. Establish sample sizes',
        '6. Conduct accelerated aging',
        '7. Test at timepoints',
        '8. Analyze aging data',
        '9. Correlate to real-time',
        '10. Create aging study report'
      ],
      outputFormat: 'JSON object with accelerated aging'
    },
    outputSchema: {
      type: 'object',
      required: ['conditions', 'results', 'claimedShelfLife'],
      properties: {
        conditions: { type: 'object' },
        results: { type: 'object' },
        claimedShelfLife: { type: 'string' },
        correlation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['packaging', 'accelerated-aging', 'stability']
}));

export const distributionSimulationTask = defineTask('distribution-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Distribution Simulation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Distribution Test Specialist',
      task: 'Conduct distribution simulation testing',
      context: {
        deviceName: args.deviceName,
        packagingSystem: args.packagingSystem,
        distributionConditions: args.distributionConditions
      },
      instructions: [
        '1. Define distribution profile',
        '2. Select test standard (ISTA, ASTM)',
        '3. Conduct vibration testing',
        '4. Conduct drop testing',
        '5. Conduct compression testing',
        '6. Test temperature extremes',
        '7. Test humidity extremes',
        '8. Evaluate package after simulation',
        '9. Document test results',
        '10. Create distribution test report'
      ],
      outputFormat: 'JSON object with distribution simulation'
    },
    outputSchema: {
      type: 'object',
      required: ['testProfile', 'results', 'postTestIntegrity'],
      properties: {
        testProfile: { type: 'object' },
        results: { type: 'object' },
        postTestIntegrity: { type: 'object' },
        standardUsed: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['packaging', 'distribution-simulation', 'iso-11607']
}));

export const stabilityProtocolTask = defineTask('stability-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Stability Protocol - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Stability Program Manager',
      task: 'Develop stability protocol',
      context: {
        deviceName: args.deviceName,
        acceleratedAging: args.acceleratedAging,
        distributionSimulation: args.distributionSimulation
      },
      instructions: [
        '1. Define stability program',
        '2. Plan real-time aging study',
        '3. Define storage conditions',
        '4. Establish test intervals',
        '5. Define sample quantities',
        '6. Specify test methods',
        '7. Define acceptance criteria',
        '8. Plan data analysis',
        '9. Establish reporting',
        '10. Create stability protocol'
      ],
      outputFormat: 'JSON object with stability protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'testPlan', 'data'],
      properties: {
        protocol: { type: 'object' },
        testPlan: { type: 'object' },
        data: { type: 'object' },
        reporting: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['packaging', 'stability', 'iso-11607']
}));

export const validationDocumentationTask = defineTask('validation-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Validation Documentation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Validation Documentation Manager',
      task: 'Compile packaging validation documentation',
      context: {
        deviceName: args.deviceName,
        packagingSystem: args.packagingSystem,
        sterilizationMethod: args.sterilizationMethod,
        materialSelection: args.materialSelection,
        sealOptimization: args.sealOptimization,
        integrityTesting: args.integrityTesting,
        acceleratedAging: args.acceleratedAging,
        distributionSimulation: args.distributionSimulation,
        stabilityProtocol: args.stabilityProtocol
      },
      instructions: [
        '1. Compile validation protocol',
        '2. Compile validation report',
        '3. Document material qualification',
        '4. Document seal validation',
        '5. Document integrity testing',
        '6. Document aging studies',
        '7. Document distribution testing',
        '8. Include stability data',
        '9. Obtain approvals',
        '10. Archive validation records'
      ],
      outputFormat: 'JSON object with validation documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'report', 'approvals'],
      properties: {
        protocol: { type: 'object' },
        report: { type: 'object' },
        approvals: { type: 'object' },
        archiveLocation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['packaging', 'validation', 'documentation']
}));
