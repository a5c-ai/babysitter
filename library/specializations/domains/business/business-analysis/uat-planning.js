/**
 * @process business-analysis/uat-planning
 * @description Design and coordinate User Acceptance Testing to validate that delivered solutions meet business requirements. Develop test scenarios, acceptance criteria, and defect management processes.
 * @inputs { projectName: string, requirements: array, solution: object, stakeholders: array, testEnvironment: object }
 * @outputs { success: boolean, uatPlan: object, testScenarios: array, acceptanceCriteria: object, defectProcess: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    requirements = [],
    solution = {},
    stakeholders = [],
    testEnvironment = {},
    outputDir = 'uat-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting UAT Planning for ${projectName}`);

  // ============================================================================
  // PHASE 1: UAT SCOPE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining UAT scope');
  const scopeDefinition = await ctx.task(uatScopeDefinitionTask, {
    projectName,
    requirements,
    solution,
    stakeholders,
    outputDir
  });

  artifacts.push(...scopeDefinition.artifacts);

  // ============================================================================
  // PHASE 2: ACCEPTANCE CRITERIA DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing acceptance criteria');
  const acceptanceCriteria = await ctx.task(acceptanceCriteriaDevelopmentTask, {
    projectName,
    requirements,
    scopeDefinition,
    outputDir
  });

  artifacts.push(...acceptanceCriteria.artifacts);

  // ============================================================================
  // PHASE 3: TEST SCENARIO CREATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating test scenarios');
  const testScenarios = await ctx.task(testScenarioCreationTask, {
    projectName,
    requirements,
    acceptanceCriteria,
    solution,
    outputDir
  });

  artifacts.push(...testScenarios.artifacts);

  // ============================================================================
  // PHASE 4: TEST DATA PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 4: Planning test data');
  const testDataPlanning = await ctx.task(testDataPlanningTask, {
    projectName,
    testScenarios,
    testEnvironment,
    outputDir
  });

  artifacts.push(...testDataPlanning.artifacts);

  // ============================================================================
  // PHASE 5: TESTER SELECTION AND TRAINING
  // ============================================================================

  ctx.log('info', 'Phase 5: Planning tester selection and training');
  const testerPlanning = await ctx.task(testerPlanningTask, {
    projectName,
    stakeholders,
    testScenarios,
    outputDir
  });

  artifacts.push(...testerPlanning.artifacts);

  // ============================================================================
  // PHASE 6: DEFECT MANAGEMENT PROCESS
  // ============================================================================

  ctx.log('info', 'Phase 6: Defining defect management process');
  const defectManagement = await ctx.task(defectManagementTask, {
    projectName,
    stakeholders,
    outputDir
  });

  artifacts.push(...defectManagement.artifacts);

  // ============================================================================
  // PHASE 7: UAT SCHEDULE
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating UAT schedule');
  const uatSchedule = await ctx.task(uatScheduleTask, {
    projectName,
    testScenarios,
    testerPlanning,
    testEnvironment,
    outputDir
  });

  artifacts.push(...uatSchedule.artifacts);

  // ============================================================================
  // PHASE 8: UAT PLAN DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating UAT plan document');
  const uatPlan = await ctx.task(uatPlanDocumentTask, {
    projectName,
    scopeDefinition,
    acceptanceCriteria,
    testScenarios,
    testDataPlanning,
    testerPlanning,
    defectManagement,
    uatSchedule,
    outputDir
  });

  artifacts.push(...uatPlan.artifacts);

  // Breakpoint: Review UAT plan
  await ctx.breakpoint({
    question: `UAT plan complete for ${projectName}. ${testScenarios.scenarios?.length || 0} test scenarios created. Review and approve?`,
    title: 'UAT Plan Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        projectName,
        testScenarios: testScenarios.scenarios?.length || 0,
        acceptanceCriteria: acceptanceCriteria.criteria?.length || 0,
        estimatedDuration: uatSchedule.totalDuration
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    uatPlan: {
      planPath: uatPlan.planPath,
      scope: scopeDefinition.scope,
      objectives: scopeDefinition.objectives
    },
    testScenarios: {
      total: testScenarios.scenarios?.length || 0,
      scenarios: testScenarios.scenarios,
      coverage: testScenarios.coverage
    },
    acceptanceCriteria: {
      criteria: acceptanceCriteria.criteria,
      matrix: acceptanceCriteria.criteriaMatrix
    },
    defectProcess: {
      processPath: defectManagement.processPath,
      workflow: defectManagement.workflow,
      severityLevels: defectManagement.severityLevels
    },
    schedule: {
      totalDuration: uatSchedule.totalDuration,
      phases: uatSchedule.phases,
      milestones: uatSchedule.milestones
    },
    artifacts,
    duration,
    metadata: {
      processId: 'business-analysis/uat-planning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const uatScopeDefinitionTask = defineTask('uat-scope-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define UAT scope',
  agent: {
    name: 'qa-analyst',
    prompt: {
      role: 'senior QA analyst with UAT expertise',
      task: 'Define scope and objectives for User Acceptance Testing',
      context: args,
      instructions: [
        'Define UAT objectives aligned with business requirements',
        'Identify in-scope functionality',
        'Identify out-of-scope items',
        'Define entry criteria for UAT',
        'Define exit criteria for UAT',
        'Identify key stakeholders and their roles',
        'Define UAT success criteria',
        'Identify assumptions and constraints',
        'Define UAT environment requirements',
        'Create scope document'
      ],
      outputFormat: 'JSON with scope, objectives, entryCriteria, exitCriteria, successCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scope', 'objectives', 'entryCriteria', 'exitCriteria', 'artifacts'],
      properties: {
        scope: {
          type: 'object',
          properties: {
            inScope: { type: 'array', items: { type: 'string' } },
            outOfScope: { type: 'array', items: { type: 'string' } }
          }
        },
        objectives: { type: 'array', items: { type: 'string' } },
        entryCriteria: { type: 'array', items: { type: 'string' } },
        exitCriteria: { type: 'array', items: { type: 'string' } },
        successCriteria: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'uat', 'scope']
}));

export const acceptanceCriteriaDevelopmentTask = defineTask('acceptance-criteria-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop acceptance criteria',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'business analyst with acceptance testing expertise',
      task: 'Develop comprehensive acceptance criteria for UAT',
      context: args,
      instructions: [
        'Create acceptance criteria for each requirement',
        'Use Given-When-Then format where applicable',
        'Define measurable pass/fail criteria',
        'Include functional acceptance criteria',
        'Include non-functional acceptance criteria',
        'Include user experience criteria',
        'Define edge case criteria',
        'Create acceptance criteria matrix',
        'Map criteria to requirements',
        'Validate criteria with stakeholders'
      ],
      outputFormat: 'JSON with criteria, criteriaMatrix, functionalCriteria, nfCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'criteriaMatrix', 'artifacts'],
      properties: {
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              requirementId: { type: 'string' },
              criterion: { type: 'string' },
              type: { type: 'string', enum: ['functional', 'non-functional', 'ux'] },
              passCriteria: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        criteriaMatrix: { type: 'object' },
        functionalCriteria: { type: 'array', items: { type: 'object' } },
        nfCriteria: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'uat', 'acceptance-criteria']
}));

export const testScenarioCreationTask = defineTask('test-scenario-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create test scenarios',
  agent: {
    name: 'test-analyst',
    prompt: {
      role: 'test scenario designer',
      task: 'Create comprehensive UAT test scenarios',
      context: args,
      instructions: [
        'Create end-to-end business process scenarios',
        'Include happy path scenarios',
        'Include alternative flow scenarios',
        'Include error handling scenarios',
        'Create step-by-step test procedures',
        'Define expected results for each step',
        'Map scenarios to acceptance criteria',
        'Identify test data requirements',
        'Estimate execution time per scenario',
        'Calculate requirements coverage'
      ],
      outputFormat: 'JSON with scenarios, coverage, happyPaths, alternativeFlows, errorScenarios, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'coverage', 'artifacts'],
      properties: {
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string', enum: ['happy-path', 'alternative', 'error'] },
              preconditions: { type: 'array', items: { type: 'string' } },
              steps: { type: 'array', items: { type: 'object' } },
              expectedResult: { type: 'string' },
              estimatedTime: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        coverage: {
          type: 'object',
          properties: {
            requirementsCovered: { type: 'number' },
            criteriaCovered: { type: 'number' },
            coveragePercentage: { type: 'number' }
          }
        },
        happyPaths: { type: 'array', items: { type: 'string' } },
        alternativeFlows: { type: 'array', items: { type: 'string' } },
        errorScenarios: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'uat', 'test-scenarios']
}));

export const testDataPlanningTask = defineTask('test-data-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan test data',
  agent: {
    name: 'test-data-analyst',
    prompt: {
      role: 'test data management specialist',
      task: 'Plan test data for UAT execution',
      context: args,
      instructions: [
        'Identify test data requirements per scenario',
        'Define test data sources',
        'Plan data creation/generation approach',
        'Address data privacy/masking requirements',
        'Define data refresh strategy',
        'Create test data templates',
        'Identify boundary value data',
        'Plan negative test data',
        'Document data dependencies',
        'Create test data management plan'
      ],
      outputFormat: 'JSON with dataRequirements, dataSources, dataTemplates, privacyApproach, managementPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dataRequirements', 'managementPlan', 'artifacts'],
      properties: {
        dataRequirements: { type: 'array', items: { type: 'object' } },
        dataSources: { type: 'array', items: { type: 'string' } },
        dataTemplates: { type: 'array', items: { type: 'object' } },
        privacyApproach: { type: 'object' },
        refreshStrategy: { type: 'object' },
        managementPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'uat', 'test-data']
}));

export const testerPlanningTask = defineTask('tester-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan tester selection and training',
  agent: {
    name: 'uat-coordinator',
    prompt: {
      role: 'UAT coordination specialist',
      task: 'Plan UAT tester selection, assignment, and training',
      context: args,
      instructions: [
        'Identify tester requirements and skills',
        'Select testers from business stakeholders',
        'Assign scenarios to testers',
        'Plan tester training sessions',
        'Create tester training materials',
        'Define tester responsibilities',
        'Plan tester availability',
        'Create backup tester plan',
        'Define support structure for testers',
        'Create tester communication plan'
      ],
      outputFormat: 'JSON with testerRequirements, testerAssignments, trainingPlan, trainingMaterials, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['testerRequirements', 'testerAssignments', 'trainingPlan', 'artifacts'],
      properties: {
        testerRequirements: { type: 'object' },
        testerAssignments: { type: 'array', items: { type: 'object' } },
        trainingPlan: {
          type: 'object',
          properties: {
            sessions: { type: 'array', items: { type: 'object' } },
            duration: { type: 'string' },
            topics: { type: 'array', items: { type: 'string' } }
          }
        },
        trainingMaterials: { type: 'array', items: { type: 'string' } },
        supportStructure: { type: 'object' },
        communicationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'uat', 'tester-planning']
}));

export const defectManagementTask = defineTask('defect-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define defect management',
  agent: {
    name: 'defect-manager',
    prompt: {
      role: 'defect management specialist',
      task: 'Define defect management process for UAT',
      context: args,
      instructions: [
        'Define defect logging process',
        'Define severity and priority levels',
        'Create defect workflow states',
        'Define defect triage process',
        'Assign defect resolution responsibilities',
        'Define defect SLAs by severity',
        'Create defect reporting templates',
        'Define escalation procedures',
        'Plan defect tracking tools',
        'Create defect management documentation'
      ],
      outputFormat: 'JSON with processPath, workflow, severityLevels, slas, triageProcess, templates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['processPath', 'workflow', 'severityLevels', 'artifacts'],
      properties: {
        processPath: { type: 'string' },
        workflow: {
          type: 'object',
          properties: {
            states: { type: 'array', items: { type: 'string' } },
            transitions: { type: 'array', items: { type: 'object' } }
          }
        },
        severityLevels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              description: { type: 'string' },
              sla: { type: 'string' }
            }
          }
        },
        slas: { type: 'object' },
        triageProcess: { type: 'object' },
        templates: { type: 'array', items: { type: 'object' } },
        escalationProcedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'uat', 'defect-management']
}));

export const uatScheduleTask = defineTask('uat-schedule', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create UAT schedule',
  agent: {
    name: 'uat-planner',
    prompt: {
      role: 'UAT scheduling specialist',
      task: 'Create detailed UAT execution schedule',
      context: args,
      instructions: [
        'Define UAT phases (preparation, execution, closure)',
        'Create detailed timeline',
        'Allocate scenarios to testing days',
        'Plan parallel testing activities',
        'Include buffer for defect fixes',
        'Define milestones and checkpoints',
        'Plan daily status meetings',
        'Create resource calendar',
        'Define go/no-go decision points',
        'Create schedule visualization'
      ],
      outputFormat: 'JSON with totalDuration, phases, milestones, dailySchedule, resourceCalendar, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalDuration', 'phases', 'milestones', 'artifacts'],
      properties: {
        totalDuration: { type: 'string' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              startDate: { type: 'string' },
              endDate: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        milestones: { type: 'array', items: { type: 'object' } },
        dailySchedule: { type: 'object' },
        resourceCalendar: { type: 'object' },
        goNoGoPoints: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'uat', 'scheduling']
}));

export const uatPlanDocumentTask = defineTask('uat-plan-document', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate UAT plan document',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'test documentation specialist',
      task: 'Generate comprehensive UAT plan document',
      context: args,
      instructions: [
        'Create UAT plan following IEEE 29119 structure',
        'Include executive summary',
        'Document scope and objectives',
        'Include test scenarios',
        'Document acceptance criteria',
        'Include schedule and milestones',
        'Document roles and responsibilities',
        'Include defect management process',
        'Document entry and exit criteria',
        'Add appendices for templates'
      ],
      outputFormat: 'JSON with planPath, executiveSummary, sections, appendices, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['planPath', 'sections', 'artifacts'],
      properties: {
        planPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        sections: { type: 'array', items: { type: 'object' } },
        appendices: { type: 'array', items: { type: 'string' } },
        wordCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'uat', 'documentation']
}));
