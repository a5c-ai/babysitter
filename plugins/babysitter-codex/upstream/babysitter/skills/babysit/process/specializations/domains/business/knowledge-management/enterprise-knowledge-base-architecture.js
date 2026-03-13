/**
 * @process domains/business/knowledge-management/enterprise-knowledge-base-architecture
 * @description Design knowledge base structure, information architecture, taxonomy, and navigation to optimize findability and usability
 * @specialization Knowledge Management
 * @category Knowledge Base Development
 * @inputs { organizationalContext: object, contentTypes: array, userPersonas: array, existingSystems: array, outputDir: string }
 * @outputs { success: boolean, architecture: object, taxonomy: object, navigationDesign: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationalContext = {},
    contentTypes = [],
    userPersonas = [],
    existingSystems = [],
    requirements = {
      scalability: 'enterprise',
      multiLanguage: false,
      integration: [],
      searchCapabilities: 'advanced'
    },
    governanceRequirements = {},
    outputDir = 'kb-architecture-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Enterprise Knowledge Base Architecture Process');

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing knowledge base requirements');
  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    organizationalContext,
    contentTypes,
    userPersonas,
    existingSystems,
    requirements,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // Breakpoint: Review requirements
  await ctx.breakpoint({
    question: `Analyzed requirements for ${userPersonas.length} user personas and ${contentTypes.length} content types. Review?`,
    title: 'Requirements Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        userPersonas: userPersonas.length,
        contentTypes: contentTypes.length,
        keyRequirements: requirementsAnalysis.keyRequirements.length
      }
    }
  });

  // ============================================================================
  // PHASE 2: INFORMATION ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing information architecture');
  const informationArchitecture = await ctx.task(informationArchitectureTask, {
    requirements: requirementsAnalysis.requirements,
    contentTypes,
    userPersonas,
    outputDir
  });

  artifacts.push(...informationArchitecture.artifacts);

  // ============================================================================
  // PHASE 3: TAXONOMY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing taxonomy and classification');
  const taxonomyDevelopment = await ctx.task(taxonomyDevelopmentTask, {
    informationArchitecture: informationArchitecture.architecture,
    contentTypes,
    organizationalContext,
    outputDir
  });

  artifacts.push(...taxonomyDevelopment.artifacts);

  // Breakpoint: Review taxonomy
  await ctx.breakpoint({
    question: `Developed taxonomy with ${taxonomyDevelopment.topLevelCategories.length} top-level categories. Review?`,
    title: 'Taxonomy Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        topLevelCategories: taxonomyDevelopment.topLevelCategories.length,
        totalCategories: taxonomyDevelopment.totalCategories,
        taxonomyDepth: taxonomyDevelopment.maxDepth
      }
    }
  });

  // ============================================================================
  // PHASE 4: METADATA SCHEMA DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing metadata schema');
  const metadataSchema = await ctx.task(metadataSchemaTask, {
    taxonomy: taxonomyDevelopment.taxonomy,
    contentTypes,
    requirements: requirementsAnalysis.requirements,
    outputDir
  });

  artifacts.push(...metadataSchema.artifacts);

  // ============================================================================
  // PHASE 5: NAVIGATION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing navigation and discovery');
  const navigationDesign = await ctx.task(navigationDesignTask, {
    informationArchitecture: informationArchitecture.architecture,
    taxonomy: taxonomyDevelopment.taxonomy,
    userPersonas,
    outputDir
  });

  artifacts.push(...navigationDesign.artifacts);

  // ============================================================================
  // PHASE 6: SEARCH STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing search strategy');
  const searchStrategy = await ctx.task(searchStrategyTask, {
    taxonomy: taxonomyDevelopment.taxonomy,
    metadataSchema: metadataSchema.schema,
    contentTypes,
    requirements,
    outputDir
  });

  artifacts.push(...searchStrategy.artifacts);

  // ============================================================================
  // PHASE 7: CONTENT GOVERNANCE FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing content governance framework');
  const governanceFramework = await ctx.task(governanceFrameworkTask, {
    informationArchitecture: informationArchitecture.architecture,
    taxonomy: taxonomyDevelopment.taxonomy,
    organizationalContext,
    governanceRequirements,
    outputDir
  });

  artifacts.push(...governanceFramework.artifacts);

  // ============================================================================
  // PHASE 8: INTEGRATION ARCHITECTURE
  // ============================================================================

  ctx.log('info', 'Phase 8: Designing integration architecture');
  const integrationArchitecture = await ctx.task(integrationArchitectureTask, {
    existingSystems,
    informationArchitecture: informationArchitecture.architecture,
    requirements,
    outputDir
  });

  artifacts.push(...integrationArchitecture.artifacts);

  // ============================================================================
  // PHASE 9: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing architecture quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    requirementsAnalysis,
    informationArchitecture,
    taxonomyDevelopment,
    navigationDesign,
    searchStrategy,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  // ============================================================================
  // PHASE 10: STAKEHOLDER REVIEW (IF REQUIRED)
  // ============================================================================

  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, {
      architecture: informationArchitecture.architecture,
      taxonomy: taxonomyDevelopment.taxonomy,
      navigationDesign: navigationDesign.design,
      governanceFramework: governanceFramework.framework,
      qualityScore: qualityAssessment.overallScore,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Final approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Finalize architecture?`,
      title: 'Final Approval Gate',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
        summary: {
          approved: reviewResult.approved,
          qualityScore: qualityAssessment.overallScore
        }
      }
    });
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    architecture: informationArchitecture.architecture,
    taxonomy: taxonomyDevelopment.taxonomy,
    metadataSchema: metadataSchema.schema,
    navigationDesign: navigationDesign.design,
    searchStrategy: searchStrategy.strategy,
    governanceFramework: governanceFramework.framework,
    integrationArchitecture: integrationArchitecture.architecture,
    statistics: {
      contentTypesSupported: contentTypes.length,
      userPersonasAddressed: userPersonas.length,
      taxonomyCategories: taxonomyDevelopment.totalCategories,
      metadataFields: metadataSchema.fieldCount
    },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/business/knowledge-management/enterprise-knowledge-base-architecture',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Requirements Analysis
export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze knowledge base requirements',
  agent: {
    name: 'requirements-analyst',
    prompt: {
      role: 'knowledge base requirements analyst',
      task: 'Analyze and document knowledge base requirements',
      context: args,
      instructions: [
        'Analyze knowledge base requirements:',
        '  - User needs and use cases',
        '  - Content volume and types',
        '  - Performance requirements',
        '  - Integration requirements',
        '  - Security and access requirements',
        '  - Scalability requirements',
        'Document user personas and journeys',
        'Identify key success metrics',
        'Prioritize requirements',
        'Save requirements analysis to output directory'
      ],
      outputFormat: 'JSON with requirements (object), keyRequirements (array), userJourneys (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'keyRequirements', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        keyRequirements: { type: 'array' },
        userJourneys: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'requirements', 'analysis']
}));

// Task 2: Information Architecture
export const informationArchitectureTask = defineTask('information-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design information architecture',
  agent: {
    name: 'information-architect',
    prompt: {
      role: 'information architect',
      task: 'Design knowledge base information architecture',
      context: args,
      instructions: [
        'Design information architecture:',
        '  - Content organization structure',
        '  - Page types and templates',
        '  - Content relationships',
        '  - Hierarchy and depth',
        'Apply IA best practices',
        'Consider user mental models',
        'Design for scalability',
        'Create wireframes and diagrams',
        'Save information architecture to output directory'
      ],
      outputFormat: 'JSON with architecture (object), pageTypes (array), contentModel (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'artifacts'],
      properties: {
        architecture: { type: 'object' },
        pageTypes: { type: 'array' },
        contentModel: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'information-architecture']
}));

// Task 3: Taxonomy Development
export const taxonomyDevelopmentTask = defineTask('taxonomy-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop taxonomy and classification',
  agent: {
    name: 'taxonomy-specialist',
    prompt: {
      role: 'taxonomy and classification specialist',
      task: 'Develop knowledge base taxonomy',
      context: args,
      instructions: [
        'Develop taxonomy structure:',
        '  - Top-level categories',
        '  - Subcategories and hierarchy',
        '  - Category definitions',
        '  - Scope notes',
        'Apply taxonomy best practices',
        'Ensure mutual exclusivity',
        'Define controlled vocabulary',
        'Create synonym rings',
        'Save taxonomy to output directory'
      ],
      outputFormat: 'JSON with taxonomy (object), topLevelCategories (array), totalCategories (number), maxDepth (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['taxonomy', 'topLevelCategories', 'totalCategories', 'artifacts'],
      properties: {
        taxonomy: { type: 'object' },
        topLevelCategories: { type: 'array' },
        totalCategories: { type: 'number' },
        maxDepth: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'taxonomy', 'classification']
}));

// Task 4: Metadata Schema
export const metadataSchemaTask = defineTask('metadata-schema', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design metadata schema',
  agent: {
    name: 'metadata-architect',
    prompt: {
      role: 'metadata schema architect',
      task: 'Design metadata schema for knowledge base',
      context: args,
      instructions: [
        'Design metadata schema:',
        '  - Core metadata fields',
        '  - Content-type specific fields',
        '  - Controlled vocabulary fields',
        '  - Relationship fields',
        'Define field types and constraints',
        'Establish naming conventions',
        'Create metadata entry guidelines',
        'Save metadata schema to output directory'
      ],
      outputFormat: 'JSON with schema (object), fieldCount (number), fieldDefinitions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schema', 'fieldCount', 'artifacts'],
      properties: {
        schema: { type: 'object' },
        fieldCount: { type: 'number' },
        fieldDefinitions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'metadata', 'schema']
}));

// Task 5: Navigation Design
export const navigationDesignTask = defineTask('navigation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design navigation and discovery',
  agent: {
    name: 'ux-designer',
    prompt: {
      role: 'UX designer for knowledge navigation',
      task: 'Design navigation and discovery experience',
      context: args,
      instructions: [
        'Design navigation systems:',
        '  - Global navigation',
        '  - Local/contextual navigation',
        '  - Breadcrumbs',
        '  - Faceted navigation',
        '  - Related content links',
        'Design discovery mechanisms',
        'Create navigation wireframes',
        'Define user flows',
        'Save navigation design to output directory'
      ],
      outputFormat: 'JSON with design (object), navigationPatterns (array), wireframes (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        navigationPatterns: { type: 'array' },
        wireframes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'navigation', 'ux']
}));

// Task 6: Search Strategy
export const searchStrategyTask = defineTask('search-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop search strategy',
  agent: {
    name: 'search-specialist',
    prompt: {
      role: 'enterprise search specialist',
      task: 'Develop search strategy for knowledge base',
      context: args,
      instructions: [
        'Develop search strategy:',
        '  - Search algorithm recommendations',
        '  - Relevance tuning approach',
        '  - Faceted search design',
        '  - Autocomplete and suggestions',
        '  - Synonym handling',
        '  - Search analytics',
        'Define search UX patterns',
        'Plan search optimization approach',
        'Save search strategy to output directory'
      ],
      outputFormat: 'JSON with strategy (object), searchFeatures (array), optimizationPlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        searchFeatures: { type: 'array' },
        optimizationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'search', 'strategy']
}));

// Task 7: Governance Framework
export const governanceFrameworkTask = defineTask('governance-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design content governance framework',
  agent: {
    name: 'governance-architect',
    prompt: {
      role: 'content governance architect',
      task: 'Design content governance framework',
      context: args,
      instructions: [
        'Design governance framework:',
        '  - Content ownership model',
        '  - Review and approval workflows',
        '  - Content lifecycle management',
        '  - Quality standards',
        '  - Archival and retirement policies',
        'Define roles and responsibilities',
        'Create governance policies',
        'Define metrics and reporting',
        'Save governance framework to output directory'
      ],
      outputFormat: 'JSON with framework (object), policies (array), workflows (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        policies: { type: 'array' },
        workflows: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'governance', 'framework']
}));

// Task 8: Integration Architecture
export const integrationArchitectureTask = defineTask('integration-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design integration architecture',
  agent: {
    name: 'integration-architect',
    prompt: {
      role: 'systems integration architect',
      task: 'Design integration architecture for knowledge base',
      context: args,
      instructions: [
        'Design integration architecture:',
        '  - Source system integrations',
        '  - API design',
        '  - Data synchronization',
        '  - Authentication and authorization',
        '  - Content federation',
        'Define integration patterns',
        'Plan migration approach',
        'Create integration diagrams',
        'Save integration architecture to output directory'
      ],
      outputFormat: 'JSON with architecture (object), integrations (array), apiDesign (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'artifacts'],
      properties: {
        architecture: { type: 'object' },
        integrations: { type: 'array' },
        apiDesign: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'integration', 'architecture']
}));

// Task 9: Quality Assessment
export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess architecture quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'architecture quality assessor',
      task: 'Evaluate the quality of the knowledge base architecture',
      context: args,
      instructions: [
        'Assess architecture quality:',
        '  - Requirements coverage',
        '  - Usability and findability',
        '  - Scalability and extensibility',
        '  - Governance adequacy',
        '  - Integration feasibility',
        'Calculate overall quality score',
        'Identify gaps and risks',
        'Provide recommendations',
        'Save quality assessment to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), qualityDimensions (object), risks (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        qualityDimensions: { type: 'object' },
        risks: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'quality', 'assessment']
}));

// Task 10: Stakeholder Review
export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'project manager facilitating stakeholder review',
      task: 'Coordinate stakeholder review and approval',
      context: args,
      instructions: [
        'Present architecture to stakeholders',
        'Review information architecture',
        'Present taxonomy and metadata',
        'Present navigation and search design',
        'Present governance framework',
        'Gather stakeholder feedback',
        'Obtain approval or identify changes',
        'Document decisions and action items',
        'Save stakeholder review results to output directory'
      ],
      outputFormat: 'JSON with approved (boolean), stakeholders (array), feedback (array), actionItems (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'stakeholders', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        stakeholders: { type: 'array', items: { type: 'string' } },
        feedback: { type: 'array' },
        actionItems: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));
