/**
 * @process specializations/domains/science/automotive-engineering/functional-safety-iso26262
 * @description Functional Safety Development (ISO 26262) - Execute functional safety lifecycle per ISO 26262
 * including hazard analysis, safety concept development, hardware/software safety design, and safety validation.
 * @inputs { itemName: string, itemDescription: string, safetyScope?: string, existingHara?: object }
 * @outputs { success: boolean, safetyCase: object, hara: object, safetyConcepts: object, validationReports: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/functional-safety-iso26262', {
 *   itemName: 'Steering-System-EPS',
 *   itemDescription: 'Electric Power Steering system with lane keeping assist interface',
 *   safetyScope: 'ASIL-D',
 *   existingHara: null
 * });
 *
 * @references
 * - ISO 26262:2018 Road Vehicles - Functional Safety
 * - ISO 26262-3 Concept Phase
 * - ISO 26262-4 Product Development: System Level
 * - ISO 26262-5 Product Development: Hardware Level
 * - ISO 26262-6 Product Development: Software Level
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    itemName,
    itemDescription,
    safetyScope = 'full-lifecycle',
    existingHara = null
  } = inputs;

  // Phase 1: Item Definition
  const itemDefinition = await ctx.task(itemDefinitionTask, {
    itemName,
    itemDescription,
    safetyScope
  });

  // Quality Gate: Item definition completeness
  if (!itemDefinition.definition || !itemDefinition.boundaries) {
    return {
      success: false,
      error: 'Item definition incomplete',
      phase: 'item-definition',
      safetyCase: null
    };
  }

  // Phase 2: Hazard Analysis and Risk Assessment (HARA)
  const hara = await ctx.task(haraTask, {
    itemName,
    itemDefinition,
    existingHara
  });

  // Breakpoint: HARA review
  await ctx.breakpoint({
    question: `Review HARA for ${itemName}. ${hara.safetyGoals?.length || 0} safety goals identified. Approve HARA?`,
    title: 'HARA Review',
    context: {
      runId: ctx.runId,
      itemName,
      hara,
      files: [{
        path: `artifacts/hara.json`,
        format: 'json',
        content: hara
      }]
    }
  });

  // Phase 3: Functional Safety Concept
  const functionalSafetyConcept = await ctx.task(functionalSafetyConceptTask, {
    itemName,
    itemDefinition,
    hara
  });

  // Phase 4: Technical Safety Concept
  const technicalSafetyConcept = await ctx.task(technicalSafetyConceptTask, {
    itemName,
    functionalSafetyConcept,
    hara
  });

  // Breakpoint: Safety concepts review
  await ctx.breakpoint({
    question: `Review safety concepts for ${itemName}. Functional and technical safety concepts complete. Approve safety architecture?`,
    title: 'Safety Concepts Review',
    context: {
      runId: ctx.runId,
      itemName,
      functionalSafetyConcept,
      technicalSafetyConcept,
      files: [{
        path: `artifacts/safety-concepts.json`,
        format: 'json',
        content: { functional: functionalSafetyConcept, technical: technicalSafetyConcept }
      }]
    }
  });

  // Phase 5: Hardware Safety Design
  const hardwareSafetyDesign = await ctx.task(hardwareSafetyDesignTask, {
    itemName,
    technicalSafetyConcept,
    hara
  });

  // Phase 6: Software Safety Design
  const softwareSafetyDesign = await ctx.task(softwareSafetyDesignTask, {
    itemName,
    technicalSafetyConcept,
    hara
  });

  // Phase 7: Safety Validation
  const safetyValidation = await ctx.task(safetyValidationTask, {
    itemName,
    hara,
    functionalSafetyConcept,
    technicalSafetyConcept,
    hardwareSafetyDesign,
    softwareSafetyDesign
  });

  // Quality Gate: Safety validation results
  if (safetyValidation.openIssues && safetyValidation.openIssues.length > 0) {
    await ctx.breakpoint({
      question: `Safety validation identified ${safetyValidation.openIssues.length} open issues. Review and approve closure plan?`,
      title: 'Safety Validation Issues',
      context: {
        runId: ctx.runId,
        safetyValidation,
        recommendation: 'All safety-related issues must be closed before production'
      }
    });
  }

  // Phase 8: Safety Case and Assessment
  const safetyCase = await ctx.task(safetyCaseTask, {
    itemName,
    itemDefinition,
    hara,
    functionalSafetyConcept,
    technicalSafetyConcept,
    hardwareSafetyDesign,
    softwareSafetyDesign,
    safetyValidation
  });

  // Final Breakpoint: Safety case approval
  await ctx.breakpoint({
    question: `Functional Safety Development complete for ${itemName}. Safety case compiled. Approve for functional safety assessment?`,
    title: 'Safety Case Approval',
    context: {
      runId: ctx.runId,
      itemName,
      safetyCaseSummary: safetyCase.summary,
      files: [
        { path: `artifacts/safety-case.json`, format: 'json', content: safetyCase },
        { path: `artifacts/hara-final.json`, format: 'json', content: hara }
      ]
    }
  });

  return {
    success: true,
    itemName,
    safetyCase: safetyCase.document,
    hara: hara.analysis,
    safetyConcepts: {
      functional: functionalSafetyConcept.concept,
      technical: technicalSafetyConcept.concept
    },
    validationReports: safetyValidation.reports,
    asilAllocation: hara.asilAllocation,
    nextSteps: safetyCase.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/functional-safety-iso26262',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const itemDefinitionTask = defineTask('item-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Item Definition - ${args.itemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Functional Safety Engineer',
      task: 'Develop comprehensive item definition per ISO 26262-3',
      context: {
        itemName: args.itemName,
        itemDescription: args.itemDescription,
        safetyScope: args.safetyScope
      },
      instructions: [
        '1. Define item functionality and purpose',
        '2. Identify item boundaries and interfaces',
        '3. Document operational situations and modes',
        '4. Identify potential hazards (preliminary)',
        '5. Define environmental conditions',
        '6. Document assumptions',
        '7. Identify relevant standards and regulations',
        '8. Define safety lifecycle scope',
        '9. Establish configuration management',
        '10. Document item definition rationale'
      ],
      outputFormat: 'JSON object with item definition'
    },
    outputSchema: {
      type: 'object',
      required: ['definition', 'boundaries', 'operationalModes'],
      properties: {
        definition: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            functionality: { type: 'array', items: { type: 'string' } },
            purpose: { type: 'string' }
          }
        },
        boundaries: {
          type: 'object',
          properties: {
            scope: { type: 'array', items: { type: 'string' } },
            interfaces: { type: 'array', items: { type: 'object' } },
            exclusions: { type: 'array', items: { type: 'string' } }
          }
        },
        operationalModes: { type: 'array', items: { type: 'object' } },
        environmentalConditions: { type: 'object' },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'functional-safety', 'ISO26262', 'item-definition']
}));

export const haraTask = defineTask('hara', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Hazard Analysis and Risk Assessment - ${args.itemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Functional Safety Analyst',
      task: 'Conduct HARA per ISO 26262-3',
      context: {
        itemName: args.itemName,
        itemDefinition: args.itemDefinition,
        existingHara: args.existingHara
      },
      instructions: [
        '1. Identify malfunctioning behaviors',
        '2. Identify hazardous events',
        '3. Assess severity (S0-S3)',
        '4. Assess exposure (E0-E4)',
        '5. Assess controllability (C0-C3)',
        '6. Determine ASIL for each hazardous event',
        '7. Formulate safety goals',
        '8. Allocate safe states',
        '9. Define fault tolerant time intervals',
        '10. Document HARA rationale'
      ],
      outputFormat: 'JSON object with HARA results'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'safetyGoals', 'asilAllocation'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            malfunctions: { type: 'array', items: { type: 'object' } },
            hazardousEvents: { type: 'array', items: { type: 'object' } }
          }
        },
        safetyGoals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              asil: { type: 'string' },
              safeState: { type: 'string' },
              ftti: { type: 'string' }
            }
          }
        },
        asilAllocation: {
          type: 'object',
          properties: {
            highest: { type: 'string' },
            distribution: { type: 'object' }
          }
        },
        rationale: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'functional-safety', 'ISO26262', 'HARA']
}));

export const functionalSafetyConceptTask = defineTask('functional-safety-concept', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Functional Safety Concept - ${args.itemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Functional Safety Architect',
      task: 'Develop functional safety concept per ISO 26262-3',
      context: {
        itemName: args.itemName,
        itemDefinition: args.itemDefinition,
        hara: args.hara
      },
      instructions: [
        '1. Derive functional safety requirements from safety goals',
        '2. Define preliminary system architecture',
        '3. Allocate safety requirements to elements',
        '4. Define safety mechanisms at functional level',
        '5. Specify fault detection mechanisms',
        '6. Define warning and degradation concepts',
        '7. Specify driver interaction requirements',
        '8. Define safe state transition',
        '9. Establish verification criteria',
        '10. Document concept rationale'
      ],
      outputFormat: 'JSON object with functional safety concept'
    },
    outputSchema: {
      type: 'object',
      required: ['concept', 'requirements', 'allocation'],
      properties: {
        concept: {
          type: 'object',
          properties: {
            architecture: { type: 'object' },
            safetyMechanisms: { type: 'array', items: { type: 'object' } },
            warningConcept: { type: 'object' },
            degradationConcept: { type: 'object' }
          }
        },
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              derivedFrom: { type: 'string' },
              asil: { type: 'string' }
            }
          }
        },
        allocation: { type: 'array', items: { type: 'object' } },
        verificationCriteria: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'functional-safety', 'ISO26262', 'safety-concept']
}));

export const technicalSafetyConceptTask = defineTask('technical-safety-concept', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Technical Safety Concept - ${args.itemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Safety Engineer',
      task: 'Develop technical safety concept per ISO 26262-4',
      context: {
        itemName: args.itemName,
        functionalSafetyConcept: args.functionalSafetyConcept,
        hara: args.hara
      },
      instructions: [
        '1. Define system architecture with safety elements',
        '2. Derive technical safety requirements',
        '3. Allocate requirements to HW and SW',
        '4. Define hardware safety mechanisms',
        '5. Define software safety mechanisms',
        '6. Specify diagnostic coverage requirements',
        '7. Define independence requirements (FFI)',
        '8. Specify random hardware failure metrics',
        '9. Define systematic failure avoidance',
        '10. Document technical concept rationale'
      ],
      outputFormat: 'JSON object with technical safety concept'
    },
    outputSchema: {
      type: 'object',
      required: ['concept', 'requirements', 'allocation'],
      properties: {
        concept: {
          type: 'object',
          properties: {
            systemArchitecture: { type: 'object' },
            hwSafetyMechanisms: { type: 'array', items: { type: 'object' } },
            swSafetyMechanisms: { type: 'array', items: { type: 'object' } },
            ffiRequirements: { type: 'object' }
          }
        },
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['HW', 'SW', 'system'] },
              description: { type: 'string' },
              asil: { type: 'string' }
            }
          }
        },
        allocation: { type: 'object' },
        hardwareMetrics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'functional-safety', 'ISO26262', 'technical-concept']
}));

export const hardwareSafetyDesignTask = defineTask('hardware-safety-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Hardware Safety Design - ${args.itemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Hardware Safety Engineer',
      task: 'Develop hardware safety design per ISO 26262-5',
      context: {
        itemName: args.itemName,
        technicalSafetyConcept: args.technicalSafetyConcept,
        hara: args.hara
      },
      instructions: [
        '1. Specify hardware safety requirements',
        '2. Design hardware architecture with safety mechanisms',
        '3. Perform FMEDA (Failure Mode Effects Diagnostic Analysis)',
        '4. Perform DFA (Dependent Failure Analysis)',
        '5. Calculate SPFM (Single Point Fault Metric)',
        '6. Calculate LFM (Latent Fault Metric)',
        '7. Calculate PMHF (Probabilistic Metric for Hardware Failure)',
        '8. Specify hardware qualification requirements',
        '9. Define hardware verification plan',
        '10. Document hardware design rationale'
      ],
      outputFormat: 'JSON object with hardware safety design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'fmeda', 'metrics'],
      properties: {
        design: {
          type: 'object',
          properties: {
            architecture: { type: 'object' },
            safetyMechanisms: { type: 'array', items: { type: 'object' } },
            qualification: { type: 'object' }
          }
        },
        fmeda: { type: 'array', items: { type: 'object' } },
        metrics: {
          type: 'object',
          properties: {
            spfm: { type: 'number' },
            lfm: { type: 'number' },
            pmhf: { type: 'number' }
          }
        },
        dfa: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'functional-safety', 'ISO26262', 'hardware']
}));

export const softwareSafetyDesignTask = defineTask('software-safety-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Software Safety Design - ${args.itemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software Safety Engineer',
      task: 'Develop software safety design per ISO 26262-6',
      context: {
        itemName: args.itemName,
        technicalSafetyConcept: args.technicalSafetyConcept,
        hara: args.hara
      },
      instructions: [
        '1. Specify software safety requirements',
        '2. Design software architecture with safety mechanisms',
        '3. Define software unit design',
        '4. Specify software verification methods per ASIL',
        '5. Define MISRA-C compliance requirements',
        '6. Specify static analysis requirements',
        '7. Define unit test coverage requirements',
        '8. Specify integration test requirements',
        '9. Define software qualification requirements',
        '10. Document software design rationale'
      ],
      outputFormat: 'JSON object with software safety design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'requirements', 'verification'],
      properties: {
        design: {
          type: 'object',
          properties: {
            architecture: { type: 'object' },
            safetyMechanisms: { type: 'array', items: { type: 'object' } },
            diagnostics: { type: 'array', items: { type: 'object' } }
          }
        },
        requirements: { type: 'array', items: { type: 'object' } },
        verification: {
          type: 'object',
          properties: {
            methods: { type: 'array', items: { type: 'object' } },
            coverageRequirements: { type: 'object' },
            misraCompliance: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'functional-safety', 'ISO26262', 'software']
}));

export const safetyValidationTask = defineTask('safety-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Safety Validation - ${args.itemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Safety Validation Engineer',
      task: 'Execute safety validation per ISO 26262-4',
      context: {
        itemName: args.itemName,
        hara: args.hara,
        functionalSafetyConcept: args.functionalSafetyConcept,
        technicalSafetyConcept: args.technicalSafetyConcept,
        hardwareSafetyDesign: args.hardwareSafetyDesign,
        softwareSafetyDesign: args.softwareSafetyDesign
      },
      instructions: [
        '1. Develop safety validation plan',
        '2. Execute safety requirements verification',
        '3. Execute safety mechanisms testing',
        '4. Execute fault injection testing',
        '5. Validate safety goals achievement',
        '6. Execute integration testing',
        '7. Validate safe state transitions',
        '8. Document validation evidence',
        '9. Track open safety issues',
        '10. Generate validation reports'
      ],
      outputFormat: 'JSON object with safety validation'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'evidence', 'openIssues'],
      properties: {
        reports: {
          type: 'object',
          properties: {
            validationPlan: { type: 'object' },
            requirementsVerification: { type: 'object' },
            faultInjectionResults: { type: 'object' }
          }
        },
        evidence: { type: 'array', items: { type: 'object' } },
        openIssues: { type: 'array', items: { type: 'object' } },
        safetyGoalStatus: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'functional-safety', 'ISO26262', 'validation']
}));

export const safetyCaseTask = defineTask('safety-case', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Safety Case and Assessment - ${args.itemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Safety Case Engineer',
      task: 'Compile safety case for functional safety assessment',
      context: {
        itemName: args.itemName,
        itemDefinition: args.itemDefinition,
        hara: args.hara,
        functionalSafetyConcept: args.functionalSafetyConcept,
        technicalSafetyConcept: args.technicalSafetyConcept,
        hardwareSafetyDesign: args.hardwareSafetyDesign,
        softwareSafetyDesign: args.softwareSafetyDesign,
        safetyValidation: args.safetyValidation
      },
      instructions: [
        '1. Compile safety case structure',
        '2. Document safety argument',
        '3. Compile work product references',
        '4. Document assumptions and dependencies',
        '5. Compile evidence of compliance',
        '6. Document residual risks',
        '7. Prepare for functional safety assessment',
        '8. Identify gaps for assessment',
        '9. Create executive summary',
        '10. Define next steps'
      ],
      outputFormat: 'JSON object with safety case'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'summary', 'nextSteps'],
      properties: {
        document: {
          type: 'object',
          properties: {
            safetyArgument: { type: 'object' },
            workProducts: { type: 'array', items: { type: 'object' } },
            evidence: { type: 'array', items: { type: 'object' } },
            residualRisks: { type: 'array', items: { type: 'object' } }
          }
        },
        summary: {
          type: 'object',
          properties: {
            asilLevel: { type: 'string' },
            safetyGoalsCount: { type: 'number' },
            validationStatus: { type: 'string' },
            openIssues: { type: 'number' }
          }
        },
        nextSteps: { type: 'array', items: { type: 'object' } },
        assessmentReadiness: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'functional-safety', 'ISO26262', 'safety-case']
}));
