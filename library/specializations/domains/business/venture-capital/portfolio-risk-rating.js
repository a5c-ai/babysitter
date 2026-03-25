/**
 * @process venture-capital/portfolio-risk-rating
 * @description Standardized risk rating system for portfolio companies including early warning indicators, intervention triggers, and escalation protocols
 * @inputs { fundName: string, portfolioCompanies: array, ratingFramework: object, priorRatings: object }
 * @outputs { success: boolean, riskRatings: object, watchList: array, interventions: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    fundName,
    portfolioCompanies = [],
    ratingFramework = {},
    priorRatings = {},
    outputDir = 'risk-rating-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Risk Factor Assessment
  ctx.log('info', 'Assessing risk factors for portfolio companies');
  const riskFactorAssessment = await ctx.task(riskFactorTask, {
    portfolioCompanies,
    ratingFramework,
    outputDir
  });

  if (!riskFactorAssessment.success) {
    return {
      success: false,
      error: 'Risk factor assessment failed',
      details: riskFactorAssessment,
      metadata: { processId: 'venture-capital/portfolio-risk-rating', timestamp: startTime }
    };
  }

  artifacts.push(...riskFactorAssessment.artifacts);

  // Task 2: Risk Score Calculation
  ctx.log('info', 'Calculating risk scores');
  const riskScoring = await ctx.task(riskScoringTask, {
    riskFactorAssessment,
    ratingFramework,
    outputDir
  });

  artifacts.push(...riskScoring.artifacts);

  // Task 3: Rating Assignment
  ctx.log('info', 'Assigning risk ratings');
  const ratingAssignment = await ctx.task(ratingAssignmentTask, {
    riskScoring,
    priorRatings,
    ratingFramework,
    outputDir
  });

  artifacts.push(...ratingAssignment.artifacts);

  // Task 4: Early Warning Detection
  ctx.log('info', 'Detecting early warning indicators');
  const earlyWarning = await ctx.task(earlyWarningTask, {
    portfolioCompanies,
    riskFactorAssessment,
    priorRatings,
    outputDir
  });

  artifacts.push(...earlyWarning.artifacts);

  // Task 5: Watch List Management
  ctx.log('info', 'Managing watch list');
  const watchList = await ctx.task(watchListTask, {
    ratingAssignment,
    earlyWarning,
    priorRatings,
    outputDir
  });

  artifacts.push(...watchList.artifacts);

  // Breakpoint: Review risk ratings
  await ctx.breakpoint({
    question: `Risk ratings complete for ${portfolioCompanies.length} companies. ${watchList.companies.length} on watch list. ${earlyWarning.alerts.length} early warnings. Review ratings?`,
    title: 'Portfolio Risk Rating Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        companiesRated: ratingAssignment.ratings.length,
        greenRatings: ratingAssignment.byRating.green || 0,
        yellowRatings: ratingAssignment.byRating.yellow || 0,
        redRatings: ratingAssignment.byRating.red || 0,
        watchListCount: watchList.companies.length,
        earlyWarnings: earlyWarning.alerts.length
      }
    }
  });

  // Task 6: Intervention Planning
  ctx.log('info', 'Planning interventions');
  const interventionPlanning = await ctx.task(interventionTask, {
    watchList,
    ratingAssignment,
    earlyWarning,
    outputDir
  });

  artifacts.push(...interventionPlanning.artifacts);

  // Task 7: Escalation Protocol Setup
  ctx.log('info', 'Setting up escalation protocols');
  const escalationProtocol = await ctx.task(escalationTask, {
    ratingFramework,
    watchList,
    interventionPlanning,
    outputDir
  });

  artifacts.push(...escalationProtocol.artifacts);

  // Task 8: Generate Risk Rating Report
  ctx.log('info', 'Generating risk rating report');
  const riskReport = await ctx.task(riskReportTask, {
    fundName,
    riskFactorAssessment,
    riskScoring,
    ratingAssignment,
    earlyWarning,
    watchList,
    interventionPlanning,
    escalationProtocol,
    outputDir
  });

  artifacts.push(...riskReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    riskRatings: {
      ratings: ratingAssignment.ratings,
      distribution: ratingAssignment.byRating,
      changes: ratingAssignment.changes
    },
    watchList: watchList.companies,
    earlyWarnings: earlyWarning.alerts,
    interventions: interventionPlanning.plans,
    escalationProtocol: escalationProtocol.protocol,
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/portfolio-risk-rating',
      timestamp: startTime,
      fundName
    }
  };
}

// Task 1: Risk Factor Assessment
export const riskFactorTask = defineTask('risk-factor-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess risk factors',
  agent: {
    name: 'risk-assessor',
    prompt: {
      role: 'portfolio risk analyst',
      task: 'Assess risk factors for each portfolio company',
      context: args,
      instructions: [
        'Evaluate financial risk factors (runway, burn, revenue)',
        'Assess operational risk factors (team, execution)',
        'Evaluate market risk factors (competition, timing)',
        'Assess strategic risk factors (product, GTM)',
        'Evaluate governance risk factors',
        'Assess external risk factors',
        'Document risk factor scores',
        'Identify critical risk areas'
      ],
      outputFormat: 'JSON with risk factors by company and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'byCompany', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        byCompany: { type: 'array' },
        criticalFactors: { type: 'array' },
        riskCategories: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'risk-rating', 'assessment']
}));

// Task 2: Risk Score Calculation
export const riskScoringTask = defineTask('risk-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate risk scores',
  agent: {
    name: 'risk-scorer',
    prompt: {
      role: 'quantitative risk analyst',
      task: 'Calculate risk scores from factors',
      context: args,
      instructions: [
        'Apply scoring weights to factors',
        'Calculate category scores',
        'Compute overall risk scores',
        'Normalize scores for comparison',
        'Calculate score changes from prior',
        'Identify score drivers',
        'Rank companies by risk',
        'Document scoring methodology'
      ],
      outputFormat: 'JSON with risk scores and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'byCategory', 'artifacts'],
      properties: {
        scores: { type: 'array' },
        byCategory: { type: 'object' },
        ranking: { type: 'array' },
        scoreDrivers: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'risk-rating', 'scoring']
}));

// Task 3: Rating Assignment
export const ratingAssignmentTask = defineTask('rating-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assign risk ratings',
  agent: {
    name: 'rating-analyst',
    prompt: {
      role: 'portfolio rating specialist',
      task: 'Assign standardized risk ratings',
      context: args,
      instructions: [
        'Apply rating thresholds',
        'Assign Green/Yellow/Red ratings',
        'Consider qualitative factors',
        'Compare to prior ratings',
        'Document rating changes',
        'Identify rating drivers',
        'Calculate rating distribution',
        'Document rating rationale'
      ],
      outputFormat: 'JSON with ratings and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ratings', 'byRating', 'changes', 'artifacts'],
      properties: {
        ratings: { type: 'array' },
        byRating: { type: 'object' },
        changes: { type: 'array' },
        rationale: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'risk-rating', 'assignment']
}));

// Task 4: Early Warning Detection
export const earlyWarningTask = defineTask('early-warning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect early warnings',
  agent: {
    name: 'warning-detector',
    prompt: {
      role: 'early warning specialist',
      task: 'Detect early warning indicators',
      context: args,
      instructions: [
        'Monitor leading indicators',
        'Detect trend deterioration',
        'Identify sudden metric changes',
        'Flag management concerns',
        'Detect competitive threats',
        'Monitor market changes',
        'Generate early warning alerts',
        'Prioritize warnings by severity'
      ],
      outputFormat: 'JSON with early warnings and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alerts', 'byCompany', 'artifacts'],
      properties: {
        alerts: { type: 'array' },
        byCompany: { type: 'object' },
        indicators: { type: 'array' },
        trends: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'risk-rating', 'early-warning']
}));

// Task 5: Watch List Management
export const watchListTask = defineTask('watch-list', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Manage watch list',
  agent: {
    name: 'watch-list-manager',
    prompt: {
      role: 'portfolio monitoring specialist',
      task: 'Manage portfolio watch list',
      context: args,
      instructions: [
        'Identify companies for watch list',
        'Apply watch list criteria',
        'Update watch list membership',
        'Track watch list duration',
        'Set monitoring frequency',
        'Define exit criteria',
        'Document watch list rationale',
        'Plan monitoring activities'
      ],
      outputFormat: 'JSON with watch list and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['companies', 'criteria', 'artifacts'],
      properties: {
        companies: { type: 'array' },
        criteria: { type: 'object' },
        additions: { type: 'array' },
        removals: { type: 'array' },
        monitoringPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'risk-rating', 'watch-list']
}));

// Task 6: Intervention Planning
export const interventionTask = defineTask('intervention-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan interventions',
  agent: {
    name: 'intervention-planner',
    prompt: {
      role: 'portfolio intervention specialist',
      task: 'Plan interventions for at-risk companies',
      context: args,
      instructions: [
        'Identify intervention needs',
        'Define intervention types',
        'Create intervention plans',
        'Assign intervention owners',
        'Set intervention timelines',
        'Define success criteria',
        'Plan board discussions',
        'Document intervention strategies'
      ],
      outputFormat: 'JSON with intervention plans and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plans', 'byCompany', 'artifacts'],
      properties: {
        plans: { type: 'array' },
        byCompany: { type: 'object' },
        interventionTypes: { type: 'array' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'risk-rating', 'intervention']
}));

// Task 7: Escalation Protocol Setup
export const escalationTask = defineTask('escalation-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup escalation protocols',
  agent: {
    name: 'escalation-manager',
    prompt: {
      role: 'risk governance specialist',
      task: 'Setup risk escalation protocols',
      context: args,
      instructions: [
        'Define escalation triggers',
        'Set escalation levels',
        'Assign escalation responsibilities',
        'Define communication protocols',
        'Set response timeframes',
        'Plan IC involvement triggers',
        'Document escalation procedures',
        'Create escalation checklists'
      ],
      outputFormat: 'JSON with escalation protocol and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'triggers', 'artifacts'],
      properties: {
        protocol: { type: 'object' },
        triggers: { type: 'array' },
        levels: { type: 'array' },
        responsibilities: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'risk-rating', 'escalation']
}));

// Task 8: Risk Rating Report
export const riskReportTask = defineTask('risk-rating-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate risk rating report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'portfolio risk manager',
      task: 'Generate portfolio risk rating report',
      context: args,
      instructions: [
        'Create executive summary',
        'Present rating distribution',
        'Document rating changes',
        'Include early warning alerts',
        'Present watch list status',
        'Include intervention plans',
        'Document escalation protocols',
        'Format for GP/IC reporting'
      ],
      outputFormat: 'JSON with report path and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        highlights: { type: 'array' },
        actionItems: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'risk-rating', 'reporting']
}));
