/**
 * @process specializations/domains/science/automotive-engineering/steering-system-development
 * @description Steering System Development - Develop steering systems including electric power steering (EPS)
 * calibration, steer-by-wire implementation, and steering feel optimization.
 * @inputs { vehicleProgram: string, steeringType: string, adasIntegration?: boolean, performanceTargets?: object }
 * @outputs { success: boolean, steeringSpecifications: object, epsCalibration: object, feelTuningParameters: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/steering-system-development', {
 *   vehicleProgram: 'EV-Luxury-Sedan',
 *   steeringType: 'rack-mounted-EPS',
 *   adasIntegration: true,
 *   performanceTargets: { onCenterFeel: 8.0, returnability: 7.5, effort: 7.0 }
 * });
 *
 * @references
 * - ISO 13674 Steering Effort Testing
 * - SAE J1100 Vehicle Dimensions
 * - ISO 7401 Road Vehicle Lateral Response
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    vehicleProgram,
    steeringType,
    adasIntegration = false,
    performanceTargets = {}
  } = inputs;

  // Phase 1: Steering Ratio and Effort Targets
  const steeringTargets = await ctx.task(steeringTargetsTask, {
    vehicleProgram,
    steeringType,
    performanceTargets
  });

  // Phase 2: EPS Control Algorithm Development
  const epsControl = await ctx.task(epsControlTask, {
    vehicleProgram,
    steeringTargets,
    steeringType
  });

  // Breakpoint: EPS control review
  await ctx.breakpoint({
    question: `Review EPS control algorithms for ${vehicleProgram}. Approve control architecture?`,
    title: 'EPS Control Review',
    context: {
      runId: ctx.runId,
      vehicleProgram,
      epsControl,
      files: [{
        path: `artifacts/eps-control.json`,
        format: 'json',
        content: epsControl
      }]
    }
  });

  // Phase 3: Steering Feel Calibration
  const feelCalibration = await ctx.task(feelCalibrationTask, {
    vehicleProgram,
    epsControl,
    performanceTargets
  });

  // Phase 4: ADAS Steering Integration
  const adasSteering = await ctx.task(adasSteeringTask, {
    vehicleProgram,
    epsControl,
    adasIntegration
  });

  // Phase 5: Durability and Safety Validation
  const durabilityValidation = await ctx.task(durabilityValidationTask, {
    vehicleProgram,
    epsControl,
    adasSteering
  });

  // Final Breakpoint: Steering system approval
  await ctx.breakpoint({
    question: `Steering System Development complete for ${vehicleProgram}. Steering feel rating: ${feelCalibration.feelRating}. Approve?`,
    title: 'Steering System Approval',
    context: {
      runId: ctx.runId,
      vehicleProgram,
      feelCalibration,
      files: [
        { path: `artifacts/steering-specifications.json`, format: 'json', content: steeringTargets },
        { path: `artifacts/feel-tuning.json`, format: 'json', content: feelCalibration }
      ]
    }
  });

  return {
    success: true,
    vehicleProgram,
    steeringSpecifications: steeringTargets.specifications,
    epsCalibration: epsControl.calibration,
    feelTuningParameters: feelCalibration.parameters,
    adasIntegration: adasSteering.integration,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/steering-system-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

export const steeringTargetsTask = defineTask('steering-targets', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Steering Ratio and Effort Targets - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Steering Systems Engineer',
      task: 'Define steering ratio and effort targets',
      context: args,
      instructions: [
        '1. Define overall steering ratio',
        '2. Specify variable ratio characteristics (if applicable)',
        '3. Define steering effort targets by speed',
        '4. Specify returnability requirements',
        '5. Define on-center feel targets',
        '6. Specify maximum steering angle',
        '7. Define power assist characteristics',
        '8. Specify response time requirements',
        '9. Define compliance requirements',
        '10. Document steering specifications'
      ],
      outputFormat: 'JSON object with steering targets'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications', 'targets', 'characteristics'],
      properties: {
        specifications: { type: 'object' },
        targets: { type: 'object' },
        characteristics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'steering', 'targets', 'specification']
}));

export const epsControlTask = defineTask('eps-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: EPS Control Algorithm Development - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'EPS Control Engineer',
      task: 'Develop EPS control algorithms',
      context: args,
      instructions: [
        '1. Design base assist map',
        '2. Develop speed-dependent assist',
        '3. Implement friction compensation',
        '4. Design returnability algorithm',
        '5. Implement damping control',
        '6. Design active return control',
        '7. Implement torque overlay for ADAS',
        '8. Design fault detection algorithms',
        '9. Implement safe state handling',
        '10. Document control architecture'
      ],
      outputFormat: 'JSON object with EPS control'
    },
    outputSchema: {
      type: 'object',
      required: ['calibration', 'algorithms', 'architecture'],
      properties: {
        calibration: { type: 'object' },
        algorithms: { type: 'array', items: { type: 'object' } },
        architecture: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'steering', 'EPS', 'control']
}));

export const feelCalibrationTask = defineTask('feel-calibration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Steering Feel Calibration - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Steering Feel Engineer',
      task: 'Calibrate steering feel and feedback',
      context: args,
      instructions: [
        '1. Tune on-center feel',
        '2. Calibrate effort build-up',
        '3. Tune road feedback',
        '4. Calibrate self-aligning torque feel',
        '5. Tune cornering feel',
        '6. Calibrate parking feel',
        '7. Tune damping feel',
        '8. Evaluate subjective feel ratings',
        '9. Compare to benchmarks',
        '10. Document tuning parameters'
      ],
      outputFormat: 'JSON object with feel calibration'
    },
    outputSchema: {
      type: 'object',
      required: ['parameters', 'feelRating', 'tuning'],
      properties: {
        parameters: { type: 'object' },
        feelRating: { type: 'number' },
        tuning: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'steering', 'calibration', 'feel']
}));

export const adasSteeringTask = defineTask('adas-steering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: ADAS Steering Integration - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ADAS Steering Integration Engineer',
      task: 'Integrate ADAS steering functions',
      context: args,
      instructions: [
        '1. Define ADAS steering interface',
        '2. Implement lane keeping assist overlay',
        '3. Implement lane centering overlay',
        '4. Design driver override detection',
        '5. Implement arbitration logic',
        '6. Define torque limits for ADAS',
        '7. Implement fault handling',
        '8. Test ADAS steering functions',
        '9. Validate HMI feedback',
        '10. Document ADAS integration'
      ],
      outputFormat: 'JSON object with ADAS steering integration'
    },
    outputSchema: {
      type: 'object',
      required: ['integration', 'interfaces', 'validation'],
      properties: {
        integration: { type: 'object' },
        interfaces: { type: 'array', items: { type: 'object' } },
        validation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'steering', 'ADAS', 'integration']
}));

export const durabilityValidationTask = defineTask('durability-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Durability and Safety Validation - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Steering Validation Engineer',
      task: 'Validate steering durability and safety',
      context: args,
      instructions: [
        '1. Execute durability testing',
        '2. Validate safety requirements',
        '3. Test fault modes',
        '4. Validate assist loss behavior',
        '5. Test environmental conditions',
        '6. Validate EMC performance',
        '7. Execute abuse testing',
        '8. Test regulatory compliance',
        '9. Generate validation reports',
        '10. Document safety evidence'
      ],
      outputFormat: 'JSON object with durability validation'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'safetyStatus', 'durabilityStatus'],
      properties: {
        reports: { type: 'object' },
        safetyStatus: { type: 'string' },
        durabilityStatus: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'steering', 'durability', 'safety']
}));
