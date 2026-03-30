/**
 * @process scientific-discovery/complexity-analysis-reasoning
 * @description Evaluate algorithmic performance under worst-case, average-case, and amortized cost models
 * @inputs { algorithm: object, inputModel: object, operations: array, outputDir: string }
 * @outputs { success: boolean, complexityAnalysis: object, worstCase: object, averageCase: object, amortized: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    algorithm = {},
    inputModel = {},
    operations = [],
    outputDir = 'complexity-analysis-output',
    targetRigor = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Complexity Analysis Reasoning Process');

  // ============================================================================
  // PHASE 1: ALGORITHM CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Characterizing the algorithm');
  const algorithmCharacterization = await ctx.task(algorithmCharacterizationTask, {
    algorithm,
    operations,
    outputDir
  });

  artifacts.push(...algorithmCharacterization.artifacts);

  // ============================================================================
  // PHASE 2: INPUT MODEL SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Specifying input model');
  const inputModelSpec = await ctx.task(inputModelSpecificationTask, {
    inputModel,
    algorithm: algorithmCharacterization.characterization,
    outputDir
  });

  artifacts.push(...inputModelSpec.artifacts);

  // ============================================================================
  // PHASE 3: WORST-CASE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Performing worst-case analysis');
  const worstCaseAnalysis = await ctx.task(worstCaseAnalysisTask, {
    algorithm: algorithmCharacterization.characterization,
    inputModel: inputModelSpec.model,
    outputDir
  });

  artifacts.push(...worstCaseAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: AVERAGE-CASE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Performing average-case analysis');
  const averageCaseAnalysis = await ctx.task(averageCaseAnalysisTask, {
    algorithm: algorithmCharacterization.characterization,
    inputModel: inputModelSpec.model,
    outputDir
  });

  artifacts.push(...averageCaseAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: AMORTIZED ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Performing amortized analysis');
  const amortizedAnalysis = await ctx.task(amortizedAnalysisTask, {
    algorithm: algorithmCharacterization.characterization,
    operations,
    outputDir
  });

  artifacts.push(...amortizedAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: SPACE COMPLEXITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing space complexity');
  const spaceAnalysis = await ctx.task(spaceComplexityAnalysisTask, {
    algorithm: algorithmCharacterization.characterization,
    inputModel: inputModelSpec.model,
    outputDir
  });

  artifacts.push(...spaceAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: ASYMPTOTIC COMPARISON
  // ============================================================================

  ctx.log('info', 'Phase 7: Comparing asymptotic bounds');
  const asymptoticComparison = await ctx.task(asymptoticComparisonTask, {
    worstCase: worstCaseAnalysis.analysis,
    averageCase: averageCaseAnalysis.analysis,
    amortized: amortizedAnalysis.analysis,
    space: spaceAnalysis.analysis,
    outputDir
  });

  artifacts.push(...asymptoticComparison.artifacts);

  // ============================================================================
  // PHASE 8: SYNTHESIS AND PRACTICAL IMPLICATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing complexity analysis');
  const synthesis = await ctx.task(complexitySynthesisTask, {
    algorithmCharacterization,
    inputModelSpec,
    worstCaseAnalysis,
    averageCaseAnalysis,
    amortizedAnalysis,
    spaceAnalysis,
    asymptoticComparison,
    targetRigor,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  const rigorMet = synthesis.rigorScore >= targetRigor;

  // Breakpoint: Review complexity analysis
  await ctx.breakpoint({
    question: `Complexity analysis complete. Rigor: ${synthesis.rigorScore}/${targetRigor}. ${rigorMet ? 'Rigor target met!' : 'Additional analysis may be needed.'} Review analysis?`,
    title: 'Complexity Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        algorithm: algorithmCharacterization.characterization.name,
        worstCase: worstCaseAnalysis.analysis.bigO,
        averageCase: averageCaseAnalysis.analysis.bigO,
        amortized: amortizedAnalysis.analysis.amortizedCost,
        space: spaceAnalysis.analysis.bigO,
        rigorScore: synthesis.rigorScore,
        rigorMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    algorithm: algorithmCharacterization.characterization,
    complexityAnalysis: {
      time: {
        worstCase: worstCaseAnalysis.analysis.bigO,
        averageCase: averageCaseAnalysis.analysis.bigO,
        amortized: amortizedAnalysis.analysis.amortizedCost
      },
      space: spaceAnalysis.analysis.bigO
    },
    worstCase: worstCaseAnalysis.analysis,
    averageCase: averageCaseAnalysis.analysis,
    amortized: amortizedAnalysis.analysis,
    space: spaceAnalysis.analysis,
    comparison: asymptoticComparison.comparison,
    practicalImplications: synthesis.practicalImplications,
    rigorScore: synthesis.rigorScore,
    rigorMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/complexity-analysis-reasoning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Algorithm Characterization
export const algorithmCharacterizationTask = defineTask('algorithm-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize the algorithm',
  agent: {
    name: 'algorithm-analyst',
    prompt: {
      role: 'algorithm analyst',
      task: 'Characterize the algorithm for complexity analysis',
      context: args,
      instructions: [
        'Identify the algorithm:',
        '  - Name and purpose',
        '  - Input and output',
        '  - Basic operations',
        'Analyze algorithm structure:',
        '  - Loops and recursion',
        '  - Conditional branches',
        '  - Data structure operations',
        'Identify cost model:',
        '  - What operations count as basic?',
        '  - Unit cost or variable cost?',
        'Identify parameters affecting complexity:',
        '  - Input size measure(s)',
        '  - Other relevant parameters',
        'Document algorithm pseudocode/structure',
        'Save characterization to output directory'
      ],
      outputFormat: 'JSON with characterization (name, purpose, io, structure, costModel, parameters), pseudocode, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['characterization', 'artifacts'],
      properties: {
        characterization: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            purpose: { type: 'string' },
            input: { type: 'object' },
            output: { type: 'object' },
            structure: {
              type: 'object',
              properties: {
                loops: { type: 'array', items: { type: 'object' } },
                recursion: { type: 'object' },
                branches: { type: 'array', items: { type: 'object' } }
              }
            },
            costModel: { type: 'object' },
            sizeParameters: { type: 'array', items: { type: 'string' } }
          }
        },
        pseudocode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'complexity-analysis', 'characterization']
}));

// Task 2: Input Model Specification
export const inputModelSpecificationTask = defineTask('input-model-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify input model',
  agent: {
    name: 'input-modeler',
    prompt: {
      role: 'probabilistic analysis specialist',
      task: 'Specify the input model for complexity analysis',
      context: args,
      instructions: [
        'Define input size measure(s):',
        '  - What does n represent?',
        '  - Are there multiple parameters?',
        'For average-case analysis, specify input distribution:',
        '  - Uniform distribution over inputs?',
        '  - Random permutation model?',
        '  - Probabilistic input generation?',
        'Characterize input space:',
        '  - All possible inputs of size n',
        '  - Constraints on inputs',
        '  - Typical vs. pathological inputs',
        'Identify worst-case input patterns',
        'Identify best-case input patterns',
        'Save input model to output directory'
      ],
      outputFormat: 'JSON with model (sizeMeasure, distribution, inputSpace, worstCasePatterns, bestCasePatterns), assumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'assumptions', 'artifacts'],
      properties: {
        model: {
          type: 'object',
          properties: {
            sizeMeasure: { type: 'string' },
            distribution: { type: 'string' },
            inputSpace: { type: 'object' },
            worstCasePatterns: { type: 'array', items: { type: 'string' } },
            bestCasePatterns: { type: 'array', items: { type: 'string' } }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'complexity-analysis', 'input-model']
}));

// Task 3: Worst-Case Analysis
export const worstCaseAnalysisTask = defineTask('worst-case-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform worst-case analysis',
  agent: {
    name: 'worst-case-analyst',
    prompt: {
      role: 'complexity theorist specializing in worst-case analysis',
      task: 'Analyze worst-case time complexity',
      context: args,
      instructions: [
        'Identify the worst-case input:',
        '  - What input maximizes running time?',
        '  - Construct explicit worst-case instance',
        'Derive upper bound (Big-O):',
        '  - Count operations in worst case',
        '  - Express as function of input size',
        '  - Simplify to asymptotic notation',
        'Derive lower bound (Big-Omega) if possible:',
        '  - Prove algorithm must do at least this much',
        '  - Match to upper bound for tight bound (Big-Theta)',
        'Analyze recurrence relations for recursive algorithms:',
        '  - Write recurrence',
        '  - Solve using Master Theorem or other methods',
        'Provide formal proof of complexity claim',
        'Save worst-case analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (bigO, bigOmega, bigTheta, worstCaseInput, derivation, recurrence), proof, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'proof', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            bigO: { type: 'string' },
            bigOmega: { type: 'string' },
            bigTheta: { type: 'string' },
            worstCaseInput: { type: 'string' },
            derivation: { type: 'string' },
            recurrence: { type: 'string' }
          }
        },
        proof: { type: 'string' },
        constants: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'complexity-analysis', 'worst-case']
}));

// Task 4: Average-Case Analysis
export const averageCaseAnalysisTask = defineTask('average-case-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform average-case analysis',
  agent: {
    name: 'average-case-analyst',
    prompt: {
      role: 'probabilistic algorithm analyst',
      task: 'Analyze average-case time complexity',
      context: args,
      instructions: [
        'Specify the probabilistic model:',
        '  - Distribution over inputs',
        '  - Assumptions about randomness',
        'Calculate expected running time:',
        '  - E[T(n)] = Σ P(input) × T(input)',
        '  - Use indicator random variables if helpful',
        'Derive expected complexity:',
        '  - Express as function of n',
        '  - Simplify to asymptotic notation',
        'Analyze variance if possible:',
        '  - How much does running time vary?',
        '  - Standard deviation or high-probability bounds',
        'Compare to worst-case:',
        '  - Same or different asymptotically?',
        '  - When does average case help?',
        'Save average-case analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (bigO, expectedTime, derivation, variance), probabilisticModel, comparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'probabilisticModel', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            bigO: { type: 'string' },
            expectedTime: { type: 'string' },
            derivation: { type: 'string' },
            variance: { type: 'string' },
            concentration: { type: 'string' }
          }
        },
        probabilisticModel: { type: 'string' },
        comparison: {
          type: 'object',
          properties: {
            worstVsAverage: { type: 'string' },
            significantDifference: { type: 'boolean' }
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
  labels: ['agent', 'complexity-analysis', 'average-case']
}));

// Task 5: Amortized Analysis
export const amortizedAnalysisTask = defineTask('amortized-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform amortized analysis',
  agent: {
    name: 'amortized-analyst',
    prompt: {
      role: 'data structure analyst specializing in amortized analysis',
      task: 'Analyze amortized cost of operations',
      context: args,
      instructions: [
        'Identify operations for amortized analysis:',
        '  - Operations with variable cost',
        '  - Sequences of operations',
        'Apply amortized analysis techniques:',
        '  1. Aggregate method:',
        '     - Total cost of n operations',
        '     - Amortized = Total / n',
        '  2. Accounting method:',
        '     - Assign charges to operations',
        '     - Overcharge some, save credit',
        '     - Use credit for expensive operations',
        '  3. Potential method:',
        '     - Define potential function Φ',
        '     - Amortized cost = actual + ΔΦ',
        '     - Choose Φ to simplify analysis',
        'Prove amortized bound is valid',
        'Provide examples of operation sequences',
        'Save amortized analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (amortizedCost, method, derivation, potentialFunction), examples, proof, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'proof', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            amortizedCost: { type: 'string' },
            method: { type: 'string', enum: ['aggregate', 'accounting', 'potential'] },
            derivation: { type: 'string' },
            potentialFunction: { type: 'string' },
            accountingScheme: { type: 'object' }
          }
        },
        examples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sequence: { type: 'string' },
              actualCost: { type: 'string' },
              amortizedCost: { type: 'string' }
            }
          }
        },
        proof: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'complexity-analysis', 'amortized']
}));

// Task 6: Space Complexity Analysis
export const spaceComplexityAnalysisTask = defineTask('space-complexity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze space complexity',
  agent: {
    name: 'space-analyst',
    prompt: {
      role: 'algorithm analyst specializing in space complexity',
      task: 'Analyze space/memory complexity',
      context: args,
      instructions: [
        'Identify space usage components:',
        '  - Input storage',
        '  - Auxiliary space (extra memory)',
        '  - Output storage',
        '  - Stack space (for recursion)',
        'Analyze auxiliary space complexity:',
        '  - What extra memory is allocated?',
        '  - How does it scale with input size?',
        'For recursive algorithms:',
        '  - Maximum recursion depth',
        '  - Stack frame size',
        '  - Total stack space',
        'Distinguish:',
        '  - In-place algorithms (O(1) extra space)',
        '  - Linear space algorithms',
        '  - etc.',
        'Consider time-space tradeoffs',
        'Save space analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (bigO, components, auxiliarySpace, stackSpace), tradeoffs, inPlace, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'tradeoffs', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            bigO: { type: 'string' },
            components: {
              type: 'object',
              properties: {
                input: { type: 'string' },
                auxiliary: { type: 'string' },
                output: { type: 'string' },
                stack: { type: 'string' }
              }
            },
            auxiliarySpace: { type: 'string' },
            stackSpace: { type: 'string' }
          }
        },
        inPlace: { type: 'boolean' },
        tradeoffs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              timeComplexity: { type: 'string' },
              spaceComplexity: { type: 'string' }
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
  labels: ['agent', 'complexity-analysis', 'space']
}));

// Task 7: Asymptotic Comparison
export const asymptoticComparisonTask = defineTask('asymptotic-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare asymptotic bounds',
  agent: {
    name: 'asymptotic-comparator',
    prompt: {
      role: 'algorithm theorist',
      task: 'Compare and relate the different complexity measures',
      context: args,
      instructions: [
        'Compare the different complexity measures:',
        '  - Worst-case vs. average-case',
        '  - Worst-case vs. amortized',
        '  - Time vs. space tradeoffs',
        'Identify relationships:',
        '  - Best-case ≤ Average-case ≤ Worst-case',
        '  - Amortized ≤ Worst-case (for sequences)',
        'Determine when each measure is most relevant:',
        '  - Real-time systems: worst-case matters',
        '  - Typical use: average-case matters',
        '  - Data structures: amortized often appropriate',
        'Compare to known algorithms:',
        '  - Is this competitive?',
        '  - Are there better alternatives?',
        'Identify optimality (if known lower bounds exist)',
        'Save comparison to output directory'
      ],
      outputFormat: 'JSON with comparison (measures, relationships, whenRelevant), alternatives, optimality, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['comparison', 'alternatives', 'artifacts'],
      properties: {
        comparison: {
          type: 'object',
          properties: {
            measures: { type: 'object' },
            relationships: { type: 'array', items: { type: 'string' } },
            whenRelevant: {
              type: 'object',
              properties: {
                worstCase: { type: 'string' },
                averageCase: { type: 'string' },
                amortized: { type: 'string' }
              }
            }
          }
        },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              algorithm: { type: 'string' },
              complexity: { type: 'string' },
              comparison: { type: 'string' }
            }
          }
        },
        optimality: {
          type: 'object',
          properties: {
            lowerBound: { type: 'string' },
            isOptimal: { type: 'boolean' },
            gap: { type: 'string' }
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
  labels: ['agent', 'complexity-analysis', 'comparison']
}));

// Task 8: Complexity Synthesis
export const complexitySynthesisTask = defineTask('complexity-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize complexity analysis',
  agent: {
    name: 'synthesis-specialist',
    prompt: {
      role: 'senior algorithm analyst',
      task: 'Synthesize complexity analysis results',
      context: args,
      instructions: [
        'Summarize all complexity results:',
        '  - Time: worst, average, amortized',
        '  - Space complexity',
        '  - Key findings',
        'Assess analysis rigor (0-100):',
        '  - Proofs complete?',
        '  - Bounds tight?',
        '  - Assumptions clear?',
        '  - Methods appropriate?',
        'State practical implications:',
        '  - When to use this algorithm',
        '  - Expected performance in practice',
        '  - Scalability assessment',
        'Provide recommendations',
        'Identify open questions',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with summary, rigorScore, practicalImplications, recommendations, openQuestions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'rigorScore', 'practicalImplications', 'artifacts'],
      properties: {
        summary: {
          type: 'object',
          properties: {
            time: { type: 'object' },
            space: { type: 'string' },
            keyFindings: { type: 'array', items: { type: 'string' } }
          }
        },
        rigorScore: { type: 'number', minimum: 0, maximum: 100 },
        practicalImplications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              implication: { type: 'string' },
              context: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        openQuestions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'complexity-analysis', 'synthesis']
}));
