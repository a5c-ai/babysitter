/**
 * @process specializations/domains/business/operations/constraint-identification
 * @description Constraint Identification and Exploitation Process - Identify system bottlenecks, maximize constraint
 * utilization, subordinate non-constraints, and implement Theory of Constraints five focusing steps.
 * @inputs { systemName: string, scope?: string, currentThroughput?: number, targetThroughput?: number }
 * @outputs { success: boolean, constraint: object, exploitationPlan: object, subordinationPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/operations/constraint-identification', {
 *   systemName: 'Manufacturing Value Stream',
 *   scope: 'end-to-end production',
 *   currentThroughput: 100,
 *   targetThroughput: 150
 * });
 *
 * @references
 * - Goldratt, E.M. & Cox, J. (2014). The Goal
 * - Goldratt, E.M. (1990). Theory of Constraints
 * - Dettmer, H.W. (1997). Goldratt's Theory of Constraints
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName,
    scope = 'production',
    currentThroughput = null,
    targetThroughput = null,
    measurementUnit = 'units/hour',
    outputDir = 'toc-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting TOC Constraint Analysis for: ${systemName}`);

  // Step 1: IDENTIFY the constraint
  ctx.log('info', 'Step 1: IDENTIFY the system constraint');
  const identification = await ctx.task(identifyConstraintTask, {
    systemName,
    scope,
    currentThroughput,
    measurementUnit,
    outputDir
  });

  artifacts.push(...identification.artifacts);

  // Quality Gate: Constraint Identification
  await ctx.breakpoint({
    question: `Constraint identified: "${identification.constraint.name}" with capacity ${identification.constraint.capacity} ${measurementUnit}. System throughput limited to ${identification.systemThroughput}. Proceed with exploitation?`,
    title: 'Constraint Identification Review',
    context: {
      runId: ctx.runId,
      systemName,
      constraint: identification.constraint,
      resourceAnalysis: identification.resourceAnalysis,
      files: identification.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Step 2: EXPLOIT the constraint
  ctx.log('info', 'Step 2: EXPLOIT the constraint - maximize utilization');
  const exploitation = await ctx.task(exploitConstraintTask, {
    systemName,
    identification,
    targetThroughput,
    outputDir
  });

  artifacts.push(...exploitation.artifacts);

  // Step 3: SUBORDINATE everything else
  ctx.log('info', 'Step 3: SUBORDINATE non-constraints to the constraint');
  const subordination = await ctx.task(subordinateTask, {
    systemName,
    identification,
    exploitation,
    outputDir
  });

  artifacts.push(...subordination.artifacts);

  // Quality Gate: Exploitation and Subordination Plans
  await ctx.breakpoint({
    question: `Exploitation plan: ${exploitation.actions.length} actions identified. Expected throughput gain: ${exploitation.expectedGain}%. Subordination plan: ${subordination.subordinationActions.length} actions. Review before implementation?`,
    title: 'Exploitation and Subordination Review',
    context: {
      runId: ctx.runId,
      systemName,
      exploitationActions: exploitation.actions,
      expectedGain: exploitation.expectedGain,
      subordinationActions: subordination.subordinationActions,
      files: [...exploitation.artifacts, ...subordination.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Step 4: ELEVATE the constraint (if needed)
  ctx.log('info', 'Step 4: ELEVATE the constraint - increase capacity');
  const elevation = await ctx.task(elevateConstraintTask, {
    systemName,
    identification,
    exploitation,
    subordination,
    targetThroughput,
    outputDir
  });

  artifacts.push(...elevation.artifacts);

  // Step 5: Return to Step 1 (prevent inertia)
  ctx.log('info', 'Step 5: Prevent INERTIA - check if constraint has moved');
  const inertiaCheck = await ctx.task(inertiaCheckTask, {
    systemName,
    identification,
    exploitation,
    subordination,
    elevation,
    outputDir
  });

  artifacts.push(...inertiaCheck.artifacts);

  // Implementation Planning
  ctx.log('info', 'Creating Implementation Plan');
  const implementation = await ctx.task(implementationPlanTask, {
    systemName,
    identification,
    exploitation,
    subordination,
    elevation,
    targetThroughput,
    outputDir
  });

  artifacts.push(...implementation.artifacts);

  // Report Generation
  ctx.log('info', 'Generating TOC Analysis Report');
  const report = await ctx.task(reportTask, {
    systemName,
    identification,
    exploitation,
    subordination,
    elevation,
    inertiaCheck,
    implementation,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemName,
    constraint: {
      name: identification.constraint.name,
      type: identification.constraint.type,
      capacity: identification.constraint.capacity,
      utilization: identification.constraint.utilization
    },
    exploitationPlan: {
      actions: exploitation.actions,
      expectedGain: exploitation.expectedGain,
      newCapacity: exploitation.newCapacity
    },
    subordinationPlan: {
      actions: subordination.subordinationActions,
      bufferStrategy: subordination.bufferStrategy
    },
    elevationPlan: elevation.elevationRequired ? {
      actions: elevation.elevationActions,
      investment: elevation.investmentRequired,
      expectedCapacity: elevation.expectedCapacity
    } : null,
    throughputAnalysis: {
      current: currentThroughput,
      afterExploitation: exploitation.newCapacity,
      afterElevation: elevation.expectedCapacity,
      target: targetThroughput
    },
    constraintMoved: inertiaCheck.constraintMoved,
    newConstraint: inertiaCheck.newConstraint,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/business/operations/constraint-identification',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Identify Constraint
export const identifyConstraintTask = defineTask('toc-identify', (args, taskCtx) => ({
  kind: 'agent',
  title: `TOC Identify Constraint - ${args.systemName}`,
  agent: {
    name: 'toc-analyst',
    prompt: {
      role: 'Theory of Constraints Analyst',
      task: 'Identify the system constraint (bottleneck)',
      context: args,
      instructions: [
        '1. Map the system/value stream',
        '2. Identify all resources in the flow',
        '3. Measure capacity of each resource',
        '4. Measure demand/load on each resource',
        '5. Calculate utilization for each resource',
        '6. Identify resource with highest utilization',
        '7. Verify constraint (accumulation of WIP before)',
        '8. Classify constraint type (physical, policy, market)',
        '9. Calculate system throughput limit',
        '10. Document constraint identification'
      ],
      outputFormat: 'JSON with constraint identification'
    },
    outputSchema: {
      type: 'object',
      required: ['constraint', 'resourceAnalysis', 'systemThroughput', 'artifacts'],
      properties: {
        constraint: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['physical', 'policy', 'market', 'supplier'] },
            capacity: { type: 'number' },
            demand: { type: 'number' },
            utilization: { type: 'number' }
          }
        },
        resourceAnalysis: { type: 'array', items: { type: 'object' } },
        systemThroughput: { type: 'number' },
        wipAccumulation: { type: 'object' },
        flowDiagram: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'toc', 'identify']
}));

// Task 2: Exploit Constraint
export const exploitConstraintTask = defineTask('toc-exploit', (args, taskCtx) => ({
  kind: 'agent',
  title: `TOC Exploit Constraint - ${args.systemName}`,
  agent: {
    name: 'toc-engineer',
    prompt: {
      role: 'TOC Implementation Engineer',
      task: 'Maximize constraint utilization without investment',
      context: args,
      instructions: [
        '1. Analyze current constraint utilization losses',
        '2. Eliminate unplanned downtime at constraint',
        '3. Ensure constraint never starved (buffer before)',
        '4. Ensure constraint output never blocked',
        '5. Improve constraint setup/changeover time',
        '6. Ensure only quality parts reach constraint',
        '7. Offload non-constraint work from constraint',
        '8. Optimize constraint scheduling',
        '9. Calculate expected throughput gain',
        '10. Document exploitation actions'
      ],
      outputFormat: 'JSON with exploitation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'expectedGain', 'newCapacity', 'artifacts'],
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              description: { type: 'string' },
              expectedImpact: { type: 'number' },
              effort: { type: 'string' }
            }
          }
        },
        currentUtilization: { type: 'number' },
        utilizationLosses: { type: 'object' },
        expectedGain: { type: 'number' },
        newCapacity: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'toc', 'exploit']
}));

// Task 3: Subordinate
export const subordinateTask = defineTask('toc-subordinate', (args, taskCtx) => ({
  kind: 'agent',
  title: `TOC Subordinate Non-Constraints - ${args.systemName}`,
  agent: {
    name: 'toc-coordinator',
    prompt: {
      role: 'TOC Systems Coordinator',
      task: 'Subordinate all non-constraints to support the constraint',
      context: args,
      instructions: [
        '1. Identify all non-constraint resources',
        '2. Design time buffer before constraint',
        '3. Synchronize non-constraint production to constraint pace',
        '4. Implement Drum-Buffer-Rope if applicable',
        '5. Reduce batch sizes for faster flow to constraint',
        '6. Ensure non-constraints have protective capacity',
        '7. Eliminate local optimization that hurts throughput',
        '8. Establish constraint-based scheduling rules',
        '9. Design shipping buffer',
        '10. Document subordination actions'
      ],
      outputFormat: 'JSON with subordination plan'
    },
    outputSchema: {
      type: 'object',
      required: ['subordinationActions', 'bufferStrategy', 'artifacts'],
      properties: {
        subordinationActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              action: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        bufferStrategy: {
          type: 'object',
          properties: {
            constraintBuffer: { type: 'object' },
            shippingBuffer: { type: 'object' },
            assemblyBuffers: { type: 'array', items: { type: 'object' } }
          }
        },
        dbrDesign: { type: 'object' },
        schedulingRules: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'toc', 'subordinate']
}));

// Task 4: Elevate Constraint
export const elevateConstraintTask = defineTask('toc-elevate', (args, taskCtx) => ({
  kind: 'agent',
  title: `TOC Elevate Constraint - ${args.systemName}`,
  agent: {
    name: 'toc-strategist',
    prompt: {
      role: 'TOC Strategic Planner',
      task: 'Evaluate options to elevate constraint capacity',
      context: args,
      instructions: [
        '1. Determine if elevation is needed (after exploitation)',
        '2. Identify elevation options (equipment, shifts, outsource)',
        '3. Calculate investment required for each option',
        '4. Calculate ROI using throughput accounting',
        '5. Assess impact on other resources',
        '6. Evaluate make vs buy options',
        '7. Consider adding parallel capacity',
        '8. Assess lead time for elevation',
        '9. Recommend elevation strategy',
        '10. Document elevation plan'
      ],
      outputFormat: 'JSON with elevation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['elevationRequired', 'elevationActions', 'expectedCapacity', 'artifacts'],
      properties: {
        elevationRequired: { type: 'boolean' },
        elevationActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              option: { type: 'string' },
              capacityGain: { type: 'number' },
              investment: { type: 'number' },
              roi: { type: 'number' },
              leadTime: { type: 'string' }
            }
          }
        },
        investmentRequired: { type: 'number' },
        expectedCapacity: { type: 'number' },
        recommendedOption: { type: 'string' },
        throughputAccountingAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'toc', 'elevate']
}));

// Task 5: Inertia Check
export const inertiaCheckTask = defineTask('toc-inertia', (args, taskCtx) => ({
  kind: 'agent',
  title: `TOC Inertia Check - ${args.systemName}`,
  agent: {
    name: 'toc-auditor',
    prompt: {
      role: 'TOC Continuous Improvement Auditor',
      task: 'Check if constraint has moved and prevent inertia',
      context: args,
      instructions: [
        '1. Re-analyze system after proposed changes',
        '2. Identify new potential constraint',
        '3. Verify if original constraint remains',
        '4. Check for policy constraints',
        '5. Identify inertia risks (old policies, metrics)',
        '6. Review subordination rules for relevance',
        '7. Check for market constraint',
        '8. Recommend ongoing monitoring approach',
        '9. Design constraint audit process',
        '10. Document inertia prevention plan'
      ],
      outputFormat: 'JSON with inertia check results'
    },
    outputSchema: {
      type: 'object',
      required: ['constraintMoved', 'newConstraint', 'inertiaRisks', 'artifacts'],
      properties: {
        constraintMoved: { type: 'boolean' },
        newConstraint: { type: 'object' },
        projectedCapacities: { type: 'array', items: { type: 'object' } },
        inertiaRisks: { type: 'array', items: { type: 'object' } },
        policiestoReview: { type: 'array', items: { type: 'string' } },
        ongoingMonitoring: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'toc', 'inertia']
}));

// Task 6: Implementation Plan
export const implementationPlanTask = defineTask('toc-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `TOC Implementation Plan - ${args.systemName}`,
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'TOC Implementation Planner',
      task: 'Create implementation plan for TOC improvements',
      context: args,
      instructions: [
        '1. Prioritize actions by impact and effort',
        '2. Create phased implementation timeline',
        '3. Define resource requirements',
        '4. Establish success metrics',
        '5. Plan training for TOC concepts',
        '6. Create communication plan',
        '7. Define governance and review cadence',
        '8. Plan buffer management system',
        '9. Design constraint monitoring dashboard',
        '10. Document implementation plan'
      ],
      outputFormat: 'JSON with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'successMetrics', 'artifacts'],
      properties: {
        phases: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        resources: { type: 'object' },
        successMetrics: { type: 'array', items: { type: 'object' } },
        training: { type: 'object' },
        bufferManagement: { type: 'object' },
        monitoringDashboard: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'toc', 'implementation']
}));

// Task 7: Report
export const reportTask = defineTask('toc-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `TOC Analysis Report - ${args.systemName}`,
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Generate comprehensive TOC analysis report',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Document constraint identification',
        '3. Present exploitation analysis',
        '4. Detail subordination plan',
        '5. Present elevation options',
        '6. Document inertia prevention',
        '7. Include throughput accounting',
        '8. Present implementation plan',
        '9. Include visualizations',
        '10. Format professionally'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'toc', 'reporting']
}));
