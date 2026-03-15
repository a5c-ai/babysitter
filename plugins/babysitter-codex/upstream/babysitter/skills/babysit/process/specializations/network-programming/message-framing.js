/**
 * @process specializations/network-programming/message-framing
 * @description Message Framing Implementation - Implement message framing strategies for stream-based protocols
 * including length-prefix, delimiter-based, and fixed-length framing with buffer management and error recovery.
 * @inputs { projectName: string, language: string, framingStrategy: string, maxMessageSize?: number }
 * @outputs { success: boolean, framingConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/message-framing', {
 *   projectName: 'Protocol Message Framing',
 *   language: 'Rust',
 *   framingStrategy: 'length-prefix',
 *   maxMessageSize: 1048576
 * });
 *
 * @references
 * - Protocol Design Best Practices
 * - HTTP/2 Framing: https://www.rfc-editor.org/rfc/rfc7540
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'C',
    framingStrategy = 'length-prefix',
    maxMessageSize = 1048576,
    outputDir = 'message-framing'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Message Framing Implementation: ${projectName}`);
  ctx.log('info', `Strategy: ${framingStrategy}, Max Size: ${maxMessageSize}`);

  // Phase 1: Strategy Selection and Design
  const strategyDesign = await ctx.task(strategyDesignTask, { projectName, framingStrategy, maxMessageSize, outputDir });
  artifacts.push(...strategyDesign.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: ${framingStrategy} framing strategy designed. Proceed with encoder implementation?`,
    title: 'Framing Strategy Review',
    context: { runId: ctx.runId, strategy: strategyDesign.strategy }
  });

  // Phase 2: Frame Encoder Implementation
  const frameEncoder = await ctx.task(frameEncoderTask, { projectName, language, strategyDesign, outputDir });
  artifacts.push(...frameEncoder.artifacts);

  // Phase 3: Frame Decoder Implementation
  const frameDecoder = await ctx.task(frameDecoderTask, { projectName, language, strategyDesign, outputDir });
  artifacts.push(...frameDecoder.artifacts);

  // Phase 4: Buffer Management
  const bufferManagement = await ctx.task(bufferManagementTask, { projectName, language, maxMessageSize, outputDir });
  artifacts.push(...bufferManagement.artifacts);

  // Phase 5: Frame Validation
  const frameValidation = await ctx.task(frameValidationTask, { projectName, language, strategyDesign, maxMessageSize, outputDir });
  artifacts.push(...frameValidation.artifacts);

  // Phase 6: Oversized Message Handling
  const oversizedHandling = await ctx.task(oversizedHandlingTask, { projectName, language, maxMessageSize, outputDir });
  artifacts.push(...oversizedHandling.artifacts);

  // Phase 7: Error Recovery
  const errorRecovery = await ctx.task(errorRecoveryTask, { projectName, language, framingStrategy, outputDir });
  artifacts.push(...errorRecovery.artifacts);

  // Phase 8: Performance Optimization
  const performanceOptimization = await ctx.task(performanceTask, { projectName, language, strategyDesign, outputDir });
  artifacts.push(...performanceOptimization.artifacts);

  // Phase 9: Testing and Validation
  const [testSuite, validation] = await ctx.parallel.all([
    () => ctx.task(testSuiteTask, { projectName, language, frameEncoder, frameDecoder, outputDir }),
    () => ctx.task(validationTask, { projectName, framingStrategy, outputDir })
  ]);
  artifacts.push(...testSuite.artifacts, ...validation.artifacts);

  await ctx.breakpoint({
    question: `Message Framing Complete for ${projectName}! Validation: ${validation.overallScore}/100. Review?`,
    title: 'Message Framing Complete',
    context: { runId: ctx.runId, validationScore: validation.overallScore }
  });

  return {
    success: validation.overallScore >= 80,
    projectName,
    framingConfig: { strategy: framingStrategy, maxMessageSize },
    implementation: {
      encoder: frameEncoder.implementation,
      decoder: frameDecoder.implementation,
      bufferManagement: bufferManagement.strategy,
      errorRecovery: errorRecovery.mechanisms
    },
    testResults: { totalTests: testSuite.totalTests, passedTests: testSuite.passedTests },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/message-framing', timestamp: startTime }
  };
}

export const strategyDesignTask = defineTask('strategy-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Strategy Design - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Protocol Framing Architect',
      task: 'Design framing strategy',
      context: args,
      instructions: [
        '1. Analyze framing strategy requirements',
        '2. Design frame header structure',
        '3. Define length field encoding (fixed, varint)',
        '4. Plan delimiter handling if applicable',
        '5. Define escape sequences if needed',
        '6. Document frame format specification'
      ],
      outputFormat: 'JSON with strategy design'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'frameFormat', 'artifacts'],
      properties: { strategy: { type: 'object' }, frameFormat: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'framing', 'design']
}));

export const frameEncoderTask = defineTask('frame-encoder', (args, taskCtx) => ({
  kind: 'agent',
  title: `Frame Encoder - ${args.projectName}`,
  skill: { name: 'serialization' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Frame Encoder Engineer',
      task: 'Implement frame encoder',
      context: args,
      instructions: ['1. Implement frame header writing', '2. Add payload encoding', '3. Handle byte ordering', '4. Optimize for performance']
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'artifacts'],
      properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'framing', 'encoder']
}));

export const frameDecoderTask = defineTask('frame-decoder', (args, taskCtx) => ({
  kind: 'agent',
  title: `Frame Decoder - ${args.projectName}`,
  skill: { name: 'serialization' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Frame Decoder Engineer',
      task: 'Implement frame decoder with partial handling',
      context: args,
      instructions: ['1. Implement header parsing', '2. Handle partial frames', '3. Extract payload', '4. Handle streaming input']
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'artifacts'],
      properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'framing', 'decoder']
}));

export const bufferManagementTask = defineTask('buffer-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Buffer Management - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Buffer Management Engineer',
      task: 'Implement buffer management optimization',
      context: args,
      instructions: ['1. Design buffer allocation strategy', '2. Implement buffer pooling', '3. Optimize memory usage', '4. Handle buffer overflow']
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'artifacts'],
      properties: { strategy: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'framing', 'buffer']
}));

export const frameValidationTask = defineTask('frame-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Frame Validation - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Frame Validation Engineer',
      task: 'Implement frame validation',
      context: args,
      instructions: ['1. Validate frame headers', '2. Check size limits', '3. Validate checksums if present', '4. Report validation errors']
    },
    outputSchema: {
      type: 'object',
      required: ['validationRules', 'artifacts'],
      properties: { validationRules: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'framing', 'validation']
}));

export const oversizedHandlingTask = defineTask('oversized-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Oversized Handling - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Message Size Engineer',
      task: 'Handle oversized messages',
      context: args,
      instructions: ['1. Detect oversized messages early', '2. Implement rejection handling', '3. Add size limit configuration', '4. Log oversized attempts']
    },
    outputSchema: {
      type: 'object',
      required: ['handling', 'artifacts'],
      properties: { handling: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'framing', 'size-handling']
}));

export const errorRecoveryTask = defineTask('error-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Error Recovery - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Error Recovery Engineer',
      task: 'Implement error recovery for malformed frames',
      context: args,
      instructions: ['1. Detect malformed frames', '2. Implement resynchronization', '3. Handle partial corruption', '4. Add recovery metrics']
    },
    outputSchema: {
      type: 'object',
      required: ['mechanisms', 'artifacts'],
      properties: { mechanisms: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'framing', 'error-recovery']
}));

export const performanceTask = defineTask('performance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Optimization - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Performance Engineer',
      task: 'Optimize framing performance',
      context: args,
      instructions: ['1. Profile encoding/decoding', '2. Optimize hot paths', '3. Reduce allocations', '4. Benchmark and document']
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'benchmarks', 'artifacts'],
      properties: { optimizations: { type: 'array' }, benchmarks: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'framing', 'performance']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Suite - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Test Engineer',
      task: 'Create framing test suite',
      context: args,
      instructions: ['1. Test encode/decode roundtrip', '2. Test partial frames', '3. Test error cases', '4. Test performance']
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'passedTests', 'artifacts'],
      properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, failedTests: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'framing', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validation - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'QA Engineer',
      task: 'Validate framing implementation',
      context: args,
      instructions: ['1. Verify all features implemented', '2. Check test coverage', '3. Calculate validation score']
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'passedChecks', 'artifacts'],
      properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'framing', 'validation']
}));
