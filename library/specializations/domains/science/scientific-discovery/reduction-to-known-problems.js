/**
 * @process scientific-discovery/reduction-to-known-problems
 * @description Show that a new problem is equivalent to a known problem, leveraging existing solutions and complexity results
 * @inputs { newProblem: object, knownProblems: array, context: object, outputDir: string }
 * @outputs { success: boolean, reduction: object, equivalenceProof: object, implications: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    newProblem = {},
    knownProblems = [],
    context = {},
    outputDir = 'reduction-output',
    targetConfidence = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Reduction to Known Problems Process');

  // ============================================================================
  // PHASE 1: PROBLEM FORMALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Formalizing the new problem');
  const problemFormalization = await ctx.task(problemFormalizationTask, {
    newProblem,
    context,
    outputDir
  });

  artifacts.push(...problemFormalization.artifacts);

  // ============================================================================
  // PHASE 2: KNOWN PROBLEM CATALOG SEARCH
  // ============================================================================

  ctx.log('info', 'Phase 2: Searching for candidate known problems');
  const catalogSearch = await ctx.task(knownProblemSearchTask, {
    formalizedProblem: problemFormalization.formalization,
    knownProblems,
    outputDir
  });

  artifacts.push(...catalogSearch.artifacts);

  // ============================================================================
  // PHASE 3: STRUCTURAL SIMILARITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing structural similarities');
  const similarityAnalysis = await ctx.task(structuralSimilarityTask, {
    newProblem: problemFormalization.formalization,
    candidates: catalogSearch.candidates,
    outputDir
  });

  artifacts.push(...similarityAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: REDUCTION CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Constructing reduction');
  const reductionConstruction = await ctx.task(reductionConstructionTask, {
    newProblem: problemFormalization.formalization,
    targetProblem: similarityAnalysis.bestCandidate,
    outputDir
  });

  artifacts.push(...reductionConstruction.artifacts);

  // ============================================================================
  // PHASE 5: CORRECTNESS VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Verifying reduction correctness');
  const correctnessVerification = await ctx.task(correctnessVerificationTask, {
    reduction: reductionConstruction.reduction,
    newProblem: problemFormalization.formalization,
    targetProblem: similarityAnalysis.bestCandidate,
    outputDir
  });

  artifacts.push(...correctnessVerification.artifacts);

  // ============================================================================
  // PHASE 6: COMPLEXITY PRESERVATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing complexity preservation');
  const complexityAnalysis = await ctx.task(complexityPreservationTask, {
    reduction: reductionConstruction.reduction,
    newProblem: problemFormalization.formalization,
    targetProblem: similarityAnalysis.bestCandidate,
    outputDir
  });

  artifacts.push(...complexityAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: SOLUTION TRANSFER
  // ============================================================================

  ctx.log('info', 'Phase 7: Transferring solutions');
  const solutionTransfer = await ctx.task(solutionTransferTask, {
    reduction: reductionConstruction.reduction,
    targetProblem: similarityAnalysis.bestCandidate,
    correctnessVerified: correctnessVerification.verified,
    outputDir
  });

  artifacts.push(...solutionTransfer.artifacts);

  // ============================================================================
  // PHASE 8: SYNTHESIS AND IMPLICATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing reduction analysis');
  const synthesis = await ctx.task(reductionSynthesisTask, {
    problemFormalization,
    catalogSearch,
    similarityAnalysis,
    reductionConstruction,
    correctnessVerification,
    complexityAnalysis,
    solutionTransfer,
    targetConfidence,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  const confidenceMet = synthesis.confidenceScore >= targetConfidence;

  // Breakpoint: Review reduction
  await ctx.breakpoint({
    question: `Reduction analysis complete. Confidence: ${synthesis.confidenceScore}/${targetConfidence}. ${confidenceMet ? 'Confidence target met!' : 'Additional verification may be needed.'} Review reduction?`,
    title: 'Reduction to Known Problems Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        newProblem: problemFormalization.formalization.name,
        targetProblem: similarityAnalysis.bestCandidate?.name || 'none',
        reductionType: reductionConstruction.reduction?.type || 'none',
        correctnessVerified: correctnessVerification.verified,
        complexityPreserved: complexityAnalysis.preserved,
        confidenceScore: synthesis.confidenceScore,
        confidenceMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    newProblem: problemFormalization.formalization,
    reduction: {
      targetProblem: similarityAnalysis.bestCandidate,
      reductionFunction: reductionConstruction.reduction,
      verified: correctnessVerification.verified
    },
    equivalenceProof: correctnessVerification.proof,
    implications: {
      complexity: complexityAnalysis.implications,
      solutions: solutionTransfer.solutions,
      algorithms: solutionTransfer.algorithms
    },
    confidenceScore: synthesis.confidenceScore,
    confidenceMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/reduction-to-known-problems',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Problem Formalization
export const problemFormalizationTask = defineTask('problem-formalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formalize the new problem',
  agent: {
    name: 'problem-formalizer',
    prompt: {
      role: 'theoretical computer scientist specializing in problem formalization',
      task: 'Formally specify the new problem',
      context: args,
      instructions: [
        'Define the problem formally:',
        '  - Input: What is given? (format, constraints)',
        '  - Output: What is required? (format, properties)',
        '  - Objective: What makes a solution valid/optimal?',
        'Specify as a decision or optimization problem:',
        '  - Decision: Is there a solution satisfying property P?',
        '  - Optimization: Find solution maximizing/minimizing objective',
        'Identify problem type:',
        '  - Search problem',
        '  - Counting problem',
        '  - Function problem',
        '  - Promise problem',
        'Define the problem instance space',
        'Identify special cases and generalizations',
        'Save formalization to output directory'
      ],
      outputFormat: 'JSON with formalization (name, input, output, objective, type), instanceSpace, specialCases, generalizations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['formalization', 'instanceSpace', 'artifacts'],
      properties: {
        formalization: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            input: { type: 'object' },
            output: { type: 'object' },
            objective: { type: 'string' },
            type: { type: 'string', enum: ['decision', 'optimization', 'search', 'counting', 'function'] },
            constraints: { type: 'array', items: { type: 'string' } }
          }
        },
        instanceSpace: { type: 'object' },
        specialCases: { type: 'array', items: { type: 'object' } },
        generalizations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reduction', 'formalization']
}));

// Task 2: Known Problem Search
export const knownProblemSearchTask = defineTask('known-problem-search', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Search for candidate known problems',
  agent: {
    name: 'problem-cataloger',
    prompt: {
      role: 'computer scientist with broad algorithmic knowledge',
      task: 'Search for known problems that might be equivalent or related',
      context: args,
      instructions: [
        'Search for known problems with similar structure:',
        '  - Graph problems (matching, flow, coloring, paths)',
        '  - Constraint satisfaction problems',
        '  - Combinatorial optimization problems',
        '  - Number theory problems',
        '  - String/sequence problems',
        'Consider classic NP-complete problems:',
        '  - SAT, 3-SAT, MAX-SAT',
        '  - Vertex Cover, Independent Set, Clique',
        '  - Hamiltonian Path/Cycle, TSP',
        '  - Subset Sum, Knapsack',
        '  - Graph Coloring',
        'Consider well-solved problem classes:',
        '  - Maximum Flow, Minimum Cut',
        '  - Shortest Paths',
        '  - Bipartite Matching',
        '  - Linear Programming',
        'Rank candidates by structural similarity',
        'Save search results to output directory'
      ],
      outputFormat: 'JSON with candidates (array with name, description, complexity, similarityScore), searchCoverage, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['candidates', 'searchCoverage', 'artifacts'],
      properties: {
        candidates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              complexityClass: { type: 'string' },
              knownAlgorithms: { type: 'array', items: { type: 'string' } },
              similarityScore: { type: 'number' },
              similarityReason: { type: 'string' }
            }
          }
        },
        searchCoverage: {
          type: 'object',
          properties: {
            categoriesSearched: { type: 'array', items: { type: 'string' } },
            comprehensiveness: { type: 'string' }
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
  labels: ['agent', 'reduction', 'catalog-search']
}));

// Task 3: Structural Similarity Analysis
export const structuralSimilarityTask = defineTask('structural-similarity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze structural similarities',
  agent: {
    name: 'similarity-analyst',
    prompt: {
      role: 'theoretical computer scientist specializing in problem classification',
      task: 'Analyze structural similarities between problems',
      context: args,
      instructions: [
        'For each candidate, analyze structural correspondence:',
        '  - Input structure mapping',
        '  - Output structure mapping',
        '  - Constraint correspondence',
        '  - Objective function relationship',
        'Identify:',
        '  - Isomorphic structure (identical after renaming)',
        '  - Homomorphic structure (preserves some structure)',
        '  - Analogous structure (similar pattern)',
        'Assess difficulty of establishing reduction:',
        '  - Direct encoding possible?',
        '  - Requires gadget construction?',
        '  - Requires intermediate problems?',
        'Select best candidate for reduction',
        'Document mapping intuition',
        'Save similarity analysis to output directory'
      ],
      outputFormat: 'JSON with analyses (array), bestCandidate, mappingIntuition, reductionDifficulty, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analyses', 'bestCandidate', 'artifacts'],
      properties: {
        analyses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              problem: { type: 'string' },
              structureType: { type: 'string', enum: ['isomorphic', 'homomorphic', 'analogous', 'weak'] },
              inputMapping: { type: 'string' },
              outputMapping: { type: 'string' },
              reductionFeasibility: { type: 'string' }
            }
          }
        },
        bestCandidate: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            complexityClass: { type: 'string' },
            knownAlgorithms: { type: 'array', items: { type: 'string' } },
            selectionReason: { type: 'string' }
          }
        },
        mappingIntuition: { type: 'string' },
        reductionDifficulty: { type: 'string', enum: ['easy', 'moderate', 'hard'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reduction', 'similarity']
}));

// Task 4: Reduction Construction
export const reductionConstructionTask = defineTask('reduction-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct reduction',
  agent: {
    name: 'reduction-constructor',
    prompt: {
      role: 'theoretical computer scientist specializing in reductions',
      task: 'Construct a formal reduction between the problems',
      context: args,
      instructions: [
        'Define the reduction function f:',
        '  - Maps instances of new problem to instances of target problem',
        '  - Must be computable in polynomial time (for poly-time reduction)',
        'Specify the reduction type:',
        '  - Many-one (Karp) reduction: x ∈ A iff f(x) ∈ B',
        '  - Turing (Cook) reduction: using oracle for B',
        '  - Approximation-preserving reduction',
        'Construct the encoding:',
        '  - How input elements map to target problem elements',
        '  - How constraints are preserved',
        '  - How objective relates',
        'Define any gadgets needed:',
        '  - Local replacement constructions',
        '  - Ensure gadgets are correct',
        'Document the complete reduction',
        'Save reduction construction to output directory'
      ],
      outputFormat: 'JSON with reduction (type, function, encoding, gadgets), complexity, completeness, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reduction', 'complexity', 'artifacts'],
      properties: {
        reduction: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['many-one', 'turing', 'approximation-preserving', 'parsimonious'] },
            function: { type: 'string' },
            encoding: { type: 'object' },
            gadgets: { type: 'array', items: { type: 'object' } }
          }
        },
        complexity: {
          type: 'object',
          properties: {
            reductionTime: { type: 'string' },
            spaceOverhead: { type: 'string' }
          }
        },
        completeness: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reduction', 'construction']
}));

// Task 5: Correctness Verification
export const correctnessVerificationTask = defineTask('correctness-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify reduction correctness',
  agent: {
    name: 'verification-specialist',
    prompt: {
      role: 'theoretical computer scientist specializing in proofs',
      task: 'Verify that the reduction is correct',
      context: args,
      instructions: [
        'Prove the reduction is correct:',
        '  - Forward direction: Yes-instance maps to Yes-instance',
        '  - Backward direction: Yes-instance comes from Yes-instance',
        'For optimization problems:',
        '  - Show objective values correspond',
        '  - Prove approximation preservation if relevant',
        'Verify gadget correctness:',
        '  - Each gadget behaves as claimed',
        '  - Composition of gadgets works correctly',
        'Check edge cases:',
        '  - Empty instances',
        '  - Trivial instances',
        '  - Boundary cases',
        'Provide complete proof or identify gaps',
        'Save verification to output directory'
      ],
      outputFormat: 'JSON with verified, proof (forward, backward, gadgetCorrectness), edgeCases, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'proof', 'artifacts'],
      properties: {
        verified: { type: 'boolean' },
        proof: {
          type: 'object',
          properties: {
            forward: { type: 'string' },
            backward: { type: 'string' },
            gadgetCorrectness: { type: 'array', items: { type: 'string' } }
          }
        },
        edgeCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              case: { type: 'string' },
              verified: { type: 'boolean' }
            }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reduction', 'verification']
}));

// Task 6: Complexity Preservation Analysis
export const complexityPreservationTask = defineTask('complexity-preservation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze complexity preservation',
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'complexity theorist',
      task: 'Analyze what the reduction implies about problem complexity',
      context: args,
      instructions: [
        'Analyze complexity implications:',
        '  - If target is in P, is new problem in P?',
        '  - If target is NP-complete, is new problem NP-hard?',
        '  - If target is hard to approximate, is new problem?',
        'Assess reduction strength:',
        '  - Polynomial time reduction?',
        '  - Log-space reduction?',
        '  - Approximation-preserving?',
        'Determine complexity class membership:',
        '  - Upper bounds from reduction',
        '  - Lower bounds from reduction',
        '  - Completeness results',
        'Consider parameterized complexity:',
        '  - FPT reductions',
        '  - Parameter preservation',
        'Document all complexity implications',
        'Save complexity analysis to output directory'
      ],
      outputFormat: 'JSON with preserved, implications (upperBounds, lowerBounds, completeness), reductionStrength, parameterized, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['preserved', 'implications', 'artifacts'],
      properties: {
        preserved: { type: 'boolean' },
        implications: {
          type: 'object',
          properties: {
            upperBounds: { type: 'array', items: { type: 'string' } },
            lowerBounds: { type: 'array', items: { type: 'string' } },
            completeness: { type: 'string' },
            approximability: { type: 'string' }
          }
        },
        reductionStrength: { type: 'string' },
        parameterized: {
          type: 'object',
          properties: {
            fptReduction: { type: 'boolean' },
            parameterMapping: { type: 'string' }
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
  labels: ['agent', 'reduction', 'complexity']
}));

// Task 7: Solution Transfer
export const solutionTransferTask = defineTask('solution-transfer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Transfer solutions',
  agent: {
    name: 'solution-transferer',
    prompt: {
      role: 'algorithm designer',
      task: 'Show how to use known solutions for the new problem',
      context: args,
      instructions: [
        'Identify algorithms for target problem:',
        '  - Exact algorithms and their complexity',
        '  - Approximation algorithms and guarantees',
        '  - Heuristics and practical algorithms',
        'Show how to use them for new problem:',
        '  - Transform input using reduction',
        '  - Apply algorithm for target problem',
        '  - Transform output back',
        'Analyze resulting algorithm complexity:',
        '  - Reduction overhead',
        '  - Total time complexity',
        '  - Total space complexity',
        'Consider practical implications:',
        '  - Is overhead acceptable?',
        '  - Are implementations available?',
        '  - What parameters affect performance?',
        'Save solution transfer to output directory'
      ],
      outputFormat: 'JSON with solutions (array), algorithms (array with name, complexity, practicalNotes), transferOverhead, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['solutions', 'algorithms', 'artifacts'],
      properties: {
        solutions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              sourceAlgorithm: { type: 'string' },
              resultingComplexity: { type: 'string' }
            }
          }
        },
        algorithms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              originalComplexity: { type: 'string' },
              resultingComplexity: { type: 'string' },
              practicalNotes: { type: 'string' }
            }
          }
        },
        transferOverhead: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reduction', 'solution-transfer']
}));

// Task 8: Reduction Synthesis
export const reductionSynthesisTask = defineTask('reduction-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize reduction analysis',
  agent: {
    name: 'synthesis-specialist',
    prompt: {
      role: 'senior theoretical computer scientist',
      task: 'Synthesize the reduction analysis',
      context: args,
      instructions: [
        'Summarize the reduction result:',
        '  - New problem definition',
        '  - Target problem',
        '  - Reduction type and function',
        '  - Correctness status',
        'State complexity implications clearly',
        'Assess confidence (0-100):',
        '  - Formalization quality',
        '  - Reduction correctness',
        '  - Proof completeness',
        '  - Solution applicability',
        'Identify remaining questions',
        'Suggest follow-up work',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with summary, confidenceScore, implications, remainingQuestions, followUp, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'confidenceScore', 'artifacts'],
      properties: {
        summary: {
          type: 'object',
          properties: {
            newProblem: { type: 'string' },
            targetProblem: { type: 'string' },
            reductionType: { type: 'string' },
            result: { type: 'string' }
          }
        },
        confidenceScore: { type: 'number', minimum: 0, maximum: 100 },
        implications: { type: 'array', items: { type: 'string' } },
        remainingQuestions: { type: 'array', items: { type: 'string' } },
        followUp: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reduction', 'synthesis']
}));
