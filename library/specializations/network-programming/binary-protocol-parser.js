/**
 * @process specializations/network-programming/binary-protocol-parser
 * @description Binary Protocol Parser Development - Design and implement a robust binary protocol parser with framing,
 * state machine parsing, validation, checksum verification, partial message handling, and error recovery.
 * @inputs { projectName: string, language: string, protocolSpec?: object, features?: object }
 * @outputs { success: boolean, parserConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/binary-protocol-parser', {
 *   projectName: 'IoT Sensor Protocol Parser',
 *   language: 'Rust',
 *   protocolSpec: {
 *     headerSize: 8,
 *     maxPayloadSize: 65535,
 *     checksumType: 'crc32',
 *     byteOrder: 'big-endian'
 *   },
 *   features: {
 *     streaming: true,
 *     zeroAlloc: true,
 *     fuzzTesting: true
 *   }
 * });
 *
 * @references
 * - Protocol Buffers: https://developers.google.com/protocol-buffers
 * - Binary Protocol Design: https://www.rfc-editor.org/rfc-index.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'C',
    protocolSpec = {
      headerSize: 8,
      maxPayloadSize: 65535,
      checksumType: 'crc32',
      byteOrder: 'big-endian'
    },
    features = {
      streaming: true,
      zeroAlloc: false,
      fuzzTesting: true
    },
    outputDir = 'binary-protocol-parser'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Binary Protocol Parser Development: ${projectName}`);
  ctx.log('info', `Language: ${language}, Checksum: ${protocolSpec.checksumType}`);

  // ============================================================================
  // PHASE 1: PROTOCOL SPECIFICATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing protocol specification');

  const specAnalysis = await ctx.task(specAnalysisTask, {
    projectName,
    language,
    protocolSpec,
    features,
    outputDir
  });

  artifacts.push(...specAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: Protocol specification analyzed. Message format: ${specAnalysis.messageFormat}. Proceed with parser design?`,
    title: 'Protocol Specification Review',
    context: {
      runId: ctx.runId,
      messageFormat: specAnalysis.messageFormat,
      headerFields: specAnalysis.headerFields,
      files: specAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: STATE MACHINE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing parser state machine');

  const stateMachineDesign = await ctx.task(stateMachineDesignTask, {
    projectName,
    language,
    specAnalysis,
    outputDir
  });

  artifacts.push(...stateMachineDesign.artifacts);

  // ============================================================================
  // PHASE 3: HEADER PARSING
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing header parsing');

  const headerParsing = await ctx.task(headerParsingTask, {
    projectName,
    language,
    protocolSpec,
    specAnalysis,
    outputDir
  });

  artifacts.push(...headerParsing.artifacts);

  // ============================================================================
  // PHASE 4: PAYLOAD DESERIALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing payload deserialization');

  const payloadDeserialization = await ctx.task(payloadDeserializationTask, {
    projectName,
    language,
    protocolSpec,
    specAnalysis,
    outputDir
  });

  artifacts.push(...payloadDeserialization.artifacts);

  // ============================================================================
  // PHASE 5: CHECKSUM/CRC VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing checksum verification');

  const checksumVerification = await ctx.task(checksumVerificationTask, {
    projectName,
    language,
    protocolSpec,
    outputDir
  });

  artifacts.push(...checksumVerification.artifacts);

  // ============================================================================
  // PHASE 6: PARTIAL MESSAGE HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing partial message handling');

  const partialMessageHandling = await ctx.task(partialMessageTask, {
    projectName,
    language,
    stateMachineDesign,
    features,
    outputDir
  });

  artifacts.push(...partialMessageHandling.artifacts);

  // ============================================================================
  // PHASE 7: ERROR DETECTION AND RECOVERY
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing error detection and recovery');

  const errorRecovery = await ctx.task(errorRecoveryTask, {
    projectName,
    language,
    stateMachineDesign,
    outputDir
  });

  artifacts.push(...errorRecovery.artifacts);

  // ============================================================================
  // PHASE 8: FUZZ TESTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating fuzz testing suite');

  const fuzzTesting = await ctx.task(fuzzTestingTask, {
    projectName,
    language,
    features,
    headerParsing,
    payloadDeserialization,
    outputDir
  });

  artifacts.push(...fuzzTesting.artifacts);

  await ctx.breakpoint({
    question: `Phase 8 Complete: Fuzz testing configured. ${fuzzTesting.testCasesGenerated} test cases generated. Proceed with validation?`,
    title: 'Fuzz Testing Review',
    context: {
      runId: ctx.runId,
      fuzzResults: fuzzTesting.results,
      coverageAchieved: fuzzTesting.coverage,
      files: fuzzTesting.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 9: DOCUMENTATION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating documentation and validation');

  const [documentation, validation] = await ctx.parallel.all([
    () => ctx.task(documentationTask, {
      projectName,
      specAnalysis,
      stateMachineDesign,
      headerParsing,
      payloadDeserialization,
      checksumVerification,
      partialMessageHandling,
      errorRecovery,
      outputDir
    }),
    () => ctx.task(validationTask, {
      projectName,
      fuzzTesting,
      outputDir
    })
  ]);

  artifacts.push(...documentation.artifacts);
  artifacts.push(...validation.artifacts);

  await ctx.breakpoint({
    question: `Binary Protocol Parser Complete for ${projectName}! Validation score: ${validation.overallScore}/100. Fuzz tests: ${fuzzTesting.testsPassed}/${fuzzTesting.totalTests} passed. Review deliverables?`,
    title: 'Binary Protocol Parser Complete - Final Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        language,
        protocolSpec,
        validationScore: validation.overallScore,
        fuzzCoverage: fuzzTesting.coverage
      },
      files: [
        { path: documentation.readmePath, format: 'markdown', label: 'README' },
        { path: documentation.protocolSpecPath, format: 'markdown', label: 'Protocol Spec' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validation.overallScore >= 80,
    projectName,
    parserConfig: {
      language,
      protocolSpec,
      features
    },
    implementation: {
      stateMachine: stateMachineDesign.states,
      headerParsing: headerParsing.fields,
      payloadDeserialization: payloadDeserialization.types,
      checksumVerification: checksumVerification.algorithm,
      partialMessageHandling: partialMessageHandling.strategy,
      errorRecovery: errorRecovery.mechanisms
    },
    testResults: {
      fuzzTestsRun: fuzzTesting.totalTests,
      fuzzTestsPassed: fuzzTesting.testsPassed,
      coverage: fuzzTesting.coverage
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/network-programming/binary-protocol-parser',
      timestamp: startTime,
      language
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const specAnalysisTask = defineTask('spec-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Specification Analysis - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Protocol Specification Analyst',
      task: 'Analyze binary protocol specification',
      context: args,
      instructions: [
        '1. Analyze message structure and framing',
        '2. Document header fields and their types',
        '3. Define payload formats and variations',
        '4. Document byte ordering (endianness)',
        '5. Analyze checksum/CRC requirements',
        '6. Identify message types and their formats',
        '7. Document alignment requirements',
        '8. Generate formal protocol specification'
      ],
      outputFormat: 'JSON with protocol analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['messageFormat', 'headerFields', 'payloadTypes', 'artifacts'],
      properties: {
        messageFormat: { type: 'string' },
        headerFields: { type: 'array' },
        payloadTypes: { type: 'array' },
        byteOrder: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'parser', 'analysis']
}));

export const stateMachineDesignTask = defineTask('state-machine-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: State Machine Design - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Parser State Machine Designer',
      task: 'Design parser state machine',
      context: args,
      instructions: [
        '1. Define parser states (initial, reading header, reading payload, etc.)',
        '2. Design state transitions',
        '3. Define actions for each state',
        '4. Handle incomplete data scenarios',
        '5. Design error states',
        '6. Add reset/recovery transitions',
        '7. Create state machine diagram',
        '8. Document state transitions'
      ],
      outputFormat: 'JSON with state machine design'
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
  labels: ['network', 'protocol', 'parser', 'state-machine']
}));

export const headerParsingTask = defineTask('header-parsing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Header Parsing - ${args.projectName}`,
  skill: { name: 'serialization' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Binary Parser Engineer',
      task: 'Implement header parsing and validation',
      context: args,
      instructions: [
        '1. Implement header field extraction',
        '2. Handle byte ordering correctly',
        '3. Validate magic bytes/sync patterns',
        '4. Extract message type and length',
        '5. Validate header field ranges',
        '6. Handle header version differences',
        '7. Implement header validation',
        '8. Add header parsing metrics'
      ],
      outputFormat: 'JSON with header parsing implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['fields', 'validation', 'artifacts'],
      properties: {
        fields: { type: 'array' },
        validation: { type: 'object' },
        parsingCode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'parser', 'header']
}));

export const payloadDeserializationTask = defineTask('payload-deserialization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Payload Deserialization - ${args.projectName}`,
  skill: { name: 'serialization' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Data Deserialization Engineer',
      task: 'Implement payload deserialization',
      context: args,
      instructions: [
        '1. Implement type-specific deserializers',
        '2. Handle variable-length fields',
        '3. Implement nested structure parsing',
        '4. Handle arrays and collections',
        '5. Implement string handling (length-prefixed, null-terminated)',
        '6. Add type validation',
        '7. Implement zero-copy parsing if required',
        '8. Add deserialization metrics'
      ],
      outputFormat: 'JSON with deserialization implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['types', 'deserializers', 'artifacts'],
      properties: {
        types: { type: 'array' },
        deserializers: { type: 'array' },
        zeroCopy: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'parser', 'deserialization']
}));

export const checksumVerificationTask = defineTask('checksum-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Checksum Verification - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Data Integrity Engineer',
      task: 'Implement checksum/CRC verification',
      context: args,
      instructions: [
        '1. Implement checksum algorithm (CRC32, CRC16, etc.)',
        '2. Define checksum scope (header, payload, both)',
        '3. Implement streaming checksum calculation',
        '4. Add checksum validation',
        '5. Handle checksum mismatch errors',
        '6. Optimize for performance',
        '7. Support hardware acceleration if available',
        '8. Add checksum metrics'
      ],
      outputFormat: 'JSON with checksum implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithm', 'implementation', 'artifacts'],
      properties: {
        algorithm: { type: 'string' },
        implementation: { type: 'object' },
        performance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'parser', 'checksum']
}));

export const partialMessageTask = defineTask('partial-message', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Partial Message Handling - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Streaming Parser Engineer',
      task: 'Implement partial message handling',
      context: args,
      instructions: [
        '1. Implement buffer management for partial data',
        '2. Handle split headers across packets',
        '3. Handle split payloads across packets',
        '4. Implement efficient buffering strategy',
        '5. Add buffer overflow protection',
        '6. Implement message reassembly',
        '7. Handle out-of-order data if applicable',
        '8. Add partial message metrics'
      ],
      outputFormat: 'JSON with partial message handling'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'bufferManagement', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        bufferManagement: { type: 'object' },
        maxBufferSize: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'parser', 'streaming']
}));

export const errorRecoveryTask = defineTask('error-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Error Recovery - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Error Recovery Engineer',
      task: 'Implement error detection and recovery',
      context: args,
      instructions: [
        '1. Implement sync pattern detection for resync',
        '2. Handle malformed messages',
        '3. Implement frame boundary detection',
        '4. Add error classification',
        '5. Implement recovery strategies',
        '6. Add error logging with context',
        '7. Implement graceful degradation',
        '8. Document error handling procedures'
      ],
      outputFormat: 'JSON with error recovery implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanisms', 'errorTypes', 'artifacts'],
      properties: {
        mechanisms: { type: 'array' },
        errorTypes: { type: 'array' },
        recoveryStrategies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'parser', 'error-recovery']
}));

export const fuzzTestingTask = defineTask('fuzz-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Fuzz Testing - ${args.projectName}`,
  skill: { name: 'protocol-fuzzer' },
  agent: {
    name: 'security-testing-expert',
    prompt: {
      role: 'Security Testing Engineer',
      task: 'Create fuzz testing suite',
      context: args,
      instructions: [
        '1. Set up fuzzing infrastructure (AFL, libFuzzer, etc.)',
        '2. Create seed corpus from valid messages',
        '3. Implement mutation strategies',
        '4. Add boundary value testing',
        '5. Test oversized messages',
        '6. Test malformed headers',
        '7. Test invalid checksums',
        '8. Generate fuzz testing report'
      ],
      outputFormat: 'JSON with fuzz testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'testsPassed', 'coverage', 'artifacts'],
      properties: {
        totalTests: { type: 'number' },
        testsPassed: { type: 'number' },
        testCasesGenerated: { type: 'number' },
        coverage: { type: 'string' },
        results: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'parser', 'fuzz-testing']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Documentation - ${args.projectName}`,
  agent: {
    name: 'network-architect',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate parser documentation',
      context: args,
      instructions: [
        '1. Create README with overview',
        '2. Document protocol specification',
        '3. Document parser API',
        '4. Create usage examples',
        '5. Document error handling',
        '6. Create integration guide',
        '7. Document performance characteristics',
        '8. Create troubleshooting guide'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'protocolSpecPath', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        protocolSpecPath: { type: 'string' },
        apiDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'parser', 'documentation']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Validation - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: {
    name: 'network-testing-expert',
    prompt: {
      role: 'QA Engineer',
      task: 'Validate parser implementation',
      context: args,
      instructions: [
        '1. Verify all message types handled',
        '2. Validate error handling coverage',
        '3. Check fuzz testing results',
        '4. Verify documentation completeness',
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
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'parser', 'validation']
}));
