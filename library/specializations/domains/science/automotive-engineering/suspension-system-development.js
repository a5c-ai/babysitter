/**
 * @process specializations/domains/science/automotive-engineering/suspension-system-development
 * @description Suspension System Development - Design, tune, and validate suspension systems for target ride
 * comfort, handling balance, and durability requirements.
 * @inputs { vehicleProgram: string, vehicleClass: string, performanceTargets?: object, suspensionType?: string }
 * @outputs { success: boolean, suspensionDesign: object, kcData: object, tuningSpecifications: object, validationReports: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/suspension-system-development', {
 *   vehicleProgram: 'EV-Performance-Sedan',
 *   vehicleClass: 'D-Segment',
 *   performanceTargets: { rideComfort: 7.5, handling: 8.0, nvh: 7.0 },
 *   suspensionType: 'multi-link-front-rear'
 * });
 *
 * @references
 * - SAE J670 Vehicle Dynamics Terminology
 * - ISO 2631 Ride Comfort Evaluation
 * - ISO 4138 Handling Testing Standards
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    vehicleProgram,
    vehicleClass,
    performanceTargets = {},
    suspensionType = 'mcpherson-multi-link'
  } = inputs;

  // Phase 1: Suspension Geometry and Kinematics
  const geometryKinematics = await ctx.task(geometryKinematicsTask, {
    vehicleProgram,
    vehicleClass,
    suspensionType
  });

  // Phase 2: Component Specification
  const componentSpec = await ctx.task(componentSpecTask, {
    vehicleProgram,
    geometryKinematics,
    performanceTargets
  });

  // Breakpoint: Component specification review
  await ctx.breakpoint({
    question: `Review suspension component specifications for ${vehicleProgram}. Approve specifications?`,
    title: 'Suspension Component Review',
    context: {
      runId: ctx.runId,
      vehicleProgram,
      componentSpec,
      files: [{
        path: `artifacts/suspension-components.json`,
        format: 'json',
        content: componentSpec
      }]
    }
  });

  // Phase 3: Suspension Tuning
  const suspensionTuning = await ctx.task(suspensionTuningTask, {
    vehicleProgram,
    geometryKinematics,
    componentSpec,
    performanceTargets
  });

  // Phase 4: Ride and Handling Testing
  const rideHandlingTest = await ctx.task(rideHandlingTestTask, {
    vehicleProgram,
    suspensionTuning,
    performanceTargets
  });

  // Phase 5: Durability and NVH Validation
  const durabilityNvh = await ctx.task(durabilityNvhTask, {
    vehicleProgram,
    suspensionTuning,
    componentSpec
  });

  // Final Breakpoint: Suspension approval
  await ctx.breakpoint({
    question: `Suspension System Development complete for ${vehicleProgram}. Ride rating: ${rideHandlingTest.rideRating}, Handling rating: ${rideHandlingTest.handlingRating}. Approve?`,
    title: 'Suspension System Approval',
    context: {
      runId: ctx.runId,
      vehicleProgram,
      rideHandlingTest,
      files: [
        { path: `artifacts/suspension-design.json`, format: 'json', content: geometryKinematics },
        { path: `artifacts/tuning-specifications.json`, format: 'json', content: suspensionTuning }
      ]
    }
  });

  return {
    success: true,
    vehicleProgram,
    suspensionDesign: geometryKinematics.design,
    kcData: geometryKinematics.kcData,
    tuningSpecifications: suspensionTuning.specifications,
    validationReports: {
      rideHandling: rideHandlingTest.reports,
      durability: durabilityNvh.reports
    },
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/suspension-system-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

export const geometryKinematicsTask = defineTask('geometry-kinematics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Suspension Geometry and Kinematics - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Suspension Design Engineer',
      task: 'Define suspension geometry and kinematics',
      context: args,
      instructions: [
        '1. Define suspension architecture (McPherson, double-wishbone, multi-link)',
        '2. Design hard point locations',
        '3. Define wheel travel and jounce/rebound ranges',
        '4. Design camber gain curves',
        '5. Design toe compliance characteristics',
        '6. Define roll center heights',
        '7. Design anti-dive/anti-squat geometry',
        '8. Create K&C simulation models',
        '9. Optimize for target vehicle dynamics',
        '10. Document geometry specifications'
      ],
      outputFormat: 'JSON object with geometry and kinematics'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'kcData', 'hardPoints'],
      properties: {
        design: { type: 'object' },
        kcData: { type: 'object' },
        hardPoints: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'suspension', 'kinematics', 'design']
}));

export const componentSpecTask = defineTask('component-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Component Specification - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Suspension Component Engineer',
      task: 'Specify suspension components',
      context: args,
      instructions: [
        '1. Specify spring rates and characteristics',
        '2. Specify damper characteristics (compression/rebound)',
        '3. Specify bushing properties and compliance',
        '4. Specify stabilizer bar specifications',
        '5. Specify control arm design',
        '6. Specify knuckle/upright design',
        '7. Define bearing specifications',
        '8. Specify bump stops',
        '9. Define component materials',
        '10. Document component specifications'
      ],
      outputFormat: 'JSON object with component specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'specifications'],
      properties: {
        components: { type: 'array', items: { type: 'object' } },
        specifications: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'suspension', 'components', 'specification']
}));

export const suspensionTuningTask = defineTask('suspension-tuning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Suspension Tuning - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vehicle Dynamics Tuning Engineer',
      task: 'Tune suspension for target performance',
      context: args,
      instructions: [
        '1. Tune primary ride frequency',
        '2. Tune damper settings for ride/handling balance',
        '3. Tune roll rate distribution',
        '4. Tune understeer/oversteer balance',
        '5. Tune transient response',
        '6. Tune body control (pitch, heave)',
        '7. Tune steering response coordination',
        '8. Document tuning parameters',
        '9. Create tuning matrices',
        '10. Define variant tuning'
      ],
      outputFormat: 'JSON object with tuning specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications', 'parameters', 'tuningMatrix'],
      properties: {
        specifications: { type: 'object' },
        parameters: { type: 'array', items: { type: 'object' } },
        tuningMatrix: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'suspension', 'tuning', 'dynamics']
}));

export const rideHandlingTestTask = defineTask('ride-handling-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Ride and Handling Testing - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Ride and Handling Test Engineer',
      task: 'Execute ride and handling validation testing',
      context: args,
      instructions: [
        '1. Execute ride comfort evaluation (ISO 2631)',
        '2. Execute handling tests (steady-state, transient)',
        '3. Execute lane change maneuvers',
        '4. Execute brake-in-turn testing',
        '5. Evaluate steering feel',
        '6. Evaluate body control',
        '7. Generate subjective ratings',
        '8. Compare to benchmarks',
        '9. Identify tuning refinements',
        '10. Document test results'
      ],
      outputFormat: 'JSON object with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'rideRating', 'handlingRating'],
      properties: {
        reports: { type: 'object' },
        rideRating: { type: 'number' },
        handlingRating: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'suspension', 'testing', 'validation']
}));

export const durabilityNvhTask = defineTask('durability-nvh', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Durability and NVH Validation - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Durability and NVH Engineer',
      task: 'Validate suspension durability and NVH',
      context: args,
      instructions: [
        '1. Execute durability testing',
        '2. Evaluate component fatigue life',
        '3. Assess road noise transmission',
        '4. Evaluate impact harshness',
        '5. Test bushing durability',
        '6. Validate bearing life',
        '7. Test corrosion resistance',
        '8. Validate joint integrity',
        '9. Generate durability reports',
        '10. Document NVH performance'
      ],
      outputFormat: 'JSON object with durability and NVH results'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'durabilityStatus', 'nvhRating'],
      properties: {
        reports: { type: 'object' },
        durabilityStatus: { type: 'string' },
        nvhRating: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'suspension', 'durability', 'NVH']
}));
