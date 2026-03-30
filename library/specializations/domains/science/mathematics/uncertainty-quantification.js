/**
 * @process specializations/domains/science/mathematics/uncertainty-quantification
 * @description Quantify uncertainty in mathematical models through sensitivity analysis,
 * parameter uncertainty propagation, and Monte Carlo methods.
 * @inputs { model: object, uncertainParameters: array, outputsOfInterest?: array, method?: string }
 * @outputs { success: boolean, uncertaintySources: object, propagatedUncertainty: object, sensitivityAnalysis: object, confidenceBounds: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/uncertainty-quantification', {
 *   model: { type: 'ODE', equations: ['dx/dt = r*x*(1-x/K)'] },
 *   uncertainParameters: [{ name: 'r', distribution: 'normal', mean: 0.5, std: 0.1 }, { name: 'K', distribution: 'uniform', min: 90, max: 110 }],
 *   outputsOfInterest: ['x_steady_state', 'time_to_half_capacity'],
 *   method: 'monte-carlo'
 * });
 *
 * @references
 * - Smith, Uncertainty Quantification: Theory, Implementation, and Applications
 * - Saltelli et al., Global Sensitivity Analysis
 * - Sullivan, Introduction to Uncertainty Quantification
 * - Xiu, Numerical Methods for Stochastic Computations
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    model,
    uncertainParameters,
    outputsOfInterest = [],
    method = 'monte-carlo'
  } = inputs;

  // Phase 1: Identify Uncertain Parameters
  const uncertaintyIdentification = await ctx.task(uncertaintyIdentificationTask, {
    model,
    uncertainParameters
  });

  // Quality Gate: Uncertainties must be identifiable
  if (!uncertaintyIdentification.parameters || uncertaintyIdentification.parameters.length === 0) {
    return {
      success: false,
      error: 'Unable to identify uncertain parameters',
      phase: 'uncertainty-identification',
      propagatedUncertainty: null
    };
  }

  // Breakpoint: Review uncertainty identification
  await ctx.breakpoint({
    question: `Identified ${uncertaintyIdentification.parameters.length} uncertain parameters. Review distributions?`,
    title: 'Uncertainty Identification Review',
    context: {
      runId: ctx.runId,
      model: model.type,
      parameters: uncertaintyIdentification.parameters,
      files: [{
        path: `artifacts/phase1-uncertainty-identification.json`,
        format: 'json',
        content: uncertaintyIdentification
      }]
    }
  });

  // Phase 2: Propagate Uncertainty Through Model
  const uncertaintyPropagation = await ctx.task(uncertaintyPropagationTask, {
    model,
    uncertaintyIdentification,
    outputsOfInterest,
    method
  });

  // Phase 3: Perform Sensitivity Analysis
  const sensitivityAnalysis = await ctx.task(sensitivityAnalysisTask, {
    model,
    uncertaintyIdentification,
    uncertaintyPropagation,
    outputsOfInterest
  });

  // Phase 4: Generate Confidence Bounds
  const confidenceBoundsGeneration = await ctx.task(confidenceBoundsGenerationTask, {
    uncertaintyPropagation,
    sensitivityAnalysis,
    outputsOfInterest
  });

  // Phase 5: Document Uncertainty Sources
  const uncertaintyDocumentation = await ctx.task(uncertaintyDocumentationTask, {
    uncertaintyIdentification,
    uncertaintyPropagation,
    sensitivityAnalysis,
    confidenceBoundsGeneration,
    model
  });

  // Final Breakpoint: UQ Complete
  await ctx.breakpoint({
    question: `Uncertainty quantification complete. Total output uncertainty: ${confidenceBoundsGeneration.totalUncertainty}. Review results?`,
    title: 'Uncertainty Quantification Complete',
    context: {
      runId: ctx.runId,
      totalUncertainty: confidenceBoundsGeneration.totalUncertainty,
      dominantSources: sensitivityAnalysis.dominantSources,
      files: [
        { path: `artifacts/uq-results.json`, format: 'json', content: { uncertaintyPropagation, sensitivityAnalysis } }
      ]
    }
  });

  return {
    success: true,
    model: model.type,
    uncertaintySources: {
      parameters: uncertaintyIdentification.parameters,
      modelUncertainty: uncertaintyIdentification.modelUncertainty,
      numericalUncertainty: uncertaintyIdentification.numericalUncertainty
    },
    propagatedUncertainty: {
      method,
      outputStatistics: uncertaintyPropagation.outputStatistics,
      distributions: uncertaintyPropagation.outputDistributions
    },
    sensitivityAnalysis: {
      sobolIndices: sensitivityAnalysis.sobolIndices,
      localSensitivity: sensitivityAnalysis.localSensitivity,
      dominantSources: sensitivityAnalysis.dominantSources
    },
    confidenceBounds: {
      intervals: confidenceBoundsGeneration.confidenceIntervals,
      predictionBands: confidenceBoundsGeneration.predictionBands,
      totalUncertainty: confidenceBoundsGeneration.totalUncertainty
    },
    documentation: uncertaintyDocumentation.report,
    metadata: {
      processId: 'specializations/domains/science/mathematics/uncertainty-quantification',
      method,
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const uncertaintyIdentificationTask = defineTask('uncertainty-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Identify Uncertain Parameters`,
  agent: {
    name: 'uq-specialist',
    skills: ['monte-carlo-simulation', 'r-statistical-computing', 'sympy-computer-algebra'],
    prompt: {
      role: 'Uncertainty Quantification Expert',
      task: 'Identify and characterize all sources of uncertainty',
      context: {
        model: args.model,
        uncertainParameters: args.uncertainParameters
      },
      instructions: [
        '1. Catalog all uncertain parameters',
        '2. Assign probability distributions to each parameter',
        '3. Identify epistemic vs aleatory uncertainty',
        '4. Document sources of parameter uncertainty',
        '5. Identify model structural uncertainty',
        '6. Identify numerical/discretization uncertainty',
        '7. Assess parameter correlations',
        '8. Validate distribution choices',
        '9. Document prior information used',
        '10. Assess completeness of uncertainty specification'
      ],
      outputFormat: 'JSON object with uncertainty identification'
    },
    outputSchema: {
      type: 'object',
      required: ['parameters', 'uncertaintyTypes'],
      properties: {
        parameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              distribution: { type: 'string' },
              parameters: { type: 'object' },
              uncertaintyType: { type: 'string', enum: ['epistemic', 'aleatory', 'mixed'] },
              source: { type: 'string' },
              bounds: { type: 'object' }
            }
          }
        },
        uncertaintyTypes: {
          type: 'object',
          properties: {
            parametric: { type: 'boolean' },
            structural: { type: 'boolean' },
            numerical: { type: 'boolean' }
          }
        },
        correlations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameters: { type: 'array', items: { type: 'string' } },
              correlation: { type: 'number' }
            }
          }
        },
        modelUncertainty: {
          type: 'object',
          properties: {
            sources: { type: 'array', items: { type: 'string' } },
              magnitude: { type: 'string' }
          }
        },
        numericalUncertainty: {
          type: 'object',
          properties: {
            discretization: { type: 'string' },
            convergence: { type: 'string' }
          }
        },
        priorInformation: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'uncertainty-quantification', 'identification']
}));

export const uncertaintyPropagationTask = defineTask('uncertainty-propagation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Propagate Uncertainty Through Model`,
  agent: {
    name: 'uq-specialist',
    skills: ['monte-carlo-simulation', 'r-statistical-computing', 'stan-bayesian-modeling'],
    prompt: {
      role: 'Computational Uncertainty Propagation Expert',
      task: 'Propagate input uncertainties through the model to outputs',
      context: {
        model: args.model,
        uncertaintyIdentification: args.uncertaintyIdentification,
        outputsOfInterest: args.outputsOfInterest,
        method: args.method
      },
      instructions: [
        '1. Select appropriate propagation method (MC, PCE, etc.)',
        '2. Design sampling strategy',
        '3. Generate parameter samples',
        '4. Propagate samples through model',
        '5. Compute output statistics (mean, variance)',
        '6. Estimate output distributions',
        '7. Assess convergence of estimates',
        '8. Compute percentiles and quantiles',
        '9. Handle correlations in sampling',
        '10. Document propagation methodology'
      ],
      outputFormat: 'JSON object with propagation results'
    },
    outputSchema: {
      type: 'object',
      required: ['outputStatistics', 'outputDistributions'],
      properties: {
        method: { type: 'string' },
        samplingStrategy: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            samples: { type: 'number' },
            convergence: { type: 'string' }
          }
        },
        outputStatistics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              output: { type: 'string' },
              mean: { type: 'number' },
              variance: { type: 'number' },
              std: { type: 'number' },
              cv: { type: 'number' }
            }
          }
        },
        outputDistributions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              output: { type: 'string' },
              distribution: { type: 'string' },
              percentiles: { type: 'object' }
            }
          }
        },
        convergenceMetrics: {
          type: 'object',
          properties: {
            meanConverged: { type: 'boolean' },
            varianceConverged: { type: 'boolean' },
            convergenceRate: { type: 'string' }
          }
        },
        computationalCost: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'uncertainty-quantification', 'propagation']
}));

export const sensitivityAnalysisTask = defineTask('sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Perform Sensitivity Analysis`,
  agent: {
    name: 'uq-specialist',
    skills: ['monte-carlo-simulation', 'r-statistical-computing', 'sympy-computer-algebra'],
    prompt: {
      role: 'Global Sensitivity Analysis Expert',
      task: 'Perform sensitivity analysis to identify dominant uncertainty sources',
      context: {
        model: args.model,
        uncertaintyIdentification: args.uncertaintyIdentification,
        uncertaintyPropagation: args.uncertaintyPropagation,
        outputsOfInterest: args.outputsOfInterest
      },
      instructions: [
        '1. Compute local sensitivity indices (derivatives)',
        '2. Compute Sobol first-order indices',
        '3. Compute Sobol total-effect indices',
        '4. Identify parameter interactions',
        '5. Rank parameters by importance',
        '6. Identify dominant uncertainty sources',
        '7. Compute Morris elementary effects if applicable',
        '8. Assess linearity/nonlinearity of model',
        '9. Identify parameters for model reduction',
        '10. Document sensitivity analysis methodology'
      ],
      outputFormat: 'JSON object with sensitivity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['sobolIndices', 'dominantSources'],
      properties: {
        localSensitivity: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              output: { type: 'string' },
              derivative: { type: 'number' },
              normalizedSensitivity: { type: 'number' }
            }
          }
        },
        sobolIndices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              output: { type: 'string' },
              firstOrder: { type: 'number' },
              totalEffect: { type: 'number' }
            }
          }
        },
        interactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameters: { type: 'array', items: { type: 'string' } },
              interactionIndex: { type: 'number' }
            }
          }
        },
        parameterRanking: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              rank: { type: 'number' },
              contribution: { type: 'number' }
            }
          }
        },
        dominantSources: { type: 'array', items: { type: 'string' } },
        modelNonlinearity: { type: 'string' },
        reducibleParameters: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'uncertainty-quantification', 'sensitivity']
}));

export const confidenceBoundsGenerationTask = defineTask('confidence-bounds', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Generate Confidence Bounds`,
  agent: {
    name: 'uq-specialist',
    skills: ['r-statistical-computing', 'monte-carlo-simulation', 'stan-bayesian-modeling'],
    prompt: {
      role: 'Statistical Confidence Interval Expert',
      task: 'Generate confidence bounds for model outputs',
      context: {
        uncertaintyPropagation: args.uncertaintyPropagation,
        sensitivityAnalysis: args.sensitivityAnalysis,
        outputsOfInterest: args.outputsOfInterest
      },
      instructions: [
        '1. Compute confidence intervals for output means',
        '2. Compute prediction intervals for individual predictions',
        '3. Generate credible intervals for Bayesian analysis',
        '4. Compute tolerance intervals if appropriate',
        '5. Generate prediction bands for functions',
        '6. Quantify total uncertainty',
        '7. Decompose uncertainty into sources',
        '8. Provide intervals at multiple confidence levels',
        '9. Assess interval robustness',
        '10. Document bound computation methodology'
      ],
      outputFormat: 'JSON object with confidence bounds'
    },
    outputSchema: {
      type: 'object',
      required: ['confidenceIntervals', 'totalUncertainty'],
      properties: {
        confidenceIntervals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              output: { type: 'string' },
              level: { type: 'number' },
              lower: { type: 'number' },
              upper: { type: 'number' },
              type: { type: 'string' }
            }
          }
        },
        predictionBands: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              output: { type: 'string' },
              bands: { type: 'object' }
            }
          }
        },
        uncertaintyDecomposition: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              contribution: { type: 'number' },
              percentage: { type: 'number' }
            }
          }
        },
        totalUncertainty: { type: 'string' },
        intervalRobustness: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'uncertainty-quantification', 'confidence']
}));

export const uncertaintyDocumentationTask = defineTask('uncertainty-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Document Uncertainty Sources`,
  agent: {
    name: 'uq-specialist',
    skills: ['latex-math-formatter', 'r-statistical-computing', 'monte-carlo-simulation'],
    prompt: {
      role: 'UQ Documentation Specialist',
      task: 'Create comprehensive documentation of uncertainty analysis',
      context: {
        uncertaintyIdentification: args.uncertaintyIdentification,
        uncertaintyPropagation: args.uncertaintyPropagation,
        sensitivityAnalysis: args.sensitivityAnalysis,
        confidenceBoundsGeneration: args.confidenceBoundsGeneration,
        model: args.model
      },
      instructions: [
        '1. Summarize all uncertainty sources',
        '2. Document methodology used',
        '3. Present key findings',
        '4. Interpret sensitivity results',
        '5. Explain confidence bounds',
        '6. Discuss limitations',
        '7. Provide recommendations for uncertainty reduction',
        '8. Create visualization descriptions',
        '9. Document assumptions',
        '10. Generate comprehensive report'
      ],
      outputFormat: 'JSON object with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'keyFindings', 'recommendations'],
      properties: {
        report: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            methodology: { type: 'string' },
            results: { type: 'string' },
            conclusions: { type: 'string' }
          }
        },
        keyFindings: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              expectedImpact: { type: 'string' }
            }
          }
        },
        visualizations: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        futureWork: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'uncertainty-quantification', 'documentation']
}));
