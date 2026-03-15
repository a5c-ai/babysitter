/**
 * @process scientific-discovery/homeostasis-feedback-thinking
 * @description Understand biological stability through negative and positive feedback loops, regulatory mechanisms, and set-point maintenance
 * @inputs { system: object, variable: string, perturbation: object, outputDir: string }
 * @outputs { success: boolean, homeostaticAnalysis: object, feedbackLoops: array, stabilityAssessment: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    system = {},
    variable = '',
    perturbation = {},
    outputDir = 'homeostasis-feedback-output',
    targetUnderstanding = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Homeostasis and Feedback Thinking Process');

  // ============================================================================
  // PHASE 1: SYSTEM VARIABLE CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Characterizing regulated variable and set point');
  const variableCharacterization = await ctx.task(variableCharacterizationTask, {
    system,
    variable,
    outputDir
  });

  artifacts.push(...variableCharacterization.artifacts);

  // ============================================================================
  // PHASE 2: FEEDBACK LOOP IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying feedback loops');
  const feedbackIdentification = await ctx.task(feedbackLoopIdentificationTask, {
    system,
    variable,
    setPoint: variableCharacterization.setPoint,
    outputDir
  });

  artifacts.push(...feedbackIdentification.artifacts);

  // ============================================================================
  // PHASE 3: NEGATIVE FEEDBACK ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing negative feedback mechanisms');
  const negativeFeedbackAnalysis = await ctx.task(negativeFeedbackAnalysisTask, {
    feedbackLoops: feedbackIdentification.negativeFeedbackLoops,
    variable,
    system,
    outputDir
  });

  artifacts.push(...negativeFeedbackAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: POSITIVE FEEDBACK ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing positive feedback mechanisms');
  const positiveFeedbackAnalysis = await ctx.task(positiveFeedbackAnalysisTask, {
    feedbackLoops: feedbackIdentification.positiveFeedbackLoops,
    variable,
    system,
    outputDir
  });

  artifacts.push(...positiveFeedbackAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: PERTURBATION RESPONSE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing perturbation responses');
  const perturbationAnalysis = await ctx.task(perturbationResponseTask, {
    perturbation,
    feedbackLoops: feedbackIdentification.allLoops,
    setPoint: variableCharacterization.setPoint,
    system,
    outputDir
  });

  artifacts.push(...perturbationAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: STABILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Assessing system stability');
  const stabilityAssessment = await ctx.task(stabilityAssessmentTask, {
    negativeFeedbackAnalysis,
    positiveFeedbackAnalysis,
    perturbationAnalysis,
    variable,
    outputDir
  });

  artifacts.push(...stabilityAssessment.artifacts);

  // ============================================================================
  // PHASE 7: ALLOSTASIS AND ADAPTATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing allostasis and adaptive regulation');
  const allostasisAnalysis = await ctx.task(allostasisAdaptationTask, {
    system,
    variable,
    setPoint: variableCharacterization.setPoint,
    feedbackLoops: feedbackIdentification.allLoops,
    outputDir
  });

  artifacts.push(...allostasisAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: SYNTHESIS AND INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing homeostatic understanding');
  const synthesis = await ctx.task(homeostaticSynthesisTask, {
    variableCharacterization,
    feedbackIdentification,
    negativeFeedbackAnalysis,
    positiveFeedbackAnalysis,
    perturbationAnalysis,
    stabilityAssessment,
    allostasisAnalysis,
    targetUnderstanding,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  const understandingMet = synthesis.understandingScore >= targetUnderstanding;

  // Breakpoint: Review homeostatic analysis
  await ctx.breakpoint({
    question: `Homeostatic analysis complete. Understanding: ${synthesis.understandingScore}/${targetUnderstanding}. ${understandingMet ? 'Understanding target met!' : 'Additional analysis may be needed.'} Review analysis?`,
    title: 'Homeostasis and Feedback Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        variable,
        setPoint: variableCharacterization.setPoint,
        negativeFeedbackLoops: feedbackIdentification.negativeFeedbackLoops.length,
        positiveFeedbackLoops: feedbackIdentification.positiveFeedbackLoops.length,
        stabilityStatus: stabilityAssessment.status,
        understandingScore: synthesis.understandingScore,
        understandingMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    variable,
    homeostaticAnalysis: {
      setPoint: variableCharacterization.setPoint,
      normalRange: variableCharacterization.normalRange,
      regulatoryMechanisms: synthesis.regulatoryMechanisms
    },
    feedbackLoops: feedbackIdentification.allLoops,
    stabilityAssessment: stabilityAssessment.assessment,
    perturbationResponse: perturbationAnalysis.response,
    allostasis: allostasisAnalysis.adaptiveRegulation,
    understandingScore: synthesis.understandingScore,
    understandingMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/homeostasis-feedback-thinking',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Variable Characterization
export const variableCharacterizationTask = defineTask('variable-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize regulated variable and set point',
  agent: {
    name: 'physiologist',
    prompt: {
      role: 'physiologist specializing in homeostatic regulation',
      task: 'Characterize the regulated variable and its homeostatic set point',
      context: args,
      instructions: [
        'Define the variable being regulated',
        'Identify the homeostatic set point (target value)',
        'Determine the normal physiological range',
        'Identify sensors that detect variable levels',
        'Understand why this variable must be regulated',
        'Document consequences of deviation from set point',
        'Identify factors that influence the set point',
        'Note circadian or other rhythmic variations',
        'Consider developmental changes in regulation',
        'Save characterization to output directory'
      ],
      outputFormat: 'JSON with setPoint, normalRange, sensors, regulationRationale, deviationConsequences, setPointModifiers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['setPoint', 'normalRange', 'sensors', 'artifacts'],
      properties: {
        setPoint: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            units: { type: 'string' },
            variability: { type: 'number' }
          }
        },
        normalRange: {
          type: 'object',
          properties: {
            min: { type: 'number' },
            max: { type: 'number' },
            optimalRange: { type: 'object' }
          }
        },
        sensors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              location: { type: 'string' },
              sensitivity: { type: 'string' }
            }
          }
        },
        regulationRationale: { type: 'string' },
        deviationConsequences: { type: 'object' },
        setPointModifiers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'homeostasis', 'variable-characterization']
}));

// Task 2: Feedback Loop Identification
export const feedbackLoopIdentificationTask = defineTask('feedback-loop-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify feedback loops',
  agent: {
    name: 'control-systems-biologist',
    prompt: {
      role: 'systems biologist specializing in biological control systems',
      task: 'Identify all feedback loops involved in regulating the variable',
      context: args,
      instructions: [
        'Map the complete regulatory circuit',
        'Identify negative feedback loops:',
        '  - Sensor components',
        '  - Control center/comparator',
        '  - Effector mechanisms',
        '  - Signal transduction pathways',
        'Identify positive feedback loops:',
        '  - Amplification mechanisms',
        '  - Termination signals',
        'Classify loop characteristics:',
        '  - Speed (fast/slow)',
        '  - Gain (high/low)',
        '  - Threshold',
        'Identify nested and interconnected loops',
        'Map neural vs. hormonal vs. local feedback',
        'Save loop identification to output directory'
      ],
      outputFormat: 'JSON with negativeFeedbackLoops, positiveFeedbackLoops, allLoops, loopInteractions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['negativeFeedbackLoops', 'positiveFeedbackLoops', 'allLoops', 'artifacts'],
      properties: {
        negativeFeedbackLoops: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              sensor: { type: 'string' },
              controlCenter: { type: 'string' },
              effector: { type: 'string' },
              speed: { type: 'string', enum: ['fast', 'medium', 'slow'] },
              gain: { type: 'string', enum: ['high', 'medium', 'low'] },
              mechanism: { type: 'string' }
            }
          }
        },
        positiveFeedbackLoops: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              trigger: { type: 'string' },
              amplificationMechanism: { type: 'string' },
              terminationSignal: { type: 'string' },
              biologicalContext: { type: 'string' }
            }
          }
        },
        allLoops: { type: 'array', items: { type: 'object' } },
        loopInteractions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'homeostasis', 'feedback-identification']
}));

// Task 3: Negative Feedback Analysis
export const negativeFeedbackAnalysisTask = defineTask('negative-feedback-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze negative feedback mechanisms',
  agent: {
    name: 'negative-feedback-specialist',
    prompt: {
      role: 'control systems specialist in biological negative feedback',
      task: 'Analyze how negative feedback maintains homeostasis',
      context: args,
      instructions: [
        'For each negative feedback loop analyze:',
        '  - Detection mechanism and sensitivity',
        '  - Error signal generation',
        '  - Corrective response magnitude',
        '  - Response dynamics (proportional, integral, derivative)',
        '  - Time constants and delays',
        'Assess effectiveness at different perturbation magnitudes',
        'Identify gain of each loop component',
        'Analyze overshoot and oscillation potential',
        'Determine operating range and saturation limits',
        'Identify redundancy among multiple loops',
        'Save negative feedback analysis to output directory'
      ],
      outputFormat: 'JSON with loopAnalyses (array), effectivenessAssessment, gainAnalysis, dynamicProperties, redundancy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['loopAnalyses', 'effectivenessAssessment', 'artifacts'],
      properties: {
        loopAnalyses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              loopName: { type: 'string' },
              detectionMechanism: { type: 'string' },
              errorSignal: { type: 'string' },
              responseType: { type: 'string' },
              timeConstant: { type: 'string' },
              gain: { type: 'number' },
              saturationLimit: { type: 'number' }
            }
          }
        },
        effectivenessAssessment: {
          type: 'object',
          properties: {
            smallPerturbations: { type: 'string' },
            largePerturbations: { type: 'string' },
            sustainedPerturbations: { type: 'string' }
          }
        },
        gainAnalysis: { type: 'object' },
        dynamicProperties: {
          type: 'object',
          properties: {
            overshootPotential: { type: 'boolean' },
            oscillationRisk: { type: 'boolean' },
            settlingTime: { type: 'string' }
          }
        },
        redundancy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'homeostasis', 'negative-feedback']
}));

// Task 4: Positive Feedback Analysis
export const positiveFeedbackAnalysisTask = defineTask('positive-feedback-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze positive feedback mechanisms',
  agent: {
    name: 'positive-feedback-specialist',
    prompt: {
      role: 'systems biologist specializing in positive feedback',
      task: 'Analyze positive feedback mechanisms and their roles',
      context: args,
      instructions: [
        'For each positive feedback loop analyze:',
        '  - Initiating stimulus/threshold',
        '  - Amplification cascade',
        '  - Magnitude of amplification',
        '  - Termination mechanism',
        'Identify biological contexts where positive feedback is appropriate:',
        '  - Switch-like behaviors',
        '  - Rapid transitions',
        '  - All-or-none responses',
        '  - Commitment to irreversible processes',
        'Analyze risks of positive feedback:',
        '  - Runaway amplification',
        '  - Loss of control',
        'Identify how positive feedback is contained',
        'Analyze interaction with negative feedback',
        'Save positive feedback analysis to output directory'
      ],
      outputFormat: 'JSON with loopAnalyses (array), biologicalContexts, risks, containmentMechanisms, negativeInteraction, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['loopAnalyses', 'biologicalContexts', 'artifacts'],
      properties: {
        loopAnalyses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              loopName: { type: 'string' },
              threshold: { type: 'string' },
              amplificationFactor: { type: 'number' },
              terminationMechanism: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        biologicalContexts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              context: { type: 'string' },
              purpose: { type: 'string' },
              example: { type: 'string' }
            }
          }
        },
        risks: { type: 'array', items: { type: 'string' } },
        containmentMechanisms: { type: 'array', items: { type: 'string' } },
        negativeInteraction: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'homeostasis', 'positive-feedback']
}));

// Task 5: Perturbation Response Analysis
export const perturbationResponseTask = defineTask('perturbation-response', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze perturbation responses',
  agent: {
    name: 'perturbation-analyst',
    prompt: {
      role: 'physiologist specializing in stress responses',
      task: 'Analyze how the homeostatic system responds to perturbations',
      context: args,
      instructions: [
        'Characterize the perturbation:',
        '  - Type (increase/decrease in variable)',
        '  - Magnitude',
        '  - Duration (acute/chronic)',
        '  - Rate of change',
        'Predict system response:',
        '  - Initial detection',
        '  - Feedback activation sequence',
        '  - Corrective responses',
        '  - Time course of return to set point',
        'Identify potential failure modes:',
        '  - Perturbation exceeds capacity',
        '  - Feedback loop dysfunction',
        '  - Maladaptive responses',
        'Analyze compensatory mechanisms',
        'Model response dynamics',
        'Save perturbation analysis to output directory'
      ],
      outputFormat: 'JSON with response (detection, correction, timeCourse), failureModes, compensatoryMechanisms, dynamics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['response', 'failureModes', 'artifacts'],
      properties: {
        response: {
          type: 'object',
          properties: {
            detection: { type: 'string' },
            feedbackActivation: { type: 'array', items: { type: 'string' } },
            correctiveActions: { type: 'array', items: { type: 'string' } },
            timeCourse: { type: 'object' },
            expectedRecovery: { type: 'string' }
          }
        },
        failureModes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mode: { type: 'string' },
              cause: { type: 'string' },
              consequence: { type: 'string' }
            }
          }
        },
        compensatoryMechanisms: { type: 'array', items: { type: 'string' } },
        dynamics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'homeostasis', 'perturbation-response']
}));

// Task 6: Stability Assessment
export const stabilityAssessmentTask = defineTask('stability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess system stability',
  agent: {
    name: 'stability-analyst',
    prompt: {
      role: 'dynamical systems analyst specializing in biological stability',
      task: 'Assess the stability properties of the homeostatic system',
      context: args,
      instructions: [
        'Assess local stability around set point',
        'Identify stable states and attractors',
        'Analyze stability margins:',
        '  - How far can system deviate before instability?',
        '  - What perturbations exceed capacity?',
        'Assess global stability:',
        '  - Multiple stable states (bistability)?',
        '  - Hysteresis?',
        'Identify conditions that could destabilize:',
        '  - Feedback loop failure',
        '  - Gain changes',
        '  - Time delay effects',
        'Assess robustness to parameter variations',
        'Classify overall stability status',
        'Save stability assessment to output directory'
      ],
      outputFormat: 'JSON with assessment (status, localStability, globalStability, margins), destabilizingConditions, robustness, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'destabilizingConditions', 'artifacts'],
      properties: {
        assessment: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['stable', 'marginally-stable', 'conditionally-stable', 'unstable'] },
            localStability: { type: 'boolean' },
            globalStability: { type: 'boolean' },
            stabilityMargin: { type: 'number' },
            bistability: { type: 'boolean' }
          }
        },
        destabilizingConditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              mechanism: { type: 'string' },
              likelihood: { type: 'string' }
            }
          }
        },
        robustness: {
          type: 'object',
          properties: {
            toParameterChanges: { type: 'string' },
            toStructuralChanges: { type: 'string' }
          }
        },
        oscillationAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'homeostasis', 'stability']
}));

// Task 7: Allostasis and Adaptation Analysis
export const allostasisAdaptationTask = defineTask('allostasis-adaptation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze allostasis and adaptive regulation',
  agent: {
    name: 'allostasis-specialist',
    prompt: {
      role: 'physiologist specializing in allostasis and adaptation',
      task: 'Analyze how the system adapts set points and regulation to changing conditions',
      context: args,
      instructions: [
        'Distinguish homeostasis (constant set point) from allostasis (variable set point)',
        'Identify conditions that trigger set point changes:',
        '  - Circadian rhythms',
        '  - Stress responses',
        '  - Developmental changes',
        '  - Environmental adaptation',
        'Analyze mechanisms of set point adjustment',
        'Assess allostatic load:',
        '  - Cost of maintaining stability',
        '  - Cumulative wear and tear',
        'Identify predictive regulation (feedforward)',
        'Analyze long-term adaptation mechanisms',
        'Consider pathological allostasis (chronic stress)',
        'Save allostasis analysis to output directory'
      ],
      outputFormat: 'JSON with adaptiveRegulation, setPointModulation, allostaticLoad, predictiveRegulation, pathologicalStates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['adaptiveRegulation', 'setPointModulation', 'artifacts'],
      properties: {
        adaptiveRegulation: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['homeostatic', 'allostatic', 'mixed'] },
            adaptiveMechanisms: { type: 'array', items: { type: 'string' } },
            timeScale: { type: 'string' }
          }
        },
        setPointModulation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trigger: { type: 'string' },
              direction: { type: 'string' },
              mechanism: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        allostaticLoad: { type: 'object' },
        predictiveRegulation: { type: 'object' },
        pathologicalStates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'homeostasis', 'allostasis']
}));

// Task 8: Homeostatic Synthesis
export const homeostaticSynthesisTask = defineTask('homeostatic-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize homeostatic understanding',
  agent: {
    name: 'homeostasis-synthesis-specialist',
    prompt: {
      role: 'senior physiologist and systems biologist',
      task: 'Synthesize comprehensive understanding of homeostatic regulation',
      context: args,
      instructions: [
        'Integrate all analyses into coherent understanding',
        'Summarize regulatory mechanisms and their interactions',
        'Create control system diagram of regulation',
        'Assess understanding completeness (0-100):',
        '  - Set point characterized?',
        '  - Feedback loops identified?',
        '  - Dynamics understood?',
        '  - Stability assessed?',
        '  - Adaptation mechanisms known?',
        'Identify key control points and vulnerabilities',
        'Generate predictions about system behavior',
        'Identify clinical/practical implications',
        'Recommend further studies',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with regulatoryMechanisms, controlDiagram, understandingScore, keyControlPoints, predictions, clinicalImplications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['regulatoryMechanisms', 'understandingScore', 'artifacts'],
      properties: {
        regulatoryMechanisms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mechanism: { type: 'string' },
              role: { type: 'string' },
              importance: { type: 'string' }
            }
          }
        },
        controlDiagram: { type: 'string' },
        understandingScore: { type: 'number', minimum: 0, maximum: 100 },
        keyControlPoints: { type: 'array', items: { type: 'string' } },
        vulnerabilities: { type: 'array', items: { type: 'string' } },
        predictions: { type: 'array', items: { type: 'object' } },
        clinicalImplications: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'homeostasis', 'synthesis']
}));
