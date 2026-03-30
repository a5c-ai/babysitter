/**
 * @process chemical-engineering/reactor-design
 * @description Select appropriate reactor type and design reactor systems based on kinetics and process requirements
 * @inputs { processName: string, reactionChemistry: object, throughputRequirements: object, safetyConstraints: object, outputDir: string }
 * @outputs { success: boolean, reactorType: string, design: object, safetyAssessment: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    reactionChemistry,
    throughputRequirements,
    safetyConstraints = {},
    kinetics = {},
    outputDir = 'reactor-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Review Reaction Chemistry and Thermodynamics
  ctx.log('info', 'Starting reactor design: Reviewing reaction chemistry');
  const chemistryReviewResult = await ctx.task(chemistryReviewTask, {
    processName,
    reactionChemistry,
    kinetics,
    outputDir
  });

  if (!chemistryReviewResult.success) {
    return {
      success: false,
      error: 'Reaction chemistry review failed',
      details: chemistryReviewResult,
      metadata: { processId: 'chemical-engineering/reactor-design', timestamp: startTime }
    };
  }

  artifacts.push(...chemistryReviewResult.artifacts);

  // Task 2: Select Reactor Type
  ctx.log('info', 'Selecting reactor type');
  const reactorSelectionResult = await ctx.task(reactorTypeSelectionTask, {
    processName,
    chemistryAnalysis: chemistryReviewResult.analysis,
    kinetics,
    throughputRequirements,
    safetyConstraints,
    outputDir
  });

  artifacts.push(...reactorSelectionResult.artifacts);

  // Task 3: Size Reactor for Conversion and Throughput
  ctx.log('info', 'Sizing reactor for required conversion');
  const reactorSizingResult = await ctx.task(reactorSizingTask, {
    processName,
    reactorType: reactorSelectionResult.reactorType,
    kinetics,
    throughputRequirements,
    targetConversion: reactionChemistry.targetConversion,
    outputDir
  });

  artifacts.push(...reactorSizingResult.artifacts);

  // Task 4: Design Heat Transfer Systems
  ctx.log('info', 'Designing heat transfer systems');
  const heatTransferResult = await ctx.task(heatTransferDesignTask, {
    processName,
    reactorType: reactorSelectionResult.reactorType,
    reactorSizing: reactorSizingResult.sizing,
    heatOfReaction: chemistryReviewResult.analysis.heatOfReaction,
    temperatureRequirements: reactionChemistry.temperatureRequirements,
    outputDir
  });

  artifacts.push(...heatTransferResult.artifacts);

  // Task 5: Evaluate Mixing and Mass Transfer
  ctx.log('info', 'Evaluating mixing and mass transfer requirements');
  const mixingResult = await ctx.task(mixingMassTransferTask, {
    processName,
    reactorType: reactorSelectionResult.reactorType,
    reactorSizing: reactorSizingResult.sizing,
    reactionPhases: reactionChemistry.phases,
    kinetics,
    outputDir
  });

  artifacts.push(...mixingResult.artifacts);

  // Task 6: Assess Reactor Safety
  ctx.log('info', 'Assessing reactor safety');
  const safetyAssessmentResult = await ctx.task(reactorSafetyTask, {
    processName,
    reactorType: reactorSelectionResult.reactorType,
    reactorSizing: reactorSizingResult.sizing,
    heatTransferDesign: heatTransferResult.design,
    chemistryAnalysis: chemistryReviewResult.analysis,
    safetyConstraints,
    outputDir
  });

  artifacts.push(...safetyAssessmentResult.artifacts);

  // Breakpoint: Review reactor design
  await ctx.breakpoint({
    question: `Reactor design complete for ${processName}. Type: ${reactorSelectionResult.reactorType}. Volume: ${reactorSizingResult.sizing.volume} m3. Conversion: ${reactorSizingResult.sizing.achievedConversion}%. Safety assessment: ${safetyAssessmentResult.overallRisk}. Review design?`,
    title: 'Reactor Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        reactorType: reactorSelectionResult.reactorType,
        volume: reactorSizingResult.sizing.volume,
        achievedConversion: reactorSizingResult.sizing.achievedConversion,
        heatDuty: heatTransferResult.design.totalHeatDuty,
        overallRisk: safetyAssessmentResult.overallRisk
      }
    }
  });

  // Task 7: Define Operating Envelope
  ctx.log('info', 'Defining operating envelope');
  const operatingEnvelopeResult = await ctx.task(operatingEnvelopeTask, {
    processName,
    reactorType: reactorSelectionResult.reactorType,
    reactorSizing: reactorSizingResult.sizing,
    heatTransferDesign: heatTransferResult.design,
    safetyLimits: safetyAssessmentResult.safetyLimits,
    outputDir
  });

  artifacts.push(...operatingEnvelopeResult.artifacts);

  // Task 8: Generate Design Documentation
  ctx.log('info', 'Generating reactor design documentation');
  const documentationResult = await ctx.task(reactorDocumentationTask, {
    processName,
    reactorType: reactorSelectionResult.reactorType,
    selectionRationale: reactorSelectionResult.rationale,
    sizing: reactorSizingResult.sizing,
    heatTransfer: heatTransferResult.design,
    mixing: mixingResult.design,
    safety: safetyAssessmentResult,
    operatingEnvelope: operatingEnvelopeResult.envelope,
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    reactorType: reactorSelectionResult.reactorType,
    design: {
      sizing: reactorSizingResult.sizing,
      heatTransfer: heatTransferResult.design,
      mixing: mixingResult.design
    },
    safetyAssessment: safetyAssessmentResult,
    operatingEnvelope: operatingEnvelopeResult.envelope,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/reactor-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Chemistry Review
export const chemistryReviewTask = defineTask('chemistry-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review reaction chemistry and thermodynamics',
  agent: {
    name: 'reaction-engineer',
    prompt: {
      role: 'reaction chemistry specialist',
      task: 'Review and analyze reaction chemistry for reactor design',
      context: args,
      instructions: [
        'Analyze main reaction stoichiometry',
        'Identify side reactions and byproducts',
        'Calculate heat of reaction (exothermic/endothermic)',
        'Assess reaction thermodynamics (equilibrium limitations)',
        'Review reaction mechanism if available',
        'Identify catalyst requirements',
        'Assess phase behavior during reaction',
        'Document chemistry constraints for reactor design'
      ],
      outputFormat: 'JSON with chemistry analysis, thermodynamics, constraints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'analysis', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        analysis: {
          type: 'object',
          properties: {
            mainReaction: { type: 'object' },
            sideReactions: { type: 'array' },
            heatOfReaction: { type: 'number' },
            isExothermic: { type: 'boolean' },
            equilibriumLimited: { type: 'boolean' },
            phases: { type: 'array' }
          }
        },
        constraints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'reactor-design', 'chemistry']
}));

// Task 2: Reactor Type Selection
export const reactorTypeSelectionTask = defineTask('reactor-type-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select appropriate reactor type',
  agent: {
    name: 'reaction-engineer',
    prompt: {
      role: 'reactor engineering specialist',
      task: 'Select optimal reactor type based on process requirements',
      context: args,
      instructions: [
        'Evaluate CSTR for well-mixed requirements',
        'Evaluate PFR for plug flow requirements',
        'Evaluate batch reactor for small scale/flexible operation',
        'Evaluate fluidized bed for solid-catalyzed reactions',
        'Evaluate packed bed for heterogeneous catalysis',
        'Consider reaction kinetics and order',
        'Assess heat transfer requirements',
        'Document selection rationale with pros/cons'
      ],
      outputFormat: 'JSON with reactor type, selection rationale, alternatives, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reactorType', 'rationale', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reactorType: { type: 'string' },
        rationale: { type: 'string' },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              pros: { type: 'array' },
              cons: { type: 'array' }
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
  labels: ['agent', 'chemical-engineering', 'reactor-design', 'selection']
}));

// Task 3: Reactor Sizing
export const reactorSizingTask = defineTask('reactor-sizing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Size reactor for conversion and throughput',
  agent: {
    name: 'reaction-engineer',
    prompt: {
      role: 'reactor sizing engineer',
      task: 'Size reactor to achieve required conversion and throughput',
      context: args,
      instructions: [
        'Apply design equation for selected reactor type',
        'Calculate residence time for target conversion',
        'Determine reactor volume from throughput and residence time',
        'For CSTR: Use performance equation for conversion',
        'For PFR: Integrate rate equation over conversion',
        'Calculate number of reactors if staging needed',
        'Verify conversion meets selectivity requirements',
        'Document sizing calculations and assumptions'
      ],
      outputFormat: 'JSON with reactor sizing, conversion achieved, calculations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'sizing', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        sizing: {
          type: 'object',
          properties: {
            volume: { type: 'number' },
            residenceTime: { type: 'number' },
            achievedConversion: { type: 'number' },
            numberOfReactors: { type: 'number' },
            dimensions: { type: 'object' }
          }
        },
        calculations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'reactor-design', 'sizing']
}));

// Task 4: Heat Transfer Design
export const heatTransferDesignTask = defineTask('heat-transfer-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design heat transfer systems for temperature control',
  agent: {
    name: 'reaction-engineer',
    prompt: {
      role: 'reactor heat transfer engineer',
      task: 'Design heat transfer system for reactor temperature control',
      context: args,
      instructions: [
        'Calculate total heat duty from reaction and sensible heat',
        'Select heat transfer medium (steam, cooling water, thermal oil)',
        'Design internal coils or external jacket',
        'Calculate heat transfer area required',
        'Size cooling/heating medium flow rates',
        'Evaluate temperature control strategy',
        'Assess temperature gradients within reactor',
        'Document heat transfer design'
      ],
      outputFormat: 'JSON with heat transfer design, area, medium, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'design', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        design: {
          type: 'object',
          properties: {
            totalHeatDuty: { type: 'number' },
            heatTransferArea: { type: 'number' },
            medium: { type: 'string' },
            configuration: { type: 'string' },
            temperatureControl: { type: 'object' }
          }
        },
        calculations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'reactor-design', 'heat-transfer']
}));

// Task 5: Mixing and Mass Transfer
export const mixingMassTransferTask = defineTask('mixing-mass-transfer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate mixing and mass transfer requirements',
  agent: {
    name: 'reaction-engineer',
    prompt: {
      role: 'mixing and mass transfer engineer',
      task: 'Evaluate and design mixing and mass transfer systems',
      context: args,
      instructions: [
        'Assess mixing requirements for reaction',
        'Calculate Reynolds number and mixing regime',
        'Design agitator type and speed for CSTR',
        'Evaluate gas-liquid mass transfer for multiphase',
        'Calculate mass transfer coefficients if limiting',
        'Size spargers for gas distribution',
        'Assess scale-up implications for mixing',
        'Document mixing design and mass transfer analysis'
      ],
      outputFormat: 'JSON with mixing design, mass transfer analysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'design', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        design: {
          type: 'object',
          properties: {
            agitatorType: { type: 'string' },
            agitatorSpeed: { type: 'number' },
            power: { type: 'number' },
            mixingTime: { type: 'number' },
            massTransferCoefficient: { type: 'number' }
          }
        },
        massTransferLimited: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'reactor-design', 'mixing']
}));

// Task 6: Reactor Safety Assessment
export const reactorSafetyTask = defineTask('reactor-safety', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess reactor safety',
  agent: {
    name: 'reaction-engineer',
    prompt: {
      role: 'reactor safety engineer',
      task: 'Assess reactor safety including thermal runaway potential',
      context: args,
      instructions: [
        'Evaluate thermal runaway potential for exothermic reactions',
        'Calculate adiabatic temperature rise',
        'Assess cooling system failure consequences',
        'Evaluate pressure relief requirements',
        'Identify hazardous material inventories',
        'Assess loss of containment scenarios',
        'Recommend safety instrumented functions',
        'Document safety assessment summary'
      ],
      outputFormat: 'JSON with safety assessment, risks, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'safetyLimits', 'overallRisk', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        overallRisk: { type: 'string' },
        thermalRunawayRisk: { type: 'string' },
        adiabaticTempRise: { type: 'number' },
        safetyLimits: {
          type: 'object',
          properties: {
            maxTemperature: { type: 'number' },
            maxPressure: { type: 'number' },
            minCooling: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'reactor-design', 'safety']
}));

// Task 7: Operating Envelope Definition
export const operatingEnvelopeTask = defineTask('operating-envelope', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define operating envelope',
  agent: {
    name: 'reaction-engineer',
    prompt: {
      role: 'reactor operations engineer',
      task: 'Define safe and efficient operating envelope for reactor',
      context: args,
      instructions: [
        'Define normal operating conditions',
        'Specify operating ranges (min, normal, max)',
        'Identify safe operating limits',
        'Define alarm and trip setpoints',
        'Specify startup and shutdown requirements',
        'Document turndown capabilities',
        'Identify key operating parameters to monitor',
        'Create operating envelope diagram'
      ],
      outputFormat: 'JSON with operating envelope, limits, setpoints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'envelope', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        envelope: {
          type: 'object',
          properties: {
            normalConditions: { type: 'object' },
            operatingRanges: { type: 'object' },
            safetyLimits: { type: 'object' },
            alarmSetpoints: { type: 'object' },
            tripSetpoints: { type: 'object' }
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
  labels: ['agent', 'chemical-engineering', 'reactor-design', 'operations']
}));

// Task 8: Reactor Documentation
export const reactorDocumentationTask = defineTask('reactor-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate reactor design documentation',
  agent: {
    name: 'reaction-engineer',
    prompt: {
      role: 'reactor documentation engineer',
      task: 'Create comprehensive reactor design documentation package',
      context: args,
      instructions: [
        'Document reactor type selection rationale',
        'Include sizing calculations and assumptions',
        'Document heat transfer design',
        'Include mixing design details',
        'Summarize safety assessment findings',
        'Document operating envelope',
        'Include process flow diagram for reactor section',
        'Create design summary report'
      ],
      outputFormat: 'JSON with documentation paths, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'documentPaths', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        documentPaths: {
          type: 'object',
          properties: {
            designReport: { type: 'string' },
            calculations: { type: 'string' },
            safetyAssessment: { type: 'string' }
          }
        },
        summary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'reactor-design', 'documentation']
}));
