/**
 * @process specializations/domains/business/entrepreneurship/startup-culture-definition
 * @description Startup Culture Definition Process - Systematic process for defining, documenting, and implementing startup culture and values.
 * @inputs { companyName: string, mission: string, founders?: array, currentTeamSize?: number, stage?: string }
 * @outputs { success: boolean, cultureDocument: object, values: array, behaviors: object, rituals: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/startup-culture-definition', {
 *   companyName: 'CultureFirst',
 *   mission: 'Democratize financial services',
 *   currentTeamSize: 15,
 *   stage: 'Series A'
 * });
 *
 * @references
 * - What You Do Is Who You Are (Ben Horowitz): https://www.amazon.com/What-You-Do-Who-Are/dp/0062871331
 * - Powerful (Patty McCord): https://www.amazon.com/Powerful-Building-Culture-Freedom-Responsibility/dp/1939714095
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { companyName, mission, founders = [], currentTeamSize = 0, stage = 'Early' } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Startup Culture Definition for ${companyName}`);

  // Phase 1: Founder Values Discovery
  const founderValues = await ctx.task(founderValuesTask, { companyName, founders, mission });
  artifacts.push(...(founderValues.artifacts || []));

  // Phase 2: Culture Assessment
  const cultureAssessment = await ctx.task(cultureAssessmentTask, { companyName, currentTeamSize });
  artifacts.push(...(cultureAssessment.artifacts || []));

  // Phase 3: Values Definition
  const valuesDefinition = await ctx.task(valuesDefinitionTask, { companyName, founderValues, mission });
  artifacts.push(...(valuesDefinition.artifacts || []));

  // Breakpoint: Review values
  await ctx.breakpoint({
    question: `Review values for ${companyName}: ${valuesDefinition.values?.join(', ')}. Proceed with behaviors definition?`,
    title: 'Values Review',
    context: { runId: ctx.runId, companyName, values: valuesDefinition.values, files: artifacts }
  });

  // Phase 4: Behaviors Definition
  const behaviorsDefinition = await ctx.task(behaviorsDefinitionTask, { companyName, valuesDefinition });
  artifacts.push(...(behaviorsDefinition.artifacts || []));

  // Phase 5: Rituals and Practices
  const ritualsDefinition = await ctx.task(ritualsDefinitionTask, { companyName, valuesDefinition, behaviorsDefinition, stage });
  artifacts.push(...(ritualsDefinition.artifacts || []));

  // Phase 6: Communication Framework
  const communicationFramework = await ctx.task(communicationFrameworkTask, { companyName, valuesDefinition });
  artifacts.push(...(communicationFramework.artifacts || []));

  // Phase 7: Recognition System
  const recognitionSystem = await ctx.task(recognitionSystemTask, { companyName, valuesDefinition, behaviorsDefinition });
  artifacts.push(...(recognitionSystem.artifacts || []));

  // Phase 8: Feedback Culture
  const feedbackCulture = await ctx.task(feedbackCultureTask, { companyName, valuesDefinition });
  artifacts.push(...(feedbackCulture.artifacts || []));

  // Phase 9: Culture Document
  const cultureDocument = await ctx.task(cultureDocumentTask, {
    companyName, mission, valuesDefinition, behaviorsDefinition, ritualsDefinition, communicationFramework
  });
  artifacts.push(...(cultureDocument.artifacts || []));

  // Phase 10: Implementation Plan
  const implementationPlan = await ctx.task(implementationPlanTask, { companyName, cultureDocument, currentTeamSize, stage });
  artifacts.push(...(implementationPlan.artifacts || []));

  const endTime = ctx.now();

  return {
    success: true, companyName,
    cultureDocument,
    values: valuesDefinition.values,
    behaviors: behaviorsDefinition,
    rituals: ritualsDefinition.rituals,
    recognitionSystem,
    feedbackCulture,
    implementationPlan,
    artifacts, duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/entrepreneurship/startup-culture-definition', timestamp: startTime, version: '1.0.0' }
  };
}

export const founderValuesTask = defineTask('founder-values', (args, taskCtx) => ({
  kind: 'agent', title: `Founder Values Discovery - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Culture Strategy Expert', task: 'Discover founder values', context: args,
    instructions: ['1. Identify founder motivations', '2. Explore founder backgrounds', '3. Identify formative experiences', '4. Discover non-negotiables', '5. Explore leadership styles', '6. Identify decision patterns', '7. Discover pet peeves', '8. Explore aspirations', '9. Identify role models', '10. Document founder values'],
    outputFormat: 'JSON with founderValues, motivations, patterns' },
    outputSchema: { type: 'object', required: ['founderValues', 'motivations'], properties: { founderValues: { type: 'array', items: { type: 'string' } }, motivations: { type: 'array', items: { type: 'string' } }, patterns: { type: 'array', items: { type: 'string' } }, nonNegotiables: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'culture', 'values']
}));

export const cultureAssessmentTask = defineTask('culture-assessment', (args, taskCtx) => ({
  kind: 'agent', title: `Culture Assessment - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Culture Assessment Expert', task: 'Assess current culture', context: args,
    instructions: ['1. Identify existing behaviors', '2. Identify positive patterns', '3. Identify negative patterns', '4. Assess team dynamics', '5. Identify subcultures', '6. Assess communication patterns', '7. Identify cultural strengths', '8. Identify cultural risks', '9. Assess culture-mission alignment', '10. Create culture assessment report'],
    outputFormat: 'JSON with assessment, strengths, risks' },
    outputSchema: { type: 'object', required: ['assessment', 'strengths'], properties: { assessment: { type: 'object' }, strengths: { type: 'array', items: { type: 'string' } }, risks: { type: 'array', items: { type: 'string' } }, patterns: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'culture', 'assessment']
}));

export const valuesDefinitionTask = defineTask('values-definition', (args, taskCtx) => ({
  kind: 'agent', title: `Values Definition - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Culture Strategy Expert', task: 'Define company values', context: args,
    instructions: ['1. Synthesize founder values', '2. Align with mission', '3. Define 4-6 core values', '4. Make values memorable', '5. Define value meanings', '6. Create value descriptions', '7. Identify value tensions', '8. Prioritize values', '9. Test for uniqueness', '10. Document values framework'],
    outputFormat: 'JSON with values, descriptions, framework' },
    outputSchema: { type: 'object', required: ['values', 'descriptions'], properties: { values: { type: 'array', items: { type: 'string' } }, descriptions: { type: 'object' }, framework: { type: 'object' }, tensions: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'culture', 'values']
}));

export const behaviorsDefinitionTask = defineTask('behaviors-definition', (args, taskCtx) => ({
  kind: 'agent', title: `Behaviors Definition - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Behavioral Expert', task: 'Define value behaviors', context: args,
    instructions: ['1. Define behaviors per value', '2. Define "looks like" examples', '3. Define "doesn\'t look like" examples', '4. Create behavioral rubrics', '5. Define daily behaviors', '6. Define decision behaviors', '7. Define conflict behaviors', '8. Define celebration behaviors', '9. Define hiring behaviors', '10. Document behavior framework'],
    outputFormat: 'JSON with behaviors, examples, rubrics' },
    outputSchema: { type: 'object', required: ['behaviors', 'examples'], properties: { behaviors: { type: 'object' }, examples: { type: 'object' }, antiPatterns: { type: 'object' }, rubrics: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'culture', 'behaviors']
}));

export const ritualsDefinitionTask = defineTask('rituals-definition', (args, taskCtx) => ({
  kind: 'agent', title: `Rituals and Practices - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Culture Design Expert', task: 'Define culture rituals', context: args,
    instructions: ['1. Design team meetings', '2. Design all-hands meetings', '3. Design celebration rituals', '4. Design onboarding rituals', '5. Design milestone rituals', '6. Design learning rituals', '7. Design feedback rituals', '8. Design social rituals', '9. Design departure rituals', '10. Document ritual playbook'],
    outputFormat: 'JSON with rituals, cadence, playbook' },
    outputSchema: { type: 'object', required: ['rituals', 'cadence'], properties: { rituals: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, purpose: { type: 'string' }, frequency: { type: 'string' } } } }, cadence: { type: 'object' }, playbook: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'culture', 'rituals']
}));

export const communicationFrameworkTask = defineTask('communication-framework', (args, taskCtx) => ({
  kind: 'agent', title: `Communication Framework - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Communication Expert', task: 'Design communication framework', context: args,
    instructions: ['1. Define communication principles', '2. Define channel usage', '3. Define meeting norms', '4. Define documentation practices', '5. Define transparency levels', '6. Define escalation paths', '7. Define async vs sync', '8. Define tone guidelines', '9. Define inclusion practices', '10. Document communication guide'],
    outputFormat: 'JSON with principles, channels, norms' },
    outputSchema: { type: 'object', required: ['principles', 'channels'], properties: { principles: { type: 'array', items: { type: 'string' } }, channels: { type: 'object' }, norms: { type: 'object' }, transparency: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'culture', 'communication']
}));

export const recognitionSystemTask = defineTask('recognition-system', (args, taskCtx) => ({
  kind: 'agent', title: `Recognition System - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Recognition Expert', task: 'Design recognition system', context: args,
    instructions: ['1. Define recognition types', '2. Define peer recognition', '3. Define manager recognition', '4. Define company recognition', '5. Define rewards framework', '6. Define recognition frequency', '7. Define public vs private', '8. Design recognition tools', '9. Define budget if any', '10. Document recognition playbook'],
    outputFormat: 'JSON with recognitionTypes, rewards, playbook' },
    outputSchema: { type: 'object', required: ['recognitionTypes', 'rewards'], properties: { recognitionTypes: { type: 'array', items: { type: 'object' } }, rewards: { type: 'object' }, frequency: { type: 'object' }, tools: { type: 'array', items: { type: 'string' } }, playbook: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'culture', 'recognition']
}));

export const feedbackCultureTask = defineTask('feedback-culture', (args, taskCtx) => ({
  kind: 'agent', title: `Feedback Culture - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Feedback Expert', task: 'Design feedback culture', context: args,
    instructions: ['1. Define feedback principles', '2. Define feedback frameworks', '3. Define 1:1 structure', '4. Define peer feedback', '5. Define upward feedback', '6. Define real-time feedback', '7. Define review cadence', '8. Define difficult conversations', '9. Create feedback training', '10. Document feedback playbook'],
    outputFormat: 'JSON with principles, frameworks, training' },
    outputSchema: { type: 'object', required: ['principles', 'frameworks'], properties: { principles: { type: 'array', items: { type: 'string' } }, frameworks: { type: 'array', items: { type: 'object' } }, oneOnOneStructure: { type: 'object' }, training: { type: 'object' }, playbook: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'culture', 'feedback']
}));

export const cultureDocumentTask = defineTask('culture-document', (args, taskCtx) => ({
  kind: 'agent', title: `Culture Document - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Culture Writer', task: 'Create culture document', context: args,
    instructions: ['1. Write culture introduction', '2. Document mission and vision', '3. Document values', '4. Document behaviors', '5. Document rituals', '6. Document communication', '7. Document expectations', '8. Include stories/examples', '9. Create visual design', '10. Finalize culture deck'],
    outputFormat: 'JSON with cultureDocument, sections, deck' },
    outputSchema: { type: 'object', required: ['cultureDocument', 'sections'], properties: { cultureDocument: { type: 'object' }, sections: { type: 'array', items: { type: 'object' } }, stories: { type: 'array', items: { type: 'object' } }, deck: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'culture', 'documentation']
}));

export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent', title: `Implementation Plan - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Culture Implementation Expert', task: 'Create culture implementation plan', context: args,
    instructions: ['1. Plan culture launch', '2. Plan leadership alignment', '3. Plan team rollout', '4. Plan training programs', '5. Define culture champions', '6. Plan integration with HR', '7. Define measurement approach', '8. Plan reinforcement mechanisms', '9. Define culture audit cadence', '10. Document implementation roadmap'],
    outputFormat: 'JSON with implementationPlan, timeline, metrics' },
    outputSchema: { type: 'object', required: ['implementationPlan', 'timeline'], properties: { implementationPlan: { type: 'object' }, timeline: { type: 'array', items: { type: 'object' } }, training: { type: 'array', items: { type: 'object' } }, metrics: { type: 'array', items: { type: 'string' } }, auditCadence: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'culture', 'implementation']
}));
