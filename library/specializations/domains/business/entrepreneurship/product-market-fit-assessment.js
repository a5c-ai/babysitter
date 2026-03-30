/**
 * @process specializations/domains/business/entrepreneurship/product-market-fit-assessment
 * @description Product-Market Fit Assessment Process - Systematic process to measure and assess product-market fit using quantitative and qualitative signals.
 * @inputs { companyName: string, product: string, activeUsers: number, metrics?: object }
 * @outputs { success: boolean, pmfScorecard: object, surveyResults: object, retentionAnalysis: object, pmfDetermination: string }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/product-market-fit-assessment', {
 *   companyName: 'PMFCo',
 *   product: 'Team collaboration tool',
 *   activeUsers: 1000,
 *   metrics: { retention30d: 45, nps: 35 }
 * });
 *
 * @references
 * - Sean Ellis PMF Survey: https://www.startup-marketing.com/
 * - Superhuman PMF Engine: https://review.firstround.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { companyName, product, activeUsers, metrics = {} } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Product-Market Fit Assessment for ${companyName}`);

  // Phase 1: Sean Ellis Survey Design
  const ellisSurvey = await ctx.task(ellisSurveyTask, { companyName, product });
  artifacts.push(...(ellisSurvey.artifacts || []));

  // Phase 2: Retention Analysis
  const retentionAnalysis = await ctx.task(retentionAnalysisTask, { companyName, metrics });
  artifacts.push(...(retentionAnalysis.artifacts || []));

  // Phase 3: Qualitative Interviews
  const qualitativeInterviews = await ctx.task(qualitativeInterviewsTask, { companyName, product });
  artifacts.push(...(qualitativeInterviews.artifacts || []));

  // Phase 4: Organic Growth Signals
  const organicGrowth = await ctx.task(organicGrowthTask, { companyName, activeUsers });
  artifacts.push(...(organicGrowth.artifacts || []));

  // Phase 5: NPS Analysis
  const npsAnalysis = await ctx.task(npsAnalysisTask, { companyName, metrics });
  artifacts.push(...(npsAnalysis.artifacts || []));

  // Phase 6: Engagement Metrics
  const engagementMetrics = await ctx.task(engagementMetricsTask, { companyName, metrics });
  artifacts.push(...(engagementMetrics.artifacts || []));

  // Phase 7: PMF Scoring
  const pmfScoring = await ctx.task(pmfScoringTask, {
    companyName, ellisSurvey, retentionAnalysis, organicGrowth, npsAnalysis, engagementMetrics
  });
  artifacts.push(...(pmfScoring.artifacts || []));

  // Phase 8: PMF Determination
  const pmfDetermination = await ctx.task(pmfDeterminationTask, { companyName, pmfScoring });
  artifacts.push(...(pmfDetermination.artifacts || []));

  await ctx.breakpoint({
    question: `PMF Assessment complete for ${companyName}. Score: ${pmfScoring.overallScore}/100. Determination: ${pmfDetermination.status}. Approve?`,
    title: 'PMF Assessment Complete',
    context: { runId: ctx.runId, companyName, score: pmfScoring.overallScore, status: pmfDetermination.status, files: artifacts }
  });

  const endTime = ctx.now();

  return {
    success: true, companyName,
    pmfScorecard: pmfScoring,
    surveyResults: ellisSurvey,
    retentionAnalysis,
    pmfDetermination: pmfDetermination.status,
    recommendations: pmfDetermination.recommendations,
    artifacts, duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/entrepreneurship/product-market-fit-assessment', timestamp: startTime, version: '1.0.0' }
  };
}

export const ellisSurveyTask = defineTask('ellis-survey', (args, taskCtx) => ({
  kind: 'agent', title: `Sean Ellis Survey - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'PMF Assessment Expert', task: 'Design Sean Ellis PMF survey', context: args,
    instructions: ['1. Design core PMF question', '2. Add follow-up questions', '3. Define sample size needed', '4. Plan survey distribution', '5. Define response analysis', '6. Set 40% threshold benchmark', '7. Plan segmentation analysis', '8. Design improvement questions', '9. Plan survey cadence', '10. Create analysis dashboard'],
    outputFormat: 'JSON with survey, thresholds, analysis' },
    outputSchema: { type: 'object', required: ['survey', 'threshold'], properties: { survey: { type: 'object' }, threshold: { type: 'number' }, distribution: { type: 'object' }, analysisFramework: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'pmf', 'survey']
}));

export const retentionAnalysisTask = defineTask('retention-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `Retention Analysis - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Product Analytics Expert', task: 'Analyze retention curves', context: args,
    instructions: ['1. Build cohort retention curves', '2. Calculate Day 1/7/30 retention', '3. Identify retention plateau', '4. Compare to benchmarks', '5. Segment by user type', '6. Identify retention drivers', '7. Analyze churn patterns', '8. Calculate resurrection rates', '9. Build retention scorecard', '10. Identify improvement areas'],
    outputFormat: 'JSON with retentionCurves, benchmarks, insights' },
    outputSchema: { type: 'object', required: ['retentionCurves', 'benchmarkComparison'], properties: { retentionCurves: { type: 'object' }, benchmarkComparison: { type: 'object' }, insights: { type: 'array', items: { type: 'string' } }, improvements: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'pmf', 'retention']
}));

export const qualitativeInterviewsTask = defineTask('qualitative-interviews', (args, taskCtx) => ({
  kind: 'agent', title: `Qualitative Interviews - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'User Research Expert', task: 'Design qualitative PMF interviews', context: args,
    instructions: ['1. Design interview script', '2. Identify interview segments', '3. Plan recruitment', '4. Define synthesis method', '5. Create pattern recognition', '6. Identify power users', '7. Understand use cases', '8. Document testimonials', '9. Identify feature requests', '10. Create persona refinements'],
    outputFormat: 'JSON with interviewScript, synthesisMethod, patterns' },
    outputSchema: { type: 'object', required: ['interviewScript', 'patterns'], properties: { interviewScript: { type: 'object' }, synthesisMethod: { type: 'object' }, patterns: { type: 'array', items: { type: 'string' } }, testimonials: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'pmf', 'interviews']
}));

export const organicGrowthTask = defineTask('organic-growth', (args, taskCtx) => ({
  kind: 'agent', title: `Organic Growth Analysis - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Growth Analytics Expert', task: 'Analyze organic growth signals', context: args,
    instructions: ['1. Calculate organic acquisition %', '2. Analyze referral rates', '3. Measure word-of-mouth', '4. Calculate viral coefficient', '5. Analyze inbound requests', '6. Measure waitlist growth', '7. Analyze PR mentions', '8. Track social mentions', '9. Analyze search trends', '10. Score organic growth'],
    outputFormat: 'JSON with organicMetrics, viralCoefficient, score' },
    outputSchema: { type: 'object', required: ['organicMetrics', 'viralCoefficient'], properties: { organicMetrics: { type: 'object' }, viralCoefficient: { type: 'number' }, referralRate: { type: 'number' }, score: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'pmf', 'growth']
}));

export const npsAnalysisTask = defineTask('nps-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `NPS Analysis - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Customer Experience Expert', task: 'Analyze Net Promoter Score', context: args,
    instructions: ['1. Calculate NPS score', '2. Segment by user type', '3. Analyze promoter feedback', '4. Analyze detractor feedback', '5. Identify NPS drivers', '6. Compare to benchmarks', '7. Track NPS trends', '8. Analyze follow-up reasons', '9. Calculate response rate', '10. Create NPS action plan'],
    outputFormat: 'JSON with npsScore, segmentation, actionPlan' },
    outputSchema: { type: 'object', required: ['npsScore', 'segmentation'], properties: { npsScore: { type: 'number' }, segmentation: { type: 'object' }, drivers: { type: 'array', items: { type: 'string' } }, benchmarks: { type: 'object' }, actionPlan: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'pmf', 'nps']
}));

export const engagementMetricsTask = defineTask('engagement-metrics', (args, taskCtx) => ({
  kind: 'agent', title: `Engagement Metrics - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Product Analytics Expert', task: 'Analyze engagement metrics', context: args,
    instructions: ['1. Calculate DAU/MAU ratio', '2. Analyze session frequency', '3. Measure time in product', '4. Track feature adoption', '5. Identify power features', '6. Analyze usage patterns', '7. Calculate stickiness', '8. Compare to benchmarks', '9. Segment by user type', '10. Create engagement scorecard'],
    outputFormat: 'JSON with engagementMetrics, stickiness, benchmarks' },
    outputSchema: { type: 'object', required: ['engagementMetrics', 'stickiness'], properties: { engagementMetrics: { type: 'object' }, stickiness: { type: 'number' }, dauMau: { type: 'number' }, benchmarks: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'pmf', 'engagement']
}));

export const pmfScoringTask = defineTask('pmf-scoring', (args, taskCtx) => ({
  kind: 'agent', title: `PMF Scoring - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'PMF Assessment Expert', task: 'Calculate overall PMF score', context: args,
    instructions: ['1. Weight PMF dimensions', '2. Calculate survey score', '3. Calculate retention score', '4. Calculate growth score', '5. Calculate NPS score', '6. Calculate engagement score', '7. Combine weighted scores', '8. Calculate confidence level', '9. Compare to benchmarks', '10. Create PMF scorecard'],
    outputFormat: 'JSON with overallScore, dimensionScores, confidence' },
    outputSchema: { type: 'object', required: ['overallScore', 'dimensionScores'], properties: { overallScore: { type: 'number' }, dimensionScores: { type: 'object' }, confidence: { type: 'string' }, benchmarks: { type: 'object' }, scorecard: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'pmf', 'scoring']
}));

export const pmfDeterminationTask = defineTask('pmf-determination', (args, taskCtx) => ({
  kind: 'agent', title: `PMF Determination - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'PMF Strategy Expert', task: 'Make PMF determination', context: args,
    instructions: ['1. Evaluate evidence strength', '2. Make PMF status determination', '3. Identify strongest signals', '4. Identify weakest areas', '5. Create improvement roadmap', '6. Define next milestones', '7. Plan re-assessment timing', '8. Create stakeholder summary', '9. Define scaling criteria', '10. Document recommendations'],
    outputFormat: 'JSON with status, confidence, recommendations' },
    outputSchema: { type: 'object', required: ['status', 'confidence', 'recommendations'], properties: { status: { type: 'string', enum: ['achieved', 'close', 'not-yet', 'unclear'] }, confidence: { type: 'string' }, strongSignals: { type: 'array', items: { type: 'string' } }, weakAreas: { type: 'array', items: { type: 'string' } }, recommendations: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'pmf', 'determination']
}));
