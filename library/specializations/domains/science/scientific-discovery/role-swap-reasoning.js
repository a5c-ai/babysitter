/**
 * @process domains/science/scientific-discovery/role-swap-reasoning
 * @description Role Swap Reasoning: Swap roles of components to discover plausible reassignments
 * @inputs {
 *   system: string,
 *   components: array,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   roleSwaps: array,
 *   plausibleReassignments: array,
 *   insights: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    system,
    components = [],
    domain = 'general science',
    swapDepth = 'comprehensive'
  } = inputs;

  const startTime = ctx.now();
  const roleSwaps = [];
  const plausibleReassignments = [];

  // Phase 1: Analyze System and Component Roles
  ctx.log('info', 'Analyzing system structure and component roles');
  const systemAnalysis = await ctx.task(analyzeSystemRolesTask, {
    system,
    components,
    domain
  });

  // Phase 2: Generate Role Swap Scenarios
  ctx.log('info', 'Generating role swap scenarios');
  const swapScenarios = await ctx.task(generateSwapScenariosTask, {
    systemAnalysis,
    domain,
    swapDepth
  });

  // Phase 3: Evaluate Each Swap Scenario
  ctx.log('info', 'Evaluating role swap scenarios');
  for (const scenario of swapScenarios.scenarios) {
    const evaluation = await ctx.task(evaluateSwapScenarioTask, {
      system,
      systemAnalysis,
      scenario,
      domain
    });

    roleSwaps.push({
      scenario,
      evaluation,
      timestamp: ctx.now()
    });

    if (evaluation.plausibility >= 50) {
      plausibleReassignments.push({
        scenario,
        evaluation,
        potential: evaluation.potential
      });
    }
  }

  await ctx.breakpoint({
    question: `Evaluated ${roleSwaps.length} swaps, found ${plausibleReassignments.length} plausible. Review findings?`,
    title: 'Role Swap Reasoning - Evaluation Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/role-swaps.json', format: 'json' },
        { path: 'artifacts/plausible-reassignments.json', format: 'json' }
      ]
    }
  });

  // Phase 4: Analyze Plausible Reassignments
  ctx.log('info', 'Analyzing plausible reassignments in depth');
  const reassignmentAnalysis = await ctx.task(analyzeReassignmentsTask, {
    system,
    plausibleReassignments,
    systemAnalysis,
    domain
  });

  // Phase 5: Identify Design Principles
  ctx.log('info', 'Identifying design principles from role swaps');
  const designPrinciples = await ctx.task(extractDesignPrinciplesTask, {
    roleSwaps,
    plausibleReassignments,
    reassignmentAnalysis,
    domain
  });

  // Phase 6: Synthesize Insights
  ctx.log('info', 'Synthesizing insights from role swap reasoning');
  const synthesis = await ctx.task(synthesizeRoleSwapInsightsTask, {
    system,
    systemAnalysis,
    roleSwaps,
    plausibleReassignments,
    reassignmentAnalysis,
    designPrinciples,
    domain
  });

  return {
    success: true,
    processId: 'domains/science/scientific-discovery/role-swap-reasoning',
    system,
    domain,
    systemAnalysis,
    roleSwaps,
    plausibleReassignments,
    reassignmentAnalysis,
    designPrinciples,
    insights: synthesis.insights,
    synthesis,
    metadata: {
      totalSwapsEvaluated: roleSwaps.length,
      plausibleCount: plausibleReassignments.length,
      swapDepth,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const analyzeSystemRolesTask = defineTask('analyze-system-roles', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze System and Component Roles',
  agent: {
    name: 'role-analyst',
    prompt: {
      role: 'systems analyst',
      task: 'Analyze the system structure and identify component roles',
      context: args,
      instructions: [
        'Identify all components and their current roles',
        'Document the function each component performs',
        'Map relationships and dependencies between components',
        'Identify role constraints and requirements',
        'Document what qualifies a component for its role',
        'Identify role-defining properties',
        'Map the role network'
      ],
      outputFormat: 'JSON with components, roles, relationships, constraints'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'roles', 'relationships'],
      properties: {
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              currentRole: { type: 'string' },
              properties: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              function: { type: 'string' },
              requirements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        relationships: { type: 'array', items: { type: 'object' } },
        roleNetwork: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'role-swap', 'analysis']
}));

export const generateSwapScenariosTask = defineTask('generate-swap-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Role Swap Scenarios',
  agent: {
    name: 'scenario-generator',
    prompt: {
      role: 'creative systems designer',
      task: 'Generate potential role swap scenarios',
      context: args,
      instructions: [
        'Generate pairwise role swaps between components',
        'Consider multi-component role rotations',
        'Include complete role inversions',
        'Consider partial role transfers',
        'Generate novel role combinations',
        'Include seemingly absurd swaps (may reveal insights)',
        'Prioritize by potential interest'
      ],
      outputFormat: 'JSON with swap scenarios, types, rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios'],
      properties: {
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              componentsInvolved: { type: 'array', items: { type: 'string' } },
              originalRoles: { type: 'object' },
              swappedRoles: { type: 'object' },
              rationale: { type: 'string' }
            }
          }
        },
        swapCategories: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'role-swap', 'generation']
}));

export const evaluateSwapScenarioTask = defineTask('evaluate-swap-scenario', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate Swap: ${args.scenario.id}`,
  agent: {
    name: 'swap-evaluator',
    prompt: {
      role: 'systems evaluator',
      task: 'Evaluate the plausibility and implications of a role swap',
      context: args,
      instructions: [
        'Assess whether components could perform swapped roles',
        'Identify what changes would be needed',
        'Evaluate system behavior under swap',
        'Rate plausibility 0-100',
        'Identify potential benefits of swap',
        'Identify potential problems of swap',
        'Assess what we learn from considering this swap'
      ],
      outputFormat: 'JSON with plausibility, changes needed, benefits, problems, learnings'
    },
    outputSchema: {
      type: 'object',
      required: ['plausibility', 'changesNeeded'],
      properties: {
        plausibility: { type: 'number', minimum: 0, maximum: 100 },
        changesNeeded: { type: 'array', items: { type: 'string' } },
        systemBehavior: { type: 'string' },
        benefits: { type: 'array', items: { type: 'string' } },
        problems: { type: 'array', items: { type: 'string' } },
        potential: { type: 'string' },
        learnings: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'role-swap', 'evaluation']
}));

export const analyzeReassignmentsTask = defineTask('analyze-reassignments', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Plausible Reassignments',
  agent: {
    name: 'reassignment-analyst',
    prompt: {
      role: 'systems redesign specialist',
      task: 'Deeply analyze the plausible role reassignments',
      context: args,
      instructions: [
        'Analyze each plausible reassignment in detail',
        'Identify the minimal changes for viability',
        'Explore the design space of reassignments',
        'Find common patterns across plausible swaps',
        'Identify surprising plausibility findings',
        'Assess implementation feasibility',
        'Rank reassignments by potential value'
      ],
      outputFormat: 'JSON with detailed analysis, patterns, rankings'
    },
    outputSchema: {
      type: 'object',
      required: ['detailedAnalyses', 'patterns'],
      properties: {
        detailedAnalyses: { type: 'array', items: { type: 'object' } },
        minimalChanges: { type: 'array', items: { type: 'object' } },
        patterns: { type: 'array', items: { type: 'string' } },
        surprisingFindings: { type: 'array', items: { type: 'string' } },
        feasibilityRankings: { type: 'array', items: { type: 'object' } },
        valueRankings: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'role-swap', 'reassignment-analysis']
}));

export const extractDesignPrinciplesTask = defineTask('extract-design-principles', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract Design Principles',
  agent: {
    name: 'principle-extractor',
    prompt: {
      role: 'design theorist',
      task: 'Extract design principles from role swap analysis',
      context: args,
      instructions: [
        'Identify what makes role assignments work or fail',
        'Extract principles about role flexibility',
        'Identify role-component compatibility rules',
        'Document modularity and replaceability principles',
        'Identify principles about functional redundancy',
        'Extract design guidelines for robust systems',
        'Document anti-patterns in role assignment'
      ],
      outputFormat: 'JSON with principles, rules, guidelines, anti-patterns'
    },
    outputSchema: {
      type: 'object',
      required: ['principles'],
      properties: {
        principles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              principle: { type: 'string' },
              explanation: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        compatibilityRules: { type: 'array', items: { type: 'object' } },
        modularityInsights: { type: 'array', items: { type: 'string' } },
        designGuidelines: { type: 'array', items: { type: 'string' } },
        antiPatterns: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'role-swap', 'principles']
}));

export const synthesizeRoleSwapInsightsTask = defineTask('synthesize-role-swap-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Role Swap Insights',
  agent: {
    name: 'insight-synthesizer',
    prompt: {
      role: 'systems theorist',
      task: 'Synthesize insights from role swap reasoning',
      context: args,
      instructions: [
        'Integrate all findings into coherent insights',
        'Identify what role swapping reveals about the system',
        'Document implications for system design',
        'Identify flexibility vs rigidity in role assignments',
        'Generate recommendations for system improvement',
        'Note open questions raised by analysis',
        'Create comprehensive synthesis'
      ],
      outputFormat: 'JSON with synthesis, insights, implications, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'insights'],
      properties: {
        synthesis: { type: 'string' },
        insights: { type: 'array', items: { type: 'string' } },
        systemRevelations: { type: 'array', items: { type: 'string' } },
        designImplications: { type: 'array', items: { type: 'string' } },
        flexibilityAnalysis: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        openQuestions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'role-swap', 'synthesis']
}));
