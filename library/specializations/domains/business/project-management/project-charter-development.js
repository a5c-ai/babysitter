/**
 * @process specializations/domains/business/project-management/project-charter-development
 * @description Project Charter Development - Create comprehensive project charter documenting objectives,
 * scope, stakeholders, governance, constraints, assumptions, and success criteria with sponsor authorization.
 * @inputs { projectName: string, problemStatement: string, businessNeed: string, stakeholders?: array, constraints?: object }
 * @outputs { success: boolean, charter: object, approvalStatus: string, keyDecisions: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/project-charter-development', {
 *   projectName: 'Enterprise CRM Implementation',
 *   problemStatement: 'Current customer data is fragmented across multiple systems',
 *   businessNeed: 'Unified customer view to improve sales efficiency by 30%',
 *   stakeholders: [{ name: 'Sales VP', role: 'sponsor' }, { name: 'IT Director', role: 'technical-lead' }],
 *   constraints: { budget: 500000, timeline: '9 months', resources: 'internal team' }
 * });
 *
 * @references
 * - PMI PMBOK Guide: https://www.pmi.org/pmbok-guide-standards/foundational/pmbok
 * - Project Charter Best Practices: https://www.pmi.org/learning/library/project-charter-comprehensive-plan-7473
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    problemStatement,
    businessNeed,
    stakeholders = [],
    constraints = {},
    assumptions = [],
    organizationalContext = {},
    successCriteria = []
  } = inputs;

  // Phase 1: Business Context Analysis
  const businessContext = await ctx.task(businessContextAnalysisTask, {
    projectName,
    problemStatement,
    businessNeed,
    organizationalContext
  });

  // Quality Gate: Business justification must be clear
  if (!businessContext.businessJustification || businessContext.alignmentScore < 60) {
    return {
      success: false,
      error: 'Business justification insufficient or strategic alignment unclear',
      phase: 'business-context',
      charter: null
    };
  }

  // Breakpoint: Review business context
  await ctx.breakpoint({
    question: `Review business context for ${projectName}. Strategic alignment score: ${businessContext.alignmentScore}/100. Proceed with charter development?`,
    title: 'Business Context Review',
    context: {
      runId: ctx.runId,
      projectName,
      justification: businessContext.businessJustification,
      alignment: businessContext.strategicAlignment,
      files: [{
        path: `artifacts/phase1-business-context.json`,
        format: 'json',
        content: businessContext
      }]
    }
  });

  // Phase 2: Stakeholder Identification
  const stakeholderAnalysis = await ctx.task(stakeholderIdentificationTask, {
    projectName,
    stakeholders,
    businessContext,
    organizationalContext
  });

  // Phase 3: Scope Definition
  const scopeDefinition = await ctx.task(scopeDefinitionTask, {
    projectName,
    businessNeed,
    businessContext,
    constraints
  });

  // Phase 4: Objectives and Success Criteria
  const objectivesAndCriteria = await ctx.task(objectivesDefinitionTask, {
    projectName,
    businessNeed,
    scopeDefinition,
    successCriteria
  });

  // Quality Gate: SMART objectives must be defined
  if (!objectivesAndCriteria.objectives || objectivesAndCriteria.objectives.length === 0) {
    await ctx.breakpoint({
      question: `No measurable objectives defined for ${projectName}. Define objectives before proceeding?`,
      title: 'Objectives Required',
      context: {
        runId: ctx.runId,
        recommendation: 'Define at least 3-5 SMART objectives with measurable success criteria'
      }
    });
  }

  // Phase 5: Constraints and Assumptions
  const constraintsAssumptions = await ctx.task(constraintsAssumptionsTask, {
    projectName,
    constraints,
    assumptions,
    scopeDefinition,
    businessContext
  });

  // Phase 6: High-Level Requirements
  const highLevelRequirements = await ctx.task(highLevelRequirementsTask, {
    projectName,
    scopeDefinition,
    objectivesAndCriteria,
    stakeholderAnalysis
  });

  // Phase 7: Risk Overview
  const riskOverview = await ctx.task(initialRiskOverviewTask, {
    projectName,
    scopeDefinition,
    constraintsAssumptions,
    stakeholderAnalysis
  });

  // Phase 8: Milestone Schedule
  const milestoneSchedule = await ctx.task(milestoneScheduleTask, {
    projectName,
    scopeDefinition,
    constraints,
    highLevelRequirements
  });

  // Phase 9: Budget Summary
  const budgetSummary = await ctx.task(budgetSummaryTask, {
    projectName,
    scopeDefinition,
    constraints,
    milestoneSchedule
  });

  // Phase 10: Governance Structure
  const governanceStructure = await ctx.task(governanceStructureTask, {
    projectName,
    stakeholderAnalysis,
    organizationalContext,
    budgetSummary
  });

  // Phase 11: Charter Document Generation
  const charterDocument = await ctx.task(charterDocumentGenerationTask, {
    projectName,
    businessContext,
    stakeholderAnalysis,
    scopeDefinition,
    objectivesAndCriteria,
    constraintsAssumptions,
    highLevelRequirements,
    riskOverview,
    milestoneSchedule,
    budgetSummary,
    governanceStructure
  });

  // Final Quality Gate: Charter completeness
  const charterCompletenessScore = charterDocument.completenessScore || 0;
  const ready = charterCompletenessScore >= 80;

  // Final Breakpoint: Charter Approval
  await ctx.breakpoint({
    question: `Project Charter complete for ${projectName}. Completeness: ${charterCompletenessScore}/100. Submit for sponsor approval?`,
    title: 'Charter Approval Review',
    context: {
      runId: ctx.runId,
      projectName,
      completeness: charterCompletenessScore,
      sponsor: governanceStructure.sponsor,
      approvalStatus: ready ? 'Ready for approval' : 'Needs refinement',
      files: [
        { path: `artifacts/project-charter.json`, format: 'json', content: charterDocument },
        { path: `artifacts/project-charter.md`, format: 'markdown', content: charterDocument.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    completenessScore: charterCompletenessScore,
    ready,
    charter: {
      document: charterDocument.charter,
      markdown: charterDocument.markdown,
      version: '1.0'
    },
    approvalStatus: ready ? 'pending-approval' : 'draft',
    keyDecisions: charterDocument.keyDecisions || [],
    stakeholders: stakeholderAnalysis.stakeholders,
    governance: governanceStructure,
    objectives: objectivesAndCriteria.objectives,
    scope: scopeDefinition,
    constraints: constraintsAssumptions.constraints,
    assumptions: constraintsAssumptions.assumptions,
    risks: riskOverview.topRisks,
    milestones: milestoneSchedule.milestones,
    budget: budgetSummary,
    recommendations: charterDocument.recommendations,
    metadata: {
      processId: 'specializations/domains/business/project-management/project-charter-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const businessContextAnalysisTask = defineTask('business-context-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Business Context Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Analyst with expertise in strategic project alignment',
      task: 'Analyze business context and establish project justification',
      context: {
        projectName: args.projectName,
        problemStatement: args.problemStatement,
        businessNeed: args.businessNeed,
        organizationalContext: args.organizationalContext
      },
      instructions: [
        '1. Analyze the problem statement and root causes',
        '2. Document the business need and opportunity',
        '3. Assess strategic alignment with organizational goals',
        '4. Identify key business drivers and market factors',
        '5. Evaluate impact of not doing the project (cost of delay)',
        '6. Define expected business benefits and value proposition',
        '7. Identify dependencies on other initiatives',
        '8. Assess organizational readiness',
        '9. Calculate strategic alignment score (0-100)',
        '10. Document business justification narrative'
      ],
      outputFormat: 'JSON object with business context analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['businessJustification', 'alignmentScore', 'strategicAlignment'],
      properties: {
        problemAnalysis: {
          type: 'object',
          properties: {
            statement: { type: 'string' },
            rootCauses: { type: 'array', items: { type: 'string' } },
            impactAreas: { type: 'array', items: { type: 'string' } }
          }
        },
        businessNeed: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            urgency: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            opportunity: { type: 'string' }
          }
        },
        strategicAlignment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strategicGoal: { type: 'string' },
              alignmentLevel: { type: 'string', enum: ['direct', 'supporting', 'indirect'] },
              contribution: { type: 'string' }
            }
          }
        },
        alignmentScore: { type: 'number', minimum: 0, maximum: 100 },
        businessDrivers: { type: 'array', items: { type: 'string' } },
        costOfDelay: { type: 'string' },
        expectedBenefits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              benefit: { type: 'string' },
              type: { type: 'string', enum: ['financial', 'operational', 'strategic', 'compliance'] },
              estimatedValue: { type: 'string' }
            }
          }
        },
        dependencies: { type: 'array', items: { type: 'string' } },
        organizationalReadiness: { type: 'string' },
        businessJustification: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['charter', 'initiation', 'business-context', 'strategic-alignment']
}));

export const stakeholderIdentificationTask = defineTask('stakeholder-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Stakeholder Identification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Stakeholder Management Specialist',
      task: 'Identify and categorize project stakeholders for charter documentation',
      context: {
        projectName: args.projectName,
        stakeholders: args.stakeholders,
        businessContext: args.businessContext,
        organizationalContext: args.organizationalContext
      },
      instructions: [
        '1. Identify all internal and external stakeholders',
        '2. Categorize stakeholders by type (sponsor, customer, team, etc.)',
        '3. Assess influence and interest levels',
        '4. Identify the project sponsor and their authority',
        '5. Document key decision makers',
        '6. Identify subject matter experts needed',
        '7. Note any stakeholder concerns or resistance',
        '8. Define initial communication needs',
        '9. Identify approval authorities',
        '10. Create preliminary stakeholder register'
      ],
      outputFormat: 'JSON object with stakeholder identification'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholders', 'sponsor', 'keyDecisionMakers'],
      properties: {
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              organization: { type: 'string' },
              category: { type: 'string', enum: ['sponsor', 'customer', 'team', 'supplier', 'regulator', 'other'] },
              influence: { type: 'string', enum: ['high', 'medium', 'low'] },
              interest: { type: 'string', enum: ['high', 'medium', 'low'] },
              expectations: { type: 'string' }
            }
          }
        },
        sponsor: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            title: { type: 'string' },
            authority: { type: 'string' },
            commitment: { type: 'string' }
          }
        },
        keyDecisionMakers: { type: 'array', items: { type: 'string' } },
        subjectMatterExperts: { type: 'array', items: { type: 'string' } },
        approvalAuthorities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              approvalType: { type: 'string' },
              threshold: { type: 'string' }
            }
          }
        },
        potentialResistance: { type: 'array', items: { type: 'string' } },
        communicationNeeds: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['charter', 'initiation', 'stakeholder-identification']
}));

export const scopeDefinitionTask = defineTask('scope-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Scope Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Manager with expertise in scope management',
      task: 'Define high-level project scope for the charter',
      context: {
        projectName: args.projectName,
        businessNeed: args.businessNeed,
        businessContext: args.businessContext,
        constraints: args.constraints
      },
      instructions: [
        '1. Define the project purpose and description',
        '2. Identify major deliverables and outcomes',
        '3. Define what is in scope (inclusions)',
        '4. Clearly state what is out of scope (exclusions)',
        '5. Identify scope boundaries and interfaces',
        '6. Define acceptance criteria for major deliverables',
        '7. Identify key product/service characteristics',
        '8. Note any scope-related assumptions',
        '9. Identify potential scope risks',
        '10. Document scope management approach'
      ],
      outputFormat: 'JSON object with scope definition'
    },
    outputSchema: {
      type: 'object',
      required: ['projectDescription', 'deliverables', 'inScope', 'outOfScope'],
      properties: {
        projectDescription: { type: 'string' },
        projectPurpose: { type: 'string' },
        deliverables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              deliverable: { type: 'string' },
              description: { type: 'string' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        inScope: { type: 'array', items: { type: 'string' } },
        outOfScope: { type: 'array', items: { type: 'string' } },
        boundaries: { type: 'array', items: { type: 'string' } },
        interfaces: { type: 'array', items: { type: 'string' } },
        productCharacteristics: { type: 'array', items: { type: 'string' } },
        scopeAssumptions: { type: 'array', items: { type: 'string' } },
        scopeRisks: { type: 'array', items: { type: 'string' } },
        scopeManagementApproach: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['charter', 'initiation', 'scope-definition']
}));

export const objectivesDefinitionTask = defineTask('objectives-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Objectives and Success Criteria - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Strategic Project Planner',
      task: 'Define measurable project objectives and success criteria',
      context: {
        projectName: args.projectName,
        businessNeed: args.businessNeed,
        scopeDefinition: args.scopeDefinition,
        successCriteria: args.successCriteria
      },
      instructions: [
        '1. Define SMART project objectives (Specific, Measurable, Achievable, Relevant, Time-bound)',
        '2. Link objectives to business needs and benefits',
        '3. Define quantifiable success criteria for each objective',
        '4. Establish key performance indicators (KPIs)',
        '5. Define project success measures (cost, schedule, scope, quality)',
        '6. Identify critical success factors',
        '7. Define benefits realization metrics',
        '8. Establish measurement methods and timing',
        '9. Define success thresholds (minimum acceptable outcomes)',
        '10. Document objective dependencies and priorities'
      ],
      outputFormat: 'JSON object with objectives and success criteria'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'successCriteria', 'kpis'],
      properties: {
        objectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objectiveId: { type: 'string' },
              statement: { type: 'string' },
              specific: { type: 'string' },
              measurable: { type: 'string' },
              achievable: { type: 'string' },
              relevant: { type: 'string' },
              timeBound: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              metric: { type: 'string' },
              target: { type: 'string' },
              threshold: { type: 'string' },
              measurementMethod: { type: 'string' }
            }
          }
        },
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kpi: { type: 'string' },
              baseline: { type: 'string' },
              target: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        criticalSuccessFactors: { type: 'array', items: { type: 'string' } },
        benefitsMetrics: { type: 'array', items: { type: 'string' } },
        objectivePriorities: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['charter', 'initiation', 'objectives', 'success-criteria']
}));

export const constraintsAssumptionsTask = defineTask('constraints-assumptions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Constraints and Assumptions - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Manager with expertise in constraint analysis',
      task: 'Document project constraints and assumptions',
      context: {
        projectName: args.projectName,
        constraints: args.constraints,
        assumptions: args.assumptions,
        scopeDefinition: args.scopeDefinition,
        businessContext: args.businessContext
      },
      instructions: [
        '1. Identify all project constraints (budget, schedule, resources, technology)',
        '2. Document regulatory and compliance constraints',
        '3. Identify organizational and policy constraints',
        '4. Document technical and infrastructure constraints',
        '5. List all project assumptions',
        '6. Validate assumptions with stakeholders',
        '7. Assess impact if assumptions prove false',
        '8. Identify constraint interdependencies',
        '9. Document constraint flexibility (fixed vs. flexible)',
        '10. Define assumption validation approach'
      ],
      outputFormat: 'JSON object with constraints and assumptions'
    },
    outputSchema: {
      type: 'object',
      required: ['constraints', 'assumptions'],
      properties: {
        constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraint: { type: 'string' },
              category: { type: 'string', enum: ['budget', 'schedule', 'resource', 'technical', 'regulatory', 'organizational'] },
              description: { type: 'string' },
              flexibility: { type: 'string', enum: ['fixed', 'flexible', 'negotiable'] },
              impact: { type: 'string' }
            }
          }
        },
        assumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              category: { type: 'string' },
              validated: { type: 'boolean' },
              riskIfFalse: { type: 'string' },
              validationApproach: { type: 'string' }
            }
          }
        },
        constraintInterdependencies: { type: 'array', items: { type: 'string' } },
        assumptionValidationPlan: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['charter', 'initiation', 'constraints', 'assumptions']
}));

export const highLevelRequirementsTask = defineTask('high-level-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: High-Level Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Requirements Analyst',
      task: 'Document high-level project requirements for the charter',
      context: {
        projectName: args.projectName,
        scopeDefinition: args.scopeDefinition,
        objectivesAndCriteria: args.objectivesAndCriteria,
        stakeholderAnalysis: args.stakeholderAnalysis
      },
      instructions: [
        '1. Identify high-level business requirements',
        '2. Document high-level functional requirements',
        '3. Identify key non-functional requirements (performance, security, etc.)',
        '4. Link requirements to objectives and deliverables',
        '5. Identify regulatory and compliance requirements',
        '6. Document integration requirements',
        '7. Note any known technical requirements',
        '8. Identify data and reporting requirements',
        '9. Document training and support requirements',
        '10. Prioritize requirements (must have, should have, nice to have)'
      ],
      outputFormat: 'JSON object with high-level requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['businessRequirements', 'functionalRequirements'],
      properties: {
        businessRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reqId: { type: 'string' },
              requirement: { type: 'string' },
              source: { type: 'string' },
              priority: { type: 'string', enum: ['must-have', 'should-have', 'nice-to-have'] }
            }
          }
        },
        functionalRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reqId: { type: 'string' },
              requirement: { type: 'string' },
              linkedDeliverable: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        nonFunctionalRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              requirement: { type: 'string' },
              specification: { type: 'string' }
            }
          }
        },
        complianceRequirements: { type: 'array', items: { type: 'string' } },
        integrationRequirements: { type: 'array', items: { type: 'string' } },
        dataRequirements: { type: 'array', items: { type: 'string' } },
        trainingRequirements: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['charter', 'initiation', 'requirements']
}));

export const initialRiskOverviewTask = defineTask('initial-risk-overview', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Risk Overview - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Manager',
      task: 'Develop initial risk overview for the project charter',
      context: {
        projectName: args.projectName,
        scopeDefinition: args.scopeDefinition,
        constraintsAssumptions: args.constraintsAssumptions,
        stakeholderAnalysis: args.stakeholderAnalysis
      },
      instructions: [
        '1. Identify high-level project risks',
        '2. Assess initial probability and impact',
        '3. Categorize risks (technical, schedule, resource, external)',
        '4. Identify top 5-10 risks for charter documentation',
        '5. Note any show-stopper risks requiring immediate attention',
        '6. Identify opportunities (positive risks)',
        '7. Document initial risk response strategies',
        '8. Assess overall project risk level',
        '9. Identify risk management approach',
        '10. Note risk-related assumptions'
      ],
      outputFormat: 'JSON object with risk overview'
    },
    outputSchema: {
      type: 'object',
      required: ['topRisks', 'overallRiskLevel'],
      properties: {
        topRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string', enum: ['technical', 'schedule', 'resource', 'cost', 'external', 'organizational'] },
              probability: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              initialResponse: { type: 'string' }
            }
          }
        },
        showStopperRisks: { type: 'array', items: { type: 'string' } },
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              probability: { type: 'string' },
              potentialBenefit: { type: 'string' }
            }
          }
        },
        overallRiskLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
        riskManagementApproach: { type: 'string' },
        riskAssumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['charter', 'initiation', 'risk-overview']
}));

export const milestoneScheduleTask = defineTask('milestone-schedule', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Milestone Schedule - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Scheduler',
      task: 'Develop high-level milestone schedule for the charter',
      context: {
        projectName: args.projectName,
        scopeDefinition: args.scopeDefinition,
        constraints: args.constraints,
        highLevelRequirements: args.highLevelRequirements
      },
      instructions: [
        '1. Define project phases and major milestones',
        '2. Estimate high-level timeline for each phase',
        '3. Identify key decision points and gates',
        '4. Define milestone criteria (what constitutes completion)',
        '5. Note any fixed date constraints',
        '6. Identify critical path dependencies',
        '7. Build in appropriate management reserves',
        '8. Consider resource availability constraints',
        '9. Align milestones with deliverables',
        '10. Document schedule assumptions'
      ],
      outputFormat: 'JSON object with milestone schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['milestones', 'projectDuration'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              description: { type: 'string' },
              estimatedDuration: { type: 'string' },
              keyActivities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestoneId: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              targetDate: { type: 'string' },
              criteria: { type: 'array', items: { type: 'string' } },
              deliverables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        decisionGates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gate: { type: 'string' },
              purpose: { type: 'string' },
              criteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        fixedDateConstraints: { type: 'array', items: { type: 'string' } },
        criticalDependencies: { type: 'array', items: { type: 'string' } },
        projectDuration: { type: 'string' },
        scheduleAssumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['charter', 'initiation', 'milestone-schedule']
}));

export const budgetSummaryTask = defineTask('budget-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Budget Summary - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Financial Analyst',
      task: 'Develop high-level budget summary for the charter',
      context: {
        projectName: args.projectName,
        scopeDefinition: args.scopeDefinition,
        constraints: args.constraints,
        milestoneSchedule: args.milestoneSchedule
      },
      instructions: [
        '1. Develop rough order of magnitude (ROM) budget estimate',
        '2. Break down by major cost categories (labor, materials, etc.)',
        '3. Identify funding source and authorization',
        '4. Include contingency reserve estimate',
        '5. Document budget constraints and limitations',
        '6. Identify any pre-approved expenditures',
        '7. Note cost estimation methodology used',
        '8. Define budget authority levels',
        '9. Document budget assumptions',
        '10. Identify cost-related risks'
      ],
      outputFormat: 'JSON object with budget summary'
    },
    outputSchema: {
      type: 'object',
      required: ['totalBudget', 'costCategories'],
      properties: {
        totalBudget: { type: 'number' },
        estimateClass: { type: 'string', enum: ['ROM', 'preliminary', 'budget'] },
        estimateAccuracy: { type: 'string' },
        costCategories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              estimate: { type: 'number' },
              percentOfTotal: { type: 'number' }
            }
          }
        },
        contingencyReserve: {
          type: 'object',
          properties: {
            amount: { type: 'number' },
            percentage: { type: 'number' },
            justification: { type: 'string' }
          }
        },
        fundingSource: { type: 'string' },
        fundingAuthorization: { type: 'string' },
        preApprovedExpenditures: { type: 'array', items: { type: 'string' } },
        budgetAuthority: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              threshold: { type: 'number' }
            }
          }
        },
        budgetAssumptions: { type: 'array', items: { type: 'string' } },
        costRisks: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['charter', 'initiation', 'budget-summary']
}));

export const governanceStructureTask = defineTask('governance-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Governance Structure - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Governance Specialist',
      task: 'Define project governance structure for the charter',
      context: {
        projectName: args.projectName,
        stakeholderAnalysis: args.stakeholderAnalysis,
        organizationalContext: args.organizationalContext,
        budgetSummary: args.budgetSummary
      },
      instructions: [
        '1. Define project sponsor role and responsibilities',
        '2. Establish steering committee composition and charter',
        '3. Define project manager authority and responsibilities',
        '4. Document key team roles and responsibilities',
        '5. Define decision-making processes and authorities',
        '6. Establish escalation pathways',
        '7. Define reporting structure and frequency',
        '8. Document change control governance',
        '9. Define meeting cadence and forums',
        '10. Establish communication protocols'
      ],
      outputFormat: 'JSON object with governance structure'
    },
    outputSchema: {
      type: 'object',
      required: ['sponsor', 'projectManager', 'decisionAuthority'],
      properties: {
        sponsor: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            title: { type: 'string' },
            responsibilities: { type: 'array', items: { type: 'string' } },
            decisionAuthority: { type: 'string' }
          }
        },
        steeringCommittee: {
          type: 'object',
          properties: {
            members: { type: 'array', items: { type: 'string' } },
            charter: { type: 'string' },
            meetingFrequency: { type: 'string' },
            decisionAuthority: { type: 'string' }
          }
        },
        projectManager: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            authority: { type: 'string' },
            responsibilities: { type: 'array', items: { type: 'string' } }
          }
        },
        keyRoles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              assignedTo: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        decisionAuthority: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decisionType: { type: 'string' },
              authority: { type: 'string' },
              escalationPath: { type: 'string' }
            }
          }
        },
        escalationPathways: { type: 'array', items: { type: 'string' } },
        reportingStructure: { type: 'string' },
        meetingCadence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              meeting: { type: 'string' },
              frequency: { type: 'string' },
              participants: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        changeControlGovernance: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['charter', 'initiation', 'governance']
}));

export const charterDocumentGenerationTask = defineTask('charter-document-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Charter Document Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Management Professional and Technical Writer',
      task: 'Generate comprehensive project charter document',
      context: {
        projectName: args.projectName,
        businessContext: args.businessContext,
        stakeholderAnalysis: args.stakeholderAnalysis,
        scopeDefinition: args.scopeDefinition,
        objectivesAndCriteria: args.objectivesAndCriteria,
        constraintsAssumptions: args.constraintsAssumptions,
        highLevelRequirements: args.highLevelRequirements,
        riskOverview: args.riskOverview,
        milestoneSchedule: args.milestoneSchedule,
        budgetSummary: args.budgetSummary,
        governanceStructure: args.governanceStructure
      },
      instructions: [
        '1. Compile all charter sections into cohesive document',
        '2. Write executive summary highlighting key points',
        '3. Ensure consistency across all sections',
        '4. Include signature blocks for approvals',
        '5. Add document control information (version, date)',
        '6. Generate both JSON and markdown versions',
        '7. Calculate charter completeness score',
        '8. Identify any gaps requiring attention',
        '9. Provide recommendations for improvement',
        '10. List key decisions documented in charter'
      ],
      outputFormat: 'JSON object with complete charter document'
    },
    outputSchema: {
      type: 'object',
      required: ['charter', 'markdown', 'completenessScore'],
      properties: {
        charter: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            projectOverview: { type: 'object' },
            businessJustification: { type: 'object' },
            scopeStatement: { type: 'object' },
            objectives: { type: 'array' },
            deliverables: { type: 'array' },
            constraints: { type: 'array' },
            assumptions: { type: 'array' },
            requirements: { type: 'object' },
            risks: { type: 'array' },
            milestones: { type: 'array' },
            budget: { type: 'object' },
            governance: { type: 'object' },
            approvalSection: { type: 'object' }
          }
        },
        markdown: { type: 'string' },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        gaps: { type: 'array', items: { type: 'string' } },
        keyDecisions: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        documentControl: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            date: { type: 'string' },
            author: { type: 'string' },
            status: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['charter', 'initiation', 'documentation']
}));
