/**
 * @process specializations/domains/business/legal/compliance-risk-assessment
 * @description Compliance Risk Assessment - Systematic compliance risk identification, assessment, and prioritization
 * across regulatory domains and business operations.
 * @inputs { organizationProfile: object, assessmentScope?: array, methodology?: string, outputDir?: string }
 * @outputs { success: boolean, risks: array, riskMatrix: object, prioritizedRisks: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/compliance-risk-assessment', {
 *   organizationProfile: {
 *     name: 'Acme Corporation',
 *     industry: 'healthcare',
 *     size: 'medium'
 *   },
 *   assessmentScope: ['hipaa', 'anti-kickback', 'false-claims'],
 *   methodology: 'coso-erm',
 *   outputDir: 'risk-assessment'
 * });
 *
 * @references
 * - COSO ERM Framework: https://www.coso.org/guidance-erm
 * - ISO 31000 Risk Management: https://www.iso.org/iso-31000-risk-management.html
 * - OIG Compliance Program Guidance: https://oig.hhs.gov/compliance/compliance-guidance/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationProfile,
    assessmentScope = ['general'],
    methodology = 'coso-erm',
    existingControls = [],
    outputDir = 'risk-assessment-output',
    includeHeatMap = true,
    includeActionPlan = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Compliance Risk Assessment for ${organizationProfile.name}`);

  // Phase 1: Risk Universe Development
  const riskUniverse = await ctx.task(riskUniverseTask, {
    organizationProfile,
    assessmentScope,
    outputDir
  });
  artifacts.push(...riskUniverse.artifacts);

  // Phase 2: Risk Identification
  const riskIdentification = await ctx.task(riskIdentificationTask, {
    organizationProfile,
    riskUniverse: riskUniverse.universe,
    assessmentScope,
    outputDir
  });
  artifacts.push(...riskIdentification.artifacts);

  // Phase 3: Risk Analysis
  const riskAnalysis = await ctx.task(riskAnalysisTask, {
    risks: riskIdentification.risks,
    existingControls,
    methodology,
    outputDir
  });
  artifacts.push(...riskAnalysis.artifacts);

  // Phase 4: Risk Evaluation and Prioritization
  const riskEvaluation = await ctx.task(riskEvaluationTask, {
    analyzedRisks: riskAnalysis.analyzedRisks,
    outputDir
  });
  artifacts.push(...riskEvaluation.artifacts);

  // Phase 5: Heat Map Generation
  let heatMap = null;
  if (includeHeatMap) {
    heatMap = await ctx.task(heatMapGenerationTask, {
      risks: riskEvaluation.prioritizedRisks,
      outputDir
    });
    artifacts.push(...heatMap.artifacts);
  }

  // Phase 6: Action Plan Development
  let actionPlan = null;
  if (includeActionPlan) {
    actionPlan = await ctx.task(riskActionPlanTask, {
      prioritizedRisks: riskEvaluation.prioritizedRisks,
      outputDir
    });
    artifacts.push(...actionPlan.artifacts);
  }

  // Phase 7: Assessment Report
  const assessmentReport = await ctx.task(riskAssessmentReportTask, {
    organizationProfile,
    methodology,
    riskUniverse,
    riskIdentification,
    riskAnalysis,
    riskEvaluation,
    heatMap,
    actionPlan,
    outputDir
  });
  artifacts.push(...assessmentReport.artifacts);

  await ctx.breakpoint({
    question: `Risk assessment for ${organizationProfile.name} complete. ${riskEvaluation.prioritizedRisks.length} risks identified, ${riskEvaluation.highRiskCount} high priority. Approve assessment?`,
    title: 'Risk Assessment Review',
    context: {
      runId: ctx.runId,
      riskCount: riskEvaluation.prioritizedRisks.length,
      highRiskCount: riskEvaluation.highRiskCount,
      files: [{ path: assessmentReport.reportPath, format: 'markdown', label: 'Risk Assessment Report' }]
    }
  });

  return {
    success: true,
    organization: organizationProfile.name,
    methodology,
    risks: riskEvaluation.prioritizedRisks,
    riskMatrix: riskEvaluation.riskMatrix,
    prioritizedRisks: riskEvaluation.topRisks,
    heatMap: heatMap ? { path: heatMap.heatMapPath } : null,
    actionPlan: actionPlan ? { path: actionPlan.planPath, actions: actionPlan.actions } : null,
    reportPath: assessmentReport.reportPath,
    artifacts,
    metadata: {
      processId: 'specializations/domains/business/legal/compliance-risk-assessment',
      timestamp: startTime
    }
  };
}

// Task Definitions
export const riskUniverseTask = defineTask('risk-universe', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop risk universe',
  agent: {
    name: 'compliance-risk-analyst',
    prompt: {
      role: 'Risk Universe Developer',
      task: 'Develop comprehensive compliance risk universe',
      context: args,
      instructions: [
        'Identify all potential compliance risk categories',
        'Map risks to regulatory domains',
        'Consider industry-specific risks',
        'Include operational risk areas',
        'Document risk taxonomy'
      ],
      outputFormat: 'JSON with universe array, categories, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['universe', 'artifacts'],
      properties: {
        universe: { type: 'array', items: { type: 'object' } },
        categories: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'risk-assessment']
}));

export const riskIdentificationTask = defineTask('risk-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify compliance risks',
  agent: {
    name: 'compliance-risk-analyst',
    prompt: {
      role: 'Risk Identification Specialist',
      task: 'Identify specific compliance risks within risk universe',
      context: args,
      instructions: [
        'Review risk universe categories',
        'Identify specific risks per category',
        'Document risk descriptions',
        'Identify risk sources and causes',
        'Map risks to business processes'
      ],
      outputFormat: 'JSON with risks array, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'artifacts'],
      properties: {
        risks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'risk-assessment']
}));

export const riskAnalysisTask = defineTask('risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze compliance risks',
  agent: {
    name: 'compliance-risk-analyst',
    prompt: {
      role: 'Risk Analysis Specialist',
      task: 'Analyze identified risks for likelihood and impact',
      context: args,
      instructions: [
        'Assess inherent risk likelihood (1-5)',
        'Assess inherent risk impact (1-5)',
        'Evaluate existing control effectiveness',
        'Calculate residual risk scores',
        'Document analysis rationale'
      ],
      outputFormat: 'JSON with analyzedRisks array, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analyzedRisks', 'artifacts'],
      properties: {
        analyzedRisks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'risk-assessment']
}));

export const riskEvaluationTask = defineTask('risk-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate and prioritize risks',
  agent: {
    name: 'compliance-risk-analyst',
    prompt: {
      role: 'Risk Evaluation Specialist',
      task: 'Evaluate and prioritize risks based on analysis',
      context: args,
      instructions: [
        'Create risk matrix',
        'Categorize risks by priority (high/medium/low)',
        'Identify top risks requiring immediate attention',
        'Document risk tolerance thresholds',
        'Prioritize for mitigation'
      ],
      outputFormat: 'JSON with prioritizedRisks, riskMatrix, topRisks, highRiskCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedRisks', 'riskMatrix', 'highRiskCount', 'artifacts'],
      properties: {
        prioritizedRisks: { type: 'array', items: { type: 'object' } },
        riskMatrix: { type: 'object' },
        topRisks: { type: 'array', items: { type: 'object' } },
        highRiskCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'risk-assessment']
}));

export const heatMapGenerationTask = defineTask('heat-map-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate risk heat map',
  agent: {
    name: 'compliance-risk-analyst',
    prompt: {
      role: 'Risk Visualization Specialist',
      task: 'Generate visual risk heat map',
      context: args,
      instructions: [
        'Create likelihood x impact matrix visualization',
        'Color code by risk level',
        'Plot all risks on heat map',
        'Generate heat map document'
      ],
      outputFormat: 'JSON with heatMapPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['heatMapPath', 'artifacts'],
      properties: {
        heatMapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'risk-assessment']
}));

export const riskActionPlanTask = defineTask('risk-action-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop risk action plan',
  agent: {
    name: 'compliance-risk-analyst',
    prompt: {
      role: 'Risk Action Planner',
      task: 'Develop action plan to address prioritized risks',
      context: args,
      instructions: [
        'Define mitigation actions for high risks',
        'Assign action owners',
        'Set target completion dates',
        'Define success metrics',
        'Create action tracking document'
      ],
      outputFormat: 'JSON with planPath, actions array, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['planPath', 'actions', 'artifacts'],
      properties: {
        planPath: { type: 'string' },
        actions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'risk-assessment']
}));

export const riskAssessmentReportTask = defineTask('risk-assessment-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate assessment report',
  agent: {
    name: 'compliance-risk-analyst',
    prompt: {
      role: 'Risk Report Writer',
      task: 'Generate comprehensive risk assessment report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document methodology',
        'Present risk findings',
        'Include heat map',
        'Include action plan',
        'Provide recommendations'
      ],
      outputFormat: 'JSON with reportPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'risk-assessment']
}));
