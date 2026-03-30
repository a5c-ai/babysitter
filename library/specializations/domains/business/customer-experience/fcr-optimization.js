/**
 * @process customer-experience/fcr-optimization
 * @description Continuous improvement process for increasing First Contact Resolution rates through training, knowledge access, and empowerment
 * @inputs { fcrMetrics: object, ticketSamples: array, agentPerformance: array, knowledgeBase: object }
 * @outputs { success: boolean, fcrAnalysis: object, improvementPlan: object, trainingRecommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    fcrMetrics = {},
    ticketSamples = [],
    agentPerformance = [],
    knowledgeBase = {},
    outputDir = 'fcr-optimization-output',
    targetFCR = 75
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting First Contact Resolution Optimization Process');

  // ============================================================================
  // PHASE 1: FCR BASELINE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing FCR baseline metrics');
  const baselineAnalysis = await ctx.task(baselineAnalysisTask, {
    fcrMetrics,
    agentPerformance,
    targetFCR,
    outputDir
  });

  artifacts.push(...baselineAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: NON-FCR TICKET ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing non-FCR tickets');
  const nonFCRAnalysis = await ctx.task(nonFCRAnalysisTask, {
    ticketSamples,
    fcrMetrics,
    outputDir
  });

  artifacts.push(...nonFCRAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: ROOT CAUSE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying root causes of non-FCR');
  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, {
    nonFCRAnalysis,
    agentPerformance,
    knowledgeBase,
    outputDir
  });

  artifacts.push(...rootCauseAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: KNOWLEDGE GAP ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing knowledge gaps');
  const knowledgeGapAssessment = await ctx.task(knowledgeGapAssessmentTask, {
    rootCauseAnalysis,
    knowledgeBase,
    nonFCRAnalysis,
    outputDir
  });

  artifacts.push(...knowledgeGapAssessment.artifacts);

  // ============================================================================
  // PHASE 5: AGENT EMPOWERMENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing agent empowerment opportunities');
  const empowermentAnalysis = await ctx.task(empowermentAnalysisTask, {
    rootCauseAnalysis,
    agentPerformance,
    outputDir
  });

  artifacts.push(...empowermentAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: TRAINING RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing training recommendations');
  const trainingRecommendations = await ctx.task(trainingRecommendationsTask, {
    rootCauseAnalysis,
    knowledgeGapAssessment,
    agentPerformance,
    outputDir
  });

  artifacts.push(...trainingRecommendations.artifacts);

  // ============================================================================
  // PHASE 7: IMPROVEMENT PLAN DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing FCR improvement plan');
  const improvementPlan = await ctx.task(improvementPlanTask, {
    baselineAnalysis,
    rootCauseAnalysis,
    knowledgeGapAssessment,
    empowermentAnalysis,
    trainingRecommendations,
    targetFCR,
    outputDir
  });

  artifacts.push(...improvementPlan.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing optimization plan quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    baselineAnalysis,
    rootCauseAnalysis,
    knowledgeGapAssessment,
    empowermentAnalysis,
    trainingRecommendations,
    improvementPlan,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const qualityScore = qualityAssessment.overallScore;
  const qualityMet = qualityScore >= 85;

  await ctx.breakpoint({
    question: `FCR optimization analysis complete. Current FCR: ${baselineAnalysis.currentFCR}%. Target: ${targetFCR}%. Quality score: ${qualityScore}/100. ${qualityMet ? 'Plan meets standards!' : 'May need refinement.'} Review and approve?`,
    title: 'FCR Optimization Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        qualityScore,
        qualityMet,
        currentFCR: baselineAnalysis.currentFCR,
        targetFCR,
        gap: targetFCR - baselineAnalysis.currentFCR,
        rootCausesIdentified: rootCauseAnalysis.rootCauses?.length || 0,
        trainingModules: trainingRecommendations.modules?.length || 0,
        improvementActions: improvementPlan.actions?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore,
    qualityMet,
    fcrAnalysis: {
      currentFCR: baselineAnalysis.currentFCR,
      targetFCR,
      gap: targetFCR - baselineAnalysis.currentFCR,
      trends: baselineAnalysis.trends,
      topPerformers: baselineAnalysis.topPerformers
    },
    rootCauses: rootCauseAnalysis.rootCauses,
    knowledgeGaps: knowledgeGapAssessment.gaps,
    empowermentOpportunities: empowermentAnalysis.opportunities,
    trainingRecommendations: trainingRecommendations.modules,
    improvementPlan: {
      actions: improvementPlan.actions,
      timeline: improvementPlan.timeline,
      expectedImprovement: improvementPlan.expectedImprovement
    },
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/fcr-optimization',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const baselineAnalysisTask = defineTask('baseline-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze FCR baseline metrics',
  agent: {
    name: 'fcr-analyst',
    prompt: {
      role: 'support metrics analyst',
      task: 'Analyze current FCR performance and establish baseline metrics',
      context: args,
      instructions: [
        'Calculate overall FCR rate',
        'Break down FCR by channel (phone, chat, email, self-service)',
        'Analyze FCR by issue category',
        'Compare FCR across customer tiers',
        'Identify top performing agents',
        'Identify underperforming areas',
        'Calculate FCR trends over time',
        'Benchmark against industry standards',
        'Generate baseline analysis report'
      ],
      outputFormat: 'JSON with currentFCR, byChannel, byCategory, byTier, topPerformers, underperformers, trends, benchmarks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['currentFCR', 'trends', 'artifacts'],
      properties: {
        currentFCR: { type: 'number', minimum: 0, maximum: 100 },
        byChannel: { type: 'object' },
        byCategory: { type: 'object' },
        byTier: { type: 'object' },
        topPerformers: { type: 'array', items: { type: 'object' } },
        underperformers: { type: 'array', items: { type: 'object' } },
        trends: { type: 'object' },
        benchmarks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fcr-optimization', 'baseline']
}));

export const nonFCRAnalysisTask = defineTask('non-fcr-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze non-FCR tickets',
  agent: {
    name: 'ticket-analyst',
    prompt: {
      role: 'support quality analyst',
      task: 'Analyze tickets that were not resolved on first contact',
      context: args,
      instructions: [
        'Categorize non-FCR tickets by reason',
        'Identify common escalation patterns',
        'Analyze callback and follow-up reasons',
        'Identify avoidable vs unavoidable non-FCR',
        'Assess complexity of non-FCR issues',
        'Identify missing information patterns',
        'Analyze time between contacts',
        'Document resolution patterns',
        'Generate non-FCR analysis report'
      ],
      outputFormat: 'JSON with categories, escalationPatterns, avoidableNonFCR, complexity, informationGaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['categories', 'avoidableNonFCR', 'artifacts'],
      properties: {
        categories: { type: 'object' },
        escalationPatterns: { type: 'array', items: { type: 'object' } },
        avoidableNonFCR: { type: 'number' },
        complexity: { type: 'object' },
        informationGaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fcr-optimization', 'ticket-analysis']
}));

export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify root causes of non-FCR',
  agent: {
    name: 'root-cause-analyst',
    prompt: {
      role: 'continuous improvement specialist',
      task: 'Identify root causes preventing first contact resolution',
      context: args,
      instructions: [
        'Apply 5-whys analysis to non-FCR patterns',
        'Identify knowledge gaps causing escalations',
        'Identify process barriers to FCR',
        'Assess tool limitations impacting FCR',
        'Evaluate authorization and empowerment gaps',
        'Identify training deficiencies',
        'Assess information access challenges',
        'Prioritize root causes by impact',
        'Generate root cause analysis report'
      ],
      outputFormat: 'JSON with rootCauses, knowledgeGaps, processBarriers, toolLimitations, empowermentGaps, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCauses', 'priorities', 'artifacts'],
      properties: {
        rootCauses: { type: 'array', items: { type: 'object' } },
        knowledgeGaps: { type: 'array', items: { type: 'string' } },
        processBarriers: { type: 'array', items: { type: 'string' } },
        toolLimitations: { type: 'array', items: { type: 'string' } },
        empowermentGaps: { type: 'array', items: { type: 'string' } },
        priorities: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fcr-optimization', 'root-cause']
}));

export const knowledgeGapAssessmentTask = defineTask('knowledge-gap-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess knowledge gaps',
  agent: {
    name: 'knowledge-assessor',
    prompt: {
      role: 'knowledge management specialist',
      task: 'Assess knowledge base gaps impacting FCR',
      context: args,
      instructions: [
        'Identify missing KB articles for common issues',
        'Assess KB article quality and accuracy',
        'Evaluate KB searchability and findability',
        'Identify outdated or incorrect content',
        'Assess KB coverage of escalated issues',
        'Evaluate KB article usage patterns',
        'Identify KB structure improvements needed',
        'Prioritize KB improvements by FCR impact',
        'Generate knowledge gap assessment report'
      ],
      outputFormat: 'JSON with gaps, qualityIssues, searchabilityIssues, prioritizedImprovements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'prioritizedImprovements', 'artifacts'],
      properties: {
        gaps: { type: 'array', items: { type: 'object' } },
        qualityIssues: { type: 'array', items: { type: 'object' } },
        searchabilityIssues: { type: 'array', items: { type: 'string' } },
        prioritizedImprovements: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fcr-optimization', 'knowledge']
}));

export const empowermentAnalysisTask = defineTask('empowerment-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze agent empowerment opportunities',
  agent: {
    name: 'empowerment-analyst',
    prompt: {
      role: 'agent empowerment specialist',
      task: 'Identify opportunities to empower agents for improved FCR',
      context: args,
      instructions: [
        'Identify decisions requiring unnecessary escalation',
        'Assess refund and credit authority limits',
        'Evaluate technical action permissions',
        'Identify process exceptions agents could handle',
        'Assess tool access limitations',
        'Evaluate information visibility gaps',
        'Identify empowerment opportunities by role',
        'Calculate potential FCR improvement',
        'Generate empowerment analysis report'
      ],
      outputFormat: 'JSON with opportunities, authorityRecommendations, toolAccess, potentialImprovement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'potentialImprovement', 'artifacts'],
      properties: {
        opportunities: { type: 'array', items: { type: 'object' } },
        authorityRecommendations: { type: 'array', items: { type: 'object' } },
        toolAccess: { type: 'array', items: { type: 'object' } },
        potentialImprovement: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fcr-optimization', 'empowerment']
}));

export const trainingRecommendationsTask = defineTask('training-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop training recommendations',
  agent: {
    name: 'training-designer',
    prompt: {
      role: 'training and development specialist',
      task: 'Develop targeted training recommendations to improve FCR',
      context: args,
      instructions: [
        'Identify skill gaps from root cause analysis',
        'Design product knowledge training modules',
        'Develop troubleshooting skills training',
        'Create soft skills and communication training',
        'Design tool proficiency training',
        'Develop decision-making training',
        'Create peer learning and coaching programs',
        'Prioritize training by FCR impact',
        'Generate training recommendations report'
      ],
      outputFormat: 'JSON with modules, productTraining, troubleshootingTraining, softSkills, toolTraining, peerLearning, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['modules', 'artifacts'],
      properties: {
        modules: { type: 'array', items: { type: 'object' } },
        productTraining: { type: 'array', items: { type: 'object' } },
        troubleshootingTraining: { type: 'array', items: { type: 'object' } },
        softSkills: { type: 'array', items: { type: 'object' } },
        toolTraining: { type: 'array', items: { type: 'object' } },
        peerLearning: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fcr-optimization', 'training']
}));

export const improvementPlanTask = defineTask('improvement-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop FCR improvement plan',
  agent: {
    name: 'improvement-planner',
    prompt: {
      role: 'continuous improvement manager',
      task: 'Develop comprehensive FCR improvement plan with actions and timeline',
      context: args,
      instructions: [
        'Prioritize improvement actions by impact and effort',
        'Identify quick wins for immediate implementation',
        'Plan knowledge base improvements',
        'Schedule training program rollout',
        'Plan empowerment policy changes',
        'Define process improvements',
        'Set milestone targets',
        'Calculate expected FCR improvement',
        'Generate improvement plan document'
      ],
      outputFormat: 'JSON with actions, quickWins, timeline, milestones, expectedImprovement, resources, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'timeline', 'expectedImprovement', 'artifacts'],
      properties: {
        actions: { type: 'array', items: { type: 'object' } },
        quickWins: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        milestones: { type: 'array', items: { type: 'object' } },
        expectedImprovement: { type: 'number' },
        resources: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fcr-optimization', 'planning']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess optimization plan quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'quality assurance specialist',
      task: 'Assess overall quality of the FCR optimization plan',
      context: args,
      instructions: [
        'Evaluate baseline analysis completeness (weight: 15%)',
        'Assess root cause identification accuracy (weight: 25%)',
        'Review knowledge gap assessment thoroughness (weight: 15%)',
        'Evaluate empowerment analysis quality (weight: 15%)',
        'Assess training recommendations relevance (weight: 15%)',
        'Review improvement plan feasibility (weight: 15%)',
        'Calculate overall quality score',
        'Identify gaps and improvements',
        'Generate quality assessment report'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fcr-optimization', 'quality-assessment']
}));
