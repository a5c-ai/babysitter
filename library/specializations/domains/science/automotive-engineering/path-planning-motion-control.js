/**
 * @process specializations/domains/science/automotive-engineering/path-planning-motion-control
 * @description Path Planning and Motion Control - Develop behavioral planning, trajectory optimization, and
 * vehicle motion control algorithms for autonomous driving and advanced driver assistance systems.
 * @inputs { projectName: string, automationLevel: string, oddDefinition: object, vehicleDynamics?: object }
 * @outputs { success: boolean, planningAlgorithms: object, controlSoftware: object, oddDocumentation: object, validationEvidence: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/path-planning-motion-control', {
 *   projectName: 'Highway-Autopilot-L3',
 *   automationLevel: 'SAE-L3',
 *   oddDefinition: { roadTypes: ['highway'], speedRange: [60, 130], weatherConditions: ['clear', 'light-rain'] },
 *   vehicleDynamics: { mass: 2000, wheelbase: 2.9 }
 * });
 *
 * @references
 * - SAE J3016 Levels of Driving Automation
 * - ISO 21448 SOTIF
 * - ISO 26262 Functional Safety
 * - UN ECE R157 ALKS Regulation
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    automationLevel,
    oddDefinition = {},
    vehicleDynamics = {}
  } = inputs;

  // Phase 1: Operational Design Domain Definition
  const oddSpecification = await ctx.task(oddSpecificationTask, {
    projectName,
    automationLevel,
    oddDefinition
  });

  // Quality Gate: ODD must be completely defined
  if (!oddSpecification.odd) {
    return {
      success: false,
      error: 'ODD not completely defined',
      phase: 'odd-specification',
      planningAlgorithms: null
    };
  }

  // Breakpoint: ODD review
  await ctx.breakpoint({
    question: `Review ODD definition for ${projectName}. Automation level: ${automationLevel}. Approve ODD specification?`,
    title: 'ODD Specification Review',
    context: {
      runId: ctx.runId,
      projectName,
      oddSpecification,
      files: [{
        path: `artifacts/odd-specification.json`,
        format: 'json',
        content: oddSpecification
      }]
    }
  });

  // Phase 2: Behavioral Planning Development
  const behavioralPlanning = await ctx.task(behavioralPlanningTask, {
    projectName,
    oddSpecification,
    automationLevel
  });

  // Phase 3: Trajectory Optimization
  const trajectoryOptimization = await ctx.task(trajectoryOptimizationTask, {
    projectName,
    behavioralPlanning,
    vehicleDynamics,
    oddSpecification
  });

  // Phase 4: Longitudinal Control
  const longitudinalControl = await ctx.task(longitudinalControlTask, {
    projectName,
    trajectoryOptimization,
    vehicleDynamics
  });

  // Phase 5: Lateral Control
  const lateralControl = await ctx.task(lateralControlTask, {
    projectName,
    trajectoryOptimization,
    vehicleDynamics
  });

  // Phase 6: Safety and Comfort Metrics
  const safetyComfortMetrics = await ctx.task(safetyComfortMetricsTask, {
    projectName,
    longitudinalControl,
    lateralControl,
    trajectoryOptimization
  });

  // Quality Gate: Safety metrics check
  if (safetyComfortMetrics.safetyViolations && safetyComfortMetrics.safetyViolations.length > 0) {
    await ctx.breakpoint({
      question: `Safety analysis identified ${safetyComfortMetrics.safetyViolations.length} violations. Review and approve mitigation?`,
      title: 'Safety Metrics Warning',
      context: {
        runId: ctx.runId,
        safetyComfortMetrics,
        recommendation: 'Address all safety violations before deployment'
      }
    });
  }

  // Phase 7: Integration and Validation
  const integrationValidation = await ctx.task(integrationValidationTask, {
    projectName,
    behavioralPlanning,
    trajectoryOptimization,
    longitudinalControl,
    lateralControl,
    oddSpecification
  });

  // Phase 8: Documentation and Release
  const planningRelease = await ctx.task(planningReleaseTask, {
    projectName,
    automationLevel,
    oddSpecification,
    behavioralPlanning,
    trajectoryOptimization,
    longitudinalControl,
    lateralControl,
    safetyComfortMetrics,
    integrationValidation
  });

  // Final Breakpoint: Planning system approval
  await ctx.breakpoint({
    question: `Path Planning and Motion Control complete for ${projectName}. ODD coverage: ${integrationValidation.oddCoverage}%. Approve for vehicle integration?`,
    title: 'Planning System Approval',
    context: {
      runId: ctx.runId,
      projectName,
      planningSummary: planningRelease.summary,
      files: [
        { path: `artifacts/planning-algorithms.json`, format: 'json', content: planningRelease },
        { path: `artifacts/validation-evidence.json`, format: 'json', content: integrationValidation }
      ]
    }
  });

  return {
    success: true,
    projectName,
    planningAlgorithms: {
      behavioral: behavioralPlanning.algorithms,
      trajectory: trajectoryOptimization.algorithms
    },
    controlSoftware: {
      longitudinal: longitudinalControl.software,
      lateral: lateralControl.software
    },
    oddDocumentation: oddSpecification.documentation,
    validationEvidence: integrationValidation.evidence,
    safetyMetrics: safetyComfortMetrics.metrics,
    nextSteps: planningRelease.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/path-planning-motion-control',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const oddSpecificationTask = defineTask('odd-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Operational Design Domain Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ODD Specification Engineer',
      task: 'Define comprehensive Operational Design Domain',
      context: {
        projectName: args.projectName,
        automationLevel: args.automationLevel,
        oddDefinition: args.oddDefinition
      },
      instructions: [
        '1. Define road types and geometries (highway, urban, rural)',
        '2. Specify speed range and traffic conditions',
        '3. Define weather and visibility conditions',
        '4. Specify lighting conditions (day, night, transitions)',
        '5. Define geographic boundaries',
        '6. Specify lane marking requirements',
        '7. Define traffic participant types',
        '8. Specify infrastructure requirements',
        '9. Define ODD exit conditions',
        '10. Document ODD boundaries and limitations'
      ],
      outputFormat: 'JSON object with ODD specification'
    },
    outputSchema: {
      type: 'object',
      required: ['odd', 'exitConditions', 'documentation'],
      properties: {
        odd: {
          type: 'object',
          properties: {
            roadTypes: { type: 'array', items: { type: 'string' } },
            speedRange: { type: 'object' },
            weatherConditions: { type: 'array', items: { type: 'string' } },
            lightingConditions: { type: 'array', items: { type: 'string' } },
            trafficConditions: { type: 'object' },
            geographicBoundaries: { type: 'object' }
          }
        },
        exitConditions: { type: 'array', items: { type: 'object' } },
        documentation: { type: 'object' },
        limitations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'autonomous-driving', 'ODD', 'specification']
}));

export const behavioralPlanningTask = defineTask('behavioral-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Behavioral Planning Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Behavioral Planning Engineer',
      task: 'Develop behavioral planning state machine and decision making',
      context: {
        projectName: args.projectName,
        oddSpecification: args.oddSpecification,
        automationLevel: args.automationLevel
      },
      instructions: [
        '1. Design behavioral state machine',
        '2. Define driving maneuvers (lane keep, lane change, merge)',
        '3. Implement decision making logic',
        '4. Design goal selection and route following',
        '5. Implement traffic rule compliance',
        '6. Design interaction with other road users',
        '7. Handle emergency maneuvers',
        '8. Implement fallback behaviors',
        '9. Design driver handoff procedures (if applicable)',
        '10. Document behavioral specifications'
      ],
      outputFormat: 'JSON object with behavioral planning'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithms', 'stateMachine', 'maneuvers'],
      properties: {
        algorithms: {
          type: 'object',
          properties: {
            decisionMaking: { type: 'string' },
            goalSelection: { type: 'string' },
            interactionModel: { type: 'string' }
          }
        },
        stateMachine: {
          type: 'object',
          properties: {
            states: { type: 'array', items: { type: 'object' } },
            transitions: { type: 'array', items: { type: 'object' } }
          }
        },
        maneuvers: { type: 'array', items: { type: 'object' } },
        fallbackBehaviors: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'autonomous-driving', 'behavioral-planning', 'decision-making']
}));

export const trajectoryOptimizationTask = defineTask('trajectory-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Trajectory Optimization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Trajectory Planning Engineer',
      task: 'Develop trajectory optimization algorithms',
      context: {
        projectName: args.projectName,
        behavioralPlanning: args.behavioralPlanning,
        vehicleDynamics: args.vehicleDynamics,
        oddSpecification: args.oddSpecification
      },
      instructions: [
        '1. Design trajectory representation (splines, polynomials)',
        '2. Implement optimization objective function',
        '3. Define dynamic and kinematic constraints',
        '4. Implement obstacle avoidance constraints',
        '5. Design comfort constraints (jerk, lateral acceleration)',
        '6. Implement real-time trajectory generation',
        '7. Handle dynamic replanning',
        '8. Optimize computational efficiency',
        '9. Validate trajectories against vehicle limits',
        '10. Document algorithm specifications'
      ],
      outputFormat: 'JSON object with trajectory optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithms', 'constraints', 'performance'],
      properties: {
        algorithms: {
          type: 'object',
          properties: {
            representation: { type: 'string' },
            optimizer: { type: 'string' },
            planningHorizon: { type: 'number' },
            updateRate: { type: 'number' }
          }
        },
        constraints: {
          type: 'object',
          properties: {
            kinematic: { type: 'object' },
            dynamic: { type: 'object' },
            comfort: { type: 'object' },
            obstacles: { type: 'object' }
          }
        },
        performance: {
          type: 'object',
          properties: {
            computeTime: { type: 'number' },
            successRate: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'autonomous-driving', 'trajectory', 'optimization']
}));

export const longitudinalControlTask = defineTask('longitudinal-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Longitudinal Control - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Longitudinal Control Engineer',
      task: 'Develop longitudinal (speed/distance) control algorithms',
      context: {
        projectName: args.projectName,
        trajectoryOptimization: args.trajectoryOptimization,
        vehicleDynamics: args.vehicleDynamics
      },
      instructions: [
        '1. Design speed control architecture',
        '2. Implement distance keeping (ACC functionality)',
        '3. Design feedforward/feedback control',
        '4. Implement model-based control (MPC)',
        '5. Handle stop-and-go scenarios',
        '6. Implement emergency braking interface',
        '7. Design comfort tuning (acceleration limits)',
        '8. Handle grade and load compensation',
        '9. Implement actuator interfaces (throttle/brake)',
        '10. Document control specifications'
      ],
      outputFormat: 'JSON object with longitudinal control'
    },
    outputSchema: {
      type: 'object',
      required: ['software', 'controller', 'performance'],
      properties: {
        software: {
          type: 'object',
          properties: {
            architecture: { type: 'string' },
            executionRate: { type: 'number' },
            interfaces: { type: 'array', items: { type: 'string' } }
          }
        },
        controller: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            gains: { type: 'object' },
            limits: { type: 'object' }
          }
        },
        performance: {
          type: 'object',
          properties: {
            speedAccuracy: { type: 'object' },
            distanceAccuracy: { type: 'object' },
            responseTime: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'autonomous-driving', 'control', 'longitudinal']
}));

export const lateralControlTask = defineTask('lateral-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Lateral Control - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Lateral Control Engineer',
      task: 'Develop lateral (steering) control algorithms',
      context: {
        projectName: args.projectName,
        trajectoryOptimization: args.trajectoryOptimization,
        vehicleDynamics: args.vehicleDynamics
      },
      instructions: [
        '1. Design path tracking architecture',
        '2. Implement look-ahead control',
        '3. Design model-based lateral control',
        '4. Implement crosstrack error correction',
        '5. Handle varying speeds and curvatures',
        '6. Design lane centering control',
        '7. Implement steering actuator interface',
        '8. Handle sensor delays and latencies',
        '9. Design yaw rate feedback',
        '10. Document control specifications'
      ],
      outputFormat: 'JSON object with lateral control'
    },
    outputSchema: {
      type: 'object',
      required: ['software', 'controller', 'performance'],
      properties: {
        software: {
          type: 'object',
          properties: {
            architecture: { type: 'string' },
            executionRate: { type: 'number' },
            interfaces: { type: 'array', items: { type: 'string' } }
          }
        },
        controller: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            gains: { type: 'object' },
            lookAheadDistance: { type: 'object' }
          }
        },
        performance: {
          type: 'object',
          properties: {
            crosstrackError: { type: 'object' },
            headingError: { type: 'object' },
            smoothness: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'autonomous-driving', 'control', 'lateral']
}));

export const safetyComfortMetricsTask = defineTask('safety-comfort-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Safety and Comfort Metrics - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Safety and Comfort Engineer',
      task: 'Define and validate safety and comfort metrics',
      context: {
        projectName: args.projectName,
        longitudinalControl: args.longitudinalControl,
        lateralControl: args.lateralControl,
        trajectoryOptimization: args.trajectoryOptimization
      },
      instructions: [
        '1. Define safety metrics (TTC, headway, collision risk)',
        '2. Define comfort metrics (acceleration, jerk, steering rate)',
        '3. Validate against ISO 22179 (comfort)',
        '4. Validate against safety regulations',
        '5. Analyze edge case safety margins',
        '6. Evaluate emergency maneuver capability',
        '7. Measure passenger comfort objectively',
        '8. Compare to human driver benchmarks',
        '9. Identify safety violations',
        '10. Document metrics and thresholds'
      ],
      outputFormat: 'JSON object with safety and comfort metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'safetyViolations', 'comfortRatings'],
      properties: {
        metrics: {
          type: 'object',
          properties: {
            safety: { type: 'object' },
            comfort: { type: 'object' },
            performance: { type: 'object' }
          }
        },
        safetyViolations: { type: 'array', items: { type: 'object' } },
        comfortRatings: {
          type: 'object',
          properties: {
            longitudinal: { type: 'number' },
            lateral: { type: 'number' },
            overall: { type: 'number' }
          }
        },
        benchmarking: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'autonomous-driving', 'safety', 'comfort']
}));

export const integrationValidationTask = defineTask('integration-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Integration and Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Integration Validation Engineer',
      task: 'Integrate and validate planning and control system',
      context: {
        projectName: args.projectName,
        behavioralPlanning: args.behavioralPlanning,
        trajectoryOptimization: args.trajectoryOptimization,
        longitudinalControl: args.longitudinalControl,
        lateralControl: args.lateralControl,
        oddSpecification: args.oddSpecification
      },
      instructions: [
        '1. Integrate planning and control modules',
        '2. Execute SIL (Software-in-the-Loop) validation',
        '3. Execute HIL (Hardware-in-the-Loop) validation',
        '4. Validate ODD coverage',
        '5. Execute scenario-based testing',
        '6. Validate state transitions',
        '7. Test failure modes and fallbacks',
        '8. Measure end-to-end latency',
        '9. Generate validation evidence',
        '10. Document integration test results'
      ],
      outputFormat: 'JSON object with integration validation'
    },
    outputSchema: {
      type: 'object',
      required: ['evidence', 'oddCoverage', 'testResults'],
      properties: {
        evidence: {
          type: 'object',
          properties: {
            silResults: { type: 'object' },
            hilResults: { type: 'object' },
            scenarioResults: { type: 'array', items: { type: 'object' } }
          }
        },
        oddCoverage: { type: 'number' },
        testResults: {
          type: 'object',
          properties: {
            passed: { type: 'number' },
            failed: { type: 'number' },
            blocked: { type: 'number' }
          }
        },
        latencyMeasurements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'autonomous-driving', 'integration', 'validation']
}));

export const planningReleaseTask = defineTask('planning-release', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation and Release - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Planning Systems Release Engineer',
      task: 'Prepare planning and control system release',
      context: {
        projectName: args.projectName,
        automationLevel: args.automationLevel,
        oddSpecification: args.oddSpecification,
        behavioralPlanning: args.behavioralPlanning,
        trajectoryOptimization: args.trajectoryOptimization,
        longitudinalControl: args.longitudinalControl,
        lateralControl: args.lateralControl,
        safetyComfortMetrics: args.safetyComfortMetrics,
        integrationValidation: args.integrationValidation
      },
      instructions: [
        '1. Compile software release package',
        '2. Document algorithm specifications',
        '3. Create ODD documentation',
        '4. Document API and interfaces',
        '5. Compile validation evidence',
        '6. Create calibration guidelines',
        '7. Document known limitations',
        '8. Create release notes',
        '9. Define next steps',
        '10. Archive development artifacts'
      ],
      outputFormat: 'JSON object with planning release'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'release', 'nextSteps'],
      properties: {
        summary: {
          type: 'object',
          properties: {
            automationLevel: { type: 'string' },
            oddCoverage: { type: 'number' },
            safetyRating: { type: 'string' },
            comfortRating: { type: 'number' }
          }
        },
        release: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            components: { type: 'array', items: { type: 'object' } },
            documentation: { type: 'array', items: { type: 'object' } }
          }
        },
        nextSteps: { type: 'array', items: { type: 'object' } },
        limitations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'autonomous-driving', 'release', 'documentation']
}));
