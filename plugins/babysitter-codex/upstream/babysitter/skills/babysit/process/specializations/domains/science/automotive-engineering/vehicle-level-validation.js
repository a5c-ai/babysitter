/**
 * @process specializations/domains/science/automotive-engineering/vehicle-level-validation
 * @description Vehicle-Level Validation Testing - Execute comprehensive vehicle-level validation including
 * durability testing, performance validation, NVH assessment, and customer-focused evaluation.
 * @inputs { vehicleProgram: string, vehicleType: string, validationScope?: string[], targetMarkets?: string[] }
 * @outputs { success: boolean, validationResults: object, durabilityReports: object, performanceData: object, releaseRecommendation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/vehicle-level-validation', {
 *   vehicleProgram: 'EV-Crossover-2027',
 *   vehicleType: 'battery-electric',
 *   validationScope: ['durability', 'performance', 'NVH', 'thermal', 'EMC'],
 *   targetMarkets: ['North-America', 'Europe', 'China']
 * });
 *
 * @references
 * - SAE J1211 Recommended Environmental Practices
 * - ISO 12405 Electrically Propelled Road Vehicles Test Specification
 * - GMW Standards / Ford CETP / VW TL Standards
 * - UN ECE Regulations
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    vehicleProgram,
    vehicleType,
    validationScope = [],
    targetMarkets = []
  } = inputs;

  // Phase 1: Validation Planning
  const validationPlan = await ctx.task(validationPlanTask, {
    vehicleProgram,
    vehicleType,
    validationScope,
    targetMarkets
  });

  // Phase 2: Durability Validation
  const durabilityValidation = await ctx.task(durabilityValidationTask, {
    vehicleProgram,
    validationPlan
  });

  // Breakpoint: Durability results review
  await ctx.breakpoint({
    question: `Review durability validation results for ${vehicleProgram}. Miles accumulated: ${durabilityValidation.milesAccumulated}. Approve continuation?`,
    title: 'Durability Validation Review',
    context: {
      runId: ctx.runId,
      vehicleProgram,
      durabilityValidation,
      files: [{
        path: `artifacts/durability-results.json`,
        format: 'json',
        content: durabilityValidation
      }]
    }
  });

  // Phase 3: Performance Validation
  const performanceValidation = await ctx.task(performanceValidationTask, {
    vehicleProgram,
    vehicleType,
    validationPlan
  });

  // Phase 4: NVH Validation
  const nvhValidation = await ctx.task(nvhValidationTask, {
    vehicleProgram,
    validationPlan
  });

  // Phase 5: Thermal Validation
  const thermalValidation = await ctx.task(thermalValidationTask, {
    vehicleProgram,
    vehicleType,
    validationPlan
  });

  // Phase 6: EMC Validation
  const emcValidation = await ctx.task(emcValidationTask, {
    vehicleProgram,
    validationPlan
  });

  // Phase 7: Customer Evaluation
  const customerEvaluation = await ctx.task(customerEvaluationTask, {
    vehicleProgram,
    performanceValidation,
    nvhValidation
  });

  // Phase 8: Release Assessment
  const releaseAssessment = await ctx.task(releaseAssessmentTask, {
    vehicleProgram,
    durabilityValidation,
    performanceValidation,
    nvhValidation,
    thermalValidation,
    emcValidation,
    customerEvaluation
  });

  // Final Breakpoint: Vehicle release approval
  await ctx.breakpoint({
    question: `Vehicle-Level Validation complete for ${vehicleProgram}. Overall readiness: ${releaseAssessment.readinessLevel}. Approve for production release?`,
    title: 'Vehicle Release Approval',
    context: {
      runId: ctx.runId,
      vehicleProgram,
      releaseAssessment,
      files: [
        { path: `artifacts/validation-results.json`, format: 'json', content: releaseAssessment },
        { path: `artifacts/durability-reports.json`, format: 'json', content: durabilityValidation }
      ]
    }
  });

  return {
    success: true,
    vehicleProgram,
    validationResults: releaseAssessment.results,
    durabilityReports: durabilityValidation.reports,
    performanceData: performanceValidation.data,
    releaseRecommendation: releaseAssessment.recommendation,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/vehicle-level-validation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

export const validationPlanTask = defineTask('validation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Validation Planning - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vehicle Validation Engineer',
      task: 'Develop comprehensive validation plan',
      context: args,
      instructions: [
        '1. Define validation objectives',
        '2. Identify test requirements per market',
        '3. Define durability test schedule',
        '4. Plan performance validation tests',
        '5. Define NVH test requirements',
        '6. Plan thermal validation',
        '7. Define EMC test requirements',
        '8. Allocate test vehicles',
        '9. Define pass/fail criteria',
        '10. Document validation master plan'
      ],
      outputFormat: 'JSON object with validation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'schedule', 'criteria'],
      properties: {
        plan: { type: 'object' },
        schedule: { type: 'object' },
        criteria: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'validation', 'planning', 'testing']
}));

export const durabilityValidationTask = defineTask('durability-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Durability Validation - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Durability Test Engineer',
      task: 'Execute durability validation testing',
      context: args,
      instructions: [
        '1. Execute proving ground durability',
        '2. Run customer usage simulation',
        '3. Execute accelerated durability',
        '4. Run component endurance tests',
        '5. Execute corrosion testing',
        '6. Run structural durability',
        '7. Execute powertrain durability',
        '8. Monitor warranty indicators',
        '9. Track failure modes',
        '10. Generate durability reports'
      ],
      outputFormat: 'JSON object with durability validation'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'milesAccumulated', 'issues'],
      properties: {
        reports: { type: 'object' },
        milesAccumulated: { type: 'number' },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'validation', 'durability', 'testing']
}));

export const performanceValidationTask = defineTask('performance-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Performance Validation - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Test Engineer',
      task: 'Execute performance validation testing',
      context: args,
      instructions: [
        '1. Measure acceleration performance',
        '2. Validate top speed',
        '3. Test braking performance',
        '4. Measure handling characteristics',
        '5. Validate range (if EV)',
        '6. Test towing capability',
        '7. Measure grade performance',
        '8. Validate launch control',
        '9. Test track performance',
        '10. Generate performance reports'
      ],
      outputFormat: 'JSON object with performance validation'
    },
    outputSchema: {
      type: 'object',
      required: ['data', 'metrics', 'compliance'],
      properties: {
        data: { type: 'object' },
        metrics: { type: 'object' },
        compliance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'validation', 'performance', 'testing']
}));

export const nvhValidationTask = defineTask('nvh-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: NVH Validation - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'NVH Engineer',
      task: 'Execute NVH validation testing',
      context: args,
      instructions: [
        '1. Measure interior noise levels',
        '2. Test road noise isolation',
        '3. Measure wind noise',
        '4. Test powertrain NVH',
        '5. Measure ride quality',
        '6. Test body boom/rumble',
        '7. Measure squeak and rattle',
        '8. Test door closing sounds',
        '9. Validate BSR performance',
        '10. Generate NVH reports'
      ],
      outputFormat: 'JSON object with NVH validation'
    },
    outputSchema: {
      type: 'object',
      required: ['measurements', 'targets', 'issues'],
      properties: {
        measurements: { type: 'object' },
        targets: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'validation', 'NVH', 'testing']
}));

export const thermalValidationTask = defineTask('thermal-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Thermal Validation - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Thermal Validation Engineer',
      task: 'Execute thermal validation testing',
      context: args,
      instructions: [
        '1. Test hot climate performance',
        '2. Test cold climate performance',
        '3. Validate cooling system',
        '4. Test battery thermal (if EV)',
        '5. Validate HVAC performance',
        '6. Test thermal soak recovery',
        '7. Validate altitude performance',
        '8. Test humidity conditions',
        '9. Validate thermal durability',
        '10. Generate thermal reports'
      ],
      outputFormat: 'JSON object with thermal validation'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'climateTests', 'issues'],
      properties: {
        results: { type: 'object' },
        climateTests: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'validation', 'thermal', 'testing']
}));

export const emcValidationTask = defineTask('emc-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: EMC Validation - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'EMC Test Engineer',
      task: 'Execute EMC validation testing',
      context: args,
      instructions: [
        '1. Test radiated emissions',
        '2. Test conducted emissions',
        '3. Validate radiated immunity',
        '4. Test conducted immunity',
        '5. Validate ESD immunity',
        '6. Test bulk current injection',
        '7. Validate magnetic field immunity',
        '8. Test transient immunity',
        '9. Validate antenna performance',
        '10. Generate EMC reports'
      ],
      outputFormat: 'JSON object with EMC validation'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'compliance', 'issues'],
      properties: {
        results: { type: 'object' },
        compliance: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'validation', 'EMC', 'testing']
}));

export const customerEvaluationTask = defineTask('customer-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Customer Evaluation - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Customer Experience Engineer',
      task: 'Execute customer-focused evaluation',
      context: args,
      instructions: [
        '1. Conduct subjective ride evaluation',
        '2. Evaluate drivability',
        '3. Assess ergonomics',
        '4. Evaluate interior quality',
        '5. Test infotainment usability',
        '6. Assess visibility',
        '7. Evaluate ingress/egress',
        '8. Test cargo functionality',
        '9. Conduct competitive benchmarking',
        '10. Generate customer evaluation reports'
      ],
      outputFormat: 'JSON object with customer evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['ratings', 'feedback', 'recommendations'],
      properties: {
        ratings: { type: 'object' },
        feedback: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'validation', 'customer', 'evaluation']
}));

export const releaseAssessmentTask = defineTask('release-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Release Assessment - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vehicle Release Manager',
      task: 'Assess vehicle readiness for production release',
      context: args,
      instructions: [
        '1. Consolidate all validation results',
        '2. Assess open issues',
        '3. Evaluate risk level',
        '4. Check regulatory compliance',
        '5. Assess quality metrics',
        '6. Evaluate warranty risk',
        '7. Review customer satisfaction prediction',
        '8. Assess production readiness',
        '9. Generate release recommendation',
        '10. Document release assessment'
      ],
      outputFormat: 'JSON object with release assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'readinessLevel', 'recommendation'],
      properties: {
        results: { type: 'object' },
        readinessLevel: { type: 'string' },
        recommendation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'validation', 'release', 'assessment']
}));
