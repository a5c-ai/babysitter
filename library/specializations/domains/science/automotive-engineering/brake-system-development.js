/**
 * @process specializations/domains/science/automotive-engineering/brake-system-development
 * @description Brake System Development - Develop brake systems including foundation brakes, electronic
 * stability control (ESC), and regenerative braking integration for electrified vehicles.
 * @inputs { vehicleProgram: string, vehicleType: string, regenBraking?: boolean, performanceTargets?: object }
 * @outputs { success: boolean, brakeSystemDesign: object, escCalibration: object, regenStrategy: object, testReports: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/brake-system-development', {
 *   vehicleProgram: 'EV-SUV-2027',
 *   vehicleType: 'battery-electric',
 *   regenBraking: true,
 *   performanceTargets: { stoppingDistance: 35, pedalFeel: 8.0, regenRecovery: 0.3 }
 * });
 *
 * @references
 * - FMVSS 135 Passenger Car Brake Systems
 * - UN ECE R13H Braking Regulation
 * - ISO 26867 ESC Performance Test
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    vehicleProgram,
    vehicleType,
    regenBraking = false,
    performanceTargets = {}
  } = inputs;

  // Phase 1: Brake System Architecture
  const brakeArchitecture = await ctx.task(brakeArchitectureTask, {
    vehicleProgram,
    vehicleType,
    regenBraking
  });

  // Phase 2: Foundation Brake Design
  const foundationBrakes = await ctx.task(foundationBrakesTask, {
    vehicleProgram,
    brakeArchitecture,
    performanceTargets
  });

  // Breakpoint: Foundation brake review
  await ctx.breakpoint({
    question: `Review foundation brake design for ${vehicleProgram}. Approve design?`,
    title: 'Foundation Brake Review',
    context: {
      runId: ctx.runId,
      vehicleProgram,
      foundationBrakes,
      files: [{
        path: `artifacts/foundation-brakes.json`,
        format: 'json',
        content: foundationBrakes
      }]
    }
  });

  // Phase 3: ESC Control Strategy
  const escControl = await ctx.task(escControlTask, {
    vehicleProgram,
    brakeArchitecture,
    foundationBrakes
  });

  // Phase 4: Regenerative Braking Integration
  const regenIntegration = await ctx.task(regenIntegrationTask, {
    vehicleProgram,
    brakeArchitecture,
    escControl,
    regenBraking
  });

  // Phase 5: Regulatory and Performance Testing
  const brakeTesting = await ctx.task(brakeTestingTask, {
    vehicleProgram,
    foundationBrakes,
    escControl,
    regenIntegration,
    performanceTargets
  });

  // Final Breakpoint: Brake system approval
  await ctx.breakpoint({
    question: `Brake System Development complete for ${vehicleProgram}. Stopping distance: ${brakeTesting.stoppingDistance}m. Approve?`,
    title: 'Brake System Approval',
    context: {
      runId: ctx.runId,
      vehicleProgram,
      brakeTesting,
      files: [
        { path: `artifacts/brake-system-design.json`, format: 'json', content: brakeArchitecture },
        { path: `artifacts/test-reports.json`, format: 'json', content: brakeTesting }
      ]
    }
  });

  return {
    success: true,
    vehicleProgram,
    brakeSystemDesign: brakeArchitecture.design,
    escCalibration: escControl.calibration,
    regenStrategy: regenIntegration.strategy,
    testReports: brakeTesting.reports,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/brake-system-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

export const brakeArchitectureTask = defineTask('brake-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Brake System Architecture - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Brake System Architect',
      task: 'Define brake system architecture',
      context: args,
      instructions: [
        '1. Define brake system topology',
        '2. Select brake-by-wire vs conventional',
        '3. Define hydraulic circuit configuration',
        '4. Specify brake booster type (vacuum, electric)',
        '5. Define ESC/ABS integration',
        '6. Specify parking brake system',
        '7. Define regenerative braking interface',
        '8. Specify pedal feel simulator (if applicable)',
        '9. Define safety redundancy',
        '10. Document architecture specifications'
      ],
      outputFormat: 'JSON object with brake architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'topology', 'specifications'],
      properties: {
        design: { type: 'object' },
        topology: { type: 'object' },
        specifications: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'brakes', 'architecture', 'design']
}));

export const foundationBrakesTask = defineTask('foundation-brakes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Foundation Brake Design - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Foundation Brake Engineer',
      task: 'Design foundation brake components',
      context: args,
      instructions: [
        '1. Size brake rotors (front/rear)',
        '2. Select brake caliper configuration',
        '3. Select friction material',
        '4. Design brake cooling',
        '5. Calculate brake balance',
        '6. Design parking brake mechanism',
        '7. Specify brake wear indicators',
        '8. Calculate thermal capacity',
        '9. Design for NVH (squeal prevention)',
        '10. Document component specifications'
      ],
      outputFormat: 'JSON object with foundation brake design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'components', 'thermalAnalysis'],
      properties: {
        design: { type: 'object' },
        components: { type: 'array', items: { type: 'object' } },
        thermalAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'brakes', 'foundation', 'design']
}));

export const escControlTask = defineTask('esc-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: ESC Control Strategy - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ESC Control Engineer',
      task: 'Develop ESC control strategies',
      context: args,
      instructions: [
        '1. Design ABS control algorithm',
        '2. Design traction control strategy',
        '3. Design yaw stability control',
        '4. Implement rollover mitigation',
        '5. Design brake assist',
        '6. Implement hill hold assist',
        '7. Design trailer stability',
        '8. Calibrate intervention thresholds',
        '9. Implement ADAS brake interface',
        '10. Document control specifications'
      ],
      outputFormat: 'JSON object with ESC control'
    },
    outputSchema: {
      type: 'object',
      required: ['calibration', 'algorithms', 'thresholds'],
      properties: {
        calibration: { type: 'object' },
        algorithms: { type: 'array', items: { type: 'object' } },
        thresholds: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'brakes', 'ESC', 'control']
}));

export const regenIntegrationTask = defineTask('regen-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Regenerative Braking Integration - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Regenerative Braking Engineer',
      task: 'Integrate regenerative braking with friction brakes',
      context: args,
      instructions: [
        '1. Define regen braking strategy',
        '2. Design brake blending algorithm',
        '3. Implement pedal feel consistency',
        '4. Design one-pedal driving mode',
        '5. Handle regen limitations (SOC, temperature)',
        '6. Implement coast regen strategy',
        '7. Design ABS coordination',
        '8. Optimize energy recovery',
        '9. Calibrate brake feel',
        '10. Document regen specifications'
      ],
      outputFormat: 'JSON object with regen integration'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'blending', 'recovery'],
      properties: {
        strategy: { type: 'object' },
        blending: { type: 'object' },
        recovery: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'brakes', 'regenerative', 'EV']
}));

export const brakeTestingTask = defineTask('brake-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Regulatory and Performance Testing - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Brake Test Engineer',
      task: 'Execute brake system testing and validation',
      context: args,
      instructions: [
        '1. Execute FMVSS 135 compliance testing',
        '2. Execute ECE R13H testing',
        '3. Measure stopping distances',
        '4. Test brake fade resistance',
        '5. Validate ABS/ESC performance',
        '6. Test pedal feel',
        '7. Validate regen integration',
        '8. Execute environmental testing',
        '9. Test durability',
        '10. Generate test reports'
      ],
      outputFormat: 'JSON object with brake testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'stoppingDistance', 'compliance'],
      properties: {
        reports: { type: 'object' },
        stoppingDistance: { type: 'number' },
        compliance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'brakes', 'testing', 'validation']
}));
