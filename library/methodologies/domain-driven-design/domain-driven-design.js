/**
 * @process methodologies/domain-driven-design
 * @description Domain-Driven Design (DDD) - Strategic and tactical design patterns for complex business domains
 * @inputs { projectName: string, domainDescription?: string, complexity?: string, phase?: string }
 * @outputs { success: boolean, strategicDesign: object, tacticalDesign: object, domainModel: object, ubiquitousLanguage: object, implementation: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Domain-Driven Design Process
 *
 * Eric Evans' DDD Methodology: Place the business domain at the center of development,
 * providing both strategic patterns for organizing large systems and tactical patterns
 * for modeling domain logic.
 *
 * Four-Phase DDD Cycle:
 * 1. Strategic Design - Identify subdomains, define bounded contexts, create context maps
 * 2. Tactical Design - Model entities, value objects, aggregates, repositories, services
 * 3. Ubiquitous Language - Build shared vocabulary between domain experts and developers
 * 4. Implementation - Apply DDD patterns in code with continuous refinement
 *
 * Supports: Core/Supporting/Generic subdomain identification, bounded contexts, event-driven architecture
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project/domain
 * @param {string} inputs.domainDescription - High-level description of the business domain
 * @param {string} inputs.complexity - Domain complexity level: simple|moderate|complex (default: moderate)
 * @param {string} inputs.phase - Starting phase: strategic|tactical|full (default: full)
 * @param {string} inputs.existingDomainModel - Path to existing domain model (for refinement)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with domain model, bounded contexts, and implementation
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    domainDescription = '',
    complexity = 'moderate',
    phase = 'full',
    existingDomainModel = null
  } = inputs;

  const results = {
    projectName,
    complexity,
    strategicDesign: null,
    tacticalDesign: null,
    ubiquitousLanguage: null,
    domainEvents: null,
    implementation: null
  };

  // ============================================================================
  // PHASE 1: STRATEGIC DESIGN (PROBLEM SPACE)
  // ============================================================================

  if (phase === 'strategic' || phase === 'full') {
    // Step 1.1: Identify Subdomains
    const subdomainResult = await ctx.task(identifySubdomainsTask, {
      projectName,
      domainDescription,
      complexity,
      existingDomainModel
    });

    results.strategicDesign = { subdomains: subdomainResult };

    // Breakpoint: Review subdomain identification
    await ctx.breakpoint({
      question: `Review subdomain classification for "${projectName}". Core domains are key differentiators, Supporting domains are necessary but not core, and Generic domains can use off-the-shelf solutions. Approve to continue?`,
      title: 'Subdomain Classification Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/ddd/SUBDOMAINS.md', format: 'markdown', label: 'Subdomain Analysis' },
          { path: 'artifacts/ddd/subdomain-map.json', format: 'code', language: 'json', label: 'Subdomain Map' }
        ]
      }
    });

    // Step 1.2: Define Bounded Contexts
    const boundedContextResult = await ctx.task(defineBoundedContextsTask, {
      projectName,
      subdomains: subdomainResult,
      domainDescription,
      complexity
    });

    results.strategicDesign.boundedContexts = boundedContextResult;

    // Step 1.3: Create Context Map
    const contextMapResult = await ctx.task(createContextMapTask, {
      projectName,
      boundedContexts: boundedContextResult,
      subdomains: subdomainResult
    });

    results.strategicDesign.contextMap = contextMapResult;

    // Breakpoint: Review strategic design
    await ctx.breakpoint({
      question: `Review strategic design for "${projectName}". Bounded contexts define clear boundaries with integration patterns (Shared Kernel, Customer/Supplier, Anti-Corruption Layer, etc.). Approve to proceed with tactical design?`,
      title: 'Strategic Design Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/ddd/BOUNDED_CONTEXTS.md', format: 'markdown', label: 'Bounded Contexts' },
          { path: 'artifacts/ddd/CONTEXT_MAP.md', format: 'markdown', label: 'Context Map' },
          { path: 'artifacts/ddd/context-relationships.json', format: 'code', language: 'json', label: 'Context Relationships' }
        ]
      }
    });

    // Step 1.4: Build Ubiquitous Language (Initial)
    const initialLanguageResult = await ctx.task(buildUbiquitousLanguageTask, {
      projectName,
      domainDescription,
      boundedContexts: boundedContextResult,
      subdomains: subdomainResult,
      phase: 'initial'
    });

    results.ubiquitousLanguage = initialLanguageResult;
  }

  // ============================================================================
  // PHASE 2: TACTICAL DESIGN (SOLUTION SPACE)
  // ============================================================================

  if (phase === 'tactical' || phase === 'full') {
    // If starting from tactical, load existing strategic design
    if (phase === 'tactical' && existingDomainModel) {
      const loadedModel = await ctx.task(loadDomainModelTask, {
        existingDomainModel
      });
      results.strategicDesign = loadedModel.strategicDesign;
      results.ubiquitousLanguage = loadedModel.ubiquitousLanguage;
    }

    const boundedContexts = results.strategicDesign?.boundedContexts?.contexts || [];

    // Process each bounded context in parallel
    const tacticalResults = await ctx.parallel.all(
      boundedContexts.map(context => async () => {
        // Step 2.1: Identify Entities and Value Objects
        const entityVOResult = await ctx.task(identifyEntitiesValueObjectsTask, {
          projectName,
          boundedContext: context,
          ubiquitousLanguage: results.ubiquitousLanguage,
          domainDescription
        });

        // Step 2.2: Define Aggregates
        const aggregateResult = await ctx.task(defineAggregatesTask, {
          projectName,
          boundedContext: context,
          entities: entityVOResult.entities,
          valueObjects: entityVOResult.valueObjects,
          ubiquitousLanguage: results.ubiquitousLanguage
        });

        // Step 2.3: Design Repositories
        const repositoryResult = await ctx.task(designRepositoriesTask, {
          projectName,
          boundedContext: context,
          aggregates: aggregateResult.aggregates
        });

        // Step 2.4: Identify Domain Services
        const domainServiceResult = await ctx.task(identifyDomainServicesTask, {
          projectName,
          boundedContext: context,
          entities: entityVOResult.entities,
          aggregates: aggregateResult.aggregates,
          ubiquitousLanguage: results.ubiquitousLanguage
        });

        return {
          contextName: context.name,
          entities: entityVOResult.entities,
          valueObjects: entityVOResult.valueObjects,
          aggregates: aggregateResult.aggregates,
          repositories: repositoryResult.repositories,
          domainServices: domainServiceResult.services
        };
      })
    );

    results.tacticalDesign = {
      contexts: tacticalResults
    };

    // Breakpoint: Review tactical design
    await ctx.breakpoint({
      question: `Review tactical design patterns for "${projectName}". Entities, Value Objects, Aggregates, Repositories, and Domain Services defined for ${boundedContexts.length} bounded context(s). Approve to proceed with domain events?`,
      title: 'Tactical Design Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/ddd/TACTICAL_DESIGN.md', format: 'markdown', label: 'Tactical Design' },
          { path: 'artifacts/ddd/domain-model.json', format: 'code', language: 'json', label: 'Domain Model' },
          { path: 'artifacts/ddd/aggregates.md', format: 'markdown', label: 'Aggregate Design' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 3: DOMAIN EVENT MODELING
  // ============================================================================

  if (phase === 'full') {
    // Step 3.1: Identify Domain Events
    const domainEventResult = await ctx.task(identifyDomainEventsTask, {
      projectName,
      strategicDesign: results.strategicDesign,
      tacticalDesign: results.tacticalDesign,
      ubiquitousLanguage: results.ubiquitousLanguage
    });

    // Step 3.2: Model Event Handlers and Eventual Consistency
    const eventHandlerResult = await ctx.task(modelEventHandlersTask, {
      projectName,
      domainEvents: domainEventResult.events,
      boundedContexts: results.strategicDesign.boundedContexts.contexts,
      tacticalDesign: results.tacticalDesign
    });

    results.domainEvents = {
      events: domainEventResult.events,
      handlers: eventHandlerResult.handlers,
      eventualConsistency: eventHandlerResult.consistencyPatterns
    };

    // Breakpoint: Review domain events
    await ctx.breakpoint({
      question: `Review domain event model for "${projectName}". ${domainEventResult.events.length} domain events identified with handlers and eventual consistency patterns. Approve to proceed with implementation?`,
      title: 'Domain Event Model Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/ddd/DOMAIN_EVENTS.md', format: 'markdown', label: 'Domain Events' },
          { path: 'artifacts/ddd/event-flow.json', format: 'code', language: 'json', label: 'Event Flow' },
          { path: 'artifacts/ddd/event-handlers.md', format: 'markdown', label: 'Event Handlers' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 4: UBIQUITOUS LANGUAGE REFINEMENT
  // ============================================================================

  if (phase === 'full') {
    // Refine ubiquitous language based on tactical design
    const refinedLanguageResult = await ctx.task(buildUbiquitousLanguageTask, {
      projectName,
      domainDescription,
      boundedContexts: results.strategicDesign.boundedContexts,
      subdomains: results.strategicDesign.subdomains,
      tacticalDesign: results.tacticalDesign,
      domainEvents: results.domainEvents,
      phase: 'refined'
    });

    results.ubiquitousLanguage = refinedLanguageResult;

    // Validate language consistency across artifacts
    const languageValidation = await ctx.task(validateLanguageConsistencyTask, {
      projectName,
      ubiquitousLanguage: results.ubiquitousLanguage,
      strategicDesign: results.strategicDesign,
      tacticalDesign: results.tacticalDesign,
      domainEvents: results.domainEvents
    });

    if (!languageValidation.consistent) {
      await ctx.breakpoint({
        question: `Language consistency check found misalignments. ${languageValidation.issues.length} issues detected. Review and approve resolution?`,
        title: 'Ubiquitous Language Consistency Check',
        context: {
          runId: ctx.runId,
          files: [
            { path: 'artifacts/ddd/LANGUAGE_ISSUES.md', format: 'markdown', label: 'Consistency Issues' },
            { path: 'artifacts/ddd/UBIQUITOUS_LANGUAGE.md', format: 'markdown', label: 'Ubiquitous Language' }
          ]
        }
      });
    }
  }

  // ============================================================================
  // PHASE 5: IMPLEMENTATION PLANNING
  // ============================================================================

  if (phase === 'full' && inputs.generateImplementation !== false) {
    const boundedContexts = results.strategicDesign?.boundedContexts?.contexts || [];

    // Generate implementation plan for each bounded context
    const implementationPlans = await ctx.parallel.all(
      boundedContexts.map(context => async () => {
        const contextTactical = results.tacticalDesign.contexts.find(
          tc => tc.contextName === context.name
        );

        return await ctx.task(generateImplementationTask, {
          projectName,
          boundedContext: context,
          tacticalDesign: contextTactical,
          domainEvents: results.domainEvents,
          ubiquitousLanguage: results.ubiquitousLanguage,
          contextMap: results.strategicDesign.contextMap
        });
      })
    );

    results.implementation = {
      plans: implementationPlans
    };

    // Breakpoint: Review implementation plan
    await ctx.breakpoint({
      question: `Review implementation plan for "${projectName}". Module structure, API boundaries, anti-corruption layers, and integration patterns defined. Approve final DDD model?`,
      title: 'Implementation Plan Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/ddd/IMPLEMENTATION_PLAN.md', format: 'markdown', label: 'Implementation Plan' },
          { path: 'artifacts/ddd/module-structure.json', format: 'code', language: 'json', label: 'Module Structure' },
          { path: 'artifacts/ddd/api-boundaries.md', format: 'markdown', label: 'API Boundaries' }
        ]
      }
    });
  }

  // ============================================================================
  // FINAL VALIDATION
  // ============================================================================

  // Validate complete DDD model
  const finalValidation = await ctx.task(validateDomainModelTask, {
    projectName,
    strategicDesign: results.strategicDesign,
    tacticalDesign: results.tacticalDesign,
    ubiquitousLanguage: results.ubiquitousLanguage,
    domainEvents: results.domainEvents,
    implementation: results.implementation
  });

  // Final breakpoint
  await ctx.breakpoint({
    question: `Domain-Driven Design complete for "${projectName}". Model validation: ${finalValidation.valid}. Review complete domain model and approve?`,
    title: 'DDD Model Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/ddd/DDD_SUMMARY.md', format: 'markdown', label: 'DDD Summary' },
        { path: 'artifacts/ddd/SUBDOMAINS.md', format: 'markdown', label: 'Subdomains' },
        { path: 'artifacts/ddd/BOUNDED_CONTEXTS.md', format: 'markdown', label: 'Bounded Contexts' },
        { path: 'artifacts/ddd/CONTEXT_MAP.md', format: 'markdown', label: 'Context Map' },
        { path: 'artifacts/ddd/TACTICAL_DESIGN.md', format: 'markdown', label: 'Tactical Design' },
        { path: 'artifacts/ddd/DOMAIN_EVENTS.md', format: 'markdown', label: 'Domain Events' },
        { path: 'artifacts/ddd/UBIQUITOUS_LANGUAGE.md', format: 'markdown', label: 'Ubiquitous Language' },
        { path: 'artifacts/ddd/IMPLEMENTATION_PLAN.md', format: 'markdown', label: 'Implementation Plan' }
      ]
    }
  });

  return {
    success: finalValidation.valid,
    projectName,
    complexity,
    phase,
    strategicDesign: results.strategicDesign,
    tacticalDesign: results.tacticalDesign,
    ubiquitousLanguage: results.ubiquitousLanguage,
    domainEvents: results.domainEvents,
    implementation: results.implementation,
    validation: finalValidation,
    artifacts: {
      summary: 'artifacts/ddd/DDD_SUMMARY.md',
      subdomains: 'artifacts/ddd/SUBDOMAINS.md',
      boundedContexts: 'artifacts/ddd/BOUNDED_CONTEXTS.md',
      contextMap: 'artifacts/ddd/CONTEXT_MAP.md',
      tacticalDesign: 'artifacts/ddd/TACTICAL_DESIGN.md',
      domainEvents: 'artifacts/ddd/DOMAIN_EVENTS.md',
      ubiquitousLanguage: 'artifacts/ddd/UBIQUITOUS_LANGUAGE.md',
      implementationPlan: 'artifacts/ddd/IMPLEMENTATION_PLAN.md'
    },
    metadata: {
      processId: 'methodologies/domain-driven-design',
      timestamp: ctx.now(),
      methodology: 'Domain-Driven Design (Eric Evans)',
      version: '1.0.0'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Task: Identify Subdomains
 * Classify domain into Core, Supporting, and Generic subdomains
 */
