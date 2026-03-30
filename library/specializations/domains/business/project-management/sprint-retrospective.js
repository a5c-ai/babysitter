/**
 * @process specializations/domains/business/project-management/sprint-retrospective
 * @description Sprint Retrospective Facilitation - Facilitate team retrospectives to identify improvements,
 * celebrate successes, address challenges, and commit to actionable changes.
 * @inputs { projectName: string, sprintNumber: number, sprintData: object, teamMembers: array }
 * @outputs { success: boolean, retrospectiveReport: object, actionItems: array, improvements: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/sprint-retrospective', {
 *   projectName: 'Mobile App Development',
 *   sprintNumber: 5,
 *   sprintData: { velocity: 34, committed: 38, completed: [...], incomplete: [...] },
 *   teamMembers: [{ name: 'Alice', role: 'developer' }, { name: 'Bob', role: 'tester' }]
 * });
 *
 * @references
 * - Agile Retrospectives: https://www.scrumalliance.org/agile-resources/agile-retrospectives
 * - Retrospective Techniques: https://retrospectivewiki.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sprintNumber,
    sprintData,
    teamMembers = [],
    previousActions = [],
    retrospectiveFormat = 'start-stop-continue'
  } = inputs;

  // Phase 1: Sprint Performance Review
  const performanceReview = await ctx.task(sprintPerformanceReviewTask, {
    projectName,
    sprintNumber,
    sprintData
  });

  // Phase 2: Previous Actions Review
  const actionsReview = await ctx.task(previousActionsReviewTask, {
    projectName,
    sprintNumber,
    previousActions,
    sprintData
  });

  // Breakpoint: Review sprint metrics
  await ctx.breakpoint({
    question: `Sprint ${sprintNumber} performance review complete. Velocity: ${performanceReview.actualVelocity}/${performanceReview.committedVelocity}. Previous actions: ${actionsReview.completedCount}/${actionsReview.totalActions} completed. Proceed with retrospective?`,
    title: 'Sprint Performance Review',
    context: {
      runId: ctx.runId,
      projectName,
      sprintNumber,
      velocity: performanceReview.actualVelocity,
      previousActionsStatus: actionsReview.status,
      files: [{
        path: `artifacts/sprint-${sprintNumber}-performance.json`,
        format: 'json',
        content: performanceReview
      }]
    }
  });

  // Phase 3: What Went Well (Successes)
  const wentWell = await ctx.task(wentWellAnalysisTask, {
    projectName,
    sprintNumber,
    sprintData,
    performanceReview,
    teamMembers
  });

  // Phase 4: What Could Improve (Challenges)
  const couldImprove = await ctx.task(couldImproveAnalysisTask, {
    projectName,
    sprintNumber,
    sprintData,
    performanceReview,
    teamMembers
  });

  // Phase 5: Root Cause Analysis
  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, {
    projectName,
    sprintNumber,
    couldImprove,
    sprintData
  });

  // Phase 6: Improvement Ideation
  const improvementIdeation = await ctx.task(improvementIdeationTask, {
    projectName,
    sprintNumber,
    couldImprove,
    rootCauseAnalysis,
    wentWell
  });

  // Phase 7: Action Item Prioritization
  const actionPrioritization = await ctx.task(actionPrioritizationTask, {
    projectName,
    sprintNumber,
    improvementIdeation,
    teamMembers
  });

  // Quality Gate: Ensure actionable improvements
  if (actionPrioritization.prioritizedActions.length === 0) {
    await ctx.breakpoint({
      question: `No prioritized actions identified for Sprint ${sprintNumber}. Review improvement ideas or continue?`,
      title: 'No Actions Warning',
      context: {
        runId: ctx.runId,
        ideasCount: improvementIdeation.ideas?.length || 0,
        recommendation: 'Ensure at least 1-3 concrete improvement actions'
      }
    });
  }

  // Phase 8: Commitment and Ownership
  const commitments = await ctx.task(commitmentOwnershipTask, {
    projectName,
    sprintNumber,
    prioritizedActions: actionPrioritization.prioritizedActions,
    teamMembers
  });

  // Phase 9: Appreciation and Recognition
  const appreciation = await ctx.task(appreciationRecognitionTask, {
    projectName,
    sprintNumber,
    wentWell,
    teamMembers
  });

  // Phase 10: Retrospective Report Generation
  const retrospectiveReport = await ctx.task(retrospectiveReportTask, {
    projectName,
    sprintNumber,
    performanceReview,
    actionsReview,
    wentWell,
    couldImprove,
    rootCauseAnalysis,
    improvementIdeation,
    actionPrioritization,
    commitments,
    appreciation
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Sprint ${sprintNumber} retrospective complete. Actions committed: ${commitments.actions.length}. Finalize and distribute?`,
    title: 'Retrospective Completion',
    context: {
      runId: ctx.runId,
      projectName,
      sprintNumber,
      actionsCount: commitments.actions.length,
      improvements: improvementIdeation.ideas?.length || 0,
      files: [
        { path: `artifacts/sprint-${sprintNumber}-retrospective.json`, format: 'json', content: retrospectiveReport },
        { path: `artifacts/sprint-${sprintNumber}-retrospective.md`, format: 'markdown', content: retrospectiveReport.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    sprintNumber,
    retrospectiveReport: {
      summary: retrospectiveReport.summary,
      markdown: retrospectiveReport.markdown,
      performanceOverview: performanceReview,
      wentWell: wentWell.items,
      needsImprovement: couldImprove.items
    },
    actionItems: commitments.actions,
    improvements: improvementIdeation.ideas,
    previousActionsStatus: actionsReview,
    appreciation: appreciation.recognitions,
    insights: rootCauseAnalysis.insights,
    recommendations: retrospectiveReport.recommendations,
    metadata: {
      processId: 'specializations/domains/business/project-management/sprint-retrospective',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const sprintPerformanceReviewTask = defineTask('sprint-performance-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Sprint Performance Review - Sprint ${args.sprintNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scrum Master',
      task: 'Review sprint performance metrics and outcomes',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        sprintData: args.sprintData
      },
      instructions: [
        '1. Calculate actual velocity vs committed',
        '2. Review completed vs incomplete stories',
        '3. Analyze commitment accuracy',
        '4. Review sprint goal achievement',
        '5. Calculate scope changes during sprint',
        '6. Assess quality metrics (bugs, defects)',
        '7. Review team capacity utilization',
        '8. Identify completion patterns',
        '9. Compare with previous sprints',
        '10. Summarize performance highlights'
      ],
      outputFormat: 'JSON object with performance review'
    },
    outputSchema: {
      type: 'object',
      required: ['actualVelocity', 'committedVelocity', 'goalAchievement'],
      properties: {
        actualVelocity: { type: 'number' },
        committedVelocity: { type: 'number' },
        completionRate: { type: 'number' },
        goalAchievement: { type: 'string', enum: ['achieved', 'partially-achieved', 'not-achieved'] },
        storiesCompleted: { type: 'number' },
        storiesIncomplete: { type: 'number' },
        scopeChanges: { type: 'number' },
        qualityMetrics: {
          type: 'object',
          properties: {
            bugsFound: { type: 'number' },
            bugsFixed: { type: 'number' },
            defectEscapes: { type: 'number' }
          }
        },
        capacityUtilization: { type: 'number' },
        comparisonToPrevious: { type: 'string' },
        highlights: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['retrospective', 'performance', 'metrics']
}));

export const previousActionsReviewTask = defineTask('previous-actions-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Previous Actions Review - Sprint ${args.sprintNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scrum Master',
      task: 'Review status of previous retrospective action items',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        previousActions: args.previousActions,
        sprintData: args.sprintData
      },
      instructions: [
        '1. List previous sprint action items',
        '2. Assess completion status of each',
        '3. Evaluate effectiveness of completed actions',
        '4. Identify blockers for incomplete actions',
        '5. Determine if actions should continue',
        '6. Assess impact of completed improvements',
        '7. Identify patterns in action completion',
        '8. Document lessons learned',
        '9. Calculate action completion rate',
        '10. Recommend action disposition'
      ],
      outputFormat: 'JSON object with actions review'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'totalActions', 'completedCount'],
      properties: {
        status: { type: 'string', enum: ['excellent', 'good', 'needs-improvement'] },
        totalActions: { type: 'number' },
        completedCount: { type: 'number' },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              status: { type: 'string', enum: ['completed', 'in-progress', 'not-started', 'dropped'] },
              effectiveness: { type: 'string', enum: ['high', 'medium', 'low', 'unknown'] },
              blockers: { type: 'array', items: { type: 'string' } },
              disposition: { type: 'string', enum: ['close', 'continue', 'revise'] }
            }
          }
        },
        completionRate: { type: 'number' },
        impactObserved: { type: 'array', items: { type: 'string' } },
        lessonsLearned: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['retrospective', 'actions-review', 'follow-up']
}));

export const wentWellAnalysisTask = defineTask('went-well-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: What Went Well - Sprint ${args.sprintNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Retrospective Facilitator',
      task: 'Identify and analyze sprint successes',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        sprintData: args.sprintData,
        performanceReview: args.performanceReview,
        teamMembers: args.teamMembers
      },
      instructions: [
        '1. Identify successful practices',
        '2. Highlight team achievements',
        '3. Note effective collaboration examples',
        '4. Recognize individual contributions',
        '5. Identify process improvements that worked',
        '6. Document technical successes',
        '7. Note communication wins',
        '8. Identify practices to continue',
        '9. Document customer/stakeholder positive feedback',
        '10. Categorize successes by theme'
      ],
      outputFormat: 'JSON object with successes analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['items'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              category: { type: 'string', enum: ['process', 'technical', 'collaboration', 'communication', 'quality', 'other'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              shouldContinue: { type: 'boolean' }
            }
          }
        },
        topSuccesses: { type: 'array', items: { type: 'string' } },
        teamAchievements: { type: 'array', items: { type: 'string' } },
        individualContributions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              member: { type: 'string' },
              contribution: { type: 'string' }
            }
          }
        },
        practicesToContinue: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['retrospective', 'successes', 'positive']
}));

export const couldImproveAnalysisTask = defineTask('could-improve-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: What Could Improve - Sprint ${args.sprintNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Retrospective Facilitator',
      task: 'Identify areas for improvement',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        sprintData: args.sprintData,
        performanceReview: args.performanceReview,
        teamMembers: args.teamMembers
      },
      instructions: [
        '1. Identify challenges faced',
        '2. Note frustrations experienced',
        '3. Document blockers encountered',
        '4. Identify inefficient practices',
        '5. Note communication gaps',
        '6. Identify technical debt issues',
        '7. Document process friction points',
        '8. Note collaboration challenges',
        '9. Identify quality issues',
        '10. Categorize improvement areas'
      ],
      outputFormat: 'JSON object with improvement areas'
    },
    outputSchema: {
      type: 'object',
      required: ['items'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              category: { type: 'string', enum: ['process', 'technical', 'collaboration', 'communication', 'quality', 'tools', 'other'] },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              frequency: { type: 'string', enum: ['always', 'often', 'sometimes', 'once'] }
            }
          }
        },
        topChallenges: { type: 'array', items: { type: 'string' } },
        blockers: { type: 'array', items: { type: 'string' } },
        frustrations: { type: 'array', items: { type: 'string' } },
        patterns: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['retrospective', 'improvements', 'challenges']
}));

export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Root Cause Analysis - Sprint ${args.sprintNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Process Analyst',
      task: 'Analyze root causes of identified challenges',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        couldImprove: args.couldImprove,
        sprintData: args.sprintData
      },
      instructions: [
        '1. Apply 5 Whys to top challenges',
        '2. Identify systemic vs one-time issues',
        '3. Find common root causes',
        '4. Assess controllability of causes',
        '5. Identify dependencies between issues',
        '6. Determine if causes are internal or external',
        '7. Prioritize causes by addressability',
        '8. Document causal chains',
        '9. Identify leverage points',
        '10. Generate insights'
      ],
      outputFormat: 'JSON object with root cause analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analyses', 'insights'],
      properties: {
        analyses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              challenge: { type: 'string' },
              rootCause: { type: 'string' },
              whyChain: { type: 'array', items: { type: 'string' } },
              isSystemic: { type: 'boolean' },
              controllability: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        commonRootCauses: { type: 'array', items: { type: 'string' } },
        systemicIssues: { type: 'array', items: { type: 'string' } },
        externalFactors: { type: 'array', items: { type: 'string' } },
        leveragePoints: { type: 'array', items: { type: 'string' } },
        insights: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['retrospective', 'root-cause', 'analysis']
}));

export const improvementIdeationTask = defineTask('improvement-ideation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Improvement Ideation - Sprint ${args.sprintNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Agile Coach',
      task: 'Generate improvement ideas and solutions',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        couldImprove: args.couldImprove,
        rootCauseAnalysis: args.rootCauseAnalysis,
        wentWell: args.wentWell
      },
      instructions: [
        '1. Brainstorm solutions for root causes',
        '2. Consider process changes',
        '3. Identify tool improvements',
        '4. Suggest communication enhancements',
        '5. Propose collaboration improvements',
        '6. Consider training needs',
        '7. Identify quick wins',
        '8. Propose experiments to try',
        '9. Leverage successful practices',
        '10. Generate creative solutions'
      ],
      outputFormat: 'JSON object with improvement ideas'
    },
    outputSchema: {
      type: 'object',
      required: ['ideas'],
      properties: {
        ideas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              idea: { type: 'string' },
              addressesCause: { type: 'string' },
              type: { type: 'string', enum: ['process', 'tool', 'communication', 'training', 'experiment', 'other'] },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              expectedImpact: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        quickWins: { type: 'array', items: { type: 'string' } },
        experiments: { type: 'array', items: { type: 'string' } },
        longerTermIdeas: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['retrospective', 'ideation', 'solutions']
}));

export const actionPrioritizationTask = defineTask('action-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Action Prioritization - Sprint ${args.sprintNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scrum Master',
      task: 'Prioritize improvement actions for the team',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        improvementIdeation: args.improvementIdeation,
        teamMembers: args.teamMembers
      },
      instructions: [
        '1. Apply impact/effort prioritization',
        '2. Select top 1-3 actions for next sprint',
        '3. Consider team capacity for improvements',
        '4. Ensure actions are SMART',
        '5. Define clear success criteria',
        '6. Set realistic timelines',
        '7. Identify dependencies',
        '8. Consider risks of inaction',
        '9. Balance quick wins with strategic improvements',
        '10. Document prioritization rationale'
      ],
      outputFormat: 'JSON object with prioritized actions'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedActions'],
      properties: {
        prioritizedActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              priority: { type: 'number' },
              impact: { type: 'string' },
              effort: { type: 'string' },
              successCriteria: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        selectedForSprint: { type: 'array', items: { type: 'string' } },
        backlog: { type: 'array', items: { type: 'string' } },
        prioritizationRationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['retrospective', 'prioritization', 'actions']
}));

export const commitmentOwnershipTask = defineTask('commitment-ownership', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Commitment and Ownership - Sprint ${args.sprintNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Team Facilitator',
      task: 'Assign ownership and secure team commitment',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        prioritizedActions: args.prioritizedActions,
        teamMembers: args.teamMembers
      },
      instructions: [
        '1. Assign owner to each action',
        '2. Define clear accountability',
        '3. Set due dates/review points',
        '4. Confirm team commitment',
        '5. Identify support needed',
        '6. Define check-in points',
        '7. Establish success measures',
        '8. Document commitments',
        '9. Plan follow-up mechanism',
        '10. Create action cards'
      ],
      outputFormat: 'JSON object with commitments'
    },
    outputSchema: {
      type: 'object',
      required: ['actions'],
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
              checkInDate: { type: 'string' },
              successMeasure: { type: 'string' },
              supportNeeded: { type: 'array', items: { type: 'string' } },
              status: { type: 'string' }
            }
          }
        },
        teamCommitment: { type: 'boolean' },
        followUpMechanism: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['retrospective', 'commitment', 'ownership']
}));

export const appreciationRecognitionTask = defineTask('appreciation-recognition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Appreciation and Recognition - Sprint ${args.sprintNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Team Coach',
      task: 'Facilitate team appreciation and recognition',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        wentWell: args.wentWell,
        teamMembers: args.teamMembers
      },
      instructions: [
        '1. Facilitate kudos and shout-outs',
        '2. Recognize individual contributions',
        '3. Celebrate team achievements',
        '4. Acknowledge extra effort',
        '5. Recognize collaboration examples',
        '6. Note growth and learning',
        '7. Appreciate problem-solving',
        '8. Recognize mentorship',
        '9. Document recognitions',
        '10. End on positive note'
      ],
      outputFormat: 'JSON object with appreciation and recognition'
    },
    outputSchema: {
      type: 'object',
      required: ['recognitions'],
      properties: {
        recognitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recipient: { type: 'string' },
              recognition: { type: 'string' },
              category: { type: 'string', enum: ['contribution', 'collaboration', 'growth', 'mentorship', 'extra-effort', 'problem-solving'] }
            }
          }
        },
        teamCelebrations: { type: 'array', items: { type: 'string' } },
        closingMessage: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['retrospective', 'appreciation', 'recognition']
}));

export const retrospectiveReportTask = defineTask('retrospective-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Retrospective Report - Sprint ${args.sprintNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation Specialist',
      task: 'Generate comprehensive retrospective report',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        performanceReview: args.performanceReview,
        actionsReview: args.actionsReview,
        wentWell: args.wentWell,
        couldImprove: args.couldImprove,
        rootCauseAnalysis: args.rootCauseAnalysis,
        improvementIdeation: args.improvementIdeation,
        actionPrioritization: args.actionPrioritization,
        commitments: args.commitments,
        appreciation: args.appreciation
      },
      instructions: [
        '1. Compile retrospective summary',
        '2. Document sprint performance',
        '3. List what went well',
        '4. List improvement areas',
        '5. Document action items',
        '6. Include recognitions',
        '7. Generate markdown report',
        '8. Create action tracking table',
        '9. Provide recommendations',
        '10. Add version control'
      ],
      outputFormat: 'JSON object with retrospective report'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'markdown'],
      properties: {
        summary: { type: 'string' },
        markdown: { type: 'string' },
        performanceSummary: { type: 'object' },
        wentWellSummary: { type: 'array', items: { type: 'string' } },
        improvementSummary: { type: 'array', items: { type: 'string' } },
        actionItemsTable: { type: 'array' },
        recognitionsSummary: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        documentControl: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            date: { type: 'string' },
            facilitator: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['retrospective', 'report', 'documentation']
}));
