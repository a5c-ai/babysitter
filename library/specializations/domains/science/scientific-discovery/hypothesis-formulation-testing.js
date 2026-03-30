/**
 * @process domains/science/scientific-discovery/hypothesis-formulation-testing
 * @description Develop testable hypotheses and design experiments - Guides researchers through formulating clear,
 * falsifiable hypotheses from observations, defining variables, specifying predictions, and designing rigorous tests.
 * @inputs { researchQuestion: string, observations: array, domain: string, existingTheories?: array, constraints?: object }
 * @outputs { success: boolean, hypothesis: object, variables: object, predictions: array, experimentDesign: object, testingPlan: object }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/hypothesis-formulation-testing', {
 *   researchQuestion: 'Does increased screen time affect sleep quality in adolescents?',
 *   observations: ['Teens with high screen use report tiredness', 'Blue light exposure delays melatonin'],
 *   domain: 'behavioral-health',
 *   existingTheories: ['Blue light suppresses melatonin', 'Cognitive arousal delays sleep onset']
 * });
 *
 * @references
 * - Popper, K. (1959). The Logic of Scientific Discovery
 * - Platt, J.R. (1964). Strong Inference. Science.
 * - Mayo, D.G. (2018). Statistical Inference as Severe Testing
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchQuestion,
    observations = [],
    domain = 'general-science',
    existingTheories = [],
    constraints = {},
    outputDir = 'hypothesis-testing-output',
    minimumRigorScore = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Hypothesis Formulation and Testing for: ${researchQuestion}`);

  // ============================================================================
  // PHASE 1: OBSERVATION ANALYSIS AND PATTERN IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing observations and identifying patterns');
  const observationAnalysis = await ctx.task(observationAnalysisTask, {
    researchQuestion,
    observations,
    domain,
    existingTheories,
    outputDir
  });

  artifacts.push(...observationAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: HYPOTHESIS GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Generating candidate hypotheses');
  const hypothesisGeneration = await ctx.task(hypothesisGenerationTask, {
    researchQuestion,
    observationAnalysis,
    existingTheories,
    domain,
    outputDir
  });

  artifacts.push(...hypothesisGeneration.artifacts);

  // ============================================================================
  // PHASE 3: HYPOTHESIS EVALUATION AND SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Evaluating and selecting optimal hypothesis');
  const hypothesisEvaluation = await ctx.task(hypothesisEvaluationTask, {
    researchQuestion,
    candidateHypotheses: hypothesisGeneration.hypotheses,
    observationAnalysis,
    domain,
    outputDir
  });

  artifacts.push(...hypothesisEvaluation.artifacts);

  // Breakpoint: Review selected hypothesis
  await ctx.breakpoint({
    question: `Selected hypothesis: "${hypothesisEvaluation.selectedHypothesis.statement}". Falsifiability score: ${hypothesisEvaluation.selectedHypothesis.falsifiabilityScore}/100. Approve for experiment design?`,
    title: 'Hypothesis Selection Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        researchQuestion,
        selectedHypothesis: hypothesisEvaluation.selectedHypothesis.statement,
        alternativeCount: hypothesisEvaluation.alternativeHypotheses?.length || 0,
        falsifiabilityScore: hypothesisEvaluation.selectedHypothesis.falsifiabilityScore
      }
    }
  });

  // ============================================================================
  // PHASE 4: VARIABLE OPERATIONALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Operationalizing variables');
  const variableOperationalization = await ctx.task(variableOperationalizationTask, {
    hypothesis: hypothesisEvaluation.selectedHypothesis,
    domain,
    constraints,
    outputDir
  });

  artifacts.push(...variableOperationalization.artifacts);

  // ============================================================================
  // PHASE 5: PREDICTION SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Specifying testable predictions');
  const predictionSpecification = await ctx.task(predictionSpecificationTask, {
    hypothesis: hypothesisEvaluation.selectedHypothesis,
    variables: variableOperationalization,
    domain,
    outputDir
  });

  artifacts.push(...predictionSpecification.artifacts);

  // ============================================================================
  // PHASE 6: EXPERIMENT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing experiment to test hypothesis');
  const experimentDesign = await ctx.task(experimentDesignTask, {
    hypothesis: hypothesisEvaluation.selectedHypothesis,
    variables: variableOperationalization,
    predictions: predictionSpecification,
    constraints,
    domain,
    outputDir
  });

  artifacts.push(...experimentDesign.artifacts);

  // ============================================================================
  // PHASE 7: STATISTICAL TESTING PLAN
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing statistical testing plan');
  const statisticalPlan = await ctx.task(statisticalTestingPlanTask, {
    hypothesis: hypothesisEvaluation.selectedHypothesis,
    experimentDesign,
    variables: variableOperationalization,
    predictions: predictionSpecification,
    outputDir
  });

  artifacts.push(...statisticalPlan.artifacts);

  // ============================================================================
  // PHASE 8: RIGOR AND VALIDITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing research rigor and validity');
  const rigorAssessment = await ctx.task(rigorAssessmentTask, {
    hypothesis: hypothesisEvaluation.selectedHypothesis,
    experimentDesign,
    statisticalPlan,
    variables: variableOperationalization,
    minimumRigorScore,
    outputDir
  });

  artifacts.push(...rigorAssessment.artifacts);

  const rigorMet = rigorAssessment.overallScore >= minimumRigorScore;

  // Final breakpoint: Approve testing plan
  await ctx.breakpoint({
    question: `Hypothesis testing plan complete. Rigor score: ${rigorAssessment.overallScore}/100. ${rigorMet ? 'Plan meets scientific standards!' : 'Plan may need strengthening.'} Approve to proceed?`,
    title: 'Hypothesis Testing Plan Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        hypothesis: hypothesisEvaluation.selectedHypothesis.statement,
        rigorScore: rigorAssessment.overallScore,
        rigorMet,
        experimentType: experimentDesign.designType,
        statisticalTest: statisticalPlan.primaryTest,
        sampleSize: experimentDesign.sampleSize
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    researchQuestion,
    hypothesis: {
      statement: hypothesisEvaluation.selectedHypothesis.statement,
      nullHypothesis: hypothesisEvaluation.selectedHypothesis.nullHypothesis,
      alternativeHypothesis: hypothesisEvaluation.selectedHypothesis.alternativeHypothesis,
      falsifiabilityScore: hypothesisEvaluation.selectedHypothesis.falsifiabilityScore,
      assumptions: hypothesisEvaluation.selectedHypothesis.assumptions,
      scope: hypothesisEvaluation.selectedHypothesis.scope
    },
    variables: {
      independent: variableOperationalization.independentVariables,
      dependent: variableOperationalization.dependentVariables,
      controlled: variableOperationalization.controlledVariables,
      confounding: variableOperationalization.potentialConfounds,
      operationalDefinitions: variableOperationalization.operationalDefinitions
    },
    predictions: {
      primary: predictionSpecification.primaryPredictions,
      secondary: predictionSpecification.secondaryPredictions,
      falsificationCriteria: predictionSpecification.falsificationCriteria
    },
    experimentDesign: {
      designType: experimentDesign.designType,
      methodology: experimentDesign.methodology,
      sampleSize: experimentDesign.sampleSize,
      procedures: experimentDesign.procedures,
      controls: experimentDesign.controls,
      timeline: experimentDesign.timeline
    },
    testingPlan: {
      primaryTest: statisticalPlan.primaryTest,
      alpha: statisticalPlan.alpha,
      power: statisticalPlan.power,
      effectSize: statisticalPlan.expectedEffectSize,
      analysisSteps: statisticalPlan.analysisSteps
    },
    rigorAssessment: {
      overallScore: rigorAssessment.overallScore,
      rigorMet,
      internalValidity: rigorAssessment.internalValidity,
      externalValidity: rigorAssessment.externalValidity,
      constructValidity: rigorAssessment.constructValidity,
      recommendations: rigorAssessment.recommendations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/scientific-discovery/hypothesis-formulation-testing',
      timestamp: startTime,
      domain,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const observationAnalysisTask = defineTask('observation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze observations and identify patterns',
  agent: {
    name: 'hypothesis-architect',
    skills: ['hypothesis-generator', 'statistical-test-selector', 'semantic-scholar-search'],
    prompt: {
      role: 'Research scientist specializing in pattern recognition and scientific observation',
      task: 'Analyze observations systematically to identify patterns, anomalies, and potential causal relationships',
      context: args,
      instructions: [
        'Catalog and categorize all observations systematically',
        'Identify recurring patterns and themes across observations',
        'Note anomalies or unexpected findings that require explanation',
        'Connect observations to existing theories and knowledge',
        'Identify potential causal relationships suggested by observations',
        'Assess reliability and quality of each observation',
        'Identify gaps in observations that need further data',
        'Generate preliminary explanatory frameworks',
        'Document assumptions implicit in observations',
        'Create observation synthesis report'
      ],
      outputFormat: 'JSON with patterns, anomalies, potentialCausalLinks, theoreticalConnections, observationQuality, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'potentialCausalLinks', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              supportingObservations: { type: 'array', items: { type: 'string' } },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] }
            }
          }
        },
        anomalies: { type: 'array', items: { type: 'string' } },
        potentialCausalLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              effect: { type: 'string' },
              mechanism: { type: 'string' },
              confidence: { type: 'string' }
            }
          }
        },
        theoreticalConnections: { type: 'array', items: { type: 'string' } },
        observationQuality: { type: 'number', minimum: 0, maximum: 100 },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'observation-analysis']
}));

export const hypothesisGenerationTask = defineTask('hypothesis-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate candidate hypotheses',
  agent: {
    name: 'hypothesis-architect',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'semantic-scholar-search'],
    prompt: {
      role: 'Theoretical scientist skilled in hypothesis generation and scientific reasoning',
      task: 'Generate multiple candidate hypotheses that could explain observed patterns and answer the research question',
      context: args,
      instructions: [
        'Generate at least 3-5 distinct candidate hypotheses',
        'Ensure each hypothesis is specific and falsifiable',
        'Include both conservative and bold hypotheses',
        'Consider mechanisms and causal pathways',
        'Align hypotheses with existing theoretical frameworks where applicable',
        'Identify novel hypotheses that challenge existing assumptions',
        'For each hypothesis, specify what it predicts and what would falsify it',
        'Rate each hypothesis on novelty, parsimony, and explanatory power',
        'Consider competing and complementary hypotheses',
        'Document the reasoning process for each hypothesis'
      ],
      outputFormat: 'JSON with hypotheses (array of detailed hypothesis objects), generationRationale, artifacts'
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
              statement: { type: 'string' },
              mechanism: { type: 'string' },
              predictions: { type: 'array', items: { type: 'string' } },
              falsificationCriteria: { type: 'array', items: { type: 'string' } },
              novelty: { type: 'number', minimum: 0, maximum: 100 },
              parsimony: { type: 'number', minimum: 0, maximum: 100 },
              explanatoryPower: { type: 'number', minimum: 0, maximum: 100 },
              theoreticalBasis: { type: 'string' }
            }
          }
        },
        generationRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'hypothesis-generation']
}));

export const hypothesisEvaluationTask = defineTask('hypothesis-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate and select optimal hypothesis',
  agent: {
    name: 'hypothesis-architect',
    skills: ['hypothesis-generator', 'formal-logic-reasoner', 'bayesian-inference-engine'],
    prompt: {
      role: 'Philosophy of science expert specializing in hypothesis evaluation',
      task: 'Systematically evaluate candidate hypotheses and select the most promising one for testing',
      context: args,
      instructions: [
        'Evaluate each hypothesis against Popper\'s falsifiability criterion',
        'Assess logical consistency and coherence of each hypothesis',
        'Evaluate fit with existing evidence and observations',
        'Apply Occam\'s razor - prefer simpler explanations',
        'Consider practical testability given constraints',
        'Assess potential scientific impact if confirmed',
        'Identify the hypothesis with best risk-reward profile',
        'Formulate null and alternative hypotheses for selected hypothesis',
        'Document assumptions and boundary conditions',
        'Provide selection rationale and comparison matrix'
      ],
      outputFormat: 'JSON with selectedHypothesis (detailed object), alternativeHypotheses, evaluationMatrix, selectionRationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedHypothesis', 'evaluationMatrix', 'artifacts'],
      properties: {
        selectedHypothesis: {
          type: 'object',
          properties: {
            statement: { type: 'string' },
            nullHypothesis: { type: 'string' },
            alternativeHypothesis: { type: 'string' },
            falsifiabilityScore: { type: 'number', minimum: 0, maximum: 100 },
            assumptions: { type: 'array', items: { type: 'string' } },
            scope: { type: 'string' },
            mechanism: { type: 'string' }
          }
        },
        alternativeHypotheses: { type: 'array' },
        evaluationMatrix: { type: 'object' },
        selectionRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'hypothesis-evaluation']
}));

export const variableOperationalizationTask = defineTask('variable-operationalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Operationalize variables',
  agent: {
    name: 'experimental-designer',
    skills: ['hypothesis-generator', 'statistical-test-selector'],
    prompt: {
      role: 'Research methodologist specializing in measurement and operationalization',
      task: 'Define operational definitions for all variables in the hypothesis to make them measurable',
      context: args,
      instructions: [
        'Identify all independent variables and their levels',
        'Identify all dependent variables and their measurement',
        'Identify variables to be controlled or held constant',
        'Identify potential confounding variables',
        'Create clear operational definitions for each variable',
        'Specify measurement instruments and scales',
        'Define validity and reliability criteria for measures',
        'Specify data types and units for each variable',
        'Address potential measurement biases',
        'Document measurement protocols'
      ],
      outputFormat: 'JSON with independentVariables, dependentVariables, controlledVariables, potentialConfounds, operationalDefinitions, measurementProtocols, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['independentVariables', 'dependentVariables', 'operationalDefinitions', 'artifacts'],
      properties: {
        independentVariables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              levels: { type: 'array', items: { type: 'string' } },
              manipulation: { type: 'string' }
            }
          }
        },
        dependentVariables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              measurement: { type: 'string' },
              scale: { type: 'string' },
              unit: { type: 'string' }
            }
          }
        },
        controlledVariables: { type: 'array', items: { type: 'string' } },
        potentialConfounds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              controlStrategy: { type: 'string' }
            }
          }
        },
        operationalDefinitions: { type: 'object' },
        measurementProtocols: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'operationalization']
}));

export const predictionSpecificationTask = defineTask('prediction-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify testable predictions',
  agent: {
    name: 'hypothesis-architect',
    skills: ['hypothesis-generator', 'formal-logic-reasoner'],
    prompt: {
      role: 'Theoretical scientist specializing in deductive reasoning and prediction',
      task: 'Derive specific, testable predictions from the hypothesis that can be empirically verified or falsified',
      context: args,
      instructions: [
        'Derive primary predictions that directly test the hypothesis',
        'Derive secondary predictions that provide additional support',
        'Specify exact conditions under which predictions should hold',
        'Define quantitative expected outcomes where possible',
        'Specify what observations would falsify the hypothesis',
        'Identify predictions that distinguish this hypothesis from alternatives',
        'Consider edge cases and boundary conditions',
        'Specify confidence levels for predictions',
        'Document reasoning chain from hypothesis to predictions',
        'Create prediction testing checklist'
      ],
      outputFormat: 'JSON with primaryPredictions, secondaryPredictions, falsificationCriteria, distinguishingPredictions, predictionRationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryPredictions', 'falsificationCriteria', 'artifacts'],
      properties: {
        primaryPredictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              prediction: { type: 'string' },
              conditions: { type: 'string' },
              expectedOutcome: { type: 'string' },
              confidence: { type: 'number' }
            }
          }
        },
        secondaryPredictions: { type: 'array' },
        falsificationCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              observation: { type: 'string' },
              implication: { type: 'string' }
            }
          }
        },
        distinguishingPredictions: { type: 'array' },
        predictionRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'prediction']
}));

export const experimentDesignTask = defineTask('experiment-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design experiment to test hypothesis',
  agent: {
    name: 'experimental-designer',
    skills: ['hypothesis-generator', 'statistical-test-selector', 'power-analysis-calculator'],
    prompt: {
      role: 'Experimental scientist specializing in research design',
      task: 'Design a rigorous experiment to test the hypothesis and its predictions',
      context: args,
      instructions: [
        'Select appropriate experimental design (RCT, quasi-experimental, observational)',
        'Determine required sample size using power analysis',
        'Design control conditions and comparison groups',
        'Specify randomization procedures if applicable',
        'Design data collection procedures and protocols',
        'Plan for potential threats to validity',
        'Specify inclusion/exclusion criteria',
        'Design blinding procedures if applicable',
        'Create detailed experimental timeline',
        'Document ethical considerations and approvals needed'
      ],
      outputFormat: 'JSON with designType, methodology, sampleSize, procedures, controls, timeline, validityThreats, ethicalConsiderations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['designType', 'methodology', 'sampleSize', 'procedures', 'artifacts'],
      properties: {
        designType: { type: 'string' },
        methodology: { type: 'string' },
        sampleSize: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            perGroup: { type: 'number' },
            justification: { type: 'string' }
          }
        },
        procedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              action: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        controls: {
          type: 'object',
          properties: {
            controlGroup: { type: 'string' },
            controlConditions: { type: 'array', items: { type: 'string' } }
          }
        },
        timeline: { type: 'object' },
        validityThreats: { type: 'array', items: { type: 'string' } },
        ethicalConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'experiment-design']
}));

export const statisticalTestingPlanTask = defineTask('statistical-testing-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop statistical testing plan',
  agent: {
    name: 'statistical-consultant',
    skills: ['statistical-test-selector', 'power-analysis-calculator', 'regression-analyzer'],
    prompt: {
      role: 'Biostatistician specializing in hypothesis testing and statistical analysis',
      task: 'Develop comprehensive statistical analysis plan for testing the hypothesis',
      context: args,
      instructions: [
        'Select appropriate statistical tests based on data type and design',
        'Specify significance level (alpha) and justify choice',
        'Calculate required statistical power',
        'Specify expected effect size based on prior research',
        'Plan for multiple comparison corrections if needed',
        'Specify assumptions and how to test them',
        'Plan sensitivity analyses',
        'Specify analysis sequence and decision rules',
        'Document software and tools for analysis',
        'Create analysis code templates or pseudocode'
      ],
      outputFormat: 'JSON with primaryTest, alpha, power, expectedEffectSize, analysisSteps, assumptions, sensitivityAnalyses, decisionRules, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryTest', 'alpha', 'power', 'analysisSteps', 'artifacts'],
      properties: {
        primaryTest: { type: 'string' },
        alpha: { type: 'number' },
        power: { type: 'number' },
        expectedEffectSize: { type: 'string' },
        analysisSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              analysis: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        sensitivityAnalyses: { type: 'array', items: { type: 'string' } },
        decisionRules: { type: 'object' },
        multipleComparisonCorrection: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'statistical-testing']
}));

export const rigorAssessmentTask = defineTask('rigor-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess research rigor and validity',
  agent: {
    name: 'experimental-designer',
    skills: ['hypothesis-generator', 'statistical-test-selector', 'formal-logic-reasoner'],
    prompt: {
      role: 'Research methodology expert and peer reviewer',
      task: 'Assess the overall rigor and validity of the hypothesis testing plan',
      context: args,
      instructions: [
        'Assess internal validity - can results be attributed to IV?',
        'Assess external validity - can results generalize?',
        'Assess construct validity - do measures capture intended constructs?',
        'Assess statistical conclusion validity',
        'Check for potential biases in design',
        'Evaluate adequacy of controls',
        'Assess reproducibility and replicability',
        'Evaluate adherence to scientific method principles',
        'Calculate overall rigor score (0-100)',
        'Provide specific recommendations for improvement'
      ],
      outputFormat: 'JSON with overallScore, internalValidity, externalValidity, constructValidity, statisticalValidity, biases, controlAdequacy, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'internalValidity', 'externalValidity', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        internalValidity: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            strengths: { type: 'array', items: { type: 'string' } },
            weaknesses: { type: 'array', items: { type: 'string' } }
          }
        },
        externalValidity: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            strengths: { type: 'array', items: { type: 'string' } },
            weaknesses: { type: 'array', items: { type: 'string' } }
          }
        },
        constructValidity: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            strengths: { type: 'array', items: { type: 'string' } },
            weaknesses: { type: 'array', items: { type: 'string' } }
          }
        },
        statisticalValidity: { type: 'object' },
        biases: { type: 'array', items: { type: 'string' } },
        controlAdequacy: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'rigor-assessment']
}));
