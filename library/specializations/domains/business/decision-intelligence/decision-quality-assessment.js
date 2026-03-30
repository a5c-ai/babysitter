/**
 * @process specializations/domains/business/decision-intelligence/decision-quality-assessment
 * @description Decision Quality Assessment - Evaluation of decision quality against the six elements framework:
 * appropriate frame, creative alternatives, meaningful information, clear values, sound reasoning, and commitment to action.
 * @inputs { projectName: string, decisionContext: object, decisionProcess?: object, stakeholders: array }
 * @outputs { success: boolean, qualityAssessment: object, elementScores: object, improvements: array, actionPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/decision-quality-assessment', {
 *   projectName: 'M&A Decision Quality Review',
 *   decisionContext: { type: 'strategic', decision: 'Acquisition of Company X' },
 *   stakeholders: ['CEO', 'CFO', 'Board']
 * });
 *
 * @references
 * - Decision Quality Book: https://www.wiley.com/en-us/Decision+Quality%3A+Value+Creation+from+Better+Business+Decisions-p-9781119144670
 * - Strategic Decisions Group methodology
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    decisionContext = {},
    decisionProcess = {},
    stakeholders = [],
    outputDir = 'dq-assessment-output'
  } = inputs;

  // Phase 1: Decision Context Review
  const contextReview = await ctx.task(contextReviewTask, {
    projectName,
    decisionContext,
    stakeholders
  });

  // Phase 2: Frame Assessment
  const frameAssessment = await ctx.task(frameAssessmentTask, {
    projectName,
    decisionContext,
    contextReview
  });

  // Phase 3: Alternatives Assessment
  const alternativesAssessment = await ctx.task(alternativesAssessmentTask, {
    projectName,
    decisionProcess,
    contextReview
  });

  // Phase 4: Information Assessment
  const informationAssessment = await ctx.task(informationAssessmentTask, {
    projectName,
    decisionProcess,
    contextReview
  });

  // Phase 5: Values Assessment
  const valuesAssessment = await ctx.task(valuesAssessmentTask, {
    projectName,
    decisionProcess,
    stakeholders
  });

  // Phase 6: Reasoning Assessment
  const reasoningAssessment = await ctx.task(reasoningAssessmentTask, {
    projectName,
    decisionProcess,
    contextReview
  });

  // Phase 7: Commitment Assessment
  const commitmentAssessment = await ctx.task(commitmentAssessmentTask, {
    projectName,
    decisionProcess,
    stakeholders
  });

  // Breakpoint: Review quality assessment
  await ctx.breakpoint({
    question: `Review decision quality assessment for ${projectName}. Are there critical quality gaps?`,
    title: 'Decision Quality Review',
    context: {
      runId: ctx.runId,
      projectName,
      overallScore: 'See element scores'
    }
  });

  // Phase 8: Overall Quality Synthesis
  const qualitySynthesis = await ctx.task(qualitySynthesisTask, {
    projectName,
    frameAssessment,
    alternativesAssessment,
    informationAssessment,
    valuesAssessment,
    reasoningAssessment,
    commitmentAssessment
  });

  // Phase 9: Improvement Recommendations
  const improvements = await ctx.task(improvementRecommendationsTask, {
    projectName,
    qualitySynthesis,
    stakeholders
  });

  return {
    success: true,
    projectName,
    contextReview,
    qualityAssessment: {
      frame: frameAssessment,
      alternatives: alternativesAssessment,
      information: informationAssessment,
      values: valuesAssessment,
      reasoning: reasoningAssessment,
      commitment: commitmentAssessment
    },
    elementScores: qualitySynthesis.elementScores,
    overallScore: qualitySynthesis.overallScore,
    improvements: improvements.recommendations,
    actionPlan: improvements.actionPlan,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/decision-quality-assessment',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const contextReviewTask = defineTask('context-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Decision Context Review - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Quality Consultant',
      task: 'Review decision context and process documentation',
      context: args,
      instructions: [
        '1. Review decision background and history',
        '2. Understand decision importance and impact',
        '3. Identify key decision makers and influencers',
        '4. Review timeline and urgency',
        '5. Understand organizational context',
        '6. Identify available documentation',
        '7. Assess process maturity',
        '8. Document review findings'
      ],
      outputFormat: 'JSON object with context review'
    },
    outputSchema: {
      type: 'object',
      required: ['background', 'importance', 'readiness'],
      properties: {
        background: { type: 'object' },
        importance: { type: 'object' },
        stakeholders: { type: 'array' },
        documentation: { type: 'array' },
        readiness: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'decision-quality', 'context']
}));

export const frameAssessmentTask = defineTask('frame-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Frame Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Framing Expert',
      task: 'Assess decision framing quality',
      context: args,
      instructions: [
        '1. Evaluate problem statement clarity',
        '2. Assess scope appropriateness',
        '3. Check for framing biases',
        '4. Evaluate stakeholder alignment on frame',
        '5. Assess boundary completeness',
        '6. Check for narrow framing risks',
        '7. Evaluate opportunity cost consideration',
        '8. Score framing quality 1-100'
      ],
      outputFormat: 'JSON object with frame assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'findings', 'gaps'],
      properties: {
        score: { type: 'number' },
        problemStatement: { type: 'object' },
        scope: { type: 'object' },
        biases: { type: 'array' },
        findings: { type: 'array' },
        gaps: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'decision-quality', 'frame']
}));

export const alternativesAssessmentTask = defineTask('alternatives-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Alternatives Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Creative Alternatives Expert',
      task: 'Assess quality of alternatives generation',
      context: args,
      instructions: [
        '1. Evaluate number of alternatives considered',
        '2. Assess diversity of alternatives',
        '3. Check for creative options',
        '4. Evaluate hybrid consideration',
        '5. Assess do-nothing baseline inclusion',
        '6. Check for premature elimination',
        '7. Evaluate alternatives distinctiveness',
        '8. Score alternatives quality 1-100'
      ],
      outputFormat: 'JSON object with alternatives assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'findings', 'gaps'],
      properties: {
        score: { type: 'number' },
        quantity: { type: 'object' },
        diversity: { type: 'object' },
        creativity: { type: 'object' },
        findings: { type: 'array' },
        gaps: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'decision-quality', 'alternatives']
}));

export const informationAssessmentTask = defineTask('information-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Information Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Information Quality Expert',
      task: 'Assess quality and reliability of decision information',
      context: args,
      instructions: [
        '1. Evaluate information completeness',
        '2. Assess source reliability',
        '3. Check for confirmation bias',
        '4. Evaluate uncertainty acknowledgment',
        '5. Assess data recency and relevance',
        '6. Check for information gaps',
        '7. Evaluate expert input quality',
        '8. Score information quality 1-100'
      ],
      outputFormat: 'JSON object with information assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'findings', 'gaps'],
      properties: {
        score: { type: 'number' },
        completeness: { type: 'object' },
        reliability: { type: 'object' },
        biases: { type: 'array' },
        findings: { type: 'array' },
        gaps: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'decision-quality', 'information']
}));

export const valuesAssessmentTask = defineTask('values-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Values Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Values Clarity Expert',
      task: 'Assess clarity of values and objectives',
      context: args,
      instructions: [
        '1. Evaluate objectives clarity',
        '2. Assess criteria completeness',
        '3. Check for value conflicts',
        '4. Evaluate stakeholder value alignment',
        '5. Assess trade-off understanding',
        '6. Check for implicit values',
        '7. Evaluate preference consistency',
        '8. Score values clarity 1-100'
      ],
      outputFormat: 'JSON object with values assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'findings', 'gaps'],
      properties: {
        score: { type: 'number' },
        objectives: { type: 'object' },
        criteria: { type: 'object' },
        conflicts: { type: 'array' },
        findings: { type: 'array' },
        gaps: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'decision-quality', 'values']
}));

export const reasoningAssessmentTask = defineTask('reasoning-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reasoning Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Sound Reasoning Expert',
      task: 'Assess quality of decision reasoning',
      context: args,
      instructions: [
        '1. Evaluate logic and consistency',
        '2. Check for cognitive biases',
        '3. Assess consequence modeling',
        '4. Evaluate uncertainty handling',
        '5. Check for appropriate analysis depth',
        '6. Assess sensitivity analysis',
        '7. Evaluate integration of elements',
        '8. Score reasoning quality 1-100'
      ],
      outputFormat: 'JSON object with reasoning assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'findings', 'gaps'],
      properties: {
        score: { type: 'number' },
        logic: { type: 'object' },
        biases: { type: 'array' },
        analysis: { type: 'object' },
        findings: { type: 'array' },
        gaps: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'decision-quality', 'reasoning']
}));

export const commitmentAssessmentTask = defineTask('commitment-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Commitment Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Commitment to Action Expert',
      task: 'Assess commitment to decision implementation',
      context: args,
      instructions: [
        '1. Evaluate stakeholder buy-in',
        '2. Assess resource commitment',
        '3. Check implementation planning',
        '4. Evaluate accountability structures',
        '5. Assess monitoring mechanisms',
        '6. Check for commitment barriers',
        '7. Evaluate change readiness',
        '8. Score commitment quality 1-100'
      ],
      outputFormat: 'JSON object with commitment assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'findings', 'gaps'],
      properties: {
        score: { type: 'number' },
        buyIn: { type: 'object' },
        resources: { type: 'object' },
        implementation: { type: 'object' },
        findings: { type: 'array' },
        gaps: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'decision-quality', 'commitment']
}));

export const qualitySynthesisTask = defineTask('quality-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quality Synthesis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Quality Synthesizer',
      task: 'Synthesize overall decision quality assessment',
      context: args,
      instructions: [
        '1. Calculate element scores',
        '2. Identify weakest links',
        '3. Calculate overall quality score',
        '4. Identify critical gaps',
        '5. Assess quality chain impact',
        '6. Compare to quality benchmarks',
        '7. Identify quick wins',
        '8. Create quality summary'
      ],
      outputFormat: 'JSON object with quality synthesis'
    },
    outputSchema: {
      type: 'object',
      required: ['elementScores', 'overallScore', 'weakestLinks'],
      properties: {
        elementScores: { type: 'object' },
        overallScore: { type: 'number' },
        weakestLinks: { type: 'array' },
        criticalGaps: { type: 'array' },
        benchmarkComparison: { type: 'object' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'decision-quality', 'synthesis']
}));

export const improvementRecommendationsTask = defineTask('improvement-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Improvement Recommendations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Quality Improvement Advisor',
      task: 'Develop improvement recommendations',
      context: args,
      instructions: [
        '1. Prioritize improvement opportunities',
        '2. Define specific recommendations',
        '3. Estimate improvement effort',
        '4. Identify quick wins',
        '5. Create improvement roadmap',
        '6. Define success metrics',
        '7. Assign improvement owners',
        '8. Create action plan'
      ],
      outputFormat: 'JSON object with improvement recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'priorities', 'actionPlan'],
      properties: {
        recommendations: { type: 'array' },
        priorities: { type: 'array' },
        quickWins: { type: 'array' },
        roadmap: { type: 'object' },
        metrics: { type: 'array' },
        actionPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'decision-quality', 'improvement']
}));
