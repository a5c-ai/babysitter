/**
 * @process methodologies/event-storming
 * @description Event Storming - Workshop-based domain modeling using events, commands, and aggregates
 * @inputs { projectName: string, domainDescription?: string, sessionType?: string, existingModel?: object }
 * @outputs { success: boolean, bigPicture: object, processModels: object, softwareDesign: object, contextMap: object, visualizations: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Event Storming Process
 *
 * Methodology: Alberto Brandolini's Event Storming (2013)
 * Workshop-based method for rapidly exploring complex business domains using
 * sticky notes representing events, commands, aggregates, and bounded contexts.
 *
 * Process Flow:
 * 1. Big Picture Storming - Chaotic exploration of all domain events
 * 2. Process Modeling - Model key processes with commands and policies
 * 3. Software Design - Identify aggregates and bounded contexts
 * 4. Context Mapping - Map relationships between bounded contexts
 * 5. Visualization - Generate diagrams and documentation
 *
 * Three Levels:
 * - Big Picture Event Storming: Understand the entire domain
 * - Process Level Event Storming: Detail specific processes
 * - Software Design Event Storming: Design aggregates and contexts
 *
 * Color Coding:
 * - Orange: Domain Events (past tense: "Order Placed")
 * - Blue: Commands (imperative: "Place Order")
 * - Yellow: Actors/Users (who triggers commands)
 * - Pink: External Systems (third-party services)
 * - Purple: Policies (when event X, then command Y)
 * - Green: Read Models (query models, projections)
 * - Red: Hot Spots (conflicts, questions, problems)
 * - Lilac: Aggregates (clusters of related events)
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project/domain being modeled
 * @param {string} inputs.domainDescription - High-level description of the domain
 * @param {string} inputs.sessionType - Type of session: 'big-picture', 'process-level', or 'full' (default: 'full')
 * @param {object} inputs.existingModel - Optional existing domain model to refine
 * @param {boolean} inputs.skipVisualization - Skip diagram generation (default: false)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with big picture, processes, design, and visualizations
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    domainDescription = '',
    sessionType = 'full',
    existingModel = null,
    skipVisualization = false
  } = inputs;

  // ============================================================================
  // STEP 1: BIG PICTURE STORMING
  // ============================================================================

  const bigPictureResult = await ctx.task(bigPictureStormingTask, {
    projectName,
    domainDescription,
    existingModel: existingModel?.bigPicture || null
  });

  // Breakpoint: Review big picture
  await ctx.breakpoint({
    question: `Review the big picture event storm for "${projectName}". Domain events timeline created with ${bigPictureResult.events.length} events and ${bigPictureResult.hotSpots.length} hot spots identified. Approve to proceed with process modeling?`,
    title: 'Big Picture Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/event-storming/BIG_PICTURE.md', format: 'markdown', label: 'Big Picture Event Storm' },
        { path: 'artifacts/event-storming/events-timeline.json', format: 'code', language: 'json', label: 'Events Timeline' }
      ]
    }
  });

  if (sessionType === 'big-picture') {
    return {
      success: true,
      projectName,
      sessionType: 'big-picture',
      bigPicture: bigPictureResult,
      artifacts: {
        bigPicture: 'artifacts/event-storming/BIG_PICTURE.md',
        timeline: 'artifacts/event-storming/events-timeline.json'
      },
      metadata: {
        processId: 'methodologies/event-storming',
        sessionType,
        timestamp: ctx.now()
      }
    };
  }

  // ============================================================================
  // STEP 2: PROCESS MODELING
  // ============================================================================

  const processModelingResult = await ctx.task(processModelingTask, {
    projectName,
    bigPicture: bigPictureResult,
    domainDescription
  });

  // Breakpoint: Review process models
  await ctx.breakpoint({
    question: `Review the process models for "${projectName}". ${processModelingResult.processes.length} key processes modeled with commands, policies, and read models. Approve to proceed with software design?`,
    title: 'Process Models Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/event-storming/PROCESS_MODELS.md', format: 'markdown', label: 'Process Models' },
        { path: 'artifacts/event-storming/processes.json', format: 'code', language: 'json', label: 'Process Details' }
      ]
    }
  });

  if (sessionType === 'process-level') {
    return {
      success: true,
      projectName,
      sessionType: 'process-level',
      bigPicture: bigPictureResult,
      processModels: processModelingResult,
      artifacts: {
        bigPicture: 'artifacts/event-storming/BIG_PICTURE.md',
        processModels: 'artifacts/event-storming/PROCESS_MODELS.md',
        processes: 'artifacts/event-storming/processes.json'
      },
      metadata: {
        processId: 'methodologies/event-storming',
        sessionType,
        timestamp: ctx.now()
      }
    };
  }

  // ============================================================================
  // STEP 3: SOFTWARE DESIGN
  // ============================================================================

  const softwareDesignResult = await ctx.task(softwareDesignTask, {
    projectName,
    bigPicture: bigPictureResult,
    processModels: processModelingResult
  });

  // Breakpoint: Review software design
  await ctx.breakpoint({
    question: `Review the software design for "${projectName}". ${softwareDesignResult.aggregates.length} aggregates and ${softwareDesignResult.boundedContexts.length} bounded contexts identified. Approve to proceed with context mapping?`,
    title: 'Software Design Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/event-storming/SOFTWARE_DESIGN.md', format: 'markdown', label: 'Software Design' },
        { path: 'artifacts/event-storming/aggregates.json', format: 'code', language: 'json', label: 'Aggregates' },
        { path: 'artifacts/event-storming/bounded-contexts.json', format: 'code', language: 'json', label: 'Bounded Contexts' }
      ]
    }
  });

  // ============================================================================
  // STEP 4: CONTEXT MAPPING
  // ============================================================================

  const contextMappingResult = await ctx.task(contextMappingTask, {
    projectName,
    softwareDesign: softwareDesignResult,
    processModels: processModelingResult
  });

  // Breakpoint: Review context map
  await ctx.breakpoint({
    question: `Review the context map for "${projectName}". ${contextMappingResult.relationships.length} relationships mapped between bounded contexts. Approve to proceed with visualization?`,
    title: 'Context Map Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/event-storming/CONTEXT_MAP.md', format: 'markdown', label: 'Context Map' },
        { path: 'artifacts/event-storming/context-relationships.json', format: 'code', language: 'json', label: 'Context Relationships' }
      ]
    }
  });

  let visualizationResult = null;

  if (!skipVisualization) {
    // ==========================================================================
    // STEP 5: VISUALIZATION
    // ==========================================================================

    visualizationResult = await ctx.task(visualizationTask, {
      projectName,
      bigPicture: bigPictureResult,
      processModels: processModelingResult,
      softwareDesign: softwareDesignResult,
      contextMap: contextMappingResult
    });

    // Final breakpoint
    await ctx.breakpoint({
      question: `Event Storming complete for "${projectName}". Visualizations generated. Review all artifacts and approve to finish?`,
      title: 'Event Storming Complete',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/event-storming/BIG_PICTURE.md', format: 'markdown', label: 'Big Picture' },
          { path: 'artifacts/event-storming/PROCESS_MODELS.md', format: 'markdown', label: 'Process Models' },
          { path: 'artifacts/event-storming/SOFTWARE_DESIGN.md', format: 'markdown', label: 'Software Design' },
          { path: 'artifacts/event-storming/CONTEXT_MAP.md', format: 'markdown', label: 'Context Map' },
          { path: 'artifacts/event-storming/VISUALIZATIONS.md', format: 'markdown', label: 'Visualizations' }
        ]
      }
    });
  }

  return {
    success: true,
    projectName,
    sessionType: 'full',
    bigPicture: bigPictureResult,
    processModels: processModelingResult,
    softwareDesign: softwareDesignResult,
    contextMap: contextMappingResult,
    visualizations: visualizationResult,
    artifacts: {
      bigPicture: 'artifacts/event-storming/BIG_PICTURE.md',
      timeline: 'artifacts/event-storming/events-timeline.json',
      processModels: 'artifacts/event-storming/PROCESS_MODELS.md',
      processes: 'artifacts/event-storming/processes.json',
      softwareDesign: 'artifacts/event-storming/SOFTWARE_DESIGN.md',
      aggregates: 'artifacts/event-storming/aggregates.json',
      boundedContexts: 'artifacts/event-storming/bounded-contexts.json',
      contextMap: 'artifacts/event-storming/CONTEXT_MAP.md',
      contextRelationships: 'artifacts/event-storming/context-relationships.json',
      visualizations: visualizationResult ? 'artifacts/event-storming/VISUALIZATIONS.md' : null
    },
    metadata: {
      processId: 'methodologies/event-storming',
      sessionType,
      eventCount: bigPictureResult.events.length,
      processCount: processModelingResult.processes.length,
      aggregateCount: softwareDesignResult.aggregates.length,
      boundedContextCount: softwareDesignResult.boundedContexts.length,
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Task: Big Picture Storming
 * Chaotic exploration phase - discover all domain events in the system
 */
