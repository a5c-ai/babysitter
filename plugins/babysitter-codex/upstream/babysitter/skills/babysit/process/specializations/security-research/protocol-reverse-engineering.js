/**
 * @process specializations/security-research/protocol-reverse-engineering
 * @description Analysis of network protocols and communication formats to understand message structures,
 * state machines, and identify security vulnerabilities in protocol implementations using Wireshark,
 * Scapy, and protocol fuzzing tools.
 * @inputs { projectName: string, targetProtocol: string, captureFile?: string }
 * @outputs { success: boolean, protocolSpec: object, vulnerabilities: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/protocol-reverse-engineering', {
 *   projectName: 'Custom Protocol Analysis',
 *   targetProtocol: 'proprietary-iot-protocol',
 *   captureFile: '/path/to/capture.pcap'
 * });
 *
 * @references
 * - Wireshark: https://www.wireshark.org/
 * - Scapy: https://scapy.net/
 * - Boofuzz: https://github.com/jtpereyda/boofuzz
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetProtocol,
    captureFile = null,
    analysisTools = ['wireshark', 'scapy'],
    outputDir = 'protocol-re-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const vulnerabilities = [];

  ctx.log('info', `Starting Protocol Reverse Engineering for ${projectName}`);
  ctx.log('info', `Protocol: ${targetProtocol}`);

  // ============================================================================
  // PHASE 1: TRAFFIC CAPTURE
  // ============================================================================

  ctx.log('info', 'Phase 1: Capturing network traffic samples');

  const trafficCapture = await ctx.task(trafficCaptureTask, {
    projectName,
    targetProtocol,
    captureFile,
    outputDir
  });

  artifacts.push(...trafficCapture.artifacts);

  // ============================================================================
  // PHASE 2: MESSAGE FORMAT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing message formats and fields');

  const messageAnalysis = await ctx.task(messageAnalysisTask, {
    projectName,
    trafficCapture,
    outputDir
  });

  artifacts.push(...messageAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: STATE MACHINE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying state machines and sequences');

  const stateMachine = await ctx.task(stateMachineTask, {
    projectName,
    messageAnalysis,
    outputDir
  });

  artifacts.push(...stateMachine.artifacts);

  // ============================================================================
  // PHASE 4: PROTOCOL DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Documenting protocol specifications');

  const protocolDoc = await ctx.task(protocolDocumentationTask, {
    projectName,
    messageAnalysis,
    stateMachine,
    outputDir
  });

  artifacts.push(...protocolDoc.artifacts);

  // ============================================================================
  // PHASE 5: DISSECTOR CREATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating protocol dissectors');

  const dissectorCreation = await ctx.task(dissectorCreationTask, {
    projectName,
    messageAnalysis,
    protocolDoc,
    outputDir
  });

  artifacts.push(...dissectorCreation.artifacts);

  // ============================================================================
  // PHASE 6: VULNERABILITY TESTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Testing for protocol vulnerabilities');

  const vulnTesting = await ctx.task(protocolVulnTestingTask, {
    projectName,
    messageAnalysis,
    stateMachine,
    outputDir
  });

  vulnerabilities.push(...vulnTesting.vulnerabilities);
  artifacts.push(...vulnTesting.artifacts);

  await ctx.breakpoint({
    question: `Protocol RE complete for ${projectName}. ${messageAnalysis.messageTypes.length} message types identified, ${vulnerabilities.length} vulnerabilities found. Review specification?`,
    title: 'Protocol RE Complete',
    context: {
      runId: ctx.runId,
      summary: {
        messageTypes: messageAnalysis.messageTypes.length,
        states: stateMachine.states.length,
        vulnerabilities: vulnerabilities.length
      },
      files: protocolDoc.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    protocolSpec: {
      messageTypes: messageAnalysis.messageTypes,
      stateMachine: stateMachine.states,
      specPath: protocolDoc.specPath
    },
    vulnerabilities,
    dissector: dissectorCreation.dissectorPath,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/protocol-reverse-engineering',
      timestamp: startTime,
      targetProtocol,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const trafficCaptureTask = defineTask('traffic-capture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Capture Traffic - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'Network Traffic Analyst',
      task: 'Capture network traffic samples',
      context: args,
      instructions: [
        '1. Set up traffic capture environment',
        '2. Capture protocol traffic',
        '3. Filter relevant packets',
        '4. Capture multiple sessions',
        '5. Document capture conditions',
        '6. Export to PCAP format',
        '7. Verify capture quality',
        '8. Store capture files'
      ],
      outputFormat: 'JSON with capture details'
    },
    outputSchema: {
      type: 'object',
      required: ['capturePath', 'packetCount', 'artifacts'],
      properties: {
        capturePath: { type: 'string' },
        packetCount: { type: 'number' },
        sessions: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'protocol-re', 'capture']
}));

export const messageAnalysisTask = defineTask('message-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Messages - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'Protocol Message Analyst',
      task: 'Analyze message formats and fields',
      context: args,
      instructions: [
        '1. Identify message boundaries',
        '2. Analyze header structures',
        '3. Identify field types',
        '4. Determine field lengths',
        '5. Identify variable fields',
        '6. Map data types',
        '7. Identify checksums/hashes',
        '8. Document message format'
      ],
      outputFormat: 'JSON with message analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['messageTypes', 'fields', 'artifacts'],
      properties: {
        messageTypes: { type: 'array' },
        fields: { type: 'array' },
        headerFormat: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'protocol-re', 'messages']
}));

export const stateMachineTask = defineTask('state-machine', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify State Machine - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'Protocol State Machine Analyst',
      task: 'Identify state machines and sequences',
      context: args,
      instructions: [
        '1. Identify protocol states',
        '2. Map state transitions',
        '3. Identify required sequences',
        '4. Find authentication states',
        '5. Identify error states',
        '6. Map message flow',
        '7. Create state diagram',
        '8. Document state machine'
      ],
      outputFormat: 'JSON with state machine'
    },
    outputSchema: {
      type: 'object',
      required: ['states', 'transitions', 'artifacts'],
      properties: {
        states: { type: 'array' },
        transitions: { type: 'array' },
        initialState: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'protocol-re', 'state-machine']
}));

export const protocolDocumentationTask = defineTask('protocol-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Protocol - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Protocol Documentation Specialist',
      task: 'Document protocol specifications',
      context: args,
      instructions: [
        '1. Create protocol overview',
        '2. Document message formats',
        '3. Document field definitions',
        '4. Create state diagrams',
        '5. Document sequences',
        '6. Include examples',
        '7. Create reference tables',
        '8. Format as specification'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['specPath', 'artifacts'],
      properties: {
        specPath: { type: 'string' },
        overview: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'protocol-re', 'documentation']
}));

export const dissectorCreationTask = defineTask('dissector-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Dissector - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'Protocol Dissector Developer',
      task: 'Create protocol dissectors',
      context: args,
      instructions: [
        '1. Design dissector structure',
        '2. Implement Wireshark dissector',
        '3. Parse message headers',
        '4. Parse message fields',
        '5. Handle variable fields',
        '6. Add protocol tree display',
        '7. Test dissector',
        '8. Document usage'
      ],
      outputFormat: 'JSON with dissector details'
    },
    outputSchema: {
      type: 'object',
      required: ['dissectorPath', 'artifacts'],
      properties: {
        dissectorPath: { type: 'string' },
        dissectorType: { type: 'string' },
        tested: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'protocol-re', 'dissector']
}));

export const protocolVulnTestingTask = defineTask('protocol-vuln-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Protocol Vulnerabilities - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'Protocol Security Tester',
      task: 'Test for protocol vulnerabilities',
      context: args,
      instructions: [
        '1. Test for state confusion',
        '2. Test for replay attacks',
        '3. Test for injection',
        '4. Test authentication bypass',
        '5. Test for DoS conditions',
        '6. Test for information leak',
        '7. Fuzz protocol fields',
        '8. Document vulnerabilities'
      ],
      outputFormat: 'JSON with vulnerabilities'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'testCases', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        testCases: { type: 'array' },
        passedTests: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'protocol-re', 'vuln-testing']
}));
