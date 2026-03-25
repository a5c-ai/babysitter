/**
 * @process specializations/technical-documentation/knowledge-base-setup
 * @description Knowledge Base Setup and Content Organization process with information architecture design, content structure creation, taxonomy development, migration planning, and quality validation
 * @specialization Technical Documentation
 * @category Knowledge Management
 * @inputs { projectName: string, contentSources: array, targetPlatform: string, organizationalStructure: string, userRoles: array, migrationRequired: boolean, outputDir: string }
 * @outputs { success: boolean, knowledgeBasePath: string, structure: object, taxonomy: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = '',
    contentSources = [], // existing docs, wikis, support tickets, etc.
    targetPlatform = 'confluence', // confluence, notion, gitbook, docusaurus, custom
    organizationalStructure = 'hierarchical', // hierarchical, faceted, hybrid
    userRoles = ['end-users', 'developers', 'admins'], // audience segments
    migrationRequired = false,
    existingKnowledgeBase = null,
    contentTypes = ['how-to', 'troubleshooting', 'reference', 'concepts'],
    searchRequirements = { enabled: true, faceted: true, fullText: true },
    accessControl = { required: false, roleBasedAccess: false },
    outputDir = 'knowledge-base-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Knowledge Base Setup and Content Organization Process');

  // ============================================================================
  // PHASE 1: DISCOVERY AND NEEDS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing existing content and assessing knowledge base needs');
  const needsAssessment = await ctx.task(needsAssessmentTask, {
    projectName,
    contentSources,
    targetPlatform,
    userRoles,
    existingKnowledgeBase,
    outputDir
  });

  artifacts.push(...needsAssessment.artifacts);

  if (!needsAssessment.hasSufficientContent) {
    ctx.log('warn', 'Insufficient content or information to build knowledge base');
    return {
      success: false,
      reason: 'Insufficient content',
      missingContent: needsAssessment.missingContent,
      recommendations: needsAssessment.recommendations,
      metadata: {
        processId: 'specializations/technical-documentation/knowledge-base-setup',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 2: INFORMATION ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing information architecture and taxonomy');
  const informationArchitecture = await ctx.task(informationArchitectureTask, {
    projectName,
    contentInventory: needsAssessment.contentInventory,
    organizationalStructure,
    userRoles,
    contentTypes,
    outputDir
  });

  artifacts.push(...informationArchitecture.artifacts);

  // Breakpoint: Review information architecture
  await ctx.breakpoint({
    question: `Information architecture designed with ${informationArchitecture.categoryCount} categories and ${informationArchitecture.subcategoryCount} subcategories. Review structure?`,
    title: 'Information Architecture Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        projectName,
        organizationalStructure,
        categories: informationArchitecture.categoryCount,
        subcategories: informationArchitecture.subcategoryCount,
        depth: informationArchitecture.hierarchyDepth
      }
    }
  });

  // ============================================================================
  // PHASE 3: TAXONOMY AND METADATA DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing taxonomy, tags, and metadata schema');
  const taxonomyDevelopment = await ctx.task(taxonomyDevelopmentTask, {
    projectName,
    informationArchitecture: informationArchitecture.structure,
    contentInventory: needsAssessment.contentInventory,
    userRoles,
    searchRequirements,
    outputDir
  });

  artifacts.push(...taxonomyDevelopment.artifacts);

  // ============================================================================
  // PHASE 4: CONTENT STRUCTURE AND TEMPLATES
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating content structure and documentation templates');
  const contentStructure = await ctx.task(contentStructureTask, {
    projectName,
    informationArchitecture: informationArchitecture.structure,
    taxonomy: taxonomyDevelopment.taxonomy,
    contentTypes,
    targetPlatform,
    outputDir
  });

  artifacts.push(...contentStructure.artifacts);

  // ============================================================================
  // PHASE 5: NAVIGATION AND FINDABILITY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing navigation menus, search, and findability features');
  const navigationDesign = await ctx.task(navigationDesignTask, {
    projectName,
    informationArchitecture: informationArchitecture.structure,
    taxonomy: taxonomyDevelopment.taxonomy,
    searchRequirements,
    targetPlatform,
    outputDir
  });

  artifacts.push(...navigationDesign.artifacts);

  // ============================================================================
  // PHASE 6: CONTENT ORGANIZATION AND CATEGORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Organizing and categorizing existing content');
  const contentOrganization = await ctx.task(contentOrganizationTask, {
    projectName,
    contentInventory: needsAssessment.contentInventory,
    informationArchitecture: informationArchitecture.structure,
    taxonomy: taxonomyDevelopment.taxonomy,
    outputDir
  });

  artifacts.push(...contentOrganization.artifacts);

  // Breakpoint: Review content organization
  await ctx.breakpoint({
    question: `${contentOrganization.organizedItemCount} content items organized into knowledge base structure. Review categorization?`,
    title: 'Content Organization Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        totalItems: contentOrganization.organizedItemCount,
        categorized: contentOrganization.categorizedCount,
        needsReview: contentOrganization.needsReviewCount,
        duplicatesFound: contentOrganization.duplicatesFound
      }
    }
  });

  // ============================================================================
  // PHASE 7: MIGRATION PLANNING (IF REQUIRED)
  // ============================================================================

  let migrationPlan = null;
  if (migrationRequired && existingKnowledgeBase) {
    ctx.log('info', 'Phase 7: Creating migration plan and strategy');
    migrationPlan = await ctx.task(migrationPlanningTask, {
      projectName,
      existingKnowledgeBase,
      targetPlatform,
      contentInventory: needsAssessment.contentInventory,
      newStructure: informationArchitecture.structure,
      outputDir
    });

    artifacts.push(...migrationPlan.artifacts);

    // Breakpoint: Review migration plan
    await ctx.breakpoint({
      question: `Migration plan created with ${migrationPlan.phaseCount} phases. Estimated ${migrationPlan.estimatedDuration}. Review migration strategy?`,
      title: 'Migration Plan Review',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
        summary: {
          phases: migrationPlan.phaseCount,
          contentItems: migrationPlan.itemsToMigrate,
          estimatedDuration: migrationPlan.estimatedDuration,
          risks: migrationPlan.risks.length
        }
      }
    });
  }

  // ============================================================================
  // PHASE 8: ACCESS CONTROL AND PERMISSIONS (IF REQUIRED)
  // ============================================================================

  let accessControlSetup = null;
  if (accessControl.required) {
    ctx.log('info', 'Phase 8: Configuring access control and permissions');
    accessControlSetup = await ctx.task(accessControlTask, {
      projectName,
      userRoles,
      informationArchitecture: informationArchitecture.structure,
      accessControl,
      targetPlatform,
      outputDir
    });

    artifacts.push(...accessControlSetup.artifacts);
  }

  // ============================================================================
  // PHASE 9: SEARCH AND DISCOVERY SETUP
  // ============================================================================

  ctx.log('info', 'Phase 9: Configuring search functionality and content discovery');
  const searchSetup = await ctx.task(searchSetupTask, {
    projectName,
    informationArchitecture: informationArchitecture.structure,
    taxonomy: taxonomyDevelopment.taxonomy,
    searchRequirements,
    targetPlatform,
    outputDir
  });

  artifacts.push(...searchSetup.artifacts);

  // ============================================================================
  // PHASE 10: KNOWLEDGE BASE IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Implementing knowledge base structure and configuration');
  const implementation = await ctx.task(implementationTask, {
    projectName,
    targetPlatform,
    informationArchitecture: informationArchitecture.structure,
    taxonomy: taxonomyDevelopment.taxonomy,
    contentStructure: contentStructure.templates,
    navigationDesign: navigationDesign.navigationConfig,
    searchSetup: searchSetup.searchConfig,
    accessControlSetup: accessControlSetup?.permissionsMatrix,
    outputDir
  });

  artifacts.push(...implementation.artifacts);

  // ============================================================================
  // PHASE 11: QUALITY VALIDATION AND TESTING
  // ============================================================================

  ctx.log('info', 'Phase 11: Validating knowledge base quality and usability');
  const qualityValidation = await ctx.task(qualityValidationTask, {
    projectName,
    informationArchitecture: informationArchitecture.structure,
    taxonomy: taxonomyDevelopment.taxonomy,
    contentOrganization: contentOrganization.organizationMap,
    navigationDesign: navigationDesign.navigationConfig,
    searchSetup: searchSetup.searchConfig,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const qualityMet = qualityValidation.overallScore >= 80;

  // Breakpoint: Review quality validation
  await ctx.breakpoint({
    question: `Knowledge base quality score: ${qualityValidation.overallScore}/100. ${qualityMet ? 'Quality standards met!' : 'May need improvements.'} Review results?`,
    title: 'Quality Validation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        qualityScore: qualityValidation.overallScore,
        qualityMet,
        findabilityScore: qualityValidation.componentScores.findability,
        usabilityScore: qualityValidation.componentScores.usability,
        issues: qualityValidation.issues.length
      }
    }
  });

  // ============================================================================
  // PHASE 12: GOVERNANCE AND MAINTENANCE PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 12: Creating governance model and maintenance plan');
  const governance = await ctx.task(governanceTask, {
    projectName,
    informationArchitecture: informationArchitecture.structure,
    userRoles,
    targetPlatform,
    outputDir
  });

  artifacts.push(...governance.artifacts);

  // ============================================================================
  // PHASE 13: STAKEHOLDER REVIEW (IF REQUIRED)
  // ============================================================================

  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 13: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, {
      projectName,
      informationArchitecture: informationArchitecture.structure,
      taxonomy: taxonomyDevelopment.taxonomy,
      implementation: implementation.implementationDetails,
      qualityScore: qualityValidation.overallScore,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Review approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Proceed with finalization?`,
      title: 'Stakeholder Approval Gate',
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
          stakeholdersCount: reviewResult.stakeholders.length,
          feedbackItems: reviewResult.feedback.length,
          revisionsNeeded: reviewResult.revisionsNeeded
        }
      }
    });
  }

  // ============================================================================
  // PHASE 14: DOCUMENTATION AND TRAINING MATERIALS
  // ============================================================================

  ctx.log('info', 'Phase 14: Creating user documentation and training materials');
  const documentation = await ctx.task(documentationTask, {
    projectName,
    informationArchitecture: informationArchitecture.structure,
    taxonomy: taxonomyDevelopment.taxonomy,
    navigationDesign: navigationDesign.navigationConfig,
    governance: governance.governanceModel,
    userRoles,
    targetPlatform,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 15: DEPLOYMENT AND LAUNCH PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 15: Planning knowledge base deployment and launch');
  const deployment = await ctx.task(deploymentTask, {
    projectName,
    targetPlatform,
    implementation: implementation.implementationDetails,
    migrationPlan: migrationPlan?.migrationSchedule,
    governance: governance.governanceModel,
    documentation: documentation.userGuides,
    outputDir
  });

  artifacts.push(...deployment.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    targetPlatform,
    knowledgeBasePath: implementation.knowledgeBasePath,
    structure: {
      informationArchitecture: informationArchitecture.structure,
      categoryCount: informationArchitecture.categoryCount,
      subcategoryCount: informationArchitecture.subcategoryCount,
      hierarchyDepth: informationArchitecture.hierarchyDepth
    },
    taxonomy: {
      tags: taxonomyDevelopment.taxonomy.tags.length,
      categories: taxonomyDevelopment.taxonomy.categories.length,
      metadataFields: taxonomyDevelopment.taxonomy.metadataFields.length
    },
    qualityScore: qualityValidation.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    statistics: {
      contentItemsOrganized: contentOrganization.organizedItemCount,
      categoriesCreated: informationArchitecture.categoryCount,
      templatesCreated: contentStructure.templateCount,
      navigationPaths: navigationDesign.pathCount,
      searchFacets: searchSetup.facetCount,
      governancePolicies: governance.policyCount
    },
    migration: migrationPlan ? {
      required: true,
      phases: migrationPlan.phaseCount,
      estimatedDuration: migrationPlan.estimatedDuration
    } : { required: false },
    deployment: {
      readyForLaunch: deployment.readyForLaunch,
      launchDate: deployment.plannedLaunchDate,
      rolloutStrategy: deployment.rolloutStrategy
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/technical-documentation/knowledge-base-setup',
      timestamp: startTime,
      outputDir,
      organizationalStructure,
      targetPlatform
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Needs Assessment
export const needsAssessmentTask = defineTask('needs-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess knowledge base needs and analyze existing content',
  agent: {
    name: 'knowledge-management-analyst',
    prompt: {
      role: 'knowledge management analyst and information architect',
      task: 'Analyze existing content sources and assess knowledge base requirements',
      context: args,
      instructions: [
        'Audit existing content sources (documentation, wikis, support articles, etc.)',
        'Create content inventory with:',
        '  - Content type and format',
        '  - Topic and subject matter',
        '  - Quality and currency assessment',
        '  - Ownership and maintenance status',
        '  - Usage and access patterns',
        'Analyze user roles and their information needs',
        'Identify content gaps and redundancies',
        'Assess content duplication and inconsistencies',
        'Evaluate existing knowledge base (if any)',
        'Analyze search and navigation pain points',
        'Document user feedback and common issues',
        'Identify critical vs. nice-to-have content',
        'Assess technical constraints and platform requirements',
        'Determine if sufficient content exists to build knowledge base',
        'Provide recommendations for content organization approach',
        'Save needs assessment report to output directory'
      ],
      outputFormat: 'JSON with hasSufficientContent (boolean), contentInventory (array), contentGaps (array), redundancies (array), userNeeds (object), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hasSufficientContent', 'contentInventory', 'recommendations', 'artifacts'],
      properties: {
        hasSufficientContent: { type: 'boolean' },
        contentInventory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              contentType: { type: 'string' },
              source: { type: 'string' },
              topic: { type: 'string' },
              quality: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
              currency: { type: 'string', enum: ['current', 'outdated', 'unknown'] },
              audience: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        contentGaps: { type: 'array', items: { type: 'string' } },
        redundancies: { type: 'array', items: { type: 'string' } },
        missingContent: { type: 'array', items: { type: 'string' } },
        userNeeds: {
          type: 'object',
          properties: {
            painPoints: { type: 'array', items: { type: 'string' } },
            searchBehaviors: { type: 'array', items: { type: 'string' } },
            priorityTopics: { type: 'array', items: { type: 'string' } }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'needs-assessment', 'content-audit']
}));

// Task 2: Information Architecture Design
export const informationArchitectureTask = defineTask('information-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design information architecture and content hierarchy',
  agent: {
    name: 'information-architect',
    prompt: {
      role: 'senior information architect specializing in knowledge management',
      task: 'Design comprehensive information architecture for knowledge base',
      context: args,
      instructions: [
        'Analyze content inventory and user needs',
        'Design organizational structure based on specified approach:',
        '  - Hierarchical: tree structure with categories and subcategories',
        '  - Faceted: multi-dimensional classification with filters',
        '  - Hybrid: combination of hierarchy and facets',
        'Create top-level categories (5-10 optimal)',
        'Design subcategory structure (2-3 levels deep maximum)',
        'Ensure clear category boundaries and mutual exclusivity',
        'Design for user mental models and task flows',
        'Create category descriptions and scope definitions',
        'Map content inventory to proposed structure',
        'Design navigation pathways between categories',
        'Plan for content growth and scalability',
        'Include cross-category relationships and related content',
        'Create visual hierarchy diagrams and sitemaps',
        'Optimize for findability and discoverability',
        'Save information architecture design to output directory'
      ],
      outputFormat: 'JSON with structure (hierarchical object), categoryCount (number), subcategoryCount (number), hierarchyDepth (number), categoryDescriptions (object), contentMapping (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'categoryCount', 'subcategoryCount', 'hierarchyDepth', 'artifacts'],
      properties: {
        structure: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              subcategories: { type: 'array' },
              contentTypes: { type: 'array', items: { type: 'string' } },
              targetAudience: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        categoryCount: { type: 'number' },
        subcategoryCount: { type: 'number' },
        hierarchyDepth: { type: 'number' },
        categoryDescriptions: { type: 'object' },
        contentMapping: { type: 'object' },
        navigationPaths: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'information-architecture', 'ux']
}));

// Task 3: Taxonomy Development
export const taxonomyDevelopmentTask = defineTask('taxonomy-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop taxonomy, tags, and metadata schema',
  agent: {
    name: 'taxonomy-specialist',
    prompt: {
      role: 'taxonomy specialist and metadata architect',
      task: 'Create comprehensive taxonomy and metadata schema for knowledge base',
      context: args,
      instructions: [
        'Design controlled vocabulary and tagging system',
        'Create hierarchical taxonomy aligned with information architecture',
        'Develop flat tag list for cross-cutting topics',
        'Design metadata schema with standardized fields:',
        '  - Title, description, keywords',
        '  - Content type, format',
        '  - Author, owner, reviewers',
        '  - Created date, modified date, review date',
        '  - Audience, user role, experience level',
        '  - Status (draft, published, archived)',
        '  - Related content, prerequisites',
        '  - Version, language',
        'Create tag guidelines and naming conventions',
        'Define facets for filtering and navigation:',
        '  - By content type (how-to, troubleshooting, reference)',
        '  - By user role (admin, developer, end-user)',
        '  - By product/feature area',
        '  - By difficulty level',
        'Design synonym management for search',
        'Include preferred terms and deprecated terms',
        'Create taxonomy governance rules',
        'Save taxonomy and metadata schema to output directory'
      ],
      outputFormat: 'JSON with taxonomy (object with categories, tags, metadataFields), tagCount (number), metadataSchema (object), facets (array), synonyms (object), guidelines (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['taxonomy', 'tagCount', 'metadataSchema', 'artifacts'],
      properties: {
        taxonomy: {
          type: 'object',
          properties: {
            categories: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } },
            metadataFields: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  required: { type: 'boolean' },
                  values: { type: 'array' }
                }
              }
            }
          }
        },
        tagCount: { type: 'number' },
        metadataSchema: { type: 'object' },
        facets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              field: { type: 'string' },
              values: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        synonyms: { type: 'object' },
        guidelines: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'taxonomy', 'metadata']
}));

// Task 4: Content Structure and Templates
export const contentStructureTask = defineTask('content-structure-templates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create content structure and documentation templates',
  agent: {
    name: 'content-designer',
    prompt: {
      role: 'content designer and technical writer',
      task: 'Design content structure and create reusable templates for different content types',
      context: args,
      instructions: [
        'Create standardized page structure for knowledge base articles',
        'Design templates for each content type:',
        '  - How-to guides (problem, solution, steps, examples)',
        '  - Troubleshooting articles (symptoms, diagnosis, resolution)',
        '  - Reference documentation (specifications, parameters, examples)',
        '  - Concept explainers (overview, details, use cases)',
        '  - FAQs (question, answer, related articles)',
        'Include standard sections:',
        '  - Title and summary',
        '  - Prerequisites and requirements',
        '  - Main content body',
        '  - Examples and code snippets',
        '  - Related articles and next steps',
        '  - Feedback mechanism',
        'Design content formatting standards:',
        '  - Headings hierarchy',
        '  - Code block formatting',
        '  - Screenshots and images',
        '  - Callouts and warnings',
        '  - Tables and lists',
        'Create template files for target platform format',
        'Include metadata placeholders in templates',
        'Design reusable content components (snippets, includes)',
        'Save templates and content structure guide to output directory'
      ],
      outputFormat: 'JSON with templates (object with template content by type), templateCount (number), contentStructure (object), formattingStandards (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['templates', 'templateCount', 'contentStructure', 'artifacts'],
      properties: {
        templates: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              content: { type: 'string' },
              metadata: { type: 'object' },
              sections: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        templateCount: { type: 'number' },
        contentStructure: {
          type: 'object',
          properties: {
            standardSections: { type: 'array', items: { type: 'string' } },
            requiredElements: { type: 'array', items: { type: 'string' } },
            optionalElements: { type: 'array', items: { type: 'string' } }
          }
        },
        formattingStandards: { type: 'object' },
        reusableComponents: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'content-design', 'templates']
}));

// Task 5: Navigation Design
export const navigationDesignTask = defineTask('navigation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design navigation menus, search, and findability features',
  agent: {
    name: 'ux-designer',
    prompt: {
      role: 'UX designer specializing in information findability',
      task: 'Design navigation system and findability features for knowledge base',
      context: args,
      instructions: [
        'Design primary navigation menu based on information architecture',
        'Create navigation hierarchy (global, section, local)',
        'Design category landing pages with:',
        '  - Category overview and description',
        '  - Featured/popular articles',
        '  - Subcategory list',
        '  - Recent updates',
        'Design search experience:',
        '  - Search bar placement and prominence',
        '  - Auto-complete and suggestions',
        '  - Search results layout and ranking',
        '  - Filters and facets for refinement',
        '  - Search analytics and popular searches',
        'Design breadcrumb navigation',
        'Create "related articles" and "see also" recommendations',
        'Design table of contents for long articles',
        'Include "most popular" and "trending" sections',
        'Design mobile-responsive navigation',
        'Create quick links and shortcuts for common tasks',
        'Design onboarding experience for first-time users',
        'Include feedback and help mechanisms',
        'Save navigation design specifications to output directory'
      ],
      outputFormat: 'JSON with navigationConfig (object), searchConfig (object), landingPageDesign (object), pathCount (number), breadcrumbStrategy (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['navigationConfig', 'searchConfig', 'pathCount', 'artifacts'],
      properties: {
        navigationConfig: {
          type: 'object',
          properties: {
            primaryNav: { type: 'array' },
            secondaryNav: { type: 'array' },
            footerNav: { type: 'array' },
            mobileNav: { type: 'object' }
          }
        },
        searchConfig: {
          type: 'object',
          properties: {
            searchBarPlacement: { type: 'string' },
            autoComplete: { type: 'boolean' },
            filters: { type: 'array', items: { type: 'string' } },
            rankingFactors: { type: 'array', items: { type: 'string' } }
          }
        },
        landingPageDesign: { type: 'object' },
        pathCount: { type: 'number' },
        breadcrumbStrategy: { type: 'object' },
        relatedContentStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'navigation', 'ux', 'findability']
}));

// Task 6: Content Organization
export const contentOrganizationTask = defineTask('content-organization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Organize and categorize existing content',
  agent: {
    name: 'content-organizer',
    prompt: {
      role: 'content strategist and information organizer',
      task: 'Categorize and organize existing content into knowledge base structure',
      context: args,
      instructions: [
        'Review content inventory from needs assessment',
        'Map each content item to appropriate category/subcategory',
        'Apply taxonomy tags and metadata to content items',
        'Identify content that needs:',
        '  - Splitting (one document → multiple articles)',
        '  - Merging (multiple documents → one comprehensive article)',
        '  - Updating (outdated information)',
        '  - Rewriting (poor quality)',
        '  - Archiving (obsolete content)',
        'Flag duplicate content for consolidation',
        'Identify orphan content (no clear category)',
        'Prioritize content by importance and usage',
        'Create content mapping document showing:',
        '  - Original source → New location',
        '  - Required transformations',
        '  - Assigned owner',
        'Identify content gaps requiring new articles',
        'Estimate effort for content transformation',
        'Create content organization report and mapping',
        'Save content organization plan to output directory'
      ],
      outputFormat: 'JSON with organizationMap (object), organizedItemCount (number), categorizedCount (number), needsReviewCount (number), duplicatesFound (array), contentGaps (array), orphanContent (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['organizationMap', 'organizedItemCount', 'categorizedCount', 'artifacts'],
      properties: {
        organizationMap: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              originalSource: { type: 'string' },
              newLocation: { type: 'string' },
              category: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              action: { type: 'string', enum: ['migrate', 'split', 'merge', 'rewrite', 'archive'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              owner: { type: 'string' }
            }
          }
        },
        organizedItemCount: { type: 'number' },
        categorizedCount: { type: 'number' },
        needsReviewCount: { type: 'number' },
        duplicatesFound: { type: 'array', items: { type: 'string' } },
        contentGaps: { type: 'array', items: { type: 'string' } },
        orphanContent: { type: 'array', items: { type: 'string' } },
        transformationEffort: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'content-organization', 'categorization']
}));

// Task 7: Migration Planning
export const migrationPlanningTask = defineTask('migration-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create migration plan and strategy',
  agent: {
    name: 'migration-specialist',
    prompt: {
      role: 'knowledge base migration specialist and project manager',
      task: 'Create comprehensive migration plan from existing KB to new structure',
      context: args,
      instructions: [
        'Analyze existing knowledge base platform and structure',
        'Identify migration scope and boundaries',
        'Create phased migration approach:',
        '  - Phase 1: High-priority, high-traffic content',
        '  - Phase 2: Core documentation and guides',
        '  - Phase 3: Legacy and archived content',
        'Document migration methodology:',
        '  - Content export process',
        '  - Format conversion requirements',
        '  - URL mapping and redirects',
        '  - Metadata migration',
        '  - Image and asset migration',
        'Identify technical challenges and dependencies',
        'Create migration timeline with milestones',
        'Estimate effort and resources required',
        'Plan for content freeze periods',
        'Design rollback strategy',
        'Create testing and validation plan',
        'Document risks and mitigation strategies:',
        '  - Data loss prevention',
        '  - SEO impact (URL changes)',
        '  - User disruption',
        '  - Training requirements',
        'Plan communication strategy for users',
        'Save migration plan to output directory'
      ],
      outputFormat: 'JSON with migrationSchedule (object), phaseCount (number), itemsToMigrate (number), estimatedDuration (string), risks (array), methodology (object), rollbackPlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['migrationSchedule', 'phaseCount', 'itemsToMigrate', 'estimatedDuration', 'artifacts'],
      properties: {
        migrationSchedule: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'number' },
                  name: { type: 'string' },
                  itemCount: { type: 'number' },
                  duration: { type: 'string' },
                  dependencies: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            milestones: { type: 'array' }
          }
        },
        phaseCount: { type: 'number' },
        itemsToMigrate: { type: 'number' },
        estimatedDuration: { type: 'string' },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              impact: { type: 'string', enum: ['low', 'medium', 'high'] },
              mitigation: { type: 'string' }
            }
          }
        },
        methodology: { type: 'object' },
        urlMapping: { type: 'object' },
        rollbackPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'migration', 'project-management']
}));

// Task 8: Access Control Setup
export const accessControlTask = defineTask('access-control-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure access control and permissions',
  agent: {
    name: 'security-architect',
    prompt: {
      role: 'security architect and access management specialist',
      task: 'Design and configure access control system for knowledge base',
      context: args,
      instructions: [
        'Define user roles and permission levels:',
        '  - Anonymous users (public content)',
        '  - Authenticated users (general access)',
        '  - Contributors (create/edit content)',
        '  - Editors (review/approve content)',
        '  - Admins (full control)',
        'Map information architecture to access requirements',
        'Design role-based access control (RBAC) matrix',
        'Configure permission inheritance in hierarchy',
        'Design content visibility rules:',
        '  - Public vs. internal content',
        '  - Department/team-specific content',
        '  - Confidential/sensitive content',
        'Plan authentication and SSO integration',
        'Design permission delegation and sharing',
        'Create access request and approval workflow',
        'Plan audit logging and compliance',
        'Document security best practices',
        'Create permissions documentation for admins',
        'Save access control configuration to output directory'
      ],
      outputFormat: 'JSON with permissionsMatrix (object), roles (array), accessRules (array), authenticationConfig (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['permissionsMatrix', 'roles', 'accessRules', 'artifacts'],
      properties: {
        permissionsMatrix: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              read: { type: 'array', items: { type: 'string' } },
              write: { type: 'array', items: { type: 'string' } },
              delete: { type: 'array', items: { type: 'string' } },
              admin: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              permissions: { type: 'array', items: { type: 'string' } },
              description: { type: 'string' }
            }
          }
        },
        accessRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              visibility: { type: 'string' },
              allowedRoles: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        authenticationConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'access-control', 'security']
}));

// Task 9: Search Setup
export const searchSetupTask = defineTask('search-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure search functionality and content discovery',
  agent: {
    name: 'search-engineer',
    prompt: {
      role: 'search engineer and information retrieval specialist',
      task: 'Configure search functionality and optimize content discoverability',
      context: args,
      instructions: [
        'Configure full-text search engine for target platform',
        'Define search index schema with:',
        '  - Title (high weight)',
        '  - Content body (medium weight)',
        '  - Tags and categories (high weight)',
        '  - Metadata fields',
        'Configure search ranking factors:',
        '  - Relevance score',
        '  - Recency (updated date)',
        '  - Popularity (view count, ratings)',
        '  - User role and context',
        'Setup search filters and facets from taxonomy',
        'Configure auto-complete and search suggestions',
        'Setup synonym dictionary for better recall',
        'Configure "did you mean?" spelling correction',
        'Design search results page layout:',
        '  - Result snippets with highlighting',
        '  - Filters sidebar',
        '  - Sort options',
        '  - Pagination',
        'Setup search analytics and tracking',
        'Configure related content recommendations',
        'Plan zero-results handling and suggestions',
        'Optimize search performance and indexing',
        'Save search configuration to output directory'
      ],
      outputFormat: 'JSON with searchConfig (object), indexSchema (object), facetCount (number), rankingFactors (array), filters (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['searchConfig', 'indexSchema', 'facetCount', 'artifacts'],
      properties: {
        searchConfig: {
          type: 'object',
          properties: {
            engine: { type: 'string' },
            indexName: { type: 'string' },
            updateFrequency: { type: 'string' },
            features: { type: 'array', items: { type: 'string' } }
          }
        },
        indexSchema: {
          type: 'object',
          properties: {
            fields: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  weight: { type: 'number' },
                  indexed: { type: 'boolean' }
                }
              }
            }
          }
        },
        facetCount: { type: 'number' },
        rankingFactors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              weight: { type: 'number' }
            }
          }
        },
        filters: { type: 'array', items: { type: 'string' } },
        synonyms: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'search', 'information-retrieval']
}));

// Task 10: Implementation
export const implementationTask = defineTask('implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement knowledge base structure and configuration',
  agent: {
    name: 'knowledge-base-engineer',
    prompt: {
      role: 'knowledge base engineer and platform specialist',
      task: 'Implement knowledge base structure, configuration, and setup on target platform',
      context: args,
      instructions: [
        'Setup knowledge base platform (Confluence, Notion, GitBook, etc.)',
        'Create space/workspace with proper naming and description',
        'Implement category and subcategory structure',
        'Create landing pages for each category',
        'Configure navigation menus and sidebars',
        'Setup page templates for different content types',
        'Configure metadata fields and taxonomy tags',
        'Implement search configuration and indexing',
        'Setup access control and permissions',
        'Configure themes, branding, and styling',
        'Setup integrations (analytics, feedback, etc.)',
        'Create admin documentation and configuration guide',
        'Setup automated workflows (approval, archival, etc.)',
        'Configure notifications and alerts',
        'Create backup and disaster recovery plan',
        'Perform initial testing and validation',
        'Document all configuration settings',
        'Save implementation details to output directory'
      ],
      outputFormat: 'JSON with knowledgeBasePath (string), implementationDetails (object), configurationsApplied (array), platformSettings (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['knowledgeBasePath', 'implementationDetails', 'artifacts'],
      properties: {
        knowledgeBasePath: { type: 'string' },
        implementationDetails: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            spaceId: { type: 'string' },
            url: { type: 'string' },
            setupDate: { type: 'string' },
            version: { type: 'string' }
          }
        },
        configurationsApplied: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              configuration: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        platformSettings: { type: 'object' },
        integrations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'implementation', 'platform']
}));

// Task 11: Quality Validation
export const qualityValidationTask = defineTask('quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate knowledge base quality and usability',
  agent: {
    name: 'quality-assurance-specialist',
    prompt: {
      role: 'QA specialist and usability expert for knowledge management',
      task: 'Assess knowledge base quality, usability, and effectiveness',
      context: args,
      instructions: [
        'Evaluate Information Architecture (weight: 25%):',
        '  - Clear category structure',
        '  - Logical hierarchy and grouping',
        '  - Appropriate depth (not too deep/shallow)',
        '  - Clear category boundaries',
        'Evaluate Findability (weight: 25%):',
        '  - Navigation clarity and intuitiveness',
        '  - Search functionality and relevance',
        '  - Effective filtering and faceting',
        '  - Breadcrumb and contextual navigation',
        'Evaluate Taxonomy and Metadata (weight: 20%):',
        '  - Consistent tagging and categorization',
        '  - Complete metadata coverage',
        '  - Appropriate tag granularity',
        '  - Clear naming conventions',
        'Evaluate Usability (weight: 20%):',
        '  - Intuitive navigation paths',
        '  - Clear content structure',
        '  - Effective templates and formatting',
        '  - Mobile responsiveness',
        'Evaluate Scalability and Governance (weight: 10%):',
        '  - Room for growth',
        '  - Clear ownership and maintenance',
        '  - Version control and history',
        '  - Update and review processes',
        'Calculate weighted overall score (0-100)',
        'Identify usability issues and navigation problems',
        'Test search functionality with common queries',
        'Validate taxonomy consistency',
        'Provide specific improvement recommendations',
        'Save quality validation report to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), issues (array), searchTestResults (object), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            informationArchitecture: { type: 'number' },
            findability: { type: 'number' },
            taxonomyMetadata: { type: 'number' },
            usability: { type: 'number' },
            scalabilityGovernance: { type: 'number' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              description: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        searchTestResults: {
          type: 'object',
          properties: {
            queriesTested: { type: 'number' },
            successRate: { type: 'number' },
            avgResultsReturned: { type: 'number' },
            relevanceScore: { type: 'number' }
          }
        },
        navigationTestResults: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'quality-validation', 'usability']
}));

// Task 12: Governance Planning
export const governanceTask = defineTask('governance-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create governance model and maintenance plan',
  agent: {
    name: 'knowledge-manager',
    prompt: {
      role: 'knowledge manager and governance specialist',
      task: 'Create comprehensive governance model and maintenance plan for knowledge base',
      context: args,
      instructions: [
        'Define governance roles and responsibilities:',
        '  - Knowledge base owner (overall accountability)',
        '  - Content managers (section ownership)',
        '  - Contributors (create/update content)',
        '  - Editors/reviewers (quality control)',
        '  - Taxonomy managers (maintain classifications)',
        'Create content lifecycle policies:',
        '  - Creation and approval workflow',
        '  - Review and update schedule',
        '  - Archival and retirement policy',
        '  - Version control and change tracking',
        'Define quality standards and guidelines:',
        '  - Writing style guide',
        '  - Formatting standards',
        '  - Metadata requirements',
        '  - Image and media guidelines',
        'Create maintenance schedule:',
        '  - Regular content audits (quarterly)',
        '  - Taxonomy reviews (biannually)',
        '  - Link checking and cleanup',
        '  - Analytics review and optimization',
        'Setup metrics and KPIs:',
        '  - Content coverage (gaps identified)',
        '  - Content freshness (update frequency)',
        '  - Search effectiveness (findability rate)',
        '  - User satisfaction (feedback scores)',
        '  - Usage analytics (page views, search queries)',
        'Define escalation and decision-making processes',
        'Create training and onboarding materials for contributors',
        'Plan quarterly governance reviews',
        'Save governance documentation to output directory'
      ],
      outputFormat: 'JSON with governanceModel (object), roles (array), policies (array), maintenanceSchedule (object), metrics (array), policyCount (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['governanceModel', 'roles', 'policies', 'maintenanceSchedule', 'artifacts'],
      properties: {
        governanceModel: {
          type: 'object',
          properties: {
            ownershipStructure: { type: 'object' },
            workflowProcesses: { type: 'array' },
            qualityStandards: { type: 'object' },
            decisionMakingProcess: { type: 'string' }
          }
        },
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              authorities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        policies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              enforcementLevel: { type: 'string', enum: ['required', 'recommended', 'optional'] }
            }
          }
        },
        maintenanceSchedule: {
          type: 'object',
          properties: {
            contentAudit: { type: 'string' },
            taxonomyReview: { type: 'string' },
            analyticsReview: { type: 'string' },
            linkValidation: { type: 'string' }
          }
        },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              target: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        policyCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'governance', 'maintenance']
}));

// Task 13: Stakeholder Review
export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review and approval',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'project manager facilitating stakeholder review',
      task: 'Conduct stakeholder review of knowledge base design and implementation',
      context: args,
      instructions: [
        'Present knowledge base design to stakeholders:',
        '  - Information architecture and structure',
        '  - Taxonomy and navigation design',
        '  - Implementation approach and timeline',
        '  - Quality validation results',
        'Gather feedback from key stakeholders:',
        '  - Content owners and SMEs',
        '  - End users and user representatives',
        '  - IT and platform administrators',
        '  - Management and leadership',
        'Validate that design meets business requirements',
        'Review usability and findability concerns',
        'Assess resource requirements and timeline',
        'Identify concerns and objections',
        'Categorize feedback by severity:',
        '  - Critical issues (blockers)',
        '  - Major concerns (should address)',
        '  - Minor suggestions (nice to have)',
        'Determine if revisions are needed',
        'Document approval or required changes',
        'Create action plan for addressing feedback',
        'Save stakeholder review report to output directory'
      ],
      outputFormat: 'JSON with approved (boolean), stakeholders (array), feedback (array), revisionsNeeded (boolean), actionItems (array), approvalConditions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'stakeholders', 'feedback', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        stakeholders: { type: 'array', items: { type: 'string' } },
        feedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              category: { type: 'string' },
              comment: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] }
            }
          }
        },
        revisionsNeeded: { type: 'boolean' },
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              priority: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        approvalConditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'stakeholder-review', 'approval']
}));

// Task 14: Documentation and Training
export const documentationTask = defineTask('documentation-training', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create user documentation and training materials',
  agent: {
    name: 'training-specialist',
    prompt: {
      role: 'training specialist and documentation expert',
      task: 'Create comprehensive user documentation and training materials for knowledge base',
      context: args,
      instructions: [
        'Create user guide for knowledge base consumers:',
        '  - How to search and find information',
        '  - Understanding navigation and structure',
        '  - Using filters and facets',
        '  - Interpreting metadata and tags',
        '  - Providing feedback and ratings',
        'Create contributor guide for content creators:',
        '  - How to create new content',
        '  - Using templates and formatting',
        '  - Applying taxonomy tags',
        '  - Metadata best practices',
        '  - Approval workflow',
        'Create administrator guide:',
        '  - Platform configuration and settings',
        '  - Managing users and permissions',
        '  - Monitoring and analytics',
        '  - Maintenance tasks',
        '  - Troubleshooting common issues',
        'Create quick reference cards for common tasks',
        'Develop video tutorials or screencasts (descriptions)',
        'Create FAQ for knowledge base usage',
        'Develop onboarding checklist for new users',
        'Create training presentation materials',
        'Save all documentation and training materials to output directory'
      ],
      outputFormat: 'JSON with userGuides (object), contributorGuide (string), adminGuide (string), quickReferenceCards (array), trainingMaterials (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['userGuides', 'contributorGuide', 'adminGuide', 'artifacts'],
      properties: {
        userGuides: {
          type: 'object',
          properties: {
            searchGuide: { type: 'string' },
            navigationGuide: { type: 'string' },
            gettingStarted: { type: 'string' }
          }
        },
        contributorGuide: { type: 'string' },
        adminGuide: { type: 'string' },
        quickReferenceCards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' },
              audience: { type: 'string' }
            }
          }
        },
        trainingMaterials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        faq: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'documentation', 'training']
}));

// Task 15: Deployment Planning
export const deploymentTask = defineTask('deployment-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan knowledge base deployment and launch',
  agent: {
    name: 'launch-coordinator',
    prompt: {
      role: 'launch coordinator and change management specialist',
      task: 'Create comprehensive deployment and launch plan for knowledge base',
      context: args,
      instructions: [
        'Create phased rollout strategy:',
        '  - Pilot phase (limited users for feedback)',
        '  - Soft launch (partial rollout)',
        '  - Full launch (general availability)',
        'Develop launch timeline with milestones',
        'Plan migration execution (if applicable)',
        'Create communication and announcement plan:',
        '  - Pre-launch awareness campaign',
        '  - Launch announcement',
        '  - Training sessions and office hours',
        '  - Ongoing support and feedback channels',
        'Setup success metrics and monitoring:',
        '  - Adoption rate tracking',
        '  - Usage analytics',
        '  - User satisfaction surveys',
        '  - Search effectiveness metrics',
        'Plan support and help desk strategy',
        'Create rollback plan and contingencies',
        'Develop post-launch optimization plan:',
        '  - Collect user feedback',
        '  - Analyze usage patterns',
        '  - Identify content gaps',
        '  - Refine taxonomy and navigation',
        'Schedule post-launch review (30/60/90 days)',
        'Determine launch readiness and go/no-go criteria',
        'Save deployment plan to output directory'
      ],
      outputFormat: 'JSON with readyForLaunch (boolean), rolloutStrategy (string), plannedLaunchDate (string), launchPlan (object), successMetrics (array), communicationPlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['readyForLaunch', 'rolloutStrategy', 'launchPlan', 'artifacts'],
      properties: {
        readyForLaunch: { type: 'boolean' },
        rolloutStrategy: { type: 'string', enum: ['pilot', 'phased', 'big-bang', 'parallel'] },
        plannedLaunchDate: { type: 'string' },
        launchPlan: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  startDate: { type: 'string' },
                  endDate: { type: 'string' },
                  activities: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            milestones: { type: 'array' }
          }
        },
        successMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              measurementFrequency: { type: 'string' }
            }
          }
        },
        communicationPlan: {
          type: 'object',
          properties: {
            announcements: { type: 'array' },
            trainingSchedule: { type: 'array' },
            supportChannels: { type: 'array', items: { type: 'string' } }
          }
        },
        goNoGoCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'deployment', 'launch', 'change-management']
}));
