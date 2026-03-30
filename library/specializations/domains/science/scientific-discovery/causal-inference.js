/**
 * @process specializations/domains/science/scientific-discovery/causal-inference
 * @description Causal Inference Process - Identify causal relations and predict intervention effects
 * using structural causal models, do-calculus, and potential outcomes frameworks for scientific discovery.
 * @inputs { domain: string, variables: string[], observationalData?: object, priorKnowledge?: string[], researchQuestion: string }
 * @outputs { success: boolean, causalModel: object, interventionPredictions: object[], causalEffects: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/causal-inference', {
 *   domain: 'Epidemiology',
 *   variables: ['smoking', 'lung_cancer', 'age', 'genetics'],
 *   researchQuestion: 'What is the causal effect of smoking on lung cancer controlling for confounders?',
 *   priorKnowledge: ['Age affects both smoking probability and cancer risk']
 * });
 *
 * @references
 * - Pearl, J. (2009). Causality: Models, Reasoning, and Inference
 * - Imbens & Rubin (2015). Causal Inference for Statistics, Social, and Biomedical Sciences
 * - Peters, Janzing, Scholkopf (2017). Elements of Causal Inference
 * - Hernan & Robins (2020). Causal Inference: What If
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domain,
    variables,
    observationalData = null,
    priorKnowledge = [],
    researchQuestion
  } = inputs;

  // Phase 1: Causal Framework Selection
  const frameworkSelection = await ctx.task(causalFrameworkSelectionTask, {
    domain,
    variables,
    researchQuestion,
    priorKnowledge
  });

  // Quality Gate: Framework must be selected
  if (!frameworkSelection.selectedFramework) {
    return {
      success: false,
      error: 'Failed to select appropriate causal inference framework',
      phase: 'framework-selection',
      causalModel: null
    };
  }

  // Phase 2: Causal Graph Construction
  const causalGraph = await ctx.task(causalGraphConstructionTask, {
    domain,
    variables,
    priorKnowledge,
    framework: frameworkSelection.selectedFramework
  });

  // Phase 3: Identification Analysis
  const identificationAnalysis = await ctx.task(identificationAnalysisTask, {
    causalGraph,
    researchQuestion,
    variables,
    framework: frameworkSelection.selectedFramework
  });

  // Quality Gate: Causal effect must be identifiable
  if (!identificationAnalysis.isIdentifiable) {
    await ctx.breakpoint({
      question: `Causal effect is not identifiable from observational data. Reasons: ${identificationAnalysis.identificationFailures.join(', ')}. Should we proceed with sensitivity analysis or halt?`,
      title: 'Causal Identification Failure',
      context: {
        runId: ctx.runId,
        identificationAnalysis,
        recommendation: 'Consider instrumental variables, regression discontinuity, or natural experiments'
      }
    });
  }

  // Phase 4: Confounder Identification
  const confounderAnalysis = await ctx.task(confounderIdentificationTask, {
    causalGraph,
    treatment: identificationAnalysis.treatment,
    outcome: identificationAnalysis.outcome,
    variables
  });

  // Phase 5: Estimation Strategy Selection
  const estimationStrategy = await ctx.task(estimationStrategyTask, {
    identificationAnalysis,
    confounderAnalysis,
    framework: frameworkSelection.selectedFramework,
    observationalData
  });

  // Phase 6: Causal Effect Estimation
  const causalEffectEstimation = await ctx.task(causalEffectEstimationTask, {
    causalGraph,
    estimationStrategy,
    confounderAnalysis,
    observationalData,
    treatment: identificationAnalysis.treatment,
    outcome: identificationAnalysis.outcome
  });

  // Phase 7: Intervention Prediction
  const interventionPrediction = await ctx.task(interventionPredictionTask, {
    causalEffectEstimation,
    causalGraph,
    researchQuestion,
    domain
  });

  // Phase 8: Sensitivity Analysis
  const sensitivityAnalysis = await ctx.task(sensitivityAnalysisTask, {
    causalEffectEstimation,
    identificationAnalysis,
    confounderAnalysis,
    framework: frameworkSelection.selectedFramework
  });

  // Phase 9: Validation and Robustness Checks
  const validationResults = await ctx.task(causalValidationTask, {
    causalEffectEstimation,
    sensitivityAnalysis,
    causalGraph,
    domain
  });

  // Final Breakpoint: Expert Review
  await ctx.breakpoint({
    question: `Causal inference analysis complete for: "${researchQuestion}". Review causal model and estimated effects?`,
    title: 'Causal Inference Review',
    context: {
      runId: ctx.runId,
      domain,
      causalEffects: causalEffectEstimation.effects,
      confidence: validationResults.overallConfidence,
      files: [
        { path: 'artifacts/causal-model.json', format: 'json', content: causalGraph },
        { path: 'artifacts/causal-effects.json', format: 'json', content: causalEffectEstimation }
      ]
    }
  });

  return {
    success: true,
    domain,
    researchQuestion,
    causalModel: {
      graph: causalGraph,
      framework: frameworkSelection.selectedFramework,
      assumptions: identificationAnalysis.assumptions
    },
    causalEffects: {
      treatment: identificationAnalysis.treatment,
      outcome: identificationAnalysis.outcome,
      estimatedEffect: causalEffectEstimation.effects,
      confidenceInterval: causalEffectEstimation.confidenceInterval,
      methodology: estimationStrategy.selectedMethod
    },
    interventionPredictions: interventionPrediction.predictions,
    confounders: confounderAnalysis.identifiedConfounders,
    sensitivityAnalysis: sensitivityAnalysis.results,
    validationResults: validationResults,
    recommendations: validationResults.recommendations,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/causal-inference',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const causalFrameworkSelectionTask = defineTask('causal-framework-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Causal Framework Selection - ${args.domain}`,
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'systems-dynamics-modeler'],
    prompt: {
      role: 'Causal Inference Expert specializing in structural causal models and potential outcomes',
      task: 'Select the most appropriate causal inference framework for the research question',
      context: {
        domain: args.domain,
        variables: args.variables,
        researchQuestion: args.researchQuestion,
        priorKnowledge: args.priorKnowledge
      },
      instructions: [
        '1. Analyze the research question to identify treatment and outcome variables',
        '2. Evaluate applicability of Structural Causal Models (SCM) / Pearl framework',
        '3. Evaluate applicability of Potential Outcomes / Rubin Causal Model (RCM)',
        '4. Consider domain-specific causal frameworks (econometrics, epidemiology, etc.)',
        '5. Assess data requirements for each framework',
        '6. Evaluate identification assumptions needed for each approach',
        '7. Consider computational and practical constraints',
        '8. Recommend primary and alternative frameworks with justification',
        '9. Identify key assumptions that must hold for valid inference',
        '10. Specify necessary and sufficient conditions for causal identification'
      ],
      outputFormat: 'JSON object with framework selection and justification'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedFramework', 'justification', 'assumptions'],
      properties: {
        selectedFramework: {
          type: 'string',
          enum: ['structural-causal-model', 'potential-outcomes', 'instrumental-variables', 'regression-discontinuity', 'difference-in-differences', 'synthetic-control', 'granger-causality']
        },
        alternativeFrameworks: {
          type: 'array',
          items: { type: 'string' }
        },
        justification: { type: 'string' },
        assumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              testable: { type: 'boolean' },
              plausibility: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        dataRequirements: {
          type: 'array',
          items: { type: 'string' }
        },
        limitations: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['causal-inference', 'framework-selection', 'scientific-discovery']
}));

export const causalGraphConstructionTask = defineTask('causal-graph-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Causal Graph Construction - ${args.domain}`,
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'network-visualizer', 'systems-dynamics-modeler'],
    prompt: {
      role: 'Expert in Directed Acyclic Graphs (DAGs) and causal structure learning',
      task: 'Construct a causal graph representing relationships between variables',
      context: {
        domain: args.domain,
        variables: args.variables,
        priorKnowledge: args.priorKnowledge,
        framework: args.framework
      },
      instructions: [
        '1. Identify all relevant variables including potential confounders and mediators',
        '2. Determine causal direction between variable pairs based on domain knowledge',
        '3. Construct a Directed Acyclic Graph (DAG) representing causal relationships',
        '4. Identify backdoor paths between treatment and outcome',
        '5. Identify frontdoor paths if applicable',
        '6. Mark observed vs unobserved (latent) variables',
        '7. Identify instrumental variables if present',
        '8. Document assumptions underlying each causal arrow',
        '9. Check for cycles and resolve if present',
        '10. Provide graph in both visual description and adjacency list format'
      ],
      outputFormat: 'JSON object with complete causal graph specification'
    },
    outputSchema: {
      type: 'object',
      required: ['nodes', 'edges', 'graphType'],
      properties: {
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['treatment', 'outcome', 'confounder', 'mediator', 'collider', 'instrument', 'latent'] },
              observed: { type: 'boolean' }
            }
          }
        },
        edges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              type: { type: 'string', enum: ['causal', 'association', 'bidirectional'] },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              evidence: { type: 'string' }
            }
          }
        },
        graphType: { type: 'string', enum: ['DAG', 'ADMG', 'PAG', 'CPDAG'] },
        backdoorPaths: {
          type: 'array',
          items: { type: 'string' }
        },
        frontdoorPaths: {
          type: 'array',
          items: { type: 'string' }
        },
        adjacencyMatrix: { type: 'object' },
        graphDescription: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['causal-inference', 'dag-construction', 'causal-graph']
}));

export const identificationAnalysisTask = defineTask('identification-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Causal Effect Identification Analysis',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in causal identification theory and do-calculus',
      task: 'Determine if causal effect is identifiable from observational data',
      context: {
        causalGraph: args.causalGraph,
        researchQuestion: args.researchQuestion,
        variables: args.variables,
        framework: args.framework
      },
      instructions: [
        '1. Identify the treatment variable (intervention) and outcome variable',
        '2. Apply do-calculus rules to determine if P(Y|do(X)) is identifiable',
        '3. Check backdoor criterion - can all backdoor paths be blocked?',
        '4. Check frontdoor criterion if backdoor fails',
        '5. Identify sufficient adjustment sets for confounding control',
        '6. Check for instrumental variable identification strategy',
        '7. Identify any forbidden adjustments (e.g., colliders, mediators)',
        '8. Document all identification assumptions required',
        '9. Assess plausibility of ignorability/unconfoundedness assumption',
        '10. Provide identification formula if effect is identifiable'
      ],
      outputFormat: 'JSON object with identification analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['isIdentifiable', 'treatment', 'outcome'],
      properties: {
        treatment: { type: 'string' },
        outcome: { type: 'string' },
        isIdentifiable: { type: 'boolean' },
        identificationStrategy: {
          type: 'string',
          enum: ['backdoor', 'frontdoor', 'instrumental-variable', 'regression-discontinuity', 'not-identifiable']
        },
        adjustmentSets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variables: { type: 'array', items: { type: 'string' } },
              sufficient: { type: 'boolean' },
              minimal: { type: 'boolean' }
            }
          }
        },
        identificationFormula: { type: 'string' },
        assumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              type: { type: 'string' },
              testable: { type: 'boolean' }
            }
          }
        },
        forbiddenAdjustments: {
          type: 'array',
          items: { type: 'string' }
        },
        identificationFailures: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['causal-inference', 'identification', 'do-calculus']
}));

export const confounderIdentificationTask = defineTask('confounder-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Confounder Identification and Analysis',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in confounding bias and causal adjustment',
      task: 'Identify and analyze confounding variables in the causal model',
      context: {
        causalGraph: args.causalGraph,
        treatment: args.treatment,
        outcome: args.outcome,
        variables: args.variables
      },
      instructions: [
        '1. Identify all common causes of treatment and outcome (confounders)',
        '2. Distinguish measured from unmeasured confounders',
        '3. Assess strength of confounding for each variable',
        '4. Identify mediators that should NOT be adjusted for',
        '5. Identify colliders that open backdoor paths if conditioned on',
        '6. Determine minimal sufficient adjustment set',
        '7. Assess potential for residual confounding',
        '8. Identify proxy variables for unmeasured confounders',
        '9. Evaluate M-bias and butterfly bias patterns',
        '10. Recommend adjustment strategy'
      ],
      outputFormat: 'JSON object with confounder analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedConfounders', 'adjustmentRecommendation'],
      properties: {
        identifiedConfounders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              measured: { type: 'boolean' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
              mechanism: { type: 'string' }
            }
          }
        },
        mediators: {
          type: 'array',
          items: { type: 'string' }
        },
        colliders: {
          type: 'array',
          items: { type: 'string' }
        },
        minimalAdjustmentSet: {
          type: 'array',
          items: { type: 'string' }
        },
        unmeasuredConfounding: {
          type: 'object',
          properties: {
            present: { type: 'boolean' },
            severity: { type: 'string', enum: ['high', 'medium', 'low', 'none'] },
            proxies: { type: 'array', items: { type: 'string' } }
          }
        },
        adjustmentRecommendation: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            variables: { type: 'array', items: { type: 'string' } },
            rationale: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['causal-inference', 'confounding', 'adjustment']
}));

export const estimationStrategyTask = defineTask('estimation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Causal Effect Estimation Strategy Selection',
  agent: {
    name: 'statistical-consultant',
    skills: ['statistical-test-selector', 'causal-inference-engine', 'regression-analyzer'],
    prompt: {
      role: 'Expert in causal effect estimation methods and econometrics',
      task: 'Select and specify the estimation strategy for causal effects',
      context: {
        identificationAnalysis: args.identificationAnalysis,
        confounderAnalysis: args.confounderAnalysis,
        framework: args.framework,
        observationalData: args.observationalData
      },
      instructions: [
        '1. Evaluate regression-based methods (OLS, logistic, etc.)',
        '2. Evaluate matching methods (propensity score, CEM, genetic matching)',
        '3. Evaluate weighting methods (IPW, AIPW, entropy balancing)',
        '4. Evaluate doubly robust estimators',
        '5. Consider instrumental variable estimators (2SLS, GMM)',
        '6. Consider machine learning methods (causal forests, TMLE, DML)',
        '7. Assess sample size requirements for each method',
        '8. Consider overlap/positivity assumption violations',
        '9. Recommend primary and sensitivity analysis methods',
        '10. Specify implementation details and software packages'
      ],
      outputFormat: 'JSON object with estimation strategy specification'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedMethod', 'implementation'],
      properties: {
        selectedMethod: {
          type: 'string',
          enum: ['regression-adjustment', 'propensity-score-matching', 'inverse-probability-weighting', 'doubly-robust', 'instrumental-variables', 'regression-discontinuity', 'difference-in-differences', 'causal-forest', 'targeted-learning']
        },
        alternativeMethods: {
          type: 'array',
          items: { type: 'string' }
        },
        justification: { type: 'string' },
        implementation: {
          type: 'object',
          properties: {
            algorithm: { type: 'string' },
            parameters: { type: 'object' },
            software: { type: 'string' },
            covariates: { type: 'array', items: { type: 'string' } }
          }
        },
        assumptions: {
          type: 'array',
          items: { type: 'string' }
        },
        limitations: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['causal-inference', 'estimation', 'methodology']
}));

export const causalEffectEstimationTask = defineTask('causal-effect-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Causal Effect Estimation',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'statistical-test-selector', 'regression-analyzer'],
    prompt: {
      role: 'Expert in causal effect estimation and statistical inference',
      task: 'Estimate the causal effect using the selected methodology',
      context: {
        causalGraph: args.causalGraph,
        estimationStrategy: args.estimationStrategy,
        confounderAnalysis: args.confounderAnalysis,
        observationalData: args.observationalData,
        treatment: args.treatment,
        outcome: args.outcome
      },
      instructions: [
        '1. Specify the causal estimand (ATE, ATT, ATU, CATE, LATE)',
        '2. Define the estimation procedure step by step',
        '3. Estimate the point estimate of the causal effect',
        '4. Calculate standard errors using appropriate method (bootstrap, sandwich, etc.)',
        '5. Construct confidence intervals',
        '6. Test statistical significance',
        '7. Estimate heterogeneous treatment effects if applicable',
        '8. Check covariate balance after adjustment',
        '9. Diagnose potential violations of assumptions',
        '10. Interpret effect size in substantive terms'
      ],
      outputFormat: 'JSON object with causal effect estimates'
    },
    outputSchema: {
      type: 'object',
      required: ['estimand', 'effects'],
      properties: {
        estimand: {
          type: 'string',
          enum: ['ATE', 'ATT', 'ATU', 'CATE', 'LATE', 'ITT']
        },
        effects: {
          type: 'object',
          properties: {
            pointEstimate: { type: 'number' },
            standardError: { type: 'number' },
            unit: { type: 'string' },
            interpretation: { type: 'string' }
          }
        },
        confidenceInterval: {
          type: 'object',
          properties: {
            lower: { type: 'number' },
            upper: { type: 'number' },
            level: { type: 'number' }
          }
        },
        hypothesisTest: {
          type: 'object',
          properties: {
            nullHypothesis: { type: 'string' },
            testStatistic: { type: 'number' },
            pValue: { type: 'number' },
            significant: { type: 'boolean' }
          }
        },
        heterogeneousEffects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subgroup: { type: 'string' },
              effect: { type: 'number' },
              confidenceInterval: { type: 'object' }
            }
          }
        },
        balanceDiagnostics: {
          type: 'object',
          properties: {
            balanced: { type: 'boolean' },
            diagnostics: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['causal-inference', 'estimation', 'treatment-effect']
}));

export const interventionPredictionTask = defineTask('intervention-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Intervention Effect Prediction',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'systems-dynamics-modeler'],
    prompt: {
      role: 'Expert in causal prediction and policy analysis',
      task: 'Predict effects of hypothetical interventions based on causal model',
      context: {
        causalEffectEstimation: args.causalEffectEstimation,
        causalGraph: args.causalGraph,
        researchQuestion: args.researchQuestion,
        domain: args.domain
      },
      instructions: [
        '1. Define specific intervention scenarios to evaluate',
        '2. Use do-calculus to compute intervention distributions',
        '3. Predict outcome under different treatment levels',
        '4. Calculate number needed to treat (NNT) if applicable',
        '5. Estimate population attributable fraction (PAF)',
        '6. Consider transportability to different populations',
        '7. Identify conditions under which intervention would be effective',
        '8. Assess feasibility and cost-effectiveness of interventions',
        '9. Predict unintended consequences through causal pathways',
        '10. Provide policy recommendations with uncertainty quantification'
      ],
      outputFormat: 'JSON object with intervention predictions'
    },
    outputSchema: {
      type: 'object',
      required: ['predictions', 'policyRecommendations'],
      properties: {
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              intervention: { type: 'string' },
              predictedEffect: { type: 'number' },
              uncertainty: { type: 'object' },
              assumptions: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        numberNeededToTreat: { type: 'number' },
        populationAttributableFraction: { type: 'number' },
        transportability: {
          type: 'object',
          properties: {
            canTransport: { type: 'boolean' },
            conditions: { type: 'array', items: { type: 'string' } }
          }
        },
        policyRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              expectedBenefit: { type: 'string' },
              feasibility: { type: 'string', enum: ['high', 'medium', 'low'] },
              evidence: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['causal-inference', 'intervention', 'prediction']
}));

export const sensitivityAnalysisTask = defineTask('sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Causal Sensitivity Analysis',
  agent: {
    name: 'statistical-consultant',
    skills: ['statistical-test-selector', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in sensitivity analysis for causal inference',
      task: 'Assess robustness of causal conclusions to assumption violations',
      context: {
        causalEffectEstimation: args.causalEffectEstimation,
        identificationAnalysis: args.identificationAnalysis,
        confounderAnalysis: args.confounderAnalysis,
        framework: args.framework
      },
      instructions: [
        '1. Conduct Rosenbaum bounds sensitivity analysis',
        '2. Perform E-value calculation for unmeasured confounding',
        '3. Apply Manski bounds for missing data/selection',
        '4. Conduct partial identification analysis',
        '5. Test sensitivity to model specification',
        '6. Assess impact of measurement error',
        '7. Evaluate sensitivity to positivity violations',
        '8. Perform multiple comparison corrections',
        '9. Report tipping point analysis',
        '10. Summarize robustness of conclusions'
      ],
      outputFormat: 'JSON object with sensitivity analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'overallRobustness'],
      properties: {
        results: {
          type: 'object',
          properties: {
            rosenbaumBounds: {
              type: 'object',
              properties: {
                gamma: { type: 'number' },
                interpretation: { type: 'string' }
              }
            },
            eValue: {
              type: 'object',
              properties: {
                pointEstimate: { type: 'number' },
                confidenceLimit: { type: 'number' },
                interpretation: { type: 'string' }
              }
            },
            manskiBounds: {
              type: 'object',
              properties: {
                lower: { type: 'number' },
                upper: { type: 'number' }
              }
            }
          }
        },
        specificationTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              specification: { type: 'string' },
              estimate: { type: 'number' },
              consistent: { type: 'boolean' }
            }
          }
        },
        tippingPoint: {
          type: 'object',
          properties: {
            unmeasuredConfounding: { type: 'string' },
            threshold: { type: 'number' }
          }
        },
        overallRobustness: {
          type: 'string',
          enum: ['robust', 'moderately-robust', 'sensitive', 'highly-sensitive']
        },
        caveats: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['causal-inference', 'sensitivity-analysis', 'robustness']
}));

export const causalValidationTask = defineTask('causal-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Causal Inference Validation',
  agent: {
    name: 'rigor-assessor',
    skills: ['checklist-validator', 'causal-inference-engine', 'peer-review-simulator'],
    prompt: {
      role: 'Expert in causal inference validation and scientific methodology',
      task: 'Validate causal conclusions and assess overall confidence',
      context: {
        causalEffectEstimation: args.causalEffectEstimation,
        sensitivityAnalysis: args.sensitivityAnalysis,
        causalGraph: args.causalGraph,
        domain: args.domain
      },
      instructions: [
        '1. Check consistency with established scientific knowledge',
        '2. Evaluate Bradford Hill criteria for causation',
        '3. Assess replicability across methods and specifications',
        '4. Validate against known negative controls',
        '5. Check for positive controls if available',
        '6. Evaluate coherence of effect size with mechanism',
        '7. Assess temporality and dose-response relationships',
        '8. Consider biological/physical plausibility',
        '9. Synthesize evidence quality assessment',
        '10. Provide overall confidence rating and recommendations'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['overallConfidence', 'recommendations'],
      properties: {
        bradfordHillCriteria: {
          type: 'object',
          properties: {
            strength: { type: 'boolean' },
            consistency: { type: 'boolean' },
            specificity: { type: 'boolean' },
            temporality: { type: 'boolean' },
            biologicalGradient: { type: 'boolean' },
            plausibility: { type: 'boolean' },
            coherence: { type: 'boolean' },
            experiment: { type: 'boolean' },
            analogy: { type: 'boolean' }
          }
        },
        methodologicalAssessment: {
          type: 'object',
          properties: {
            identificationStrength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
            estimationQuality: { type: 'string', enum: ['high', 'medium', 'low'] },
            dataQuality: { type: 'string', enum: ['high', 'medium', 'low'] }
          }
        },
        overallConfidence: {
          type: 'string',
          enum: ['high', 'moderate', 'low', 'very-low']
        },
        limitations: {
          type: 'array',
          items: { type: 'string' }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              rationale: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['causal-inference', 'validation', 'evidence-synthesis']
}));
