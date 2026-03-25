/**
 * @process scientific-discovery/latent-variable-thinking
 * @description Treat observed measurements as manifestations of hidden constructs, using latent variable models to understand measurement and structure
 * @inputs { observedVariables: array, theoreticalModel: object, data: object, outputDir: string }
 * @outputs { success: boolean, latentStructure: object, measurementModel: object, modelFit: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    observedVariables = [],
    theoreticalModel = {},
    data = {},
    outputDir = 'latent-variable-output',
    targetModelFit = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Latent Variable Thinking Process');

  // ============================================================================
  // PHASE 1: THEORETICAL MODEL SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Specifying theoretical latent variable model');
  const modelSpecification = await ctx.task(theoreticalModelSpecificationTask, {
    observedVariables,
    theoreticalModel,
    outputDir
  });

  artifacts.push(...modelSpecification.artifacts);

  // ============================================================================
  // PHASE 2: MEASUREMENT MODEL DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing measurement model');
  const measurementModelDesign = await ctx.task(measurementModelDesignTask, {
    observedVariables,
    latentVariables: modelSpecification.latentVariables,
    theoreticalModel,
    outputDir
  });

  artifacts.push(...measurementModelDesign.artifacts);

  // ============================================================================
  // PHASE 3: INDICATOR QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Assessing indicator quality');
  const indicatorAssessment = await ctx.task(indicatorQualityAssessmentTask, {
    measurementModel: measurementModelDesign.model,
    data,
    outputDir
  });

  artifacts.push(...indicatorAssessment.artifacts);

  // ============================================================================
  // PHASE 4: STRUCTURAL MODEL SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Specifying structural model');
  const structuralModelSpec = await ctx.task(structuralModelSpecificationTask, {
    latentVariables: modelSpecification.latentVariables,
    theoreticalModel,
    outputDir
  });

  artifacts.push(...structuralModelSpec.artifacts);

  // ============================================================================
  // PHASE 5: MODEL IDENTIFICATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing model identification');
  const identificationAnalysis = await ctx.task(modelIdentificationTask, {
    measurementModel: measurementModelDesign.model,
    structuralModel: structuralModelSpec.model,
    outputDir
  });

  artifacts.push(...identificationAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: MODEL ESTIMATION AND FIT
  // ============================================================================

  ctx.log('info', 'Phase 6: Estimating model and assessing fit');
  const modelEstimation = await ctx.task(modelEstimationFitTask, {
    measurementModel: measurementModelDesign.model,
    structuralModel: structuralModelSpec.model,
    data,
    identificationStatus: identificationAnalysis.status,
    outputDir
  });

  artifacts.push(...modelEstimation.artifacts);

  // ============================================================================
  // PHASE 7: MODEL MODIFICATION AND RESPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Evaluating model modifications');
  const modelModification = await ctx.task(modelModificationTask, {
    currentModel: modelEstimation.model,
    fitIndices: modelEstimation.fitIndices,
    modificationIndices: modelEstimation.modificationIndices,
    targetModelFit,
    outputDir
  });

  artifacts.push(...modelModification.artifacts);

  // ============================================================================
  // PHASE 8: SYNTHESIS AND INTERPRETATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing latent variable analysis');
  const synthesis = await ctx.task(latentVariableSynthesisTask, {
    modelSpecification,
    measurementModelDesign,
    indicatorAssessment,
    structuralModelSpec,
    identificationAnalysis,
    modelEstimation,
    modelModification,
    targetModelFit,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  const fitMet = synthesis.overallFitScore >= targetModelFit;

  // Breakpoint: Review latent variable analysis
  await ctx.breakpoint({
    question: `Latent variable analysis complete. Model fit: ${synthesis.overallFitScore}/${targetModelFit}. ${fitMet ? 'Fit target met!' : 'Model may need respecification.'} Review analysis?`,
    title: 'Latent Variable Thinking Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        latentVariables: modelSpecification.latentVariables.length,
        observedIndicators: observedVariables.length,
        modelIdentified: identificationAnalysis.status === 'identified',
        fitIndices: modelEstimation.fitIndices,
        overallFitScore: synthesis.overallFitScore,
        fitMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    latentStructure: {
      latentVariables: modelSpecification.latentVariables,
      relationships: structuralModelSpec.relationships
    },
    measurementModel: {
      model: measurementModelDesign.model,
      indicatorQuality: indicatorAssessment.quality
    },
    modelFit: {
      fitIndices: modelEstimation.fitIndices,
      overallFitScore: synthesis.overallFitScore,
      modifications: modelModification.recommendations
    },
    interpretation: synthesis.interpretation,
    fitMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/latent-variable-thinking',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Theoretical Model Specification
export const theoreticalModelSpecificationTask = defineTask('theoretical-model-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify theoretical latent variable model',
  agent: {
    name: 'theoretical-modeler',
    prompt: {
      role: 'psychometrician and theoretical psychologist',
      task: 'Specify the theoretical latent variable model',
      context: args,
      instructions: [
        'Identify the latent variables (constructs) to be modeled:',
        '  - What unobservable constructs are hypothesized?',
        '  - What is each construct\'s theoretical meaning?',
        '  - How do constructs relate to theory?',
        'Specify the relationship between latent and observed variables:',
        '  - Which indicators reflect which latent variables?',
        '  - Are relationships reflective or formative?',
        'Specify relationships among latent variables:',
        '  - Correlational structure',
        '  - Causal/directional relationships',
        '  - Higher-order factors',
        'Document theoretical justification for each specification',
        'Identify alternative model specifications',
        'Save model specification to output directory'
      ],
      outputFormat: 'JSON with latentVariables (array), indicatorMappings, latentRelationships, theoreticalJustification, alternativeModels, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['latentVariables', 'indicatorMappings', 'artifacts'],
      properties: {
        latentVariables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              definition: { type: 'string' },
              theoreticalBasis: { type: 'string' },
              indicators: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        indicatorMappings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              indicator: { type: 'string' },
              latentVariable: { type: 'string' },
              relationshipType: { type: 'string', enum: ['reflective', 'formative'] }
            }
          }
        },
        latentRelationships: { type: 'array', items: { type: 'object' } },
        theoreticalJustification: { type: 'string' },
        alternativeModels: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'latent-variable', 'model-specification']
}));

// Task 2: Measurement Model Design
export const measurementModelDesignTask = defineTask('measurement-model-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design measurement model',
  agent: {
    name: 'measurement-modeler',
    prompt: {
      role: 'structural equation modeling specialist',
      task: 'Design the measurement model linking indicators to latent variables',
      context: args,
      instructions: [
        'Specify factor loadings:',
        '  - Which loadings are free vs. fixed?',
        '  - Marker variable selection',
        '  - Cross-loadings (if any)',
        'Specify error structure:',
        '  - Uncorrelated errors (standard)',
        '  - Correlated errors (theoretical justification)',
        'Set identification constraints:',
        '  - Factor variance or marker loading',
        '  - At least 3 indicators per factor preferred',
        'Consider invariance requirements:',
        '  - Configural, metric, scalar invariance',
        'Document all model specifications',
        'Create path diagram representation',
        'Save measurement model to output directory'
      ],
      outputFormat: 'JSON with model (loadings, errors, constraints), pathDiagram, invarianceRequirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'pathDiagram', 'artifacts'],
      properties: {
        model: {
          type: 'object',
          properties: {
            loadings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  indicator: { type: 'string' },
                  factor: { type: 'string' },
                  type: { type: 'string', enum: ['free', 'fixed', 'constrained'] },
                  value: { type: 'number' }
                }
              }
            },
            errorCorrelations: { type: 'array', items: { type: 'object' } },
            constraints: { type: 'array', items: { type: 'string' } }
          }
        },
        pathDiagram: { type: 'string' },
        invarianceRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'latent-variable', 'measurement-model']
}));

// Task 3: Indicator Quality Assessment
export const indicatorQualityAssessmentTask = defineTask('indicator-quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess indicator quality',
  agent: {
    name: 'indicator-analyst',
    prompt: {
      role: 'psychometrician specializing in item analysis',
      task: 'Assess the quality of observed indicators',
      context: args,
      instructions: [
        'Examine indicator distributions:',
        '  - Normality, skewness, kurtosis',
        '  - Floor/ceiling effects',
        '  - Missing data patterns',
        'Assess indicator reliability:',
        '  - Item-total correlations',
        '  - Squared multiple correlations',
        '  - Communalities',
        'Evaluate indicator validity:',
        '  - Convergent validity (loading magnitude)',
        '  - Discriminant validity (cross-loading magnitude)',
        'Identify problematic indicators:',
        '  - Low loadings (< 0.4)',
        '  - High cross-loadings',
        '  - High residual correlations',
        'Recommend indicator modifications',
        'Save quality assessment to output directory'
      ],
      outputFormat: 'JSON with quality (distributions, reliability, validity), problematicIndicators, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['quality', 'problematicIndicators', 'artifacts'],
      properties: {
        quality: {
          type: 'object',
          properties: {
            distributions: { type: 'object' },
            reliability: {
              type: 'object',
              additionalProperties: { type: 'number' }
            },
            validity: {
              type: 'object',
              properties: {
                convergent: { type: 'object' },
                discriminant: { type: 'object' }
              }
            }
          }
        },
        problematicIndicators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              indicator: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'latent-variable', 'indicator-quality']
}));

// Task 4: Structural Model Specification
export const structuralModelSpecificationTask = defineTask('structural-model-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify structural model',
  agent: {
    name: 'structural-modeler',
    prompt: {
      role: 'structural equation modeling specialist',
      task: 'Specify the structural relationships among latent variables',
      context: args,
      instructions: [
        'Specify relationships among latent variables:',
        '  - Correlational (covariances)',
        '  - Directional (regression paths)',
        '  - Mediational chains',
        '  - Moderating effects',
        'Identify exogenous vs. endogenous latent variables',
        'Specify disturbance terms for endogenous variables',
        'Consider recursive vs. non-recursive models',
        'Document theoretical justification for each path',
        'Identify equivalent models',
        'Create structural path diagram',
        'Save structural model to output directory'
      ],
      outputFormat: 'JSON with model (paths, covariances, disturbances), relationships, equivalentModels, theoreticalBasis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'relationships', 'artifacts'],
      properties: {
        model: {
          type: 'object',
          properties: {
            paths: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  from: { type: 'string' },
                  to: { type: 'string' },
                  type: { type: 'string', enum: ['regression', 'covariance'] }
                }
              }
            },
            covariances: { type: 'array', items: { type: 'object' } },
            disturbances: { type: 'array', items: { type: 'string' } }
          }
        },
        relationships: { type: 'array', items: { type: 'object' } },
        equivalentModels: { type: 'array', items: { type: 'object' } },
        theoreticalBasis: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'latent-variable', 'structural-model']
}));

// Task 5: Model Identification Analysis
export const modelIdentificationTask = defineTask('model-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze model identification',
  agent: {
    name: 'identification-analyst',
    prompt: {
      role: 'structural equation modeling methodologist',
      task: 'Determine if the model is identified',
      context: args,
      instructions: [
        'Count model parameters vs. observed variances/covariances',
        'Calculate degrees of freedom',
        'Assess identification status:',
        '  - Under-identified (df < 0): not estimable',
        '  - Just-identified (df = 0): estimable, no fit test',
        '  - Over-identified (df > 0): estimable with fit test',
        'Check necessary conditions:',
        '  - Three-indicator rule for CFA',
        '  - Two-indicator rule with constraints',
        '  - Scaling constraints',
        'Identify potential identification problems:',
        '  - Empirical underidentification',
        '  - Near-singular matrices',
        'Recommend identification fixes if needed',
        'Save identification analysis to output directory'
      ],
      outputFormat: 'JSON with status, degreesOfFreedom, parameters, problems, fixes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'degreesOfFreedom', 'artifacts'],
      properties: {
        status: { type: 'string', enum: ['identified', 'just-identified', 'under-identified'] },
        degreesOfFreedom: { type: 'number' },
        parameters: {
          type: 'object',
          properties: {
            free: { type: 'number' },
            fixed: { type: 'number' },
            observed: { type: 'number' }
          }
        },
        problems: { type: 'array', items: { type: 'string' } },
        fixes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'latent-variable', 'identification']
}));

// Task 6: Model Estimation and Fit
export const modelEstimationFitTask = defineTask('model-estimation-fit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate model and assess fit',
  agent: {
    name: 'model-estimator',
    prompt: {
      role: 'quantitative psychologist specializing in SEM',
      task: 'Estimate the model and assess global and local fit',
      context: args,
      instructions: [
        'Select estimation method (ML, WLSMV, etc.)',
        'Assess global fit indices:',
        '  - Chi-square and p-value',
        '  - RMSEA and 90% CI',
        '  - CFI and TLI',
        '  - SRMR',
        'Interpret fit against cutoffs:',
        '  - RMSEA < 0.06 (good), < 0.08 (acceptable)',
        '  - CFI/TLI > 0.95 (good), > 0.90 (acceptable)',
        '  - SRMR < 0.08 (good)',
        'Examine local fit:',
        '  - Standardized residuals',
        '  - Modification indices',
        'Report parameter estimates with standard errors',
        'Calculate R-squared for endogenous variables',
        'Save estimation results to output directory'
      ],
      outputFormat: 'JSON with model, fitIndices, parameterEstimates, localFit, modificationIndices, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'fitIndices', 'parameterEstimates', 'artifacts'],
      properties: {
        model: { type: 'object' },
        fitIndices: {
          type: 'object',
          properties: {
            chiSquare: { type: 'number' },
            df: { type: 'number' },
            pValue: { type: 'number' },
            RMSEA: { type: 'number' },
            RMSEA_CI: { type: 'array', items: { type: 'number' } },
            CFI: { type: 'number' },
            TLI: { type: 'number' },
            SRMR: { type: 'number' }
          }
        },
        parameterEstimates: { type: 'array', items: { type: 'object' } },
        localFit: {
          type: 'object',
          properties: {
            standardizedResiduals: { type: 'object' },
            largeResiduals: { type: 'array', items: { type: 'object' } }
          }
        },
        modificationIndices: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'latent-variable', 'estimation-fit']
}));

// Task 7: Model Modification
export const modelModificationTask = defineTask('model-modification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate model modifications',
  agent: {
    name: 'model-modifier',
    prompt: {
      role: 'SEM specialist in model development',
      task: 'Evaluate potential model modifications to improve fit',
      context: args,
      instructions: [
        'Review modification indices:',
        '  - Cross-loadings',
        '  - Error covariances',
        '  - Additional paths',
        'Evaluate each potential modification:',
        '  - Expected parameter change',
        '  - Theoretical justification',
        '  - Risk of capitalizing on chance',
        'Consider model comparison:',
        '  - Nested model chi-square difference',
        '  - AIC/BIC comparison',
        'Apply modifications conservatively:',
        '  - Only theoretically justified changes',
        '  - Document all modifications',
        '  - Cross-validation recommended',
        'Compare original vs. modified model',
        'Save modification analysis to output directory'
      ],
      outputFormat: 'JSON with recommendations, justifications, modelComparison, warnings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'modelComparison', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              modification: { type: 'string' },
              expectedImprovement: { type: 'number' },
              theoreticalJustification: { type: 'string' },
              recommended: { type: 'boolean' }
            }
          }
        },
        justifications: { type: 'array', items: { type: 'string' } },
        modelComparison: {
          type: 'object',
          properties: {
            original: { type: 'object' },
            modified: { type: 'object' },
            improvement: { type: 'object' }
          }
        },
        warnings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'latent-variable', 'modification']
}));

// Task 8: Latent Variable Synthesis
export const latentVariableSynthesisTask = defineTask('latent-variable-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize latent variable analysis',
  agent: {
    name: 'synthesis-specialist',
    prompt: {
      role: 'senior quantitative methodologist',
      task: 'Synthesize latent variable analysis findings',
      context: args,
      instructions: [
        'Summarize the final latent variable model',
        'Interpret substantive findings:',
        '  - What do the latent variables represent?',
        '  - How strong are the relationships?',
        '  - What is the measurement quality?',
        'Calculate overall model fit score (0-100):',
        '  - Weight fit indices appropriately',
        '  - Consider measurement vs. structural fit',
        '  - Account for modifications made',
        'Discuss limitations:',
        '  - Sample size adequacy',
        '  - Distributional assumptions',
        '  - Equivalent models',
        'Provide recommendations for future research',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with interpretation, overallFitScore, findings, limitations, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interpretation', 'overallFitScore', 'artifacts'],
      properties: {
        interpretation: {
          type: 'object',
          properties: {
            latentVariables: { type: 'string' },
            relationships: { type: 'string' },
            measurementQuality: { type: 'string' }
          }
        },
        overallFitScore: { type: 'number', minimum: 0, maximum: 100 },
        findings: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'latent-variable', 'synthesis']
}));
