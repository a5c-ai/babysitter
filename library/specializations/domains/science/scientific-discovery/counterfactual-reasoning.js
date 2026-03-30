/**
 * @process specializations/domains/science/scientific-discovery/counterfactual-reasoning
 * @description Counterfactual Reasoning Process - Evaluate alternate histories given a causal model
 * to answer "what if" questions and assess individual-level causal effects using structural equations.
 * @inputs { domain: string, causalModel: object, factualObservation: object, counterfactualQuery: string, context?: object }
 * @outputs { success: boolean, counterfactualOutcome: object, explanation: string, robustness: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/counterfactual-reasoning', {
 *   domain: 'Medicine',
 *   causalModel: { variables: ['treatment', 'recovery'], edges: [...] },
 *   factualObservation: { treatment: 0, recovery: 0, age: 45 },
 *   counterfactualQuery: 'Would the patient have recovered if they had received the treatment?'
 * });
 *
 * @references
 * - Pearl (2009). Causality, Chapter 7: The Logic of Counterfactuals
 * - Lewis (1973). Counterfactuals
 * - Halpern & Pearl (2005). Causes and Explanations: A Structural-Model Approach
 * - Pearl (2019). The Seven Tools of Causal Inference
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domain,
    causalModel,
    factualObservation,
    counterfactualQuery,
    context = {}
  } = inputs;

  // Phase 1: Query Formalization
  const queryFormalization = await ctx.task(queryFormalizationTask, {
    counterfactualQuery,
    causalModel,
    factualObservation,
    domain
  });

  // Quality Gate: Query must be well-formed
  if (!queryFormalization.isWellFormed) {
    return {
      success: false,
      error: 'Counterfactual query cannot be formalized',
      issues: queryFormalization.issues,
      counterfactualOutcome: null
    };
  }

  // Phase 2: Structural Equation Model Setup
  const semSetup = await ctx.task(structuralEquationSetupTask, {
    causalModel,
    factualObservation,
    queryFormalization,
    domain
  });

  // Phase 3: Abduction - Infer Exogenous Variables
  const abductionResult = await ctx.task(abductionTask, {
    semSetup,
    factualObservation,
    causalModel
  });

  // Quality Gate: Exogenous variables must be identified
  if (!abductionResult.exogenousIdentified) {
    await ctx.breakpoint({
      question: `Cannot uniquely determine exogenous variables for counterfactual. Multiple solutions exist. Proceed with uncertainty analysis?`,
      title: 'Abduction Ambiguity',
      context: {
        runId: ctx.runId,
        possibleSolutions: abductionResult.possibleSolutions,
        recommendation: 'Consider bounds on counterfactual or sensitivity analysis'
      }
    });
  }

  // Phase 4: Action - Apply Intervention
  const interventionResult = await ctx.task(interventionApplicationTask, {
    semSetup,
    abductionResult,
    queryFormalization
  });

  // Phase 5: Prediction - Compute Counterfactual Outcome
  const counterfactualPrediction = await ctx.task(counterfactualPredictionTask, {
    interventionResult,
    semSetup,
    abductionResult
  });

  // Phase 6: Counterfactual Bounds Analysis
  const boundsAnalysis = await ctx.task(counterfactualBoundsTask, {
    counterfactualPrediction,
    semSetup,
    factualObservation,
    causalModel
  });

  // Phase 7: Explanation Generation
  const explanation = await ctx.task(counterfactualExplanationTask, {
    counterfactualPrediction,
    factualObservation,
    queryFormalization,
    causalModel,
    domain
  });

  // Phase 8: Necessity and Sufficiency Analysis
  const necessitySufficiency = await ctx.task(necessitySufficiencyTask, {
    counterfactualPrediction,
    factualObservation,
    causalModel,
    queryFormalization
  });

  // Phase 9: Robustness Assessment
  const robustnessAssessment = await ctx.task(robustnessAssessmentTask, {
    counterfactualPrediction,
    boundsAnalysis,
    semSetup,
    abductionResult
  });

  // Final Breakpoint: Review
  await ctx.breakpoint({
    question: `Counterfactual analysis complete: "${counterfactualQuery}". Result: ${counterfactualPrediction.outcome}. Review and validate?`,
    title: 'Counterfactual Analysis Review',
    context: {
      runId: ctx.runId,
      domain,
      query: counterfactualQuery,
      factual: factualObservation,
      counterfactual: counterfactualPrediction.outcome,
      files: [
        { path: 'artifacts/counterfactual-analysis.json', format: 'json', content: counterfactualPrediction }
      ]
    }
  });

  return {
    success: true,
    domain,
    query: counterfactualQuery,
    factualObservation,
    counterfactualOutcome: {
      prediction: counterfactualPrediction.outcome,
      probability: counterfactualPrediction.probability,
      bounds: boundsAnalysis.bounds,
      confidence: counterfactualPrediction.confidence
    },
    explanation: explanation.narrative,
    causalMechanism: explanation.mechanism,
    necessitySufficiency: {
      probabilityOfNecessity: necessitySufficiency.PN,
      probabilityOfSufficiency: necessitySufficiency.PS,
      probabilityOfNecessityAndSufficiency: necessitySufficiency.PNS
    },
    robustness: {
      sensitivity: robustnessAssessment.sensitivity,
      bounds: robustnessAssessment.bounds,
      confidence: robustnessAssessment.confidence
    },
    methodology: {
      abduction: abductionResult.method,
      intervention: interventionResult.method,
      prediction: counterfactualPrediction.method
    },
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/counterfactual-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const queryFormalizationTask = defineTask('query-formalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Counterfactual Query Formalization',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'formal-logic-reasoner', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in counterfactual logic and causal query languages',
      task: 'Formalize the natural language counterfactual query into structural form',
      context: {
        counterfactualQuery: args.counterfactualQuery,
        causalModel: args.causalModel,
        factualObservation: args.factualObservation,
        domain: args.domain
      },
      instructions: [
        '1. Parse the natural language query to identify intervention and outcome',
        '2. Identify the antecedent (hypothetical intervention)',
        '3. Identify the consequent (outcome of interest)',
        '4. Express query in do-notation: P(Y_x | observation)',
        '5. Identify variables that need counterfactual subscripts',
        '6. Check if query is well-defined given the causal model',
        '7. Identify type: ETT (effect of treatment on treated), etc.',
        '8. Check for logical consistency of the query',
        '9. Express in structural counterfactual notation',
        '10. Validate that all referenced variables exist in model'
      ],
      outputFormat: 'JSON object with formalized counterfactual query'
    },
    outputSchema: {
      type: 'object',
      required: ['isWellFormed', 'formalQuery'],
      properties: {
        isWellFormed: { type: 'boolean' },
        formalQuery: {
          type: 'object',
          properties: {
            intervention: {
              type: 'object',
              properties: {
                variable: { type: 'string' },
                value: { type: 'any' }
              }
            },
            outcome: {
              type: 'object',
              properties: {
                variable: { type: 'string' },
                condition: { type: 'string' }
              }
            },
            notation: { type: 'string' },
            queryType: { type: 'string', enum: ['ETT', 'ETU', 'ATE', 'individual', 'other'] }
          }
        },
        counterfactualVariables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              subscript: { type: 'string' }
            }
          }
        },
        issues: {
          type: 'array',
          items: { type: 'string' }
        },
        interpretation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['counterfactual', 'query-formalization', 'causal-reasoning']
}));

export const structuralEquationSetupTask = defineTask('structural-equation-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Structural Equation Model Setup',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'formal-logic-reasoner', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in structural causal models and structural equations',
      task: 'Set up the structural equation model for counterfactual computation',
      context: {
        causalModel: args.causalModel,
        factualObservation: args.factualObservation,
        queryFormalization: args.queryFormalization,
        domain: args.domain
      },
      instructions: [
        '1. Convert causal DAG to structural equation system',
        '2. Define functional form for each endogenous variable',
        '3. Identify exogenous variables (noise/error terms)',
        '4. Specify distributional assumptions for exogenous variables',
        '5. Establish modularity (each equation independent)',
        '6. Define domain and range for each variable',
        '7. Specify deterministic vs stochastic components',
        '8. Validate causal ordering consistency',
        '9. Document assumptions about functional forms',
        '10. Prepare equations for abduction step'
      ],
      outputFormat: 'JSON object with structural equation model specification'
    },
    outputSchema: {
      type: 'object',
      required: ['equations', 'exogenousVariables', 'endogenousVariables'],
      properties: {
        equations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              equation: { type: 'string' },
              parents: { type: 'array', items: { type: 'string' } },
              exogenous: { type: 'string' },
              functionalForm: { type: 'string' }
            }
          }
        },
        endogenousVariables: {
          type: 'array',
          items: { type: 'string' }
        },
        exogenousVariables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              distribution: { type: 'string' },
              parameters: { type: 'object' }
            }
          }
        },
        causalOrdering: {
          type: 'array',
          items: { type: 'string' }
        },
        assumptions: {
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
  labels: ['counterfactual', 'sem', 'structural-equations']
}));

export const abductionTask = defineTask('abduction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Abduction - Exogenous Variable Inference',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'formal-logic-reasoner', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in counterfactual reasoning and abductive inference',
      task: 'Infer values of exogenous variables from factual observation (abduction step)',
      context: {
        semSetup: args.semSetup,
        factualObservation: args.factualObservation,
        causalModel: args.causalModel
      },
      instructions: [
        '1. Use factual observations to solve for exogenous variables',
        '2. Apply inverse functions where possible',
        '3. Propagate known values through structural equations',
        '4. Check for unique vs multiple solutions',
        '5. Handle deterministic vs stochastic cases differently',
        '6. Compute posterior distribution over exogenous if uncertain',
        '7. Document any underdetermination',
        '8. Validate consistency with original model',
        '9. Handle missing values in observation',
        '10. Provide point estimates and uncertainty bounds'
      ],
      outputFormat: 'JSON object with inferred exogenous variables'
    },
    outputSchema: {
      type: 'object',
      required: ['exogenousIdentified', 'inferredValues'],
      properties: {
        exogenousIdentified: { type: 'boolean' },
        inferredValues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              value: { type: 'any' },
              method: { type: 'string' },
              confidence: { type: 'number' }
            }
          }
        },
        possibleSolutions: {
          type: 'array',
          items: { type: 'object' }
        },
        uniqueSolution: { type: 'boolean' },
        method: { type: 'string' },
        posteriorDistributions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              distribution: { type: 'string' },
              parameters: { type: 'object' }
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
  labels: ['counterfactual', 'abduction', 'inference']
}));

export const interventionApplicationTask = defineTask('intervention-application', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Action - Apply Counterfactual Intervention',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'formal-logic-reasoner', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in causal interventions and do-calculus',
      task: 'Apply the counterfactual intervention to the structural model (action step)',
      context: {
        semSetup: args.semSetup,
        abductionResult: args.abductionResult,
        queryFormalization: args.queryFormalization
      },
      instructions: [
        '1. Identify the intervention variable from the query',
        '2. Replace the structural equation for intervened variable with constant',
        '3. Preserve exogenous values from abduction step',
        '4. Create the mutilated/modified model',
        '5. Remove incoming edges to intervened variable',
        '6. Keep outgoing edges from intervened variable',
        '7. Verify intervention does not violate model constraints',
        '8. Document the modified structural equations',
        '9. Prepare modified model for prediction step',
        '10. Validate consistency of modified model'
      ],
      outputFormat: 'JSON object with modified model after intervention'
    },
    outputSchema: {
      type: 'object',
      required: ['modifiedEquations', 'intervention'],
      properties: {
        intervention: {
          type: 'object',
          properties: {
            variable: { type: 'string' },
            setValue: { type: 'any' },
            originalEquation: { type: 'string' }
          }
        },
        modifiedEquations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              equation: { type: 'string' },
              modified: { type: 'boolean' }
            }
          }
        },
        removedEdges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' }
            }
          }
        },
        method: { type: 'string' },
        validIntervention: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['counterfactual', 'intervention', 'do-calculus']
}));

export const counterfactualPredictionTask = defineTask('counterfactual-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prediction - Compute Counterfactual Outcome',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'formal-logic-reasoner', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in counterfactual prediction and causal reasoning',
      task: 'Compute the counterfactual outcome using modified model (prediction step)',
      context: {
        interventionResult: args.interventionResult,
        semSetup: args.semSetup,
        abductionResult: args.abductionResult
      },
      instructions: [
        '1. Use inferred exogenous values from abduction',
        '2. Apply modified structural equations from intervention',
        '3. Propagate values forward in causal order',
        '4. Compute value of outcome variable in counterfactual world',
        '5. Handle uncertainty by computing distributions if needed',
        '6. Compare counterfactual to factual outcome',
        '7. Compute individual-level causal effect',
        '8. Assess confidence in prediction',
        '9. Document computational steps',
        '10. Provide point estimate and credible interval'
      ],
      outputFormat: 'JSON object with counterfactual prediction'
    },
    outputSchema: {
      type: 'object',
      required: ['outcome', 'confidence'],
      properties: {
        outcome: {
          type: 'object',
          properties: {
            variable: { type: 'string' },
            counterfactualValue: { type: 'any' },
            factualValue: { type: 'any' },
            difference: { type: 'any' }
          }
        },
        probability: { type: 'number' },
        confidence: { type: 'number' },
        individualCausalEffect: {
          type: 'object',
          properties: {
            effect: { type: 'any' },
            type: { type: 'string' }
          }
        },
        allCounterfactualValues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              value: { type: 'any' }
            }
          }
        },
        computationSteps: {
          type: 'array',
          items: { type: 'string' }
        },
        method: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['counterfactual', 'prediction', 'outcome']
}));

export const counterfactualBoundsTask = defineTask('counterfactual-bounds', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Counterfactual Bounds Analysis',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'formal-logic-reasoner', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in partial identification and counterfactual bounds',
      task: 'Compute bounds on counterfactual quantities when point identification fails',
      context: {
        counterfactualPrediction: args.counterfactualPrediction,
        semSetup: args.semSetup,
        factualObservation: args.factualObservation,
        causalModel: args.causalModel
      },
      instructions: [
        '1. Apply Manski-style bounds for partial identification',
        '2. Use observational data constraints to tighten bounds',
        '3. Apply monotonicity assumptions if justified',
        '4. Compute natural bounds from variable domains',
        '5. Apply causal model constraints',
        '6. Use instrumental variable bounds if applicable',
        '7. Compute bounds under different assumptions',
        '8. Identify tightest achievable bounds',
        '9. Assess width of bounds (informativeness)',
        '10. Document assumptions for each bound'
      ],
      outputFormat: 'JSON object with counterfactual bounds'
    },
    outputSchema: {
      type: 'object',
      required: ['bounds'],
      properties: {
        bounds: {
          type: 'object',
          properties: {
            lower: { type: 'number' },
            upper: { type: 'number' },
            width: { type: 'number' },
            informative: { type: 'boolean' }
          }
        },
        boundsByAssumption: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              lower: { type: 'number' },
              upper: { type: 'number' }
            }
          }
        },
        naturalBounds: {
          type: 'object',
          properties: {
            lower: { type: 'number' },
            upper: { type: 'number' }
          }
        },
        tighteningMethods: {
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
  labels: ['counterfactual', 'bounds', 'partial-identification']
}));

export const counterfactualExplanationTask = defineTask('counterfactual-explanation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Counterfactual Explanation Generation',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'formal-logic-reasoner', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in causal explanation and scientific communication',
      task: 'Generate human-understandable explanation of counterfactual result',
      context: {
        counterfactualPrediction: args.counterfactualPrediction,
        factualObservation: args.factualObservation,
        queryFormalization: args.queryFormalization,
        causalModel: args.causalModel,
        domain: args.domain
      },
      instructions: [
        '1. Explain what the counterfactual query asks',
        '2. Describe the factual situation clearly',
        '3. Explain the hypothetical intervention',
        '4. Describe the counterfactual outcome',
        '5. Explain the causal mechanism involved',
        '6. Highlight key variables that changed/stayed same',
        '7. Explain the difference between factual and counterfactual',
        '8. Discuss confidence and limitations',
        '9. Use domain-appropriate language',
        '10. Provide actionable insights if applicable'
      ],
      outputFormat: 'JSON object with explanation'
    },
    outputSchema: {
      type: 'object',
      required: ['narrative', 'mechanism'],
      properties: {
        narrative: { type: 'string' },
        mechanism: {
          type: 'object',
          properties: {
            causalPath: { type: 'array', items: { type: 'string' } },
            keyVariables: { type: 'array', items: { type: 'string' } },
            explanation: { type: 'string' }
          }
        },
        factualSummary: { type: 'string' },
        counterfactualSummary: { type: 'string' },
        keyDifferences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              factual: { type: 'any' },
              counterfactual: { type: 'any' }
            }
          }
        },
        caveats: {
          type: 'array',
          items: { type: 'string' }
        },
        implications: {
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
  labels: ['counterfactual', 'explanation', 'interpretation']
}));

export const necessitySufficiencyTask = defineTask('necessity-sufficiency', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Probability of Necessity and Sufficiency Analysis',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'formal-logic-reasoner', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in causal necessity, sufficiency, and attribution',
      task: 'Compute probability of necessity (PN), sufficiency (PS), and both (PNS)',
      context: {
        counterfactualPrediction: args.counterfactualPrediction,
        factualObservation: args.factualObservation,
        causalModel: args.causalModel,
        queryFormalization: args.queryFormalization
      },
      instructions: [
        '1. Define necessity: Would outcome not have occurred without the cause?',
        '2. Define sufficiency: Would cause have produced outcome if absent?',
        '3. Compute PN = P(Y_x=0 = 0 | X=1, Y=1)',
        '4. Compute PS = P(Y_x=1 = 1 | X=0, Y=0)',
        '5. Compute PNS = P(Y_x=1=1, Y_x=0=0)',
        '6. Apply bounds if point identification not possible',
        '7. Interpret in terms of causal attribution',
        '8. Relate to but-for causation in law/science',
        '9. Assess evidential support for causation claim',
        '10. Provide practical interpretation'
      ],
      outputFormat: 'JSON object with necessity/sufficiency analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['PN', 'PS', 'PNS'],
      properties: {
        PN: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            bounds: { type: 'object' },
            interpretation: { type: 'string' }
          }
        },
        PS: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            bounds: { type: 'object' },
            interpretation: { type: 'string' }
          }
        },
        PNS: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            bounds: { type: 'object' },
            interpretation: { type: 'string' }
          }
        },
        causalAttribution: {
          type: 'object',
          properties: {
            strength: { type: 'string', enum: ['strong', 'moderate', 'weak', 'none'] },
            evidence: { type: 'string' }
          }
        },
        butForCausation: { type: 'boolean' },
        practicalImplications: {
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
  labels: ['counterfactual', 'necessity', 'sufficiency', 'attribution']
}));

export const robustnessAssessmentTask = defineTask('robustness-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Counterfactual Robustness Assessment',
  agent: {
    name: 'causal-reasoning-analyst',
    skills: ['causal-inference-engine', 'formal-logic-reasoner', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in sensitivity analysis and robustness assessment',
      task: 'Assess robustness of counterfactual conclusions',
      context: {
        counterfactualPrediction: args.counterfactualPrediction,
        boundsAnalysis: args.boundsAnalysis,
        semSetup: args.semSetup,
        abductionResult: args.abductionResult
      },
      instructions: [
        '1. Assess sensitivity to functional form assumptions',
        '2. Evaluate sensitivity to exogenous distribution assumptions',
        '3. Test robustness to small changes in factual observation',
        '4. Assess impact of model misspecification',
        '5. Evaluate sensitivity to unmeasured confounders',
        '6. Test stability across plausible model variations',
        '7. Compute influence of individual variables',
        '8. Assess qualitative vs quantitative robustness',
        '9. Identify which assumptions are most critical',
        '10. Provide overall confidence assessment'
      ],
      outputFormat: 'JSON object with robustness assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['sensitivity', 'confidence'],
      properties: {
        sensitivity: {
          type: 'object',
          properties: {
            toFunctionalForm: { type: 'string', enum: ['high', 'medium', 'low'] },
            toDistributions: { type: 'string', enum: ['high', 'medium', 'low'] },
            toObservation: { type: 'string', enum: ['high', 'medium', 'low'] },
            toUnmeasuredConfounding: { type: 'string', enum: ['high', 'medium', 'low'] }
          }
        },
        criticalAssumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              sensitivity: { type: 'number' },
              recommendation: { type: 'string' }
            }
          }
        },
        bounds: {
          type: 'object',
          properties: {
            robustLower: { type: 'number' },
            robustUpper: { type: 'number' }
          }
        },
        confidence: {
          type: 'string',
          enum: ['high', 'moderate', 'low', 'very-low']
        },
        recommendations: {
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
  labels: ['counterfactual', 'robustness', 'sensitivity-analysis']
}));
