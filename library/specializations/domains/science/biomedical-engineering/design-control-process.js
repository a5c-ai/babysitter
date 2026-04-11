/**
 * @process specializations/domains/science/biomedical-engineering/design-control-process
 * @description Design Control Process Implementation per FDA 21 CFR 820.30 - Implement comprehensive design
 * control processes including user needs capture, design inputs/outputs, verification, validation,
 * design transfer, and design history file management for medical device development.
 * @inputs { deviceName: string, deviceClass: string, intendedUse: string, userNeeds?: string[], regulatoryPathway?: string }
 * @outputs { success: boolean, designControlPlan: object, traceabilityMatrix: object, designHistoryFile: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/design-control-process', {
 *   deviceName: 'Smart Insulin Pump',
 *   deviceClass: 'Class II',
 *   intendedUse: 'Continuous subcutaneous insulin infusion for diabetes management',
 *   userNeeds: ['Accurate dosing', 'Portable design', 'Easy to use interface'],
 *   regulatoryPathway: '510(k)'
 * });
 *
 * @references
 * - FDA 21 CFR 820.30 Design Controls: https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/CFRSearch.cfm?fr=820.30
 * - FDA Design Control Guidance for Medical Device Manufacturers: https://www.fda.gov/regulatory-information/search-fda-guidance-documents/design-control-guidance-medical-device-manufacturers
 * - ISO 13485:2016 Medical Devices Quality Management Systems
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deviceName,
    deviceClass,
    intendedUse,
    userNeeds = [],
    regulatoryPathway = '510(k)'
  } = inputs;

  // Phase 1: User Needs Elicitation and Documentation
  const userNeedsAnalysis = await ctx.task(userNeedsElicitationTask, {
    deviceName,
    deviceClass,
    intendedUse,
    initialUserNeeds: userNeeds
  });

  // Quality Gate: User needs must be documented
  if (!userNeedsAnalysis.documentedNeeds || userNeedsAnalysis.documentedNeeds.length === 0) {
    return {
      success: false,
      error: 'User needs not adequately documented',
      phase: 'user-needs-elicitation',
      designControlPlan: null
    };
  }

  // Breakpoint: Review user needs documentation
  await ctx.breakpoint({
    question: `Review user needs for ${deviceName}. Are all stakeholder needs captured and prioritized?`,
    title: 'User Needs Review',
    context: {
      runId: ctx.runId,
      deviceName,
      documentedNeeds: userNeedsAnalysis.documentedNeeds,
      stakeholders: userNeedsAnalysis.stakeholders,
      files: [{
        path: `artifacts/phase1-user-needs.json`,
        format: 'json',
        content: userNeedsAnalysis
      }]
    }
  });

  // Phase 2: Design Input Specification Development
  const designInputs = await ctx.task(designInputSpecificationTask, {
    deviceName,
    deviceClass,
    intendedUse,
    userNeeds: userNeedsAnalysis.documentedNeeds,
    regulatoryPathway
  });

  // Phase 3: Design Output Creation
  const designOutputs = await ctx.task(designOutputCreationTask, {
    deviceName,
    designInputs: designInputs.specifications,
    deviceClass,
    intendedUse
  });

  // Phase 4: Design Verification Planning and Execution
  const verificationPlan = await ctx.task(designVerificationTask, {
    deviceName,
    designInputs: designInputs.specifications,
    designOutputs: designOutputs.outputs,
    deviceClass
  });

  // Phase 5: Design Validation Planning
  const validationPlan = await ctx.task(designValidationTask, {
    deviceName,
    userNeeds: userNeedsAnalysis.documentedNeeds,
    intendedUse,
    designOutputs: designOutputs.outputs,
    deviceClass
  });

  // Breakpoint: Review V&V plans
  await ctx.breakpoint({
    question: `Review verification and validation plans for ${deviceName}. Are test methods and acceptance criteria appropriate?`,
    title: 'V&V Plan Review',
    context: {
      runId: ctx.runId,
      verificationPlan: verificationPlan.testPlan,
      validationPlan: validationPlan.testPlan,
      files: [
        { path: `artifacts/phase4-verification-plan.json`, format: 'json', content: verificationPlan },
        { path: `artifacts/phase5-validation-plan.json`, format: 'json', content: validationPlan }
      ]
    }
  });

  // Phase 6: Design Transfer Planning
  const designTransfer = await ctx.task(designTransferTask, {
    deviceName,
    designOutputs: designOutputs.outputs,
    verificationResults: verificationPlan.testPlan,
    deviceClass
  });

  // Phase 7: Traceability Matrix Development
  const traceabilityMatrix = await ctx.task(traceabilityMatrixTask, {
    deviceName,
    userNeeds: userNeedsAnalysis.documentedNeeds,
    designInputs: designInputs.specifications,
    designOutputs: designOutputs.outputs,
    verificationPlan: verificationPlan.testPlan,
    validationPlan: validationPlan.testPlan
  });

  // Quality Gate: Traceability must be complete
  const traceabilityCoverage = traceabilityMatrix.coverageScore || 0;
  if (traceabilityCoverage < 100) {
    await ctx.breakpoint({
      question: `Traceability coverage is ${traceabilityCoverage}% (should be 100%). Review and address gaps before proceeding?`,
      title: 'Traceability Gap Warning',
      context: {
        runId: ctx.runId,
        coverage: traceabilityCoverage,
        gaps: traceabilityMatrix.gaps,
        recommendation: 'Address traceability gaps to ensure complete requirements coverage'
      }
    });
  }

  // Phase 8: Design History File Compilation
  const designHistoryFile = await ctx.task(designHistoryFileTask, {
    deviceName,
    deviceClass,
    intendedUse,
    regulatoryPathway,
    userNeedsAnalysis,
    designInputs,
    designOutputs,
    verificationPlan,
    validationPlan,
    designTransfer,
    traceabilityMatrix
  });

  // Final Breakpoint: Design Control Completion
  await ctx.breakpoint({
    question: `Design Control Process complete for ${deviceName}. Approve Design History File and proceed to manufacturing?`,
    title: 'Design Control Approval',
    context: {
      runId: ctx.runId,
      deviceName,
      traceabilityCoverage,
      files: [
        { path: `artifacts/design-history-file.json`, format: 'json', content: designHistoryFile },
        { path: `artifacts/traceability-matrix.json`, format: 'json', content: traceabilityMatrix }
      ]
    }
  });

  return {
    success: true,
    deviceName,
    deviceClass,
    regulatoryPathway,
    designControlPlan: {
      userNeeds: userNeedsAnalysis.documentedNeeds,
      designInputs: designInputs.specifications,
      designOutputs: designOutputs.outputs,
      verificationPlan: verificationPlan.testPlan,
      validationPlan: validationPlan.testPlan,
      designTransfer: designTransfer.transferPlan
    },
    traceabilityMatrix: {
      coverageScore: traceabilityCoverage,
      matrix: traceabilityMatrix.matrix,
      gaps: traceabilityMatrix.gaps
    },
    designHistoryFile: designHistoryFile.dhf,
    nextSteps: designHistoryFile.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/design-control-process',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const userNeedsElicitationTask = defineTask('user-needs-elicitation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: User Needs Elicitation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Human Factors Engineer with expertise in medical device user needs analysis',
      task: 'Conduct comprehensive user needs elicitation and documentation for medical device design control',
      context: {
        deviceName: args.deviceName,
        deviceClass: args.deviceClass,
        intendedUse: args.intendedUse,
        initialUserNeeds: args.initialUserNeeds
      },
      instructions: [
        '1. Identify all user populations (patients, healthcare providers, caregivers, technicians)',
        '2. Document intended use environment characteristics',
        '3. Elicit and document user needs using structured methods (interviews, observations, surveys)',
        '4. Categorize needs by user group and priority (essential, desirable, nice-to-have)',
        '5. Document user characteristics affecting device interaction (physical, cognitive, sensory)',
        '6. Identify use scenarios and workflow integration points',
        '7. Document training requirements and learning curve expectations',
        '8. Capture accessibility and special population needs',
        '9. Document user expectations for device performance and reliability',
        '10. Create traceability-ready user needs statements'
      ],
      outputFormat: 'JSON object with comprehensive user needs documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentedNeeds', 'stakeholders', 'useEnvironments'],
      properties: {
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userGroup: { type: 'string' },
              characteristics: { type: 'array', items: { type: 'string' } },
              primaryTasks: { type: 'array', items: { type: 'string' } },
              trainingLevel: { type: 'string' }
            }
          }
        },
        documentedNeeds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              needId: { type: 'string' },
              needStatement: { type: 'string' },
              userGroup: { type: 'string' },
              priority: { type: 'string', enum: ['essential', 'desirable', 'nice-to-have'] },
              rationale: { type: 'string' },
              verificationMethod: { type: 'string' }
            }
          }
        },
        useEnvironments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              environment: { type: 'string' },
              characteristics: { type: 'array', items: { type: 'string' } },
              constraints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        useScenarios: { type: 'array', items: { type: 'string' } },
        accessibilityRequirements: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['design-control', 'user-needs', 'human-factors', 'fda-820.30']
}));

export const designInputSpecificationTask = defineTask('design-input-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Design Input Specification - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Medical Device Systems Engineer with expertise in requirements engineering',
      task: 'Develop comprehensive design input specifications from user needs',
      context: {
        deviceName: args.deviceName,
        deviceClass: args.deviceClass,
        intendedUse: args.intendedUse,
        userNeeds: args.userNeeds,
        regulatoryPathway: args.regulatoryPathway
      },
      instructions: [
        '1. Transform user needs into measurable design input requirements',
        '2. Specify functional requirements with acceptance criteria',
        '3. Specify performance requirements with quantitative targets',
        '4. Document safety requirements per risk analysis inputs',
        '5. Specify biocompatibility requirements based on patient contact',
        '6. Document electromagnetic compatibility requirements',
        '7. Specify software requirements if applicable (IEC 62304)',
        '8. Document packaging and labeling requirements',
        '9. Specify shelf life and stability requirements',
        '10. Ensure each requirement is verifiable and traceable'
      ],
      outputFormat: 'JSON object with complete design input specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications', 'traceability'],
      properties: {
        specifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              specId: { type: 'string' },
              requirement: { type: 'string' },
              category: { type: 'string', enum: ['functional', 'performance', 'safety', 'biocompatibility', 'emc', 'software', 'packaging', 'labeling'] },
              acceptanceCriteria: { type: 'string' },
              verificationMethod: { type: 'string' },
              traceToUserNeed: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        traceability: {
          type: 'object',
          properties: {
            userNeedToSpec: { type: 'object' },
            unaddressedNeeds: { type: 'array', items: { type: 'string' } }
          }
        },
        regulatoryRequirements: { type: 'array', items: { type: 'string' } },
        standardsApplicable: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['design-control', 'design-inputs', 'requirements', 'fda-820.30']
}));

export const designOutputCreationTask = defineTask('design-output-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Design Output Creation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Medical Device Design Engineer with expertise in design documentation',
      task: 'Create comprehensive design outputs that meet design input requirements',
      context: {
        deviceName: args.deviceName,
        designInputs: args.designInputs,
        deviceClass: args.deviceClass,
        intendedUse: args.intendedUse
      },
      instructions: [
        '1. Document device specifications and drawings',
        '2. Create component specifications and material requirements',
        '3. Document manufacturing processes and procedures',
        '4. Specify quality acceptance criteria for manufacturing',
        '5. Document software design outputs if applicable',
        '6. Create packaging specifications and instructions for use',
        '7. Document labeling content and format requirements',
        '8. Specify storage and handling requirements',
        '9. Create device master record (DMR) content outline',
        '10. Ensure traceability from outputs to inputs'
      ],
      outputFormat: 'JSON object with complete design output documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['outputs', 'dmrContent'],
      properties: {
        outputs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              outputId: { type: 'string' },
              outputType: { type: 'string' },
              description: { type: 'string' },
              documentReference: { type: 'string' },
              traceToInput: { type: 'array', items: { type: 'string' } },
              acceptanceCriteria: { type: 'string' }
            }
          }
        },
        dmrContent: {
          type: 'object',
          properties: {
            deviceSpecifications: { type: 'array', items: { type: 'string' } },
            componentSpecifications: { type: 'array', items: { type: 'string' } },
            manufacturingProcedures: { type: 'array', items: { type: 'string' } },
            qualityProcedures: { type: 'array', items: { type: 'string' } },
            labelingContent: { type: 'array', items: { type: 'string' } }
          }
        },
        softwareOutputs: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['design-control', 'design-outputs', 'dmr', 'fda-820.30']
}));

export const designVerificationTask = defineTask('design-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Design Verification - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Medical Device V&V Engineer with expertise in verification testing',
      task: 'Plan comprehensive design verification to confirm design outputs meet design inputs',
      context: {
        deviceName: args.deviceName,
        designInputs: args.designInputs,
        designOutputs: args.designOutputs,
        deviceClass: args.deviceClass
      },
      instructions: [
        '1. Create verification test plan covering all design inputs',
        '2. Define test methods with scientific rationale',
        '3. Specify sample sizes with statistical justification',
        '4. Define acceptance criteria traceable to design inputs',
        '5. Plan inspections, analyses, and demonstrations',
        '6. Document test fixtures and equipment requirements',
        '7. Define environmental conditions for testing',
        '8. Plan software verification activities if applicable',
        '9. Create test protocol templates',
        '10. Define verification report requirements'
      ],
      outputFormat: 'JSON object with comprehensive verification test plan'
    },
    outputSchema: {
      type: 'object',
      required: ['testPlan', 'protocols'],
      properties: {
        testPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testId: { type: 'string' },
              testName: { type: 'string' },
              designInputReference: { type: 'string' },
              testMethod: { type: 'string' },
              sampleSize: { type: 'string' },
              acceptanceCriteria: { type: 'string' },
              testType: { type: 'string', enum: ['inspection', 'analysis', 'test', 'demonstration'] },
              equipment: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        protocols: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              protocolId: { type: 'string' },
              title: { type: 'string' },
              testsIncluded: { type: 'array', items: { type: 'string' } },
              approvalRequired: { type: 'boolean' }
            }
          }
        },
        statisticalRationale: { type: 'string' },
        equipmentList: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['design-control', 'verification', 'testing', 'fda-820.30']
}));

export const designValidationTask = defineTask('design-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Design Validation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Medical Device V&V Engineer with expertise in validation testing',
      task: 'Plan comprehensive design validation to ensure device meets user needs and intended uses',
      context: {
        deviceName: args.deviceName,
        userNeeds: args.userNeeds,
        intendedUse: args.intendedUse,
        designOutputs: args.designOutputs,
        deviceClass: args.deviceClass
      },
      instructions: [
        '1. Create validation test plan ensuring user needs are met',
        '2. Plan simulated or actual use testing with representative users',
        '3. Define validation acceptance criteria traceable to user needs',
        '4. Plan biocompatibility testing per ISO 10993',
        '5. Plan clinical evaluation or clinical study if required',
        '6. Plan usability validation per IEC 62366-1',
        '7. Define environmental and durability validation',
        '8. Plan sterilization validation if applicable',
        '9. Plan packaging validation per ISO 11607',
        '10. Define validation report requirements and format'
      ],
      outputFormat: 'JSON object with comprehensive validation test plan'
    },
    outputSchema: {
      type: 'object',
      required: ['testPlan', 'clinicalEvidence'],
      properties: {
        testPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testId: { type: 'string' },
              testName: { type: 'string' },
              userNeedReference: { type: 'string' },
              testMethod: { type: 'string' },
              representativeUsers: { type: 'string' },
              acceptanceCriteria: { type: 'string' },
              testEnvironment: { type: 'string' }
            }
          }
        },
        clinicalEvidence: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            clinicalStudyRequired: { type: 'boolean' },
            literatureReview: { type: 'boolean' },
            predicateComparison: { type: 'boolean' }
          }
        },
        usabilityValidation: {
          type: 'object',
          properties: {
            summativeStudyRequired: { type: 'boolean' },
            userGroups: { type: 'array', items: { type: 'string' } },
            criticalTasks: { type: 'array', items: { type: 'string' } }
          }
        },
        biocompatibilityPlan: { type: 'array', items: { type: 'string' } },
        sterilizationPlan: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['design-control', 'validation', 'clinical', 'fda-820.30']
}));

export const designTransferTask = defineTask('design-transfer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Design Transfer - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Manufacturing Engineer with expertise in design transfer',
      task: 'Plan comprehensive design transfer from development to manufacturing',
      context: {
        deviceName: args.deviceName,
        designOutputs: args.designOutputs,
        verificationResults: args.verificationResults,
        deviceClass: args.deviceClass
      },
      instructions: [
        '1. Verify design outputs are suitable for manufacturing',
        '2. Create manufacturing process specifications',
        '3. Define process validation requirements (IQ/OQ/PQ)',
        '4. Establish incoming inspection requirements',
        '5. Define in-process and final inspection requirements',
        '6. Transfer production documentation (DMR)',
        '7. Train manufacturing personnel',
        '8. Establish supplier qualification requirements',
        '9. Define equipment qualification requirements',
        '10. Plan production pilot runs and process capability studies'
      ],
      outputFormat: 'JSON object with comprehensive design transfer plan'
    },
    outputSchema: {
      type: 'object',
      required: ['transferPlan', 'processValidation'],
      properties: {
        transferPlan: {
          type: 'object',
          properties: {
            transferActivities: { type: 'array', items: { type: 'string' } },
            documentationPackage: { type: 'array', items: { type: 'string' } },
            trainingRequirements: { type: 'array', items: { type: 'string' } },
            readinessCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        processValidation: {
          type: 'object',
          properties: {
            iqRequirements: { type: 'array', items: { type: 'string' } },
            oqRequirements: { type: 'array', items: { type: 'string' } },
            pqRequirements: { type: 'array', items: { type: 'string' } }
          }
        },
        supplierRequirements: { type: 'array', items: { type: 'string' } },
        inspectionRequirements: {
          type: 'object',
          properties: {
            incoming: { type: 'array', items: { type: 'string' } },
            inProcess: { type: 'array', items: { type: 'string' } },
            final: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['design-control', 'design-transfer', 'manufacturing', 'fda-820.30']
}));

export const traceabilityMatrixTask = defineTask('traceability-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Traceability Matrix - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Assurance Engineer with expertise in design control traceability',
      task: 'Develop comprehensive traceability matrix linking all design control elements',
      context: {
        deviceName: args.deviceName,
        userNeeds: args.userNeeds,
        designInputs: args.designInputs,
        designOutputs: args.designOutputs,
        verificationPlan: args.verificationPlan,
        validationPlan: args.validationPlan
      },
      instructions: [
        '1. Create user needs to design inputs traceability',
        '2. Create design inputs to design outputs traceability',
        '3. Create design inputs to verification tests traceability',
        '4. Create user needs to validation tests traceability',
        '5. Identify gaps in traceability coverage',
        '6. Calculate traceability coverage score',
        '7. Document forward and backward traceability',
        '8. Identify orphan requirements (no parents or children)',
        '9. Create traceability matrix visualization',
        '10. Recommend gap closure activities'
      ],
      outputFormat: 'JSON object with complete traceability matrix'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'coverageScore', 'gaps'],
      properties: {
        matrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userNeed: { type: 'string' },
              designInputs: { type: 'array', items: { type: 'string' } },
              designOutputs: { type: 'array', items: { type: 'string' } },
              verificationTests: { type: 'array', items: { type: 'string' } },
              validationTests: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        coverageScore: { type: 'number', minimum: 0, maximum: 100 },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gapType: { type: 'string' },
              item: { type: 'string' },
              missingLink: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        orphanItems: { type: 'array', items: { type: 'string' } },
        summary: {
          type: 'object',
          properties: {
            totalUserNeeds: { type: 'number' },
            totalDesignInputs: { type: 'number' },
            totalDesignOutputs: { type: 'number' },
            totalVerificationTests: { type: 'number' },
            totalValidationTests: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['design-control', 'traceability', 'quality', 'fda-820.30']
}));

export const designHistoryFileTask = defineTask('design-history-file', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Design History File - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Regulatory Affairs Specialist with expertise in DHF compilation',
      task: 'Compile comprehensive Design History File for regulatory submission readiness',
      context: {
        deviceName: args.deviceName,
        deviceClass: args.deviceClass,
        intendedUse: args.intendedUse,
        regulatoryPathway: args.regulatoryPathway,
        userNeedsAnalysis: args.userNeedsAnalysis,
        designInputs: args.designInputs,
        designOutputs: args.designOutputs,
        verificationPlan: args.verificationPlan,
        validationPlan: args.validationPlan,
        designTransfer: args.designTransfer,
        traceabilityMatrix: args.traceabilityMatrix
      },
      instructions: [
        '1. Organize DHF table of contents per 21 CFR 820.30',
        '2. Compile design and development planning records',
        '3. Document design input records and approval signatures',
        '4. Document design output records and approval signatures',
        '5. Compile design review records with meeting minutes',
        '6. Document verification records and results',
        '7. Document validation records and results',
        '8. Compile design transfer records',
        '9. Document design change records if applicable',
        '10. Create DHF index and cross-reference to traceability matrix'
      ],
      outputFormat: 'JSON object with complete DHF structure and content index'
    },
    outputSchema: {
      type: 'object',
      required: ['dhf', 'completenessScore', 'nextSteps'],
      properties: {
        dhf: {
          type: 'object',
          properties: {
            tableOfContents: { type: 'array', items: { type: 'string' } },
            designPlanningRecords: { type: 'array', items: { type: 'string' } },
            designInputRecords: { type: 'array', items: { type: 'string' } },
            designOutputRecords: { type: 'array', items: { type: 'string' } },
            designReviewRecords: { type: 'array', items: { type: 'string' } },
            verificationRecords: { type: 'array', items: { type: 'string' } },
            validationRecords: { type: 'array', items: { type: 'string' } },
            transferRecords: { type: 'array', items: { type: 'string' } },
            changeRecords: { type: 'array', items: { type: 'string' } }
          }
        },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        missingDocuments: { type: 'array', items: { type: 'string' } },
        approvalStatus: {
          type: 'object',
          properties: {
            designInputApproved: { type: 'boolean' },
            designOutputApproved: { type: 'boolean' },
            verificationComplete: { type: 'boolean' },
            validationComplete: { type: 'boolean' },
            transferComplete: { type: 'boolean' }
          }
        },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              responsible: { type: 'string' },
              dueDate: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['design-control', 'dhf', 'regulatory', 'fda-820.30']
}));
