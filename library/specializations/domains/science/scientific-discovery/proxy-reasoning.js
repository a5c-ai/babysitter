/**
 * @process scientific-discovery/proxy-reasoning
 * @description Infer past environmental conditions from indirect proxy measurements, understanding proxy-climate relationships and uncertainty
 * @inputs { proxyData: object, targetVariable: string, calibration: object, timeRange: object, outputDir: string }
 * @outputs { success: boolean, reconstruction: object, proxyInterpretation: object, uncertaintyAssessment: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    proxyData = {},
    targetVariable = '', // temperature, precipitation, salinity, etc.
    calibration = {},
    timeRange = {},
    outputDir = 'proxy-reasoning-output',
    targetConfidence = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Proxy Reasoning Process');

  // ============================================================================
  // PHASE 1: PROXY CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Characterizing proxy system');
  const proxyCharacterization = await ctx.task(proxyCharacterizationTask, {
    proxyData,
    targetVariable,
    outputDir
  });

  artifacts.push(...proxyCharacterization.artifacts);

  // ============================================================================
  // PHASE 2: MECHANISTIC UNDERSTANDING
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing proxy-environment mechanism');
  const mechanisticAnalysis = await ctx.task(mechanisticUnderstandingTask, {
    proxy: proxyCharacterization.proxy,
    targetVariable,
    outputDir
  });

  artifacts.push(...mechanisticAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: CALIBRATION ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Assessing calibration');
  const calibrationAssessment = await ctx.task(calibrationAssessmentTask, {
    proxy: proxyCharacterization.proxy,
    calibration,
    mechanism: mechanisticAnalysis.mechanism,
    outputDir
  });

  artifacts.push(...calibrationAssessment.artifacts);

  // ============================================================================
  // PHASE 4: CONFOUNDING FACTORS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing confounding factors');
  const confoundingAnalysis = await ctx.task(confoundingFactorsTask, {
    proxy: proxyCharacterization.proxy,
    targetVariable,
    mechanism: mechanisticAnalysis.mechanism,
    outputDir
  });

  artifacts.push(...confoundingAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: TEMPORAL RESOLUTION ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing temporal resolution and fidelity');
  const temporalAssessment = await ctx.task(temporalResolutionTask, {
    proxyData,
    timeRange,
    proxy: proxyCharacterization.proxy,
    outputDir
  });

  artifacts.push(...temporalAssessment.artifacts);

  // ============================================================================
  // PHASE 6: RECONSTRUCTION APPLICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Applying proxy to reconstruct past conditions');
  const reconstruction = await ctx.task(reconstructionApplicationTask, {
    proxyData,
    calibration: calibrationAssessment.calibration,
    confoundingFactors: confoundingAnalysis.factors,
    temporalResolution: temporalAssessment.resolution,
    outputDir
  });

  artifacts.push(...reconstruction.artifacts);

  // ============================================================================
  // PHASE 7: UNCERTAINTY QUANTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Quantifying reconstruction uncertainty');
  const uncertaintyQuantification = await ctx.task(uncertaintyQuantificationTask, {
    reconstruction: reconstruction.values,
    calibrationAssessment,
    confoundingAnalysis,
    temporalAssessment,
    outputDir
  });

  artifacts.push(...uncertaintyQuantification.artifacts);

  // ============================================================================
  // PHASE 8: VALIDATION AND SYNTHESIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating and synthesizing reconstruction');
  const synthesis = await ctx.task(proxySynthesisTask, {
    proxyCharacterization,
    mechanisticAnalysis,
    calibrationAssessment,
    confoundingAnalysis,
    temporalAssessment,
    reconstruction,
    uncertaintyQuantification,
    targetConfidence,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  const confidenceMet = synthesis.confidenceScore >= targetConfidence;

  // Breakpoint: Review proxy reconstruction
  await ctx.breakpoint({
    question: `Proxy reconstruction complete. Confidence: ${synthesis.confidenceScore}/${targetConfidence}. ${confidenceMet ? 'Confidence target met!' : 'Additional validation may be needed.'} Review reconstruction?`,
    title: 'Proxy Reasoning Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        proxyType: proxyCharacterization.proxy.type,
        targetVariable,
        reconstructionRange: reconstruction.range,
        uncertaintyRange: uncertaintyQuantification.totalUncertainty,
        confoundingFactors: confoundingAnalysis.factors.length,
        confidenceScore: synthesis.confidenceScore,
        confidenceMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    targetVariable,
    reconstruction: {
      values: reconstruction.values,
      range: reconstruction.range,
      timeSeries: reconstruction.timeSeries
    },
    proxyInterpretation: {
      proxy: proxyCharacterization.proxy,
      mechanism: mechanisticAnalysis.mechanism,
      calibration: calibrationAssessment.calibration
    },
    uncertaintyAssessment: {
      total: uncertaintyQuantification.totalUncertainty,
      components: uncertaintyQuantification.components,
      confounders: confoundingAnalysis.factors
    },
    validation: synthesis.validation,
    confidenceScore: synthesis.confidenceScore,
    confidenceMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/proxy-reasoning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Proxy Characterization
export const proxyCharacterizationTask = defineTask('proxy-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize proxy system',
  agent: {
    name: 'proxy-specialist',
    prompt: {
      role: 'paleoclimatologist and proxy specialist',
      task: 'Characterize the proxy system and its properties',
      context: args,
      instructions: [
        'Identify the proxy type:',
        '  - Ice cores (isotopes, gases, dust)',
        '  - Tree rings (width, density, isotopes)',
        '  - Sediment cores (composition, microfossils)',
        '  - Corals (isotopes, growth bands)',
        '  - Speleothems (isotopes, growth layers)',
        '  - Historical documents',
        'Describe the proxy archive:',
        '  - Physical characteristics',
        '  - Preservation context',
        '  - Sampling resolution',
        'Identify what environmental variable(s) it records',
        'Document known strengths and limitations',
        'Assess data quality and measurement precision',
        'Save characterization to output directory'
      ],
      outputFormat: 'JSON with proxy (type, archive, recordedVariables, strengths, limitations, dataQuality), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['proxy', 'artifacts'],
      properties: {
        proxy: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            archive: { type: 'object' },
            recordedVariables: { type: 'array', items: { type: 'string' } },
            samplingResolution: { type: 'string' },
            strengths: { type: 'array', items: { type: 'string' } },
            limitations: { type: 'array', items: { type: 'string' } },
            dataQuality: { type: 'object' }
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
  labels: ['agent', 'proxy-reasoning', 'characterization']
}));

// Task 2: Mechanistic Understanding
export const mechanisticUnderstandingTask = defineTask('mechanistic-understanding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze proxy-environment mechanism',
  agent: {
    name: 'mechanistic-analyst',
    prompt: {
      role: 'geochemist and proxy mechanist',
      task: 'Understand the mechanism linking proxy to environmental variable',
      context: args,
      instructions: [
        'Describe the physical/chemical/biological mechanism:',
        '  - How does the environment signal get recorded?',
        '  - What processes control proxy formation?',
        '  - What is the signal transfer function?',
        'Identify mediating factors:',
        '  - Fractionation processes',
        '  - Growth rate effects',
        '  - Seasonal biases',
        '  - Diagenetic alteration',
        'Assess mechanism understanding:',
        '  - Well-understood vs. empirical?',
        '  - Linear vs. non-linear response?',
        '  - Threshold behaviors?',
        'Document mechanism assumptions',
        'Identify where mechanism may break down',
        'Save mechanistic analysis to output directory'
      ],
      outputFormat: 'JSON with mechanism (description, transferFunction, mediatingFactors, linearity, thresholds), assumptions, breakdownConditions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanism', 'assumptions', 'artifacts'],
      properties: {
        mechanism: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            transferFunction: { type: 'object' },
            mediatingFactors: { type: 'array', items: { type: 'string' } },
            linearity: { type: 'string', enum: ['linear', 'weakly-nonlinear', 'strongly-nonlinear', 'threshold'] },
            thresholds: { type: 'array', items: { type: 'object' } }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        breakdownConditions: { type: 'array', items: { type: 'string' } },
        mechanismQuality: { type: 'string', enum: ['well-understood', 'partially-understood', 'empirical'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'proxy-reasoning', 'mechanism']
}));

// Task 3: Calibration Assessment
export const calibrationAssessmentTask = defineTask('calibration-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess calibration',
  agent: {
    name: 'calibration-specialist',
    prompt: {
      role: 'proxy calibration specialist',
      task: 'Assess the quality and applicability of proxy calibration',
      context: args,
      instructions: [
        'Review calibration approach:',
        '  - Modern observational calibration?',
        '  - Laboratory calibration?',
        '  - Theoretical calibration?',
        'Assess calibration quality:',
        '  - Sample size and geographic coverage',
        '  - Measurement precision',
        '  - Regression statistics (R², RMSE)',
        '  - Validation against independent data',
        'Evaluate calibration applicability:',
        '  - Does calibration span reconstructed range?',
        '  - Are conditions analogous to past?',
        '  - Are there no-analogue situations?',
        'Identify calibration uncertainties',
        'Recommend calibration improvements',
        'Save calibration assessment to output directory'
      ],
      outputFormat: 'JSON with calibration (approach, equation, statistics, applicability), uncertainties, noAnalogueRisk, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['calibration', 'uncertainties', 'artifacts'],
      properties: {
        calibration: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            equation: { type: 'string' },
            statistics: {
              type: 'object',
              properties: {
                r2: { type: 'number' },
                rmse: { type: 'number' },
                sampleSize: { type: 'number' }
              }
            },
            validRange: { type: 'object' },
            applicability: { type: 'string' }
          }
        },
        uncertainties: {
          type: 'object',
          properties: {
            systematic: { type: 'number' },
            random: { type: 'number' },
            structural: { type: 'string' }
          }
        },
        noAnalogueRisk: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'proxy-reasoning', 'calibration']
}));

// Task 4: Confounding Factors Analysis
export const confoundingFactorsTask = defineTask('confounding-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze confounding factors',
  agent: {
    name: 'confounding-analyst',
    prompt: {
      role: 'paleoclimate scientist specializing in signal extraction',
      task: 'Identify and analyze factors that confound the proxy signal',
      context: args,
      instructions: [
        'Identify non-target environmental influences:',
        '  - Multiple climate variables affecting proxy',
        '  - Non-climatic influences (biology, chemistry)',
        '  - Local vs. regional signals',
        'Assess diagenetic and preservation effects:',
        '  - Post-depositional alteration',
        '  - Selective preservation',
        '  - Bioturbation, compaction',
        'Evaluate dating uncertainties:',
        '  - Chronological precision',
        '  - Correlation uncertainties',
        'Identify proxy-specific biases:',
        '  - Seasonal bias',
        '  - Growth rate effects',
        '  - Threshold effects',
        'Quantify confounding effects where possible',
        'Recommend mitigation strategies',
        'Save confounding analysis to output directory'
      ],
      outputFormat: 'JSON with factors (array with name, type, magnitude, mitigation), diageneticEffects, datingUncertainty, biases, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['factors', 'diageneticEffects', 'artifacts'],
      properties: {
        factors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['environmental', 'diagenetic', 'biological', 'analytical'] },
              magnitude: { type: 'string' },
              direction: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        diageneticEffects: { type: 'object' },
        datingUncertainty: { type: 'object' },
        biases: {
          type: 'object',
          properties: {
            seasonal: { type: 'string' },
            growthRate: { type: 'string' },
            threshold: { type: 'string' }
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
  labels: ['agent', 'proxy-reasoning', 'confounding']
}));

// Task 5: Temporal Resolution Assessment
export const temporalResolutionTask = defineTask('temporal-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess temporal resolution and fidelity',
  agent: {
    name: 'temporal-resolution-analyst',
    prompt: {
      role: 'paleoclimate scientist specializing in proxy temporal analysis',
      task: 'Assess the temporal resolution and signal fidelity of the proxy',
      context: args,
      instructions: [
        'Determine sampling resolution:',
        '  - Annual, decadal, centennial, millennial?',
        '  - Is resolution constant or variable?',
        'Assess signal smoothing:',
        '  - Bioturbation mixing depth',
        '  - Archive response time',
        '  - Analytical averaging',
        'Evaluate dating precision:',
        '  - Dating method and uncertainty',
        '  - Age model construction',
        '  - Tie points and interpolation',
        'Determine what temporal frequencies are resolvable',
        'Identify aliasing risks',
        'Compare temporal resolution to climate variability scales',
        'Save temporal assessment to output directory'
      ],
      outputFormat: 'JSON with resolution (sampling, effective, dating), smoothingEffects, resolvableFrequencies, aliasingRisks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['resolution', 'smoothingEffects', 'artifacts'],
      properties: {
        resolution: {
          type: 'object',
          properties: {
            sampling: { type: 'string' },
            effective: { type: 'string' },
            datingUncertainty: { type: 'string' },
            variability: { type: 'string' }
          }
        },
        smoothingEffects: {
          type: 'object',
          properties: {
            sources: { type: 'array', items: { type: 'string' } },
            magnitude: { type: 'string' }
          }
        },
        resolvableFrequencies: { type: 'array', items: { type: 'string' } },
        aliasingRisks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'proxy-reasoning', 'temporal-resolution']
}));

// Task 6: Reconstruction Application
export const reconstructionApplicationTask = defineTask('reconstruction-application', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply proxy to reconstruct past conditions',
  agent: {
    name: 'reconstruction-specialist',
    prompt: {
      role: 'paleoclimate reconstruction specialist',
      task: 'Apply calibration to reconstruct past environmental conditions',
      context: args,
      instructions: [
        'Apply calibration equation to proxy data',
        'Account for confounding factors where possible',
        'Generate time series of reconstructed values',
        'Identify key features:',
        '  - Mean state and variability',
        '  - Trends and cycles',
        '  - Extreme events',
        '  - Transitions and thresholds',
        'Flag values outside calibration range',
        'Compare to known climate events',
        'Generate summary statistics',
        'Save reconstruction to output directory'
      ],
      outputFormat: 'JSON with values, timeSeries, range, features, outsideCalibration, statistics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['values', 'timeSeries', 'range', 'artifacts'],
      properties: {
        values: { type: 'object' },
        timeSeries: { type: 'array', items: { type: 'object' } },
        range: {
          type: 'object',
          properties: {
            min: { type: 'number' },
            max: { type: 'number' },
            mean: { type: 'number' }
          }
        },
        features: {
          type: 'object',
          properties: {
            trends: { type: 'array', items: { type: 'object' } },
            cycles: { type: 'array', items: { type: 'object' } },
            extremes: { type: 'array', items: { type: 'object' } }
          }
        },
        outsideCalibration: { type: 'array', items: { type: 'object' } },
        statistics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'proxy-reasoning', 'reconstruction']
}));

// Task 7: Uncertainty Quantification
export const uncertaintyQuantificationTask = defineTask('uncertainty-quantification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantify reconstruction uncertainty',
  agent: {
    name: 'uncertainty-quantifier',
    prompt: {
      role: 'statistical paleoclimatologist',
      task: 'Quantify all sources of uncertainty in the reconstruction',
      context: args,
      instructions: [
        'Quantify uncertainty components:',
        '  - Analytical/measurement uncertainty',
        '  - Calibration uncertainty (regression uncertainty)',
        '  - Confounding factor uncertainty',
        '  - Chronological uncertainty',
        '  - Archive-specific uncertainty',
        'Propagate uncertainties through reconstruction',
        'Generate confidence intervals for reconstructed values',
        'Identify which uncertainty dominates',
        'Assess how uncertainty varies through time',
        'Compare to instrumental period if overlapping',
        'Document irreducible vs. reducible uncertainty',
        'Save uncertainty analysis to output directory'
      ],
      outputFormat: 'JSON with totalUncertainty, components (array), confidenceIntervals, dominantSource, temporalVariation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalUncertainty', 'components', 'artifacts'],
      properties: {
        totalUncertainty: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            unit: { type: 'string' },
            type: { type: 'string' }
          }
        },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              magnitude: { type: 'number' },
              percentage: { type: 'number' },
              reducible: { type: 'boolean' }
            }
          }
        },
        confidenceIntervals: { type: 'object' },
        dominantSource: { type: 'string' },
        temporalVariation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'proxy-reasoning', 'uncertainty']
}));

// Task 8: Proxy Synthesis
export const proxySynthesisTask = defineTask('proxy-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate and synthesize reconstruction',
  agent: {
    name: 'proxy-synthesis-specialist',
    prompt: {
      role: 'senior paleoclimatologist',
      task: 'Synthesize and validate proxy reconstruction',
      context: args,
      instructions: [
        'Integrate all analyses into final reconstruction assessment',
        'Validate reconstruction:',
        '  - Consistency with other proxies',
        '  - Agreement with known climate events',
        '  - Physical plausibility',
        '  - Instrumental period comparison (if available)',
        'Assess confidence (0-100):',
        '  - Mechanistic understanding',
        '  - Calibration quality',
        '  - Confounding factors addressed',
        '  - Uncertainty quantified',
        '  - Validation performed',
        'Summarize key findings',
        'Identify remaining questions',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with validation, confidenceScore, keyFindings, remainingQuestions, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validation', 'confidenceScore', 'artifacts'],
      properties: {
        validation: {
          type: 'object',
          properties: {
            otherProxies: { type: 'string' },
            knownEvents: { type: 'string' },
            physicalPlausibility: { type: 'string' },
            instrumentalComparison: { type: 'string' }
          }
        },
        confidenceScore: { type: 'number', minimum: 0, maximum: 100 },
        keyFindings: { type: 'array', items: { type: 'string' } },
        remainingQuestions: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'proxy-reasoning', 'synthesis']
}));
