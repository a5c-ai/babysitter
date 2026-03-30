/**
 * @process business-analysis/raci-matrix-development
 * @description Create Responsible-Accountable-Consulted-Informed matrices to clarify roles and responsibilities across processes, projects, and organizational functions. Support governance and decision-making clarity.
 * @inputs { projectName: string, activities: array, stakeholders: array, organizationStructure: object }
 * @outputs { success: boolean, raciMatrix: object, roleDefinitions: object, escalationProcedures: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    activities = [],
    stakeholders = [],
    organizationStructure = {},
    outputDir = 'raci-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting RACI Matrix Development for ${projectName}`);

  // ============================================================================
  // PHASE 1: ACTIVITY IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying activities and tasks');
  const activityIdentification = await ctx.task(activityIdentificationTask, {
    projectName,
    activities,
    outputDir
  });

  artifacts.push(...activityIdentification.artifacts);

  // ============================================================================
  // PHASE 2: ROLE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying roles');
  const roleIdentification = await ctx.task(roleIdentificationTask, {
    projectName,
    stakeholders,
    organizationStructure,
    activities: activityIdentification.activities,
    outputDir
  });

  artifacts.push(...roleIdentification.artifacts);

  // ============================================================================
  // PHASE 3: RACI ASSIGNMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Assigning RACI responsibilities');
  const raciAssignment = await ctx.task(raciAssignmentTask, {
    projectName,
    activities: activityIdentification.activities,
    roles: roleIdentification.roles,
    outputDir
  });

  artifacts.push(...raciAssignment.artifacts);

  // ============================================================================
  // PHASE 4: RACI VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Validating RACI assignments');
  const raciValidation = await ctx.task(raciValidationTask, {
    projectName,
    raciMatrix: raciAssignment.matrix,
    activities: activityIdentification.activities,
    roles: roleIdentification.roles,
    outputDir
  });

  artifacts.push(...raciValidation.artifacts);

  // ============================================================================
  // PHASE 5: ROLE DEFINITIONS
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating detailed role definitions');
  const roleDefinitions = await ctx.task(roleDefinitionsTask, {
    projectName,
    roles: roleIdentification.roles,
    raciMatrix: raciAssignment.matrix,
    outputDir
  });

  artifacts.push(...roleDefinitions.artifacts);

  // ============================================================================
  // PHASE 6: ESCALATION PROCEDURES
  // ============================================================================

  ctx.log('info', 'Phase 6: Defining escalation procedures');
  const escalationProcedures = await ctx.task(escalationProceduresTask, {
    projectName,
    raciMatrix: raciAssignment.matrix,
    roles: roleIdentification.roles,
    outputDir
  });

  artifacts.push(...escalationProcedures.artifacts);

  // Breakpoint: Review RACI
  await ctx.breakpoint({
    question: `RACI matrix complete for ${projectName}. Validation score: ${raciValidation.validationScore}/100. Review and approve?`,
    title: 'RACI Matrix Review',
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
        validationScore: raciValidation.validationScore,
        totalActivities: activityIdentification.activities?.length || 0,
        totalRoles: roleIdentification.roles?.length || 0,
        issues: raciValidation.issues?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 7: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating RACI documentation');
  const documentation = await ctx.task(raciDocumentationTask, {
    projectName,
    raciMatrix: raciAssignment.matrix,
    roleDefinitions: roleDefinitions.definitions,
    escalationProcedures: escalationProcedures.procedures,
    raciValidation,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    validationScore: raciValidation.validationScore,
    raciMatrix: {
      matrixPath: raciAssignment.matrixPath,
      matrix: raciAssignment.matrix,
      summary: raciAssignment.summary
    },
    roleDefinitions: {
      definitionsPath: roleDefinitions.definitionsPath,
      definitions: roleDefinitions.definitions
    },
    escalationProcedures: {
      proceduresPath: escalationProcedures.proceduresPath,
      procedures: escalationProcedures.procedures
    },
    validation: {
      score: raciValidation.validationScore,
      issues: raciValidation.issues,
      recommendations: raciValidation.recommendations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'business-analysis/raci-matrix-development',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const activityIdentificationTask = defineTask('activity-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify activities',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'process analyst with RACI expertise',
      task: 'Identify and define activities for RACI matrix',
      context: args,
      instructions: [
        'List all activities, tasks, and decisions to be included',
        'Group activities by phase or category',
        'Define activity descriptions clearly',
        'Ensure activities are at consistent level of detail',
        'Identify decision points requiring accountability',
        'Include milestone activities',
        'Identify recurring vs one-time activities',
        'Order activities logically',
        'Identify dependencies between activities',
        'Create activity catalog'
      ],
      outputFormat: 'JSON with activities, activityGroups, dependencies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['activities', 'artifacts'],
      properties: {
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              type: { type: 'string', enum: ['task', 'decision', 'milestone'] },
              frequency: { type: 'string' }
            }
          }
        },
        activityGroups: { type: 'object' },
        dependencies: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'raci', 'activities']
}));

export const roleIdentificationTask = defineTask('role-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify roles',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'organizational analyst',
      task: 'Identify roles for RACI matrix columns',
      context: args,
      instructions: [
        'Identify all roles involved in activities',
        'Use roles, not individual names',
        'Include internal and external roles',
        'Group related roles where appropriate',
        'Ensure role names are clear and consistent',
        'Identify role hierarchy',
        'Document role descriptions',
        'Map roles to organizational structure',
        'Identify substitute/backup roles',
        'Create role catalog'
      ],
      outputFormat: 'JSON with roles, roleHierarchy, roleDescriptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roles', 'artifacts'],
      properties: {
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              department: { type: 'string' },
              level: { type: 'string' },
              backup: { type: 'string' }
            }
          }
        },
        roleHierarchy: { type: 'object' },
        roleDescriptions: { type: 'object' },
        roleGroups: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'raci', 'roles']
}));

export const raciAssignmentTask = defineTask('raci-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assign RACI responsibilities',
  agent: {
    name: 'raci-specialist',
    prompt: {
      role: 'RACI matrix specialist',
      task: 'Assign RACI responsibilities for each activity-role combination',
      context: args,
      instructions: [
        'R = Responsible: Who does the work',
        'A = Accountable: Who is ultimately answerable (only ONE per activity)',
        'C = Consulted: Who provides input (two-way communication)',
        'I = Informed: Who needs to be kept updated (one-way communication)',
        'Ensure exactly one A per activity',
        'At least one R per activity',
        'Minimize C and I to essential stakeholders',
        'Consider workload balance across roles',
        'Document assignment rationale',
        'Create RACI matrix table'
      ],
      outputFormat: 'JSON with matrix, matrixPath, summary, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'matrixPath', 'artifacts'],
      properties: {
        matrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activityId: { type: 'string' },
              activityName: { type: 'string' },
              assignments: { type: 'object' }
            }
          }
        },
        matrixPath: { type: 'string' },
        summary: {
          type: 'object',
          properties: {
            totalActivities: { type: 'number' },
            totalRoles: { type: 'number' },
            rCount: { type: 'number' },
            aCount: { type: 'number' },
            cCount: { type: 'number' },
            iCount: { type: 'number' }
          }
        },
        rationale: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'raci', 'assignment']
}));

export const raciValidationTask = defineTask('raci-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate RACI matrix',
  agent: {
    name: 'raci-validator',
    prompt: {
      role: 'RACI quality analyst',
      task: 'Validate RACI matrix for completeness and correctness',
      context: args,
      instructions: [
        'Check each activity has exactly one A (Accountable)',
        'Check each activity has at least one R (Responsible)',
        'Check for activities with no assignments',
        'Check for roles with too many R assignments (overload)',
        'Check for roles with no assignments',
        'Identify activities with too many C assignments',
        'Check for A without R (Accountable but no one doing work)',
        'Verify consistency with organizational authority',
        'Calculate validation score',
        'Provide recommendations for issues'
      ],
      outputFormat: 'JSON with validationScore, issues, recommendations, statistics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'issues', 'artifacts'],
      properties: {
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
              activity: { type: 'string' },
              role: { type: 'string' },
              description: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        statistics: {
          type: 'object',
          properties: {
            activitiesWithoutA: { type: 'number' },
            activitiesWithMultipleA: { type: 'number' },
            activitiesWithoutR: { type: 'number' },
            overloadedRoles: { type: 'array', items: { type: 'string' } },
            unusedRoles: { type: 'array', items: { type: 'string' } }
          }
        },
        passed: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'raci', 'validation']
}));

export const roleDefinitionsTask = defineTask('role-definitions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create role definitions',
  agent: {
    name: 'organizational-analyst',
    prompt: {
      role: 'organizational design specialist',
      task: 'Create detailed role definitions document',
      context: args,
      instructions: [
        'Define responsibilities for each role',
        'Document authority levels',
        'Specify required skills and competencies',
        'Define decision-making authority',
        'Document reporting relationships',
        'Specify interaction patterns',
        'Define handoff procedures',
        'Document backup arrangements',
        'Specify escalation responsibilities',
        'Create role definition cards'
      ],
      outputFormat: 'JSON with definitions, definitionsPath, roleCards, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['definitions', 'definitionsPath', 'artifacts'],
      properties: {
        definitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              roleId: { type: 'string' },
              roleName: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              authority: { type: 'array', items: { type: 'string' } },
              skills: { type: 'array', items: { type: 'string' } },
              reportsTo: { type: 'string' },
              backup: { type: 'string' },
              raciSummary: { type: 'object' }
            }
          }
        },
        definitionsPath: { type: 'string' },
        roleCards: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'raci', 'role-definitions']
}));

export const escalationProceduresTask = defineTask('escalation-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define escalation procedures',
  agent: {
    name: 'governance-specialist',
    prompt: {
      role: 'governance and escalation specialist',
      task: 'Define escalation procedures for RACI-related issues',
      context: args,
      instructions: [
        'Define escalation triggers',
        'Create escalation paths by activity type',
        'Define escalation levels',
        'Specify response timeframes',
        'Document escalation contacts',
        'Define escalation communication templates',
        'Create decision escalation matrix',
        'Define conflict resolution procedures',
        'Document emergency escalation paths',
        'Create escalation flowchart'
      ],
      outputFormat: 'JSON with procedures, proceduresPath, escalationPaths, contactMatrix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['procedures', 'proceduresPath', 'artifacts'],
      properties: {
        procedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trigger: { type: 'string' },
              level: { type: 'number' },
              escalateTo: { type: 'string' },
              timeframe: { type: 'string' },
              action: { type: 'string' }
            }
          }
        },
        proceduresPath: { type: 'string' },
        escalationPaths: { type: 'array', items: { type: 'object' } },
        contactMatrix: { type: 'object' },
        conflictResolution: { type: 'object' },
        emergencyProcedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'raci', 'escalation']
}));

export const raciDocumentationTask = defineTask('raci-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate RACI documentation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'technical documentation specialist',
      task: 'Generate comprehensive RACI documentation package',
      context: args,
      instructions: [
        'Create RACI matrix document',
        'Include role definitions',
        'Include escalation procedures',
        'Add usage guidelines',
        'Include RACI legend and definitions',
        'Create visual matrix representation',
        'Document maintenance process',
        'Include approval signatures',
        'Create distribution list',
        'Add version control information'
      ],
      outputFormat: 'JSON with documentPath, sections, visualizations, maintenanceProcess, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'sections', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'object' } },
        visualizations: { type: 'array', items: { type: 'string' } },
        guidelines: { type: 'object' },
        maintenanceProcess: { type: 'object' },
        distributionList: { type: 'array', items: { type: 'string' } },
        versionInfo: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'raci', 'documentation']
}));
