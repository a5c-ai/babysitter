/**
 * @process specializations/domains/science/electrical-engineering/mpc-implementation
 * @description Model Predictive Control Implementation - Guide the implementation of Model Predictive Control (MPC)
 * for advanced process control applications. Covers model development, constraint handling, and real-time implementation.
 * @inputs { systemName: string, processModel: object, controlObjectives: object, constraints: object }
 * @outputs { success: boolean, mpcController: object, modelValidation: object, performanceResults: object, implementation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/mpc-implementation', {
 *   systemName: 'HVAC Zone Control',
 *   processModel: { type: 'state-space', states: 4, inputs: 2, outputs: 2 },
 *   controlObjectives: { trackingError: '<1degC', energyMinimization: true },
 *   constraints: { inputLimits: [0, 100], rateLimits: '10%/min', outputLimits: [18, 26] }
 * });
 *
 * @references
 * - ISA-95 (Enterprise-Control System Integration)
 * - Process Control Best Practices
 * - Model Predictive Control (Rawlings & Mayne)
 * - Industrial MPC Implementation Guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName,
    processModel,
    controlObjectives,
    constraints
  } = inputs;

  // Phase 1: Develop Process Model
  const modelDevelopment = await ctx.task(modelDevelopmentTask, {
    systemName,
    processModel,
    controlObjectives
  });

  // Quality Gate: Model must be adequate for MPC
  if (!modelDevelopment.modelAdequate) {
    return {
      success: false,
      error: 'Process model inadequate for MPC implementation',
      phase: 'model-development',
      issues: modelDevelopment.issues
    };
  }

  // Phase 2: Define Control Objectives and Constraints
  const objectivesConstraints = await ctx.task(objectivesConstraintsTask, {
    systemName,
    model: modelDevelopment.model,
    controlObjectives,
    constraints
  });

  // Breakpoint: Review objectives and constraints
  await ctx.breakpoint({
    question: `Review MPC objectives and constraints for ${systemName}. ${objectivesConstraints.constraintCount} constraints defined. Proceed with controller design?`,
    title: 'Objectives Review',
    context: {
      runId: ctx.runId,
      systemName,
      objectives: objectivesConstraints.objectives,
      constraints: objectivesConstraints.formattedConstraints,
      files: [{
        path: `artifacts/phase2-objectives.json`,
        format: 'json',
        content: objectivesConstraints
      }]
    }
  });

  // Phase 3: Design MPC Controller
  const mpcDesign = await ctx.task(mpcDesignTask, {
    systemName,
    model: modelDevelopment.model,
    objectives: objectivesConstraints.objectives,
    constraints: objectivesConstraints.formattedConstraints
  });

  // Phase 4: Simulate MPC Performance
  const mpcSimulation = await ctx.task(mpcSimulationTask, {
    systemName,
    mpcController: mpcDesign.controller,
    model: modelDevelopment.model,
    objectives: objectivesConstraints.objectives
  });

  // Breakpoint: Review simulation results
  await ctx.breakpoint({
    question: `MPC simulation complete for ${systemName}. Tracking error: ${mpcSimulation.trackingError}. Review results before constraint testing?`,
    title: 'Simulation Review',
    context: {
      runId: ctx.runId,
      simulationResults: mpcSimulation.results,
      files: [{
        path: `artifacts/phase4-simulation.json`,
        format: 'json',
        content: mpcSimulation
      }]
    }
  });

  // Phase 5: Test Constraint Handling and Feasibility
  const constraintTesting = await ctx.task(constraintTestingTask, {
    systemName,
    mpcController: mpcDesign.controller,
    model: modelDevelopment.model,
    constraints: objectivesConstraints.formattedConstraints
  });

  // Quality Gate: Constraints must be handled properly
  if (constraintTesting.infeasibilityIssues && constraintTesting.infeasibilityIssues.length > 0) {
    await ctx.breakpoint({
      question: `Constraint testing found ${constraintTesting.infeasibilityIssues.length} infeasibility scenarios. Review and implement soft constraints?`,
      title: 'Constraint Issues',
      context: {
        runId: ctx.runId,
        issues: constraintTesting.infeasibilityIssues,
        recommendations: constraintTesting.recommendations
      }
    });
  }

  // Phase 6: Implement on Target Controller Platform
  const platformImplementation = await ctx.task(platformImplementationTask, {
    systemName,
    mpcController: mpcDesign.controller,
    model: modelDevelopment.model,
    constraints: objectivesConstraints.formattedConstraints
  });

  // Phase 7: Commission and Tune Online
  const commissioning = await ctx.task(commissioningTask, {
    systemName,
    implementation: platformImplementation,
    mpcController: mpcDesign.controller,
    objectives: objectivesConstraints.objectives
  });

  // Phase 8: Monitor and Maintain Controller Performance
  const performanceMonitoring = await ctx.task(performanceMonitoringTask, {
    systemName,
    commissionedSystem: commissioning.system,
    objectives: objectivesConstraints.objectives,
    constraints: objectivesConstraints.formattedConstraints
  });

  // Final Breakpoint: Implementation Approval
  await ctx.breakpoint({
    question: `MPC implementation complete for ${systemName}. Commissioning: ${commissioning.successful ? 'SUCCESSFUL' : 'NEEDS ATTENTION'}. Approve for production?`,
    title: 'Implementation Approval',
    context: {
      runId: ctx.runId,
      systemName,
      performanceSummary: performanceMonitoring.summary,
      files: [
        { path: `artifacts/mpc-controller.json`, format: 'json', content: mpcDesign.controller },
        { path: `artifacts/mpc-report.md`, format: 'markdown', content: performanceMonitoring.markdown }
      ]
    }
  });

  return {
    success: true,
    systemName,
    mpcController: mpcDesign.controller,
    modelValidation: modelDevelopment.validation,
    performanceResults: {
      simulation: mpcSimulation.results,
      constraintHandling: constraintTesting.results,
      commissioning: commissioning.results
    },
    implementation: {
      platform: platformImplementation.platform,
      executionTime: platformImplementation.executionTime,
      monitoring: performanceMonitoring.monitoringSetup
    },
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/mpc-implementation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const modelDevelopmentTask = defineTask('model-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Model Development - ${args.systemName}`,
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'Process Control Engineer with expertise in system identification',
      task: 'Develop process model for MPC (first-principles or data-driven)',
      context: {
        systemName: args.systemName,
        processModel: args.processModel,
        controlObjectives: args.controlObjectives
      },
      instructions: [
        '1. Determine modeling approach (first-principles, empirical, hybrid)',
        '2. Identify model structure (state-space, transfer function, step response)',
        '3. Collect or generate identification data',
        '4. Identify model parameters',
        '5. Validate model against independent data',
        '6. Assess model accuracy and uncertainty',
        '7. Determine prediction horizon requirements',
        '8. Identify disturbance model',
        '9. Create discrete-time model at control sample rate',
        '10. Document model limitations and valid operating range'
      ],
      outputFormat: 'JSON object with process model'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'modelAdequate', 'validation'],
      properties: {
        model: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            stateSpace: { type: 'object' },
            sampleTime: { type: 'string' },
            disturbanceModel: { type: 'object' }
          }
        },
        modelAdequate: { type: 'boolean' },
        validation: {
          type: 'object',
          properties: {
            fitPercent: { type: 'number' },
            rmse: { type: 'string' },
            crossValidation: { type: 'object' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'mpc', 'modeling']
}));

export const objectivesConstraintsTask = defineTask('objectives-constraints', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Objectives and Constraints - ${args.systemName}`,
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'MPC Design Engineer',
      task: 'Define control objectives and constraints for MPC',
      context: {
        systemName: args.systemName,
        model: args.model,
        controlObjectives: args.controlObjectives,
        constraints: args.constraints
      },
      instructions: [
        '1. Define output tracking objectives and weights',
        '2. Define input usage/economic objectives',
        '3. Specify input constraints (min, max, rate limits)',
        '4. Specify output constraints (min, max)',
        '5. Define soft vs. hard constraints',
        '6. Design constraint softening/slack variables',
        '7. Set terminal constraints if needed',
        '8. Define weighting matrices (Q, R, S)',
        '9. Consider multi-objective trade-offs',
        '10. Document all objectives and constraints'
      ],
      outputFormat: 'JSON object with MPC objectives and constraints'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'formattedConstraints', 'constraintCount'],
      properties: {
        objectives: {
          type: 'object',
          properties: {
            tracking: { type: 'object' },
            economic: { type: 'object' },
            weights: { type: 'object' }
          }
        },
        formattedConstraints: {
          type: 'object',
          properties: {
            inputConstraints: { type: 'object' },
            outputConstraints: { type: 'object' },
            rateConstraints: { type: 'object' },
            softConstraints: { type: 'object' }
          }
        },
        constraintCount: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'mpc', 'objectives', 'constraints']
}));

export const mpcDesignTask = defineTask('mpc-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: MPC Design - ${args.systemName}`,
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'Model Predictive Control Designer',
      task: 'Design MPC controller (horizon, weights, sampling)',
      context: {
        systemName: args.systemName,
        model: args.model,
        objectives: args.objectives,
        constraints: args.constraints
      },
      instructions: [
        '1. Select control sample time',
        '2. Determine prediction horizon (Np)',
        '3. Determine control horizon (Nc)',
        '4. Design state estimator/observer',
        '5. Tune output tracking weights',
        '6. Tune input and input-rate weights',
        '7. Configure QP solver settings',
        '8. Design constraint handling (soft constraints, priorities)',
        '9. Implement reference trajectory handling',
        '10. Document controller parameters'
      ],
      outputFormat: 'JSON object with MPC controller design'
    },
    outputSchema: {
      type: 'object',
      required: ['controller'],
      properties: {
        controller: {
          type: 'object',
          properties: {
            sampleTime: { type: 'string' },
            predictionHorizon: { type: 'number' },
            controlHorizon: { type: 'number' },
            stateEstimator: { type: 'object' },
            weights: { type: 'object' },
            qpSettings: { type: 'object' }
          }
        },
        designRationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'mpc', 'design']
}));

export const mpcSimulationTask = defineTask('mpc-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: MPC Simulation - ${args.systemName}`,
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'MPC Simulation Engineer',
      task: 'Simulate MPC performance',
      context: {
        systemName: args.systemName,
        mpcController: args.mpcController,
        model: args.model,
        objectives: args.objectives
      },
      instructions: [
        '1. Set up closed-loop simulation environment',
        '2. Simulate setpoint tracking response',
        '3. Simulate disturbance rejection',
        '4. Test with model-plant mismatch',
        '5. Evaluate tracking error vs. objectives',
        '6. Analyze input usage and rate-of-change',
        '7. Test across operating range',
        '8. Simulate startup and shutdown scenarios',
        '9. Compare to conventional control baseline',
        '10. Document simulation results'
      ],
      outputFormat: 'JSON object with simulation results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'trackingError'],
      properties: {
        results: {
          type: 'object',
          properties: {
            setpointTracking: { type: 'object' },
            disturbanceRejection: { type: 'object' },
            robustness: { type: 'object' },
            inputUsage: { type: 'object' }
          }
        },
        trackingError: { type: 'string' },
        comparisonToBaseline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'mpc', 'simulation']
}));

export const constraintTestingTask = defineTask('constraint-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Constraint Testing - ${args.systemName}`,
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'MPC Constraint Analysis Engineer',
      task: 'Test constraint handling and feasibility',
      context: {
        systemName: args.systemName,
        mpcController: args.mpcController,
        model: args.model,
        constraints: args.constraints
      },
      instructions: [
        '1. Test hard constraint satisfaction',
        '2. Identify potential infeasibility scenarios',
        '3. Test soft constraint behavior',
        '4. Verify constraint prioritization',
        '5. Test constraint handling at operating limits',
        '6. Verify rate constraint satisfaction',
        '7. Test constraint recovery after violations',
        '8. Evaluate QP solver performance',
        '9. Verify warm-starting effectiveness',
        '10. Document constraint handling results'
      ],
      outputFormat: 'JSON object with constraint testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['results'],
      properties: {
        results: {
          type: 'object',
          properties: {
            hardConstraintSatisfaction: { type: 'boolean' },
            softConstraintBehavior: { type: 'object' },
            qpPerformance: { type: 'object' }
          }
        },
        infeasibilityIssues: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'mpc', 'constraints', 'testing']
}));

export const platformImplementationTask = defineTask('platform-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Platform Implementation - ${args.systemName}`,
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'Industrial MPC Implementation Engineer',
      task: 'Implement MPC on target controller platform',
      context: {
        systemName: args.systemName,
        mpcController: args.mpcController,
        model: args.model,
        constraints: args.constraints
      },
      instructions: [
        '1. Select target platform (PLC, DCS, edge controller)',
        '2. Implement state estimator',
        '3. Implement QP solver or use embedded library',
        '4. Implement constraint handling',
        '5. Configure communication interfaces',
        '6. Implement manual/auto switching',
        '7. Implement bumpless transfer',
        '8. Configure operator interface',
        '9. Verify execution time meets sample rate',
        '10. Document implementation architecture'
      ],
      outputFormat: 'JSON object with implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['platform', 'executionTime'],
      properties: {
        platform: { type: 'string' },
        executionTime: { type: 'string' },
        architecture: { type: 'object' },
        interfaces: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'mpc', 'implementation']
}));

export const commissioningTask = defineTask('commissioning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Commissioning - ${args.systemName}`,
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'MPC Commissioning Engineer',
      task: 'Commission and tune MPC online',
      context: {
        systemName: args.systemName,
        implementation: args.implementation,
        mpcController: args.mpcController,
        objectives: args.objectives
      },
      instructions: [
        '1. Verify all I/O connections',
        '2. Test in simulation mode on actual controller',
        '3. Validate model against actual process',
        '4. Start with conservative tuning',
        '5. Tune observer gains',
        '6. Tune tracking weights',
        '7. Tune constraint handling',
        '8. Test setpoint changes',
        '9. Test disturbance rejection',
        '10. Document commissioning results'
      ],
      outputFormat: 'JSON object with commissioning results'
    },
    outputSchema: {
      type: 'object',
      required: ['successful', 'system', 'results'],
      properties: {
        successful: { type: 'boolean' },
        system: { type: 'object' },
        results: {
          type: 'object',
          properties: {
            modelValidation: { type: 'object' },
            performance: { type: 'object' },
            tuningAdjustments: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'mpc', 'commissioning']
}));

export const performanceMonitoringTask = defineTask('performance-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Performance Monitoring - ${args.systemName}`,
  agent: {
    name: 'control-systems-engineer',
    prompt: {
      role: 'MPC Performance Monitoring Specialist',
      task: 'Monitor and maintain controller performance',
      context: {
        systemName: args.systemName,
        commissionedSystem: args.commissionedSystem,
        objectives: args.objectives,
        constraints: args.constraints
      },
      instructions: [
        '1. Define performance metrics and KPIs',
        '2. Set up real-time performance monitoring',
        '3. Monitor model accuracy over time',
        '4. Track constraint violations',
        '5. Monitor solver performance',
        '6. Detect performance degradation',
        '7. Set up alerting for issues',
        '8. Plan model update schedule',
        '9. Document maintenance procedures',
        '10. Generate performance reports'
      ],
      outputFormat: 'JSON object with monitoring setup'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoringSetup', 'summary'],
      properties: {
        monitoringSetup: {
          type: 'object',
          properties: {
            kpis: { type: 'array', items: { type: 'object' } },
            alertThresholds: { type: 'object' },
            reportingSchedule: { type: 'string' }
          }
        },
        summary: { type: 'string' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'mpc', 'monitoring']
}));
