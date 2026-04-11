/**
 * @process specializations/domains/science/mathematics/bayesian-inference-workflow
 * @description Implement Bayesian inference workflows including prior elicitation, posterior computation
 * via MCMC/variational methods, and convergence diagnostics.
 * @inputs { modelDescription: string, dataDescription?: string, priorKnowledge?: object, inferenceMethod?: string }
 * @outputs { success: boolean, priorSpecification: object, posteriorSummary: object, convergenceDiagnostics: object, modelChecks: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/bayesian-inference-workflow', {
 *   modelDescription: 'Hierarchical regression model for student test scores nested within schools',
 *   dataDescription: '1000 students across 50 schools, predicting scores from SES and school resources',
 *   priorKnowledge: { expectedEffect: 'small to moderate positive', variance: 'uncertain' },
 *   inferenceMethod: 'MCMC'
 * });
 *
 * @references
 * - Gelman et al., Bayesian Data Analysis
 * - McElreath, Statistical Rethinking
 * - Stan User Guide: https://mc-stan.org/users/documentation/
 * - PyMC Documentation: https://www.pymc.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    modelDescription,
    dataDescription = '',
    priorKnowledge = {},
    inferenceMethod = 'MCMC'
  } = inputs;

  // Phase 1: Specify Prior Distributions
  const priorSpecification = await ctx.task(priorSpecificationTask, {
    modelDescription,
    priorKnowledge,
    dataDescription
  });

  // Quality Gate: Priors must be specified
  if (!priorSpecification.priors || priorSpecification.priors.length === 0) {
    return {
      success: false,
      error: 'Unable to specify prior distributions',
      phase: 'prior-specification',
      posteriorSummary: null
    };
  }

  // Breakpoint: Review prior specification
  await ctx.breakpoint({
    question: `Review prior specifications. ${priorSpecification.priors.length} parameters specified. Appropriate for the model?`,
    title: 'Prior Specification Review',
    context: {
      runId: ctx.runId,
      modelDescription,
      priors: priorSpecification.priors,
      files: [{
        path: `artifacts/phase1-priors.json`,
        format: 'json',
        content: priorSpecification
      }]
    }
  });

  // Phase 2: Implement Likelihood Function
  const likelihoodImplementation = await ctx.task(likelihoodImplementationTask, {
    modelDescription,
    dataDescription,
    priorSpecification
  });

  // Phase 3: Run MCMC Sampling
  const mcmcSampling = await ctx.task(mcmcSamplingTask, {
    modelDescription,
    priorSpecification,
    likelihoodImplementation,
    inferenceMethod
  });

  // Phase 4: Check Convergence Diagnostics
  const convergenceDiagnostics = await ctx.task(convergenceDiagnosticsTask, {
    mcmcSampling,
    modelDescription
  });

  // Quality Gate: Check for convergence issues
  if (!convergenceDiagnostics.converged) {
    await ctx.breakpoint({
      question: `MCMC convergence issues detected. Rhat > 1.01 for ${convergenceDiagnostics.problematicParameters.length} parameters. Investigate or continue?`,
      title: 'Convergence Warning',
      context: {
        runId: ctx.runId,
        diagnostics: convergenceDiagnostics,
        recommendation: 'Consider longer chains, different parameterization, or informative priors'
      }
    });
  }

  // Phase 5: Generate Posterior Summaries
  const posteriorSummaries = await ctx.task(posteriorSummariesTask, {
    mcmcSampling,
    convergenceDiagnostics,
    priorSpecification,
    modelDescription
  });

  // Final Breakpoint: Inference Complete
  await ctx.breakpoint({
    question: `Bayesian inference complete. Posterior summaries generated for ${posteriorSummaries.parameters.length} parameters. Review results?`,
    title: 'Bayesian Inference Complete',
    context: {
      runId: ctx.runId,
      modelDescription,
      convergence: convergenceDiagnostics.converged,
      posteriorSummary: posteriorSummaries.summary,
      files: [
        { path: `artifacts/posterior-summary.json`, format: 'json', content: posteriorSummaries },
        { path: `artifacts/convergence-diagnostics.json`, format: 'json', content: convergenceDiagnostics }
      ]
    }
  });

  return {
    success: true,
    modelDescription,
    priorSpecification: {
      priors: priorSpecification.priors,
      priorPredictiveChecks: priorSpecification.priorPredictiveChecks,
      sensitivityNotes: priorSpecification.sensitivityNotes
    },
    posteriorSummary: {
      parameters: posteriorSummaries.parameters,
      summary: posteriorSummaries.summary,
      credibleIntervals: posteriorSummaries.credibleIntervals,
      posteriorPredictive: posteriorSummaries.posteriorPredictive
    },
    convergenceDiagnostics: {
      converged: convergenceDiagnostics.converged,
      rhat: convergenceDiagnostics.rhat,
      effectiveSampleSize: convergenceDiagnostics.ess,
      diagnosticPlots: convergenceDiagnostics.plotDescriptions
    },
    modelChecks: {
      posteriorPredictiveChecks: posteriorSummaries.posteriorPredictiveChecks,
      loo: posteriorSummaries.loo,
      waic: posteriorSummaries.waic
    },
    stanCode: likelihoodImplementation.stanCode,
    metadata: {
      processId: 'specializations/domains/science/mathematics/bayesian-inference-workflow',
      inferenceMethod,
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const priorSpecificationTask = defineTask('prior-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Specify Prior Distributions`,
  agent: {
    name: 'bayesian-statistician',
    skills: ['stan-bayesian-modeling', 'pymc-probabilistic-programming', 'mcmc-diagnostics'],
    prompt: {
      role: 'Bayesian Statistician specializing in prior elicitation',
      task: 'Specify appropriate prior distributions for model parameters',
      context: {
        modelDescription: args.modelDescription,
        priorKnowledge: args.priorKnowledge,
        dataDescription: args.dataDescription
      },
      instructions: [
        '1. Identify all parameters requiring prior distributions',
        '2. Elicit prior information from domain knowledge',
        '3. Choose appropriate prior families (normal, cauchy, half-normal, etc.)',
        '4. Set hyperparameters based on prior knowledge',
        '5. Consider weakly informative vs informative priors',
        '6. Specify hierarchical priors if applicable',
        '7. Document prior justifications',
        '8. Check prior predictive distributions',
        '9. Assess prior sensitivity',
        '10. Recommend prior sensitivity analyses'
      ],
      outputFormat: 'JSON object with prior specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['priors', 'priorPredictiveChecks'],
      properties: {
        priors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              distribution: { type: 'string' },
              hyperparameters: { type: 'object' },
              justification: { type: 'string' },
              informative: { type: 'boolean' }
            }
          }
        },
        hierarchicalPriors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              parameters: { type: 'array', items: { type: 'string' } },
              hyperprior: { type: 'string' }
            }
          }
        },
        priorPredictiveChecks: {
          type: 'object',
          properties: {
            expectedRange: { type: 'string' },
            plausibility: { type: 'string' },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        },
        sensitivityNotes: { type: 'array', items: { type: 'string' } },
        alternativePriors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              alternative: { type: 'string' },
              reason: { type: 'string' }
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
  labels: ['mathematics', 'bayesian-inference', 'prior-elicitation']
}));

export const likelihoodImplementationTask = defineTask('likelihood-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Implement Likelihood Function`,
  agent: {
    name: 'bayesian-statistician',
    skills: ['pymc-probabilistic-programming', 'stan-bayesian-modeling', 'r-statistical-computing'],
    prompt: {
      role: 'Probabilistic Programming Expert',
      task: 'Implement the likelihood function for the Bayesian model',
      context: {
        modelDescription: args.modelDescription,
        dataDescription: args.dataDescription,
        priorSpecification: args.priorSpecification
      },
      instructions: [
        '1. Define the likelihood function for the data',
        '2. Choose appropriate likelihood family (normal, binomial, poisson, etc.)',
        '3. Parameterize the model correctly',
        '4. Handle hierarchical structure if present',
        '5. Implement in Stan or PyMC syntax',
        '6. Add generated quantities for predictions',
        '7. Implement log_lik for model comparison',
        '8. Add prior predictive and posterior predictive blocks',
        '9. Ensure numerical stability',
        '10. Document model code'
      ],
      outputFormat: 'JSON object with likelihood implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['likelihoodFamily', 'modelSpecification', 'stanCode'],
      properties: {
        likelihoodFamily: { type: 'string' },
        linkFunction: { type: 'string' },
        modelSpecification: {
          type: 'object',
          properties: {
            responseVariable: { type: 'string' },
            predictors: { type: 'array', items: { type: 'string' } },
            randomEffects: { type: 'array', items: { type: 'string' } }
          }
        },
        stanCode: { type: 'string' },
        pymcCode: { type: 'string' },
        dataBlock: { type: 'string' },
        parametersBlock: { type: 'string' },
        modelBlock: { type: 'string' },
        generatedQuantities: { type: 'string' },
        numericalConsiderations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'bayesian-inference', 'likelihood']
}));

export const mcmcSamplingTask = defineTask('mcmc-sampling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Run MCMC Sampling`,
  agent: {
    name: 'bayesian-statistician',
    skills: ['stan-bayesian-modeling', 'mcmc-diagnostics', 'pymc-probabilistic-programming'],
    prompt: {
      role: 'MCMC Computation Specialist',
      task: 'Configure and describe MCMC sampling for posterior inference',
      context: {
        modelDescription: args.modelDescription,
        priorSpecification: args.priorSpecification,
        likelihoodImplementation: args.likelihoodImplementation,
        inferenceMethod: args.inferenceMethod
      },
      instructions: [
        '1. Select MCMC algorithm (HMC, NUTS, Gibbs, etc.)',
        '2. Configure sampler parameters (warmup, iterations, chains)',
        '3. Set adaptation parameters',
        '4. Configure thinning if needed',
        '5. Set initial values strategy',
        '6. Plan parallel chains',
        '7. Configure divergence handling',
        '8. Set max_treedepth for NUTS',
        '9. Plan for large datasets (subsampling, variational)',
        '10. Document sampling configuration'
      ],
      outputFormat: 'JSON object with MCMC sampling configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithm', 'configuration', 'samplingPlan'],
      properties: {
        algorithm: { type: 'string', enum: ['NUTS', 'HMC', 'Gibbs', 'Metropolis', 'variational'] },
        configuration: {
          type: 'object',
          properties: {
            chains: { type: 'number' },
            warmup: { type: 'number' },
            iterations: { type: 'number' },
            thinning: { type: 'number' },
            adaptDelta: { type: 'number' },
            maxTreedepth: { type: 'number' }
          }
        },
        samplingPlan: {
          type: 'object',
          properties: {
            totalSamples: { type: 'number' },
            effectiveSamplesTarget: { type: 'number' },
            estimatedTime: { type: 'string' }
          }
        },
        initialValues: { type: 'string' },
        parallelization: {
          type: 'object',
          properties: {
            parallel: { type: 'boolean' },
            cores: { type: 'number' }
          }
        },
        diagnosticsToMonitor: { type: 'array', items: { type: 'string' } },
        potentialIssues: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'bayesian-inference', 'mcmc']
}));

export const convergenceDiagnosticsTask = defineTask('convergence-diagnostics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Check Convergence Diagnostics`,
  agent: {
    name: 'bayesian-statistician',
    skills: ['mcmc-diagnostics', 'stan-bayesian-modeling', 'r-statistical-computing'],
    prompt: {
      role: 'MCMC Diagnostics Expert',
      task: 'Assess convergence of MCMC chains',
      context: {
        mcmcSampling: args.mcmcSampling,
        modelDescription: args.modelDescription
      },
      instructions: [
        '1. Calculate Rhat (potential scale reduction factor) for all parameters',
        '2. Calculate effective sample size (ESS) for all parameters',
        '3. Check for divergent transitions',
        '4. Assess energy diagnostics (E-BFMI)',
        '5. Examine trace plots visually',
        '6. Check autocorrelation',
        '7. Assess chain mixing',
        '8. Identify problematic parameters',
        '9. Recommend remediation if needed',
        '10. Provide overall convergence assessment'
      ],
      outputFormat: 'JSON object with convergence diagnostics'
    },
    outputSchema: {
      type: 'object',
      required: ['converged', 'rhat', 'ess'],
      properties: {
        converged: { type: 'boolean' },
        rhat: {
          type: 'object',
          properties: {
            allBelow101: { type: 'boolean' },
            maxRhat: { type: 'number' },
            byParameter: { type: 'object' }
          }
        },
        ess: {
          type: 'object',
          properties: {
            bulk: { type: 'object' },
            tail: { type: 'object' },
            minimumESS: { type: 'number' }
          }
        },
        divergences: {
          type: 'object',
          properties: {
            count: { type: 'number' },
            percentage: { type: 'number' },
            problematic: { type: 'boolean' }
          }
        },
        energyDiagnostics: {
          type: 'object',
          properties: {
            ebfmi: { type: 'number' },
            adequate: { type: 'boolean' }
          }
        },
        problematicParameters: { type: 'array', items: { type: 'string' } },
        plotDescriptions: {
          type: 'object',
          properties: {
            tracePlots: { type: 'string' },
            autocorrelation: { type: 'string' },
            pairsPlot: { type: 'string' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'bayesian-inference', 'convergence']
}));

export const posteriorSummariesTask = defineTask('posterior-summaries', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Generate Posterior Summaries`,
  agent: {
    name: 'bayesian-statistician',
    skills: ['mcmc-diagnostics', 'stan-bayesian-modeling', 'latex-math-formatter'],
    prompt: {
      role: 'Bayesian Results Interpretation Specialist',
      task: 'Generate comprehensive posterior summaries and model checks',
      context: {
        mcmcSampling: args.mcmcSampling,
        convergenceDiagnostics: args.convergenceDiagnostics,
        priorSpecification: args.priorSpecification,
        modelDescription: args.modelDescription
      },
      instructions: [
        '1. Calculate posterior means and medians for all parameters',
        '2. Calculate credible intervals (50%, 90%, 95%)',
        '3. Calculate highest density intervals (HDI)',
        '4. Assess probability of direction (pd)',
        '5. Compute posterior predictive distribution',
        '6. Perform posterior predictive checks',
        '7. Calculate LOO-CV for model comparison',
        '8. Calculate WAIC',
        '9. Compare posteriors to priors',
        '10. Generate interpretable summary'
      ],
      outputFormat: 'JSON object with posterior summaries'
    },
    outputSchema: {
      type: 'object',
      required: ['parameters', 'summary', 'credibleIntervals'],
      properties: {
        parameters: { type: 'array', items: { type: 'string' } },
        summary: {
          type: 'object',
          properties: {
            means: { type: 'object' },
            medians: { type: 'object' },
            sds: { type: 'object' }
          }
        },
        credibleIntervals: {
          type: 'object',
          properties: {
            ci50: { type: 'object' },
            ci90: { type: 'object' },
            ci95: { type: 'object' }
          }
        },
        hdi: { type: 'object' },
        probabilityOfDirection: { type: 'object' },
        posteriorPredictive: {
          type: 'object',
          properties: {
            mean: { type: 'string' },
            distribution: { type: 'string' }
          }
        },
        posteriorPredictiveChecks: {
          type: 'object',
          properties: {
            passed: { type: 'boolean' },
            pValue: { type: 'number' },
            interpretation: { type: 'string' }
          }
        },
        loo: {
          type: 'object',
          properties: {
            elpd: { type: 'number' },
            se: { type: 'number' },
            pLoo: { type: 'number' }
          }
        },
        waic: {
          type: 'object',
          properties: {
            waic: { type: 'number' },
            se: { type: 'number' }
          }
        },
        priorPosteriorComparison: { type: 'object' },
        interpretation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'bayesian-inference', 'posterior']
}));
