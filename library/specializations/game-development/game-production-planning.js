/**
 * @process specializations/game-development/game-production-planning
 * @description Game Production Planning Process - Create comprehensive production plan with milestones, schedules,
 * resource allocation, team structure, risk management, and tracking tools for successful game development delivery.
 * @inputs { projectName: string, targetPlatforms?: array, teamSize?: number, developmentDuration?: string, milestones?: array, outputDir?: string }
 * @outputs { success: boolean, productionPlanPath: string, schedulePath: string, resourcePlan: object, riskRegister: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/game-development/game-production-planning', {
 *   projectName: 'Stellar Odyssey',
 *   targetPlatforms: ['PC', 'PlayStation 5', 'Xbox Series X'],
 *   teamSize: 25,
 *   developmentDuration: '24 months',
 *   milestones: ['vertical-slice', 'alpha', 'beta', 'gold']
 * });
 *
 * @references
 * - Agile Game Development with Scrum by Clinton Keith
 * - The Game Production Handbook by Heather Maxwell Chandler
 * - Blood, Sweat, and Pixels by Jason Schreier
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetPlatforms = ['PC'],
    teamSize = 10,
    developmentDuration = '18 months',
    milestones = ['prototype', 'vertical-slice', 'alpha', 'beta', 'gold'],
    budget = 'not-specified',
    methodology = 'agile-scrum',
    sprintLength = '2 weeks',
    outputDir = 'production-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Game Production Planning: ${projectName}`);
  ctx.log('info', `Team Size: ${teamSize}, Duration: ${developmentDuration}, Platforms: ${targetPlatforms.join(', ')}`);

  // ============================================================================
  // PHASE 1: PROJECT SCOPE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Project Scope and Feature Definition');

  const scopeDefinition = await ctx.task(scopeDefinitionTask, {
    projectName,
    targetPlatforms,
    developmentDuration,
    budget,
    outputDir
  });

  artifacts.push(...scopeDefinition.artifacts);

  // ============================================================================
  // PHASE 2: TEAM STRUCTURE AND ROLES
  // ============================================================================

  ctx.log('info', 'Phase 2: Team Structure and Role Definition');

  const teamStructure = await ctx.task(teamStructureTask, {
    projectName,
    teamSize,
    scopeDefinition,
    targetPlatforms,
    outputDir
  });

  artifacts.push(...teamStructure.artifacts);

  // Quality Gate: Team structure review
  await ctx.breakpoint({
    question: `Team structure defined for ${projectName}. ${teamStructure.totalHeadcount} total roles across ${teamStructure.disciplineCount} disciplines. Review team org chart?`,
    title: 'Team Structure Review',
    context: {
      runId: ctx.runId,
      projectName,
      totalHeadcount: teamStructure.totalHeadcount,
      disciplines: teamStructure.disciplines,
      keyRoles: teamStructure.keyRoles,
      files: [{ path: teamStructure.orgChartPath, format: 'svg', label: 'Org Chart' }]
    }
  });

  // ============================================================================
  // PHASE 3: MILESTONE PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Milestone Definition and Schedule');

  const milestonePlanning = await ctx.task(milestonePlanningTask, {
    projectName,
    milestones,
    developmentDuration,
    scopeDefinition,
    outputDir
  });

  artifacts.push(...milestonePlanning.artifacts);

  // ============================================================================
  // PHASE 4: DETAILED SCHEDULE CREATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Detailed Schedule and Task Breakdown');

  const detailedSchedule = await ctx.task(detailedScheduleTask, {
    projectName,
    milestonePlanning,
    teamStructure,
    methodology,
    sprintLength,
    outputDir
  });

  artifacts.push(...detailedSchedule.artifacts);

  // ============================================================================
  // PHASE 5: RESOURCE ALLOCATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Resource Allocation and Capacity Planning');

  const resourceAllocation = await ctx.task(resourceAllocationTask, {
    projectName,
    teamStructure,
    detailedSchedule,
    budget,
    outputDir
  });

  artifacts.push(...resourceAllocation.artifacts);

  // ============================================================================
  // PHASE 6: DEPENDENCY MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 6: Cross-Discipline Dependency Mapping');

  const dependencyMapping = await ctx.task(dependencyMappingTask, {
    projectName,
    detailedSchedule,
    teamStructure,
    outputDir
  });

  artifacts.push(...dependencyMapping.artifacts);

  // Quality Gate: Dependency review
  if (dependencyMapping.criticalDependencies.length > 0) {
    await ctx.breakpoint({
      question: `${dependencyMapping.criticalDependencies.length} critical dependencies identified in ${projectName}. Review dependency map and mitigation strategies?`,
      title: 'Critical Dependencies Review',
      context: {
        runId: ctx.runId,
        criticalDependencies: dependencyMapping.criticalDependencies,
        bottlenecks: dependencyMapping.bottlenecks,
        mitigations: dependencyMapping.mitigations,
        files: [{ path: dependencyMapping.dependencyMapPath, format: 'svg', label: 'Dependency Map' }]
      }
    });
  }

  // ============================================================================
  // PHASE 7: RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Risk Assessment and Mitigation Planning');

  const riskAssessment = await ctx.task(riskAssessmentTask, {
    projectName,
    scopeDefinition,
    teamStructure,
    detailedSchedule,
    dependencyMapping,
    targetPlatforms,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // ============================================================================
  // PHASE 8: COMMUNICATION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 8: Communication Protocols and Meeting Cadence');

  const communicationPlan = await ctx.task(communicationPlanTask, {
    projectName,
    teamStructure,
    methodology,
    sprintLength,
    outputDir
  });

  artifacts.push(...communicationPlan.artifacts);

  // ============================================================================
  // PHASE 9: TRACKING AND TOOLS SETUP
  // ============================================================================

  ctx.log('info', 'Phase 9: Project Tracking Tools and Metrics Setup');

  const trackingSetup = await ctx.task(trackingSetupTask, {
    projectName,
    methodology,
    milestonePlanning,
    teamStructure,
    outputDir
  });

  artifacts.push(...trackingSetup.artifacts);

  // ============================================================================
  // PHASE 10: PRODUCTION PLAN DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Production Plan Documentation');

  const productionPlanDoc = await ctx.task(productionPlanDocTask, {
    projectName,
    scopeDefinition,
    teamStructure,
    milestonePlanning,
    detailedSchedule,
    resourceAllocation,
    dependencyMapping,
    riskAssessment,
    communicationPlan,
    trackingSetup,
    outputDir
  });

  artifacts.push(...productionPlanDoc.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Production Planning complete for ${projectName}. ${milestonePlanning.milestoneCount} milestones, ${detailedSchedule.totalTasks} tasks, ${riskAssessment.riskCount} identified risks. Ready to begin production?`,
    title: 'Production Planning Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        targetPlatforms,
        teamSize: teamStructure.totalHeadcount,
        developmentDuration,
        milestoneCount: milestonePlanning.milestoneCount,
        totalTasks: detailedSchedule.totalTasks,
        riskCount: riskAssessment.riskCount,
        highRisks: riskAssessment.highRisks.length
      },
      files: [
        { path: productionPlanDoc.productionPlanPath, format: 'markdown', label: 'Production Plan' },
        { path: detailedSchedule.schedulePath, format: 'gantt', label: 'Project Schedule' },
        { path: riskAssessment.riskRegisterPath, format: 'xlsx', label: 'Risk Register' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    productionPlanPath: productionPlanDoc.productionPlanPath,
    schedulePath: detailedSchedule.schedulePath,
    scope: {
      featureCount: scopeDefinition.featureCount,
      mvpFeatures: scopeDefinition.mvpFeatures,
      stretchFeatures: scopeDefinition.stretchFeatures
    },
    team: {
      totalHeadcount: teamStructure.totalHeadcount,
      disciplines: teamStructure.disciplines,
      orgChartPath: teamStructure.orgChartPath
    },
    schedule: {
      milestones: milestonePlanning.milestones,
      totalTasks: detailedSchedule.totalTasks,
      criticalPath: detailedSchedule.criticalPath
    },
    resourcePlan: {
      allocationSummary: resourceAllocation.allocationSummary,
      budgetBreakdown: resourceAllocation.budgetBreakdown
    },
    riskRegister: riskAssessment.risks,
    communication: {
      meetingCadence: communicationPlan.meetingCadence,
      channels: communicationPlan.channels
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/game-development/game-production-planning',
      timestamp: startTime,
      projectName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const scopeDefinitionTask = defineTask('scope-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Scope Definition - ${args.projectName}`,
  agent: {
    name: 'game-producer-agent',
    prompt: {
      role: 'Executive Producer',
      task: 'Define project scope and feature list',
      context: args,
      instructions: [
        '1. Define complete feature list from GDD',
        '2. Categorize features as MVP vs stretch',
        '3. Estimate scope in content units',
        '4. Define platform-specific requirements',
        '5. Identify technical constraints',
        '6. Define quality bar and targets',
        '7. Estimate total content volume',
        '8. Create scope document',
        '9. Identify scope risks',
        '10. Document scope definition'
      ],
      outputFormat: 'JSON with scope definition'
    },
    outputSchema: {
      type: 'object',
      required: ['featureCount', 'mvpFeatures', 'stretchFeatures', 'artifacts'],
      properties: {
        featureCount: { type: 'number' },
        mvpFeatures: { type: 'array', items: { type: 'object' } },
        stretchFeatures: { type: 'array', items: { type: 'object' } },
        platformRequirements: { type: 'array', items: { type: 'object' } },
        contentVolume: { type: 'object' },
        qualityTargets: { type: 'object' },
        scopeDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'production', 'scope']
}));

export const teamStructureTask = defineTask('team-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Team Structure - ${args.projectName}`,
  agent: {
    name: 'game-producer-agent',
    prompt: {
      role: 'Production Director',
      task: 'Define team structure and roles',
      context: args,
      instructions: [
        '1. Define required disciplines',
        '2. Calculate headcount per discipline',
        '3. Define key leadership roles',
        '4. Create reporting structure',
        '5. Plan for contractors/outsourcing',
        '6. Define role responsibilities',
        '7. Identify skill gaps',
        '8. Create hiring plan if needed',
        '9. Create org chart',
        '10. Document team structure'
      ],
      outputFormat: 'JSON with team structure'
    },
    outputSchema: {
      type: 'object',
      required: ['totalHeadcount', 'disciplineCount', 'disciplines', 'keyRoles', 'orgChartPath', 'artifacts'],
      properties: {
        totalHeadcount: { type: 'number' },
        disciplineCount: { type: 'number' },
        disciplines: { type: 'array', items: { type: 'object' } },
        keyRoles: { type: 'array', items: { type: 'object' } },
        outsourcingPlan: { type: 'object' },
        hiringPlan: { type: 'array', items: { type: 'object' } },
        orgChartPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'production', 'team']
}));

export const milestonePlanningTask = defineTask('milestone-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Milestone Planning - ${args.projectName}`,
  agent: {
    name: 'game-producer-agent',
    prompt: {
      role: 'Senior Producer',
      task: 'Define milestones and acceptance criteria',
      context: args,
      instructions: [
        '1. Define milestone dates and durations',
        '2. Create acceptance criteria for each milestone',
        '3. Define vertical slice scope',
        '4. Define alpha requirements',
        '5. Define beta requirements',
        '6. Define gold master criteria',
        '7. Plan certification timeline',
        '8. Create milestone schedule',
        '9. Define review processes',
        '10. Document milestone plan'
      ],
      outputFormat: 'JSON with milestone planning'
    },
    outputSchema: {
      type: 'object',
      required: ['milestones', 'milestoneCount', 'artifacts'],
      properties: {
        milestones: { type: 'array', items: { type: 'object' } },
        milestoneCount: { type: 'number' },
        acceptanceCriteria: { type: 'object' },
        certificationTimeline: { type: 'object' },
        reviewProcesses: { type: 'array', items: { type: 'object' } },
        milestoneSchedulePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'production', 'milestones']
}));

export const detailedScheduleTask = defineTask('detailed-schedule', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Detailed Schedule - ${args.projectName}`,
  agent: {
    name: 'scrum-master-games-agent',
    prompt: {
      role: 'Project Manager',
      task: 'Create detailed task schedule',
      context: args,
      instructions: [
        '1. Break down features into tasks',
        '2. Estimate task durations',
        '3. Assign tasks to sprints',
        '4. Identify critical path',
        '5. Add buffer time for risks',
        '6. Create Gantt chart',
        '7. Plan parallel workstreams',
        '8. Schedule integration points',
        '9. Plan playtest milestones',
        '10. Document detailed schedule'
      ],
      outputFormat: 'JSON with detailed schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTasks', 'criticalPath', 'schedulePath', 'artifacts'],
      properties: {
        totalTasks: { type: 'number' },
        criticalPath: { type: 'array', items: { type: 'string' } },
        sprintPlan: { type: 'array', items: { type: 'object' } },
        bufferAllocation: { type: 'object' },
        parallelWorkstreams: { type: 'array', items: { type: 'object' } },
        schedulePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'production', 'schedule']
}));

export const resourceAllocationTask = defineTask('resource-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Resource Allocation - ${args.projectName}`,
  agent: {
    name: 'game-producer-agent',
    prompt: {
      role: 'Resource Manager',
      task: 'Allocate resources across project',
      context: args,
      instructions: [
        '1. Map team members to tasks',
        '2. Calculate capacity utilization',
        '3. Identify over/under allocation',
        '4. Plan for peak periods',
        '5. Allocate budget to disciplines',
        '6. Plan equipment and tools',
        '7. Allocate outsourcing budget',
        '8. Plan for contingency',
        '9. Create resource plan',
        '10. Document allocation'
      ],
      outputFormat: 'JSON with resource allocation'
    },
    outputSchema: {
      type: 'object',
      required: ['allocationSummary', 'budgetBreakdown', 'artifacts'],
      properties: {
        allocationSummary: { type: 'object' },
        budgetBreakdown: { type: 'object' },
        capacityUtilization: { type: 'object' },
        peakPeriods: { type: 'array', items: { type: 'object' } },
        contingencyBudget: { type: 'number' },
        resourcePlanPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'production', 'resources']
}));

export const dependencyMappingTask = defineTask('dependency-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Dependency Mapping - ${args.projectName}`,
  agent: {
    name: 'scrum-master-games-agent',
    prompt: {
      role: 'Project Manager',
      task: 'Map cross-discipline dependencies',
      context: args,
      instructions: [
        '1. Identify all task dependencies',
        '2. Map cross-discipline handoffs',
        '3. Identify critical dependencies',
        '4. Find potential bottlenecks',
        '5. Plan mitigation strategies',
        '6. Create dependency diagram',
        '7. Schedule sync points',
        '8. Plan integration builds',
        '9. Identify parallel opportunities',
        '10. Document dependencies'
      ],
      outputFormat: 'JSON with dependency mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalDependencies', 'bottlenecks', 'mitigations', 'dependencyMapPath', 'artifacts'],
      properties: {
        criticalDependencies: { type: 'array', items: { type: 'object' } },
        bottlenecks: { type: 'array', items: { type: 'object' } },
        mitigations: { type: 'array', items: { type: 'object' } },
        syncPoints: { type: 'array', items: { type: 'object' } },
        dependencyMapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'production', 'dependencies']
}));

export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Risk Assessment - ${args.projectName}`,
  agent: {
    name: 'game-producer-agent',
    prompt: {
      role: 'Risk Manager',
      task: 'Assess and plan for project risks',
      context: args,
      instructions: [
        '1. Identify all project risks',
        '2. Assess risk probability and impact',
        '3. Categorize risks by type',
        '4. Prioritize high risks',
        '5. Develop mitigation strategies',
        '6. Create contingency plans',
        '7. Assign risk owners',
        '8. Plan risk monitoring',
        '9. Create risk register',
        '10. Document risk assessment'
      ],
      outputFormat: 'JSON with risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'riskCount', 'highRisks', 'riskRegisterPath', 'artifacts'],
      properties: {
        risks: { type: 'array', items: { type: 'object' } },
        riskCount: { type: 'number' },
        highRisks: { type: 'array', items: { type: 'object' } },
        mediumRisks: { type: 'array', items: { type: 'object' } },
        mitigationPlans: { type: 'array', items: { type: 'object' } },
        riskRegisterPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'production', 'risks']
}));

export const communicationPlanTask = defineTask('communication-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Communication Plan - ${args.projectName}`,
  agent: {
    name: 'game-producer-agent',
    prompt: {
      role: 'Producer',
      task: 'Define communication protocols',
      context: args,
      instructions: [
        '1. Define meeting cadence (dailies, weeklies)',
        '2. Plan discipline-specific meetings',
        '3. Define communication channels',
        '4. Create escalation procedures',
        '5. Plan stakeholder updates',
        '6. Define documentation standards',
        '7. Plan review meetings',
        '8. Set up feedback channels',
        '9. Define decision-making process',
        '10. Document communication plan'
      ],
      outputFormat: 'JSON with communication plan'
    },
    outputSchema: {
      type: 'object',
      required: ['meetingCadence', 'channels', 'artifacts'],
      properties: {
        meetingCadence: { type: 'array', items: { type: 'object' } },
        channels: { type: 'array', items: { type: 'object' } },
        escalationProcedures: { type: 'array', items: { type: 'object' } },
        stakeholderUpdates: { type: 'object' },
        documentationStandards: { type: 'array', items: { type: 'string' } },
        commPlanPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'production', 'communication']
}));

export const trackingSetupTask = defineTask('tracking-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Tracking Setup - ${args.projectName}`,
  agent: {
    name: 'scrum-master-games-agent',
    prompt: {
      role: 'Project Manager',
      task: 'Set up project tracking tools and metrics',
      context: args,
      instructions: [
        '1. Select project management tools (Jira, etc.)',
        '2. Configure sprint boards and workflows',
        '3. Set up milestone tracking',
        '4. Define key metrics and KPIs',
        '5. Configure burndown charts',
        '6. Set up bug tracking',
        '7. Create dashboards and reports',
        '8. Define definition of done',
        '9. Plan retrospectives',
        '10. Document tracking setup'
      ],
      outputFormat: 'JSON with tracking setup'
    },
    outputSchema: {
      type: 'object',
      required: ['tools', 'metrics', 'dashboards', 'artifacts'],
      properties: {
        tools: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'array', items: { type: 'object' } },
        dashboards: { type: 'array', items: { type: 'object' } },
        workflows: { type: 'array', items: { type: 'object' } },
        definitionOfDone: { type: 'array', items: { type: 'string' } },
        trackingGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'production', 'tracking']
}));

export const productionPlanDocTask = defineTask('production-plan-doc', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Production Plan Document - ${args.projectName}`,
  agent: {
    name: 'technical-documentation-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Create comprehensive production plan document',
      context: args,
      instructions: [
        '1. Compile executive summary',
        '2. Document project scope',
        '3. Include team structure and roles',
        '4. Document milestone schedule',
        '5. Include resource allocation',
        '6. Document dependencies',
        '7. Include risk register',
        '8. Document communication plan',
        '9. Include tracking approach',
        '10. Create living production plan'
      ],
      outputFormat: 'JSON with document details'
    },
    outputSchema: {
      type: 'object',
      required: ['productionPlanPath', 'artifacts'],
      properties: {
        productionPlanPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        appendices: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'production', 'documentation']
}));
