/**
 * @process specializations/domains/science/electrical-engineering/feedback-control-design
 * @description Feedback Control System Design - Guide the design of feedback control systems including PID
 * controllers, state-space controllers, and advanced control algorithms. Covers modeling, analysis, design, and tuning.
 * @inputs { systemName: string, plantModel: object, controlObjectives: object, constraints?: object }
 * @outputs { success: boolean, controller: object, analysisResults: object, tuningParameters: object, documentation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/feedback-control-design', {
 *   systemName: 'Temperature Control System',
 *   plantModel: { type: 'first-order-plus-delay', gain: 2.5, timeConstant: '30s', delay: '5s' },
 *   controlObjectives: { settlingTime: '<60s', overshoot: '<10%', steadyStateError: '<1%' },
 *   constraints: { controlEffort: '0-100%', rateLimit: '10%/s' }
 * });
 *
 * @references
 * - ISA-5.1 (Instrumentation Symbols and Identification)
 * - IEC 61131-3 (Programmable Controllers)
 * - Control Systems Engineering (Nise)
 * - Modern Control Systems (Dorf & Bishop)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName,
    plantModel,
    controlObjectives,
    constraints = {}
  } = inputs;

  // Phase 1: Develop Mathematical Model of Plant/Process
  const plantModeling = await ctx.task(plantModelingTask, {
    systemName,
    plantModel,
    controlObjectives
  });

  // Quality Gate: Model must be validated
  if (!plantModeling.modelValidated) {
    return {
      success: false,
      error: 'Plant model not validated',
      phase: 'plant-modeling',
      issues: plantModeling.validationIssues
    };
  }

  // Phase 2: Define Control Objectives and Performance Specifications
  const objectivesDefinition = await ctx.task(objectivesDefinitionTask, {
    systemName,
    plantModel: plantModeling.model,
    controlObjectives,
    constraints
  });

  // Breakpoint: Review objectives
  await ctx.breakpoint({
    question: `Review control objectives for ${systemName}. Performance specs defined. Proceed with open-loop analysis?`,
    title: 'Objectives Review',
    context: {
      runId: ctx.runId,
      systemName,
      objectives: objectivesDefinition.specifications,
      files: [{
        path: `artifacts/phase2-objectives.json`,
        format: 'json',
        content: objectivesDefinition
      }]
    }
  });

  // Phase 3: Analyze Open-Loop System Characteristics
  const openLoopAnalysis = await ctx.task(openLoopAnalysisTask, {
    systemName,
    plantModel: plantModeling.model
  });

  // Phase 4: Design Controller Structure and Parameters
  const controllerDesign = await ctx.task(controllerDesignTask, {
    systemName,
    plantModel: plantModeling.model,
    openLoopAnalysis,
    objectives: objectivesDefinition.specifications,
    constraints
  });

  // Breakpoint: Review controller design
  await ctx.breakpoint({
    question: `Review controller design for ${systemName}. Type: ${controllerDesign.controllerType}. Proceed with simulation?`,
    title: 'Controller Design Review',
    context: {
      runId: ctx.runId,
      controller: controllerDesign,
      files: [{
        path: `artifacts/phase4-controller.json`,
        format: 'json',
        content: controllerDesign
      }]
    }
  });

  // Phase 5: Simulate Closed-Loop Performance
  const closedLoopSimulation = await ctx.task(closedLoopSimulationTask, {
    systemName,
    plantModel: plantModeling.model,
    controller: controllerDesign.controller,
    objectives: objectivesDefinition.specifications
  });

  // Phase 6: Analyze Stability Margins
  const stabilityAnalysis = await ctx.task(stabilityAnalysisTask, {
    systemName,
    plantModel: plantModeling.model,
    controller: controllerDesign.controller,
    closedLoopResults: closedLoopSimulation.results
  });

  // Quality Gate: System must be stable with adequate margins
  if (!stabilityAnalysis.stable || stabilityAnalysis.marginsInadequate) {
    await ctx.breakpoint({
      question: `Stability analysis: GM=${stabilityAnalysis.gainMargin}, PM=${stabilityAnalysis.phaseMargin}. ${stabilityAnalysis.stable ? 'Stable but' : 'Unstable!'} margins ${stabilityAnalysis.marginsInadequate ? 'inadequate' : 'adequate'}. Redesign?`,
      title: 'Stability Concern',
      context: {
        runId: ctx.runId,
        stability: stabilityAnalysis,
        recommendations: stabilityAnalysis.recommendations
      }
    });
  }

  // Phase 7: Tune Controller Parameters
  const controllerTuning = await ctx.task(controllerTuningTask, {
    systemName,
    controller: controllerDesign.controller,
    closedLoopResults: closedLoopSimulation.results,
    stabilityAnalysis,
    objectives: objectivesDefinition.specifications
  });

  // Phase 8: Validate with Hardware-in-the-Loop Testing
  const hilValidation = await ctx.task(hilValidationTask, {
    systemName,
    tunedController: controllerTuning.tunedController,
    plantModel: plantModeling.model,
    objectives: objectivesDefinition.specifications
  });

  // Final Breakpoint: Design Approval
  await ctx.breakpoint({
    question: `Control system design complete for ${systemName}. Performance meets specs: ${hilValidation.meetsSpecs}. Approve for deployment?`,
    title: 'Design Approval',
    context: {
      runId: ctx.runId,
      systemName,
      performanceSummary: hilValidation.performanceSummary,
      stabilityMargins: stabilityAnalysis.margins,
      files: [
        { path: `artifacts/controller-params.json`, format: 'json', content: controllerTuning.tunedController },
        { path: `artifacts/control-report.md`, format: 'markdown', content: hilValidation.markdown }
      ]
    }
  });

  return {
    success: true,
    systemName,
    controller: controllerTuning.tunedController,
    analysisResults: {
      openLoop: openLoopAnalysis,
      closedLoop: closedLoopSimulation.results,
      stability: stabilityAnalysis
    },
    tuningParameters: controllerTuning.parameters,
    performance: hilValidation.performance,
    documentation: hilValidation.documentation,
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/feedback-control-design',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const plantModelingTask = defineTask('plant-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Plant Modeling - ${args.systemName}`,
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'Control Systems Engineer with expertise in system identification',
      task: 'Develop mathematical model of plant/process',
      context: {
        systemName: args.systemName,
        plantModel: args.plantModel,
        controlObjectives: args.controlObjectives
      },
      instructions: [
        '1. Analyze physical system dynamics',
        '2. Develop transfer function or state-space model',
        '3. Identify model parameters from data if available',
        '4. Include dominant dynamics and significant nonlinearities',
        '5. Model actuator and sensor dynamics',
        '6. Account for time delays and transport lags',
        '7. Validate model against step response or frequency response',
        '8. Determine model uncertainty bounds',
        '9. Create linearized model around operating point',
        '10. Document model assumptions and limitations'
      ],
      outputFormat: 'JSON object with plant model'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'modelValidated'],
      properties: {
        model: {
          type: 'object',
          properties: {
            transferFunction: { type: 'object' },
            stateSpace: { type: 'object' },
            parameters: { type: 'object' },
            delay: { type: 'string' }
          }
        },
        modelValidated: { type: 'boolean' },
        validationResults: { type: 'object' },
        validationIssues: { type: 'array', items: { type: 'string' } },
        uncertainty: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'control', 'modeling']
}));

export const objectivesDefinitionTask = defineTask('objectives-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Objectives Definition - ${args.systemName}`,
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'Control Systems Specification Engineer',
      task: 'Define control objectives and performance specifications',
      context: {
        systemName: args.systemName,
        plantModel: args.plantModel,
        controlObjectives: args.controlObjectives,
        constraints: args.constraints
      },
      instructions: [
        '1. Define settling time requirements',
        '2. Define overshoot/undershoot limits',
        '3. Define steady-state error requirements',
        '4. Specify rise time or speed of response',
        '5. Define disturbance rejection requirements',
        '6. Specify noise attenuation requirements',
        '7. Define stability margin requirements (gain, phase)',
        '8. Specify actuator constraints (saturation, rate limits)',
        '9. Define robustness requirements to model uncertainty',
        '10. Document all performance specifications'
      ],
      outputFormat: 'JSON object with control specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications'],
      properties: {
        specifications: {
          type: 'object',
          properties: {
            timeResponse: {
              type: 'object',
              properties: {
                settlingTime: { type: 'string' },
                riseTime: { type: 'string' },
                overshoot: { type: 'string' },
                steadyStateError: { type: 'string' }
              }
            },
            frequencyResponse: {
              type: 'object',
              properties: {
                bandwidth: { type: 'string' },
                gainMargin: { type: 'string' },
                phaseMargin: { type: 'string' }
              }
            },
            disturbanceRejection: { type: 'object' },
            constraints: { type: 'object' },
            robustness: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'control', 'specifications']
}));

export const openLoopAnalysisTask = defineTask('open-loop-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Open-Loop Analysis - ${args.systemName}`,
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'Control Systems Analysis Engineer',
      task: 'Analyze open-loop system characteristics',
      context: {
        systemName: args.systemName,
        plantModel: args.plantModel
      },
      instructions: [
        '1. Calculate poles and zeros of plant',
        '2. Determine open-loop stability',
        '3. Calculate DC gain',
        '4. Generate Bode plot (magnitude and phase)',
        '5. Generate Nyquist plot',
        '6. Generate root locus',
        '7. Determine crossover frequencies',
        '8. Identify resonance or anti-resonance',
        '9. Analyze step response characteristics',
        '10. Document open-loop plant characteristics'
      ],
      outputFormat: 'JSON object with open-loop analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['poles', 'zeros', 'stability'],
      properties: {
        poles: { type: 'array', items: { type: 'object' } },
        zeros: { type: 'array', items: { type: 'object' } },
        stability: { type: 'boolean' },
        dcGain: { type: 'number' },
        bandwidth: { type: 'string' },
        crossoverFrequency: { type: 'string' },
        bodeData: { type: 'object' },
        stepResponse: { type: 'object' },
        characteristics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'control', 'analysis']
}));

export const controllerDesignTask = defineTask('controller-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Controller Design - ${args.systemName}`,
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'Control Systems Design Engineer',
      task: 'Design controller structure and parameters',
      context: {
        systemName: args.systemName,
        plantModel: args.plantModel,
        openLoopAnalysis: args.openLoopAnalysis,
        objectives: args.objectives,
        constraints: args.constraints
      },
      instructions: [
        '1. Select controller type (P, PI, PID, lead-lag, state-space)',
        '2. Design controller using appropriate method (root locus, frequency, pole placement)',
        '3. Calculate initial controller parameters',
        '4. Add feedforward compensation if beneficial',
        '5. Design anti-windup for integral action',
        '6. Include derivative filtering',
        '7. Design setpoint weighting/filtering',
        '8. Consider 2-DOF controller structure',
        '9. Account for implementation constraints',
        '10. Document controller design methodology'
      ],
      outputFormat: 'JSON object with controller design'
    },
    outputSchema: {
      type: 'object',
      required: ['controller', 'controllerType'],
      properties: {
        controllerType: { type: 'string' },
        controller: {
          type: 'object',
          properties: {
            structure: { type: 'string' },
            transferFunction: { type: 'object' },
            parameters: {
              type: 'object',
              properties: {
                Kp: { type: 'number' },
                Ki: { type: 'number' },
                Kd: { type: 'number' },
                Tf: { type: 'number' }
              }
            },
            antiWindup: { type: 'object' },
            setpointFilter: { type: 'object' }
          }
        },
        designMethod: { type: 'string' },
        justification: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'control', 'design', 'pid']
}));

export const closedLoopSimulationTask = defineTask('closed-loop-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Closed-Loop Simulation - ${args.systemName}`,
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'Control Systems Simulation Engineer',
      task: 'Simulate closed-loop performance',
      context: {
        systemName: args.systemName,
        plantModel: args.plantModel,
        controller: args.controller,
        objectives: args.objectives
      },
      instructions: [
        '1. Build closed-loop simulation model',
        '2. Simulate step response',
        '3. Measure settling time, overshoot, rise time',
        '4. Calculate steady-state error',
        '5. Simulate disturbance response',
        '6. Simulate noise response',
        '7. Test setpoint tracking',
        '8. Verify actuator constraints are respected',
        '9. Test with model uncertainty',
        '10. Compare results to specifications'
      ],
      outputFormat: 'JSON object with simulation results'
    },
    outputSchema: {
      type: 'object',
      required: ['results'],
      properties: {
        results: {
          type: 'object',
          properties: {
            stepResponse: {
              type: 'object',
              properties: {
                settlingTime: { type: 'string' },
                riseTime: { type: 'string' },
                overshoot: { type: 'string' },
                steadyStateError: { type: 'string' }
              }
            },
            disturbanceResponse: { type: 'object' },
            noiseResponse: { type: 'object' },
            controlEffort: { type: 'object' },
            meetsSpecs: { type: 'boolean' }
          }
        },
        robustnessTests: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'control', 'simulation']
}));

export const stabilityAnalysisTask = defineTask('stability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Stability Analysis - ${args.systemName}`,
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'Control Systems Stability Analyst',
      task: 'Analyze stability margins (gain, phase)',
      context: {
        systemName: args.systemName,
        plantModel: args.plantModel,
        controller: args.controller,
        closedLoopResults: args.closedLoopResults
      },
      instructions: [
        '1. Calculate open-loop transfer function L(s) = G(s)C(s)',
        '2. Generate Bode plot of open-loop system',
        '3. Calculate gain margin and phase margin',
        '4. Generate Nyquist plot and check encirclements',
        '5. Calculate closed-loop poles',
        '6. Analyze sensitivity function S(s)',
        '7. Analyze complementary sensitivity T(s)',
        '8. Evaluate robustness to gain variations',
        '9. Evaluate robustness to phase variations',
        '10. Assess stability with model uncertainty'
      ],
      outputFormat: 'JSON object with stability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['stable', 'gainMargin', 'phaseMargin'],
      properties: {
        stable: { type: 'boolean' },
        gainMargin: { type: 'string' },
        phaseMargin: { type: 'string' },
        margins: {
          type: 'object',
          properties: {
            gainCrossover: { type: 'string' },
            phaseCrossover: { type: 'string' }
          }
        },
        closedLoopPoles: { type: 'array', items: { type: 'object' } },
        sensitivityPeak: { type: 'string' },
        marginsInadequate: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'control', 'stability']
}));

export const controllerTuningTask = defineTask('controller-tuning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Controller Tuning - ${args.systemName}`,
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'Control Systems Tuning Specialist',
      task: 'Tune controller parameters for optimal performance',
      context: {
        systemName: args.systemName,
        controller: args.controller,
        closedLoopResults: args.closedLoopResults,
        stabilityAnalysis: args.stabilityAnalysis,
        objectives: args.objectives
      },
      instructions: [
        '1. Apply appropriate tuning method (Ziegler-Nichols, Cohen-Coon, IMC, etc.)',
        '2. Fine-tune for desired response characteristics',
        '3. Balance speed of response vs. stability margin',
        '4. Adjust for disturbance rejection',
        '5. Tune derivative action for noise vs. response trade-off',
        '6. Optimize anti-windup parameters',
        '7. Tune setpoint filter if used',
        '8. Verify tuned performance meets specifications',
        '9. Test sensitivity to parameter variations',
        '10. Document final tuning parameters'
      ],
      outputFormat: 'JSON object with tuned controller'
    },
    outputSchema: {
      type: 'object',
      required: ['tunedController', 'parameters'],
      properties: {
        tunedController: {
          type: 'object',
          properties: {
            parameters: { type: 'object' },
            transferFunction: { type: 'object' }
          }
        },
        parameters: {
          type: 'object',
          properties: {
            Kp: { type: 'number' },
            Ki: { type: 'number' },
            Kd: { type: 'number' },
            Tf: { type: 'number' }
          }
        },
        tuningMethod: { type: 'string' },
        performanceAfterTuning: { type: 'object' },
        stabilityAfterTuning: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'control', 'tuning', 'pid']
}));

export const hilValidationTask = defineTask('hil-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: HIL Validation - ${args.systemName}`,
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'Control Systems Validation Engineer',
      task: 'Validate with hardware-in-the-loop testing',
      context: {
        systemName: args.systemName,
        tunedController: args.tunedController,
        plantModel: args.plantModel,
        objectives: args.objectives
      },
      instructions: [
        '1. Set up hardware-in-the-loop test environment',
        '2. Implement controller on target hardware/PLC',
        '3. Configure real-time plant simulation',
        '4. Test step response on actual controller',
        '5. Test disturbance rejection',
        '6. Test setpoint tracking',
        '7. Verify timing and execution',
        '8. Test failure modes and fault handling',
        '9. Compare HIL results to simulation',
        '10. Document validation results'
      ],
      outputFormat: 'JSON object with HIL validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['meetsSpecs', 'performance', 'performanceSummary'],
      properties: {
        meetsSpecs: { type: 'boolean' },
        performance: {
          type: 'object',
          properties: {
            settlingTime: { type: 'string' },
            overshoot: { type: 'string' },
            steadyStateError: { type: 'string' }
          }
        },
        performanceSummary: { type: 'string' },
        hilResults: { type: 'object' },
        documentation: { type: 'object' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'control', 'validation', 'hil']
}));
