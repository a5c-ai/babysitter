/**
 * @process specializations/fpga-programming/vhdl-module-development
 * @description VHDL Module Development - Develop synthesizable VHDL modules following IEEE 1076 standards and industry
 * best practices. Implement entities, architectures, and packages with proper use of numeric_std library and synchronous
 * design methodology.
 * @inputs { moduleName: string, functionality: string, targetDevice?: string, interfaces?: array, generics?: array, outputDir?: string }
 * @outputs { success: boolean, vhdlFiles: object, synthesisReport: object, testbenchPath: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/fpga-programming/vhdl-module-development', {
 *   moduleName: 'fifo_sync',
 *   functionality: 'Synchronous FIFO with configurable depth and width',
 *   targetDevice: 'Xilinx Artix-7',
 *   interfaces: ['data_in[WIDTH-1:0]', 'data_out[WIDTH-1:0]', 'wr_en', 'rd_en'],
 *   generics: ['WIDTH: positive := 8', 'DEPTH: positive := 16']
 * });
 *
 * @references
 * - IEEE 1076-2019 VHDL Standard: https://standards.ieee.org/standard/1076-2019.html
 * - VHDL RTL Synthesis: https://standards.ieee.org/standard/1076_6-2004.html
 * - Xilinx VHDL Coding Guidelines: https://docs.amd.com/r/en-US/ug901-vivado-synthesis
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    moduleName,
    functionality,
    targetDevice = 'Generic FPGA',
    interfaces = [],
    generics = [],
    clockDomain = 'clk',
    resetType = 'synchronous', // 'synchronous', 'asynchronous'
    resetPolarity = 'active_high',
    codingStandard = 'ieee_numeric_std',
    synthesizable = true,
    outputDir = 'vhdl-module-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting VHDL Module Development: ${moduleName}`);
  ctx.log('info', `Target: ${targetDevice}, Reset: ${resetType}, Generics: ${generics.length}`);

  // ============================================================================
  // PHASE 1: DESIGN SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Design Specification and Requirements');

  const specification = await ctx.task(designSpecificationTask, {
    moduleName,
    functionality,
    targetDevice,
    interfaces,
    generics,
    clockDomain,
    resetType,
    resetPolarity,
    outputDir
  });

  artifacts.push(...specification.artifacts);

  // ============================================================================
  // PHASE 2: ENTITY DECLARATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Entity Declaration Development');

  const entityDeclaration = await ctx.task(entityDeclarationTask, {
    moduleName,
    interfaces,
    generics,
    clockDomain,
    resetType,
    resetPolarity,
    specification,
    outputDir
  });

  artifacts.push(...entityDeclaration.artifacts);

  // Quality Gate: Entity review
  await ctx.breakpoint({
    question: `Entity declaration complete for ${moduleName}. ${entityDeclaration.portCount} ports, ${entityDeclaration.genericCount} generics defined. Review entity specification?`,
    title: 'Entity Declaration Review',
    context: {
      runId: ctx.runId,
      moduleName,
      ports: entityDeclaration.ports,
      generics: entityDeclaration.genericsDetails,
      files: entityDeclaration.artifacts.map(a => ({ path: a.path, format: a.format || 'vhdl' }))
    }
  });

  // ============================================================================
  // PHASE 3: ARCHITECTURE IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Architecture RTL Implementation');

  const architecture = await ctx.task(architectureImplementationTask, {
    moduleName,
    functionality,
    entityDeclaration,
    specification,
    resetType,
    resetPolarity,
    codingStandard,
    synthesizable,
    outputDir
  });

  artifacts.push(...architecture.artifacts);

  // ============================================================================
  // PHASE 4: PACKAGE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Package Development (Types and Functions)');

  const packageDev = await ctx.task(packageDevelopmentTask, {
    moduleName,
    entityDeclaration,
    architecture,
    outputDir
  });

  artifacts.push(...packageDev.artifacts);

  // ============================================================================
  // PHASE 5: COMPONENT DECLARATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Component Declaration and Instantiation Templates');

  const componentDecl = await ctx.task(componentDeclarationTask, {
    moduleName,
    entityDeclaration,
    packageDev,
    outputDir
  });

  artifacts.push(...componentDecl.artifacts);

  // ============================================================================
  // PHASE 6: SYNTHESIS ATTRIBUTES
  // ============================================================================

  ctx.log('info', 'Phase 6: Synthesis Attributes and Pragmas');

  const synthesisAttrs = await ctx.task(synthesisAttributesTask, {
    moduleName,
    targetDevice,
    architecture,
    synthesizable,
    outputDir
  });

  artifacts.push(...synthesisAttrs.artifacts);

  // ============================================================================
  // PHASE 7: TESTBENCH DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Testbench Development');

  const testbench = await ctx.task(vhdlTestbenchTask, {
    moduleName,
    entityDeclaration,
    functionality,
    clockDomain,
    resetType,
    resetPolarity,
    outputDir
  });

  artifacts.push(...testbench.artifacts);

  // ============================================================================
  // PHASE 8: CODE QUALITY CHECK
  // ============================================================================

  ctx.log('info', 'Phase 8: Code Quality and Synthesis Guidelines Check');

  const codeQuality = await ctx.task(vhdlCodeQualityTask, {
    moduleName,
    entityDeclaration,
    architecture,
    codingStandard,
    synthesizable,
    outputDir
  });

  artifacts.push(...codeQuality.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `VHDL Module Development Complete for ${moduleName}. Quality score: ${codeQuality.score}/100. ${codeQuality.warningCount} warnings. Review VHDL package?`,
    title: 'VHDL Development Complete',
    context: {
      runId: ctx.runId,
      summary: {
        moduleName,
        targetDevice,
        portCount: entityDeclaration.portCount,
        genericCount: entityDeclaration.genericCount,
        processCount: architecture.processCount,
        qualityScore: codeQuality.score,
        warnings: codeQuality.warningCount
      },
      files: [
        { path: entityDeclaration.entityFilePath, format: 'vhdl', label: 'Entity File' },
        { path: architecture.architectureFilePath, format: 'vhdl', label: 'Architecture File' },
        { path: testbench.testbenchPath, format: 'vhdl', label: 'Testbench' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: codeQuality.score >= 80,
    moduleName,
    targetDevice,
    vhdlFiles: {
      entity: entityDeclaration.entityFilePath,
      architecture: architecture.architectureFilePath,
      package: packageDev.packageFilePath,
      packageBody: packageDev.packageBodyFilePath
    },
    synthesisReport: {
      synthesizable,
      attributes: synthesisAttrs.attributes,
      inferredResources: synthesisAttrs.inferredResources
    },
    testbenchPath: testbench.testbenchPath,
    codeQuality: {
      score: codeQuality.score,
      warnings: codeQuality.warnings,
      recommendations: codeQuality.recommendations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/fpga-programming/vhdl-module-development',
      timestamp: startTime,
      moduleName,
      targetDevice,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const designSpecificationTask = defineTask('design-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Design Specification - ${args.moduleName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Create detailed design specification for VHDL module',
      context: args,
      instructions: [
        '1. Document functional requirements',
        '2. Define interface behavior and protocols',
        '3. Specify timing requirements',
        '4. Document reset behavior',
        '5. Define generic parameter ranges',
        '6. Specify synthesis constraints',
        '7. Document state machine behavior',
        '8. Define error conditions',
        '9. Create signal timing diagrams',
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
        genericSpec: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'vhdl', 'specification']
}));

export const entityDeclarationTask = defineTask('entity-declaration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Entity Declaration - ${args.moduleName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent (VHDL)
    prompt: {
      role: 'VHDL Design Engineer',
      task: 'Develop VHDL entity declaration with generics and ports',
      context: args,
      instructions: [
        '1. Write library and use clauses (IEEE, numeric_std)',
        '2. Define generic parameters with defaults',
        '3. Define input ports with proper types',
        '4. Define output ports with proper types',
        '5. Add clock and reset ports',
        '6. Use std_logic and std_logic_vector types',
        '7. Apply proper port directions (in, out, inout)',
        '8. Add port descriptions as comments',
        '9. Follow naming conventions',
        '10. Validate against synthesis guidelines'
      ],
      outputFormat: 'JSON with entity declaration details'
    },
    outputSchema: {
      type: 'object',
      required: ['entityFilePath', 'portCount', 'genericCount', 'ports', 'artifacts'],
      properties: {
        entityFilePath: { type: 'string' },
        portCount: { type: 'number' },
        genericCount: { type: 'number' },
        ports: { type: 'array', items: { type: 'object' } },
        genericsDetails: { type: 'array', items: { type: 'object' } },
        libraries: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'vhdl', 'entity']
}));

export const architectureImplementationTask = defineTask('architecture-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Architecture Implementation - ${args.moduleName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent (VHDL)
    prompt: {
      role: 'VHDL Design Engineer',
      task: 'Implement RTL architecture in VHDL',
      context: args,
      instructions: [
        '1. Create architecture declaration',
        '2. Define internal signals with types',
        '3. Implement synchronous processes with clock',
        '4. Implement combinational processes',
        '5. Use proper reset handling (sync/async)',
        '6. Apply numeric_std for arithmetic',
        '7. Implement state machines with enumeration',
        '8. Use generate statements for arrays',
        '9. Add descriptive comments',
        '10. Follow synthesis coding guidelines'
      ],
      outputFormat: 'JSON with architecture implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['architectureFilePath', 'processCount', 'artifacts'],
      properties: {
        architectureFilePath: { type: 'string' },
        processCount: { type: 'number' },
        signalCount: { type: 'number' },
        processes: { type: 'array', items: { type: 'object' } },
        concurrentStatements: { type: 'number' },
        stateMachines: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'vhdl', 'architecture', 'rtl']
}));

export const packageDevelopmentTask = defineTask('package-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Package Development - ${args.moduleName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent (VHDL)
    prompt: {
      role: 'VHDL Design Engineer',
      task: 'Develop VHDL packages for types and functions',
      context: args,
      instructions: [
        '1. Create package declaration',
        '2. Define custom types (records, enums)',
        '3. Define array types',
        '4. Declare functions and procedures',
        '5. Define constants',
        '6. Create package body',
        '7. Implement functions in package body',
        '8. Add type conversion functions',
        '9. Document package contents',
        '10. Ensure package is synthesizable'
      ],
      outputFormat: 'JSON with package details'
    },
    outputSchema: {
      type: 'object',
      required: ['packageFilePath', 'artifacts'],
      properties: {
        packageFilePath: { type: 'string' },
        packageBodyFilePath: { type: 'string' },
        customTypes: { type: 'array', items: { type: 'object' } },
        functions: { type: 'array', items: { type: 'object' } },
        procedures: { type: 'array', items: { type: 'object' } },
        constants: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'vhdl', 'package']
}));

export const componentDeclarationTask = defineTask('component-declaration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Component Declaration - ${args.moduleName}`,
  agent: {
    name: 'rtl-design-expert', // AG-001: RTL Design Expert Agent (VHDL)
    prompt: {
      role: 'VHDL Design Engineer',
      task: 'Create component declarations and instantiation templates',
      context: args,
      instructions: [
        '1. Create component declaration matching entity',
        '2. Include all generics and ports',
        '3. Create instantiation template',
        '4. Show generic map example',
        '5. Show port map example',
        '6. Document instantiation options',
        '7. Create direct entity instantiation example',
        '8. Add configuration declaration if needed',
        '9. Document binding options',
        '10. Create usage examples'
      ],
      outputFormat: 'JSON with component declaration'
    },
    outputSchema: {
      type: 'object',
      required: ['componentDeclaration', 'instantiationTemplate', 'artifacts'],
      properties: {
        componentDeclaration: { type: 'string' },
        instantiationTemplate: { type: 'string' },
        directInstantiation: { type: 'string' },
        configurationExample: { type: 'string' },
        usageExamples: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'vhdl', 'component']
}));

export const synthesisAttributesTask = defineTask('synthesis-attributes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Synthesis Attributes - ${args.moduleName}`,
  agent: {
    name: 'synthesis-expert', // AG-007: Synthesis Expert Agent
    prompt: {
      role: 'FPGA Design Engineer',
      task: 'Add synthesis attributes and pragmas',
      context: args,
      instructions: [
        '1. Add keep attributes for critical signals',
        '2. Add register replication attributes',
        '3. Configure FSM encoding attributes',
        '4. Add RAM inference attributes',
        '5. Add DSP inference attributes',
        '6. Configure I/O register attributes',
        '7. Add timing exception attributes',
        '8. Document attribute effects',
        '9. Verify vendor compatibility',
        '10. Test synthesis results'
      ],
      outputFormat: 'JSON with synthesis attributes'
    },
    outputSchema: {
      type: 'object',
      required: ['attributes', 'inferredResources', 'artifacts'],
      properties: {
        attributes: { type: 'array', items: { type: 'object' } },
        inferredResources: { type: 'object' },
        fsmEncoding: { type: 'string' },
        ramStyle: { type: 'string' },
        dspUsage: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'vhdl', 'synthesis']
}));

export const vhdlTestbenchTask = defineTask('vhdl-testbench', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Testbench Development - ${args.moduleName}`,
  agent: {
    name: 'verification-expert', // AG-003: Verification Expert Agent
    prompt: {
      role: 'VHDL Verification Engineer',
      task: 'Develop VHDL testbench for module verification',
      context: args,
      instructions: [
        '1. Create testbench entity (no ports)',
        '2. Instantiate DUT with component',
        '3. Generate clock signal',
        '4. Generate reset sequence',
        '5. Create stimulus process',
        '6. Implement response checking',
        '7. Add assertion statements',
        '8. Create multiple test scenarios',
        '9. Add simulation control (finish)',
        '10. Report test results'
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
        simulationTime: { type: 'string' },
        assertions: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fpga', 'vhdl', 'testbench', 'verification']
}));

export const vhdlCodeQualityTask = defineTask('vhdl-code-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Code Quality Check - ${args.moduleName}`,
  agent: {
    name: 'verification-expert', // AG-003: Verification Expert Agent (code quality)
    prompt: {
      role: 'VHDL Code Quality Reviewer',
      task: 'Check VHDL code quality and synthesis guidelines',
      context: args,
      instructions: [
        '1. Check IEEE library usage (numeric_std vs arith)',
        '2. Verify synchronous design practices',
        '3. Check reset handling correctness',
        '4. Verify clock domain assignments',
        '5. Check for inferred latches',
        '6. Verify complete sensitivity lists',
        '7. Check signal initialization',
        '8. Verify naming conventions',
        '9. Check documentation completeness',
        '10. Generate quality report'
      ],
      outputFormat: 'JSON with code quality results'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'warnings', 'recommendations', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        warningCount: { type: 'number' },
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
  labels: ['fpga', 'vhdl', 'code-quality']
}));
