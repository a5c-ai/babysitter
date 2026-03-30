/**
 * @process domains/science/scientific-discovery/metaphor-based-reasoning-formalized
 * @description Metaphor-Based Reasoning Formalized: Explicitly map problems into metaphor domain
 * @inputs {
 *   problem: string,
 *   metaphorDomain: string,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   formalMapping: object,
 *   derivedInsights: array,
 *   insights: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problem,
    metaphorDomain,
    domain = 'general science'
  } = inputs;

  const startTime = ctx.now();

  // Phase 1: Analyze Source Problem
  ctx.log('info', 'Analyzing source problem structure');
  const problemAnalysis = await ctx.task(analyzeProblemTask, {
    problem,
    domain
  });

  // Phase 2: Analyze Metaphor Domain
  ctx.log('info', 'Analyzing metaphor domain structure');
  const metaphorAnalysis = await ctx.task(analyzeMetaphorDomainTask, {
    metaphorDomain,
    domain
  });

  // Phase 3: Construct Formal Mapping
  ctx.log('info', 'Constructing formal mapping between domains');
  const formalMapping = await ctx.task(constructFormalMappingTask, {
    problemAnalysis,
    metaphorAnalysis,
    domain
  });

  await ctx.breakpoint({
    question: 'Formal mapping constructed. Review before reasoning?',
    title: 'Metaphor-Based Reasoning - Mapping Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/problem-analysis.json', format: 'json' },
        { path: 'artifacts/metaphor-analysis.json', format: 'json' },
        { path: 'artifacts/formal-mapping.json', format: 'json' }
      ]
    }
  });

  // Phase 4: Reason Within Metaphor Domain
  ctx.log('info', 'Reasoning within metaphor domain');
  const metaphorReasoning = await ctx.task(reasonInMetaphorTask, {
    problem,
    formalMapping,
    metaphorAnalysis,
    domain
  });

  // Phase 5: Transfer Inferences Back
  ctx.log('info', 'Transferring inferences back to source domain');
  const transferredInferences = await ctx.task(transferInferencesTask, {
    metaphorReasoning,
    formalMapping,
    problemAnalysis,
    domain
  });

  // Phase 6: Validate Transferred Inferences
  ctx.log('info', 'Validating transferred inferences');
  const validation = await ctx.task(validateInferencesTask, {
    transferredInferences,
    problemAnalysis,
    formalMapping,
    domain
  });

  // Phase 7: Extract New Insights
  ctx.log('info', 'Extracting new insights from metaphor reasoning');
  const newInsights = await ctx.task(extractInsightsTask, {
    metaphorReasoning,
    transferredInferences,
    validation,
    problem,
    domain
  });

  // Phase 8: Synthesize Findings
  ctx.log('info', 'Synthesizing metaphor-based reasoning findings');
  const synthesis = await ctx.task(synthesizeMetaphorFindingsTask, {
    problem,
    metaphorDomain,
    formalMapping,
    metaphorReasoning,
    transferredInferences,
    validation,
    newInsights,
    domain
  });

  return {
    success: validation.overallValidity >= 70,
    processId: 'domains/science/scientific-discovery/metaphor-based-reasoning-formalized',
    problem,
    metaphorDomain,
    domain,
    problemAnalysis,
    metaphorAnalysis,
    formalMapping,
    metaphorReasoning,
    transferredInferences,
    validation,
    derivedInsights: newInsights.insights,
    insights: synthesis.insights,
    synthesis,
    metadata: {
      mappingsCreated: formalMapping.mappings?.length || 0,
      inferencesGenerated: metaphorReasoning.inferences?.length || 0,
      validInferences: validation.validInferences?.length || 0,
      validityScore: validation.overallValidity || 0,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const analyzeProblemTask = defineTask('analyze-problem', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Source Problem',
  agent: {
    name: 'problem-analyst',
    prompt: {
      role: 'problem analysis specialist',
      task: 'Analyze the source problem structure for metaphor mapping',
      context: args,
      instructions: [
        'Identify key entities in the problem',
        'Map relationships between entities',
        'Identify operations and transformations',
        'Document properties and attributes',
        'Identify the problem goal/question',
        'Note constraints and boundary conditions',
        'Create a structural representation'
      ],
      outputFormat: 'JSON with entities, relationships, operations, structure'
    },
    outputSchema: {
      type: 'object',
      required: ['entities', 'relationships', 'structure'],
      properties: {
        entities: { type: 'array', items: { type: 'object' } },
        relationships: { type: 'array', items: { type: 'object' } },
        operations: { type: 'array', items: { type: 'object' } },
        properties: { type: 'array', items: { type: 'object' } },
        goal: { type: 'string' },
        constraints: { type: 'array', items: { type: 'string' } },
        structure: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metaphor-reasoning', 'problem-analysis']
}));

export const analyzeMetaphorDomainTask = defineTask('analyze-metaphor-domain', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Metaphor Domain',
  agent: {
    name: 'metaphor-domain-analyst',
    prompt: {
      role: 'metaphor specialist',
      task: 'Analyze the structure of the metaphor domain',
      context: args,
      instructions: [
        'Identify key entities in the metaphor domain',
        'Map relationships and interactions',
        'Document typical operations and transformations',
        'Identify well-understood behaviors',
        'Document inference patterns native to the domain',
        'Identify generative potential of the domain',
        'Create comprehensive domain model'
      ],
      outputFormat: 'JSON with domain entities, relationships, inference patterns'
    },
    outputSchema: {
      type: 'object',
      required: ['entities', 'relationships', 'inferencePatterns'],
      properties: {
        entities: { type: 'array', items: { type: 'object' } },
        relationships: { type: 'array', items: { type: 'object' } },
        operations: { type: 'array', items: { type: 'object' } },
        behaviors: { type: 'array', items: { type: 'object' } },
        inferencePatterns: { type: 'array', items: { type: 'object' } },
        generativePotential: { type: 'array', items: { type: 'string' } },
        domainModel: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metaphor-reasoning', 'domain-analysis']
}));

export const constructFormalMappingTask = defineTask('construct-formal-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct Formal Mapping',
  agent: {
    name: 'mapping-constructor',
    prompt: {
      role: 'formal analogy specialist',
      task: 'Construct formal mapping between problem and metaphor domains',
      context: args,
      instructions: [
        'Map entities from problem to metaphor domain',
        'Map relationships preserving structure',
        'Map operations and their effects',
        'Document mapping rationale',
        'Identify what maps well vs poorly',
        'Specify mapping constraints',
        'Create bidirectional mapping specification'
      ],
      outputFormat: 'JSON with entity maps, relationship maps, operation maps'
    },
    outputSchema: {
      type: 'object',
      required: ['mappings', 'entityMap', 'relationshipMap'],
      properties: {
        mappings: { type: 'array', items: { type: 'object' } },
        entityMap: { type: 'object' },
        relationshipMap: { type: 'object' },
        operationMap: { type: 'object' },
        rationale: { type: 'array', items: { type: 'object' } },
        wellMappedAspects: { type: 'array', items: { type: 'string' } },
        poorlyMappedAspects: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metaphor-reasoning', 'mapping']
}));

export const reasonInMetaphorTask = defineTask('reason-in-metaphor', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reason Within Metaphor Domain',
  agent: {
    name: 'metaphor-reasoner',
    prompt: {
      role: 'analogical reasoner',
      task: 'Reason about the mapped problem within the metaphor domain',
      context: args,
      instructions: [
        'Apply metaphor domain inference patterns',
        'Generate predictions within metaphor domain',
        'Explore metaphor domain consequences',
        'Use intuitions native to metaphor domain',
        'Generate novel combinations',
        'Document the reasoning chain',
        'Note confidence in each inference'
      ],
      outputFormat: 'JSON with inferences, predictions, reasoning chains'
    },
    outputSchema: {
      type: 'object',
      required: ['inferences', 'predictions'],
      properties: {
        inferences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              inference: { type: 'string' },
              basedOn: { type: 'string' },
              confidence: { type: 'number' }
            }
          }
        },
        predictions: { type: 'array', items: { type: 'object' } },
        reasoningChains: { type: 'array', items: { type: 'object' } },
        novelCombinations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metaphor-reasoning', 'reasoning']
}));

export const transferInferencesTask = defineTask('transfer-inferences', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Transfer Inferences Back',
  agent: {
    name: 'inference-transfer',
    prompt: {
      role: 'translation specialist',
      task: 'Transfer inferences from metaphor domain back to source domain',
      context: args,
      instructions: [
        'Translate each inference to source domain terms',
        'Use the inverse mapping',
        'Identify inferences that transfer cleanly',
        'Identify inferences that need adaptation',
        'Note inferences that do not transfer',
        'Document transfer rationale',
        'Assess transfer fidelity'
      ],
      outputFormat: 'JSON with transferred inferences, adaptations, fidelity'
    },
    outputSchema: {
      type: 'object',
      required: ['transferredInferences'],
      properties: {
        transferredInferences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              originalInference: { type: 'string' },
              transferredForm: { type: 'string' },
              transferQuality: { type: 'string' },
              adaptationsNeeded: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        cleanTransfers: { type: 'array', items: { type: 'string' } },
        adaptedTransfers: { type: 'array', items: { type: 'object' } },
        failedTransfers: { type: 'array', items: { type: 'object' } },
        overallFidelity: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metaphor-reasoning', 'transfer']
}));

export const validateInferencesTask = defineTask('validate-inferences', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Transferred Inferences',
  agent: {
    name: 'inference-validator',
    prompt: {
      role: 'validation specialist',
      task: 'Validate transferred inferences in the source domain',
      context: args,
      instructions: [
        'Check each inference for validity in source domain',
        'Test against known facts and constraints',
        'Identify valid vs invalid transfers',
        'Assess confidence in each validation',
        'Document validation criteria',
        'Calculate overall validity',
        'Note any surprises'
      ],
      outputFormat: 'JSON with validation results, validity scores, criteria'
    },
    outputSchema: {
      type: 'object',
      required: ['validationResults', 'overallValidity'],
      properties: {
        validationResults: { type: 'array', items: { type: 'object' } },
        validInferences: { type: 'array', items: { type: 'string' } },
        invalidInferences: { type: 'array', items: { type: 'object' } },
        overallValidity: { type: 'number', minimum: 0, maximum: 100 },
        criteria: { type: 'array', items: { type: 'string' } },
        surprises: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metaphor-reasoning', 'validation']
}));

export const extractInsightsTask = defineTask('extract-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract New Insights',
  agent: {
    name: 'insight-extractor',
    prompt: {
      role: 'insight specialist',
      task: 'Extract new insights from the metaphor-based reasoning',
      context: args,
      instructions: [
        'Identify novel insights from valid transfers',
        'Find non-obvious conclusions',
        'Identify new hypotheses generated',
        'Document insights unique to metaphor approach',
        'Rate insights by value and novelty',
        'Identify actionable insights',
        'Note surprising discoveries'
      ],
      outputFormat: 'JSON with insights, hypotheses, novelty ratings'
    },
    outputSchema: {
      type: 'object',
      required: ['insights'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              novelty: { type: 'string' },
              value: { type: 'string' },
              actionable: { type: 'boolean' }
            }
          }
        },
        newHypotheses: { type: 'array', items: { type: 'object' } },
        uniqueToMetaphor: { type: 'array', items: { type: 'string' } },
        surprisingDiscoveries: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metaphor-reasoning', 'insights']
}));

export const synthesizeMetaphorFindingsTask = defineTask('synthesize-metaphor-findings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Metaphor-Based Findings',
  agent: {
    name: 'findings-synthesizer',
    prompt: {
      role: 'research synthesizer',
      task: 'Synthesize findings from metaphor-based reasoning',
      context: args,
      instructions: [
        'Summarize key findings from metaphor reasoning',
        'Evaluate the metaphor choice',
        'Document what the metaphor revealed',
        'Note limitations and dangers of the metaphor',
        'Provide recommendations for metaphor use',
        'Compare to direct reasoning',
        'Create comprehensive synthesis'
      ],
      outputFormat: 'JSON with synthesis, insights, metaphor evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'insights'],
      properties: {
        synthesis: { type: 'string' },
        insights: { type: 'array', items: { type: 'string' } },
        metaphorEvaluation: { type: 'object' },
        metaphorRevealed: { type: 'array', items: { type: 'string' } },
        metaphorLimitations: { type: 'array', items: { type: 'string' } },
        metaphorDangers: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        comparisonToDirectReasoning: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metaphor-reasoning', 'synthesis']
}));
