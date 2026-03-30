/**
 * @process specializations/embedded-systems/rtos-integration
 * @description RTOS Integration Process - Selecting, configuring, and integrating a Real-Time Operating System including
 * task creation, inter-task communication setup (queues, semaphores, mutexes), priority configuration, and memory management.
 * @inputs { projectName: string, rtosName: string, targetMcu: string, taskCount?: number, outputDir?: string }
 * @outputs { success: boolean, rtosConfig: object, tasks: array, ipcMechanisms: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/rtos-integration', {
 *   projectName: 'MotorController',
 *   rtosName: 'FreeRTOS',
 *   targetMcu: 'STM32F407VG',
 *   taskCount: 5
 * });
 *
 * @references
 * - FreeRTOS Documentation: https://www.freertos.org/Documentation/RTOS_book.html
 * - Zephyr RTOS: https://docs.zephyrproject.org/latest/
 * - RTOS Design Patterns: https://www.embedded.com/design-patterns-for-embedded-systems-in-c/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    rtosName = 'FreeRTOS', // 'FreeRTOS', 'Zephyr', 'ThreadX', 'RT-Thread'
    targetMcu,
    taskCount = 5,
    heapScheme = 'heap_4', // FreeRTOS heap schemes
    staticAllocation = false,
    tickRate = 1000, // Hz
    lowPowerTickless = false,
    softwareTimers = true,
    eventGroups = true,
    outputDir = 'rtos-integration-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting RTOS Integration: ${projectName}`);
  ctx.log('info', `RTOS: ${rtosName}, MCU: ${targetMcu}, Tasks: ${taskCount}`);

  // ============================================================================
  // PHASE 1: RTOS SELECTION AND REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 1: RTOS Selection and Requirements Analysis');

  const requirements = await ctx.task(rtosRequirementsTask, {
    projectName,
    rtosName,
    targetMcu,
    taskCount,
    staticAllocation,
    lowPowerTickless,
    outputDir
  });

  artifacts.push(...requirements.artifacts);

  // ============================================================================
  // PHASE 2: RTOS PORT CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring RTOS Port for Target MCU');

  const portConfig = await ctx.task(rtosPortConfigTask, {
    projectName,
    rtosName,
    targetMcu,
    tickRate,
    requirements,
    outputDir
  });

  artifacts.push(...portConfig.artifacts);

  // ============================================================================
  // PHASE 3: MEMORY CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring Memory Management');

  const memoryConfig = await ctx.task(rtosMemoryConfigTask, {
    projectName,
    rtosName,
    heapScheme,
    staticAllocation,
    requirements,
    outputDir
  });

  artifacts.push(...memoryConfig.artifacts);

  await ctx.breakpoint({
    question: `RTOS configuration ready for ${projectName}. Heap: ${memoryConfig.heapSize}, Static: ${staticAllocation}. Proceed with task design?`,
    title: 'RTOS Configuration Review',
    context: {
      runId: ctx.runId,
      rtosName,
      heapSize: memoryConfig.heapSize,
      files: memoryConfig.artifacts.map(a => ({ path: a.path, format: a.format || 'c' }))
    }
  });

  // ============================================================================
  // PHASE 4: TASK ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing Task Architecture');

  const taskArchitecture = await ctx.task(taskArchitectureTask, {
    projectName,
    rtosName,
    taskCount,
    requirements,
    outputDir
  });

  artifacts.push(...taskArchitecture.artifacts);

  // ============================================================================
  // PHASE 5: TASK IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Tasks');

  const taskImplementation = await ctx.task(taskImplementationTask, {
    projectName,
    rtosName,
    taskArchitecture,
    staticAllocation,
    outputDir
  });

  artifacts.push(...taskImplementation.artifacts);

  // ============================================================================
  // PHASE 6: INTER-TASK COMMUNICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting Up Inter-Task Communication');

  const ipcSetup = await ctx.task(ipcSetupTask, {
    projectName,
    rtosName,
    taskArchitecture,
    eventGroups,
    outputDir
  });

  artifacts.push(...ipcSetup.artifacts);

  // ============================================================================
  // PHASE 7: SYNCHRONIZATION PRIMITIVES
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing Synchronization Primitives');

  const syncPrimitives = await ctx.task(syncPrimitivesTask, {
    projectName,
    rtosName,
    taskArchitecture,
    ipcSetup,
    outputDir
  });

  artifacts.push(...syncPrimitives.artifacts);

  // ============================================================================
  // PHASE 8: SOFTWARE TIMERS (if enabled)
  // ============================================================================

  let timerSetup = null;
  if (softwareTimers) {
    ctx.log('info', 'Phase 8: Setting Up Software Timers');

    timerSetup = await ctx.task(softwareTimersTask, {
      projectName,
      rtosName,
      requirements,
      outputDir
    });

    artifacts.push(...timerSetup.artifacts);
  }

  // ============================================================================
  // PHASE 9: LOW-POWER TICKLESS MODE (if enabled)
  // ============================================================================

  let ticklessSetup = null;
  if (lowPowerTickless) {
    ctx.log('info', 'Phase 9: Configuring Tickless Idle Mode');

    ticklessSetup = await ctx.task(ticklessModeTask, {
      projectName,
      rtosName,
      targetMcu,
      portConfig,
      outputDir
    });

    artifacts.push(...ticklessSetup.artifacts);
  }

  // ============================================================================
  // PHASE 10: INTERRUPT INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Integrating Interrupts with RTOS');

  const interruptIntegration = await ctx.task(rtosInterruptIntegrationTask, {
    projectName,
    rtosName,
    targetMcu,
    portConfig,
    taskArchitecture,
    outputDir
  });

  artifacts.push(...interruptIntegration.artifacts);

  // ============================================================================
  // PHASE 11: DEBUG AND TRACE SUPPORT
  // ============================================================================

  ctx.log('info', 'Phase 11: Adding Debug and Trace Support');

  const debugSupport = await ctx.task(rtosDebugSupportTask, {
    projectName,
    rtosName,
    taskArchitecture,
    outputDir
  });

  artifacts.push(...debugSupport.artifacts);

  // ============================================================================
  // PHASE 12: CONFIGURATION HEADER
  // ============================================================================

  ctx.log('info', 'Phase 12: Creating RTOS Configuration Header');

  const configHeader = await ctx.task(rtosConfigHeaderTask, {
    projectName,
    rtosName,
    tickRate,
    heapScheme,
    staticAllocation,
    softwareTimers,
    lowPowerTickless,
    memoryConfig,
    taskArchitecture,
    outputDir
  });

  artifacts.push(...configHeader.artifacts);

  // ============================================================================
  // PHASE 13: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Creating Documentation');

  const documentation = await ctx.task(rtosDocumentationTask, {
    projectName,
    rtosName,
    taskArchitecture,
    ipcSetup,
    syncPrimitives,
    configHeader,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `RTOS Integration Complete for ${projectName}. ${taskImplementation.taskCount} tasks, ${ipcSetup.queueCount} queues. Review integration?`,
    title: 'RTOS Integration Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        rtosName,
        taskCount: taskImplementation.taskCount,
        queueCount: ipcSetup.queueCount,
        semaphoreCount: syncPrimitives.semaphoreCount,
        mutexCount: syncPrimitives.mutexCount
      },
      files: [
        { path: documentation.readmePath, format: 'markdown', label: 'Documentation' },
        { path: configHeader.configPath, format: 'c', label: 'RTOS Config' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    rtosName,
    rtosConfig: {
      tickRate,
      heapScheme,
      heapSize: memoryConfig.heapSize,
      staticAllocation,
      softwareTimers,
      lowPowerTickless,
      configPath: configHeader.configPath
    },
    tasks: taskImplementation.tasks,
    ipcMechanisms: {
      queues: ipcSetup.queues,
      eventGroups: ipcSetup.eventGroups
    },
    synchronization: {
      semaphores: syncPrimitives.semaphores,
      mutexes: syncPrimitives.mutexes
    },
    interrupts: {
      priorities: interruptIntegration.priorities,
      deferredHandling: interruptIntegration.deferredHandlers
    },
    documentation: {
      readmePath: documentation.readmePath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/rtos-integration',
      timestamp: startTime,
      projectName,
      rtosName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const rtosRequirementsTask = defineTask('rtos-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: RTOS Requirements - ${args.projectName}`,
  agent: {
    name: 'rtos-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Define RTOS integration requirements',
      context: args,
      instructions: [
        '1. Analyze real-time requirements',
        '2. Define task timing requirements',
        '3. Identify inter-task communication needs',
        '4. Specify memory requirements',
        '5. Define interrupt handling needs',
        '6. Identify low-power requirements',
        '7. Specify debugging requirements',
        '8. Define certification requirements (if any)',
        '9. List hardware constraints',
        '10. Document acceptance criteria'
      ],
      outputFormat: 'JSON with RTOS requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['realTimeReqs', 'memoryReqs', 'artifacts'],
      properties: {
        realTimeReqs: { type: 'array', items: { type: 'object' } },
        memoryReqs: { type: 'object' },
        ipcNeeds: { type: 'array', items: { type: 'string' } },
        debugReqs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rtos', 'requirements']
}));

export const rtosPortConfigTask = defineTask('rtos-port-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: RTOS Port Configuration - ${args.projectName}`,
  agent: {
    name: 'rtos-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Configure RTOS port for target MCU',
      context: args,
      instructions: [
        '1. Select appropriate RTOS port',
        '2. Configure SysTick for RTOS tick',
        '3. Set up PendSV handler',
        '4. Configure SVCall handler',
        '5. Set interrupt priority configuration',
        '6. Configure context switch mechanism',
        '7. Set up FPU context saving (if needed)',
        '8. Configure critical section implementation',
        '9. Set up stack overflow checking',
        '10. Document port configuration'
      ],
      outputFormat: 'JSON with port configuration details'
    },
    outputSchema: {
      type: 'object',
      required: ['portFiles', 'tickConfig', 'artifacts'],
      properties: {
        portFiles: { type: 'array', items: { type: 'string' } },
        tickConfig: { type: 'object' },
        priorityConfig: { type: 'object' },
        fpuSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rtos', 'port']
}));

export const rtosMemoryConfigTask = defineTask('rtos-memory-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Memory Configuration - ${args.projectName}`,
  agent: {
    name: 'rtos-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Configure RTOS memory management',
      context: args,
      instructions: [
        '1. Select heap allocation scheme',
        '2. Define total heap size',
        '3. Configure stack sizes for tasks',
        '4. Set up static allocation if required',
        '5. Configure memory pools',
        '6. Add heap usage statistics',
        '7. Configure stack high water mark',
        '8. Set up memory protection (MPU)',
        '9. Add heap corruption detection',
        '10. Document memory layout'
      ],
      outputFormat: 'JSON with memory configuration details'
    },
    outputSchema: {
      type: 'object',
      required: ['heapSize', 'heapScheme', 'artifacts'],
      properties: {
        heapSize: { type: 'string' },
        heapScheme: { type: 'string' },
        stackSizes: { type: 'object' },
        staticBuffers: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rtos', 'memory']
}));

export const taskArchitectureTask = defineTask('task-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Task Architecture - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Embedded Systems Architect',
      task: 'Design task architecture',
      context: args,
      instructions: [
        '1. Define application tasks and responsibilities',
        '2. Assign task priorities (rate monotonic)',
        '3. Define task stack sizes',
        '4. Design task state machines',
        '5. Identify shared resources',
        '6. Define task communication patterns',
        '7. Plan task scheduling strategy',
        '8. Identify timing constraints',
        '9. Design task dependencies',
        '10. Document task architecture'
      ],
      outputFormat: 'JSON with task architecture design'
    },
    outputSchema: {
      type: 'object',
      required: ['tasks', 'priorityScheme', 'artifacts'],
      properties: {
        tasks: { type: 'array', items: { type: 'object' } },
        priorityScheme: { type: 'object' },
        dependencies: { type: 'array', items: { type: 'object' } },
        sharedResources: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rtos', 'task-architecture']
}));

export const taskImplementationTask = defineTask('task-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Task Implementation - ${args.projectName}`,
  agent: {
    name: 'rtos-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Implement RTOS tasks',
      context: args,
      instructions: [
        '1. Create task function templates',
        '2. Implement task creation code',
        '3. Add task initialization sections',
        '4. Implement task main loops',
        '5. Add task delay/blocking calls',
        '6. Implement task notification handling',
        '7. Add task cleanup/delete',
        '8. Create task parameter passing',
        '9. Add task statistics',
        '10. Document task implementations'
      ],
      outputFormat: 'JSON with task implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['tasks', 'taskCount', 'files', 'artifacts'],
      properties: {
        tasks: { type: 'array', items: { type: 'object' } },
        taskCount: { type: 'number' },
        files: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rtos', 'tasks']
}));

export const ipcSetupTask = defineTask('ipc-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: IPC Setup - ${args.projectName}`,
  agent: {
    name: 'rtos-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Set up inter-task communication',
      context: args,
      instructions: [
        '1. Create message queues',
        '2. Define queue sizes and item sizes',
        '3. Implement queue send/receive wrappers',
        '4. Set up event groups if needed',
        '5. Create stream buffers for data streaming',
        '6. Implement message buffer for variable-size data',
        '7. Add queue full/empty handling',
        '8. Create direct task notifications',
        '9. Add IPC statistics',
        '10. Document IPC mechanisms'
      ],
      outputFormat: 'JSON with IPC setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['queues', 'queueCount', 'files', 'artifacts'],
      properties: {
        queues: { type: 'array', items: { type: 'object' } },
        queueCount: { type: 'number' },
        eventGroups: { type: 'array', items: { type: 'object' } },
        streamBuffers: { type: 'array', items: { type: 'object' } },
        files: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rtos', 'ipc']
}));

export const syncPrimitivesTask = defineTask('sync-primitives', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Synchronization - ${args.projectName}`,
  agent: {
    name: 'rtos-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Implement synchronization primitives',
      context: args,
      instructions: [
        '1. Create binary semaphores for signaling',
        '2. Create counting semaphores for resources',
        '3. Implement mutexes for resource protection',
        '4. Add recursive mutex support',
        '5. Configure priority inheritance',
        '6. Handle deadlock prevention',
        '7. Add timeout handling',
        '8. Create critical section wrappers',
        '9. Add synchronization statistics',
        '10. Document synchronization design'
      ],
      outputFormat: 'JSON with synchronization details'
    },
    outputSchema: {
      type: 'object',
      required: ['semaphores', 'mutexes', 'semaphoreCount', 'mutexCount', 'artifacts'],
      properties: {
        semaphores: { type: 'array', items: { type: 'object' } },
        mutexes: { type: 'array', items: { type: 'object' } },
        semaphoreCount: { type: 'number' },
        mutexCount: { type: 'number' },
        files: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rtos', 'synchronization']
}));

export const softwareTimersTask = defineTask('software-timers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Software Timers - ${args.projectName}`,
  agent: {
    name: 'rtos-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Set up software timers',
      context: args,
      instructions: [
        '1. Configure timer daemon task',
        '2. Create one-shot timers',
        '3. Create auto-reload timers',
        '4. Implement timer callbacks',
        '5. Add timer start/stop/reset',
        '6. Handle timer from ISR',
        '7. Configure timer queue length',
        '8. Add timer ID usage',
        '9. Create timer statistics',
        '10. Document timer usage'
      ],
      outputFormat: 'JSON with software timer details'
    },
    outputSchema: {
      type: 'object',
      required: ['timers', 'daemonConfig', 'artifacts'],
      properties: {
        timers: { type: 'array', items: { type: 'object' } },
        daemonConfig: { type: 'object' },
        files: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rtos', 'timers']
}));

export const ticklessModeTask = defineTask('tickless-mode', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Tickless Mode - ${args.projectName}`,
  agent: {
    name: 'rtos-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Configure tickless idle mode',
      context: args,
      instructions: [
        '1. Enable tickless idle configuration',
        '2. Implement pre-sleep processing',
        '3. Implement post-sleep processing',
        '4. Configure low-power timer for wake',
        '5. Calculate sleep duration',
        '6. Handle tick compensation',
        '7. Add minimum sleep threshold',
        '8. Handle interrupt wake sources',
        '9. Test power consumption',
        '10. Document tickless configuration'
      ],
      outputFormat: 'JSON with tickless mode details'
    },
    outputSchema: {
      type: 'object',
      required: ['enabled', 'sleepMode', 'artifacts'],
      properties: {
        enabled: { type: 'boolean' },
        sleepMode: { type: 'string' },
        wakeTimer: { type: 'string' },
        minSleepTime: { type: 'string' },
        files: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rtos', 'tickless', 'low-power']
}));

export const rtosInterruptIntegrationTask = defineTask('rtos-interrupt-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Interrupt Integration - ${args.projectName}`,
  agent: {
    name: 'rtos-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Integrate interrupts with RTOS',
      context: args,
      instructions: [
        '1. Configure interrupt priority levels',
        '2. Separate RTOS-aware vs raw interrupts',
        '3. Implement deferred interrupt processing',
        '4. Create ISR-safe API wrappers',
        '5. Use task notifications from ISR',
        '6. Handle queue operations from ISR',
        '7. Implement semaphore give from ISR',
        '8. Add interrupt latency measurement',
        '9. Configure interrupt nesting',
        '10. Document interrupt handling'
      ],
      outputFormat: 'JSON with interrupt integration details'
    },
    outputSchema: {
      type: 'object',
      required: ['priorities', 'deferredHandlers', 'artifacts'],
      properties: {
        priorities: { type: 'object' },
        deferredHandlers: { type: 'array', items: { type: 'object' } },
        isrSafeFunctions: { type: 'array', items: { type: 'string' } },
        files: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rtos', 'interrupts']
}));

export const rtosDebugSupportTask = defineTask('rtos-debug-support', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Debug Support - ${args.projectName}`,
  agent: {
    name: 'rtos-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Add RTOS debug and trace support',
      context: args,
      instructions: [
        '1. Enable trace facility',
        '2. Configure task trace hooks',
        '3. Add runtime statistics',
        '4. Enable stack overflow hooks',
        '5. Add malloc failed hook',
        '6. Configure assert handler',
        '7. Add task list command',
        '8. Enable queue registry',
        '9. Add CPU usage statistics',
        '10. Document debug features'
      ],
      outputFormat: 'JSON with debug support details'
    },
    outputSchema: {
      type: 'object',
      required: ['debugFeatures', 'hooks', 'artifacts'],
      properties: {
        debugFeatures: { type: 'array', items: { type: 'string' } },
        hooks: { type: 'array', items: { type: 'string' } },
        traceEnabled: { type: 'boolean' },
        statisticsEnabled: { type: 'boolean' },
        files: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rtos', 'debug']
}));

export const rtosConfigHeaderTask = defineTask('rtos-config-header', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Config Header - ${args.projectName}`,
  agent: {
    name: 'rtos-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Create RTOS configuration header',
      context: args,
      instructions: [
        '1. Create FreeRTOSConfig.h or equivalent',
        '2. Set tick rate and time slicing',
        '3. Configure heap scheme and size',
        '4. Set maximum priorities',
        '5. Enable/disable features',
        '6. Configure stack sizes',
        '7. Set timer configuration',
        '8. Configure interrupt priorities',
        '9. Enable debug options',
        '10. Document all options'
      ],
      outputFormat: 'JSON with configuration header details'
    },
    outputSchema: {
      type: 'object',
      required: ['configPath', 'options', 'artifacts'],
      properties: {
        configPath: { type: 'string' },
        options: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rtos', 'configuration']
}));

export const rtosDocumentationTask = defineTask('rtos-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Documentation - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Create RTOS integration documentation',
      context: args,
      instructions: [
        '1. Create README with overview',
        '2. Document task architecture',
        '3. Document IPC mechanisms',
        '4. Document synchronization usage',
        '5. Create timing diagram',
        '6. Document configuration options',
        '7. Add debugging guide',
        '8. Document best practices',
        '9. Create troubleshooting guide',
        '10. Add code examples'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        architectureDocPath: { type: 'string' },
        apiDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'rtos', 'documentation']
}));
