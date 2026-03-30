/**
 * @process specializations/network-programming/udp-socket-server
 * @description UDP Socket Server Implementation - Build a UDP server for datagram-based communication with packet handling,
 * optional reliability mechanisms, rate limiting, multicast/broadcast support, and flood protection.
 * @inputs { projectName: string, language: string, features?: object, packetSize?: number, rateLimit?: number }
 * @outputs { success: boolean, serverConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/udp-socket-server', {
 *   projectName: 'Game State Sync Server',
 *   language: 'C++',
 *   features: {
 *     multicast: true,
 *     sequencing: true,
 *     acknowledgment: false
 *   },
 *   packetSize: 1400,
 *   rateLimit: 10000
 * });
 *
 * @references
 * - UDP RFC 768: https://www.rfc-editor.org/rfc/rfc768
 * - Beej's Guide to Network Programming: https://beej.us/guide/bgnet/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'C',
    features = { multicast: false, sequencing: false, acknowledgment: false },
    packetSize = 1472,
    rateLimit = 0,
    floodProtection = true,
    outputDir = 'udp-socket-server'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting UDP Socket Server Implementation: ${projectName}`);
  ctx.log('info', `Language: ${language}, Packet Size: ${packetSize}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing UDP server requirements');

  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    projectName,
    language,
    features,
    packetSize,
    rateLimit,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: UDP server requirements analyzed. Features: ${Object.keys(features).filter(k => features[k]).join(', ') || 'basic'}. Proceed with design?`,
    title: 'Requirements Analysis Review',
    context: {
      runId: ctx.runId,
      requirements: requirementsAnalysis.requirements,
      featureAnalysis: requirementsAnalysis.featureAnalysis,
      files: requirementsAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: SOCKET IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing UDP socket operations');

  const socketImplementation = await ctx.task(socketImplementationTask, {
    projectName,
    language,
    features,
    packetSize,
    outputDir
  });

  artifacts.push(...socketImplementation.artifacts);

  // ============================================================================
  // PHASE 3: PACKET HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing packet receive/send handlers');

  const packetHandling = await ctx.task(packetHandlingTask, {
    projectName,
    language,
    packetSize,
    features,
    outputDir
  });

  artifacts.push(...packetHandling.artifacts);

  // ============================================================================
  // PHASE 4: OPTIONAL RELIABILITY
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing optional reliability mechanisms');

  const reliabilityMechanisms = await ctx.task(reliabilityTask, {
    projectName,
    language,
    features,
    outputDir
  });

  artifacts.push(...reliabilityMechanisms.artifacts);

  // ============================================================================
  // PHASE 5: RATE LIMITING AND FLOOD PROTECTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing rate limiting and flood protection');

  const rateLimiting = await ctx.task(rateLimitingTask, {
    projectName,
    language,
    rateLimit,
    floodProtection,
    outputDir
  });

  artifacts.push(...rateLimiting.artifacts);

  // ============================================================================
  // PHASE 6: MULTICAST/BROADCAST SUPPORT
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing multicast/broadcast support');

  const multicastSupport = await ctx.task(multicastTask, {
    projectName,
    language,
    features,
    outputDir
  });

  artifacts.push(...multicastSupport.artifacts);

  // ============================================================================
  // PHASE 7: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating test suite');

  const testSuite = await ctx.task(testSuiteTask, {
    projectName,
    language,
    features,
    packetSize,
    rateLimit,
    socketImplementation,
    packetHandling,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating documentation and validation');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    language,
    features,
    socketImplementation,
    packetHandling,
    reliabilityMechanisms,
    rateLimiting,
    multicastSupport,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const validation = await ctx.task(validationTask, {
    projectName,
    requirementsAnalysis,
    testSuite,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  await ctx.breakpoint({
    question: `UDP Socket Server Implementation Complete for ${projectName}! Validation score: ${validation.overallScore}/100. Review deliverables?`,
    title: 'UDP Socket Server Complete - Final Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        language,
        features: Object.keys(features).filter(k => features[k]),
        validationScore: validation.overallScore,
        testsPassed: testSuite.passedTests
      },
      files: [
        { path: documentation.readmePath, format: 'markdown', label: 'README' },
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
      packetSize,
      features,
      rateLimit,
      floodProtection
    },
    implementation: {
      socketOperations: socketImplementation.operations,
      packetHandling: packetHandling.handlers,
      reliability: reliabilityMechanisms.mechanisms,
      rateLimiting: rateLimiting.configuration,
      multicast: multicastSupport.configuration
    },
    testResults: {
      totalTests: testSuite.totalTests,
      passedTests: testSuite.passedTests,
      failedTests: testSuite.failedTests
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/network-programming/udp-socket-server',
      timestamp: startTime,
      language
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
      role: 'Network Systems Architect',
      task: 'Analyze UDP server requirements',
      context: args,
      instructions: [
        '1. Analyze UDP-specific requirements (latency, packet loss tolerance)',
        '2. Evaluate feature requirements (multicast, sequencing, acks)',
        '3. Determine optimal packet size considering MTU',
        '4. Assess rate limiting and flood protection needs',
        '5. Evaluate platform-specific considerations',
        '6. Document use cases and performance targets',
        '7. Identify reliability trade-offs',
        '8. Generate requirements specification'
      ],
      outputFormat: 'JSON with requirements analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'featureAnalysis', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        featureAnalysis: { type: 'object' },
        tradeoffs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'udp', 'requirements']
}));

export const socketImplementationTask = defineTask('socket-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Socket Implementation - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: {
    name: 'network-architect',
    prompt: {
      role: 'Network Developer',
      task: 'Implement UDP socket operations',
      context: args,
      instructions: [
        '1. Create UDP socket with appropriate options',
        '2. Bind to address and port',
        '3. Configure socket buffer sizes',
        '4. Implement sendto/recvfrom operations',
        '5. Configure non-blocking mode if needed',
        '6. Handle socket errors appropriately',
        '7. Implement address/port reuse options',
        '8. Add proper cleanup on close'
      ],
      outputFormat: 'JSON with socket implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['operations', 'socketOptions', 'artifacts'],
      properties: {
        operations: { type: 'array' },
        socketOptions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'udp', 'socket']
}));

export const packetHandlingTask = defineTask('packet-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Packet Handling - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: {
    name: 'hpc-network-expert',
    prompt: {
      role: 'Packet Processing Engineer',
      task: 'Implement datagram handling',
      context: args,
      instructions: [
        '1. Implement packet receive handler',
        '2. Implement packet send handler',
        '3. Add packet validation (size, format)',
        '4. Implement packet parsing',
        '5. Handle fragmented packets if needed',
        '6. Add packet statistics collection',
        '7. Implement packet queuing',
        '8. Handle out-of-order packets'
      ],
      outputFormat: 'JSON with packet handling implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['handlers', 'validation', 'artifacts'],
      properties: {
        handlers: { type: 'array' },
        validation: { type: 'object' },
        statistics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'udp', 'packet-handling']
}));

export const reliabilityTask = defineTask('reliability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Reliability Mechanisms - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: {
    name: 'network-architect',
    prompt: {
      role: 'Network Reliability Engineer',
      task: 'Implement optional reliability features',
      context: args,
      instructions: [
        '1. Implement sequence number tracking if enabled',
        '2. Add packet ordering/reordering if needed',
        '3. Implement acknowledgment system if enabled',
        '4. Add retransmission logic if using acks',
        '5. Implement duplicate detection',
        '6. Add forward error correction if needed',
        '7. Document reliability trade-offs',
        '8. Make features configurable'
      ],
      outputFormat: 'JSON with reliability mechanisms'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanisms', 'configuration', 'artifacts'],
      properties: {
        mechanisms: { type: 'array' },
        configuration: { type: 'object' },
        tradeoffs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'udp', 'reliability']
}));

export const rateLimitingTask = defineTask('rate-limiting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Rate Limiting - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'Network Security Engineer',
      task: 'Implement rate limiting and flood protection',
      context: args,
      instructions: [
        '1. Implement token bucket rate limiter',
        '2. Add per-source rate limiting',
        '3. Implement flood detection',
        '4. Add automatic source blocking',
        '5. Implement rate limit recovery',
        '6. Add rate limiting metrics',
        '7. Configure adjustable thresholds',
        '8. Document rate limiting behavior'
      ],
      outputFormat: 'JSON with rate limiting implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'algorithms', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        algorithms: { type: 'array' },
        metrics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'udp', 'rate-limiting']
}));

export const multicastTask = defineTask('multicast', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Multicast/Broadcast - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: {
    name: 'network-architect',
    prompt: {
      role: 'Multicast Systems Engineer',
      task: 'Implement multicast and broadcast support',
      context: args,
      instructions: [
        '1. Implement multicast group join/leave',
        '2. Configure multicast TTL',
        '3. Implement multicast loopback control',
        '4. Add broadcast support if needed',
        '5. Handle multicast source filtering',
        '6. Implement multicast forwarding',
        '7. Add multicast statistics',
        '8. Document multicast configuration'
      ],
      outputFormat: 'JSON with multicast implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'operations', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        operations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'udp', 'multicast']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Test Suite - ${args.projectName}`,
  skill: { name: 'network-simulation' },
  agent: {
    name: 'network-testing-expert',
    prompt: {
      role: 'Network Testing Engineer',
      task: 'Create UDP server test suite',
      context: args,
      instructions: [
        '1. Create unit tests for socket operations',
        '2. Test packet handling scenarios',
        '3. Test reliability mechanisms if enabled',
        '4. Test rate limiting behavior',
        '5. Test multicast functionality if enabled',
        '6. Create stress tests for packet floods',
        '7. Test error handling',
        '8. Document test procedures'
      ],
      outputFormat: 'JSON with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'passedTests', 'failedTests', 'artifacts'],
      properties: {
        totalTests: { type: 'number' },
        passedTests: { type: 'number' },
        failedTests: { type: 'number' },
        testCategories: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'udp', 'testing']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation - ${args.projectName}`,
  agent: {
    name: 'network-architect',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate UDP server documentation',
      context: args,
      instructions: [
        '1. Create README with overview',
        '2. Document API and usage',
        '3. Document configuration options',
        '4. Create packet format documentation',
        '5. Document reliability features',
        '6. Create troubleshooting guide',
        '7. Document performance considerations',
        '8. Create operational runbook'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        apiDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'udp', 'documentation']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Validation - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: {
    name: 'network-testing-expert',
    prompt: {
      role: 'QA Engineer',
      task: 'Validate UDP server implementation',
      context: args,
      instructions: [
        '1. Verify requirements compliance',
        '2. Validate performance targets',
        '3. Check code quality',
        '4. Verify test coverage',
        '5. Calculate validation score',
        '6. Generate validation report'
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
  labels: ['network', 'udp', 'validation']
}));
