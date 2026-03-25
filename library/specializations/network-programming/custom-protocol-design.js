/**
 * @process specializations/network-programming/custom-protocol-design
 * @description Custom Protocol Design and Implementation - Design and implement a complete custom network protocol
 * for specific application requirements, including message format, framing, multiplexing, handshake, flow control,
 * and comprehensive documentation.
 * @inputs { projectName: string, language: string, requirements: object, transportLayer?: string }
 * @outputs { success: boolean, protocolSpec: object, implementation: object, documentation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/custom-protocol-design', {
 *   projectName: 'Real-Time Gaming Protocol',
 *   language: 'C++',
 *   requirements: {
 *     latency: '<5ms',
 *     reliability: 'selective',
 *     multiplexing: true,
 *     encryption: true
 *   },
 *   transportLayer: 'UDP'
 * });
 *
 * @references
 * - RFC Index: https://www.rfc-editor.org/rfc-index.html
 * - Protocol Design Patterns: https://www.oreilly.com/library/view/network-protocols/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'C++',
    requirements = {},
    transportLayer = 'TCP',
    outputDir = 'custom-protocol-design'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Custom Protocol Design: ${projectName}`);
  ctx.log('info', `Transport: ${transportLayer}, Language: ${language}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS GATHERING
  // ============================================================================

  ctx.log('info', 'Phase 1: Gathering and analyzing protocol requirements');

  const requirementsGathering = await ctx.task(requirementsGatheringTask, {
    projectName,
    requirements,
    transportLayer,
    outputDir
  });

  artifacts.push(...requirementsGathering.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: Protocol requirements defined. Transport: ${transportLayer}, Features: ${requirementsGathering.features.join(', ')}. Proceed with message format design?`,
    title: 'Requirements Review',
    context: {
      runId: ctx.runId,
      requirements: requirementsGathering.formalRequirements,
      features: requirementsGathering.features,
      files: requirementsGathering.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: MESSAGE FORMAT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing message format and semantics');

  const messageFormatDesign = await ctx.task(messageFormatTask, {
    projectName,
    requirements: requirementsGathering.formalRequirements,
    transportLayer,
    outputDir
  });

  artifacts.push(...messageFormatDesign.artifacts);

  // ============================================================================
  // PHASE 3: FRAMING AND MULTIPLEXING
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing framing and multiplexing strategy');

  const framingDesign = await ctx.task(framingDesignTask, {
    projectName,
    messageFormatDesign,
    requirements: requirementsGathering.formalRequirements,
    transportLayer,
    outputDir
  });

  artifacts.push(...framingDesign.artifacts);

  // ============================================================================
  // PHASE 4: HANDSHAKE AND CONNECTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing handshake and connection establishment');

  const handshakeDesign = await ctx.task(handshakeDesignTask, {
    projectName,
    requirements: requirementsGathering.formalRequirements,
    transportLayer,
    outputDir
  });

  artifacts.push(...handshakeDesign.artifacts);

  // ============================================================================
  // PHASE 5: FLOW CONTROL AND BACKPRESSURE
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing flow control and backpressure');

  const flowControl = await ctx.task(flowControlTask, {
    projectName,
    requirements: requirementsGathering.formalRequirements,
    framingDesign,
    outputDir
  });

  artifacts.push(...flowControl.artifacts);

  // ============================================================================
  // PHASE 6: ERROR HANDLING AND RECOVERY
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing error handling and recovery');

  const errorHandling = await ctx.task(errorHandlingTask, {
    projectName,
    messageFormatDesign,
    handshakeDesign,
    outputDir
  });

  artifacts.push(...errorHandling.artifacts);

  await ctx.breakpoint({
    question: `Phase 6 Complete: Protocol design complete. Message types: ${messageFormatDesign.messageTypes.length}, Error handling strategies: ${errorHandling.strategies.length}. Proceed with implementation?`,
    title: 'Protocol Design Review',
    context: {
      runId: ctx.runId,
      messageTypes: messageFormatDesign.messageTypes,
      framingStrategy: framingDesign.strategy,
      handshake: handshakeDesign.steps,
      files: messageFormatDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 7: SERIALIZATION IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing message serialization/deserialization');

  const serialization = await ctx.task(serializationTask, {
    projectName,
    language,
    messageFormatDesign,
    outputDir
  });

  artifacts.push(...serialization.artifacts);

  // ============================================================================
  // PHASE 8: PROTOCOL SPECIFICATION DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating protocol specification document');

  const protocolSpec = await ctx.task(protocolSpecTask, {
    projectName,
    requirementsGathering,
    messageFormatDesign,
    framingDesign,
    handshakeDesign,
    flowControl,
    errorHandling,
    outputDir
  });

  artifacts.push(...protocolSpec.artifacts);

  // ============================================================================
  // PHASE 9: TEST SUITE
  // ============================================================================

  ctx.log('info', 'Phase 9: Building comprehensive test suite');

  const testSuite = await ctx.task(testSuiteTask, {
    projectName,
    language,
    messageFormatDesign,
    framingDesign,
    handshakeDesign,
    serialization,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 10: VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Validating protocol design and implementation');

  const validation = await ctx.task(validationTask, {
    projectName,
    requirements: requirementsGathering.formalRequirements,
    protocolSpec,
    testSuite,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  await ctx.breakpoint({
    question: `Custom Protocol Design Complete for ${projectName}! Validation score: ${validation.overallScore}/100. Tests: ${testSuite.passedTests}/${testSuite.totalTests} passed. Review deliverables?`,
    title: 'Custom Protocol Design Complete - Final Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        transportLayer,
        messageTypes: messageFormatDesign.messageTypes.length,
        validationScore: validation.overallScore
      },
      files: [
        { path: protocolSpec.specDocumentPath, format: 'markdown', label: 'Protocol Specification' },
        { path: protocolSpec.diagramPath, format: 'png', label: 'Protocol Diagram' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validation.overallScore >= 80,
    projectName,
    protocolSpec: {
      name: projectName,
      version: '1.0.0',
      transportLayer,
      messageFormat: messageFormatDesign.format,
      messageTypes: messageFormatDesign.messageTypes,
      framing: framingDesign.strategy,
      handshake: handshakeDesign.steps,
      flowControl: flowControl.mechanism
    },
    implementation: {
      language,
      serialization: serialization.implementation,
      errorHandling: errorHandling.strategies
    },
    documentation: {
      specDocument: protocolSpec.specDocumentPath,
      diagram: protocolSpec.diagramPath
    },
    testResults: {
      totalTests: testSuite.totalTests,
      passedTests: testSuite.passedTests
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/network-programming/custom-protocol-design',
      timestamp: startTime,
      transportLayer
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const requirementsGatheringTask = defineTask('requirements-gathering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements Gathering - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'network-architect',
    prompt: {
      role: 'Protocol Architect',
      task: 'Gather and formalize protocol requirements',
      context: args,
      instructions: [
        '1. Analyze latency and throughput requirements',
        '2. Determine reliability requirements (guaranteed, best-effort)',
        '3. Identify security requirements (encryption, authentication)',
        '4. Define message ordering requirements',
        '5. Determine flow control needs',
        '6. Identify extensibility requirements',
        '7. Define backward compatibility needs',
        '8. Document all requirements formally'
      ],
      outputFormat: 'JSON with formal requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['formalRequirements', 'features', 'artifacts'],
      properties: {
        formalRequirements: { type: 'object' },
        features: { type: 'array' },
        constraints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'design', 'requirements']
}));

export const messageFormatTask = defineTask('message-format', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Message Format Design - ${args.projectName}`,
  skill: { name: 'serialization' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Protocol Message Designer',
      task: 'Design message format and semantics',
      context: args,
      instructions: [
        '1. Design message header structure',
        '2. Define message types and codes',
        '3. Design payload formats',
        '4. Choose encoding (binary, text)',
        '5. Define field types and sizes',
        '6. Plan for extensibility (reserved fields, TLV)',
        '7. Define message semantics',
        '8. Document message formats'
      ],
      outputFormat: 'JSON with message format design'
    },
    outputSchema: {
      type: 'object',
      required: ['format', 'messageTypes', 'headerStructure', 'artifacts'],
      properties: {
        format: { type: 'string' },
        messageTypes: { type: 'array' },
        headerStructure: { type: 'object' },
        payloadFormats: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'design', 'message-format']
}));

export const framingDesignTask = defineTask('framing-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Framing Design - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Protocol Framing Engineer',
      task: 'Design framing and multiplexing strategy',
      context: args,
      instructions: [
        '1. Choose framing strategy (length-prefix, delimiter, fixed)',
        '2. Design frame structure',
        '3. Implement stream multiplexing if needed',
        '4. Define stream/channel identifiers',
        '5. Design priority handling',
        '6. Plan frame coalescing',
        '7. Handle frame fragmentation',
        '8. Document framing specification'
      ],
      outputFormat: 'JSON with framing design'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'frameStructure', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
        frameStructure: { type: 'object' },
        multiplexing: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'design', 'framing']
}));

export const handshakeDesignTask = defineTask('handshake-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Handshake Design - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Protocol Handshake Designer',
      task: 'Design handshake and connection establishment',
      context: args,
      instructions: [
        '1. Design connection initiation',
        '2. Define capability negotiation',
        '3. Implement version negotiation',
        '4. Design authentication exchange if needed',
        '5. Define connection parameters',
        '6. Handle connection rejection',
        '7. Design keepalive mechanism',
        '8. Document handshake sequence'
      ],
      outputFormat: 'JSON with handshake design'
    },
    outputSchema: {
      type: 'object',
      required: ['steps', 'messages', 'artifacts'],
      properties: {
        steps: { type: 'array' },
        messages: { type: 'array' },
        capabilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'design', 'handshake']
}));

export const flowControlTask = defineTask('flow-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Flow Control - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Flow Control Engineer',
      task: 'Implement flow control and backpressure',
      context: args,
      instructions: [
        '1. Design flow control mechanism (window-based, credit-based)',
        '2. Implement backpressure signaling',
        '3. Define buffer management',
        '4. Handle slow consumers',
        '5. Implement rate limiting if needed',
        '6. Design congestion handling',
        '7. Add flow control metrics',
        '8. Document flow control behavior'
      ],
      outputFormat: 'JSON with flow control implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanism', 'parameters', 'artifacts'],
      properties: {
        mechanism: { type: 'string' },
        parameters: { type: 'object' },
        backpressure: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'design', 'flow-control']
}));

export const errorHandlingTask = defineTask('error-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Error Handling - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Error Handling Engineer',
      task: 'Implement error handling and recovery',
      context: args,
      instructions: [
        '1. Define error codes and categories',
        '2. Design error message format',
        '3. Implement error recovery strategies',
        '4. Handle connection errors',
        '5. Handle protocol violations',
        '6. Implement timeout handling',
        '7. Design graceful degradation',
        '8. Document error handling procedures'
      ],
      outputFormat: 'JSON with error handling implementation'
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
  labels: ['network', 'protocol', 'design', 'error-handling']
}));

export const serializationTask = defineTask('serialization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Serialization - ${args.projectName}`,
  skill: { name: 'serialization' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Serialization Engineer',
      task: 'Implement message serialization/deserialization',
      context: args,
      instructions: [
        '1. Implement message serializer',
        '2. Implement message deserializer',
        '3. Handle endianness correctly',
        '4. Implement type-safe accessors',
        '5. Add validation during deserialization',
        '6. Optimize for performance',
        '7. Add serialization tests',
        '8. Document serialization format'
      ],
      outputFormat: 'JSON with serialization implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'supportedTypes', 'artifacts'],
      properties: {
        implementation: { type: 'object' },
        supportedTypes: { type: 'array' },
        performance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'implementation', 'serialization']
}));

export const protocolSpecTask = defineTask('protocol-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Protocol Specification - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Protocol Specification Writer',
      task: 'Create protocol specification document',
      context: args,
      instructions: [
        '1. Write protocol overview',
        '2. Document message formats in detail',
        '3. Describe handshake sequence',
        '4. Document state machines',
        '5. Describe error handling',
        '6. Create protocol diagrams',
        '7. Document security considerations',
        '8. Add implementation notes'
      ],
      outputFormat: 'JSON with specification document paths'
    },
    outputSchema: {
      type: 'object',
      required: ['specDocumentPath', 'diagramPath', 'artifacts'],
      properties: {
        specDocumentPath: { type: 'string' },
        diagramPath: { type: 'string' },
        sections: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'documentation', 'specification']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Test Suite - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Protocol Test Engineer',
      task: 'Build comprehensive test suite',
      context: args,
      instructions: [
        '1. Create unit tests for serialization',
        '2. Test handshake scenarios',
        '3. Test message exchange patterns',
        '4. Test error scenarios',
        '5. Test flow control behavior',
        '6. Create interoperability tests',
        '7. Add fuzz testing',
        '8. Document test coverage'
      ],
      outputFormat: 'JSON with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'passedTests', 'artifacts'],
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
  labels: ['network', 'protocol', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Validation - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Protocol Validation Engineer',
      task: 'Validate protocol design and implementation',
      context: args,
      instructions: [
        '1. Verify requirements are met',
        '2. Validate specification completeness',
        '3. Check implementation correctness',
        '4. Verify test coverage',
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
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'validation']
}));
