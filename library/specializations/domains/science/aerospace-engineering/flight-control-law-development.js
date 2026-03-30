/**
 * @process specializations/domains/science/aerospace-engineering/flight-control-law-development
 * @description Systematic process for developing, tuning, and validating flight control laws including
 * stability augmentation and autopilot modes.
 * @inputs { projectName: string, vehicleModel: object, requirements: object, controlArchitecture?: string }
 * @outputs { success: boolean, controlLaws: object, stabilityAnalysis: object, pilotedSimResults: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/aerospace-engineering/flight-control-law-development', {
 *   projectName: 'Transport Aircraft FCS',
 *   vehicleModel: { type: 'transport', configuration: 'conventional' },
 *   requirements: { hqLevel: 1, category: 'A', missionPhase: 'cruise' }
 * });
 *
 * @references
 * - MIL-STD-1797 Flying Qualities
 * - MIL-HDBK-516C Airworthiness Certification
 * - ARP94910 Flight Control Design Guidelines
 * - AC 25.1329 Flight Guidance Systems
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    vehicleModel,
    requirements,
    controlArchitecture = 'fly-by-wire'
  } = inputs;

  // Phase 1: Requirements Analysis
  const requirementsAnalysis = await ctx.task(fcsRequirementsTask, {
    projectName,
    vehicleModel,
    requirements,
    controlArchitecture
  });

  // Phase 2: Plant Model Development
  const plantModel = await ctx.task(plantModelTask, {
    projectName,
    vehicleModel,
    flightEnvelope: requirementsAnalysis.flightEnvelope
  });

  // Phase 3: Control Architecture Design
  const architectureDesign = await ctx.task(controlArchitectureTask, {
    projectName,
    plantModel,
    requirements: requirementsAnalysis,
    architecture: controlArchitecture
  });

  // Breakpoint: Architecture review
  await ctx.breakpoint({
    question: `Review control architecture for ${projectName}. Architecture: ${architectureDesign.type}. Proceed with control law design?`,
    title: 'Control Architecture Review',
    context: {
      runId: ctx.runId,
      architecture: architectureDesign
    }
  });

  // Phase 4: Inner Loop Design (SAS)
  const innerLoopDesign = await ctx.task(innerLoopDesignTask, {
    projectName,
    plantModel,
    architectureDesign,
    requirements: requirementsAnalysis
  });

  // Phase 5: Outer Loop Design (Autopilot)
  const outerLoopDesign = await ctx.task(outerLoopDesignTask, {
    projectName,
    innerLoopDesign,
    requirements: requirementsAnalysis,
    autopilotModes: requirements.autopilotModes
  });

  // Phase 6: Gain Scheduling
  const gainScheduling = await ctx.task(gainSchedulingTask, {
    projectName,
    innerLoopDesign,
    outerLoopDesign,
    flightEnvelope: requirementsAnalysis.flightEnvelope
  });

  // Phase 7: Linear Stability Analysis
  const stabilityAnalysis = await ctx.task(linearStabilityTask, {
    projectName,
    controlLaws: { innerLoop: innerLoopDesign, outerLoop: outerLoopDesign },
    gainScheduling,
    plantModel
  });

  // Quality Gate: Stability margins
  if (stabilityAnalysis.worstGainMargin < 6 || stabilityAnalysis.worstPhaseMargin < 45) {
    await ctx.breakpoint({
      question: `Stability margins below target. GM: ${stabilityAnalysis.worstGainMargin}dB, PM: ${stabilityAnalysis.worstPhaseMargin}deg. Review design?`,
      title: 'Stability Margin Warning',
      context: {
        runId: ctx.runId,
        stabilityAnalysis
      }
    });
  }

  // Phase 8: Nonlinear Simulation
  const nonlinearSim = await ctx.task(nonlinearSimTask, {
    projectName,
    controlLaws: gainScheduling.scheduledLaws,
    vehicleModel,
    testCases: requirementsAnalysis.testCases
  });

  // Phase 9: Handling Qualities Assessment
  const hqAssessment = await ctx.task(handlingQualitiesTask, {
    projectName,
    nonlinearSim,
    requirements: requirementsAnalysis,
    criteria: requirements.hqCriteria
  });

  // Phase 10: Robustness Analysis
  const robustnessAnalysis = await ctx.task(robustnessAnalysisTask, {
    projectName,
    controlLaws: gainScheduling.scheduledLaws,
    plantModel,
    uncertainties: requirementsAnalysis.uncertainties
  });

  // Phase 11: Piloted Simulation
  const pilotedSim = await ctx.task(pilotedSimTask, {
    projectName,
    controlLaws: gainScheduling.scheduledLaws,
    scenarios: requirementsAnalysis.pilotedScenarios
  });

  // Phase 12: Documentation
  const documentation = await ctx.task(fcsDocumentationTask, {
    projectName,
    requirementsAnalysis,
    architectureDesign,
    innerLoopDesign,
    outerLoopDesign,
    gainScheduling,
    stabilityAnalysis,
    hqAssessment,
    robustnessAnalysis,
    pilotedSim
  });

  // Final Breakpoint: FCS Approval
  await ctx.breakpoint({
    question: `FCS development complete for ${projectName}. HQ Level: ${hqAssessment.overallLevel}. Approve for implementation?`,
    title: 'FCS Development Approval',
    context: {
      runId: ctx.runId,
      summary: {
        hqLevel: hqAssessment.overallLevel,
        stabilityMargins: stabilityAnalysis.worstCase,
        robustnessMargin: robustnessAnalysis.margin
      },
      files: [
        { path: 'artifacts/fcs-design.json', format: 'json', content: documentation },
        { path: 'artifacts/fcs-design.md', format: 'markdown', content: documentation.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    controlLaws: {
      innerLoop: innerLoopDesign,
      outerLoop: outerLoopDesign,
      scheduling: gainScheduling
    },
    stabilityAnalysis: stabilityAnalysis,
    handlingQualities: hqAssessment,
    pilotedSimResults: pilotedSim,
    documentation: documentation,
    metadata: {
      processId: 'specializations/domains/science/aerospace-engineering/flight-control-law-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const fcsRequirementsTask = defineTask('fcs-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `FCS Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Flight Control Systems Engineer',
      task: 'Define flight control system requirements',
      context: args,
      instructions: [
        '1. Define handling qualities requirements (MIL-STD-1797)',
        '2. Establish stability margin requirements',
        '3. Define autopilot mode requirements',
        '4. Establish flight envelope coverage',
        '5. Define failure modes and effects requirements',
        '6. Establish response time requirements',
        '7. Define sensor and actuator requirements',
        '8. Establish uncertainty bounds',
        '9. Define test case matrix',
        '10. Document FCS requirements'
      ],
      outputFormat: 'JSON object with FCS requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['hqRequirements', 'stabilityRequirements', 'flightEnvelope'],
      properties: {
        hqRequirements: { type: 'object' },
        stabilityRequirements: { type: 'object' },
        autopilotModes: { type: 'array', items: { type: 'string' } },
        flightEnvelope: { type: 'object' },
        uncertainties: { type: 'object' },
        testCases: { type: 'array', items: { type: 'object' } },
        pilotedScenarios: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fcs', 'requirements', 'aerospace']
}));

export const plantModelTask = defineTask('plant-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plant Model - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Flight Dynamics Model Engineer',
      task: 'Develop plant model for control design',
      context: args,
      instructions: [
        '1. Extract linear models at design points',
        '2. Identify dominant dynamics modes',
        '3. Model actuator dynamics',
        '4. Model sensor dynamics',
        '5. Include time delays',
        '6. Validate against nonlinear model',
        '7. Create uncertainty models',
        '8. Document plant model',
        '9. Create model library for envelope',
        '10. Export for control design tools'
      ],
      outputFormat: 'JSON object with plant models'
    },
    outputSchema: {
      type: 'object',
      required: ['linearModels', 'actuatorModels'],
      properties: {
        linearModels: { type: 'array', items: { type: 'object' } },
        actuatorModels: { type: 'object' },
        sensorModels: { type: 'object' },
        delays: { type: 'object' },
        modes: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fcs', 'modeling', 'aerospace']
}));

export const controlArchitectureTask = defineTask('control-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Control Architecture - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Control System Architect',
      task: 'Design control system architecture',
      context: args,
      instructions: [
        '1. Select control law structure',
        '2. Define command model',
        '3. Define feedback paths',
        '4. Design feed-forward paths',
        '5. Define mode transitions',
        '6. Design redundancy architecture',
        '7. Define priority and arbitration',
        '8. Design envelope protection',
        '9. Document architecture',
        '10. Create system block diagrams'
      ],
      outputFormat: 'JSON object with control architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['type', 'structure'],
      properties: {
        type: { type: 'string' },
        structure: { type: 'object' },
        commandModel: { type: 'object' },
        feedbackPaths: { type: 'array', items: { type: 'string' } },
        modeTransitions: { type: 'object' },
        envelopeProtection: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fcs', 'architecture', 'aerospace']
}));

export const innerLoopDesignTask = defineTask('inner-loop-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Inner Loop Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Stability Augmentation System Designer',
      task: 'Design inner loop control laws',
      context: args,
      instructions: [
        '1. Design pitch rate feedback (q-feedback)',
        '2. Design roll rate feedback (p-feedback)',
        '3. Design yaw rate feedback (r-feedback)',
        '4. Design angle of attack feedback',
        '5. Design sideslip feedback',
        '6. Tune gains for stability margins',
        '7. Design structural filters',
        '8. Design anti-aliasing filters',
        '9. Verify loop closure stability',
        '10. Document inner loop design'
      ],
      outputFormat: 'JSON object with inner loop design'
    },
    outputSchema: {
      type: 'object',
      required: ['pitchLoop', 'rollLoop', 'yawLoop'],
      properties: {
        pitchLoop: { type: 'object' },
        rollLoop: { type: 'object' },
        yawLoop: { type: 'object' },
        filters: { type: 'object' },
        stabilityMargins: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fcs', 'inner-loop', 'aerospace']
}));

export const outerLoopDesignTask = defineTask('outer-loop-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Outer Loop Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Autopilot Design Engineer',
      task: 'Design outer loop autopilot modes',
      context: args,
      instructions: [
        '1. Design altitude hold mode',
        '2. Design heading hold mode',
        '3. Design speed hold mode',
        '4. Design vertical speed mode',
        '5. Design navigation tracking modes',
        '6. Design approach and landing modes',
        '7. Design autothrottle',
        '8. Design mode transitions',
        '9. Verify nested loop stability',
        '10. Document outer loop design'
      ],
      outputFormat: 'JSON object with outer loop design'
    },
    outputSchema: {
      type: 'object',
      required: ['altitudeHold', 'headingHold', 'speedHold'],
      properties: {
        altitudeHold: { type: 'object' },
        headingHold: { type: 'object' },
        speedHold: { type: 'object' },
        verticalSpeed: { type: 'object' },
        navigationModes: { type: 'object' },
        modeLogic: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fcs', 'outer-loop', 'aerospace']
}));

export const gainSchedulingTask = defineTask('gain-scheduling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Gain Scheduling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gain Scheduling Engineer',
      task: 'Design gain scheduling across flight envelope',
      context: args,
      instructions: [
        '1. Define scheduling variables',
        '2. Design gains at envelope corners',
        '3. Interpolate gains across envelope',
        '4. Verify stability at all points',
        '5. Check transition smoothness',
        '6. Handle gain jumps at boundaries',
        '7. Design anti-windup schemes',
        '8. Verify performance across envelope',
        '9. Document gain schedules',
        '10. Generate gain tables'
      ],
      outputFormat: 'JSON object with gain scheduling'
    },
    outputSchema: {
      type: 'object',
      required: ['scheduledLaws', 'schedulingVariables'],
      properties: {
        scheduledLaws: { type: 'object' },
        schedulingVariables: { type: 'array', items: { type: 'string' } },
        gainTables: { type: 'object' },
        interpolationMethod: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fcs', 'gain-scheduling', 'aerospace']
}));

export const linearStabilityTask = defineTask('linear-stability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Linear Stability Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Control Stability Analysis Engineer',
      task: 'Perform linear stability analysis',
      context: args,
      instructions: [
        '1. Calculate open loop frequency response',
        '2. Compute gain and phase margins',
        '3. Analyze all feedback loops',
        '4. Check multi-loop stability (MIMO)',
        '5. Compute closed-loop poles',
        '6. Analyze sensitivity functions',
        '7. Check stability across envelope',
        '8. Identify worst case conditions',
        '9. Generate Nichols/Bode plots',
        '10. Document stability analysis'
      ],
      outputFormat: 'JSON object with stability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['worstGainMargin', 'worstPhaseMargin', 'worstCase'],
      properties: {
        worstGainMargin: { type: 'number' },
        worstPhaseMargin: { type: 'number' },
        worstCase: { type: 'object' },
        allCases: { type: 'array', items: { type: 'object' } },
        sensitivityFunctions: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fcs', 'stability', 'aerospace']
}));

export const nonlinearSimTask = defineTask('nonlinear-sim', (args, taskCtx) => ({
  kind: 'agent',
  title: `Nonlinear Simulation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Flight Simulation Engineer',
      task: 'Perform nonlinear time-domain simulation',
      context: args,
      instructions: [
        '1. Execute step response tests',
        '2. Execute doublet tests',
        '3. Execute frequency sweep tests',
        '4. Test mode transitions',
        '5. Test limit conditions',
        '6. Test failure scenarios',
        '7. Verify envelope protection',
        '8. Compare with linear predictions',
        '9. Identify nonlinear effects',
        '10. Document simulation results'
      ],
      outputFormat: 'JSON object with simulation results'
    },
    outputSchema: {
      type: 'object',
      required: ['testResults', 'metrics'],
      properties: {
        testResults: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'object' },
        failures: { type: 'array', items: { type: 'object' } },
        nonlinearEffects: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fcs', 'simulation', 'aerospace']
}));

export const handlingQualitiesTask = defineTask('handling-qualities', (args, taskCtx) => ({
  kind: 'agent',
  title: `Handling Qualities Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Handling Qualities Engineer',
      task: 'Assess handling qualities per MIL-STD-1797',
      context: args,
      instructions: [
        '1. Evaluate short period requirements',
        '2. Evaluate phugoid requirements',
        '3. Evaluate dutch roll requirements',
        '4. Evaluate roll mode requirements',
        '5. Evaluate spiral mode requirements',
        '6. Check CAP (Control Anticipation Parameter)',
        '7. Check Gibson criteria',
        '8. Evaluate PIO susceptibility',
        '9. Determine overall HQ level',
        '10. Document HQ assessment'
      ],
      outputFormat: 'JSON object with HQ assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['overallLevel', 'modeAssessments'],
      properties: {
        overallLevel: { type: 'number' },
        modeAssessments: { type: 'object' },
        cap: { type: 'object' },
        pioSusceptibility: { type: 'object' },
        compliance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fcs', 'handling-qualities', 'aerospace']
}));

export const robustnessAnalysisTask = defineTask('robustness-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Robustness Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Robust Control Engineer',
      task: 'Analyze control law robustness',
      context: args,
      instructions: [
        '1. Define uncertainty models',
        '2. Perform structured singular value analysis',
        '3. Compute robustness margins',
        '4. Analyze parameter sensitivity',
        '5. Test worst-case combinations',
        '6. Verify stability with uncertainties',
        '7. Verify performance with uncertainties',
        '8. Identify critical uncertainties',
        '9. Document robustness results',
        '10. Provide design recommendations'
      ],
      outputFormat: 'JSON object with robustness analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['margin', 'criticalUncertainties'],
      properties: {
        margin: { type: 'number' },
        muAnalysis: { type: 'object' },
        criticalUncertainties: { type: 'array', items: { type: 'string' } },
        worstCaseCombination: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fcs', 'robustness', 'aerospace']
}));

export const pilotedSimTask = defineTask('piloted-sim', (args, taskCtx) => ({
  kind: 'agent',
  title: `Piloted Simulation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Piloted Simulation Engineer',
      task: 'Conduct piloted simulation evaluation',
      context: args,
      instructions: [
        '1. Define evaluation tasks',
        '2. Conduct pilot familiarization',
        '3. Execute handling qualities tasks',
        '4. Collect Cooper-Harper ratings',
        '5. Collect pilot comments',
        '6. Test failure scenarios',
        '7. Evaluate workload',
        '8. Identify control deficiencies',
        '9. Compile pilot feedback',
        '10. Document piloted sim results'
      ],
      outputFormat: 'JSON object with piloted sim results'
    },
    outputSchema: {
      type: 'object',
      required: ['cooperHarperRatings', 'pilotComments'],
      properties: {
        cooperHarperRatings: { type: 'object' },
        pilotComments: { type: 'array', items: { type: 'string' } },
        taskPerformance: { type: 'object' },
        deficiencies: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fcs', 'piloted-simulation', 'aerospace']
}));

export const fcsDocumentationTask = defineTask('fcs-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `FCS Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Flight Control Documentation Engineer',
      task: 'Generate FCS design documentation',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document requirements',
        '3. Present control architecture',
        '4. Document inner and outer loop design',
        '5. Present gain schedules',
        '6. Document stability analysis',
        '7. Present handling qualities assessment',
        '8. Document robustness analysis',
        '9. Present piloted simulation results',
        '10. Generate JSON and markdown'
      ],
      outputFormat: 'JSON object with FCS documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'markdown'],
      properties: {
        documentation: { type: 'object' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fcs', 'documentation', 'aerospace']
}));
