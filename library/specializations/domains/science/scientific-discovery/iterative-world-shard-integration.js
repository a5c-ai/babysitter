/**
 * @process domains/science/scientific-discovery/iterative-world-shard-integration
 * @description Iterative World Shard Integration: Keep separate partial models with explicit interfaces
 * @inputs {
 *   phenomenon: string,
 *   existingShards: array,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   integratedModel: object,
 *   shardInterfaces: array,
 *   insights: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    phenomenon,
    existingShards = [],
    domain = 'general science',
    integrationIterations = 3
  } = inputs;

  const startTime = ctx.now();
  const integrationHistory = [];
  let currentShards = [];

  // Phase 1: Identify or Create World Shards
  ctx.log('info', 'Identifying world shards for the phenomenon');
  const shardIdentification = await ctx.task(identifyShardsTask, {
    phenomenon,
    existingShards,
    domain
  });

  currentShards = shardIdentification.shards;

  // Phase 2: Analyze Each Shard
  ctx.log('info', 'Analyzing individual shards');
  const shardAnalyses = await ctx.parallel.all(
    currentShards.map(shard =>
      ctx.task(analyzeShardTask, {
        shard,
        phenomenon,
        domain
      })
    )
  );

  // Phase 3: Iterative Integration
  for (let iteration = 0; iteration < integrationIterations; iteration++) {
    ctx.log('info', `Integration iteration ${iteration + 1}`);

    // Define Interfaces Between Shards
    const interfaces = await ctx.task(defineInterfacesTask, {
      shards: currentShards,
      shardAnalyses,
      iteration,
      domain
    });

    // Integrate Shards
    const integrationResult = await ctx.task(integrateShardsTask, {
      shards: currentShards,
      interfaces,
      shardAnalyses,
      iteration,
      domain
    });

    // Identify Conflicts and Gaps
    const conflictAnalysis = await ctx.task(analyzeConflictsTask, {
      integrationResult,
      shards: currentShards,
      domain
    });

    integrationHistory.push({
      iteration: iteration + 1,
      interfaces,
      integrationResult,
      conflictAnalysis,
      timestamp: ctx.now()
    });

    // Update shards based on integration
    if (conflictAnalysis.suggestedShardUpdates.length > 0) {
      currentShards = await ctx.task(updateShardsTask, {
        shards: currentShards,
        updates: conflictAnalysis.suggestedShardUpdates,
        domain
      }).then(r => r.updatedShards);
    }

    if (iteration < integrationIterations - 1) {
      await ctx.breakpoint({
        question: `Integration iteration ${iteration + 1} complete. Conflicts: ${conflictAnalysis.conflicts.length}. Continue?`,
        title: `World Shard Integration - Iteration ${iteration + 1}`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/iteration-${iteration + 1}-integration.json`, format: 'json' }
          ]
        }
      });
    }
  }

  // Phase 4: Finalize Integrated Model
  ctx.log('info', 'Finalizing integrated model');
  const finalIntegration = await ctx.task(finalizeIntegrationTask, {
    shards: currentShards,
    integrationHistory,
    phenomenon,
    domain
  });

  // Phase 5: Validate Integration
  ctx.log('info', 'Validating integrated model');
  const validation = await ctx.task(validateIntegrationTask, {
    integratedModel: finalIntegration.model,
    originalShards: shardIdentification.shards,
    phenomenon,
    domain
  });

  // Phase 6: Synthesize Insights
  ctx.log('info', 'Synthesizing world shard integration insights');
  const synthesis = await ctx.task(synthesizeShardInsightsTask, {
    phenomenon,
    originalShards: shardIdentification.shards,
    finalShards: currentShards,
    integrationHistory,
    finalIntegration,
    validation,
    domain
  });

  return {
    success: validation.isValid,
    processId: 'domains/science/scientific-discovery/iterative-world-shard-integration',
    phenomenon,
    domain,
    originalShards: shardIdentification.shards,
    finalShards: currentShards,
    shardInterfaces: finalIntegration.interfaces,
    integratedModel: finalIntegration.model,
    integrationHistory,
    validation,
    insights: synthesis.insights,
    synthesis,
    metadata: {
      shardCount: currentShards.length,
      integrationIterations,
      finalConflicts: integrationHistory[integrationHistory.length - 1]?.conflictAnalysis?.conflicts?.length || 0,
      validationScore: validation.score || 0,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const identifyShardsTask = defineTask('identify-shards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify World Shards',
  agent: {
    name: 'shard-identifier',
    prompt: {
      role: 'modeling specialist',
      task: 'Identify distinct partial models (shards) for the phenomenon',
      context: args,
      instructions: [
        'Identify natural divisions in the phenomenon',
        'Define distinct partial models for each aspect',
        'Ensure shards are relatively independent',
        'Document what each shard covers',
        'Identify shard boundaries',
        'Note overlapping regions between shards',
        'Ensure complete coverage of phenomenon'
      ],
      outputFormat: 'JSON with shards, boundaries, coverage'
    },
    outputSchema: {
      type: 'object',
      required: ['shards'],
      properties: {
        shards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              coverage: { type: 'string' },
              boundaries: { type: 'array', items: { type: 'string' } },
              model: { type: 'object' }
            }
          }
        },
        overlapRegions: { type: 'array', items: { type: 'object' } },
        coverageAssessment: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'world-shard', 'identification']
}));

export const analyzeShardTask = defineTask('analyze-shard', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Shard: ${args.shard.name}`,
  agent: {
    name: 'shard-analyst',
    prompt: {
      role: 'model analyst',
      task: 'Analyze the structure and assumptions of a world shard',
      context: args,
      instructions: [
        'Document the shard internal structure',
        'Identify key assumptions',
        'Map inputs required from other shards',
        'Map outputs provided to other shards',
        'Identify shard limitations',
        'Document validity conditions',
        'Assess shard completeness'
      ],
      outputFormat: 'JSON with structure, assumptions, inputs/outputs, limitations'
    },
    outputSchema: {
      type: 'object',
      required: ['shardId', 'structure', 'assumptions'],
      properties: {
        shardId: { type: 'string' },
        structure: { type: 'object' },
        assumptions: { type: 'array', items: { type: 'string' } },
        requiredInputs: { type: 'array', items: { type: 'object' } },
        providedOutputs: { type: 'array', items: { type: 'object' } },
        limitations: { type: 'array', items: { type: 'string' } },
        validityConditions: { type: 'array', items: { type: 'string' } },
        completeness: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'world-shard', 'analysis']
}));

export const defineInterfacesTask = defineTask('define-interfaces', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Shard Interfaces: Iteration ${args.iteration + 1}`,
  agent: {
    name: 'interface-designer',
    prompt: {
      role: 'interface architect',
      task: 'Define explicit interfaces between world shards',
      context: args,
      instructions: [
        'Identify all shard pairs needing interfaces',
        'Define data exchange formats',
        'Specify conversion rules between shards',
        'Document interface contracts',
        'Handle unit and scale mismatches',
        'Define error handling at interfaces',
        'Ensure bidirectional compatibility'
      ],
      outputFormat: 'JSON with interfaces, contracts, conversions'
    },
    outputSchema: {
      type: 'object',
      required: ['interfaces'],
      properties: {
        interfaces: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              fromShard: { type: 'string' },
              toShard: { type: 'string' },
              dataExchanged: { type: 'array', items: { type: 'object' } },
              conversionRules: { type: 'array', items: { type: 'object' } },
              contract: { type: 'object' }
            }
          }
        },
        errorHandling: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'world-shard', 'interfaces']
}));

export const integrateShardsTask = defineTask('integrate-shards', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integrate Shards: Iteration ${args.iteration + 1}`,
  agent: {
    name: 'shard-integrator',
    prompt: {
      role: 'integration specialist',
      task: 'Integrate world shards through their interfaces',
      context: args,
      instructions: [
        'Connect shards via defined interfaces',
        'Ensure data flows correctly between shards',
        'Test interface functionality',
        'Identify integration issues',
        'Create unified execution model',
        'Handle cross-shard dependencies',
        'Document the integrated structure'
      ],
      outputFormat: 'JSON with integrated model, execution flow, issues'
    },
    outputSchema: {
      type: 'object',
      required: ['integratedStructure', 'executionFlow'],
      properties: {
        integratedStructure: { type: 'object' },
        executionFlow: { type: 'array', items: { type: 'object' } },
        dataFlows: { type: 'array', items: { type: 'object' } },
        integrationIssues: { type: 'array', items: { type: 'string' } },
        crossShardDependencies: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'world-shard', 'integration']
}));

export const analyzeConflictsTask = defineTask('analyze-conflicts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Integration Conflicts',
  agent: {
    name: 'conflict-analyst',
    prompt: {
      role: 'conflict resolution specialist',
      task: 'Identify and analyze conflicts between integrated shards',
      context: args,
      instructions: [
        'Identify assumption conflicts between shards',
        'Find inconsistent predictions',
        'Detect coverage gaps',
        'Identify overlapping conflicting models',
        'Suggest conflict resolutions',
        'Propose shard updates to resolve conflicts',
        'Prioritize conflict resolution'
      ],
      outputFormat: 'JSON with conflicts, gaps, resolutions, updates'
    },
    outputSchema: {
      type: 'object',
      required: ['conflicts', 'gaps'],
      properties: {
        conflicts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              shards: { type: 'array', items: { type: 'string' } },
              description: { type: 'string' },
              severity: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        gaps: { type: 'array', items: { type: 'object' } },
        suggestedShardUpdates: { type: 'array', items: { type: 'object' } },
        resolutionPriorities: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'world-shard', 'conflicts']
}));

export const updateShardsTask = defineTask('update-shards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update Shards Based on Integration',
  agent: {
    name: 'shard-updater',
    prompt: {
      role: 'model refinement specialist',
      task: 'Update shards to resolve integration issues',
      context: args,
      instructions: [
        'Apply suggested updates to shards',
        'Resolve identified conflicts',
        'Fill coverage gaps',
        'Maintain shard consistency',
        'Update interfaces as needed',
        'Document all changes',
        'Verify update correctness'
      ],
      outputFormat: 'JSON with updated shards, changes made'
    },
    outputSchema: {
      type: 'object',
      required: ['updatedShards', 'changes'],
      properties: {
        updatedShards: { type: 'array', items: { type: 'object' } },
        changes: { type: 'array', items: { type: 'object' } },
        conflictsResolved: { type: 'array', items: { type: 'string' } },
        gapsFilled: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'world-shard', 'update']
}));

export const finalizeIntegrationTask = defineTask('finalize-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Finalize Integrated Model',
  agent: {
    name: 'integration-finalizer',
    prompt: {
      role: 'systems architect',
      task: 'Finalize the integrated world model',
      context: args,
      instructions: [
        'Create final integrated model',
        'Document all interfaces',
        'Specify execution order',
        'Document assumptions and limitations',
        'Create user documentation',
        'Define maintenance procedures',
        'Ensure model completeness'
      ],
      outputFormat: 'JSON with final model, interfaces, documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'interfaces'],
      properties: {
        model: { type: 'object' },
        interfaces: { type: 'array', items: { type: 'object' } },
        executionOrder: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        documentation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'world-shard', 'finalization']
}));

export const validateIntegrationTask = defineTask('validate-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Integrated Model',
  agent: {
    name: 'integration-validator',
    prompt: {
      role: 'validation specialist',
      task: 'Validate the integrated world model',
      context: args,
      instructions: [
        'Verify model completeness',
        'Check interface correctness',
        'Test model consistency',
        'Verify phenomenon coverage',
        'Check for remaining conflicts',
        'Assess model accuracy',
        'Rate overall validity 0-100'
      ],
      outputFormat: 'JSON with validation results, score, issues'
    },
    outputSchema: {
      type: 'object',
      required: ['isValid', 'score'],
      properties: {
        isValid: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        completenessCheck: { type: 'object' },
        interfaceCheck: { type: 'object' },
        consistencyCheck: { type: 'object' },
        coverageCheck: { type: 'object' },
        remainingIssues: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'world-shard', 'validation']
}));

export const synthesizeShardInsightsTask = defineTask('synthesize-shard-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize World Shard Insights',
  agent: {
    name: 'insight-synthesizer',
    prompt: {
      role: 'integration theorist',
      task: 'Synthesize insights from world shard integration',
      context: args,
      instructions: [
        'Document key learnings from integration process',
        'Extract principles for shard-based modeling',
        'Identify what worked and what did not',
        'Document interface design insights',
        'Provide recommendations for future integration',
        'Note limitations of the approach',
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
        modelingPrinciples: { type: 'array', items: { type: 'string' } },
        whatWorked: { type: 'array', items: { type: 'string' } },
        whatDidNotWork: { type: 'array', items: { type: 'string' } },
        interfaceDesignInsights: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'world-shard', 'synthesis']
}));
