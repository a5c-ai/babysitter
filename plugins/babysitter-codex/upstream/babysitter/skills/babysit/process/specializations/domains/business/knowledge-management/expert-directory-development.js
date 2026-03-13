/**
 * @process domains/business/knowledge-management/expert-directory-development
 * @description Build and maintain expert directories and skills databases to help employees locate subject matter experts across the organization
 * @specialization Knowledge Management
 * @category Expertise Location and Mapping
 * @inputs { organizationalScope: object, expertiseDomains: array, existingSystems: array, governanceRequirements: object, outputDir: string }
 * @outputs { success: boolean, directoryDesign: object, expertProfiles: array, searchCapabilities: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationalScope = {},
    expertiseDomains = [],
    existingSystems = [],
    governanceRequirements = {},
    profileRequirements = {
      coreFields: ['name', 'role', 'department', 'expertise', 'contact'],
      optionalFields: ['publications', 'certifications', 'projects', 'availability'],
      privacyControls: true
    },
    searchRequirements = {
      byExpertise: true,
      byLocation: true,
      byAvailability: true,
      byLanguage: false
    },
    outputDir = 'expert-directory-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Expert Directory Development Process');

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing directory requirements');
  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    organizationalScope,
    expertiseDomains,
    existingSystems,
    profileRequirements,
    searchRequirements,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // Breakpoint: Review requirements
  await ctx.breakpoint({
    question: `Analyzed requirements for ${expertiseDomains.length} expertise domains. Review?`,
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
        expertiseDomains: expertiseDomains.length,
        keyRequirements: requirementsAnalysis.keyRequirements.length
      }
    }
  });

  // ============================================================================
  // PHASE 2: EXPERTISE TAXONOMY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing expertise taxonomy');
  const expertiseTaxonomy = await ctx.task(expertiseTaxonomyTask, {
    expertiseDomains,
    organizationalScope,
    existingSystems,
    outputDir
  });

  artifacts.push(...expertiseTaxonomy.artifacts);

  // ============================================================================
  // PHASE 3: PROFILE SCHEMA DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing expert profile schema');
  const profileSchema = await ctx.task(profileSchemaTask, {
    profileRequirements,
    expertiseTaxonomy: expertiseTaxonomy.taxonomy,
    governanceRequirements,
    outputDir
  });

  artifacts.push(...profileSchema.artifacts);

  // ============================================================================
  // PHASE 4: SEARCH AND DISCOVERY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing search and discovery');
  const searchDesign = await ctx.task(searchDesignTask, {
    searchRequirements,
    expertiseTaxonomy: expertiseTaxonomy.taxonomy,
    profileSchema: profileSchema.schema,
    outputDir
  });

  artifacts.push(...searchDesign.artifacts);

  // Breakpoint: Review search design
  await ctx.breakpoint({
    question: `Search design completed with ${searchDesign.searchMethods.length} search methods. Review?`,
    title: 'Search Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        searchMethods: searchDesign.searchMethods.length,
        facets: searchDesign.facets.length
      }
    }
  });

  // ============================================================================
  // PHASE 5: DATA COLLECTION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing data collection strategy');
  const dataCollectionStrategy = await ctx.task(dataCollectionStrategyTask, {
    profileSchema: profileSchema.schema,
    existingSystems,
    organizationalScope,
    governanceRequirements,
    outputDir
  });

  artifacts.push(...dataCollectionStrategy.artifacts);

  // ============================================================================
  // PHASE 6: GOVERNANCE AND MAINTENANCE FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing governance and maintenance');
  const governanceFramework = await ctx.task(governanceFrameworkTask, {
    governanceRequirements,
    profileSchema: profileSchema.schema,
    dataCollectionStrategy: dataCollectionStrategy.strategy,
    outputDir
  });

  artifacts.push(...governanceFramework.artifacts);

  // ============================================================================
  // PHASE 7: INTEGRATION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing system integrations');
  const integrationDesign = await ctx.task(integrationDesignTask, {
    existingSystems,
    profileSchema: profileSchema.schema,
    searchDesign: searchDesign.design,
    outputDir
  });

  artifacts.push(...integrationDesign.artifacts);

  // ============================================================================
  // PHASE 8: USER EXPERIENCE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 8: Designing user experience');
  const uxDesign = await ctx.task(uxDesignTask, {
    profileSchema: profileSchema.schema,
    searchDesign: searchDesign.design,
    organizationalScope,
    outputDir
  });

  artifacts.push(...uxDesign.artifacts);

  // ============================================================================
  // PHASE 9: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing design quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    requirementsAnalysis,
    expertiseTaxonomy,
    profileSchema,
    searchDesign,
    governanceFramework,
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
      directoryDesign: {
        taxonomy: expertiseTaxonomy.taxonomy,
        profileSchema: profileSchema.schema,
        searchDesign: searchDesign.design
      },
      governanceFramework: governanceFramework.framework,
      qualityScore: qualityAssessment.overallScore,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Final approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Finalize directory design?`,
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
    directoryDesign: {
      taxonomy: expertiseTaxonomy.taxonomy,
      profileSchema: profileSchema.schema,
      searchDesign: searchDesign.design,
      uxDesign: uxDesign.design
    },
    expertProfiles: profileSchema.sampleProfiles,
    searchCapabilities: searchDesign.capabilities,
    dataCollection: dataCollectionStrategy.strategy,
    governance: governanceFramework.framework,
    integrations: integrationDesign.integrations,
    statistics: {
      expertiseDomains: expertiseTaxonomy.domainCount,
      profileFields: profileSchema.fieldCount,
      searchMethods: searchDesign.searchMethods.length
    },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/business/knowledge-management/expert-directory-development',
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
  title: 'Analyze directory requirements',
  agent: {
    name: 'requirements-analyst',
    prompt: {
      role: 'expert directory requirements analyst',
      task: 'Analyze requirements for expert directory',
      context: args,
      instructions: [
        'Analyze directory requirements:',
        '  - User needs and use cases',
        '  - Expertise domains to cover',
        '  - Search and discovery needs',
        '  - Integration requirements',
        '  - Privacy and governance needs',
        'Document user personas',
        'Define success metrics',
        'Prioritize requirements',
        'Save requirements analysis to output directory'
      ],
      outputFormat: 'JSON with requirements (object), keyRequirements (array), userPersonas (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'keyRequirements', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        keyRequirements: { type: 'array' },
        userPersonas: { type: 'array' },
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

// Task 2: Expertise Taxonomy
export const expertiseTaxonomyTask = defineTask('expertise-taxonomy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop expertise taxonomy',
  agent: {
    name: 'taxonomy-specialist',
    prompt: {
      role: 'expertise taxonomy specialist',
      task: 'Develop taxonomy of expertise domains',
      context: args,
      instructions: [
        'Develop expertise taxonomy:',
        '  - Main expertise categories',
        '  - Subcategories and specializations',
        '  - Skills and competencies',
        '  - Proficiency levels',
        'Define taxonomy hierarchy',
        'Create controlled vocabulary',
        'Map to industry standards',
        'Save taxonomy to output directory'
      ],
      outputFormat: 'JSON with taxonomy (object), domainCount (number), skillCount (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['taxonomy', 'domainCount', 'artifacts'],
      properties: {
        taxonomy: { type: 'object' },
        domainCount: { type: 'number' },
        skillCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'taxonomy', 'expertise']
}));

// Task 3: Profile Schema
export const profileSchemaTask = defineTask('profile-schema', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design expert profile schema',
  agent: {
    name: 'schema-designer',
    prompt: {
      role: 'expert profile schema designer',
      task: 'Design schema for expert profiles',
      context: args,
      instructions: [
        'Design expert profile schema:',
        '  - Core profile fields',
        '  - Expertise and skills section',
        '  - Experience and credentials',
        '  - Availability and contact',
        '  - Privacy controls',
        'Define field types and validations',
        'Create sample profiles',
        'Save profile schema to output directory'
      ],
      outputFormat: 'JSON with schema (object), fieldCount (number), sampleProfiles (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schema', 'fieldCount', 'artifacts'],
      properties: {
        schema: { type: 'object' },
        fieldCount: { type: 'number' },
        sampleProfiles: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'schema', 'profiles']
}));

// Task 4: Search Design
export const searchDesignTask = defineTask('search-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design search and discovery',
  agent: {
    name: 'search-designer',
    prompt: {
      role: 'expert search and discovery designer',
      task: 'Design search and discovery capabilities',
      context: args,
      instructions: [
        'Design search capabilities:',
        '  - Full-text search',
        '  - Faceted search',
        '  - Browse by taxonomy',
        '  - Advanced filters',
        '  - Relevance ranking',
        'Design discovery features',
        'Define search UX patterns',
        'Save search design to output directory'
      ],
      outputFormat: 'JSON with design (object), searchMethods (array), facets (array), capabilities (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'searchMethods', 'artifacts'],
      properties: {
        design: { type: 'object' },
        searchMethods: { type: 'array' },
        facets: { type: 'array' },
        capabilities: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'search', 'discovery']
}));

// Task 5: Data Collection Strategy
export const dataCollectionStrategyTask = defineTask('data-collection-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop data collection strategy',
  agent: {
    name: 'data-strategist',
    prompt: {
      role: 'expert data collection strategist',
      task: 'Develop strategy for collecting expert data',
      context: args,
      instructions: [
        'Develop data collection strategy:',
        '  - Self-service profile creation',
        '  - Integration with HR systems',
        '  - Manager nominations',
        '  - Automated skill inference',
        '  - Profile verification',
        'Design onboarding process',
        'Plan initial population',
        'Save data collection strategy to output directory'
      ],
      outputFormat: 'JSON with strategy (object), collectionMethods (array), verificationProcess (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        collectionMethods: { type: 'array' },
        verificationProcess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'data-collection', 'strategy']
}));

// Task 6: Governance Framework
export const governanceFrameworkTask = defineTask('governance-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design governance and maintenance',
  agent: {
    name: 'governance-architect',
    prompt: {
      role: 'directory governance architect',
      task: 'Design governance and maintenance framework',
      context: args,
      instructions: [
        'Design governance framework:',
        '  - Data ownership and stewardship',
        '  - Profile update cadence',
        '  - Quality assurance processes',
        '  - Privacy policies',
        '  - Access controls',
        'Define maintenance processes',
        'Create governance policies',
        'Save governance framework to output directory'
      ],
      outputFormat: 'JSON with framework (object), policies (array), processes (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        policies: { type: 'array' },
        processes: { type: 'array' },
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

// Task 7: Integration Design
export const integrationDesignTask = defineTask('integration-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design system integrations',
  agent: {
    name: 'integration-architect',
    prompt: {
      role: 'systems integration architect',
      task: 'Design integrations for expert directory',
      context: args,
      instructions: [
        'Design system integrations:',
        '  - HR/HRIS systems',
        '  - Identity management',
        '  - Collaboration platforms',
        '  - Learning management',
        '  - Communication tools',
        'Define integration patterns',
        'Plan data synchronization',
        'Save integration design to output directory'
      ],
      outputFormat: 'JSON with integrations (array), apiDesign (object), syncStrategy (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['integrations', 'artifacts'],
      properties: {
        integrations: { type: 'array' },
        apiDesign: { type: 'object' },
        syncStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'integration', 'design']
}));

// Task 8: UX Design
export const uxDesignTask = defineTask('ux-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design user experience',
  agent: {
    name: 'ux-designer',
    prompt: {
      role: 'expert directory UX designer',
      task: 'Design user experience for directory',
      context: args,
      instructions: [
        'Design user experience:',
        '  - Profile viewing experience',
        '  - Search and browse flows',
        '  - Profile creation/editing',
        '  - Expert contact workflow',
        '  - Mobile experience',
        'Create wireframes and mockups',
        'Define interaction patterns',
        'Save UX design to output directory'
      ],
      outputFormat: 'JSON with design (object), wireframes (array), userFlows (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        wireframes: { type: 'array' },
        userFlows: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'ux', 'design']
}));

// Task 9: Quality Assessment
export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess design quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'directory design quality assessor',
      task: 'Evaluate quality of directory design',
      context: args,
      instructions: [
        'Assess design quality:',
        '  - Requirements coverage',
        '  - Usability and findability',
        '  - Scalability',
        '  - Governance adequacy',
        '  - Integration feasibility',
        'Calculate overall quality score',
        'Identify gaps and risks',
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
        'Present directory design to stakeholders',
        'Review taxonomy and schema',
        'Present search capabilities',
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
