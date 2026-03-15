/**
 * @process specializations/domains/science/scientific-discovery/scientific-reasoning
 * @description Scientific Reasoning - Integrated workflow combining abduction (hypothesis generation),
 * deduction (prediction derivation), and induction (testing and confirmation) for systematic scientific
 * inquiry, theory development, and empirical validation.
 * @inputs { phenomenon: string, observations: object[], domain: string, existingTheories?: object[], constraints?: object }
 * @outputs { success: boolean, hypotheses: object[], predictions: object[], testResults: object[], conclusions: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/scientific-reasoning', {
 *   phenomenon: 'Anomalous acceleration of Pioneer spacecraft',
 *   observations: [{ observation: 'Deceleration 8.74x10^-10 m/s^2', confidence: 'high' }],
 *   domain: 'Astrophysics',
 *   existingTheories: [{ name: 'General Relativity', predictions: 'No anomaly' }]
 * });
 *
 * @references
 * - Scientific Method: https://plato.stanford.edu/entries/scientific-method/
 * - Abduction: https://plato.stanford.edu/entries/abduction/
 * - Confirmation Theory: https://plato.stanford.edu/entries/confirmation/
 * - Hypothetico-Deductive Method: https://plato.stanford.edu/entries/hypothetico-deductive-method/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    phenomenon,
    observations,
    domain,
    existingTheories = [],
    constraints = {}
  } = inputs;

  // Phase 1: Phenomenon Characterization
  const phenomenonAnalysis = await ctx.task(phenomenonCharacterizationTask, {
    phenomenon,
    observations,
    domain
  });

  // Phase 2: Observation Analysis and Systematization
  const observationAnalysis = await ctx.task(observationAnalysisTask, {
    observations,
    phenomenon: phenomenonAnalysis,
    domain
  });

  // Quality Gate: Observations must be systematic
  if (!observationAnalysis.systematizedObservations || observationAnalysis.systematizedObservations.length === 0) {
    return {
      success: false,
      error: 'Observations could not be systematized',
      phase: 'observation-analysis',
      hypotheses: null
    };
  }

  // Phase 3: Abductive Hypothesis Generation
  const hypothesisGeneration = await ctx.task(abductiveHypothesisTask, {
    phenomenon: phenomenonAnalysis,
    observations: observationAnalysis.systematizedObservations,
    existingTheories,
    domain
  });

  // Phase 4: Hypothesis Evaluation and Ranking
  const hypothesisEvaluation = await ctx.task(hypothesisEvaluationTask, {
    hypotheses: hypothesisGeneration.hypotheses,
    observations: observationAnalysis.systematizedObservations,
    existingTheories,
    constraints
  });

  // Breakpoint: Review hypotheses
  await ctx.breakpoint({
    question: `Review generated hypotheses for "${phenomenon}". ${hypothesisGeneration.hypotheses?.length || 0} hypotheses generated. Proceed with prediction derivation?`,
    title: 'Hypothesis Review',
    context: {
      runId: ctx.runId,
      phenomenon,
      hypothesisCount: hypothesisGeneration.hypotheses?.length || 0,
      topHypothesis: hypothesisEvaluation.rankedHypotheses?.[0],
      files: [{
        path: 'artifacts/hypotheses.json',
        format: 'json',
        content: { phenomenonAnalysis, observationAnalysis, hypothesisGeneration, hypothesisEvaluation }
      }]
    }
  });

  // Phase 5: Deductive Prediction Derivation
  const predictionDerivation = await ctx.task(deductivePredictionTask, {
    hypotheses: hypothesisEvaluation.rankedHypotheses,
    phenomenon: phenomenonAnalysis,
    domain
  });

  // Phase 6: Test Design
  const testDesign = await ctx.task(testDesignTask, {
    predictions: predictionDerivation.predictions,
    hypotheses: hypothesisEvaluation.rankedHypotheses,
    constraints
  });

  // Phase 7: Evidence Evaluation (Induction)
  const evidenceEvaluation = await ctx.task(inductiveEvaluationTask, {
    predictions: predictionDerivation.predictions,
    observations: observationAnalysis.systematizedObservations,
    testDesign,
    hypotheses: hypothesisEvaluation.rankedHypotheses
  });

  // Phase 8: Confirmation and Disconfirmation Analysis
  const confirmationAnalysis = await ctx.task(confirmationAnalysisTask, {
    hypotheses: hypothesisEvaluation.rankedHypotheses,
    predictions: predictionDerivation.predictions,
    evidence: evidenceEvaluation.evidence,
    testDesign
  });

  // Phase 9: Theory Refinement
  const theoryRefinement = await ctx.task(theoryRefinementTask, {
    hypotheses: hypothesisEvaluation.rankedHypotheses,
    confirmationResults: confirmationAnalysis,
    phenomenon: phenomenonAnalysis,
    existingTheories
  });

  // Phase 10: Scientific Conclusions Synthesis
  const conclusionsSynthesis = await ctx.task(scientificConclusionsTask, {
    phenomenon: phenomenonAnalysis,
    observations: observationAnalysis,
    hypotheses: hypothesisEvaluation.rankedHypotheses,
    predictions: predictionDerivation.predictions,
    testDesign,
    evidenceEvaluation,
    confirmationAnalysis,
    theoryRefinement,
    domain
  });

  // Final Breakpoint: Scientific Analysis Approval
  await ctx.breakpoint({
    question: `Scientific reasoning complete for "${phenomenon}". Primary conclusion: ${conclusionsSynthesis.primaryConclusion}. Approve analysis?`,
    title: 'Scientific Analysis Approval',
    context: {
      runId: ctx.runId,
      phenomenon,
      primaryConclusion: conclusionsSynthesis.primaryConclusion,
      confidenceLevel: conclusionsSynthesis.confidenceLevel,
      files: [
        { path: 'artifacts/scientific-report.json', format: 'json', content: conclusionsSynthesis },
        { path: 'artifacts/scientific-report.md', format: 'markdown', content: conclusionsSynthesis.markdown }
      ]
    }
  });

  return {
    success: true,
    phenomenon,
    hypotheses: hypothesisEvaluation.rankedHypotheses,
    predictions: predictionDerivation.predictions,
    testResults: evidenceEvaluation.evidence,
    conclusions: {
      primary: conclusionsSynthesis.primaryConclusion,
      confidence: conclusionsSynthesis.confidenceLevel,
      supportedHypotheses: confirmationAnalysis.supportedHypotheses,
      refinedTheory: theoryRefinement.refinedTheory
    },
    recommendations: conclusionsSynthesis.recommendations,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/scientific-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const phenomenonCharacterizationTask = defineTask('phenomenon-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Phenomenon Characterization',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'scientific-method-analyst',
    skills: ['hypothesis-generator', 'statistical-test-selector', 'causal-inference-engine'],
    prompt: {
      role: 'Scientific Phenomenon Analyst',
      task: 'Characterize the phenomenon to be explained',
      context: {
        phenomenon: args.phenomenon,
        observations: args.observations,
        domain: args.domain
      },
      instructions: [
        '1. Define the phenomenon precisely',
        '2. Identify what needs to be explained (explanandum)',
        '3. Characterize the scope of the phenomenon',
        '4. Identify boundary conditions',
        '5. Distinguish the phenomenon from related phenomena',
        '6. Identify invariant features',
        '7. Note variations and contextual factors',
        '8. Identify what is puzzling or unexpected',
        '9. Characterize precision requirements for explanation',
        '10. Document phenomenon characterization'
      ],
      outputFormat: 'JSON object with phenomenon characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['definition', 'explanandum'],
      properties: {
        definition: { type: 'string' },
        explanandum: { type: 'string' },
        scope: { type: 'object' },
        boundaryConditions: { type: 'array', items: { type: 'string' } },
        relatedPhenomena: { type: 'array', items: { type: 'string' } },
        invariantFeatures: { type: 'array', items: { type: 'string' } },
        variations: { type: 'array', items: { type: 'object' } },
        puzzlingAspects: { type: 'array', items: { type: 'string' } },
        precisionRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['scientific-reasoning', 'phenomenon', 'characterization']
}));

export const observationAnalysisTask = defineTask('observation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Observation Analysis and Systematization',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'scientific-method-analyst',
    skills: ['hypothesis-generator', 'statistical-test-selector', 'causal-inference-engine'],
    prompt: {
      role: 'Scientific Observation Analyst',
      task: 'Analyze and systematize observations',
      context: {
        observations: args.observations,
        phenomenon: args.phenomenon,
        domain: args.domain
      },
      instructions: [
        '1. Catalog all relevant observations',
        '2. Assess observation reliability and confidence',
        '3. Identify observation conditions and controls',
        '4. Systematize observations by type and relevance',
        '5. Identify patterns in observations',
        '6. Note anomalies and outliers',
        '7. Assess measurement precision',
        '8. Identify observational biases',
        '9. Distinguish direct from indirect observations',
        '10. Document observation analysis'
      ],
      outputFormat: 'JSON object with systematized observations'
    },
    outputSchema: {
      type: 'object',
      required: ['systematizedObservations'],
      properties: {
        systematizedObservations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              observation: { type: 'string' },
              type: { type: 'string', enum: ['direct', 'indirect', 'derived'] },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              conditions: { type: 'array', items: { type: 'string' } },
              precision: { type: 'string' },
              relevance: { type: 'string', enum: ['primary', 'secondary', 'contextual'] }
            }
          }
        },
        patterns: { type: 'array', items: { type: 'object' } },
        anomalies: { type: 'array', items: { type: 'object' } },
        biases: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['scientific-reasoning', 'observations', 'systematization']
}));

export const abductiveHypothesisTask = defineTask('abductive-hypothesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Abductive Hypothesis Generation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'scientific-method-analyst',
    skills: ['hypothesis-generator', 'statistical-test-selector', 'causal-inference-engine'],
    prompt: {
      role: 'Hypothesis Generation Expert (Abductive Reasoning)',
      task: 'Generate hypotheses that would explain the phenomenon',
      context: {
        phenomenon: args.phenomenon,
        observations: args.observations,
        existingTheories: args.existingTheories,
        domain: args.domain
      },
      instructions: [
        '1. Generate hypotheses using abductive inference',
        '2. Consider modifications to existing theories',
        '3. Generate novel hypotheses',
        '4. Consider multiple levels of explanation',
        '5. Generate both conservative and bold hypotheses',
        '6. Ensure hypotheses are testable',
        '7. Check logical consistency of hypotheses',
        '8. Consider mechanistic vs phenomenological hypotheses',
        '9. Note auxiliary assumptions required',
        '10. Document hypothesis generation'
      ],
      outputFormat: 'JSON object with generated hypotheses'
    },
    outputSchema: {
      type: 'object',
      required: ['hypotheses'],
      properties: {
        hypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              hypothesis: { type: 'string' },
              type: { type: 'string', enum: ['modification', 'novel', 'mechanistic', 'phenomenological'] },
              explanatoryScope: { type: 'string' },
              testability: { type: 'string', enum: ['readily-testable', 'testable', 'difficult-to-test'] },
              auxiliaryAssumptions: { type: 'array', items: { type: 'string' } },
              novelty: { type: 'string', enum: ['conservative', 'moderate', 'bold'] }
            }
          }
        },
        generationRationale: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['scientific-reasoning', 'abduction', 'hypothesis-generation']
}));

export const hypothesisEvaluationTask = defineTask('hypothesis-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Hypothesis Evaluation and Ranking',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'scientific-method-analyst',
    skills: ['hypothesis-generator', 'statistical-test-selector', 'causal-inference-engine'],
    prompt: {
      role: 'Hypothesis Evaluation Expert',
      task: 'Evaluate and rank hypotheses by scientific merit',
      context: {
        hypotheses: args.hypotheses,
        observations: args.observations,
        existingTheories: args.existingTheories,
        constraints: args.constraints
      },
      instructions: [
        '1. Evaluate explanatory power of each hypothesis',
        '2. Assess simplicity/parsimony (Occam\'s razor)',
        '3. Evaluate consistency with existing knowledge',
        '4. Assess unification potential',
        '5. Evaluate predictive novelty',
        '6. Assess falsifiability',
        '7. Evaluate mechanism plausibility',
        '8. Consider prior probability (Bayesian)',
        '9. Rank hypotheses by overall merit',
        '10. Document evaluation rationale'
      ],
      outputFormat: 'JSON object with evaluated hypotheses'
    },
    outputSchema: {
      type: 'object',
      required: ['rankedHypotheses'],
      properties: {
        rankedHypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesisId: { type: 'string' },
              hypothesis: { type: 'string' },
              explanatoryPower: { type: 'number', minimum: 0, maximum: 10 },
              simplicity: { type: 'number', minimum: 0, maximum: 10 },
              consistency: { type: 'number', minimum: 0, maximum: 10 },
              falsifiability: { type: 'number', minimum: 0, maximum: 10 },
              priorProbability: { type: 'number', minimum: 0, maximum: 1 },
              overallScore: { type: 'number' },
              rank: { type: 'number' }
            }
          }
        },
        evaluationRationale: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['scientific-reasoning', 'hypothesis-evaluation', 'ranking']
}));

export const deductivePredictionTask = defineTask('deductive-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Deductive Prediction Derivation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'scientific-method-analyst',
    skills: ['hypothesis-generator', 'statistical-test-selector', 'causal-inference-engine'],
    prompt: {
      role: 'Prediction Derivation Expert (Deductive Reasoning)',
      task: 'Derive testable predictions from hypotheses',
      context: {
        hypotheses: args.hypotheses,
        phenomenon: args.phenomenon,
        domain: args.domain
      },
      instructions: [
        '1. Derive logical consequences of each hypothesis',
        '2. Identify observable predictions',
        '3. Specify quantitative predictions where possible',
        '4. Identify novel predictions not yet tested',
        '5. Distinguish crucial from peripheral predictions',
        '6. Identify predictions that discriminate between hypotheses',
        '7. Specify prediction precision requirements',
        '8. Note auxiliary assumptions needed for predictions',
        '9. Identify risk predictions (potential falsifiers)',
        '10. Document prediction derivation'
      ],
      outputFormat: 'JSON object with derived predictions'
    },
    outputSchema: {
      type: 'object',
      required: ['predictions'],
      properties: {
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              hypothesisId: { type: 'string' },
              prediction: { type: 'string' },
              type: { type: 'string', enum: ['quantitative', 'qualitative', 'existence'] },
              novelty: { type: 'string', enum: ['novel', 'known', 'retrodiction'] },
              discriminatory: { type: 'boolean' },
              precision: { type: 'string' },
              auxiliaryAssumptions: { type: 'array', items: { type: 'string' } },
              riskLevel: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        crucialPredictions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['scientific-reasoning', 'deduction', 'prediction']
}));

export const testDesignTask = defineTask('test-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Test Design',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'scientific-method-analyst',
    skills: ['hypothesis-generator', 'statistical-test-selector', 'causal-inference-engine'],
    prompt: {
      role: 'Scientific Test Design Expert',
      task: 'Design tests for predictions',
      context: {
        predictions: args.predictions,
        hypotheses: args.hypotheses,
        constraints: args.constraints
      },
      instructions: [
        '1. Design tests for each prediction',
        '2. Specify test conditions and controls',
        '3. Define success/failure criteria',
        '4. Identify potential confounds',
        '5. Specify required precision',
        '6. Consider replication requirements',
        '7. Identify resource requirements',
        '8. Design crucial tests first',
        '9. Consider ethical constraints',
        '10. Document test designs'
      ],
      outputFormat: 'JSON object with test designs'
    },
    outputSchema: {
      type: 'object',
      required: ['tests'],
      properties: {
        tests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              predictionId: { type: 'string' },
              testDescription: { type: 'string' },
              conditions: { type: 'array', items: { type: 'string' } },
              controls: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'string' },
              failureCriteria: { type: 'string' },
              confounds: { type: 'array', items: { type: 'string' } },
              feasibility: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        testPriority: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['scientific-reasoning', 'test-design', 'methodology']
}));

export const inductiveEvaluationTask = defineTask('inductive-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Evidence Evaluation (Induction)',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'scientific-method-analyst',
    skills: ['hypothesis-generator', 'statistical-test-selector', 'causal-inference-engine'],
    prompt: {
      role: 'Evidence Evaluation Expert (Inductive Reasoning)',
      task: 'Evaluate evidence against predictions',
      context: {
        predictions: args.predictions,
        observations: args.observations,
        testDesign: args.testDesign,
        hypotheses: args.hypotheses
      },
      instructions: [
        '1. Match observations to predictions',
        '2. Assess degree of confirmation/disconfirmation',
        '3. Evaluate statistical significance where applicable',
        '4. Consider effect sizes',
        '5. Assess reliability of evidence',
        '6. Consider alternative explanations',
        '7. Evaluate evidence diversity',
        '8. Weight evidence by test severity',
        '9. Identify evidential gaps',
        '10. Document evidence evaluation'
      ],
      outputFormat: 'JSON object with evidence evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['evidence'],
      properties: {
        evidence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              predictionId: { type: 'string' },
              observationMatch: { type: 'string' },
              confirmationDegree: { type: 'string', enum: ['strongly-confirmed', 'confirmed', 'neutral', 'disconfirmed', 'strongly-disconfirmed'] },
              reliability: { type: 'string', enum: ['high', 'medium', 'low'] },
              testSeverity: { type: 'string', enum: ['severe', 'moderate', 'weak'] },
              alternativeExplanations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        evidentialGaps: { type: 'array', items: { type: 'string' } },
        overallEvidence: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['scientific-reasoning', 'induction', 'evidence']
}));

export const confirmationAnalysisTask = defineTask('confirmation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Confirmation and Disconfirmation Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'scientific-method-analyst',
    skills: ['hypothesis-generator', 'statistical-test-selector', 'causal-inference-engine'],
    prompt: {
      role: 'Confirmation Theory Expert',
      task: 'Analyze confirmation/disconfirmation status of hypotheses',
      context: {
        hypotheses: args.hypotheses,
        predictions: args.predictions,
        evidence: args.evidence,
        testDesign: args.testDesign
      },
      instructions: [
        '1. Calculate confirmation for each hypothesis',
        '2. Apply Bayesian updating where appropriate',
        '3. Assess degree of corroboration',
        '4. Identify hypotheses that survived severe tests',
        '5. Identify falsified hypotheses',
        '6. Assess auxiliary hypothesis involvement',
        '7. Consider Duhem-Quine considerations',
        '8. Evaluate overall confirmation picture',
        '9. Identify what further tests are needed',
        '10. Document confirmation analysis'
      ],
      outputFormat: 'JSON object with confirmation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['supportedHypotheses'],
      properties: {
        hypothesisStatus: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesisId: { type: 'string' },
              confirmationStatus: { type: 'string', enum: ['confirmed', 'corroborated', 'neutral', 'weakened', 'falsified'] },
              posteriorProbability: { type: 'number', minimum: 0, maximum: 1 },
              survivedSevereTests: { type: 'boolean' },
              auxiliaryIssues: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        supportedHypotheses: { type: 'array', items: { type: 'string' } },
        falsifiedHypotheses: { type: 'array', items: { type: 'string' } },
        furtherTestsNeeded: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['scientific-reasoning', 'confirmation', 'bayesian']
}));

export const theoryRefinementTask = defineTask('theory-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Theory Refinement',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'scientific-method-analyst',
    skills: ['hypothesis-generator', 'statistical-test-selector', 'causal-inference-engine'],
    prompt: {
      role: 'Theory Refinement Expert',
      task: 'Refine theories based on confirmation analysis',
      context: {
        hypotheses: args.hypotheses,
        confirmationResults: args.confirmationResults,
        phenomenon: args.phenomenon,
        existingTheories: args.existingTheories
      },
      instructions: [
        '1. Identify modifications needed based on evidence',
        '2. Refine hypothesis formulations',
        '3. Adjust auxiliary assumptions',
        '4. Integrate confirmed elements',
        '5. Develop refined theory statement',
        '6. Identify implications of refined theory',
        '7. Compare refined theory to alternatives',
        '8. Assess refined theory\'s scope',
        '9. Identify new predictions from refined theory',
        '10. Document theory refinement'
      ],
      outputFormat: 'JSON object with refined theory'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedTheory'],
      properties: {
        refinedTheory: {
          type: 'object',
          properties: {
            statement: { type: 'string' },
            modifications: { type: 'array', items: { type: 'object' } },
            confirmedElements: { type: 'array', items: { type: 'string' } },
            adjustedAssumptions: { type: 'array', items: { type: 'string' } },
            scope: { type: 'string' },
            newPredictions: { type: 'array', items: { type: 'string' } }
          }
        },
        comparisonToAlternatives: { type: 'object' },
        implications: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['scientific-reasoning', 'theory-refinement', 'development']
}));

export const scientificConclusionsTask = defineTask('scientific-conclusions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Scientific Conclusions Synthesis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'scientific-method-analyst',
    skills: ['hypothesis-generator', 'statistical-test-selector', 'causal-inference-engine'],
    prompt: {
      role: 'Scientific Conclusions Synthesist',
      task: 'Synthesize scientific reasoning into conclusions',
      context: {
        phenomenon: args.phenomenon,
        observations: args.observations,
        hypotheses: args.hypotheses,
        predictions: args.predictions,
        testDesign: args.testDesign,
        evidenceEvaluation: args.evidenceEvaluation,
        confirmationAnalysis: args.confirmationAnalysis,
        theoryRefinement: args.theoryRefinement,
        domain: args.domain
      },
      instructions: [
        '1. State primary scientific conclusion',
        '2. Assess confidence level with justification',
        '3. Summarize key findings',
        '4. Identify limitations and caveats',
        '5. Highlight implications for the field',
        '6. Identify open questions',
        '7. Recommend next research steps',
        '8. Note methodological lessons',
        '9. Assess reproducibility potential',
        '10. Generate comprehensive markdown report'
      ],
      outputFormat: 'JSON object with scientific conclusions'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryConclusion', 'confidenceLevel', 'recommendations', 'markdown'],
      properties: {
        primaryConclusion: { type: 'string' },
        confidenceLevel: { type: 'string', enum: ['very-high', 'high', 'moderate', 'low', 'very-low'] },
        keyFindings: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        implications: { type: 'array', items: { type: 'string' } },
        openQuestions: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              type: { type: 'string', enum: ['research', 'methodology', 'theory'] },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        methodologicalLessons: { type: 'array', items: { type: 'string' } },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['scientific-reasoning', 'conclusions', 'synthesis']
}));
