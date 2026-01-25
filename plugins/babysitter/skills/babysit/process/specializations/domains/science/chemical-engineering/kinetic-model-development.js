/**
 * @process chemical-engineering/kinetic-model-development
 * @description Develop reaction kinetics models from experimental data, including rate equations, activation energies, and mechanism validation
 * @inputs { processName: string, experimentalData: object, reactionSystem: object, outputDir: string }
 * @outputs { success: boolean, kineticModel: object, parameters: object, validationResults: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    experimentalData,
    reactionSystem,
    modelType = 'power-law',
    outputDir = 'kinetics-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Design Kinetic Experiments using DOE
  ctx.log('info', 'Starting kinetic model development: Designing experiments');
  const doeResult = await ctx.task(experimentDesignTask, {
    processName,
    reactionSystem,
    existingData: experimentalData,
    outputDir
  });

  if (!doeResult.success) {
    return {
      success: false,
      error: 'Experiment design failed',
      details: doeResult,
      metadata: { processId: 'chemical-engineering/kinetic-model-development', timestamp: startTime }
    };
  }

  artifacts.push(...doeResult.artifacts);

  // Task 2: Collect and Validate Reaction Rate Data
  ctx.log('info', 'Collecting and validating reaction rate data');
  const dataCollectionResult = await ctx.task(dataCollectionTask, {
    processName,
    experimentalData,
    doeDesign: doeResult.doeDesign,
    outputDir
  });

  artifacts.push(...dataCollectionResult.artifacts);

  // Task 3: Propose Reaction Mechanism and Rate Expressions
  ctx.log('info', 'Proposing reaction mechanism and rate expressions');
  const mechanismResult = await ctx.task(mechanismProposalTask, {
    processName,
    reactionSystem,
    experimentalData: dataCollectionResult.validatedData,
    modelType,
    outputDir
  });

  artifacts.push(...mechanismResult.artifacts);

  // Task 4: Estimate Kinetic Parameters through Regression
  ctx.log('info', 'Estimating kinetic parameters');
  const parameterEstimationResult = await ctx.task(parameterEstimationTask, {
    processName,
    rateExpressions: mechanismResult.rateExpressions,
    experimentalData: dataCollectionResult.validatedData,
    outputDir
  });

  artifacts.push(...parameterEstimationResult.artifacts);

  // Task 5: Validate Model Over Operating Range
  ctx.log('info', 'Validating kinetic model');
  const validationResult = await ctx.task(modelValidationTask, {
    processName,
    kineticModel: parameterEstimationResult.kineticModel,
    validationData: dataCollectionResult.validationSet,
    outputDir
  });

  artifacts.push(...validationResult.artifacts);

  // Breakpoint: Review kinetic model results
  await ctx.breakpoint({
    question: `Kinetic model developed for ${processName}. R-squared: ${parameterEstimationResult.rSquared}. Validation RMSE: ${validationResult.rmse}. Activation energy: ${parameterEstimationResult.kineticModel.activationEnergy} kJ/mol. Review model?`,
    title: 'Kinetic Model Development Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        modelType: mechanismResult.modelType,
        rSquared: parameterEstimationResult.rSquared,
        validationRmse: validationResult.rmse,
        activationEnergy: parameterEstimationResult.kineticModel.activationEnergy,
        preExponentialFactor: parameterEstimationResult.kineticModel.preExponentialFactor
      }
    }
  });

  // Task 6: Assess Model Uncertainty and Limitations
  ctx.log('info', 'Assessing model uncertainty');
  const uncertaintyResult = await ctx.task(uncertaintyAssessmentTask, {
    processName,
    kineticModel: parameterEstimationResult.kineticModel,
    parameterStatistics: parameterEstimationResult.statistics,
    validationResults: validationResult,
    outputDir
  });

  artifacts.push(...uncertaintyResult.artifacts);

  // Task 7: Document Kinetic Model
  ctx.log('info', 'Documenting kinetic model');
  const documentationResult = await ctx.task(kineticsDocumentationTask, {
    processName,
    reactionSystem,
    mechanism: mechanismResult.mechanism,
    kineticModel: parameterEstimationResult.kineticModel,
    validationResults: validationResult,
    uncertainty: uncertaintyResult,
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    kineticModel: parameterEstimationResult.kineticModel,
    parameters: {
      activationEnergy: parameterEstimationResult.kineticModel.activationEnergy,
      preExponentialFactor: parameterEstimationResult.kineticModel.preExponentialFactor,
      reactionOrders: parameterEstimationResult.kineticModel.reactionOrders
    },
    validationResults: {
      rSquared: parameterEstimationResult.rSquared,
      rmse: validationResult.rmse,
      validityRange: uncertaintyResult.validityRange
    },
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/kinetic-model-development',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Experiment Design
export const experimentDesignTask = defineTask('experiment-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design kinetic experiments using DOE',
  skill: { name: 'kinetic-modeler' },
  agent: {
    name: 'reaction-engineer',
    prompt: {
      role: 'design of experiments specialist',
      task: 'Design kinetic experiments using statistical DOE methods',
      context: args,
      instructions: [
        'Identify key factors affecting reaction rate (T, P, concentrations)',
        'Define factor levels and ranges to study',
        'Select appropriate DOE design (factorial, central composite, etc.)',
        'Calculate number of experiments required',
        'Plan replicate experiments for error estimation',
        'Design experiments to identify mass transfer limitations',
        'Create experiment matrix with all conditions',
        'Document DOE methodology and rationale'
      ],
      outputFormat: 'JSON with DOE design, experiment matrix, factor levels, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'doeDesign', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        doeDesign: {
          type: 'object',
          properties: {
            designType: { type: 'string' },
            factors: { type: 'array' },
            levels: { type: 'object' },
            experimentMatrix: { type: 'array' },
            totalExperiments: { type: 'number' }
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
  labels: ['agent', 'chemical-engineering', 'kinetics', 'doe']
}));

// Task 2: Data Collection and Validation
export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect and validate reaction rate data',
  skill: { name: 'kinetic-modeler' },
  agent: {
    name: 'reaction-engineer',
    prompt: {
      role: 'kinetic data analyst',
      task: 'Collect, organize, and validate experimental kinetic data',
      context: args,
      instructions: [
        'Organize experimental data by conditions',
        'Calculate reaction rates from conversion data',
        'Check data for outliers and errors',
        'Verify mass balance closure',
        'Assess data quality and reproducibility',
        'Split data into training and validation sets',
        'Transform data for regression analysis',
        'Document data quality assessment'
      ],
      outputFormat: 'JSON with validated data, quality metrics, training/validation split, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'validatedData', 'validationSet', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        validatedData: { type: 'array' },
        validationSet: { type: 'array' },
        dataQuality: {
          type: 'object',
          properties: {
            outliers: { type: 'number' },
            reproducibility: { type: 'number' },
            massBalanceClosure: { type: 'number' }
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
  labels: ['agent', 'chemical-engineering', 'kinetics', 'data-analysis']
}));

// Task 3: Mechanism Proposal
export const mechanismProposalTask = defineTask('mechanism-proposal', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Propose reaction mechanism and rate expressions',
  skill: { name: 'kinetic-modeler' },
  agent: {
    name: 'reaction-engineer',
    prompt: {
      role: 'reaction kinetics engineer',
      task: 'Propose reaction mechanism and derive rate expressions',
      context: args,
      instructions: [
        'Review literature for similar reaction mechanisms',
        'Propose elementary steps consistent with stoichiometry',
        'Apply steady-state or equilibrium assumptions',
        'Derive rate expression from mechanism',
        'Consider alternative rate law forms (power law, LHHW, etc.)',
        'Identify rate-determining step',
        'Propose multiple candidate models for comparison',
        'Document mechanism assumptions'
      ],
      outputFormat: 'JSON with mechanism, rate expressions, candidate models, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'mechanism', 'rateExpressions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        mechanism: {
          type: 'object',
          properties: {
            elementarySteps: { type: 'array' },
            rateDeeterminingStep: { type: 'string' },
            assumptions: { type: 'array' }
          }
        },
        rateExpressions: { type: 'array' },
        modelType: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'kinetics', 'mechanism']
}));

// Task 4: Parameter Estimation
export const parameterEstimationTask = defineTask('parameter-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate kinetic parameters through regression',
  skill: { name: 'kinetic-modeler' },
  agent: {
    name: 'reaction-engineer',
    prompt: {
      role: 'kinetic parameter estimation specialist',
      task: 'Estimate kinetic parameters using nonlinear regression',
      context: args,
      instructions: [
        'Set up objective function (minimize sum of squared residuals)',
        'Provide initial parameter estimates',
        'Perform nonlinear regression (Levenberg-Marquardt or similar)',
        'Calculate Arrhenius parameters (Ea, A)',
        'Estimate reaction orders',
        'Calculate confidence intervals for parameters',
        'Assess parameter correlation',
        'Compare candidate models using statistical criteria'
      ],
      outputFormat: 'JSON with kinetic model, parameters, statistics, R-squared, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'kineticModel', 'rSquared', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        kineticModel: {
          type: 'object',
          properties: {
            rateExpression: { type: 'string' },
            activationEnergy: { type: 'number' },
            preExponentialFactor: { type: 'number' },
            reactionOrders: { type: 'object' }
          }
        },
        rSquared: { type: 'number' },
        statistics: {
          type: 'object',
          properties: {
            confidenceIntervals: { type: 'object' },
            correlationMatrix: { type: 'array' },
            standardErrors: { type: 'object' }
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
  labels: ['agent', 'chemical-engineering', 'kinetics', 'regression']
}));

// Task 5: Model Validation
export const modelValidationTask = defineTask('model-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate kinetic model over operating range',
  skill: { name: 'aspen-plus-simulator' },
  agent: {
    name: 'reaction-engineer',
    prompt: {
      role: 'kinetic model validation engineer',
      task: 'Validate kinetic model against independent data',
      context: args,
      instructions: [
        'Compare model predictions with validation data set',
        'Calculate prediction errors (RMSE, MAE)',
        'Generate parity plot (predicted vs. observed)',
        'Assess model performance across operating range',
        'Identify regions of poor model fit',
        'Test model extrapolation behavior',
        'Calculate prediction intervals',
        'Document validation results'
      ],
      outputFormat: 'JSON with validation metrics, plots, prediction intervals, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'rmse', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        rmse: { type: 'number' },
        mae: { type: 'number' },
        maxError: { type: 'number' },
        parityPlotPath: { type: 'string' },
        predictionIntervals: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'kinetics', 'validation']
}));

// Task 6: Uncertainty Assessment
export const uncertaintyAssessmentTask = defineTask('uncertainty-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess model uncertainty and limitations',
  skill: { name: 'kinetic-modeler' },
  agent: {
    name: 'reaction-engineer',
    prompt: {
      role: 'model uncertainty analyst',
      task: 'Assess kinetic model uncertainty and define validity range',
      context: args,
      instructions: [
        'Quantify parameter uncertainties',
        'Propagate uncertainties to model predictions',
        'Define model validity range (T, P, composition)',
        'Identify model limitations',
        'Assess extrapolation risks',
        'Recommend additional experiments if needed',
        'Document uncertainty analysis',
        'Create uncertainty bands for predictions'
      ],
      outputFormat: 'JSON with uncertainty analysis, validity range, limitations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'validityRange', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        validityRange: {
          type: 'object',
          properties: {
            temperature: { type: 'object' },
            pressure: { type: 'object' },
            concentration: { type: 'object' }
          }
        },
        uncertaintyBands: { type: 'object' },
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
  labels: ['agent', 'chemical-engineering', 'kinetics', 'uncertainty']
}));

// Task 7: Kinetics Documentation
export const kineticsDocumentationTask = defineTask('kinetics-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document kinetic model',
  skill: { name: 'kinetic-modeler' },
  agent: {
    name: 'reaction-engineer',
    prompt: {
      role: 'kinetics documentation engineer',
      task: 'Create comprehensive kinetic model documentation',
      context: args,
      instructions: [
        'Document reaction system and chemistry',
        'Describe experimental methodology',
        'Present proposed mechanism',
        'Document rate expression and parameters',
        'Include parameter estimation methodology',
        'Present validation results',
        'Document model limitations and validity range',
        'Provide implementation guidance for simulators'
      ],
      outputFormat: 'JSON with documentation path, summary, implementation guide, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'documentPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        documentPath: { type: 'string' },
        summary: { type: 'string' },
        implementationGuide: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'kinetics', 'documentation']
}));
