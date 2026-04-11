/**
 * @process specializations/domains/business/project-management/team-formation-development
 * @description Team Formation and Development - Establish team structure, define roles and responsibilities
 * (RACI), create working agreements, and build high-performing team culture.
 * @inputs { projectName: string, teamMembers: array, projectScope: object, organizationalContext?: object }
 * @outputs { success: boolean, teamCharter: object, raciMatrix: object, developmentPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/team-formation-development', {
 *   projectName: 'Enterprise Platform Modernization',
 *   teamMembers: [{ name: 'Alice', role: 'Tech Lead' }, { name: 'Bob', role: 'Developer' }],
 *   projectScope: { deliverables: [...], timeline: '12 months' },
 *   organizationalContext: { culture: 'agile', remote: true }
 * });
 *
 * @references
 * - Five Dysfunctions of a Team: https://www.tablegroup.com/product/dysfunctions/
 * - PMI PMBOK Resource Management: https://www.pmi.org/pmbok-guide-standards/foundational/pmbok
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    teamMembers = [],
    projectScope,
    organizationalContext = {},
    teamModel = 'cross-functional',
    workingModel = 'hybrid'
  } = inputs;

  // Phase 1: Team Structure Design
  const teamStructure = await ctx.task(teamStructureDesignTask, {
    projectName,
    teamMembers,
    projectScope,
    teamModel,
    organizationalContext
  });

  // Quality Gate: Team structure must be defined
  if (!teamStructure.structure || !teamStructure.roles) {
    return {
      success: false,
      error: 'Team structure not properly defined',
      phase: 'structure-design',
      teamCharter: null
    };
  }

  // Breakpoint: Review team structure
  await ctx.breakpoint({
    question: `Team structure designed for ${projectName}. Team size: ${teamMembers.length}. Model: ${teamModel}. Proceed with role definition?`,
    title: 'Team Structure Review',
    context: {
      runId: ctx.runId,
      projectName,
      teamSize: teamMembers.length,
      model: teamModel,
      files: [{
        path: `artifacts/phase1-team-structure.json`,
        format: 'json',
        content: teamStructure
      }]
    }
  });

  // Phase 2: Role and Responsibility Definition
  const roleDefinition = await ctx.task(roleDefinitionTask, {
    projectName,
    teamStructure,
    projectScope
  });

  // Phase 3: RACI Matrix Development
  const raciMatrix = await ctx.task(raciMatrixDevelopmentTask, {
    projectName,
    teamMembers,
    roleDefinition,
    projectScope
  });

  // Phase 4: Skills Assessment
  const skillsAssessment = await ctx.task(skillsAssessmentTask, {
    projectName,
    teamMembers,
    roleDefinition,
    projectScope
  });

  // Quality Gate: Skills gaps identified
  const criticalGaps = skillsAssessment.gaps?.filter(g => g.severity === 'critical') || [];
  if (criticalGaps.length > 0) {
    await ctx.breakpoint({
      question: `${criticalGaps.length} critical skill gaps identified. Address before proceeding?`,
      title: 'Skills Gap Warning',
      context: {
        runId: ctx.runId,
        gaps: criticalGaps,
        recommendation: 'Plan training or additional hiring'
      }
    });
  }

  // Phase 5: Working Agreements Development
  const workingAgreements = await ctx.task(workingAgreementsDevelopmentTask, {
    projectName,
    teamMembers,
    workingModel,
    organizationalContext
  });

  // Phase 6: Communication Plan
  const teamCommunicationPlan = await ctx.task(teamCommunicationPlanTask, {
    projectName,
    teamStructure,
    workingAgreements,
    workingModel
  });

  // Phase 7: Team Development Plan
  const developmentPlan = await ctx.task(teamDevelopmentPlanTask, {
    projectName,
    skillsAssessment,
    teamStructure,
    projectScope
  });

  // Phase 8: Team Building Activities
  const teamBuildingPlan = await ctx.task(teamBuildingPlanTask, {
    projectName,
    teamMembers,
    workingModel,
    organizationalContext
  });

  // Phase 9: Performance Framework
  const performanceFramework = await ctx.task(performanceFrameworkTask, {
    projectName,
    roleDefinition,
    raciMatrix,
    projectScope
  });

  // Phase 10: Team Charter Generation
  const teamCharter = await ctx.task(teamCharterGenerationTask, {
    projectName,
    teamStructure,
    roleDefinition,
    raciMatrix,
    skillsAssessment,
    workingAgreements,
    teamCommunicationPlan,
    developmentPlan,
    teamBuildingPlan,
    performanceFramework
  });

  // Final Quality Gate
  const completenessScore = teamCharter.completenessScore || 0;
  const ready = completenessScore >= 80;

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Team formation complete for ${projectName}. Team size: ${teamMembers.length}. Completeness: ${completenessScore}/100. Approve team charter?`,
    title: 'Team Charter Approval',
    context: {
      runId: ctx.runId,
      projectName,
      teamSize: teamMembers.length,
      completeness: completenessScore,
      files: [
        { path: `artifacts/team-charter.json`, format: 'json', content: teamCharter },
        { path: `artifacts/team-charter.md`, format: 'markdown', content: teamCharter.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    completenessScore,
    ready,
    teamCharter: {
      document: teamCharter.charter,
      markdown: teamCharter.markdown,
      version: '1.0'
    },
    raciMatrix: raciMatrix.matrix,
    developmentPlan: {
      individualPlans: developmentPlan.individualPlans,
      teamGoals: developmentPlan.teamGoals,
      trainingSchedule: developmentPlan.trainingSchedule
    },
    teamStructure: teamStructure.structure,
    workingAgreements: workingAgreements.agreements,
    communicationPlan: teamCommunicationPlan,
    performanceFramework: performanceFramework,
    skillsGaps: skillsAssessment.gaps,
    recommendations: teamCharter.recommendations,
    metadata: {
      processId: 'specializations/domains/business/project-management/team-formation-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const teamStructureDesignTask = defineTask('team-structure-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Team Structure Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Organizational Development Specialist',
      task: 'Design optimal team structure for the project',
      context: {
        projectName: args.projectName,
        teamMembers: args.teamMembers,
        projectScope: args.projectScope,
        teamModel: args.teamModel,
        organizationalContext: args.organizationalContext
      },
      instructions: [
        '1. Analyze project scope and complexity',
        '2. Determine optimal team size',
        '3. Design team hierarchy and reporting lines',
        '4. Define sub-teams if needed',
        '5. Identify core vs extended team',
        '6. Define team interfaces with stakeholders',
        '7. Consider organizational constraints',
        '8. Design for collaboration and efficiency',
        '9. Document structure rationale',
        '10. Create organization chart'
      ],
      outputFormat: 'JSON object with team structure'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'roles'],
      properties: {
        structure: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            hierarchy: { type: 'array' },
            reportingLines: { type: 'array' },
            subTeams: { type: 'array' }
          }
        },
        roles: { type: 'array', items: { type: 'string' } },
        coreTeam: { type: 'array', items: { type: 'string' } },
        extendedTeam: { type: 'array', items: { type: 'string' } },
        interfaces: { type: 'array', items: { type: 'string' } },
        rationale: { type: 'string' },
        orgChart: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['team', 'structure', 'design']
}));

export const roleDefinitionTask = defineTask('role-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Role and Responsibility Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HR Business Partner',
      task: 'Define detailed roles and responsibilities for team members',
      context: {
        projectName: args.projectName,
        teamStructure: args.teamStructure,
        projectScope: args.projectScope
      },
      instructions: [
        '1. Define each role in the team',
        '2. Document key responsibilities for each role',
        '3. Define required skills and competencies',
        '4. Set authority levels for each role',
        '5. Define role interfaces and handoffs',
        '6. Document decision rights',
        '7. Define escalation authority',
        '8. Set accountability for deliverables',
        '9. Document role dependencies',
        '10. Create role cards/descriptions'
      ],
      outputFormat: 'JSON object with role definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['roles'],
      properties: {
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              roleId: { type: 'string' },
              title: { type: 'string' },
              purpose: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              authorities: { type: 'array', items: { type: 'string' } },
              requiredSkills: { type: 'array', items: { type: 'string' } },
              interfaces: { type: 'array', items: { type: 'string' } },
              decisionRights: { type: 'array', items: { type: 'string' } },
              escalationPath: { type: 'string' },
              assignedTo: { type: 'string' }
            }
          }
        },
        roleMatrix: { type: 'object' },
        handoffs: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['team', 'roles', 'responsibilities']
}));

export const raciMatrixDevelopmentTask = defineTask('raci-matrix-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: RACI Matrix Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Manager',
      task: 'Develop RACI matrix for project activities and deliverables',
      context: {
        projectName: args.projectName,
        teamMembers: args.teamMembers,
        roleDefinition: args.roleDefinition,
        projectScope: args.projectScope
      },
      instructions: [
        '1. List key project activities and decisions',
        '2. Identify Responsible (R) for each activity',
        '3. Identify Accountable (A) for each activity',
        '4. Identify who needs to be Consulted (C)',
        '5. Identify who needs to be Informed (I)',
        '6. Ensure only one A per activity',
        '7. Verify R is assigned for each activity',
        '8. Check for over-assignment',
        '9. Validate with team members',
        '10. Create RACI chart'
      ],
      outputFormat: 'JSON object with RACI matrix'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'activities'],
      properties: {
        matrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              assignments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    role: { type: 'string' },
                    assignment: { type: 'string', enum: ['R', 'A', 'C', 'I', '-'] }
                  }
                }
              }
            }
          }
        },
        activities: { type: 'array', items: { type: 'string' } },
        validationNotes: { type: 'array', items: { type: 'string' } },
        overAssignments: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['team', 'raci', 'accountability']
}));

export const skillsAssessmentTask = defineTask('skills-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Skills Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Learning and Development Specialist',
      task: 'Assess team skills and identify gaps',
      context: {
        projectName: args.projectName,
        teamMembers: args.teamMembers,
        roleDefinition: args.roleDefinition,
        projectScope: args.projectScope
      },
      instructions: [
        '1. Define required skills for project success',
        '2. Assess current skill levels of team members',
        '3. Identify skill gaps',
        '4. Prioritize gaps by severity',
        '5. Identify development opportunities',
        '6. Consider cross-training options',
        '7. Identify external training needs',
        '8. Document skill strengths',
        '9. Create skills matrix',
        '10. Recommend gap closure strategies'
      ],
      outputFormat: 'JSON object with skills assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['skillsMatrix', 'gaps'],
      properties: {
        skillsMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skill: { type: 'string' },
              required: { type: 'boolean' },
              teamCoverage: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    member: { type: 'string' },
                    level: { type: 'string', enum: ['expert', 'proficient', 'developing', 'none'] }
                  }
                }
              }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skill: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'significant', 'minor'] },
              affectedRoles: { type: 'array', items: { type: 'string' } },
              closureStrategy: { type: 'string' }
            }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        crossTrainingOpportunities: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['team', 'skills', 'assessment']
}));

export const workingAgreementsDevelopmentTask = defineTask('working-agreements-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Working Agreements Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Agile Coach / Team Facilitator',
      task: 'Develop team working agreements and norms',
      context: {
        projectName: args.projectName,
        teamMembers: args.teamMembers,
        workingModel: args.workingModel,
        organizationalContext: args.organizationalContext
      },
      instructions: [
        '1. Define core working hours and availability',
        '2. Set communication norms and response times',
        '3. Define meeting protocols and etiquette',
        '4. Establish decision-making process',
        '5. Set code review and quality standards',
        '6. Define conflict resolution approach',
        '7. Establish work-life balance guidelines',
        '8. Set documentation standards',
        '9. Define remote work protocols',
        '10. Document team values and principles'
      ],
      outputFormat: 'JSON object with working agreements'
    },
    outputSchema: {
      type: 'object',
      required: ['agreements'],
      properties: {
        agreements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              agreement: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        coreHours: { type: 'string' },
        communicationNorms: { type: 'array', items: { type: 'string' } },
        meetingProtocols: { type: 'array', items: { type: 'string' } },
        decisionProcess: { type: 'string' },
        conflictResolution: { type: 'string' },
        teamValues: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['team', 'working-agreements', 'norms']
}));

export const teamCommunicationPlanTask = defineTask('team-communication-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Team Communication Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Communications Specialist',
      task: 'Develop internal team communication plan',
      context: {
        projectName: args.projectName,
        teamStructure: args.teamStructure,
        workingAgreements: args.workingAgreements,
        workingModel: args.workingModel
      },
      instructions: [
        '1. Define communication channels and tools',
        '2. Set up meeting cadence (daily, weekly, etc.)',
        '3. Define information sharing protocols',
        '4. Establish status reporting format',
        '5. Set up knowledge sharing mechanisms',
        '6. Define escalation communication paths',
        '7. Create communication matrix',
        '8. Set up collaboration tools',
        '9. Define documentation repositories',
        '10. Plan team announcements approach'
      ],
      outputFormat: 'JSON object with communication plan'
    },
    outputSchema: {
      type: 'object',
      required: ['channels', 'meetingCadence'],
      properties: {
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              purpose: { type: 'string' },
              usage: { type: 'string' }
            }
          }
        },
        meetingCadence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              meeting: { type: 'string' },
              frequency: { type: 'string' },
              duration: { type: 'string' },
              participants: { type: 'array', items: { type: 'string' } },
              agenda: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        statusReporting: { type: 'object' },
        escalationPaths: { type: 'array', items: { type: 'string' } },
        tools: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['team', 'communication', 'planning']
}));

export const teamDevelopmentPlanTask = defineTask('team-development-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Team Development Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Learning and Development Manager',
      task: 'Create team and individual development plans',
      context: {
        projectName: args.projectName,
        skillsAssessment: args.skillsAssessment,
        teamStructure: args.teamStructure,
        projectScope: args.projectScope
      },
      instructions: [
        '1. Set team development goals',
        '2. Create individual development plans',
        '3. Identify training requirements',
        '4. Plan cross-training activities',
        '5. Schedule development activities',
        '6. Identify mentoring opportunities',
        '7. Set learning milestones',
        '8. Allocate development budget',
        '9. Define success measures',
        '10. Plan knowledge transfer activities'
      ],
      outputFormat: 'JSON object with development plan'
    },
    outputSchema: {
      type: 'object',
      required: ['teamGoals', 'individualPlans'],
      properties: {
        teamGoals: { type: 'array', items: { type: 'string' } },
        individualPlans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              member: { type: 'string' },
              currentSkills: { type: 'array', items: { type: 'string' } },
              developmentAreas: { type: 'array', items: { type: 'string' } },
              activities: { type: 'array', items: { type: 'string' } },
              timeline: { type: 'string' }
            }
          }
        },
        trainingSchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              training: { type: 'string' },
              participants: { type: 'array', items: { type: 'string' } },
              date: { type: 'string' },
              provider: { type: 'string' }
            }
          }
        },
        mentoringPairs: { type: 'array', items: { type: 'string' } },
        budget: { type: 'number' },
        successMeasures: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['team', 'development', 'training']
}));

export const teamBuildingPlanTask = defineTask('team-building-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Team Building Activities - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Team Coach',
      task: 'Plan team building and bonding activities',
      context: {
        projectName: args.projectName,
        teamMembers: args.teamMembers,
        workingModel: args.workingModel,
        organizationalContext: args.organizationalContext
      },
      instructions: [
        '1. Plan team kickoff activities',
        '2. Design icebreaker exercises',
        '3. Plan regular team bonding activities',
        '4. Consider virtual team building for remote teams',
        '5. Plan celebration milestones',
        '6. Design team rituals',
        '7. Plan retrospective formats',
        '8. Consider team outings/events',
        '9. Design collaboration exercises',
        '10. Plan recognition activities'
      ],
      outputFormat: 'JSON object with team building plan'
    },
    outputSchema: {
      type: 'object',
      required: ['activities'],
      properties: {
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              purpose: { type: 'string' },
              timing: { type: 'string' },
              format: { type: 'string', enum: ['in-person', 'virtual', 'hybrid'] },
              duration: { type: 'string' },
              facilitator: { type: 'string' }
            }
          }
        },
        kickoffAgenda: { type: 'array', items: { type: 'string' } },
        teamRituals: { type: 'array', items: { type: 'string' } },
        celebrationMilestones: { type: 'array', items: { type: 'string' } },
        recognitionProgram: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['team', 'team-building', 'culture']
}));

export const performanceFrameworkTask = defineTask('performance-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Performance Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Management Specialist',
      task: 'Establish team performance framework',
      context: {
        projectName: args.projectName,
        roleDefinition: args.roleDefinition,
        raciMatrix: args.raciMatrix,
        projectScope: args.projectScope
      },
      instructions: [
        '1. Define team performance metrics',
        '2. Set individual performance goals',
        '3. Establish feedback mechanisms',
        '4. Define performance review cadence',
        '5. Create recognition criteria',
        '6. Define performance improvement process',
        '7. Set accountability measures',
        '8. Define success criteria',
        '9. Plan performance conversations',
        '10. Document performance documentation approach'
      ],
      outputFormat: 'JSON object with performance framework'
    },
    outputSchema: {
      type: 'object',
      required: ['teamMetrics', 'feedbackMechanisms'],
      properties: {
        teamMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              measurement: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        individualGoals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              goals: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        feedbackMechanisms: { type: 'array', items: { type: 'string' } },
        reviewCadence: { type: 'string' },
        recognitionCriteria: { type: 'array', items: { type: 'string' } },
        improvementProcess: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['team', 'performance', 'framework']
}));

export const teamCharterGenerationTask = defineTask('team-charter-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Team Charter Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Manager and Technical Writer',
      task: 'Generate comprehensive team charter',
      context: {
        projectName: args.projectName,
        teamStructure: args.teamStructure,
        roleDefinition: args.roleDefinition,
        raciMatrix: args.raciMatrix,
        skillsAssessment: args.skillsAssessment,
        workingAgreements: args.workingAgreements,
        teamCommunicationPlan: args.teamCommunicationPlan,
        developmentPlan: args.developmentPlan,
        teamBuildingPlan: args.teamBuildingPlan,
        performanceFramework: args.performanceFramework
      },
      instructions: [
        '1. Compile team charter document',
        '2. Include team purpose and mission',
        '3. Document team structure and roles',
        '4. Include RACI matrix',
        '5. Document working agreements',
        '6. Include communication plan',
        '7. Document development plan',
        '8. Include team building activities',
        '9. Generate markdown version',
        '10. Calculate completeness score'
      ],
      outputFormat: 'JSON object with team charter'
    },
    outputSchema: {
      type: 'object',
      required: ['charter', 'markdown', 'completenessScore'],
      properties: {
        charter: {
          type: 'object',
          properties: {
            purpose: { type: 'string' },
            mission: { type: 'string' },
            structure: { type: 'object' },
            roles: { type: 'array' },
            raciMatrix: { type: 'object' },
            workingAgreements: { type: 'array' },
            communicationPlan: { type: 'object' },
            developmentPlan: { type: 'object' },
            performanceFramework: { type: 'object' }
          }
        },
        markdown: { type: 'string' },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        recommendations: { type: 'array', items: { type: 'string' } },
        documentControl: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            date: { type: 'string' },
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
  labels: ['team', 'charter', 'documentation']
}));
