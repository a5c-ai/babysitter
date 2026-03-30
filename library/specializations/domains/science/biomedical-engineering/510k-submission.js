/**
 * @process specializations/domains/science/biomedical-engineering/510k-submission
 * @description 510(k) Premarket Submission Preparation - Prepare comprehensive 510(k) premarket notification
 * submissions demonstrating substantial equivalence to predicate devices for FDA clearance.
 * @inputs { deviceName: string, deviceClass: string, productCode: string, predicateDevices: object[] }
 * @outputs { success: boolean, submissionPackage: object, seArgument: object, complianceMatrix: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/510k-submission', {
 *   deviceName: 'Digital Blood Pressure Monitor',
 *   deviceClass: 'Class II',
 *   productCode: 'DXN',
 *   predicateDevices: [{ name: 'Existing BP Monitor', k_number: 'K123456' }]
 * });
 *
 * @references
 * - FDA 21 CFR 807.87 510(k) Content Requirements
 * - FDA Guidance on Format for Traditional and Abbreviated 510(k)s
 * - FDA eCopy Program: https://www.fda.gov/medical-devices/premarket-submissions/ecopy-program
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deviceName,
    deviceClass,
    productCode,
    predicateDevices
  } = inputs;

  // Phase 1: Predicate Device Selection
  const predicateSelection = await ctx.task(predicateSelectionTask, {
    deviceName,
    deviceClass,
    productCode,
    predicateDevices
  });

  // Phase 2: Device Description and Intended Use
  const deviceDescription = await ctx.task(deviceDescriptionTask, {
    deviceName,
    deviceClass,
    predicateSelection
  });

  // Phase 3: Substantial Equivalence Comparison
  const seComparison = await ctx.task(seComparisonTask, {
    deviceName,
    deviceDescription,
    predicateSelection
  });

  // Breakpoint: Review SE comparison
  await ctx.breakpoint({
    question: `Review substantial equivalence comparison for ${deviceName}. Is the SE argument sound?`,
    title: 'SE Comparison Review',
    context: {
      runId: ctx.runId,
      deviceName,
      seArgument: seComparison.argument,
      files: [{
        path: `artifacts/phase3-se-comparison.json`,
        format: 'json',
        content: seComparison
      }]
    }
  });

  // Phase 4: Performance Testing Specification
  const performanceTesting = await ctx.task(performanceTestingTask, {
    deviceName,
    deviceDescription,
    seComparison,
    predicateSelection
  });

  // Phase 5: Standards Compliance Documentation
  const standardsCompliance = await ctx.task(standardsComplianceTask, {
    deviceName,
    deviceClass,
    productCode,
    performanceTesting
  });

  // Phase 6: Labeling Review
  const labelingReview = await ctx.task(labelingReviewTask, {
    deviceName,
    deviceDescription,
    standardsCompliance
  });

  // Phase 7: eCopy Submission Package Assembly
  const submissionPackage = await ctx.task(submissionPackageTask, {
    deviceName,
    deviceClass,
    productCode,
    predicateSelection,
    deviceDescription,
    seComparison,
    performanceTesting,
    standardsCompliance,
    labelingReview
  });

  // Final Breakpoint: Submission Approval
  await ctx.breakpoint({
    question: `510(k) submission package complete for ${deviceName}. Approve for submission to FDA?`,
    title: '510(k) Submission Approval',
    context: {
      runId: ctx.runId,
      deviceName,
      completenessScore: submissionPackage.completenessScore,
      files: [
        { path: `artifacts/510k-submission-package.json`, format: 'json', content: submissionPackage }
      ]
    }
  });

  return {
    success: true,
    deviceName,
    submissionPackage: submissionPackage.package,
    seArgument: seComparison.argument,
    complianceMatrix: standardsCompliance.matrix,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/510k-submission',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const predicateSelectionTask = defineTask('predicate-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Predicate Selection - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Regulatory Affairs Specialist with expertise in 510(k)',
      task: 'Select and analyze predicate devices',
      context: {
        deviceName: args.deviceName,
        deviceClass: args.deviceClass,
        productCode: args.productCode,
        predicateDevices: args.predicateDevices
      },
      instructions: [
        '1. Search FDA 510(k) database for predicates',
        '2. Evaluate predicate suitability',
        '3. Assess intended use similarity',
        '4. Evaluate technological characteristics',
        '5. Identify primary predicate',
        '6. Identify reference predicates if needed',
        '7. Document predicate selection rationale',
        '8. Review predicate clearance summaries',
        '9. Identify any predicate recalls',
        '10. Create predicate comparison table'
      ],
      outputFormat: 'JSON object with predicate selection'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryPredicate', 'comparisonTable', 'selectionRationale'],
      properties: {
        primaryPredicate: { type: 'object' },
        referencePredicate: { type: 'object' },
        comparisonTable: { type: 'object' },
        selectionRationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['510k', 'predicate', 'regulatory']
}));

export const deviceDescriptionTask = defineTask('device-description', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Device Description - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer with expertise in medical device submissions',
      task: 'Document device description and intended use',
      context: {
        deviceName: args.deviceName,
        deviceClass: args.deviceClass,
        predicateSelection: args.predicateSelection
      },
      instructions: [
        '1. Write device description',
        '2. Document intended use statement',
        '3. Describe indications for use',
        '4. Document contraindications',
        '5. Describe device components',
        '6. Document materials and construction',
        '7. Describe operating principles',
        '8. Document accessories and packaging',
        '9. Create device specifications table',
        '10. Create device description section'
      ],
      outputFormat: 'JSON object with device description'
    },
    outputSchema: {
      type: 'object',
      required: ['description', 'intendedUse', 'indicationsForUse'],
      properties: {
        description: { type: 'string' },
        intendedUse: { type: 'string' },
        indicationsForUse: { type: 'string' },
        contraindications: { type: 'array', items: { type: 'string' } },
        specifications: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['510k', 'device-description', 'regulatory']
}));

export const seComparisonTask = defineTask('se-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: SE Comparison - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Regulatory Scientist with expertise in substantial equivalence',
      task: 'Develop substantial equivalence argument',
      context: {
        deviceName: args.deviceName,
        deviceDescription: args.deviceDescription,
        predicateSelection: args.predicateSelection
      },
      instructions: [
        '1. Compare intended use to predicate',
        '2. Compare technological characteristics',
        '3. Identify similarities',
        '4. Identify differences',
        '5. Assess if differences raise new Q of safety/effectiveness',
        '6. Develop SE argument',
        '7. Create SE comparison table',
        '8. Document testing rationale for differences',
        '9. Address potential FDA questions',
        '10. Create SE comparison section'
      ],
      outputFormat: 'JSON object with SE comparison'
    },
    outputSchema: {
      type: 'object',
      required: ['argument', 'comparisonTable', 'differences'],
      properties: {
        argument: { type: 'object' },
        comparisonTable: { type: 'object' },
        differences: { type: 'array', items: { type: 'object' } },
        testingRationale: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['510k', 'substantial-equivalence', 'regulatory']
}));

export const performanceTestingTask = defineTask('performance-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Performance Testing - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Engineer with expertise in medical device testing',
      task: 'Specify performance testing for 510(k)',
      context: {
        deviceName: args.deviceName,
        deviceDescription: args.deviceDescription,
        seComparison: args.seComparison,
        predicateSelection: args.predicateSelection
      },
      instructions: [
        '1. Identify required performance tests',
        '2. Reference applicable test standards',
        '3. Document bench testing',
        '4. Document biocompatibility testing',
        '5. Document software testing if applicable',
        '6. Document electrical safety testing',
        '7. Document EMC testing',
        '8. Document clinical data if needed',
        '9. Summarize test results',
        '10. Create performance data section'
      ],
      outputFormat: 'JSON object with performance testing'
    },
    outputSchema: {
      type: 'object',
      required: ['testMatrix', 'testSummaries', 'compliance'],
      properties: {
        testMatrix: { type: 'object' },
        testSummaries: { type: 'array', items: { type: 'object' } },
        compliance: { type: 'object' },
        clinicalData: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['510k', 'testing', 'regulatory']
}));

export const standardsComplianceTask = defineTask('standards-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Standards Compliance - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Standards Compliance Specialist',
      task: 'Document recognized standards compliance',
      context: {
        deviceName: args.deviceName,
        deviceClass: args.deviceClass,
        productCode: args.productCode,
        performanceTesting: args.performanceTesting
      },
      instructions: [
        '1. Identify applicable recognized standards',
        '2. Document compliance to IEC 60601 if applicable',
        '3. Document EMC compliance (IEC 60601-1-2)',
        '4. Document software standards (IEC 62304)',
        '5. Document risk management (ISO 14971)',
        '6. Document biocompatibility (ISO 10993)',
        '7. Document usability (IEC 62366)',
        '8. Create standards compliance matrix',
        '9. Document any deviations',
        '10. Create compliance documentation section'
      ],
      outputFormat: 'JSON object with standards compliance'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'applicableStandards', 'declarations'],
      properties: {
        matrix: { type: 'object' },
        applicableStandards: { type: 'array', items: { type: 'object' } },
        declarations: { type: 'array', items: { type: 'object' } },
        deviations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['510k', 'standards', 'regulatory']
}));

export const labelingReviewTask = defineTask('labeling-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Labeling Review - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Labeling Specialist',
      task: 'Review labeling for 510(k) submission',
      context: {
        deviceName: args.deviceName,
        deviceDescription: args.deviceDescription,
        standardsCompliance: args.standardsCompliance
      },
      instructions: [
        '1. Review device labeling',
        '2. Review instructions for use (IFU)',
        '3. Verify indications for use statement',
        '4. Verify warnings and precautions',
        '5. Review contraindications',
        '6. Verify compliance with 21 CFR 801',
        '7. Review promotional materials',
        '8. Verify unique device identification (UDI)',
        '9. Document labeling review',
        '10. Create labeling section for submission'
      ],
      outputFormat: 'JSON object with labeling review'
    },
    outputSchema: {
      type: 'object',
      required: ['review', 'labelingDocuments', 'compliance'],
      properties: {
        review: { type: 'object' },
        labelingDocuments: { type: 'array', items: { type: 'string' } },
        compliance: { type: 'object' },
        udiInformation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['510k', 'labeling', 'regulatory']
}));

export const submissionPackageTask = defineTask('submission-package', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Submission Package - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Regulatory Submissions Manager',
      task: 'Assemble complete 510(k) submission package',
      context: {
        deviceName: args.deviceName,
        deviceClass: args.deviceClass,
        productCode: args.productCode,
        predicateSelection: args.predicateSelection,
        deviceDescription: args.deviceDescription,
        seComparison: args.seComparison,
        performanceTesting: args.performanceTesting,
        standardsCompliance: args.standardsCompliance,
        labelingReview: args.labelingReview
      },
      instructions: [
        '1. Compile cover letter',
        '2. Complete FDA Form 3514',
        '3. Compile table of contents',
        '4. Assemble Section 1-18 per format guidance',
        '5. Include truthful and accuracy statement',
        '6. Include class III certification',
        '7. Include financial certification',
        '8. Compile all supporting documents',
        '9. Prepare eCopy per FDA requirements',
        '10. Perform final quality review'
      ],
      outputFormat: 'JSON object with submission package'
    },
    outputSchema: {
      type: 'object',
      required: ['package', 'tableOfContents', 'completenessScore'],
      properties: {
        package: { type: 'object' },
        tableOfContents: { type: 'array', items: { type: 'object' } },
        completenessScore: { type: 'number' },
        eCopyReady: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['510k', 'submission', 'regulatory']
}));
