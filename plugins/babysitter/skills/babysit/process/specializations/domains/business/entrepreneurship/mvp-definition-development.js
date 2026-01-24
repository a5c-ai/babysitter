/**
 * @process specializations/domains/business/entrepreneurship/mvp-definition-development
 * @description MVP Definition and Development Process - Structured approach to defining and building minimum viable products that test core value propositions with minimal investment.
 * @inputs { companyName: string, valueHypothesis: string, targetCustomers: array, constraints?: object }
 * @outputs { success: boolean, mvpSpecification: object, mvpType: string, testPlan: object, learningDocumentation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/mvp-definition-development', {
 *   companyName: 'LeanCo',
 *   valueHypothesis: 'Users will pay for automated expense tracking',
 *   targetCustomers: ['Freelancers', 'Small business owners']
 * });
 *
 * @references
 * - Lean Startup: https://theleanstartup.com/
 * - Running Lean: https://leanstack.com/running-lean-book
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { companyName, valueHypothesis, targetCustomers = [], constraints = {} } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MVP Definition for ${companyName}`);

  // Phase 1: Value Hypothesis Identification
  const valueHypothesisAnalysis = await ctx.task(valueHypothesisTask, { companyName, valueHypothesis, targetCustomers });
  artifacts.push(...(valueHypothesisAnalysis.artifacts || []));

  // Phase 2: Minimum Feature Set
  const featureSet = await ctx.task(minimumFeatureSetTask, { companyName, valueHypothesisAnalysis });
  artifacts.push(...(featureSet.artifacts || []));

  // Phase 3: MVP Type Selection
  const mvpTypeSelection = await ctx.task(mvpTypeSelectionTask, { companyName, featureSet, constraints });
  artifacts.push(...(mvpTypeSelection.artifacts || []));

  // Phase 4: MVP Specification
  const mvpSpec = await ctx.task(mvpSpecificationTask, { companyName, mvpTypeSelection, featureSet });
  artifacts.push(...(mvpSpec.artifacts || []));

  // Breakpoint: Review MVP spec
  await ctx.breakpoint({
    question: `Review MVP specification for ${companyName}. Type: ${mvpTypeSelection.selectedType}. Proceed with test planning?`,
    title: 'MVP Specification Review',
    context: { runId: ctx.runId, companyName, mvpType: mvpTypeSelection.selectedType, files: artifacts }
  });

  // Phase 5: Test Plan Development
  const testPlan = await ctx.task(testPlanTask, { companyName, mvpSpec, valueHypothesisAnalysis });
  artifacts.push(...(testPlan.artifacts || []));

  // Phase 6: Success Metrics Definition
  const successMetrics = await ctx.task(successMetricsTask, { companyName, valueHypothesisAnalysis, testPlan });
  artifacts.push(...(successMetrics.artifacts || []));

  // Phase 7: Learning Documentation Framework
  const learningFramework = await ctx.task(learningFrameworkTask, { companyName, testPlan, successMetrics });
  artifacts.push(...(learningFramework.artifacts || []));

  const endTime = ctx.now();

  return {
    success: true, companyName,
    mvpSpecification: mvpSpec,
    mvpType: mvpTypeSelection.selectedType,
    testPlan,
    learningDocumentation: learningFramework,
    successMetrics,
    artifacts, duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/entrepreneurship/mvp-definition-development', timestamp: startTime, version: '1.0.0' }
  };
}

export const valueHypothesisTask = defineTask('value-hypothesis', (args, taskCtx) => ({
  kind: 'agent', title: `Value Hypothesis - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Lean Startup Expert', task: 'Analyze core value hypothesis', context: args,
    instructions: ['1. Articulate value hypothesis clearly', '2. Identify core assumption', '3. Define customer job-to-be-done', '4. Identify pain point addressed', '5. Define gain created', '6. Assess hypothesis risk level', '7. Identify testable elements', '8. Define success criteria', '9. Map to customer segments', '10. Prioritize hypothesis testing'],
    outputFormat: 'JSON with hypothesis, assumptions, testableElements' },
    outputSchema: { type: 'object', required: ['hypothesis', 'coreAssumption'], properties: { hypothesis: { type: 'string' }, coreAssumption: { type: 'string' }, painPoint: { type: 'string' }, testableElements: { type: 'array', items: { type: 'string' } }, successCriteria: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'mvp', 'hypothesis']
}));

export const minimumFeatureSetTask = defineTask('minimum-feature-set', (args, taskCtx) => ({
  kind: 'agent', title: `Minimum Feature Set - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Product Strategy Expert', task: 'Define minimum feature set for learning', context: args,
    instructions: ['1. List all potential features', '2. Map features to hypothesis', '3. Apply MoSCoW prioritization', '4. Identify must-have features', '5. Remove nice-to-haves', '6. Define feature scope', '7. Identify feature dependencies', '8. Estimate feature effort', '9. Validate with customer jobs', '10. Create feature specification'],
    outputFormat: 'JSON with features, mustHaves, scope' },
    outputSchema: { type: 'object', required: ['features', 'mustHaves'], properties: { features: { type: 'array', items: { type: 'object' } }, mustHaves: { type: 'array', items: { type: 'string' } }, scope: { type: 'object' }, effortEstimate: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'mvp', 'features']
}));

export const mvpTypeSelectionTask = defineTask('mvp-type-selection', (args, taskCtx) => ({
  kind: 'agent', title: `MVP Type Selection - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Lean Startup Expert', task: 'Select appropriate MVP type', context: args,
    instructions: ['1. Evaluate concierge MVP option', '2. Evaluate Wizard of Oz MVP', '3. Evaluate landing page MVP', '4. Evaluate video MVP', '5. Evaluate fake door MVP', '6. Evaluate single-feature MVP', '7. Evaluate mockup MVP', '8. Compare effort vs learning', '9. Select optimal MVP type', '10. Document selection rationale'],
    outputFormat: 'JSON with selectedType, rationale, alternatives' },
    outputSchema: { type: 'object', required: ['selectedType', 'rationale'], properties: { selectedType: { type: 'string' }, rationale: { type: 'string' }, alternatives: { type: 'array', items: { type: 'object' } }, effortComparison: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'mvp', 'type-selection']
}));

export const mvpSpecificationTask = defineTask('mvp-specification', (args, taskCtx) => ({
  kind: 'agent', title: `MVP Specification - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Product Manager', task: 'Create MVP specification', context: args,
    instructions: ['1. Document MVP scope', '2. Define user flows', '3. Create wireframes/mockups', '4. Define technical requirements', '5. Identify tools/platforms', '6. Estimate build timeline', '7. Define launch criteria', '8. Document limitations', '9. Plan for iteration', '10. Create build checklist'],
    outputFormat: 'JSON with specification, userFlows, timeline' },
    outputSchema: { type: 'object', required: ['specification', 'userFlows'], properties: { specification: { type: 'object' }, userFlows: { type: 'array', items: { type: 'object' } }, wireframes: { type: 'array', items: { type: 'object' } }, timeline: { type: 'object' }, limitations: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'mvp', 'specification']
}));

export const testPlanTask = defineTask('test-plan', (args, taskCtx) => ({
  kind: 'agent', title: `Test Plan - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Lean Experimentation Expert', task: 'Create MVP test plan', context: args,
    instructions: ['1. Define test objectives', '2. Identify target testers', '3. Plan recruitment approach', '4. Define test duration', '5. Create test protocol', '6. Plan feedback collection', '7. Define data collection', '8. Create analysis plan', '9. Plan for follow-up', '10. Define pivot criteria'],
    outputFormat: 'JSON with testPlan, protocol, pivotCriteria' },
    outputSchema: { type: 'object', required: ['testPlan', 'protocol'], properties: { testPlan: { type: 'object' }, protocol: { type: 'array', items: { type: 'string' } }, recruitment: { type: 'object' }, feedbackCollection: { type: 'object' }, pivotCriteria: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'mvp', 'testing']
}));

export const successMetricsTask = defineTask('success-metrics', (args, taskCtx) => ({
  kind: 'agent', title: `Success Metrics - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Product Analytics Expert', task: 'Define MVP success metrics', context: args,
    instructions: ['1. Define primary success metric', '2. Define secondary metrics', '3. Set metric thresholds', '4. Define measurement approach', '5. Create tracking plan', '6. Define validation criteria', '7. Plan for statistical significance', '8. Create metrics dashboard', '9. Define leading indicators', '10. Plan for metrics review'],
    outputFormat: 'JSON with metrics, thresholds, trackingPlan' },
    outputSchema: { type: 'object', required: ['metrics', 'thresholds'], properties: { metrics: { type: 'array', items: { type: 'object' } }, thresholds: { type: 'object' }, trackingPlan: { type: 'object' }, validationCriteria: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'mvp', 'metrics']
}));

export const learningFrameworkTask = defineTask('learning-framework', (args, taskCtx) => ({
  kind: 'agent', title: `Learning Framework - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Lean Startup Expert', task: 'Create learning documentation framework', context: args,
    instructions: ['1. Design learning capture template', '2. Create hypothesis tracking', '3. Define evidence documentation', '4. Create insight categorization', '5. Plan for pattern recognition', '6. Design iteration planning', '7. Create pivot documentation', '8. Plan knowledge sharing', '9. Create learning repository', '10. Define learning review cadence'],
    outputFormat: 'JSON with learningTemplate, hypothesisTracking, iterationPlan' },
    outputSchema: { type: 'object', required: ['learningTemplate', 'hypothesisTracking'], properties: { learningTemplate: { type: 'object' }, hypothesisTracking: { type: 'object' }, evidenceDocumentation: { type: 'object' }, iterationPlan: { type: 'object' }, reviewCadence: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'mvp', 'learning']
}));
