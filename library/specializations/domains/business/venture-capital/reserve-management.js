/**
 * @process venture-capital/reserve-management
 * @description Framework for managing fund reserves, evaluating follow-on investment opportunities, and optimizing capital deployment across portfolio lifecycle
 * @inputs { fundName: string, fundData: object, portfolioCompanies: array, reservePolicy: object }
 * @outputs { success: boolean, reserveAnalysis: object, followOnPlan: object, deploymentStrategy: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    fundName,
    fundData = {},
    portfolioCompanies = [],
    reservePolicy = {},
    outputDir = 'reserve-management-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Current Reserve Analysis
  ctx.log('info', 'Analyzing current reserve position');
  const reserveAnalysis = await ctx.task(reserveAnalysisTask, {
    fundName,
    fundData,
    reservePolicy,
    outputDir
  });

  if (!reserveAnalysis.success) {
    return {
      success: false,
      error: 'Reserve analysis failed',
      details: reserveAnalysis,
      metadata: { processId: 'venture-capital/reserve-management', timestamp: startTime }
    };
  }

  artifacts.push(...reserveAnalysis.artifacts);

  // Task 2: Portfolio Follow-On Assessment
  ctx.log('info', 'Assessing portfolio follow-on needs');
  const followOnAssessment = await ctx.task(followOnAssessmentTask, {
    portfolioCompanies,
    reserveAnalysis,
    outputDir
  });

  artifacts.push(...followOnAssessment.artifacts);

  // Task 3: Follow-On Prioritization
  ctx.log('info', 'Prioritizing follow-on opportunities');
  const followOnPrioritization = await ctx.task(followOnPrioritizationTask, {
    followOnAssessment,
    reserveAnalysis,
    reservePolicy,
    outputDir
  });

  artifacts.push(...followOnPrioritization.artifacts);

  // Task 4: Capital Deployment Modeling
  ctx.log('info', 'Modeling capital deployment scenarios');
  const deploymentModeling = await ctx.task(deploymentModelingTask, {
    reserveAnalysis,
    followOnPrioritization,
    fundData,
    outputDir
  });

  artifacts.push(...deploymentModeling.artifacts);

  // Task 5: Reserve Optimization
  ctx.log('info', 'Optimizing reserve allocation');
  const reserveOptimization = await ctx.task(reserveOptimizationTask, {
    reserveAnalysis,
    followOnAssessment,
    deploymentModeling,
    reservePolicy,
    outputDir
  });

  artifacts.push(...reserveOptimization.artifacts);

  // Breakpoint: Review reserve strategy
  await ctx.breakpoint({
    question: `Reserve analysis complete for ${fundName}. Available reserves: $${reserveAnalysis.availableReserves}M. Follow-on needs: $${followOnAssessment.totalNeeds}M. Review strategy?`,
    title: 'Reserve Management Analysis',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalReserves: reserveAnalysis.totalReserves,
        availableReserves: reserveAnalysis.availableReserves,
        allocatedReserves: reserveAnalysis.allocatedReserves,
        followOnNeeds: followOnAssessment.totalNeeds,
        coverageRatio: reserveOptimization.coverageRatio
      }
    }
  });

  // Task 6: Follow-On Investment Plan
  ctx.log('info', 'Creating follow-on investment plan');
  const followOnPlan = await ctx.task(followOnPlanTask, {
    followOnPrioritization,
    reserveOptimization,
    fundData,
    outputDir
  });

  artifacts.push(...followOnPlan.artifacts);

  // Task 7: Risk Assessment
  ctx.log('info', 'Assessing reserve management risks');
  const riskAssessment = await ctx.task(reserveRiskTask, {
    reserveAnalysis,
    followOnAssessment,
    deploymentModeling,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // Task 8: Generate Reserve Report
  ctx.log('info', 'Generating reserve management report');
  const reserveReport = await ctx.task(reserveReportTask, {
    fundName,
    reserveAnalysis,
    followOnAssessment,
    followOnPrioritization,
    deploymentModeling,
    reserveOptimization,
    followOnPlan,
    riskAssessment,
    outputDir
  });

  artifacts.push(...reserveReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    reserveAnalysis: {
      totalReserves: reserveAnalysis.totalReserves,
      availableReserves: reserveAnalysis.availableReserves,
      allocatedReserves: reserveAnalysis.allocatedReserves,
      reservesByCompany: reserveAnalysis.byCompany
    },
    followOnPlan: {
      prioritizedCompanies: followOnPrioritization.prioritized,
      plannedInvestments: followOnPlan.investments,
      timeline: followOnPlan.timeline
    },
    deploymentStrategy: {
      scenarios: deploymentModeling.scenarios,
      recommendedScenario: deploymentModeling.recommended,
      coverageRatio: reserveOptimization.coverageRatio
    },
    risks: riskAssessment.risks,
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/reserve-management',
      timestamp: startTime,
      fundName
    }
  };
}

// Task 1: Reserve Analysis
export const reserveAnalysisTask = defineTask('reserve-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze current reserves',
  agent: {
    name: 'reserve-analyst',
    prompt: {
      role: 'fund management analyst',
      task: 'Analyze current fund reserve position',
      context: args,
      instructions: [
        'Calculate total reserve amount',
        'Identify allocated vs unallocated reserves',
        'Review reserve policy requirements',
        'Analyze reserves by portfolio company',
        'Calculate reserve utilization rate',
        'Compare to fund lifecycle stage',
        'Identify reserve constraints',
        'Document reserve position'
      ],
      outputFormat: 'JSON with reserve analysis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalReserves', 'availableReserves', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalReserves: { type: 'number' },
        availableReserves: { type: 'number' },
        allocatedReserves: { type: 'number' },
        byCompany: { type: 'object' },
        utilizationRate: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'reserves', 'analysis']
}));

// Task 2: Follow-On Assessment
export const followOnAssessmentTask = defineTask('follow-on-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess follow-on needs',
  agent: {
    name: 'follow-on-analyst',
    prompt: {
      role: 'portfolio follow-on specialist',
      task: 'Assess follow-on investment needs across portfolio',
      context: args,
      instructions: [
        'Identify companies likely to raise',
        'Estimate follow-on amounts needed',
        'Assess pro-rata requirements',
        'Evaluate super pro-rata opportunities',
        'Consider defensive vs offensive follows',
        'Estimate timing of follow-on needs',
        'Calculate total follow-on requirements',
        'Document assessment by company'
      ],
      outputFormat: 'JSON with follow-on assessment and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalNeeds', 'byCompany', 'artifacts'],
      properties: {
        totalNeeds: { type: 'number' },
        byCompany: { type: 'array' },
        proRataAmount: { type: 'number' },
        superProRataAmount: { type: 'number' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'reserves', 'follow-on']
}));

// Task 3: Follow-On Prioritization
export const followOnPrioritizationTask = defineTask('follow-on-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize follow-on opportunities',
  agent: {
    name: 'prioritization-analyst',
    prompt: {
      role: 'portfolio investment analyst',
      task: 'Prioritize follow-on investment opportunities',
      context: args,
      instructions: [
        'Score companies on performance',
        'Evaluate return potential',
        'Assess signal value of following',
        'Consider ownership maintenance',
        'Evaluate round terms attractiveness',
        'Apply portfolio construction lens',
        'Rank follow-on opportunities',
        'Document prioritization rationale'
      ],
      outputFormat: 'JSON with prioritization and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritized', 'ranking', 'artifacts'],
      properties: {
        prioritized: { type: 'array' },
        ranking: { type: 'object' },
        scoringCriteria: { type: 'object' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'reserves', 'prioritization']
}));

// Task 4: Capital Deployment Modeling
export const deploymentModelingTask = defineTask('deployment-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model capital deployment',
  agent: {
    name: 'deployment-modeler',
    prompt: {
      role: 'fund modeling specialist',
      task: 'Model capital deployment scenarios',
      context: args,
      instructions: [
        'Create baseline deployment scenario',
        'Model aggressive deployment scenario',
        'Model conservative deployment scenario',
        'Project reserves over fund life',
        'Model capital call timing',
        'Calculate deployment pacing',
        'Identify optimal deployment path',
        'Document scenario assumptions'
      ],
      outputFormat: 'JSON with deployment scenarios and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'recommended', 'artifacts'],
      properties: {
        scenarios: { type: 'array' },
        recommended: { type: 'object' },
        pacing: { type: 'object' },
        capitalCalls: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'reserves', 'modeling']
}));

// Task 5: Reserve Optimization
export const reserveOptimizationTask = defineTask('reserve-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize reserve allocation',
  agent: {
    name: 'optimization-analyst',
    prompt: {
      role: 'portfolio optimization specialist',
      task: 'Optimize reserve allocation across portfolio',
      context: args,
      instructions: [
        'Calculate optimal reserve per company',
        'Balance pro-rata vs super pro-rata',
        'Optimize for return maximization',
        'Consider portfolio concentration',
        'Apply reserve policy constraints',
        'Calculate coverage ratio',
        'Identify reallocation opportunities',
        'Document optimization rationale'
      ],
      outputFormat: 'JSON with optimization results and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allocations', 'coverageRatio', 'artifacts'],
      properties: {
        allocations: { type: 'object' },
        coverageRatio: { type: 'number' },
        reallocationSuggestions: { type: 'array' },
        constraints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'reserves', 'optimization']
}));

// Task 6: Follow-On Investment Plan
export const followOnPlanTask = defineTask('follow-on-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create follow-on investment plan',
  agent: {
    name: 'investment-planner',
    prompt: {
      role: 'portfolio investment manager',
      task: 'Create follow-on investment plan',
      context: args,
      instructions: [
        'Plan follow-on investments by company',
        'Set investment amounts and targets',
        'Create investment timeline',
        'Define investment conditions',
        'Plan IC preparation requirements',
        'Set monitoring triggers',
        'Create decision framework',
        'Document investment plan'
      ],
      outputFormat: 'JSON with follow-on plan and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['investments', 'timeline', 'artifacts'],
      properties: {
        investments: { type: 'array' },
        timeline: { type: 'object' },
        conditions: { type: 'array' },
        decisionFramework: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'reserves', 'planning']
}));

// Task 7: Reserve Risk Assessment
export const reserveRiskTask = defineTask('reserve-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess reserve management risks',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'fund risk analyst',
      task: 'Assess risks in reserve management strategy',
      context: args,
      instructions: [
        'Identify reserve shortfall risks',
        'Assess concentration risks',
        'Evaluate timing risks',
        'Assess opportunity cost risks',
        'Identify portfolio support risks',
        'Evaluate LP commitment risks',
        'Rate overall reserve risk',
        'Propose risk mitigations'
      ],
      outputFormat: 'JSON with risk assessment and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'overallRisk', 'artifacts'],
      properties: {
        risks: { type: 'array' },
        overallRisk: { type: 'string' },
        mitigations: { type: 'array' },
        scenarios: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'reserves', 'risk']
}));

// Task 8: Reserve Management Report
export const reserveReportTask = defineTask('reserve-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate reserve management report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'fund operations manager',
      task: 'Generate reserve management report',
      context: args,
      instructions: [
        'Create executive summary',
        'Present reserve position analysis',
        'Document follow-on assessment',
        'Include prioritization framework',
        'Present deployment scenarios',
        'Include optimization recommendations',
        'Document risk assessment',
        'Format for GP/LP reporting'
      ],
      outputFormat: 'JSON with report path and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'reserves', 'reporting']
}));
