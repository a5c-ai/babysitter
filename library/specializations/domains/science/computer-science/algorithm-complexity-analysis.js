/**
 * @process computer-science/algorithm-complexity-analysis
 * @description Systematically analyze time and space complexity of algorithms using asymptotic notation, recurrence relations, and formal proofs
 * @inputs { algorithmDescription: string, pseudocode: string, computationalModel: string, inputRepresentation: object }
 * @outputs { success: boolean, complexityBounds: object, recurrenceAnalysis: object, proofDocumentation: string, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    algorithmDescription,
    pseudocode = '',
    computationalModel = 'RAM',
    inputRepresentation = {},
    analysisDepth = 'comprehensive',
    outputDir = 'complexity-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Algorithm Complexity Analysis');

  // ============================================================================
  // PHASE 1: COMPUTATIONAL MODEL IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying computational model and input representation');
  const modelIdentification = await ctx.task(computationalModelIdentificationTask, {
    algorithmDescription,
    pseudocode,
    computationalModel,
    inputRepresentation,
    outputDir
  });

  artifacts.push(...modelIdentification.artifacts);

  // ============================================================================
  // PHASE 2: ASYMPTOTIC ANALYSIS (BIG-O, BIG-OMEGA, BIG-THETA)
  // ============================================================================

  ctx.log('info', 'Phase 2: Applying asymptotic analysis');
  const asymptoticAnalysis = await ctx.task(asymptoticAnalysisTask, {
    algorithmDescription,
    pseudocode,
    modelIdentification,
    outputDir
  });

  artifacts.push(...asymptoticAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: RECURRENCE RELATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Solving recurrence relations');
  const recurrenceAnalysis = await ctx.task(recurrenceRelationAnalysisTask, {
    algorithmDescription,
    pseudocode,
    asymptoticAnalysis,
    outputDir
  });

  artifacts.push(...recurrenceAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: CASE ANALYSIS (BEST, WORST, AVERAGE)
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing best-case, worst-case, and average-case complexity');
  const caseAnalysis = await ctx.task(caseAnalysisTask, {
    algorithmDescription,
    pseudocode,
    asymptoticAnalysis,
    recurrenceAnalysis,
    outputDir
  });

  artifacts.push(...caseAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: AMORTIZED ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Performing amortized analysis for operation sequences');
  const amortizedAnalysis = await ctx.task(amortizedAnalysisTask, {
    algorithmDescription,
    pseudocode,
    caseAnalysis,
    outputDir
  });

  artifacts.push(...amortizedAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: SPACE COMPLEXITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing space complexity');
  const spaceComplexityAnalysis = await ctx.task(spaceComplexityAnalysisTask, {
    algorithmDescription,
    pseudocode,
    modelIdentification,
    outputDir
  });

  artifacts.push(...spaceComplexityAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: LOWER BOUND COMPARISON
  // ============================================================================

  ctx.log('info', 'Phase 7: Comparing with known lower bounds');
  const lowerBoundComparison = await ctx.task(lowerBoundComparisonTask, {
    algorithmDescription,
    asymptoticAnalysis,
    caseAnalysis,
    outputDir
  });

  artifacts.push(...lowerBoundComparison.artifacts);

  // ============================================================================
  // PHASE 8: FORMAL PROOF DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Documenting complexity bounds with formal proofs');
  const proofDocumentation = await ctx.task(proofDocumentationTask, {
    algorithmDescription,
    pseudocode,
    modelIdentification,
    asymptoticAnalysis,
    recurrenceAnalysis,
    caseAnalysis,
    amortizedAnalysis,
    spaceComplexityAnalysis,
    lowerBoundComparison,
    outputDir
  });

  artifacts.push(...proofDocumentation.artifacts);

  // Breakpoint: Review complexity analysis
  await ctx.breakpoint({
    question: `Complexity analysis complete. Time: ${asymptoticAnalysis.bigTheta || asymptoticAnalysis.bigO}, Space: ${spaceComplexityAnalysis.spaceComplexity}. Review analysis?`,
    title: 'Algorithm Complexity Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        timeComplexity: asymptoticAnalysis.bigTheta || asymptoticAnalysis.bigO,
        spaceComplexity: spaceComplexityAnalysis.spaceComplexity,
        worstCase: caseAnalysis.worstCase,
        bestCase: caseAnalysis.bestCase,
        averageCase: caseAnalysis.averageCase,
        hasRecurrence: recurrenceAnalysis.hasRecurrence,
        amortizedComplexity: amortizedAnalysis.amortizedComplexity
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    algorithmDescription,
    complexityBounds: {
      time: {
        bigO: asymptoticAnalysis.bigO,
        bigOmega: asymptoticAnalysis.bigOmega,
        bigTheta: asymptoticAnalysis.bigTheta,
        worstCase: caseAnalysis.worstCase,
        bestCase: caseAnalysis.bestCase,
        averageCase: caseAnalysis.averageCase
      },
      space: {
        spaceComplexity: spaceComplexityAnalysis.spaceComplexity,
        auxiliarySpace: spaceComplexityAnalysis.auxiliarySpace
      },
      amortized: amortizedAnalysis.amortizedComplexity
    },
    recurrenceAnalysis: {
      hasRecurrence: recurrenceAnalysis.hasRecurrence,
      recurrenceRelation: recurrenceAnalysis.recurrenceRelation,
      solutionMethod: recurrenceAnalysis.solutionMethod,
      solution: recurrenceAnalysis.solution
    },
    lowerBoundComparison: {
      knownLowerBound: lowerBoundComparison.knownLowerBound,
      isOptimal: lowerBoundComparison.isOptimal,
      gap: lowerBoundComparison.gap
    },
    proofDocumentation: proofDocumentation.documentPath,
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/algorithm-complexity-analysis',
      timestamp: startTime,
      computationalModel,
      analysisDepth,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Computational Model Identification
export const computationalModelIdentificationTask = defineTask('computational-model-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify computational model and input representation',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'recurrence-solver', 'amortized-analysis-assistant'],
    prompt: {
      role: 'theoretical computer scientist specializing in algorithm analysis',
      task: 'Identify the appropriate computational model and input representation for complexity analysis',
      context: args,
      instructions: [
        'Determine computational model (RAM, Turing machine, word RAM, etc.)',
        'Define unit cost operations for the model',
        'Specify input representation and encoding',
        'Identify relevant input size parameters (n, m, |V|, |E|, etc.)',
        'Document assumptions about input characteristics',
        'Note any special input constraints or properties',
        'Generate computational model specification document'
      ],
      outputFormat: 'JSON with computationalModel, unitCostOperations, inputParameters, inputEncoding, assumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['computationalModel', 'inputParameters', 'artifacts'],
      properties: {
        computationalModel: { type: 'string' },
        unitCostOperations: { type: 'array', items: { type: 'string' } },
        inputParameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              description: { type: 'string' },
              typicalNotation: { type: 'string' }
            }
          }
        },
        inputEncoding: { type: 'string' },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'complexity-analysis', 'computational-model']
}));

// Task 2: Asymptotic Analysis
export const asymptoticAnalysisTask = defineTask('asymptotic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply Big-O, Big-Omega, and Big-Theta analysis',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'recurrence-solver'],
    prompt: {
      role: 'algorithm complexity analyst',
      task: 'Perform comprehensive asymptotic analysis using standard notation',
      context: args,
      instructions: [
        'Identify dominant operations in the algorithm',
        'Count operations as function of input size',
        'Derive Big-O upper bound with proof',
        'Derive Big-Omega lower bound with proof',
        'Establish Big-Theta tight bound if possible',
        'Identify any logarithmic, polynomial, or exponential factors',
        'Consider hidden constants and lower-order terms',
        'Document step-by-step derivation'
      ],
      outputFormat: 'JSON with bigO, bigOmega, bigTheta, dominantOperations, derivation, proofSketches, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['bigO', 'dominantOperations', 'artifacts'],
      properties: {
        bigO: { type: 'string' },
        bigOmega: { type: 'string' },
        bigTheta: { type: 'string' },
        dominantOperations: { type: 'array', items: { type: 'string' } },
        operationCounts: { type: 'object' },
        derivation: { type: 'string' },
        proofSketches: {
          type: 'object',
          properties: {
            bigOProof: { type: 'string' },
            bigOmegaProof: { type: 'string' },
            bigThetaProof: { type: 'string' }
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
  labels: ['agent', 'complexity-analysis', 'asymptotic-notation']
}));

// Task 3: Recurrence Relation Analysis
export const recurrenceRelationAnalysisTask = defineTask('recurrence-relation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Solve recurrence relations',
  agent: {
    name: 'algorithm-analyst',
    skills: ['recurrence-solver', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'mathematician specializing in discrete mathematics and recurrences',
      task: 'Derive and solve recurrence relations for recursive algorithms',
      context: args,
      instructions: [
        'Identify if algorithm has recursive structure',
        'Derive recurrence relation T(n) from algorithm structure',
        'Identify base case(s) for the recurrence',
        'Apply Master Theorem if applicable (T(n) = aT(n/b) + f(n))',
        'Use substitution method if Master Theorem does not apply',
        'Consider recursion tree method for verification',
        'Handle non-standard recurrences (unbalanced, multiple terms)',
        'Document complete solution with all steps'
      ],
      outputFormat: 'JSON with hasRecurrence, recurrenceRelation, baseCases, solutionMethod, solution, proofSteps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hasRecurrence', 'artifacts'],
      properties: {
        hasRecurrence: { type: 'boolean' },
        recurrenceRelation: { type: 'string' },
        baseCases: { type: 'array', items: { type: 'string' } },
        solutionMethod: { type: 'string', enum: ['master-theorem', 'substitution', 'recursion-tree', 'generating-functions', 'not-applicable'] },
        masterTheoremCase: { type: 'string' },
        solution: { type: 'string' },
        proofSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'complexity-analysis', 'recurrence-relations']
}));

// Task 4: Case Analysis
export const caseAnalysisTask = defineTask('case-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze best-case, worst-case, and average-case complexity',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator'],
    prompt: {
      role: 'algorithm analyst specializing in complexity case analysis',
      task: 'Perform comprehensive case analysis for algorithm complexity',
      context: args,
      instructions: [
        'Identify worst-case input and analyze complexity',
        'Identify best-case input and analyze complexity',
        'Define probability distribution over inputs for average case',
        'Compute expected running time for average case',
        'Document input characteristics for each case',
        'Identify when cases differ significantly',
        'Provide concrete example inputs for each case',
        'Generate case analysis report'
      ],
      outputFormat: 'JSON with worstCase, bestCase, averageCase, inputCharacteristics, exampleInputs, caseComparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['worstCase', 'bestCase', 'artifacts'],
      properties: {
        worstCase: {
          type: 'object',
          properties: {
            complexity: { type: 'string' },
            inputCharacteristics: { type: 'string' },
            exampleInput: { type: 'string' }
          }
        },
        bestCase: {
          type: 'object',
          properties: {
            complexity: { type: 'string' },
            inputCharacteristics: { type: 'string' },
            exampleInput: { type: 'string' }
          }
        },
        averageCase: {
          type: 'object',
          properties: {
            complexity: { type: 'string' },
            probabilityDistribution: { type: 'string' },
            derivation: { type: 'string' }
          }
        },
        caseComparison: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'complexity-analysis', 'case-analysis']
}));

// Task 5: Amortized Analysis
export const amortizedAnalysisTask = defineTask('amortized-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform amortized analysis for operation sequences',
  agent: {
    name: 'algorithm-analyst',
    skills: ['amortized-analysis-assistant'],
    prompt: {
      role: 'algorithm analyst specializing in amortized analysis',
      task: 'Analyze amortized cost of operations over sequences',
      context: args,
      instructions: [
        'Determine if amortized analysis is applicable',
        'Apply aggregate method: total cost / number of operations',
        'Apply accounting method: assign amortized costs, track credits',
        'Apply potential method: define potential function',
        'Verify amortized bounds are valid',
        'Document when amortized analysis provides tighter bounds',
        'Compare amortized vs worst-case complexity',
        'Generate amortized analysis report'
      ],
      outputFormat: 'JSON with isApplicable, amortizedComplexity, analysisMethod, aggregateCost, potentialFunction, comparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isApplicable', 'artifacts'],
      properties: {
        isApplicable: { type: 'boolean' },
        amortizedComplexity: { type: 'string' },
        analysisMethod: { type: 'string', enum: ['aggregate', 'accounting', 'potential', 'not-applicable'] },
        aggregateCost: { type: 'string' },
        accountingScheme: { type: 'object' },
        potentialFunction: { type: 'string' },
        comparison: {
          type: 'object',
          properties: {
            worstCase: { type: 'string' },
            amortized: { type: 'string' },
            improvementFactor: { type: 'string' }
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
  labels: ['agent', 'complexity-analysis', 'amortized-analysis']
}));

// Task 6: Space Complexity Analysis
export const spaceComplexityAnalysisTask = defineTask('space-complexity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze space complexity',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator'],
    prompt: {
      role: 'algorithm analyst specializing in space complexity',
      task: 'Analyze memory usage and space complexity of the algorithm',
      context: args,
      instructions: [
        'Identify all memory allocations in the algorithm',
        'Analyze stack space for recursive calls',
        'Analyze heap space for dynamic allocations',
        'Compute auxiliary space (excluding input)',
        'Compute total space complexity',
        'Identify space-time tradeoffs if any',
        'Consider in-place vs out-of-place variants',
        'Document memory usage patterns'
      ],
      outputFormat: 'JSON with spaceComplexity, auxiliarySpace, stackSpace, heapSpace, memoryPatterns, tradeoffs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['spaceComplexity', 'auxiliarySpace', 'artifacts'],
      properties: {
        spaceComplexity: { type: 'string' },
        auxiliarySpace: { type: 'string' },
        stackSpace: { type: 'string' },
        heapSpace: { type: 'string' },
        memoryPatterns: { type: 'array', items: { type: 'string' } },
        tradeoffs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variant: { type: 'string' },
              timeComplexity: { type: 'string' },
              spaceComplexity: { type: 'string' }
            }
          }
        },
        isInPlace: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'complexity-analysis', 'space-complexity']
}));

// Task 7: Lower Bound Comparison
export const lowerBoundComparisonTask = defineTask('lower-bound-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare with known lower bounds',
  agent: {
    name: 'complexity-theorist',
    skills: ['asymptotic-notation-calculator', 'complexity-class-oracle'],
    prompt: {
      role: 'complexity theorist',
      task: 'Compare algorithm complexity with known lower bounds for the problem',
      context: args,
      instructions: [
        'Identify the computational problem being solved',
        'Research known lower bounds for the problem',
        'Determine if algorithm achieves optimal complexity',
        'Analyze gap between algorithm and lower bound',
        'Consider information-theoretic lower bounds',
        'Consider adversarial lower bounds',
        'Document any conditional lower bounds',
        'Assess optimality and improvement potential'
      ],
      outputFormat: 'JSON with knownLowerBound, isOptimal, gap, lowerBoundType, improvementPotential, references, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['knownLowerBound', 'isOptimal', 'artifacts'],
      properties: {
        knownLowerBound: { type: 'string' },
        lowerBoundType: { type: 'string', enum: ['information-theoretic', 'adversarial', 'decision-tree', 'algebraic', 'unknown'] },
        isOptimal: { type: 'boolean' },
        gap: { type: 'string' },
        gapAnalysis: { type: 'string' },
        improvementPotential: { type: 'string' },
        references: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'complexity-analysis', 'lower-bounds']
}));

// Task 8: Proof Documentation
export const proofDocumentationTask = defineTask('proof-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document complexity bounds with formal proofs',
  agent: {
    name: 'algorithm-analyst',
    skills: ['latex-proof-formatter', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'technical writer specializing in mathematical proofs',
      task: 'Create comprehensive complexity analysis report with formal proofs',
      context: args,
      instructions: [
        'Create executive summary of complexity analysis',
        'Document computational model and assumptions',
        'Present asymptotic bounds with complete proofs',
        'Include recurrence relation derivations and solutions',
        'Document case analysis with example inputs',
        'Include amortized analysis if applicable',
        'Present space complexity analysis',
        'Compare with known lower bounds',
        'Use proper mathematical notation (LaTeX-style)',
        'Include diagrams for recursion trees if needed',
        'Format as professional academic-style document'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, keyResults, proofCompleteness, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'keyResults', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyResults: {
          type: 'object',
          properties: {
            timeComplexity: { type: 'string' },
            spaceComplexity: { type: 'string' },
            isOptimal: { type: 'boolean' }
          }
        },
        proofCompleteness: {
          type: 'object',
          properties: {
            upperBoundProved: { type: 'boolean' },
            lowerBoundProved: { type: 'boolean' },
            tightBoundEstablished: { type: 'boolean' }
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
  labels: ['agent', 'complexity-analysis', 'documentation', 'proofs']
}));
