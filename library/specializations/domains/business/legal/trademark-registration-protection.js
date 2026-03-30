/**
 * @process specializations/domains/business/legal/trademark-registration-protection
 * @description Trademark Registration and Protection - Trademark clearance, application filing, monitoring,
 * and enforcement procedures for brand protection.
 * @inputs { trademark: object, action?: string, jurisdiction?: array, outputDir?: string }
 * @outputs { success: boolean, clearanceReport: object, application: object, monitoringSetup: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/trademark-registration-protection', {
 *   trademark: { name: 'ACME SOLUTIONS', type: 'word-mark', classes: [9, 42] },
 *   action: 'full-cycle',
 *   jurisdiction: ['US', 'EU'],
 *   outputDir: 'trademark-filings'
 * });
 *
 * @references
 * - USPTO Trademark Basics: https://www.uspto.gov/trademarks/basics
 * - McCarthy on Trademarks: https://store.legal.thomsonreuters.com/law-products/Treatises/McCarthy-on-Trademarks-and-Unfair-Competition-5th/p/100028885
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    trademark,
    action = 'clearance', // 'clearance', 'file', 'monitor', 'enforce', 'full-cycle'
    jurisdiction = ['US'],
    outputDir = 'trademark-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Trademark Process for ${trademark.name} - Action: ${action}`);

  // Phase 1: Trademark Clearance Search
  const clearanceSearch = await ctx.task(trademarkClearanceTask, {
    trademark,
    jurisdiction,
    outputDir
  });
  artifacts.push(...clearanceSearch.artifacts);

  // Quality Gate: Clearance Decision
  await ctx.breakpoint({
    question: `Trademark clearance for "${trademark.name}". Risk Level: ${clearanceSearch.riskLevel}. ${clearanceSearch.conflictsFound} potential conflicts. Proceed with filing?`,
    title: 'Trademark Clearance Review',
    context: {
      runId: ctx.runId,
      riskLevel: clearanceSearch.riskLevel,
      conflictsFound: clearanceSearch.conflictsFound,
      files: clearanceSearch.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  if (action === 'clearance') {
    return { success: true, action, clearanceReport: clearanceSearch, artifacts, metadata: { processId: 'specializations/domains/business/legal/trademark-registration-protection', timestamp: startTime } };
  }

  // Phase 2: Application Preparation
  const applicationPrep = await ctx.task(trademarkApplicationTask, {
    trademark,
    jurisdiction,
    clearanceSearch,
    outputDir
  });
  artifacts.push(...applicationPrep.artifacts);

  // Phase 3: Filing
  const filing = await ctx.task(trademarkFilingTask, {
    applications: applicationPrep.applications,
    outputDir
  });
  artifacts.push(...filing.artifacts);

  if (action === 'file') {
    return { success: true, action, clearanceReport: clearanceSearch, application: filing, artifacts, metadata: { processId: 'specializations/domains/business/legal/trademark-registration-protection', timestamp: startTime } };
  }

  // Phase 4: Monitoring Setup
  const monitoring = await ctx.task(trademarkMonitoringTask, {
    trademark,
    applicationIds: filing.applicationIds,
    jurisdiction,
    outputDir
  });
  artifacts.push(...monitoring.artifacts);

  // Phase 5: Enforcement Strategy (if applicable)
  let enforcement = null;
  if (action === 'enforce' || action === 'full-cycle') {
    enforcement = await ctx.task(trademarkEnforcementTask, {
      trademark,
      monitoringAlerts: monitoring.alerts,
      outputDir
    });
    artifacts.push(...enforcement.artifacts);
  }

  return {
    success: true,
    action,
    clearanceReport: clearanceSearch,
    application: filing,
    monitoringSetup: monitoring,
    enforcement: enforcement?.strategy,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/trademark-registration-protection', timestamp: startTime }
  };
}

export const trademarkClearanceTask = defineTask('trademark-clearance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct trademark clearance',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Trademark Clearance Specialist',
      task: 'Conduct trademark clearance search',
      context: args,
      instructions: ['Search USPTO database', 'Search common law sources', 'Identify similar marks', 'Assess confusion likelihood', 'Rate risk level'],
      outputFormat: 'JSON with riskLevel, conflictsFound, conflicts array, artifacts'
    },
    outputSchema: { type: 'object', required: ['riskLevel', 'conflictsFound', 'artifacts'], properties: { riskLevel: { type: 'string' }, conflictsFound: { type: 'number' }, conflicts: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'trademark']
}));

export const trademarkApplicationTask = defineTask('trademark-application', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare trademark application',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Trademark Application Specialist',
      task: 'Prepare trademark applications',
      context: args,
      instructions: ['Prepare application for each jurisdiction', 'Select appropriate classes', 'Draft description of goods/services', 'Prepare specimen'],
      outputFormat: 'JSON with applications array, artifacts'
    },
    outputSchema: { type: 'object', required: ['applications', 'artifacts'], properties: { applications: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'trademark']
}));

export const trademarkFilingTask = defineTask('trademark-filing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'File trademark applications',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Trademark Filing Specialist',
      task: 'File trademark applications',
      context: args,
      instructions: ['Submit applications', 'Pay filing fees', 'Record confirmation numbers', 'Set up docketing'],
      outputFormat: 'JSON with applicationIds array, filingDates, artifacts'
    },
    outputSchema: { type: 'object', required: ['applicationIds', 'artifacts'], properties: { applicationIds: { type: 'array' }, filingDates: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'trademark']
}));

export const trademarkMonitoringTask = defineTask('trademark-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up trademark monitoring',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Trademark Watch Specialist',
      task: 'Set up trademark monitoring',
      context: args,
      instructions: ['Configure watch services', 'Set up alerts for similar marks', 'Monitor application status', 'Track renewals'],
      outputFormat: 'JSON with monitoringConfig, alerts array, artifacts'
    },
    outputSchema: { type: 'object', required: ['monitoringConfig', 'artifacts'], properties: { monitoringConfig: { type: 'object' }, alerts: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'trademark']
}));

export const trademarkEnforcementTask = defineTask('trademark-enforcement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop enforcement strategy',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Trademark Enforcement Specialist',
      task: 'Develop trademark enforcement strategy',
      context: args,
      instructions: ['Review monitoring alerts', 'Assess infringement severity', 'Develop response strategy', 'Draft cease and desist templates'],
      outputFormat: 'JSON with strategy object, artifacts'
    },
    outputSchema: { type: 'object', required: ['strategy', 'artifacts'], properties: { strategy: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'trademark']
}));
