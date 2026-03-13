/**
 * @process specializations/network-programming/tcp-socket-server
 * @description TCP Socket Server Implementation - Design and implement a high-performance TCP server with proper
 * connection handling, error management, I/O model selection (blocking, non-blocking, epoll/kqueue), and graceful shutdown.
 * Covers socket creation, binding, listening, accept handling, read/write operations with buffering, and monitoring.
 * @inputs { projectName: string, language: string, ioModel?: string, maxConnections?: number, requirements?: object }
 * @outputs { success: boolean, serverConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/tcp-socket-server', {
 *   projectName: 'High-Performance Chat Server',
 *   language: 'C',
 *   ioModel: 'epoll',
 *   maxConnections: 10000,
 *   requirements: {
 *     throughput: '100k msg/sec',
 *     latency: '<1ms p99',
 *     keepAlive: true
 *   }
 * });
 *
 * @references
 * - Beej's Guide to Network Programming: https://beej.us/guide/bgnet/
 * - Linux Socket Man Page: https://man7.org/linux/man-pages/man7/socket.7.html
 * - The C10K Problem: http://www.kegel.com/c10k.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'C',
    ioModel = 'non-blocking',
    maxConnections = 10000,
    requirements = {},
    bufferSize = 8192,
    keepAlive = true,
    outputDir = 'tcp-socket-server'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting TCP Socket Server Implementation: ${projectName}`);
  ctx.log('info', `Language: ${language}, I/O Model: ${ioModel}`);
  ctx.log('info', `Max Connections: ${maxConnections}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing server requirements and constraints');

  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    projectName,
    language,
    ioModel,
    maxConnections,
    requirements,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: Requirements analyzed for ${language} TCP server with ${ioModel} I/O model. Estimated complexity: ${requirementsAnalysis.complexity}. Proceed with architecture design?`,
    title: 'Requirements Analysis Review',
    context: {
      runId: ctx.runId,
      requirements: requirementsAnalysis.requirements,
      ioModelSelection: requirementsAnalysis.ioModelDetails,
      platformSupport: requirementsAnalysis.platformSupport,
      files: requirementsAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing server architecture');

  const architectureDesign = await ctx.task(architectureDesignTask, {
    projectName,
    language,
    ioModel,
    maxConnections,
    requirements: requirementsAnalysis.requirements,
    bufferSize,
    outputDir
  });

  artifacts.push(...architectureDesign.artifacts);

  // ============================================================================
  // PHASE 3: SOCKET IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing core socket operations');

  const socketImplementation = await ctx.task(socketImplementationTask, {
    projectName,
    language,
    ioModel,
    architectureDesign,
    bufferSize,
    keepAlive,
    outputDir
  });

  artifacts.push(...socketImplementation.artifacts);

  // ============================================================================
  // PHASE 4: CONNECTION MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing connection management');

  const connectionManagement = await ctx.task(connectionManagementTask, {
    projectName,
    language,
    maxConnections,
    architectureDesign,
    socketImplementation,
    outputDir
  });

  artifacts.push(...connectionManagement.artifacts);

  // ============================================================================
  // PHASE 5: EVENT LOOP / I/O MULTIPLEXING
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing event loop and I/O handling');

  const eventLoopImplementation = await ctx.task(eventLoopTask, {
    projectName,
    language,
    ioModel,
    architectureDesign,
    connectionManagement,
    outputDir
  });

  artifacts.push(...eventLoopImplementation.artifacts);

  // ============================================================================
  // PHASE 6: ERROR HANDLING AND RECOVERY
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing error handling and recovery');

  const errorHandling = await ctx.task(errorHandlingTask, {
    projectName,
    language,
    architectureDesign,
    socketImplementation,
    outputDir
  });

  artifacts.push(...errorHandling.artifacts);

  // ============================================================================
  // PHASE 7: GRACEFUL SHUTDOWN
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing graceful shutdown mechanism');

  const gracefulShutdown = await ctx.task(gracefulShutdownTask, {
    projectName,
    language,
    connectionManagement,
    eventLoopImplementation,
    outputDir
  });

  artifacts.push(...gracefulShutdown.artifacts);

  // ============================================================================
  // PHASE 8: LOGGING AND MONITORING
  // ============================================================================

  ctx.log('info', 'Phase 8: Adding logging and monitoring capabilities');

  const monitoring = await ctx.task(monitoringTask, {
    projectName,
    language,
    architectureDesign,
    connectionManagement,
    outputDir
  });

  artifacts.push(...monitoring.artifacts);

  await ctx.breakpoint({
    question: `Phase 8 Complete: Monitoring configured with ${monitoring.metrics.length} metrics. Proceed with testing?`,
    title: 'Implementation Review',
    context: {
      runId: ctx.runId,
      metrics: monitoring.metrics,
      loggingLevels: monitoring.loggingLevels,
      files: monitoring.artifacts.map(a => ({ path: a.path, format: a.format || 'c' }))
    }
  });

  // ============================================================================
  // PHASE 9: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating test suite');

  const testSuite = await ctx.task(testSuiteTask, {
    projectName,
    language,
    maxConnections,
    requirements,
    socketImplementation,
    connectionManagement,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 10: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating documentation');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    language,
    ioModel,
    architectureDesign,
    socketImplementation,
    connectionManagement,
    eventLoopImplementation,
    errorHandling,
    gracefulShutdown,
    monitoring,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 11: VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Validating implementation');

  const validation = await ctx.task(validationTask, {
    projectName,
    requirements: requirementsAnalysis.requirements,
    architectureDesign,
    socketImplementation,
    testSuite,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  await ctx.breakpoint({
    question: `TCP Socket Server Implementation Complete for ${projectName}! Validation score: ${validation.overallScore}/100. Review deliverables?`,
    title: 'TCP Socket Server Complete - Final Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        language,
        ioModel,
        maxConnections,
        validationScore: validation.overallScore,
        testsPassed: testSuite.passedTests,
        totalTests: testSuite.totalTests
      },
      files: [
        { path: documentation.readmePath, format: 'markdown', label: 'README' },
        { path: documentation.apiDocPath, format: 'markdown', label: 'API Documentation' },
        { path: validation.reportPath, format: 'json', label: 'Validation Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validation.overallScore >= 80,
    projectName,
    serverConfig: {
      language,
      ioModel,
      maxConnections,
      bufferSize,
      keepAlive,
      architecture: architectureDesign.architecture
    },
    implementation: {
      socketOperations: socketImplementation.operations,
      connectionManagement: connectionManagement.features,
      eventLoop: eventLoopImplementation.model,
      errorHandling: errorHandling.strategies,
      gracefulShutdown: gracefulShutdown.mechanism
    },
    testResults: {
      totalTests: testSuite.totalTests,
      passedTests: testSuite.passedTests,
      failedTests: testSuite.failedTests,
      coverage: testSuite.coverage
    },
    validation: {
      overallScore: validation.overallScore,
      passedChecks: validation.passedChecks,
      recommendations: validation.recommendations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/network-programming/tcp-socket-server',
      timestamp: startTime,
      language,
      ioModel
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements Analysis - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: {
    name: 'network-architect',
    prompt: {
      role: 'Senior Network Systems Architect',
      task: 'Analyze TCP server requirements and recommend I/O model',
      context: {
        projectName: args.projectName,
        language: args.language,
        ioModel: args.ioModel,
        maxConnections: args.maxConnections,
        requirements: args.requirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze performance requirements (throughput, latency, connections)',
        '2. Evaluate I/O model selection (blocking, non-blocking, epoll, kqueue, IOCP)',
        '3. Assess platform compatibility and portability needs',
        '4. Identify resource constraints (memory, CPU, file descriptors)',
        '5. Define buffer sizing strategies',
        '6. Evaluate keep-alive and connection timeout requirements',
        '7. Assess security requirements (TLS readiness)',
        '8. Define scalability requirements',
        '9. Estimate implementation complexity',
        '10. Generate requirements specification document'
      ],
      outputFormat: 'JSON with requirements analysis and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'ioModelDetails', 'complexity', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        ioModelDetails: { type: 'object' },
        platformSupport: { type: 'object' },
        complexity: { type: 'string', enum: ['low', 'medium', 'high', 'very-high'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'tcp', 'requirements']
}));

export const architectureDesignTask = defineTask('architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Architecture Design - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: {
    name: 'network-architect',
    prompt: {
      role: 'Systems Architect specializing in high-performance networking',
      task: 'Design TCP server architecture',
      context: args,
      instructions: [
        '1. Design overall server architecture',
        '2. Define component interactions and data flow',
        '3. Design connection state machine',
        '4. Plan buffer management strategy',
        '5. Design thread/process model if applicable',
        '6. Define API boundaries and interfaces',
        '7. Create architecture diagrams',
        '8. Document design decisions and trade-offs'
      ],
      outputFormat: 'JSON with architecture design'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'components', 'artifacts'],
      properties: {
        architecture: { type: 'object' },
        components: { type: 'array' },
        stateMachine: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'tcp', 'architecture']
}));

export const socketImplementationTask = defineTask('socket-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Socket Implementation - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: {
    name: 'hpc-network-expert',
    prompt: {
      role: 'Network Systems Developer',
      task: 'Implement core socket operations',
      context: args,
      instructions: [
        '1. Implement socket creation with proper options',
        '2. Implement binding to address and port',
        '3. Implement listen with appropriate backlog',
        '4. Implement accept handling',
        '5. Implement read/write operations with buffering',
        '6. Configure socket options (SO_REUSEADDR, TCP_NODELAY, etc.)',
        '7. Implement non-blocking mode if applicable',
        '8. Add proper error checking for all operations'
      ],
      outputFormat: 'JSON with socket implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['operations', 'socketOptions', 'artifacts'],
      properties: {
        operations: { type: 'array' },
        socketOptions: { type: 'array' },
        codeFiles: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'tcp', 'socket']
}));

export const connectionManagementTask = defineTask('connection-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Connection Management - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: {
    name: 'hpc-network-expert',
    prompt: {
      role: 'Connection Management Engineer',
      task: 'Implement connection lifecycle management',
      context: args,
      instructions: [
        '1. Implement connection tracking data structure',
        '2. Implement connection acceptance and registration',
        '3. Implement connection timeout handling',
        '4. Implement keep-alive mechanism',
        '5. Implement connection cleanup and removal',
        '6. Add connection limit enforcement',
        '7. Implement connection state tracking',
        '8. Add connection statistics collection'
      ],
      outputFormat: 'JSON with connection management implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'dataStructures', 'artifacts'],
      properties: {
        features: { type: 'array' },
        dataStructures: { type: 'array' },
        connectionStates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'tcp', 'connection-management']
}));

export const eventLoopTask = defineTask('event-loop', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Event Loop Implementation - ${args.projectName}`,
  skill: { name: 'event-loop' },
  agent: {
    name: 'hpc-network-expert',
    prompt: {
      role: 'Event-Driven Systems Engineer',
      task: 'Implement event loop and I/O multiplexing',
      context: args,
      instructions: [
        '1. Implement main event loop structure',
        '2. Configure I/O multiplexing (epoll/kqueue/IOCP/select)',
        '3. Implement event registration and modification',
        '4. Handle read/write readiness events',
        '5. Implement timer events for timeouts',
        '6. Handle signal events (SIGTERM, SIGINT)',
        '7. Optimize for low latency',
        '8. Add event loop performance monitoring'
      ],
      outputFormat: 'JSON with event loop implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'eventTypes', 'artifacts'],
      properties: {
        model: { type: 'string' },
        eventTypes: { type: 'array' },
        loopStructure: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'tcp', 'event-loop']
}));

export const errorHandlingTask = defineTask('error-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Error Handling - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: {
    name: 'hpc-network-expert',
    prompt: {
      role: 'Reliability Engineer',
      task: 'Implement comprehensive error handling',
      context: args,
      instructions: [
        '1. Handle EAGAIN/EWOULDBLOCK for non-blocking I/O',
        '2. Handle EINTR for interrupted system calls',
        '3. Handle connection reset (ECONNRESET, EPIPE)',
        '4. Implement error recovery strategies',
        '5. Add error logging with context',
        '6. Implement graceful degradation',
        '7. Handle resource exhaustion (EMFILE, ENOMEM)',
        '8. Document error handling procedures'
      ],
      outputFormat: 'JSON with error handling strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'errorCodes', 'artifacts'],
      properties: {
        strategies: { type: 'array' },
        errorCodes: { type: 'array' },
        recoveryProcedures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'tcp', 'error-handling']
}));

export const gracefulShutdownTask = defineTask('graceful-shutdown', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Graceful Shutdown - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: {
    name: 'hpc-network-expert',
    prompt: {
      role: 'Systems Engineer',
      task: 'Implement graceful shutdown mechanism',
      context: args,
      instructions: [
        '1. Implement signal handler for shutdown signals',
        '2. Stop accepting new connections',
        '3. Drain existing connections gracefully',
        '4. Implement shutdown timeout',
        '5. Clean up resources (sockets, memory)',
        '6. Log shutdown progress',
        '7. Handle forced shutdown after timeout',
        '8. Ensure proper cleanup order'
      ],
      outputFormat: 'JSON with graceful shutdown implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanism', 'shutdownSteps', 'artifacts'],
      properties: {
        mechanism: { type: 'object' },
        shutdownSteps: { type: 'array' },
        timeouts: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'tcp', 'graceful-shutdown']
}));

export const monitoringTask = defineTask('monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Monitoring - ${args.projectName}`,
  skill: { name: 'network-simulation' },
  agent: {
    name: 'network-architect',
    prompt: {
      role: 'Monitoring and Observability Engineer',
      task: 'Implement logging and monitoring',
      context: args,
      instructions: [
        '1. Implement structured logging',
        '2. Add connection metrics (active, total, rate)',
        '3. Add throughput metrics (bytes in/out)',
        '4. Add latency metrics',
        '5. Add error rate metrics',
        '6. Implement metrics export (Prometheus format)',
        '7. Add health check endpoint',
        '8. Document metrics and their meanings'
      ],
      outputFormat: 'JSON with monitoring implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'loggingLevels', 'artifacts'],
      properties: {
        metrics: { type: 'array' },
        loggingLevels: { type: 'array' },
        exportFormats: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'tcp', 'monitoring']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Test Suite - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: {
    name: 'network-testing-expert',
    prompt: {
      role: 'Network Testing Engineer',
      task: 'Create comprehensive test suite',
      context: args,
      instructions: [
        '1. Create unit tests for socket operations',
        '2. Create integration tests for connection handling',
        '3. Create load tests for max connections',
        '4. Create stress tests for error conditions',
        '5. Test graceful shutdown scenarios',
        '6. Test error recovery',
        '7. Benchmark performance',
        '8. Document test procedures'
      ],
      outputFormat: 'JSON with test suite details'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'passedTests', 'failedTests', 'artifacts'],
      properties: {
        totalTests: { type: 'number' },
        passedTests: { type: 'number' },
        failedTests: { type: 'number' },
        coverage: { type: 'number' },
        testCategories: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'tcp', 'testing']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Documentation - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: {
    name: 'network-architect',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate comprehensive documentation',
      context: args,
      instructions: [
        '1. Create README with overview and quick start',
        '2. Document API and usage examples',
        '3. Document architecture and design decisions',
        '4. Create configuration guide',
        '5. Document error codes and troubleshooting',
        '6. Create performance tuning guide',
        '7. Document monitoring and metrics',
        '8. Create operational runbook'
      ],
      outputFormat: 'JSON with documentation file paths'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'apiDocPath', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        apiDocPath: { type: 'string' },
        architecturePath: { type: 'string' },
        runbookPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'tcp', 'documentation']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Validation - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: {
    name: 'network-testing-expert',
    prompt: {
      role: 'Quality Assurance Engineer',
      task: 'Validate TCP server implementation',
      context: args,
      instructions: [
        '1. Verify all requirements are met',
        '2. Validate performance against targets',
        '3. Check code quality and standards',
        '4. Verify error handling completeness',
        '5. Validate documentation accuracy',
        '6. Check test coverage',
        '7. Calculate overall validation score',
        '8. Generate validation report'
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
        recommendations: { type: 'array' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'tcp', 'validation']
}));
