/**
 * @process specializations/domains/business/project-management/program-dependency-management
 * @description Program Dependency Management - Identify, track, and manage dependencies between
 * projects within a program, coordinate cross-project activities, and mitigate dependency risks.
 * @inputs { programName: string, projects: array, dependencies: array, timeline: object }
 * @outputs { success: boolean, dependencyMap: object, coordinationPlan: object, riskMitigation: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/program-dependency-management', {
 *   programName: 'Digital Transformation',
 *   projects: [{ id: 'P001', name: 'API Platform' }, { id: 'P002', name: 'Mobile App' }],
 *   dependencies: [{ from: 'P001', to: 'P002', type: 'finish-to-start' }],
 *   timeline: { startDate: '2025-01-01', endDate: '2025-12-31' }
 * });
 *
 * @references
 * - PMI Program Management: https://www.pmi.org/pmbok-guide-standards/foundational/program-management
 * - SAFe Dependencies: https://scaledagileframework.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    programName,
    projects = [],
    dependencies = [],
    timeline = {},
    stakeholders = [],
    constraints = {}
  } = inputs;

  // Phase 1: Dependency Identification
  const dependencyIdentification = await ctx.task(dependencyIdentificationTask, {
    programName,
    projects,
    existingDependencies: dependencies
  });

  // Phase 2: Dependency Mapping
  const dependencyMapping = await ctx.task(dependencyMappingTask, {
    programName,
    projects,
    dependencies: dependencyIdentification.allDependencies
  });

  // Breakpoint: Review dependency map
  const criticalDependencies = dependencyMapping.criticalPath || [];
  await ctx.breakpoint({
    question: `Dependency map created for ${programName}. ${criticalDependencies.length} dependencies on critical path. Review and validate?`,
    title: 'Dependency Map Review',
    context: {
      runId: ctx.runId,
      programName,
      files: [{
        path: `artifacts/dependency-map.json`,
        format: 'json',
        content: dependencyMapping
      }]
    }
  });

  // Phase 3: Dependency Analysis
  const dependencyAnalysis = await ctx.task(dependencyAnalysisTask, {
    programName,
    dependencyMap: dependencyMapping,
    timeline,
    constraints
  });

  // Phase 4: Risk Assessment
  const riskAssessment = await ctx.task(dependencyRiskTask, {
    programName,
    dependencyMap: dependencyMapping,
    analysis: dependencyAnalysis
  });

  // Phase 5: Coordination Planning
  const coordinationPlan = await ctx.task(coordinationPlanTask, {
    programName,
    projects,
    dependencyMap: dependencyMapping,
    stakeholders
  });

  // Phase 6: Integration Points
  const integrationPoints = await ctx.task(integrationPointsTask, {
    programName,
    dependencies: dependencyMapping.dependencies,
    coordinationPlan
  });

  // Phase 7: Mitigation Strategies
  const mitigationStrategies = await ctx.task(mitigationStrategiesTask, {
    programName,
    risks: riskAssessment.risks,
    dependencyMap: dependencyMapping
  });

  // Phase 8: Monitoring Framework
  const monitoringFramework = await ctx.task(monitoringFrameworkTask, {
    programName,
    dependencyMap: dependencyMapping,
    integrationPoints,
    mitigationStrategies
  });

  // Phase 9: Program Documentation
  const programDocumentation = await ctx.task(programDocumentationTask, {
    programName,
    dependencyMapping,
    dependencyAnalysis,
    riskAssessment,
    coordinationPlan,
    integrationPoints,
    mitigationStrategies,
    monitoringFramework
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Program dependency management complete for ${programName}. ${dependencyMapping.dependencies?.length || 0} dependencies tracked, ${riskAssessment.risks?.length || 0} risks identified. Approve management plan?`,
    title: 'Program Dependency Approval',
    context: {
      runId: ctx.runId,
      programName,
      files: [
        { path: `artifacts/program-dependencies.json`, format: 'json', content: programDocumentation },
        { path: `artifacts/program-dependencies.md`, format: 'markdown', content: programDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    programName,
    dependencyMap: dependencyMapping,
    coordinationPlan: coordinationPlan,
    riskMitigation: mitigationStrategies.strategies,
    integrationPoints: integrationPoints.points,
    monitoring: monitoringFramework,
    documentation: programDocumentation,
    metadata: {
      processId: 'specializations/domains/business/project-management/program-dependency-management',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const dependencyIdentificationTask = defineTask('dependency-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Dependency Identification - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Program Analyst',
      task: 'Identify all program dependencies',
      context: {
        programName: args.programName,
        projects: args.projects,
        existingDependencies: args.existingDependencies
      },
      instructions: [
        '1. Review all projects',
        '2. Identify technical dependencies',
        '3. Identify resource dependencies',
        '4. Find data dependencies',
        '5. Identify organizational dependencies',
        '6. Document external dependencies',
        '7. Classify dependency types',
        '8. Validate with project teams',
        '9. Document assumptions',
        '10. Compile dependency list'
      ],
      outputFormat: 'JSON object with identified dependencies'
    },
    outputSchema: {
      type: 'object',
      required: ['allDependencies'],
      properties: {
        allDependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              from: { type: 'string' },
              to: { type: 'string' },
              type: { type: 'string' },
              category: { type: 'string' }
            }
          }
        },
        externalDependencies: { type: 'array' },
        assumptions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['program', 'dependency', 'identification']
}));

export const dependencyMappingTask = defineTask('dependency-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Dependency Mapping - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Dependency Mapper',
      task: 'Create dependency map',
      context: {
        programName: args.programName,
        projects: args.projects,
        dependencies: args.dependencies
      },
      instructions: [
        '1. Create dependency graph',
        '2. Map relationships',
        '3. Identify dependency chains',
        '4. Find critical path',
        '5. Identify circular dependencies',
        '6. Calculate dependency depth',
        '7. Create visual map',
        '8. Document interfaces',
        '9. Identify clusters',
        '10. Compile dependency map'
      ],
      outputFormat: 'JSON object with dependency map'
    },
    outputSchema: {
      type: 'object',
      required: ['dependencies', 'criticalPath'],
      properties: {
        dependencies: { type: 'array' },
        criticalPath: { type: 'array' },
        dependencyGraph: { type: 'object' },
        circularDependencies: { type: 'array' },
        clusters: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['program', 'dependency', 'mapping']
}));

export const dependencyAnalysisTask = defineTask('dependency-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Dependency Analysis - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Program Analyst',
      task: 'Analyze dependency impacts',
      context: {
        programName: args.programName,
        dependencyMap: args.dependencyMap,
        timeline: args.timeline,
        constraints: args.constraints
      },
      instructions: [
        '1. Analyze timeline impacts',
        '2. Assess resource conflicts',
        '3. Evaluate schedule slack',
        '4. Identify bottlenecks',
        '5. Analyze coupling strength',
        '6. Assess change impact',
        '7. Evaluate flexibility',
        '8. Document constraints',
        '9. Calculate schedule risk',
        '10. Compile analysis results'
      ],
      outputFormat: 'JSON object with dependency analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis'],
      properties: {
        analysis: { type: 'object' },
        timelineImpacts: { type: 'array' },
        resourceConflicts: { type: 'array' },
        bottlenecks: { type: 'array' },
        scheduleRisk: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['program', 'dependency', 'analysis']
}));

export const dependencyRiskTask = defineTask('dependency-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Dependency Risk Assessment - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Manager',
      task: 'Assess dependency risks',
      context: {
        programName: args.programName,
        dependencyMap: args.dependencyMap,
        analysis: args.analysis
      },
      instructions: [
        '1. Identify dependency risks',
        '2. Assess probability',
        '3. Assess impact',
        '4. Calculate risk scores',
        '5. Identify triggers',
        '6. Evaluate cascade effects',
        '7. Assess external risks',
        '8. Prioritize risks',
        '9. Document risk owners',
        '10. Compile risk register'
      ],
      outputFormat: 'JSON object with dependency risks'
    },
    outputSchema: {
      type: 'object',
      required: ['risks'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              dependency: { type: 'string' },
              description: { type: 'string' },
              probability: { type: 'number' },
              impact: { type: 'number' },
              score: { type: 'number' }
            }
          }
        },
        riskMatrix: { type: 'object' },
        cascadeEffects: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['program', 'dependency', 'risk']
}));

export const coordinationPlanTask = defineTask('coordination-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Coordination Planning - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Program Coordinator',
      task: 'Create coordination plan',
      context: {
        programName: args.programName,
        projects: args.projects,
        dependencyMap: args.dependencyMap,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Define coordination structure',
        '2. Establish communication protocols',
        '3. Schedule sync meetings',
        '4. Define escalation paths',
        '5. Assign coordination roles',
        '6. Create decision matrix',
        '7. Define handoff procedures',
        '8. Establish status reporting',
        '9. Plan review cycles',
        '10. Compile coordination plan'
      ],
      outputFormat: 'JSON object with coordination plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan'],
      properties: {
        plan: { type: 'object' },
        meetingSchedule: { type: 'array' },
        communicationProtocols: { type: 'array' },
        roles: { type: 'array' },
        escalationPaths: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['program', 'coordination', 'planning']
}));

export const integrationPointsTask = defineTask('integration-points', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Integration Points - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Integration Manager',
      task: 'Define integration points',
      context: {
        programName: args.programName,
        dependencies: args.dependencies,
        coordinationPlan: args.coordinationPlan
      },
      instructions: [
        '1. Identify integration events',
        '2. Define integration milestones',
        '3. Specify deliverable handoffs',
        '4. Create integration schedule',
        '5. Define verification criteria',
        '6. Plan integration testing',
        '7. Assign integration owners',
        '8. Define rollback procedures',
        '9. Document interfaces',
        '10. Compile integration points'
      ],
      outputFormat: 'JSON object with integration points'
    },
    outputSchema: {
      type: 'object',
      required: ['points'],
      properties: {
        points: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              projects: { type: 'array' },
              date: { type: 'string' },
              criteria: { type: 'array' }
            }
          }
        },
        schedule: { type: 'array' },
        interfaces: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['program', 'integration', 'milestones']
}));

export const mitigationStrategiesTask = defineTask('mitigation-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Mitigation Strategies - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Mitigator',
      task: 'Develop dependency mitigation strategies',
      context: {
        programName: args.programName,
        risks: args.risks,
        dependencyMap: args.dependencyMap
      },
      instructions: [
        '1. Analyze each risk',
        '2. Identify mitigation options',
        '3. Evaluate option effectiveness',
        '4. Select strategies',
        '5. Define contingency plans',
        '6. Allocate resources',
        '7. Set trigger points',
        '8. Assign owners',
        '9. Create action plans',
        '10. Compile mitigation plan'
      ],
      outputFormat: 'JSON object with mitigation strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              strategy: { type: 'string' },
              actions: { type: 'array' },
              owner: { type: 'string' },
              trigger: { type: 'string' }
            }
          }
        },
        contingencyPlans: { type: 'array' },
        resourceRequirements: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['program', 'mitigation', 'strategy']
}));

export const monitoringFrameworkTask = defineTask('monitoring-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Monitoring Framework - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Program Monitor',
      task: 'Create dependency monitoring framework',
      context: {
        programName: args.programName,
        dependencyMap: args.dependencyMap,
        integrationPoints: args.integrationPoints,
        mitigationStrategies: args.mitigationStrategies
      },
      instructions: [
        '1. Define monitoring metrics',
        '2. Create tracking dashboard',
        '3. Set up health indicators',
        '4. Define alert thresholds',
        '5. Establish review frequency',
        '6. Create status templates',
        '7. Define reporting cadence',
        '8. Set up automated tracking',
        '9. Document procedures',
        '10. Compile monitoring framework'
      ],
      outputFormat: 'JSON object with monitoring framework'
    },
    outputSchema: {
      type: 'object',
      required: ['framework'],
      properties: {
        framework: { type: 'object' },
        metrics: { type: 'array' },
        healthIndicators: { type: 'array' },
        alertThresholds: { type: 'object' },
        reportingSchedule: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['program', 'monitoring', 'tracking']
}));

export const programDocumentationTask = defineTask('program-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Program Documentation - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation Specialist',
      task: 'Compile program dependency documentation',
      context: {
        programName: args.programName,
        dependencyMapping: args.dependencyMapping,
        dependencyAnalysis: args.dependencyAnalysis,
        riskAssessment: args.riskAssessment,
        coordinationPlan: args.coordinationPlan,
        integrationPoints: args.integrationPoints,
        mitigationStrategies: args.mitigationStrategies,
        monitoringFramework: args.monitoringFramework
      },
      instructions: [
        '1. Compile all documentation',
        '2. Create executive summary',
        '3. Document dependency map',
        '4. Include risk register',
        '5. Add coordination plan',
        '6. Document integration points',
        '7. Generate markdown report',
        '8. Add visualizations',
        '9. Include appendices',
        '10. Finalize documentation'
      ],
      outputFormat: 'JSON object with program documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'markdown'],
      properties: {
        documentation: { type: 'object' },
        markdown: { type: 'string' },
        executiveSummary: { type: 'string' },
        visualizations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['program', 'documentation', 'deliverable']
}));
