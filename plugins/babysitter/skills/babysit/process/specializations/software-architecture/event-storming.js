/**
 * @process software-architecture/event-storming
 * @description Collaborative workshop technique for discovering domain events, commands, aggregates, and bounded contexts
 * @inputs { domain: string, scope: string, participantCount: number, workshopDuration: number }
 * @outputs { success: boolean, domainModel: object, boundedContexts: array, artifacts: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domain,
    scope,
    participantCount = 8,
    workshopDuration = 240 // minutes (4 hours default)
  } = inputs;

  // Phase 1: Preparation
  const preparation = await ctx.task(prepareWorkshopTask, {
    domain,
    scope,
    participantCount,
    workshopDuration
  });

  await ctx.breakpoint({
    question: 'Workshop preparation complete. Ready to begin Event Storming session?',
    title: 'Workshop Preparation Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/workshop-agenda.md', format: 'markdown' },
        { path: 'artifacts/participant-guide.md', format: 'markdown' }
      ]
    }
  });

  // Phase 2: Chaotic Exploration (Events Discovery)
  const eventsDiscovery = await ctx.task(chaoticExplorationTask, {
    domain,
    scope,
    preparation
  });

  // Phase 3: Timeline Enforcement
  const timeline = await ctx.task(enforceTimelineTask, {
    domain,
    events: eventsDiscovery.events
  });

  await ctx.breakpoint({
    question: 'Event timeline established. Validate chronological flow and completeness?',
    title: 'Timeline Validation',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/event-timeline.md', format: 'markdown' },
        { path: 'artifacts/event-timeline.json', format: 'json' }
      ]
    }
  });

  // Phase 4: Commands and Actors (Parallel Processing)
  const [commandsResult, actorsResult] = await ctx.parallel.all([
    ctx.task(identifyCommandsTask, {
      domain,
      events: timeline.events
    }),
    ctx.task(identifyActorsTask, {
      domain,
      events: timeline.events
    })
  ]);

  // Phase 5: Aggregate Identification
  const aggregates = await ctx.task(identifyAggregatesTask, {
    domain,
    events: timeline.events,
    commands: commandsResult.commands,
    actors: actorsResult.actors
  });

  // Phase 6: External Systems and Policies (Parallel Processing)
  const [externalSystems, policies] = await ctx.parallel.all([
    ctx.task(identifyExternalSystemsTask, {
      domain,
      events: timeline.events,
      commands: commandsResult.commands
    }),
    ctx.task(identifyPoliciesTask, {
      domain,
      events: timeline.events,
      aggregates: aggregates.aggregates
    })
  ]);

  // Phase 7: Bounded Context Identification
  const boundedContexts = await ctx.task(identifyBoundedContextsTask, {
    domain,
    events: timeline.events,
    aggregates: aggregates.aggregates,
    commands: commandsResult.commands,
    actors: actorsResult.actors
  });

  await ctx.breakpoint({
    question: 'Bounded contexts identified. Review context boundaries and naming?',
    title: 'Bounded Context Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/bounded-contexts.md', format: 'markdown' },
        { path: 'artifacts/context-map.json', format: 'json' }
      ]
    }
  });

  // Phase 8: Documentation and Digitization (Parallel Processing)
  const [domainModel, contextMap, documentation] = await ctx.parallel.all([
    ctx.task(createDomainModelTask, {
      domain,
      events: timeline.events,
      commands: commandsResult.commands,
      actors: actorsResult.actors,
      aggregates: aggregates.aggregates,
      externalSystems: externalSystems.systems,
      policies: policies.policies
    }),
    ctx.task(createContextMapTask, {
      domain,
      boundedContexts: boundedContexts.contexts
    }),
    ctx.task(createDocumentationTask, {
      domain,
      scope,
      events: timeline.events,
      commands: commandsResult.commands,
      actors: actorsResult.actors,
      aggregates: aggregates.aggregates,
      boundedContexts: boundedContexts.contexts,
      externalSystems: externalSystems.systems,
      policies: policies.policies
    })
  ]);

  // Phase 9: Validation and Quality Gates
  const validation = await ctx.task(validateDomainModelTask, {
    domain,
    domainModel: domainModel.model,
    boundedContexts: boundedContexts.contexts,
    targetQuality: 85
  });

  if (validation.score < 85) {
    await ctx.breakpoint({
      question: `Domain model quality score: ${validation.score}/100. Review and refine?`,
      title: 'Quality Gate - Model Validation',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/validation-report.md', format: 'markdown' },
          { path: 'artifacts/quality-issues.json', format: 'json' }
        ]
      }
    });
  }

  return {
    success: true,
    domain,
    scope,
    domainModel: domainModel.model,
    boundedContexts: boundedContexts.contexts,
    artifacts: {
      eventTimeline: timeline.events,
      commands: commandsResult.commands,
      actors: actorsResult.actors,
      aggregates: aggregates.aggregates,
      externalSystems: externalSystems.systems,
      policies: policies.policies,
      contextMap: contextMap.map,
      documentation: documentation.artifacts
    },
    validation: {
      score: validation.score,
      feedback: validation.feedback
    },
    metadata: {
      processId: 'software-architecture/event-storming',
      category: 'Advanced Architecture',
      specializationSlug: 'software-architecture',
      timestamp: ctx.now(),
      participantCount,
      workshopDuration
    }
  };
}

// Task Definitions

export const prepareWorkshopTask = defineTask('prepare-workshop', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prepare Event Storming Workshop: ${args.domain}`,
  agent: {
    name: 'workshop-facilitator',
    prompt: {
      role: 'Expert Event Storming facilitator and Domain-Driven Design practitioner',
      task: 'Prepare comprehensive workshop materials for an Event Storming session',
      context: {
        domain: args.domain,
        scope: args.scope,
        participantCount: args.participantCount,
        duration: args.workshopDuration
      },
      instructions: [
        'Create workshop agenda with time allocations for each phase',
        'Prepare participant guide explaining Event Storming principles and notation',
        'Define domain scope and boundaries for the session',
        'Identify key domain experts and stakeholders to invite',
        'List required materials (sticky notes: orange for events, blue for commands, yellow for actors, large for aggregates, pink for policies, etc.)',
        'Prepare example events from the domain to seed discussion',
        'Create ground rules for collaborative exploration',
        'Design workshop space layout (physical or virtual Miro board)'
      ],
      outputFormat: 'JSON with agenda, participantGuide, materials, exampleEvents, groundRules'
    },
    outputSchema: {
      type: 'object',
      required: ['agenda', 'participantGuide', 'materials'],
      properties: {
        agenda: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'number' },
              activities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        participantGuide: { type: 'string' },
        materials: { type: 'array', items: { type: 'string' } },
        exampleEvents: { type: 'array', items: { type: 'string' } },
        groundRules: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-storming', 'preparation', 'software-architecture']
}));

export const chaoticExplorationTask = defineTask('chaotic-exploration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Chaotic Exploration - Discover Domain Events',
  agent: {
    name: 'domain-explorer',
    prompt: {
      role: 'Domain expert facilitating rapid event discovery',
      task: 'Facilitate chaotic exploration phase to discover all significant domain events',
      context: {
        domain: args.domain,
        scope: args.scope,
        preparation: args.preparation
      },
      instructions: [
        'Guide participants to write domain events in past tense (e.g., "Order Placed", "Payment Received")',
        'Encourage rapid, judgment-free brainstorming - capture everything',
        'Focus on events that happened, not processes or actions',
        'Capture business-significant events, not technical implementation details',
        'Place events on timeline in approximate chronological order',
        'Allow overlapping and parallel event streams',
        'Identify hot spots (areas of confusion, conflict, or high complexity)',
        'Duration: 15-30 minutes of high-energy exploration'
      ],
      outputFormat: 'JSON with events array, hotSpots, and insights'
    },
    outputSchema: {
      type: 'object',
      required: ['events'],
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              approximateOrder: { type: 'number' },
              isHotSpot: { type: 'boolean' }
            }
          }
        },
        hotSpots: { type: 'array', items: { type: 'string' } },
        insights: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-storming', 'exploration', 'domain-events']
}));

export const enforceTimelineTask = defineTask('enforce-timeline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Enforce Timeline - Refine Event Ordering',
  agent: {
    name: 'timeline-organizer',
    prompt: {
      role: 'Process analyst organizing domain events chronologically',
      task: 'Refine and enforce chronological ordering of domain events',
      context: {
        domain: args.domain,
        events: args.events
      },
      instructions: [
        'Walk through events from left to right (start to end)',
        'Identify duplicate events and consolidate',
        'Find gaps in the timeline and identify missing events',
        'Clarify event triggers and sequences',
        'Resolve ordering conflicts through discussion',
        'Group parallel event streams appropriately',
        'Mark critical path events',
        'Document questions and assumptions'
      ],
      outputFormat: 'JSON with refinedEvents (ordered), duplicatesRemoved, missingEvents, assumptions'
    },
    outputSchema: {
      type: 'object',
      required: ['events'],
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              order: { type: 'number' },
              stream: { type: 'string' },
              isCriticalPath: { type: 'boolean' }
            }
          }
        },
        duplicatesRemoved: { type: 'array', items: { type: 'string' } },
        missingEvents: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-storming', 'timeline', 'refinement']
}));

export const identifyCommandsTask = defineTask('identify-commands', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Commands - Triggers for Events',
  agent: {
    name: 'command-identifier',
    prompt: {
      role: 'Domain modeler identifying commands and triggers',
      task: 'Identify commands that trigger each domain event',
      context: {
        domain: args.domain,
        events: args.events
      },
      instructions: [
        'For each event, identify the command that caused it',
        'Commands are in imperative form (e.g., "Place Order" causes "Order Placed")',
        'Commands represent user intentions or system actions',
        'One command can trigger multiple events',
        'Identify command parameters and preconditions',
        'Note validation rules for each command',
        'Distinguish user-initiated commands from system-triggered commands',
        'Document command-event relationships'
      ],
      outputFormat: 'JSON with commands array and commandEventMap'
    },
    outputSchema: {
      type: 'object',
      required: ['commands'],
      properties: {
        commands: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              triggersEvents: { type: 'array', items: { type: 'string' } },
              parameters: { type: 'array', items: { type: 'string' } },
              preconditions: { type: 'array', items: { type: 'string' } },
              isUserInitiated: { type: 'boolean' }
            }
          }
        },
        commandEventMap: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-storming', 'commands', 'domain-modeling']
}));

export const identifyActorsTask = defineTask('identify-actors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Actors - Users and Systems',
  agent: {
    name: 'actor-identifier',
    prompt: {
      role: 'User experience and domain analyst',
      task: 'Identify all actors (users, roles, external systems) that interact with the domain',
      context: {
        domain: args.domain,
        events: args.events
      },
      instructions: [
        'Identify human users by role (e.g., Customer, Admin, Operator)',
        'Identify external systems that trigger commands',
        'Identify automated processes and background jobs',
        'Map actors to the commands they can initiate',
        'Define actor personas with goals and responsibilities',
        'Identify actor decision points',
        'Note access control and authorization requirements',
        'Document actor interactions and handoffs'
      ],
      outputFormat: 'JSON with actors array, actorCommandMap, personas'
    },
    outputSchema: {
      type: 'object',
      required: ['actors'],
      properties: {
        actors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['human', 'system', 'automated'] },
              role: { type: 'string' },
              commands: { type: 'array', items: { type: 'string' } },
              goals: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        actorCommandMap: { type: 'object' },
        personas: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-storming', 'actors', 'user-roles']
}));

export const identifyAggregatesTask = defineTask('identify-aggregates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Aggregates - Consistency Boundaries',
  agent: {
    name: 'aggregate-identifier',
    prompt: {
      role: 'Domain-Driven Design expert identifying aggregates and boundaries',
      task: 'Identify aggregates as consistency boundaries around related events and commands',
      context: {
        domain: args.domain,
        events: args.events,
        commands: args.commands,
        actors: args.actors
      },
      instructions: [
        'Group related events around consistency boundaries (aggregates)',
        'Each aggregate enforces business rules and invariants',
        'Aggregate is the transaction boundary - changes must be consistent',
        'Name aggregates as domain entities (e.g., Order, Customer, Shipment)',
        'Identify aggregate root entity',
        'Define aggregate lifecycle (creation, state changes, completion)',
        'Map commands that operate on each aggregate',
        'Define aggregate boundaries - no cross-aggregate transactions',
        'Identify aggregate relationships (references, not nested objects)'
      ],
      outputFormat: 'JSON with aggregates array, boundaries, lifecycles'
    },
    outputSchema: {
      type: 'object',
      required: ['aggregates'],
      properties: {
        aggregates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              events: { type: 'array', items: { type: 'string' } },
              commands: { type: 'array', items: { type: 'string' } },
              invariants: { type: 'array', items: { type: 'string' } },
              lifecycle: {
                type: 'object',
                properties: {
                  creation: { type: 'string' },
                  states: { type: 'array', items: { type: 'string' } },
                  completion: { type: 'string' }
                }
              }
            }
          }
        },
        boundaries: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-storming', 'aggregates', 'ddd']
}));

export const identifyExternalSystemsTask = defineTask('identify-external-systems', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify External Systems - Integrations',
  agent: {
    name: 'integration-analyzer',
    prompt: {
      role: 'Integration architect mapping external system dependencies',
      task: 'Identify external systems, APIs, and third-party services that integrate with the domain',
      context: {
        domain: args.domain,
        events: args.events,
        commands: args.commands
      },
      instructions: [
        'Identify external systems that the domain depends on',
        'Identify external systems that depend on this domain',
        'Map integration points (API calls, webhooks, message queues)',
        'Define integration contracts and data formats',
        'Identify synchronous vs. asynchronous integrations',
        'Note failure scenarios and error handling',
        'Document SLAs and performance expectations',
        'Identify data ownership and master systems'
      ],
      outputFormat: 'JSON with systems array, integrationPoints, contracts'
    },
    outputSchema: {
      type: 'object',
      required: ['systems'],
      properties: {
        systems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              direction: { type: 'string', enum: ['inbound', 'outbound', 'bidirectional'] },
              integrationType: { type: 'string', enum: ['sync', 'async'] },
              events: { type: 'array', items: { type: 'string' } },
              commands: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        integrationPoints: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-storming', 'external-systems', 'integrations']
}));

export const identifyPoliciesTask = defineTask('identify-policies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Policies - Business Rules and Automation',
  agent: {
    name: 'policy-identifier',
    prompt: {
      role: 'Business analyst identifying policies and automation rules',
      task: 'Identify business policies, rules, and automation that react to domain events',
      context: {
        domain: args.domain,
        events: args.events,
        aggregates: args.aggregates
      },
      instructions: [
        'Identify policies as "whenever X happens, then Y"',
        'Policies connect events to commands (event-driven automation)',
        'Examples: "When order placed, then reserve inventory"',
        'Distinguish policies from aggregate invariants',
        'Policies can span aggregates or bounded contexts',
        'Identify time-based policies and scheduled tasks',
        'Document decision logic and conditionals',
        'Note exception handling and compensating actions'
      ],
      outputFormat: 'JSON with policies array, triggers, actions'
    },
    outputSchema: {
      type: 'object',
      required: ['policies'],
      properties: {
        policies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              trigger: { type: 'string' },
              action: { type: 'string' },
              conditions: { type: 'array', items: { type: 'string' } },
              isAutomated: { type: 'boolean' }
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
  labels: ['agent', 'event-storming', 'policies', 'business-rules']
}));

export const identifyBoundedContextsTask = defineTask('identify-bounded-contexts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Bounded Contexts - Domain Boundaries',
  agent: {
    name: 'context-mapper',
    prompt: {
      role: 'Strategic DDD expert identifying bounded contexts',
      task: 'Identify bounded contexts as cohesive domain boundaries with consistent language',
      context: {
        domain: args.domain,
        events: args.events,
        aggregates: args.aggregates,
        commands: args.commands,
        actors: args.actors
      },
      instructions: [
        'Look for natural boundaries where terminology changes',
        'Group aggregates that share a consistent ubiquitous language',
        'Identify where same word means different things (sign of boundary)',
        'Each bounded context should represent a cohesive subdomain',
        'Define context boundaries based on business capabilities',
        'Name contexts using domain language',
        'Map aggregates to bounded contexts',
        'Identify context relationships (shared kernel, customer-supplier, anticorruption layer)',
        'Define integration patterns between contexts'
      ],
      outputFormat: 'JSON with contexts array, relationships, contextMap'
    },
    outputSchema: {
      type: 'object',
      required: ['contexts'],
      properties: {
        contexts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              aggregates: { type: 'array', items: { type: 'string' } },
              events: { type: 'array', items: { type: 'string' } },
              ubiquitousLanguage: { type: 'array', items: { type: 'object' } },
              responsibilities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              upstream: { type: 'string' },
              downstream: { type: 'string' },
              type: { type: 'string' }
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
  labels: ['agent', 'event-storming', 'bounded-contexts', 'strategic-ddd']
}));

export const createDomainModelTask = defineTask('create-domain-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Domain Model - Comprehensive Documentation',
  agent: {
    name: 'domain-modeler',
    prompt: {
      role: 'Domain architect synthesizing complete domain model',
      task: 'Create comprehensive domain model integrating all event storming artifacts',
      context: args,
      instructions: [
        'Synthesize all artifacts into unified domain model',
        'Create entity-relationship diagram',
        'Document domain model structure',
        'Define relationships between aggregates',
        'Map event flows across the system',
        'Document invariants and business rules',
        'Create glossary of domain terms',
        'Ensure consistency across all artifacts'
      ],
      outputFormat: 'JSON with comprehensive domain model structure'
    },
    outputSchema: {
      type: 'object',
      required: ['model'],
      properties: {
        model: {
          type: 'object',
          properties: {
            entities: { type: 'array' },
            relationships: { type: 'array' },
            eventFlows: { type: 'array' },
            invariants: { type: 'array' },
            glossary: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-storming', 'domain-model', 'synthesis']
}));

export const createContextMapTask = defineTask('create-context-map', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Context Map - Strategic Design',
  agent: {
    name: 'strategic-designer',
    prompt: {
      role: 'Strategic DDD expert creating context maps',
      task: 'Create context map showing bounded context relationships and integration patterns',
      context: {
        domain: args.domain,
        boundedContexts: args.boundedContexts
      },
      instructions: [
        'Create visual context map diagram',
        'Show all bounded contexts',
        'Map relationships with DDD patterns (Shared Kernel, Customer/Supplier, Conformist, ACL, etc.)',
        'Document integration points between contexts',
        'Identify upstream and downstream dependencies',
        'Define team ownership per context',
        'Document translation needs at context boundaries',
        'Create both visual and structured representations'
      ],
      outputFormat: 'JSON with context map data structure and diagram specification'
    },
    outputSchema: {
      type: 'object',
      required: ['map'],
      properties: {
        map: {
          type: 'object',
          properties: {
            contexts: { type: 'array' },
            relationships: { type: 'array' },
            integrationPoints: { type: 'array' },
            teamOwnership: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-storming', 'context-map', 'strategic-ddd']
}));

export const createDocumentationTask = defineTask('create-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Documentation - Artifacts and Reports',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'Technical writer creating comprehensive event storming documentation',
      task: 'Create complete documentation suite from event storming session',
      context: args,
      instructions: [
        'Create executive summary of workshop outcomes',
        'Document complete event catalog with descriptions',
        'Create command reference guide',
        'Document aggregate responsibilities and invariants',
        'Create bounded context handbook with ubiquitous language',
        'Document integration points and external systems',
        'Create visual diagrams (event timeline, context map, aggregate relationships)',
        'Generate implementation roadmap based on findings',
        'Include next steps and recommendations'
      ],
      outputFormat: 'JSON with documentation artifacts (markdown, diagrams, guides)'
    },
    outputSchema: {
      type: 'object',
      required: ['artifacts'],
      properties: {
        artifacts: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            eventCatalog: { type: 'string' },
            commandGuide: { type: 'string' },
            aggregateHandbook: { type: 'string' },
            contextHandbook: { type: 'string' },
            integrationGuide: { type: 'string' },
            implementationRoadmap: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-storming', 'documentation', 'artifacts']
}));

export const validateDomainModelTask = defineTask('validate-domain-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Domain Model - Quality Assessment',
  agent: {
    name: 'quality-validator',
    prompt: {
      role: 'Domain modeling expert performing quality assessment',
      task: 'Validate domain model completeness, consistency, and quality',
      context: {
        domain: args.domain,
        domainModel: args.domainModel,
        boundedContexts: args.boundedContexts,
        targetQuality: args.targetQuality
      },
      instructions: [
        'Assess completeness: Are all key domain concepts captured?',
        'Check consistency: Do relationships and flows make sense?',
        'Validate bounded contexts: Are boundaries clear and well-defined?',
        'Review aggregate boundaries: Are they appropriate transaction boundaries?',
        'Check ubiquitous language: Is terminology consistent within contexts?',
        'Assess integration patterns: Are context relationships appropriate?',
        'Validate against domain scenarios: Can model support key use cases?',
        'Identify gaps, ambiguities, and potential issues',
        'Score overall quality 0-100',
        'Provide actionable recommendations for improvement'
      ],
      outputFormat: 'JSON with quality score, validation results, feedback, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'feedback'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        feedback: { type: 'string' },
        validationResults: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            consistency: { type: 'number' },
            boundaryClarity: { type: 'number' },
            languageConsistency: { type: 'number' }
          }
        },
        issues: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-storming', 'validation', 'quality-gate']
}));
