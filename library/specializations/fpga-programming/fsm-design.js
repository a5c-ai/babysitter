/**
 * @process specializations/fpga-programming/fsm-design
 * @description Finite State Machine (FSM) Design - Design and implement finite state machines using one-hot, binary,
 * or Gray encoding. Create clear state transition logic with proper reset behavior and output registration.
 * @inputs { fsmName: string, stateList: array, encoding?: string, outputType?: string, targetDevice?: string, language?: string, outputDir?: string }
 * @outputs { success: boolean, fsmFiles: object, stateDiagram: string, testbenchPath: string, verificationReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/fsm-design', {
 *   fsmName: 'uart_tx_fsm',
 *   stateList: ['IDLE', 'START_BIT', 'DATA_BITS', 'STOP_BIT'],
 *   encoding: 'one-hot',
 *   outputType: 'Moore',
 *   targetDevice: 'Xilinx Artix-7',
 *   language: 'SystemVerilog'
 * });
 *
 * @references
 * - FSM Design Best Practices: http://www.sunburst-design.com/papers/
 * - State Machine Encoding: https://docs.amd.com/r/en-US/ug901-vivado-synthesis
 * - Safe FSM Design: https://www.intel.com/content/www/us/en/programmable/documentation/mwh1409960181641.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    fsmName,
    stateList,
    encoding = 'one-hot', // 'one-hot', 'binary', 'gray', 'auto'
    outputType = 'Moore', // 'Moore', 'Mealy'
    targetDevice = 'Generic FPGA',
    language = 'SystemVerilog',
    clockDomain = 'clk',
    resetType = 'synchronous',
    resetPolarity = 'active_high',
    safeStateMachine = true,
    registerOutputs = true,
    outputDir = 'fsm-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting FSM Design: ${fsmName}`);
  ctx.log('info', `States: ${stateList.length}, Encoding: ${encoding}, Output Type: ${outputType}`);

  // ============================================================================
  // PHASE 1: FSM SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: FSM Specification and State Definition');

  const specification = await ctx.task(fsmSpecificationTask, {
    fsmName,
    stateList,
    encoding,
    outputType,
    resetType,
    resetPolarity,
    safeStateMachine,
    outputDir
  });

  artifacts.push(...specification.artifacts);

  // ============================================================================
  // PHASE 2: STATE TRANSITION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: State Transition Logic Design');

  const transitionDesign = await ctx.task(stateTransitionTask, {
    fsmName,
    stateList,
    specification,
    outputType,
    outputDir
  });

  artifacts.push(...transitionDesign.artifacts);

  // Quality Gate: Transition review
  await ctx.breakpoint({
    question: `State transitions defined for ${fsmName}. ${transitionDesign.transitionCount} transitions across ${stateList.length} states. Review transition table?`,
    title: 'State Transition Review',
    context: {
      runId: ctx.runId,
      fsmName,
      stateCount: stateList.length,
      transitionCount: transitionDesign.transitionCount,
      transitionTable: transitionDesign.transitionTable,
      files: transitionDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 3: OUTPUT LOGIC DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Output Logic Design');

  const outputLogic = await ctx.task(outputLogicTask, {
    fsmName,
    stateList,
    outputType,
    transitionDesign,
    registerOutputs,
    outputDir
  });

  artifacts.push(...outputLogic.artifacts);

  // ============================================================================
  // PHASE 4: ENCODING IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: State Encoding Implementation');

  const encodingImpl = await ctx.task(stateEncodingTask, {
    fsmName,
    stateList,
    encoding,
    targetDevice,
    language,
    safeStateMachine,
    outputDir
  });

  artifacts.push(...encodingImpl.artifacts);

  // ============================================================================
  // PHASE 5: RTL IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: FSM RTL Implementation');

  const rtlImplementation = await ctx.task(fsmRtlImplementationTask, {
    fsmName,
    language,
    stateList,
    encoding,
    outputType,
    clockDomain,
    resetType,
    resetPolarity,
    registerOutputs,
    safeStateMachine,
    transitionDesign,
    outputLogic,
    encodingImpl,
    outputDir
  });

  artifacts.push(...rtlImplementation.artifacts);

  // ============================================================================
  // PHASE 6: ILLEGAL STATE HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 6: Illegal State Recovery Logic');

  const illegalStateHandling = await ctx.task(illegalStateHandlingTask, {
    fsmName,
    stateList,
    encoding,
    safeStateMachine,
    rtlImplementation,
    outputDir
  });

  artifacts.push(...illegalStateHandling.artifacts);

  // ============================================================================
  // PHASE 7: STATE DIAGRAM GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: State Diagram Generation');

  const stateDiagram = await ctx.task(stateDiagramTask, {
    fsmName,
    stateList,
    transitionDesign,
    outputLogic,
    outputDir
  });

  artifacts.push(...stateDiagram.artifacts);

  // ============================================================================
  // PHASE 8: TESTBENCH DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: FSM Testbench Development');

  const testbench = await ctx.task(fsmTestbenchTask, {
    fsmName,
    language,
    stateList,
    transitionDesign,
    clockDomain,
    resetType,
    resetPolarity,
    outputDir
  });

  artifacts.push(...testbench.artifacts);

  // ============================================================================
  // PHASE 9: FORMAL VERIFICATION PROPERTIES
  // ============================================================================

  ctx.log('info', 'Phase 9: Formal Verification Properties');

  const formalProperties = await ctx.task(formalVerificationTask, {
    fsmName,
    language,
    stateList,
    transitionDesign,
    safeStateMachine,
    outputDir
  });

  artifacts.push(...formalProperties.artifacts);

  // ============================================================================
  // PHASE 10: QUALITY AND COVERAGE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 10: Quality and Coverage Analysis');

  const qualityAnalysis = await ctx.task(fsmQualityAnalysisTask, {
    fsmName,
    rtlImplementation,
    testbench,
    formalProperties,
    encoding,
    safeStateMachine,
    outputDir
  });

  artifacts.push(...qualityAnalysis.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `FSM Design Complete for ${fsmName}. ${stateList.length} states, ${transitionDesign.transitionCount} transitions. Quality score: ${qualityAnalysis.score}/100. Review FSM package?`,
    title: 'FSM Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        fsmName,
        stateCount: stateList.length,
        transitionCount: transitionDesign.transitionCount,
        encoding,
        outputType,
        safeStateMachine,
        qualityScore: qualityAnalysis.score
      },
      files: [
        { path: rtlImplementation.fsmFilePath, format: 'sv', label: 'FSM RTL' },
        { path: stateDiagram.diagramPath, format: 'svg', label: 'State Diagram' },
        { path: testbench.testbenchPath, format: 'sv', label: 'Testbench' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: qualityAnalysis.score >= 80,
    fsmName,
    fsmFiles: {
      rtl: rtlImplementation.fsmFilePath,
      package: rtlImplementation.packageFilePath,
      testbench: testbench.testbenchPath
    },
    stateDiagram: stateDiagram.diagramPath,
    testbenchPath: testbench.testbenchPath,
    verificationReport: {
      formalProperties: formalProperties.propertyCount,
      testCases: testbench.testCaseCount,
      coverageEstimate: qualityAnalysis.coverageEstimate
    },
    design: {
      stateCount: stateList.length,
      transitionCount: transitionDesign.transitionCount,
      encoding,
      outputType,
      safeStateMachine,
      registerOutputs
    },
    quality: {
      score: qualityAnalysis.score,
      issues: qualityAnalysis.issues,
      recommendations: qualityAnalysis.recommendations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/fpga-programming/fsm-design',
      timestamp: startTime,
      fsmName,
      encoding,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const fsmSpecificationTask = defineTask('fsm-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: FSM Specification - ${args.fsmName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Create FSM specification and state definitions',
      context: args,
      instructions: [
        '1. Define all states with descriptions',
        '2. Identify initial/reset state',
        '3. Define input signals and conditions',
        '4. Define output signals per state',
        '5. Specify state encoding strategy',
        '6. Document timing requirements',
        '7. Define reset behavior',
        '8. Identify safe state requirements',
        '9. Document state invariants',
        '10. Create state descriptions table'
      ],
      outputFormat: 'JSON with FSM specification'
    },
    outputSchema: {
      type: 'object',
      required: ['states', 'inputs', 'outputs', 'artifacts'],
      properties: {
        states: { type: 'array', items: { type: 'object' } },
        inputs: { type: 'array', items: { type: 'object' } },
        outputs: { type: 'array', items: { type: 'object' } },
        resetState: { type: 'string' },
        encodingBits: { type: 'number' },
        timingRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'fsm', 'specification']
}));

export const stateTransitionTask = defineTask('state-transition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: State Transitions - ${args.fsmName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Design state transition logic',
      context: args,
      instructions: [
        '1. Define all state transitions',
        '2. Specify transition conditions',
        '3. Create transition table',
        '4. Identify unreachable states',
        '5. Check for deadlock conditions',
        '6. Verify all states reachable from reset',
        '7. Define priority for concurrent conditions',
        '8. Document default transitions',
        '9. Identify critical transitions',
        '10. Create transition diagram'
      ],
      outputFormat: 'JSON with transition design'
    },
    outputSchema: {
      type: 'object',
      required: ['transitionCount', 'transitionTable', 'artifacts'],
      properties: {
        transitionCount: { type: 'number' },
        transitionTable: { type: 'array', items: { type: 'object' } },
        deadlockFree: { type: 'boolean' },
        allStatesReachable: { type: 'boolean' },
        criticalTransitions: { type: 'array', items: { type: 'object' } },
        defaultTransitions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'fsm', 'transitions']
}));

export const outputLogicTask = defineTask('output-logic', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Output Logic - ${args.fsmName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Design FSM output logic',
      context: args,
      instructions: [
        '1. Define Moore outputs (state-based)',
        '2. Define Mealy outputs (transition-based) if applicable',
        '3. Create output table per state',
        '4. Design output registration if needed',
        '5. Handle output glitch prevention',
        '6. Define output timing',
        '7. Document output encoding',
        '8. Identify combinational outputs',
        '9. Identify registered outputs',
        '10. Create output timing diagram'
      ],
      outputFormat: 'JSON with output logic design'
    },
    outputSchema: {
      type: 'object',
      required: ['mooreOutputs', 'outputTable', 'artifacts'],
      properties: {
        mooreOutputs: { type: 'array', items: { type: 'object' } },
        mealyOutputs: { type: 'array', items: { type: 'object' } },
        outputTable: { type: 'array', items: { type: 'object' } },
        registeredOutputs: { type: 'array', items: { type: 'string' } },
        combinationalOutputs: { type: 'array', items: { type: 'string' } },
        glitchHandling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'fsm', 'output-logic']
}));

export const stateEncodingTask = defineTask('state-encoding', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: State Encoding - ${args.fsmName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Implement state encoding',
      context: args,
      instructions: [
        '1. Calculate encoding width',
        '2. Assign state codes (one-hot/binary/gray)',
        '3. Define state type (enum)',
        '4. Create encoding constants',
        '5. Document encoding rationale',
        '6. Optimize for target device',
        '7. Handle unused codes',
        '8. Add synthesis encoding attribute',
        '9. Calculate encoding efficiency',
        '10. Document encoding trade-offs'
      ],
      outputFormat: 'JSON with encoding implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['encodingWidth', 'stateEncoding', 'artifacts'],
      properties: {
        encodingWidth: { type: 'number' },
        stateEncoding: { type: 'array', items: { type: 'object' } },
        encodingType: { type: 'string' },
        unusedCodes: { type: 'number' },
        synthesisAttribute: { type: 'string' },
        encodingEfficiency: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'fsm', 'encoding']
}));

export const fsmRtlImplementationTask = defineTask('fsm-rtl-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: FSM RTL - ${args.fsmName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'HDL Design Engineer',
      task: 'Implement FSM in RTL',
      context: args,
      instructions: [
        '1. Define state enum/type',
        '2. Create state register process',
        '3. Implement next-state combinational logic',
        '4. Implement output combinational logic',
        '5. Add proper reset handling',
        '6. Use recommended FSM coding style',
        '7. Add synthesis attributes',
        '8. Implement registered outputs if needed',
        '9. Add state debug output',
        '10. Document FSM structure'
      ],
      outputFormat: 'JSON with RTL implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['fsmFilePath', 'artifacts'],
      properties: {
        fsmFilePath: { type: 'string' },
        packageFilePath: { type: 'string' },
        codingStyle: { type: 'string' },
        processCount: { type: 'number' },
        stateRegisterType: { type: 'string' },
        synthesisAttributes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'fsm', 'rtl']
}));

export const illegalStateHandlingTask = defineTask('illegal-state-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Illegal State Handling - ${args.fsmName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Implement illegal state recovery',
      context: args,
      instructions: [
        '1. Identify possible illegal states',
        '2. Design recovery strategy',
        '3. Implement default case handling',
        '4. Add illegal state detection',
        '5. Create recovery state machine',
        '6. Add error indication output',
        '7. Implement hamming distance check if needed',
        '8. Document recovery behavior',
        '9. Add assertion for illegal states',
        '10. Test recovery path'
      ],
      outputFormat: 'JSON with illegal state handling'
    },
    outputSchema: {
      type: 'object',
      required: ['recoveryStrategy', 'illegalStateCount', 'artifacts'],
      properties: {
        recoveryStrategy: { type: 'string' },
        illegalStateCount: { type: 'number' },
        recoveryState: { type: 'string' },
        detectionLogic: { type: 'string' },
        errorIndication: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'fsm', 'safe-fsm']
}));

export const stateDiagramTask = defineTask('state-diagram', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: State Diagram - ${args.fsmName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent (documentation)
    prompt: {
      role: 'Documentation Engineer',
      task: 'Generate state diagram',
      context: args,
      instructions: [
        '1. Create state diagram in standard notation',
        '2. Show all states as circles',
        '3. Show transitions as arrows',
        '4. Label transition conditions',
        '5. Show Moore outputs in states',
        '6. Show Mealy outputs on transitions',
        '7. Mark reset/initial state',
        '8. Use clear layout',
        '9. Add legend if needed',
        '10. Generate in multiple formats'
      ],
      outputFormat: 'JSON with diagram paths'
    },
    outputSchema: {
      type: 'object',
      required: ['diagramPath', 'artifacts'],
      properties: {
        diagramPath: { type: 'string' },
        svgPath: { type: 'string' },
        pngPath: { type: 'string' },
        dotSource: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'fsm', 'diagram', 'documentation']
}));

export const fsmTestbenchTask = defineTask('fsm-testbench', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: FSM Testbench - ${args.fsmName}`,
  agent: {
    name: 'verification-expert', // AG-003: Verification Expert Agent
    prompt: {
      role: 'Verification Engineer',
      task: 'Develop FSM testbench',
      context: args,
      instructions: [
        '1. Create testbench module',
        '2. Instantiate FSM DUT',
        '3. Generate clock and reset',
        '4. Test all state transitions',
        '5. Test reset behavior',
        '6. Test illegal state recovery',
        '7. Verify output values per state',
        '8. Add transition coverage',
        '9. Create random stimulus',
        '10. Report pass/fail status'
      ],
      outputFormat: 'JSON with testbench details'
    },
    outputSchema: {
      type: 'object',
      required: ['testbenchPath', 'testCaseCount', 'artifacts'],
      properties: {
        testbenchPath: { type: 'string' },
        testCaseCount: { type: 'number' },
        transitionsCovered: { type: 'array', items: { type: 'object' } },
        testScenarios: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'fsm', 'testbench', 'verification']
}));

export const formalVerificationTask = defineTask('formal-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Formal Properties - ${args.fsmName}`,
  agent: {
    name: 'verification-expert', // AG-003: Verification Expert Agent
    prompt: {
      role: 'Formal Verification Engineer',
      task: 'Define formal verification properties',
      context: args,
      instructions: [
        '1. Define reachability properties',
        '2. Define safety properties',
        '3. Define liveness properties',
        '4. Create no-deadlock assertion',
        '5. Create illegal state assertion',
        '6. Define input/output relationships',
        '7. Create coverage properties',
        '8. Add assume for inputs',
        '9. Document property purpose',
        '10. Create assertion bind file'
      ],
      outputFormat: 'JSON with formal properties'
    },
    outputSchema: {
      type: 'object',
      required: ['propertyCount', 'properties', 'artifacts'],
      properties: {
        propertyCount: { type: 'number' },
        properties: { type: 'array', items: { type: 'object' } },
        safetyProperties: { type: 'array', items: { type: 'object' } },
        livenessProperties: { type: 'array', items: { type: 'object' } },
        coverProperties: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'fsm', 'formal-verification']
}));

export const fsmQualityAnalysisTask = defineTask('fsm-quality-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Quality Analysis - ${args.fsmName}`,
  agent: {
    name: 'verification-expert', // AG-003: Verification Expert Agent (quality)
    prompt: {
      role: 'Quality Assurance Engineer',
      task: 'Analyze FSM quality and coverage',
      context: args,
      instructions: [
        '1. Check coding style compliance',
        '2. Verify all states reachable',
        '3. Check transition coverage',
        '4. Verify output completeness',
        '5. Check safe FSM implementation',
        '6. Verify encoding correctness',
        '7. Check testbench coverage',
        '8. Review formal properties',
        '9. Identify improvements',
        '10. Generate quality report'
      ],
      outputFormat: 'JSON with quality analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'coverageEstimate', 'issues', 'recommendations', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        coverageEstimate: { type: 'string' },
        issues: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        passedChecks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'fsm', 'quality']
}));
