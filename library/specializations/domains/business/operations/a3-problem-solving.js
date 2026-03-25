/**
 * @process specializations/domains/business/operations/a3-problem-solving
 * @description A3 Problem Solving process for structured problem analysis and resolution.
 *              Uses the A3 paper format to guide PDCA thinking through background, current
 *              condition, goal, root cause analysis, countermeasures, and follow-up.
 * @inputs {
 *   problemContext: { problemStatement: string, businessImpact: object, urgency: string },
 *   currentState: { metrics: object, processDescription: string, symptoms: string[] },
 *   stakeholders: { owner: object, team: object[], sponsor: object },
 *   constraints: { timeline: string, budget: number, resources: object },
 *   documentationRequirements: { format: string, audience: string[], approvalProcess: object }
 * }
 * @outputs {
 *   a3Document: { background: object, currentCondition: object, goal: object, rootCauseAnalysis: object, countermeasures: object[], implementation: object, followUp: object },
 *   implementationPlan: { actions: object[], timeline: object, resources: object },
 *   results: { metricsAchieved: object, lessonsLearned: string[], standardization: object },
 *   processMetrics: { cycleTime: number, effectivenessScore: number, sustainabilityScore: number }
 * }
 * @example
 * // Input
 * {
 *   problemContext: { problemStatement: "Delivery-lead-time-exceeds-target-by-3-days", businessImpact: {...}, urgency: "high" },
 *   currentState: { metrics: {...}, processDescription: "...", symptoms: [...] },
 *   stakeholders: { owner: {...}, team: [...], sponsor: {...} },
 *   constraints: { timeline: "30-days", budget: 10000, resources: {...} },
 *   documentationRequirements: { format: "standard-A3", audience: [...], approvalProcess: {...} }
 * }
 * @references Toyota A3 Process, Lean Problem Solving, Managing to Learn
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { problemContext, currentState, stakeholders, constraints, documentationRequirements } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  // Phase 1: Problem Clarification and Scoping
  const problemClarification = await ctx.task(clarifyProblem, {
    problemContext,
    currentState
  });
  artifacts.push({ phase: 'problem-clarification', output: problemClarification });

  // Phase 2: Background Development
  const background = await ctx.task(developBackground, {
    problemClarification,
    problemContext,
    stakeholders
  });
  artifacts.push({ phase: 'background', output: background });

  // Phase 3: Current Condition Analysis
  const currentCondition = await ctx.task(analyzeCurrentCondition, {
    currentState,
    problemClarification
  });
  artifacts.push({ phase: 'current-condition', output: currentCondition });

  // Phase 4: Goal Setting
  const goalSetting = await ctx.task(setGoals, {
    currentCondition,
    problemContext,
    constraints
  });
  artifacts.push({ phase: 'goal-setting', output: goalSetting });

  // Quality Gate: Problem Definition Review
  await ctx.breakpoint('problem-definition-review', {
    title: 'A3 Problem Definition Review',
    description: 'Review background, current condition, and goals before root cause analysis',
    artifacts: [background, currentCondition, goalSetting]
  });

  // Phase 5: Root Cause Analysis
  const rootCauseAnalysis = await ctx.task(analyzeRootCauses, {
    currentCondition,
    goalSetting,
    problemClarification
  });
  artifacts.push({ phase: 'root-cause-analysis', output: rootCauseAnalysis });

  // Phase 6: Countermeasure Development
  const countermeasures = await ctx.task(developCountermeasures, {
    rootCauseAnalysis,
    constraints,
    goalSetting
  });
  artifacts.push({ phase: 'countermeasures', output: countermeasures });

  // Phase 7: Countermeasure Evaluation
  const countermeasureEvaluation = await ctx.task(evaluateCountermeasures, {
    countermeasures,
    constraints,
    rootCauseAnalysis
  });
  artifacts.push({ phase: 'countermeasure-evaluation', output: countermeasureEvaluation });

  // Quality Gate: Countermeasure Approval
  await ctx.breakpoint('countermeasure-approval', {
    title: 'A3 Countermeasure Approval',
    description: 'Review and approve proposed countermeasures before implementation',
    artifacts: [rootCauseAnalysis, countermeasures, countermeasureEvaluation]
  });

  // Phase 8: Implementation Planning
  const implementationPlan = await ctx.task(planImplementation, {
    countermeasureEvaluation,
    constraints,
    stakeholders
  });
  artifacts.push({ phase: 'implementation-plan', output: implementationPlan });

  // Phase 9: Implementation Execution
  const implementationExecution = await ctx.task(executeImplementation, {
    implementationPlan,
    stakeholders
  });
  artifacts.push({ phase: 'implementation-execution', output: implementationExecution });

  // Phase 10: Results Verification
  const resultsVerification = await ctx.task(verifyResults, {
    implementationExecution,
    goalSetting,
    currentCondition
  });
  artifacts.push({ phase: 'results-verification', output: resultsVerification });

  // Phase 11: Follow-Up Actions
  const followUpActions = await ctx.task(defineFollowUp, {
    resultsVerification,
    goalSetting,
    implementationExecution
  });
  artifacts.push({ phase: 'follow-up-actions', output: followUpActions });

  // Phase 12: A3 Document Finalization
  const a3Document = await ctx.task(finalizeA3Document, {
    background,
    currentCondition,
    goalSetting,
    rootCauseAnalysis,
    countermeasures: countermeasureEvaluation,
    implementationPlan,
    resultsVerification,
    followUpActions,
    documentationRequirements
  });
  artifacts.push({ phase: 'a3-document', output: a3Document });

  // Phase 13: Lessons Learned and Standardization
  const standardization = await ctx.task(standardizeLearnings, {
    a3Document,
    resultsVerification,
    rootCauseAnalysis
  });
  artifacts.push({ phase: 'standardization', output: standardization });

  // Final Quality Gate: A3 Closeout
  await ctx.breakpoint('a3-closeout', {
    title: 'A3 Problem Solving Closeout',
    description: 'Final review and approval of A3 document and standardization',
    artifacts: [a3Document, resultsVerification, standardization]
  });

  return {
    success: true,
    a3Document: {
      background,
      currentCondition,
      goal: goalSetting,
      rootCauseAnalysis,
      countermeasures: countermeasureEvaluation.selectedCountermeasures,
      implementation: implementationPlan,
      followUp: followUpActions
    },
    implementationPlan,
    results: {
      metricsAchieved: resultsVerification.metricsAchieved,
      lessonsLearned: standardization.lessonsLearned,
      standardization: standardization.standardWork
    },
    processMetrics: {
      cycleTime: (ctx.now() - startTime),
      effectivenessScore: resultsVerification.effectivenessScore,
      sustainabilityScore: followUpActions.sustainabilityScore
    },
    artifacts,
    metadata: {
      processId: 'a3-problem-solving',
      startTime,
      endTime: ctx.now(),
      problemContext,
      stakeholders
    }
  };
}

export const clarifyProblem = defineTask('clarify-problem', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Clarify Problem',
  agent: {
    name: 'problem-clarifier',
    prompt: {
      role: 'A3 problem solving facilitator',
      task: 'Clarify and scope the problem for A3 analysis',
      context: {
        problemContext: args.problemContext,
        currentState: args.currentState
      },
      instructions: [
        'Refine problem statement to be specific and measurable',
        'Define problem boundaries and scope',
        'Identify what is and is not included',
        'Clarify business impact quantitatively',
        'Validate problem urgency and priority',
        'Document initial problem understanding'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        refinedProblemStatement: { type: 'string' },
        problemScope: { type: 'object' },
        boundaries: { type: 'object' },
        quantifiedImpact: { type: 'object' },
        urgencyValidation: { type: 'object' },
        initialUnderstanding: { type: 'string' }
      },
      required: ['refinedProblemStatement', 'problemScope', 'quantifiedImpact']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'problem', 'clarification']
}));

export const developBackground = defineTask('develop-background', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Background',
  agent: {
    name: 'background-developer',
    prompt: {
      role: 'A3 background section specialist',
      task: 'Develop the background section of the A3',
      context: {
        problemClarification: args.problemClarification,
        problemContext: args.problemContext,
        stakeholders: args.stakeholders
      },
      instructions: [
        'Explain why this problem matters',
        'Provide business context and strategic alignment',
        'Describe the history and timeline',
        'Identify key stakeholders and their interests',
        'Document previous attempts to solve',
        'Create compelling case for action'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        businessRationale: { type: 'string' },
        strategicAlignment: { type: 'object' },
        problemHistory: { type: 'object' },
        stakeholderAnalysis: { type: 'object' },
        previousAttempts: { type: 'array' },
        caseForAction: { type: 'string' }
      },
      required: ['businessRationale', 'strategicAlignment', 'caseForAction']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'background', 'context']
}));

export const analyzeCurrentCondition = defineTask('analyze-current-condition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Current Condition',
  agent: {
    name: 'current-condition-analyst',
    prompt: {
      role: 'Current state analysis specialist',
      task: 'Analyze and document the current condition',
      context: {
        currentState: args.currentState,
        problemClarification: args.problemClarification
      },
      instructions: [
        'Document current process with visual representation',
        'Gather and present current metrics data',
        'Identify performance gaps visually',
        'Show problem occurrence patterns',
        'Use charts and graphs to illustrate',
        'Make the gap self-evident'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        processMap: { type: 'object' },
        currentMetrics: { type: 'object' },
        performanceGap: { type: 'object' },
        patternAnalysis: { type: 'object' },
        visualizations: { type: 'array' },
        gapSummary: { type: 'string' }
      },
      required: ['processMap', 'currentMetrics', 'performanceGap']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'current-condition', 'analysis']
}));

export const setGoals = defineTask('set-goals', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set Goals',
  agent: {
    name: 'goal-setter',
    prompt: {
      role: 'A3 goal setting specialist',
      task: 'Set SMART goals for the A3',
      context: {
        currentCondition: args.currentCondition,
        problemContext: args.problemContext,
        constraints: args.constraints
      },
      instructions: [
        'Define specific target metrics',
        'Set measurable success criteria',
        'Ensure goals are achievable within constraints',
        'Align goals with business priorities',
        'Set time-bound targets',
        'Document goal rationale'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        targetMetrics: { type: 'object' },
        successCriteria: { type: 'array' },
        achievabilityAssessment: { type: 'object' },
        businessAlignment: { type: 'object' },
        timeline: { type: 'object' },
        goalRationale: { type: 'string' }
      },
      required: ['targetMetrics', 'successCriteria', 'timeline']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'goals', 'setting']
}));

export const analyzeRootCauses = defineTask('analyze-root-causes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Root Causes',
  agent: {
    name: 'root-cause-analyst',
    prompt: {
      role: 'Root cause analysis specialist',
      task: 'Conduct thorough root cause analysis',
      context: {
        currentCondition: args.currentCondition,
        goalSetting: args.goalSetting,
        problemClarification: args.problemClarification
      },
      instructions: [
        'Apply 5 Whys analysis',
        'Create fishbone/Ishikawa diagram',
        'Identify contributing factors',
        'Distinguish root causes from symptoms',
        'Validate root causes with data',
        'Prioritize root causes by impact'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        fiveWhysAnalysis: { type: 'array' },
        fishboneDiagram: { type: 'object' },
        contributingFactors: { type: 'array' },
        rootCauses: { type: 'array' },
        dataValidation: { type: 'object' },
        prioritizedCauses: { type: 'array' }
      },
      required: ['fiveWhysAnalysis', 'rootCauses', 'prioritizedCauses']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'root-cause', 'analysis']
}));

export const developCountermeasures = defineTask('develop-countermeasures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Countermeasures',
  agent: {
    name: 'countermeasure-developer',
    prompt: {
      role: 'Countermeasure development specialist',
      task: 'Develop countermeasures addressing root causes',
      context: {
        rootCauseAnalysis: args.rootCauseAnalysis,
        constraints: args.constraints,
        goalSetting: args.goalSetting
      },
      instructions: [
        'Generate countermeasure options for each root cause',
        'Consider both immediate and long-term solutions',
        'Identify required resources',
        'Assess implementation complexity',
        'Consider potential side effects',
        'Document countermeasure rationale'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        countermeasureOptions: { type: 'array' },
        immediateActions: { type: 'array' },
        longTermSolutions: { type: 'array' },
        resourceRequirements: { type: 'object' },
        implementationComplexity: { type: 'object' },
        sideEffects: { type: 'array' },
        rationale: { type: 'object' }
      },
      required: ['countermeasureOptions', 'resourceRequirements', 'rationale']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'countermeasures', 'development']
}));

export const evaluateCountermeasures = defineTask('evaluate-countermeasures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate Countermeasures',
  agent: {
    name: 'countermeasure-evaluator',
    prompt: {
      role: 'Countermeasure evaluation specialist',
      task: 'Evaluate and select countermeasures',
      context: {
        countermeasures: args.countermeasures,
        constraints: args.constraints,
        rootCauseAnalysis: args.rootCauseAnalysis
      },
      instructions: [
        'Evaluate countermeasures against criteria',
        'Assess effectiveness probability',
        'Evaluate cost-benefit',
        'Consider implementation risk',
        'Select optimal countermeasure set',
        'Document selection rationale'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        evaluationMatrix: { type: 'object' },
        effectivenessProbability: { type: 'object' },
        costBenefitAnalysis: { type: 'object' },
        riskAssessment: { type: 'object' },
        selectedCountermeasures: { type: 'array' },
        selectionRationale: { type: 'string' }
      },
      required: ['evaluationMatrix', 'selectedCountermeasures', 'selectionRationale']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'countermeasures', 'evaluation']
}));

export const planImplementation = defineTask('plan-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Implementation',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'Implementation planning specialist',
      task: 'Create detailed implementation plan',
      context: {
        countermeasureEvaluation: args.countermeasureEvaluation,
        constraints: args.constraints,
        stakeholders: args.stakeholders
      },
      instructions: [
        'Create detailed action items',
        'Assign responsibilities (who, what, when)',
        'Define resource requirements',
        'Establish milestones and checkpoints',
        'Identify dependencies',
        'Create visual timeline'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        actions: { type: 'array' },
        assignments: { type: 'object' },
        resourcePlan: { type: 'object' },
        milestones: { type: 'array' },
        dependencies: { type: 'array' },
        timeline: { type: 'object' }
      },
      required: ['actions', 'assignments', 'milestones', 'timeline']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'implementation', 'planning']
}));

export const executeImplementation = defineTask('execute-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute Implementation',
  agent: {
    name: 'implementation-executor',
    prompt: {
      role: 'Implementation execution coordinator',
      task: 'Coordinate and track implementation execution',
      context: {
        implementationPlan: args.implementationPlan,
        stakeholders: args.stakeholders
      },
      instructions: [
        'Track action item completion',
        'Monitor milestone achievement',
        'Identify and resolve obstacles',
        'Document implementation progress',
        'Adjust plan as needed',
        'Report on execution status'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        completionStatus: { type: 'object' },
        milestoneStatus: { type: 'object' },
        obstaclesResolved: { type: 'array' },
        progressDocumentation: { type: 'object' },
        planAdjustments: { type: 'array' },
        executionSummary: { type: 'string' }
      },
      required: ['completionStatus', 'milestoneStatus', 'executionSummary']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'implementation', 'execution']
}));

export const verifyResults = defineTask('verify-results', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify Results',
  agent: {
    name: 'results-verifier',
    prompt: {
      role: 'Results verification specialist',
      task: 'Verify results against goals',
      context: {
        implementationExecution: args.implementationExecution,
        goalSetting: args.goalSetting,
        currentCondition: args.currentCondition
      },
      instructions: [
        'Measure results against targets',
        'Compare before and after metrics',
        'Validate countermeasure effectiveness',
        'Assess goal achievement percentage',
        'Identify any remaining gaps',
        'Calculate effectiveness score'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        metricsAchieved: { type: 'object' },
        beforeAfterComparison: { type: 'object' },
        countermeasureEffectiveness: { type: 'object' },
        goalAchievementPercent: { type: 'number' },
        remainingGaps: { type: 'array' },
        effectivenessScore: { type: 'number' }
      },
      required: ['metricsAchieved', 'beforeAfterComparison', 'effectivenessScore']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'results', 'verification']
}));

export const defineFollowUp = defineTask('define-follow-up', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Follow-Up Actions',
  agent: {
    name: 'follow-up-planner',
    prompt: {
      role: 'A3 follow-up planning specialist',
      task: 'Define follow-up actions to sustain results',
      context: {
        resultsVerification: args.resultsVerification,
        goalSetting: args.goalSetting,
        implementationExecution: args.implementationExecution
      },
      instructions: [
        'Define monitoring plan for sustainability',
        'Identify remaining actions needed',
        'Plan for unresolved issues',
        'Establish review schedule',
        'Create escalation triggers',
        'Assess sustainability score'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        monitoringPlan: { type: 'object' },
        remainingActions: { type: 'array' },
        unresolvedIssues: { type: 'array' },
        reviewSchedule: { type: 'object' },
        escalationTriggers: { type: 'array' },
        sustainabilityScore: { type: 'number' }
      },
      required: ['monitoringPlan', 'reviewSchedule', 'sustainabilityScore']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'follow-up', 'planning']
}));

export const finalizeA3Document = defineTask('finalize-a3-document', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Finalize A3 Document',
  agent: {
    name: 'a3-document-finalizer',
    prompt: {
      role: 'A3 document finalization specialist',
      task: 'Compile and finalize the A3 document',
      context: {
        background: args.background,
        currentCondition: args.currentCondition,
        goalSetting: args.goalSetting,
        rootCauseAnalysis: args.rootCauseAnalysis,
        countermeasures: args.countermeasures,
        implementationPlan: args.implementationPlan,
        resultsVerification: args.resultsVerification,
        followUpActions: args.followUpActions,
        documentationRequirements: args.documentationRequirements
      },
      instructions: [
        'Compile all sections into A3 format',
        'Ensure visual clarity and readability',
        'Validate logical flow and story',
        'Check format compliance',
        'Add appropriate visuals',
        'Prepare for review and approval'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        a3Content: { type: 'object' },
        visualElements: { type: 'array' },
        logicalFlowValidation: { type: 'object' },
        formatCompliance: { type: 'object' },
        finalDocument: { type: 'object' },
        approvalStatus: { type: 'string' }
      },
      required: ['a3Content', 'finalDocument', 'approvalStatus']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'a3', 'document']
}));

export const standardizeLearnings = defineTask('standardize-learnings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Standardize Learnings',
  agent: {
    name: 'standardization-specialist',
    prompt: {
      role: 'Process standardization specialist',
      task: 'Capture and standardize learnings from A3',
      context: {
        a3Document: args.a3Document,
        resultsVerification: args.resultsVerification,
        rootCauseAnalysis: args.rootCauseAnalysis
      },
      instructions: [
        'Document lessons learned',
        'Identify reusable countermeasures',
        'Create standard work updates',
        'Update process documentation',
        'Share learnings across organization',
        'Create knowledge base entry'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        lessonsLearned: { type: 'array' },
        reusableCountermeasures: { type: 'array' },
        standardWork: { type: 'object' },
        processUpdates: { type: 'array' },
        sharingPlan: { type: 'object' },
        knowledgeBaseEntry: { type: 'object' }
      },
      required: ['lessonsLearned', 'standardWork', 'knowledgeBaseEntry']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'standardization', 'learnings']
}));
