/**
 * @process specializations/domains/science/aerospace-engineering/handling-qualities-assessment
 * @description Process for evaluating aircraft handling qualities against military and civil standards
 * including Cooper-Harper ratings and MIL-STD-1797 compliance.
 * @inputs { projectName: string, vehicleData: object, standards: string, missionPhases?: array }
 * @outputs { success: boolean, hqAssessment: object, complianceMatrix: object, recommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/aerospace-engineering/handling-qualities-assessment', {
 *   projectName: 'Fighter HQ Evaluation',
 *   vehicleData: { type: 'fighter', aeroDatabase: 'aero-db.json' },
 *   standards: 'MIL-STD-1797B',
 *   missionPhases: ['takeoff', 'cruise', 'combat', 'landing']
 * });
 *
 * @references
 * - MIL-STD-1797B Flying Qualities of Piloted Aircraft
 * - MIL-HDBK-1797 Flying Qualities Handbook
 * - Cooper-Harper Rating Scale
 * - FAR/CS 25.143-175 Controllability and Maneuverability
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    vehicleData,
    standards,
    missionPhases = ['all']
  } = inputs;

  // Phase 1: Requirements and Standards Definition
  const standardsDefinition = await ctx.task(standardsDefinitionTask, {
    projectName,
    standards,
    missionPhases,
    vehicleClass: vehicleData.class
  });

  // Phase 2: Flight Dynamics Analysis
  const flightDynamics = await ctx.task(flightDynamicsAnalysisTask, {
    projectName,
    vehicleData,
    flightConditions: standardsDefinition.flightConditions
  });

  // Phase 3: Modal Analysis
  const modalAnalysis = await ctx.task(modalAnalysisTask, {
    projectName,
    flightDynamics,
    requirements: standardsDefinition.modalRequirements
  });

  // Breakpoint: Modal characteristics review
  await ctx.breakpoint({
    question: `Review modal characteristics for ${projectName}. Short period damping range: ${modalAnalysis.shortPeriod.dampingRange}. Proceed with HQ assessment?`,
    title: 'Modal Analysis Review',
    context: {
      runId: ctx.runId,
      modalAnalysis
    }
  });

  // Phase 4: Longitudinal HQ Assessment
  const longitudinalHQ = await ctx.task(longitudinalHQTask, {
    projectName,
    flightDynamics,
    modalAnalysis,
    requirements: standardsDefinition.longitudinalRequirements
  });

  // Phase 5: Lateral-Directional HQ Assessment
  const latDirHQ = await ctx.task(lateralDirectionalHQTask, {
    projectName,
    flightDynamics,
    modalAnalysis,
    requirements: standardsDefinition.latDirRequirements
  });

  // Phase 6: Control Power Assessment
  const controlPower = await ctx.task(controlPowerTask, {
    projectName,
    vehicleData,
    flightDynamics,
    requirements: standardsDefinition.controlPowerRequirements
  });

  // Phase 7: Trim Capability Assessment
  const trimAssessment = await ctx.task(trimAssessmentTask, {
    projectName,
    vehicleData,
    flightConditions: standardsDefinition.flightConditions
  });

  // Phase 8: PIO Susceptibility Assessment
  const pioAssessment = await ctx.task(pioAssessmentTask, {
    projectName,
    flightDynamics,
    controlSystem: vehicleData.controlSystem
  });

  // Quality Gate: PIO susceptibility
  if (pioAssessment.category > 2) {
    await ctx.breakpoint({
      question: `PIO susceptibility Category ${pioAssessment.category} identified. Review control system or accept risk?`,
      title: 'PIO Susceptibility Warning',
      context: {
        runId: ctx.runId,
        pioAssessment,
        recommendation: 'Consider control law modifications'
      }
    });
  }

  // Phase 9: Special Cases Assessment
  const specialCases = await ctx.task(specialCasesTask, {
    projectName,
    vehicleData,
    standards,
    flightConditions: standardsDefinition.flightConditions
  });

  // Phase 10: Compliance Matrix Generation
  const complianceMatrix = await ctx.task(complianceMatrixTask, {
    projectName,
    longitudinalHQ,
    latDirHQ,
    controlPower,
    trimAssessment,
    pioAssessment,
    specialCases,
    standards
  });

  // Phase 11: Report Generation
  const reportGeneration = await ctx.task(hqReportTask, {
    projectName,
    standardsDefinition,
    modalAnalysis,
    longitudinalHQ,
    latDirHQ,
    controlPower,
    trimAssessment,
    pioAssessment,
    complianceMatrix
  });

  // Final Breakpoint: HQ Assessment Approval
  await ctx.breakpoint({
    question: `HQ assessment complete for ${projectName}. Overall Level: ${complianceMatrix.overallLevel}. Approve assessment?`,
    title: 'HQ Assessment Approval',
    context: {
      runId: ctx.runId,
      summary: {
        overallLevel: complianceMatrix.overallLevel,
        longitudinalLevel: longitudinalHQ.level,
        latDirLevel: latDirHQ.level,
        deficiencies: complianceMatrix.deficiencies
      },
      files: [
        { path: 'artifacts/hq-assessment.json', format: 'json', content: reportGeneration },
        { path: 'artifacts/hq-assessment.md', format: 'markdown', content: reportGeneration.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    hqAssessment: {
      overallLevel: complianceMatrix.overallLevel,
      longitudinal: longitudinalHQ,
      lateralDirectional: latDirHQ,
      controlPower: controlPower,
      pio: pioAssessment
    },
    complianceMatrix: complianceMatrix,
    recommendations: complianceMatrix.recommendations,
    report: reportGeneration,
    metadata: {
      processId: 'specializations/domains/science/aerospace-engineering/handling-qualities-assessment',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const standardsDefinitionTask = defineTask('standards-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Standards Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Flying Qualities Standards Engineer',
      task: 'Define applicable handling qualities standards and requirements',
      context: args,
      instructions: [
        '1. Identify applicable standards (MIL-STD-1797, FAR/CS 25)',
        '2. Define aircraft class and category',
        '3. Define flight phases to evaluate',
        '4. Extract modal requirements for each phase',
        '5. Define control power requirements',
        '6. Define trim requirements',
        '7. Define special case requirements',
        '8. Document flight condition matrix',
        '9. Define acceptance criteria',
        '10. Document standards rationale'
      ],
      outputFormat: 'JSON object with standards and requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['modalRequirements', 'flightConditions'],
      properties: {
        standard: { type: 'string' },
        aircraftClass: { type: 'string' },
        flightPhases: { type: 'array', items: { type: 'string' } },
        modalRequirements: { type: 'object' },
        longitudinalRequirements: { type: 'object' },
        latDirRequirements: { type: 'object' },
        controlPowerRequirements: { type: 'object' },
        flightConditions: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['handling-qualities', 'standards', 'aerospace']
}));

export const flightDynamicsAnalysisTask = defineTask('flight-dynamics-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Flight Dynamics Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Flight Dynamics Engineer',
      task: 'Analyze aircraft flight dynamics characteristics',
      context: args,
      instructions: [
        '1. Extract trim states at flight conditions',
        '2. Compute stability derivatives',
        '3. Calculate aerodynamic coefficients',
        '4. Analyze static stability',
        '5. Calculate control derivatives',
        '6. Analyze weight and CG effects',
        '7. Document dynamic pressure effects',
        '8. Create linearized models',
        '9. Validate against nonlinear sim',
        '10. Document flight dynamics data'
      ],
      outputFormat: 'JSON object with flight dynamics analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['stabilityDerivatives', 'controlDerivatives'],
      properties: {
        stabilityDerivatives: { type: 'object' },
        controlDerivatives: { type: 'object' },
        staticStability: { type: 'object' },
        trimStates: { type: 'array', items: { type: 'object' } },
        linearModels: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['handling-qualities', 'flight-dynamics', 'aerospace']
}));

export const modalAnalysisTask = defineTask('modal-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Modal Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aircraft Modal Analysis Engineer',
      task: 'Analyze aircraft dynamic modes',
      context: args,
      instructions: [
        '1. Calculate short period characteristics',
        '2. Calculate phugoid characteristics',
        '3. Calculate dutch roll characteristics',
        '4. Calculate roll mode time constant',
        '5. Calculate spiral mode characteristics',
        '6. Analyze coupling between modes',
        '7. Track mode variation with flight condition',
        '8. Compare with MIL-STD requirements',
        '9. Identify mode crossovers',
        '10. Document modal characteristics'
      ],
      outputFormat: 'JSON object with modal analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['shortPeriod', 'phugoid', 'dutchRoll'],
      properties: {
        shortPeriod: {
          type: 'object',
          properties: {
            frequency: { type: 'number' },
            damping: { type: 'number' },
            dampingRange: { type: 'string' }
          }
        },
        phugoid: { type: 'object' },
        dutchRoll: { type: 'object' },
        rollMode: { type: 'object' },
        spiralMode: { type: 'object' },
        modeCoupling: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['handling-qualities', 'modal-analysis', 'aerospace']
}));

export const longitudinalHQTask = defineTask('longitudinal-hq', (args, taskCtx) => ({
  kind: 'agent',
  title: `Longitudinal HQ Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Longitudinal Handling Qualities Engineer',
      task: 'Assess longitudinal handling qualities',
      context: args,
      instructions: [
        '1. Evaluate short period damping vs frequency',
        '2. Calculate CAP (Control Anticipation Parameter)',
        '3. Evaluate n/alpha response',
        '4. Check Gibson criteria',
        '5. Evaluate pitch attitude bandwidth',
        '6. Check equivalent time delay',
        '7. Evaluate phugoid characteristics',
        '8. Assess stick force per g',
        '9. Determine longitudinal HQ level',
        '10. Document assessment results'
      ],
      outputFormat: 'JSON object with longitudinal HQ assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['level', 'cap', 'shortPeriodAssessment'],
      properties: {
        level: { type: 'number' },
        cap: { type: 'object' },
        shortPeriodAssessment: { type: 'object' },
        gibsonCriteria: { type: 'object' },
        bandwidth: { type: 'object' },
        phugoidAssessment: { type: 'object' },
        stickForcePerG: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['handling-qualities', 'longitudinal', 'aerospace']
}));

export const lateralDirectionalHQTask = defineTask('lateral-directional-hq', (args, taskCtx) => ({
  kind: 'agent',
  title: `Lateral-Directional HQ Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Lateral-Directional HQ Engineer',
      task: 'Assess lateral-directional handling qualities',
      context: args,
      instructions: [
        '1. Evaluate dutch roll damping vs frequency',
        '2. Calculate phi/beta ratio',
        '3. Evaluate roll mode time constant',
        '4. Check spiral stability',
        '5. Evaluate roll response (p/delta_a)',
        '6. Check yaw due to aileron (adverse yaw)',
        '7. Evaluate coordinated turn capability',
        '8. Assess lateral-directional coupling',
        '9. Determine lat-dir HQ level',
        '10. Document assessment results'
      ],
      outputFormat: 'JSON object with lateral-directional HQ assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['level', 'dutchRollAssessment', 'rollModeAssessment'],
      properties: {
        level: { type: 'number' },
        dutchRollAssessment: { type: 'object' },
        rollModeAssessment: { type: 'object' },
        spiralAssessment: { type: 'object' },
        phiBetaRatio: { type: 'object' },
        adverseYaw: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['handling-qualities', 'lateral-directional', 'aerospace']
}));

export const controlPowerTask = defineTask('control-power', (args, taskCtx) => ({
  kind: 'agent',
  title: `Control Power Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Control Power Assessment Engineer',
      task: 'Assess control surface effectiveness and authority',
      context: args,
      instructions: [
        '1. Calculate pitch control power',
        '2. Calculate roll control power',
        '3. Calculate yaw control power',
        '4. Evaluate control power at limits',
        '5. Check asymmetric thrust control',
        '6. Evaluate crosswind control',
        '7. Check control power margins',
        '8. Assess control harmony',
        '9. Evaluate control sensitivity',
        '10. Document control power assessment'
      ],
      outputFormat: 'JSON object with control power assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['pitchPower', 'rollPower', 'yawPower'],
      properties: {
        pitchPower: { type: 'object' },
        rollPower: { type: 'object' },
        yawPower: { type: 'object' },
        margins: { type: 'object' },
        harmony: { type: 'object' },
        sensitivity: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['handling-qualities', 'control-power', 'aerospace']
}));

export const trimAssessmentTask = defineTask('trim-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trim Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Aircraft Trim Engineer',
      task: 'Assess trim capability and characteristics',
      context: args,
      instructions: [
        '1. Calculate trim across CG range',
        '2. Evaluate trim changes with speed',
        '3. Assess trim authority and margins',
        '4. Evaluate mistrim capability',
        '5. Check trim rate requirements',
        '6. Assess trim feel forces',
        '7. Evaluate runaway trim protection',
        '8. Check asymmetric trim capability',
        '9. Document trim characteristics',
        '10. Verify compliance with requirements'
      ],
      outputFormat: 'JSON object with trim assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['trimCapability', 'trimMargins'],
      properties: {
        trimCapability: { type: 'object' },
        trimMargins: { type: 'object' },
        trimRates: { type: 'object' },
        trimForces: { type: 'object' },
        cgRange: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['handling-qualities', 'trim', 'aerospace']
}));

export const pioAssessmentTask = defineTask('pio-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `PIO Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'PIO Analysis Engineer',
      task: 'Assess pilot-induced oscillation susceptibility',
      context: args,
      instructions: [
        '1. Analyze pitch attitude PIO criteria',
        '2. Analyze roll attitude PIO criteria',
        '3. Check Neal-Smith criteria',
        '4. Apply Bandwidth-Phase Delay criteria',
        '5. Analyze Smith-Geddes criteria',
        '6. Check for rate limiting effects',
        '7. Analyze actuator saturation effects',
        '8. Evaluate Category I, II, III PIO potential',
        '9. Document PIO susceptibility',
        '10. Provide mitigation recommendations'
      ],
      outputFormat: 'JSON object with PIO assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['category', 'susceptibility'],
      properties: {
        category: { type: 'number' },
        susceptibility: { type: 'string' },
        nealSmith: { type: 'object' },
        bandwidthPhaseDelay: { type: 'object' },
        rateLimitingEffects: { type: 'object' },
        mitigations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['handling-qualities', 'pio', 'aerospace']
}));

export const specialCasesTask = defineTask('special-cases', (args, taskCtx) => ({
  kind: 'agent',
  title: `Special Cases Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Special Flight Conditions Engineer',
      task: 'Assess handling qualities for special cases',
      context: args,
      instructions: [
        '1. Evaluate stall characteristics',
        '2. Assess spin resistance and recovery',
        '3. Evaluate crosswind capabilities',
        '4. Assess engine failure handling',
        '5. Evaluate icing effects',
        '6. Assess ground handling',
        '7. Evaluate go-around capability',
        '8. Assess autorotation (if applicable)',
        '9. Document special case compliance',
        '10. Identify any deficiencies'
      ],
      outputFormat: 'JSON object with special cases assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['stallCharacteristics', 'engineFailure'],
      properties: {
        stallCharacteristics: { type: 'object' },
        spinCharacteristics: { type: 'object' },
        crosswindCapability: { type: 'object' },
        engineFailure: { type: 'object' },
        icingEffects: { type: 'object' },
        groundHandling: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['handling-qualities', 'special-cases', 'aerospace']
}));

export const complianceMatrixTask = defineTask('compliance-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compliance Matrix - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HQ Compliance Engineer',
      task: 'Generate handling qualities compliance matrix',
      context: args,
      instructions: [
        '1. Compile all HQ assessments',
        '2. Determine overall HQ level',
        '3. Identify deficiencies',
        '4. Document partial compliances',
        '5. Identify improvement opportunities',
        '6. Generate compliance matrix',
        '7. Document test evidence',
        '8. Provide recommendations',
        '9. Identify certification path',
        '10. Create compliance summary'
      ],
      outputFormat: 'JSON object with compliance matrix'
    },
    outputSchema: {
      type: 'object',
      required: ['overallLevel', 'complianceItems', 'deficiencies'],
      properties: {
        overallLevel: { type: 'number' },
        complianceItems: { type: 'array', items: { type: 'object' } },
        deficiencies: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        certificationPath: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['handling-qualities', 'compliance', 'aerospace']
}));

export const hqReportTask = defineTask('hq-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `HQ Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Handling Qualities Report Engineer',
      task: 'Generate handling qualities assessment report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document applicable standards',
        '3. Present modal analysis results',
        '4. Present longitudinal HQ assessment',
        '5. Present lateral-directional assessment',
        '6. Present control power assessment',
        '7. Present PIO assessment',
        '8. Present compliance matrix',
        '9. Provide conclusions and recommendations',
        '10. Generate JSON and markdown'
      ],
      outputFormat: 'JSON object with HQ report'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'markdown'],
      properties: {
        report: { type: 'object' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['handling-qualities', 'reporting', 'aerospace']
}));
