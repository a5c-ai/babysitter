/**
 * @process domains/business/knowledge-management/knowledge-base-content
 * @description Create, curate, and maintain knowledge base content including articles, procedures, FAQs, and reference materials
 * @specialization Knowledge Management
 * @category Knowledge Base Development
 * @inputs { knowledgeBaseName: string, contentScope: object, targetAudience: array, contentTypes: array, existingContent: array, qualityStandards: object, outputDir: string }
 * @outputs { success: boolean, contentInventory: array, contentPlan: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    knowledgeBaseName = '',
    contentScope = {},
    targetAudience = ['general'],
    contentTypes = ['article', 'procedure', 'faq', 'reference'],
    existingContent = [],
    qualityStandards = {},
    subjectMatterExperts = [],
    contentOwnership = {},
    reviewWorkflow = { required: true, levels: ['technical', 'editorial'] },
    localizationRequirements = { required: false, languages: [] },
    accessibilityRequirements = { wcagLevel: 'AA' },
    outputDir = 'knowledge-base-content-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Knowledge Base Content Development Process');

  // ============================================================================
  // PHASE 1: CONTENT AUDIT AND GAP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Auditing existing content and identifying gaps');
  const contentAudit = await ctx.task(contentAuditTask, {
    knowledgeBaseName,
    contentScope,
    existingContent,
    targetAudience,
    contentTypes,
    outputDir
  });

  artifacts.push(...contentAudit.artifacts);

  // Breakpoint: Review content audit
  await ctx.breakpoint({
    question: `Content audit complete. Found ${contentAudit.existingContentCount} existing items and ${contentAudit.gapsIdentified.length} content gaps. Review audit?`,
    title: 'Content Audit Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        existingContent: contentAudit.existingContentCount,
        gapsIdentified: contentAudit.gapsIdentified.length,
        outdatedContent: contentAudit.outdatedContent.length,
        duplicateContent: contentAudit.duplicateContent.length
      }
    }
  });

  // ============================================================================
  // PHASE 2: CONTENT STRATEGY AND PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing content strategy and planning');
  const contentStrategy = await ctx.task(contentStrategyTask, {
    knowledgeBaseName,
    contentScope,
    contentAudit,
    targetAudience,
    contentTypes,
    qualityStandards,
    outputDir
  });

  artifacts.push(...contentStrategy.artifacts);

  // ============================================================================
  // PHASE 3: CONTENT ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing content architecture and structure');
  const contentArchitecture = await ctx.task(contentArchitectureTask, {
    knowledgeBaseName,
    contentStrategy,
    contentScope,
    targetAudience,
    outputDir
  });

  artifacts.push(...contentArchitecture.artifacts);

  // ============================================================================
  // PHASE 4: CONTENT TEMPLATES AND STANDARDS
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating content templates and style standards');
  const templatesAndStandards = await ctx.task(templatesAndStandardsTask, {
    knowledgeBaseName,
    contentTypes,
    qualityStandards,
    accessibilityRequirements,
    targetAudience,
    outputDir
  });

  artifacts.push(...templatesAndStandards.artifacts);

  // ============================================================================
  // PHASE 5: CONTENT DEVELOPMENT ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating content development roadmap');
  const contentRoadmap = await ctx.task(contentRoadmapTask, {
    knowledgeBaseName,
    contentStrategy,
    contentArchitecture,
    gapsIdentified: contentAudit.gapsIdentified,
    subjectMatterExperts,
    contentOwnership,
    outputDir
  });

  artifacts.push(...contentRoadmap.artifacts);

  // Breakpoint: Review content roadmap
  await ctx.breakpoint({
    question: `Content roadmap created with ${contentRoadmap.contentItems.length} items planned across ${contentRoadmap.phases.length} phases. Review roadmap?`,
    title: 'Content Roadmap Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        totalItems: contentRoadmap.contentItems.length,
        phases: contentRoadmap.phases.length,
        priorityItems: contentRoadmap.priorityItems.length,
        estimatedEffort: contentRoadmap.estimatedEffort
      }
    }
  });

  // ============================================================================
  // PHASE 6: CONTENT CREATION GUIDELINES
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing content creation guidelines');
  const creationGuidelines = await ctx.task(creationGuidelinesTask, {
    knowledgeBaseName,
    contentTypes,
    templatesAndStandards,
    qualityStandards,
    accessibilityRequirements,
    outputDir
  });

  artifacts.push(...creationGuidelines.artifacts);

  // ============================================================================
  // PHASE 7: SAMPLE CONTENT DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing sample content for each type');
  const sampleContent = await ctx.task(sampleContentTask, {
    knowledgeBaseName,
    contentTypes,
    templatesAndStandards,
    creationGuidelines,
    contentScope,
    targetAudience,
    outputDir
  });

  artifacts.push(...sampleContent.artifacts);

  // ============================================================================
  // PHASE 8: REVIEW WORKFLOW DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 8: Designing content review workflow');
  const reviewWorkflowDesign = await ctx.task(reviewWorkflowTask, {
    knowledgeBaseName,
    reviewWorkflow,
    contentTypes,
    subjectMatterExperts,
    contentOwnership,
    outputDir
  });

  artifacts.push(...reviewWorkflowDesign.artifacts);

  // ============================================================================
  // PHASE 9: CONTENT MAINTENANCE PLAN
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating content maintenance and update plan');
  const maintenancePlan = await ctx.task(maintenancePlanTask, {
    knowledgeBaseName,
    contentArchitecture,
    contentOwnership,
    qualityStandards,
    outputDir
  });

  artifacts.push(...maintenancePlan.artifacts);

  // ============================================================================
  // PHASE 10: CONTENT METRICS AND ANALYTICS
  // ============================================================================

  ctx.log('info', 'Phase 10: Designing content metrics and analytics');
  const contentMetrics = await ctx.task(contentMetricsTask, {
    knowledgeBaseName,
    contentStrategy,
    qualityStandards,
    outputDir
  });

  artifacts.push(...contentMetrics.artifacts);

  // ============================================================================
  // PHASE 11: LOCALIZATION PLANNING (IF REQUIRED)
  // ============================================================================

  let localizationPlan = null;
  if (localizationRequirements.required && localizationRequirements.languages.length > 0) {
    ctx.log('info', 'Phase 11: Planning content localization');
    localizationPlan = await ctx.task(localizationPlanningTask, {
      knowledgeBaseName,
      contentArchitecture,
      localizationRequirements,
      contentTypes,
      outputDir
    });

    artifacts.push(...localizationPlan.artifacts);
  }

  // ============================================================================
  // PHASE 12: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 12: Assessing overall content plan quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    knowledgeBaseName,
    contentStrategy,
    contentArchitecture,
    templatesAndStandards,
    contentRoadmap,
    reviewWorkflowDesign,
    maintenancePlan,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const qualityMet = qualityAssessment.overallScore >= 80;

  // Breakpoint: Review quality assessment
  await ctx.breakpoint({
    question: `Content plan quality score: ${qualityAssessment.overallScore}/100. ${qualityMet ? 'Quality standards met!' : 'May need improvements.'} Review results?`,
    title: 'Quality Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        qualityScore: qualityAssessment.overallScore,
        qualityMet,
        strategyScore: qualityAssessment.componentScores.strategy,
        architectureScore: qualityAssessment.componentScores.architecture,
        issues: qualityAssessment.issues.length
      }
    }
  });

  // ============================================================================
  // PHASE 13: IMPLEMENTATION PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Preparing for content implementation');
  const implementationPrep = await ctx.task(implementationPrepTask, {
    knowledgeBaseName,
    contentRoadmap,
    templatesAndStandards,
    reviewWorkflowDesign,
    subjectMatterExperts,
    contentOwnership,
    outputDir
  });

  artifacts.push(...implementationPrep.artifacts);

  // ============================================================================
  // PHASE 14: STAKEHOLDER REVIEW (IF REQUIRED)
  // ============================================================================

  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 14: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, {
      knowledgeBaseName,
      contentStrategy,
      contentRoadmap,
      qualityScore: qualityAssessment.overallScore,
      implementationPrep,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Final approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Proceed with content development?`,
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
          qualityScore: qualityAssessment.overallScore,
          stakeholdersReviewed: reviewResult.stakeholders.length,
          revisionsNeeded: reviewResult.revisionsNeeded
        }
      }
    });
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    knowledgeBaseName,
    contentInventory: contentAudit.contentInventory,
    contentPlan: {
      strategy: contentStrategy.strategyDocument,
      architecture: contentArchitecture.architectureDesign,
      roadmap: contentRoadmap.phases,
      priorityItems: contentRoadmap.priorityItems
    },
    qualityScore: qualityAssessment.overallScore,
    statistics: {
      existingContentCount: contentAudit.existingContentCount,
      gapsIdentified: contentAudit.gapsIdentified.length,
      plannedContentItems: contentRoadmap.contentItems.length,
      templatesCreated: templatesAndStandards.templates.length,
      sampleContentCreated: sampleContent.samples.length,
      reviewWorkflowStages: reviewWorkflowDesign.stages.length
    },
    templates: templatesAndStandards.templates,
    guidelines: {
      creationGuidelines: creationGuidelines.guidelines,
      styleGuide: templatesAndStandards.styleGuide
    },
    maintenance: {
      reviewCycle: maintenancePlan.reviewCycle,
      retirementPolicy: maintenancePlan.retirementPolicy,
      updateTriggers: maintenancePlan.updateTriggers
    },
    metrics: contentMetrics.metrics,
    localization: localizationPlan ? {
      required: true,
      languages: localizationRequirements.languages,
      approach: localizationPlan.approach
    } : { required: false },
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/business/knowledge-management/knowledge-base-content',
      timestamp: startTime,
      outputDir,
      targetAudience
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Content Audit
export const contentAuditTask = defineTask('content-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit existing content and identify gaps',
  agent: {
    name: 'content-auditor',
    prompt: {
      role: 'content strategist and knowledge management specialist',
      task: 'Conduct comprehensive audit of existing content and identify gaps',
      context: args,
      instructions: [
        'Inventory all existing content:',
        '  - Content type (article, procedure, FAQ, reference)',
        '  - Topic and subject area',
        '  - Target audience',
        '  - Current location and format',
        '  - Owner and last update date',
        '  - Quality assessment',
        'Assess content quality:',
        '  - Accuracy and correctness',
        '  - Currency and freshness',
        '  - Completeness',
        '  - Clarity and readability',
        '  - Accessibility compliance',
        'Identify content gaps:',
        '  - Missing topics within scope',
        '  - Underserved audience segments',
        '  - Missing content types',
        '  - Insufficient depth in areas',
        'Identify content issues:',
        '  - Outdated content needing updates',
        '  - Duplicate or redundant content',
        '  - Inconsistent content',
        '  - Broken or orphaned content',
        'Prioritize gaps by importance and urgency',
        'Save content audit report to output directory'
      ],
      outputFormat: 'JSON with contentInventory (array), existingContentCount (number), gapsIdentified (array), outdatedContent (array), duplicateContent (array), qualityAssessment (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['contentInventory', 'existingContentCount', 'gapsIdentified', 'artifacts'],
      properties: {
        contentInventory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              type: { type: 'string' },
              topic: { type: 'string' },
              audience: { type: 'array', items: { type: 'string' } },
              quality: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
              currency: { type: 'string', enum: ['current', 'outdated', 'stale'] },
              owner: { type: 'string' },
              lastUpdated: { type: 'string' }
            }
          }
        },
        existingContentCount: { type: 'number' },
        gapsIdentified: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              type: { type: 'string' },
              audience: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              description: { type: 'string' }
            }
          }
        },
        outdatedContent: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        duplicateContent: { type: 'array', items: { type: 'string' } },
        qualityAssessment: {
          type: 'object',
          properties: {
            averageQuality: { type: 'string' },
            qualityDistribution: { type: 'object' }
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
  labels: ['agent', 'knowledge-base', 'content-audit']
}));

// Task 2: Content Strategy
export const contentStrategyTask = defineTask('content-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop content strategy and planning',
  agent: {
    name: 'content-strategist',
    prompt: {
      role: 'senior content strategist',
      task: 'Develop comprehensive content strategy for knowledge base',
      context: args,
      instructions: [
        'Define content vision and objectives:',
        '  - Overall purpose of knowledge base',
        '  - Key success metrics',
        '  - Target audience needs',
        '  - Business alignment',
        'Develop content pillars and themes:',
        '  - Core topic areas',
        '  - Content categories',
        '  - Cross-cutting themes',
        'Define content mix:',
        '  - Balance of content types',
        '  - Depth vs breadth strategy',
        '  - Evergreen vs time-sensitive content',
        'Establish content principles:',
        '  - Voice and tone',
        '  - Quality standards',
        '  - Accessibility requirements',
        '  - User-centricity',
        'Plan content governance:',
        '  - Ownership model',
        '  - Review and approval process',
        '  - Update and maintenance cycle',
        'Define success criteria and KPIs',
        'Save content strategy to output directory'
      ],
      outputFormat: 'JSON with strategyDocument (string), contentPillars (array), contentMix (object), principles (array), governance (object), kpis (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategyDocument', 'contentPillars', 'artifacts'],
      properties: {
        strategyDocument: { type: 'string' },
        contentPillars: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              topics: { type: 'array', items: { type: 'string' } },
              audience: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        contentMix: {
          type: 'object',
          properties: {
            byType: { type: 'object' },
            byAudience: { type: 'object' },
            evergreenVsTimely: { type: 'object' }
          }
        },
        principles: { type: 'array', items: { type: 'string' } },
        governance: {
          type: 'object',
          properties: {
            ownershipModel: { type: 'string' },
            reviewProcess: { type: 'string' },
            maintenanceCycle: { type: 'string' }
          }
        },
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              target: { type: 'string' }
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
  labels: ['agent', 'knowledge-base', 'content-strategy']
}));

// Task 3: Content Architecture
export const contentArchitectureTask = defineTask('content-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design content architecture and structure',
  agent: {
    name: 'information-architect',
    prompt: {
      role: 'information architect specializing in content structure',
      task: 'Design content architecture and organizational structure',
      context: args,
      instructions: [
        'Design content hierarchy:',
        '  - Top-level categories',
        '  - Subcategories and sections',
        '  - Navigation structure',
        '  - Content relationships',
        'Define content organization model:',
        '  - Task-based vs topic-based',
        '  - Audience-based segmentation',
        '  - Product/feature alignment',
        'Design content modules:',
        '  - Reusable content components',
        '  - Content relationships',
        '  - Cross-references',
        'Plan content taxonomy:',
        '  - Categories and tags',
        '  - Metadata schema',
        '  - Controlled vocabularies',
        'Design navigation and findability:',
        '  - Menu structure',
        '  - Search optimization',
        '  - Related content suggestions',
        'Create content model documentation',
        'Save content architecture to output directory'
      ],
      outputFormat: 'JSON with architectureDesign (object), hierarchy (object), taxonomy (object), contentModel (object), navigationStructure (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['architectureDesign', 'hierarchy', 'taxonomy', 'artifacts'],
      properties: {
        architectureDesign: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            principles: { type: 'array', items: { type: 'string' } },
            depth: { type: 'number' }
          }
        },
        hierarchy: {
          type: 'object',
          properties: {
            categories: { type: 'array' },
            maxDepth: { type: 'number' }
          }
        },
        taxonomy: {
          type: 'object',
          properties: {
            categories: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } },
            metadataFields: { type: 'array' }
          }
        },
        contentModel: {
          type: 'object',
          properties: {
            contentTypes: { type: 'array' },
            relationships: { type: 'array' },
            reusableComponents: { type: 'array', items: { type: 'string' } }
          }
        },
        navigationStructure: {
          type: 'object',
          properties: {
            primaryNav: { type: 'array' },
            secondaryNav: { type: 'array' },
            footerNav: { type: 'array' }
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
  labels: ['agent', 'knowledge-base', 'content-architecture']
}));

// Task 4: Templates and Standards
export const templatesAndStandardsTask = defineTask('templates-standards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create content templates and style standards',
  agent: {
    name: 'content-designer',
    prompt: {
      role: 'content designer and standards specialist',
      task: 'Create content templates and establish style standards',
      context: args,
      instructions: [
        'Create templates for each content type:',
        '  - Article template (intro, body, conclusion)',
        '  - Procedure template (overview, steps, verification)',
        '  - FAQ template (question, answer, related)',
        '  - Reference template (description, specifications, examples)',
        '  - Troubleshooting template (symptom, cause, solution)',
        'Define template components:',
        '  - Required sections',
        '  - Optional sections',
        '  - Metadata fields',
        '  - Formatting guidelines',
        'Create style guide:',
        '  - Voice and tone guidelines',
        '  - Writing style (active voice, clarity)',
        '  - Terminology and glossary',
        '  - Formatting standards',
        '  - Visual standards',
        'Establish accessibility standards:',
        '  - WCAG compliance requirements',
        '  - Alternative text guidelines',
        '  - Readability standards',
        '  - Screen reader compatibility',
        'Create quality checklist for content review',
        'Save templates and standards to output directory'
      ],
      outputFormat: 'JSON with templates (array), styleGuide (object), accessibilityStandards (object), qualityChecklist (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['templates', 'styleGuide', 'artifacts'],
      properties: {
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              contentType: { type: 'string' },
              structure: { type: 'array', items: { type: 'string' } },
              requiredSections: { type: 'array', items: { type: 'string' } },
              optionalSections: { type: 'array', items: { type: 'string' } },
              metadataFields: { type: 'array', items: { type: 'string' } },
              path: { type: 'string' }
            }
          }
        },
        styleGuide: {
          type: 'object',
          properties: {
            voiceTone: { type: 'string' },
            writingPrinciples: { type: 'array', items: { type: 'string' } },
            terminology: { type: 'object' },
            formatting: { type: 'object' }
          }
        },
        accessibilityStandards: {
          type: 'object',
          properties: {
            wcagLevel: { type: 'string' },
            requirements: { type: 'array', items: { type: 'string' } },
            guidelines: { type: 'array', items: { type: 'string' } }
          }
        },
        qualityChecklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              items: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'knowledge-base', 'templates', 'standards']
}));

// Task 5: Content Roadmap
export const contentRoadmapTask = defineTask('content-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create content development roadmap',
  agent: {
    name: 'content-planner',
    prompt: {
      role: 'content planning specialist',
      task: 'Create detailed content development roadmap',
      context: args,
      instructions: [
        'Prioritize content items:',
        '  - Critical: business-critical, high-traffic',
        '  - High: important for user success',
        '  - Medium: valuable but not urgent',
        '  - Low: nice-to-have',
        'Create phased development plan:',
        '  - Phase 1: Foundation (critical content)',
        '  - Phase 2: Core (essential content)',
        '  - Phase 3: Expansion (additional content)',
        '  - Phase 4: Enhancement (depth and breadth)',
        'Define content items for each phase:',
        '  - Title and description',
        '  - Content type',
        '  - Assigned owner/author',
        '  - Subject matter expert',
        '  - Target completion date',
        '  - Dependencies',
        'Estimate effort for content development',
        'Identify resource requirements',
        'Create content calendar',
        'Plan quick wins and early value delivery',
        'Save content roadmap to output directory'
      ],
      outputFormat: 'JSON with phases (array), contentItems (array), priorityItems (array), estimatedEffort (string), calendar (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'contentItems', 'priorityItems', 'artifacts'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'number' },
              name: { type: 'string' },
              duration: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              contentCount: { type: 'number' }
            }
          }
        },
        contentItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              type: { type: 'string' },
              topic: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              phase: { type: 'number' },
              owner: { type: 'string' },
              sme: { type: 'string' },
              targetDate: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              effortEstimate: { type: 'string' }
            }
          }
        },
        priorityItems: { type: 'array', items: { type: 'string' } },
        estimatedEffort: { type: 'string' },
        calendar: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            milestones: { type: 'array' }
          }
        },
        resourceRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'content-roadmap']
}));

// Task 6: Creation Guidelines
export const creationGuidelinesTask = defineTask('creation-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop content creation guidelines',
  agent: {
    name: 'content-guidelines-author',
    prompt: {
      role: 'content guidelines specialist',
      task: 'Create comprehensive content creation guidelines for authors',
      context: args,
      instructions: [
        'Create author guidelines:',
        '  - Getting started with content creation',
        '  - Using templates effectively',
        '  - Writing best practices',
        '  - Working with SMEs',
        'Document content creation process:',
        '  - Research and planning',
        '  - Drafting and writing',
        '  - Review and revision',
        '  - Publication and promotion',
        'Create writing tips and techniques:',
        '  - User-centered writing',
        '  - Task-oriented content',
        '  - Scannable formatting',
        '  - Effective use of visuals',
        'Provide examples and anti-patterns:',
        '  - Good content examples',
        '  - Common mistakes to avoid',
        '  - Before/after comparisons',
        'Create quick reference materials',
        'Document tool usage and workflow',
        'Save creation guidelines to output directory'
      ],
      outputFormat: 'JSON with guidelines (array), process (object), writingTips (array), examples (array), quickReference (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelines', 'process', 'artifacts'],
      properties: {
        guidelines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              content: { type: 'string' },
              tips: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        process: {
          type: 'object',
          properties: {
            stages: { type: 'array' },
            checkpoints: { type: 'array', items: { type: 'string' } }
          }
        },
        writingTips: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              tips: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        examples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              type: { type: 'string', enum: ['good', 'bad', 'comparison'] },
              description: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        quickReference: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'content-guidelines']
}));

// Task 7: Sample Content
export const sampleContentTask = defineTask('sample-content', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop sample content for each type',
  agent: {
    name: 'content-creator',
    prompt: {
      role: 'senior technical writer',
      task: 'Create exemplary sample content for each content type',
      context: args,
      instructions: [
        'Create sample content for each content type:',
        '  - Sample article demonstrating best practices',
        '  - Sample procedure with clear steps',
        '  - Sample FAQ with comprehensive answers',
        '  - Sample reference with complete information',
        'Ensure samples demonstrate:',
        '  - Proper use of templates',
        '  - Style guide adherence',
        '  - Quality standards compliance',
        '  - Accessibility requirements',
        'Include metadata and tagging examples',
        'Show proper formatting and structure',
        'Demonstrate effective use of visuals',
        'Include related content linking',
        'Add annotations explaining good practices',
        'Create content that can be used as reference',
        'Save sample content to output directory'
      ],
      outputFormat: 'JSON with samples (array), annotations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['samples', 'artifacts'],
      properties: {
        samples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              contentType: { type: 'string' },
              description: { type: 'string' },
              content: { type: 'string' },
              metadata: { type: 'object' },
              path: { type: 'string' },
              demonstratedBestPractices: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        annotations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sample: { type: 'string' },
              element: { type: 'string' },
              annotation: { type: 'string' }
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
  labels: ['agent', 'knowledge-base', 'sample-content']
}));

// Task 8: Review Workflow
export const reviewWorkflowTask = defineTask('review-workflow', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design content review workflow',
  agent: {
    name: 'workflow-designer',
    prompt: {
      role: 'content operations specialist',
      task: 'Design content review and approval workflow',
      context: args,
      instructions: [
        'Design review workflow stages:',
        '  - Draft submission',
        '  - Technical review (accuracy, completeness)',
        '  - Editorial review (style, clarity)',
        '  - SME validation (if required)',
        '  - Final approval',
        '  - Publication',
        'Define reviewer roles and responsibilities:',
        '  - Technical reviewer criteria',
        '  - Editorial reviewer criteria',
        '  - Approver criteria',
        'Create review checklists for each stage',
        'Define turnaround time expectations',
        'Design feedback and revision process',
        'Handle expedited review process',
        'Plan review tracking and reporting',
        'Define escalation procedures',
        'Document workflow in detail',
        'Save review workflow to output directory'
      ],
      outputFormat: 'JSON with stages (array), roles (array), checklists (array), timelines (object), escalationProcess (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stages', 'roles', 'artifacts'],
      properties: {
        stages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              order: { type: 'number' },
              reviewer: { type: 'string' },
              criteria: { type: 'array', items: { type: 'string' } },
              turnaround: { type: 'string' },
              required: { type: 'boolean' }
            }
          }
        },
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              qualifications: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        checklists: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              items: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        timelines: {
          type: 'object',
          properties: {
            standardReview: { type: 'string' },
            expeditedReview: { type: 'string' },
            totalCycle: { type: 'string' }
          }
        },
        escalationProcess: {
          type: 'object',
          properties: {
            triggers: { type: 'array', items: { type: 'string' } },
            contacts: { type: 'array', items: { type: 'string' } },
            resolution: { type: 'string' }
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
  labels: ['agent', 'knowledge-base', 'review-workflow']
}));

// Task 9: Maintenance Plan
export const maintenancePlanTask = defineTask('maintenance-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create content maintenance and update plan',
  agent: {
    name: 'maintenance-planner',
    prompt: {
      role: 'content lifecycle management specialist',
      task: 'Create comprehensive content maintenance and update plan',
      context: args,
      instructions: [
        'Define content review cycle:',
        '  - Review frequency by content type',
        '  - Review triggers (time-based, event-based)',
        '  - Review scope and depth',
        'Plan content update process:',
        '  - Minor updates vs major revisions',
        '  - Update workflow',
        '  - Version control',
        '  - Change documentation',
        'Define content retirement policy:',
        '  - Retirement criteria',
        '  - Archival process',
        '  - Redirect handling',
        '  - Communication requirements',
        'Plan content health monitoring:',
        '  - Freshness indicators',
        '  - Quality metrics',
        '  - Usage analytics',
        '  - Feedback monitoring',
        'Create maintenance calendar',
        'Define content ownership transfers',
        'Save maintenance plan to output directory'
      ],
      outputFormat: 'JSON with reviewCycle (object), updateProcess (object), retirementPolicy (object), healthMonitoring (object), updateTriggers (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewCycle', 'updateProcess', 'retirementPolicy', 'artifacts'],
      properties: {
        reviewCycle: {
          type: 'object',
          properties: {
            byContentType: { type: 'object' },
            triggers: { type: 'array', items: { type: 'string' } },
            calendar: { type: 'array' }
          }
        },
        updateProcess: {
          type: 'object',
          properties: {
            minorUpdates: { type: 'string' },
            majorRevisions: { type: 'string' },
            versionControl: { type: 'string' }
          }
        },
        retirementPolicy: {
          type: 'object',
          properties: {
            criteria: { type: 'array', items: { type: 'string' } },
            process: { type: 'array', items: { type: 'string' } },
            archivalPeriod: { type: 'string' }
          }
        },
        healthMonitoring: {
          type: 'object',
          properties: {
            indicators: { type: 'array', items: { type: 'string' } },
            alertThresholds: { type: 'object' },
            reportingCadence: { type: 'string' }
          }
        },
        updateTriggers: { type: 'array', items: { type: 'string' } },
        ownershipTransfer: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'content-maintenance']
}));

// Task 10: Content Metrics
export const contentMetricsTask = defineTask('content-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design content metrics and analytics',
  agent: {
    name: 'metrics-designer',
    prompt: {
      role: 'content analytics specialist',
      task: 'Design content metrics and analytics framework',
      context: args,
      instructions: [
        'Define content performance metrics:',
        '  - Page views and unique visitors',
        '  - Time on page and engagement',
        '  - Search appearances and click-through',
        '  - Bounce rate and exit rate',
        'Define content quality metrics:',
        '  - User ratings and feedback',
        '  - Helpfulness scores',
        '  - Issue resolution rate',
        '  - Support ticket deflection',
        'Define content coverage metrics:',
        '  - Topic coverage completeness',
        '  - Audience coverage',
        '  - Content freshness index',
        '  - Gap closure rate',
        'Design reporting and dashboards:',
        '  - Executive summary dashboard',
        '  - Content performance reports',
        '  - Author productivity reports',
        '  - Quality trend reports',
        'Plan analytics implementation',
        'Define benchmarks and targets',
        'Save metrics framework to output directory'
      ],
      outputFormat: 'JSON with metrics (array), dashboards (array), benchmarks (object), implementationPlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'dashboards', 'artifacts'],
      properties: {
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string', enum: ['performance', 'quality', 'coverage', 'operational'] },
              description: { type: 'string' },
              calculation: { type: 'string' },
              target: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              audience: { type: 'string' },
              metrics: { type: 'array', items: { type: 'string' } },
              refreshFrequency: { type: 'string' }
            }
          }
        },
        benchmarks: {
          type: 'object',
          properties: {
            industry: { type: 'object' },
            internal: { type: 'object' }
          }
        },
        implementationPlan: {
          type: 'object',
          properties: {
            tools: { type: 'array', items: { type: 'string' } },
            timeline: { type: 'string' },
            dependencies: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'knowledge-base', 'content-metrics']
}));

// Task 11: Localization Planning
export const localizationPlanningTask = defineTask('localization-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan content localization',
  agent: {
    name: 'localization-planner',
    prompt: {
      role: 'localization specialist',
      task: 'Plan content localization strategy and process',
      context: args,
      instructions: [
        'Define localization strategy:',
        '  - Languages to support',
        '  - Content prioritization for localization',
        '  - Localization approach (full, partial, critical)',
        'Plan localization process:',
        '  - Source content preparation',
        '  - Translation workflow',
        '  - Review and validation',
        '  - Publication synchronization',
        'Address localization challenges:',
        '  - Cultural adaptation requirements',
        '  - Terminology management',
        '  - Image and media localization',
        '  - Layout and formatting',
        'Define localization quality standards',
        'Plan localization tools and vendors',
        'Estimate effort and timeline',
        'Save localization plan to output directory'
      ],
      outputFormat: 'JSON with approach (string), languages (array), process (object), qualityStandards (object), timeline (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'languages', 'process', 'artifacts'],
      properties: {
        approach: { type: 'string', enum: ['full', 'partial', 'critical-only'] },
        languages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              name: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              contentScope: { type: 'string' }
            }
          }
        },
        process: {
          type: 'object',
          properties: {
            stages: { type: 'array' },
            tools: { type: 'array', items: { type: 'string' } },
            vendors: { type: 'array', items: { type: 'string' } }
          }
        },
        qualityStandards: {
          type: 'object',
          properties: {
            reviewProcess: { type: 'string' },
            metrics: { type: 'array', items: { type: 'string' } }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            phases: { type: 'array' },
            estimatedDuration: { type: 'string' }
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
  labels: ['agent', 'knowledge-base', 'localization']
}));

// Task 12: Quality Assessment
export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess overall content plan quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'content quality assessor',
      task: 'Evaluate the quality and completeness of the content plan',
      context: args,
      instructions: [
        'Evaluate content strategy (25%):',
        '  - Clarity of vision and objectives',
        '  - Alignment with business needs',
        '  - Audience focus',
        '  - Measurability',
        'Evaluate content architecture (25%):',
        '  - Structure clarity',
        '  - Navigation design',
        '  - Taxonomy appropriateness',
        '  - Scalability',
        'Evaluate templates and standards (25%):',
        '  - Template completeness',
        '  - Style guide clarity',
        '  - Accessibility compliance',
        '  - Consistency',
        'Evaluate roadmap and process (25%):',
        '  - Roadmap feasibility',
        '  - Review workflow clarity',
        '  - Maintenance plan completeness',
        '  - Resource adequacy',
        'Calculate weighted overall score (0-100)',
        'Identify areas for improvement',
        'Provide specific recommendations',
        'Save quality assessment to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), issues (array), strengths (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            strategy: { type: 'number' },
            architecture: { type: 'number' },
            templatesStandards: { type: 'number' },
            roadmapProcess: { type: 'number' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              recommendation: { type: 'string' }
            }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'quality-assessment']
}));

// Task 13: Implementation Preparation
export const implementationPrepTask = defineTask('implementation-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare for content implementation',
  agent: {
    name: 'implementation-coordinator',
    prompt: {
      role: 'content implementation coordinator',
      task: 'Prepare for content development implementation',
      context: args,
      instructions: [
        'Finalize content assignments:',
        '  - Owner assignments for each item',
        '  - SME assignments',
        '  - Reviewer assignments',
        'Prepare author toolkit:',
        '  - Templates ready for use',
        '  - Guidelines distributed',
        '  - Tools configured',
        '  - Training scheduled',
        'Setup workflow and tracking:',
        '  - Content tracking system',
        '  - Review workflow configured',
        '  - Reporting dashboards',
        'Create kickoff materials:',
        '  - Kickoff presentation',
        '  - Quick start guides',
        '  - FAQ for authors',
        'Define first milestone targets',
        'Identify potential blockers',
        'Save implementation preparation to output directory'
      ],
      outputFormat: 'JSON with assignments (object), authorToolkit (array), workflowSetup (object), kickoffMaterials (array), firstMilestone (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assignments', 'authorToolkit', 'artifacts'],
      properties: {
        assignments: {
          type: 'object',
          properties: {
            contentOwners: { type: 'array' },
            smeAssignments: { type: 'array' },
            reviewerAssignments: { type: 'array' }
          }
        },
        authorToolkit: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              status: { type: 'string', enum: ['ready', 'in-progress', 'pending'] },
              location: { type: 'string' }
            }
          }
        },
        workflowSetup: {
          type: 'object',
          properties: {
            trackingSystem: { type: 'string' },
            reviewWorkflow: { type: 'string' },
            reportingDashboards: { type: 'array', items: { type: 'string' } }
          }
        },
        kickoffMaterials: { type: 'array', items: { type: 'string' } },
        firstMilestone: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            targets: { type: 'array', items: { type: 'string' } }
          }
        },
        potentialBlockers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'implementation']
}));

// Task 14: Stakeholder Review
export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'project manager facilitating stakeholder review',
      task: 'Coordinate stakeholder review and approval of content plan',
      context: args,
      instructions: [
        'Present content plan to stakeholders:',
        '  - Content strategy and objectives',
        '  - Content roadmap and priorities',
        '  - Templates and standards',
        '  - Review workflow',
        '  - Resource requirements',
        'Gather feedback from key stakeholders:',
        '  - Content owners and authors',
        '  - Subject matter experts',
        '  - IT and platform owners',
        '  - Management and leadership',
        'Validate plan meets business needs',
        'Review resource allocation',
        'Identify concerns and objections',
        'Determine if revisions are needed',
        'Document approval or required changes',
        'Create action plan for feedback',
        'Save stakeholder review to output directory'
      ],
      outputFormat: 'JSON with approved (boolean), stakeholders (array), feedback (array), revisionsNeeded (boolean), actionItems (array), artifacts'
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
              comment: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              category: { type: 'string' }
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
