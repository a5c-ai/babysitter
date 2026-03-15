/**
 * @process specializations/domains/science/automotive-engineering/adas-feature-development
 * @description ADAS Feature Development - Develop specific ADAS features including Automated Emergency Braking
 * (AEB), Adaptive Cruise Control (ACC), Lane Keeping Assist (LKA), and parking assistance systems.
 * @inputs { projectName: string, featureType: string, targetRatings?: string[], regulatoryRequirements?: string[] }
 * @outputs { success: boolean, featureSpecifications: object, softwareReleases: object, testReports: object, hmiDocumentation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/adas-feature-development', {
 *   projectName: 'AEB-PedestrianDetection',
 *   featureType: 'AEB',
 *   targetRatings: ['Euro-NCAP-5star', 'IIHS-TSP+'],
 *   regulatoryRequirements: ['UN-R152', 'FMVSS-127']
 * });
 *
 * @references
 * - Euro NCAP Assessment Protocol
 * - UN ECE R152 AEB Regulation
 * - FMVSS 127 Low-Speed Alert
 * - ISO 15622 ACC Systems
 * - ISO 11270 Lane Keeping Systems
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    featureType,
    targetRatings = [],
    regulatoryRequirements = []
  } = inputs;

  // Phase 1: Feature Requirements Definition
  const featureRequirements = await ctx.task(featureRequirementsTask, {
    projectName,
    featureType,
    targetRatings,
    regulatoryRequirements
  });

  // Quality Gate: Requirements must be complete
  if (!featureRequirements.requirements || featureRequirements.requirements.length === 0) {
    return {
      success: false,
      error: 'Feature requirements not defined',
      phase: 'feature-requirements',
      featureSpecifications: null
    };
  }

  // Phase 2: Use Case Development
  const useCases = await ctx.task(useCaseDevelopmentTask, {
    projectName,
    featureType,
    featureRequirements,
    targetRatings
  });

  // Breakpoint: Use cases review
  await ctx.breakpoint({
    question: `Review use cases for ${projectName} ${featureType}. ${useCases.useCases?.length || 0} use cases defined. Approve use cases?`,
    title: 'ADAS Use Cases Review',
    context: {
      runId: ctx.runId,
      projectName,
      useCases,
      files: [{
        path: `artifacts/adas-use-cases.json`,
        format: 'json',
        content: useCases
      }]
    }
  });

  // Phase 3: Algorithm Development
  const algorithmDevelopment = await ctx.task(algorithmDevelopmentTask, {
    projectName,
    featureType,
    featureRequirements,
    useCases
  });

  // Phase 4: Actuator Integration
  const actuatorIntegration = await ctx.task(actuatorIntegrationTask, {
    projectName,
    featureType,
    algorithmDevelopment
  });

  // Phase 5: HMI Development
  const hmiDevelopment = await ctx.task(hmiDevelopmentTask, {
    projectName,
    featureType,
    useCases,
    algorithmDevelopment
  });

  // Phase 6: NCAP and Regulatory Testing
  const regulatoryTesting = await ctx.task(regulatoryTestingTask, {
    projectName,
    featureType,
    algorithmDevelopment,
    targetRatings,
    regulatoryRequirements
  });

  // Quality Gate: Regulatory compliance
  if (regulatoryTesting.complianceGaps && regulatoryTesting.complianceGaps.length > 0) {
    await ctx.breakpoint({
      question: `Regulatory testing identified ${regulatoryTesting.complianceGaps.length} compliance gaps. Review and approve mitigation plan?`,
      title: 'Regulatory Compliance Warning',
      context: {
        runId: ctx.runId,
        regulatoryTesting,
        recommendation: 'Address compliance gaps before production release'
      }
    });
  }

  // Phase 7: Feature Validation
  const featureValidation = await ctx.task(featureValidationTask, {
    projectName,
    featureType,
    algorithmDevelopment,
    hmiDevelopment,
    regulatoryTesting,
    useCases
  });

  // Phase 8: Release Documentation
  const featureRelease = await ctx.task(featureReleaseTask, {
    projectName,
    featureType,
    featureRequirements,
    useCases,
    algorithmDevelopment,
    actuatorIntegration,
    hmiDevelopment,
    regulatoryTesting,
    featureValidation
  });

  // Final Breakpoint: Feature approval
  await ctx.breakpoint({
    question: `ADAS Feature Development complete for ${projectName} ${featureType}. NCAP score: ${regulatoryTesting.ncapScore}. Approve for production?`,
    title: 'ADAS Feature Approval',
    context: {
      runId: ctx.runId,
      projectName,
      featureSummary: featureRelease.summary,
      files: [
        { path: `artifacts/feature-specifications.json`, format: 'json', content: featureRelease },
        { path: `artifacts/test-reports.json`, format: 'json', content: regulatoryTesting }
      ]
    }
  });

  return {
    success: true,
    projectName,
    featureSpecifications: featureRelease.specifications,
    softwareReleases: algorithmDevelopment.software,
    testReports: {
      regulatory: regulatoryTesting.reports,
      validation: featureValidation.reports
    },
    hmiDocumentation: hmiDevelopment.documentation,
    ncapScore: regulatoryTesting.ncapScore,
    nextSteps: featureRelease.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/adas-feature-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const featureRequirementsTask = defineTask('feature-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Feature Requirements Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ADAS Requirements Engineer',
      task: 'Define comprehensive ADAS feature requirements',
      context: {
        projectName: args.projectName,
        featureType: args.featureType,
        targetRatings: args.targetRatings,
        regulatoryRequirements: args.regulatoryRequirements
      },
      instructions: [
        '1. Define functional requirements from regulations',
        '2. Extract Euro NCAP test protocol requirements',
        '3. Define performance requirements (detection range, timing)',
        '4. Specify sensor requirements',
        '5. Define HMI requirements',
        '6. Specify false positive/negative limits',
        '7. Define operational conditions',
        '8. Specify safety requirements (ASIL)',
        '9. Define customer-facing requirements',
        '10. Document requirements traceability'
      ],
      outputFormat: 'JSON object with feature requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'regulatory', 'performance'],
      properties: {
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              source: { type: 'string' },
              priority: { type: 'string' },
              verificationMethod: { type: 'string' }
            }
          }
        },
        regulatory: { type: 'array', items: { type: 'object' } },
        performance: {
          type: 'object',
          properties: {
            detectionRange: { type: 'object' },
            responseTime: { type: 'object' },
            accuracy: { type: 'object' }
          }
        },
        safetyRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'ADAS', 'requirements', 'regulatory']
}));

export const useCaseDevelopmentTask = defineTask('use-case-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Use Case Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ADAS Use Case Engineer',
      task: 'Develop comprehensive use cases for ADAS feature',
      context: {
        projectName: args.projectName,
        featureType: args.featureType,
        featureRequirements: args.featureRequirements,
        targetRatings: args.targetRatings
      },
      instructions: [
        '1. Define nominal use cases',
        '2. Define edge cases and corner cases',
        '3. Map Euro NCAP test scenarios',
        '4. Define false positive scenarios',
        '5. Define system limitations scenarios',
        '6. Create use case state diagrams',
        '7. Define expected system behavior',
        '8. Define driver interaction scenarios',
        '9. Create misuse cases',
        '10. Document use case acceptance criteria'
      ],
      outputFormat: 'JSON object with use cases'
    },
    outputSchema: {
      type: 'object',
      required: ['useCases', 'scenarios', 'acceptanceCriteria'],
      properties: {
        useCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              preconditions: { type: 'array', items: { type: 'string' } },
              mainFlow: { type: 'array', items: { type: 'string' } },
              alternativeFlows: { type: 'array', items: { type: 'object' } },
              postconditions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        scenarios: { type: 'array', items: { type: 'object' } },
        acceptanceCriteria: { type: 'array', items: { type: 'object' } },
        edgeCases: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'ADAS', 'use-cases', 'scenarios']
}));

export const algorithmDevelopmentTask = defineTask('algorithm-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Algorithm Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ADAS Algorithm Engineer',
      task: 'Develop ADAS feature algorithms and logic',
      context: {
        projectName: args.projectName,
        featureType: args.featureType,
        featureRequirements: args.featureRequirements,
        useCases: args.useCases
      },
      instructions: [
        '1. Design feature activation logic',
        '2. Develop threat assessment algorithms',
        '3. Implement time-to-collision (TTC) calculation',
        '4. Design warning cascade logic',
        '5. Implement intervention decision making',
        '6. Develop deceleration profile generation',
        '7. Implement driver override detection',
        '8. Design feature availability determination',
        '9. Implement diagnostics and fault handling',
        '10. Document algorithm specifications'
      ],
      outputFormat: 'JSON object with algorithm development'
    },
    outputSchema: {
      type: 'object',
      required: ['software', 'algorithms', 'logic'],
      properties: {
        software: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            modules: { type: 'array', items: { type: 'object' } },
            interfaces: { type: 'array', items: { type: 'object' } }
          }
        },
        algorithms: {
          type: 'object',
          properties: {
            threatAssessment: { type: 'object' },
            ttcCalculation: { type: 'object' },
            interventionDecision: { type: 'object' }
          }
        },
        logic: {
          type: 'object',
          properties: {
            activation: { type: 'object' },
            warningCascade: { type: 'object' },
            override: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'ADAS', 'algorithms', 'software']
}));

export const actuatorIntegrationTask = defineTask('actuator-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Actuator Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ADAS Integration Engineer',
      task: 'Integrate ADAS feature with vehicle actuators',
      context: {
        projectName: args.projectName,
        featureType: args.featureType,
        algorithmDevelopment: args.algorithmDevelopment
      },
      instructions: [
        '1. Design brake system interface (ESC/iBooster)',
        '2. Design steering interface (EPS/steer-by-wire)',
        '3. Define actuator request protocols',
        '4. Implement arbitration with other features',
        '5. Design actuator performance monitoring',
        '6. Implement actuator fault handling',
        '7. Define actuator response requirements',
        '8. Design safety mechanisms',
        '9. Implement actuator diagnostics',
        '10. Document integration specifications'
      ],
      outputFormat: 'JSON object with actuator integration'
    },
    outputSchema: {
      type: 'object',
      required: ['integration', 'interfaces', 'safety'],
      properties: {
        integration: {
          type: 'object',
          properties: {
            brakeSystem: { type: 'object' },
            steeringSystem: { type: 'object' },
            arbitration: { type: 'object' }
          }
        },
        interfaces: { type: 'array', items: { type: 'object' } },
        safety: {
          type: 'object',
          properties: {
            mechanisms: { type: 'array', items: { type: 'object' } },
            faultHandling: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'ADAS', 'integration', 'actuators']
}));

export const hmiDevelopmentTask = defineTask('hmi-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: HMI Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ADAS HMI Engineer',
      task: 'Develop human-machine interface for ADAS feature',
      context: {
        projectName: args.projectName,
        featureType: args.featureType,
        useCases: args.useCases,
        algorithmDevelopment: args.algorithmDevelopment
      },
      instructions: [
        '1. Design visual warnings (cluster, HUD)',
        '2. Design audible warnings',
        '3. Design haptic feedback',
        '4. Define warning escalation sequence',
        '5. Design feature status display',
        '6. Design settings and configuration interface',
        '7. Define driver acknowledgment interactions',
        '8. Design informational displays',
        '9. Validate against HMI guidelines',
        '10. Document HMI specifications'
      ],
      outputFormat: 'JSON object with HMI development'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'design', 'warnings'],
      properties: {
        documentation: {
          type: 'object',
          properties: {
            specifications: { type: 'object' },
            guidelines: { type: 'object' }
          }
        },
        design: {
          type: 'object',
          properties: {
            visual: { type: 'object' },
            audible: { type: 'object' },
            haptic: { type: 'object' },
            settings: { type: 'object' }
          }
        },
        warnings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              warningType: { type: 'string' },
              trigger: { type: 'string' },
              modality: { type: 'array', items: { type: 'string' } }
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
  labels: ['automotive', 'ADAS', 'HMI', 'user-interface']
}));

export const regulatoryTestingTask = defineTask('regulatory-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: NCAP and Regulatory Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ADAS Regulatory Test Engineer',
      task: 'Execute NCAP and regulatory compliance testing',
      context: {
        projectName: args.projectName,
        featureType: args.featureType,
        algorithmDevelopment: args.algorithmDevelopment,
        targetRatings: args.targetRatings,
        regulatoryRequirements: args.regulatoryRequirements
      },
      instructions: [
        '1. Execute Euro NCAP test protocols',
        '2. Execute regulatory type approval tests',
        '3. Document test results and evidence',
        '4. Calculate NCAP scores',
        '5. Identify performance gaps',
        '6. Execute false positive testing',
        '7. Test system degradation modes',
        '8. Document compliance status',
        '9. Identify compliance gaps',
        '10. Generate regulatory reports'
      ],
      outputFormat: 'JSON object with regulatory testing'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'ncapScore', 'complianceGaps'],
      properties: {
        reports: {
          type: 'object',
          properties: {
            ncap: { type: 'object' },
            regulatory: { type: 'array', items: { type: 'object' } }
          }
        },
        ncapScore: { type: 'number' },
        complianceGaps: { type: 'array', items: { type: 'object' } },
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testId: { type: 'string' },
              testName: { type: 'string' },
              result: { type: 'string' },
              score: { type: 'number' }
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
  labels: ['automotive', 'ADAS', 'NCAP', 'regulatory']
}));

export const featureValidationTask = defineTask('feature-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Feature Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ADAS Validation Engineer',
      task: 'Validate ADAS feature performance and safety',
      context: {
        projectName: args.projectName,
        featureType: args.featureType,
        algorithmDevelopment: args.algorithmDevelopment,
        hmiDevelopment: args.hmiDevelopment,
        regulatoryTesting: args.regulatoryTesting,
        useCases: args.useCases
      },
      instructions: [
        '1. Execute use case validation',
        '2. Validate real-world performance',
        '3. Validate across environmental conditions',
        '4. Execute customer acceptance testing',
        '5. Validate HMI effectiveness',
        '6. Execute long-duration testing',
        '7. Validate false positive rates',
        '8. Execute edge case testing',
        '9. Generate validation evidence',
        '10. Document validation results'
      ],
      outputFormat: 'JSON object with feature validation'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'validation', 'evidence'],
      properties: {
        reports: {
          type: 'object',
          properties: {
            useCaseValidation: { type: 'object' },
            realWorldPerformance: { type: 'object' },
            customerAcceptance: { type: 'object' }
          }
        },
        validation: {
          type: 'object',
          properties: {
            passRate: { type: 'number' },
            falsePositiveRate: { type: 'number' },
            coverage: { type: 'number' }
          }
        },
        evidence: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'ADAS', 'validation', 'testing']
}));

export const featureReleaseTask = defineTask('feature-release', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Release Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ADAS Release Engineer',
      task: 'Prepare ADAS feature release documentation',
      context: {
        projectName: args.projectName,
        featureType: args.featureType,
        featureRequirements: args.featureRequirements,
        useCases: args.useCases,
        algorithmDevelopment: args.algorithmDevelopment,
        actuatorIntegration: args.actuatorIntegration,
        hmiDevelopment: args.hmiDevelopment,
        regulatoryTesting: args.regulatoryTesting,
        featureValidation: args.featureValidation
      },
      instructions: [
        '1. Compile feature specifications',
        '2. Document software releases',
        '3. Compile test reports',
        '4. Document HMI specifications',
        '5. Create user documentation',
        '6. Document known limitations',
        '7. Create training materials',
        '8. Generate release notes',
        '9. Define next steps',
        '10. Archive development artifacts'
      ],
      outputFormat: 'JSON object with feature release'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications', 'summary', 'nextSteps'],
      properties: {
        specifications: {
          type: 'object',
          properties: {
            feature: { type: 'object' },
            software: { type: 'object' },
            hmi: { type: 'object' }
          }
        },
        summary: {
          type: 'object',
          properties: {
            featureType: { type: 'string' },
            ncapScore: { type: 'number' },
            validationStatus: { type: 'string' },
            limitations: { type: 'array', items: { type: 'string' } }
          }
        },
        nextSteps: { type: 'array', items: { type: 'object' } },
        releaseNotes: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'ADAS', 'release', 'documentation']
}));
