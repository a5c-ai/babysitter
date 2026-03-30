/**
 * @process computer-science/model-checking-verification
 * @description Apply model checking to verify system properties automatically using temporal logic specifications
 * @inputs { systemDescription: string, propertiesDescription: array, modelCheckerPreference: string }
 * @outputs { success: boolean, modelSpecification: object, verificationResults: object, counterexampleAnalysis: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemDescription,
    propertiesDescription = [],
    modelCheckerPreference = 'SPIN',
    outputDir = 'model-checking-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Model Checking Verification');

  // ============================================================================
  // PHASE 1: SYSTEM MODEL DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining system model in checker input language');
  const systemModelDefinition = await ctx.task(systemModelDefinitionTask, {
    systemDescription,
    modelCheckerPreference,
    outputDir
  });

  artifacts.push(...systemModelDefinition.artifacts);

  // ============================================================================
  // PHASE 2: PROPERTY SPECIFICATION IN TEMPORAL LOGIC
  // ============================================================================

  ctx.log('info', 'Phase 2: Specifying properties in temporal logic');
  const propertySpecification = await ctx.task(propertySpecificationTask, {
    systemDescription,
    propertiesDescription,
    systemModelDefinition,
    outputDir
  });

  artifacts.push(...propertySpecification.artifacts);

  // ============================================================================
  // PHASE 3: STATE SPACE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing state space for explosion handling');
  const stateSpaceAnalysis = await ctx.task(stateSpaceAnalysisTask, {
    systemDescription,
    systemModelDefinition,
    outputDir
  });

  artifacts.push(...stateSpaceAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: ABSTRACTION AND REDUCTION TECHNIQUES
  // ============================================================================

  ctx.log('info', 'Phase 4: Applying abstraction and symmetry reduction');
  const reductionTechniques = await ctx.task(reductionTechniquesTask, {
    systemModelDefinition,
    stateSpaceAnalysis,
    outputDir
  });

  artifacts.push(...reductionTechniques.artifacts);

  // ============================================================================
  // PHASE 5: VERIFICATION EXECUTION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 5: Planning verification execution');
  const verificationPlan = await ctx.task(verificationPlanTask, {
    systemModelDefinition,
    propertySpecification,
    stateSpaceAnalysis,
    reductionTechniques,
    modelCheckerPreference,
    outputDir
  });

  artifacts.push(...verificationPlan.artifacts);

  // ============================================================================
  // PHASE 6: COUNTEREXAMPLE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Planning counterexample analysis');
  const counterexampleAnalysis = await ctx.task(counterexampleAnalysisTask, {
    systemModelDefinition,
    propertySpecification,
    outputDir
  });

  artifacts.push(...counterexampleAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: MODEL REFINEMENT STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing model refinement strategy');
  const refinementStrategy = await ctx.task(modelRefinementStrategyTask, {
    systemModelDefinition,
    stateSpaceAnalysis,
    counterexampleAnalysis,
    outputDir
  });

  artifacts.push(...refinementStrategy.artifacts);

  // ============================================================================
  // PHASE 8: VERIFICATION RESULTS DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating verification results documentation');
  const verificationDocumentation = await ctx.task(verificationDocumentationTask, {
    systemDescription,
    systemModelDefinition,
    propertySpecification,
    stateSpaceAnalysis,
    reductionTechniques,
    verificationPlan,
    counterexampleAnalysis,
    refinementStrategy,
    outputDir
  });

  artifacts.push(...verificationDocumentation.artifacts);

  // Breakpoint: Review model checking verification
  await ctx.breakpoint({
    question: `Model checking setup complete. Properties: ${propertySpecification.properties?.length || 0}. State space: ${stateSpaceAnalysis.estimatedStates}. Review verification plan?`,
    title: 'Model Checking Verification Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        modelChecker: modelCheckerPreference,
        propertyCount: propertySpecification.properties?.length || 0,
        estimatedStates: stateSpaceAnalysis.estimatedStates,
        reductionTechniques: reductionTechniques.techniques?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemDescription,
    modelSpecification: {
      modelLanguage: systemModelDefinition.modelLanguage,
      modelFilePath: systemModelDefinition.modelFilePath,
      stateVariables: systemModelDefinition.stateVariables,
      transitions: systemModelDefinition.transitions
    },
    propertySpecification: {
      temporalLogic: propertySpecification.temporalLogic,
      properties: propertySpecification.properties
    },
    stateSpaceAnalysis: {
      estimatedStates: stateSpaceAnalysis.estimatedStates,
      reductionTechniques: reductionTechniques.techniques,
      reducedStateSpace: reductionTechniques.reducedEstimate
    },
    verificationPlan: {
      verificationCommands: verificationPlan.commands,
      expectedResources: verificationPlan.expectedResources
    },
    counterexampleAnalysis: {
      analysisApproach: counterexampleAnalysis.approach,
      spuriousHandling: counterexampleAnalysis.spuriousHandling
    },
    refinementStrategy: refinementStrategy.strategy,
    documentationPath: verificationDocumentation.documentPath,
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/model-checking-verification',
      timestamp: startTime,
      modelCheckerPreference,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: System Model Definition
export const systemModelDefinitionTask = defineTask('system-model-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define system model in checker input language',
  agent: {
    name: 'distributed-systems-architect',
    skills: ['tla-plus-model-checker', 'latex-proof-formatter', 'theorem-prover-interface'],
    prompt: {
      role: 'model checking specialist',
      task: 'Define the system model in the model checker input language',
      context: args,
      instructions: [
        'Choose appropriate model checker input language (Promela, SMV, TLA+)',
        'Define state variables representing system state',
        'Define initial state(s)',
        'Define transition relation (guarded commands, processes)',
        'Model concurrency appropriately',
        'Handle synchronization primitives',
        'Document model assumptions',
        'Generate model specification file'
      ],
      outputFormat: 'JSON with modelLanguage, modelFilePath, stateVariables, initialState, transitions, processes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['modelLanguage', 'stateVariables', 'transitions', 'artifacts'],
      properties: {
        modelLanguage: { type: 'string', enum: ['Promela', 'NuSMV', 'TLA+', 'Alloy', 'other'] },
        modelFilePath: { type: 'string' },
        stateVariables: { type: 'array', items: { type: 'string' } },
        initialState: { type: 'string' },
        transitions: { type: 'array', items: { type: 'string' } },
        processes: { type: 'array', items: { type: 'string' } },
        synchronization: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-checking', 'model-definition']
}));

// Task 2: Property Specification
export const propertySpecificationTask = defineTask('property-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify properties in temporal logic',
  agent: {
    name: 'distributed-systems-architect',
    skills: ['tla-plus-model-checker', 'theorem-prover-interface', 'latex-proof-formatter'],
    prompt: {
      role: 'temporal logic specification specialist',
      task: 'Specify properties in temporal logic (LTL, CTL)',
      context: args,
      instructions: [
        'Choose appropriate temporal logic (LTL vs CTL)',
        'Translate informal requirements to temporal logic',
        'Specify safety properties (e.g., G !bad)',
        'Specify liveness properties (e.g., G (request -> F grant))',
        'Specify fairness constraints if needed',
        'Document property meanings',
        'Generate property specification file'
      ],
      outputFormat: 'JSON with temporalLogic, properties, fairnessConstraints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['temporalLogic', 'properties', 'artifacts'],
      properties: {
        temporalLogic: { type: 'string', enum: ['LTL', 'CTL', 'CTL*', 'PCTL'] },
        properties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['safety', 'liveness', 'fairness', 'reachability'] },
              informalDescription: { type: 'string' },
              formula: { type: 'string' }
            }
          }
        },
        fairnessConstraints: { type: 'array', items: { type: 'string' } },
        propertyFilePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-checking', 'property-specification']
}));

// Task 3: State Space Analysis
export const stateSpaceAnalysisTask = defineTask('state-space-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze state space for explosion handling',
  agent: {
    name: 'distributed-systems-architect',
    skills: ['tla-plus-model-checker', 'asymptotic-notation-calculator', 'latex-proof-formatter'],
    prompt: {
      role: 'state space analysis specialist',
      task: 'Analyze state space size and identify explosion risks',
      context: args,
      instructions: [
        'Estimate state space size from model',
        'Identify sources of state space explosion',
        'Analyze variable domains and process counts',
        'Identify symmetries in the model',
        'Consider partial order reduction applicability',
        'Assess memory requirements',
        'Generate state space analysis report'
      ],
      outputFormat: 'JSON with estimatedStates, explosionSources, symmetries, porApplicable, memoryEstimate, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedStates', 'explosionSources', 'artifacts'],
      properties: {
        estimatedStates: { type: 'string' },
        explosionSources: { type: 'array', items: { type: 'string' } },
        variableDomains: { type: 'object' },
        symmetries: { type: 'array', items: { type: 'string' } },
        porApplicable: { type: 'boolean' },
        memoryEstimate: { type: 'string' },
        feasibility: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-checking', 'state-space']
}));

// Task 4: Reduction Techniques
export const reductionTechniquesTask = defineTask('reduction-techniques', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply abstraction and symmetry reduction',
  agent: {
    name: 'distributed-systems-architect',
    skills: ['tla-plus-model-checker', 'theorem-prover-interface', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'state space reduction specialist',
      task: 'Apply techniques to handle state space explosion',
      context: args,
      instructions: [
        'Design abstraction to reduce state space',
        'Apply symmetry reduction where possible',
        'Consider partial order reduction',
        'Apply cone of influence reduction',
        'Consider compositional verification',
        'Document soundness of reductions',
        'Estimate reduced state space',
        'Generate reduction strategy document'
      ],
      outputFormat: 'JSON with techniques, abstraction, symmetryReduction, partialOrderReduction, reducedEstimate, soundness, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['techniques', 'reducedEstimate', 'artifacts'],
      properties: {
        techniques: { type: 'array', items: { type: 'string' } },
        abstraction: {
          type: 'object',
          properties: {
            applied: { type: 'boolean' },
            description: { type: 'string' },
            soundness: { type: 'string' }
          }
        },
        symmetryReduction: {
          type: 'object',
          properties: {
            applied: { type: 'boolean' },
            symmetryGroup: { type: 'string' }
          }
        },
        partialOrderReduction: { type: 'boolean' },
        coneOfInfluence: { type: 'boolean' },
        reducedEstimate: { type: 'string' },
        soundness: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-checking', 'reduction']
}));

// Task 5: Verification Plan
export const verificationPlanTask = defineTask('verification-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan verification execution',
  agent: {
    name: 'distributed-systems-architect',
    skills: ['tla-plus-model-checker', 'latex-proof-formatter', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'verification planning specialist',
      task: 'Plan the model checking verification execution',
      context: args,
      instructions: [
        'Specify model checker commands/options',
        'Configure search strategy (DFS, BFS)',
        'Set memory and time limits',
        'Plan property verification order',
        'Configure counterexample generation',
        'Plan for incremental verification if large',
        'Document verification configuration',
        'Generate verification execution plan'
      ],
      outputFormat: 'JSON with commands, searchStrategy, resourceLimits, propertyOrder, counterexampleConfig, expectedResources, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['commands', 'expectedResources', 'artifacts'],
      properties: {
        commands: { type: 'array', items: { type: 'string' } },
        searchStrategy: { type: 'string' },
        resourceLimits: {
          type: 'object',
          properties: {
            memory: { type: 'string' },
            time: { type: 'string' }
          }
        },
        propertyOrder: { type: 'array', items: { type: 'string' } },
        counterexampleConfig: { type: 'string' },
        incrementalPlan: { type: 'string' },
        expectedResources: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-checking', 'verification-plan']
}));

// Task 6: Counterexample Analysis
export const counterexampleAnalysisTask = defineTask('counterexample-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan counterexample analysis',
  agent: {
    name: 'distributed-systems-architect',
    skills: ['tla-plus-model-checker', 'theorem-prover-interface', 'latex-proof-formatter'],
    prompt: {
      role: 'counterexample analysis specialist',
      task: 'Plan analysis approach for counterexamples from model checking',
      context: args,
      instructions: [
        'Define counterexample interpretation approach',
        'Plan visualization of counterexample traces',
        'Design spurious counterexample detection',
        'Plan abstraction refinement if using CEGAR',
        'Document how to trace back to original system',
        'Plan debugging approach for real violations',
        'Generate counterexample analysis plan'
      ],
      outputFormat: 'JSON with approach, visualization, spuriousHandling, cegarRefinement, tracebackMethod, debuggingApproach, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'spuriousHandling', 'artifacts'],
      properties: {
        approach: { type: 'string' },
        visualization: { type: 'string' },
        spuriousHandling: { type: 'string' },
        cegarRefinement: { type: 'string' },
        tracebackMethod: { type: 'string' },
        debuggingApproach: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-checking', 'counterexample']
}));

// Task 7: Model Refinement Strategy
export const modelRefinementStrategyTask = defineTask('model-refinement-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design model refinement strategy',
  agent: {
    name: 'distributed-systems-architect',
    skills: ['tla-plus-model-checker', 'theorem-prover-interface', 'latex-proof-formatter'],
    prompt: {
      role: 'model refinement specialist',
      task: 'Design strategy for refining model based on spurious counterexamples',
      context: args,
      instructions: [
        'Define refinement trigger criteria',
        'Design predicate abstraction refinement',
        'Plan interpolation-based refinement if applicable',
        'Define stopping criteria for refinement loop',
        'Document refinement procedure',
        'Generate refinement strategy document'
      ],
      outputFormat: 'JSON with strategy, refinementCriteria, predicateRefinement, interpolation, stoppingCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
        refinementCriteria: { type: 'array', items: { type: 'string' } },
        predicateRefinement: { type: 'string' },
        interpolation: { type: 'string' },
        stoppingCriteria: { type: 'array', items: { type: 'string' } },
        refinementLoop: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-checking', 'refinement']
}));

// Task 8: Verification Documentation
export const verificationDocumentationTask = defineTask('verification-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate verification results documentation',
  agent: {
    name: 'distributed-systems-architect',
    skills: ['latex-proof-formatter', 'tla-plus-model-checker'],
    prompt: {
      role: 'technical documentation specialist',
      task: 'Generate comprehensive model checking verification documentation',
      context: args,
      instructions: [
        'Create executive summary',
        'Document system model',
        'Present property specifications',
        'Detail state space analysis',
        'Document reduction techniques',
        'Present verification plan',
        'Include counterexample analysis approach',
        'Document refinement strategy',
        'Format as professional verification report'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, tableOfContents, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        tableOfContents: { type: 'array', items: { type: 'string' } },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-checking', 'documentation']
}));
