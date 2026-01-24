/**
 * @process specializations/domains/business/decision-intelligence/hypothesis-driven-analytics
 * @description Hypothesis-Driven Analytics Process - Structured methodology for forming, testing, and validating
 * business hypotheses using data analysis and experimentation.
 * @inputs { projectName: string, businessQuestion: string, dataContext: object, stakeholders?: array, constraints?: object }
 * @outputs { success: boolean, hypotheses: array, analysisResults: object, validatedFindings: array, recommendations: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/hypothesis-driven-analytics', {
 *   projectName: 'Customer Churn Root Cause Analysis',
 *   businessQuestion: 'Why is customer churn increasing in Q4?',
 *   dataContext: { sources: ['CRM', 'Usage Analytics', 'Support Tickets'] }
 * });
 *
 * @references
 * - Data Science for Business: https://www.oreilly.com/library/view/data-science-for/9781449374273/
 * - Hypothesis-Driven Development
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    businessQuestion,
    dataContext = {},
    stakeholders = [],
    constraints = {},
    outputDir = 'hypothesis-analytics-output'
  } = inputs;

  // Phase 1: Problem Definition
  const problemDefinition = await ctx.task(problemDefinitionTask, {
    projectName,
    businessQuestion,
    stakeholders
  });

  // Phase 2: Hypothesis Generation
  const hypothesisGeneration = await ctx.task(hypothesisGenerationTask, {
    projectName,
    problemDefinition,
    dataContext
  });

  // Phase 3: Hypothesis Prioritization
  const hypothesisPrioritization = await ctx.task(hypothesisPrioritizationTask, {
    projectName,
    hypothesisGeneration,
    dataContext,
    constraints
  });

  // Phase 4: Analysis Planning
  const analysisPlanning = await ctx.task(analysisPlanningTask, {
    projectName,
    hypothesisPrioritization,
    dataContext
  });

  // Phase 5: Data Analysis Execution
  const analysisExecution = await ctx.task(analysisExecutionTask, {
    projectName,
    analysisPlanning,
    hypothesisPrioritization
  });

  // Breakpoint: Review analysis results
  await ctx.breakpoint({
    question: `Review hypothesis testing results for ${projectName}. Are findings statistically significant?`,
    title: 'Analysis Results Review',
    context: {
      runId: ctx.runId,
      projectName,
      hypothesesTested: hypothesisPrioritization.prioritized?.length || 0
    }
  });

  // Phase 6: Hypothesis Validation
  const hypothesisValidation = await ctx.task(hypothesisValidationTask, {
    projectName,
    analysisExecution,
    hypothesisPrioritization
  });

  // Phase 7: Insights Synthesis
  const insightsSynthesis = await ctx.task(hypothesisInsightsTask, {
    projectName,
    hypothesisValidation,
    analysisExecution,
    problemDefinition
  });

  // Phase 8: Recommendations
  const recommendations = await ctx.task(hypothesisRecommendationsTask, {
    projectName,
    insightsSynthesis,
    hypothesisValidation,
    stakeholders
  });

  return {
    success: true,
    projectName,
    problemDefinition,
    hypotheses: hypothesisGeneration.hypotheses,
    prioritizedHypotheses: hypothesisPrioritization.prioritized,
    analysisResults: analysisExecution,
    validatedFindings: hypothesisValidation.validated,
    insights: insightsSynthesis,
    recommendations,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/hypothesis-driven-analytics',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const problemDefinitionTask = defineTask('problem-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Problem Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Analytics Consultant',
      task: 'Define business problem for hypothesis-driven analysis',
      context: args,
      instructions: [
        '1. Clarify business question',
        '2. Define success criteria',
        '3. Identify key stakeholders',
        '4. Define decision context',
        '5. Identify constraints and scope',
        '6. Define timeline requirements',
        '7. Establish analytical rigor level',
        '8. Document problem statement'
      ],
      outputFormat: 'JSON object with problem definition'
    },
    outputSchema: {
      type: 'object',
      required: ['problemStatement', 'successCriteria', 'scope'],
      properties: {
        problemStatement: { type: 'string' },
        businessQuestion: { type: 'string' },
        successCriteria: { type: 'array' },
        scope: { type: 'object' },
        constraints: { type: 'array' },
        timeline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'hypothesis', 'definition']
}));

export const hypothesisGenerationTask = defineTask('hypothesis-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hypothesis Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Hypothesis Development Specialist',
      task: 'Generate testable hypotheses',
      context: args,
      instructions: [
        '1. Brainstorm potential causes/explanations',
        '2. Apply issue tree decomposition',
        '3. Formulate null and alternative hypotheses',
        '4. Ensure hypotheses are testable',
        '5. Make hypotheses mutually exclusive',
        '6. Ensure collectively exhaustive coverage',
        '7. Identify required data per hypothesis',
        '8. Document hypothesis rationale'
      ],
      outputFormat: 'JSON object with hypotheses'
    },
    outputSchema: {
      type: 'object',
      required: ['hypotheses', 'issueTree', 'dataRequirements'],
      properties: {
        hypotheses: { type: 'array' },
        issueTree: { type: 'object' },
        nullHypotheses: { type: 'array' },
        dataRequirements: { type: 'object' },
        rationale: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'hypothesis', 'generation']
}));

export const hypothesisPrioritizationTask = defineTask('hypothesis-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hypothesis Prioritization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Hypothesis Prioritization Analyst',
      task: 'Prioritize hypotheses for testing',
      context: args,
      instructions: [
        '1. Assess impact if hypothesis true',
        '2. Evaluate data availability',
        '3. Estimate analysis effort',
        '4. Assess prior probability',
        '5. Calculate expected value of testing',
        '6. Identify quick wins',
        '7. Create testing sequence',
        '8. Document prioritization rationale'
      ],
      outputFormat: 'JSON object with prioritization'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritized', 'scores', 'sequence'],
      properties: {
        prioritized: { type: 'array' },
        scores: { type: 'object' },
        sequence: { type: 'array' },
        quickWins: { type: 'array' },
        rationale: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'hypothesis', 'prioritization']
}));

export const analysisPlanningTask = defineTask('analysis-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analysis Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Analytics Planning Specialist',
      task: 'Plan analysis approach for each hypothesis',
      context: args,
      instructions: [
        '1. Select analysis methods per hypothesis',
        '2. Define data requirements',
        '3. Specify statistical tests',
        '4. Define significance thresholds',
        '5. Plan data preparation steps',
        '6. Identify potential confounders',
        '7. Design validation approach',
        '8. Create analysis timeline'
      ],
      outputFormat: 'JSON object with analysis planning'
    },
    outputSchema: {
      type: 'object',
      required: ['analysisMethods', 'dataRequirements', 'tests'],
      properties: {
        analysisMethods: { type: 'object' },
        dataRequirements: { type: 'object' },
        tests: { type: 'object' },
        thresholds: { type: 'object' },
        confounders: { type: 'array' },
        timeline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'hypothesis', 'planning']
}));

export const analysisExecutionTask = defineTask('analysis-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Analysis Execution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Analyst',
      task: 'Execute hypothesis testing analysis',
      context: args,
      instructions: [
        '1. Prepare and clean data',
        '2. Execute planned analyses',
        '3. Calculate test statistics',
        '4. Determine p-values',
        '5. Calculate confidence intervals',
        '6. Document effect sizes',
        '7. Check for confounders',
        '8. Create analysis artifacts'
      ],
      outputFormat: 'JSON object with analysis execution'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'statistics', 'artifacts'],
      properties: {
        results: { type: 'object' },
        statistics: { type: 'object' },
        pValues: { type: 'object' },
        confidenceIntervals: { type: 'object' },
        effectSizes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'hypothesis', 'execution']
}));

export const hypothesisValidationTask = defineTask('hypothesis-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hypothesis Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Hypothesis Validation Expert',
      task: 'Validate or reject hypotheses based on analysis',
      context: args,
      instructions: [
        '1. Evaluate statistical significance',
        '2. Assess practical significance',
        '3. Check for alternative explanations',
        '4. Validate against business logic',
        '5. Classify hypotheses (supported/rejected/inconclusive)',
        '6. Assess confidence levels',
        '7. Identify follow-up analysis needs',
        '8. Document validation reasoning'
      ],
      outputFormat: 'JSON object with hypothesis validation'
    },
    outputSchema: {
      type: 'object',
      required: ['validated', 'rejected', 'inconclusive'],
      properties: {
        validated: { type: 'array' },
        rejected: { type: 'array' },
        inconclusive: { type: 'array' },
        confidence: { type: 'object' },
        followUp: { type: 'array' },
        reasoning: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'hypothesis', 'validation']
}));

export const hypothesisInsightsTask = defineTask('hypothesis-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: `Insights Synthesis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Insights Synthesis Specialist',
      task: 'Synthesize insights from hypothesis testing',
      context: args,
      instructions: [
        '1. Synthesize validated findings',
        '2. Identify root causes',
        '3. Quantify business impact',
        '4. Identify interconnections',
        '5. Create insight narratives',
        '6. Prioritize findings by impact',
        '7. Identify quick wins vs strategic actions',
        '8. Create insight summary'
      ],
      outputFormat: 'JSON object with insights synthesis'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'rootCauses', 'impact'],
      properties: {
        insights: { type: 'array' },
        rootCauses: { type: 'array' },
        impact: { type: 'object' },
        interconnections: { type: 'array' },
        narratives: { type: 'array' },
        priorities: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'hypothesis', 'insights']
}));

export const hypothesisRecommendationsTask = defineTask('hypothesis-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Recommendations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Analytics Recommendation Specialist',
      task: 'Develop recommendations from hypothesis testing',
      context: args,
      instructions: [
        '1. Translate insights to actions',
        '2. Prioritize recommendations',
        '3. Estimate expected impact',
        '4. Identify implementation requirements',
        '5. Define measurement approach',
        '6. Create action roadmap',
        '7. Identify risks and mitigations',
        '8. Document decision support'
      ],
      outputFormat: 'JSON object with recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'priorities', 'roadmap'],
      properties: {
        recommendations: { type: 'array' },
        priorities: { type: 'array' },
        expectedImpact: { type: 'object' },
        implementation: { type: 'object' },
        measurement: { type: 'object' },
        roadmap: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'hypothesis', 'recommendations']
}));
