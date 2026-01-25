/**
 * @process chemical-engineering/pid-controller-tuning
 * @description Systematically tune PID controllers using model-based and empirical methods for optimal process performance
 * @inputs { processName: string, controlLoops: array, tuningMethod: string, performanceTargets: object, outputDir: string }
 * @outputs { success: boolean, tuningParameters: array, performanceMetrics: object, documentation: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    controlLoops,
    tuningMethod = 'IMC',
    performanceTargets = {},
    outputDir = 'pid-tuning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Identify Process Dynamics
  ctx.log('info', 'Starting PID tuning: Identifying process dynamics');
  const dynamicsResult = await ctx.task(processDynamicsTask, {
    processName,
    controlLoops,
    outputDir
  });

  if (!dynamicsResult.success) {
    return {
      success: false,
      error: 'Process dynamics identification failed',
      details: dynamicsResult,
      metadata: { processId: 'chemical-engineering/pid-controller-tuning', timestamp: startTime }
    };
  }

  artifacts.push(...dynamicsResult.artifacts);

  // Task 2: Select Tuning Method
  ctx.log('info', 'Selecting tuning method');
  const methodSelectionResult = await ctx.task(tuningMethodSelectionTask, {
    processName,
    processDynamics: dynamicsResult.dynamics,
    tuningMethod,
    performanceTargets,
    outputDir
  });

  artifacts.push(...methodSelectionResult.artifacts);

  // Task 3: Calculate Initial Tuning Parameters
  ctx.log('info', 'Calculating initial tuning parameters');
  const initialTuningResult = await ctx.task(initialTuningTask, {
    processName,
    processDynamics: dynamicsResult.dynamics,
    tuningMethod: methodSelectionResult.selectedMethod,
    outputDir
  });

  artifacts.push(...initialTuningResult.artifacts);

  // Task 4: Implement and Test Tuning
  ctx.log('info', 'Implementing and testing tuning parameters');
  const implementationResult = await ctx.task(tuningImplementationTask, {
    processName,
    initialParameters: initialTuningResult.parameters,
    controlLoops,
    outputDir
  });

  artifacts.push(...implementationResult.artifacts);

  // Task 5: Fine-Tune for Robustness
  ctx.log('info', 'Fine-tuning for robustness');
  const fineTuningResult = await ctx.task(robustnessTuningTask, {
    processName,
    implementationResults: implementationResult.results,
    performanceTargets,
    outputDir
  });

  artifacts.push(...fineTuningResult.artifacts);

  // Breakpoint: Review tuning results
  await ctx.breakpoint({
    question: `PID tuning complete for ${processName}. Loops tuned: ${controlLoops.length}. Performance met: ${fineTuningResult.performanceMet}. Average IAE improvement: ${fineTuningResult.iaeImprovement}%. Review tuning?`,
    title: 'PID Controller Tuning Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        loopsTuned: controlLoops.length,
        tuningMethod: methodSelectionResult.selectedMethod,
        performanceMet: fineTuningResult.performanceMet,
        iaeImprovement: fineTuningResult.iaeImprovement
      }
    }
  });

  // Task 6: Document Final Parameters and Performance
  ctx.log('info', 'Documenting final parameters and performance');
  const documentationResult = await ctx.task(tuningDocumentationTask, {
    processName,
    finalParameters: fineTuningResult.finalParameters,
    performanceMetrics: fineTuningResult.performanceMetrics,
    tuningMethod: methodSelectionResult.selectedMethod,
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    tuningParameters: fineTuningResult.finalParameters,
    performanceMetrics: fineTuningResult.performanceMetrics,
    documentation: documentationResult.documentation,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/pid-controller-tuning',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Process Dynamics Identification
export const processDynamicsTask = defineTask('process-dynamics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify process dynamics',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'process dynamics engineer',
      task: 'Identify process dynamics for each control loop',
      context: args,
      instructions: [
        'Perform step tests or bump tests',
        'Identify process gain (Kp)',
        'Identify time constant (tau)',
        'Identify dead time (theta)',
        'Fit first-order plus dead time (FOPDT) model',
        'Assess process nonlinearity',
        'Calculate theta/tau ratio',
        'Document process dynamics'
      ],
      outputFormat: 'JSON with process dynamics, model parameters, theta/tau ratios, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dynamics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dynamics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              loopTag: { type: 'string' },
              processGain: { type: 'number' },
              timeConstant: { type: 'number' },
              deadTime: { type: 'number' },
              thetaTauRatio: { type: 'number' }
            }
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
  labels: ['agent', 'chemical-engineering', 'pid-tuning', 'dynamics']
}));

// Task 2: Tuning Method Selection
export const tuningMethodSelectionTask = defineTask('tuning-method-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select tuning method',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'PID tuning specialist',
      task: 'Select appropriate tuning method for each loop',
      context: args,
      instructions: [
        'Evaluate Ziegler-Nichols method',
        'Evaluate Cohen-Coon method',
        'Evaluate IMC (Internal Model Control) tuning',
        'Evaluate Lambda tuning',
        'Evaluate relay auto-tuning',
        'Consider theta/tau ratio in selection',
        'Match method to performance requirements',
        'Document method selection rationale'
      ],
      outputFormat: 'JSON with selected method, rationale, method parameters, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'selectedMethod', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        selectedMethod: { type: 'string' },
        methodParameters: { type: 'object' },
        rationale: { type: 'string' },
        alternatives: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'pid-tuning', 'method-selection']
}));

// Task 3: Initial Tuning Calculation
export const initialTuningTask = defineTask('initial-tuning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate initial tuning parameters',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'PID tuning calculator',
      task: 'Calculate initial PID tuning parameters',
      context: args,
      instructions: [
        'Apply selected tuning rules',
        'Calculate proportional gain (Kc)',
        'Calculate integral time (Ti)',
        'Calculate derivative time (Td)',
        'Apply tuning rule modifications if needed',
        'Consider controller output limits',
        'Calculate expected closed-loop response',
        'Document tuning calculations'
      ],
      outputFormat: 'JSON with tuning parameters, calculations, expected response, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'parameters', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        parameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              loopTag: { type: 'string' },
              Kc: { type: 'number' },
              Ti: { type: 'number' },
              Td: { type: 'number' },
              algorithm: { type: 'string' }
            }
          }
        },
        calculations: { type: 'object' },
        expectedResponse: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'pid-tuning', 'calculation']
}));

// Task 4: Tuning Implementation
export const tuningImplementationTask = defineTask('tuning-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement and test tuning parameters',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'control implementation engineer',
      task: 'Implement tuning and test performance',
      context: args,
      instructions: [
        'Implement tuning parameters in DCS/PLC',
        'Perform setpoint step tests',
        'Perform disturbance rejection tests',
        'Measure rise time and settling time',
        'Measure overshoot and undershoot',
        'Calculate IAE, ISE, ITAE metrics',
        'Assess stability margins',
        'Document implementation results'
      ],
      outputFormat: 'JSON with test results, performance metrics, issues identified, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'results', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              loopTag: { type: 'string' },
              riseTime: { type: 'number' },
              settlingTime: { type: 'number' },
              overshoot: { type: 'number' },
              iae: { type: 'number' }
            }
          }
        },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'pid-tuning', 'implementation']
}));

// Task 5: Robustness Tuning
export const robustnessTuningTask = defineTask('robustness-tuning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fine-tune for robustness',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'control robustness engineer',
      task: 'Fine-tune parameters for robustness',
      context: args,
      instructions: [
        'Assess sensitivity to process variations',
        'Apply detuning if needed for robustness',
        'Balance performance vs. robustness',
        'Test under different operating conditions',
        'Verify gain and phase margins',
        'Adjust for nonlinear process behavior',
        'Finalize tuning parameters',
        'Document final tuning and performance'
      ],
      outputFormat: 'JSON with final parameters, performance metrics, robustness assessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'finalParameters', 'performanceMetrics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        finalParameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              loopTag: { type: 'string' },
              Kc: { type: 'number' },
              Ti: { type: 'number' },
              Td: { type: 'number' }
            }
          }
        },
        performanceMetrics: { type: 'object' },
        performanceMet: { type: 'boolean' },
        iaeImprovement: { type: 'number' },
        robustnessAssessment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'pid-tuning', 'robustness']
}));

// Task 6: Tuning Documentation
export const tuningDocumentationTask = defineTask('tuning-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document final parameters and performance',
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'tuning documentation engineer',
      task: 'Document tuning results and create tuning record',
      context: args,
      instructions: [
        'Create tuning parameter summary',
        'Document process model parameters',
        'Record tuning method and rationale',
        'Document performance test results',
        'Create before/after comparison',
        'Document operating range validity',
        'Create tuning record for each loop',
        'Generate tuning report'
      ],
      outputFormat: 'JSON with documentation, tuning records, report path, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'documentation', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        documentation: {
          type: 'object',
          properties: {
            reportPath: { type: 'string' },
            tuningRecords: { type: 'array' },
            performanceSummary: { type: 'object' }
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
  labels: ['agent', 'chemical-engineering', 'pid-tuning', 'documentation']
}));
