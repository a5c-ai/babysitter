/**
 * @process domains/business/knowledge-management/taxonomy-metadata-governance
 * @description Establish taxonomy governance processes for maintaining classification systems, controlled vocabularies, and metadata standards
 * @specialization Knowledge Management
 * @category Knowledge Governance and Strategy
 * @inputs { organizationName: string, existingTaxonomy: object, contentDomains: array, stakeholders: array, governanceRequirements: object, outputDir: string }
 * @outputs { success: boolean, taxonomyGovernance: object, metadataStandards: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = '',
    existingTaxonomy = {},
    contentDomains = [],
    stakeholders = [],
    governanceRequirements = {},
    metadataScope = ['content', 'products', 'users', 'processes'],
    taxonomyTypes = ['subject', 'product', 'audience', 'content-type'],
    qualityObjectives = {
      consistency: 90,
      coverage: 85,
      accuracy: 95
    },
    integrationSystems = [],
    outputDir = 'taxonomy-governance-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Taxonomy and Metadata Governance Process');

  // ============================================================================
  // PHASE 1: CURRENT STATE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing current taxonomy and metadata state');
  const currentStateAssessment = await ctx.task(currentStateAssessmentTask, {
    organizationName,
    existingTaxonomy,
    contentDomains,
    metadataScope,
    outputDir
  });

  artifacts.push(...currentStateAssessment.artifacts);

  // Breakpoint: Review current state assessment
  await ctx.breakpoint({
    question: `Current state assessment complete. Maturity level: ${currentStateAssessment.maturityLevel}. Found ${currentStateAssessment.issues.length} issues. Review assessment?`,
    title: 'Current State Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        maturityLevel: currentStateAssessment.maturityLevel,
        taxonomyCount: currentStateAssessment.taxonomyCount,
        metadataFieldsCount: currentStateAssessment.metadataFieldsCount,
        issuesFound: currentStateAssessment.issues.length
      }
    }
  });

  // ============================================================================
  // PHASE 2: GOVERNANCE FRAMEWORK DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing taxonomy governance framework');
  const governanceFramework = await ctx.task(governanceFrameworkTask, {
    organizationName,
    currentStateAssessment,
    governanceRequirements,
    stakeholders,
    outputDir
  });

  artifacts.push(...governanceFramework.artifacts);

  // ============================================================================
  // PHASE 3: ROLES AND RESPONSIBILITIES
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining roles and responsibilities');
  const rolesAndResponsibilities = await ctx.task(rolesAndResponsibilitiesTask, {
    organizationName,
    stakeholders,
    governanceFramework,
    taxonomyTypes,
    outputDir
  });

  artifacts.push(...rolesAndResponsibilities.artifacts);

  // ============================================================================
  // PHASE 4: TAXONOMY STANDARDS DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing taxonomy standards and guidelines');
  const taxonomyStandards = await ctx.task(taxonomyStandardsTask, {
    organizationName,
    taxonomyTypes,
    existingTaxonomy,
    contentDomains,
    qualityObjectives,
    outputDir
  });

  artifacts.push(...taxonomyStandards.artifacts);

  // ============================================================================
  // PHASE 5: METADATA STANDARDS DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing metadata standards and schema');
  const metadataStandards = await ctx.task(metadataStandardsTask, {
    organizationName,
    metadataScope,
    existingTaxonomy,
    integrationSystems,
    qualityObjectives,
    outputDir
  });

  artifacts.push(...metadataStandards.artifacts);

  // Breakpoint: Review standards
  await ctx.breakpoint({
    question: `Standards developed: ${taxonomyStandards.standardCount} taxonomy standards, ${metadataStandards.schemaCount} metadata schemas. Review standards?`,
    title: 'Standards Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        taxonomyStandards: taxonomyStandards.standardCount,
        metadataSchemas: metadataStandards.schemaCount,
        controlledVocabularies: taxonomyStandards.vocabularyCount
      }
    }
  });

  // ============================================================================
  // PHASE 6: CHANGE MANAGEMENT PROCESS
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing change management process');
  const changeManagement = await ctx.task(changeManagementTask, {
    organizationName,
    governanceFramework,
    rolesAndResponsibilities,
    taxonomyTypes,
    outputDir
  });

  artifacts.push(...changeManagement.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY ASSURANCE PROCESS
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing quality assurance process');
  const qualityAssurance = await ctx.task(qualityAssuranceTask, {
    organizationName,
    taxonomyStandards,
    metadataStandards,
    qualityObjectives,
    outputDir
  });

  artifacts.push(...qualityAssurance.artifacts);

  // ============================================================================
  // PHASE 8: MAINTENANCE PROCEDURES
  // ============================================================================

  ctx.log('info', 'Phase 8: Developing maintenance procedures');
  const maintenanceProcedures = await ctx.task(maintenanceProceduresTask, {
    organizationName,
    taxonomyTypes,
    metadataScope,
    governanceFramework,
    outputDir
  });

  artifacts.push(...maintenanceProcedures.artifacts);

  // ============================================================================
  // PHASE 9: TRAINING AND COMMUNICATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Developing training and communication plan');
  const trainingPlan = await ctx.task(trainingPlanTask, {
    organizationName,
    rolesAndResponsibilities,
    taxonomyStandards,
    metadataStandards,
    stakeholders,
    outputDir
  });

  artifacts.push(...trainingPlan.artifacts);

  // ============================================================================
  // PHASE 10: TOOLS AND TECHNOLOGY
  // ============================================================================

  ctx.log('info', 'Phase 10: Planning tools and technology requirements');
  const toolsAndTechnology = await ctx.task(toolsAndTechnologyTask, {
    organizationName,
    taxonomyTypes,
    metadataScope,
    integrationSystems,
    governanceFramework,
    outputDir
  });

  artifacts.push(...toolsAndTechnology.artifacts);

  // ============================================================================
  // PHASE 11: METRICS AND REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 11: Designing metrics and reporting framework');
  const metricsFramework = await ctx.task(metricsFrameworkTask, {
    organizationName,
    qualityObjectives,
    governanceFramework,
    outputDir
  });

  artifacts.push(...metricsFramework.artifacts);

  // ============================================================================
  // PHASE 12: GOVERNANCE DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Creating comprehensive governance documentation');
  const governanceDocumentation = await ctx.task(governanceDocumentationTask, {
    organizationName,
    governanceFramework,
    rolesAndResponsibilities,
    taxonomyStandards,
    metadataStandards,
    changeManagement,
    qualityAssurance,
    maintenanceProcedures,
    outputDir
  });

  artifacts.push(...governanceDocumentation.artifacts);

  // ============================================================================
  // PHASE 13: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 13: Assessing governance design quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    organizationName,
    governanceFramework,
    taxonomyStandards,
    metadataStandards,
    changeManagement,
    qualityAssurance,
    qualityObjectives,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const qualityMet = qualityAssessment.overallScore >= 80;

  // Breakpoint: Review quality assessment
  await ctx.breakpoint({
    question: `Governance quality score: ${qualityAssessment.overallScore}/100. ${qualityMet ? 'Quality standards met!' : 'May need improvements.'} Review results?`,
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
        frameworkScore: qualityAssessment.componentScores.framework,
        standardsScore: qualityAssessment.componentScores.standards,
        issues: qualityAssessment.issues.length
      }
    }
  });

  // ============================================================================
  // PHASE 14: IMPLEMENTATION ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 14: Creating implementation roadmap');
  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    organizationName,
    governanceFramework,
    taxonomyStandards,
    metadataStandards,
    toolsAndTechnology,
    trainingPlan,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);

  // ============================================================================
  // PHASE 15: STAKEHOLDER REVIEW (IF REQUIRED)
  // ============================================================================

  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 15: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, {
      organizationName,
      governanceFramework,
      taxonomyStandards,
      metadataStandards,
      qualityScore: qualityAssessment.overallScore,
      implementationRoadmap,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Final approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Proceed with implementation?`,
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
    organizationName,
    taxonomyGovernance: {
      framework: governanceFramework.framework,
      roles: rolesAndResponsibilities.roles,
      changeProcess: changeManagement.process,
      qualityProcess: qualityAssurance.process
    },
    metadataStandards: {
      schemas: metadataStandards.schemas,
      standards: metadataStandards.standards,
      guidelines: metadataStandards.guidelines
    },
    taxonomyStandards: {
      standards: taxonomyStandards.standards,
      vocabularies: taxonomyStandards.vocabularies,
      guidelines: taxonomyStandards.guidelines
    },
    qualityScore: qualityAssessment.overallScore,
    statistics: {
      taxonomyStandardsCount: taxonomyStandards.standardCount,
      metadataSchemasCount: metadataStandards.schemaCount,
      rolesDefinedCount: rolesAndResponsibilities.roles.length,
      proceduresDocumented: maintenanceProcedures.procedureCount,
      metricsDefinedCount: metricsFramework.metrics.length
    },
    tools: {
      recommended: toolsAndTechnology.recommendedTools,
      integrations: toolsAndTechnology.integrations
    },
    training: {
      programs: trainingPlan.programs,
      materials: trainingPlan.materials
    },
    implementation: {
      phases: implementationRoadmap.phases,
      timeline: implementationRoadmap.timeline
    },
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/business/knowledge-management/taxonomy-metadata-governance',
      timestamp: startTime,
      outputDir,
      taxonomyTypes
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Current State Assessment
export const currentStateAssessmentTask = defineTask('current-state-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess current taxonomy and metadata state',
  agent: {
    name: 'taxonomy-analyst',
    prompt: {
      role: 'taxonomy and metadata analyst',
      task: 'Assess current state of taxonomy and metadata management',
      context: args,
      instructions: [
        'Inventory existing taxonomies:',
        '  - Subject/topic taxonomies',
        '  - Product/service taxonomies',
        '  - Audience/user taxonomies',
        '  - Content type taxonomies',
        '  - Geographic taxonomies',
        'Assess taxonomy health:',
        '  - Completeness and coverage',
        '  - Consistency and standardization',
        '  - Currency and maintenance',
        '  - Usage and adoption',
        'Inventory metadata schemas:',
        '  - Content metadata',
        '  - Product metadata',
        '  - User metadata',
        '  - Process metadata',
        'Assess metadata quality:',
        '  - Completeness rates',
        '  - Accuracy levels',
        '  - Consistency across systems',
        'Identify governance gaps:',
        '  - Missing policies',
        '  - Unclear ownership',
        '  - Process deficiencies',
        'Determine maturity level',
        'Save assessment to output directory'
      ],
      outputFormat: 'JSON with maturityLevel (string), taxonomyCount (number), metadataFieldsCount (number), issues (array), healthMetrics (object), gaps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['maturityLevel', 'taxonomyCount', 'metadataFieldsCount', 'issues', 'artifacts'],
      properties: {
        maturityLevel: { type: 'string', enum: ['initial', 'developing', 'defined', 'managed', 'optimized'] },
        taxonomyCount: { type: 'number' },
        metadataFieldsCount: { type: 'number' },
        taxonomyInventory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              termCount: { type: 'number' },
              health: { type: 'string', enum: ['healthy', 'needs-attention', 'critical'] },
              lastUpdated: { type: 'string' }
            }
          }
        },
        metadataInventory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              schema: { type: 'string' },
              fieldCount: { type: 'number' },
              completenessRate: { type: 'number' },
              systems: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              area: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        healthMetrics: {
          type: 'object',
          properties: {
            consistencyScore: { type: 'number' },
            coverageScore: { type: 'number' },
            adoptionScore: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'taxonomy', 'assessment']
}));

// Task 2: Governance Framework Design
export const governanceFrameworkTask = defineTask('governance-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design taxonomy governance framework',
  agent: {
    name: 'governance-architect',
    prompt: {
      role: 'information governance architect',
      task: 'Design comprehensive taxonomy governance framework',
      context: args,
      instructions: [
        'Design governance structure:',
        '  - Governance council/committee',
        '  - Working groups',
        '  - Decision-making authority',
        '  - Escalation paths',
        'Define governance scope:',
        '  - Taxonomies covered',
        '  - Metadata schemas covered',
        '  - Systems and applications',
        '  - Content types',
        'Establish governance principles:',
        '  - Enterprise-wide consistency',
        '  - Business alignment',
        '  - User-centricity',
        '  - Maintainability',
        '  - Interoperability',
        'Define governance policies:',
        '  - Taxonomy creation policy',
        '  - Term addition/modification policy',
        '  - Deprecation and archival policy',
        '  - Exception handling policy',
        'Design governance meetings and cadence',
        'Save governance framework to output directory'
      ],
      outputFormat: 'JSON with framework (object), structure (object), policies (array), principles (array), meetings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'structure', 'policies', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            scope: { type: 'array', items: { type: 'string' } },
            objectives: { type: 'array', items: { type: 'string' } }
          }
        },
        structure: {
          type: 'object',
          properties: {
            governanceBody: { type: 'string' },
            workingGroups: { type: 'array' },
            decisionAuthority: { type: 'object' },
            escalationPath: { type: 'array', items: { type: 'string' } }
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
              enforcementLevel: { type: 'string', enum: ['mandatory', 'recommended', 'optional'] }
            }
          }
        },
        principles: { type: 'array', items: { type: 'string' } },
        meetings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              frequency: { type: 'string' },
              participants: { type: 'array', items: { type: 'string' } },
              purpose: { type: 'string' }
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
  labels: ['agent', 'taxonomy', 'governance-framework']
}));

// Task 3: Roles and Responsibilities
export const rolesAndResponsibilitiesTask = defineTask('roles-responsibilities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define roles and responsibilities',
  agent: {
    name: 'raci-designer',
    prompt: {
      role: 'organizational design specialist',
      task: 'Define taxonomy governance roles and responsibilities',
      context: args,
      instructions: [
        'Define key governance roles:',
        '  - Taxonomy Owner (strategic oversight)',
        '  - Taxonomy Manager (day-to-day management)',
        '  - Taxonomy Steward (domain-specific care)',
        '  - Metadata Administrator (technical implementation)',
        '  - Content Author (taxonomy user)',
        'Define responsibilities for each role:',
        '  - Strategic responsibilities',
        '  - Operational responsibilities',
        '  - Quality responsibilities',
        '  - Communication responsibilities',
        'Create RACI matrix for key activities:',
        '  - Term creation/modification',
        '  - Taxonomy structure changes',
        '  - Quality reviews',
        '  - Training delivery',
        '  - Tool administration',
        'Define qualification requirements',
        'Plan succession and backup coverage',
        'Save roles and responsibilities to output directory'
      ],
      outputFormat: 'JSON with roles (array), raciMatrix (object), qualifications (object), successionPlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roles', 'raciMatrix', 'artifacts'],
      properties: {
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              description: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              authorities: { type: 'array', items: { type: 'string' } },
              timeCommitment: { type: 'string' },
              reportingTo: { type: 'string' }
            }
          }
        },
        raciMatrix: {
          type: 'object',
          properties: {
            activities: { type: 'array' },
            assignments: { type: 'object' }
          }
        },
        qualifications: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        successionPlan: {
          type: 'object',
          properties: {
            backupRoles: { type: 'object' },
            transitionProcess: { type: 'string' }
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
  labels: ['agent', 'taxonomy', 'roles']
}));

// Task 4: Taxonomy Standards
export const taxonomyStandardsTask = defineTask('taxonomy-standards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop taxonomy standards and guidelines',
  agent: {
    name: 'taxonomy-standards-author',
    prompt: {
      role: 'taxonomy standards specialist',
      task: 'Develop comprehensive taxonomy standards and guidelines',
      context: args,
      instructions: [
        'Develop taxonomy naming standards:',
        '  - Term naming conventions',
        '  - Capitalization rules',
        '  - Use of punctuation',
        '  - Singular vs plural forms',
        '  - Abbreviation guidelines',
        'Develop taxonomy structure standards:',
        '  - Hierarchy depth guidelines',
        '  - Sibling term relationships',
        '  - Polyhierarchy rules',
        '  - Facet organization',
        'Develop controlled vocabulary standards:',
        '  - Preferred term selection',
        '  - Synonym handling',
        '  - Related term guidelines',
        '  - Scope notes requirements',
        'Create taxonomy modeling guidelines:',
        '  - Concept granularity',
        '  - Term disambiguation',
        '  - Cross-taxonomy mapping',
        'Develop documentation requirements',
        'Count and inventory standards',
        'Save taxonomy standards to output directory'
      ],
      outputFormat: 'JSON with standards (array), standardCount (number), vocabularies (array), vocabularyCount (number), guidelines (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['standards', 'standardCount', 'vocabularies', 'artifacts'],
      properties: {
        standards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              standard: { type: 'string' },
              description: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              exceptions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        standardCount: { type: 'number' },
        vocabularies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              termCount: { type: 'number' },
              structure: { type: 'string' }
            }
          }
        },
        vocabularyCount: { type: 'number' },
        guidelines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              guideline: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        namingConventions: { type: 'object' },
        structureRules: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'taxonomy', 'standards']
}));

// Task 5: Metadata Standards
export const metadataStandardsTask = defineTask('metadata-standards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop metadata standards and schema',
  agent: {
    name: 'metadata-architect',
    prompt: {
      role: 'metadata architect and standards specialist',
      task: 'Develop comprehensive metadata standards and schemas',
      context: args,
      instructions: [
        'Define metadata schema for each scope:',
        '  - Content metadata (title, description, dates, authors)',
        '  - Product metadata (features, specifications, categories)',
        '  - User metadata (roles, preferences, access)',
        '  - Process metadata (workflow, status, history)',
        'Define metadata field standards:',
        '  - Field naming conventions',
        '  - Data type specifications',
        '  - Cardinality rules',
        '  - Required vs optional fields',
        '  - Default values',
        'Create metadata value standards:',
        '  - Date/time formats',
        '  - Controlled value lists',
        '  - Text formatting rules',
        '  - Identifier formats',
        'Define metadata interoperability:',
        '  - Cross-system mapping',
        '  - Standard vocabularies (Dublin Core, Schema.org)',
        '  - API specifications',
        'Document validation rules',
        'Save metadata standards to output directory'
      ],
      outputFormat: 'JSON with schemas (array), schemaCount (number), standards (array), guidelines (array), interoperability (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schemas', 'schemaCount', 'standards', 'artifacts'],
      properties: {
        schemas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              scope: { type: 'string' },
              fields: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    required: { type: 'boolean' },
                    description: { type: 'string' },
                    validation: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        schemaCount: { type: 'number' },
        standards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              standard: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        guidelines: { type: 'array', items: { type: 'string' } },
        interoperability: {
          type: 'object',
          properties: {
            standardVocabularies: { type: 'array', items: { type: 'string' } },
            mappings: { type: 'array' }
          }
        },
        validationRules: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metadata', 'standards']
}));

// Task 6: Change Management Process
export const changeManagementTask = defineTask('change-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design change management process',
  agent: {
    name: 'change-process-designer',
    prompt: {
      role: 'change management specialist',
      task: 'Design taxonomy and metadata change management process',
      context: args,
      instructions: [
        'Design change request process:',
        '  - Request submission (who, how)',
        '  - Request types (add, modify, deprecate, delete)',
        '  - Required information',
        '  - Request tracking',
        'Design review and approval workflow:',
        '  - Impact assessment',
        '  - Stakeholder consultation',
        '  - Approval authority by change type',
        '  - Review turnaround times',
        'Design implementation process:',
        '  - Change scheduling',
        '  - Communication requirements',
        '  - System updates',
        '  - Documentation updates',
        'Design deprecation and retirement process:',
        '  - Deprecation criteria',
        '  - Migration approach',
        '  - Transition period',
        '  - Archive requirements',
        'Create change request templates',
        'Save change management process to output directory'
      ],
      outputFormat: 'JSON with process (object), workflows (array), templates (array), approvalMatrix (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['process', 'workflows', 'artifacts'],
      properties: {
        process: {
          type: 'object',
          properties: {
            stages: { type: 'array', items: { type: 'string' } },
            changeTypes: { type: 'array', items: { type: 'string' } },
            turnaroundTimes: { type: 'object' }
          }
        },
        workflows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              changeType: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              approvers: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' }
            }
          }
        },
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              fields: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        approvalMatrix: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        communicationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'taxonomy', 'change-management']
}));

// Task 7: Quality Assurance Process
export const qualityAssuranceTask = defineTask('quality-assurance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design quality assurance process',
  agent: {
    name: 'quality-process-designer',
    prompt: {
      role: 'quality assurance specialist',
      task: 'Design taxonomy and metadata quality assurance process',
      context: args,
      instructions: [
        'Define quality dimensions:',
        '  - Accuracy (correct classification)',
        '  - Consistency (uniform application)',
        '  - Completeness (required fields populated)',
        '  - Currency (up-to-date terms)',
        '  - Compliance (standards adherence)',
        'Design quality review process:',
        '  - Review frequency',
        '  - Sampling methodology',
        '  - Review criteria',
        '  - Scoring rubrics',
        'Create quality checklists:',
        '  - Taxonomy term checklist',
        '  - Metadata record checklist',
        '  - Content tagging checklist',
        'Design quality monitoring:',
        '  - Automated quality checks',
        '  - Manual audit schedule',
        '  - Quality dashboards',
        '  - Alert thresholds',
        'Define remediation process:',
        '  - Issue identification',
        '  - Root cause analysis',
        '  - Corrective actions',
        '  - Prevention measures',
        'Save quality assurance process to output directory'
      ],
      outputFormat: 'JSON with process (object), dimensions (array), checklists (array), monitoring (object), remediation (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['process', 'dimensions', 'checklists', 'artifacts'],
      properties: {
        process: {
          type: 'object',
          properties: {
            reviewFrequency: { type: 'string' },
            samplingMethod: { type: 'string' },
            scoringRubric: { type: 'object' }
          }
        },
        dimensions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension: { type: 'string' },
              definition: { type: 'string' },
              target: { type: 'number' },
              measurementMethod: { type: 'string' }
            }
          }
        },
        checklists: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              items: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        monitoring: {
          type: 'object',
          properties: {
            automatedChecks: { type: 'array', items: { type: 'string' } },
            manualAudits: { type: 'array' },
            dashboards: { type: 'array', items: { type: 'string' } },
            alertThresholds: { type: 'object' }
          }
        },
        remediation: {
          type: 'object',
          properties: {
            process: { type: 'array', items: { type: 'string' } },
            escalationCriteria: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'taxonomy', 'quality-assurance']
}));

// Task 8: Maintenance Procedures
export const maintenanceProceduresTask = defineTask('maintenance-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop maintenance procedures',
  agent: {
    name: 'maintenance-procedures-author',
    prompt: {
      role: 'procedures documentation specialist',
      task: 'Develop detailed maintenance procedures for taxonomy and metadata',
      context: args,
      instructions: [
        'Develop routine maintenance procedures:',
        '  - Daily/weekly tasks',
        '  - Monthly reviews',
        '  - Quarterly audits',
        '  - Annual comprehensive review',
        'Create term management procedures:',
        '  - Adding new terms',
        '  - Modifying existing terms',
        '  - Merging terms',
        '  - Deprecating terms',
        '  - Deleting terms',
        'Create metadata management procedures:',
        '  - Schema updates',
        '  - Field additions/modifications',
        '  - Data migration',
        '  - Bulk updates',
        'Develop system administration procedures:',
        '  - User access management',
        '  - Backup and recovery',
        '  - System integration updates',
        '  - Performance monitoring',
        'Create troubleshooting guides',
        'Count procedures documented',
        'Save maintenance procedures to output directory'
      ],
      outputFormat: 'JSON with procedures (array), procedureCount (number), schedules (object), troubleshootingGuides (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['procedures', 'procedureCount', 'schedules', 'artifacts'],
      properties: {
        procedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              purpose: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string' },
              responsible: { type: 'string' }
            }
          }
        },
        procedureCount: { type: 'number' },
        schedules: {
          type: 'object',
          properties: {
            daily: { type: 'array', items: { type: 'string' } },
            weekly: { type: 'array', items: { type: 'string' } },
            monthly: { type: 'array', items: { type: 'string' } },
            quarterly: { type: 'array', items: { type: 'string' } },
            annual: { type: 'array', items: { type: 'string' } }
          }
        },
        troubleshootingGuides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              symptoms: { type: 'array', items: { type: 'string' } },
              resolution: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'taxonomy', 'maintenance']
}));

// Task 9: Training Plan
export const trainingPlanTask = defineTask('training-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop training and communication plan',
  agent: {
    name: 'training-designer',
    prompt: {
      role: 'training and development specialist',
      task: 'Develop training and communication plan for taxonomy governance',
      context: args,
      instructions: [
        'Design training programs by role:',
        '  - Governance leaders training',
        '  - Taxonomy managers training',
        '  - Taxonomy stewards training',
        '  - Content authors training',
        '  - System administrators training',
        'Develop training content:',
        '  - Taxonomy fundamentals',
        '  - Standards and guidelines',
        '  - Tools and systems',
        '  - Processes and workflows',
        '  - Quality requirements',
        'Create training materials:',
        '  - Instructor guides',
        '  - Participant workbooks',
        '  - Quick reference cards',
        '  - Video tutorials',
        '  - Knowledge assessments',
        'Design communication plan:',
        '  - Launch communications',
        '  - Ongoing updates',
        '  - Change notifications',
        '  - Success stories',
        'Plan training delivery schedule',
        'Save training plan to output directory'
      ],
      outputFormat: 'JSON with programs (array), materials (array), communicationPlan (object), schedule (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['programs', 'materials', 'communicationPlan', 'artifacts'],
      properties: {
        programs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              targetAudience: { type: 'string' },
              duration: { type: 'string' },
              format: { type: 'string' },
              topics: { type: 'array', items: { type: 'string' } },
              outcomes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        materials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              audience: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        communicationPlan: {
          type: 'object',
          properties: {
            channels: { type: 'array', items: { type: 'string' } },
            messages: { type: 'array' },
            schedule: { type: 'array' }
          }
        },
        schedule: {
          type: 'object',
          properties: {
            initialTraining: { type: 'array' },
            ongoingTraining: { type: 'string' }
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
  labels: ['agent', 'taxonomy', 'training']
}));

// Task 10: Tools and Technology
export const toolsAndTechnologyTask = defineTask('tools-technology', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan tools and technology requirements',
  agent: {
    name: 'tools-planner',
    prompt: {
      role: 'taxonomy technology specialist',
      task: 'Plan tools and technology for taxonomy governance',
      context: args,
      instructions: [
        'Assess tool requirements:',
        '  - Taxonomy management system',
        '  - Metadata management tools',
        '  - Workflow management',
        '  - Quality monitoring',
        '  - Reporting and analytics',
        'Evaluate tool options:',
        '  - Enterprise taxonomy tools (PoolParty, TopBraid)',
        '  - DAM systems with taxonomy',
        '  - Custom solutions',
        '  - Open source options',
        'Define integration requirements:',
        '  - CMS integration',
        '  - Search integration',
        '  - DAM integration',
        '  - Analytics integration',
        'Plan technology implementation:',
        '  - Build vs buy decision',
        '  - Vendor selection criteria',
        '  - Implementation approach',
        '  - Migration requirements',
        'Define technical standards',
        'Save tools and technology plan to output directory'
      ],
      outputFormat: 'JSON with recommendedTools (array), integrations (array), requirements (object), implementationPlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedTools', 'integrations', 'requirements', 'artifacts'],
      properties: {
        recommendedTools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              recommendation: { type: 'string' },
              options: { type: 'array', items: { type: 'string' } },
              rationale: { type: 'string' }
            }
          }
        },
        integrations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              integrationPoint: { type: 'string' },
              method: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        requirements: {
          type: 'object',
          properties: {
            functional: { type: 'array', items: { type: 'string' } },
            technical: { type: 'array', items: { type: 'string' } },
            security: { type: 'array', items: { type: 'string' } }
          }
        },
        implementationPlan: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            phases: { type: 'array' },
            timeline: { type: 'string' }
          }
        },
        technicalStandards: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'taxonomy', 'technology']
}));

// Task 11: Metrics Framework
export const metricsFrameworkTask = defineTask('metrics-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design metrics and reporting framework',
  agent: {
    name: 'metrics-designer',
    prompt: {
      role: 'governance metrics specialist',
      task: 'Design metrics and reporting framework for taxonomy governance',
      context: args,
      instructions: [
        'Define governance metrics:',
        '  - Adoption metrics (usage, compliance)',
        '  - Quality metrics (accuracy, consistency)',
        '  - Process metrics (turnaround, throughput)',
        '  - Impact metrics (findability, user satisfaction)',
        'Design KPIs and targets:',
        '  - Taxonomy usage rate',
        '  - Tagging consistency rate',
        '  - Metadata completeness rate',
        '  - Change request turnaround time',
        '  - Quality audit scores',
        'Create reporting structure:',
        '  - Executive dashboard',
        '  - Operational reports',
        '  - Compliance reports',
        '  - Trend analysis',
        'Define reporting cadence:',
        '  - Daily operational metrics',
        '  - Weekly summary',
        '  - Monthly governance report',
        '  - Quarterly review',
        'Plan metric collection and analysis',
        'Save metrics framework to output directory'
      ],
      outputFormat: 'JSON with metrics (array), kpis (array), reports (array), dashboards (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'kpis', 'reports', 'artifacts'],
      properties: {
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              formula: { type: 'string' },
              dataSource: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              target: { type: 'string' },
              threshold: { type: 'object' },
              owner: { type: 'string' }
            }
          }
        },
        reports: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              audience: { type: 'string' },
              frequency: { type: 'string' },
              contents: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              metrics: { type: 'array', items: { type: 'string' } },
              audience: { type: 'string' }
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
  labels: ['agent', 'taxonomy', 'metrics']
}));

// Task 12: Governance Documentation
export const governanceDocumentationTask = defineTask('governance-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create comprehensive governance documentation',
  agent: {
    name: 'documentation-author',
    prompt: {
      role: 'governance documentation specialist',
      task: 'Create comprehensive governance documentation package',
      context: args,
      instructions: [
        'Create governance charter:',
        '  - Purpose and scope',
        '  - Governance structure',
        '  - Roles and responsibilities',
        '  - Decision-making authority',
        'Create policy documents:',
        '  - Taxonomy management policy',
        '  - Metadata standards policy',
        '  - Change management policy',
        '  - Quality assurance policy',
        'Create procedural documentation:',
        '  - Standard operating procedures',
        '  - Work instructions',
        '  - Checklists and templates',
        'Create reference materials:',
        '  - Standards quick reference',
        '  - Glossary of terms',
        '  - FAQ document',
        'Create training documentation:',
        '  - Training materials',
        '  - User guides',
        '  - Best practices guide',
        'Organize documentation library',
        'Save governance documentation to output directory'
      ],
      outputFormat: 'JSON with charter (string), policies (array), procedures (array), references (array), documentInventory (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['charter', 'policies', 'procedures', 'artifacts'],
      properties: {
        charter: { type: 'string' },
        policies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              owner: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        procedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        references: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        documentInventory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              document: { type: 'string' },
              type: { type: 'string' },
              status: { type: 'string' }
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
  labels: ['agent', 'taxonomy', 'documentation']
}));

// Task 13: Quality Assessment
export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess governance design quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'governance quality assessor',
      task: 'Evaluate the quality and completeness of the governance design',
      context: args,
      instructions: [
        'Evaluate governance framework (25%):',
        '  - Structure clarity',
        '  - Scope completeness',
        '  - Policy coverage',
        '  - Role definitions',
        'Evaluate standards quality (25%):',
        '  - Taxonomy standards completeness',
        '  - Metadata standards coverage',
        '  - Guideline clarity',
        '  - Example adequacy',
        'Evaluate process quality (25%):',
        '  - Change management completeness',
        '  - QA process thoroughness',
        '  - Maintenance procedure coverage',
        '  - Workflow clarity',
        'Evaluate implementation readiness (25%):',
        '  - Training adequacy',
        '  - Tool requirements clarity',
        '  - Documentation completeness',
        '  - Metric coverage',
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
            framework: { type: 'number' },
            standards: { type: 'number' },
            processes: { type: 'number' },
            implementation: { type: 'number' }
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
  labels: ['agent', 'taxonomy', 'quality-assessment']
}));

// Task 14: Implementation Roadmap
export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation roadmap',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'governance implementation specialist',
      task: 'Create implementation roadmap for taxonomy governance',
      context: args,
      instructions: [
        'Plan implementation phases:',
        '  - Phase 1: Foundation (framework, roles)',
        '  - Phase 2: Standards (taxonomy, metadata)',
        '  - Phase 3: Processes (change, QA)',
        '  - Phase 4: Tools and training',
        '  - Phase 5: Operationalization',
        'Define phase deliverables and milestones',
        'Identify dependencies and prerequisites',
        'Estimate effort and resources:',
        '  - People requirements',
        '  - Time estimates',
        '  - Budget considerations',
        'Identify risks and mitigations:',
        '  - Adoption risks',
        '  - Resource constraints',
        '  - Technical challenges',
        '  - Change resistance',
        'Plan stakeholder engagement',
        'Define success criteria for each phase',
        'Save implementation roadmap to output directory'
      ],
      outputFormat: 'JSON with phases (array), timeline (object), resources (object), risks (array), successCriteria (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'risks', 'artifacts'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'number' },
              name: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              milestones: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            totalDuration: { type: 'string' }
          }
        },
        resources: {
          type: 'object',
          properties: {
            roles: { type: 'array' },
            effort: { type: 'object' },
            budget: { type: 'object' }
          }
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              likelihood: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        successCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'taxonomy', 'implementation']
}));

// Task 15: Stakeholder Review
export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'project manager facilitating stakeholder review',
      task: 'Coordinate stakeholder review and approval of governance design',
      context: args,
      instructions: [
        'Present governance design to stakeholders:',
        '  - Governance framework',
        '  - Taxonomy and metadata standards',
        '  - Processes and procedures',
        '  - Implementation roadmap',
        '  - Resource requirements',
        'Gather feedback from key stakeholders:',
        '  - Executive sponsors',
        '  - Domain owners',
        '  - IT leadership',
        '  - Content teams',
        '  - End users',
        'Validate alignment with objectives',
        'Review resource commitments',
        'Identify concerns and objections',
        'Determine if revisions needed',
        'Document approval or changes',
        'Create action plan',
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
  labels: ['agent', 'taxonomy', 'stakeholder-review', 'approval']
}));
