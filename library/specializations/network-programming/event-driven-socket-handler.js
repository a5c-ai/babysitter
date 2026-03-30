/**
 * @process specializations/network-programming/event-driven-socket-handler
 * @description Event-Driven Socket Handler - Implement a high-performance event-driven socket handler using platform-specific
 * I/O multiplexing (epoll on Linux, kqueue on BSD/macOS, IOCP on Windows). Covers event loop architecture, connection state
 * machines, timer handling, and performance optimization for low latency and high throughput.
 * @inputs { projectName: string, language: string, platform?: string, targetConnections?: number, requirements?: object }
 * @outputs { success: boolean, handlerConfig: object, implementation: object, benchmarks: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/event-driven-socket-handler', {
 *   projectName: 'High-Frequency Trading Gateway',
 *   language: 'C',
 *   platform: 'linux',
 *   targetConnections: 100000,
 *   requirements: {
 *     latency: '<10us',
 *     throughput: '1M events/sec'
 *   }
 * });
 *
 * @references
 * - epoll: https://man7.org/linux/man-pages/man7/epoll.7.html
 * - kqueue: https://www.freebsd.org/cgi/man.cgi?query=kqueue
 * - The C10K Problem: http://www.kegel.com/c10k.html
 * - io_uring: https://kernel.dk/io_uring.pdf
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'C',
    platform = 'linux',
    targetConnections = 10000,
    requirements = {},
    enableTimers = true,
    enableSignals = true,
    outputDir = 'event-driven-socket-handler'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Event-Driven Socket Handler Implementation: ${projectName}`);
  ctx.log('info', `Platform: ${platform}, Target Connections: ${targetConnections}`);

  // ============================================================================
  // PHASE 1: PLATFORM ANALYSIS AND API SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing platform and selecting I/O multiplexing API');

  const platformAnalysis = await ctx.task(platformAnalysisTask, {
    projectName,
    language,
    platform,
    targetConnections,
    requirements,
    outputDir
  });

  artifacts.push(...platformAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: Selected ${platformAnalysis.selectedApi} for ${platform}. Expected performance: ${platformAnalysis.expectedPerformance}. Proceed with event loop design?`,
    title: 'Platform Analysis Review',
    context: {
      runId: ctx.runId,
      selectedApi: platformAnalysis.selectedApi,
      apiCapabilities: platformAnalysis.apiCapabilities,
      expectedPerformance: platformAnalysis.expectedPerformance,
      files: platformAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: EVENT LOOP ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing event loop architecture');

  const eventLoopDesign = await ctx.task(eventLoopDesignTask, {
    projectName,
    language,
    platformAnalysis,
    targetConnections,
    enableTimers,
    enableSignals,
    outputDir
  });

  artifacts.push(...eventLoopDesign.artifacts);

  // ============================================================================
  // PHASE 3: EVENT REGISTRATION IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing event registration and management');

  const eventRegistration = await ctx.task(eventRegistrationTask, {
    projectName,
    language,
    platformAnalysis,
    eventLoopDesign,
    outputDir
  });

  artifacts.push(...eventRegistration.artifacts);

  // ============================================================================
  // PHASE 4: CONNECTION STATE MACHINE
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing connection state machine');

  const stateMachine = await ctx.task(stateMachineTask, {
    projectName,
    language,
    eventLoopDesign,
    outputDir
  });

  artifacts.push(...stateMachine.artifacts);

  // ============================================================================
  // PHASE 5: EVENT HANDLERS IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing event handlers');

  const eventHandlers = await ctx.task(eventHandlersTask, {
    projectName,
    language,
    platformAnalysis,
    eventLoopDesign,
    stateMachine,
    outputDir
  });

  artifacts.push(...eventHandlers.artifacts);

  // ============================================================================
  // PHASE 6: TIMER AND SIGNAL HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing timer and signal handling');

  const timerSignalHandling = await ctx.task(timerSignalTask, {
    projectName,
    language,
    platformAnalysis,
    eventLoopDesign,
    enableTimers,
    enableSignals,
    outputDir
  });

  artifacts.push(...timerSignalHandling.artifacts);

  // ============================================================================
  // PHASE 7: PERFORMANCE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Optimizing for performance');

  const performanceOptimization = await ctx.task(performanceOptimizationTask, {
    projectName,
    language,
    platformAnalysis,
    eventLoopDesign,
    requirements,
    outputDir
  });

  artifacts.push(...performanceOptimization.artifacts);

  await ctx.breakpoint({
    question: `Phase 7 Complete: Performance optimizations applied. Expected latency: ${performanceOptimization.expectedLatency}. Proceed with load testing?`,
    title: 'Performance Optimization Review',
    context: {
      runId: ctx.runId,
      optimizations: performanceOptimization.optimizations,
      expectedMetrics: performanceOptimization.expectedMetrics,
      files: performanceOptimization.artifacts.map(a => ({ path: a.path, format: a.format || 'c' }))
    }
  });

  // ============================================================================
  // PHASE 8: LOAD TESTING AND BENCHMARKING
  // ============================================================================

  ctx.log('info', 'Phase 8: Running load tests and benchmarks');

  const benchmarks = await ctx.task(benchmarkTask, {
    projectName,
    language,
    targetConnections,
    requirements,
    eventLoopDesign,
    performanceOptimization,
    outputDir
  });

  artifacts.push(...benchmarks.artifacts);

  // ============================================================================
  // PHASE 9: DOCUMENTATION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating documentation and validation');

  const [documentation, validation] = await ctx.parallel.all([
    () => ctx.task(documentationTask, {
      projectName,
      platformAnalysis,
      eventLoopDesign,
      stateMachine,
      eventHandlers,
      timerSignalHandling,
      performanceOptimization,
      benchmarks,
      outputDir
    }),
    () => ctx.task(validationTask, {
      projectName,
      requirements,
      benchmarks,
      outputDir
    })
  ]);

  artifacts.push(...documentation.artifacts);
  artifacts.push(...validation.artifacts);

  await ctx.breakpoint({
    question: `Event-Driven Socket Handler Complete for ${projectName}! Validation score: ${validation.overallScore}/100. Benchmark: ${benchmarks.connectionsHandled} connections, ${benchmarks.eventsPerSecond} events/sec. Review deliverables?`,
    title: 'Event-Driven Socket Handler Complete - Final Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        platform,
        selectedApi: platformAnalysis.selectedApi,
        validationScore: validation.overallScore,
        benchmarkResults: benchmarks.summary
      },
      files: [
        { path: documentation.readmePath, format: 'markdown', label: 'README' },
        { path: documentation.architecturePath, format: 'markdown', label: 'Architecture' },
        { path: benchmarks.reportPath, format: 'json', label: 'Benchmark Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validation.overallScore >= 80,
    projectName,
    handlerConfig: {
      platform,
      api: platformAnalysis.selectedApi,
      targetConnections,
      enableTimers,
      enableSignals
    },
    implementation: {
      eventLoop: eventLoopDesign.architecture,
      stateMachine: stateMachine.states,
      eventHandlers: eventHandlers.handlers,
      optimizations: performanceOptimization.optimizations
    },
    benchmarks: {
      connectionsHandled: benchmarks.connectionsHandled,
      eventsPerSecond: benchmarks.eventsPerSecond,
      latencyP50: benchmarks.latencyP50,
      latencyP99: benchmarks.latencyP99
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/network-programming/event-driven-socket-handler',
      timestamp: startTime,
      platform,
      api: platformAnalysis.selectedApi
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const platformAnalysisTask = defineTask('platform-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Platform Analysis - ${args.projectName}`,
  skill: { name: 'event-loop' },
  agent: {
    name: 'hpc-network-expert',
    prompt: {
      role: 'High-Performance Systems Architect',
      task: 'Analyze platform and select I/O multiplexing API',
      context: args,
      instructions: [
        '1. Analyze target platform capabilities',
        '2. Evaluate I/O multiplexing options (epoll, kqueue, IOCP, io_uring)',
        '3. Compare API characteristics and performance profiles',
        '4. Select optimal API for requirements',
        '5. Document edge-triggered vs level-triggered trade-offs',
        '6. Evaluate cross-platform abstraction needs',
        '7. Assess kernel version requirements',
        '8. Generate platform analysis report'
      ],
      outputFormat: 'JSON with platform analysis and API selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedApi', 'apiCapabilities', 'expectedPerformance', 'artifacts'],
      properties: {
        selectedApi: { type: 'string' },
        apiCapabilities: { type: 'object' },
        expectedPerformance: { type: 'string' },
        platformRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'event-driven', 'platform-analysis']
}));

export const eventLoopDesignTask = defineTask('event-loop-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Event Loop Design - ${args.projectName}`,
  skill: { name: 'event-loop' },
  agent: {
    name: 'hpc-network-expert',
    prompt: {
      role: 'Event-Driven Systems Architect',
      task: 'Design event loop architecture',
      context: args,
      instructions: [
        '1. Design main event loop structure',
        '2. Define event dispatch mechanism',
        '3. Design callback/handler registration',
        '4. Plan timer wheel/heap integration',
        '5. Design signal handling integration',
        '6. Plan for multi-threaded scenarios',
        '7. Design event batching strategy',
        '8. Document architecture decisions'
      ],
      outputFormat: 'JSON with event loop architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'components', 'artifacts'],
      properties: {
        architecture: { type: 'object' },
        components: { type: 'array' },
        dispatchMechanism: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'event-driven', 'architecture']
}));

export const eventRegistrationTask = defineTask('event-registration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Event Registration - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: {
    name: 'hpc-network-expert',
    prompt: {
      role: 'Event Systems Engineer',
      task: 'Implement event registration and management',
      context: args,
      instructions: [
        '1. Implement event context creation',
        '2. Implement event add/modify/remove operations',
        '3. Handle edge-triggered vs level-triggered modes',
        '4. Implement ONESHOT event handling',
        '5. Add event interest modification',
        '6. Implement proper error handling',
        '7. Add event debugging capabilities',
        '8. Document event management API'
      ],
      outputFormat: 'JSON with event registration implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['operations', 'eventTypes', 'artifacts'],
      properties: {
        operations: { type: 'array' },
        eventTypes: { type: 'array' },
        errorHandling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'event-driven', 'event-registration']
}));

export const stateMachineTask = defineTask('state-machine', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Connection State Machine - ${args.projectName}`,
  skill: { name: 'event-loop' },
  agent: {
    name: 'hpc-network-expert',
    prompt: {
      role: 'Protocol State Machine Engineer',
      task: 'Implement connection state machine',
      context: args,
      instructions: [
        '1. Define connection states (connecting, connected, reading, writing, closing)',
        '2. Implement state transitions',
        '3. Add state-specific event handling',
        '4. Implement timeout per state',
        '5. Add state change callbacks',
        '6. Handle error states and recovery',
        '7. Create state machine visualization',
        '8. Document state transitions'
      ],
      outputFormat: 'JSON with state machine implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['states', 'transitions', 'artifacts'],
      properties: {
        states: { type: 'array' },
        transitions: { type: 'array' },
        errorStates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'event-driven', 'state-machine']
}));

export const eventHandlersTask = defineTask('event-handlers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Event Handlers - ${args.projectName}`,
  skill: { name: 'event-loop' },
  agent: {
    name: 'hpc-network-expert',
    prompt: {
      role: 'Event Handler Engineer',
      task: 'Implement event handlers',
      context: args,
      instructions: [
        '1. Implement read readiness handler',
        '2. Implement write readiness handler',
        '3. Implement accept handler for listeners',
        '4. Implement connection complete handler',
        '5. Implement error/hangup handlers',
        '6. Add handler chaining support',
        '7. Implement handler priority',
        '8. Add handler performance metrics'
      ],
      outputFormat: 'JSON with event handlers implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['handlers', 'handlerTypes', 'artifacts'],
      properties: {
        handlers: { type: 'array' },
        handlerTypes: { type: 'array' },
        metrics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'event-driven', 'handlers']
}));

export const timerSignalTask = defineTask('timer-signal', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Timer and Signal Handling - ${args.projectName}`,
  skill: { name: 'event-loop' },
  agent: {
    name: 'hpc-network-expert',
    prompt: {
      role: 'Systems Engineer',
      task: 'Implement timer and signal handling',
      context: args,
      instructions: [
        '1. Implement timer wheel or heap for timeouts',
        '2. Add one-shot and repeating timers',
        '3. Implement timer cancellation',
        '4. Add signal fd integration (signalfd)',
        '5. Handle SIGTERM, SIGINT for shutdown',
        '6. Implement timer coalescing for efficiency',
        '7. Add timer accuracy metrics',
        '8. Document timer and signal API'
      ],
      outputFormat: 'JSON with timer and signal implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['timerImplementation', 'signalHandling', 'artifacts'],
      properties: {
        timerImplementation: { type: 'object' },
        signalHandling: { type: 'object' },
        timerTypes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'event-driven', 'timer-signal']
}));

export const performanceOptimizationTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Performance Optimization - ${args.projectName}`,
  skill: { name: 'event-loop' },
  agent: {
    name: 'hpc-network-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Optimize for low latency and high throughput',
      context: args,
      instructions: [
        '1. Optimize event batch processing',
        '2. Minimize syscall overhead',
        '3. Implement lock-free data structures where applicable',
        '4. Optimize memory allocation patterns',
        '5. Add CPU affinity support',
        '6. Implement NUMA awareness if applicable',
        '7. Profile and identify bottlenecks',
        '8. Document optimization techniques'
      ],
      outputFormat: 'JSON with performance optimizations'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'expectedLatency', 'expectedMetrics', 'artifacts'],
      properties: {
        optimizations: { type: 'array' },
        expectedLatency: { type: 'string' },
        expectedMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'event-driven', 'performance']
}));

export const benchmarkTask = defineTask('benchmark', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Benchmarking - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: {
    name: 'network-testing-expert',
    prompt: {
      role: 'Performance Testing Engineer',
      task: 'Run load tests and benchmarks',
      context: args,
      instructions: [
        '1. Create benchmark test harness',
        '2. Test maximum connection handling',
        '3. Measure events per second throughput',
        '4. Measure latency distribution (p50, p95, p99)',
        '5. Test under sustained load',
        '6. Test burst scenarios',
        '7. Compare against requirements',
        '8. Generate benchmark report'
      ],
      outputFormat: 'JSON with benchmark results'
    },
    outputSchema: {
      type: 'object',
      required: ['connectionsHandled', 'eventsPerSecond', 'latencyP50', 'latencyP99', 'artifacts'],
      properties: {
        connectionsHandled: { type: 'number' },
        eventsPerSecond: { type: 'number' },
        latencyP50: { type: 'string' },
        latencyP99: { type: 'string' },
        summary: { type: 'object' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'event-driven', 'benchmark']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Documentation - ${args.projectName}`,
  agent: {
    name: 'network-architect',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate comprehensive documentation',
      context: args,
      instructions: [
        '1. Create README with overview',
        '2. Document event loop architecture',
        '3. Document API and usage',
        '4. Create state machine diagrams',
        '5. Document performance tuning',
        '6. Create troubleshooting guide',
        '7. Document benchmark results',
        '8. Create integration guide'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'architecturePath', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        architecturePath: { type: 'string' },
        apiDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'event-driven', 'documentation']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Validation - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: {
    name: 'network-testing-expert',
    prompt: {
      role: 'QA Engineer',
      task: 'Validate implementation against requirements',
      context: args,
      instructions: [
        '1. Verify all requirements met',
        '2. Validate benchmark results against targets',
        '3. Check code quality',
        '4. Verify error handling completeness',
        '5. Validate documentation',
        '6. Calculate validation score',
        '7. Generate validation report'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'passedChecks', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        passedChecks: { type: 'array' },
        failedChecks: { type: 'array' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'event-driven', 'validation']
}));
