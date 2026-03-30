/**
 * @process specializations/domains/business/human-resources/succession-planning
 * @description Succession Planning Process - Identification of critical roles, assessment of internal talent pipeline,
 * development of high-potential employees, and creation of succession readiness plans.
 * @inputs { organizationName: string, criticalRoles: array, planningHorizon: string }
 * @outputs { success: boolean, criticalRolesIdentified: number, successorPipeline: object, readinessAssessment: object, developmentPlans: array }
 *
 * @references
 * - SHRM Succession Planning: https://www.shrm.org/resourcesandtools/tools-and-samples/toolkits/pages/practicingsuccessionplanning.aspx
 * - Harvard Business Review: https://hbr.org/2011/04/succession-planning-what-the-research-says
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    criticalRoles = [],
    planningHorizon = '3-years',
    includeLeadershipAssessment = true,
    includeHighPotentialProgram = true,
    outputDir = 'succession-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Succession Planning for ${organizationName}`);

  // Phase 1: Critical Role Identification
  const roleIdentification = await ctx.task(roleIdentificationTask, { organizationName, criticalRoles, planningHorizon, outputDir });
  artifacts.push(...roleIdentification.artifacts);

  await ctx.breakpoint({
    question: `${roleIdentification.criticalRolesCount} critical roles identified. Review critical role criteria and list?`,
    title: 'Critical Roles Review',
    context: { runId: ctx.runId, criticalRoles: roleIdentification.criticalRoles, criteria: roleIdentification.criteria, files: roleIdentification.artifacts.map(a => ({ path: a.path, format: a.format || 'json' })) }
  });

  // Phase 2: Talent Assessment
  const talentAssessment = await ctx.task(talentAssessmentTask, { organizationName, criticalRoles: roleIdentification.criticalRoles, includeLeadershipAssessment, outputDir });
  artifacts.push(...talentAssessment.artifacts);

  // Phase 3: High-Potential Identification
  const hipoIdentification = await ctx.task(hipoIdentificationTask, { organizationName, talentAssessment, outputDir });
  artifacts.push(...hipoIdentification.artifacts);

  // Phase 4: Successor Nomination
  const successorNomination = await ctx.task(successorNominationTask, { organizationName, criticalRoles: roleIdentification.criticalRoles, talentAssessment, hipoIdentification, outputDir });
  artifacts.push(...successorNomination.artifacts);

  await ctx.breakpoint({
    question: `Successor nominations complete. ${successorNomination.nominationsCount} successors nominated. Review succession pipeline?`,
    title: 'Succession Pipeline Review',
    context: { runId: ctx.runId, nominations: successorNomination.nominations, coverage: successorNomination.coverage, files: successorNomination.artifacts.map(a => ({ path: a.path, format: a.format || 'json' })) }
  });

  // Phase 5: Readiness Assessment
  const readinessAssessment = await ctx.task(readinessAssessmentTask, { organizationName, successors: successorNomination.nominations, criticalRoles: roleIdentification.criticalRoles, outputDir });
  artifacts.push(...readinessAssessment.artifacts);

  // Phase 6: Gap Analysis
  const gapAnalysis = await ctx.task(gapAnalysisTask, { organizationName, readinessAssessment, criticalRoles: roleIdentification.criticalRoles, outputDir });
  artifacts.push(...gapAnalysis.artifacts);

  // Phase 7: Development Planning
  const developmentPlanning = await ctx.task(developmentPlanningTask, { organizationName, successors: successorNomination.nominations, gapAnalysis, outputDir });
  artifacts.push(...developmentPlanning.artifacts);

  // Phase 8: High-Potential Program
  let hipoProgram = null;
  if (includeHighPotentialProgram) {
    hipoProgram = await ctx.task(hipoProgramTask, { organizationName, hipos: hipoIdentification.highPotentials, outputDir });
    artifacts.push(...hipoProgram.artifacts);
  }

  // Phase 9: Succession Review Meetings
  const successionReviews = await ctx.task(successionReviewsTask, { organizationName, criticalRoles: roleIdentification.criticalRoles, successorNomination, readinessAssessment, outputDir });
  artifacts.push(...successionReviews.artifacts);

  // Phase 10: Emergency Succession Plans
  const emergencyPlans = await ctx.task(emergencyPlansTask, { organizationName, criticalRoles: roleIdentification.criticalRoles, successorNomination, outputDir });
  artifacts.push(...emergencyPlans.artifacts);

  // Phase 11: Metrics and Reporting
  const metricsReporting = await ctx.task(metricsReportingTask, { organizationName, roleIdentification, successorNomination, readinessAssessment, gapAnalysis, outputDir });
  artifacts.push(...metricsReporting.artifacts);

  // Phase 12: Succession Dashboard
  const successionDashboard = await ctx.task(successionDashboardTask, { organizationName, allData: { roleIdentification, successorNomination, readinessAssessment, gapAnalysis, metricsReporting }, outputDir });
  artifacts.push(...successionDashboard.artifacts);

  return {
    success: true,
    organizationName,
    criticalRolesIdentified: roleIdentification.criticalRolesCount,
    successorPipeline: { total: successorNomination.nominationsCount, coverage: successorNomination.coverage },
    readinessAssessment: readinessAssessment.summary,
    developmentPlans: developmentPlanning.plans,
    gapAnalysis: gapAnalysis.gaps,
    metrics: metricsReporting.metrics,
    artifacts,
    metadata: { processId: 'specializations/domains/business/human-resources/succession-planning', timestamp: startTime, outputDir }
  };
}

export const roleIdentificationTask = defineTask('role-identification', (args, taskCtx) => ({
  kind: 'agent', title: `Phase 1: Critical Role Identification - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Succession Planning Specialist', task: 'Identify critical roles for succession planning', context: args, instructions: ['1. Define critical role criteria', '2. Analyze organizational impact', '3. Assess difficulty to fill', '4. Evaluate strategic importance', '5. Consider retirement risk', '6. Identify all critical roles', '7. Prioritize roles', '8. Document role profiles', '9. Get leadership approval', '10. Create critical roles list'], outputFormat: 'JSON object with critical roles' }, outputSchema: { type: 'object', required: ['criticalRoles', 'criticalRolesCount', 'criteria', 'artifacts'], properties: { criticalRoles: { type: 'array', items: { type: 'object' } }, criticalRolesCount: { type: 'number' }, criteria: { type: 'object' }, retirementRisk: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['hr', 'succession', 'role-identification']
}));

export const talentAssessmentTask = defineTask('talent-assessment', (args, taskCtx) => ({
  kind: 'agent', title: `Phase 2: Talent Assessment - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Talent Assessment Specialist', task: 'Assess internal talent for succession', context: args, instructions: ['1. Design assessment framework', '2. Assess performance history', '3. Evaluate leadership competencies', '4. Assess potential', '5. Review career aspirations', '6. Conduct 360 feedback', '7. Create talent profiles', '8. Segment talent pool', '9. Identify succession candidates', '10. Document assessments'], outputFormat: 'JSON object with talent assessment' }, outputSchema: { type: 'object', required: ['assessments', 'talentProfiles', 'artifacts'], properties: { assessments: { type: 'array', items: { type: 'object' } }, talentProfiles: { type: 'array', items: { type: 'object' } }, potentialRatings: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['hr', 'succession', 'talent-assessment']
}));

export const hipoIdentificationTask = defineTask('hipo-identification', (args, taskCtx) => ({
  kind: 'agent', title: `Phase 3: High-Potential Identification - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'High-Potential Program Manager', task: 'Identify high-potential employees', context: args, instructions: ['1. Define HIPO criteria', '2. Apply 9-box analysis', '3. Assess learning agility', '4. Evaluate leadership potential', '5. Consider engagement', '6. Review manager nominations', '7. Calibrate across organization', '8. Create HIPO list', '9. Segment by readiness', '10. Document identification'], outputFormat: 'JSON object with HIPOs' }, outputSchema: { type: 'object', required: ['highPotentials', 'artifacts'], properties: { highPotentials: { type: 'array', items: { type: 'object' } }, nineBox: { type: 'object' }, criteria: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['hr', 'succession', 'hipo']
}));

export const successorNominationTask = defineTask('successor-nomination', (args, taskCtx) => ({
  kind: 'agent', title: `Phase 4: Successor Nomination - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Succession Planning Coordinator', task: 'Nominate successors for critical roles', context: args, instructions: ['1. Match candidates to roles', '2. Request nominations', '3. Review nominations', '4. Ensure bench depth', '5. Identify gaps', '6. Create succession slates', '7. Designate ready-now', '8. Designate developing', '9. Get leadership approval', '10. Document nominations'], outputFormat: 'JSON object with nominations' }, outputSchema: { type: 'object', required: ['nominations', 'nominationsCount', 'coverage', 'artifacts'], properties: { nominations: { type: 'array', items: { type: 'object' } }, nominationsCount: { type: 'number' }, coverage: { type: 'object' }, gaps: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['hr', 'succession', 'nomination']
}));

export const readinessAssessmentTask = defineTask('readiness-assessment', (args, taskCtx) => ({
  kind: 'agent', title: `Phase 5: Readiness Assessment - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Readiness Analyst', task: 'Assess successor readiness', context: args, instructions: ['1. Define readiness criteria', '2. Assess each successor', '3. Evaluate skill gaps', '4. Assess experience gaps', '5. Determine readiness timeline', '6. Categorize readiness levels', '7. Create readiness profiles', '8. Identify accelerators', '9. Document assessments', '10. Create readiness summary'], outputFormat: 'JSON object with readiness assessment' }, outputSchema: { type: 'object', required: ['readinessLevels', 'summary', 'artifacts'], properties: { readinessLevels: { type: 'object' }, readinessProfiles: { type: 'array', items: { type: 'object' } }, summary: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['hr', 'succession', 'readiness']
}));

export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `Phase 6: Gap Analysis - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Gap Analysis Specialist', task: 'Analyze succession gaps', context: args, instructions: ['1. Identify coverage gaps', '2. Analyze readiness gaps', '3. Assess skill gaps', '4. Identify experience gaps', '5. Analyze diversity gaps', '6. Prioritize gaps', '7. Recommend solutions', '8. Plan external hiring', '9. Document gaps', '10. Create gap report'], outputFormat: 'JSON object with gap analysis' }, outputSchema: { type: 'object', required: ['gaps', 'recommendations', 'artifacts'], properties: { gaps: { type: 'array', items: { type: 'object' } }, coverageGaps: { type: 'array', items: { type: 'object' } }, skillGaps: { type: 'object' }, recommendations: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['hr', 'succession', 'gap-analysis']
}));

export const developmentPlanningTask = defineTask('development-planning', (args, taskCtx) => ({
  kind: 'agent', title: `Phase 7: Development Planning - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Development Planning Specialist', task: 'Create successor development plans', context: args, instructions: ['1. Create IDP templates', '2. Design development activities', '3. Plan stretch assignments', '4. Schedule job rotations', '5. Assign mentors', '6. Plan coaching', '7. Schedule training', '8. Create milestone checkpoints', '9. Get manager buy-in', '10. Document plans'], outputFormat: 'JSON object with development plans' }, outputSchema: { type: 'object', required: ['plans', 'artifacts'], properties: { plans: { type: 'array', items: { type: 'object' } }, developmentActivities: { type: 'object' }, stretchAssignments: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['hr', 'succession', 'development']
}));

export const hipoProgramTask = defineTask('hipo-program', (args, taskCtx) => ({
  kind: 'agent', title: `Phase 8: High-Potential Program - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'HIPO Program Manager', task: 'Design high-potential program', context: args, instructions: ['1. Design HIPO program', '2. Plan executive exposure', '3. Create cohort learning', '4. Assign sponsors', '5. Plan special projects', '6. Schedule development', '7. Create retention strategy', '8. Plan career conversations', '9. Track progress', '10. Document program'], outputFormat: 'JSON object with HIPO program' }, outputSchema: { type: 'object', required: ['program', 'artifacts'], properties: { program: { type: 'object' }, executiveExposure: { type: 'array', items: { type: 'object' } }, specialProjects: { type: 'array', items: { type: 'object' } }, retentionStrategy: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['hr', 'succession', 'hipo-program']
}));

export const successionReviewsTask = defineTask('succession-reviews', (args, taskCtx) => ({
  kind: 'agent', title: `Phase 9: Succession Reviews - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Succession Review Facilitator', task: 'Facilitate succession review meetings', context: args, instructions: ['1. Schedule review meetings', '2. Prepare review materials', '3. Facilitate talent reviews', '4. Discuss successors', '5. Calibrate assessments', '6. Validate nominations', '7. Update succession plans', '8. Document decisions', '9. Communicate outcomes', '10. Plan follow-ups'], outputFormat: 'JSON object with review outcomes' }, outputSchema: { type: 'object', required: ['reviewOutcomes', 'artifacts'], properties: { reviewOutcomes: { type: 'array', items: { type: 'object' } }, decisions: { type: 'array', items: { type: 'object' } }, updates: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['hr', 'succession', 'reviews']
}));

export const emergencyPlansTask = defineTask('emergency-plans', (args, taskCtx) => ({
  kind: 'agent', title: `Phase 10: Emergency Succession Plans - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Business Continuity Planner', task: 'Create emergency succession plans', context: args, instructions: ['1. Identify key positions', '2. Create emergency protocols', '3. Designate interim successors', '4. Document critical knowledge', '5. Plan transition activities', '6. Create communication plans', '7. Identify external resources', '8. Test emergency plans', '9. Update regularly', '10. Document plans'], outputFormat: 'JSON object with emergency plans' }, outputSchema: { type: 'object', required: ['emergencyPlans', 'artifacts'], properties: { emergencyPlans: { type: 'array', items: { type: 'object' } }, interimSuccessors: { type: 'array', items: { type: 'object' } }, protocols: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['hr', 'succession', 'emergency']
}));

export const metricsReportingTask = defineTask('metrics-reporting', (args, taskCtx) => ({
  kind: 'agent', title: `Phase 11: Metrics and Reporting - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Succession Analytics Specialist', task: 'Create succession metrics and reports', context: args, instructions: ['1. Define succession metrics', '2. Calculate bench strength', '3. Track readiness progress', '4. Measure internal fill rate', '5. Track development completion', '6. Analyze diversity metrics', '7. Calculate risk indicators', '8. Create executive report', '9. Benchmark performance', '10. Document metrics'], outputFormat: 'JSON object with metrics' }, outputSchema: { type: 'object', required: ['metrics', 'artifacts'], properties: { metrics: { type: 'object' }, benchStrength: { type: 'object' }, internalFillRate: { type: 'number' }, diversityMetrics: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['hr', 'succession', 'metrics']
}));

export const successionDashboardTask = defineTask('succession-dashboard', (args, taskCtx) => ({
  kind: 'agent', title: `Phase 12: Succession Dashboard - ${args.organizationName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Dashboard Designer', task: 'Create succession planning dashboard', context: args, instructions: ['1. Design dashboard layout', '2. Create visualizations', '3. Display key metrics', '4. Show succession pipeline', '5. Highlight risks', '6. Track progress', '7. Enable drill-down', '8. Add filtering', '9. Set up alerts', '10. Deploy dashboard'], outputFormat: 'JSON object with dashboard' }, outputSchema: { type: 'object', required: ['dashboard', 'artifacts'], properties: { dashboard: { type: 'object' }, visualizations: { type: 'array', items: { type: 'object' } }, alerts: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['hr', 'succession', 'dashboard']
}));
