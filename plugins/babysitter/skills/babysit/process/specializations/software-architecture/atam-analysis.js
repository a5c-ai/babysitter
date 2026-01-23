/**
 * @process software-architecture/atam-analysis
 * @description Architecture Trade-off Analysis Method (ATAM) for evaluating software architectures against quality attributes
 * @inputs {
 *   systemName: string,
 *   architectureDocumentation: string,
 *   businessDrivers: string,
 *   qualityAttributes: string[],
 *   stakeholders: string[]
 * }
 * @outputs {
 *   success: boolean,
 *   utilityTree: object,
 *   risks: array,
 *   sensitivities: array,
 *   tradeoffs: array,
 *   report: string
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName = 'System',
    architectureDocumentation = '',
    businessDrivers = '',
    qualityAttributes = ['performance', 'scalability', 'security', 'maintainability'],
    stakeholders = []
  } = inputs;

  const atamResults = {
    systemName,
    timestamp: ctx.now(),
    phases: []
  };

  // Phase 1: Preparation and Method Presentation
  const phase1 = await ctx.task(presentMethodTask, {
    systemName,
    stakeholders
  });
  atamResults.phases.push({ phase: 1, name: 'Method Presentation', result: phase1 });

  await ctx.breakpoint({
    question: 'ATAM method presented to stakeholders. Ready to proceed with business drivers?',
    title: 'Phase 1: Method Presentation Complete',
    context: {
      runId: ctx.runId,
      files: [{ path: `atam/phase-1-method-presentation.md`, format: 'markdown' }]
    }
  });

  // Phase 2: Business Drivers Presentation
  const phase2 = await ctx.task(presentBusinessDriversTask, {
    systemName,
    businessDrivers
  });
  atamResults.phases.push({ phase: 2, name: 'Business Drivers', result: phase2 });

  // Phase 3: Architecture Presentation
  const phase3 = await ctx.task(presentArchitectureTask, {
    systemName,
    architectureDocumentation
  });
  atamResults.phases.push({ phase: 3, name: 'Architecture Presentation', result: phase3 });

  await ctx.breakpoint({
    question: 'Business drivers and architecture presented. Ready to identify architectural approaches?',
    title: 'Phase 2-3: Business Context and Architecture Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: `atam/phase-2-business-drivers.md`, format: 'markdown' },
        { path: `atam/phase-3-architecture.md`, format: 'markdown' }
      ]
    }
  });

  // Phase 4: Identify Architectural Approaches
  const phase4 = await ctx.task(identifyArchitecturalApproachesTask, {
    systemName,
    architectureDocumentation,
    qualityAttributes
  });
  atamResults.phases.push({ phase: 4, name: 'Architectural Approaches', result: phase4 });

  // Phase 5: Generate Quality Attribute Utility Tree
  const phase5 = await ctx.task(generateUtilityTreeTask, {
    systemName,
    businessDrivers,
    qualityAttributes,
    architecturalApproaches: phase4.approaches
  });
  atamResults.utilityTree = phase5.utilityTree;
  atamResults.phases.push({ phase: 5, name: 'Utility Tree', result: phase5 });

  await ctx.breakpoint({
    question: 'Quality Attribute Utility Tree generated. Review and proceed with analysis?',
    title: 'Phase 5: Utility Tree Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: `atam/phase-4-architectural-approaches.md`, format: 'markdown' },
        { path: `atam/phase-5-utility-tree.json`, format: 'json' }
      ]
    }
  });

  // Phase 6: Analyze Architectural Approaches (Initial)
  // Parallel analysis of top priority scenarios
  const topScenarios = phase5.utilityTree.scenarios
    .filter(s => s.priority === 'High')
    .slice(0, 6);

  const phase6Analyses = await ctx.parallel.all(
    topScenarios.map(scenario =>
      ctx.task(analyzeArchitecturalApproachTask, {
        systemName,
        scenario,
        architecturalApproaches: phase4.approaches,
        architectureDocumentation
      })
    )
  );

  const phase6 = {
    scenarios: topScenarios,
    analyses: phase6Analyses,
    risks: [],
    sensitivities: [],
    tradeoffs: []
  };

  // Consolidate findings
  phase6Analyses.forEach(analysis => {
    phase6.risks.push(...analysis.risks);
    phase6.sensitivities.push(...analysis.sensitivities);
    phase6.tradeoffs.push(...analysis.tradeoffs);
  });

  atamResults.phases.push({ phase: 6, name: 'Initial Analysis', result: phase6 });

  await ctx.breakpoint({
    question: `Initial analysis of ${topScenarios.length} high-priority scenarios complete. Proceed to brainstorm additional scenarios?`,
    title: 'Phase 6: Initial Scenario Analysis Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: `atam/phase-6-initial-analysis.md`, format: 'markdown' },
        { path: `atam/phase-6-findings.json`, format: 'json' }
      ]
    }
  });

  // Phase 7: Brainstorm and Prioritize Scenarios
  const phase7 = await ctx.task(brainstormScenariosTask, {
    systemName,
    existingScenarios: phase5.utilityTree.scenarios,
    stakeholders,
    architecturalApproaches: phase4.approaches
  });
  atamResults.phases.push({ phase: 7, name: 'Scenario Brainstorming', result: phase7 });

  await ctx.breakpoint({
    question: `Brainstormed ${phase7.newScenarios.length} additional scenarios. Ready for final analysis?`,
    title: 'Phase 7: Scenario Brainstorming Complete',
    context: {
      runId: ctx.runId,
      files: [{ path: `atam/phase-7-brainstormed-scenarios.json`, format: 'json' }]
    }
  });

  // Phase 8: Analyze Architectural Approaches (Revisited)
  // Parallel analysis of new high-priority scenarios
  const newTopScenarios = phase7.newScenarios
    .filter(s => s.priority === 'High')
    .slice(0, 6);

  const phase8Analyses = await ctx.parallel.all(
    newTopScenarios.map(scenario =>
      ctx.task(analyzeArchitecturalApproachTask, {
        systemName,
        scenario,
        architecturalApproaches: phase4.approaches,
        architectureDocumentation
      })
    )
  );

  const phase8 = {
    scenarios: newTopScenarios,
    analyses: phase8Analyses,
    risks: [],
    sensitivities: [],
    tradeoffs: []
  };

  // Consolidate findings
  phase8Analyses.forEach(analysis => {
    phase8.risks.push(...analysis.risks);
    phase8.sensitivities.push(...analysis.sensitivities);
    phase8.tradeoffs.push(...analysis.tradeoffs);
  });

  atamResults.phases.push({ phase: 8, name: 'Revisited Analysis', result: phase8 });

  // Combine all findings
  atamResults.risks = [...phase6.risks, ...phase8.risks];
  atamResults.sensitivities = [...phase6.sensitivities, ...phase8.sensitivities];
  atamResults.tradeoffs = [...phase6.tradeoffs, ...phase8.tradeoffs];

  // Phase 9: Present Results
  const phase9 = await ctx.task(presentResultsTask, {
    systemName,
    utilityTree: phase5.utilityTree,
    architecturalApproaches: phase4.approaches,
    risks: atamResults.risks,
    sensitivities: atamResults.sensitivities,
    tradeoffs: atamResults.tradeoffs,
    totalScenarios: topScenarios.length + newTopScenarios.length
  });

  atamResults.phases.push({ phase: 9, name: 'Results Presentation', result: phase9 });
  atamResults.report = phase9.report;
  atamResults.recommendations = phase9.recommendations;

  await ctx.breakpoint({
    question: 'ATAM analysis complete. Review final report?',
    title: 'Phase 9: ATAM Results Ready',
    context: {
      runId: ctx.runId,
      files: [
        { path: `atam/phase-8-revisited-analysis.md`, format: 'markdown' },
        { path: `atam/phase-9-final-report.md`, format: 'markdown' },
        { path: `atam/atam-results.json`, format: 'json' }
      ]
    }
  });

  return {
    success: true,
    processId: 'software-architecture/atam-analysis',
    systemName,
    utilityTree: phase5.utilityTree,
    architecturalApproaches: phase4.approaches,
    risks: atamResults.risks,
    sensitivities: atamResults.sensitivities,
    tradeoffs: atamResults.tradeoffs,
    report: phase9.report,
    recommendations: phase9.recommendations,
    phases: atamResults.phases,
    metadata: {
      timestamp: ctx.now(),
      totalScenarios: topScenarios.length + newTopScenarios.length,
      totalRisks: atamResults.risks.length,
      totalSensitivities: atamResults.sensitivities.length,
      totalTradeoffs: atamResults.tradeoffs.length
    }
  };
}

// Task Definitions

export const presentMethodTask = defineTask('present-method', (args, taskCtx) => ({
  kind: 'agent',
  title: `Present ATAM Method for ${args.systemName}`,
  agent: {
    name: 'atam-facilitator',
    prompt: {
      role: 'ATAM facilitator and architecture evaluation expert',
      task: 'Present the ATAM method to stakeholders',
      context: {
        systemName: args.systemName,
        stakeholders: args.stakeholders
      },
      instructions: [
        'Explain ATAM purpose: evaluate architecture against quality attributes',
        'Describe the 9-phase ATAM process',
        'Explain key concepts: utility tree, scenarios, sensitivity points, tradeoff points, risks',
        'Set expectations for stakeholder participation',
        'Outline expected outcomes and timeline',
        'Address stakeholder questions and concerns'
      ],
      outputFormat: 'JSON with presentation summary, stakeholder questions answered, and readiness assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'keyPoints', 'stakeholderReadiness'],
      properties: {
        summary: { type: 'string', description: 'Method presentation summary' },
        keyPoints: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key ATAM concepts explained'
        },
        stakeholderQuestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' }
            }
          }
        },
        stakeholderReadiness: { type: 'boolean', description: 'Are stakeholders ready to proceed?' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'atam', 'phase-1', 'presentation']
}));

export const presentBusinessDriversTask = defineTask('present-business-drivers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Present Business Drivers for ${args.systemName}`,
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'business analyst and architect',
      task: 'Present and analyze business drivers for the system',
      context: {
        systemName: args.systemName,
        businessDrivers: args.businessDrivers
      },
      instructions: [
        'Identify key business goals and objectives',
        'Document critical business requirements',
        'Identify constraints (budget, timeline, technical, organizational)',
        'Map business drivers to potential quality attributes',
        'Prioritize business drivers by importance',
        'Identify key stakeholders and their concerns'
      ],
      outputFormat: 'JSON with business drivers, constraints, stakeholder concerns, and quality attribute implications'
    },
    outputSchema: {
      type: 'object',
      required: ['businessGoals', 'constraints', 'qualityAttributeImplications'],
      properties: {
        businessGoals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              priority: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] },
              rationale: { type: 'string' }
            }
          }
        },
        constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['Budget', 'Timeline', 'Technical', 'Organizational', 'Regulatory'] },
              description: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        stakeholderConcerns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              concern: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        qualityAttributeImplications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              businessDriver: { type: 'string' },
              qualityAttribute: { type: 'string' },
              reasoning: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'atam', 'phase-2', 'business-drivers']
}));

export const presentArchitectureTask = defineTask('present-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Present Architecture for ${args.systemName}`,
  agent: {
    name: 'architect',
    prompt: {
      role: 'software architect',
      task: 'Present the system architecture',
      context: {
        systemName: args.systemName,
        architectureDocumentation: args.architectureDocumentation
      },
      instructions: [
        'Present high-level architecture overview (context, containers, components)',
        'Explain key architectural decisions and rationale',
        'Describe technology stack and platform choices',
        'Identify major architectural patterns used (microservices, event-driven, layered, etc.)',
        'Explain how architecture addresses key use cases',
        'Highlight areas of architectural concern or uncertainty'
      ],
      outputFormat: 'JSON with architecture summary, key decisions, patterns, technology stack, and concerns'
    },
    outputSchema: {
      type: 'object',
      required: ['architectureSummary', 'keyDecisions', 'patterns', 'technologyStack'],
      properties: {
        architectureSummary: { type: 'string', description: 'High-level architecture description' },
        keyDecisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              rationale: { type: 'string' },
              alternatives: { type: 'string' }
            }
          }
        },
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              application: { type: 'string' },
              benefits: { type: 'array', items: { type: 'string' } },
              tradeoffs: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        technologyStack: {
          type: 'object',
          properties: {
            frontend: { type: 'array', items: { type: 'string' } },
            backend: { type: 'array', items: { type: 'string' } },
            data: { type: 'array', items: { type: 'string' } },
            infrastructure: { type: 'array', items: { type: 'string' } }
          }
        },
        concerns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Areas of architectural uncertainty or concern'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'atam', 'phase-3', 'architecture']
}));

export const identifyArchitecturalApproachesTask = defineTask('identify-architectural-approaches', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Architectural Approaches for ${args.systemName}`,
  agent: {
    name: 'architecture-analyst',
    prompt: {
      role: 'architecture analyst',
      task: 'Identify and catalog architectural approaches used in the system',
      context: {
        systemName: args.systemName,
        architectureDocumentation: args.architectureDocumentation,
        qualityAttributes: args.qualityAttributes
      },
      instructions: [
        'Identify architectural styles and patterns (microservices, event-driven, layered, etc.)',
        'Document architectural tactics for each quality attribute',
        'Identify specific mechanisms (caching, load balancing, circuit breakers, etc.)',
        'Map approaches to quality attributes they support',
        'Document any known limitations or risks of each approach',
        'Catalog at least 5-10 distinct architectural approaches'
      ],
      outputFormat: 'JSON with architectural approaches mapped to quality attributes'
    },
    outputSchema: {
      type: 'object',
      required: ['approaches'],
      properties: {
        approaches: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'name', 'description', 'qualityAttributes'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['Style', 'Pattern', 'Tactic', 'Mechanism'] },
              description: { type: 'string' },
              qualityAttributes: {
                type: 'array',
                items: { type: 'string' }
              },
              benefits: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'string' } },
              implementationDetails: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'atam', 'phase-4', 'architectural-approaches']
}));

export const generateUtilityTreeTask = defineTask('generate-utility-tree', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Quality Attribute Utility Tree for ${args.systemName}`,
  agent: {
    name: 'quality-attributes-expert',
    prompt: {
      role: 'quality attributes specialist',
      task: 'Generate a quality attribute utility tree with prioritized scenarios',
      context: {
        systemName: args.systemName,
        businessDrivers: args.businessDrivers,
        qualityAttributes: args.qualityAttributes,
        architecturalApproaches: args.architecturalApproaches
      },
      instructions: [
        'Create utility tree with quality attributes as root',
        'For each quality attribute, identify specific quality attribute refinements (e.g., Performance -> Latency, Throughput)',
        'For each refinement, create 2-3 concrete scenarios',
        'Each scenario must have: stimulus, environment, response, and response measure',
        'Prioritize scenarios: High (H), Medium (M), Low (L) for business importance and architectural difficulty',
        'Focus on scenarios that are critical (H,H) or important (H,M or M,H)',
        'Generate at least 15-20 scenarios total across all quality attributes'
      ],
      outputFormat: 'JSON with hierarchical utility tree and prioritized scenarios'
    },
    outputSchema: {
      type: 'object',
      required: ['utilityTree', 'scenarios'],
      properties: {
        utilityTree: {
          type: 'object',
          description: 'Hierarchical quality attribute tree',
          properties: {
            qualityAttributes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  refinements: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        scenarioIds: { type: 'array', items: { type: 'string' } }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'qualityAttribute', 'refinement', 'stimulus', 'response', 'measure'],
            properties: {
              id: { type: 'string' },
              qualityAttribute: { type: 'string' },
              refinement: { type: 'string' },
              description: { type: 'string' },
              stimulus: { type: 'string', description: 'What triggers the scenario' },
              environment: { type: 'string', description: 'System state when stimulus occurs' },
              response: { type: 'string', description: 'How system should respond' },
              measure: { type: 'string', description: 'Quantifiable success criteria' },
              priority: { type: 'string', enum: ['High', 'Medium', 'Low'] },
              businessImportance: { type: 'string', enum: ['H', 'M', 'L'] },
              architecturalDifficulty: { type: 'string', enum: ['H', 'M', 'L'] }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'atam', 'phase-5', 'utility-tree']
}));

export const analyzeArchitecturalApproachTask = defineTask('analyze-architectural-approach', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Scenario: ${args.scenario.id}`,
  agent: {
    name: 'architecture-evaluator',
    prompt: {
      role: 'architecture evaluation expert',
      task: 'Analyze how architectural approaches support a specific quality attribute scenario',
      context: {
        systemName: args.systemName,
        scenario: args.scenario,
        architecturalApproaches: args.architecturalApproaches,
        architectureDocumentation: args.architectureDocumentation
      },
      instructions: [
        'Identify which architectural approaches are relevant to this scenario',
        'Analyze how well the architecture satisfies the scenario',
        'Identify sensitivity points: architectural decisions critical to achieving the quality attribute',
        'Identify tradeoff points: decisions that affect multiple quality attributes',
        'Identify risks: architectural decisions with uncertain outcomes or potential issues',
        'Provide reasoning and evidence for each finding',
        'Rate overall scenario support: Strong, Adequate, Weak, Insufficient'
      ],
      outputFormat: 'JSON with scenario analysis, sensitivity points, tradeoff points, and risks'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarioId', 'analysis', 'support'],
      properties: {
        scenarioId: { type: 'string' },
        relevantApproaches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              approachId: { type: 'string' },
              relevance: { type: 'string' },
              contribution: { type: 'string' }
            }
          }
        },
        analysis: { type: 'string', description: 'Detailed analysis of how architecture supports scenario' },
        support: {
          type: 'string',
          enum: ['Strong', 'Adequate', 'Weak', 'Insufficient'],
          description: 'Overall architectural support for scenario'
        },
        sensitivities: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'decision', 'impact'],
            properties: {
              id: { type: 'string' },
              decision: { type: 'string' },
              qualityAttribute: { type: 'string' },
              impact: { type: 'string' },
              reasoning: { type: 'string' }
            }
          }
        },
        tradeoffs: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'decision', 'affects'],
            properties: {
              id: { type: 'string' },
              decision: { type: 'string' },
              affects: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    qualityAttribute: { type: 'string' },
                    effect: { type: 'string', enum: ['Positive', 'Negative', 'Neutral'] }
                  }
                }
              },
              reasoning: { type: 'string' }
            }
          }
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'risk', 'severity'],
            properties: {
              id: { type: 'string' },
              risk: { type: 'string' },
              severity: { type: 'string', enum: ['High', 'Medium', 'Low'] },
              likelihood: { type: 'string', enum: ['High', 'Medium', 'Low'] },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'atam', 'phase-6', 'phase-8', 'analysis']
}));

export const brainstormScenariosTask = defineTask('brainstorm-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  title: `Brainstorm Additional Scenarios for ${args.systemName}`,
  agent: {
    name: 'scenario-brainstormer',
    prompt: {
      role: 'stakeholder facilitator and scenario expert',
      task: 'Facilitate brainstorming of additional quality attribute scenarios',
      context: {
        systemName: args.systemName,
        existingScenarios: args.existingScenarios,
        stakeholders: args.stakeholders,
        architecturalApproaches: args.architecturalApproaches
      },
      instructions: [
        'Review existing scenarios to avoid duplication',
        'Generate new scenarios from stakeholder perspectives (end users, operators, developers, security)',
        'Focus on edge cases, failure scenarios, and operational scenarios',
        'Include scenarios for: availability, modifiability, testability, usability, security',
        'Each scenario must have: stimulus, environment, response, measure',
        'Prioritize using business importance and architectural difficulty',
        'Generate 10-15 new scenarios',
        'Ensure scenarios are concrete, testable, and relevant'
      ],
      outputFormat: 'JSON with new scenarios following same structure as utility tree scenarios'
    },
    outputSchema: {
      type: 'object',
      required: ['newScenarios'],
      properties: {
        newScenarios: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'qualityAttribute', 'stimulus', 'response', 'measure'],
            properties: {
              id: { type: 'string' },
              qualityAttribute: { type: 'string' },
              refinement: { type: 'string' },
              description: { type: 'string' },
              stimulus: { type: 'string' },
              environment: { type: 'string' },
              response: { type: 'string' },
              measure: { type: 'string' },
              priority: { type: 'string', enum: ['High', 'Medium', 'Low'] },
              businessImportance: { type: 'string', enum: ['H', 'M', 'L'] },
              architecturalDifficulty: { type: 'string', enum: ['H', 'M', 'L'] },
              source: { type: 'string', description: 'Stakeholder or perspective that raised scenario' }
            }
          }
        },
        stakeholderInput: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              concerns: { type: 'array', items: { type: 'string' } },
              scenariosGenerated: { type: 'number' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'atam', 'phase-7', 'brainstorming']
}));

export const presentResultsTask = defineTask('present-results', (args, taskCtx) => ({
  kind: 'agent',
  title: `Present ATAM Results for ${args.systemName}`,
  agent: {
    name: 'atam-facilitator',
    prompt: {
      role: 'ATAM facilitator and technical communicator',
      task: 'Synthesize and present ATAM evaluation results',
      context: {
        systemName: args.systemName,
        utilityTree: args.utilityTree,
        architecturalApproaches: args.architecturalApproaches,
        risks: args.risks,
        sensitivities: args.sensitivities,
        tradeoffs: args.tradeoffs,
        totalScenarios: args.totalScenarios
      },
      instructions: [
        'Create executive summary of ATAM findings',
        'Summarize quality attribute utility tree',
        'Present architectural approaches identified',
        'Highlight key sensitivity points (critical to quality attributes)',
        'Highlight key tradeoff points (affecting multiple attributes)',
        'Categorize risks by severity: Critical, High, Medium, Low',
        'Identify risk themes (common patterns across risks)',
        'Provide prioritized recommendations for architectural improvements',
        'Create action plan with owners and timelines',
        'Generate comprehensive ATAM report in markdown format'
      ],
      outputFormat: 'JSON with executive summary, findings categorization, and full markdown report'
    },
    outputSchema: {
      type: 'object',
      required: ['executiveSummary', 'report', 'recommendations'],
      properties: {
        executiveSummary: {
          type: 'object',
          properties: {
            overallAssessment: { type: 'string' },
            keyStrengths: { type: 'array', items: { type: 'string' } },
            keyWeaknesses: { type: 'array', items: { type: 'string' } },
            criticalRisks: { type: 'number' },
            highPrioritySensitivities: { type: 'number' },
            significantTradeoffs: { type: 'number' }
          }
        },
        riskThemes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              description: { type: 'string' },
              affectedScenarios: { type: 'array', items: { type: 'string' } },
              severity: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'recommendation', 'priority'],
            properties: {
              id: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] },
              rationale: { type: 'string' },
              affectedQualityAttributes: { type: 'array', items: { type: 'string' } },
              estimatedEffort: { type: 'string' },
              suggestedOwner: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        report: {
          type: 'string',
          description: 'Full ATAM report in markdown format including all sections: executive summary, methodology, findings, risks, sensitivities, tradeoffs, recommendations, and conclusion'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'atam', 'phase-9', 'results']
}));
