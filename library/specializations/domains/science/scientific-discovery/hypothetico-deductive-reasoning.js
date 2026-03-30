/**
 * @process scientific-discovery/hypothetico-deductive-reasoning
 * @description Hypothetico-Deductive Reasoning process - Propose hypothesis, deduce predictions, design and run tests to validate or refute
 * @inputs { phenomenon: string, observations: array, existingTheories: array, outputDir: string }
 * @outputs { success: boolean, hypothesis: object, predictions: array, testResults: array, verdict: string, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    phenomenon = '',
    observations = [],
    existingTheories = [],
    outputDir = 'hypothetico-deductive-output',
    maxIterations = 3,
    confidenceThreshold = 0.8
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Hypothetico-Deductive Reasoning Process');

  // ============================================================================
  // PHASE 1: OBSERVATION ANALYSIS AND PATTERN RECOGNITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing observations and identifying patterns');
  const observationAnalysis = await ctx.task(observationAnalysisTask, {
    phenomenon,
    observations,
    existingTheories,
    outputDir
  });

  artifacts.push(...observationAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: HYPOTHESIS FORMULATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Formulating testable hypothesis');
  const hypothesisFormulation = await ctx.task(hypothesisFormulationTask, {
    phenomenon,
    patterns: observationAnalysis.patterns,
    anomalies: observationAnalysis.anomalies,
    existingTheories,
    outputDir
  });

  artifacts.push(...hypothesisFormulation.artifacts);

  // ============================================================================
  // PHASE 3: PREDICTION DEDUCTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Deducing testable predictions from hypothesis');
  const predictionDeduction = await ctx.task(predictionDeductionTask, {
    hypothesis: hypothesisFormulation.hypothesis,
    auxiliaryAssumptions: hypothesisFormulation.auxiliaryAssumptions,
    phenomenon,
    outputDir
  });

  artifacts.push(...predictionDeduction.artifacts);

  // ============================================================================
  // PHASE 4: TEST DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing rigorous tests for predictions');
  const testDesign = await ctx.task(testDesignTask, {
    hypothesis: hypothesisFormulation.hypothesis,
    predictions: predictionDeduction.predictions,
    outputDir
  });

  artifacts.push(...testDesign.artifacts);

  // Breakpoint: Review test design before execution
  await ctx.breakpoint({
    question: `Test design complete for hypothesis: "${hypothesisFormulation.hypothesis.statement}". ${testDesign.tests.length} tests designed. Proceed with test execution?`,
    title: 'Hypothetico-Deductive Test Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        hypothesis: hypothesisFormulation.hypothesis.statement,
        predictionCount: predictionDeduction.predictions.length,
        testCount: testDesign.tests.length
      }
    }
  });

  // ============================================================================
  // PHASE 5: TEST EXECUTION AND RESULT COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Executing tests and collecting results');
  const testExecution = await ctx.task(testExecutionTask, {
    hypothesis: hypothesisFormulation.hypothesis,
    tests: testDesign.tests,
    predictions: predictionDeduction.predictions,
    outputDir
  });

  artifacts.push(...testExecution.artifacts);

  // ============================================================================
  // PHASE 6: RESULT ANALYSIS AND HYPOTHESIS EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing results and evaluating hypothesis');
  const resultAnalysis = await ctx.task(resultAnalysisTask, {
    hypothesis: hypothesisFormulation.hypothesis,
    predictions: predictionDeduction.predictions,
    testResults: testExecution.results,
    confidenceThreshold,
    outputDir
  });

  artifacts.push(...resultAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: VERDICT AND REFINEMENT RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Rendering verdict and generating recommendations');
  const verdictGeneration = await ctx.task(verdictGenerationTask, {
    hypothesis: hypothesisFormulation.hypothesis,
    resultAnalysis,
    existingTheories,
    outputDir
  });

  artifacts.push(...verdictGeneration.artifacts);

  // Final breakpoint: Review complete analysis
  await ctx.breakpoint({
    question: `Hypothetico-deductive analysis complete. Verdict: ${verdictGeneration.verdict}. Confidence: ${resultAnalysis.overallConfidence}. Review findings?`,
    title: 'Hypothetico-Deductive Analysis Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        hypothesis: hypothesisFormulation.hypothesis.statement,
        verdict: verdictGeneration.verdict,
        confidence: resultAnalysis.overallConfidence,
        predictionsConfirmed: resultAnalysis.confirmedPredictions,
        predictionsRefuted: resultAnalysis.refutedPredictions
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    phenomenon,
    hypothesis: hypothesisFormulation.hypothesis,
    predictions: predictionDeduction.predictions,
    testResults: testExecution.results,
    analysis: {
      confirmedPredictions: resultAnalysis.confirmedPredictions,
      refutedPredictions: resultAnalysis.refutedPredictions,
      inconclusivePredictions: resultAnalysis.inconclusivePredictions,
      overallConfidence: resultAnalysis.overallConfidence
    },
    verdict: verdictGeneration.verdict,
    refinementSuggestions: verdictGeneration.refinementSuggestions,
    nextSteps: verdictGeneration.nextSteps,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/hypothetico-deductive-reasoning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Observation Analysis
export const observationAnalysisTask = defineTask('observation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze observations and identify patterns',
  agent: {
    name: 'scientific-observer',
    prompt: {
      role: 'empirical scientist and pattern recognition specialist',
      task: 'Analyze observations of the phenomenon and identify significant patterns and anomalies',
      context: args,
      instructions: [
        'Systematically catalog all observations',
        'Identify recurring patterns in the data',
        'Flag anomalies that deviate from expected behavior',
        'Note correlations between variables',
        'Assess data quality and reliability of observations',
        'Compare with predictions from existing theories',
        'Identify gaps in current observational data',
        'Quantify uncertainty in observations where possible',
        'Document environmental or contextual factors',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with patterns, anomalies, correlations, dataQuality, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'anomalies', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              frequency: { type: 'string' },
              strength: { type: 'number' },
              variables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        anomalies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              deviation: { type: 'string' },
              significance: { type: 'string' }
            }
          }
        },
        correlations: { type: 'array' },
        dataQuality: {
          type: 'object',
          properties: {
            reliability: { type: 'number' },
            completeness: { type: 'number' },
            precision: { type: 'number' }
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
  labels: ['agent', 'scientific-discovery', 'observation-analysis', 'pattern-recognition']
}));

// Task 2: Hypothesis Formulation
export const hypothesisFormulationTask = defineTask('hypothesis-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formulate testable hypothesis',
  agent: {
    name: 'theoretical-scientist',
    prompt: {
      role: 'theoretical scientist and hypothesis generator',
      task: 'Formulate a clear, testable hypothesis that explains observed patterns and anomalies',
      context: args,
      instructions: [
        'Review identified patterns and anomalies',
        'Consider existing theoretical frameworks',
        'Formulate a specific, falsifiable hypothesis',
        'Ensure hypothesis is mechanistic (explains HOW, not just WHAT)',
        'Define scope and domain of applicability',
        'Identify boundary conditions',
        'List auxiliary assumptions required',
        'Assess novelty relative to existing theories',
        'Evaluate parsimony (Occam\'s razor)',
        'Document causal claims and mechanisms',
        'Rate testability and falsifiability',
        'Save hypothesis formulation to output directory'
      ],
      outputFormat: 'JSON with hypothesis (statement, mechanism, scope, falsifiability), auxiliaryAssumptions, novelty, parsimonyScore, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hypothesis', 'auxiliaryAssumptions', 'artifacts'],
      properties: {
        hypothesis: {
          type: 'object',
          properties: {
            statement: { type: 'string' },
            mechanism: { type: 'string' },
            scope: { type: 'string' },
            boundaryConditions: { type: 'array', items: { type: 'string' } },
            falsifiability: { type: 'string' },
            falsifiabilityScore: { type: 'number', minimum: 0, maximum: 1 }
          }
        },
        auxiliaryAssumptions: { type: 'array', items: { type: 'string' } },
        novelty: { type: 'string' },
        parsimonyScore: { type: 'number' },
        alternativeHypotheses: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'hypothesis-formulation', 'theory-building']
}));

// Task 3: Prediction Deduction
export const predictionDeductionTask = defineTask('prediction-deduction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Deduce testable predictions from hypothesis',
  agent: {
    name: 'deductive-reasoner',
    prompt: {
      role: 'logician and experimental scientist',
      task: 'Deduce specific, measurable predictions from the hypothesis that can be empirically tested',
      context: args,
      instructions: [
        'Apply deductive logic to derive consequences from hypothesis',
        'Generate predictions for observable outcomes',
        'Ensure predictions are specific and quantifiable',
        'Include predictions for both expected and unexpected conditions',
        'Derive "risky" predictions (would be surprising if false)',
        'Include novel predictions not explained by competing theories',
        'Specify measurement precision required',
        'Distinguish necessary vs sufficient conditions',
        'Consider both positive and negative predictions',
        'Rank predictions by discriminatory power',
        'Document logical chain from hypothesis to each prediction',
        'Save predictions to output directory'
      ],
      outputFormat: 'JSON with predictions (array of prediction objects with statement, measurables, discriminatoryPower, logicalDerivation), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['predictions', 'artifacts'],
      properties: {
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              statement: { type: 'string' },
              measurables: { type: 'array', items: { type: 'string' } },
              expectedValue: { type: 'string' },
              tolerance: { type: 'string' },
              discriminatoryPower: { type: 'number' },
              logicalDerivation: { type: 'string' },
              riskiness: { type: 'string' },
              novelty: { type: 'boolean' }
            }
          }
        },
        deductiveChain: { type: 'string' },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'prediction-deduction', 'deductive-reasoning']
}));

// Task 4: Test Design
export const testDesignTask = defineTask('test-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design rigorous tests for predictions',
  agent: {
    name: 'experimental-designer',
    prompt: {
      role: 'experimental scientist and methodologist',
      task: 'Design rigorous experimental or observational tests to evaluate each prediction',
      context: args,
      instructions: [
        'Design specific test for each prediction',
        'Ensure tests can discriminate between hypothesis and alternatives',
        'Include appropriate controls (positive and negative)',
        'Define operational procedures precisely',
        'Specify required sample sizes for statistical power',
        'Address potential confounding variables',
        'Design for reproducibility',
        'Include blinding where appropriate',
        'Specify success/failure criteria before testing',
        'Plan for data collection and storage',
        'Assess feasibility and resource requirements',
        'Consider ethical implications',
        'Save test designs to output directory'
      ],
      outputFormat: 'JSON with tests (array with design, controls, procedures, sampleSize, successCriteria, feasibility), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tests', 'artifacts'],
      properties: {
        tests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              predictionId: { type: 'string' },
              testName: { type: 'string' },
              design: { type: 'string' },
              controls: { type: 'array', items: { type: 'string' } },
              procedures: { type: 'array', items: { type: 'string' } },
              sampleSize: { type: 'number' },
              statisticalPower: { type: 'number' },
              successCriteria: { type: 'string' },
              failureCriteria: { type: 'string' },
              confoundsAddressed: { type: 'array', items: { type: 'string' } },
              feasibility: { type: 'string' },
              resourcesRequired: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        overallDesignQuality: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'test-design', 'experimental-methodology']
}));

// Task 5: Test Execution
export const testExecutionTask = defineTask('test-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute tests and collect results',
  agent: {
    name: 'experimental-executor',
    prompt: {
      role: 'laboratory scientist and data collector',
      task: 'Execute designed tests systematically and collect results with full documentation',
      context: args,
      instructions: [
        'Execute each test according to specified procedures',
        'Collect data with appropriate precision',
        'Document any deviations from protocol',
        'Record environmental conditions',
        'Apply quality control checks',
        'Handle missing or anomalous data appropriately',
        'Maintain chain of custody for data',
        'Perform initial data validation',
        'Calculate summary statistics',
        'Note any unexpected observations',
        'Document equipment calibration status',
        'Save all results to output directory'
      ],
      outputFormat: 'JSON with results (array with testId, data, observations, deviations, quality), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testId: { type: 'string' },
              predictionId: { type: 'string' },
              rawData: { type: 'object' },
              summaryStatistics: { type: 'object' },
              observedValue: { type: 'string' },
              expectedValue: { type: 'string' },
              withinTolerance: { type: 'boolean' },
              unexpectedObservations: { type: 'array', items: { type: 'string' } },
              protocolDeviations: { type: 'array', items: { type: 'string' } },
              dataQuality: { type: 'number' }
            }
          }
        },
        executionLog: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'test-execution', 'data-collection']
}));

// Task 6: Result Analysis
export const resultAnalysisTask = defineTask('result-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze results and evaluate hypothesis',
  agent: {
    name: 'scientific-analyst',
    prompt: {
      role: 'statistical analyst and scientific evaluator',
      task: 'Analyze test results statistically and evaluate support for/against hypothesis',
      context: args,
      instructions: [
        'Perform statistical analysis of each test result',
        'Calculate p-values and confidence intervals',
        'Assess effect sizes',
        'Compare observed vs predicted values',
        'Classify each prediction as confirmed, refuted, or inconclusive',
        'Account for measurement uncertainty',
        'Consider alternative explanations for results',
        'Assess internal validity of tests',
        'Calculate overall confidence in hypothesis',
        'Apply Bayesian updating if prior probabilities available',
        'Identify systematic vs random deviations',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with confirmedPredictions, refutedPredictions, inconclusivePredictions, overallConfidence, statisticalDetails, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['confirmedPredictions', 'refutedPredictions', 'inconclusivePredictions', 'overallConfidence', 'artifacts'],
      properties: {
        confirmedPredictions: { type: 'number' },
        refutedPredictions: { type: 'number' },
        inconclusivePredictions: { type: 'number' },
        overallConfidence: { type: 'number', minimum: 0, maximum: 1 },
        predictionResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              predictionId: { type: 'string' },
              status: { type: 'string', enum: ['confirmed', 'refuted', 'inconclusive'] },
              pValue: { type: 'number' },
              effectSize: { type: 'number' },
              confidenceInterval: { type: 'string' }
            }
          }
        },
        bayesianPosterior: { type: 'number' },
        alternativeExplanations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'result-analysis', 'statistical-inference']
}));

// Task 7: Verdict Generation
export const verdictGenerationTask = defineTask('verdict-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Render verdict and generate recommendations',
  agent: {
    name: 'scientific-judge',
    prompt: {
      role: 'senior scientist and epistemologist',
      task: 'Render verdict on hypothesis and recommend next steps in the scientific process',
      context: args,
      instructions: [
        'Synthesize all evidence for/against hypothesis',
        'Render clear verdict: supported, refuted, or inconclusive',
        'Justify verdict with specific evidence',
        'If supported: assess strength of support and remaining uncertainties',
        'If refuted: identify which predictions failed and why',
        'If inconclusive: specify what additional evidence needed',
        'Suggest hypothesis refinements based on results',
        'Recommend follow-up experiments',
        'Compare with existing theories in light of results',
        'Assess broader implications if hypothesis supported',
        'Document limitations of current investigation',
        'Save verdict and recommendations to output directory'
      ],
      outputFormat: 'JSON with verdict, justification, refinementSuggestions, nextSteps, implications, limitations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'justification', 'nextSteps', 'artifacts'],
      properties: {
        verdict: { type: 'string', enum: ['strongly_supported', 'weakly_supported', 'inconclusive', 'weakly_refuted', 'strongly_refuted'] },
        justification: { type: 'string' },
        supportingEvidence: { type: 'array', items: { type: 'string' } },
        contradictingEvidence: { type: 'array', items: { type: 'string' } },
        refinementSuggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              aspect: { type: 'string' },
              suggestion: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              priority: { type: 'string' },
              expectedOutcome: { type: 'string' }
            }
          }
        },
        implications: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'verdict-generation', 'epistemology']
}));
