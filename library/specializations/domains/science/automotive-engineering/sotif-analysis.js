/**
 * @process specializations/domains/science/automotive-engineering/sotif-analysis
 * @description SOTIF Analysis and Validation (ISO 21448) - Analyze and validate Safety of the Intended
 * Functionality for systems where hazards arise from functional insufficiencies or misuse rather than faults.
 * @inputs { systemName: string, systemDescription: string, functionalities: string[], knownLimitations?: string[] }
 * @outputs { success: boolean, sotifAnalysis: object, scenarioCatalog: object, mitigationDocumentation: object, validationEvidence: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/sotif-analysis', {
 *   systemName: 'AEB-Pedestrian-Detection',
 *   systemDescription: 'Automated Emergency Braking with pedestrian detection',
 *   functionalities: ['pedestrian-detection', 'collision-avoidance', 'emergency-braking'],
 *   knownLimitations: ['low-visibility', 'partial-occlusion']
 * });
 *
 * @references
 * - ISO 21448:2022 Road Vehicles - SOTIF
 * - ISO/PAS 21448:2019 Safety of the Intended Functionality
 * - UN ECE R152 AEB
 * - Euro NCAP Assessment Protocol
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName,
    systemDescription,
    functionalities = [],
    knownLimitations = []
  } = inputs;

  // Phase 1: Specification and Design Analysis
  const specificationAnalysis = await ctx.task(specificationAnalysisTask, {
    systemName,
    systemDescription,
    functionalities
  });

  // Quality Gate: Specification analysis complete
  if (!specificationAnalysis.analysis) {
    return {
      success: false,
      error: 'Specification analysis incomplete',
      phase: 'specification-analysis',
      sotifAnalysis: null
    };
  }

  // Phase 2: Known Unsafe Scenario Identification
  const knownUnsafeScenarios = await ctx.task(knownUnsafeScenariosTask, {
    systemName,
    specificationAnalysis,
    knownLimitations
  });

  // Breakpoint: Known scenarios review
  await ctx.breakpoint({
    question: `Review known unsafe scenarios for ${systemName}. ${knownUnsafeScenarios.scenarios?.length || 0} scenarios identified. Approve scenario list?`,
    title: 'Known Unsafe Scenarios Review',
    context: {
      runId: ctx.runId,
      systemName,
      knownUnsafeScenarios,
      files: [{
        path: `artifacts/known-unsafe-scenarios.json`,
        format: 'json',
        content: knownUnsafeScenarios
      }]
    }
  });

  // Phase 3: Unknown Unsafe Scenario Identification
  const unknownUnsafeScenarios = await ctx.task(unknownUnsafeScenariosTask, {
    systemName,
    specificationAnalysis,
    knownUnsafeScenarios
  });

  // Phase 4: Triggering Conditions Analysis
  const triggeringConditions = await ctx.task(triggeringConditionsTask, {
    systemName,
    knownUnsafeScenarios,
    unknownUnsafeScenarios,
    functionalities
  });

  // Phase 5: Functional Insufficiency Analysis
  const functionalInsufficiency = await ctx.task(functionalInsufficiencyTask, {
    systemName,
    triggeringConditions,
    specificationAnalysis,
    knownLimitations
  });

  // Phase 6: Mitigation Strategy Development
  const mitigationStrategies = await ctx.task(mitigationStrategiesTask, {
    systemName,
    knownUnsafeScenarios,
    unknownUnsafeScenarios,
    triggeringConditions,
    functionalInsufficiency
  });

  // Breakpoint: Mitigation review
  await ctx.breakpoint({
    question: `Review mitigation strategies for ${systemName}. ${mitigationStrategies.strategies?.length || 0} strategies developed. Approve mitigations?`,
    title: 'Mitigation Strategies Review',
    context: {
      runId: ctx.runId,
      systemName,
      mitigationStrategies,
      files: [{
        path: `artifacts/mitigation-strategies.json`,
        format: 'json',
        content: mitigationStrategies
      }]
    }
  });

  // Phase 7: Validation Strategy
  const validationStrategy = await ctx.task(validationStrategyTask, {
    systemName,
    knownUnsafeScenarios,
    unknownUnsafeScenarios,
    mitigationStrategies
  });

  // Phase 8: SOTIF Argument Documentation
  const sotifArgument = await ctx.task(sotifArgumentTask, {
    systemName,
    specificationAnalysis,
    knownUnsafeScenarios,
    unknownUnsafeScenarios,
    triggeringConditions,
    functionalInsufficiency,
    mitigationStrategies,
    validationStrategy
  });

  // Final Breakpoint: SOTIF approval
  await ctx.breakpoint({
    question: `SOTIF Analysis complete for ${systemName}. Residual risk acceptable: ${sotifArgument.residualRiskAcceptable}. Approve SOTIF argument?`,
    title: 'SOTIF Argument Approval',
    context: {
      runId: ctx.runId,
      systemName,
      sotifSummary: sotifArgument.summary,
      files: [
        { path: `artifacts/sotif-analysis.json`, format: 'json', content: sotifArgument },
        { path: `artifacts/scenario-catalog.json`, format: 'json', content: { known: knownUnsafeScenarios, unknown: unknownUnsafeScenarios } }
      ]
    }
  });

  return {
    success: true,
    systemName,
    sotifAnalysis: sotifArgument.analysis,
    scenarioCatalog: {
      knownUnsafe: knownUnsafeScenarios.scenarios,
      unknownUnsafe: unknownUnsafeScenarios.scenarios,
      triggeringConditions: triggeringConditions.conditions
    },
    mitigationDocumentation: mitigationStrategies.documentation,
    validationEvidence: validationStrategy.evidence,
    residualRisk: sotifArgument.residualRisk,
    nextSteps: sotifArgument.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/sotif-analysis',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const specificationAnalysisTask = defineTask('specification-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Specification and Design Analysis - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SOTIF Analysis Engineer',
      task: 'Analyze system specification for SOTIF-relevant aspects',
      context: {
        systemName: args.systemName,
        systemDescription: args.systemDescription,
        functionalities: args.functionalities
      },
      instructions: [
        '1. Define system intended functionality',
        '2. Identify functional performance limits',
        '3. Analyze sensor dependencies',
        '4. Identify algorithm limitations',
        '5. Document operational design domain',
        '6. Identify foreseeable misuse scenarios',
        '7. Analyze human-machine interface',
        '8. Document system assumptions',
        '9. Identify potential performance variability',
        '10. Document analysis rationale'
      ],
      outputFormat: 'JSON object with specification analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'functionality', 'limitations'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            intendedFunctionality: { type: 'string' },
            performanceLimits: { type: 'array', items: { type: 'object' } },
            sensorDependencies: { type: 'array', items: { type: 'object' } },
            algorithmLimitations: { type: 'array', items: { type: 'object' } }
          }
        },
        functionality: { type: 'array', items: { type: 'object' } },
        limitations: { type: 'array', items: { type: 'object' } },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'SOTIF', 'ISO21448', 'analysis']
}));

export const knownUnsafeScenariosTask = defineTask('known-unsafe-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Known Unsafe Scenario Identification - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scenario Analysis Engineer',
      task: 'Identify known unsafe scenarios (Area 2 in SOTIF)',
      context: {
        systemName: args.systemName,
        specificationAnalysis: args.specificationAnalysis,
        knownLimitations: args.knownLimitations
      },
      instructions: [
        '1. Identify scenarios with known limitations',
        '2. Map sensor limitations to scenarios',
        '3. Identify algorithm failure scenarios',
        '4. Document environmental condition scenarios',
        '5. Identify foreseeable misuse scenarios',
        '6. Classify scenarios by severity',
        '7. Document scenario triggering conditions',
        '8. Assess scenario frequency',
        '9. Identify existing mitigations',
        '10. Prioritize scenarios for mitigation'
      ],
      outputFormat: 'JSON object with known unsafe scenarios'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'classification', 'priorities'],
      properties: {
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              triggeringConditions: { type: 'array', items: { type: 'string' } },
              hazardousBehavior: { type: 'string' },
              severity: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        classification: { type: 'object' },
        priorities: { type: 'array', items: { type: 'object' } },
        existingMitigations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'SOTIF', 'scenarios', 'hazard-analysis']
}));

export const unknownUnsafeScenariosTask = defineTask('unknown-unsafe-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Unknown Unsafe Scenario Identification - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Exploratory Scenario Engineer',
      task: 'Identify unknown unsafe scenarios (Area 3 in SOTIF)',
      context: {
        systemName: args.systemName,
        specificationAnalysis: args.specificationAnalysis,
        knownUnsafeScenarios: args.knownUnsafeScenarios
      },
      instructions: [
        '1. Apply exploratory analysis methods',
        '2. Identify potential unknown triggering conditions',
        '3. Analyze edge cases and corner cases',
        '4. Consider rare environmental conditions',
        '5. Identify combination scenarios',
        '6. Apply failure mode analysis',
        '7. Consider adversarial scenarios',
        '8. Identify perception challenges',
        '9. Document scenario discovery methods',
        '10. Establish scenario completeness argument'
      ],
      outputFormat: 'JSON object with unknown unsafe scenarios'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'discoveryMethods', 'completenessArgument'],
      properties: {
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              potentialTriggers: { type: 'array', items: { type: 'string' } },
              severity: { type: 'string' },
              estimatedLikelihood: { type: 'string' }
            }
          }
        },
        discoveryMethods: { type: 'array', items: { type: 'object' } },
        completenessArgument: { type: 'object' },
        residualUncertainty: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'SOTIF', 'scenarios', 'exploration']
}));

export const triggeringConditionsTask = defineTask('triggering-conditions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Triggering Conditions Analysis - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Triggering Conditions Analyst',
      task: 'Analyze triggering conditions for hazardous behaviors',
      context: {
        systemName: args.systemName,
        knownUnsafeScenarios: args.knownUnsafeScenarios,
        unknownUnsafeScenarios: args.unknownUnsafeScenarios,
        functionalities: args.functionalities
      },
      instructions: [
        '1. Catalog all triggering conditions',
        '2. Classify conditions by source (sensor, algorithm, environment)',
        '3. Analyze condition combinations',
        '4. Identify condition detection methods',
        '5. Assess condition occurrence probability',
        '6. Map conditions to hazardous behaviors',
        '7. Identify condition monitoring approaches',
        '8. Document condition boundaries',
        '9. Analyze condition variability',
        '10. Prioritize conditions for mitigation'
      ],
      outputFormat: 'JSON object with triggering conditions'
    },
    outputSchema: {
      type: 'object',
      required: ['conditions', 'classification', 'mapping'],
      properties: {
        conditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              source: { type: 'string' },
              detectionMethod: { type: 'string' },
              probability: { type: 'string' }
            }
          }
        },
        classification: { type: 'object' },
        mapping: { type: 'array', items: { type: 'object' } },
        combinations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'SOTIF', 'triggering-conditions', 'analysis']
}));

export const functionalInsufficiencyTask = defineTask('functional-insufficiency', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Functional Insufficiency Analysis - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Functional Insufficiency Analyst',
      task: 'Analyze functional insufficiencies leading to hazards',
      context: {
        systemName: args.systemName,
        triggeringConditions: args.triggeringConditions,
        specificationAnalysis: args.specificationAnalysis,
        knownLimitations: args.knownLimitations
      },
      instructions: [
        '1. Identify specification insufficiencies',
        '2. Identify performance limitation insufficiencies',
        '3. Analyze sensor insufficiencies',
        '4. Analyze algorithm insufficiencies',
        '5. Identify HMI insufficiencies',
        '6. Document insufficiency root causes',
        '7. Assess insufficiency impact',
        '8. Map insufficiencies to hazards',
        '9. Identify improvement opportunities',
        '10. Prioritize insufficiencies for resolution'
      ],
      outputFormat: 'JSON object with functional insufficiency analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['insufficiencies', 'rootCauses', 'improvements'],
      properties: {
        insufficiencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              rootCause: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        rootCauses: { type: 'array', items: { type: 'object' } },
        improvements: { type: 'array', items: { type: 'object' } },
        hazardMapping: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'SOTIF', 'functional-insufficiency', 'analysis']
}));

export const mitigationStrategiesTask = defineTask('mitigation-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Mitigation Strategy Development - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SOTIF Mitigation Engineer',
      task: 'Develop mitigation strategies for SOTIF-related hazards',
      context: {
        systemName: args.systemName,
        knownUnsafeScenarios: args.knownUnsafeScenarios,
        unknownUnsafeScenarios: args.unknownUnsafeScenarios,
        triggeringConditions: args.triggeringConditions,
        functionalInsufficiency: args.functionalInsufficiency
      },
      instructions: [
        '1. Develop prevention strategies',
        '2. Develop detection strategies',
        '3. Develop mitigation strategies',
        '4. Develop safe state strategies',
        '5. Design driver warning systems',
        '6. Design operational design domain restrictions',
        '7. Design graceful degradation',
        '8. Assess mitigation effectiveness',
        '9. Document residual risk',
        '10. Prioritize mitigation implementation'
      ],
      outputFormat: 'JSON object with mitigation strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'documentation', 'residualRisk'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['prevention', 'detection', 'mitigation', 'safe-state'] },
              description: { type: 'string' },
              targetScenarios: { type: 'array', items: { type: 'string' } },
              effectiveness: { type: 'string' }
            }
          }
        },
        documentation: { type: 'object' },
        residualRisk: { type: 'array', items: { type: 'object' } },
        implementation: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'SOTIF', 'mitigation', 'strategies']
}));

export const validationStrategyTask = defineTask('validation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Validation Strategy - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SOTIF Validation Engineer',
      task: 'Develop SOTIF validation strategy',
      context: {
        systemName: args.systemName,
        knownUnsafeScenarios: args.knownUnsafeScenarios,
        unknownUnsafeScenarios: args.unknownUnsafeScenarios,
        mitigationStrategies: args.mitigationStrategies
      },
      instructions: [
        '1. Define validation objectives',
        '2. Design validation methods (simulation, track, public road)',
        '3. Define test scenario matrix',
        '4. Define acceptance criteria',
        '5. Plan for unknown scenario discovery',
        '6. Define statistical significance requirements',
        '7. Plan edge case validation',
        '8. Define mitigation effectiveness validation',
        '9. Establish validation evidence requirements',
        '10. Document validation completeness argument'
      ],
      outputFormat: 'JSON object with validation strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'evidence', 'completenessArgument'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            objectives: { type: 'array', items: { type: 'string' } },
            methods: { type: 'array', items: { type: 'object' } },
            scenarioMatrix: { type: 'object' },
            acceptanceCriteria: { type: 'array', items: { type: 'object' } }
          }
        },
        evidence: { type: 'array', items: { type: 'object' } },
        completenessArgument: { type: 'object' },
        statisticalRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'SOTIF', 'validation', 'strategy']
}));

export const sotifArgumentTask = defineTask('sotif-argument', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: SOTIF Argument Documentation - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SOTIF Documentation Engineer',
      task: 'Document SOTIF argument and residual risk acceptance',
      context: {
        systemName: args.systemName,
        specificationAnalysis: args.specificationAnalysis,
        knownUnsafeScenarios: args.knownUnsafeScenarios,
        unknownUnsafeScenarios: args.unknownUnsafeScenarios,
        triggeringConditions: args.triggeringConditions,
        functionalInsufficiency: args.functionalInsufficiency,
        mitigationStrategies: args.mitigationStrategies,
        validationStrategy: args.validationStrategy
      },
      instructions: [
        '1. Compile SOTIF analysis summary',
        '2. Document safety argument structure',
        '3. Compile scenario catalog',
        '4. Document mitigation effectiveness evidence',
        '5. Document residual risk assessment',
        '6. Argue for acceptable residual risk',
        '7. Document validation evidence',
        '8. Identify remaining uncertainties',
        '9. Define operational constraints',
        '10. Document next steps and monitoring'
      ],
      outputFormat: 'JSON object with SOTIF argument'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'residualRisk', 'residualRiskAcceptable', 'summary'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            argumentStructure: { type: 'object' },
            scenarioCatalog: { type: 'object' },
            mitigationEvidence: { type: 'object' },
            validationEvidence: { type: 'object' }
          }
        },
        residualRisk: {
          type: 'object',
          properties: {
            assessment: { type: 'object' },
            acceptability: { type: 'object' },
            constraints: { type: 'array', items: { type: 'string' } }
          }
        },
        residualRiskAcceptable: { type: 'boolean' },
        summary: { type: 'object' },
        nextSteps: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'SOTIF', 'documentation', 'argument']
}));