export const identifySubdomainsTask = defineTask('identify-subdomains', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify subdomains: ${args.projectName}`,
  description: 'Classify business domain into Core, Supporting, and Generic subdomains',

  agent: {
    name: 'ddd-strategic-designer',
    prompt: {
      role: 'DDD strategic designer and domain expert',
      task: 'Analyze the business domain and identify subdomains',
      context: {
        projectName: args.projectName,
        domainDescription: args.domainDescription,
        complexity: args.complexity,
        existingDomainModel: args.existingDomainModel
      },
      instructions: [
        'Analyze the business domain and break it into subdomains',
        'Classify each subdomain as Core (key differentiator), Supporting (necessary but not core), or Generic (commodity)',
        'Core domains should receive the most investment and attention',
        'Supporting domains can be custom-built but with less focus on perfection',
        'Generic domains should use off-the-shelf solutions when possible',
        'Identify dependencies and relationships between subdomains',
        'Consider business value, competitive advantage, and complexity',
        'Document rationale for each classification'
      ],
      outputFormat: 'JSON with subdomain classifications, dependencies, and strategic recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['subdomains', 'recommendations'],
      properties: {
        subdomains: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'type', 'description', 'businessValue'],
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['core', 'supporting', 'generic'] },
              description: { type: 'string' },
              businessValue: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              complexity: { type: 'string', enum: ['high', 'medium', 'low'] },
              competitiveAdvantage: { type: 'boolean' },
              rationale: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendations: {
          type: 'object',
          properties: {
            coreInvestment: { type: 'string' },
            genericSolutions: { type: 'array', items: { type: 'string' } },
            riskAreas: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'ddd', 'strategic-design', 'subdomains']
}));

/**
 * Task: Define Bounded Contexts
 * Establish clear boundaries where models are consistent
 */
export const defineBoundedContextsTask = defineTask('define-bounded-contexts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define bounded contexts: ${args.projectName}`,
  description: 'Establish bounded contexts with clear boundaries and responsibilities',

  agent: {
    name: 'ddd-context-mapper',
    prompt: {
      role: 'DDD context mapper and architect',
      task: 'Define bounded contexts for the domain',
      context: {
        projectName: args.projectName,
        subdomains: args.subdomains,
        domainDescription: args.domainDescription,
        complexity: args.complexity
      },
      instructions: [
        'Define bounded contexts - areas where a model and language are consistently used',
        'Each bounded context should have a clear responsibility and boundary',
        'Map subdomains to bounded contexts (may be 1:1 or multiple subdomains per context)',
        'Define the scope and responsibilities of each context',
        'Identify the team ownership for each context',
        'Consider organizational structure and communication patterns (Conway\'s Law)',
        'Define what is inside vs outside each context',
        'Document context boundaries clearly'
      ],
      outputFormat: 'JSON with bounded context definitions, boundaries, and ownership'
    },
    outputSchema: {
      type: 'object',
      required: ['contexts'],
      properties: {
        contexts: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'responsibility', 'scope', 'subdomains'],
            properties: {
              name: { type: 'string' },
              responsibility: { type: 'string' },
              scope: { type: 'string' },
              subdomains: { type: 'array', items: { type: 'string' } },
              teamOwnership: { type: 'string' },
              keyEntities: { type: 'array', items: { type: 'string' } },
              externalDependencies: { type: 'array', items: { type: 'string' } },
              publicInterface: { type: 'string' },
              boundaries: {
                type: 'object',
                properties: {
                  inside: { type: 'array', items: { type: 'string' } },
                  outside: { type: 'array', items: { type: 'string' } }
                }
              }
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

  labels: ['agent', 'ddd', 'strategic-design', 'bounded-contexts']
}));

/**
 * Task: Create Context Map
 * Map relationships between bounded contexts
 */
export const createContextMapTask = defineTask('create-context-map', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create context map: ${args.projectName}`,
  description: 'Map relationships and integration patterns between bounded contexts',

  agent: {
    name: 'ddd-integration-architect',
    prompt: {
      role: 'DDD integration architect',
      task: 'Create context map showing relationships between bounded contexts',
      context: {
        projectName: args.projectName,
        boundedContexts: args.boundedContexts,
        subdomains: args.subdomains
      },
      instructions: [
        'Map relationships between bounded contexts',
        'Identify integration patterns: Shared Kernel, Customer/Supplier, Conformist, Anti-Corruption Layer, Open Host Service, Published Language, Separate Ways, Partnership',
        'Shared Kernel: Two contexts share a subset of the model',
        'Customer/Supplier: Downstream context (customer) depends on upstream (supplier)',
        'Conformist: Downstream conforms to upstream model',
        'Anti-Corruption Layer: Downstream protects itself from upstream changes',
        'Open Host Service: Upstream provides well-defined service interface',
        'Published Language: Shared language for integration (e.g., events, APIs)',
        'Separate Ways: No integration needed',
        'Partnership: Two teams work together on integration',
        'Document data flow and communication patterns',
        'Identify potential integration risks and mitigation strategies'
      ],
      outputFormat: 'JSON with context relationships, integration patterns, and data flows'
    },
    outputSchema: {
      type: 'object',
      required: ['relationships', 'integrationPatterns'],
      properties: {
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            required: ['upstream', 'downstream', 'pattern', 'description'],
            properties: {
              upstream: { type: 'string' },
              downstream: { type: 'string' },
              pattern: {
                type: 'string',
                enum: [
                  'shared-kernel',
                  'customer-supplier',
                  'conformist',
                  'anti-corruption-layer',
                  'open-host-service',
                  'published-language',
                  'separate-ways',
                  'partnership'
                ]
              },
              description: { type: 'string' },
              dataFlow: { type: 'string' },
              communicationPattern: { type: 'string', enum: ['synchronous', 'asynchronous', 'batch', 'none'] },
              risks: { type: 'array', items: { type: 'string' } },
              mitigation: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        integrationPatterns: {
          type: 'object',
          properties: {
            sharedKernels: { type: 'array', items: { type: 'string' } },
            antiCorruptionLayers: { type: 'array', items: { type: 'string' } },
            openHostServices: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'ddd', 'strategic-design', 'context-map']
}));

/**
 * Task: Build Ubiquitous Language
 * Create shared vocabulary between domain experts and developers
 */
export const buildUbiquitousLanguageTask = defineTask('build-ubiquitous-language', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build ubiquitous language: ${args.projectName}`,
  description: 'Create shared vocabulary glossary for domain experts and developers',

  agent: {
    name: 'ddd-language-curator',
    prompt: {
      role: 'DDD language curator and domain expert liaison',
      task: `Build ${args.phase || 'initial'} ubiquitous language glossary`,
      context: {
        projectName: args.projectName,
        domainDescription: args.domainDescription,
        boundedContexts: args.boundedContexts,
        subdomains: args.subdomains,
        tacticalDesign: args.tacticalDesign,
        domainEvents: args.domainEvents,
        phase: args.phase
      },
      instructions: [
        'Extract key domain terms from domain description and design artifacts',
        'Define each term precisely in business language',
        'Avoid technical jargon - use language domain experts use',
        'Ensure terms are used consistently across all artifacts',
        'Group terms by bounded context',
        'Identify terms with different meanings in different contexts',
        'Document synonyms and similar terms',
        'Include examples of proper usage',
        'Mark terms that appear in code/models',
        'Flag ambiguous terms that need clarification'
      ],
      outputFormat: 'JSON with glossary terms organized by bounded context'
    },
    outputSchema: {
      type: 'object',
      required: ['glossary', 'contextSpecificTerms'],
      properties: {
        glossary: {
          type: 'array',
          items: {
            type: 'object',
            required: ['term', 'definition', 'context'],
            properties: {
              term: { type: 'string' },
              definition: { type: 'string' },
              context: { type: 'string' },
              synonyms: { type: 'array', items: { type: 'string' } },
              examples: { type: 'array', items: { type: 'string' } },
              usedInCode: { type: 'boolean' },
              relatedTerms: { type: 'array', items: { type: 'string' } },
              ambiguities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        contextSpecificTerms: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        clarificationNeeded: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              issue: { type: 'string' }
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

  labels: ['agent', 'ddd', 'ubiquitous-language', args.phase || 'initial']
}));

/**
 * Task: Identify Entities and Value Objects
 * Model entities with identity and value objects without identity
 */
export const identifyEntitiesValueObjectsTask = defineTask('identify-entities-value-objects', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify entities/VOs: ${args.boundedContext.name}`,
  description: 'Identify entities (with identity) and value objects (without identity)',

  agent: {
    name: 'ddd-tactical-modeler',
    prompt: {
      role: 'DDD tactical designer and domain modeler',
      task: 'Identify entities and value objects for bounded context',
      context: {
        projectName: args.projectName,
        boundedContext: args.boundedContext,
        ubiquitousLanguage: args.ubiquitousLanguage,
        domainDescription: args.domainDescription
      },
      instructions: [
        'Identify entities - objects with unique identity that persist over time',
        'Entities should have identity (ID) and lifecycle',
        'Identify value objects - immutable objects without identity',
        'Value objects are defined by their attributes, not ID',
        'Value objects should be immutable and replaceable',
        'Use value objects for concepts like Money, Address, DateRange, etc.',
        'Entities should reference value objects, not other way around',
        'Define attributes and behavior for each entity/value object',
        'Use ubiquitous language terms consistently',
        'Consider invariants and business rules'
      ],
      outputFormat: 'JSON with entities and value objects, their attributes and behaviors'
    },
    outputSchema: {
      type: 'object',
      required: ['entities', 'valueObjects'],
      properties: {
        entities: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'description', 'identity', 'attributes'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              identity: { type: 'string' },
              attributes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    required: { type: 'boolean' }
                  }
                }
              },
              behaviors: { type: 'array', items: { type: 'string' } },
              invariants: { type: 'array', items: { type: 'string' } },
              lifecycle: { type: 'string' }
            }
          }
        },
        valueObjects: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'description', 'attributes'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              attributes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' }
                  }
                }
              },
              immutable: { type: 'boolean' },
              validations: { type: 'array', items: { type: 'string' } }
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

  labels: ['agent', 'ddd', 'tactical-design', 'entities', args.boundedContext.name]
}));

/**
 * Task: Define Aggregates
 * Group entities and value objects into aggregates with consistency boundaries
 */
export const defineAggregatesTask = defineTask('define-aggregates', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define aggregates: ${args.boundedContext.name}`,
  description: 'Define aggregates with clear boundaries and consistency rules',

  agent: {
    name: 'ddd-aggregate-designer',
    prompt: {
      role: 'DDD aggregate designer',
      task: 'Define aggregates for bounded context',
      context: {
        projectName: args.projectName,
        boundedContext: args.boundedContext,
        entities: args.entities,
        valueObjects: args.valueObjects,
        ubiquitousLanguage: args.ubiquitousLanguage
      },
      instructions: [
        'Group entities and value objects into aggregates',
        'Each aggregate has one root entity (aggregate root)',
        'Aggregate root is the only entry point to the aggregate',
        'Aggregates enforce consistency boundaries',
        'All changes to the aggregate go through the root',
        'Aggregate boundaries define transaction boundaries',
        'Keep aggregates small and focused',
        'External entities reference aggregates by ID only',
        'Define invariants that the aggregate must maintain',
        'Consider aggregate size and performance implications'
      ],
      outputFormat: 'JSON with aggregate definitions, roots, boundaries, and invariants'
    },
    outputSchema: {
      type: 'object',
      required: ['aggregates'],
      properties: {
        aggregates: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'rootEntity', 'members', 'invariants'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              rootEntity: { type: 'string' },
              members: {
                type: 'object',
                properties: {
                  entities: { type: 'array', items: { type: 'string' } },
                  valueObjects: { type: 'array', items: { type: 'string' } }
                }
              },
              invariants: { type: 'array', items: { type: 'string' } },
              boundaries: { type: 'string' },
              externalReferences: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    aggregateName: { type: 'string' },
                    referenceType: { type: 'string', enum: ['id-only', 'denormalized'] }
                  }
                }
              },
              commandHandlers: { type: 'array', items: { type: 'string' } },
              domainEvents: { type: 'array', items: { type: 'string' } }
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

  labels: ['agent', 'ddd', 'tactical-design', 'aggregates', args.boundedContext.name]
}));

/**
 * Task: Design Repositories
 * Abstract persistence for aggregates
 */
export const designRepositoriesTask = defineTask('design-repositories', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design repositories: ${args.boundedContext.name}`,
  description: 'Design repository interfaces for aggregate persistence',

  agent: {
    name: 'ddd-repository-designer',
    prompt: {
      role: 'DDD repository designer',
      task: 'Design repository interfaces for aggregates',
      context: {
        projectName: args.projectName,
        boundedContext: args.boundedContext,
        aggregates: args.aggregates
      },
      instructions: [
        'Create one repository per aggregate root',
        'Repository provides collection-like interface',
        'Define methods: add, remove, findById, findBy[criteria]',
        'Repositories abstract persistence mechanism',
        'Use domain language in repository methods',
        'Keep repositories focused on aggregate lifecycle',
        'Avoid exposing database details',
        'Consider query needs (simple vs complex)',
        'Document repository responsibilities'
      ],
      outputFormat: 'JSON with repository interfaces and method definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['repositories'],
      properties: {
        repositories: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'aggregateRoot', 'methods'],
            properties: {
              name: { type: 'string' },
              aggregateRoot: { type: 'string' },
              description: { type: 'string' },
              methods: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    parameters: { type: 'array', items: { type: 'string' } },
                    returnType: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              },
              queryMethods: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    criteria: { type: 'string' },
                    returnType: { type: 'string' }
                  }
                }
              }
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

  labels: ['agent', 'ddd', 'tactical-design', 'repositories', args.boundedContext.name]
}));

/**
 * Task: Identify Domain Services
 * Operations that don't belong to entities
 */
export const identifyDomainServicesTask = defineTask('identify-domain-services', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify domain services: ${args.boundedContext.name}`,
  description: 'Identify domain services for operations that don\'t belong to entities',

  agent: {
    name: 'ddd-service-identifier',
    prompt: {
      role: 'DDD domain service identifier',
      task: 'Identify domain services for bounded context',
      context: {
        projectName: args.projectName,
        boundedContext: args.boundedContext,
        entities: args.entities,
        aggregates: args.aggregates,
        ubiquitousLanguage: args.ubiquitousLanguage
      },
      instructions: [
        'Identify operations that don\'t naturally belong to an entity or value object',
        'Domain services for operations involving multiple aggregates',
        'Services for complex calculations or transformations',
        'Services should be stateless',
        'Name services using ubiquitous language (verbs from domain)',
        'Avoid creating services for operations that belong to entities',
        'Keep services focused on domain logic, not infrastructure',
        'Document when to use a service vs entity method'
      ],
      outputFormat: 'JSON with domain service definitions and operations'
    },
    outputSchema: {
      type: 'object',
      required: ['services'],
      properties: {
        services: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'description', 'operations'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              purpose: { type: 'string' },
              stateless: { type: 'boolean' },
              operations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    parameters: { type: 'array', items: { type: 'string' } },
                    returnType: { type: 'string' },
                    description: { type: 'string' },
                    aggregatesInvolved: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
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

  labels: ['agent', 'ddd', 'tactical-design', 'services', args.boundedContext.name]
}));

/**
 * Task: Identify Domain Events
 * Significant occurrences in the domain
 */
export const identifyDomainEventsTask = defineTask('identify-domain-events', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify domain events: ${args.projectName}`,
  description: 'Identify significant domain events that occur in the system',

  agent: {
    name: 'ddd-event-modeler',
    prompt: {
      role: 'DDD event modeling expert',
      task: 'Identify domain events across all bounded contexts',
      context: {
        projectName: args.projectName,
        strategicDesign: args.strategicDesign,
        tacticalDesign: args.tacticalDesign,
        ubiquitousLanguage: args.ubiquitousLanguage
      },
      instructions: [
        'Identify significant occurrences in the domain (past tense)',
        'Events represent facts that have happened',
        'Name events using past tense: OrderPlaced, PaymentProcessed, UserRegistered',
        'Events are immutable - they represent history',
        'Events can trigger reactions in other aggregates/contexts',
        'Consider events for state changes, business milestones, integration',
        'Events should contain all data needed by subscribers',
        'Organize events by aggregate root that publishes them',
        'Consider event sourcing for critical aggregates'
      ],
      outputFormat: 'JSON with domain events, publishers, and event data'
    },
    outputSchema: {
      type: 'object',
      required: ['events'],
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'description', 'publisher', 'data'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              publisher: {
                type: 'object',
                properties: {
                  context: { type: 'string' },
                  aggregate: { type: 'string' }
                }
              },
              trigger: { type: 'string' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    type: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              },
              subscribers: { type: 'array', items: { type: 'string' } },
              integrationEvent: { type: 'boolean' }
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

  labels: ['agent', 'ddd', 'domain-events', 'event-modeling']
}));

/**
 * Task: Model Event Handlers
 * Define how events are handled and eventual consistency patterns
 */
export const modelEventHandlersTask = defineTask('model-event-handlers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model event handlers: ${args.projectName}`,
  description: 'Design event handlers and eventual consistency patterns',

  agent: {
    name: 'ddd-event-handler-designer',
    prompt: {
      role: 'DDD event-driven architecture designer',
      task: 'Design event handlers and eventual consistency patterns',
      context: {
        projectName: args.projectName,
        domainEvents: args.domainEvents,
        boundedContexts: args.boundedContexts,
        tacticalDesign: args.tacticalDesign
      },
      instructions: [
        'Design event handlers for each domain event',
        'Handlers can be in same or different bounded context',
        'Define eventual consistency patterns between aggregates',
        'Use saga pattern for long-running transactions across aggregates',
        'Consider idempotency for event handlers',
        'Handle event ordering and replay scenarios',
        'Design compensation logic for failures',
        'Document consistency guarantees and trade-offs'
      ],
      outputFormat: 'JSON with event handlers, sagas, and consistency patterns'
    },
    outputSchema: {
      type: 'object',
      required: ['handlers', 'consistencyPatterns'],
      properties: {
        handlers: {
          type: 'array',
          items: {
            type: 'object',
            required: ['event', 'handler', 'action'],
            properties: {
              event: { type: 'string' },
              handler: {
                type: 'object',
                properties: {
                  context: { type: 'string' },
                  component: { type: 'string' }
                }
              },
              action: { type: 'string' },
              idempotent: { type: 'boolean' },
              compensationLogic: { type: 'string' }
            }
          }
        },
        sagas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              compensations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        consistencyPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              contexts: { type: 'array', items: { type: 'string' } },
              guarantee: { type: 'string' },
              tradeoffs: { type: 'string' }
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

  labels: ['agent', 'ddd', 'domain-events', 'event-handlers']
}));

/**
 * Task: Validate Language Consistency
 * Ensure ubiquitous language is used consistently
 */
export const validateLanguageConsistencyTask = defineTask('validate-language-consistency', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate language consistency: ${args.projectName}`,
  description: 'Validate ubiquitous language consistency across all artifacts',

  agent: {
    name: 'ddd-language-validator',
    prompt: {
      role: 'DDD language consistency validator',
      task: 'Validate ubiquitous language consistency',
      context: {
        projectName: args.projectName,
        ubiquitousLanguage: args.ubiquitousLanguage,
        strategicDesign: args.strategicDesign,
        tacticalDesign: args.tacticalDesign,
        domainEvents: args.domainEvents
      },
      instructions: [
        'Check that terms from ubiquitous language are used consistently',
        'Verify entities, value objects, services use defined terms',
        'Check for synonyms that should be unified',
        'Identify technical jargon that should be replaced with domain terms',
        'Verify terms are used in correct bounded context',
        'Flag terms used differently in different contexts',
        'Recommend corrections and improvements'
      ],
      outputFormat: 'JSON with consistency check results and issues'
    },
    outputSchema: {
      type: 'object',
      required: ['consistent', 'issues'],
      properties: {
        consistent: { type: 'boolean' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['inconsistent-usage', 'synonym', 'technical-jargon', 'missing-definition', 'context-confusion'] },
              term: { type: 'string' },
              description: { type: 'string' },
              locations: { type: 'array', items: { type: 'string' } },
              recommendation: { type: 'string' }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            totalTerms: { type: 'number' },
            inconsistentTerms: { type: 'number' },
            missingDefinitions: { type: 'number' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'ddd', 'validation', 'language-consistency']
}));

/**
 * Task: Generate Implementation
 * Generate implementation plan for bounded context
 */
export const generateImplementationTask = defineTask('generate-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate implementation: ${args.boundedContext.name}`,
  description: 'Generate implementation plan for bounded context',

  agent: {
    name: 'ddd-implementation-planner',
    prompt: {
      role: 'DDD implementation architect',
      task: 'Generate implementation plan for bounded context',
      context: {
        projectName: args.projectName,
        boundedContext: args.boundedContext,
        tacticalDesign: args.tacticalDesign,
        domainEvents: args.domainEvents,
        ubiquitousLanguage: args.ubiquitousLanguage,
        contextMap: args.contextMap
      },
      instructions: [
        'Design module structure for bounded context',
        'Define API boundaries and interfaces',
        'Plan anti-corruption layers for external integrations',
        'Define integration patterns with other contexts',
        'Plan persistence strategy for aggregates',
        'Design event publishing mechanism',
        'Plan testing strategy (unit, integration, acceptance)',
        'Consider technology choices aligned with subdomain type',
        'Document implementation guidelines and patterns'
      ],
      outputFormat: 'JSON with module structure, APIs, integration, and implementation guidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['moduleStructure', 'apiDefinition', 'integration'],
      properties: {
        moduleStructure: {
          type: 'object',
          properties: {
            rootPackage: { type: 'string' },
            layers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  purpose: { type: 'string' },
                  packages: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            coreComponents: { type: 'array', items: { type: 'string' } }
          }
        },
        apiDefinition: {
          type: 'object',
          properties: {
            publicInterface: { type: 'string' },
            endpoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  operation: { type: 'string' },
                  description: { type: 'string' },
                  aggregateRoot: { type: 'string' }
                }
              }
            },
            dtoDefinitions: { type: 'array', items: { type: 'string' } }
          }
        },
        integration: {
          type: 'object',
          properties: {
            antiCorruptionLayers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  upstreamContext: { type: 'string' },
                  translationStrategy: { type: 'string' }
                }
              }
            },
            eventPublishing: { type: 'string' },
            eventSubscriptions: { type: 'array', items: { type: 'string' } }
          }
        },
        persistence: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            repositoryImplementations: { type: 'array', items: { type: 'string' } }
          }
        },
        testing: {
          type: 'object',
          properties: {
            unitTestStrategy: { type: 'string' },
            integrationTestStrategy: { type: 'string' },
            acceptanceTestStrategy: { type: 'string' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'ddd', 'implementation', args.boundedContext.name]
}));

