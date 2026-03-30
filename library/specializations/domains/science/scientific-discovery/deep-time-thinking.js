/**
 * @process scientific-discovery/deep-time-thinking
 * @description Reason over very long geological and cosmological timescales, understanding how processes cumulate and interact over millions to billions of years
 * @inputs { phenomenon: string, timeScale: object, constraints: object, outputDir: string }
 * @outputs { success: boolean, deepTimeAnalysis: object, cumulativeEffects: array, temporalConstraints: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    phenomenon = '',
    timeScale = {},
    constraints = {},
    outputDir = 'deep-time-output',
    targetRigor = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Deep Time Thinking Process');

  // ============================================================================
  // PHASE 1: TEMPORAL SCALE COMPREHENSION
  // ============================================================================

  ctx.log('info', 'Phase 1: Comprehending temporal scales');
  const temporalComprehension = await ctx.task(temporalScaleComprehensionTask, {
    timeScale,
    phenomenon,
    outputDir
  });

  artifacts.push(...temporalComprehension.artifacts);

  // ============================================================================
  // PHASE 2: PROCESS RATE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing process rates at different scales');
  const rateAnalysis = await ctx.task(processRateAnalysisTask, {
    phenomenon,
    timeScale,
    temporalComprehension,
    outputDir
  });

  artifacts.push(...rateAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: CUMULATIVE EFFECTS PROJECTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Projecting cumulative effects over deep time');
  const cumulativeProjection = await ctx.task(cumulativeEffectsProjectionTask, {
    phenomenon,
    rates: rateAnalysis.rates,
    timeScale,
    outputDir
  });

  artifacts.push(...cumulativeProjection.artifacts);

  // ============================================================================
  // PHASE 4: NON-LINEAR DYNAMICS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing non-linear dynamics');
  const nonLinearAssessment = await ctx.task(nonLinearDynamicsTask, {
    phenomenon,
    cumulativeProjection,
    timeScale,
    outputDir
  });

  artifacts.push(...nonLinearAssessment.artifacts);

  // ============================================================================
  // PHASE 5: TEMPORAL CONSTRAINTS INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Integrating temporal constraints');
  const constraintIntegration = await ctx.task(temporalConstraintIntegrationTask, {
    constraints,
    phenomenon,
    timeScale,
    cumulativeProjection,
    outputDir
  });

  artifacts.push(...constraintIntegration.artifacts);

  // ============================================================================
  // PHASE 6: SECULAR TREND IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Identifying secular trends');
  const secularTrends = await ctx.task(secularTrendIdentificationTask, {
    phenomenon,
    timeScale,
    cumulativeProjection,
    constraintIntegration,
    outputDir
  });

  artifacts.push(...secularTrends.artifacts);

  // ============================================================================
  // PHASE 7: UNCERTAINTY PROPAGATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing uncertainty propagation over deep time');
  const uncertaintyAnalysis = await ctx.task(uncertaintyPropagationTask, {
    phenomenon,
    timeScale,
    rateAnalysis,
    cumulativeProjection,
    outputDir
  });

  artifacts.push(...uncertaintyAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: SYNTHESIS AND INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing deep time analysis');
  const synthesis = await ctx.task(deepTimeSynthesisTask, {
    temporalComprehension,
    rateAnalysis,
    cumulativeProjection,
    nonLinearAssessment,
    constraintIntegration,
    secularTrends,
    uncertaintyAnalysis,
    targetRigor,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  const rigorMet = synthesis.rigorScore >= targetRigor;

  // Breakpoint: Review deep time analysis
  await ctx.breakpoint({
    question: `Deep time analysis complete. Rigor: ${synthesis.rigorScore}/${targetRigor}. ${rigorMet ? 'Rigor target met!' : 'Additional constraints may be needed.'} Review analysis?`,
    title: 'Deep Time Thinking Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        phenomenon,
        timeScaleYears: timeScale.duration,
        cumulativeEffects: cumulativeProjection.effects.length,
        secularTrends: secularTrends.trends.length,
        rigorScore: synthesis.rigorScore,
        rigorMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    phenomenon,
    deepTimeAnalysis: {
      timeScale: temporalComprehension.comprehension,
      rates: rateAnalysis.rates,
      nonLinearDynamics: nonLinearAssessment.dynamics
    },
    cumulativeEffects: cumulativeProjection.effects,
    temporalConstraints: constraintIntegration.constraints,
    secularTrends: secularTrends.trends,
    uncertainty: uncertaintyAnalysis.propagatedUncertainty,
    rigorScore: synthesis.rigorScore,
    rigorMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/deep-time-thinking',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Temporal Scale Comprehension
export const temporalScaleComprehensionTask = defineTask('temporal-scale-comprehension', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Comprehend temporal scales',
  agent: {
    name: 'deep-time-specialist',
    prompt: {
      role: 'geologist and cosmologist specializing in deep time concepts',
      task: 'Establish comprehension framework for deep time reasoning',
      context: args,
      instructions: [
        'Express the time scale in multiple representations:',
        '  - Absolute years',
        '  - Geological periods/eons',
        '  - Analogies to human timescales',
        '  - Cosmic calendar representation',
        'Identify appropriate temporal resolution:',
        '  - What processes are visible at this scale?',
        '  - What processes are too fast to resolve?',
        '  - What processes are too slow to complete?',
        'Establish temporal landmarks and reference points',
        'Consider the limits of temporal measurement at this scale',
        'Develop intuition aids for the time scale',
        'Save comprehension framework to output directory'
      ],
      outputFormat: 'JSON with comprehension (representations, resolution, landmarks, intuitionAids), measurabilityLimits, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['comprehension', 'measurabilityLimits', 'artifacts'],
      properties: {
        comprehension: {
          type: 'object',
          properties: {
            absoluteYears: { type: 'number' },
            geologicalPeriod: { type: 'string' },
            cosmicCalendar: { type: 'string' },
            humanAnalogy: { type: 'string' },
            visibleProcesses: { type: 'array', items: { type: 'string' } },
            unresolvableProcesses: { type: 'array', items: { type: 'string' } },
            incompleteProcesses: { type: 'array', items: { type: 'string' } }
          }
        },
        landmarks: { type: 'array', items: { type: 'object' } },
        intuitionAids: { type: 'array', items: { type: 'string' } },
        measurabilityLimits: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'deep-time', 'temporal-comprehension']
}));

// Task 2: Process Rate Analysis
export const processRateAnalysisTask = defineTask('process-rate-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze process rates at different scales',
  agent: {
    name: 'rate-analyst',
    prompt: {
      role: 'geologist specializing in geological process rates',
      task: 'Analyze how process rates behave over deep time',
      context: args,
      instructions: [
        'Identify processes relevant to the phenomenon',
        'For each process determine:',
        '  - Modern measured rate',
        '  - Historical rate variations',
        '  - Rate dependencies (temperature, pressure, etc.)',
        '  - Whether rate is constant or variable over deep time',
        'Consider rate changes due to:',
        '  - Secular cooling/heating',
        '  - Atmospheric evolution',
        '  - Biological influences',
        '  - Tectonic state',
        'Identify threshold behaviors and phase transitions',
        'Compare to other rate-dependent phenomena',
        'Save rate analysis to output directory'
      ],
      outputFormat: 'JSON with rates (array with process, currentRate, historicalVariation, dependencies), rateChanges, thresholds, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rates', 'rateChanges', 'artifacts'],
      properties: {
        rates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              process: { type: 'string' },
              currentRate: { type: 'object' },
              historicalVariation: { type: 'object' },
              dependencies: { type: 'array', items: { type: 'string' } },
              timeVariability: { type: 'string', enum: ['constant', 'slowly-varying', 'highly-variable', 'episodic'] }
            }
          }
        },
        rateChanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              effect: { type: 'string' },
              magnitude: { type: 'string' }
            }
          }
        },
        thresholds: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'deep-time', 'rate-analysis']
}));

// Task 3: Cumulative Effects Projection
export const cumulativeEffectsProjectionTask = defineTask('cumulative-effects-projection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Project cumulative effects over deep time',
  agent: {
    name: 'cumulative-effects-specialist',
    prompt: {
      role: 'systems scientist specializing in long-term cumulative processes',
      task: 'Project how effects accumulate over deep time',
      context: args,
      instructions: [
        'For each process, calculate cumulative effects:',
        '  - Total displacement/change over time period',
        '  - Accounting for rate variations',
        '  - Including episodic events',
        'Consider cumulative effects:',
        '  - Erosion (mountains removed)',
        '  - Sedimentation (basins filled)',
        '  - Radioactive decay (isotope ratios)',
        '  - Biological evolution (generations)',
        '  - Stellar evolution (luminosity changes)',
        'Identify when cumulative effects exceed thresholds',
        'Model interaction of multiple cumulative processes',
        'Compare to observable geological/cosmological record',
        'Save cumulative projection to output directory'
      ],
      outputFormat: 'JSON with effects (array), thresholdExceedances, processInteractions, observationalEvidence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['effects', 'thresholdExceedances', 'artifacts'],
      properties: {
        effects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              process: { type: 'string' },
              cumulativeEffect: { type: 'object' },
              magnitude: { type: 'string' },
              significance: { type: 'string' }
            }
          }
        },
        thresholdExceedances: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              threshold: { type: 'string' },
              timeToExceed: { type: 'string' },
              consequence: { type: 'string' }
            }
          }
        },
        processInteractions: { type: 'array', items: { type: 'object' } },
        observationalEvidence: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'deep-time', 'cumulative-effects']
}));

// Task 4: Non-Linear Dynamics Assessment
export const nonLinearDynamicsTask = defineTask('non-linear-dynamics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess non-linear dynamics',
  agent: {
    name: 'nonlinear-dynamics-specialist',
    prompt: {
      role: 'complex systems scientist specializing in non-linear dynamics',
      task: 'Assess non-linear and threshold behaviors over deep time',
      context: args,
      instructions: [
        'Identify non-linear behaviors in the system:',
        '  - Tipping points and phase transitions',
        '  - Feedback amplification',
        '  - Chaotic sensitivity',
        '  - Hysteresis effects',
        'Assess how non-linearity affects deep time predictions:',
        '  - Predictability horizons',
        '  - Sensitivity to initial conditions',
        '  - Multiple possible trajectories',
        'Identify critical transitions in Earth/cosmic history:',
        '  - Snowball Earth events',
        '  - Mass extinctions',
        '  - Oxygenation events',
        '  - Stellar evolution stages',
        'Model interaction of multiple non-linear processes',
        'Save non-linear assessment to output directory'
      ],
      outputFormat: 'JSON with dynamics (tippingPoints, feedbacks, chaosAssessment), criticalTransitions, predictabilityHorizon, multipleTrajectories, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dynamics', 'criticalTransitions', 'artifacts'],
      properties: {
        dynamics: {
          type: 'object',
          properties: {
            tippingPoints: { type: 'array', items: { type: 'object' } },
            feedbacks: { type: 'array', items: { type: 'object' } },
            chaosAssessment: { type: 'object' },
            hysteresis: { type: 'array', items: { type: 'object' } }
          }
        },
        criticalTransitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event: { type: 'string' },
              timing: { type: 'string' },
              trigger: { type: 'string' },
              consequence: { type: 'string' }
            }
          }
        },
        predictabilityHorizon: { type: 'string' },
        multipleTrajectories: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'deep-time', 'non-linear-dynamics']
}));

// Task 5: Temporal Constraint Integration
export const temporalConstraintIntegrationTask = defineTask('temporal-constraint-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate temporal constraints',
  agent: {
    name: 'geochronologist',
    prompt: {
      role: 'geochronologist and temporal constraint specialist',
      task: 'Integrate temporal constraints into deep time reasoning',
      context: args,
      instructions: [
        'Identify all temporal constraints:',
        '  - Radiometric ages',
        '  - Stratigraphic relationships',
        '  - Paleomagnetic data',
        '  - Biostratigraphic correlations',
        '  - Astronomical calibrations',
        'Assess constraint quality:',
        '  - Precision and accuracy',
        '  - Assumptions and limitations',
        '  - Concordance among methods',
        'Build integrated temporal framework:',
        '  - Absolute age anchors',
        '  - Relative age relationships',
        '  - Duration estimates',
        'Identify temporal paradoxes or conflicts',
        'Propagate constraint uncertainties',
        'Save constraint integration to output directory'
      ],
      outputFormat: 'JSON with constraints (array), temporalFramework, conflicts, uncertaintyBudget, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['constraints', 'temporalFramework', 'artifacts'],
      properties: {
        constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              value: { type: 'object' },
              uncertainty: { type: 'object' },
              quality: { type: 'string', enum: ['high', 'medium', 'low'] },
              limitations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        temporalFramework: {
          type: 'object',
          properties: {
            absoluteAnchors: { type: 'array', items: { type: 'object' } },
            relativeSequences: { type: 'array', items: { type: 'object' } },
            durations: { type: 'object' }
          }
        },
        conflicts: { type: 'array', items: { type: 'object' } },
        uncertaintyBudget: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'deep-time', 'temporal-constraints']
}));

// Task 6: Secular Trend Identification
export const secularTrendIdentificationTask = defineTask('secular-trend-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify secular trends',
  agent: {
    name: 'secular-trend-analyst',
    prompt: {
      role: 'Earth system scientist specializing in long-term trends',
      task: 'Identify secular trends operating over deep time',
      context: args,
      instructions: [
        'Identify unidirectional secular trends:',
        '  - Solar luminosity increase',
        '  - Earth cooling (mantle heat loss)',
        '  - Lunar recession',
        '  - Day lengthening',
        '  - Continental emergence',
        '  - Atmospheric evolution',
        'For each trend characterize:',
        '  - Rate of change',
        '  - Total change over time period',
        '  - Mechanisms driving trend',
        '  - Consequences for other processes',
        'Distinguish secular trends from cyclic variations',
        'Identify trend interactions and feedbacks',
        'Project trends forward/backward',
        'Save secular trends to output directory'
      ],
      outputFormat: 'JSON with trends (array), trendInteractions, projections, cyclicVariations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['trends', 'trendInteractions', 'artifacts'],
      properties: {
        trends: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              direction: { type: 'string' },
              rate: { type: 'object' },
              totalChange: { type: 'object' },
              mechanism: { type: 'string' },
              consequences: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        trendInteractions: { type: 'array', items: { type: 'object' } },
        projections: {
          type: 'object',
          properties: {
            forward: { type: 'array', items: { type: 'object' } },
            backward: { type: 'array', items: { type: 'object' } }
          }
        },
        cyclicVariations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'deep-time', 'secular-trends']
}));

// Task 7: Uncertainty Propagation
export const uncertaintyPropagationTask = defineTask('uncertainty-propagation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze uncertainty propagation',
  agent: {
    name: 'uncertainty-analyst',
    prompt: {
      role: 'quantitative scientist specializing in uncertainty analysis',
      task: 'Analyze how uncertainties propagate and grow over deep time',
      context: args,
      instructions: [
        'Identify sources of uncertainty:',
        '  - Measurement uncertainty (ages, rates)',
        '  - Model uncertainty (process models)',
        '  - Parametric uncertainty',
        '  - Structural uncertainty',
        'Analyze uncertainty growth over time:',
        '  - Linear vs. exponential growth',
        '  - Diverging trajectories',
        '  - Constraint narrowing',
        'Apply formal uncertainty propagation methods',
        'Identify which uncertainties dominate',
        'Assess confidence in deep time inferences',
        'Recommend strategies to reduce uncertainty',
        'Save uncertainty analysis to output directory'
      ],
      outputFormat: 'JSON with propagatedUncertainty, uncertaintySources, growthBehavior, dominantUncertainties, confidenceLevels, reductionStrategies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['propagatedUncertainty', 'uncertaintySources', 'artifacts'],
      properties: {
        propagatedUncertainty: {
          type: 'object',
          properties: {
            current: { type: 'object' },
            projected: { type: 'object' },
            growthRate: { type: 'string' }
          }
        },
        uncertaintySources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              type: { type: 'string' },
              magnitude: { type: 'object' },
              reducible: { type: 'boolean' }
            }
          }
        },
        growthBehavior: { type: 'string' },
        dominantUncertainties: { type: 'array', items: { type: 'string' } },
        confidenceLevels: { type: 'object' },
        reductionStrategies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'deep-time', 'uncertainty']
}));

// Task 8: Deep Time Synthesis
export const deepTimeSynthesisTask = defineTask('deep-time-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize deep time analysis',
  agent: {
    name: 'deep-time-synthesis-specialist',
    prompt: {
      role: 'senior geoscientist specializing in deep time reasoning',
      task: 'Synthesize comprehensive deep time analysis',
      context: args,
      instructions: [
        'Integrate all deep time analyses',
        'Create coherent narrative of phenomenon over deep time',
        'Assess reasoning rigor (0-100):',
        '  - Temporal constraints well-established?',
        '  - Rates properly characterized?',
        '  - Non-linearities accounted for?',
        '  - Uncertainties properly propagated?',
        '  - Secular trends identified?',
        'Identify key insights about deep time behavior',
        'Generate predictions testable against geological record',
        'Note epistemological limits of deep time reasoning',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with synthesis, rigorScore, keyInsights, predictions, epistemologicalLimits, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'rigorScore', 'artifacts'],
      properties: {
        synthesis: {
          type: 'object',
          properties: {
            narrative: { type: 'string' },
            timeline: { type: 'array', items: { type: 'object' } },
            majorEvents: { type: 'array', items: { type: 'string' } }
          }
        },
        rigorScore: { type: 'number', minimum: 0, maximum: 100 },
        keyInsights: { type: 'array', items: { type: 'string' } },
        predictions: { type: 'array', items: { type: 'object' } },
        epistemologicalLimits: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'deep-time', 'synthesis']
}));
