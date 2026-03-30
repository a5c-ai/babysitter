/**
 * @process specializations/domains/business/legal/ip-portfolio-management
 * @description IP Portfolio Management - Systematic IP portfolio tracking, maintenance fee management,
 * and strategic portfolio optimization processes.
 * @inputs { portfolioId?: string, action?: string, assetType?: string, outputDir?: string }
 * @outputs { success: boolean, portfolioStatus: object, maintenanceSchedule: array, optimizationRecommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/ip-portfolio-management', {
 *   portfolioId: 'ACME-IP-PORTFOLIO',
 *   action: 'review',
 *   assetType: 'all',
 *   outputDir: 'ip-portfolio'
 * });
 *
 * @references
 * - AIPLA IP Management: https://www.aipla.org/
 * - WIPO IP Management: https://www.wipo.int/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    portfolioId = 'default-portfolio',
    action = 'review', // 'review', 'maintain', 'optimize', 'report'
    assetType = 'all', // 'patents', 'trademarks', 'copyrights', 'trade-secrets', 'all'
    outputDir = 'ip-portfolio-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting IP Portfolio Management - Action: ${action}`);

  // Phase 1: Portfolio Inventory
  const inventory = await ctx.task(portfolioInventoryTask, {
    portfolioId,
    assetType,
    outputDir
  });
  artifacts.push(...inventory.artifacts);

  ctx.log('info', `Portfolio contains ${inventory.totalAssets} IP assets`);

  // Phase 2: Maintenance Schedule
  const maintenanceSchedule = await ctx.task(maintenanceScheduleTask, {
    assets: inventory.assets,
    outputDir
  });
  artifacts.push(...maintenanceSchedule.artifacts);

  // Phase 3: Valuation Analysis
  const valuation = await ctx.task(portfolioValuationTask, {
    assets: inventory.assets,
    outputDir
  });
  artifacts.push(...valuation.artifacts);

  // Phase 4: Optimization Analysis
  const optimization = await ctx.task(portfolioOptimizationTask, {
    assets: inventory.assets,
    valuation: valuation.valuations,
    maintenanceSchedule: maintenanceSchedule.schedule,
    outputDir
  });
  artifacts.push(...optimization.artifacts);

  // Quality Gate: Review optimization recommendations
  if (optimization.recommendations.length > 0) {
    await ctx.breakpoint({
      question: `Portfolio optimization analysis complete. ${optimization.recommendations.length} recommendations. ${optimization.abandonmentCandidates} assets flagged for potential abandonment. Review?`,
      title: 'IP Portfolio Optimization Review',
      context: {
        runId: ctx.runId,
        recommendationsCount: optimization.recommendations.length,
        abandonmentCandidates: optimization.abandonmentCandidates,
        files: optimization.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Phase 5: Report Generation
  const report = await ctx.task(portfolioReportTask, {
    portfolioId,
    inventory,
    maintenanceSchedule,
    valuation,
    optimization,
    outputDir
  });
  artifacts.push(...report.artifacts);

  return {
    success: true,
    portfolioId,
    portfolioStatus: {
      totalAssets: inventory.totalAssets,
      byType: inventory.assetsByType,
      totalValue: valuation.totalValue
    },
    maintenanceSchedule: maintenanceSchedule.schedule,
    optimizationRecommendations: optimization.recommendations,
    reportPath: report.reportPath,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/ip-portfolio-management', timestamp: startTime }
  };
}

export const portfolioInventoryTask = defineTask('portfolio-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Inventory IP portfolio',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'IP Portfolio Manager',
      task: 'Inventory all IP assets in portfolio',
      context: args,
      instructions: ['Compile all IP assets', 'Categorize by type', 'Document status', 'Track ownership', 'Record filing dates'],
      outputFormat: 'JSON with assets array, totalAssets, assetsByType, artifacts'
    },
    outputSchema: { type: 'object', required: ['assets', 'totalAssets', 'artifacts'], properties: { assets: { type: 'array' }, totalAssets: { type: 'number' }, assetsByType: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ip-portfolio']
}));

export const maintenanceScheduleTask = defineTask('maintenance-schedule', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create maintenance schedule',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'IP Docketing Specialist',
      task: 'Create IP maintenance schedule',
      context: args,
      instructions: ['Identify all maintenance deadlines', 'Calculate maintenance fees', 'Create payment schedule', 'Set up reminders'],
      outputFormat: 'JSON with schedule array, upcomingDeadlines, totalFees, artifacts'
    },
    outputSchema: { type: 'object', required: ['schedule', 'artifacts'], properties: { schedule: { type: 'array' }, upcomingDeadlines: { type: 'number' }, totalFees: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ip-portfolio']
}));

export const portfolioValuationTask = defineTask('portfolio-valuation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Value IP portfolio',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'IP Valuation Specialist',
      task: 'Assess IP portfolio value',
      context: args,
      instructions: ['Assess strategic value of assets', 'Evaluate market potential', 'Consider maintenance costs', 'Calculate ROI'],
      outputFormat: 'JSON with valuations array, totalValue, artifacts'
    },
    outputSchema: { type: 'object', required: ['valuations', 'totalValue', 'artifacts'], properties: { valuations: { type: 'array' }, totalValue: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ip-portfolio']
}));

export const portfolioOptimizationTask = defineTask('portfolio-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize IP portfolio',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'IP Strategy Specialist',
      task: 'Optimize IP portfolio',
      context: args,
      instructions: ['Identify low-value assets', 'Recommend abandonments', 'Identify licensing opportunities', 'Suggest strategic acquisitions'],
      outputFormat: 'JSON with recommendations array, abandonmentCandidates, licensingOpportunities, artifacts'
    },
    outputSchema: { type: 'object', required: ['recommendations', 'abandonmentCandidates', 'artifacts'], properties: { recommendations: { type: 'array' }, abandonmentCandidates: { type: 'number' }, licensingOpportunities: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ip-portfolio']
}));

export const portfolioReportTask = defineTask('portfolio-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate portfolio report',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'IP Report Writer',
      task: 'Generate IP portfolio report',
      context: args,
      instructions: ['Summarize portfolio status', 'Present maintenance schedule', 'Include valuation analysis', 'Document recommendations'],
      outputFormat: 'JSON with reportPath, artifacts'
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ip-portfolio']
}));
