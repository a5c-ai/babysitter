/**
 * @process specializations/domains/business/decision-intelligence/structured-decision-making
 * @description Structured Decision Making Process - Application of formal decision analysis methodology including
 * problem framing, objectives definition, alternatives generation, and consequence modeling.
 * @inputs { projectName: string, decisionContext: object, stakeholders: array, constraints?: object, timeframe?: string }
 * @outputs { success: boolean, decisionFramework: object, alternatives: array, consequenceModel: object, recommendation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/structured-decision-making', {
 *   projectName: 'Market Entry Decision',
 *   decisionContext: { type: 'strategic', domain: 'expansion', urgency: 'high' },
 *   stakeholders: ['CEO', 'CFO', 'VP Strategy'],
 *   timeframe: '60 days'
 * });
 *
 * @references
 * - Smart Choices: https://hbr.org/product/smart-choices-a-practical-guide-to-making-better-decisions/8244-HBK-ENG
 * - Decision Analysis Society: https://www.informs.org/Community/DAS
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    decisionContext = {},
    stakeholders = [],
    constraints = {},
    timeframe = '30 days',
    outputDir = 'decision-making-output'
  } = inputs;

  // Phase 1: Problem Framing
  const problemFraming = await ctx.task(problemFramingTask, {
    projectName,
    decisionContext,
    stakeholders
  });

  // Phase 2: Objectives Definition
  const objectivesDefinition = await ctx.task(objectivesDefinitionTask, {
    projectName,
    problemFraming,
    stakeholders
  });

  // Phase 3: Alternatives Generation
  const alternativesGeneration = await ctx.task(alternativesGenerationTask, {
    projectName,
    problemFraming,
    objectivesDefinition,
    constraints
  });

  // Phase 4: Consequence Modeling
  const consequenceModeling = await ctx.task(consequenceModelingTask, {
    projectName,
    alternativesGeneration,
    objectivesDefinition
  });

  // Breakpoint: Review decision framework
  await ctx.breakpoint({
    question: `Review decision framework for ${projectName}. Are all alternatives properly evaluated?`,
    title: 'Decision Framework Review',
    context: {
      runId: ctx.runId,
      projectName,
      alternativeCount: alternativesGeneration.alternatives?.length || 0,
      objectiveCount: objectivesDefinition.objectives?.length || 0
    }
  });

  // Phase 5: Trade-off Analysis
  const tradeoffAnalysis = await ctx.task(tradeoffAnalysisTask, {
    projectName,
    consequenceModeling,
    objectivesDefinition
  });

  // Phase 6: Uncertainty Analysis
  const uncertaintyAnalysis = await ctx.task(uncertaintyAnalysisTask, {
    projectName,
    consequenceModeling,
    alternativesGeneration
  });

  // Phase 7: Recommendation Development
  const recommendation = await ctx.task(recommendationTask, {
    projectName,
    consequenceModeling,
    tradeoffAnalysis,
    uncertaintyAnalysis,
    objectivesDefinition
  });

  // Phase 8: Decision Documentation
  const decisionDocumentation = await ctx.task(decisionDocumentationTask, {
    projectName,
    problemFraming,
    objectivesDefinition,
    alternativesGeneration,
    consequenceModeling,
    recommendation,
    stakeholders
  });

  return {
    success: true,
    projectName,
    decisionFramework: {
      problemFraming,
      objectives: objectivesDefinition,
      alternatives: alternativesGeneration
    },
    alternatives: alternativesGeneration.alternatives,
    consequenceModel: consequenceModeling,
    tradeoffAnalysis,
    uncertaintyAnalysis,
    recommendation,
    documentation: decisionDocumentation,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/structured-decision-making',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const problemFramingTask = defineTask('problem-framing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Problem Framing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Analysis Facilitator',
      task: 'Frame the decision problem clearly and comprehensively',
      context: args,
      instructions: [
        '1. Define the decision to be made',
        '2. Identify decision triggers and urgency',
        '3. Clarify decision scope and boundaries',
        '4. Identify key decision makers and stakeholders',
        '5. Define success criteria',
        '6. Identify constraints and limitations',
        '7. Frame the decision question clearly',
        '8. Document assumptions and context'
      ],
      outputFormat: 'JSON object with problem framing'
    },
    outputSchema: {
      type: 'object',
      required: ['decisionStatement', 'scope', 'stakeholders'],
      properties: {
        decisionStatement: { type: 'string' },
        triggers: { type: 'array' },
        scope: { type: 'object' },
        stakeholders: { type: 'array' },
        constraints: { type: 'array' },
        assumptions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'decision-making', 'framing']
}));

export const objectivesDefinitionTask = defineTask('objectives-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Objectives Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Objectives Analyst',
      task: 'Define clear decision objectives and criteria',
      context: args,
      instructions: [
        '1. Identify fundamental objectives',
        '2. Create objectives hierarchy',
        '3. Define means objectives',
        '4. Establish evaluation criteria',
        '5. Define measurement scales',
        '6. Assign relative weights',
        '7. Identify conflicting objectives',
        '8. Validate with stakeholders'
      ],
      outputFormat: 'JSON object with objectives definition'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'criteria', 'weights'],
      properties: {
        objectives: { type: 'array' },
        hierarchy: { type: 'object' },
        criteria: { type: 'array' },
        scales: { type: 'object' },
        weights: { type: 'object' },
        conflicts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'decision-making', 'objectives']
}));

export const alternativesGenerationTask = defineTask('alternatives-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Alternatives Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Creative Alternatives Designer',
      task: 'Generate creative and diverse alternatives',
      context: args,
      instructions: [
        '1. Generate obvious alternatives',
        '2. Create creative alternatives',
        '3. Explore hybrid options',
        '4. Consider do-nothing baseline',
        '5. Identify phased or staged options',
        '6. Screen for feasibility',
        '7. Ensure alternatives are distinct',
        '8. Document alternative characteristics'
      ],
      outputFormat: 'JSON object with alternatives'
    },
    outputSchema: {
      type: 'object',
      required: ['alternatives', 'screening', 'characteristics'],
      properties: {
        alternatives: { type: 'array' },
        creative: { type: 'array' },
        hybrids: { type: 'array' },
        screening: { type: 'object' },
        characteristics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'decision-making', 'alternatives']
}));

export const consequenceModelingTask = defineTask('consequence-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Consequence Modeling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Consequence Analyst',
      task: 'Model consequences of each alternative',
      context: args,
      instructions: [
        '1. Evaluate each alternative against criteria',
        '2. Estimate outcomes for each objective',
        '3. Model uncertainty ranges',
        '4. Identify dependencies and interactions',
        '5. Create consequence table',
        '6. Model time-based consequences',
        '7. Identify irreversible consequences',
        '8. Document confidence levels'
      ],
      outputFormat: 'JSON object with consequence modeling'
    },
    outputSchema: {
      type: 'object',
      required: ['consequenceTable', 'outcomes', 'uncertainty'],
      properties: {
        consequenceTable: { type: 'object' },
        outcomes: { type: 'object' },
        uncertainty: { type: 'object' },
        dependencies: { type: 'array' },
        confidence: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'decision-making', 'consequences']
}));

export const tradeoffAnalysisTask = defineTask('tradeoff-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trade-off Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Trade-off Analyst',
      task: 'Analyze trade-offs between alternatives',
      context: args,
      instructions: [
        '1. Identify dominated alternatives',
        '2. Calculate weighted scores',
        '3. Analyze objective trade-offs',
        '4. Create trade-off curves',
        '5. Identify value of flexibility',
        '6. Assess reversibility value',
        '7. Calculate marginal trade-offs',
        '8. Identify efficient frontier'
      ],
      outputFormat: 'JSON object with trade-off analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'tradeoffs', 'frontier'],
      properties: {
        dominatedAlternatives: { type: 'array' },
        scores: { type: 'object' },
        tradeoffs: { type: 'array' },
        curves: { type: 'array' },
        frontier: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'decision-making', 'tradeoffs']
}));

export const uncertaintyAnalysisTask = defineTask('uncertainty-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Uncertainty Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Uncertainty Analyst',
      task: 'Analyze decision uncertainty and risk',
      context: args,
      instructions: [
        '1. Identify key uncertainties',
        '2. Assess probability distributions',
        '3. Conduct sensitivity analysis',
        '4. Identify robust alternatives',
        '5. Calculate value of information',
        '6. Model scenario outcomes',
        '7. Assess downside risks',
        '8. Identify risk mitigation options'
      ],
      outputFormat: 'JSON object with uncertainty analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['uncertainties', 'sensitivity', 'robustness'],
      properties: {
        uncertainties: { type: 'array' },
        distributions: { type: 'object' },
        sensitivity: { type: 'object' },
        robustness: { type: 'object' },
        valueOfInformation: { type: 'object' },
        riskMitigation: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'decision-making', 'uncertainty']
}));

export const recommendationTask = defineTask('recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Recommendation Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Recommendation Analyst',
      task: 'Develop final recommendation with rationale',
      context: args,
      instructions: [
        '1. Synthesize analysis findings',
        '2. Identify preferred alternative',
        '3. Develop recommendation rationale',
        '4. Address key concerns and risks',
        '5. Define implementation prerequisites',
        '6. Identify decision reversibility',
        '7. Define monitoring triggers',
        '8. Create executive summary'
      ],
      outputFormat: 'JSON object with recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['preferredAlternative', 'rationale', 'implementation'],
      properties: {
        preferredAlternative: { type: 'string' },
        rationale: { type: 'string' },
        concerns: { type: 'array' },
        prerequisites: { type: 'array' },
        implementation: { type: 'object' },
        monitoring: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'decision-making', 'recommendation']
}));

export const decisionDocumentationTask = defineTask('decision-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Decision Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Documentation Specialist',
      task: 'Create comprehensive decision documentation',
      context: args,
      instructions: [
        '1. Document decision context and background',
        '2. Record objectives and criteria',
        '3. Document alternatives considered',
        '4. Record consequence analysis',
        '5. Document recommendation and rationale',
        '6. Record dissenting views',
        '7. Define review triggers',
        '8. Create decision record for learning'
      ],
      outputFormat: 'JSON object with decision documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'record', 'review'],
      properties: {
        document: { type: 'object' },
        context: { type: 'string' },
        analysis: { type: 'object' },
        recommendation: { type: 'object' },
        dissentingViews: { type: 'array' },
        record: { type: 'object' },
        review: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'decision-making', 'documentation']
}));
