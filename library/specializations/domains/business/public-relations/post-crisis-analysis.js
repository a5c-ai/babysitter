/**
 * @process specializations/domains/business/public-relations/post-crisis-analysis
 * @description Conduct thorough post-crisis review, document learnings, update crisis plans, and implement reputation recovery strategies using Image Restoration Theory
 * @specialization Public Relations and Communications
 * @category Crisis Communications
 * @inputs { crisis: object, responseData: object, coverageData: object, stakeholderFeedback: object }
 * @outputs { success: boolean, analysis: object, learnings: object[], planUpdates: object[], recoveryStrategy: object, quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    crisis,
    responseData,
    coverageData = {},
    stakeholderFeedback = {},
    crisisPlan,
    targetQuality = 85
  } = inputs;

  // Phase 1: Crisis Response Timeline Reconstruction
  await ctx.breakpoint({
    question: 'Starting post-crisis analysis. Reconstruct crisis response timeline?',
    title: 'Phase 1: Timeline Reconstruction',
    context: {
      runId: ctx.runId,
      phase: 'timeline-reconstruction',
      crisisType: crisis.type
    }
  });

  const timelineReconstruction = await ctx.task(reconstructTimelineTask, {
    crisis,
    responseData
  });

  // Phase 2: Response Effectiveness Analysis
  await ctx.breakpoint({
    question: 'Timeline reconstructed. Analyze response effectiveness?',
    title: 'Phase 2: Response Analysis',
    context: {
      runId: ctx.runId,
      phase: 'response-analysis',
      durationHours: timelineReconstruction.durationHours
    }
  });

  const [responseAnalysis, communicationsAnalysis] = await Promise.all([
    ctx.task(analyzeResponseEffectivenessTask, {
      timelineReconstruction,
      responseData,
      crisisPlan
    }),
    ctx.task(analyzeCommunicationsEffectivenessTask, {
      responseData,
      coverageData,
      stakeholderFeedback
    })
  ]);

  // Phase 3: Media Coverage Analysis
  await ctx.breakpoint({
    question: 'Response analyzed. Analyze media coverage and sentiment?',
    title: 'Phase 3: Coverage Analysis',
    context: {
      runId: ctx.runId,
      phase: 'coverage-analysis'
    }
  });

  const coverageAnalysis = await ctx.task(analyzeCoverageTask, {
    coverageData,
    crisis,
    responseData
  });

  // Phase 4: Stakeholder Impact Assessment
  await ctx.breakpoint({
    question: 'Coverage analyzed. Assess stakeholder impact?',
    title: 'Phase 4: Stakeholder Impact',
    context: {
      runId: ctx.runId,
      phase: 'stakeholder-impact',
      coverageVolume: coverageAnalysis.totalCoverage
    }
  });

  const stakeholderImpact = await ctx.task(assessStakeholderImpactTask, {
    stakeholderFeedback,
    coverageAnalysis,
    crisis
  });

  // Phase 5: Reputation Damage Assessment
  await ctx.breakpoint({
    question: 'Stakeholder impact assessed. Evaluate reputation damage?',
    title: 'Phase 5: Reputation Assessment',
    context: {
      runId: ctx.runId,
      phase: 'reputation-assessment'
    }
  });

  const reputationAssessment = await ctx.task(assessReputationDamageTask, {
    coverageAnalysis,
    stakeholderImpact,
    crisis
  });

  // Phase 6: Lessons Learned Documentation
  await ctx.breakpoint({
    question: 'Reputation assessed. Document lessons learned?',
    title: 'Phase 6: Lessons Learned',
    context: {
      runId: ctx.runId,
      phase: 'lessons-learned'
    }
  });

  const lessonsLearned = await ctx.task(documentLessonsLearnedTask, {
    responseAnalysis,
    communicationsAnalysis,
    coverageAnalysis,
    stakeholderImpact
  });

  // Phase 7: Crisis Plan Update Recommendations
  await ctx.breakpoint({
    question: 'Lessons documented. Develop plan update recommendations?',
    title: 'Phase 7: Plan Updates',
    context: {
      runId: ctx.runId,
      phase: 'plan-updates',
      lessonsCount: lessonsLearned.lessons.length
    }
  });

  const planUpdates = await ctx.task(developPlanUpdatesTask, {
    lessonsLearned,
    crisisPlan,
    responseAnalysis
  });

  // Phase 8: Reputation Recovery Strategy (Image Restoration Theory)
  await ctx.breakpoint({
    question: 'Plan updates defined. Develop reputation recovery strategy?',
    title: 'Phase 8: Recovery Strategy',
    context: {
      runId: ctx.runId,
      phase: 'recovery-strategy',
      reputationImpact: reputationAssessment.impactLevel
    }
  });

  const recoveryStrategy = await ctx.task(developRecoveryStrategyTask, {
    reputationAssessment,
    crisis,
    stakeholderImpact
  });

  // Phase 9: After-Action Report
  await ctx.breakpoint({
    question: 'Recovery strategy developed. Compile after-action report?',
    title: 'Phase 9: After-Action Report',
    context: {
      runId: ctx.runId,
      phase: 'after-action-report',
      targetQuality
    }
  });

  const afterActionReport = await ctx.task(compileAfterActionReportTask, {
    timelineReconstruction,
    responseAnalysis,
    communicationsAnalysis,
    coverageAnalysis,
    stakeholderImpact,
    reputationAssessment,
    lessonsLearned,
    planUpdates,
    recoveryStrategy,
    targetQuality
  });

  const quality = afterActionReport.qualityScore;

  if (quality >= targetQuality) {
    return {
      success: true,
      analysis: {
        timeline: timelineReconstruction,
        responseEffectiveness: responseAnalysis.summary,
        communicationsEffectiveness: communicationsAnalysis.summary,
        coverageAnalysis: coverageAnalysis.summary,
        stakeholderImpact: stakeholderImpact.summary,
        reputationAssessment: reputationAssessment.summary
      },
      learnings: lessonsLearned.lessons,
      planUpdates: planUpdates.updates,
      recoveryStrategy: {
        approach: recoveryStrategy.approach,
        strategies: recoveryStrategy.strategies,
        timeline: recoveryStrategy.timeline,
        metrics: recoveryStrategy.metrics
      },
      afterActionReport: afterActionReport.report,
      quality,
      targetQuality,
      metadata: {
        processId: 'specializations/domains/business/public-relations/post-crisis-analysis',
        timestamp: ctx.now(),
        crisisId: crisis.id,
        crisisDuration: timelineReconstruction.durationHours
      }
    };
  } else {
    return {
      success: false,
      qualityGateFailed: true,
      quality,
      targetQuality,
      gaps: afterActionReport.gaps,
      recommendations: afterActionReport.recommendations,
      metadata: {
        processId: 'specializations/domains/business/public-relations/post-crisis-analysis',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const reconstructTimelineTask = defineTask('reconstruct-timeline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reconstruct Crisis Response Timeline',
  agent: {
    name: 'timeline-reconstructor',
    prompt: {
      role: 'Crisis analysis specialist reconstructing event timelines',
      task: 'Reconstruct detailed timeline of crisis and response',
      context: args,
      instructions: [
        'Document crisis onset and initial detection',
        'Map response actions with precise timestamps',
        'Identify key decision points and who made them',
        'Track communications sent and their timing',
        'Document media coverage timeline',
        'Note escalation and de-escalation points',
        'Identify critical gaps or delays',
        'Calculate total crisis duration'
      ],
      outputFormat: 'JSON with timeline array (timestamp, event, actor, action), keyDecisions, criticalGaps, durationHours, phases'
    },
    outputSchema: {
      type: 'object',
      required: ['timeline', 'durationHours'],
      properties: {
        timeline: { type: 'array', items: { type: 'object' } },
        keyDecisions: { type: 'array', items: { type: 'object' } },
        criticalGaps: { type: 'array', items: { type: 'object' } },
        durationHours: { type: 'number' },
        phases: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'timeline-reconstruction']
}));

export const analyzeResponseEffectivenessTask = defineTask('analyze-response-effectiveness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Response Effectiveness',
  agent: {
    name: 'response-effectiveness-analyst',
    prompt: {
      role: 'Crisis management analyst evaluating response performance',
      task: 'Analyze effectiveness of crisis response against plan and best practices',
      context: args,
      instructions: [
        'Compare response timing to plan targets',
        'Assess team activation effectiveness',
        'Evaluate decision-making quality and speed',
        'Analyze resource mobilization',
        'Assess escalation protocol adherence',
        'Evaluate coordination effectiveness',
        'Compare to industry best practices',
        'Score overall response effectiveness'
      ],
      outputFormat: 'JSON with effectivenessScore, timingAnalysis, teamPerformance, decisionQuality, resourceAnalysis, coordinationScore, bestPracticeComparison, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['effectivenessScore', 'summary'],
      properties: {
        effectivenessScore: { type: 'number' },
        timingAnalysis: { type: 'object' },
        teamPerformance: { type: 'object' },
        decisionQuality: { type: 'object' },
        resourceAnalysis: { type: 'object' },
        coordinationScore: { type: 'number' },
        bestPracticeComparison: { type: 'object' },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'response-effectiveness']
}));

export const analyzeCommunicationsEffectivenessTask = defineTask('analyze-comms-effectiveness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Communications Effectiveness',
  agent: {
    name: 'comms-effectiveness-analyst',
    prompt: {
      role: 'Communications analyst evaluating crisis messaging performance',
      task: 'Analyze effectiveness of crisis communications',
      context: args,
      instructions: [
        'Assess message clarity and consistency',
        'Evaluate timing of communications',
        'Analyze stakeholder reach and engagement',
        'Assess message pull-through in coverage',
        'Evaluate channel effectiveness',
        'Analyze spokesperson performance',
        'Assess social media response effectiveness',
        'Score overall communications effectiveness'
      ],
      outputFormat: 'JSON with effectivenessScore, messageAnalysis, timingAnalysis, reachAnalysis, channelPerformance, spokespersonAnalysis, socialMediaAnalysis, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['effectivenessScore', 'summary'],
      properties: {
        effectivenessScore: { type: 'number' },
        messageAnalysis: { type: 'object' },
        timingAnalysis: { type: 'object' },
        reachAnalysis: { type: 'object' },
        channelPerformance: { type: 'object' },
        spokespersonAnalysis: { type: 'object' },
        socialMediaAnalysis: { type: 'object' },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'comms-effectiveness']
}));

export const analyzeCoverageTask = defineTask('analyze-coverage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Media Coverage',
  agent: {
    name: 'coverage-analyst',
    prompt: {
      role: 'Media analysis specialist evaluating crisis coverage',
      task: 'Analyze media coverage of crisis and response',
      context: args,
      instructions: [
        'Quantify total coverage volume and reach',
        'Analyze sentiment distribution over time',
        'Track message pull-through rates',
        'Identify dominant narratives and frames',
        'Analyze coverage by outlet tier',
        'Track share of voice vs. competitors/critics',
        'Identify influential coverage pieces',
        'Assess coverage lifecycle and decay'
      ],
      outputFormat: 'JSON with totalCoverage, reach, sentimentAnalysis, messagePullThrough, narratives, tierAnalysis, shareOfVoice, influentialPieces, lifecycleAnalysis, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCoverage', 'sentimentAnalysis', 'summary'],
      properties: {
        totalCoverage: { type: 'number' },
        reach: { type: 'number' },
        sentimentAnalysis: { type: 'object' },
        messagePullThrough: { type: 'object' },
        narratives: { type: 'array', items: { type: 'object' } },
        tierAnalysis: { type: 'object' },
        shareOfVoice: { type: 'object' },
        influentialPieces: { type: 'array', items: { type: 'object' } },
        lifecycleAnalysis: { type: 'object' },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'coverage-analysis']
}));

export const assessStakeholderImpactTask = defineTask('assess-stakeholder-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Stakeholder Impact',
  agent: {
    name: 'stakeholder-impact-analyst',
    prompt: {
      role: 'Stakeholder relations analyst assessing crisis impact',
      task: 'Assess impact of crisis on key stakeholder groups',
      context: args,
      instructions: [
        'Analyze impact on each stakeholder group',
        'Assess stakeholder sentiment changes',
        'Document stakeholder feedback and concerns',
        'Evaluate relationship damage by group',
        'Identify stakeholders requiring repair efforts',
        'Assess employee impact and morale',
        'Evaluate customer/client impact',
        'Identify investor/board concerns'
      ],
      outputFormat: 'JSON with stakeholderImpacts array (group, sentimentChange, concerns, relationshipDamage, repairNeeded), employeeImpact, customerImpact, investorImpact, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholderImpacts', 'summary'],
      properties: {
        stakeholderImpacts: { type: 'array', items: { type: 'object' } },
        employeeImpact: { type: 'object' },
        customerImpact: { type: 'object' },
        investorImpact: { type: 'object' },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'stakeholder-impact']
}));

export const assessReputationDamageTask = defineTask('assess-reputation-damage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Reputation Damage',
  agent: {
    name: 'reputation-damage-analyst',
    prompt: {
      role: 'Reputation management specialist assessing crisis damage',
      task: 'Assess reputation damage from crisis',
      context: args,
      instructions: [
        'Estimate overall reputation impact score',
        'Identify specific reputation dimensions affected',
        'Assess brand attribute damage',
        'Evaluate trust and credibility impact',
        'Estimate business impact implications',
        'Compare to pre-crisis reputation baseline',
        'Identify reputation recovery requirements',
        'Estimate recovery timeline'
      ],
      outputFormat: 'JSON with impactLevel, impactScore, dimensionsAffected, brandAttributeDamage, trustImpact, businessImplications, recoveryRequirements, estimatedRecoveryTime, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['impactLevel', 'impactScore', 'summary'],
      properties: {
        impactLevel: { type: 'string' },
        impactScore: { type: 'number' },
        dimensionsAffected: { type: 'array', items: { type: 'object' } },
        brandAttributeDamage: { type: 'object' },
        trustImpact: { type: 'object' },
        businessImplications: { type: 'array', items: { type: 'object' } },
        recoveryRequirements: { type: 'array', items: { type: 'string' } },
        estimatedRecoveryTime: { type: 'string' },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'reputation-damage']
}));

export const documentLessonsLearnedTask = defineTask('document-lessons-learned', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document Lessons Learned',
  agent: {
    name: 'lessons-learned-documenter',
    prompt: {
      role: 'Crisis management specialist documenting organizational learnings',
      task: 'Document comprehensive lessons learned from crisis',
      context: args,
      instructions: [
        'Identify what worked well in the response',
        'Document what did not work or could improve',
        'Identify process and plan gaps',
        'Document team and capability gaps',
        'Identify communication effectiveness learnings',
        'Document stakeholder management learnings',
        'Identify technology and tool gaps',
        'Prioritize lessons by impact and actionability'
      ],
      outputFormat: 'JSON with lessons array (category, lesson, evidence, priority, actionability), strengths, weaknesses, gaps, prioritizedLessons'
    },
    outputSchema: {
      type: 'object',
      required: ['lessons', 'strengths', 'weaknesses'],
      properties: {
        lessons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              lesson: { type: 'string' },
              evidence: { type: 'string' },
              priority: { type: 'string' },
              actionability: { type: 'string' }
            }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'object' } },
        prioritizedLessons: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'lessons-learned']
}));

export const developPlanUpdatesTask = defineTask('develop-plan-updates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Plan Update Recommendations',
  agent: {
    name: 'plan-update-developer',
    prompt: {
      role: 'Crisis planning specialist updating crisis plans',
      task: 'Develop specific recommendations for crisis plan updates',
      context: args,
      instructions: [
        'Translate lessons into specific plan changes',
        'Update risk assessment based on experience',
        'Revise severity matrix if needed',
        'Update team structure and roles',
        'Revise escalation protocols',
        'Update stakeholder notification procedures',
        'Revise holding statements and templates',
        'Update training and simulation requirements'
      ],
      outputFormat: 'JSON with updates array (section, currentState, recommendedChange, priority, rationale), riskUpdates, processUpdates, templateUpdates, trainingUpdates'
    },
    outputSchema: {
      type: 'object',
      required: ['updates'],
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              currentState: { type: 'string' },
              recommendedChange: { type: 'string' },
              priority: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        riskUpdates: { type: 'array', items: { type: 'object' } },
        processUpdates: { type: 'array', items: { type: 'object' } },
        templateUpdates: { type: 'array', items: { type: 'object' } },
        trainingUpdates: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'plan-updates']
}));

export const developRecoveryStrategyTask = defineTask('develop-recovery-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Reputation Recovery Strategy',
  agent: {
    name: 'recovery-strategist',
    prompt: {
      role: 'Reputation management specialist using Image Restoration Theory',
      task: 'Develop reputation recovery strategy using Image Restoration Theory',
      context: args,
      instructions: [
        'Assess appropriate Image Restoration strategies based on crisis type',
        'Evaluate denial strategies where appropriate',
        'Develop evading responsibility strategies if applicable',
        'Plan reducing offensiveness strategies',
        'Develop corrective action commitments',
        'Consider mortification (apology) approach',
        'Create multi-phase recovery timeline',
        'Define success metrics for recovery'
      ],
      outputFormat: 'JSON with approach, strategies (denial, evasion, reduceOffensiveness, correctiveAction, mortification), timeline, actions, metrics, stakeholderSpecific'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'strategies', 'timeline', 'metrics'],
      properties: {
        approach: { type: 'string' },
        strategies: {
          type: 'object',
          properties: {
            denial: { type: 'object' },
            evasion: { type: 'object' },
            reduceOffensiveness: { type: 'object' },
            correctiveAction: { type: 'object' },
            mortification: { type: 'object' }
          }
        },
        timeline: { type: 'array', items: { type: 'object' } },
        actions: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'array', items: { type: 'object' } },
        stakeholderSpecific: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'recovery-strategy']
}));

export const compileAfterActionReportTask = defineTask('compile-after-action-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile After-Action Report',
  agent: {
    name: 'after-action-compiler',
    prompt: {
      role: 'Crisis documentation specialist compiling comprehensive reports',
      task: 'Compile comprehensive after-action report',
      context: args,
      instructions: [
        'Create executive summary of crisis and response',
        'Document complete timeline and key events',
        'Summarize response effectiveness analysis',
        'Include communications effectiveness findings',
        'Document media coverage analysis',
        'Summarize stakeholder and reputation impact',
        'List prioritized lessons learned',
        'Include plan update recommendations',
        'Document recovery strategy',
        'Assess overall quality and completeness'
      ],
      outputFormat: 'JSON with report object (executiveSummary, timeline, responseAnalysis, commsAnalysis, coverageAnalysis, impactAssessment, lessons, planUpdates, recoveryStrategy), qualityScore, gaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'qualityScore'],
      properties: {
        report: { type: 'object' },
        qualityScore: { type: 'number', minimum: 0, maximum: 100 },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'after-action-report']
}));
