/**
 * @process ba-consulting-engagement-planning
 * @description Comprehensive consulting engagement planning process using McKinsey-style structured
 * problem solving, work planning, and resource allocation for business analysis consulting projects.
 * @inputs {
 *   engagementContext: { clientName: string, industry: string, engagementType: string },
 *   problemStatement: string,
 *   scope: { inScope: string[], outOfScope: string[], constraints: string[] },
 *   timeline: { startDate: string, endDate: string, milestones: object[] },
 *   teamStructure: { roles: object[], skills: string[] },
 *   existingDocuments: string[]
 * }
 * @outputs {
 *   engagementCharter: object,
 *   workPlan: object,
 *   resourcePlan: object,
 *   riskRegister: object,
 *   governanceFramework: object,
 *   qualityPlan: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Task definitions
export const engagementScopingTask = defineTask('engagement-scoping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Engagement Scope and Objectives',
  agent: {
    name: 'consulting-engagement-planner',
    prompt: {
      role: 'Senior Management Consultant specializing in engagement planning and scoping',
      task: 'Define comprehensive engagement scope, objectives, and success criteria using McKinsey-style structured approach',
      context: args,
      instructions: [
        'Review client context and industry background',
        'Analyze and refine problem statement using issue trees',
        'Define SMART engagement objectives',
        'Establish clear scope boundaries (in/out of scope)',
        'Identify key stakeholders and decision makers',
        'Define success criteria and KPIs',
        'Identify assumptions and constraints',
        'Create initial hypothesis tree'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        problemDefinition: {
          type: 'object',
          properties: {
            refinedStatement: { type: 'string' },
            rootCauses: { type: 'array', items: { type: 'string' } },
            issueTree: { type: 'object' },
            hypotheses: { type: 'array', items: { type: 'object' } }
          }
        },
        objectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              specific: { type: 'string' },
              measurable: { type: 'string' },
              achievable: { type: 'string' },
              relevant: { type: 'string' },
              timeBound: { type: 'string' }
            }
          }
        },
        scopeDefinition: {
          type: 'object',
          properties: {
            inScope: { type: 'array', items: { type: 'string' } },
            outOfScope: { type: 'array', items: { type: 'string' } },
            boundaries: { type: 'array', items: { type: 'string' } },
            interfaces: { type: 'array', items: { type: 'string' } }
          }
        },
        successCriteria: { type: 'array', items: { type: 'object' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } }
      },
      required: ['problemDefinition', 'objectives', 'scopeDefinition', 'successCriteria']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const workPlanDevelopmentTask = defineTask('work-plan-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Detailed Work Plan',
  agent: {
    name: 'work-plan-developer',
    prompt: {
      role: 'Project Planning Specialist with consulting firm experience',
      task: 'Create comprehensive work plan with work breakdown structure, dependencies, and milestones',
      context: args,
      instructions: [
        'Create work breakdown structure (WBS)',
        'Define work streams and modules',
        'Identify task dependencies and critical path',
        'Estimate effort for each work package',
        'Define milestones and checkpoints',
        'Create Gantt chart structure',
        'Identify parallel workstreams',
        'Plan for stakeholder reviews and approvals'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        workBreakdownStructure: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phaseId: { type: 'string' },
                  phaseName: { type: 'string' },
                  workPackages: { type: 'array', items: { type: 'object' } }
                }
              }
            }
          }
        },
        workstreams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              lead: { type: 'string' },
              tasks: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              date: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        criticalPath: { type: 'array', items: { type: 'string' } },
        ganttStructure: { type: 'object' }
      },
      required: ['workBreakdownStructure', 'workstreams', 'milestones']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const resourcePlanningTask = defineTask('resource-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Resource Allocation',
  agent: {
    name: 'resource-planner',
    prompt: {
      role: 'Resource Management Specialist in consulting environments',
      task: 'Create resource plan with team staffing, skills matrix, and utilization projections',
      context: args,
      instructions: [
        'Define team structure and roles',
        'Create skills matrix and requirements',
        'Map resources to work packages',
        'Plan resource loading and utilization',
        'Identify skill gaps and training needs',
        'Plan for knowledge transfer',
        'Define escalation paths',
        'Create RACI for key activities'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        teamStructure: {
          type: 'object',
          properties: {
            orgChart: { type: 'object' },
            roles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string' },
                  responsibilities: { type: 'array', items: { type: 'string' } },
                  skills: { type: 'array', items: { type: 'string' } },
                  allocation: { type: 'string' }
                }
              }
            }
          }
        },
        skillsMatrix: { type: 'object' },
        resourceAllocation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              role: { type: 'string' },
              workPackages: { type: 'array', items: { type: 'string' } },
              utilization: { type: 'number' }
            }
          }
        },
        raciMatrix: { type: 'object' },
        gapAnalysis: { type: 'object' }
      },
      required: ['teamStructure', 'resourceAllocation', 'raciMatrix']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const riskPlanningTask = defineTask('risk-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Risk Management Plan',
  agent: {
    name: 'risk-planner',
    prompt: {
      role: 'Risk Management Specialist for consulting engagements',
      task: 'Create comprehensive risk register with mitigation strategies and contingency plans',
      context: args,
      instructions: [
        'Identify engagement-specific risks',
        'Categorize risks (technical, organizational, resource, external)',
        'Assess probability and impact',
        'Calculate risk scores and prioritize',
        'Develop mitigation strategies',
        'Create contingency plans',
        'Define risk triggers and monitoring',
        'Establish risk review cadence'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        riskRegister: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              probability: { type: 'string' },
              impact: { type: 'string' },
              riskScore: { type: 'number' },
              mitigation: { type: 'string' },
              contingency: { type: 'string' },
              owner: { type: 'string' },
              trigger: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        riskMatrix: { type: 'object' },
        topRisks: { type: 'array', items: { type: 'object' } },
        monitoringPlan: { type: 'object' }
      },
      required: ['riskRegister', 'topRisks']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const governanceFrameworkTask = defineTask('governance-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish Governance Framework',
  agent: {
    name: 'governance-designer',
    prompt: {
      role: 'Engagement Governance Specialist',
      task: 'Design governance framework including decision rights, escalation paths, and meeting cadence',
      context: args,
      instructions: [
        'Define governance structure and bodies',
        'Establish decision rights and authority levels',
        'Create escalation procedures',
        'Define meeting cadence and agenda templates',
        'Establish reporting requirements',
        'Define change control process',
        'Create communication protocols',
        'Design issue resolution process'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        governanceStructure: {
          type: 'object',
          properties: {
            steeringCommittee: { type: 'object' },
            workingGroup: { type: 'object' },
            projectTeam: { type: 'object' }
          }
        },
        decisionFramework: {
          type: 'object',
          properties: {
            decisionTypes: { type: 'array', items: { type: 'object' } },
            authorityLevels: { type: 'array', items: { type: 'object' } }
          }
        },
        escalationPath: { type: 'array', items: { type: 'object' } },
        meetingCadence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              meetingType: { type: 'string' },
              frequency: { type: 'string' },
              participants: { type: 'array', items: { type: 'string' } },
              agenda: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        changeControl: { type: 'object' },
        reportingRequirements: { type: 'array', items: { type: 'object' } }
      },
      required: ['governanceStructure', 'decisionFramework', 'meetingCadence']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const qualityPlanTask = defineTask('quality-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Quality Management Plan',
  agent: {
    name: 'quality-planner',
    prompt: {
      role: 'Quality Assurance Specialist for consulting deliverables',
      task: 'Develop quality management plan with standards, reviews, and acceptance criteria',
      context: args,
      instructions: [
        'Define quality standards and expectations',
        'Establish deliverable templates and formats',
        'Create quality review process',
        'Define acceptance criteria for each deliverable',
        'Plan quality reviews and checkpoints',
        'Establish peer review process',
        'Define rework procedures',
        'Create quality metrics and reporting'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        qualityStandards: { type: 'array', items: { type: 'object' } },
        deliverableTemplates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              deliverable: { type: 'string' },
              template: { type: 'string' },
              format: { type: 'string' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        reviewProcess: {
          type: 'object',
          properties: {
            stages: { type: 'array', items: { type: 'object' } },
            reviewers: { type: 'array', items: { type: 'string' } },
            criteria: { type: 'array', items: { type: 'string' } }
          }
        },
        qualityMetrics: { type: 'array', items: { type: 'object' } },
        qualityGates: { type: 'array', items: { type: 'object' } }
      },
      required: ['qualityStandards', 'deliverableTemplates', 'reviewProcess']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const charterConsolidationTask = defineTask('charter-consolidation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Consolidate Engagement Charter',
  agent: {
    name: 'charter-consolidator',
    prompt: {
      role: 'Senior Engagement Manager',
      task: 'Consolidate all planning elements into comprehensive engagement charter document',
      context: args,
      instructions: [
        'Compile executive summary',
        'Integrate scope and objectives',
        'Include work plan summary',
        'Summarize resource requirements',
        'Include governance overview',
        'Add risk summary',
        'Include quality standards',
        'Create sign-off section'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        engagementCharter: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            clientInformation: { type: 'object' },
            engagementOverview: { type: 'object' },
            scopeAndObjectives: { type: 'object' },
            approach: { type: 'object' },
            timeline: { type: 'object' },
            teamAndResources: { type: 'object' },
            governance: { type: 'object' },
            risks: { type: 'object' },
            quality: { type: 'object' },
            commercials: { type: 'object' },
            signOff: { type: 'object' }
          }
        },
        approvalRequirements: { type: 'array', items: { type: 'object' } }
      },
      required: ['engagementCharter']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// Main process function
export async function process(inputs, ctx) {
  ctx.log('Starting Consulting Engagement Planning process');

  const artifacts = {
    scopeDefinition: null,
    workPlan: null,
    resourcePlan: null,
    riskRegister: null,
    governanceFramework: null,
    qualityPlan: null,
    engagementCharter: null
  };

  // Phase 1: Engagement Scoping
  ctx.log('Phase 1: Defining engagement scope and objectives');
  const scopeResult = await ctx.task(engagementScopingTask, {
    engagementContext: inputs.engagementContext,
    problemStatement: inputs.problemStatement,
    scope: inputs.scope,
    timeline: inputs.timeline,
    existingDocuments: inputs.existingDocuments
  });
  artifacts.scopeDefinition = scopeResult;

  // Phase 2: Work Plan Development
  ctx.log('Phase 2: Developing detailed work plan');
  const workPlanResult = await ctx.task(workPlanDevelopmentTask, {
    scopeDefinition: artifacts.scopeDefinition,
    timeline: inputs.timeline,
    teamStructure: inputs.teamStructure
  });
  artifacts.workPlan = workPlanResult;

  // Phase 3: Resource Planning
  ctx.log('Phase 3: Planning resource allocation');
  const resourceResult = await ctx.task(resourcePlanningTask, {
    scopeDefinition: artifacts.scopeDefinition,
    workPlan: artifacts.workPlan,
    teamStructure: inputs.teamStructure
  });
  artifacts.resourcePlan = resourceResult;

  // Phase 4: Risk Planning
  ctx.log('Phase 4: Developing risk management plan');
  const riskResult = await ctx.task(riskPlanningTask, {
    scopeDefinition: artifacts.scopeDefinition,
    workPlan: artifacts.workPlan,
    resourcePlan: artifacts.resourcePlan,
    engagementContext: inputs.engagementContext
  });
  artifacts.riskRegister = riskResult;

  // Phase 5: Governance Framework
  ctx.log('Phase 5: Establishing governance framework');
  const governanceResult = await ctx.task(governanceFrameworkTask, {
    scopeDefinition: artifacts.scopeDefinition,
    workPlan: artifacts.workPlan,
    resourcePlan: artifacts.resourcePlan,
    engagementContext: inputs.engagementContext
  });
  artifacts.governanceFramework = governanceResult;

  // Phase 6: Quality Planning
  ctx.log('Phase 6: Creating quality management plan');
  const qualityResult = await ctx.task(qualityPlanTask, {
    scopeDefinition: artifacts.scopeDefinition,
    workPlan: artifacts.workPlan,
    governanceFramework: artifacts.governanceFramework
  });
  artifacts.qualityPlan = qualityResult;

  // Breakpoint for plan review
  await ctx.breakpoint('engagement-plan-review', {
    question: 'Review the engagement planning artifacts. Are all components complete and aligned?',
    artifacts: artifacts
  });

  // Phase 7: Charter Consolidation
  ctx.log('Phase 7: Consolidating engagement charter');
  const charterResult = await ctx.task(charterConsolidationTask, {
    engagementContext: inputs.engagementContext,
    scopeDefinition: artifacts.scopeDefinition,
    workPlan: artifacts.workPlan,
    resourcePlan: artifacts.resourcePlan,
    riskRegister: artifacts.riskRegister,
    governanceFramework: artifacts.governanceFramework,
    qualityPlan: artifacts.qualityPlan
  });
  artifacts.engagementCharter = charterResult;

  ctx.log('Consulting Engagement Planning process completed');

  return {
    success: true,
    engagementCharter: artifacts.engagementCharter,
    workPlan: artifacts.workPlan,
    resourcePlan: artifacts.resourcePlan,
    riskRegister: artifacts.riskRegister,
    governanceFramework: artifacts.governanceFramework,
    qualityPlan: artifacts.qualityPlan,
    artifacts
  };
}
