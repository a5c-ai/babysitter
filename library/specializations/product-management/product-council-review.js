/**
 * @process product-management/product-council-review
 * @description Product Council and Review Process with council charter definition, membership structure, review cadence establishment, decision criteria framework, escalation process, and comprehensive documentation
 * @inputs { organizationName: string, productLines: array, councilPurpose: string, outputDir: string, reviewFrequency: string, decisionScope: array, stakeholders: array, existingGovernance: object }
 * @outputs { success: boolean, councilCharter: object, membershipStructure: object, reviewCadence: object, decisionCriteria: array, escalationProcess: object, documentation: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = '',
    productLines = [],
    councilPurpose = '',
    outputDir = 'product-council-output',
    reviewFrequency = 'monthly', // 'weekly', 'biweekly', 'monthly', 'quarterly'
    decisionScope = [],
    stakeholders = [],
    existingGovernance = {},
    includeMetrics = true,
    requireCharter = true,
    escalationLevels = 3,
    councilSize = 'medium', // 'small' (5-7), 'medium' (8-12), 'large' (13-20)
    decisionModel = 'consensus-driven' // 'consensus-driven', 'consultative', 'democratic'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Product Council and Review Process for: ${organizationName}`);
  ctx.log('info', `Product lines: ${productLines.length}, Review frequency: ${reviewFrequency}, Decision model: ${decisionModel}`);

  // ============================================================================
  // PHASE 1: COUNCIL CHARTER DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining council charter and governance framework');

  const charterDefinition = await ctx.task(councilCharterDefinitionTask, {
    organizationName,
    productLines,
    councilPurpose,
    decisionScope,
    stakeholders,
    existingGovernance,
    councilSize,
    decisionModel,
    outputDir
  });

  artifacts.push(...charterDefinition.artifacts);

  const councilCharter = charterDefinition.charter;
  ctx.log('info', `Council charter defined with ${councilCharter.principles.length} guiding principles`);

  // ============================================================================
  // PHASE 2: MEMBERSHIP STRUCTURE AND ROLES
  // ============================================================================

  ctx.log('info', 'Phase 2: Establishing membership structure and role definitions');

  const membershipStructure = await ctx.task(membershipStructureTask, {
    organizationName,
    councilCharter,
    productLines,
    stakeholders,
    councilSize,
    decisionModel,
    outputDir
  });

  artifacts.push(...membershipStructure.artifacts);

  ctx.log('info', `Membership structure defined: ${membershipStructure.coreMembers.length} core members, ${membershipStructure.exOfficio.length} ex-officio members`);

  // Breakpoint: Review charter and membership
  await ctx.breakpoint({
    question: `Council charter and membership structure complete. ${membershipStructure.coreMembers.length} core members, ${councilCharter.principles.length} guiding principles. Review before proceeding?`,
    title: 'Charter and Membership Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        councilPurpose: councilCharter.purpose,
        coreMembersCount: membershipStructure.coreMembers.length,
        principlesCount: councilCharter.principles.length,
        decisionModel
      }
    }
  });

  // ============================================================================
  // PHASE 3: REVIEW CADENCE AND MEETING STRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 3: Establishing review cadence and meeting structure');

  const reviewCadenceDefinition = await ctx.task(reviewCadenceTask, {
    organizationName,
    councilCharter,
    membershipStructure,
    reviewFrequency,
    productLines,
    outputDir
  });

  artifacts.push(...reviewCadenceDefinition.artifacts);

  const reviewCadence = reviewCadenceDefinition.cadence;
  ctx.log('info', `Review cadence established: ${reviewFrequency} meetings with ${reviewCadence.meetingTypes.length} meeting types`);

  // ============================================================================
  // PHASE 4: DECISION CRITERIA FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining decision criteria and evaluation framework');

  const decisionCriteriaDefinition = await ctx.task(decisionCriteriaTask, {
    organizationName,
    councilCharter,
    decisionScope,
    decisionModel,
    productLines,
    existingGovernance,
    outputDir
  });

  artifacts.push(...decisionCriteriaDefinition.artifacts);

  const decisionCriteria = decisionCriteriaDefinition.criteria;
  ctx.log('info', `Decision criteria framework defined with ${decisionCriteria.length} evaluation dimensions`);

  // ============================================================================
  // PHASE 5: REVIEW PROCESS AND WORKFLOWS
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing review process and workflows');

  const reviewProcessDesign = await ctx.task(reviewProcessDesignTask, {
    organizationName,
    councilCharter,
    membershipStructure,
    reviewCadence,
    decisionCriteria,
    decisionModel,
    outputDir
  });

  artifacts.push(...reviewProcessDesign.artifacts);

  ctx.log('info', `Review process designed with ${reviewProcessDesign.workflows.length} workflows`);

  // Breakpoint: Review process and criteria
  await ctx.breakpoint({
    question: `Review process and decision criteria complete. ${decisionCriteria.length} decision criteria, ${reviewProcessDesign.workflows.length} workflows defined. Review before escalation process?`,
    title: 'Review Process and Criteria Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        reviewFrequency,
        meetingTypesCount: reviewCadence.meetingTypes.length,
        decisionCriteriaCount: decisionCriteria.length,
        workflowsCount: reviewProcessDesign.workflows.length
      }
    }
  });

  // ============================================================================
  // PHASE 6: ESCALATION PROCESS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 6: Defining escalation process and conflict resolution');

  const escalationProcess = await ctx.task(escalationProcessTask, {
    organizationName,
    councilCharter,
    membershipStructure,
    decisionCriteria,
    escalationLevels,
    decisionModel,
    existingGovernance,
    outputDir
  });

  artifacts.push(...escalationProcess.artifacts);

  ctx.log('info', `Escalation process defined with ${escalationProcess.levels.length} escalation levels`);

  // ============================================================================
  // PHASE 7: DOCUMENTATION TEMPLATES AND STANDARDS
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating documentation templates and standards');

  const documentationFramework = await ctx.task(documentationFrameworkTask, {
    organizationName,
    councilCharter,
    membershipStructure,
    reviewCadence,
    decisionCriteria,
    reviewProcessDesign,
    escalationProcess,
    outputDir
  });

  artifacts.push(...documentationFramework.artifacts);

  ctx.log('info', `Documentation framework created with ${documentationFramework.templates.length} templates`);

  // ============================================================================
  // PHASE 8: METRICS AND REPORTING FRAMEWORK (IF ENABLED)
  // ============================================================================

  let metricsFramework = null;
  if (includeMetrics) {
    ctx.log('info', 'Phase 8: Establishing metrics and reporting framework');

    metricsFramework = await ctx.task(metricsReportingTask, {
      organizationName,
      councilCharter,
      reviewCadence,
      decisionCriteria,
      productLines,
      outputDir
    });

    artifacts.push(...metricsFramework.artifacts);

    ctx.log('info', `Metrics framework established with ${metricsFramework.kpis.length} KPIs`);
  }

  // ============================================================================
  // PHASE 9: ONBOARDING AND TRAINING MATERIALS
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating onboarding and training materials');

  const onboardingMaterials = await ctx.task(onboardingMaterialsTask, {
    organizationName,
    councilCharter,
    membershipStructure,
    reviewCadence,
    reviewProcessDesign,
    escalationProcess,
    documentationFramework,
    outputDir
  });

  artifacts.push(...onboardingMaterials.artifacts);

  // ============================================================================
  // PHASE 10: GOVERNANCE VALIDATION AND AUDIT
  // ============================================================================

  ctx.log('info', 'Phase 10: Validating governance framework completeness');

  const governanceValidation = await ctx.task(governanceValidationTask, {
    organizationName,
    councilCharter,
    membershipStructure,
    reviewCadence,
    decisionCriteria,
    escalationProcess,
    documentationFramework,
    metricsFramework,
    existingGovernance,
    outputDir
  });

  artifacts.push(...governanceValidation.artifacts);

  const validationScore = governanceValidation.validationScore;
  const validationPassed = validationScore >= 85;

  // Breakpoint: Governance validation results
  await ctx.breakpoint({
    question: `Governance validation complete. Validation score: ${validationScore}/100. ${validationPassed ? 'Framework ready for implementation!' : 'Some gaps identified.'} Review validation results?`,
    title: 'Governance Validation Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        validationScore,
        validationPassed,
        completenessChecks: governanceValidation.completenessChecks,
        gapsIdentified: governanceValidation.gaps.length,
        recommendations: governanceValidation.recommendations.length
      }
    }
  });

  // ============================================================================
  // PHASE 11: IMPLEMENTATION ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating implementation roadmap');

  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    organizationName,
    councilCharter,
    membershipStructure,
    reviewCadence,
    governanceValidation,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);

  // ============================================================================
  // PHASE 12: FINAL PACKAGE ASSEMBLY
  // ============================================================================

  ctx.log('info', 'Phase 12: Assembling final product council governance package');

  const finalPackage = await ctx.task(packageAssemblyTask, {
    organizationName,
    councilCharter,
    membershipStructure,
    reviewCadence,
    decisionCriteria,
    reviewProcessDesign,
    escalationProcess,
    documentationFramework,
    metricsFramework,
    onboardingMaterials,
    governanceValidation,
    implementationRoadmap,
    outputDir
  });

  artifacts.push(...finalPackage.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    councilCharter: {
      purpose: councilCharter.purpose,
      scope: councilCharter.scope,
      principles: councilCharter.principles.length,
      charter: councilCharter
    },
    membershipStructure: {
      coreMembers: membershipStructure.coreMembers.length,
      exOfficio: membershipStructure.exOfficio.length,
      roles: membershipStructure.roles.length,
      structure: membershipStructure
    },
    reviewCadence: {
      frequency: reviewFrequency,
      meetingTypes: reviewCadence.meetingTypes.length,
      cadence: reviewCadence
    },
    decisionCriteria: {
      count: decisionCriteria.length,
      criteria: decisionCriteria,
      model: decisionModel
    },
    escalationProcess: {
      levels: escalationProcess.levels.length,
      process: escalationProcess
    },
    documentation: {
      templates: documentationFramework.templates.length,
      standards: documentationFramework.standards.length,
      framework: documentationFramework
    },
    metrics: metricsFramework ? {
      kpis: metricsFramework.kpis.length,
      framework: metricsFramework
    } : null,
    validation: {
      score: validationScore,
      passed: validationPassed,
      gaps: governanceValidation.gaps.length,
      validation: governanceValidation
    },
    implementation: {
      phases: implementationRoadmap.phases.length,
      timeline: implementationRoadmap.timeline,
      roadmap: implementationRoadmap
    },
    artifacts,
    duration,
    metadata: {
      processId: 'product-management/product-council-review',
      timestamp: startTime,
      outputDir,
      reviewFrequency,
      councilSize,
      decisionModel,
      includeMetrics
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Council Charter Definition
export const councilCharterDefinitionTask = defineTask('council-charter-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define council charter and governance framework',
  agent: {
    name: 'governance-architect',
    prompt: {
      role: 'product governance expert and organizational design specialist',
      task: 'Create comprehensive product council charter defining purpose, scope, authority, and operating principles',
      context: args,
      instructions: [
        'Define comprehensive council charter with sections:',
        '  1. Council Purpose and Mission',
        '     - Why the council exists',
        '     - Value it provides to the organization',
        '     - Strategic alignment with company goals',
        '     - Key stakeholders it serves',
        '  2. Council Scope and Authority',
        '     - Types of decisions the council makes',
        '     - What falls within council purview',
        '     - What falls outside council scope',
        '     - Authority boundaries and limitations',
        '     - Relationship to executive leadership',
        '  3. Guiding Principles',
        '     - Core values guiding council decisions',
        '     - Decision-making philosophy',
        '     - Transparency and accountability principles',
        '     - Customer-centricity commitments',
        '     - Innovation and risk tolerance',
        '     - Cross-functional collaboration principles',
        '  4. Council Objectives',
        '     - Strategic portfolio alignment',
        '     - Resource optimization across products',
        '     - Risk management and governance',
        '     - Innovation pipeline management',
        '     - Quality and consistency standards',
        '  5. Success Measures',
        '     - How council effectiveness will be measured',
        '     - Key performance indicators',
        '     - Review and improvement process',
        '  6. Charter Review and Amendment Process',
        '     - How often charter is reviewed',
        '     - Process for proposing amendments',
        '     - Approval requirements for changes',
        'Align charter with existing governance if provided',
        'Ensure clarity on decision authority and boundaries',
        'Make principles actionable and measurable',
        'Save charter document to output directory'
      ],
      outputFormat: 'JSON with charter (object with purpose, scope, authority, principles array, objectives array, successMeasures), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['charter', 'artifacts'],
      properties: {
        charter: {
          type: 'object',
          properties: {
            documentPath: { type: 'string' },
            purpose: { type: 'string' },
            mission: { type: 'string' },
            scope: {
              type: 'object',
              properties: {
                inScope: { type: 'array', items: { type: 'string' } },
                outOfScope: { type: 'array', items: { type: 'string' } },
                decisionTypes: { type: 'array', items: { type: 'string' } }
              }
            },
            authority: {
              type: 'object',
              properties: {
                decisionAuthority: { type: 'array', items: { type: 'string' } },
                limitations: { type: 'array', items: { type: 'string' } },
                escalationToExecutive: { type: 'array', items: { type: 'string' } },
                delegationAuthority: { type: 'array', items: { type: 'string' } }
              }
            },
            principles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  principle: { type: 'string' },
                  description: { type: 'string' },
                  application: { type: 'string' }
                }
              }
            },
            objectives: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  objective: { type: 'string' },
                  rationale: { type: 'string' },
                  successCriteria: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            successMeasures: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  measure: { type: 'string' },
                  target: { type: 'string' },
                  frequency: { type: 'string' }
                }
              }
            },
            reviewProcess: {
              type: 'object',
              properties: {
                reviewFrequency: { type: 'string' },
                amendmentProcess: { type: 'array', items: { type: 'string' } },
                approvalRequirements: { type: 'string' }
              }
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
  labels: ['agent', 'product-council', 'charter-definition']
}));

// Task 2: Membership Structure
export const membershipStructureTask = defineTask('membership-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish membership structure and role definitions',
  agent: {
    name: 'membership-designer',
    prompt: {
      role: 'organizational design expert and governance specialist',
      task: 'Define comprehensive membership structure with clear roles, responsibilities, and tenure',
      context: args,
      instructions: [
        'Design membership structure with components:',
        '  1. Council Composition',
        '     - Core voting members (permanent seats)',
        '     - Ex-officio members (non-voting advisors)',
        '     - Rotating members (term-limited)',
        '     - Subject matter experts (as needed)',
        '     - Executive sponsors',
        '  2. Role Definitions',
        '     - Council Chair/President',
        '       * Responsibilities: agenda setting, meeting facilitation, decision oversight',
        '       * Authority level and approval rights',
        '       * Term length and selection process',
        '     - Vice Chair/Co-Chair',
        '       * Backup leadership and specific areas of focus',
        '     - Product Line Representatives',
        '       * Advocacy for specific product areas',
        '       * Portfolio management responsibilities',
        '     - Functional Representatives',
        '       * Engineering, Design, Data, Marketing, Sales perspectives',
        '       * Cross-functional coordination duties',
        '     - Secretary/Administrator',
        '       * Documentation and record-keeping',
        '       * Meeting logistics and follow-up',
        '  3. Membership Criteria',
        '     - Required experience and seniority',
        '     - Domain expertise requirements',
        '     - Decision-making authority prerequisites',
        '     - Time commitment expectations',
        '  4. Selection and Appointment Process',
        '     - How members are nominated',
        '     - Selection/approval process',
        '     - Onboarding requirements',
        '  5. Term Limits and Rotation',
        '     - Term length for each role',
        '     - Term limits (if any)',
        '     - Succession planning approach',
        '     - Knowledge transfer process',
        '  6. Responsibilities and Expectations',
        '     - Meeting attendance requirements',
        '     - Preparation expectations',
        '     - Decision-making obligations',
        '     - Confidentiality and conflict of interest policies',
        '  7. Member Accountability',
        '     - Performance expectations',
        '     - Removal process for non-performance',
        '     - Conflict resolution mechanisms',
        'Ensure representation across all key product lines',
        'Balance diversity of perspectives with manageable size',
        'Define clear accountability for each role',
        'Save membership structure document to output directory'
      ],
      outputFormat: 'JSON with coreMembers (array), exOfficio (array), roles (array), selectionProcess (object), termLimits (object), accountabilityFramework (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['coreMembers', 'exOfficio', 'roles', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        coreMembers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              roleTitle: { type: 'string' },
              description: { type: 'string' },
              productLineOrFunction: { type: 'string' },
              votingRights: { type: 'boolean' },
              requiredExpertise: { type: 'array', items: { type: 'string' } },
              responsibilities: { type: 'array', items: { type: 'string' } },
              timeCommitment: { type: 'string' },
              termLength: { type: 'string' }
            }
          }
        },
        exOfficio: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              roleTitle: { type: 'string' },
              description: { type: 'string' },
              function: { type: 'string' },
              participationLevel: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              roleTitle: { type: 'string' },
              type: { type: 'string', enum: ['leadership', 'member', 'advisor', 'administrator'] },
              responsibilities: { type: 'array', items: { type: 'string' } },
              authority: { type: 'array', items: { type: 'string' } },
              qualifications: { type: 'array', items: { type: 'string' } },
              termLength: { type: 'string' },
              selectionProcess: { type: 'string' }
            }
          }
        },
        membershipCriteria: {
          type: 'object',
          properties: {
            minimumSeniority: { type: 'string' },
            requiredExperience: { type: 'array', items: { type: 'string' } },
            domainExpertise: { type: 'array', items: { type: 'string' } },
            timeCommitment: { type: 'string' }
          }
        },
        selectionProcess: {
          type: 'object',
          properties: {
            nominationProcess: { type: 'array', items: { type: 'string' } },
            approvalAuthority: { type: 'string' },
            onboardingSteps: { type: 'array', items: { type: 'string' } }
          }
        },
        termLimits: {
          type: 'object',
          properties: {
            leadershipTermLength: { type: 'string' },
            memberTermLength: { type: 'string' },
            consecutiveTermLimit: { type: 'number' },
            successionPlanning: { type: 'array', items: { type: 'string' } }
          }
        },
        accountabilityFramework: {
          type: 'object',
          properties: {
            attendanceRequirement: { type: 'string' },
            preparationExpectations: { type: 'array', items: { type: 'string' } },
            performanceReview: { type: 'string' },
            removalProcess: { type: 'array', items: { type: 'string' } },
            conflictOfInterestPolicy: { type: 'string' }
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
  labels: ['agent', 'product-council', 'membership-structure']
}));

// Task 3: Review Cadence
export const reviewCadenceTask = defineTask('review-cadence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish review cadence and meeting structure',
  agent: {
    name: 'meeting-architect',
    prompt: {
      role: 'product operations expert and meeting effectiveness specialist',
      task: 'Design comprehensive review cadence with meeting types, agendas, and operational rhythms',
      context: args,
      instructions: [
        'Design review cadence with components:',
        '  1. Regular Meeting Schedule',
        '     - Primary council meetings (frequency from reviewFrequency input)',
        '     - Planning/strategy sessions (quarterly)',
        '     - Ad-hoc urgent reviews (as needed)',
        '     - Annual strategic planning sessions',
        '  2. Meeting Types and Purposes',
        '     - Strategic Review Meetings',
        '       * Portfolio performance review',
        '       * Strategic initiative status',
        '       * Major investment decisions',
        '       * Resource allocation across products',
        '     - Tactical Decision Meetings',
        '       * Feature prioritization across products',
        '       * Go/no-go decisions',
        '       * Trade-off discussions',
        '     - Planning Meetings',
        '       * Roadmap alignment sessions',
        '       * Annual/quarterly planning',
        '       * Budget planning',
        '     - Deep Dive Sessions',
        '       * Product line deep dives',
        '       * Technical architecture reviews',
        '       * Market/competitive analysis',
        '  3. Meeting Structure and Agendas',
        '     - Standard agenda template for each meeting type',
        '     - Time allocations per agenda item',
        '     - Pre-read requirements',
        '     - Decision items vs. discussion items',
        '     - Standing agenda items (metrics review, action items)',
        '  4. Submission and Review Windows',
        '     - Deadline for submission of proposals/requests',
        '     - Review window for materials',
        '     - Pre-meeting preparation expectations',
        '  5. Meeting Logistics',
        '     - Duration of each meeting type',
        '     - Location/format (in-person, hybrid, virtual)',
        '     - Required vs. optional attendees',
        '     - Meeting facilitation approach',
        '  6. Asynchronous Review Processes',
        '     - When async review is appropriate',
        '     - Async decision-making protocols',
        '     - Tools and platforms for async collaboration',
        '  7. Annual Calendar',
        '     - Year-round meeting schedule',
        '     - Key planning milestones',
        '     - Integration with company calendar',
        'Ensure cadence balances thoroughness with efficiency',
        'Provide flexibility for urgent decisions',
        'Define clear pre-work expectations to maximize meeting time',
        'Save cadence framework to output directory'
      ],
      outputFormat: 'JSON with cadence (object with schedule, meetingTypes, agendas), submissionWindows (object), annualCalendar (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['cadence', 'artifacts'],
      properties: {
        cadence: {
          type: 'object',
          properties: {
            documentPath: { type: 'string' },
            primaryFrequency: { type: 'string' },
            meetingTypes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  purpose: { type: 'string' },
                  frequency: { type: 'string' },
                  duration: { type: 'string' },
                  format: { type: 'string', enum: ['in-person', 'virtual', 'hybrid'] },
                  requiredAttendees: { type: 'array', items: { type: 'string' } },
                  optionalAttendees: { type: 'array', items: { type: 'string' } },
                  agendaTemplate: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        item: { type: 'string' },
                        timeAllocation: { type: 'string' },
                        owner: { type: 'string' },
                        type: { type: 'string', enum: ['decision', 'discussion', 'information'] }
                      }
                    }
                  },
                  preWorkRequired: { type: 'boolean' },
                  preReadMaterials: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        submissionWindows: {
          type: 'object',
          properties: {
            proposalDeadline: { type: 'string' },
            materialsDueDate: { type: 'string' },
            reviewWindowDuration: { type: 'string' },
            feedbackDeadline: { type: 'string' }
          }
        },
        asyncProcesses: {
          type: 'object',
          properties: {
            whenToUseAsync: { type: 'array', items: { type: 'string' } },
            asyncDecisionProtocol: { type: 'array', items: { type: 'string' } },
            tools: { type: 'array', items: { type: 'string' } },
            responseTimeExpectations: { type: 'string' }
          }
        },
        annualCalendar: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              month: { type: 'string' },
              meetingType: { type: 'string' },
              focus: { type: 'string' },
              keyDeliverables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        meetingEffectivenessGuidelines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              guideline: { type: 'string' },
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
  labels: ['agent', 'product-council', 'review-cadence']
}));

// Task 4: Decision Criteria
export const decisionCriteriaTask = defineTask('decision-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define decision criteria and evaluation framework',
  agent: {
    name: 'criteria-designer',
    prompt: {
      role: 'product strategy expert and decision framework specialist',
      task: 'Create comprehensive decision criteria framework for evaluating proposals and making consistent decisions',
      context: args,
      instructions: [
        'Define decision criteria framework with components:',
        '  1. Strategic Alignment Criteria',
        '     - Alignment with company vision and strategy',
        '     - Fit with product portfolio strategy',
        '     - Contribution to strategic objectives',
        '     - Market opportunity and timing',
        '  2. Customer Value Criteria',
        '     - Customer problem severity and frequency',
        '     - Size of addressable customer base',
        '     - Customer willingness to pay',
        '     - Competitive differentiation',
        '     - User experience impact',
        '  3. Business Impact Criteria',
        '     - Revenue potential (new, expansion, retention)',
        '     - Market share impact',
        '     - Cost savings or efficiency gains',
        '     - Strategic partnerships or ecosystem effects',
        '     - Brand and reputation impact',
        '  4. Feasibility and Risk Criteria',
        '     - Technical feasibility and complexity',
        '     - Resource requirements (eng, design, PM, etc.)',
        '     - Timeline and time-to-market',
        '     - Dependencies and blockers',
        '     - Execution risk level',
        '     - Technical debt considerations',
        '  5. Financial Criteria',
        '     - Investment required (development, marketing, operations)',
        '     - Expected ROI and payback period',
        '     - Cost of delay',
        '     - Opportunity cost',
        '  6. Strategic Risk Criteria',
        '     - Competitive response potential',
        '     - Market timing risk',
        '     - Regulatory or compliance risk',
        '     - Platform or ecosystem risk',
        '  7. Scoring and Weighting System',
        '     - Scoring scale for each criterion (e.g., 1-5)',
        '     - Weighting of criteria categories',
        '     - Threshold scores for approval',
        '     - Tie-breaking mechanisms',
        '  8. Decision Types and Criteria Application',
        '     - Major feature decisions: full criteria set',
        '     - Minor enhancements: simplified criteria',
        '     - Strategic initiatives: weighted toward strategic alignment',
        '     - Technical architecture: weighted toward feasibility',
        'Ensure criteria are objective and measurable where possible',
        'Balance quantitative and qualitative factors',
        'Align weighting with decision model (consensus-driven vs. consultative)',
        'Provide examples of how criteria are applied',
        'Save decision criteria framework to output directory'
      ],
      outputFormat: 'JSON with criteria (array of criterion objects with categories, scoring, weighting), decisionTypes (array), scoringSystem (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              weight: { type: 'number' },
              dimensions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    dimension: { type: 'string' },
                    description: { type: 'string' },
                    scoringGuidance: { type: 'string' },
                    scoreRange: { type: 'string' },
                    examples: {
                      type: 'object',
                      properties: {
                        high: { type: 'string' },
                        medium: { type: 'string' },
                        low: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        scoringSystem: {
          type: 'object',
          properties: {
            scale: { type: 'string' },
            minimumPassingScore: { type: 'number' },
            excellenceThreshold: { type: 'number' },
            tieBreakingMechanism: { type: 'string' },
            scoringInstructions: { type: 'array', items: { type: 'string' } }
          }
        },
        decisionTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decisionType: { type: 'string' },
              description: { type: 'string' },
              applicableCriteria: { type: 'array', items: { type: 'string' } },
              criteriaWeighting: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category: { type: 'string' },
                    weight: { type: 'number' }
                  }
                }
              },
              approvalThreshold: { type: 'number' }
            }
          }
        },
        criteriaApplicationGuidelines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              guideline: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        exampleEvaluations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              proposalExample: { type: 'string' },
              criteriaScores: { type: 'object' },
              totalScore: { type: 'number' },
              decision: { type: 'string' },
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
  labels: ['agent', 'product-council', 'decision-criteria']
}));

// Task 5: Review Process Design
export const reviewProcessDesignTask = defineTask('review-process-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design review process and workflows',
  agent: {
    name: 'process-designer',
    prompt: {
      role: 'product operations expert and process optimization specialist',
      task: 'Design end-to-end review process and workflows for council operations',
      context: args,
      instructions: [
        'Design comprehensive review process with workflows:',
        '  1. Proposal Submission Workflow',
        '     - Who can submit proposals',
        '     - Proposal template and required information',
        '     - Submission mechanism (tool, format)',
        '     - Acknowledgment and tracking process',
        '  2. Initial Screening Workflow',
        '     - Council chair/secretary initial review',
        '     - Completeness check',
        '     - Alignment with council scope',
        '     - Triage and prioritization',
        '     - Routing to appropriate review type',
        '  3. Pre-Review Analysis Workflow',
        '     - Assignment of reviewers (primary, secondary)',
        '     - Individual review and scoring against criteria',
        '     - Feedback and questions collection',
        '     - Preparation of summary for council',
        '  4. Council Review Workflow',
        '     - Pre-read distribution timeline',
        '     - Meeting presentation format',
        '     - Q&A and discussion structure',
        '     - Decision-making process (based on decisionModel)',
        '       * Consensus-driven: facilitated discussion to agreement',
        '       * Consultative: input gathered, chair/lead decides',
        '       * Democratic: structured voting',
        '     - Documentation of decision and rationale',
        '  5. Decision Communication Workflow',
        '     - Decision announcement to stakeholders',
        '     - Rationale and context sharing',
        '     - Next steps and action items',
        '     - Implementation coordination',
        '  6. Implementation Tracking Workflow',
        '     - Milestone tracking for approved initiatives',
        '     - Status updates to council',
        '     - Issue escalation if implementation struggles',
        '  7. Follow-up and Retrospective Workflow',
        '     - Post-implementation review schedule',
        '     - Success criteria evaluation',
        '     - Lessons learned capture',
        '     - Process improvement feedback',
        '  8. Fast-Track/Urgent Review Process',
        '     - Criteria for fast-track review',
        '     - Accelerated timeline',
        '     - Minimum review requirements',
        '     - Async decision protocols',
        'For each workflow, specify:',
        '  - Inputs and outputs',
        '  - Roles and responsibilities',
        '  - Timelines and SLAs',
        '  - Tools and systems used',
        '  - Quality gates and checkpoints',
        'Ensure process is efficient while maintaining rigor',
        'Build in feedback loops for continuous improvement',
        'Save process documentation to output directory'
      ],
      outputFormat: 'JSON with workflows (array of workflow objects), slas (object), tools (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['workflows', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        workflows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              workflowName: { type: 'string' },
              description: { type: 'string' },
              trigger: { type: 'string' },
              steps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    stepNumber: { type: 'number' },
                    stepName: { type: 'string' },
                    owner: { type: 'string' },
                    actions: { type: 'array', items: { type: 'string' } },
                    inputs: { type: 'array', items: { type: 'string' } },
                    outputs: { type: 'array', items: { type: 'string' } },
                    sla: { type: 'string' },
                    qualityGates: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              decisionPoints: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    decision: { type: 'string' },
                    criteria: { type: 'string' },
                    outcomes: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              tools: { type: 'array', items: { type: 'string' } },
              documentation: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        proposalTemplate: {
          type: 'object',
          properties: {
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  section: { type: 'string' },
                  requiredFields: { type: 'array', items: { type: 'string' } },
                  guidance: { type: 'string' }
                }
              }
            },
            templatePath: { type: 'string' }
          }
        },
        slas: {
          type: 'object',
          properties: {
            acknowledgmentTime: { type: 'string' },
            initialScreeningTime: { type: 'string' },
            preReviewAnalysisTime: { type: 'string' },
            councilReviewScheduling: { type: 'string' },
            decisionCommunication: { type: 'string' },
            fastTrackTimeline: { type: 'string' }
          }
        },
        reviewerGuidelines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              guideline: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        tools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              purpose: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        continuousImprovement: {
          type: 'object',
          properties: {
            feedbackMechanisms: { type: 'array', items: { type: 'string' } },
            reviewFrequency: { type: 'string' },
            improvementProcess: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'product-council', 'review-process']
}));

// Task 6: Escalation Process
export const escalationProcessTask = defineTask('escalation-process', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define escalation process and conflict resolution',
  agent: {
    name: 'escalation-architect',
    prompt: {
      role: 'governance expert and conflict resolution specialist',
      task: 'Create comprehensive escalation process for deadlocks, conflicts, and urgent decisions',
      context: args,
      instructions: [
        'Define escalation process with levels and procedures:',
        '  1. When Escalation is Needed',
        '     - Council deadlock (cannot reach consensus)',
        '     - Conflicting stakeholder interests',
        '     - Resource contention requiring executive arbitration',
        '     - Strategic misalignment requiring higher-level decision',
        '     - Urgent decisions requiring faster process',
        '     - Appeals of council decisions',
        '  2. Escalation Levels (typically 3 levels based on escalationLevels input)',
        '     - Level 1: Council Chair/Leadership Team',
        '       * Attempts to facilitate resolution within council',
        '       * May convene special session or working group',
        '       * Timeline: 3-5 business days',
        '     - Level 2: Executive Sponsor/Product Leadership',
        '       * Escalated outside council to senior product leadership',
        '       * May involve VP of Product, CPO, or equivalent',
        '       * Timeline: 5-10 business days',
        '     - Level 3: Executive Leadership Team',
        '       * Final escalation to CEO, Executive team, or Board',
        '       * Reserved for strategic decisions with company-wide impact',
        '       * Timeline: varies based on urgency and executive availability',
        '  3. Escalation Procedures',
        '     - How to initiate escalation (formal request, template)',
        '     - Information required for escalation',
        '       * Summary of decision to be made',
        '       * Council discussion summary',
        '       * Options considered and trade-offs',
        '       * Stakeholder positions',
        '       * Recommendation (if any)',
        '       * Impact of delay',
        '     - Escalation review process at each level',
        '     - Decision-making authority at each level',
        '     - Communication of escalated decision back to council',
        '  4. Conflict Resolution Mechanisms',
        '     - Facilitated mediation approach',
        '     - Structured decision-making frameworks (e.g., DACI, RACI)',
        '     - Neutral third-party facilitators (when needed)',
        '     - Tie-breaking mechanisms before escalation',
        '  5. Appeals Process',
        '     - Who can appeal council decisions',
        '     - Grounds for appeal',
        '     - Appeal submission process',
        '     - Appeal review and decision',
        '  6. Escalation Tracking and Reporting',
        '     - Log of all escalations',
        '     - Escalation metrics (frequency, resolution time)',
        '     - Pattern analysis for process improvement',
        '  7. Special Situations',
        '     - Emergency decisions requiring immediate action',
        '     - Security or compliance-driven decisions',
        '     - Regulatory escalations',
        'Ensure escalation is used judiciously, not as bypass mechanism',
        'Define clear criteria for what requires escalation',
        'Balance need for speed with appropriate review rigor',
        'Save escalation process documentation to output directory'
      ],
      outputFormat: 'JSON with levels (array of escalation level objects), procedures (object), conflictResolution (object), appeals (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['levels', 'procedures', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        levels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'number' },
              name: { type: 'string' },
              authority: { type: 'string' },
              description: { type: 'string' },
              whenToEscalate: { type: 'array', items: { type: 'string' } },
              decisionMakers: { type: 'array', items: { type: 'string' } },
              timeline: { type: 'string' },
              process: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        escalationCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              description: { type: 'string' },
              escalationLevel: { type: 'number' }
            }
          }
        },
        procedures: {
          type: 'object',
          properties: {
            initiationProcess: { type: 'array', items: { type: 'string' } },
            requiredInformation: { type: 'array', items: { type: 'string' } },
            submissionTemplate: { type: 'string' },
            reviewProcess: { type: 'array', items: { type: 'string' } },
            communicationProtocol: { type: 'array', items: { type: 'string' } }
          }
        },
        conflictResolution: {
          type: 'object',
          properties: {
            facilitationApproach: { type: 'array', items: { type: 'string' } },
            mediationProcess: { type: 'array', items: { type: 'string' } },
            tieBreakingMechanisms: { type: 'array', items: { type: 'string' } },
            neutralFacilitators: { type: 'array', items: { type: 'string' } }
          }
        },
        appeals: {
          type: 'object',
          properties: {
            whoCanAppeal: { type: 'array', items: { type: 'string' } },
            groundsForAppeal: { type: 'array', items: { type: 'string' } },
            submissionProcess: { type: 'array', items: { type: 'string' } },
            reviewAuthority: { type: 'string' },
            timeline: { type: 'string' }
          }
        },
        tracking: {
          type: 'object',
          properties: {
            escalationLog: { type: 'string' },
            metricsTracked: { type: 'array', items: { type: 'string' } },
            reportingFrequency: { type: 'string' },
            improvementProcess: { type: 'array', items: { type: 'string' } }
          }
        },
        specialSituations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              situation: { type: 'string' },
              process: { type: 'string' },
              authority: { type: 'string' },
              timeline: { type: 'string' }
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
  labels: ['agent', 'product-council', 'escalation-process']
}));

// Task 7: Documentation Framework
export const documentationFrameworkTask = defineTask('documentation-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create documentation templates and standards',
  agent: {
    name: 'documentation-architect',
    prompt: {
      role: 'product documentation expert and knowledge management specialist',
      task: 'Create comprehensive documentation framework with templates, standards, and knowledge management system',
      context: args,
      instructions: [
        'Create documentation framework with components:',
        '  1. Core Document Templates',
        '     - Proposal submission template',
        '       * Executive summary',
        '       * Problem statement and opportunity',
        '       * Proposed solution',
        '       * Success criteria and metrics',
        '       * Resource requirements',
        '       * Timeline and milestones',
        '       * Risk assessment',
        '       * Criteria scoring self-assessment',
        '     - Meeting agenda template',
        '     - Meeting minutes template',
        '       * Attendance',
        '       * Decisions made',
        '       * Action items with owners',
        '       * Discussions summary',
        '       * Next steps',
        '     - Decision record template (ADR-style)',
        '       * Context and background',
        '       * Decision made',
        '       * Rationale',
        '       * Alternatives considered',
        '       * Consequences and implications',
        '       * Review date',
        '     - Escalation request template',
        '     - Status update template',
        '  2. Documentation Standards',
        '     - Document naming conventions',
        '     - Version control approach',
        '     - Storage location and organization',
        '     - Access control and permissions',
        '     - Retention and archival policies',
        '     - Confidentiality classifications',
        '  3. Meeting Documentation Process',
        '     - Pre-meeting materials distribution timeline',
        '     - Note-taking responsibilities',
        '     - Minutes approval process',
        '     - Action item tracking system',
        '     - Decision log maintenance',
        '  4. Knowledge Management',
        '     - Central repository for council documents',
        '     - Searchable decision database',
        '     - Historical proposal archive',
        '     - Lessons learned repository',
        '     - FAQ and playbook maintenance',
        '  5. Communication and Transparency',
        '     - What gets communicated broadly vs. kept confidential',
        '     - Stakeholder communication templates',
        '     - Decision announcement format',
        '     - Public vs. internal documentation',
        '  6. Audit Trail and Compliance',
        '     - Decision audit trail requirements',
        '     - Compliance documentation',
        '     - Periodic review and cleanup process',
        '  7. Documentation Quality Standards',
        '     - Clarity and conciseness requirements',
        '     - Use of data and evidence',
        '     - Accessibility standards',
        '     - Review and approval workflow',
        'Ensure templates are user-friendly and not overly bureaucratic',
        'Balance rigor with practicality',
        'Make documentation discoverable and searchable',
        'Create templates in markdown or common formats',
        'Save all templates and standards to output directory'
      ],
      outputFormat: 'JSON with templates (array), standards (object), knowledgeManagement (object), auditTrail (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['templates', 'standards', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              templateName: { type: 'string' },
              purpose: { type: 'string' },
              whenToUse: { type: 'string' },
              sections: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    section: { type: 'string' },
                    description: { type: 'string' },
                    required: { type: 'boolean' },
                    guidance: { type: 'string' }
                  }
                }
              },
              templatePath: { type: 'string' }
            }
          }
        },
        standards: {
          type: 'object',
          properties: {
            namingConventions: { type: 'array', items: { type: 'string' } },
            versionControl: {
              type: 'object',
              properties: {
                approach: { type: 'string' },
                tool: { type: 'string' },
                versioningScheme: { type: 'string' }
              }
            },
            storageAndOrganization: {
              type: 'object',
              properties: {
                centralRepository: { type: 'string' },
                folderStructure: { type: 'array', items: { type: 'string' } },
                accessControl: { type: 'string' }
              }
            },
            retentionPolicy: {
              type: 'object',
              properties: {
                activeDocumentRetention: { type: 'string' },
                archivalProcess: { type: 'string' },
                disposalPolicy: { type: 'string' }
              }
            },
            confidentiality: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  classification: { type: 'string' },
                  description: { type: 'string' },
                  accessRules: { type: 'string' }
                }
              }
            }
          }
        },
        meetingDocumentation: {
          type: 'object',
          properties: {
            preMeetingProcess: { type: 'array', items: { type: 'string' } },
            noteTakingResponsibility: { type: 'string' },
            minutesApprovalProcess: { type: 'array', items: { type: 'string' } },
            actionItemTracking: { type: 'string' },
            decisionLogMaintenance: { type: 'string' }
          }
        },
        knowledgeManagement: {
          type: 'object',
          properties: {
            repositoryLocation: { type: 'string' },
            searchCapabilities: { type: 'array', items: { type: 'string' } },
            decisionDatabase: { type: 'string' },
            lessonsLearnedProcess: { type: 'array', items: { type: 'string' } },
            playbookMaintenance: { type: 'string' }
          }
        },
        communicationGuidelines: {
          type: 'object',
          properties: {
            publicVsConfidential: { type: 'array', items: { type: 'string' } },
            stakeholderCommTemplates: { type: 'array', items: { type: 'string' } },
            decisionAnnouncementFormat: { type: 'string' }
          }
        },
        auditTrail: {
          type: 'object',
          properties: {
            requirements: { type: 'array', items: { type: 'string' } },
            complianceDocumentation: { type: 'array', items: { type: 'string' } },
            reviewFrequency: { type: 'string' },
            cleanupProcess: { type: 'string' }
          }
        },
        qualityStandards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              description: { type: 'string' },
              checklistItems: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'product-council', 'documentation-framework']
}));

// Task 8: Metrics and Reporting
export const metricsReportingTask = defineTask('metrics-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish metrics and reporting framework',
  agent: {
    name: 'metrics-designer',
    prompt: {
      role: 'product analytics expert and reporting specialist',
      task: 'Create comprehensive metrics and reporting framework for council effectiveness and product performance',
      context: args,
      instructions: [
        'Design metrics and reporting framework with components:',
        '  1. Council Effectiveness Metrics',
        '     - Decision throughput (proposals reviewed per period)',
        '     - Decision velocity (time from submission to decision)',
        '     - Meeting effectiveness (attendance, preparation, time efficiency)',
        '     - Member engagement (participation quality, pre-work completion)',
        '     - Escalation rate and resolution time',
        '     - Decision quality (post-implementation assessment)',
        '  2. Product Portfolio Health Metrics',
        '     - Product line performance (revenue, growth, market share)',
        '     - Customer satisfaction by product (NPS, CSAT)',
        '     - Product-market fit indicators',
        '     - Innovation pipeline health',
        '     - Technical health (reliability, performance, tech debt)',
        '  3. Resource and Investment Metrics',
        '     - Resource allocation across products',
        '     - Investment distribution (new features vs. maintenance)',
        '     - ROI of major initiatives',
        '     - Cost efficiency metrics',
        '  4. Strategic Alignment Metrics',
        '     - Alignment with company OKRs',
        '     - Strategic initiative progress',
        '     - Portfolio balance (core vs. innovation)',
        '     - Competitive positioning',
        '  5. Reporting Cadence and Formats',
        '     - Weekly: key performance indicators dashboard',
        '     - Monthly: comprehensive portfolio review',
        '     - Quarterly: strategic review and OKR assessment',
        '     - Annual: year-in-review and strategic planning',
        '  6. Dashboard and Visualization',
        '     - Executive summary dashboard',
        '     - Product-specific drill-downs',
        '     - Trend analysis and forecasting',
        '     - Comparative analysis across products',
        '  7. Data Sources and Collection',
        '     - Data sources for each metric',
        '     - Data collection automation',
        '     - Data quality and validation',
        '     - Metric ownership and accountability',
        '  8. Metric Review and Evolution',
        '     - Quarterly metric review process',
        '     - Adding/removing metrics',
        '     - Threshold and target adjustments',
        'Ensure metrics are actionable and drive decisions',
        'Balance leading and lagging indicators',
        'Make metrics transparent and accessible',
        'Save metrics framework to output directory'
      ],
      outputFormat: 'JSON with kpis (array), reportingCadence (object), dashboards (array), dataCollection (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'reportingCadence', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              kpiName: { type: 'string' },
              description: { type: 'string' },
              formula: { type: 'string' },
              target: { type: 'string' },
              dataSource: { type: 'string' },
              owner: { type: 'string' },
              frequency: { type: 'string' },
              actionability: { type: 'string' }
            }
          }
        },
        reportingCadence: {
          type: 'object',
          properties: {
            weekly: {
              type: 'object',
              properties: {
                format: { type: 'string' },
                metrics: { type: 'array', items: { type: 'string' } },
                audience: { type: 'array', items: { type: 'string' } }
              }
            },
            monthly: {
              type: 'object',
              properties: {
                format: { type: 'string' },
                metrics: { type: 'array', items: { type: 'string' } },
                audience: { type: 'array', items: { type: 'string' } }
              }
            },
            quarterly: {
              type: 'object',
              properties: {
                format: { type: 'string' },
                metrics: { type: 'array', items: { type: 'string' } },
                audience: { type: 'array', items: { type: 'string' } }
              }
            },
            annual: {
              type: 'object',
              properties: {
                format: { type: 'string' },
                content: { type: 'array', items: { type: 'string' } },
                audience: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dashboardName: { type: 'string' },
              audience: { type: 'string' },
              refreshFrequency: { type: 'string' },
              sections: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    section: { type: 'string' },
                    metrics: { type: 'array', items: { type: 'string' } },
                    visualizationType: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        dataCollection: {
          type: 'object',
          properties: {
            dataSources: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  source: { type: 'string' },
                  metricsSupported: { type: 'array', items: { type: 'string' } },
                  automationLevel: { type: 'string' }
                }
              }
            },
            dataQuality: {
              type: 'object',
              properties: {
                validationProcess: { type: 'array', items: { type: 'string' } },
                qualityChecks: { type: 'array', items: { type: 'string' } },
                issueResolution: { type: 'string' }
              }
            },
            ownership: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  metric: { type: 'string' },
                  owner: { type: 'string' },
                  responsibilities: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        metricEvolution: {
          type: 'object',
          properties: {
            reviewFrequency: { type: 'string' },
            reviewProcess: { type: 'array', items: { type: 'string' } },
            changeApprovalProcess: { type: 'string' }
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
  labels: ['agent', 'product-council', 'metrics-reporting']
}));

// Task 9: Onboarding Materials
export const onboardingMaterialsTask = defineTask('onboarding-materials', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create onboarding and training materials',
  agent: {
    name: 'onboarding-designer',
    prompt: {
      role: 'learning and development specialist and council operations expert',
      task: 'Create comprehensive onboarding and training materials for new council members',
      context: args,
      instructions: [
        'Create onboarding package with components:',
        '  1. Council Overview',
        '     - Council purpose and mission',
        '     - History and evolution',
        '     - Current priorities and focus areas',
        '     - Success stories',
        '  2. New Member Onboarding Checklist',
        '     - Pre-first-meeting preparations',
        '     - First meeting expectations',
        '     - First 30/60/90 day milestones',
        '     - Key relationships to establish',
        '  3. Roles and Responsibilities Guide',
        '     - Your specific role description',
        '     - What success looks like in your role',
        '     - Time commitment expectations',
        '     - How to prepare for meetings',
        '  4. Process and Workflow Training',
        '     - How proposals are submitted and reviewed',
        '     - Decision-making process walkthrough',
        '     - How to use decision criteria',
        '     - Escalation process overview',
        '     - Documentation expectations',
        '  5. Tools and Systems Training',
        '     - Access to key systems and repositories',
        '     - How to navigate documentation',
        '     - Communication channels and protocols',
        '     - Collaboration tools',
        '  6. Product Portfolio Overview',
        '     - Overview of each product line',
        '     - Current strategic initiatives',
        '     - Key metrics and performance',
        '     - Competitive landscape',
        '  7. Stakeholder Map',
        '     - Key stakeholders and their roles',
        '     - Who to go to for what',
        '     - Cross-functional relationships',
        '  8. Best Practices and Tips',
        '     - How to be an effective council member',
        '     - Common pitfalls to avoid',
        '     - How to give constructive feedback',
        '     - Decision-making tips',
        '  9. FAQ',
        '     - Common questions from new members',
        '     - Answers to process questions',
        '     - Troubleshooting common issues',
        ' 10. Buddy/Mentor Assignment',
        '     - Pairing with experienced member',
        '     - Regular check-ins during onboarding',
        'Make materials accessible and self-service where possible',
        'Include both quick-start guide and comprehensive reference',
        'Provide practical examples and scenarios',
        'Save onboarding materials to output directory'
      ],
      outputFormat: 'JSON with onboardingChecklist (array), trainingModules (array), quickStartGuide (string), comprehensiveGuide (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['onboardingChecklist', 'trainingModules', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        onboardingChecklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              timeline: { type: 'string' },
              tasks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    task: { type: 'string' },
                    owner: { type: 'string' },
                    description: { type: 'string' },
                    resources: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          }
        },
        trainingModules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moduleName: { type: 'string' },
              objective: { type: 'string' },
              duration: { type: 'string' },
              format: { type: 'string' },
              content: { type: 'array', items: { type: 'string' } },
              resources: { type: 'array', items: { type: 'string' } },
              assessment: { type: 'string' }
            }
          }
        },
        quickStartGuide: {
          type: 'object',
          properties: {
            guidePath: { type: 'string' },
            sections: { type: 'array', items: { type: 'string' } },
            targetAudience: { type: 'string' }
          }
        },
        comprehensiveGuide: {
          type: 'object',
          properties: {
            guidePath: { type: 'string' },
            chapters: { type: 'array', items: { type: 'string' } },
            targetAudience: { type: 'string' }
          }
        },
        bestPractices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              practice: { type: 'string' },
              rationale: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        faq: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' },
              relatedResources: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        mentorshipProgram: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            pairingCriteria: { type: 'array', items: { type: 'string' } },
            checkInSchedule: { type: 'string' },
            mentorResponsibilities: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'product-council', 'onboarding']
}));

// Task 10: Governance Validation
export const governanceValidationTask = defineTask('governance-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate governance framework completeness',
  agent: {
    name: 'governance-auditor',
    prompt: {
      role: 'product governance auditor and organizational effectiveness expert',
      task: 'Assess completeness, quality, and readiness of product council governance framework',
      context: args,
      instructions: [
        'Validate governance framework across dimensions:',
        '  1. Completeness Assessment (30%)',
        '     - All required components defined (charter, membership, processes)',
        '     - Documentation templates created',
        '     - Decision criteria established',
        '     - Escalation process defined',
        '     - Metrics and reporting framework in place',
        '  2. Clarity and Usability (25%)',
        '     - Clear roles and responsibilities',
        '     - Easy-to-follow processes',
        '     - Accessible documentation',
        '     - Practical and actionable guidance',
        '  3. Alignment with Best Practices (20%)',
        '     - Aligned with product governance best practices',
        '     - Appropriate for organization size and maturity',
        '     - Balances rigor with agility',
        '     - Incorporates continuous improvement',
        '  4. Integration with Existing Governance (15%)',
        '     - Aligns with company governance structures',
        '     - No conflicts with existing processes',
        '     - Clear handoffs to other governance bodies',
        '  5. Scalability and Flexibility (10%)',
        '     - Can adapt to organization growth',
        '     - Flexible for different decision types',
        '     - Sustainable over time',
        'Calculate weighted validation score (0-100)',
        'Identify gaps or weaknesses in framework',
        'Provide specific recommendations for improvement',
        'Assess readiness for implementation',
        'Highlight strengths and best-in-class elements',
        'Flag any critical missing components',
        'Score of 85+ indicates ready for implementation',
        'Score 70-84 indicates minor gaps',
        'Score <70 indicates significant work needed',
        'Save validation report to output directory'
      ],
      outputFormat: 'JSON with validationScore (number 0-100), dimensionScores (object), completenessChecks (object), gaps (array), recommendations (array), strengths (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'dimensionScores', 'completenessChecks', 'gaps', 'recommendations', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        dimensionScores: {
          type: 'object',
          properties: {
            completeness: { type: 'number', minimum: 0, maximum: 100 },
            clarityUsability: { type: 'number', minimum: 0, maximum: 100 },
            bestPracticesAlignment: { type: 'number', minimum: 0, maximum: 100 },
            integrationWithExisting: { type: 'number', minimum: 0, maximum: 100 },
            scalabilityFlexibility: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        completenessChecks: {
          type: 'object',
          properties: {
            charterDefined: { type: 'boolean' },
            membershipStructureComplete: { type: 'boolean' },
            reviewCadenceEstablished: { type: 'boolean' },
            decisionCriteriaDefined: { type: 'boolean' },
            reviewProcessDocumented: { type: 'boolean' },
            escalationProcessDefined: { type: 'boolean' },
            documentationTemplatesCreated: { type: 'boolean' },
            metricsFrameworkEstablished: { type: 'boolean' },
            onboardingMaterialsReady: { type: 'boolean' }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              rationale: { type: 'string' }
            }
          }
        },
        strengths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strength: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        readinessAssessment: {
          type: 'object',
          properties: {
            readyForImplementation: { type: 'boolean' },
            criticalBlockers: { type: 'array', items: { type: 'string' } },
            preImplementationWork: { type: 'array', items: { type: 'string' } },
            estimatedEffortToReady: { type: 'string' }
          }
        },
        bestPracticesComparison: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              practice: { type: 'string' },
              implemented: { type: 'boolean' },
              notes: { type: 'string' }
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
  labels: ['agent', 'product-council', 'governance-validation']
}));

// Task 11: Implementation Roadmap
export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation roadmap',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'change management expert and implementation specialist',
      task: 'Create phased implementation roadmap for launching product council',
      context: args,
      instructions: [
        'Create implementation roadmap with phases:',
        '  Phase 1: Foundation (Weeks 1-2)',
        '     - Finalize governance documentation based on validation feedback',
        '     - Secure executive sponsorship and approval',
        '     - Identify and confirm council members',
        '     - Set up infrastructure (tools, repositories, communication channels)',
        '  Phase 2: Preparation (Weeks 3-4)',
        '     - Onboard council members',
        '     - Conduct training sessions on processes and tools',
        '     - Establish meeting cadence and book rooms/time',
        '     - Create initial backlog of proposals/topics for review',
        '  Phase 3: Soft Launch (Weeks 5-8)',
        '     - Hold first council meetings with facilitation support',
        '     - Start with lower-stakes decisions to build muscle',
        '     - Gather feedback on process effectiveness',
        '     - Make rapid adjustments based on feedback',
        '  Phase 4: Full Operation (Weeks 9-12)',
        '     - Transition to regular operation without heavy facilitation',
        '     - Begin handling full range of decision types',
        '     - Establish metrics and reporting rhythm',
        '     - Start tracking council effectiveness',
        '  Phase 5: Optimization (Weeks 13+)',
        '     - Conduct retrospective on first 3 months',
        '     - Refine processes based on learnings',
        '     - Scale to handle increased volume',
        '     - Share learnings and best practices',
        'For each phase, specify:',
        '  - Key milestones and deliverables',
        '  - Success criteria',
        '  - Roles and responsibilities',
        '  - Risk mitigation strategies',
        '  - Go/no-go decision points',
        'Include change management considerations:',
        '  - Stakeholder communication plan',
        '  - Addressing resistance or concerns',
        '  - Building momentum and quick wins',
        '  - Celebrating successes',
        'Define metrics for implementation success',
        'Create contingency plans for common challenges',
        'Save implementation roadmap to output directory'
      ],
      outputFormat: 'JSON with phases (array), timeline (object), milestones (array), successCriteria (array), changeManagement (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'milestones', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phaseNumber: { type: 'number' },
              phaseName: { type: 'string' },
              duration: { type: 'string' },
              objective: { type: 'string' },
              keyActivities: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    activity: { type: 'string' },
                    owner: { type: 'string' },
                    timeline: { type: 'string' },
                    dependencies: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              deliverables: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } },
              risks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    risk: { type: 'string' },
                    mitigation: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            totalDuration: { type: 'string' },
            fullOperationDate: { type: 'string' },
            firstOptimizationDate: { type: 'string' }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              targetDate: { type: 'string' },
              goNoGoCriteria: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        changeManagement: {
          type: 'object',
          properties: {
            stakeholderCommunication: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  milestone: { type: 'string' },
                  audience: { type: 'string' },
                  message: { type: 'string' },
                  channel: { type: 'string' }
                }
              }
            },
            resistanceMitigation: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  concern: { type: 'string' },
                  approach: { type: 'string' }
                }
              }
            },
            quickWins: { type: 'array', items: { type: 'string' } },
            celebrationPlan: { type: 'array', items: { type: 'string' } }
          }
        },
        implementationMetrics: {
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
        contingencyPlans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              trigger: { type: 'string' },
              response: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'product-council', 'implementation-roadmap']
}));

// Task 12: Package Assembly
export const packageAssemblyTask = defineTask('package-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble final product council governance package',
  agent: {
    name: 'package-assembler',
    prompt: {
      role: 'documentation specialist and package coordinator',
      task: 'Compile and organize complete product council governance package for distribution',
      context: args,
      instructions: [
        'Create comprehensive governance package including:',
        '  1. Executive Summary',
        '     - Purpose and value of product council',
        '     - Key components of governance framework',
        '     - Implementation timeline and milestones',
        '     - Success metrics and expected outcomes',
        '  2. Council Charter and Operating Principles',
        '     - Complete charter document',
        '     - Guiding principles and values',
        '     - Scope and authority',
        '  3. Membership and Roles',
        '     - Membership structure',
        '     - Role descriptions',
        '     - Selection and accountability framework',
        '  4. Processes and Workflows',
        '     - Review cadence and meeting structure',
        '     - Review process workflows',
        '     - Decision criteria framework',
        '     - Escalation process',
        '  5. Documentation and Templates',
        '     - All templates (proposals, decisions, meetings)',
        '     - Documentation standards',
        '     - Knowledge management approach',
        '  6. Metrics and Reporting',
        '     - KPI framework',
        '     - Reporting cadence and dashboards',
        '     - Data collection and ownership',
        '  7. Onboarding Materials',
        '     - Quick start guide',
        '     - Comprehensive member handbook',
        '     - Training modules',
        '     - FAQ',
        '  8. Implementation Roadmap',
        '     - Phased implementation plan',
        '     - Change management approach',
        '     - Success criteria',
        '  9. Validation and Quality Assessment',
        '     - Validation scores and audit results',
        '     - Identified strengths',
        '     - Remaining gaps and recommendations',
        ' 10. Appendices',
        '     - Reference materials',
        '     - Examples and case studies',
        '     - Tool and resource links',
        'Create master README/index for navigation',
        'Organize in logical folder structure',
        'Ensure all documents are properly formatted and accessible',
        'Create version control and change log',
        'Package for easy distribution and onboarding',
        'Save complete package to output directory'
      ],
      outputFormat: 'JSON with packagePath (string), executiveSummaryPath (string), documentCount (number), packageStructure (object), distributionNotes (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['packagePath', 'executiveSummaryPath', 'documentCount', 'packageStructure', 'artifacts'],
      properties: {
        packagePath: { type: 'string' },
        executiveSummaryPath: { type: 'string' },
        masterIndexPath: { type: 'string' },
        documentCount: { type: 'number' },
        packageStructure: {
          type: 'object',
          properties: {
            rootDirectory: { type: 'string' },
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  section: { type: 'string' },
                  path: { type: 'string' },
                  documentCount: { type: 'number' },
                  keyDocuments: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        keyHighlights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              highlight: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        distributionNotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              audience: { type: 'string' },
              recommendedStartingPoint: { type: 'string' },
              keyDocuments: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        versionControl: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            releaseDate: { type: 'string' },
            changeLog: { type: 'array', items: { type: 'string' } },
            nextReviewDate: { type: 'string' }
          }
        },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              owner: { type: 'string' },
              timeline: { type: 'string' }
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
  labels: ['agent', 'product-council', 'package-assembly', 'documentation']
}));
