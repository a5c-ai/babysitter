/**
 * @process specializations/network-programming/protocol-state-machine
 * @description Protocol State Machine Implementation - Build a formal state machine for protocol connection lifecycle
 * management with state handlers, transitions, timeout management, error states, and visualization.
 * @inputs { projectName: string, language: string, protocolName: string, states?: array, transitions?: array }
 * @outputs { success: boolean, stateMachineConfig: object, implementation: object, visualization: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/protocol-state-machine', {
 *   projectName: 'TLS Handshake State Machine',
 *   language: 'Go',
 *   protocolName: 'TLS 1.3',
 *   states: ['INITIAL', 'CLIENT_HELLO', 'SERVER_HELLO', 'ENCRYPTED', 'ESTABLISHED', 'CLOSING', 'CLOSED'],
 *   transitions: [
 *     { from: 'INITIAL', to: 'CLIENT_HELLO', event: 'CONNECT' }
 *   ]
 * });
 *
 * @references
 * - State Machine Design Patterns
 * - TCP State Machine: https://www.rfc-editor.org/rfc/rfc793
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'Go',
    protocolName,
    states = [],
    transitions = [],
    timeouts = {},
    outputDir = 'protocol-state-machine'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Protocol State Machine Implementation: ${projectName}`);
  ctx.log('info', `Protocol: ${protocolName}, Language: ${language}`);

  // ============================================================================
  // PHASE 1: STATE AND TRANSITION DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining states and transitions');

  const stateDefinition = await ctx.task(stateDefinitionTask, {
    projectName,
    protocolName,
    states,
    transitions,
    timeouts,
    outputDir
  });

  artifacts.push(...stateDefinition.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: Defined ${stateDefinition.states.length} states and ${stateDefinition.transitions.length} transitions. Proceed with architecture design?`,
    title: 'State Definition Review',
    context: {
      runId: ctx.runId,
      states: stateDefinition.states,
      transitions: stateDefinition.transitions,
      files: stateDefinition.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: STATE MACHINE ARCHITECTURE
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing state machine architecture');

  const architecture = await ctx.task(architectureTask, {
    projectName,
    language,
    stateDefinition,
    outputDir
  });

  artifacts.push(...architecture.artifacts);

  // ============================================================================
  // PHASE 3: STATE HANDLERS IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing state handlers');

  const stateHandlers = await ctx.task(stateHandlersTask, {
    projectName,
    language,
    stateDefinition,
    architecture,
    outputDir
  });

  artifacts.push(...stateHandlers.artifacts);

  // ============================================================================
  // PHASE 4: TRANSITION IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing state transitions');

  const transitionImplementation = await ctx.task(transitionTask, {
    projectName,
    language,
    stateDefinition,
    stateHandlers,
    outputDir
  });

  artifacts.push(...transitionImplementation.artifacts);

  // ============================================================================
  // PHASE 5: TIMEOUT MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing timeout management');

  const timeoutManagement = await ctx.task(timeoutManagementTask, {
    projectName,
    language,
    stateDefinition,
    timeouts,
    outputDir
  });

  artifacts.push(...timeoutManagement.artifacts);

  // ============================================================================
  // PHASE 6: EVENT HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing event handling');

  const eventHandling = await ctx.task(eventHandlingTask, {
    projectName,
    language,
    stateDefinition,
    transitionImplementation,
    outputDir
  });

  artifacts.push(...eventHandling.artifacts);

  // ============================================================================
  // PHASE 7: ERROR STATES AND RECOVERY
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing error states and recovery');

  const errorRecovery = await ctx.task(errorRecoveryTask, {
    projectName,
    language,
    stateDefinition,
    outputDir
  });

  artifacts.push(...errorRecovery.artifacts);

  // ============================================================================
  // PHASE 8: VISUALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating state machine visualization');

  const visualization = await ctx.task(visualizationTask, {
    projectName,
    stateDefinition,
    transitionImplementation,
    outputDir
  });

  artifacts.push(...visualization.artifacts);

  // ============================================================================
  // PHASE 9: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating comprehensive tests');

  const testSuite = await ctx.task(testSuiteTask, {
    projectName,
    language,
    stateDefinition,
    transitionImplementation,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 10: DOCUMENTATION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating documentation and validation');

  const [documentation, validation] = await ctx.parallel.all([
    () => ctx.task(documentationTask, {
      projectName,
      stateDefinition,
      architecture,
      stateHandlers,
      transitionImplementation,
      timeoutManagement,
      eventHandling,
      errorRecovery,
      visualization,
      outputDir
    }),
    () => ctx.task(validationTask, {
      projectName,
      stateDefinition,
      testSuite,
      outputDir
    })
  ]);

  artifacts.push(...documentation.artifacts);
  artifacts.push(...validation.artifacts);

  await ctx.breakpoint({
    question: `Protocol State Machine Complete for ${projectName}! Validation score: ${validation.overallScore}/100. States: ${stateDefinition.states.length}, Transitions: ${stateDefinition.transitions.length}. Review deliverables?`,
    title: 'Protocol State Machine Complete - Final Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        protocolName,
        statesCount: stateDefinition.states.length,
        transitionsCount: stateDefinition.transitions.length,
        validationScore: validation.overallScore
      },
      files: [
        { path: documentation.readmePath, format: 'markdown', label: 'README' },
        { path: visualization.diagramPath, format: 'svg', label: 'State Diagram' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validation.overallScore >= 80,
    projectName,
    stateMachineConfig: {
      protocolName,
      states: stateDefinition.states,
      transitions: stateDefinition.transitions,
      timeouts: timeoutManagement.timeoutConfig
    },
    implementation: {
      language,
      architecture: architecture.design,
      stateHandlers: stateHandlers.handlers,
      eventHandling: eventHandling.mechanism,
      errorRecovery: errorRecovery.strategies
    },
    visualization: {
      diagramPath: visualization.diagramPath,
      format: visualization.format
    },
    testResults: {
      totalTests: testSuite.totalTests,
      passedTests: testSuite.passedTests
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/network-programming/protocol-state-machine',
      timestamp: startTime,
      protocolName
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const stateDefinitionTask = defineTask('state-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: State Definition - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Protocol State Machine Designer',
      task: 'Define states and transitions',
      context: args,
      instructions: [
        '1. Define all protocol states',
        '2. Define state entry/exit conditions',
        '3. Map all valid transitions',
        '4. Define events triggering transitions',
        '5. Identify guard conditions',
        '6. Define state timeout values',
        '7. Identify terminal states',
        '8. Document state semantics'
      ],
      outputFormat: 'JSON with state definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['states', 'transitions', 'events', 'artifacts'],
      properties: {
        states: { type: 'array' },
        transitions: { type: 'array' },
        events: { type: 'array' },
        guards: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'state-machine', 'design']
}));

export const architectureTask = defineTask('architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Architecture - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'State Machine Architect',
      task: 'Design state machine architecture',
      context: args,
      instructions: [
        '1. Choose state machine pattern (table-driven, state pattern)',
        '2. Design state representation',
        '3. Design transition table structure',
        '4. Plan thread-safety approach',
        '5. Design event queue',
        '6. Plan context/data passing',
        '7. Design callback mechanism',
        '8. Document architecture decisions'
      ],
      outputFormat: 'JSON with architecture design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'pattern', 'artifacts'],
      properties: {
        design: { type: 'object' },
        pattern: { type: 'string' },
        dataStructures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'state-machine', 'architecture']
}));

export const stateHandlersTask = defineTask('state-handlers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: State Handlers - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'State Handler Engineer',
      task: 'Implement state handlers',
      context: args,
      instructions: [
        '1. Implement entry action for each state',
        '2. Implement exit action for each state',
        '3. Implement state-specific behavior',
        '4. Handle state-specific events',
        '5. Implement state data management',
        '6. Add state logging/tracing',
        '7. Implement state-specific validation',
        '8. Document handler responsibilities'
      ],
      outputFormat: 'JSON with state handlers'
    },
    outputSchema: {
      type: 'object',
      required: ['handlers', 'entryActions', 'exitActions', 'artifacts'],
      properties: {
        handlers: { type: 'array' },
        entryActions: { type: 'array' },
        exitActions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'state-machine', 'handlers']
}));

export const transitionTask = defineTask('transitions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Transitions - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'State Transition Engineer',
      task: 'Implement state transitions',
      context: args,
      instructions: [
        '1. Implement transition table',
        '2. Implement guard condition checking',
        '3. Implement transition actions',
        '4. Handle invalid transitions',
        '5. Implement atomic state changes',
        '6. Add transition logging',
        '7. Implement transition hooks',
        '8. Document transition behavior'
      ],
      outputFormat: 'JSON with transition implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['transitionTable', 'guards', 'artifacts'],
      properties: {
        transitionTable: { type: 'object' },
        guards: { type: 'array' },
        actions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'state-machine', 'transitions']
}));

export const timeoutManagementTask = defineTask('timeout-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Timeout Management - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Timeout Management Engineer',
      task: 'Implement timeout management per state',
      context: args,
      instructions: [
        '1. Define timeout values per state',
        '2. Implement timeout scheduling',
        '3. Handle timeout expiration',
        '4. Implement timeout cancellation',
        '5. Handle state change timeout reset',
        '6. Implement timeout escalation',
        '7. Add timeout metrics',
        '8. Document timeout behavior'
      ],
      outputFormat: 'JSON with timeout implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['timeoutConfig', 'implementation', 'artifacts'],
      properties: {
        timeoutConfig: { type: 'object' },
        implementation: { type: 'object' },
        escalation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'state-machine', 'timeout']
}));

export const eventHandlingTask = defineTask('event-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Event Handling - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Event Handling Engineer',
      task: 'Implement event handling for state changes',
      context: args,
      instructions: [
        '1. Implement event queue',
        '2. Implement event dispatch',
        '3. Handle event prioritization',
        '4. Implement deferred events',
        '5. Handle concurrent events',
        '6. Implement event filtering',
        '7. Add event logging',
        '8. Document event handling'
      ],
      outputFormat: 'JSON with event handling implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanism', 'eventTypes', 'artifacts'],
      properties: {
        mechanism: { type: 'object' },
        eventTypes: { type: 'array' },
        queue: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'state-machine', 'events']
}));

export const errorRecoveryTask = defineTask('error-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Error Recovery - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Error Recovery Engineer',
      task: 'Implement error states and recovery',
      context: args,
      instructions: [
        '1. Define error states',
        '2. Implement error detection',
        '3. Implement recovery transitions',
        '4. Handle unrecoverable errors',
        '5. Implement state reset',
        '6. Add error logging',
        '7. Implement error callbacks',
        '8. Document recovery procedures'
      ],
      outputFormat: 'JSON with error recovery implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'errorStates', 'artifacts'],
      properties: {
        strategies: { type: 'array' },
        errorStates: { type: 'array' },
        recoveryPaths: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'state-machine', 'error-recovery']
}));

export const visualizationTask = defineTask('visualization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Visualization - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'State Machine Visualization Engineer',
      task: 'Create state machine visualization',
      context: args,
      instructions: [
        '1. Generate state diagram (DOT format)',
        '2. Show all states and transitions',
        '3. Indicate entry/exit actions',
        '4. Show guard conditions',
        '5. Highlight error states',
        '6. Show timeout transitions',
        '7. Generate multiple formats (SVG, PNG)',
        '8. Add diagram to documentation'
      ],
      outputFormat: 'JSON with visualization artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['diagramPath', 'format', 'artifacts'],
      properties: {
        diagramPath: { type: 'string' },
        format: { type: 'string' },
        dotSource: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'state-machine', 'visualization']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Test Suite - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'State Machine Test Engineer',
      task: 'Create comprehensive tests',
      context: args,
      instructions: [
        '1. Test all valid transitions',
        '2. Test invalid transitions',
        '3. Test timeout behavior',
        '4. Test error recovery',
        '5. Test concurrent events',
        '6. Test state handlers',
        '7. Test guard conditions',
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
        coverage: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'protocol', 'state-machine', 'testing']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Documentation - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate state machine documentation',
      context: args,
      instructions: [
        '1. Create README with overview',
        '2. Document all states',
        '3. Document all transitions',
        '4. Include state diagram',
        '5. Document API usage',
        '6. Create integration guide',
        '7. Document error handling',
        '8. Create troubleshooting guide'
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
  labels: ['network', 'protocol', 'state-machine', 'documentation']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Validation - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: {
    name: 'protocol-expert',
    prompt: {
      role: 'QA Engineer',
      task: 'Validate state machine implementation',
      context: args,
      instructions: [
        '1. Verify all states implemented',
        '2. Verify all transitions implemented',
        '3. Check determinism',
        '4. Verify completeness',
        '5. Validate test coverage',
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
  labels: ['network', 'protocol', 'state-machine', 'validation']
}));
