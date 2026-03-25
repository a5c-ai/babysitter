/**
 * @process specializations/domains/business/entrepreneurship/founding-team-formation
 * @description Founding Team Formation Process - Systematic approach to identifying, evaluating, and structuring founding teams for startups.
 * @inputs { ventureDescription: string, founderProfile: object, skillsNeeded: array, equitySplit?: object }
 * @outputs { success: boolean, teamStructure: object, cofounderCriteria: object, equityFramework: object, founderAgreement: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/founding-team-formation', {
 *   ventureDescription: 'AI-powered legal tech startup',
 *   founderProfile: { name: 'Jane Doe', skills: ['Product', 'Business Development'] },
 *   skillsNeeded: ['Technical CTO', 'Sales Lead']
 * });
 *
 * @references
 * - The Founder's Dilemmas (Noam Wasserman): https://www.amazon.com/Founders-Dilemmas-Noam-Wasserman/dp/0691158304
 * - Slicing Pie: https://slicingpie.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { ventureDescription, founderProfile, skillsNeeded = [], equitySplit = {} } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Founding Team Formation for venture: ${ventureDescription}`);

  // Phase 1: Venture Skills Assessment
  const skillsAssessment = await ctx.task(skillsAssessmentTask, { ventureDescription, founderProfile, skillsNeeded });
  artifacts.push(...(skillsAssessment.artifacts || []));

  // Phase 2: Cofounder Role Definition
  const roleDefinition = await ctx.task(roleDefinitionTask, { ventureDescription, skillsAssessment });
  artifacts.push(...(roleDefinition.artifacts || []));

  // Phase 3: Cofounder Criteria Development
  const cofounderCriteria = await ctx.task(cofounderCriteriaTask, { ventureDescription, roleDefinition, founderProfile });
  artifacts.push(...(cofounderCriteria.artifacts || []));

  // Phase 4: Search Strategy
  const searchStrategy = await ctx.task(searchStrategyTask, { ventureDescription, cofounderCriteria });
  artifacts.push(...(searchStrategy.artifacts || []));

  // Breakpoint: Review cofounder criteria
  await ctx.breakpoint({
    question: `Review cofounder criteria for ${ventureDescription}. Roles needed: ${roleDefinition.roles?.join(', ')}. Proceed with evaluation framework?`,
    title: 'Cofounder Criteria Review',
    context: { runId: ctx.runId, ventureDescription, roles: roleDefinition.roles, files: artifacts }
  });

  // Phase 5: Evaluation Framework
  const evaluationFramework = await ctx.task(evaluationFrameworkTask, { ventureDescription, cofounderCriteria });
  artifacts.push(...(evaluationFramework.artifacts || []));

  // Phase 6: Compatibility Assessment Framework
  const compatibilityFramework = await ctx.task(compatibilityFrameworkTask, { ventureDescription, founderProfile });
  artifacts.push(...(compatibilityFramework.artifacts || []));

  // Phase 7: Equity Framework
  const equityFramework = await ctx.task(equityFrameworkTask, { ventureDescription, roleDefinition, equitySplit });
  artifacts.push(...(equityFramework.artifacts || []));

  // Phase 8: Vesting Structure
  const vestingStructure = await ctx.task(vestingStructureTask, { ventureDescription, equityFramework });
  artifacts.push(...(vestingStructure.artifacts || []));

  // Phase 9: Founder Agreement Framework
  const founderAgreement = await ctx.task(founderAgreementTask, { ventureDescription, roleDefinition, equityFramework, vestingStructure });
  artifacts.push(...(founderAgreement.artifacts || []));

  // Phase 10: Team Dynamics Planning
  const teamDynamics = await ctx.task(teamDynamicsTask, { ventureDescription, roleDefinition, founderProfile });
  artifacts.push(...(teamDynamics.artifacts || []));

  const endTime = ctx.now();

  return {
    success: true, ventureDescription,
    teamStructure: roleDefinition,
    cofounderCriteria,
    equityFramework,
    vestingStructure,
    founderAgreement,
    searchStrategy,
    evaluationFramework,
    artifacts, duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/entrepreneurship/founding-team-formation', timestamp: startTime, version: '1.0.0' }
  };
}

export const skillsAssessmentTask = defineTask('skills-assessment', (args, taskCtx) => ({
  kind: 'agent', title: `Venture Skills Assessment`,
  agent: { name: 'general-purpose', prompt: { role: 'Startup Team Expert', task: 'Assess skills needed for venture', context: args,
    instructions: ['1. Analyze venture requirements', '2. Map required skills', '3. Assess founder\'s skills', '4. Identify skill gaps', '5. Prioritize skill needs', '6. Identify critical vs nice-to-have', '7. Map skills to roles', '8. Consider stage-specific needs', '9. Identify overlapping skills', '10. Create skills matrix'],
    outputFormat: 'JSON with requiredSkills, gaps, priorities' },
    outputSchema: { type: 'object', required: ['requiredSkills', 'gaps'], properties: { requiredSkills: { type: 'array', items: { type: 'string' } }, gaps: { type: 'array', items: { type: 'string' } }, priorities: { type: 'array', items: { type: 'object' } }, skillsMatrix: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'team', 'skills']
}));

export const roleDefinitionTask = defineTask('role-definition', (args, taskCtx) => ({
  kind: 'agent', title: `Cofounder Role Definition`,
  agent: { name: 'general-purpose', prompt: { role: 'Startup Organization Expert', task: 'Define cofounder roles', context: args,
    instructions: ['1. Define CEO responsibilities', '2. Define CTO responsibilities', '3. Define other C-level roles', '4. Map decision domains', '5. Define reporting structure', '6. Define accountability areas', '7. Identify role overlaps', '8. Define collaboration points', '9. Create RACI matrix', '10. Document role descriptions'],
    outputFormat: 'JSON with roles, responsibilities, raci' },
    outputSchema: { type: 'object', required: ['roles', 'responsibilities'], properties: { roles: { type: 'array', items: { type: 'string' } }, responsibilities: { type: 'object' }, raci: { type: 'object' }, roleDescriptions: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'team', 'roles']
}));

export const cofounderCriteriaTask = defineTask('cofounder-criteria', (args, taskCtx) => ({
  kind: 'agent', title: `Cofounder Criteria Development`,
  agent: { name: 'general-purpose', prompt: { role: 'Startup Team Expert', task: 'Develop cofounder selection criteria', context: args,
    instructions: ['1. Define skill requirements', '2. Define experience requirements', '3. Define network requirements', '4. Define personality traits', '5. Define values alignment', '6. Define commitment level', '7. Define risk tolerance', '8. Define financial expectations', '9. Weight criteria', '10. Create cofounder scorecard'],
    outputFormat: 'JSON with criteria, weights, scorecard' },
    outputSchema: { type: 'object', required: ['criteria', 'weights'], properties: { criteria: { type: 'array', items: { type: 'object', properties: { category: { type: 'string' }, items: { type: 'array', items: { type: 'string' } } } } }, weights: { type: 'object' }, scorecard: { type: 'object' }, mustHaves: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'team', 'criteria']
}));

export const searchStrategyTask = defineTask('search-strategy', (args, taskCtx) => ({
  kind: 'agent', title: `Cofounder Search Strategy`,
  agent: { name: 'general-purpose', prompt: { role: 'Networking Expert', task: 'Create cofounder search strategy', context: args,
    instructions: ['1. Identify search channels', '2. Map personal network', '3. Identify industry events', '4. Identify online communities', '5. Plan cofounder dating approach', '6. Create outreach templates', '7. Define screening process', '8. Plan trial projects', '9. Create timeline', '10. Document search playbook'],
    outputFormat: 'JSON with channels, outreach, timeline' },
    outputSchema: { type: 'object', required: ['channels', 'outreach'], properties: { channels: { type: 'array', items: { type: 'object' } }, outreach: { type: 'object' }, timeline: { type: 'object' }, screeningProcess: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'team', 'search']
}));

export const evaluationFrameworkTask = defineTask('evaluation-framework', (args, taskCtx) => ({
  kind: 'agent', title: `Cofounder Evaluation Framework`,
  agent: { name: 'general-purpose', prompt: { role: 'Assessment Expert', task: 'Create cofounder evaluation framework', context: args,
    instructions: ['1. Design interview process', '2. Create assessment questions', '3. Define reference check process', '4. Design work trial structure', '5. Create evaluation rubrics', '6. Define red flags', '7. Design decision framework', '8. Plan background checks', '9. Define timeline expectations', '10. Document evaluation playbook'],
    outputFormat: 'JSON with interviewProcess, rubrics, redFlags' },
    outputSchema: { type: 'object', required: ['interviewProcess', 'rubrics'], properties: { interviewProcess: { type: 'array', items: { type: 'object' } }, rubrics: { type: 'object' }, redFlags: { type: 'array', items: { type: 'string' } }, questions: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'team', 'evaluation']
}));

export const compatibilityFrameworkTask = defineTask('compatibility-framework', (args, taskCtx) => ({
  kind: 'agent', title: `Compatibility Assessment Framework`,
  agent: { name: 'general-purpose', prompt: { role: 'Team Dynamics Expert', task: 'Create compatibility assessment framework', context: args,
    instructions: ['1. Define vision alignment questions', '2. Define values alignment questions', '3. Define work style assessment', '4. Define conflict resolution style', '5. Define risk tolerance assessment', '6. Define communication preferences', '7. Define decision-making style', '8. Define commitment assessment', '9. Create compatibility scorecard', '10. Define deal-breakers'],
    outputFormat: 'JSON with assessments, scorecard, dealBreakers' },
    outputSchema: { type: 'object', required: ['assessments', 'dealBreakers'], properties: { assessments: { type: 'array', items: { type: 'object' } }, scorecard: { type: 'object' }, dealBreakers: { type: 'array', items: { type: 'string' } }, questions: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'team', 'compatibility']
}));

export const equityFrameworkTask = defineTask('equity-framework', (args, taskCtx) => ({
  kind: 'agent', title: `Equity Framework`,
  agent: { name: 'general-purpose', prompt: { role: 'Startup Finance Expert', task: 'Create equity allocation framework', context: args,
    instructions: ['1. Evaluate contribution factors', '2. Apply Slicing Pie or fixed model', '3. Weight past contributions', '4. Weight future contributions', '5. Consider opportunity cost', '6. Define adjustment mechanisms', '7. Plan for future hires', '8. Consider investor dilution', '9. Create equity calculator', '10. Document equity rationale'],
    outputFormat: 'JSON with equityModel, allocation, rationale' },
    outputSchema: { type: 'object', required: ['equityModel', 'allocation'], properties: { equityModel: { type: 'string' }, allocation: { type: 'object' }, contributionWeights: { type: 'object' }, rationale: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'team', 'equity']
}));

export const vestingStructureTask = defineTask('vesting-structure', (args, taskCtx) => ({
  kind: 'agent', title: `Vesting Structure`,
  agent: { name: 'general-purpose', prompt: { role: 'Startup Legal Expert', task: 'Design vesting structure', context: args,
    instructions: ['1. Define vesting period', '2. Define cliff period', '3. Define acceleration triggers', '4. Define good/bad leaver terms', '5. Consider single vs double trigger', '6. Plan for IP assignment', '7. Define buyback rights', '8. Consider tax implications', '9. Document standard terms', '10. Create term sheet template'],
    outputFormat: 'JSON with vestingTerms, triggers, template' },
    outputSchema: { type: 'object', required: ['vestingTerms'], properties: { vestingTerms: { type: 'object' }, cliff: { type: 'string' }, accelerationTriggers: { type: 'array', items: { type: 'string' } }, leaverTerms: { type: 'object' }, template: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'team', 'vesting']
}));

export const founderAgreementTask = defineTask('founder-agreement', (args, taskCtx) => ({
  kind: 'agent', title: `Founder Agreement Framework`,
  agent: { name: 'general-purpose', prompt: { role: 'Startup Legal Expert', task: 'Create founder agreement framework', context: args,
    instructions: ['1. Define ownership structure', '2. Define roles and responsibilities', '3. Define decision-making process', '4. Define dispute resolution', '5. Define exit provisions', '6. Define IP assignment', '7. Define non-compete terms', '8. Define confidentiality', '9. Define deadlock resolution', '10. Create agreement template'],
    outputFormat: 'JSON with agreementTerms, provisions, template' },
    outputSchema: { type: 'object', required: ['agreementTerms', 'provisions'], properties: { agreementTerms: { type: 'object' }, provisions: { type: 'array', items: { type: 'object' } }, disputeResolution: { type: 'object' }, template: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'team', 'agreement']
}));

export const teamDynamicsTask = defineTask('team-dynamics', (args, taskCtx) => ({
  kind: 'agent', title: `Team Dynamics Planning`,
  agent: { name: 'general-purpose', prompt: { role: 'Team Development Expert', task: 'Plan founding team dynamics', context: args,
    instructions: ['1. Define communication cadence', '2. Define meeting rhythms', '3. Define decision protocols', '4. Define conflict resolution', '5. Define feedback mechanisms', '6. Define accountability system', '7. Define celebration practices', '8. Define wellness practices', '9. Create team charter', '10. Document operating principles'],
    outputFormat: 'JSON with teamCharter, protocols, practices' },
    outputSchema: { type: 'object', required: ['teamCharter', 'protocols'], properties: { teamCharter: { type: 'object' }, protocols: { type: 'array', items: { type: 'object' } }, practices: { type: 'array', items: { type: 'object' } }, operatingPrinciples: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'team', 'dynamics']
}));
