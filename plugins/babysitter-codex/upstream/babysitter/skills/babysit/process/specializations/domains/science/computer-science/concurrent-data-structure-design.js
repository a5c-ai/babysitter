/**
 * @process computer-science/concurrent-data-structure-design
 * @description Design lock-free or wait-free concurrent data structures with linearizability proofs
 * @inputs { dataStructureDescription: string, sequentialSpecification: object, progressGuarantee: string }
 * @outputs { success: boolean, concurrentDesign: object, linearizabilityProof: object, progressAnalysis: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dataStructureDescription,
    sequentialSpecification = {},
    progressGuarantee = 'lock-free',
    targetOperations = [],
    outputDir = 'concurrent-ds-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Concurrent Data Structure Design');

  // ============================================================================
  // PHASE 1: SEQUENTIAL SPECIFICATION DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining sequential specification');
  const sequentialSpec = await ctx.task(sequentialSpecificationTask, {
    dataStructureDescription,
    sequentialSpecification,
    targetOperations,
    outputDir
  });

  artifacts.push(...sequentialSpec.artifacts);

  // ============================================================================
  // PHASE 2: SYNCHRONIZATION STRATEGY SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Selecting synchronization strategy');
  const syncStrategySelection = await ctx.task(synchronizationStrategyTask, {
    dataStructureDescription,
    sequentialSpec,
    progressGuarantee,
    outputDir
  });

  artifacts.push(...syncStrategySelection.artifacts);

  // ============================================================================
  // PHASE 3: ATOMIC OPERATIONS AND MEMORY ORDERING DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing atomic operations and memory ordering');
  const atomicDesign = await ctx.task(atomicOperationsDesignTask, {
    dataStructureDescription,
    sequentialSpec,
    syncStrategySelection,
    outputDir
  });

  artifacts.push(...atomicDesign.artifacts);

  // ============================================================================
  // PHASE 4: CONCURRENT DATA STRUCTURE IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing concurrent data structure implementation');
  const concurrentImplementation = await ctx.task(concurrentImplementationTask, {
    dataStructureDescription,
    sequentialSpec,
    syncStrategySelection,
    atomicDesign,
    outputDir
  });

  artifacts.push(...concurrentImplementation.artifacts);

  // ============================================================================
  // PHASE 5: LINEARIZABILITY PROOF
  // ============================================================================

  ctx.log('info', 'Phase 5: Proving linearizability');
  const linearizabilityProof = await ctx.task(linearizabilityProofTask, {
    dataStructureDescription,
    sequentialSpec,
    concurrentImplementation,
    outputDir
  });

  artifacts.push(...linearizabilityProof.artifacts);

  // ============================================================================
  // PHASE 6: PROGRESS GUARANTEE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing progress guarantees');
  const progressAnalysis = await ctx.task(progressGuaranteeAnalysisTask, {
    dataStructureDescription,
    concurrentImplementation,
    progressGuarantee,
    outputDir
  });

  artifacts.push(...progressAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: PERFORMANCE BENCHMARKING DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing performance benchmarks under contention');
  const performanceBenchmarks = await ctx.task(performanceBenchmarksTask, {
    dataStructureDescription,
    concurrentImplementation,
    outputDir
  });

  artifacts.push(...performanceBenchmarks.artifacts);

  // ============================================================================
  // PHASE 8: CONCURRENT DS SPECIFICATION DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating concurrent data structure specification');
  const specificationDocument = await ctx.task(concurrentDSSpecificationTask, {
    dataStructureDescription,
    sequentialSpec,
    syncStrategySelection,
    atomicDesign,
    concurrentImplementation,
    linearizabilityProof,
    progressAnalysis,
    performanceBenchmarks,
    outputDir
  });

  artifacts.push(...specificationDocument.artifacts);

  // Breakpoint: Review concurrent data structure design
  await ctx.breakpoint({
    question: `Concurrent DS design complete. Linearizable: ${linearizabilityProof.isLinearizable}. Progress: ${progressAnalysis.achievedGuarantee}. Review design?`,
    title: 'Concurrent Data Structure Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        syncStrategy: syncStrategySelection.selectedStrategy,
        isLinearizable: linearizabilityProof.isLinearizable,
        progressGuarantee: progressAnalysis.achievedGuarantee,
        operations: concurrentImplementation.operations?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    dataStructureDescription,
    concurrentDesign: {
      synchronizationStrategy: syncStrategySelection.selectedStrategy,
      atomicOperations: atomicDesign.atomicOps,
      memoryOrdering: atomicDesign.memoryOrdering,
      implementation: concurrentImplementation.pseudocode,
      specificationDocumentPath: specificationDocument.documentPath
    },
    linearizabilityProof: {
      isLinearizable: linearizabilityProof.isLinearizable,
      linearizationPoints: linearizabilityProof.linearizationPoints,
      proofDocumentPath: linearizabilityProof.proofDocumentPath
    },
    progressAnalysis: {
      targetGuarantee: progressGuarantee,
      achievedGuarantee: progressAnalysis.achievedGuarantee,
      progressProof: progressAnalysis.progressProof
    },
    performanceBenchmarks: {
      benchmarkSuite: performanceBenchmarks.benchmarkSuite,
      contentionScenarios: performanceBenchmarks.contentionScenarios
    },
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/concurrent-data-structure-design',
      timestamp: startTime,
      progressGuarantee,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Sequential Specification
export const sequentialSpecificationTask = defineTask('sequential-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define sequential specification',
  agent: {
    name: 'concurrency-expert',
    skills: ['linearizability-checker', 'theorem-prover-interface', 'latex-proof-formatter'],
    prompt: {
      role: 'data structure specification specialist',
      task: 'Define the sequential specification of the data structure',
      context: args,
      instructions: [
        'Define abstract state of the data structure',
        'Specify all operations and their signatures',
        'Define preconditions and postconditions for each operation',
        'Specify return values',
        'Define exceptional behaviors',
        'Express specification formally',
        'Document sequential semantics',
        'Generate sequential specification document'
      ],
      outputFormat: 'JSON with specification, abstractState, operations, formalSpec, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['specification', 'abstractState', 'operations', 'artifacts'],
      properties: {
        specification: { type: 'string' },
        abstractState: { type: 'string' },
        operations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              signature: { type: 'string' },
              precondition: { type: 'string' },
              postcondition: { type: 'string' },
              returnValue: { type: 'string' }
            }
          }
        },
        formalSpec: { type: 'string' },
        exceptionalBehaviors: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'concurrent-ds', 'specification']
}));

// Task 2: Synchronization Strategy Selection
export const synchronizationStrategyTask = defineTask('synchronization-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select synchronization strategy',
  agent: {
    name: 'concurrency-expert',
    skills: ['linearizability-checker', 'memory-hierarchy-modeler', 'latex-proof-formatter'],
    prompt: {
      role: 'concurrent programming specialist',
      task: 'Select appropriate synchronization strategy (lock-free, wait-free, etc.)',
      context: args,
      instructions: [
        'Evaluate lock-free design feasibility',
        'Evaluate wait-free design feasibility',
        'Consider obstruction-free as alternative',
        'Analyze hardware primitives needed (CAS, LL/SC, FAA)',
        'Consider helping mechanisms for wait-freedom',
        'Assess complexity vs progress guarantee tradeoffs',
        'Document strategy selection rationale',
        'Generate synchronization strategy specification'
      ],
      outputFormat: 'JSON with selectedStrategy, rationale, hardwarePrimitives, helpingMechanism, tradeoffs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedStrategy', 'rationale', 'artifacts'],
      properties: {
        selectedStrategy: { type: 'string', enum: ['lock-free', 'wait-free', 'obstruction-free', 'lock-based'] },
        rationale: { type: 'string' },
        hardwarePrimitives: { type: 'array', items: { type: 'string' } },
        helpingMechanism: { type: 'string' },
        tradeoffs: { type: 'array', items: { type: 'string' } },
        alternatives: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'concurrent-ds', 'synchronization']
}));

// Task 3: Atomic Operations Design
export const atomicOperationsDesignTask = defineTask('atomic-operations-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design atomic operations and memory ordering',
  agent: {
    name: 'concurrency-expert',
    skills: ['linearizability-checker', 'memory-hierarchy-modeler', 'latex-proof-formatter'],
    prompt: {
      role: 'low-level concurrency specialist',
      task: 'Design atomic operations and specify memory ordering requirements',
      context: args,
      instructions: [
        'Identify all shared variables',
        'Specify atomic operations needed (load, store, CAS, FAA)',
        'Define memory ordering for each atomic operation',
        'Consider acquire-release vs sequential consistency',
        'Handle ABA problem if using CAS',
        'Design memory reclamation strategy if needed',
        'Document memory model assumptions',
        'Generate atomic operations specification'
      ],
      outputFormat: 'JSON with atomicOps, memoryOrdering, abaHandling, memoryReclamation, memoryModel, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['atomicOps', 'memoryOrdering', 'artifacts'],
      properties: {
        atomicOps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              operations: { type: 'array', items: { type: 'string' } },
              ordering: { type: 'string' }
            }
          }
        },
        memoryOrdering: { type: 'string' },
        orderingRationale: { type: 'string' },
        abaHandling: { type: 'string' },
        memoryReclamation: { type: 'string' },
        memoryModel: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'concurrent-ds', 'atomic-operations']
}));

// Task 4: Concurrent Implementation
export const concurrentImplementationTask = defineTask('concurrent-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design concurrent data structure implementation',
  agent: {
    name: 'concurrency-expert',
    skills: ['linearizability-checker', 'asymptotic-notation-calculator', 'latex-proof-formatter'],
    prompt: {
      role: 'concurrent data structure designer',
      task: 'Design the concurrent implementation of the data structure',
      context: args,
      instructions: [
        'Design concurrent version of each operation',
        'Implement retry loops for CAS failures',
        'Implement helping mechanism if wait-free',
        'Handle contention scenarios',
        'Consider backoff strategies',
        'Write detailed pseudocode for each operation',
        'Document all shared state',
        'Generate implementation specification'
      ],
      outputFormat: 'JSON with operations, pseudocode, sharedState, helpingCode, backoffStrategy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['operations', 'pseudocode', 'sharedState', 'artifacts'],
      properties: {
        operations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              pseudocode: { type: 'string' },
              retryLogic: { type: 'string' }
            }
          }
        },
        pseudocode: { type: 'string' },
        sharedState: { type: 'array', items: { type: 'string' } },
        helpingCode: { type: 'string' },
        backoffStrategy: { type: 'string' },
        invariants: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'concurrent-ds', 'implementation']
}));

// Task 5: Linearizability Proof
export const linearizabilityProofTask = defineTask('linearizability-proof', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prove linearizability',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['linearizability-checker', 'theorem-prover-interface', 'latex-proof-formatter'],
    prompt: {
      role: 'linearizability proof specialist',
      task: 'Prove that the concurrent implementation is linearizable',
      context: args,
      instructions: [
        'Identify linearization points for each operation',
        'Prove each operation appears atomic at its linearization point',
        'Show linearization respects sequential specification',
        'Handle cases where linearization point depends on execution',
        'Prove helping operations are correctly linearized',
        'Document complete linearizability argument',
        'Generate linearizability proof document'
      ],
      outputFormat: 'JSON with isLinearizable, linearizationPoints, proofStrategy, proofDetails, proofDocumentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isLinearizable', 'linearizationPoints', 'proofDocumentPath', 'artifacts'],
      properties: {
        isLinearizable: { type: 'boolean' },
        linearizationPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              operation: { type: 'string' },
              linearizationPoint: { type: 'string' },
              condition: { type: 'string' }
            }
          }
        },
        proofStrategy: { type: 'string' },
        proofDetails: { type: 'string' },
        helpingLinearization: { type: 'string' },
        proofDocumentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'concurrent-ds', 'linearizability']
}));

// Task 6: Progress Guarantee Analysis
export const progressGuaranteeAnalysisTask = defineTask('progress-guarantee-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze progress guarantees',
  agent: {
    name: 'concurrency-expert',
    skills: ['linearizability-checker', 'theorem-prover-interface', 'latex-proof-formatter'],
    prompt: {
      role: 'progress guarantee specialist',
      task: 'Analyze and prove progress guarantees of the concurrent data structure',
      context: args,
      instructions: [
        'Verify lock-freedom: some thread always makes progress',
        'Verify wait-freedom: every thread makes progress in bounded steps',
        'Identify potential livelock scenarios',
        'Analyze contention effects on progress',
        'Prove absence of deadlock',
        'Document progress proof',
        'Generate progress analysis document'
      ],
      outputFormat: 'JSON with achievedGuarantee, progressProof, livelockAnalysis, contentionEffects, proofDocumentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['achievedGuarantee', 'progressProof', 'artifacts'],
      properties: {
        achievedGuarantee: { type: 'string', enum: ['wait-free', 'lock-free', 'obstruction-free', 'blocking'] },
        progressProof: { type: 'string' },
        boundedSteps: { type: 'string' },
        livelockAnalysis: { type: 'string' },
        contentionEffects: { type: 'string' },
        worstCaseProgress: { type: 'string' },
        proofDocumentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'concurrent-ds', 'progress']
}));

// Task 7: Performance Benchmarks
export const performanceBenchmarksTask = defineTask('performance-benchmarks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design performance benchmarks under contention',
  agent: {
    name: 'systems-engineer',
    skills: ['cache-simulator', 'memory-hierarchy-modeler', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'concurrent performance specialist',
      task: 'Design benchmarks to measure performance under various contention levels',
      context: args,
      instructions: [
        'Design benchmarks for different thread counts',
        'Test various read/write ratios',
        'Design contention scenarios (low, medium, high)',
        'Include throughput measurements',
        'Include latency distribution measurements',
        'Compare with lock-based alternatives',
        'Plan scalability tests',
        'Generate benchmark specification'
      ],
      outputFormat: 'JSON with benchmarkSuite, contentionScenarios, metrics, methodology, comparisons, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['benchmarkSuite', 'contentionScenarios', 'artifacts'],
      properties: {
        benchmarkSuite: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              threadCounts: { type: 'array', items: { type: 'number' } },
              workload: { type: 'string' }
            }
          }
        },
        contentionScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        metrics: { type: 'array', items: { type: 'string' } },
        methodology: { type: 'string' },
        comparisons: { type: 'array', items: { type: 'string' } },
        scalabilityTests: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'concurrent-ds', 'benchmarks']
}));

// Task 8: Concurrent DS Specification Document
export const concurrentDSSpecificationTask = defineTask('concurrent-ds-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate concurrent data structure specification',
  agent: {
    name: 'concurrency-expert',
    skills: ['latex-proof-formatter', 'linearizability-checker'],
    prompt: {
      role: 'technical documentation specialist',
      task: 'Generate comprehensive concurrent data structure specification document',
      context: args,
      instructions: [
        'Create executive summary',
        'Document sequential specification',
        'Present synchronization strategy',
        'Detail atomic operations and memory ordering',
        'Include implementation pseudocode',
        'Present linearizability proof',
        'Document progress guarantee analysis',
        'Include benchmark design',
        'Format as professional specification'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, tableOfContents, keyProperties, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        tableOfContents: { type: 'array', items: { type: 'string' } },
        keyProperties: {
          type: 'object',
          properties: {
            linearizable: { type: 'boolean' },
            progressGuarantee: { type: 'string' },
            operations: { type: 'number' }
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
  labels: ['agent', 'concurrent-ds', 'documentation']
}));
