/**
 * @process specializations/software-architecture/ddd-strategic-modeling
 * @description Domain-Driven Design Strategic Modeling - Identify bounded contexts, define context relationships, create context maps,
 * and align architecture with domain boundaries using DDD strategic patterns for large-scale system design
 * @inputs { projectName: string, domainDescription?: string, stakeholders?: array, existingArchitecture?: object, teamStructure?: object }
 * @outputs { success: boolean, strategicModel: object, boundedContexts: array, contextMap: object, teamAlignment: object, qualityScore: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/software-architecture/ddd-strategic-modeling', {
 *   projectName: 'Healthcare Management System',
 *   domainDescription: 'Comprehensive healthcare system managing patients, appointments, prescriptions, billing, and insurance',
 *   stakeholders: ['Product Manager', 'Domain Experts', 'Development Team'],
 *   teamStructure: { totalTeams: 4, teamSize: 6 }
 * });
 *
 * @references
 * - Domain-Driven Design by Eric Evans: https://www.domainlanguage.com/ddd/
 * - Implementing Domain-Driven Design by Vaughn Vernon: https://vaughnvernon.com/
 * - Domain-Driven Design Distilled by Vaughn Vernon: https://www.informit.com/store/domain-driven-design-distilled-9780134434421
 * - Patterns, Principles, and Practices of Domain-Driven Design by Scott Millett: https://www.wiley.com/en-us/Patterns%2C+Principles%2C+and+Practices+of+Domain+Driven+Design-p-9781118714706
 * - Strategic DDD Context Mapping: https://github.com/ddd-crew/context-mapping
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    domainDescription = '',
    stakeholders = [],
    existingArchitecture = null,
    teamStructure = {},
    outputDir = 'ddd-strategic-modeling-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting DDD Strategic Modeling for ${projectName}`);

  // ============================================================================
  // PHASE 1: DOMAIN KNOWLEDGE DISCOVERY
  // ============================================================================

  ctx.log('info', 'Phase 1: Discovering domain knowledge and business capabilities');
  const domainKnowledge = await ctx.task(domainKnowledgeDiscoveryTask, {
    projectName,
    domainDescription,
    stakeholders,
    existingArchitecture,
    outputDir
  });

  artifacts.push(...domainKnowledge.artifacts);

  // Quality Gate: Must identify business capabilities
  if (!domainKnowledge.businessCapabilities || domainKnowledge.businessCapabilities.length < 2) {
    return {
      success: false,
      error: 'Insufficient business capabilities identified. Strategic modeling requires at least 2 distinct business capabilities.',
      phase: 'domain-knowledge-discovery',
      recommendation: 'Conduct additional domain expert interviews or event storming sessions',
      domainKnowledge
    };
  }

  // ============================================================================
  // PHASE 2: SUBDOMAIN CLASSIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Classifying subdomains into Core, Supporting, and Generic');
  const subdomainClassification = await ctx.task(subdomainClassificationTask, {
    projectName,
    domainKnowledge,
    businessCapabilities: domainKnowledge.businessCapabilities,
    outputDir
  });

  artifacts.push(...subdomainClassification.artifacts);

  // Quality Gate: Must have at least one core subdomain
  const coreSubdomains = subdomainClassification.subdomains.filter(s => s.type === 'core');
  if (coreSubdomains.length === 0) {
    return {
      success: false,
      error: 'No core subdomains identified. Every system must have at least one core domain that provides competitive advantage.',
      phase: 'subdomain-classification',
      recommendation: 'Re-evaluate business capabilities to identify core differentiators',
      subdomainClassification
    };
  }

  // Breakpoint: Review subdomain classification
  await ctx.breakpoint({
    question: `Subdomain classification complete. Identified ${coreSubdomains.length} core domain(s), ${subdomainClassification.subdomains.filter(s => s.type === 'supporting').length} supporting domain(s), and ${subdomainClassification.subdomains.filter(s => s.type === 'generic').length} generic domain(s). Core domains receive highest investment. Approve classification?`,
    title: 'Subdomain Classification Review',
    context: {
      runId: ctx.runId,
      projectName,
      subdomains: subdomainClassification.subdomains,
      coreCount: coreSubdomains.length,
      recommendations: subdomainClassification.recommendations,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label
      }))
    }
  });

  // ============================================================================
  // PHASE 3: BOUNDED CONTEXT IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying bounded contexts and their boundaries');
  const boundedContexts = await ctx.task(boundedContextIdentificationTask, {
    projectName,
    domainKnowledge,
    subdomainClassification,
    teamStructure,
    outputDir
  });

  artifacts.push(...boundedContexts.artifacts);

  // ============================================================================
  // PHASE 4: UBIQUITOUS LANGUAGE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining ubiquitous language per bounded context');
  const ubiquitousLanguage = await ctx.task(ubiquitousLanguageTask, {
    projectName,
    boundedContexts: boundedContexts.contexts,
    domainKnowledge,
    outputDir
  });

  artifacts.push(...ubiquitousLanguage.artifacts);

  // ============================================================================
  // PHASE 5: CONTEXT MAPPING AND RELATIONSHIPS
  // ============================================================================

  ctx.log('info', 'Phase 5: Mapping context relationships and integration patterns');
  const contextMapping = await ctx.task(contextMappingTask, {
    projectName,
    boundedContexts: boundedContexts.contexts,
    subdomainClassification,
    domainKnowledge,
    outputDir
  });

  artifacts.push(...contextMapping.artifacts);

  // Breakpoint: Review bounded contexts and context map
  await ctx.breakpoint({
    question: `Bounded contexts and context map complete. Identified ${boundedContexts.contexts.length} bounded context(s) with ${contextMapping.relationships.length} relationship(s). Context mapping patterns include: ${contextMapping.strategicPatterns.join(', ')}. Review strategic model?`,
    title: 'Strategic Model Review',
    context: {
      runId: ctx.runId,
      projectName,
      boundedContexts: boundedContexts.contexts,
      relationships: contextMapping.relationships,
      strategicPatterns: contextMapping.strategicPatterns,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label
      }))
    }
  });

  // ============================================================================
  // PHASE 6: AGGREGATE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Identifying aggregates and consistency boundaries');

  // Process each bounded context in parallel for aggregate identification
  const aggregateAnalysis = await ctx.parallel.all(
    boundedContexts.contexts.map(context => async () => {
      return await ctx.task(aggregateIdentificationTask, {
        projectName,
        boundedContext: context,
        ubiquitousLanguage: ubiquitousLanguage.glossary.filter(term => term.context === context.name),
        domainKnowledge,
        outputDir
      });
    })
  );

  // Consolidate artifacts
  aggregateAnalysis.forEach(analysis => {
    artifacts.push(...analysis.artifacts);
  });

  // ============================================================================
  // PHASE 7: DOMAIN EVENT IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Identifying domain events and event flows');
  const domainEvents = await ctx.task(domainEventIdentificationTask, {
    projectName,
    boundedContexts: boundedContexts.contexts,
    aggregateAnalysis,
    contextMapping,
    outputDir
  });

  artifacts.push(...domainEvents.artifacts);

  // ============================================================================
  // PHASE 8: TEAM TOPOLOGY ALIGNMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Aligning team structure with bounded contexts (Conway\'s Law)');
  const teamAlignment = await ctx.task(teamTopologyAlignmentTask, {
    projectName,
    boundedContexts: boundedContexts.contexts,
    subdomainClassification,
    teamStructure,
    contextMapping,
    outputDir
  });

  artifacts.push(...teamAlignment.artifacts);

  // ============================================================================
  // PHASE 9: ANTI-CORRUPTION LAYER DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 9: Designing anti-corruption layers for external integrations');
  const aclDesign = await ctx.task(antiCorruptionLayerTask, {
    projectName,
    boundedContexts: boundedContexts.contexts,
    contextMapping,
    existingArchitecture,
    outputDir
  });

  artifacts.push(...aclDesign.artifacts);

  // ============================================================================
  // PHASE 10: SHARED KERNEL IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Identifying shared kernels and published languages');
  const sharedKernelAnalysis = await ctx.task(sharedKernelTask, {
    projectName,
    boundedContexts: boundedContexts.contexts,
    contextMapping,
    ubiquitousLanguage,
    outputDir
  });

  artifacts.push(...sharedKernelAnalysis.artifacts);

  // ============================================================================
  // PHASE 11: INTEGRATION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 11: Defining integration strategies between bounded contexts');
  const integrationStrategy = await ctx.task(integrationStrategyTask, {
    projectName,
    contextMapping,
    boundedContexts: boundedContexts.contexts,
    domainEvents,
    aclDesign,
    outputDir
  });

  artifacts.push(...integrationStrategy.artifacts);

  // ============================================================================
  // PHASE 12: STRATEGIC MODEL VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Validating strategic model consistency and completeness');
  const modelValidation = await ctx.task(strategicModelValidationTask, {
    projectName,
    domainKnowledge,
    subdomainClassification,
    boundedContexts: boundedContexts.contexts,
    contextMapping,
    ubiquitousLanguage,
    aggregateAnalysis,
    domainEvents,
    teamAlignment,
    aclDesign,
    integrationStrategy,
    outputDir
  });

  artifacts.push(...modelValidation.artifacts);

  // Quality Gate: Model must pass validation
  const validationIssues = modelValidation.issues.filter(issue => issue.severity === 'critical');
  if (validationIssues.length > 0) {
    await ctx.breakpoint({
      question: `Strategic model validation found ${validationIssues.length} critical issue(s). These must be resolved before proceeding. Review validation results?`,
      title: 'Critical Validation Issues',
      context: {
        runId: ctx.runId,
        projectName,
        criticalIssues: validationIssues,
        recommendation: 'Address critical issues before finalizing strategic model'
      }
    });
  }

  // ============================================================================
  // PHASE 13: STRATEGIC DESIGN QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 13: Scoring strategic design quality and alignment');
  const qualityScore = await ctx.task(strategicQualityScoringTask, {
    projectName,
    domainKnowledge,
    subdomainClassification,
    boundedContexts: boundedContexts.contexts,
    contextMapping,
    ubiquitousLanguage,
    teamAlignment,
    modelValidation,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= 75;

  // ============================================================================
  // PHASE 14: ARCHITECTURAL DECISION RECORDS
  // ============================================================================

  ctx.log('info', 'Phase 14: Generating Architecture Decision Records for strategic choices');
  const adrGeneration = await ctx.task(adrGenerationTask, {
    projectName,
    subdomainClassification,
    boundedContexts: boundedContexts.contexts,
    contextMapping,
    teamAlignment,
    integrationStrategy,
    qualityScore,
    outputDir
  });

  artifacts.push(...adrGeneration.artifacts);

  // ============================================================================
  // PHASE 15: COMPREHENSIVE STRATEGY DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 15: Generating comprehensive strategic DDD documentation');
  const strategyDocument = await ctx.task(strategyDocumentationTask, {
    projectName,
    domainKnowledge,
    subdomainClassification,
    boundedContexts: boundedContexts.contexts,
    ubiquitousLanguage,
    contextMapping,
    aggregateAnalysis,
    domainEvents,
    teamAlignment,
    aclDesign,
    sharedKernelAnalysis,
    integrationStrategy,
    modelValidation,
    qualityScore,
    adrGeneration,
    outputDir
  });

  artifacts.push(...strategyDocument.artifacts);

  // Final Breakpoint: Review complete strategic model
  await ctx.breakpoint({
    question: `DDD Strategic Modeling complete for ${projectName}. Overall quality score: ${overallScore}/100. ${qualityMet ? 'Strategic model meets quality standards!' : 'Strategic model may need refinement.'} Total bounded contexts: ${boundedContexts.contexts.length}. Core subdomains: ${coreSubdomains.length}. Strategic patterns identified: ${contextMapping.strategicPatterns.length}. Approve strategic model for tactical design?`,
    title: 'Strategic Model Approval',
    context: {
      runId: ctx.runId,
      projectName,
      overallScore,
      qualityMet,
      boundedContextCount: boundedContexts.contexts.length,
      coreSubdomainCount: coreSubdomains.length,
      strategicPatternCount: contextMapping.strategicPatterns.length,
      teamCount: teamAlignment.teams.length,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        boundedContexts: boundedContexts.contexts.length,
        coreSubdomains: coreSubdomains.length,
        supportingSubdomains: subdomainClassification.subdomains.filter(s => s.type === 'supporting').length,
        genericSubdomains: subdomainClassification.subdomains.filter(s => s.type === 'generic').length,
        contextRelationships: contextMapping.relationships.length,
        strategicPatterns: contextMapping.strategicPatterns.length,
        teams: teamAlignment.teams.length,
        qualityScore: overallScore
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    qualityScore: overallScore,
    qualityMet,
    strategicModel: {
      domainKnowledge: {
        businessCapabilities: domainKnowledge.businessCapabilities,
        domainComplexity: domainKnowledge.complexity,
        stakeholders: domainKnowledge.stakeholders
      },
      subdomainClassification: {
        core: subdomainClassification.subdomains.filter(s => s.type === 'core'),
        supporting: subdomainClassification.subdomains.filter(s => s.type === 'supporting'),
        generic: subdomainClassification.subdomains.filter(s => s.type === 'generic'),
        investmentRecommendations: subdomainClassification.recommendations
      },
      boundedContexts: boundedContexts.contexts.map(bc => ({
        name: bc.name,
        type: bc.type,
        responsibility: bc.responsibility,
        capabilities: bc.capabilities,
        aggregates: aggregateAnalysis.find(a => a.contextName === bc.name)?.aggregates || [],
        teamOwnership: teamAlignment.contextOwnership.find(co => co.context === bc.name)?.team || null
      })),
      contextMapping: {
        relationships: contextMapping.relationships,
        strategicPatterns: contextMapping.strategicPatterns,
        integrationPoints: contextMapping.integrationPoints
      },
      ubiquitousLanguage: {
        glossary: ubiquitousLanguage.glossary,
        contextSpecificTerms: ubiquitousLanguage.contextSpecificTerms,
        conflictingTerms: ubiquitousLanguage.conflictingTerms || []
      },
      domainEvents: {
        events: domainEvents.events,
        eventFlow: domainEvents.eventFlow,
        publishSubscribePatterns: domainEvents.publishSubscribePatterns
      }
    },
    boundedContexts: boundedContexts.contexts,
    contextMap: {
      relationships: contextMapping.relationships,
      strategicPatterns: contextMapping.strategicPatterns,
      diagram: contextMapping.diagramPath
    },
    teamAlignment: {
      teams: teamAlignment.teams,
      contextOwnership: teamAlignment.contextOwnership,
      conwaysLawAlignment: teamAlignment.conwaysLawAlignment,
      recommendations: teamAlignment.recommendations
    },
    integrationStrategy: {
      patterns: integrationStrategy.patterns,
      antiCorruptionLayers: aclDesign.layers,
      sharedKernels: sharedKernelAnalysis.sharedKernels,
      publishedLanguages: sharedKernelAnalysis.publishedLanguages
    },
    validation: {
      valid: modelValidation.valid,
      issues: modelValidation.issues,
      completeness: modelValidation.completeness,
      recommendations: modelValidation.recommendations
    },
    adrs: adrGeneration.adrs,
    strategyDocument: strategyDocument.documentPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/software-architecture/ddd-strategic-modeling',
      timestamp: startTime,
      projectName,
      outputDir,
      version: '1.0.0',
      category: 'Advanced Architecture',
      specializationSlug: 'software-architecture'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Domain Knowledge Discovery
export const domainKnowledgeDiscoveryTask = defineTask('domain-knowledge-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Domain Knowledge Discovery - ${args.projectName}`,
  agent: {
    name: 'domain-expert',
    prompt: {
      role: 'DDD strategic designer and domain expert facilitator',
      task: 'Discover deep domain knowledge through business capability analysis',
      context: args,
      instructions: [
        '1. Analyze business capabilities and core value propositions',
        '2. Identify key business processes and workflows',
        '3. Extract domain concepts, entities, and relationships',
        '4. Document business rules and invariants',
        '5. Identify domain experts and stakeholder perspectives',
        '6. Assess domain complexity (simple, moderate, complex, very-complex)',
        '7. Identify business goals and success metrics',
        '8. Map existing architecture and technical constraints',
        '9. Identify pain points and areas of frequent change',
        '10. Generate domain knowledge document with business capability map'
      ],
      outputFormat: 'JSON with businessCapabilities (array), domainConcepts (array), businessRules (array), complexity (string), stakeholders (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['businessCapabilities', 'domainConcepts', 'complexity', 'artifacts'],
      properties: {
        businessCapabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              capability: { type: 'string' },
              description: { type: 'string' },
              businessValue: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              changeFrequency: { type: 'string', enum: ['very-high', 'high', 'medium', 'low'] },
              complexity: { type: 'string', enum: ['very-high', 'high', 'medium', 'low'] },
              subCapabilities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        domainConcepts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concept: { type: 'string' },
              type: { type: 'string', enum: ['entity', 'value-object', 'aggregate', 'service', 'event'] },
              description: { type: 'string' },
              relatedCapabilities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        businessRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule: { type: 'string' },
              scope: { type: 'string' },
              criticality: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        complexity: {
          type: 'string',
          enum: ['simple', 'moderate', 'complex', 'very-complex']
        },
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              expertise: { type: 'array', items: { type: 'string' } },
              availability: { type: 'string' }
            }
          }
        },
        painPoints: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ddd', 'strategic-modeling', 'domain-discovery', 'architecture']
}));

// Task 2: Subdomain Classification
export const subdomainClassificationTask = defineTask('subdomain-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Subdomain Classification - ${args.projectName}`,
  agent: {
    name: 'subdomain-strategist',
    prompt: {
      role: 'DDD strategic designer specializing in subdomain classification',
      task: 'Classify subdomains into Core, Supporting, and Generic based on business value and competitive advantage',
      context: args,
      instructions: [
        '1. Analyze each business capability for strategic importance',
        '2. Classify as Core (competitive differentiator, high business value, invest heavily)',
        '3. Classify as Supporting (necessary but not differentiating, moderate investment)',
        '4. Classify as Generic (commodity, use off-the-shelf solutions)',
        '5. Assess subdomain complexity and uncertainty',
        '6. Identify core domains that provide competitive advantage',
        '7. Recommend investment levels per subdomain',
        '8. Suggest build vs buy vs outsource strategies',
        '9. Consider domain evolution and future strategic importance',
        '10. Generate subdomain map with classifications and recommendations'
      ],
      outputFormat: 'JSON with subdomains (array), recommendations (object), investmentStrategy (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['subdomains', 'recommendations', 'artifacts'],
      properties: {
        subdomains: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'type', 'businessValue'],
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['core', 'supporting', 'generic'] },
              description: { type: 'string' },
              businessValue: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              competitiveAdvantage: { type: 'boolean' },
              complexity: { type: 'string', enum: ['very-high', 'high', 'medium', 'low'] },
              uncertainty: { type: 'string', enum: ['high', 'medium', 'low'] },
              rationale: { type: 'string' },
              relatedCapabilities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendations: {
          type: 'object',
          properties: {
            coreInvestment: { type: 'string' },
            supportingStrategy: { type: 'string' },
            genericSolutions: { type: 'array', items: { type: 'string' } },
            buildVsBuy: { type: 'array', items: { type: 'object' } }
          }
        },
        investmentStrategy: {
          type: 'object',
          properties: {
            highPriority: { type: 'array', items: { type: 'string' } },
            mediumPriority: { type: 'array', items: { type: 'string' } },
            lowPriority: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ddd', 'strategic-modeling', 'subdomain-classification', 'architecture']
}));

// Task 3: Bounded Context Identification
export const boundedContextIdentificationTask = defineTask('bounded-context-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Bounded Context Identification - ${args.projectName}`,
  agent: {
    name: 'context-mapper',
    prompt: {
      role: 'DDD context mapping specialist',
      task: 'Identify bounded contexts with clear boundaries and consistent models',
      context: args,
      instructions: [
        '1. Map subdomains to bounded contexts (may be 1:1 or multiple subdomains per context)',
        '2. Define clear boundaries where models are internally consistent',
        '3. Identify linguistic boundaries (where terminology changes meaning)',
        '4. Define context responsibilities and scope',
        '5. Consider team structure and Conway\'s Law',
        '6. Ensure contexts are sized appropriately (not too large, not too small)',
        '7. Identify context interfaces and public APIs',
        '8. Define what is inside vs outside each context',
        '9. Consider deployment independence and scaling needs',
        '10. Generate bounded context canvas for each context'
      ],
      outputFormat: 'JSON with contexts (array), boundaryJustifications (object), sizeAssessment (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['contexts', 'artifacts'],
      properties: {
        contexts: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'type', 'responsibility', 'scope'],
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['core', 'supporting', 'generic'] },
              responsibility: { type: 'string' },
              scope: { type: 'string' },
              subdomains: { type: 'array', items: { type: 'string' } },
              capabilities: { type: 'array', items: { type: 'string' } },
              businessRules: { type: 'array', items: { type: 'string' } },
              modelingComplexity: { type: 'string', enum: ['very-high', 'high', 'medium', 'low'] },
              publicInterface: { type: 'string' },
              boundaries: {
                type: 'object',
                properties: {
                  inside: { type: 'array', items: { type: 'string' } },
                  outside: { type: 'array', items: { type: 'string' } }
                }
              },
              teamConsiderations: { type: 'string' }
            }
          }
        },
        boundaryJustifications: {
          type: 'object',
          description: 'Rationale for each bounded context boundary definition'
        },
        sizeAssessment: {
          type: 'object',
          properties: {
            averageComplexity: { type: 'string' },
            granularity: { type: 'string', enum: ['optimal', 'too-fine', 'too-coarse'] },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ddd', 'strategic-modeling', 'bounded-contexts', 'architecture']
}));

// Task 4: Ubiquitous Language Definition
export const ubiquitousLanguageTask = defineTask('ubiquitous-language', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Ubiquitous Language Definition - ${args.projectName}`,
  agent: {
    name: 'language-curator',
    prompt: {
      role: 'DDD language expert and terminology specialist',
      task: 'Define ubiquitous language glossary for each bounded context',
      context: args,
      instructions: [
        '1. Extract key terms from domain knowledge and business capabilities',
        '2. Define each term precisely using business language',
        '3. Organize terms by bounded context',
        '4. Identify terms with different meanings in different contexts',
        '5. Avoid technical jargon - use language domain experts use',
        '6. Document synonyms and related terms',
        '7. Provide usage examples for ambiguous terms',
        '8. Identify terms that appear in models and code',
        '9. Flag conflicting terminology that needs resolution',
        '10. Generate glossary document per bounded context'
      ],
      outputFormat: 'JSON with glossary (array), contextSpecificTerms (object), conflictingTerms (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['glossary', 'contextSpecificTerms', 'artifacts'],
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
              type: { type: 'string', enum: ['entity', 'value-object', 'aggregate', 'service', 'event', 'concept'] },
              synonyms: { type: 'array', items: { type: 'string' } },
              relatedTerms: { type: 'array', items: { type: 'string' } },
              examples: { type: 'array', items: { type: 'string' } },
              usedInCode: { type: 'boolean' }
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
        conflictingTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              contexts: { type: 'array', items: { type: 'string' } },
              definitions: { type: 'array', items: { type: 'string' } },
              resolutionNeeded: { type: 'boolean' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ddd', 'strategic-modeling', 'ubiquitous-language', 'terminology']
}));

// Task 5: Context Mapping
export const contextMappingTask = defineTask('context-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Context Mapping - ${args.projectName}`,
  agent: {
    name: 'integration-architect',
    prompt: {
      role: 'DDD context mapping and integration pattern expert',
      task: 'Map relationships between bounded contexts using strategic DDD patterns',
      context: args,
      instructions: [
        '1. Identify all relationships between bounded contexts',
        '2. Apply strategic DDD patterns: Partnership, Shared Kernel, Customer-Supplier, Conformist, Anti-Corruption Layer, Open Host Service, Published Language, Separate Ways',
        '3. Partnership: Two teams collaborate on shared model',
        '4. Shared Kernel: Subset of model shared between contexts',
        '5. Customer-Supplier: Downstream (customer) depends on upstream (supplier)',
        '6. Conformist: Downstream conforms to upstream model',
        '7. Anti-Corruption Layer: Downstream protects itself with translation layer',
        '8. Open Host Service: Upstream provides well-defined service protocol',
        '9. Published Language: Shared language for integration (JSON schema, XML, events)',
        '10. Separate Ways: No integration needed between contexts',
        '11. Document communication patterns (sync, async, event-driven)',
        '12. Generate context map diagram showing all relationships'
      ],
      outputFormat: 'JSON with relationships (array), strategicPatterns (array), integrationPoints (object), diagramPath (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['relationships', 'strategicPatterns', 'artifacts'],
      properties: {
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            required: ['upstream', 'downstream', 'pattern'],
            properties: {
              upstream: { type: 'string' },
              downstream: { type: 'string' },
              pattern: {
                type: 'string',
                enum: [
                  'partnership',
                  'shared-kernel',
                  'customer-supplier',
                  'conformist',
                  'anti-corruption-layer',
                  'open-host-service',
                  'published-language',
                  'separate-ways'
                ]
              },
              description: { type: 'string' },
              communicationPattern: { type: 'string', enum: ['synchronous', 'asynchronous', 'event-driven', 'batch', 'none'] },
              dataFlow: { type: 'string' },
              rationale: { type: 'string' },
              risks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        strategicPatterns: {
          type: 'array',
          items: { type: 'string' }
        },
        integrationPoints: {
          type: 'object',
          properties: {
            synchronous: { type: 'array', items: { type: 'object' } },
            asynchronous: { type: 'array', items: { type: 'object' } },
            eventDriven: { type: 'array', items: { type: 'object' } }
          }
        },
        diagramPath: { type: 'string' },
        patternUsage: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ddd', 'strategic-modeling', 'context-mapping', 'integration-patterns']
}));

// Task 6: Aggregate Identification
export const aggregateIdentificationTask = defineTask('aggregate-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Aggregate Identification - ${args.boundedContext.name}`,
  agent: {
    name: 'aggregate-designer',
    prompt: {
      role: 'DDD tactical designer specializing in aggregate design',
      task: 'Identify aggregates and consistency boundaries within bounded context',
      context: args,
      instructions: [
        '1. Identify entities with unique identity and lifecycle',
        '2. Identify value objects (immutable, no identity)',
        '3. Group entities and value objects into aggregates',
        '4. Designate one entity as aggregate root (entry point)',
        '5. Define aggregate boundaries (transaction and consistency boundaries)',
        '6. Keep aggregates small and focused',
        '7. Define invariants that aggregates must maintain',
        '8. External references to aggregates should be by ID only',
        '9. Consider aggregate size and performance implications',
        '10. Document aggregate responsibilities and business rules'
      ],
      outputFormat: 'JSON with contextName (string), aggregates (array), entities (array), valueObjects (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['contextName', 'aggregates', 'artifacts'],
      properties: {
        contextName: { type: 'string' },
        aggregates: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'rootEntity', 'invariants'],
            properties: {
              name: { type: 'string' },
              rootEntity: { type: 'string' },
              description: { type: 'string' },
              members: {
                type: 'object',
                properties: {
                  entities: { type: 'array', items: { type: 'string' } },
                  valueObjects: { type: 'array', items: { type: 'string' } }
                }
              },
              invariants: { type: 'array', items: { type: 'string' } },
              businessRules: { type: 'array', items: { type: 'string' } },
              boundaries: { type: 'string' },
              estimatedSize: { type: 'string', enum: ['small', 'medium', 'large'] }
            }
          }
        },
        entities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              identity: { type: 'string' },
              attributes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        valueObjects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              attributes: { type: 'array', items: { type: 'string' } },
              immutable: { type: 'boolean' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ddd', 'strategic-modeling', 'aggregates', 'tactical-design']
}));

// Task 7: Domain Event Identification
export const domainEventIdentificationTask = defineTask('domain-event-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Domain Event Identification - ${args.projectName}`,
  agent: {
    name: 'event-modeler',
    prompt: {
      role: 'DDD event modeling and event storming facilitator',
      task: 'Identify domain events and event flows across bounded contexts',
      context: args,
      instructions: [
        '1. Identify significant occurrences in the domain (past tense)',
        '2. Events represent immutable facts that have happened',
        '3. Name events using past tense (e.g., OrderPlaced, PaymentProcessed)',
        '4. Organize events by aggregate root that publishes them',
        '5. Identify event triggers (commands, external events, time)',
        '6. Map event consumers (which contexts/aggregates react to events)',
        '7. Define event data (payload needed by subscribers)',
        '8. Identify integration events that cross context boundaries',
        '9. Design event flow and choreography between contexts',
        '10. Consider eventual consistency patterns'
      ],
      outputFormat: 'JSON with events (array), eventFlow (array), publishSubscribePatterns (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['events', 'eventFlow', 'artifacts'],
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'context', 'publisher'],
            properties: {
              name: { type: 'string' },
              context: { type: 'string' },
              publisher: { type: 'string' },
              description: { type: 'string' },
              trigger: { type: 'string' },
              data: { type: 'array', items: { type: 'object' } },
              subscribers: { type: 'array', items: { type: 'string' } },
              integrationEvent: { type: 'boolean' },
              eventType: { type: 'string', enum: ['domain-event', 'integration-event'] }
            }
          }
        },
        eventFlow: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event: { type: 'string' },
              publisher: { type: 'string' },
              subscribers: { type: 'array', items: { type: 'string' } },
              flowType: { type: 'string', enum: ['intra-context', 'inter-context'] }
            }
          }
        },
        publishSubscribePatterns: {
          type: 'object',
          properties: {
            eventBus: { type: 'boolean' },
            messageQueue: { type: 'boolean' },
            eventSourcing: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ddd', 'strategic-modeling', 'domain-events', 'event-storming']
}));

// Task 8: Team Topology Alignment
export const teamTopologyAlignmentTask = defineTask('team-topology-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Team Topology Alignment - ${args.projectName}`,
  agent: {
    name: 'org-designer',
    prompt: {
      role: 'Organization designer applying Conway\'s Law and Team Topologies',
      task: 'Align team structure with bounded contexts following Conway\'s Law',
      context: args,
      instructions: [
        '1. Apply Conway\'s Law: System architecture mirrors communication structure',
        '2. Assign one team per bounded context (stream-aligned team)',
        '3. Consider core vs supporting subdomains for team allocation',
        '4. Core domains get dedicated, experienced teams',
        '5. Supporting domains can share teams or have smaller teams',
        '6. Generic domains use platform teams or external solutions',
        '7. Define team interactions (collaboration, X-as-a-Service, facilitating)',
        '8. Ensure team cognitive load is manageable',
        '9. Plan for cross-functional teams (devs, testers, ops)',
        '10. Recommend team structure and ownership model'
      ],
      outputFormat: 'JSON with teams (array), contextOwnership (array), conwaysLawAlignment (boolean), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['teams', 'contextOwnership', 'conwaysLawAlignment', 'artifacts'],
      properties: {
        teams: {
          type: 'array',
          items: {
            type: 'object',
            required: ['teamName', 'type', 'ownedContexts'],
            properties: {
              teamName: { type: 'string' },
              type: { type: 'string', enum: ['stream-aligned', 'platform', 'enabling', 'complicated-subsystem'] },
              ownedContexts: { type: 'array', items: { type: 'string' } },
              size: { type: 'number' },
              skills: { type: 'array', items: { type: 'string' } },
              cognitiveLoad: { type: 'string', enum: ['low', 'medium', 'high', 'overloaded'] },
              interactions: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        contextOwnership: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              context: { type: 'string' },
              team: { type: 'string' },
              ownershipType: { type: 'string', enum: ['full', 'shared', 'external'] },
              rationale: { type: 'string' }
            }
          }
        },
        conwaysLawAlignment: {
          type: 'boolean',
          description: 'Whether team structure aligns with desired architecture'
        },
        teamInteractions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              team1: { type: 'string' },
              team2: { type: 'string' },
              interactionMode: { type: 'string', enum: ['collaboration', 'x-as-a-service', 'facilitating'] },
              frequency: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ddd', 'strategic-modeling', 'team-topology', 'conways-law']
}));

// Task 9: Anti-Corruption Layer Design
export const antiCorruptionLayerTask = defineTask('anti-corruption-layer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Anti-Corruption Layer Design - ${args.projectName}`,
  agent: {
    name: 'acl-architect',
    prompt: {
      role: 'DDD integration architect specializing in anti-corruption layers',
      task: 'Design anti-corruption layers to protect bounded contexts from external models',
      context: args,
      instructions: [
        '1. Identify external integrations (legacy systems, third-party services)',
        '2. Identify upstream contexts with incompatible models',
        '3. Design ACL pattern: Facade, Adapter, Translator components',
        '4. ACL translates external model to internal domain model',
        '5. Protect internal model from external changes',
        '6. Define translation rules and mapping logic',
        '7. Consider bidirectional translation if needed',
        '8. Plan for versioning and backward compatibility',
        '9. Design error handling and fallback strategies',
        '10. Document ACL interfaces and responsibilities'
      ],
      outputFormat: 'JSON with layers (array), translationRules (array), protectedContexts (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['layers', 'artifacts'],
      properties: {
        layers: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'protectedContext', 'externalSystem'],
            properties: {
              name: { type: 'string' },
              protectedContext: { type: 'string' },
              externalSystem: { type: 'string' },
              purpose: { type: 'string' },
              components: {
                type: 'object',
                properties: {
                  facade: { type: 'string' },
                  adapter: { type: 'string' },
                  translator: { type: 'string' }
                }
              },
              translationDirection: { type: 'string', enum: ['inbound', 'outbound', 'bidirectional'] },
              complexity: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        translationRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              acl: { type: 'string' },
              externalModel: { type: 'string' },
              internalModel: { type: 'string' },
              mappingLogic: { type: 'string' }
            }
          }
        },
        protectedContexts: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ddd', 'strategic-modeling', 'anti-corruption-layer', 'integration']
}));

// Task 10: Shared Kernel Identification
export const sharedKernelTask = defineTask('shared-kernel', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Shared Kernel Identification - ${args.projectName}`,
  agent: {
    name: 'kernel-analyst',
    prompt: {
      role: 'DDD architect specializing in shared kernel and published language patterns',
      task: 'Identify shared kernels and published languages for context integration',
      context: args,
      instructions: [
        '1. Identify model elements shared between contexts (Shared Kernel)',
        '2. Shared Kernel requires close coordination between teams',
        '3. Keep shared kernel small and well-defined',
        '4. Require mutual agreement for changes to shared kernel',
        '5. Identify Published Languages (standard integration formats)',
        '6. Published Language can be JSON schema, XML, Protocol Buffers',
        '7. Consider using events as published language',
        '8. Document versioning strategy for shared elements',
        '9. Define governance and change management process',
        '10. Balance between sharing and autonomy'
      ],
      outputFormat: 'JSON with sharedKernels (array), publishedLanguages (array), governanceModel (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sharedKernels', 'publishedLanguages', 'artifacts'],
      properties: {
        sharedKernels: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'contexts', 'sharedElements'],
            properties: {
              name: { type: 'string' },
              contexts: { type: 'array', items: { type: 'string' } },
              sharedElements: { type: 'array', items: { type: 'string' } },
              rationale: { type: 'string' },
              governanceModel: { type: 'string' },
              changeProcess: { type: 'string' },
              risks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        publishedLanguages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              format: { type: 'string', enum: ['json-schema', 'xml', 'protobuf', 'avro', 'graphql', 'openapi'] },
              usedBy: { type: 'array', items: { type: 'string' } },
              versioningStrategy: { type: 'string' },
              documentation: { type: 'string' }
            }
          }
        },
        governanceModel: {
          type: 'object',
          properties: {
            approvalProcess: { type: 'string' },
            changeManagement: { type: 'string' },
            conflictResolution: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ddd', 'strategic-modeling', 'shared-kernel', 'published-language']
}));

// Task 11: Integration Strategy
export const integrationStrategyTask = defineTask('integration-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Integration Strategy - ${args.projectName}`,
  agent: {
    name: 'integration-strategist',
    prompt: {
      role: 'Integration architect specializing in distributed system communication',
      task: 'Define comprehensive integration strategy between bounded contexts',
      context: args,
      instructions: [
        '1. Review context map relationships and patterns',
        '2. Design synchronous integration (REST, gRPC)',
        '3. Design asynchronous integration (message queues, event bus)',
        '4. Design event-driven choreography patterns',
        '5. Consider saga pattern for distributed transactions',
        '6. Plan for eventual consistency where appropriate',
        '7. Design API contracts and versioning strategy',
        '8. Plan for resilience (circuit breakers, retries, timeouts)',
        '9. Consider service mesh for cross-cutting concerns',
        '10. Document integration patterns and technology choices'
      ],
      outputFormat: 'JSON with patterns (array), communicationProtocols (object), resiliencePatterns (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'communicationProtocols', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['synchronous', 'asynchronous', 'event-driven', 'saga', 'cqrs'] },
              contexts: { type: 'array', items: { type: 'string' } },
              description: { type: 'string' },
              useCase: { type: 'string' },
              tradeoffs: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        communicationProtocols: {
          type: 'object',
          properties: {
            synchronous: { type: 'array', items: { type: 'string' } },
            asynchronous: { type: 'array', items: { type: 'string' } },
            messageBroker: { type: 'string' }
          }
        },
        resiliencePatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string', enum: ['circuit-breaker', 'retry', 'timeout', 'bulkhead', 'fallback'] },
              contexts: { type: 'array', items: { type: 'string' } },
              configuration: { type: 'string' }
            }
          }
        },
        consistencyStrategy: {
          type: 'object',
          properties: {
            strongConsistency: { type: 'array', items: { type: 'string' } },
            eventualConsistency: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ddd', 'strategic-modeling', 'integration-strategy', 'distributed-systems']
}));

// Task 12: Strategic Model Validation
export const strategicModelValidationTask = defineTask('strategic-model-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Strategic Model Validation - ${args.projectName}`,
  agent: {
    name: 'model-validator',
    prompt: {
      role: 'Senior DDD architect and model validation specialist',
      task: 'Validate strategic model for consistency, completeness, and quality',
      context: args,
      instructions: [
        '1. Validate subdomain classification alignment with business strategy',
        '2. Check bounded context boundaries are clear and consistent',
        '3. Verify ubiquitous language consistency across artifacts',
        '4. Validate context map relationships and patterns',
        '5. Check aggregate boundaries are appropriate',
        '6. Verify domain events capture significant occurrences',
        '7. Validate team alignment with Conway\'s Law',
        '8. Check anti-corruption layers protect context boundaries',
        '9. Assess integration strategy completeness',
        '10. Identify gaps, inconsistencies, and areas for improvement'
      ],
      outputFormat: 'JSON with valid (boolean), issues (array), completeness (object), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'issues', 'completeness', 'recommendations', 'artifacts'],
      properties: {
        valid: { type: 'boolean' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string', enum: ['subdomain', 'bounded-context', 'context-map', 'language', 'team-alignment', 'integration'] },
              description: { type: 'string' },
              location: { type: 'string' },
              impact: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            domainKnowledge: { type: 'number', minimum: 0, maximum: 100 },
            subdomainClassification: { type: 'number', minimum: 0, maximum: 100 },
            boundedContexts: { type: 'number', minimum: 0, maximum: 100 },
            contextMapping: { type: 'number', minimum: 0, maximum: 100 },
            ubiquitousLanguage: { type: 'number', minimum: 0, maximum: 100 },
            teamAlignment: { type: 'number', minimum: 0, maximum: 100 },
            integrationStrategy: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              area: { type: 'string' },
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        strengths: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ddd', 'strategic-modeling', 'validation', 'quality-assurance']
}));

// Task 13: Strategic Quality Scoring
export const strategicQualityScoringTask = defineTask('strategic-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Strategic Quality Scoring - ${args.projectName}`,
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Principal architect specializing in DDD strategic design quality assessment',
      task: 'Score strategic model quality across multiple dimensions',
      context: args,
      instructions: [
        '1. Score domain understanding depth (weight: 15%)',
        '2. Score subdomain classification accuracy (weight: 15%)',
        '3. Score bounded context quality (weight: 20%)',
        '4. Score context mapping completeness (weight: 15%)',
        '5. Score ubiquitous language consistency (weight: 10%)',
        '6. Score team alignment with architecture (weight: 15%)',
        '7. Score integration strategy maturity (weight: 10%)',
        '8. Calculate weighted overall score (0-100)',
        '9. Identify strengths and weaknesses',
        '10. Provide actionable recommendations'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), strengths (array), weaknesses (array), recommendations (array), readiness (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'readiness', 'artifacts'],
      properties: {
        overallScore: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        componentScores: {
          type: 'object',
          properties: {
            domainUnderstanding: { type: 'number' },
            subdomainClassification: { type: 'number' },
            boundedContextQuality: { type: 'number' },
            contextMapping: { type: 'number' },
            ubiquitousLanguage: { type: 'number' },
            teamAlignment: { type: 'number' },
            integrationStrategy: { type: 'number' }
          }
        },
        qualityMetrics: {
          type: 'object',
          properties: {
            contextGranularity: { type: 'string', enum: ['optimal', 'too-fine', 'too-coarse'] },
            boundaryClarity: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
            strategicPatternUsage: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
            teamArchitectureAlignment: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] }
          }
        },
        strengths: {
          type: 'array',
          items: { type: 'string' }
        },
        weaknesses: {
          type: 'array',
          items: { type: 'string' }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string' },
              recommendation: { type: 'string' },
              expectedImpact: { type: 'string' }
            }
          }
        },
        readiness: {
          type: 'string',
          enum: ['ready-for-tactical-design', 'minor-refinements-needed', 'major-refinements-needed', 'needs-rework']
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ddd', 'strategic-modeling', 'quality-scoring', 'assessment']
}));

// Task 14: ADR Generation
export const adrGenerationTask = defineTask('adr-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: ADR Generation - ${args.projectName}`,
  agent: {
    name: 'adr-author',
    prompt: {
      role: 'Technical architect and decision documentation specialist',
      task: 'Generate Architecture Decision Records for strategic design choices',
      context: args,
      instructions: [
        '1. Identify significant architectural decisions made during strategic modeling',
        '2. Document why subdomain classifications were chosen',
        '3. Document bounded context boundary decisions',
        '4. Document context mapping pattern selections',
        '5. Document team structure alignment decisions',
        '6. Document integration strategy choices',
        '7. Use ADR format: Context, Decision, Consequences',
        '8. Include alternatives considered',
        '9. Document trade-offs and risks',
        '10. Generate numbered ADR documents for each decision'
      ],
      outputFormat: 'JSON with adrs (array), decisionLog (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['adrs', 'artifacts'],
      properties: {
        adrs: {
          type: 'array',
          items: {
            type: 'object',
            required: ['number', 'title', 'context', 'decision', 'consequences'],
            properties: {
              number: { type: 'number' },
              title: { type: 'string' },
              status: { type: 'string', enum: ['proposed', 'accepted', 'deprecated', 'superseded'] },
              context: { type: 'string' },
              decision: { type: 'string' },
              consequences: { type: 'string' },
              alternatives: { type: 'array', items: { type: 'string' } },
              tradeoffs: { type: 'array', items: { type: 'string' } },
              relatedDecisions: { type: 'array', items: { type: 'number' } }
            }
          }
        },
        decisionLog: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              category: { type: 'string' },
              rationale: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ddd', 'strategic-modeling', 'adr', 'architecture-decisions']
}));

// Task 15: Strategy Documentation
export const strategyDocumentationTask = defineTask('strategy-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Strategy Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Senior technical writer and DDD documentation specialist',
      task: 'Generate comprehensive DDD strategic modeling documentation',
      context: args,
      instructions: [
        '1. Create executive summary with key findings',
        '2. Document domain knowledge and business capabilities',
        '3. Present subdomain classification with investment recommendations',
        '4. Detail bounded contexts with responsibilities and boundaries',
        '5. Document ubiquitous language glossary per context',
        '6. Present context map with relationships and patterns',
        '7. Document aggregates and consistency boundaries',
        '8. Present domain events and event flows',
        '9. Document team alignment and Conway\'s Law application',
        '10. Include integration strategy and patterns',
        '11. Present ADRs for strategic decisions',
        '12. Include appendices with diagrams and reference materials'
      ],
      outputFormat: 'JSON with documentPath (string), executiveSummary (string), keyFindings (array), nextSteps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'keyFindings', 'nextSteps', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              significance: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        strategicRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              rationale: { type: 'string' }
            }
          }
        },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              owner: { type: 'string' },
              timeline: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        successCriteria: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ddd', 'strategic-modeling', 'documentation', 'strategy']
}));
