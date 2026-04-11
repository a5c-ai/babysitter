/**
 * @process specializations/domains/science/aerospace-engineering/wind-tunnel-test-correlation
 * @description Process for correlating CFD predictions with wind tunnel test data, including data
 * normalization, uncertainty quantification, and model calibration.
 * @inputs { projectName: string, cfdData: object, windTunnelData: object, correlationParameters?: object }
 * @outputs { success: boolean, correlationMetrics: object, calibrationFactors: object, uncertaintyAnalysis: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/aerospace-engineering/wind-tunnel-test-correlation', {
 *   projectName: 'Wing-Body Correlation Study',
 *   cfdData: { source: 'cfd-results/wing-body.csv', format: 'csv' },
 *   windTunnelData: { source: 'wind-tunnel/run-2024-001.csv', format: 'csv' },
 *   correlationParameters: { machRange: [0.6, 0.9], aoaRange: [-4, 12] }
 * });
 *
 * @references
 * - AIAA CFD Validation Standards: https://www.aiaa.org/
 * - NASA Wind Tunnel Handbook: https://www.nasa.gov/
 * - AGARD CFD Validation Database: https://www.sto.nato.int/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    cfdData,
    windTunnelData,
    correlationParameters = {}
  } = inputs;

  // Phase 1: Data Import and Preprocessing
  const dataPreprocessing = await ctx.task(dataPreprocessingTask, {
    projectName,
    cfdData,
    windTunnelData
  });

  if (!dataPreprocessing.dataValid) {
    return {
      success: false,
      error: 'Data preprocessing failed',
      details: dataPreprocessing.issues
    };
  }

  // Phase 2: Test Condition Matching
  const conditionMatching = await ctx.task(conditionMatchingTask, {
    projectName,
    cfdConditions: dataPreprocessing.cfdConditions,
    tunnelConditions: dataPreprocessing.tunnelConditions,
    correlationParameters
  });

  // Breakpoint: Review matched conditions
  await ctx.breakpoint({
    question: `Review ${conditionMatching.matchedPoints} matched test conditions for ${projectName}. Proceed with correlation analysis?`,
    title: 'Test Condition Matching Review',
    context: {
      runId: ctx.runId,
      matchedConditions: conditionMatching.matchedConditions,
      unmatchedConditions: conditionMatching.unmatchedConditions
    }
  });

  // Phase 3: Wind Tunnel Corrections Application
  const tunnelCorrections = await ctx.task(tunnelCorrectionsTask, {
    projectName,
    tunnelData: dataPreprocessing.tunnelData,
    tunnelCharacteristics: windTunnelData.tunnelCharacteristics
  });

  // Phase 4: Uncertainty Quantification
  const uncertaintyAnalysis = await ctx.task(uncertaintyAnalysisTask, {
    projectName,
    cfdUncertainty: dataPreprocessing.cfdUncertainty,
    experimentalUncertainty: tunnelCorrections.correctedUncertainty,
    conditionMatching
  });

  // Phase 5: Statistical Correlation Analysis
  const correlationAnalysis = await ctx.task(correlationAnalysisTask, {
    projectName,
    cfdData: dataPreprocessing.cfdData,
    correctedTunnelData: tunnelCorrections.correctedData,
    uncertaintyAnalysis
  });

  // Quality Gate: Check correlation metrics
  if (correlationAnalysis.r2 < 0.9) {
    await ctx.breakpoint({
      question: `Correlation R-squared is ${correlationAnalysis.r2.toFixed(3)} (below 0.9 threshold). Review discrepancies and determine corrective actions?`,
      title: 'Correlation Quality Warning',
      context: {
        runId: ctx.runId,
        correlationMetrics: correlationAnalysis.metrics,
        outliers: correlationAnalysis.outliers,
        recommendation: 'Consider reviewing CFD model or wind tunnel corrections'
      }
    });
  }

  // Phase 6: Model Calibration
  const modelCalibration = await ctx.task(modelCalibrationTask, {
    projectName,
    correlationAnalysis,
    cfdData: dataPreprocessing.cfdData,
    tunnelData: tunnelCorrections.correctedData
  });

  // Phase 7: Validation Metrics Calculation
  const validationMetrics = await ctx.task(validationMetricsTask, {
    projectName,
    correlationAnalysis,
    modelCalibration,
    uncertaintyAnalysis
  });

  // Phase 8: Report Generation
  const reportGeneration = await ctx.task(correlationReportTask, {
    projectName,
    dataPreprocessing,
    conditionMatching,
    tunnelCorrections,
    uncertaintyAnalysis,
    correlationAnalysis,
    modelCalibration,
    validationMetrics
  });

  // Final Breakpoint: Results Approval
  await ctx.breakpoint({
    question: `Wind tunnel correlation complete for ${projectName}. Overall correlation R2: ${correlationAnalysis.r2.toFixed(3)}. Approve calibration factors?`,
    title: 'Correlation Results Approval',
    context: {
      runId: ctx.runId,
      summary: {
        correlationR2: correlationAnalysis.r2,
        calibrationFactors: modelCalibration.factors,
        validationStatus: validationMetrics.status
      },
      files: [
        { path: 'artifacts/correlation-report.json', format: 'json', content: reportGeneration },
        { path: 'artifacts/correlation-report.md', format: 'markdown', content: reportGeneration.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    correlationMetrics: correlationAnalysis.metrics,
    calibrationFactors: modelCalibration.factors,
    uncertaintyAnalysis: {
      combined: uncertaintyAnalysis.combinedUncertainty,
      cfd: uncertaintyAnalysis.cfdContribution,
      experimental: uncertaintyAnalysis.experimentalContribution
    },
    validationMetrics: validationMetrics,
    report: reportGeneration,
    metadata: {
      processId: 'specializations/domains/science/aerospace-engineering/wind-tunnel-test-correlation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const dataPreprocessingTask = defineTask('data-preprocessing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Preprocessing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aerospace Data Analyst specializing in test data processing',
      task: 'Preprocess CFD and wind tunnel data for correlation analysis',
      context: {
        projectName: args.projectName,
        cfdData: args.cfdData,
        windTunnelData: args.windTunnelData
      },
      instructions: [
        '1. Import CFD results and wind tunnel test data from specified sources',
        '2. Validate data formats and check for missing values',
        '3. Standardize units and coordinate systems between datasets',
        '4. Identify common test conditions (Mach, Reynolds, angle of attack)',
        '5. Extract aerodynamic coefficients and their uncertainties',
        '6. Flag outliers and suspicious data points',
        '7. Document data quality issues and applied corrections',
        '8. Compute reference quantities for coefficient normalization',
        '9. Create unified data structure for correlation analysis',
        '10. Generate data quality report and statistics'
      ],
      outputFormat: 'JSON object with preprocessed data and quality assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['dataValid', 'cfdData', 'tunnelData'],
      properties: {
        dataValid: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'string' } },
        cfdData: {
          type: 'object',
          properties: {
            points: { type: 'number' },
            variables: { type: 'array', items: { type: 'string' } },
            conditionRange: { type: 'object' }
          }
        },
        tunnelData: {
          type: 'object',
          properties: {
            points: { type: 'number' },
            variables: { type: 'array', items: { type: 'string' } },
            conditionRange: { type: 'object' }
          }
        },
        cfdConditions: { type: 'array', items: { type: 'object' } },
        tunnelConditions: { type: 'array', items: { type: 'object' } },
        cfdUncertainty: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['correlation', 'data-processing', 'aerospace']
}));

export const conditionMatchingTask = defineTask('condition-matching', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Condition Matching - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aerospace Test Engineer with expertise in experimental-computational comparison',
      task: 'Match CFD and wind tunnel test conditions for valid comparison',
      context: {
        projectName: args.projectName,
        cfdConditions: args.cfdConditions,
        tunnelConditions: args.tunnelConditions,
        correlationParameters: args.correlationParameters
      },
      instructions: [
        '1. Define tolerance bands for condition matching (Mach, Re, AoA)',
        '2. Identify exactly matched conditions between CFD and tunnel tests',
        '3. Identify conditions requiring interpolation',
        '4. Flag conditions with no corresponding match',
        '5. Assess Reynolds number effects and scaling considerations',
        '6. Document transition state (laminar/turbulent) at each condition',
        '7. Account for support interference and model deformation differences',
        '8. Create mapping table between CFD and tunnel data points',
        '9. Compute interpolated values where direct matching is not possible',
        '10. Generate matching statistics and coverage assessment'
      ],
      outputFormat: 'JSON object with matched conditions and mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['matchedPoints', 'matchedConditions'],
      properties: {
        matchedPoints: { type: 'number' },
        matchedConditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cfdIndex: { type: 'number' },
              tunnelIndex: { type: 'number' },
              mach: { type: 'number' },
              reynolds: { type: 'number' },
              aoa: { type: 'number' },
              matchQuality: { type: 'string' }
            }
          }
        },
        unmatchedConditions: {
          type: 'object',
          properties: {
            cfdOnly: { type: 'array', items: { type: 'object' } },
            tunnelOnly: { type: 'array', items: { type: 'object' } }
          }
        },
        interpolatedPoints: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['correlation', 'condition-matching', 'aerospace']
}));

export const tunnelCorrectionsTask = defineTask('tunnel-corrections', (args, taskCtx) => ({
  kind: 'agent',
  title: `Wind Tunnel Corrections - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Wind Tunnel Test Engineer with expertise in data corrections',
      task: 'Apply wind tunnel corrections to experimental data',
      context: {
        projectName: args.projectName,
        tunnelData: args.tunnelData,
        tunnelCharacteristics: args.tunnelCharacteristics
      },
      instructions: [
        '1. Calculate wall interference corrections (solid blockage, wake blockage)',
        '2. Apply streamline curvature corrections',
        '3. Correct for buoyancy effects',
        '4. Apply support tare and interference corrections',
        '5. Account for model deformation under aerodynamic loads',
        '6. Correct for flow angularity and non-uniformity',
        '7. Apply temperature and humidity corrections if applicable',
        '8. Document correction methods and magnitudes',
        '9. Propagate uncertainties through corrections',
        '10. Generate corrected dataset with uncertainty bounds'
      ],
      outputFormat: 'JSON object with corrected wind tunnel data'
    },
    outputSchema: {
      type: 'object',
      required: ['correctedData', 'correctionMagnitudes'],
      properties: {
        correctedData: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'object' },
              uncorrected: { type: 'object' },
              corrected: { type: 'object' }
            }
          }
        },
        correctionMagnitudes: {
          type: 'object',
          properties: {
            wallInterference: { type: 'object' },
            supportInterference: { type: 'object' },
            buoyancy: { type: 'object' },
            flowAngularity: { type: 'object' }
          }
        },
        correctedUncertainty: {
          type: 'object',
          properties: {
            CL: { type: 'number' },
            CD: { type: 'number' },
            CM: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['correlation', 'wind-tunnel', 'corrections', 'aerospace']
}));

export const uncertaintyAnalysisTask = defineTask('uncertainty-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Uncertainty Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Uncertainty Quantification Specialist for aerospace testing',
      task: 'Quantify uncertainties in CFD and experimental data',
      context: {
        projectName: args.projectName,
        cfdUncertainty: args.cfdUncertainty,
        experimentalUncertainty: args.experimentalUncertainty,
        conditionMatching: args.conditionMatching
      },
      instructions: [
        '1. Categorize CFD uncertainties (numerical, modeling, input)',
        '2. Categorize experimental uncertainties (random, systematic, calibration)',
        '3. Apply GUM (Guide to Uncertainty in Measurement) methodology',
        '4. Compute expanded uncertainties with confidence intervals',
        '5. Propagate uncertainties to derived quantities',
        '6. Assess correlation between uncertainty sources',
        '7. Compute combined standard uncertainty for each comparison point',
        '8. Determine coverage factors for stated confidence levels',
        '9. Create uncertainty budget breakdown',
        '10. Document assumptions and limitations'
      ],
      outputFormat: 'JSON object with comprehensive uncertainty analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['combinedUncertainty', 'cfdContribution', 'experimentalContribution'],
      properties: {
        combinedUncertainty: {
          type: 'object',
          properties: {
            CL: { type: 'number' },
            CD: { type: 'number' },
            CM: { type: 'number' },
            confidenceLevel: { type: 'number' }
          }
        },
        cfdContribution: {
          type: 'object',
          properties: {
            numerical: { type: 'number' },
            modeling: { type: 'number' },
            input: { type: 'number' },
            total: { type: 'number' }
          }
        },
        experimentalContribution: {
          type: 'object',
          properties: {
            random: { type: 'number' },
            systematic: { type: 'number' },
            calibration: { type: 'number' },
            total: { type: 'number' }
          }
        },
        uncertaintyBudget: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['correlation', 'uncertainty', 'analysis', 'aerospace']
}));

export const correlationAnalysisTask = defineTask('correlation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Correlation Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aerospace Data Scientist specializing in CFD-experimental correlation',
      task: 'Perform statistical correlation analysis between CFD and wind tunnel data',
      context: {
        projectName: args.projectName,
        cfdData: args.cfdData,
        correctedTunnelData: args.correctedTunnelData,
        uncertaintyAnalysis: args.uncertaintyAnalysis
      },
      instructions: [
        '1. Compute correlation coefficients (Pearson, Spearman) for each aerodynamic quantity',
        '2. Perform linear regression analysis and compute R-squared values',
        '3. Calculate bias (mean difference) and precision (standard deviation)',
        '4. Identify systematic trends and offsets',
        '5. Detect outliers using statistical methods (3-sigma, IQR)',
        '6. Assess correlation quality across different flow regimes',
        '7. Compute prediction intervals for CFD estimates',
        '8. Analyze residual patterns for modeling deficiencies',
        '9. Perform cross-validation analysis',
        '10. Generate correlation plots and statistical summary'
      ],
      outputFormat: 'JSON object with correlation analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['r2', 'metrics'],
      properties: {
        r2: { type: 'number' },
        metrics: {
          type: 'object',
          properties: {
            CL: { type: 'object', properties: { r2: { type: 'number' }, bias: { type: 'number' }, precision: { type: 'number' } } },
            CD: { type: 'object', properties: { r2: { type: 'number' }, bias: { type: 'number' }, precision: { type: 'number' } } },
            CM: { type: 'object', properties: { r2: { type: 'number' }, bias: { type: 'number' }, precision: { type: 'number' } } }
          }
        },
        outliers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              index: { type: 'number' },
              condition: { type: 'object' },
              deviation: { type: 'number' },
              possibleCause: { type: 'string' }
            }
          }
        },
        regressionCoefficients: { type: 'object' },
        predictionIntervals: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['correlation', 'statistical-analysis', 'aerospace']
}));

export const modelCalibrationTask = defineTask('model-calibration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Calibration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CFD Model Calibration Specialist',
      task: 'Develop calibration factors to improve CFD prediction accuracy',
      context: {
        projectName: args.projectName,
        correlationAnalysis: args.correlationAnalysis,
        cfdData: args.cfdData,
        tunnelData: args.tunnelData
      },
      instructions: [
        '1. Develop bias correction factors based on correlation analysis',
        '2. Create trend-based calibration functions (vs Mach, AoA, etc.)',
        '3. Apply regression-based correction models',
        '4. Validate calibration factors using cross-validation',
        '5. Assess calibration stability across operating envelope',
        '6. Document calibration methodology and assumptions',
        '7. Define applicability limits for calibration factors',
        '8. Compute improvement in prediction accuracy after calibration',
        '9. Generate calibration lookup tables or functions',
        '10. Provide recommendations for CFD model improvements'
      ],
      outputFormat: 'JSON object with calibration factors and validation'
    },
    outputSchema: {
      type: 'object',
      required: ['factors', 'improvement'],
      properties: {
        factors: {
          type: 'object',
          properties: {
            CL: { type: 'object', properties: { bias: { type: 'number' }, scale: { type: 'number' }, function: { type: 'string' } } },
            CD: { type: 'object', properties: { bias: { type: 'number' }, scale: { type: 'number' }, function: { type: 'string' } } },
            CM: { type: 'object', properties: { bias: { type: 'number' }, scale: { type: 'number' }, function: { type: 'string' } } }
          }
        },
        improvement: {
          type: 'object',
          properties: {
            r2Before: { type: 'number' },
            r2After: { type: 'number' },
            biasReduction: { type: 'number' },
            precisionImprovement: { type: 'number' }
          }
        },
        applicabilityLimits: {
          type: 'object',
          properties: {
            machRange: { type: 'array', items: { type: 'number' } },
            aoaRange: { type: 'array', items: { type: 'number' } },
            reynoldsRange: { type: 'array', items: { type: 'number' } }
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
  labels: ['correlation', 'calibration', 'aerospace']
}));

export const validationMetricsTask = defineTask('validation-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validation Metrics - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'V&V Specialist for aerospace computational methods',
      task: 'Compute validation metrics per AIAA standards',
      context: {
        projectName: args.projectName,
        correlationAnalysis: args.correlationAnalysis,
        modelCalibration: args.modelCalibration,
        uncertaintyAnalysis: args.uncertaintyAnalysis
      },
      instructions: [
        '1. Compute validation metric per AIAA G-077-1998 standard',
        '2. Calculate relative error statistics',
        '3. Assess prediction capability within uncertainty bounds',
        '4. Determine validation status for each aerodynamic quantity',
        '5. Compute Model Form Uncertainty (MFU)',
        '6. Assess validation completeness across operating envelope',
        '7. Compare with industry validation benchmarks',
        '8. Identify areas requiring additional validation',
        '9. Generate validation summary matrix',
        '10. Provide overall validation status and confidence'
      ],
      outputFormat: 'JSON object with validation metrics and status'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'metrics'],
      properties: {
        status: { type: 'string', enum: ['validated', 'conditionally-validated', 'not-validated'] },
        metrics: {
          type: 'object',
          properties: {
            validationMetricCL: { type: 'number' },
            validationMetricCD: { type: 'number' },
            validationMetricCM: { type: 'number' },
            modelFormUncertainty: { type: 'number' }
          }
        },
        statusByQuantity: {
          type: 'object',
          properties: {
            CL: { type: 'string' },
            CD: { type: 'string' },
            CM: { type: 'string' }
          }
        },
        validationCoverage: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['correlation', 'validation', 'metrics', 'aerospace']
}));

export const correlationReportTask = defineTask('correlation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Correlation Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aerospace Technical Writer specializing in V&V documentation',
      task: 'Generate comprehensive CFD-wind tunnel correlation report',
      context: {
        projectName: args.projectName,
        dataPreprocessing: args.dataPreprocessing,
        conditionMatching: args.conditionMatching,
        tunnelCorrections: args.tunnelCorrections,
        uncertaintyAnalysis: args.uncertaintyAnalysis,
        correlationAnalysis: args.correlationAnalysis,
        modelCalibration: args.modelCalibration,
        validationMetrics: args.validationMetrics
      },
      instructions: [
        '1. Create executive summary with key findings',
        '2. Document data sources and preprocessing steps',
        '3. Present condition matching methodology and results',
        '4. Detail wind tunnel corrections applied',
        '5. Present uncertainty analysis and budgets',
        '6. Show correlation results with plots and statistics',
        '7. Document calibration factors and their derivation',
        '8. Present validation metrics and status',
        '9. Include recommendations for CFD model improvements',
        '10. Generate both structured JSON and markdown formats'
      ],
      outputFormat: 'JSON object with complete correlation report'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'markdown'],
      properties: {
        report: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            dataDescription: { type: 'object' },
            methodology: { type: 'object' },
            results: { type: 'object' },
            conclusions: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['correlation', 'reporting', 'documentation', 'aerospace']
}));