export const bigPictureStormingTask = defineTask('big-picture-storming', (args, taskCtx) => ({
  kind: 'agent',
  title: `Big Picture Event Storm: ${args.projectName}`,
  agent: {
    name: 'event-storm-facilitator',
    prompt: {
      system: `You are an Event Storming facilitator specializing in Big Picture sessions.

Your task is to facilitate a chaotic exploration phase where you discover ALL domain events in the system.

Event Storming Philosophy:
- Start chaotic, organize later
- Events are past tense (e.g., "Order Placed", "Payment Processed")
- Timeline flows left to right (temporal order)
- Focus on WHAT HAPPENS, not how it happens
- Include both happy path and exceptional events
- Mark conflicts, questions, and problems as hot spots

Big Picture Phase Steps:
1. CHAOTIC EXPLORATION - Dump all events without order
2. ENFORCE TIMELINE - Sort events chronologically
3. IDENTIFY ACTORS - Who/what triggers these events?
4. IDENTIFY EXTERNAL SYSTEMS - Third-party integrations
5. MARK HOT SPOTS - Conflicts, questions, unclear areas

Color Coding:
- Orange: Domain Events (past tense)
- Yellow: Actors/Users
- Pink: External Systems
- Red: Hot Spots (problems, questions)

Generate a comprehensive big picture event storm with:
- Complete list of domain events (chronologically ordered)
- Actors involved in the domain
- External systems that interact with the domain
- Hot spots that need further discussion
- Event clusters (groups of related events)

Output as JSON matching the schema.`,
      messages: [
        {
          role: 'user',
          content: `Facilitate a Big Picture Event Storm for:

Project: ${args.projectName}
Domain Description: ${args.domainDescription || 'Not provided - please infer from project name'}
${args.existingModel ? `Existing Model (refine this): ${JSON.stringify(args.existingModel, null, 2)}` : ''}

Discover ALL domain events, actors, external systems, and hot spots.
Create a comprehensive timeline of what happens in this domain.`
        }
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Event name in past tense (e.g., "Order Placed")' },
              description: { type: 'string' },
              position: { type: 'number', description: 'Position in timeline (0-based)' },
              triggers: { type: 'array', items: { type: 'string' }, description: 'What caused this event' },
              consequences: { type: 'array', items: { type: 'string' }, description: 'What happens after this event' }
            },
            required: ['name', 'description', 'position']
          }
        },
        actors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              interactions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        externalSystems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              interactions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        hotSpots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string', description: 'Where in timeline (event name or phase)' },
              issue: { type: 'string', description: 'What is unclear or problematic' },
              type: { type: 'string', enum: ['conflict', 'question', 'complexity', 'risk'] }
            }
          }
        },
        eventClusters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              events: { type: 'array', items: { type: 'string' } },
              description: { type: 'string' }
            }
          }
        }
      },
      required: ['events', 'actors', 'externalSystems', 'hotSpots']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-storming', 'big-picture']
}));

