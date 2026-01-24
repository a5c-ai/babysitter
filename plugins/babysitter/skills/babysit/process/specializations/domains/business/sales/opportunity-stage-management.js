/**
 * @process sales/opportunity-stage-management
 * @description Workflow for advancing opportunities through defined sales stages with clear exit criteria and required activities at each stage.
 * @inputs { opportunityId: string, opportunityName: string, currentStage: string, accountData: object, dealValue: number, stageHistory?: array }
 * @outputs { success: boolean, stageAssessment: object, exitCriteria: object, requiredActions: array, stageRecommendation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/opportunity-stage-management', {
 *   opportunityId: 'OPP-12345',
 *   opportunityName: 'Enterprise Deal',
 *   currentStage: 'Discovery',
 *   accountData: { name: 'Big Corp', contacts: [] },
 *   dealValue: 100000
 * });
 *
 * @references
 * - Salesforce Sales Cloud: https://www.salesforce.com/products/sales-cloud/
 * - Miller Heiman Strategic Selling: https://www.millerheimangroup.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    opportunityId,
    opportunityName,
    currentStage,
    accountData,
    dealValue,
    stageHistory = [],
    salesProcess = 'standard',
    outputDir = 'opp-stage-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Opportunity Stage Management for ${opportunityName}`);

  // ============================================================================
  // PHASE 1: CURRENT STAGE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing Current Stage');
  const stageAssessment = await ctx.task(currentStageAssessmentTask, {
    opportunityId,
    opportunityName,
    currentStage,
    accountData,
    dealValue,
    stageHistory,
    outputDir
  });

  artifacts.push(...(stageAssessment.artifacts || []));

  // ============================================================================
  // PHASE 2: EXIT CRITERIA EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Evaluating Exit Criteria');
  const exitCriteriaEvaluation = await ctx.task(exitCriteriaEvaluationTask, {
    opportunityName,
    currentStage,
    stageAssessment,
    accountData,
    outputDir
  });

  artifacts.push(...(exitCriteriaEvaluation.artifacts || []));

  // ============================================================================
  // PHASE 3: REQUIRED ACTIVITIES IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying Required Activities');
  const requiredActivities = await ctx.task(requiredActivitiesTask, {
    opportunityName,
    currentStage,
    exitCriteriaEvaluation,
    accountData,
    outputDir
  });

  artifacts.push(...(requiredActivities.artifacts || []));

  // ============================================================================
  // PHASE 4: RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing Stage Risks');
  const riskAssessment = await ctx.task(stageRiskAssessmentTask, {
    opportunityName,
    currentStage,
    stageAssessment,
    exitCriteriaEvaluation,
    dealValue,
    outputDir
  });

  artifacts.push(...(riskAssessment.artifacts || []));

  // ============================================================================
  // PHASE 5: STAGE ADVANCEMENT RECOMMENDATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Generating Stage Recommendation');
  const stageRecommendation = await ctx.task(stageAdvancementTask, {
    opportunityName,
    currentStage,
    exitCriteriaEvaluation,
    requiredActivities,
    riskAssessment,
    outputDir
  });

  artifacts.push(...(stageRecommendation.artifacts || []));

  // ============================================================================
  // PHASE 6: ACTION PLAN GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating Action Plan');
  const actionPlan = await ctx.task(actionPlanGenerationTask, {
    opportunityName,
    currentStage,
    stageRecommendation,
    requiredActivities,
    riskAssessment,
    outputDir
  });

  artifacts.push(...(actionPlan.artifacts || []));

  // Breakpoint: Review stage assessment
  await ctx.breakpoint({
    question: `Stage assessment complete for ${opportunityName}. Current: ${currentStage}. Ready to advance: ${stageRecommendation.readyToAdvance}. Review?`,
    title: 'Opportunity Stage Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || undefined
      })),
      summary: {
        opportunityName,
        currentStage,
        readyToAdvance: stageRecommendation.readyToAdvance,
        exitCriteriaMet: exitCriteriaEvaluation.percentComplete,
        topRisks: riskAssessment.topRisks
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    opportunityId,
    opportunityName,
    stageAssessment: {
      currentStage,
      stageHealth: stageAssessment.health,
      daysInStage: stageAssessment.daysInStage,
      velocity: stageAssessment.velocity
    },
    exitCriteria: {
      criteria: exitCriteriaEvaluation.criteria,
      percentComplete: exitCriteriaEvaluation.percentComplete,
      blockers: exitCriteriaEvaluation.blockers
    },
    requiredActions: requiredActivities.actions,
    riskAssessment: {
      riskLevel: riskAssessment.overallRisk,
      topRisks: riskAssessment.topRisks,
      mitigations: riskAssessment.mitigations
    },
    stageRecommendation: {
      readyToAdvance: stageRecommendation.readyToAdvance,
      nextStage: stageRecommendation.nextStage,
      conditions: stageRecommendation.conditions
    },
    actionPlan: actionPlan.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'sales/opportunity-stage-management',
      timestamp: startTime,
      opportunityId,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const currentStageAssessmentTask = defineTask('current-stage-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Current Stage Assessment - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Sales operations analyst specializing in pipeline management',
      task: 'Assess the current state of the opportunity within its sales stage',
      context: args,
      instructions: [
        'Analyze current stage definition and requirements',
        'Assess how long the opportunity has been in current stage',
        'Evaluate stage velocity compared to benchmarks',
        'Identify stage-appropriate activities completed',
        'Assess overall opportunity health',
        'Review stage history for patterns',
        'Identify stalled indicators',
        'Calculate stage probability adjustment'
      ],
      outputFormat: 'JSON with health, daysInStage, velocity, completedActivities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['health', 'daysInStage', 'velocity', 'artifacts'],
      properties: {
        health: { type: 'string', enum: ['healthy', 'at-risk', 'stalled', 'critical'] },
        daysInStage: { type: 'number' },
        averageDaysInStage: { type: 'number' },
        velocity: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ahead', 'on-track', 'behind', 'stalled'] },
            daysVariance: { type: 'number' }
          }
        },
        completedActivities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              date: { type: 'string' },
              outcome: { type: 'string' }
            }
          }
        },
        stalledIndicators: { type: 'array', items: { type: 'string' } },
        probabilityAdjustment: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'opportunity-management', 'stage-assessment']
}));

export const exitCriteriaEvaluationTask = defineTask('exit-criteria-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Exit Criteria Evaluation - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Sales process expert specializing in stage gate criteria',
      task: 'Evaluate completion of stage exit criteria',
      context: args,
      instructions: [
        'List all exit criteria for current stage',
        'Evaluate completion status of each criterion',
        'Identify any hard blockers',
        'Assess quality of completed criteria',
        'Calculate overall completion percentage',
        'Identify gaps and missing evidence',
        'Prioritize remaining criteria',
        'Suggest alternative evidence if available'
      ],
      outputFormat: 'JSON with criteria array, percentComplete, blockers, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'percentComplete', 'artifacts'],
      properties: {
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              required: { type: 'boolean' },
              status: { type: 'string', enum: ['met', 'partial', 'not-met'] },
              evidence: { type: 'string' },
              quality: { type: 'string', enum: ['strong', 'adequate', 'weak'] }
            }
          }
        },
        percentComplete: { type: 'number', minimum: 0, maximum: 100 },
        blockers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              reason: { type: 'string' },
              resolution: { type: 'string' }
            }
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
  labels: ['agent', 'sales', 'opportunity-management', 'exit-criteria']
}));

export const requiredActivitiesTask = defineTask('required-activities', (args, taskCtx) => ({
  kind: 'agent',
  title: `Required Activities - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Sales methodology coach',
      task: 'Identify required activities to complete stage and advance',
      context: args,
      instructions: [
        'List all required activities for stage completion',
        'Identify activities already completed',
        'Prioritize remaining activities',
        'Assign ownership and deadlines',
        'Identify dependencies between activities',
        'Suggest activity sequences',
        'Estimate effort for each activity',
        'Flag activities requiring customer involvement'
      ],
      outputFormat: 'JSON with actions array, completedActions, dependencies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'artifacts'],
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              owner: { type: 'string' },
              deadline: { type: 'string' },
              effort: { type: 'string' },
              customerRequired: { type: 'boolean' },
              exitCriterion: { type: 'string' }
            }
          }
        },
        completedActions: { type: 'array', items: { type: 'string' } },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              dependsOn: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        suggestedSequence: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'opportunity-management', 'activities']
}));

export const stageRiskAssessmentTask = defineTask('stage-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Stage Risk Assessment - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Sales risk analyst',
      task: 'Assess risks that could prevent stage advancement or deal closure',
      context: args,
      instructions: [
        'Identify competitive risks',
        'Assess buyer engagement risks',
        'Evaluate timeline risks',
        'Identify budget and approval risks',
        'Assess internal execution risks',
        'Evaluate market/external risks',
        'Score overall risk level',
        'Develop mitigation strategies'
      ],
      outputFormat: 'JSON with risks array, overallRisk, topRisks, mitigations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'overallRisk', 'artifacts'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              category: { type: 'string', enum: ['competitive', 'buyer', 'timeline', 'budget', 'execution', 'external'] },
              likelihood: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              indicator: { type: 'string' }
            }
          }
        },
        overallRisk: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        topRisks: { type: 'array', items: { type: 'string' } },
        mitigations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              mitigation: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        earlyWarnings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'opportunity-management', 'risk-assessment']
}));

export const stageAdvancementTask = defineTask('stage-advancement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Stage Advancement Recommendation - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Sales operations manager',
      task: 'Provide recommendation on stage advancement readiness',
      context: args,
      instructions: [
        'Assess if opportunity is ready to advance',
        'Determine next appropriate stage',
        'Identify conditions for advancement',
        'Define advancement criteria',
        'Assess quality of stage completion',
        'Provide confidence level',
        'Identify manager approval requirements',
        'Suggest timing for stage change'
      ],
      outputFormat: 'JSON with readyToAdvance, nextStage, conditions, confidence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['readyToAdvance', 'artifacts'],
      properties: {
        readyToAdvance: { type: 'boolean' },
        nextStage: { type: 'string' },
        conditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              status: { type: 'string', enum: ['met', 'pending'] }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        qualityAssessment: {
          type: 'object',
          properties: {
            stageQuality: { type: 'string', enum: ['excellent', 'good', 'adequate', 'poor'] },
            concerns: { type: 'array', items: { type: 'string' } }
          }
        },
        approvalRequired: { type: 'boolean' },
        suggestedTiming: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'opportunity-management', 'stage-advancement']
}));

export const actionPlanGenerationTask = defineTask('action-plan-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Action Plan Generation - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Sales execution planner',
      task: 'Generate prioritized action plan for opportunity advancement',
      context: args,
      instructions: [
        'Compile all required actions',
        'Prioritize by impact and urgency',
        'Assign owners and deadlines',
        'Create action sequences',
        'Include risk mitigations',
        'Define success metrics',
        'Set check-in points',
        'Create accountability framework'
      ],
      outputFormat: 'JSON with plan array, timeline, successMetrics, checkpoints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              priority: { type: 'number', minimum: 1, maximum: 10 },
              owner: { type: 'string' },
              deadline: { type: 'string' },
              successCriteria: { type: 'string' },
              notes: { type: 'string' }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            targetStageAdvance: { type: 'string' },
            keyMilestones: { type: 'array', items: { type: 'object' } }
          }
        },
        successMetrics: { type: 'array', items: { type: 'string' } },
        checkpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              checkpoint: { type: 'string' },
              date: { type: 'string' },
              criteria: { type: 'string' }
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
  labels: ['agent', 'sales', 'opportunity-management', 'action-plan']
}));
