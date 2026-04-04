/**
 * @process specializations/domains/business/project-management/resource-planning-allocation
 * @description Resource Planning and Allocation - Identify resource requirements, assess availability,
 * optimize allocation, and plan resource acquisition and management.
 * @inputs { projectName: string, wbs: object, schedule: object, resourcePool: array }
 * @outputs { success: boolean, resourcePlan: object, allocationMatrix: object, acquisitionPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/resource-planning-allocation', {
 *   projectName: 'Digital Transformation',
 *   wbs: { workPackages: [...] },
 *   schedule: { activities: [...], duration: '12 months' },
 *   resourcePool: [{ name: 'Senior Developer', available: 3 }, { name: 'BA', available: 2 }]
 * });
 *
 * @references
 * - PMI Resource Management: https://www.pmi.org/pmbok-guide-standards/foundational/pmbok
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    wbs,
    schedule,
    resourcePool = [],
    constraints = {},
    organizationalContext = {}
  } = inputs;

  // Phase 1: Resource Requirements Identification
  const requirementsIdentification = await ctx.task(resourceRequirementsTask, {
    projectName,
    wbs,
    schedule
  });

  // Phase 2: Resource Availability Assessment
  const availabilityAssessment = await ctx.task(resourceAvailabilityTask, {
    projectName,
    resourcePool,
    requirements: requirementsIdentification,
    constraints
  });

  // Breakpoint: Review resource gaps
  const gaps = availabilityAssessment.gaps || [];
  if (gaps.length > 0) {
    await ctx.breakpoint({
      question: `Identified ${gaps.length} resource gaps for ${projectName}. Review acquisition options?`,
      title: 'Resource Gap Review',
      context: {
        runId: ctx.runId,
        gaps: gaps,
        files: [{
          path: `artifacts/resource-gaps.json`,
          format: 'json',
          content: availabilityAssessment
        }]
      }
    });
  }

  // Phase 3: Resource Optimization
  const resourceOptimization = await ctx.task(resourceOptimizationTask, {
    projectName,
    requirements: requirementsIdentification,
    availability: availabilityAssessment,
    schedule
  });

  // Phase 4: Allocation Matrix Development
  const allocationMatrix = await ctx.task(allocationMatrixTask, {
    projectName,
    optimizedPlan: resourceOptimization,
    schedule
  });

  // Phase 5: Acquisition Planning
  const acquisitionPlan = await ctx.task(acquisitionPlanningTask, {
    projectName,
    gaps: availabilityAssessment.gaps,
    constraints,
    organizationalContext
  });

  // Phase 6: Resource Calendar Development
  const resourceCalendar = await ctx.task(resourceCalendarTask, {
    projectName,
    allocationMatrix,
    resourcePool,
    schedule
  });

  // Phase 7: Resource Management Plan
  const managementPlan = await ctx.task(resourceManagementPlanTask, {
    projectName,
    allocationMatrix,
    acquisitionPlan,
    resourceCalendar
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Resource planning complete for ${projectName}. Total resources: ${allocationMatrix.totalResources}. Gaps addressed: ${acquisitionPlan.acquisitions?.length || 0}. Approve plan?`,
    title: 'Resource Plan Approval',
    context: {
      runId: ctx.runId,
      projectName,
      totalResources: allocationMatrix.totalResources,
      files: [
        { path: `artifacts/resource-plan.json`, format: 'json', content: managementPlan },
        { path: `artifacts/resource-plan.md`, format: 'markdown', content: managementPlan.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    resourcePlan: managementPlan,
    allocationMatrix: allocationMatrix,
    acquisitionPlan: acquisitionPlan,
    resourceCalendar: resourceCalendar,
    gaps: availabilityAssessment.gaps,
    recommendations: managementPlan.recommendations,
    metadata: {
      processId: 'specializations/domains/business/project-management/resource-planning-allocation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const resourceRequirementsTask = defineTask('resource-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Resource Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Resource Planner',
      task: 'Identify resource requirements from WBS and schedule',
      context: {
        projectName: args.projectName,
        wbs: args.wbs,
        schedule: args.schedule
      },
      instructions: [
        '1. Analyze work packages for resource needs',
        '2. Identify skill requirements',
        '3. Estimate effort per activity',
        '4. Determine resource types needed',
        '5. Calculate quantity requirements',
        '6. Identify timing requirements',
        '7. Document special requirements',
        '8. Assess skill levels needed',
        '9. Create resource breakdown structure',
        '10. Summarize total requirements'
      ],
      outputFormat: 'JSON object with resource requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements'],
      properties: {
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              resourceType: { type: 'string' },
              skillLevel: { type: 'string' },
              quantity: { type: 'number' },
              effort: { type: 'number' },
              startDate: { type: 'string' },
              endDate: { type: 'string' }
            }
          }
        },
        totalByType: { type: 'object' },
        peakRequirements: { type: 'object' },
        resourceBreakdownStructure: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['resource', 'requirements', 'planning']
}));

export const resourceAvailabilityTask = defineTask('resource-availability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Resource Availability - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Resource Manager',
      task: 'Assess resource availability against requirements',
      context: {
        projectName: args.projectName,
        resourcePool: args.resourcePool,
        requirements: args.requirements,
        constraints: args.constraints
      },
      instructions: [
        '1. Inventory available resources',
        '2. Assess current commitments',
        '3. Calculate available capacity',
        '4. Compare with requirements',
        '5. Identify gaps',
        '6. Assess timing mismatches',
        '7. Identify skill gaps',
        '8. Document constraints',
        '9. Assess shared resources',
        '10. Summarize availability'
      ],
      outputFormat: 'JSON object with availability assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['availability', 'gaps'],
      properties: {
        availability: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resourceType: { type: 'string' },
              available: { type: 'number' },
              required: { type: 'number' },
              gap: { type: 'number' }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resourceType: { type: 'string' },
              gapQuantity: { type: 'number' },
              timing: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        constraints: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['resource', 'availability', 'gaps']
}));

export const resourceOptimizationTask = defineTask('resource-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Resource Optimization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Resource Optimizer',
      task: 'Optimize resource allocation',
      context: {
        projectName: args.projectName,
        requirements: args.requirements,
        availability: args.availability,
        schedule: args.schedule
      },
      instructions: [
        '1. Apply resource leveling',
        '2. Smooth resource utilization',
        '3. Resolve over-allocations',
        '4. Optimize skill utilization',
        '5. Balance workloads',
        '6. Consider schedule flexibility',
        '7. Identify efficiency opportunities',
        '8. Minimize resource conflicts',
        '9. Document trade-offs',
        '10. Create optimized plan'
      ],
      outputFormat: 'JSON object with optimized allocation'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedPlan'],
      properties: {
        optimizedPlan: { type: 'object' },
        utilizationSummary: { type: 'object' },
        tradeOffs: { type: 'array', items: { type: 'string' } },
        scheduleImpact: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['resource', 'optimization', 'leveling']
}));

export const allocationMatrixTask = defineTask('allocation-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Allocation Matrix - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Resource Planner',
      task: 'Create resource allocation matrix',
      context: {
        projectName: args.projectName,
        optimizedPlan: args.optimizedPlan,
        schedule: args.schedule
      },
      instructions: [
        '1. Create activity-resource matrix',
        '2. Assign resources to activities',
        '3. Specify allocation percentages',
        '4. Define time periods',
        '5. Document assignments',
        '6. Calculate utilization',
        '7. Identify backups',
        '8. Document handoffs',
        '9. Create responsibility matrix',
        '10. Summarize allocations'
      ],
      outputFormat: 'JSON object with allocation matrix'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'totalResources'],
      properties: {
        matrix: { type: 'array' },
        totalResources: { type: 'number' },
        utilizationByResource: { type: 'object' },
        backupAssignments: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['resource', 'allocation', 'matrix']
}));

export const acquisitionPlanningTask = defineTask('acquisition-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Acquisition Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Procurement Specialist',
      task: 'Plan resource acquisition for gaps',
      context: {
        projectName: args.projectName,
        gaps: args.gaps,
        constraints: args.constraints,
        organizationalContext: args.organizationalContext
      },
      instructions: [
        '1. Analyze resource gaps',
        '2. Identify acquisition options',
        '3. Evaluate make vs buy',
        '4. Plan hiring if needed',
        '5. Plan contracting if needed',
        '6. Plan training if needed',
        '7. Estimate acquisition costs',
        '8. Set acquisition timeline',
        '9. Identify procurement processes',
        '10. Document acquisition plan'
      ],
      outputFormat: 'JSON object with acquisition plan'
    },
    outputSchema: {
      type: 'object',
      required: ['acquisitions'],
      properties: {
        acquisitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resourceType: { type: 'string' },
              method: { type: 'string', enum: ['hire', 'contract', 'train', 'transfer'] },
              quantity: { type: 'number' },
              timeline: { type: 'string' },
              estimatedCost: { type: 'number' }
            }
          }
        },
        totalAcquisitionCost: { type: 'number' },
        procurementProcess: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['resource', 'acquisition', 'procurement']
}));

export const resourceCalendarTask = defineTask('resource-calendar', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Resource Calendar - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Resource Coordinator',
      task: 'Develop resource calendars',
      context: {
        projectName: args.projectName,
        allocationMatrix: args.allocationMatrix,
        resourcePool: args.resourcePool,
        schedule: args.schedule
      },
      instructions: [
        '1. Create resource calendars',
        '2. Document availability windows',
        '3. Include holidays and PTO',
        '4. Set working hours',
        '5. Document commitments',
        '6. Plan for contingencies',
        '7. Coordinate shared resources',
        '8. Set review dates',
        '9. Document assumptions',
        '10. Create calendar views'
      ],
      outputFormat: 'JSON object with resource calendar'
    },
    outputSchema: {
      type: 'object',
      required: ['calendars'],
      properties: {
        calendars: { type: 'array' },
        holidaySchedule: { type: 'array' },
        workingHours: { type: 'object' },
        reviewDates: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['resource', 'calendar', 'scheduling']
}));

export const resourceManagementPlanTask = defineTask('resource-management-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Resource Management Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Manager',
      task: 'Create comprehensive resource management plan',
      context: {
        projectName: args.projectName,
        allocationMatrix: args.allocationMatrix,
        acquisitionPlan: args.acquisitionPlan,
        resourceCalendar: args.resourceCalendar
      },
      instructions: [
        '1. Compile resource management plan',
        '2. Document roles and responsibilities',
        '3. Include allocation matrix',
        '4. Include acquisition plan',
        '5. Document management processes',
        '6. Define performance management',
        '7. Set release criteria',
        '8. Generate markdown',
        '9. Add recommendations',
        '10. Add version control'
      ],
      outputFormat: 'JSON object with resource management plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'markdown'],
      properties: {
        plan: { type: 'object' },
        markdown: { type: 'string' },
        rolesResponsibilities: { type: 'array' },
        performanceManagement: { type: 'string' },
        releaseCriteria: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        documentControl: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['resource', 'management', 'plan']
}));