/**
 * Task: Process Modeling
 * Model key processes with commands, policies, and read models
 */
export const processModelingTask = defineTask('process-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Process Modeling: ${args.projectName}`,
  agent: {
    name: 'process-modeler',
    prompt: {
      system: `You are an Event Storming facilitator specializing in Process Level modeling.

Your task is to take the big picture events and model the key processes in detail.

Process Level Phase:
- Focus on specific processes (not the entire domain)
- Add COMMANDS that trigger events (Blue sticky notes)
- Add POLICIES that react to events (Purple: "When X, then Y")
- Add READ MODELS for queries (Green: data projections)
- Clarify the flow: Command → Aggregate → Event → Policy → Command

Color Coding:
- Blue: Commands (imperative: "Place Order")
- Orange: Domain Events (past tense: "Order Placed")
- Purple: Policies (reactive: "When Order Placed, then Notify Customer")
- Green: Read Models (query models, projections)
- Yellow: Actors
- Pink: External Systems

For each key process, identify:
1. The trigger (command from actor or policy)
2. The events that occur
3. Policies that react to events
4. Read models needed for queries
5. Data flow and dependencies

Output as JSON matching the schema.`,
      messages: [
        {
          role: 'user',
          content: `Model key processes for:

Project: ${args.projectName}
Domain Description: ${args.domainDescription}
Big Picture Events: ${JSON.stringify(args.bigPicture, null, 2)}

Identify key processes and model them in detail with commands, policies, and read models.`
        }
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        processes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              trigger: { type: 'string', description: 'What starts this process' },
              steps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['command', 'event', 'policy', 'read-model'] },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    actor: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        commands: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Command name (imperative)' },
              description: { type: 'string' },
              actor: { type: 'string' },
              triggersEvents: { type: 'array', items: { type: 'string' } },
              requiredData: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        policies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              trigger: { type: 'string', description: 'Event that triggers this policy' },
              action: { type: 'string', description: 'Command that is executed' },
              condition: { type: 'string' }
            }
          }
        },
        readModels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              sourceEvents: { type: 'array', items: { type: 'string' } },
              consumers: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      },
      required: ['processes', 'commands', 'policies', 'readModels']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-storming', 'process-modeling']
}));

