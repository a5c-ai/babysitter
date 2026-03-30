/**
 * @process specializations/domains/science/mathematics/matrix-computation-optimization
 * @description Optimize matrix computations by selecting appropriate decompositions, exploiting structure
 * (sparsity, symmetry), and leveraging high-performance libraries (BLAS, LAPACK).
 * @inputs { matrixDescription: string, computationGoal: string, matrixProperties?: object, performanceRequirements?: object }
 * @outputs { success: boolean, decompositionRecommendation: object, structureExploitation: object, libraryRecommendations: array, benchmarkResults: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/matrix-computation-optimization', {
 *   matrixDescription: 'Sparse symmetric positive definite matrix from FEM discretization',
 *   computationGoal: 'Solve linear system Ax = b repeatedly with different b',
 *   matrixProperties: { size: '100000x100000', sparsity: 0.001, symmetric: true, positiveDef: true },
 *   performanceRequirements: { maxTime: '1s per solve', precision: 'double' }
 * });
 *
 * @references
 * - Golub & Van Loan, Matrix Computations
 * - BLAS Standard: https://www.netlib.org/blas/
 * - LAPACK: https://www.netlib.org/lapack/
 * - Intel MKL: https://software.intel.com/mkl
 * - SuiteSparse: https://people.engr.tamu.edu/davis/suitesparse.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    matrixDescription,
    computationGoal,
    matrixProperties = {},
    performanceRequirements = {}
  } = inputs;

  // Phase 1: Analyze Matrix Structure and Properties
  const structureAnalysis = await ctx.task(structureAnalysisTask, {
    matrixDescription,
    matrixProperties,
    computationGoal
  });

  // Quality Gate: Matrix properties must be analyzable
  if (!structureAnalysis.properties) {
    return {
      success: false,
      error: 'Unable to analyze matrix structure',
      phase: 'structure-analysis',
      decompositionRecommendation: null
    };
  }

  // Breakpoint: Review structure analysis
  await ctx.breakpoint({
    question: `Matrix structure analysis complete. Key properties: ${structureAnalysis.keyProperties.join(', ')}. Review?`,
    title: 'Structure Analysis Review',
    context: {
      runId: ctx.runId,
      matrixDescription,
      properties: structureAnalysis.properties,
      files: [{
        path: `artifacts/phase1-structure-analysis.json`,
        format: 'json',
        content: structureAnalysis
      }]
    }
  });

  // Phase 2: Select Optimal Decomposition Method
  const decompositionSelection = await ctx.task(decompositionSelectionTask, {
    matrixDescription,
    structureAnalysis,
    computationGoal,
    performanceRequirements
  });

  // Phase 3: Recommend Sparse vs Dense Algorithms
  const algorithmRecommendation = await ctx.task(algorithmRecommendationTask, {
    structureAnalysis,
    decompositionSelection,
    computationGoal,
    performanceRequirements
  });

  // Phase 4: Interface with HPC Libraries
  const librarySelection = await ctx.task(librarySelectionTask, {
    structureAnalysis,
    decompositionSelection,
    algorithmRecommendation,
    performanceRequirements
  });

  // Phase 5: Benchmark Performance
  const benchmarkAnalysis = await ctx.task(benchmarkAnalysisTask, {
    matrixDescription,
    structureAnalysis,
    decompositionSelection,
    algorithmRecommendation,
    librarySelection,
    performanceRequirements
  });

  // Final Breakpoint: Optimization Complete
  await ctx.breakpoint({
    question: `Matrix computation optimization complete. Expected speedup: ${benchmarkAnalysis.expectedSpeedup}. Review recommendations?`,
    title: 'Optimization Complete',
    context: {
      runId: ctx.runId,
      matrixDescription,
      recommendedDecomposition: decompositionSelection.primaryRecommendation,
      recommendedLibrary: librarySelection.primaryRecommendation,
      expectedPerformance: benchmarkAnalysis.expectedPerformance,
      files: [
        { path: `artifacts/optimization-recommendations.json`, format: 'json', content: { decompositionSelection, algorithmRecommendation, librarySelection } }
      ]
    }
  });

  return {
    success: true,
    matrixDescription,
    computationGoal,
    structureAnalysis: {
      properties: structureAnalysis.properties,
      keyProperties: structureAnalysis.keyProperties,
      exploitableStructure: structureAnalysis.exploitableStructure
    },
    decompositionRecommendation: {
      primary: decompositionSelection.primaryRecommendation,
      alternatives: decompositionSelection.alternatives,
      rationale: decompositionSelection.rationale
    },
    structureExploitation: {
      sparsityExploitation: algorithmRecommendation.sparsityStrategy,
      symmetryExploitation: algorithmRecommendation.symmetryStrategy,
      bandStructure: algorithmRecommendation.bandStrategy
    },
    libraryRecommendations: librarySelection.recommendations,
    benchmarkResults: {
      expectedPerformance: benchmarkAnalysis.expectedPerformance,
      expectedSpeedup: benchmarkAnalysis.expectedSpeedup,
      memoryEstimate: benchmarkAnalysis.memoryEstimate
    },
    implementationGuidance: benchmarkAnalysis.implementationGuidance,
    metadata: {
      processId: 'specializations/domains/science/mathematics/matrix-computation-optimization',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const structureAnalysisTask = defineTask('structure-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Analyze Matrix Structure and Properties`,
  agent: {
    name: 'numerical-analyst',
    skills: ['numerical-linear-algebra-toolkit', 'sympy-computer-algebra', 'benchmark-suite-manager'],
    prompt: {
      role: 'Numerical Linear Algebra Expert',
      task: 'Analyze matrix structure and identify exploitable properties',
      context: {
        matrixDescription: args.matrixDescription,
        matrixProperties: args.matrixProperties,
        computationGoal: args.computationGoal
      },
      instructions: [
        '1. Determine matrix dimensions and basic properties',
        '2. Analyze sparsity pattern and density',
        '3. Check for symmetry/Hermitian structure',
        '4. Check for positive definiteness/semi-definiteness',
        '5. Identify band structure and bandwidth',
        '6. Check for block structure',
        '7. Analyze eigenvalue distribution if relevant',
        '8. Check condition number characteristics',
        '9. Identify any special structure (Toeplitz, circulant, etc.)',
        '10. Document properties relevant to computation goal'
      ],
      outputFormat: 'JSON object with matrix structure analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['properties', 'keyProperties', 'exploitableStructure'],
      properties: {
        properties: {
          type: 'object',
          properties: {
            size: { type: 'string' },
            dataType: { type: 'string' },
            symmetric: { type: 'boolean' },
            hermitian: { type: 'boolean' },
            positiveDef: { type: 'boolean' },
            sparse: { type: 'boolean' },
            sparsity: { type: 'number' },
            bandwidth: { type: 'object' },
            condition: { type: 'string' }
          }
        },
        keyProperties: { type: 'array', items: { type: 'string' } },
        exploitableStructure: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              structure: { type: 'string' },
              benefit: { type: 'string' },
              applicableAlgorithms: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        specialStructures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              applicable: { type: 'boolean' },
              speedup: { type: 'string' }
            }
          }
        },
        memoryFootprint: {
          type: 'object',
          properties: {
            dense: { type: 'string' },
            sparse: { type: 'string' },
            recommended: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'matrix-computation', 'structure-analysis']
}));

export const decompositionSelectionTask = defineTask('decomposition-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Select Optimal Decomposition Method`,
  agent: {
    name: 'numerical-analyst',
    skills: ['numerical-linear-algebra-toolkit', 'floating-point-analysis', 'benchmark-suite-manager'],
    prompt: {
      role: 'Matrix Decomposition Expert',
      task: 'Select optimal matrix decomposition for the computation goal',
      context: {
        matrixDescription: args.matrixDescription,
        structureAnalysis: args.structureAnalysis,
        computationGoal: args.computationGoal,
        performanceRequirements: args.performanceRequirements
      },
      instructions: [
        '1. Identify decompositions suitable for the computation goal',
        '2. Consider LU, Cholesky, QR, SVD, eigendecomposition',
        '3. Evaluate decomposition cost vs solve cost tradeoff',
        '4. Consider numerical stability requirements',
        '5. Account for matrix structure in decomposition choice',
        '6. Evaluate incremental/updating decomposition needs',
        '7. Consider rank-revealing decompositions if needed',
        '8. Assess decomposition storage requirements',
        '9. Compare complexity for each candidate',
        '10. Provide ranked recommendations with rationale'
      ],
      outputFormat: 'JSON object with decomposition recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryRecommendation', 'alternatives', 'rationale'],
      properties: {
        primaryRecommendation: { type: 'string' },
        rationale: { type: 'string' },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decomposition: { type: 'string' },
              suitability: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
              complexity: { type: 'string' },
              stability: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        decompositionCost: {
          type: 'object',
          properties: {
            flops: { type: 'string' },
            memory: { type: 'string' },
            stability: { type: 'string' }
          }
        },
        solveCost: { type: 'string' },
        updateCapability: { type: 'string' },
        pivotingStrategy: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'matrix-computation', 'decomposition']
}));

export const algorithmRecommendationTask = defineTask('algorithm-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Recommend Sparse vs Dense Algorithms`,
  agent: {
    name: 'numerical-analyst',
    skills: ['numerical-linear-algebra-toolkit', 'benchmark-suite-manager', 'floating-point-analysis'],
    prompt: {
      role: 'Sparse Matrix Algorithm Specialist',
      task: 'Recommend optimal algorithms exploiting matrix structure',
      context: {
        structureAnalysis: args.structureAnalysis,
        decompositionSelection: args.decompositionSelection,
        computationGoal: args.computationGoal,
        performanceRequirements: args.performanceRequirements
      },
      instructions: [
        '1. Decide between sparse and dense algorithm families',
        '2. Select sparse storage format (CSR, CSC, COO, etc.)',
        '3. Recommend fill-reducing ordering for sparse factorization',
        '4. Select appropriate iterative methods if applicable',
        '5. Recommend preconditioners for iterative methods',
        '6. Exploit symmetry in storage and computation',
        '7. Exploit band structure if present',
        '8. Consider blocked algorithms for cache efficiency',
        '9. Recommend parallel algorithm variants',
        '10. Provide algorithm complexity comparison'
      ],
      outputFormat: 'JSON object with algorithm recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['sparsityStrategy', 'algorithmChoice'],
      properties: {
        algorithmChoice: { type: 'string', enum: ['dense-direct', 'sparse-direct', 'iterative', 'hybrid'] },
        sparsityStrategy: {
          type: 'object',
          properties: {
            storageFormat: { type: 'string' },
            fillOrdering: { type: 'string' },
            estimatedFillIn: { type: 'string' }
          }
        },
        symmetryStrategy: {
          type: 'object',
          properties: {
            exploitSymmetry: { type: 'boolean' },
            storageReduction: { type: 'string' },
            computeReduction: { type: 'string' }
          }
        },
        bandStrategy: {
          type: 'object',
          properties: {
            exploitBand: { type: 'boolean' },
            bandedAlgorithm: { type: 'string' }
          }
        },
        iterativeOptions: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            preconditioner: { type: 'string' },
            convergenceCriteria: { type: 'string' }
          }
        },
        blockingStrategy: {
          type: 'object',
          properties: {
            blockSize: { type: 'number' },
            rationale: { type: 'string' }
          }
        },
        parallelStrategy: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            expectedScaling: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'matrix-computation', 'algorithm-selection']
}));

export const librarySelectionTask = defineTask('library-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Interface with HPC Libraries`,
  agent: {
    name: 'numerical-analyst',
    skills: ['benchmark-suite-manager', 'numerical-linear-algebra-toolkit', 'floating-point-analysis'],
    prompt: {
      role: 'High-Performance Computing Library Expert',
      task: 'Recommend HPC libraries for matrix computations',
      context: {
        structureAnalysis: args.structureAnalysis,
        decompositionSelection: args.decompositionSelection,
        algorithmRecommendation: args.algorithmRecommendation,
        performanceRequirements: args.performanceRequirements
      },
      instructions: [
        '1. Recommend BLAS level (1, 2, 3) routines needed',
        '2. Recommend specific LAPACK routines',
        '3. Consider vendor-optimized libraries (MKL, ACML, cuBLAS)',
        '4. Recommend sparse libraries (SuiteSparse, PETSc, etc.)',
        '5. Consider GPU acceleration libraries',
        '6. Recommend language bindings (C, Fortran, Python, etc.)',
        '7. Provide specific function/routine names',
        '8. Consider memory alignment requirements',
        '9. Recommend batch processing if applicable',
        '10. Provide integration code templates'
      ],
      outputFormat: 'JSON object with library recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryRecommendation', 'recommendations'],
      properties: {
        primaryRecommendation: { type: 'string' },
        blasRoutines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              routine: { type: 'string' },
              level: { type: 'number' },
              purpose: { type: 'string' }
            }
          }
        },
        lapackRoutines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              routine: { type: 'string' },
              purpose: { type: 'string' },
              variants: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              library: { type: 'string' },
              type: { type: 'string' },
              platform: { type: 'string' },
              license: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              installation: { type: 'string' }
            }
          }
        },
        gpuOptions: {
          type: 'object',
          properties: {
            applicable: { type: 'boolean' },
            library: { type: 'string' },
            expectedSpeedup: { type: 'string' }
          }
        },
        codeTemplate: { type: 'string' },
        memoryAlignment: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'matrix-computation', 'hpc-libraries']
}));

export const benchmarkAnalysisTask = defineTask('benchmark-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Benchmark Performance`,
  agent: {
    name: 'numerical-analyst',
    skills: ['benchmark-suite-manager', 'numerical-linear-algebra-toolkit', 'floating-point-analysis'],
    prompt: {
      role: 'Performance Benchmarking Specialist',
      task: 'Analyze expected performance and provide benchmarking guidance',
      context: {
        matrixDescription: args.matrixDescription,
        structureAnalysis: args.structureAnalysis,
        decompositionSelection: args.decompositionSelection,
        algorithmRecommendation: args.algorithmRecommendation,
        librarySelection: args.librarySelection,
        performanceRequirements: args.performanceRequirements
      },
      instructions: [
        '1. Estimate FLOP counts for recommended approach',
        '2. Estimate memory bandwidth requirements',
        '3. Predict expected runtime on typical hardware',
        '4. Compare with naive/baseline approach',
        '5. Estimate expected speedup from optimizations',
        '6. Identify performance bottlenecks',
        '7. Recommend benchmarking methodology',
        '8. Provide performance tuning guidelines',
        '9. Document scaling characteristics',
        '10. Provide implementation best practices'
      ],
      outputFormat: 'JSON object with benchmark analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['expectedPerformance', 'expectedSpeedup'],
      properties: {
        expectedPerformance: {
          type: 'object',
          properties: {
            flops: { type: 'string' },
            memoryBandwidth: { type: 'string' },
            estimatedTime: { type: 'string' }
          }
        },
        expectedSpeedup: { type: 'string' },
        baselineComparison: {
          type: 'object',
          properties: {
            naiveApproach: { type: 'string' },
            naiveTime: { type: 'string' },
            speedupFactor: { type: 'string' }
          }
        },
        memoryEstimate: {
          type: 'object',
          properties: {
            peak: { type: 'string' },
            working: { type: 'string' }
          }
        },
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bottleneck: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        scalingCharacteristics: {
          type: 'object',
          properties: {
            strongScaling: { type: 'string' },
            weakScaling: { type: 'string' }
          }
        },
        benchmarkingGuidelines: { type: 'array', items: { type: 'string' } },
        implementationGuidance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              guideline: { type: 'string' },
              impact: { type: 'string' }
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
  labels: ['mathematics', 'matrix-computation', 'benchmarking']
}));
