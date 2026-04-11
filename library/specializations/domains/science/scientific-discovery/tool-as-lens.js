/**
 * @process domains/science/scientific-discovery/tool-as-lens
 * @description Tool as Lens: Treat each instrument or method as a lens revealing and hiding aspects
 * @inputs {
 *   phenomenon: string,
 *   tools: array,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   toolAnalyses: array,
 *   revealedAspects: object,
 *   hiddenAspects: object,
 *   synthesizedView: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    phenomenon,
    tools = [],
    domain = 'general science',
    analyzeBlindSpots = true
  } = inputs;

  const toolAnalyses = [];
  const revealedAspects = {};
  const hiddenAspects = {};
  const startTime = ctx.now();

  // Phase 1: Identify Available Tools/Methods
  ctx.log('info', 'Identifying available tools and methods');
  const toolInventory = await ctx.task(inventoryToolsTask, {
    phenomenon,
    requestedTools: tools,
    domain
  });

  // Phase 2: Analyze Each Tool as a Lens
  ctx.log('info', 'Analyzing each tool as a lens');
  for (const tool of toolInventory.tools) {
    const toolAnalysis = await ctx.task(analyzeToolAsLensTask, {
      phenomenon,
      tool,
      domain
    });

    toolAnalyses.push(toolAnalysis);
    revealedAspects[tool.name] = toolAnalysis.reveals;
    hiddenAspects[tool.name] = toolAnalysis.hides;
  }

  await ctx.breakpoint({
    question: `Analyzed ${toolInventory.tools.length} tools as lenses. Review before blind spot analysis?`,
    title: 'Tool as Lens - Tool Analyses Complete',
    context: {
      runId: ctx.runId,
      files: toolInventory.tools.map(tool => ({
        path: `artifacts/tool-${tool.name}-analysis.json`,
        format: 'json'
      }))
    }
  });

  // Phase 3: Identify Collective Blind Spots
  let blindSpotAnalysis = null;
  if (analyzeBlindSpots) {
    ctx.log('info', 'Identifying collective blind spots');
    blindSpotAnalysis = await ctx.task(identifyBlindSpotsTask, {
      phenomenon,
      toolAnalyses,
      revealedAspects,
      hiddenAspects,
      domain
    });
  }

  // Phase 4: Analyze Tool Complementarity
  ctx.log('info', 'Analyzing tool complementarity');
  const complementarityAnalysis = await ctx.task(analyzeComplementarityTask, {
    phenomenon,
    toolAnalyses,
    revealedAspects,
    hiddenAspects,
    domain
  });

  // Phase 5: Identify Tool-Induced Artifacts
  ctx.log('info', 'Identifying tool-induced artifacts');
  const artifactAnalysis = await ctx.task(identifyArtifactsTask, {
    phenomenon,
    toolAnalyses,
    domain
  });

  // Phase 6: Recommend Optimal Tool Combinations
  ctx.log('info', 'Recommending optimal tool combinations');
  const toolCombinations = await ctx.task(recommendToolCombinationsTask, {
    phenomenon,
    toolAnalyses,
    complementarityAnalysis,
    blindSpotAnalysis,
    domain
  });

  // Phase 7: Synthesize Multi-Tool View
  ctx.log('info', 'Synthesizing multi-tool view');
  const synthesizedView = await ctx.task(synthesizeMultiToolViewTask, {
    phenomenon,
    toolAnalyses,
    revealedAspects,
    hiddenAspects,
    blindSpotAnalysis,
    complementarityAnalysis,
    artifactAnalysis,
    toolCombinations,
    domain
  });

  return {
    success: true,
    processId: 'domains/science/scientific-discovery/tool-as-lens',
    phenomenon,
    domain,
    toolInventory,
    toolAnalyses,
    revealedAspects,
    hiddenAspects,
    blindSpotAnalysis,
    complementarityAnalysis,
    artifactAnalysis,
    toolCombinations,
    synthesizedView,
    metadata: {
      toolCount: toolInventory.tools.length,
      totalRevealed: Object.values(revealedAspects).flat().length,
      totalHidden: Object.values(hiddenAspects).flat().length,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const inventoryToolsTask = defineTask('inventory-tools', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Inventory Available Tools',
  agent: {
    name: 'tool-inventory-specialist',
    prompt: {
      role: 'methodology specialist',
      task: 'Identify and characterize available tools and methods',
      context: args,
      instructions: [
        'List all relevant tools and methods for studying this phenomenon',
        'Categorize tools by type (observational, experimental, computational, etc.)',
        'Document the operating principles of each tool',
        'Identify the theoretical assumptions underlying each tool',
        'Note the historical development and maturity of each tool',
        'Identify any prerequisites or dependencies',
        'Rate accessibility and cost of each tool'
      ],
      outputFormat: 'JSON with tool inventory, categorization, principles, assumptions'
    },
    outputSchema: {
      type: 'object',
      required: ['tools'],
      properties: {
        tools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              category: { type: 'string' },
              operatingPrinciple: { type: 'string' },
              theoreticalAssumptions: { type: 'array', items: { type: 'string' } },
              maturity: { type: 'string' },
              accessibility: { type: 'string' }
            }
          }
        },
        categories: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tool-as-lens', 'inventory']
}));

export const analyzeToolAsLensTask = defineTask('analyze-tool-as-lens', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Tool as Lens: ${args.tool.name}`,
  agent: {
    name: 'tool-lens-analyst',
    prompt: {
      role: 'epistemologist and methodologist',
      task: 'Analyze what this tool reveals and hides about the phenomenon',
      context: args,
      instructions: [
        'Identify what aspects of the phenomenon this tool reveals',
        'Identify what aspects this tool necessarily hides or obscures',
        'Analyze how the tool shapes our perception of the phenomenon',
        'Identify any biases introduced by the tool',
        'Document the resolution limits of this tool',
        'Analyze what features get emphasized vs de-emphasized',
        'Consider how the tool might distort the phenomenon'
      ],
      outputFormat: 'JSON with reveals, hides, biases, limitations, distortions'
    },
    outputSchema: {
      type: 'object',
      required: ['toolName', 'reveals', 'hides'],
      properties: {
        toolName: { type: 'string' },
        reveals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              aspect: { type: 'string' },
              clarity: { type: 'string' },
              reliability: { type: 'string' }
            }
          }
        },
        hides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              aspect: { type: 'string' },
              reason: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        biases: { type: 'array', items: { type: 'object' } },
        resolutionLimits: { type: 'object' },
        emphases: { type: 'array', items: { type: 'string' } },
        potentialDistortions: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tool-as-lens', 'analysis']
}));

export const identifyBlindSpotsTask = defineTask('identify-blind-spots', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Collective Blind Spots',
  agent: {
    name: 'blind-spot-identifier',
    prompt: {
      role: 'critical epistemologist',
      task: 'Identify blind spots shared across all available tools',
      context: args,
      instructions: [
        'Identify aspects hidden by ALL tools (collective blind spots)',
        'Analyze why these aspects are universally hidden',
        'Assess the significance of these blind spots',
        'Consider whether any novel tool could address them',
        'Document the epistemological limitations',
        'Propose potential approaches to access hidden aspects',
        'Rank blind spots by importance'
      ],
      outputFormat: 'JSON with collective blind spots, reasons, significance, proposals'
    },
    outputSchema: {
      type: 'object',
      required: ['collectiveBlindSpots'],
      properties: {
        collectiveBlindSpots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              aspect: { type: 'string' },
              reason: { type: 'string' },
              significance: { type: 'string' },
              importance: { type: 'number' }
            }
          }
        },
        epistemologicalLimitations: { type: 'array', items: { type: 'string' } },
        proposedApproaches: { type: 'array', items: { type: 'object' } },
        noToolCanAccess: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tool-as-lens', 'blind-spots']
}));

export const analyzeComplementarityTask = defineTask('analyze-complementarity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Tool Complementarity',
  agent: {
    name: 'complementarity-analyst',
    prompt: {
      role: 'multi-method researcher',
      task: 'Analyze how different tools complement each other',
      context: args,
      instructions: [
        'Identify pairs of tools that complement each other well',
        'Map which tools reveal what others hide',
        'Identify synergistic tool combinations',
        'Analyze coverage of different tool combinations',
        'Identify redundant tool pairings',
        'Recommend minimum tool sets for comprehensive coverage',
        'Note any antagonistic tool relationships'
      ],
      outputFormat: 'JSON with complementary pairs, synergies, coverage analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['complementaryPairs', 'coverageAnalysis'],
      properties: {
        complementaryPairs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool1: { type: 'string' },
              tool2: { type: 'string' },
              complementarity: { type: 'string' },
              synergy: { type: 'string' }
            }
          }
        },
        synergisticCombinations: { type: 'array', items: { type: 'object' } },
        coverageAnalysis: { type: 'object' },
        redundantPairs: { type: 'array', items: { type: 'object' } },
        minimumToolSet: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tool-as-lens', 'complementarity']
}));

export const identifyArtifactsTask = defineTask('identify-artifacts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Tool-Induced Artifacts',
  agent: {
    name: 'artifact-identifier',
    prompt: {
      role: 'experimental methodologist',
      task: 'Identify artifacts that tools may introduce',
      context: args,
      instructions: [
        'Identify artifacts each tool might create',
        'Distinguish tool artifacts from genuine phenomena',
        'Document conditions under which artifacts appear',
        'Analyze how to detect and correct for artifacts',
        'Identify artifacts that might be mistaken for real effects',
        'Note any tool-induced correlations or patterns',
        'Recommend artifact mitigation strategies'
      ],
      outputFormat: 'JSON with artifacts, detection methods, mitigation strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['artifacts'],
      properties: {
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              artifact: { type: 'string' },
              conditions: { type: 'string' },
              detectionMethod: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        potentialFalsePositives: { type: 'array', items: { type: 'object' } },
        toolInducedCorrelations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tool-as-lens', 'artifacts']
}));

export const recommendToolCombinationsTask = defineTask('recommend-tool-combinations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Recommend Optimal Tool Combinations',
  agent: {
    name: 'tool-combination-advisor',
    prompt: {
      role: 'research strategist',
      task: 'Recommend optimal tool combinations for investigating the phenomenon',
      context: args,
      instructions: [
        'Recommend tool combinations for different research goals',
        'Optimize for coverage, cost, and reliability',
        'Provide rationale for each recommendation',
        'Suggest sequencing of tool application',
        'Identify minimum viable tool combinations',
        'Consider practical constraints',
        'Recommend backup options'
      ],
      outputFormat: 'JSON with recommendations, rationale, sequencing, alternatives'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              tools: { type: 'array', items: { type: 'string' } },
              rationale: { type: 'string' },
              sequence: { type: 'array', items: { type: 'string' } },
              coverage: { type: 'number' }
            }
          }
        },
        minimumViableCombination: { type: 'object' },
        comprehensiveCombination: { type: 'object' },
        backupOptions: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tool-as-lens', 'recommendations']
}));

export const synthesizeMultiToolViewTask = defineTask('synthesize-multi-tool-view', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Multi-Tool View',
  agent: {
    name: 'multi-tool-synthesizer',
    prompt: {
      role: 'integrative scientist',
      task: 'Synthesize insights from all tools into unified understanding',
      context: args,
      instructions: [
        'Integrate what each tool reveals into comprehensive picture',
        'Acknowledge what remains hidden across all tools',
        'Weight evidence by tool reliability and relevance',
        'Resolve apparent contradictions between tools',
        'Create a meta-view that transcends individual tool perspectives',
        'Document confidence levels for different aspects',
        'Identify areas requiring further investigation'
      ],
      outputFormat: 'JSON with synthesis, meta-view, confidence assessment, gaps'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'metaView', 'confidenceAssessment'],
      properties: {
        synthesis: { type: 'string' },
        metaView: { type: 'object' },
        confidenceAssessment: { type: 'object' },
        resolvedContradictions: { type: 'array', items: { type: 'object' } },
        unresolvedTensions: { type: 'array', items: { type: 'object' } },
        knowledgeGaps: { type: 'array', items: { type: 'string' } },
        furtherInvestigation: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tool-as-lens', 'synthesis']
}));
