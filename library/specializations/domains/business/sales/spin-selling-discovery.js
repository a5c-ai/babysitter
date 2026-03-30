/**
 * @process sales/spin-selling-discovery
 * @description Structured discovery framework using Situation, Problem, Implication, and Need-Payoff questions to uncover customer needs and build value through consultative selling techniques.
 * @inputs { accountName: string, contactName: string, industry: string, currentSituation?: string, knownChallenges?: array, meetingObjective?: string }
 * @outputs { success: boolean, discoveryReport: object, spinAnalysis: object, identifiedNeeds: array, nextSteps: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/spin-selling-discovery', {
 *   accountName: 'Acme Corporation',
 *   contactName: 'John Smith',
 *   industry: 'Manufacturing',
 *   currentSituation: 'Legacy ERP system with manual processes',
 *   knownChallenges: ['Data silos', 'Manual reporting'],
 *   meetingObjective: 'Qualify opportunity for ERP modernization'
 * });
 *
 * @references
 * - SPIN Selling by Neil Rackham: https://www.amazon.com/SPIN-Selling-Neil-Rackham/dp/0070511136
 * - Huthwaite International: https://www.huthwaiteinternational.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    accountName,
    contactName,
    industry,
    currentSituation = '',
    knownChallenges = [],
    meetingObjective = 'Qualify opportunity and uncover needs',
    outputDir = 'spin-discovery-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting SPIN Selling Discovery for ${accountName}`);

  // ============================================================================
  // PHASE 1: SITUATION QUESTIONS PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Preparing Situation Questions');
  const situationAnalysis = await ctx.task(situationQuestionsTask, {
    accountName,
    contactName,
    industry,
    currentSituation,
    meetingObjective,
    outputDir
  });

  artifacts.push(...(situationAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 2: PROBLEM QUESTIONS DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing Problem Questions');
  const problemAnalysis = await ctx.task(problemQuestionsTask, {
    accountName,
    industry,
    situationAnalysis,
    knownChallenges,
    outputDir
  });

  artifacts.push(...(problemAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 3: IMPLICATION QUESTIONS STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing Implication Questions');
  const implicationAnalysis = await ctx.task(implicationQuestionsTask, {
    accountName,
    industry,
    situationAnalysis,
    problemAnalysis,
    outputDir
  });

  artifacts.push(...(implicationAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 4: NEED-PAYOFF QUESTIONS PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Preparing Need-Payoff Questions');
  const needPayoffAnalysis = await ctx.task(needPayoffQuestionsTask, {
    accountName,
    industry,
    problemAnalysis,
    implicationAnalysis,
    outputDir
  });

  artifacts.push(...(needPayoffAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 5: DISCOVERY CALL GUIDE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Generating Discovery Call Guide');
  const discoveryGuide = await ctx.task(discoveryGuideGenerationTask, {
    accountName,
    contactName,
    industry,
    meetingObjective,
    situationAnalysis,
    problemAnalysis,
    implicationAnalysis,
    needPayoffAnalysis,
    outputDir
  });

  artifacts.push(...(discoveryGuide.artifacts || []));

  // Breakpoint: Review discovery guide before meeting
  await ctx.breakpoint({
    question: `SPIN Discovery guide prepared for ${accountName}. Review the questioning strategy and approve?`,
    title: 'SPIN Discovery Guide Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || undefined
      })),
      summary: {
        accountName,
        contactName,
        situationQuestions: situationAnalysis.questions?.length || 0,
        problemQuestions: problemAnalysis.questions?.length || 0,
        implicationQuestions: implicationAnalysis.questions?.length || 0,
        needPayoffQuestions: needPayoffAnalysis.questions?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 6: POST-DISCOVERY ANALYSIS (Optional - after meeting)
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating needs analysis framework');
  const needsAnalysis = await ctx.task(needsAnalysisTask, {
    accountName,
    industry,
    situationAnalysis,
    problemAnalysis,
    implicationAnalysis,
    needPayoffAnalysis,
    outputDir
  });

  artifacts.push(...(needsAnalysis.artifacts || []));

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    accountName,
    contactName,
    discoveryReport: {
      meetingObjective,
      questioningStrategy: discoveryGuide.strategy,
      callFlow: discoveryGuide.callFlow
    },
    spinAnalysis: {
      situation: {
        questions: situationAnalysis.questions,
        keyFactsToUncover: situationAnalysis.keyFacts
      },
      problem: {
        questions: problemAnalysis.questions,
        hypothesizedPains: problemAnalysis.hypothesizedPains
      },
      implication: {
        questions: implicationAnalysis.questions,
        businessImpacts: implicationAnalysis.businessImpacts
      },
      needPayoff: {
        questions: needPayoffAnalysis.questions,
        valuePropositions: needPayoffAnalysis.valuePropositions
      }
    },
    identifiedNeeds: needsAnalysis.identifiedNeeds,
    qualificationStatus: needsAnalysis.qualificationStatus,
    nextSteps: needsAnalysis.recommendedNextSteps,
    artifacts,
    duration,
    metadata: {
      processId: 'sales/spin-selling-discovery',
      timestamp: startTime,
      accountName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const situationQuestionsTask = defineTask('situation-questions', (args, taskCtx) => ({
  kind: 'agent',
  title: `SPIN Situation Questions - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Senior sales strategist specializing in SPIN Selling methodology',
      task: 'Develop effective Situation questions to understand the prospect current state and context',
      context: args,
      instructions: [
        'Analyze the account profile and industry to identify relevant background areas',
        'Create 5-8 open-ended Situation questions to understand current state',
        'Focus on facts and background information, not opinions or feelings',
        'Avoid excessive Situation questions - these should be targeted and purposeful',
        'Identify what research can be done beforehand to minimize basic questions',
        'Categorize questions by topic: operations, technology, processes, organization',
        'Note which questions are critical vs nice-to-have',
        'Include follow-up probes for each main question'
      ],
      outputFormat: 'JSON with questions array, keyFacts array, researchRecommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['questions', 'keyFacts', 'artifacts'],
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              category: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'important', 'nice-to-have'] },
              followUpProbes: { type: 'array', items: { type: 'string' } },
              expectedInsight: { type: 'string' }
            }
          }
        },
        keyFacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fact: { type: 'string' },
              source: { type: 'string', enum: ['research', 'discovery'] },
              importance: { type: 'string' }
            }
          }
        },
        researchRecommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'spin-selling', 'situation-questions']
}));

export const problemQuestionsTask = defineTask('problem-questions', (args, taskCtx) => ({
  kind: 'agent',
  title: `SPIN Problem Questions - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Senior sales strategist specializing in SPIN Selling methodology',
      task: 'Develop Problem questions to uncover customer difficulties, dissatisfactions, and challenges',
      context: args,
      instructions: [
        'Based on situation context, identify likely problem areas',
        'Create 6-10 Problem questions that probe for pain points',
        'Focus on difficulties, dissatisfactions, and challenges',
        'Use language that encourages the prospect to elaborate on problems',
        'Avoid leading questions that assume problems exist',
        'Categorize by business area: efficiency, cost, quality, risk, growth',
        'Include gentle problem questions for sensitive areas',
        'Map potential problems to your solution capabilities'
      ],
      outputFormat: 'JSON with questions array, hypothesizedPains array, problemCategories, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['questions', 'hypothesizedPains', 'artifacts'],
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              targetPain: { type: 'string' },
              category: { type: 'string' },
              sensitivity: { type: 'string', enum: ['low', 'medium', 'high'] },
              followUpProbes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        hypothesizedPains: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pain: { type: 'string' },
              likelihood: { type: 'string', enum: ['high', 'medium', 'low'] },
              solutionAlignment: { type: 'string' }
            }
          }
        },
        problemCategories: {
          type: 'object',
          additionalProperties: { type: 'array', items: { type: 'string' } }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'spin-selling', 'problem-questions']
}));

export const implicationQuestionsTask = defineTask('implication-questions', (args, taskCtx) => ({
  kind: 'agent',
  title: `SPIN Implication Questions - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Senior sales strategist specializing in SPIN Selling methodology',
      task: 'Develop Implication questions to help the prospect understand the consequences and impact of their problems',
      context: args,
      instructions: [
        'For each identified problem, develop questions about consequences',
        'Create 8-12 Implication questions that build urgency',
        'Focus on effects, consequences, and impacts of problems',
        'Help prospect connect problems to business outcomes',
        'Include questions about ripple effects across departments',
        'Quantify impacts where possible (time, money, risk)',
        'Use questions that make problems feel larger and more urgent',
        'Avoid being too aggressive or creating discomfort'
      ],
      outputFormat: 'JSON with questions array, businessImpacts array, urgencyDrivers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['questions', 'businessImpacts', 'artifacts'],
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              linkedProblem: { type: 'string' },
              impactType: { type: 'string', enum: ['financial', 'operational', 'strategic', 'risk', 'competitive'] },
              urgencyLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
              followUpProbes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        businessImpacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              impact: { type: 'string' },
              category: { type: 'string' },
              potentialCost: { type: 'string' },
              affectedAreas: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        urgencyDrivers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'spin-selling', 'implication-questions']
}));

export const needPayoffQuestionsTask = defineTask('need-payoff-questions', (args, taskCtx) => ({
  kind: 'agent',
  title: `SPIN Need-Payoff Questions - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Senior sales strategist specializing in SPIN Selling methodology',
      task: 'Develop Need-Payoff questions to help the prospect articulate the value and benefits of solving their problems',
      context: args,
      instructions: [
        'Create questions that get the prospect to state the benefits themselves',
        'Develop 6-8 Need-Payoff questions for each major problem area',
        'Focus on value, importance, and usefulness of solutions',
        'Help prospect envision the positive outcome',
        'Questions should lead naturally toward your solution capabilities',
        'Avoid stating benefits - let the prospect discover them',
        'Include questions about ROI, efficiency gains, and strategic value',
        'Create questions that build internal champions'
      ],
      outputFormat: 'JSON with questions array, valuePropositions array, solutionAlignment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['questions', 'valuePropositions', 'artifacts'],
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              linkedProblem: { type: 'string' },
              expectedBenefit: { type: 'string' },
              solutionCapability: { type: 'string' },
              followUpProbes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        valuePropositions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              proposition: { type: 'string' },
              problemAddressed: { type: 'string' },
              quantifiableBenefit: { type: 'string' },
              stakeholderAppeal: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        solutionAlignment: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'spin-selling', 'need-payoff-questions']
}));

export const discoveryGuideGenerationTask = defineTask('discovery-guide-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `SPIN Discovery Guide - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Senior sales strategist and discovery call expert',
      task: 'Generate a comprehensive discovery call guide using SPIN methodology',
      context: args,
      instructions: [
        'Create an organized call flow with timing recommendations',
        'Sequence questions from Situation through Need-Payoff naturally',
        'Include opening and rapport-building guidance',
        'Provide transition phrases between SPIN phases',
        'Include objection handling suggestions',
        'Add listening cues and response triggers',
        'Create a summary checklist for call completion',
        'Include next steps and follow-up recommendations'
      ],
      outputFormat: 'JSON with strategy object, callFlow array, transitionPhrases, checklistItems, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'callFlow', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            objective: { type: 'string' },
            approach: { type: 'string' },
            keyMessages: { type: 'array', items: { type: 'string' } },
            riskFactors: { type: 'array', items: { type: 'string' } }
          }
        },
        callFlow: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              keyQuestions: { type: 'array', items: { type: 'string' } },
              transitionCue: { type: 'string' }
            }
          }
        },
        transitionPhrases: {
          type: 'object',
          additionalProperties: { type: 'array', items: { type: 'string' } }
        },
        objectionHandling: { type: 'array', items: { type: 'object' } },
        checklistItems: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'spin-selling', 'discovery-guide']
}));

export const needsAnalysisTask = defineTask('needs-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `SPIN Needs Analysis - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Senior sales analyst and opportunity qualification expert',
      task: 'Analyze discovered needs and determine qualification status and next steps',
      context: args,
      instructions: [
        'Synthesize all SPIN phases into identified explicit and implicit needs',
        'Categorize needs by priority and solvability',
        'Assess opportunity qualification based on uncovered needs',
        'Map needs to solution capabilities',
        'Identify gaps where needs cannot be addressed',
        'Recommend next steps in the sales process',
        'Suggest key stakeholders to engage',
        'Create needs summary for proposal development'
      ],
      outputFormat: 'JSON with identifiedNeeds array, qualificationStatus object, recommendedNextSteps array, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedNeeds', 'qualificationStatus', 'recommendedNextSteps', 'artifacts'],
      properties: {
        identifiedNeeds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              need: { type: 'string' },
              type: { type: 'string', enum: ['explicit', 'implicit'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              solutionFit: { type: 'string', enum: ['strong', 'moderate', 'weak', 'none'] },
              stakeholder: { type: 'string' }
            }
          }
        },
        qualificationStatus: {
          type: 'object',
          properties: {
            qualified: { type: 'boolean' },
            score: { type: 'number', minimum: 0, maximum: 100 },
            strengths: { type: 'array', items: { type: 'string' } },
            concerns: { type: 'array', items: { type: 'string' } },
            recommendation: { type: 'string' }
          }
        },
        recommendedNextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              owner: { type: 'string' },
              timing: { type: 'string' },
              objective: { type: 'string' }
            }
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
              engagement: { type: 'string' }
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
  labels: ['agent', 'sales', 'spin-selling', 'needs-analysis']
}));
