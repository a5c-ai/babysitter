/**
 * @process specializations/technical-documentation/content-strategy
 * @description Content Strategy and Information Architecture Design process for planning and organizing technical documentation with user journey mapping, content modeling, taxonomy design, and governance framework
 * @specialization Technical Documentation
 * @category Knowledge Management
 * @inputs { projectName: string, productType: string, targetAudiences: array, existingContent: array, documentationGoals: array, contentTypes: array, platforms: array, outputDir: string }
 * @outputs { success: boolean, strategyDocument: object, informationArchitecture: object, contentModel: object, taxonomy: object, governanceFramework: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = '',
    productType = 'software', // software, api, sdk, platform, hardware, service
    targetAudiences = ['developers', 'end-users', 'administrators'], // key user personas
    existingContent = [], // paths to existing documentation
    documentationGoals = ['improve-onboarding', 'reduce-support-tickets', 'increase-adoption'],
    contentTypes = ['tutorials', 'how-to', 'reference', 'explanation'], // Diataxis framework
    platforms = ['web', 'mobile', 'pdf'],
    businessObjectives = [],
    technicalConstraints = [],
    timeframe = '3-6 months',
    outputDir = 'content-strategy-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Content Strategy and Information Architecture Design Process');
  ctx.log('info', `Project: ${projectName}`);
  ctx.log('info', `Target Audiences: ${targetAudiences.join(', ')}`);

  // ============================================================================
  // PHASE 1: DISCOVERY AND STAKEHOLDER ALIGNMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting discovery and stakeholder alignment');
  const discovery = await ctx.task(discoveryStakeholderTask, {
    projectName,
    productType,
    targetAudiences,
    existingContent,
    documentationGoals,
    businessObjectives,
    technicalConstraints,
    outputDir
  });

  artifacts.push(...discovery.artifacts);

  // Breakpoint: Review discovery findings
  await ctx.breakpoint({
    question: `Discovery complete with ${discovery.stakeholderCount} stakeholders interviewed and ${discovery.userNeedsCount} user needs identified. Review findings?`,
    title: 'Discovery and Stakeholder Alignment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        stakeholders: discovery.stakeholderCount,
        userNeeds: discovery.userNeedsCount,
        keyInsights: discovery.keyInsights?.length || 0,
        contentGaps: discovery.contentGaps?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 2: USER RESEARCH AND PERSONA DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Conducting user research and developing personas');
  const userResearch = await ctx.task(userResearchPersonasTask, {
    projectName,
    productType,
    targetAudiences,
    discovery: discovery.stakeholderInsights,
    documentationGoals,
    outputDir
  });

  artifacts.push(...userResearch.artifacts);

  // ============================================================================
  // PHASE 3: USER JOURNEY MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 3: Mapping user journeys and documentation touchpoints');
  const journeyMapping = await ctx.task(userJourneyMappingTask, {
    projectName,
    productType,
    personas: userResearch.personas,
    documentationGoals,
    contentTypes,
    outputDir
  });

  artifacts.push(...journeyMapping.artifacts);

  // ============================================================================
  // PHASE 4: CONTENT AUDIT AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Auditing and analyzing existing content');
  const contentAudit = await ctx.task(contentAuditAnalysisTask, {
    projectName,
    existingContent,
    personas: userResearch.personas,
    userJourneys: journeyMapping.journeys,
    documentationGoals,
    outputDir
  });

  artifacts.push(...contentAudit.artifacts);

  // ============================================================================
  // PHASE 5: GAP ANALYSIS AND CONTENT INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 5: Conducting gap analysis and content inventory');
  const gapAnalysis = await ctx.task(gapAnalysisInventoryTask, {
    projectName,
    contentAudit: contentAudit.auditResults,
    userJourneys: journeyMapping.journeys,
    personas: userResearch.personas,
    contentTypes,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // Breakpoint: Review gap analysis
  await ctx.breakpoint({
    question: `Gap analysis complete. Found ${gapAnalysis.criticalGapsCount} critical gaps and ${gapAnalysis.totalContentItems} content items inventoried. Review analysis?`,
    title: 'Content Gap Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        criticalGaps: gapAnalysis.criticalGapsCount,
        contentItems: gapAnalysis.totalContentItems,
        coverageScore: gapAnalysis.coverageScore,
        recommendedActions: gapAnalysis.recommendedActions?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 6: INFORMATION ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing information architecture');
  const informationArchitecture = await ctx.task(informationArchitectureDesignTask, {
    projectName,
    productType,
    personas: userResearch.personas,
    userJourneys: journeyMapping.journeys,
    contentInventory: gapAnalysis.contentInventory,
    contentTypes,
    outputDir
  });

  artifacts.push(...informationArchitecture.artifacts);

  // ============================================================================
  // PHASE 7: TAXONOMY AND METADATA DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing taxonomy and metadata framework');
  const taxonomyDesign = await ctx.task(taxonomyMetadataDesignTask, {
    projectName,
    informationArchitecture: informationArchitecture.structure,
    personas: userResearch.personas,
    contentTypes,
    platforms,
    outputDir
  });

  artifacts.push(...taxonomyDesign.artifacts);

  // ============================================================================
  // PHASE 8: CONTENT MODEL DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Developing structured content model');
  const contentModel = await ctx.task(contentModelDevelopmentTask, {
    projectName,
    informationArchitecture: informationArchitecture.structure,
    taxonomy: taxonomyDesign.taxonomy,
    contentTypes,
    platforms,
    outputDir
  });

  artifacts.push(...contentModel.artifacts);

  // Breakpoint: Review content model
  await ctx.breakpoint({
    question: `Content model developed with ${contentModel.contentTypeCount} content types and ${contentModel.componentCount} reusable components. Review model?`,
    title: 'Content Model Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        contentTypes: contentModel.contentTypeCount,
        components: contentModel.componentCount,
        templates: contentModel.templateCount,
        structured: contentModel.isStructured
      }
    }
  });

  // ============================================================================
  // PHASE 9: NAVIGATION AND FINDABILITY STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 9: Developing navigation and findability strategy');
  const navigationStrategy = await ctx.task(navigationFindabilityTask, {
    projectName,
    informationArchitecture: informationArchitecture.structure,
    userJourneys: journeyMapping.journeys,
    personas: userResearch.personas,
    platforms,
    outputDir
  });

  artifacts.push(...navigationStrategy.artifacts);

  // ============================================================================
  // PHASE 10: SEARCH STRATEGY AND DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 10: Designing search strategy and requirements');
  const searchStrategy = await ctx.task(searchStrategyTask, {
    projectName,
    informationArchitecture: informationArchitecture.structure,
    taxonomy: taxonomyDesign.taxonomy,
    personas: userResearch.personas,
    userJourneys: journeyMapping.journeys,
    platforms,
    outputDir
  });

  artifacts.push(...searchStrategy.artifacts);

  // ============================================================================
  // PHASE 11: CONTENT LIFECYCLE AND WORKFLOW DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 11: Designing content lifecycle and workflows');
  const lifecycleWorkflow = await ctx.task(contentLifecycleWorkflowTask, {
    projectName,
    contentModel: contentModel.model,
    contentTypes,
    platforms,
    outputDir
  });

  artifacts.push(...lifecycleWorkflow.artifacts);

  // ============================================================================
  // PHASE 12: GOVERNANCE FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 12: Creating governance framework and policies');
  const governanceFramework = await ctx.task(governanceFrameworkTask, {
    projectName,
    contentModel: contentModel.model,
    taxonomy: taxonomyDesign.taxonomy,
    lifecycleWorkflow: lifecycleWorkflow.workflow,
    platforms,
    outputDir
  });

  artifacts.push(...governanceFramework.artifacts);

  // ============================================================================
  // PHASE 13: STYLE GUIDE AND STANDARDS
  // ============================================================================

  ctx.log('info', 'Phase 13: Developing style guide and content standards');
  const styleGuideStandards = await ctx.task(styleGuideStandardsTask, {
    projectName,
    productType,
    targetAudiences,
    contentTypes,
    contentModel: contentModel.model,
    outputDir
  });

  artifacts.push(...styleGuideStandards.artifacts);

  // ============================================================================
  // PHASE 14: CONTENT PRODUCTION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 14: Creating content production strategy and roadmap');
  const productionStrategy = await ctx.task(contentProductionStrategyTask, {
    projectName,
    gapAnalysis: gapAnalysis.gaps,
    contentInventory: gapAnalysis.contentInventory,
    contentModel: contentModel.model,
    userJourneys: journeyMapping.journeys,
    timeframe,
    outputDir
  });

  artifacts.push(...productionStrategy.artifacts);

  // Breakpoint: Review production strategy
  await ctx.breakpoint({
    question: `Content production strategy created with ${productionStrategy.phaseCount} phases and ${productionStrategy.totalContentItems} items to produce. Review strategy?`,
    title: 'Content Production Strategy Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        phases: productionStrategy.phaseCount,
        contentItems: productionStrategy.totalContentItems,
        estimatedDuration: productionStrategy.estimatedDuration,
        resourcesNeeded: productionStrategy.resourcesNeeded?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 15: MEASUREMENT AND SUCCESS METRICS
  // ============================================================================

  ctx.log('info', 'Phase 15: Defining measurement framework and success metrics');
  const measurementFramework = await ctx.task(measurementMetricsTask, {
    projectName,
    documentationGoals,
    businessObjectives,
    userJourneys: journeyMapping.journeys,
    outputDir
  });

  artifacts.push(...measurementFramework.artifacts);

  // ============================================================================
  // PHASE 16: RISK ASSESSMENT AND MITIGATION
  // ============================================================================

  ctx.log('info', 'Phase 16: Conducting risk assessment and mitigation planning');
  const riskAssessment = await ctx.task(riskAssessmentMitigationTask, {
    projectName,
    productionStrategy: productionStrategy.roadmap,
    technicalConstraints,
    timeframe,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // ============================================================================
  // PHASE 17: IMPLEMENTATION ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 17: Creating comprehensive implementation roadmap');
  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    projectName,
    informationArchitecture: informationArchitecture.structure,
    contentModel: contentModel.model,
    productionStrategy: productionStrategy.roadmap,
    governanceFramework: governanceFramework.framework,
    riskAssessment: riskAssessment.risks,
    timeframe,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);

  // ============================================================================
  // PHASE 18: STAKEHOLDER REVIEW AND APPROVAL (IF REQUIRED)
  // ============================================================================

  let stakeholderApproval = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 18: Conducting stakeholder review and approval');
    stakeholderApproval = await ctx.task(stakeholderApprovalTask, {
      projectName,
      informationArchitecture: informationArchitecture.structure,
      contentModel: contentModel.model,
      productionStrategy: productionStrategy.roadmap,
      implementationRoadmap: implementationRoadmap.roadmap,
      outputDir
    });

    artifacts.push(...stakeholderApproval.artifacts);

    // Breakpoint: Final approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${stakeholderApproval.approved ? 'Strategy approved!' : 'Revisions needed.'} Proceed with finalization?`,
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
          approved: stakeholderApproval.approved,
          stakeholders: stakeholderApproval.stakeholdersCount,
          feedbackItems: stakeholderApproval.feedbackCount,
          revisionsNeeded: stakeholderApproval.revisionsNeeded
        }
      }
    });
  }

  // ============================================================================
  // PHASE 19: FINAL STRATEGY DOCUMENT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 19: Generating final strategy document');
  const strategyDocument = await ctx.task(strategyDocumentGenerationTask, {
    projectName,
    discovery,
    userResearch,
    journeyMapping,
    contentAudit,
    gapAnalysis,
    informationArchitecture,
    taxonomyDesign,
    contentModel,
    navigationStrategy,
    searchStrategy,
    lifecycleWorkflow,
    governanceFramework,
    styleGuideStandards,
    productionStrategy,
    measurementFramework,
    riskAssessment,
    implementationRoadmap,
    stakeholderApproval,
    outputDir
  });

  artifacts.push(...strategyDocument.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    approved: stakeholderApproval ? stakeholderApproval.approved : true,
    strategyDocument: {
      executiveSummary: strategyDocument.executiveSummary,
      documentPath: strategyDocument.documentPath,
      presentationPath: strategyDocument.presentationPath,
      version: strategyDocument.version
    },
    userResearch: {
      personasCount: userResearch.personasCount,
      journeysCount: journeyMapping.journeysCount,
      touchpointsCount: journeyMapping.touchpointsCount
    },
    contentAnalysis: {
      existingContentCount: contentAudit.existingContentCount,
      contentGapsCount: gapAnalysis.criticalGapsCount,
      coverageScore: gapAnalysis.coverageScore,
      contentItemsToCreate: productionStrategy.totalContentItems
    },
    informationArchitecture: {
      structure: informationArchitecture.structure,
      categoryCount: informationArchitecture.categoryCount,
      subcategoryCount: informationArchitecture.subcategoryCount,
      depth: informationArchitecture.maxDepth,
      navigationPaths: navigationStrategy.pathCount
    },
    contentModel: {
      contentTypes: contentModel.contentTypeCount,
      components: contentModel.componentCount,
      templates: contentModel.templateCount,
      structured: contentModel.isStructured,
      reusable: contentModel.isReusable
    },
    taxonomy: {
      categories: taxonomyDesign.taxonomy.categories?.length || 0,
      tags: taxonomyDesign.taxonomy.tags?.length || 0,
      metadataFields: taxonomyDesign.taxonomy.metadataFields?.length || 0,
      facets: taxonomyDesign.facetsCount
    },
    governanceFramework: {
      roles: governanceFramework.framework.roles?.length || 0,
      policies: governanceFramework.framework.policies?.length || 0,
      workflows: governanceFramework.framework.workflows?.length || 0,
      qualityStandards: governanceFramework.framework.qualityStandards
    },
    productionStrategy: {
      phases: productionStrategy.phaseCount,
      contentItemsToCreate: productionStrategy.totalContentItems,
      estimatedDuration: productionStrategy.estimatedDuration,
      resourcesRequired: productionStrategy.resourcesNeeded
    },
    implementationRoadmap: {
      milestones: implementationRoadmap.roadmap.milestones?.length || 0,
      phases: implementationRoadmap.roadmap.phases?.length || 0,
      startDate: implementationRoadmap.roadmap.startDate,
      targetCompletionDate: implementationRoadmap.roadmap.targetCompletionDate
    },
    measurementFramework: {
      kpiCount: measurementFramework.kpiCount,
      successMetrics: measurementFramework.successMetrics,
      measurementFrequency: measurementFramework.measurementFrequency
    },
    risks: {
      riskCount: riskAssessment.riskCount,
      highRiskCount: riskAssessment.highRiskCount,
      mitigationStrategies: riskAssessment.mitigationStrategies?.length || 0
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/technical-documentation/content-strategy',
      timestamp: startTime,
      productType,
      targetAudiences,
      documentationGoals,
      contentTypes,
      platforms,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Discovery and Stakeholder Alignment
export const discoveryStakeholderTask = defineTask('discovery-stakeholder-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct discovery and stakeholder alignment',
  agent: {
    name: 'content-strategist',
    prompt: {
      role: 'senior content strategist and business analyst',
      task: 'Conduct discovery research and align stakeholders on documentation strategy goals',
      context: args,
      instructions: [
        'Interview key stakeholders:',
        '  - Product management (product vision, roadmap)',
        '  - Engineering (technical architecture, APIs)',
        '  - Support (common issues, user pain points)',
        '  - Sales/Marketing (customer questions, positioning)',
        '  - Executive leadership (business objectives)',
        'Document business objectives and documentation goals',
        'Understand product/service architecture and features',
        'Identify target audiences and user segments',
        'Analyze existing documentation landscape',
        'Document technical constraints and platform requirements',
        'Identify competitive landscape and benchmarks',
        'Gather user feedback and support ticket analysis',
        'Document content creation and maintenance resources',
        'Identify success criteria and KPIs',
        'Uncover organizational challenges and politics',
        'Document timeline and budget constraints',
        'Identify subject matter experts and reviewers',
        'Capture key insights and themes from stakeholder interviews',
        'Create stakeholder map with roles and responsibilities',
        'Save discovery report to output directory'
      ],
      outputFormat: 'JSON with stakeholderCount (number), stakeholderInsights (object), userNeedsCount (number), keyInsights (array), contentGaps (array), technicalConstraints (array), businessContext (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholderCount', 'stakeholderInsights', 'userNeedsCount', 'keyInsights', 'artifacts'],
      properties: {
        stakeholderCount: { type: 'number' },
        stakeholderInsights: {
          type: 'object',
          properties: {
            productManagement: { type: 'array', items: { type: 'string' } },
            engineering: { type: 'array', items: { type: 'string' } },
            support: { type: 'array', items: { type: 'string' } },
            salesMarketing: { type: 'array', items: { type: 'string' } },
            leadership: { type: 'array', items: { type: 'string' } }
          }
        },
        userNeedsCount: { type: 'number' },
        keyInsights: { type: 'array', items: { type: 'string' } },
        contentGaps: { type: 'array', items: { type: 'string' } },
        technicalConstraints: { type: 'array', items: { type: 'string' } },
        businessContext: {
          type: 'object',
          properties: {
            objectives: { type: 'array', items: { type: 'string' } },
            timeline: { type: 'string' },
            budget: { type: 'string' },
            resources: { type: 'array', items: { type: 'string' } }
          }
        },
        competitiveLandscape: { type: 'object' },
        successCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-strategy', 'discovery', 'stakeholder-alignment']
}));

// Task 2: User Research and Personas
export const userResearchPersonasTask = defineTask('user-research-personas', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct user research and develop personas',
  agent: {
    name: 'ux-researcher',
    prompt: {
      role: 'UX researcher specializing in technical documentation users',
      task: 'Conduct user research and create detailed user personas for documentation strategy',
      context: args,
      instructions: [
        'Analyze target audience segments and user types',
        'Create detailed user personas (3-7 personas) for each segment:',
        '  - Demographics and background',
        '  - Role and responsibilities',
        '  - Technical skill level and experience',
        '  - Goals and motivations',
        '  - Pain points and frustrations',
        '  - Documentation needs and preferences',
        '  - Context of use (where, when, how)',
        '  - Success criteria and outcomes',
        '  - Preferred learning style',
        '  - Device and platform preferences',
        'Prioritize personas by importance and frequency',
        'Identify primary vs secondary vs tertiary personas',
        'Document persona-specific documentation needs',
        'Map personas to content types they need',
        'Identify persona-specific vocabulary and terminology',
        'Document accessibility needs for personas',
        'Create persona cards and documentation',
        'Validate personas with stakeholders and real users',
        'Save persona documentation to output directory'
      ],
      outputFormat: 'JSON with personas (array), personasCount (number), primaryPersonas (array), secondaryPersonas (array), personaNeeds (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['personas', 'personasCount', 'primaryPersonas', 'artifacts'],
      properties: {
        personas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              description: { type: 'string' },
              skillLevel: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
              goals: { type: 'array', items: { type: 'string' } },
              painPoints: { type: 'array', items: { type: 'string' } },
              documentationNeeds: { type: 'array', items: { type: 'string' } },
              preferredContentTypes: { type: 'array', items: { type: 'string' } },
              preferredLearningStyle: { type: 'string' },
              context: { type: 'string' },
              priority: { type: 'string', enum: ['primary', 'secondary', 'tertiary'] }
            }
          }
        },
        personasCount: { type: 'number' },
        primaryPersonas: { type: 'array', items: { type: 'string' } },
        secondaryPersonas: { type: 'array', items: { type: 'string' } },
        personaNeeds: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              contentTypes: { type: 'array', items: { type: 'string' } },
              topics: { type: 'array', items: { type: 'string' } },
              formats: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'content-strategy', 'user-research', 'personas']
}));

// Task 3: User Journey Mapping
export const userJourneyMappingTask = defineTask('user-journey-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map user journeys and documentation touchpoints',
  agent: {
    name: 'journey-mapper',
    prompt: {
      role: 'customer experience specialist and journey mapping expert',
      task: 'Create detailed user journey maps with documentation touchpoints',
      context: args,
      instructions: [
        'Create user journey maps for each primary persona',
        'Define journey stages (awareness, evaluation, onboarding, usage, mastery, troubleshooting)',
        'For each journey stage document:',
        '  - User goals and tasks',
        '  - Questions users have',
        '  - Pain points and obstacles',
        '  - Emotions and feelings',
        '  - Documentation touchpoints',
        '  - Content needs and gaps',
        '  - Success criteria',
        'Identify critical moments and decision points',
        'Map content types to journey stages',
        'Identify documentation entry points',
        'Document cross-journey patterns and needs',
        'Prioritize journey stages by importance',
        'Identify opportunities for proactive documentation',
        'Map persona-specific journey variations',
        'Create journey visualizations and diagrams',
        'Save journey maps to output directory'
      ],
      outputFormat: 'JSON with journeys (array), journeysCount (number), touchpointsCount (number), criticalMoments (array), contentNeeds (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['journeys', 'journeysCount', 'touchpointsCount', 'artifacts'],
      properties: {
        journeys: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              persona: { type: 'string' },
              journeyName: { type: 'string' },
              stages: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    stage: { type: 'string' },
                    goals: { type: 'array', items: { type: 'string' } },
                    questions: { type: 'array', items: { type: 'string' } },
                    painPoints: { type: 'array', items: { type: 'string' } },
                    touchpoints: { type: 'array', items: { type: 'string' } },
                    contentNeeded: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          }
        },
        journeysCount: { type: 'number' },
        touchpointsCount: { type: 'number' },
        criticalMoments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moment: { type: 'string' },
              journey: { type: 'string' },
              stage: { type: 'string' },
              importance: { type: 'string', enum: ['critical', 'high', 'medium'] },
              contentOpportunity: { type: 'string' }
            }
          }
        },
        contentNeeds: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' }
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
  labels: ['agent', 'content-strategy', 'journey-mapping', 'ux']
}));

// Task 4: Content Audit and Analysis
export const contentAuditAnalysisTask = defineTask('content-audit-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit and analyze existing content',
  agent: {
    name: 'content-auditor',
    prompt: {
      role: 'content auditor and quality analyst',
      task: 'Conduct comprehensive audit of existing documentation content',
      context: args,
      instructions: [
        'Inventory all existing documentation content',
        'Analyze each content piece for:',
        '  - Title, description, and summary',
        '  - Content type (tutorial, guide, reference, etc.)',
        '  - Target audience and persona',
        '  - Quality assessment (excellent, good, fair, poor)',
        '  - Accuracy and currency (up-to-date, outdated, obsolete)',
        '  - Completeness and depth',
        '  - Usage metrics (views, ratings, feedback)',
        '  - Last updated date',
        '  - Owner and maintainer',
        'Identify high-performing content (keep and improve)',
        'Identify low-performing content (revise or retire)',
        'Detect duplicate or redundant content',
        'Find orphaned or inaccessible content',
        'Identify content format and structure issues',
        'Map existing content to user journeys and personas',
        'Calculate content coverage by persona and journey stage',
        'Create content audit spreadsheet and reports',
        'Save audit results to output directory'
      ],
      outputFormat: 'JSON with auditResults (object), existingContentCount (number), highPerforming (array), lowPerforming (array), duplicates (array), orphaned (array), coverageMap (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['auditResults', 'existingContentCount', 'coverageMap', 'artifacts'],
      properties: {
        auditResults: {
          type: 'object',
          properties: {
            totalItems: { type: 'number' },
            byContentType: { type: 'object' },
            byQuality: { type: 'object' },
            byCurrency: { type: 'object' },
            byUsage: { type: 'object' }
          }
        },
        existingContentCount: { type: 'number' },
        highPerforming: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              path: { type: 'string' },
              contentType: { type: 'string' },
              usageScore: { type: 'number' },
              qualityScore: { type: 'number' }
            }
          }
        },
        lowPerforming: { type: 'array' },
        duplicates: { type: 'array' },
        orphaned: { type: 'array' },
        coverageMap: {
          type: 'object',
          properties: {
            byPersona: { type: 'object' },
            byJourneyStage: { type: 'object' },
            byContentType: { type: 'object' }
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
  labels: ['agent', 'content-strategy', 'content-audit', 'analysis']
}));

// Task 5: Gap Analysis and Content Inventory
export const gapAnalysisInventoryTask = defineTask('gap-analysis-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct gap analysis and content inventory',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'content strategist and gap analysis specialist',
      task: 'Identify content gaps and create comprehensive content inventory',
      context: args,
      instructions: [
        'Compare existing content against user journey needs',
        'Identify content gaps by:',
        '  - Persona (which personas are underserved?)',
        '  - Journey stage (which stages lack content?)',
        '  - Content type (missing tutorials, references, etc.)',
        '  - Topic or feature (undocumented features)',
        '  - Platform or channel (web vs mobile gaps)',
        'Prioritize gaps by criticality:',
        '  - Critical: blocking user success, high impact',
        '  - High: significant user pain point',
        '  - Medium: nice-to-have, improves experience',
        '  - Low: edge cases, advanced users',
        'Create master content inventory with:',
        '  - Existing content (to keep, update, or retire)',
        '  - New content needed (to create)',
        '  - Content recommendations and priorities',
        'Calculate content coverage score (0-100)',
        'Estimate content creation effort',
        'Create content gap visualization',
        'Generate recommended actions and priorities',
        'Save gap analysis and inventory to output directory'
      ],
      outputFormat: 'JSON with gaps (array), criticalGapsCount (number), contentInventory (array), totalContentItems (number), coverageScore (number), recommendedActions (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'criticalGapsCount', 'contentInventory', 'totalContentItems', 'coverageScore', 'artifacts'],
      properties: {
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              category: { type: 'string' },
              persona: { type: 'string' },
              journeyStage: { type: 'string' },
              contentType: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact: { type: 'string' },
              effort: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        criticalGapsCount: { type: 'number' },
        contentInventory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              status: { type: 'string', enum: ['existing-keep', 'existing-update', 'existing-retire', 'new-create'] },
              contentType: { type: 'string' },
              persona: { type: 'array', items: { type: 'string' } },
              journeyStage: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string' },
              estimatedEffort: { type: 'string' }
            }
          }
        },
        totalContentItems: { type: 'number' },
        coverageScore: { type: 'number', minimum: 0, maximum: 100 },
        gapsByCategory: {
          type: 'object',
          properties: {
            byPersona: { type: 'object' },
            byJourneyStage: { type: 'object' },
            byContentType: { type: 'object' },
            byPriority: { type: 'object' }
          }
        },
        recommendedActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              priority: { type: 'string' },
              rationale: { type: 'string' }
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
  labels: ['agent', 'content-strategy', 'gap-analysis', 'inventory']
}));

// Task 6: Information Architecture Design
export const informationArchitectureDesignTask = defineTask('information-architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design information architecture',
  agent: {
    name: 'information-architect',
    prompt: {
      role: 'senior information architect specializing in technical documentation',
      task: 'Design comprehensive information architecture for documentation site',
      context: args,
      instructions: [
        'Design top-level documentation structure and categories',
        'Apply information architecture principles:',
        '  - User-centered design (based on user mental models)',
        '  - Findability (can users find what they need?)',
        '  - Discoverability (can users discover related content?)',
        '  - Scalability (can it grow without breaking?)',
        '  - Flexibility (can it adapt to changes?)',
        'Create hierarchical structure (5-9 top-level categories)',
        'Design category groupings and relationships',
        'Determine optimal depth (2-4 levels recommended)',
        'Apply card sorting and tree testing insights',
        'Design for multiple access paths (browsing, searching, linking)',
        'Map content inventory to IA structure',
        'Create sitemap and structure visualization',
        'Design URL structure and naming conventions',
        'Plan for localization and multi-language support',
        'Design cross-linking and related content strategy',
        'Validate IA with personas and user journeys',
        'Create IA documentation and rationale',
        'Save IA design to output directory'
      ],
      outputFormat: 'JSON with structure (object), categoryCount (number), subcategoryCount (number), maxDepth (number), categories (array), sitemapPath (string), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'categoryCount', 'subcategoryCount', 'maxDepth', 'artifacts'],
      properties: {
        structure: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              slug: { type: 'string' },
              subcategories: { type: 'array' },
              contentTypes: { type: 'array', items: { type: 'string' } },
              targetPersonas: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        categoryCount: { type: 'number' },
        subcategoryCount: { type: 'number' },
        maxDepth: { type: 'number' },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              level: { type: 'number' },
              parent: { type: 'string' },
              children: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        urlStructure: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            conventions: { type: 'array', items: { type: 'string' } }
          }
        },
        sitemapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-strategy', 'information-architecture', 'ia']
}));

// Task 7: Taxonomy and Metadata Design
export const taxonomyMetadataDesignTask = defineTask('taxonomy-metadata-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design taxonomy and metadata framework',
  agent: {
    name: 'taxonomy-designer',
    prompt: {
      role: 'taxonomy specialist and metadata architect',
      task: 'Design comprehensive taxonomy and metadata framework for content management',
      context: args,
      instructions: [
        'Design controlled vocabulary and tagging system',
        'Create hierarchical taxonomy aligned with IA',
        'Develop flat tag vocabulary for cross-cutting topics',
        'Design metadata schema with fields:',
        '  - Content metadata (title, description, summary, keywords)',
        '  - Classification (content type, category, tags)',
        '  - Audience (persona, role, skill level)',
        '  - Lifecycle (status, version, created/updated dates)',
        '  - Ownership (author, owner, reviewers, SMEs)',
        '  - Relationships (related content, prerequisites, next steps)',
        '  - Technical (platform, product version, API version)',
        '  - Quality (review status, accuracy score, feedback)',
        'Define faceted classification for filtering:',
        '  - By content type (tutorial, reference, guide)',
        '  - By persona/role',
        '  - By skill level (beginner, advanced)',
        '  - By platform (web, mobile, API)',
        '  - By product feature/module',
        'Create synonym dictionary and preferred terms',
        'Design taxonomy governance and maintenance rules',
        'Create metadata entry guidelines and validation rules',
        'Save taxonomy and metadata documentation to output directory'
      ],
      outputFormat: 'JSON with taxonomy (object), metadataSchema (object), facetsCount (number), synonyms (object), guidelines (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['taxonomy', 'metadataSchema', 'facetsCount', 'artifacts'],
      properties: {
        taxonomy: {
          type: 'object',
          properties: {
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  subcategories: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            tags: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  tag: { type: 'string' },
                  description: { type: 'string' },
                  usageGuidelines: { type: 'string' }
                }
              }
            },
            metadataFields: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  required: { type: 'boolean' },
                  description: { type: 'string' },
                  validation: { type: 'string' },
                  defaultValue: { type: 'string' },
                  controlledVocabulary: { type: 'array' }
                }
              }
            }
          }
        },
        metadataSchema: { type: 'object' },
        facetsCount: { type: 'number' },
        facets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              metadataField: { type: 'string' },
              values: { type: 'array', items: { type: 'string' } },
              filterType: { type: 'string' }
            }
          }
        },
        synonyms: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              preferred: { type: 'string' },
              alternatives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        guidelines: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-strategy', 'taxonomy', 'metadata']
}));

// Task 8: Content Model Development
export const contentModelDevelopmentTask = defineTask('content-model-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop structured content model',
  agent: {
    name: 'content-modeler',
    prompt: {
      role: 'content modeling specialist and structured authoring expert',
      task: 'Develop comprehensive structured content model for reusable, multi-channel publishing',
      context: args,
      instructions: [
        'Design content types with structured schemas:',
        '  - Tutorial (overview, prerequisites, steps, verification, next steps)',
        '  - How-to guide (problem, solution, steps, troubleshooting)',
        '  - API reference (endpoint, method, parameters, responses, examples)',
        '  - Concept explanation (definition, details, use cases, best practices)',
        '  - Troubleshooting (symptoms, causes, solutions, prevention)',
        '  - Release notes (version, features, fixes, breaking changes)',
        'Define reusable content components:',
        '  - Code snippets (with syntax highlighting)',
        '  - Admonitions (notes, warnings, tips, important)',
        '  - Images and diagrams (with alt text)',
        '  - Tables and data displays',
        '  - Video embeds and media',
        '  - Interactive examples',
        '  - Cross-references and links',
        'Design content templates for each content type',
        'Define required vs optional elements for each type',
        'Design for content reuse and single-sourcing',
        'Plan for multi-channel publishing (web, mobile, PDF, API)',
        'Create content component library',
        'Define content relationships and linking patterns',
        'Design for localization and translation',
        'Create content model documentation and guidelines',
        'Save content model to output directory'
      ],
      outputFormat: 'JSON with model (object), contentTypeCount (number), componentCount (number), templateCount (number), isStructured (boolean), isReusable (boolean), contentTypes (array), components (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'contentTypeCount', 'componentCount', 'templateCount', 'artifacts'],
      properties: {
        model: {
          type: 'object',
          properties: {
            contentTypes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  structure: { type: 'array', items: { type: 'string' } },
                  requiredElements: { type: 'array', items: { type: 'string' } },
                  optionalElements: { type: 'array', items: { type: 'string' } },
                  metadata: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            components: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  description: { type: 'string' },
                  properties: { type: 'object' },
                  reusable: { type: 'boolean' }
                }
              }
            }
          }
        },
        contentTypeCount: { type: 'number' },
        componentCount: { type: 'number' },
        templateCount: { type: 'number' },
        isStructured: { type: 'boolean' },
        isReusable: { type: 'boolean' },
        contentTypes: { type: 'array', items: { type: 'string' } },
        components: { type: 'array', items: { type: 'string' } },
        templatesPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-strategy', 'content-model', 'structured-content']
}));

// Task 9: Navigation and Findability Strategy
export const navigationFindabilityTask = defineTask('navigation-findability-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop navigation and findability strategy',
  agent: {
    name: 'navigation-strategist',
    prompt: {
      role: 'navigation architect and findability specialist',
      task: 'Design comprehensive navigation system and findability strategy',
      context: args,
      instructions: [
        'Design primary navigation structure:',
        '  - Global navigation (main menu, top nav)',
        '  - Section navigation (sidebar, left nav)',
        '  - Local navigation (in-page TOC, breadcrumbs)',
        '  - Footer navigation (sitemap, quick links)',
        'Design navigation patterns for each platform (web, mobile)',
        'Create persona-specific entry points and paths',
        'Design wayfinding elements:',
        '  - Breadcrumbs for location awareness',
        '  - Page titles and headings hierarchy',
        '  - Next/previous navigation',
        '  - Related content recommendations',
        'Design for scannability and quick access',
        'Plan progressive disclosure for complex topics',
        'Design landing pages for each major section',
        'Create quick start and getting started paths',
        'Design contextual navigation (based on user state)',
        'Plan for internationalization (language switcher)',
        'Calculate navigation paths and click depth',
        'Create navigation specifications and wireframes',
        'Save navigation strategy to output directory'
      ],
      outputFormat: 'JSON with navigationConfig (object), pathCount (number), maxClickDepth (number), entryPoints (array), landingPages (array), mobileNavigation (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['navigationConfig', 'pathCount', 'maxClickDepth', 'artifacts'],
      properties: {
        navigationConfig: {
          type: 'object',
          properties: {
            global: {
              type: 'object',
              properties: {
                menuItems: { type: 'array', items: { type: 'string' } },
                placement: { type: 'string' },
                style: { type: 'string' }
              }
            },
            section: {
              type: 'object',
              properties: {
                structure: { type: 'string' },
                maxDepth: { type: 'number' },
                expandableGroups: { type: 'boolean' }
              }
            },
            local: {
              type: 'object',
              properties: {
                tableOfContents: { type: 'boolean' },
                breadcrumbs: { type: 'boolean' },
                nextPrevious: { type: 'boolean' }
              }
            }
          }
        },
        pathCount: { type: 'number' },
        maxClickDepth: { type: 'number' },
        entryPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              persona: { type: 'string' },
              path: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        landingPages: { type: 'array', items: { type: 'string' } },
        mobileNavigation: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            menuStyle: { type: 'string' },
            adaptations: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'content-strategy', 'navigation', 'findability']
}));

// Task 10: Search Strategy
export const searchStrategyTask = defineTask('search-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design search strategy and requirements',
  agent: {
    name: 'search-strategist',
    prompt: {
      role: 'search experience designer and information retrieval specialist',
      task: 'Design comprehensive search strategy and requirements',
      context: args,
      instructions: [
        'Define search requirements and capabilities:',
        '  - Full-text search across all content',
        '  - Faceted search with filters',
        '  - Autocomplete and query suggestions',
        '  - Spell correction and fuzzy matching',
        '  - Synonym expansion',
        '  - Natural language queries',
        '  - Search within results',
        'Design search index schema and fields',
        'Define search ranking and relevance factors:',
        '  - Title match (highest weight)',
        '  - Content match',
        '  - Tag and metadata match',
        '  - Recency and freshness',
        '  - Popularity and usage',
        '  - Persona and context relevance',
        'Design faceted navigation and filters:',
        '  - By content type',
        '  - By persona/audience',
        '  - By product/feature',
        '  - By platform',
        '  - By difficulty level',
        'Design search results page layout',
        'Plan for zero-results handling',
        'Design search analytics and tracking',
        'Create search optimization guidelines',
        'Save search strategy to output directory'
      ],
      outputFormat: 'JSON with searchConfig (object), indexSchema (object), rankingFactors (array), facets (array), features (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['searchConfig', 'indexSchema', 'rankingFactors', 'facets', 'artifacts'],
      properties: {
        searchConfig: {
          type: 'object',
          properties: {
            searchEngine: { type: 'string' },
            features: { type: 'array', items: { type: 'string' } },
            indexUpdateFrequency: { type: 'string' },
            searchTypes: { type: 'array', items: { type: 'string' } }
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
                  indexed: { type: 'boolean' },
                  searchable: { type: 'boolean' }
                }
              }
            }
          }
        },
        rankingFactors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              weight: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        facets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              field: { type: 'string' },
              type: { type: 'string' },
              values: { type: 'array' }
            }
          }
        },
        features: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-strategy', 'search', 'findability']
}));

// Task 11: Content Lifecycle and Workflow Design
export const contentLifecycleWorkflowTask = defineTask('content-lifecycle-workflow', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design content lifecycle and workflows',
  agent: {
    name: 'workflow-designer',
    prompt: {
      role: 'content operations specialist and workflow designer',
      task: 'Design content lifecycle stages and production workflows',
      context: args,
      instructions: [
        'Define content lifecycle stages:',
        '  - Planning (ideation, approval)',
        '  - Creation (writing, development)',
        '  - Review (technical review, editorial review, legal review)',
        '  - Approval (stakeholder sign-off)',
        '  - Publishing (deployment, release)',
        '  - Maintenance (updates, revisions)',
        '  - Archival (deprecation, sunset)',
        'Design content production workflow:',
        '  - Request and intake process',
        '  - Assignment and scheduling',
        '  - Draft creation',
        '  - Peer review',
        '  - Subject matter expert (SME) review',
        '  - Editorial review',
        '  - Final approval',
        '  - Publication',
        'Define workflow roles and responsibilities',
        'Design content status taxonomy (draft, in-review, approved, published)',
        'Plan for version control and change tracking',
        'Design update and maintenance workflows',
        'Create workflow diagrams and documentation',
        'Define SLAs and turnaround times',
        'Save workflow documentation to output directory'
      ],
      outputFormat: 'JSON with workflow (object), lifecycleStages (array), roles (array), statusTaxonomy (array), slas (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['workflow', 'lifecycleStages', 'roles', 'artifacts'],
      properties: {
        workflow: {
          type: 'object',
          properties: {
            stages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stage: { type: 'string' },
                  description: { type: 'string' },
                  roles: { type: 'array', items: { type: 'string' } },
                  tasks: { type: 'array', items: { type: 'string' } },
                  exitCriteria: { type: 'array', items: { type: 'string' } },
                  nextStages: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            approvals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  gate: { type: 'string' },
                  approver: { type: 'string' },
                  criteria: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        lifecycleStages: { type: 'array', items: { type: 'string' } },
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              permissions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        statusTaxonomy: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              description: { type: 'string' },
              color: { type: 'string' }
            }
          }
        },
        slas: {
          type: 'object',
          properties: {
            draftToReview: { type: 'string' },
            reviewToApproval: { type: 'string' },
            approvalToPublish: { type: 'string' },
            updateCycle: { type: 'string' }
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
  labels: ['agent', 'content-strategy', 'workflow', 'lifecycle']
}));

// Task 12: Governance Framework
export const governanceFrameworkTask = defineTask('governance-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create governance framework and policies',
  agent: {
    name: 'governance-specialist',
    prompt: {
      role: 'content governance specialist and policy designer',
      task: 'Create comprehensive content governance framework',
      context: args,
      instructions: [
        'Define governance structure and roles:',
        '  - Content strategy owner (overall accountability)',
        '  - Editorial board (quality standards, strategic decisions)',
        '  - Content managers (section ownership)',
        '  - Content creators (writers, developers)',
        '  - Subject matter experts (SMEs for technical accuracy)',
        '  - Reviewers (editorial, technical, legal)',
        '  - Publishers (deployment, release management)',
        'Create governance policies:',
        '  - Content quality standards',
        '  - Brand and voice guidelines',
        '  - Editorial standards',
        '  - Technical accuracy requirements',
        '  - Accessibility requirements',
        '  - Localization standards',
        '  - Metadata requirements',
        '  - Review and approval policies',
        '  - Publication and release policies',
        '  - Update and maintenance policies',
        '  - Archival and retirement policies',
        'Define decision-making authority and escalation',
        'Create governance meeting cadence (weekly, monthly, quarterly)',
        'Define metrics and reporting requirements',
        'Create governance documentation and handbook',
        'Save governance framework to output directory'
      ],
      outputFormat: 'JSON with framework (object), roles (array), policies (array), decisionRights (object), meetingCadence (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'roles', 'policies', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            structure: { type: 'string' },
            roles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string' },
                  description: { type: 'string' },
                  responsibilities: { type: 'array', items: { type: 'string' } },
                  authority: { type: 'array', items: { type: 'string' } }
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
                  scope: { type: 'string' },
                  enforcementLevel: { type: 'string', enum: ['required', 'recommended', 'optional'] },
                  owner: { type: 'string' }
                }
              }
            },
            workflows: { type: 'array' },
            qualityStandards: { type: 'object' }
          }
        },
        roles: { type: 'array' },
        policies: { type: 'array' },
        decisionRights: {
          type: 'object',
          properties: {
            strategic: { type: 'string' },
            tactical: { type: 'string' },
            operational: { type: 'string' }
          }
        },
        meetingCadence: {
          type: 'object',
          properties: {
            editorialBoard: { type: 'string' },
            contentReview: { type: 'string' },
            metricsReview: { type: 'string' }
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
  labels: ['agent', 'content-strategy', 'governance', 'policy']
}));

// Task 13: Style Guide and Standards
export const styleGuideStandardsTask = defineTask('style-guide-standards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop style guide and content standards',
  agent: {
    name: 'style-guide-specialist',
    prompt: {
      role: 'senior technical writer and style guide expert',
      task: 'Create comprehensive style guide and content standards documentation',
      context: args,
      instructions: [
        'Create style guide sections:',
        '  - Voice and tone (professional, friendly, helpful)',
        '  - Grammar and mechanics (tense, person, active voice)',
        '  - Terminology and word choice (preferred terms)',
        '  - Capitalization and punctuation',
        '  - Numbers and dates',
        '  - Abbreviations and acronyms',
        '  - Code and technical notation',
        '  - Formatting (headings, lists, tables)',
        '  - Links and cross-references',
        '  - Images and media',
        '  - Accessibility requirements',
        'Create content type-specific guidelines:',
        '  - Tutorial guidelines',
        '  - API reference guidelines',
        '  - Troubleshooting guidelines',
        '  - Release notes guidelines',
        'Define editorial standards and best practices',
        'Create writing tips and common mistakes',
        'Include before/after examples',
        'Create glossary of technical terms',
        'Design for easy reference and searchability',
        'Save style guide to output directory'
      ],
      outputFormat: 'JSON with styleGuide (object), sections (array), contentTypeGuidelines (object), glossary (array), examplesCount (number), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['styleGuide', 'sections', 'contentTypeGuidelines', 'artifacts'],
      properties: {
        styleGuide: {
          type: 'object',
          properties: {
            voiceAndTone: {
              type: 'object',
              properties: {
                voice: { type: 'string' },
                tone: { type: 'string' },
                guidelines: { type: 'array', items: { type: 'string' } }
              }
            },
            grammarMechanics: { type: 'object' },
            terminology: {
              type: 'object',
              properties: {
                preferredTerms: { type: 'object' },
                avoidedTerms: { type: 'array', items: { type: 'string' } }
              }
            },
            formatting: { type: 'object' },
            accessibility: {
              type: 'object',
              properties: {
                requirements: { type: 'array', items: { type: 'string' } },
                guidelines: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        sections: { type: 'array', items: { type: 'string' } },
        contentTypeGuidelines: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              purpose: { type: 'string' },
              structure: { type: 'array', items: { type: 'string' } },
              bestPractices: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        glossary: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              definition: { type: 'string' },
              usage: { type: 'string' }
            }
          }
        },
        examplesCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-strategy', 'style-guide', 'standards']
}));

// Task 14: Content Production Strategy
export const contentProductionStrategyTask = defineTask('content-production-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create content production strategy and roadmap',
  agent: {
    name: 'production-strategist',
    prompt: {
      role: 'content production manager and roadmap strategist',
      task: 'Create phased content production strategy and roadmap',
      context: args,
      instructions: [
        'Prioritize content creation based on:',
        '  - Critical user journeys (onboarding, core tasks)',
        '  - High-impact gaps (blocking user success)',
        '  - Quick wins (high value, low effort)',
        '  - Strategic importance (business priorities)',
        '  - Dependencies (prerequisite content)',
        'Create phased production roadmap:',
        '  - Phase 1: Foundation (getting started, core concepts)',
        '  - Phase 2: Essential paths (common use cases, key features)',
        '  - Phase 3: Advanced (complex scenarios, integrations)',
        '  - Phase 4: Optimization (edge cases, best practices)',
        'For each phase define:',
        '  - Objectives and deliverables',
        '  - Content items to create/update',
        '  - Estimated effort and timeline',
        '  - Resource requirements',
        '  - Dependencies and blockers',
        '  - Success metrics',
        'Estimate content creation capacity and velocity',
        'Plan for content migration and updates',
        'Create content backlog with priorities',
        'Define sprint/iteration planning approach',
        'Save production strategy to output directory'
      ],
      outputFormat: 'JSON with roadmap (object), phaseCount (number), totalContentItems (number), estimatedDuration (string), resourcesNeeded (array), backlog (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'phaseCount', 'totalContentItems', 'estimatedDuration', 'artifacts'],
      properties: {
        roadmap: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  objectives: { type: 'array', items: { type: 'string' } },
                  contentItems: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        contentType: { type: 'string' },
                        priority: { type: 'string' },
                        effort: { type: 'string' }
                      }
                    }
                  },
                  duration: { type: 'string' },
                  dependencies: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        phaseCount: { type: 'number' },
        totalContentItems: { type: 'number' },
        estimatedDuration: { type: 'string' },
        resourcesNeeded: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              allocation: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        backlog: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              priority: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        velocity: {
          type: 'object',
          properties: {
            contentItemsPerWeek: { type: 'number' },
            contentItemsPerMonth: { type: 'number' }
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
  labels: ['agent', 'content-strategy', 'production', 'roadmap']
}));

// Task 15: Measurement and Success Metrics
export const measurementMetricsTask = defineTask('measurement-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define measurement framework and success metrics',
  agent: {
    name: 'metrics-specialist',
    prompt: {
      role: 'documentation analytics and measurement specialist',
      task: 'Define comprehensive measurement framework and success metrics',
      context: args,
      instructions: [
        'Define KPIs aligned with documentation goals:',
        '  - Usage metrics (page views, unique visitors, time on page)',
        '  - Engagement metrics (scroll depth, click-through rate)',
        '  - Search metrics (search success rate, zero-result rate)',
        '  - Feedback metrics (ratings, helpful votes, comments)',
        '  - Support impact (ticket reduction, resolution time)',
        '  - Business impact (adoption rate, feature usage, conversion)',
        'Define success metrics for each goal:',
        '  - Improve onboarding → time to first value, completion rate',
        '  - Reduce support tickets → ticket deflection rate, ticket volume',
        '  - Increase adoption → feature activation rate, user growth',
        'Define leading and lagging indicators',
        'Create measurement plan:',
        '  - What to measure',
        '  - How to measure (tools, methods)',
        '  - When to measure (frequency)',
        '  - Who measures (ownership)',
        '  - Reporting and dashboards',
        'Set baseline and target values',
        'Define A/B testing and experimentation approach',
        'Create analytics implementation plan',
        'Save measurement framework to output directory'
      ],
      outputFormat: 'JSON with kpiCount (number), successMetrics (array), measurementPlan (object), baselines (object), targets (object), measurementFrequency (string), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['kpiCount', 'successMetrics', 'measurementPlan', 'artifacts'],
      properties: {
        kpiCount: { type: 'number' },
        successMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              goal: { type: 'string' },
              type: { type: 'string', enum: ['leading', 'lagging'] },
              calculation: { type: 'string' },
              baseline: { type: 'string' },
              target: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        measurementPlan: {
          type: 'object',
          properties: {
            tools: { type: 'array', items: { type: 'string' } },
            dataCollection: { type: 'object' },
            reporting: {
              type: 'object',
              properties: {
                dashboards: { type: 'array', items: { type: 'string' } },
                reports: { type: 'array', items: { type: 'string' } },
                cadence: { type: 'string' }
              }
            }
          }
        },
        baselines: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        targets: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        measurementFrequency: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-strategy', 'measurement', 'metrics']
}));

// Task 16: Risk Assessment and Mitigation
export const riskAssessmentMitigationTask = defineTask('risk-assessment-mitigation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct risk assessment and mitigation planning',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'project risk management specialist',
      task: 'Identify risks and create mitigation strategies for content strategy implementation',
      context: args,
      instructions: [
        'Identify potential risks:',
        '  - Resource risks (insufficient writers, SMEs unavailable)',
        '  - Schedule risks (delays, dependencies, scope creep)',
        '  - Quality risks (technical accuracy, content quality)',
        '  - Technical risks (platform limitations, integration issues)',
        '  - Organizational risks (stakeholder alignment, change resistance)',
        '  - Budget risks (cost overruns, funding cuts)',
        '  - User adoption risks (low engagement, poor usability)',
        'For each risk assess:',
        '  - Likelihood (high, medium, low)',
        '  - Impact (high, medium, low)',
        '  - Risk score (likelihood × impact)',
        '  - Timeframe (when might it occur)',
        'Develop mitigation strategies:',
        '  - Prevent (reduce likelihood)',
        '  - Mitigate (reduce impact)',
        '  - Transfer (shift to others)',
        '  - Accept (acknowledge and monitor)',
        'Create contingency plans for high-risk items',
        'Define risk monitoring and reporting process',
        'Identify early warning indicators',
        'Save risk assessment to output directory'
      ],
      outputFormat: 'JSON with risks (array), riskCount (number), highRiskCount (number), mitigationStrategies (array), contingencyPlans (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'riskCount', 'highRiskCount', 'mitigationStrategies', 'artifacts'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              category: { type: 'string' },
              likelihood: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              riskScore: { type: 'number' },
              timeframe: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        riskCount: { type: 'number' },
        highRiskCount: { type: 'number' },
        mitigationStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              strategy: { type: 'string' },
              approach: { type: 'string', enum: ['prevent', 'mitigate', 'transfer', 'accept'] },
              actions: { type: 'array', items: { type: 'string' } },
              owner: { type: 'string' }
            }
          }
        },
        contingencyPlans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              trigger: { type: 'string' },
              actions: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'content-strategy', 'risk', 'mitigation']
}));

// Task 17: Implementation Roadmap
export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create comprehensive implementation roadmap',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'program manager and implementation strategist',
      task: 'Create detailed implementation roadmap for content strategy execution',
      context: args,
      instructions: [
        'Create comprehensive implementation roadmap with phases:',
        '  - Phase 0: Foundation setup (platform, tooling, governance)',
        '  - Phase 1: Content production (based on production strategy)',
        '  - Phase 2: Migration and optimization',
        '  - Phase 3: Launch and rollout',
        '  - Phase 4: Iteration and improvement',
        'Define milestones and deliverables for each phase',
        'Create Gantt chart or timeline visualization',
        'Identify critical path and dependencies',
        'Assign owners and teams to each phase',
        'Define phase gates and approval points',
        'Estimate resource requirements by phase',
        'Plan for parallel vs sequential work',
        'Include buffer time for risks and unknowns',
        'Define communication and status reporting cadence',
        'Create launch readiness checklist',
        'Plan for post-launch iteration and measurement',
        'Save implementation roadmap to output directory'
      ],
      outputFormat: 'JSON with roadmap (object), milestones (array), criticalPath (array), phaseGates (array), resourcePlan (object), timeline (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'milestones', 'artifacts'],
      properties: {
        roadmap: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  duration: { type: 'string' },
                  startDate: { type: 'string' },
                  endDate: { type: 'string' },
                  objectives: { type: 'array', items: { type: 'string' } },
                  deliverables: { type: 'array', items: { type: 'string' } },
                  owner: { type: 'string' },
                  dependencies: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            startDate: { type: 'string' },
            targetCompletionDate: { type: 'string' }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              date: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } },
              criteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        criticalPath: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              duration: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        phaseGates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gate: { type: 'string' },
              criteria: { type: 'array', items: { type: 'string' } },
              approvers: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        resourcePlan: {
          type: 'object',
          properties: {
            byPhase: { type: 'object' },
            byRole: { type: 'object' }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            totalDuration: { type: 'string' },
            phaseCount: { type: 'number' },
            milestoneCount: { type: 'number' }
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
  labels: ['agent', 'content-strategy', 'roadmap', 'implementation']
}));

// Task 18: Stakeholder Approval
export const stakeholderApprovalTask = defineTask('stakeholder-approval', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review and approval',
  agent: {
    name: 'stakeholder-manager',
    prompt: {
      role: 'stakeholder engagement and change management specialist',
      task: 'Facilitate stakeholder review and approval of content strategy',
      context: args,
      instructions: [
        'Prepare strategy presentation for stakeholder review',
        'Present key elements:',
        '  - User research and personas',
        '  - Information architecture',
        '  - Content model and taxonomy',
        '  - Production strategy and roadmap',
        '  - Resource requirements and timeline',
        '  - Success metrics and expected outcomes',
        'Facilitate stakeholder discussion and Q&A',
        'Collect feedback and concerns from stakeholders:',
        '  - Executive leadership',
        '  - Product management',
        '  - Engineering',
        '  - Support',
        '  - Sales/Marketing',
        'Document feedback by category and priority',
        'Identify blockers and critical concerns',
        'Determine if strategy requires revisions',
        'Document approval status and conditions',
        'Create action plan for addressing feedback',
        'Save stakeholder review report to output directory'
      ],
      outputFormat: 'JSON with approved (boolean), stakeholdersCount (number), feedback (array), feedbackCount (number), revisionsNeeded (boolean), approvalConditions (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'stakeholdersCount', 'feedback', 'feedbackCount', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        stakeholdersCount: { type: 'number' },
        feedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              role: { type: 'string' },
              feedbackItem: { type: 'string' },
              category: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        feedbackCount: { type: 'number' },
        revisionsNeeded: { type: 'boolean' },
        approvalConditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' }
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
  labels: ['agent', 'content-strategy', 'stakeholder-approval', 'governance']
}));

// Task 19: Final Strategy Document Generation
export const strategyDocumentGenerationTask = defineTask('strategy-document-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate final strategy document',
  agent: {
    name: 'strategy-documentor',
    prompt: {
      role: 'senior content strategist and documentation specialist',
      task: 'Generate comprehensive final content strategy document',
      context: args,
      instructions: [
        'Create executive summary (2-3 pages):',
        '  - Project overview and objectives',
        '  - Key findings and insights',
        '  - Strategic recommendations',
        '  - Resource requirements and timeline',
        '  - Expected outcomes and ROI',
        'Create main strategy document with sections:',
        '  - Introduction and background',
        '  - Discovery and research findings',
        '  - User personas and journey maps',
        '  - Content audit and gap analysis',
        '  - Information architecture design',
        '  - Content model and taxonomy',
        '  - Navigation and search strategy',
        '  - Governance framework',
        '  - Style guide and standards',
        '  - Content production roadmap',
        '  - Implementation plan',
        '  - Measurement framework',
        '  - Risks and mitigation',
        'Create appendices with detailed artifacts',
        'Generate presentation deck for stakeholders',
        'Create quick reference guide for implementation team',
        'Format for multiple audiences (executives, practitioners)',
        'Save all documents to output directory'
      ],
      outputFormat: 'JSON with executiveSummary (string), documentPath (string), presentationPath (string), version (string), sections (array), pageCount (number), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['executiveSummary', 'documentPath', 'version', 'artifacts'],
      properties: {
        executiveSummary: { type: 'string' },
        documentPath: { type: 'string' },
        presentationPath: { type: 'string' },
        quickReferencePath: { type: 'string' },
        version: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              pageCount: { type: 'number' },
              summary: { type: 'string' }
            }
          }
        },
        pageCount: { type: 'number' },
        documentFormats: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-strategy', 'documentation', 'deliverable']
}));
