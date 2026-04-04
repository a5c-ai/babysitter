/**
 * @process specializations/domains/science/nanotechnology/statistical-particle-size-analysis
 * @description Statistical Particle Size Distribution Analysis - Perform statistically rigorous particle size
 * and morphology analysis from microscopy images including automated image segmentation, distribution fitting,
 * outlier detection, confidence interval calculation, and comparison against target specifications with
 * iterative sampling until statistical significance is achieved.
 * @inputs { imageData: object, targetSpecifications: object, statisticalRequirements?: object }
 * @outputs { success: boolean, sizeDistribution: object, statisticalAnalysis: object, complianceAssessment: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/nanotechnology/statistical-particle-size-analysis', {
 *   imageData: { source: 'TEM', imageCount: 50, resolution: '0.5nm/pixel' },
 *   targetSpecifications: { meanSize: 15, tolerance: 2, maxPDI: 0.2 },
 *   statisticalRequirements: { minParticleCount: 300, confidenceLevel: 0.95 }
 * });
 *
 * @references
 * - Dynamic Light Scattering for Nanoparticle Sizing: https://www.malvernpanalytical.com/en/products/technology/light-scattering/dynamic-light-scattering
 * - ImageJ/Fiji: https://imagej.net/software/fiji/
 * - ASTM E2456: Standard Terminology Relating to Nanotechnology: https://www.astm.org/e2456-06r20.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    imageData,
    targetSpecifications,
    statisticalRequirements = {},
    maxIterations = 10
  } = inputs;

  const {
    minParticleCount = 300,
    confidenceLevel = 0.95,
    maxAcceptableError = 0.05
  } = statisticalRequirements;

  // Phase 1: Image Quality Assessment
  const imageQuality = await ctx.task(imageQualityAssessmentTask, {
    imageData
  });

  // Quality Gate: Images must meet quality criteria
  if (!imageQuality.acceptable) {
    return {
      success: false,
      error: 'Image quality insufficient for reliable analysis',
      phase: 'image-quality',
      recommendations: imageQuality.recommendations
    };
  }

  // Phase 2: Segmentation Protocol Development
  const segmentationProtocol = await ctx.task(segmentationProtocolTask, {
    imageData,
    imageQuality
  });

  // Breakpoint: Review segmentation parameters
  await ctx.breakpoint({
    question: `Review segmentation protocol. Threshold method: ${segmentationProtocol.thresholdMethod}. Approve to proceed with analysis?`,
    title: 'Segmentation Protocol Review',
    context: {
      runId: ctx.runId,
      segmentationProtocol,
      sampleImages: segmentationProtocol.sampleResults,
      files: [{
        path: 'artifacts/segmentation-protocol.json',
        format: 'json',
        content: segmentationProtocol
      }]
    }
  });

  // Phase 3: Iterative Particle Analysis
  let iteration = 0;
  let totalParticleCount = 0;
  let statisticalSignificance = false;
  let currentError = 1.0;
  const analysisHistory = [];
  let aggregatedResults = null;

  while (iteration < maxIterations && (!statisticalSignificance || totalParticleCount < minParticleCount)) {
    iteration++;

    // Execute image segmentation
    const segmentationResults = await ctx.task(imageSegmentationTask, {
      imageData,
      segmentationProtocol,
      iteration,
      previousResults: iteration > 1 ? aggregatedResults : null
    });

    // Particle measurement
    const particleMeasurements = await ctx.task(particleMeasurementTask, {
      segmentationResults,
      imageData,
      measurementParameters: segmentationProtocol.measurementParameters
    });

    totalParticleCount += particleMeasurements.particleCount;

    // Aggregate results
    aggregatedResults = await ctx.task(resultsAggregationTask, {
      newMeasurements: particleMeasurements,
      previousAggregated: aggregatedResults,
      iteration
    });

    // Statistical assessment
    const statisticalAssessment = await ctx.task(statisticalAssessmentTask, {
      aggregatedResults,
      minParticleCount,
      confidenceLevel,
      maxAcceptableError
    });

    currentError = statisticalAssessment.standardError;
    statisticalSignificance = statisticalAssessment.significanceAchieved;

    analysisHistory.push({
      iteration,
      particleCount: particleMeasurements.particleCount,
      totalCount: totalParticleCount,
      currentMean: aggregatedResults.meanSize,
      currentStdDev: aggregatedResults.standardDeviation,
      standardError: currentError,
      significanceAchieved: statisticalSignificance
    });

    if (!statisticalSignificance && iteration < maxIterations) {
      await ctx.breakpoint({
        question: `Iteration ${iteration}: ${totalParticleCount} particles analyzed. SE=${currentError.toFixed(4)}. Continue sampling?`,
        title: 'Statistical Sampling Progress',
        context: {
          runId: ctx.runId,
          iteration,
          totalParticleCount,
          targetCount: minParticleCount,
          currentError,
          targetError: maxAcceptableError
        }
      });
    }
  }

  // Phase 4: Distribution Fitting
  const distributionFitting = await ctx.task(distributionFittingTask, {
    aggregatedResults,
    targetSpecifications
  });

  // Phase 5: Outlier Detection
  const outlierAnalysis = await ctx.task(outlierDetectionTask, {
    aggregatedResults,
    distributionFitting
  });

  // Phase 6: Morphology Analysis
  const morphologyAnalysis = await ctx.task(morphologyAnalysisTask, {
    aggregatedResults,
    targetSpecifications
  });

  // Phase 7: Specification Compliance
  const complianceAssessment = await ctx.task(complianceAssessmentTask, {
    aggregatedResults,
    distributionFitting,
    targetSpecifications,
    confidenceLevel
  });

  // Phase 8: Report Generation
  const statisticalReport = await ctx.task(reportGenerationTask, {
    aggregatedResults,
    distributionFitting,
    outlierAnalysis,
    morphologyAnalysis,
    complianceAssessment,
    analysisHistory,
    targetSpecifications
  });

  // Final Breakpoint: Results approval
  await ctx.breakpoint({
    question: `Analysis complete. ${totalParticleCount} particles measured. Mean: ${aggregatedResults.meanSize.toFixed(2)}nm, PDI: ${aggregatedResults.polydispersityIndex.toFixed(3)}. Specification ${complianceAssessment.compliant ? 'MET' : 'NOT MET'}. Approve?`,
    title: 'Statistical Analysis Results Approval',
    context: {
      runId: ctx.runId,
      totalParticleCount,
      sizeDistribution: aggregatedResults,
      compliance: complianceAssessment,
      files: [
        { path: 'artifacts/statistical-report.md', format: 'markdown', content: statisticalReport.markdown },
        { path: 'artifacts/size-data.json', format: 'json', content: aggregatedResults }
      ]
    }
  });

  return {
    success: true,
    sizeDistribution: {
      meanSize: aggregatedResults.meanSize,
      standardDeviation: aggregatedResults.standardDeviation,
      polydispersityIndex: aggregatedResults.polydispersityIndex,
      d10: aggregatedResults.d10,
      d50: aggregatedResults.d50,
      d90: aggregatedResults.d90,
      particleCount: totalParticleCount
    },
    statisticalAnalysis: {
      confidenceInterval: aggregatedResults.confidenceInterval,
      standardError: currentError,
      distributionFit: distributionFitting,
      outlierAnalysis,
      iterationsRequired: iteration
    },
    morphologyAnalysis,
    complianceAssessment,
    report: statisticalReport,
    metadata: {
      processId: 'specializations/domains/science/nanotechnology/statistical-particle-size-analysis',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const imageQualityAssessmentTask = defineTask('image-quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess image quality for particle analysis',
  agent: {
    name: 'image-analyst',
    prompt: {
      role: 'Microscopy Image Quality Analyst',
      task: 'Assess image quality and suitability for quantitative particle analysis',
      context: args,
      instructions: [
        '1. Evaluate image resolution and pixel size calibration',
        '2. Assess contrast and signal-to-noise ratio',
        '3. Check for imaging artifacts (astigmatism, drift, charging)',
        '4. Evaluate focus quality across image field',
        '5. Assess particle visibility and edge definition',
        '6. Check for sample preparation artifacts',
        '7. Evaluate image consistency across the dataset',
        '8. Verify magnification calibration',
        '9. Identify any problematic images for exclusion',
        '10. Provide recommendations for image improvement'
      ],
      outputFormat: 'JSON object with image quality assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['acceptable', 'qualityMetrics'],
      properties: {
        acceptable: { type: 'boolean' },
        qualityMetrics: {
          type: 'object',
          properties: {
            resolution: { type: 'number' },
            contrast: { type: 'number' },
            snr: { type: 'number' },
            focusQuality: { type: 'number' }
          }
        },
        artifacts: { type: 'array', items: { type: 'string' } },
        excludedImages: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'image-analysis', 'quality']
}));

export const segmentationProtocolTask = defineTask('segmentation-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop image segmentation protocol',
  agent: {
    name: 'image-processing-specialist',
    prompt: {
      role: 'Image Processing Specialist for Nanoparticle Analysis',
      task: 'Develop optimal segmentation protocol for particle detection',
      context: args,
      instructions: [
        '1. Select appropriate thresholding method (Otsu, adaptive, etc.)',
        '2. Define preprocessing steps (filtering, background subtraction)',
        '3. Optimize watershed parameters for touching particles',
        '4. Define particle selection criteria (size range, circularity)',
        '5. Establish edge particle handling strategy',
        '6. Define aggregation detection criteria',
        '7. Set up measurement parameters (area, perimeter, Feret diameter)',
        '8. Validate protocol on representative images',
        '9. Document reproducibility of segmentation',
        '10. Create protocol for different particle morphologies'
      ],
      outputFormat: 'JSON object with segmentation protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['thresholdMethod', 'preprocessingSteps', 'measurementParameters'],
      properties: {
        thresholdMethod: { type: 'string' },
        thresholdValue: { type: 'number' },
        preprocessingSteps: { type: 'array' },
        watershedParameters: { type: 'object' },
        particleSelectionCriteria: { type: 'object' },
        measurementParameters: { type: 'array' },
        sampleResults: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'image-analysis', 'segmentation']
}));

export const imageSegmentationTask = defineTask('image-segmentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute image segmentation (iteration ${args.iteration})`,
  agent: {
    name: 'image-processor',
    prompt: {
      role: 'Automated Image Processing Specialist',
      task: 'Execute particle segmentation on microscopy images',
      context: args,
      instructions: [
        '1. Apply preprocessing steps from protocol',
        '2. Execute thresholding for particle detection',
        '3. Apply morphological operations for cleanup',
        '4. Execute watershed for touching particle separation',
        '5. Apply particle selection criteria',
        '6. Handle edge particles appropriately',
        '7. Flag potential aggregates for review',
        '8. Generate particle masks and labels',
        '9. Document any segmentation issues',
        '10. Calculate segmentation quality metrics'
      ],
      outputFormat: 'JSON object with segmentation results'
    },
    outputSchema: {
      type: 'object',
      required: ['particleCount', 'segmentedParticles', 'qualityMetrics'],
      properties: {
        particleCount: { type: 'number' },
        segmentedParticles: { type: 'array' },
        edgeParticles: { type: 'number' },
        potentialAggregates: { type: 'number' },
        qualityMetrics: { type: 'object' },
        issues: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'image-analysis', 'segmentation', `iteration-${args.iteration}`]
}));

export const particleMeasurementTask = defineTask('particle-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Measure particle properties',
  agent: {
    name: 'morphometry-specialist',
    prompt: {
      role: 'Particle Morphometry Specialist',
      task: 'Measure size and shape properties of segmented particles',
      context: args,
      instructions: [
        '1. Calculate particle area and equivalent diameter',
        '2. Measure perimeter and calculate circularity',
        '3. Calculate Feret diameters (min, max)',
        '4. Determine aspect ratio and elongation',
        '5. Calculate solidity and convexity',
        '6. Measure centroid positions',
        '7. Apply calibration for physical units',
        '8. Flag particles with unusual properties',
        '9. Document measurement precision',
        '10. Calculate summary statistics for batch'
      ],
      outputFormat: 'JSON object with particle measurements'
    },
    outputSchema: {
      type: 'object',
      required: ['particleCount', 'measurements'],
      properties: {
        particleCount: { type: 'number' },
        measurements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              area: { type: 'number' },
              diameter: { type: 'number' },
              perimeter: { type: 'number' },
              circularity: { type: 'number' },
              aspectRatio: { type: 'number' }
            }
          }
        },
        batchStatistics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'image-analysis', 'measurement']
}));

export const resultsAggregationTask = defineTask('results-aggregation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Aggregate particle measurements',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'Statistical Data Analyst',
      task: 'Aggregate particle measurements from multiple iterations',
      context: args,
      instructions: [
        '1. Combine measurements from all iterations',
        '2. Calculate cumulative statistics',
        '3. Update running mean and standard deviation',
        '4. Calculate polydispersity index',
        '5. Update percentile values (D10, D50, D90)',
        '6. Track measurement consistency across iterations',
        '7. Identify trends in the data',
        '8. Update confidence intervals',
        '9. Calculate coefficient of variation',
        '10. Document data quality metrics'
      ],
      outputFormat: 'JSON object with aggregated results'
    },
    outputSchema: {
      type: 'object',
      required: ['meanSize', 'standardDeviation', 'totalParticleCount'],
      properties: {
        meanSize: { type: 'number' },
        standardDeviation: { type: 'number' },
        totalParticleCount: { type: 'number' },
        polydispersityIndex: { type: 'number' },
        d10: { type: 'number' },
        d50: { type: 'number' },
        d90: { type: 'number' },
        confidenceInterval: { type: 'object' },
        coefficientOfVariation: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'statistics', 'aggregation']
}));

export const statisticalAssessmentTask = defineTask('statistical-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess statistical significance',
  agent: {
    name: 'statistician',
    prompt: {
      role: 'Biostatistician',
      task: 'Assess statistical significance and sampling adequacy',
      context: args,
      instructions: [
        '1. Calculate standard error of the mean',
        '2. Assess sample size adequacy',
        '3. Check for normality of distribution',
        '4. Calculate confidence intervals',
        '5. Perform power analysis for sample size',
        '6. Assess convergence of statistics',
        '7. Evaluate precision of percentile estimates',
        '8. Check for sampling bias',
        '9. Determine if significance criteria met',
        '10. Recommend additional sampling if needed'
      ],
      outputFormat: 'JSON object with statistical assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['significanceAchieved', 'standardError', 'sampleSizeAdequate'],
      properties: {
        significanceAchieved: { type: 'boolean' },
        standardError: { type: 'number' },
        sampleSizeAdequate: { type: 'boolean' },
        confidenceIntervalWidth: { type: 'number' },
        powerAnalysis: { type: 'object' },
        normalityTest: { type: 'object' },
        recommendedAdditionalSamples: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'statistics', 'significance']
}));

export const distributionFittingTask = defineTask('distribution-fitting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fit size distribution models',
  agent: {
    name: 'distribution-analyst',
    prompt: {
      role: 'Distribution Modeling Specialist',
      task: 'Fit statistical distributions to particle size data',
      context: args,
      instructions: [
        '1. Test fit to normal distribution',
        '2. Test fit to log-normal distribution',
        '3. Test fit to Weibull distribution',
        '4. Calculate goodness-of-fit metrics (R-squared, AIC, BIC)',
        '5. Identify best-fitting distribution',
        '6. Extract distribution parameters',
        '7. Check for multimodality',
        '8. Calculate theoretical percentiles from fit',
        '9. Compare empirical and theoretical distributions',
        '10. Document distribution characteristics'
      ],
      outputFormat: 'JSON object with distribution fitting results'
    },
    outputSchema: {
      type: 'object',
      required: ['bestFit', 'fitParameters', 'goodnessOfFit'],
      properties: {
        bestFit: { type: 'string' },
        fitParameters: { type: 'object' },
        goodnessOfFit: { type: 'object' },
        distributionComparison: { type: 'array' },
        multimodal: { type: 'boolean' },
        theoreticalPercentiles: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'statistics', 'distribution']
}));

export const outlierDetectionTask = defineTask('outlier-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect and analyze outliers',
  agent: {
    name: 'outlier-analyst',
    prompt: {
      role: 'Statistical Outlier Analysis Specialist',
      task: 'Detect and characterize outliers in particle size data',
      context: args,
      instructions: [
        '1. Apply multiple outlier detection methods',
        '2. Use IQR method for outlier identification',
        '3. Apply Grubbs test for single outliers',
        '4. Use Dixon Q-test for small samples',
        '5. Characterize outliers (aggregates, artifacts, real outliers)',
        '6. Assess impact of outliers on statistics',
        '7. Document outlier handling decision',
        '8. Calculate statistics with and without outliers',
        '9. Provide recommendations for outlier treatment',
        '10. Document outlier sources and prevention'
      ],
      outputFormat: 'JSON object with outlier analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['outlierCount', 'outlierIdentification', 'impact'],
      properties: {
        outlierCount: { type: 'number' },
        outlierIdentification: { type: 'array' },
        outlierTypes: { type: 'object' },
        impact: {
          type: 'object',
          properties: {
            meanDifference: { type: 'number' },
            stdDevDifference: { type: 'number' }
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
  labels: ['nanotechnology', 'statistics', 'outliers']
}));

export const morphologyAnalysisTask = defineTask('morphology-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze particle morphology',
  agent: {
    name: 'morphology-expert',
    prompt: {
      role: 'Particle Morphology Expert',
      task: 'Analyze shape and morphology characteristics of particles',
      context: args,
      instructions: [
        '1. Classify particle shapes (spherical, rod, plate, irregular)',
        '2. Calculate shape distribution statistics',
        '3. Analyze circularity and roundness distributions',
        '4. Assess aspect ratio distribution',
        '5. Identify shape subpopulations',
        '6. Correlate shape with size',
        '7. Compare with target morphology specifications',
        '8. Identify morphological defects',
        '9. Document shape uniformity',
        '10. Provide recommendations for shape control'
      ],
      outputFormat: 'JSON object with morphology analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['dominantShape', 'shapeDistribution', 'shapeMetrics'],
      properties: {
        dominantShape: { type: 'string' },
        shapeDistribution: { type: 'object' },
        shapeMetrics: {
          type: 'object',
          properties: {
            meanCircularity: { type: 'number' },
            meanAspectRatio: { type: 'number' },
            circularityStdDev: { type: 'number' }
          }
        },
        shapeCorrelations: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'image-analysis', 'morphology']
}));

export const complianceAssessmentTask = defineTask('compliance-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess specification compliance',
  agent: {
    name: 'quality-analyst',
    prompt: {
      role: 'Quality Compliance Analyst',
      task: 'Assess compliance with target size specifications',
      context: args,
      instructions: [
        '1. Compare mean size to target with tolerance',
        '2. Assess polydispersity against specification',
        '3. Evaluate D10, D50, D90 against limits',
        '4. Calculate process capability indices (Cp, Cpk)',
        '5. Determine out-of-spec fraction',
        '6. Calculate probability of meeting specs',
        '7. Assess shape compliance if specified',
        '8. Document all compliance criteria results',
        '9. Provide overall compliance determination',
        '10. Recommend actions for non-compliance'
      ],
      outputFormat: 'JSON object with compliance assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['compliant', 'complianceDetails', 'processCapability'],
      properties: {
        compliant: { type: 'boolean' },
        complianceDetails: { type: 'array', items: { type: 'object' } },
        processCapability: {
          type: 'object',
          properties: {
            cp: { type: 'number' },
            cpk: { type: 'number' }
          }
        },
        outOfSpecFraction: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'quality', 'compliance']
}));

export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate statistical analysis report',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Generate comprehensive particle size analysis report',
      context: args,
      instructions: [
        '1. Create executive summary of findings',
        '2. Document analysis methodology and parameters',
        '3. Present size distribution results with statistics',
        '4. Include distribution plots and histograms',
        '5. Document outlier analysis and treatment',
        '6. Present morphology analysis results',
        '7. Detail compliance assessment results',
        '8. Include analysis history and convergence',
        '9. Provide recommendations',
        '10. Create data tables and appendices'
      ],
      outputFormat: 'JSON object with report'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'summaryStatistics', 'dataTables'],
      properties: {
        markdown: { type: 'string' },
        summaryStatistics: { type: 'object' },
        dataTables: { type: 'array' },
        figures: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'reporting', 'statistics']
}));
