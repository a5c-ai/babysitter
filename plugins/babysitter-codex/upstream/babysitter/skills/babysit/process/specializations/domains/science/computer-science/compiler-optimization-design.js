/**
 * @process computer-science/compiler-optimization-design
 * @description Design and verify compiler optimization passes with correctness proofs and performance benchmarks
 * @inputs { optimizationDescription: string, sourceLanguage: object, targetLanguage: object }
 * @outputs { success: boolean, optimizationSpecification: object, correctnessProof: object, performanceBenchmarks: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    optimizationDescription,
    sourceLanguage = {},
    targetLanguage = {},
    irRepresentation = 'SSA',
    outputDir = 'compiler-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Compiler Optimization Design');

  // ============================================================================
  // PHASE 1: OPTIMIZATION TRANSFORMATION DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining optimization transformation');
  const transformationDefinition = await ctx.task(transformationDefinitionTask, {
    optimizationDescription,
    sourceLanguage,
    targetLanguage,
    irRepresentation,
    outputDir
  });

  artifacts.push(...transformationDefinition.artifacts);

  // ============================================================================
  // PHASE 2: CORRECTNESS CRITERIA SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Specifying correctness criteria');
  const correctnessCriteria = await ctx.task(correctnessCriteriaTask, {
    optimizationDescription,
    transformationDefinition,
    outputDir
  });

  artifacts.push(...correctnessCriteria.artifacts);

  // ============================================================================
  // PHASE 3: DATA-FLOW ANALYSIS DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing data-flow analysis');
  const dataFlowAnalysis = await ctx.task(dataFlowAnalysisTask, {
    optimizationDescription,
    transformationDefinition,
    irRepresentation,
    outputDir
  });

  artifacts.push(...dataFlowAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: SSA-BASED TRANSFORMATION IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing SSA-based transformation');
  const ssaTransformation = await ctx.task(ssaTransformationTask, {
    optimizationDescription,
    transformationDefinition,
    dataFlowAnalysis,
    irRepresentation,
    outputDir
  });

  artifacts.push(...ssaTransformation.artifacts);

  // ============================================================================
  // PHASE 5: CORRECTNESS PROOF
  // ============================================================================

  ctx.log('info', 'Phase 5: Proving optimization correctness');
  const correctnessProof = await ctx.task(correctnessProofTask, {
    optimizationDescription,
    transformationDefinition,
    correctnessCriteria,
    dataFlowAnalysis,
    ssaTransformation,
    outputDir
  });

  artifacts.push(...correctnessProof.artifacts);

  // ============================================================================
  // PHASE 6: PERFORMANCE IMPACT MEASUREMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Measuring performance impact');
  const performanceMeasurement = await ctx.task(performanceMeasurementTask, {
    optimizationDescription,
    transformationDefinition,
    outputDir
  });

  artifacts.push(...performanceMeasurement.artifacts);

  // ============================================================================
  // PHASE 7: COMPILER PIPELINE INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Planning compiler pipeline integration');
  const pipelineIntegration = await ctx.task(pipelineIntegrationTask, {
    optimizationDescription,
    transformationDefinition,
    dataFlowAnalysis,
    ssaTransformation,
    outputDir
  });

  artifacts.push(...pipelineIntegration.artifacts);

  // ============================================================================
  // PHASE 8: OPTIMIZATION SPECIFICATION DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating optimization specification document');
  const specificationDocument = await ctx.task(optimizationSpecificationTask, {
    optimizationDescription,
    transformationDefinition,
    correctnessCriteria,
    dataFlowAnalysis,
    ssaTransformation,
    correctnessProof,
    performanceMeasurement,
    pipelineIntegration,
    outputDir
  });

  artifacts.push(...specificationDocument.artifacts);

  // Breakpoint: Review compiler optimization design
  await ctx.breakpoint({
    question: `Compiler optimization design complete. Correct: ${correctnessProof.isCorrect}. Speedup: ${performanceMeasurement.expectedSpeedup}. Review specification?`,
    title: 'Compiler Optimization Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        optimizationType: transformationDefinition.optimizationType,
        isCorrect: correctnessProof.isCorrect,
        expectedSpeedup: performanceMeasurement.expectedSpeedup,
        pipelinePhase: pipelineIntegration.recommendedPhase
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    optimizationDescription,
    optimizationSpecification: {
      optimizationType: transformationDefinition.optimizationType,
      transformation: transformationDefinition.transformation,
      applicabilityConditions: transformationDefinition.applicabilityConditions,
      specificationDocumentPath: specificationDocument.documentPath
    },
    correctnessProof: {
      isCorrect: correctnessProof.isCorrect,
      semanticPreservation: correctnessProof.semanticPreservation,
      proofDocumentPath: correctnessProof.proofDocumentPath
    },
    dataFlowAnalysis: {
      analysisType: dataFlowAnalysis.analysisType,
      transferFunctions: dataFlowAnalysis.transferFunctions,
      lattice: dataFlowAnalysis.lattice
    },
    performanceBenchmarks: {
      expectedSpeedup: performanceMeasurement.expectedSpeedup,
      compilationOverhead: performanceMeasurement.compilationOverhead,
      benchmarkSuites: performanceMeasurement.benchmarkSuites
    },
    pipelineIntegration: {
      recommendedPhase: pipelineIntegration.recommendedPhase,
      dependencies: pipelineIntegration.dependencies,
      interactions: pipelineIntegration.interactions
    },
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/compiler-optimization-design',
      timestamp: startTime,
      irRepresentation,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Transformation Definition
export const transformationDefinitionTask = defineTask('transformation-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define optimization transformation',
  agent: {
    name: 'compiler-engineer',
    skills: ['dataflow-analysis-engine', 'grammar-parser-generator', 'latex-proof-formatter'],
    prompt: {
      role: 'compiler optimization specialist',
      task: 'Define the optimization transformation formally',
      context: args,
      instructions: [
        'Classify optimization type (local, global, interprocedural)',
        'Define source pattern to match',
        'Define target pattern after transformation',
        'Specify applicability conditions (when optimization is valid)',
        'Identify safety requirements',
        'Define transformation as rewrite rules',
        'Consider interaction with other optimizations',
        'Generate transformation specification'
      ],
      outputFormat: 'JSON with optimizationType, transformation, sourcePattern, targetPattern, applicabilityConditions, rewriteRules, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizationType', 'transformation', 'applicabilityConditions', 'artifacts'],
      properties: {
        optimizationType: { type: 'string', enum: ['local', 'global', 'interprocedural', 'loop', 'peephole'] },
        transformation: { type: 'string' },
        sourcePattern: { type: 'string' },
        targetPattern: { type: 'string' },
        applicabilityConditions: { type: 'array', items: { type: 'string' } },
        rewriteRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              replacement: { type: 'string' },
              condition: { type: 'string' }
            }
          }
        },
        safetyRequirements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'compiler-optimization', 'transformation']
}));

// Task 2: Correctness Criteria
export const correctnessCriteriaTask = defineTask('correctness-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify correctness criteria',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'dataflow-analysis-engine'],
    prompt: {
      role: 'compiler verification specialist',
      task: 'Specify correctness criteria for the optimization (semantic preservation)',
      context: args,
      instructions: [
        'Define semantic preservation requirement',
        'Specify observable behavior that must be preserved',
        'Consider memory effects, I/O, exceptions',
        'Define equivalence relation between source and target',
        'Identify any relaxations (e.g., floating-point reassociation)',
        'Consider undefined behavior implications',
        'Document correctness criteria formally',
        'Generate correctness criteria specification'
      ],
      outputFormat: 'JSON with semanticPreservation, observableBehavior, equivalenceRelation, relaxations, undefinedBehavior, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['semanticPreservation', 'observableBehavior', 'artifacts'],
      properties: {
        semanticPreservation: { type: 'string' },
        observableBehavior: { type: 'array', items: { type: 'string' } },
        equivalenceRelation: { type: 'string' },
        relaxations: { type: 'array', items: { type: 'string' } },
        undefinedBehavior: { type: 'string' },
        formalSpecification: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'compiler-optimization', 'correctness']
}));

// Task 3: Data-Flow Analysis Design
export const dataFlowAnalysisTask = defineTask('data-flow-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design data-flow analysis',
  agent: {
    name: 'compiler-engineer',
    skills: ['dataflow-analysis-engine', 'asymptotic-notation-calculator', 'latex-proof-formatter'],
    prompt: {
      role: 'data-flow analysis specialist',
      task: 'Design data-flow analysis required for the optimization',
      context: args,
      instructions: [
        'Identify required data-flow information',
        'Define analysis direction (forward/backward)',
        'Define lattice for analysis values',
        'Define transfer functions for each instruction type',
        'Define meet/join operation',
        'Ensure analysis is monotonic for convergence',
        'Consider precision vs efficiency tradeoffs',
        'Generate data-flow analysis specification'
      ],
      outputFormat: 'JSON with analysisType, direction, lattice, transferFunctions, meetOperation, convergence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysisType', 'direction', 'lattice', 'transferFunctions', 'artifacts'],
      properties: {
        analysisType: { type: 'string' },
        direction: { type: 'string', enum: ['forward', 'backward', 'bidirectional'] },
        lattice: {
          type: 'object',
          properties: {
            elements: { type: 'string' },
            top: { type: 'string' },
            bottom: { type: 'string' },
            ordering: { type: 'string' }
          }
        },
        transferFunctions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              instructionType: { type: 'string' },
              function: { type: 'string' }
            }
          }
        },
        meetOperation: { type: 'string' },
        convergence: { type: 'string' },
        complexity: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'compiler-optimization', 'data-flow']
}));

// Task 4: SSA Transformation
export const ssaTransformationTask = defineTask('ssa-transformation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement SSA-based transformation',
  agent: {
    name: 'compiler-engineer',
    skills: ['dataflow-analysis-engine', 'grammar-parser-generator', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'SSA optimization specialist',
      task: 'Design SSA-based implementation of the optimization',
      context: args,
      instructions: [
        'Leverage SSA properties (single assignment, def-use chains)',
        'Design algorithm using SSA data structures',
        'Handle phi nodes appropriately',
        'Consider dominance information usage',
        'Design incremental SSA update if needed',
        'Specify algorithm pseudocode',
        'Analyze algorithm complexity',
        'Generate SSA transformation specification'
      ],
      outputFormat: 'JSON with ssaAlgorithm, phiHandling, dominanceUsage, pseudocode, complexity, incrementalUpdate, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ssaAlgorithm', 'pseudocode', 'complexity', 'artifacts'],
      properties: {
        ssaAlgorithm: { type: 'string' },
        ssaProperties: { type: 'array', items: { type: 'string' } },
        phiHandling: { type: 'string' },
        dominanceUsage: { type: 'boolean' },
        pseudocode: { type: 'string' },
        complexity: { type: 'string' },
        incrementalUpdate: { type: 'string' },
        dataStructures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'compiler-optimization', 'ssa']
}));

// Task 5: Correctness Proof
export const correctnessProofTask = defineTask('correctness-proof', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prove optimization correctness',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'latex-proof-formatter', 'dataflow-analysis-engine'],
    prompt: {
      role: 'compiler verification specialist',
      task: 'Prove that the optimization preserves program semantics',
      context: args,
      instructions: [
        'State correctness theorem formally',
        'Prove semantic preservation for each transformation rule',
        'Use simulation/bisimulation arguments if applicable',
        'Prove data-flow analysis soundness',
        'Handle all cases in transformation',
        'Identify any assumptions required',
        'Document complete correctness proof',
        'Generate proof document'
      ],
      outputFormat: 'JSON with isCorrect, semanticPreservation, proofStrategy, proofSteps, assumptions, proofDocumentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isCorrect', 'semanticPreservation', 'proofDocumentPath', 'artifacts'],
      properties: {
        isCorrect: { type: 'boolean' },
        semanticPreservation: { type: 'string' },
        proofStrategy: { type: 'string' },
        proofSteps: { type: 'array', items: { type: 'string' } },
        analysisSound: { type: 'boolean' },
        assumptions: { type: 'array', items: { type: 'string' } },
        proofDocumentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'compiler-optimization', 'proof']
}));

// Task 6: Performance Measurement
export const performanceMeasurementTask = defineTask('performance-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Measure performance impact',
  agent: {
    name: 'systems-engineer',
    skills: ['cache-simulator', 'memory-hierarchy-modeler', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'compiler performance specialist',
      task: 'Design performance evaluation methodology for the optimization',
      context: args,
      instructions: [
        'Define expected performance improvement metrics',
        'Identify representative benchmark suites',
        'Design compilation time measurement methodology',
        'Define runtime improvement measurement',
        'Consider code size impact',
        'Plan statistical analysis of results',
        'Identify potential performance regressions',
        'Generate performance evaluation plan'
      ],
      outputFormat: 'JSON with expectedSpeedup, compilationOverhead, benchmarkSuites, metrics, methodology, regressionRisks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['expectedSpeedup', 'benchmarkSuites', 'metrics', 'artifacts'],
      properties: {
        expectedSpeedup: { type: 'string' },
        compilationOverhead: { type: 'string' },
        benchmarkSuites: { type: 'array', items: { type: 'string' } },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              measurement: { type: 'string' }
            }
          }
        },
        methodology: { type: 'string' },
        codeSizeImpact: { type: 'string' },
        regressionRisks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'compiler-optimization', 'performance']
}));

// Task 7: Pipeline Integration
export const pipelineIntegrationTask = defineTask('pipeline-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan compiler pipeline integration',
  agent: {
    name: 'compiler-engineer',
    skills: ['dataflow-analysis-engine', 'grammar-parser-generator', 'latex-proof-formatter'],
    prompt: {
      role: 'compiler infrastructure specialist',
      task: 'Plan integration of optimization into compiler pipeline',
      context: args,
      instructions: [
        'Determine optimal pipeline phase for optimization',
        'Identify prerequisite analyses/transformations',
        'Identify optimizations that should run before/after',
        'Consider pass ordering constraints',
        'Plan for iterative application if beneficial',
        'Design pass manager integration',
        'Consider debug info preservation',
        'Generate pipeline integration plan'
      ],
      outputFormat: 'JSON with recommendedPhase, dependencies, interactions, passOrdering, iteration, debugInfo, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedPhase', 'dependencies', 'artifacts'],
      properties: {
        recommendedPhase: { type: 'string', enum: ['early', 'middle', 'late', 'link-time'] },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pass: { type: 'string' },
              relationship: { type: 'string', enum: ['requires', 'benefits-from', 'invalidates'] }
            }
          }
        },
        interactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optimization: { type: 'string' },
              interaction: { type: 'string' }
            }
          }
        },
        passOrdering: { type: 'array', items: { type: 'string' } },
        iteration: {
          type: 'object',
          properties: {
            beneficial: { type: 'boolean' },
            maxIterations: { type: 'number' }
          }
        },
        debugInfoPreservation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'compiler-optimization', 'pipeline']
}));

// Task 8: Optimization Specification Document
export const optimizationSpecificationTask = defineTask('optimization-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate optimization specification document',
  agent: {
    name: 'compiler-engineer',
    skills: ['latex-proof-formatter', 'dataflow-analysis-engine'],
    prompt: {
      role: 'technical documentation specialist',
      task: 'Generate comprehensive compiler optimization specification document',
      context: args,
      instructions: [
        'Create executive summary of optimization',
        'Document transformation rules formally',
        'Include data-flow analysis specification',
        'Present SSA-based algorithm',
        'Include correctness proof outline',
        'Document performance expectations',
        'Include pipeline integration plan',
        'Format as professional compiler specification'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, tableOfContents, keyResults, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        tableOfContents: { type: 'array', items: { type: 'string' } },
        keyResults: {
          type: 'object',
          properties: {
            correct: { type: 'boolean' },
            expectedSpeedup: { type: 'string' },
            complexity: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'compiler-optimization', 'documentation']
}));