/**
 * Task: Software Design
 * Identify aggregates and bounded contexts from events and processes
 */
export const softwareDesignTask = defineTask('software-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Software Design: ${args.projectName}`,
  agent: {
    name: 'software-designer',
    prompt: {
      system: `You are an Event Storming facilitator and DDD expert specializing in Software Design.

Your task is to transition from process models to software design by identifying:
1. AGGREGATES - Clusters of events and commands that form consistency boundaries
2. BOUNDED CONTEXTS - Logical boundaries around domain models
3. COMMAND HANDLERS - Components that process commands
4. EVENT HANDLERS - Components that react to events

Software Design Phase:
- Identify aggregates (Lilac sticky notes)
- An aggregate is a cluster of related events with a consistency boundary
- Each aggregate has a lifecycle (creation → updates → termination)
- Group commands and events by aggregate
- Define bounded contexts (draw boundaries around related aggregates)
- Bounded contexts have their own ubiquitous language

Aggregate Design Principles:
- Single responsibility (one reason to change)
- Consistency boundary (all or nothing)
- Small and focused (not too many events)
- Business-driven (aligns with domain concepts)

Bounded Context Principles:
- Autonomous (can evolve independently)
- Well-defined boundaries
- Own data models
- Own ubiquitous language
- Integration through events or APIs

Output as JSON matching the schema.`,
      messages: [
        {
          role: 'user',
          content: `Design software architecture for:

Project: ${args.projectName}
Big Picture: ${JSON.stringify(args.bigPicture, null, 2)}
Process Models: ${JSON.stringify(args.processModels, null, 2)}

Identify aggregates, bounded contexts, command handlers, and event handlers.`
        }
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        aggregates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              events: { type: 'array', items: { type: 'string' } },
              commands: { type: 'array', items: { type: 'string' } },
              invariants: { type: 'array', items: { type: 'string' }, description: 'Business rules that must always be true' },
              lifecycle: {
                type: 'object',
                properties: {
                  creation: { type: 'string' },
                  updates: { type: 'array', items: { type: 'string' } },
                  termination: { type: 'string' }
                }
              }
            }
          }
        },
        boundedContexts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              aggregates: { type: 'array', items: { type: 'string' } },
              ubiquitousLanguage: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    term: { type: 'string' },
                    definition: { type: 'string' }
                  }
                }
              },
              responsibilities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        commandHandlers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              command: { type: 'string' },
              aggregate: { type: 'string' },
              validations: { type: 'array', items: { type: 'string' } },
              producedEvents: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        eventHandlers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event: { type: 'string' },
              handler: { type: 'string' },
              action: { type: 'string' },
              targetAggregate: { type: 'string' }
            }
          }
        }
      },
      required: ['aggregates', 'boundedContexts', 'commandHandlers', 'eventHandlers']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-storming', 'software-design']
}));

/**
 * Task: Context Mapping
 * Map relationships between bounded contexts
 */
