/**
 * @process sales/win-loss-analysis
 * @description Systematic post-deal analysis to identify patterns in wins and losses, capture learnings, and improve future sales execution.
 * @inputs { dealId: string, dealName: string, outcome: string, dealValue: number, dealData: object, competitors?: array, timeline?: object }
 * @outputs { success: boolean, analysisReport: object, keyLearnings: array, recommendations: array, patterns: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/win-loss-analysis', {
 *   dealId: 'DEAL-123',
 *   dealName: 'Enterprise Platform Deal',
 *   outcome: 'loss',
 *   dealValue: 250000,
 *   dealData: { stage: 'Closed Lost', lossReason: 'Competitor', competitor: 'Acme Corp' },
 *   competitors: ['Acme Corp']
 * });
 *
 * @references
 * - Gartner Sales Research: https://www.gartner.com/en/sales
 * - Clozd Win-Loss Analysis: https://www.clozd.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dealId,
    dealName,
    outcome,
    dealValue,
    dealData = {},
    competitors = [],
    timeline = {},
    outputDir = 'win-loss-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Win/Loss Analysis for ${dealName} (${outcome})`);

  // ============================================================================
  // PHASE 1: DEAL TIMELINE RECONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Reconstructing Deal Timeline');
  const timelineReconstruction = await ctx.task(dealTimelineTask, {
    dealId,
    dealName,
    dealData,
    timeline,
    outputDir
  });

  artifacts.push(...(timelineReconstruction.artifacts || []));

  // ============================================================================
  // PHASE 2: STAKEHOLDER ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing Stakeholders');
  const stakeholderAnalysis = await ctx.task(stakeholderAnalysisTask, {
    dealName,
    dealData,
    outcome,
    outputDir
  });

  artifacts.push(...(stakeholderAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 3: COMPETITIVE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing Competitive Dynamics');
  const competitiveAnalysis = await ctx.task(competitiveAnalysisTask, {
    dealName,
    outcome,
    competitors,
    dealData,
    outputDir
  });

  artifacts.push(...(competitiveAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 4: SALES EXECUTION EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Evaluating Sales Execution');
  const executionEvaluation = await ctx.task(salesExecutionEvaluationTask, {
    dealName,
    outcome,
    dealData,
    timelineReconstruction,
    outputDir
  });

  artifacts.push(...(executionEvaluation.artifacts || []));

  // ============================================================================
  // PHASE 5: DECISION CRITERIA ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing Decision Criteria');
  const decisionCriteriaAnalysis = await ctx.task(decisionCriteriaAnalysisTask, {
    dealName,
    outcome,
    dealData,
    competitiveAnalysis,
    outputDir
  });

  artifacts.push(...(decisionCriteriaAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 6: ROOT CAUSE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Conducting Root Cause Analysis');
  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, {
    dealName,
    outcome,
    stakeholderAnalysis,
    competitiveAnalysis,
    executionEvaluation,
    decisionCriteriaAnalysis,
    outputDir
  });

  artifacts.push(...(rootCauseAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 7: PATTERN IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Identifying Patterns');
  const patternIdentification = await ctx.task(patternIdentificationTask, {
    dealName,
    outcome,
    rootCauseAnalysis,
    dealData,
    outputDir
  });

  artifacts.push(...(patternIdentification.artifacts || []));

  // ============================================================================
  // PHASE 8: LEARNINGS AND RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Learnings and Recommendations');
  const learningsRecommendations = await ctx.task(learningsRecommendationsTask, {
    dealName,
    outcome,
    dealValue,
    rootCauseAnalysis,
    patternIdentification,
    executionEvaluation,
    outputDir
  });

  artifacts.push(...(learningsRecommendations.artifacts || []));

  // Breakpoint: Review analysis
  await ctx.breakpoint({
    question: `Win/Loss analysis complete for ${dealName}. Outcome: ${outcome}. Review findings and learnings?`,
    title: 'Win/Loss Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || undefined
      })),
      summary: {
        dealName,
        outcome,
        dealValue,
        primaryCause: rootCauseAnalysis.primaryCause,
        keyLearningsCount: learningsRecommendations.learnings?.length || 0,
        recommendationsCount: learningsRecommendations.recommendations?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    dealId,
    dealName,
    outcome,
    dealValue,
    analysisReport: {
      timeline: timelineReconstruction.timeline,
      stakeholders: stakeholderAnalysis.analysis,
      competitive: competitiveAnalysis.analysis,
      execution: executionEvaluation.evaluation,
      decisionCriteria: decisionCriteriaAnalysis.analysis
    },
    rootCause: {
      primaryCause: rootCauseAnalysis.primaryCause,
      contributingFactors: rootCauseAnalysis.contributingFactors,
      whatWorked: rootCauseAnalysis.whatWorked,
      whatDidntWork: rootCauseAnalysis.whatDidntWork
    },
    keyLearnings: learningsRecommendations.learnings,
    recommendations: learningsRecommendations.recommendations,
    patterns: patternIdentification.patterns,
    artifacts,
    duration,
    metadata: {
      processId: 'sales/win-loss-analysis',
      timestamp: startTime,
      dealId,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const dealTimelineTask = defineTask('deal-timeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deal Timeline Reconstruction - ${args.dealName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Sales analyst specializing in deal retrospectives',
      task: 'Reconstruct the complete timeline of the deal from first touch to close',
      context: args,
      instructions: [
        'Map all significant milestones in the deal',
        'Identify key meetings and their outcomes',
        'Document stage transitions and timing',
        'Note critical decision points',
        'Identify delays and their causes',
        'Document competitive events',
        'Highlight pivotal moments',
        'Create visual timeline representation'
      ],
      outputFormat: 'JSON with timeline array, milestones, pivotalMoments, cycleAnalysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['timeline', 'milestones', 'artifacts'],
      properties: {
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              event: { type: 'string' },
              stage: { type: 'string' },
              significance: { type: 'string', enum: ['high', 'medium', 'low'] },
              notes: { type: 'string' }
            }
          }
        },
        milestones: { type: 'array', items: { type: 'string' } },
        pivotalMoments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moment: { type: 'string' },
              impact: { type: 'string' },
              couldHaveChanged: { type: 'string' }
            }
          }
        },
        cycleAnalysis: {
          type: 'object',
          properties: {
            totalDays: { type: 'number' },
            vsAverage: { type: 'string' },
            longestStage: { type: 'string' },
            delayDays: { type: 'number' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'win-loss', 'timeline']
}));

export const stakeholderAnalysisTask = defineTask('stakeholder-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Stakeholder Analysis - ${args.dealName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Stakeholder dynamics analyst',
      task: 'Analyze the stakeholder dynamics that influenced deal outcome',
      context: args,
      instructions: [
        'Map all stakeholders involved in decision',
        'Analyze champion effectiveness',
        'Assess economic buyer engagement',
        'Identify detractors or blockers',
        'Evaluate multi-threading success',
        'Analyze stakeholder alignment',
        'Identify missing relationships',
        'Assess political dynamics'
      ],
      outputFormat: 'JSON with analysis object, stakeholderMap, championAnalysis, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'stakeholderMap', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            coverageScore: { type: 'number' },
            championStrength: { type: 'string' },
            ebEngagement: { type: 'string' },
            blockerPresence: { type: 'boolean' }
          }
        },
        stakeholderMap: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              influence: { type: 'string' },
              sentiment: { type: 'string', enum: ['champion', 'supporter', 'neutral', 'skeptic', 'blocker'] },
              engagement: { type: 'string' }
            }
          }
        },
        championAnalysis: {
          type: 'object',
          properties: {
            identified: { type: 'boolean' },
            effectiveness: { type: 'string' },
            limitations: { type: 'array', items: { type: 'string' } }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'win-loss', 'stakeholder']
}));

export const competitiveAnalysisTask = defineTask('competitive-analysis-winloss', (args, taskCtx) => ({
  kind: 'agent',
  title: `Competitive Analysis - ${args.dealName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Competitive intelligence analyst',
      task: 'Analyze competitive dynamics that influenced deal outcome',
      context: args,
      instructions: [
        'Identify all competitors in the deal',
        'Analyze winning competitor strategy',
        'Evaluate our competitive positioning',
        'Identify where we won/lost on criteria',
        'Analyze pricing dynamics',
        'Assess relationship advantages',
        'Identify competitive tactics used',
        'Document competitive learnings'
      ],
      outputFormat: 'JSON with analysis object, competitorDetails, positioning, learnings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            competitiveOutcome: { type: 'string' },
            winningDifferentiator: { type: 'string' },
            ourWeaknesses: { type: 'array', items: { type: 'string' } }
          }
        },
        competitorDetails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competitor: { type: 'string' },
              strategy: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              tactics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        positioning: {
          type: 'object',
          properties: {
            ourPosition: { type: 'string' },
            perceivedDifferentiators: { type: 'array', items: { type: 'string' } },
            gapsExposed: { type: 'array', items: { type: 'string' } }
          }
        },
        learnings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'win-loss', 'competitive']
}));

export const salesExecutionEvaluationTask = defineTask('sales-execution-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sales Execution Evaluation - ${args.dealName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Sales methodology expert',
      task: 'Evaluate sales execution quality throughout the deal',
      context: args,
      instructions: [
        'Evaluate discovery quality',
        'Assess qualification rigor',
        'Evaluate demo/proof effectiveness',
        'Assess proposal quality',
        'Evaluate negotiation strategy',
        'Assess methodology adherence',
        'Identify execution gaps',
        'Rate overall execution quality'
      ],
      outputFormat: 'JSON with evaluation object, stageEvaluations, gaps, strengths, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['evaluation', 'artifacts'],
      properties: {
        evaluation: {
          type: 'object',
          properties: {
            overallScore: { type: 'number', minimum: 0, maximum: 100 },
            methodologyAdherence: { type: 'string' },
            qualityRating: { type: 'string', enum: ['excellent', 'good', 'adequate', 'poor'] }
          }
        },
        stageEvaluations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              score: { type: 'number' },
              strengths: { type: 'array', items: { type: 'string' } },
              gaps: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        missedOpportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'win-loss', 'execution']
}));

export const decisionCriteriaAnalysisTask = defineTask('decision-criteria-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Decision Criteria Analysis - ${args.dealName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Decision analysis specialist',
      task: 'Analyze how decision criteria influenced the outcome',
      context: args,
      instructions: [
        'Identify stated decision criteria',
        'Uncover hidden/unstated criteria',
        'Evaluate our performance on each criterion',
        'Identify weighted importance of criteria',
        'Analyze criteria we won vs lost on',
        'Assess criteria influence strategy',
        'Identify surprise criteria',
        'Document criteria learnings'
      ],
      outputFormat: 'JSON with analysis object, criteria array, criteriaImpact, learnings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'criteria', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            criteriaMet: { type: 'number' },
            totalCriteria: { type: 'number' },
            criticalCriteriaMet: { type: 'boolean' }
          }
        },
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              weight: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              stated: { type: 'boolean' },
              ourPerformance: { type: 'string', enum: ['exceeded', 'met', 'partial', 'failed'] },
              impactOnOutcome: { type: 'string' }
            }
          }
        },
        criteriaImpact: {
          type: 'object',
          properties: {
            wonOn: { type: 'array', items: { type: 'string' } },
            lostOn: { type: 'array', items: { type: 'string' } },
            neutral: { type: 'array', items: { type: 'string' } }
          }
        },
        surpriseCriteria: { type: 'array', items: { type: 'string' } },
        learnings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'win-loss', 'decision-criteria']
}));

export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Root Cause Analysis - ${args.dealName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Root cause analysis expert',
      task: 'Determine root causes of deal outcome',
      context: args,
      instructions: [
        'Synthesize all analysis findings',
        'Apply 5 Whys methodology',
        'Identify primary cause of outcome',
        'Identify contributing factors',
        'Distinguish controllable vs uncontrollable factors',
        'Document what worked well',
        'Document what did not work',
        'Prioritize causes by impact'
      ],
      outputFormat: 'JSON with primaryCause, contributingFactors, whatWorked, whatDidntWork, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryCause', 'contributingFactors', 'artifacts'],
      properties: {
        primaryCause: {
          type: 'object',
          properties: {
            cause: { type: 'string' },
            category: { type: 'string', enum: ['competitive', 'execution', 'product', 'price', 'relationship', 'timing', 'external'] },
            controllable: { type: 'boolean' },
            evidence: { type: 'string' }
          }
        },
        contributingFactors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              controllable: { type: 'boolean' }
            }
          }
        },
        whatWorked: { type: 'array', items: { type: 'string' } },
        whatDidntWork: { type: 'array', items: { type: 'string' } },
        fiveWhysAnalysis: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'win-loss', 'root-cause']
}));

export const patternIdentificationTask = defineTask('pattern-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pattern Identification - ${args.dealName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Sales pattern analyst',
      task: 'Identify patterns that may apply to future deals',
      context: args,
      instructions: [
        'Identify repeating success patterns',
        'Identify repeating failure patterns',
        'Compare to historical win/loss trends',
        'Identify segment-specific patterns',
        'Identify competitive patterns',
        'Identify timing/seasonality patterns',
        'Categorize patterns by actionability',
        'Prioritize patterns for action'
      ],
      outputFormat: 'JSON with patterns object, actionablePatterns, comparisons, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'artifacts'],
      properties: {
        patterns: {
          type: 'object',
          properties: {
            successPatterns: { type: 'array', items: { type: 'string' } },
            failurePatterns: { type: 'array', items: { type: 'string' } },
            competitivePatterns: { type: 'array', items: { type: 'string' } },
            segmentPatterns: { type: 'array', items: { type: 'string' } }
          }
        },
        actionablePatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              frequency: { type: 'string' },
              actionability: { type: 'string', enum: ['high', 'medium', 'low'] },
              recommendedAction: { type: 'string' }
            }
          }
        },
        comparisons: {
          type: 'object',
          properties: {
            vsHistoricalWins: { type: 'string' },
            vsHistoricalLosses: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'win-loss', 'patterns']
}));

export const learningsRecommendationsTask = defineTask('learnings-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Learnings and Recommendations - ${args.dealName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Sales enablement strategist',
      task: 'Generate actionable learnings and recommendations from analysis',
      context: args,
      instructions: [
        'Synthesize key learnings from all analysis',
        'Prioritize learnings by impact',
        'Develop specific recommendations',
        'Categorize recommendations by audience',
        'Create action items for sales team',
        'Create action items for sales leadership',
        'Create action items for product/marketing',
        'Define success metrics for improvements'
      ],
      outputFormat: 'JSON with learnings array, recommendations array, actionItems, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['learnings', 'recommendations', 'artifacts'],
      properties: {
        learnings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              learning: { type: 'string' },
              category: { type: 'string' },
              applicability: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              audience: { type: 'string', enum: ['sales-rep', 'sales-leadership', 'product', 'marketing', 'enablement'] },
              priority: { type: 'string' },
              expectedImpact: { type: 'string' }
            }
          }
        },
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              owner: { type: 'string' },
              deadline: { type: 'string' },
              metric: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'win-loss', 'recommendations']
}));
