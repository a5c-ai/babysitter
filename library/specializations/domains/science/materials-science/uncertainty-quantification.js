/**
 * @process MS-024: Uncertainty Quantification Protocol
 * @description Comprehensive uncertainty quantification for materials data including
 * measurement uncertainty, material variability, model uncertainty, and propagation analysis
 * @inputs {
 *   dataSource: string, // experimental, computational, literature
 *   propertyType: string, // mechanical, thermal, electrical, etc.
 *   measurementMethod: string,
 *   sampleSize: number,
 *   materialVariability: string, // batch, heat, lot
 *   statisticalBasis: string, // A-basis, B-basis, S-basis, typical
 *   confidenceLevel: number,
 *   projectContext: string
 * }
 * @outputs {
 *   uncertaintyAnalysis: object,
 *   measurementUncertainty: object,
 *   materialVariability: object,
 *   statisticalAllowables: object,
 *   propagationResults: object,
 *   artifacts: string[]
 * }
 * @example
 * {
 *   "dataSource": "experimental",
 *   "propertyType": "tensile-strength",
 *   "measurementMethod": "ASTM E8",
 *   "sampleSize": 30,
 *   "materialVariability": "heat-to-heat",
 *   "statisticalBasis": "B-basis",
 *   "confidenceLevel": 0.95
 * }
 * @references GUM (ISO Guide to Uncertainty), MMPDS Statistical Methods, ASTM E2586, Bayesian UQ
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dataSource,
    propertyType,
    measurementMethod,
    sampleSize,
    materialVariability,
    statisticalBasis,
    confidenceLevel,
    projectContext
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Phase 1: Uncertainty Source Identification
  ctx.log('info', 'Phase 1: Identifying uncertainty sources');
  const sourceIdentification = await ctx.task(identifyUncertaintySources, {
    dataSource,
    propertyType,
    measurementMethod,
    materialVariability,
    projectContext
  });
  artifacts.push(...(sourceIdentification.artifacts || []));

  // Phase 2: Measurement Uncertainty Analysis
  ctx.log('info', 'Phase 2: Analyzing measurement uncertainty');
  const measurementAnalysis = await ctx.task(analyzeMeasurementUncertainty, {
    measurementMethod,
    propertyType,
    instrumentUncertainty: inputs.instrumentUncertainty,
    environmentalFactors: inputs.environmentalFactors,
    operatorVariability: inputs.operatorVariability,
    uncertaintySources: sourceIdentification.measurementSources
  });
  artifacts.push(...(measurementAnalysis.artifacts || []));

  // Phase 3: Material Variability Analysis
  ctx.log('info', 'Phase 3: Analyzing material variability');
  const variabilityAnalysis = await ctx.task(analyzeMaterialVariability, {
    materialVariability,
    sampleSize,
    dataSource,
    nestedStructure: inputs.nestedStructure, // batch/heat/lot structure
    variabilitySources: sourceIdentification.materialSources
  });
  artifacts.push(...(variabilityAnalysis.artifacts || []));

  // Phase 4: Model Uncertainty Analysis (for computational data)
  ctx.log('info', 'Phase 4: Analyzing model uncertainty');
  const modelAnalysis = await ctx.task(analyzeModelUncertainty, {
    dataSource,
    modelType: inputs.modelType,
    inputUncertainties: inputs.inputUncertainties,
    modelValidation: inputs.modelValidation,
    modelSources: sourceIdentification.modelSources
  });
  artifacts.push(...(modelAnalysis.artifacts || []));

  // Phase 5: Combined Uncertainty Budget
  ctx.log('info', 'Phase 5: Developing combined uncertainty budget');
  const uncertaintyBudget = await ctx.task(developUncertaintyBudget, {
    measurementUncertainty: measurementAnalysis.uncertainty,
    materialVariability: variabilityAnalysis.variability,
    modelUncertainty: modelAnalysis.uncertainty,
    correlations: inputs.correlations,
    combinationMethod: inputs.combinationMethod || 'GUM'
  });
  artifacts.push(...(uncertaintyBudget.artifacts || []));

  // Quality Gate: Review uncertainty budget
  await ctx.breakpoint({
    question: 'Review the uncertainty budget. Are all significant sources captured and properly quantified?',
    title: 'Uncertainty Budget Review',
    context: {
      runId: ctx.runId,
      summary: {
        totalUncertainty: uncertaintyBudget.combinedUncertainty,
        dominantSources: uncertaintyBudget.dominantSources,
        measurementContribution: measurementAnalysis.contribution,
        materialContribution: variabilityAnalysis.contribution
      },
      files: artifacts
    }
  });

  // Phase 6: Statistical Allowables Calculation
  ctx.log('info', 'Phase 6: Calculating statistical allowables');
  const allowablesCalculation = await ctx.task(calculateAllowables, {
    statisticalBasis,
    confidenceLevel,
    sampleSize,
    distributionType: inputs.distributionType,
    combinedUncertainty: uncertaintyBudget.combinedUncertainty,
    rawData: inputs.rawData
  });
  artifacts.push(...(allowablesCalculation.artifacts || []));

  // Phase 7: Uncertainty Propagation
  ctx.log('info', 'Phase 7: Propagating uncertainty through calculations');
  const uncertaintyPropagation = await ctx.task(propagateUncertainty, {
    inputUncertainties: uncertaintyBudget.uncertainties,
    propagationModels: inputs.propagationModels,
    outputQuantities: inputs.outputQuantities,
    propagationMethod: inputs.propagationMethod || 'Monte-Carlo'
  });
  artifacts.push(...(uncertaintyPropagation.artifacts || []));

  // Phase 8: Sensitivity Analysis
  ctx.log('info', 'Phase 8: Performing sensitivity analysis');
  const sensitivityAnalysis = await ctx.task(performSensitivityAnalysis, {
    uncertaintyBudget: uncertaintyBudget.budget,
    propagationResults: uncertaintyPropagation.results,
    sensitivityMethods: inputs.sensitivityMethods || ['Sobol', 'Morris']
  });
  artifacts.push(...(sensitivityAnalysis.artifacts || []));

  // Phase 9: Documentation and Reporting
  ctx.log('info', 'Phase 9: Generating uncertainty documentation');
  const uncertaintyDocumentation = await ctx.task(documentUncertainty, {
    sourceIdentification: sourceIdentification.results,
    measurementAnalysis: measurementAnalysis.results,
    variabilityAnalysis: variabilityAnalysis.results,
    modelAnalysis: modelAnalysis.results,
    uncertaintyBudget: uncertaintyBudget.budget,
    allowables: allowablesCalculation.allowables,
    propagation: uncertaintyPropagation.results,
    sensitivity: sensitivityAnalysis.results
  });
  artifacts.push(...(uncertaintyDocumentation.artifacts || []));

  const endTime = ctx.now();

  return {
    success: true,
    uncertaintyAnalysis: {
      sources: sourceIdentification.results,
      budget: uncertaintyBudget.budget,
      combinedUncertainty: uncertaintyBudget.combinedUncertainty,
      expandedUncertainty: uncertaintyBudget.expandedUncertainty,
      coverageFactor: uncertaintyBudget.coverageFactor,
      dominantSources: uncertaintyBudget.dominantSources
    },
    measurementUncertainty: {
      typeA: measurementAnalysis.typeA,
      typeB: measurementAnalysis.typeB,
      combined: measurementAnalysis.uncertainty,
      components: measurementAnalysis.components,
      contribution: measurementAnalysis.contribution
    },
    materialVariability: {
      withinBatch: variabilityAnalysis.withinBatch,
      betweenBatch: variabilityAnalysis.betweenBatch,
      total: variabilityAnalysis.variability,
      varianceComponents: variabilityAnalysis.components,
      contribution: variabilityAnalysis.contribution
    },
    statisticalAllowables: {
      basis: allowablesCalculation.basis,
      allowableValue: allowablesCalculation.allowables,
      confidenceLevel: allowablesCalculation.confidence,
      tolerance: allowablesCalculation.tolerance,
      sampleSizeAdequacy: allowablesCalculation.sampleAdequacy,
      distributionFit: allowablesCalculation.distributionFit
    },
    propagationResults: {
      outputUncertainties: uncertaintyPropagation.outputUncertainties,
      correlationEffects: uncertaintyPropagation.correlationEffects,
      monteCarloResults: uncertaintyPropagation.mcResults,
      sensitivityIndices: sensitivityAnalysis.indices
    },
    documentation: uncertaintyDocumentation.report,
    artifacts,
    metadata: {
      processId: 'MS-024',
      startTime,
      endTime,
      duration: endTime - startTime
    }
  };
}

export const identifyUncertaintySources = defineTask('identify-uncertainty-sources', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Uncertainty Source Identification',
  agent: {
    name: 'uncertainty-source-analyst',
    prompt: {
      role: 'Metrologist specializing in uncertainty source identification',
      task: `Identify uncertainty sources for ${args.propertyType} measurement`,
      context: args,
      instructions: [
        'Catalog measurement-related uncertainty sources',
        'Identify material variability sources (batch, heat, location)',
        'List environmental and condition uncertainties',
        'Identify model and calculation uncertainties',
        'Classify sources as Type A or Type B',
        'Assess relative significance of each source',
        'Document basis for including/excluding sources',
        'Create cause-effect diagram for uncertainties'
      ],
      outputFormat: 'JSON with categorized uncertainty sources'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'measurementSources', 'materialSources', 'modelSources', 'artifacts'],
      properties: {
        results: { type: 'object' },
        measurementSources: { type: 'array' },
        materialSources: { type: 'array' },
        modelSources: { type: 'array' },
        causeEffectDiagram: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'uncertainty', 'sources', 'materials-science']
}));

export const analyzeMeasurementUncertainty = defineTask('analyze-measurement-uncertainty', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Measurement Uncertainty Analysis',
  agent: {
    name: 'measurement-uncertainty-analyst',
    prompt: {
      role: 'Measurement specialist for uncertainty analysis per GUM',
      task: `Analyze measurement uncertainty for ${args.measurementMethod}`,
      context: args,
      instructions: [
        'Evaluate Type A uncertainty from repeated measurements',
        'Estimate Type B uncertainty from calibration, specs, etc.',
        'Assess instrument resolution and calibration uncertainty',
        'Evaluate environmental effects on measurement',
        'Consider operator and procedure variability',
        'Apply appropriate probability distributions',
        'Calculate combined measurement uncertainty',
        'Document per ISO GUM methodology'
      ],
      outputFormat: 'JSON with measurement uncertainty analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'typeA', 'typeB', 'uncertainty', 'components', 'contribution', 'artifacts'],
      properties: {
        results: { type: 'object' },
        typeA: { type: 'object' },
        typeB: { type: 'object' },
        uncertainty: { type: 'number' },
        components: { type: 'array' },
        contribution: { type: 'number' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'measurement', 'uncertainty', 'materials-science']
}));

export const analyzeMaterialVariability = defineTask('analyze-material-variability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Material Variability Analysis',
  agent: {
    name: 'material-variability-analyst',
    prompt: {
      role: 'Statistician for materials variability analysis',
      task: `Analyze material variability at ${args.materialVariability} level`,
      context: args,
      instructions: [
        'Perform nested ANOVA for hierarchical variability',
        'Estimate within-batch variance components',
        'Estimate between-batch variance components',
        'Calculate total material variability',
        'Assess adequacy of sample representation',
        'Check for location or orientation effects',
        'Document assumptions and limitations',
        'Calculate variability contribution percentage'
      ],
      outputFormat: 'JSON with material variability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'withinBatch', 'betweenBatch', 'variability', 'components', 'contribution', 'artifacts'],
      properties: {
        results: { type: 'object' },
        withinBatch: { type: 'object' },
        betweenBatch: { type: 'object' },
        variability: { type: 'number' },
        components: { type: 'object' },
        contribution: { type: 'number' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'variability', 'statistics', 'materials-science']
}));

export const analyzeModelUncertainty = defineTask('analyze-model-uncertainty', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model Uncertainty Analysis',
  agent: {
    name: 'model-uncertainty-analyst',
    prompt: {
      role: 'Computational scientist for model uncertainty quantification',
      task: 'Analyze model uncertainty for computational predictions',
      context: args,
      instructions: [
        'Identify model form uncertainty (structural)',
        'Assess parameter uncertainty',
        'Evaluate numerical uncertainty (discretization, convergence)',
        'Consider input data uncertainty propagation',
        'Assess model validation uncertainty',
        'Compare predictions with experimental data',
        'Apply Bayesian calibration if appropriate',
        'Document model limitations and validity range'
      ],
      outputFormat: 'JSON with model uncertainty analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'uncertainty', 'modelSources', 'artifacts'],
      properties: {
        results: { type: 'object' },
        uncertainty: { type: 'object' },
        formUncertainty: { type: 'object' },
        parameterUncertainty: { type: 'object' },
        numericalUncertainty: { type: 'object' },
        validationUncertainty: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model', 'uncertainty', 'materials-science']
}));

export const developUncertaintyBudget = defineTask('develop-uncertainty-budget', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Uncertainty Budget Development',
  agent: {
    name: 'uncertainty-budget-developer',
    prompt: {
      role: 'Metrologist for uncertainty budget development',
      task: 'Develop combined uncertainty budget',
      context: args,
      instructions: [
        'Compile all uncertainty components',
        'Apply sensitivity coefficients',
        'Account for correlations between sources',
        'Combine uncertainties using GUM methodology',
        'Calculate expanded uncertainty with coverage factor',
        'Identify dominant uncertainty contributors',
        'Assess opportunities for uncertainty reduction',
        'Document budget in standard tabular format'
      ],
      outputFormat: 'JSON with uncertainty budget'
    },
    outputSchema: {
      type: 'object',
      required: ['budget', 'uncertainties', 'combinedUncertainty', 'expandedUncertainty', 'coverageFactor', 'dominantSources', 'artifacts'],
      properties: {
        budget: { type: 'object' },
        uncertainties: { type: 'array' },
        combinedUncertainty: { type: 'number' },
        expandedUncertainty: { type: 'number' },
        coverageFactor: { type: 'number' },
        dominantSources: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'budget', 'uncertainty', 'materials-science']
}));

export const calculateAllowables = defineTask('calculate-allowables', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Statistical Allowables Calculation',
  agent: {
    name: 'allowables-calculation-specialist',
    prompt: {
      role: 'Statistician for design allowables calculation',
      task: `Calculate ${args.statisticalBasis} allowables`,
      context: args,
      instructions: [
        'Fit appropriate probability distribution to data',
        'Verify distribution assumptions (normality, etc.)',
        'Apply MMPDS/CMH-17 statistical methods',
        'Calculate tolerance bounds or confidence intervals',
        'Apply sample size corrections',
        'Calculate allowable values at specified basis',
        'Assess sample size adequacy for basis',
        'Document statistical methodology'
      ],
      outputFormat: 'JSON with calculated allowables'
    },
    outputSchema: {
      type: 'object',
      required: ['basis', 'allowables', 'confidence', 'tolerance', 'sampleAdequacy', 'distributionFit', 'artifacts'],
      properties: {
        basis: { type: 'string' },
        allowables: { type: 'object' },
        confidence: { type: 'number' },
        tolerance: { type: 'number' },
        sampleAdequacy: { type: 'object' },
        distributionFit: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'allowables', 'statistics', 'materials-science']
}));

export const propagateUncertainty = defineTask('propagate-uncertainty', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Uncertainty Propagation',
  agent: {
    name: 'uncertainty-propagation-specialist',
    prompt: {
      role: 'Uncertainty propagation specialist',
      task: 'Propagate uncertainty through calculations and models',
      context: args,
      instructions: [
        'Apply analytical propagation for simple functions',
        'Use Monte Carlo simulation for complex functions',
        'Account for input correlations in propagation',
        'Calculate output distributions and percentiles',
        'Assess convergence of Monte Carlo results',
        'Compare analytical and MC results if applicable',
        'Document propagation methodology',
        'Generate output uncertainty statistics'
      ],
      outputFormat: 'JSON with propagation results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'outputUncertainties', 'correlationEffects', 'mcResults', 'artifacts'],
      properties: {
        results: { type: 'object' },
        outputUncertainties: { type: 'object' },
        correlationEffects: { type: 'object' },
        mcResults: { type: 'object' },
        convergenceStats: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'propagation', 'monte-carlo', 'materials-science']
}));

export const performSensitivityAnalysis = defineTask('perform-sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Sensitivity Analysis',
  agent: {
    name: 'sensitivity-analysis-specialist',
    prompt: {
      role: 'Sensitivity analysis specialist for uncertainty studies',
      task: 'Perform global sensitivity analysis',
      context: args,
      instructions: [
        'Apply Sobol indices for global sensitivity',
        'Perform Morris screening for factor importance',
        'Calculate first-order and total effect indices',
        'Identify interactions between uncertainty sources',
        'Rank factors by contribution to output variance',
        'Identify critical sources for uncertainty reduction',
        'Visualize sensitivity results',
        'Document methodology and interpretation'
      ],
      outputFormat: 'JSON with sensitivity analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'indices', 'artifacts'],
      properties: {
        results: { type: 'object' },
        indices: { type: 'object' },
        sobolIndices: { type: 'object' },
        morrisResults: { type: 'object' },
        factorRanking: { type: 'array' },
        interactions: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sensitivity', 'analysis', 'materials-science']
}));

export const documentUncertainty = defineTask('document-uncertainty', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Uncertainty Documentation',
  agent: {
    name: 'uncertainty-documentation-specialist',
    prompt: {
      role: 'Technical writer for uncertainty documentation',
      task: 'Generate comprehensive uncertainty documentation',
      context: args,
      instructions: [
        'Compile uncertainty analysis report per GUM format',
        'Document all uncertainty sources and estimates',
        'Present uncertainty budget in standard table',
        'Include sensitivity analysis results',
        'Document allowables calculation methodology',
        'Provide recommendations for uncertainty reduction',
        'Include traceability to standards and methods',
        'Format for technical review and audit'
      ],
      outputFormat: 'JSON with uncertainty documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'artifacts'],
      properties: {
        report: { type: 'object' },
        executiveSummary: { type: 'string' },
        sections: { type: 'array' },
        tables: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'reporting', 'materials-science']
}));
