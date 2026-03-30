/**
 * @process ux-ui-design/information-architecture
 * @description Complete Information Architecture design process including content inventory, user research, IA strategy, sitemap design, navigation design, labeling, card sorting validation, tree testing, and documentation
 * @inputs { projectName: string, businessGoals: array, userResearch: object, existingContent: array, contentTypes: array, userTasks: array, platformType: string, outputDir: string }
 * @outputs { success: boolean, contentInventory: object, iaStrategy: object, sitemap: string, navigationStructure: object, labelingScheme: object, cardSortingResults: object, treeTestingResults: object, iaDocumentation: string, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    businessGoals = [],
    userResearch = {},
    existingContent = [],
    contentTypes = [],
    userTasks = [],
    platformType = 'website', // website, mobile-app, web-app, enterprise-software
    targetAudience = [],
    navigationStyle = 'hierarchical', // hierarchical, hub-and-spoke, nested-doll, hybrid
    outputDir = 'ia-design-output',
    includeCardSorting = true,
    includeTreeTesting = true,
    generatePrototype = false
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Information Architecture Design for ${projectName}`);

  // ============================================================================
  // PHASE 1: CONTENT INVENTORY & AUDIT
  // ============================================================================

  ctx.log('info', 'Phase 1: Content inventory and audit');
  const contentInventory = await ctx.task(contentInventoryTask, {
    projectName,
    existingContent,
    contentTypes,
    platformType,
    outputDir
  });

  artifacts.push(...contentInventory.artifacts);

  // ============================================================================
  // PHASE 2: USER RESEARCH SYNTHESIS FOR IA
  // ============================================================================

  ctx.log('info', 'Phase 2: Synthesizing user research for IA insights');
  const iaResearchSynthesis = await ctx.task(iaResearchSynthesisTask, {
    projectName,
    userResearch,
    userTasks,
    targetAudience,
    contentInventory,
    outputDir
  });

  artifacts.push(...iaResearchSynthesis.artifacts);

  // Breakpoint: Review research synthesis before strategy
  await ctx.breakpoint({
    question: `Content inventory complete (${contentInventory.totalItems} items) and user research synthesized. Key finding: ${iaResearchSynthesis.topInsight}. Approve to proceed with IA strategy?`,
    title: 'IA Research Synthesis Review',
    context: {
      runId: ctx.runId,
      files: [
        ...contentInventory.artifacts,
        ...iaResearchSynthesis.artifacts
      ].map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || 'Research Artifact'
      })),
      summary: {
        projectName,
        totalContentItems: contentInventory.totalItems,
        contentCategories: contentInventory.categories.length,
        userTasksIdentified: iaResearchSynthesis.userTaskCount,
        mentalModelInsights: iaResearchSynthesis.mentalModels.length
      }
    }
  });

  // ============================================================================
  // PHASE 3: IA STRATEGY DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining Information Architecture strategy');
  const iaStrategy = await ctx.task(iaStrategyDefinitionTask, {
    projectName,
    businessGoals,
    iaResearchSynthesis,
    contentInventory,
    navigationStyle,
    platformType,
    outputDir
  });

  artifacts.push(...iaStrategy.artifacts);

  // ============================================================================
  // PHASE 4: SITEMAP DESIGN (PARALLEL WITH NAVIGATION)
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating sitemap and navigation structure in parallel');

  const [sitemap, navigationStructure] = await ctx.parallel.all([
    ctx.task(sitemapDesignTask, {
      projectName,
      iaStrategy,
      contentInventory,
      platformType,
      outputDir
    }),
    ctx.task(navigationStructureDesignTask, {
      projectName,
      iaStrategy,
      iaResearchSynthesis,
      navigationStyle,
      platformType,
      outputDir
    })
  ]);

  artifacts.push(...sitemap.artifacts);
  artifacts.push(...navigationStructure.artifacts);

  // ============================================================================
  // PHASE 5: LABELING SCHEME DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing labeling scheme and taxonomy');
  const labelingScheme = await ctx.task(labelingSchemeDesignTask, {
    projectName,
    sitemap,
    navigationStructure,
    iaResearchSynthesis,
    platformType,
    outputDir
  });

  artifacts.push(...labelingScheme.artifacts);

  // Breakpoint: Review IA structure before validation
  await ctx.breakpoint({
    question: `IA structure complete with ${sitemap.totalPages} pages across ${sitemap.topLevelCategories} top-level categories. Navigation has ${navigationStructure.navigationLevels} levels. Review structure before validation testing?`,
    title: 'IA Structure Review',
    context: {
      runId: ctx.runId,
      files: [
        ...sitemap.artifacts,
        ...navigationStructure.artifacts,
        ...labelingScheme.artifacts
      ].map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language,
        label: a.label || 'IA Structure'
      })),
      summary: {
        projectName,
        totalPages: sitemap.totalPages,
        topLevelCategories: sitemap.topLevelCategories,
        navigationLevels: navigationStructure.navigationLevels,
        primaryNavItems: navigationStructure.primaryNavItems,
        labelingApproach: labelingScheme.approach,
        totalLabels: labelingScheme.totalLabels
      }
    }
  });

  // ============================================================================
  // PHASE 6: VALIDATION TESTING (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 6: Validation testing with users');

  const validationTasks = [];

  // Card Sorting Validation
  if (includeCardSorting) {
    validationTasks.push({
      name: 'card-sorting',
      task: cardSortingValidationTask,
      args: {
        projectName,
        labelingScheme,
        contentInventory,
        iaStrategy,
        outputDir
      }
    });
  }

  // Tree Testing Validation
  if (includeTreeTesting) {
    validationTasks.push({
      name: 'tree-testing',
      task: treeTestingValidationTask,
      args: {
        projectName,
        sitemap,
        navigationStructure,
        userTasks: iaResearchSynthesis.topTasks,
        outputDir
      }
    });
  }

  let cardSortingResults = null;
  let treeTestingResults = null;

  if (validationTasks.length > 0) {
    const validationResults = await ctx.parallel.all(
      validationTasks.map(t => ctx.task(t.task, t.args))
    );

    validationResults.forEach((result, index) => {
      if (validationTasks[index].name === 'card-sorting') {
        cardSortingResults = result;
      } else if (validationTasks[index].name === 'tree-testing') {
        treeTestingResults = result;
      }
      artifacts.push(...result.artifacts);
    });

    ctx.log('info', `Validation testing complete: ${validationTasks.length} methods conducted`);
  }

  // ============================================================================
  // PHASE 7: IA REFINEMENT BASED ON VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Refining IA based on validation results');
  const iaRefinement = await ctx.task(iaRefinementTask, {
    projectName,
    sitemap,
    navigationStructure,
    labelingScheme,
    cardSortingResults,
    treeTestingResults,
    outputDir
  });

  artifacts.push(...iaRefinement.artifacts);

  // Breakpoint: Review refinements before finalization
  await ctx.breakpoint({
    question: `IA refinement complete. ${iaRefinement.changesCount} changes recommended based on validation. ${iaRefinement.criticalIssues} critical issues identified. Review refinements?`,
    title: 'IA Refinement Review',
    context: {
      runId: ctx.runId,
      files: iaRefinement.artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || 'IA Refinement'
      })),
      summary: {
        projectName,
        changesCount: iaRefinement.changesCount,
        criticalIssues: iaRefinement.criticalIssues,
        moderateIssues: iaRefinement.moderateIssues,
        minorIssues: iaRefinement.minorIssues,
        improvementAreas: iaRefinement.improvementAreas,
        validationSuccessRate: iaRefinement.validationSuccessRate
      }
    }
  });

  // ============================================================================
  // PHASE 8: IA DOCUMENTATION & SPECIFICATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating comprehensive IA documentation');
  const iaDocumentation = await ctx.task(iaDocumentationTask, {
    projectName,
    businessGoals,
    iaStrategy,
    sitemap,
    navigationStructure,
    labelingScheme,
    iaRefinement,
    cardSortingResults,
    treeTestingResults,
    platformType,
    outputDir
  });

  artifacts.push(...iaDocumentation.artifacts);

  // ============================================================================
  // PHASE 9: WIREFRAME PROTOTYPE (OPTIONAL)
  // ============================================================================

  let wireframePrototype = null;
  if (generatePrototype) {
    ctx.log('info', 'Phase 9: Creating wireframe prototype to demonstrate IA');
    wireframePrototype = await ctx.task(wireframePrototypeTask, {
      projectName,
      sitemap,
      navigationStructure,
      labelingScheme,
      platformType,
      outputDir
    });

    artifacts.push(...wireframePrototype.artifacts);
    ctx.log('info', 'Wireframe prototype created');
  }

  // ============================================================================
  // PHASE 10: IA QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Assessing IA quality and completeness');
  const qualityAssessment = await ctx.task(iaQualityAssessmentTask, {
    projectName,
    iaStrategy,
    sitemap,
    navigationStructure,
    labelingScheme,
    cardSortingResults,
    treeTestingResults,
    iaDocumentation,
    wireframePrototype,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const qualityScore = qualityAssessment.overallScore;
  const qualityMet = qualityScore >= 80;

  // Final Breakpoint: Review complete IA deliverables
  await ctx.breakpoint({
    question: `Information Architecture complete! Quality score: ${qualityScore}/100. ${qualityMet ? 'IA meets quality standards!' : 'IA may benefit from additional refinement.'} Review and approve final deliverables?`,
    title: 'Information Architecture Final Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        qualityScore,
        qualityMet,
        projectName,
        platformType,
        totalArtifacts: artifacts.length,
        deliverables: {
          contentInventory: contentInventory.totalItems,
          sitemapPages: sitemap.totalPages,
          navigationLevels: navigationStructure.navigationLevels,
          labelsCreated: labelingScheme.totalLabels,
          validationTests: validationTasks.length,
          changesMade: iaRefinement.changesCount,
          prototypeCreated: generatePrototype
        },
        validationResults: {
          cardSortingParticipants: cardSortingResults?.participantCount || 0,
          treeTestingSuccessRate: treeTestingResults?.averageSuccessRate || 0,
          validationScore: qualityAssessment.validationScore
        }
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    platformType,
    qualityScore,
    qualityMet,
    contentInventory: {
      totalItems: contentInventory.totalItems,
      categories: contentInventory.categories,
      contentTypes: contentInventory.contentTypes,
      reportPath: contentInventory.reportPath
    },
    iaStrategy: {
      organizationSchemes: iaStrategy.organizationSchemes,
      navigationModel: iaStrategy.navigationModel,
      strategyPath: iaStrategy.documentPath
    },
    sitemap: {
      path: sitemap.diagramPath,
      totalPages: sitemap.totalPages,
      topLevelCategories: sitemap.topLevelCategories,
      maxDepth: sitemap.maxDepth
    },
    navigationStructure: {
      path: navigationStructure.specificationPath,
      navigationLevels: navigationStructure.navigationLevels,
      primaryNavItems: navigationStructure.primaryNavItems,
      navigationTypes: navigationStructure.navigationTypes
    },
    labelingScheme: {
      path: labelingScheme.documentPath,
      totalLabels: labelingScheme.totalLabels,
      approach: labelingScheme.approach,
      taxonomyPath: labelingScheme.taxonomyPath
    },
    cardSortingResults: cardSortingResults ? {
      participantCount: cardSortingResults.participantCount,
      agreementScore: cardSortingResults.agreementScore,
      dendrogramPath: cardSortingResults.dendrogramPath,
      recommendationsCount: cardSortingResults.recommendations.length
    } : null,
    treeTestingResults: treeTestingResults ? {
      participantCount: treeTestingResults.participantCount,
      averageSuccessRate: treeTestingResults.averageSuccessRate,
      averageDirectness: treeTestingResults.averageDirectness,
      problemAreasCount: treeTestingResults.problemAreas.length
    } : null,
    iaDocumentation: iaDocumentation.masterDocumentPath,
    wireframePrototype: wireframePrototype ? wireframePrototype.prototypePath : null,
    artifacts,
    duration,
    metadata: {
      processId: 'ux-ui-design/information-architecture',
      timestamp: startTime,
      projectName,
      platformType,
      navigationStyle,
      outputDir,
      validationMethodsUsed: validationTasks.map(t => t.name),
      totalChangesFromValidation: iaRefinement.changesCount
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Content Inventory & Audit
export const contentInventoryTask = defineTask('content-inventory-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct content inventory and audit',
  agent: {
    name: 'content-inventory-specialist',
    prompt: {
      role: 'information architect and content strategist',
      task: 'Perform comprehensive content inventory and audit to catalog all existing content, identify content types, assess quality, and categorize for IA design',
      context: args,
      instructions: [
        'Analyze all existing content provided in existingContent array',
        'Catalog each content item with: title, URL/location, content type, category, owner, last updated',
        'Identify all content types present (articles, products, services, tools, resources, etc.)',
        'Assess content quality: accuracy, relevance, usefulness, findability issues',
        'Identify content gaps based on contentTypes and platform requirements',
        'Group content into logical categories and subcategories',
        'Identify duplicate or overlapping content',
        'Flag outdated or low-quality content for removal/revision',
        'Calculate content inventory metrics (total items, content types distribution)',
        'Create detailed content inventory spreadsheet/document',
        'Generate content audit recommendations'
      ],
      outputFormat: 'JSON with totalItems, categories (array), contentTypes (array), contentQualityScore, gaps (array), duplicates (array), reportPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalItems', 'categories', 'contentTypes', 'reportPath', 'artifacts'],
      properties: {
        totalItems: { type: 'number' },
        categories: { type: 'array', items: { type: 'string' } },
        contentTypes: { type: 'array', items: { type: 'string' } },
        contentQualityScore: { type: 'number', minimum: 0, maximum: 100 },
        gaps: { type: 'array', items: { type: 'string' } },
        duplicates: { type: 'array', items: { type: 'string' } },
        outdatedContent: { type: 'array', items: { type: 'string' } },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'information-architecture', 'content-inventory']
}));

// Task 2: IA Research Synthesis
export const iaResearchSynthesisTask = defineTask('ia-research-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize user research for IA insights',
  agent: {
    name: 'ia-research-analyst',
    prompt: {
      role: 'UX researcher specializing in information architecture',
      task: 'Analyze user research to extract insights critical for IA design: mental models, task flows, findability needs, vocabulary preferences',
      context: args,
      instructions: [
        'Review all user research data: interviews, personas, analytics, surveys',
        'Identify user mental models: how users think about and categorize information',
        'Extract top user tasks that IA must support (find, compare, purchase, learn, etc.)',
        'Analyze user vocabulary and terminology preferences for labels',
        'Identify user pain points with existing IA (if applicable)',
        'Document findability requirements: what users need to find and how',
        'Segment findings by user type/persona if multiple audiences',
        'Map user tasks to content types and categories',
        'Create user task frequency and priority matrix',
        'Synthesize key IA insights and recommendations',
        'Create IA research synthesis report'
      ],
      outputFormat: 'JSON with mentalModels (array), topTasks (array), userTaskCount, vocabularyPreferences (object), topInsight, painPoints (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mentalModels', 'topTasks', 'userTaskCount', 'topInsight', 'artifacts'],
      properties: {
        mentalModels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              userSegment: { type: 'string' },
              implication: { type: 'string' }
            }
          }
        },
        topTasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              frequency: { type: 'string' },
              priority: { type: 'string' },
              contentNeeded: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        userTaskCount: { type: 'number' },
        vocabularyPreferences: {
          type: 'object',
          properties: {
            preferredTerms: { type: 'array', items: { type: 'string' } },
            avoidTerms: { type: 'array', items: { type: 'string' } },
            jargonLevel: { type: 'string' }
          }
        },
        topInsight: { type: 'string' },
        painPoints: { type: 'array', items: { type: 'string' } },
        findabilityRequirements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'information-architecture', 'research-synthesis']
}));

// Task 3: IA Strategy Definition
export const iaStrategyDefinitionTask = defineTask('ia-strategy-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Information Architecture strategy',
  agent: {
    name: 'ia-strategist',
    prompt: {
      role: 'senior information architect',
      task: 'Define comprehensive IA strategy including organization schemes, navigation model, search strategy, and structural approach based on research and business goals',
      context: args,
      instructions: [
        'Align IA strategy with business goals and user needs',
        'Define organization schemes to use:',
        '  - Exact schemes: alphabetical, chronological, geographical',
        '  - Ambiguous schemes: topical, task-oriented, audience-specific, metaphor-driven',
        'Select primary navigation model based on navigationStyle and platform:',
        '  - Hierarchical (tree structure): most common',
        '  - Hub and spoke (central hub with spokes)',
        '  - Nested doll (linear sequence with nested details)',
        '  - Hybrid (combination of models)',
        'Define navigation types needed: global, local, contextual, supplementary',
        'Plan search and filtering strategy',
        'Define metadata and tagging approach',
        'Plan for scalability and future growth',
        'Document IA principles and design rationale',
        'Create IA strategy document with clear recommendations'
      ],
      outputFormat: 'JSON with organizationSchemes (array), navigationModel, searchStrategy, metadataApproach, scalabilityPlan, iaPrinciples (array), documentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['organizationSchemes', 'navigationModel', 'iaPrinciples', 'documentPath', 'artifacts'],
      properties: {
        organizationSchemes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              applicableTo: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        navigationModel: { type: 'string' },
        navigationTypes: { type: 'array', items: { type: 'string' } },
        searchStrategy: { type: 'string' },
        metadataApproach: { type: 'string' },
        scalabilityPlan: { type: 'string' },
        iaPrinciples: { type: 'array', items: { type: 'string' } },
        documentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'information-architecture', 'strategy']
}));

// Task 4: Sitemap Design
export const sitemapDesignTask = defineTask('sitemap-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design comprehensive sitemap',
  agent: {
    name: 'sitemap-designer',
    prompt: {
      role: 'information architect and sitemap specialist',
      task: 'Create hierarchical sitemap showing all pages/screens, their relationships, and organizational structure based on IA strategy and content inventory',
      context: args,
      instructions: [
        'Design sitemap structure following IA strategy',
        'Create top-level categories (typically 5-7 for optimal cognitive load)',
        'Organize all content items from inventory into hierarchy',
        'Ensure each page is findable within 3-4 clicks (for web)',
        'Group related content logically',
        'Balance breadth vs depth appropriately for platform',
        'Include all key page types: landing pages, category pages, detail pages, utility pages',
        'Annotate with page types, templates, and content requirements',
        'Create visual sitemap diagram (use format appropriate for platform)',
        'Generate sitemap in multiple formats: visual diagram, XML, spreadsheet',
        'Document sitemap design decisions and rationale',
        'Include page count per section'
      ],
      outputFormat: 'JSON with diagramPath, totalPages, topLevelCategories, maxDepth, pagesByCategory (object), xmlSitemapPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['diagramPath', 'totalPages', 'topLevelCategories', 'maxDepth', 'artifacts'],
      properties: {
        diagramPath: { type: 'string' },
        totalPages: { type: 'number' },
        topLevelCategories: { type: 'number' },
        maxDepth: { type: 'number' },
        pagesByCategory: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        orphanPages: { type: 'array', items: { type: 'string' } },
        xmlSitemapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'information-architecture', 'sitemap']
}));

// Task 5: Navigation Structure Design
export const navigationStructureDesignTask = defineTask('navigation-structure-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design navigation structure and patterns',
  agent: {
    name: 'navigation-designer',
    prompt: {
      role: 'UX designer specializing in navigation systems',
      task: 'Design complete navigation structure including global navigation, local navigation, breadcrumbs, utility navigation, and contextual navigation',
      context: args,
      instructions: [
        'Design global navigation (primary nav): top-level categories, typically 5-9 items',
        'Design local navigation: within-section navigation for deeper levels',
        'Plan breadcrumb navigation for hierarchical wayfinding',
        'Design utility navigation: account, cart, search, help, etc.',
        'Plan contextual navigation: related content, "you might also like", cross-selling',
        'Define navigation patterns for different page types',
        'Specify navigation behavior: mega menus, dropdowns, accordions, etc.',
        'Design mobile navigation approach (hamburger, bottom nav, etc.)',
        'Plan for navigation scalability as content grows',
        'Create navigation hierarchy diagram',
        'Document navigation specifications for each type',
        'Include hover states, active states, interaction patterns'
      ],
      outputFormat: 'JSON with specificationPath, navigationLevels, primaryNavItems, navigationTypes (array), mobilePattern, interactionPatterns (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['specificationPath', 'navigationLevels', 'primaryNavItems', 'navigationTypes', 'artifacts'],
      properties: {
        specificationPath: { type: 'string' },
        navigationLevels: { type: 'number' },
        primaryNavItems: { type: 'number' },
        navigationTypes: { type: 'array', items: { type: 'string' } },
        mobilePattern: { type: 'string' },
        interactionPatterns: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        accessibilityConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'information-architecture', 'navigation']
}));

// Task 6: Labeling Scheme Design
export const labelingSchemeDesignTask = defineTask('labeling-scheme-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design labeling scheme and taxonomy',
  agent: {
    name: 'labeling-specialist',
    prompt: {
      role: 'content strategist and taxonomy expert',
      task: 'Create comprehensive labeling scheme with clear, consistent, user-friendly labels for all navigation items, categories, and content types based on user vocabulary research',
      context: args,
      instructions: [
        'Review user vocabulary preferences from research synthesis',
        'Create labels for all navigation items (primary, secondary, utility)',
        'Create labels for all sitemap categories and subcategories',
        'Ensure labels are:',
        '  - Clear and descriptive (users understand what to expect)',
        '  - Consistent in terminology and style',
        '  - Concise (typically 1-3 words for navigation)',
        '  - Distinct from each other (no overlap or confusion)',
        '  - Using user language (not internal jargon)',
        'Create controlled vocabulary/taxonomy for content tagging',
        'Define labeling conventions: capitalization, punctuation, formatting',
        'Create synonym list for search optimization',
        'Document labeling rationale and guidelines',
        'Create labeling style guide for future content',
        'Include preferred terms vs terms to avoid'
      ],
      outputFormat: 'JSON with documentPath, totalLabels, approach, labelingConventions (object), taxonomy (array), synonyms (object), taxonomyPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'totalLabels', 'approach', 'taxonomyPath', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        totalLabels: { type: 'number' },
        approach: { type: 'string' },
        labelingConventions: {
          type: 'object',
          properties: {
            capitalization: { type: 'string' },
            maxLength: { type: 'number' },
            punctuation: { type: 'string' }
          }
        },
        taxonomy: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              terms: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        synonyms: {
          type: 'object',
          additionalProperties: { type: 'array', items: { type: 'string' } }
        },
        taxonomyPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'information-architecture', 'labeling', 'taxonomy']
}));

// Task 7: Card Sorting Validation
export const cardSortingValidationTask = defineTask('card-sorting-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct card sorting to validate IA groupings',
  agent: {
    name: 'card-sorting-facilitator',
    prompt: {
      role: 'UX researcher specializing in card sorting methodology',
      task: 'Plan and conduct card sorting study (open, closed, or hybrid) to validate content categorization and labeling with users, analyze results to refine IA',
      context: args,
      instructions: [
        'Select card sorting type:',
        '  - Open card sort: users create their own categories (for greenfield IA)',
        '  - Closed card sort: users sort into predefined categories (to validate proposed IA)',
        '  - Hybrid: combination approach',
        'Select representative content items (cards) from content inventory, typically 30-60 cards',
        'Recruit 15-30 participants representative of target audience',
        'Create card sorting study plan and instructions',
        'Set up study in tool like Optimal Workshop, UsabilityHub, or Miro',
        'Conduct card sorting sessions (remote or in-person)',
        'Analyze results:',
        '  - Similarity matrices: which cards were grouped together',
        '  - Dendrograms: hierarchical clustering visualization',
        '  - Category agreements: how consistently users grouped cards',
        '  - Popular category names (for open sorts)',
        'Identify patterns and mismatches with proposed IA',
        'Generate recommendations for IA refinement',
        'Document card sorting methodology and findings'
      ],
      outputFormat: 'JSON with participantCount, sortType, cardCount, agreementScore (0-100), dendrogramPath, categoryAgreements (object), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['participantCount', 'sortType', 'cardCount', 'agreementScore', 'recommendations', 'artifacts'],
      properties: {
        participantCount: { type: 'number' },
        sortType: { type: 'string', enum: ['open', 'closed', 'hybrid'] },
        cardCount: { type: 'number' },
        agreementScore: { type: 'number', minimum: 0, maximum: 100 },
        dendrogramPath: { type: 'string' },
        categoryAgreements: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        popularCategoryNames: { type: 'array', items: { type: 'string' } },
        mismatches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              card: { type: 'string' },
              proposedCategory: { type: 'string' },
              userPreferredCategory: { type: 'string' }
            }
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
  labels: ['agent', 'information-architecture', 'card-sorting', 'validation']
}));

// Task 8: Tree Testing Validation
export const treeTestingValidationTask = defineTask('tree-testing-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct tree testing to validate navigation findability',
  agent: {
    name: 'tree-testing-facilitator',
    prompt: {
      role: 'UX researcher specializing in tree testing methodology',
      task: 'Plan and conduct tree testing study to validate IA navigation structure and findability without visual design influence, identify navigation problem areas',
      context: args,
      instructions: [
        'Create text-based tree structure from sitemap (no visual design)',
        'Define 8-12 realistic tasks based on top user tasks',
        'For each task, define success criteria (correct destination page)',
        'Recruit 20-50 participants representative of target audience',
        'Set up tree test in tool like Optimal Workshop Treejack or UsabilityHub',
        'Conduct tree testing sessions (typically remote, unmoderated)',
        'Analyze results per task:',
        '  - Success rate: % of users who found correct page',
        '  - Directness: % who took direct path without backtracking',
        '  - Time taken: average time to complete task',
        '  - First click: where users clicked first',
        'Identify problem areas:',
        '  - Tasks with low success rates (<70%)',
        '  - Navigation paths causing confusion',
        '  - Misleading labels or categories',
        'Generate specific IA improvement recommendations',
        'Document tree testing methodology and findings'
      ],
      outputFormat: 'JSON with participantCount, taskCount, averageSuccessRate, averageDirectness, taskResults (array), problemAreas (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['participantCount', 'taskCount', 'averageSuccessRate', 'problemAreas', 'recommendations', 'artifacts'],
      properties: {
        participantCount: { type: 'number' },
        taskCount: { type: 'number' },
        averageSuccessRate: { type: 'number', minimum: 0, maximum: 100 },
        averageDirectness: { type: 'number', minimum: 0, maximum: 100 },
        averageTime: { type: 'number' },
        taskResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              successRate: { type: 'number' },
              directness: { type: 'number' },
              averageTime: { type: 'number' },
              firstClicks: { type: 'object' }
            }
          }
        },
        problemAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
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
  labels: ['agent', 'information-architecture', 'tree-testing', 'validation']
}));

// Task 9: IA Refinement
export const iaRefinementTask = defineTask('ia-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refine IA based on validation results',
  agent: {
    name: 'ia-refinement-specialist',
    prompt: {
      role: 'senior information architect',
      task: 'Analyze validation results from card sorting and tree testing, identify issues, and refine sitemap, navigation, and labeling scheme to address findings',
      context: args,
      instructions: [
        'Review all validation findings:',
        '  - Card sorting agreements and mismatches',
        '  - Tree testing success rates and problem areas',
        '  - User feedback and observations',
        'Prioritize issues by severity:',
        '  - Critical: <60% success rate, major category mismatches',
        '  - Moderate: 60-80% success rate, minor confusion',
        '  - Low: >80% success rate, minor tweaks',
        'Propose specific changes:',
        '  - Restructure categories based on card sorting patterns',
        '  - Rename labels that caused confusion in tree testing',
        '  - Move content items to better-fitting categories',
        '  - Adjust navigation hierarchy depth',
        '  - Improve label clarity and differentiation',
        'Update sitemap with changes',
        'Update navigation structure with changes',
        'Update labeling scheme with refined labels',
        'Document all changes made and rationale',
        'Calculate validation success rate improvement estimate',
        'Create change log and refinement report'
      ],
      outputFormat: 'JSON with changesCount, criticalIssues, moderateIssues, minorIssues, improvementAreas (array), validationSuccessRate, changeLog (array), refinedSitemapPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['changesCount', 'criticalIssues', 'improvementAreas', 'validationSuccessRate', 'artifacts'],
      properties: {
        changesCount: { type: 'number' },
        criticalIssues: { type: 'number' },
        moderateIssues: { type: 'number' },
        minorIssues: { type: 'number' },
        improvementAreas: { type: 'array', items: { type: 'string' } },
        validationSuccessRate: { type: 'number', minimum: 0, maximum: 100 },
        changeLog: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              before: { type: 'string' },
              after: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        refinedSitemapPath: { type: 'string' },
        refinedNavigationPath: { type: 'string' },
        refinedLabelsPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'information-architecture', 'refinement']
}));

// Task 10: IA Documentation
export const iaDocumentationTask = defineTask('ia-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create comprehensive IA documentation',
  agent: {
    name: 'ia-documentation-specialist',
    prompt: {
      role: 'technical writer and information architect',
      task: 'Create comprehensive, actionable IA documentation including executive summary, strategy, sitemap, navigation specs, labeling guidelines, validation results, and implementation guide',
      context: args,
      instructions: [
        'Create master IA documentation with sections:',
        '1. Executive Summary:',
        '   - Project overview and objectives',
        '   - Key decisions and rationale',
        '   - High-level IA approach',
        '2. Research & Insights:',
        '   - User research summary',
        '   - Content inventory summary',
        '   - Key findings that influenced IA',
        '3. IA Strategy:',
        '   - Organization schemes',
        '   - Navigation model',
        '   - IA principles and guidelines',
        '4. Sitemap:',
        '   - Visual sitemap with annotations',
        '   - Page types and templates',
        '   - Content requirements per page',
        '5. Navigation Specifications:',
        '   - Global, local, utility, contextual navigation',
        '   - Interaction patterns and behaviors',
        '   - Mobile navigation approach',
        '6. Labeling & Taxonomy:',
        '   - Labeling conventions and style guide',
        '   - Complete taxonomy',
        '   - Synonym list for search',
        '7. Validation Results:',
        '   - Card sorting findings',
        '   - Tree testing results',
        '   - Refinements made',
        '8. Implementation Guide:',
        '   - Technical specifications',
        '   - Content migration plan',
        '   - Quality assurance checklist',
        'Include all diagrams, tables, and supporting materials',
        'Create table of contents with hyperlinks',
        'Format as professional Markdown document',
        'Ensure documentation is actionable for design and development teams'
      ],
      outputFormat: 'JSON with masterDocumentPath, executiveSummary, sectionsCompleted (array), pageCount, diagramsIncluded, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['masterDocumentPath', 'executiveSummary', 'sectionsCompleted', 'artifacts'],
      properties: {
        masterDocumentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        sectionsCompleted: { type: 'array', items: { type: 'string' } },
        pageCount: { type: 'number' },
        diagramsIncluded: { type: 'number' },
        keyTakeaways: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'information-architecture', 'documentation']
}));

// Task 11: Wireframe Prototype (Optional)
export const wireframePrototypeTask = defineTask('wireframe-prototype', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create wireframe prototype demonstrating IA',
  agent: {
    name: 'ia-prototype-designer',
    prompt: {
      role: 'UX designer specializing in wireframing and prototyping',
      task: 'Create low to medium-fidelity wireframe prototype that demonstrates the IA structure, navigation patterns, and key user flows for validation and stakeholder communication',
      context: args,
      instructions: [
        'Create wireframes for key page types from sitemap:',
        '  - Homepage with global navigation',
        '  - Top-level category pages',
        '  - Sub-category pages with local navigation',
        '  - Detail/content pages',
        '  - Search results page',
        '  - Utility pages (e.g., account, cart)',
        'Implement navigation structure from specs:',
        '  - Global navigation with proper hierarchy',
        '  - Breadcrumbs for wayfinding',
        '  - Local navigation where appropriate',
        '  - Footer navigation',
        'Use actual labels from labeling scheme',
        'Show content hierarchy and relationships clearly',
        'Create clickable prototype demonstrating key user flows',
        'Keep fidelity low to medium (focus on structure, not visual design)',
        'Annotate wireframes with IA notes',
        'Test prototype flow matches sitemap structure',
        'Export prototype for sharing and testing'
      ],
      outputFormat: 'JSON with prototypePath, screenCount, flowsDocumented (array), interactiveLink, annotationDocument, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prototypePath', 'screenCount', 'flowsDocumented', 'artifacts'],
      properties: {
        prototypePath: { type: 'string' },
        screenCount: { type: 'number' },
        flowsDocumented: { type: 'array', items: { type: 'string' } },
        interactiveLink: { type: 'string' },
        annotationDocument: { type: 'string' },
        pageTypesCovered: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'information-architecture', 'wireframe', 'prototype']
}));

// Task 12: IA Quality Assessment
export const iaQualityAssessmentTask = defineTask('ia-quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess IA quality and completeness',
  agent: {
    name: 'ia-quality-assessor',
    prompt: {
      role: 'principal information architect and IA audit specialist',
      task: 'Conduct comprehensive quality assessment of IA deliverables against best practices, validate completeness, consistency, usability, and alignment with user needs',
      context: args,
      instructions: [
        'Assess IA Strategy quality (weight: 15%):',
        '  - Clear alignment with business goals and user needs?',
        '  - Appropriate organization schemes selected?',
        '  - Scalability considerations addressed?',
        'Assess Sitemap quality (weight: 25%):',
        '  - Logical hierarchy and groupings?',
        '  - Appropriate depth (not too shallow or too deep)?',
        '  - All content accounted for?',
        '  - No orphan pages?',
        'Assess Navigation quality (weight: 20%):',
        '  - Clear navigation types defined?',
        '  - Appropriate primary nav item count (5-9)?',
        '  - Mobile navigation strategy sound?',
        '  - Accessibility considered?',
        'Assess Labeling quality (weight: 15%):',
        '  - Labels clear, consistent, and user-friendly?',
        '  - Using user vocabulary (not jargon)?',
        '  - Taxonomy comprehensive?',
        'Assess Validation quality (weight: 15%):',
        '  - Appropriate validation methods used?',
        '  - Sufficient participant count?',
        '  - Issues identified and addressed?',
        'Assess Documentation quality (weight: 10%):',
        '  - Comprehensive and actionable?',
        '  - Well-organized and clear?',
        '  - Implementation guidance included?',
        'Calculate weighted overall score (0-100)',
        'Identify strengths and weaknesses',
        'Provide specific improvement recommendations',
        'Validate adherence to IA best practices'
      ],
      outputFormat: 'JSON with overallScore (0-100), componentScores (object), validationScore, strengths (array), weaknesses (array), recommendations (array), bestPracticesScore, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            iaStrategy: { type: 'number' },
            sitemap: { type: 'number' },
            navigation: { type: 'number' },
            labeling: { type: 'number' },
            validation: { type: 'number' },
            documentation: { type: 'number' }
          }
        },
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        bestPracticesScore: { type: 'number', minimum: 0, maximum: 100 },
        findabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        usabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'information-architecture', 'quality-assessment']
}));