/**
 * Task: Validate Domain Model
 * Final validation of complete DDD model
 */
export const validateDomainModelTask = defineTask('validate-domain-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate domain model: ${args.projectName}`,
  description: 'Validate complete DDD model for consistency and completeness',

  agent: {
    name: 'ddd-model-validator',
    prompt: {
      role: 'DDD model validator and quality assurance',
      task: 'Validate complete domain model',
      context: {
        projectName: args.projectName,
        strategicDesign: args.strategicDesign,
        tacticalDesign: args.tacticalDesign,
        ubiquitousLanguage: args.ubiquitousLanguage,
        domainEvents: args.domainEvents,
        implementation: args.implementation
      },
      instructions: [
        'Validate strategic design completeness (subdomains, contexts, map)',
        'Validate tactical design for each bounded context',
        'Check aggregate boundaries and consistency rules',
        'Verify ubiquitous language consistency',
        'Validate domain event model',
        'Check integration patterns between contexts',
        'Verify implementation plans align with design',
        'Identify gaps, inconsistencies, or risks',
        'Provide recommendations for improvements'
      ],
      outputFormat: 'JSON with validation results, issues, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'completeness', 'issues', 'recommendations'],
      properties: {
        valid: { type: 'boolean' },
        completeness: {
          type: 'object',
          properties: {
            strategicDesign: { type: 'number' },
            tacticalDesign: { type: 'number' },
            ubiquitousLanguage: { type: 'number' },
            domainEvents: { type: 'number' },
            implementation: { type: 'number' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
              category: { type: 'string' },
              description: { type: 'string' },
              location: { type: 'string' }
            }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              area: { type: 'string' },
              recommendation: { type: 'string' },
              rationale: { type: 'string' }
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

  labels: ['agent', 'ddd', 'validation', 'final']
}));

/**
 * Task: Load Domain Model
 * Load existing domain model for refinement
 */
export const loadDomainModelTask = defineTask('load-domain-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Load existing domain model',
  description: 'Load and parse existing domain model artifacts',

  agent: {
    name: 'ddd-model-loader',
    prompt: {
      role: 'DDD model loader',
      task: 'Load and parse existing domain model',
      context: {
        existingDomainModel: args.existingDomainModel
      },
      instructions: [
        'Load existing strategic design artifacts',
        'Load existing ubiquitous language',
        'Parse and validate artifact structure',
        'Return loaded model for refinement'
      ],
      outputFormat: 'JSON with loaded strategic design and ubiquitous language'
    },
    outputSchema: {
      type: 'object',
      properties: {
        strategicDesign: { type: 'object' },
        ubiquitousLanguage: { type: 'object' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'ddd', 'load-model']
}));
