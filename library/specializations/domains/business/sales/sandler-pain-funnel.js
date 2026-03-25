/**
 * @process sales/sandler-pain-funnel
 * @description Systematic questioning methodology to uncover deep pain points and quantify their business impact while maintaining equal business stature using the Sandler Pain Funnel approach.
 * @inputs { accountName: string, contactName: string, surfacePain?: string, industry: string, dealContext?: string }
 * @outputs { success: boolean, painFunnelAnalysis: object, deepPains: array, quantifiedImpact: object, nextSteps: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/sandler-pain-funnel', {
 *   accountName: 'Tech Startup Inc',
 *   contactName: 'Sarah Johnson',
 *   surfacePain: 'Our sales cycle is too long',
 *   industry: 'SaaS',
 *   dealContext: 'Initial discovery call'
 * });
 *
 * @references
 * - Sandler Training: https://www.sandler.com/
 * - You Cant Teach a Kid to Ride a Bike at a Seminar: https://www.amazon.com/Cant-Teach-Ride-Bike-Seminar/dp/0525942513
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    accountName,
    contactName,
    surfacePain = '',
    industry,
    dealContext = '',
    outputDir = 'sandler-pain-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Sandler Pain Funnel Process for ${accountName}`);

  // ============================================================================
  // PHASE 1: SURFACE PAIN ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Surface Pain');
  const surfaceAnalysis = await ctx.task(surfacePainAnalysisTask, {
    accountName,
    contactName,
    surfacePain,
    industry,
    outputDir
  });

  artifacts.push(...(surfaceAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 2: PAIN FUNNEL QUESTIONS DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing Pain Funnel Questions');
  const painFunnelQuestions = await ctx.task(painFunnelQuestionsTask, {
    accountName,
    contactName,
    surfaceAnalysis,
    industry,
    outputDir
  });

  artifacts.push(...(painFunnelQuestions.artifacts || []));

  // ============================================================================
  // PHASE 3: DEEP PAIN EXPLORATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Exploring Deep Pain Points');
  const deepPainExploration = await ctx.task(deepPainExplorationTask, {
    accountName,
    surfaceAnalysis,
    painFunnelQuestions,
    outputDir
  });

  artifacts.push(...(deepPainExploration.artifacts || []));

  // ============================================================================
  // PHASE 4: PAIN QUANTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Quantifying Pain Impact');
  const painQuantification = await ctx.task(painQuantificationTask, {
    accountName,
    industry,
    deepPainExploration,
    outputDir
  });

  artifacts.push(...(painQuantification.artifacts || []));

  // ============================================================================
  // PHASE 5: BUDGET UNCOVERING
  // ============================================================================

  ctx.log('info', 'Phase 5: Uncovering Budget Parameters');
  const budgetAnalysis = await ctx.task(budgetUncoveringTask, {
    accountName,
    painQuantification,
    dealContext,
    outputDir
  });

  artifacts.push(...(budgetAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 6: DECISION PROCESS EXPLORATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Exploring Decision Process');
  const decisionExploration = await ctx.task(decisionExplorationTask, {
    accountName,
    contactName,
    painQuantification,
    budgetAnalysis,
    outputDir
  });

  artifacts.push(...(decisionExploration.artifacts || []));

  // ============================================================================
  // PHASE 7: UPFRONT CONTRACT PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Preparing Upfront Contract');
  const upfrontContract = await ctx.task(upfrontContractTask, {
    accountName,
    contactName,
    deepPainExploration,
    painQuantification,
    budgetAnalysis,
    decisionExploration,
    outputDir
  });

  artifacts.push(...(upfrontContract.artifacts || []));

  // Breakpoint: Review pain funnel analysis
  await ctx.breakpoint({
    question: `Sandler Pain Funnel analysis complete for ${accountName}. Review findings and next steps?`,
    title: 'Sandler Pain Funnel Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || undefined
      })),
      summary: {
        accountName,
        surfacePain,
        deepPainsIdentified: deepPainExploration.deepPains?.length || 0,
        quantifiedImpact: painQuantification.totalImpact,
        budgetFit: budgetAnalysis.budgetFit
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    accountName,
    contactName,
    painFunnelAnalysis: {
      surfacePain: surfaceAnalysis.analyzedPain,
      funnelQuestions: painFunnelQuestions.questions,
      deepPains: deepPainExploration.deepPains,
      painHierarchy: deepPainExploration.painHierarchy
    },
    deepPains: deepPainExploration.deepPains,
    quantifiedImpact: {
      financialImpact: painQuantification.financialImpact,
      operationalImpact: painQuantification.operationalImpact,
      personalImpact: painQuantification.personalImpact,
      totalImpact: painQuantification.totalImpact
    },
    budgetAnalysis: budgetAnalysis,
    decisionProcess: decisionExploration,
    upfrontContract: upfrontContract.contract,
    nextSteps: upfrontContract.nextSteps,
    artifacts,
    duration,
    metadata: {
      processId: 'sales/sandler-pain-funnel',
      timestamp: startTime,
      accountName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const surfacePainAnalysisTask = defineTask('surface-pain-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Surface Pain Analysis - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Sandler-certified sales trainer and discovery expert',
      task: 'Analyze the surface-level pain and prepare for deeper exploration',
      context: args,
      instructions: [
        'Analyze the stated surface pain for underlying issues',
        'Identify what type of pain this represents (technical, financial, personal)',
        'Note assumptions that need to be validated',
        'Prepare initial probing questions',
        'Identify potential deeper pains beneath the surface',
        'Consider industry-specific pain patterns',
        'Note verbal and contextual cues',
        'Prepare nurturing statements to build trust'
      ],
      outputFormat: 'JSON with analyzedPain, painType, assumptions, probingQuestions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analyzedPain', 'painType', 'artifacts'],
      properties: {
        analyzedPain: {
          type: 'object',
          properties: {
            stated: { type: 'string' },
            interpretation: { type: 'string' },
            potentialDepth: { type: 'string', enum: ['surface', 'moderate', 'deep'] }
          }
        },
        painType: { type: 'string', enum: ['technical', 'financial', 'personal', 'strategic', 'operational'] },
        assumptions: { type: 'array', items: { type: 'string' } },
        potentialDeeperPains: { type: 'array', items: { type: 'string' } },
        probingQuestions: { type: 'array', items: { type: 'string' } },
        nurturingStatements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'sandler', 'surface-pain']
}));

export const painFunnelQuestionsTask = defineTask('pain-funnel-questions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pain Funnel Questions - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Sandler-certified trainer specializing in pain funnel methodology',
      task: 'Develop a complete set of pain funnel questions following the Sandler sequence',
      context: args,
      instructions: [
        'Create questions following the Sandler Pain Funnel sequence',
        'Start with "Tell me more about that..."',
        'Progress to "Can you be more specific? Give me an example..."',
        'Continue with "How long has that been a problem?"',
        'Ask "What have you tried to do about that?"',
        'Probe "And did that work?"',
        'Question "How much do you think that has cost you?"',
        'Explore "How do you feel about that?"',
        'End with "Have you given up trying to deal with the problem?"',
        'Customize questions for the specific pain and industry'
      ],
      outputFormat: 'JSON with questions array organized by funnel stage, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['questions', 'artifacts'],
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string', enum: ['explore', 'clarify', 'history', 'attempts', 'results', 'cost', 'feelings', 'commitment'] },
              question: { type: 'string' },
              purpose: { type: 'string' },
              followUps: { type: 'array', items: { type: 'string' } },
              listeningCues: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        funnelFlow: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              transition: { type: 'string' }
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
  labels: ['agent', 'sales', 'sandler', 'pain-funnel']
}));

export const deepPainExplorationTask = defineTask('deep-pain-exploration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deep Pain Exploration - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Senior sales psychologist and Sandler methodology expert',
      task: 'Guide exploration of deep pain points beneath the surface',
      context: args,
      instructions: [
        'Map the pain from surface to root cause',
        'Identify business pain, financial pain, and personal pain',
        'Understand the emotional component of each pain',
        'Create pain hierarchy showing connections',
        'Identify who else is affected by this pain',
        'Understand the ripple effects across the organization',
        'Note any resistance patterns',
        'Prepare reverse selling statements if prospect minimizes pain'
      ],
      outputFormat: 'JSON with deepPains array, painHierarchy, emotionalComponents, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['deepPains', 'painHierarchy', 'artifacts'],
      properties: {
        deepPains: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pain: { type: 'string' },
              level: { type: 'string', enum: ['surface', 'business', 'financial', 'personal'] },
              intensity: { type: 'number', minimum: 1, maximum: 10 },
              owner: { type: 'string' },
              duration: { type: 'string' },
              previousAttempts: { type: 'string' }
            }
          }
        },
        painHierarchy: {
          type: 'object',
          properties: {
            surfacePain: { type: 'string' },
            businessPain: { type: 'string' },
            financialPain: { type: 'string' },
            personalPain: { type: 'string' },
            connections: { type: 'array', items: { type: 'string' } }
          }
        },
        emotionalComponents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              emotion: { type: 'string' },
              trigger: { type: 'string' },
              intensity: { type: 'string' }
            }
          }
        },
        affectedParties: { type: 'array', items: { type: 'string' } },
        reverseSelling: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'sandler', 'deep-pain']
}));

export const painQuantificationTask = defineTask('pain-quantification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pain Quantification - ${args.accountName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Business value consultant and ROI specialist',
      task: 'Quantify the financial and operational impact of identified pain points',
      context: args,
      instructions: [
        'Calculate direct financial costs of each pain point',
        'Estimate indirect costs (opportunity cost, productivity loss)',
        'Quantify operational inefficiencies',
        'Assess competitive disadvantage costs',
        'Calculate personal costs to key stakeholders',
        'Project costs over time if unaddressed',
        'Create compelling cost summary',
        'Develop pain-to-value bridge'
      ],
      outputFormat: 'JSON with financialImpact, operationalImpact, personalImpact, totalImpact, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['financialImpact', 'totalImpact', 'artifacts'],
      properties: {
        financialImpact: {
          type: 'object',
          properties: {
            directCosts: { type: 'string' },
            indirectCosts: { type: 'string' },
            opportunityCost: { type: 'string' },
            annualImpact: { type: 'string' }
          }
        },
        operationalImpact: {
          type: 'object',
          properties: {
            productivityLoss: { type: 'string' },
            inefficiencyMetrics: { type: 'array', items: { type: 'string' } },
            qualityImpact: { type: 'string' }
          }
        },
        personalImpact: {
          type: 'object',
          properties: {
            stressLevel: { type: 'string' },
            careerRisk: { type: 'string' },
            workLifeBalance: { type: 'string' }
          }
        },
        totalImpact: { type: 'string' },
        projectedCosts: {
          type: 'object',
          properties: {
            year1: { type: 'string' },
            year3: { type: 'string' },
            year5: { type: 'string' }
          }
        },
        painToValueBridge: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'sandler', 'pain-quantification']
}));

export const budgetUncoveringTask = defineTask('budget-uncovering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Budget Uncovering - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Enterprise sales strategist specializing in budget discussions',
      task: 'Uncover budget parameters and investment capacity using Sandler techniques',
      context: args,
      instructions: [
        'Develop questions to uncover budget without direct asking',
        'Understand budget authority and approval process',
        'Identify budget sources and flexibility',
        'Assess willingness to invest based on pain severity',
        'Explore budget reallocation possibilities',
        'Understand fiscal year and budget timing',
        'Assess budget fit with quantified pain',
        'Prepare for budget objection handling'
      ],
      outputFormat: 'JSON with budgetInsights, budgetQuestions, budgetFit, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['budgetInsights', 'budgetFit', 'artifacts'],
      properties: {
        budgetInsights: {
          type: 'object',
          properties: {
            estimatedBudget: { type: 'string' },
            budgetSource: { type: 'string' },
            budgetAuthority: { type: 'string' },
            fiscalTiming: { type: 'string' },
            flexibility: { type: 'string' }
          }
        },
        budgetQuestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              purpose: { type: 'string' },
              timing: { type: 'string' }
            }
          }
        },
        budgetFit: {
          type: 'object',
          properties: {
            alignment: { type: 'string', enum: ['strong', 'moderate', 'weak', 'unknown'] },
            gaps: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        },
        objectionHandling: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'sandler', 'budget']
}));

export const decisionExplorationTask = defineTask('decision-exploration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Decision Process Exploration - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Sandler methodology expert on decision process uncovering',
      task: 'Explore and map the customer decision-making process',
      context: args,
      instructions: [
        'Identify all decision makers and influencers',
        'Understand the formal and informal decision process',
        'Map the approval workflow',
        'Identify potential blockers and accelerators',
        'Understand previous purchase decisions',
        'Assess decision timeline and urgency',
        'Identify decision criteria (stated and unstated)',
        'Prepare questions to validate decision process'
      ],
      outputFormat: 'JSON with decisionMakers, decisionProcess, timeline, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['decisionMakers', 'decisionProcess', 'artifacts'],
      properties: {
        decisionMakers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              influence: { type: 'string', enum: ['decision-maker', 'influencer', 'blocker', 'champion'] },
              engagement: { type: 'string' }
            }
          }
        },
        decisionProcess: {
          type: 'object',
          properties: {
            steps: { type: 'array', items: { type: 'string' } },
            formalProcess: { type: 'string' },
            informalDynamics: { type: 'string' }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            expectedDuration: { type: 'string' },
            keyMilestones: { type: 'array', items: { type: 'string' } },
            urgencyLevel: { type: 'string' }
          }
        },
        risks: { type: 'array', items: { type: 'string' } },
        validationQuestions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'sandler', 'decision-process']
}));

export const upfrontContractTask = defineTask('upfront-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: `Upfront Contract Preparation - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Sandler methodology trainer specializing in upfront contracts',
      task: 'Prepare upfront contract for next meeting based on discovery findings',
      context: args,
      instructions: [
        'Summarize key pain points discovered',
        'Outline budget and decision process understanding',
        'Create clear agenda for next meeting',
        'Define mutual expectations and outcomes',
        'Establish time boundaries',
        'Define what happens if fit/no-fit',
        'Prepare the upfront contract language',
        'Create next steps with clear ownership'
      ],
      outputFormat: 'JSON with contract object, nextSteps array, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['contract', 'nextSteps', 'artifacts'],
      properties: {
        contract: {
          type: 'object',
          properties: {
            purpose: { type: 'string' },
            time: { type: 'string' },
            prospectAgenda: { type: 'array', items: { type: 'string' } },
            sellerAgenda: { type: 'array', items: { type: 'string' } },
            outcome: { type: 'string' },
            noFitAgreement: { type: 'string' }
          }
        },
        contractLanguage: { type: 'string' },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              owner: { type: 'string' },
              timing: { type: 'string' },
              deliverable: { type: 'string' }
            }
          }
        },
        qualificationSummary: {
          type: 'object',
          properties: {
            painConfirmed: { type: 'boolean' },
            budgetDiscussed: { type: 'boolean' },
            decisionProcessMapped: { type: 'boolean' },
            nextMeetingScheduled: { type: 'boolean' }
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
  labels: ['agent', 'sales', 'sandler', 'upfront-contract']
}));
