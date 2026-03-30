/**
 * @process specializations/domains/business/entrepreneurship/startup-hiring-process
 * @description Startup Hiring Process - Comprehensive hiring process designed for early-stage startups with limited resources.
 * @inputs { companyName: string, role: string, department: string, level: string, compensation?: object, timeline?: string }
 * @outputs { success: boolean, jobDescription: object, hiringPlan: object, interviewProcess: object, offerFramework: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/startup-hiring-process', {
 *   companyName: 'TalentStart',
 *   role: 'Senior Software Engineer',
 *   department: 'Engineering',
 *   level: 'Senior IC',
 *   timeline: '30 days'
 * });
 *
 * @references
 * - Who (Geoff Smart): https://www.amazon.com/Who-Geoff-Smart/dp/0345504194
 * - Work Rules (Laszlo Bock): https://www.amazon.com/Work-Rules-Insights-Inside-Transform/dp/1455554790
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { companyName, role, department, level, compensation = {}, timeline = '30 days' } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Startup Hiring Process for ${role} at ${companyName}`);

  // Phase 1: Role Definition
  const roleDefinition = await ctx.task(roleDefinitionTask, { companyName, role, department, level });
  artifacts.push(...(roleDefinition.artifacts || []));

  // Phase 2: Ideal Candidate Profile
  const candidateProfile = await ctx.task(candidateProfileTask, { companyName, role, roleDefinition });
  artifacts.push(...(candidateProfile.artifacts || []));

  // Phase 3: Job Description
  const jobDescription = await ctx.task(jobDescriptionTask, { companyName, role, roleDefinition, candidateProfile, compensation });
  artifacts.push(...(jobDescription.artifacts || []));

  // Phase 4: Sourcing Strategy
  const sourcingStrategy = await ctx.task(sourcingStrategyTask, { companyName, role, candidateProfile });
  artifacts.push(...(sourcingStrategy.artifacts || []));

  // Breakpoint: Review job description and sourcing strategy
  await ctx.breakpoint({
    question: `Review job description for ${role} at ${companyName}. Sourcing channels: ${sourcingStrategy.channels?.slice(0, 3).join(', ')}. Proceed with interview design?`,
    title: 'Job Description Review',
    context: { runId: ctx.runId, companyName, role, channels: sourcingStrategy.channels, files: artifacts }
  });

  // Phase 5: Interview Process Design
  const interviewProcess = await ctx.task(interviewProcessTask, { companyName, role, candidateProfile, level });
  artifacts.push(...(interviewProcess.artifacts || []));

  // Phase 6: Assessment Framework
  const assessmentFramework = await ctx.task(assessmentFrameworkTask, { companyName, role, candidateProfile, interviewProcess });
  artifacts.push(...(assessmentFramework.artifacts || []));

  // Phase 7: Compensation Framework
  const compensationFramework = await ctx.task(compensationFrameworkTask, { companyName, role, level, compensation });
  artifacts.push(...(compensationFramework.artifacts || []));

  // Phase 8: Offer Process
  const offerProcess = await ctx.task(offerProcessTask, { companyName, role, compensationFramework });
  artifacts.push(...(offerProcess.artifacts || []));

  // Phase 9: Onboarding Plan
  const onboardingPlan = await ctx.task(onboardingPlanTask, { companyName, role, department });
  artifacts.push(...(onboardingPlan.artifacts || []));

  // Phase 10: Hiring Playbook
  const hiringPlaybook = await ctx.task(hiringPlaybookTask, {
    companyName, role, jobDescription, sourcingStrategy, interviewProcess, assessmentFramework, offerProcess, timeline
  });
  artifacts.push(...(hiringPlaybook.artifacts || []));

  const endTime = ctx.now();

  return {
    success: true, companyName, role,
    jobDescription,
    hiringPlan: hiringPlaybook,
    interviewProcess,
    assessmentFramework,
    offerFramework: offerProcess,
    onboardingPlan,
    artifacts, duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/entrepreneurship/startup-hiring-process', timestamp: startTime, version: '1.0.0' }
  };
}

export const roleDefinitionTask = defineTask('role-definition', (args, taskCtx) => ({
  kind: 'agent', title: `Role Definition - ${args.role}`,
  agent: { name: 'general-purpose', prompt: { role: 'HR Strategy Expert', task: 'Define role requirements', context: args,
    instructions: ['1. Define key responsibilities', '2. Define success metrics', '3. Define reporting structure', '4. Define team interactions', '5. Define growth path', '6. Define impact expectations', '7. Define resource access', '8. Define decision authority', '9. Identify critical projects', '10. Document role specification'],
    outputFormat: 'JSON with responsibilities, metrics, structure' },
    outputSchema: { type: 'object', required: ['responsibilities', 'successMetrics'], properties: { responsibilities: { type: 'array', items: { type: 'string' } }, successMetrics: { type: 'array', items: { type: 'string' } }, reportingStructure: { type: 'object' }, growthPath: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'hiring', 'role-definition']
}));

export const candidateProfileTask = defineTask('candidate-profile', (args, taskCtx) => ({
  kind: 'agent', title: `Ideal Candidate Profile - ${args.role}`,
  agent: { name: 'general-purpose', prompt: { role: 'Talent Acquisition Expert', task: 'Define ideal candidate profile', context: args,
    instructions: ['1. Define must-have skills', '2. Define nice-to-have skills', '3. Define experience requirements', '4. Define education preferences', '5. Define personality traits', '6. Define cultural fit criteria', '7. Define motivation factors', '8. Identify red flags', '9. Define deal-breakers', '10. Create candidate scorecard'],
    outputFormat: 'JSON with skills, experience, traits, scorecard' },
    outputSchema: { type: 'object', required: ['mustHaveSkills', 'experience'], properties: { mustHaveSkills: { type: 'array', items: { type: 'string' } }, niceToHaveSkills: { type: 'array', items: { type: 'string' } }, experience: { type: 'object' }, traits: { type: 'array', items: { type: 'string' } }, redFlags: { type: 'array', items: { type: 'string' } }, scorecard: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'hiring', 'candidate-profile']
}));

export const jobDescriptionTask = defineTask('job-description', (args, taskCtx) => ({
  kind: 'agent', title: `Job Description - ${args.role}`,
  agent: { name: 'general-purpose', prompt: { role: 'Employer Branding Expert', task: 'Write compelling job description', context: args,
    instructions: ['1. Write attention-grabbing intro', '2. Describe company and mission', '3. Describe role impact', '4. List key responsibilities', '5. List requirements', '6. Describe team and culture', '7. List benefits and perks', '8. Include growth opportunities', '9. Add application instructions', '10. Optimize for search'],
    outputFormat: 'JSON with jobDescription, posting, keywords' },
    outputSchema: { type: 'object', required: ['jobDescription', 'posting'], properties: { jobDescription: { type: 'object' }, posting: { type: 'string' }, keywords: { type: 'array', items: { type: 'string' } }, benefits: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'hiring', 'job-description']
}));

export const sourcingStrategyTask = defineTask('sourcing-strategy', (args, taskCtx) => ({
  kind: 'agent', title: `Sourcing Strategy - ${args.role}`,
  agent: { name: 'general-purpose', prompt: { role: 'Talent Sourcing Expert', task: 'Create sourcing strategy', context: args,
    instructions: ['1. Identify sourcing channels', '2. Plan job board strategy', '3. Plan LinkedIn outreach', '4. Plan referral program', '5. Identify communities', '6. Plan agency partnerships', '7. Create outreach templates', '8. Define response tracking', '9. Plan employer branding', '10. Document sourcing playbook'],
    outputFormat: 'JSON with channels, outreach, tracking' },
    outputSchema: { type: 'object', required: ['channels', 'outreach'], properties: { channels: { type: 'array', items: { type: 'string' } }, outreach: { type: 'object' }, templates: { type: 'array', items: { type: 'object' } }, tracking: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'hiring', 'sourcing']
}));

export const interviewProcessTask = defineTask('interview-process', (args, taskCtx) => ({
  kind: 'agent', title: `Interview Process - ${args.role}`,
  agent: { name: 'general-purpose', prompt: { role: 'Interview Design Expert', task: 'Design interview process', context: args,
    instructions: ['1. Design screening call', '2. Design hiring manager interview', '3. Design technical assessment', '4. Design culture fit interview', '5. Design team interviews', '6. Design executive interview', '7. Define interview timeline', '8. Create interview guides', '9. Define feedback process', '10. Document interview playbook'],
    outputFormat: 'JSON with stages, guides, timeline' },
    outputSchema: { type: 'object', required: ['stages', 'timeline'], properties: { stages: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, duration: { type: 'string' }, interviewers: { type: 'array', items: { type: 'string' } } } } }, guides: { type: 'array', items: { type: 'object' } }, timeline: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'hiring', 'interview']
}));

export const assessmentFrameworkTask = defineTask('assessment-framework', (args, taskCtx) => ({
  kind: 'agent', title: `Assessment Framework - ${args.role}`,
  agent: { name: 'general-purpose', prompt: { role: 'Assessment Expert', task: 'Create assessment framework', context: args,
    instructions: ['1. Create skills rubrics', '2. Create behavioral rubrics', '3. Design work samples', '4. Create reference check questions', '5. Define scoring system', '6. Define calibration process', '7. Create debrief template', '8. Define decision criteria', '9. Plan for bias mitigation', '10. Document assessment guide'],
    outputFormat: 'JSON with rubrics, scoring, criteria' },
    outputSchema: { type: 'object', required: ['rubrics', 'scoring'], properties: { rubrics: { type: 'object' }, scoring: { type: 'object' }, workSamples: { type: 'array', items: { type: 'object' } }, referenceQuestions: { type: 'array', items: { type: 'string' } }, decisionCriteria: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'hiring', 'assessment']
}));

export const compensationFrameworkTask = defineTask('compensation-framework', (args, taskCtx) => ({
  kind: 'agent', title: `Compensation Framework - ${args.role}`,
  agent: { name: 'general-purpose', prompt: { role: 'Compensation Expert', task: 'Design compensation framework', context: args,
    instructions: ['1. Research market rates', '2. Define salary bands', '3. Design equity package', '4. Define benefits package', '5. Plan for signing bonus', '6. Define performance bonuses', '7. Create offer levels', '8. Define negotiation room', '9. Plan for competing offers', '10. Document comp framework'],
    outputFormat: 'JSON with salaryBands, equity, benefits' },
    outputSchema: { type: 'object', required: ['salaryBands', 'equity'], properties: { salaryBands: { type: 'object' }, equity: { type: 'object' }, benefits: { type: 'array', items: { type: 'string' } }, bonuses: { type: 'object' }, negotiationGuidelines: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'hiring', 'compensation']
}));

export const offerProcessTask = defineTask('offer-process', (args, taskCtx) => ({
  kind: 'agent', title: `Offer Process - ${args.role}`,
  agent: { name: 'general-purpose', prompt: { role: 'Talent Acquisition Expert', task: 'Design offer process', context: args,
    instructions: ['1. Design verbal offer process', '2. Create offer letter template', '3. Define approval workflow', '4. Plan for negotiations', '5. Define deadline policies', '6. Plan for competing offers', '7. Create closing playbook', '8. Define acceptance process', '9. Plan for rejections', '10. Document offer process'],
    outputFormat: 'JSON with offerProcess, templates, playbook' },
    outputSchema: { type: 'object', required: ['offerProcess', 'templates'], properties: { offerProcess: { type: 'object' }, templates: { type: 'array', items: { type: 'object' } }, approvalWorkflow: { type: 'object' }, closingPlaybook: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'hiring', 'offer']
}));

export const onboardingPlanTask = defineTask('onboarding-plan', (args, taskCtx) => ({
  kind: 'agent', title: `Onboarding Plan - ${args.role}`,
  agent: { name: 'general-purpose', prompt: { role: 'Onboarding Expert', task: 'Create onboarding plan', context: args,
    instructions: ['1. Design pre-start experience', '2. Plan first day activities', '3. Plan first week schedule', '4. Plan 30-day goals', '5. Plan 60-day goals', '6. Plan 90-day goals', '7. Assign onboarding buddy', '8. Define check-in cadence', '9. Create onboarding checklist', '10. Document onboarding playbook'],
    outputFormat: 'JSON with onboardingPlan, milestones, checklist' },
    outputSchema: { type: 'object', required: ['onboardingPlan', 'milestones'], properties: { onboardingPlan: { type: 'object' }, milestones: { type: 'array', items: { type: 'object' } }, checklist: { type: 'array', items: { type: 'string' } }, buddyGuidelines: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'hiring', 'onboarding']
}));

export const hiringPlaybookTask = defineTask('hiring-playbook', (args, taskCtx) => ({
  kind: 'agent', title: `Hiring Playbook - ${args.role}`,
  agent: { name: 'general-purpose', prompt: { role: 'HR Operations Expert', task: 'Create comprehensive hiring playbook', context: args,
    instructions: ['1. Compile all hiring materials', '2. Create process timeline', '3. Define responsibilities', '4. Create communication templates', '5. Define metrics to track', '6. Create status dashboard', '7. Define escalation procedures', '8. Plan for pipeline management', '9. Define retrospective process', '10. Assemble hiring playbook'],
    outputFormat: 'JSON with playbook, timeline, metrics' },
    outputSchema: { type: 'object', required: ['playbook', 'timeline'], properties: { playbook: { type: 'object' }, timeline: { type: 'object' }, metrics: { type: 'array', items: { type: 'string' } }, templates: { type: 'array', items: { type: 'object' } }, dashboard: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'hiring', 'playbook']
}));
