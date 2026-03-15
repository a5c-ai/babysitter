/**
 * @process computer-science/algorithm-design-paradigm-selection
 * @description Select and apply appropriate algorithm design paradigms for computational problems including divide-and-conquer, dynamic programming, greedy algorithms, and randomization
 * @inputs { problemDescription: string, problemStructure: object, constraints: object }
 * @outputs { success: boolean, selectedParadigm: string, algorithmDesign: object, comparativeAnalysis: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemDescription,
    problemStructure = {},
    constraints = {},
    preferredParadigms = [],
    outputDir = 'paradigm-selection-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Algorithm Design Paradigm Selection');

  // ============================================================================
  // PHASE 1: PROBLEM STRUCTURE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing problem structure');
  const problemAnalysis = await ctx.task(problemStructureAnalysisTask, {
    problemDescription,
    problemStructure,
    constraints,
    outputDir
  });

  artifacts.push(...problemAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: DIVIDE-AND-CONQUER ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Assessing divide-and-conquer applicability');
  const divideConquerAssessment = await ctx.task(divideConquerAssessmentTask, {
    problemDescription,
    problemAnalysis,
    outputDir
  });

  artifacts.push(...divideConquerAssessment.artifacts);

  // ============================================================================
  // PHASE 3: DYNAMIC PROGRAMMING ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Assessing dynamic programming feasibility');
  const dpAssessment = await ctx.task(dynamicProgrammingAssessmentTask, {
    problemDescription,
    problemAnalysis,
    outputDir
  });

  artifacts.push(...dpAssessment.artifacts);

  // ============================================================================
  // PHASE 4: GREEDY ALGORITHM ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing greedy algorithm potential');
  const greedyAssessment = await ctx.task(greedyAlgorithmAssessmentTask, {
    problemDescription,
    problemAnalysis,
    outputDir
  });

  artifacts.push(...greedyAssessment.artifacts);

  // ============================================================================
  // PHASE 5: RANDOMIZATION ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Exploring randomization benefits');
  const randomizationAssessment = await ctx.task(randomizationAssessmentTask, {
    problemDescription,
    problemAnalysis,
    outputDir
  });

  artifacts.push(...randomizationAssessment.artifacts);

  // ============================================================================
  // PHASE 6: PARADIGM COMPARISON AND SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Comparing paradigms and selecting best approach');
  const paradigmSelection = await ctx.task(paradigmSelectionTask, {
    problemDescription,
    problemAnalysis,
    divideConquerAssessment,
    dpAssessment,
    greedyAssessment,
    randomizationAssessment,
    preferredParadigms,
    constraints,
    outputDir
  });

  artifacts.push(...paradigmSelection.artifacts);

  // ============================================================================
  // PHASE 7: ALGORITHM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing algorithm using selected paradigm');
  const algorithmDesign = await ctx.task(algorithmDesignTask, {
    problemDescription,
    problemAnalysis,
    selectedParadigm: paradigmSelection.selectedParadigm,
    paradigmDetails: paradigmSelection.paradigmDetails,
    outputDir
  });

  artifacts.push(...algorithmDesign.artifacts);

  // Breakpoint: Review paradigm selection and algorithm design
  await ctx.breakpoint({
    question: `Paradigm selection complete. Selected: ${paradigmSelection.selectedParadigm}. Expected complexity: ${algorithmDesign.expectedComplexity}. Review design?`,
    title: 'Algorithm Design Paradigm Selection Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        selectedParadigm: paradigmSelection.selectedParadigm,
        selectionConfidence: paradigmSelection.confidence,
        expectedComplexity: algorithmDesign.expectedComplexity,
        alternativeParadigms: paradigmSelection.alternatives
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    problemDescription,
    problemAnalysis: {
      hasOptimalSubstructure: problemAnalysis.hasOptimalSubstructure,
      hasOverlappingSubproblems: problemAnalysis.hasOverlappingSubproblems,
      hasGreedyChoice: problemAnalysis.hasGreedyChoice,
      isDivisible: problemAnalysis.isDivisible
    },
    selectedParadigm: paradigmSelection.selectedParadigm,
    selectionRationale: paradigmSelection.rationale,
    confidence: paradigmSelection.confidence,
    algorithmDesign: {
      highLevelDesign: algorithmDesign.highLevelDesign,
      pseudocode: algorithmDesign.pseudocode,
      expectedComplexity: algorithmDesign.expectedComplexity,
      spaceComplexity: algorithmDesign.spaceComplexity
    },
    comparativeAnalysis: {
      divideConquer: {
        applicable: divideConquerAssessment.applicable,
        complexity: divideConquerAssessment.expectedComplexity
      },
      dynamicProgramming: {
        applicable: dpAssessment.applicable,
        complexity: dpAssessment.expectedComplexity
      },
      greedy: {
        applicable: greedyAssessment.applicable,
        optimal: greedyAssessment.guaranteesOptimal,
        complexity: greedyAssessment.expectedComplexity
      },
      randomized: {
        beneficial: randomizationAssessment.beneficial,
        complexity: randomizationAssessment.expectedComplexity
      }
    },
    alternatives: paradigmSelection.alternatives,
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/algorithm-design-paradigm-selection',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Problem Structure Analysis
export const problemStructureAnalysisTask = defineTask('problem-structure-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze problem structure',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'approximation-ratio-calculator', 'probabilistic-analysis-toolkit'],
    prompt: {
      role: 'algorithm design specialist',
      task: 'Analyze the computational problem structure to identify properties relevant to paradigm selection',
      context: args,
      instructions: [
        'Identify if problem has optimal substructure (optimal solution contains optimal sub-solutions)',
        'Check for overlapping subproblems (same subproblems solved multiple times)',
        'Assess if greedy choice property holds (local optimal leads to global optimal)',
        'Determine if problem can be divided into independent subproblems',
        'Identify problem type (optimization, decision, search, enumeration)',
        'Analyze input/output structure and constraints',
        'Document key structural properties',
        'Generate problem structure analysis report'
      ],
      outputFormat: 'JSON with hasOptimalSubstructure, hasOverlappingSubproblems, hasGreedyChoice, isDivisible, problemType, structuralProperties, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hasOptimalSubstructure', 'hasOverlappingSubproblems', 'hasGreedyChoice', 'isDivisible', 'artifacts'],
      properties: {
        hasOptimalSubstructure: { type: 'boolean' },
        hasOverlappingSubproblems: { type: 'boolean' },
        hasGreedyChoice: { type: 'boolean' },
        isDivisible: { type: 'boolean' },
        problemType: { type: 'string', enum: ['optimization', 'decision', 'search', 'enumeration', 'counting'] },
        structuralProperties: { type: 'array', items: { type: 'string' } },
        inputStructure: { type: 'string' },
        outputStructure: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'paradigm-selection', 'problem-analysis']
}));

// Task 2: Divide-and-Conquer Assessment
export const divideConquerAssessmentTask = defineTask('divide-conquer-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess divide-and-conquer applicability',
  agent: {
    name: 'algorithm-analyst',
    skills: ['recurrence-solver', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'divide-and-conquer algorithm specialist',
      task: 'Evaluate the applicability of divide-and-conquer paradigm to the problem',
      context: args,
      instructions: [
        'Assess if problem can be divided into smaller subproblems',
        'Check if subproblems are of the same type as original',
        'Evaluate if subproblems are independent (no overlap)',
        'Identify how to combine subproblem solutions',
        'Estimate divide, conquer, and combine costs',
        'Derive expected time complexity using Master Theorem',
        'Identify classic D&C algorithms that may apply',
        'Document advantages and disadvantages'
      ],
      outputFormat: 'JSON with applicable, divisionStrategy, combineStrategy, recurrenceRelation, expectedComplexity, advantages, disadvantages, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['applicable', 'artifacts'],
      properties: {
        applicable: { type: 'boolean' },
        divisionStrategy: { type: 'string' },
        combineStrategy: { type: 'string' },
        subproblemCount: { type: 'number' },
        subproblemSizeRatio: { type: 'number' },
        recurrenceRelation: { type: 'string' },
        expectedComplexity: { type: 'string' },
        advantages: { type: 'array', items: { type: 'string' } },
        disadvantages: { type: 'array', items: { type: 'string' } },
        similarAlgorithms: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'paradigm-selection', 'divide-and-conquer']
}));

// Task 3: Dynamic Programming Assessment
export const dynamicProgrammingAssessmentTask = defineTask('dynamic-programming-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess dynamic programming feasibility',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'recurrence-solver'],
    prompt: {
      role: 'dynamic programming specialist',
      task: 'Evaluate the feasibility of dynamic programming for the problem',
      context: args,
      instructions: [
        'Verify optimal substructure property',
        'Confirm overlapping subproblems exist',
        'Define state representation for DP table',
        'Formulate recurrence relation',
        'Determine base cases',
        'Choose between top-down (memoization) and bottom-up (tabulation)',
        'Estimate time and space complexity',
        'Consider space optimization techniques',
        'Identify similar DP problems'
      ],
      outputFormat: 'JSON with applicable, stateRepresentation, recurrenceRelation, baseCases, approach (top-down/bottom-up), expectedComplexity, spaceComplexity, spaceOptimization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['applicable', 'artifacts'],
      properties: {
        applicable: { type: 'boolean' },
        stateRepresentation: { type: 'string' },
        stateDimensions: { type: 'number' },
        recurrenceRelation: { type: 'string' },
        baseCases: { type: 'array', items: { type: 'string' } },
        approach: { type: 'string', enum: ['top-down', 'bottom-up', 'either'] },
        expectedComplexity: { type: 'string' },
        spaceComplexity: { type: 'string' },
        spaceOptimization: { type: 'string' },
        advantages: { type: 'array', items: { type: 'string' } },
        disadvantages: { type: 'array', items: { type: 'string' } },
        similarProblems: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'paradigm-selection', 'dynamic-programming']
}));

// Task 4: Greedy Algorithm Assessment
export const greedyAlgorithmAssessmentTask = defineTask('greedy-algorithm-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess greedy algorithm potential',
  agent: {
    name: 'approximation-specialist',
    skills: ['approximation-ratio-calculator', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'greedy algorithm specialist',
      task: 'Evaluate the potential for greedy algorithms with matroid analysis',
      context: args,
      instructions: [
        'Check if greedy choice property holds',
        'Verify if local optimal leads to global optimal',
        'Analyze problem structure for matroid properties',
        'Define greedy choice criterion',
        'Assess if exchange argument can prove optimality',
        'Consider if greedy provides approximation if not optimal',
        'Estimate complexity of greedy approach',
        'Identify classic greedy algorithms that may apply'
      ],
      outputFormat: 'JSON with applicable, guaranteesOptimal, greedyChoice, matroidAnalysis, exchangeArgument, approximationRatio, expectedComplexity, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['applicable', 'guaranteesOptimal', 'artifacts'],
      properties: {
        applicable: { type: 'boolean' },
        guaranteesOptimal: { type: 'boolean' },
        greedyChoice: { type: 'string' },
        matroidAnalysis: {
          type: 'object',
          properties: {
            isMatroid: { type: 'boolean' },
            matroidType: { type: 'string' }
          }
        },
        exchangeArgument: { type: 'string' },
        approximationRatio: { type: 'string' },
        expectedComplexity: { type: 'string' },
        advantages: { type: 'array', items: { type: 'string' } },
        disadvantages: { type: 'array', items: { type: 'string' } },
        counterexample: { type: 'string' },
        similarAlgorithms: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'paradigm-selection', 'greedy-algorithms']
}));

// Task 5: Randomization Assessment
export const randomizationAssessmentTask = defineTask('randomization-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Explore randomization benefits',
  agent: {
    name: 'randomized-algorithms-expert',
    skills: ['probabilistic-analysis-toolkit', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'randomized algorithm specialist',
      task: 'Evaluate the benefits of randomization for the problem',
      context: args,
      instructions: [
        'Assess if randomization can simplify the algorithm',
        'Determine if randomization can improve expected complexity',
        'Classify potential algorithm type (Las Vegas vs Monte Carlo)',
        'Identify where randomization can be introduced',
        'Estimate expected running time with randomization',
        'Analyze error probability for Monte Carlo',
        'Consider derandomization possibilities',
        'Identify similar randomized algorithms'
      ],
      outputFormat: 'JSON with beneficial, algorithmType, randomizationPoint, expectedComplexity, errorProbability, derandomizationPossible, advantages, disadvantages, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['beneficial', 'artifacts'],
      properties: {
        beneficial: { type: 'boolean' },
        algorithmType: { type: 'string', enum: ['las-vegas', 'monte-carlo', 'not-applicable'] },
        randomizationPoint: { type: 'string' },
        expectedComplexity: { type: 'string' },
        worstCaseComplexity: { type: 'string' },
        errorProbability: { type: 'string' },
        derandomizationPossible: { type: 'boolean' },
        advantages: { type: 'array', items: { type: 'string' } },
        disadvantages: { type: 'array', items: { type: 'string' } },
        similarAlgorithms: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'paradigm-selection', 'randomization']
}));

// Task 6: Paradigm Selection
export const paradigmSelectionTask = defineTask('paradigm-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare paradigms and select best approach',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'approximation-ratio-calculator'],
    prompt: {
      role: 'senior algorithm designer',
      task: 'Compare all paradigm assessments and select the most appropriate approach',
      context: args,
      instructions: [
        'Compare complexity of all applicable paradigms',
        'Consider implementation complexity trade-offs',
        'Factor in space requirements and constraints',
        'Consider optimality guarantees (exact vs approximation)',
        'Account for any preferred paradigms or constraints',
        'Select primary paradigm with justification',
        'Identify alternative paradigms ranked by suitability',
        'Document selection rationale comprehensively'
      ],
      outputFormat: 'JSON with selectedParadigm, confidence, rationale, paradigmDetails, alternatives, comparisonMatrix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedParadigm', 'confidence', 'rationale', 'artifacts'],
      properties: {
        selectedParadigm: { type: 'string', enum: ['divide-and-conquer', 'dynamic-programming', 'greedy', 'randomized', 'hybrid', 'brute-force'] },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        rationale: { type: 'string' },
        paradigmDetails: { type: 'object' },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              paradigm: { type: 'string' },
              suitability: { type: 'string' },
              tradeoffs: { type: 'string' }
            }
          }
        },
        comparisonMatrix: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              complexity: { type: 'string' },
              space: { type: 'string' },
              optimal: { type: 'boolean' },
              implementationDifficulty: { type: 'string' }
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
  labels: ['agent', 'paradigm-selection', 'selection']
}));

// Task 7: Algorithm Design
export const algorithmDesignTask = defineTask('algorithm-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design algorithm using selected paradigm',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'latex-proof-formatter'],
    prompt: {
      role: 'algorithm designer',
      task: 'Design a high-level algorithm using the selected paradigm',
      context: args,
      instructions: [
        'Create high-level algorithm design based on selected paradigm',
        'Define key data structures needed',
        'Write pseudocode for the algorithm',
        'Identify helper functions and subroutines',
        'Document key algorithmic insights',
        'Estimate time complexity with justification',
        'Estimate space complexity',
        'Note potential optimizations',
        'Generate algorithm design document'
      ],
      outputFormat: 'JSON with highLevelDesign, dataStructures, pseudocode, helperFunctions, expectedComplexity, spaceComplexity, optimizations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['highLevelDesign', 'pseudocode', 'expectedComplexity', 'artifacts'],
      properties: {
        highLevelDesign: { type: 'string' },
        dataStructures: { type: 'array', items: { type: 'string' } },
        pseudocode: { type: 'string' },
        helperFunctions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              complexity: { type: 'string' }
            }
          }
        },
        keyInsights: { type: 'array', items: { type: 'string' } },
        expectedComplexity: { type: 'string' },
        spaceComplexity: { type: 'string' },
        optimizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'paradigm-selection', 'algorithm-design']
}));
