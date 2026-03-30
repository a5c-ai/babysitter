/**
 * @process specializations/fpga-programming/verilog-systemverilog-design
 * @description Verilog/SystemVerilog Design Implementation - Implement digital designs using Verilog or SystemVerilog
 * following IEEE 1800 standards. Create parameterized modules with proper use of always_ff, always_comb, and interface
 * constructs.
 * @inputs { moduleName: string, functionality: string, language?: string, targetDevice?: string, interfaces?: array, parameters?: array, outputDir?: string }
 * @outputs { success: boolean, designFiles: object, synthesisReport: object, testbenchPath: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/verilog-systemverilog-design', {
 *   moduleName: 'axi_stream_filter',
 *   functionality: 'AXI-Stream data filter with configurable threshold',
 *   language: 'SystemVerilog',
 *   targetDevice: 'Intel Agilex',
 *   interfaces: ['axi_stream_if.slave s_axis', 'axi_stream_if.master m_axis'],
 *   parameters: ['DATA_WIDTH = 32', 'THRESHOLD = 128']
 * });
 *
 * @references
 * - IEEE 1800-2023 SystemVerilog: https://standards.ieee.org/standard/1800-2023.html
 * - Verilog IEEE 1364-2005: https://standards.ieee.org/standard/1364-2005.html
 * - SystemVerilog for Design: https://www.veripool.org/verilator/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    moduleName,
    functionality,
    language = 'SystemVerilog', // 'Verilog', 'SystemVerilog'
    targetDevice = 'Generic FPGA',
    interfaces = [],
    parameters = [],
    clockDomain = 'clk',
    resetType = 'active_low', // 'active_low', 'active_high'
    resetSync = 'asynchronous', // 'synchronous', 'asynchronous'
    useInterfaces = true,
    synthesizable = true,
    outputDir = 'verilog-sv-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ${language} Design: ${moduleName}`);
  ctx.log('info', `Target: ${targetDevice}, Parameters: ${parameters.length}`);

  // ============================================================================
  // PHASE 1: DESIGN SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Design Specification');

  const specification = await ctx.task(svDesignSpecTask, {
    moduleName,
    functionality,
    language,
    targetDevice,
    interfaces,
    parameters,
    clockDomain,
    resetType,
    resetSync,
    outputDir
  });

  artifacts.push(...specification.artifacts);

  // ============================================================================
  // PHASE 2: MODULE INTERFACE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Module Interface Design');

  const interfaceDesign = await ctx.task(moduleInterfaceTask, {
    moduleName,
    language,
    interfaces,
    parameters,
    clockDomain,
    resetType,
    resetSync,
    useInterfaces,
    specification,
    outputDir
  });

  artifacts.push(...interfaceDesign.artifacts);

  // Quality Gate: Interface review
  await ctx.breakpoint({
    question: `Interface design complete for ${moduleName}. ${interfaceDesign.portCount} ports, ${interfaceDesign.parameterCount} parameters. Review module interface?`,
    title: 'Module Interface Review',
    context: {
      runId: ctx.runId,
      moduleName,
      language,
      ports: interfaceDesign.ports,
      parameters: interfaceDesign.parameterDetails,
      files: interfaceDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'sv' }))
    }
  });

  // ============================================================================
  // PHASE 3: RTL IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: RTL Implementation');

  const rtlImplementation = await ctx.task(rtlImplementationTask, {
    moduleName,
    functionality,
    language,
    interfaceDesign,
    specification,
    resetType,
    resetSync,
    synthesizable,
    outputDir
  });

  artifacts.push(...rtlImplementation.artifacts);

  // ============================================================================
  // PHASE 4: SYSTEMVERILOG INTERFACES (if applicable)
  // ============================================================================

  let svInterfaces = null;
  if (language === 'SystemVerilog' && useInterfaces) {
    ctx.log('info', 'Phase 4: SystemVerilog Interface Definitions');

    svInterfaces = await ctx.task(svInterfaceDefinitionTask, {
      moduleName,
      interfaces,
      clockDomain,
      resetType,
      outputDir
    });

    artifacts.push(...svInterfaces.artifacts);
  }

  // ============================================================================
  // PHASE 5: ASSERTIONS (SVA)
  // ============================================================================

  ctx.log('info', 'Phase 5: SystemVerilog Assertions');

  const assertions = await ctx.task(svaDesignTask, {
    moduleName,
    language,
    functionality,
    interfaceDesign,
    rtlImplementation,
    outputDir
  });

  artifacts.push(...assertions.artifacts);

  // ============================================================================
  // PHASE 6: SYNTHESIS DIRECTIVES
  // ============================================================================

  ctx.log('info', 'Phase 6: Synthesis Directives and Attributes');

  const synthesisDirectives = await ctx.task(svSynthesisDirectivesTask, {
    moduleName,
    language,
    targetDevice,
    rtlImplementation,
    synthesizable,
    outputDir
  });

  artifacts.push(...synthesisDirectives.artifacts);

  // ============================================================================
  // PHASE 7: TESTBENCH DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Testbench Development');

  const testbench = await ctx.task(svTestbenchTask, {
    moduleName,
    language,
    interfaceDesign,
    functionality,
    clockDomain,
    resetType,
    resetSync,
    svInterfaces,
    outputDir
  });

  artifacts.push(...testbench.artifacts);

  // ============================================================================
  // PHASE 8: CODE QUALITY CHECK
  // ============================================================================

  ctx.log('info', 'Phase 8: Code Quality and Lint Check');

  const codeQuality = await ctx.task(svCodeQualityTask, {
    moduleName,
    language,
    rtlImplementation,
    assertions,
    synthesizable,
    outputDir
  });

  artifacts.push(...codeQuality.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `${language} Design Complete for ${moduleName}. Quality score: ${codeQuality.score}/100. ${assertions.assertionCount} assertions. Review design package?`,
    title: 'Design Development Complete',
    context: {
      runId: ctx.runId,
      summary: {
        moduleName,
        language,
        targetDevice,
        portCount: interfaceDesign.portCount,
        parameterCount: interfaceDesign.parameterCount,
        alwaysBlockCount: rtlImplementation.alwaysBlockCount,
        assertionCount: assertions.assertionCount,
        qualityScore: codeQuality.score
      },
      files: [
        { path: rtlImplementation.moduleFilePath, format: 'sv', label: 'Design Module' },
        { path: testbench.testbenchPath, format: 'sv', label: 'Testbench' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: codeQuality.score >= 80,
    moduleName,
    language,
    targetDevice,
    designFiles: {
      module: rtlImplementation.moduleFilePath,
      interfaces: svInterfaces?.interfaceFiles || [],
      package: rtlImplementation.packageFilePath
    },
    synthesisReport: {
      synthesizable,
      directives: synthesisDirectives.directives,
      inferredResources: synthesisDirectives.inferredResources
    },
    testbenchPath: testbench.testbenchPath,
    assertions: {
      count: assertions.assertionCount,
      properties: assertions.properties
    },
    codeQuality: {
      score: codeQuality.score,
      warnings: codeQuality.warnings,
      recommendations: codeQuality.recommendations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/fpga-programming/verilog-systemverilog-design',
      timestamp: startTime,
      moduleName,
      language,
      targetDevice,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const svDesignSpecTask = defineTask('sv-design-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Design Specification - ${args.moduleName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'FPGA Design Engineer',
      task: `Create ${args.language} design specification`,
      context: args,
      instructions: [
        '1. Document functional requirements',
        '2. Define interface behavior',
        '3. Specify timing requirements',
        '4. Document reset behavior',
        '5. Define parameter constraints',
        '6. Specify protocol requirements',
        '7. Document edge cases',
        '8. Define error conditions',
        '9. Create timing diagrams',
        '10. Document test scenarios'
      ],
      outputFormat: 'JSON with design specification'
    },
    outputSchema: {
      type: 'object',
      required: ['functionalSpec', 'interfaceSpec', 'artifacts'],
      properties: {
        functionalSpec: { type: 'object' },
        interfaceSpec: { type: 'array', items: { type: 'object' } },
        timingSpec: { type: 'object' },
        resetSpec: { type: 'object' },
        parameterConstraints: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'verilog', 'systemverilog', 'specification']
}));

export const moduleInterfaceTask = defineTask('module-interface', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Module Interface - ${args.moduleName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'HDL Design Engineer',
      task: `Design ${args.language} module interface`,
      context: args,
      instructions: [
        '1. Define module header with parameters',
        '2. Define input ports with proper types',
        '3. Define output ports with proper types',
        '4. Add clock and reset ports',
        '5. Use logic type (SystemVerilog) or wire/reg (Verilog)',
        '6. Define parameter defaults and ranges',
        '7. Add port descriptions in comments',
        '8. Use interface ports if applicable',
        '9. Follow naming conventions',
        '10. Validate synthesis compatibility'
      ],
      outputFormat: 'JSON with interface details'
    },
    outputSchema: {
      type: 'object',
      required: ['portCount', 'parameterCount', 'ports', 'artifacts'],
      properties: {
        portCount: { type: 'number' },
        parameterCount: { type: 'number' },
        ports: { type: 'array', items: { type: 'object' } },
        parameterDetails: { type: 'array', items: { type: 'object' } },
        interfacePorts: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'verilog', 'systemverilog', 'interface']
}));

export const rtlImplementationTask = defineTask('rtl-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: RTL Implementation - ${args.moduleName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'HDL Design Engineer',
      task: `Implement RTL in ${args.language}`,
      context: args,
      instructions: [
        '1. Use always_ff for sequential logic (SV)',
        '2. Use always_comb for combinational logic (SV)',
        '3. Implement proper reset handling',
        '4. Define internal signals/variables',
        '5. Implement state machines with enum',
        '6. Use non-blocking for sequential, blocking for comb',
        '7. Implement data path logic',
        '8. Add generate blocks for parameterized structures',
        '9. Follow synthesis coding guidelines',
        '10. Add comprehensive comments'
      ],
      outputFormat: 'JSON with RTL implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['moduleFilePath', 'alwaysBlockCount', 'artifacts'],
      properties: {
        moduleFilePath: { type: 'string' },
        packageFilePath: { type: 'string' },
        alwaysBlockCount: { type: 'number' },
        signalCount: { type: 'number' },
        stateMachines: { type: 'array', items: { type: 'object' } },
        generateBlocks: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'verilog', 'systemverilog', 'rtl']
}));

export const svInterfaceDefinitionTask = defineTask('sv-interface-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: SV Interface Definition - ${args.moduleName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent (SystemVerilog)
    prompt: {
      role: 'SystemVerilog Design Engineer',
      task: 'Define SystemVerilog interfaces',
      context: args,
      instructions: [
        '1. Create interface declarations',
        '2. Define logic signals within interface',
        '3. Create modports for different views',
        '4. Add clocking blocks if needed',
        '5. Include interface parameters',
        '6. Define tasks and functions',
        '7. Add assertions within interface',
        '8. Create master/slave modports',
        '9. Document interface usage',
        '10. Verify synthesis support'
      ],
      outputFormat: 'JSON with interface definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['interfaceFiles', 'artifacts'],
      properties: {
        interfaceFiles: { type: 'array', items: { type: 'string' } },
        interfaceDefinitions: { type: 'array', items: { type: 'object' } },
        modports: { type: 'array', items: { type: 'object' } },
        clockingBlocks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'systemverilog', 'interface']
}));

export const svaDesignTask = defineTask('sva-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: SVA Design - ${args.moduleName}`,
  agent: {
    name: 'verification-expert', // AG-003: Verification Expert Agent
    prompt: {
      role: 'Verification Engineer',
      task: 'Design SystemVerilog Assertions',
      context: args,
      instructions: [
        '1. Define properties for key behaviors',
        '2. Create concurrent assertions',
        '3. Add immediate assertions',
        '4. Define cover properties',
        '5. Create assume properties for inputs',
        '6. Use sequences for complex behaviors',
        '7. Add assertion labels',
        '8. Configure assertion severity',
        '9. Make assertions synthesizable when possible',
        '10. Document assertion purpose'
      ],
      outputFormat: 'JSON with assertion design'
    },
    outputSchema: {
      type: 'object',
      required: ['assertionCount', 'properties', 'artifacts'],
      properties: {
        assertionCount: { type: 'number' },
        properties: { type: 'array', items: { type: 'object' } },
        sequences: { type: 'array', items: { type: 'object' } },
        coverProperties: { type: 'array', items: { type: 'object' } },
        assumeProperties: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'systemverilog', 'sva', 'assertions']
}));

export const svSynthesisDirectivesTask = defineTask('sv-synthesis-directives', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Synthesis Directives - ${args.moduleName}`,
  agent: {
    name: 'synthesis-expert', // AG-007: Synthesis Expert Agent
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Add synthesis directives and attributes',
      context: args,
      instructions: [
        '1. Add (* synthesis *) attributes',
        '2. Configure FSM encoding (full_case, parallel_case)',
        '3. Add keep/preserve attributes',
        '4. Configure RAM inference',
        '5. Add DSP inference hints',
        '6. Configure register duplication',
        '7. Add max_fanout constraints',
        '8. Document directive effects',
        '9. Verify vendor compatibility',
        '10. Test synthesis results'
      ],
      outputFormat: 'JSON with synthesis directives'
    },
    outputSchema: {
      type: 'object',
      required: ['directives', 'inferredResources', 'artifacts'],
      properties: {
        directives: { type: 'array', items: { type: 'object' } },
        inferredResources: { type: 'object' },
        fsmEncoding: { type: 'string' },
        ramStyle: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'verilog', 'systemverilog', 'synthesis']
}));

export const svTestbenchTask = defineTask('sv-testbench', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Testbench - ${args.moduleName}`,
  agent: {
    name: 'verification-expert', // AG-003: Verification Expert Agent
    prompt: {
      role: 'Verification Engineer',
      task: `Develop ${args.language} testbench`,
      context: args,
      instructions: [
        '1. Create testbench module',
        '2. Instantiate DUT',
        '3. Generate clock with always block',
        '4. Create reset sequence task',
        '5. Develop stimulus using initial block',
        '6. Implement checking logic',
        '7. Use interface connections (SV)',
        '8. Add $display for debugging',
        '9. Implement test scenarios',
        '10. Add $finish for simulation end'
      ],
      outputFormat: 'JSON with testbench details'
    },
    outputSchema: {
      type: 'object',
      required: ['testbenchPath', 'testCases', 'artifacts'],
      properties: {
        testbenchPath: { type: 'string' },
        testCases: { type: 'array', items: { type: 'object' } },
        clockPeriod: { type: 'string' },
        resetDuration: { type: 'string' },
        tasks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'verilog', 'systemverilog', 'testbench']
}));

export const svCodeQualityTask = defineTask('sv-code-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Code Quality - ${args.moduleName}`,
  agent: {
    name: 'verification-expert', // AG-003: Verification Expert Agent (code quality)
    prompt: {
      role: 'HDL Code Quality Reviewer',
      task: `Check ${args.language} code quality`,
      context: args,
      instructions: [
        '1. Check always_ff/always_comb usage',
        '2. Verify non-blocking assignments',
        '3. Check for inferred latches',
        '4. Verify complete case statements',
        '5. Check clock domain practices',
        '6. Verify reset handling',
        '7. Check naming conventions',
        '8. Verify parameterization',
        '9. Check documentation',
        '10. Generate lint report'
      ],
      outputFormat: 'JSON with code quality results'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'warnings', 'recommendations', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        warnings: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        passedChecks: { type: 'array', items: { type: 'string' } },
        failedChecks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'verilog', 'systemverilog', 'code-quality']
}));
