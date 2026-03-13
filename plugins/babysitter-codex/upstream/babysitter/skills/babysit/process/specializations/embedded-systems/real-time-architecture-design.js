/**
 * @process specializations/embedded-systems/real-time-architecture-design
 * @description Real-Time System Architecture Design - Designing layered software architectures with clear separation
 * between application logic, RTOS layer, hardware abstraction layer (HAL), and device drivers while meeting real-time
 * constraints.
 * @inputs { projectName: string, targetMcu: string, rtos?: string, realTimeRequirements?: object, outputDir?: string }
 * @outputs { success: boolean, architecture: object, layers: array, schedulingModel: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/real-time-architecture-design', {
 *   projectName: 'IndustrialController',
 *   targetMcu: 'STM32H743',
 *   rtos: 'FreeRTOS',
 *   realTimeRequirements: { hardDeadlines: ['control_loop'], softDeadlines: ['logging'] }
 * });
 *
 * @references
 * - Design Patterns for Embedded Systems in C: https://www.embedded.com/design-patterns-for-embedded-systems-in-c/
 * - Real-Time Systems Design: https://www.embedded.com/real-time-system-design/
 * - Layered Architecture: https://embeddedartistry.com/blog/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetMcu,
    rtos = 'FreeRTOS',
    realTimeRequirements = {},
    systemTasks = [],
    deterministicBehavior = true,
    faultTolerance = true,
    outputDir = 'rt-architecture-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Real-Time Architecture Design: ${projectName}`);
  ctx.log('info', `MCU: ${targetMcu}, RTOS: ${rtos}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Real-Time Requirements');

  const requirementsAnalysis = await ctx.task(rtRequirementsAnalysisTask, {
    projectName,
    realTimeRequirements,
    systemTasks,
    deterministicBehavior,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: LAYER DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing Software Layers');

  const layerDesign = await ctx.task(layerDesignTask, {
    projectName,
    targetMcu,
    rtos,
    requirementsAnalysis,
    outputDir
  });

  artifacts.push(...layerDesign.artifacts);

  // ============================================================================
  // PHASE 3: TASK ARCHITECTURE
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing Task Architecture');

  const taskArchitecture = await ctx.task(rtTaskArchitectureTask, {
    projectName,
    rtos,
    requirementsAnalysis,
    layerDesign,
    outputDir
  });

  artifacts.push(...taskArchitecture.artifacts);

  await ctx.breakpoint({
    question: `Task architecture designed with ${taskArchitecture.taskCount} tasks. Review scheduling model?`,
    title: 'Task Architecture Review',
    context: {
      runId: ctx.runId,
      tasks: taskArchitecture.tasks,
      files: taskArchitecture.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 4: SCHEDULING ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing Scheduling');

  const schedulingAnalysis = await ctx.task(schedulingAnalysisTask, {
    projectName,
    rtos,
    taskArchitecture,
    realTimeRequirements,
    outputDir
  });

  artifacts.push(...schedulingAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: INTER-COMPONENT COMMUNICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing Inter-Component Communication');

  const communicationDesign = await ctx.task(interComponentCommunicationTask, {
    projectName,
    layerDesign,
    taskArchitecture,
    outputDir
  });

  artifacts.push(...communicationDesign.artifacts);

  // ============================================================================
  // PHASE 6: FAULT TOLERANCE DESIGN
  // ============================================================================

  let faultToleranceDesign = null;
  if (faultTolerance) {
    ctx.log('info', 'Phase 6: Designing Fault Tolerance');

    faultToleranceDesign = await ctx.task(faultToleranceDesignTask, {
      projectName,
      taskArchitecture,
      realTimeRequirements,
      outputDir
    });

    artifacts.push(...faultToleranceDesign.artifacts);
  }

  // ============================================================================
  // PHASE 7: ARCHITECTURE DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating Architecture Documentation');

  const documentation = await ctx.task(rtArchitectureDocumentationTask, {
    projectName,
    layerDesign,
    taskArchitecture,
    schedulingAnalysis,
    communicationDesign,
    faultToleranceDesign,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Real-Time Architecture Design Complete for ${projectName}. Schedulable: ${schedulingAnalysis.schedulable}. Review?`,
    title: 'Architecture Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        layers: layerDesign.layers.length,
        tasks: taskArchitecture.taskCount,
        schedulable: schedulingAnalysis.schedulable,
        utilization: schedulingAnalysis.cpuUtilization
      },
      files: [
        { path: documentation.architecturePath, format: 'markdown', label: 'Architecture Doc' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: schedulingAnalysis.schedulable,
    projectName,
    architecture: {
      layers: layerDesign.layers,
      components: layerDesign.components,
      interfaces: layerDesign.interfaces
    },
    layers: layerDesign.layers,
    schedulingModel: {
      schedulable: schedulingAnalysis.schedulable,
      algorithm: schedulingAnalysis.algorithm,
      cpuUtilization: schedulingAnalysis.cpuUtilization
    },
    tasks: taskArchitecture.tasks,
    faultTolerance: faultToleranceDesign?.mechanisms || [],
    architecturePath: documentation.architecturePath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/real-time-architecture-design',
      timestamp: startTime,
      projectName,
      targetMcu,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const rtRequirementsAnalysisTask = defineTask('rt-requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Real-Time Systems Architect',
      task: 'Analyze real-time requirements',
      context: args,
      instructions: [
        '1. Identify hard real-time tasks',
        '2. Identify soft real-time tasks',
        '3. Define deadline requirements',
        '4. Specify periodicity',
        '5. Identify timing constraints',
        '6. Define jitter tolerance',
        '7. Identify critical paths',
        '8. Analyze dependencies',
        '9. Define safety requirements',
        '10. Document requirements'
      ],
      outputFormat: 'JSON with RT requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['hardRealTime', 'softRealTime', 'deadlines', 'artifacts'],
      properties: {
        hardRealTime: { type: 'array', items: { type: 'object' } },
        softRealTime: { type: 'array', items: { type: 'object' } },
        deadlines: { type: 'object' },
        periodicities: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rt-architecture', 'requirements']
}));

export const layerDesignTask = defineTask('layer-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Layer Design - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Real-Time Systems Architect',
      task: 'Design software layers',
      context: args,
      instructions: [
        '1. Define application layer',
        '2. Define service layer',
        '3. Define RTOS abstraction layer',
        '4. Define HAL layer',
        '5. Define driver layer',
        '6. Specify layer interfaces',
        '7. Define dependency rules',
        '8. Identify components per layer',
        '9. Create layer diagram',
        '10. Document layer responsibilities'
      ],
      outputFormat: 'JSON with layer design'
    },
    outputSchema: {
      type: 'object',
      required: ['layers', 'components', 'interfaces', 'artifacts'],
      properties: {
        layers: { type: 'array', items: { type: 'object' } },
        components: { type: 'array', items: { type: 'object' } },
        interfaces: { type: 'array', items: { type: 'object' } },
        dependencyRules: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rt-architecture', 'layers']
}));

export const rtTaskArchitectureTask = defineTask('rt-task-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Task Architecture - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Real-Time Systems Architect',
      task: 'Design task architecture',
      context: args,
      instructions: [
        '1. Define periodic tasks',
        '2. Define aperiodic tasks',
        '3. Assign task priorities',
        '4. Define task periods',
        '5. Estimate WCETs',
        '6. Define task dependencies',
        '7. Identify shared resources',
        '8. Design task state machines',
        '9. Define stack sizes',
        '10. Document task architecture'
      ],
      outputFormat: 'JSON with task architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['tasks', 'taskCount', 'priorities', 'artifacts'],
      properties: {
        tasks: { type: 'array', items: { type: 'object' } },
        taskCount: { type: 'number' },
        priorities: { type: 'object' },
        sharedResources: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rt-architecture', 'tasks']
}));

export const schedulingAnalysisTask = defineTask('scheduling-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Scheduling Analysis - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Real-Time Systems Architect',
      task: 'Analyze scheduling',
      context: args,
      instructions: [
        '1. Select scheduling algorithm',
        '2. Calculate CPU utilization',
        '3. Perform schedulability test',
        '4. Analyze worst-case response',
        '5. Check deadline guarantees',
        '6. Analyze blocking times',
        '7. Check priority inversion',
        '8. Analyze preemption points',
        '9. Identify bottlenecks',
        '10. Document analysis'
      ],
      outputFormat: 'JSON with scheduling analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['schedulable', 'algorithm', 'cpuUtilization', 'artifacts'],
      properties: {
        schedulable: { type: 'boolean' },
        algorithm: { type: 'string' },
        cpuUtilization: { type: 'string' },
        worstCaseResponse: { type: 'object' },
        blockingAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rt-architecture', 'scheduling']
}));

export const interComponentCommunicationTask = defineTask('inter-component-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Communication Design - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Real-Time Systems Architect',
      task: 'Design inter-component communication',
      context: args,
      instructions: [
        '1. Identify communication patterns',
        '2. Design message queues',
        '3. Define shared memory regions',
        '4. Specify synchronization',
        '5. Design event mechanisms',
        '6. Define data flow',
        '7. Specify buffer sizes',
        '8. Handle overflow scenarios',
        '9. Design notification mechanisms',
        '10. Document communication'
      ],
      outputFormat: 'JSON with communication design'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'queues', 'synchronization', 'artifacts'],
      properties: {
        patterns: { type: 'array', items: { type: 'object' } },
        queues: { type: 'array', items: { type: 'object' } },
        synchronization: { type: 'array', items: { type: 'object' } },
        dataFlow: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rt-architecture', 'communication']
}));

export const faultToleranceDesignTask = defineTask('fault-tolerance-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Fault Tolerance - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Real-Time Systems Architect',
      task: 'Design fault tolerance mechanisms',
      context: args,
      instructions: [
        '1. Identify failure modes',
        '2. Design watchdog mechanisms',
        '3. Add health monitoring',
        '4. Design recovery strategies',
        '5. Implement graceful degradation',
        '6. Add error detection',
        '7. Design restart mechanisms',
        '8. Implement checkpointing',
        '9. Add redundancy',
        '10. Document fault handling'
      ],
      outputFormat: 'JSON with fault tolerance design'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanisms', 'failureModes', 'artifacts'],
      properties: {
        mechanisms: { type: 'array', items: { type: 'object' } },
        failureModes: { type: 'array', items: { type: 'object' } },
        recoveryStrategies: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rt-architecture', 'fault-tolerance']
}));

export const rtArchitectureDocumentationTask = defineTask('rt-architecture-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Documentation - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate architecture documentation',
      context: args,
      instructions: [
        '1. Create architecture overview',
        '2. Document layer structure',
        '3. Include task architecture',
        '4. Add scheduling analysis',
        '5. Document communication',
        '6. Include fault tolerance',
        '7. Add diagrams',
        '8. Create implementation guide',
        '9. Include verification plan',
        '10. Format documentation'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['architecturePath', 'artifacts'],
      properties: {
        architecturePath: { type: 'string' },
        diagrams: { type: 'array', items: { type: 'string' } },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rt-architecture', 'documentation']
}));
