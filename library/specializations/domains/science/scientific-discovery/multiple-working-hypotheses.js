/**
 * @process scientific-discovery/multiple-working-hypotheses
 * @description Multiple Working Hypotheses process - Develop and maintain several plausible hypotheses in parallel to avoid premature commitment
 * @inputs { phenomenon: string, observations: array, existingHypotheses: array, maxHypotheses: number, outputDir: string }
 * @outputs { success: boolean, hypotheses: array, comparativeAnalysis: object, crucialTests: array, recommendations: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    phenomenon = '',
    observations = [],
    existingHypotheses = [],
    maxHypotheses = 5,
    outputDir = 'multiple-hypotheses-output',
    eliminationThreshold = 0.2
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Multiple Working Hypotheses Process');

  // ============================================================================
  // PHASE 1: PHENOMENON CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Characterizing the phenomenon to be explained');
  const phenomenonCharacterization = await ctx.task(phenomenonCharacterizationTask, {
    phenomenon,
    observations,
    outputDir
  });

  artifacts.push(...phenomenonCharacterization.artifacts);

  // ============================================================================
  // PHASE 2: HYPOTHESIS GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Generating diverse hypotheses');
  const hypothesisGeneration = await ctx.task(hypothesisGenerationTask, {
    phenomenon,
    observationPatterns: phenomenonCharacterization.patterns,
    existingHypotheses,
    maxHypotheses,
    outputDir
  });

  artifacts.push(...hypothesisGeneration.artifacts);

  // ============================================================================
  // PHASE 3: HYPOTHESIS DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing each hypothesis in detail');
  const hypothesisDevelopment = await ctx.task(hypothesisDevelopmentTask, {
    hypotheses: hypothesisGeneration.hypotheses,
    phenomenon,
    observations,
    outputDir
  });

  artifacts.push(...hypothesisDevelopment.artifacts);

  // Breakpoint: Review generated hypotheses
  await ctx.breakpoint({
    question: `Generated ${hypothesisDevelopment.developedHypotheses.length} working hypotheses for "${phenomenon}". Review before comparative analysis?`,
    title: 'Working Hypotheses Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        phenomenon,
        hypothesisCount: hypothesisDevelopment.developedHypotheses.length,
        observationCount: observations.length
      }
    }
  });

  // ============================================================================
  // PHASE 4: COMPARATIVE EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Comparative evaluation of hypotheses');
  const comparativeEvaluation = await ctx.task(comparativeEvaluationTask, {
    hypotheses: hypothesisDevelopment.developedHypotheses,
    observations,
    phenomenon,
    outputDir
  });

  artifacts.push(...comparativeEvaluation.artifacts);

  // ============================================================================
  // PHASE 5: CRUCIAL TEST IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying crucial discriminating tests');
  const crucialTestIdentification = await ctx.task(crucialTestIdentificationTask, {
    hypotheses: hypothesisDevelopment.developedHypotheses,
    comparativeAnalysis: comparativeEvaluation.analysis,
    outputDir
  });

  artifacts.push(...crucialTestIdentification.artifacts);

  // ============================================================================
  // PHASE 6: HYPOTHESIS REFINEMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Refining hypotheses based on analysis');
  const hypothesisRefinement = await ctx.task(hypothesisRefinementTask, {
    hypotheses: hypothesisDevelopment.developedHypotheses,
    comparativeAnalysis: comparativeEvaluation.analysis,
    crucialTests: crucialTestIdentification.crucialTests,
    eliminationThreshold,
    outputDir
  });

  artifacts.push(...hypothesisRefinement.artifacts);

  // ============================================================================
  // PHASE 7: RESEARCH STRATEGY FORMULATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Formulating research strategy');
  const strategyFormulation = await ctx.task(researchStrategyTask, {
    activeHypotheses: hypothesisRefinement.activeHypotheses,
    crucialTests: crucialTestIdentification.crucialTests,
    comparativeAnalysis: comparativeEvaluation.analysis,
    outputDir
  });

  artifacts.push(...strategyFormulation.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Multiple hypotheses analysis complete. ${hypothesisRefinement.activeHypotheses.length} active hypotheses remain. ${crucialTestIdentification.crucialTests.length} crucial tests identified. Review research strategy?`,
    title: 'Multiple Hypotheses Analysis Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        phenomenon,
        activeHypotheses: hypothesisRefinement.activeHypotheses.length,
        eliminatedHypotheses: hypothesisRefinement.eliminatedHypotheses.length,
        crucialTests: crucialTestIdentification.crucialTests.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    phenomenon,
    hypotheses: {
      active: hypothesisRefinement.activeHypotheses,
      eliminated: hypothesisRefinement.eliminatedHypotheses,
      merged: hypothesisRefinement.mergedHypotheses
    },
    comparativeAnalysis: comparativeEvaluation.analysis,
    crucialTests: crucialTestIdentification.crucialTests,
    researchStrategy: strategyFormulation.strategy,
    recommendations: {
      prioritizedTests: strategyFormulation.prioritizedTests,
      dataNeeds: strategyFormulation.dataNeeds,
      nextSteps: strategyFormulation.nextSteps
    },
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/multiple-working-hypotheses',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Phenomenon Characterization
export const phenomenonCharacterizationTask = defineTask('phenomenon-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize the phenomenon to be explained',
  agent: {
    name: 'phenomenon-analyst',
    prompt: {
      role: 'empirical scientist and pattern analyst',
      task: 'Thoroughly characterize the phenomenon that needs to be explained',
      context: args,
      instructions: [
        'Document all known observations of the phenomenon',
        'Identify patterns and regularities',
        'Note anomalies and exceptions',
        'Characterize boundary conditions',
        'Identify what varies and what is constant',
        'Document temporal patterns',
        'Note spatial patterns',
        'Identify correlations with other phenomena',
        'Document what is NOT observed (negative evidence)',
        'List key features any hypothesis must explain',
        'Save characterization to output directory'
      ],
      outputFormat: 'JSON with patterns, anomalies, boundaryConditions, keyFeatures, negativeEvidence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'keyFeatures', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              frequency: { type: 'string' },
              conditions: { type: 'string' }
            }
          }
        },
        anomalies: { type: 'array', items: { type: 'string' } },
        boundaryConditions: { type: 'array', items: { type: 'string' } },
        temporalPatterns: { type: 'array', items: { type: 'string' } },
        spatialPatterns: { type: 'array', items: { type: 'string' } },
        correlations: { type: 'array', items: { type: 'string' } },
        negativeEvidence: { type: 'array', items: { type: 'string' } },
        keyFeatures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'multiple-hypotheses', 'phenomenon-characterization']
}));

// Task 2: Hypothesis Generation
export const hypothesisGenerationTask = defineTask('hypothesis-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate diverse hypotheses',
  agent: {
    name: 'hypothesis-generator',
    prompt: {
      role: 'creative scientist generating explanatory hypotheses',
      task: 'Generate a diverse set of plausible hypotheses to explain the phenomenon',
      context: args,
      instructions: [
        'Generate multiple distinct hypotheses (aim for maxHypotheses)',
        'Ensure hypotheses are genuinely different, not variants',
        'Include conventional explanations',
        'Include unconventional or novel explanations',
        'Consider explanations at different scales',
        'Consider different causal mechanisms',
        'Avoid premature commitment to any hypothesis',
        'Ensure each hypothesis is testable in principle',
        'Note the type of explanation each represents',
        'Include null hypothesis if appropriate',
        'Save hypotheses to output directory'
      ],
      outputFormat: 'JSON with hypotheses (array with name, statement, type, mechanism, novelty), diversityAssessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hypotheses', 'artifacts'],
      properties: {
        hypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              statement: { type: 'string' },
              type: { type: 'string' },
              mechanism: { type: 'string' },
              novelty: { type: 'string' },
              inspiration: { type: 'string' }
            }
          }
        },
        diversityAssessment: { type: 'string' },
        dimensionsCovered: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'multiple-hypotheses', 'hypothesis-generation']
}));

// Task 3: Hypothesis Development
export const hypothesisDevelopmentTask = defineTask('hypothesis-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop each hypothesis in detail',
  agent: {
    name: 'hypothesis-developer',
    prompt: {
      role: 'theoretical scientist developing hypotheses',
      task: 'Develop each hypothesis into a detailed, testable form',
      context: args,
      instructions: [
        'For each hypothesis, elaborate the mechanism in detail',
        'Specify what the hypothesis predicts',
        'Identify auxiliary assumptions needed',
        'Determine boundary conditions for hypothesis',
        'Note what evidence would support the hypothesis',
        'Note what evidence would refute the hypothesis',
        'Identify parameters or quantities involved',
        'Rate initial plausibility based on prior knowledge',
        'Note connections to established theory',
        'Identify weak points in the hypothesis',
        'Save developed hypotheses to output directory'
      ],
      outputFormat: 'JSON with developedHypotheses (array with full development details), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['developedHypotheses', 'artifacts'],
      properties: {
        developedHypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              detailedMechanism: { type: 'string' },
              predictions: { type: 'array', items: { type: 'string' } },
              auxiliaryAssumptions: { type: 'array', items: { type: 'string' } },
              boundaryConditions: { type: 'array', items: { type: 'string' } },
              supportingEvidence: { type: 'array', items: { type: 'string' } },
              refutingEvidence: { type: 'array', items: { type: 'string' } },
              initialPlausibility: { type: 'number' },
              theoreticalConnections: { type: 'array', items: { type: 'string' } },
              weakPoints: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'scientific-discovery', 'multiple-hypotheses', 'hypothesis-development']
}));

// Task 4: Comparative Evaluation
export const comparativeEvaluationTask = defineTask('comparative-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Comparative evaluation of hypotheses',
  agent: {
    name: 'hypothesis-evaluator',
    prompt: {
      role: 'scientific evaluator comparing hypotheses',
      task: 'Systematically compare hypotheses against each other and the evidence',
      context: args,
      instructions: [
        'Evaluate each hypothesis against each observation',
        'Create comparison matrix: hypothesis vs observation',
        'Rate how well each hypothesis explains each observation',
        'Identify observations that discriminate between hypotheses',
        'Calculate explanatory power score for each hypothesis',
        'Assess parsimony of each hypothesis',
        'Evaluate consistency with established knowledge',
        'Identify which hypotheses can coexist',
        'Identify which hypotheses are mutually exclusive',
        'Note where hypotheses make identical predictions',
        'Save comparative analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (comparisonMatrix, scores, discriminatingObservations, coexistenceAnalysis), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            comparisonMatrix: { type: 'object' },
            explanatoryPowerScores: { type: 'object' },
            parsimonyScores: { type: 'object' },
            consistencyScores: { type: 'object' },
            overallScores: { type: 'object' },
            discriminatingObservations: { type: 'array', items: { type: 'string' } },
            nonDiscriminatingObservations: { type: 'array', items: { type: 'string' } },
            coexistentPairs: { type: 'array' },
            mutuallyExclusivePairs: { type: 'array' }
          }
        },
        ranking: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesisId: { type: 'string' },
              rank: { type: 'number' },
              score: { type: 'number' }
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
  labels: ['agent', 'scientific-discovery', 'multiple-hypotheses', 'comparative-evaluation']
}));

// Task 5: Crucial Test Identification
export const crucialTestIdentificationTask = defineTask('crucial-test-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify crucial discriminating tests',
  agent: {
    name: 'test-designer',
    prompt: {
      role: 'experimental scientist designing crucial tests',
      task: 'Identify tests that can decisively discriminate between competing hypotheses',
      context: args,
      instructions: [
        'Identify predictions where hypotheses differ',
        'Design tests targeting these differences',
        'Prioritize tests that discriminate multiple hypotheses',
        'Assess feasibility of each test',
        'Identify "crucial experiments" that are decisive',
        'Design tests to reveal which hypothesis is correct',
        'Consider natural experiments or observations',
        'Note tests that would eliminate vs confirm hypotheses',
        'Design robust tests (insensitive to auxiliary assumptions)',
        'Save crucial tests to output directory'
      ],
      outputFormat: 'JSON with crucialTests (array with test, discriminates, predictions, feasibility, decisiveness), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['crucialTests', 'artifacts'],
      properties: {
        crucialTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              testName: { type: 'string' },
              description: { type: 'string' },
              discriminatesBetween: { type: 'array', items: { type: 'string' } },
              predictions: { type: 'object' },
              feasibility: { type: 'string' },
              decisiveness: { type: 'string' },
              resourcesRequired: { type: 'string' },
              robustness: { type: 'string' }
            }
          }
        },
        testMatrix: { type: 'object' },
        mostDecisiveTest: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'multiple-hypotheses', 'crucial-tests']
}));

// Task 6: Hypothesis Refinement
export const hypothesisRefinementTask = defineTask('hypothesis-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refine hypotheses based on analysis',
  agent: {
    name: 'hypothesis-refiner',
    prompt: {
      role: 'theoretical scientist refining hypotheses',
      task: 'Refine, merge, or eliminate hypotheses based on comparative analysis',
      context: args,
      instructions: [
        'Identify hypotheses below elimination threshold',
        'Justify elimination of weak hypotheses',
        'Identify hypotheses that could be merged',
        'Refine remaining hypotheses based on analysis',
        'Strengthen weak points in viable hypotheses',
        'Adjust plausibility estimates based on evidence',
        'Maintain diversity among active hypotheses',
        'Document reasoning for all decisions',
        'Keep eliminated hypotheses on record',
        'Save refinement results to output directory'
      ],
      outputFormat: 'JSON with activeHypotheses, eliminatedHypotheses, mergedHypotheses, refinementDetails, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['activeHypotheses', 'eliminatedHypotheses', 'artifacts'],
      properties: {
        activeHypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              refinedStatement: { type: 'string' },
              updatedPlausibility: { type: 'number' },
              refinements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        eliminatedHypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              eliminationReason: { type: 'string' },
              finalScore: { type: 'number' }
            }
          }
        },
        mergedHypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              newId: { type: 'string' },
              mergedFrom: { type: 'array', items: { type: 'string' } },
              rationale: { type: 'string' }
            }
          }
        },
        diversityMaintained: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'multiple-hypotheses', 'hypothesis-refinement']
}));

// Task 7: Research Strategy Formulation
export const researchStrategyTask = defineTask('research-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formulate research strategy',
  agent: {
    name: 'research-strategist',
    prompt: {
      role: 'senior scientist planning research strategy',
      task: 'Formulate a research strategy to discriminate among remaining hypotheses',
      context: args,
      instructions: [
        'Prioritize crucial tests by impact and feasibility',
        'Identify data collection needs',
        'Plan sequence of tests for maximum discrimination',
        'Consider resource constraints',
        'Plan for contingencies (different test outcomes)',
        'Identify parallel vs sequential activities',
        'Set decision points for hypothesis elimination',
        'Plan how to handle inconclusive results',
        'Recommend next immediate steps',
        'Save research strategy to output directory'
      ],
      outputFormat: 'JSON with strategy (phases, timeline, decisionPoints), prioritizedTests, dataNeeds, nextSteps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'prioritizedTests', 'nextSteps', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'number' },
                  objective: { type: 'string' },
                  activities: { type: 'array', items: { type: 'string' } },
                  expectedOutcome: { type: 'string' }
                }
              }
            },
            timeline: { type: 'string' },
            decisionPoints: { type: 'array', items: { type: 'string' } },
            contingencies: { type: 'object' }
          }
        },
        prioritizedTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testId: { type: 'string' },
              priority: { type: 'number' },
              rationale: { type: 'string' }
            }
          }
        },
        dataNeeds: { type: 'array', items: { type: 'string' } },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              priority: { type: 'string' },
              deadline: { type: 'string' }
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
  labels: ['agent', 'scientific-discovery', 'multiple-hypotheses', 'research-strategy']
}));
