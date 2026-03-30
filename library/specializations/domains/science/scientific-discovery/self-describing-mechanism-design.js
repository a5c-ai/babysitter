/**
 * @process domains/science/scientific-discovery/self-describing-mechanism-design
 * @description Self-Describing Mechanism Design: Design mechanisms encoding readable explanations of themselves
 * @inputs {
 *   mechanism: string,
 *   targetAudience: string,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   selfDescribingDesign: object,
 *   explanatoryFeatures: array,
 *   insights: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    mechanism,
    targetAudience = 'technical',
    domain = 'general science',
    explanationDepth = 'comprehensive'
  } = inputs;

  const startTime = ctx.now();

  // Phase 1: Analyze Existing Mechanism
  ctx.log('info', 'Analyzing existing mechanism structure');
  const mechanismAnalysis = await ctx.task(analyzeMechanismTask, {
    mechanism,
    domain
  });

  // Phase 2: Identify Explanation Points
  ctx.log('info', 'Identifying points requiring explanation');
  const explanationPoints = await ctx.task(identifyExplanationPointsTask, {
    mechanismAnalysis,
    targetAudience,
    explanationDepth,
    domain
  });

  // Phase 3: Design Self-Description Features
  ctx.log('info', 'Designing self-description features');
  const selfDescriptionFeatures = await ctx.task(designSelfDescriptionTask, {
    mechanismAnalysis,
    explanationPoints,
    targetAudience,
    domain
  });

  await ctx.breakpoint({
    question: 'Self-description features designed. Review before integration?',
    title: 'Self-Describing Mechanism - Design Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/mechanism-analysis.json', format: 'json' },
        { path: 'artifacts/self-description-features.json', format: 'json' }
      ]
    }
  });

  // Phase 4: Integrate Self-Description into Mechanism
  ctx.log('info', 'Integrating self-description into mechanism');
  const integratedDesign = await ctx.task(integrateDescriptionTask, {
    mechanismAnalysis,
    selfDescriptionFeatures,
    domain
  });

  // Phase 5: Validate Readability
  ctx.log('info', 'Validating readability of self-descriptions');
  const readabilityValidation = await ctx.task(validateReadabilityTask, {
    integratedDesign,
    targetAudience,
    domain
  });

  // Phase 6: Ensure Explanation-Behavior Consistency
  ctx.log('info', 'Ensuring explanation-behavior consistency');
  const consistencyCheck = await ctx.task(checkConsistencyTask, {
    integratedDesign,
    mechanismAnalysis,
    domain
  });

  // Phase 7: Synthesize Insights
  ctx.log('info', 'Synthesizing self-describing mechanism insights');
  const synthesis = await ctx.task(synthesizeSelfDescribingInsightsTask, {
    mechanism,
    mechanismAnalysis,
    selfDescriptionFeatures,
    integratedDesign,
    readabilityValidation,
    consistencyCheck,
    domain
  });

  return {
    success: readabilityValidation.isReadable && consistencyCheck.isConsistent,
    processId: 'domains/science/scientific-discovery/self-describing-mechanism-design',
    mechanism,
    domain,
    mechanismAnalysis,
    explanationPoints,
    selfDescriptionFeatures,
    selfDescribingDesign: integratedDesign,
    explanatoryFeatures: selfDescriptionFeatures.features,
    readabilityValidation,
    consistencyCheck,
    insights: synthesis.insights,
    synthesis,
    metadata: {
      explanationPointsCount: explanationPoints.points?.length || 0,
      featuresDesigned: selfDescriptionFeatures.features?.length || 0,
      readabilityScore: readabilityValidation.score || 0,
      consistencyScore: consistencyCheck.score || 0,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const analyzeMechanismTask = defineTask('analyze-mechanism', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Mechanism Structure',
  agent: {
    name: 'mechanism-analyst',
    prompt: {
      role: 'mechanism analysis specialist',
      task: 'Analyze the structure and operation of the mechanism',
      context: args,
      instructions: [
        'Decompose the mechanism into components',
        'Map the causal structure',
        'Identify inputs, outputs, and transformations',
        'Document the operating principles',
        'Identify state variables and their meanings',
        'Map the information flow',
        'Document any emergent behaviors'
      ],
      outputFormat: 'JSON with components, causal structure, transformations, principles'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'causalStructure', 'transformations'],
      properties: {
        components: { type: 'array', items: { type: 'object' } },
        causalStructure: { type: 'object' },
        inputs: { type: 'array', items: { type: 'object' } },
        outputs: { type: 'array', items: { type: 'object' } },
        transformations: { type: 'array', items: { type: 'object' } },
        operatingPrinciples: { type: 'array', items: { type: 'string' } },
        stateVariables: { type: 'array', items: { type: 'object' } },
        emergentBehaviors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'self-describing', 'mechanism-analysis']
}));

export const identifyExplanationPointsTask = defineTask('identify-explanation-points', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Explanation Points',
  agent: {
    name: 'explanation-point-identifier',
    prompt: {
      role: 'explanation designer',
      task: 'Identify points in the mechanism that need explanation',
      context: args,
      instructions: [
        'Identify non-obvious operations needing explanation',
        'Find potential confusion points',
        'Identify critical decision points',
        'Find places where purpose is unclear',
        'Identify transitions requiring context',
        'Find points where errors commonly occur',
        'Rate explanation priority for each point'
      ],
      outputFormat: 'JSON with explanation points, priorities, reasons'
    },
    outputSchema: {
      type: 'object',
      required: ['points'],
      properties: {
        points: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              needsExplanation: { type: 'string' },
              reason: { type: 'string' },
              priority: { type: 'number' },
              audienceConsiderations: { type: 'string' }
            }
          }
        },
        confusionPoints: { type: 'array', items: { type: 'string' } },
        criticalPoints: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'self-describing', 'explanation-points']
}));

export const designSelfDescriptionTask = defineTask('design-self-description', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Self-Description Features',
  agent: {
    name: 'description-designer',
    prompt: {
      role: 'self-documenting system designer',
      task: 'Design features that make the mechanism self-describing',
      context: args,
      instructions: [
        'Design readable naming conventions',
        'Create self-documenting state representations',
        'Design observable intermediate results',
        'Create meaningful error messages',
        'Design progress indicators',
        'Create explanatory logging',
        'Design introspection capabilities'
      ],
      outputFormat: 'JSON with self-description features, designs, rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['features'],
      properties: {
        features: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              type: { type: 'string' },
              design: { type: 'object' },
              targetPoint: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        namingConventions: { type: 'object' },
        stateRepresentations: { type: 'array', items: { type: 'object' } },
        observableIntermediates: { type: 'array', items: { type: 'object' } },
        introspectionCapabilities: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'self-describing', 'design']
}));

export const integrateDescriptionTask = defineTask('integrate-description', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate Self-Description into Mechanism',
  agent: {
    name: 'integration-specialist',
    prompt: {
      role: 'system integration specialist',
      task: 'Integrate self-description features into the mechanism design',
      context: args,
      instructions: [
        'Integrate features without changing core behavior',
        'Ensure minimal performance overhead',
        'Maintain mechanism integrity',
        'Create clean interface for descriptions',
        'Ensure descriptions update with state',
        'Design for extensibility',
        'Document the integrated design'
      ],
      outputFormat: 'JSON with integrated design, interfaces, performance considerations'
    },
    outputSchema: {
      type: 'object',
      required: ['integratedMechanism', 'descriptionInterfaces'],
      properties: {
        integratedMechanism: { type: 'object' },
        descriptionInterfaces: { type: 'array', items: { type: 'object' } },
        performanceOverhead: { type: 'string' },
        integrationApproach: { type: 'string' },
        extensibilityPoints: { type: 'array', items: { type: 'string' } },
        documentation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'self-describing', 'integration']
}));

export const validateReadabilityTask = defineTask('validate-readability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Description Readability',
  agent: {
    name: 'readability-validator',
    prompt: {
      role: 'readability expert',
      task: 'Validate that self-descriptions are readable by target audience',
      context: args,
      instructions: [
        'Assess readability for target audience',
        'Check clarity of explanations',
        'Verify appropriate level of detail',
        'Test comprehensibility of error messages',
        'Evaluate naming clarity',
        'Check for jargon appropriateness',
        'Rate overall readability 0-100'
      ],
      outputFormat: 'JSON with readability assessment, issues, score'
    },
    outputSchema: {
      type: 'object',
      required: ['isReadable', 'score', 'assessment'],
      properties: {
        isReadable: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        assessment: { type: 'string' },
        clarityIssues: { type: 'array', items: { type: 'object' } },
        detailLevelIssues: { type: 'array', items: { type: 'string' } },
        jargonIssues: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'self-describing', 'readability']
}));

export const checkConsistencyTask = defineTask('check-consistency', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check Explanation-Behavior Consistency',
  agent: {
    name: 'consistency-checker',
    prompt: {
      role: 'verification specialist',
      task: 'Ensure explanations accurately describe actual behavior',
      context: args,
      instructions: [
        'Verify explanations match actual behavior',
        'Check for misleading descriptions',
        'Ensure state descriptions are accurate',
        'Verify error message accuracy',
        'Check naming consistency',
        'Identify any explanation-behavior gaps',
        'Rate overall consistency 0-100'
      ],
      outputFormat: 'JSON with consistency check results, gaps, score'
    },
    outputSchema: {
      type: 'object',
      required: ['isConsistent', 'score'],
      properties: {
        isConsistent: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        verificationResults: { type: 'array', items: { type: 'object' } },
        misleadingDescriptions: { type: 'array', items: { type: 'object' } },
        explanationBehaviorGaps: { type: 'array', items: { type: 'object' } },
        corrections: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'self-describing', 'consistency']
}));

export const synthesizeSelfDescribingInsightsTask = defineTask('synthesize-self-describing-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Self-Describing Insights',
  agent: {
    name: 'insight-synthesizer',
    prompt: {
      role: 'design theorist',
      task: 'Synthesize insights from self-describing mechanism design',
      context: args,
      instructions: [
        'Summarize the self-description approach',
        'Document key design decisions',
        'Extract principles for self-describing systems',
        'Identify challenges and solutions',
        'Provide recommendations for similar designs',
        'Note limitations and trade-offs',
        'Create comprehensive synthesis'
      ],
      outputFormat: 'JSON with synthesis, insights, principles, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'insights'],
      properties: {
        synthesis: { type: 'string' },
        insights: { type: 'array', items: { type: 'string' } },
        designDecisions: { type: 'array', items: { type: 'object' } },
        principles: { type: 'array', items: { type: 'string' } },
        challengesSolutions: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        tradeOffs: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'self-describing', 'synthesis']
}));
