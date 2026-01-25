/**
 * @process computer-science/approximation-algorithm-design
 * @description Design polynomial-time approximation algorithms for NP-hard problems with guaranteed approximation ratios
 * @inputs { problemDescription: string, hardnessProof: object, targetApproximationRatio: number }
 * @outputs { success: boolean, algorithm: object, approximationRatioProof: object, implementationGuidelines: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemDescription,
    hardnessProof = {},
    targetApproximationRatio = null,
    allowRandomization = true,
    outputDir = 'approximation-algorithm-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Approximation Algorithm Design');

  // ============================================================================
  // PHASE 1: NP-HARDNESS VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Verifying problem NP-hardness');
  const hardnessVerification = await ctx.task(hardnessVerificationTask, {
    problemDescription,
    hardnessProof,
    outputDir
  });

  artifacts.push(...hardnessVerification.artifacts);

  // ============================================================================
  // PHASE 2: INAPPROXIMABILITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing inapproximability results');
  const inapproximabilityAnalysis = await ctx.task(inapproximabilityAnalysisTask, {
    problemDescription,
    hardnessVerification,
    outputDir
  });

  artifacts.push(...inapproximabilityAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: APPROXIMATION TECHNIQUE SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Selecting approximation technique');
  const techniqueSelection = await ctx.task(approximationTechniqueSelectionTask, {
    problemDescription,
    hardnessVerification,
    inapproximabilityAnalysis,
    targetApproximationRatio,
    allowRandomization,
    outputDir
  });

  artifacts.push(...techniqueSelection.artifacts);

  // ============================================================================
  // PHASE 4: LP RELAXATION AND ROUNDING (IF APPLICABLE)
  // ============================================================================

  ctx.log('info', 'Phase 4: Applying LP relaxation and rounding');
  const lpRounding = await ctx.task(lpRelaxationRoundingTask, {
    problemDescription,
    techniqueSelection,
    outputDir
  });

  artifacts.push(...lpRounding.artifacts);

  // ============================================================================
  // PHASE 5: ALGORITHM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing approximation algorithm');
  const algorithmDesign = await ctx.task(approximationAlgorithmDesignTask, {
    problemDescription,
    techniqueSelection,
    lpRounding,
    targetApproximationRatio,
    outputDir
  });

  artifacts.push(...algorithmDesign.artifacts);

  // ============================================================================
  // PHASE 6: APPROXIMATION RATIO PROOF
  // ============================================================================

  ctx.log('info', 'Phase 6: Proving approximation ratio');
  const ratioProof = await ctx.task(approximationRatioProofTask, {
    problemDescription,
    algorithmDesign,
    outputDir
  });

  artifacts.push(...ratioProof.artifacts);

  // ============================================================================
  // PHASE 7: PTAS/FPTAS FEASIBILITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing PTAS/FPTAS feasibility');
  const ptasAnalysis = await ctx.task(ptasFptasAnalysisTask, {
    problemDescription,
    inapproximabilityAnalysis,
    algorithmDesign,
    outputDir
  });

  artifacts.push(...ptasAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: IMPLEMENTATION GUIDELINES
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating implementation guidelines');
  const implementationGuidelines = await ctx.task(implementationGuidelinesTask, {
    problemDescription,
    algorithmDesign,
    ratioProof,
    lpRounding,
    outputDir
  });

  artifacts.push(...implementationGuidelines.artifacts);

  // Breakpoint: Review approximation algorithm design
  await ctx.breakpoint({
    question: `Approximation algorithm design complete. Ratio: ${ratioProof.achievedRatio}. Review algorithm and proof?`,
    title: 'Approximation Algorithm Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        achievedRatio: ratioProof.achievedRatio,
        technique: techniqueSelection.selectedTechnique,
        timeComplexity: algorithmDesign.timeComplexity,
        ptasPossible: ptasAnalysis.ptasPossible
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    problemDescription,
    hardnessVerification: {
      isNPHard: hardnessVerification.isNPHard,
      reductionSource: hardnessVerification.reductionSource
    },
    inapproximability: {
      bestKnownLowerBound: inapproximabilityAnalysis.bestKnownLowerBound,
      conditionalLowerBounds: inapproximabilityAnalysis.conditionalLowerBounds
    },
    algorithm: {
      technique: techniqueSelection.selectedTechnique,
      description: algorithmDesign.algorithmDescription,
      pseudocode: algorithmDesign.pseudocode,
      timeComplexity: algorithmDesign.timeComplexity,
      spaceComplexity: algorithmDesign.spaceComplexity
    },
    approximationRatioProof: {
      achievedRatio: ratioProof.achievedRatio,
      proofTechnique: ratioProof.proofTechnique,
      proofSummary: ratioProof.proofSummary
    },
    ptasAnalysis: {
      ptasPossible: ptasAnalysis.ptasPossible,
      fptasPossible: ptasAnalysis.fptasPossible,
      ptasComplexity: ptasAnalysis.ptasComplexity
    },
    implementationGuidelines: {
      dataStructures: implementationGuidelines.dataStructures,
      algorithmicSteps: implementationGuidelines.algorithmicSteps,
      practicalConsiderations: implementationGuidelines.practicalConsiderations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/approximation-algorithm-design',
      timestamp: startTime,
      targetApproximationRatio,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Hardness Verification
export const hardnessVerificationTask = defineTask('hardness-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify problem NP-hardness via reduction',
  agent: {
    name: 'complexity-theorist',
    skills: ['reduction-builder', 'complexity-class-oracle'],
    prompt: {
      role: 'complexity theorist',
      task: 'Verify or establish NP-hardness of the optimization problem via reduction',
      context: args,
      instructions: [
        'Verify problem is in NPO (NP optimization)',
        'Review existing hardness proof if provided',
        'If needed, construct polynomial-time reduction from known NP-hard problem',
        'Document reduction construction and correctness',
        'Identify the source NP-hard problem used',
        'Note any special problem variants (weighted, unweighted, etc.)',
        'Generate hardness verification report'
      ],
      outputFormat: 'JSON with isNPHard, reductionSource, reductionConstruction, correctnessProof, problemVariant, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isNPHard', 'artifacts'],
      properties: {
        isNPHard: { type: 'boolean' },
        reductionSource: { type: 'string' },
        reductionConstruction: { type: 'string' },
        correctnessProof: { type: 'string' },
        reductionComplexity: { type: 'string' },
        problemVariant: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'approximation-algorithm', 'hardness']
}));

// Task 2: Inapproximability Analysis
export const inapproximabilityAnalysisTask = defineTask('inapproximability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze inapproximability results',
  agent: {
    name: 'approximation-specialist',
    skills: ['approximation-ratio-calculator', 'reduction-builder', 'complexity-class-oracle'],
    prompt: {
      role: 'approximation complexity specialist',
      task: 'Analyze known inapproximability results and lower bounds for the problem',
      context: args,
      instructions: [
        'Research known inapproximability results for the problem',
        'Identify PCP-based inapproximability bounds if any',
        'Note conditional lower bounds (P != NP, Unique Games Conjecture, etc.)',
        'Determine the best known approximation lower bound',
        'Identify any APX-hardness or log-APX-hardness results',
        'Document gap between known upper and lower bounds',
        'Note any special cases with better approximability'
      ],
      outputFormat: 'JSON with bestKnownLowerBound, conditionalLowerBounds, pcpBased, apxHardness, gapAnalysis, specialCases, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['bestKnownLowerBound', 'artifacts'],
      properties: {
        bestKnownLowerBound: { type: 'string' },
        conditionalLowerBounds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              lowerBound: { type: 'string' }
            }
          }
        },
        pcpBased: { type: 'boolean' },
        apxHardness: { type: 'boolean' },
        logApxHardness: { type: 'boolean' },
        gapAnalysis: { type: 'string' },
        specialCases: { type: 'array', items: { type: 'string' } },
        references: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'approximation-algorithm', 'inapproximability']
}));

// Task 3: Approximation Technique Selection
export const approximationTechniqueSelectionTask = defineTask('approximation-technique-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select approximation technique',
  agent: {
    name: 'approximation-specialist',
    skills: ['approximation-ratio-calculator', 'probabilistic-analysis-toolkit'],
    prompt: {
      role: 'approximation algorithm designer',
      task: 'Select the most appropriate approximation technique for the problem',
      context: args,
      instructions: [
        'Evaluate greedy approach potential',
        'Assess LP relaxation and rounding applicability',
        'Consider primal-dual method suitability',
        'Evaluate local search / local ratio methods',
        'Consider SDP relaxation for applicable problems',
        'Assess randomized rounding potential',
        'Consider combinatorial algorithms',
        'Select technique with best expected ratio',
        'Document technique selection rationale'
      ],
      outputFormat: 'JSON with selectedTechnique, rationale, expectedRatio, alternativeTechniques, techniqueComparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTechnique', 'rationale', 'artifacts'],
      properties: {
        selectedTechnique: { type: 'string', enum: ['greedy', 'lp-rounding', 'primal-dual', 'local-search', 'local-ratio', 'sdp-rounding', 'randomized-rounding', 'combinatorial'] },
        rationale: { type: 'string' },
        expectedRatio: { type: 'string' },
        alternativeTechniques: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              technique: { type: 'string' },
              expectedRatio: { type: 'string' },
              tradeoffs: { type: 'string' }
            }
          }
        },
        techniqueComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'approximation-algorithm', 'technique-selection']
}));

// Task 4: LP Relaxation and Rounding
export const lpRelaxationRoundingTask = defineTask('lp-relaxation-rounding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply LP relaxation and rounding techniques',
  agent: {
    name: 'approximation-specialist',
    skills: ['approximation-ratio-calculator', 'smt-solver-interface'],
    prompt: {
      role: 'LP-based approximation specialist',
      task: 'Design LP relaxation and rounding scheme for the problem',
      context: args,
      instructions: [
        'Formulate integer linear program (ILP) for the problem',
        'Design LP relaxation by relaxing integrality constraints',
        'Analyze integrality gap of the relaxation',
        'Design rounding scheme (deterministic or randomized)',
        'Prove rounding scheme preserves feasibility',
        'Analyze rounding loss and resulting approximation ratio',
        'Consider strengthening LP with valid inequalities',
        'Document complete LP formulation and rounding procedure'
      ],
      outputFormat: 'JSON with ilpFormulation, lpRelaxation, integralityGap, roundingScheme, roundingAnalysis, strengthening, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['applicable', 'artifacts'],
      properties: {
        applicable: { type: 'boolean' },
        ilpFormulation: {
          type: 'object',
          properties: {
            objective: { type: 'string' },
            constraints: { type: 'array', items: { type: 'string' } },
            variables: { type: 'array', items: { type: 'string' } }
          }
        },
        lpRelaxation: { type: 'string' },
        integralityGap: { type: 'string' },
        roundingScheme: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['deterministic', 'randomized', 'iterative'] },
            description: { type: 'string' },
            procedure: { type: 'string' }
          }
        },
        roundingAnalysis: { type: 'string' },
        validInequalities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'approximation-algorithm', 'lp-rounding']
}));

// Task 5: Approximation Algorithm Design
export const approximationAlgorithmDesignTask = defineTask('approximation-algorithm-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design approximation algorithm',
  agent: {
    name: 'approximation-specialist',
    skills: ['approximation-ratio-calculator', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'approximation algorithm designer',
      task: 'Design complete approximation algorithm with guaranteed ratio',
      context: args,
      instructions: [
        'Design algorithm using selected technique',
        'Write clear pseudocode',
        'Specify all data structures needed',
        'Ensure polynomial running time',
        'Document algorithm step by step',
        'Analyze time complexity',
        'Analyze space complexity',
        'Note any implementation considerations',
        'Generate algorithm specification document'
      ],
      outputFormat: 'JSON with algorithmDescription, pseudocode, dataStructures, timeComplexity, spaceComplexity, implementationNotes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithmDescription', 'pseudocode', 'timeComplexity', 'artifacts'],
      properties: {
        algorithmDescription: { type: 'string' },
        pseudocode: { type: 'string' },
        dataStructures: { type: 'array', items: { type: 'string' } },
        algorithmSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              description: { type: 'string' },
              complexity: { type: 'string' }
            }
          }
        },
        timeComplexity: { type: 'string' },
        spaceComplexity: { type: 'string' },
        implementationNotes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'approximation-algorithm', 'design']
}));

// Task 6: Approximation Ratio Proof
export const approximationRatioProofTask = defineTask('approximation-ratio-proof', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prove approximation ratio',
  agent: {
    name: 'ratio-prover',
    prompt: {
      role: 'approximation algorithm analyst',
      task: 'Prove the approximation ratio of the designed algorithm',
      context: args,
      instructions: [
        'State the approximation ratio claim precisely',
        'Define comparison to optimal solution (OPT)',
        'Establish lower/upper bound on algorithm output vs OPT',
        'For minimization: prove ALG <= ratio * OPT',
        'For maximization: prove ALG >= OPT / ratio',
        'Use appropriate proof technique (direct, LP comparison, etc.)',
        'Prove ratio is tight if possible (with matching example)',
        'Document complete formal proof'
      ],
      outputFormat: 'JSON with achievedRatio, problemType, proofTechnique, proofSummary, formalProof, tightnessExample, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['achievedRatio', 'proofTechnique', 'proofSummary', 'artifacts'],
      properties: {
        achievedRatio: { type: 'string' },
        problemType: { type: 'string', enum: ['minimization', 'maximization'] },
        proofTechnique: { type: 'string' },
        proofSummary: { type: 'string' },
        formalProof: { type: 'string' },
        keyLemmas: { type: 'array', items: { type: 'string' } },
        tightnessExample: { type: 'string' },
        ratioIsTight: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'approximation-algorithm', 'ratio-proof']
}));

// Task 7: PTAS/FPTAS Analysis
export const ptasFptasAnalysisTask = defineTask('ptas-fptas-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze PTAS/FPTAS feasibility',
  agent: {
    name: 'ptas-analyst',
    prompt: {
      role: 'approximation scheme specialist',
      task: 'Analyze feasibility of polynomial-time approximation schemes',
      context: args,
      instructions: [
        'Determine if PTAS is possible for the problem',
        'Check for APX-hardness that would preclude PTAS',
        'If PTAS possible, outline scheme design',
        'Analyze if FPTAS is achievable',
        'Check for strong NP-hardness that precludes FPTAS',
        'Document PTAS/FPTAS complexity parameterized by epsilon',
        'Note any special cases admitting PTAS/FPTAS',
        'Provide feasibility conclusions'
      ],
      outputFormat: 'JSON with ptasPossible, fptasPossible, ptasOutline, ptasComplexity, obstacles, specialCases, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ptasPossible', 'fptasPossible', 'artifacts'],
      properties: {
        ptasPossible: { type: 'boolean' },
        fptasPossible: { type: 'boolean' },
        ptasOutline: { type: 'string' },
        ptasComplexity: { type: 'string' },
        fptasComplexity: { type: 'string' },
        obstacles: { type: 'array', items: { type: 'string' } },
        specialCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              case: { type: 'string' },
              ptasPossible: { type: 'boolean' },
              complexity: { type: 'string' }
            }
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
  labels: ['agent', 'approximation-algorithm', 'ptas']
}));

// Task 8: Implementation Guidelines
export const implementationGuidelinesTask = defineTask('implementation-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate implementation guidelines',
  agent: {
    name: 'implementation-guide-writer',
    prompt: {
      role: 'algorithm implementation specialist',
      task: 'Provide comprehensive implementation guidelines for the approximation algorithm',
      context: args,
      instructions: [
        'Specify data structures with complexity requirements',
        'Detail algorithmic steps with implementation hints',
        'Address numerical precision issues for LP-based methods',
        'Recommend LP/ILP solvers for implementation',
        'Provide practical optimization tips',
        'Note common implementation pitfalls',
        'Suggest testing and validation strategies',
        'Generate comprehensive implementation guide'
      ],
      outputFormat: 'JSON with dataStructures, algorithmicSteps, practicalConsiderations, solverRecommendations, testingStrategy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dataStructures', 'algorithmicSteps', 'practicalConsiderations', 'artifacts'],
      properties: {
        dataStructures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              structure: { type: 'string' },
              purpose: { type: 'string' },
              operations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        algorithmicSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              description: { type: 'string' },
              implementationHint: { type: 'string' }
            }
          }
        },
        practicalConsiderations: { type: 'array', items: { type: 'string' } },
        numericalPrecision: { type: 'string' },
        solverRecommendations: { type: 'array', items: { type: 'string' } },
        commonPitfalls: { type: 'array', items: { type: 'string' } },
        testingStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'approximation-algorithm', 'implementation']
}));
