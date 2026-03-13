/**
 * @process scientific-discovery/probabilistic-logic
 * @description Blend logical structure with probabilistic uncertainty for reasoning under incomplete information
 * @inputs { premises: array, hypotheses: array, priorProbabilities: object, evidenceWeights: object, outputDir: string }
 * @outputs { success: boolean, posteriorProbabilities: object, logicalInferences: array, uncertaintyAnalysis: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    premises = [],
    hypotheses = [],
    priorProbabilities = {},
    evidenceWeights = {},
    outputDir = 'probabilistic-logic-output',
    confidenceThreshold = 0.7,
    inferenceDepth = 3
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Probabilistic Logic Reasoning Process');

  // ============================================================================
  // PHASE 1: KNOWLEDGE BASE FORMALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Formalizing knowledge base with logical structure');
  const formalizationResult = await ctx.task(knowledgeFormalizationTask, {
    premises,
    hypotheses,
    priorProbabilities,
    outputDir
  });

  artifacts.push(...formalizationResult.artifacts);

  // ============================================================================
  // PHASE 2: PROBABILISTIC MODEL CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Constructing probabilistic model');
  const modelConstruction = await ctx.task(probabilisticModelTask, {
    formalizedKnowledge: formalizationResult.formalizedKnowledge,
    priorProbabilities,
    evidenceWeights,
    outputDir
  });

  artifacts.push(...modelConstruction.artifacts);

  // ============================================================================
  // PHASE 3: LOGICAL INFERENCE WITH UNCERTAINTY
  // ============================================================================

  ctx.log('info', 'Phase 3: Performing logical inference with uncertainty propagation');
  const inferenceResult = await ctx.task(uncertainInferenceTask, {
    probabilisticModel: modelConstruction.model,
    hypotheses,
    inferenceDepth,
    outputDir
  });

  artifacts.push(...inferenceResult.artifacts);

  // ============================================================================
  // PHASE 4: POSTERIOR PROBABILITY COMPUTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Computing posterior probabilities');
  const posteriorComputation = await ctx.task(posteriorComputationTask, {
    model: modelConstruction.model,
    inferences: inferenceResult.inferences,
    hypotheses,
    outputDir
  });

  artifacts.push(...posteriorComputation.artifacts);

  // ============================================================================
  // PHASE 5: UNCERTAINTY QUANTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Quantifying reasoning uncertainty');
  const uncertaintyAnalysis = await ctx.task(uncertaintyQuantificationTask, {
    posteriorProbabilities: posteriorComputation.posteriors,
    inferences: inferenceResult.inferences,
    confidenceThreshold,
    outputDir
  });

  artifacts.push(...uncertaintyAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Assessing reasoning quality');
  const qualityScore = await ctx.task(reasoningQualityTask, {
    formalization: formalizationResult,
    model: modelConstruction.model,
    inferences: inferenceResult.inferences,
    posteriors: posteriorComputation.posteriors,
    uncertaintyAnalysis: uncertaintyAnalysis.analysis,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 75;

  // Breakpoint: Review probabilistic logic results
  await ctx.breakpoint({
    question: `Probabilistic logic reasoning complete. Quality score: ${qualityScore.overallScore}/100. ${qualityMet ? 'Quality meets standards!' : 'Quality may need improvement.'} Review results?`,
    title: 'Probabilistic Logic Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        premisesCount: premises.length,
        hypothesesCount: hypotheses.length,
        inferencesGenerated: inferenceResult.inferences.length,
        highConfidenceConclusions: uncertaintyAnalysis.highConfidenceCount,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  // ============================================================================
  // PHASE 7: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating comprehensive report');
  const report = await ctx.task(reportGenerationTask, {
    formalization: formalizationResult,
    model: modelConstruction.model,
    inferences: inferenceResult.inferences,
    posteriors: posteriorComputation.posteriors,
    uncertaintyAnalysis: uncertaintyAnalysis.analysis,
    qualityScore: qualityScore.overallScore,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    posteriorProbabilities: posteriorComputation.posteriors,
    logicalInferences: inferenceResult.inferences,
    uncertaintyAnalysis: uncertaintyAnalysis.analysis,
    qualityScore: qualityScore.overallScore,
    highConfidenceConclusions: uncertaintyAnalysis.highConfidenceConclusions,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/probabilistic-logic',
      timestamp: startTime,
      outputDir,
      confidenceThreshold,
      inferenceDepth
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Knowledge Formalization
export const knowledgeFormalizationTask = defineTask('knowledge-formalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formalize knowledge base with logical structure',
  agent: {
    name: 'logic-formalization-agent',
    prompt: {
      role: 'knowledge representation specialist and formal logician',
      task: 'Formalize premises and hypotheses into a structured logical knowledge base',
      context: args,
      instructions: [
        'Parse natural language premises into formal logical statements',
        'Identify predicates, variables, constants, and quantifiers',
        'Express relationships using first-order logic notation',
        'Identify logical connectives (AND, OR, NOT, IMPLIES, IFF)',
        'Detect implicit assumptions and make them explicit',
        'Validate logical consistency of the knowledge base',
        'Identify any contradictions or ambiguities',
        'Create formal representation suitable for probabilistic extension',
        'Document the formalization process and choices made',
        'Save formalized knowledge base to output directory'
      ],
      outputFormat: 'JSON with formalizedKnowledge (object), predicates (array), rules (array), assumptions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['formalizedKnowledge', 'predicates', 'rules', 'artifacts'],
      properties: {
        formalizedKnowledge: {
          type: 'object',
          properties: {
            predicates: { type: 'array' },
            constants: { type: 'array' },
            rules: { type: 'array' },
            facts: { type: 'array' }
          }
        },
        predicates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              arity: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              antecedent: { type: 'string' },
              consequent: { type: 'string' },
              formalNotation: { type: 'string' }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        consistencyCheck: { type: 'boolean' },
        ambiguities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'probabilistic-logic', 'formalization']
}));

// Task 2: Probabilistic Model Construction
export const probabilisticModelTask = defineTask('probabilistic-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct probabilistic model from logical structure',
  agent: {
    name: 'probabilistic-modeling-agent',
    prompt: {
      role: 'probabilistic reasoning expert and Bayesian modeler',
      task: 'Construct a probabilistic model that extends the logical structure with uncertainty',
      context: args,
      instructions: [
        'Map logical predicates to random variables',
        'Assign prior probabilities to base propositions',
        'Define conditional probability tables for logical rules',
        'Handle logical connectives probabilistically (noisy-OR, noisy-AND)',
        'Model implication rules with appropriate probability weights',
        'Construct Bayesian network or Markov logic network structure',
        'Validate probability distributions (sum to 1, valid ranges)',
        'Handle missing probability specifications with maximum entropy',
        'Document model assumptions and simplifications',
        'Save probabilistic model to output directory'
      ],
      outputFormat: 'JSON with model (object), variables (array), conditionalProbabilities (object), networkStructure (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'variables', 'conditionalProbabilities', 'artifacts'],
      properties: {
        model: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            variables: { type: 'array' },
            edges: { type: 'array' },
            parameters: { type: 'object' }
          }
        },
        variables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              domain: { type: 'array' },
              prior: { type: 'number' }
            }
          }
        },
        conditionalProbabilities: { type: 'object' },
        networkStructure: {
          type: 'object',
          properties: {
            nodes: { type: 'array' },
            edges: { type: 'array' },
            roots: { type: 'array' }
          }
        },
        modelAssumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'probabilistic-logic', 'modeling']
}));

// Task 3: Uncertain Inference
export const uncertainInferenceTask = defineTask('uncertain-inference', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform logical inference with uncertainty propagation',
  agent: {
    name: 'inference-engine-agent',
    prompt: {
      role: 'automated reasoning specialist and inference expert',
      task: 'Perform logical inference while propagating probabilistic uncertainty',
      context: args,
      instructions: [
        'Apply forward chaining to derive new conclusions',
        'Apply backward chaining to verify hypotheses',
        'Propagate uncertainty through inference chains',
        'Handle uncertain premises with probability calculus',
        'Apply probabilistic modus ponens and modus tollens',
        'Track inference provenance (which rules/facts led to conclusion)',
        'Compute confidence bounds for derived conclusions',
        'Identify inference paths with highest confidence',
        'Detect circular reasoning and handle appropriately',
        'Generate inference trace for explanation',
        'Save inference results to output directory'
      ],
      outputFormat: 'JSON with inferences (array), inferenceChains (array), derivedFacts (array), confidenceBounds (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['inferences', 'inferenceChains', 'artifacts'],
      properties: {
        inferences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conclusion: { type: 'string' },
              probability: { type: 'number' },
              confidence: { type: 'number' },
              supportingEvidence: { type: 'array' },
              inferenceRule: { type: 'string' }
            }
          }
        },
        inferenceChains: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesis: { type: 'string' },
              steps: { type: 'array' },
              finalProbability: { type: 'number' }
            }
          }
        },
        derivedFacts: { type: 'array' },
        confidenceBounds: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              lower: { type: 'number' },
              upper: { type: 'number' }
            }
          }
        },
        circularPathsDetected: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'probabilistic-logic', 'inference']
}));

// Task 4: Posterior Computation
export const posteriorComputationTask = defineTask('posterior-computation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute posterior probabilities for hypotheses',
  agent: {
    name: 'bayesian-computation-agent',
    prompt: {
      role: 'Bayesian statistician and probability theorist',
      task: 'Compute posterior probabilities for all hypotheses given evidence and inferences',
      context: args,
      instructions: [
        'Apply Bayes theorem to update prior beliefs',
        'Compute marginal probabilities for all hypotheses',
        'Handle multiple evidence items with sequential updating',
        'Compute joint probabilities for hypothesis combinations',
        'Calculate likelihood ratios for competing hypotheses',
        'Apply belief propagation or variable elimination as appropriate',
        'Compute maximum a posteriori (MAP) estimates',
        'Calculate expected values for continuous quantities',
        'Validate posterior probabilities (proper distributions)',
        'Save posterior computations to output directory'
      ],
      outputFormat: 'JSON with posteriors (object), marginals (object), jointProbabilities (object), mapEstimates (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['posteriors', 'marginals', 'artifacts'],
      properties: {
        posteriors: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        marginals: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        jointProbabilities: { type: 'object' },
        mapEstimates: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              probability: { type: 'number' }
            }
          }
        },
        likelihoodRatios: { type: 'object' },
        beliefUpdates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesis: { type: 'string' },
              prior: { type: 'number' },
              posterior: { type: 'number' },
              change: { type: 'number' }
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
  labels: ['agent', 'scientific-discovery', 'probabilistic-logic', 'bayesian']
}));

// Task 5: Uncertainty Quantification
export const uncertaintyQuantificationTask = defineTask('uncertainty-quantification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantify and analyze reasoning uncertainty',
  agent: {
    name: 'uncertainty-analysis-agent',
    prompt: {
      role: 'uncertainty quantification specialist',
      task: 'Analyze and quantify all sources of uncertainty in the reasoning process',
      context: args,
      instructions: [
        'Classify uncertainty types (aleatory vs epistemic)',
        'Compute entropy measures for probability distributions',
        'Calculate confidence intervals for conclusions',
        'Identify high-uncertainty conclusions needing more evidence',
        'Perform sensitivity analysis on prior assumptions',
        'Quantify model uncertainty vs parameter uncertainty',
        'Identify conclusions above confidence threshold',
        'Rank conclusions by certainty level',
        'Suggest evidence that would reduce uncertainty most',
        'Save uncertainty analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (object), highConfidenceConclusions (array), highConfidenceCount (number), uncertaintyBreakdown (object), sensitivityResults (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'highConfidenceConclusions', 'highConfidenceCount', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            overallEntropy: { type: 'number' },
            epistemic: { type: 'number' },
            aleatory: { type: 'number' },
            modelUncertainty: { type: 'number' }
          }
        },
        highConfidenceConclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conclusion: { type: 'string' },
              probability: { type: 'number' },
              confidence: { type: 'number' }
            }
          }
        },
        highConfidenceCount: { type: 'number' },
        uncertaintyBreakdown: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              uncertainty: { type: 'number' },
              type: { type: 'string' },
              reducible: { type: 'boolean' }
            }
          }
        },
        sensitivityResults: {
          type: 'object',
          properties: {
            sensitiveParameters: { type: 'array' },
            robustConclusions: { type: 'array' }
          }
        },
        suggestedEvidence: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'probabilistic-logic', 'uncertainty']
}));

// Task 6: Reasoning Quality Assessment
export const reasoningQualityTask = defineTask('reasoning-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess quality of probabilistic logical reasoning',
  agent: {
    name: 'reasoning-quality-agent',
    prompt: {
      role: 'logic and reasoning quality assessor',
      task: 'Evaluate the quality, soundness, and completeness of the probabilistic reasoning',
      context: args,
      instructions: [
        'Assess logical soundness of formalization (weight: 20%)',
        'Evaluate probabilistic model validity (weight: 20%)',
        'Check inference correctness and completeness (weight: 25%)',
        'Assess uncertainty quantification adequacy (weight: 20%)',
        'Evaluate overall coherence and consistency (weight: 15%)',
        'Identify logical fallacies or probabilistic errors',
        'Check for proper handling of uncertainty',
        'Validate that conclusions follow from premises',
        'Calculate weighted overall quality score (0-100)',
        'Provide improvement recommendations',
        'Save quality assessment to output directory'
      ],
      outputFormat: 'JSON with overallScore (number), componentScores (object), issues (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            formalizationSoundness: { type: 'number' },
            modelValidity: { type: 'number' },
            inferenceCorrectness: { type: 'number' },
            uncertaintyHandling: { type: 'number' },
            overallCoherence: { type: 'number' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              severity: { type: 'string' },
              description: { type: 'string' },
              location: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'probabilistic-logic', 'quality']
}));

// Task 7: Report Generation
export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive probabilistic logic report',
  agent: {
    name: 'report-generation-agent',
    prompt: {
      role: 'scientific report writer and technical communicator',
      task: 'Generate a comprehensive report on the probabilistic logic reasoning process',
      context: args,
      instructions: [
        'Create executive summary of key findings',
        'Document knowledge base formalization',
        'Describe probabilistic model structure',
        'Present inference chains and derivations',
        'Show posterior probabilities for all hypotheses',
        'Explain uncertainty analysis results',
        'Visualize Bayesian network structure',
        'Include probability tables and distributions',
        'Provide interpretation guidance',
        'List limitations and assumptions',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), keyFindings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        visualizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'probabilistic-logic', 'reporting']
}));
