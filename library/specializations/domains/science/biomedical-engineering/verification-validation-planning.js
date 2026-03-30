/**
 * @process specializations/domains/science/biomedical-engineering/verification-validation-planning
 * @description Verification and Validation Test Planning - Develop comprehensive V&V test plans ensuring all
 * design requirements are tested with appropriate methods, sample sizes, and acceptance criteria.
 * @inputs { deviceName: string, designInputs: object[], deviceClass: string, intendedUse: string }
 * @outputs { success: boolean, vvMasterPlan: object, testProtocols: object[], testMatrix: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/verification-validation-planning', {
 *   deviceName: 'Surgical Robot Arm',
 *   designInputs: [{ requirement: 'Position accuracy < 0.5mm', type: 'performance' }],
 *   deviceClass: 'Class II',
 *   intendedUse: 'Minimally invasive surgical procedures'
 * });
 *
 * @references
 * - FDA 21 CFR 820.30(f)(g) Design Verification and Validation
 * - GHTF SG3/N99-10 Quality Management Systems - Process Validation Guidance
 * - ISO 13485:2016 Section 7.3.6 and 7.3.7
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deviceName,
    designInputs,
    deviceClass,
    intendedUse
  } = inputs;

  // Phase 1: V&V Strategy Development
  const vvStrategy = await ctx.task(vvStrategyTask, {
    deviceName,
    designInputs,
    deviceClass,
    intendedUse
  });

  // Phase 2: Test Requirement Derivation
  const testRequirements = await ctx.task(testRequirementDerivationTask, {
    deviceName,
    designInputs,
    vvStrategy
  });

  // Phase 3: Test Method Selection
  const testMethods = await ctx.task(testMethodSelectionTask, {
    deviceName,
    testRequirements: testRequirements.requirements,
    deviceClass
  });

  // Breakpoint: Review test methods
  await ctx.breakpoint({
    question: `Review test methods for ${deviceName}. Are all test methods appropriate and validated?`,
    title: 'Test Method Review',
    context: {
      runId: ctx.runId,
      deviceName,
      testMethodCount: testMethods.methods.length,
      files: [{
        path: `artifacts/phase3-test-methods.json`,
        format: 'json',
        content: testMethods
      }]
    }
  });

  // Phase 4: Sample Size Determination
  const sampleSizes = await ctx.task(sampleSizeDeterminationTask, {
    deviceName,
    testRequirements: testRequirements.requirements,
    testMethods: testMethods.methods,
    deviceClass
  });

  // Phase 5: Test Protocol Development
  const testProtocols = await ctx.task(testProtocolDevelopmentTask, {
    deviceName,
    testRequirements: testRequirements.requirements,
    testMethods: testMethods.methods,
    sampleSizes: sampleSizes.calculations
  });

  // Phase 6: V&V Master Plan Compilation
  const vvMasterPlan = await ctx.task(vvMasterPlanTask, {
    deviceName,
    deviceClass,
    intendedUse,
    vvStrategy,
    testRequirements,
    testMethods,
    sampleSizes,
    testProtocols
  });

  // Phase 7: Traceability Verification
  const traceabilityVerification = await ctx.task(traceabilityVerificationTask, {
    deviceName,
    designInputs,
    testRequirements: testRequirements.requirements,
    testProtocols: testProtocols.protocols
  });

  // Final Breakpoint: V&V Plan Approval
  await ctx.breakpoint({
    question: `V&V Planning complete for ${deviceName}. Traceability coverage: ${traceabilityVerification.coverageScore}%. Approve V&V Master Plan?`,
    title: 'V&V Plan Approval',
    context: {
      runId: ctx.runId,
      deviceName,
      traceabilityCoverage: traceabilityVerification.coverageScore,
      files: [
        { path: `artifacts/vv-master-plan.json`, format: 'json', content: vvMasterPlan },
        { path: `artifacts/traceability-matrix.json`, format: 'json', content: traceabilityVerification }
      ]
    }
  });

  return {
    success: true,
    deviceName,
    vvMasterPlan: vvMasterPlan.plan,
    testProtocols: testProtocols.protocols,
    testMatrix: {
      requirements: testRequirements.requirements,
      methods: testMethods.methods,
      traceability: traceabilityVerification.matrix
    },
    sampleSizes: sampleSizes.calculations,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/verification-validation-planning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const vvStrategyTask = defineTask('vv-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: V&V Strategy - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'V&V Strategy Specialist with expertise in medical device testing',
      task: 'Develop comprehensive verification and validation strategy',
      context: {
        deviceName: args.deviceName,
        designInputs: args.designInputs,
        deviceClass: args.deviceClass,
        intendedUse: args.intendedUse
      },
      instructions: [
        '1. Define V&V philosophy and approach',
        '2. Identify verification vs validation activities',
        '3. Define testing levels (unit, integration, system)',
        '4. Establish acceptance criteria framework',
        '5. Identify applicable standards and test methods',
        '6. Define resource and timeline requirements',
        '7. Establish risk-based testing priorities',
        '8. Define documentation requirements',
        '9. Plan for test failures and retesting',
        '10. Create V&V strategy document'
      ],
      outputFormat: 'JSON object with V&V strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'testingLevels', 'applicableStandards'],
      properties: {
        strategy: { type: 'object' },
        testingLevels: { type: 'array', items: { type: 'string' } },
        applicableStandards: { type: 'array', items: { type: 'string' } },
        riskBasedPriorities: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['verification', 'validation', 'planning', 'medical-device']
}));

export const testRequirementDerivationTask = defineTask('test-requirement-derivation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Test Requirement Derivation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Engineer with expertise in requirements-based testing',
      task: 'Derive test requirements from design inputs',
      context: {
        deviceName: args.deviceName,
        designInputs: args.designInputs,
        vvStrategy: args.vvStrategy
      },
      instructions: [
        '1. Analyze each design input for testability',
        '2. Derive specific test requirements',
        '3. Define acceptance criteria for each test',
        '4. Identify verification vs validation tests',
        '5. Establish traceability to design inputs',
        '6. Prioritize tests by risk and criticality',
        '7. Group related test requirements',
        '8. Identify test dependencies',
        '9. Document test rationale',
        '10. Create test requirements matrix'
      ],
      outputFormat: 'JSON object with test requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'traceability'],
      properties: {
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testReqId: { type: 'string' },
              designInputRef: { type: 'string' },
              testType: { type: 'string' },
              acceptanceCriteria: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        traceability: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['verification', 'validation', 'requirements', 'medical-device']
}));

export const testMethodSelectionTask = defineTask('test-method-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Test Method Selection - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Method Specialist with expertise in medical device standards',
      task: 'Select and validate appropriate test methods',
      context: {
        deviceName: args.deviceName,
        testRequirements: args.testRequirements,
        deviceClass: args.deviceClass
      },
      instructions: [
        '1. Identify applicable standard test methods (ISO, ASTM, IEC)',
        '2. Evaluate method suitability for each requirement',
        '3. Determine method validation requirements',
        '4. Document method rationale and justification',
        '5. Identify equipment and facility requirements',
        '6. Define environmental conditions',
        '7. Establish method validation protocols',
        '8. Document measurement uncertainty',
        '9. Identify alternative methods if needed',
        '10. Create test method matrix'
      ],
      outputFormat: 'JSON object with test methods'
    },
    outputSchema: {
      type: 'object',
      required: ['methods', 'validationRequirements'],
      properties: {
        methods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              methodId: { type: 'string' },
              testReqRef: { type: 'string' },
              methodName: { type: 'string' },
              standard: { type: 'string' },
              equipment: { type: 'array', items: { type: 'string' } },
              validationRequired: { type: 'boolean' }
            }
          }
        },
        validationRequirements: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['verification', 'validation', 'test-methods', 'medical-device']
}));

export const sampleSizeDeterminationTask = defineTask('sample-size-determination', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Sample Size Determination - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Biostatistician with expertise in medical device testing',
      task: 'Determine statistically justified sample sizes',
      context: {
        deviceName: args.deviceName,
        testRequirements: args.testRequirements,
        testMethods: args.testMethods,
        deviceClass: args.deviceClass
      },
      instructions: [
        '1. Identify statistical requirements for each test',
        '2. Determine confidence level and power requirements',
        '3. Calculate sample sizes using appropriate methods',
        '4. Consider reliability demonstration testing (RDT)',
        '5. Apply sampling plans for attribute data',
        '6. Justify sample sizes with statistical rationale',
        '7. Consider worst-case conditions',
        '8. Document assumptions and limitations',
        '9. Plan for test failures and replacement samples',
        '10. Create sample size summary'
      ],
      outputFormat: 'JSON object with sample size calculations'
    },
    outputSchema: {
      type: 'object',
      required: ['calculations', 'statisticalRationale'],
      properties: {
        calculations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testReqRef: { type: 'string' },
              sampleSize: { type: 'number' },
              confidenceLevel: { type: 'number' },
              power: { type: 'number' },
              method: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        statisticalRationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['verification', 'validation', 'statistics', 'medical-device']
}));

export const testProtocolDevelopmentTask = defineTask('test-protocol-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Test Protocol Development - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Protocol Writer with expertise in medical device testing',
      task: 'Develop detailed test protocols',
      context: {
        deviceName: args.deviceName,
        testRequirements: args.testRequirements,
        testMethods: args.testMethods,
        sampleSizes: args.sampleSizes
      },
      instructions: [
        '1. Create protocol template structure',
        '2. Document test objectives and scope',
        '3. Specify test equipment and materials',
        '4. Detail test procedures step-by-step',
        '5. Define acceptance criteria',
        '6. Specify data collection requirements',
        '7. Define deviation handling procedures',
        '8. Include safety precautions',
        '9. Specify approval requirements',
        '10. Create protocol review checklist'
      ],
      outputFormat: 'JSON object with test protocols'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'template'],
      properties: {
        protocols: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              protocolId: { type: 'string' },
              title: { type: 'string' },
              testRequirements: { type: 'array', items: { type: 'string' } },
              objective: { type: 'string' },
              procedure: { type: 'array', items: { type: 'string' } },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        template: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['verification', 'validation', 'protocols', 'medical-device']
}));

export const vvMasterPlanTask = defineTask('vv-master-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: V&V Master Plan - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'V&V Program Manager with expertise in medical device development',
      task: 'Compile comprehensive V&V Master Plan',
      context: {
        deviceName: args.deviceName,
        deviceClass: args.deviceClass,
        intendedUse: args.intendedUse,
        vvStrategy: args.vvStrategy,
        testRequirements: args.testRequirements,
        testMethods: args.testMethods,
        sampleSizes: args.sampleSizes,
        testProtocols: args.testProtocols
      },
      instructions: [
        '1. Compile V&V master plan document',
        '2. Document V&V organization and responsibilities',
        '3. Include complete test matrix',
        '4. Document resource requirements',
        '5. Create V&V schedule and milestones',
        '6. Define deliverables and reporting',
        '7. Document risk-based test prioritization',
        '8. Include deviation and change control procedures',
        '9. Define completion criteria',
        '10. Create master plan summary'
      ],
      outputFormat: 'JSON object with V&V Master Plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'schedule', 'deliverables'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            scope: { type: 'string' },
            organization: { type: 'object' },
            testMatrix: { type: 'object' },
            resources: { type: 'object' }
          }
        },
        schedule: { type: 'object' },
        deliverables: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['verification', 'validation', 'master-plan', 'medical-device']
}));

export const traceabilityVerificationTask = defineTask('traceability-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Traceability Verification - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Engineer with expertise in requirements traceability',
      task: 'Verify complete traceability from design inputs to tests',
      context: {
        deviceName: args.deviceName,
        designInputs: args.designInputs,
        testRequirements: args.testRequirements,
        testProtocols: args.testProtocols
      },
      instructions: [
        '1. Create traceability matrix',
        '2. Verify all design inputs have tests',
        '3. Verify all tests trace to design inputs',
        '4. Identify gaps in traceability',
        '5. Calculate traceability coverage score',
        '6. Document orphan requirements',
        '7. Verify bidirectional traceability',
        '8. Create traceability report',
        '9. Recommend gap closure actions',
        '10. Approve traceability matrix'
      ],
      outputFormat: 'JSON object with traceability verification'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'coverageScore', 'gaps'],
      properties: {
        matrix: { type: 'object' },
        coverageScore: { type: 'number' },
        gaps: { type: 'array', items: { type: 'object' } },
        orphanItems: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['verification', 'validation', 'traceability', 'medical-device']
}));
