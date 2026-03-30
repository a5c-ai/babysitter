/**
 * @process scientific-discovery/limiting-case-reasoning
 * @description Limiting Case Reasoning process - Examine extreme parameter values to stress-test models and gain physical insight
 * @inputs { model: object, parameters: array, physicalSystem: string, outputDir: string }
 * @outputs { success: boolean, limitingCases: array, asymptotisBehaviors: array, insights: array, modelValidation: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    model = {},
    parameters = [],
    physicalSystem = '',
    outputDir = 'limiting-case-output',
    includeIntermediate = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Limiting Case Reasoning Process');

  // ============================================================================
  // PHASE 1: PARAMETER SPACE MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 1: Mapping parameter space and identifying extremes');
  const parameterMapping = await ctx.task(parameterSpaceMappingTask, {
    model,
    parameters,
    physicalSystem,
    outputDir
  });

  artifacts.push(...parameterMapping.artifacts);

  // ============================================================================
  // PHASE 2: LIMITING CASE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying physically meaningful limiting cases');
  const limitingCaseIdentification = await ctx.task(limitingCaseIdentificationTask, {
    parameters: parameterMapping.parameters,
    parameterSpace: parameterMapping.parameterSpace,
    physicalSystem,
    outputDir
  });

  artifacts.push(...limitingCaseIdentification.artifacts);

  // ============================================================================
  // PHASE 3: ASYMPTOTIC ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Performing asymptotic analysis');
  const asymptoticAnalysis = await ctx.task(asymptoticAnalysisTask, {
    model,
    limitingCases: limitingCaseIdentification.limitingCases,
    outputDir
  });

  artifacts.push(...asymptoticAnalysis.artifacts);

  // Breakpoint: Review limiting cases
  await ctx.breakpoint({
    question: `Identified ${limitingCaseIdentification.limitingCases.length} limiting cases with ${asymptoticAnalysis.asymptoticBehaviors.length} asymptotic behaviors. Review before physical interpretation?`,
    title: 'Limiting Case Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        physicalSystem,
        parameterCount: parameters.length,
        limitingCaseCount: limitingCaseIdentification.limitingCases.length,
        asymptoticBehaviorCount: asymptoticAnalysis.asymptoticBehaviors.length
      }
    }
  });

  // ============================================================================
  // PHASE 4: PHYSICAL INTERPRETATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Interpreting limiting behaviors physically');
  const physicalInterpretation = await ctx.task(physicalInterpretationTask, {
    limitingCases: limitingCaseIdentification.limitingCases,
    asymptoticBehaviors: asymptoticAnalysis.asymptoticBehaviors,
    physicalSystem,
    outputDir
  });

  artifacts.push(...physicalInterpretation.artifacts);

  // ============================================================================
  // PHASE 5: KNOWN SOLUTION COMPARISON
  // ============================================================================

  ctx.log('info', 'Phase 5: Comparing with known solutions in limits');
  const knownSolutionComparison = await ctx.task(knownSolutionComparisonTask, {
    model,
    limitingCases: limitingCaseIdentification.limitingCases,
    asymptoticBehaviors: asymptoticAnalysis.asymptoticBehaviors,
    outputDir
  });

  artifacts.push(...knownSolutionComparison.artifacts);

  // ============================================================================
  // PHASE 6: MODEL STRESS TESTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Stress testing model at extremes');
  const stressTesting = await ctx.task(modelStressTestingTask, {
    model,
    limitingCases: limitingCaseIdentification.limitingCases,
    knownBehaviors: knownSolutionComparison.knownBehaviors,
    outputDir
  });

  artifacts.push(...stressTesting.artifacts);

  // ============================================================================
  // PHASE 7: INSIGHT SYNTHESIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Synthesizing insights from limiting case analysis');
  const insightSynthesis = await ctx.task(insightSynthesisTask, {
    limitingCases: limitingCaseIdentification.limitingCases,
    asymptoticBehaviors: asymptoticAnalysis.asymptoticBehaviors,
    physicalInterpretations: physicalInterpretation.interpretations,
    stressTestResults: stressTesting.results,
    knownSolutionComparisons: knownSolutionComparison.comparisons,
    outputDir
  });

  artifacts.push(...insightSynthesis.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Limiting case analysis complete. ${insightSynthesis.insights.length} insights generated. Model validation score: ${stressTesting.validationScore}%. Review findings?`,
    title: 'Limiting Case Analysis Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        physicalSystem,
        insightCount: insightSynthesis.insights.length,
        validationScore: stressTesting.validationScore,
        issuesFound: stressTesting.issues.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    physicalSystem,
    limitingCases: limitingCaseIdentification.limitingCases,
    asymptoticBehaviors: asymptoticAnalysis.asymptoticBehaviors,
    physicalInterpretations: physicalInterpretation.interpretations,
    knownSolutionComparisons: knownSolutionComparison.comparisons,
    modelValidation: {
      score: stressTesting.validationScore,
      issues: stressTesting.issues,
      recommendations: stressTesting.recommendations
    },
    insights: insightSynthesis.insights,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/limiting-case-reasoning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Parameter Space Mapping
export const parameterSpaceMappingTask = defineTask('parameter-space-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map parameter space and identify extremes',
  agent: {
    name: 'parameter-analyst',
    prompt: {
      role: 'theoretical scientist specializing in parameter analysis',
      task: 'Map the parameter space of the model and identify extreme regions',
      context: args,
      instructions: [
        'List all parameters in the model',
        'Determine physical range of each parameter',
        'Identify dimensionless parameter combinations',
        'Map parameter space topology',
        'Identify singular limits (parameters going to 0 or infinity)',
        'Note parameter correlations and constraints',
        'Identify physically meaningful extreme regions',
        'Determine which parameters can vary independently',
        'Note natural scales for each parameter',
        'Save parameter space analysis to output directory'
      ],
      outputFormat: 'JSON with parameters (array with name, range, extremes), parameterSpace (topology, singularities), constraints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['parameters', 'parameterSpace', 'artifacts'],
      properties: {
        parameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              symbol: { type: 'string' },
              physicalRange: { type: 'object' },
              extremes: {
                type: 'object',
                properties: {
                  small: { type: 'string' },
                  large: { type: 'string' }
                }
              },
              naturalScale: { type: 'string' }
            }
          }
        },
        parameterSpace: {
          type: 'object',
          properties: {
            dimensions: { type: 'number' },
            topology: { type: 'string' },
            singularities: { type: 'array', items: { type: 'string' } },
            boundaries: { type: 'array', items: { type: 'string' } }
          }
        },
        constraints: { type: 'array', items: { type: 'string' } },
        dimensionlessCombinations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'limiting-cases', 'parameter-analysis']
}));

// Task 2: Limiting Case Identification
export const limitingCaseIdentificationTask = defineTask('limiting-case-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify physically meaningful limiting cases',
  agent: {
    name: 'limit-specialist',
    prompt: {
      role: 'theoretical physicist specializing in limiting behavior',
      task: 'Identify physically meaningful limiting cases to analyze',
      context: args,
      instructions: [
        'Identify single-parameter limits (one parameter extreme, others fixed)',
        'Identify multi-parameter limits (correlated extremes)',
        'Consider limits: small/large, weak/strong, slow/fast',
        'Identify degenerate limits where behavior simplifies',
        'Note limits corresponding to known physical regimes',
        'Identify limits where different physics dominates',
        'Consider ratios of parameters going to limits',
        'Prioritize limits by physical importance',
        'Note which limits may be singular',
        'Save limiting cases to output directory'
      ],
      outputFormat: 'JSON with limitingCases (array with name, parameters, limit, physicalMeaning, priority), singularLimits, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['limitingCases', 'artifacts'],
      properties: {
        limitingCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              parameters: { type: 'array', items: { type: 'string' } },
              limitType: { type: 'string' },
              limitValue: { type: 'string' },
              physicalMeaning: { type: 'string' },
              priority: { type: 'string' },
              isSingular: { type: 'boolean' }
            }
          }
        },
        singularLimits: { type: 'array', items: { type: 'string' } },
        knownRegimes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'limiting-cases', 'limit-identification']
}));

// Task 3: Asymptotic Analysis
export const asymptoticAnalysisTask = defineTask('asymptotic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform asymptotic analysis',
  agent: {
    name: 'asymptotic-analyst',
    prompt: {
      role: 'applied mathematician specializing in asymptotics',
      task: 'Perform asymptotic analysis of model behavior in each limiting case',
      context: args,
      instructions: [
        'For each limiting case, expand model equations asymptotically',
        'Determine leading-order behavior',
        'Calculate correction terms if needed',
        'Identify scaling of solution with small/large parameter',
        'Determine asymptotic series (if applicable)',
        'Identify boundary layers or inner/outer regions',
        'Note uniform vs non-uniform asymptotics',
        'Determine range of validity of asymptotic approximation',
        'Identify breakdown of asymptotic expansion',
        'Save asymptotic analysis to output directory'
      ],
      outputFormat: 'JSON with asymptoticBehaviors (array with limitCase, leadingOrder, corrections, scaling, validity), boundaryLayers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['asymptoticBehaviors', 'artifacts'],
      properties: {
        asymptoticBehaviors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              limitCaseId: { type: 'string' },
              leadingOrderBehavior: { type: 'string' },
              scalingExponent: { type: 'number' },
              corrections: { type: 'array', items: { type: 'string' } },
              asymptoticSeries: { type: 'string' },
              validityRange: { type: 'string' },
              breakdownCondition: { type: 'string' }
            }
          }
        },
        boundaryLayers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              thickness: { type: 'string' },
              innerSolution: { type: 'string' }
            }
          }
        },
        matchingConditions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'limiting-cases', 'asymptotic-analysis']
}));

// Task 4: Physical Interpretation
export const physicalInterpretationTask = defineTask('physical-interpretation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Interpret limiting behaviors physically',
  agent: {
    name: 'physics-interpreter',
    prompt: {
      role: 'theoretical physicist',
      task: 'Provide physical interpretation of model behavior in each limiting case',
      context: args,
      instructions: [
        'Interpret what physics dominates in each limit',
        'Explain why certain terms dominate/vanish',
        'Connect limiting behavior to physical intuition',
        'Identify simplifications in the physics',
        'Note what physical effects are captured/lost',
        'Relate to experimental observables',
        'Explain transitions between regimes',
        'Connect to everyday physical experience where possible',
        'Note counterintuitive behaviors',
        'Save physical interpretations to output directory'
      ],
      outputFormat: 'JSON with interpretations (array with limitCase, dominantPhysics, simplifications, intuition, observables), regimeTransitions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interpretations', 'artifacts'],
      properties: {
        interpretations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              limitCaseId: { type: 'string' },
              dominantPhysics: { type: 'string' },
              negligibleEffects: { type: 'array', items: { type: 'string' } },
              physicalSimplification: { type: 'string' },
              intuitiveExplanation: { type: 'string' },
              experimentalSignature: { type: 'string' },
              counterintuitive: { type: 'boolean' },
              counterintuitiveExplanation: { type: 'string' }
            }
          }
        },
        regimeTransitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              crossoverParameter: { type: 'string' },
              physicalMechanism: { type: 'string' }
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
  labels: ['agent', 'scientific-discovery', 'limiting-cases', 'physical-interpretation']
}));

// Task 5: Known Solution Comparison
export const knownSolutionComparisonTask = defineTask('known-solution-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare with known solutions in limits',
  agent: {
    name: 'solution-validator',
    prompt: {
      role: 'physicist with expertise in exact solutions',
      task: 'Compare model limiting behavior with known exact solutions or well-established results',
      context: args,
      instructions: [
        'Identify known solutions in each limiting case',
        'Compare model asymptotic behavior to known solutions',
        'Check if model reduces to simpler known models in limits',
        'Verify conservation laws are satisfied in limits',
        'Check dimensional consistency in limits',
        'Compare with textbook results where available',
        'Note agreements and discrepancies',
        'Assess if discrepancies indicate model errors',
        'Document sources of known solutions',
        'Save comparisons to output directory'
      ],
      outputFormat: 'JSON with comparisons (array with limitCase, knownSolution, modelResult, agreement, discrepancy), knownBehaviors, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['comparisons', 'knownBehaviors', 'artifacts'],
      properties: {
        comparisons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              limitCaseId: { type: 'string' },
              knownSolution: { type: 'string' },
              knownSource: { type: 'string' },
              modelResult: { type: 'string' },
              agreement: { type: 'boolean' },
              discrepancy: { type: 'string' },
              discrepancySignificance: { type: 'string' }
            }
          }
        },
        knownBehaviors: { type: 'array' },
        conservationLawChecks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'limiting-cases', 'solution-comparison']
}));

// Task 6: Model Stress Testing
export const modelStressTestingTask = defineTask('model-stress-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Stress test model at extremes',
  agent: {
    name: 'stress-tester',
    prompt: {
      role: 'computational physicist and model validator',
      task: 'Stress test the model at parameter extremes to identify failures or issues',
      context: args,
      instructions: [
        'Test model numerical behavior at extremes',
        'Check for numerical instabilities',
        'Identify where model gives unphysical results',
        'Test for overflow/underflow issues',
        'Check sign consistency at extremes',
        'Verify boundedness where expected',
        'Test for discontinuities or singularities',
        'Check conservation property preservation',
        'Calculate validation score based on tests',
        'Document issues and recommendations',
        'Save stress test results to output directory'
      ],
      outputFormat: 'JSON with validationScore, results (array with test, passed, issue), issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'results', 'artifacts'],
      properties: {
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              limitCase: { type: 'string' },
              passed: { type: 'boolean' },
              issue: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              limitCase: { type: 'string' },
              severity: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              priority: { type: 'string' }
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
  labels: ['agent', 'scientific-discovery', 'limiting-cases', 'stress-testing']
}));

// Task 7: Insight Synthesis
export const insightSynthesisTask = defineTask('insight-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize insights from limiting case analysis',
  agent: {
    name: 'insight-synthesizer',
    prompt: {
      role: 'senior scientist synthesizing research findings',
      task: 'Synthesize key insights from the limiting case analysis',
      context: args,
      instructions: [
        'Identify key physical insights from limiting behaviors',
        'Note what limits reveal about model structure',
        'Identify universal vs non-universal behaviors',
        'Document transitions between regimes',
        'Note unexpected or surprising findings',
        'Identify implications for model improvement',
        'Suggest new limiting cases to explore',
        'Connect findings to broader theoretical framework',
        'Summarize practical implications',
        'Save synthesized insights to output directory'
      ],
      outputFormat: 'JSON with insights (array with insight, basis, significance), universalBehaviors, surprises, implications, futureDirections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'artifacts'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              basis: { type: 'string' },
              limitCases: { type: 'array', items: { type: 'string' } },
              significance: { type: 'string' },
              novelty: { type: 'string' }
            }
          }
        },
        universalBehaviors: { type: 'array', items: { type: 'string' } },
        surprises: { type: 'array', items: { type: 'string' } },
        modelImplications: { type: 'array', items: { type: 'string' } },
        practicalImplications: { type: 'array', items: { type: 'string' } },
        futureDirections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'limiting-cases', 'insight-synthesis']
}));