export const contextMappingTask = defineTask('context-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Context Mapping: ${args.projectName}`,
  agent: {
    name: 'context-mapper',
    prompt: {
      system: `You are a Domain-Driven Design expert specializing in Context Mapping.

Your task is to map the relationships between bounded contexts using DDD strategic patterns.

Context Map Patterns:
1. SHARED KERNEL - Two contexts share a subset of the domain model
2. CUSTOMER-SUPPLIER - Upstream context provides API, downstream context consumes
3. CONFORMIST - Downstream context conforms to upstream model
4. ANTI-CORRUPTION LAYER (ACL) - Translation layer to protect from external models
5. OPEN HOST SERVICE - Well-defined API for multiple consumers
6. PUBLISHED LANGUAGE - Standardized format for integration (e.g., JSON schema)
7. PARTNERSHIP - Two teams collaborate on integration
8. SEPARATE WAYS - No integration, contexts are independent

For each pair of bounded contexts, determine:
- Do they need to integrate?
- What is the relationship pattern?
- What data flows between them?
- Who is upstream/downstream?
- What is the integration mechanism? (events, API, shared DB - prefer events)

Output as JSON matching the schema.`,
      messages: [
        {
          role: 'user',
          content: `Map context relationships for:

Project: ${args.projectName}
Software Design: ${JSON.stringify(args.softwareDesign, null, 2)}
Process Models: ${JSON.stringify(args.processModels, null, 2)}

Identify relationships between bounded contexts using DDD strategic patterns.`
        }
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              upstreamContext: { type: 'string' },
              downstreamContext: { type: 'string' },
              pattern: {
                type: 'string',
                enum: ['shared-kernel', 'customer-supplier', 'conformist', 'anti-corruption-layer', 'open-host-service', 'published-language', 'partnership', 'separate-ways']
              },
              description: { type: 'string' },
              integrationMechanism: { type: 'string', enum: ['events', 'api', 'shared-db', 'message-queue', 'none'] },
              dataFlow: { type: 'string' },
              considerations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        integrationPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              contexts: { type: 'array', items: { type: 'string' } },
              mechanism: { type: 'string' },
              events: { type: 'array', items: { type: 'string' } },
              apis: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              context: { type: 'string' },
              recommendation: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        }
      },
      required: ['relationships', 'integrationPoints']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-storming', 'context-mapping']
}));

/**
 * Task: Visualization
 * Generate visual diagrams and documentation artifacts
 */
export const visualizationTask = defineTask('visualization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Visualizations: ${args.projectName}`,
  agent: {
    name: 'visualization-generator',
    prompt: {
      system: `You are a documentation specialist who generates visual artifacts from Event Storming sessions.

Your task is to create various diagram specifications and documentation:

1. Event Timeline Diagram (Mermaid)
   - Show events in chronological order
   - Include actors and external systems
   - Mark hot spots

2. Process Flow Diagrams (Mermaid)
   - For each key process
   - Show commands, events, policies, read models
   - Use proper Event Storming color coding in descriptions

3. Aggregate Diagrams (Mermaid)
   - Show aggregates with their events and commands
   - Show relationships between aggregates

4. Context Map Diagram (Mermaid)
   - Show bounded contexts as boxes
   - Show relationships with labeled arrows
   - Include pattern names

5. Domain Model Summary
   - Text-based comprehensive summary
   - Key concepts and their relationships
   - Implementation recommendations

Generate Mermaid diagram code and markdown documentation.

Output as JSON matching the schema.`,
      messages: [
        {
          role: 'user',
          content: `Generate visualizations and documentation for:

Project: ${args.projectName}
Big Picture: ${JSON.stringify(args.bigPicture, null, 2)}
Process Models: ${JSON.stringify(args.processModels, null, 2)}
Software Design: ${JSON.stringify(args.softwareDesign, null, 2)}
Context Map: ${JSON.stringify(args.contextMap, null, 2)}

Create comprehensive visual diagrams and documentation.`
        }
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        eventTimelineDiagram: { type: 'string', description: 'Mermaid diagram code' },
        processFlowDiagrams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              processName: { type: 'string' },
              diagram: { type: 'string', description: 'Mermaid diagram code' }
            }
          }
        },
        aggregateDiagrams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              aggregateName: { type: 'string' },
              diagram: { type: 'string', description: 'Mermaid diagram code' }
            }
          }
        },
        contextMapDiagram: { type: 'string', description: 'Mermaid diagram code' },
        domainModelSummary: { type: 'string', description: 'Comprehensive markdown summary' },
        implementationRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        }
      },
      required: ['eventTimelineDiagram', 'processFlowDiagrams', 'contextMapDiagram', 'domainModelSummary']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-storming', 'visualization']
}));
